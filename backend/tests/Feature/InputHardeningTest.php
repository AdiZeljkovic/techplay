<?php

namespace Tests\Feature;

use App\Models\PageSeo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Input hardening from P3: the two places where untrusted markup or private
 * fields reached a page that renders them.
 */
class InputHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_seo_text_is_sanitised_before_it_is_stored(): void
    {
        // The frontend renders this block with dangerouslySetInnerHTML and no
        // client-side sanitiser, on techplay.gg — the origin whose localStorage
        // holds every visitor's bearer token.
        $seo = PageSeo::create([
            'page_name' => 'Hardening Fixture',
            'page_path' => '/p3-hardening-fixture',
            'seo_text' => '<p>Real copy.</p><img src=x onerror="alert(1)"><script>alert(2)</script>',
        ]);

        $stored = $seo->fresh()->seo_text;

        $this->assertStringContainsString('Real copy.', $stored);
        $this->assertStringNotContainsString('onerror', $stored);
        $this->assertStringNotContainsString('<script', $stored);
    }

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
