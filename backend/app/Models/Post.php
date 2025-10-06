<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model {
    protected $fillable = [
        'topic_id',
        'user_id',
        'content',
        'image',
        'reply_id',
    ];

    public function reply()
    {
        return $this->belongsTo(Post::class, 'reply_id');
    }

    public function replies()
    {
        return $this->hasMany(Post::class, 'reply_id');
    }

    public function topic() {
        return $this->belongsTo(Topic::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function likes() {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function shares() {
        return $this->morphMany(Share::class, 'shareable');
    }
}