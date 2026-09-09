<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

/**
 * Signing in with Google, and the two ways it must not go wrong.
 *
 * Both were real in the Discord flow before they were fixed, and neither
 * throws when it happens — they hand somebody a token for an account, quietly.
 *
 * The first is the member pressing Connect while signed in. Identified by a
 * nonce they were issued, never by their address: on 30 August 2026 a member
 * with 1,895 XP connected Discord, his Discord address was not the address on
 * his account, and the callback made him a second empty account and signed him
 * into it.
 *
 * The second is an address matching an account that never proved it. Linking
 * on the match alone meant anyone who could put a victim's address on a social
 * account walked into the victim's TechPlay account.
 */
class SignInWithGoogleTest extends TestCase
{
    use RefreshDatabase;

    private function googleUser(string $id, string $email, bool $verified = true): SocialiteUser
    {
        $user = new SocialiteUser;
        $user->map([
            'id' => $id,
            'name' => 'Test Person',
            'nickname' => 'testperson',
            'email' => $email,
            'avatar' => 'https://lh3.googleusercontent.com/a/'.$id,
        ]);
        $user->user = ['email_verified' => $verified];

        return $user;
    }

    private function arriveFromGoogle(SocialiteUser $googleUser, array $query = []): TestResponse
    {
        $driver = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        return $this->get('/api/v1/auth/google/callback?'.http_build_query($query));
    }

    public function test_a_new_google_account_creates_a_verified_member(): void
    {
        $response = $this->arriveFromGoogle($this->googleUser('g-1', 'new@gmail.com'));

        $user = User::where('email', 'new@gmail.com')->firstOrFail();

        $this->assertSame('g-1', $user->google_id);
        $this->assertNotNull($user->email_verified_at, 'Google proved the address, so it need not be proved again');
        $this->assertStringContainsString('/auth/callback?token=', $response->headers->get('Location'));
    }

    public function test_signing_in_again_finds_the_same_account(): void
    {
        $existing = User::factory()->create(['google_id' => 'g-2', 'email' => 'known@gmail.com']);

        $this->arriveFromGoogle($this->googleUser('g-2', 'known@gmail.com'));

        $this->assertSame(1, User::where('google_id', 'g-2')->count(), 'a second account is the bug this guards');
        $this->assertSame($existing->id, User::where('google_id', 'g-2')->first()->id);
    }

    public function test_an_unverified_google_address_is_refused(): void
    {
        $response = $this->arriveFromGoogle($this->googleUser('g-3', 'unproven@gmail.com', verified: false));

        $this->assertNull(User::where('email', 'unproven@gmail.com')->first());
        $this->assertStringContainsString('/login?error=', $response->headers->get('Location'));
    }

    public function test_an_address_on_an_unverified_local_account_is_not_claimed(): void
    {
        // Somebody registered with a password using an address they do not
        // own, and never opened the verification mail. The owner of that
        // address must not be signed into their account.
        $planted = User::factory()->create([
            'email' => 'victim@gmail.com',
            'email_verified_at' => null,
        ]);

        $response = $this->arriveFromGoogle($this->googleUser('g-4', 'victim@gmail.com'));

        $planted->refresh();

        $this->assertNull($planted->google_id, 'the accounts must not be joined');
        $this->assertStringNotContainsString('token=', (string) $response->headers->get('Location'));
        $this->assertStringContainsString('/login?error=', $response->headers->get('Location'));
    }

    public function test_an_address_on_a_verified_local_account_is_joined_and_signed_in(): void
    {
        $mine = User::factory()->create([
            'email' => 'mine@gmail.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->arriveFromGoogle($this->googleUser('g-5', 'mine@gmail.com'));

        $mine->refresh();

        $this->assertSame('g-5', $mine->google_id);
        $this->assertStringContainsString('/auth/callback?token=', $response->headers->get('Location'));
    }

    public function test_connect_links_to_the_member_who_asked_not_to_their_address(): void
    {
        // The bug this exists for: his Google address is not the address on
        // his account, which is true of most people.
        $member = User::factory()->create([
            'email' => 'his-real-address@techplay.gg',
            'email_verified_at' => now(),
        ]);

        $state = $this->actingAs($member)
            ->postJson('/api/v1/auth/google/link-intent')
            ->assertOk()
            ->json('data.state');

        $this->assertNotEmpty($state);

        $response = $this->arriveFromGoogle(
            $this->googleUser('g-6', 'a-completely-different@gmail.com'),
            ['state' => $state]
        );

        $member->refresh();

        $this->assertSame('g-6', $member->google_id);
        $this->assertSame(1, User::count(), 'a second, empty account is exactly what this prevents');
        $this->assertStringContainsString('/settings?google=linked', $response->headers->get('Location'));
        $this->assertStringNotContainsString('token=', (string) $response->headers->get('Location'));
    }

    public function test_a_link_intent_cannot_be_replayed(): void
    {
        $member = User::factory()->create(['email_verified_at' => now()]);

        $state = $this->actingAs($member)
            ->postJson('/api/v1/auth/google/link-intent')
            ->json('data.state');

        $this->assertNotNull(Cache::get('google:link-intent:'.$state));

        $this->arriveFromGoogle($this->googleUser('g-7', 'first@gmail.com'), ['state' => $state]);

        $this->assertNull(Cache::get('google:link-intent:'.$state), 'pulled, not read');
    }

    public function test_connecting_a_google_account_already_on_someone_else_is_refused(): void
    {
        User::factory()->create(['google_id' => 'g-8']);
        $member = User::factory()->create(['email_verified_at' => now()]);

        $state = $this->actingAs($member)
            ->postJson('/api/v1/auth/google/link-intent')
            ->json('data.state');

        $response = $this->arriveFromGoogle($this->googleUser('g-8', 'shared@gmail.com'), ['state' => $state]);

        $member->refresh();

        $this->assertNull($member->google_id);
        $this->assertStringContainsString('/settings?error=', $response->headers->get('Location'));
    }

    public function test_link_intent_needs_a_signed_in_caller(): void
    {
        // Without this the nonce is issued to anyone who asks, and the whole
        // mechanism becomes "the browser says who it is" again.
        $this->postJson('/api/v1/auth/google/link-intent')->assertUnauthorized();
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }
}
