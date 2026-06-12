import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Privee Video Polling Service
// Polls the Privee API for new videos and posts them to #social-media
// ═══════════════════════════════════════════════════════════════════════════════

const PRIVEE_API_BASE = process.env.PRIVEE_API_URL || 'https://38wzs9wt1a.execute-api.eu-central-1.amazonaws.com';

interface PriveeMovie {
    id: string;
    title: string;
    status: string;
    lastUploadedVisual?: {
        thumbnailPathSafe: string;
        title: string;
        viewCount: number;
    };
}

interface PriveeVisual {
    id: string;
    title: string;
    viewCount: number;
    reactionCount: number;
    commentCount: number;
    createdAt: string;
    media: {
        path: string;
        baseMediaPath?: string;
        thumbnailImagePath: string;
        thumbnailPath: string;
    };
}

export class PriveeService {
    private client: Client;
    private checkInterval: NodeJS.Timeout | null = null;

    // Target channel
    private readonly CHANNEL_NAME = 'social-media';

    // Track last seen visual IDs per movie to detect new uploads
    private lastSeenVisualIds: Map<string, Set<string>> = new Map();
    private initialized = false;

    // Poll every 10 minutes
    private readonly POLL_INTERVAL = 10 * 60 * 1000;

    constructor(client: Client) {
        this.client = client;
    }

    public async start() {
        if (this.checkInterval) return;

        console.log('🎬 Privee Service Started (polling for new videos → #social-media)');

        // Initialize — record current visuals without posting
        await this.initializeVisualCache();

        // Start polling
        this.checkInterval = setInterval(() => this.checkForNewVideos(), this.POLL_INTERVAL);
    }

    public stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Fetch all movies and their visuals to build the initial cache
     */
    private async initializeVisualCache() {
        try {
            const movies = await this.fetchMovies();

            for (const movie of movies) {
                const visuals = await this.fetchVisuals(movie.id);
                const visualIds = new Set(visuals.map(v => v.id));
                this.lastSeenVisualIds.set(movie.id, visualIds);
            }

            this.initialized = true;
            const totalVisuals = Array.from(this.lastSeenVisualIds.values()).reduce((sum, set) => sum + set.size, 0);
            console.log(`🎬 Privee cache initialized: ${movies.length} movies, ${totalVisuals} visuals tracked`);
        } catch (error) {
            console.error('Failed to initialize Privee visual cache:', error);
        }
    }

    /**
     * Check for new videos across all movies
     */
    private async checkForNewVideos() {
        if (!this.initialized) return;

        try {
            const movies = await this.fetchMovies();

            // Drop cache entries for movies that no longer exist so the map can't grow forever
            const currentMovieIds = new Set(movies.map(m => m.id));
            for (const movieId of this.lastSeenVisualIds.keys()) {
                if (!currentMovieIds.has(movieId)) {
                    this.lastSeenVisualIds.delete(movieId);
                }
            }

            for (const movie of movies) {
                const visuals = await this.fetchVisuals(movie.id);
                const previousIds = this.lastSeenVisualIds.get(movie.id) || new Set();

                // Find new visuals
                const newVisuals = visuals.filter(v => !previousIds.has(v.id));

                if (newVisuals.length > 0) {
                    console.log(`🎬 Found ${newVisuals.length} new video(s) in "${movie.title}"`);
                    const posted = await this.postNewVideos(movie, newVisuals);
                    // Only update cache if posting succeeded
                    if (posted) {
                        this.lastSeenVisualIds.set(movie.id, new Set(visuals.map(v => v.id)));
                    }
                } else {
                    // No new visuals — still update cache
                    this.lastSeenVisualIds.set(movie.id, new Set(visuals.map(v => v.id)));
                }
            }
        } catch (error) {
            console.error('Error checking for new Privee videos:', error);
        }
    }

    /**
     * Post new video notifications to #social-media
     */
    private async postNewVideos(movie: PriveeMovie, visuals: PriveeVisual[]): Promise<boolean> {
        const channelId = process.env.SOCIAL_MEDIA_CHANNEL_ID;
        let channel: TextChannel | undefined;

        if (channelId) {
            const fetched = this.client.channels.cache.get(channelId)
                ?? await this.client.channels.fetch(channelId).catch(() => null);
            if (fetched?.isTextBased()) channel = fetched as TextChannel;
        }

        if (!channel) {
            channel = this.client.channels.cache.find(
                c => c.isTextBased() && (c as TextChannel).name === this.CHANNEL_NAME
            ) as TextChannel;
        }

        if (!channel) {
            console.error(`❌ [PriveeService] Channel #${this.CHANNEL_NAME} not found — set SOCIAL_MEDIA_CHANNEL_ID in .env or check bot permissions`);
            return false;
        }

        for (const visual of visuals) {
            const embed = new EmbedBuilder()
                .setTitle(`🎬 New Video: ${visual.title}`)
                .setDescription(
                    `A new video has been uploaded to **${movie.title}** on Privee!\n\n` +
                    `👁️ Views: **${visual.viewCount}** • ❤️ Reactions: **${visual.reactionCount}** • 💬 Comments: **${visual.commentCount}**`
                )
                .setURL('https://techplay.gg/videos')
                .setColor(0x8B5CF6) // Purple to match Privee branding
                .setFooter({ text: 'Privee • TechPlay.gg' })
                .setTimestamp(new Date(visual.createdAt));

            // Add thumbnail if available
            if (visual.media?.thumbnailImagePath) {
                embed.setImage(visual.media.thumbnailImagePath);
            } else if (visual.media?.thumbnailPath) {
                embed.setImage(visual.media.thumbnailPath);
            }

            await channel.send({
                content: '🎥 **New video just dropped on Privee!**',
                embeds: [embed]
            });
            console.log(`✅ [PriveeService] Posted "${visual.title}" to #${this.CHANNEL_NAME}`);
        }
        return true;
    }

    /**
     * Fetch movies from the Privee API
     */
    private async fetchMovies(): Promise<PriveeMovie[]> {
        try {
            const response = await axios.get(
                `${PRIVEE_API_BASE}/users/get-public-movies-by-user-id`,
                { params: { userId: config.priveeUserId } }
            );
            const movies = response.data?.data?.movies?.items || [];
            // Only return movies that have visuals
            return movies.filter((m: PriveeMovie) => m.lastUploadedVisual !== null);
        } catch (error) {
            console.error('[PriveeService] Failed to fetch movies:', error instanceof Error ? error.message : 'Unknown');
            return [];
        }
    }

    /**
     * Fetch visuals (individual videos) for a movie
     */
    private async fetchVisuals(movieId: string): Promise<PriveeVisual[]> {
        try {
            const response = await axios.get(`${PRIVEE_API_BASE}/visuals/public/${movieId}`);
            return response.data?.data?.visuals?.items || [];
        } catch (error) {
            console.error(`[PriveeService] Failed to fetch visuals for ${movieId}:`, error instanceof Error ? error.message : 'Unknown');
            return [];
        }
    }
}
