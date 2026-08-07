<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * OAuth tokens leave the users table — the most-read table in the system
 * is the last place secrets belong. They move to user_integrations,
 * ENCRYPTED at rest (the model's encrypted casts; the copy below encrypts
 * by hand for the same result), so a stray `select *` in a log, a debug
 * tool, an admin export or an injection reads ciphertext, not tokens.
 *
 * Note for the future: encryption is bound to APP_KEY. If the key ever
 * rotates, stored tokens become unreadable and users simply reconnect —
 * an acceptable trade for tokens that no code currently reads back at all.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'provider']);
        });

        // Carry the existing tokens over, encrypted on the way in.
        foreach (DB::table('users')
            ->whereNotNull('discord_token')
            ->orWhereNotNull('battlenet_token')
            ->get(['id', 'discord_token', 'discord_refresh_token', 'battlenet_token', 'battlenet_refresh_token']) as $user) {
            foreach ([
                'discord' => [$user->discord_token, $user->discord_refresh_token],
                'battlenet' => [$user->battlenet_token, $user->battlenet_refresh_token],
            ] as $provider => [$access, $refresh]) {
                if (! $access) {
                    continue;
                }

                DB::table('user_integrations')->insert([
                    'user_id' => $user->id,
                    'provider' => $provider,
                    'access_token' => Crypt::encryptString($access),
                    'refresh_token' => $refresh ? Crypt::encryptString($refresh) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['discord_token', 'discord_refresh_token', 'battlenet_token', 'battlenet_refresh_token']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('discord_token')->nullable();
            $table->text('discord_refresh_token')->nullable();
            $table->text('battlenet_token')->nullable();
            $table->text('battlenet_refresh_token')->nullable();
        });

        Schema::dropIfExists('user_integrations');
    }
};
