<?php

namespace App\Filament\Components;

use App\Models\Media;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Placeholder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\HtmlString;

class MediaPickerFields
{
    /**
     * Create a Media Picker field group with upload OR select from library
     */
    public static function make(
        string $pathField = 'featured_image_url',
        string $altField = 'featured_image_alt',
        string $collection = 'articles'
    ): array {
        return [
            // Režim odabira - Upload ili Library
            Select::make('_media_mode')
                ->label('Image Source')
                ->options([
                    'upload' => '📤 Upload New Image',
                    'library' => '📚 Choose from Library',
                ])
                ->default('upload')
                ->live()
                ->native(false)
                ->dehydrated(false),

            // Upload new image
            FileUpload::make($pathField)
                ->label('Featured Image')
                ->image()
                ->disk('public')
                ->directory($collection)
                ->imageEditor()
                ->imageEditorAspectRatios([
                    '16:9',
                    '4:3',
                    '1:1',
                ])
                ->maxSize(2048)
                ->helperText('Recommended: 1200×630px for social sharing')
                ->visible(fn($get) => $get('_media_mode') !== 'library'),

            // Select from library
            Select::make('_media_library_select')
                ->label('Select from Library')
                ->searchable()
                ->options(function () {
                    return Media::query()
                        ->orderBy('created_at', 'desc')
                        ->limit(100)
                        ->get()
                        ->mapWithKeys(function ($media) {
                            $label = $media->title ?: basename($media->path);
                            $size = $media->human_size ?? '';
                            return [$media->path => "📷 {$label} ({$size})"];
                        })
                        ->toArray();
                })
                ->live()
                ->afterStateUpdated(function ($state, $set, $get) use ($pathField, $altField) {
                    if ($state) {
                        $set($pathField, $state);
                        // Also set alt text if available
                        $media = Media::where('path', $state)->first();
                        if ($media && $media->alt_text) {
                            $set($altField, $media->alt_text);
                        }
                    }
                })
                ->helperText('Recently uploaded images')
                ->visible(fn($get) => $get('_media_mode') === 'library')
                ->dehydrated(false),

            // Preview selected image from library
            Placeholder::make('_library_preview')
                ->label('Preview')
                ->content(function ($get) use ($pathField) {
                    $path = $get($pathField);
                    $mode = $get('_media_mode');
                    if ($path && $mode === 'library') {
                        $url = Storage::disk('public')->url($path);
                        return new HtmlString(
                            '<img src="' . $url . '" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover;" />'
                        );
                    }
                    return new HtmlString('<span style="color: #6b7280; font-size: 12px;">No image selected</span>');
                })
                ->visible(fn($get) => $get('_media_mode') === 'library'),

            // Alt text field
            TextInput::make($altField)
                ->label('Image Alt Text')
                ->placeholder('Describe the image for accessibility...')
                ->helperText('Important for SEO and accessibility'),
        ];
    }
}

