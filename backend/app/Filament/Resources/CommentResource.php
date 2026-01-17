<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CommentResource\Pages;
use App\Models\Comment;
use Filament\Schemas\Schema;
use Filament\Resources\Resource;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\Action; // For custom actions in table
use Filament\Forms;
use Illuminate\Database\Eloquent\Builder;

class CommentResource extends Resource
{
    protected static ?string $model = Comment::class;
    protected static ?string $modelPolicy = \App\Policies\CommentPolicy::class;

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    protected static ?int $navigationSort = 3;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'username')
                    ->required()
                    ->searchable()
                    ->disabled(),
                Forms\Components\Select::make('status')
                    ->options([
                        'approved' => 'Approved',
                        'pending' => 'Pending',
                        'spam' => 'Spam',
                    ])
                    ->required(),
                Forms\Components\Textarea::make('content')
                    ->required()
                    ->columnSpan('full'),
                Forms\Components\DateTimePicker::make('created_at')
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.username')
                    ->searchable()
                    ->sortable()
                    ->label('Author'),
                TextColumn::make('content')
                    ->limit(50)
                    ->searchable()
                    ->tooltip(fn(Comment $record): string => $record->content),
                TextColumn::make('commentable_type')
                    ->badge()
                    ->formatStateUsing(fn(string $state): string => class_basename($state))
                    ->color('gray')
                    ->label('On'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'draft', 'pending' => 'warning',
                        'approved' => 'success',
                        'spam', 'rejected' => 'danger',
                        default => 'gray',
                    })
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime() // Filament 3 default
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'approved' => 'Approved',
                        'pending' => 'Pending',
                        'spam' => 'Spam',
                    ]),
            ])
            ->actions([
                EditAction::make(),
                Action::make('approve')
                    ->action(fn(Comment $record) => $record->update(['status' => 'approved']))
                    ->requiresConfirmation()
                    ->color('success')
                    ->icon('heroicon-o-check')
                    ->visible(fn(Comment $record) => $record->status !== 'approved'),
                Action::make('spam')
                    ->action(fn(Comment $record) => $record->update(['status' => 'spam']))
                    ->requiresConfirmation()
                    ->color('danger')
                    ->icon('heroicon-o-no-symbol')
                    ->visible(fn(Comment $record) => $record->status !== 'spam'),
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
            'index' => Pages\ListComments::route('/'),
            // 'create' => Pages\CreateComment::route('/create'),
            'edit' => Pages\EditComment::route('/{record}/edit'),
        ];
    }
}
