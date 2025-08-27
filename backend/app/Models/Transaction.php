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
    ];

    protected $casts = [
        'amount' => 'float',
        'type' => 'string', // deposit, withdrawal, access_purchase
        'status' => 'string', // pending, completed, rejected
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}