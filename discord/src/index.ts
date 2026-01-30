import { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, Message, PermissionFlagsBits } from 'discord.js';
import { config } from './config';
import { ApiService } from './services/ApiService';
import { PollingService } from './services/PollingService';
import { LinkService } from './services/LinkService';
import { ServerStatsService } from './services/ServerStatsService';
import { XpService } from './services/XpService';
import { StatusService } from './services/StatusService';
import { TriviaService } from './services/TriviaService';
import { RecapService } from './services/RecapService';

console.log('🤖 Starting TechPlay Bot...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
});

// Slash Command Registration
const commands = [
    {
        name: 'techplay',
        description: 'Check the status of TechPlay.gg services',
    },
    {
        name: 'latest',
        description: 'Get the latest news articles',
    },
    {
        name: 'giveaways',
        description: 'List active giveaways',
    },
    {
        name: 'forum',
        description: 'Show trending forum discussions',
    },
    {
        name: 'link',
        description: 'Link your TechPlay account to Discord',
    },
    {
        name: 'sync',
        description: 'Sync your Rank and XP from TechPlay',
    },
    {
        name: 'leaderboard',
        description: 'Show Top 10 Users by XP',
    },
    {
        name: 'trivia',
        description: 'Start a trivia question',
    },
    {
        name: 'admin',
        description: 'Admin tools for TechPlay',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'stats',
                description: 'Get detailed site and discord stats',
                type: 1
            },
            {
                name: 'recap',
                description: 'Manually trigger the weekly recap post',
                type: 1
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

async function registerCommands() {
    try {
        console.log('Started refreshing application (/) commands.');
        if (config.clientId) {
            await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
            console.log('Successfully reloaded application (/) commands.');
        } else {
            console.warn('⚠️ CLIENT_ID not set, skipping command registration.');
        }
    } catch (error) {
        console.error(error);
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`);

    // Start Services
    const pollingService = new PollingService(client);
    pollingService.start();

    const statsService = new ServerStatsService(client);
    statsService.start();

    // Initialize XP Service (Singleton)
    const xpService = XpService.getInstance(client);
    await xpService.start();

    const statusService = new StatusService(client);
    statusService.start();

    const triviaService = new TriviaService(client);
    triviaService.start();

    const recapService = new RecapService(client);
    recapService.start();

    // Register commands
    await registerCommands();
});

// Interaction Handler
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const api = ApiService.getInstance();
    const linkService = new LinkService();
    const triviaService = new TriviaService(client);
    const recapService = new RecapService(client);

    if (interaction.commandName === 'link') {
        await linkService.handleLinkCommand(interaction);
        return;
    }

    if (interaction.commandName === 'sync') {
        await linkService.handleSyncCommand(interaction);
        return;
    }

    if (interaction.commandName === 'trivia') {
        await triviaService.startTrivia(interaction);
        return;
    }

    if (interaction.commandName === 'leaderboard') {
        await interaction.deferReply();
        const leaderboard = await api.getLeaderboard();

        if (leaderboard.length === 0) {
            await interaction.editReply('🏆 Leaderboard is empty or unavailable.');
            return;
        }

        const content = leaderboard.map(u => `**#${u.rank_position}** ${u.name} - **${u.xp} XP** (${u.rank_title})`).join('\n');
        await interaction.editReply({ content: `🏆 **TechPlay.gg Leaderboard**\n\n${content}` });
        return;
    }

    if (interaction.commandName === 'admin') {
        const sub = interaction.options.getSubcommand();

        if (sub === 'stats') {
            await interaction.deferReply({ ephemeral: true });
            const status = await api.getSystemStatus();
            const members = interaction.guild?.memberCount || 0;
            const linked = (await api.getLeaderboard()).length;

            await interaction.editReply({
                content: `📊 **Admin Stats Overview**\n\n` +
                    `🌐 Site Status: **${status?.status || 'OFFLINE'}**\n` +
                    `👥 Discord Members: **${members}**\n` +
                    `🔗 Linked Users: **${linked}+**\n` +
                    `⚙️ Bot Latency: **${client.ws.ping}ms**`
            });
        }

        if (sub === 'recap') {
            await interaction.deferReply({ ephemeral: true });
            await recapService.postWeeklyRecap();
            await interaction.editReply('✅ Weekly Recap posted manually!');
        }
        return;
    }

    if (interaction.commandName === 'techplay') {
        await interaction.deferReply();
        const status = await api.getSystemStatus();
        if (status) {
            await interaction.editReply(`✅ **TechPlay.gg is Online!**\nSystem Version: ${status.version || 'Unknown'}\nStatus: ${status.status}`);
        } else {
            await interaction.editReply(`❌ **TechPlay.gg seems offline** or API is unreachable.`);
        }
    }

    if (interaction.commandName === 'latest') {
        await interaction.deferReply();
        const news = await api.getLatestNews(3);

        if (news.length === 0) {
            await interaction.editReply('No news found recently.');
            return;
        }

        const content = news.map(n => `**[${n.title}](https://techplay.gg/news/${n.slug})**\n${n.excerpt}`).join('\n\n');
        await interaction.editReply({ content: `📰 **Latest News from TechPlay.gg**\n\n${content}` });
    }

    if (interaction.commandName === 'giveaways') {
        await interaction.deferReply();
        const giveaways = await api.getActiveGiveaways();

        if (giveaways.length === 0) {
            await interaction.editReply('🎁 No active giveaways at the moment. Check back soon!');
            return;
        }

        const content = giveaways.map(g => `🎁 **${g.title}**\nEnds: ${g.end_date}\n[Enter Now](https://techplay.gg/giveaways/${g.slug})`).join('\n\n');
        await interaction.editReply({ content: `🎉 **Active Community Giveaways**\n\n${content}` });
    }

    if (interaction.commandName === 'forum') {
        await interaction.deferReply();
        const threads = await api.getActiveThreads();

        if (threads.length === 0) {
            await interaction.editReply('💤 The forum is quiet right now.');
            return;
        }

        const content = threads.slice(0, 5).map(t => `💬 **${t.title}**\nReplies: ${t.replies_count || 0}\n[View Thread](https://techplay.gg/forum/threads/${t.slug})`).join('\n\n');
        await interaction.editReply({ content: `🔥 **Trending on the Forum**\n\n${content}` });
    }
});

// Auto-Moderation: Bad Word Filter
const BAD_WORDS = ['badword1', 'spam', 'scam'];

client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    if (BAD_WORDS.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete();
        console.log(`Deleted message from ${message.author.tag} containing bad word.`);
    }
});
