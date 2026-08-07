<?php

namespace App\Services\Chronicle;

use App\Models\Game;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Condenses everything the site knows about one gamer into their chronicle
 * row. Reads the tables that already exist — the chronicle is a summary,
 * never a second copy of the data.
 *
 * Every signal carries a base weight (docs/33) and decays with age:
 * weight × e^(−days/180), so a taste from two years ago still whispers but
 * this month's obsession shouts. Signals resolve to a game wherever
 * possible, and the game resolves to genres/platforms/tags/era through the
 * games base — which is why the catalogue cleanup had to come first.
 *
 * Negative signals (dropped games, low ratings) build their own map:
 * knowing what someone bounced off is as useful as knowing what they love.
 */
class ChronicleBuilder
{
    public const VERSION = 1;

    /** Below this many signals the profile is guesswork; surfaces fall back honestly. */
    public const MIN_SIGNALS = 5;

    private const DECAY_HALF_LIFE_DAYS = 180;

    /** status → base weight, straight from the plan table. */
    private const STATUS_WEIGHTS = [
        'completed' => 3.0,
        'playing' => 2.5,
        'backlog' => 1.5,
        'wishlist' => 1.0,
        'dropped' => -1.5,
    ];

    public function build(User $user): void
    {
        $signals = $this->collect($user);

        $taste = ['genres' => [], 'platforms' => [], 'eras' => [], 'tags' => []];
        $negative = ['genres' => []];
        $affinities = [];
        $lastSignalAt = null;

        $games = $this->gameFacts(array_unique(array_filter(array_column($signals, 'game_id'))));

        foreach ($signals as $signal) {
            $weight = $signal['weight'] * $this->decay($signal['at']);
            $lastSignalAt = max($lastSignalAt ?? $signal['at'], $signal['at']);

            $facts = $games[$signal['game_id']] ?? null;
            if (! $facts) {
                continue;
            }

            if ($weight >= 0) {
                $affinities[$signal['game_id']] = ($affinities[$signal['game_id']] ?? 0) + $weight;
            }

            foreach ($facts['genres'] as $genre) {
                if ($weight < 0) {
                    $negative['genres'][$genre] = ($negative['genres'][$genre] ?? 0) - $weight;
                } else {
                    $taste['genres'][$genre] = ($taste['genres'][$genre] ?? 0) + $weight;
                }
            }
            if ($weight > 0) {
                foreach ($facts['platforms'] as $platform) {
                    $taste['platforms'][$platform] = ($taste['platforms'][$platform] ?? 0) + $weight;
                }
                foreach ($facts['tags'] as $tag) {
                    $taste['tags'][$tag] = ($taste['tags'][$tag] ?? 0) + $weight;
                }
                if ($facts['era']) {
                    $taste['eras'][$facts['era']] = ($taste['eras'][$facts['era']] ?? 0) + $weight;
                }
            }
        }

        // Hand-declared playstyle tags join taste directly — the one signal
        // that needs no game to point through.
        foreach ((array) ($user->playstyle_tags ?? []) as $tag) {
            $taste['tags'][$tag] = ($taste['tags'][$tag] ?? 0) + 2.0;
        }

        DB::table('user_chronicles')->upsert([[
            'user_id' => $user->id,
            'taste' => json_encode(array_map($this->normalised(...), $taste)),
            'game_affinities' => json_encode($this->top($affinities, 50)),
            'negative' => json_encode(array_map($this->normalised(...), $negative)),
            'peer_ids' => json_encode($this->peers($user->id, $affinities)),
            'signals_count' => count($signals),
            'last_signal_at' => $lastSignalAt,
            'built_at' => now(),
            'version' => self::VERSION,
        ]], ['user_id'], ['taste', 'game_affinities', 'negative', 'peer_ids', 'signals_count', 'last_signal_at', 'built_at', 'version']);
    }

    /**
     * Every signal the existing tables hold, as [game_id, weight, at].
     *
     * @return array<int,array{game_id:?int,weight:float,at:string}>
     */
    private function collect(User $user): array
    {
        $signals = [];

        // ── the collection: status, favourite, and hours that don't lie ──
        foreach (DB::table('user_games')->where('user_id', $user->id)
            ->get(['game_id', 'status', 'is_favorite', 'hours_played', 'playtime_minutes', 'updated_at']) as $row) {
            $weight = self::STATUS_WEIGHTS[$row->status] ?? 0.5;
            $signals[] = ['game_id' => $row->game_id, 'weight' => $weight, 'at' => $row->updated_at];

            if ($row->is_favorite) {
                $signals[] = ['game_id' => $row->game_id, 'weight' => 4.0, 'at' => $row->updated_at];
            }

            $hours = max((float) $row->hours_played, ((int) $row->playtime_minutes) / 60);
            if ($hours >= 1) {
                // log-scaled so 300 hours does not drown everything else
                $signals[] = ['game_id' => $row->game_id, 'weight' => min(3.0, log10(1 + $hours) * 1.5), 'at' => $row->updated_at];
            }
        }

        // ── their own scores: the loudest signal either way ──────────────
        foreach (DB::table('game_ratings')->where('user_id', $user->id)->where('is_draft', false)
            ->get(['game_id', 'rating', 'review', 'updated_at']) as $row) {
            if (! $row->game_id) {
                continue;
            }
            // stars are 1–5: 4+ is love, 2 or less is a bounce
            $weight = $row->rating >= 4 ? 5.0 : ($row->rating <= 2 ? -3.0 : 1.0);
            $signals[] = ['game_id' => $row->game_id, 'weight' => $weight, 'at' => $row->updated_at];

            if (filled($row->review)) {
                $signals[] = ['game_id' => $row->game_id, 'weight' => 3.0, 'at' => $row->updated_at];
            }
        }

        // ── time actually spent playing (journal) ────────────────────────
        foreach (DB::table('play_sessions')->where('user_id', $user->id)
            ->selectRaw('game_id, sum(minutes) as minutes, max(created_at) as at')
            ->groupBy('game_id')->get() as $row) {
            $signals[] = [
                'game_id' => $row->game_id,
                'weight' => min(3.0, log10(1 + ($row->minutes / 60)) * 1.5),
                'at' => $row->at,
            ];
        }

        // ── reading about games, through the content spine ───────────────
        foreach (DB::table('article_reads')
            ->join('articles', 'articles.id', '=', 'article_reads.article_id')
            ->where('article_reads.user_id', $user->id)
            ->where('article_reads.progress', '>=', 50)
            ->whereNotNull('articles.game_id')
            ->get(['articles.game_id', 'article_reads.last_read_at']) as $row) {
            $signals[] = ['game_id' => $row->game_id, 'weight' => 1.5, 'at' => $row->last_read_at];
        }

        foreach (DB::table('article_bookmarks')
            ->join('articles', 'articles.id', '=', 'article_bookmarks.article_id')
            ->where('article_bookmarks.user_id', $user->id)
            ->whereNotNull('articles.game_id')
            ->get(['articles.game_id', 'article_bookmarks.created_at']) as $row) {
            $signals[] = ['game_id' => $row->game_id, 'weight' => 3.0, 'at' => $row->created_at];
        }

        // ── achievements actually earned on Steam, per game ──────────────
        foreach (DB::table('steam_achievements')->where('user_id', $user->id)
            ->where('achieved', true)->whereNotNull('game_id')
            ->selectRaw('game_id, count(*) as tally, max(achieved_at) as at')
            ->groupBy('game_id')->get() as $row) {
            $signals[] = [
                'game_id' => $row->game_id,
                'weight' => min(2.0, 0.8 + $row->tally * 0.05),
                'at' => $row->at ?? now(),
            ];
        }

        // ── the evaporating signals phase 2 writes ───────────────────────
        foreach (DB::table('player_signals')->where('user_id', $user->id)
            ->get(['game_id', 'weight', 'day']) as $row) {
            $signals[] = ['game_id' => $row->game_id, 'weight' => (float) $row->weight, 'at' => $row->day];
        }

        return $signals;
    }

    /** genres/platforms/tags/era per game, one query, straight from our base. */
    private function gameFacts(array $gameIds): array
    {
        if ($gameIds === []) {
            return [];
        }

        return Game::whereIn('id', $gameIds)
            ->get(['id', 'genres', 'platforms', 'tags', 'released'])
            ->mapWithKeys(fn (Game $g) => [$g->id => [
                'genres' => (array) ($g->genres ?? []),
                'platforms' => (array) ($g->platforms ?? []),
                'tags' => array_slice((array) ($g->tags ?? []), 0, 8),
                'era' => $g->released ? (intdiv($g->released->year, 10) * 10).'s' : null,
            ]])
            ->all();
    }

    private function decay(mixed $at): float
    {
        $days = max(0, now()->diffInDays(Carbon::parse($at), true));

        return exp(-$days * M_LN2 / self::DECAY_HALF_LIFE_DAYS);
    }

    /** Weights scaled to 0..1 so surfaces compare apples to apples. */
    private function normalised(array $weights): array
    {
        arsort($weights);
        $max = (float) (reset($weights) ?: 0);
        if ($max <= 0) {
            return [];
        }

        return array_map(fn ($w) => round($w / $max, 3), array_slice($weights, 0, 30, true));
    }

    private function top(array $weights, int $count): array
    {
        arsort($weights);

        return array_map(fn ($w) => round($w, 2), array_slice($weights, 0, $count, true));
    }

    /**
     * The 20 most similar chronicles, by cosine over game affinities.
     * Fine as a loop at today's population; revisit past a few thousand
     * users (precomputed neighbours, same column).
     */
    private function peers(int $userId, array $affinities): array
    {
        if ($affinities === []) {
            return [];
        }

        $scores = [];
        foreach (DB::table('user_chronicles')->where('user_id', '!=', $userId)
            ->whereNotNull('game_affinities')
            ->get(['user_id', 'game_affinities']) as $other) {
            $theirs = json_decode($other->game_affinities, true) ?: [];
            $dot = 0.0;
            foreach ($affinities as $gameId => $w) {
                $dot += $w * ($theirs[$gameId] ?? 0);
            }
            if ($dot > 0) {
                $scores[$other->user_id] = $dot;
            }
        }
        arsort($scores);

        return array_slice(array_keys($scores), 0, 20);
    }
}
