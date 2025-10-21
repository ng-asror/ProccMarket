<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    // Types
    const TYPE_NEW_MESSAGE = 'new_message';
    const TYPE_NEW_CONVERSATION = 'new_conversation';
    const TYPE_ORDER_CREATED = 'order_created';
    const TYPE_ORDER_ACCEPTED = 'order_accepted';
    const TYPE_ORDER_DELIVERED = 'order_delivered';
    const TYPE_ORDER_COMPLETED = 'order_completed';
    const TYPE_ORDER_CANCELLED = 'order_cancelled';
    const TYPE_ORDER_CANCELLATION_REQUESTED = 'order_cancellation_requested';
    const TYPE_ORDER_CANCELLATION_APPROVED = 'order_cancellation_approved';
    const TYPE_ORDER_CANCELLATION_REJECTED = 'order_cancellation_rejected';
    const TYPE_ORDER_REVISION_REQUESTED = 'order_revision_requested';
    const TYPE_ORDER_DISPUTED = 'order_disputed';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        if (!$this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}