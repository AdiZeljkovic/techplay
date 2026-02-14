<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\BlizzardService;
use App\Services\BlizzardDataTransformer;
use App\Services\OpenAIService;
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
    protected OpenAIService $openAIService;

    public function __construct(
        BlizzardService $blizzardService,
        BlizzardDataTransformer $transformer,
        OpenAIService $openAIService
    ) {
        $this->blizzardService = $blizzardService;
        $this->transformer = $transformer;
        $this->openAIService = $openAIService;
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

            // Step 3: Call OpenAI API
            $analysis = $this->openAIService->analyzeCharacterReadiness($payload);

            if (!$analysis) {
                return $this->error('AI analysis failed. Please try again later.', 503);
            }

            // Step 4: Return standardized response
            return $this->success([
                'character' => array_merge($payload['character'], [
                    'portrait_url' => $portraitUrl,
                ]),
                'readiness_score' => $analysis['score'] ?? 0,
                'ai_advice' => $analysis['advice'] ?? [],
                'missing_essentials' => $analysis['missing'] ?? [],
                'void_mounts_count' => $payload['mounts']['void_mount_count'] ?? 0,
                'has_void_elf' => $payload['achievements']['has_void_elf'] ?? false,
            ], 'Analysis completed successfully');
        });
    }
}
