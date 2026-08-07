<?php

namespace App\Services\Chronicle;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The one reader of the chronicle. Every surface that recommends anything
 * asks here — never the chronicle table directly, and never its own
 * private notion of taste. One brain, one answer.
 *
 * Reads are one cached row; if a user has no chronicle yet (new account,
 * fresh deploy) it is built on the spot — the builder is cheap for one
 * user and the alternative is a surface guessing.
 */
class TasteProfileService
{
    public function __construct(private ChronicleBuilder $builder) {}

    /** @var array<int,object|null> per-request memo */
    private array $rows = [];

    /**
     * Whether we honestly know this user well enough to personalise.
     * Below the threshold every surface must fall back to popularity and
     * say so — a guess dressed as a recommendation erodes trust.
     */
    public function isPersonalisable(User $user): bool
    {
        return ($this->row($user)?->signals_count ?? 0) >= ChronicleBuilder::MIN_SIGNALS;
    }

    /** Genre → 0..1 weight, strongest first. */
    public function genreWeights(User $user): array
    {
        return $this->taste($user)['genres'] ?? [];
    }

    /** @return string[] the genres that define this player */
    public function topGenres(User $user, int $count = 6): array
    {
        return array_slice(array_keys($this->genreWeights($user)), 0, $count);
    }

    public function platformWeights(User $user): array
    {
        return $this->taste($user)['platforms'] ?? [];
    }

    /** Genres the user demonstrably bounced off — a penalty, not a ban. */
    public function negativeGenres(User $user): array
    {
        $row = $this->row($user);

        return $row ? (json_decode($row->negative, true)['genres'] ?? []) : [];
    }

    /** game_id → affinity, the games currently occupying this player. */
    public function gameAffinities(User $user): array
    {
        $row = $this->row($user);

        return $row ? (json_decode($row->game_affinities, true) ?: []) : [];
    }

    /** @return int[] ids of the users whose chronicles look most like this one */
    public function peerIds(User $user): array
    {
        $row = $this->row($user);

        return $row ? (json_decode($row->peer_ids, true) ?: []) : [];
    }

    /**
     * The centre of the player's favourite era, from the chronicle's decade
     * buckets — "2010s" weighted 0.8 counts as 2015 at 0.8.
     */
    public function avgYear(User $user): ?int
    {
        $eras = $this->taste($user)['eras'] ?? [];
        if ($eras === []) {
            return null;
        }

        $sum = 0.0;
        $weightSum = 0.0;
        foreach ($eras as $era => $weight) {
            $decade = (int) rtrim((string) $era, 's');
            $sum += ($decade + 5) * $weight;
            $weightSum += $weight;
        }

        return $weightSum > 0 ? (int) round($sum / $weightSum) : null;
    }

    /** Marks the chronicle stale-enough-to-rebuild on next read. */
    public function forget(User $user): void
    {
        unset($this->rows[$user->id]);
        Cache::forget("chronicle.row.{$user->id}");
    }

    private function taste(User $user): array
    {
        $row = $this->row($user);

        return $row ? (json_decode($row->taste, true) ?: []) : [];
    }

    private function row(User $user): ?object
    {
        if (array_key_exists($user->id, $this->rows)) {
            return $this->rows[$user->id];
        }

        return $this->rows[$user->id] = Cache::remember("chronicle.row.{$user->id}", 600, function () use ($user) {
            $row = DB::table('user_chronicles')->where('user_id', $user->id)->first();

            if (! $row || $row->version < ChronicleBuilder::VERSION) {
                $this->builder->build($user);
                $row = DB::table('user_chronicles')->where('user_id', $user->id)->first();
            }

            return $row;
        });
    }
}
