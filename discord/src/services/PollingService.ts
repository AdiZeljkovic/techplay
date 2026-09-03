import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { ApiService } from './ApiService';
import { BuffyService } from './BuffyService';
import { config } from '../config';

/**
 * Where the watermarks live between restarts.
 *
 * Beside the project rather than in dist/, which the build deletes outright.
 */
const STATE_FILE = path.resolve(__dirname, '../../.poll-state.json');

/** How many items to read when working out where a feed already stands. */
const WINDOW = 20;

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

    /**
     * Where each feed already stands, from disk and from the API.
     *
     * ── The bug this replaces ────────────────────────────────────────────
     *
     * This took `items[0].id` from a single-item fetch, and the feed is
     * ordered by **publish date** while the watermark is an **id**. Those are
     * two different orderings, and an article published with a backdated date
     * sits below a lower id while carrying a higher one.
     *
     * Article 717 did exactly that: `published_at` an hour before its own
     * `created_at`. Every start set the watermark to 716, the next poll found
     * 717 "new", and Professor Buffy announced the same piece again. Three
     * times in one day, once per restart, and it would have gone on forever.
     *
     * Two changes close it. The watermark is the **highest id in a window**
     * rather than the first row, so ordering no longer matters. And it is
     * written to disk, so a restart resumes instead of reverting — without
     * that, a backdated article deeper than the window repeats the whole
     * story on the next deploy.
     *
     * The larger of the two wins. A fresh install with no file falls back to
     * the API and announces no backlog; a restart keeps whatever it had
     * already reached.
     */
    private async initializeFeeds() {
        const saved = this.readState();

        for (const feed of this.feeds) {
            const items = await this.fetchFeed(feed.type, WINDOW);
            const fromApi = items.length > 0 ? Math.max(...items.map((n: any) => n.id)) : 0;
            const fromDisk = saved[feed.type] ?? 0;

            feed.lastCheckedId = Math.max(fromApi, fromDisk);

            if (feed.lastCheckedId > 0) {
                console.log(
                    `🔄 [PollingService] ${feed.type} initialized — last ID: ${feed.lastCheckedId}` +
                        ` (api: ${fromApi}, saved: ${fromDisk})`,
                );
            } else {
                console.warn(`⚠️ [PollingService] ${feed.type} init returned 0 items`);
            }
        }

        this.writeState();
    }

    /** @returns the watermark per feed, or an empty map if there is no file yet. */
    private readState(): Record<string, number> {
        try {
            if (!fs.existsSync(STATE_FILE)) return {};

            const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch (error) {
            // A corrupt file must not stop the bot: the API fallback above is
            // still correct, it only costs the resume.
            console.warn('⚠️ [PollingService] could not read poll state:', error instanceof Error ? error.message : error);

            return {};
        }
    }

    private writeState(): void {
        try {
            const state: Record<string, number> = {};
            for (const feed of this.feeds) state[feed.type] = feed.lastCheckedId;

            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        } catch (error) {
            // Losing the file costs a repeat after the next restart, which is
            // the old behaviour — not a reason to stop announcing.
            console.warn('⚠️ [PollingService] could not write poll state:', error instanceof Error ? error.message : error);
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

    /**
     * Announce one item the moment the site publishes it.
     *
     * The poll below is the fallback now, not the mechanism. Four feeds every
     * sixty seconds is 5,760 requests a day for something that happens a few
     * times a day, and it still arrived up to a minute late. The site knows
     * exactly when an article goes out, so it says so.
     *
     * The id is recorded either way, so an item pushed here is not posted a
     * second time when the poll next runs.
     */
    public async announce(type: string, item: { id: number; title: string; slug: string; excerpt?: string; featured_image_url?: string }): Promise<boolean> {
        const feed = this.feeds.find(f => f.type === type);

        if (!feed) {
            console.warn(`⚠️ [PollingService] no feed named "${type}"`);
            return false;
        }

        // Already covered. The site pushes on publish and the poll is the
        // safety net behind it, so the same piece can legitimately arrive
        // twice — the watermark is what tells them apart.
        if (item.id <= feed.lastCheckedId) {
            console.log(`⏭️  [PollingService] ${type} #${item.id} already announced — skipping`);

            return false;
        }

        const posted = await this.postToChannel([item], feed);

        if (posted) {
            feed.lastCheckedId = item.id;
            this.writeState();
        }

        return posted;
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

        // The highest id in the window, not the first row — the feed is
        // ordered by publish date and these are not the same thing.
        const latestId = Math.max(...items.map((n: any) => n.id));
        console.log(`🔍 [PollingService] ${feed.type} — latest API id: ${latestId}, lastCheckedId: ${feed.lastCheckedId}`);

        /*
         * A feed the backend was too down to initialise arms itself here.
         *
         * `lastCheckedId` staying at 0 used to disable the feed permanently:
         * the filter below excluded everything while it was 0, and nothing else
         * ever set it, so a backend that was unreachable for the few seconds
         * around startup left that feed silent until somebody restarted the
         * bot. The poll is the retry — it already runs on its own timer, which
         * is why there is no second one here.
         *
         * Nothing is announced on the way in, exactly as at startup: the
         * alternative is a burst of articles the server has already read.
         */
        if (feed.lastCheckedId === 0) {
            feed.lastCheckedId = latestId;
            this.writeState();
            console.log(`🔄 [PollingService] ${feed.type} armed on a later poll — last ID: ${latestId}`);
            return;
        }

        const newItems = items.filter(n => n.id > feed.lastCheckedId);

        if (newItems.length > 0) {
            console.log(`📢 [PollingService] ${feed.type} — ${newItems.length} new item(s) found, posting...`);
            const posted = await this.postToChannel(newItems, feed);
            // Only advance lastCheckedId if posting succeeded
            if (posted) {
                feed.lastCheckedId = Math.max(...newItems.map(n => n.id));
                this.writeState();
            }
        }
    }

    private async postToChannel(items: any[], feed: FeedTracker): Promise<boolean> {
        // Prefer channel ID from env (reliable), fallback to name search
        const channelId = process.env.LATEST_NEWS_CHANNEL_ID;
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
            console.error(`❌ [PollingService] Channel #${this.CHANNEL_NAME} not found — set LATEST_NEWS_CHANNEL_ID in .env or check bot permissions`);
            return false;
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
        return true;
    }
}
