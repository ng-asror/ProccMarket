<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Like;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsLikeController extends Controller
{
    /**
     * Toggle like/dislike for News
     */
    public function toggleNewsLike(Request $request, News $news): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $request->validate([
            'is_like' => 'required|boolean'
        ]);

        $isLike = $request->is_like;

        // Check existing like/dislike
        $existingLike = $news->likes()->where('user_id', $user->id)->first();

        if ($existingLike) {
            // If same action, remove it (toggle off)
            if ($existingLike->is_like == $isLike) {
                $existingLike->delete();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Reaction removed',
                    'data' => [
                        'user_reaction' => null,
                        'likes_count' => $news->likes()->where('is_like', true)->count(),
                        'dislikes_count' => $news->likes()->where('is_like', false)->count(),
                    ]
                ], 200);
            }
            
            // If different action, update it
            $existingLike->update(['is_like' => $isLike]);
            
            return response()->json([
                'success' => true,
                'message' => $isLike ? 'News liked' : 'News disliked',
                'data' => [
                    'user_reaction' => $isLike ? 'like' : 'dislike',
                    'likes_count' => $news->likes()->where('is_like', true)->count(),
                    'dislikes_count' => $news->likes()->where('is_like', false)->count(),
                ]
            ], 200);
        }

        // Create new like/dislike
        $news->likes()->create([
            'user_id' => $user->id,
            'is_like' => $isLike,
        ]);

        return response()->json([
            'success' => true,
            'message' => $isLike ? 'News liked successfully' : 'News disliked successfully',
            'data' => [
                'user_reaction' => $isLike ? 'like' : 'dislike',
                'likes_count' => $news->likes()->where('is_like', true)->count(),
                'dislikes_count' => $news->likes()->where('is_like', false)->count(),
            ]
        ], 201);
    }

    /**
     * Toggle like/dislike for Comment
     */
    public function toggleCommentLike(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $request->validate([
            'is_like' => 'required|boolean'
        ]);

        $isLike = $request->is_like;

        // Check existing like/dislike
        $existingLike = $comment->likes()->where('user_id', $user->id)->first();

        if ($existingLike) {
            // If same action, remove it (toggle off)
            if ($existingLike->is_like == $isLike) {
                $existingLike->delete();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Reaction removed',
                    'data' => [
                        'user_reaction' => null,
                        'likes_count' => $comment->likes()->where('is_like', true)->count(),
                        'dislikes_count' => $comment->likes()->where('is_like', false)->count(),
                    ]
                ], 200);
            }
            
            // If different action, update it
            $existingLike->update(['is_like' => $isLike]);
            
            return response()->json([
                'success' => true,
                'message' => $isLike ? 'Comment liked' : 'Comment disliked',
                'data' => [
                    'user_reaction' => $isLike ? 'like' : 'dislike',
                    'likes_count' => $comment->likes()->where('is_like', true)->count(),
                    'dislikes_count' => $comment->likes()->where('is_like', false)->count(),
                ]
            ], 200);
        }

        // Create new like/dislike
        $comment->likes()->create([
            'user_id' => $user->id,
            'is_like' => $isLike,
        ]);

        return response()->json([
            'success' => true,
            'message' => $isLike ? 'Comment liked successfully' : 'Comment disliked successfully',
            'data' => [
                'user_reaction' => $isLike ? 'like' : 'dislike',
                'likes_count' => $comment->likes()->where('is_like', true)->count(),
                'dislikes_count' => $comment->likes()->where('is_like', false)->count(),
            ]
        ], 201);
    }

    /**
     * Get all users who liked a News
     */
    public function getNewsLikes(News $news): JsonResponse
    {
        $likes = $news->likes()
            ->with('user')
            ->where('is_like', true)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Likes retrieved successfully',
            'data' => $likes
        ], 200);
    }

    /**
     * Get all users who disliked a News
     */
    public function getNewsDislikes(News $news): JsonResponse
    {
        $dislikes = $news->likes()
            ->with('user')
            ->where('is_like', false)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Dislikes retrieved successfully',
            'data' => $dislikes
        ], 200);
    }

    /**
     * Get all users who liked a Comment
     */
    public function getCommentLikes(Comment $comment): JsonResponse
    {
        $likes = $comment->likes()
            ->with('user')
            ->where('is_like', true)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Likes retrieved successfully',
            'data' => $likes
        ], 200);
    }

    /**
     * Get all users who disliked a Comment
     */
    public function getCommentDislikes(Comment $comment): JsonResponse
    {
        $dislikes = $comment->likes()
            ->with('user')
            ->where('is_like', false)
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Dislikes retrieved successfully',
            'data' => $dislikes
        ], 200);
    }
}