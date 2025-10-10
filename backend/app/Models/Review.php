<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Review extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'star',
        'comment',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'star' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if user can write a review (24 hours check).
     *
     * @param int $userId
     * @return array{can_review: bool, next_review_at: ?Carbon}
     */
    public static function canUserReview(int $userId): array
    {
        $lastReview = static::where('user_id', $userId)
            ->latest('created_at')
            ->first();

        if (!$lastReview) {
            return [
                'can_review' => true,
                'next_review_at' => null,
            ];
        }

        $nextReviewAt = $lastReview->created_at->addDay();
        $canReview = Carbon::now()->greaterThanOrEqualTo($nextReviewAt);

        return [
            'can_review' => $canReview,
            'next_review_at' => $canReview ? null : $nextReviewAt,
        ];
    }

    /**
     * Get hours and minutes until next review.
     *
     * @param Carbon $nextReviewAt
     * @return array{hours: int, minutes: int}
     */
    public static function getTimeUntilNextReview(Carbon $nextReviewAt): array
    {
        $now = Carbon::now();
        $diffInMinutes = $now->diffInMinutes($nextReviewAt);
        
        return [
            'hours' => intdiv($diffInMinutes, 60),
            'minutes' => $diffInMinutes % 60,
        ];
    }
}