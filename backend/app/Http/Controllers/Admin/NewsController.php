<?php

namespace App\Http\Controllers\Admin;

use App\Models\News;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class NewsController extends Controller
{
    public function index(Request $request)
    {
        $categoryId = $request->query('category');
        $search = $request->query('search');
        $status = $request->query('status');
        
        $categories = Category::withCount('news')->get();

        $newsQuery = News::with(['user', 'category'])
            ->withCount(['comments', 'likes', 'views', 'shares']);

        if ($categoryId) {
            $newsQuery->where('category_id', (int)$categoryId);
        }

        if ($search) {
            $newsQuery->where(function ($query) use ($search) {
                $query->where('title', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($status && in_array($status, ['draft', 'published'])) {
            $newsQuery->where('status', $status);
        }

        $news = $newsQuery->latest()->paginate(9);

        return Inertia::render('admin/news/index', [
            'categories' => $categories,
            'news' => $news,
            'selectedCategory' => $categoryId ? (int)$categoryId : null,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create()
    {
        $categories = Category::all();

        return Inertia::render('admin/news/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|max:2048',
            'status' => 'required|in:draft,published',
        ]);

        $validated['user_id'] = auth()->id();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('news', 'public');
        }

        News::create($validated);

        return redirect()->route('news.index')->with('success', 'News created successfully!');
    }

    public function edit(News $news)
    {
        $categories = Category::all();

        return Inertia::render('admin/news/edit', [
            'news' => $news->load('category'),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, News $news)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'image' => 'nullable|image|max:2048',
            'status' => 'required|in:draft,published',
        ]);

        // MUHIM: Faqat yangi rasm yuklanganda eski rasmni o'chirish
        if ($request->hasFile('image')) {
            // Eski rasmni o'chirish
            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }
            // Yangi rasmni saqlash
            $validated['image'] = $request->file('image')->store('news', 'public');
        } else {
            // Agar yangi rasm yuklanmasa, validated arraydan image ni olib tashlash
            unset($validated['image']);
        }

        $news->update($validated);

        return redirect()->route('news.index')->with('success', 'News updated successfully!');
    }

    public function destroy(News $news)
    {
        $categoryId = $news->category_id;

        if ($news->image) {
            Storage::disk('public')->delete($news->image);
        }

        $news->delete();

        return redirect()->route('news.index', ['category' => $categoryId])->with('success', 'News deleted successfully!');
    }
}