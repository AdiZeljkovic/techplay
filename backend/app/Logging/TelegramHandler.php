<?php

namespace App\Logging;

use Monolog\Handler\AbstractProcessingHandler;
use Monolog\LogRecord;

/**
 * Application errors, in Telegram, within seconds of happening.
 *
 * Netdata watches the machine and the databases and does it well. What it
 * cannot see is an exception: when `FlushViewCounters` threw nothing and did
 * nothing for months, no graph moved. When broadcasting failed 26 times, CPU
 * was flat. Those are application faults, and the only place they appear is
 * the log — a file that waits to be read.
 *
 * This is the smallest thing that makes them arrive instead of wait. No SDK,
 * no account, no service: one HTTP POST per distinct error.
 *
 * ## It must never take the site down
 *
 * A logging handler runs inside the request that failed. If it throws, the
 * error report becomes a second error, and a slow Telegram API turns every
 * exception into a hung request. So: a short timeout, every failure swallowed,
 * and no retry. A missed alert is a missed alert; a hung request is an outage.
 */
class TelegramHandler extends AbstractProcessingHandler
{
    /** Long enough for a normal call, short enough not to hold a request open. */
    private const TIMEOUT_SECONDS = 4;

    /** Telegram rejects messages over 4096 characters. */
    private const MAX_LENGTH = 3500;

    public function __construct(
        private readonly string $token,
        private readonly string $chatId,
        int|string $level = 'error',
        bool $bubble = true,
    ) {
        parent::__construct($level, $bubble);
    }

    protected function write(LogRecord $record): void
    {
        if ($this->token === '' || $this->chatId === '') {
            return;
        }

        try {
            $this->send($this->format($record));
        } catch (\Throwable) {
            // Deliberately silent. Anything thrown here would surface as a
            // failure to log the failure.
        }
    }

    /**
     * What a person needs at 3am: which error, where, on which URL.
     *
     * Deliberately not the whole stack trace. A trace is forty lines on a phone
     * and the first frame is the one that matters; the rest is in the log file,
     * which is where you go once you know there is something to look for.
     */
    private function format(LogRecord $record): string
    {
        $context = $record->context;
        $exception = $context['exception'] ?? null;

        $title = $record->level->getName();
        $body = trim($record->message);

        if ($exception instanceof \Throwable) {
            $title = class_basename($exception);
            $body = $exception->getMessage();
            $where = str_replace(base_path().DIRECTORY_SEPARATOR, '', $exception->getFile())
                .':'.$exception->getLine();
        } else {
            $where = $context['file'] ?? null;
        }

        $lines = [
            '🔴 <b>'.e($title).'</b>',
            e(mb_strimwidth($body, 0, 600, '…')),
        ];

        if ($where) {
            $lines[] = '<code>'.e($where).'</code>';
        }

        // The request that produced it, when there is one. A queue job has no
        // URL and saying "console" is more honest than leaving a blank line.
        if (app()->runningInConsole()) {
            $lines[] = '<i>konzola / red poslova</i>';
        } elseif ($url = request()?->fullUrl()) {
            $lines[] = '<i>'.e(mb_strimwidth($url, 0, 150, '…')).'</i>';
        }

        $lines[] = '<i>'.now()->format('d.m.Y H:i:s').'</i>';

        return mb_strimwidth(implode("\n", $lines), 0, self::MAX_LENGTH, '…');
    }

    private function send(string $text): void
    {
        $payload = http_build_query([
            'chat_id' => $this->chatId,
            'text' => $text,
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => 'true',
        ]);

        // curl directly rather than Laravel's HTTP client: this runs while the
        // application is already failing, and reaching for the container at
        // that moment is how a logger becomes part of the problem.
        $ch = curl_init("https://api.telegram.org/bot{$this->token}/sendMessage");
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => self::TIMEOUT_SECONDS,
            CURLOPT_CONNECTTIMEOUT => 2,
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
