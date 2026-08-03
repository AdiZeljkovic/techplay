<?php

namespace App\Console\Commands;

use App\Services\ClanMissionService;
use Illuminate\Console\Command;

class SpawnClanMissions extends Command
{
    protected $signature = 'clans:spawn-missions';

    protected $description = 'Spawn the weekly mission board for every clan with a Mission Control (idempotent)';

    public function handle(ClanMissionService $missions): int
    {
        $spawned = $missions->spawnWeekly();

        $this->info("Spawned {$spawned} clan missions.");

        return self::SUCCESS;
    }
}
