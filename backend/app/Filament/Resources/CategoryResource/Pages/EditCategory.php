<?php

namespace App\Filament\Resources\CategoryResource\Pages;

use App\Filament\Resources\CategoryResource;
use App\Models\PageSeo;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCategory extends EditRecord
{
    protected static string $resource = CategoryResource::class;

    /**
     * The SEO tab's four fields belong to `page_seo`, not to `categories`.
     *
     * They are named `page_seo_*` so nothing tries to write them onto the
     * category row, and they are lifted out again before the save. See the
     * comment on the tab in CategoryResource for why they moved.
     *
     * @var array<string, mixed>
     */
    protected array $seo = [];

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $path = $this->getRecord()->seoPagePath();

        if ($path === null) {
            return $data;
        }

        $row = PageSeo::where('page_path', $path)->first();

        $data['page_seo_title'] = $row?->meta_title;
        $data['page_seo_description'] = $row?->meta_description;
        $data['page_seo_canonical'] = $row?->canonical_url;
        $data['page_seo_noindex'] = (bool) ($row?->is_noindex ?? false);

        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
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

    protected function afterSave(): void
    {
        $path = $this->getRecord()->seoPagePath();

        if ($path === null || $this->seo === []) {
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

        // Without this the endpoint keeps serving the previous wording for an
        // hour and the edit looks like it did nothing — the mistake this file's
        // sibling commands were written to stop repeating.
        PageSeo::forgetCache($path);
    }
}
