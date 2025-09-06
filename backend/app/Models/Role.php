<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model {
    protected $fillable = [
        'name',
        'min_deposit',
    ];

    protected $casts = [
        'min_deposit' => 'decimal:2',
    ];

    protected $appends = ['users_count'];

    public function users() {
        return $this->hasMany(User::class);
    }

    public function getUsersCountAttribute() {
        return $this->users()->count();
    }
}