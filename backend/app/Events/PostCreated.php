<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $post;

    public function __construct(Post $post)
    {
        $this->post = $post->load(['user:id,name,avatar', 'topic.section']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('topic.' . $this->post->topic_id),
            new PrivateChannel('section.' . $this->post->topic->section_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'post.created';
    }

    public function broadcastWith(): array
    {
        // Message ID hisoblash
        $messageId = \App\Models\Post::where('topic_id', $this->post->topic_id)
            ->where('id', '<=', $this->post->id)
            ->count();

        return [
            'post' => [
                'id' => $this->post->id,
                'message_id' => $messageId,
                'topic_id' => $this->post->topic_id,
                'content' => $this->post->content,
                'image' => $this->post->image,
                'created_at' => $this->post->created_at,
                'author' => $this->post->user,
                'likes_count' => 0,
                'dislikes_count' => 0,
                'user_reaction' => null,
                'reply_to' => $this->post->reply_id,
            ],
            'topic_id' => $this->post->topic_id,
            'section_id' => $this->post->topic->section_id,
            'message' => 'New message posted',
            'timestamp' => now()->toISOString()
        ];
    }
}