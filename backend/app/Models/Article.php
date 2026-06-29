<?php

namespace App\Models;

use App\Observers\ArticleObserver;
use App\Observers\ArticleVersionObserver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'views',
        'author_id',
        'featured_image_url',
        'featured_image_alt',
        'featured_video_url',
        'excerpt',
        'content',
        'category_id',
        'game_id',
        'is_featured_in_hero',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'is_featured',
        'status',
        'published_at',
        'meta_title',
        'meta_description',
        'review_score',
        'review_data',
        'tags',
        'reading_time',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_featured_in_hero' => 'boolean',
        'published_at' => 'datetime',
        'review_data' => 'array',
        'review_score' => 'decimal:1',
        'tags' => 'array',
        'views' => 'integer',
        'reading_time' => 'integer',
    ];

    /**
     * Get the full URL for the featured image.
     */
    public function getFeaturedImageUrlAttribute($value): ?string
    {
        // Handle null or empty values
        if (empty($value)) {
            return null;
        }

        // Already a full URL
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        // Already has /storage/ prefix (legacy format) - convert to full URL
        if (str_starts_with($value, '/storage/')) {
            return config('app.url').$value;
        }

        // Relative path - convert using Storage facade
        return Storage::disk('public')->url($value);
    }

    public function scopePopular($query)
    {
        return $query->orderBy('views', 'desc');
    }

    /**
     * Increment views with IP-based throttling.
     *
     * PERFORMANCE: Multi-layer throttling (cache + session + DB)
     * SECURITY: Prevents view count manipulation
     *
     * @param  string  $ip  User IP address
     * @param  string  $fingerprint  User fingerprint (IP + User Agent hash)
     * @return bool Whether view was counted
     */
    public function incrementViews(string $ip, string $fingerprint): bool
    {
        // Layer 1: Cache-based throttling (fastest, 30 minutes)
        $cacheKey = "article_view_{$this->id}_{$fingerprint}";

        if (Cache::has($cacheKey)) {
            return false;
        }

        // Layer 2: Session-based throttling (backup if cache fails)
        $sessionKey = "viewed_article_{$this->id}";
        $sessionData = session($sessionKey);

        if ($sessionData && now()->diffInMinutes($sessionData) < 30) {
            return false;
        }

        // Layer 3: Database throttling (ultimate fallback, check last 30 min)
        // Only for paranoid cases where cache AND session both fail
        $recentView = DB::table('article_views')
            ->where('article_id', $this->id)
            ->where('fingerprint', $fingerprint)
            ->where('created_at', '>', now()->subMinutes(30))
            ->exists();

        if ($recentView) {
            return false;
        }

        // Increment view count
        DB::table('articles')
            ->where('id', $this->id)
            ->update(['views' => DB::raw('COALESCE(views, 0) + 1')]);

        // Record view in tracking table (async, non-blocking)
        try {
            DB::table('article_views')->insert([
                'article_id' => $this->id,
                'ip_address' => $ip,
                'fingerprint' => $fingerprint,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Silently fail if table doesn't exist or insert fails
            // View count already incremented, this is just for analytics
        }

        // Set throttle markers
        Cache::put($cacheKey, true, 30); // 30 minutes
        session([$sessionKey => now()]);

        return true;
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function versions()
    {
        return $this->morphMany(ContentVersion::class, 'versionable')->latest();
    }

    protected static function booted(): void
    {
        static::observe(ArticleVersionObserver::class);
        static::observe(ArticleObserver::class);
    }
}
