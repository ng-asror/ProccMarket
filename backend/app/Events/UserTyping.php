<?php

namespace App\Events;

use App\Models\User;
use App\Models\Topic;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $topic;
    public $isTyping;

    public function __construct(User $user, Topic $topic, bool $isTyping)
    {
        $this->user = $user;
        $this->topic = $topic;
        $this->isTyping = $isTyping;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('topic.' . $this->topic->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name
            ],
            'topic_id' => $this->topic->id,
            'is_typing' => $this->isTyping,
            'timestamp' => now()->toISOString()
        ];
    }
}