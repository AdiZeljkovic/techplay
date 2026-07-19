<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Provider-specific public stats (e.g. Xbox gamerscore) surfaced on
     * the profile without extra API calls.
     */
    public function up(): void
    {
        Schema::table('connected_accounts', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('visibility');
        });
    }

    public function down(): void
    {
        Schema::table('connected_accounts', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};
