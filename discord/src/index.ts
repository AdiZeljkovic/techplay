import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from './config';
import { commands } from './commands/definitions';
import { handleCommand, handleAutocomplete } from './handlers/commands';
import { setupWelcome, setupModeration, setupPresenceTracking, setupGuildMembership } from './handlers/events';
import { BuffyService } from './services/BuffyService';
import { PollingService } from './services/PollingService';
import { PublishListener } from './services/PublishListener';
import { ServerStatsService } from './services/ServerStatsService';
import { XpService } from './services/XpService';
import { StatusService } from './services/StatusService';
import { RecapService } from './services/RecapService';
import { SubscriptionService } from './services/SubscriptionService';

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

    // Embeds take their thumbnail from the bot's own avatar. The hard-coded URL
    // they used before pointed at a file the site does not have.
    BuffyService.setIdentity(readyClient.user.displayAvatarURL({ size: 256 }));

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

    // The site knocks here the moment it publishes; the poll above is the
    // fallback for anything that knock misses.
    new PublishListener(pollingService, config.botSecret, config.publishPort).start();

    const recapService = new RecapService(client);
    recapService.start();

    const subscriptionService = SubscriptionService.getInstance(client);
    subscriptionService.start();

    console.log('\n✅ All services started successfully!');
});

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// Welcome new members
setupWelcome(client);

// Auto-moderation (bad word filter)
setupModeration(client);

// Discord Rich Presence → TechPlay "Playing Now"
setupPresenceTracking(client);

// Who is actually in the server → the community badge on the profile
setupGuildMembership(client);

// ═══════════════════════════════════════════════════════════════════════════════
// SLASH COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

client.on(Events.InteractionCreate, async (interaction) => {
    // Autocomplete arrives on the same event as a command and must answer
    // within three seconds — Discord shows nothing at all if it is late.
    if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction);
        return;
    }

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
