<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Trading post prices, with the timestamp that makes them honest.
 *
 * §13.2 asks for them and adds two conditions this table is shaped around.
 *
 * **"With timestamp and buy/sell price mode visible."** A price is a quote at a
 * moment, not a property of an item. Storing `observed_at` beside it is what
 * lets a page say "as of an hour ago" instead of implying a permanence the
 * trading post does not have.
 *
 * **"Never collapse gold-equivalent and account-bound/time-gated requirements
 * into one misleading cost. Show separate buckets."** The authority on whether
 * something is tradable is the price endpoint itself: 27,997 item ids appear in
 * it out of 74,265. An item absent from it is not free and not expensive — it
 * is in a different bucket, and a planner that quietly counted it as zero would
 * be producing exactly the misleading total this forbids.
 *
 * Both prices are kept. §13.2 wants the mode visible because they answer
 * different questions: the sell price is what you pay to have it now, and the
 * buy price is what you pay to wait. Measured on 30 September 2026, a Glob of
 * Ectoplasm was 1,690 to bid and 1,780 to buy outright — a five per cent spread
 * that a single "price" would have to pick a side of silently.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_item_prices', function (Blueprint $table) {
            // One row per item, overwritten. A price history is a different
            // product and not one this document asks for.
            $table->unsignedBigInteger('item_id')->primary();

            /*
             * Copper, as the API gives it. Converting to gold here would lose
             * precision and move a display decision into the database.
             */
            $table->unsignedBigInteger('buy_unit')->nullable();
            $table->unsignedBigInteger('buy_quantity')->default(0);
            $table->unsignedBigInteger('sell_unit')->nullable();
            $table->unsignedBigInteger('sell_quantity')->default(0);

            /*
             * Quantity matters as much as price for a planner. A sell price of
             * three copper against a quantity of two is not a price anybody can
             * buy four hundred at, and reporting it as one would produce a
             * total nobody can achieve.
             */
            $table->timestamp('observed_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_item_prices');
    }
};
