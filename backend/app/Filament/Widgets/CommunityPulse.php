<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\UserResource;
use App\Models\Comment;
use App\Models\Season;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Whether anybody is actually here.
 *
 * The honest version of this widget, not the flattering one. "52 registered
 * users" is a number that only ever goes up and tells you nothing; **active in
 * the last seven days** can go down, which is what makes it worth putting on a
 * screen.
 *
 * The season is here because the XP economy is the one part of the platform
 * that expires. A season that ended three weeks ago and was never replaced
 * leaves quests pointing at nothing, and there is no other place in the panel
 * where that becomes visible without going looking for it.
 */
class CommunityPulse extends BaseWidget
{
    protected static ?int $sort = 4;

    protected ?string $heading = 'Community';

    protected function getStats(): array
    {
        $data = Cache::remember('dashboard.community.v1', 300, fn () => [
            'users' => User::count(),
            'new' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            'active' => User::where('last_seen_at', '>=', now()->subDays(7))->count(),
            'comments' => Comment::where('created_at', '>=', now()->startOfWeek())->count(),
            'bounty' => DB::table('bounty_transactions')->where('created_at', '>=', now()->startOfWeek())->count(),
            'season' => Season::where('is_active', true)->first(['name', 'end_date']),
        ]);

        $season = $data['season'];
        $endsIn = $season?->end_date ? (int) now()->startOfDay()->diffInDays($season->end_date, false) : null;

        return [
            Stat::make('Active (7 days)', $data['active'])
                ->description('of '.number_format($data['users']).' registered')
                ->descriptionIcon('heroicon-m-user-circle')
                ->url(UserResource::getUrl('index'))
                ->color($data['active'] > 0 ? 'success' : 'gray'),

            Stat::make('New this month', $data['new'])
                ->description($data['comments'].' comments this week')
                ->descriptionIcon('heroicon-m-user-plus')
                ->color($data['new'] > 0 ? 'primary' : 'gray'),

            Stat::make('Season', $season?->name ?? 'none active')
                ->description(match (true) {
                    $season === null => 'quests belong to no season',
                    $endsIn === null => $data['bounty'].' bounty transactions this week',
                    $endsIn < 0 => 'ended '.$this->days(abs($endsIn)).' ago',
                    default => $this->days($endsIn).' left · '.$data['bounty'].' transactions this week',
                })
                ->descriptionIcon('heroicon-m-trophy')
                ->color(match (true) {
                    $season === null => 'danger',
                    $endsIn !== null && $endsIn < 0 => 'danger',
                    $endsIn !== null && $endsIn <= 7 => 'warning',
                    default => 'success',
                }),
        ];
    }

    /**
     * "1 days ago" is the kind of thing nobody reports and everybody notices,
     * and a season boundary is exactly where the count is 1.
     */
    private function days(int $n): string
    {
        return $n.($n === 1 ? ' day' : ' days');
    }
}
