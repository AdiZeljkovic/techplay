<?php

namespace App\Data;

/**
 * Midnight Expansion Critical Data
 *
 * All achievement IDs, mount IDs, deadlines, and preparation checklist items
 * for WoW: Midnight expansion readiness tracking.
 */
class MidnightData
{
    /**
     * Critical Timeline Deadlines
     */
    public const DEADLINES = [
        'season_3_end' => [
            'date' => '2026-01-20 22:00:00', // Already passed, but keep for reference
            'priority' => 'CRITICAL',
            'label' => 'Season 3 End',
            'description' => 'Mythic+ and PvP season rewards unavailable after this date',
        ],
        'pre_patch' => [
            'date' => '2026-01-20 00:00:00',
            'priority' => 'INFO',
            'label' => 'Pre-Patch Launch',
            'description' => 'Twilight Ascension event begins, housing early access available',
        ],
        'midnight_launch' => [
            'date' => '2026-03-02 15:00:00', // 3:00 PM PST = 15:00 UTC-8
            'priority' => 'CRITICAL',
            'label' => 'Midnight Launch',
            'description' => 'Full expansion access, all new content unlocked',
        ],
    ];

    /**
     * Limited-Time Content (Ending before or at Midnight launch)
     */
    public const LIMITED_CONTENT = [
        'royal_voidwing' => [
            'type' => 'mount',
            'name' => 'Royal Voidwing',
            'quest_name' => 'A Twilight Oath\'s End',
            'deadline' => '2026-03-02 15:00:00',
            'priority' => 'CRITICAL',
            'source' => 'Complete "A Twilight Oath\'s End" quest chain',
            'description' => 'This mount will NEVER be available again after Midnight launch',
        ],
        'faceless_one_title' => [
            'type' => 'title',
            'name' => 'the Faceless One',
            'achievement_id' => null, // Custom tracking
            'deadline' => '2026-03-02 15:00:00',
            'priority' => 'HIGH',
            'source' => 'Complete all objectives in Revisited Horrific Visions',
            'description' => 'Limited-time title from pre-patch event',
        ],
    ];

    /**
     * Quel'Thalas Lore Achievements (Midnight storyline-relevant)
     */
    public const QUELTHALAS_ACHIEVEMENTS = [
        725 => [
            'name' => 'Sunwell Plateau',
            'category' => 'Lore Mastery',
            'priority' => 'HIGH',
            'points' => 10,
            'description' => 'Defeat Kil\'jaeden in Sunwell Plateau',
            'why_important' => 'Sunwell is central to Midnight storyline - Void forces attack here',
        ],
        12242 => [
            'name' => 'Allied Races: Void Elf',
            'category' => 'Race Unlock',
            'priority' => 'CRITICAL',
            'points' => 10,
            'description' => 'Unlock Void Elf allied race',
            'why_important' => 'Void Elves are CORE to Midnight expansion - unlock them NOW',
        ],
        1784 => [
            'name' => 'Loremaster of Quel\'Thalas',
            'category' => 'Lore Mastery',
            'priority' => 'MEDIUM',
            'points' => 10,
            'description' => 'Complete all Quel\'Thalas zone quests',
            'why_important' => 'Full Quel\'Thalas lore understanding before revisiting in Midnight',
        ],
        2097 => [
            'name' => 'Get to the Choppa!',
            'category' => 'Mount',
            'priority' => 'LOW',
            'points' => 10,
            'description' => 'Obtain a Chopper mount',
            'why_important' => 'Housing decoration potential',
        ],
        9924 => [
            'name' => 'Field Photographer',
            'category' => 'Collection',
            'priority' => 'LOW',
            'points' => 20,
            'description' => 'Take pictures of 50 rare NPCs',
            'why_important' => 'Housing decoration - photo gallery',
        ],
    ];

    /**
     * Void-Themed Mounts (Critical for Midnight aesthetic)
     */
    public const VOID_MOUNTS = [
        'voidtalon_of_the_dark_star' => [
            'mount_id' => 682, // Example ID
            'name' => 'Voidtalon of the Dark Star',
            'source' => 'Rare spawn in Draenor (Edge of Reality portal)',
            'difficulty' => 'HARD',
            'priority' => 'HIGH',
            'housing_value' => 'Legendary display item',
        ],
        'corridor_creeper' => [
            'mount_id' => null,
            'name' => 'Corridor Creeper',
            'source' => 'Torghast, Tower of the Damned - Layer 8+',
            'difficulty' => 'MEDIUM',
            'priority' => 'MEDIUM',
            'housing_value' => 'Unique void aesthetic',
        ],
        'clutch_of_hvitur' => [
            'mount_id' => null,
            'name' => 'Clutch of Ha-Li',
            'source' => 'Mogu\'shan Vaults raid drop',
            'difficulty' => 'EASY',
            'priority' => 'MEDIUM',
            'housing_value' => 'Cloud serpent for housing',
        ],
    ];

    /**
     * Housing-Critical Collections
     */
    public const HOUSING_PRIORITIES = [
        'raid_achievements' => [
            'category' => 'Decoration Source',
            'priority' => 'HIGH',
            'description' => 'Raid achievements unlock unique housing decorations (trophies, banners)',
            'examples' => ['Ahead of the Curve', 'Cutting Edge', 'Glory achievements'],
        ],
        'mount_collection' => [
            'category' => 'Display Items',
            'priority' => 'HIGH',
            'description' => 'Mounts can be displayed in housing stables',
            'target' => 300,
            'description_detail' => '300+ mounts = impressive stable display',
        ],
        'pet_collection' => [
            'category' => 'Display Items',
            'priority' => 'MEDIUM',
            'description' => 'Battle pets can roam your house freely',
            'target' => 500,
            'description_detail' => '500+ pets = lively home atmosphere',
        ],
        'transmog_sets' => [
            'category' => 'Display Items',
            'priority' => 'HIGH',
            'description' => 'Complete transmog sets can be displayed on mannequins',
            'target' => 50,
            'description_detail' => '50+ complete sets = epic armor gallery',
        ],
    ];

    /**
     * Pre-Patch Activities (Jan 20 - Mar 2)
     */
    public const PREPATCH_ACTIVITIES = [
        'twilight_ascension' => [
            'name' => 'Twilight Ascension Event',
            'type' => 'Gearing',
            'priority' => 'CRITICAL',
            'reward' => 'ilvl 636 gear',
            'time_required' => '2-3 hours daily',
            'description' => 'Primary gearing system for pre-patch - complete daily quests',
        ],
        'the_cult_within' => [
            'name' => 'The Cult Within Quest Line',
            'type' => 'Story',
            'priority' => 'HIGH',
            'reward' => 'Unlocks Twilight Ascension event',
            'time_required' => '1 hour one-time',
            'description' => 'Required quest to unlock pre-patch event content',
        ],
        'housing_setup' => [
            'name' => 'Housing Early Access',
            'type' => 'Feature',
            'priority' => 'HIGH',
            'reward' => 'Get ahead on housing customization',
            'time_required' => 'Ongoing',
            'description' => 'Available with Midnight purchase - claim plot and start decorating',
        ],
    ];

    /**
     * Character Readiness Checklist Categories
     */
    public const CHECKLIST_CATEGORIES = [
        'critical_limited' => [
            'label' => 'Critical - Limited Time',
            'priority' => 'CRITICAL',
            'icon' => '⚠️',
            'description' => 'MUST complete before Midnight launch - never available again',
        ],
        'lore_mastery' => [
            'label' => 'Quel\'Thalas Lore Mastery',
            'priority' => 'HIGH',
            'icon' => '📖',
            'description' => 'Story-critical achievements for understanding Midnight storyline',
        ],
        'housing_prep' => [
            'label' => 'Housing Preparation',
            'priority' => 'HIGH',
            'icon' => '🏠',
            'description' => 'Collections that unlock housing decorations and displays',
        ],
        'character_ready' => [
            'label' => 'Character Readiness',
            'priority' => 'MEDIUM',
            'icon' => '⚔️',
            'description' => 'Gold, gear, professions, guild membership',
        ],
        'prepatch_content' => [
            'label' => 'Pre-Patch Activities',
            'priority' => 'HIGH',
            'icon' => '🎯',
            'description' => 'Twilight Ascension event and pre-patch storyline',
        ],
    ];

    /**
     * Class-Specific Priorities (for AI recommendations)
     */
    public const CLASS_PRIORITIES = [
        'Priest' => [
            'Shadow' => ['Void Elf race', 'Void-themed transmog', 'Mind control achievements'],
            'Holy' => ['Light-based achievements', 'Naaru reputation'],
            'Discipline' => ['Balance Light/Shadow transmog', 'Versatile gear'],
        ],
        'Paladin' => [
            'Holy' => ['Blood Elf Heritage Armor', 'Sunwell Plateau clear', 'Army of the Light rep'],
            'Protection' => ['Shield transmog collection', 'Tanking achievements'],
            'Retribution' => ['2-handed weapon transmog', 'Ashbringer replica'],
        ],
        'Warlock' => [
            'Affliction' => ['Fel-themed mounts', 'Void walker pets'],
            'Demonology' => ['Demon transmog', 'Summoning achievements'],
            'Destruction' => ['Fire-based mounts', 'Legendary staff transmog'],
        ],
        // ... Add more classes
    ];

    /**
     * Gold Recommendations by Content Type
     */
    public const GOLD_RECOMMENDATIONS = [
        'casual' => 100000,  // 100k gold
        'raider' => 300000,  // 300k gold (consumables, repairs)
        'collector' => 500000, // 500k gold (AH mounts, pets, transmog)
        'hardcore' => 1000000, // 1M gold (everything maxed)
    ];

    /**
     * Calculate days until deadline
     */
    public static function daysUntilDeadline(string $deadlineKey): int
    {
        if (! isset(self::DEADLINES[$deadlineKey])) {
            return 0;
        }

        $deadline = new \DateTime(self::DEADLINES[$deadlineKey]['date']);
        $now = new \DateTime('now', new \DateTimeZone('UTC'));

        $diff = $now->diff($deadline);

        return $diff->invert ? 0 : $diff->days;
    }

    /**
     * Check if content is still available
     */
    public static function isContentAvailable(string $contentKey): bool
    {
        if (! isset(self::LIMITED_CONTENT[$contentKey])) {
            return false;
        }

        $deadline = new \DateTime(self::LIMITED_CONTENT[$contentKey]['deadline']);
        $now = new \DateTime('now', new \DateTimeZone('UTC'));

        return $now < $deadline;
    }

    /**
     * Get urgency level based on days remaining
     */
    public static function getUrgencyLevel(int $daysRemaining): string
    {
        if ($daysRemaining <= 0) {
            return 'EXPIRED';
        }
        if ($daysRemaining <= 3) {
            return 'CRITICAL';
        }
        if ($daysRemaining <= 7) {
            return 'URGENT';
        }
        if ($daysRemaining <= 14) {
            return 'HIGH';
        }

        return 'NORMAL';
    }
}
