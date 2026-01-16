<?php

namespace App\Models\Traits;

use App\Models\FaqItem;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasFaq
{
    /**
     * Get all FAQ items for this model.
     */
    public function faqItems(): MorphMany
    {
        return $this->morphMany(FaqItem::class, 'faqable');
    }

    /**
     * Get active, ordered FAQ items.
     */
    public function activeFaq()
    {
        return $this->faqItems()->active()->ordered()->get();
    }

    /**
     * Get FAQ Schema.org structured data.
     */
    public function getFaqSchema(): array
    {
        $items = $this->activeFaq();
        return FaqItem::toSchemaOrg($items);
    }
}
