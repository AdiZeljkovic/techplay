<?php

namespace App\Filament\Resources;

use App\Filament\Components\MediaPickerFields;
use App\Filament\Components\PublishTab;
use App\Filament\Components\SeoFields;
use App\Filament\Resources\TechResource\Pages;
use App\Models\Article;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
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
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TechResource extends Resource
{
    /**
     * Findable from the top bar.
     *
     * The search box was wired to four resources, none of them the ones
     * anybody looks for. A hit is titled by `$recordTitleAttribute` and
     * matched against the columns below.
     */
    protected static ?string $recordTitleAttribute = 'title';

    /** @return list<string> */
    public static function getGloballySearchableAttributes(): array
    {
        return ['title', 'slug', 'excerpt'];
    }

    /** @return array<string, string|null> */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return array_filter(['Status' => $record->status]);
    }

    protected static ?string $model = Article::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-cpu-chip';

    protected static ?string $slug = 'tech-articles';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 50;

    public static function getNavigationLabel(): string
    {
        return 'Tech';
    }

    public static function getModelLabel(): string
    {
        return 'Tech Article';
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            // Filament does not eager load relationship columns by itself.
            ->with(['author', 'category'])
            ->whereHas('category', function ($query) {
                $query->where('type', 'tech');
            });
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
                                    ->label('Article Title')
                                    ->placeholder('Write a compelling tech headline...')
                                    ->required()
                                    ->maxLength(100)
                                    ->live(onBlur: true)
                                    ->afterStateUpdated(fn ($state, $set) => $set('slug', Str::slug($state)))
                                    ->helperText(
                                        fn ($state) => $state
                                        ? (strlen($state).'/100 chars'.(strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
                                        : 'Aim for 50-60 characters for optimal SEO'
                                    ),

                                Grid::make(2)->schema([
                                    TextInput::make('slug')
                                        ->label('Permalink')
                                        ->prefix('techplay.gg/tech/')
                                        ->placeholder('auto-generated-slug')
                                        ->required()
                                        ->unique(ignoreRecord: true)
                                        ->helperText('URL-friendly • Auto-generated from title'),

                                    Textarea::make('excerpt')
                                        ->label('Excerpt')
                                        ->placeholder('Brief summary for cards and social sharing...')
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
                        Section::make('Content')
                            ->icon('heroicon-o-document-text')
                            ->description('Write your tech article. Cover hardware, software, gadgets, and technology news.')
                            ->schema([
                                RichEditor::make('content')
                                    ->label('')
                                    ->placeholder('Start writing your tech article...')
                                    ->helperText('To embed media, paste the URL or use the attach/video button.')
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
                                    ->fileAttachmentsDirectory('articles'),
                            ]),
                    ])
                    ->columnSpan(['default' => 1, 'lg' => 2]), // Explicit Span

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('TechMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                PublishTab::make('tech', 'article'),

                                // TAB: SEO with Live Checker
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn ($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema(SeoFields::make('techplay.gg/tech/', false)),

                                // TAB: MEDIA with Library Picker
                                Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema(MediaPickerFields::make('featured_image_url', 'featured_image_alt', 'articles')),
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
                TextColumn::make('category.name')
                    ->label('Category')
                    ->badge()
                    ->color('info')
                    ->sortable(),
                IconColumn::make('is_featured_in_hero')
                    ->boolean()
                    ->label('🌟')
                    ->trueIcon('heroicon-s-star')
                    ->falseIcon('heroicon-o-star'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'ready_for_review' => 'warning',
                        'published' => 'success',
                        default => 'gray',
                    }),
                TextColumn::make('views')
                    ->numeric()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('published_at')
                    ->label('Published')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('published_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'draft' => 'Draft',
                        'ready_for_review' => 'Pending Review',
                        'published' => 'Published',
                    ]),
                SelectFilter::make('category')
                    ->relationship('category', 'name', fn (Builder $query) => $query->where('type', 'tech')),
            ])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                Action::make('onSite')
                    ->label('View on site')
                    ->icon('heroicon-m-arrow-top-right-on-square')
                    ->color('gray')
                    ->url(fn ($record): string => config('app.site_url').'/hardware/'.$record->slug, shouldOpenInNewTab: true)
                    ->visible(fn ($record): bool => filled($record->slug) && $record->status === 'published'),
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTeches::route('/'),
            'create' => Pages\CreateTech::route('/create'),
            'edit' => Pages\EditTech::route('/{record}/edit'),
        ];
    }
}
