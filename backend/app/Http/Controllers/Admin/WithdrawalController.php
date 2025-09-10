<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WithdrawalController extends Controller
{
    /**
     * Display all withdrawal requests for admin
     */
    public function index(Request $request): Response
    {
        // Build the query
        $query = WithdrawalRequest::with('user')
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%")
                  ->orWhere('requisites', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply user filter
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $withdrawals = $query->paginate(20);

        // Calculate statistics
        $stats = $this->calculateStats();

        return Inertia::render('admin/withdrawals/index', [
            'withdrawals' => $withdrawals,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'user_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show specific withdrawal request details
     */
    public function show(WithdrawalRequest $withdrawal): Response
    {
        $withdrawal->load(['user', 'user.transactions' => function($query) {
            $query->orderBy('created_at', 'desc')->limit(10);
        }]);

        return Inertia::render('admin/withdrawals/show', [
            'withdrawal' => $withdrawal,
        ]);
    }

    /**
     * Approve withdrawal request
     */
    public function approve(Request $request, WithdrawalRequest $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return back()->withErrors(['message' => 'Only pending withdrawal requests can be approved.']);
        }

        $request->validate([
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($withdrawal, $request) {
            // Update withdrawal request status
            $withdrawal->update([
                'status' => 'approved',
                'reason' => $request->notes,
                'processed_at' => now(),
            ]);

            // Create a transaction record for the withdrawal
            Transaction::create([
                'user_id' => $withdrawal->user_id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => -$withdrawal->amount, // Negative amount for withdrawal
                'status' => Transaction::STATUS_COMPLETED,
                'transaction_id' => $request->transaction_id,
                'description' => 'Withdrawal request #' . $withdrawal->id . ($request->notes ? ' - ' . $request->notes : ''),
                'paid_at' => now(),
                'payable_type' => WithdrawalRequest::class,
                'payable_id' => $withdrawal->id,
            ]);
        });

        return back()->with('success', 'Withdrawal request approved successfully.');
    }

    /**
     * Reject withdrawal request
     */
    public function reject(Request $request, WithdrawalRequest $withdrawal)
    {
        if ($withdrawal->status !== 'pending') {
            return back()->withErrors(['message' => 'Only pending withdrawal requests can be rejected.']);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($withdrawal, $request) {
            // Update withdrawal request status
            $withdrawal->update([
                'status' => 'rejected',
                'reason' => $request->reason,
                'processed_at' => now(),
            ]);

            // Restore user balance
            $withdrawal->user->increment('balance', $withdrawal->amount);

            // Create a transaction record for the balance restoration
            Transaction::create([
                'user_id' => $withdrawal->user_id,
                'type' => Transaction::TYPE_ADMIN_ADJUSTMENT,
                'amount' => $withdrawal->amount, // Positive amount for balance restoration
                'status' => Transaction::STATUS_COMPLETED,
                'transaction_id' => null,
                'description' => 'Balance restoration for rejected withdrawal request #' . $withdrawal->id,
                'paid_at' => now(),
                'payable_type' => WithdrawalRequest::class,
                'payable_id' => $withdrawal->id,
            ]);
        });

        return back()->with('success', 'Withdrawal request rejected and balance restored.');
    }

    /**
     * Export withdrawal requests to CSV
     */
    public function export(Request $request)
    {
        $query = WithdrawalRequest::with('user')->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $withdrawals = $query->get();

        $csvData = [];
        $csvData[] = ['ID', 'User', 'Email', 'Amount', 'Status', 'Requisites', 'Reason', 'Created At', 'Processed At'];

        foreach ($withdrawals as $withdrawal) {
            $csvData[] = [
                $withdrawal->id,
                $withdrawal->user->name ?? 'N/A',
                $withdrawal->user->email,
                $withdrawal->amount,
                $withdrawal->status,
                $withdrawal->requisites,
                $withdrawal->reason ?? 'N/A',
                $withdrawal->created_at->format('Y-m-d H:i:s'),
                $withdrawal->processed_at ? $withdrawal->processed_at->format('Y-m-d H:i:s') : 'N/A',
            ];
        }

        $filename = 'withdrawal_requests_' . date('Y-m-d_H-i-s') . '.csv';

        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }

    /**
     * Calculate withdrawal statistics
     */
    private function calculateStats(): array
    {
        $totalPending = WithdrawalRequest::where('status', 'pending')->sum('amount');
        $totalApproved = WithdrawalRequest::where('status', 'approved')->sum('amount');
        $totalRejected = WithdrawalRequest::where('status', 'rejected')->sum('amount');
        
        $pendingCount = WithdrawalRequest::where('status', 'pending')->count();
        $approvedCount = WithdrawalRequest::where('status', 'approved')->count();
        $rejectedCount = WithdrawalRequest::where('status', 'rejected')->count();
        
        $todayRequests = WithdrawalRequest::whereDate('created_at', today())->count();

        return [
            'totalPending' => $totalPending,
            'totalApproved' => $totalApproved,
            'totalRejected' => $totalRejected,
            'pendingCount' => $pendingCount,
            'approvedCount' => $approvedCount,
            'rejectedCount' => $rejectedCount,
            'todayRequests' => $todayRequests,
        ];
    }
}