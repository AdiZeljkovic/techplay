<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * XP for a comment now follows the comment becoming visible, not the comment
 * being written — so this records whether it has already been paid.
 *
 * Before: XP was awarded the moment a comment was saved, whatever its status.
 * A brand-new account is on probation and its first three comments are held for
 * approval; a comment with two or more links is held as suspected spam. Both
 * still earned, so writing spam that nobody would ever see paid the same as
 * writing something people read.
 *
 * A timestamp rather than a boolean, and backfilled for everything already
 * approved so old comments are not paid a second time when a moderator next
 * touches them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->timestamp('xp_awarded_at')->nullable()->after('status');
        });

        DB::table('comments')
            ->where('status', 'approved')
            ->update(['xp_awarded_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('xp_awarded_at');
        });
    }
};
