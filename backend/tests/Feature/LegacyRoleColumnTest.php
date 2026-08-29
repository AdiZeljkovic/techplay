<?php

namespace Tests\Feature;

use App\Http\Resources\V1\PublicUserResource;
use App\Models\User;
use App\Notifications\AdminAlert;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * `users.role` decides nothing.
 *
 * It was a second source of authority next to Spatie, and it disagreed with
 * Spatie in both directions: one account read 'admin' there, three read 'user'
 * while holding Super Admin, Editor-in-Chief or Journalist. Panel access
 * stopped consulting it on 28 Aug; the public badge and the admin alert
 * audience stopped on 29 Aug. These hold that line.
 */
class LegacyRoleColumnTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function the_legacy_column_cannot_grant_a_public_admin_badge(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        $this->assertSame('member', $this->badgeFor($user));
    }

    #[Test]
    public function the_legacy_column_cannot_take_a_badge_away_either(): void
    {
        Role::findOrCreate('Super Admin');

        $user = User::factory()->create(['role' => 'user']);
        $user->assignRole('Super Admin');

        $this->assertSame('admin', $this->badgeFor($user->fresh()));
    }

    /**
     * The role the alert looks for has to be one that exists.
     *
     * The old query wanted a Spatie role literally named 'admin'. There has
     * never been one, so the only reason any alert was ever delivered was the
     * legacy column — and retiring that column would have addressed every
     * future alert to nobody, quietly.
     */
    #[Test]
    public function the_admin_alert_audience_is_a_role_that_exists(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->assertContains(
            AdminAlert::AUDIENCE,
            Role::query()->pluck('name')->all(),
            'AdminAlert::AUDIENCE names a role the seeder does not create.'
        );
    }

    #[Test]
    public function an_alert_reaches_a_super_admin_and_not_a_legacy_admin(): void
    {
        Notification::fake();

        Role::findOrCreate(AdminAlert::AUDIENCE);

        $real = User::factory()->create();
        $real->assignRole(AdminAlert::AUDIENCE);

        $legacy = User::factory()->create(['role' => 'admin']);

        $this->assertSame(1, AdminAlert::send('Job failed: SomeJob'));

        Notification::assertSentTo($real, AdminAlert::class);
        Notification::assertNotSentTo($legacy, AdminAlert::class);
    }

    /**
     * Turnstile is disabled here rather than mocked: this is about what the
     * column holds after a registration, not about the captcha in front of it.
     */
    #[Test]
    public function registration_no_longer_writes_the_column_and_the_default_holds(): void
    {
        config(['services.turnstile.enabled' => false]);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Fresh User',
            'username' => 'freshuser',
            'email' => 'freshuser@example.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertSuccessful();

        $this->assertSame('user', User::where('username', 'freshuser')->value('role'));
    }

    private function badgeFor(User $user): string
    {
        return (new PublicUserResource($user))->toArray(Request::create('/'))['role'];
    }
}
