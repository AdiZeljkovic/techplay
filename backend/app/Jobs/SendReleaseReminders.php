<?php

namespace App\Jobs;

use App\Models\Game;
use App\Models\User;
use App\Models\UserGame;
use App\Notifications\GameReleaseNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Everyone who asked to hear about a game hears about it on the day it
 * releases — once. The reminder flag is cleared as it fires, so a rerun
 * cannot send twice.
 */
class SendReleaseReminders implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $today = now()->toDateString();

        $games = Game::whereDate('released', $today)->get(['id', 'name', 'slug', 'cover_url']);

        if ($games->isEmpty()) {
            return;
        }

        foreach ($games as $game) {
            $watchers = UserGame::where('game_id', $game->id)
                ->where('notify_on_release', true)
                ->pluck('user_id');

            foreach (User::whereIn('id', $watchers)->get() as $user) {
                try {
                    $user->notify(new GameReleaseNotification($game));
                } catch (\Throwable $e) {
                    Log::warning("Release reminder failed: {$e->getMessage()}", [
                        'user_id' => $user->id, 'game_id' => $game->id,
                    ]);
                }
            }

            // Fired means done — the flag is the pending state, not a setting.
            UserGame::where('game_id', $game->id)
                ->where('notify_on_release', true)
                ->update(['notify_on_release' => false]);
        }
    }
}
