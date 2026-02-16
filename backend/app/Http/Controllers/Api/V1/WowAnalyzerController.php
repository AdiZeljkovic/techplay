<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WowAnalysis;
use App\Services\BlizzardService;
use App\Services\BlizzardDataTransformer;
use App\Services\GeminiService;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class WowAnalyzerController extends Controller
{
    use ApiResponse;

    protected BlizzardService $blizzardService;
    protected BlizzardDataTransformer $transformer;
    protected GeminiService $geminiService;

    public function __construct(
        BlizzardService $blizzardService,
        BlizzardDataTransformer $transformer,
        GeminiService $geminiService
    ) {
        $this->blizzardService = $blizzardService;
        $this->transformer = $transformer;
        $this->geminiService = $geminiService;
    }

    /**
     * Analyze WoW character for Midnight expansion readiness
     *
     * POST /api/v1/wow/analyze
     */
    public function analyze(Request $request)
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'character_name' => ['required', 'string', 'min:2', 'max:12', 'alpha_dash'],
            'realm_slug' => ['required', 'string', 'min:2', 'max:50', 'alpha_dash'],
            'region' => ['required', 'string', 'in:us,eu,kr,tw'],
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors()->toArray());
        }

        $characterName = strtolower($request->input('character_name'));
        $realmSlug = strtolower($request->input('realm_slug'));
        $region = strtolower($request->input('region'));

        // Cache key with 24h TTL
        $cacheKey = "wow_analysis_{$region}_{$realmSlug}_{$characterName}";

        return Cache::remember($cacheKey, CacheService::TTL_DAY, function () use ($region, $realmSlug, $characterName) {
            // Step 1: Fetch from Blizzard API
            $profile = $this->blizzardService->getCharacterProfile($region, $realmSlug, $characterName);

            if (!$profile) {
                return $this->error('Character not found. Check spelling and realm.', 404);
            }

            $achievements = $this->blizzardService->getCharacterAchievements($region, $realmSlug, $characterName);
            $mounts = $this->blizzardService->getCharacterMounts($region, $realmSlug, $characterName);
            $media = $this->blizzardService->getCharacterMedia($region, $realmSlug, $characterName);

            // Extract portrait URL from media
            $portraitUrl = null;
            if ($media && isset($media['assets'])) {
                foreach ($media['assets'] as $asset) {
                    if ($asset['key'] === 'main-raw' || $asset['key'] === 'avatar') {
                        $portraitUrl = $asset['value'];
                        break;
                    }
                }
            }

            // Step 2: Transform data
            $payload = $this->transformer->buildAnalysisPayload(
                $profile,
                $achievements ?? [],
                $mounts ?? []
            );

            // Step 3: Call Gemini API
            $analysis = $this->geminiService->analyzeCharacterReadiness($payload);

            if (!$analysis) {
                return $this->error('AI analysis failed. Please try again later.', 503);
            }

            // Step 4: Store in database
            $wowAnalysis = WowAnalysis::updateOrCreate(
                [
                    'region' => $region,
                    'realm_slug' => $realmSlug,
                    'character_name' => $characterName,
                ],
                [
                    'class' => $payload['character']['class'] ?? 'Unknown',
                    'race' => $payload['character']['race'] ?? 'Unknown',
                    'faction' => $payload['character']['faction'] ?? 'Unknown',
                    'level' => $payload['character']['level'] ?? 0,
                    'achievement_points' => $payload['character']['achievement_points'] ?? 0,
                    'readiness_score' => $analysis['score'] ?? 0,
                    'ai_advice' => $analysis['advice'] ?? [],
                    'missing_essentials' => $analysis['missing'] ?? [],
                    'void_mounts_count' => $payload['mounts']['void_mount_count'] ?? 0,
                    'has_void_elf' => $payload['achievements']['has_void_elf'] ?? false,
                    'portrait_url' => $portraitUrl,
                ]
            );

            // Step 5: Return standardized response
            return $this->success([
                'id' => $wowAnalysis->id,
                'character' => [
                    ...$payload['character'],
                    'portrait_url' => $portraitUrl,
                ],
                'readiness_score' => $analysis['score'] ?? 0,
                'ai_advice' => $analysis['advice'] ?? [],
                'missing_essentials' => $analysis['missing'] ?? [],
                'void_mounts_count' => $payload['mounts']['void_mount_count'] ?? 0,
                'has_void_elf' => $payload['achievements']['has_void_elf'] ?? false,
            ], 'Analysis completed successfully');
        });
    }

    /**
     * Get leaderboard - top readiness scores
     *
     * GET /api/v1/wow/leaderboard
     */
    public function leaderboard(Request $request)
    {
        $region = $request->query('region', null);
        $faction = $request->query('faction', null);
        $limit = min((int) $request->query('limit', 10), 50); // Max 50

        $query = WowAnalysis::query();

        if ($region) {
            $query->region($region);
        }

        if ($faction) {
            $query->faction($faction);
        }

        $leaderboard = $query->leaderboard($limit)->get();

        return $this->success([
            'leaderboard' => $leaderboard,
            'filters' => [
                'region' => $region,
                'faction' => $faction,
                'limit' => $limit,
            ],
        ]);
    }

    /**
     * Get recent analyses
     *
     * GET /api/v1/wow/recent
     */
    public function recent(Request $request)
    {
        $limit = min((int) $request->query('limit', 20), 50); // Max 50

        $recent = WowAnalysis::recent($limit)->get();

        return $this->success([
            'recent' => $recent,
        ]);
    }

    /**
     * Get specific analysis by ID
     *
     * GET /api/v1/wow/analysis/{id}
     */
    public function show(int $id)
    {
        $analysis = WowAnalysis::find($id);

        if (!$analysis) {
            return $this->error('Analysis not found', 404);
        }

        // Increment view count
        $analysis->incrementViews();

        return $this->success([
            'analysis' => $analysis,
        ]);
    }

    /**
     * Track share action
     *
     * POST /api/v1/wow/analysis/{id}/share
     */
    public function share(int $id)
    {
        $analysis = WowAnalysis::find($id);

        if (!$analysis) {
            return $this->error('Analysis not found', 404);
        }

        // Increment share count
        $analysis->incrementShares();

        return $this->success([
            'share_count' => $analysis->share_count,
        ], 'Share tracked successfully');
    }
}
