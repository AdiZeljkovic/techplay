import { Client, Guild, ChannelType, PermissionFlagsBits } from 'discord.js';

export class ServerStatsService {
    private client: Client;
    private interval: ReturnType<typeof setInterval> | null = null;

    // Configuration: Channel IDs (will be created if not set/found)
    // In a real app, store these in DB/config
    private statsChannels = {
        totalMembers: { id: '', name: '📊 Members: {count}' },
        onlineMembers: { id: '', name: '🟢 Online: {count}' },
        bots: { id: '', name: '🤖 Bots: {count}' }
    };

    constructor(client: Client) {
        this.client = client;
    }

    public start() {
        // Update immediately on start
        this.updateStats();

        // Then update every 10 minutes to avoid rate limits
        this.interval = setInterval(() => this.updateStats(), 10 * 60 * 1000);
    }

    public stop() {
        if (this.interval) clearInterval(this.interval);
    }

    private async updateStats() {
        const guild = this.client.guilds.cache.first(); // Assuming single guild for now
        if (!guild) return;

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
        } catch (error) {
            console.error('Failed to update server stats:', error);
        }
    }

    private async updateChannel(guild: Guild, type: keyof typeof this.statsChannels, count: number) {
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
        } else {
            // Create new channel if it matches our "Stats" pattern check or just create one
            // Ideally we check if there is a category "SERVER STATS"

            // For simplicity, we'll try to find a channel with similar name first to avoid duplicates on restart
            const existing = guild.channels.cache.find(c => c.name.startsWith(nameTemplate.split(':')[0]));
            if (existing) {
                this.statsChannels[type].id = existing.id;
                if (existing.name !== newName) await existing.setName(newName);
                return;
            }

            // Create new
            try {
                const newChannel = await guild.channels.create({
                    name: newName,
                    type: ChannelType.GuildVoice, // Voice channels look cleaner for stats
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.Connect], // Deny connect so people don't join
                            allow: [PermissionFlagsBits.ViewChannel]
                        }
                    ]
                });
                this.statsChannels[type].id = newChannel.id;
            } catch (err) {
                console.error(`Could not create stats channel for ${type}`, err);
            }
        }
    }
}
