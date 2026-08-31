<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Which addresses registration will take.
 *
 * Nothing here filters by country. A .ru address is not evidence of anything,
 * and a TLD ban turns away readers while stopping nobody who is actually
 * farming accounts — they use Gmail. What is refused is an address that cannot
 * receive mail, and a handful of services that exist to hand out mailboxes
 * nobody owns.
 */
class RegistrationEmailGateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.turnstile.enabled' => false, 'registration.verify_mx' => true]);
        Cache::flush();
    }

    private function register(string $email, string $username = 'someone')
    {
        return $this->postJson('/api/v1/auth/register', [
            'name' => 'Someone',
            'username' => $username,
            'email' => $email,
            'password' => 'CorrectHorse1!',
            'password_confirmation' => 'CorrectHorse1!',
        ]);
    }

    #[Test]
    public function a_throwaway_mailbox_is_refused(): void
    {
        $this->register('someone@mailinator.com')
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    #[Test]
    public function a_domain_with_no_mail_server_is_refused(): void
    {
        // Cached so the test never depends on a live resolver.
        Cache::put('mx:nosuchdomain-tp.invalid', false, 60);

        $this->register('someone@nosuchdomain-tp.invalid')
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    #[Test]
    public function a_domain_that_can_receive_mail_is_accepted(): void
    {
        Cache::put('mx:example-real.test', true, 60);

        $this->register('someone@example-real.test')->assertSuccessful();
    }

    /**
     * The point of the whole section: where somebody lives is not a reason.
     */
    #[Test]
    public function a_country_tld_is_not_a_reason_to_refuse(): void
    {
        Cache::put('mx:yandex.ru', true, 60);

        $this->register('someone@yandex.ru')->assertSuccessful();
    }

    /**
     * A resolver having a bad moment must not close registration.
     */
    #[Test]
    public function the_check_can_be_switched_off(): void
    {
        config(['registration.verify_mx' => false]);
        Cache::put('mx:unreachable-tp.test', false, 60);

        $this->register('someone@unreachable-tp.test')->assertSuccessful();
    }
}
