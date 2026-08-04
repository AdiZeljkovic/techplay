<?php

namespace Tests\Feature;

use App\Models\GameMatchDecision;
use App\Services\Releases\GameMatcher;
use App\Services\Releases\QualityFilter;
use App\Services\Releases\TitleNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReleaseAggregatorFoundationTest extends TestCase
{
    use RefreshDatabase;

    private TitleNormalizer $normalizer;

    private QualityFilter $filter;

    private GameMatcher $matcher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->normalizer = new TitleNormalizer;
        $this->filter = new QualityFilter;
        $this->matcher = new GameMatcher($this->normalizer);
    }

    /* ── normalising titles ───────────────────────────────────────────── */

    public function test_the_same_game_reads_the_same_from_every_store(): void
    {
        // The exact strings four stores would hand us for one game.
        $keys = collect([
            'Lies of P: Complete Edition',            // Steam
            'Lies of P – Complete Edition (PS5)',     // PlayStation
            'Lies of P Complete Ed.',                 // an abbreviating store
            'LIES OF P™: COMPLETE EDITION',           // shouting, with a symbol
        ])->map(fn (string $t) => $this->normalizer->key($t))->unique();

        $this->assertCount(1, $keys, 'four spellings, one game: '.$keys->implode(' | '));
        $this->assertSame('lies of p', $keys->first());
    }

    public function test_platform_packaging_is_not_part_of_the_name(): void
    {
        $this->assertSame('lous lagoon', $this->normalizer->key('Lou\'s Lagoon – Nintendo Switch™ 2 Edition'));
        $this->assertSame('hollow knight silksong', $this->normalizer->key('Hollow Knight: Silksong (PS4 & PS5)'));
    }

    public function test_edition_words_inside_a_real_title_survive(): void
    {
        // The rule that keeps the normaliser safe: it only strips from the end.
        $this->assertSame('deluxe paint', $this->normalizer->key('Deluxe Paint'));
        $this->assertSame('gold rush the game', $this->normalizer->key('Gold Rush: The Game'));
    }

    public function test_accents_and_punctuation_do_not_split_a_game_in_two(): void
    {
        $this->assertSame(
            $this->normalizer->key('Pokemon Legends'),
            $this->normalizer->key('Pokémon Legends')
        );

        $this->assertSame(
            $this->normalizer->key('Half Life Alyx'),
            $this->normalizer->key('Half-Life: Alyx')
        );
    }

    /* ── the quality gate ─────────────────────────────────────────────── */

    public function test_a_finished_game_gets_through(): void
    {
        $this->assertNull($this->filter->reject($this->candidate()));
    }

    public function test_what_the_calendar_refuses(): void
    {
        $cases = [
            'not a game (demo)' => ['type' => 'demo'],
            'not a game (dlc)' => ['type' => 'dlc'],
            'adult content' => ['adult' => true],
            'description too short' => ['description' => 'Short.'],
            'too few screenshots' => ['screenshots' => 2],
            'no publisher' => ['publisher' => null],
        ];

        foreach ($cases as $reason => $overrides) {
            $this->assertSame($reason, $this->filter->reject($this->candidate($overrides)));
        }
    }

    public function test_a_game_without_a_trailer_can_still_earn_its_place(): void
    {
        // Plenty of good small games never cut a trailer, so we ask for more
        // screenshots instead of refusing outright.
        $this->assertSame(
            'no trailer and too few screenshots',
            $this->filter->reject($this->candidate(['has_trailer' => false, 'screenshots' => 5]))
        );

        $this->assertNull($this->filter->reject($this->candidate(['has_trailer' => false, 'screenshots' => 8])));
    }

    public function test_steam_tags_catch_adult_content_before_we_ever_ask_about_it(): void
    {
        // Sexual Content, Nudity, Hentai — visible in the search listing, so
        // this rejection costs nothing.
        $this->assertTrue($this->filter->isAdultBySteamTags([19, 492, 12095]));
        $this->assertTrue($this->filter->isAdultBySteamTags([9130]));
        $this->assertFalse($this->filter->isAdultBySteamTags([19, 492, 4182]));

        // And descriptors catch whatever nobody tagged.
        $this->assertTrue($this->filter->isAdultBySteamDescriptors([2, 3]));
        $this->assertFalse($this->filter->isAdultBySteamDescriptors([2, 5]));
    }

    /* ── matching across stores ───────────────────────────────────────── */

    public function test_the_same_title_days_apart_is_one_game(): void
    {
        $this->assertSame(GameMatcher::MERGE, $this->matcher->verdict(
            ['title' => 'Silksong', 'released' => '2026-09-04', 'publisher' => 'Team Cherry'],
            ['title' => 'Silksong (PS5)', 'released' => '2026-09-06', 'publisher' => 'Team Cherry'],
        ));
    }

    public function test_a_wider_gap_still_merges_when_the_publisher_agrees(): void
    {
        $this->assertSame(GameMatcher::MERGE, $this->matcher->verdict(
            ['title' => 'Silksong', 'released' => '2026-09-04', 'publisher' => 'Team Cherry'],
            ['title' => 'Silksong', 'released' => '2026-09-28', 'publisher' => 'Team Cherry'],
        ));

        // Without that agreement it is a question, not a decision.
        $this->assertSame(GameMatcher::REVIEW, $this->matcher->verdict(
            ['title' => 'Silksong', 'released' => '2026-09-04', 'publisher' => 'Team Cherry'],
            ['title' => 'Silksong', 'released' => '2026-09-28', 'publisher' => 'Someone Else'],
        ));
    }

    public function test_a_remaster_years_later_stays_its_own_entry(): void
    {
        // The rule that protects ports and re-releases: same name, far apart,
        // never merged no matter how well everything else lines up.
        $this->assertSame(GameMatcher::SEPARATE, $this->matcher->verdict(
            ['title' => 'Lies of P', 'released' => '2026-08-10', 'publisher' => 'Neowiz'],
            ['title' => 'Lies of P', 'released' => '2027-03-10', 'publisher' => 'Neowiz'],
        ));
    }

    public function test_a_near_miss_is_asked_about_rather_than_guessed(): void
    {
        $this->assertSame(GameMatcher::REVIEW, $this->matcher->verdict(
            ['title' => 'Outcasts Reborn', 'released' => '2026-08-10', 'publisher' => 'A'],
            ['title' => 'Outcast Reborn', 'released' => '2026-08-12', 'publisher' => 'B'],
        ));
    }

    public function test_two_different_games_are_left_alone(): void
    {
        $this->assertSame(GameMatcher::SEPARATE, $this->matcher->verdict(
            ['title' => 'Voidfall', 'released' => '2026-08-10', 'publisher' => 'A'],
            ['title' => 'Echoes of Elysium', 'released' => '2026-08-11', 'publisher' => 'B'],
        ));
    }

    public function test_an_undated_title_is_never_merged_on_its_name_alone(): void
    {
        $this->assertSame(GameMatcher::REVIEW, $this->matcher->verdict(
            ['title' => 'Silksong', 'released' => null, 'publisher' => 'Team Cherry'],
            ['title' => 'Silksong', 'released' => '2026-09-04', 'publisher' => 'Team Cherry'],
        ));
    }

    public function test_an_editors_ruling_outranks_every_rule(): void
    {
        GameMatchDecision::create([
            'left_key' => 'silksong',
            'right_key' => 'silksong',
            'same_game' => false,
        ]);

        // These would merge on their own; the editor said no, so they do not.
        $this->assertSame(GameMatcher::SEPARATE, $this->matcher->verdict(
            ['title' => 'Silksong', 'released' => '2026-09-04', 'publisher' => 'Team Cherry'],
            ['title' => 'Silksong (PS5)', 'released' => '2026-09-05', 'publisher' => 'Team Cherry'],
        ));
    }

    public function test_a_ruling_is_found_whichever_way_round_the_pair_arrives(): void
    {
        GameMatchDecision::create([
            'left_key' => 'alpha',
            'right_key' => 'beta',
            'same_game' => true,
        ]);

        $this->assertSame(['alpha', 'beta'], $this->matcher->orderedPair('beta', 'alpha'));

        $this->assertSame(GameMatcher::MERGE, $this->matcher->verdict(
            ['title' => 'Beta', 'released' => '2026-08-01', 'publisher' => 'X'],
            ['title' => 'Alpha', 'released' => '2026-08-02', 'publisher' => 'Y'],
        ));
    }

    private function candidate(array $overrides = []): array
    {
        return array_merge([
            'type' => 'game',
            'title' => 'Some Game',
            'description' => str_repeat('A real description of the game. ', 10),
            'screenshots' => 8,
            'has_trailer' => true,
            'publisher' => 'A Publisher',
            'adult' => false,
        ], $overrides);
    }
}
