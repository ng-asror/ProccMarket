<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'content' => $this->content,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'file_url' => $this->file_url,
            'reply_to_message_id' => $this->reply_to_message_id,
            'reply_to' => new MessageResource($this->whenLoaded('replyTo')),
            'read_at' => $this->read_at,
            'is_read' => $this->isRead(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
