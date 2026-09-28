<?php

namespace App\Services\Gw2\Advisor;

/**
 * The two names Guild Wars 2 uses for the same region.
 *
 * `/v2/masteries` labels a track `Maguuma`. `/v2/account/mastery/points` labels
 * the same region `Heart of Thorns`. Nothing in either response connects them,
 * and joining on the string gets you nothing at all.
 *
 * ── How this map was established, since it matters ──────────────────────
 *
 * Not from memory and not from the wiki. Derived on 28 September 2026 by
 * arithmetic against a live account, and it reconciles exactly:
 *
 *   Maguuma   trained tiers cost 24 points   ·  account reports Heart of Thorns  24
 *   Tyria                             11     ·  Central Tyria                    11
 *   Desert                             8     ·  Path of Fire                      8
 *   Tundra                             1     ·  Icebrood Saga                     1
 *
 * Getting that to reconcile also settled something else that no documentation
 * states: see LEVEL_IS_ZERO_BASED below.
 *
 * The three remaining pairs are named from their own track lists, which leave no
 * room for doubt — Jade holds Skiff Piloting, Turtle Mount, Fishing, Arborstone
 * and Jade Bots; Sky holds Astral Ward, Heart of the Obscure and Inner Nayos;
 * Wild holds Homesteading, Lowland Kodan, Warclaw and Mursaat Shadowcraft.
 *
 * `Gw2MasteryArithmeticTest` re-checks the reconciliation, so a renamed region or
 * a changed level meaning fails a test rather than quietly halving somebody's
 * progress bar.
 */
class MasteryRegions
{
    /**
     * Catalogue region => the name the account endpoint uses.
     *
     * `Magic` is deliberately absent. Its tracks are Castoran Survivalist, Wild
     * Castoran Magic, Skimmer Adaptation and Rift Amplification, and no region in
     * `/v2/account/mastery/points` corresponds to it — the endpoint returned
     * seven regions and none of them fits. Guessing a name would put points
     * against the wrong expansion, so its tracks are reported on their own and
     * excluded from any per-region percentage until the pairing is confirmed.
     */
    private const TO_ACCOUNT = [
        'Tyria' => 'Central Tyria',
        'Maguuma' => 'Heart of Thorns',
        'Desert' => 'Path of Fire',
        'Tundra' => 'Icebrood Saga',
        'Jade' => 'End of Dragons',
        'Sky' => 'Secrets of the Obscure',
        'Wild' => 'Janthir Wilds',
    ];

    /**
     * `level` counts from zero, so the account has completed `level + 1` tiers.
     *
     * Nothing in the API says this and the field name argues the other way. It
     * was settled by arithmetic: reading `level` as the number of completed tiers
     * gave 10, 6, 3 and 0 spent points against four regions the account itself
     * reported as 24, 11, 8 and 1. Reading it as a zero-based index of the
     * highest completed tier gives 24, 11, 8 and 1 — four independent totals,
     * all exact.
     *
     * The practical consequence: a track present in the response with `level: 0`
     * has its first tier paid for, not none. A track with nothing paid for is
     * absent from the response entirely.
     */
    public const LEVEL_IS_ZERO_BASED = true;

    public static function toAccountName(?string $catalogueRegion): ?string
    {
        return self::TO_ACCOUNT[$catalogueRegion] ?? null;
    }

    /** @return array<int, string> */
    public static function catalogueNames(): array
    {
        return array_keys(self::TO_ACCOUNT);
    }

    /** Tiers the account has paid for in a track, from what the API reports. */
    public static function tiersPaid(int $reportedLevel): int
    {
        return $reportedLevel + 1;
    }
}
