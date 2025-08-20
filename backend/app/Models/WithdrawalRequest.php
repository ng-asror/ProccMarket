<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WithdrawalRequest extends Model {
    protected $fillable = [
        'user_id',
        'amount',
        'requisites',
        'status',
        'reason',
    ];

    protected $casts = [
        'amount' => 'decimal:0',
        'status' => 'string', // pending, approved, rejected
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }
}