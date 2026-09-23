<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification as ResetPassword;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

/**
 * The recovery path that did not exist.
 *
 * The login page has linked to /forgot-password since launch, the page was
 * never built, and no endpoint stood behind it — so a forgotten password meant
 * a lost account, permanently. Accounts created through Discord were worse off
 * still: they were handed a random password nobody ever saw, and changePassword
 * demands the current one.
 */
/*
 * Aliased to the class that is actually sent.
 *
 * `assertSentTo` matches on the exact class name rather than on instanceof, so
 * naming the framework's ResetPassword here started failing the moment TechPlay
 * began sending its own — which extends it, carries the same single-use token
 * and the same expiry, and differs only in what the message looks like.
 *
 * These three assertions caught that swap, which is what they are for. Aliased
 * rather than renamed at each call site so they still read as being about a
 * password reset, and so a future change is one line at the top.
 */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_reset_link_is_sent_for_a_real_address(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'player@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'player@example.com'])
            ->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_a_refusal_from_the_mail_server_does_not_lock_the_member_out(): void
    {
        /*
         * What happened on 21 September 2026.
         *
         * The mail was sent inside the request. Our own Postfix was still
         * refusing — a newsletter two hours earlier had used up its quota —
         * and the exception came back out of the controller as a 500. The
         * token was written, no mail went, and nothing ever tried again: a
         * member who had forgotten their password was locked out by a campaign
         * they had nothing to do with.
         *
         * Queued, the request no longer carries the send at all, so a refusal
         * is the queue's problem and it retries. The assertion is on the
         * contract that makes that true.
         */
        $this->assertInstanceOf(
            ShouldQueue::class,
            new ResetPassword('token'),
            'the reset mail is sent inside the request again, so one refusal loses it for good'
        );

        $notification = new ResetPassword('token');

        // Every attempt has to land while the token is still valid. Delivering
        // a mail whose link has already expired is worse than not delivering.
        $window = (int) config('auth.passwords.users.expire', 60) * 60;
        $this->assertLessThan(
            $window,
            array_sum($notification->backoff),
            'the last retry arrives after the reset link has expired'
        );

        Notification::fake();

        $user = User::factory()->create(['email' => 'locked@example.com']);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'locked@example.com'])
            ->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_the_confirmation_mail_is_queued_too(): void
    {
        // The other mail whose loss locks somebody out of their own account:
        // without it a registration cannot be completed at all.
        $this->assertInstanceOf(ShouldQueue::class, new VerifyEmailNotification);
    }

    public function test_an_unknown_address_gets_the_same_answer_as_a_known_one(): void
    {
        Notification::fake();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com']);

        User::factory()->create(['email' => 'somebody@example.com']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'somebody@example.com']);

        // Whether an address has an account is not something a stranger learns
        // by asking.
        $this->assertSame($known->status(), $unknown->status());
        $this->assertSame($known->json('message'), $unknown->json('message'));
    }

    public function test_a_reset_sets_the_password_and_kills_every_other_session(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'player@example.com',
            'password' => 'OldPassword1!',
        ]);

        // A session that existed before the reset — the thing a victim is
        // trying to evict when they recover an account.
        $user->createToken('stolen');
        $this->assertSame(1, $user->tokens()->count());

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'player@example.com'])->assertOk();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'player@example.com',
            'password' => 'BrandNew1!',
            'password_confirmation' => 'BrandNew1!',
        ])->assertOk();

        $user->refresh();

        $this->assertTrue(Hash::check('BrandNew1!', $user->password));
        $this->assertSame(0, $user->tokens()->count(), 'old sessions must not survive a reset');
    }

    public function test_a_reset_also_verifies_the_address(): void
    {
        Notification::fake();

        // Otherwise login refuses the account immediately after a successful
        // reset, which reads as the reset having failed.
        $user = User::factory()->create([
            'email' => 'unverified@example.com',
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unverified@example.com']);

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'unverified@example.com',
            'password' => 'BrandNew1!',
            'password_confirmation' => 'BrandNew1!',
        ])->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_a_forged_token_is_refused(): void
    {
        User::factory()->create(['email' => 'player@example.com']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'not-a-real-token',
            'email' => 'player@example.com',
            'password' => 'BrandNew1!',
            'password_confirmation' => 'BrandNew1!',
        ])->assertStatus(422);
    }
}
