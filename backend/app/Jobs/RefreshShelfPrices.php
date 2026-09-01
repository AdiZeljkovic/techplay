<?php

namespace App\Jobs;

use App\Models\GameExternalId;
use App\Models\GamePrice;
use App\Services\SteamPriceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Prices the games people own, and only those.
 *
 * The catalogue holds 332,455 games; the shelves hold 1,017 of them. Pricing
 * the catalogue is a job that never finishes and nobody asked for; pricing the
 * shelves is nine batch calls.
 *
 * Two passes. Games that already carry a Steam app id go a hundred at a time
 * through appdetails. Games that do not — a title that arrived from Epic, GOG
 * or Xbox and was never looked up on Steam — are searched for by name, one at
 * a time, and the app id that comes back is kept: the second run finds them in
 * the cheap pass. That is 152 games today and, if the names match, close to
 * none next week.
 *
 * The name pass is capped per run. Steam tolerates a few hundred requests in
 * five minutes and there is no reason to find its edge; the remainder is simply
 * picked up tomorrow.
 */
class RefreshShelfPrices implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 900;

    /** Names looked up per run. The rest wait a day; nothing is lost. */
    private const NAME_LOOKUPS = 60;

    /** A price older than this is asked for again. */
    private const STALE_DAYS = 7;

    public function handle(SteamPriceService $steam): void
    {
        $shelfGameIds = DB::table('user_games')->distinct()->pluck('game_id');

        if ($shelfGameIds->isEmpty()) {
            return;
        }

        $fresh = GamePrice::where('fetched_at', '>', now()->subDays(self::STALE_DAYS))
            ->pluck('game_id')
            ->flip();

        $wanted = $shelfGameIds->reject(fn ($id) => $fresh->has($id))->values();

        if ($wanted->isEmpty()) {
            return;
        }

        // ── pass one: everything with an app id, a hundred at a time ────────
        $appIdByGame = GameExternalId::where('provider', 'steam')
            ->whereIn('game_id', $wanted)
            ->pluck('external_id', 'game_id')
            ->map(fn ($id) => (int) $id);

        $priced = 0;

        if ($appIdByGame->isNotEmpty()) {
            $prices = $steam->pricesFor($appIdByGame->values()->all());

            foreach ($appIdByGame as $gameId => $appId) {
                if (! isset($prices[$appId])) {
                    continue;
                }

                $this->store($gameId, $prices[$appId]);
                $priced++;
            }
        }

        // ── pass two: the ones nobody ever looked up on Steam ───────────────
        $missing = DB::table('games')
            ->whereIn('id', $wanted->reject(fn ($id) => $appIdByGame->has($id))->values())
            ->orderBy('id')
            ->limit(self::NAME_LOOKUPS)
            ->get(['id', 'name']);

        $found = 0;

        foreach ($missing as $game) {
            $hit = $steam->priceByName($game->name);

            if (! $hit) {
                // Recorded so the shelf can say how many it could not price,
                // and so tomorrow's run does not ask again for a week.
                $this->store($game->id, ['status' => 'unavailable', 'currency' => 'USD', 'full' => null, 'final' => null, 'discount' => 0]);

                continue;
            }

            // Kept, so this game joins the cheap pass from now on.
            GameExternalId::firstOrCreate(
                ['provider' => 'steam', 'external_id' => (string) $hit['app_id']],
                ['game_id' => $game->id],
            );

            $this->store($game->id, $hit);
            $found++;
        }

        Log::info('RefreshShelfPrices', [
            'shelf_games' => $shelfGameIds->count(),
            'refreshed' => $priced,
            'found_by_name' => $found,
            'names_tried' => $missing->count(),
        ]);
    }

    /** @param  array{status:string,currency:string,full:?int,final:?int,discount:int}  $p */
    private function store(int $gameId, array $p): void
    {
        GamePrice::updateOrCreate(
            ['game_id' => $gameId],
            [
                'status' => $p['status'],
                'currency' => $p['currency'],
                'full_cents' => $p['full'],
                'final_cents' => $p['final'],
                'discount_percent' => $p['discount'],
                'source' => 'steam',
                'fetched_at' => now(),
            ],
        );
    }
}
