<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaResource\Pages;
use App\Models\Media;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaResource extends Resource
{
    protected static ?string $model = Media::class;

    protected static ?string $recordTitleAttribute = 'title';

    public static function getNavigationGroup(): ?string
    {
        return 'Content Studio';
    }

    protected static ?int $navigationSort = 60;

    public static function getNavigationLabel(): string
    {
        return 'Media Library';
    }

    public static function getNavigationIcon(): string
    {
        return 'heroicon-o-photo';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Upload Image')
                    ->schema([
                        Forms\Components\FileUpload::make('path')
                            ->label('Image File')
                            ->disk('public')
                            ->directory('media')
                            ->image()
                            ->imageEditor()
                            ->imageEditorAspectRatios([
                                '16:9',
                                '4:3',
                                '1:1',
                            ])
                            ->maxSize(10240)
                            ->required()
                            ->columnSpanFull()
                            // Storage keeps a generated name; this keeps the one
                            // the file arrived with, which is the only one
                            // anybody can search for later.
                            ->storeFileNamesIn('original_name')
                            ->helperText('Max 10 MB. JPG, PNG, GIF or WebP. The file name is kept so you can find it again.'),
                    ]),

                Section::make('Image Details')
                    ->schema([
                        Grid::make(2)->schema([
                            Forms\Components\TextInput::make('title')
                                ->label('Title')
                                ->placeholder('Left empty, the file name is used')
                                ->maxLength(255)
                                ->helperText('What this picture is of. It is what the library search matches on.'),

                            Forms\Components\Select::make('collection')
                                ->label('Collection')
                                ->options([
                                    'default' => '📁 General',
                                    'articles' => '📰 Articles',
                                    'reviews' => '🎮 Reviews',
                                    'guides' => '📖 Guides',
                                    'avatars' => '👤 Avatars',
                                    'banners' => '🖼️ Banners',
                                ])
                                ->default('default')
                                ->native(false)
                                ->helperText('Organize images by type'),
                        ]),

                        Forms\Components\TextInput::make('alt_text')
                            ->label('Alt Text (Accessibility)')
                            ->placeholder('Describe what the image shows...')
                            ->maxLength(255)
                            ->helperText('Important for SEO and screen readers')
                            ->columnSpanFull(),

                        Forms\Components\Hidden::make('uploaded_by')
                            ->default(fn () => auth()->id()),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('path')
                    ->label('')
                    ->disk('public')
                    ->width(100)
                    ->height(75)
                    ->extraImgAttributes(['class' => 'rounded-lg object-cover']),

                TextColumn::make('title')
                    ->label('Title')
                    ->searchable()
                    ->sortable()
                    ->placeholder('Untitled')
                    ->description(fn ($record) => $record->alt_text ? '🔤 '.Str::limit($record->alt_text, 30) : null),

                TextColumn::make('collection')
                    ->label('Collection')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'articles' => 'info',
                        'reviews' => 'success',
                        'guides' => 'warning',
                        'avatars' => 'danger',
                        'banners' => 'primary',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'articles' => '📰 Articles',
                        'reviews' => '🎮 Reviews',
                        'guides' => '📖 Guides',
                        'avatars' => '👤 Avatars',
                        'banners' => '🖼️ Banners',
                        default => '📁 General',
                    }),

                TextColumn::make('mime_type')
                    ->label('Type')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn ($state) => strtoupper(str_replace('image/', '', $state ?? ''))),

                TextColumn::make('human_size')
                    ->label('Size'),

                TextColumn::make('dimensions')
                    ->label('Dimensions')
                    ->getStateUsing(fn ($record) => $record->width && $record->height
                        ? "{$record->width}×{$record->height}"
                        : '-'),

                TextColumn::make('created_at')
                    ->label('Uploaded')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('collection')
                    ->options([
                        'default' => 'General',
                        'articles' => 'Articles',
                        'reviews' => 'Reviews',
                        'guides' => 'Guides',
                        'avatars' => 'Avatars',
                        'banners' => 'Banners',
                    ]),
                SelectFilter::make('mime_type')
                    ->label('Type')
                    ->options([
                        'image/jpeg' => 'JPEG',
                        'image/png' => 'PNG',
                        'image/gif' => 'GIF',
                        'image/webp' => 'WebP',
                    ]),
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Upload Image')
                    ->icon('heroicon-o-arrow-up-tray'),
            ])
            ->actions([
                Action::make('copy_url')
                    ->label('Copy URL')
                    ->icon('heroicon-o-clipboard')
                    ->action(function ($record) {
                        // This will be handled by JS in the frontend
                    })
                    ->url(fn ($record) => Storage::disk('public')->url($record->path))
                    ->openUrlInNewTab(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->contentGrid([
                'md' => 2,
                'lg' => 3,
                'xl' => 4,
            ])
            ->paginated([12, 24, 48, 96]);
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
