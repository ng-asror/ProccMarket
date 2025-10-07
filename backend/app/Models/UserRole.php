<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'role_id',
        'purchase_price',
        'transaction_id',
        'purchased_at',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    protected $with = ['role'];

    /**
     * Get the user that owns this role purchase
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the role that was purchased
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the transaction associated with this purchase
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Scope to get roles purchased in a date range
     */
    public function scopePurchasedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('purchased_at', [$startDate, $endDate]);
    }

    /**
     * Scope to get recent purchases
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('purchased_at', '>=', now()->subDays($days));
    }
}