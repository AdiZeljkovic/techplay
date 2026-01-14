<?php

namespace App\Filament\Resources;

use App\Filament\Resources\VideoResource\Pages;
use App\Models\Video;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Schemas\Components\Utilities\Set;
use Illuminate\Support\Str;
use Filament\Schemas\Schema;

class VideoResource extends Resource
{
    protected static ?string $model = Video::class;

    protected static ?string $slug = 'videos';

    protected static ?string $navigationGroup = 'Content Studio';
    protected static ?int $navigationSort = 4;

    public static function getNavigationLabel(): string
    {
        return 'Videos';
    }

    public static function getModelLabel(): string
    {
        return 'Video';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('title')
                        ->required()
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn(Set $set, ?string $state) => $set('slug', Str::slug($state))),
                    Forms\Components\TextInput::make('slug')
                        ->required()
                        ->unique(ignoreRecord: true),
                    Forms\Components\TextInput::make('youtube_url')
                        ->label('YouTube URL')
                        ->required()
                        ->url()
                        ->columnSpanFull()
                        ->helperText('Paste any YouTube video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ)'),
                    Forms\Components\TextInput::make('thumbnail_url')
                        ->label('Custom Thumbnail URL')
                        ->url()
                        ->columnSpanFull()
                        ->helperText('Optional. Leave empty to auto-fetch from YouTube.'),
                    Forms\Components\DateTimePicker::make('published_at')
                        ->default(now()),
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
                    TextColumn::make('youtube_url')
                        ->label('Link')
                        ->formatStateUsing(fn(string $state) => 'View on YouTube')
                        ->url(fn(Video $record) => $record->youtube_url)
                        ->openUrlInNewTab()
                        ->color('primary'),
                    TextColumn::make('published_at')
                        ->dateTime()
                        ->sortable(),
                    TextColumn::make('created_at')
                        ->dateTime()
                        ->toggleable(isToggledHiddenByDefault: true),
                ])
            ->filters([
                    //
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
            'index' => Pages\ListVideos::route('/'),
            'create' => Pages\CreateVideo::route('/create'),
            'edit' => Pages\EditVideo::route('/{record}/edit'),
        ];
    }
}
