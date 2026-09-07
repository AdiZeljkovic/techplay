<?php

namespace Tests\Feature;

use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The one piece of API discipline that cannot be added afterwards.
 *
 * The site and the API deploy together: change a response and you change its
 * only reader in the same minute. A released app breaks that arrangement
 * permanently. Copies of it sit on phones that will never be updated, and a
 * response edited on a Tuesday breaks a build from March — silently, because
 * that reader does not file a report, they just stop appearing.
 *
 * So the server states the oldest build it is still willing to serve and the
 * app checks on launch. Adding this before the first release costs an
 * afternoon; adding it after means the versions already out there have no way
 * to be told anything at all.
 */
class TheAppCanBeToldItIsTooOldTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_server_states_a_floor(): void
    {
        $this->getJson('/api/v1/system/app-version')
            ->assertOk()
            ->assertJsonStructure(['data' => ['minimum', 'recommended', 'store_url' => ['ios', 'android'], 'message']]);
    }

    /**
     * Reachable without a token.
     *
     * An app too old to sign in still has to be able to learn that it is too
     * old — and if this sat behind auth, the build that most needs the answer
     * is exactly the one that could not ask.
     */
    public function test_a_signed_out_app_can_ask(): void
    {
        $this->getJson('/api/v1/system/app-version')->assertOk();
    }

    /**
     * The floor is a setting, not a constant.
     *
     * On the day a bad build has to be cut off, a deploy is the last thing
     * anybody wants to be doing. This is an admin edit.
     */
    public function test_raising_the_floor_needs_no_deploy(): void
    {
        SiteSetting::updateOrCreate(['key' => 'app_min_build'], ['value' => '42']);
        SiteSetting::updateOrCreate(['key' => 'app_update_message'], ['value' => 'Build 41 had a bug in the shelf.']);

        $body = $this->getJson('/api/v1/system/app-version')->assertOk()->json('data');

        $this->assertSame(42, $body['minimum']);
        $this->assertSame('Build 41 had a bug in the shelf.', $body['message']);
    }

    /** Integers, so "older than" is a comparison rather than an argument. */
    public function test_the_numbers_are_numbers(): void
    {
        SiteSetting::updateOrCreate(['key' => 'app_min_build'], ['value' => '7']);

        $body = $this->getJson('/api/v1/system/app-version')->assertOk()->json('data');

        $this->assertIsInt($body['minimum']);
        $this->assertIsInt($body['recommended']);
    }
}
