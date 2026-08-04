<?php

namespace App\Services;

use App\Models\Clan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Clan DNA — the aggregate taste of everyone on the roster, unlocked by the
 * Archive. The same philosophy as the personal Gamer DNA: every figure is
 * derived from real collections, the dominant identity is a deterministic
 * read of the mix, and nothing is ever guessed.
 */
class ClanDnaService
{
    /** Top genre → what the clan gets called. */
    private const GENRE_NOUNS = [
        'Role-playing (RPG)' => 'Lorekeepers',
        'Action' => 'Frontliners',
        'Strategy / tactics' => 'Tacticians',
        'Adventure' => 'Explorers',
        'Simulation' => 'Architects',
        'Puzzle' => 'Puzzleminds',
        'Sports' => 'Competitors',
        'Racing / Driving' => 'Speedrunners',
    ];

    private const ERAS = [
        ['key' => 'retro', 'label' => 'Retro', 'from' => 0, 'to' => 1999, 'color' => '#a78bfa'],
        ['key' => 'ps2', 'label' => 'PS2 Era', 'from' => 2000, 'to' => 2006, 'color' => '#60a5fa'],
        ['key' => 'ps3', 'label' => 'PS3 / 360', 'from' => 2007, 'to' => 2012, 'color' => '#22d3ee'],
        ['key' => 'ps4', 'label' => 'PS4 / X1', 'from' => 2013, 'to' => 2020, 'color' => '#34d399'],
        ['key' => 'ps5', 'label' => 'PS5 / XSX', 'from' => 2021, 'to' => 9999, 'color' => '#f97316'],
    ];

    /**
     * The clan's DNA, cached for an hour — it aggregates every member's
     * collection and taste doesn't move faster than that.
     */
    public function build(Clan $clan): array
    {
        return Cache::remember("clan.dna.{$clan->id}.v1", 3600, function () use ($clan) {
            $memberIds = $clan->members()->pluck('user_id');

            $rows = DB::table('user_games')
                ->join('games', 'games.id', '=', 'user_games.game_id')
                ->whereIn('user_games.user_id', $memberIds)
                ->limit(4000)
                ->get(['games.genre_names', 'games.released', 'user_games.status']);

            $genreTally = [];
            $eraTally = array_fill_keys(array_column(self::ERAS, 'key'), 0);
            $completed = 0;
            $owned = 0;

            foreach ($rows as $row) {
                if ($row->status !== 'wishlist') {
                    $owned++;
                    if ($row->status === 'completed') {
                        $completed++;
                    }
                }

                foreach ($this->genres($row->genre_names) as $genre) {
                    if (in_array($genre, ['Add-on', 'Compilation', 'Special edition'], true)) {
                        continue;
                    }
                    $genreTally[$genre] = ($genreTally[$genre] ?? 0) + 1;
                }

                $year = $row->released ? (int) substr((string) $row->released, 0, 4) : 0;

                if ($year > 1950) {
                    foreach (self::ERAS as $era) {
                        if ($year >= $era['from'] && $year <= $era['to']) {
                            $eraTally[$era['key']]++;
                            break;
                        }
                    }
                }
            }

            arsort($genreTally);
            $genreTotal = max(1, array_sum($genreTally));
            $eraTotal = max(1, array_sum($eraTally));
            $completionRate = $owned > 0 ? $completed / $owned : 0.0;

            return [
                'genres' => collect($genreTally)->take(6)->map(fn ($count, $name) => [
                    'name' => $name,
                    'count' => $count,
                    'percent' => (int) round($count / $genreTotal * 100),
                ])->values()->all(),
                'eras' => collect(self::ERAS)->map(fn (array $era) => [
                    'key' => $era['key'],
                    'label' => $era['label'],
                    'color' => $era['color'],
                    'percent' => (int) round($eraTally[$era['key']] / $eraTotal * 100),
                ])->values()->all(),
                'games' => (int) $rows->count(),
                'completed' => $completed,
                'completion_rate' => (int) round($completionRate * 100),
                'dominant_archetype' => $this->identity($genreTally, $completionRate),
            ];
        });
    }

    /**
     * "Relentless Tacticians" — an adjective earned by the completion rate,
     * a noun earned by the genre the clan actually plays most.
     */
    private function identity(array $genreTally, float $completionRate): ?string
    {
        $top = array_key_first($genreTally);

        if ($top === null) {
            return null;
        }

        $noun = self::GENRE_NOUNS[$top] ?? 'Wanderers';
        $adjective = $completionRate >= 0.45 ? 'Relentless' : ($completionRate >= 0.2 ? 'Steady' : 'Roaming');

        return "{$adjective} {$noun}";
    }

    /**
     * genre_names arrives as a PHP array on Postgres (casted) or as a raw
     * `{A,"B (C)"}` string over some drivers — the pgArray lesson from the
     * games controller, applied here.
     *
     * @return string[]
     */
    private function genres(mixed $raw): array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (! is_string($raw) || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        // Postgres text[] literal: {Action,"Role-Playing (RPG)"}
        $trimmed = trim($raw, '{}');

        if ($trimmed === '') {
            return [];
        }

        return array_map(
            fn (string $part) => trim($part, ' "'),
            preg_split('/,(?=(?:[^"]*"[^"]*")*[^"]*$)/', $trimmed) ?: []
        );
    }
}
