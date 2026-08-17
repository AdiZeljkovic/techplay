<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteSettingResource\Pages;
use App\Models\SiteSetting;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class SiteSettingResource extends Resource
{
    protected static ?string $model = SiteSetting::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-wrench-screwdriver';

    protected static ?string $navigationLabel = 'Raw settings table';

    /**
     * Out of the sidebar, still at /admin/site-settings.
     *
     * This is the raw key/value editor: a `value` string field and a `type`
     * dropdown offering `text` or `boolean`, with nothing to say which one the
     * row wants. Changing the site's name here meant finding the row called
     * `site_name` and typing into a column. The Settings page does that job
     * properly now, with the right control for each value and the right group
     * written back.
     *
     * It stays reachable because it is the only screen that can add a key the
     * Settings page has never heard of, or repair one whose group is wrong —
     * the escape hatch for the day something is stored that no form knows
     * about. That is a rare day, and rare is exactly what a sidebar row is bad
     * at representing.
     */
    public static function shouldRegisterNavigation(): bool
    {
        return false;
    }

    public static function getNavigationGroup(): ?string
    {
        return 'System';
    }

    protected static ?int $navigationSort = 90;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\TextInput::make('key')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Select::make('group')
                    ->options([
                        'general' => 'General',
                        'socials' => 'Social Media',
                        'contact' => 'Contact Info',
                    ])
                    ->required(),
                Forms\Components\Select::make('type')
                    ->options([
                        'text' => 'Text',
                        'boolean' => 'Boolean (Toggle)',
                        'image' => 'Image URL',
                        'json' => 'JSON',
                    ])
                    ->required()
                    ->live(),
                Forms\Components\Textarea::make('value')
                    ->rows(3)
                    ->columnSpanFull()
                    ->hidden(fn ($get) => $get('type') === 'boolean'),
                Forms\Components\Toggle::make('value')
                    ->label('Enabled')
                    ->visible(fn ($get) => $get('type') === 'boolean')
                    ->formatStateUsing(function ($state) {
                        return filter_var($state, FILTER_VALIDATE_BOOLEAN);
                    })
                    ->dehydrateStateUsing(fn ($state) => $state ? '1' : '0'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('group', 'asc')
            ->columns([
                Tables\Columns\TextColumn::make('key')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('group')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'general' => 'info',
                        'socials' => 'success',
                        'contact' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('value')
                    ->limit(50),
                Tables\Columns\TextColumn::make('type'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('group')
                    ->options([
                        'general' => 'General',
                        'socials' => 'Social Media',
                        'contact' => 'Contact Info',
                    ]),
            ])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSiteSettings::route('/'),
            'create' => Pages\CreateSiteSetting::route('/create'),
            'edit' => Pages\EditSiteSetting::route('/{record}/edit'),
        ];
    }
}
