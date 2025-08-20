<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model {
    protected $fillable = [
        'section_id',
        'user_id',
        'title',
        'closed',
    ];

    protected $casts = [
        'closed' => 'boolean',
    ];

    public function section() {
        return $this->belongsTo(Section::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function posts() {
        return $this->hasMany(Post::class);
    }
}