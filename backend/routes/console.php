<?php

use App\Jobs\FlushViewCounters;
use App\Jobs\PollSteamPresence;
use App\Jobs\SendGiveawayReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// PERFORMANCE: Flush Redis view counters to database every 5 minutes
Schedule::job(new FlushViewCounters)->everyFiveMinutes();

// MONETIZATION: Sync ad metrics from Redis to database every hour
Schedule::command('ads:sync-metrics')->hourly();

// GIVEAWAYS: Send reminder emails for giveaways ending in 24 hours (runs every 6 hours)
Schedule::job(new SendGiveawayReminders)->everySixHours();

// PERFORMANCE: Clean old view tracking records daily (keep last 7 days)
Schedule::command('views:clean')->daily();

// EDITORIAL: Auto-publish scheduled articles every minute
Schedule::command('articles:publish-scheduled')->everyMinute();

// PRESENCE: Poll Steam for currently-playing status every 2 minutes
Schedule::job(new PollSteamPresence)->everyTwoMinutes();

// WISHLIST: Notify users when wishlisted games release today (runs at 09:00 daily)
Schedule::command('wishlist:check-releases')->dailyAt('09:00');

// SEO: Regenerate XML sitemaps every 6 hours
Schedule::command('sitemap:generate')->everySixHours();

// PROFILE: Snapshot reputation + monthly contribution on the 1st of each month
Schedule::command('profile:snapshot-reputation')->monthlyOn(1, '00:30');
