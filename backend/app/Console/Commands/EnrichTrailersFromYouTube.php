<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Releases\TalksToStores;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * A daily ration of YouTube searches spent on trailers — for the games
 * Steam could not cover (console exclusives, delistings, the pre-Steam
 * era back to 2005; older than that, "official trailer" searches return
 * fan uploads and lies).
 *
 * The Search endpoint allows ~100 calls a day, so this runs once from
 * the scheduler, spends its budget on the most-viewed games still
 * without a video, and stops. A result is believed only if its title
 * carries both the game's name and the word "trailer" — otherwise the
 * game is marked as missed (game_external_ids, provider 'youtube') and
 * never asked about again. The stored URL is a plain watch link; the
 * game page already embeds those as YouTube iframes.
 */
class EnrichTrailersFromYouTube extends Command
{
    use TalksToStores;

    protected $signature = 'games:enrich-trailers
        {--budget= : Override the daily search budget}';

    protected $description = 'Find official trailers on YouTube for the most-viewed games without a video, within the daily quota';

    public function handle(): int
    {
        $key = (string) config('services.youtube.key');
        if ($key === '') {
            $this->error('YOUTUBE_API_KEY nije postavljen.');

            return self::FAILURE;
        }

        $budget = (int) ($this->option('budget') ?: config('services.youtube.daily_budget'));
        $games = $this->queue($budget);

        if ($games->isEmpty()) {
            $this->info('Nema kandidata — sve gledano već ima trailer ili odgovor.');

            return self::SUCCESS;
        }

        $found = 0;
        $missed = 0;

        foreach ($games as $game) {
            try {
                $this->process($game, $key) ? $found++ : $missed++;
            } catch (\Throwable $e) {
                $this->warn($game->slug.': '.$e->getMessage());
                break; // quota exhausted or the API is unhappy — stop for today
            }

            sleep(1);
        }

        $this->info(sprintf('Traileri nađeni: %d | bez pouzdanog pogotka: %d', $found, $missed));

        return self::SUCCESS;
    }

    private function queue(int $count)
    {
        return Game::query()
            ->where('released', '>=', '2005-01-01')
            ->where(fn ($q) => $q->whereNull('videos')->orWhereRaw("videos::text in ('[]', 'null')"))
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))
                ->from('game_external_ids')
                ->whereColumn('game_external_ids.game_id', 'games.id')
                ->where('provider', 'youtube'))
            ->orderByDesc('views')
            ->orderByRaw('rating DESC NULLS LAST')
            ->limit($count)
            ->get(['id', 'slug', 'name', 'released', 'videos']);
    }

    /** @return bool true when a trailer landed */
    private function process(Game $game, string $key): bool
    {
        $items = $this->http(20)
            ->get('https://www.googleapis.com/youtube/v3/search', [
                'key' => $key,
                'part' => 'snippet',
                'q' => $game->name.' official trailer',
                'type' => 'video',
                'videoEmbeddable' => 'true',
                'maxResults' => 5,
                'safeSearch' => 'none',
            ])
            ->throw()
            ->json('items') ?? [];

        $needle = mb_strtolower($game->name);
        $hit = collect($items)->first(function ($item) use ($needle) {
            $title = mb_strtolower($item['snippet']['title'] ?? '');

            return str_contains($title, 'trailer') && str_contains($title, $needle);
        });

        $videoId = $hit['id']['videoId'] ?? null;

        DB::table('game_external_ids')->insertOrIgnore([
            'game_id' => $game->id,
            'provider' => 'youtube',
            'external_id' => $videoId ?? '-',
            'metadata' => json_encode(['status' => $videoId ? 'found' : 'miss', 'checked_at' => now()->toIso8601String()]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! $videoId) {
            return false;
        }

        $game->forceFill(['videos' => ['https://www.youtube.com/watch?v='.$videoId]])->save();
        $this->line('  '.$game->name.' → '.($hit['snippet']['title'] ?? $videoId));

        return true;
    }
}
