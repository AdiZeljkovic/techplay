"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerStatsService = void 0;
const discord_js_1 = require("discord.js");
class ServerStatsService {
    constructor(client) {
        this.interval = null;
        // Configuration: Channel IDs (will be created if not set/found)
        // In a real app, store these in DB/config
        this.statsChannels = {
            totalMembers: { id: '', name: '📊 Members: {count}' },
            onlineMembers: { id: '', name: '🟢 Online: {count}' },
            bots: { id: '', name: '🤖 Bots: {count}' }
        };
        this.client = client;
    }
    start() {
        // Update immediately on start
        this.updateStats();
        // Then update every 10 minutes to avoid rate limits
        this.interval = setInterval(() => this.updateStats(), 10 * 60 * 1000);
    }
    stop() {
        if (this.interval)
            clearInterval(this.interval);
    }
    async updateStats() {
        const guild = this.client.guilds.cache.first(); // Assuming single guild for now
        if (!guild)
            return;
        try {
            // Fetch all members to get accurate counts (required for presence checks)
            await guild.members.fetch();
            const totalCount = guild.memberCount;
            const onlineCount = guild.members.cache.filter(m => !m.user.bot && (m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle')).size;
            const botCount = guild.members.cache.filter(m => m.user.bot).size;
            await this.updateChannel(guild, 'totalMembers', totalCount);
            await this.updateChannel(guild, 'onlineMembers', onlineCount);
            await this.updateChannel(guild, 'bots', botCount);
            console.log(`Updated server stats: ${totalCount} members, ${onlineCount} online`);
        }
        catch (error) {
            console.error('Failed to update server stats:', error);
        }
    }
    async updateChannel(guild, type, count) {
        let channelId = this.statsChannels[type].id;
        const nameTemplate = this.statsChannels[type].name;
        const newName = nameTemplate.replace('{count}', count.toLocaleString());
        // Check if channel exists
        let channel = channelId ? guild.channels.cache.get(channelId) : null;
        if (channel) {
            // Update existing channel
            if (channel.name !== newName) {
                await channel.setName(newName);
            }
        }
        else {
            // Create new channel if it matches our "Stats" pattern check or just create one
            // Ideally we check if there is a category "SERVER STATS"
            // For simplicity, we'll try to find a channel with similar name first to avoid duplicates on restart
            const existing = guild.channels.cache.find(c => c.name.startsWith(nameTemplate.split(':')[0]));
            if (existing) {
                this.statsChannels[type].id = existing.id;
                if (existing.name !== newName)
                    await existing.setName(newName);
                return;
            }
            // Create new
            try {
                const newChannel = await guild.channels.create({
                    name: newName,
                    type: discord_js_1.ChannelType.GuildVoice, // Voice channels look cleaner for stats
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [discord_js_1.PermissionFlagsBits.Connect], // Deny connect so people don't join
                            allow: [discord_js_1.PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
                this.statsChannels[type].id = newChannel.id;
            }
            catch (err) {
                console.error(`Could not create stats channel for ${type}`, err);
            }
        }
    }
}
exports.ServerStatsService = ServerStatsService;
