<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaKitSettingResource\Pages;
use App\Models\MediaKitSetting;
use App\Services\MediaKitService;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class MediaKitSettingResource extends Resource
{
    protected static ?string $model = MediaKitSetting::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-document-chart-bar';

    protected static \UnitEnum|string|null $navigationGroup = 'Marketing & Branding';

    protected static ?int $navigationSort = 10;

    protected static ?string $navigationLabel = 'Media Kit Settings';

    protected static ?string $modelLabel = 'Media Kit Setting';

    protected static ?string $pluralModelLabel = 'Media Kit Settings';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Section::make('Basic Information')
                    ->components([
                        Forms\Components\TextInput::make('key')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->helperText('Unique identifier (e.g., about_title, social_facebook_followers)')
                            ->placeholder('about_title')
                            ->maxLength(255),

                        Forms\Components\Select::make('section')
                            ->options([
                                'about' => 'About Portal',
                                'stats' => 'Statistics',
                                'social' => 'Social Media',
                                'audience' => 'Audience Demographics',
                                'content' => 'Content Strategy',
                                'development' => 'Development & Roadmap',
                            ])
                            ->required()
                            ->native(false),

                        Forms\Components\Select::make('type')
                            ->options([
                                'text' => 'Text / Textarea',
                                'number' => 'Number',
                                'json' => 'JSON (Array/Object)',
                                'boolean' => 'Boolean (Yes/No)',
                            ])
                            ->required()
                            ->live()
                            ->native(false)
                            ->helperText('Determines how the value is stored and displayed'),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Value')
                    ->components([
                        // Textarea for text/json
                        Forms\Components\Textarea::make('value')
                            ->label('Value')
                            ->rows(5)
                            ->visible(fn($get) => in_array($get('type'), ['text', 'json']))
                            ->helperText(fn($get) => $get('type') === 'json' ? 'Enter valid JSON: {"key": "value"} or ["item1", "item2"]' : 'Enter text value')
                            ->columnSpanFull(),

                        // Number input
                        Forms\Components\TextInput::make('value')
                            ->label('Value')
                            ->numeric()
                            ->visible(fn($get) => $get('type') === 'number')
                            ->helperText('Enter numbers only')
                            ->columnSpanFull(),

                        // Toggle for boolean
                        Forms\Components\Toggle::make('value')
                            ->label('Value')
                            ->visible(fn($get) => $get('type') === 'boolean')
                            ->helperText('Enable/Disable this setting')
                            ->formatStateUsing(fn($state) => $state === '1' || $state === 'true' || $state === true)
                            ->dehydrateStateUsing(fn($state) => $state ? '1' : '0')
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Display Settings')
                    ->components([
                        Forms\Components\TextInput::make('order')
                            ->numeric()
                            ->default(0)
                            ->helperText('Display order (lower = first)'),

                        Forms\Components\Toggle::make('is_visible')
                            ->label('Visible')
                            ->default(true)
                            ->helperText('Show on public media kit page'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('key')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->copyMessage('Key copied to clipboard')
                    ->tooltip('Click to copy'),

                Tables\Columns\TextColumn::make('section')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'about' => 'primary',
                        'stats' => 'success',
                        'social' => 'warning',
                        'audience' => 'danger',
                        'content' => 'info',
                        'development' => 'gray',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'about' => 'About',
                        'stats' => 'Statistics',
                        'social' => 'Social Media',
                        'audience' => 'Audience',
                        'content' => 'Content',
                        'development' => 'Development',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('value')
                    ->limit(50)
                    ->tooltip(fn($record) => $record->value)
                    ->wrap(),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\IconColumn::make('is_visible')
                    ->boolean()
                    ->label('Visible'),

                Tables\Columns\TextColumn::make('order')
                    ->sortable()
                    ->alignCenter(),
            ])
            ->defaultSort('section')
            ->filters([
                Tables\Filters\SelectFilter::make('section')
                    ->options([
                        'about' => 'About',
                        'stats' => 'Statistics',
                        'social' => 'Social Media',
                        'audience' => 'Audience',
                        'content' => 'Content',
                        'development' => 'Development',
                    ])
                    ->multiple(),

                Tables\Filters\TernaryFilter::make('is_visible')
                    ->label('Visibility')
                    ->placeholder('All')
                    ->trueLabel('Visible only')
                    ->falseLabel('Hidden only'),

                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'text' => 'Text',
                        'number' => 'Number',
                        'json' => 'JSON',
                        'boolean' => 'Boolean',
                    ])
                    ->multiple(),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->headerActions([
                Tables\Actions\Action::make('clear_cache')
                    ->label('Clear Media Kit Cache')
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->action(function () {
                        app(MediaKitService::class)->clearCache();

                        Notification::make()
                            ->title('Cache cleared successfully')
                            ->body('Media kit data will be refreshed on next page load')
                            ->success()
                            ->send();
                    })
                    ->requiresConfirmation()
                    ->modalHeading('Clear Media Kit Cache')
                    ->modalDescription('This will force the media kit page to fetch fresh data on the next visit.')
                    ->modalSubmitActionLabel('Clear Cache'),
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
            'index' => Pages\ListMediaKitSettings::route('/'),
            'create' => Pages\CreateMediaKitSetting::route('/create'),
            'edit' => Pages\EditMediaKitSetting::route('/{record}/edit'),
        ];
    }
}
