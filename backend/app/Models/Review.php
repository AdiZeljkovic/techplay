<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'author_id',
        'title',
        'slug',
        'item_name',
        'category',
        'summary',
        'content',
        'cover_image',
        'scores',
        'pros',
        'cons',
        'specs',
        'rating',
        'published_at',
        'status',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'review_score',
        'review_data',
    ];

    protected $casts = [
        'scores' => 'array',
        'pros' => 'array',
        'cons' => 'array',
        'specs' => 'array',
        'rating' => 'float',
        'published_at' => 'datetime',
        'is_noindex' => 'boolean',
        'review_data' => 'array',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
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
        $cacheKey = "review_view_{$this->id}_{$fingerprint}";

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return false;
        }

        // Layer 2: Session-based throttling
        $sessionKey = "viewed_review_{$this->id}";
        $sessionData = session($sessionKey);

        if ($sessionData && now()->diffInMinutes($sessionData) < 30) {
            return false;
        }

        // Layer 3: Database throttling (ultimate fallback)
        $recentView = \Illuminate\Support\Facades\DB::table('review_views')
            ->where('review_id', $this->id)
            ->where('fingerprint', $fingerprint)
            ->where('created_at', '>', now()->subMinutes(30))
            ->exists();

        if ($recentView) {
            return false;
        }

        // Increment view count
        \Illuminate\Support\Facades\DB::table('reviews')
            ->where('id', $this->id)
            ->update(['views' => \Illuminate\Support\Facades\DB::raw('COALESCE(views, 0) + 1')]);

        // Record view in tracking table (async, non-blocking)
        try {
            \Illuminate\Support\Facades\DB::table('review_views')->insert([
                'review_id' => $this->id,
                'ip_address' => $ip,
                'fingerprint' => $fingerprint,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Silently fail - view count already incremented
        }

        // Set throttle markers
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 30);
        session([$sessionKey => now()]);

        return true;
    }
}
