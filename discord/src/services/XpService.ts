import { Client, Events, Message, TextChannel } from 'discord.js';
import { ApiService } from './ApiService';

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
    private cooldowns: Set<string> = new Set();
    private lastLeaderboard: Map<string, number> = new Map();
    private weeklyActivity: Map<string, { name: string, xp: number }> = new Map();

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

        if (this.cooldowns.has(message.author.id)) {
            return;
        }

        this.cooldowns.add(message.author.id);
        setTimeout(() => this.cooldowns.delete(message.author.id), this.COOLDOWN_SECONDS * 1000);

        const xpResponse = await this.api.addXp(message.author.id, this.XP_PER_MESSAGE);

        if (xpResponse) {
            // Track weekly activity
            const current = this.weeklyActivity.get(message.author.id) || { name: message.author.username, xp: 0 };
            this.weeklyActivity.set(message.author.id, {
                name: message.author.username,
                xp: current.xp + this.XP_PER_MESSAGE
            });

            const channel = message.channel as TextChannel;

            if (xpResponse.rank_up) {
                channel.send(`🎉 **Level Up!** ${message.author} is now **${xpResponse.new_rank}**!`);
            }

            // Announce achievements
            if (xpResponse.achievements_unlocked && xpResponse.achievements_unlocked.length > 0) {
                for (const achievement of xpResponse.achievements_unlocked) {
                    channel.send(`🏆 **Achievement Unlocked!** ${message.author} earned **${achievement.name}**! ${achievement.description}`);
                }
            }

            await this.checkOvertakes(message);
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

    private async checkOvertakes(message: Message) {
        const newLeaderboard = await this.getCachedLeaderboard();
        const channel = message.channel as TextChannel;

        for (const currentUser of newLeaderboard) {
            const oldPos = this.lastLeaderboard.get(currentUser.username);
            const newPos = currentUser.rank_position;

            if (oldPos !== undefined && newPos < oldPos) {
                channel.send(`⚔️ **Watch out!** @${currentUser.username} just moved up to **#${newPos}** on the Leaderboard!`);
            }
        }

        this.lastLeaderboard.clear();
        newLeaderboard.forEach((u: LeaderboardUser) => {
            this.lastLeaderboard.set(u.username, u.rank_position);
        });
    }

    public getTopWeeklyUser() {
        let topUser = null;
        let maxXP = -1;

        for (const [id, data] of this.weeklyActivity.entries()) {
            if (data.xp > maxXP) {
                maxXP = data.xp;
                topUser = { id, ...data };
            }
        }

        return topUser;
    }

    public resetWeeklyActivity() {
        this.weeklyActivity.clear();
    }
}
