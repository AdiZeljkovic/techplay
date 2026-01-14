<?php

namespace App\Filament\Resources;

use App\Filament\Resources\NewsletterSubscriberResource\Pages;
use App\Models\NewsletterSubscriber;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Schemas\Schema;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\BulkAction;

class NewsletterSubscriberResource extends Resource
{
    protected static ?string $model = NewsletterSubscriber::class;

    // protected static string $navigationIcon = 'heroicon-o-envelope';

    protected static $navigationGroup = 'System';
    protected static ?int $navigationSort = 5;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                    Forms\Components\TextInput::make('email')
                        ->email()
                        ->required()
                        ->maxLength(255),
                    Forms\Components\Toggle::make('is_active')
                        ->required(),
                ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                    Tables\Columns\TextColumn::make('email')
                        ->searchable()
                        ->sortable(),
                    Tables\Columns\IconColumn::make('email_verified_at')
                        ->label('Verified')
                        ->boolean()
                        ->sortable()
                        ->getStateUsing(fn($record) => $record->email_verified_at !== null),
                    Tables\Columns\IconColumn::make('is_active')
                        ->boolean()
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
                        BulkAction::make('export')
                            ->label('Export Selected')
                            ->icon('heroicon-o-arrow-down-tray')
                            ->action(function (\Illuminate\Database\Eloquent\Collection $records) {
                                return response()->streamDownload(function () use ($records) {
                                    echo "Email,Status,Subscribed At\n";
                                    foreach ($records as $record) {
                                        $status = $record->is_active ? 'Active' : 'Unsubscribed';
                                        echo "{$record->email},{$status},{$record->created_at}\n";
                                    }
                                }, 'subscribers.csv');
                            })
                            ->deselectRecordsAfterCompletion(),
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
            'index' => Pages\ListNewsletterSubscribers::route('/'),
            'create' => Pages\CreateNewsletterSubscriber::route('/create'),
            'edit' => Pages\EditNewsletterSubscriber::route('/{record}/edit'),
        ];
    }
}
