<?php

namespace App\Http\Controllers\API\V1;

use App\Events\TopicCreated;
use App\Models\Section;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;

class TopicController extends Controller
{
    /**
     * Section ichidagi topiclarni ko'rsatish
     */
    public function index(Request $request, Section $section): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'in:created_at,updated_at,views_count,posts_count,likes_count',
            'sort_order' => 'in:asc,desc',
            'start_date' => 'date',
            'end_date' => 'date|after_or_equal:start_date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $perPage = $request->input('per_page', 20);
        $sortBy = $request->input('sort_by', 'updated_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $query = Topic::where('section_id', $section->id)
            ->with(['user:id,name,email,avatar', 'posts' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->withCount([
                'posts',
                'likes as likes_count' => function ($q) {
                    $q->where('is_like', true);
                },
                'likes as dislikes_count' => function ($q) {
                    $q->where('is_like', false);
                },
                'shares',
                'views'
            ]);

        // Date filter
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Sorting
        if (in_array($sortBy, ['views_count', 'likes_count'])) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $topics = $query->paginate($perPage);

        // Har bir topic uchun qo'shimcha ma'lumotlar
        $topics->getCollection()->transform(function ($topic) use ($user) {
            $userLike = $topic->likes->firstWhere('user_id', $user->id);

            return [
                'id' => $topic->id,
                'title' => $topic->title,
                'image' => $topic->image,
                'image_url' => $topic->image_url,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'updated_at' => $topic->updated_at,
                'author' => $topic->user,
                'posts_count' => $topic->posts_count,
                'likes_count' => $topic->likes_count,
                'dislikes_count' => $topic->dislikes_count,
                'shares_count' => $topic->shares_count,
                'views_count' => $topic->views_count,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                'user_shared' => $topic->shares()->where('user_id', $user->id)->exists(),
                'last_post' => $topic->posts->first(),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Topics retrieved successfully',
            'topics' => $topics->items(),
            'pagination' => [
                'current_page' => $topics->currentPage(),
                'per_page' => $topics->perPage(),
                'total' => $topics->total(),
                'last_page' => $topics->lastPage(),
            ]
        ], 200);
    }

    /**
     * Topic yaratish
     */
    public function store(Request $request, Section $section): JsonResponse
    {
        $user = $request->user();

        if (!$this->userHasAccess($user, $section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $imagePath = null;

        // Fayl yuklangan bo'lsa
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $imagePath = $request->file('image')->store('topics', 'public');
        }
        // URL yuborilgan bo'lsa
        elseif (is_string($request->image) && Str::startsWith($request->image, ['http://', 'https://'])) {
            $imagePath = $request->image;
        }

        $topic = Topic::create([
            'section_id' => $section->id,
            'user_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'image' => $imagePath,
        ]);

        $topic->load('user:id,name,email,avatar');

        event(new TopicCreated($topic));

        return response()->json([
            'success' => true,
            'message' => 'Topic created successfully',
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'content' => $topic->content,
                'image' => $topic->image,
                'image_url' => $topic->image_url,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'author' => $topic->user,
                'posts_count' => 0,
                'likes_count' => 0,
                'dislikes_count' => 0,
                'shares_count' => 0,
                'views_count' => 0,
                'user_reaction' => null,
                'user_shared' => false,
            ]
        ], 201);
    }

    /**
     * Topic ko'rish (Avtomatik view tracking)
     */
    public function show(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section'
            ], 403);
        }

        // Avtomatik view tracking
        $this->trackView($request, $topic, $user);

        $topic->load(['user:id,name,email,avatar', 'section:id,name'])
            ->loadCount([
                'posts',
                'likes as likes_count' => function ($q) {
                    $q->where('is_like', true);
                },
                'likes as dislikes_count' => function ($q) {
                    $q->where('is_like', false);
                },
                'shares',
                'views'
            ]);

        $userLike = $topic->likes()->where('user_id', $user->id)->first();
        $userShared = $topic->shares()->where('user_id', $user->id)->exists();

        return response()->json([
            'success' => true,
            'message' => 'Topic details retrieved successfully',
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'content' => $topic->content,
                'image' => $topic->image,
                'image_url' => $topic->image_url,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'updated_at' => $topic->updated_at,
                'author' => $topic->user,
                'section' => $topic->section,
                'posts_count' => $topic->posts_count,
                'likes_count' => $topic->likes_count,
                'dislikes_count' => $topic->dislikes_count,
                'shares_count' => $topic->shares_count,
                'views_count' => $topic->views_count,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                'user_shared' => $userShared,
            ]
        ], 200);
    }

    /**
     * Topic tahrirlash
     */
    public function update(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if ($topic->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own topics'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'image' => 'nullable|string',
            'closed' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $topic->update($request->only(['title', 'content', 'image', 'closed']));
        
        $topic->load(['user:id,name,email,avatar', 'section:id,name'])
            ->loadCount([
                'posts',
                'likes as likes_count' => function ($q) {
                    $q->where('is_like', true);
                },
                'likes as dislikes_count' => function ($q) {
                    $q->where('is_like', false);
                },
                'shares',
                'views'
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Topic updated successfully',
            'topic' => $topic
        ], 200);
    }

    /**
     * Topic o'chirish
     */
    public function destroy(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if ($topic->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own topics'
            ], 403);
        }

        $topic->delete();

        return response()->json([
            'success' => true,
            'message' => 'Topic deleted successfully'
        ], 200);
    }

    /**
     * View tracking (avtomatik)
     */
    private function trackView(Request $request, Topic $topic, $user)
    {
        $ipAddress = $request->ip();
        $userAgent = $request->userAgent();

        // 24 soat ichida bir xil user/IP qayta view qo'shmaydi
        $existingView = $topic->views()
            ->where(function ($query) use ($user, $ipAddress) {
                if ($user) {
                    $query->where('user_id', $user->id);
                } else {
                    $query->where('ip_address', $ipAddress);
                }
            })
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if (!$existingView) {
            $topic->views()->create([
                'user_id' => $user ? $user->id : null,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
        }
    }

    /**
     * User section ga kirish huquqini tekshirish
     */
    private function userHasAccess($user, $section): bool
    {
        if ($user->is_admin) return true;
        if ($user->sections()->where('section_id', $section->id)->exists()) return true;
        if ($section->access_price == 0) return true;
        if ($user->role_id && $section->default_roles && 
            in_array($user->role_id, $section->default_roles)) return true;
        
        return false;
    }
}