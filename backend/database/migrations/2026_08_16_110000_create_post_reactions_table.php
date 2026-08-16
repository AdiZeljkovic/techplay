<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reactions on a single reply.
 *
 * The forum had one signal and it was on the thread: an upvote for the whole
 * conversation. So a reply that solved somebody's problem and a reply that
 * said "same" were indistinguishable, and the only way to tell someone their
 * answer helped was to write another reply saying so — which is how a thread
 * fills with acknowledgements nobody needs to read.
 *
 * Fixed vocabulary rather than free emoji: a small set stays scannable down a
 * long thread, and a column of arbitrary pictures does not.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('post_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reaction', 20);
            $table->timestamps();

            // One reaction per person per post. Changing your mind replaces it
            // rather than adding a second.
            $table->unique(['post_id', 'user_id']);

            // Counting per post is what every thread page does.
            $table->index(['post_id', 'reaction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_reactions');
    }
};
