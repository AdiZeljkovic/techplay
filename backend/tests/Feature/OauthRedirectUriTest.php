<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * The address we hand a provider has to be one we can actually answer on.
 *
 * Discord's default here once pointed at `https://techplay.gg/auth/callback/discord`
 * — a path Next.js does not serve. Anyone who got through the consent screen
 * landed on a 404, and nothing in the codebase would have said so: the value is
 * a string in config, and a string that is wrong looks exactly like a string
 * that is right.
 *
 * This does not and cannot check the provider's own portal. A redirect_uri has
 * to match there too, character for character, and only the account holder can
 * see that list — which is the other half of "Invalid OAuth2 redirect_uri" and
 * the half no test can reach.
 */
class OauthRedirectUriTest extends TestCase
{
    /** @return array<string, array{0: string}> */
    public static function providers(): array
    {
        return [
            'discord' => ['discord'],
        ];
    }

    /**
     * The value that used to ship, held up against the same rule — so this
     * test is known to fail on the thing it exists to catch, rather than
     * merely passing on the thing that already works.
     */
    public function test_the_old_default_would_not_have_passed_this(): void
    {
        $path = ltrim((string) parse_url('https://techplay.gg/auth/callback/discord', PHP_URL_PATH), '/');

        $known = collect(Route::getRoutes()->getRoutes())->map(fn ($route) => $route->uri())->all();

        $this->assertNotContains($path, $known);
    }

    /**
     * @dataProvider providers
     */
    public function test_the_configured_callback_is_a_route_this_app_serves(string $provider): void
    {
        $configured = config("services.{$provider}.redirect");

        $this->assertIsString($configured, "services.{$provider}.redirect is not configured.");

        $path = parse_url($configured, PHP_URL_PATH);
        $this->assertIsString($path, "services.{$provider}.redirect is not a URL: {$configured}");

        // Laravel's routes carry no leading slash.
        $needle = ltrim($path, '/');

        $known = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => $route->uri())
            ->all();

        $this->assertContains(
            $needle,
            $known,
            "services.{$provider}.redirect points at {$path}, which this application has no route for. "
            .'A provider will send the reader there after consent and they will land on a 404.'
        );
    }
}
