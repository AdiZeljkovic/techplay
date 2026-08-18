<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Eight columns on `articles` that no article has ever used.
 *
 * Counted across all 625 rows before anything here was written:
 *
 * | column               | filled | who read it |
 * |----------------------|--------|-------------|
 * | `seo_title`          | 0      | a fallback behind `meta_title` on three pages |
 * | `seo_description`    | 0      | same |
 * | `content_updated_at` | 0      | nothing, anywhere |
 * | `translation_of_id`  | 0      | `HreflangService`, which nothing calls |
 * | `review_rating`      | 0      | `SchemaService`, unreachable — see below |
 * | `review_pros`        | 0      | same |
 * | `review_cons`        | 0      | same |
 * | `is_featured`        | 625 ×  `false` | shipped in the API payload, read by nobody |
 *
 * Two of these were worse than merely unused.
 *
 * `seo_title` / `seo_description` are a **second** pair of SEO fields next to
 * `meta_title` / `meta_description`. No admin screen ever offered them, so the
 * fallback chain `meta_title || seo_title || title` had a middle term that could
 * never be anything but null — an invitation for the next person to wire the
 * wrong one. `guides` and `categories` keep theirs: on those tables `seo_*` is
 * the real pair and it is now wired end to end.
 *
 * `review_rating` / `review_pros` / `review_cons` were superseded by
 * `review_score` (38 of 38 reviews) and `review_data`. The service reading them
 * could not have worked in any case; that is fixed in the same commit.
 *
 * `down()` puts all eight back, empty, which is exactly the state they were in.
 */
return new class extends Migration
{
    public function up(): void
    {
        /*
         * `translation_of_id` was created with `foreignId()->constrained()`, so
         * it carries a foreign key. On PostgreSQL dropping the column takes the
         * constraint with it; SQLite rebuilds the table and keeps the old key
         * definition, which then names a column that is no longer there — so the
         * test database refuses the migration that production accepts.
         *
         * Same for its index. Dropping both first, in their own statement,
         * works on either driver.
         */
        if (Schema::hasColumn('articles', 'translation_of_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropForeign(['translation_of_id']);
                $table->dropIndex('articles_translation_of_id_index');
            });
        }

        if (Schema::hasColumn('articles', 'is_featured')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropIndex('articles_is_featured_index');
            });
        }

        Schema::table('articles', function (Blueprint $table) {
            foreach ([
                'seo_title',
                'seo_description',
                'content_updated_at',
                'translation_of_id',
                'review_rating',
                'review_pros',
                'review_cons',
                'is_featured',
            ] as $column) {
                if (Schema::hasColumn('articles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->timestamp('content_updated_at')->nullable();
            $table->foreignId('translation_of_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->index('translation_of_id', 'articles_translation_of_id_index');
            $table->decimal('review_rating', 3, 1)->nullable();
            $table->jsonb('review_pros')->nullable();
            $table->jsonb('review_cons')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->index('is_featured', 'articles_is_featured_index');
        });
    }
};
