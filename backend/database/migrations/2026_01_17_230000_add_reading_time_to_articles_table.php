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
        Schema::table('articles', function (Blueprint $table) {
            $table->integer('reading_time')->nullable()->after('content');
        });

        // Backfill existing articles
        $articles = DB::table('articles')->select('id', 'content')->get();

        foreach ($articles as $article) {
            if ($article->content) {
                $wordCount = str_word_count(strip_tags($article->content));
                $readingTime = ceil($wordCount / 200); // 200 words per minute

                DB::table('articles')
                    ->where('id', $article->id)
                    ->update(['reading_time' => $readingTime]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('reading_time');
        });
    }
};
