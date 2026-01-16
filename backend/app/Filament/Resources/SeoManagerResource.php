<?php

namespace App\Filament\Resources;

use App\Models\Article;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class SeoManagerResource extends Resource
{
    protected static ?string $model = Article::class;
    protected static ?string $slug = 'seo-manager';

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-document-magnifying-glass';
    }

    public static function getNavigationLabel(): string
    {
        return 'Page SEO';
    }

    public static function getModelLabel(): string
    {
        return 'Page SEO';
    }

    public static function getPluralModelLabel(): string
    {
        return 'All Pages SEO';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Settings';
    }

    public static function getNavigationSort(): ?int
    {
        return 2;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('title')
                    ->label('Page Title')
                    ->searchable()
                    ->sortable()
                    ->limit(40)
                    ->tooltip(fn($record) => $record->title),

                TextColumn::make('category')
                    ->label('Type')
                    ->badge()
                    ->color('gray'),

                TextColumn::make('meta_title')
                    ->label('Meta Title')
                    ->limit(30)
                    ->placeholder('❌ Missing')
                    ->color(fn($state) => $state ? 'success' : 'danger')
                    ->tooltip(fn($record) => $record->meta_title),

                TextColumn::make('meta_description')
                    ->label('Meta Desc')
                    ->limit(30)
                    ->placeholder('❌ Missing')
                    ->color(fn($state) => $state ? 'success' : 'danger'),

                TextColumn::make('meta_title_length')
                    ->label('Title Len')
                    ->state(fn($record) => strlen($record->meta_title ?? ''))
                    ->badge()
                    ->color(fn($state) => match (true) {
                        $state == 0 => 'danger',
                        $state < 30 => 'warning',
                        $state > 60 => 'warning',
                        default => 'success'
                    }),

                TextColumn::make('meta_desc_length')
                    ->label('Desc Len')
                    ->state(fn($record) => strlen($record->meta_description ?? ''))
                    ->badge()
                    ->color(fn($state) => match (true) {
                        $state == 0 => 'danger',
                        $state < 120 => 'warning',
                        $state > 160 => 'warning',
                        default => 'success'
                    }),

                IconColumn::make('is_noindex')
                    ->label('Noindex')
                    ->boolean()
                    ->trueIcon('heroicon-o-eye-slash')
                    ->falseIcon('heroicon-o-eye')
                    ->trueColor('danger')
                    ->falseColor('success'),

                TextColumn::make('status')
                    ->badge()
                    ->color(fn($state) => match ($state) {
                        'published' => 'success',
                        'draft' => 'warning',
                        default => 'gray'
                    }),
            ])
            ->filters([
                SelectFilter::make('category')
                    ->options([
                        'gaming' => 'Gaming',
                        'reviews' => 'Reviews',
                        'pc' => 'PC',
                        'console' => 'Console',
                        'industry' => 'Industry',
                    ]),

                TernaryFilter::make('has_meta')
                    ->label('Has Meta Description')
                    ->queries(
                        true: fn($query) => $query->whereNotNull('meta_description')->where('meta_description', '!=', ''),
                        false: fn($query) => $query->whereNull('meta_description')->orWhere('meta_description', ''),
                    ),

                TernaryFilter::make('is_noindex')
                    ->label('Noindex Status'),
            ])
            ->actions([
                EditAction::make()
                    ->modalHeading(fn($record) => 'SEO: ' . $record->title)
                    ->form([
                        Section::make('SEO Settings')
                            ->schema([
                                TextInput::make('meta_title')
                                    ->label('Meta Title')
                                    ->maxLength(70)
                                    ->live()
                                    ->helperText(fn($state) => strlen($state ?? '') . '/60 characters (recommended)')
                                    ->placeholder('Leave empty to use article title'),

                                Textarea::make('meta_description')
                                    ->label('Meta Description')
                                    ->rows(3)
                                    ->maxLength(170)
                                    ->live()
                                    ->helperText(fn($state) => strlen($state ?? '') . '/160 characters (recommended)')
                                    ->placeholder('Brief description for search results'),

                                Grid::make(2)->schema([
                                    TextInput::make('focus_keyword')
                                        ->label('Focus Keyword')
                                        ->placeholder('e.g. gaming news'),

                                    TextInput::make('canonical_url')
                                        ->label('Canonical URL')
                                        ->url()
                                        ->placeholder('Leave empty for default'),
                                ]),

                                Toggle::make('is_noindex')
                                    ->label('Noindex (hide from search engines)')
                                    ->helperText('Enable to prevent Google from indexing this page'),
                            ]),

                        Section::make('Preview')
                            ->schema([
                                \Filament\Forms\Components\Placeholder::make('google_preview')
                                    ->label('Google Search Preview')
                                    ->content(fn($record) => view('filament.components.serp-preview', [
                                        'title' => $record->meta_title ?: $record->title,
                                        'url' => config('app.frontend_url') . '/news/' . $record->slug,
                                        'description' => $record->meta_description ?: $record->excerpt,
                                    ])),
                            ])
                            ->collapsed(),
                    ]),
            ])
            ->defaultSort('updated_at', 'desc')
            ->striped()
            ->paginated([25, 50, 100]);
    }

    public static function getPages(): array
    {
        return [
            'index' => \App\Filament\Resources\SeoManagerResource\Pages\ListSeoPages::route('/'),
        ];
    }
}
