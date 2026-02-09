import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { ApiService } from './ApiService';
import { BuffyService } from './BuffyService';
import { config } from '../config';

interface FeedTracker {
    lastCheckedId: number;
    type: 'news' | 'reviews';
    urlPrefix: string;
    channelKeyword: string;
    emoji: string;
    label: string;
}

export class PollingService {
    private client: Client;
    private api: ApiService;
    private buffy: BuffyService;
    private checkInterval: NodeJS.Timeout | null = null;

    private feeds: FeedTracker[] = [
        {
            lastCheckedId: 0,
            type: 'news',
            urlPrefix: '/news/',
            channelKeyword: 'news',
            emoji: '🚨',
            label: 'Breaking News',
        },
        {
            lastCheckedId: 0,
            type: 'reviews',
            urlPrefix: '/reviews/',
            channelKeyword: 'reviews',
            emoji: '⭐',
            label: 'New Review',
        },
    ];

    constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
        this.buffy = BuffyService.getInstance();
    }

    public start() {
        if (this.checkInterval) return;

        console.log('🔄 Polling Service Started (news + reviews)');
        this.initializeFeeds();

        this.checkInterval = setInterval(() => this.checkAllFeeds(), config.checkInterval);
    }

    private async initializeFeeds() {
        // Set initial IDs without posting
        const news = await this.api.getLatestNews(1);
        if (news.length > 0) {
            this.feeds[0].lastCheckedId = news[0].id;
        }

        const reviews = await this.api.getLatestReviews(1);
        if (reviews.length > 0) {
            this.feeds[1].lastCheckedId = reviews[0].id;
        }
    }

    private async checkAllFeeds() {
        for (const feed of this.feeds) {
            await this.checkFeed(feed);
        }
    }

    private async checkFeed(feed: FeedTracker) {
        const items = feed.type === 'news'
            ? await this.api.getLatestNews(5)
            : await this.api.getLatestReviews(5);

        if (items.length === 0) return;

        const newItems = items.filter(n => n.id > feed.lastCheckedId && feed.lastCheckedId !== 0);

        if (newItems.length > 0) {
            feed.lastCheckedId = Math.max(...newItems.map(n => n.id));
            await this.postToChannel(newItems, feed);
        }
    }

    private async postToChannel(items: any[], feed: FeedTracker) {
        // Try to find a matching channel, fallback to 'news' or 'general'
        const channel = this.client.channels.cache.find(
            c => c.isTextBased() && (
                (c as TextChannel).name.includes(feed.channelKeyword) ||
                (c as TextChannel).name.includes('news') ||
                (c as TextChannel).name.includes('general')
            )
        ) as TextChannel;

        if (channel) {
            for (const item of items.reverse()) {
                const embed = new EmbedBuilder()
                    .setTitle(`${feed.emoji} ${feed.label}`)
                    .setDescription(`**${item.title}**\n${item.excerpt || ''}`)
                    .setURL(`https://techplay.gg${feed.urlPrefix}${item.slug}`)
                    .setColor(feed.type === 'reviews' ? 0x9b59b6 : 0x3498db)
                    .setFooter({ text: 'TechPlay.gg' })
                    .setTimestamp();

                await channel.send({ embeds: [embed] });
            }
        }
    }
}
