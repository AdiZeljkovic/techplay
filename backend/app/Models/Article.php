<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
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
        'featured_image_width',
        'featured_image_height',
        'featured_video_url',
        'excerpt',
        'content',
        'category_id',
        'game_id',
        'is_featured_in_hero',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
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
}
