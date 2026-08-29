import { AutocompleteInteraction, ChatInputCommandInteraction, Client, EmbedBuilder, MessageFlags, TextChannel } from 'discord.js';
import { ApiService } from '../services/ApiService';
import { BuffyService } from '../services/BuffyService';
import { LinkService } from '../services/LinkService';
import { RecapService } from '../services/RecapService';
import { RoleLadderService } from '../services/RoleLadderService';
import { SubscriptionService } from '../services/SubscriptionService';
import { XpService } from '../services/XpService';

/**
 * Handles all slash command interactions.
 * Each command is a separate function for clarity.
 *
 * The dispatch below had nothing around it. A handler that threw — an API
 * answering a shape nobody expected, an edit against an interaction that had
 * already expired — sent its rejection all the way out to the process-level net
 * in index.ts, which logs it and nothing else. What the member sees is "the
 * application did not respond", or a command left deferred and thinking until
 * it times out, neither of which they can tell from a command that is slow.
 */
export async function handleCommand(interaction: ChatInputCommandInteraction, client: Client) {
    try {
        await dispatch(interaction, client);
    } catch (error) {
        console.error(`❌ [commands] /${interaction.commandName} failed:`, error instanceof Error ? error.message : error);

        await answerWithFailure(interaction);
    }
}

/**
 * Says something rather than nothing.
 *
 * Which of the three is available depends on how far the handler got before it
 * threw, and getting it wrong throws again — this is the one place in the file
 * where there is nowhere left to report a failure.
 */
async function answerWithFailure(interaction: ChatInputCommandInteraction) {
    const content = '😖 Something went wrong on my end. Try that again in a moment.';

    try {
        if (interaction.deferred) {
            await interaction.editReply({ content });
        } else if (interaction.replied) {
            await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content, flags: MessageFlags.Ephemeral });
        }
    } catch {
        // The token is gone or the reply already landed. Nothing to do.
    }
}

async function dispatch(interaction: ChatInputCommandInteraction, client: Client) {
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
        case 'search': return handleSearch(interaction, api, buffy);
        case 'game': return handleGame(interaction, api, buffy);
        case 'library': return handleLibrary(interaction, api, buffy);
        case 'match': return handleMatch(interaction, api, buffy);
        case 'backlog': return handleBacklog(interaction, api, buffy);
        case 'techplay': return handleTechplay(interaction, api);
        case 'latest': return handleLatest(interaction, api);
        case 'giveaways': return handleGiveaways(interaction, api);
        case 'forum': return handleForum(interaction, api);
        case 'subscribe': return handleSubscribe(interaction, buffy);
        case 'gift': return handleGift(interaction, api, buffy);
        case 'admin': return handleAdmin(interaction, api, buffy, client);
    }
}

// ─── Individual Command Handlers ──────────────────────────────────────────────

/**
 * Suggests games as somebody types.
 *
 * The catalogue holds several hundred thousand titles and `/game` used to take
 * a name typed blind, then answer with whatever came first for that string.
 * Discord gives an autocomplete three seconds to reply and shows nothing at all
 * if the answer is late, so this fails to an empty list rather than to an
 * error — an empty list is a search that found nothing, which is a sentence
 * Discord already knows how to say.
 */
export async function handleAutocomplete(interaction: AutocompleteInteraction) {
    if (interaction.commandName !== 'game') {
        await interaction.respond([]);
        return;
    }

    const typed = interaction.options.getFocused().trim();

    // One letter matches tens of thousands of things and helps nobody.
    if (typed.length < 2) {
        await interaction.respond([]);
        return;
    }

    try {
        const api = ApiService.getInstance();
        const results = await api.searchGames(typed);

        await interaction.respond(
            results.slice(0, 25).map(g => ({
                // Discord refuses a choice name over 100 characters, and the
                // catalogue has titles longer than that.
                name: g.title.length > 100 ? `${g.title.slice(0, 97)}…` : g.title,
                value: g.title.slice(0, 100),
            })),
        );
    } catch {
        await interaction.respond([]);
    }
}


/** How the website words each shelf status, so both say the same thing. */
const STATUS_LABEL: Record<string, string> = {
    playing: 'Playing',
    played: 'Played',
    backlog: 'Backlog',
    completed: 'Completed',
    wishlist: 'Wishlist',
    dropped: 'Dropped',
};

async function handleLibrary(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const status = interaction.options.getString('status');
    const data = await api.getLibrary(targetUser.id, status);

    if (!data) {
        const embed = targetUser.id === interaction.user.id
            ? buffy.createNotLinkedEmbed()
            : buffy.createErrorEmbed(`${targetUser.username} has not linked a TechPlay account.`);
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    const counts = data.counts ?? {};
    const games: any[] = data.games ?? [];

    const embed = new EmbedBuilder()
        .setTitle(`📚 ${data.display_name}'s library`)
        .setURL(data.profile_url)
        .setColor(0xFC4100)
        .setFooter({ text: BuffyService.FOOTER_TEXT })
        .setTimestamp();

    // The shape of the shelf first — a list of twenty-five out of three
    // hundred says nothing about the three hundred.
    const shelf = [
        `**${(counts.games_count ?? 0).toLocaleString()}** games`,
        `${counts.playing_count ?? 0} playing`,
        `${counts.completed_count ?? 0} finished`,
        `${counts.backlog_count ?? 0} in the backlog`,
    ].join(' · ');

    embed.setDescription(status ? `${shelf}\n\nShowing **${STATUS_LABEL[status] ?? status}**` : shelf);

    if (games.length === 0) {
        embed.addFields({
            name: '\u200b',
            value: status ? `Nothing in ${STATUS_LABEL[status] ?? status}.` : 'This shelf is empty.',
        });
    } else {
        const lines = games.slice(0, 12).map(g => {
            const bits = [`**${g.name}**`];
            if (g.hours > 0) bits.push(`${g.hours.toLocaleString()} h`);
            else if (g.progress > 0) bits.push(`${g.progress}%`);
            if (!status) bits.push(STATUS_LABEL[g.status] ?? g.status);
            return `• ${bits.join(' — ')}`;
        });

        embed.addFields({ name: 'Most recently touched', value: lines.join('\n') });

        if ((counts.games_count ?? 0) > 12) {
            embed.addFields({ name: '\u200b', value: `[See all ${(counts.games_count).toLocaleString()} on TechPlay](${data.profile_url}?tab=library)` });
        }
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleMatch(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const other = interaction.options.getUser('user', true);

    if (other.bot) {
        await interaction.editReply({ embeds: [buffy.createErrorEmbed('Bots do not own games.')] });
        return;
    }

    const data = await api.getMatch(interaction.user.id, other.id);

    if (!data) {
        await interaction.editReply({ embeds: [buffy.createErrorEmbed('Could not compare right now. Try again in a minute.')] });
        return;
    }

    // Each refusal is a different answer and sends the reader somewhere else.
    if (data.error) {
        if (data.who === 'viewer') {
            await interaction.editReply({ embeds: [buffy.createNotLinkedEmbed()] });
        } else if (data.who === 'target') {
            await interaction.editReply({ embeds: [buffy.createErrorEmbed(`${other.username} has not linked a TechPlay account.`)] });
        } else {
            await interaction.editReply({ embeds: [buffy.createErrorEmbed(data.message ?? 'Cannot compare those two.')] });
        }
        return;
    }

    const m = data.match ?? {};

    if (!m.comparable) {
        const why = m.reason === 'too_small'
            ? (m.yours_is_short
                ? `Add ${m.needed ?? 'a few'} more games to your shelf and this will mean something.`
                : `${data.target} has not shelved enough games yet for this to mean anything.`)
            : 'There is not enough to compare yet.';
        await interaction.editReply({ embeds: [buffy.createErrorEmbed(why)] });
        return;
    }

    const score = m.score ?? 0;
    const embed = new EmbedBuilder()
        .setTitle(`🤝 ${data.viewer} × ${data.target}`)
        .setDescription(`**${score}% match**${m.verdict ? ` — ${m.verdict}` : ''}`)
        .setColor(score >= 60 ? 0x22C55E : score >= 30 ? 0xF59E0B : 0x6B7280)
        .setFooter({ text: BuffyService.FOOTER_TEXT })
        .setTimestamp();

    const shared: any[] = m.shared_games ?? [];
    if (shared.length > 0) {
        embed.addFields({
            name: `🎮 Both of you own`,
            value: shared.slice(0, 6).map(g => `• ${g.name}`).join('\n'),
        });
    }

    const genres: any[] = m.shared_genres ?? [];
    if (genres.length > 0) {
        embed.addFields({
            name: '🏷️ Common ground',
            value: genres.slice(0, 5).map(g => `${g.name}`).join(' · '),
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function handleBacklog(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const data = await api.getBacklogPicks(interaction.user.id);

    if (!data) {
        await interaction.editReply({ embeds: [buffy.createNotLinkedEmbed()] });
        return;
    }

    const picks: any[] = data.picks ?? [];

    if (picks.length === 0) {
        await interaction.editReply({
            embeds: [buffy.createErrorEmbed('Your backlog is empty. Enviable, frankly.')],
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle('🎯 Out of what you already own')
        .setDescription(`Three from your backlog of **${data.backlog_count}**.`)
        .setColor(0x60A5FA)
        .setFooter({ text: BuffyService.FOOTER_TEXT })
        .setTimestamp();

    for (const pick of picks) {
        embed.addFields({
            name: pick.name,
            value: `${(pick.genres ?? []).join(' · ') || 'No genres recorded'}\n[Open on TechPlay](https://techplay.gg/games/${pick.slug})`,
            inline: false,
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

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
    const data = await api.getUserByDiscordId(targetUser.id);

    if (!data) {
        // Someone else's missing link is not the asker's problem to fix, so
        // the two cases say different things.
        const embed = targetUser.id === interaction.user.id
            ? buffy.createNotLinkedEmbed()
            : buffy.createErrorEmbed(`${targetUser.username} has not linked a TechPlay account.`);
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    const leaderboard = await api.getLeaderboard();
    const position = leaderboard.findIndex(u => u.username === data.user.username) + 1;
    const card = data.player_card ?? {};

    const embed = buffy.createProfileEmbed({
        username: data.user.username,
        displayName: data.user.name || data.user.username,
        rank: data.user.rank || 'Newcomer',
        rankColor: data.user.rank_color,
        rankMinXp: data.user.rank_min_xp,
        nextRank: data.user.next_rank,
        nextRankMinXp: data.user.next_rank_min_xp,
        level: data.user.level,
        xp: data.user.xp || 0,
        position: position > 0 ? position : undefined,
        avatarUrl: targetUser.displayAvatarURL(),
        profileUrl: data.profile_url,
        games: data.stats?.games,
        completed: data.stats?.completed,
        achievements: data.stats?.achievements,
        hours: card.hours,
        gamesPlayed: card.games_played,
        since: card.span?.from ?? null,
        deepest: card.deepest ? { name: card.deepest.name, hours: card.deepest.hours, share: card.deepest.share } : null,
        platformAchievements: card.achievements ?? null,
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

    // The backend was reachable but busy. Saying so is the only honest answer:
    // the claim is still there to be made.
    if (result.rate_limited) {
        await interaction.editReply(
            '⏳ Too busy right now — try again in a moment. Your bonus is still waiting.'
        );
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
        `🔹 **[${r.title}](https://techplay.gg${r.url || `/news/${r.slug}`})**\n${r.excerpt || ''}`
    ).join('\n\n');

    await interaction.editReply({
        content: `🔍 **Search results for "${query}"**\n\n${content}`
    });
}

async function handleGame(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService) {
    await interaction.deferReply();

    const name = interaction.options.getString('name', true);
    const results = await api.searchGames(name);

    if (results.length === 0) {
        const embed = buffy.createErrorEmbed(`No games found for "${name}".`);
        await interaction.editReply({ embeds: [embed] });
        return;
    }

    const top = results[0];
    const embed = new EmbedBuilder()
        .setColor(0xFC4100)
        .setTitle(`🎮 ${top.title}`)
        .setURL(`https://techplay.gg${top.url}`)
        .setDescription(top.category)
        .setFooter({ text: 'TechPlay Game Database' });

    if (top.image) {
        embed.setImage(top.image);
    }

    if (results.length > 1) {
        embed.addFields({
            name: 'More matches',
            value: results.slice(1, 5)
                .map(g => `[${g.title}](https://techplay.gg${g.url})`)
                .join('\n'),
        });
    }

    await interaction.editReply({ embeds: [embed] });
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
            flags: MessageFlags.Ephemeral
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
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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

async function handleAdmin(interaction: ChatInputCommandInteraction, api: ApiService, buffy: BuffyService, client: Client) {
    const subGroup = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (sub === 'roles') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.guild) {
            await interaction.editReply('This only works inside the server.');
            return;
        }

        const ladder = new RoleLadderService(api);
        const plan = await ladder.plan(interaction.guild);

        if (!plan) {
            await interaction.editReply('Could not read the rank ladder from TechPlay. Try again in a minute.');
            return;
        }

        if (plan.clean) {
            await interaction.editReply(`✅ All ${plan.correct} rank roles already match the ladder.`);
            return;
        }

        // Showing before doing. This renames roles that are on people's names
        // and creates new ones, so the default is a report and the change is
        // something you ask for.
        const apply = interaction.options.getBoolean('apply') ?? false;

        if (!apply) {
            const lines: string[] = [];

            if (plan.renames.length) {
                lines.push(`**Rename ${plan.renames.length}**`);
                lines.push(plan.renames.map(r => `• ${r.from} → **${r.to}**`).join('\n'));
            }
            if (plan.missing.length) {
                lines.push(`**Create ${plan.missing.length}**`);
                lines.push(plan.missing.map(n => `• ${n}`).join('\n'));
            }
            if (plan.orphans.length) {
                lines.push(`**Left alone ${plan.orphans.length}** — these name no rank any more, and deleting a role takes it off everyone who has it. Retire them by hand if you want them gone.`);
                lines.push(plan.orphans.map(n => `• ${n}`).join('\n'));
            }

            lines.push(`\n${plan.correct} already correct. Run \`/admin roles apply:true\` to make the changes above.`);

            await interaction.editReply(lines.join('\n'));
            return;
        }

        const result = await ladder.apply(interaction.guild, plan);
        const done: string[] = [];

        if (result.renamed.length) done.push(`**Renamed**\n${result.renamed.map(r => `• ${r}`).join('\n')}`);
        if (result.created.length) done.push(`**Created**\n${result.created.map(r => `• ${r}`).join('\n')}`);
        if (result.failed.length) done.push(`⚠️ **Could not**\n${result.failed.map(r => `• ${r}`).join('\n')}\n*A role above Professor Buffy in the role list cannot be changed by him — move his role higher and run this again.*`);
        if (plan.orphans.length) done.push(`Still there, untouched: ${plan.orphans.join(', ')}`);

        await interaction.editReply(done.join('\n\n') || 'Nothing changed.');
        return;
    }

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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
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
            await interaction.reply({ content: '❌ No announcements channel found!', flags: MessageFlags.Ephemeral });
            return;
        }

        const embed = buffy.createAnnouncementEmbed(message);
        await announcementChannel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Announcement posted in #${announcementChannel.name}!`, flags: MessageFlags.Ephemeral });
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

            await interaction.reply({ content: `✅ Event "${eventName}" started for ${duration} hours!`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: '❌ Failed to start event', flags: MessageFlags.Ephemeral });
        }
        return;
    }
}
