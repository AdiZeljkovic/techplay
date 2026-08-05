"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
class ApiService {
    constructor() {
        this.baseUrl = config_1.config.apiUrl;
        // Create axios instance with bot token header for authenticated requests
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
                'X-Discord-Bot-Token': config_1.config.botSecret || '',
            }
        });
    }
    static getInstance() {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }
    /**
     * Fetches the latest system status
     */
    async getSystemStatus() {
        try {
            const response = await this.client.get('/system/status');
            return response.data;
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch system status:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    /**
     * Fetches the latest news
     */
    async getLatestNews(limit = 5) {
        try {
            const response = await this.client.get('/news');
            return response.data.data ? response.data.data.slice(0, limit) : [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch news:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches the latest reviews
     */
    async getLatestReviews(limit = 5) {
        try {
            const response = await this.client.get('/reviews');
            return response.data.data ? response.data.data.slice(0, limit) : [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch reviews:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Searches articles by query string
     */
    async searchArticles(query) {
        try {
            const response = await this.client.get('/search/articles', { params: { q: query } });
            // SearchController returns { results, count }
            return response.data.results || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to search articles:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Searches the game database by name
     */
    async searchGames(query) {
        try {
            const response = await this.client.get('/search/games', { params: { q: query } });
            return response.data.results || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to search games:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches the latest guides
     */
    async getLatestGuides(limit = 5) {
        try {
            const response = await this.client.get('/guides');
            return response.data.data ? response.data.data.slice(0, limit) : [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch guides:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches the latest tech/hardware articles
     */
    async getLatestTech(limit = 5) {
        try {
            const response = await this.client.get('/tech');
            return response.data.data ? response.data.data.slice(0, limit) : [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch tech articles:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches the latest giveaways
     */
    async getActiveGiveaways() {
        try {
            const response = await this.client.get('/giveaways');
            return response.data.data || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch giveaways:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches active forum threads
     */
    async getActiveThreads() {
        try {
            const response = await this.client.get('/forum/active');
            return response.data.data || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch forum threads:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Fetches public user profile
     */
    async getUserProfile(username) {
        try {
            const response = await this.client.get(`/users/${username}`);
            return response.data;
        }
        catch (error) {
            console.error(`[ApiService] Failed to fetch user ${username}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    /**
     * Fetches user by Discord ID
     */
    async getUserByDiscordId(discordId) {
        try {
            const response = await this.client.get(`/discord/user/${discordId}`);
            return response.data;
        }
        catch (error) {
            // 404 is expected for unlinked users, don't log
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            console.error(`[ApiService] Failed to fetch user by Discord ID ${discordId}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    /**
     * Adds XP to a user via Discord ID
     */
    async addXp(discordId, xp) {
        try {
            const response = await this.client.post('/discord/xp', {
                discord_id: discordId,
                xp: xp
            });
            return response.data;
        }
        catch (error) {
            // 404 is expected for unlinked users, don't log
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            // 401 means bot secret is wrong - this is important
            if (axios_1.default.isAxiosError(error) && error.response?.status === 401) {
                console.error('[ApiService] XP request unauthorized - check DISCORD_BOT_SECRET');
                return null;
            }
            console.error(`[ApiService] Failed to add XP for ${discordId}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    /**
     * Fetches leaderboard
     */
    async getLeaderboard() {
        try {
            const response = await this.client.get('/discord/leaderboard');
            return response.data.data || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch leaderboard:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    /**
     * Claim daily bonus XP
     */
    async claimDailyBonus(discordId) {
        try {
            const response = await this.client.post('/discord/daily', {
                discord_id: discordId
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.status === 404) {
                return null; // User not linked
            }
            if (axios_1.default.isAxiosError(error) && error.response?.status === 429) {
                // Already claimed
                return {
                    already_claimed: true,
                    hours_left: error.response.data?.hours_left || 24
                };
            }
            console.error('[ApiService] Failed to claim daily bonus:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // SUBSCRIPTIONS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get all subscriptions
     */
    async getSubscriptions() {
        try {
            const response = await this.client.get('/discord/subscriptions');
            return response.data.data || [];
        }
        catch (error) {
            console.error('[ApiService] Failed to fetch subscriptions:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
    /**
     * Subscribe to notifications
     */
    async subscribe(discordId, type) {
        try {
            await this.client.post('/discord/subscriptions', {
                discord_id: discordId,
                type: type
            });
            return true;
        }
        catch (error) {
            console.error('[ApiService] Failed to subscribe:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    /**
     * Unsubscribe from notifications
     */
    async unsubscribe(discordId, type) {
        try {
            await this.client.delete('/discord/subscriptions', {
                data: { discord_id: discordId, type: type }
            });
            return true;
        }
        catch (error) {
            console.error('[ApiService] Failed to unsubscribe:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GIFT XP
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Gift XP from one user to another
     */
    async giftXp(senderDiscordId, receiverDiscordId, amount) {
        try {
            const response = await this.client.post('/discord/gift', {
                sender_discord_id: senderDiscordId,
                receiver_discord_id: receiverDiscordId,
                amount: amount
            });
            return { success: true, ...response.data };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
                return { success: false, error: error.response.data.message };
            }
            return { success: false, error: 'Failed to process gift' };
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // ADMIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Admin: Give XP to a user
     */
    async adminGiveXp(discordId, amount) {
        try {
            const response = await this.client.post('/discord/admin/xp/give', {
                discord_id: discordId,
                amount: amount
            });
            return { success: true, new_xp: response.data.new_xp };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
                return { success: false, error: error.response.data.message };
            }
            return { success: false, error: 'Failed to give XP' };
        }
    }
    /**
     * Admin: Remove XP from a user
     */
    async adminRemoveXp(discordId, amount) {
        try {
            const response = await this.client.post('/discord/admin/xp/remove', {
                discord_id: discordId,
                amount: amount
            });
            return { success: true, new_xp: response.data.new_xp };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
                return { success: false, error: error.response.data.message };
            }
            return { success: false, error: 'Failed to remove XP' };
        }
    }
    /**
     * Admin: Start an event
     */
    async adminStartEvent(eventName, durationHours) {
        try {
            await this.client.post('/discord/admin/event', {
                name: eventName,
                duration_hours: durationHours
            });
            return true;
        }
        catch (error) {
            console.error('[ApiService] Failed to start event:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
}
exports.ApiService = ApiService;
