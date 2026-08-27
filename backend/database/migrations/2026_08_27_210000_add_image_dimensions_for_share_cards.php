<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Width and height for the image every share card is built around.
 *
 * Facebook and X read og:image:width and og:image:height to draw the card
 * immediately. Without them the crawler has to fetch and measure the file
 * itself, so the first share of a piece often renders with no image at all and
 * only corrects itself on a later scrape — which is the one moment that
 * matters, since a link is usually shared once.
 *
 * Two tables, not three: reviews are Articles here. A create_reviews_table
 * migration exists but the table does not — worth checking before writing
 * anything that assumes otherwise.
 *
 * The upload pipeline already measures the image: ImageOptimizationService
 * reads $image->width() to decide which responsive sizes to make, and then
 * throws the number away. These columns are where it goes instead; the
 * backfill command reads the files already on disk for everything published
 * before today.
 *
 * Nullable on purpose. An article whose dimensions are unknown emits the image
 * without them, exactly as it does now — worse than knowing, better than a
 * guess.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->unsignedSmallInteger('featured_image_width')->nullable()->after('featured_image_alt');
            $table->unsignedSmallInteger('featured_image_height')->nullable()->after('featured_image_width');
        });

        Schema::table('guides', function (Blueprint $table) {
            $table->unsignedSmallInteger('featured_image_width')->nullable()->after('featured_image_url');
            $table->unsignedSmallInteger('featured_image_height')->nullable()->after('featured_image_width');
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['featured_image_width', 'featured_image_height']);
        });

        Schema::table('guides', function (Blueprint $table) {
            $table->dropColumn(['featured_image_width', 'featured_image_height']);
        });
    }
};
