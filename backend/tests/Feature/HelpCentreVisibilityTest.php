<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Who is allowed to read a help answer.
 *
 * Two ways a page can be withdrawn and they are not the same. An answer can be
 * pulled back on its own — the usual case, a correction in progress. Or a whole
 * topic can be hidden, which is how a subject goes away: a store integration
 * that broke, a feature that was removed.
 *
 * The second is the one that goes wrong quietly. Without `scopeVisible()` every
 * answer inside a hidden topic stays reachable at its own URL while the topic
 * page 404s around it — so a reader arriving from search is answered by a page
 * the site believes it has taken down, and nobody finds out because the link
 * they followed still works.
 */
class HelpCentreVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private function topic(bool $published = true): HelpCategory
    {
        return HelpCategory::create([
            'name' => 'Connected accounts',
            'slug' => 'connections-'.uniqid(),
            'is_published' => $published,
        ]);
    }

    private function answer(HelpCategory $topic, array $attributes = []): HelpArticle
    {
        return HelpArticle::create(array_merge([
            'help_category_id' => $topic->id,
            'title' => 'Your Steam library is not syncing',
            'slug' => 'steam-not-syncing-'.uniqid(),
            'content' => '<p>Check both privacy switches.</p>',
            'status' => 'published',
            'published_at' => now()->subHour(),
        ], $attributes));
    }

    #[Test]
    public function a_published_answer_in_a_published_topic_is_visible(): void
    {
        $article = $this->answer($this->topic());

        $this->assertTrue(HelpArticle::visible()->whereKey($article->id)->exists());
    }

    /** The desk parks work in both of these, and neither is finished. */
    #[Test]
    #[DataProvider('unfinishedStates')]
    public function an_unfinished_answer_is_not_visible(string $status): void
    {
        $article = $this->answer($this->topic(), ['status' => $status]);

        $this->assertFalse(HelpArticle::visible()->whereKey($article->id)->exists());
    }

    public static function unfinishedStates(): array
    {
        return [
            'draft' => ['draft'],
            'ready for review' => ['ready_for_review'],
        ];
    }

    /** A date set ahead of time has to behave the way whoever set it expected. */
    #[Test]
    public function an_answer_dated_in_the_future_is_not_visible_yet(): void
    {
        $article = $this->answer($this->topic(), ['published_at' => now()->addDay()]);

        $this->assertFalse(HelpArticle::visible()->whereKey($article->id)->exists());
    }

    /**
     * The one this class exists for.
     */
    #[Test]
    public function hiding_a_topic_takes_its_published_answers_with_it(): void
    {
        $topic = $this->topic();
        $article = $this->answer($topic);

        $this->assertTrue(HelpArticle::visible()->whereKey($article->id)->exists());

        $topic->update(['is_published' => false]);

        $this->assertFalse(
            HelpArticle::visible()->whereKey($article->id)->exists(),
            'the topic was hidden and its answer is still readable at its own URL'
        );
    }

    /**
     * `published()` and `visible()` are deliberately different scopes, and the
     * difference is not decorative: the sitemap and the admin table ask about
     * the answer's own state, while every public read has to ask about the
     * topic too. If these two ever collapse into one, one of those callers is
     * getting the wrong answer.
     */
    #[Test]
    public function the_sitemap_still_sees_an_answers_own_state(): void
    {
        $article = $this->answer($this->topic(published: false));

        $this->assertTrue(HelpArticle::published()->whereKey($article->id)->exists());
        $this->assertFalse(HelpArticle::visible()->whereKey($article->id)->exists());
    }

    /** Deleting a topic must not leave its answers behind as orphans. */
    #[Test]
    public function deleting_a_topic_removes_its_answers(): void
    {
        $topic = $this->topic();
        $article = $this->answer($topic);

        $topic->delete();

        $this->assertDatabaseMissing('help_articles', ['id' => $article->id]);
    }
}
