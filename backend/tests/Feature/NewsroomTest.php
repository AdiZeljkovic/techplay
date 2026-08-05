<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * The furniture around the section pages.
 *
 * Four sections share one endpoint, and three of the four are the same table
 * with a different category type on it. What is worth pinning down is the
 * places where they are not the same: guides come from another model, the
 * spotlight follows a flag editors already use, and each section must not leak
 * into its neighbours.
 */
class NewsroomTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    /**
     * The test database is seeded with the site's real categories, so these
     * reach for the existing row rather than colliding with it.
     */
    private function category(string $type, string $slug, string $name): Category
    {
        return Category::firstOrCreate(['slug' => $slug], ['name' => $name, 'type' => $type]);
    }

    private function article(Category $category, array $attributes = []): Article
    {
        return Article::create(array_merge([
            'title' => 'A headline',
            'slug' => 'a-headline-'.uniqid(),
            'excerpt' => 'Something happened.',
            'content' => 'Something happened, at length.',
            'status' => 'published',
            'published_at' => now()->subDay(),
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'featured_image_url' => 'articles/art.jpg',
        ], $attributes));
    }

    public function test_a_section_only_reports_its_own_categories(): void
    {
        $this->article($this->category('news', 'news-pc', 'PC'));
        $this->article($this->category('reviews', 'reviews-retro', 'Retro'));

        $news = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data');

        $this->assertSame(['news-pc'], array_column($news['categories'], 'slug'));
        $this->assertSame(1, $news['stats']['articles']);
    }

    public function test_a_category_nobody_has_written_for_is_left_out_of_the_tab_row(): void
    {
        $used = $this->category('news', 'news-pc', 'PC');
        $this->category('news', 'news-e-sport', 'Esports');
        $this->article($used);

        $categories = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data.categories');

        $this->assertSame(['news-pc'], array_column($categories, 'slug'));
    }

    public function test_the_tab_count_ignores_drafts_and_the_future(): void
    {
        $category = $this->category('news', 'news-pc', 'PC');

        $this->article($category);
        $this->article($category, ['status' => 'draft']);
        $this->article($category, ['published_at' => now()->addWeek()]);

        $data = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data');

        $this->assertSame(1, $data['categories'][0]['count']);
        $this->assertSame(1, $data['stats']['articles']);
    }

    public function test_the_spotlight_follows_the_flag_editors_already_set(): void
    {
        $category = $this->category('news', 'news-pc', 'PC');

        $this->article($category, ['title' => 'Newer, but nobody flagged it']);
        $this->article($category, [
            'title' => 'The one they chose',
            'published_at' => now()->subMonth(),
            'is_featured_in_hero' => true,
        ]);

        $featured = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data.featured');

        $this->assertSame('The one they chose', $featured['title']);
    }

    public function test_with_nothing_flagged_the_newest_piece_with_art_leads(): void
    {
        $category = $this->category('tech', 'tech-benchmarks', 'Benchmarks');

        $this->article($category, ['title' => 'Older', 'published_at' => now()->subMonth()]);
        $this->article($category, ['title' => 'Newest but bare', 'featured_image_url' => null]);

        $featured = $this->getJson('/api/v1/newsroom/tech')->assertOk()->json('data.featured');

        $this->assertSame('Older', $featured['title']);
    }

    public function test_a_relative_image_path_comes_back_resolved(): void
    {
        $this->article($this->category('news', 'news-pc', 'PC'), ['featured_image_url' => 'articles/art.jpg']);

        $featured = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data.featured');

        $this->assertStringStartsWith('http', $featured['featured_image_url']);
        $this->assertStringEndsWith('/storage/articles/art.jpg', $featured['featured_image_url']);
    }

    public function test_an_absolute_image_url_is_left_alone(): void
    {
        $this->article($this->category('news', 'news-pc', 'PC'), [
            'featured_image_url' => 'https://cdn.example.test/art.jpg',
        ]);

        $featured = $this->getJson('/api/v1/newsroom/news')->assertOk()->json('data.featured');

        $this->assertSame('https://cdn.example.test/art.jpg', $featured['featured_image_url']);
    }

    public function test_guides_come_from_their_own_table_and_tab_by_difficulty(): void
    {
        $author = User::factory()->create();

        foreach ([['beginner', 'Getting started'], ['beginner', 'Also easy'], ['advanced', 'The hard way']] as [$difficulty, $title]) {
            Guide::create([
                'title' => $title,
                'slug' => str($title)->slug()->toString(),
                'excerpt' => 'How to.',
                'content' => 'How to, at length.',
                'difficulty' => $difficulty,
                'status' => 'published',
                'published_at' => now()->subDay(),
                'author_id' => $author->id,
            ]);
        }

        $data = $this->getJson('/api/v1/newsroom/guides')->assertOk()->json('data');

        $this->assertSame(
            ['beginner' => 2, 'advanced' => 1],
            array_column($data['categories'], 'count', 'slug')
        );
        $this->assertSame('Beginner', $data['categories'][0]['name']);
        $this->assertSame(3, $data['stats']['articles']);
    }

    public function test_an_unknown_section_is_a_404_rather_than_an_empty_page(): void
    {
        $this->getJson('/api/v1/newsroom/videos')->assertNotFound();
    }

    public function test_a_section_with_nothing_in_it_answers_honestly(): void
    {
        $data = $this->getJson('/api/v1/newsroom/reviews')->assertOk()->json('data');

        $this->assertSame([], $data['categories']);
        $this->assertNull($data['featured']);
        $this->assertSame([], $data['most_read']);
        $this->assertSame(0, $data['stats']['articles']);
        $this->assertSame(0, $data['stats']['authors']);
    }
}
