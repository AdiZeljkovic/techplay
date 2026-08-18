<?php

namespace Tests\Feature;

use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The way off the list.
 *
 * There was none. Seven people had subscribed and the only exit was to ask
 * somebody — which is not merely impolite: since February 2024 Gmail and Yahoo
 * require a one-click unsubscribe on bulk mail arriving in their inboxes,
 * whatever server sent it, and the GDPR requires consent be as easy to withdraw
 * as it was to give.
 */
class NewsletterUnsubscribeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        /*
         * These tests make several calls to the same routes, and subscribing is
         * throttled to five in ten minutes on purpose — the limit exists to stop
         * somebody bombing an address with confirmation mail. Nothing here
         * asserts on throttling, so leaving it on would only mean a 429 halfway
         * through a test about something else.
         */
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    private function subscriber(array $attributes = []): NewsletterSubscriber
    {
        return NewsletterSubscriber::create(array_merge([
            'email' => 'reader@example.com',
            'is_active' => true,
            'email_verified_at' => now(),
        ], $attributes));
    }

    /**
     * Every subscriber carries one from the moment they exist, because the link
     * has to be in the first mail they receive.
     */
    public function test_a_subscriber_gets_a_token_on_creation(): void
    {
        $subscriber = $this->subscriber();

        $this->assertNotNull($subscriber->unsubscribe_token);
        $this->assertSame(64, strlen($subscriber->unsubscribe_token));
        $this->assertStringContainsString($subscriber->unsubscribe_token, $subscriber->unsubscribeUrl());
    }

    /**
     * Neither token may ever leave in a response body. One grants a
     * subscription; the other cancels somebody else's.
     */
    public function test_neither_token_is_serialised(): void
    {
        $json = $this->subscriber()->toArray();

        $this->assertArrayNotHasKey('unsubscribe_token', $json);
        $this->assertArrayNotHasKey('verification_token', $json);
    }

    /**
     * What Gmail calls by itself when the reader presses the header button.
     * RFC 8058: act immediately, no confirmation, no login.
     */
    public function test_a_one_click_post_removes_them_at_once(): void
    {
        $subscriber = $this->subscriber();

        $this->postJson('/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token)
            ->assertNoContent();

        $subscriber->refresh();

        $this->assertFalse($subscriber->is_active);
        $this->assertNotNull($subscriber->unsubscribed_at);
        $this->assertTrue(MailSuppression::has('reader@example.com'));
    }

    /**
     * And the link in the body of the mail does the same, then says so.
     */
    public function test_the_link_in_the_mail_works_without_logging_in(): void
    {
        $subscriber = $this->subscriber();

        $this->get('/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token)
            ->assertRedirect();

        $this->assertFalse($subscriber->refresh()->is_active);
    }

    /**
     * An unknown token is answered exactly like a known one.
     *
     * Otherwise the route becomes a way of asking whether an address is on the
     * list: try a token, read the status code.
     */
    public function test_an_unknown_token_is_indistinguishable(): void
    {
        $this->postJson('/api/v1/newsletter/unsubscribe/'.str_repeat('x', 64))
            ->assertNoContent();

        $this->get('/api/v1/newsletter/unsubscribe/'.str_repeat('x', 64))
            ->assertRedirect();
    }

    /**
     * The token is not consumed. Somebody may click the link in a two-year-old
     * newsletter, and pressing it twice must not become an error.
     */
    public function test_the_token_survives_being_used(): void
    {
        $subscriber = $this->subscriber();
        $token = $subscriber->unsubscribe_token;

        $this->postJson('/api/v1/newsletter/unsubscribe/'.$token)->assertNoContent();
        $this->postJson('/api/v1/newsletter/unsubscribe/'.$token)->assertNoContent();

        $this->assertSame($token, $subscriber->refresh()->unsubscribe_token);
    }

    /**
     * Suppression outranks every other table. Signing up again through the form
     * must not quietly put a suppressed address back on the list — only
     * confirming the address does that.
     */
    public function test_resubscribing_needs_the_address_confirmed_again(): void
    {
        Mail::fake();

        $subscriber = $this->subscriber();
        $this->postJson('/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token);

        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'reader@example.com'])
            ->assertOk();

        $this->assertTrue(
            MailSuppression::has('reader@example.com'),
            'the form post alone must not lift a suppression',
        );

        $this->postJson('/api/v1/newsletter/verify', [
            'token' => $subscriber->refresh()->verification_token,
        ])->assertOk();

        $this->assertFalse(MailSuppression::has('reader@example.com'));
        $this->assertNull($subscriber->refresh()->unsubscribed_at);
    }

    /**
     * The scope every send will use, and the one query that decides it.
     */
    public function test_only_confirmed_and_unsuppressed_subscribers_are_mailable(): void
    {
        $this->subscriber(['email' => 'confirmed@example.com']);
        $this->subscriber(['email' => 'unconfirmed@example.com', 'email_verified_at' => null]);
        $gone = $this->subscriber(['email' => 'gone@example.com']);

        $this->postJson('/api/v1/newsletter/unsubscribe/'.$gone->unsubscribe_token);

        $mailable = NewsletterSubscriber::mailable()->pluck('email')->all();

        $this->assertSame(['confirmed@example.com'], $mailable);
    }

    /**
     * Suppression is by address, not by row — a second row for the same person
     * must not be a way back onto the list.
     */
    public function test_suppression_filters_a_whole_list_in_one_query(): void
    {
        MailSuppression::suppress('gone@example.com');
        MailSuppression::suppress('BOUNCED@Example.com', MailSuppression::BOUNCED);

        $left = MailSuppression::filter([
            'here@example.com',
            'gone@example.com',
            'bounced@example.com',
            'HERE@example.com',
        ]);

        $this->assertSame(['here@example.com'], $left);
    }

    /**
     * A complaint outranks an unsubscribe. If a mailbox provider ever asks why
     * we stopped writing, "they reported us" is the answer that matters.
     */
    public function test_a_complaint_is_never_downgraded(): void
    {
        MailSuppression::suppress('cross@example.com', MailSuppression::UNSUBSCRIBED);
        MailSuppression::suppress('cross@example.com', MailSuppression::COMPLAINED);

        $this->assertSame(
            MailSuppression::COMPLAINED,
            MailSuppression::where('email', 'cross@example.com')->value('reason'),
        );

        MailSuppression::suppress('cross@example.com', MailSuppression::UNSUBSCRIBED);

        $this->assertSame(
            MailSuppression::COMPLAINED,
            MailSuppression::where('email', 'cross@example.com')->value('reason'),
        );
    }
}
