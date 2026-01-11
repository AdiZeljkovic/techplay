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
            // altering enum to string can be tricky with Eloquent/Doctrine
            // Using raw SQL is safer for this specific change in MySQL
            DB::statement("ALTER TABLE categories MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'other'");
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
