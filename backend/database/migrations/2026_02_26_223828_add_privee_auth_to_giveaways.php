<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('giveaways', function (Blueprint $table) {
            $table->boolean('requires_privee_auth')->default(false)->after('max_entries_per_user');
        });
    }

    public function down(): void
    {
        Schema::table('giveaways', function (Blueprint $table) {
            $table->dropColumn('requires_privee_auth');
        });
    }
};
