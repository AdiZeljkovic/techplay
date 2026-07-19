<?php

namespace App\Console\Commands;

use App\Models\Season;
use App\Models\User;
use App\Notifications\WeeklyDigestNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Weekly retention digest. Queued per user; only sent to verified users
 * who have something worth reading (games, streak or wishlist) and have
 * not opted out (settings.notifications.weekly_digest === false).
 */
class SendWeeklyDigest extends Command
{
    protected $signature = 'profile:send-weekly-digest {--dry-run : Count recipients without sending}';

    protected $description = 'Send the weekly digest email (streak, your games in the news, wishlist releases, season)';

    public function handle(): int
    {
        $season = Season::active();
        $seasonData = $season && $season->end_date ? [
            'name' => $season->name,
            'days_remaining' => max(0, (int) now()->diffInDays($season->end_date, false)),
        ] : null;

        $sent = 0;
        $dryRun = (bool) $this->option('dry-run');

        User::query()
            ->whereNotNull('email_verified_at')
            ->chunkById(200, function ($users) use (&$sent, $seasonData, $dryRun) {
                foreach ($users as $user) {
                    if (data_get($user->settings, 'notifications.weekly_digest') === false) {
                        continue;
                    }

                    // Fresh articles (7d) about games in the user's collection
                    $articles = DB::table('articles')
                        ->join('user_games', 'user_games.game_id', '=', 'articles.game_id')
                        ->join('categories', 'categories.id', '=', 'articles.category_id')
                        ->where('user_games.user_id', $user->id)
                        ->where('articles.status', 'published')
                        ->where('articles.published_at', '>=', now()->subDays(7))
                        ->orderByDesc('articles.published_at')
                        ->limit(3)
                        ->get(['articles.title', 'articles.slug', 'categories.type'])
                        ->map(fn ($a) => [
                            'title' => $a->title,
                            'url' => '/'.match ($a->type) {
                                'review', 'reviews' => 'reviews',
                                'tech', 'hardware' => 'hardware',
                                'guide', 'guides' => 'guides',
                                default => 'news',
                            }."/{$a->slug}",
                        ])
                        ->all();

                    // Wishlist releases in the next 14 days
                    $upcoming = DB::table('user_games')
                        ->join('games', 'games.id', '=', 'user_games.game_id')
                        ->where('user_games.user_id', $user->id)
                        ->where('user_games.status', 'wishlist')
                        ->whereBetween('games.released', [now(), now()->addDays(14)])
                        ->orderBy('games.released')
                        ->limit(3)
                        ->get(['games.name', 'games.released'])
                        ->map(fn ($g) => ['name' => $g->name, 'released' => substr((string) $g->released, 0, 10)])
                        ->all();

                    $streak = (int) ($user->daily_streak ?? 0);

                    // Skip users with an empty digest — no spam
                    if ($streak === 0 && empty($articles) && empty($upcoming)) {
                        continue;
                    }

                    if (! $dryRun) {
                        $user->notify(new WeeklyDigestNotification($streak, $articles, $upcoming, $seasonData));
                    }
                    $sent++;
                }
            });

        $this->info(($dryRun ? '[dry-run] Would send' : 'Queued')." {$sent} digests.");

        return self::SUCCESS;
    }
}
