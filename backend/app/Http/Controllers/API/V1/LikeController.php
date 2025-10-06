<?php

namespace App\Http\Controllers\API\V1;

use App\Events\LikeToggled;
use App\Models\Post;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class LikeController extends Controller
{
    /**
     * Topic ga like/dislike toggle
     */
    public function toggleTopicLike(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'is_like' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $isLike = $request->is_like;
        $existingLike = $topic->likes()->where('user_id', $user->id)->first();

        $action = '';

        if ($existingLike) {
            // Bir xil reaction - o'chirish (toggle off)
            if ($existingLike->is_like == $isLike) {
                $existingLike->delete();
                $action = 'removed';
            } else {
                // Boshqa reaction - o'zgartirish
                $existingLike->update(['is_like' => $isLike]);
                $action = 'changed';
            }
        } else {
            // Yangi reaction
            $topic->likes()->create([
                'user_id' => $user->id,
                'is_like' => $isLike
            ]);
            $action = 'added';
        }

        // Yangilangan statistika
        $likesCount = $topic->likes()->where('is_like', true)->count();
        $dislikesCount = $topic->likes()->where('is_like', false)->count();

        // WebSocket event
        event(new LikeToggled($topic, $user, $isLike, $action, 'topic'));

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully',
            'data' => [
                'action' => $action,
                'likes_count' => $likesCount,
                'dislikes_count' => $dislikesCount,
                'user_reaction' => $action == 'removed' ? null : ($isLike ? 'like' : 'dislike')
            ]
        ], 200);
    }

    /**
     * Post ga like/dislike toggle
     */
    public function togglePostLike(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $post->topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this post'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'is_like' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $isLike = $request->is_like;
        $existingLike = $post->likes()->where('user_id', $user->id)->first();

        $action = '';

        if ($existingLike) {
            // Bir xil reaction - o'chirish (toggle off)
            if ($existingLike->is_like == $isLike) {
                $existingLike->delete();
                $action = 'removed';
            } else {
                // Boshqa reaction - o'zgartirish
                $existingLike->update(['is_like' => $isLike]);
                $action = 'changed';
            }
        } else {
            // Yangi reaction
            $post->likes()->create([
                'user_id' => $user->id,
                'is_like' => $isLike
            ]);
            $action = 'added';
        }

        // Yangilangan statistika
        $likesCount = $post->likes()->where('is_like', true)->count();
        $dislikesCount = $post->likes()->where('is_like', false)->count();

        // WebSocket event
        event(new LikeToggled($post->load('topic'), $user, $isLike, $action, 'post'));

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully',
            'data' => [
                'action' => $action,
                'likes_count' => $likesCount,
                'dislikes_count' => $dislikesCount,
                'user_reaction' => $action == 'removed' ? null : ($isLike ? 'like' : 'dislike')
            ]
        ], 200);
    }

    /**
     * Get Topic likes (faqat like bosganlar)
     */
    public function getTopicLikes(Topic $topic): JsonResponse
    {
        $likes = $topic->likes()
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
     * Get Topic dislikes
     */
    public function getTopicDislikes(Topic $topic): JsonResponse
    {
        $dislikes = $topic->likes()
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
     * Get Post likes
     */
    public function getPostLikes(Post $post): JsonResponse
    {
        $likes = $post->likes()
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
     * Get Post dislikes
     */
    public function getPostDislikes(Post $post): JsonResponse
    {
        $dislikes = $post->likes()
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