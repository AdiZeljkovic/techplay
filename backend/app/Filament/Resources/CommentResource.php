<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CommentResource\Pages;
use App\Models\Comment;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn; // For custom actions in table
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CommentResource extends Resource
{
    protected static ?string $model = Comment::class;

    /**
     * Eager load what the table shows.
     *
     * Filament does not do this by itself — its table code never reads a
     * column's relationship name for loading, only for grouping. Measured on
     * production: without this, ten rows cost one to two extra queries each, so
     * a full page of twenty-five ran about fifty queries to draw one column.
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['commentable', 'user']);
    }

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-chat-bubble-oval-left-ellipsis';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    public static function getNavigationSort(): ?int
    {
        return 40;
    }

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
                    ->tooltip(fn (Comment $record): string => $record->content),
                TextColumn::make('commentable_type')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => class_basename($state))
                    ->color('gray')
                    ->label('On'),
                TextColumn::make('commentable.title')
                    ->label('Content Title')
                    ->limit(40)
                    ->placeholder('—')
                    ->url(fn (Comment $record): ?string => match ($record->commentable_type) {
                        'App\\Models\\Article' => $record->commentable_id
                            ? route('filament.admin.resources.news-articles.edit', $record->commentable_id)
                            : null,
                        default => null,
                    })
                    ->openUrlInNewTab(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
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
                ViewAction::make(),
                EditAction::make(),
                Action::make('approve')
                    ->action(fn (Comment $record) => $record->update(['status' => 'approved']))
                    ->requiresConfirmation()
                    ->color('success')
                    ->icon('heroicon-o-check')
                    ->visible(fn (Comment $record) => $record->status !== 'approved'),
                Action::make('spam')
                    ->action(fn (Comment $record) => $record->update(['status' => 'spam']))
                    ->requiresConfirmation()
                    ->color('danger')
                    ->icon('heroicon-o-no-symbol')
                    ->visible(fn (Comment $record) => $record->status !== 'spam'),
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
