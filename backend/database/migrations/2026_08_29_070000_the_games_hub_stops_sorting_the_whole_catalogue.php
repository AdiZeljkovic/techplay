<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The games hub sorted 332,455 rows to show twenty-four.
 *
 * Every ordering in GameController::index is prefixed by the same expression —
 * the one that demotes add-ons, compilations and special editions below the
 * game itself. It is a good rule and it belongs there, but as the *leading*
 * sort key it made every ordering unindexable: measured, the default page cost
 * a parallel sequential scan of the whole catalogue and a top-N heapsort,
 * 295 ms and 141,287 buffer reads, to return twenty-four rows.
 *
 * An index on the same expression, followed by the second sort key, answers it
 * from the index: 0.36 ms and 78 buffers. The expression has to be written here
 * exactly as GameController writes it — Postgres matches expression indexes
 * structurally, and one that differs by a cast is one it will not use.
 *
 * Three orderings, not seven, and the choice is measured rather than guessed.
 * Over twelve days of pg_stat_statements the hub ran `-rating` about 670 times,
 * `-popularity` fourteen, `-released` four, and `-views`, `name`, `-name` and
 * `-added` not once. Those four keep the sequential scan they have always had;
 * indexing them would cost write time on every catalogue sync to serve traffic
 * that has not appeared.
 *
 * Worth knowing if that changes: with a covering index present the planner
 * switches to an incremental sort for the *uncovered* orderings, which is
 * slower than the scan it used before — around 500 ms. That is the trade being
 * accepted for the four unused ones, and the fix if any of them starts being
 * used is another line here.
 */
return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block.
    public $withinTransaction = false;

    /**
     * Copied from GameController::index. Must stay identical to it.
     */
    private const DEMOTE = "(genres && ARRAY['Add-on','Compilation','Special edition']::text[])::int";

    /** @var array<string,string> index name => trailing sort keys */
    private const INDEXES = [
        'games_hub_rating' => 'rating DESC NULLS LAST',
        'games_hub_popularity' => 'popularity DESC NULLS LAST, views DESC, id',
        'games_hub_released' => 'released DESC NULLS LAST',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::INDEXES as $name => $keys) {
            DB::statement("CREATE INDEX CONCURRENTLY IF NOT EXISTS {$name}
                ON games ((".self::DEMOTE.') ASC, '.$keys.')');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_keys(self::INDEXES) as $name) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$name}");
        }
    }
};
