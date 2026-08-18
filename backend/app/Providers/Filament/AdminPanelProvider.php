<?php

namespace App\Providers\Filament;

use Croustibat\FilamentJobsMonitor\FilamentJobsMonitorPlugin;
use Filament\Enums\ThemeMode;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\Width;
use Filament\Tables\Table;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\HtmlString;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Leandrocfe\FilamentApexCharts\FilamentApexChartsPlugin;

class AdminPanelProvider extends PanelProvider
{
    /**
     * The conventions every list in the panel keeps, set once.
     *
     * These were measured across all 37 resources before being written: not one
     * of them persisted a filter, chose a page size, or said anything useful
     * when its table was empty. Thirty-seven copies of the same four lines is
     * thirty-seven chances to forget one, and a convention that holds on
     * thirty-five screens is not a convention — it is a thing you have to
     * remember to check.
     *
     * `configureUsing` runs when the table is constructed, before the resource's
     * own `table()` method, so anything a resource sets for itself still wins.
     * A new resource gets all of this without being told.
     */
    public function boot(): void
    {
        Table::configureUsing(function (Table $table): void {
            $table
                /*
                 * The thing that costs the most time and is never written down:
                 * you filter comments to "pending", open one, come back, and the
                 * filter is gone. Multiply by every moderated comment.
                 */
                ->persistFiltersInSession()
                ->persistSortInSession()
                ->persistSearchInSession()

                /*
                 * Ten rows is Filament's default and it is a default chosen for
                 * screenshots. On a 1440px screen at 44px a row, twenty-five
                 * fits without scrolling and turns most of these lists into one
                 * page instead of three.
                 */
                ->paginationPageOptions([10, 25, 50, 100])
                ->defaultPaginationPageOption(25)

                /*
                 * "No records found" is what all thirty-seven said. This says
                 * which records, using the label the resource already declares,
                 * so every screen gets a specific sentence for free and the ones
                 * that deserve a written explanation can still override it.
                 */
                ->emptyStateHeading(fn (Table $table): string => 'No '.$table->getPluralModelLabel().' yet')
                /*
                 * The table arrives a moment after the page does.
                 *
                 * Measured on /admin/news-articles: 269 ms and 689 KB to send a
                 * finished page, against 102 ms and 194 KB to send the page and
                 * let the table follow. The shell alone is 76 ms of pure PHP
                 * with no queries at all — that is Filament's floor — so the
                 * other two thirds were the twenty-five rows, at roughly 8 ms
                 * and 21 KB each.
                 *
                 * The trade is honest and worth stating: the server does about
                 * 24% *more* work in total, because it answers twice. What
                 * changes is when the reader sees something — 42 ms instead of
                 * 206 — and on a phone that is the whole difference between a
                 * panel that feels like an app and one that feels like a
                 * website.
                 *
                 * Row count stops mattering once this is on: with the table
                 * deferred, ten rows and twenty-five both give ~100 ms, because
                 * the rows are not in the first answer either way. So the page
                 * size stays at 25.
                 *
                 * The Dashboard has worked this way since it was rebuilt; its
                 * widgets are lazy for the same reason. This makes the rest of
                 * the panel behave like the screen everybody opens first.
                 */
                ->deferLoading();
        });
    }

    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->spa()
            ->darkMode(true)
            ->defaultThemeMode(ThemeMode::Dark)
            ->brandName('TechPlay')
            // brandLogoHeight was already set, but no logo had ever been given
            // to size, so the panel fell back to the name as text.
            ->brandLogo(asset('techplay-logo.png'))
            ->brandLogoHeight('2rem')
            ->favicon(asset('favicon.ico'))
            // Collapsed means icons only. The width override that used to sit
            // here was 9rem — 144px, three times an icon — so the collapsed
            // sidebar read as a wide empty column with the labels missing
            // rather than as a sidebar somebody had folded away. Filament's own
            // collapsed width is the width of the icon, which is the point.
            ->sidebarCollapsibleOnDesktop()

            /*
             * The palette, and the reason it is written out longhand.
             *
             * This used to be six calls to `Color::hex()`. That looked right and
             * was not: `generatePalette()` reads only the **hue** off the colour
             * you hand it, then rebuilds lightness and chroma from a fixed
             * ladder — and it zeroes the chroma entirely when the input is
             * near-grey. So `Color::hex('#10141B')`, the site's darkest panel,
             * came out the far end as `oklch(0.3946 0 261)` at shade 900: a flat
             * mid-grey. Every section, the sidebar and the topbar are painted
             * from `--gray-900`, so the whole panel was mid-grey while the site
             * is near-black. The accent fared no better — #DC143C went in and a
             * lighter, washed-out crimson came out.
             *
             * Overriding `--color-gray-*` in the stylesheet did not fix it,
             * because the compiled component rules read `--gray-*`, which is a
             * different variable injected at runtime from exactly this array.
             *
             * Shades 700–950 are the site's four surfaces, unchanged. The ramp
             * stays monotonic light-to-dark so the light theme still works if
             * anybody switches to it.
             */
            ->colors([
                'gray' => [
                    50 => 'oklch(0.975 0.002 260)',
                    100 => 'oklch(0.935 0.004 260)',
                    200 => 'oklch(0.860 0.006 260)',
                    300 => 'oklch(0.740 0.009 260)',
                    400 => 'oklch(0.610 0.012 260)',  // prigušen tekst
                    500 => 'oklch(0.490 0.015 260)',  // placeholder
                    600 => 'oklch(0.380 0.018 260)',  // ivice
                    700 => 'oklch(0.220 0.016 257)',  // #161B22  surface-3
                    800 => 'oklch(0.190 0.016 262)',  // #10141B  surface-2
                    900 => 'oklch(0.164 0.014 264)',  // #0B0E14  surface-1
                    950 => 'oklch(0.127 0.009 254)',  // #05070A  surface-0
                ],

                /*
                 * In dark mode Filament reads primary-400 for text and icons and
                 * primary-500 for fills — 22 rules against 23. The site already
                 * makes that exact distinction: --accent is the fill, --accent-ink
                 * the same red lifted for text on a dark ground. So 500 is
                 * #DC143C and 400 is #FF4D6A, which is not a compromise but the
                 * pairing the design system was built around.
                 */
                'primary' => [
                    50 => 'oklch(0.970 0.018 18)',
                    100 => 'oklch(0.935 0.042 18)',
                    200 => 'oklch(0.880 0.088 17)',
                    300 => 'oklch(0.790 0.150 16)',
                    400 => 'oklch(0.678 0.213 16)',   // #FF4D6A  --accent-ink
                    500 => 'oklch(0.571 0.222 20)',   // #DC143C  --accent
                    600 => 'oklch(0.495 0.200 21)',
                    700 => 'oklch(0.420 0.170 21)',
                    800 => 'oklch(0.350 0.135 21)',
                    900 => 'oklch(0.300 0.105 21)',
                    950 => 'oklch(0.210 0.075 21)',
                ],

                /*
                 * The four semantic colours are Filament's own ramps rather than
                 * hand-written ones, because they already land on the site's
                 * values: Red 500 and #EF4444 share a lightness of 0.637 and a
                 * hue of 25.3, Emerald 500 and #10B981 share 0.696 / 162.5, and
                 * so on for Amber and Blue. Only the chroma differs, and there
                 * Filament's is the wider-gamut version of the same colour.
                 */
                'danger' => Color::Red,
                'success' => Color::Emerald,
                'warning' => Color::Amber,
                'info' => Color::Blue,
            ])

            /*
             * Body face. Headings take Instrument Sans and figures take IBM
             * Plex Mono, both in the theme stylesheet — Filament takes one
             * family here and the site pairs three.
             *
             * This replaces Kumbh Sans, which arrived with the Brisk theme.
             * Brisk was eight lines of CSS and that font; removing it costs
             * nothing and stops something else deciding how the panel looks.
             */
            ->font('IBM Plex Sans')

            /*
             * Without this the stylesheet below is compiled on every deploy and
             * never sent to a browser — which is exactly what had been
             * happening. The panel was running stock Filament CSS.
             */
            ->viteTheme('resources/css/filament/admin/theme.css')

            /*
             * The other two faces.
             *
             * `font()` above takes one family and Filament loads it; the theme
             * stylesheet also asks for Instrument Sans on headings and IBM Plex
             * Mono on figures, and nothing would have fetched either — the
             * browser would have quietly fallen back to the body face and the
             * pairing that gives the site its character would have been absent
             * while every rule looked correct.
             *
             * Same provider Filament already uses, so this adds no new
             * connection. `display=swap` keeps text visible while they load.
             */
            ->renderHook(
                'panels::head.end',
                fn () => new HtmlString(
                    '<link rel="stylesheet" href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|ibm-plex-mono:400,500,600&display=swap" />'
                )
            )
            // ->renderHook(
            //     'panels::head.end',
            //     fn() => view('filament.custom-styles')
            // )
            ->renderHook(
                'panels::body.end',
                fn () => new HtmlString(<<<'HTML'
<script>
// Fix: prevent RichEditor toolbar buttons from stealing focus off the editor.
// Without this, clicking a toolbar button blurs the contenteditable which can
// cause TipTap to restore the cursor at the wrong position, making heading
// commands apply to the wrong paragraph.
document.addEventListener('mousedown', function (e) {
    if (e.target.closest('.fi-fo-rich-editor-toolbar button')) {
        e.preventDefault();
    }
}, true);
</script>
HTML)
            )
            /*
             * The phone's bottom navigation.
             *
             * Injected at body end so it sits above the page and outside the
             * scroll container, fixed to the bottom of the viewport. It is
             * hidden above 1024px in CSS, so on a desk it costs nothing but a
             * hidden <nav>. The fifth button opens Filament's own sidebar
             * drawer through `$store.sidebar.open()`, so the full menu has one
             * home rather than two.
             */
            ->renderHook(
                'panels::body.end',
                fn () => view('filament.mobile-nav'),
            )
            ->maxContentWidth(Width::Full)
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([])
            // Undeclared groups still render, but they queue up after every
            // declared one — so 'GTA 6' was landing below System, at the very
            // bottom, no matter what navigationSort its resources carried.
            /*
             * Eight groups, and the order is the day: what you publish, what
             * the catalogue holds, who is here, what they earn, what it makes,
             * how it is found, how it is configured.
             *
             * 'Editorial Tools' is gone — it held Release Calendar and nothing
             * else, and a group of one is a heading with no work to do. In its
             * place, 'Gamification': the XP economy was eight of Community's
             * fourteen rows, which meant Users and Threads sat beside Bounty
             * Ledger and Customizations. Those are two different jobs, usually
             * done by two different people, and now they read as two.
             */
            ->navigationGroups([
                'Content Studio',
                'Game Database',
                'GTA 6',
                'Community',
                'Gamification',
                'Shop & Monetization',
                'SEO & Marketing',
                'System',
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            /*
             * Deliberately empty. Widgets registered here are appended to every
             * dashboard; the Dashboard page names its own five in the order the
             * questions get asked, and a sixth arriving from the panel config
             * would land at the bottom without anybody choosing where.
             */
            ->widgets([])
            /*
             * Two plugins, and the reason each is here.
             *
             * **Jobs Monitor** gives the queue a screen. Seven kinds of job run
             * through it — OG data, view counters, MobyGames enrichment, two
             * IndexNow submitters, giveaway reminders, chat reminders — and
             * until now the only sign any of them existed was a count of
             * failures on the dashboard that led nowhere. This lists what ran,
             * what is waiting, and groups failures by error rather than
             * repeating the same one forty times. It is what Horizon would do,
             * except Horizon needs Redis as the queue driver and this works
             * with the one we have.
             *
             * **Apex Charts** is here for the charts the analytics work will
             * need. Filament's own ChartWidget is in core and the dashboard's
             * sparkline is hand-drawn SVG, so nothing today depends on this —
             * it earns its place when a real analytics page gets built, and
             * until then it costs an autoloaded class nobody instantiates.
             */
            /*
             * The bell in the top bar.
             *
             * Filament reads Laravel's own `notifications` table, so this needed
             * no plugin — the table has been there all along with 157 rows in
             * it. What it did not have is a reader: every one of those was
             * written for a **site** user (achievements, quests, rank-ups) and
             * seen only on techplay.gg.
             *
             * That is worth knowing before opening it: the one admin account is
             * also a player, so the bell will show their own achievements
             * alongside anything addressed to them as staff. `AdminAlert` is the
             * class that speaks to them as staff — see App\Notifications.
             *
             * Polled every 30 seconds rather than pushed. Reverb is running and
             * could carry these live, but a websocket per open admin tab to
             * learn about a failed job half a minute sooner is not a trade worth
             * making; the poll is one indexed query.
             */
            ->databaseNotifications()
            ->databaseNotificationsPolling('30s')

            ->plugins([
                FilamentJobsMonitorPlugin::make(),
                FilamentApexChartsPlugin::make(),
            ])

            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
