<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\GameResource;
use App\Models\Game;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;

/**
 * The catalogue, which is the largest thing this platform owns.
 *
 * 142,110 games against 622 articles — the game database is the site at scale,
 * and it is the part nobody looks at because nobody edits it by hand.
 *
 * The number that matters is not the total but **the share with a description**,
 * because that is the entry rule for the sitemap: `whereNotNull('description')`.
 * A game without one is a page search engines are never told about. At the time
 * of writing that is 26,785 games — nineteen percent of the catalogue, invisible.
 *
 * Views are here because until 17 Aug 2026 they were not. The counters had been
 * incrementing in Redis and never reaching the database, so this number read
 * zero while 658,974 views had actually happened. It is on the dashboard partly
 * so that if it ever freezes again, somebody sees it.
 */
class CatalogueHealth extends BaseWidget
{
    protected static ?int $sort = 3;

    protected ?string $heading = 'Katalog igara';

    protected function stats(): array
    {
        // Counting 142,000 rows three ways is not something to do on every page
        // load, and the answer changes at the pace the aggregator runs.
        $data = Cache::remember('dashboard.catalogue.v1', 900, fn () => [
            'total' => Game::count(),
            'described' => Game::whereNotNull('description')->count(),
            'week' => Game::where('created_at', '>=', now()->startOfWeek())->count(),
            'views' => (int) Game::sum('views'),
        ]);

        $missing = $data['total'] - $data['described'];
        $share = $data['total'] > 0 ? round($data['described'] / $data['total'] * 100) : 0;

        return [
            Stat::make('Igara u katalogu', number_format($data['total']))
                ->description($data['week'] > 0 ? '+'.number_format($data['week']).' ove sedmice' : 'ništa novo ove sedmice')
                ->descriptionIcon('heroicon-m-puzzle-piece')
                ->url(GameResource::getUrl('index'))
                ->color('primary'),

            Stat::make('U sitemapu', $share.'%')
                ->description(number_format($missing).' bez opisa, dakle nevidljivo')
                ->descriptionIcon('heroicon-m-magnifying-glass')
                // Below three quarters the catalogue's reach is materially
                // smaller than its size, which is the whole argument for having
                // one this large.
                ->color(match (true) {
                    $share >= 90 => 'success',
                    $share >= 75 => 'warning',
                    default => 'danger',
                }),

            Stat::make('Pregleda igara', number_format($data['views']))
                ->description('ukupno, od uvođenja brojača')
                ->descriptionIcon('heroicon-m-eye')
                ->color($data['views'] > 0 ? 'success' : 'danger'),
        ];
    }
}
