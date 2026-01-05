<?php

namespace App\Filament\Resources\MediaResource\Pages;

use App\Filament\Resources\MediaResource;
use Filament\Resources\Pages\CreateRecord;

class CreateMedia extends CreateRecord
{
    protected static string $resource = MediaResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Auto-populate mime_type and size from the uploaded file
        if (isset($data['path'])) {
            $path = storage_path('app/public/' . $data['path']);
            if (file_exists($path)) {
                $data['mime_type'] = mime_content_type($path);
                $data['size'] = filesize($path);
            }
        }
        return $data;
    }
}
