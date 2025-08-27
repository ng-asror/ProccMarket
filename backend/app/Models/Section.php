<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = [
        'name',
        'description',
        'access_price',
        'default_roles',
        'image',
    ];

    protected $casts = [
        'access_price' => 'float',
        'default_roles' => 'array',
    ];

    protected $appends = ['image_url'];

    public function topics()
    {
        return $this->hasMany(Topic::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'section_user')
                    ->withTimestamps();
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }
}