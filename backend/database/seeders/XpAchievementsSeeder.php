<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class XpAchievementsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $achievements = [
            // XP Milestones
            [
                'name' => 'XP Novice',
                'description' => 'Earn your first 100 XP',
                'icon_path' => 'achievements/xp-novice.png',
                'points' => 10,
                'criteria_type' => 'xp',
                'criteria_value' => 100,
            ],
            [
                'name' => 'XP Apprentice',
                'description' => 'Reach 500 XP - you\'re getting serious!',
                'icon_path' => 'achievements/xp-apprentice.png',
                'points' => 25,
                'criteria_type' => 'xp',
                'criteria_value' => 500,
            ],
            [
                'name' => 'XP Veteran',
                'description' => 'Hit the 1,000 XP milestone',
                'icon_path' => 'achievements/xp-veteran.png',
                'points' => 50,
                'criteria_type' => 'xp',
                'criteria_value' => 1000,
            ],
            [
                'name' => 'XP Master',
                'description' => 'Accumulate 5,000 XP - true dedication!',
                'icon_path' => 'achievements/xp-master.png',
                'points' => 100,
                'criteria_type' => 'xp',
                'criteria_value' => 5000,
            ],
            [
                'name' => 'XP Legend',
                'description' => 'Reach the legendary 10,000 XP mark',
                'icon_path' => 'achievements/xp-legend.png',
                'points' => 200,
                'criteria_type' => 'xp',
                'criteria_value' => 10000,
            ],

            // Discord Achievements
            [
                'name' => 'Discord Linked',
                'description' => 'Link your Discord account to TechPlay',
                'icon_path' => 'achievements/discord-linked.png',
                'points' => 15,
                'criteria_type' => 'discord',
                'criteria_value' => 1,
            ],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement
            );
        }

        $this->command->info('XP and Discord achievements seeded successfully!');
    }
}
