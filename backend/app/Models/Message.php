<?php

namespace App\Models;

use App\Events\MessageRead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'content',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'reply_to_message_id',
        'read_at',
    ];

    protected $appends = ['file_url'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    /**
     * Get the conversation this message belongs to
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user who sent this message
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the message this is replying to
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_message_id');
    }

    /**
     * Get all replies to this message
     */
    public function replies()
    {
        return $this->hasMany(Message::class, 'reply_to_message_id');
    }

    /**
     * Check if this message has a file attachment
     */
    public function hasFile(): bool
    {
        return ! is_null($this->file_path);
    }

    /**
     * Get the full URL for the file attachment
     */
    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return Storage::url($this->file_path);
    }

    /**
     * Check if this message has been read
     */
    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }

    /**
     * Mark this message as read
     */
    public function markAsRead(int $readByUserId = null): void
    {
        if (! $this->isRead()) {
            $this->update(['read_at' => now()]);
            
            // Broadcast event - toOthers() o'zi uchun yuborilmaydi
            broadcast(new MessageRead($this, $readByUserId ?? auth()->id()))->toOthers();
        }
    }

    /**
     * Scope to get unread messages for a user in a conversation
     */
    public function scopeUnreadForUser($query, int $conversationId, int $userId)
    {
        return $query->where('conversation_id', $conversationId)
            ->where('user_id', '!=', $userId)
            ->whereNull('read_at');
    }

    /**
     * Scope to get messages from a specific conversation
     */
    public function scopeForConversation($query, int $conversationId)
    {
        return $query->where('conversation_id', $conversationId);
    }

    /**
     * Scope to get messages from a specific user
     */
    public function scopeFromUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
