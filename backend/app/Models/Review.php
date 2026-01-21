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
     */
    public function incrementViews(string $ip): bool
    {
        $cacheKey = 'review_view_' . $this->id . '_' . $ip;

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return false;
        }

        // Use raw DB query with COALESCE to handle NULL values
        \Illuminate\Support\Facades\DB::table('reviews')
            ->where('id', $this->id)
            ->update(['views' => \Illuminate\Support\Facades\DB::raw('COALESCE(views, 0) + 1')]);

        // Throttle for 60 minutes (1 hour)
        \Illuminate\Support\Facades\Cache::put($cacheKey, true, 60);

        return true;
    }
}
