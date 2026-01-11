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
                \Filament\Schemas\Components\Grid::make(3)
                    ->schema([
                        // Main Content (Left/Center)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 2])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Guide Content')
                                    ->icon('heroicon-m-book-open')
                                    ->schema([
                                        TextInput::make('title')
                                            ->required()
                                            ->maxLength(255)
                                            ->live(onBlur: true)
                                            ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),

                                        TextInput::make('slug')
                                            ->required()
                                            ->maxLength(255)
                                            ->unique(ignoreRecord: true),

                                        Textarea::make('excerpt')
                                            ->label('Short Description')
                                            ->rows(3)
                                            ->helperText('Used for card previews and SEO meta description fallback.')
                                            ->columnSpanFull(),

                                        RichEditor::make('content')
                                            ->label('Introduction / Main Content')
                                            ->required()
                                            ->fileAttachmentsDisk('public')
                                            ->fileAttachmentsDirectory('guides/content')
                                            ->columnSpanFull(),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Step-by-Step Instructions')
                                    ->icon('heroicon-m-list-bullet')
                                    ->description('Add structured steps for this guide (optional).')
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
                                    ->collapsed(),

                                SeoForm::make(),
                            ]),

                        // Sidebar (Right)
                        \Filament\Schemas\Components\Group::make()
                            ->columnSpan(['lg' => 1])
                            ->schema([
                                \Filament\Schemas\Components\Section::make('Publishing')
                                    ->icon('heroicon-m-rocket-launch')
                                    ->schema([
                                        Select::make('status')
                                            ->options([
                                                'draft' => 'Draft',
                                                'ready_for_review' => 'Ready for Review',
                                                'published' => 'Published',
                                            ])
                                            ->default('draft')
                                            ->required()
                                            ->selectablePlaceholder(false),

                                        DateTimePicker::make('published_at')
                                            ->default(now()),

                                        Select::make('author_id')
                                            ->relationship('author', 'username')
                                            ->searchable()
                                            ->default(fn() => auth()->id())
                                            ->required(),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Taxonomy')
                                    ->icon('heroicon-m-tag')
                                    ->schema([
                                        Select::make('difficulty')
                                            ->options([
                                                'beginner' => 'Beginner',
                                                'intermediate' => 'Intermediate',
                                                'advanced' => 'Advanced',
                                            ])
                                            ->required(),
                                    ]),

                                \Filament\Schemas\Components\Section::make('Media')
                                    ->icon('heroicon-m-photo')
                                    ->schema([
                                        FileUpload::make('featured_image_url')
                                            ->label('Featured Image')
                                            ->image()
                                            ->disk('public')
                                            ->imageEditor(),
                                    ]),
                            ]),
                    ]),
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
