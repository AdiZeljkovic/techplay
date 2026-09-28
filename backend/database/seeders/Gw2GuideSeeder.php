<?php

namespace Database\Seeders;

use App\Models\Gw2Guide;
use App\Models\Gw2Source;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Two of the nine families, written rather than generated.
 *
 * §20.1 names nine public page families and singles these two out as the main
 * entrances: `/gw2/level-80-what-next` is the acquisition page for the question
 * this whole product exists to answer, and `/gw2/fractals/agony-resistance` is
 * the one measurable, searchable number the advisor computes.
 *
 * Two, not nine, and that is the point. A guide is editorial work; seeding
 * seven more would be seven pages of filler under real URLs, which is exactly
 * the thin content §20.2 forbids. These two are written to stand on their own,
 * with the personalisation as an addition rather than the substance — the rest
 * are for the desk, and the screen to write them is there.
 *
 * Idempotent by family and slug, and it never overwrites an edited page: once
 * somebody sets `reviewed_at`, the row is theirs.
 */
class Gw2GuideSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->guides() as $guide) {
            $existing = Gw2Guide::where('family', $guide['family'])->where('slug', $guide['slug'])->first();

            if ($existing && $existing->reviewed_at !== null) {
                continue;
            }

            $guide['source_ids'] = Gw2Source::whereIn('kind', ['measured', 'wiki'])->pluck('id')->all();
            $guide['game_build'] = DB::table('gw2_catalog_meta')->where('endpoint', 'items')->value('build_id');

            $existing ? $existing->update($guide) : Gw2Guide::create($guide);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function guides(): array
    {
        return [
            [
                'family' => 'level-80',
                'slug' => 'what-next',
                'title' => 'You hit level 80 in Guild Wars 2. What now?',
                'standfirst' => 'There is no single right endgame, and that is the actual problem. '
                    .'Here is how to pick a direction without reading a wiki for an hour.',
                'personalise_as' => 'next-steps',
                'sort_order' => 1,
                'is_published' => true,
                'owner' => 'seed',
                'seo_title' => 'Guild Wars 2: what to do at level 80',
                'seo_description' => 'Guild Wars 2 has no gear treadmill and no single endgame, which is why '
                    .'hitting 80 feels like being handed a map with no destination. The directions that exist, '
                    .'and how to choose one.',
                'keywords' => [
                    'gw2 what to do at 80', 'guild wars 2 level 80 what next',
                    'gw2 endgame guide', 'gw2 after level 80',
                ],
                'next_steps' => [
                    'Get further in fractals' => '/gw2/fractals/agony-resistance',
                    'See what your own account needs' => '/gw2',
                ],
                'body' => $this->levelEightyBody(),
            ],
            [
                'family' => 'fractals',
                'slug' => 'agony-resistance',
                'title' => 'Agony Resistance in Guild Wars 2, and how much you actually need',
                'standfirst' => 'Agony is the only stat in the game that exists purely to gate content. '
                    .'What it does, where it comes from, and the one number worth aiming at.',
                'personalise_as' => 'agony',
                'sort_order' => 1,
                'is_published' => true,
                'owner' => 'seed',
                'seo_title' => 'GW2 Agony Resistance — how much you need and where to get it',
                'seo_description' => 'Agony Resistance comes from infusions in ascended gear and gates the '
                    .'higher fractal tiers. What it is, how it adds up, and why 150 is the number people mean.',
                'keywords' => [
                    'gw2 agony resistance', 'gw2 how much agony resistance',
                    'gw2 agony infusion', 'gw2 150 ar', 'guild wars 2 fractal tiers',
                ],
                'next_steps' => [
                    'Plan the gear it sockets into' => '/gw2/planner',
                    'See your own Agony Resistance' => '/gw2',
                ],
                'body' => $this->agonyBody(),
            ],
        ];
    }

    private function levelEightyBody(): string
    {
        return <<<'HTML'
<p>Most games answer "what now?" with a gear treadmill. Guild Wars 2 does not
have one, which is a design decision people praise right up until they hit 80
and find themselves holding a map with no destination marked on it.</p>

<p>The honest answer is that there are several endgames and none of them is
correct. What follows is what each one actually asks of you, so you can pick on
something better than a forum thread.</p>

<h2>The only thing that is genuinely a prerequisite</h2>

<p>Fill every gear slot. Not with anything good — just fill them. An empty
trinket slot is a straightforward loss of stats, and exotic gear is cheap enough
to be a rounding error. Everything else on this page can wait; this cannot,
because it makes all of it harder.</p>

<p>After that, ascended gear is worth having for exactly one reason that matters
mechanically: it takes infusions, and infusions are how you get Agony Resistance.
If fractals are not in your plans, ascended is a small stat upgrade and no more.</p>

<h2>Fractals</h2>

<p>Short instanced content, scaling difficulty, run in a group of five. It is
the most structured progression the game has, and the one place where a number
genuinely gates you: past a point you need Agony Resistance or you die to
something you cannot outplay.</p>

<p>It is a good first direction because the steps are legible. You can see what
is blocking you.</p>

<h2>Raids and strikes</h2>

<p>Ten-player encounters with mechanics that expect you to know them. Strikes are
the gentler entry. The barrier here is not gear — it is knowing the fight, and
nothing about your equipment tells anybody whether you do.</p>

<p>Be wary of any tool, this one included, that tells you that you are "raid
ready" from your gear. It cannot know.</p>

<h2>Open world and masteries</h2>

<p>Masteries are account-wide unlocks tied to each expansion's region, and some
of them change how you move through the world permanently. Gliding and the
mounts are the obvious ones.</p>

<p>Mastery points are locked to the region that earned them, which trips
everybody up at least once: having thirty spare points does not help if they are
all in a region whose tracks you have finished.</p>

<h2>Collections and legendaries</h2>

<p>The long game. A legendary is months of work and its real value is
convenience — stats you can swap freely — rather than power. Worth starting only
if the journey itself appeals, because the destination is a modest upgrade.</p>

<h2>What most people should actually do first</h2>

<p>Fill your gear slots. Run the Wizard's Vault dailies for a week, because they
pay well for very little and they will drag you through several kinds of content
you have not tried. Then pick the one you did not resent.</p>
HTML;
    }

    private function agonyBody(): string
    {
        return <<<'HTML'
<p>Agony is unlike every other damage source in Guild Wars 2. You cannot dodge
it, block it, or heal through it at higher intensities. It exists in fractals
and nowhere else, and its only counter is a stat called Agony Resistance.</p>

<p>That makes it the clearest progression gate in the game — and, unusually, one
where the thing blocking you is a number you can look up rather than a skill you
have to acquire.</p>

<h2>Where it comes from</h2>

<p>Infusions. These are small upgrades that slot into ascended and legendary
equipment, and they are the only source that matters. Two consequences follow
and both catch people out:</p>

<ul>
<li><strong>Exotic gear cannot hold them.</strong> If your armour is exotic, no
amount of shopping for infusions will raise your Agony Resistance. The gear
comes first.</li>
<li><strong>Only what you are wearing counts.</strong> Infusions sitting in an
inactive equipment template contribute nothing.</li>
</ul>

<h2>How much you need</h2>

<p>The figure people mean when they say "AR" is <strong>150</strong>. That is
what Tier 4 groups ask for and what the fractal reward tracks are built around.</p>

<p>You do not need it to start. The lower tiers are entirely playable without
much, and the requirement climbs with the scale rather than jumping at a wall.
We deliberately do not publish a per-scale table: those numbers are not in the
game's API, and a table typed from memory is the kind of thing that sends
somebody into content they cannot survive.</p>

<h2>The order that actually works</h2>

<ol>
<li>Get ascended trinkets first. They are the cheapest ascended pieces by a wide
margin and they take infusions like anything else.</li>
<li>Fill them with the cheapest agony infusions you can find. A +5 in every slot
beats a +15 in one.</li>
<li>Upgrade gradually. Infusions combine, and the cost curve is steep near the
top — the last twenty points cost more than the first hundred.</li>
<li>Do the ascended armour and weapons last. They are the most expensive and the
slowest, because of the time-gated materials.</li>
</ol>

<h2>What this is not</h2>

<p>Agony Resistance is a gate, not a measure of how good you are. Somebody at
150 who does not know the encounters will have a harder time than somebody at
100 who does. It buys you entry, and nothing else.</p>
HTML;
    }
}
