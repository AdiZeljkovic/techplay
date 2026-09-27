<?php

namespace App\Services\Gw2;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;

/**
 * Every call TechPlay makes to ArenaNet goes through here.
 *
 * Two things this exists to get right, both measured against the live API on
 * 27 September 2026 rather than taken from documentation.
 *
 * **The rate limit is shared.** It is counted per IP, and every request we
 * make leaves from one server, so the budget belongs to the whole site rather
 * than to a player. Measured: 400 requests went through in 7.5 seconds
 * untouched; 1,000 came back 500 accepted and 500 refused; after a thirty
 * second pause another 200 all passed. The bucket is around 600 — which
 * matches the `x-rate-limit-limit: 600` header — and it refills completely
 * within half a minute. The wiki's "5 requests per second" was not what the
 * API did; roughly fifty a second went through while the bucket lasted.
 *
 * **A 429 is not a failure.** It means later, not no. Treating it as an error
 * would mark a working account broken and drop a sync that was one pause away
 * from finishing.
 *
 * The bucket below is deliberately smaller than the real one. Running at the
 * edge of a limit measured once, against a service that is free to change it,
 * buys nothing — and leaving headroom means a reader who has just connected
 * their key is never waiting behind a catalogue refresh.
 */
class Gw2Client
{
    private const BASE = 'https://api.guildwars2.com/v2';

    /** Measured at ~600. Two thirds of it is ours to spend. */
    private const BUDGET = 400;

    private const WINDOW_SECONDS = 60;

    /** The API takes up to 200 ids per request, and says so. */
    public const BATCH = 200;

    private const TIMEOUT = 20;

    public function __construct(private readonly string $bucket = 'gw2:budget') {}

    /**
     * A public endpoint — game data, the same for everybody.
     *
     * @param  array<string, mixed>  $query
     */
    public function public(string $path, array $query = []): array
    {
        return $this->call($path, $query, null);
    }

    /**
     * An account endpoint, read with a player's key.
     *
     * The key goes in the Authorization header rather than the query string:
     * a URL ends up in logs, in error reports and in anything that proxies,
     * and a header does not.
     *
     * @param  array<string, mixed>  $query
     */
    public function account(string $path, string $key, array $query = []): array
    {
        return $this->call($path, $query, $key);
    }

    /**
     * Fetch many ids in as few requests as the API allows.
     *
     * @param  array<int, int|string>  $ids
     * @return array<int, array<string, mixed>>
     */
    public function batched(string $path, array $ids): array
    {
        $out = [];

        foreach (array_chunk(array_values($ids), self::BATCH) as $chunk) {
            foreach ($this->public($path, ['ids' => implode(',', $chunk)]) as $row) {
                $out[] = $row;
            }
        }

        return $out;
    }

    /** The game's build number. One request, and the only way to notice a patch. */
    public function buildId(): ?int
    {
        $build = $this->public('build');

        return isset($build['id']) ? (int) $build['id'] : null;
    }

    /**
     * What a key is allowed to read.
     *
     * Asked at connect time and never assumed. A key missing `inventories`
     * cannot answer what a player owns, and the honest response is to say
     * which permission is missing — not to render an empty shelf.
     */
    public function tokenInfo(string $key): array
    {
        return $this->account('tokeninfo', $key);
    }

    /**
     * @param  array<string, mixed>  $query
     * @return array<mixed>
     */
    private function call(string $path, array $query, ?string $key): array
    {
        $this->spendToken();

        $request = Http::timeout(self::TIMEOUT)->acceptJson();

        if ($key !== null) {
            $request = $request->withToken($key);
        }

        $response = $request->get(self::BASE.'/'.ltrim($path, '/'), $query);

        if ($response->status() === 429) {
            throw new Gw2RateLimited("Rate limited on /{$path}.");
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw new Gw2KeyRejected("The key was refused on /{$path}.");
        }

        /*
         * A transient "invalid key" is a documented quirk of this API, so a
         * single refusal is not proof that a player revoked anything. The
         * caller decides how many times to try; this only reports what
         * happened.
         */
        if (! $response->successful()) {
            throw new Gw2Unavailable("/{$path} answered {$response->status()}.");
        }

        return $this->decode($response);
    }

    /** @return array<mixed> */
    private function decode(Response $response): array
    {
        $body = $response->json();

        return is_array($body) ? $body : [];
    }

    /**
     * Take one token, or refuse.
     *
     * A fixed window rather than a rolling one: the bucket recovers in well
     * under a minute, so the worst a window boundary costs is a short wait,
     * and the counter is a single INCR instead of a sorted set that has to be
     * trimmed on every call.
     */
    private function spendToken(): void
    {
        $window = (int) floor(time() / self::WINDOW_SECONDS);
        $key = "{$this->bucket}:{$window}";

        $used = (int) Redis::incr($key);

        if ($used === 1) {
            // Twice the window, so a request that arrives on the boundary
            // cannot find a counter that has already been forgotten.
            Redis::expire($key, self::WINDOW_SECONDS * 2);
        }

        if ($used > self::BUDGET) {
            throw new Gw2RateLimited('TechPlay has spent its ArenaNet budget for this minute.');
        }
    }
}
