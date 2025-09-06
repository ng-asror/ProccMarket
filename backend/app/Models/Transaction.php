<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model {
    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'status',
        'transaction_id',
        'description',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'type' => 'string', // deposit, withdrawal, access_purchase
        'status' => 'string', // pending, completed, rejected
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function payable()
    {
        return $this->morphTo();
    }
}