<?php

use App\Services\Gw2\WikiPages;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wiki pages for raids, dungeons and world bosses, one checked row each.
 *
 * The API names these only by slug — Dhuum's encounter is `voice_in_the_void` —
 * and a page title made from a slug can be exactly some other page. So each
 * one becomes a `gw2_sources` row with a suggested URL and no `checked_at`,
 * and the reader gets a link only once an editor has opened the page and
 * confirmed it. `subject` is what ties the row to the thing:
 * `raid_encounter:vale_guardian`, `dungeon:ascalonian_catacombs`.
 *
 * The rows are created here as well as nightly, so a deploy does not leave the
 * admin list empty until the next game build.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_sources', function (Blueprint $table) {
            $table->string('subject', 120)->nullable()->unique();
        });

        app(WikiPages::class)->ensure();
    }

    public function down(): void
    {
        Schema::table('gw2_sources', function (Blueprint $table) {
            $table->dropUnique(['subject']);
            $table->dropColumn('subject');
        });
    }
};
