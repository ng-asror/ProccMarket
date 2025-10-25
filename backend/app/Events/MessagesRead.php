<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessagesRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * O'qilgan xabarlar ID lari
     */
    public array $messageIds;
    
    /**
     * Qaysi conversation da
     */
    public int $conversationId;
    
    /**
     * Kim o'qidi
     */
    public int $readByUserId;

    public function __construct(array $messageIds, int $conversationId, int $readByUserId)
    {
        $this->messageIds = $messageIds;
        $this->conversationId = $conversationId;
        $this->readByUserId = $readByUserId;
    }

    /**
     * Qaysi channel ga yuboriladi
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->conversationId),
        ];
    }

    /**
     * Event nomi
     */
    public function broadcastAs(): string
    {
        return 'messages.read';
    }

    /**
     * Qanday data yuboriladi
     */
    public function broadcastWith(): array
    {
        return [
            'message_ids' => $this->messageIds, // O'qilgan barcha xabarlar
            'conversation_id' => $this->conversationId,
            'read_by_user_id' => $this->readByUserId,
            'read_at' => now()->toIso8601String(),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}