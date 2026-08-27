<?php

// A scheduled task that fails silently is the most expensive kind of bug here:
// enrichment stops, chronicles freeze, sitemaps go stale, and the site keeps
// rendering perfectly. Every scheduled *command* below carries this hook.
//
// Schedule::job() entries do not: onFailure there fires if the dispatch fails,
// not if the job does, so those are answered for by the failed_jobs table and
// `diagnose:queue`. The weekly reputation snapshot and the release sync are the
// two worth watching hardest — when they fail nothing breaks visibly, the
// weekly leaderboard just quietly starts measuring from nowhere and the
// calendar quietly stops learning about new games.
$reportFailure = function (string $task) {
    return function () use ($task) {
        Log::error("Scheduled task failed: {$task}");
    };
};

use App\Jobs\FlushViewCounters;
use App\Jobs\PollSteamPresence;
use App\Jobs\SendGiveawayReminders;
use App\Jobs\SendReleaseReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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
    Cache::put('scheduler:heartbeat', now()->toIso8601String(), 3600);
})->everyMinute()->name('scheduler-heartbeat')->withoutOverlapping();

Schedule::command('ads:sync-metrics')->hourly()->onFailure($reportFailure('ads:sync-metrics'));

// GIVEAWAYS: Send reminder emails for giveaways ending in 24 hours (runs every 6 hours)
Schedule::job(new SendGiveawayReminders)->everySixHours();

// CALENDAR: tell watchers their game landed, once, on release day
Schedule::job(new SendReleaseReminders)->dailyAt('09:00');

// One daily sip from the OpenCritic API budget — most-viewed modern games first.
// Keep-alive for the Steam drip. The job chains itself, so a worker restart
// mid-batch ends it silently; EnrichSteamBatch is ShouldBeUnique, so this is a
// no-op while the chain is running and a revival when it has stopped.
Schedule::command('games:enrich-steam')->hourly()
    ->withoutOverlapping(30)
    ->onFailure($reportFailure('games:enrich-steam'));

Schedule::command('games:enrich-opencritic')->dailyAt('05:30')->withoutOverlapping(60)->onFailure($reportFailure('games:enrich-opencritic'));

// The daily ration of YouTube searches, spent on trailers Steam could not give us.
Schedule::command('games:enrich-trailers')->dailyAt('06:00')->withoutOverlapping(60)->onFailure($reportFailure('games:enrich-trailers'));

// The chronicle refreshes overnight for anyone whose signals moved.
Schedule::command('chronicle:rebuild --stale')->dailyAt('04:45')->withoutOverlapping(120)->onFailure($reportFailure('chronicle:rebuild --stale'));

// Registrations nobody ever confirmed. They cannot sign in, but they do hold
// an email address and a username out of circulation — including addresses
// belonging to people who never signed up in the first place.
Schedule::command('users:prune-unverified')
    ->dailyAt('03:20')
    ->withoutOverlapping(30)
    ->onFailure($reportFailure('users:prune-unverified'));

// Steam achievements for connected accounts — the chronicle reads what you actually earn.
Schedule::command('games:sync-steam-achievements')->dailyAt('05:00')->withoutOverlapping(180)->onFailure($reportFailure('games:sync-steam-achievements'));

// PLATFORMS: the libraries themselves — games, hours, statuses.
//
// Presence was polled every two minutes and achievements nightly, but the
// shelf everything else is derived from only moved when somebody pressed
// Re-sync by hand, so a library linked in August still read as August in
// December. Weekly, because a library is not fast-moving and each Steam sync
// now costs one call per played game. Wednesday keeps it clear of Monday,
// which already carries releases:sync, releases:merge and the reputation
// snapshot.
Schedule::command('platforms:resync')
    ->weeklyOn(3, '04:00')
    ->withoutOverlapping(180)
    ->onFailure($reportFailure('platforms:resync'));

// EDITORIAL: Auto-publish scheduled articles every minute
Schedule::command('articles:publish-scheduled')->everyMinute()->withoutOverlapping(5)->onFailure($reportFailure('articles:publish-scheduled'));

// PRESENCE: Poll Steam for currently-playing status every 2 minutes
Schedule::job(new PollSteamPresence)->everyTwoMinutes();

// WISHLIST: Notify users when wishlisted games release today (runs at 09:00 daily)
Schedule::command('wishlist:check-releases')->dailyAt('09:00')->onFailure($reportFailure('wishlist:check-releases'));

/*
 * Two speeds, because the two halves of the sitemap are nothing alike.
 *
 * The catalogue is 294,000 games and 32,000 studios and takes about half an
 * hour. Everything else — articles, categories, pages, lists — is a few
 * kilobytes and finishes in under a second. Running them together every six
 * hours meant walking the whole catalogue to add one article: two hours of the
 * day rewriting rows the aggregator touches once.
 *
 * Split, a published piece reaches sitemap-articles.xml within fifteen minutes
 * instead of up to six, and the heavy pass runs once, at night, when nobody is
 * reading.
 *
 * A breaking story does not wait for either: ArticleObserver writes
 * sitemap-news.xml on publish and pings IndexNow in the same breath.
 *
 * Only the full run prunes retired files, so the nightly pass is also what
 * keeps a dropped sitemap from being served forever.
 */
Schedule::command('sitemap:generate --content')
    ->everyFifteenMinutes()
    ->withoutOverlapping(10)
    ->onFailure($reportFailure('sitemap:generate --content'));

Schedule::command('sitemap:generate')
    ->dailyAt('03:30')
    ->withoutOverlapping(90)
    ->onFailure($reportFailure('sitemap:generate'));

// New titles enter through the store aggregator below — RAWG, Moby and IGDB
// are all retired, and the catalogue is TechPlay's own from here on.

// CALENDAR: read the stores into our own tables, then fold the duplicates.
// The window is relative to today, so the far month joins it on its own, and a
// weekly pass is nearly free — a title we already hold costs no request.
Schedule::command('releases:sync')->weeklyOn(1, '03:00')->withoutOverlapping()->onFailure($reportFailure('releases:sync'));
Schedule::command('releases:merge')->weeklyOn(1, '05:30')->onFailure($reportFailure('releases:merge'));

// PROFILE: Snapshot reputation + monthly contribution on the 1st of each month
Schedule::command('profile:snapshot-reputation')->monthlyOn(1, '00:30')->onFailure($reportFailure('profile:snapshot-reputation'));

// LEADERBOARD: Weekly baseline snapshot every Monday (powers period=week boards)
Schedule::command('profile:snapshot-reputation --weekly')->weeklyOn(1, '00:10')->onFailure($reportFailure('profile:snapshot-reputation --weekly'));

// PROFILE: Nightly achievement sweep.
//
// Most achievements are granted inline by whatever caused them. A dozen have
// no such moment — early_adopter, support_duration, long_posts,
// comment_likes_received, thread_upvotes_received — and until this was
// scheduled they could only be handed out by running the command by hand,
// which meant they sat earned and ungranted for months.
Schedule::command('achievements:sync')->dailyAt('04:15')->withoutOverlapping(60)->onFailure($reportFailure('achievements:sync'));

// SEASONS: Conclude finished seasons (awards champion badges) — daily check
Schedule::command('season:conclude')->dailyAt('00:20')->withoutOverlapping(30)->onFailure($reportFailure('season:conclude'));

// RETENTION: Weekly digest email every Friday afternoon
Schedule::command('profile:send-weekly-digest')->weeklyOn(5, '16:00')->onFailure($reportFailure('profile:send-weekly-digest'));

// FORUM: Unpin bounty-funded self-pins once their 24h window expires
Schedule::command('forum:clear-expired-pins')->hourly()->withoutOverlapping(10)->onFailure($reportFailure('forum:clear-expired-pins'));

// CAMPAIGN: Founder badge for the first 50 full profiles — no-ops once all
// 50 are awarded, so it can stay scheduled for the whole campaign
Schedule::command('campaign:founders')->dailyAt('10:00')->onFailure($reportFailure('campaign:founders'));
