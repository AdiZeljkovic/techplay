<?php

namespace App\Filament\Pages;

use App\Models\SiteSetting;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SeoSettings extends Page implements HasForms
{
    use InteractsWithForms;

    public ?array $data = [];

    public static function getNavigationIcon(): ?string
    {
        return 'heroicon-o-globe-alt';
    }

    public static function getNavigationLabel(): string
    {
        return 'Ultimate SEO';
    }

    public static function getNavigationGroup(): ?string
    {
        return 'Settings';
    }

    protected string $view = 'filament.pages.seo-settings';

    public function mount(): void
    {
        $this->form->fill([
            // General
            'seo_title_separator' => SiteSetting::get('seo_title_separator', '|'),
            'seo_meta_description' => SiteSetting::get('seo_meta_description'),

            // Knowledge Graph
            'seo_organization_type' => SiteSetting::get('seo_organization_type', 'NewsMediaOrganization'),
            'seo_organization_name' => SiteSetting::get('seo_organization_name', 'TechPlay'),
            'seo_organization_logo' => SiteSetting::get('seo_organization_logo'),

            // Indexing
            'seo_noindex_search' => SiteSetting::get('seo_noindex_search', false), // true = noindex
            'seo_noindex_archives' => SiteSetting::get('seo_noindex_archives', false),
            'seo_noindex_categories' => SiteSetting::get('seo_noindex_categories', false),
            'seo_noindex_tags' => SiteSetting::get('seo_noindex_tags', false),

            // Sitemap
            'seo_enable_sitemap' => SiteSetting::get('seo_enable_sitemap', true),
            'seo_sitemap_include_images' => SiteSetting::get('seo_sitemap_include_images', true),

            // Webmaster
            'seo_google_verification' => SiteSetting::get('seo_google_verification'),
            'seo_bing_verification' => SiteSetting::get('seo_bing_verification'),
            'seo_yandex_verification' => SiteSetting::get('seo_yandex_verification'),
            'seo_baidu_verification' => SiteSetting::get('seo_baidu_verification'),

            // Analytics
            'seo_google_analytics_id' => SiteSetting::get('seo_google_analytics_id'),
            'seo_gtm_id' => SiteSetting::get('seo_gtm_id'),

            // Social
            'seo_og_image_default' => SiteSetting::get('seo_og_image_default'),
            'seo_social_facebook' => SiteSetting::get('seo_social_facebook'),
            'seo_social_twitter' => SiteSetting::get('seo_social_twitter'),
            'seo_social_instagram' => SiteSetting::get('seo_social_instagram'),
            'seo_twitter_card_type' => SiteSetting::get('seo_twitter_card_type', 'summary_large_image'),

            // Advanced
            'seo_robots_txt_content' => SiteSetting::get('seo_robots_txt_content', "User-agent: *\nAllow: /"),
        ]);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('General SEO')
                    ->description('Basic global settings.')
                    ->icon('heroicon-o-adjustments-horizontal')
                    ->schema([
                        Select::make('seo_title_separator')
                            ->label('Title Separator')
                            ->options([
                                '|' => '| (Pipe)',
                                '-' => '- (Dash)',
                                '–' => '– (En Dash)',
                                '—' => '— (Em Dash)',
                                '»' => '» (Guillemet)',
                                '•' => '• (Bullet)',
                            ])
                            ->default('|')
                            ->required(),
                        Textarea::make('seo_meta_description')
                            ->label('Default Home Meta Description')
                            ->rows(3)
                            ->columnSpanFull(),
                    ])->columns(2),

                Section::make('Knowledge Graph (Schema.org)')
                    ->description('Help Google understand your organization entity.')
                    ->icon('heroicon-o-academic-cap')
                    ->schema([
                        Select::make('seo_organization_type')
                            ->label('Organization Type')
                            ->options([
                                'Organization' => 'Organization',
                                'NewsMediaOrganization' => 'News Media Organization',
                                'Corporation' => 'Corporation',
                            ])
                            ->default('NewsMediaOrganization'),
                        TextInput::make('seo_organization_name')
                            ->label('Organization Name')
                            ->placeholder('TechPlay'),
                        FileUpload::make('seo_organization_logo')
                            ->label('Organization Logo')
                            ->image()
                            ->directory('seo')
                            ->helperText('Square 1:1 image preferred (min 112x112px).')
                            ->columnSpanFull(),
                    ])->columns(2),

                Section::make('Indexing & Crawling')
                    ->description('Control what Search Engines should index.')
                    ->icon('heroicon-o-eye-slash')
                    ->schema([
                        Toggle::make('seo_noindex_search')
                            ->label('Noindex Search Results Pages')
                            ->helperText('Prevent Google from indexing internal search results (Recommended).'),
                        Toggle::make('seo_noindex_archives')
                            ->label('Noindex Date Archives')
                            ->helperText('Prevent duplicate content from date-based archives.'),
                        Toggle::make('seo_noindex_categories')
                            ->label('Noindex Categories')
                            ->helperText('Only enable if you have thin content in categories.'),
                        Toggle::make('seo_noindex_tags')
                            ->label('Noindex Tags')
                            ->helperText('Often used to prevent tag bloat in index.'),
                    ])->columns(2),

                Section::make('Sitemap Settings')
                    ->description('Configure XML Sitemap generation.')
                    ->icon('heroicon-o-map')
                    ->schema([
                        Toggle::make('seo_enable_sitemap')
                            ->label('Enable XML Sitemap')
                            ->default(true),
                        Toggle::make('seo_sitemap_include_images')
                            ->label('Include Images in Sitemap')
                            ->default(true),
                    ])->columns(2),

                Section::make('IndexNow Integration')
                    ->description('Automatically notify search engines (Bing, Yandex, Seznam) when content is updated.')
                    ->icon('heroicon-o-bolt')
                    ->schema([
                        Toggle::make('seo_indexnow_enabled')
                            ->label('Enable Auto-Ping')
                            ->helperText('Automatically submit URLs when Articles are created or updated.'),
                        TextInput::make('seo_indexnow_key')
                            ->label('API Key')
                            ->helperText('32-character key. Route /<key>.txt will be auto-generated.')
                            ->default(fn() => \Illuminate\Support\Str::random(32)),
                    ])->columns(2),

                Section::make('Webmaster Tools')
                    ->collapsed()
                    ->icon('heroicon-o-key')
                    ->schema([
                        TextInput::make('seo_google_verification')->label('Google Search Console'),
                        TextInput::make('seo_bing_verification')->label('Bing Webmaster Tools'),
                        TextInput::make('seo_yandex_verification')->label('Yandex'),
                        TextInput::make('seo_baidu_verification')->label('Baidu'),
                    ])->columns(2),

                Section::make('Analytics')
                    ->collapsed()
                    ->icon('heroicon-o-chart-bar')
                    ->schema([
                        TextInput::make('seo_google_analytics_id')->label('GA4 Measurement ID (G-XXX)'),
                        TextInput::make('seo_gtm_id')->label('Google Tag Manager (GTM-XXX)'),
                    ])->columns(2),

                Section::make('Social Media')
                    ->collapsed()
                    ->icon('heroicon-o-share')
                    ->schema([
                        FileUpload::make('seo_og_image_default')->label('Default OpenGraph Image')->image()->directory('seo')->columnSpanFull(),
                        TextInput::make('seo_social_facebook')->label('Facebook URL')->url(),
                        TextInput::make('seo_social_twitter')->label('X (Twitter) Username')->prefix('@'),
                        TextInput::make('seo_social_instagram')->label('Instagram URL')->url(),
                        Select::make('seo_twitter_card_type')
                            ->label('Default Twitter Card')
                            ->options([
                                'summary' => 'Summary',
                                'summary_large_image' => 'Summary with Large Image',
                            ])
                            ->default('summary_large_image'),
                    ])->columns(2),

                Section::make('Robots.txt Editor')
                    ->icon('heroicon-o-document-text') // Changed icon to one that exists
                    ->collapsed()
                    ->schema([
                        Textarea::make('seo_robots_txt_content')
                            ->label('Robots.txt Content')
                            ->rows(10)
                            ->helperText('Be careful! This controls crawler access to your entire site.')
                            ->extraInputAttributes(['class' => 'font-mono text-xs']),
                    ])->columnSpanFull(),
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
            ->title('Ultimate SEO Settings Saved')
            ->success()
            ->send();
    }
}
