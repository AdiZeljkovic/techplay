import { ChatInputCommandInteraction, Client, TextChannel } from 'discord.js';
import { ApiService } from '../services/ApiService';
import { BuffyService } from '../services/BuffyService';
import { LinkService } from '../services/LinkService';
import { TriviaService } from '../services/TriviaService';
import { RecapService } from '../services/RecapService';
import { SubscriptionService } from '../services/SubscriptionService';
import { ChallengeService } from '../services/ChallengeService';
import { XpService } from '../services/XpService';

/**
 * Handles all slash command interactions.
 * Each command is a separate function for clarity.
 */
export async function handleCommand(interaction: ChatInputCommandInteraction, client: Client) {
    const api = ApiService.getInstance();
    const buffy = BuffyService.getInstance();

    switch (interaction.commandName) {
        case 'help': return handleHelp(interaction, buffy);
        case 'tip': return handleTip(interaction, buffy);
        case 'profile': return handleProfile(interaction, api, buffy);
        case 'daily': return handleDaily(interaction, api, buffy);
        case 'stats': return handleStats(interaction, api, buffy, client);
        case 'leaderboard': return handleLeaderboard(interaction, api, buffy);
        case 'link': return handleLink(interaction);
        case 'sync': return handleSync(interaction);
        case 'trivia': return handleTrivia(interaction);
        case 'search': return handleSearch(interaction, api, buffy);
        case 'techplay': return handleTechplay(interaction, api);
        case 'latest': return handleLatest(interaction, api);
        case 'giveaways': return handleGiveaways(interaction, api);
        case 'forum': return handleForum(interaction, api);
        case 'subscribe': return handleSubscribe(interaction, buffy);
        case 'gift': return handleGift(interaction, api, buffy);
        case 'challenge': return handleChallenge(interaction, client);
        case 'admin': return handleAdmin(interaction, api, buffy, client);
    }
}

// ─── Individual Command Handlers ──────────────────────────────────────────────

async function handleHelp(interaction: ChatInputCommandInteraction, buffy: BuffyService) {
    const embed = buffy.createHelpEmbed();
    await interaction.reply({ embeds: [embed] });
}

async function handleTip(interaction: ChatInputCommandInteraction, buffy: BuffyService) {
    const embed = buffy.createTipEmbed();
    await interaction.reply({ embeds: [embed] });
}

async function handleProfile(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userData = await api.getUserByDiscordId(targetUser.id);

    if (!userData) {
        const embed = buffy.createNotLinkedEmbed();
        await interaction.editReply({ embeds: [embed] });
        return;
    }

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
}

async function handleDaily(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
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
}

async function handleStats(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService, client: Client) {
    await interaction.deferReply();

    const guild = interaction.guild;
    if (!guild) {
        await interaction.editReply('This command can only be used in a server.');
        return;
    }

    const leaderboard = await api.getLeaderboard();
    const xpService = XpService.getInstance(client);

    const embed = buffy.createServerStatsEmbed({
        totalMembers: guild.memberCount,
        onlineMembers: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
        linkedAccounts: leaderboard.length,
        totalXpAwarded: leaderboard.reduce((sum, u) => sum + u.xp, 0),
        messagesThisWeek: xpService.getWeeklyMessageCount(),
    });

    await interaction.editReply({ embeds: [embed] });
}

async function handleLeaderboard(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
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
}

async function handleLink(interaction: ChatInputCommandInteraction) {
    const linkService = new LinkService();
    await linkService.handleLinkCommand(interaction);
}

async function handleSync(interaction: ChatInputCommandInteraction) {
    const linkService = new LinkService();
    await linkService.handleSyncCommand(interaction);
}

async function handleTrivia(interaction: ChatInputCommandInteraction) {
    const triviaService = TriviaService.getInstance();
    await triviaService.startTrivia(interaction);
}

async function handleSearch(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    const results = await api.searchArticles(query);

    if (results.length === 0) {
        const embed = buffy.createErrorEmbed(`No results found for "${query}".`);
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    const content = results.slice(0, 5).map(r =>
        `🔹 **[${r.title}](https://techplay.gg/news/${r.slug})**\n${r.excerpt || ''}`
    ).join('\n\n');

    await interaction.editReply({
        content: `🔍 **Search results for "${query}"**\n\n${content}`
    });
}

async function handleTechplay(interaction: ChatInputCommandInteraction, api: ApiService) {
    await interaction.deferReply();
    const status = await api.getSystemStatus();
    if (status) {
        await interaction.editReply(`✅ **TechPlay.gg is Online!**\nSystem Version: ${status.version || 'Unknown'}\nStatus: ${status.status}`);
    } else {
        await interaction.editReply(`❌ **TechPlay.gg seems offline** or API is unreachable.`);
    }
}

async function handleLatest(interaction: ChatInputCommandInteraction, api: ApiService) {
    await interaction.deferReply();
    const news = await api.getLatestNews(3);

    if (news.length === 0) {
        await interaction.editReply('No news found recently.');
        return;
    }

    const content = news.map(n => `**[${n.title}](https://techplay.gg/news/${n.slug})**\n${n.excerpt}`).join('\n\n');
    await interaction.editReply({ content: `📰 **Latest News from TechPlay.gg**\n\n${content}` });
}

async function handleGiveaways(interaction: ChatInputCommandInteraction, api: ApiService) {
    await interaction.deferReply();
    const giveaways = await api.getActiveGiveaways();

    if (giveaways.length === 0) {
        await interaction.editReply('🎁 No active giveaways at the moment. Check back soon!');
        return;
    }

    const content = giveaways.map(g => `🎁 **${g.title}**\nEnds: ${g.end_date}\n[Enter Now](https://techplay.gg/giveaways/${g.slug})`).join('\n\n');
    await interaction.editReply({ content: `🎉 **Active Community Giveaways**\n\n${content}` });
}

async function handleForum(interaction: ChatInputCommandInteraction, api: ApiService) {
    await interaction.deferReply();
    const threads = await api.getActiveThreads();

    if (threads.length === 0) {
        await interaction.editReply('💤 The forum is quiet right now.');
        return;
    }

    const content = threads.slice(0, 5).map(t => `💬 **${t.title}**\nReplies: ${t.replies_count || 0}\n[View Thread](https://techplay.gg/forum/threads/${t.slug})`).join('\n\n');
    await interaction.editReply({ content: `🔥 **Trending on the Forum**\n\n${content}` });
}

async function handleSubscribe(interaction: ChatInputCommandInteraction, buffy: BuffyService) {
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
}

async function handleGift(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (targetUser.id === interaction.user.id) {
        const embed = buffy.createGiftErrorEmbed("You can't gift XP to yourself!");
        await interaction.editReply({ embeds: [embed] });
        return;
    }

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
}

async function handleChallenge(interaction: ChatInputCommandInteraction, client: Client) {
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
}

async function handleAdmin(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService, client: Client) {
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
        const recapService = new RecapService(client);
        await recapService.postWeeklyRecap();
        await interaction.editReply('✅ Weekly Recap posted manually!');
        return;
    }

    // /admin announce
    if (sub === 'announce') {
        const message = interaction.options.getString('message', true);

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
