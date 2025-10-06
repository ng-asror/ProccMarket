<?php

namespace App\Http\Controllers\API\V1;

use App\Events\ContentShared;
use App\Models\Post;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class ShareController extends Controller
{
    /**
     * Topic share qilish
     */
    public function shareTopic(Request $request, Topic $topic): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this topic'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:facebook,twitter,telegram,whatsapp,linkedin,email,copy_link'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $platform = $request->platform;

        // Bir user bir platform da bir marta share qilgan bo'lsa, qayta qo'shmaydi
        $existingShare = $topic->shares()
            ->where('user_id', $user->id)
            ->where('platform', $platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => true,
                'message' => 'Already shared on this platform',
                'data' => [
                    'shares_count' => $topic->shares()->count(),
                    'user_shared' => true,
                ]
            ], 200);
        }

        // Yangi share yaratish
        $topic->shares()->create([
            'user_id' => $user->id,
            'platform' => $platform
        ]);

        // WebSocket event
        event(new ContentShared($topic, $user, $platform, 'topic'));

        return response()->json([
            'success' => true,
            'message' => 'Topic shared successfully',
            'data' => [
                'platform' => $platform,
                'shares_count' => $topic->shares()->count(),
                'user_shared' => true,
                'share_url' => $this->generateTopicShareUrl($topic, $platform)
            ]
        ], 201);
    }

    /**
     * Post share qilish
     */
    public function sharePost(Request $request, Post $post): JsonResponse
    {
        $user = $request->user();
        
        if (!$this->userHasAccess($user, $post->topic->section)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this post'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:facebook,twitter,telegram,whatsapp,linkedin,email,copy_link'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $platform = $request->platform;

        // Bir user bir platform da bir marta share qilgan bo'lsa, qayta qo'shmaydi
        $existingShare = $post->shares()
            ->where('user_id', $user->id)
            ->where('platform', $platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => true,
                'message' => 'Already shared on this platform',
                'data' => [
                    'shares_count' => $post->shares()->count(),
                    'user_shared' => true,
                ]
            ], 200);
        }

        // Yangi share yaratish
        $post->shares()->create([
            'user_id' => $user->id,
            'platform' => $platform
        ]);

        // WebSocket event
        event(new ContentShared($post->load('topic'), $user, $platform, 'post'));

        return response()->json([
            'success' => true,
            'message' => 'Post shared successfully',
            'data' => [
                'platform' => $platform,
                'shares_count' => $post->shares()->count(),
                'user_shared' => true,
                'share_url' => $this->generatePostShareUrl($post, $platform)
            ]
        ], 201);
    }

    /**
     * Get Topic share statistics
     */
    public function getTopicShares(Topic $topic): JsonResponse
    {
        $shares = $topic->shares()
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get();

        $totalShares = $topic->shares()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_shares' => $totalShares,
                'by_platform' => $shares
            ]
        ], 200);
    }

    /**
     * Get Post share statistics
     */
    public function getPostShares(Post $post): JsonResponse
    {
        $shares = $post->shares()
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get();

        $totalShares = $post->shares()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_shares' => $totalShares,
                'by_platform' => $shares
            ]
        ], 200);
    }

    /**
     * Generate Topic share URL
     */
    private function generateTopicShareUrl(Topic $topic, string $platform): string
    {
        $url = url("/topics/{$topic->id}");
        $title = urlencode($topic->title);
        $description = urlencode(substr($topic->content, 0, 100));

        switch ($platform) {
            case 'facebook':
                return "https://www.facebook.com/sharer/sharer.php?u={$url}";
            case 'twitter':
                return "https://twitter.com/intent/tweet?url={$url}&text={$title}";
            case 'telegram':
                return "https://t.me/share/url?url={$url}&text={$title}";
            case 'whatsapp':
                return "https://wa.me/?text={$title}%20{$url}";
            case 'linkedin':
                return "https://www.linkedin.com/sharing/share-offsite/?url={$url}";
            case 'email':
                return "mailto:?subject={$title}&body={$description}%0A%0A{$url}";
            case 'copy_link':
            default:
                return $url;
        }
    }

    /**
     * Generate Post share URL
     */
    private function generatePostShareUrl(Post $post, string $platform): string
    {
        $url = url("/topics/{$post->topic_id}?post={$post->id}");
        $text = urlencode("Check out this post: " . substr($post->content, 0, 100));

        switch ($platform) {
            case 'facebook':
                return "https://www.facebook.com/sharer/sharer.php?u={$url}";
            case 'twitter':
                return "https://twitter.com/intent/tweet?url={$url}&text={$text}";
            case 'telegram':
                return "https://t.me/share/url?url={$url}&text={$text}";
            case 'whatsapp':
                return "https://wa.me/?text={$text}%20{$url}";
            case 'linkedin':
                return "https://www.linkedin.com/sharing/share-offsite/?url={$url}";
            case 'email':
                return "mailto:?subject=Interesting%20Post&body={$text}%0A%0A{$url}";
            case 'copy_link':
            default:
                return $url;
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