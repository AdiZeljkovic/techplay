import { Client, Events, GuildMember, Message, Presence, TextChannel } from 'discord.js';
import axios from 'axios';
import { config } from '../config';
import { BuffyService } from '../services/BuffyService';
import { ChallengeService } from '../services/ChallengeService';

// ═══════════════════════════════════════════════════════════════════════════════
// Comprehensive bad word filter for gaming community
// Categories: slurs, hate speech, extreme profanity, spam/scam, harassment
// ═══════════════════════════════════════════════════════════════════════════════
const BAD_WORDS: string[] = [
    // Spam / Scam
    'free nitro', 'discord nitro free', 'claim reward', 'click here now',
    'earn money fast', 'crypto giveaway', 'nft scam',

    // Toxic behavior / Threats
    'kys', 'kill yourself', 'go die', 'neck yourself', 'end yourself',

    // Racial slurs
    'nigger', 'nigga', 'chink', 'wetback', 'spic', 'beaner', 'gook',
    'kike', 'sandnigger', 'coon', 'towelhead', 'raghead',

    // Homophobic slurs
    'faggot', 'fag', 'dyke', 'tranny',

    // Sexual harassment
    'send nudes', 'dick pic', 'cp links',

    // Extreme insults
    'retard', 'retarded',

    // Server disruption
    'raid this server', 'nuke server', 'everyone join',
    'discord.gg/', 'discordapp.com/invite', // Uninvited server ads

    // Doxxing / Personal info threats
    'doxx', 'doxing', 'swat', 'swatting', 'i know where you live',
];

/**
 * Sets up the welcome message handler for new guild members.
 */
export function setupWelcome(client: Client) {
    client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
        const buffy = BuffyService.getInstance();

        const welcomeChannel = member.guild.channels.cache.find(
            c => c.name === 'new-people'
        );

        if (welcomeChannel && welcomeChannel.isTextBased()) {
            const embed = buffy.createWelcomeEmbed(member.user.username, member.guild.memberCount);
            await welcomeChannel.send({ embeds: [embed] });
        }
    });

    console.log('👋 Welcome handler registered');
}

/**
 * Sets up auto-moderation (bad word filter) for incoming messages.
 */
export function setupModeration(client: Client) {
    client.on(Events.MessageCreate, async (message: Message) => {
        if (message.author.bot) return;

        const content = message.content.toLowerCase();

        if (BAD_WORDS.some(word => content.includes(word))) {
            try {
                await message.delete();
                console.log(`🚫 Deleted message from ${message.author.tag} (matched filter)`);

                // Optionally warn the user via DM
                try {
                    await message.author.send(
                        `⚠️ **Auto-Moderation:** Your message in **${message.guild?.name}** was removed because it contained prohibited content. Please review the server rules.`
                    );
                } catch {
                    // User may have DMs disabled — that's okay
                }
            } catch (error) {
                console.error('Failed to delete filtered message:', error);
            }
        }
    });

    console.log('🛡️ Auto-moderation handler registered');
}

/**
 * Sets up Discord Rich Presence tracking → syncs "Playing Now" to TechPlay backend.
 * Only fires for guild members (not DMs). Throttled: one API call per user per 30s.
 */
export function setupPresenceTracking(client: Client) {
    const lastReported = new Map<string, { game: string | null; ts: number }>();
    const THROTTLE_MS = 30_000;

    client.on(Events.PresenceUpdate, async (_old: Presence | null, newPresence: Presence) => {
        const userId = newPresence.userId;
        if (!userId || newPresence.user?.bot) return;

        // Find the first PLAYING (type 0) activity
        const gameActivity = newPresence.activities.find(a => a.type === 0);
        const gameName = gameActivity?.name ?? null;

        const prev = lastReported.get(userId);
        const now = Date.now();

        // Skip if same state reported within throttle window
        if (prev && prev.game === gameName && now - prev.ts < THROTTLE_MS) return;

        lastReported.set(userId, { game: gameName, ts: now });

        try {
            await axios.post(`${config.apiUrl}/discord/presence`, {
                discord_id: userId,
                game_name: gameName,
            }, {
                headers: { 'X-Bot-Secret': config.botSecret },
                timeout: 5000,
            });
        } catch {
            // Non-critical — presence update failures are silent
        }
    });

    console.log('🎮 Presence tracking handler registered');
}

/**
 * Sets up challenge acceptance via message reactions (✅ / ❌).
 */
export function setupChallengeReactions(client: Client) {
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

    console.log('⚔️ Challenge reaction handler registered');
}
