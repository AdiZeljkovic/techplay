<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use App\Services\SchemaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The structured data `SchemaService` produces for a review.
 *
 * It produced none. Two independent reasons, either of which was enough:
 *
 *   1. `if (! $article->review_rating || $article->category !== 'reviews')` —
 *      `$article->category` is a Category model, and a model is never the
 *      string `'reviews'`, so the guard fired on every call ever made. The
 *      HowTo block had the same line with `'guides'`.
 *   2. `review_rating` was a column no review has ever filled. The score has
 *      always been in `review_score` and the verdict in `review_data`.
 *
 * Neither could be seen from the outside, because the endpoint that calls this
 * has no consumer — the site writes its own JSON-LD in the page. That is what
 * makes it worth a test rather than a look.
 */
class ReviewSchemaTest extends TestCase
{
    use RefreshDatabase;

    private function review(array $attributes = []): Article
    {
        $parent = Category::create(['name' => 'Reviews', 'slug' => 'reviews-root-'.uniqid(), 'type' => 'reviews']);
        $category = Category::create([
            'name' => 'AAA Titles', 'slug' => 'reviews-'.uniqid(), 'type' => 'reviews', 'parent_id' => $parent->id,
        ]);

        return Article::factory()->create(array_merge([
            'title' => 'Metaphor: ReFantazio review',
            'category_id' => $category->id,
            'author_id' => User::factory()->create(['username' => 'adi'])->id,
            'status' => 'published',
            'is_featured_in_hero' => false,
            'review_score' => 8.5,
            'review_data' => [
                'pros' => ['Combat has real teeth', 'The soundtrack'],
                'cons' => ['Long stretches of menus'],
            ],
        ], $attributes))->fresh();
    }

    public function test_a_review_now_produces_a_rating(): void
    {
        $schema = SchemaService::getReviewSchema($this->review());

        $this->assertNotNull($schema, 'the guard used to fire on every call');
        $this->assertSame('Review', $schema['@type']);
        $this->assertSame('8.5', $schema['reviewRating']['ratingValue']);
        $this->assertSame('10', $schema['reviewRating']['bestRating']);
    }

    public function test_the_verdict_comes_from_review_data(): void
    {
        $schema = SchemaService::getReviewSchema($this->review());

        $this->assertSame(['Combat has real teeth', 'The soundtrack'], $schema['positiveNotes']);
        $this->assertSame(['Long stretches of menus'], $schema['negativeNotes']);
    }

    public function test_an_unscored_review_still_produces_nothing(): void
    {
        $this->assertNull(SchemaService::getReviewSchema($this->review(['review_score' => null])));
    }

    /**
     * The guard has to actually guard: a news article is not a review, and
     * before the fix the comparison was incapable of telling them apart in
     * either direction.
     */
    public function test_a_news_article_is_not_given_a_review_schema(): void
    {
        $parent = Category::create(['name' => 'News', 'slug' => 'news-root-'.uniqid(), 'type' => 'news']);
        $category = Category::create([
            'name' => 'Gaming', 'slug' => 'news-'.uniqid(), 'type' => 'news', 'parent_id' => $parent->id,
        ]);

        $article = Article::factory()->create([
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'is_featured_in_hero' => false,
            'review_score' => 8.5,
        ])->fresh();

        $this->assertNull(SchemaService::getReviewSchema($article));
    }
}
