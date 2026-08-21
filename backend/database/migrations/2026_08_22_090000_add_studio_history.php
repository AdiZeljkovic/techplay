<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What became of a studio.
 *
 * 1,698 of the companies IGDB carries are defunct, 469 were renamed and 374
 * merged into somebody else — 2,541 studios whose pages currently read as
 * though they are still working. A studio that closed in 1995 is a different
 * thing from one shipping games this year, and the page has no way to say so.
 *
 * `parent_id` already exists and has never been filled by anything: the studio
 * page renders "Part of X" and "Studios under X", the API serves both, and the
 * column is null on all 56,911 rows. 1,946 companies name a parent. That is the
 * defect this migration exists beside — the fix is in `igdb:studios`, and these
 * columns are what it gains at the same time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            /* active | defunct | merged | renamed. Null means IGDB does not
               say, which is not the same as active. */
            $table->string('status', 12)->nullable();

            /* When it stopped being itself — closed, merged or renamed. */
            $table->date('changed_at')->nullable();

            /* And what it became, when that is a studio we also hold. */
            $table->foreignId('became_studio_id')->nullable()->constrained('studios')->nullOnDelete();

            /* Headcount, for the 2,963 that have one. A number worth printing
               beside a name nobody recognises. */
            $table->unsignedInteger('employees')->nullable();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropConstrainedForeignId('became_studio_id');
            $table->dropColumn(['status', 'changed_at', 'employees']);
        });
    }
};
