<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The gaming journal — what a player actually did, session by session.
 *
 * The collection says what someone owns and the activity feed says what they
 * clicked. Neither says "I played two hours of Elden Ring on Sunday, got to
 * Stormveil, and it went badly". That's what this holds, and it's also the
 * first real source of playtime the site has outside the Steam sync.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('play_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();

            $table->date('played_on');
            $table->unsignedInteger('minutes')->default(0);
            $table->string('platform', 40)->nullable();

            // How far they got — free text ("Chapter 4", "Stormveil Castle")
            // and an optional percentage, because games count progress both ways.
            $table->string('progress_label', 120)->nullable();
            $table->unsignedTinyInteger('progress_percent')->nullable();

            $table->text('note')->nullable();
            $table->string('mood', 24)->nullable();

            // Who they played with — free text, so it covers friends on the
            // site and the cousin who isn't on it.
            $table->json('companions')->nullable();

            $table->boolean('has_spoilers')->default(false);
            $table->boolean('is_private')->default(false);

            $table->timestamps();

            $table->index(['user_id', 'played_on']);
            $table->index(['user_id', 'game_id']);
        });

        Schema::create('gaming_moments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->nullable()->constrained()->nullOnDelete();
            // A moment can hang off a session or stand on its own.
            $table->foreignId('play_session_id')->nullable()->constrained()->cascadeOnDelete();

            $table->string('type', 12); // screenshot | clip

            // Screenshots are stored; clips are linked. Hosting video on this
            // box is not viable, so a clip is a provider URL and its thumbnail.
            $table->string('path')->nullable();
            $table->string('url')->nullable();
            $table->string('provider', 24)->nullable();
            $table->string('thumbnail_url')->nullable();

            $table->string('caption', 200)->nullable();
            $table->boolean('has_spoilers')->default(false);
            $table->boolean('is_private')->default(false);

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gaming_moments');
        Schema::dropIfExists('play_sessions');
    }
};
