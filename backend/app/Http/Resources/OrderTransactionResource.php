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
            
            // Users involved
            'creator' => $this->whenLoaded('creator', fn() => (new UserResource($this->creator))->toArray($request)),
            'executor' => $this->whenLoaded('executor', fn() => (new UserResource($this->executor))->toArray($request)),
            'client' => $this->whenLoaded('client', fn() => (new UserResource($this->client))->toArray($request)),
            'freelancer' => $this->whenLoaded('freelancer', fn() => (new UserResource($this->freelancer))->toArray($request)),
            
            // Order details
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
            'cancellation_requested_at' => $this->cancellation_requested_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // YANGI: Revision info
            'revision_count' => $this->revision_count ?? 0,
            'revision_reason' => $this->revision_reason,
            'revision_requested_at' => $this->revision_requested_at,
            'revision_requested_by' => $this->whenLoaded(
                'revisionRequestedBy',
                fn () => (new UserResource($this->revisionRequestedBy))->toArray($request)
            ),

            // Cancellation info
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_by' => $this->whenLoaded(
                'cancelledBy', 
                fn () => (new UserResource($this->cancelledBy))->toArray($request)
            ),
            'cancellation_requested_by' => $this->whenLoaded(
                'cancellationRequestedBy',
                fn () => (new UserResource($this->cancellationRequestedBy))->toArray($request)
            ),

            // Dispute info
            'dispute_reason' => $this->dispute_reason,
            'dispute_raised_by' => $this->whenLoaded(
                'disputeRaisedBy',
                fn () => (new UserResource($this->disputeRaisedBy))->toArray($request)
            ),

            // User permissions
            'can_accept' => $this->canUserPerformAction($currentUserId, 'accept'),
            'can_deliver' => $this->canUserPerformAction($currentUserId, 'deliver'),
            'can_complete' => $this->canUserPerformAction($currentUserId, 'complete'),
            'can_cancel' => $this->canUserPerformAction($currentUserId, 'cancel'),
            'can_request_cancellation' => $this->canUserPerformAction($currentUserId, 'request_cancellation'),
            'can_approve_cancellation' => $this->canUserPerformAction($currentUserId, 'approve_cancellation'),
            'can_reject_cancellation' => $this->canUserPerformAction($currentUserId, 'reject_cancellation'),
            'can_dispute' => $this->canUserPerformAction($currentUserId, 'dispute'),
            'can_request_revision' => $this->canUserPerformAction($currentUserId, 'request_revision'),

            // User role in transaction
            'is_creator' => $this->creator_id === $currentUserId,
            'is_executor' => $this->executor_id === $currentUserId,
            'is_client' => $this->client_id === $currentUserId,
            'is_freelancer' => $this->freelancer_id === $currentUserId,
            
            // Helper flags for UI
            'waiting_for_my_approval' => $this->status === 'cancellation_requested' 
                && $this->cancellation_requested_by !== $currentUserId,
            'i_requested_cancellation' => $this->status === 'cancellation_requested'
                && $this->cancellation_requested_by === $currentUserId,
            'has_revisions' => $this->revision_count > 0,
        ];
    }
}