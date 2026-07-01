<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('threads', 'game_id')) {
            Schema::table('threads', function (Blueprint $table) {
                $table->foreignId('game_id')->nullable()->constrained()->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            if (Schema::hasColumn('threads', 'game_id')) {
                $table->dropConstrainedForeignId('game_id');
            }
        });
    }
};
