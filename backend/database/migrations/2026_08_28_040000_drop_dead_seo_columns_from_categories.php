<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Five columns on `categories` that no page has ever read.
 *
 * A category page takes its title, description, canonical and no-index switch
 * from the `page_seo` row for its path — /news/gaming, /reviews/indie-gems,
 * /forum/consoles — which is the table every other page on the site uses. These
 * five were a second, parallel place to write the same four things, wired to
 * nothing: no controller selected them, no resource serialised them, no route
 * rendered them.
 *
 * What reached them shows nobody ever looked: CategorySeoSeeder filled 30 of
 * the 31 rows from a template, and because it appended the section word to a
 * name that already contained it, the category called "News" was described as
 * "News News & Updates" and "Community" as "Community Community Forum". One row
 * was left blank. That copy sat in the admin for months looking like content.
 *
 * The admin's SEO tab now reads and writes the `page_seo` row directly, so the
 * form still stands where an editor expects it and there is one record behind
 * it. These columns have nothing left to do.
 *
 * The values are exported to storage/app/backups/ before this runs — see the
 * deploy notes. `down()` puts the columns back empty; it cannot put back what
 * was in them, and what was in them was the template above.
 */
return new class extends Migration
{
    private const COLUMNS = ['seo_title', 'seo_description', 'focus_keyword', 'canonical_url', 'is_noindex'];

    public function up(): void
    {
        $present = array_values(array_filter(
            self::COLUMNS,
            fn (string $column) => Schema::hasColumn('categories', $column),
        ));

        if ($present === []) {
            return;
        }

        Schema::table('categories', function (Blueprint $table) use ($present) {
            $table->dropColumn($present);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            if (! Schema::hasColumn('categories', 'seo_title')) {
                $table->string('seo_title')->nullable();
            }
            if (! Schema::hasColumn('categories', 'seo_description')) {
                $table->text('seo_description')->nullable();
            }
            if (! Schema::hasColumn('categories', 'focus_keyword')) {
                $table->string('focus_keyword')->nullable();
            }
            if (! Schema::hasColumn('categories', 'canonical_url')) {
                $table->string('canonical_url')->nullable();
            }
            if (! Schema::hasColumn('categories', 'is_noindex')) {
                $table->boolean('is_noindex')->default(false);
            }
        });
    }
};
