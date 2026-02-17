<?php

namespace App\Services;

/**
 * Blizzard Data Transformer V2 - Comprehensive Edition
 *
 * Extends V1 with equipment, M+, raids, and endgame content transformation.
 * Optimized for tab-based UI with compact data structures.
 */
class BlizzardDataTransformerV2 extends BlizzardDataTransformer
{
    // Tier set item IDs for current season (Nerub-ar Palace)
    protected const TIER_SET_NAMES = [
        'Entombed Seraph\'s',
        'Jeweled Cerulean',
        'Chosen Apostle\'s',
        'Scales of the Awakened',
        'Devotee\'s',
        'Vault Delver\'s',
        'Bleak Soothsayer\'s',
        'Lurking Specter\'s',
        'Abyssal Hunter\'s',
        'Darkcrest',
        'Greatwolf Outcast\'s',
    ];

    // Gem socket types
    protected const GEM_SOCKETS = ['PRISMATIC', 'RED', 'BLUE', 'YELLOW', 'META'];

    // Enchantable slots
    protected const ENCHANTABLE_SLOTS = [
        'CHEST', 'LEGS', 'FEET', 'WRIST', 'HANDS', 'BACK', 'MAIN_HAND', 'OFF_HAND', 'FINGER_1', 'FINGER_2'
    ];

    /**
     * Transform equipment data
     *
     * @param array|null $equipment Raw equipment API response
     * @return array Compact equipment data with iLvL, enchants, gems, tier progress
     */
    public function transformEquipment(?array $equipment): array
    {
        if (!$equipment || !isset($equipment['equipped_items'])) {
            return [
                'item_level' => 0,
                'slots' => [],
                'tier_pieces' => 0,
                'missing_enchants' => [],
                'missing_gems' => [],
            ];
        }

        $slots = [];
        $totalIlvl = 0;
        $itemCount = 0;
        $tierPieces = 0;
        $missingEnchants = [];
        $missingGems = [];

        foreach ($equipment['equipped_items'] as $item) {
            $slotType = $item['slot']['type'] ?? 'UNKNOWN';
            $itemLevel = $item['level']['value'] ?? 0;
            $itemName = $item['name'] ?? 'Unknown';

            // Track iLvL
            if ($itemLevel > 0) {
                $totalIlvl += $itemLevel;
                $itemCount++;
            }

            // Check for tier set pieces
            $isTier = $this->isTierSetItem($itemName);
            if ($isTier) {
                $tierPieces++;
            }

            // Check enchants
            $hasEnchant = isset($item['enchantments']) && count($item['enchantments']) > 0;
            $needsEnchant = in_array($slotType, self::ENCHANTABLE_SLOTS);

            if ($needsEnchant && !$hasEnchant) {
                $missingEnchants[] = $this->formatSlotName($slotType);
            }

            // Check gem sockets
            $sockets = $item['sockets'] ?? [];
            foreach ($sockets as $socket) {
                if (!isset($socket['item']) || empty($socket['item'])) {
                    $missingGems[] = $this->formatSlotName($slotType);
                    break; // Only report once per item
                }
            }

            // Build compact slot data
            $slots[] = [
                'slot' => $slotType,
                'name' => $itemName,
                'ilvl' => $itemLevel,
                'quality' => $item['quality']['type'] ?? 'COMMON',
                'is_tier' => $isTier,
                'enchanted' => $hasEnchant,
                'gem_slots' => count($sockets),
                'gems_filled' => $this->countFilledSockets($sockets),
            ];
        }

        $averageIlvl = $itemCount > 0 ? (int) round($totalIlvl / $itemCount) : 0;

        return [
            'item_level' => $averageIlvl,
            'slots' => $slots,
            'tier_pieces' => $tierPieces,
            'missing_enchants' => array_unique($missingEnchants),
            'missing_gems' => array_unique($missingGems),
        ];
    }

    /**
     * Transform Mythic+ data
     *
     * @param array|null $mythic Raw mythic-keystone-profile API response
     * @return array Custom M+ score, best runs, vault status
     */
    public function transformMythicPlus(?array $mythic): array
    {
        if (!$mythic) {
            return [
                'score' => 0,
                'best_runs' => [],
                'vault_unlocked' => false,
            ];
        }

        // Extract current season data
        $currentSeason = $mythic['current_mythic_rating'] ?? null;
        $score = $currentSeason ? ($currentSeason['rating'] ?? 0) : 0;

        // Extract best runs (up to 5)
        $bestRuns = [];
        if (isset($mythic['best_runs'])) {
            $bestRuns = array_slice(
                array_map(function ($run) {
                    return [
                        'dungeon' => $run['dungeon']['name'] ?? 'Unknown',
                        'level' => $run['keystone_level'] ?? 0,
                        'completed' => $run['is_completed_within_time'] ?? false,
                        'upgrade_level' => $run['keystone_upgrade_level'] ?? 0, // 0 = failed, 1 = +1, 2 = +2, 3 = +3
                    ];
                }, $mythic['best_runs']),
                0,
                5
            );
        }

        // Vault status (simplified - real implementation would check weekly runs)
        $vaultUnlocked = $score > 0; // Has done any M+ this season

        return [
            'score' => (int) round($score),
            'best_runs' => $bestRuns,
            'vault_unlocked' => $vaultUnlocked,
        ];
    }

    /**
     * Transform raid encounter data
     *
     * @param array|null $raids Raw encounters/raids API response
     * @return array Boss kill matrix, raid progress summary
     */
    public function transformRaids(?array $raids): array
    {
        if (!$raids || !isset($raids['expansions'])) {
            return [
                'current_tier' => 'Unknown',
                'bosses' => [],
                'summary' => '0/0',
            ];
        }

        // Find current expansion (The War Within - ID 10)
        $currentExpansion = null;
        foreach ($raids['expansions'] as $expansion) {
            if (($expansion['expansion']['id'] ?? 0) === 10) {
                $currentExpansion = $expansion;
                break;
            }
        }

        if (!$currentExpansion || !isset($currentExpansion['instances'])) {
            return [
                'current_tier' => 'Unknown',
                'bosses' => [],
                'summary' => '0/0',
            ];
        }

        // Find current tier (Nerub-ar Palace)
        $currentTier = null;
        foreach ($currentExpansion['instances'] as $instance) {
            if (str_contains($instance['instance']['name'] ?? '', 'Nerub-ar')) {
                $currentTier = $instance;
                break;
            }
        }

        if (!$currentTier) {
            // Fallback to latest instance
            $currentTier = end($currentExpansion['instances']);
        }

        $tierName = $currentTier['instance']['name'] ?? 'Unknown';
        $modes = $currentTier['modes'] ?? [];

        // Build boss kill matrix
        $bossMatrix = [];
        $normalKills = 0;
        $heroicKills = 0;
        $mythicKills = 0;
        $totalBosses = 0;

        foreach ($modes as $mode) {
            $difficulty = $mode['difficulty']['type'] ?? 'NORMAL';
            $progress = $mode['progress'] ?? [];

            foreach ($progress['encounters'] ?? [] as $encounter) {
                $bossName = $encounter['encounter']['name'] ?? 'Unknown';
                $completed = $encounter['completed_count'] ?? 0;

                // Initialize boss if not exists
                if (!isset($bossMatrix[$bossName])) {
                    $bossMatrix[$bossName] = [
                        'name' => $bossName,
                        'normal' => false,
                        'heroic' => false,
                        'mythic' => false,
                    ];
                    $totalBosses++;
                }

                // Mark kills
                if ($completed > 0) {
                    if ($difficulty === 'NORMAL') {
                        $bossMatrix[$bossName]['normal'] = true;
                        $normalKills++;
                    } elseif ($difficulty === 'HEROIC') {
                        $bossMatrix[$bossName]['heroic'] = true;
                        $heroicKills++;
                    } elseif ($difficulty === 'MYTHIC') {
                        $bossMatrix[$bossName]['mythic'] = true;
                        $mythicKills++;
                    }
                }
            }
        }

        // Build summary string (e.g., "7/8M, 8/8H")
        $summaryParts = [];
        if ($mythicKills > 0) {
            $summaryParts[] = "{$mythicKills}/{$totalBosses}M";
        }
        if ($heroicKills > 0) {
            $summaryParts[] = "{$heroicKills}/{$totalBosses}H";
        }
        if ($normalKills > 0 && $mythicKills === 0 && $heroicKills === 0) {
            $summaryParts[] = "{$normalKills}/{$totalBosses}N";
        }

        $summary = !empty($summaryParts) ? implode(', ', $summaryParts) : '0/' . $totalBosses;

        return [
            'current_tier' => $tierName,
            'bosses' => array_values($bossMatrix),
            'summary' => $summary,
        ];
    }

    /**
     * Transform PvP summary data
     *
     * @param array|null $pvp Raw pvp-summary API response
     * @return array Arena ratings, Honor level, seasonal ranking
     */
    public function transformPvP(?array $pvp): array
    {
        if (!$pvp) {
            return [
                'honor_level' => 0,
                'arena_2v2' => null,
                'arena_3v3' => null,
                'rbg_rating' => null,
            ];
        }

        $honorLevel = $pvp['honor_level'] ?? 0;

        // Extract bracket ratings (2v2, 3v3, RBG)
        $brackets = $pvp['pvp_brackets'] ?? [];
        $arena2v2 = null;
        $arena3v3 = null;
        $rbg = null;

        foreach ($brackets as $bracket) {
            $type = $bracket['bracket']['type'] ?? '';
            $rating = $bracket['rating'] ?? 0;

            if ($type === 'ARENA_2v2') {
                $arena2v2 = $rating;
            } elseif ($type === 'ARENA_3v3') {
                $arena3v3 = $rating;
            } elseif ($type === 'BATTLEGROUNDS') {
                $rbg = $rating;
            }
        }

        return [
            'honor_level' => $honorLevel,
            'arena_2v2' => $arena2v2,
            'arena_3v3' => $arena3v3,
            'rbg_rating' => $rbg,
        ];
    }

    /**
     * Transform reputations data
     *
     * @param array|null $reps Raw reputations API response
     * @return array Quel'Thalas factions (Midnight critical), exalted count
     */
    public function transformReputations(?array $reps): array
    {
        if (!$reps || !isset($reps['reputations'])) {
            return [
                'exalted_count' => 0,
                'midnight_factions' => [],
                'top_factions' => [],
            ];
        }

        // Midnight-critical Quel'Thalas factions
        $midnightFactionNames = [
            'Sunreaver Onslaught',
            'The Silver Covenant',
            'The Sunreavers',
            'Kirin Tor',
            'The Kirin Tor',
            'Shado-Pan',
        ];

        $exaltedCount = 0;
        $midnightFactions = [];
        $topFactions = [];

        foreach ($reps['reputations'] as $rep) {
            $factionName = $rep['faction']['name'] ?? 'Unknown';
            $standing = $rep['standing']['name'] ?? 'Neutral';
            $raw = $rep['standing']['raw'] ?? 0;
            $max = $rep['standing']['max'] ?? 1;
            $tier = $rep['standing']['tier'] ?? 0; // 0=Hated, 1=Hostile, 2=Unfriendly, 3=Neutral, 4=Friendly, 5=Honored, 6=Revered, 7=Exalted

            if ($tier === 7) { // Exalted
                $exaltedCount++;
            }

            // Check if Midnight-critical faction
            $isMidnightFaction = false;
            foreach ($midnightFactionNames as $midnightFaction) {
                if (str_contains($factionName, $midnightFaction)) {
                    $isMidnightFaction = true;
                    break;
                }
            }

            if ($isMidnightFaction) {
                $midnightFactions[] = [
                    'name' => $factionName,
                    'standing' => $standing,
                    'tier' => $tier, // 0-7
                    'progress' => [
                        'current' => $raw,
                        'max' => $max,
                    ],
                ];
            }

            // Track top 5 highest reps (for display)
            if ($tier >= 5) { // Honored or higher
                $topFactions[] = [
                    'name' => $factionName,
                    'standing' => $standing,
                    'tier' => $tier,
                ];
            }
        }

        // Sort top factions by tier desc
        usort($topFactions, fn($a, $b) => $b['tier'] <=> $a['tier']);
        $topFactions = array_slice($topFactions, 0, 5);

        return [
            'exalted_count' => $exaltedCount,
            'midnight_factions' => $midnightFactions,
            'top_factions' => $topFactions,
        ];
    }

    /**
     * Transform pets collection data
     *
     * @param array|null $pets Raw pets collection API response
     * @return array Pet statistics (total, unique, max level)
     */
    public function transformPets(?array $pets): array
    {
        if (!$pets || !isset($pets['pets'])) {
            return [
                'total' => 0,
                'unique' => 0,
                'max_level' => 0,
            ];
        }

        $totalPets = count($pets['pets']);

        // Extract species IDs (not the entire species object)
        $speciesIds = array_map(fn($pet) => $pet['species']['id'] ?? 0, $pets['pets']);
        $uniquePets = count(array_unique($speciesIds));

        $maxLevelPets = 0;

        foreach ($pets['pets'] as $pet) {
            if (($pet['level'] ?? 0) === 25) {
                $maxLevelPets++;
            }
        }

        return [
            'total' => $totalPets,
            'unique' => $uniquePets,
            'max_level' => $maxLevelPets,
        ];
    }

    /**
     * Transform toys collection data
     *
     * @param array|null $toys Raw toys collection API response
     * @return array Toy statistics (collected count)
     */
    public function transformToys(?array $toys): array
    {
        if (!$toys || !isset($toys['toys'])) {
            return [
                'collected' => 0,
            ];
        }

        return [
            'collected' => count($toys['toys']),
        ];
    }

    /**
     * Transform transmog appearances data
     *
     * @param array|null $appearances Raw appearances API response
     * @return array Transmog statistics (slots unlocked)
     */
    public function transformAppearances(?array $appearances): array
    {
        if (!$appearances || !isset($appearances['slots'])) {
            return [
                'slots_unlocked' => 0,
                'total_appearances' => 0,
            ];
        }

        $slotsUnlocked = count($appearances['slots']);
        $totalAppearances = 0;

        foreach ($appearances['slots'] as $slot) {
            if (isset($slot['appearances'])) {
                $totalAppearances += count($slot['appearances']);
            }
        }

        return [
            'slots_unlocked' => $slotsUnlocked,
            'total_appearances' => $totalAppearances,
        ];
    }

    /**
     * Transform professions data
     *
     * @param array|null $profs Raw professions API response
     * @return array Profession skills (primary, secondary)
     */
    public function transformProfessions(?array $profs): array
    {
        if (!$profs) {
            return [
                'primary' => [],
                'secondary' => [],
            ];
        }

        $primary = [];
        $secondary = [];

        // Primary professions (max 2)
        if (isset($profs['primaries'])) {
            foreach ($profs['primaries'] as $prof) {
                $primary[] = [
                    'name' => $prof['profession']['name'] ?? 'Unknown',
                    'skill_level' => $prof['skill_points'] ?? 0,
                    'max_skill' => $prof['max_skill_points'] ?? 100,
                ];
            }
        }

        // Secondary professions (Cooking, Fishing, Archaeology)
        if (isset($profs['secondaries'])) {
            foreach ($profs['secondaries'] as $prof) {
                $secondary[] = [
                    'name' => $prof['profession']['name'] ?? 'Unknown',
                    'skill_level' => $prof['skill_points'] ?? 0,
                    'max_skill' => $prof['max_skill_points'] ?? 100,
                ];
            }
        }

        return [
            'primary' => $primary,
            'secondary' => $secondary,
        ];
    }

    /**
     * Build comprehensive analysis payload (V2)
     *
     * Extends V1 payload with equipment, M+, raids, PvP, reputations data
     */
    public function buildComprehensivePayload(
        array $profile,
        array $achievements,
        array $mounts,
        ?array $equipment,
        ?array $mythic,
        ?array $raids,
        ?array $pvp = null,
        ?array $reputations = null,
        ?array $pets = null,
        ?array $toys = null,
        ?array $appearances = null,
        ?array $professions = null
    ): array {
        // Get V1 base payload (Midnight readiness)
        $basePayload = $this->buildAnalysisPayload($profile, $achievements, $mounts);

        // Add V2 endgame data
        $equipmentData = $this->transformEquipment($equipment);
        $mythicData = $this->transformMythicPlus($mythic);
        $raidsData = $this->transformRaids($raids);
        $pvpData = $this->transformPvP($pvp);
        $repsData = $this->transformReputations($reputations);

        // Add V3 collections data
        $petsData = $this->transformPets($pets);
        $toysData = $this->transformToys($toys);
        $appearancesData = $this->transformAppearances($appearances);
        $professionsData = $this->transformProfessions($professions);

        return array_merge($basePayload, [
            'equipment' => $equipmentData,
            'mythic_plus' => $mythicData,
            'raids' => $raidsData,
            'pvp' => $pvpData,
            'reputations' => $repsData,
            'collections' => [
                'pets' => $petsData,
                'toys' => $toysData,
                'transmog' => $appearancesData,
                'mounts_count' => count($mounts['mounts'] ?? []), // Already have mounts from V1
            ],
            'professions' => $professionsData,
        ]);
    }

    /**
     * Check if item is a tier set piece
     */
    protected function isTierSetItem(string $itemName): bool
    {
        foreach (self::TIER_SET_NAMES as $tierName) {
            if (str_contains($itemName, $tierName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Count filled gem sockets
     */
    protected function countFilledSockets(array $sockets): int
    {
        $filled = 0;
        foreach ($sockets as $socket) {
            if (isset($socket['item']) && !empty($socket['item'])) {
                $filled++;
            }
        }
        return $filled;
    }

    /**
     * Format slot name for display
     */
    protected function formatSlotName(string $slotType): string
    {
        return ucwords(str_replace('_', ' ', strtolower($slotType)));
    }
}
