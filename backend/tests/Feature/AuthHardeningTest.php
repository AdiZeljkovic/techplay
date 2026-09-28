<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * What sign-in and sign-up refuse.
 *
 * Three things found on 31.08.2026, each of which looked fine until it was
 * measured against what the database or the clock actually does.
 */
class AuthHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.turnstile.enabled' => false]);
        RateLimiter::clear('login:'.sha1('reader@example.test|127.0.0.1'));
    }

    private function member(): User
    {
        return User::factory()->create([
            'email' => 'reader@example.test',
            'password' => Hash::make('CorrectHorse1!'),
            'email_verified_at' => now(),
        ]);
    }

    private function attempt(string $password)
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => 'reader@example.test',
            'password' => $password,
        ]);
    }

    /**
     * The route allowed sixty guesses a minute — the generic API allowance, not
     * an authentication one. That is 86,400 a day against a chosen account.
     */
    #[Test]
    public function guessing_stops_after_five_wrong_passwords(): void
    {
        $this->member();

        for ($i = 0; $i < 5; $i++) {
            $this->attempt('wrong-'.$i)->assertStatus(422);
        }

        $this->attempt('wrong-again')
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', fn ($m) => str_contains((string) $m, 'Too many attempts'));
    }

    /** The right password must not be refused because of somebody else's guessing. */
    #[Test]
    public function a_correct_password_clears_the_counter(): void
    {
        $this->member();

        $this->attempt('wrong-one')->assertStatus(422);
        $this->attempt('wrong-two')->assertStatus(422);

        $this->attempt('CorrectHorse1!')->assertOk();

        // Four fresh attempts are available again, so the count really reset.
        for ($i = 0; $i < 4; $i++) {
            $this->attempt('wrong-'.$i)->assertStatus(422);
        }

        $this->attempt('wrong-five')
            ->assertJsonPath('errors.email.0', 'Invalid credentials provided.');
    }

    /**
     * A username is taken however it is spelled.
     *
     * The column carries a unique index on lower(username); the validation rule
     * compared exactly. Registering XLBANANA47 while XLBanana47 existed passed
     * validation and failed at the insert — a 500 where the reader should have
     * been told the name was taken.
     */
    #[Test]
    public function a_username_taken_in_other_capitals_is_refused_politely(): void
    {
        User::factory()->create(['username' => 'XLBanana47', 'email' => 'taken@example.test']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'X',
            'username' => 'XLBANANA47',
            'email' => 'new@example.test',
            'password' => 'CorrectHorse1!',
            'password_confirmation' => 'CorrectHorse1!',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    #[Test]
    public function usernames_have_a_floor_and_a_ceiling(): void
    {
        foreach (['ab', str_repeat('a', 33)] as $bad) {
            $this->postJson('/api/v1/auth/register', [
                'name' => 'X',
                'username' => $bad,
                'email' => 'x'.strlen($bad).'@example.test',
                'password' => 'CorrectHorse1!',
                'password_confirmation' => 'CorrectHorse1!',
            ])->assertJsonValidationErrors('username');
        }
    }

    /**
     * The refusal for an address nobody has registered has to cost the same as
     * the refusal for one that exists, or the difference answers the question
     * the identical wording refuses to.
     *
     * ── Why this counts hashes instead of timing them ──────────────────
     *
     * It used to measure wall-clock time and assert the unknown address took at
     * least 35% as long. That failed roughly one run in three on a loaded
     * machine — measured on 30 September 2026: two passes and a failure in
     * three consecutive runs — and a test that cries wolf a third of the time
     * is worse than no test, because people learn to scroll past red.
     *
     * The defence is not "takes a similar time", it is "does the same work":
     * the login path hashes a throwaway value when the account does not exist,
     * precisely so both branches pay for one bcrypt. Counting the hash is
     * deterministic and checks the actual mechanism rather than its shadow.
     */
    #[Test]
    public function a_missing_account_still_pays_for_a_hash(): void
    {
        $this->member();

        /*
         * The mocked `make` returns a **real** bcrypt string, and that detail
         * is the whole reason this comment exists.
         *
         * The controller caches its throwaway hash in a static, so whatever
         * `make` returns while mocked stays in that property for the rest of
         * the PHP process. Returning a placeholder left `$2y$dummy` there, and
         * the next test class to reach the unknown-address branch compared a
         * real password against a string that is not a hash — a 500 instead of
         * a 422, in a test that had nothing to do with this one.
         *
         * A partial mock is not the answer either: HashManager forwards `make`
         * through `__call`, which Mockery's partial does not proxy, so the
         * controller got null and threw inside this test instead of a later one.
         */
        $realHash = password_hash('unused-but-genuinely-bcrypt', PASSWORD_BCRYPT);

        $checks = 0;
        Hash::shouldReceive('check')->andReturnUsing(function () use (&$checks) {
            $checks++;

            return false;
        });
        Hash::shouldReceive('make')->andReturn($realHash);
        Hash::shouldReceive('needsRehash')->andReturn(false);

        $this->attempt('wrong-password');
        $known = $checks;

        RateLimiter::clear('login:'.sha1('nobody@example.test|127.0.0.1'));
        $checks = 0;

        $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.test',
            'password' => 'wrong-password',
        ]);

        $this->assertSame(1, $known, 'A real address should cost exactly one hash comparison.');
        $this->assertSame(
            $known,
            $checks,
            'An address with no account skipped the hash, which makes it answer faster and tells an attacker it has no account.'
        );
    }
}
