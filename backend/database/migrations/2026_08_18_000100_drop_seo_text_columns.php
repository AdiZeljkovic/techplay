<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop `seo_text` from `page_seo` and `categories`.
 *
 * These held the long descriptive blocks meant to sit at the bottom of a page —
 * forty-four of them on `page_seo`, ninety thousand characters, plus four small
 * ones on categories. Not one ever reached a reader: the only function that
 * read the column, `getPageSeoText()`, was exported from `lib/seo.ts` and never
 * called by any file.
 *
 * Removed on the owner's call. Text appended below the content to carry
 * keywords is a tactic search engines stopped rewarding years ago, and it would
 * have cost the pages more than it earned once it started rendering.
 *
 * **The writing is not gone.** Every row was exported before this ran, to
 * `storage/app/backups/seo-text-2026-08-18.json`, with a copy at
 * `/root/seo-text-2026-08-18.json` on the server. `down()` recreates the
 * columns but cannot recreate the content — that has to come from the export.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('page_seo', 'seo_text')) {
            Schema::table('page_seo', function (Blueprint $table) {
                $table->dropColumn('seo_text');
            });
        }

        if (Schema::hasColumn('categories', 'seo_text')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('seo_text');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('page_seo', 'seo_text')) {
            Schema::table('page_seo', function (Blueprint $table) {
                $table->longText('seo_text')->nullable();
            });
        }

        if (! Schema::hasColumn('categories', 'seo_text')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->longText('seo_text')->nullable();
            });
        }
    }
};
