<?php

namespace App\Traits;

use App\Models\SeoMeta;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasSeoMeta
{
    public function seoMeta(): MorphOne
    {
        return $this->morphOne(SeoMeta::class, 'seoable');
    }

    /**
     * Get or create SEO meta for this model
     */
    public function getOrCreateSeoMeta(): SeoMeta
    {
        return $this->seoMeta ?? $this->seoMeta()->create([]);
    }

    /**
     * Get the effective meta title (custom or fallback to model title)
     */
    public function getEffectiveMetaTitle(): string
    {
        return $this->seoMeta?->meta_title
            ?? $this->meta_title
            ?? $this->title
            ?? $this->name
            ?? '';
    }

    /**
     * Get the effective meta description
     */
    public function getEffectiveMetaDescription(): string
    {
        return $this->seoMeta?->meta_description
            ?? $this->meta_description
            ?? $this->excerpt
            ?? '';
    }

    /**
     * Check if this page should be noindexed
     */
    public function shouldNoindex(): bool
    {
        return $this->seoMeta?->is_noindex ?? false;
    }

    /**
     * Get canonical URL
     */
    public function getCanonicalUrl(): ?string
    {
        return $this->seoMeta?->canonical_url;
    }
}
