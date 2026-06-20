<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connected_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Provider slug: steam | battlenet | discord | epic | gog | xbox | psn | riot
            $table->string('provider', 32)->index();

            // Provider's own user identifier (Steam64 ID, Battle.net account ID, etc.)
            $table->string('provider_user_id', 64);

            // Human-readable display name on that platform (Steam persona, BTag, etc.)
            $table->string('display_name', 128)->nullable();

            // OAuth / API tokens — encrypted at rest
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();

            // Scopes granted
            $table->json('scopes')->nullable();

            // Sync state
            $table->enum('sync_status', ['idle', 'pending', 'syncing', 'done', 'error'])->default('idle');
            $table->text('sync_error')->nullable();
            $table->timestamp('last_synced_at')->nullable();

            // Visibility: public | friends | private
            $table->string('visibility', 16)->default('public');

            $table->timestamps();

            $table->unique(['user_id', 'provider']);
            $table->unique(['provider', 'provider_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connected_accounts');
    }
};
