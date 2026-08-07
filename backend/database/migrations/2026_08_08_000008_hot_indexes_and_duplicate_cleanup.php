<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The scale pass: indexes on the foreign keys the chronicle and the
 * content spine actually hammer — harmless at 55 users, decisive at
 * 100,000 — and the burial of articles' five literal duplicate indexes,
 * each of which taxed every article write for nothing.
 *
 * Hot paths only. Empty clan tables can earn their indexes when they
 * earn their rows.
 */
return new class extends Migration
{
    private const CREATE = [
        'articles_game_id_index' => 'articles (game_id)',
        'articles_author_id_index' => 'articles (author_id)',
        'article_reads_user_article_index' => 'article_reads (user_id, article_id)',
        'article_reads_article_id_index' => 'article_reads (article_id)',
        'article_bookmarks_user_id_index' => 'article_bookmarks (user_id)',
        'article_bookmarks_article_id_index' => 'article_bookmarks (article_id)',
        'game_ratings_game_id_index' => 'game_ratings (game_id)',
        'game_ratings_user_id_index' => 'game_ratings (user_id)',
        'play_sessions_user_game_index' => 'play_sessions (user_id, game_id)',
        'bounty_transactions_user_id_index' => 'bounty_transactions (user_id)',
        'comments_user_id_index' => 'comments (user_id)',
        'user_achievements_user_id_index' => 'user_achievements (user_id)',
        'quest_progress_user_id_index' => 'quest_progress (user_id)',
        'friendships_receiver_id_index' => 'friendships (receiver_id)',
        'guides_author_id_index' => 'guides (author_id)',
    ];

    private const DROP = [
        'idx_articles_author',        // duplicate of idx_articles_author_id (both die; the new named one takes over)
        'idx_articles_author_id',
        'idx_articles_status',        // duplicate of articles_status_index
        'articles_status_published_index',      // triplet — one survives
        'idx_articles_status_published',
        'idx_articles_published_at',  // duplicate of articles_published_at_index
        'idx_articles_category',      // duplicate of idx_articles_category_id
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return; // production concern; the test database needs no scale pass
        }

        foreach (self::DROP as $index) {
            DB::statement("DROP INDEX IF EXISTS {$index}");
        }

        foreach (self::CREATE as $name => $definition) {
            DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$definition}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_keys(self::CREATE) as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }
    }
};
