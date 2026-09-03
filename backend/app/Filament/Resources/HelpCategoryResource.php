<?php

namespace App\Filament\Resources;

use App\Filament\Resources\HelpCategoryResource\Pages;
use App\Models\HelpCategory;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * The topics a reader picks between before they read anything.
 *
 * Small on purpose. The only things worth deciding about a topic are what it is
 * called, what it says underneath, and where it sits — and the last of those is
 * the one that gets changed most, which is why the table is reorderable rather
 * than making somebody type numbers into a form.
 */
class HelpCategoryResource extends Resource
{
    protected static ?string $model = HelpCategory::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $slug = 'help-topics';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 46;

    /** The count column is the whole point of the table; without this it is N+1. */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->withCount('articles');
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    public static function getNavigationLabel(): string
    {
        return 'Help topics';
    }

    public static function getModelLabel(): string
    {
        return 'Help topic';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make()
                ->schema([
                    TextInput::make('name')
                        ->required()
                        ->maxLength(60)
                        ->live(onBlur: true)
                        // On create only. Renaming a live topic must not silently
                        // move every answer underneath it to a new address — the
                        // slug is editable right below when that is the intent.
                        ->afterStateUpdated(fn (string $operation, $state, callable $set) => $operation === 'create'
                            ? $set('slug', Str::slug((string) $state))
                            : null),

                    TextInput::make('slug')
                        ->required()
                        ->maxLength(60)
                        ->prefix('help.techplay.gg/')
                        ->unique(ignoreRecord: true)
                        ->helperText('Changing this changes the address of every answer inside.'),

                    Textarea::make('description')
                        ->label('One line under the heading')
                        ->rows(2)
                        ->maxLength(500)
                        ->helperText('Also used as the description in search results when nothing better is written.'),

                    TextInput::make('icon')
                        ->label('Icon')
                        ->placeholder('heroicon-o-link')
                        ->helperText('A heroicon name. The index is a grid of cards, and a card without a mark reads as a list item.'),

                    Toggle::make('is_published')
                        ->label('Visible')
                        ->default(true)
                        ->helperText('Hiding a topic hides every answer inside it, including published ones.'),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            // Drag to reorder. The order of topics is the editor's answer to
            // "what goes wrong most", and it is not a thing anybody should be
            // computing integers for.
            ->reorderable('sort_order')
            ->defaultSort('sort_order')
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->weight('medium')
                    ->description(fn (HelpCategory $record): ?string => $record->description),

                TextColumn::make('articles_count')
                    ->label('Answers')
                    ->numeric()
                    ->alignRight(),

                IconColumn::make('is_published')
                    ->label('Visible')
                    ->boolean(),
            ])
            ->recordActions([
                EditAction::make()->tooltip('Edit')->iconButton(),
                DeleteAction::make()->tooltip('Delete')->iconButton(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListHelpCategories::route('/'),
            'create' => Pages\CreateHelpCategory::route('/create'),
            'edit' => Pages\EditHelpCategory::route('/{record}/edit'),
        ];
    }
}
