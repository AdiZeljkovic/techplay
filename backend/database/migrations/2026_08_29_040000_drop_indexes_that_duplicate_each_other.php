<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Four generations of "add performance indexes" left the same index three times.
 *
 * Between 16 and 25 January four separate migrations each added indexes for the
 * forum and the comment system, and none of them checked what the previous one
 * had done. A cleanup on 8 August dropped seven of them — but only on
 * `articles`, and the tables that actually take every user interaction were left
 * alone. Live, `threads` carries twenty-two indexes, `comments` and `posts`
 * eleven each.
 *
 * Every pair below has an identical column list on an identical table, verified
 * against pg_index on production rather than read off the migrations, because
 * two of those January migrations wrapped their creates in try/catch and the
 * file is not proof of what exists.
 *
 * That identity is what makes this safe: the index that stays answers exactly
 * the queries the dropped one did. Where the pair had different usage counts
 * the busier name is the one kept; where both were unused the name Laravel
 * generates is kept, so a future migration cannot quietly recreate it under
 * that name and start the collection over.
 *
 * The bytes are small — the tables are small. The cost was never storage: it is
 * that every insert into `comments` maintained three copies of the same index,
 * and every planner decision had to consider all of them.
 */
return new class extends Migration
{
    // CONCURRENTLY cannot run inside a transaction block.
    public $withinTransaction = false;

    /** Indexes that duplicate one that stays. */
    private const REDUNDANT = [
        // threads.author_id — idx_threads_author_id stays (19,301 scans)
        'idx_threads_author',
        'threads_author_id_index',

        // comments (commentable_type, commentable_id) — idx_comments_commentable stays
        'comments_commentable_type_commentable_id_index',
        'comments_polymorphic_index',

        // comments.user_id — idx_comments_user_id stays (46 scans)
        'idx_comments_user',
        'comments_user_id_index',

        // comments 3-column morph+status — the Laravel-named one stays
        'idx_comments_morph_status',

        // posts.author_id / thread_id / created_at — Laravel names stay
        'idx_posts_author',
        'idx_posts_author_id',
        'idx_posts_thread',
        'idx_posts_thread_id',
        'idx_posts_created_at',

        // threads.created_at — idx_threads_created_at stays (3,832 scans)
        'threads_created_at_index',

        // threads.category_id — idx_threads_category_id stays
        'idx_threads_category',

        // threads.is_pinned — threads_is_pinned_index stays
        'idx_threads_is_pinned',

        // articles.is_featured_in_hero — the Laravel name stays (7,960 scans)
        'idx_articles_featured',

        // categories.parent_id / type — one of each stays
        'idx_categories_parent',
        'categories_type_index',

        // guides author / difficulty / game_id — Laravel names stay
        'idx_guides_author_id',
        'idx_guides_difficulty',
        'guides_game_id_idx',

        // play_sessions (user_id, game_id) — the Laravel name stays (61,207 scans)
        'play_sessions_user_game_index',

        // products.is_active, videos.published_at — Laravel names stay
        'idx_products_is_active',
        'idx_videos_published_at',

        // game_ratings.game_id — game_ratings_game_id_idx stays (76 scans)
        'game_ratings_game_id_index',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (self::REDUNDANT as $index) {
            DB::statement("DROP INDEX CONCURRENTLY IF EXISTS {$index}");
        }
    }

    /**
     * Not reversed.
     *
     * Recreating them would restore the duplication this exists to remove, and
     * every one of them has a living twin — nothing is lost to roll back to.
     */
    public function down(): void
    {
        // Intentionally empty.
    }
};
