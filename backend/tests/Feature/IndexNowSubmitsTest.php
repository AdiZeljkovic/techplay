<?php

namespace Tests\Feature;

use App\Jobs\SubmitIndexNow;
use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * IndexNow actually submits.
 *
 * Worth a test for a reason that is not the usual one. The job was correct —
 * it built the right payload, pointed at the right host, handled failures —
 * and it submitted nothing for months, because it opened with a check on a
 * `seo_indexnow_enabled` setting that nothing in the codebase ever created.
 * No seeder, no migration, no field on the settings screen. The row did not
 * exist, `SiteSetting::get()` returned null, and the job returned on its first
 * line, before any logging.
 *
 * So the thing to pin is not the payload. It is that a job dispatched with a
 * key configured **sends a request**. A test that only checked the body would
 * have passed the entire time the feature was dead.
 */
class IndexNowSubmitsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The site the pages live on, which is not the API host the app runs
        // as. Getting those two confused is what made an earlier version
        // announce techplay.gg pages under api-beta.techplay.gg.
        config()->set('app.site_url', 'https://techplay.gg');
    }

    public function test_a_configured_key_is_all_it_takes_to_submit(): void
    {
        Http::fake(['api.indexnow.org/*' => Http::response('', 200)]);

        SiteSetting::set('seo_indexnow_key', 'tpa9b101305719373599aa6059256cd435');

        (new SubmitIndexNow('https://techplay.gg/news/some-article'))->handle();

        Http::assertSent(function ($request) {
            $body = $request->data();

            /*
             * The host has to match the pages being announced. IndexNow
             * rejects a submission whose `host` is not the host of the URLs,
             * and this once sent api-beta.techplay.gg while announcing
             * techplay.gg pages.
             */
            $this->assertSame('techplay.gg', $body['host']);
            $this->assertSame('https://techplay.gg/tpa9b101305719373599aa6059256cd435.txt', $body['keyLocation']);
            $this->assertSame(['https://techplay.gg/news/some-article'], $body['urlList']);

            return true;
        });
    }

    public function test_without_a_key_it_sends_nothing_and_says_so(): void
    {
        Http::fake();

        // No key configured at all — the one state in which silence is right.
        (new SubmitIndexNow('https://techplay.gg/news/some-article'))->handle();

        Http::assertNothingSent();
    }

    public function test_a_batch_goes_in_one_request(): void
    {
        Http::fake(['api.indexnow.org/*' => Http::response('', 200)]);

        SiteSetting::set('seo_indexnow_key', 'tpa9b101305719373599aa6059256cd435');

        (new SubmitIndexNow([
            'https://techplay.gg/news/one',
            'https://techplay.gg/reviews/two',
        ]))->handle();

        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => count($request->data()['urlList']) === 2);
    }
}
