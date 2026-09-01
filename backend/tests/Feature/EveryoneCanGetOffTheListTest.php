<?php

namespace Tests\Feature;

use App\Mail\NewsletterLaunch;
use App\Models\MailSuppression;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use App\Services\NewsletterAudience;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The way out of the list, end to end.
 *
 * All the parts of this existed and none of them were connected. The tokens
 * were generated, the suppression list was written, the routes were mounted and
 * the header trait was sitting in app/Mail/Concerns — but nothing ever sent a
 * campaign, so no recipient was ever handed a token, and the footer link fell
 * back to a settings page. A link to a settings page is not an unsubscribe:
 * Gmail and Yahoo have required a working one-click since February 2024, and
 * a member has a right to it regardless of what any mailbox provider demands.
 *
 * This test exists because the gap was invisible. Every piece looked finished
 * on its own.
 */
class EveryoneCanGetOffTheListTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function the_mail_carries_the_recipients_own_token_in_the_body_and_the_headers(): void
    {
        config(['mail.default' => 'array']);

        $subscriber = NewsletterSubscriber::forAddress('reader@example.test', NewsletterSubscriber::FROM_ACCOUNT);
        $url = $subscriber->unsubscribeUrl();

        $this->assertStringContainsString($subscriber->unsubscribe_token, $url);

        // The message that actually leaves, not the configuration behind it.
        $captured = null;
        Event::listen(function (MessageSending $e) use (&$captured) {
            $captured = $e->message;
        });

        Mail::to($subscriber->email)->send(new NewsletterLaunch($subscriber));

        $this->assertNotNull($captured, 'nothing was sent');

        // In the footer, where a person clicks.
        $body = (string) $captured->getHtmlBody();
        $this->assertStringContainsString($url, $body);
        $this->assertStringNotContainsString(
            'notifications" style="color:#84848E; text-decoration:underline;">Unsubscribe',
            $body,
            'the footer is still falling back to the settings page'
        );

        // In the plain-text half, for whoever reads without HTML.
        $this->assertStringContainsString($url, (string) $captured->getTextBody());

        // And in the headers, where Gmail reads it without asking the reader.
        $headers = $captured->getHeaders();
        $this->assertSame('<'.$url.'>', $headers->get('List-Unsubscribe')?->getBodyAsString());
        $this->assertSame('List-Unsubscribe=One-Click', $headers->get('List-Unsubscribe-Post')?->getBodyAsString());
    }

    /**
     * RFC 8058: the client POSTs and expects no page, no confirmation, no
     * redirect. A mail client never sees an "are you sure" screen — it only
     * records that the promise the header made was broken.
     */
    #[Test]
    public function one_click_from_the_mail_client_works_without_a_confirmation_step(): void
    {
        $subscriber = NewsletterSubscriber::forAddress('gone@example.test', NewsletterSubscriber::FROM_ACCOUNT);

        $this->postJson('/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token)
            ->assertNoContent();

        $this->assertTrue(MailSuppression::has('gone@example.test'));
        $this->assertNotNull($subscriber->fresh()->unsubscribed_at);
    }

    #[Test]
    public function the_link_in_the_footer_lands_somewhere_a_person_can_read(): void
    {
        $subscriber = NewsletterSubscriber::forAddress('clicker@example.test');

        $this->get('/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token)
            ->assertRedirect(rtrim((string) config('app.site_url'), '/').'/newsletter/unsubscribed');
    }

    /**
     * Somebody may click a link in a two-year-old mail, or click twice. Neither
     * may produce an error page — the second click has to look exactly like the
     * first, or a person who is already off the list will believe they are not.
     */
    #[Test]
    public function the_token_keeps_working_after_it_has_been_used(): void
    {
        $subscriber = NewsletterSubscriber::forAddress('twice@example.test');
        $token = $subscriber->unsubscribe_token;

        $this->postJson('/api/v1/newsletter/unsubscribe/'.$token)->assertNoContent();
        $this->postJson('/api/v1/newsletter/unsubscribe/'.$token)->assertNoContent();

        $this->assertSame(1, MailSuppression::where('email', 'twice@example.test')->count());
    }

    /** An unknown token must not say whether it is unknown. */
    #[Test]
    public function a_wrong_token_reveals_nothing(): void
    {
        $this->postJson('/api/v1/newsletter/unsubscribe/'.str_repeat('x', 64))->assertNoContent();
    }

    #[Test]
    public function someone_who_left_is_never_written_to_again(): void
    {
        $staying = User::factory()->create(['email' => 'staying@example.test', 'email_verified_at' => now()]);
        $leaving = User::factory()->create(['email' => 'leaving@example.test', 'email_verified_at' => now()]);

        $addresses = app(NewsletterAudience::class)->addresses();
        $this->assertArrayHasKey($leaving->email, $addresses);

        NewsletterSubscriber::forAddress($leaving->email, NewsletterSubscriber::FROM_ACCOUNT)->unsubscribe();

        $after = app(NewsletterAudience::class)->addresses();
        $this->assertArrayNotHasKey($leaving->email, $after, 'they unsubscribed and we would write again');
        $this->assertArrayHasKey($staying->email, $after);
    }

    /**
     * An account is not a subscription. Both belong in the table — the row is
     * what carries the token — but the admin's subscriber count must not swell
     * by the size of the membership, and somebody who did ask stays recorded as
     * having asked.
     */
    #[Test]
    public function an_account_is_not_recorded_as_a_signup(): void
    {
        $signup = NewsletterSubscriber::forAddress('asked@example.test', NewsletterSubscriber::FROM_FORM);
        $member = NewsletterSubscriber::forAddress('member@example.test', NewsletterSubscriber::FROM_ACCOUNT);

        $this->assertSame(NewsletterSubscriber::FROM_FORM, $signup->source);
        $this->assertSame(NewsletterSubscriber::FROM_ACCOUNT, $member->source);

        // Writing to somebody does not reclassify why they are on the list.
        $again = NewsletterSubscriber::forAddress('asked@example.test', NewsletterSubscriber::FROM_ACCOUNT);
        $this->assertSame(NewsletterSubscriber::FROM_FORM, $again->source);
        $this->assertSame($signup->id, $again->id);
    }

    /**
     * An unverified account has given us no evidence the address reaches
     * anybody. Mailing it is how a sender collects the bounces that cost it the
     * inbox for everyone else.
     */
    #[Test]
    public function an_unconfirmed_address_is_not_in_the_audience(): void
    {
        $unverified = User::factory()->unverified()->create(['email' => 'never-confirmed@example.test']);

        $this->assertArrayNotHasKey(
            $unverified->email,
            app(NewsletterAudience::class)->addresses()
        );
    }

    /** The campaign does nothing at all unless it is told to. */
    #[Test]
    public function the_command_sends_nothing_without_force(): void
    {
        Mail::fake();
        User::factory()->create(['email_verified_at' => now()]);

        $this->artisan('newsletter:launch')->assertSuccessful();

        Mail::assertNothingSent();
    }

    #[Test]
    public function the_command_sends_one_message_per_person(): void
    {
        Mail::fake();

        User::factory()->count(3)->create(['email_verified_at' => now()]);
        User::factory()->unverified()->create();

        $this->artisan('newsletter:launch --force --pause=0')->assertSuccessful();

        Mail::assertSentCount(3);
    }
}
