import { Client, TextChannel } from 'discord.js';
import { ApiService } from './ApiService';
import { config } from '../config';

export class PollingService {
    private client: Client;
    private api: ApiService;
    private lastCheckedId: number = 0;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
    }

    public start() {
        if (this.checkInterval) return;

        console.log('🔄 Polling Service Started');
        // Initial fetch to set the last ID without posting
        this.initializeLastId();

        this.checkInterval = setInterval(() => this.checkNews(), config.checkInterval);
    }

    private async initializeLastId() {
        const news = await this.api.getLatestNews(1);
        if (news.length > 0) {
            this.lastCheckedId = news[0].id;
        }
    }

    private async checkNews() {
        const news = await this.api.getLatestNews(5);
        if (news.length === 0) return;

        // Filter for new items
        const newItems = news.filter(n => n.id > this.lastCheckedId && this.lastCheckedId !== 0);

        if (newItems.length > 0) {
            // Update last ID to the newest one
            this.lastCheckedId = Math.max(...newItems.map(n => n.id));

            // Post to channel
            this.postToChannel(newItems);
        }
    }

    private async postToChannel(items: any[]) {
        // TODO: Move channel ID to config/env
        // Finding a channel named 'news' or 'announcements'
        const channel = this.client.channels.cache.find(
            c => c.isTextBased() && (c as TextChannel).name.includes('news')
        ) as TextChannel;

        if (channel) {
            for (const item of items.reverse()) { // Post oldest first
                await channel.send({
                    content: `🚨 **Breaking News!**\n\n**${item.title}**\n${item.excerpt}\n\n👉 Read more: https://techplay.gg/news/${item.slug}`
                });
            }
        }
    }
}
