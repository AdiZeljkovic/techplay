<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
        'excerpt',
        'content',
        'category_id',
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
            return config('app.url') . $value;
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
     */
    public function incrementViews(string $ip): bool
    {
        $cacheKey = 'article_view_' . $this->id . '_' . $ip;

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return false;
        }

        // $this->increment('views');
        // \Illuminate\Support\Facades\Cache::put($cacheKey, true, 60 * 24);

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
