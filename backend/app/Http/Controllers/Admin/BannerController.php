<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BannerController extends Controller
{
    /**
     * Display a listing of banners
     */
    public function index(Request $request): Response
    {
        $query = Banner::query();

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $banners = $query->ordered()->paginate(15);

        $stats = [
            'total' => Banner::count(),
            'active' => Banner::where('is_active', true)->count(),
            'inactive' => Banner::where('is_active', false)->count(),
            'scheduled' => Banner::where('is_active', true)
                ->where('starts_at', '>', now())
                ->count(),
        ];

        return Inertia::render('admin/banners/index', [
            'banners' => $banners,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new banner
     */
    public function create(): Response
    {
        return Inertia::render('admin/banners/create');
    }

    /**
     * Store a newly created banner
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'link' => 'nullable|url|max:500',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $validated['image'] = $path;
        }

        Banner::create($validated);

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner created successfully');
    }

    /**
     * Show the form for editing the specified banner
     */
    public function edit(Banner $banner): Response
    {
        return Inertia::render('admin/banners/edit', [
            'banner' => [
                'id' => $banner->id,
                'title' => $banner->title,
                'description' => $banner->description,
                'image' => $banner->image,
                'image_url' => $banner->image_url,
                'link' => $banner->link,
                'is_active' => $banner->is_active,
                'order' => $banner->order,
                'starts_at' => $banner->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $banner->ends_at?->format('Y-m-d\TH:i'),
            ]
        ]);
    }

    /**
     * Update the specified banner
     */
    public function update(Request $request, Banner $banner)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'link' => 'nullable|url|max:500',
            'is_active' => 'boolean',
            'order' => 'integer|min:0',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:starts_at',
        ]);

        // Agar yangi rasm bo‘lsa — eski rasmni o‘chir, yangisini yukla
        if ($request->hasFile('image')) {
            if ($banner->image) {
                Storage::disk('public')->delete($banner->image);
            }
            $validated['image'] = $request->file('image')->store('banner', 'public');
        } else {
            // Agar yangi rasm yo‘q bo‘lsa — eskisini saqlab qol
            $validated['image'] = $banner->image;
        }

        $banner->update($validated);

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner updated successfully');
    }


    /**
     * Toggle banner active status
     */
    public function toggleStatus(Banner $banner)
    {
        $banner->update([
            'is_active' => !$banner->is_active
        ]);

        return back()->with('success', 'Banner status updated successfully');
    }

    /**
     * Remove the specified banner
     */
    public function destroy(Banner $banner)
    {
        // Delete associated image
        if ($banner->image) {
            Storage::disk('public')->delete($banner->image);
        }

        $banner->delete();

        return redirect()->route('admin.banners.index')
            ->with('success', 'Banner deleted successfully');
    }

    /**
     * Bulk delete banners
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:banners,id'
        ]);

        $banners = Banner::whereIn('id', $request->ids)->get();
        
        foreach ($banners as $banner) {
            if ($banner->image) {
                Storage::disk('public')->delete($banner->image);
            }
            $banner->delete();
        }

        return back()->with('success', count($request->ids) . ' banners deleted successfully');
    }

    /**
     * Update banner order
     */
    public function updateOrder(Request $request)
    {
        $request->validate([
            'banners' => 'required|array',
            'banners.*.id' => 'required|exists:banners,id',
            'banners.*.order' => 'required|integer|min:0',
        ]);

        foreach ($request->banners as $bannerData) {
            Banner::where('id', $bannerData['id'])
                ->update(['order' => $bannerData['order']]);
        }

        return back()->with('success', 'Banner order updated successfully');
    }
}