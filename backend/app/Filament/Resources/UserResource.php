<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Hash;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['roles']);
    }

    protected static $navigationGroup = 'Community Hub';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        $user = auth()->user();
        // Check Spatie permissions OR old role column for backwards compatibility
        return $user && ($user->can('manage users') || in_array($user->role ?? '', ['admin', 'super_admin']));
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(255),
                    Forms\Components\TextInput::make('email')
                        ->email()
                        ->required()
                        ->maxLength(255),
                    Forms\Components\TextInput::make('password')
                        ->password()
                        ->maxLength(255)
                        ->dehydrateStateUsing(fn($state) => filled($state) ? Hash::make($state) : null)
                        ->required(fn(string $context): bool => $context === 'create')
                        ->dehydrated(fn($state) => filled($state)),
                    Forms\Components\Select::make('roles')
                        ->relationship('roles', 'name')
                        ->multiple()
                        ->preload()
                        ->searchable(),
                    Forms\Components\TextInput::make('xp')
                        ->numeric()
                        ->default(0),
                    Forms\Components\KeyValue::make('gamertags')
                        ->keyLabel('Platform')
                        ->valueLabel('Username/ID')
                        ->columnSpanFull(),
                    Forms\Components\KeyValue::make('pc_specs')
                        ->keyLabel('Component')
                        ->valueLabel('Model')
                        ->columnSpanFull(),
                    Forms\Components\KeyValue::make('settings')
                        ->columnSpanFull(),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('username')
                        ->searchable(),
                    Tables\Columns\TextColumn::make('email')
                        ->searchable(),
                    Tables\Columns\TextColumn::make('roles.name')
                        ->badge()
                        ->color(fn(string $state): string => match ($state) {
                            'Super Admin' => 'danger',
                            'Editor-in-Chief' => 'danger',
                            'Editor' => 'warning',
                            'Moderator' => 'info',
                            'Journalist' => 'success',
                            default => 'gray',
                        }),
                    Tables\Columns\TextColumn::make('xp')
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
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
