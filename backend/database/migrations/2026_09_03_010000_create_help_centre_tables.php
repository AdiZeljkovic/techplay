<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The help centre's two tables.
 *
 * Shaped after `guides`, because that is the section this most resembles: its
 * own model rather than an Article, a body of prose, a status, and SEO fields.
 * Where it differs from guides, it differs on purpose.
 *
 * Not copied from `guides`, and why:
 *
 *   difficulty            an answer has no skill level
 *   game_id               nothing here is about a game. Running ContentGameLinker
 *                         over these titles would file "Connect your Steam
 *                         account" under a game called Steam
 *   author_id             help copy is institutional. A byline invites "ask
 *                         Adi", which is the support burden this exists to remove
 *   steps                 the JSON repeater. Help bodies are prose with headings
 *   featured_image_url    twelve empty image cells in the admin and a share card
 *                         nobody looks at. Screenshots ride in through the editor
 *   canonical_url         help content is never syndicated
 *
 * `focus_keyword` is kept for one concrete reason: the SEO scoring in
 * Filament adds points for it unconditionally, so without the column every help
 * article would sit permanently below full marks — which is how a badge becomes
 * noise the desk learns to skip.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('help_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');

            // One line under the heading on the topic page, and the fallback
            // meta description when nobody has written a better one.
            $table->string('description', 500)->nullable();

            // Heroicon name. The index is a card grid and a topic without a
            // mark on it reads as a list item rather than a place to go.
            $table->string('icon')->nullable();

            // A help centre is curated, never reverse-chronological. The order
            // is the editor's answer to "what goes wrong most".
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'sort_order']);
        });

        Schema::create('help_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('help_category_id')->constrained()->cascadeOnDelete();

            /*
             * Unique globally, not within a topic.
             *
             * The article endpoint resolves by this slug alone and returns the
             * topic with it, so moving an answer between topics changes the URL
             * it is canonical at without ever 404ing the row — and needs no
             * redirect entry to survive the move.
             */
            $table->string('slug')->unique();
            $table->string('title');

            // The one-line answer. Used on cards, as the search snippet, and as
            // the meta description fallback — so it is written to stand alone.
            $table->text('excerpt')->nullable();
            $table->longText('content');

            $table->integer('sort_order')->default(0);

            // The same three words guides and articles use, so the desk does not
            // have to learn a second vocabulary: draft, ready_for_review, published.
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();

            // `seo_*`, matching guides — not `meta_*`, which is the Article
            // spelling. Two spellings for one idea is already one too many.
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->string('focus_keyword')->nullable();
            $table->boolean('is_noindex')->default(false);

            $table->unsignedBigInteger('views')->default(0);

            /*
             * Helpfulness as counters on the row, not a votes table.
             *
             * `guide_votes` is keyed by user because a guide vote is a member's
             * withdrawable opinion. A help vote is an aggregate signal for the
             * editor, and the reader it matters most to — the one who cannot
             * finish registering — is by definition signed out. A user_id-keyed
             * unique row would make the single most important answer on the site
             * the one nobody can rate.
             */
            $table->unsignedInteger('helpful_count')->default(0);
            $table->unsignedInteger('unhelpful_count')->default(0);

            $table->timestamps();

            $table->index(['status', 'help_category_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('help_articles');
        Schema::dropIfExists('help_categories');
    }
};
