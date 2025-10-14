<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderTransactionResource;
use App\Models\OrderTransaction;
use App\Models\Transaction;
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
        $query = OrderTransaction::query()
            ->with(['creator', 'executor', 'client', 'freelancer', 'cancelledBy', 'disputeRaisedBy', 'revisionRequestedBy', 'conversation']);

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by dispute status
        if ($request->boolean('disputes_only')) {
            $query->where('status', OrderTransaction::STATUS_DISPUTE);
        }

        // Filter by revisions
        if ($request->boolean('has_revisions')) {
            $query->where('revision_count', '>', 0);
        }

        // Search by title or creator/executor name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('creator', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('executor', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Sort by created_at descending by default
        $query->orderBy('created_at', 'desc');

        $transactions = $query->paginate(20);

        // Calculate statistics
        $stats = [
            'total' => OrderTransaction::count(),
            'active' => OrderTransaction::whereIn('status', [
                OrderTransaction::STATUS_PENDING,
                OrderTransaction::STATUS_ACCEPTED,
                OrderTransaction::STATUS_IN_PROGRESS,
                OrderTransaction::STATUS_DELIVERED,
            ])->count(),
            'disputes' => OrderTransaction::where('status', OrderTransaction::STATUS_DISPUTE)->count(),
            'completed' => OrderTransaction::whereIn('status', [
                OrderTransaction::STATUS_COMPLETED,
                OrderTransaction::STATUS_RELEASED,
            ])->count(),
            'with_revisions' => OrderTransaction::where('revision_count', '>', 0)->count(),
            'total_volume' => OrderTransaction::whereIn('status', [
                OrderTransaction::STATUS_COMPLETED,
                OrderTransaction::STATUS_RELEASED,
            ])->sum('amount'),
        ];

        return Inertia::render('admin/order-transactions/index', [
            'transactions' => OrderTransactionResource::collection($transactions)->resolve(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'filters' => [
                'status' => $request->status ?? 'all',
                'disputes_only' => $request->boolean('disputes_only'),
                'has_revisions' => $request->boolean('has_revisions'),
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
                'cancellation_requested' => OrderTransaction::STATUS_CANCELLATION_REQUESTED,
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Display a single transaction (Admin only)
     */
    public function show(Request $request, OrderTransaction $orderTransaction): Response
    {
        $orderTransaction->load([
            'creator',
            'executor',
            'client',
            'freelancer',
            'cancelledBy',
            'disputeRaisedBy',
            'cancellationRequestedBy',
            'revisionRequestedBy',
            'conversation.userOne',
            'conversation.userTwo',
            'message',
        ]);

        return Inertia::render('admin/order-transactions/show', [
            'transaction' => (new OrderTransactionResource($orderTransaction))->toArray($request),
        ]);
    }

    /**
     * Resolve a dispute (Admin only)
     * Award the funds to either creator (refund) or executor (release payment)
     */
    public function resolveDispute(Request $request, OrderTransaction $orderTransaction)
    {
        // Validate that transaction is in dispute status
        if ($orderTransaction->status !== OrderTransaction::STATUS_DISPUTE) {
            return back()->with('error', 'Transaction is not in dispute status');
        }

        $validated = $request->validate([
            'resolution' => ['required', 'in:refund,release'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            DB::transaction(function () use ($orderTransaction, $validated) {
                if ($validated['resolution'] === 'refund') {
                    // Refund to client
                    $orderTransaction->client->increment('balance', $orderTransaction->amount);

                    // Create refund transaction record
                    Transaction::create([
                        'user_id' => $orderTransaction->client_id,
                        'type' => 'refund',
                        'amount' => $orderTransaction->amount,
                        'status' => 'completed',
                        'payable_type' => OrderTransaction::class,
                        'payable_id' => $orderTransaction->id,
                        'description' => "Admin refund - Dispute resolved: {$orderTransaction->title}",
                        'paid_at' => now(),
                    ]);

                    $orderTransaction->update([
                        'status' => OrderTransaction::STATUS_REFUNDED,
                        'admin_note' => $validated['admin_note'] ?? 'Dispute resolved in favor of client',
                        'cancelled_at' => now(),
                    ]);
                } else {
                    // Release to freelancer
                    $orderTransaction->freelancer->increment('balance', $orderTransaction->amount);

                    // Create payment transaction record
                    Transaction::create([
                        'user_id' => $orderTransaction->freelancer_id,
                        'type' => 'earning',
                        'amount' => $orderTransaction->amount,
                        'status' => 'completed',
                        'payable_type' => OrderTransaction::class,
                        'payable_id' => $orderTransaction->id,
                        'description' => "Admin release - Dispute resolved: {$orderTransaction->title}",
                        'paid_at' => now(),
                    ]);

                    $orderTransaction->update([
                        'status' => OrderTransaction::STATUS_RELEASED,
                        'admin_note' => $validated['admin_note'] ?? 'Dispute resolved in favor of freelancer',
                        'released_at' => now(),
                    ]);
                }
            });

            return back()->with('success', 'Dispute resolved successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to resolve dispute: ' . $e->getMessage());
        }
    }

    /**
     * Force cancel a transaction (Admin only)
     */
    public function forceCancel(Request $request, OrderTransaction $orderTransaction)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        try {
            DB::transaction(function () use ($orderTransaction, $validated, $request) {
                // If funds were escrowed, refund them to client
                if (
                    in_array($orderTransaction->status, [
                        OrderTransaction::STATUS_ACCEPTED,
                        OrderTransaction::STATUS_IN_PROGRESS,
                        OrderTransaction::STATUS_DELIVERED,
                        OrderTransaction::STATUS_DISPUTE,
                    ])
                ) {
                    $orderTransaction->client->increment('balance', $orderTransaction->amount);

                    // Create refund transaction record
                    Transaction::create([
                        'user_id' => $orderTransaction->client_id,
                        'type' => 'refund',
                        'amount' => $orderTransaction->amount,
                        'status' => 'completed',
                        'payable_type' => OrderTransaction::class,
                        'payable_id' => $orderTransaction->id,
                        'description' => "Admin cancellation refund: {$orderTransaction->title}",
                        'paid_at' => now(),
                    ]);
                }

                $orderTransaction->update([
                    'status' => OrderTransaction::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                    'cancelled_by' => $request->user()->id,
                    'cancellation_reason' => 'Admin action: ' . $validated['reason'],
                ]);
            });

            return back()->with('success', 'Transaction cancelled successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel transaction: ' . $e->getMessage());
        }
    }

    /**
     * Force complete a transaction (Admin only)
     * Useful when users can't complete normally
     */
    public function forceComplete(Request $request, OrderTransaction $orderTransaction)
    {
        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            DB::transaction(function () use ($orderTransaction, $validated) {
                // Release payment to freelancer
                $orderTransaction->freelancer->increment('balance', $orderTransaction->amount);

                // Create payment transaction record
                Transaction::create([
                    'user_id' => $orderTransaction->freelancer_id,
                    'type' => 'earning',
                    'amount' => $orderTransaction->amount,
                    'status' => 'completed',
                    'payable_type' => OrderTransaction::class,
                    'payable_id' => $orderTransaction->id,
                    'description' => "Admin completion: {$orderTransaction->title}",
                    'paid_at' => now(),
                ]);

                $orderTransaction->update([
                    'status' => OrderTransaction::STATUS_RELEASED,
                    'admin_note' => $validated['admin_note'] ?? 'Completed by admin',
                    'completed_at' => now(),
                    'released_at' => now(),
                ]);
            });

            return back()->with('success', 'Transaction completed successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to complete transaction: ' . $e->getMessage());
        }
    }
}