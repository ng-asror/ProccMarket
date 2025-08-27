<?php

namespace App\Http\Controllers\API\V1;

use App\Events\ContentShared;
use App\Models\Post;
use App\Models\Share;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class ShareController extends Controller
{
    /**
     * Topic share count oshirish
     */
    public function shareTopicCount(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:telegram,facebook,twitter,copy_link,whatsapp'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Bir user bir platform uchun faqat bir marta share qila oladi
        $existingShare = Share::where('user_id', $user->id)
            ->where('shareable_type', Topic::class)
            ->where('shareable_id', $topic->id)
            ->where('platform', $request->platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => false,
                'message' => 'You have already shared this topic on this platform'
            ], 400);
        }

        Share::create([
            'user_id' => $user->id,
            'shareable_type' => Topic::class,
            'shareable_id' => $topic->id,
            'platform' => $request->platform
        ]);

        $sharesCount = $topic->shares()->count();

        // WebSocket event yuborish
        event(new ContentShared($topic, $user, $request->platform, 'topic'));

        return response()->json([
            'success' => true,
            'message' => 'Topic shared successfully',
            'shares_count' => $sharesCount,
            'platform' => $request->platform
        ], 200);
    }

    /**
     * Post share count oshirish
     */
    public function sharePostCount(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $post->topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this post'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:telegram,facebook,twitter,copy_link,whatsapp'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Bir user bir platform uchun faqat bir marta share qila oladi
        $existingShare = Share::where('user_id', $user->id)
            ->where('shareable_type', Post::class)
            ->where('shareable_id', $post->id)
            ->where('platform', $request->platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => false,
                'message' => 'You have already shared this post on this platform'
            ], 400);
        }

        Share::create([
            'user_id' => $user->id,
            'shareable_type' => Post::class,
            'shareable_id' => $post->id,
            'platform' => $request->platform
        ]);

        $sharesCount = $post->shares()->count();

        // WebSocket event yuborish
        event(new ContentShared($post->load('topic'), $user, $request->platform, 'post'));

        return response()->json([
            'success' => true,
            'message' => 'Post shared successfully',
            'shares_count' => $sharesCount,
            'platform' => $request->platform
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