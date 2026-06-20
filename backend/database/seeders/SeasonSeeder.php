<?php

namespace Database\Seeders;

use App\Models\Season;
use Illuminate\Database\Seeder;

class SeasonSeeder extends Seeder
{
    public function run(): void
    {
        Season::updateOrCreate(
            ['slug' => 'summer-2026'],
            [
                'name' => 'Summer of Gaming 2026',
                'description' => 'The hottest gaming season yet. Level up your library, complete quests, and earn extra bounty all summer long.',
                'start_date' => '2026-06-20',
                'end_date' => '2026-09-21',
                'is_active' => true,
                'xp_multiplier' => 1.25,
                'bounty_multiplier' => 1.25,
            ]
        );
    }
}
