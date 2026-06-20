<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Raider.IO API Service
 *
 * Fetches real Mythic+ scores, rankings, and percentiles from Raider.IO
 * FREE API with no rate limits - https://raider.io/api
 */
class RaiderIOService
{
    private const BASE_URL = 'https://raider.io/api/v1';

    private const CACHE_TTL = 3600; // 1 hour (RIO data updates hourly)

    /**
     * Get character M+ profile from Raider.IO
     *
     * @param  string  $region  us|eu|kr|tw
     * @param  string  $realm  silvermoon
     * @param  string  $name  character name
     */
    public function getCharacterMythicPlusProfile(string $region, string $realm, string $name): ?array
    {
        $cacheKey = "rio_{$region}_{$realm}_{$name}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($region, $realm, $name) {
            try {
                $response = Http::timeout(10)->get(self::BASE_URL.'/characters/profile', [
                    'region' => $region,
                    'realm' => $realm,
                    'name' => $name,
                    'fields' => 'mythic_plus_scores_by_season:current,mythic_plus_ranks,mythic_plus_recent_runs,gear',
                ]);

                if (! $response->successful()) {
                    Log::warning('Raider.IO API request failed', [
                        'status' => $response->status(),
                        'region' => $region,
                        'realm' => $realm,
                        'name' => $name,
                    ]);

                    return null;
                }

                return $response->json();
            } catch (\Exception $e) {
                Log::error('Raider.IO API exception', [
                    'error' => $e->getMessage(),
                    'region' => $region,
                    'realm' => $realm,
                    'name' => $name,
                ]);

                return null;
            }
        });
    }

    /**
     * Transform Raider.IO response to our format
     */
    public function transformMythicPlusData(?array $rioData): array
    {
        if (! $rioData) {
            return [
                'rio_score' => null,
                'rio_color' => null,
                'world_rank' => null,
                'region_rank' => null,
                'realm_rank' => null,
                'class_rank' => null,
                'spec_rank' => null,
            ];
        }

        // Extract current season M+ scores
        $currentSeason = $rioData['mythic_plus_scores_by_season'][0] ?? null;
        $ranks = $rioData['mythic_plus_ranks'] ?? [];

        return [
            // Overall score
            'rio_score' => $currentSeason['scores']['all'] ?? null,
            'rio_color' => $currentSeason['segments']['all']['color'] ?? null,

            // Rankings
            'world_rank' => $ranks['overall']['world'] ?? null,
            'region_rank' => $ranks['overall']['region'] ?? null,
            'realm_rank' => $ranks['overall']['realm'] ?? null,

            // Class/Spec rankings
            'class_rank' => $ranks['class']['world'] ?? null,
            'spec_rank' => $ranks['class_spec']['world'] ?? null,

            // Recent runs (for activity tracking)
            'recent_runs_count' => count($rioData['mythic_plus_recent_runs'] ?? []),
        ];
    }

    /**
     * Calculate percentile from rank and total players
     *
     * @param  int  $totalPlayers  Approximate total active M+ players
     * @return string|null "Top 1%", "Top 10%", etc.
     */
    public function calculatePercentile(?int $rank, int $totalPlayers = 2000000): ?string
    {
        if (! $rank) {
            return null;
        }

        $percentile = ($rank / $totalPlayers) * 100;

        if ($percentile <= 0.1) {
            return 'Top 0.1%';
        }
        if ($percentile <= 1) {
            return 'Top 1%';
        }
        if ($percentile <= 3) {
            return 'Top 3%';
        }
        if ($percentile <= 5) {
            return 'Top 5%';
        }
        if ($percentile <= 10) {
            return 'Top 10%';
        }
        if ($percentile <= 25) {
            return 'Top 25%';
        }
        if ($percentile <= 50) {
            return 'Top 50%';
        }

        return 'Below Average';
    }

    /**
     * Get RIO score color hex
     *
     * @param  string|null  $colorName  grey|white|green|blue|purple|orange
     * @return string Hex color
     */
    public function getScoreColorHex(?string $colorName): string
    {
        $colors = [
            'grey' => '#808080',
            'white' => '#ffffff',
            'green' => '#1eff00',
            'blue' => '#0070dd',
            'purple' => '#a335ee',
            'orange' => '#ff8000',
        ];

        return $colors[$colorName] ?? $colors['grey'];
    }
}
