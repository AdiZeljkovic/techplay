"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const definitions_1 = require("./commands/definitions");
const commands_1 = require("./handlers/commands");
const events_1 = require("./handlers/events");
const PollingService_1 = require("./services/PollingService");
const ServerStatsService_1 = require("./services/ServerStatsService");
const XpService_1 = require("./services/XpService");
const StatusService_1 = require("./services/StatusService");
const TriviaService_1 = require("./services/TriviaService");
const RecapService_1 = require("./services/RecapService");
const SubscriptionService_1 = require("./services/SubscriptionService");
const ChallengeService_1 = require("./services/ChallengeService");
const PriveeService_1 = require("./services/PriveeService");
console.log('🦉 Starting Professor Buffy (TechPlay Bot)...');
// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildPresences
    ],
});
// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════
async function registerCommands() {
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.token);
    try {
        console.log(`🔄 Registering ${definitions_1.commands.length} slash commands...`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(config_1.config.clientId, config_1.config.guildId), { body: definitions_1.commands });
        console.log('✅ Slash commands registered!');
    }
    catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// READY EVENT — Start all services
// ═══════════════════════════════════════════════════════════════════════════════
client.once(discord_js_1.Events.ClientReady, async (readyClient) => {
    console.log(`\n🦉 Professor Buffy is online as ${readyClient.user.tag}!`);
    console.log(`📡 Serving ${readyClient.guilds.cache.size} server(s)`);
    console.log('═══════════════════════════════════════════════\n');
    // Register commands
    await registerCommands();
    // Start background services
    const pollingService = new PollingService_1.PollingService(client);
    await pollingService.start();
    const serverStats = new ServerStatsService_1.ServerStatsService(client);
    serverStats.start();
    const xpService = XpService_1.XpService.getInstance(client);
    xpService.start();
    const statusService = new StatusService_1.StatusService(client);
    statusService.start();
    const triviaService = TriviaService_1.TriviaService.getInstance(client);
    triviaService.start();
    const recapService = new RecapService_1.RecapService(client);
    recapService.start();
    const subscriptionService = SubscriptionService_1.SubscriptionService.getInstance(client);
    subscriptionService.start();
    const challengeService = ChallengeService_1.ChallengeService.getInstance(client);
    challengeService.start();
    const priveeService = new PriveeService_1.PriveeService(client);
    await priveeService.start();
    console.log('\n✅ All services started successfully!');
});
// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════
// Welcome new members
(0, events_1.setupWelcome)(client);
// Auto-moderation (bad word filter)
(0, events_1.setupModeration)(client);
// Challenge acceptance via reactions
(0, events_1.setupChallengeReactions)(client);
// Discord Rich Presence → TechPlay "Playing Now"
(0, events_1.setupPresenceTracking)(client);
// ═══════════════════════════════════════════════════════════════════════════════
// SLASH COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    await (0, commands_1.handleCommand)(interaction, client);
});
// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS SAFETY NETS
// ═══════════════════════════════════════════════════════════════════════════════
// A single rejected promise in a polling loop must not kill the whole bot.
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
});
// Graceful shutdown — lets Discord close the gateway connection cleanly.
const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down...`);
    client.destroy();
    process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
client.login(config_1.config.token);
