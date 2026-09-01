<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The four things a spam filter counted against us, held down.
 *
 * Our own mail server scored a real message from this site and named them:
 * ZERO_FONT 0.50 for five zero-size elements, MANY_INVISIBLE_PARTS 0.80 for
 * nine invisible ones, MIME_HTML_ONLY 0.20 for carrying no plain-text half,
 * and a missing X-Mailer. Authentication was never the problem — SPF, DKIM and
 * DMARC all pass — so what was landing us in Junk was what the messages carried
 * inside them.
 *
 * Every one of those is easy to reintroduce by accident: a hidden preheader is
 * the standard trick for the line an inbox shows beside the subject, and a
 * one-pixel spacer cell with `font-size:0` is in every email template on the
 * web. Hence a test rather than a note.
 */
class MailLooksLikeAPersonSentItTest extends TestCase
{
    use RefreshDatabase;

    /** Every template a member can be sent. */
    private function renderedTemplates(): array
    {
        $appUrl = 'https://techplay.gg';

        return [
            'verify' => view('emails.auth.verify', [
                'url' => $appUrl.'/verify?token=x', 'username' => 'Chroniclus',
                'appUrl' => $appUrl, 'expiresInMinutes' => 60,
            ])->render(),

            'reset' => view('emails.auth.reset', [
                'url' => $appUrl.'/reset?token=x', 'username' => 'Chroniclus',
                'appUrl' => $appUrl, 'expiresInMinutes' => 60,
            ])->render(),

            'newsletter' => view('emails.newsletter.launch', [
                'appUrl' => $appUrl,
                'unsubscribeUrl' => $appUrl.'/api/v1/newsletter/unsubscribe/token',
            ])->render(),
        ];
    }

    /**
     * Text sized to nothing is how spam hides keywords, so every filter reads
     * it that way regardless of what ours actually says.
     */
    #[Test]
    public function no_template_hides_text(): void
    {
        $forbidden = [
            'font-size:0' => 'zero-size text',
            'font-size: 0' => 'zero-size text',
            'font-size:1px' => 'one-pixel text',
            'display:none' => 'a hidden block',
            'max-height:0' => 'a collapsed block',
            'opacity:0' => 'an invisible block',
            'mso-hide' => 'an Outlook-hidden block',
            '&zwnj;' => 'zero-width padding',
        ];

        foreach ($this->renderedTemplates() as $name => $html) {
            foreach ($forbidden as $needle => $what) {
                $this->assertStringNotContainsString(
                    $needle,
                    $html,
                    "The {$name} mail contains {$what} ({$needle}). Hidden text is what put us in Junk."
                );
            }
        }
    }

    /**
     * A mail carrying only HTML reads as a mailing. Both halves, always.
     */
    #[Test]
    public function the_account_mail_carries_a_plain_text_half(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $user->sendEmailVerificationNotification();

        Notification::assertSentTo($user, VerifyEmailNotification::class,
            function ($notification) use ($user) {
                $mail = $notification->toMail($user);

                // Laravel carries [html, text] in the same property when a
                // notification names both.
                $this->assertIsArray($mail->view, 'the verification mail sends HTML only');
                $this->assertCount(2, $mail->view);

                return true;
            });
    }

    #[Test]
    public function the_reset_mail_carries_one_too(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $user->sendPasswordResetNotification('token');

        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
            $mail = $notification->toMail($user);

            $this->assertIsArray($mail->view);
            $this->assertCount(2, $mail->view);

            return true;
        });
    }

    /**
     * A message nobody can answer is a weaker signal than one that can receive
     * an answer — and a member who replies to a confirmation should reach a
     * person rather than a bounce from no-reply.
     */
    #[Test]
    public function every_message_leaves_with_somewhere_to_reply_and_a_mailer_name(): void
    {
        config([
            'mail.default' => 'array',
            'mail.reply_to.address' => 'redakcija@techplay.gg',
            'mail.reply_to.name' => 'TechPlay',
        ]);

        // The real message, not the configuration that feeds it: the listener
        // lives in AppServiceProvider and the only thing worth asserting is
        // what actually leaves.
        $captured = null;
        Event::listen(function (MessageSending $e) use (&$captured) {
            $captured = $e->message;
        });

        Mail::raw('A plain message.', fn ($m) => $m->to('someone@example.test')->subject('Test'));

        $this->assertNotNull($captured, 'nothing was sent');

        $replyTo = $captured->getReplyTo();
        $this->assertNotEmpty($replyTo, 'the message had nowhere to reply to');
        $this->assertSame('redakcija@techplay.gg', $replyTo[0]->getAddress());

        $this->assertTrue(
            $captured->getHeaders()->has('X-Mailer'),
            'the message did not say what sent it'
        );
    }
}
