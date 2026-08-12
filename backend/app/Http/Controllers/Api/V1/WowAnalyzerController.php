<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\WowAnalysis;
use App\Services\BlizzardDataTransformerV2;
use App\Services\BlizzardService;
use App\Services\CacheService;
use App\Services\GroqService;
use App\Services\RaiderIOService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class WowAnalyzerController extends Controller
{
    use ApiResponse;

    protected BlizzardService $blizzardService;

    protected BlizzardDataTransformerV2 $transformer;

    protected RaiderIOService $rioService;

    protected GroqService $aiService;

    public function __construct(
        BlizzardService $blizzardService,
        BlizzardDataTransformerV2 $transformer,
        RaiderIOService $rioService,
        GroqService $aiService
    ) {
        $this->blizzardService = $blizzardService;
        $this->transformer = $transformer;
        $this->rioService = $rioService;
        $this->aiService = $aiService;
    }

    /**
     * Analyze WoW character for Midnight expansion readiness
     *
     * POST /api/v1/wow/analyze
     */
    /** What a leaderboard or recent-list card actually draws. */
    private const CARD_COLUMNS = [
        'id', 'character_name', 'realm_slug', 'region',
        'class', 'race', 'faction', 'readiness_score', 'portrait_url',
    ];

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

        // Only a finished analysis is cached.
        //
        // The whole method used to sit inside Cache::remember, error paths and
        // all, so whatever JsonResponse it returned was stored. A character
        // typed wrong cached a 404 for a day, and — worse — one moment of the
        // inference service being unreachable cached "Professor Buffy is
        // currently unavailable" for twenty-four hours, turning a blip into a
        // day-long outage for that character.
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $this->success($cached, 'Analysis completed successfully');
        }

        // Step 1: Fetch ALL data in parallel (4x faster)
        $data = $this->blizzardService->fetchAllCharacterData($region, $realmSlug, $characterName);

        if (! $data['profile']) {
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

        // Step 2: Fetch Raider.IO data (real M+ score)
        $rioData = $this->rioService->getCharacterMythicPlusProfile($region, $realmSlug, $characterName);
        $rioTransformed = $this->rioService->transformMythicPlusData($rioData);

        // Step 3: Transform data (V3 with equipment/M+/raids/PvP/reps/collections/professions)
        $payload = $this->transformer->buildComprehensivePayload(
            $data['profile'],
            $data['achievements'] ?? [],
            $data['mounts'] ?? [],
            $data['equipment'],
            $data['mythic'],
            $data['raids'],
            $data['pvp'],
            $data['reputations'],
            $data['pets'],
            $data['toys'],
            $data['appearances'],
            $data['professions']
        );

        // Step 4: Call Analysis Service (Groq - Llama 3.3 70B)
        $analysis = $this->aiService->analyzeCharacterReadiness($payload);

        if (! $analysis) {
            return $this->error('Professor Buffy is currently unavailable. Please try again in a moment!', 503);
        }

        // Step 5: Store in database (with ALL new columns)
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

                // PvP
                'honor_level' => $payload['pvp']['honor_level'] ?? null,
                'arena_2v2' => $payload['pvp']['arena_2v2'] ?? null,
                'arena_3v3' => $payload['pvp']['arena_3v3'] ?? null,
                'rbg_rating' => $payload['pvp']['rbg_rating'] ?? null,

                // Reputations (Midnight critical)
                'exalted_reps' => $payload['reputations']['exalted_count'] ?? 0,
                'midnight_factions' => $payload['reputations']['midnight_factions'] ?? null,

                // Collections
                'pet_count' => $payload['collections']['pets']['total'] ?? 0,
                'pet_unique' => $payload['collections']['pets']['unique'] ?? 0,
                'pet_max_level' => $payload['collections']['pets']['max_level'] ?? 0,
                'toy_count' => $payload['collections']['toys']['collected'] ?? 0,
                'transmog_slots' => $payload['collections']['transmog']['slots_unlocked'] ?? 0,
                'transmog_appearances' => $payload['collections']['transmog']['total_appearances'] ?? 0,

                // Professions
                'professions' => $payload['professions'] ?? null,

                // Raider.IO Integration
                'rio_score' => $rioTransformed['rio_score'] ?? null,
                'rio_color' => $rioTransformed['rio_color'] ?? null,
                'world_rank' => $rioTransformed['world_rank'] ?? null,
                'region_rank' => $rioTransformed['region_rank'] ?? null,
                'realm_rank' => $rioTransformed['realm_rank'] ?? null,
            ]
        );

        // Step 6: Create historical snapshot for progression tracking
        \DB::table('wow_analysis_history')->insert([
            'wow_analysis_id' => $wowAnalysis->id,
            'character_name' => $characterName,
            'realm_slug' => $realmSlug,
            'region' => $region,
            'item_level' => $payload['equipment']['item_level'] ?? null,
            'mythic_plus_score' => $payload['mythic_plus']['score'] ?? null,
            'arena_rating' => max(
                $payload['pvp']['arena_2v2'] ?? 0,
                $payload['pvp']['arena_3v3'] ?? 0,
                $payload['pvp']['rbg_rating'] ?? 0
            ),
            'readiness_score' => $analysis['score'] ?? null,
            'pet_count' => $payload['collections']['pets']['total'] ?? 0,
            'toy_count' => $payload['collections']['toys']['collected'] ?? 0,
            'exalted_reps' => $payload['reputations']['exalted_count'] ?? 0,
            'analyzed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Step 7: Return comprehensive response (with ALL new data for tabs)
        $response = [
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

            // Mythic+ tab (with Raider.IO integration)
            'mythic_plus' => array_merge(
                $payload['mythic_plus'] ?? [],
                [
                    'rio_score' => $rioTransformed['rio_score'],
                    'rio_color' => $rioTransformed['rio_color'],
                    'world_rank' => $rioTransformed['world_rank'],
                    'region_rank' => $rioTransformed['region_rank'],
                    'realm_rank' => $rioTransformed['realm_rank'],
                ]
            ),

            // Raids tab
            'raids' => $payload['raids'] ?? null,

            // PvP tab
            'pvp' => $payload['pvp'] ?? null,

            // Reputations (for Overview tab - Midnight critical)
            'reputations' => $payload['reputations'] ?? null,

            // Collections tab
            'collections' => $payload['collections'] ?? null,

            // Professions tab
            'professions' => $payload['professions'] ?? null,
        ];

        Cache::put($cacheKey, $response, CacheService::TTL_DAY);

        return $this->success($response, 'Analysis completed successfully');
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

        // Nine columns, which is what the board draws.
        //
        // The whole WowAnalysis row used to travel — all forty-eight columns
        // for a top ten, including the AI's written advice at ~640 bytes a
        // head, the full equipment list, raid progress and professions. The
        // response was 19.7 KB to render a name, a portrait and a percentage.
        $leaderboard = $query->leaderboard($limit)->get(self::CARD_COLUMNS);

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

        $recent = WowAnalysis::recent($limit)->get([...self::CARD_COLUMNS, 'view_count', 'created_at']);

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

        if (! $analysis) {
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

        if (! $analysis) {
            return $this->error('Analysis not found', 404);
        }

        // Increment share count
        $analysis->incrementShares();

        return $this->success([
            'share_count' => $analysis->share_count,
        ], 'Share tracked successfully');
    }

    /**
     * Get all realms for a region (dynamic from Blizzard API)
     * Replaces static wow-realms.ts with complete realm list
     *
     * GET /api/v1/wow/realms/{region}
     */
    public function getRealms(string $region)
    {
        // Validate region
        if (! in_array($region, ['us', 'eu', 'kr', 'tw'])) {
            return $this->error('Invalid region. Must be us, eu, kr, or tw.', 400);
        }

        // Cache for 7 days (realms rarely change)
        $cacheKey = "wow_realms_{$region}";

        return Cache::remember($cacheKey, CacheService::TTL_WEEK, function () use ($region) {
            $data = $this->blizzardService->getRealmIndex($region);

            if (! $data || ! isset($data['realms'])) {
                return $this->error('Failed to fetch realms from Blizzard API', 503);
            }

            // Transform to frontend-friendly format (match wow-realms.ts structure)
            $realms = collect($data['realms'])->map(function ($realm) use ($region) {
                return [
                    'name' => $realm['name'] ?? 'Unknown',
                    'slug' => $realm['slug'] ?? '',
                    'locale' => $this->getLocaleForRegion($region),
                ];
            })->sortBy('name')->values()->all();

            return $this->success([
                'region' => $region,
                'count' => count($realms),
                'realms' => $realms,
            ], "Retrieved {$region} realms successfully");
        });
    }

    /**
     * Helper: Get default locale for region
     */
    protected function getLocaleForRegion(string $region): string
    {
        return match ($region) {
            'us' => 'en_US',
            'eu' => 'en_GB',
            'kr' => 'ko_KR',
            'tw' => 'zh_TW',
            default => 'en_US',
        };
    }
}
