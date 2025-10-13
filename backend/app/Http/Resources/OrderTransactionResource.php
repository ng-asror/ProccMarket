<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUserId = $request->user()->id;

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'message_id' => $this->message_id,
            'creator' => (new UserResource($this->whenLoaded('creator')))->toArray($request),
            'executor' => (new UserResource($this->whenLoaded('executor')))->toArray($request),
            'title' => $this->title,
            'description' => $this->description,
            'amount' => $this->amount,
            'deadline' => $this->deadline,
            'status' => $this->status,
            'status_color' => $this->getStatusColor(),
            'is_active' => $this->isActive(),

            // Timestamps
            'accepted_at' => $this->accepted_at,
            'completed_at' => $this->completed_at,
            'delivered_at' => $this->delivered_at,
            'cancelled_at' => $this->cancelled_at,
            'released_at' => $this->released_at,
            'dispute_raised_at' => $this->dispute_raised_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Cancellation info
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_by' => $this->when($this->cancelled_by, fn () => (new UserResource($this->cancelledBy))->toArray($request)),

            // Dispute info
            'dispute_reason' => $this->dispute_reason,
            'dispute_raised_by' => $this->when($this->dispute_raised_by, fn () => (new UserResource($this->disputeRaisedBy))->toArray($request)),

            // User permissions
            'can_accept' => $this->canUserPerformAction($currentUserId, 'accept'),
            'can_deliver' => $this->canUserPerformAction($currentUserId, 'deliver'),
            'can_complete' => $this->canUserPerformAction($currentUserId, 'complete'),
            'can_cancel' => $this->canUserPerformAction($currentUserId, 'cancel'),
            'can_dispute' => $this->canUserPerformAction($currentUserId, 'dispute'),

            // User role in transaction
            'is_creator' => $this->creator_id === $currentUserId,
            'is_executor' => $this->executor_id === $currentUserId,
        ];
    }
}
