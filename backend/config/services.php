<?php

return [

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
        'redirect' => env('DISCORD_REDIRECT_URI', 'https://techplay.gg/auth/callback/discord'),
        'webhook_url' => env('DISCORD_WEBHOOK_URL'),
        'bot_secret' => env('DISCORD_BOT_SECRET'), // Required for bot API authentication
        'bot_token' => env('DISCORD_BOT_TOKEN'),   // Bot token for adding users to guild
        'guild_id' => env('DISCORD_GUILD_ID'),     // Your Discord server ID
    ],

    'steam' => [
        'key' => env('STEAM_API_KEY', ''),
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

    'privee' => [
        'api_key'  => env('PRIVEE_API_KEY'),
        'base_url' => env('PRIVEE_BASE_URL', 'https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com/'),
    ],

    'mobygames' => [
        'api_key'  => env('MOBY_API_KEY'),
        'base_url' => 'https://api.mobygames.com/v1',
    ],

    'rawg' => [
        'api_key' => env('RAWG_API_KEY'),
    ],

];

