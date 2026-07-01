<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser, MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

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
        'name',
        'username',
        'display_name',
        'email',
        'password',
        'avatar_url',
        'cover_image',
        'bio',
        'location',
        'tagline',
        'playstyle_tags',
        'forum_reputation', // Added for Observer updates
        'rank_id',          // Added for Observer updates
        // 'role' removed from $fillable for security - set explicitly in controllers
        'xp',
        'bounty_balance',
        'gamertags',
        'pc_specs',
        'cookie_preferences',
        'paypal_subscription_id',
        'paypal_customer_id',
        'subscription_ends_at',
        'last_seen_at',
        'discord_id',
        'discord_token',
        'discord_refresh_token',
        'discord_avatar',
        'last_daily_claim',
        'daily_streak',
        'author_slug',
        'author_social_links',
        'battlenet_id',
        'battlenet_token',
        'battlenet_refresh_token',
        'battlenet_region',
        'battletag',
        'post_color',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        // 'email' removed - needed for authenticated user's own settings page
        'email_verified_at',        // Internal
        'two_factor_secret',        // Security
        'two_factor_recovery_codes', // Security
        'paypal_subscription_id',   // Payment sensitive
        'paypal_customer_id',       // Payment sensitive
        'subscription_ends_at',     // Internal
        'is_banned',                // Internal moderation
        'ban_reason',               // Internal moderation
        'banned_until',             // Internal moderation
        'cookie_preferences',       // Private
        'settings',                 // Private
        'updated_at',               // Not needed publicly
        'discord_token',            // Security
        'discord_refresh_token',    // Security
        'battlenet_token',          // Security
        'battlenet_refresh_token',  // Security
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
            'banned_until' => 'datetime',
            'gamertags' => 'array',
            'pc_specs' => 'array',
            'playstyle_tags' => 'array',
            'settings' => 'array',
            'cookie_preferences' => 'array',
            'author_social_links' => 'array',
            'subscription_ends_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'last_daily_claim' => 'datetime',
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

    public function userGames()
    {
        return $this->hasMany(UserGame::class);
    }

    public function games()
    {
        return $this->belongsToMany(Game::class, 'user_games')
            ->withPivot(['status', 'is_favorite', 'progress', 'hours_played', 'platform', 'started_at', 'completed_at'])
            ->withTimestamps();
    }

    public function gameLists()
    {
        return $this->hasMany(GameList::class);
    }

    public function customizations()
    {
        return $this->belongsToMany(Customization::class, 'user_customizations')
            ->withPivot(['is_equipped', 'acquired_via'])
            ->withTimestamps();
    }

    public function userCustomizations()
    {
        return $this->hasMany(UserCustomization::class);
    }

    public function bountyTransactions()
    {
        return $this->hasMany(BountyTransaction::class);
    }

    public function rewardRedemptions()
    {
        return $this->hasMany(RewardRedemption::class);
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function sentEditorialMessages()
    {
        return $this->hasMany(EditorialMessage::class, 'user_id');
    }

    public function receivedEditorialMessages()
    {
        return $this->hasMany(EditorialMessage::class, 'recipient_id');
    }

    public function nextRank()
    {
        return Rank::where('min_xp', '>', $this->xp ?? 0)
            ->orderBy('min_xp', 'asc')
            ->first();
    }

    public function isCurrentlyBanned(): bool
    {
        return $this->is_banned || ($this->banned_until && $this->banned_until->isFuture());
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

    public function watchedThreads()
    {
        return $this->belongsToMany(Thread::class, 'thread_watchers', 'user_id', 'thread_id')->withTimestamps();
    }

    public function bookmarkedThreads()
    {
        return $this->belongsToMany(Thread::class, 'thread_bookmarks', 'user_id', 'thread_id')->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function wowCharacters()
    {
        return $this->hasMany(WowCharacter::class);
    }

    public function mainWowCharacter()
    {
        return $this->hasOne(WowCharacter::class)->where('is_main', true);
    }
}
