<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    public function canAccessPanel(Panel $panel): bool
    {
        if ($panel->getId() === 'admin') {
            return $this->can('view admin panel') || $this->role === 'admin';
        }

        return true;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'display_name',
        'email',
        'password',
        'avatar_url',
        'bio',
        // 'role' removed from $fillable for security - set explicitly in controllers
        'xp',
        'gamertags',
        'pc_specs',
        'cookie_preferences',
        'paypal_subscription_id',
        'paypal_customer_id',
        'subscription_ends_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
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
            'is_banned' => 'boolean',
            'gamertags' => 'array',
            'pc_specs' => 'array',
            'settings' => 'array',
            'cookie_preferences' => 'array',
            'subscription_ends_at' => 'datetime',
        ];
    }

    public function rank()
    {
        return $this->belongsTo(Rank::class, 'rank_id');
    }

    public function achievements()
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withPivot('unlocked_at')
            ->withTimestamps();
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function nextRank()
    {
        return Rank::where('min_reputation', '>', $this->forum_reputation ?? 0)
            ->orderBy('min_reputation', 'asc')
            ->first();
    }

    public function articles()
    {
        return $this->hasMany(Article::class, 'author_id');
    }

    public function threads()
    {
        return $this->hasMany(Thread::class, 'author_id');
    }

    public function supports()
    {
        return $this->hasMany(UserSupport::class);
    }

    public function activeSupport()
    {
        return $this->hasOne(UserSupport::class)->where('status', 'active')->latest();
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'author_id');
    }
}
