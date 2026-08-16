<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Polls, attached to the thread that asks them.
 *
 * "Which GPU should I buy" and "best game of the year" are threads that want a
 * count, not forty replies each naming one thing — and without a poll the count
 * has to be done by hand in the last reply, which is wrong by the time anyone
 * reads it.
 *
 * One poll per thread. Two would need the page to explain which is which, and a
 * thread that wants to ask two questions is two threads.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('polls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('question', 255);

            // Some questions have one answer and some have several; a poll that
            // cannot say which turns "pick your three favourites" into an
            // argument in the replies.
            $table->boolean('allows_multiple')->default(false);

            // Whether people who have not voted can see the tally. Hiding it
            // stops the first few votes from steering the rest.
            $table->boolean('hide_results_until_voted')->default(false);

            $table->timestamp('closes_at')->nullable();
            $table->timestamps();
        });

        Schema::create('poll_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->string('label', 120);

            // The author's ordering, kept: a poll re-ordered by id or by score
            // reads as a different question each time it is loaded.
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['poll_id', 'position']);
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
            $table->foreignId('poll_option_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            // One vote per option per person. A single-choice poll is enforced
            // on top of this in the controller, because the difference is a
            // property of the poll rather than of the table.
            $table->unique(['poll_option_id', 'user_id']);

            // "Has this person voted at all", asked on every page load.
            $table->index(['poll_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_votes');
        Schema::dropIfExists('poll_options');
        Schema::dropIfExists('polls');
    }
};
