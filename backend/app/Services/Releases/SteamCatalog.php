<?php

namespace App\Services\Releases;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reads Steam's upcoming catalogue.
 *
 * Two very different jobs live here, and keeping them apart is what makes the
 * whole aggregator affordable.
 *
 * The listing is cheap: one request returns a hundred titles complete with
 * name, date, tag ids and a capsule image. That is enough to discover what is
 * new and — more importantly — to notice that something has been delayed,
 * without asking about a single game individually.
 *
 * The detail call is expensive and happens once per game, ever. It is the only
 * place the quality gate can be applied, because nothing that decides whether a
 * game is real (screenshots, a trailer, a description) appears in the listing.
 */
class SteamCatalog
{
    private const SEARCH = 'https://store.steampowered.com/search/results';

    private const DETAILS = 'https://store.steampowered.com/api/appdetails';

    /** Steam's listing pages cap out at 100 rows. */
    private const PAGE_SIZE = 100;

    /**
     * Steam's own "Games" type filter, which keeps demos, DLC, soundtracks and
     * software out of the listing entirely.
     *
     * Worth having precisely because it acts before we spend anything: about a
     * quarter of the raw "coming soon" listing is demos and DLC, and each one
     * used to cost a detail request to discover it was never a calendar entry.
     *
     * The type check in the quality gate stays regardless — this narrows what
     * we ask for, it does not prove what came back.
     */
    private const GAMES_ONLY = 998;

    /** A guard against walking the whole 13,000-title catalogue by accident. */
    private const MAX_PAGES = 120;

    public function __construct(private QualityFilter $filter) {}

    /**
     * Every upcoming title released between two dates.
     *
     * Steam orders "coming soon" by date and offers no way to jump into the
     * middle of it, so we walk from the front and stop once we have gone past
     * the window. Titles whose date cannot be placed on a calendar at all —
     * "Q4 2026", "To be announced" — are carried with the precision they came
     * with rather than being flattened into a date they never had.
     *
     * @return array<int,array>
     */
    public function listWindow(Carbon $from, Carbon $to): array
    {
        $this->assertConfigured();

        $found = [];
        $adultDropped = 0;

        for ($page = 0; $page < self::MAX_PAGES; $page++) {
            $rows = $this->page($page * self::PAGE_SIZE);

            if ($rows === []) {
                break;
            }

            $pastWindow = false;

            foreach ($rows as $row) {
                // Free, and before we have asked Steam anything about it.
                if ($this->filter->isAdultBySteamTags($row['tag_ids'])) {
                    $adultDropped++;

                    continue;
                }

                $anchor = $row['anchor'];

                if ($anchor === null) {
                    continue; // undated; nothing to place it against
                }

                if ($anchor->lt($from)) {
                    continue;
                }

                if ($anchor->gt($to)) {
                    // The listing is date-ordered, so everything after this is
                    // further out still.
                    $pastWindow = true;

                    break;
                }

                $found[$row['store_id']] = $row;
            }

            if ($pastWindow) {
                break;
            }
        }

        Log::info('steam listing walked', [
            'window' => $from->toDateString().' → '.$to->toDateString(),
            'in_window' => count($found),
            'adult_dropped' => $adultDropped,
        ]);

        return array_values($found);
    }

    /**
     * The full record for one title, shaped the way the quality gate expects.
     *
     * Returns null only when Steam positively says there is no such product —
     * a title pulled from the store between the listing and now. Anything else
     * that goes wrong throws, because a failed request is not a verdict and
     * must not be recorded as one.
     *
     * @throws TransientFailure
     */
    public function details(string $appId): ?array
    {
        try {
            $response = Http::timeout(config('releases.timeout'))
                ->withHeaders(['User-Agent' => 'Mozilla/5.0'])
                ->get(self::DETAILS, ['appids' => $appId, 'l' => 'en']);
        } catch (ConnectionException $e) {
            throw new TransientFailure("steam unreachable for {$appId}: ".$e->getMessage());
        }

        // Steam throttles hard on this endpoint and answers 429 — or, under
        // load, 200 with an empty body. Both used to be filed away as "this
        // game does not exist", which quietly lost real games forever.
        if (! $response->successful()) {
            throw new TransientFailure("steam answered {$response->status()} for {$appId}");
        }

        $body = $response->json();

        if (! is_array($body) || $body === []) {
            throw new TransientFailure("steam returned an empty body for {$appId}");
        }

        // An explicit refusal, on the other hand, is an answer: the product is
        // gone, and asking again next month will not bring it back.
        if (($body[$appId]['success'] ?? false) === false) {
            return null;
        }

        $data = $body[$appId]['data'] ?? null;

        if (! is_array($data)) {
            return null;
        }

        return [
            'store_id' => $appId,
            'type' => $data['type'] ?? 'game',
            'title' => $data['name'] ?? '',
            'description' => $data['short_description'] ?? '',
            'screenshots' => count($data['screenshots'] ?? []),
            'has_trailer' => count($data['movies'] ?? []) > 0,
            'publisher' => collect($data['publishers'] ?? [])->filter()->first(),
            'developer' => collect($data['developers'] ?? [])->filter()->first(),
            'adult' => $this->filter->isAdultBySteamDescriptors($data['content_descriptors']['ids'] ?? []),
            'hero' => $data['header_image'] ?? null,
            'genres' => collect($data['genres'] ?? [])->pluck('description')->filter()->values()->all(),
            'metacritic' => $data['metacritic']['score'] ?? null,
            'screenshot_urls' => collect($data['screenshots'] ?? [])->pluck('path_full')->filter()->values()->all(),
            'trailer_urls' => collect($data['movies'] ?? [])->pluck('mp4.max')->filter()->values()->all(),
            'url' => "https://store.steampowered.com/app/{$appId}/",
        ];
    }

    /** One listing page, parsed into rows. */
    private function page(int $start): array
    {
        try {
            $response = Http::timeout(config('releases.timeout'))
                ->withHeaders(['User-Agent' => 'Mozilla/5.0'])
                ->get(self::SEARCH, [
                    'filter' => 'comingsoon',
                    'category1' => self::GAMES_ONLY,
                    'json' => 1,
                    'count' => self::PAGE_SIZE,
                    'start' => $start,
                    'infinite' => 1,
                ]);

            $html = $response->json('results_html') ?? '';
        } catch (ConnectionException $e) {
            // Steam being unreachable is ordinary and survivable; anything else
            // is a fault of ours and has no business being swallowed.
            Log::warning('steam listing failed', ['start' => $start, 'error' => $e->getMessage()]);

            return [];
        }

        return $this->parseRows($html);
    }

    /**
     * A deployment that forgot to refresh its config cache produced a sync
     * reporting zero upcoming games — indistinguishable, from the outside, from
     * Steam having nothing to say. Those are opposite situations and must never
     * look alike again.
     */
    private function assertConfigured(): void
    {
        if (config('releases.timeout') === null) {
            throw new \RuntimeException(
                'config/releases.php is not loaded. If this is a deployed environment, '.
                'its config cache predates the file — run `php artisan config:cache`.'
            );
        }
    }

    /**
     * Steam returns rendered HTML rather than data, so the listing has to be
     * read out of the markup. Everything we need is in attributes, which are
     * far steadier than the surrounding layout.
     */
    public function parseRows(string $html): array
    {
        if (trim($html) === '') {
            return [];
        }

        $chunks = preg_split('/(?=<a\s[^>]*data-ds-appid=)/', $html) ?: [];
        $rows = [];

        foreach ($chunks as $chunk) {
            if (! preg_match('/data-ds-appid="(\d+)"/', $chunk, $id)) {
                continue;
            }

            preg_match('/data-ds-tagids="\[([^\]]*)\]"/', $chunk, $tags);
            preg_match('/<span class="title">([^<]*)<\/span>/', $chunk, $name);
            preg_match('/search_released[^>]*>([^<]*)</', $chunk, $date);
            preg_match('/<div class="search_capsule"><img src="([^"]+)"/', $chunk, $capsule);

            $title = trim(html_entity_decode($name[1] ?? ''));

            if ($title === '') {
                continue;
            }

            $raw = trim($date[1] ?? '');
            [$anchor, $precision] = $this->parseDate($raw);

            $rows[] = [
                'store_id' => $id[1],
                'title' => $title,
                'url' => "https://store.steampowered.com/app/{$id[1]}/",
                'raw_date' => $raw,
                'anchor' => $anchor,
                'precision' => $precision,
                'tag_ids' => array_values(array_filter(array_map('intval', explode(',', $tags[1] ?? '')))),
                'capsule' => $capsule[1] ?? null,
            ];
        }

        return $rows;
    }

    /**
     * Steam writes dates at whatever precision the publisher has committed to.
     * We keep that precision instead of inventing a day, and anchor each one to
     * the earliest date it could mean so the window filter has something to
     * compare.
     *
     * @return array{0:?Carbon,1:string}
     */
    public function parseDate(string $raw): array
    {
        $value = trim($raw);

        if ($value === '') {
            return [null, 'tba'];
        }

        // "Q3 2026"
        if (preg_match('/^Q([1-4])\s+(\d{4})$/i', $value, $m)) {
            return [Carbon::create((int) $m[2], ((int) $m[1] - 1) * 3 + 1, 1), 'quarter'];
        }

        // "2026"
        if (preg_match('/^(\d{4})$/', $value, $m)) {
            return [Carbon::create((int) $m[1], 1, 1), 'year'];
        }

        // "August 2026" / "Aug 2026" — a month with no day committed to.
        if (preg_match('/^([A-Za-z]{3,9})\s+(\d{4})$/', $value, $m)) {
            $parsed = $this->tryParse($m[1].' 1, '.$m[2]);

            return $parsed ? [$parsed, 'month'] : [null, 'tba'];
        }

        // "3 Aug, 2026" or "Aug 3, 2026" — an actual date.
        if (preg_match('/\d{1,2}.*\d{4}/', $value)) {
            $parsed = $this->tryParse($value);

            return $parsed ? [$parsed, 'day'] : [null, 'tba'];
        }

        // "Coming soon", "To be announced", and anything else we cannot place.
        return [null, 'tba'];
    }

    private function tryParse(string $value): ?Carbon
    {
        try {
            return Carbon::parse(str_replace(',', '', $value))->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }
}
