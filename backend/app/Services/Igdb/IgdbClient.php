<?php

namespace App\Services\Igdb;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Talks to IGDB, and keeps to their limits without being told twice.
 *
 * Two things about their API shape the whole of this class.
 *
 * The first is the rate limit: four requests a second, at most eight in flight,
 * and a 429 the moment you exceed it. A full pull is about eleven thousand
 * requests, so the difference between pacing and not pacing is the difference
 * between an hour and a night of retries. `sleep()` between calls is crude and
 * exactly right here — there is one puller, it runs alone, and it has nothing
 * better to do with the time.
 *
 * The second is that offset paging dies at 5,000. Their docs say so and their
 * server enforces it, which rules out `offset 5000; limit 500;` for a table of
 * 372,826 games. The way through is to sort by id and ask for the next page by
 * id — keyset paging, which also makes a pull resumable: whatever id we reached
 * is the whole of the state we need to carry.
 */
class IgdbClient
{
    /** Their maximum, and there is no reason to ask for less. */
    public const PAGE = 500;

    private ?string $token = null;

    public function __construct(
        private readonly ?string $clientId = null,
        private readonly ?string $clientSecret = null,
    ) {}

    private function id(): string
    {
        return $this->clientId ?? (string) config('services.igdb.client_id');
    }

    private function secret(): string
    {
        return $this->clientSecret ?? (string) config('services.igdb.client_secret');
    }

    public function configured(): bool
    {
        return $this->id() !== '' && $this->secret() !== '';
    }

    /**
     * An app token from Twitch, held for slightly less than it is good for.
     *
     * They last about two months. Cached because a pull that resumes should not
     * ask for a new one, and because a token request that fails is a clearer
     * error at the start of a run than in the middle of it.
     */
    public function token(): string
    {
        if ($this->token !== null) {
            return $this->token;
        }

        $this->token = Cache::remember('igdb.token', now()->addDays(30), function () {
            $response = Http::asForm()
                ->timeout(20)
                ->post((string) config('services.igdb.token_url'), [
                    'client_id' => $this->id(),
                    'client_secret' => $this->secret(),
                    'grant_type' => 'client_credentials',
                ]);

            if (! $response->successful() || ! $response->json('access_token')) {
                throw new RuntimeException(
                    'IGDB: token nije izdat ('.$response->status().'). Provjeri IGDB_CLIENT_ID i IGDB_CLIENT_SECRET.'
                );
            }

            return (string) $response->json('access_token');
        });

        return $this->token;
    }

    /**
     * One query against one of their endpoints.
     *
     * A 429 means the pacing slipped — wait out the second and go again rather
     * than dropping the page, because a hole in a staging table is worse than a
     * slow pull. A 401 means the cached token has been revoked, so it is thrown
     * away and the call retried once with a fresh one.
     */
    public function query(string $endpoint, string $body, int $attempt = 1): array
    {
        $response = Http::withHeaders([
            'Client-ID' => $this->id(),
            'Authorization' => 'Bearer '.$this->token(),
            'Accept' => 'application/json',
        ])
            ->timeout(45)
            ->withBody($body, 'text/plain')
            ->post(rtrim((string) config('services.igdb.base_url'), '/').'/'.$endpoint);

        if ($response->status() === 429 && $attempt <= 5) {
            usleep(1_100_000);

            return $this->query($endpoint, $body, $attempt + 1);
        }

        if ($response->status() === 401 && $attempt === 1) {
            Cache::forget('igdb.token');
            $this->token = null;

            return $this->query($endpoint, $body, $attempt + 1);
        }

        if (! $response->successful()) {
            throw new RuntimeException(
                "IGDB: {$endpoint} vratio {$response->status()} — ".mb_substr($response->body(), 0, 200)
            );
        }

        return $response->json() ?? [];
    }

    /** How many rows an endpoint holds, so a pull can report progress against something. */
    public function count(string $endpoint, string $where = ''): int
    {
        $rows = $this->query($endpoint.'/count', $where);

        return (int) ($rows['count'] ?? 0);
    }

    /**
     * Every row of an endpoint, in id order, a page at a time.
     *
     * Yields pages rather than rows so the caller can write them in batches —
     * 1.7 million screenshots inserted one at a time is a different kind of
     * afternoon. `$afterId` resumes an interrupted pull from where it stopped.
     *
     * @return \Generator<int, array<int, array<string, mixed>>>
     */
    public function each(string $endpoint, int $afterId = 0, string $fields = '*'): \Generator
    {
        $perSecond = max(1, (int) config('services.igdb.requests_per_second', 4));
        $gap = (int) (1_000_000 / $perSecond);

        while (true) {
            $page = $this->query($endpoint, sprintf(
                'fields %s; where id > %d; sort id asc; limit %d;',
                $fields, $afterId, self::PAGE
            ));

            if ($page === []) {
                return;
            }

            yield $page;

            $last = end($page);
            $afterId = (int) ($last['id'] ?? 0);

            /* Their last page is a short one; stop rather than ask for nothing. */
            if (count($page) < self::PAGE) {
                return;
            }

            usleep($gap);
        }
    }
}
