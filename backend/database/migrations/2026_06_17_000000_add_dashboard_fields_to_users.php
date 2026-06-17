<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'location')) {
                $table->string('location')->nullable()->after('bio');
            }
            if (! Schema::hasColumn('users', 'tagline')) {
                $table->string('tagline', 120)->nullable()->after('location');
            }
            if (! Schema::hasColumn('users', 'playstyle_tags')) {
                $table->json('playstyle_tags')->nullable()->after('tagline');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['location', 'tagline', 'playstyle_tags']);
        });
    }
};
