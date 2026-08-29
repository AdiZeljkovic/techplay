import { Client, TextChannel } from 'discord.js';
import { config } from '../config';

/**
 * Where the bot speaks to the whole server.
 *
 * Two things say something server-wide — the Sunday recap and a leaderboard
 * climb — and they were answering this question separately. The recap read
 * RECAP_CHANNEL_ID; a climb went to whichever channel the message that happened
 * to trigger the check was in, so a congratulation about somebody who had
 * gained their rank on the website landed in the middle of an unrelated
 * conversation, in front of people it had nothing to do with.
 *
 * The id is fetched as well as read from the cache, because a cache miss on a
 * fresh connection used to make the recap silently do nothing — including the
 * weekly reset that happens only once it has posted.
 */
export async function announcementChannel(client: Client): Promise<TextChannel | null> {
    if (config.recapChannelId) {
        const fetched = client.channels.cache.get(config.recapChannelId)
            ?? await client.channels.fetch(config.recapChannelId).catch(() => null);

        if (fetched?.isTextBased()) return fetched as TextChannel;

        // A configured id that does not resolve is a mistake worth seeing.
        // Falling through to a channel called "general" would hide it.
        console.error(`❌ [announcements] RECAP_CHANNEL_ID ${config.recapChannelId} is not a text channel this bot can see`);

        return null;
    }

    const guild = client.guilds.cache.first();
    if (!guild) return null;

    const found = guild.channels.cache.find(c =>
        c.isTextBased() && (c.name === 'announcements' || c.name === 'general' || c.name === 'news')
    );

    return (found as TextChannel) ?? null;
}
