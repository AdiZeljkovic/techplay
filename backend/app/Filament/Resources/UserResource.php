<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-users';

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['roles']);
    }

    // Make email visible for Filament forms
    public static function mutateFormDataBeforeFill(array $data): array
    {
        return $data;
    }

    public static function getRecord($key): Model
    {
        return parent::getRecord($key)->makeVisible('email');
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

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
                    ->dehydrateStateUsing(fn ($state) => filled($state) ? Hash::make($state) : null)
                    ->required(fn (string $context): bool => $context === 'create')
                    ->dehydrated(fn ($state) => filled($state)),
                Forms\Components\Select::make('roles')
                    ->relationship('roles', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable(),
                Forms\Components\TextInput::make('display_name')
                    ->label('Display Name')
                    ->helperText('Publicly visible name (shown on articles, author page, profile).')
                    ->maxLength(100)
                    ->live(debounce: 600)
                    ->afterStateUpdated(function ($state, $set, $get) {
                        if (filled($state)) {
                            $base = Str::slug($state);
                            $current = $get('author_slug');
                            // Only auto-fill if author_slug is empty
                            if (blank($current)) {
                                $set('author_slug', $base);
                            }
                        }
                    }),
                Forms\Components\TextInput::make('xp')
                    ->numeric()
                    ->default(0),
                Forms\Components\TextInput::make('author_slug')
                    ->label('Author Page URL Slug')
                    ->prefix('techplay.gg/author/')
                    ->helperText('Auto-generated from display name. Edit only if needed.')
                    ->unique(ignoreRecord: true)
                    ->maxLength(100),
                Section::make('Author Social Links')
                    ->description('Social profiles shown on author page and included in Google structured data.')
                    ->icon('heroicon-o-link')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        Forms\Components\TextInput::make('author_social_links.twitter')
                            ->label('Twitter / X')
                            ->prefix('https://x.com/')
                            ->placeholder('username')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('author_social_links.linkedin')
                            ->label('LinkedIn')
                            ->prefix('https://linkedin.com/in/')
                            ->placeholder('username')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('author_social_links.youtube')
                            ->label('YouTube')
                            ->url()
                            ->placeholder('https://youtube.com/@channel')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('author_social_links.instagram')
                            ->label('Instagram')
                            ->prefix('https://instagram.com/')
                            ->placeholder('username')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('author_social_links.website')
                            ->label('Personal Website')
                            ->url()
                            ->placeholder('https://example.com')
                            ->maxLength(255),
                    ])
                    ->columnSpanFull(),
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
                Section::make('Ban Management')
                    ->icon('heroicon-o-no-symbol')
                    ->collapsible()
                    ->collapsed()
                    ->schema([
                        Forms\Components\Toggle::make('is_banned')
                            ->label('Banned')
                            ->live()
                            ->helperText('Zabranjuje korisniku pristup platformi'),
                        Forms\Components\Textarea::make('ban_reason')
                            ->label('Ban Reason')
                            ->rows(2)
                            ->visible(fn ($get) => $get('is_banned'))
                            ->placeholder('Razlog bana...')
                            ->columnSpanFull(),
                    ])
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('username')
                    ->searchable(),
                Tables\Columns\TextColumn::make('display_name')
                    ->label('Display Name')
                    ->searchable()
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('email')
                    ->searchable(),
                Tables\Columns\TextColumn::make('roles.name')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
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
                Tables\Columns\IconColumn::make('is_banned')
                    ->label('Banned')
                    ->boolean()
                    ->trueIcon('heroicon-o-no-symbol')
                    ->falseIcon('heroicon-o-check-circle')
                    ->trueColor('danger')
                    ->falseColor('success'),
                Tables\Columns\TextColumn::make('discord_id')
                    ->label('Discord ID')
                    ->toggleable()
                    ->searchable()
                    ->copyable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_banned')
                    ->label('Ban Status')
                    ->trueLabel('Banned only')
                    ->falseLabel('Active only'),
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
