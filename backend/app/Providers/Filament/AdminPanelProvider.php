<?php

namespace App\Providers\Filament;

use Filament\Enums\ThemeMode;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\Width;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\HtmlString;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
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
            ->sidebarCollapsibleOnDesktop()
            ->collapsedSidebarWidth('9rem')

            /*
             * The site's palette, so the panel and the product look like one
             * thing. Values are the tokens in frontend/app/globals.css:
             * #DC143C is --accent, and the four semantic colours are the same
             * ones every alert and badge on the site already uses.
             *
             * Filament builds eleven shades from each hex, which is a better
             * ramp than one written by hand. The exact dark surfaces it cannot
             * infer are set in resources/css/filament/admin/theme.css.
             */
            ->colors([
                'primary' => Color::hex('#DC143C'),
                'danger' => Color::hex('#EF4444'),
                'success' => Color::hex('#10B981'),
                'warning' => Color::hex('#F59E0B'),
                'info' => Color::hex('#3B82F6'),
                'gray' => Color::hex('#10141B'),
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
            ->maxContentWidth(Width::Full)
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([])
            // Undeclared groups still render, but they queue up after every
            // declared one — so 'GTA 6' was landing below System, at the very
            // bottom, no matter what navigationSort its resources carried.
            ->navigationGroups([
                'Editorial Tools',
                'Content Studio',
                'Game Database',
                'GTA 6',
                'Community',
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
