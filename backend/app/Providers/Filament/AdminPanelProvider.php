<?php

namespace App\Providers\Filament;

use App\Filament\Widgets\StatsOverview;
use Filafly\Themes\Brisk\BriskTheme;
use Filament\Enums\ThemeMode;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
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
            ->plugin(BriskTheme::make())
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
            ->widgets([
                StatsOverview::class,
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
