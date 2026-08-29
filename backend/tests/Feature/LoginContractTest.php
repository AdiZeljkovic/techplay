<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The most used write endpoint on the site had no test at all.
 *
 * Found in the audit of 29.08.2026 by searching test *contents* for the route
 * rather than test file names — `auth/login` appeared in none of 125 files.
 *
 * These assert the contract the frontend reads, not the implementation: the
 * field is `access_token` (not `token`), an unverified account gets a success
 * response carrying a null token rather than an error, and a refusal says as
 * little as it can.
 */
class LoginContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Turnstile guards this endpoint too. Switched off here because these
        // are about what login returns, not about the challenge in front of it.
        config(['services.turnstile.enabled' => false]);
    }

    private function member(array $overrides = []): User
    {
        return User::factory()->create($overrides + [
            'email' => 'reader@example.test',
            'password' => Hash::make('CorrectHorse1!'),
            'email_verified_at' => now(),
        ]);
    }

    private function attempt(string $password = 'CorrectHorse1!', string $email = 'reader@example.test')
    {
        return $this->postJson('/api/v1/auth/login', compact('email', 'password'));
    }

    #[Test]
    public function correct_credentials_return_an_access_token_and_the_user(): void
    {
        $user = $this->member();

        $body = $this->attempt()->assertOk()->json();

        $this->assertNotEmpty(
            data_get($body, 'data.access_token'),
            'Login returned no access_token — the frontend stores this and has nothing without it.'
        );
        $this->assertSame($user->id, data_get($body, 'data.user.id'));
        $this->assertFalse(data_get($body, 'data.requires_verification'));
    }

    #[Test]
    public function the_token_actually_authenticates(): void
    {
        $this->member();

        $token = data_get($this->attempt()->json(), 'data.access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk();
    }

    /**
     * An unverified account is not an error — it is a success carrying no token
     * and a flag the login screen switches on. Asserting it here because the
     * frontend branches on exactly this shape.
     */
    #[Test]
    public function an_unverified_account_gets_no_token_but_not_an_error(): void
    {
        $this->member(['email_verified_at' => null]);

        $body = $this->attempt()->assertOk()->json();

        $this->assertNull(data_get($body, 'data.access_token'));
        $this->assertTrue(data_get($body, 'data.requires_verification'));
    }

    #[Test]
    public function a_wrong_password_is_refused(): void
    {
        $this->member();

        $this->attempt('not-the-password')->assertStatus(422);
    }

    /**
     * The refusal must not distinguish "no such account" from "wrong password".
     * Telling them apart turns the login form into a way to ask whether an
     * address has an account here.
     */
    #[Test]
    public function an_unknown_address_fails_the_same_way_as_a_wrong_password(): void
    {
        $this->member();

        $wrongPassword = $this->attempt('not-the-password');
        $noSuchUser = $this->attempt('not-the-password', 'nobody@example.test');

        $this->assertSame($wrongPassword->status(), $noSuchUser->status());
        $this->assertSame(
            $wrongPassword->json('errors.email'),
            $noSuchUser->json('errors.email'),
            'The two refusals word themselves differently, which tells an attacker which addresses exist.'
        );
    }

    #[Test]
    public function no_token_is_issued_on_a_failed_attempt(): void
    {
        $this->member();

        $body = $this->attempt('not-the-password')->json();

        $this->assertNull(data_get($body, 'data.access_token'));
    }
}
