<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guide extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image_url',
        'difficulty', // beginner, intermediate, advanced
        'author_id',
        'seo_title',
        'seo_description',
        'focus_keyword',
        'canonical_url',
        'is_noindex',
        'status',
        'published_at',
    ];

    protected $casts = [
        'is_noindex' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(GuideVote::class);
    }
}
