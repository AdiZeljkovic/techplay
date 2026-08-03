<?php

namespace Database\Seeders;

use App\Models\ClanMissionTemplate;
use Illuminate\Database\Seeder;

/**
 * The opening mission catalog — enough variety that every clan's weekly
 * board feels different. Idempotent by name; safe to re-run.
 */
class ClanMissionTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'The Backlog Offensive',
                'description' => 'Push through enemy lines — finish the games you swore you would get back to.',
                'type' => 'individual',
                'criteria_type' => 'game_completed',
                'base_target' => 10,
                'duration_days' => 7,
                'reward_materials' => 500,
                'reward_prestige' => 120,
            ],
            [
                'name' => 'Critics Assemble',
                'description' => 'The clan speaks — publish reviews that say something.',
                'type' => 'individual',
                'criteria_type' => 'review_published',
                'base_target' => 5,
                'duration_days' => 7,
                'reward_intel' => 400,
                'reward_prestige' => 100,
            ],
            [
                'name' => 'Achievement Hunt',
                'description' => 'Leave nothing locked. Every achievement counts.',
                'type' => 'individual',
                'criteria_type' => 'achievement_unlocked',
                'base_target' => 20,
                'duration_days' => 7,
                'reward_materials' => 400,
                'reward_prestige' => 80,
            ],
            [
                'name' => 'Voices of the Forum',
                'description' => 'Comments with substance — the clan earns its reputation in the threads.',
                'type' => 'individual',
                'criteria_type' => 'comment_approved',
                'base_target' => 25,
                'duration_days' => 7,
                'reward_intel' => 300,
                'reward_prestige' => 60,
            ],
            [
                'name' => 'Field Reports',
                'description' => 'Log real play sessions in your journals — the clan tracks its hours.',
                'type' => 'individual',
                'criteria_type' => 'session_logged',
                'base_target' => 15,
                'duration_days' => 7,
                'reward_materials' => 350,
                'reward_prestige' => 70,
            ],
            [
                'name' => 'Squad Sync',
                'description' => 'Four members each log two real sessions this week. Play together, count together.',
                'type' => 'squad',
                'criteria_type' => 'session_logged',
                'base_target' => 4,
                'per_member_target' => 2,
                'scales' => false,
                'duration_days' => 7,
                'reward_materials' => 450,
                'reward_prestige' => 150,
            ],
            [
                'name' => 'Curators Row',
                'description' => 'Three members each publish a ranked list. Taste is a team sport.',
                'type' => 'squad',
                'criteria_type' => 'list_published',
                'base_target' => 3,
                'per_member_target' => 1,
                'scales' => false,
                'duration_days' => 14,
                'reward_intel' => 500,
                'reward_prestige' => 150,
            ],
            [
                'name' => 'Operation: Full Clear',
                'description' => 'A month-long campaign of completions. Every stage secured pays out on the spot.',
                'type' => 'operation',
                'criteria_type' => 'game_completed',
                'base_target' => 50,
                'duration_days' => 28,
                'min_mission_control' => 3,
                'reward_materials' => 800,
                'reward_prestige' => 400,
                'stages' => [
                    ['target' => 10, 'intel' => 0, 'materials' => 200, 'prestige' => 50],
                    ['target' => 25, 'intel' => 0, 'materials' => 300, 'prestige' => 100],
                    ['target' => 50, 'intel' => 0, 'materials' => 400, 'prestige' => 150],
                ],
            ],
        ];

        foreach ($templates as $template) {
            ClanMissionTemplate::updateOrCreate(['name' => $template['name']], $template);
        }
    }
}
