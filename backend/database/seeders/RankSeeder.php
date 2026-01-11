<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rank;

class RankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ranks = [
            // Tier 1: Casual / Starter (0 - 900 XP)
            ['name' => 'Noob', 'min_xp' => 0, 'color' => '#808080'],
            ['name' => 'Newbie', 'min_xp' => 100, 'color' => '#909090'],
            ['name' => 'Rookie', 'min_xp' => 300, 'color' => '#a0a0a0'],
            ['name' => 'Bronze', 'min_xp' => 600, 'color' => '#cd7f32'],

            // Tier 2: Learner (1000 - 4000 XP)
            ['name' => 'Silver', 'min_xp' => 1000, 'color' => '#c0c0c0'],
            ['name' => 'Gold', 'min_xp' => 2000, 'color' => '#ffd700'],
            ['name' => 'Platinum', 'min_xp' => 3500, 'color' => '#e5e4e2'],
            ['name' => 'Diamond', 'min_xp' => 5000, 'color' => '#b9f2ff'],

            // Tier 3: Skilled (7000 - 15000 XP)
            ['name' => 'Master', 'min_xp' => 7500, 'color' => '#9c27b0'],
            ['name' => 'Grandmaster', 'min_xp' => 10000, 'color' => '#d500f9'],
            ['name' => 'Challenger', 'min_xp' => 15000, 'color' => '#ff1744'],
            ['name' => 'Elite', 'min_xp' => 20000, 'color' => '#ff5252'],

            // Tier 4: Pro (25000 - 60000 XP)
            ['name' => 'Veteran', 'min_xp' => 30000, 'color' => '#ff6d00'],
            ['name' => 'Legendary', 'min_xp' => 45000, 'color' => '#ff9100'],
            ['name' => 'Mythic', 'min_xp' => 60000, 'color' => '#ffcc00'],
            ['name' => 'Immortal', 'min_xp' => 80000, 'color' => '#ffe57f'],

            // Tier 5: God Tier (100k+ XP)
            ['name' => 'Radiant', 'min_xp' => 100000, 'color' => '#00e5ff'],
            ['name' => 'Global Elite', 'min_xp' => 150000, 'color' => '#2979ff'],
            ['name' => 'Ascendant', 'min_xp' => 250000, 'color' => '#3d5afe'],
            ['name' => 'God of Gaming', 'min_xp' => 500000, 'color' => '#651fff'], // Ultimate Rank
        ];

        foreach ($ranks as $rank) {
            Rank::updateOrCreate(['name' => $rank['name']], $rank);
        }
    }
}
