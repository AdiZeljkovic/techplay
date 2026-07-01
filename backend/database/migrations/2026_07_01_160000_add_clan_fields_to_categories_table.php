<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'clan_id')) {
                $table->foreignId('clan_id')->nullable()->constrained()->onDelete('cascade');
            }
            if (! Schema::hasColumn('categories', 'is_private')) {
                $table->boolean('is_private')->default(false);
            }
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'clan_id')) {
                $table->dropConstrainedForeignId('clan_id');
            }
            if (Schema::hasColumn('categories', 'is_private')) {
                $table->dropColumn('is_private');
            }
        });
    }
};
