<?php

// A scheduled task that fails silently is the most expensive kind of bug here:
// enrichment stops, chronicles freeze, sitemaps go stale, and the site keeps
// rendering perfectly. Anything registered below that matters gets this hook.
$reportFailure = function (string $task) {
    return function () use ($task) {
        \Illuminate\Support\Facades\Log::error("Scheduled task failed: {$task}");
    };
};

use App\Jobs\FlushViewCounters;
use App\Jobs\PollSteamPresence;
use App\Jobs\SendGiveawayReminders;
use App\Jobs\SendReleaseReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// PERFORMANCE: Flush Redis view counters to database every 5 minutes
Schedule::job(new FlushViewCounters)->everyFiveMinutes()->withoutOverlapping(10);

// MONETIZATION: Sync ad metrics from Redis to database every hour
// Proof of life for the cron line itself. Without this nothing inside the app
// can tell whether `* * * * * php artisan schedule:run` was ever installed —
// and if it was not, every scheduled task simply never happens, silently.
Schedule::call(function () {
    \Illuminate\Support\Facades\Cache::put('scheduler:heartbeat', now()->toIso8601String(), 3600);
})->everyMinute()->name('scheduler-heartbeat')->withoutOverlapping();

Schedule::command('ads:sync-metrics')->hourly();

// GIVEAWAYS: Send reminder emails for giveaways ending in 24 hours (runs every 6 hours)
Schedule::job(new SendGiveawayReminders)->everySixHours();

// CALENDAR: tell watchers their game landed, once, on release day
Schedule::job(new SendReleaseReminders)->dailyAt('09:00');

// One daily sip from the OpenCritic API budget — most-viewed modern games first.
Schedule::command('games:enrich-opencritic')->dailyAt('05:30')->withoutOverlapping(60)->onFailure($reportFailure('games:enrich-opencritic'));

// The daily ration of YouTube searches, spent on trailers Steam could not give us.
Schedule::command('games:enrich-trailers')->dailyAt('06:00')->withoutOverlapping(60)->onFailure($reportFailure('games:enrich-trailers'));

// The chronicle refreshes overnight for anyone whose signals moved.
Schedule::command('chronicle:rebuild --stale')->dailyAt('04:45')->withoutOverlapping(120)->onFailure($reportFailure('chronicle:rebuild --stale'));

// Steam achievements for connected accounts — the chronicle reads what you actually earn.
Schedule::command('games:sync-steam-achievements')->dailyAt('05:00')->withoutOverlapping(180)->onFailure($reportFailure('games:sync-steam-achievements'));

// PERFORMANCE: Clean old view tracking records daily (keep last 7 days)
Schedule::command('views:clean')->daily()->withoutOverlapping(60);

// EDITORIAL: Auto-publish scheduled articles every minute
Schedule::command('articles:publish-scheduled')->everyMinute()->withoutOverlapping(5)->onFailure($reportFailure('articles:publish-scheduled'));

// PRESENCE: Poll Steam for currently-playing status every 2 minutes
Schedule::job(new PollSteamPresence)->everyTwoMinutes();

// WISHLIST: Notify users when wishlisted games release today (runs at 09:00 daily)
Schedule::command('wishlist:check-releases')->dailyAt('09:00');

// SEO: Regenerate XML sitemaps every 6 hours
Schedule::command('sitemap:generate')->withoutOverlapping(30)->everySixHours()->onFailure($reportFailure('sitemap:generate'));

// New titles enter through the store aggregator below — RAWG, Moby and IGDB
// are all retired, and the catalogue is TechPlay's own from here on.

// CALENDAR: read the stores into our own tables, then fold the duplicates.
// The window is relative to today, so the far month joins it on its own, and a
// weekly pass is nearly free — a title we already hold costs no request.
Schedule::command('releases:sync')->weeklyOn(1, '03:00')->withoutOverlapping();
Schedule::command('releases:merge')->weeklyOn(1, '05:30');

// PROFILE: Snapshot reputation + monthly contribution on the 1st of each month
Schedule::command('profile:snapshot-reputation')->monthlyOn(1, '00:30');

// LEADERBOARD: Weekly baseline snapshot every Monday (powers period=week boards)
Schedule::command('profile:snapshot-reputation --weekly')->weeklyOn(1, '00:10');

// CLANS: weekly mission board for every clan with a Mission Control
Schedule::command('clans:spawn-missions')->weeklyOn(1, '00:20');

// CLANS: settle any ended, unsettled season (idempotent)
Schedule::command('clans:settle-season')->dailyAt('00:40')->withoutOverlapping(30);

// SEASONS: Conclude finished seasons (awards champion badges) — daily check
Schedule::command('season:conclude')->dailyAt('00:20')->withoutOverlapping(30);

// RETENTION: Weekly digest email every Friday afternoon
Schedule::command('profile:send-weekly-digest')->weeklyOn(5, '16:00');

// FORUM: Unpin bounty-funded self-pins once their 24h window expires
Schedule::command('forum:clear-expired-pins')->hourly()->withoutOverlapping(10);

// CAMPAIGN: Founder badge for the first 50 full profiles — no-ops once all
// 50 are awarded, so it can stay scheduled for the whole campaign
Schedule::command('campaign:founders')->dailyAt('10:00');
