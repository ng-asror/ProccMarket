<?php

namespace App\Events;

use App\Models\Topic;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TopicCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $topic;

    public function __construct(Topic $topic)
    {
        $this->topic = $topic->load(['user', 'section:id,name']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('section.' . $this->topic->section_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'topic.created';
    }

    public function broadcastWith(): array
    {
        return [
            'topic' => [
                'id' => $this->topic->id,
                'title' => $this->topic->title,
                'image' => $this->topic->image,
                'created_at' => $this->topic->created_at,
                'author' => $this->topic->user,
                'section' => $this->topic->section,
                'posts_count' => 0,
                'likes_count' => 0,
                'shares_count' => 0,
                'views_count' => 0
            ],
            'message' => 'New topic created in this section',
            'timestamp' => now()->toISOString()
        ];
    }
}