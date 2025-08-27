<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */

    protected $fillable = [
        'telegram_id',
        'email',
        'role_id',
        'balance',
        'name',
        'avatar',
        'banned',
        'last_deposit_at',
        'password',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password'
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'float',
            'banned' => 'boolean',
            'last_deposit_at' => 'datetime',
        ];
    }

    protected $appends = ['role_name'];

    public function getRoleNameAttribute()
    {
        return ($this->role) ? $this->role->name : null;
    }

    public function role() {
        return $this->belongsTo(Role::class);
    }

    public function sections() {
        return $this->belongsToMany(Section::class);
    }

    public function topics() {
        return $this->hasMany(Topic::class);
    }

    public function posts() {
        return $this->hasMany(Post::class);
    }

    public function transactions() {
        return $this->hasMany(Transaction::class);
    }

    public function withdrawalRequests() {
        return $this->hasMany(WithdrawalRequest::class);
    }
}
