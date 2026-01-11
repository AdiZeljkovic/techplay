<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change 'type' column from enum to string to support 'forum' and future types
        Schema::table('categories', function (Blueprint $table) {
            if (DB::getDriverName() === 'pgsql') {
                // Postgres creates a check constraint for enums, usually named {table}_{column}_check
                DB::statement("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check");
                DB::statement("ALTER TABLE categories ALTER COLUMN type TYPE VARCHAR(50)");
                DB::statement("ALTER TABLE categories ALTER COLUMN type SET DEFAULT 'other'");
            } else {
                // MySQL/MariaDB
                DB::statement("ALTER TABLE categories MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'other'");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Revert back to enum if needed (optional, but good practice)
            // Note: Data not in the enum list might be truncated or cause error
            // We'll skip reverting to strict enum to avoid data loss of 'forum' types
        });
    }
};
