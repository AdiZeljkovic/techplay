import dotenv from 'dotenv';

dotenv.config();

export const config = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    /**
     * The backend, reached without leaving the machine.
     *
     * This defaulted to the public hostname, so the bot — which runs on the
     * same box as the API — sent every request out to Cloudflare and back. That
     * puts the site's own bot behind the bot controls, and it means a tightening
     * at the edge takes the bot down with it. It also lands on an edge rule that
     * caches /api/v1/news for a minute, which sits directly in the poller's
     * duplicate-detection path.
     */
    apiUrl: process.env.API_URL || 'http://127.0.0.1:8000/api/v1',
    /**
     * The Host the backend should think it is answering as. Needed because
     * 127.0.0.1 carries no name, and Laravel builds absolute URLs from it.
     */
    apiHost: process.env.API_HOST || 'api-beta.techplay.gg',
    /**
     * Exempts server-side callers from the 60-request-per-minute limiter that
     * is keyed by IP. Without it the bot shares one bucket with anything else
     * arriving from this address, and the `throttle:300,1` on the Discord
     * routes is meaningless — the tighter global limit is what applies. An
     * evening of chatter plus autocomplete could cross it, and a 429 on the
     * daily-claim route is reported to the member as "already claimed today".
     */
    internalToken: process.env.INTERNAL_API_TOKEN || '',
    botSecret: process.env.DISCORD_BOT_SECRET || '', // Must match backend DISCORD_BOT_SECRET
    recapChannelId: process.env.RECAP_CHANNEL_ID || '', // Channel for weekly recaps
    // The poll is the safety net now, not the mechanism — the site pushes a
    // publish the moment it happens. Ten minutes instead of one takes the
    // feed traffic from 5,760 requests a day to 576.
    checkInterval: parseInt(process.env.CHECK_INTERVAL_SECONDS || '600', 10) * 1000,
    // Where the site knocks when it publishes. Localhost only.
    publishPort: parseInt(process.env.PUBLISH_LISTENER_PORT || '8099', 10),
};

// Validate required config
if (!config.token) {
    console.error("❌ DISCORD_TOKEN is missing in .env file");
}

if (!config.botSecret) {
    console.warn("⚠️ DISCORD_BOT_SECRET is missing - XP sync will not work");
}
