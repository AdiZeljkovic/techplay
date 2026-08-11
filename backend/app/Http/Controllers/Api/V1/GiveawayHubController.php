<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Giveaway;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The giveaways page, minus the list of giveaways itself: how much has been
 * given away, who won recently, what the reader has entered, and the facets
 * that populate the filter row.
 *
 * Every figure is counted. Today most of them are small — two draws, twenty-one
 * entries, no winners announced yet — and they are reported as they are. A
 * headline number that has to be walked back later is worse than a small one
 * that grows.
 */
class GiveawayHubController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        return $this->success([
            'stats' => $this->stats(),
            'facets' => $this->facets(),
            'featured' => $this->featured(),
            'recent_winners' => $this->recentWinners(),
            'mine' => $this->mine(),
        ]);
    }

    /**
     * The four figures across the top. Prize value is a sum of what editors
     * entered, so it is only as good as the admin — but it is not invented.
     */
    private function stats(): array
    {
        return Cache::remember('giveaways.hub.stats.v2', 300, fn () => [
            'active' => Giveaway::where('is_public', true)->active()->count(),
            'prize_value' => (float) Giveaway::where('is_public', true)->sum('prize_value'),
            'winners' => Giveaway::where('is_public', true)->whereNotNull('winner_id')->count(),
            // Scoped to the draws this page actually lists. Unscoped it counted
            // entries into giveaways nobody can see — twenty-one people taking
            // part in two draws whose own entry counts both read zero.
            'participants' => (int) DB::table('giveaway_entries')
                ->join('giveaways', 'giveaways.id', '=', 'giveaway_entries.giveaway_id')
                ->where('giveaways.is_public', true)
                ->distinct('giveaway_entries.user_id')
                ->count('giveaway_entries.user_id'),
        ]);
    }

    /**
     * Only what has actually been filled in.
     *
     * The columns are new and nullable, so a filter for a value nobody has used
     * would return nothing and look broken. Offering only what exists means the
     * row grows as the admin describes more draws.
     *
     * @return array<string,array<int,array{value:string,label:string,count:int}>>
     */
    private function facets(): array
    {
        $labels = [
            'platform' => ['pc' => 'PC', 'playstation' => 'PlayStation', 'xbox' => 'Xbox', 'nintendo' => 'Nintendo', 'multi' => 'Multi-platform'],
            'prize_type' => ['hardware' => 'Hardware', 'game_key' => 'Game keys', 'gift_card' => 'Gift cards', 'subscription' => 'Subscriptions', 'merch' => 'Merch', 'bundle' => 'Bundles'],
            'region' => ['worldwide' => 'Worldwide', 'eu' => 'Europe', 'ba' => 'Bosnia', 'na' => 'North America'],
            'entry_type' => ['free' => 'Free entry', 'members' => 'Members only', 'tasks' => 'Task based'],
        ];

        return Cache::remember('giveaways.hub.facets.v1', 900, function () use ($labels) {
            $out = [];

            foreach (array_keys($labels) as $column) {
                $out[$column] = Giveaway::query()
                    ->where('is_public', true)
                    ->whereNotNull($column)
                    ->groupBy($column)
                    ->orderByRaw('count(*) desc')
                    ->get([$column, DB::raw('count(*) as tally')])
                    ->map(fn ($row) => [
                        'value' => $row->{$column},
                        'label' => $labels[$column][$row->{$column}] ?? ucfirst(str_replace('_', ' ', $row->{$column})),
                        'count' => (int) $row->tally,
                    ])
                    ->all();
            }

            return $out;
        });
    }

    /**
     * What to put at the top: the live draw closing soonest, because that is
     * the one a reader can still do something about.
     */
    private function featured(): ?array
    {
        $giveaway = Giveaway::where('is_public', true)
            ->active()
            ->withCount('entries')
            ->orderBy('ends_at')
            ->first();

        if (! $giveaway) {
            return null;
        }

        return [
            'slug' => $giveaway->slug,
            'title' => $giveaway->title,
            'description' => $giveaway->description ? strip_tags($giveaway->description) : null,
            'featured_image' => $giveaway->featured_image ? asset('storage/'.$giveaway->featured_image) : null,
            'prize' => [
                'name' => $giveaway->prize_name,
                'value' => $giveaway->prize_value,
                'image' => $giveaway->prize_image ? asset('storage/'.$giveaway->prize_image) : null,
            ],
            'ends_at' => $giveaway->ends_at?->toISOString(),
            'entries' => $giveaway->entries_count,
            'entry_goal' => $giveaway->entry_goal,
            'region' => $giveaway->region,
            'entry_type' => $giveaway->entry_type,
        ];
    }

    /** @return array<int,array> */
    private function recentWinners(): array
    {
        return Cache::remember('giveaways.hub.winners.v1', 300, fn () => Giveaway::query()
            ->where('is_public', true)
            ->whereNotNull('winner_id')
            ->with('winner:id,username,avatar_url')
            ->orderByDesc('winner_announced_at')
            ->limit(6)
            ->get()
            ->map(fn (Giveaway $g) => [
                'slug' => $g->slug,
                'title' => $g->title,
                'prize' => $g->prize_name,
                'announced_at' => $g->winner_announced_at?->toISOString(),
                'winner' => $g->winner ? [
                    'username' => $g->winner->username,
                    'avatar' => $g->winner->avatar_url,
                ] : null,
            ])
            ->all());
    }

    /**
     * The reader's own standing. Null for a visitor who is not signed in —
     * the page shows an invitation rather than a row of zeroes.
     */
    private function mine(): ?array
    {
        $user = Auth::guard('sanctum')->user() ?? Auth::user();

        if (! $user) {
            return null;
        }

        $rows = DB::table('giveaway_entries')
            ->join('giveaways', 'giveaways.id', '=', 'giveaway_entries.giveaway_id')
            ->where('giveaway_entries.user_id', $user->id)
            ->get(['giveaways.status', 'giveaways.ends_at', 'giveaways.winner_id']);

        return [
            'total' => $rows->count(),
            'active' => $rows->filter(fn ($r) => $r->status === 'active' && $r->ends_at >= now())->count(),
            'won' => $rows->where('winner_id', $user->id)->count(),
            'ended' => $rows->filter(fn ($r) => $r->status === 'ended' || $r->ends_at < now())->count(),
        ];
    }
}
