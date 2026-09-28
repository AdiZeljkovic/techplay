<?php

namespace Database\Seeders;

use App\Models\Gw2Guide;
use App\Models\Gw2Source;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * A page per mount — and a reversal of what the library seeder says about them.
 *
 * `Gw2GuideLibrarySeeder` refuses to write these, on the grounds that "the
 * Skyscale needs collection X with items Y" would be inventing game knowledge.
 * That was right at the time and is wrong now, because of one field we were not
 * storing: the game states all of it itself.
 *
 * Each mount's mastery track carries a `requirement` written by ArenaNet —
 * *"Complete the Guild Wars 2: Janthir Wilds story chapter Unknown Territory to
 * unlock the Warclaw Mastery track."* That is a citation, not a recollection,
 * and it is the spine of every page below. Three mounts go further: the
 * Skyscale, the Siege Turtle and the Roller Beetle are unlocked through
 * collections, and those collections name their own children in their own step
 * text, so the chain expands itself (see `gw2:expand-chains`).
 *
 * What stays curated is small and stated: which collections form the spine, and
 * in what order. The Skyscale's order is not a guess either — its five stages
 * carry `locked_text` saying which one unlocks after which, the only four
 * achievements in a catalogue of 8,339 that do.
 *
 * Every page ships **unreviewed**. The prose is assembled from the game's own
 * strings and is honest, but nobody who plays has read it yet, and the guide
 * table has a column that means exactly that.
 */
class Gw2MountGuideSeeder extends Seeder
{
    public function run(): void
    {
        $sources = Gw2Source::whereIn('kind', ['measured', 'wiki'])->pluck('id')->all();
        $build = DB::table('gw2_catalog_meta')->where('endpoint', 'achievements')->value('build_id');

        foreach ($this->guides() as $guide) {
            $existing = Gw2Guide::where('family', 'mounts')->where('slug', $guide['slug'])->first();

            // Once a person reviews a page it is theirs, chain included.
            if ($existing && $existing->reviewed_at !== null) {
                continue;
            }

            $guide['family'] = 'mounts';
            $guide['source_ids'] = $sources;
            $guide['game_build'] = $build;
            $guide['owner'] = 'seed';
            $guide['is_published'] = true;
            $guide['personalise_as'] = 'guide:mounts/'.$guide['slug'];

            $existing ? $existing->update($guide) : Gw2Guide::create($guide);
        }
    }

    /**
     * The nine mount types the catalogue carries.
     *
     * `achievement_ids` holds the spine only. `gw2:expand-chains` fills in the
     * collections each spine step names, which is why the Skyscale lists six
     * here and thirty on the page.
     *
     * @return array<int, array<string, mixed>>
     */
    private function guides(): array
    {
        return [
            [
                'slug' => 'raptor',
                'title' => 'Raptor',
                'sort_order' => 10,
                'standfirst' => 'The first mount, and the one the Path of Fire story hands you before it asks for anything.',
                'body' => $this->page(
                    'The raptor comes with the Path of Fire story. You are given it early, in the Crystal Oasis, '
                    .'before the expansion asks you to buy or collect anything — which is why every other mount '
                    .'guide on this site assumes you already have it.',
                    'Complete the Seeker\'s Village task region in Oasis to unlock the Raptor Mastery Track.',
                    'Having the raptor and being able to train it are two different unlocks. The mount arrives '
                    .'with the story; the mastery track that teaches it to leap chasms waits on the task region '
                    .'above, and mastery points you can only earn in Path of Fire content.'
                ),
                'seo_title' => 'Guild Wars 2 Raptor — how to unlock it and its mastery track',
                'seo_description' => 'The raptor is granted by the Path of Fire story. What unlocks its mastery track, and what the track actually buys you.',
                'keywords' => ['gw2 raptor', 'raptor mount', 'path of fire mounts'],
            ],
            [
                'slug' => 'springer',
                'title' => 'Springer',
                'sort_order' => 20,
                'standfirst' => 'Vertical movement, and the mount that makes half of Tyria\'s jumping puzzles stop mattering.',
                'body' => $this->page(
                    'The springer is bought from a mount trader in Path of Fire, once the story has taken you '
                    .'through Desert Highlands. It is coin, not a collection — the grind on this one is the '
                    .'mastery track afterwards, not the unlock.',
                    'Complete the Highjump Ranch task region in Desert Highlands to unlock the Springer Mastery Track.',
                    'The first springer mastery is the one worth the points: it fortifies your landing, which '
                    .'turns a fall that would have killed you into a dismount.'
                ),
                'seo_title' => 'Guild Wars 2 Springer — unlock, mastery track and what it is for',
                'seo_description' => 'Where the springer comes from, what unlocks its mastery track, and which tier is worth your points first.',
                'keywords' => ['gw2 springer', 'springer mount', 'high jump mount gw2'],
            ],
            [
                'slug' => 'skimmer',
                'title' => 'Skimmer',
                'sort_order' => 30,
                'standfirst' => 'Over water, over lava, and — once trained — under the water as well.',
                'body' => $this->page(
                    'The skimmer is bought from a mount trader in Path of Fire after the story reaches the Elon '
                    .'Riverlands. Like the springer it costs coin rather than a collection.',
                    'Complete the Skimmer Ranch task region in Elon Riverlands to unlock the Skimmer Mastery Track.',
                    'The skimmer is the mount whose later masteries change it most: what starts as a way across '
                    .'water ends up as the fastest way through it. Note that its deep-water training sits in a '
                    .'separate mastery region from the mount itself — the game groups it with Secrets of the '
                    .'Obscure content, so those points come from elsewhere.'
                ),
                'seo_title' => 'Guild Wars 2 Skimmer — unlock, mastery track and underwater training',
                'seo_description' => 'Where the skimmer comes from, what unlocks its mastery track, and why its underwater training draws on a different mastery region.',
                'keywords' => ['gw2 skimmer', 'skimmer mount', 'gw2 underwater skimmer'],
            ],
            [
                'slug' => 'jackal',
                'title' => 'Jackal',
                'sort_order' => 40,
                'standfirst' => 'Short blinks, sand portals, and the mount the Path of Fire maps are built around.',
                'body' => $this->page(
                    'The jackal is bought from a mount trader in Path of Fire once the story has taken you to '
                    .'the Desolation. It is the last of the four the expansion sells outright.',
                    'Complete the Sand Jackal Run task region in the Desolation to unlock the Jackal Mastery Track.',
                    'Several Path of Fire map areas are only reachable through sand portals, and those need the '
                    .'jackal trained rather than merely owned — which is the usual reason somebody has the mount '
                    .'and still cannot get where they are trying to go.'
                ),
                'seo_title' => 'Guild Wars 2 Jackal — unlock, mastery track and sand portals',
                'seo_description' => 'Where the jackal comes from, what unlocks its mastery track, and why sand portals need the track and not just the mount.',
                'keywords' => ['gw2 jackal', 'jackal mount', 'gw2 sand portal'],
            ],
            [
                'slug' => 'griffon',
                'title' => 'Griffon',
                'sort_order' => 50,
                'standfirst' => 'The expensive one. A long quest chain across every Path of Fire map, and a bill at the end of it.',
                'body' => $this->page(
                    'The griffon is not sold and is not a collection you can start on day one. It waits on the '
                    .'Path of Fire story being finished, opens into a chain that sends you across all five of '
                    .'the expansion\'s maps, and closes with a substantial gold cost. Budget for it before you '
                    .'begin rather than halfway through.',
                    'Complete the Griffon Training adventure in the Domain of Vabbi to unlock the Griffon Mastery Track.',
                    'The griffon rewards the mastery track more than any other mount: untrained it is a glide '
                    .'with extra steps, and fully trained it is the fastest way to cross a map in the game.'
                ),
                'seo_title' => 'Guild Wars 2 Griffon — the quest chain, the cost and the mastery track',
                'seo_description' => 'What the griffon actually asks for: the Path of Fire story, a chain across every expansion map, and a large gold cost.',
                'keywords' => ['gw2 griffon', 'griffon mount', 'how to get griffon gw2'],
            ],
            [
                'slug' => 'roller-beetle',
                'title' => 'Roller Beetle',
                'sort_order' => 60,
                'standfirst' => 'The first mount unlocked by a collection rather than a purchase — and the fastest thing on flat ground.',
                'body' => $this->page(
                    'The roller beetle is the reward for raising one. The chain hangs off <em>Beetlemania</em>, '
                    .'which asks you to finish three smaller collections — feed, medicine and a saddle — and '
                    .'each of those names its own items in the game\'s own words. Your progress through all of '
                    .'them is below if you have an account connected.',
                    'Complete the roller beetle mount collection to unlock the roller beetle Mastery track.',
                    'It has no vertical movement at all and needs a run-up to be worth anything, which is why it '
                    .'feels useless for a map or two and then never leaves your bar.'
                ),
                /*
                 * Beetlemania is the spine and its three children are listed
                 * rather than derived: its own steps are bare item ids with no
                 * wording, so nothing names them. Their requirement lines put
                 * them beyond doubt all the same — feed Petey, medicine for
                 * Petey, saddle parts to Blish.
                 */
                'achievement_ids' => [4202, 4270, 4265, 4205],
                'seo_title' => 'Guild Wars 2 Roller Beetle — the full collection chain',
                'seo_description' => 'Every collection the roller beetle asks for, with your own progress through each one if you connect an account.',
                'keywords' => ['gw2 roller beetle', 'beetlemania collection', 'roller beetle unlock'],
            ],
            [
                'slug' => 'warclaw',
                'title' => 'Warclaw',
                'sort_order' => 70,
                'standfirst' => 'No longer a World versus World grind. The warclaw now comes out of the Janthir Wilds story.',
                'body' => $this->page(
                    'This is the mount most guides get wrong, because it moved. The warclaw began as a World '
                    .'versus World unlock and its mastery track is now gated on a Janthir Wilds story chapter — '
                    .'which is what the game itself says, quoted below. If you are following instructions that '
                    .'send you to WvW for it, they are describing an older game.',
                    'Complete the Guild Wars 2: Janthir Wilds story chapter Unknown Territory to unlock the Warclaw Mastery track.',
                    'Its mastery track sits in the Janthir mastery region, so the points come from Janthir Wilds '
                    .'content rather than from anything you earned in Path of Fire.'
                ),
                'seo_title' => 'Guild Wars 2 Warclaw — how it is unlocked now, not how it used to be',
                'seo_description' => 'The warclaw moved out of World versus World. What the game currently requires, and which mastery region its track draws on.',
                'keywords' => ['gw2 warclaw', 'warclaw unlock', 'janthir wilds warclaw'],
            ],
            [
                'slug' => 'skyscale',
                'title' => 'Skyscale',
                'sort_order' => 80,
                'standfirst' => 'The long one. Five stages, twenty-four collections underneath them, and the game tells you the order.',
                'body' => $this->page(
                    'The skyscale is the biggest mount chain in the game and the best documented, because the '
                    .'game documents it itself. Five collections form the spine, each one unlocking after the '
                    .'last — <em>Newborn</em>, <em>Saving</em>, <em>Raising</em>, <em>Troublesome</em>, then '
                    .'<em>Riding Skyscales</em> — and each names the smaller collections it wants finished '
                    .'first. Every step below is ArenaNet\'s wording; connect an account and the ones you have '
                    .'already done drop out.',
                    'Complete the skyscale mount collections to unlock the skyscale Mastery track.',
                    'The gate before any of it is the Living World Season 4 chapter <em>Heart to Heart</em>. '
                    .'Expect this to take days rather than an evening: several stages are time-gated and no '
                    .'amount of gold shortens them.'
                ),
                /*
                 * The order is the game's, not ours. These five are the only
                 * four achievements in the catalogue whose `locked_text` names
                 * the collection that unlocks them, plus the story chapter
                 * that gates the first.
                 */
                'achievement_ids' => [4747, 4714, 4712, 4693, 4675, 4745],
                'seo_title' => 'Guild Wars 2 Skyscale — every collection in order, with your progress',
                'seo_description' => 'The full skyscale chain: five stages, the collections under each, and which steps you have left if you connect an account.',
                'keywords' => ['gw2 skyscale', 'skyscale collection', 'how to get skyscale gw2'],
            ],
            [
                'slug' => 'turtle',
                'title' => 'Siege Turtle',
                'sort_order' => 90,
                'standfirst' => 'Two seats, a cannon, and three stages of raising it. The only mount somebody else can ride with you.',
                'body' => $this->page(
                    'The siege turtle is raised in three stages — <em>Starting Small</em>, then '
                    .'<em>Getting Stronger</em> once it has outgrown baby food, then <em>Suiting Up</em> once '
                    .'it is fully grown. The game gates them in that order and says so. The last stage is the '
                    .'long one: its parts come from across End of Dragons, including a strike mission.',
                    'Complete the turtle mount collections.',
                    'It is slow and it is the only two-seat mount in the game, which makes it the one mount '
                    .'worth having for a reason that has nothing to do with getting anywhere.'
                ),
                'achievement_ids' => [6408, 6066, 6099],
                'seo_title' => 'Guild Wars 2 Siege Turtle — all three collections and what they need',
                'seo_description' => 'The three stages of raising a siege turtle, what each asks for, and your own progress through them.',
                'keywords' => ['gw2 siege turtle', 'turtle mount gw2', 'end of dragons turtle'],
            ],
        ];
    }

    /**
     * One page, three paragraphs and a quotation.
     *
     * The quotation is load-bearing and marked as one. It is the requirement
     * string off the mount's own mastery track, which means the most likely
     * sentence on the page to go stale is the one a reader can see we did not
     * write — and the nightly catalogue refresh is what would make it stale.
     */
    private function page(string $how, string $requirement, string $note): string
    {
        return '<p>'.$how.'</p>'
            .'<blockquote><p>'.$requirement.'</p>'
            .'<footer>Guild Wars 2, on this mount\'s mastery track</footer></blockquote>'
            .'<p>'.$note.'</p>';
    }
}
