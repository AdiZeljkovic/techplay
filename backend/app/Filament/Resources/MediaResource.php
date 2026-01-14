<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaResource\Pages;
use App\Models\Media;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;

class MediaResource extends Resource
{
    protected static ?string $model = Media::class;

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?string $navigationGroup = 'Content Studio';
    protected static ?int $navigationSort = 6;

    public static function getNavigationLabel(): string
    {
        return 'Media Library';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\FileUpload::make('path')
                        ->label('File')
                        ->disk('public')
                        ->directory('media')
                        ->image()
                        ->imageEditor()
                        ->maxSize(10240)
                        ->required()
                        ->columnSpanFull(),
                    Forms\Components\TextInput::make('title')
                        ->maxLength(255),
                    Forms\Components\TextInput::make('alt_text')
                        ->label('Alt Text')
                        ->maxLength(255)
                        ->helperText('Describe the image for accessibility and SEO'),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    ImageColumn::make('path')
                        ->label('Preview')
                        ->disk('public')
                        ->width(80)
                        ->height(60),
                    TextColumn::make('title')
                        ->searchable()
                        ->sortable(),
                    TextColumn::make('alt_text')
                        ->label('Alt Text')
                        ->limit(30),
                    TextColumn::make('mime_type')
                        ->label('Type')
                        ->badge(),
                    TextColumn::make('size')
                        ->label('Size')
                        ->formatStateUsing(fn($state) => $state ? number_format($state / 1024, 1) . ' KB' : '-'),
                    TextColumn::make('created_at')
                        ->label('Uploaded')
                        ->dateTime('M d, Y')
                        ->sortable(),
                ])
            ->defaultSort('created_at', 'desc')
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

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMedia::route('/'),
            'create' => Pages\CreateMedia::route('/create'),
            'edit' => Pages\EditMedia::route('/{record}/edit'),
        ];
    }
}
