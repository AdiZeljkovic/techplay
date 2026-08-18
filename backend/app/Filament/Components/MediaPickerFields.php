<?php

namespace App\Filament\Components;

use App\Models\Media;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Actions;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\HtmlString;

class MediaPickerFields
{
    /**
     * Create a Media Picker field group with upload OR select from library modal
     */
    public static function make(
        string $pathField = 'featured_image_url',
        ?string $altField = 'featured_image_alt',
        string $collection = 'articles'
    ): array {
        return [
            // Actual form field that gets saved - editable text input for the path
            TextInput::make($pathField)
                ->label('Image path')
                ->placeholder('Set by Upload or Choose from library')
                ->live()
                ->extraInputAttributes(['class' => 'tp-permalink'], merge: true),

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
                            '<div class="tp-media-preview">'.
                            '<img src="'.e($url).'" alt="Current featured image" />'.
                            '<span class="tp-media-name">'.e(basename($path)).'</span>'.
                            '</div>'
                        );
                    }

                    return new HtmlString('<div class="tp-media-empty">No image chosen yet</div>');
                })
                ->columnSpanFull(),

            // Action buttons
            Actions::make([
                // Upload new button
                Action::make('upload_new')
                    ->label('Upload')
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
                        if (! empty($data['new_image'])) {
                            $set($pathField, $data['new_image']);
                        }
                    }),

                // Choose from library button - using proper Select component
                Action::make('choose_from_library')
                    ->label('Choose from library')
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

                                        return [$media->path => $title];
                                    })
                                    ->toArray();
                            })
                            ->getOptionLabelUsing(fn ($value) => basename($value))
                            ->helperText('Start typing to search for images'),

                        Placeholder::make('selected_preview')
                            ->label('Preview')
                            ->content(function ($get) {
                                $path = $get('selected_path');
                                if ($path) {
                                    $url = Storage::disk('public')->url($path);

                                    return new HtmlString(
                                        '<div class="tp-media-preview"><img src="'.e($url).'" alt="Preview" /></div>'
                                    );
                                }

                                return new HtmlString('<div class="tp-media-empty">Pick one above to see it here</div>');
                            }),
                    ])
                    ->action(function (array $data, $set) use ($pathField, $altField) {
                        if (! empty($data['selected_path'])) {
                            $set($pathField, $data['selected_path']);

                            // Also set alt text if available
                            $media = Media::where('path', $data['selected_path'])->first();
                            if ($media && $media->alt_text) {
                                $set($altField, $media->alt_text);
                            }
                        }
                    })
                    ->modalSubmitActionLabel('Use this image'),

                // Clear image button
                Action::make('clear_image')
                    ->label('Remove')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Remove Image?')
                    ->modalDescription('This will remove the featured image from this article.')
                    ->action(function ($set) use ($pathField, $altField) {
                        $set($pathField, null);
                        $set($altField, null);
                    })
                    ->visible(fn ($get) => ! empty($get($pathField))),
            ])->columnSpanFull(),

            // Alt text field (optional — only included if altField is provided)
            ...($altField ? [
                TextInput::make($altField)
                    ->label('Alt text')
                    ->placeholder('What is in the picture?')
                    ->helperText('Read aloud by screen readers, and read by Google. 280 of 625 articles have one.'),
            ] : []),

            // ─── Video option ────────────────────────────────────────────────
            Placeholder::make('_video_divider')
                ->label('')
                ->content(new HtmlString('<div class="tp-or"><span>or use a video instead</span></div>'))
                ->columnSpanFull(),

            TextInput::make('featured_video_url')
                ->label('Featured Video URL')
                ->placeholder('https://www.youtube.com/watch?v=... or https://vimeo.com/...')
                ->helperText('YouTube or Vimeo link. When set, the hero shows a video player — clicking play hides the title overlay and starts the video.')
                ->url()
                ->suffixIcon('heroicon-o-video-camera')
                ->columnSpanFull(),
        ];
    }
}
