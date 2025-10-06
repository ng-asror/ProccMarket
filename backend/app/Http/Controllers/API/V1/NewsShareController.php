<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\News;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsShareController extends Controller
{
    /**
     * Share a News
     */
    public function shareNews(Request $request, News $news): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $request->validate([
            'platform' => 'required|string|in:facebook,twitter,telegram,whatsapp,linkedin,email,copy_link'
        ]);

        $platform = $request->platform;

        // Check if already shared on this platform
        $existingShare = $news->shares()
            ->where('user_id', $user->id)
            ->where('platform', $platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => true,
                'message' => 'Already shared on this platform',
                'data' => [
                    'shares_count' => $news->shares()->count(),
                    'user_shared' => true,
                ]
            ], 200);
        }

        // Create new share
        $news->shares()->create([
            'user_id' => $user->id,
            'platform' => $platform,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'News shared successfully',
            'data' => [
                'platform' => $platform,
                'shares_count' => $news->shares()->count(),
                'user_shared' => true,
                'share_url' => $this->generateShareUrl($news, $platform)
            ]
        ], 201);
    }

    /**
     * Share a Comment
     */
    public function shareComment(Request $request, Comment $comment): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        $request->validate([
            'platform' => 'required|string|in:facebook,twitter,telegram,whatsapp,linkedin,email,copy_link'
        ]);

        $platform = $request->platform;

        // Check if already shared on this platform
        $existingShare = $comment->shares()
            ->where('user_id', $user->id)
            ->where('platform', $platform)
            ->first();

        if ($existingShare) {
            return response()->json([
                'success' => true,
                'message' => 'Already shared on this platform',
                'data' => [
                    'shares_count' => $comment->shares()->count(),
                    'user_shared' => true,
                ]
            ], 200);
        }

        // Create new share
        $comment->shares()->create([
            'user_id' => $user->id,
            'platform' => $platform,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment shared successfully',
            'data' => [
                'platform' => $platform,
                'shares_count' => $comment->shares()->count(),
                'user_shared' => true,
                'share_url' => $this->generateCommentShareUrl($comment, $platform)
            ]
        ], 201);
    }

    /**
     * Get share statistics for News
     */
    public function getNewsShares(News $news): JsonResponse
    {
        $shares = $news->shares()
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get();

        $totalShares = $news->shares()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_shares' => $totalShares,
                'by_platform' => $shares
            ]
        ], 200);
    }

    /**
     * Get share statistics for Comment
     */
    public function getCommentShares(Comment $comment): JsonResponse
    {
        $shares = $comment->shares()
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get();

        $totalShares = $comment->shares()->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_shares' => $totalShares,
                'by_platform' => $shares
            ]
        ], 200);
    }

    /**
     * Generate share URL based on platform
     */
    private function generateShareUrl(News $news, string $platform): string
    {
        $url = url("/news/{$news->id}");
        $title = urlencode($news->title);
        $description = urlencode(substr($news->description, 0, 100));

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
     * Generate share URL for Comment
     */
    private function generateCommentShareUrl(Comment $comment, string $platform): string
    {
        $url = url("/news/{$comment->news_id}?comment={$comment->id}");
        $text = urlencode("Check out this comment: " . substr($comment->content, 0, 100));

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
                return "mailto:?subject=Interesting%20Comment&body={$text}%0A%0A{$url}";
            case 'copy_link':
            default:
                return $url;
        }
    }
}