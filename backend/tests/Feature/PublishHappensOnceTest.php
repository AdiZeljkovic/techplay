<?php

namespace Tests\Feature;

use App\Jobs\PublishArticleFanout;
use App\Models\Article;
use App\Models\BountyTransaction;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Publishing an article is one event, however many times the code is asked.
 *
 * It was two. `ArticleObserver` was registered in AppServiceProvider and again
 * in `Article::booted()`, and Laravel appends a listener per registration rather
 * than deduplicating — so every publish announced itself to Discord twice,
 * notified every tracker and wishlister twice, submitted itself to IndexNow
 * twice, and paid its author twice. The ledger recorded it plainly: the same
 * article credited 38 bounty at 23:51:21 and again at 23:51:22 on 27 Aug 2026.
 *
 * Re-publishing was the second door. The fan-out treats `wasChanged('status')`
 * as "newly published", which is true again when a piece is pulled back for a
 * correction and sent out afterwards, so a retraction paid the author on the way
 * back out.
 *
 * These assertions are about counts, not mechanisms: one dispatch, one payout.
 * A future registration added in a third place fails them without anybody having
 * to remember why this file exists.
 */
class PublishHappensOnceTest extends TestCase
{
    use RefreshDatabase;

    private function article(array $attributes = []): Article
    {
        $category = Category::firstOrCreate(
            ['slug' => 'news-publish-once'],
            ['name' => 'News', 'type' => 'news'],
        );

        return Article::factory()->create(array_merge([
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'status' => 'draft',
        ], $attributes));
    }

    public function test_publishing_dispatches_the_fan_out_once(): void
    {
        $article = $this->article();

        Queue::fake();

        $article->update(['status' => 'published', 'published_at' => now()]);

        Queue::assertPushed(PublishArticleFanout::class, 1);
    }

    public function test_the_author_is_paid_once_per_article(): void
    {
        $article = $this->article();

        $article->update(['status' => 'published', 'published_at' => now()]);

        $paid = BountyTransaction::where('user_id', $article->author_id)
            ->where('reference', "article:{$article->id}:published")
            ->count();

        $this->assertSame(1, $paid, 'A single publish paid the author more than once.');
    }

    public function test_pulling_an_article_back_and_publishing_it_again_does_not_pay_twice(): void
    {
        $article = $this->article();

        $article->update(['status' => 'published', 'published_at' => now()]);
        $article->update(['status' => 'draft']);
        $article->update(['status' => 'published']);

        $paid = BountyTransaction::where('user_id', $article->author_id)
            ->where('reference', "article:{$article->id}:published")
            ->count();

        $this->assertSame(1, $paid, 'A retraction and re-publish paid the author again.');
    }

    /**
     * The scheduler's own path, which used to bypass all of this.
     *
     * `articles:publish-scheduled` flipped the status with a query-builder
     * update, which fires no model events: no cache cleared, no ISR purge, no
     * sitemap, no IndexNow, no Discord, no notifications, no payout. The article
     * became published in the database and reached readers only when some
     * listing TTL happened to lapse.
     */
    public function test_a_scheduled_article_publishes_through_the_observers(): void
    {
        $article = $this->article([
            'status' => 'scheduled',
            'published_at' => now()->subMinute(),
        ]);

        Queue::fake();

        $this->artisan('articles:publish-scheduled')->assertSuccessful();

        $this->assertSame('published', $article->fresh()->status);
        Queue::assertPushed(PublishArticleFanout::class, 1);
    }

    public function test_an_article_scheduled_for_later_is_left_alone(): void
    {
        $article = $this->article([
            'status' => 'scheduled',
            'published_at' => now()->addHour(),
        ]);

        $this->artisan('articles:publish-scheduled')->assertSuccessful();

        $this->assertSame('scheduled', $article->fresh()->status);
    }
}
