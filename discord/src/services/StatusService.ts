import { Client, ActivityType } from 'discord.js';
import { ApiService } from './ApiService';

export class StatusService {
    private client: Client;
    private api: ApiService;
    private interval: ReturnType<typeof setInterval> | null = null;
    private currentIndex = 0;

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
                return { name: status ? 'TechPlay.gg Online 🟢' : 'Maintenance 🔧', type: ActivityType.Playing };
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

            this.client.user?.setActivity(status.name, { type: status.type });

            // Rotate index
            this.currentIndex = (this.currentIndex + 1) % statuses.length;
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }
}
