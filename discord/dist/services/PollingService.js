"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingService = void 0;
const discord_js_1 = require("discord.js");
const ApiService_1 = require("./ApiService");
const BuffyService_1 = require("./BuffyService");
const config_1 = require("../config");
class PollingService {
    constructor(client) {
        this.checkInterval = null;
        // Target channel name
        this.CHANNEL_NAME = 'latest-news';
        this.feeds = [
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
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
        this.buffy = BuffyService_1.BuffyService.getInstance();
    }
    async start() {
        if (this.checkInterval)
            return;
        console.log('🔄 Polling Service Started (news, reviews, guides, tech → #latest-news)');
        // Await initialization so lastCheckedId is set before first poll
        await this.initializeFeeds();
        this.checkInterval = setInterval(() => this.checkAllFeeds(), config_1.config.checkInterval);
    }
    async initializeFeeds() {
        for (const feed of this.feeds) {
            const items = await this.fetchFeed(feed.type, 1);
            if (items.length > 0) {
                feed.lastCheckedId = items[0].id;
                console.log(`🔄 [PollingService] ${feed.type} initialized — last ID: ${feed.lastCheckedId}`);
            }
            else {
                console.warn(`⚠️ [PollingService] ${feed.type} init returned 0 items`);
            }
        }
    }
    async fetchFeed(type, limit) {
        switch (type) {
            case 'news': return this.api.getLatestNews(limit);
            case 'reviews': return this.api.getLatestReviews(limit);
            case 'guides': return this.api.getLatestGuides(limit);
            case 'tech': return this.api.getLatestTech(limit);
            default: return [];
        }
    }
    async checkAllFeeds() {
        for (const feed of this.feeds) {
            await this.checkFeed(feed);
        }
    }
    async checkFeed(feed) {
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
            const posted = await this.postToChannel(newItems, feed);
            // Only advance lastCheckedId if posting succeeded
            if (posted) {
                feed.lastCheckedId = Math.max(...newItems.map(n => n.id));
            }
        }
    }
    async postToChannel(items, feed) {
        // Prefer channel ID from env (reliable), fallback to name search
        const channelId = process.env.LATEST_NEWS_CHANNEL_ID;
        let channel;
        if (channelId) {
            const fetched = this.client.channels.cache.get(channelId)
                ?? await this.client.channels.fetch(channelId).catch(() => null);
            if (fetched?.isTextBased())
                channel = fetched;
        }
        if (!channel) {
            channel = this.client.channels.cache.find(c => c.isTextBased() && c.name === this.CHANNEL_NAME);
        }
        if (!channel) {
            console.error(`❌ [PollingService] Channel #${this.CHANNEL_NAME} not found — set LATEST_NEWS_CHANNEL_ID in .env or check bot permissions`);
            return false;
        }
        for (const item of items.reverse()) {
            const embed = new discord_js_1.EmbedBuilder()
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
        return true;
    }
}
exports.PollingService = PollingService;
