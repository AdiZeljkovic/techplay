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

        // Deny by default. There is only one panel today, so the old `return
        // true` cost nothing — but it meant a second panel would ship open to
        // every authenticated user, and nobody would notice until it mattered.
        return false;
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
        'rank_id',          // Added for Observer updates
        // 'role' removed from $fillable for security - set explicitly in controllers
        //
        // Nor are 'xp', 'bounty_balance' and 'forum_reputation'. They are the
        // economy: everything that moves them goes through XpService,
        // BountyService or an explicit increment(), all of which apply caps,
        // cooldowns and a ledger. Leaving them mass-assignable meant the whole
        // system was one careless $user->update($validated) away from being
        // free — and that line is easy to write by accident. Factories are
        // unaffected; Laravel creates models unguarded.
        'gamertags',
        'pc_specs',
        'cookie_preferences',
        'paypal_subscription_id',
        'paypal_customer_id',
        'subscription_ends_at',
        'last_seen_at',
        'discord_id',
        'discord_avatar',
        'last_daily_claim',
        'daily_streak',
        'author_slug',
        'author_social_links',
        'battlenet_id',
        'battlenet_region',
        'battletag',
        'post_color',
        'profile_visibility',
        'email_notifications',
    ];

    /** Only accepted friends may open the profile. */
    public const VISIBILITY_FRIENDS = 'friends';

    public const VISIBILITY_PUBLIC = 'public';

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

    /**
     * The cover image as something a browser can load.
     *
     * The column holds a path relative to the public disk for anything
     * uploaded here, but older rows hold a full url. Three places used to work
     * this out for themselves and a fourth — the resource the logged-in user is
     * built from — did not expose the field at all, which is why uploading a
     * cover appeared to do nothing.
     */
    public function coverImageUrl(): ?string
    {
        if (blank($this->cover_image)) {
            return null;
        }

        return str_starts_with($this->cover_image, 'http')
            ? $this->cover_image
            : asset('storage/'.$this->cover_image);
    }

    public function nextRank()
    {
        return Rank::where('min_xp', '>', $this->xp ?? 0)
            ->orderBy('min_xp', 'asc')
            ->first();
    }

    /**
     * A private profile hides the *aggregates* (collection, stats, activity,
     * achievements) from strangers. It never unpublishes forum posts,
     * comments or reviews — those were posted to public pages.
     */
    public function hasPrivateProfile(): bool
    {
        return ($this->profile_visibility ?? self::VISIBILITY_PUBLIC) === self::VISIBILITY_FRIENDS;
    }

    /* ── who is staff ─────────────────────────────────────────────────────
     *
     * One scheme, in one place. Before this, twenty-two files each carried
     * their own hardcoded list of role names, and every one of them also
     * consulted the legacy `users.role` string — so the same question got
     * different answers depending on which endpoint asked it. An
     * Editor-in-Chief could delete a whole forum thread but not edit a single
     * post inside it; a Moderator could lock a thread but the comment policy
     * did not recognise them at all.
     *
     * Spatie is now the only source. The `role` column is left in the table as
     * historical data and is no longer read for authorization — a migration
     * gave a Spatie role to anyone who had power only through it.
     */

    /** Full control: the panel, the money, the configuration. */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['Super Admin', 'Admin']);
    }

    /** Writes and publishes: articles, reviews, guides, the game database. */
    public function isEditorialStaff(): bool
    {
        return $this->hasAnyRole(['Super Admin', 'Admin', 'Editor-in-Chief', 'Editor', 'Journalist']);
    }

    /** Keeps the discussion in order: threads, posts, comments, reports. */
    public function isForumModerator(): bool
    {
        return $this->hasAnyRole(['Super Admin', 'Admin', 'Editor-in-Chief', 'Moderator']);
    }

    /** On the team in any capacity — for bylines and staff badges, not for gates. */
    public function isStaff(): bool
    {
        return $this->isEditorialStaff() || $this->isForumModerator();
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
        // `status` alone is not "active": nothing ever flips a lapsed pledge,
        // so a single month of support unlocked every tier-gated cosmetic
        // permanently. PremiumService has always checked the date; the
        // cosmetic gate did not.
        return $this->hasOne(UserSupport::class)
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest();
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

    public function integrations()
    {
        return $this->hasMany(UserIntegration::class);
    }
}
