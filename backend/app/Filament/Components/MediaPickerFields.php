<?php

namespace App\Filament\Components;

use App\Models\Media;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Actions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\HtmlString;

class MediaPickerFields
{
    /**
     * What belongs in a picker for article art.
     *
     * Two exclusions, both from reading the 36 rows that were in there:
     *
     * **Avatars.** Eight of them, offered as candidates for a news hero. They
     * are somebody's profile picture; they are not cover art and never will be.
     *
     * **WebP derivatives.** `ImageOptimizationService` writes `x.webp` next to
     * `x.jpg`, and `media:sync` walked the disk creating a row per *file* — so
     * all 18 pictures in the library appeared twice, as two entries with two
     * unreadable names that happened to be the same picture. A conversion is a
     * property of an image, not another image; `webp_path` is the column for it.
     */
    protected static function libraryQuery(): Builder
    {
        return Media::query()
            ->where('mime_type', 'like', 'image/%')
            // `collection` is NOT NULL on this table, so this needs no null arm.
            ->where('collection', '<>', 'avatars')
            /*
             * Belt and braces after `media:tidy`: if a derivative row ever
             * reappears, it still does not show up as a second picture.
             *
             * Written with `substr` and `||` rather than `regexp_replace`
             * because this query runs on PostgreSQL in production and on SQLite
             * in the test suite, and only one of those has the latter.
             */
            /*
             * Parenthesised, and that is not cosmetic: an unwrapped `or` inside
             * `whereRaw` is appended at the top level, so `A and B and X or Y`
             * binds as `(A and B and X) or Y` — and `Y` is true for every
             * non-WebP row, which quietly made the whole `where` clause always
             * true. It shipped avatars into the picker until the count was read
             * back.
             */
            ->whereRaw("(lower(path) not like '%.webp' or not exists (
                select 1 from media m2 where m2.path in (
                    substr(media.path, 1, length(media.path) - 5) || '.jpg',
                    substr(media.path, 1, length(media.path) - 5) || '.jpeg',
                    substr(media.path, 1, length(media.path) - 5) || '.png'
                )
            ))")
            ->orderByDesc('created_at');
    }

    /**
     * A row as one option: the picture, its name, and where it came from.
     *
     * `allowHtml()` is on, so everything variable here goes through `e()`.
     *
     * @param  Collection<int, Media>  $media
     * @return array<string, string>
     */
    protected static function libraryOptions($media): array
    {
        return $media->mapWithKeys(function (Media $item) {
            $url = Storage::disk('public')->url($item->path);

            $meta = array_filter([
                $item->collection,
                $item->width && $item->height ? $item->width.'×'.$item->height : null,
                $item->created_at?->format('j M Y'),
            ]);

            $label = '<span style="display:flex;align-items:center;gap:.625rem;">'
                .'<img src="'.e($url).'" alt="" loading="lazy" style="width:56px;height:32px;object-fit:cover;border-radius:.1875rem;flex-shrink:0;">'
                .'<span style="min-width:0;">'
                .'<span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'.e($item->display_name).'</span>'
                .'<span style="display:block;font-size:.6875rem;opacity:.55;">'.e(implode(' · ', $meta)).'</span>'
                .'</span></span>';

            return [$item->path => $label];
        })->toArray();
    }

    /**
     * Create a Media Picker field group with upload OR select from library modal
     */
    public static function make(
        string $pathField = 'featured_image_url',
        ?string $altField = 'featured_image_alt',
        string $collection = 'articles',
        bool $withVideo = true,
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
                /*
                 * Upload.
                 *
                 * Two things it did not do before. It kept no record of the
                 * name the file arrived with — Filament stores under a generated
                 * ULID, which is correct, but that was the only name kept, so
                 * `hogwarts-legacy-2-key-art.jpg` became
                 * `01KEQ5KW66WJGTKV4KBRH7WEH4` and nothing else. And it never
                 * put the picture in the library at all: the row was only ever
                 * created by `media:sync` walking the disk afterwards.
                 */
                Action::make('upload_new')
                    ->label('Upload')
                    ->color('primary')
                    ->modalHeading('Upload an image')
                    ->modalWidth('lg')
                    ->form([
                        FileUpload::make('new_image')
                            ->label('File')
                            ->image()
                            ->disk('public')
                            ->directory($collection)
                            ->storeFileNamesIn('new_image_original_name')
                            ->imageEditor()
                            ->imageEditorAspectRatios(['16:9', '4:3', '1:1'])
                            ->maxSize(2048)
                            ->required()
                            ->helperText('1200×630 or wider. The file name is kept so you can find it again.'),

                        TextInput::make('new_image_alt')
                            ->label('Alt text')
                            ->placeholder('What is in the picture?')
                            ->helperText('Read aloud by screen readers, and read by Google.'),
                    ])
                    ->action(function (array $data, $set) use ($pathField, $altField, $collection) {
                        if (empty($data['new_image'])) {
                            return;
                        }

                        $path = $data['new_image'];
                        $original = $data['new_image_original_name'] ?? null;

                        $set($pathField, $path);

                        if ($altField && filled($data['new_image_alt'] ?? null)) {
                            $set($altField, $data['new_image_alt']);
                        }

                        // Into the library, so the next article can reuse it.
                        Media::firstOrCreate(
                            ['path' => $path],
                            [
                                'title' => $original ? pathinfo($original, PATHINFO_FILENAME) : null,
                                'original_name' => $original,
                                'alt_text' => $data['new_image_alt'] ?? null,
                                'collection' => $collection,
                                'mime_type' => Storage::disk('public')->mimeType($path) ?: null,
                                'size' => Storage::disk('public')->exists($path) ? Storage::disk('public')->size($path) : null,
                                'uploaded_by' => auth()->id(),
                            ],
                        );
                    }),

                /*
                 * Choose from library.
                 *
                 * What this replaced: a select preloaded with two hundred rows,
                 * labelled by storage name, searched in the browser against
                 * those same storage names. The screenshot of it is a column of
                 * `01KECBS95PJ4EEKMFRR54PNTSM` — and searching was the only way
                 * through, against text nobody has ever seen or typed.
                 *
                 * Now: thumbnails, because a picture library should show
                 * pictures; the name a person gave it; and the search runs in
                 * PostgreSQL over the title, the original file name and the
                 * path, so it works past the first two hundred rows.
                 */
                Action::make('choose_from_library')
                    ->label('Choose from library')
                    ->color('gray')
                    ->modalHeading('Media library')
                    ->modalWidth('xl')
                    ->form([
                        Select::make('selected_path')
                            ->label('Image')
                            ->placeholder('Newest first — type to search')
                            ->required()
                            ->searchable()
                            ->allowHtml()
                            ->options(fn () => static::libraryOptions(static::libraryQuery()->limit(40)->get()))
                            ->getSearchResultsUsing(function (string $search) {
                                $term = '%'.mb_strtolower(str_replace(['%', '_'], ['\%', '\_'], $search)).'%';

                                return static::libraryOptions(
                                    static::libraryQuery()
                                        ->where(fn ($q) => $q
                                            ->whereRaw('lower(title) like ?', [$term])
                                            ->orWhereRaw('lower(original_name) like ?', [$term])
                                            ->orWhereRaw('lower(path) like ?', [$term]))
                                        ->limit(40)
                                        ->get()
                                );
                            })
                            ->getOptionLabelUsing(fn ($value) => static::libraryOptions(
                                Media::where('path', $value)->get()
                            )[$value] ?? basename((string) $value)),
                    ])
                    ->action(function (array $data, $set) use ($pathField, $altField) {
                        if (empty($data['selected_path'])) {
                            return;
                        }

                        $set($pathField, $data['selected_path']);

                        // Carry the alt text across, so a picture described once
                        // stays described.
                        if ($altField) {
                            $alt = Media::where('path', $data['selected_path'])->value('alt_text');

                            if (filled($alt)) {
                                $set($altField, $alt);
                            }
                        }
                    })
                    ->modalSubmitActionLabel('Use this image'),

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

            /*
             * The video alternative, where there is a column to put it in.
             *
             * `guides` has no `featured_video_url`, so on that screen a pasted
             * YouTube link went nowhere: not fillable, silently dropped, and the
             * helper text underneath promised a hero player that could never
             * appear.
             */
            ...(! $withVideo ? [] : [
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
            ]),
        ];
    }
}
