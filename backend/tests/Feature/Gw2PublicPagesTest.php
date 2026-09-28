<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\V1\Gw2PublicController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The public Guild Wars 2 pages, and the count they all depend on.
 *
 * One number decides three things: how many pages the index offers, how many
 * URLs the sitemap lists, and what the hub tells a reader. When it was built
 * from a join with `distinct()`, `paginate()` counted the joined rows before the
 * distinct applied — 13,156 where there were 13,024 — so the index advertised a
 * last page that held nothing, the index turns an empty page into a 404, and the
 * sitemap pointed at it.
 *
 * Both now come from one method, so they agree by construction rather than by
 * both having been written carefully.
 */
class Gw2PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            [100, 'Ascended Chestpiece'],
            [200, 'Deldrimor Steel Ingot'],
            [300, 'Mithril Ore'],
            // 103 rows in the real catalogue have an empty name. They are real
            // rows and useless pages.
            [400, ''],
        ] as [$id, $name]) {
            DB::table('gw2_items')->insert(['id' => $id, 'name' => $name, 'level' => 0]);
        }

        $this->recipe(1, 100, [[200, 2]]);

        /*
         * One item, two recipes — 105 items in the real catalogue are like this,
         * usually the same ingredients under a different discipline. This is the
         * shape that made the count wrong.
         */
        $this->recipe(2, 200, [[300, 3]], ['Armorsmith']);
        $this->recipe(3, 200, [[300, 3]], ['Leatherworker']);

        // A recipe whose output has no name at all.
        $this->recipe(4, 400, [[300, 1]]);
    }

    public function test_an_item_with_two_recipes_is_counted_once(): void
    {
        $ids = Gw2PublicController::craftableQuery()->orderBy('id')->pluck('id')->all();

        // Two craftable items with names, not three rows and not the nameless
        // one.
        $this->assertSame([100, 200], array_map('intval', $ids));
    }

    public function test_the_index_total_is_the_number_of_pages_that_exist(): void
    {
        $response = $this->getJson('/api/v1/gw2/public/craftable')->assertOk();

        $this->assertSame(2, $response->json('data.total'));
        $this->assertSame(1, $response->json('data.pages'));
        $this->assertCount(2, $response->json('data.items'));
    }

    public function test_the_sitemap_lists_exactly_what_the_index_reaches(): void
    {
        $body = $this->get('/sitemap-gw2.xml')->assertOk()->getContent();

        preg_match_all('#<loc>[^<]*/gw2/database/crafting/([^<]+)</loc>#', $body, $matches);

        // The three hub URLs plus one per craftable item, and nothing for the
        // item with no name.
        $this->assertSame(['100-ascended-chestpiece', '200-deldrimor-steel-ingot'], $matches[1]);
        $this->assertStringContainsString('/gw2/database/masteries</loc>', $body);
    }

    public function test_a_recipe_page_carries_the_tree_and_what_the_item_goes_into(): void
    {
        $response = $this->getJson('/api/v1/gw2/public/recipe/200')->assertOk();

        $this->assertSame('Deldrimor Steel Ingot', $response->json('data.item.name'));
        $this->assertSame('deldrimor-steel-ingot', $response->json('data.item.slug'));

        // Nothing subtracted: this is the page for somebody with no account.
        $this->assertSame(3, $response->json('data.materials.0.needed'));
        $this->assertSame('Mithril Ore', $response->json('data.materials.0.name'));

        // What it goes into is why a materials page is worth reading on its own.
        $this->assertSame('Ascended Chestpiece', $response->json('data.used_in.0.name'));
    }

    public function test_an_item_with_no_name_gets_no_page(): void
    {
        $this->getJson('/api/v1/gw2/public/recipe/400')->assertNotFound();
        $this->getJson('/api/v1/gw2/public/recipe/999999')->assertNotFound();
    }

    public function test_the_public_pages_need_no_account(): void
    {
        // No actingAs anywhere in this file. That is the point of the section:
        // connecting an account personalises these pages rather than unlocking
        // them.
        $this->getJson('/api/v1/gw2/public/masteries')->assertOk();
        $this->getJson('/api/v1/gw2/public/craftable')->assertOk();
        $this->getJson('/api/v1/gw2/public/recipe/100')->assertOk();
    }

    /** @param array<int, array{0: int, 1: int}> $ingredients */
    private function recipe(int $id, int $output, array $ingredients, array $disciplines = ['Armorsmith']): void
    {
        DB::table('gw2_recipes')->insert([
            'id' => $id,
            'output_item_id' => $output,
            'output_item_count' => 1,
            'ingredients' => json_encode(array_map(fn ($i) => ['item_id' => $i[0], 'count' => $i[1]], $ingredients)),
            'disciplines' => json_encode($disciplines),
            'min_rating' => 0,
        ]);
    }
}
