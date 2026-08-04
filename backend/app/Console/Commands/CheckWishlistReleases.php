<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\UserGame;
use App\Notifications\WishlistGameReleasingNotification;
use App\Notifications\WishlistGameReleasingSoonNotification;
use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;

class CheckWishlistReleases extends Command
{
    protected $signature = 'wishlist:check-releases';

    protected $description = 'Notify users when a wishlisted game releases today or in 3 days';

    public function handle(): void
    {
        $today = now()->toDateString();
        $in3days = now()->addDays(3)->toDateString();

        $this->notifyForDate($today, 0);
        $this->notifyForDate($in3days, 3);
    }

    private function notifyForDate(string $date, int $daysAway): void
    {
        $games = Game::whereDate('released', $date)->pluck('id', 'id');

        if ($games->isEmpty()) {
            return;
        }

        $entries = UserGame::whereIn('game_id', $games)
            ->where('status', 'wishlist')
            ->with(['user', 'game'])
            ->get();

        $notified = 0;

        foreach ($entries as $entry) {
            if (! $entry->user || ! $entry->game) {
                continue;
            }

            // Dedup: skip if this user already got this type of notification
            // for this game in the last 5 days
            $notifType = $daysAway === 0 ? 'wishlist_releasing' : 'wishlist_releasing_soon';
            $alreadySent = DatabaseNotification::where('notifiable_type', 'App\\Models\\User')
                ->where('notifiable_id', $entry->user->id)
                ->whereJsonContains('data->type', $notifType)
                ->whereJsonContains('data->game_slug', $entry->game->slug)
                ->where('created_at', '>=', now()->subDays(5))
                ->exists();

            if ($alreadySent) {
                continue;
            }

            try {
                if ($daysAway === 0) {
                    $entry->user->notify(new WishlistGameReleasingNotification($entry->game));
                } else {
                    $entry->user->notify(new WishlistGameReleasingSoonNotification($entry->game, $daysAway));
                }
                $notified++;
            } catch (\Throwable) {
            }
        }

        $label = $daysAway === 0 ? 'today' : "in {$daysAway} days";
        $this->info("[$label] Notified {$notified} user(s) for ".$games->count().' game(s) releasing '.$label.'.');
    }
}
