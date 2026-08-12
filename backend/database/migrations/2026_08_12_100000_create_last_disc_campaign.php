<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Last Disc — an open letter asking Sony to keep physical PlayStation
 * games, and a poll beside it.
 *
 * Two tables rather than one because they answer different questions and have
 * different bars to clear: a signature is a person putting their name to
 * something and needs an email; a vote is a click and needs nothing but a way
 * to stop the same person voting twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('last_disc_signatures', function (Blueprint $table) {
            $table->id();

            // Signed in or not — the letter is open to anyone.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('email');
            $table->string('name')->nullable();
            // ISO 3166-1 alpha-2, or null when they would rather not say.
            $table->string('country', 2)->nullable();

            // 'name' | 'anonymous' — how the signature appears in the tally.
            $table->string('display', 12)->default('name');

            $table->text('message')->nullable();
            $table->boolean('wants_updates')->default(false);

            $table->timestamps();

            // One signature per address. Signing twice is not a stronger signature.
            $table->unique('email');
            $table->index('country');
            $table->index('created_at');
        });

        Schema::create('last_disc_votes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // 'keep' | 'digital_only' | 'unsure'
            $table->string('choice', 16);

            // A hash, not an address: enough to stop a second vote from the
            // same place, useless to anyone reading the table.
            $table->string('voter_hash', 64);

            $table->timestamps();

            $table->unique('voter_hash');
            $table->index('choice');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('last_disc_votes');
        Schema::dropIfExists('last_disc_signatures');
    }
};
