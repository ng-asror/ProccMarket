<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class View extends Model
{
    use HasFactory;

    protected $fillable = [
        'viewable_id',
        'viewable_type',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    /**
     * View qilingan model bilan bog'lanish (polymorphic)
     */
    public function viewable()
    {
        return $this->morphTo();
    }

    /**
     * User bilan bog'lanish
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}