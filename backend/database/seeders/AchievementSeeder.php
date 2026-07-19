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

            // Q&A
            ['name' => 'Problem Solver', 'description' => 'Have 5 of your replies marked as the solution', 'points' => 150, 'criteria_type' => 'solutions_count', 'criteria_value' => 5],

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

            // Support & Patronage
            ['name' => 'TechPlay Patron', 'description' => 'Subscribe to any support tier', 'points' => 500, 'criteria_type' => 'support_tier', 'criteria_value' => 1],
            ['name' => 'Legacy Supporter', 'description' => 'Maintain a subscription for 12 months', 'points' => 1000, 'criteria_type' => 'support_duration', 'criteria_value' => 12],

            // Shop & Collection
            ['name' => 'Collector', 'description' => 'Complete your first order', 'points' => 50, 'criteria_type' => 'orders_count', 'criteria_value' => 1],
            ['name' => 'Big Spender', 'description' => 'Complete 5 orders', 'points' => 250, 'criteria_type' => 'orders_count', 'criteria_value' => 5],

            // Engagement (Comments)
            ['name' => 'First Opinion', 'description' => 'Post your first comment', 'points' => 10, 'criteria_type' => 'comments_count', 'criteria_value' => 1],
            ['name' => 'Critic', 'description' => 'Post 50 comments', 'points' => 100, 'criteria_type' => 'comments_count', 'criteria_value' => 50],
            ['name' => 'Voice of the People', 'description' => 'Receive 50 likes on your comments', 'points' => 200, 'criteria_type' => 'comment_likes_received', 'criteria_value' => 50],

            // ── V3.5 catalog expansion ──────────────────────────────────────
            // Collection depth
            ['name' => 'Shelf Starter', 'description' => 'Add 5 games to your collection', 'points' => 50, 'criteria_type' => 'games_added', 'criteria_value' => 5],
            ['name' => 'Serious Shelf', 'description' => 'Add 100 games to your collection', 'points' => 300, 'criteria_type' => 'games_added', 'criteria_value' => 100],
            ['name' => 'The Vault', 'description' => 'Add 250 games to your collection', 'points' => 500, 'criteria_type' => 'games_added', 'criteria_value' => 250],
            ['name' => 'Museum Curator', 'description' => 'Add 500 games to your collection', 'points' => 1000, 'criteria_type' => 'games_added', 'criteria_value' => 500],

            // Completions
            ['name' => 'First Blood', 'description' => 'Complete your first game', 'points' => 75, 'criteria_type' => 'games_completed', 'criteria_value' => 1],
            ['name' => 'Ten Down', 'description' => 'Complete 10 games', 'points' => 200, 'criteria_type' => 'games_completed', 'criteria_value' => 10],
            ['name' => 'Backlog Slayer', 'description' => 'Complete 25 games', 'points' => 400, 'criteria_type' => 'games_completed', 'criteria_value' => 25],
            ['name' => 'The Finisher', 'description' => 'Complete 100 games', 'points' => 1000, 'criteria_type' => 'games_completed', 'criteria_value' => 100],

            // Playing & wishlist
            ['name' => 'Juggler', 'description' => 'Have 3 games in Playing at once', 'points' => 75, 'criteria_type' => 'games_playing', 'criteria_value' => 3],
            ['name' => 'Dreamer', 'description' => 'Wishlist 10 games', 'points' => 75, 'criteria_type' => 'games_wishlisted', 'criteria_value' => 10],
            ['name' => 'Window Shopper', 'description' => 'Wishlist 50 games', 'points' => 200, 'criteria_type' => 'games_wishlisted', 'criteria_value' => 50],

            // Streaks
            ['name' => 'Warming Up', 'description' => 'Reach a 3-day daily streak', 'points' => 50, 'criteria_type' => 'daily_streak', 'criteria_value' => 3],
            ['name' => 'One Week Strong', 'description' => 'Reach a 7-day daily streak', 'points' => 100, 'criteria_type' => 'daily_streak', 'criteria_value' => 7],
            ['name' => 'Iron Habit', 'description' => 'Reach a 30-day daily streak', 'points' => 400, 'criteria_type' => 'daily_streak', 'criteria_value' => 30],
            ['name' => 'Unbreakable', 'description' => 'Reach a 100-day daily streak', 'points' => 1000, 'criteria_type' => 'daily_streak', 'criteria_value' => 100],

            // Connections
            ['name' => 'Plugged In', 'description' => 'Connect an external gaming account', 'points' => 100, 'criteria_type' => 'connected_accounts', 'criteria_value' => 1],
            ['name' => 'Discord Native', 'description' => 'Link your Discord account', 'points' => 75, 'criteria_type' => 'discord', 'criteria_value' => 1],

            // Forum depth
            ['name' => 'Solution Machine', 'description' => 'Have 25 replies marked as the solution', 'points' => 500, 'criteria_type' => 'solutions_count', 'criteria_value' => 25],
            ['name' => 'Agenda Setter', 'description' => 'Start 50 threads', 'points' => 400, 'criteria_type' => 'threads_count', 'criteria_value' => 50],
            ['name' => 'Essayist', 'description' => 'Post 200 comments', 'points' => 300, 'criteria_type' => 'comments_count', 'criteria_value' => 200],
            ['name' => 'Beloved', 'description' => 'Receive 200 likes on your comments', 'points' => 400, 'criteria_type' => 'comment_likes_received', 'criteria_value' => 200],

            // Reputation depth
            ['name' => 'Local Legend', 'description' => 'Reach 2500 reputation', 'points' => 750, 'criteria_type' => 'reputation', 'criteria_value' => 2500],
            ['name' => 'Hall of Fame', 'description' => 'Reach 5000 reputation', 'points' => 1000, 'criteria_type' => 'reputation', 'criteria_value' => 5000],

            // Social depth
            ['name' => 'Squad Goals', 'description' => 'Have 25 friends', 'points' => 200, 'criteria_type' => 'friends_count', 'criteria_value' => 25],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement
            );
        }
    }
}
