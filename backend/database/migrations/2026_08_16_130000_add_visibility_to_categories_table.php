<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who is allowed to see a board at all.
 *
 * Everything on the forum has been readable by everybody, which is right for
 * most of it and wrong for the two cases every community eventually needs: a
 * room where members can talk without the whole internet reading, and a room
 * where moderators can discuss the members.
 *
 * Three levels rather than a boolean, because "not public" is two different
 * things and collapsing them means staff notes live in the same room as
 * general chat.
 *
 * Default is public: this column arrives on an existing table full of boards
 * that are public today, and a migration that quietly hides them would be a
 * worse bug than the one it fixes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('categories', 'visibility')) {
            return;
        }

        Schema::table('categories', function (Blueprint $table) {
            $table->string('visibility', 20)->default('public')->after('type');

            // Every board listing filters on it.
            $table->index(['type', 'visibility']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['type', 'visibility']);
            $table->dropColumn('visibility');
        });
    }
};
