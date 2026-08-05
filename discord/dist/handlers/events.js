"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWelcome = setupWelcome;
exports.setupModeration = setupModeration;
exports.setupPresenceTracking = setupPresenceTracking;
exports.setupChallengeReactions = setupChallengeReactions;
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const BuffyService_1 = require("../services/BuffyService");
const ChallengeService_1 = require("../services/ChallengeService");
// ═══════════════════════════════════════════════════════════════════════════════
// Comprehensive bad word filter for gaming community
// Categories: slurs, hate speech, extreme profanity, spam/scam, harassment
// ═══════════════════════════════════════════════════════════════════════════════
const BAD_WORDS = [
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
function setupWelcome(client) {
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        const buffy = BuffyService_1.BuffyService.getInstance();
        const welcomeChannel = member.guild.channels.cache.find(c => c.name === 'new-people');
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
function setupModeration(client) {
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.author.bot)
            return;
        const content = message.content.toLowerCase();
        if (BAD_WORDS.some(word => content.includes(word))) {
            try {
                await message.delete();
                console.log(`🚫 Deleted message from ${message.author.tag} (matched filter)`);
                // Optionally warn the user via DM
                try {
                    await message.author.send(`⚠️ **Auto-Moderation:** Your message in **${message.guild?.name}** was removed because it contained prohibited content. Please review the server rules.`);
                }
                catch {
                    // User may have DMs disabled — that's okay
                }
            }
            catch (error) {
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
function setupPresenceTracking(client) {
    const lastReported = new Map();
    const THROTTLE_MS = 30000;
    client.on(discord_js_1.Events.PresenceUpdate, async (_old, newPresence) => {
        const userId = newPresence.userId;
        if (!userId || newPresence.user?.bot)
            return;
        // Find the first PLAYING (type 0) activity
        const gameActivity = newPresence.activities.find(a => a.type === 0);
        const gameName = gameActivity?.name ?? null;
        const prev = lastReported.get(userId);
        const now = Date.now();
        // Skip if same state reported within throttle window
        if (prev && prev.game === gameName && now - prev.ts < THROTTLE_MS)
            return;
        lastReported.set(userId, { game: gameName, ts: now });
        try {
            await axios_1.default.post(`${config_1.config.apiUrl}/discord/presence`, {
                discord_id: userId,
                game_name: gameName,
            }, {
                headers: { 'X-Bot-Secret': config_1.config.botSecret },
                timeout: 5000,
            });
        }
        catch {
            // Non-critical — presence update failures are silent
        }
    });
    console.log('🎮 Presence tracking handler registered');
}
/**
 * Sets up challenge acceptance via message reactions (✅ / ❌).
 */
function setupChallengeReactions(client) {
    client.on(discord_js_1.Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot)
            return;
        const challengeService = ChallengeService_1.ChallengeService.getInstance();
        const pending = challengeService.getPendingChallenge(reaction.message.channelId);
        if (!pending || pending.opponentId !== user.id)
            return;
        const channel = reaction.message.channel;
        if (!channel.isTextBased() || channel.isDMBased())
            return;
        if (reaction.emoji.name === '✅') {
            await challengeService.acceptChallenge(user.id, reaction.message.channelId);
        }
        else if (reaction.emoji.name === '❌') {
            await challengeService.declineChallenge(user.id, reaction.message.channelId);
            await channel.send(`❌ **${pending.opponentName}** declined the challenge.`);
        }
    });
    console.log('⚔️ Challenge reaction handler registered');
}
