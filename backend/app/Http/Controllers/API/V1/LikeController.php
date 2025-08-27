<?php

namespace App\Http\Controllers\API\V1;

use App\Events\LikeToggled;
use App\Models\Like;
use App\Models\Post;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class LikeController extends Controller
{
    /**
     * Topic ga like/dislike
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

        $existingLike = Like::where('user_id', $user->id)
            ->where('likeable_type', Topic::class)
            ->where('likeable_id', $topic->id)
            ->first();

        $action = '';

        if ($existingLike) {
            if ($existingLike->is_like == $request->is_like) {
                // Bir xil reaction - o'chirish
                $existingLike->delete();
                $action = 'removed';
            } else {
                // Boshqa reaction - o'zgartirish
                $existingLike->update(['is_like' => $request->is_like]);
                $action = 'changed';
            }
        } else {
            // Yangi reaction
            Like::create([
                'user_id' => $user->id,
                'likeable_type' => Topic::class,
                'likeable_id' => $topic->id,
                'is_like' => $request->is_like
            ]);
            $action = 'added';
        }

        // Yangilangan statistika
        $likesCount = $topic->likes()->where('is_like', true)->count();
        $dislikesCount = $topic->likes()->where('is_like', false)->count();

        // WebSocket event yuborish
        event(new LikeToggled($topic, $user, $request->is_like, $action, 'topic'));

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully',
            'action' => $action,
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
            'user_reaction' => $action === 'removed' ? null : ($request->is_like ? 'like' : 'dislike')
        ], 200);
    }

    /**
     * Post ga like/dislike
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

        $existingLike = Like::where('user_id', $user->id)
            ->where('likeable_type', Post::class)
            ->where('likeable_id', $post->id)
            ->first();

        $action = '';

        if ($existingLike) {
            if ($existingLike->is_like == $request->is_like) {
                // Bir xil reaction - o'chirish
                $existingLike->delete();
                $action = 'removed';
            } else {
                // Boshqa reaction - o'zgartirish
                $existingLike->update(['is_like' => $request->is_like]);
                $action = 'changed';
            }
        } else {
            // Yangi reaction
            Like::create([
                'user_id' => $user->id,
                'likeable_type' => Post::class,
                'likeable_id' => $post->id,
                'is_like' => $request->is_like
            ]);
            $action = 'added';
        }

        // Yangilangan statistika
        $likesCount = $post->likes()->where('is_like', true)->count();
        $dislikesCount = $post->likes()->where('is_like', false)->count();

        // WebSocket event yuborish
        event(new LikeToggled($post->load('topic'), $user, $request->is_like, $action, 'post'));

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully',
            'action' => $action,
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
            'user_reaction' => $action === 'removed' ? null : ($request->is_like ? 'like' : 'dislike')
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