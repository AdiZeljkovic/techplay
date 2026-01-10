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
        // For PostgreSQL, we need to drop the check constraint and create a new one
        // or alter the enum type if it used a native enum (Laravel 'enum' on blueprint usually creates a check constraint on the column for simple drivers or check constraint on string column).

        // Laravel 10+ on Postgres usually creates a check constraint named "categories_type_check".

        // Let's drop the constraint and add a new one with 'forum' included.
        DB::statement("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check");
        DB::statement("ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('news', 'reviews', 'tech', 'other', 'forum'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original
        DB::statement("ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check");
        DB::statement("ALTER TABLE categories ADD CONSTRAINT categories_type_check CHECK (type IN ('news', 'reviews', 'tech', 'other'))");
    }
};
