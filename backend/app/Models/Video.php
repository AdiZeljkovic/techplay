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
}
