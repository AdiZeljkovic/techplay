<?php

namespace Tests\Feature;

use App\Services\RevalidationService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The backend half of the cache-invalidation chain had no test.
 *
 * Found in the audit of 29.08.2026: `api/revalidate` appeared in none of 125
 * test files. Everything downstream of a publish depends on this call landing,
 * and the chain has already broken twice in ways nothing caught — once because
 * the two halves disagreed on the header name and every purge came back 401,
 * once because an empty `paths: []` is truthy in JavaScript and swallowed the
 * request while answering "success".
 *
 * The Next.js route is TypeScript and out of reach here. What this pins is the
 * half PHP owns: the address, the header, the payload, and that a frontend
 * having a bad moment never takes the publish down with it.
 */
class RevalidationContractTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The names the service actually reads. Spelled wrong, `send()` logs
        // "missing configuration" and returns false without sending anything —
        // which is exactly how this could pass while purging nothing.
        config([
            'app.frontend_url' => 'https://frontend.test',
            'services.revalidate.secret_token' => 'test-secret',
        ]);
    }

    private function service(): RevalidationService
    {
        return new RevalidationService;
    }

    #[Test]
    public function it_posts_to_the_revalidate_endpoint(): void
    {
        Http::fake(['frontend.test/*' => Http::response(['revalidated' => true])]);

        $this->assertTrue($this->service()->revalidatePaths(['/news'], ['articles']));

        Http::assertSent(fn ($r) => $r->url() === 'https://frontend.test/api/revalidate' && $r->method() === 'POST');
    }

    #[Test]
    public function it_carries_the_shared_secret_in_the_header_the_frontend_reads(): void
    {
        Http::fake(['frontend.test/*' => Http::response(['revalidated' => true])]);

        $this->service()->revalidatePaths(['/news'], ['articles']);

        Http::assertSent(fn ($r) => ($r->header('x-revalidate-token')[0] ?? null) === 'test-secret');
    }

    /**
     * Tags, not just paths. `revalidatePath()` is a no-op for a dynamic route in
     * Next 16, which is how editing a GTA6 character changed everything except
     * that character's own page.
     */
    #[Test]
    public function it_sends_tags_alongside_paths(): void
    {
        Http::fake(['frontend.test/*' => Http::response(['revalidated' => true])]);

        $this->service()->revalidatePaths(['/gta6/characters/x'], ['gta6-character-x']);

        Http::assertSent(function ($r) {
            $body = $r->data();

            return in_array('gta6-character-x', $body['tags'] ?? [], true)
                && in_array('/gta6/characters/x', $body['paths'] ?? [], true);
        });
    }

    #[Test]
    public function an_article_purge_names_the_slug(): void
    {
        Http::fake(['frontend.test/*' => Http::response(['revalidated' => true])]);

        $this->service()->revalidateArticle('some-slug', 'news');

        Http::assertSent(fn ($r) => str_contains(json_encode($r->data()), 'some-slug'));
    }

    /** Nothing to purge is not a request. */
    #[Test]
    public function an_empty_call_sends_nothing(): void
    {
        Http::fake();

        $this->assertFalse($this->service()->revalidatePaths([], []));

        Http::assertNothingSent();
    }

    /**
     * A refusal has to be loud. The panel's log level is `error`, so a warning
     * here would be a message nobody ever reads — which is how a broken purge
     * stays invisible while the site serves stale pages.
     */
    #[Test]
    public function a_refused_purge_returns_false_and_is_logged_at_error(): void
    {
        Http::fake(['frontend.test/*' => Http::response('nope', 401)]);
        Log::spy();

        $this->assertFalse($this->service()->revalidatePaths(['/news'], ['articles']));

        Log::shouldHaveReceived('error')->atLeast()->once();
    }

    #[Test]
    public function an_unreachable_frontend_is_caught_rather_than_thrown(): void
    {
        Http::fake(fn () => throw new ConnectionException('no route to host'));

        // The article is already saved by the time this runs. A cache catching
        // up late is a smaller problem than an editor seeing a 500 and pressing
        // publish a second time.
        $this->assertFalse($this->service()->revalidatePaths(['/news'], ['articles']));
    }

    #[Test]
    public function missing_configuration_refuses_rather_than_pretending(): void
    {
        config(['services.revalidate.secret_token' => null, 'app.revalidation_secret' => null]);
        Http::fake();

        $this->assertFalse((new RevalidationService)->revalidatePaths(['/news'], ['articles']));

        Http::assertNothingSent();
    }
}
