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
     * Topic ichidagi postlarni ko'rsatish (nested structure bilan)
     */
    public function index(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if ($user && !$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'in:created_at,likes_count',
            'sort_order' => 'in:asc,desc'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $perPage = $request->input('per_page', 20);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'asc');

        // Faqat parent postlarni olish (reply emas)
        $query = Post::where('topic_id', $topic->id)
            ->whereNull('reply_id')
            ->with([
                'user',
                'replies' => function ($query) use ($sortOrder) {
                    $query->with('user')
                        ->withCount([
                            'likes as likes_count' => function ($q) {
                                $q->where('is_like', true);
                            },
                            'likes as dislikes_count' => function ($q) {
                                $q->where('is_like', false);
                            },
                            'shares'
                        ])
                        ->orderBy('created_at', $sortOrder);
                },
                'replies.replies' => function ($query) use ($sortOrder) {
                    $query->with('user')
                        ->withCount([
                            'likes as likes_count' => function ($q) {
                                $q->where('is_like', true);
                            },
                            'likes as dislikes_count' => function ($q) {
                                $q->where('is_like', false);
                            },
                            'shares'
                        ])
                        ->orderBy('created_at', $sortOrder);
                }
            ])
            ->withCount([
                'likes as likes_count' => function ($q) {
                    $q->where('is_like', true);
                },
                'likes as dislikes_count' => function ($q) {
                    $q->where('is_like', false);
                },
                'shares',
                'replies'
            ]);

        if ($sortBy === 'likes_count') {
            $query->withCount(['likes as likes_count' => function ($q) {
                $q->where('is_like', true);
            }])->orderBy('likes_count', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $posts = $query->paginate($perPage);

        // User reaction qo'shish
        if ($user) {
            $posts->getCollection()->transform(function ($post) use ($user) {
                return $this->formatPostWithReaction($post, $user);
            });
        } else {
            $posts->getCollection()->transform(function ($post) {
                return $this->formatPostWithoutAuth($post);
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Posts retrieved successfully',
            'data' => $posts->items(),
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
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        if ($topic->closed && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'This topic is closed for new posts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:10000',
            'image' => 'nullable|string',
            'reply_id' => 'nullable|integer|exists:posts,id'
        ], [
            'content.required' => 'Post content is required',
            'content.min' => 'Post must be at least 1 character',
            'content.max' => 'Post cannot exceed 10000 characters',
            'reply_id.exists' => 'Reply post not found'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Agar bu reply bo'lsa, parent post mavjudligini va max depth ni tekshirish
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

            // Max 2 level depth (post -> reply -> reply)
            if ($replyPost->reply_id !== null) {
                $grandParent = Post::find($replyPost->reply_id);
                if ($grandParent && $grandParent->reply_id !== null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maximum reply depth exceeded (max 3 levels)'
                    ], 422);
                }
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

        $topic->touch();

        event(new PostCreated($post->load('topic')));

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => [
                'id' => $post->id,
                'content' => $post->content,
                'image' => $post->image,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'user' => $post->user,
                'reply_id' => $post->reply_id,
                'likes_count' => 0,
                'dislikes_count' => 0,
                'shares_count' => 0,
                'replies_count' => 0,
                'user_reaction' => null,
                'user_shared' => false,
                'can_edit' => true,
                'can_delete' => true,
            ]
        ], 201);
    }

    /**
     * Bitta postni ko'rsatish
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if ($user && !$this->userHasAccess($user, $post->topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $post->load([
            'user',
            'topic:id,title',
            'reply.user',
            'replies' => function ($query) {
                $query->with('user')
                    ->withCount([
                        'likes as likes_count' => function ($q) {
                            $q->where('is_like', true);
                        },
                        'likes as dislikes_count' => function ($q) {
                            $q->where('is_like', false);
                        },
                        'shares'
                    ])
                    ->orderBy('created_at', 'asc');
            }
        ])->loadCount([
            'likes as likes_count' => function ($q) {
                $q->where('is_like', true);
            },
            'likes as dislikes_count' => function ($q) {
                $q->where('is_like', false);
            },
            'shares',
            'replies'
        ]);

        $userReaction = null;
        $userShared = false;

        if ($user) {
            $userLike = $post->likes()->where('user_id', $user->id)->first();
            $userReaction = $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null;
            $userShared = $post->shares()->where('user_id', $user->id)->exists();
        }

        return response()->json([
            'success' => true,
            'message' => 'Post retrieved successfully',
            'data' => [
                'id' => $post->id,
                'content' => $post->content,
                'image' => $post->image,
                'reply_id' => $post->reply_id,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'user' => $post->user,
                'topic' => $post->topic,
                'reply_to' => $post->reply,
                'replies' => $post->replies,
                'likes_count' => $post->likes_count,
                'dislikes_count' => $post->dislikes_count,
                'shares_count' => $post->shares_count,
                'replies_count' => $post->replies_count,
                'user_reaction' => $userReaction,
                'user_shared' => $userShared,
                'can_edit' => $user ? ($post->user_id === $user->id || $user->is_admin) : false,
                'can_delete' => $user ? ($post->user_id === $user->id || $user->is_admin) : false,
            ]
        ], 200);
    }

    /**
     * Post tahrirlash
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        if ($post->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own posts'
            ], 403);
        }

        // 24 soatdan oshgan postlarni tahrirlash mumkin emas (admin bundan mustasno)
        if (!$user->is_admin && $post->created_at->lt(now()->subDay())) {
            return response()->json([
                'success' => false,
                'message' => 'Posts can only be edited within 24 hours of creation'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:10000',
            'image' => 'nullable|string'
        ], [
            'content.required' => 'Post content is required',
            'content.min' => 'Post must be at least 1 character',
            'content.max' => 'Post cannot exceed 10000 characters'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $post->update($request->only(['content', 'image']));
        
        $post->load('user')
            ->loadCount([
                'likes as likes_count' => function ($q) {
                    $q->where('is_like', true);
                },
                'likes as dislikes_count' => function ($q) {
                    $q->where('is_like', false);
                },
                'shares',
                'replies'
            ]);

        $userLike = $post->likes()->where('user_id', $user->id)->first();
        $userShared = $post->shares()->where('user_id', $user->id)->exists();

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully',
            'data' => [
                'id' => $post->id,
                'content' => $post->content,
                'image' => $post->image,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'user' => $post->user,
                'reply_id' => $post->reply_id,
                'likes_count' => $post->likes_count,
                'dislikes_count' => $post->dislikes_count,
                'shares_count' => $post->shares_count,
                'replies_count' => $post->replies_count,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
                'user_shared' => $userShared,
                'can_edit' => $post->user_id === $user->id || $user->is_admin,
                'can_delete' => $post->user_id === $user->id || $user->is_admin,
            ]
        ], 200);
    }

    /**
     * Post o'chirish
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        if ($post->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own posts'
            ], 403);
        }

        // Agar postda replylar bo'lsa, ularni ham o'chirish
        $post->replies()->delete();

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ], 200);
    }

    /**
     * User reactionni qo'shish (helper method - authenticated user)
     */
    private function formatPostWithReaction($post, $user)
    {
        $userLike = $post->likes->firstWhere('user_id', $user->id);
        $userShared = $post->shares->firstWhere('user_id', $user->id);
        
        $formattedPost = [
            'id' => $post->id,
            'content' => $post->content,
            'image' => $post->image,
            'created_at' => $post->created_at,
            'updated_at' => $post->updated_at,
            'user' => $post->user,
            'likes_count' => $post->likes_count,
            'dislikes_count' => $post->dislikes_count,
            'shares_count' => $post->shares_count,
            'replies_count' => $post->replies_count,
            'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
            'user_shared' => $userShared ? true : false,
            'can_edit' => $post->user_id === $user->id || $user->is_admin,
            'can_delete' => $post->user_id === $user->id || $user->is_admin,
        ];

        // Nested replies uchun ham formatlaymiz
        if ($post->replies && $post->replies->isNotEmpty()) {
            $formattedPost['replies'] = $post->replies->map(function ($reply) use ($user) {
                return $this->formatPostWithReaction($reply, $user);
            });
        }

        return $formattedPost;
    }

    /**
     * Format post without authentication (guest user)
     */
    private function formatPostWithoutAuth($post)
    {
        $formattedPost = [
            'id' => $post->id,
            'content' => $post->content,
            'image' => $post->image,
            'created_at' => $post->created_at,
            'updated_at' => $post->updated_at,
            'user' => $post->user,
            'likes_count' => $post->likes_count,
            'dislikes_count' => $post->dislikes_count,
            'shares_count' => $post->shares_count,
            'replies_count' => $post->replies_count,
            'user_reaction' => null,
            'user_shared' => false,
            'can_edit' => false,
            'can_delete' => false,
        ];

        // Nested replies uchun ham formatlaymiz
        if ($post->replies && $post->replies->isNotEmpty()) {
            $formattedPost['replies'] = $post->replies->map(function ($reply) {
                return $this->formatPostWithoutAuth($reply);
            });
        }

        return $formattedPost;
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