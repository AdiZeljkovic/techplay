<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The release calendar stops borrowing and starts owning.
 *
 * Until now the calendar was whatever RAWG said at that moment, which meant an
 * outage at their end was a blank page at ours. From here the stores are read
 * on a schedule into our own tables, and the calendar only ever reads what we
 * already hold.
 *
 * The two new tables carry the weight:
 *
 * game_store_links is what makes repeat syncs cheap. Guessing that a Steam and
 * a Nintendo listing are the same game is expensive and fallible, so we do it
 * once and then remember it — every later sync is an exact lookup on a store
 * id, and no title is ever matched twice.
 *
 * game_match_decisions is the other half of that promise: when an editor rules
 * on a pair the aggregator could not settle alone, the ruling sticks. Without
 * it every sync would re-ask the same question and quietly undo their work.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_store_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            // 'steam' | 'playstation' | 'xbox' | 'nintendo'
            $table->string('store', 20);
            $table->string('store_id', 120);
            $table->string('url', 500)->nullable();

            // The store's own view of this title, kept so a later change of
            // heart about presentation does not mean refetching everything.
            $table->jsonb('payload')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            // One store listing belongs to exactly one game. This is the
            // constraint the whole sync leans on for idempotency.
            $table->unique(['store', 'store_id']);
            $table->index(['game_id', 'store']);
        });

        Schema::create('game_match_decisions', function (Blueprint $table) {
            $table->id();

            // Normalised titles rather than game ids: the decision has to
            // survive the games themselves being merged away.
            $table->string('left_key', 200);
            $table->string('right_key', 200);
            $table->boolean('same_game');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['left_key', 'right_key']);
        });

        Schema::table('games', function (Blueprint $table) {
            // A store that says "Q4 2026" is telling the truth; flattening it
            // to a date would be us inventing precision it never had.
            $table->string('release_precision', 10)->default('day');

            // How wanted a game is. Nothing populates this yet — the stores do
            // not publish wishlist counts — but the calendar sorts on it, so it
            // exists rather than being bolted on later.
            $table->unsignedInteger('hype_score')->default(0);

            // An entry a human created, for the titles no store will give us:
            // Epic exclusives, Ubisoft's own launcher, anything announced but
            // not yet listed.
            $table->boolean('is_editorial')->default(false);

            // Fields an editor has corrected by hand. The sync reads this and
            // leaves them alone, so a fixed date is not undone an hour later.
            $table->jsonb('locked_fields')->nullable();

            $table->index('release_precision');
        });

        // Trigram matching for the review queue. Without it near-miss titles
        // ("Lies of P Complete Ed." against "Lies of P: Complete Edition")
        // would have to be compared in PHP across the whole table.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('game_match_decisions');
        Schema::dropIfExists('game_store_links');

        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['release_precision']);
            $table->dropColumn(['release_precision', 'hype_score', 'is_editorial', 'locked_fields']);
        });
    }
};
