<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether a linked account is actually in the TechPlay Discord.
 *
 * Linking a Discord account and being in the server are two different facts,
 * and the site only ever knew the first. The bot has held the second the whole
 * time — it runs with the GuildMembers intent and fetches the member list for
 * the stats channels — it just never told the backend. So a profile could say
 * "Discord connected" for somebody who left the server a year ago, and the one
 * achievement counted off Discord fired on the link alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('discord_guild_member')->default(false);
            $table->timestamp('discord_guild_joined_at')->nullable();
            // Membership is reported by the bot, so it can go stale if the bot
            // is down. The timestamp says how much to trust the flag.
            $table->timestamp('discord_guild_checked_at')->nullable();

            $table->index('discord_guild_member');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['discord_guild_member']);
            $table->dropColumn(['discord_guild_member', 'discord_guild_joined_at', 'discord_guild_checked_at']);
        });
    }
};
