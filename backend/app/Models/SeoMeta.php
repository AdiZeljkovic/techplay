<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SeoMeta extends Model
{
    protected $fillable = [
        'meta_title',
        'meta_description',
        'canonical_url',
        'og_image',
        'focus_keyword',
        'is_noindex',
        'is_nofollow',
        'schema_data',
    ];

    protected $casts = [
        'is_noindex' => 'boolean',
        'is_nofollow' => 'boolean',
        'schema_data' => 'array',
    ];

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get character count status for meta title
     */
    public function getTitleStatusAttribute(): string
    {
        $len = strlen($this->meta_title ?? '');
        if ($len === 0)
            return 'missing';
        if ($len < 30)
            return 'too_short';
        if ($len > 60)
            return 'too_long';
        return 'good';
    }

    /**
     * Get character count status for meta description
     */
    public function getDescriptionStatusAttribute(): string
    {
        $len = strlen($this->meta_description ?? '');
        if ($len === 0)
            return 'missing';
        if ($len < 120)
            return 'too_short';
        if ($len > 160)
            return 'too_long';
        return 'good';
    }
}
