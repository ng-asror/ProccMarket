<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()->id;
        $otherParticipant = $this->getOtherParticipant($currentUserId);

        return [
            'id' => $this->id,
            'other_participant' => new UserResource($otherParticipant),
            'last_message' => new MessageResource($this->whenLoaded('latestMessage')),
            'last_message_at' => $this->last_message_at,
            'unread_count' => $this->whenCounted('messages'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
