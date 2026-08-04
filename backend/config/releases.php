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

        'default' => [
            'min_description' => 200,
            'min_screenshots' => 4,
            // A game with no trailer has to make up for it in screenshots.
            'screenshots_without_trailer' => 6,
            'require_publisher' => true,
        ],

        /*
         * The eShop is curated: Nintendo approves every listing, so there is
         * very little of what these rules exist to catch — 178 upcoming titles
         * against Steam's 13,000.
         *
         * Its search API also carries no screenshots and no trailers at all,
         * and what it calls a description is a one-line hook of about sixty
         * characters ("Survive day and night on a small island in the middle
         * of the ocean."). Steam's thresholds applied here would not filter
         * Nintendo's catalogue, they would erase it — so the floor is set only
         * high enough to catch a listing with nothing written about it.
         */
        'nintendo' => [
            'min_description' => 40,
            'min_screenshots' => 0,
            'screenshots_without_trailer' => 0,
            'require_publisher' => true,
        ],

        /*
         * Microsoft's display catalogue answers with as much as Steam does —
         * full descriptions and seven to sixteen screenshots — so Xbox is held
         * to the same standard. It never reports a trailer, though, so the
         * make-up-for-it threshold is set level with the plain one rather than
         * gating the whole catalogue on something the source cannot provide.
         */
        'xbox' => [
            'min_description' => 200,
            'min_screenshots' => 4,
            'screenshots_without_trailer' => 4,
            'require_publisher' => true,
        ],

        /*
         * A pre-order page is an announcement, and Sony writes it like one.
         * Measured across 18 upcoming titles the descriptions are bimodal:
         * twelve between 16 and 71 characters, six between 1,600 and 2,400.
         * The short ones are not thin listings, they are games that have not
         * come out yet — Steam's 200-character floor would have refused
         * two-thirds of them, exclusives included.
         *
         * Screenshots are the signal that survives here: a median of eight,
         * and only the genuinely empty listings have none. Sony curates the
         * store anyway, so there is little for a gate to catch.
         */
        'playstation' => [
            'min_description' => 15,
            'min_screenshots' => 3,
            'screenshots_without_trailer' => 3,
            'require_publisher' => true,
        ],

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
    | What PlayStation calls a game
    |--------------------------------------------------------------------------
    |
    | Sony classifies every product, which is a gift — but the pre-orders
    | collection is mostly Ultimate and Deluxe editions, and those are not
    | FULL_GAME. They are still games: the same game with extras, and the title
    | normaliser strips the edition suffix so they merge with the plain version
    | from Steam or Xbox anyway.
    |
    | What must stay out is add-ons, season passes and currency, which is what
    | this list is for. Anything not named here is refused by name, so a
    | classification we have not seen before is reported rather than assumed.
    |
    */

    'playstation_kinds' => [
        'FULL_GAME',
        'PREMIUM_EDITION',
        'GAME_BUNDLE',
        'DELUXE_EDITION',
        'STANDARD_EDITION',
        'CROSS_BUY',
    ],

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

        /*
         * Xbox barely needs one. Microsoft's certification does not admit
         * Adults Only products at all, so unlike Steam — where anyone may
         * publish — the storefront is the filter and this is only a backstop.
         *
         * It is one code rather than a family of them because a wider match
         * was measured doing real damage: 'sex' alone caught 29% of a
         * 200-title sample, and what it caught was "PEGI:SexInn" — sexual
         * innuendo — on ordinary JRPGs and visual novels. Boards flag a
         * spectrum; only the top of it means a product does not belong here.
         */
        'xbox_descriptors' => ['esrb:ao'],
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
    | What reaches the calendar page
    |--------------------------------------------------------------------------
    |
    | The quality gate above decides what is worth storing. This decides what is
    | worth showing, and they are different questions: a three-month window of
    | everything the four stores ship is around 1,300 titles, and most of a
    | month's four hundred are small PC releases nobody came looking for.
    |
    | Nothing is deleted. An entry that fails this is still in the database,
    | still searchable, still has its own page — it simply does not crowd the
    | month. Loosening it later is a number here rather than another hour of
    | reading somebody's store.
    |
    | A title passes on any one of these, because each is a different kind of
    | evidence that somebody meant it:
    |
    |   - it ships on more than one platform, so a publisher is behind it
    |   - somebody cut a trailer, which asset flips do not do
    |   - critics have scored it
    |   - our own visitors have wishlisted it
    |   - it clears both a screenshot count and a description length that,
    |     together, no shovelware listing bothers with
    |
    */

    'calendar' => [
        'min_stores' => 2,
        'min_wishlists' => 1,
        'substantial' => [
            'screenshots' => 8,
            'description' => 600,
        ],
    ],

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

    /*
    |--------------------------------------------------------------------------
    | Xbox
    |--------------------------------------------------------------------------
    |
    | Xbox is the one store that will not say which of its titles are still to
    | come. Steam and Nintendo hand us a date in the listing; Xbox's only
    | enumerable index is its sitemap, and a sitemap carries ids and nothing
    | else. So the release date has to be asked for, product by product.
    |
    | That sounds worse than it is. Asking happens once per product, ever — the
    | answer is kept, including for products that fall outside the window, so
    | the window moving forward is afterwards a question for our own database
    | rather than for Microsoft. Measured: 42,036 products, 211 batched
    | requests, about five minutes. Every pass after the first only asks about
    | ids the sitemap has gained since.
    |
    */

    'xbox' => [
        'batch' => 200,
        'sitemap_index' => 'https://www.xbox.com/sitemap.xml',
        // Product detail pages for the market we read.
        'sitemap_pattern' => '/pdp-en-US-sitemap-',
    ],

];
