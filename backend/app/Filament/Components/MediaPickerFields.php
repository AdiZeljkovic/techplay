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
                            ->limit(100)
                            ->get();

                        if ($mediaItems->isEmpty()) {
                            return [
                                Placeholder::make('no_media')
                                    ->label('')
                                    ->content(new HtmlString('<div style="text-align: center; padding: 40px; color: #6b7280;"><span style="font-size: 48px;">📭</span><br/><br/>No images in library yet.<br/>Upload some images first!</div>')),
                            ];
                        }

                        // Build visual gallery HTML
                        $galleryHtml = '
                            <div style="margin-bottom: 16px;">
                                <input type="text" id="media-search" placeholder="🔍 Search images by name..." 
                                       style="width: 100%; padding: 10px 14px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px;"
                                       oninput="
                                           const query = this.value.toLowerCase();
                                           document.querySelectorAll(\'.media-thumb\').forEach(item => {
                                               const name = item.dataset.name.toLowerCase();
                                               item.style.display = name.includes(query) ? \'block\' : \'none\';
                                           });
                                       " />
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; max-height: 350px; overflow-y: auto; padding: 4px;">
                        ';

                        foreach ($mediaItems as $media) {
                            $url = Storage::disk('public')->url($media->path);
                            $title = $media->title ?: basename($media->path);
                            $size = $media->human_size ?? '';
                            $escapedPath = e($media->path);

                            $galleryHtml .= '
                                <div class="media-thumb" data-name="' . e($title) . '" data-path="' . $escapedPath . '"
                                     style="cursor: pointer; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.3); transition: all 0.15s;"
                                     onclick="
                                         document.querySelectorAll(\'.media-thumb\').forEach(t => t.style.outline = \'none\');
                                         this.style.outline = \'3px solid #6366f1\';
                                         document.querySelector(\'[name=selected_path]\').value = this.dataset.path;
                                         document.querySelector(\'[name=selected_path]\').dispatchEvent(new Event(\'input\', { bubbles: true }));
                                     ">
                                    <img src="' . e($url) . '" alt="' . e($title) . '" 
                                         style="width: 100%; height: 90px; object-fit: cover;" loading="lazy" />
                                    <div style="padding: 6px; font-size: 10px; color: #d1d5db; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ' . e(\Illuminate\Support\Str::limit($title, 15)) . '
                                    </div>
                                </div>
                            ';
                        }

                        $galleryHtml .= '</div>';
                        $galleryHtml .= '<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">' . count($mediaItems) . ' images</div>';

                        return [
                            Placeholder::make('gallery')
                                ->label('Click an image to select:')
                                ->content(new HtmlString($galleryHtml)),

                            TextInput::make('selected_path')
                                ->label('Selected')
                                ->required()
                                ->placeholder('← Click an image above')
                                ->live()
                                ->helperText('The path of the selected image'),
                        ];
                    })
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
