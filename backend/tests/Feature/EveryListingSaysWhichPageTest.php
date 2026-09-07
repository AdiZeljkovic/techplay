<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Game;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * One `pagination` block, on every listing endpoint.
 *
 * Measured on 7 September 2026, seven listing endpoints answered in six
 * shapes: a resource collection with the numbers under `meta`, a raw Laravel
 * paginator with them at the root, a hand-built `{count, next, previous,
 * results}`, this trait's own `{success, data, pagination}`, and two more.
 * `per_page` worked on one of the four that take a page size.
 *
 * The site never noticed, because every page was written against the endpoint
 * it reads and a page that reads one never discovers the next disagrees. An
 * app is one program reading all of them — and, once released, one that
 * cannot be redeployed to match a change.
 *
 * So the block is added everywhere, **beside** what each endpoint already
 * sends rather than instead of it. That is the whole safety of this change,
 * and it is what the second half of this file checks: the old keys have to
 * keep working, because thirty-one files on the site still read them.
 */
class EveryListingSaysWhichPageTest extends TestCase
{
    use RefreshDatabase;

    private function category(string $type): Category
    {
        $parent = Category::create(['name' => ucfirst($type), 'slug' => $type.'-root-'.uniqid(), 'type' => $type]);

        return Category::create([
            'name' => 'Leaf', 'slug' => $type.'-'.uniqid(), 'type' => $type, 'parent_id' => $parent->id,
        ]);
    }

    private function articles(string $type, int $count = 3): void
    {
        $category = $this->category($type);

        $author = User::factory()->create();

        for ($i = 0; $i < $count; $i++) {
            Article::factory()->create([
                'category_id' => $category->id,
                'author_id' => $author->id,
                'status' => 'published',
                'published_at' => now()->subDays($i + 1),
            ]);
        }
    }

    /** No factory for these two, so they are written out. */
    private function guide(): void
    {
        Guide::create([
            'author_id' => User::factory()->create()->id,
            'title' => 'A guide',
            'slug' => 'a-guide-'.uniqid(),
            'excerpt' => 'What it is about.',
            'content' => str_repeat('The body of the guide. ', 10),
            'status' => 'published',
            'published_at' => now()->subDay(),
        ]);
    }

    private function game(): void
    {
        Game::create([
            'slug' => 'a-game-'.uniqid(),
            'name' => 'A Game',
            'description' => str_repeat('A description long enough to be indexable. ', 3),
        ]);
    }

    /** @return array<string, array{string}> */
    public static function listings(): array
    {
        return [
            'news' => ['/api/v1/news'],
            'reviews' => ['/api/v1/reviews'],
            'tech' => ['/api/v1/tech'],
            'guides' => ['/api/v1/guides'],
            'games' => ['/api/v1/games'],
        ];
    }

    #[DataProvider('listings')]
    public function test_a_listing_states_which_page_it_is(string $path): void
    {
        $this->articles('news');
        $this->articles('reviews');
        $this->articles('tech');

        $this->guide();
        $this->game();

        $response = $this->getJson($path)->assertOk();

        $response->assertJsonStructure([
            'pagination' => ['total', 'per_page', 'current_page', 'last_page', 'from', 'to'],
        ]);

        $this->assertSame(1, $response->json('pagination.current_page'));
        $this->assertIsInt($response->json('pagination.last_page'));
    }

    /**
     * And every old key still answers.
     *
     * Thirty-one files on the site read `meta`, `results`, `pagination` or a
     * nested `data.data`. This change is additive precisely so none of them
     * has to move on the same day, and this is what proves it.
     */
    public function test_the_shapes_the_site_already_reads_are_untouched(): void
    {
        $this->articles('news');
        $this->guide();
        $this->game();

        // A resource collection: rows in `data`, numbers in `meta`.
        $this->getJson('/api/v1/news')
            ->assertOk()
            ->assertJsonStructure(['data', 'links', 'meta' => ['current_page', 'last_page']]);

        // A raw paginator: numbers at the root.
        $this->getJson('/api/v1/guides')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page']);

        // The count-and-next convention.
        $this->getJson('/api/v1/games')
            ->assertOk()
            ->assertJsonStructure(['count', 'next', 'previous', 'results']);
    }

    /**
     * The block agrees with the keys beside it.
     *
     * Two sources for one fact is how they drift. If `meta.last_page` and
     * `pagination.last_page` ever disagree, one of them is lying and a client
     * has no way to tell which.
     */
    public function test_the_new_block_agrees_with_the_old_keys(): void
    {
        $this->articles('news', 20);

        $body = $this->getJson('/api/v1/news')->assertOk()->json();

        $this->assertSame($body['meta']['current_page'], $body['pagination']['current_page']);
        $this->assertSame($body['meta']['last_page'], $body['pagination']['last_page']);
        $this->assertSame($body['meta']['total'], $body['pagination']['total']);
    }
}
