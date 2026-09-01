<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where an address on the list came from.
 *
 * `newsletter_subscribers` is about to hold two different kinds of people. It
 * already holds everyone who typed their address into the footer form. The
 * launch mail goes to registered members, who never did that — and every one of
 * them needs a row here, because the row is what carries the unsubscribe token
 * that RFC 8058 requires and that a link in the footer of the mail has to
 * resolve. Without a row, there is no token; without a token, the only
 * unsubscribe we can offer is a link to a settings page, which is what we were
 * shipping and is not an unsubscribe.
 *
 * So the rows have to exist, and they must not be confused with consent. A
 * member who created an account did not sign up for a newsletter, and the
 * subscriber count in the admin panel would otherwise jump by the size of the
 * membership and mean nothing afterwards. `source` keeps the two apart:
 * `form` is somebody who asked, `account` is somebody we can write to because
 * they have an account with us.
 *
 * Existing rows are all `form` — the form was the only way in until now.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('source', 16)->default('form')->after('email');
            $table->index('source');
        });
    }

    public function down(): void
    {
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });
    }
};
