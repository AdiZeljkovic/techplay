import dotenv from 'dotenv';

dotenv.config();

export const config = {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    apiUrl: process.env.API_URL || 'https://techplay.gg/api/v1',
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
