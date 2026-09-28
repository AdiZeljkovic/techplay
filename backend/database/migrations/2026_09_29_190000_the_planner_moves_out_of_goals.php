<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `/gw2/goals` was the crafting planner. Now "goals" means the goals a player
 * pins, and `/gw2/goals/{slug}` is one of the nine public guide families.
 *
 * Two different meanings under one path is the sort of thing that reads fine
 * for a week and then costs an afternoon. The planner moves to `/gw2/planner`,
 * which is what it actually is.
 *
 * A row rather than a rule in next.config.ts because that is how this site does
 * redirects — the config reads them from here, and putting this one somewhere
 * else would mean two places to look.
 *
 * The path was hours old and nothing outside this repository had linked to it;
 * the redirect exists because a URL that once answered should keep answering,
 * not because anybody is expected to follow it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('redirects')) {
            return;
        }

        DB::table('redirects')->updateOrInsert(
            ['source_url' => '/gw2/goals'],
            [
                'target_url' => '/gw2/planner',
                'status_code' => 301,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        if (Schema::hasTable('redirects')) {
            DB::table('redirects')->where('source_url', '/gw2/goals')->delete();
        }
    }
};
