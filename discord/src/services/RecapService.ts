import { Client, EmbedBuilder } from 'discord.js';
import { ApiService } from './ApiService';
import { XpService } from './XpService';
import { announcementChannel } from './AnnouncementChannel';
import * as cron from 'node-cron';

export class RecapService {
    private client: Client;
    private api: ApiService;

    constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
    }

    public start() {
        cron.schedule('0 20 * * 0', () => {
            this.postWeeklyRecap();
        });

        console.log('📅 Weekly Recap service scheduled (Sundays at 20:00)');
    }

    public async postWeeklyRecap() {
        try {
            const leaderboard = await this.api.getLeaderboard();
            const topUsers = leaderboard.slice(0, 5);
            const news = await this.api.getLatestNews(3);
            const status = await this.api.getSystemStatus();

            // Get Member of the Week from XpService
            const xpService = XpService.getInstance(this.client);
            const topWeekly = xpService.getTopWeeklyUser();

            const embed = new EmbedBuilder()
                .setTitle('📊 TechPlay Weekly Recap')
                .setDescription('Here is what happened this week in our community!')
                .setColor(0x5865F2)
                .setThumbnail(this.client.user?.displayAvatarURL() || null)
                .addFields(
                    {
                        name: '🏆 Member of the Week',
                        value: topWeekly
                            // The daily cap can leave the busiest member on zero
                            // XP for the week, and "Gained 0 XP" is not a prize.
                            // Their messages are the honest number to show then.
                            ? (topWeekly.xp > 0
                                ? `🌟 **${topWeekly.name}**\nGained **${topWeekly.xp} XP** this week! Congrats! 🎊`
                                : `🌟 **${topWeekly.name}**\n**${topWeekly.messages}** messages this week! Congrats! 🎊`)
                            : 'No active members this week.'
                    },
                    {
                        name: '🥇 All-Time Top Gamers',
                        value: topUsers.length > 0
                            ? topUsers.map(u => `**#${u.rank_position}** ${u.name} (${u.xp} XP)`).join('\n')
                            : 'No data yet.'
                    },
                    {
                        name: '📰 Latest Articles',
                        value: news.length > 0
                            ? news.map(n => `🔹 [${n.title}](https://techplay.gg/news/${n.slug})`).join('\n')
                            : 'No news this week.'
                    },
                    {
                        name: '📈 Server Status',
                        value: `Version: ${status?.version || 'Unknown'}\nStatus: ${status?.status || 'Active'}`
                    }
                )
                .setFooter({ text: 'Stay tuned for more updates next week!' })
                .setTimestamp();

            const channel = await announcementChannel(this.client);
            if (channel) {
                await channel.send({ content: '📢 **Weekly Recap is here!**', embeds: [embed] });

                // RESET weekly activity after recap
                xpService.resetWeeklyActivity();
                console.log('✅ Weekly recap posted and activity reset.');
            }
        } catch (error) {
            console.error('Failed to post weekly recap:', error);
        }
    }
}
