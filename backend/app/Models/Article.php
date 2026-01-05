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
        'tags' => 'array',
    ];

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
