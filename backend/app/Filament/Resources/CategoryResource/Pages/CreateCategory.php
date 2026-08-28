<?php

namespace App\Filament\Resources\CategoryResource\Pages;

use App\Filament\Resources\CategoryResource;
use App\Models\PageSeo;
use Filament\Resources\Pages\CreateRecord;

class CreateCategory extends CreateRecord
{
    protected static string $resource = CategoryResource::class;

    /**
     * Same split as EditCategory: the SEO tab writes to `page_seo`, so its
     * fields are lifted out of the payload before the category is created and
     * written afterwards, once the slug and type exist to build the path from.
     *
     * @var array<string, mixed>
     */
    protected array $seo = [];

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        foreach (['title', 'description', 'canonical', 'noindex'] as $field) {
            $key = 'page_seo_'.$field;

            if (array_key_exists($key, $data)) {
                $this->seo[$field] = $data[$key];
                unset($data[$key]);
            }
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        $path = $this->getRecord()->seoPagePath();

        // A new category with nothing typed into the SEO tab gets no row. The
        // page then falls back to the wording in the route, which is the same
        // thing an empty row would produce, without a blank record to explain.
        if ($path === null || $this->seo === [] || blank($this->seo['title'] ?? null)) {
            return;
        }

        PageSeo::updateOrCreate(
            ['page_path' => $path],
            [
                'page_name' => $this->getRecord()->name,
                'meta_title' => $this->seo['title'] ?? null,
                'meta_description' => $this->seo['description'] ?? null,
                'canonical_url' => $this->seo['canonical'] ?? null,
                'is_noindex' => (bool) ($this->seo['noindex'] ?? false),
            ],
        );

        PageSeo::forgetCache($path);
    }
}
