<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ReportResource\Pages;
use App\Models\Report;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\TextColumn as BadgeColumn; // Filament v3 uses TextColumn with badge() method, aliasing for compatibility or just use TextColumn directly
use Filament\Schemas\Schema; // Ensure Schema is valid if used? No, Resource::form uses Schema in v4 apparently? MediaResource uses Schema.
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Actions\DeleteAction;
use Filament\Tables\Actions\DeleteBulkAction;
use Filament\Tables\Actions\BulkActionGroup;

class ReportResource extends Resource
{
    protected static ?string $model = Report::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-flag';

    public static function getNavigationGroup(): ?string
    {
        return 'Community';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('reporter', 'username')
                    ->disabled()
                    ->label('Reporter'),

                TextInput::make('reportable_type')
                    ->disabled()
                    ->label('Type'),

                TextInput::make('reportable_id')
                    ->disabled()
                    ->label('Content ID'),

                Textarea::make('reason')
                    ->columnSpanFull(),

                Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'resolved' => 'Resolved',
                        'dismissed' => 'Dismissed',
                    ])
                    ->required()
                    ->native(false),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('reporter.username')
                    ->label('Reporter')
                    ->searchable(),

                TextColumn::make('reportable_type')
                    ->label('Type')
                    ->formatStateUsing(fn(string $state): string => class_basename($state))
                    ->badge(),

                TextColumn::make('reason')
                    ->limit(50)
                    ->searchable(),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        'pending' => 'warning',
                        'resolved' => 'success',
                        'dismissed' => 'gray',
                    }),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
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
            'index' => Pages\ListReports::route('/'),
            // 'create' => Pages\CreateReport::route('/create'),
            'edit' => Pages\EditReport::route('/{record}/edit'),
        ];
    }
}
