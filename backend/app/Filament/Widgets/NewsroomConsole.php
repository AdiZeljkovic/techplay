<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\BrokenLinkResource;
use App\Filament\Resources\CommentResource;
use App\Filament\Resources\GameResource;
use App\Filament\Resources\NewsResource;
use App\Filament\Resources\ReportResource;
use App\Filament\Resources\UserResource;
use App\Models\Article;
use App\Models\Comment;
use App\Models\Game;
use App\Models\Report;
use App\Models\Season;
use App\Models\User;
use Filament\Widgets\Widget;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The whole state of the platform, on one surface.
 *
 * What this replaces: five stacked bands of three identical white boxes. Every
 * number in the same size, in the same frame, at the same weight — fifteen
 * cards saying "I am a number" and nothing saying which one to read first. It
 * was a table of contents for a dashboard rather than a dashboard.
 *
 * ── The design, and why ──────────────────────────────────────────────────
 *
 * **One surface, not fifteen.** Related numbers sit together, separated by
 * hairlines rather than each getting its own card. A border is a strong signal
 * and should mean "this is a different thing" — spent on every number it means
 * nothing.
 *
 * **Size carries rank.** The lead figure is days since the last publish, set
 * large, because a newsroom that has gone quiet is the one condition here that
 * gets worse the longer nobody notices. Everything else is support type.
 *
 * **Shape carries state.** Where there is a ratio there is a bar — the share of
 * the catalogue search engines can see, the share of the season elapsed. Where
 * there is a series there is a line. A percentage printed as text makes you do
 * the picturing yourself.
 *
 * **Colour is rationed.** The accent marks one thing: the rule at the top, which
 * is the site's own signature. Everything else that is coloured is coloured
 * because it is a *state* — amber for slipping, red for broken, green for
 * healthy — and those four are the only colours in play.
 *
 * All of it reads from one cached payload, so the page costs one round of
 * queries rather than one per box.
 */
class NewsroomConsole extends Widget
{
    protected static ?int $sort = 1;

    protected int|string|array $columnSpan = 'full';

    protected string $view = 'filament.widgets.newsroom-console';

    /**
     * Sixty seconds for the queues, longer for everything else, and one cache
     * entry so the page does one round of work.
     *
     * The queue counts are what a person watches immediately after acting on
     * them; a catalogue of 142,000 games does not change while you read it.
     */
    public function getData(): array
    {
        $queues = Cache::remember('dash.queues.v2', 60, fn () => [
            'drafts' => Article::where('status', 'draft')->count(),
            'review' => Article::where('status', 'pending_review')->count(),
            'comments' => Comment::where('status', 'pending')->count(),
            'reports' => Report::where('status', 'pending')->count(),
            'failed' => DB::table('failed_jobs')->count(),
            'links' => DB::table('broken_links')->where('is_fixed', false)->whereIn('status_code', [404, 410])->count(),
        ]);

        $slow = Cache::remember('dash.slow.v2', 600, function () {
            $published = Article::where('status', 'published');

            $best = (clone $published)
                ->where('published_at', '>=', now()->startOfMonth())
                ->orderByDesc('views')
                ->first(['id', 'title', 'views']);

            $games = Game::count();
            $described = Game::whereNotNull('description')->count();
            $season = Season::where('is_active', true)->first(['name', 'start_date', 'end_date']);

            return [
                'today' => (clone $published)->whereDate('published_at', today())->count(),
                'week' => (clone $published)->where('published_at', '>=', now()->startOfWeek())->count(),
                'month' => (clone $published)->where('published_at', '>=', now()->startOfMonth())->count(),
                'last' => (clone $published)->max('published_at'),
                'series' => $this->last14Days(),

                'views' => (int) (clone $published)->sum('views'),
                'articles' => (clone $published)->count(),
                'monthViews' => (int) (clone $published)->where('published_at', '>=', now()->startOfMonth())->sum('views'),
                'bestId' => $best?->id,
                'bestTitle' => $best?->title,
                'bestViews' => (int) ($best?->views ?? 0),

                'games' => $games,
                'described' => $described,
                'gameViews' => (int) Game::sum('views'),
                'gamesWeek' => Game::where('created_at', '>=', now()->startOfWeek())->count(),

                'users' => User::count(),
                'active' => User::where('last_seen_at', '>=', now()->subDays(7))->count(),
                'newUsers' => User::where('created_at', '>=', now()->startOfMonth())->count(),
                'weekComments' => Comment::where('created_at', '>=', now()->startOfWeek())->count(),
                'bounty' => DB::table('bounty_transactions')->where('created_at', '>=', now()->startOfWeek())->count(),
                'seasonName' => $season?->name,
                'seasonStart' => $season?->start_date,
                'seasonEnd' => $season?->end_date,
            ];
        });

        $last = $slow['last'] ? Carbon::parse($slow['last']) : null;
        // copy(), because Carbon is mutable and startOfDay() would rewind the
        // instance the timestamp below is printed from.
        $daysSince = $last ? (int) $last->copy()->startOfDay()->diffInDays(now()->startOfDay()) : null;

        $seasonPct = null;
        if ($slow['seasonStart'] && $slow['seasonEnd']) {
            $start = Carbon::parse($slow['seasonStart']);
            $end = Carbon::parse($slow['seasonEnd']);
            $span = $start->diffInDays($end) ?: 1;
            $seasonPct = (int) max(0, min(100, round($start->diffInDays(now()) / $span * 100)));
        }

        return [
            'queues' => $this->attention($queues),
            'daysSince' => $daysSince,
            'lastAt' => $last,
            'cadence' => $this->cadence($daysSince),
            'today' => $slow['today'],
            'week' => $slow['week'],
            'month' => $slow['month'],
            'series' => $slow['series'],
            'sparkline' => $this->sparkline($slow['series']),

            'views' => $slow['views'],
            'articles' => $slow['articles'],
            'monthViews' => $slow['monthViews'],
            'bestTitle' => $slow['bestTitle'],
            'bestViews' => $slow['bestViews'],
            'bestUrl' => $slow['bestId'] ? NewsResource::getUrl('edit', ['record' => $slow['bestId']]) : null,

            'games' => $slow['games'],
            'gamesWeek' => $slow['gamesWeek'],
            'gameViews' => $slow['gameViews'],
            'sitemapPct' => $slow['games'] > 0 ? (int) round($slow['described'] / $slow['games'] * 100) : 0,
            'invisible' => $slow['games'] - $slow['described'],
            'gamesUrl' => GameResource::getUrl('index'),

            'users' => $slow['users'],
            'active' => $slow['active'],
            'newUsers' => $slow['newUsers'],
            'weekComments' => $slow['weekComments'],
            'bounty' => $slow['bounty'],
            'usersUrl' => UserResource::getUrl('index'),
            'seasonName' => $slow['seasonName'],
            'seasonPct' => $seasonPct,
            'seasonLeft' => $slow['seasonEnd'] ? (int) now()->startOfDay()->diffInDays(Carbon::parse($slow['seasonEnd']), false) : null,
        ];
    }

    /**
     * Only what is waiting, in the order somebody should deal with it.
     *
     * A failed job outranks a draft however few there are, because a draft is a
     * choice somebody made and a failed job is something that broke.
     */
    private function attention(array $q): array
    {
        $items = [];

        if ($q['failed'] > 0) {
            $items[] = ['n' => $q['failed'], 'label' => 'failed jobs', 'tone' => 'bad', 'url' => null];
        }
        if ($q['reports'] > 0) {
            $items[] = ['n' => $q['reports'], 'label' => 'open reports', 'tone' => 'bad', 'url' => ReportResource::getUrl('index')];
        }
        if ($q['comments'] > 0) {
            $items[] = ['n' => $q['comments'], 'label' => 'comments waiting', 'tone' => 'warn', 'url' => CommentResource::getUrl('index')];
        }
        if ($q['review'] > 0) {
            $items[] = ['n' => $q['review'], 'label' => 'awaiting review', 'tone' => 'warn', 'url' => NewsResource::getUrl('index')];
        }
        if ($q['links'] > 0) {
            $items[] = ['n' => $q['links'], 'label' => 'dead links', 'tone' => 'warn', 'url' => BrokenLinkResource::getUrl('index')];
        }
        if ($q['drafts'] > 0) {
            $items[] = ['n' => $q['drafts'], 'label' => 'drafts', 'tone' => 'idle', 'url' => NewsResource::getUrl('index')];
        }

        return $items;
    }

    /** Google News drops a publisher that goes quiet; three days is a slow week. */
    private function cadence(?int $days): string
    {
        return match (true) {
            $days === null => 'idle',
            $days >= 7 => 'bad',
            $days >= 3 => 'warn',
            default => 'good',
        };
    }

    /**
     * The fortnight as an SVG path, drawn full width rather than in the forty
     * pixels a stat card allows. Fourteen points, because thirty in this space
     * is a texture and not a chart.
     */
    private function sparkline(array $series): array
    {
        $max = max(1, max($series));
        $n = count($series);
        $w = 100;
        $h = 28;

        $points = [];
        foreach ($series as $i => $v) {
            $x = $n > 1 ? round($i / ($n - 1) * $w, 2) : 0;
            $y = round($h - ($v / $max) * ($h - 3) - 1.5, 2);
            $points[] = [$x, $y, $v];
        }

        $line = '';
        foreach ($points as $i => [$x, $y]) {
            $line .= ($i === 0 ? 'M' : 'L').$x.' '.$y;
        }

        return [
            'line' => $line,
            'area' => $line.'L'.$w.' '.$h.'L0 '.$h.'Z',
            'points' => $points,
            'max' => $max,
        ];
    }

    /** @return list<int> one bar per day, oldest first */
    private function last14Days(): array
    {
        $rows = Article::query()
            ->where('status', 'published')
            ->where('published_at', '>=', now()->subDays(13)->startOfDay())
            ->selectRaw('DATE(published_at) as d, COUNT(*) as c')
            ->groupBy('d')
            ->pluck('c', 'd');

        return collect(range(13, 0))
            ->map(fn ($back) => (int) ($rows[now()->subDays($back)->toDateString()] ?? 0))
            ->all();
    }
}
