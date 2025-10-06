<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Topic extends Model {
    protected $fillable = [
        'section_id',
        'user_id',
        'title',
        'content',
        'image',
        'closed',
    ];

    protected $casts = [
        'closed' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        return $this->image ? asset('storage/' . $this->image) : null;
    }


    public function section() {
        return $this->belongsTo(Section::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function posts() {
        return $this->hasMany(Post::class);
    }

    public function likes() {
        return $this->morphMany(Like::class, 'likeable');
    }

    public function shares() {
        return $this->morphMany(Share::class, 'shareable');
    }

    public function views()
    {
        return $this->morphMany(View::class, 'viewable');
    }
}