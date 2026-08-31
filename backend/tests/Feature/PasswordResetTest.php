<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ResetPasswordNotification as ResetPassword;
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
