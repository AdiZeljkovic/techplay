<?php

use App\Services\Gw2\ForgeDataset;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fill `gw2_forge_recipes` from gw2efficiency custom-recipes — the owner's
 * decision of 29 Oct 2026, since nobody can enter two thousand recipes by hand.
 *
 * Where the catalogue has not been read yet (a fresh database, the tests) this
 * does nothing, and `gw2:catalogue` loads it after its first read.
 */
return new class extends Migration
{
    public function up(): void
    {
        app(ForgeDataset::class)->load();
    }

    public function down(): void
    {
        DB::table('gw2_forge_recipes')->where('source_label', ForgeDataset::LABEL)->delete();
    }
};
