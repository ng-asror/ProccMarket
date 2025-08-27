<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LikeToggled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $likeable;
    public $user;
    public $isLike;
    public $action;
    public $type;

    public function __construct($likeable, User $user, bool $isLike, string $action, string $type)
    {
        $this->likeable = $likeable;
        $this->user = $user;
        $this->isLike = $isLike;
        $this->action = $action; // 'added', 'changed', 'removed'
        $this->type = $type; // 'topic' or 'post'
    }

    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->type === 'topic') {
            $channels[] = new PrivateChannel('topic.' . $this->likeable->id);
            $channels[] = new PrivateChannel('section.' . $this->likeable->section_id);
        } else {
            $channels[] = new PrivateChannel('topic.' . $this->likeable->topic_id);
            $channels[] = new PrivateChannel('section.' . $this->likeable->topic->section_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'like.toggled';
    }

    public function broadcastWith(): array
    {
        $likesCount = $this->likeable->likes()->where('is_like', true)->count();
        $dislikesCount = $this->likeable->likes()->where('is_like', false)->count();

        $data = [
            'likeable_id' => $this->likeable->id,
            'likeable_type' => $this->type,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name
            ],
            'action' => $this->action,
            'is_like' => $this->isLike,
            'likes_count' => $likesCount,
            'dislikes_count' => $dislikesCount,
            'timestamp' => now()->toISOString()
        ];

        if ($this->type === 'topic') {
            $data['topic_id'] = $this->likeable->id;
            $data['section_id'] = $this->likeable->section_id;
        } else {
            $data['post_id'] = $this->likeable->id;
            $data['topic_id'] = $this->likeable->topic_id;
            $data['section_id'] = $this->likeable->topic->section_id;
        }

        return $data;
    }
}