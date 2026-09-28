<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which story steps a character has completed.
 *
 * Per character, because that is the only way the game reports it, and that
 * single fact is what §16 builds its whole caution on:
 *
 * > *"Display 'detected story progress' rather than 'account story
 * > completion'. Allow one-click manual correction: 'I already completed this
 * > on another character.'"*
 *
 * A player with six characters has done the personal story six times and the
 * expansions once, on whichever one they felt like. Rolling those into an
 * account figure would produce a number that is wrong for every character and
 * right for none — and the document also notes the quest endpoint can lag the
 * story endpoints, so even the per-character reading is medium confidence.
 *
 * `gw2_confirmations` already exists for the correction half.
 *
 * Measured 30 September 2026: `characters?ids=all` returns eighteen fields and
 * `quests` is not among them, so this costs one request per character on a full
 * read. The test account's character had 172 completed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gw2_characters', function (Blueprint $table) {
            $table->jsonb('quests')->nullable()->after('crafting');
        });
    }

    public function down(): void
    {
        Schema::table('gw2_characters', function (Blueprint $table) {
            $table->dropColumn('quests');
        });
    }
};
