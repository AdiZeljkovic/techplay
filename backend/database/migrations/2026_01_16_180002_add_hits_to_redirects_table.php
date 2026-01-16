<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('redirects', function (Blueprint $table) {
            if (!Schema::hasColumn('redirects', 'hits')) {
                $table->unsignedBigInteger('hits')->default(0)->after('status_code');
            }
            if (!Schema::hasColumn('redirects', 'note')) {
                $table->string('note', 255)->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('redirects', function (Blueprint $table) {
            $table->dropColumn(['hits', 'note']);
        });
    }
};
