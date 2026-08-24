<?php

return [

    /*
     * The GIF picker in the editorial chat. A Giphy web key is meant to be
     * seen by the browser, but a literal in a Blade view is also a literal in
     * git history and cannot be rotated without a deploy.
     */
    'giphy' => [
        'key' => env('GIPHY_API_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Internal server-to-server auth
    |--------------------------------------------------------------------------
    | The Next.js SSR process presents this token (X-Internal-Token) so the
    | api rate limiter can tell our own server from a visitor. Same box,
    | both .env files. No token configured = no exemption.
    */

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

    'recaptcha' => [
        'site_key' => env('RECAPTCHA_SITE_KEY', env('TURNSTILE_SITE_KEY')),
        'secret_key' => env('RECAPTCHA_SECRET_KEY', env('TURNSTILE_SECRET_KEY')),
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

    'battlenet' => [
        'client_id' => env('BATTLENET_CLIENT_ID'),
        'client_secret' => env('BATTLENET_CLIENT_SECRET'),
        'redirect' => env('BATTLENET_REDIRECT_URI', 'https://techplay.gg/auth/callback'),
    ],

    'blizzard' => [
        'client_id' => env('BLIZZARD_CLIENT_ID'),
        'client_secret' => env('BLIZZARD_CLIENT_SECRET'),
        'region' => env('BLIZZARD_DEFAULT_REGION', 'us'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4-turbo'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
    ],

    'groq' => [
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
    ],

    'revalidate' => [
        'secret_token' => env('REVALIDATE_SECRET_TOKEN'),
    ],

    'indexnow' => [
        'key' => env('INDEXNOW_KEY'),
    ],

    'mobygames' => [
        'api_key' => env('MOBY_API_KEY'),
        'base_url' => 'https://api.mobygames.com/v1',
    ],

    'rawg' => [
        'api_key' => env('RAWG_API_KEY'),
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
    'igdb' => [
        'client_id' => env('IGDB_CLIENT_ID'),
        'client_secret' => env('IGDB_CLIENT_SECRET'),
        'base_url' => 'https://api.igdb.com/v4',
        'token_url' => 'https://id.twitch.tv/oauth2/token',
        'requests_per_second' => 4,
    ],

];
