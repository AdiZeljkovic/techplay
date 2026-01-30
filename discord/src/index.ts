import { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, Message, PermissionFlagsBits, GuildMember, ApplicationCommandOptionType } from 'discord.js';
import { config } from './config';
import { ApiService } from './services/ApiService';
import { PollingService } from './services/PollingService';
import { LinkService } from './services/LinkService';
import { ServerStatsService } from './services/ServerStatsService';
import { XpService } from './services/XpService';
import { StatusService } from './services/StatusService';
import { TriviaService } from './services/TriviaService';
import { RecapService } from './services/RecapService';
import { BuffyService } from './services/BuffyService';

console.log('🦉 Starting Professor Buffy (TechPlay Bot)...');

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
        name: 'profile',
        description: '📜 View your or someone else\'s TechPlay profile',
        options: [
            {
                name: 'user',
                description: 'The user to view (leave empty for yourself)',
                type: ApplicationCommandOptionType.User,
                required: false,
            }
        ]
    },
    {
        name: 'leaderboard',
        description: '🏆 Show Top 10 Users by XP',
    },
    {
        name: 'daily',
        description: '🎁 Claim your daily XP bonus from Professor Buffy',
    },
    {
        name: 'tip',
        description: '💡 Get a random gaming or tech tip from Professor Buffy',
    },
    {
        name: 'stats',
        description: '📊 Show server statistics',
    },
    {
        name: 'help',
        description: '🦉 Show all available commands',
    },
    {
        name: 'link',
        description: '🔗 Link your TechPlay account to Discord',
    },
    {
        name: 'sync',
        description: '🔄 Sync your Rank and XP from TechPlay',
    },
    {
        name: 'trivia',
        description: '🧠 Start a trivia question for XP',
    },
    {
        name: 'techplay',
        description: '🌐 Check the status of TechPlay.gg services',
    },
    {
        name: 'latest',
        description: '📰 Get the latest news articles',
    },
    {
        name: 'giveaways',
        description: '🎁 List active giveaways',
    },
    {
        name: 'forum',
        description: '💬 Show trending forum discussions',
    },
    {
        name: 'admin',
        description: '⚙️ Admin tools for TechPlay',
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
        options: [
            {
                name: 'stats',
                description: 'Get detailed site and discord stats',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'recap',
                description: 'Manually trigger the weekly recap post',
                type: ApplicationCommandOptionType.Subcommand,
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

async function registerCommands() {
    try {
        console.log('🔧 Started refreshing application (/) commands.');
        if (config.clientId) {
            await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
            console.log('✅ Successfully reloaded application (/) commands.');
        } else {
            console.warn('⚠️ CLIENT_ID not set, skipping command registration.');
        }
    } catch (error) {
        console.error(error);
    }
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Ready! Logged in as ${c.user.tag}`);

    // Set bot status
    c.user.setActivity('over TechPlay', { type: ActivityType.Watching });

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

    console.log('🦉 Professor Buffy is ready to assist the community!');
});

// ═══════════════════════════════════════════════════════════════════════════
// WELCOME NEW MEMBERS
// ═══════════════════════════════════════════════════════════════════════════

client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const buffy = BuffyService.getInstance();

    // Find welcome/general channel
    const welcomeChannel = member.guild.channels.cache.find(
        c => c.name === 'welcome' || c.name === 'general' || c.name === 'chat'
    );

    if (welcomeChannel && welcomeChannel.isTextBased()) {
        const embed = buffy.createWelcomeEmbed(member.user.username, member.guild.memberCount);
        await welcomeChannel.send({ embeds: [embed] });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTION HANDLER (Slash Commands)
// ═══════════════════════════════════════════════════════════════════════════

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const api = ApiService.getInstance();
    const buffy = BuffyService.getInstance();
    const linkService = new LinkService();
    const triviaService = new TriviaService(client);
    const recapService = new RecapService(client);

    // ───────────────────────────────────────────────────────────────────────
    // /help - Show all commands
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'help') {
        const embed = buffy.createHelpEmbed();
        await interaction.reply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /tip - Random gaming/tech tip
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'tip') {
        const embed = buffy.createTipEmbed();
        await interaction.reply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /profile - View profile
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'profile') {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userData = await api.getUserByDiscordId(targetUser.id);

        if (!userData) {
            const embed = buffy.createNotLinkedEmbed();
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Get leaderboard position
        const leaderboard = await api.getLeaderboard();
        const position = leaderboard.findIndex(u => u.username === userData.user.username) + 1;

        const embed = buffy.createProfileEmbed({
            username: userData.user.username,
            displayName: userData.user.name || userData.user.username,
            rank: userData.user.rank || 'Newbie',
            xp: userData.user.xp || 0,
            position: position > 0 ? position : undefined,
            avatarUrl: targetUser.displayAvatarURL(),
        });

        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /daily - Claim daily bonus
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'daily') {
        await interaction.deferReply();

        const result = await api.claimDailyBonus(interaction.user.id);

        if (!result) {
            const embed = buffy.createNotLinkedEmbed();
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        if (result.already_claimed) {
            const embed = buffy.createAlreadyClaimedEmbed(result.hours_left || 24);
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = buffy.createDailyBonusEmbed(
            interaction.user.username,
            result.xp_awarded || 50,
            result.streak || 1,
            result.total_xp || 0
        );

        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /stats - Server statistics
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'stats') {
        await interaction.deferReply();

        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply('This command can only be used in a server.');
            return;
        }

        const leaderboard = await api.getLeaderboard();

        const embed = buffy.createServerStatsEmbed({
            totalMembers: guild.memberCount,
            onlineMembers: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
            linkedAccounts: leaderboard.length,
            totalXpAwarded: leaderboard.reduce((sum, u) => sum + u.xp, 0),
            messagesThisWeek: 0, // Would need tracking
        });

        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /leaderboard - Top 10 users
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'leaderboard') {
        await interaction.deferReply();
        const leaderboard = await api.getLeaderboard();

        if (leaderboard.length === 0) {
            const embed = buffy.createErrorEmbed('The leaderboard is empty or unavailable.');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = buffy.createLeaderboardEmbed(
            leaderboard.map((u, index) => ({
                position: index + 1,
                username: u.name || u.username,
                xp: u.xp,
                rank: u.rank_title,
            }))
        );

        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /link - Link account
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'link') {
        await linkService.handleLinkCommand(interaction);
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /sync - Sync account
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'sync') {
        await linkService.handleSyncCommand(interaction);
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /trivia - Start trivia
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'trivia') {
        await triviaService.startTrivia(interaction);
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /admin - Admin tools
    // ───────────────────────────────────────────────────────────────────────
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

    // ───────────────────────────────────────────────────────────────────────
    // /techplay - Site status
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'techplay') {
        await interaction.deferReply();
        const status = await api.getSystemStatus();
        if (status) {
            await interaction.editReply(`✅ **TechPlay.gg is Online!**\nSystem Version: ${status.version || 'Unknown'}\nStatus: ${status.status}`);
        } else {
            await interaction.editReply(`❌ **TechPlay.gg seems offline** or API is unreachable.`);
        }
    }

    // ───────────────────────────────────────────────────────────────────────
    // /latest - Latest news
    // ───────────────────────────────────────────────────────────────────────
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

    // ───────────────────────────────────────────────────────────────────────
    // /giveaways - Active giveaways
    // ───────────────────────────────────────────────────────────────────────
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

    // ───────────────────────────────────────────────────────────────────────
    // /forum - Trending threads
    // ───────────────────────────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// AUTO-MODERATION: Bad Word Filter
// ═══════════════════════════════════════════════════════════════════════════

const BAD_WORDS = ['badword1', 'spam', 'scam'];

client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    if (BAD_WORDS.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete();
        console.log(`🚫 Deleted message from ${message.author.tag} containing bad word.`);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════

client.login(config.token);
