<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Telegram alerts
    |--------------------------------------------------------------------------
    | One bot carries both halves of the monitoring: Netdata's alarms about the
    | machine, and this application's exceptions through the `telegram` log
    | channel. Same chat, so there is one place to look.
    */

    'telegram' => [
        'token' => env('TELEGRAM_ALERT_TOKEN'),
        'chat_id' => env('TELEGRAM_ALERT_CHAT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Internal server-to-server auth
    |--------------------------------------------------------------------------
    | The Next.js SSR process presents this token (X-Internal-Token) so the
    | api rate limiter can tell our own server from a visitor. Same box,
    | both .env files. No token configured = no exemption.
    */

    'internal' => [
        'token' => env('INTERNAL_API_TOKEN'),
    ],

    'opencritic' => [
        'key' => env('RAPIDAPI_KEY'),
        'daily_budget' => env('OPENCRITIC_DAILY_BUDGET', 48),
    ],

    'youtube' => [
        'key' => env('YOUTUBE_API_KEY'),
        'daily_budget' => env('YOUTUBE_DAILY_BUDGET', 90),
    ],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'turnstile' => [
        // Absent by default: with no value there is no captcha bypass.
        'bypass_token' => env('TURNSTILE_BYPASS_TOKEN'),
        'enabled' => env('TURNSTILE_ENABLED', true),
        'site_key' => env('TURNSTILE_SITE_KEY'),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'secret' => env('PAYPAL_SECRET'),
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'base_url' => env('PAYPAL_MODE', 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com',
    ],

    'discord' => [
        // Where the bot listens for a publish. Localhost — it runs on this
        // machine, so this never crosses the network.
        'publish_url' => env('DISCORD_PUBLISH_URL', 'http://127.0.0.1:8099/publish'),
        'client_id' => env('DISCORD_CLIENT_ID'),
        'client_secret' => env('DISCORD_CLIENT_SECRET'),
        // Must be the API callback route, and must match the redirect URI
        // registered in the Discord developer portal exactly. The old default
        // pointed at /auth/callback/discord — a path Next.js does not serve, so
        // Discord would have sent the user to a 404.
        'redirect' => env('DISCORD_REDIRECT_URI', 'https://techplay.gg/api/v1/auth/discord/callback'),
        'webhook_url' => env('DISCORD_WEBHOOK_URL'),
        'bot_secret' => env('DISCORD_BOT_SECRET'), // Required for bot API authentication
        'bot_token' => env('DISCORD_BOT_TOKEN'),   // Bot token for adding users to guild
        'guild_id' => env('DISCORD_GUILD_ID'),     // Your Discord server ID
    ],

    'steam' => [
        'key' => env('STEAM_API_KEY', ''),
    ],

    'psn' => [
        // Off unless switched on. There is no official PlayStation API — the
        // integration talks to the endpoints the mobile app uses, and the
        // shape of a response can change without warning. This is the switch
        // that turns it off without a deploy.
        'enabled' => env('PSN_ENABLED', false),
    ],

    /*
     * Sign in with Battle.net.
     *
     * Same credentials as `blizzard` below, and that is not a shortcut: the
     * Blizzard developer portal issues one client per application, used both
     * for the game API (client-credentials) and for signing people in
     * (authorization-code). This block asked for BATTLENET_* variables that
     * have never existed in any .env — checked against five archived copies —
     * so `client_id` and `client_secret` resolved to null and Socialite could
     * not build the provider at all.
     *
     * The redirect defaulted to https://techplay.gg/auth/callback, which is a
     * frontend page — and that page only knows how to read `?token=`, which is
     * what the *backend* sends it after the exchange. Battle.net would have
     * delivered `?code=` there and the page would have shrugged. Exactly the
     * fault the comment on `discord.redirect` below records, left standing on
     * this provider.
     *
     * The value here must match the redirect URI registered in the Blizzard
     * portal, character for character.
     */
    'battlenet' => [
        'client_id' => env('BATTLENET_CLIENT_ID', env('BLIZZARD_CLIENT_ID')),
        'client_secret' => env('BATTLENET_CLIENT_SECRET', env('BLIZZARD_CLIENT_SECRET')),
        'redirect' => env('BATTLENET_REDIRECT_URI', 'https://techplay.gg/api/v1/auth/battlenet/callback'),
    ],

    'blizzard' => [
        'client_id' => env('BLIZZARD_CLIENT_ID'),
        'client_secret' => env('BLIZZARD_CLIENT_SECRET'),
        'region' => env('BLIZZARD_DEFAULT_REGION', 'us'),
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
    ],

    /*
     * Where nginx keeps the cached /games/ pages. Empty anywhere the cache does
     * not exist (local, tests), and NginxPageCache simply does nothing then.
     */
    'nginx_cache' => [
        'path' => env('NGINX_CACHE_PATH', '/var/cache/nginx/techplay'),
    ],

    'revalidate' => [
        'secret_token' => env('REVALIDATE_SECRET_TOKEN'),
    ],

    'indexnow' => [
        'key' => env('INDEXNOW_KEY'),
    ],

    'epic' => [
        // Same switch, same reason. Epic Account Services has no entitlements
        // scope, so the import uses the launcher's own flow and can stop
        // working without notice. Off unless switched on.
        'enabled' => env('EPIC_ENABLED', false),
    ],

    'gog' => [
        // Same switch, same reason as PSN below it: GOG has no third-party
        // OAuth programme, so the integration uses the flow the Galaxy client
        // uses and can stop working without notice. Off unless switched on.
        'enabled' => env('GOG_ENABLED', false),
    ],

    'openxbl' => [
        'api_key' => env('OPENXBL_API_KEY'),
        'base_url' => 'https://xbl.io/api/v2',
    ],

    /*
     * IGDB, which is Twitch's, which is why the credentials are a Twitch app and
     * the token comes from id.twitch.tv rather than from them.
     *
     * Their limit is four requests a second with at most eight in flight; going
     * over earns a 429. The client keeps to it rather than discovering it.
     */

];
