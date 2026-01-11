<?php

namespace App\Filament\Components;

use App\Services\SeoAnalyzerService;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Grid;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\ViewField;
use Filament\Actions\Action;

class SeoForm
{
    public static function make(): Section
    {
        return Section::make('Search Engine Optimization')
            ->description('Optimize your content for search engines.')
            ->icon('heroicon-o-magnifying-glass')
            ->collapsed()
            ->schema([
                // SEO Score Display
                ViewField::make('seo_score')
                    ->view('filament.forms.components.seo-score')
                    ->columnSpanFull(),

                Grid::make(2)->schema([
                    // SEO Title with auto-fill
                    TextInput::make('seo_title')
                        ->label('SEO Title')
                        ->placeholder('Auto-generated from article title')
                        ->helperText(fn($state) => 'Characters: ' . mb_strlen($state ?? '') . '/60')
                        ->maxLength(70)
                        ->live(onBlur: true)
                        ->suffixAction(
                            Action::make('auto_fill_title')
                                ->icon('heroicon-o-sparkles')
                                ->tooltip('Auto-fill from article title')
                                ->action(function ($get, $set) {
                                    $title = $get('title') ?? '';
                                    $set('seo_title', SeoAnalyzerService::generateSeoTitle($title));
                                })
                        ),

                    // Focus Keyword with suggestion
                    TextInput::make('focus_keyword')
                        ->label('Focus Keyword')
                        ->placeholder('Main keyword to rank for')
                        ->helperText('Enter the main keyword you want to rank for.')
                        ->live(onBlur: true)
                        ->suffixAction(
                            Action::make('suggest_keyword')
                                ->icon('heroicon-o-light-bulb')
                                ->tooltip('Suggest keyword from title')
                                ->action(function ($get, $set) {
                                    $title = $get('title') ?? '';
                                    $keyword = SeoAnalyzerService::suggestFocusKeyword($title);
                                    if ($keyword) {
                                        $set('focus_keyword', $keyword);
                                    }
                                })
                        ),
                ]),

                // Meta Description with auto-fill
                Textarea::make('seo_description')
                    ->label('Meta Description')
                    ->placeholder('Auto-generated from excerpt')
                    ->helperText(fn($state) => 'Characters: ' . mb_strlen($state ?? '') . '/160 (optimal: 150-160)')
                    ->maxLength(170)
                    ->rows(3)
                    ->live(onBlur: true)
                    ->columnSpanFull()
                    ->hintAction(
                        Action::make('auto_fill_description')
                            ->icon('heroicon-o-sparkles')
                            ->label('Auto-fill')
                            ->action(function ($get, $set) {
                                $excerpt = $get('excerpt') ?? '';
                                $set('seo_description', SeoAnalyzerService::generateMetaDescription($excerpt));
                            })
                    ),

                Grid::make(2)->schema([
                    TextInput::make('canonical_url')
                        ->label('Canonical URL')
                        ->url()
                        ->placeholder('https://...')
                        ->helperText('Only use for duplicate content.'),

                    Toggle::make('is_noindex')
                        ->label('No Index')
                        ->helperText('Hide from search engines.')
                        ->default(false)
                        ->inline(false),
                ]),
            ])
            ->columns(1);
    }
}
