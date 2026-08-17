<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\GuideResource\Pages;
use App\Models\Guide;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class GuideResource extends Resource
{
    protected static ?string $model = Guide::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-book-open';

    protected static ?string $slug = 'guides';

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['author']);
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 40;

    public static function getNavigationLabel(): string
    {
        return 'Guides';
    }

    public static function getModelLabel(): string
    {
        return 'Guide';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'lg' => 3]) // Explicit Grid Definition
            ->components([
                // ═══════════════════════════════════════════════════════════
                // LEFT COLUMN - MAIN CONTENT AREA (2/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        // TITLE SECTION
                        Section::make()
                            ->schema([
                                TextInput::make('title')
                                    ->label('Guide Title')
                                    ->placeholder('How to... / Best way to... / Complete guide to...')
                                    ->required()
                                    ->maxLength(100)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($set, ?string $state) => $set('slug', Str::slug($state)))
                                    ->helperText(
                                        fn ($state) => $state
                                        ? (strlen($state).'/100 chars'.(strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
                                        : 'Aim for 50-60 characters for optimal SEO'
                                    ),

                                Grid::make(2)->schema([
                                    TextInput::make('slug')
                                        ->label('Permalink')
                                        ->prefix('techplay.gg/guides/')
                                        ->placeholder('auto-generated-slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->helperText('URL-friendly • Auto-generated from title'),

                                    Textarea::make('excerpt')
                                        ->label('Excerpt')
                                        ->placeholder('Brief summary of what readers will learn...')
                                        ->rows(2)
                                        ->maxLength(200)
                                        ->helperText(
                                            fn ($state) => $state
                                            ? strlen($state).'/200 chars'
                                            : 'Short description shown in previews'
                                        ),
                                ]),
                            ])
                            ->compact(),

                        // CONTENT EDITOR
                        Section::make('Main Content')
                            ->icon('heroicon-o-document-text')
                            ->description('Write the main guide content here. Use the step-by-step section below for structured instructions.')
                            ->schema([
                                RichEditor::make('content')
                                    ->label('')
                                    ->placeholder('Start writing your guide...')
                                    ->helperText('To embed YouTube, paste the video URL. If it does not auto-embed, try using the "Source Code" block (if enabled) or attach media.')
                                    ->required()
                                    ->toolbarButtons([
                                        'attachFiles',
                                        'blockquote',
                                        'bold',
                                        'bulletList',
                                        'codeBlock',
                                        'h2',
                                        'h3',
                                        'italic',
                                        'link',
                                        'orderedList',
                                        'redo',
                                        'strike',
                                        'table',
                                        'underline',
                                        'undo',
                                        'alignStart',
                                        'alignCenter',
                                        'alignEnd',
                                        'alignJustify',
                                    ])
                                    ->fileAttachmentsDisk('public')
                                    ->fileAttachmentsDirectory('guides/content'),
                            ]),

                        // STEPS SECTION - Collapsible
                        Section::make('Step-by-Step Instructions')
                            ->icon('heroicon-o-list-bullet')
                            ->description('Add structured steps with optional images')
                            ->collapsed(false) // Uncollapsed to ensure validation visibility
                            ->collapsible()
                            ->schema([
                                Repeater::make('steps')
                                    ->schema([
                                        TextInput::make('title')
                                            ->label('Step Title')
                                            ->placeholder('e.g. Download the software')
                                            ->required(),
                                        RichEditor::make('description')
                                            ->label('Instructions')
                                            ->toolbarButtons(['bold', 'italic', 'link', 'bulletList']),
                                        FileUpload::make('image')
                                            ->label('Screenshot/Image')
                                            ->image()
                                            ->directory('guides/steps')
                                            ->disk('public'),
                                    ])
                                    ->itemLabel(fn (array $state): ?string => $state['title'] ?? null)
                                    ->collapsible()
                                    ->cloneable()
                                    ->defaultItems(0)
                                    ->addActionLabel('Add Step'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]), // Explicit Span

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('GuideMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                PublishTab::make(null, 'guide', withGameLink: true, withHeroToggle: false, extra: [PublishTab::difficulty()]),

                                // TAB: SEO with Live Checker
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema(SeoFields::make('techplay.gg/guides/', false)),

                                // TAB: MEDIA with Library Picker
                                Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema(MediaPickerFields::make('featured_image_url', 'featured_image_alt', 'guides')),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 1]), // Explicit Span
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('featured_image_url')
                    ->label('')
                    ->circular()
                    ->size(40),
                TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->title),
                TextColumn::make('author.username')
                    ->label('Author')
                    ->sortable(),
                TextColumn::make('difficulty')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'beginner' => 'success',
                        'intermediate' => 'warning',
                        'advanced' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('views')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->label('Created')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('difficulty')
                    ->options([
                        'beginner' => 'Beginner',
                        'intermediate' => 'Intermediate',
                        'advanced' => 'Advanced',
                    ]),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                Action::make('onSite')
                    ->label('View on site')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->url(fn ($record): string => config('app.site_url').'/guides/'.$record->slug, shouldOpenInNewTab: true)
                    ->visible(fn ($record): bool => filled($record->slug) && $record->status === 'published'),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListGuides::route('/'),
            'create' => Pages\CreateGuide::route('/create'),
            'edit' => Pages\EditGuide::route('/{record}/edit'),
        ];
    }
}
