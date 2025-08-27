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

class ContentShared implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $shareable;
    public $user;
    public $platform;
    public $type;

    public function __construct($shareable, User $user, string $platform, string $type)
    {
        $this->shareable = $shareable;
        $this->user = $user;
        $this->platform = $platform;
        $this->type = $type; // 'topic' or 'post'
    }

    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->type === 'topic') {
            $channels[] = new PrivateChannel('topic.' . $this->shareable->id);
            $channels[] = new PrivateChannel('section.' . $this->shareable->section_id);
        } else {
            $channels[] = new PrivateChannel('topic.' . $this->shareable->topic_id);
            $channels[] = new PrivateChannel('section.' . $this->shareable->topic->section_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'content.shared';
    }

    public function broadcastWith(): array
    {
        $sharesCount = $this->shareable->shares()->count();

        $data = [
            'shareable_id' => $this->shareable->id,
            'shareable_type' => $this->type,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name
            ],
            'platform' => $this->platform,
            'shares_count' => $sharesCount,
            'timestamp' => now()->toISOString()
        ];

        if ($this->type === 'topic') {
            $data['topic_id'] = $this->shareable->id;
            $data['section_id'] = $this->shareable->section_id;
        } else {
            $data['post_id'] = $this->shareable->id;
            $data['topic_id'] = $this->shareable->topic_id;
            $data['section_id'] = $this->shareable->topic->section_id;
        }

        return $data;
    }
}