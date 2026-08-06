<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\Releases\TalksToStores;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * A daily sip from the OpenCritic API — the official one, via RapidAPI,
 * scores displayed with attribution as their terms ask.
 *
 * The free tier is a couple dozen requests a day and each game costs two
 * (search, then detail), so this never sweeps: it runs once a day from
 * the scheduler, spends its budget on the most-viewed modern games that
 * still lack a score, and stops. OpenCritic only covers ~2014 onward,
 * so older rows are never attempted.
 *
 * Every outcome is recorded in critic_scores.opencritic — a score, or
 * {"miss": true} for games OpenCritic does not know — so tomorrow's
 * budget is never spent asking yesterday's questions.
 */
class EnrichFromOpenCritic extends Command
{
    use TalksToStores;

    protected $signature = 'games:enrich-opencritic
        {--budget= : Override the daily request budget}';

    protected $description = 'Fill critic_scores.opencritic for the most-viewed modern games, within the daily API budget';

    private const HOST = 'opencritic-api.p.rapidapi.com';

    public function handle(): int
    {
        $key = (string) config('services.opencritic.key');
        if ($key === '') {
            $this->error('RAPIDAPI_KEY nije postavljen.');

            return self::FAILURE;
        }

        $budget = (int) ($this->option('budget') ?: config('services.opencritic.daily_budget'));
        $games = $this->queue(intdiv($budget, 2));

        if ($games->isEmpty()) {
            $this->info('Nema kandidata — sve moderno i gledano već ima odgovor.');

            return self::SUCCESS;
        }

        $filled = 0;
        $missed = 0;

        foreach ($games as $game) {
            try {
                $this->process($game, $key) ? $filled++ : $missed++;
            } catch (\Throwable $e) {
                // A failed request spends budget without an answer; stop for
                // today rather than burn the rest on a bad connection.
                $this->warn($game->slug.': '.$e->getMessage());
                break;
            }

            sleep(2);
        }

        $this->info(sprintf('Popunjeno: %d | OpenCritic ne zna: %d', $filled, $missed));

        return self::SUCCESS;
    }

    /**
     * Who deserves today's budget: modern games people actually open,
     * that have never been asked about.
     */
    private function queue(int $count)
    {
        return Game::query()
            ->where('released', '>=', '2014-01-01')
            ->where(fn ($q) => $q->whereNull('critic_scores')
                ->orWhereRaw(DB::getDriverName() === 'pgsql'
                    ? "critic_scores::jsonb -> 'opencritic' is null"
                    : "json_extract(critic_scores, '$.opencritic') is null"))
            ->orderByDesc('views')
            ->orderByRaw('rating DESC NULLS LAST')
            ->limit($count)
            ->get(['id', 'slug', 'name', 'released', 'critic_scores']);
    }

    /** @return bool true when a score landed, false when OpenCritic has no answer */
    private function process(Game $game, string $key): bool
    {
        $headers = ['x-rapidapi-host' => self::HOST, 'x-rapidapi-key' => $key];

        $results = $this->http(20)->withHeaders($headers)
            ->get('https://'.self::HOST.'/game/search', ['criteria' => $game->name])
            ->throw()
            ->json() ?? [];

        $match = collect($results)->first(function ($r) use ($game) {
            return mb_strtolower(trim($r['name'] ?? '')) === mb_strtolower(trim($game->name));
        }) ?? ($results[0] ?? null);

        if (! $match || ! isset($match['id'])) {
            return $this->record($game, ['miss' => true]);
        }

        $detail = $this->http(20)->withHeaders($headers)
            ->get('https://'.self::HOST.'/game/'.$match['id'])
            ->throw()
            ->json() ?? [];

        // The year guard, as everywhere: a name match from the wrong year is
        // a different game wearing the same clothes.
        $ocYear = isset($detail['firstReleaseDate']) ? (int) substr($detail['firstReleaseDate'], 0, 4) : null;
        if ($ocYear && $game->released && abs($ocYear - $game->released->year) > 1) {
            return $this->record($game, ['miss' => true]);
        }

        $score = $detail['topCriticScore'] ?? null;
        if (! is_numeric($score) || $score <= 0) {
            return $this->record($game, ['miss' => true]);
        }

        $this->record($game, [
            'score' => (int) round($score),
            'tier' => $detail['tier'] ?? null,
            'url' => 'https://opencritic.com/game/'.$match['id'].'/'.($detail['slug'] ?? ''),
        ]);

        $this->line(sprintf('  %s → %d (%s)', $game->name, (int) round($score), $detail['tier'] ?? '—'));

        return true;
    }

    private function record(Game $game, array $entry): bool
    {
        $scores = (array) ($game->critic_scores ?? []);
        $scores['opencritic'] = $entry;
        $game->forceFill(['critic_scores' => $scores])->save();

        return ! isset($entry['miss']);
    }
}
