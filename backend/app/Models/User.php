<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

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
        'cover',
        'description',
        'banned',
        'last_deposit_at',
        'password',
        'is_admin',
        'referral_code',
        'referred_by',
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

    protected $appends = ['role_name', 'avatar_url', 'cover_url'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (!$user->referral_code) {
                $user->referral_code = self::generateUniqueReferralCode();
            }
        });
    }

    /**
     * Generate a unique referral code
     */
    public static function generateUniqueReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }

    public function getAvatarUrlAttribute()
    {
        if (filter_var($this->avatar, FILTER_VALIDATE_URL)) {
            return $this->avatar;
        }

        return $this->avatar ? asset('storage/'.$this->avatar) : null;
    }

    public function getCoverUrlAttribute()
    {
        if (filter_var($this->cover, FILTER_VALIDATE_URL)) {
            return $this->cover;
        }

        return $this->cover ? asset('storage/'.$this->cover) : null;
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

        if (! $this->last_deposit_at) {
            $result['message'] = 'You must make at least one deposit before requesting withdrawal.';
            return $result;
        }

        $daysSinceLastDeposit = $this->last_deposit_at->diffInDays(now());
        if ($daysSinceLastDeposit < 30) {
            $nextWithdrawalDate = $this->last_deposit_at->addDays(30);
            $result['message'] = 'Withdrawal is only available 30 days after your last deposit.';
            $result['days_remaining'] = 30 - $daysSinceLastDeposit;
            $result['next_withdrawal_date'] = $nextWithdrawalDate;
            return $result;
        }

        $pendingWithdrawal = $this->withdrawalRequests()
            ->where('status', 'pending')
            ->first();

        if ($pendingWithdrawal) {
            $result['message'] = 'You already have a pending withdrawal request.';
            $result['pending_request'] = $pendingWithdrawal;
            return $result;
        }

        if ($this->balance <= 0) {
            $result['message'] = 'Insufficient balance for withdrawal.';
            return $result;
        }

        $result['eligible'] = true;
        $result['message'] = 'You are eligible for withdrawal.';
        return $result;
    }

    public function getPendingWithdrawalRequest()
    {
        return $this->withdrawalRequests()
            ->where('status', WithdrawalRequest::STATUS_PENDING)
            ->first();
    }

    public function hasSufficientBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    public function getDaysSinceLastDeposit(): ?int
    {
        if (! $this->last_deposit_at) {
            return null;
        }
        return $this->last_deposit_at->diffInDays(now());
    }

    public function getNextWithdrawalDate(): ?\Carbon\Carbon
    {
        if (! $this->last_deposit_at) {
            return null;
        }
        return $this->last_deposit_at->addDays(30);
    }

    public function updateLastDepositDate(): void
    {
        $this->update(['last_deposit_at' => now()]);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function latestReview()
    {
        return $this->hasOne(Review::class)->latestOfMany();
    }

    public function conversationsAsUserOne(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_one_id');
    }

    public function conversationsAsUserTwo(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    // ==================== REFERRAL SYSTEM ====================

    /**
     * Get the user who referred this user
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    /**
     * Get all users referred by this user
     */
    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    /**
     * Get count of active referrals (not banned)
     */
    public function getActiveReferralsCount(): int
    {
        return $this->referrals()->where('banned', false)->count();
    }

    /**
     * Get total referrals count
     */
    public function getTotalReferralsCount(): int
    {
        return $this->referrals()->count();
    }

    /**
     * Check if this user was referred by another user
     */
    public function hasReferrer(): bool
    {
        return !is_null($this->referred_by);
    }

    /**
     * Get referral statistics
     */
    public function getReferralStats(): array
    {
        return [
            'total_referrals' => $this->getTotalReferralsCount(),
            'active_referrals' => $this->getActiveReferralsCount(),
            'banned_referrals' => $this->referrals()->where('banned', true)->count(),
            'recent_referrals' => $this->referrals()
                ->where('created_at', '>=', now()->subDays(30))
                ->count(),
        ];
    }
}