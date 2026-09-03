<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Models\HelpCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

/**
 * What the help centre serves, and what it refuses to serve.
 *
 * The rule this file exists to hold is `scopeVisible()`: an answer is only
 * public if its **topic** is too. Hiding a topic is how an editor takes a whole
 * subject down — a store integration that broke, a feature pulled back — and
 * every one of these endpoints has to honour that, including the sitemap. Get
 * it wrong in one place and a withdrawn page keeps answering readers from
 * search while the topic page 404s around it.
 */
class HelpCentreApiTest extends TestCase
{
    use RefreshDatabase;

    private function topic(array $attributes = []): HelpCategory
    {
        static $n = 0;
        $n++;

        return HelpCategory::create(array_merge([
            'name' => 'Connected accounts',
            'slug' => 'connections-'.$n,
            'description' => 'Steam, Xbox, PlayStation, GOG and Epic.',
            'sort_order' => $n,
            'is_published' => true,
        ], $attributes));
    }

    private function answer(HelpCategory $topic, array $attributes = []): HelpArticle
    {
        static $n = 0;
        $n++;

        return HelpArticle::create(array_merge([
            'help_category_id' => $topic->id,
            'title' => 'Your Steam library is not syncing',
            'slug' => 'steam-library-is-not-syncing-'.$n,
            'excerpt' => 'Both privacy switches have to be public.',
            'content' => '<p>Open Steam, then Privacy Settings.</p>',
            'status' => 'published',
            'published_at' => now()->subDay(),
        ], $attributes));
    }

    // ------------------------------------------------------------- the index

    public function test_the_index_returns_published_topics_with_their_answers(): void
    {
        $topic = $this->topic(['name' => 'Connected accounts']);
        $this->answer($topic, ['title' => 'Connect your GOG account']);

        $response = $this->getJson('/api/v1/help')->assertOk();

        $response->assertJsonPath('data.topics.0.name', 'Connected accounts');
        $response->assertJsonPath('data.topics.0.articles.0.title', 'Connect your GOG account');
        // The path is relative: every reader of this endpoint is already on
        // help.techplay.gg, and a link naming its own hostname breaks the day
        // the hostname changes.
        $response->assertJsonPath(
            'data.topics.0.articles.0.url',
            '/'.$topic->slug.'/'.$topic->articles()->first()->slug
        );
    }

    public function test_the_index_leaves_out_hidden_topics_drafts_and_empty_topics(): void
    {
        $hidden = $this->topic(['name' => 'Withdrawn subject', 'is_published' => false]);
        $this->answer($hidden, ['title' => 'Inside a hidden topic']);

        $draftsOnly = $this->topic(['name' => 'Nothing published yet']);
        $this->answer($draftsOnly, ['title' => 'Still a draft', 'status' => 'draft']);

        $real = $this->topic(['name' => 'Account and sign-in']);
        $this->answer($real, ['title' => 'The Create account button is greyed out']);

        $response = $this->getJson('/api/v1/help')->assertOk();

        $response->assertJsonCount(1, 'data.topics');
        $response->assertJsonPath('data.topics.0.name', 'Account and sign-in');
        // A topic card that promises help and opens on an empty page is a dead
        // end, so a topic with nothing published in it is left out entirely.
        $response->assertDontSee('Nothing published yet');
        $response->assertDontSee('Inside a hidden topic');
        $response->assertDontSee('Still a draft');
    }

    // -------------------------------------------------------------- a topic

    public function test_a_hidden_topic_is_a_404_not_an_empty_page(): void
    {
        $topic = $this->topic(['is_published' => false]);

        $this->getJson('/api/v1/help/topics/'.$topic->slug)->assertNotFound();
    }

    /**
     * And so is a topic that exists but has nothing published in it.
     *
     * The index and the sitemap already leave those out. The topic's own
     * address used to answer 200 with a page saying there was nothing on it,
     * which is a soft 404 — filed as thin rather than absent, and shipped in
     * quantity whenever an editor is part-way through publishing a backlog.
     */
    public function test_a_topic_with_nothing_published_in_it_is_a_404(): void
    {
        $topic = $this->topic();
        $this->answer($topic, ['status' => 'draft']);

        $this->getJson('/api/v1/help/topics/'.$topic->slug)->assertNotFound();

        // And answers as soon as one of them goes up.
        $this->answer($topic, ['title' => 'Now there is something']);

        $this->getJson('/api/v1/help/topics/'.$topic->slug)
            ->assertOk()
            ->assertJsonCount(1, 'data.articles');
    }

    // ------------------------------------------------------------- an answer

    public function test_an_answer_carries_its_topic_and_the_rest_of_that_topic(): void
    {
        $topic = $this->topic(['name' => 'Connected accounts']);
        $subject = $this->answer($topic, ['title' => 'Your Steam library is not syncing']);
        $this->answer($topic, ['title' => 'Connect your Xbox account']);
        // A neighbour in a different topic is not "related".
        $this->answer($this->topic(['name' => 'Email']), ['title' => 'Stop getting emails']);

        $response = $this->getJson('/api/v1/help/answers/'.$subject->slug)->assertOk();

        $response->assertJsonPath('data.article.title', 'Your Steam library is not syncing');
        $response->assertJsonPath('data.topic.name', 'Connected accounts');
        $response->assertJsonCount(1, 'data.related');
        $response->assertJsonPath('data.related.0.title', 'Connect your Xbox account');
    }

    /**
     * The rule, at the endpoint that matters most.
     *
     * This answer is published and perfectly valid on its own. Its topic is
     * not, and its URL contains that topic's slug — so the page it would be
     * reached through does not exist. Serving it anyway is how a section the
     * site believes it has withdrawn keeps answering people from Google.
     */
    public function test_a_published_answer_inside_a_hidden_topic_is_not_served(): void
    {
        $article = $this->answer($this->topic(['is_published' => false]));

        $this->getJson('/api/v1/help/answers/'.$article->slug)->assertNotFound();
    }

    public function test_reading_an_answer_buffers_a_view_under_the_key_the_flush_job_scans(): void
    {
        $article = $this->answer($this->topic());

        // The name is the whole point. FlushViewCounters scans `views:help:*`
        // and writes what it finds into `help_articles.views`; a key spelled
        // any other way is a counter that increments in Redis forever and
        // never reaches a column, with nothing erroring anywhere.
        Redis::shouldReceive('incr')->once()->with('views:help:'.$article->id);

        $this->getJson('/api/v1/help/answers/'.$article->slug)->assertOk();
    }

    // --------------------------------------------------------------- search

    public function test_search_finds_an_answer_by_its_body_and_ranks_the_title_first(): void
    {
        $topic = $this->topic();
        $this->answer($topic, [
            'title' => 'Your Steam library is not syncing',
            'content' => '<p>Open Steam and check both privacy switches.</p>',
        ]);
        $this->answer($topic, [
            'title' => 'Connect your Xbox account',
            'excerpt' => 'Nothing to do with the other one.',
            // Found only in the body — which is what makes the search useful to
            // somebody who describes their problem instead of naming it.
            'content' => '<p>Xbox works differently from Steam.</p>',
        ]);

        $response = $this->getJson('/api/v1/help/search?q=Steam')->assertOk();

        $response->assertJsonPath('data.count', 2);
        // Title match outranks a body match, on both drivers: the ordering is
        // LOWER(), not ILIKE, precisely so this holds on SQLite too.
        $response->assertJsonPath('data.results.0.title', 'Your Steam library is not syncing');
    }

    /**
     * The way somebody in trouble actually types.
     *
     * Searching for the whole phrase as one string was the first version, and
     * it returned nothing for "steam not syncing" and nothing for "delete my
     * account" — both of which have an answer written for them. It only ever
     * rewarded guessing our exact wording.
     */
    public function test_search_finds_an_answer_from_words_that_are_not_next_to_each_other(): void
    {
        $topic = $this->topic();
        $this->answer($topic, [
            'title' => 'Delete your account, and what happens to your data',
            'excerpt' => 'Everything that names you is removed.',
            'content' => '<p>Go to Settings and choose to delete.</p>',
        ]);
        $this->answer($topic, ['title' => 'Connect your Xbox account', 'content' => '<p>Type your gamertag.</p>']);

        // "my" is dropped as too short to mean anything; "delete" and
        // "account" both have to appear, and they do — three words apart.
        $response = $this->getJson('/api/v1/help/search?q='.urlencode('delete my account'))->assertOk();

        $response->assertJsonPath('data.count', 1);
        $response->assertJsonPath('data.results.0.title', 'Delete your account, and what happens to your data');
    }

    public function test_the_answer_whose_title_carries_the_words_comes_first(): void
    {
        $topic = $this->topic();
        // Carries all three words in its body, and is about something else —
        // so it is a genuine match that must nonetheless come second.
        $this->answer($topic, [
            'title' => 'Connect your Xbox account',
            'content' => '<p>Xbox is not Steam, and it is not syncing the same way.</p>',
        ]);
        $this->answer($topic, [
            'title' => 'Your Steam library is not syncing',
            'content' => '<p>Check both privacy switches.</p>',
        ]);

        $response = $this->getJson('/api/v1/help/search?q='.urlencode('steam not syncing'))->assertOk();

        $response->assertJsonPath('data.count', 2);
        // Both match. The one whose title carries the words is the answer.
        $response->assertJsonPath('data.results.0.title', 'Your Steam library is not syncing');
    }

    /** A query of nothing but short words still has to work. */
    public function test_a_two_letter_query_still_searches(): void
    {
        $this->answer($this->topic(), ['title' => 'How XP and the daily cap work']);

        $this->getJson('/api/v1/help/search?q=xp')
            ->assertOk()
            ->assertJsonPath('data.count', 1);
    }

    public function test_search_will_not_return_an_answer_from_a_hidden_topic(): void
    {
        $this->answer($this->topic(['is_published' => false]), ['title' => 'Withdrawn Steam answer']);

        $this->getJson('/api/v1/help/search?q=Steam')
            ->assertOk()
            ->assertJsonPath('data.count', 0);
    }

    public function test_the_header_fan_out_returns_an_absolute_url_to_the_subdomain(): void
    {
        config(['app.help_url' => 'https://help.techplay.gg']);

        $topic = $this->topic();
        $article = $this->answer($topic, ['title' => 'Your Steam library is not syncing']);

        // Absolute, and only here. This link leaves techplay.gg for another
        // hostname; a path would resolve against the wrong one and read as a
        // 404 to the person who searched.
        $this->getJson('/api/v1/search/help?q=Steam')
            ->assertOk()
            ->assertJsonPath('results.0.url', 'https://help.techplay.gg/'.$topic->slug.'/'.$article->slug);
    }

    // ---------------------------------------------------------- helpfulness

    public function test_an_anonymous_reader_can_mark_an_answer_helpful_once(): void
    {
        $article = $this->answer($this->topic());

        Redis::shouldReceive('incr')->once()->with('helpful:help:'.$article->id);

        $this->postJson('/api/v1/help/answers/'.$article->slug.'/helpful', ['helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.counted', true);

        // The second press is not an error and does not say "you already
        // voted" — nobody is told they have been fingerprinted. It simply is
        // not counted, which is what keeps one person with a mouse from
        // burying the only feedback this section produces.
        $this->postJson('/api/v1/help/answers/'.$article->slug.'/helpful', ['helpful' => true])
            ->assertOk()
            ->assertJsonPath('data.counted', false);
    }

    public function test_marking_an_answer_unhelpful_uses_its_own_counter(): void
    {
        $article = $this->answer($this->topic());

        Redis::shouldReceive('incr')->once()->with('unhelpful:help:'.$article->id);

        $this->postJson('/api/v1/help/answers/'.$article->slug.'/helpful', ['helpful' => false])
            ->assertOk()
            ->assertJsonPath('data.counted', true);
    }

    /**
     * The subdomain is a second origin, and the browser treats it as a stranger.
     *
     * Every read in the help centre happens on the server, so nothing there
     * needs CORS — until the helpful button, which is a POST from the reader's
     * own browser and therefore preflighted. Drop this origin and the button
     * fails with nothing anywhere to explain it: no error the page can show,
     * and no line in the API log, because the request never arrives.
     */
    public function test_the_help_subdomain_is_allowed_to_call_the_api_from_a_browser(): void
    {
        $this->assertContains(
            rtrim((string) config('app.help_url'), '/'),
            config('cors.allowed_origins'),
        );
    }

    public function test_voting_on_an_answer_that_is_not_public_is_a_404(): void
    {
        $article = $this->answer($this->topic(['is_published' => false]));

        $this->postJson('/api/v1/help/answers/'.$article->slug.'/helpful', ['helpful' => true])
            ->assertNotFound();
    }
}
