<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Get the first user in the conversation
     */
    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    /**
     * Get the second user in the conversation
     */
    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    /**
     * Get all messages in this conversation
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the latest message in the conversation
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get the other participant in the conversation for a given user
     */
    public function getOtherParticipant(int $userId): User
    {
        return $this->user_one_id === $userId ? $this->userTwo : $this->userOne;
    }

    /**
     * Check if a user is part of this conversation
     */
    public function hasParticipant(int $userId): bool
    {
        return $this->user_one_id === $userId || $this->user_two_id === $userId;
    }

    /**
     * Scope to get conversations for a specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_one_id', $userId)
            ->orWhere('user_two_id', $userId);
    }

    /**
     * Find or create a conversation between two users
     */
    public static function findOrCreateBetween(int $userIdOne, int $userIdTwo): self
    {
        // Ensure user_one_id is always less than user_two_id
        $minUserId = min($userIdOne, $userIdTwo);
        $maxUserId = max($userIdOne, $userIdTwo);

        return self::firstOrCreate([
            'user_one_id' => $minUserId,
            'user_two_id' => $maxUserId,
        ]);
    }
}
