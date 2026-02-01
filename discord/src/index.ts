import { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, Message, PermissionFlagsBits, GuildMember, ApplicationCommandOptionType, TextChannel } from 'discord.js';
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
import { SubscriptionService } from './services/SubscriptionService';
import { ChallengeService } from './services/ChallengeService';

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
        name: 'subscribe',
        description: '📬 Manage notification subscriptions',
        options: [
            {
                name: 'news',
                description: 'Get DM notifications when new articles are published',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'giveaway',
                description: 'Get DM notifications when new giveaways start',
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                name: 'status',
                description: 'Check your current subscriptions',
                type: ApplicationCommandOptionType.Subcommand,
            }
        ]
    },
    {
        name: 'gift',
        description: '🎁 Gift XP to another user',
        options: [
            {
                name: 'user',
                description: 'The user to gift XP to',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount of XP to gift (minimum 10)',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 10,
                max_value: 1000,
            }
        ]
    },
    {
        name: 'challenge',
        description: '⚔️ Challenge another user to a trivia duel',
        options: [
            {
                name: 'user',
                description: 'The user to challenge',
                type: ApplicationCommandOptionType.User,
                required: true,
            }
        ]
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
            },
            {
                name: 'xp',
                description: 'Manage user XP',
                type: ApplicationCommandOptionType.SubcommandGroup,
                options: [
                    {
                        name: 'give',
                        description: 'Give XP to a user',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to give XP to',
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to give',
                                type: ApplicationCommandOptionType.Integer,
                                required: true,
                                min_value: 1,
                            }
                        ]
                    },
                    {
                        name: 'remove',
                        description: 'Remove XP from a user',
                        type: ApplicationCommandOptionType.Subcommand,
                        options: [
                            {
                                name: 'user',
                                description: 'The user to remove XP from',
                                type: ApplicationCommandOptionType.User,
                                required: true,
                            },
                            {
                                name: 'amount',
                                description: 'Amount of XP to remove',
                                type: ApplicationCommandOptionType.Integer,
                                required: true,
                                min_value: 1,
                            }
                        ]
                    }
                ]
            },
            {
                name: 'announce',
                description: 'Make an announcement as Professor Buffy',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'message',
                        description: 'The announcement message',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    }
                ]
            },
            {
                name: 'event',
                description: 'Start a special event',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'name',
                        description: 'Event name (e.g., "Double XP")',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'duration',
                        description: 'Duration in hours',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1,
                        max_value: 168,
                    }
                ]
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

    // Initialize Subscription Service
    const subscriptionService = SubscriptionService.getInstance(client);
    await subscriptionService.start();

    // Initialize Challenge Service
    const challengeService = ChallengeService.getInstance(client);
    challengeService.start();

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
        const subGroup = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        // /admin xp give/remove
        if (subGroup === 'xp') {
            await interaction.deferReply();
            const targetUser = interaction.options.getUser('user', true);
            const amount = interaction.options.getInteger('amount', true);

            if (sub === 'give') {
                const result = await api.adminGiveXp(targetUser.id, amount);
                if (result.success) {
                    const embed = buffy.createAdminXpEmbed('give', interaction.user.username, targetUser.username, amount, result.new_xp || 0);
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.editReply(`❌ Failed: ${result.error}`);
                }
            } else if (sub === 'remove') {
                const result = await api.adminRemoveXp(targetUser.id, amount);
                if (result.success) {
                    const embed = buffy.createAdminXpEmbed('remove', interaction.user.username, targetUser.username, amount, result.new_xp || 0);
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.editReply(`❌ Failed: ${result.error}`);
                }
            }
            return;
        }

        // /admin stats
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
            return;
        }

        // /admin recap
        if (sub === 'recap') {
            await interaction.deferReply({ ephemeral: true });
            await recapService.postWeeklyRecap();
            await interaction.editReply('✅ Weekly Recap posted manually!');
            return;
        }

        // /admin announce
        if (sub === 'announce') {
            const message = interaction.options.getString('message', true);

            // Find announcements channel
            const announcementChannel = interaction.guild?.channels.cache.find(
                c => c.name === 'announcements' || c.name === 'general'
            ) as TextChannel | undefined;

            if (!announcementChannel) {
                await interaction.reply({ content: '❌ No announcements channel found!', ephemeral: true });
                return;
            }

            const embed = buffy.createAnnouncementEmbed(message);
            await announcementChannel.send({ embeds: [embed] });
            await interaction.reply({ content: `✅ Announcement posted in #${announcementChannel.name}!`, ephemeral: true });
            return;
        }

        // /admin event
        if (sub === 'event') {
            const eventName = interaction.options.getString('name', true);
            const duration = interaction.options.getInteger('duration', true);

            const success = await api.adminStartEvent(eventName, duration);

            if (success) {
                // Post event announcement
                const announcementChannel = interaction.guild?.channels.cache.find(
                    c => c.name === 'announcements' || c.name === 'general'
                ) as TextChannel | undefined;

                if (announcementChannel) {
                    const embed = buffy.createEventEmbed(eventName, `${duration} hours`, true);
                    await announcementChannel.send({ embeds: [embed] });
                }

                await interaction.reply({ content: `✅ Event "${eventName}" started for ${duration} hours!`, ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Failed to start event', ephemeral: true });
            }
            return;
        }
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

    // ───────────────────────────────────────────────────────────────────────
    // /subscribe - Notification subscriptions
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'subscribe') {
        const subscriptionService = SubscriptionService.getInstance();
        const sub = interaction.options.getSubcommand();

        if (sub === 'status') {
            const subs = subscriptionService.getUserSubscriptions(interaction.user.id);
            const statusText = subs.length > 0
                ? `You are subscribed to: **${subs.join(', ')}**`
                : 'You have no active subscriptions.';

            await interaction.reply({
                content: `📬 **Your Subscriptions**\n\n${statusText}\n\nUse \`/subscribe news\` or \`/subscribe giveaway\` to manage.`,
                ephemeral: true
            });
            return;
        }

        const type = sub as 'news' | 'giveaway';
        const isCurrentlySubscribed = subscriptionService.isSubscribed(interaction.user.id, type);

        if (isCurrentlySubscribed) {
            await subscriptionService.unsubscribe(interaction.user.id, type);
        } else {
            await subscriptionService.subscribe(interaction.user.id, type);
        }

        const embed = buffy.createSubscriptionEmbed(!isCurrentlySubscribed, type);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /gift - Gift XP to another user
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'gift') {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user', true);
        const amount = interaction.options.getInteger('amount', true);

        // Can't gift to yourself
        if (targetUser.id === interaction.user.id) {
            const embed = buffy.createGiftErrorEmbed("You can't gift XP to yourself!");
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // Can't gift to bots
        if (targetUser.bot) {
            const embed = buffy.createGiftErrorEmbed("You can't gift XP to a bot!");
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const result = await api.giftXp(interaction.user.id, targetUser.id, amount);

        if (!result.success) {
            const embed = buffy.createGiftErrorEmbed(result.error || 'Failed to process gift');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = buffy.createGiftEmbed(interaction.user.username, targetUser.username, amount);
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    // ───────────────────────────────────────────────────────────────────────
    // /challenge - 1v1 Trivia Duel
    // ───────────────────────────────────────────────────────────────────────
    if (interaction.commandName === 'challenge') {
        const challengeService = ChallengeService.getInstance();
        const targetUser = interaction.options.getUser('user', true);

        if (!interaction.channel || !interaction.channel.isTextBased()) {
            await interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
            return;
        }

        const embed = await challengeService.createChallenge(
            interaction.user,
            targetUser,
            interaction.channel as TextChannel
        );

        if (embed) {
            await interaction.reply({ embeds: [embed] });
        }
        return;
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGE ACCEPTANCE (Message reactions)
// ═══════════════════════════════════════════════════════════════════════════

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;

    const challengeService = ChallengeService.getInstance();
    const pending = challengeService.getPendingChallenge(reaction.message.channelId);

    if (!pending || pending.opponentId !== user.id) return;

    const channel = reaction.message.channel;
    if (!channel.isTextBased() || channel.isDMBased()) return;

    if (reaction.emoji.name === '✅') {
        await challengeService.acceptChallenge(user.id, reaction.message.channelId);
    } else if (reaction.emoji.name === '❌') {
        await challengeService.declineChallenge(user.id, reaction.message.channelId);
        await (channel as TextChannel).send(`❌ **${pending.opponentName}** declined the challenge.`);
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
