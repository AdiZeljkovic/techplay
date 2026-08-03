<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Turns a list from a bag of games into a ranked, argued recommendation:
 * a type and category to file it under, tags to find it by, a per-item note
 * and score to justify the order, plus the two social tables that let other
 * people react to it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_lists', function (Blueprint $table) {
            $table->string('list_type', 20)->default('custom')->index();
            $table->string('category', 40)->nullable()->index();
            $table->json('tags')->nullable();
            $table->boolean('allow_comments')->default(true);
            $table->boolean('has_spoilers')->default(false);
            // A draft is invisible to everyone but its author, whatever
            // is_public says — publishing is a separate, deliberate act.
            $table->boolean('is_draft')->default(false)->index();
        });

        Schema::table('game_list_items', function (Blueprint $table) {
            $table->text('note')->nullable();
            $table->decimal('score', 3, 1)->nullable();
        });

        Schema::create('game_list_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['game_list_id', 'user_id']);
        });

        Schema::create('game_list_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_list_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['game_list_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_list_comments');
        Schema::dropIfExists('game_list_likes');

        Schema::table('game_list_items', function (Blueprint $table) {
            $table->dropColumn(['note', 'score']);
        });

        Schema::table('game_lists', function (Blueprint $table) {
            $table->dropColumn(['list_type', 'category', 'tags', 'allow_comments', 'has_spoilers', 'is_draft']);
        });
    }
};
