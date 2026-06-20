<?php

use App\Models\Achievement;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $achievements = [
            // Game Collection milestones
            ['name' => 'Game Hunter', 'description' => 'Add your first game to the collection', 'points' => 25, 'criteria_type' => 'games_added', 'criteria_value' => 1],
            ['name' => 'Growing Library', 'description' => 'Add 10 games to your collection', 'points' => 75, 'criteria_type' => 'games_added', 'criteria_value' => 10],
            ['name' => 'Dedicated Collector', 'description' => 'Add 25 games to your collection', 'points' => 150, 'criteria_type' => 'games_added', 'criteria_value' => 25],
            ['name' => 'Game Hoarder', 'description' => 'Add 100 games to your collection', 'points' => 300, 'criteria_type' => 'games_added', 'criteria_value' => 100],
            ['name' => 'Librarian', 'description' => 'Add 500 games to your collection', 'points' => 500, 'criteria_type' => 'games_added', 'criteria_value' => 500],

            // Completionist milestones
            ['name' => 'Finisher', 'description' => 'Complete your first game', 'points' => 50, 'criteria_type' => 'games_completed', 'criteria_value' => 1],
            ['name' => 'Completionist', 'description' => 'Complete 10 games', 'points' => 200, 'criteria_type' => 'games_completed', 'criteria_value' => 10],
            ['name' => 'Master of Games', 'description' => 'Complete 50 games', 'points' => 750, 'criteria_type' => 'games_completed', 'criteria_value' => 50],

            // Currently playing
            ['name' => 'In the Zone', 'description' => 'Mark your first game as Playing', 'points' => 15, 'criteria_type' => 'games_playing', 'criteria_value' => 1],

            // Wishlist
            ['name' => 'Window Shopper', 'description' => 'Wishlist 5 games', 'points' => 20, 'criteria_type' => 'games_wishlisted', 'criteria_value' => 5],

            // Platform linking
            ['name' => 'Platform Pioneer', 'description' => 'Connect your first gaming platform account', 'points' => 100, 'criteria_type' => 'connected_accounts', 'criteria_value' => 1],
            ['name' => 'Cross-Platform Gamer', 'description' => 'Connect 3 gaming platform accounts', 'points' => 250, 'criteria_type' => 'connected_accounts', 'criteria_value' => 3],

            // Daily streak
            ['name' => 'Consistent', 'description' => 'Maintain a 7-day login streak', 'points' => 100, 'criteria_type' => 'daily_streak', 'criteria_value' => 7],
            ['name' => 'Dedicated', 'description' => 'Maintain a 30-day login streak', 'points' => 300, 'criteria_type' => 'daily_streak', 'criteria_value' => 30],
        ];

        foreach ($achievements as $achievement) {
            Achievement::updateOrCreate(
                ['name' => $achievement['name']],
                $achievement
            );
        }
    }

    public function down(): void
    {
        $names = [
            'Game Hunter', 'Growing Library', 'Dedicated Collector', 'Game Hoarder', 'Librarian',
            'Finisher', 'Completionist', 'Master of Games',
            'In the Zone', 'Window Shopper',
            'Platform Pioneer', 'Cross-Platform Gamer',
            'Consistent', 'Dedicated',
        ];

        Achievement::whereIn('name', $names)->delete();
    }
};
