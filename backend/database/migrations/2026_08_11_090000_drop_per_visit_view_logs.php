<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Removes the per-visit view logs.
 *
 * `article_views`, `guide_views` and `review_views` each held one row per
 * reading: article id, IP address, browser fingerprint, timestamp. None of
 * them ever held anything — the route that wrote them, POST /articles/{slug}/view,
 * was never called by the frontend, and their five indexes showed zero scans
 * across the nine days the database had been counting.
 *
 * They are not being replaced, because nothing needs replacing. Google
 * Analytics already answers what a per-visit log would: which article, from
 * where, for how long. And the aggregate counter stays — `articles.views`,
 * incremented in Redis on render and settled every five minutes — because it
 * survives ad blockers, which GA does not, and because the product reads it:
 * view counts on cards, and the ordering behind "trending".
 *
 * Dropping them also closes something latent. A route that stores an IP
 * address against a reading is personal data under GDPR; it sat one frontend
 * call away from switching itself on, and the privacy policy described no such
 * collection.
 *
 * No down(). Recreating three empty tables would restore nothing.
 */
return new class extends Migration
{
    private const TABLES = ['article_views', 'guide_views', 'review_views'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $rows = DB::table($table)->count();

            if ($rows > 0) {
                // Never true on any known environment, but a silent drop of
                // rows nobody expected is the one outcome worth shouting about.
                echo "  {$table}: brisem {$rows} redova.".PHP_EOL;
            }

            Schema::dropIfExists($table);
        }
    }
};
