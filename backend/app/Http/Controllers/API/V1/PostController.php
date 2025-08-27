<?php

namespace App\Http\Controllers\API\V1;


use App\Events\PostCreated;
use App\Models\Post;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class PostController extends Controller
{
    /**
     * Topic ichidagi postlarni ko'rsatish
     */
    public function index(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        // Kirish huquqini tekshirish
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'page' => 'integer|min:1',
            'per_page' => 'integer|min:1|max:100',
            'sort_order' => 'in:asc,desc'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $perPage = $request->input('per_page', 20);
        $orderBy = $request->input('sort_order', 'asc'); // Eski xabarlar birinchi

        $query = Post::where('topic_id', $topic->id)
            ->with(['user'])
            ->withCount(['likes as likes_count' => function ($query) {
                $query->where('is_like', true);
            }])
            ->withCount(['likes as dislikes_count' => function ($query) {
                $query->where('is_like', false);
            }]);

        // Har bir topic uchun message_id 1 dan boshlanadi
        // $query->select('posts.*')
        //         ->selectRaw('ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY id) as message_id');


        $query->orderBy('created_at', $orderBy);

        $posts = $query->paginate($perPage);

        // Response formatting
        $posts->getCollection()->transform(function ($post) use ($user) {
            // User bu post ga like/dislike qilganmi
            $userLike = $post->likes()->where('user_id', $user->id)->first();
            
            return [
                'id' => $post->id,
                // 'message_id' => $post->message_id,
                'content' => $post->content,
                'image' => $post->image,
                'reply_to' => $post->reply_id,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'author' => $post->user,
                'likes_count' => $post->likes_count ?? 0,
                'dislikes_count' => $post->dislikes_count ?? 0,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                'can_edit' => $post->user_id === $user->id || $user->is_admin,
                'can_delete' => $post->user_id === $user->id || $user->is_admin
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Posts retrieved successfully',
            'posts' => $posts->items(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'last_page' => $posts->lastPage(),
            ]
        ], 200);
    }

    /**
     * Yangi post yaratish
     */
    public function store(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        // Topic yopilganmi tekshirish
        if ($topic->closed && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'This topic is closed for new posts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'image' => 'nullable|string',
            'reply_id' => 'nullable|exists:posts,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Reply_id tekshirish (shu topic ichida bo'lishi kerak)
        if ($request->reply_id) {
            $replyPost = Post::where('id', $request->reply_id)
                ->where('topic_id', $topic->id)
                ->first();
            
            if (!$replyPost) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reply post not found in this topic'
                ], 404);
            }
        }

        $post = Post::create([
            'topic_id' => $topic->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'image' => $request->image,
            'reply_id' => $request->reply_id,
        ]);

        $post->load('user');

        // Message ID hisoblash
        $messageId = Post::where('topic_id', $topic->id)
            ->where('id', '<=', $post->id)
            ->count();

        // Topic ning updated_at ni yangilash
        $topic->touch();

        // WebSocket event yuborish
        event(new PostCreated($post->load('topic')));

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'post' => [
                'id' => $post->id,
                'message_id' => $messageId,
                'content' => $post->content,
                'image' => $post->image,
                'created_at' => $post->created_at,
                'author' => $user,
                'likes_count' => 0,
                'dislikes_count' => 0,
                'user_reaction' => null,
                'reply_to' => $post->reply_id,
            ]
        ], 201);
    }

    /**
     * Post ko'rish
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        // Kirish huquqini tekshirish
        if (!$this->userHasAccess($user, $post->topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $post->load('user');    

        return response()->json([
            'success' => true,
            'message' => 'Post retrieved successfully',
            'post' => [
                'id' => $post->id,
                'content' => $post->content,
                'image' => $post->image,
                'reply_to' => $post->reply_id,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'author' => $post->user,
                'likes_count' => $post->likes()->where('is_like', true)->count(),
                'dislikes_count' => $post->likes()->where('is_like', false)->count(),
                'user_reaction' => $post->likes()->where('user_id', $user->id)->first()?->is_like ? 'like' : ( $post->likes()->where('user_id', $user->id)->first()?->is_like === false ? 'dislike' : null),
                'can_edit' => $post->user_id === $user->id || $user->is_admin,
                'can_delete' => $post->user_id === $user->id || $user->is_admin
            ]
        ], 200);
    }

    /**
     * Post tahrirlash
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        // Faqat muallif yoki admin tahrirlashi mumkin
        if ($post->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own posts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'sometimes|required|string',
            'image' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $post->update($request->only(['content', 'image']));

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'post' => $post
        ], 200);
    }

    /**
     * Post o'chirish
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        // Faqat muallif yoki admin o'chirishi mumkin
        if ($post->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own posts'
            ], 403);
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
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