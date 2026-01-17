<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Article extends Model
{
    use HasFactory;
    protected $fillable = [
        'title',
        'slug',
        'views', // Added views
        'author_id',
        'featured_image_url',
        'excerpt',
        'content',
        'category_id', // Foreign key
        'is_featured_in_hero',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'is_featured', // Keep existing legacy flag if used elsewhere
        'status',
        'published_at',
        'meta_title',
        'meta_description',
        'review_score',
        'review_data',
        'tags',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_featured_in_hero' => 'boolean',
        'published_at' => 'datetime',
        'review_data' => 'array',
        'review_score' => 'decimal:1',
        'tags' => 'array',
        'views' => 'integer',
    ];

    public function scopePopular($query)
    {
        return $query->orderBy('views', 'desc');
    }

    /**
     * Increment views with IP-based throttling.
     * 
     * @param string $ip
     * @return bool True if incremented, False if throttled
     */
    public function incrementViews(string $ip): bool
    {
        $cacheKey = 'article_view_' . $this->id . '_' . $ip;

        // Check if viewed in last 24 hours (1440 minutes)
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return false;
        }

        // Increment and cache
        $this->increment('views');
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 60 * 24); // 24 hours

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

    public function comments()
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}
