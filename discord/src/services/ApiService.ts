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
}
