<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix NULL values in views column - NULL + 1 = NULL in MySQL
        DB::table('articles')->whereNull('views')->update(['views' => 0]);
    }

    public function down(): void
    {
        // No rollback needed
    }
};
