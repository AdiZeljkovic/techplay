<?php

namespace App\Services;

/**
 * Blizzard Data Transformer
 *
 * Minifies massive Blizzard API responses (~50KB) to compact format (~5KB)
 * for OpenAI token optimization and cost reduction.
 */
class BlizzardDataTransformer
{
    // Midnight-relevant achievement IDs
    protected const MIDNIGHT_ACHIEVEMENTS = [
        725 => "Thori'dal, the Stars' Fury",
        1784 => "Warbands",
        12242 => "Allied Races: Void Elf",
        // Sunwell Plateau achievements
        726 => "Sunwell Plateau Completion",
        // Add more relevant achievement IDs here
    ];

    // Void/Shadow-themed mount keywords
    protected const VOID_MOUNT_KEYWORDS = [
        'void', 'shadow', 'ethereal', 'dark', 'nether', 'fel',
    ];

    /**
     * Transform character profile to compact format
     */
    public function transformProfile(array $profile): array
    {
        return [
            'name' => $profile['name'] ?? 'Unknown',
            'level' => $profile['level'] ?? 0,
            'class' => $profile['character_class']['name'] ?? 'Unknown',
            'race' => $profile['race']['name'] ?? 'Unknown',
            'faction' => $profile['faction']['name'] ?? 'Unknown',
            'achievement_points' => $profile['achievement_points'] ?? 0,
        ];
    }

    /**
     * Transform achievements to Midnight-relevant list
     */
    public function transformAchievements(array $achievements): array
    {
        $midnightAchievements = [];
        $totalCompleted = 0;

        if (isset($achievements['achievements'])) {
            foreach ($achievements['achievements'] as $achievement) {
                $id = $achievement['id'] ?? null;
                if ($id && array_key_exists($id, self::MIDNIGHT_ACHIEVEMENTS)) {
                    $midnightAchievements[] = [
                        'id' => $id,
                        'name' => self::MIDNIGHT_ACHIEVEMENTS[$id],
                        'completed' => isset($achievement['completed_timestamp']),
                    ];
                }
                if (isset($achievement['completed_timestamp'])) {
                    $totalCompleted++;
                }
            }
        }

        return [
            'midnight_achievements' => $midnightAchievements,
            'total_completed' => $totalCompleted,
            'has_void_elf' => $this->hasVoidElfAchievement($achievements),
        ];
    }

    /**
     * Transform mounts to Void-themed list
     */
    public function transformMounts(array $mounts): array
    {
        $voidMounts = [];
        $totalMounts = 0;

        if (isset($mounts['mounts'])) {
            $totalMounts = count($mounts['mounts']);

            foreach ($mounts['mounts'] as $mount) {
                $name = strtolower($mount['mount']['name'] ?? '');

                foreach (self::VOID_MOUNT_KEYWORDS as $keyword) {
                    if (str_contains($name, $keyword)) {
                        $voidMounts[] = [
                            'id' => $mount['mount']['id'] ?? 0,
                            'name' => $mount['mount']['name'] ?? 'Unknown',
                        ];
                        break;
                    }
                }
            }
        }

        return [
            'void_mounts' => $voidMounts,
            'void_mount_count' => count($voidMounts),
            'total_mounts' => $totalMounts,
        ];
    }

    /**
     * Check if character has Void Elf unlocked
     */
    protected function hasVoidElfAchievement(array $achievements): bool
    {
        if (!isset($achievements['achievements'])) {
            return false;
        }

        foreach ($achievements['achievements'] as $achievement) {
            if (($achievement['id'] ?? 0) === 12242 && isset($achievement['completed_timestamp'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Combine all transformed data into compact AI-ready format
     */
    public function buildAnalysisPayload(array $profile, array $achievements, array $mounts): array
    {
        return [
            'character' => $this->transformProfile($profile),
            'achievements' => $this->transformAchievements($achievements),
            'mounts' => $this->transformMounts($mounts),
        ];
    }
}
