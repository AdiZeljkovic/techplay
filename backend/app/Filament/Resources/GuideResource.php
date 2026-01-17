<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GuideResource\Pages;
use App\Models\Guide;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\TagsInput;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Illuminate\Support\Str;
use Filament\Schemas\Schema;

class GuideResource extends Resource
{
    protected static ?string $model = Guide::class;

    protected static ?string $slug = 'guides';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }
    protected static ?int $navigationSort = 3;

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
                                    ->afterStateUpdated(fn($set, ?string $state) => $set('slug', Str::slug($state)))
                                    ->helperText(
                                        fn($state) => $state
                                        ? (strlen($state) . '/100 chars' . (strlen($state) > 60 ? ' — Consider shortening for SEO' : ' ✓'))
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
                                            fn($state) => $state
                                            ? strlen($state) . '/200 chars'
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
                                        'underline',
                                        'undo',
                                    ])
                                    ->fileAttachmentsDisk('public')
                                    ->fileAttachmentsDirectory('guides/content'),
                            ]),

                        // STEPS SECTION - Collapsible
                        Section::make('Step-by-Step Instructions')
                            ->icon('heroicon-o-list-bullet')
                            ->description('Add structured steps with optional images')
                            ->collapsed()
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
                                    ->itemLabel(fn(array $state): ?string => $state['title'] ?? null)
                                    ->collapsible()
                                    ->cloneable()
                                    ->defaultItems(0)
                                    ->addActionLabel('Add Step'),
                            ]),
                    ])
                    ->columnSpan(['lg' => 2]),

                // ═══════════════════════════════════════════════════════════
                // RIGHT COLUMN - SIDEBAR WITH TABS (1/3 width)
                // ═══════════════════════════════════════════════════════════
                Group::make()
                    ->schema([
                        Tabs::make('GuideMeta')
                            ->tabs([
                                // TAB: PUBLISH
                                Tab::make('Publish')
                                    ->icon('heroicon-o-paper-airplane')
                                    ->schema([
                                        Select::make('status')
                                            ->label('Status')
                                            ->options([
                                                'draft' => '📝 Draft',
                                                'ready_for_review' => '👁️ Pending Review',
                                                'published' => '🌐 Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->native(false)
                                            ->helperText('Set to Published to go live'),

                                        DateTimePicker::make('published_at')
                                            ->label('Publish Date')
                                            ->native(false)
                                            ->displayFormat('M j, Y • g:i A')
                                            ->default(now())
                                            ->helperText('When should this guide go live?'),

                                        Select::make('difficulty')
                                            ->label('Difficulty')
                                            ->options([
                                                'beginner' => '🟢 Beginner',
                                                'intermediate' => '🟡 Intermediate',
                                                'advanced' => '🔴 Advanced',
                                            ])
                                            ->required()
                                            ->native(false)
                                            ->helperText('Skill level required'),

                                        TagsInput::make('tags')
                                            ->label('Tags')
                                            ->placeholder('Add tag...')
                                            ->helperText('Press Enter after each tag'),

                                        Hidden::make('author_id')
                                            ->default(fn() => auth()->id()),
                                    ]),

                                // TAB: SEO
                                Tab::make('SEO')
                                    ->icon('heroicon-o-magnifying-glass')
                                    ->badge(fn($get) => $get('meta_title') ? '✓' : null)
                                    ->badgeColor('success')
                                    ->schema([
                                        TextInput::make('focus_keyword')
                                            ->label('Focus Keyword')
                                            ->placeholder('e.g. how to level up fast')
                                            ->helperText('Primary keyword for SEO optimization'),

                                        TextInput::make('meta_title')
                                            ->label('SEO Title')
                                            ->placeholder('Custom title for search engines...')
                                            ->maxLength(70)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/70 chars' . (strlen($state) >= 50 && strlen($state) <= 60 ? ' ✓ Optimal' : ''))
                                                : 'Leave empty to use guide title. Optimal: 50-60 chars'
                                            ),

                                        Textarea::make('meta_description')
                                            ->label('Meta Description')
                                            ->placeholder('Compelling description for search results...')
                                            ->rows(3)
                                            ->maxLength(160)
                                            ->helperText(
                                                fn($state) => $state
                                                ? (strlen($state) . '/160 chars' . (strlen($state) >= 150 && strlen($state) <= 160 ? ' ✓ Optimal' : ''))
                                                : 'Optimal: 150-160 characters'
                                            ),

                                        Toggle::make('is_noindex')
                                            ->label('Hide from Search Engines')
                                            ->helperText('Enable to prevent Google indexing'),
                                    ]),

                                // TAB: MEDIA
                                Tab::make('Media')
                                    ->icon('heroicon-o-photo')
                                    ->schema([
                                        FileUpload::make('featured_image_url')
                                            ->label('Featured Image')
                                            ->image()
                                            ->disk('public')
                                            ->imageEditor()
                                            ->imageEditorAspectRatios([
                                                '16:9',
                                                '4:3',
                                                '1:1',
                                            ])
                                            ->maxSize(2048)
                                            ->helperText('Recommended: 1200×630px for social sharing'),

                                        TextInput::make('featured_image_alt')
                                            ->label('Image Alt Text')
                                            ->placeholder('Describe the image for accessibility...')
                                            ->helperText('Important for SEO and accessibility'),
                                    ]),
                            ])
                            ->persistTabInQueryString(),
                    ])
                    ->columnSpan(['lg' => 1]),
            ])
            ->columns(3);
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
                    ->tooltip(fn($record) => $record->title),
                TextColumn::make('author.username')
                    ->label('Author')
                    ->sortable(),
                TextColumn::make('difficulty')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
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

