<?php

/**
 * The release calendar aggregator.
 *
 * Every number the aggregator leans on lives here, because all of them are
 * judgement calls we will want to retune once we see real output — and none of
 * them should require reading code to find.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | The window
    |--------------------------------------------------------------------------
    |
    | We carry a rolling window of months rather than the stores' full firehose.
    | Months that fall out of the back are kept forever — they are already paid
    | for and never refetched — so the archive grows on its own.
    |
    */

    'window_months' => 3,

    /*
    |--------------------------------------------------------------------------
    | Quality gate
    |--------------------------------------------------------------------------
    |
    | Steam ships roughly 1,800 titles a month and a large share of it is
    | shovelware. Measured against a sample of 40 upcoming titles these rules
    | reject about half, most of it on the description threshold.
    |
    | 'min_description' does the heaviest lifting and is the most likely to
    | catch a legitimate small indie. If good games start disappearing, this is
    | the first number to lower.
    |
    */

    'quality' => [
        'min_description' => 200,
        'min_screenshots' => 4,
        // A game with no trailer has to make up for it in screenshots.
        'screenshots_without_trailer' => 6,
        'require_publisher' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | What is never a calendar entry
    |--------------------------------------------------------------------------
    |
    | Steam's "coming soon" list mixes demos, DLC and soundtracks in with games.
    | Only 'game' belongs on a release calendar.
    |
    */

    'allowed_types' => ['game'],

    /*
    |--------------------------------------------------------------------------
    | Adult content
    |--------------------------------------------------------------------------
    |
    | Two independent gates, because each catches what the other misses.
    |
    | Steam tag ids are visible in the search listing itself, so this filter
    | costs nothing — a flagged title is dropped before we ever ask about it.
    | Content descriptors only arrive with the full detail payload, and catch
    | anything the community has not tagged.
    |
    | Steam already hides adult-only titles from anonymous browsing, so these
    | rules are the second line, not the first: 1.5% of a 391-title sample.
    |
    */

    'adult' => [
        // Sexual Content, Nudity, Hentai
        'steam_tag_ids' => [12095, 6650, 9130],
        // 3 = Adult Only Sexual Content, 4 = Frequent Nudity or Sexual Content
        'steam_descriptor_ids' => [3, 4],
    ],

    /*
    |--------------------------------------------------------------------------
    | Matching the same game across stores
    |--------------------------------------------------------------------------
    |
    | Fuzzy matching runs exactly once per game: the moment a title is linked to
    | a store id, every later sync is an exact lookup. These thresholds only
    | ever govern first contact.
    |
    | 'auto_days' — identical normalised title this close together is the same
    | game. 'publisher_days' — a wider gap is still safe when the publisher
    | agrees. 'review_similarity'/'review_days' — close enough to ask an editor,
    | never close enough to decide alone. 'never_merge_days' — beyond this a
    | shared title means a port or a remaster, which must stay a separate entry.
    |
    */

    'matching' => [
        'auto_days' => 7,
        'publisher_days' => 30,
        'review_similarity' => 0.88,
        'review_days' => 14,
        'never_merge_days' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Which store's art wins
    |--------------------------------------------------------------------------
    |
    | Every store offers a 16:9 asset, which is the shape the calendar card
    | wants. When a game exists in several places we take the first available in
    | this order rather than whichever store happened to sync last.
    |
    */

    'hero_priority' => ['steam', 'playstation', 'xbox', 'nintendo'],

    /*
    |--------------------------------------------------------------------------
    | Politeness
    |--------------------------------------------------------------------------
    |
    | These are other people's servers and we are a guest on them.
    |
    | Steam's detail endpoint throttles at roughly 200 requests per five
    | minutes. A one-second gap sat just over that line and cost 115 titles to
    | throttling in the first production run, so this now leaves headroom
    | rather than racing the limit. A month still finishes inside forty
    | minutes, which is fine for a job nobody is waiting on.
    |
    */

    'delay_ms' => 1500,
    'timeout' => 20,

];
