<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use App\Models\Post;
use App\Events\PostCreated;
use App\Events\LikeToggled;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class WebSocketController extends Controller
{
    /**
     * WebSocket orqali xabar yuborish
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'topic_id' => 'required|exists:topics,id',
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

        $topic = Topic::with('section')->find($request->topic_id);
        
        // Kirish huquqini tekshirish
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

        // Reply_id tekshirish
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

        // Topic ning updated_at ni yangilash
        $topic->touch();

        // WebSocket event yuborish
        event(new PostCreated($post->load('topic')));

        return response()->json([
            'success' => true,
            'message' => 'Message sent successfully',
            'post_id' => $post->id
        ], 201);
    }

    /**
     * WebSocket orqali like/dislike
     */
    public function toggleLike(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'likeable_type' => 'required|in:topic,post',
            'likeable_id' => 'required|integer',
            'is_like' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $likeableType = $request->likeable_type === 'topic' ? Topic::class : Post::class;
        $likeable = $likeableType::find($request->likeable_id);

        if (!$likeable) {
            return response()->json([
                'success' => false,
                'message' => ucfirst($request->likeable_type) . ' not found'
            ], 404);
        }

        // Section access tekshirish
        $section = $request->likeable_type === 'topic' 
            ? $likeable->section 
            : $likeable->topic->section;

        if (!$this->userHasAccess($user, $section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this ' . $request->likeable_type
            ], 403);
        }

        $existingLike = $likeable->likes()
            ->where('user_id', $user->id)
            ->first();

        $action = '';

        if ($existingLike) {
            if ($existingLike->is_like == $request->is_like) {
                $existingLike->delete();
                $action = 'removed';
            } else {
                $existingLike->update(['is_like' => $request->is_like]);
                $action = 'changed';
            }
        } else {
            $likeable->likes()->create([
                'user_id' => $user->id,
                'is_like' => $request->is_like
            ]);
            $action = 'added';
        }

        // WebSocket event yuborish
        event(new LikeToggled($likeable, $user, $request->is_like, $action, $request->likeable_type));

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully',
            'action' => $action
        ], 200);
    }

    /**
     * Online userlarni ko'rsatish
     */
    public function getOnlineUsers(Request $request, $channelType, $channelId): JsonResponse
    {
        // Bu yerda Reverb API orqali online userlarni olish mumkin
        // Hozircha oddiy response qaytaramiz
        return response()->json([
            'success' => true,
            'online_users' => [], // Bu yerda online userlar ro'yxati bo'ladi
            'count' => 0
        ], 200);
    }

    /**
     * User typing statusini yuborish
     */
    public function userTyping(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'topic_id' => 'required|exists:topics,id',
            'is_typing' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $topic = Topic::with('section')->find($request->topic_id);

        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        // Typing event yuborish
        broadcast(new \App\Events\UserTyping(
            $user, 
            $topic, 
            $request->is_typing
        ))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Typing status updated'
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