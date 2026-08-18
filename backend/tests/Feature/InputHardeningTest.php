<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Input hardening from P3: the places where untrusted markup or private fields
 * reached a page that renders them.
 *
 * One of the two is gone rather than fixed. `seo_text` was a free-text HTML
 * block rendered on the frontend with `dangerouslySetInnerHTML` and no
 * client-side sanitiser, on the origin whose localStorage holds every visitor's
 * bearer token; its guard lived here. The column was dropped on 18.08.2026, so
 * the guard went with it — a test that writes to a column that no longer exists
 * asserts nothing, and reads as coverage.
 */
class InputHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_visitor_does_not_receive_someone_elses_wallet(): void
    {
        $owner = User::factory()->create([
            'username' => 'spender',
            'bounty_balance' => 4200,
        ]);

        // The profile page only renders bounty behind isOwnProfile, but the
        // API used to ship it to everyone regardless.
        $visitor = $this->getJson('/api/v1/users/spender')->assertOk()->json();
        $this->assertArrayNotHasKey('bounty_balance', $visitor['stats'] ?? []);

        $own = $this->actingAs($owner)->getJson('/api/v1/users/spender')->assertOk()->json();
        $this->assertSame(4200, $own['stats']['bounty_balance'] ?? null);
    }
}
