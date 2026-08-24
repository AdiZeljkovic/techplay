<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * A GOG library, through the same kind of door PlayStation leaves open.
 *
 * GOG has no OAuth programme for third parties. What exists is the flow the
 * GOG Galaxy client itself uses — a login page, a `code` in the redirect URL,
 * and a token endpoint that accepts Galaxy's own client id. Every open-source
 * GOG tool (Heroic, gogdl, Lutris) authenticates exactly this way, and so does
 * this. It is the same trade the PlayStation integration already makes with
 * Sony's mobile app credentials, and it carries the same three caveats:
 *
 *   1. The reader must paste a code they copy out of their own address bar
 *      after signing in to GOG. There is no consent screen we can send them
 *      to, because there is no programme to be part of.
 *   2. The credentials below are Galaxy's, published in every one of those
 *      projects. They are not a secret of ours and not a key we were issued.
 *   3. It can stop working without notice. Everything here fails soft and says
 *      which half broke, and the whole integration sits behind a config flag.
 *
 * What GOG gives, measured against the live API rather than assumed: a list of
 * owned product ids, and a public catalogue endpoint that turns ids into
 * titles in bulk. No playtime — GOG keeps that in the Galaxy client's local
 * database and never exposes it — and no achievements for a third party. So a
 * GOG import fills the shelf and nothing else, which is still more than the
 * three stores that offer nothing at all.
 */
class GogService
{
    /** GOG Galaxy's own client. Public knowledge, not a secret of ours. */
    private const CLIENT_ID = '46899977096215655';

    private const CLIENT_SECRET = '9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9';

    private const REDIRECT_URI = 'https://embed.gog.com/on_login_success?origin=client';

    private const AUTH_BASE = 'https://auth.gog.com';

    private const EMBED_BASE = 'https://embed.gog.com';

    private const CATALOGUE_BASE = 'https://api.gog.com';

    /** Where the reader signs in. Handed to the frontend so the URL lives in one place. */
    public const LOGIN_URL = self::AUTH_BASE.'/auth?client_id='.self::CLIENT_ID
        .'&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient'
        .'&response_type=code&layout=client2';

    public function enabled(): bool
    {
        return (bool) config('services.gog.enabled', false);
    }

    /**
     * The code out of the reader's address bar, exchanged for tokens.
     *
     * @return array{access_token:string, refresh_token:?string, expires_in:int, user_id:?string}|null
     */
    public function exchangeCode(string $code): ?array
    {
        return $this->token([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => self::REDIRECT_URI,
        ]);
    }

    /**
     * A GOG access token lasts an hour, so every sync after the first one
     * starts here rather than asking the reader for another code.
     *
     * @return array{access_token:string, refresh_token:?string, expires_in:int, user_id:?string}|null
     */
    public function refresh(string $refreshToken): ?array
    {
        return $this->token([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]);
    }

    /**
     * The product ids this account owns, or null when GOG refuses.
     *
     * Null and an empty array are different answers and the caller has to be
     * able to tell them apart — the Steam import learned that the hard way,
     * where a withheld library and an empty one arrived identically and a
     * reader was told "Synced" over an empty shelf.
     *
     * @return array<int,int>|null
     */
    public function ownedProductIds(string $accessToken): ?array
    {
        $response = Http::withToken($accessToken)
            ->timeout(20)
            ->retry(2, 1500, throw: false)
            ->get(self::EMBED_BASE.'/user/data/games');

        if (! $response->successful()) {
            $this->note('owned games refused', ['status' => $response->status()]);

            return null;
        }

        $owned = $response->json('owned');

        if (! is_array($owned)) {
            $this->note('owned games came back in an unfamiliar shape');

            return null;
        }

        return array_values(array_map('intval', $owned));
    }

    /**
     * Ids to titles, in batches.
     *
     * The catalogue endpoint is public and takes a comma-separated list, so a
     * library of two hundred costs four calls rather than two hundred. DLC and
     * packs come back with a `game_type` that is not "game" and are dropped —
     * a shelf is games, and GOG counts a soundtrack as a product.
     *
     * @param  array<int,int>  $ids
     * @return array<int,array{id:int,title:string,slug:?string}>
     */
    public function titlesFor(array $ids, int $chunk = 50): array
    {
        $titles = [];

        foreach (array_chunk($ids, $chunk) as $batch) {
            $response = Http::timeout(20)
                ->retry(2, 1500, throw: false)
                ->get(self::CATALOGUE_BASE.'/products', ['ids' => implode(',', $batch)]);

            if (! $response->successful()) {
                $this->note('catalogue lookup failed', ['status' => $response->status(), 'count' => count($batch)]);

                continue;
            }

            foreach ((array) $response->json() as $product) {
                if (($product['game_type'] ?? 'game') !== 'game' || empty($product['title'])) {
                    continue;
                }

                $titles[] = [
                    'id' => (int) ($product['id'] ?? 0),
                    'title' => (string) $product['title'],
                    'slug' => $product['slug'] ?? null,
                ];
            }
        }

        return $titles;
    }

    /**
     * @param  array<string,string>  $grant
     * @return array{access_token:string, refresh_token:?string, expires_in:int, user_id:?string}|null
     */
    private function token(array $grant): ?array
    {
        $response = Http::timeout(20)
            ->retry(2, 1500, throw: false)
            ->get(self::AUTH_BASE.'/token', $grant + [
                'client_id' => self::CLIENT_ID,
                'client_secret' => self::CLIENT_SECRET,
            ]);

        if (! $response->successful() || ! $response->json('access_token')) {
            $this->note('token exchange rejected', [
                'status' => $response->status(),
                'error' => $response->json('error'),
            ]);

            return null;
        }

        return [
            'access_token' => (string) $response->json('access_token'),
            'refresh_token' => $response->json('refresh_token'),
            'expires_in' => (int) ($response->json('expires_in') ?? 3600),
            'user_id' => $response->json('user_id'),
        ];
    }

    private function note(string $message, array $context = []): void
    {
        Log::info("GOG: {$message}", $context);
    }
}
