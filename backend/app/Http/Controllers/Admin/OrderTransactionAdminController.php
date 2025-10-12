<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderTransactionResource;
use App\Models\OrderTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderTransactionAdminController extends Controller
{
    /**
     * Display a listing of all transactions (Admin only)
     */
    public function index(Request $request): Response
    {
        // Authorization check
        if (! $request->user()->is_admin) {
            abort(403, 'Unauthorized - Admin access required');
        }

        $query = OrderTransaction::query()
            ->with(['creator', 'executor', 'cancelledBy', 'disputeRaisedBy', 'conversation']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by dispute status
        if ($request->boolean('disputes_only')) {
            $query->where('status', OrderTransaction::STATUS_DISPUTE);
        }

        // Search by title or creator/executor name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('creator', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('executor', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort by created_at descending by default
        $query->orderBy('created_at', 'desc');

        $transactions = $query->paginate(20);

        return Inertia::render('admin/order-transactions/index', [
            'transactions' => OrderTransactionResource::collection($transactions),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'filters' => [
                'status' => $request->status ?? 'all',
                'disputes_only' => $request->boolean('disputes_only'),
                'search' => $request->search ?? '',
            ],
            'statuses' => [
                'pending' => OrderTransaction::STATUS_PENDING,
                'accepted' => OrderTransaction::STATUS_ACCEPTED,
                'in_progress' => OrderTransaction::STATUS_IN_PROGRESS,
                'delivered' => OrderTransaction::STATUS_DELIVERED,
                'completed' => OrderTransaction::STATUS_COMPLETED,
                'dispute' => OrderTransaction::STATUS_DISPUTE,
                'cancelled' => OrderTransaction::STATUS_CANCELLED,
                'refunded' => OrderTransaction::STATUS_REFUNDED,
                'released' => OrderTransaction::STATUS_RELEASED,
            ],
        ]);
    }

    /**
     * Display a single transaction (Admin only)
     */
    public function show(Request $request, OrderTransaction $orderTransaction): Response
    {
        // Authorization check
        if (! $request->user()->is_admin) {
            abort(403, 'Unauthorized - Admin access required');
        }

        $orderTransaction->load([
            'creator',
            'executor',
            'cancelledBy',
            'disputeRaisedBy',
            'conversation.userOne',
            'conversation.userTwo',
            'message',
        ]);

        return Inertia::render('admin/order-transactions/show', [
            'transaction' => new OrderTransactionResource($orderTransaction),
        ]);
    }

    /**
     * Resolve a dispute (Admin only)
     * Award the funds to either creator (refund) or executor (release payment)
     */
    public function resolveDispute(Request $request, OrderTransaction $orderTransaction)
    {
        // Authorization check
        if (! $request->user()->is_admin) {
            return response()->json([
                'message' => 'Unauthorized - Admin access required',
            ], 403);
        }

        // Validate that transaction is in dispute status
        if ($orderTransaction->status !== OrderTransaction::STATUS_DISPUTE) {
            return response()->json([
                'message' => 'Transaction is not in dispute status',
            ], 422);
        }

        $validated = $request->validate([
            'resolution' => ['required', 'in:refund,release'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            DB::transaction(function () use ($orderTransaction, $validated) {
                if ($validated['resolution'] === 'refund') {
                    // Refund to creator
                    $orderTransaction->creator->increment('balance', $orderTransaction->amount);
                    $orderTransaction->update([
                        'status' => OrderTransaction::STATUS_REFUNDED,
                        'admin_note' => $validated['admin_note'] ?? 'Dispute resolved in favor of creator',
                    ]);
                } else {
                    // Release to executor
                    $orderTransaction->executor->increment('balance', $orderTransaction->amount);
                    $orderTransaction->update([
                        'status' => OrderTransaction::STATUS_RELEASED,
                        'admin_note' => $validated['admin_note'] ?? 'Dispute resolved in favor of executor',
                        'released_at' => now(),
                    ]);
                }
            });

            $orderTransaction->load(['creator', 'executor']);

            return response()->json([
                'message' => 'Dispute resolved successfully',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to resolve dispute',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Force cancel a transaction (Admin only)
     */
    public function forceCancel(Request $request, OrderTransaction $orderTransaction)
    {
        // Authorization check
        if (! $request->user()->is_admin) {
            return response()->json([
                'message' => 'Unauthorized - Admin access required',
            ], 403);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        try {
            DB::transaction(function () use ($orderTransaction, $validated, $request) {
                // If funds were escrowed, refund them
                if (in_array($orderTransaction->status, [
                    OrderTransaction::STATUS_ACCEPTED,
                    OrderTransaction::STATUS_IN_PROGRESS,
                    OrderTransaction::STATUS_DELIVERED,
                ])) {
                    $orderTransaction->creator->increment('balance', $orderTransaction->amount);
                }

                $orderTransaction->update([
                    'status' => OrderTransaction::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                    'cancelled_by' => $request->user()->id,
                    'cancellation_reason' => 'Admin action: '.$validated['reason'],
                ]);
            });

            $orderTransaction->load(['creator', 'executor', 'cancelledBy']);

            return response()->json([
                'message' => 'Transaction cancelled successfully',
                'data' => new OrderTransactionResource($orderTransaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel transaction',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
