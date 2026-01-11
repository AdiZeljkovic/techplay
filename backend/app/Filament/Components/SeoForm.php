<?php

namespace App\Filament\Components;

use Filament\Forms\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\ViewField;

class SeoForm
{
    public static function make(): Section
    {
        return Section::make('Search Engine Optimization')
            ->description('Customize how this content appears in search results.')
            ->icon('heroicon-o-magnifying-glass')
            ->collapsed()
            ->schema([
                ViewField::make('seo_preview')
                    ->view('filament.forms.components.seo-preview')
                    ->columnSpanFull(),

                TextInput::make('seo_title')
                    ->label('SEO Title')
                    ->helperText('Leave empty to use the default title.')
                    ->maxLength(60)
                    ->live(onBlur: true),

                Textarea::make('seo_description')
                    ->label('Meta Description')
                    ->helperText('Optimal length: 150-160 characters.')
                    ->maxLength(160)
                    ->rows(3),

                TextInput::make('focus_keyword')
                    ->label('Focus Keyword')
                    ->helperText('Main keyword you want to rank for.'),

                TextInput::make('canonical_url')
                    ->label('Canonical URL')
                    ->url()
                    ->helperText('Only use if this content is a duplicate of another URL.'),

                Toggle::make('is_noindex')
                    ->label('No Index')
                    ->helperText('Prevent search engines from indexing this page.')
                    ->default(false),
            ])->columns(1);
    }
}
