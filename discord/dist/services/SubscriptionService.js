"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const ApiService_1 = require("./ApiService");
const BuffyService_1 = require("./BuffyService");
/**
 * Manages user subscriptions for news and giveaway notifications.
 * Sends DMs when new content is detected.
 */
class SubscriptionService {
    constructor(client) {
        // In-memory subscription store (will be synced with backend)
        this.subscriptions = new Map();
        // Track last seen content to detect new items
        this.lastNewsId = null;
        this.lastGiveawayId = null;
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
        this.buffy = BuffyService_1.BuffyService.getInstance();
    }
    static getInstance(client) {
        if (!SubscriptionService.instance && client) {
            SubscriptionService.instance = new SubscriptionService(client);
        }
        return SubscriptionService.instance;
    }
    /**
     * Initialize the service - load subscriptions and set initial content IDs
     */
    async start() {
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
    async loadSubscriptions() {
        try {
            const subs = await this.api.getSubscriptions();
            if (subs) {
                this.subscriptions.clear();
                for (const sub of subs) {
                    if (!this.subscriptions.has(sub.discord_id)) {
                        this.subscriptions.set(sub.discord_id, new Set());
                    }
                    this.subscriptions.get(sub.discord_id).add(sub.type);
                }
                console.log(`📬 Loaded ${subs.length} subscriptions`);
            }
        }
        catch (error) {
            console.error('Failed to load subscriptions:', error);
        }
    }
    /**
     * Subscribe a user to notifications
     */
    async subscribe(discordId, type) {
        // Update local cache
        if (!this.subscriptions.has(discordId)) {
            this.subscriptions.set(discordId, new Set());
        }
        if (this.subscriptions.get(discordId).has(type)) {
            return false; // Already subscribed
        }
        this.subscriptions.get(discordId).add(type);
        // Save to backend
        await this.api.subscribe(discordId, type);
        return true;
    }
    /**
     * Unsubscribe a user from notifications
     */
    async unsubscribe(discordId, type) {
        if (!this.subscriptions.has(discordId) || !this.subscriptions.get(discordId).has(type)) {
            return false; // Not subscribed
        }
        this.subscriptions.get(discordId).delete(type);
        // Remove from backend
        await this.api.unsubscribe(discordId, type);
        return true;
    }
    /**
     * Check if user is subscribed to a type
     */
    isSubscribed(discordId, type) {
        return this.subscriptions.has(discordId) && this.subscriptions.get(discordId).has(type);
    }
    /**
     * Get all subscription types for a user
     */
    getUserSubscriptions(discordId) {
        if (!this.subscriptions.has(discordId)) {
            return [];
        }
        return Array.from(this.subscriptions.get(discordId));
    }
    /**
     * Check for new content and notify subscribers
     */
    async checkForNewContent() {
        await this.checkForNewNews();
        await this.checkForNewGiveaways();
    }
    /**
     * Check for new news articles
     */
    async checkForNewNews() {
        try {
            const news = await this.api.getLatestNews(1);
            if (news.length === 0)
                return;
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
        }
        catch (error) {
            console.error('Error checking for new news:', error);
        }
    }
    /**
     * Check for new giveaways
     */
    async checkForNewGiveaways() {
        try {
            const giveaways = await this.api.getActiveGiveaways();
            if (giveaways.length === 0)
                return;
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
        }
        catch (error) {
            console.error('Error checking for new giveaways:', error);
        }
    }
    /**
     * Send DM notifications to all subscribers of a type
     */
    async notifySubscribers(type, content) {
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
            }
            catch (error) {
                // User might have DMs disabled or left the server
                console.warn(`Could not DM user ${discordId}:`, error);
            }
        }
    }
    /**
     * Get all Discord IDs subscribed to a type
     */
    getSubscribersForType(type) {
        const subscribers = [];
        for (const [discordId, types] of this.subscriptions.entries()) {
            if (types.has(type)) {
                subscribers.push(discordId);
            }
        }
        return subscribers;
    }
}
exports.SubscriptionService = SubscriptionService;
