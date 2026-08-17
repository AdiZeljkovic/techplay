<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The command that tells people a wishlisted game came out.
 *
 * It is scheduled daily at 09:00 and it had never once completed. Both of its
 * deduplication checks use `whereJsonContains('data->…')`, and Laravel's stock
 * notifications table stores `data` as `text` — a type PostgreSQL's `->`
 * operator does not accept. Every run died on that line with
 * "operator does not exist: text -> unknown", the scheduler caught it, wrote it
 * to a log, and nobody read the log.
 *
 * Be clear about what this test does and does not prove. The suite runs on
 * SQLite, where `whereJsonContains` compiles to `json_extract` and works on a
 * text column — so these two would have passed all along, green, while
 * production failed every morning. They guard the shape of the command, not the
 * bug that was here.
 *
 * The thing that actually found it was reading the log. The thing that will
 * catch the next one is Telegram, which now carries every ERROR the moment it
 * happens rather than waiting to be read.
 */
class WishlistReleaseNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function wishlistedGame(User $user, string $released): Game
    {
        $game = Game::create([
            'name' => 'A Game Somebody Waits For',
            'slug' => 'a-game-somebody-waits-for',
            'description' => 'Long enough to be a real row.',
            'released' => $released,
        ]);

        DB::table('user_games')->insert([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'status' => 'wishlist',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $game;
    }

    public function test_the_command_completes_instead_of_throwing(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $this->wishlistedGame($user, now()->toDateString());

        // The whole failure was that this line raised a QueryException. Exit
        // code zero is the assertion.
        $this->assertSame(0, Artisan::call('wishlist:check-releases'));
    }

    /**
     * The deduplication is what touched the JSON column, so it is what has to
     * be exercised — not merely the happy path with an empty table.
     */
    public function test_it_does_not_notify_twice_for_the_same_game(): void
    {
        Notification::fake();

        $user = User::factory()->create();
        $game = $this->wishlistedGame($user, now()->toDateString());

        DB::table('notifications')->insert([
            'id' => (string) Str::uuid(),
            'type' => 'App\\Notifications\\WishlistGameReleasingNotification',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $user->id,
            'data' => json_encode([
                'type' => 'wishlist_releasing',
                'game_slug' => $game->slug,
            ]),
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        $this->assertSame(0, Artisan::call('wishlist:check-releases'));

        Notification::assertNothingSentTo($user);
    }
}
