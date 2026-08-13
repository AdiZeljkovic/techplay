<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\SteamAchievement;
use App\Models\TrophyCaseSlot;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Turns trophy case slots into things a page can draw.
 *
 * A slot stores a source and a key; everything a reader sees — the name, the
 * icon, the date, which game it came from — lives in whichever table that
 * source owns. Resolving happens here, in one query per source rather than one
 * per slot, so a full case costs two queries no matter how it is arranged.
 */
class TrophyCaseService
{
    /**
     * The case, in shelf order, with anything unresolvable dropped.
     *
     * A slot can outlive what it points at: an achievement retired from the
     * catalogue, a Steam row cleared by a re-sync. Rather than draw a hole, the
     * slot is skipped — and the caller sees a shorter case, which is true.
     */
    public function forUser(User $user): array
    {
        $slots = TrophyCaseSlot::where('user_id', $user->id)
            ->orderBy('position')
            ->get();

        if ($slots->isEmpty()) {
            return [];
        }

        $ours = $this->resolveTechPlay($user, $slots->where('source', 'techplay')->pluck('reference'));
        $steam = $this->resolveSteam($user, $slots->where('source', 'steam')->pluck('reference'));

        return $slots
            ->map(function (TrophyCaseSlot $slot) use ($ours, $steam) {
                $resolved = $slot->source === 'steam'
                    ? $steam->get($slot->reference)
                    : $ours->get($slot->reference);

                return $resolved ? ['position' => $slot->position] + $resolved : null;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * What this reader is allowed to put on a shelf: everything they have
     * actually unlocked, from every source, in one list the picker can show.
     */
    public function available(User $user): array
    {
        $ours = $this->resolveTechPlay($user, null)->values();
        $steam = $this->resolveSteam($user, null)->values();

        return $ours->concat($steam)
            ->sortByDesc('unlocked_at')
            ->values()
            ->all();
    }

    /**
     * Replace the whole case in one call.
     *
     * Arranging a shelf is one action even when it moves five things, so the
     * page sends the finished arrangement rather than a stream of edits — no
     * intermediate state where two achievements hold the same position and the
     * unique index rejects the write.
     *
     * @param  array<int, array{source:string, reference:int}>  $picks
     */
    public function replace(User $user, array $picks): array
    {
        $picks = array_slice($picks, 0, TrophyCaseSlot::CAPACITY);

        // You may only shelve what you own. Checked against the same resolver
        // the page reads from, so there is one definition of "unlocked".
        $ownedKeys = collect($this->available($user))
            ->map(fn (array $item) => $item['source'].':'.$item['reference'])
            ->flip();

        TrophyCaseSlot::where('user_id', $user->id)->delete();

        $position = 0;
        $seen = [];

        foreach ($picks as $pick) {
            $key = ($pick['source'] ?? '').':'.($pick['reference'] ?? '');

            if (! $ownedKeys->has($key) || isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;

            TrophyCaseSlot::create([
                'user_id' => $user->id,
                'source' => $pick['source'],
                'reference' => (int) $pick['reference'],
                'position' => $position++,
            ]);
        }

        return $this->forUser($user);
    }

    /* ── resolvers ────────────────────────────────────────────────────── */

    /** @param  Collection<int, int>|null  $ids  null = everything unlocked */
    private function resolveTechPlay(User $user, ?Collection $ids): Collection
    {
        $unlocked = $user->achievements()
            ->when($ids !== null, fn ($q) => $q->whereIn('achievements.id', $ids->all()))
            ->get();

        return $unlocked->mapWithKeys(fn (Achievement $a) => [$a->id => [
            'source' => 'techplay',
            'reference' => $a->id,
            'name' => $a->name,
            'description' => $a->description,
            'icon' => $a->versionedIconPath(),
            'points' => (int) $a->points,
            'game' => null,
            'unlocked_at' => $a->pivot->unlocked_at,
        ]]);
    }

    /** @param  Collection<int, int>|null  $ids */
    private function resolveSteam(User $user, ?Collection $ids): Collection
    {
        $rows = SteamAchievement::where('user_id', $user->id)
            ->where('achieved', true)
            ->when($ids !== null, fn ($q) => $q->whereIn('id', $ids->all()))
            ->with('game:id,name,slug')
            ->get(['id', 'game_id', 'display_name', 'description', 'icon_url', 'achieved_at']);

        return $rows->mapWithKeys(fn (SteamAchievement $s) => [$s->id => [
            'source' => 'steam',
            'reference' => $s->id,
            'name' => $s->display_name,
            'description' => $s->description,
            'icon' => $s->icon_url,
            // Steam achievements carry no score of their own, and inventing one
            // would put them on a ladder they were never measured against.
            'points' => null,
            'game' => $s->game ? ['name' => $s->game->name, 'slug' => $s->game->slug] : null,
            'unlocked_at' => $s->achieved_at?->toIso8601String(),
        ]]);
    }
}
