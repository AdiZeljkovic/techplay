<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The parts of the launch mail worth keeping, as fields.
 *
 * The first version of a campaign was a subject and a body, and it came out
 * looking like a memo. The launch announcement that actually went to members is
 * a designed newsletter — masthead, a hero card with an eyebrow pill above a
 * large headline, a button, then the writing — and asking an editor to rebuild
 * that in a rich-text box means asking them to write Outlook-safe tables by
 * hand, which is exactly what the template exists to avoid.
 *
 * So the hero becomes six fields and the body keeps being writing. Every one of
 * them is optional: leave them empty and the mail is a masthead, the text and
 * the footer, which is the right shape for a short note.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mail_campaigns', function (Blueprint $table) {
            // The small capsule above the headline — "THE NEW TECHPLAY IS LIVE".
            $table->string('hero_eyebrow', 60)->nullable()->after('subject');

            $table->string('hero_headline', 160)->nullable()->after('hero_eyebrow');
            $table->string('hero_intro', 400)->nullable()->after('hero_headline');

            // A button needs both halves or it is not a button. The template
            // draws it only when the two are present together.
            $table->string('hero_cta_label', 60)->nullable()->after('hero_intro');
            $table->string('hero_cta_url', 500)->nullable()->after('hero_cta_label');

            $table->string('hero_image', 500)->nullable()->after('hero_cta_url');
        });
    }

    public function down(): void
    {
        Schema::table('mail_campaigns', function (Blueprint $table) {
            $table->dropColumn([
                'hero_eyebrow', 'hero_headline', 'hero_intro',
                'hero_cta_label', 'hero_cta_url', 'hero_image',
            ]);
        });
    }
};
