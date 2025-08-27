<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopicView extends Model
{
    use HasFactory;

    protected $fillable = [
        'topic_id',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    /**
     * Topic bilan bog'lanish
     */
    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * User bilan bog'lanish
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}