<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Our own count of who reads the site.
 *
 * Google Analytics reported 11 active users on 8 September. It was not broken:
 * on 2 September the consent banner was finally wired to Consent Mode, and GA
 * counts active users only from readers who granted analytics storage. That
 * day 2,094 hits carried `gcs=G100` and 157 carried `G111`. Eleven is what 157
 * hits look like.
 *
 * Before that the head declared `analytics_storage: 'granted'` unconditionally
 * while the tag declared `client_storage: 'none'` — so GA counted everybody and
 * could not tell one from another. Every page load was a new person. That is
 * where 70,000 "active users" in ninety days came from, and why the average
 * engagement time read five seconds.
 *
 * So neither number was ever the truth: the old one counted page loads, the
 * new one counts the 2-7% who press Accept. This is the third thing — a count
 * of everyone, made in a way that does not need their permission to exist.
 *
 * What makes it consent-free is the absence of an identifier. No cookie of
 * ours, and no IP address stored: a visitor is a hash of their address, their
 * user agent and a salt that is thrown away and regenerated every night. The
 * same person tomorrow is a different hash, which is the trade — daily uniques
 * are exact, and "returning after a week" is not answerable. Plausible and
 * friends make the same trade for the same reason.
 *
 * The raw table is the detail and it is pruned; the daily tables are the
 * history and they are kept. A report from six months ago must not depend on
 * rows we were always going to delete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();

            /*
             * Who, without who.
             *
             * sha256(daily salt + ip + user agent), truncated. Unique within a
             * day and meaningless across days, which is the point. Indexed
             * with occurred_at because every question starts "on this day".
             */
            $table->string('visitor', 32);
            $table->string('session', 40)->nullable();

            $table->string('event', 40)->default('page_view');
            $table->string('path', 512);
            $table->string('title', 300)->nullable();

            /* Host only. A full referrer carries search terms and campaign
               ids, which is somebody else's data arriving in ours. */
            $table->string('referrer_host', 190)->nullable();

            $table->char('country', 2)->nullable();
            $table->string('language', 12)->nullable();
            $table->string('device', 12)->nullable();
            $table->string('platform', 40)->nullable();
            $table->string('browser', 40)->nullable();
            $table->unsignedSmallInteger('screen_w')->nullable();

            /** Milliseconds GA measured for this event, when it sends one. */
            $table->unsignedInteger('engagement_ms')->nullable();

            /** GA's own consent string, kept so the two counts stay comparable. */
            $table->string('consent', 8)->nullable();

            /*
             * Judged at ingestion and stored rather than filtered away.
             *
             * A number that quietly excludes things is a number nobody can
             * check. The reports read `is_bot = false`, and the page shows how
             * many were set aside beside every figure it draws.
             */
            $table->boolean('is_bot')->default(false);
            $table->string('bot_reason', 40)->nullable();

            $table->timestamp('occurred_at');

            $table->index(['occurred_at', 'is_bot']);
            $table->index(['visitor', 'occurred_at']);
            $table->index(['path', 'occurred_at']);
        });

        /*
         * The totals, one row a day, kept forever.
         *
         * Rolled up from the raw table by `analytics:rollup`, which is
         * idempotent: it recomputes a day rather than adding to it, so a
         * re-run after a fix corrects the history instead of doubling it.
         */
        Schema::create('analytics_daily', function (Blueprint $table) {
            $table->id();
            $table->date('day')->unique();

            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('sessions')->default(0);
            $table->unsignedInteger('pageviews')->default(0);

            /** Sessions with more than one page, or measurable engagement. */
            $table->unsignedInteger('engaged_sessions')->default(0);
            $table->unsignedBigInteger('engagement_ms')->default(0);

            /** Kept beside the rest so the exclusion is visible, not implied. */
            $table->unsignedInteger('bot_hits')->default(0);

            /** How many of the day's visitors had granted analytics consent. */
            $table->unsignedInteger('consented_visitors')->default(0);

            $table->timestamps();
        });

        /*
         * One shape for every breakdown.
         *
         * Pages, referrers, countries, devices and browsers are the same
         * question asked of a different column, and five tables that differ
         * only in their name is five places to fix a bug. `kind` says which.
         */
        Schema::create('analytics_daily_breakdowns', function (Blueprint $table) {
            $table->id();
            $table->date('day');
            $table->string('kind', 16);
            $table->string('value', 512);
            $table->string('label', 300)->nullable();

            $table->unsignedInteger('visitors')->default(0);
            $table->unsignedInteger('pageviews')->default(0);
            $table->unsignedBigInteger('engagement_ms')->default(0);

            $table->index(['day', 'kind', 'visitors']);
        });

        /*
         * Postgres will not build a unique index on a 512-byte column, and the
         * value is a URL path — long, and distinct in its first bytes almost
         * always. So the key is over a hash of it, which is what the rollup
         * upserts on.
         *
         * Expression indexes are Postgres-only and the test suite runs on
         * SQLite in memory, where the rollup is exercised on a handful of rows
         * and needs no index at all.
         */
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'CREATE UNIQUE INDEX analytics_breakdown_key ON analytics_daily_breakdowns '
                .'(day, kind, md5(value))'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_daily_breakdowns');
        Schema::dropIfExists('analytics_daily');
        Schema::dropIfExists('analytics_events');
    }
};
