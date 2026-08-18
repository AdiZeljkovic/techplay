<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The way out.
 *
 * There was none. Seven people had subscribed and the only way off the list was
 * to ask somebody — which is not a nicety: since February 2024 Gmail and Yahoo
 * require a one-click unsubscribe from anyone sending in bulk, and the GDPR
 * requires that consent be as easy to withdraw as it was to give.
 *
 * Two pieces here.
 *
 * `unsubscribe_token` is deliberately **not** cleared after use, unlike
 * `verification_token` next to it. A person may click the link in a two-year-old
 * newsletter; that link has to keep working, and it has to keep working after
 * they resubscribe and change their mind again.
 *
 * `mail_suppressions` is the list of addresses we must not write to, whatever
 * any other table says. Unsubscribes go in it, and so will hard bounces and
 * spam complaints when there is something reporting them. It is keyed by email
 * rather than by subscriber, because a person who unsubscribes should stay
 * unsubscribed even if a second row for the same address appears later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('unsubscribe_token', 64)->nullable()->unique()->after('verification_token');
            $table->timestamp('unsubscribed_at')->nullable()->after('email_verified_at');
        });

        Schema::create('mail_suppressions', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();

            // Why we stopped writing to them. `unsubscribed` is their choice;
            // `bounced` and `complained` are the mail system telling us.
            $table->string('reason', 32)->default('unsubscribed');

            // Which list or send it came from, for when somebody asks why.
            $table->string('source')->nullable();
            $table->text('note')->nullable();

            $table->timestamps();

            $table->index('reason');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_suppressions');

        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropColumn(['unsubscribe_token', 'unsubscribed_at']);
        });
    }
};
