<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class OrderTransaction extends Model
{
    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_DISPUTE = 'dispute';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED = 'refunded';
    const STATUS_RELEASED = 'released';
    const STATUS_CANCELLATION_REQUESTED = 'cancellation_requested';

    protected $fillable = [
        'conversation_id',
        'message_id',
        'creator_id',
        'executor_id',
        'client_id',
        'freelancer_id',
        'transaction_id',
        'title',
        'description',
        'amount',
        'deadline',
        'status',
        'accepted_at',
        'completed_at',
        'delivered_at',
        'cancelled_at',
        'released_at',
        'cancellation_reason',
        'cancelled_by',
        'cancellation_requested_by',
        'cancellation_requested_at',
        'dispute_reason',
        'dispute_raised_by',
        'dispute_raised_at',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'deadline' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'released_at' => 'datetime',
            'cancellation_requested_at' => 'datetime',
            'dispute_raised_at' => 'datetime',
        ];
    }

    /**
     * Get the conversation this transaction belongs to
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the message that created this transaction
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the user who created the order
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Get the user who will execute the order
     */
    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executor_id');
    }

    /**
     * Get the client (who pays)
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Get the freelancer (who receives payment)
     */
    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    /**
     * Get the associated transaction record
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Get the user who cancelled the transaction
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Get the user who requested cancellation
     */
    public function cancellationRequestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancellation_requested_by');
    }

    /**
     * Get the user who raised the dispute
     */
    public function disputeRaisedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispute_raised_by');
    }

    /**
     * Accept the order and escrow funds
     */
    public function accept(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        return DB::transaction(function () {
            // Check if client has sufficient balance
            if ($this->client->balance < $this->amount) {
                throw new \Exception('Insufficient balance');
            }

            // Deduct amount from client's balance
            $this->client->decrement('balance', $this->amount);

            // Create escrow transaction record
            $transaction = Transaction::create([
                'user_id' => $this->client_id,
                'type' => 'escrow',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Зачисленные средства для заказа: {$this->title}",
                'paid_at' => now(),
            ]);

            // Update order transaction
            $this->update([
                'status' => self::STATUS_ACCEPTED,
                'transaction_id' => $transaction->id,
                'accepted_at' => now(),
            ]);

            return true;
        });
    }

    /**
     * Mark order as completed by client
     */
    public function markCompleted(): bool
    {
        if (!in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return true;
    }

    /**
     * Mark work as delivered by freelancer
     */
    public function deliver(): bool
    {
        if (!in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);

        return true;
    }

    /**
     * Release payment to freelancer
     */
    public function releasePayment(): bool
    {
        if (!in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_DELIVERED])) {
            return false;
        }

        return DB::transaction(function () {
            // Add amount to freelancer's balance
            $this->freelancer->increment('balance', $this->amount);

            // Create payment transaction record
            Transaction::create([
                'user_id' => $this->freelancer_id,
                'type' => 'earning',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Плата за заказ получена: {$this->title}",
                'paid_at' => now(),
            ]);

            // Update order transaction
            $this->update([
                'status' => self::STATUS_RELEASED,
                'released_at' => now(),
            ]);

            return true;
        });
    }

    /**
     * Request cancellation (for accepted orders)
     */
    public function requestCancellation(int $requestedBy, ?string $reason = null): bool
    {
        if (!in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_CANCELLATION_REQUESTED,
            'cancellation_requested_by' => $requestedBy,
            'cancellation_reason' => $reason,
            'cancellation_requested_at' => now(),
        ]);

        return true;
    }

    /**
     * Approve cancellation request
     */
    public function approveCancellation(int $approvedBy): bool
    {
        if ($this->status !== self::STATUS_CANCELLATION_REQUESTED) {
            return false;
        }

        return DB::transaction(function () use ($approvedBy) {
            // Refund amount to client's balance
            $this->client->increment('balance', $this->amount);

            // Create refund transaction record
            Transaction::create([
                'user_id' => $this->client_id,
                'type' => 'refund',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Возврат за отмененный заказ: {$this->title}",
                'paid_at' => now(),
            ]);

            // Update order transaction
            $this->update([
                'status' => self::STATUS_REFUNDED,
                'cancelled_by' => $approvedBy,
                'cancelled_at' => now(),
            ]);

            return true;
        });
    }

    /**
     * Reject cancellation request
     */
    public function rejectCancellation(): bool
    {
        if ($this->status !== self::STATUS_CANCELLATION_REQUESTED) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_ACCEPTED,
            'cancellation_requested_by' => null,
            'cancellation_reason' => null,
            'cancellation_requested_at' => null,
        ]);

        return true;
    }

    /**
     * Cancel the order (only for pending orders)
     */
    public function cancel(int $cancelledBy, ?string $reason = null): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        // Just cancel, no refund needed for pending orders
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_by' => $cancelledBy,
            'cancellation_reason' => $reason,
            'cancelled_at' => now(),
        ]);

        return true;
    }

    /**
     * Raise a dispute
     */
    public function raiseDispute(int $raisedBy, string $reason): bool
    {
        if (!in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED, self::STATUS_CANCELLATION_REQUESTED])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_DISPUTE,
            'dispute_raised_by' => $raisedBy,
            'dispute_reason' => $reason,
            'dispute_raised_at' => now(),
        ]);

        return true;
    }

    /**
     * Check if user can perform action on this transaction
     */
    public function canUserPerformAction(int $userId, string $action): bool
    {
        $isClient = $this->client_id === $userId;
        $isFreelancer = $this->freelancer_id === $userId;
        $isCreator = $this->creator_id === $userId;

        return match ($action) {
            'accept' => !$isCreator && $this->status === self::STATUS_PENDING,
            'deliver' => $isFreelancer && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS]),
            'complete' => $isClient && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED]),
            'cancel' => ($isClient || $isFreelancer) && $this->status === self::STATUS_PENDING,
            'request_cancellation' => ($isClient || $isFreelancer) && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS]),
            'approve_cancellation' => ($isClient || $isFreelancer) && $this->status === self::STATUS_CANCELLATION_REQUESTED && $this->cancellation_requested_by !== $userId,
            'reject_cancellation' => ($isClient || $isFreelancer) && $this->status === self::STATUS_CANCELLATION_REQUESTED && $this->cancellation_requested_by !== $userId,
            'dispute' => ($isClient || $isFreelancer) && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED, self::STATUS_CANCELLATION_REQUESTED]),
            'request_revision' => ($isClient || $isFreelancer) && $this->status === self::STATUS_DELIVERED,
            default => false,
        };
    }

    public function revisionRequestedBy()
    {
        return $this->belongsTo(User::class, 'revision_requested_by');
    }

    // Revision metodlari
    public function requestRevision($userId, $reason = null)
    {
        if ($this->status !== self::STATUS_DELIVERED) {
            return false;
        }

        // Faqat client revision so'rashi mumkin
        if ($userId !== $this->client_id) {
            return false;
        }

        DB::beginTransaction();
        try {
            $this->update([
                'status' => self::STATUS_IN_PROGRESS,
                'revision_count' => $this->revision_count + 1,
                'revision_reason' => $reason,
                'revision_requested_at' => now(),
                'revision_requested_by' => $userId,
                'delivered_at' => null, // Reset delivered_at
            ]);

            // Notification yoki message yaratish
            Message::create([
                'conversation_id' => $this->conversation_id,
                'user_id' => $userId,
                'content' => "🔄 Обработка запрошена: {$this->title}" . ($reason ? "\nПричина: {$reason}" : ""),
            ]);

            $this->conversation->update(['last_message_at' => now()]);

            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            return false;
        }
    }

    // canUserPerformAction metodiga qo'shamiz
    // public function canUserPerformAction($userId, $action)
    // {
    //     if ($userId === null) {
    //         return false;
    //     }

    //     switch ($action) {
    //         case 'accept':
    //             return $this->status === self::STATUS_PENDING && $userId === $this->executor_id;

    //         case 'deliver':
    //             return $this->status === self::STATUS_IN_PROGRESS && $userId === $this->freelancer_id;

    //         case 'complete':
    //             return $this->status === self::STATUS_DELIVERED && $userId === $this->client_id;

    //         case 'cancel':
    //             return $this->status === self::STATUS_PENDING && 
    //                 ($userId === $this->creator_id || $userId === $this->executor_id);

    //         case 'request_cancellation':
    //             return in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED]) &&
    //                 ($userId === $this->client_id || $userId === $this->freelancer_id) &&
    //                 $this->cancellation_requested_by === null;

    //         case 'approve_cancellation':
    //             return $this->status === self::STATUS_CANCELLATION_REQUESTED &&
    //                 $this->cancellation_requested_by !== null &&
    //                 $this->cancellation_requested_by !== $userId &&
    //                 ($userId === $this->client_id || $userId === $this->freelancer_id);

    //         case 'reject_cancellation':
    //             return $this->status === self::STATUS_CANCELLATION_REQUESTED &&
    //                 $this->cancellation_requested_by !== null &&
    //                 $this->cancellation_requested_by !== $userId &&
    //                 ($userId === $this->client_id || $userId === $this->freelancer_id);

    //         case 'dispute':
    //             return in_array($this->status, [self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED, self::STATUS_CANCELLATION_REQUESTED]) &&
    //                 ($userId === $this->client_id || $userId === $this->freelancer_id);

    //         // YANGI: Revision so'rash
    //         case 'request_revision':
    //             return $this->status === self::STATUS_DELIVERED && 
    //                 $userId === $this->client_id;

    //         default:
    //             return false;
    //     }
    // }

    /**
     * Get status badge color for UI
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'yellow',
            self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS => 'blue',
            self::STATUS_COMPLETED, self::STATUS_DELIVERED => 'purple',
            self::STATUS_RELEASED => 'green',
            self::STATUS_DISPUTE => 'orange',
            self::STATUS_CANCELLATION_REQUESTED => 'amber',
            self::STATUS_CANCELLED, self::STATUS_REFUNDED => 'red',
            default => 'gray',
        };
    }

    /**
     * Check if transaction is active
     */
    public function isActive(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_ACCEPTED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_DELIVERED,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLATION_REQUESTED,
        ]);
    }
}