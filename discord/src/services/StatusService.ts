import { Client, ActivityType } from 'discord.js';
import { ApiService } from './ApiService';

export class StatusService {
    private client: Client;
    private api: ApiService;
    private interval: ReturnType<typeof setInterval> | null = null;
    private currentIndex = 0;
    private healthMisses = 0;

    /**
     * How many health checks in a row have to miss before the bot says so.
     *
     * The status line is public — it is the first thing a member sees under the
     * bot's name — and one timeout used to be enough to announce "Maintenance"
     * to the whole server. A timeout, a 429 from the rate limiter or a restart
     * of the API is not the site being down. This slot comes round once every
     * four minutes, so three in a row is a quarter of an hour of it genuinely
     * not answering.
     */
    private readonly HEALTH_MISSES_BEFORE_MAINTENANCE = 3;

    constructor(client: Client) {
        this.client = client;
        this.api = ApiService.getInstance();
    }

    public start() {
        this.updateStatus();
        // Rotate every 1 minute
        this.interval = setInterval(() => this.updateStatus(), 60 * 1000);
    }

    private async updateStatus() {
        const statuses = [
            async () => {
                const giveaways = await this.api.getActiveGiveaways();
                return { name: `${giveaways.length} Active Giveaways 🎁`, type: ActivityType.Watching };
            },
            async () => {
                const status = await this.api.getSystemStatus();

                if (status) {
                    this.healthMisses = 0;
                    return { name: 'TechPlay.gg Online 🟢', type: ActivityType.Playing };
                }

                this.healthMisses++;

                if (this.healthMisses >= this.HEALTH_MISSES_BEFORE_MAINTENANCE) {
                    return { name: 'Maintenance 🔧', type: ActivityType.Playing };
                }

                // Nothing to say yet — the line keeps whatever it last showed.
                return null;
            },
            async () => {
                const threads = await this.api.getActiveThreads();
                return { name: `${threads.length} Forum Trends 🔥`, type: ActivityType.Listening };
            },
            async () => {
                // Ideally this comes from an API, hardcoded fallback or we implement getMembersCount in API
                const memberCount = this.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
                return { name: `${memberCount} Gamers 🎮`, type: ActivityType.Watching };
            }
        ];

        try {
            const statusGenerator = statuses[this.currentIndex];
            const status = await statusGenerator();

            if (status) {
                this.client.user?.setActivity(status.name, { type: status.type });
            }

            // Rotate index
            this.currentIndex = (this.currentIndex + 1) % statuses.length;
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }
}
