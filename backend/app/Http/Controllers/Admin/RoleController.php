<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortBy = $request->input('sort_by');
        $sortDirection = $request->input('sort_direction', 'asc');

        $query = Role::query();

        // Apply search
        $query->when($search, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%");
        });

        // Apply sorting
        if ($sortBy) {
            switch ($sortBy) {
                case 'name':
                    $query->orderBy('name', $sortDirection);
                    break;
                case 'min_deposit':
                    $query->orderBy('min_deposit', $sortDirection);
                    break;
            }
        }

        $roles = $query->paginate(perPage: 10)->withQueryString();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'filters' => $request->only(['search', 'sort_by', 'sort_direction'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'min_deposit' => 'required|numeric|min:0',
        ]);

        Role::create($validated);

        return redirect()->route('admin.roles.index')->with('success', 'Role created successfully');
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'min_deposit' => 'required|numeric|min:0',
        ]);

        $role->update($validated);

        return redirect()->route('admin.roles.index')->with('success', 'Role updated successfully');
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return redirect()->route('admin.roles.index')->with('error', 'Cannot delete role with associated users');
        }

        $role->delete();

        return redirect()->route('admin.roles.index')->with('success', 'Role deleted successfully');
    }
}