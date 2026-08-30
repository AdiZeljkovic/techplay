<?php

namespace Tests\Feature;

use App\Mail\ContactFormMessage;
use App\Mail\NewsletterVerification;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * TechPlay sends four kinds of email, and no more.
 *
 * Address verification, password reset, the contact form, and the newsletter
 * confirmation. Decided 31.08.2026, and the reason is the first two: a domain
 * earns its way into the inbox slowly and loses it fast, so a weekly digest
 * somebody marks as spam is paid for by the password reset that then does not
 * arrive. Nothing optional is allowed to put those at risk.
 *
 * This is here because the mail channel is one word in a `via()` array. Adding
 * it back is a two-character change that no reviewer would notice, and the cost
 * would not show up until deliverability had already gone.
 */
class OnlyFourKindsOfEmailTest extends TestCase
{
    #[Test]
    public function no_notification_sends_email(): void
    {
        $offenders = [];

        foreach (glob(app_path('Notifications/*.php')) as $file) {
            $source = file_get_contents($file);

            if (! preg_match('/function via\([^)]*\)[^{]*\{(.*?)\n    \}/s', $source, $m)) {
                continue;
            }

            if (str_contains($m[1], "'mail'")) {
                $offenders[] = basename($file, '.php');
            }
        }

        $this->assertSame([], $offenders, implode("\n", [
            'These notifications send email again:',
            ...$offenders,
            '',
            'TechPlay sends only verification, password reset, the contact form',
            'and the newsletter confirmation. If that decision changed, change',
            'this test deliberately rather than around it.',
        ]));
    }

    /**
     * The four that must keep working. Named individually, because "it compiles"
     * is not the same as "somebody can still get back into their account".
     */
    #[Test]
    public function the_four_that_stay_are_still_wired_up(): void
    {
        $this->assertTrue(
            method_exists(User::class, 'sendEmailVerificationNotification'),
            'Email verification is gone — nobody can confirm an address.'
        );

        $this->assertTrue(
            class_exists(ContactFormMessage::class),
            'The contact form no longer sends anywhere.'
        );

        $this->assertTrue(
            class_exists(NewsletterVerification::class),
            'Newsletter confirmation is gone — subscriptions cannot be confirmed.'
        );

        $this->assertTrue(
            in_array('resetPassword', get_class_methods(User::class), true)
                || method_exists(User::class, 'sendPasswordResetNotification'),
            'Password reset is gone — a locked-out member has no way back in.'
        );
    }

    /** The contact form goes to a person, not to no-reply. */
    #[Test]
    public function the_contact_form_reaches_somebody_who_reads_it(): void
    {
        $source = file_get_contents(app_path('Http/Controllers/Api/V1/ContactController.php'));

        $this->assertStringContainsString('adi@techplay.gg', $source);
    }
}
