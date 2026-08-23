<?php

namespace Tests\Feature;

use App\Models\ConnectedAccount;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Services\ProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * What a visitor is told about a player before anything else.
 *
 * A public profile opened on a showcase and a shelf — what this person owns —
 * and carried no figure that separated a shelf filled in an afternoon from
 * nine years of playing. The numbers existed; they lived two tabs away on a
 * page that loads the whole library to derive them, which is not something to
 * do on every public profile view. This card asks the database for sums.
 *
 * The empty case is the common one: of fifty-three accounts on the site, one
 * has a library worth describing. So the rules about what *not* to draw
 * matter more than the arithmetic.
 */
class PublicProfilePlayerCardTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => ucfirst(str_replace('-', ' ', $slug)),
            'released' => '2018-01-01',
            'genres' => ['RPG'],
            'platforms' => ['PC'],
            'tags' => [],
        ]);
    }

    private function shelve(User $user, string $slug, int $hours, ?string $lastPlayed = null): UserGame
    {
        return UserGame::create([
            'user_id' => $user->id,
            'game_id' => $this->game($slug)->id,
            'status' => 'played',
            'hours_played' => $hours,
            'playtime_minutes' => $hours * 60,
            'last_played_at' => $lastPlayed,
        ]);
    }

    private function card(User $user): array
    {
        return app(ProfileService::class)->playerCard($user);
    }

    public function test_it_sums_the_hours_and_names_the_deepest_game(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'rust', 600);
        $this->shelve($user, 'hades', 300);
        $this->shelve($user, 'celeste', 100);
        // Owned, never opened — it counts on the shelf and not in the hours.
        $this->shelve($user, 'control', 0);

        $card = $this->card($user);

        $this->assertSame(1000, $card['hours']);
        $this->assertSame(3, $card['games_played']);
        $this->assertSame('rust', $card['deepest']['slug']);
        $this->assertSame(600, $card['deepest']['hours']);
        // The share is of the hours, not of the shelf: 600 of 1000.
        $this->assertSame(60, $card['deepest']['share']);
    }

    public function test_the_span_runs_from_the_first_year_played_to_the_last(): void
    {
        $user = User::factory()->create();

        $this->shelve($user, 'skyrim', 40, '2016-04-02 10:00:00');
        $this->shelve($user, 'elden-ring', 90, '2022-03-10 10:00:00');
        $this->shelve($user, 'hades', 20, '2026-01-05 10:00:00');
        // No date on this one — it must not drag the span anywhere.
        $this->shelve($user, 'tunic', 12);

        $span = $this->card($user)['span'];

        $this->assertSame(2016, $span['from']);
        $this->assertSame(2026, $span['to']);
    }

    public function test_a_shelf_with_no_dates_has_no_span_rather_than_this_year(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, 'rust', 30);

        $this->assertNull($this->card($user)['span']);
    }

    public function test_achievements_are_null_without_a_connected_platform(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, 'rust', 30);

        // Not zero. Nobody connected a platform, which is a different
        // statement from having earned nothing — and a card that draws "0%"
        // accuses a reader of something they never had the chance to do.
        $this->assertNull($this->card($user)['achievements']);
    }

    public function test_it_counts_earned_platform_achievements_and_their_rate(): void
    {
        $user = User::factory()->create();
        $game = $this->game('hades');

        foreach ([true, true, true, false] as $i => $achieved) {
            DB::table('steam_achievements')->insert([
                'user_id' => $user->id,
                'game_id' => $game->id,
                'steam_appid' => 1145360,
                'api_name' => "ach_{$i}",
                'display_name' => "Achievement {$i}",
                'achieved' => $achieved,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $ach = $this->card($user)['achievements'];

        $this->assertSame(4, $ach['total']);
        // `achieved` is cast to boolean on the model, and a sum aliased to a
        // cast name comes back as `true` rather than 3. The alias here is not
        // one, and this is the assertion that says so.
        $this->assertSame(3, $ach['earned']);
        $this->assertSame(75, $ach['rate']);
    }

    public function test_an_untouched_shelf_reports_zero_rather_than_dividing_by_it(): void
    {
        $user = User::factory()->create();
        $this->shelve($user, 'control', 0);

        $card = $this->card($user);

        $this->assertSame(0, $card['hours']);
        $this->assertSame(0, $card['games_played']);
        // No deepest game: nothing was played, so nothing is the most played.
        $this->assertNull($card['deepest']);
    }

    public function test_the_public_payload_carries_the_card_and_no_longer_the_dead_dna_key(): void
    {
        $user = User::factory()->create(['profile_visibility' => 'public']);
        $this->shelve($user, 'rust', 120, '2019-06-01 10:00:00');

        ConnectedAccount::create([
            'user_id' => $user->id,
            'provider' => 'steam',
            'provider_user_id' => '76561198000000000',
        ]);

        $response = $this->getJson("/api/v1/users/{$user->username}");

        $response->assertOk()
            ->assertJsonPath('player_card.hours', 120)
            ->assertJsonPath('player_card.span.from', 2019)
            ->assertJsonPath('connected_accounts.0', 'steam');

        // `gamer_dna` was a second copy of platforms_genres plus a favourites
        // query, computed on every view of every public profile and read by no
        // component on the site.
        $response->assertJsonMissingPath('gamer_dna');
    }
}
