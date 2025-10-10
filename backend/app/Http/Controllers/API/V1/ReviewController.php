<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Store a new review.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Validator
        $validator = Validator::make($request->all(), [
            'star' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|min:1|max:1024',
        ], [
            'star.required' => 'Rating is required',
            'star.integer' => 'Rating must be a number',
            'star.min' => 'Rating must be at least 1',
            'star.max' => 'Rating must be at most 5',
            'comment.string' => 'Comment must be text',
            'comment.min' => 'Comment must be at least 1 character',
            'comment.max' => 'Comment must not exceed 1024 characters',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Check if user can review (24 hours rate limit)
        $reviewCheck = Review::canUserReview($user->id);

        if (!$reviewCheck['can_review']) {
            $timeRemaining = Review::getTimeUntilNextReview($reviewCheck['next_review_at']);
            
            return response()->json([
                'success' => false,
                'message' => 'You can only submit one review per 24 hours',
                'next_review_at' => $reviewCheck['next_review_at']->toIso8601String(),
                'time_remaining' => [
                    'hours' => $timeRemaining['hours'],
                    'minutes' => $timeRemaining['minutes'],
                    'formatted' => sprintf(
                        '%d %s %d %s',
                        $timeRemaining['hours'],
                        $timeRemaining['hours'] === 1 ? 'hour' : 'hours',
                        $timeRemaining['minutes'],
                        $timeRemaining['minutes'] === 1 ? 'minute' : 'minutes'
                    )
                ]
            ], 429); // 429 Too Many Requests
        }

        // Create review
        $review = Review::create([
            'user_id' => $user->id,
            'star' => $request->star,
            'comment' => $request->comment,
        ]);

        // Load user relationship
        $review->load('user:id,name,email,avatar');

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully',
            'review' => [
                'id' => $review->id,
                'star' => $review->star,
                'comment' => $review->comment,
                'created_at' => $review->created_at->toIso8601String(),
                'user' => [
                    'id' => $review->user->id,
                    'name' => $review->user->name,
                    'email' => $review->user->email,
                    'avatar' => $review->user->avatar,
                ]
            ]
        ], 201);
    }

    /**
     * Check if user can submit a review.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function canReview(Request $request): JsonResponse
    {
        $user = $request->user();
        $reviewCheck = Review::canUserReview($user->id);

        if ($reviewCheck['can_review']) {
            return response()->json([
                'success' => true,
                'can_review' => true,
                'message' => 'You can submit a review'
            ], 200);
        }

        $timeRemaining = Review::getTimeUntilNextReview($reviewCheck['next_review_at']);

        return response()->json([
            'success' => true,
            'can_review' => false,
            'message' => 'You have already submitted a review today',
            'next_review_at' => $reviewCheck['next_review_at']->toIso8601String(),
            'time_remaining' => [
                'hours' => $timeRemaining['hours'],
                'minutes' => $timeRemaining['minutes'],
                'formatted' => sprintf(
                    '%d %s %d %s',
                    $timeRemaining['hours'],
                    $timeRemaining['hours'] === 1 ? 'hour' : 'hours',
                    $timeRemaining['minutes'],
                    $timeRemaining['minutes'] === 1 ? 'minute' : 'minutes'
                )
            ]
        ], 200);
    }
}