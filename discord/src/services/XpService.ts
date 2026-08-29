import { Client, Events, Message, TextChannel } from 'discord.js';
import { ApiService } from './ApiService';
import { announcementChannel } from './AnnouncementChannel';
import { BuffyService } from './BuffyService';
import { violatesFilter } from '../handlers/events';

interface LeaderboardUser {
    username: string;
    name: string;
    xp: number;
    rank_position: number;
}

export class XpService {
    private static instance: XpService;
    private client: Client;
    private api: ApiService;
    private buffy: BuffyService;
    private cooldowns: Set<string> = new Set();
    private lastLeaderboard: Map<string, number> = new Map();
    private weeklyActivity: Map<string, { name: string, xp: number, messages: number }> = new Map();

    // Leaderboard cache
    private leaderboardCache: LeaderboardUser[] = [];
    private leaderboardCacheTime: number = 0;
    private readonly LEADERBOARD_CACHE_TTL = 60000; // 60 seconds

    // Configuration
    private readonly XP_PER_MESSAGE = 15;
    private readonly COOLDOWN_SECONDS = 60;

    private constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
        this.buffy = BuffyService.getInstance();
    }

    public static getInstance(client?: Client): XpService {
        if (!XpService.instance && client) {
            XpService.instance = new XpService(client);
        }
        return XpService.instance;
    }

    public async start() {
        await this.syncLeaderboardCache();

        this.client.on(Events.MessageCreate, async (message: Message) => {
            await this.handleMessage(message);
        });

        console.log('⭐ XP Service started - tracking activity');
    }

    private async syncLeaderboardCache() {
        const leaderboard = await this.getCachedLeaderboard();
        this.lastLeaderboard.clear();
        leaderboard.forEach((u: LeaderboardUser) => {
            this.lastLeaderboard.set(u.username, u.rank_position);
        });
    }

    private async handleMessage(message: Message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // Moderation and XP are separate listeners on the same event, so a
        // message that was about to be deleted for a slur still earned its
        // author fifteen points on the way out. Asking the filter the same
        // question keeps the two from disagreeing without coupling them.
        if (violatesFilter(message.content)) return;

        if (this.cooldowns.has(message.author.id)) {
            return;
        }

        this.cooldowns.add(message.author.id);
        setTimeout(() => this.cooldowns.delete(message.author.id), this.COOLDOWN_SECONDS * 1000);

        const xpResponse = await this.api.addXp(message.author.id, this.XP_PER_MESSAGE);

        if (xpResponse) {
            // What the backend actually paid, not what was asked for. The daily
            // cap and the season multiplier both move it, so counting a flat 15
            // credited "Member of the Week" with XP nobody was given — and it
            // overstated most on the members who talk the most, because they are
            // the ones who spend the second half of the day capped at nothing.
            const awarded = typeof xpResponse.xp_awarded === 'number' ? xpResponse.xp_awarded : 0;

            const current = this.weeklyActivity.get(message.author.id) || { name: message.author.username, xp: 0, messages: 0 };
            this.weeklyActivity.set(message.author.id, {
                name: message.author.username,
                xp: current.xp + awarded,
                messages: current.messages + 1
            });

            const channel = message.channel as TextChannel;

            // Announce rank up with Buffy embed
            if (xpResponse.rank_up) {
                const embed = this.buffy.createLevelUpEmbed(
                    message.author.username,
                    xpResponse.new_rank,
                    xpResponse.new_xp || 0
                );
                channel.send({ embeds: [embed] });
            }

            // Announce achievements with Buffy embed
            if (xpResponse.achievements_unlocked && xpResponse.achievements_unlocked.length > 0) {
                for (const achievement of xpResponse.achievements_unlocked) {
                    const embed = this.buffy.createAchievementEmbed(
                        message.author.username,
                        achievement.name,
                        achievement.description || ''
                    );
                    channel.send({ embeds: [embed] });
                }
            }

            await this.checkOvertakes();
        }
    }

    private async getCachedLeaderboard(): Promise<LeaderboardUser[]> {
        const now = Date.now();

        // Return cached data if still valid
        if (this.leaderboardCache.length > 0 && (now - this.leaderboardCacheTime) < this.LEADERBOARD_CACHE_TTL) {
            return this.leaderboardCache;
        }

        // Fetch fresh data
        try {
            const leaderboard = await this.api.getLeaderboard();
            this.leaderboardCache = leaderboard;
            this.leaderboardCacheTime = now;
            return leaderboard;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            // Return stale cache if available
            return this.leaderboardCache;
        }
    }

    private async checkOvertakes() {
        const newLeaderboard = await this.getCachedLeaderboard();

        const climbs = newLeaderboard.filter((u: LeaderboardUser) => {
            const oldPos = this.lastLeaderboard.get(u.username);
            return oldPos !== undefined && u.rank_position < oldPos;
        });

        // The snapshot moves whether or not the announcement lands, so a
        // missing channel costs one announcement rather than repeating every
        // climb it has ever seen on the next message.
        this.lastLeaderboard.clear();
        newLeaderboard.forEach((u: LeaderboardUser) => {
            this.lastLeaderboard.set(u.username, u.rank_position);
        });

        if (climbs.length === 0) return;

        /*
         * This is a server-wide notice, not a reply.
         *
         * It went to `message.channel` — whichever channel the message that
         * happened to trigger the check was in. The ladder is the site's, so
         * most of what shows up here was earned on the website by people who
         * are not in that conversation and may not be in that channel at all,
         * and the leaderboard is cached for a minute, so a refresh would find
         * several of them at once and congratulate all of them in front of
         * whoever was talking.
         */
        const channel = await announcementChannel(this.client);
        if (!channel) return;

        for (const climber of climbs) {
            await channel.send(
                `⚔️ *Professor Buffy announces:* **${climber.name || climber.username}** just climbed to **#${climber.rank_position}** on the Leaderboard! The competition heats up! 🔥`
            ).catch(() => {
                // Missing Send Messages in the announcement channel is a server
                // setting, not something to crash a message handler over.
            });
        }
    }

    public getTopWeeklyUser() {
        let topUser: { id: string, name: string, xp: number, messages: number } | null = null;

        for (const [id, data] of this.weeklyActivity.entries()) {
            // Messages break the tie: everyone who reached the daily cap sits on
            // the same XP, and on a quiet week that is everyone on zero.
            const better = !topUser
                || data.xp > topUser.xp
                || (data.xp === topUser.xp && data.messages > topUser.messages);

            if (better) {
                topUser = { id, ...data };
            }
        }

        return topUser;
    }

    /**
     * Messages that earned an XP attempt — linked members, past the cooldown.
     *
     * This used to divide the tracked XP by 15 to arrive back at a count, which
     * only held while that XP was itself a flat 15 a message.
     */
    public getWeeklyMessageCount(): number {
        let total = 0;
        for (const data of this.weeklyActivity.values()) {
            total += data.messages;
        }
        return total;
    }

    public resetWeeklyActivity() {
        this.weeklyActivity.clear();
    }
}
