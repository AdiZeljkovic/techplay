import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { ApiService } from './ApiService';
import { BuffyService } from './BuffyService';
import { config } from '../config';

interface FeedTracker {
    lastCheckedId: number;
    type: 'news' | 'reviews' | 'guides' | 'tech';
    urlPrefix: string;
    emoji: string;
    label: string;
    color: number;
}

export class PollingService {
    private client: Client;
    private api: ApiService;
    private buffy: BuffyService;
    private checkInterval: NodeJS.Timeout | null = null;

    // Target channel name
    private readonly CHANNEL_NAME = 'latest-news';

    private feeds: FeedTracker[] = [
        {
            lastCheckedId: 0,
            type: 'news',
            urlPrefix: '/news/',
            emoji: '🚨',
            label: 'Breaking News',
            color: 0x3498db,
        },
        {
            lastCheckedId: 0,
            type: 'reviews',
            urlPrefix: '/reviews/',
            emoji: '⭐',
            label: 'New Review',
            color: 0x9b59b6,
        },
        {
            lastCheckedId: 0,
            type: 'guides',
            urlPrefix: '/guides/',
            emoji: '📖',
            label: 'New Guide',
            color: 0x2ecc71,
        },
        {
            lastCheckedId: 0,
            type: 'tech',
            urlPrefix: '/hardware/',
            emoji: '🔧',
            label: 'Tech & Hardware',
            color: 0xe67e22,
        },
    ];

    constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
        this.buffy = BuffyService.getInstance();
    }

    public async start() {
        if (this.checkInterval) return;

        console.log('🔄 Polling Service Started (news, reviews, guides, tech → #latest-news)');

        // Await initialization so lastCheckedId is set before first poll
        await this.initializeFeeds();

        this.checkInterval = setInterval(() => this.checkAllFeeds(), config.checkInterval);
    }

    private async initializeFeeds() {
        for (const feed of this.feeds) {
            const items = await this.fetchFeed(feed.type, 1);
            if (items.length > 0) {
                feed.lastCheckedId = items[0].id;
                console.log(`🔄 [PollingService] ${feed.type} initialized — last ID: ${feed.lastCheckedId}`);
            } else {
                console.warn(`⚠️ [PollingService] ${feed.type} init returned 0 items`);
            }
        }
    }

    private async fetchFeed(type: string, limit: number): Promise<any[]> {
        switch (type) {
            case 'news': return this.api.getLatestNews(limit);
            case 'reviews': return this.api.getLatestReviews(limit);
            case 'guides': return this.api.getLatestGuides(limit);
            case 'tech': return this.api.getLatestTech(limit);
            default: return [];
        }
    }

    private async checkAllFeeds() {
        for (const feed of this.feeds) {
            await this.checkFeed(feed);
        }
    }

    private async checkFeed(feed: FeedTracker) {
        const items = await this.fetchFeed(feed.type, 5);

        if (items.length === 0) {
            console.warn(`⚠️ [PollingService] ${feed.type} poll returned 0 items`);
            return;
        }

        const latestId = items[0].id;
        console.log(`🔍 [PollingService] ${feed.type} — latest API id: ${latestId}, lastCheckedId: ${feed.lastCheckedId}`);

        const newItems = items.filter(n => n.id > feed.lastCheckedId && feed.lastCheckedId !== 0);

        if (newItems.length > 0) {
            console.log(`📢 [PollingService] ${feed.type} — ${newItems.length} new item(s) found, posting...`);
            feed.lastCheckedId = Math.max(...newItems.map(n => n.id));
            await this.postToChannel(newItems, feed);
        }
    }

    private async postToChannel(items: any[], feed: FeedTracker) {
        const channel = this.client.channels.cache.find(
            c => c.isTextBased() && (c as TextChannel).name === this.CHANNEL_NAME
        ) as TextChannel;

        if (!channel) {
            console.error(`❌ [PollingService] Channel #${this.CHANNEL_NAME} not found — cannot post`);
            return;
        }

        for (const item of items.reverse()) {
            const embed = new EmbedBuilder()
                .setTitle(`${feed.emoji} ${feed.label}`)
                .setDescription(`**${item.title}**\n${item.excerpt || ''}`)
                .setURL(`https://techplay.gg${feed.urlPrefix}${item.slug}`)
                .setColor(feed.color)
                .setFooter({ text: `TechPlay.gg • ${feed.type.charAt(0).toUpperCase() + feed.type.slice(1)}` })
                .setTimestamp();

            // API returns featured_image_url, not image
            if (item.featured_image_url) {
                embed.setImage(item.featured_image_url);
            }

            await channel.send({ embeds: [embed] });
            console.log(`✅ [PollingService] Posted "${item.title}" to #${this.CHANNEL_NAME}`);
        }
    }
}
