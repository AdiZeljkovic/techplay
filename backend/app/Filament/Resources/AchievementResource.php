<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AchievementResource\Pages;
use App\Models\Achievement;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup; // Tentative, will verify

class AchievementResource extends Resource
{
    protected static ?string $model = Achievement::class;

    protected static $navigationGroup = 'Community Hub';
    protected static ?int $navigationSort = 6;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    Forms\Components\Textarea::make('description')
                        ->maxLength(65535)
                        ->columnSpanFull(),
                    Forms\Components\TextInput::make('icon_path')
                        ->label('Icon Group/Name')
                        ->placeholder('lucide-trophy')
                        ->maxLength(255),
                    Forms\Components\TextInput::make('points')
                        ->required()
                        ->numeric()
                        ->default(10),
                    Forms\Components\Select::make('criteria_type')
                        ->options([
                                'posts_count' => 'Posts Count',
                                'comments_count' => 'Comments Count',
                                'login_streak' => 'Login Streak',
                                'reputation' => 'Reputation',
                                'xp' => 'XP',
                                'friends_count' => 'Friends Count',
                                'gamertags' => 'Gamertags',
                                'pc_specs' => 'PC Specs',
                                'special' => 'Special',
                                'email_verified' => 'Email Verified',
                                'threads_count' => 'Threads Count',
                            ])
                        ->required(),
                    Forms\Components\TextInput::make('criteria_value')
                        ->required()
                        ->numeric(),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('name')
                        ->searchable(),
                    Tables\Columns\TextColumn::make('points')
                        ->numeric()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('criteria_type')
                        ->badge(),
                    Tables\Columns\TextColumn::make('criteria_value')
                        ->numeric()
                        ->sortable(),
                    Tables\Columns\TextColumn::make('created_at')
                        ->dateTime()
                        ->sortable()
                        ->toggleable(isToggledHiddenByDefault: true),
                ])
            ->filters([
                    //
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
            'index' => Pages\ListAchievements::route('/'),
            'create' => Pages\CreateAchievement::route('/create'),
            'edit' => Pages\EditAchievement::route('/{record}/edit'),
        ];
    }
}
