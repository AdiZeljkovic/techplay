<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\UserGame;
use App\Notifications\WishlistGameReleasingNotification;
use Illuminate\Console\Command;

class CheckWishlistReleases extends Command
{
    protected $signature = 'wishlist:check-releases';

    protected $description = 'Notify users when a wishlisted game releases today';

    public function handle(): void
    {
        $today = now()->toDateString();

        $releasingToday = Game::whereDate('released', $today)->pluck('id');

        if ($releasingToday->isEmpty()) {
            return;
        }

        $entries = UserGame::whereIn('game_id', $releasingToday)
            ->where('status', 'wishlist')
            ->with(['user', 'game'])
            ->get();

        foreach ($entries as $entry) {
            if (! $entry->user || ! $entry->game) {
                continue;
            }
            try {
                $entry->user->notify(new WishlistGameReleasingNotification($entry->game));
            } catch (\Throwable) {
            }
        }

        $this->info("Notified {$entries->count()} wishlister(s) about {$releasingToday->count()} releasing game(s).");
    }
}
