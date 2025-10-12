<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelOrderTransactionRequest;
use App\Http\Requests\CreateOrderTransactionRequest;
use App\Http\Requests\DisputeOrderTransactionRequest;
use App\Http\Resources\OrderTransactionResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\OrderTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderTransactionController extends Controller
{
    /**
     * Get transactions for a conversation
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        // Check authorization
        if (! $user->is_admin && ! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to view transactions in this conversation',
            ], 403);
        }

        $transactions = OrderTransaction::query()
            ->where('conversation_id', $conversation->id)
            ->with(['creator', 'executor', 'cancelledBy', 'disputeRaisedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'data' => OrderTransactionResource::collection($transactions),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Create a new order transaction
     */
    public function store(CreateOrderTransactionRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Verify user is part of the conversation
        $conversation = Conversation::findOrFail($validated['conversation_id']);
        if (! $conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'You are not part of this conversation',
            ], 403);
        }

        // Verify executor is the other participant
        $otherParticipant = $conversation->getOtherParticipant($user->id);
        if ($otherParticipant->id !== $validated['executor_id']) {
            return response()->json([
                'message' => 'Executor must be the other participant in the conversation',
            ], 422);
        }

        try {
            $orderTransaction = DB::transaction(function () use ($validated, $user, $conversation) {
                // Create the order transaction
                $orderTransaction = OrderTransaction::create([
                    'conversation_id' => $validated['conversation_id'],
                    'creator_id' => $user->id,
                    'executor_id' => $validated['executor_id'],
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'amount' => $validated['amount'],
                    'deadline' => $validated['deadline'] ?? null,
                    'status' => OrderTransaction::STATUS_PENDING,
                ]);

                // Create a message in the chat with the transaction
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $user->id,
                    'content' => "Created order: {$validated['title']}",
                ]);

                // Update the order with the message ID
                $orderTransaction->update(['message_id' => $message->id]);

                // Update conversation's last_message_at
                $conversation->update(['last_message_at' => now()]);

                return $orderTransaction;
            });

            $orderTransaction->load(['creator', 'executor', 'message']);

            // Broadcast message sent event
            broadcast(new \App\Events\MessageSent($orderTransaction->message));

            return response()->json([
                'message' => 'Order transaction created successfully',
                'data' => new OrderTransactionResource($orderTransaction),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create order transaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single order transaction
     */
    public function show(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        // Check authorization
        if (! $user->is_admin && ! $orderTransaction->conversation->hasParticipant($user->id)) {
            return response()->json([
                'message' => 'Unauthorized to view this transaction',
            ], 403);
        }

        $orderTransaction->load(['creator', 'executor', 'cancelledBy', 'disputeRaisedBy', 'message']);

        return response()->json([
            'data' => new OrderTransactionResource($orderTransaction),
        ]);
    }

    /**
     * Accept an order (executor only)
     */
    public function accept(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (! $orderTransaction->canUserPerformAction($user->id, 'accept')) {
            return response()->json([
                'message' => 'You cannot accept this order',
            ], 403);
        }

        try {
            if ($orderTransaction->accept()) {
                $orderTransaction->load(['creator', 'executor']);

                return response()->json([
                    'message' => 'Order accepted successfully. Funds have been escrowed.',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'message' => 'Failed to accept order',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to accept order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deliver work (executor only)
     */
    public function deliver(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (! $orderTransaction->canUserPerformAction($user->id, 'deliver')) {
            return response()->json([
                'message' => 'You cannot deliver this order',
            ], 403);
        }

        if ($orderTransaction->deliver()) {
            $orderTransaction->load(['creator', 'executor']);

            return response()->json([
                'message' => 'Work marked as delivered',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'message' => 'Failed to mark work as delivered',
        ], 422);
    }

    /**
     * Mark order as completed and release payment (creator only)
     */
    public function complete(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (! $orderTransaction->canUserPerformAction($user->id, 'complete')) {
            return response()->json([
                'message' => 'You cannot complete this order',
            ], 403);
        }

        try {
            DB::transaction(function () use ($orderTransaction) {
                // Mark as completed
                $orderTransaction->markCompleted();
                // Release payment
                $orderTransaction->releasePayment();
            });

            $orderTransaction->load(['creator', 'executor']);

            return response()->json([
                'message' => 'Order completed and payment released',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to complete order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel order (creator or executor)
     */
    public function cancel(CancelOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (! $orderTransaction->canUserPerformAction($user->id, 'cancel')) {
            return response()->json([
                'message' => 'You cannot cancel this order',
            ], 403);
        }

        try {
            $validated = $request->validated();

            if ($orderTransaction->cancel($user->id, $validated['reason'] ?? null)) {
                $orderTransaction->load(['creator', 'executor', 'cancelledBy']);

                return response()->json([
                    'message' => 'Order cancelled successfully',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'message' => 'Failed to cancel order',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Raise a dispute
     */
    public function dispute(DisputeOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (! $orderTransaction->canUserPerformAction($user->id, 'dispute')) {
            return response()->json([
                'message' => 'You cannot raise a dispute for this order',
            ], 403);
        }

        $validated = $request->validated();

        if ($orderTransaction->raiseDispute($user->id, $validated['reason'])) {
            $orderTransaction->load(['creator', 'executor', 'disputeRaisedBy']);

            return response()->json([
                'message' => 'Dispute raised successfully. An admin will review your case.',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'message' => 'Failed to raise dispute',
        ], 422);
    }
}
