<?php

namespace App\Jobs;

use App\Models\Game;
use App\Services\Releases\TalksToStores;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * The slow half of games:enrich-steam.
 *
 * Each run takes a bite of candidate appids, asks Steam's appdetails about
 * them, and reschedules itself a minute later until the queue is dry.
 * Steam tolerates roughly 200 requests per five minutes from one address;
 * 25 a minute stays comfortably under while still clearing ~36k a day.
 *
 * A candidate is believed only if appdetails says it is actually a game
 * AND its release year sits within one year of ours (unknown years pass —
 * half the catalogue's dates are year-precision anyway). Everything else
 * is marked rejected and never asked about again.
 *
 * Filled columns: only the empty ones, locked_fields respected. The one
 * exception to "empty only" is critic_scores.metacritic, which is merged
 * in whenever Steam carries it — that data updates at the source.
 */
class EnrichSteamBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, TalksToStores;

    public const PER_RUN = 25;

    public int $timeout = 300;

    public int $tries = 3;

    public function handle(): void
    {
        $candidates = DB::table('game_external_ids')
            ->where('provider', 'steam')
            ->whereRaw($this->statusIs('candidate'))
            ->orderBy('id')
            ->limit(self::PER_RUN)
            ->get(['id', 'game_id', 'external_id']);

        if ($candidates->isEmpty()) {
            Log::info('[EnrichSteamBatch] Red je prazan — drip gotov.');

            return;
        }

        foreach ($candidates as $candidate) {
            try {
                $this->process($candidate);
            } catch (\Throwable $e) {
                // One sour appid must not stall the whole drip; leave it as a
                // candidate so a later run retries it.
                Log::warning('[EnrichSteamBatch] '.$candidate->external_id.': '.$e->getMessage());
            }

            usleep(1_500_000); // ~40/min ceiling even if the batch is fast
        }

        // On the sync driver a tail dispatch would recurse through the whole
        // queue in one process; the drip only makes sense on a real queue.
        if (config('queue.default') !== 'sync') {
            self::dispatch()->delay(now()->addMinute());
        }
    }

    private function process(object $candidate): void
    {
        $response = $this->http(20)
            ->retry(2, 2000)
            ->get('https://store.steampowered.com/api/appdetails', [
                'appids' => $candidate->external_id,
                'cc' => 'us',
                'l' => 'en',
            ]);

        $payload = $response->json($candidate->external_id) ?? [];
        $data = ($payload['success'] ?? false) ? ($payload['data'] ?? []) : [];

        $game = Game::find($candidate->game_id);

        if (! $game || ($data['type'] ?? '') !== 'game' || ! $this->yearAgrees($game, $data)) {
            $this->mark($candidate->id, 'rejected');

            return;
        }

        $locked = (array) ($game->locked_fields ?? []);
        $fields = [];

        $description = $data['about_the_game'] ?? $data['detailed_description'] ?? null;
        if (filled($description) && blank($game->description)) {
            $fields['description'] = $description;
        }
        if (! empty($data['developers']) && ($game->developers ?? []) === []) {
            $fields['developers'] = array_values(array_filter($data['developers']));
        }
        if (! empty($data['publishers']) && ($game->publishers ?? []) === []) {
            $fields['publishers'] = array_values(array_filter($data['publishers']));
        }
        if (filled($data['website'] ?? null) && blank($game->website)) {
            $fields['website'] = $data['website'];
        }
        if (! empty($data['screenshots']) && ($game->screenshots ?? []) === []) {
            $fields['screenshots'] = collect($data['screenshots'])
                ->pluck('path_full')->filter()->values()->all();
        }
        if (! empty($data['movies']) && ($game->videos ?? []) === []) {
            // Same preference ladder as SteamCatalog: HLS plays everywhere
            // (natively or via hls.js), DASH is the fallback, mp4 is history.
            $fields['videos'] = collect($data['movies'])
                ->sortByDesc(fn ($m) => (int) ($m['highlight'] ?? 0))
                ->map(fn ($m) => $m['hls_h264'] ?? $m['dash_h264'] ?? $m['dash_av1'] ?? data_get($m, 'mp4.max'))
                ->filter()->values()->all();
        }
        if (filled($data['header_image'] ?? null) && blank($game->cover_url)) {
            $fields['cover_url'] = $data['header_image'];
        }

        // Metacritic rides along inside Steam's own payload — licensed at
        // the source, refreshed whenever we ask.
        if (isset($data['metacritic']['score'])) {
            $scores = (array) ($game->critic_scores ?? []);
            $scores['metacritic'] = [
                'score' => (int) $data['metacritic']['score'],
                'url' => $data['metacritic']['url'] ?? null,
            ];
            $fields['critic_scores'] = $scores;
        }

        foreach ($locked as $field) {
            unset($fields[$field]);
        }

        if ($fields !== []) {
            $game->forceFill($fields)->save();
        }

        $this->mark($candidate->id, 'enriched');
    }

    /**
     * Steam's release date against ours, give or take a year — regional
     * releases and re-listings drift that far without being different games.
     */
    private function yearAgrees(Game $game, array $data): bool
    {
        if (! $game->released) {
            return true;
        }

        $steamDate = $data['release_date']['date'] ?? '';
        if (! preg_match('/(\d{4})/', $steamDate, $m)) {
            return true; // "Coming soon" and friends — nothing to disagree with
        }

        return abs(((int) $m[1]) - $game->released->year) <= 1;
    }

    private function mark(int $id, string $status): void
    {
        DB::table('game_external_ids')->where('id', $id)->update([
            'metadata' => json_encode(['status' => $status, 'checked_at' => now()->toIso8601String()]),
            'updated_at' => now(),
        ]);
    }

    private function statusIs(string $status): string
    {
        return DB::getDriverName() === 'pgsql'
            ? "metadata::jsonb ->> 'status' = '{$status}'"
            : "json_extract(metadata, '$.status') = '{$status}'";
    }
}
