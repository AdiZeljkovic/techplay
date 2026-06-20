<?php

namespace App\Filament\Resources\PageSeoResource\Pages;

use App\Filament\Resources\PageSeoResource;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Cache;

class EditPageSeo extends EditRecord
{
    protected static string $resource = PageSeoResource::class;

    protected function afterSave(): void
    {
        // Clear page SEO caches
        Cache::forget('page_seo.all');
        $path = $this->record->page_path;
        Cache::forget('page_seo.path.'.md5($path));
    }
}
