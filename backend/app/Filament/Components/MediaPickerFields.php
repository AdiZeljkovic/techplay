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
            // Current image preview
            Placeholder::make('_current_image_preview')
                ->label('Current Image')
                ->content(function ($get) use ($pathField) {
                    $path = $get($pathField);
                    if ($path) {
                        $url = Storage::disk('public')->url($path);
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

                // Choose from library button
                Action::make('choose_from_library')
                    ->label('📚 Choose from Library')
                    ->color('gray')
                    ->modalHeading('Media Library')
                    ->modalDescription('Select an existing image from your library')
                    ->modalWidth('5xl')
                    ->form(function () {
                        $mediaItems = Media::query()
                            ->orderBy('created_at', 'desc')
                            ->limit(50)
                            ->get();

                        if ($mediaItems->isEmpty()) {
                            return [
                                Placeholder::make('no_media')
                                    ->label('')
                                    ->content(new HtmlString('<div style="text-align: center; padding: 40px; color: #6b7280;"><span style="font-size: 48px;">📭</span><br/><br/>No images in library yet.<br/>Upload some images first!</div>')),
                            ];
                        }

                        // Build HTML gallery
                        $galleryHtml = '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-height: 400px; overflow-y: auto; padding: 8px;">';

                        foreach ($mediaItems as $media) {
                            $url = Storage::disk('public')->url($media->path);
                            $title = $media->title ?: basename($media->path);
                            $size = $media->human_size ?? '';

                            $galleryHtml .= '
                                <label style="cursor: pointer; position: relative;">
                                    <input type="radio" name="selected_media" value="' . e($media->path) . '" 
                                           style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;"
                                           onchange="window.selectedMediaPath = this.value; this.closest(\'label\').style.outline = \'3px solid #6366f1\'; 
                                                     document.querySelectorAll(\'label\').forEach(l => { if(l !== this.closest(\'label\')) l.style.outline = \'none\'; });" />
                                    <div style="background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden; transition: transform 0.2s;">
                                        <img src="' . e($url) . '" alt="' . e($title) . '" 
                                             style="width: 100%; height: 120px; object-fit: cover;" />
                                        <div style="padding: 8px; font-size: 11px; color: #d1d5db; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                            ' . e($title) . '<br/>
                                            <span style="color: #6b7280;">' . e($size) . '</span>
                                        </div>
                                    </div>
                                </label>';
                        }

                        $galleryHtml .= '</div>';

                        return [
                            Placeholder::make('gallery')
                                ->label('')
                                ->content(new HtmlString($galleryHtml)),

                            TextInput::make('selected_path')
                                ->label('')
                                ->extraAttributes(['id' => 'selected-media-path', 'style' => 'display: none;']),
                        ];
                    })
                    ->action(function (array $data, $set, $get) use ($pathField, $altField) {
                        // The selected path from the gallery
                        if (!empty($data['selected_path'])) {
                            $set($pathField, $data['selected_path']);

                            // Also set alt text if available
                            $media = Media::where('path', $data['selected_path'])->first();
                            if ($media && $media->alt_text) {
                                $set($altField, $media->alt_text);
                            }
                        }
                    })
                    ->modalSubmitActionLabel('Select Image')
                    ->extraAttributes([
                        'x-on:click' => 'setTimeout(() => { window.selectedMediaPath = null; }, 100)',
                    ]),

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
