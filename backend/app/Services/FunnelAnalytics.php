<?php

namespace App\Services;

use Illuminate\Support\Facades\Redis;

/**
 * Lightweight first-party funnel counters. One Redis hash per day
 * (analytics:funnel:YYYY-MM-DD), 90-day retention — same pattern as the
 * analytics:game_search zsets. Counting must never break a request,
 * so every write is wrapped in a try/catch.
 */
class FunnelAnalytics
{
    private const RETENTION_SECONDS = 60 * 60 * 24 * 90;

    /**
     * Events the public /track/event endpoint accepts. Server-side events
     * (steam_connected, xbox_connected) bypass the whitelist via increment().
     */
    public const CLIENT_EVENTS = [
        'wizard_shown',
        'wizard_steam_click',
        'wizard_xbox_submitted',
        'wizard_pick_started',
        'wizard_pick_done',
        'wizard_skipped',
        'checklist_steam_click',
        'd1_return',
    ];

    public static function increment(string $event): void
    {
        try {
            $key = 'analytics:funnel:'.now()->format('Y-m-d');
            Redis::hincrby($key, $event, 1);
            Redis::expire($key, self::RETENTION_SECONDS);
        } catch (\Throwable) {
            // Analytics must never break the request
        }
    }

    /**
     * @return array<string, int> event => count for the given day
     */
    public static function counts(string $date): array
    {
        try {
            $raw = Redis::hgetall('analytics:funnel:'.$date);

            return array_map('intval', $raw ?: []);
        } catch (\Throwable) {
            return [];
        }
    }
}
