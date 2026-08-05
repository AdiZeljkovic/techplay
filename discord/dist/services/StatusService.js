"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const discord_js_1 = require("discord.js");
const ApiService_1 = require("./ApiService");
class StatusService {
    constructor(client) {
        this.interval = null;
        this.currentIndex = 0;
        this.client = client;
        this.api = ApiService_1.ApiService.getInstance();
    }
    start() {
        this.updateStatus();
        // Rotate every 1 minute
        this.interval = setInterval(() => this.updateStatus(), 60 * 1000);
    }
    async updateStatus() {
        const statuses = [
            async () => {
                const giveaways = await this.api.getActiveGiveaways();
                return { name: `${giveaways.length} Active Giveaways 🎁`, type: discord_js_1.ActivityType.Watching };
            },
            async () => {
                const status = await this.api.getSystemStatus();
                return { name: status ? 'TechPlay.gg Online 🟢' : 'Maintenance 🔧', type: discord_js_1.ActivityType.Playing };
            },
            async () => {
                const threads = await this.api.getActiveThreads();
                return { name: `${threads.length} Forum Trends 🔥`, type: discord_js_1.ActivityType.Listening };
            },
            async () => {
                // Ideally this comes from an API, hardcoded fallback or we implement getMembersCount in API
                const memberCount = this.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
                return { name: `${memberCount} Gamers 🎮`, type: discord_js_1.ActivityType.Watching };
            }
        ];
        try {
            const statusGenerator = statuses[this.currentIndex];
            const status = await statusGenerator();
            this.client.user?.setActivity(status.name, { type: status.type });
            // Rotate index
            this.currentIndex = (this.currentIndex + 1) % statuses.length;
        }
        catch (error) {
            console.error('Failed to update status:', error);
        }
    }
}
exports.StatusService = StatusService;
