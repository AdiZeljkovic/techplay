<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class FaqItem extends Model
{
    protected $fillable = [
        'faqable_type',
        'faqable_id',
        'question',
        'answer',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the parent faqable model (Article, Category, etc.)
     */
    public function faqable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope to only active FAQ items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Generate Schema.org FAQ structured data
     */
    public static function toSchemaOrg($items): array
    {
        if (empty($items) || count($items) === 0) {
            return [];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => collect($items)->map(fn($item) => [
                '@type' => 'Question',
                'name' => $item->question,
                'acceptedAnswer' => [
                    '@type' => 'Answer',
                    'text' => strip_tags($item->answer),
                ],
            ])->toArray(),
        ];
    }
}
