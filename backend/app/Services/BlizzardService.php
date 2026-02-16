<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BlizzardService
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $defaultRegion;
    protected bool $verifySSL;

    // Region-specific base URLs
    protected array $regionUrls = [
        'us' => 'https://us.api.blizzard.com',
        'eu' => 'https://eu.api.blizzard.com',
        'kr' => 'https://kr.api.blizzard.com',
        'tw' => 'https://tw.api.blizzard.com',
    ];

    protected array $oauthUrls = [
        'us' => 'https://oauth.battle.net/token',
        'eu' => 'https://oauth.battle.net/token',
        'kr' => 'https://oauth.battle.net/token',
        'tw' => 'https://oauth.battle.net/token',
    ];

    public function __construct()
    {
        $this->clientId = config('services.blizzard.client_id');
        $this->clientSecret = config('services.blizzard.client_secret');
        $this->defaultRegion = config('services.blizzard.region', 'us');
        $this->verifySSL = !app()->environment('local');
    }

    /**
     * Get HTTP client with SSL configuration
     */
    protected function http(int $timeout = 30)
    {
        $client = Http::timeout($timeout);
        if (!$this->verifySSL) {
            $client = $client->withoutVerifying();
        }
        return $client;
    }

    /**
     * Get OAuth 2.0 access token (cached for 3500s)
     * Follows PayPalService pattern
     */
    protected function getAccessToken(string $region = 'us'): string
    {
        $cacheKey = "blizzard_token_{$region}";

        return Cache::remember($cacheKey, 3500, function () use ($region) {
            try {
                $response = $this->http(15)
                    ->asForm()
                    ->withBasicAuth($this->clientId, $this->clientSecret)
                    ->post($this->oauthUrls[$region] ?? $this->oauthUrls['us'], [
                        'grant_type' => 'client_credentials',
                    ]);

                if ($response->failed()) {
                    Log::error('Blizzard OAuth Failed', [
                        'region' => $region,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    throw new \Exception('Blizzard authentication failed');
                }

                return $response->json()['access_token'];
            } catch (\Exception $e) {
                Log::error('Blizzard OAuth Exception: ' . $e->getMessage());
                throw $e;
            }
        });
    }

    /**
     * Get character profile summary
     * API: /profile/wow/character/{realmSlug}/{characterName}
     */
    public function getCharacterProfile(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Blizzard Character Profile Failed', [
                'region' => $region,
                'realm' => $realmSlug,
                'character' => $characterName,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Profile Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character achievements
     * API: /profile/wow/character/{realmSlug}/{characterName}/achievements
     */
    public function getCharacterAchievements(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/achievements", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Achievements API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Achievements Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character mounts collection
     * API: /profile/wow/character/{realmSlug}/{characterName}/collections/mounts
     */
    public function getCharacterMounts(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/mounts", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Mounts API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Mounts Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character media (avatar, inset, main render)
     * API: /profile/wow/character/{realmSlug}/{characterName}/character-media
     */
    public function getCharacterMedia(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/character-media", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Character Media API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Character Media Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character equipment (gear with iLvL, enchants, sockets)
     * API: /profile/wow/character/{realmSlug}/{characterName}/equipment
     */
    public function getCharacterEquipment(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/equipment", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Equipment API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Equipment Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character mythic keystone profile (M+ score, best runs)
     * API: /profile/wow/character/{realmSlug}/{characterName}/mythic-keystone-profile
     */
    public function getCharacterMythicProfile(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/mythic-keystone-profile", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Mythic Keystone Profile API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Mythic Keystone Profile Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character raid encounters (boss kills per difficulty)
     * API: /profile/wow/character/{realmSlug}/{characterName}/encounters/raids
     */
    public function getCharacterRaids(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/encounters/raids", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Raid Encounters API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Raid Encounters Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character PvP summary (Arena/RBG ratings, Honor level)
     * API: /profile/wow/character/{realmSlug}/{characterName}/pvp-summary
     */
    public function getCharacterPvPSummary(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/pvp-summary", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard PvP Summary API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard PvP Summary Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character reputations (all faction standings)
     * API: /profile/wow/character/{realmSlug}/{characterName}/reputations
     */
    public function getCharacterReputations(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/reputations", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Reputations API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Reputations Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character pets collection
     * API: /profile/wow/character/{realmSlug}/{characterName}/collections/pets
     */
    public function getCharacterPets(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/pets", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Pets API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Pets Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character toys collection
     * API: /profile/wow/character/{realmSlug}/{characterName}/collections/toys
     */
    public function getCharacterToys(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/toys", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Toys API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Toys Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character transmog appearances
     * API: /profile/wow/character/{realmSlug}/{characterName}/appearances
     */
    public function getCharacterAppearances(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/appearances", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Appearances API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Appearances Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get character professions (Primary + Secondary skills, specializations)
     * API: /profile/wow/character/{realmSlug}/{characterName}/professions
     */
    public function getCharacterProfessions(string $region, string $realmSlug, string $characterName): ?array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";

        try {
            $response = $this->http(20)
                ->withToken($token)
                ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/professions", [
                    'namespace' => $namespace,
                    'locale' => 'en_US',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Blizzard Professions API returned non-200', [
                'status' => $response->status(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Blizzard Professions Exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch all character data in parallel using Http::pool()
     * Performance: ~1-2s vs 4-8s sequential
     *
     * @param string $region Region code (us/eu/kr/tw)
     * @param string $realmSlug Realm slug (lowercase, dashes)
     * @param string $characterName Character name (lowercase)
     * @return array All endpoint responses (null if failed)
     */
    public function fetchAllCharacterData(string $region, string $realmSlug, string $characterName): array
    {
        $token = $this->getAccessToken($region);
        $baseUrl = $this->regionUrls[$region] ?? $this->regionUrls['us'];
        $namespace = "profile-{$region}";
        $locale = 'en_US';

        try {
            $responses = Http::pool(function ($pool) use ($token, $baseUrl, $namespace, $locale, $realmSlug, $characterName) {
                $baseParams = [
                    'namespace' => $namespace,
                    'locale' => $locale,
                ];

                $httpClient = $this->http(30);

                return [
                    'profile' => $pool->as('profile')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}", $baseParams),

                    'achievements' => $pool->as('achievements')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/achievements", $baseParams),

                    'mounts' => $pool->as('mounts')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/mounts", $baseParams),

                    'media' => $pool->as('media')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/character-media", $baseParams),

                    'equipment' => $pool->as('equipment')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/equipment", $baseParams),

                    'mythic' => $pool->as('mythic')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/mythic-keystone-profile", $baseParams),

                    'raids' => $pool->as('raids')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/encounters/raids", $baseParams),

                    'pvp' => $pool->as('pvp')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/pvp-summary", $baseParams),

                    'reputations' => $pool->as('reputations')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/reputations", $baseParams),

                    'pets' => $pool->as('pets')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/pets", $baseParams),

                    'toys' => $pool->as('toys')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/collections/toys", $baseParams),

                    'appearances' => $pool->as('appearances')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/appearances", $baseParams),

                    'professions' => $pool->as('professions')
                        ->withToken($token)
                        ->timeout(30)
                        ->get("{$baseUrl}/profile/wow/character/{$realmSlug}/{$characterName}/professions", $baseParams),
                ];
            });

            // Process responses - return null for failed requests
            return [
                'profile' => $responses['profile']->successful() ? $responses['profile']->json() : null,
                'achievements' => $responses['achievements']->successful() ? $responses['achievements']->json() : null,
                'mounts' => $responses['mounts']->successful() ? $responses['mounts']->json() : null,
                'media' => $responses['media']->successful() ? $responses['media']->json() : null,
                'equipment' => $responses['equipment']->successful() ? $responses['equipment']->json() : null,
                'mythic' => $responses['mythic']->successful() ? $responses['mythic']->json() : null,
                'raids' => $responses['raids']->successful() ? $responses['raids']->json() : null,
                'pvp' => $responses['pvp']->successful() ? $responses['pvp']->json() : null,
                'reputations' => $responses['reputations']->successful() ? $responses['reputations']->json() : null,
                'pets' => $responses['pets']->successful() ? $responses['pets']->json() : null,
                'toys' => $responses['toys']->successful() ? $responses['toys']->json() : null,
                'appearances' => $responses['appearances']->successful() ? $responses['appearances']->json() : null,
                'professions' => $responses['professions']->successful() ? $responses['professions']->json() : null,
            ];
        } catch (\Exception $e) {
            Log::error('Blizzard Parallel Fetch Exception: ' . $e->getMessage(), [
                'region' => $region,
                'realm' => $realmSlug,
                'character' => $characterName,
            ]);

            // Return all nulls on exception
            return [
                'profile' => null,
                'achievements' => null,
                'mounts' => null,
                'media' => null,
                'equipment' => null,
                'mythic' => null,
                'raids' => null,
                'pvp' => null,
                'reputations' => null,
                'pets' => null,
                'toys' => null,
                'appearances' => null,
                'professions' => null,
            ];
        }
    }
}
