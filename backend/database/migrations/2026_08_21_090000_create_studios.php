<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Studios, as their own thing rather than a string on a game.
 *
 * `games.developers` and `games.publishers` are text arrays of names, which is
 * enough to print "Developer: Arkane Studios" and nothing more. It cannot answer
 * what else Arkane made, it spells the same studio three ways across a
 * catalogue, and it gives the reader nowhere to go. This table is what makes a
 * studio a place on the site.
 *
 * The arrays stay. They are what the game page reads today, they carry credits
 * for games we never matched to IGDB, and dropping a column that 144,435 rows
 * rely on to gain one that duplicates it is not a migration, it is an outage.
 *
 * `indexable` is the answer to a measurement rather than a preference: of the
 * 56,911 studios with games in this catalogue, 35,633 have exactly one, and
 * only 19,377 have a logo or a description. Every studio gets a row and a page
 * so the links from game pages always land somewhere; only the ones with
 * something on them go in the sitemap.
 *
 * This also removes `game_companies` and `game_company`. They are the same idea
 * built for MobyGames, retired in the August rebuild along with the columns
 * that fed them: nought rows in either, `moby_company_id` NOT NULL so nothing
 * from IGDB could go in without a migration anyway, and no reader outside the
 * model declaring them. Two company tables where one is dead is how the last
 * three of these ended up in the codebase; `down()` puts them back.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('studios', function (Blueprint $table) {
            $table->id();

            /* Nullable because a studio can be created by hand later; unique
               because one IGDB company is one studio. */
            $table->unsignedBigInteger('igdb_id')->nullable()->unique();

            $table->string('name', 300);
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->string('logo_url', 500)->nullable();

            /* ISO 3166-1 numeric, which is how IGDB gives it. Kept as their
               number rather than a name we would have to translate twice. */
            $table->unsignedSmallInteger('country')->nullable();

            $table->date('founded')->nullable();
            $table->string('website', 500)->nullable();

            $table->foreignId('parent_id')->nullable()->constrained('studios')->nullOnDelete();

            /* Denormalised on purpose: the listing sorts and filters by it over
               56,911 rows, and counting through the pivot for each would be a
               join per row on every page of the index. */
            $table->unsignedInteger('games_count')->default(0);
            $table->unsignedInteger('developed_count')->default(0);
            $table->unsignedInteger('published_count')->default(0);

            $table->boolean('indexable')->default(false);

            $table->timestamps();

            $table->index('games_count');
            $table->index('country');
            $table->index(['indexable', 'games_count']);
        });

        Schema::create('game_studio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('studio_id')->constrained()->cascadeOnDelete();

            /* developer or publisher. The same company is often both, and the
               studio page shows the two lists apart, so the role is part of
               what makes a link unique rather than a property of it. */
            $table->string('role', 20);

            $table->unique(['game_id', 'studio_id', 'role']);
            $table->index(['studio_id', 'role']);
        });

        Schema::dropIfExists('game_company');
        Schema::dropIfExists('game_companies');
    }

    public function down(): void
    {
        Schema::dropIfExists('game_studio');
        Schema::dropIfExists('studios');

        Schema::create('game_companies', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('moby_company_id')->unique();
            $table->string('name', 300);
            $table->string('slug', 300)->unique();
            $table->string('moby_url', 500)->nullable();
            $table->string('role')->default('developer');
            $table->unsignedInteger('games_count')->default(0);
            $table->timestamp('details_crawled_at')->nullable();
            $table->timestamps();

            $table->index('role');
            $table->index('games_count');
        });

        Schema::create('game_company', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_company_id')->constrained('game_companies')->cascadeOnDelete();
            $table->string('role')->default('developer');

            $table->unique(['game_id', 'game_company_id', 'role']);
        });
    }
};
