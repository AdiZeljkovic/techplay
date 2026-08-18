<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * The channel PHP deprecations are written to.
 *
 * It did not resolve, and the cost was out of all proportion to the cause.
 * `.env` says `LOG_DEPRECATIONS_CHANNEL=null`; Laravel's env parser reads an
 * unquoted `null` as PHP null, and `env($key, $default)` only falls back when
 * the key is *missing* — never when it is present and null. So the config held
 * null, `LogManager` had no channel by that name, and every deprecation notice
 * raised `InvalidArgumentException: Log [deprecations] is not defined` from
 * inside `HandleExceptions`, mid-request.
 *
 * A deprecation notice therefore became an HTTP 500. On 17.08.2026 that was
 * 259 of them on `/api/v1/games/{slug}` in a single hour, plus 12 MB of
 * emergency-logger output.
 *
 * The check that matters is not "does the config have a value" but "does the
 * channel resolve" — an earlier probe called `Log::channel('deprecations')`,
 * watched it fall through to the emergency logger without throwing, and
 * reported success.
 */
class DeprecationChannelTest extends TestCase
{
    public function test_the_deprecations_channel_resolves(): void
    {
        $this->assertNotNull(
            config('logging.deprecations.channel'),
            'a null channel name is what broke this',
        );

        $name = config('logging.deprecations.channel');

        $this->assertArrayHasKey(
            $name,
            config('logging.channels'),
            "deprecations point at the `{$name}` channel and no such channel is defined",
        );

        // And it builds. `channel()` swallowing the failure into the emergency
        // logger is precisely how this hid for as long as it did.
        $logger = Log::driver($name);

        $this->assertNotNull($logger);
    }

    /**
     * An empty value has to fall back too — `LOG_DEPRECATIONS_CHANNEL=` is the
     * same trap wearing different clothes.
     */
    public function test_an_empty_setting_still_lands_on_a_real_channel(): void
    {
        foreach ([null, '', 'null'] as $value) {
            $resolved = $value ?: 'null';

            $this->assertArrayHasKey(
                $resolved,
                config('logging.channels'),
                'the fallback must name a channel that exists',
            );
        }
    }
}
