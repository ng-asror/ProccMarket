<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\Section;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class TopicController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortBy = $request->input('sort_by');
        $sortDirection = $request->input('sort_direction', 'asc');
        $sectionFilter = $request->input('section_filter');
        $userFilter = $request->input('user_filter');
        $statusFilter = $request->input('status_filter');

        $query = Topic::with(['user:id,name,avatar', 'section:id,name'])
            ->withCount([
                'posts',
                'views',
                'likes as likes_count' => function ($query) {
                    $query->where('is_like', true);
                },
                'likes as dislikes_count' => function ($query) {
                    $query->where('is_like', false);
                },
                'shares'
            ]);

        // Apply search
        $query->when($search, function ($query, $search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('section', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
        });

        // Apply section filter
        $query->when($sectionFilter, function ($query, $sectionFilter) {
            $query->where('section_id', $sectionFilter);
        });

        // Apply user filter
        $query->when($userFilter, function ($query, $userFilter) {
            $query->where('user_id', $userFilter);
        });

        // Apply status filter
        $query->when($statusFilter !== null, function ($query) use ($statusFilter) {
            $query->where('closed', $statusFilter === 'closed');
        });

        // Apply sorting
        if ($sortBy) {
            switch ($sortBy) {
                case 'title':
                    $query->orderBy('title', $sortDirection);
                    break;
                case 'user':
                    $query->join('users', 'topics.user_id', '=', 'users.id')
                          ->orderBy('users.name', $sortDirection)
                          ->select('topics.*');
                    break;
                case 'section':
                    $query->join('sections', 'topics.section_id', '=', 'sections.id')
                          ->orderBy('sections.name', $sortDirection)
                          ->select('topics.*');
                    break;
                case 'posts_count':
                    $query->orderBy('posts_count', $sortDirection);
                    break;
                case 'views_count':
                    $query->orderBy('views_count', $sortDirection);
                    break;
                case 'likes_count':
                    $query->orderBy('likes_count', $sortDirection);
                    break;
                case 'shares_count':
                    $query->orderBy('shares_count', $sortDirection);
                    break;
                case 'closed':
                    $query->orderBy('closed', $sortDirection);
                    break;
                case 'created_at':
                    $query->orderBy('created_at', $sortDirection);
                    break;
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $topics = $query->paginate(perPage: 15)->withQueryString();

        // Get filter options
        $query = Section::with(['parent', 'children'])
            ->withCount(['topics', 'users']);

        // Get sections in tree structure
        $sections = Section::buildTree($query->get());
        $users = User::select('id', 'name', 'avatar', 'email', 'telegram_id')
                    ->get();

        $allSections = Section::select('id', 'name', 'parent_id')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/topics/index', [
            'topics' => $topics,
            'sections' => $sections,
            'allSections' => $allSections,
            'users' => $users,
            'filters' => $request->only(['search', 'sort_by', 'sort_direction', 'section_filter', 'user_filter', 'status_filter'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'closed' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('topics', 'public');
        }

        $topic = Topic::create($validated);

        return redirect()->route('admin.topics.index')->with('success', 'Topic created successfully');
    }

    public function update(Request $request, Topic $topic)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|max:2048',
            'closed' => 'boolean',
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($topic->image) {
                Storage::disk('public')->delete($topic->image);
            }
            $validated['image'] = $request->file('image')->store('topics', 'public');
        }

        $topic->update($validated);

        return redirect()->route('admin.topics.index')->with('success', 'Topic updated successfully');
    }

    public function destroy(Topic $topic)
    {
        // Delete image if exists
        if ($topic->image) {
            Storage::disk('public')->delete($topic->image);
        }

        // Delete related data
        $topic->posts()->delete();
        $topic->views()->delete();
        $topic->likes()->delete();
        $topic->shares()->delete();

        $topic->delete();

        return redirect()->route('admin.topics.index')->with('success', 'Topic deleted successfully');
    }

    public function toggleStatus(Topic $topic)
    {
        $topic->update([
            'closed' => !$topic->closed
        ]);

        $status = $topic->closed ? 'closed' : 'opened';
        return redirect()->route('admin.topics.index')->with('success', "Topic {$status} successfully");
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'topic_ids' => 'required|array',
            'topic_ids.*' => 'exists:topics,id',
        ]);

        $topics = Topic::whereIn('id', $validated['topic_ids'])->get();

        foreach ($topics as $topic) {
            // Delete image if exists
            if ($topic->image) {
                Storage::disk('public')->delete($topic->image);
            }

            // Delete related data
            $topic->posts()->delete();
            $topic->views()->delete();
            $topic->likes()->delete();
            $topic->shares()->delete();
        }

        Topic::whereIn('id', $validated['topic_ids'])->delete();

        return redirect()->route('admin.topics.index')->with('success', count($validated['topic_ids']) . ' topics deleted successfully');
    }

    public function bulkToggleStatus(Request $request)
    {
        $validated = $request->validate([
            'topic_ids' => 'required|array',
            'topic_ids.*' => 'exists:topics,id',
            'status' => 'required|boolean',
        ]);

        Topic::whereIn('id', $validated['topic_ids'])->update([
            'closed' => $validated['status']
        ]);

        $status = $validated['status'] ? 'closed' : 'opened';
        return redirect()->route('admin.topics.index')->with('success', count($validated['topic_ids']) . " topics {$status} successfully");
    }
}