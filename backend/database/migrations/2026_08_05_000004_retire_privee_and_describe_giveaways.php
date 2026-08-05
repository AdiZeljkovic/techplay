<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two things at once, both about the giveaway page.
 *
 * Privée goes. It was a second, parallel way to enter a giveaway — its own
 * login, its own entries table, its own leaderboard branch in the controller —
 * and every place that touched giveaways had to ask which world it was in.
 * One giveaway used it and 22 entries lived in it.
 *
 * And the giveaways themselves gain the four things the page wants to filter
 * by and cannot: what platform a prize is for, what kind of prize it is, who
 * may enter, and where from. Plus a target, because a progress bar without a
 * denominator is a decoration — max_entries_per_user is a limit on a person,
 * not a goal for the draw.
 *
 * All nullable. Nothing existing has to be backfilled, and the filters simply
 * offer what has been filled in.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('privee_giveaway_entries');

        Schema::table('giveaways', function (Blueprint $table) {
            if (Schema::hasColumn('giveaways', 'requires_privee_auth')) {
                $table->dropColumn('requires_privee_auth');
            }

            // 'pc' | 'playstation' | 'xbox' | 'nintendo' | 'multi' | null
            $table->string('platform', 20)->nullable();

            // 'hardware' | 'game_key' | 'gift_card' | 'subscription' | 'merch' | 'bundle'
            $table->string('prize_type', 24)->nullable();

            // 'worldwide' | 'eu' | 'ba' | 'na' — free text is a filter that
            // never matches, so this stays a short list the admin picks from.
            $table->string('region', 24)->nullable();

            // 'free' | 'members' | 'tasks' — what it costs to get in.
            $table->string('entry_type', 16)->nullable();

            // What the draw is aiming at, so a progress bar can mean something.
            $table->unsignedInteger('entry_goal')->nullable();

            $table->index(['status', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::table('giveaways', function (Blueprint $table) {
            $table->dropIndex(['status', 'ends_at']);
            $table->dropColumn(['platform', 'prize_type', 'region', 'entry_type', 'entry_goal']);
            $table->boolean('requires_privee_auth')->default(false);
        });

        // The entries themselves are not recoverable here; they were exported
        // before this ran or they are gone.
        Schema::create('privee_giveaway_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('giveaway_id')->constrained()->cascadeOnDelete();
            $table->string('privee_email')->nullable();
            $table->string('privee_display_name')->nullable();
            $table->timestamps();
        });
    }
};
