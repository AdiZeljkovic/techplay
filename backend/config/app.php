<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "UTC" by default as it is suitable for most use cases.
    |
    */

    'timezone' => 'Europe/Sarajevo',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Frontend Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Next.js frontend integration including on-demand
    | revalidation for instant content updates.
    |
    */

    /*
     | FRONTEND_URL doubles as the CORS allow-list, so it may hold several
     | origins separated by commas. Anything that needs *the* address of the
     | site — a link in an email, a canonical URL, the Sitemap line in
     | robots.txt — must use `site_url` below instead, which is always exactly
     | one address.
     */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    /*
     | The canonical public address of the site, normalised here rather than at
     | each call site.
     |
     | Two rules meet in this line, and both were being broken:
     |
     |   1. env() may only be called from inside a config file. Laravel's own
     |      documentation says so, because `config:cache` — which production
     |      runs — makes env() return null everywhere else. A route was doing
     |      `env('FRONTEND_URL', config('app.url'))`, got null, and fell back to
     |      the API's hostname; robots.txt then told every crawler the sitemap
     |      lived on api-beta.techplay.gg.
     |
     |   2. The value may be a list. Taking it whole produced
     |      "http://a,http://b,http://c/sitemap.xml".
     |
     | Normalising once here means neither mistake can be made again downstream.
     */
    'site_url' => rtrim(
        trim(explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000'))[0]),
        '/'
    ),
    'revalidation_secret' => env('REVALIDATE_SECRET_TOKEN', env('REVALIDATION_SECRET')),

];
