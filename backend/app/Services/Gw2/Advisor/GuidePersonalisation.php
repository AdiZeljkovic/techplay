<?php

namespace App\Services\Gw2\Advisor;

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
            // A guide naming a key nothing resolves renders as though it had
            // none. That is the right failure and not one to invite.
            default => null,
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
