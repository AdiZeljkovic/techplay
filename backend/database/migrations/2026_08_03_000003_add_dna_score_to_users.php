<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The DNA score is derived on every read, but the percentile needs to compare
 * it against everyone else's — which is only cheap if the last computed value
 * is sitting in a column. Written back whenever a profile's DNA is built.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('dna_score')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('dna_score');
        });
    }
};
