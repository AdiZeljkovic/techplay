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
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Cache;

/**
 * Every setting the site has, on one screen.
 *
 * There were three. **Site Settings** was the raw table — columns `key`,
 * `group`, `value`, `type` — so changing the site's name meant finding the row
 * whose key read `site_name` and typing into a string field called `value`,
 * with the type column offering `text` or `boolean` and no clue which the row
 * wanted. **Ultimate SEO** and **Social Media** were proper forms over subsets
 * of the same 44 rows, which meant two screens knew how to edit a setting
 * properly and one screen could edit any of them badly.
 *
 * All three wrote to `site_settings`. Nothing said which one to use.
 *
 * ── How a value is stored ────────────────────────────────────────────────
 *
 * The `value` column is a string for everything, so a boolean has to be written
 * deliberately: PHP casts `false` to the **empty string**, not to `'0'`, and an
 * empty string is not what anybody reading this table later will expect to
 * find. `writeSetting()` writes `'1'` or `'0'` and says which type it is.
 *
 * Every field also declares the group it belongs to rather than inheriting
 * `SiteSetting::set()`'s default of `general` — which is how the `socials`
 * group would have quietly migrated out of existence on the first save.
 *
 * Maintenance mode used to be the dangerous value on this page. It is gone:
 * the middleware that read it was deleted months ago along with
 * `/coming-soon`, and the setting outlived both, still toggleable and wired to
 * nothing. If the site ever needs to be taken down deliberately, `php artisan
 * down` and nginx both do it without a database round trip on every request.
 */
class Settings extends Page implements HasForms
{
    use InteractsWithForms;

    protected string $view = 'filament.pages.settings';

    public ?array $data = [];

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static string|\UnitEnum|null $navigationGroup = 'System';

    protected static ?int $navigationSort = 20;

    protected static ?string $title = 'Settings';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    /**
     * Keys stored as booleans, and therefore written as '1' or '0'.
     *
     * The column is a string for everything, so this list is the only thing
     * that keeps a toggle from writing an empty string and a later reader from
     * having to guess whether '' meant false or meant nobody ever set it.
     *
     * Empty since 18 Aug 2026. Both booleans this page ever had are gone —
     * maintenance mode with the system it belonged to, and the six indexing
     * toggles because nothing on the front end ever read them. The list stays
     * because the next boolean setting belongs in it, and finding that out the
     * hard way costs an afternoon.
     */
    private const BOOLEANS = [];

    /** Keys that live in the `socials` group. Everything else is `general`. */
    private const SOCIALS_GROUP = [
        'facebook_url',
        'instagram_url',
        'twitter_url',
        'youtube_url',
        'tiktok_url',
        'discord_url',
    ];

    public function mount(): void
    {
        $stored = SiteSetting::all()->pluck('value', 'key');

        $state = [];
        foreach ($this->keys() as $key) {
            $value = $stored[$key] ?? null;
            $state[$key] = in_array($key, self::BOOLEANS, true)
                ? in_array((string) $value, ['1', 'true'], true)
                : $value;
        }

        $this->form->fill($state);
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('settings')
                    ->persistTabInQueryString()
                    ->columnSpanFull()
                    ->tabs([
                        Tab::make('Site')
                            ->icon('heroicon-o-home')
                            ->schema([
                                TextInput::make('site_name')
                                    ->label('Site name')
                                    ->maxLength(60),

                                TextInput::make('site_tagline')
                                    ->label('Tagline')
                                    ->maxLength(160)
                                    ->helperText('Shown beside the name in search results and on social cards.'),
                            ]),

                        Tab::make('SEO')
                            ->icon('heroicon-o-magnifying-glass')
                            ->schema([
                                Textarea::make('seo_meta_description')
                                    ->label('Default meta description')
                                    ->rows(3)
                                    ->maxLength(320)
                                    ->helperText('Used on any page that has not written its own.'),

                                Textarea::make('seo_default_keywords')
                                    ->label('Default keywords')
                                    ->rows(2),

                                Grid::make(2)->schema([
                                    TextInput::make('seo_title_separator')
                                        ->label('Title separator')
                                        ->maxLength(5)
                                        ->helperText('Between the page title and the site name.'),

                                    Select::make('seo_twitter_card_type')
                                        ->label('Twitter card')
                                        ->options([
                                            'summary' => 'summary',
                                            'summary_large_image' => 'summary_large_image',
                                        ]),
                                ]),

                                FileUpload::make('seo_og_image_default')
                                    ->label('Default share image')
                                    ->image()
                                    ->directory('seo')
                                    ->helperText('Used when an article has no image of its own. 1200×630 works everywhere.'),
                            ]),

                        /*
                         * Six toggles used to sit above this — no-index search,
                         * archives, categories and tags, plus two sitemap
                         * switches. Every one was stored and none was ever read:
                         * `lib/seo.ts` emitted no robots directive at all, and
                         * the sitemap routes never consulted a setting. A switch
                         * that reports the opposite of what it does is worse
                         * than no switch, so they are gone.
                         *
                         * What stays is the one thing on this tab that is live.
                         */
                        Tab::make('Robots')
                            ->icon('heroicon-o-eye-slash')
                            ->schema([
                                Textarea::make('seo_robots_txt_content')
                                    ->label('robots.txt')
                                    ->rows(10)
                                    ->helperText('Served verbatim at techplay.gg/robots.txt.')
                                    ->extraInputAttributes(['class' => 'font-mono text-sm']),
                            ]),

                        Tab::make('Verification')
                            ->icon('heroicon-o-shield-check')
                            ->schema([
                                Grid::make(2)->schema([
                                    TextInput::make('seo_google_verification')->label('Google Search Console'),
                                    TextInput::make('seo_bing_verification')->label('Bing Webmaster'),
                                    TextInput::make('seo_google_analytics_id')
                                        ->label('Google Analytics ID')
                                        ->placeholder('G-XXXXXXXXXX'),
                                    TextInput::make('seo_gtm_id')
                                        ->label('Google Tag Manager ID')
                                        ->placeholder('GTM-XXXXXXX'),
                                ]),

                                TextInput::make('seo_indexnow_key')
                                    ->label('IndexNow key')
                                    ->helperText('Live. Bing and Yandex are pinged with this key on every publish, and the key file is served from the site root.'),
                            ]),

                        /*
                         * These twelve describe the company to a search engine,
                         * and at the time of writing not one of them reaches it:
                         * SchemaService hardcodes `'name' => 'TechPlay'` for the
                         * publisher and reads no settings at all. The fields are
                         * kept and filled because the data is correct and the
                         * wiring is a small job — but saying so here is better
                         * than a screen that implies otherwise.
                         */
                        Tab::make('Organization')
                            ->icon('heroicon-o-building-office')
                            ->schema([
                                Grid::make(2)->schema([
                                    TextInput::make('seo_organization_name')->label('Name'),
                                    TextInput::make('seo_organization_legal_name')->label('Legal name'),
                                    Select::make('seo_organization_type')
                                        ->label('Schema.org type')
                                        ->options([
                                            'NewsMediaOrganization' => 'NewsMediaOrganization',
                                            'Organization' => 'Organization',
                                            'Corporation' => 'Corporation',
                                        ]),
                                    TextInput::make('seo_organization_founding_year')->label('Founded'),
                                ]),

                                TextInput::make('seo_organization_founders')->label('Founders'),

                                FileUpload::make('seo_organization_logo')
                                    ->label('Logo')
                                    ->image()
                                    ->directory('seo'),

                                Grid::make(2)->schema([
                                    TextInput::make('seo_contact_email')->label('Contact e-mail')->email(),
                                    TextInput::make('seo_contact_phone')->label('Contact phone')->tel(),
                                ]),

                                Grid::make(4)->schema([
                                    TextInput::make('seo_address_street')->label('Street')->columnSpan(2),
                                    TextInput::make('seo_address_city')->label('City'),
                                    TextInput::make('seo_address_postal')->label('Postal code'),
                                ]),

                                TextInput::make('seo_address_country')
                                    ->label('Country')
                                    ->maxLength(2)
                                    ->helperText('Two-letter code, e.g. BA.'),
                            ]),

                        Tab::make('Social')
                            ->icon('heroicon-o-share')
                            ->schema([
                                Grid::make(2)->schema([
                                    TextInput::make('facebook_url')->label('Facebook')->url(),
                                    TextInput::make('instagram_url')->label('Instagram')->url(),
                                    TextInput::make('twitter_url')->label('X / Twitter')->url(),
                                    TextInput::make('youtube_url')->label('YouTube')->url(),
                                    TextInput::make('tiktok_url')->label('TikTok')->url(),
                                    TextInput::make('discord_url')->label('Discord')->url(),
                                ]),

                                /*
                                 * A second, older set of the same thing: handles
                                 * rather than URLs, meant for structured data.
                                 * The front end reads the URLs above; nothing
                                 * reads these. They stay visible so that the
                                 * duplication is something you can see rather
                                 * than something you discover.
                                 */
                                Grid::make(3)->schema([
                                    TextInput::make('seo_social_facebook')->label('Facebook handle'),
                                    TextInput::make('seo_social_instagram')->label('Instagram handle'),
                                    TextInput::make('seo_social_twitter')->label('X handle'),
                                    TextInput::make('seo_social_youtube')->label('YouTube handle'),
                                    TextInput::make('seo_social_discord')->label('Discord handle'),
                                ]),
                            ]),
                    ]),
            ])
            ->statePath('data');
    }

    public function save(): void
    {
        $data = $this->form->getState();

        foreach ($data as $key => $value) {
            $this->writeSetting($key, $value);
        }

        // The front end reads settings through SettingsController, and the SEO
        // page cache holds a copy of some of them.
        //
        // `site_settings.all` was forgotten here and is not a key anyone writes
        // — the controller caches `settings.all` and `settings.grouped`, and
        // SiteSettingObserver clears both because SiteSetting::set() goes
        // through updateOrCreate. The line did nothing except suggest this
        // method was what kept the front end current.
        Cache::forget('page_seo.all');

        Notification::make()
            ->title('Settings saved')
            ->body(count($data).' values written.')
            ->success()
            ->send();
    }

    /**
     * One place that knows how a setting is stored.
     *
     * Booleans become '1' or '0' rather than '1' or '' — see the class comment
     * for why the empty string is the dangerous one — and the group travels
     * with the key instead of defaulting to `general`.
     */
    private function writeSetting(string $key, mixed $value): void
    {
        $isBool = in_array($key, self::BOOLEANS, true);

        SiteSetting::set(
            $key,
            $isBool ? ($value ? '1' : '0') : (string) ($value ?? ''),
            $isBool ? 'boolean' : 'text',
            in_array($key, self::SOCIALS_GROUP, true) ? 'socials' : 'general',
        );
    }

    /** @return list<string> */
    private function keys(): array
    {
        return array_merge(
            ['site_name', 'site_tagline'],
            ['seo_meta_description', 'seo_default_keywords', 'seo_title_separator', 'seo_twitter_card_type', 'seo_og_image_default'],
            self::BOOLEANS,
            ['seo_robots_txt_content'],
            ['seo_google_verification', 'seo_bing_verification', 'seo_google_analytics_id', 'seo_gtm_id', 'seo_indexnow_key'],
            ['seo_organization_name', 'seo_organization_legal_name', 'seo_organization_type', 'seo_organization_founding_year', 'seo_organization_founders', 'seo_organization_logo'],
            ['seo_contact_email', 'seo_contact_phone', 'seo_address_street', 'seo_address_city', 'seo_address_postal', 'seo_address_country'],
            self::SOCIALS_GROUP,
            ['seo_social_facebook', 'seo_social_instagram', 'seo_social_twitter', 'seo_social_youtube', 'seo_social_discord'],
        );
    }
}
