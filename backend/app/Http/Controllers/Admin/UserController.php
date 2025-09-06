<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $tab = $request->input('tab', 'all');
        $sortBy = $request->input('sort_by');
        $sortDirection = $request->input('sort_direction', 'asc');

        $query = User::with('role');

        // Apply tab filter
        if ($tab === 'users') {
            $query->where('is_admin', false);
        } elseif ($tab === 'admins') {
            $query->where('is_admin', true);
        }

        // Apply search
        $query->when($search, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telegram_id', 'like', "%{$search}%");
        });

        // Apply sorting
        if ($sortBy) {
            switch ($sortBy) {
                case 'role':
                    $query->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                          ->orderBy('roles.name', $sortDirection);
                    break;
                case 'balance':
                    $query->orderBy('balance', $sortDirection);
                    break;
                case 'banned':
                    $query->orderBy('banned', $sortDirection);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $sortDirection);
                    break;
                case 'name':
                    $query->orderBy('name', $sortDirection)
                          ->orderBy('email', $sortDirection);
                    break;
            }
        }

        $users = $query->paginate(10)->withQueryString();
        $roles = Role::all();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'tab', 'sort_by', 'sort_direction'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'role_id' => 'required|exists:roles,id',
            'is_admin' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        User::create($validated);

        return redirect()->route('admin.users.index')->with('success', 'User created successfully');
    }

    public function show(User $user)
    {
        $user->load('role', 'transactions', 'withdrawalRequests', 'sections');
        return Inertia::render('admin/users/show', ['user' => $user]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role_id' => 'required|exists:roles,id',
            'is_admin' => 'boolean',
        ]);

        $user->update($validated);
        return redirect()->route('admin.users.index')->with('success', 'User updated successfully');
    }

    public function updatePassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update([
            'password' => Hash::make($validated['password'])
        ]);

        return redirect()->route('admin.users.index')->with('success', 'Password updated successfully');
    }

    public function updateBalance(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:add,subtract'
        ]);

        $amount = $validated['amount'];
        if ($validated['type'] === 'subtract') {
            if ($user->balance < $amount) {
                return back()->with('error', 'Insufficient balance');
            }
            $user->decrement('balance', $amount);
            Transaction::create([
                'user_id' => $user->id,
                'amount' => -$amount,
                'status' => 'completed',
                'type' => 'admin_adjustment',
                'description' => 'Balance subtracted by admin! Admin ID: ' . $request->user()->id
            ]);
        } else {
            $user->increment('balance', $amount);
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'completed',
                'type' => 'admin_adjustment',
                'description' => 'Balance added by admin! Admin ID: ' . $request->user()->id
            ]);
        }

        return back()->with('success', 'Balance updated successfully');
    }

    public function ban(User $user)
    {
        $user->update(['banned' => true]);
        return redirect()->route('admin.users.index')->with('success', 'User banned successfully');
    }

    public function unban(User $user)
    {
        $user->update(['banned' => false]);
        return redirect()->route('admin.users.index')->with('success', 'User unbanned successfully');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully');
    }
}