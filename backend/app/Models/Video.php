<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Video extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'youtube_url',
        'thumbnail_url',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    /**
     * Extract YouTube ID from URL
     */
    public function getYoutubeIdAttribute(): ?string
    {
        // Simple regex to extract ID from standard YT urls
        // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
        $pattern = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i';

        if (preg_match($pattern, $this->youtube_url, $matches)) {
            return $matches[1];
        }

        return null; // or return the url if it's already an ID, but better to be strict
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::saved(function ($video) {
            self::clearCache($video);
        });

        static::deleted(function ($video) {
            self::clearCache($video);
        });
    }

    protected static function clearCache($video)
    {
        // Clear specific video cache
        \Illuminate\Support\Facades\Cache::forget("videos.{$video->slug}");

        // Clear pagination cache (brute force or tag based, here we assume specific naming)
        // Since we don't know exactly which pages are cached, we might need to clear all or use tags if driver supports it.
        // For file driver (common in dev), tags aren't supported. 
        // We will loop and clear first few pages as a heuristic or use a more aggressive approach if needed.
        // A better approach for simple pagination is just to specific keys if known. 
        // Or simply wait for TTL. But user wants instant feedback.

        // Let's iterate first 10 pages to be safe
        for ($i = 1; $i <= 10; $i++) {
            \Illuminate\Support\Facades\Cache::forget("videos.page_{$i}");
        }
    }
}
