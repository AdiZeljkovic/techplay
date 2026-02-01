import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

interface NewsItem {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    created_at: string;
}

interface LeaderboardUser {
    rank_position: number;
    username: string;
    name: string;
    xp: number;
    rank_title: string;
}

export class ApiService {
    private static instance: ApiService;
    private readonly baseUrl: string;
    private readonly client: AxiosInstance;

    private constructor() {
        this.baseUrl = config.apiUrl;

        // Create axios instance with bot token header for authenticated requests
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 10000, // 10 second timeout
            headers: {
                'Content-Type': 'application/json',
                'X-Discord-Bot-Token': config.botSecret || '',
            }
        });
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    /**
     * Fetches the latest system status
     */
    public async getSystemStatus(): Promise<{ status: string; version: string } | null> {
        try {
            const response = await this.client.get('/system/status');
            return response.data;
        } catch (error) {
            console.error('[ApiService] Failed to fetch system status:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Fetches the latest news
     */
    public async getLatestNews(limit: number = 5): Promise<NewsItem[]> {
        try {
            const response = await this.client.get('/news');
            return response.data.data ? response.data.data.slice(0, limit) : [];
        } catch (error) {
            console.error('[ApiService] Failed to fetch news:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }

    /**
     * Fetches the latest giveaways
     */
    public async getActiveGiveaways(): Promise<any[]> {
        try {
            const response = await this.client.get('/giveaways');
            return response.data.data || [];
        } catch (error) {
            console.error('[ApiService] Failed to fetch giveaways:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }

    /**
     * Fetches active forum threads
     */
    public async getActiveThreads(): Promise<any[]> {
        try {
            const response = await this.client.get('/forum/active');
            return response.data.data || [];
        } catch (error) {
            console.error('[ApiService] Failed to fetch forum threads:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }

    /**
     * Fetches public user profile
     */
    public async getUserProfile(username: string): Promise<any | null> {
        try {
            const response = await this.client.get(`/users/${username}`);
            return response.data;
        } catch (error) {
            console.error(`[ApiService] Failed to fetch user ${username}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Fetches user by Discord ID
     */
    public async getUserByDiscordId(discordId: string): Promise<any | null> {
        try {
            const response = await this.client.get(`/discord/user/${discordId}`);
            return response.data;
        } catch (error) {
            // 404 is expected for unlinked users, don't log
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            console.error(`[ApiService] Failed to fetch user by Discord ID ${discordId}:`, error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Adds XP to a user via Discord ID
     */
    public async addXp(discordId: string, xp: number): Promise<any | null> {
        try {
            const response = await this.client.post('/discord/xp', {
                discord_id: discordId,
                xp: xp
            });
            return response.data;
        } catch (error) {
            // 404 is expected for unlinked users, don't log
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            // 401 means bot secret is wrong - this is important
            if (axios.isAxiosError(error) && error.response?.status === 401) {
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
    public async getLeaderboard(): Promise<LeaderboardUser[]> {
        try {
            const response = await this.client.get('/discord/leaderboard');
            return response.data.data || [];
        } catch (error) {
            console.error('[ApiService] Failed to fetch leaderboard:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }

    /**
     * Claim daily bonus XP
     */
    public async claimDailyBonus(discordId: string): Promise<{
        already_claimed?: boolean;
        hours_left?: number;
        xp_awarded?: number;
        streak?: number;
        total_xp?: number;
    } | null> {
        try {
            const response = await this.client.post('/discord/daily', {
                discord_id: discordId
            });
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null; // User not linked
            }
            if (axios.isAxiosError(error) && error.response?.status === 429) {
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
    public async getSubscriptions(): Promise<Array<{ discord_id: string; type: string }> | null> {
        try {
            const response = await this.client.get('/discord/subscriptions');
            return response.data.data || [];
        } catch (error) {
            console.error('[ApiService] Failed to fetch subscriptions:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }

    /**
     * Subscribe to notifications
     */
    public async subscribe(discordId: string, type: string): Promise<boolean> {
        try {
            await this.client.post('/discord/subscriptions', {
                discord_id: discordId,
                type: type
            });
            return true;
        } catch (error) {
            console.error('[ApiService] Failed to subscribe:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    /**
     * Unsubscribe from notifications
     */
    public async unsubscribe(discordId: string, type: string): Promise<boolean> {
        try {
            await this.client.delete('/discord/subscriptions', {
                data: { discord_id: discordId, type: type }
            });
            return true;
        } catch (error) {
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
    public async giftXp(senderDiscordId: string, receiverDiscordId: string, amount: number): Promise<{
        success: boolean;
        error?: string;
        sender_new_xp?: number;
        receiver_new_xp?: number;
    }> {
        try {
            const response = await this.client.post('/discord/gift', {
                sender_discord_id: senderDiscordId,
                receiver_discord_id: receiverDiscordId,
                amount: amount
            });
            return { success: true, ...response.data };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
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
    public async adminGiveXp(discordId: string, amount: number): Promise<{
        success: boolean;
        new_xp?: number;
        error?: string;
    }> {
        try {
            const response = await this.client.post('/discord/admin/xp/give', {
                discord_id: discordId,
                amount: amount
            });
            return { success: true, new_xp: response.data.new_xp };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                return { success: false, error: error.response.data.message };
            }
            return { success: false, error: 'Failed to give XP' };
        }
    }

    /**
     * Admin: Remove XP from a user
     */
    public async adminRemoveXp(discordId: string, amount: number): Promise<{
        success: boolean;
        new_xp?: number;
        error?: string;
    }> {
        try {
            const response = await this.client.post('/discord/admin/xp/remove', {
                discord_id: discordId,
                amount: amount
            });
            return { success: true, new_xp: response.data.new_xp };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                return { success: false, error: error.response.data.message };
            }
            return { success: false, error: 'Failed to remove XP' };
        }
    }

    /**
     * Admin: Start an event
     */
    public async adminStartEvent(eventName: string, durationHours: number): Promise<boolean> {
        try {
            await this.client.post('/discord/admin/event', {
                name: eventName,
                duration_hours: durationHours
            });
            return true;
        } catch (error) {
            console.error('[ApiService] Failed to start event:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }
}
