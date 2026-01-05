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
}
