<?php

namespace Tests\Feature;

use App\Services\GroqService;
use App\Services\RaiderIOService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The analysis prompt cannot go stale in the two ways it already had.
 *
 * It counted down to Midnight's launch and clamped at zero, so from 2 March
 * onward every reader was told the expansion "launches March 2, 2026 - 0 days
 * left" — for the better part of six months. And it named three Mythic+ affixes
 * in a heredoc, correct for one week in early 2026 and wrong every week since;
 * the live rotation today shares only one of them.
 *
 * Both were wrong in the same way: a fact frozen at writing time, stated to the
 * reader with the same confidence as the parts read from their character.
 */
class WowPromptStaysCurrentTest extends TestCase
{
    #[Test]
    public function a_launch_that_has_passed_is_not_reported_as_a_countdown(): void
    {
        Http::fake(['raider.io/*' => Http::response([], 500)]);

        $prompt = $this->prompt();

        $this->assertStringNotContainsString('days left', $prompt);
        $this->assertStringNotContainsString('days away', $prompt);
        $this->assertStringContainsString('live since March 2, 2026', $prompt);
    }

    #[Test]
    public function pre_launch_advice_is_gone_once_the_expansion_is_live(): void
    {
        Http::fake(['raider.io/*' => Http::response([], 500)]);

        $prompt = $this->prompt();

        // A mount that stopped being obtainable at launch, and a checklist for
        // a day one that was in March.
        $this->assertStringNotContainsString('Royal Voidwing', $prompt);
        $this->assertStringNotContainsString('day 1', $prompt);
    }

    #[Test]
    public function affixes_come_from_raider_io_and_not_from_the_source(): void
    {
        Http::fake(['raider.io/*' => Http::response([
            'affix_details' => [
                ['name' => 'Fortified'],
                ['name' => "Xal'atath's Bargain: Voidbound"],
            ],
        ])]);

        $prompt = $this->prompt();

        $this->assertStringContainsString("Xal'atath's Bargain: Voidbound", $prompt);
        $this->assertStringContainsString('Fortified', $prompt);

        // The rotation that used to be written in by hand.
        $this->assertStringNotContainsString('Shardborne', $prompt);
    }

    /**
     * Silence beats a remembered answer: advice that does not mention affixes
     * is worth more than advice about last season's.
     */
    #[Test]
    public function an_unreachable_raider_io_drops_the_section_rather_than_guessing(): void
    {
        Http::fake(['raider.io/*' => Http::response([], 503)]);

        $prompt = $this->prompt();

        $this->assertStringNotContainsString('AFFIXES', $prompt);
        $this->assertStringContainsString('otherwise general', $prompt);
    }

    #[Test]
    public function the_affix_lookup_survives_a_shape_it_does_not_expect(): void
    {
        Http::fake(['raider.io/*' => Http::response(['something_else' => true])]);

        $this->assertNull(app(RaiderIOService::class)->getCurrentAffixes());
    }

    private function prompt(): string
    {
        Cache::flush();

        $method = new \ReflectionMethod(GroqService::class, 'buildPrompt');
        $method->setAccessible(true);

        return $method->invoke(app(GroqService::class), [
            'character' => ['class' => 'Paladin', 'name' => 'Testy'],
            'equipment' => ['item_level' => 620],
        ]);
    }
}
