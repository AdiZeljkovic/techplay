<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Guide;
use Illuminate\Support\Facades\DB;

/**
 * What a reader's own account adds to a public guide.
 *
 * §3.1 lists this as a strategic pillar: *"Public TechPlay guides become
 * account-aware: completed steps collapse; missing steps are highlighted."*
 *
 * The rule that governs every one of these, from §20.2: **the guide must read
 * correctly without any of it.** A page that is empty for a signed-out visitor
 * cannot rank, and ranking is the entire reason this family of pages exists. So
 * a personalisation is always an addition to prose that already stands — a
 * figure, a short list, a sentence — and never the page's substance.
 *
 * Each block is a small, named shape rather than free-form data, because the
 * frontend renders it and a guide editor picks it from a list. A key nothing
 * resolves returns null, and the page then draws what it would have drawn for
 * somebody signed out.
 */
class GuidePersonalisation
{
    public function __construct(private readonly SnapshotReader $reader, private readonly Advisor $advisor) {}

    /**
     * @return array<string, mixed>|null
     */
    public function for(string $key, int $gw2AccountId): ?array
    {
        $snapshot = $this->reader->for($gw2AccountId);

        if (! $snapshot) {
            return null;
        }

        return match ($key) {
            'agony' => $this->agony($snapshot),
            'ascended-set' => $this->ascended($snapshot),
            'masteries' => $this->masteries($snapshot),
            'vault' => $this->vault($snapshot),
            'raids' => $this->raids($snapshot),
            'next-steps' => $this->nextSteps($snapshot),
            /*
             * `guide:mounts/skyscale` — a guide showing progress through its
             * own curated achievement list.
             *
             * Prefixed rather than named one-by-one because there is one of
             * these per mount and there will be one per legendary, and a match
             * arm per page would put the page list in code. The key names the
             * guide; the guide names the achievements.
             */
            default => str_starts_with($key, 'guide:')
                ? $this->collection(substr($key, 6), $snapshot)
                : null,
        };
    }

    /** @return array<string, mixed>|null */
    private function agony(Snapshot $snapshot): ?array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return null;
        }

        return [
            'kind' => 'figure',
            'label' => 'Your Agony Resistance',
            'value' => $character->agonyResistance,
            'target' => CharacterView::TIER_4_AGONY,
            'shortfall' => $character->agonyShortfall(),
            'subject' => $character->name,
            'note' => $character->agonyShortfall() > 0
                ? "{$character->agonyShortfall()} short of the Tier 4 target, summed from the infusions {$character->name} is wearing."
                : "{$character->name} is at the Tier 4 target.",
        ];
    }

    /** @return array<string, mixed>|null */
    private function ascended(Snapshot $snapshot): ?array
    {
        $character = $snapshot->primaryCharacter();

        if (! $character) {
            return null;
        }

        $missing = $character->slotsBelowAscended();

        return [
            'kind' => 'checklist',
            'label' => "{$character->name}'s core slots",
            'done' => $character->ascendedSlots,
            'total' => $character->coreSlots,
            'items' => array_map(fn ($slot) => [
                'label' => $slot,
                'done' => false,
                'note' => $character->slotRarity[$slot] ?? null,
            ], $missing),
            'note' => $missing === []
                ? 'Every core slot is ascended already.'
                : count($missing).' of '.$character->coreSlots.' still to go.',
        ];
    }

    /** @return array<string, mixed>|null */
    private function masteries(Snapshot $snapshot): ?array
    {
        $rows = [];

        foreach ($snapshot->masteryRegions as $region) {
            if ($region->earned === 0) {
                continue;
            }

            $total = $snapshot->pointsTotalIn($region->region);

            $rows[] = [
                'label' => $region->region,
                'value' => $region->unspent(),
                'of' => $total,
                'spent' => $snapshot->pointsSpentIn($region->region),
                'affordable' => count($snapshot->affordableIn($region->region)),
            ];
        }

        return $rows === [] ? null : [
            'kind' => 'rows',
            'label' => 'Your mastery points',
            'rows' => $rows,
            'note' => $snapshot->unspentMasteryPoints().' unspent, and points cannot move between regions.',
        ];
    }

    /** @return array<string, mixed>|null */
    private function vault(Snapshot $snapshot): ?array
    {
        if (! $snapshot->vault) {
            return null;
        }

        return [
            'kind' => 'checklist',
            'label' => "Open in your Wizard's Vault",
            'done' => count($snapshot->vault->daily) + count($snapshot->vault->weekly) - count($snapshot->vault->open()),
            'total' => count($snapshot->vault->daily) + count($snapshot->vault->weekly),
            'items' => array_map(fn (VaultObjective $o) => [
                'label' => $o->title,
                'done' => false,
                'note' => "{$o->current} / {$o->target} · {$o->acclaim} acclaim",
            ], $snapshot->vault->open()),
            'note' => $snapshot->vault->unclaimedAcclaim() > 0
                ? $snapshot->vault->unclaimedAcclaim().' acclaim is earned and waiting to be claimed.'
                : null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function raids(Snapshot $snapshot): ?array
    {
        return [
            'kind' => 'figure',
            'label' => 'Cleared since the weekly reset',
            'value' => count($snapshot->raidsThisWeek),
            'target' => null,
            /*
             * The caveat is the content here. The game reports the current week
             * and nothing else, so a zero means "not yet this week" and never
             * "never" — and a guide that let a reader conclude otherwise would
             * be worse than one with no figure at all.
             */
            'note' => 'Guild Wars 2 reports only the current week, so this resets every Monday '
                .'regardless of what you have done before.',
        ];
    }

    /**
     * A guide's own achievement chain, with this account's progress on it.
     *
     * The division of labour here is the whole design, and it is forced rather
     * than chosen. **Which** achievements make up a mount, and **in what
     * order**, is not in the API: across the forty Skyscale achievements
     * exactly one has a `prerequisites` entry, and the collections sit in the
     * "War Eternal" category beside thirty-one unrelated things. So membership
     * and order are curated — a list on the guide row, editable by a person
     * who knows the game. §9.5 called this before anyone checked: *"The
     * acquisition path is content logic and must be maintained as TechPlay
     * curated data."*
     *
     * Everything inside a collection is ArenaNet's. The step text is theirs
     * verbatim, the tick against each step is the account's own record, and
     * neither is written by us. Which means a guide's editor maintains nine
     * ordered lists of ids, not nine hundred steps — and the steps stay right
     * through a patch that the prose would not survive.
     *
     * @return array<string, mixed>|null
     */
    private function collection(string $path, Snapshot $snapshot): ?array
    {
        [$family, $slug] = array_pad(explode('/', $path, 2), 2, null);

        $guide = $slug === null ? null : Gw2Guide::query()
            ->published()
            ->where('family', $family)
            ->where('slug', $slug)
            ->first(['title', 'achievement_ids']);

        $ids = array_values(array_filter(array_map('intval', (array) ($guide->achievement_ids ?? []))));

        if ($ids === []) {
            // Either no such guide or nobody has listed its achievements yet.
            // Both render as a page with no personalisation, which is what the
            // page was written to be.
            return null;
        }

        $progress = $this->achievementProgress($snapshot->accountId, $ids);

        $catalogue = DB::table('gw2_achievements')
            ->whereIn('id', $ids)
            ->get(['id', 'name', 'requirement', 'bits'])
            ->keyBy('id');

        $steps = new AchievementSteps($catalogue);
        $rows = [];
        $done = 0;

        // The curated order, not the catalogue's — that order is the part a
        // person contributed and sorting it away would throw it out.
        foreach ($ids as $id) {
            $meta = $catalogue[$id] ?? null;

            if (! $meta) {
                continue;
            }

            $mine = $progress[$id] ?? null;
            $complete = (bool) ($mine['done'] ?? false);
            $done += $complete ? 1 : 0;

            $remaining = array_values(array_filter(
                $steps->for($id, array_map('intval', (array) ($mine['bits'] ?? []))),
                fn (AchievementStep $step) => ! $step->done
            ));

            $rows[] = [
                'id' => $id,
                'name' => $meta->name,
                'requirement' => $meta->requirement,
                'done' => $complete,
                /*
                 * Null rather than zero where the account has no record of
                 * this achievement. It means "not started as far as the API
                 * shows", and an achievement can also be absent because it has
                 * not been unlocked yet — a zero would flatten those two into
                 * a claim we cannot make.
                 */
                'current' => $mine === null ? null : (int) ($mine['current'] ?? 0),
                'max' => $mine === null ? null : (int) ($mine['max'] ?? 0),
                'steps_remaining' => $complete ? [] : array_map(fn (AchievementStep $s) => [
                    'index' => $s->index,
                    'text' => $s->text,
                ], $remaining),
            ];
        }

        return $rows === [] ? null : [
            'kind' => 'collection',
            'label' => 'Your progress through this chain',
            'complete' => $done,
            'total' => count($rows),
            'items' => $rows,
            'note' => 'Step wording comes from the game itself. Which collections make up this '
                .'chain, and the order to do them in, is ours — the game does not publish it.',
        ];
    }

    /**
     * This account's record for a named set of achievements.
     *
     * @param  array<int, int>  $ids
     * @return array<int, array<string, mixed>>
     */
    private function achievementProgress(int $gw2AccountId, array $ids): array
    {
        $raw = DB::table('gw2_account_state')
            ->where('gw2_account_id', $gw2AccountId)
            ->value('achievements');

        $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
        $wanted = array_flip($ids);
        $rows = [];

        foreach ((array) $decoded as $row) {
            $id = (int) ($row['id'] ?? 0);

            if (isset($wanted[$id])) {
                $rows[$id] = $row;
            }
        }

        return $rows;
    }

    /** @return array<string, mixed>|null */
    private function nextSteps(Snapshot $snapshot): ?array
    {
        $advice = $this->advisor->advise($snapshot);

        return $advice['headline'] === [] ? null : [
            'kind' => 'recommendations',
            'label' => 'What we would do next on your account',
            'items' => array_map(fn ($r) => [
                'title' => $r['title'],
                'body' => $r['body'],
                'confidence' => $r['confidence'],
            ], $advice['headline']),
        ];
    }
}
