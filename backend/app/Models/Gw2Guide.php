<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A public Guild Wars 2 guide that knows your account when you have one.
 *
 * §20 of the working document: *"The strongest acquisition model is public,
 * indexable guide pages that become personalized after account connection.
 * Private dashboards themselves do not rank."*
 *
 * @property string $family
 * @property string $slug
 * @property string|null $personalise_as
 */
class Gw2Guide extends Model
{
    protected $fillable = [
        'family', 'slug', 'title', 'standfirst', 'body', 'personalise_as', 'next_steps',
        'seo_title', 'seo_description', 'keywords', 'hero_image',
        'owner', 'source_ids', 'game_build', 'reviewed_at',
        'is_published', 'sort_order',
    ];

    protected $casts = [
        'next_steps' => 'array',
        'keywords' => 'array',
        'source_ids' => 'array',
        'is_published' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    /**
     * The nine families §20.1 names, plus the one this tool already had.
     *
     * A list rather than free text so a typo cannot create a tenth family with
     * one page in it that nothing links to.
     */
    public const FAMILIES = [
        'progression' => 'Progression (pillar)',
        'level-80' => 'Level 80 — what next',
        'fractals' => 'Fractals',
        'masteries' => 'Masteries',
        'achievements' => 'Achievements',
        'goals' => 'Goals',
        'mounts' => 'Mounts',
        'legendary' => 'Legendary',
        'wizards-vault' => "Wizard's Vault",
    ];

    /**
     * What a guide can ask the reader's account for.
     *
     * Each one is a number the advisor already computes. Adding to this list
     * means writing the resolver that answers it — a guide naming a key nothing
     * resolves renders as though it had none, which is the right failure but
     * not one to invite.
     */
    public const PERSONALISATIONS = [
        'agony' => 'Your Agony Resistance against the Tier 4 target',
        'ascended-set' => 'Which of your core slots are below ascended',
        'masteries' => 'Your mastery points by region, and what they reach',
        'vault' => "What is still open in your Wizard's Vault",
        'raids' => 'What you have cleared this week and since connecting',
        'next-steps' => 'Your top three recommendations right now',
    ];

    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /** `/gw2/fractals/agony-resistance`, or `/gw2/level-80-what-next` for a family of one. */
    public function path(): string
    {
        return "/gw2/{$this->family}/{$this->slug}";
    }
}
