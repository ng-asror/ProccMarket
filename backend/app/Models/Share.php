<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Share extends Model {
    protected $fillable = ['user_id', 'platform', 'shareable_id', 'shareable_type'];

    public function shareable() {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}