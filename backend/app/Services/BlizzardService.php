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
}
