<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 6: identity. Polls (Communications Hub), and the equipped Workshop
 * theme — the catalog itself is config + derived unlocks, so the only thing
 * stored is the choice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clans', function (Blueprint $table) {
            $table->string('equipped_theme', 32)->nullable();
        });

        Schema::create('clan_polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained()->cascadeOnDelete();
            $table->string('question', 200);
            $table->json('options'); // ["...", "..."] — index is the vote
            $table->timestamp('ends_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['clan_id', 'ends_at']);
        });

        Schema::create('clan_poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('option');
            $table->timestamps();

            $table->unique(['clan_poll_id', 'user_id']); // one vote, changeable
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clan_poll_votes');
        Schema::dropIfExists('clan_polls');

        Schema::table('clans', function (Blueprint $table) {
            $table->dropColumn('equipped_theme');
        });
    }
};
