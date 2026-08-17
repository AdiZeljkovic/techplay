<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Editorial Chat and Tasks, removed at the owner's request.
 *
 * Neither was a mistake to build and neither was broken — they were simply not
 * used. The chat held 460 messages across 6 channels and 17 reactions; Tasks
 * held one row. Both were dropped because the editorial workflow happens
 * elsewhere, and a panel that carries screens nobody opens costs attention
 * every day and honesty nowhere.
 *
 * The data was exported before this ran, to /root/pre-removal-2026-08-17/ as
 * per-table gzipped inserts. That is a precaution rather than a plan: there is
 * no automated backup on this machine yet, and dropping 460 rows of somebody's
 * conversation without a copy is not something to do on a Tuesday.
 *
 * Removed alongside the tables: the 1,322-line Filament page, the channel
 * resource, three models, two broadcast events, both Reverb channel
 * definitions, two User relations and the FetchOgData job — which existed only
 * to fetch link previews for chat messages and had no other caller.
 *
 * Order matters below: messages reference channels, reactions and bookmarks
 * reference messages.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('editorial_message_bookmarks');
        Schema::dropIfExists('editorial_message_reactions');
        Schema::dropIfExists('editorial_messages');
        Schema::dropIfExists('editorial_channels');
        Schema::dropIfExists('tasks');
    }

    /**
     * Deliberately empty.
     *
     * Recreating five empty tables would restore nothing: the models, the page
     * and the events are gone from the codebase, so there would be nothing to
     * read or write them. If either feature is ever wanted again it comes back
     * as a build, not as a rollback — and the exported rows are still on the
     * server.
     */
    public function down(): void
    {
        //
    }
};
