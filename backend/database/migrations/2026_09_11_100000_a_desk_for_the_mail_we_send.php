<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Somewhere for the mail to live.
 *
 * Until now a campaign was a class. `newsletter:launch` is a command somebody
 * wrote in PHP, with the copy in a Blade file, and sending it a second time
 * with different words meant a deploy. The audience was all-or-nothing and
 * nothing recorded who actually received it — after the send there was no way
 * to answer "did this person get it".
 *
 * Four tables, and the split between them is the point:
 *
 *   mail_templates            the wording of the mail the site sends by itself
 *   mail_campaigns            a newsletter somebody writes and sends
 *   mail_campaign_recipients  one row per person per campaign — the log
 *   mail_campaign_clicks      which link, by whom
 *
 * Templates are deliberately not full HTML. The account mail carries the links
 * the whole sign-in flow depends on, and a template that could delete the
 * verification button is a template that can lock every new member out of the
 * site — quietly, because nobody notices until somebody complains. So the
 * editor gets the words and the code keeps the link.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_templates', function (Blueprint $table) {
            $table->id();

            // The code asks for a template by key. It is not editable from the
            // admin: a renamed key silently detaches the row from the mail it
            // belongs to, and the mail falls back to its built-in copy without
            // saying anything.
            $table->string('key', 64)->unique();

            $table->string('name');
            $table->string('group', 32)->default('general');
            $table->string('subject');
            $table->string('heading')->nullable();
            $table->text('body')->nullable();

            // The button's words. Its href is built in code, always.
            $table->string('cta_label')->nullable();

            // Off means "use what is written in the class". Nothing here can
            // stop a mail going out; the worst it can do is nothing.
            $table->boolean('is_active')->default(true);

            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('mail_campaigns', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('subject');

            /*
             * No preheader column, on purpose.
             *
             * The shared layout used to draw one and it was taken out: our own
             * mail server's filter scored it ZERO_FONT 0.50 and
             * MANY_INVISIBLE_PARTS 0.80, because hidden text carrying keywords
             * is how spam works and no filter can tell our intent from anyone
             * else's. The first visible line of the body does that job now, and
             * putting the field back here would reintroduce a bug somebody has
             * already paid for.
             */
            $table->text('body')->nullable();
            $table->text('body_text')->nullable();

            /*
             * Who it goes to, as a rule rather than a list of addresses.
             *
             * Stored as the rule so the audience is resolved at send time: a
             * list frozen at compose time would mail somebody who unsubscribed
             * in between, which is the one mistake in this whole system that
             * cannot be taken back.
             */
            $table->json('audience')->nullable();

            $table->string('status', 16)->default('draft')->index();
            $table->timestamp('scheduled_for')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();

            // Pacing, per campaign. Our own mail server has no reputation to
            // spend, and a hundred messages in one second is what a new sender
            // does immediately before it stops arriving anywhere.
            $table->unsignedSmallInteger('batch_size')->default(10);
            $table->unsignedSmallInteger('pause_seconds')->default(3);

            $table->unsignedInteger('recipients_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->unsignedInteger('opened_count')->default(0);
            $table->unsignedInteger('clicked_count')->default(0);

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('mail_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('mail_campaigns')->cascadeOnDelete();

            $table->string('email');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // 'account' or 'form' — which claim we are writing on. The footer
            // says something different for each, because they are not the same
            // permission.
            $table->string('source', 16)->default('account');

            /*
             * One secret per person per campaign.
             *
             * It addresses the open pixel, the click redirect and the row
             * itself. Per recipient rather than per campaign because the whole
             * point is telling one reader from another, and per campaign rather
             * than per person so that a token leaking out of one newsletter
             * cannot be used to read the next.
             */
            $table->string('token', 48)->unique();

            $table->string('status', 16)->default('queued')->index();
            $table->timestamp('sent_at')->nullable();
            $table->string('failed_reason', 300)->nullable();

            $table->timestamp('opened_at')->nullable();
            $table->unsignedSmallInteger('open_count')->default(0);
            $table->timestamp('clicked_at')->nullable();
            $table->unsignedSmallInteger('click_count')->default(0);

            $table->timestamps();

            // The guard that makes a restarted send safe: a second run cannot
            // write to anybody twice.
            $table->unique(['campaign_id', 'email']);
        });

        Schema::create('mail_campaign_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipient_id')->constrained('mail_campaign_recipients')->cascadeOnDelete();
            $table->string('url', 1000);
            $table->timestamp('clicked_at');

            $table->index(['recipient_id', 'clicked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_campaign_clicks');
        Schema::dropIfExists('mail_campaign_recipients');
        Schema::dropIfExists('mail_campaigns');
        Schema::dropIfExists('mail_templates');
    }
};
