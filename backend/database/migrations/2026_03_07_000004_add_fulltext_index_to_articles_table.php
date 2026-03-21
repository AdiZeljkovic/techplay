<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE articles ADD FULLTEXT fulltext_articles_title_excerpt (title, excerpt)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE articles DROP INDEX fulltext_articles_title_excerpt');
    }
};
