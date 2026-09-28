<?php

namespace Database\Seeders;

use App\Models\Gw2Rule;
use App\Services\Gw2\Advisor\Producers\AgonyGap;
use App\Services\Gw2\Advisor\Producers\GearGaps;
use App\Services\Gw2\Advisor\Producers\MasteryTierToBuy;
use App\Services\Gw2\Advisor\Producers\NearlyDoneAchievements;
use App\Services\Gw2\Advisor\Producers\UnclaimedAcclaim;
use App\Services\Gw2\Advisor\Producers\UnspentMasteryPoints;
use App\Services\Gw2\Advisor\Producers\VaultObjectives;
use Illuminate\Database\Seeder;

/**
 * The advisor's opening vocabulary.
 *
 * Ten rules, and every threshold in them was read off a real account rather than
 * chosen because it looked round. Where a number could not be sourced it is not
 * here: there is no rule about fractal tiers below Tier 4, because the per-scale
 * Agony Resistance requirements are not in the API and typing them from memory
 * would put the tool's first invented figure in front of a reader.
 *
 * Idempotent by `key`. Editors are expected to change wording, thresholds and
 * weights in the admin panel, and a re-seed must not undo that, so only rows that
 * are absent are written.
 */
class Gw2RuleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->rules() as $rule) {
            $existing = Gw2Rule::firstWhere('key', $rule['key']);

            /*
             * The seed owns a rule until a person has read it.
             *
             * `firstOrCreate` alone left the defaults frozen at whatever they
             * were on the day they first ran, so a threshold corrected in this
             * file never reached a database that already had the row — which is
             * the same stale-list failure the export and the deletion routine
             * have each had. Setting `reviewed_at` is how an editor says the row
             * is theirs now, and from then on this leaves it alone.
             */
            if ($existing && $existing->reviewed_at === null) {
                $existing->update($rule);

                continue;
            }

            if (! $existing) {
                Gw2Rule::create($rule);
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rules(): array
    {
        return [
            /*
             * Confirmed, and top of the list on purpose.
             *
             * Work already finished and not collected. `claimed` and `done` are
             * separate fields, so there is no inference here at all — and it
             * expires at the next vault reset, which makes it the one piece of
             * advice whose cost of being ignored is certain.
             */
            [
                'key' => 'vault-unclaimed-acclaim',
                'producer' => UnclaimedAcclaim::KEY,
                'domain' => 'vault',
                'title' => 'Collect {acclaim} Astral Acclaim you have already earned',
                'body' => 'You have finished {count} Wizard\'s Vault {objective} without claiming the reward — starting with "{first}". It costs nothing but opening the vault, and it is lost at the next reset.',
                'requires' => [['path' => 'vault.unclaimed_acclaim', 'op' => '>', 'value' => 0]],
                'base_score' => 95,
                'weights' => ['acclaim' => 0.05],
                'confidence' => 'confirmed',
                'effort_band' => 'quick',
            ],

            /*
             * Also confirmed: the API states the title, the target and the
             * progress. Nothing to estimate.
             */
            [
                'key' => 'vault-open-objective',
                'producer' => VaultObjectives::KEY,
                'domain' => 'vault',
                'title' => '{title}',
                'body' => 'A {period} Wizard\'s Vault objective worth {acclaim} Astral Acclaim. You are at {current} of {target}.',
                'requires' => [['path' => 'vault.open_objectives', 'op' => '>', 'value' => 0]],
                'base_score' => 70,
                'weights' => ['acclaim' => 0.1],
                'confidence' => 'confirmed',
                'effort_band' => 'quick',
            ],

            /*
             * One step from done. Eight of these on the test account.
             *
             * `high` rather than `confirmed` because the progress is certain but
             * the reachability is not — the producer attaches an explicit blocker
             * for anything we have not reviewed, since a good few achievements
             * are seasonal or retired.
             */
            [
                'key' => 'achievement-one-step-away',
                'producer' => NearlyDoneAchievements::KEY,
                'domain' => 'achievements',
                'title' => 'Finish {name} — {remaining} {step} left',
                'body' => 'You are at {current} of {max}. {requirement}',
                'requires' => [['path' => 'achievements.one_step_away', 'op' => '>', 'value' => 0]],
                'base_score' => 72,
                'weights' => ['remaining' => -6.0],
                'confidence' => 'high',
                'effort_band' => 'quick',
            ],

            /*
             * Past 80% but not one step away. Same producer, lower confidence and
             * a lower base — which is the whole reason producers hold no policy.
             */
            [
                'key' => 'achievement-nearly-done',
                'producer' => NearlyDoneAchievements::KEY,
                'domain' => 'achievements',
                'title' => 'Close on {name}',
                'body' => '{current} of {max} done, so {remaining} to go. {requirement}',
                'requires' => [['path' => 'achievements.nearly_done', 'op' => '>=', 'value' => 3]],
                'base_score' => 50,
                'weights' => ['remaining' => -2.0],
                'confidence' => 'medium',
                'effort_band' => 'session',
            ],

            /*
             * The tier the points actually buy.
             *
             * Ranked above the plain unspent-points rule and pushing the same
             * goal, so for a region where something is affordable this one wins
             * and the other becomes the fallback. "You have 16 points" is a
             * fact; "Gliding's next tier costs 2 of them" is a next step.
             */
            [
                'key' => 'mastery-tier-affordable',
                'producer' => MasteryTierToBuy::KEY,
                'domain' => 'masteries',
                'title' => '{tier} on {track} costs {cost} {point}',
                'body' => 'You have {unspent} unspent {region} points, so this leaves {left_over}. It is tier {tiers_paid} of {tiers} on that track, and it needs the track filled with experience as well as the points.',
                'requires' => [['path' => 'mastery.affordable_tiers', 'op' => '>=', 'value' => 1]],
                'base_score' => 78,
                'weights' => ['cost' => -1.5],
                'confidence' => 'high',
                'effort_band' => 'quick',
            ],

            /*
             * Per region, never an account total: points do not move between
             * regions, so "35 unspent" is true and unactionable.
             */
            [
                'key' => 'mastery-unspent-points',
                'producer' => UnspentMasteryPoints::KEY,
                'domain' => 'masteries',
                'title' => 'Spend {unspent} {region} mastery {point}',
                'body' => 'You have earned {earned} mastery points in {region} and spent {spent}. Points are region-locked, so these {unspent} can only go into {region} tracks.',
                /*
                 * The fallback, not the headline. When a tier is affordable the
                 * rule above names it, which is better advice; this one is what
                 * is left to say when the points cannot reach anything yet.
                 */
                'requires' => [
                    ['path' => 'mastery.unspent_total', 'op' => '>=', 'value' => 2],
                    ['path' => 'mastery.affordable_tiers', 'op' => '==', 'value' => 0],
                ],
                'base_score' => 66,
                'weights' => ['unspent' => 1.2],
                'confidence' => 'high',
                'effort_band' => 'quick',
            ],

            /*
             * Gear, one slot at a time. `medium` because the gap is certain but
             * what to do about it depends on sources we do not carry yet.
             */
            [
                'key' => 'gear-slot-below-ascended',
                'producer' => GearGaps::KEY,
                'domain' => 'gear',
                'title' => 'Upgrade the {slot} on {character}',
                'body' => 'It is {rarity} while {ascended} of {total} core slots are already ascended. Closing this one leaves {remaining} to go.',
                'requires' => [['path' => 'character.ascended_missing', 'op' => '>', 'value' => 0]],
                'base_score' => 58,
                'weights' => ['character.ascended_core' => 1.0],
                'confidence' => 'medium',
                'effort_band' => 'session',
            ],

            /*
             * An empty core slot is a different problem from a low rarity, and a
             * much bigger one — it is stats the character simply does not have.
             */
            [
                'key' => 'gear-empty-core-slot',
                'producer' => GearGaps::KEY,
                'domain' => 'gear',
                'title' => 'Nothing equipped in the {slot} on {character}',
                'body' => 'That slot is empty, so it is contributing no stats at all. Anything in it beats nothing.',
                'requires' => [['path' => 'character.empty_core_slots', 'op' => '>', 'value' => 0]],
                'base_score' => 80,
                'weights' => [],
                'confidence' => 'high',
                'effort_band' => 'quick',
            ],

            /*
             * The one fractal threshold in the whole seed, and the only one that
             * could be sourced. States the gap, never a tier verdict.
             */
            [
                'key' => 'fractals-agony-for-tier-4',
                'producer' => AgonyGap::KEY,
                'domain' => 'fractals',
                'title' => '{short} more Agony Resistance for Tier 4 fractals',
                'body' => '{character} has {have} Agony Resistance from worn infusions, against the {target} that Tier 4 groups ask for.',
                'requires' => [['path' => 'character.agony_shortfall', 'op' => '>', 'value' => 0]],
                'base_score' => 55,
                'weights' => ['account.fractal_level' => 0.4],
                'confidence' => 'high',
                'effort_band' => 'long',
            ],

            /*
             * For an account that has clearly played fractals. Scored above the
             * general agony rule because a player at scale 25 is asking this
             * question; one who has never entered a fractal is not.
             */
            [
                'key' => 'fractals-agony-active-player',
                'producer' => AgonyGap::KEY,
                'domain' => 'fractals',
                'title' => 'Agony Resistance is what is holding your fractal level back',
                'body' => 'You are at fractal level {fractal_level} with {have} Agony Resistance. Tier 4 wants {target}, so {short} more is the next real step.',
                'requires' => [
                    ['path' => 'character.agony_shortfall', 'op' => '>', 'value' => 0],
                    ['path' => 'account.fractal_level', 'op' => '>=', 'value' => 20],
                ],
                'base_score' => 76,
                'weights' => [],
                'confidence' => 'high',
                'effort_band' => 'session',
            ],

            /*
             * Deliberately worded as a question.
             *
             * A character with no active crafting discipline may have made that
             * choice on purpose, so this asks rather than advises — which is what
             * `needs_confirmation` is for, and why it still gets drawn instead of
             * being hidden.
             */
            [
                'key' => 'gear-no-crafting-discipline',
                'producer' => GearGaps::KEY,
                'domain' => 'gear',
                'title' => 'Is {character} meant to have no active crafting discipline?',
                'body' => 'Ascended armour and weapons are crafted, so without one the {slot} and every other armour slot has to come from elsewhere.',
                'requires' => [
                    ['path' => 'character.crafting_disciplines', 'op' => '==', 'value' => 0],
                    ['path' => 'character.ascended_missing', 'op' => '>', 'value' => 0],
                ],
                'base_score' => 45,
                'weights' => [],
                'confidence' => 'needs_confirmation',
                'effort_band' => 'long',
            ],
        ];
    }
}
