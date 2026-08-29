import { EmbedBuilder } from 'discord.js';

/**
 * Professor Buffy - TechPlay's wise owl mascot
 * Handles all personality, messages, and branding for the Discord bot
 */
export class BuffyService {
    private static instance: BuffyService;

    // Buffy's color palette
    public static readonly COLORS = {
        PRIMARY: 0x5865F2,      // Discord Blurple
        SUCCESS: 0x57F287,      // Green
        WARNING: 0xFEE75C,      // Yellow
        ERROR: 0xED4245,        // Red
        XP: 0xF59E0B,           // Amber/Gold
        ACHIEVEMENT: 0x9333EA,  // Purple
        WELCOME: 0x3B82F6,      // Blue
    };

    /**
     * The thumbnail on nearly every embed Buffy sends.
     *
     * It pointed at https://techplay.gg/images/buffy-avatar.png, a file that
     * does not exist in the frontend's public directory and answers 404.
     * Discord drops a thumbnail it cannot fetch without complaining, so every
     * embed has been going out plain and nothing said why.
     *
     * The bot's own avatar is the obvious source: Discord already hosts it, it
     * is the same face members see in the member list, and it cannot 404. It is
     * filled in once the client is ready — see setIdentity() — and until then
     * `null` simply means no thumbnail, which is what was happening anyway.
     * BUFFY_AVATAR_URL overrides it if a real asset ever exists.
     */
    private static avatarUrl: string | null = process.env.BUFFY_AVATAR_URL || null;

    public static readonly FOOTER_TEXT = '🦉 Professor Buffy | TechPlay Community';

    /**
     * Roughly how big the game catalogue is, for prose.
     *
     * Approximate on purpose, and rounded so it reads that way. There is no
     * endpoint that counts the catalogue, and adding an API call to a help
     * embed to put a number in a sentence would be paying request latency for
     * decoration. `select count(*) from games` is the real answer; last checked
     * 29 Aug 2026, when it was 332,455. Round it here when that drifts.
     */
    public static readonly CATALOGUE_SIZE = '332,000';

    /** Called once the Discord client knows who it is. */
    public static setIdentity(avatarUrl: string | null | undefined): void {
        BuffyService.avatarUrl ??= avatarUrl ?? null;
    }

    /** Null is a valid thumbnail: EmbedBuilder simply omits it. */
    public static get AVATAR_URL(): string | null {
        return BuffyService.avatarUrl;
    }

    private constructor() {}

    public static getInstance(): BuffyService {
        if (!BuffyService.instance) {
            BuffyService.instance = new BuffyService();
        }
        return BuffyService.instance;
    }

    // ═══════════════════════════════════════════════════════════════════
    // WELCOME MESSAGES
    // ═══════════════════════════════════════════════════════════════════

    private welcomeMessages = [
        "Hoot hoot! 🦉 A new adventurer has joined our ranks!",
        "Well, well, well... Fresh talent has arrived! 🎮",
        "My feathers are tingling! A new gamer approaches!",
        "The prophecy spoke of your arrival... Welcome, young one!",
        "*adjusts spectacles* Ah, a new student! Excellent!",
        "By my wise owl eyes! A newcomer! Let me show you around!",
    ];

    public getWelcomeMessage(): string {
        return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
    }

    public createWelcomeEmbed(username: string, memberCount: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`${this.getWelcomeMessage()}`)
            .setDescription(
                `Welcome to **TechPlay**, **${username}**! 🎉\n\n` +
                `I'm **Professor Buffy**, your guide to the gaming world!\n\n` +
                `📌 **Getting Started:**\n` +
                `• Link your TechPlay account with \`/link\`\n` +
                `• Check your profile with \`/profile\`\n` +
                `• Earn XP by chatting and being active!\n` +
                `• Compete on the \`/leaderboard\`\n\n` +
                `You are member **#${memberCount}**! Let the adventure begin! 🚀`
            )
            .setColor(BuffyService.COLORS.WELCOME)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEVEL UP MESSAGES
    // ═══════════════════════════════════════════════════════════════════

    private levelUpMessages = [
        "Hoot hoot! 🎓 Your dedication impresses even this old owl!",
        "By my spectacles! You've ascended to new heights!",
        "*ruffles feathers proudly* My student grows stronger!",
        "The ancient gaming scrolls foretold this moment!",
        "Your XP radiates like a thousand monitors! Brilliant!",
        "Even in my centuries of wisdom, your progress amazes me!",
    ];

    public getLevelUpMessage(): string {
        return this.levelUpMessages[Math.floor(Math.random() * this.levelUpMessages.length)];
    }

    public createLevelUpEmbed(username: string, newRank: string, totalXp: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🎉 RANK UP!`)
            .setDescription(
                `${this.getLevelUpMessage()}\n\n` +
                `**${username}** has reached **${newRank}**!\n\n` +
                `📊 Total XP: **${totalXp.toLocaleString()}**\n\n` +
                `Keep going, young gamer! The leaderboard awaits! 🏆`
            )
            .setColor(BuffyService.COLORS.XP)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ACHIEVEMENT MESSAGES
    // ═══════════════════════════════════════════════════════════════════

    private achievementMessages = [
        "Hooo! A new badge for your collection!",
        "*polishes monocle* Most impressive, indeed!",
        "The trophy case grows! Magnificent!",
        "Another notch in your gaming belt!",
        "My wisdom recognizes greatness when it sees it!",
    ];

    public getAchievementMessage(): string {
        return this.achievementMessages[Math.floor(Math.random() * this.achievementMessages.length)];
    }

    public createAchievementEmbed(username: string, achievementName: string, description: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🏆 Achievement Unlocked!`)
            .setDescription(
                `${this.getAchievementMessage()}\n\n` +
                `**${username}** earned:\n` +
                `**${achievementName}**\n` +
                `*${description}*`
            )
            .setColor(BuffyService.COLORS.ACHIEVEMENT)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // DAILY BONUS MESSAGES
    // ═══════════════════════════════════════════════════════════════════

    private dailyMessages = [
        "Ah, punctual as always! Here's your daily wisdom... and XP!",
        "The early bird gets the worm, but the wise owl gets XP!",
        "Another day, another opportunity for greatness!",
        "*hands over a glowing orb of XP* Use it wisely!",
        "Your dedication to the daily ritual pleases me!",
    ];

    private alreadyClaimedMessages = [
        "Patience, young gamer! You've already claimed today's bonus.",
        "Even my magic needs time to recharge! Come back tomorrow.",
        "Hoot! One per day keeps the greed away!",
        "*checks ancient scroll* Nope, already claimed today!",
    ];

    public getDailyMessage(): string {
        return this.dailyMessages[Math.floor(Math.random() * this.dailyMessages.length)];
    }

    public getAlreadyClaimedMessage(): string {
        return this.alreadyClaimedMessages[Math.floor(Math.random() * this.alreadyClaimedMessages.length)];
    }

    public createDailyBonusEmbed(username: string, xpAwarded: number, streak: number, totalXp: number): EmbedBuilder {
        const streakBonus = streak > 1 ? `\n🔥 **${streak} Day Streak!** (+${Math.min(streak * 5, 50)} bonus XP)` : '';

        return new EmbedBuilder()
            .setTitle(`🎁 Daily Bonus Claimed!`)
            .setDescription(
                `${this.getDailyMessage()}\n\n` +
                `**${username}** received **+${xpAwarded} XP**!${streakBonus}\n\n` +
                `📊 Total XP: **${totalXp.toLocaleString()}**\n\n` +
                `Come back tomorrow for more! 🌅`
            )
            .setColor(BuffyService.COLORS.SUCCESS)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    public createAlreadyClaimedEmbed(hoursLeft: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`⏰ Already Claimed!`)
            .setDescription(
                `${this.getAlreadyClaimedMessage()}\n\n` +
                `⏳ Next bonus available in **${hoursLeft} hours**`
            )
            .setColor(BuffyService.COLORS.WARNING)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAMING & TECH TIPS
    // ═══════════════════════════════════════════════════════════════════

    private tips = [
        { category: '🎮 Gaming', tip: 'Take regular breaks! The 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.' },
        { category: '🎮 Gaming', tip: 'Keep your game library organized. Uninstall games you haven\'t played in months to free up space.' },
        { category: '🎮 Gaming', tip: 'Join gaming communities! Playing with others makes games more enjoyable and helps you improve.' },
        { category: '🎮 Gaming', tip: 'Before buying a new game, check reviews and gameplay videos to make sure it\'s your style.' },
        { category: '🎮 Gaming', tip: 'Customize your controls! Default settings aren\'t always optimal for your playstyle.' },
        { category: '💻 Tech', tip: 'Clean your PC fans and filters every few months to prevent overheating.' },
        { category: '💻 Tech', tip: 'Use a password manager! It\'s 2026, no more using "password123"!' },
        { category: '💻 Tech', tip: 'Enable 2FA on all your gaming accounts. Don\'t lose your progress to hackers!' },
        { category: '💻 Tech', tip: 'SSD > HDD for gaming. The loading time difference is night and day!' },
        { category: '💻 Tech', tip: 'Keep your graphics drivers updated for the best gaming performance.' },
        { category: '💻 Tech', tip: 'Monitor your CPU and GPU temperatures while gaming to prevent thermal throttling.' },
        { category: '🏆 Pro Tip', tip: 'Your backlog will never be empty. Accept it. Embrace it. Game on!' },
        { category: '🏆 Pro Tip', tip: 'Don\'t compare your gaming hours to others. Quality > Quantity!' },
        { category: '🏆 Pro Tip', tip: 'Sometimes the best gaming session is replaying an old favorite.' },
        { category: '🏆 Pro Tip', tip: 'Support indie developers! Some of the best games come from small studios.' },
        { category: '🦉 Buffy\'s Wisdom', tip: 'A true gamer never flames their teammates. Lift others up!' },
        { category: '🦉 Buffy\'s Wisdom', tip: 'The real achievement is the friends we made along the way.' },
        { category: '🦉 Buffy\'s Wisdom', tip: 'Every pro was once a noob. Keep practicing!' },
    ];

    public getRandomTip(): { category: string; tip: string } {
        return this.tips[Math.floor(Math.random() * this.tips.length)];
    }

    public createTipEmbed(): EmbedBuilder {
        const { category, tip } = this.getRandomTip();

        return new EmbedBuilder()
            .setTitle(`${category}`)
            .setDescription(
                `*Professor Buffy adjusts his spectacles and speaks:*\n\n` +
                `"${tip}"\n\n` +
                `💡 *Use \`/tip\` again for more wisdom!*`
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // PROFILE EMBED
    // ═══════════════════════════════════════════════════════════════════

    /**
     * A player, as the site knows one today.
     *
     * This card used to be Rank, XP, Position and Progress — which was the
     * whole of a profile when TechPlay was a news site with a rank ladder
     * bolted on. Since then a profile grew a library, the hours behind it,
     * achievements and the year somebody started playing, and the bot kept
     * drawing the January card.
     *
     * Every figure appears only if there is something behind it. An account
     * with no shelf gets the rank and the XP rail and nothing else — a row of
     * zeroes reads as a measurement, and an absence is not one.
     */
    public createProfileEmbed(data: {
        username: string;
        displayName: string;
        rank: string;
        rankColor?: string | null;
        rankMinXp?: number;
        nextRank?: string | null;
        nextRankMinXp?: number | null;
        level?: number;
        xp: number;
        position?: number;
        avatarUrl?: string;
        profileUrl?: string;
        games?: number;
        completed?: number;
        achievements?: number;
        hours?: number;
        gamesPlayed?: number;
        since?: number | null;
        deepest?: { name: string; hours: number; share: number } | null;
        platformAchievements?: { earned: number; total: number; rate: number } | null;
    }): EmbedBuilder {
        const floor = data.rankMinXp ?? 0;
        const ceiling = data.nextRankMinXp ?? null;
        const across = ceiling !== null && ceiling > floor
            ? Math.min(100, Math.max(0, Math.round(((data.xp - floor) / (ceiling - floor)) * 100)))
            : null;

        const embed = new EmbedBuilder()
            .setTitle(`${data.displayName}`)
            .setColor(this.hexToInt(data.rankColor) ?? BuffyService.COLORS.PRIMARY)
            .setThumbnail(data.avatarUrl || BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();

        if (data.profileUrl) embed.setURL(data.profileUrl);

        const standing = [
            `**${data.rank}**${data.level ? ` · Level ${data.level}` : ''}`,
            `${data.xp.toLocaleString()} XP${data.position ? ` · #${data.position} on the ladder` : ''}`,
        ];

        if (across !== null && data.nextRank && ceiling !== null) {
            standing.push(`${this.createProgressBar(across)} ${(ceiling - data.xp).toLocaleString()} XP to ${data.nextRank}`);
        }

        embed.setDescription(standing.join('\n'));

        // The library, when there is one.
        if (data.games && data.games > 0) {
            const shelf = [`**${data.games.toLocaleString()}** games`];
            if (data.completed) shelf.push(`**${data.completed}** finished`);
            if (data.achievements) shelf.push(`**${data.achievements}** achievements`);
            embed.addFields({ name: '🎮 Library', value: shelf.join(' · '), inline: false });
        }

        // The hours, which is the figure a rank cannot give.
        if (data.hours && data.hours > 0) {
            const played = [`**${data.hours.toLocaleString()} h** across ${data.gamesPlayed ?? 0} games`];
            if (data.since) played.push(`playing since **${data.since}**`);
            embed.addFields({ name: '⏱️ Time played', value: played.join(' · '), inline: false });
        }

        if (data.deepest) {
            embed.addFields({
                name: '🏔️ Most played',
                value: `**${data.deepest.name}** — ${data.deepest.hours.toLocaleString()} h (${data.deepest.share}% of everything)`,
                inline: false,
            });
        }

        if (data.platformAchievements && data.platformAchievements.total > 0) {
            const pa = data.platformAchievements;
            embed.addFields({
                name: '🏆 Platform achievements',
                value: `**${pa.earned.toLocaleString()}** of ${pa.total.toLocaleString()} (${pa.rate}%)`,
                inline: false,
            });
        }

        return embed;
    }

    /** `#FC4100` as Discord wants it. Null for anything that is not a hex colour. */
    private hexToInt(hex?: string | null): number | null {
        if (!hex) return null;
        const clean = hex.replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

        return parseInt(clean, 16);
    }

    private createProgressBar(percentage: number): string {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LEADERBOARD EMBED
    // ═══════════════════════════════════════════════════════════════════

    public createLeaderboardEmbed(users: Array<{
        position: number;
        username: string;
        xp: number;
        rank: string;
    }>): EmbedBuilder {
        const medals = ['🥇', '🥈', '🥉'];

        let description = '*The most dedicated gamers of TechPlay!*\n\n';

        users.forEach((user, index) => {
            const medal = medals[index] || `**${user.position}.**`;
            description += `${medal} **${user.username}** - ${user.xp.toLocaleString()} XP *(${user.rank})*\n`;
        });

        description += '\n*Keep chatting and climbing the ranks!* 🚀';

        return new EmbedBuilder()
            .setTitle(`🏆 TechPlay Leaderboard`)
            .setDescription(description)
            .setColor(BuffyService.COLORS.XP)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // SERVER STATS EMBED
    // ═══════════════════════════════════════════════════════════════════

    public createServerStatsEmbed(stats: {
        totalMembers: number;
        onlineMembers: number;
        linkedAccounts: number;
        totalXpAwarded: number;
        messagesThisWeek: number;
    }): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`📊 TechPlay Server Statistics`)
            .setDescription(`*Professor Buffy presents the community metrics!*`)
            .addFields(
                { name: '👥 Total Members', value: stats.totalMembers.toLocaleString(), inline: true },
                { name: '🟢 Online Now', value: stats.onlineMembers.toLocaleString(), inline: true },
                { name: '🔗 Linked Accounts', value: stats.linkedAccounts.toLocaleString(), inline: true },
                { name: '⭐ Total XP Awarded', value: stats.totalXpAwarded.toLocaleString(), inline: true },
                { name: '💬 Messages This Week', value: stats.messagesThisWeek.toLocaleString(), inline: true },
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // HELP EMBED
    // ═══════════════════════════════════════════════════════════════════

    public createHelpEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🦉 What I can do`)
            .setDescription(
                `**🎮 You and your games**
` +
                `\`/profile\` — rank, hours, library, achievements
` +
                `\`/library\` — a shelf, filterable by status
` +
                `\`/backlog\` — three things to play out of what you own
` +
                `\`/match @someone\` — how much your taste overlaps

` +
                `**🔍 The catalogue**
` +
                `\`/game\` — look up any of ${BuffyService.CATALOGUE_SIZE} games (suggests as you type)
` +
                `\`/search\` — find an article
` +
                `\`/latest\` — what just went up

` +
                `**🏆 Standing**
` +
                `\`/leaderboard\` — the top of the ladder
` +
                `\`/daily\` — claim your daily XP
` +
                `\`/stats\` — server figures

` +
                `**🔗 Account**
` +
                `\`/link\` — connect TechPlay, and what that gets you
` +
                `\`/sync\` — get your rank role

` +
                `**📚 Also**
` +
                `\`/forum\` · \`/giveaways\` · \`/techplay\` · \`/subscribe\` · \`/gift\` · \`/tip\`

` +
                `*Talking here earns XP on the same ladder as the site — but only once you've linked.*`
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ERROR MESSAGES
    // ═══════════════════════════════════════════════════════════════════

    public createErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`❌ Oops!`)
            .setDescription(
                `*Professor Buffy scratches his head...*\n\n` +
                `${message}\n\n` +
                `If this keeps happening, let the moderators know!`
            )
            .setColor(BuffyService.COLORS.ERROR)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    /**
     * The one message most members will ever see from this bot.
     *
     * A hundred and fifty-three people are in this server and not one had
     * linked an account — not because linking is hard, but because nothing
     * ever said what it was for. "Your Discord isn't linked" is a fact about
     * a database row; it is not a reason. So this leads with what linking
     * gets you and puts the instructions underneath.
     */
    public createNotLinkedEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🔗 Link your account and this starts working`)
            .setDescription(
                `Right now I know your Discord name and nothing else. Link a TechPlay account and:\n\n` +
                `🏅 **Your rank becomes a role here**, kept current as you climb\n` +
                `⭐ **Talking here earns XP** on the same ladder as the site\n` +
                `🎮 **\`/profile\` and \`/library\`** start answering about you — hours, shelf, achievements\n` +
                `🤝 **\`/match\`** compares your taste with anyone else who has linked\n` +
                `🎯 **Whatever you're playing** shows on your profile by itself\n\n` +
                `**Takes about twenty seconds:**\n` +
                `[Open your settings](https://techplay.gg/settings?section=connections) → **Connect Discord** → run \`/sync\` here.`
            )
            .setColor(BuffyService.COLORS.WARNING)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATION EMBEDS (DMs)
    // ═══════════════════════════════════════════════════════════════════

    public createNewsNotificationEmbed(title: string, excerpt: string, url: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`📰 New Article on TechPlay!`)
            .setDescription(
                `*Hoot! Professor Buffy has news for you!*\n\n` +
                `**${title}**\n\n` +
                `${excerpt}\n\n` +
                `[📖 Read Full Article](${url})`
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: `${BuffyService.FOOTER_TEXT} • Use /subscribe to manage notifications` })
            .setTimestamp();
    }

    public createGiveawayNotificationEmbed(title: string, endDate: string, url: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🎁 New Giveaway Started!`)
            .setDescription(
                `*Hoot hoot! Free stuff alert!*\n\n` +
                `**${title}**\n\n` +
                `⏰ Ends: ${endDate}\n\n` +
                `[🎯 Enter Now!](${url})\n\n` +
                `*Don't miss your chance, young gamer!*`
            )
            .setColor(BuffyService.COLORS.SUCCESS)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: `${BuffyService.FOOTER_TEXT} • Use /subscribe to manage notifications` })
            .setTimestamp();
    }

    public createSubscriptionEmbed(subscribed: boolean, type: string): EmbedBuilder {
        const action = subscribed ? 'subscribed to' : 'unsubscribed from';
        const emoji = subscribed ? '✅' : '🔕';

        return new EmbedBuilder()
            .setTitle(`${emoji} Notification ${subscribed ? 'Enabled' : 'Disabled'}`)
            .setDescription(
                `*Professor Buffy updates his notification list...*\n\n` +
                `You have ${action} **${type}** notifications!\n\n` +
                (subscribed
                    ? `I'll send you a DM whenever there's something new! 📬`
                    : `You won't receive DMs for ${type} anymore.`)
            )
            .setColor(subscribed ? BuffyService.COLORS.SUCCESS : BuffyService.COLORS.WARNING)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // GIFT EMBEDS
    // ═══════════════════════════════════════════════════════════════════

    public createGiftEmbed(senderName: string, receiverName: string, amount: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🎁 XP Gift!`)
            .setDescription(
                `*Professor Buffy witnesses a generous act!*\n\n` +
                `**${senderName}** gifted **${amount} XP** to **${receiverName}**!\n\n` +
                `*Such kindness warms this old owl's heart!* 💝`
            )
            .setColor(BuffyService.COLORS.SUCCESS)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    public createGiftErrorEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🎁 Gift Failed`)
            .setDescription(
                `*Professor Buffy shakes his head...*\n\n` +
                `${message}`
            )
            .setColor(BuffyService.COLORS.ERROR)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN EMBEDS
    // ═══════════════════════════════════════════════════════════════════

    public createAdminXpEmbed(action: 'give' | 'remove', adminName: string, targetName: string, amount: number, newTotal: number): EmbedBuilder {
        const emoji = action === 'give' ? '➕' : '➖';
        const verb = action === 'give' ? 'granted' : 'removed';

        return new EmbedBuilder()
            .setTitle(`${emoji} Admin XP ${action === 'give' ? 'Grant' : 'Removal'}`)
            .setDescription(
                `**${adminName}** ${verb} **${amount} XP** ${action === 'give' ? 'to' : 'from'} **${targetName}**\n\n` +
                `📊 New Total: **${newTotal.toLocaleString()} XP**`
            )
            .setColor(action === 'give' ? BuffyService.COLORS.SUCCESS : BuffyService.COLORS.ERROR)
            .setFooter({ text: `Admin Action • ${BuffyService.FOOTER_TEXT}` })
            .setTimestamp();
    }

    public createAnnouncementEmbed(message: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`📢 Community Announcement`)
            .setDescription(
                `*Professor Buffy clears his throat...*\n\n` +
                `${message}`
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }

    public createEventEmbed(eventName: string, duration: string, active: boolean): EmbedBuilder {
        if (active) {
            return new EmbedBuilder()
                .setTitle(`🎉 Event Started: ${eventName}!`)
                .setDescription(
                    `*Professor Buffy waves his wand...*\n\n` +
                    `**${eventName}** is now active!\n\n` +
                    `⏰ Duration: **${duration}**\n\n` +
                    `*Make the most of it, gamers!* 🚀`
                )
                .setColor(BuffyService.COLORS.SUCCESS)
                .setThumbnail(BuffyService.AVATAR_URL)
                .setFooter({ text: BuffyService.FOOTER_TEXT })
                .setTimestamp();
        } else {
            return new EmbedBuilder()
                .setTitle(`🔔 Event Ended: ${eventName}`)
                .setDescription(
                    `*Professor Buffy waves goodbye...*\n\n` +
                    `**${eventName}** has ended!\n\n` +
                    `*Thanks for participating!*`
                )
                .setColor(BuffyService.COLORS.WARNING)
                .setThumbnail(BuffyService.AVATAR_URL)
                .setFooter({ text: BuffyService.FOOTER_TEXT })
                .setTimestamp();
        }
    }
}
