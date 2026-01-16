<?php

namespace App\Filament\Pages;

use App\Models\Article;
use App\Models\Category;
use App\Models\Redirect;
use App\Models\SeoMeta;
use App\Models\SiteSetting;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Grid;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Artisan;

class UltimateSeo extends Page implements HasForms
{
    use InteractsWithForms;

    public ?array $data = [];
    public string $activeTab = 'global';

    protected string $view = 'filament.pages.ultimate-seo';

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-magnifying-glass-circle';
    }

    public static function getNavigationLabel(): string
    {
        return 'Ultimate SEO';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Settings';
    }

    public static function getNavigationSort(): ?int
    {
        return 1;
    }

    public function mount(): void
    {
        $this->form->fill([
            // Global Settings
            'seo_title_separator' => SiteSetting::get('seo_title_separator', '|'),
            'seo_meta_description' => SiteSetting::get('seo_meta_description'),
            'seo_organization_type' => SiteSetting::get('seo_organization_type', 'NewsMediaOrganization'),
            'seo_organization_name' => SiteSetting::get('seo_organization_name', 'TechPlay'),
            'seo_organization_logo' => SiteSetting::get('seo_organization_logo'),

            // Indexing
            'seo_noindex_search' => SiteSetting::get('seo_noindex_search', false),
            'seo_noindex_archives' => SiteSetting::get('seo_noindex_archives', false),
            'seo_noindex_categories' => SiteSetting::get('seo_noindex_categories', false),
            'seo_noindex_tags' => SiteSetting::get('seo_noindex_tags', false),

            // Sitemap
            'seo_enable_sitemap' => SiteSetting::get('seo_enable_sitemap', true),
            'seo_sitemap_include_images' => SiteSetting::get('seo_sitemap_include_images', true),

            // Webmaster
            'seo_google_verification' => SiteSetting::get('seo_google_verification'),
            'seo_bing_verification' => SiteSetting::get('seo_bing_verification'),

            // Analytics
            'seo_google_analytics_id' => SiteSetting::get('seo_google_analytics_id'),
            'seo_gtm_id' => SiteSetting::get('seo_gtm_id'),

            // Social
            'seo_og_image_default' => SiteSetting::get('seo_og_image_default'),
            'seo_twitter_card_type' => SiteSetting::get('seo_twitter_card_type', 'summary_large_image'),

            // Robots
            'seo_robots_txt_content' => SiteSetting::get('seo_robots_txt_content', "User-agent: *\nAllow: /"),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('SEO Tabs')
                    ->tabs([
                        // TAB 1: Global Settings
                        Tab::make('Global Settings')
                            ->icon('heroicon-o-cog-6-tooth')
                            ->schema([
                                Section::make('Title & Meta')
                                    ->schema([
                                        Select::make('seo_title_separator')
                                            ->label('Title Separator')
                                            ->options([
                                                '|' => '| (Pipe)',
                                                '-' => '- (Dash)',
                                                '–' => '– (En Dash)',
                                                '»' => '» (Guillemet)',
                                            ])
                                            ->default('|'),
                                        Textarea::make('seo_meta_description')
                                            ->label('Default Meta Description')
                                            ->rows(3)
                                            ->maxLength(160)
                                            ->helperText(fn($state) => strlen($state ?? '') . '/160 characters')
                                            ->columnSpanFull(),
                                    ])->columns(2),

                                Section::make('Organization (Schema.org)')
                                    ->schema([
                                        Select::make('seo_organization_type')
                                            ->label('Type')
                                            ->options([
                                                'Organization' => 'Organization',
                                                'NewsMediaOrganization' => 'News Media',
                                                'Corporation' => 'Corporation',
                                            ]),
                                        TextInput::make('seo_organization_name')
                                            ->label('Name'),
                                        FileUpload::make('seo_organization_logo')
                                            ->label('Logo')
                                            ->image()
                                            ->directory('seo')
                                            ->columnSpanFull(),
                                    ])->columns(2)->collapsed(),
                            ]),

                        // TAB 2: Indexing Control
                        Tab::make('Indexing')
                            ->icon('heroicon-o-eye-slash')
                            ->schema([
                                Section::make('Global Noindex Rules')
                                    ->description('Control what pages search engines should NOT index')
                                    ->schema([
                                        Toggle::make('seo_noindex_search')
                                            ->label('Noindex Search Results')
                                            ->helperText('Recommended: ON'),
                                        Toggle::make('seo_noindex_archives')
                                            ->label('Noindex Date Archives'),
                                        Toggle::make('seo_noindex_categories')
                                            ->label('Noindex Categories'),
                                        Toggle::make('seo_noindex_tags')
                                            ->label('Noindex Tags'),
                                    ])->columns(2),
                            ]),

                        // TAB 3: Sitemap
                        Tab::make('Sitemap')
                            ->icon('heroicon-o-map')
                            ->schema([
                                Section::make('XML Sitemap')
                                    ->schema([
                                        Toggle::make('seo_enable_sitemap')
                                            ->label('Enable Sitemap'),
                                        Toggle::make('seo_sitemap_include_images')
                                            ->label('Include Images'),
                                    ])->columns(2),

                                Section::make('Sitemap Actions')
                                    ->description('Use command "php artisan sitemap:generate" to regenerate')
                                    ->schema([
                                        \Filament\Forms\Components\Placeholder::make('sitemap_info')
                                            ->label('')
                                            ->content(fn() => 'Last sitemap: /sitemap.xml — Regenerate via CLI: php artisan sitemap:generate'),
                                    ]),
                            ]),

                        // TAB 4: Webmaster & Analytics
                        Tab::make('Analytics')
                            ->icon('heroicon-o-chart-bar')
                            ->schema([
                                Section::make('Webmaster Verification')
                                    ->schema([
                                        TextInput::make('seo_google_verification')
                                            ->label('Google Search Console'),
                                        TextInput::make('seo_bing_verification')
                                            ->label('Bing Webmaster'),
                                    ])->columns(2),

                                Section::make('Tracking')
                                    ->schema([
                                        TextInput::make('seo_google_analytics_id')
                                            ->label('GA4 Measurement ID')
                                            ->placeholder('G-XXXXXXXXXX'),
                                        TextInput::make('seo_gtm_id')
                                            ->label('Google Tag Manager')
                                            ->placeholder('GTM-XXXXXX'),
                                    ])->columns(2),
                            ]),

                        // TAB 5: Social
                        Tab::make('Social')
                            ->icon('heroicon-o-share')
                            ->schema([
                                Section::make('Open Graph')
                                    ->schema([
                                        FileUpload::make('seo_og_image_default')
                                            ->label('Default OG Image')
                                            ->image()
                                            ->directory('seo')
                                            ->helperText('1200x630px recommended'),
                                        Select::make('seo_twitter_card_type')
                                            ->label('Twitter Card Type')
                                            ->options([
                                                'summary' => 'Summary',
                                                'summary_large_image' => 'Large Image',
                                            ]),
                                    ])->columns(2),
                            ]),

                        // TAB 6: Robots.txt
                        Tab::make('Robots.txt')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Section::make('Robots.txt Editor')
                                    ->schema([
                                        Textarea::make('seo_robots_txt_content')
                                            ->label('')
                                            ->rows(15)
                                            ->extraInputAttributes(['class' => 'font-mono text-sm'])
                                            ->helperText('⚠️ Be careful! This controls crawler access.'),
                                    ]),
                            ]),
                    ])
                    ->persistTabInQueryString()
                    ->columnSpanFull(),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        foreach ($data as $key => $value) {
            SiteSetting::set($key, $value);
        }

        Notification::make()
            ->title('SEO Settings saved!')
            ->success()
            ->send();
    }

    /**
     * Get stats for the page header
     */
    public function getStats(): array
    {
        return [
            'articles' => Article::count(),
            'categories' => Category::count(),
            'redirects' => Redirect::where('is_active', true)->count(),
            'missing_meta' => Article::whereNull('meta_description')->orWhere('meta_description', '')->count(),
        ];
    }
}
