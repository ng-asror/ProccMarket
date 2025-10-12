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

    protected $fillable = [
        'conversation_id',
        'message_id',
        'creator_id',
        'executor_id',
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
            // Check if creator has sufficient balance
            if ($this->creator->balance < $this->amount) {
                throw new \Exception('Insufficient balance');
            }

            // Deduct amount from creator's balance
            $this->creator->decrement('balance', $this->amount);

            // Create escrow transaction record
            $transaction = Transaction::create([
                'user_id' => $this->creator_id,
                'type' => 'escrow',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Escrowed funds for order: {$this->title}",
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
     * Mark order as completed by creator
     */
    public function markCompleted(): bool
    {
        if (! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return true;
    }

    /**
     * Mark work as delivered by executor
     */
    public function deliver(): bool
    {
        if (! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS])) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_DELIVERED,
            'delivered_at' => now(),
        ]);

        return true;
    }

    /**
     * Release payment to executor
     */
    public function releasePayment(): bool
    {
        if (! in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_DELIVERED])) {
            return false;
        }

        return DB::transaction(function () {
            // Add amount to executor's balance
            $this->executor->increment('balance', $this->amount);

            // Create payment transaction record
            Transaction::create([
                'user_id' => $this->executor_id,
                'type' => 'earning',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Payment received for order: {$this->title}",
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
     * Cancel the order and refund creator
     */
    public function cancel(int $cancelledBy, ?string $reason = null): bool
    {
        if ($this->status === self::STATUS_PENDING) {
            // Just cancel, no refund needed
            $this->update([
                'status' => self::STATUS_CANCELLED,
                'cancelled_by' => $cancelledBy,
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);

            return true;
        }

        if (! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS])) {
            return false;
        }

        return DB::transaction(function () use ($cancelledBy, $reason) {
            // Refund amount to creator's balance
            $this->creator->increment('balance', $this->amount);

            // Create refund transaction record
            Transaction::create([
                'user_id' => $this->creator_id,
                'type' => 'refund',
                'amount' => $this->amount,
                'status' => 'completed',
                'payable_type' => OrderTransaction::class,
                'payable_id' => $this->id,
                'description' => "Refund for cancelled order: {$this->title}",
                'paid_at' => now(),
            ]);

            // Update order transaction
            $this->update([
                'status' => self::STATUS_REFUNDED,
                'cancelled_by' => $cancelledBy,
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);

            return true;
        });
    }

    /**
     * Raise a dispute
     */
    public function raiseDispute(int $raisedBy, string $reason): bool
    {
        if (! in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED])) {
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
        $isCreator = $this->creator_id === $userId;
        $isExecutor = $this->executor_id === $userId;

        return match ($action) {
            'accept' => $isExecutor && $this->status === self::STATUS_PENDING,
            'deliver' => $isExecutor && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS]),
            'complete' => $isCreator && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED]),
            'cancel' => ($isCreator || $isExecutor) && in_array($this->status, [self::STATUS_PENDING, self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS]),
            'dispute' => ($isCreator || $isExecutor) && in_array($this->status, [self::STATUS_ACCEPTED, self::STATUS_IN_PROGRESS, self::STATUS_DELIVERED]),
            default => false,
        };
    }

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
        ]);
    }
}
