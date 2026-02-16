<?php

namespace App\Services;

use App\Data\MidnightData;
use Carbon\Carbon;

/**
 * Blizzard Data Transformer - Midnight Edition
 *
 * Transforms Blizzard API data into Midnight-focused analysis format.
 * Extracts timeline-critical info, housing collections, lore achievements.
 */
class BlizzardDataTransformer
{
    // Void/Shadow-themed mount keywords
    protected const VOID_MOUNT_KEYWORDS = [
        'void', 'shadow', 'ethereal', 'dark', 'nether', 'fel', 'twilight', 'obsidian',
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
                if ($id && array_key_exists($id, MidnightData::QUELTHALAS_ACHIEVEMENTS)) {
                    $midnightAchievements[] = [
                        'id' => $id,
                        'name' => MidnightData::QUELTHALAS_ACHIEVEMENTS[$id]['name'],
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
     * Extract Quel'Thalas lore achievements
     */
    protected function extractQuelThalasAchievements(array $achievements): array
    {
        $loreAchievements = [];

        if (!isset($achievements['achievements'])) {
            return $loreAchievements;
        }

        foreach ($achievements['achievements'] as $achievement) {
            $id = $achievement['id'] ?? null;
            if ($id && isset(MidnightData::QUELTHALAS_ACHIEVEMENTS[$id])) {
                $loreAchievements[] = [
                    'id' => $id,
                    'name' => MidnightData::QUELTHALAS_ACHIEVEMENTS[$id]['name'],
                    'completed' => isset($achievement['completed_timestamp']),
                    'priority' => MidnightData::QUELTHALAS_ACHIEVEMENTS[$id]['priority'],
                    'why_important' => MidnightData::QUELTHALAS_ACHIEVEMENTS[$id]['why_important'],
                ];
            }
        }

        return $loreAchievements;
    }

    /**
     * Calculate housing readiness score
     */
    protected function calculateHousingScore(array $mounts, array $achievements): array
    {
        $totalMounts = $mounts['total_mounts'] ?? 0;
        $totalAchievements = $achievements['total_completed'] ?? 0;

        // Housing score factors
        $mountScore = min(100, ($totalMounts / 300) * 100); // 300 mounts = 100%
        $achievementScore = min(100, ($totalAchievements / 500) * 100); // 500 achievements = 100%
        $voidMountBonus = ($mounts['void_mount_count'] ?? 0) * 2; // 2% per void mount

        $housingScore = (int) round(($mountScore * 0.4) + ($achievementScore * 0.4) + min(20, $voidMountBonus));

        return [
            'housing_score' => $housingScore,
            'mount_count' => $totalMounts,
            'mount_target' => 300,
            'achievement_count' => $totalAchievements,
            'void_mount_count' => $mounts['void_mount_count'] ?? 0,
            'rating' => $this->getHousingRating($housingScore),
        ];
    }

    /**
     * Get housing readiness rating label
     */
    protected function getHousingRating(int $score): string
    {
        if ($score >= 90) return 'Legendary Collector';
        if ($score >= 75) return 'Epic Decorator';
        if ($score >= 60) return 'Rare Enthusiast';
        if ($score >= 40) return 'Uncommon Start';
        return 'Common Beginner';
    }

    /**
     * Generate timeline urgency data
     */
    protected function buildTimelineData(): array
    {
        $daysUntilLaunch = MidnightData::daysUntilDeadline('midnight_launch');

        return [
            'days_until_launch' => $daysUntilLaunch,
            'launch_date' => MidnightData::DEADLINES['midnight_launch']['date'],
            'urgency_level' => MidnightData::getUrgencyLevel($daysUntilLaunch),
            'limited_content_available' => [
                'royal_voidwing' => MidnightData::isContentAvailable('royal_voidwing'),
                'faceless_one_title' => MidnightData::isContentAvailable('faceless_one_title'),
            ],
        ];
    }

    /**
     * Build preparation checklist with completion status
     */
    protected function buildPreparationChecklist(array $achievements, array $mounts): array
    {
        $loreAchievements = $this->extractQuelThalasAchievements($achievements);

        $checklist = [
            'critical_limited' => [
                'label' => 'Critical - Limited Time',
                'items' => [
                    [
                        'name' => 'Royal Voidwing Mount',
                        'completed' => false, // Can't auto-detect this one
                        'priority' => 'CRITICAL',
                        'deadline' => '2026-03-02',
                        'source' => 'Complete "A Twilight Oath\'s End"',
                    ],
                ],
            ],
            'lore_mastery' => [
                'label' => 'Quel\'Thalas Lore Mastery',
                'items' => array_map(function ($ach) {
                    return [
                        'name' => $ach['name'],
                        'completed' => $ach['completed'],
                        'priority' => $ach['priority'],
                        'why_important' => $ach['why_important'],
                    ];
                }, $loreAchievements),
            ],
            'housing_prep' => [
                'label' => 'Housing Preparation',
                'items' => [
                    [
                        'name' => 'Collect 300+ Mounts',
                        'completed' => ($mounts['total_mounts'] ?? 0) >= 300,
                        'priority' => 'HIGH',
                        'progress' => ($mounts['total_mounts'] ?? 0) . '/300',
                    ],
                    [
                        'name' => 'Collect 10+ Void Mounts',
                        'completed' => ($mounts['void_mount_count'] ?? 0) >= 10,
                        'priority' => 'MEDIUM',
                        'progress' => ($mounts['void_mount_count'] ?? 0) . '/10',
                    ],
                ],
            ],
        ];

        return $checklist;
    }

    /**
     * Calculate overall Midnight readiness percentage
     */
    protected function calculateMidnightReadiness(array $achievements, array $mounts, array $housingScore): int
    {
        // Readiness factors
        $hasVoidElf = $achievements['has_void_elf'] ? 20 : 0; // 20% for Void Elf unlock
        $loreCompletion = (count($achievements['midnight_achievements'] ?? []) / 3) * 30; // 30% for lore
        $housingPrep = ($housingScore['housing_score'] / 100) * 30; // 30% for housing
        $voidMounts = min(20, ($mounts['void_mount_count'] ?? 0) * 2); // 20% max for void mounts

        return (int) round($hasVoidElf + $loreCompletion + $housingPrep + $voidMounts);
    }

    /**
     * Combine all transformed data into comprehensive Midnight analysis payload
     */
    public function buildAnalysisPayload(array $profile, array $achievements, array $mounts): array
    {
        $characterData = $this->transformProfile($profile);
        $achievementData = $this->transformAchievements($achievements);
        $mountData = $this->transformMounts($mounts);
        $housingData = $this->calculateHousingScore($mountData, $achievementData);
        $timelineData = $this->buildTimelineData();
        $checklist = $this->buildPreparationChecklist($achievementData, $mountData);

        return [
            'character' => $characterData,
            'achievements' => $achievementData,
            'mounts' => $mountData,
            'housing' => $housingData,
            'timeline' => $timelineData,
            'checklist' => $checklist,
            'midnight_readiness' => $this->calculateMidnightReadiness($achievementData, $mountData, $housingData),
        ];
    }
}
