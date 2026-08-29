<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Two tables that were created and never used once.
 *
 * `forum_categories` was superseded before it held anything: boards live in
 * `categories` with `type = 'forum'`, which is what Category::visibleTo and the
 * whole forum read. `subscription_plans` belonged to a paid tier that was never
 * built.
 *
 * Both are empty, nothing in app/ names them, no foreign key points at either,
 * and neither belongs to a package — all four checked on production rather than
 * inferred from the migrations, because a table's create migration is not proof
 * of what the code does with it.
 *
 * A third was on this list and is staying: `queue_monitor_failure_groups` looks
 * just as dead from app/, but croustibat/filament-jobs-monitor writes it, and it
 * holds two rows. Dropping it would have broken the jobs monitor at the next
 * failure rather than at the migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('forum_categories');
        Schema::dropIfExists('subscription_plans');
    }

    /**
     * Not reversed.
     *
     * Recreating an empty table nothing reads restores nothing. The original
     * create migrations are still in this directory if either idea comes back.
     */
    public function down(): void
    {
        // Intentionally empty.
    }
};
