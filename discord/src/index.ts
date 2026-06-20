import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from './config';
import { commands } from './commands/definitions';
import { handleCommand } from './handlers/commands';
import { setupWelcome, setupModeration, setupChallengeReactions, setupPresenceTracking } from './handlers/events';
import { PollingService } from './services/PollingService';
import { ServerStatsService } from './services/ServerStatsService';
import { XpService } from './services/XpService';
import { StatusService } from './services/StatusService';
import { TriviaService } from './services/TriviaService';
import { RecapService } from './services/RecapService';
import { SubscriptionService } from './services/SubscriptionService';
import { ChallengeService } from './services/ChallengeService';
import { PriveeService } from './services/PriveeService';

console.log('🦉 Starting Professor Buffy (TechPlay Bot)...');

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        console.log(`🔄 Registering ${commands.length} slash commands...`);
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// READY EVENT — Start all services
// ═══════════════════════════════════════════════════════════════════════════════

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`\n🦉 Professor Buffy is online as ${readyClient.user.tag}!`);
    console.log(`📡 Serving ${readyClient.guilds.cache.size} server(s)`);
    console.log('═══════════════════════════════════════════════\n');

    // Register commands
    await registerCommands();

    // Start background services
    const pollingService = new PollingService(client);
    await pollingService.start();

    const serverStats = new ServerStatsService(client);
    serverStats.start();

    const xpService = XpService.getInstance(client);
    xpService.start();

    const statusService = new StatusService(client);
    statusService.start();

    const triviaService = TriviaService.getInstance(client);
    triviaService.start();

    const recapService = new RecapService(client);
    recapService.start();

    const subscriptionService = SubscriptionService.getInstance(client);
    subscriptionService.start();

    const challengeService = ChallengeService.getInstance(client);
    challengeService.start();

    const priveeService = new PriveeService(client);
    await priveeService.start();

    console.log('\n✅ All services started successfully!');
});

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// Welcome new members
setupWelcome(client);

// Auto-moderation (bad word filter)
setupModeration(client);

// Challenge acceptance via reactions
setupChallengeReactions(client);

// Discord Rich Presence → TechPlay "Playing Now"
setupPresenceTracking(client);

// ═══════════════════════════════════════════════════════════════════════════════
// SLASH COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    await handleCommand(interaction, client);
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
const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down...`);
    client.destroy();
    process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════

client.login(config.token);
