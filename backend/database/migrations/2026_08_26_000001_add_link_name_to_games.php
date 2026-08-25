<?php

use App\Services\ContentGameLinker;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The normalised name a headline is matched against.
 *
 * `ContentGameLinker` used to hold the whole catalogue in memory: every game
 * whose row looked "notable", reduced to a comparable name, in one PHP array,
 * rebuilt on every save. That was affordable when the catalogue was small. On
 * 26 Aug 2026 it was 332,455 rows of which 304,612 passed the filter, and
 * saving an article died with "Allowed memory size of 134217728 bytes
 * exhausted" — so no author could publish anything.
 *
 * The filter had quietly stopped filtering. Its dominant term was `views > 0`,
 * a fair proxy for notability when the traffic was people; by August the
 * catalogue was being walked by crawlers — 189,000 requests to /games in a
 * single day from Meta's alone — and 303,399 rows had a view. Nearly every
 * row was "notable" because a robot had opened it.
 *
 * Storing the comparable form turns the question around. Instead of scanning
 * 300,000 names for one headline, the handful of phrases inside the headline
 * are looked up on an index. Memory is bounded and the work no longer grows
 * with the catalogue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->string('link_name')->nullable()->after('slug');
            $table->index('link_name', 'games_link_name_idx');
        });

        $linker = app(ContentGameLinker::class);

        // One transaction per chunk rather than one per row. 332,455 rows,
        // each its own commit, is most of a deploy window spent on fsync.
        DB::table('games')->select(['id', 'name'])->orderBy('id')->chunk(2000, function ($rows) use ($linker) {
            DB::transaction(function () use ($rows, $linker) {
                foreach ($rows as $row) {
                    $key = $linker->comparable((string) $row->name);

                    DB::table('games')->where('id', $row->id)->update([
                        'link_name' => $key === '' ? null : $key,
                    ]);
                }
            });
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex('games_link_name_idx');
            $table->dropColumn('link_name');
        });
    }
};
