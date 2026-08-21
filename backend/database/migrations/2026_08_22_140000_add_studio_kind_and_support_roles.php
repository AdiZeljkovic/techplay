<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What kind of company it is, and the credits that are not authorship.
 *
 * `kind` comes from IGDB's `company_type_histories`, which despite the name
 * carries no dates — just a company and a type. Five of them: Main Company
 * (5,011), Solo Dev (1,496), Subsidiary (173), Division (57), Holding Company
 * (7). "Solo Dev" is the one a reader feels: a game made by one person is a
 * different thing from one made by four hundred, and nothing on the page says
 * so today.
 *
 * The two counts are for the credits `igdb:studios` has been deliberately
 * dropping. Porting and supporting are real work and not authorship — Virtuos
 * did not make the game, it brought it to the Switch — so they get their own
 * columns and their own shelf rather than being folded into `developed`. 3,499
 * companies hold one; 2,410 of those hold nothing else and have had no studio
 * row at all.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->string('kind', 24)->nullable();
            $table->unsignedInteger('ported_count')->default(0);
            $table->unsignedInteger('supported_count')->default(0);

            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropIndex(['kind']);
            $table->dropColumn(['kind', 'ported_count', 'supported_count']);
        });
    }
};
