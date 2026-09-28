<?php

namespace Database\Seeders;

use App\Models\Gw2Guide;
use App\Models\Gw2Source;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * The rest of the guide library — and a line drawn through the middle of it.
 *
 * §20.1 names nine families. Six of them can be written honestly from here,
 * because they explain **systems**: how mastery points are locked to a region,
 * what the Wizard's Vault actually pays, why ascended matters and when it does
 * not, what an achievement's flags mean for whether it is worth chasing. Every
 * claim in those is either structural or grounded in data this project mirrors
 * and has measured.
 *
 * Three cannot, and they are not written here:
 *
 * **Per-mount acquisition routes.** §9.5 calls the path "content logic
 * maintained as TechPlay curated data" precisely because it is not in any API.
 * Writing "the Skyscale needs collection X with items Y" would be inventing
 * game knowledge, which is the one thing this whole build has refused. The
 * producer already recommends the mounts an account lacks and says plainly
 * that the write-up does not exist yet.
 *
 * **Per-achievement walkthroughs.** Same reason, eight thousand times over.
 *
 * **Per-legendary recipes.** §14 defers the whole calculator from MVP and notes
 * gw2efficiency does it better; the differentiator is "what is blocking you",
 * which is a tool rather than a page.
 *
 * Those three need somebody who plays. The system to write them is built, the
 * screen is there, and leaving them empty is the honest state rather than a gap
 * somebody forgot.
 */
class Gw2GuideLibrarySeeder extends Seeder
{
    public function run(): void
    {
        $sources = Gw2Source::whereIn('kind', ['measured', 'wiki'])->pluck('id')->all();
        $build = DB::table('gw2_catalog_meta')->where('endpoint', 'items')->value('build_id');

        foreach ($this->guides() as $guide) {
            $existing = Gw2Guide::where('family', $guide['family'])->where('slug', $guide['slug'])->first();

            // Once a person reviews a page it is theirs.
            if ($existing && $existing->reviewed_at !== null) {
                continue;
            }

            $guide['source_ids'] = $sources;
            $guide['game_build'] = $build;
            $guide['owner'] ??= 'seed';
            $guide['is_published'] ??= true;

            $existing ? $existing->update($guide) : Gw2Guide::create($guide);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function guides(): array
    {
        return [
            [
                'family' => 'progression',
                'slug' => 'how-progression-works',
                'title' => 'How progression actually works in Guild Wars 2',
                'standfirst' => 'There is no gear treadmill and no single ladder. What there is instead, '
                    .'and why that makes the game hard to advise on.',
                'personalise_as' => 'next-steps',
                'sort_order' => 1,
                'seo_title' => 'Guild Wars 2 progression explained — what to work towards',
                'seo_description' => 'Guild Wars 2 progresses horizontally: masteries, gear tiers that stop, '
                    .'achievements, collections and account unlocks. What each one is for and which of them '
                    .'actually gates content.',
                'keywords' => ['gw2 progression', 'guild wars 2 endgame progression', 'gw2 horizontal progression'],
                'next_steps' => [
                    'What to do at level 80' => '/gw2/level-80/what-next',
                    'Mastery points explained' => '/gw2/masteries/how-mastery-points-work',
                ],
                'body' => $this->progression(),
            ],
            [
                'family' => 'masteries',
                'slug' => 'how-mastery-points-work',
                'title' => 'Mastery points in Guild Wars 2, and why yours might be stuck',
                'standfirst' => 'Points are locked to the region that earned them. That single rule explains '
                    .'most of the confusion around masteries.',
                'personalise_as' => 'masteries',
                'sort_order' => 1,
                'seo_title' => 'GW2 mastery points — how they work and why they are region-locked',
                'seo_description' => 'Mastery points in Guild Wars 2 are locked to the region that earned '
                    .'them, and each tier costs more than the last. How the system works and what it costs.',
                'keywords' => [
                    'gw2 mastery points', 'gw2 mastery points region locked',
                    'guild wars 2 masteries explained', 'gw2 mastery point cost',
                ],
                'next_steps' => [
                    'Every track and what each tier costs' => '/gw2/database/masteries',
                    'See your own unspent points' => '/gw2',
                ],
                'body' => $this->masteries(),
            ],
            [
                'family' => 'wizards-vault',
                'slug' => 'what-it-pays',
                'title' => "The Wizard's Vault, and whether it is worth your time",
                'standfirst' => 'The most reliable income in the game for the least commitment — with one '
                    .'caveat about the weeklies that catches people out.',
                'personalise_as' => 'vault',
                'sort_order' => 1,
                'seo_title' => "GW2 Wizard's Vault explained — dailies, weeklies and Astral Acclaim",
                'seo_description' => "How the Wizard's Vault works in Guild Wars 2: daily and weekly "
                    .'objectives, Astral Acclaim, and why the weeklies matter more than the dailies.',
                'keywords' => [
                    'gw2 wizards vault', 'gw2 astral acclaim', 'guild wars 2 wizards vault weekly',
                ],
                'next_steps' => ['See what is open on your account' => '/gw2/tonight'],
                'body' => $this->vault(),
            ],
            [
                'family' => 'goals',
                'slug' => 'first-ascended-set',
                'title' => 'Your first ascended set: what it is for and what it is not',
                'standfirst' => 'Ascended is the last gear tier, and for most of the game it barely matters. '
                    .'Here is when it does.',
                'personalise_as' => 'ascended-set',
                'sort_order' => 1,
                'seo_title' => 'GW2 ascended gear — is it worth it, and which pieces first',
                'seo_description' => 'Ascended is the highest gear tier in Guild Wars 2 and the only one '
                    .'that takes infusions. What it actually buys you, the order that costs least, and when '
                    .'exotic is genuinely fine.',
                'keywords' => [
                    'gw2 ascended gear', 'gw2 ascended vs exotic', 'guild wars 2 first ascended set',
                    'gw2 ascended trinkets first',
                ],
                'next_steps' => [
                    'Plan the materials' => '/gw2/planner',
                    'Why ascended matters for fractals' => '/gw2/fractals/agony-resistance',
                ],
                'body' => $this->ascended(),
            ],
            [
                'family' => 'achievements',
                'slug' => 'easy-wins',
                'title' => 'Finding achievements you are one step from finishing',
                'standfirst' => 'The game tracks thousands and sorts them by category. Neither of those is '
                    .'the sort you want.',
                'personalise_as' => 'next-steps',
                'sort_order' => 1,
                'seo_title' => 'GW2 easy achievements — finding the ones you are close to',
                'seo_description' => 'Guild Wars 2 tracks thousands of achievements and sorts them by '
                    .'category, never by how close you are. How to find the ones a single step from done.',
                'keywords' => [
                    'gw2 easy achievements', 'gw2 achievement points fast',
                    'guild wars 2 nearly complete achievements',
                ],
                'next_steps' => ['See yours' => '/gw2'],
                'body' => $this->easyWins(),
            ],
            [
                'family' => 'legendary',
                'slug' => 'is-it-worth-it',
                'title' => 'Legendary gear in Guild Wars 2: what you are actually buying',
                'standfirst' => 'Months of work for a stat upgrade of zero. Which sounds damning until you '
                    .'know what it is really for.',
                'personalise_as' => null,
                'sort_order' => 1,
                'seo_title' => 'GW2 legendary gear — worth it or not',
                'seo_description' => 'Legendary equipment in Guild Wars 2 has identical stats to ascended. '
                    .'What it actually buys, who it is for, and why the Legendary Armory changed the answer.',
                'keywords' => [
                    'gw2 legendary worth it', 'guild wars 2 legendary armory',
                    'gw2 legendary vs ascended',
                ],
                'next_steps' => ['Start with ascended instead' => '/gw2/goals/first-ascended-set'],
                'body' => $this->legendary(),
            ],
        ];
    }

    private function progression(): string
    {
        return <<<'HTML'
<p>Most MMOs progress vertically: a number goes up, last season's gear becomes
worthless, and the question "what should I do" answers itself. Guild Wars 2 threw
that out, and the result is a game people praise for respecting their time and
then bounce off because they cannot tell what they are supposed to be doing.</p>

<p>It helps to know what the systems actually are, and which of them gate
anything.</p>

<h2>Gear stops</h2>

<p>There are six rarities and the ladder ends at ascended, with legendary beside
it at identical stats. An exotic set is a few per cent behind ascended and a few
silver to buy. That is the whole vertical progression in the game, and you can
finish it in an afternoon.</p>

<p>The one thing ascended does that exotic cannot is take infusions, which is
where Agony Resistance comes from, which is what gates the higher fractal tiers.
If fractals are not your plan, ascended is a small upgrade you can take your time
over.</p>

<h2>Masteries are the real progression</h2>

<p>Account-wide unlocks tied to each expansion's region: gliding, the mounts,
crafting improvements, access mechanics. They are permanent, they apply to every
character you will ever make, and several of them change how you move through the
world rather than how hard you hit.</p>

<p>The catch that confuses everybody is that mastery points are locked to the
region that earned them. Thirty spare points do nothing for you if they are all
in a region whose tracks you have finished.</p>

<h2>Achievements are a currency and a map</h2>

<p>The game tracks thousands. Most are incidental, some award mastery points, and
a few gate collections. Their value is less the points than the fact that they
describe content you have not seen — a half-finished exploration achievement is
a map you have not walked.</p>

<h2>Instanced content has its own ladders</h2>

<p>Fractals scale in difficulty and gate on Agony Resistance. Raids and strikes
gate on knowing the encounter, which no tool can measure and no gear implies.
Dungeons are largely a currency source now.</p>

<h2>What none of this has</h2>

<p>There is no correct order. A player who spends three years on collections and
never enters a raid has not fallen behind, because there is no line to be behind.
That is genuinely freeing and it is also why "what should I do next" is a real
question rather than a beginner's one.</p>

<p>The useful version of the question is narrower: <em>given what I have already
done, what is one thing that would open up more than it costs?</em> That usually
has an answer, and it is usually a blocker rather than a goal — an empty gear
slot, a mastery you never trained, a region you have points in and never spent.</p>
HTML;
    }

    private function masteries(): string
    {
        return <<<'HTML'
<p>Masteries are the closest thing Guild Wars 2 has to long-term character
progression, except they are not on your character at all. They are account-wide,
they are permanent, and several of them change how you move through the world
rather than how hard you hit.</p>

<h2>The rule that trips everyone</h2>

<p><strong>Mastery points are locked to the region that earned them.</strong> A
point earned in Heart of Thorns can only ever be spent on a Heart of Thorns
track. There is no conversion and no exception.</p>

<p>This is why "I have thirty unspent points" is not the good news it sounds
like. If they are all in a region whose tracks are finished, they buy nothing at
all. The number that matters is not your total — it is your total <em>in a region
with something left to train</em>.</p>

<h2>Two costs, not one</h2>

<p>A mastery tier needs both mastery points and experience. The experience fills
a bar as you play anything at all; the points are the gate. It is common to have
the experience and not the points, and less common but possible to have the points
and an empty bar.</p>

<p>So "you can afford this tier" is only half an answer, and any tool that tells
you otherwise — including this one — is telling you about the points.</p>

<h2>The costs climb steeply</h2>

<p>Tiers within a track are not evenly priced. A typical Heart of Thorns track
runs 1, 2, 3, 5, 8, 12 points — the last tier costs more than the first four
together.</p>

<p>That shape has a practical consequence: spreading points across the first tier
of several tracks buys far more than finishing one. The first tier of a mount or
a gliding track is often the tier that does the interesting thing, and the
expensive tiers at the top are refinements.</p>

<h2>Where points come from</h2>

<p>Achievements, hero challenges in expansion maps, story chapters, and
collections. The achievement sources are the ones worth hunting, because many of
them are things you were going to do anyway.</p>

<h2>A note on how we report this</h2>

<p>The game's own API names mastery regions differently in two places — the
catalogue calls the Heart of Thorns region <em>Maguuma</em>, while your account
calls it <em>Heart of Thorns</em> — and nothing in either response connects the
two. We map them, and there is one region we deliberately do not map because the
account endpoint gives it no name at all. Its tracks are listed on their own
rather than filed under a guess.</p>
HTML;
    }

    private function vault(): string
    {
        return <<<'HTML'
<p>The Wizard's Vault replaced the old daily system and is, for most players, the
single best return on a small amount of time in Guild Wars 2. It is also the one
system where the game is unusually clear about what it wants from you.</p>

<h2>How it works</h2>

<p>You get a set of daily objectives and a set of weekly ones. Completing them
pays Astral Acclaim, which buys things from a vendor that rotates by season.
Finishing enough of the dailies pays a bonus on top; the same for the weeklies.</p>

<p>Each objective tells you exactly what it wants — complete three events, finish
a jumping puzzle, deal damage with siege — and the API reports your progress
against it precisely. There is no interpretation needed anywhere in this system,
which is rare.</p>

<h2>The part that catches people</h2>

<p><strong>The weeklies are worth far more than the dailies and reset far less
often.</strong> A daily missed costs a day. A weekly missed on Sunday costs a
week, and there is no way to catch up.</p>

<p>So the sensible pattern is to glance at the weeklies early in the week and let
the dailies happen incidentally, rather than the other way round. Several weeklies
complete themselves while you do the dailies anyway.</p>

<h2>Claimed and completed are different states</h2>

<p>An objective can be finished and unclaimed, and the reward sits there until you
open the panel. This is the easiest free acclaim in the game and the easiest to
forget, because nothing in the world tells you about it.</p>

<p>It also expires at the reset. A finished, unclaimed objective is simply gone
when the period rolls over.</p>

<h2>Whether to spend or save</h2>

<p>We deliberately do not rank the vault rewards by value. Doing that properly
needs a maintained valuation model — what a given item is worth changes with the
trading post and with what you personally still need — and a ranking without one
would be a confident-looking number with nothing behind it.</p>

<p>What is worth knowing: your already-purchased counts limit some rewards, so an
item you have bought the maximum of is not an option however good it looks.</p>
HTML;
    }

    private function ascended(): string
    {
        return <<<'HTML'
<p>Ascended is the highest gear tier in Guild Wars 2 that you can realistically
aim at, and the honest summary is that for most of the game it barely matters.
The stat difference over exotic is a few per cent. If somebody tells you that you
need ascended to play the game, they are wrong.</p>

<p>There are two reasons to want it anyway, and only one of them is about power.</p>

<h2>Reason one: infusions</h2>

<p>Ascended and legendary equipment has infusion slots. Exotic does not. Infusions
are where Agony Resistance comes from, and Agony Resistance is what gates the
higher fractal tiers.</p>

<p>This is the real reason, and it is conditional: if fractals are not in your
plans, this reason does not apply to you.</p>

<h2>Reason two: stat swapping</h2>

<p>Ascended trinkets and armour can often have their stats reselected, which
matters if you play several builds on one character. It is a convenience rather
than a power increase, and it is a genuine one.</p>

<h2>The order that costs least</h2>

<p>Not all ascended pieces cost the same, and the difference is large.</p>

<ol>
<li><strong>Trinkets first.</strong> Rings, accessories and the amulet are by a
wide margin the cheapest ascended pieces, and several sources hand them over for
currencies you accumulate without trying. They also carry infusion slots like
anything else.</li>
<li><strong>Back item.</strong> Usually cheap, often from a collection you may
have partly done already.</li>
<li><strong>Weapons.</strong> Crafted, and the first place you meet the
time-gated materials.</li>
<li><strong>Armour last.</strong> Six pieces, the most expensive, and the most
time-gated. This is the part that takes weeks rather than days, and it is the part
with the smallest stat return.</li>
</ol>

<h2>The time gates</h2>

<p>Ascended crafting depends on materials that can only be made once a day. No
amount of gold removes that, and it is the reason a set takes weeks even for
somebody who could afford to buy every tradable component outright.</p>

<p>Plan around it rather than against it: start the daily crafts before you need
them, and the wait happens while you are doing something else.</p>

<h2>What not to do</h2>

<p>Do not replace a working exotic set piece by piece while raising nothing else.
A full exotic set with the right stats beats a half-finished ascended one, and the
half-finished state can last months.</p>
HTML;
    }

    private function easyWins(): string
    {
        return <<<'HTML'
<p>Guild Wars 2 tracks several thousand achievements per account and presents them
sorted by category. That is the right sort for browsing and the wrong one for the
question most people actually have, which is: <em>what am I nearly finished
with?</em></p>

<h2>Why the game cannot answer it for you</h2>

<p>The achievement panel knows your progress on each one. What it does not do is
rank them against each other, because "nearly done" is not a single thing — an
achievement at 16 of 17 map sectors and one at 4,900 of 5,000 kills are both at
ninety-seven per cent, and only one of them is an evening's work.</p>

<h2>What makes an achievement worth chasing</h2>

<ul>
<li><strong>Steps remaining, not percentage.</strong> One step left is the useful
signal. A ratio is not.</li>
<li><strong>Whether it awards a mastery point.</strong> A point in a region you
have tracks left in is worth far more than the achievement points.</li>
<li><strong>Whether it can be finished at all right now.</strong> A great many
achievements are seasonal, retired, or gated behind a festival that is not
running.</li>
</ul>

<h2>The flag most tools ignore</h2>

<p>ArenaNet publishes a flag on each achievement called
<code>IgnoreNearlyComplete</code>, and it means exactly what it says: this one is
not a sensible nearly-complete candidate. Seven hundred and forty-four
achievements carry it.</p>

<p>It is there because some achievements have progress that does not mean what it
looks like — repeatable counters, tracking that resets, or sub-goals that are not
equally weighted. Any tool that sorts by "closest to done" without reading that
flag will confidently recommend several hundred things the game has already said
are unsuitable.</p>

<p>We read it. We also exclude the dailies, weeklies and monthlies, because "one
step from done" on something that resets tomorrow is not a finding, and the PvP
achievements, because that is a different game with its own progression.</p>

<h2>A caveat worth stating</h2>

<p>Even after all of that, an achievement described as one step from done is one
step from done <em>according to the API</em>. The step itself might be a jumping
puzzle, a meta event on a two-hour timer, or a map you have to cross a continent
to reach. Closeness is not the same as ease, and nothing we can read tells us
which.</p>
HTML;
    }

    private function legendary(): string
    {
        return <<<'HTML'
<p>Legendary equipment in Guild Wars 2 has exactly the same stats as ascended.
Not similar — identical. Months of work for a power increase of zero.</p>

<p>People make them anyway, in large numbers, and the reasons are worth
understanding before you start or decide not to.</p>

<h2>What you are actually buying</h2>

<p><strong>Free stat changes, forever.</strong> A legendary can have its stats and
its runes or sigils swapped outside combat, at no cost, as often as you like.
Ascended gear can sometimes be stat-swapped, but it costs materials each time and
often cannot be done at all.</p>

<p>For somebody who plays one build on one character, this is worth nothing. For
somebody who plays four builds and moves between open world, fractals and strikes
in a single evening, it removes an entire category of friction — and that is the
whole pitch.</p>

<h2>The Legendary Armory changed the maths</h2>

<p>Legendary equipment used to live on one character like anything else. The
Armory made it account-wide: one legendary is available to every character you
own, simultaneously.</p>

<p>That turns "months of work for one character" into "months of work for all of
them", which is a materially different proposition and the reason the answer to
"is it worth it" shifted for a lot of people.</p>

<h2>Who should not start one</h2>

<ul>
<li>Anybody without a full ascended set on the character they play most. The set
is a real upgrade and a fraction of the work.</li>
<li>Anybody who plays one build. You are buying flexibility you will not use.</li>
<li>Anybody hoping for power. There is none.</li>
</ul>

<h2>Why we do not publish a full legendary calculator</h2>

<p>Because a good one already exists and cloning it would be a worse version of
somebody else's work. gw2efficiency has done the ingredient graphs thoroughly and
maintains them.</p>

<p>What is genuinely missing is smaller and harder: not <em>here is every
ingredient</em> but <em>which of these requirements have you already met, what is
blocking you right now, and which time-gated part should you start today so it is
ready when you need it</em>. That is a tool rather than a page, and it is the part
we intend to build.</p>
HTML;
    }
}
