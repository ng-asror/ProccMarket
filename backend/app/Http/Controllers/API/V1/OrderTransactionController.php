<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelOrderTransactionRequest;
use App\Http\Requests\CreateOrderTransactionRequest;
use App\Http\Requests\DisputeOrderTransactionRequest;
use App\Http\Requests\RevisionOrderTransactionRequest;
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

        if (!$user->is_admin && !$conversation->hasParticipant($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view transactions in this conversation',
            ], 403);
        }

        $transactions = OrderTransaction::query()
            ->where('conversation_id', $conversation->id)
            ->with(['creator', 'executor', 'client', 'freelancer', 'cancelledBy', 'cancellationRequestedBy', 'disputeRaisedBy'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
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
        if (!$conversation->hasParticipant($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not part of this conversation',
            ], 403);
        }

        // Get the other participant
        $otherParticipant = $conversation->getOtherParticipant($user->id);

        // Determine who is client and who is freelancer based on 'is_client_order' flag
        // If is_client_order = true: creator is client, executor is freelancer
        // If is_client_order = false: creator is freelancer, executor is client
        $isClientOrder = $validated['is_client_order'] ?? true;

        if ($isClientOrder) {
            // Client creates order, freelancer executes
            $clientId = $user->id;
            $freelancerId = $otherParticipant->id;
        } else {
            // Freelancer creates order, client needs to accept
            $clientId = $otherParticipant->id;
            $freelancerId = $user->id;
        }

        try {
            $orderTransaction = DB::transaction(function () use ($validated, $user, $conversation, $clientId, $freelancerId, $otherParticipant) {
                // Create the order transaction
                $orderTransaction = OrderTransaction::create([
                    'conversation_id' => $validated['conversation_id'],
                    'creator_id' => $user->id,
                    'executor_id' => $otherParticipant->id,
                    'client_id' => $clientId,
                    'freelancer_id' => $freelancerId,
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
                    'content' => "Созданный заказ: {$validated['title']}",
                ]);

                // Update the order with the message ID
                $orderTransaction->update(['message_id' => $message->id]);

                // Update conversation's last_message_at
                $conversation->update(['last_message_at' => now()]);

                return $orderTransaction;
            });

            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'message']);

            // Broadcast message sent event
            broadcast(new \App\Events\MessageSent($orderTransaction->message));

            return response()->json([
                'success' => true,
                'message' => 'Order transaction created successfully',
                'data' => new OrderTransactionResource($orderTransaction),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
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

        if (!$user->is_admin && !$orderTransaction->conversation->hasParticipant($user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to view this transaction',
            ], 403);
        }

        $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'cancelledBy', 'cancellationRequestedBy', 'disputeRaisedBy', 'message']);

        return response()->json([
            'success' => true,
            'data' => new OrderTransactionResource($orderTransaction),
        ]);
    }

    /**
     * Accept an order (non-creator accepts and funds are escrowed)
     */
    public function accept(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'accept')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot accept this order',
            ], 403);
        }

        try {
            if ($orderTransaction->accept()) {
                $orderTransaction->load(['creator', 'executor', 'client', 'freelancer']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order accepted successfully. Funds have been escrowed.',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept order',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Deliver work (freelancer only)
     */
    public function deliver(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'deliver')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot deliver this order',
            ], 403);
        }

        if ($orderTransaction->deliver()) {
            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer']);

            return response()->json([
                'success' => true,
                'message' => 'Work marked as delivered',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to mark work as delivered',
        ], 422);
    }

    /**
     * Mark order as completed and release payment (client only)
     */
    public function complete(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'complete')) {
            return response()->json([
                'success' => false,
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

            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer']);

            return response()->json([
                'success' => true,
                'message' => 'Order completed and payment released',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel order (only for pending orders)
     */
    public function cancel(CancelOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'cancel')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot cancel this order',
            ], 403);
        }

        try {
            $validated = $request->validated();

            if ($orderTransaction->cancel($user->id, $validated['reason'] ?? null)) {
                $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'cancelledBy']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order cancelled successfully',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Request cancellation (for accepted orders)
     */
    public function requestCancellation(CancelOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'request_cancellation')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot request cancellation for this order',
            ], 403);
        }

        $validated = $request->validated();

        if ($orderTransaction->requestCancellation($user->id, $validated['reason'] ?? null)) {
            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'cancellationRequestedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Cancellation request sent. Waiting for other party approval.',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to request cancellation',
        ], 422);
    }

    /**
     * Approve cancellation request
     */
    public function approveCancellation(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'approve_cancellation')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot approve this cancellation request',
            ], 403);
        }

        try {
            if ($orderTransaction->approveCancellation($user->id)) {
                $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'cancelledBy', 'cancellationRequestedBy']);

                return response()->json([
                    'success' => true,
                    'message' => 'Cancellation approved. Order has been cancelled and funds refunded.',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve cancellation',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve cancellation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject cancellation request
     */
    public function rejectCancellation(Request $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'reject_cancellation')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot reject this cancellation request',
            ], 403);
        }

        if ($orderTransaction->rejectCancellation()) {
            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer']);

            return response()->json([
                'success' => true,
                'message' => 'Cancellation request rejected. Order continues.',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to reject cancellation',
        ], 422);
    }

    /**
     * Raise a dispute
     */
    public function dispute(DisputeOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'dispute')) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot raise a dispute for this order',
            ], 403);
        }

        $validated = $request->validated();

        if ($orderTransaction->raiseDispute($user->id, $validated['reason'])) {
            $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'disputeRaisedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Dispute raised successfully. An admin will review your case.',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Failed to raise dispute',
        ], 422);
    }


    public function requestRevision(RevisionOrderTransactionRequest $request, OrderTransaction $orderTransaction): JsonResponse
    {
        $user = $request->user();

        if (!$orderTransaction->canUserPerformAction($user->id, 'request_revision')) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не можете отправить эту работу на доработку.',
            ], 403);
        }

        try {
            $validated = $request->validated();

            if ($orderTransaction->requestRevision($user->id, $validated['reason'] ?? null)) {
                $orderTransaction->load(['creator', 'executor', 'client', 'freelancer', 'revisionRequestedBy']);

                return response()->json([
                    'success' => true,
                    'message' => 'The work was sent for revision. Freelancer needs to change.',
                    'data' => new OrderTransactionResource($orderTransaction),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Couldn\'t send for processing',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}