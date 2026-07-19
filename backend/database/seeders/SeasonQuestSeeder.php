<?php

namespace Database\Seeders;

use App\Models\Quest;
use App\Models\Season;
use Illuminate\Database\Seeder;

/**
 * Attaches a set of seasonal quests to the ACTIVE season. Idempotent —
 * keyed by name+season. Run after activating a new season.
 */
class SeasonQuestSeeder extends Seeder
{
    public function run(): void
    {
        $season = Season::active();

        if (! $season) {
            $this->command?->warn('No active season — nothing seeded.');

            return;
        }

        $quests = [
            [
                'name' => 'Complete 3 games this season',
                'description' => 'Finish 3 games from your collection before the season ends.',
                'type' => 'permanent',
                'criteria_type' => 'game_completed',
                'criteria_value' => 3,
                'xp_reward' => 100,
                'bounty_reward' => 200,
            ],
            [
                'name' => 'Season collector',
                'description' => 'Add 10 games to your collection this season.',
                'type' => 'permanent',
                'criteria_type' => 'game_added',
                'criteria_value' => 10,
                'xp_reward' => 50,
                'bounty_reward' => 100,
            ],
            [
                'name' => 'Season contributor',
                'description' => 'Post 15 forum replies this season.',
                'type' => 'permanent',
                'criteria_type' => 'comment_posted',
                'criteria_value' => 15,
                'xp_reward' => 75,
                'bounty_reward' => 150,
            ],
        ];

        foreach ($quests as $quest) {
            Quest::updateOrCreate(
                ['name' => $quest['name'], 'season_id' => $season->id],
                array_merge($quest, [
                    'season_id' => $season->id,
                    'is_active' => true,
                    'expires_at' => $season->end_date,
                ]),
            );
        }

        $this->command?->info('Seeded '.count($quests)." seasonal quests for '{$season->name}'.");
    }
}
