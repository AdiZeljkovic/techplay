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
 * The free tier allows 25 searches a day (details bill a separate, roomier
 * bucket), and each game costs one of each — so this never sweeps: it runs once a day from
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

        $ours = $this->comparable($game->name);
        $exact = collect($results)->first(fn ($r) => $this->comparable($r['name'] ?? '') === $ours);
        $match = $exact ?? ($results[0] ?? null);

        if (! $match || ! isset($match['id'])) {
            return $this->record($game, ['miss' => true]);
        }

        $detail = $this->http(20)->withHeaders($headers)
            ->get('https://'.self::HOST.'/game/'.$match['id'])
            ->throw()
            ->json() ?? [];

        // The year guard, as everywhere — with one asymmetry for exact-name
        // matches: Moby records the Early Access launch (Baldur's Gate 3,
        // 2020) while OpenCritic scores the 1.0 release (2023), so an exact
        // name may run up to three years LATER than ours. Never further —
        // that is where remakes wearing the same name live (Resident Evil 4,
        // eighteen years apart) — and never looser for fuzzy matches.
        $ocYear = isset($detail['firstReleaseDate']) ? (int) substr($detail['firstReleaseDate'], 0, 4) : null;
        if ($ocYear && $game->released) {
            $drift = $ocYear - $game->released->year;
            $allowed = $exact !== null ? ($drift >= -1 && $drift <= 3) : abs($drift) <= 1;
            if (! $allowed) {
                return $this->record($game, ['miss' => true]);
            }
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

    /**
     * A name reduced for comparison: lowercased, punctuation out, roman
     * numerals as digits — we say "Baldur's Gate III", OpenCritic says
     * "Baldur's Gate 3", and both mean the same game.
     */
    private function comparable(string $name): string
    {
        $romans = ['x' => '10', 'ix' => '9', 'viii' => '8', 'vii' => '7', 'vi' => '6',
            'v' => '5', 'iv' => '4', 'iii' => '3', 'ii' => '2'];

        $s = mb_strtolower(trim($name));
        $s = (string) preg_replace('/[^\p{L}\p{N} ]+/u', ' ', $s);
        $s = (string) preg_replace_callback(
            '/\b(x|ix|viii|vii|vi|v|iv|iii|ii)\b/',
            fn ($m) => $romans[$m[1]],
            $s
        );

        return trim((string) preg_replace('/\s+/', ' ', $s));
    }

    private function record(Game $game, array $entry): bool
    {
        $scores = (array) ($game->critic_scores ?? []);
        $scores['opencritic'] = $entry;
        $game->forceFill(['critic_scores' => $scores])->save();

        return ! isset($entry['miss']);
    }
}
