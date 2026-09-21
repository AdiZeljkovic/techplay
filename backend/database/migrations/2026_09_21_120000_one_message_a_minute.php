<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The pace a campaign leaves at, set to what our mail server will actually take.
 *
 * It was ten messages every three seconds — about two hundred a minute — chosen
 * against Gmail's opinion of a new sender. The limit that bit first was not
 * Gmail's but our own: on 21 September 2026 a newsletter to 105 members
 * delivered 97 and then met
 *
 *     450 4.2.1 <no-reply@techplay.gg>: SASL login name rejected:
 *     You are sending too many emails too fast.
 *
 * from our own Postfix. A 4.x.x code is a "later", so the eight retried on
 * their own — and were refused again at sixty seconds apart and again at three
 * hundred, which is how we learned it is a quota over a window rather than a
 * throttle per second. Eight people did not get the email.
 *
 * One a minute is slow on purpose and the arithmetic is worth knowing before
 * the next list is bigger: a thousand recipients is about seventeen hours. That
 * is a decision to take per campaign in the admin, which is why these are
 * fields rather than constants — this is only where a campaign starts.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mail_campaigns', function (Blueprint $table) {
            $table->unsignedSmallInteger('batch_size')->default(1)->change();
            $table->unsignedSmallInteger('pause_seconds')->default(60)->change();
        });
    }

    public function down(): void
    {
        Schema::table('mail_campaigns', function (Blueprint $table) {
            $table->unsignedSmallInteger('batch_size')->default(10)->change();
            $table->unsignedSmallInteger('pause_seconds')->default(3)->change();
        });
    }
};
