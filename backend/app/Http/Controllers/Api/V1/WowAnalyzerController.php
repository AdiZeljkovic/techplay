<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WowAnalysis;
use App\Services\BlizzardService;
use App\Services\BlizzardDataTransformer;
use App\Services\BlizzardDataTransformerV2;
use App\Services\GroqService;
use App\Services\CacheService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;

class WowAnalyzerController extends Controller
{
    use ApiResponse;

    protected BlizzardService $blizzardService;
    protected BlizzardDataTransformerV2 $transformer;
    protected GroqService $aiService;

    public function __construct(
        BlizzardService $blizzardService,
        BlizzardDataTransformerV2 $transformer,
        GroqService $aiService
    ) {
        $this->blizzardService = $blizzardService;
        $this->transformer = $transformer;
        $this->aiService = $aiService;
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
            // Step 1: Fetch ALL data in parallel (4x faster)
            $data = $this->blizzardService->fetchAllCharacterData($region, $realmSlug, $characterName);

            if (!$data['profile']) {
                return $this->error('Character not found. Check spelling and realm.', 404);
            }

            // Extract portrait URL from media
            $portraitUrl = null;
            if ($data['media'] && isset($data['media']['assets'])) {
                foreach ($data['media']['assets'] as $asset) {
                    if ($asset['key'] === 'main-raw' || $asset['key'] === 'avatar') {
                        $portraitUrl = $asset['value'];
                        break;
                    }
                }
            }

            // Step 2: Transform data (V2 with equipment/M+/raids)
            $payload = $this->transformer->buildComprehensivePayload(
                $data['profile'],
                $data['achievements'] ?? [],
                $data['mounts'] ?? [],
                $data['equipment'],
                $data['mythic'],
                $data['raids']
            );

            // Step 3: Call AI API (Groq - Llama 3.3 70B)
            $analysis = $this->aiService->analyzeCharacterReadiness($payload);

            if (!$analysis) {
                return $this->error('AI analysis failed. Please try again later.', 503);
            }

            // Step 4: Store in database (with new columns)
            $wowAnalysis = WowAnalysis::updateOrCreate(
                [
                    'region' => $region,
                    'realm_slug' => $realmSlug,
                    'character_name' => $characterName,
                ],
                [
                    // Character info
                    'class' => $payload['character']['class'] ?? 'Unknown',
                    'race' => $payload['character']['race'] ?? 'Unknown',
                    'faction' => $payload['character']['faction'] ?? 'Unknown',
                    'level' => $payload['character']['level'] ?? 0,
                    'achievement_points' => $payload['character']['achievement_points'] ?? 0,

                    // Midnight readiness
                    'readiness_score' => $analysis['score'] ?? 0,
                    'ai_advice' => $analysis['advice'] ?? [],
                    'missing_essentials' => $analysis['missing'] ?? [],
                    'void_mounts_count' => $payload['mounts']['void_mount_count'] ?? 0,
                    'has_void_elf' => $payload['achievements']['has_void_elf'] ?? false,
                    'portrait_url' => $portraitUrl,

                    // Equipment
                    'item_level' => $payload['equipment']['item_level'] ?? null,
                    'equipment' => $payload['equipment']['slots'] ?? null,
                    'tier_pieces' => $payload['equipment']['tier_pieces'] ?? 0,
                    'missing_enchants' => $payload['equipment']['missing_enchants'] ?? null,
                    'missing_gems' => $payload['equipment']['missing_gems'] ?? null,

                    // Mythic+
                    'mythic_plus_score' => $payload['mythic_plus']['score'] ?? null,
                    'best_mythic_runs' => $payload['mythic_plus']['best_runs'] ?? null,
                    'vault_unlocked' => $payload['mythic_plus']['vault_unlocked'] ?? false,

                    // Raids
                    'raid_tier_name' => $payload['raids']['current_tier'] ?? null,
                    'raid_progress' => $payload['raids']['summary'] ?? null,
                    'raid_kills' => $payload['raids']['bosses'] ?? null,
                ]
            );

            // Step 5: Return comprehensive response (with new data for tabs)
            return $this->success([
                'id' => $wowAnalysis->id,
                'character' => [
                    ...$payload['character'],
                    'portrait_url' => $portraitUrl,
                ],

                // Overview tab (Midnight readiness)
                'readiness_score' => $analysis['score'] ?? 0,
                'ai_advice' => $analysis['advice'] ?? [],
                'missing_essentials' => $analysis['missing'] ?? [],
                'void_mounts_count' => $payload['mounts']['void_mount_count'] ?? 0,
                'has_void_elf' => $payload['achievements']['has_void_elf'] ?? false,

                // Equipment tab
                'equipment' => $payload['equipment'] ?? null,

                // Mythic+ tab
                'mythic_plus' => $payload['mythic_plus'] ?? null,

                // Raids tab
                'raids' => $payload['raids'] ?? null,
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
