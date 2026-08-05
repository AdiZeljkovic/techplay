"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpService = void 0;
const discord_js_1 = require("discord.js");
const ApiService_1 = require("./ApiService");
const BuffyService_1 = require("./BuffyService");
class XpService {
    constructor(client) {
        this.cooldowns = new Set();
        this.lastLeaderboard = new Map();
        this.weeklyActivity = new Map();
        // Leaderboard cache
        this.leaderboardCache = [];
        this.leaderboardCacheTime = 0;
        this.LEADERBOARD_CACHE_TTL = 60000; // 60 seconds
        // Configuration
        this.XP_PER_MESSAGE = 15;
        this.COOLDOWN_SECONDS = 60;
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
        this.buffy = BuffyService_1.BuffyService.getInstance();
    }
    static getInstance(client) {
        if (!XpService.instance && client) {
            XpService.instance = new XpService(client);
        }
        return XpService.instance;
    }
    async start() {
        await this.syncLeaderboardCache();
        this.client.on(discord_js_1.Events.MessageCreate, async (message) => {
            await this.handleMessage(message);
        });
        console.log('⭐ XP Service started - tracking activity');
    }
    async syncLeaderboardCache() {
        const leaderboard = await this.getCachedLeaderboard();
        this.lastLeaderboard.clear();
        leaderboard.forEach((u) => {
            this.lastLeaderboard.set(u.username, u.rank_position);
        });
    }
    async handleMessage(message) {
        if (message.author.bot)
            return;
        if (!message.guild)
            return;
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
            const channel = message.channel;
            // Announce rank up with Buffy embed
            if (xpResponse.rank_up) {
                const embed = this.buffy.createLevelUpEmbed(message.author.username, xpResponse.new_rank, xpResponse.new_xp || 0);
                channel.send({ embeds: [embed] });
            }
            // Announce achievements with Buffy embed
            if (xpResponse.achievements_unlocked && xpResponse.achievements_unlocked.length > 0) {
                for (const achievement of xpResponse.achievements_unlocked) {
                    const embed = this.buffy.createAchievementEmbed(message.author.username, achievement.name, achievement.description || '');
                    channel.send({ embeds: [embed] });
                }
            }
            await this.checkOvertakes(message);
        }
    }
    async getCachedLeaderboard() {
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
        }
        catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            // Return stale cache if available
            return this.leaderboardCache;
        }
    }
    async checkOvertakes(message) {
        const newLeaderboard = await this.getCachedLeaderboard();
        const channel = message.channel;
        for (const currentUser of newLeaderboard) {
            const oldPos = this.lastLeaderboard.get(currentUser.username);
            const newPos = currentUser.rank_position;
            if (oldPos !== undefined && newPos < oldPos) {
                channel.send(`⚔️ *Professor Buffy announces:* **${currentUser.name || currentUser.username}** just climbed to **#${newPos}** on the Leaderboard! The competition heats up! 🔥`);
            }
        }
        this.lastLeaderboard.clear();
        newLeaderboard.forEach((u) => {
            this.lastLeaderboard.set(u.username, u.rank_position);
        });
    }
    getTopWeeklyUser() {
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
    getWeeklyMessageCount() {
        let total = 0;
        for (const data of this.weeklyActivity.values()) {
            total += Math.round(data.xp / this.XP_PER_MESSAGE);
        }
        return total;
    }
    resetWeeklyActivity() {
        this.weeklyActivity.clear();
    }
}
exports.XpService = XpService;
