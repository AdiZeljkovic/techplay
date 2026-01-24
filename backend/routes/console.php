<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// PERFORMANCE: Flush Redis view counters to database every 5 minutes
Schedule::job(new \App\Jobs\FlushViewCounters)->everyFiveMinutes();

// MONETIZATION: Sync ad metrics from Redis to database every hour
Schedule::command('ads:sync-metrics')->hourly();

// GIVEAWAYS: Send reminder emails for giveaways ending in 24 hours (runs every 6 hours)
Schedule::job(new \App\Jobs\SendGiveawayReminders)->everySixHours();
