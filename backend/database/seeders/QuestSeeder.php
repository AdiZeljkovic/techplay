<?php

namespace Database\Seeders;

use App\Models\Quest;
use Illuminate\Database\Seeder;

class QuestSeeder extends Seeder
{
    public function run(): void
    {
        $quests = [
            // ── DAILY ──────────────────────────────────────────────
            [
                'name' => 'Daily Check-in',
                'description' => 'Claim your daily streak reward.',
                'icon' => 'flame',
                'type' => 'daily',
                'criteria_type' => 'daily_login',
                'criteria_value' => 1,
                'xp_reward' => 0,
                'bounty_reward' => 5,
            ],
            [
                'name' => 'Gamer On the Move',
                'description' => 'Leave a comment today.',
                'icon' => 'message-circle',
                'type' => 'daily',
                'criteria_type' => 'comment_posted',
                'criteria_value' => 1,
                'xp_reward' => 10,
                'bounty_reward' => 10,
            ],

            // ── WEEKLY ─────────────────────────────────────────────
            [
                'name' => 'Backlog Buster',
                'description' => 'Complete a game this week.',
                'icon' => 'check-circle',
                'type' => 'weekly',
                'criteria_type' => 'game_completed',
                'criteria_value' => 1,
                'xp_reward' => 100,
                'bounty_reward' => 75,
            ],
            [
                'name' => 'Collector',
                'description' => 'Add 3 games to your library this week.',
                'icon' => 'library',
                'type' => 'weekly',
                'criteria_type' => 'game_added',
                'criteria_value' => 3,
                'xp_reward' => 50,
                'bounty_reward' => 40,
            ],
            [
                'name' => 'Consistent Gamer',
                'description' => 'Claim your daily streak 5 times this week.',
                'icon' => 'flame',
                'type' => 'weekly',
                'criteria_type' => 'streak_days',
                'criteria_value' => 5,
                'xp_reward' => 75,
                'bounty_reward' => 60,
            ],

            // ── MONTHLY ────────────────────────────────────────────
            [
                'name' => 'The Completionist',
                'description' => 'Complete 4 games this month.',
                'icon' => 'trophy',
                'type' => 'monthly',
                'criteria_type' => 'game_completed',
                'criteria_value' => 4,
                'xp_reward' => 300,
                'bounty_reward' => 250,
            ],
            [
                'name' => 'Month of Dedication',
                'description' => 'Maintain a daily streak for 20 days this month.',
                'icon' => 'zap',
                'type' => 'monthly',
                'criteria_type' => 'streak_days',
                'criteria_value' => 20,
                'xp_reward' => 200,
                'bounty_reward' => 200,
            ],
            [
                'name' => 'Content Creator',
                'description' => 'Publish an article this month.',
                'icon' => 'pen',
                'type' => 'monthly',
                'criteria_type' => 'article_published',
                'criteria_value' => 1,
                'xp_reward' => 150,
                'bounty_reward' => 120,
            ],

            // ── PERMANENT ──────────────────────────────────────────
            [
                'name' => 'First Step',
                'description' => 'Add your first game to your library.',
                'icon' => 'plus-circle',
                'type' => 'permanent',
                'criteria_type' => 'game_added',
                'criteria_value' => 1,
                'xp_reward' => 25,
                'bounty_reward' => 20,
            ],
            [
                'name' => 'Growing Library',
                'description' => 'Add 25 games to your library.',
                'icon' => 'library',
                'type' => 'permanent',
                'criteria_type' => 'game_added',
                'criteria_value' => 25,
                'xp_reward' => 100,
                'bounty_reward' => 100,
            ],
            [
                'name' => 'Century Club',
                'description' => 'Add 100 games to your library.',
                'icon' => 'star',
                'type' => 'permanent',
                'criteria_type' => 'game_added',
                'criteria_value' => 100,
                'xp_reward' => 500,
                'bounty_reward' => 400,
            ],
            [
                'name' => 'First Completion',
                'description' => 'Complete your first game.',
                'icon' => 'check-circle',
                'type' => 'permanent',
                'criteria_type' => 'game_completed',
                'criteria_value' => 1,
                'xp_reward' => 50,
                'bounty_reward' => 50,
            ],
            [
                'name' => 'Streak Warrior',
                'description' => 'Maintain a login streak for 7 days.',
                'icon' => 'flame',
                'type' => 'permanent',
                'criteria_type' => 'streak_days',
                'criteria_value' => 7,
                'xp_reward' => 75,
                'bounty_reward' => 60,
            ],
            [
                'name' => 'Iron Will',
                'description' => 'Maintain a login streak for 30 days.',
                'icon' => 'shield',
                'type' => 'permanent',
                'criteria_type' => 'streak_days',
                'criteria_value' => 30,
                'xp_reward' => 300,
                'bounty_reward' => 250,
            ],
            [
                'name' => 'Published Author',
                'description' => 'Publish your first article on TechPlay.',
                'icon' => 'pen',
                'type' => 'permanent',
                'criteria_type' => 'article_published',
                'criteria_value' => 1,
                'xp_reward' => 100,
                'bounty_reward' => 80,
            ],
            [
                'name' => 'Critic',
                'description' => 'Publish your first review.',
                'icon' => 'star',
                'type' => 'permanent',
                'criteria_type' => 'review_published',
                'criteria_value' => 1,
                'xp_reward' => 150,
                'bounty_reward' => 120,
            ],
        ];

        foreach ($quests as $q) {
            Quest::updateOrCreate(
                ['name' => $q['name'], 'type' => $q['type']],
                array_merge($q, ['is_active' => true])
            );
        }
    }
}
