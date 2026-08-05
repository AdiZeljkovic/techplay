"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecapService = void 0;
const discord_js_1 = require("discord.js");
const ApiService_1 = require("./ApiService");
const XpService_1 = require("./XpService");
const config_1 = require("../config");
const cron = __importStar(require("node-cron"));
class RecapService {
    constructor(client) {
        this.CHANNEL_ID = config_1.config.recapChannelId;
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
    }
    start() {
        cron.schedule('0 20 * * 0', () => {
            this.postWeeklyRecap();
        });
        console.log('📅 Weekly Recap service scheduled (Sundays at 20:00)');
    }
    async postWeeklyRecap() {
        try {
            const leaderboard = await this.api.getLeaderboard();
            const topUsers = leaderboard.slice(0, 5);
            const news = await this.api.getLatestNews(3);
            const status = await this.api.getSystemStatus();
            // Get Member of the Week from XpService
            const xpService = XpService_1.XpService.getInstance(this.client);
            const topWeekly = xpService.getTopWeeklyUser();
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('📊 TechPlay Weekly Recap')
                .setDescription('Here is what happened this week in our community!')
                .setColor(0x5865F2)
                .setThumbnail(this.client.user?.displayAvatarURL() || null)
                .addFields({
                name: '🏆 Member of the Week',
                value: topWeekly
                    ? `🌟 **${topWeekly.name}**\nGained **${topWeekly.xp} XP** this week! Congrats! 🎊`
                    : 'No active members this week.'
            }, {
                name: '🥇 All-Time Top Gamers',
                value: topUsers.length > 0
                    ? topUsers.map(u => `**#${u.rank_position}** ${u.name} (${u.xp} XP)`).join('\n')
                    : 'No data yet.'
            }, {
                name: '📰 Latest Articles',
                value: news.length > 0
                    ? news.map(n => `🔹 [${n.title}](https://techplay.gg/news/${n.slug})`).join('\n')
                    : 'No news this week.'
            }, {
                name: '📈 Server Status',
                value: `Version: ${status?.version || 'Unknown'}\nStatus: ${status?.status || 'Active'}`
            })
                .setFooter({ text: 'Stay tuned for more updates next week!' })
                .setTimestamp();
            const channel = this.getAnnouncementChannel();
            if (channel) {
                await channel.send({ content: '📢 **Weekly Recap is here!**', embeds: [embed] });
                // RESET weekly activity after recap
                xpService.resetWeeklyActivity();
                console.log('✅ Weekly recap posted and activity reset.');
            }
        }
        catch (error) {
            console.error('Failed to post weekly recap:', error);
        }
    }
    getAnnouncementChannel() {
        if (this.CHANNEL_ID) {
            return this.client.channels.cache.get(this.CHANNEL_ID);
        }
        const guild = this.client.guilds.cache.first();
        if (!guild)
            return null;
        return guild.channels.cache.find(c => c.name === 'announcements' || c.name === 'general' || c.name === 'news');
    }
}
exports.RecapService = RecapService;
