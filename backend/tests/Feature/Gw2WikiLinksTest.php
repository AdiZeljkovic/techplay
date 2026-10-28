<?php

namespace Tests\Feature;

use App\Models\Gw2Guide;
use App\Models\Gw2Source;
use App\Services\Gw2\Wiki;
use App\Services\Gw2\WikiPages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Links to the GW2 Wiki, built from our own catalogue and never by asking it.
 *
 * The one fact everything here rests on is the item chat code. The wiki's
 * search decodes it and opens the page whose infobox carries that id, which is
 * the only exact route to an item: 74,265 items share 51,604 names, so a link
 * guessed from a name is wrong for thousands of them. The expected URL below is
 * the one gw2treasures links item 19721 with in production — not a value this
 * code produced and then had copied into its own test.
 */
class Gw2WikiLinksTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_item_links_by_the_chat_code_the_game_prints(): void
    {
        $link = Wiki::item(19721);

        $this->assertSame('[&AgEJTQAA]', $link['chat_link']);
        $this->assertSame(
            'https://wiki.guildwars2.com/index.php?title=Special%3ASearch&search=%5B%26AgEJTQAA%5D&go=Go',
            $link['url']
        );
    }

    public function test_an_id_past_two_bytes_keeps_every_byte(): void
    {
        // 103889 needs the third id byte; a two-byte encoder would link it to
        // a different item without any error.
        $bytes = base64_decode(substr(Wiki::itemCode(103889), 2, -1));

        $this->assertSame(0x02, ord($bytes[0]), 'item header');
        $this->assertSame(1, ord($bytes[1]), 'quantity');
        $this->assertSame(103889, unpack('V', substr($bytes, 2, 4))[1]);
    }

    public function test_a_name_is_searched_exactly_and_a_blank_one_gets_no_link(): void
    {
        $this->assertSame(
            'https://wiki.guildwars2.com/index.php?title=Special%3ASearch&search=Wizard%27s%20Vault&go=Go',
            Wiki::named("Wizard's Vault")['url']
        );
        $this->assertNull(Wiki::named("Wizard's Vault")['chat_link']);

        // No page has an empty title; a link to one is a link to nothing.
        $this->assertNull(Wiki::named('  '));
        $this->assertNull(Wiki::named(null));
    }

    public function test_every_item_on_a_recipe_page_carries_its_own_link(): void
    {
        foreach ([[100, 'Ascended Chestpiece'], [200, 'Deldrimor Steel Ingot'], [300, 'Mithril Ore']] as [$id, $name]) {
            DB::table('gw2_items')->insert(['id' => $id, 'name' => $name, 'level' => 0]);
        }

        $this->recipe(1, 100, [[200, 2]]);
        $this->recipe(2, 200, [[300, 3]]);

        $page = $this->getJson('/api/v1/gw2/public/recipe/200')->assertOk();

        // The item, what it is made of, and what it goes into — each by its
        // own code, so three items that happened to share a name would still
        // land on three different pages.
        $this->assertSame(Wiki::itemCode(200), $page->json('data.item.wiki.chat_link'));
        $this->assertSame(Wiki::itemCode(300), $page->json('data.materials.0.wiki.chat_link'));
        $this->assertSame(Wiki::itemCode(100), $page->json('data.used_in.0.wiki.chat_link'));
        $this->assertSame(Wiki::itemCode(300), $page->json('data.tree.children.0.wiki.chat_link'));
    }

    public function test_a_mount_guide_links_to_the_game_s_own_name_for_the_mount(): void
    {
        // Our URL says "turtle"; the game calls it the Siege Turtle, and that is
        // the page title on the wiki.
        DB::table('gw2_reference')->insert([
            'kind' => 'mounts_types',
            'ref_id' => crc32('turtle'),
            'name' => 'Siege Turtle',
            'payload' => json_encode(['id' => 'turtle', 'name' => 'Siege Turtle']),
        ]);

        $this->guide('mounts', 'turtle');
        $this->guide('masteries', 'how-mastery-points-work');

        $mount = $this->getJson('/api/v1/gw2/public/guides/mounts/turtle')->assertOk();
        $this->assertStringContainsString('search=Siege%20Turtle', $mount->json('data.wiki.url'));

        // A guide about a whole system matches no single page, so it gets no
        // link rather than a guessed one.
        $this->assertNull(
            $this->getJson('/api/v1/gw2/public/guides/masteries/how-mastery-points-work')->assertOk()->json('data.wiki')
        );
    }

    public function test_a_guide_shows_its_sources_and_says_which_nobody_has_checked(): void
    {
        $measured = Gw2Source::create([
            'label' => 'Measured against the live API', 'url' => 'internal://measured/2026-09-28',
            'kind' => 'measured', 'checked_at' => '2026-09-28 13:48:38',
        ]);
        $wiki = Gw2Source::create([
            'label' => 'GW2 Wiki — API:2/masteries', 'url' => 'https://wiki.guildwars2.com/wiki/API:2/masteries',
            'kind' => 'wiki',
        ]);
        // A wiki-page row for a raid boss is not a citation of this guide.
        Gw2Source::create(['label' => 'GW2 Wiki — Vale Guardian', 'url' => 'https://wiki.guildwars2.com/wiki/Vale_Guardian', 'kind' => 'wiki', 'subject' => 'raid_encounter:vale_guardian']);

        $this->guide('masteries', 'how-mastery-points-work');
        Gw2Guide::where('slug', 'how-mastery-points-work')->update(['source_ids' => json_encode([$wiki->id, $measured->id])]);

        $sources = collect($this->getJson('/api/v1/gw2/public/guides/masteries/how-mastery-points-work')->assertOk()->json('data.sources'));

        $this->assertCount(2, $sources);

        // Something measured here has nothing to open, so it is named, not linked.
        $this->assertNull($sources->firstWhere('kind', 'measured')['url']);
        $this->assertNotNull($sources->firstWhere('kind', 'measured')['checked_at']);

        // An unchecked source is shown as unchecked rather than left out.
        $this->assertSame('https://wiki.guildwars2.com/wiki/API:2/masteries', $sources->firstWhere('kind', 'wiki')['url']);
        $this->assertNull($sources->firstWhere('kind', 'wiki')['checked_at']);
    }

    public function test_a_page_is_confirmed_by_its_title_never_by_its_status(): void
    {
        Http::fake([
            'wiki.guildwars2.com/wiki/Vale_Guardian' => Http::response(
                '<html><head><title>Vale Guardian - Guild Wars 2 Wiki (GW2W)</title></head></html>'
            ),
            // How the wiki answered every URL in October 2026: 200, and a notice.
            'wiki.guildwars2.com/wiki/Gorseval' => Http::response(
                '<html><head><title>Guild Wars 2 Wiki</title></head><body>temporarily unavailable</body></html>'
            ),
        ]);

        $pages = app(WikiPages::class);

        $this->assertSame(
            ['ok' => true, 'title' => 'Vale Guardian', 'reason' => ''],
            $pages->title('https://wiki.guildwars2.com/wiki/Vale_Guardian')
        );

        $this->assertFalse($pages->title('https://wiki.guildwars2.com/wiki/Gorseval')['ok']);

        // Search and index.php are disallowed to robots; they are never fetched.
        $this->assertFalse($pages->title(Wiki::item(19721)['url'])['ok']);
        Http::assertSentCount(2);
    }

    private function guide(string $family, string $slug): void
    {
        Gw2Guide::create([
            'family' => $family,
            'slug' => $slug,
            'title' => ucfirst($slug),
            'body' => '<p>Body.</p>',
            'is_published' => true,
        ]);
    }

    /** @param array<int, array{0: int, 1: int}> $ingredients */
    private function recipe(int $id, int $output, array $ingredients): void
    {
        DB::table('gw2_recipes')->insert([
            'id' => $id,
            'output_item_id' => $output,
            'output_item_count' => 1,
            'ingredients' => json_encode(array_map(fn ($i) => ['item_id' => $i[0], 'count' => $i[1]], $ingredients)),
            'disciplines' => json_encode(['Armorsmith']),
            'min_rating' => 0,
        ]);
    }
}
