<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Quest;
use App\Models\QuestProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P4 unit three: the collection.
 *
 * Two payouts were tied to *reaching* a state rather than to the thing being
 * done once — and both states could be left and re-entered at will. Bounty has
 * no daily cap, so each was an unbounded printer at sixty requests a minute.
 */
class CollectionRewardsTest extends TestCase
{
    use RefreshDatabase;

    private function game(string $slug = 'elden-ring'): Game
    {
        return Game::create([
            'slug' => $slug,
            'name' => 'Elden Ring',
            'released' => '2022-02-25',
        ]);
    }

    public function test_completing_a_game_pays_once_however_often_the_status_flips(): void
    {
        $user = User::factory()->create(['bounty_balance' => 0]);
        $game = $this->game();

        $complete = fn () => $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed'])
            ->assertSuccessful();

        $complete();
        $earned = (int) $user->fresh()->bounty_balance;
        $this->assertGreaterThan(0, $earned, 'the first completion should pay');

        // completed → playing → completed, which used to pay all over again.
        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'playing'])
            ->assertSuccessful();
        $complete();
        $complete();

        $this->assertSame($earned, (int) $user->fresh()->bounty_balance);
    }

    public function test_removing_the_game_and_adding_it_back_does_not_pay_again(): void
    {
        $user = User::factory()->create(['bounty_balance' => 0]);
        $game = $this->game();

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed'])
            ->assertSuccessful();

        $earned = (int) $user->fresh()->bounty_balance;

        // A marker kept on the collection row would die with it, which is why
        // the idempotency key lives in the bounty ledger instead.
        $this->actingAs($user)
            ->deleteJson("/api/v1/collection/games/{$game->slug}")
            ->assertSuccessful();

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$game->slug}", ['status' => 'completed'])
            ->assertSuccessful();

        $this->assertSame($earned, (int) $user->fresh()->bounty_balance);
    }

    public function test_a_second_game_still_pays(): void
    {
        // The key is per game, not "completions are paid once ever".
        $user = User::factory()->create(['bounty_balance' => 0]);
        $first = $this->game('elden-ring');
        $second = $this->game('hollow-knight');

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$first->slug}", ['status' => 'completed'])
            ->assertSuccessful();
        $afterFirst = (int) $user->fresh()->bounty_balance;

        $this->actingAs($user)
            ->putJson("/api/v1/collection/games/{$second->slug}", ['status' => 'completed'])
            ->assertSuccessful();

        $this->assertGreaterThan($afterFirst, (int) $user->fresh()->bounty_balance);
    }

    public function test_one_game_cannot_walk_a_multi_game_quest_to_completion(): void
    {
        $user = User::factory()->create(['bounty_balance' => 0]);
        $game = $this->game();

        $quest = Quest::create([
            'name' => 'Rate three games',
            'slug' => 'rate-three-games',
            'description' => 'Publish reviews for three different games.',
            'type' => 'permanent',
            'criteria_type' => 'game_rated',
            'criteria_value' => 3,
            'xp_reward' => 40,
            'bounty_reward' => 40,
            'is_active' => true,
        ]);

        // Three draft→publish laps on a single review. The bounty was the
        // obvious half of this; the quest step riding along was the other.
        foreach ([false, true, false, true, false] as $draft) {
            $this->actingAs($user)
                ->postJson("/api/v1/games/{$game->slug}/ratings", [
                    'rating' => 5,
                    'review' => 'A long enough review body to count as a review.',
                    'is_draft' => $draft,
                ])->assertSuccessful();
        }

        $progress = QuestProgress::where('user_id', $user->id)
            ->where('quest_id', $quest->id)
            ->first();

        $this->assertSame(1, (int) $progress?->progress, 'one game is one step');
        $this->assertNull($progress?->completed_at);
    }

    public function test_republishing_a_review_does_not_pay_twice(): void
    {
        $user = User::factory()->create(['bounty_balance' => 0]);
        $game = $this->game();

        $publish = fn (bool $draft) => $this->actingAs($user)
            ->postJson("/api/v1/games/{$game->slug}/ratings", [
                'rating' => 5,
                'review' => 'A long enough review body to count as a review.',
                'is_draft' => $draft,
            ])->assertSuccessful();

        $publish(false);
        $earned = (int) $user->fresh()->bounty_balance;
        $this->assertGreaterThan(0, $earned);

        // Back to draft, then public again — "first time published" was read
        // off the row, so this used to pay every lap.
        $publish(true);
        $publish(false);
        $publish(true);
        $publish(false);

        $this->assertSame($earned, (int) $user->fresh()->bounty_balance);
    }
}
