<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Transaction;
use App\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Get all available roles
     */
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('min_deposit', 'asc')->get();

        return response()->json([
            'success' => true,
            'roles' => $roles,
        ], 200);
    }

    /**
     * Purchase a role
     */
    public function purchaseRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $role = Role::findOrFail($request->role_id);

        // Check if user already purchased this role
        if ($user->hasPurchasedRole($role->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You have already purchased this role.',
            ], 400);
        }

        // Check if user has sufficient balance
        if (!$user->canAffordRole($role)) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance. You need $' . number_format($role->min_deposit, 2) . ' to purchase this role.',
                'required_amount' => $role->min_deposit,
                'current_balance' => $user->balance,
                'shortage' => $role->min_deposit - $user->balance,
            ], 403);
        }

        DB::beginTransaction();

        try {
            // Create transaction record
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => Transaction::TYPE_ACCESS_PURCHASE,
                'amount' => -$role->min_deposit,
                'status' => Transaction::STATUS_COMPLETED,
                'transaction_id' => 'ROLE-' . strtoupper(uniqid()),
                'description' => "Выкуп роли: {$role->name}",
                'paid_at' => now(),
                'payable_type' => Role::class,
                'payable_id' => $role->id,
            ]);

            // Deduct balance
            $user->decrement('balance', $role->min_deposit);

            // Create user role record
            $userRole = UserRole::create([
                'user_id' => $user->id,
                'role_id' => $role->id,
                'purchase_price' => $role->min_deposit,
                'transaction_id' => $transaction->id,
                'purchased_at' => now(),
            ]);

            // Update user's current role_id to the newly purchased role
            $user->update(['role_id' => $role->id]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Role purchased successfully!',
                'user' => $user->fresh()->load('role'),
                'transaction' => $transaction,
                'user_role' => $userRole->load('role'),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to purchase role. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get user's purchased roles
     */
    public function myPurchasedRoles(Request $request): JsonResponse
    {
        $user = $request->user();

        $purchasedRoles = $user->purchasedRoles()
            ->with(['role', 'transaction'])
            ->orderBy('purchased_at', 'desc')
            ->get()
            ->map(function ($userRole) {
                return [
                    'id' => $userRole->id,
                    'role' => [
                        'id' => $userRole->role->id,
                        'name' => $userRole->role->name,
                        'min_deposit' => $userRole->role->min_deposit,
                    ],
                    'purchase_price' => $userRole->purchase_price,
                    'purchased_at' => $userRole->purchased_at,
                    'transaction' => $userRole->transaction ? [
                        'id' => $userRole->transaction->id,
                        'transaction_id' => $userRole->transaction->transaction_id,
                        'amount' => $userRole->transaction->amount,
                        'status' => $userRole->transaction->status,
                        'description' => $userRole->transaction->description,
                    ] : null,
                ];
            });

        $currentRole = $user->role;

        return response()->json([
            'success' => true,
            'current_role' => $currentRole ? [
                'id' => $currentRole->id,
                'name' => $currentRole->name,
                'min_deposit' => $currentRole->min_deposit,
                'users_count' => $currentRole->users_count,
            ] : null,
            'purchased_roles' => $purchasedRoles,
            'total_spent_on_roles' => $purchasedRoles->sum('purchase_price'),
            'total_roles_purchased' => $purchasedRoles->count(),
        ], 200);
    }

    /**
     * Switch to a previously purchased role
     */
    public function switchRole(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $roleId = $request->role_id;

        // Check if user has purchased this role
        if (!$user->hasPurchasedRole($roleId)) {
            return response()->json([
                'success' => false,
                'message' => 'You have not purchased this role. Please purchase it first.',
            ], 403);
        }

        // Switch to the role
        $user->update(['role_id' => $roleId]);

        return response()->json([
            'success' => true,
            'message' => 'Role switched successfully!',
            'user' => $user->fresh()->load('role'),
        ], 200);
    }

    /**
     * Get role statistics for user
     */
    public function roleStatistics(Request $request): JsonResponse
    {
        $user = $request->user();

        $allRoles = Role::orderBy('min_deposit', 'asc')->get();
        $purchasedRoleIds = $user->purchasedRoles()->pluck('role_id')->toArray();

        $rolesWithStatus = $allRoles->map(function ($role) use ($purchasedRoleIds, $user) {
            $isPurchased = in_array($role->id, $purchasedRoleIds);
            $isCurrent = $user->role_id === $role->id;
            $canAfford = $user->balance >= $role->min_deposit;

            return [
                'id' => $role->id,
                'name' => $role->name,
                'min_deposit' => $role->min_deposit,
                'users_count' => $role->users_count,
                'is_purchased' => $isPurchased,
                'is_current' => $isCurrent,
                'can_afford' => $canAfford,
                'shortage' => !$canAfford ? $role->min_deposit - $user->balance : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'roles' => $rolesWithStatus,
            'user_balance' => $user->balance,
            'current_role' => $user->role,
        ], 200);
    }
}