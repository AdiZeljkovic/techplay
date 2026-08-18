<?php

use App\Logging\TelegramChannel;
use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    |
    | This option defines the default log channel that is utilized to write
    | messages to your logs. The value provided here should match one of
    | the channels present in the list of "channels" configured below.
    |
    */

    'default' => env('LOG_CHANNEL', 'stack'),

    /*
    |--------------------------------------------------------------------------
    | Deprecations Log Channel
    |--------------------------------------------------------------------------
    |
    | This option controls the log channel that should be used to log warnings
    | regarding deprecated PHP and library features. This allows you to get
    | your application ready for upcoming major versions of dependencies.
    |
    */

    /*
     * `?:`, not a default argument — and the difference cost 12 MB of log and a
     * page of 500s.
     *
     * `.env` says `LOG_DEPRECATIONS_CHANNEL=null`. Laravel's env parser reads an
     * unquoted `null` as **PHP null**, and a default argument only applies when
     * the key is *missing*, never when it is present and null. So this resolved
     * to null, `LogManager` could not find a channel by that name, and every
     * deprecation notice raised `InvalidArgumentException: Log [deprecations]
     * is not defined` instead.
     *
     * Which is worse than it sounds. The exception is thrown from inside
     * `HandleExceptions` during the request, so a harmless deprecation notice
     * became an HTTP 500: 259 of them on `/api/v1/games/{slug}` in one hour on
     * 17.08.2026, and 12 MB of emergency-logger output in `laravel.log`.
     *
     * The `null` channel it wants has existed the whole time, ten lines below.
     * Nothing was ever asking for it.
     */
    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL') ?: 'null',
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    |
    | Here you may configure the log channels for your application. Laravel
    | utilizes the Monolog PHP logging library, which includes a variety
    | of powerful log handlers and formatters that you're free to use.
    |
    | Available drivers: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog", "custom", "stack"
    |
    */

    'channels' => [
        /*
         * Errors and worse, sent to Telegram as they happen.
         *
         * The log file waits to be read. This does not: an exception arrives on
         * a phone within seconds, deduplicated so a burst of the same fault is
         * one message rather than the twenty-six that broadcasting produced.
         *
         * Netdata covers the machine and the databases; nothing there can see
         * an exception, which is the whole reason this channel exists. See
         * app/Logging/TelegramChannel.php.
         */
        'telegram' => [
            'driver' => 'custom',
            'via' => TelegramChannel::class,
            'level' => env('LOG_TELEGRAM_LEVEL', 'error'),
            'dedup_seconds' => env('LOG_TELEGRAM_DEDUP', 600),
        ],

        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', (string) env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'replace_placeholders' => true,
        ],

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => env('LOG_SLACK_USERNAME', 'Laravel Log'),
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
            'level' => env('LOG_LEVEL', 'critical'),
            'replace_placeholders' => true,
        ],

        'papertrail' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class),
            'handler_with' => [
                'host' => env('PAPERTRAIL_URL'),
                'port' => env('PAPERTRAIL_PORT'),
                'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'),
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'handler_with' => [
                'stream' => 'php://stderr',
            ],
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => env('LOG_LEVEL', 'debug'),
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
            'replace_placeholders' => true,
        ],

        'errorlog' => [
            'driver' => 'errorlog',
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Logging Options
    |--------------------------------------------------------------------------
    |
    | MONITORING: Performance and security logging configuration
    | Used by App\Services\LoggingService
    |
    */

    // Log all API requests (disable in production for performance)
    'log_api_requests' => env('LOG_API_REQUESTS', false),

    // Log performance metrics
    'log_performance' => env('LOG_PERFORMANCE', false),

    // Slow query threshold in milliseconds
    'slow_query_threshold' => env('SLOW_QUERY_THRESHOLD', 1000),

];
