<?php

namespace App\Services;

use App\Models\Clan;
use App\Models\ClanActivity;
use App\Models\ClanBoost;
use App\Models\ClanBuilding;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Boosters: an officer trades treasury for a window of acceleration.
 * Definitions live in config/clan.php; this service only enforces the
 * rules — slots, cooldowns, cost — and answers "what is boosted right now".
 */
class ClanBoostService
{
    public function __construct(private ClanResourceService $resources) {}

    public function activate(Clan $clan, User $user, string $key): ClanBoost
    {
        $def = config("clan.boosters.{$key}");

        if (! $def) {
            throw new \RuntimeException('Unknown booster.');
        }

        $active = ClanBoost::where('clan_id', $clan->id)->where('ends_at', '>', now())->get();
        $slots = $this->slots($clan->id);

        if ($active->count() >= $slots) {
            throw new \RuntimeException($slots === 1
                ? 'One booster at a time — a Vault at level '.config('clan.boost_second_slot_vault', 6).' adds a second slot.'
                : 'Every booster slot is busy.');
        }

        if ($active->contains(fn (ClanBoost $b) => $b->key === $key)) {
            throw new \RuntimeException('This booster is already running.');
        }

        // Cooldown runs from when the last activation ENDED.
        $lastEnd = ClanBoost::where('clan_id', $clan->id)->where('key', $key)->max('ends_at');

        if ($lastEnd && now()->lt(Carbon::parse($lastEnd)->addHours((int) $def['cooldown_hours']))) {
            throw new \RuntimeException("{$def['name']} is still on cooldown.");
        }

        return DB::transaction(function () use ($clan, $user, $key, $def) {
            $this->resources->spend($clan, $def['cost']['resource'], (int) $def['cost']['amount'], "boost:{$key}", $user);

            $boost = ClanBoost::create([
                'clan_id' => $clan->id,
                'key' => $key,
                'starts_at' => now(),
                'ends_at' => now()->addHours((int) $def['duration_hours']),
                'activated_by' => $user->id,
            ]);

            ClanActivity::create([
                'clan_id' => $clan->id,
                'user_id' => $user->id,
                'type' => 'boost_activated',
                'title' => "{$user->username} activated {$def['name']}",
                'meta' => ['key' => $key, 'ends_at' => $boost->ends_at->toIso8601String()],
            ]);

            ClanBoost::forgetActive($clan->id);

            return $boost;
        });
    }

    /**
     * The earn multiplier for a reason, from whatever is running right now.
     * Stacking is deliberate multiplication — two overlapping boosts on the
     * same reason are rare and paid for twice.
     */
    public function earnMultiplier(int $clanId, string $reason): float
    {
        $multiplier = 1.0;

        foreach (ClanBoost::activeKeys($clanId) as $key) {
            $effect = config("clan.boosters.{$key}.effect");

            if (($effect['type'] ?? null) === 'earn_multiplier' && in_array($reason, $effect['reasons'] ?? [], true)) {
                $multiplier *= (float) $effect['multiplier'];
            }
        }

        return $multiplier;
    }

    /** How much one qualifying action pushes a mission bar right now. */
    public function missionIncrement(int $clanId): int
    {
        foreach (ClanBoost::activeKeys($clanId) as $key) {
            $effect = config("clan.boosters.{$key}.effect");

            if (($effect['type'] ?? null) === 'mission_multiplier') {
                return max(1, (int) $effect['multiplier']);
            }
        }

        return 1;
    }

    public function isFeatured(int $clanId): bool
    {
        return in_array('recruitment_signal', ClanBoost::activeKeys($clanId), true);
    }

    /** The panel: every booster with its state as this clan sees it. */
    public function panel(Clan $clan): array
    {
        $active = ClanBoost::where('clan_id', $clan->id)->where('ends_at', '>', now())->get()->keyBy('key');
        $slots = $this->slots($clan->id);

        $boosters = collect(config('clan.boosters'))->map(function (array $def, string $key) use ($clan, $active) {
            $running = $active->get($key);
            $lastEnd = ClanBoost::where('clan_id', $clan->id)->where('key', $key)->max('ends_at');
            $cooldownUntil = $lastEnd
                ? Carbon::parse($lastEnd)->addHours((int) $def['cooldown_hours'])
                : null;

            return [
                'key' => $key,
                'name' => $def['name'],
                'description' => $def['description'],
                'duration_hours' => (int) $def['duration_hours'],
                'cost' => $def['cost'],
                'active' => (bool) $running,
                'ends_at' => $running?->ends_at?->toIso8601String(),
                'on_cooldown' => ! $running && $cooldownUntil && now()->lt($cooldownUntil),
                'cooldown_until' => ! $running && $cooldownUntil && now()->lt($cooldownUntil)
                    ? $cooldownUntil->toIso8601String()
                    : null,
                'affordable' => (int) $clan->{$def['cost']['resource']} >= (int) $def['cost']['amount'],
            ];
        })->values()->all();

        return [
            'boosters' => $boosters,
            'slots' => $slots,
            'active_count' => $active->count(),
        ];
    }

    private function slots(int $clanId): int
    {
        $vault = (int) (ClanBuilding::levelsFor($clanId)['vault'] ?? 0);

        return $vault >= (int) config('clan.boost_second_slot_vault', 6) ? 2 : 1;
    }
}
