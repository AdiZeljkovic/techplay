<?php

namespace App\Filament\Components;

use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Component;
use Filament\Schemas\Components\Section;
use Illuminate\Support\Str;

/**
 * The writing surface — headline, permalink, excerpt, body — shared by all four
 * article types.
 *
 * News, Reviews, Guides and Tech each carried their own copy of this block, and
 * the four copies differed only in a URL prefix and the noun in a placeholder.
 * The same argument as `PublishTab`: the cost of four copies is not their length,
 * it is that they drift, and this one had drifted into a bug (see the slug note
 * below).
 *
 * ── What changed, and why ─────────────────────────────────────────────────
 *
 * The old block put the headline in a 14px input with a label above it, then
 * split the row underneath into permalink | excerpt at equal width. That is a
 * form for *entering data about* an article. This is a screen for *writing* one,
 * so the shape follows what a writer actually does:
 *
 *   - the headline is set at headline size, with no label, because a field that
 *     is the first thing on the page and reads "The full title of The Elder
 *     Scrolls 6…" does not need to be told it is a title;
 *   - the permalink sits directly beneath it at small size, because it is
 *     derived from the headline and read far more often than it is edited;
 *   - the excerpt gets a full-width row of its own. It is not metadata — it is
 *     the sentence that has to sell the piece on a card and in a share, and it
 *     was previously given half a row and two lines of height.
 *
 * The body editor lost its section description ("Write your article using the
 * rich text editor. Add images, links, and formatting.") and gained height. That
 * sentence explained a toolbar to someone who uses it every day, and it cost a
 * line above the canvas on every single load.
 */
class ArticleEditorFields
{
    /**
     * @param  string  $urlPrefix  what goes in front of the slug, e.g. `techplay.gg/news/`
     * @param  string  $noun  what this thing is called in placeholder text
     * @param  string  $attachmentsDirectory  where images dropped into the body are stored
     * @return array<int, Component>
     */
    public static function make(string $urlPrefix, string $noun = 'article', string $attachmentsDirectory = 'articles/content'): array
    {
        return [
            Section::make()
                ->schema([
                    TextInput::make('title')
                        ->hiddenLabel()
                        ->placeholder('Headline')
                        ->required()
                        ->maxLength(100)
                        ->live(onBlur: true)
                        /*
                         * Auto-slug on create only.
                         *
                         * This used to run on every title change, including on
                         * the edit screen — so fixing a typo in the headline of
                         * a live article silently rewrote its URL. The article
                         * kept its inbound links pointed at a 404 and nothing on
                         * the screen said so. That is very likely where a good
                         * part of the 21 rows in Redirects came from.
                         *
                         * The permalink is still right there and still editable;
                         * it just is not moved on your behalf after publication.
                         */
                        ->afterStateUpdated(function (string $operation, $state, $set) {
                            if ($operation === 'create') {
                                $set('slug', Str::slug((string) $state));
                            }
                        })
                        ->extraInputAttributes(['class' => 'tp-headline'], merge: true)
                        /*
                         * The count is a hint, not helper text: it belongs on the
                         * same line as the field, greyed, and it only speaks up
                         * when the number stops being fine. Google truncates a
                         * title around 60 characters.
                         */
                        ->hint(fn ($state) => filled($state) ? mb_strlen((string) $state).' / 100' : null)
                        ->hintColor(fn ($state) => mb_strlen((string) $state) > 60 ? 'warning' : 'gray'),

                    TextInput::make('slug')
                        ->hiddenLabel()
                        ->prefix($urlPrefix)
                        ->placeholder('permalink')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->extraInputAttributes(['class' => 'tp-permalink'], merge: true),

                    Textarea::make('excerpt')
                        ->label('Standfirst')
                        ->placeholder('The sentence that has to sell this on a card, in search, and in a share.')
                        ->rows(3)
                        ->maxLength(200)
                        ->hint(fn ($state) => filled($state) ? mb_strlen((string) $state).' / 200' : null)
                        ->hintColor('gray'),
                ])
                ->compact(),

            Section::make()
                ->extraAttributes(['class' => 'tp-canvas'])
                ->schema([
                    RichEditor::make('content')
                        ->hiddenLabel()
                        ->placeholder('Start writing the '.$noun.'…')
                        ->required()
                        /*
                         * Syncs when you click out of the editor.
                         *
                         * Without this the body is a deferred binding, so the
                         * SEO readout in the rail — which judges word count,
                         * headings, links and keyword-in-body, 45 of its 100
                         * points — kept saying "nothing written yet" through an
                         * entire article, and only caught up if you happened to
                         * blur some other field. The editor is `wire:ignore` and
                         * the component supports `isLiveOnBlur` natively, so
                         * this costs one round trip when you leave the canvas
                         * and nothing while you type.
                         */
                        ->live(onBlur: true)
                        ->toolbarButtons([
                            'bold',
                            'italic',
                            'underline',
                            'strike',
                            'h2',
                            'h3',
                            'blockquote',
                            'bulletList',
                            'orderedList',
                            'link',
                            'codeBlock',
                            'table',
                            'attachFiles',
                            'alignStart',
                            'alignCenter',
                            'alignEnd',
                            'alignJustify',
                            'undo',
                            'redo',
                        ])
                        ->fileAttachmentsDisk('public')
                        ->fileAttachmentsDirectory($attachmentsDirectory)
                        ->helperText('Paste a URL to embed it, or use the attach button for images.'),
                ]),
        ];
    }
}
