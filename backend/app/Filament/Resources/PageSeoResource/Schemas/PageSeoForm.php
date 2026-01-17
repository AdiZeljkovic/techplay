<?php

namespace App\Filament\Resources\PageSeoResource\Schemas;

use Filament\Schemas\Schema;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Section;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Toggle;

class PageSeoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Page Information')
                    ->schema([
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
                    ])->columns(2),

                Section::make('SEO Meta Tags')
                    ->schema([
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
                    ]),

                Section::make('Open Graph')
                    ->schema([
                        TextInput::make('og_title')
                            ->label('OG Title')
                            ->placeholder('Leave empty to use Meta Title'),
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
                    ])->collapsed(),

                Section::make('Advanced')
                    ->schema([
                        TextInput::make('canonical_url')
                            ->label('Canonical URL')
                            ->placeholder('Leave empty for default')
                            ->url(),
                        Toggle::make('is_noindex')
                            ->label('NoIndex (hide from search engines)'),
                    ])->collapsed(),
            ]);
    }
}
