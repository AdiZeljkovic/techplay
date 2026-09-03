<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A topic in the help centre — the thing a reader picks before they read.
 */
class HelpCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];

    public function articles(): HasMany
    {
        return $this->hasMany(HelpArticle::class);
    }

    /** Topics a reader is allowed to see. */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
