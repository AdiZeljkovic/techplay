<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GuideResource\Pages;
use App\Models\Guide;
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
use App\Filament\Components\SeoForm;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Schemas\Components\Utilities\Set;
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
                    // Title
                    TextInput::make('title')
                        ->label('Title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Enter guide title here')
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn($set, ?string $state) => $set('slug', Str::slug($state))),

                    // Slug
                    TextInput::make('slug')
                        ->label('Permalink')
                        ->required()
                        ->maxLength(255)
                        ->prefix('techplay.gg/guides/')
                        ->unique(ignoreRecord: true),

                    // Content
                    RichEditor::make('content')
                        ->label('Content')
                        ->required()
                        ->placeholder('Start writing your guide...')
                        ->fileAttachmentsDisk('public')
                        ->fileAttachmentsDirectory('guides/content'),

                    // Excerpt
                    Textarea::make('excerpt')
                        ->label('Excerpt')
                        ->placeholder('Brief summary for guide previews...')
                        ->rows(2),

                    // Featured Image
                    FileUpload::make('featured_image_url')
                        ->label('Featured Image')
                        ->image()
                        ->disk('public')
                        ->imageEditor()
                        ->imagePreviewHeight('200'),

                    // Status, Date, Difficulty row
                    Grid::make(3)
                        ->schema([
                                Select::make('status')
                                    ->label('Status')
                                    ->options([
                                            'draft' => 'Draft',
                                            'ready_for_review' => 'Pending Review',
                                            'published' => 'Published',
                                        ])
                                    ->default('draft')
                                    ->required()
                                    ->native(false),

                                DateTimePicker::make('published_at')
                                    ->label('Publish Date')
                                    ->default(now())
                                    ->native(false),

                                Select::make('difficulty')
                                    ->label('Difficulty')
                                    ->options([
                                            'beginner' => 'Beginner',
                                            'intermediate' => 'Intermediate',
                                            'advanced' => 'Advanced',
                                        ])
                                    ->required()
                                    ->native(false),
                            ]),

                    // Tags
                    \Filament\Forms\Components\TagsInput::make('tags')
                        ->label('Tags')
                        ->placeholder('Add tags...'),

                    // Steps Section (collapsible)
                    Section::make('Step-by-Step Instructions')
                        ->schema([
                                Repeater::make('steps')
                                    ->schema([
                                            TextInput::make('title')->required(),
                                            RichEditor::make('description')->toolbarButtons(['bold', 'italic', 'link', 'bulletList']),
                                            FileUpload::make('image')
                                                ->image()
                                                ->directory('guides/steps')
                                                ->disk('public'),
                                        ])
                                    ->itemLabel(fn(array $state): ?string => $state['title'] ?? null)
                                    ->collapsible()
                                    ->cloneable()
                                    ->defaultItems(0),
                            ])
                        ->collapsible()
                        ->collapsed(),

                    // SEO - collapsible
                    Section::make('SEO Settings')
                        ->schema([
                                TextInput::make('meta_title')
                                    ->label('SEO Title')
                                    ->placeholder('Custom SEO title'),
                                Textarea::make('meta_description')
                                    ->label('SEO Description')
                                    ->placeholder('Meta description...')
                                    ->rows(2),
                            ])
                        ->collapsible()
                        ->collapsed(),

                    Hidden::make('author_id')
                        ->default(fn() => auth()->id()),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    TextColumn::make('title')
                        ->searchable()
                        ->sortable()
                        ->limit(50),
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
                        ->dateTime()
                        ->sortable(),
                ])
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
