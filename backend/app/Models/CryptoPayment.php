<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CryptoPayment extends Model
{
    protected $table = 'crypto_payments';

    protected $fillable = [
        'user_id',
        'invoice_id',
        'hash',
        'currency_type',
        'asset',
        'amount',
        'paid_asset',
        'paid_amount',
        'fee_amount',
        'fee_in_usd',
        'usd_rate',
        'paid_usd_rate',
        'pay_url',
        'bot_invoice_url',
        'mini_app_invoice_url',
        'web_app_invoice_url',
        'description',
        'status',
        'allow_comments',
        'allow_anonymous',
        'paid_anonymously',
        'created_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:8',
        'paid_amount' => 'decimal:8',
        'fee_amount' => 'decimal:8',
        'fee_in_usd' => 'decimal:8',
        'usd_rate' => 'decimal:8',
        'paid_usd_rate' => 'decimal:8',
        'allow_comments' => 'boolean',
        'allow_anonymous' => 'boolean',
        'paid_anonymously' => 'boolean',
        'created_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    /**
     * User bilan aloqasi
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Transaction bilan polymorphic aloqasi
     */
    public function transaction(): MorphOne
    {
        return $this->morphOne(Transaction::class, 'payable');
    }

    /**
     * To‘lov holatini tekshirish
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Anonim to‘lovmi?
     */
    public function wasPaidAnonymously(): bool
    {
        return (bool) $this->paid_anonymously;
    }
}
