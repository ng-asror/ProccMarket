<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class WithdrawalController extends Controller
{
    /**
     * Get user's withdrawal requests
     */
    public function index(Request $request): JsonResponse
    {
        $withdrawals = $request->user()
            ->withdrawalRequests()
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    /**
     * Create a new withdrawal request
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if user has made a deposit at least 30 days ago
        if (!$user->last_deposit_at) {
            return response()->json([
                'success' => false,
                'message' => 'You must make at least one deposit before requesting withdrawal.',
            ], 403);
        }

        $daysSinceLastDeposit = $user->last_deposit_at->diffInDays(now());
        if ($daysSinceLastDeposit < 30) {
            $nextWithdrawalDate = $user->last_deposit_at->addDays(30);
            
            return response()->json([
                'success' => false,
                'message' => 'Withdrawal is only available 30 days after your last deposit.',
                'next_withdrawal_available_at' => $nextWithdrawalDate->format('Y-m-d H:i:s'),
                'days_remaining' => 30 - $daysSinceLastDeposit,
            ], 403);
        }

        // Check if user has a pending withdrawal request
        $pendingWithdrawal = $user->withdrawalRequests()
            ->where('status', 'pending')
            ->first();

        if ($pendingWithdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending withdrawal request. Please wait for it to be processed.',
                'pending_request' => $pendingWithdrawal,
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:1|max:' . $user->balance,
            'requisites' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if user has sufficient balance
        if ($request->amount > $user->balance) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance for withdrawal.',
                'current_balance' => $user->balance,
            ], 403);
        }

        // Create withdrawal request and temporarily reduce balance
        $withdrawal = WithdrawalRequest::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'requisites' => $request->requisites,
            'status' => 'pending',
        ]);

        // Temporarily reduce user balance (will be restored if rejected)
        $user->decrement('balance', $request->amount);

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request created successfully.',
            'data' => $withdrawal,
            'new_balance' => $user->fresh()->balance,
        ], 201);
    }

    /**
     * Get a specific withdrawal request
     */
    public function show(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        // Check if user owns this withdrawal request
        if ($withdrawal->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
        ]);
    }

    /**
     * Cancel a pending withdrawal request
     */
    public function cancel(Request $request, WithdrawalRequest $withdrawal): JsonResponse
    {
        // Check if user owns this withdrawal request
        if ($withdrawal->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        // Can only cancel pending requests
        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending withdrawal requests can be cancelled.',
            ], 403);
        }

        // Update status and restore balance
        $withdrawal->update([
            'status' => 'cancelled',
            'reason' => 'Cancelled by user',
        ]);

        $request->user()->increment('balance', $withdrawal->amount);

        return response()->json([
            'success' => true,
            'message' => 'Withdrawal request cancelled successfully.',
            'new_balance' => $request->user()->fresh()->balance,
        ]);
    }

    /**
     * Check withdrawal eligibility
     */
    public function checkEligibility(Request $request): JsonResponse
    {
        $user = $request->user();

        $response = [
            'success' => true,
            'eligible' => false,
            'current_balance' => $user->balance,
        ];

        // Check if user has made a deposit
        if (!$user->last_deposit_at) {
            $response['message'] = 'You must make at least one deposit before requesting withdrawal.';
            return response()->json($response);
        }

        // Check 30 days rule
        $daysSinceLastDeposit = $user->last_deposit_at->diffInDays(now());
        if ($daysSinceLastDeposit < 30) {
            $nextWithdrawalDate = $user->last_deposit_at->addDays(30);
            
            $response['message'] = 'Withdrawal is only available 30 days after your last deposit.';
            $response['next_withdrawal_available_at'] = $nextWithdrawalDate->format('Y-m-d H:i:s');
            $response['days_remaining'] = 30 - $daysSinceLastDeposit;
            return response()->json($response);
        }

        // Check for pending requests
        $pendingWithdrawal = $user->withdrawalRequests()
            ->where('status', 'pending')
            ->first();

        if ($pendingWithdrawal) {
            $response['message'] = 'You already have a pending withdrawal request.';
            $response['pending_request'] = $pendingWithdrawal;
            return response()->json($response);
        }

        // Check balance
        if ($user->balance <= 0) {
            $response['message'] = 'Insufficient balance for withdrawal.';
            return response()->json($response);
        }

        // All checks passed
        $response['eligible'] = true;
        $response['message'] = 'You are eligible for withdrawal.';
        
        return response()->json($response);
    }
}