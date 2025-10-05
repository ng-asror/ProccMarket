<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Section::with(['parent', 'children'])
            ->withCount(['topics', 'users']);

        // Apply search
        $query->when($search, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        });

        // Get sections in tree structure
        $sections = Section::buildTree($query->get());

        // Get all roles for the form
        $roles = Role::withCount('users')->get(['id', 'name']);

        // Get all sections for parent select (excluding descendants)
        $allSections = Section::select('id', 'name', 'parent_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/sections/index', [
            'sections' => $sections,
            'allSections' => $allSections,
            'roles' => $roles,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'access_price' => 'required|numeric|min:0',
            'default_roles' => 'nullable|array',
            'default_roles.*' => 'exists:roles,id',
            'image' => 'nullable|file|mimes:svg|max:2048',
            'parent_id' => 'nullable|exists:sections,id',
        ]);

        // Handle image upload (SVG only)
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('sections', 'public');
        }

        // Set position as last in the parent group
        $validated['position'] = Section::where('parent_id', $validated['parent_id'] ?? null)->max('position') + 1;

        $section = Section::create($validated);

        return redirect()->route('admin.sections.index')->with('success', 'Section created successfully');
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sections', 'name')->ignore($section->id)
            ],
            'description' => 'nullable|string',
            'access_price' => 'required|numeric|min:0',
            'default_roles' => 'nullable|array',
            'default_roles.*' => 'exists:roles,id',
            'image' => 'nullable|file|mimes:svg|max:2048',
            'parent_id' => [
                'nullable',
                'exists:sections,id',
                function ($attribute, $value, $fail) use ($section) {
                    // Prevent setting itself as parent
                    if ($value == $section->id) {
                        $fail('A section cannot be its own parent.');
                    }
                    
                    // Prevent setting a descendant as parent
                    if ($value) {
                        $descendantIds = $this->getDescendantIds($section);
                        if (in_array($value, $descendantIds)) {
                            $fail('Cannot set a descendant section as parent.');
                        }
                    }
                },
            ],
        ]);

        if ($request->has('remove_image') && $request->remove_image == '1') {
            // Delete old image if exists
            if ($section->image) {
                Storage::disk('public')->delete($section->image);
            }
            $section->image = null;
        }

        // Handle image upload (SVG only)
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($section->image) {
                Storage::disk('public')->delete($section->image);
            }
            $validated['image'] = $request->file('image')->store('sections', 'public');
        }

        // Reset default_roles before updating
        $section->update(['default_roles' => []]);
        $section->update($validated);

        return redirect()->route('admin.sections.index')->with('success', 'Section updated successfully');
    }

    /**
     * Update positions of sections (drag and drop)
     */
    public function updatePositions(Request $request)
    {
        $validated = $request->validate([
            'sections' => 'required|array',
            'sections.*.id' => 'required|exists:sections,id',
            'sections.*.parent_id' => 'nullable|exists:sections,id',
            'sections.*.position' => 'required|integer|min:0',
        ]);

        foreach ($validated['sections'] as $sectionData) {
            $section = Section::find($sectionData['id']);
            
            // Validate parent relationship
            if (isset($sectionData['parent_id'])) {
                $descendantIds = $this->getDescendantIds($section);
                if (in_array($sectionData['parent_id'], $descendantIds)) {
                    continue; // Skip invalid parent assignments
                }
            }

            $section->update([
                'parent_id' => $sectionData['parent_id'] ?? null,
                'position' => $sectionData['position'],
            ]);
        }

        return redirect()->route('admin.sections.index')->with('success', 'Positions updated successfully');
    }

    /**
     * Get all descendant IDs of a section
     */
    private function getDescendantIds(Section $section): array
    {
        $descendants = [];
        
        foreach ($section->children as $child) {
            $descendants[] = $child->id;
            $descendants = array_merge($descendants, $this->getDescendantIds($child));
        }
        
        return $descendants;
    }

    public function destroy(Section $section)
    {
        // Check if section has topics
        $totalTopics = $section->topics()->count();
        
        // Also check topics in all descendants
        foreach ($section->descendants as $descendant) {
            $totalTopics += $descendant->topics()->count();
        }

        if ($totalTopics > 0) {
            return redirect()
                ->route('admin.sections.index')
                ->with('error', 'Cannot delete section with topics. This section and its subsections have ' . $totalTopics . ' topics. Please remove all topics first.');
        }

        // Delete image if exists
        if ($section->image) {
            Storage::disk('public')->delete($section->image);
        }

        // Delete section (children will be automatically deleted via model's boot method)
        $section->delete();

        return redirect()->route('admin.sections.index')->with('success', 'Section and all subsections deleted successfully');
    }

    /**
     * Search sections for parent selection
     */
    public function search(Request $request)
    {
        $query = $request->input('query');
        $excludeId = $request->input('exclude_id');

        $sections = Section::select('id', 'name', 'parent_id')
            ->when($query, function ($q, $query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->when($excludeId, function ($q, $excludeId) {
                $q->where('id', '!=', $excludeId);
            })
            ->orderBy('name')
            ->limit(20)
            ->get();

        return response()->json($sections);
    }
}