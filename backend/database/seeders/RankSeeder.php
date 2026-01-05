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
            ['name' => 'AFK', 'min_reputation' => 0, 'color' => '#808080'],
            ['name' => 'Respawning', 'min_reputation' => 50, 'color' => '#9e9e9e'],
            ['name' => 'NPC', 'min_reputation' => 150, 'color' => '#b0bec5'],
            ['name' => 'Loot Goblin', 'min_reputation' => 300, 'color' => '#81c784'],
            ['name' => 'Side Kick', 'min_reputation' => 500, 'color' => '#66bb6a'],
            ['name' => 'Main Character', 'min_reputation' => 800, 'color' => '#4caf50'],
            ['name' => 'Level 10 Crook', 'min_reputation' => 1200, 'color' => '#4db6ac'],
            ['name' => 'Speedrunner', 'min_reputation' => 2000, 'color' => '#26a69a'],
            ['name' => 'Achievement Hunter', 'min_reputation' => 3000, 'color' => '#009688'],
            ['name' => 'Miniboss', 'min_reputation' => 4500, 'color' => '#00bcd4'],
            ['name' => 'Dungeon Master', 'min_reputation' => 6000, 'color' => '#00acc1'],
            ['name' => 'Boss', 'min_reputation' => 8000, 'color' => '#039be5'],
            ['name' => 'Final Boss', 'min_reputation' => 12000, 'color' => '#0288d1'],
            ['name' => 'Radiant', 'min_reputation' => 16000, 'color' => '#1e88e5'],
            ['name' => 'Global Elite', 'min_reputation' => 22000, 'color' => '#1565c0'],
            ['name' => 'Grandmaster', 'min_reputation' => 30000, 'color' => '#d32f2f'],
            ['name' => 'Challenger', 'min_reputation' => 40000, 'color' => '#c62828'],
            ['name' => 'Legend', 'min_reputation' => 55000, 'color' => '#b71c1c'],
            ['name' => 'Immortal', 'min_reputation' => 75000, 'color' => '#ffeb3b'], // Gold/Yellow
            ['name' => 'God Mode', 'min_reputation' => 100000, 'color' => '#ffd700'], // Gold
        ];

        foreach ($ranks as $rank) {
            Rank::updateOrCreate(['name' => $rank['name']], $rank);
        }
    }
}
