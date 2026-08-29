<?php

namespace Tests\Feature;

use App\Jobs\SubmitIndexNow;
use App\Models\Article;
use App\Models\Category;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * One ping, from the host that owns the pages.
 *
 * IndexNow had five implementations: inline copies in the article, guide and
 * game observers, the job, and a service nothing called. The three inline ones
 * read the key from the environment while the job read it from the site
 * settings, and the two values were different strings — so half the
 * submissions authenticated with a key whose file is served only because
 * somebody left a static copy behind.
 *
 * The protocol's own rule is the part that was broken everywhere: the key file
 * has to sit on the same host as the URLs being submitted. The job built both
 * `host` and `keyLocation` from `app.url`, which is the API domain, while every
 * URL it submitted was a frontend one. The comment beside the line even read
 * "e.g. techplay.gg" while producing api-beta.techplay.gg.
 */
class IndexNowSubmitsOnceAndFromOneHostTest extends TestCase
{
    use RefreshDatabase;

    private function publishArticle(string $categoryType = 'news'): Article
    {
        $category = Category::firstOrCreate(
            ['slug' => $categoryType.'-indexnow'],
            ['name' => ucfirst($categoryType), 'type' => $categoryType],
        );

        return Article::factory()->create([
            'category_id' => $category->id,
            'author_id' => User::factory()->create()->id,
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function test_publishing_submits_exactly_one_url(): void
    {
        Queue::fake();

        $this->publishArticle();

        Queue::assertPushed(SubmitIndexNow::class, 1);
    }

    /**
     * The section in the URL has to be the one the page is served under.
     *
     * Everything that was not a review went out as /news/, so hardware pieces
     * were announced to Bing at an address that answers 404.
     */
    public function test_a_hardware_article_is_submitted_under_hardware(): void
    {
        Queue::fake();

        $article = $this->publishArticle('tech');

        Queue::assertPushed(function (SubmitIndexNow $job) use ($article) {
            return in_array(
                rtrim((string) config('app.site_url'), '/')."/hardware/{$article->slug}",
                (array) $job->urls,
                true,
            );
        });
    }

    public function test_the_key_file_is_claimed_on_the_same_host_as_the_urls(): void
    {
        Http::fake(['api.indexnow.org/*' => Http::response('', 200)]);

        SiteSetting::updateOrCreate(['key' => 'seo_indexnow_enabled'], ['value' => '1']);
        SiteSetting::updateOrCreate(['key' => 'seo_indexnow_key'], ['value' => 'tpaaaabbbbccccddddeeeeffff11']);

        $site = rtrim((string) config('app.site_url'), '/');

        (new SubmitIndexNow("{$site}/news/probni-clanak"))->handle();

        Http::assertSent(function ($request) use ($site) {
            $host = parse_url($site, PHP_URL_HOST);

            return $request['host'] === $host
                && str_starts_with((string) $request['keyLocation'], $site.'/')
                && parse_url($request['urlList'][0], PHP_URL_HOST) === $host;
        });
    }
}
