<?php

namespace App\Http\Controllers\API\V1;

use App\Events\TopicCreated;
use App\Models\Section;
use App\Models\Topic;
use App\Models\TopicView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
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
        
        // Kirish huquqini tekshirish
        if (!$this->userHasAccess($user, $section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'in:created_at,updated_at,views_count,posts_count',
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
            ->with(['user', 'posts'])
            ->withCount(['posts', 'likes', 'shares']);

        // Views count qo'shish
        $query->addSelect([
            'views_count' => TopicView::selectRaw('count(*)')
                ->whereColumn('topic_id', 'topics.id')
        ]);

        // Date filter
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Sorting
        $query->orderBy($sortBy, $sortOrder);

        $topics = $query->paginate($perPage);

        // Har bir topic uchun qo'shimcha ma'lumotlar
        $topics->getCollection()->transform(function ($topic) use ($user) {
            $userLike = $topic->likes->firstWhere('user_id', $user->id);

            return [
                'id' => $topic->id,
                'title' => $topic->title,
                'image' => $topic->image,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'updated_at' => $topic->updated_at,
                'author' => $topic->user,
                'posts_count' => $topic->posts_count,
                'likes_count' => $topic->likes_count,
                'shares_count' => $topic->shares_count,
                'views_count' => $topic->views_count ?? 0,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                'last_post_at' => $topic->posts->max('created_at')
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
            'image' => 'nullable' // Fayl yoki URL bo'lishi mumkin
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $imagePath = null;

        // Fayl yuklangan bo‘lsa
        if ($request->hasFile('image') && $request->file('image')->isValid()) {
            $imagePath = $request->file('image')->store('topics', 'public');
        }
        // URL yuborilgan bo‘lsa
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

        $topic->load('user');

        event(new TopicCreated($topic));

        return response()->json([
            'success' => true,
            'message' => 'Topic created successfully',
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'image' => $topic->image,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'author' => $topic->user,
                'posts_count' => 0,
                'likes_count' => 0,
                'shares_count' => 0,
                'views_count' => 0,
                'user_reaction' => null,
            ]
        ], 201);
    }

    /**
     * Topic ko'rish
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

        $topic->load(['user', 'section:id,name'])
            ->loadCount(['posts', 'likes', 'shares']);

        // Views count
        $viewsCount = TopicView::where('topic_id', $topic->id)->count();
        $userLike = $topic->likes()->where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Topic details retrieved successfully',
            'topic' => [
                'id' => $topic->id,
                'title' => $topic->title,
                'image' => $topic->image,
                'closed' => $topic->closed,
                'created_at' => $topic->created_at,
                'updated_at' => $topic->updated_at,
                'author' => $topic->user,
                'section' => $topic->section,
                'posts_count' => $topic->posts_count,
                'likes_count' => $topic->likes_count,
                'shares_count' => $topic->shares_count,
                'views_count' => $viewsCount,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
            ]
        ], 200);
    }

    /**
     * Topic view count oshirish
     */
    public function incrementView(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this section'
            ], 403);
        }

        // Foydalanuvchi oxirgi 24 soat ichida bu topicni ko'rganmi tekshirish
        $existingView = TopicView::where('topic_id', $topic->id)
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if (!$existingView) {
            TopicView::create([
                'topic_id' => $topic->id,
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);
        }

        $viewsCount = TopicView::where('topic_id', $topic->id)->count();

        return response()->json([
            'success' => true,
            'views_count' => $viewsCount
        ], 200);
    }

    /**
     * Topic tahrirlash
     */
    public function update(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        // Faqat muallif yoki admin tahrirlashi mumkin
        if ($topic->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own topics'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'image' => 'nullable|string',
            'closed' => 'sometimes|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $topic->update($request->only(['title', 'image', 'closed']));
        $topic->load(['user', 'section:id,name'])
            ->loadCount(['posts', 'likes', 'shares']);

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
        
        // Faqat muallif yoki admin o'chirishi mumkin
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