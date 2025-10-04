<?php

namespace App\Http\Controllers\API\V1;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class TransactionApiController extends Controller
{
    /**
     * Get user's transactions with filters
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Build query
        $query = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Apply date range filter
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Apply type filter
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $transactions = $query->paginate($perPage);

        // Calculate stats
        $stats = $this->calculateStats($user->id, $request);

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions->items(),
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                    'from' => $transactions->firstItem(),
                    'to' => $transactions->lastItem(),
                ],
                'stats' => $stats,
            ],
        ]);
    }

    /**
     * Export transactions to CSV
     */
    public function export(Request $request)
    {
        $user = Auth::user();

        // Build query with same filters
        $query = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $transactions = $query->get();

        // Prepare CSV data
        $csvData = [];
        $csvData[] = ['Date', 'Transaction ID', 'Type', 'Amount', 'Status', 'Description'];

        foreach ($transactions as $transaction) {
            $csvData[] = [
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->transaction_id ?? 'N/A',
                $transaction->getTypeLabel(),
                $transaction->formatted_amount,
                $transaction->getStatusLabel(),
                $transaction->description ?? 'N/A',
            ];
        }

        $filename = 'transactions_' . $user->id . '_' . date('Y-m-d_His') . '.csv';

        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$filename}",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Get transaction details
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $user = Auth::user();

        // Check authorization
        if ($transaction->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction->load('payable'),
        ]);
    }

    /**
     * Calculate transaction statistics
     */
    private function calculateStats(int $userId, Request $request): array
    {
        $query = Transaction::where('user_id', $userId)
            ->where('status', Transaction::STATUS_COMPLETED);

        // Apply same date filters
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Clone query for different calculations
        $depositsQuery = clone $query;
        $withdrawalsQuery = clone $query;

        $deposits = $depositsQuery->where(function ($q) {
            $q->where('type', Transaction::TYPE_DEPOSIT)
              ->orWhere(function ($subQ) {
                  $subQ->where('type', Transaction::TYPE_ADMIN_ADJUSTMENT)
                       ->where('amount', '>', 0);
              });
        })->sum('amount');

        $withdrawals = $withdrawalsQuery->where(function ($q) {
            $q->where('type', Transaction::TYPE_WITHDRAWAL)
              ->orWhere('type', Transaction::TYPE_ACCESS_PURCHASE)
              ->orWhere(function ($subQ) {
                  $subQ->where('type', Transaction::TYPE_ADMIN_ADJUSTMENT)
                       ->where('amount', '<', 0);
              });
        })->sum('amount');

        // Pending amount
        $pendingQuery = Transaction::where('user_id', $userId)
            ->where('status', Transaction::STATUS_PENDING);

        if ($request->filled('start_date')) {
            $pendingQuery->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $pendingQuery->whereDate('created_at', '<=', $request->end_date);
        }

        $pending = $pendingQuery->sum('amount');

        return [
            'total_deposits' => number_format(abs($deposits), 2),
            'total_withdrawals' => number_format(abs($withdrawals), 2),
            'pending_amount' => number_format(abs($pending), 2),
            'net_balance' => number_format(abs($deposits) - abs($withdrawals), 2),
        ];
    }
}