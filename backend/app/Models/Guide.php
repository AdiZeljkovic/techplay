<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
        'game_id',
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
     * Increment views with IP-based throttling.
     *
     * PERFORMANCE: Multi-layer throttling (cache + session + DB)
     * SECURITY: Prevents view count manipulation
     */
    public function incrementViews(string $ip, string $fingerprint): bool
    {
        // Layer 1: Cache-based throttling (fastest, 30 minutes)
        $cacheKey = "guide_view_{$this->id}_{$fingerprint}";

        if (Cache::has($cacheKey)) {
            return false;
        }

        // Layer 2: Session-based throttling
        $sessionKey = "viewed_guide_{$this->id}";
        $sessionData = session($sessionKey);

        if ($sessionData && now()->diffInMinutes($sessionData) < 30) {
            return false;
        }

        // Layer 3: Database throttling (ultimate fallback)
        $recentView = DB::table('guide_views')
            ->where('guide_id', $this->id)
            ->where('fingerprint', $fingerprint)
            ->where('created_at', '>', now()->subMinutes(30))
            ->exists();

        if ($recentView) {
            return false;
        }

        // Increment view count
        DB::table('guides')
            ->where('id', $this->id)
            ->update(['views' => DB::raw('COALESCE(views, 0) + 1')]);

        // Record view in tracking table (async, non-blocking)
        try {
            DB::table('guide_views')->insert([
                'guide_id' => $this->id,
                'ip_address' => $ip,
                'fingerprint' => $fingerprint,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Silently fail - view count already incremented
        }

        // Set throttle markers
        Cache::put($cacheKey, true, 30);
        session([$sessionKey => now()]);

        return true;
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
        Cache::forget("guide.show.{$guide->slug}");

        // Clear pagination cache for common combinations
        $difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
        $emptySearchHash = md5('');

        foreach ($difficulties as $diff) {
            // Clear first 5 pages for each difficulty
            for ($i = 1; $i <= 5; $i++) {
                Cache::forget("guides.index.page_{$i}.diff_{$diff}.search_{$emptySearchHash}");
            }
        }
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
