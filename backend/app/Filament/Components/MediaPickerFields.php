<?php

namespace App\Filament\Components;

use App\Models\Media;
use Filament\Schemas\Components\Actions;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Placeholder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\HtmlString;

class MediaPickerFields
{
    /**
     * Create a Media Picker field group with upload OR select from library modal
     */
    public static function make(
        string $pathField = 'featured_image_url',
        string $altField = 'featured_image_alt',
        string $collection = 'articles'
    ): array {
        return [
            // Actual form field that gets saved - editable text input for the path
            TextInput::make($pathField)
                ->label('Image Path')
                ->placeholder('Use Upload or Choose from Library buttons below...')
                ->live()
                ->helperText('Path will be set automatically when you upload or choose an image'),

            // Current image preview
            Placeholder::make('_current_image_preview')
                ->label('Current Image')
                ->content(function ($get) use ($pathField) {
                    $path = $get($pathField);
                    if ($path) {
                        // Handle both relative paths and full URLs
                        if (str_starts_with($path, 'http')) {
                            $url = $path;
                        } else {
                            $url = Storage::disk('public')->url($path);
                        }
                        return new HtmlString(
                            '<div style="position: relative; display: inline-block;">' .
                            '<img src="' . e($url) . '" alt="Current" style="max-width: 100%; max-height: 200px; border-radius: 8px; object-fit: cover;" />' .
                            '<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">📷 ' . basename($path) . '</div>' .
                            '</div>'
                        );
                    }
                    return new HtmlString('<div style="padding: 24px; background: rgba(0,0,0,0.2); border-radius: 8px; text-align: center; color: #6b7280;"><span style="font-size: 32px;">🖼️</span><br/>No image selected</div>');
                })
                ->columnSpanFull(),

            // Action buttons
            Actions::make([
                // Upload new button
                Action::make('upload_new')
                    ->label('📤 Upload New')
                    ->color('primary')
                    ->modalHeading('Upload New Image')
                    ->modalWidth('lg')
                    ->form([
                        FileUpload::make('new_image')
                            ->label('Choose File')
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
                            ->required()
                            ->helperText('Recommended: 1200×630px for social sharing'),
                    ])
                    ->action(function (array $data, $set) use ($pathField) {
                        if (!empty($data['new_image'])) {
                            $set($pathField, $data['new_image']);
                        }
                    }),

                // Choose from library button - using proper Select component
                Action::make('choose_from_library')
                    ->label('📚 Choose from Library')
                    ->color('gray')
                    ->modalHeading('Media Library')
                    ->modalDescription('Select an existing image from your library')
                    ->modalWidth('xl')
                    ->form([
                        Select::make('selected_path')
                            ->label('Select Image')
                            ->placeholder('Search for an image...')
                            ->searchable()
                            ->required()
                            ->options(function () {
                                return Media::query()
                                    ->orderBy('created_at', 'desc')
                                    ->limit(200)
                                    ->get()
                                    ->mapWithKeys(function ($media) {
                                        $title = $media->title ?: basename($media->path);
                                        return [$media->path => "📷 {$title}"];
                                    })
                                    ->toArray();
                            })
                            ->getOptionLabelUsing(fn($value) => "📷 " . basename($value))
                            ->helperText('Start typing to search for images'),

                        Placeholder::make('selected_preview')
                            ->label('Preview')
                            ->content(function ($get) {
                                $path = $get('selected_path');
                                if ($path) {
                                    $url = Storage::disk('public')->url($path);
                                    return new HtmlString(
                                        '<img src="' . e($url) . '" alt="Preview" style="max-width: 300px; max-height: 200px; border-radius: 8px; object-fit: cover;" />'
                                    );
                                }
                                return new HtmlString('<span style="color: #6b7280;">Select an image above to see preview</span>');
                            }),
                    ])
                    ->action(function (array $data, $set) use ($pathField, $altField) {
                        if (!empty($data['selected_path'])) {
                            $set($pathField, $data['selected_path']);

                            // Also set alt text if available
                            $media = Media::where('path', $data['selected_path'])->first();
                            if ($media && $media->alt_text) {
                                $set($altField, $media->alt_text);
                            }
                        }
                    })
                    ->modalSubmitActionLabel('✓ Use This Image'),

                // Clear image button  
                Action::make('clear_image')
                    ->label('🗑️ Remove')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Remove Image?')
                    ->modalDescription('This will remove the featured image from this article.')
                    ->action(function ($set) use ($pathField, $altField) {
                        $set($pathField, null);
                        $set($altField, null);
                    })
                    ->visible(fn($get) => !empty($get($pathField))),
            ])->columnSpanFull(),

            // Alt text field
            TextInput::make($altField)
                ->label('Image Alt Text')
                ->placeholder('Describe the image for accessibility...')
                ->helperText('Important for SEO and accessibility'),
        ];
    }
}
