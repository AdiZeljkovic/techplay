<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE threads ADD FULLTEXT fulltext_threads_title_content (title, content)');
        DB::statement('ALTER TABLE posts ADD FULLTEXT fulltext_posts_content (content)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE threads DROP INDEX fulltext_threads_title_content');
        DB::statement('ALTER TABLE posts DROP INDEX fulltext_posts_content');
    }
};
