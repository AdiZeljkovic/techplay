<?php

namespace Tests\Feature;

use App\Models\Guide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * A guide nobody has published is nobody's to read.
 *
 * `guides.status` defaults to `draft` and the desk also parks work as
 * `ready_for_review`, but the public endpoints asked only for the slug. So
 * /guides listed unfinished drafts alongside the real thing and
 * /guides/{slug} served them in full — half-written text, under a byline, to
 * anyone who asked. Every other reader of this table already drew the line: the
 * newsroom, the sitemap, the author page. The public API was the one that did
 * not.
 *
 * The listing assertions go through HTTP because that is where the fault was
 * visible, and the cache is flushed first so a hit cannot answer for the query.
 */
class UnpublishedGuidesStayPrivateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    private function guide(array $attributes = []): Guide
    {
        return Guide::create(array_merge([
            'title' => 'Test guide',
            'slug' => 'test-guide-'.uniqid(),
            'content' => '<p>Body</p>',
            'excerpt' => 'Short',
            'difficulty' => 'beginner',
            'author_id' => User::factory()->create()->id,
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $attributes));
    }

    public static function unpublishedStates(): array
    {
        return [
            'draft' => ['draft'],
            'awaiting review' => ['ready_for_review'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('unpublishedStates')]
    public function test_an_unpublished_guide_is_absent_from_the_listing(string $status): void
    {
        $hidden = $this->guide(['status' => $status]);
        $visible = $this->guide();

        $slugs = collect($this->getJson('/api/v1/guides')->assertOk()->json('data'))
            ->pluck('slug');

        $this->assertTrue($slugs->contains($visible->slug), 'The published guide went missing.');
        $this->assertFalse($slugs->contains($hidden->slug), "A {$status} guide was listed publicly.");
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('unpublishedStates')]
    public function test_an_unpublished_guide_cannot_be_read_directly(string $status): void
    {
        $guide = $this->guide(['status' => $status]);

        $this->getJson('/api/v1/guides/'.$guide->slug)->assertNotFound();
    }

    /**
     * A date set for later is a decision, not a formality.
     */
    public function test_a_guide_dated_into_the_future_is_not_public_yet(): void
    {
        $guide = $this->guide(['published_at' => now()->addDay()]);

        $this->getJson('/api/v1/guides/'.$guide->slug)->assertNotFound();
    }

    public function test_a_published_guide_is_still_served(): void
    {
        $guide = $this->guide();

        $this->getJson('/api/v1/guides/'.$guide->slug)
            ->assertOk()
            ->assertJsonPath('guide.slug', $guide->slug);
    }

    /**
     * Withdrawing a guide has to take the cached copy with it.
     *
     * Reading it first is the whole point: without the observer clearing the
     * key, the API would keep answering 200 from Redis for an hour after the
     * desk pulled the piece, and the status filter above would never be
     * consulted.
     */
    public function test_a_guide_pulled_back_stops_answering_even_though_it_was_cached(): void
    {
        $guide = $this->guide();

        $this->getJson('/api/v1/guides/'.$guide->slug)->assertOk();

        $guide->update(['status' => 'draft']);

        $this->getJson('/api/v1/guides/'.$guide->slug)->assertNotFound();
    }
}
