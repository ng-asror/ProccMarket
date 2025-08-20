<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortBy = $request->input('sort_by');
        $sortDirection = $request->input('sort_direction', 'asc');

        $query = Section::withCount(['topics', 'users']);

        // Apply search
        $query->when($search, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        });

        // Apply sorting
        if ($sortBy) {
            switch ($sortBy) {
                case 'name':
                    $query->orderBy('name', $sortDirection);
                    break;
                case 'access_price':
                    $query->orderBy('access_price', $sortDirection);
                    break;
                case 'topics_count':
                    $query->orderBy('topics_count', $sortDirection);
                    break;
                case 'users_count':
                    $query->orderBy('users_count', $sortDirection);
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $sections = $query->paginate(perPage: 10)->withQueryString();

        // Get all roles for the form
        $roles = Role::all(['id', 'name']);

        return Inertia::render('admin/sections/index', [
            'sections' => $sections,
            'roles' => $roles,
            'filters' => $request->only(['search', 'sort_by', 'sort_direction'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sections,name',
            'description' => 'nullable|string',
            'access_price' => 'required|numeric|min:0',
            'default_roles' => 'nullable|array',
            'default_roles.*' => 'exists:roles,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('sections', 'public');
        }

        $section = Section::create($validated);

        return redirect()->route('admin.sections.index')->with('success', 'Section created successfully');
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:sections,name,' . $section->id,
            'description' => 'nullable|string',
            'access_price' => 'required|numeric|min:0',
            'default_roles' => 'nullable|array',
            'default_roles.*' => 'exists:roles,id',
            'image' => 'nullable|image|max:2048',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($section->image) {
                Storage::disk('public')->delete($section->image);
            }
            $validated['image'] = $request->file('image')->store('sections', 'public');
        }

        $section->update([
            'default_roles' => []
        ]);

        $section->update($validated);

        return redirect()->route('admin.sections.index')->with('success', 'Section updated successfully');
    }

    public function destroy(Section $section)
    {
        // Check if section has topics
        if ($section->topics()->count() > 0) {
            return redirect()->route('admin.sections.index')->with('error', 'Cannot delete section with topics. Please remove all topics first.');
        }

        // Delete image if exists
        if ($section->image) {
            Storage::disk('public')->delete($section->image);
        }

        $section->delete();

        return redirect()->route('admin.sections.index')->with('success', 'Section deleted successfully');
    }
}