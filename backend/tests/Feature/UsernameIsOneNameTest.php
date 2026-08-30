<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * A username is one name, however it is capitalised.
 *
 * Every profile lookup was `where('username', $name)`, which PostgreSQL matches
 * case-sensitively — so `/profile/xlbanana47` answered 404 for an account that
 * plainly exists, and a member sent his own profile link and got User Not Found.
 *
 * The same comparison is why the account existed twice: `uniqueUsername()`
 * lowercases its candidate, then checked for a collision the case-sensitive
 * way, so `xlbanana47` did not collide with `XLBanana47`.
 */
class UsernameIsOneNameTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function a_profile_is_found_whatever_case_the_link_uses(): void
    {
        User::factory()->create(['username' => 'XLBanana47']);

        foreach (['XLBanana47', 'xlbanana47', 'XLBANANA47', 'XlBanana47'] as $typed) {
            $this->assertNotNull(
                User::byUsername($typed)->first(),
                "Nobody found for /profile/{$typed}"
            );
        }
    }

    #[Test]
    public function the_stored_capitals_are_left_alone(): void
    {
        User::factory()->create(['username' => 'XLBanana47']);

        $this->assertSame('XLBanana47', User::byUsername('xlbanana47')->value('username'));
    }

    #[Test]
    public function a_name_that_does_not_exist_still_finds_nobody(): void
    {
        User::factory()->create(['username' => 'XLBanana47']);

        $this->assertNull(User::byUsername('someone-else')->first());
        $this->assertNull(User::byUsername('')->first());
        $this->assertNull(User::byUsername(null)->first());
    }

    /**
     * The public route is what the reader actually hits.
     */
    #[Test]
    public function the_public_profile_endpoint_answers_on_any_casing(): void
    {
        User::factory()->create(['username' => 'XLBanana47', 'email_verified_at' => now()]);

        $this->getJson('/api/v1/users/XLBanana47')->assertOk();
        $this->getJson('/api/v1/users/xlbanana47')->assertOk();
        $this->getJson('/api/v1/users/XlBanana47')->assertOk();
    }

    /**
     * The half that stops it recurring: a second account under the same name
     * in different capitals must not be creatable.
     */
    #[Test]
    public function a_name_taken_in_other_capitals_is_taken(): void
    {
        User::factory()->create(['username' => 'XLBanana47']);

        $this->assertTrue(User::byUsername('xlbanana47')->exists());
        $this->assertTrue(User::byUsername('XLBANANA47')->exists());
    }
}
