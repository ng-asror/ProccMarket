<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'telegram_id',
        'email',
        'role_id',
        'balance',
        'name',
        'avatar',
        'description',
        'banned',
        'last_deposit_at',
        'password',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'banned' => 'boolean',
            'is_admin' => 'boolean',
            'last_deposit_at' => 'datetime',
        ];
    }

    protected $appends = ['role_name', 'avatar_url'];

    public function getAvatarUrlAttribute()
    {
        if (filter_var($this->avatar, FILTER_VALIDATE_URL)) {
            return $this->avatar;
        }

        return $this->avatar ? asset('storage/'.$this->avatar) : null;
    }

    public function getRoleNameAttribute()
    {
        return ($this->role) ? $this->role->name : null;
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function sections()
    {
        return $this->belongsToMany(Section::class);
    }

    public function topics()
    {
        return $this->hasMany(Topic::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class);
    }

    /**
     * Get all purchased roles by this user
     */
    public function purchasedRoles()
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * Get roles through the pivot table
     */
    public function ownedRoles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot(['purchase_price', 'transaction_id', 'purchased_at'])
            ->withTimestamps()
            ->orderByPivot('purchased_at', 'desc');
    }

    /**
     * Check if user has purchased a specific role
     */
    public function hasPurchasedRole(int $roleId): bool
    {
        return $this->purchasedRoles()
            ->where('role_id', $roleId)
            ->exists();
    }

    /**
     * Check if user can afford a role
     */
    public function canAffordRole(Role $role): bool
    {
        return $this->balance >= $role->min_deposit;
    }

    /**
     * Get the highest role user owns
     */
    public function getHighestPurchasedRole(): ?Role
    {
        return $this->ownedRoles()
            ->orderBy('min_deposit', 'desc')
            ->first();
    }

    /**
     * Check if user is eligible for withdrawal
     */
    public function isEligibleForWithdrawal(): array
    {
        $result = [
            'eligible' => false,
            'message' => '',
            'days_remaining' => null,
            'next_withdrawal_date' => null,
        ];

        // Check if user has made a deposit
        if (! $this->last_deposit_at) {
            $result['message'] = 'You must make at least one deposit before requesting withdrawal.';

            return $result;
        }

        // Check 30 days rule
        $daysSinceLastDeposit = $this->last_deposit_at->diffInDays(now());
        if ($daysSinceLastDeposit < 30) {
            $nextWithdrawalDate = $this->last_deposit_at->addDays(30);

            $result['message'] = 'Withdrawal is only available 30 days after your last deposit.';
            $result['days_remaining'] = 30 - $daysSinceLastDeposit;
            $result['next_withdrawal_date'] = $nextWithdrawalDate;

            return $result;
        }

        // Check for pending requests
        $pendingWithdrawal = $this->withdrawalRequests()
            ->where('status', 'pending')
            ->first();

        if ($pendingWithdrawal) {
            $result['message'] = 'You already have a pending withdrawal request.';
            $result['pending_request'] = $pendingWithdrawal;

            return $result;
        }

        // Check balance
        if ($this->balance <= 0) {
            $result['message'] = 'Insufficient balance for withdrawal.';

            return $result;
        }

        // All checks passed
        $result['eligible'] = true;
        $result['message'] = 'You are eligible for withdrawal.';

        return $result;
    }

    /**
     * Get user's pending withdrawal request
     */
    public function getPendingWithdrawalRequest()
    {
        return $this->withdrawalRequests()
            ->where('status', WithdrawalRequest::STATUS_PENDING)
            ->first();
    }

    /**
     * Check if user has sufficient balance for withdrawal
     */
    public function hasSufficientBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * Get days since last deposit
     */
    public function getDaysSinceLastDeposit(): ?int
    {
        if (! $this->last_deposit_at) {
            return null;
        }

        return $this->last_deposit_at->diffInDays(now());
    }

    /**
     * Get next withdrawal available date
     */
    public function getNextWithdrawalDate(): ?\Carbon\Carbon
    {
        if (! $this->last_deposit_at) {
            return null;
        }

        return $this->last_deposit_at->addDays(30);
    }

    /**
     * Update last deposit date (call this when user makes a deposit)
     */
    public function updateLastDepositDate(): void
    {
        $this->update(['last_deposit_at' => now()]);
    }

    /**
     * Get the reviews for the user.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get the user's latest review.
     */
    public function latestReview()
    {
        return $this->hasOne(Review::class)->latestOfMany();
    }

    /**
     * Get all conversations where this user is participant one
     */
    public function conversationsAsUserOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    /**
     * Get all conversations where this user is participant two
     */
    public function conversationsAsUserTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    /**
     * Get all messages sent by this user
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
