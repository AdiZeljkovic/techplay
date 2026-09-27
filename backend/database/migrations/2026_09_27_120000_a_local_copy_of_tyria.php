<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Guild Wars 2 catalogue, kept here rather than fetched.
 *
 * Measured against the live API on 27 September 2026: items 74,265,
 * recipes 13,198, achievements 8,339, and about 1,500 rows across masteries,
 * specializations, itemstats, currencies, titles, quests, professions and
 * mount types. Roughly 97,300 rows, which at the 200-ids-per-request the API
 * allows is about 492 calls.
 *
 * That number is the whole reason these tables exist. The catalogue is the
 * same for every player, so fetching it per account would spend the shared
 * rate-limit budget on data nobody's account changes. Pulled once per game
 * build and served from here, it costs one burst a patch.
 *
 * `build_id` on every row is how staleness is visible. /v2/build answers with
 * a single integer — 207318 on the day this was written — so noticing that the
 * game moved costs one request, and only the endpoints that actually changed
 * need re-reading.
 *
 * The shape is deliberately shallow: an id, the few columns worth querying or
 * sorting by, and the rest of the object in jsonb. ArenaNet adds fields to
 * these structures between releases, and a column per field would mean a
 * migration every time they do.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * What we have read, and how far behind it is.
         *
         * One row per catalogue endpoint rather than one global marker: items
         * take four hundred requests and currencies take one, so they do not
         * belong on the same refresh schedule, and a failure partway through
         * must not make the whole catalogue look refreshed.
         */
        Schema::create('gw2_catalog_meta', function (Blueprint $table) {
            $table->string('endpoint', 64)->primary();
            $table->unsignedBigInteger('build_id')->nullable();
            $table->unsignedInteger('row_count')->default(0);
            $table->timestamp('refreshed_at')->nullable();
            $table->timestamp('attempted_at')->nullable();
            $table->text('last_error')->nullable();
        });

        Schema::create('gw2_items', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->string('type', 32)->nullable();
            $table->string('rarity', 24)->nullable();
            $table->unsignedSmallInteger('level')->default(0);
            $table->string('icon')->nullable();
            // Infusions, stat choices, slots and the rest of the shape, which
            // differs per item type and gains fields between releases.
            $table->jsonb('details')->nullable();
            $table->jsonb('flags')->nullable();
            $table->unsignedBigInteger('build_id')->nullable();

            // The gear and Agony Resistance modules read by rarity and type
            // across the whole catalogue; nothing else here is queried in bulk.
            $table->index(['type', 'rarity']);
        });

        Schema::create('gw2_achievements', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->text('requirement')->nullable();
            $table->string('type', 32)->nullable();
            $table->jsonb('tiers')->nullable();
            $table->jsonb('rewards')->nullable();
            $table->jsonb('flags')->nullable();
            $table->jsonb('bits')->nullable();
            $table->unsignedBigInteger('build_id')->nullable();

            /*
             * Not every achievement belongs in an "easy wins" list. Repeatable
             * dailies, hidden entries and historical ones would each read as a
             * near-complete opportunity while being nothing of the sort, so the
             * curation lives beside the row rather than in a hardcoded list
             * somewhere in the engine.
             */
            $table->boolean('advisor_eligible')->default(false);
            $table->string('effort_band', 16)->nullable();
            $table->timestamp('reviewed_at')->nullable();

            $table->index('advisor_eligible');
        });

        Schema::create('gw2_recipes', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->unsignedBigInteger('output_item_id')->index();
            $table->unsignedSmallInteger('output_item_count')->default(1);
            $table->jsonb('ingredients')->nullable();
            $table->jsonb('disciplines')->nullable();
            $table->unsignedSmallInteger('min_rating')->default(0);
            $table->jsonb('flags')->nullable();
            $table->unsignedBigInteger('build_id')->nullable();
        });

        Schema::create('gw2_masteries', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->primary();
            $table->string('name');
            $table->string('region', 32)->nullable()->index();
            $table->text('requirement')->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->jsonb('levels')->nullable();
            $table->unsignedBigInteger('build_id')->nullable();
        });

        /*
         * One table for the small reference lists.
         *
         * Item stats, currencies, professions, specializations, titles, mount
         * types and quests are between nine and six hundred rows each. Seven
         * more tables with an id, a name and a json blob would be seven more
         * models to keep in step for no query we intend to write.
         */
        Schema::create('gw2_reference', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 32);
            $table->unsignedBigInteger('ref_id');
            $table->string('name')->nullable();
            $table->jsonb('payload')->nullable();
            $table->unsignedBigInteger('build_id')->nullable();

            $table->unique(['kind', 'ref_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_reference');
        Schema::dropIfExists('gw2_masteries');
        Schema::dropIfExists('gw2_recipes');
        Schema::dropIfExists('gw2_achievements');
        Schema::dropIfExists('gw2_items');
        Schema::dropIfExists('gw2_catalog_meta');
    }
};
