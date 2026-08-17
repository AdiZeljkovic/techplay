<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Asks a URL whether it is still there, and tries not to be lied to.
 *
 * The scanner this replaces sent a `HEAD` request identifying itself as
 * "TechPlay Link Checker/1.0", and on 16 Aug 2026 that produced 29 of the 62
 * links on record — x.com eight times, twitter.com eight, reddit three,
 * samsung four — all with status 403. None of those links is broken. They are
 * sites that refuse `HEAD`, refuse an obvious bot, or both.
 *
 * A checker whose false positives outnumber its true ones is worse than no
 * checker: somebody opens the list, finds the first three entries are fine,
 * and never opens it again. So this one does two things differently.
 *
 * **It falls back to GET.** `HEAD` is cheaper and many servers implement it
 * badly — 403, 405 and 501 are all common answers to a `HEAD` for a page that
 * serves perfectly well. When the first answer is one of those, ask properly.
 *
 * **It looks like a browser.** Not to sneak past anything: the link is public
 * and a reader following it from an article sends exactly these headers. A
 * checker that gets a different answer than a reader is measuring the wrong
 * thing.
 */
class LinkChecker
{
    /**
     * Chrome on Windows. Boring on purpose — an unusual string is as
     * conspicuous as an honest one and gets the same 403.
     */
    private const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        .'(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

    /** Answers that mean "ask again, properly" rather than "it is gone". */
    private const RETRY_WITH_GET = [403, 405, 406, 429, 501];

    /**
     * @return array{ok: bool, status_code: int, error_message: ?string}
     */
    public function check(string $url): array
    {
        $result = $this->request($url, 'head');

        if (! $result['ok'] && in_array($result['status_code'], self::RETRY_WITH_GET, true)) {
            // The GET answer replaces the HEAD one whichever way it goes. It is
            // what a reader following the link would see, and that is the only
            // question worth recording.
            return $this->request($url, 'get');
        }

        return $result;
    }

    /**
     * @return array{ok: bool, status_code: int, error_message: ?string}
     */
    private function request(string $url, string $method): array
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders([
                    'User-Agent' => self::AGENT,
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.9',
                ])
                ->withOptions([
                    // A link that redirects is not broken. Without this, every
                    // shortened URL and every http→https upgrade counted as a
                    // 301 and therefore as a failure.
                    'allow_redirects' => ['max' => 5, 'strict' => false],
                ])
                ->{$method}($url);

            $status = $response->status();

            return [
                'ok' => $status >= 200 && $status < 400,
                'status_code' => $status,
                'error_message' => null,
            ];
        } catch (\Throwable $e) {
            return [
                'ok' => false,
                'status_code' => 0,
                'error_message' => substr($e->getMessage(), 0, 255),
            ];
        }
    }
}
