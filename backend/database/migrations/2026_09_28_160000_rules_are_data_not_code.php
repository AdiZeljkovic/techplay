<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the advisor is allowed to say, and when.
 *
 * A table rather than a match statement because these are editorial decisions,
 * not logic. A threshold that turns out to be wrong, a sentence that reads badly,
 * a recommendation that should stop appearing after the expansion it was written
 * for — every one of those is a row somebody edits in the admin panel, with a
 * date on it, not a deploy.
 *
 * The split is deliberate and worth stating: **the mechanics are code, the policy
 * is data**. Reading the item ledger, summing Agony Resistance out of the
 * catalogue, walking 807 achievements — that is code, and belongs in a producer
 * where it can be tested. Which conditions matter, how heavily each answer
 * counts, and how confident we are allowed to sound — that is here.
 *
 * `confidence` is the column that keeps this honest. The mockups draw
 * "Confidence to complete: High" beside a number nothing computes, and the rule
 * this project took from that is that a claim carries its own certainty or it
 * does not get drawn. `needs_confirmation` still renders, worded as a question;
 * `hidden` is how a rule is retired without deleting the record of it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gw2_rules', function (Blueprint $table) {
            $table->id();

            // Stable across edits and rewrites. Tests and dedupe both key on it.
            $table->string('key', 64)->unique();

            /*
             * Which producer builds the signal.
             *
             * Named rather than guessed from the key so two rules can share one
             * producer with different thresholds and copy — the same "you are
             * close to finishing this" machinery serves a curated list and an
             * unreviewed one at different confidence.
             */
            $table->string('producer', 64)->index();

            // masteries | gear | fractals | achievements | vault | raids | wallet
            $table->string('domain', 24)->index();

            $table->string('title', 160);

            /*
             * The sentence a reader sees, with {placeholders} filled from the
             * signal's own facts. Kept out of code so a badly worded piece of
             * advice is a text edit rather than a release.
             */
            $table->text('body');

            /**
             * Hard preconditions, all of which must hold.
             *
             * Each entry is {path, op, value} against the flat fact map — no
             * expression language, deliberately. A vocabulary that can be
             * enumerated is one an editor can be shown a list of; anything more
             * general becomes a second programming language with no tests.
             */
            $table->jsonb('requires')->nullable();

            $table->unsignedSmallInteger('base_score')->default(50);

            /*
             * Per-fact multipliers, applied on top of base_score. This is where
             * "sixteen unspent points matters more than one" lives, without the
             * producer having to know how much more.
             */
            $table->jsonb('weights')->nullable();

            // confirmed | high | medium | needs_confirmation | hidden
            $table->string('confidence', 24)->default('medium');

            // quick | session | long — what the player is being asked to spend.
            $table->string('effort_band', 16)->nullable();

            /*
             * Which expansion the advice assumes. A rule about Skyscale training
             * must not appear for an account that cannot enter Path of Fire, and
             * checking that here rather than in every rule's `requires` means it
             * cannot be forgotten.
             */
            $table->string('needs_expansion', 32)->nullable();

            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('version')->default(1);
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gw2_rules');
    }
};
