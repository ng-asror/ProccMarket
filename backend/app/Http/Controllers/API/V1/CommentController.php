<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    /**
     * Newsga tegishli barcha commentlarni ko'rsatish (nested structure bilan)
     */
    public function index(Request $request, News $news): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'integer|min:1|max:100',
            'sort_by' => 'in:created_at,likes_count',
            'sort_order' => 'in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $perPage = $request->input('per_page', 20);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        // Faqat parent commentlarni olish (reply emas)
        $query = Comment::where('news_id', $news->id)
            ->whereNull('replay_id')
            ->with([
                'user',
                'replies' => function ($query) use ($sortOrder) {
                    $query->with('user')
                        ->withCount(['likes', 'shares'])
                        ->orderBy('created_at', $sortOrder);
                },
                'replies.replies' => function ($query) use ($sortOrder) {
                    $query->with('user')
                        ->withCount(['likes', 'shares'])
                        ->orderBy('created_at', $sortOrder);
                }
            ])
            ->withCount(['likes', 'shares', 'replies']);

        if ($sortBy === 'likes_count') {
            $query->orderBy('likes_count', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $comments = $query->paginate($perPage);

        // User reaction qo'shish
        $user = $request->user();
        if ($user) {
            $comments->getCollection()->transform(function ($comment) use ($user) {
                return $this->formatCommentWithReaction($comment, $user);
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Comments retrieved successfully',
            'data' => $comments->items(),
            'pagination' => [
                'current_page' => $comments->currentPage(),
                'per_page' => $comments->perPage(),
                'total' => $comments->total(),
                'last_page' => $comments->lastPage(),
            ]
        ], 200);
    }

    /**
     * Yangi comment yaratish
     */
    public function store(Request $request, News $news): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:5000',
            'replay_id' => [
                'nullable',
                'integer',
                Rule::exists('comments', 'id')->where(function ($query) use ($news) {
                    $query->where('news_id', $news->id);
                })
            ]
        ], [
            'content.required' => 'Comment content is required',
            'content.min' => 'Comment must be at least 1 character',
            'content.max' => 'Comment cannot exceed 5000 characters',
            'replay_id.exists' => 'Parent comment not found or does not belong to this news'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Agar bu reply bo'lsa, parent comment mavjudligini va max depth ni tekshirish
        if ($request->replay_id) {
            $parentComment = Comment::find($request->replay_id);
            
            // Max 2 level depth (comment -> reply -> reply)
            if ($parentComment->replay_id !== null) {
                $grandParent = Comment::find($parentComment->replay_id);
                if ($grandParent && $grandParent->replay_id !== null) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Maximum reply depth exceeded (max 3 levels)'
                    ], 422);
                }
            }
        }

        $comment = Comment::create([
            'news_id' => $news->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'replay_id' => $request->replay_id,
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Comment created successfully',
            'data' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'user' => $comment->user,
                'replay_id' => $comment->replay_id,
                'likes_count' => 0,
                'shares_count' => 0,
                'replies_count' => 0,
                'user_reaction' => null,
            ]
        ], 201);
    }

    /**
     * Bitta commentni ko'rsatish
     */
    public function show(Request $request, Comment $comment): JsonResponse
    {
        $comment->load([
            'user',
            'news:id,title',
            'reply.user',
            'replies' => function ($query) {
                $query->with('user')
                    ->withCount(['likes', 'shares'])
                    ->orderBy('created_at', 'desc');
            }
        ])->loadCount(['likes', 'shares', 'replies']);

        $user = $request->user();
        $userReaction = null;

        if ($user) {
            $userLike = $comment->likes()->where('user_id', $user->id)->first();
            $userReaction = $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null;
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment retrieved successfully',
            'data' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'user' => $comment->user,
                'news' => $comment->news,
                'reply_to' => $comment->reply,
                'replies' => $comment->replies,
                'likes_count' => $comment->likes_count,
                'shares_count' => $comment->shares_count,
                'replies_count' => $comment->replies_count,
                'user_reaction' => $userReaction,
            ]
        ], 200);
    }

    /**
     * Comment tahrirlash
     */
    public function update(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // Faqat o'z commentini tahrirlashi mumkin
        if ($comment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You can only edit your own comments'
            ], 403);
        }

        // 24 soatdan oshgan commentlarni tahrirlash mumkin emas
        if ($comment->created_at->lt(now()->subDay())) {
            return response()->json([
                'success' => false,
                'message' => 'Comments can only be edited within 24 hours of creation'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|min:1|max:5000'
        ], [
            'content.required' => 'Comment content is required',
            'content.min' => 'Comment must be at least 1 character',
            'content.max' => 'Comment cannot exceed 5000 characters'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $comment->update([
            'content' => $request->content
        ]);

        $comment->load('user')
            ->loadCount(['likes', 'shares', 'replies']);

        $userLike = $comment->likes()->where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'data' => [
                'id' => $comment->id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
                'updated_at' => $comment->updated_at,
                'user' => $comment->user,
                'replay_id' => $comment->replay_id,
                'likes_count' => $comment->likes_count,
                'shares_count' => $comment->shares_count,
                'replies_count' => $comment->replies_count,
                'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
            ]
        ], 200);
    }

    /**
     * Comment o'chirish
     */
    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // Faqat o'z commentini yoki admin o'chirishi mumkin
        if ($comment->user_id !== $user->id && !$user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'You can only delete your own comments'
            ], 403);
        }

        // Agar commentda replylar bo'lsa, ularni ham o'chirish
        $comment->replies()->delete();
        
        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully'
        ], 200);
    }

    /**
     * User reactionni qo'shish (helper method)
     */
    private function formatCommentWithReaction($comment, $user)
    {
        $userLike = $comment->likes->firstWhere('user_id', $user->id);
        
        $formattedComment = [
            'id' => $comment->id,
            'content' => $comment->content,
            'created_at' => $comment->created_at,
            'updated_at' => $comment->updated_at,
            'user' => $comment->user,
            'likes_count' => $comment->likes_count,
            'shares_count' => $comment->shares_count,
            'replies_count' => $comment->replies_count,
            'user_reaction' => $userLike ? ($userLike->is_like ? 'like' : 'dislike') : null,
        ];

        // Nested replies uchun ham formatlaymiz
        if ($comment->replies && $comment->replies->isNotEmpty()) {
            $formattedComment['replies'] = $comment->replies->map(function ($reply) use ($user) {
                return $this->formatCommentWithReaction($reply, $user);
            });
        }

        return $formattedComment;
    }
}