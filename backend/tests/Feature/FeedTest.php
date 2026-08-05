<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The one stream, and the same stream reordered around a reader.
 *
 * The cases worth holding down are the ones that were wrong before: the
 * section names the filter accepts, guides being in the stream at all, and a
 * personalised feed admitting when it has nothing to personalise with.
 */
class FeedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    private function category(string $type, string $slug): Category
    {
        return Category::firstOrCreate(['slug' => $slug], ['name' => ucfirst($slug), 'type' => $type]);
    }

    private function article(Category $category, array $attributes = []): Article
    {
        return Article::create(array_merge([
            'title' => 'A headline',
            'slug' => 'a-headline-'.uniqid(),
            'excerpt' => 'Something happened.',
            'content' => 'At length.',
            'status' => 'published',
            'published_at' => now()->subDay(),
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
        ], $attributes));
    }

    private function guide(array $attributes = []): Guide
    {
        return Guide::create(array_merge([
            'title' => 'How to',
            'slug' => 'how-to-'.uniqid(),
            'excerpt' => 'A walkthrough.',
            'content' => 'At length.',
            'difficulty' => 'beginner',
            'status' => 'published',
            'published_at' => now()->subDays(2),
            'author_id' => User::factory()->create()->id,
        ], $attributes));
    }

    public function test_the_stream_carries_articles_and_guides_together(): void
    {
        $this->article($this->category('news', 'news-pc'));
        $this->guide();

        $items = $this->getJson('/api/v1/feed/latest')->assertOk()->json('data.items');

        $this->assertEqualsCanonicalizing(['article', 'guide'], array_column($items, 'kind'));
    }

    public function test_reviews_are_in_the_stream(): void
    {
        // The filter used to be spelled 'review', which is not a category type,
        // so every review was quietly left out of "everything".
        $this->article($this->category('reviews', 'reviews-retro'), ['title' => 'A review']);

        $all = $this->getJson('/api/v1/feed/latest')->assertOk()->json('data.items');
        $only = $this->getJson('/api/v1/feed/latest?type=reviews')->assertOk()->json('data');

        $this->assertContains('A review', array_column($all, 'title'));
        $this->assertSame(1, $only['meta']['total']);
    }

    public function test_the_old_singular_filter_names_still_work(): void
    {
        $this->article($this->category('reviews', 'reviews-retro'));

        $this->getJson('/api/v1/feed/latest?type=review')->assertOk()->assertJsonPath('data.meta.total', 1);
    }

    public function test_an_unknown_filter_is_refused_rather_than_answered_with_nothing(): void
    {
        $this->getJson('/api/v1/feed/latest?type=invented')->assertStatus(422);
    }

    public function test_each_section_is_linked_where_it_actually_lives(): void
    {
        $this->article($this->category('tech', 'tech-benchmarks'), ['slug' => 'a-gpu']);

        $item = $this->getJson('/api/v1/feed/latest?type=tech')->assertOk()->json('data.items.0');

        $this->assertSame('/hardware/a-gpu', $item['url']);
    }

    public function test_drafts_and_the_future_stay_out(): void
    {
        $category = $this->category('news', 'news-pc');

        $this->article($category);
        $this->article($category, ['status' => 'draft']);
        $this->article($category, ['published_at' => now()->addWeek()]);

        $this->getJson('/api/v1/feed/latest')->assertOk()->assertJsonPath('data.meta.total', 1);
    }

    public function test_the_personal_feed_is_for_signed_in_readers_only(): void
    {
        $this->getJson('/api/v1/feed/personalized')->assertUnauthorized();
    }

    public function test_a_reader_we_know_nothing_about_is_told_so(): void
    {
        $this->article($this->category('news', 'news-pc'));
        Sanctum::actingAs(User::factory()->create());

        $body = $this->getJson('/api/v1/feed/personalized')->assertOk()->json('data');

        $this->assertFalse($body['personalised']);
        $this->assertSame([], $body['interests']);
        $this->assertNotEmpty($body['items']);
    }

    public function test_reading_something_pulls_its_subject_up_the_feed(): void
    {
        $category = $this->category('news', 'news-pc');
        $user = User::factory()->create();

        $read = $this->article($category, ['title' => 'Soulslike deep dive', 'tags' => ['soulslike']]);
        $this->article($category, ['title' => 'Unrelated but newer', 'published_at' => now(), 'tags' => ['farming']]);
        $this->article($category, ['title' => 'Another soulslike', 'published_at' => now()->subWeek(), 'tags' => ['soulslike']]);

        DB::table('article_reads')->insert([
            'user_id' => $user->id,
            'article_id' => $read->id,
            'progress' => 90,
            'last_read_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);
        $body = $this->getJson('/api/v1/feed/personalized')->assertOk()->json('data');

        $this->assertTrue($body['personalised']);
        $this->assertSame('Another soulslike', $body['items'][0]['title']);
        $this->assertStringContainsString('soulslike', $body['items'][0]['reason']);
        $this->assertContains('soulslike', $body['interests']);
    }

    public function test_what_you_have_already_read_is_not_offered_again(): void
    {
        $category = $this->category('news', 'news-pc');
        $user = User::factory()->create();
        $read = $this->article($category, ['title' => 'Already read', 'tags' => ['soulslike']]);
        $this->article($category, ['title' => 'Not yet read', 'tags' => ['soulslike']]);

        DB::table('article_reads')->insert([
            'user_id' => $user->id,
            'article_id' => $read->id,
            'progress' => 100,
            'last_read_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);
        $titles = array_column($this->getJson('/api/v1/feed/personalized')->assertOk()->json('data.items'), 'title');

        $this->assertNotContains('Already read', $titles);
        $this->assertContains('Not yet read', $titles);
    }

    public function test_a_relative_image_path_comes_back_resolved(): void
    {
        $this->article($this->category('news', 'news-pc'), ['featured_image_url' => 'articles/art.jpg']);

        $item = $this->getJson('/api/v1/feed/latest')->assertOk()->json('data.items.0');

        $this->assertStringEndsWith('/storage/articles/art.jpg', $item['featured_image_url']);
    }
}
