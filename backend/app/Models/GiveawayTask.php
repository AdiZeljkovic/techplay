<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GiveawayTask extends Model
{
    protected $fillable = [
        'giveaway_id',
        'type',
        'title',
        'description',
        'points',
        'url',
        'verification_type',
        'is_required',
        'is_repeatable',
        'sort_order',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_repeatable' => 'boolean',
    ];

    // Task type icons for frontend
    public const TYPE_ICONS = [
        'facebook_like' => '👍',
        'facebook_share' => '📢',
        'instagram_follow' => '📷',
        'youtube_subscribe' => '▶️',
        'twitter_follow' => '🐦',
        'twitter_retweet' => '🔁',
        'discord_join' => '💬',
        'visit_url' => '🔗',
        'share_giveaway' => '📤',
        'daily_visit' => '📅',
        'referral' => '👥',
        'forum_post' => '💬',
        'custom' => '⭐',
    ];

    // ─────────────────────────────────────────────────────────────
    // RELATIONSHIPS
    // ─────────────────────────────────────────────────────────────

    public function giveaway(): BelongsTo
    {
        return $this->belongsTo(Giveaway::class);
    }

    public function completions(): HasMany
    {
        return $this->hasMany(GiveawayTaskCompletion::class, 'task_id');
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    public function getIcon(): string
    {
        return self::TYPE_ICONS[$this->type] ?? '⭐';
    }

    public function isCompletedBy(GiveawayEntry $entry): bool
    {
        $query = $this->completions()->where('entry_id', $entry->id);

        if ($this->is_repeatable) {
            // For daily tasks, check if completed today
            return $query->whereDate('completed_date', today())->exists();
        }

        return $query->exists();
    }

    public function canBeCompletedBy(GiveawayEntry $entry): bool
    {
        if (! $this->is_repeatable) {
            return ! $this->isCompletedBy($entry);
        }

        // For repeatable tasks, can complete once per day
        return ! $this->completions()
            ->where('entry_id', $entry->id)
            ->whereDate('completed_date', today())
            ->exists();
    }
}
