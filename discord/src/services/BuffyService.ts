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

    // Buffy's avatar/thumbnail URL (update with actual mascot image)
    public static readonly AVATAR_URL = 'https://techplay.gg/images/buffy-avatar.png';
    public static readonly FOOTER_TEXT = '🦉 Professor Buffy | TechPlay Community';

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

    public createProfileEmbed(data: {
        username: string;
        displayName: string;
        rank: string;
        xp: number;
        nextRankXp?: number;
        position?: number;
        joinedAt?: string;
        streak?: number;
        avatarUrl?: string;
    }): EmbedBuilder {
        const progress = data.nextRankXp
            ? Math.round((data.xp / data.nextRankXp) * 100)
            : 100;

        const progressBar = this.createProgressBar(progress);

        const embed = new EmbedBuilder()
            .setTitle(`📜 ${data.displayName}'s Profile`)
            .setDescription(`*"Ah yes, let me consult the ancient records..."*`)
            .addFields(
                { name: '🏅 Rank', value: data.rank, inline: true },
                { name: '⭐ XP', value: data.xp.toLocaleString(), inline: true },
                { name: '🏆 Position', value: data.position ? `#${data.position}` : 'Unranked', inline: true },
                { name: '📊 Progress to Next Rank', value: `${progressBar} ${progress}%`, inline: false },
            )
            .setColor(BuffyService.COLORS.PRIMARY)
            .setThumbnail(data.avatarUrl || BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();

        if (data.streak && data.streak > 0) {
            embed.addFields({ name: '🔥 Daily Streak', value: `${data.streak} days`, inline: true });
        }

        return embed;
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
            .setTitle(`🦉 Professor Buffy's Command Guide`)
            .setDescription(
                `*Greetings, young gamer! Here are the commands at your disposal:*\n\n` +
                `**📊 Profile & Stats**\n` +
                `\`/profile\` - View your TechPlay profile\n` +
                `\`/profile @user\` - View someone else's profile\n` +
                `\`/leaderboard\` - See the top 10 members\n` +
                `\`/stats\` - Server statistics\n\n` +
                `**🎁 Rewards**\n` +
                `\`/daily\` - Claim your daily XP bonus\n` +
                `\`/trivia\` - Start a trivia question for XP\n\n` +
                `**🔗 Account**\n` +
                `\`/link\` - Link your TechPlay account\n\n` +
                `**📚 Information**\n` +
                `\`/tip\` - Get a random gaming/tech tip\n` +
                `\`/help\` - Show this help message\n\n` +
                `*Earn XP by chatting, and climb the ranks!* 🚀`
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

    public createNotLinkedEmbed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`🔗 Account Not Linked`)
            .setDescription(
                `*Professor Buffy checks his records...*\n\n` +
                `Your Discord isn't linked to a TechPlay account yet!\n\n` +
                `**How to link:**\n` +
                `1. Visit [techplay.gg](https://techplay.gg)\n` +
                `2. Go to Settings → Connected Accounts\n` +
                `3. Click "Connect Discord"\n\n` +
                `Or use \`/link\` for instructions!`
            )
            .setColor(BuffyService.COLORS.WARNING)
            .setThumbnail(BuffyService.AVATAR_URL)
            .setFooter({ text: BuffyService.FOOTER_TEXT })
            .setTimestamp();
    }
}
