<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guide extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image_url',
        'difficulty', // beginner, intermediate, advanced
        'author_id',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'status',
        'published_at',
    ];

    protected $casts = [
        'is_noindex' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(GuideVote::class);
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saved(function ($guide) {
            self::clearCache($guide);
        });

        static::deleted(function ($guide) {
            self::clearCache($guide);
        });
    }

    protected static function clearCache($guide)
    {
        // Clear specific guide cache
        \Illuminate\Support\Facades\Cache::forget("guide.show.{$guide->slug}");

        // Clear pagination cache for common combinations
        $difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
        $emptySearchHash = md5('');

        foreach ($difficulties as $diff) {
            // Clear first 5 pages for each difficulty
            for ($i = 1; $i <= 5; $i++) {
                \Illuminate\Support\Facades\Cache::forget("guides.index.page_{$i}.diff_{$diff}.search_{$emptySearchHash}");
            }
        }
    }
}
