<?php

namespace App\Logging;

use Monolog\Handler\DeduplicationHandler;
use Monolog\Logger;

/**
 * The `telegram` log channel: deduplicated alerts for errors and worse.
 *
 * The deduplication is the reason this class exists rather than pointing the
 * channel straight at the handler. When broadcasting broke, the same exception
 * was thrown 26 times; when a page starts 500ing under a crawler it is
 * hundreds. A channel that sends each one is a channel you mute by lunchtime,
 * and a muted channel is worse than none — it looks like coverage.
 *
 * Monolog's DeduplicationHandler keeps a small file of recent records and drops
 * anything it has already passed through inside the window. Ten minutes is long
 * enough to collapse a burst and short enough that a problem still recurring an
 * hour later says so again.
 *
 * Note it buffers: records are held and flushed when the request ends, which is
 * how it can compare them. That means an alert arrives a moment after the
 * error, not during it. For a fatal that kills the process mid-request Monolog
 * still flushes on shutdown.
 */
class TelegramChannel
{
    public function __invoke(array $config): Logger
    {
        $handler = new TelegramHandler(
            token: (string) config('services.telegram.token'),
            chatId: (string) config('services.telegram.chat_id'),
            level: $config['level'] ?? 'error',
        );

        return new Logger('telegram', [
            new DeduplicationHandler(
                handler: $handler,
                deduplicationStore: storage_path('logs/telegram-dedup.log'),
                deduplicationLevel: $config['level'] ?? 'error',
                time: (int) ($config['dedup_seconds'] ?? 600),
            ),
        ]);
    }
}
