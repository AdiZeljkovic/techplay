<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PageSeoResource\Pages;
use App\Models\PageSeo;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\CreateAction;

class PageSeoResource extends Resource
{
    protected static ?string $model = PageSeo::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-document-magnifying-glass';

    public static function getNavigationGroup(): ?string
    {
        return 'SEO Management';
    }

    public static function getNavigationSort(): ?int
    {
        return 2;
    }

    public static function getNavigationLabel(): string
    {
        return 'Page SEO';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)->schema([
                    TextInput::make('page_path')
                        ->label('Page Path')
                        ->placeholder('/about')
                        ->helperText('URL path (e.g., /about)')
                        ->required()
                        ->unique(ignoreRecord: true),
                    TextInput::make('page_name')
                        ->label('Page Name')
                        ->placeholder('About Us')
                        ->required(),
                ]),

                TextInput::make('meta_title')
                    ->label('Meta Title')
                    ->placeholder('Page Title - TechPlay')
                    ->helperText('50-60 characters recommended')
                    ->maxLength(70),

                Textarea::make('meta_description')
                    ->label('Meta Description')
                    ->placeholder('Brief description for search results...')
                    ->helperText('150-160 characters recommended')
                    ->rows(3)
                    ->maxLength(200),

                TagsInput::make('meta_keywords')
                    ->label('Keywords')
                    ->placeholder('Add keywords')
                    ->helperText('Press Enter after each keyword'),

                Grid::make(2)->schema([
                    TextInput::make('og_title')
                        ->label('OG Title')
                        ->placeholder('Leave empty to use Meta Title'),
                    TextInput::make('canonical_url')
                        ->label('Canonical URL')
                        ->placeholder('Leave empty for default')
                        ->url(),
                ]),

                Textarea::make('og_description')
                    ->label('OG Description')
                    ->placeholder('Leave empty to use Meta Description')
                    ->rows(2),

                FileUpload::make('og_image')
                    ->label('OG Image')
                    ->image()
                    ->disk('public')
                    ->directory('seo')
                    ->helperText('1200x630px recommended'),

                Toggle::make('is_noindex')
                    ->label('NoIndex (hide from search engines)'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('page_path')
                    ->label('Path')
                    ->searchable()
                    ->sortable()
                    ->badge()
                    ->color('info'),
                TextColumn::make('page_name')
                    ->label('Name')
                    ->searchable(),
                TextColumn::make('meta_title')
                    ->label('Title')
                    ->limit(40)
                    ->tooltip(fn($record) => $record->meta_title),
                TextColumn::make('meta_description')
                    ->label('Description')
                    ->limit(50)
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('is_noindex')
                    ->label('NoIndex')
                    ->boolean()
                    ->trueIcon('heroicon-o-eye-slash')
                    ->falseIcon('heroicon-o-eye'),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('page_path')
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPageSeo::route('/'),
            'create' => Pages\CreatePageSeo::route('/create'),
            'edit' => Pages\EditPageSeo::route('/{record}/edit'),
        ];
    }
}

