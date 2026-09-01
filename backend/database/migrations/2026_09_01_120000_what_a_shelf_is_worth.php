<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One price per game, shared by everyone who owns it.
 *
 * Not per shelf: a thousand members owning Hades is one price, not a thousand
 * rows. Only games somebody actually has are ever priced — the catalogue is
 * 332,455 games and the shelves hold 1,017 of them, which is the difference
 * between a job that cannot run and a job that takes nine calls.
 *
 * `full_cents` is the figure the shelf shows. Steam's `initial` is the price
 * before any sale, so a library's worth does not move because four of its games
 * happen to be discounted this week. `final_cents` is kept beside it so the
 * page can say "$41 of this is on sale today" without asking again.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->unique()->constrained()->cascadeOnDelete();

            /*
             * What we know, said out loud.
             *
             * `priced` is a number we fetched. `free` is a game the store lists
             * at nothing — free-to-play, and a real answer. `unavailable` is a
             * game the store no longer sells or never did, which is not the
             * same as free and must not be added up as zero without saying so:
             * GTA V returns nothing on Steam today, and a total that quietly
             * counts it as $0 is a total that lies.
             */
            $table->enum('status', ['priced', 'free', 'unavailable'])->default('unavailable')->index();

            $table->char('currency', 3)->default('USD');
            /** Before any discount — the number the shelf totals. */
            $table->unsignedInteger('full_cents')->nullable();
            /** What it costs right now, for "on sale today". */
            $table->unsignedInteger('final_cents')->nullable();
            $table->unsignedTinyInteger('discount_percent')->default(0);

            $table->string('source', 16)->default('steam');
            $table->timestamp('fetched_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_prices');
    }
};
