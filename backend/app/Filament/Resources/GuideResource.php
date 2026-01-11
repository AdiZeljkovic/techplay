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
        return 'Content';
    }

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
                \Filament\Schemas\Components\Flex::make([
                    // Main Content
                    \Filament\Schemas\Components\Group::make()
                        ->schema([
                            \Filament\Schemas\Components\Section::make('Guide Content')
                                ->icon('heroicon-m-book-open')
                                ->description('Write your guide content.')
                                ->schema([
                                    TextInput::make('title')
                                        ->required()
                                        ->maxLength(255)
                                        ->live(onBlur: true)
                                        ->afterStateUpdated(fn($set, ?string $state) => $set('slug', Str::slug($state)))
                                        ->columnSpanFull(),

                                    TextInput::make('slug')
                                        ->required()
                                        ->maxLength(255)
                                        ->unique(ignoreRecord: true)
                                        ->columnSpanFull(),

                                    Textarea::make('excerpt')
                                        ->label('Short Description')
                                        ->rows(3)
                                        ->helperText('Used for previews and SEO.')
                                        ->columnSpanFull(),

                                    RichEditor::make('content')
                                        ->label('Introduction / Main Content')
                                        ->required()
                                        ->fileAttachmentsDisk('public')
                                        ->fileAttachmentsDirectory('guides/content')
                                        ->columnSpanFull(),
                                ])
                                ->columns(1),

                            \Filament\Schemas\Components\Section::make('Step-by-Step Instructions')
                                ->icon('heroicon-m-list-bullet')
                                ->description('Add structured steps (optional).')
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
                                ->collapsed()
                                ->collapsible(),
                        ])
                        ->grow(),

                    // Settings Sidebar
                    \Filament\Schemas\Components\Section::make('Settings')
                        ->icon('heroicon-m-cog-6-tooth')
                        ->schema([
                            Select::make('status')
                                ->options([
                                    'draft' => 'Draft',
                                    'ready_for_review' => 'Ready for Review',
                                    'published' => 'Published',
                                ])
                                ->default('draft')
                                ->required()
                                ->native(false),

                            DateTimePicker::make('published_at')
                                ->default(now())
                                ->native(false),

                            Select::make('author_id')
                                ->relationship('author', 'username')
                                ->searchable()
                                ->default(fn() => auth()->id())
                                ->required()
                                ->native(false),

                            Select::make('difficulty')
                                ->options([
                                    'beginner' => 'Beginner',
                                    'intermediate' => 'Intermediate',
                                    'advanced' => 'Advanced',
                                ])
                                ->required()
                                ->native(false),

                            \Filament\Forms\Components\TagsInput::make('tags')
                                ->placeholder('Add tags...')
                                ->helperText('Press Enter to add a tag.'),

                            FileUpload::make('featured_image_url')
                                ->label('Featured Image')
                                ->image()
                                ->disk('public')
                                ->imageEditor()
                                ->imagePreviewHeight('150'),
                        ])
                        ->collapsible()
                        ->grow(false),
                ])
                    ->from('md'),

                SeoForm::make(),
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
