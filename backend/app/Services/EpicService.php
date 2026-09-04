<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * An Epic library, through the launcher's own door.
 *
 * Epic Account Services — the OAuth a website is invited to use — offers four
 * scopes: `basic_profile`, `friends_list`, `presence` and `offline_access`.
 * None of them returns what somebody owns. There is no entitlements scope, no
 * developer programme that grants one, and no public catalogue of a person's
 * library. Checked against Epic's own documentation before this was written.
 *
 * So this is the flow Legendary and Heroic use: the Epic Games Launcher's own
 * client credentials, published in every one of those projects, and a code the
 * reader fetches from Epic while signed in. The same trade already made twice
 * on this site — Sony's mobile app for PlayStation, Galaxy's client for GOG —
 * made a third time, deliberately, and behind a flag that turns it off without
 * a deploy.
 *
 * Verified live before a line of this shipped: the redirect page answers 200,
 * the token endpoint accepts these credentials and rejects only a bad code
 * (`authorization_code_not_found`), and the library service answers 401
 * without a token. Everything below therefore fails soft and says which half
 * broke.
 *
 * What Epic gives is a list and a name. No playtime — Epic keeps none a third
 * party may read — no last-played date, and no achievements outside EOS. So an
 * Epic import fills the shelf and writes no measurement it did not make.
 */
class EpicService
{
    /** The Epic Games Launcher's own client. Public knowledge, not a secret of ours. */
    private const CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';

    private const CLIENT_SECRET = 'daafbccc737745039dffe53d94fc76cf';

    private const OAUTH_BASE = 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth';

    private const LAUNCHER_BASE = 'https://launcher-public-service-prod06.ol.epicgames.com/launcher/api/public';

    private const CATALOG_BASE = 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared';

    /**
     * Epic answers this with a JSON `authorizationCode` for whoever is signed
     * in. Handed to the frontend so the URL lives in exactly one place.
     */
    public const CODE_URL = 'https://www.epicgames.com/id/api/redirect?clientId='.self::CLIENT_ID.'&responseType=code';

    /** The launcher's user agent. Epic's services are choosier without it. */
    private const USER_AGENT = 'UELauncher/11.0.1-14907503+++Portal+Release-Live Windows/10.0.19041.1.256.64bit';

    public function enabled(): bool
    {
        return (bool) config('services.epic.enabled', false);
    }

    /**
     * @return array{access_token:string, refresh_token:?string, expires_in:int, account_id:?string, display_name:?string}|null
     */
    /*
     * ── The connect path answers inside the request's thirty seconds ─────
     *
     * Octane kills a worker at `config('octane.max_execution_time', 30)`, and
     * a killed worker writes nothing: the connection drops and nginx answers
     * 502 with no body, so our own explanation never reaches the reader. That
     * is what happened to PlayStation on 2 September — seven empty 502s in a
     * row — and the numbers here were worse than PlayStation's.
     *
     * `retry(2, 1500)` is three attempts, not two, so the old exchange could spend 63 seconds before giving up. The queue keeps the
     * long budget: a library sync has no ceiling over it and should be patient.
     */

    /** Seconds Epic gets to answer the one call a connect request makes. */
    public const CONNECT_TIMEOUT = 8;

    public function exchangeCode(string $code): ?array
    {
        // One attempt, eight seconds. A single-use code that Epic refused once
        // will be refused again, so the retries bought nothing but a dead worker.
        return $this->token(
            ['grant_type' => 'authorization_code', 'code' => $code],
            timeout: self::CONNECT_TIMEOUT,
            attempts: 1,
        );
    }

    /**
     * @return array{access_token:string, refresh_token:?string, expires_in:int, account_id:?string, display_name:?string}|null
     */
    public function refresh(string $refreshToken): ?array
    {
        return $this->token(['grant_type' => 'refresh_token', 'refresh_token' => $refreshToken]);
    }

    /**
     * Everything the account owns on Windows, or null when Epic refuses.
     *
     * Null and an empty list are different answers and the caller must be able
     * to tell them apart — the Steam import learned that the hard way, where a
     * withheld library and an empty one arrived identically and the reader was
     * told "Synced" over an empty shelf.
     *
     * The list is artifacts, not games: engine builds, plugins and DLC come
     * back alongside them. Sorting that out needs the catalogue, so it happens
     * in titlesFor() rather than here.
     *
     * @return array<int,array{appName:string,namespace:string,catalogItemId:string}>|null
     */
    public function ownedArtifacts(string $accessToken): ?array
    {
        /*
         * `label=Live` is not optional, whatever the shape of the URL suggests.
         *
         * Without it the launcher service answers 200 with an empty array — not
         * an error, not a refusal, just nothing — and an import reported "done,
         * 0 games" against an account that owns plenty. Measured on a real
         * library: 0 items without the label, 80 with it, same token, same
         * second.
         *
         * The label names which build channel to list. Legendary and Heroic
         * both send Live and so does the launcher itself; there is no default.
         */
        $response = $this->client($accessToken)->get(self::LAUNCHER_BASE.'/assets/Windows', ['label' => 'Live']);

        if (! $response->successful()) {
            $this->note('assets refused', ['status' => $response->status()]);

            return null;
        }

        $records = $response->json();

        if (! is_array($records)) {
            $this->note('assets came back in an unfamiliar shape');

            return null;
        }

        $out = [];

        foreach ($records as $record) {
            if (empty($record['namespace']) || empty($record['catalogItemId'])) {
                continue;
            }

            $out[] = [
                'appName' => (string) ($record['appName'] ?? ''),
                'namespace' => (string) $record['namespace'],
                'catalogItemId' => (string) $record['catalogItemId'],
            ];
        }

        return $out;
    }

    /**
     * Artifacts to game titles.
     *
     * The catalogue is asked per namespace and takes several ids at once, so a
     * library costs roughly one call per publisher rather than one per item.
     * Only entries the catalogue files under `games` survive: Epic hands back
     * engine builds, plugins, soundtracks and DLC in the same list, and a
     * shelf is games.
     *
     * @param  array<int,array{appName:string,namespace:string,catalogItemId:string}>  $artifacts
     * @return array<int,array{id:string,title:string}>
     */
    public function titlesFor(string $accessToken, array $artifacts): array
    {
        $byNamespace = [];

        foreach ($artifacts as $artifact) {
            $byNamespace[$artifact['namespace']][] = $artifact['catalogItemId'];
        }

        $titles = [];

        foreach ($byNamespace as $namespace => $ids) {
            foreach (array_chunk(array_unique($ids), 30) as $batch) {
                /*
                 * `id` repeats; it is not an array parameter.
                 *
                 * Passing `['id' => $batch]` builds `id[0]=…&id[1]=…`, which
                 * Epic does not read — it answers 200 with an empty object, so
                 * eighty owned artifacts turned into nought games and the
                 * import called itself finished. The catalogue wants the key
                 * repeated: `id=a&id=b`. Same ids, same token, same second: 0
                 * items the first way, every one of them the second.
                 */
                $query = implode('&', array_map(
                    fn (string $id) => 'id='.rawurlencode($id),
                    $batch,
                )).'&country=US&locale=en&includeDLCDetails=false';

                $response = $this->client($accessToken)->get(
                    self::CATALOG_BASE.'/namespace/'.rawurlencode($namespace).'/bulk/items?'.$query,
                );

                if (! $response->successful()) {
                    $this->note('catalogue lookup failed', ['namespace' => $namespace, 'status' => $response->status()]);

                    continue;
                }

                foreach ((array) $response->json() as $id => $item) {
                    if (! $this->isGame($item)) {
                        continue;
                    }

                    $titles[] = ['id' => (string) $id, 'title' => (string) $item['title']];
                }
            }
        }

        return $titles;
    }

    /**
     * Is this catalogue entry a game somebody plays?
     *
     * Two tells, and both are needed. `categories` carries a `games` path for
     * base games, and `mainGameItem` is present on anything that hangs off
     * one — which is how a season pass and a soundtrack are told from the game
     * they belong to.
     */
    private function isGame(mixed $item): bool
    {
        if (! is_array($item) || empty($item['title'])) {
            return false;
        }

        if (! empty($item['mainGameItem'])) {
            return false;
        }

        $paths = array_column((array) ($item['categories'] ?? []), 'path');

        return in_array('games', $paths, true) && ! in_array('addons', $paths, true);
    }

    /**
     * @param  array<string,string>  $grant
     * @return array{access_token:string, refresh_token:?string, expires_in:int, account_id:?string, display_name:?string}|null
     */
    /**
     * @param  int  $timeout  seconds per attempt
     * @param  int  $attempts  total attempts, not retries after the first
     */
    private function token(array $grant, int $timeout = 20, int $attempts = 3): ?array
    {
        $response = Http::asForm()
            ->withBasicAuth(self::CLIENT_ID, self::CLIENT_SECRET)
            ->withHeaders(['User-Agent' => self::USER_AGENT])
            ->timeout($timeout)
            ->retry($attempts, 1500, throw: false)
            ->post(self::OAUTH_BASE.'/token', $grant);

        if (! $response->successful() || ! $response->json('access_token')) {
            $this->note('token exchange rejected', [
                'status' => $response->status(),
                'error' => $response->json('errorCode'),
            ]);

            return null;
        }

        return [
            'access_token' => (string) $response->json('access_token'),
            'refresh_token' => $response->json('refresh_token'),
            'expires_in' => (int) ($response->json('expires_in') ?? 7200),
            'account_id' => $response->json('account_id'),
            'display_name' => $response->json('displayName'),
        ];
    }

    private function client(string $accessToken)
    {
        return Http::withToken($accessToken)
            ->withHeaders(['User-Agent' => self::USER_AGENT])
            ->timeout(25)
            ->retry(2, 1500, throw: false);
    }

    /**
     * Written to its own channel, because production runs LOG_LEVEL=error.
     *
     * These lines were warnings and infos on the stack channel, which means
     * they were thrown away before they reached disk — and that is how a
     * provider could fail for every reader who tried it while the log stayed
     * empty. See the `connections` channel in config/logging.php.
     */
    private function note(string $message, array $context = []): void
    {
        Log::channel('connections')->info("Epic: {$message}", $context);
    }
}
