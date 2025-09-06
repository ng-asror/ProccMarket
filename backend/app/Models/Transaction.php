<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'status',
        'transaction_id',
        'description',
        'paid_at',
        'payable_type',
        'payable_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    // Transaction types
    const TYPE_DEPOSIT = 'deposit';
    const TYPE_WITHDRAWAL = 'withdrawal';
    const TYPE_ACCESS_PURCHASE = 'access_purchase';
    const TYPE_ADMIN_ADJUSTMENT = 'admin_adjustment';

    // Transaction statuses
    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_REJECTED = 'rejected';

    /**
     * Get the user that owns the transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the owning payable model (polymorphic)
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for rejected transactions
     */
    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    /**
     * Scope for deposit transactions
     */
    public function scopeDeposits($query)
    {
        return $query->where('type', self::TYPE_DEPOSIT);
    }

    /**
     * Scope for withdrawal transactions
     */
    public function scopeWithdrawals($query)
    {
        return $query->where('type', self::TYPE_WITHDRAWAL);
    }

    /**
     * Scope for positive admin adjustments
     */
    public function scopePositiveAdjustments($query)
    {
        return $query->where('type', self::TYPE_ADMIN_ADJUSTMENT)
                    ->where('amount', '>', 0);
    }

    /**
     * Scope for negative admin adjustments
     */
    public function scopeNegativeAdjustments($query)
    {
        return $query->where('type', self::TYPE_ADMIN_ADJUSTMENT)
                    ->where('amount', '<', 0);
    }

    /**
     * Scope for income transactions (deposits + positive adjustments)
     */
    public function scopeIncome($query)
    {
        return $query->where(function ($q) {
            $q->where('type', self::TYPE_DEPOSIT)
              ->orWhere(function ($subQuery) {
                  $subQuery->where('type', self::TYPE_ADMIN_ADJUSTMENT)
                           ->where('amount', '>', 0);
              });
        });
    }

    /**
     * Scope for expense transactions (withdrawals + purchases + negative adjustments)
     */
    public function scopeExpenses($query)
    {
        return $query->where(function ($q) {
            $q->where('type', self::TYPE_WITHDRAWAL)
              ->orWhere('type', self::TYPE_ACCESS_PURCHASE)
              ->orWhere(function ($subQuery) {
                  $subQuery->where('type', self::TYPE_ADMIN_ADJUSTMENT)
                           ->where('amount', '<', 0);
              });
        });
    }

    /**
     * Check if transaction is positive (increases balance)
     */
    public function isPositive(): bool
    {
        return $this->type === self::TYPE_DEPOSIT || 
               ($this->type === self::TYPE_ADMIN_ADJUSTMENT && $this->amount > 0);
    }

    /**
     * Check if transaction is negative (decreases balance)
     */
    public function isNegative(): bool
    {
        return !$this->isPositive();
    }

    /**
     * Get transaction type label
     */
    public function getTypeLabel(): string
    {
        return match($this->type) {
            self::TYPE_DEPOSIT => 'Deposit',
            self::TYPE_WITHDRAWAL => 'Withdrawal',
            self::TYPE_ACCESS_PURCHASE => 'Access Purchase',
            self::TYPE_ADMIN_ADJUSTMENT => 'Admin Adjustment',
            default => ucfirst($this->type),
        };
    }

    /**
     * Get transaction status label
     */
    public function getStatusLabel(): string
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_REJECTED => 'Rejected',
            default => ucfirst($this->status),
        };
    }

    /**
     * Get formatted amount with sign
     */
    public function getFormattedAmountAttribute(): string
    {
        $sign = $this->isPositive() ? '+' : '-';
        return $sign . '$' . number_format(abs($this->amount), 2);
    }

    /**
     * Get short transaction ID for display
     */
    public function getShortTransactionIdAttribute(): string
    {
        if (!$this->transaction_id) {
            return '—';
        }
        
        return strlen($this->transaction_id) > 12 
            ? substr($this->transaction_id, 0, 12) . '...'
            : $this->transaction_id;
    }
}