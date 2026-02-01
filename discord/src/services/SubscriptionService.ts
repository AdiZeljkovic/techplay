import { Client, User } from 'discord.js';
import { ApiService } from './ApiService';
import { BuffyService } from './BuffyService';

export type SubscriptionType = 'news' | 'giveaway';

interface Subscription {
    discordId: string;
    type: SubscriptionType;
    subscribedAt: Date;
}

/**
 * Manages user subscriptions for news and giveaway notifications.
 * Sends DMs when new content is detected.
 */
export class SubscriptionService {
    private static instance: SubscriptionService;
    private client: Client;
    private api: ApiService;
    private buffy: BuffyService;

    // In-memory subscription store (will be synced with backend)
    private subscriptions: Map<string, Set<SubscriptionType>> = new Map();

    // Track last seen content to detect new items
    private lastNewsId: number | null = null;
    private lastGiveawayId: number | null = null;

    private constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
        this.buffy = BuffyService.getInstance();
    }

    public static getInstance(client?: Client): SubscriptionService {
        if (!SubscriptionService.instance && client) {
            SubscriptionService.instance = new SubscriptionService(client);
        }
        return SubscriptionService.instance;
    }

    /**
     * Initialize the service - load subscriptions and set initial content IDs
     */
    public async start() {
        // Load subscriptions from backend
        await this.loadSubscriptions();

        // Get initial content IDs
        const news = await this.api.getLatestNews(1);
        if (news.length > 0) {
            this.lastNewsId = news[0].id;
        }

        const giveaways = await this.api.getActiveGiveaways();
        if (giveaways.length > 0) {
            this.lastGiveawayId = giveaways[0].id;
        }

        // Start polling for new content every 5 minutes
        setInterval(() => this.checkForNewContent(), 5 * 60 * 1000);

        console.log('📬 Subscription Service started');
    }

    /**
     * Load subscriptions from backend
     */
    private async loadSubscriptions() {
        try {
            const subs = await this.api.getSubscriptions();
            if (subs) {
                this.subscriptions.clear();
                for (const sub of subs) {
                    if (!this.subscriptions.has(sub.discord_id)) {
                        this.subscriptions.set(sub.discord_id, new Set());
                    }
                    this.subscriptions.get(sub.discord_id)!.add(sub.type as SubscriptionType);
                }
                console.log(`📬 Loaded ${subs.length} subscriptions`);
            }
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        }
    }

    /**
     * Subscribe a user to notifications
     */
    public async subscribe(discordId: string, type: SubscriptionType): Promise<boolean> {
        // Update local cache
        if (!this.subscriptions.has(discordId)) {
            this.subscriptions.set(discordId, new Set());
        }

        if (this.subscriptions.get(discordId)!.has(type)) {
            return false; // Already subscribed
        }

        this.subscriptions.get(discordId)!.add(type);

        // Save to backend
        await this.api.subscribe(discordId, type);

        return true;
    }

    /**
     * Unsubscribe a user from notifications
     */
    public async unsubscribe(discordId: string, type: SubscriptionType): Promise<boolean> {
        if (!this.subscriptions.has(discordId) || !this.subscriptions.get(discordId)!.has(type)) {
            return false; // Not subscribed
        }

        this.subscriptions.get(discordId)!.delete(type);

        // Remove from backend
        await this.api.unsubscribe(discordId, type);

        return true;
    }

    /**
     * Check if user is subscribed to a type
     */
    public isSubscribed(discordId: string, type: SubscriptionType): boolean {
        return this.subscriptions.has(discordId) && this.subscriptions.get(discordId)!.has(type);
    }

    /**
     * Get all subscription types for a user
     */
    public getUserSubscriptions(discordId: string): SubscriptionType[] {
        if (!this.subscriptions.has(discordId)) {
            return [];
        }
        return Array.from(this.subscriptions.get(discordId)!);
    }

    /**
     * Check for new content and notify subscribers
     */
    private async checkForNewContent() {
        await this.checkForNewNews();
        await this.checkForNewGiveaways();
    }

    /**
     * Check for new news articles
     */
    private async checkForNewNews() {
        try {
            const news = await this.api.getLatestNews(1);
            if (news.length === 0) return;

            const latestNews = news[0];

            // If we have a new article
            if (this.lastNewsId !== null && latestNews.id !== this.lastNewsId) {
                console.log(`📰 New article detected: ${latestNews.title}`);
                await this.notifySubscribers('news', {
                    title: latestNews.title,
                    excerpt: latestNews.excerpt,
                    url: `https://techplay.gg/news/${latestNews.slug}`
                });
            }

            this.lastNewsId = latestNews.id;
        } catch (error) {
            console.error('Error checking for new news:', error);
        }
    }

    /**
     * Check for new giveaways
     */
    private async checkForNewGiveaways() {
        try {
            const giveaways = await this.api.getActiveGiveaways();
            if (giveaways.length === 0) return;

            const latestGiveaway = giveaways[0];

            // If we have a new giveaway
            if (this.lastGiveawayId !== null && latestGiveaway.id !== this.lastGiveawayId) {
                console.log(`🎁 New giveaway detected: ${latestGiveaway.title}`);
                await this.notifySubscribers('giveaway', {
                    title: latestGiveaway.title,
                    endDate: latestGiveaway.end_date,
                    url: `https://techplay.gg/giveaways/${latestGiveaway.slug}`
                });
            }

            this.lastGiveawayId = latestGiveaway.id;
        } catch (error) {
            console.error('Error checking for new giveaways:', error);
        }
    }

    /**
     * Send DM notifications to all subscribers of a type
     */
    private async notifySubscribers(type: SubscriptionType, content: any) {
        const subscribers = this.getSubscribersForType(type);
        console.log(`📬 Notifying ${subscribers.length} ${type} subscribers`);

        for (const discordId of subscribers) {
            try {
                const user = await this.client.users.fetch(discordId);
                if (user) {
                    const embed = type === 'news'
                        ? this.buffy.createNewsNotificationEmbed(content.title, content.excerpt, content.url)
                        : this.buffy.createGiveawayNotificationEmbed(content.title, content.endDate, content.url);

                    await user.send({ embeds: [embed] });
                }
            } catch (error) {
                // User might have DMs disabled or left the server
                console.warn(`Could not DM user ${discordId}:`, error);
            }
        }
    }

    /**
     * Get all Discord IDs subscribed to a type
     */
    private getSubscribersForType(type: SubscriptionType): string[] {
        const subscribers: string[] = [];
        for (const [discordId, types] of this.subscriptions.entries()) {
            if (types.has(type)) {
                subscribers.push(discordId);
            }
        }
        return subscribers;
    }
}
