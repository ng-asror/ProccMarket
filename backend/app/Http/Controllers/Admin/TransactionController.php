<?php

namespace App\Http\Controllers\Admin;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display the transaction history page for the authenticated user
     */
    public function index(Request $request, User $user): Response
    {        
        // Build the query for transactions
        $query = Transaction::with('user')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%");
            });
        }

        // Apply type filter
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Paginate results
        $transactions = $query->paginate(15);

        // Calculate statistics
        $stats = $this->calculateTransactionStats($user->id);

        return Inertia::render('admin/transactions/user-index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'balance' => $user->balance,
                'avatar' => $user->avatar,
            ],
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    /**
     * Display the admin transaction history page
     */
    public function adminIndex(Request $request): Response
    {
        // Build the query for all transactions
        $query = Transaction::with('user')
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('amount', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Apply user filter
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Apply type filter
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Paginate results
        $transactions = $query->paginate(20);

        // Calculate overall statistics
        $overallStats = $this->calculateOverallStats();

        return Inertia::render('admin/transactions/index', [
            'transactions' => $transactions,
            'stats' => $overallStats,
            'filters' => $request->only(['search', 'user_id', 'type', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show transaction details
     */
    public function show(Transaction $transaction): Response
    {
        $user = Auth::user();

        // Check if user can view this transaction
        if (!$user->is_admin && $transaction->user_id !== $user->id) {
            abort(403, 'Unauthorized to view this transaction');
        }

        $transaction->load('user', 'payable');

        return Inertia::render('admin/transactions/user-show', [
            'transaction' => $transaction
        ]);
    }

    /**
     * Update transaction status (Admin only)
     */
    public function updateStatus(Request $request, Transaction $transaction)
    {
        $request->validate([
            'status' => 'required|in:pending,completed,rejected',
            'description' => 'nullable|string|max:500',
        ]);

        $oldStatus = $transaction->status;
        $newStatus = $request->status;

        // Update transaction
        $transaction->update([
            'status' => $newStatus,
            'description' => $request->description ?? $transaction->description,
            'paid_at' => $newStatus === 'completed' ? now() : null,
        ]);

        // Handle balance adjustments
        if ($oldStatus !== $newStatus) {
            $user = $transaction->user;

            // If changing from pending to completed
            if ($oldStatus === 'pending' && $newStatus === 'completed') {
                if ($transaction->type === 'deposit' || 
                    ($transaction->type === 'admin_adjustment' && $transaction->amount > 0)) {
                    $user->increment('balance', $transaction->amount);
                } elseif ($transaction->type === 'withdrawal' || 
                         ($transaction->type === 'admin_adjustment' && $transaction->amount < 0)) {
                    $user->decrement('balance', abs($transaction->amount));
                }
            }
            
            // If changing from completed to rejected/pending
            elseif ($oldStatus === 'completed' && in_array($newStatus, ['rejected', 'pending'])) {
                if ($transaction->type === 'deposit' || 
                    ($transaction->type === 'admin_adjustment' && $transaction->amount > 0)) {
                    $user->decrement('balance', $transaction->amount);
                } elseif ($transaction->type === 'withdrawal' || 
                         ($transaction->type === 'admin_adjustment' && $transaction->amount < 0)) {
                    $user->increment('balance', abs($transaction->amount));
                }
            }
        }

        return back()->with('success', 'Transaction status updated successfully');
    }

    /**
     * Calculate transaction statistics for a specific user
     */
    private function calculateTransactionStats(int $userId): array
    {
        $deposits = Transaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->where(function ($query) {
                $query->where('type', 'deposit')
                      ->orWhere(function ($q) {
                          $q->where('type', 'admin_adjustment')
                            ->where('amount', '>', 0);
                      });
            })
            ->sum('amount');

        $withdrawals = Transaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->where(function ($query) {
                $query->where('type', 'withdrawal')
                      ->orWhere('type', 'access_purchase')
                      ->orWhere(function ($q) {
                          $q->where('type', 'admin_adjustment')
                            ->where('amount', '<', 0);
                      });
            })
            ->sum('amount');

        $pending = Transaction::where('user_id', $userId)
            ->where('status', 'pending')
            ->sum('amount');

        return [
            'totalDeposits' => abs($deposits),
            'totalWithdrawals' => abs($withdrawals),
            'pendingAmount' => abs($pending),
        ];
    }

    /**
     * Calculate overall transaction statistics (Admin)
     */
    private function calculateOverallStats(): array
    {
        $totalDeposits = Transaction::where('status', 'completed')
            ->where(function ($query) {
                $query->where('type', 'deposit')
                      ->orWhere(function ($q) {
                          $q->where('type', 'admin_adjustment')
                            ->where('amount', '>', 0);
                      });
            })
            ->sum('amount');

        $totalWithdrawals = Transaction::where('status', 'completed')
            ->where(function ($query) {
                $query->where('type', 'withdrawal')
                      ->orWhere('type', 'access_purchase')
                      ->orWhere(function ($q) {
                          $q->where('type', 'admin_adjustment')
                            ->where('amount', '<', 0);
                      });
            })
            ->sum('amount');

        $pendingTransactions = Transaction::where('status', 'pending')
            ->count();

        $totalTransactions = Transaction::count();

        $todayTransactions = Transaction::whereDate('created_at', today())
            ->count();

        return [
            'totalDeposits' => abs($totalDeposits),
            'totalWithdrawals' => abs($totalWithdrawals),
            'pendingTransactions' => $pendingTransactions,
            'totalTransactions' => $totalTransactions,
            'todayTransactions' => $todayTransactions,
        ];
    }

    /**
     * Export transactions to CSV (Admin only)
     */
    public function export(Request $request)
    {
        $query = Transaction::with('user')->orderBy('created_at', 'desc');

        // Apply same filters as index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                               ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $transactions = $query->get();

        $csvData = [];
        $csvData[] = ['ID', 'User', 'Email', 'Type', 'Amount', 'Status', 'Transaction ID', 'Description', 'Created At', 'Paid At'];

        foreach ($transactions as $transaction) {
            $csvData[] = [
                $transaction->id,
                $transaction->user->name ?? 'N/A',
                $transaction->user->email,
                $transaction->type,
                $transaction->amount,
                $transaction->status,
                $transaction->transaction_id ?? 'N/A',
                $transaction->description ?? 'N/A',
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->paid_at ? $transaction->paid_at->format('Y-m-d H:i:s') : 'N/A',
            ];
        }

        $filename = 'transactions_' . date('Y-m-d_H-i-s') . '.csv';

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
}