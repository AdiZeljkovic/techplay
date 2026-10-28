<?php

namespace App\Services\Gw2\Advisor;

use App\Models\Gw2Guide;
use App\Services\Gw2\Wiki;
use Illuminate\Support\Facades\DB;

/**
 * The fractals page: where the account stands, today's fractals, and what is
 * still between the player and Tier 4.
 *
 * The mockup's menu has the page; mockup 1 draws its figures on the dashboard
 * — "Fractal Level 37, Tier 4" and "Agony Resistance 61/100" — and both are
 * wrong there (REDIZAJN.md §4). Level 37 is Tier 2, and the target is 150.
 *
 * What is measured: the personal fractal level `/v2/account` reports, Agony
 * Resistance summed from the infusions each character wears, the Fractal
 * Attunement mastery, the three fractal currencies, today's fractals from the
 * game's daily list, and the Fractals of the Mists achievement group.
 *
 * What is not here, on purpose: the recommended Agony Resistance for each
 * scale. The game shows it in the fractal UI, the API does not have it, and a
 * table from memory would be the tool's first invented figure (see
 * CharacterView::TIER_4_AGONY). A tier is named from the level, which is
 * arithmetic the game publishes: 25 scales a tier.
 */
class Fractals
{
    private const CURRENCIES = ['Fractal Relic', 'Pristine Fractal Relic', 'Unstable Fractal Essence'];

    private const ATTUNEMENT = 'Fractal Attunement';

    /** @return array<string, mixed> */
    public function for(Snapshot $snapshot, ?string $characterName = null): array
    {
        $chosen = null;

        foreach ($snapshot->characters as $character) {
            if ($character->name === $characterName) {
                $chosen = $character;
            }
        }

        $chosen ??= $snapshot->primaryCharacter();
        $achievements = app(Achievements::class);
        $inGroup = array_fill_keys($achievements->idsInGroup(Achievements::FRACTALS), true);

        return [
            'personal_level' => $snapshot->fractalLevel,
            'tier' => self::tier($snapshot->fractalLevel),
            'character' => $chosen ? $this->character($chosen) : null,
            'characters' => $this->characters($snapshot),
            'agony_target' => CharacterView::TIER_4_AGONY,
            'attunement' => $this->attunement($snapshot),
            'wallet' => $this->wallet($snapshot),
            'today' => app(DailyFractals::class)->read(),
            'achievements' => $achievements->group($snapshot->accountId, Achievements::FRACTALS),
            'closest' => array_map(
                [Achievements::class, 'win'],
                array_slice(array_values(array_filter($snapshot->nearlyDone, fn (EasyWin $w) => isset($inGroup[$w->id]))), 0, 6)
            ),
            'guides' => Gw2Guide::listedIn('fractals'),
            'observed_at' => $snapshot->observedAt,
        ];
    }

    /**
     * Scales 1–25 are Tier 1, 26–50 Tier 2, 51–75 Tier 3, 76–100 Tier 4.
     * Null before the first fractal.
     */
    public static function tier(?int $level): ?int
    {
        return $level !== null && $level > 0 ? min(4, intdiv($level - 1, 25) + 1) : null;
    }

    /** @return array<string, mixed> */
    private function character(CharacterView $character): array
    {
        return [
            'name' => $character->name,
            'profession' => $character->profession,
            'level' => $character->level,
            'agony_resistance' => $character->agonyResistance,
            'shortfall' => $character->agonyShortfall(),
            // Infusions only go into ascended and legendary slots, so this is
            // the ceiling on how far the number above can climb today.
            'ascended_core' => $character->ascendedSlots,
            'core_slots' => $character->coreSlots,
        ];
    }

    /**
     * Every level 80, most Agony Resistance first. Below 80 there is nothing
     * to infuse.
     *
     * @return array<int, array<string, mixed>>
     */
    private function characters(Snapshot $snapshot): array
    {
        $eighty = array_values(array_filter($snapshot->characters, fn (CharacterView $c) => $c->level >= 80));

        usort($eighty, fn (CharacterView $a, CharacterView $b) => [$b->agonyResistance, $b->ascendedSlots, $a->name] <=> [$a->agonyResistance, $a->ascendedSlots, $b->name]);

        return array_map(fn (CharacterView $c) => $this->character($c), $eighty);
    }

    /**
     * The fractal mastery, tier by tier, with what the next one does in the
     * game's own words.
     *
     * @return array<string, mixed>|null
     */
    private function attunement(Snapshot $snapshot): ?array
    {
        $track = null;

        foreach ($snapshot->masteryTracks as $candidate) {
            if ($candidate->name === self::ATTUNEMENT) {
                $track = $candidate;
            }
        }

        if (! $track) {
            return null;
        }

        $levels = json_decode((string) DB::table('gw2_masteries')->where('id', $track->id)->value('levels'), true) ?: [];
        $region = $track->region !== null ? ($snapshot->masteryRegions[$track->region] ?? null) : null;

        return [
            'name' => $track->name,
            'region' => $track->region,
            'paid' => $track->tiersPaid,
            'total' => $track->tiers(),
            'unspent' => $region?->unspent(),
            'tiers' => array_map(fn (int $i) => [
                'name' => $track->tierNames[$i] ?? null,
                'icon' => $track->tierIcons[$i] ?? null,
                'cost' => $track->tierCosts[$i],
                'paid' => $i < $track->tiersPaid,
                'description' => ($levels[$i]['description'] ?? '') ?: null,
            ], array_keys($track->tierCosts)),
            'wiki' => Wiki::named($track->name),
        ];
    }

    /**
     * The three fractal currencies. Null when the key cannot see the wallet,
     * which is not the same as holding none.
     *
     * @return array<int, array<string, mixed>>|null
     */
    private function wallet(Snapshot $snapshot): ?array
    {
        $read = DB::table('gw2_account_state')->where('gw2_account_id', $snapshot->accountId)->value('wallet');

        if ($read === null) {
            return null;
        }

        return DB::table('gw2_reference')
            ->where('kind', 'currencies')
            ->whereIn('name', self::CURRENCIES)
            ->get(['ref_id', 'name', 'payload'])
            ->sortBy(fn ($c) => array_search($c->name, self::CURRENCIES, true))
            ->map(fn ($c) => [
                'id' => (int) $c->ref_id,
                'name' => $c->name,
                'icon' => json_decode((string) $c->payload, true)['icon'] ?? null,
                'amount' => $snapshot->currency((int) $c->ref_id),
                'wiki' => Wiki::named($c->name),
            ])
            ->values()
            ->all();
    }
}
