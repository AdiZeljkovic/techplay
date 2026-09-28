<?php

namespace Database\Seeders;

use App\Models\Gw2Goal;
use App\Models\Gw2Source;
use Illuminate\Database\Seeder;

/**
 * The goals a player can pick, and the sources the rules stand on.
 *
 * §9 of the working document names five goal engines. Five of them are here.
 * Mounts joined once a producer existed that could serve the goal — §9.5 splits
 * that engine in two, and the observable half (which mount types the account
 * lacks) is mechanical while the acquisition route is curated content in the
 * `mounts` guide family.
 *
 * That restraint is the point. A goal exists when rules advance it; adding the
 * row first would put a choice in front of a player that the engine ignores,
 * which is the failure this whole piece of work is fixing.
 */
class Gw2GoalSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->sources() as $source) {
            Gw2Source::firstOrCreate(['url' => $source['url']], $source);
        }

        foreach ($this->goals() as $goal) {
            $existing = Gw2Goal::firstWhere('slug', $goal['slug']);

            // Same contract as the rules: the seed owns a row until a person
            // edits it. Here that means the title and summary are ours to
            // correct until the desk rewrites them.
            $existing ? $existing->update($goal) : Gw2Goal::create($goal);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function goals(): array
    {
        return [
            [
                'slug' => 'what-next',
                'title' => 'Just tell me what to do',
                'summary' => 'No particular target — surface whatever is most useful right now.',
                'domain' => null,
                'icon' => 'compass',
                'sort_order' => 10,
            ],
            [
                'slug' => 'first-ascended-set',
                'title' => 'Finish an ascended set',
                'summary' => 'Close the gear slots that are still below ascended, and what they need.',
                'domain' => 'gear',
                'icon' => 'shield',
                'sort_order' => 20,
            ],
            [
                'slug' => 'fractals',
                'title' => 'Get further in fractals',
                'summary' => 'Agony Resistance, the gear it sockets into, and your personal level.',
                'domain' => 'fractals',
                'icon' => 'layers',
                'sort_order' => 30,
            ],
            [
                'slug' => 'masteries',
                'title' => 'Spend my mastery points',
                'summary' => 'Which tier your region-locked points actually reach, cheapest first.',
                'domain' => 'masteries',
                'icon' => 'sparkles',
                'sort_order' => 40,
            ],
            [
                'slug' => 'mounts',
                'title' => 'Unlock the mounts I am missing',
                'summary' => 'Which mount types your account does not have, and where the write-up is.',
                'domain' => 'mounts',
                'icon' => 'rabbit',
                'sort_order' => 45,
            ],
            [
                'slug' => 'raid-entry',
                'title' => 'Start raiding',
                'summary' => 'The equipment baseline, and what you have cleared so far. Never a readiness score.',
                'domain' => 'raids',
                'icon' => 'swords',
                'sort_order' => 50,
            ],
        ];
    }

    /**
     * The sources the seeded rules cite.
     *
     * Short on purpose. Most of what this advisor claims was measured against
     * the live API rather than read anywhere, and `measured` is a legitimate
     * kind of source — arguably the strongest one here, since it is the only
     * kind we can re-run.
     *
     * @return array<int, array<string, mixed>>
     */
    private function sources(): array
    {
        return [
            [
                'label' => 'Measured against the live API, 27–28 September 2026',
                'url' => 'internal://measured/2026-09-28',
                'kind' => 'measured',
                'checked_at' => now(),
                'notes' => 'Rate limit, the nineteen-request account read, the zero-based mastery level, '
                    .'the region name mismatch and the access field. All re-runnable against a connected account.',
            ],
            [
                'label' => 'GW2 Wiki — API:2/account/raids',
                'url' => 'https://wiki.guildwars2.com/wiki/API:2/account/raids',
                'kind' => 'wiki',
                'notes' => 'The weekly-reset limitation that makes our own snapshots the only history.',
            ],
            [
                'label' => 'GW2 Wiki — API:2/masteries',
                'url' => 'https://wiki.guildwars2.com/wiki/API:2/masteries',
                'kind' => 'wiki',
                'notes' => 'Tier point_cost, which is what makes a real mastery percentage possible.',
            ],
            [
                'label' => 'TechPlay editorial — effort and time estimates',
                'url' => 'internal://editorial/effort-bands',
                'kind' => 'editorial',
                'checked_at' => now(),
                'notes' => 'The game reports the duration of nothing. Every minute range in gw2_rules is ours.',
            ],
        ];
    }
}
