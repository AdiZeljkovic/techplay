<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * One thing the advisor is allowed to say.
 *
 * @property string $key
 * @property string $producer
 * @property string $domain
 * @property string $title
 * @property string $body
 * @property array<int, array<string, mixed>>|null $requires
 * @property int $base_score
 * @property array<string, float>|null $weights
 * @property string $confidence
 * @property string|null $effort_band
 * @property string|null $needs_expansion
 */
class Gw2Rule extends Model
{
    protected $fillable = [
        'key', 'producer', 'domain', 'title', 'body', 'requires',
        'base_score', 'weights', 'confidence', 'effort_band',
        'needs_expansion', 'is_active', 'version', 'reviewed_at',
    ];

    protected $casts = [
        'requires' => 'array',
        'weights' => 'array',
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Confidence levels, weakest first.
     *
     * `hidden` is not a level so much as a retirement: a rule that turned out to
     * be wrong stops being drawn but keeps its row, so the reason it existed is
     * still on record. Deleting it would lose that.
     */
    public const CONFIDENCE = ['hidden', 'needs_confirmation', 'medium', 'high', 'confirmed'];

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)->where('confidence', '!=', 'hidden');
    }
}
