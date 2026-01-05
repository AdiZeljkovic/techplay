<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    public function run(): void
    {
        $achievements = [
            // Forum Activity
            ['name' => 'First Steps', 'description' => 'Create your first forum post', 'points' => 50, 'criteria_type' => 'posts_count', 'criteria_value' => 1],
            ['name' => 'Active Voice', 'description' => 'Create 10 forum posts', 'points' => 100, 'criteria_type' => 'posts_count', 'criteria_value' => 10],
            ['name' => 'Prolific Poster', 'description' => 'Create 50 forum posts', 'points' => 250, 'criteria_type' => 'posts_count', 'criteria_value' => 50],
            ['name' => 'Forum Legend', 'description' => 'Create 200 forum posts', 'points' => 500, 'criteria_type' => 'posts_count', 'criteria_value' => 200],

            // Thread Creation
            ['name' => 'Conversation Starter', 'description' => 'Start your first thread', 'points' => 75, 'criteria_type' => 'threads_count', 'criteria_value' => 1],
            ['name' => 'Discussion Leader', 'description' => 'Start 10 threads', 'points' => 200, 'criteria_type' => 'threads_count', 'criteria_value' => 10],

            // Reputation
            ['name' => 'Rising Star', 'description' => 'Reach 100 reputation', 'points' => 100, 'criteria_type' => 'reputation', 'criteria_value' => 100],
            ['name' => 'Community Pillar', 'description' => 'Reach 500 reputation', 'points' => 300, 'criteria_type' => 'reputation', 'criteria_value' => 500],
            ['name' => 'Elite Member', 'description' => 'Reach 1000 reputation', 'points' => 500, 'criteria_type' => 'reputation', 'criteria_value' => 1000],

            // XP Milestones
            ['name' => 'Level 5', 'description' => 'Reach level 5', 'points' => 100, 'criteria_type' => 'xp', 'criteria_value' => 5000],
            ['name' => 'Level 10', 'description' => 'Reach level 10', 'points' => 250, 'criteria_type' => 'xp', 'criteria_value' => 10000],
            ['name' => 'Level 25', 'description' => 'Reach level 25', 'points' => 500, 'criteria_type' => 'xp', 'criteria_value' => 25000],
            ['name' => 'Level 50', 'description' => 'Reach level 50', 'points' => 1000, 'criteria_type' => 'xp', 'criteria_value' => 50000],

            // Social
            ['name' => 'Friendly', 'description' => 'Add your first friend', 'points' => 50, 'criteria_type' => 'friends_count', 'criteria_value' => 1],
            ['name' => 'Socialite', 'description' => 'Have 10 friends', 'points' => 150, 'criteria_type' => 'friends_count', 'criteria_value' => 10],
            ['name' => 'Popular', 'description' => 'Have 50 friends', 'points' => 300, 'criteria_type' => 'friends_count', 'criteria_value' => 50],

            // Profile
            ['name' => 'Gamer Tag', 'description' => 'Add your first gaming platform ID', 'points' => 25, 'criteria_type' => 'gamertags', 'criteria_value' => 1],
            ['name' => 'Multi-Platform', 'description' => 'Add 3 gaming platform IDs', 'points' => 75, 'criteria_type' => 'gamertags', 'criteria_value' => 3],
            ['name' => 'Battlestation', 'description' => 'Complete your PC specs', 'points' => 50, 'criteria_type' => 'pc_specs', 'criteria_value' => 1],

            // Special
            ['name' => 'Early Adopter', 'description' => 'Join during the beta period', 'points' => 200, 'criteria_type' => 'special', 'criteria_value' => 0],
            ['name' => 'Verified Gamer', 'description' => 'Verify your email address', 'points' => 25, 'criteria_type' => 'email_verified', 'criteria_value' => 1],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement
            );
        }
    }
}
