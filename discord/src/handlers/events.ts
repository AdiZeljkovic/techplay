import { Client, Events, GuildMember, Message, Presence, TextChannel } from 'discord.js';
import { ApiService } from '../services/ApiService';
import axios from 'axios';
import { config } from '../config';
import { BuffyService } from '../services/BuffyService';

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

    // Doxxing / Personal info threats
    'doxx', 'doxing', 'swat', 'swatting', 'i know where you live',
];

/**
 * Invite links, which are matched as fragments rather than words because that
 * is what they are. Note this still catches an invite back to this very server.
 */
const BAD_FRAGMENTS = ['discord.gg/', 'discordapp.com/invite'];

/**
 * Whole words, not substrings.
 *
 * The filter used `content.includes(word)`, which in a gaming server is a
 * machine for deleting innocent messages: 'spic' is inside "spicy", 'coon' is
 * inside "tycoon" and "raccoon", 'fag' is inside a dozen ordinary words. Anyone
 * recommending RollerCoaster Tycoon had their message removed and was sent a
 * warning about prohibited content.
 *
 * `\b` on both ends fixes that and keeps the multi-word phrases working, since
 * a boundary sits either side of a space too. Deliberately not defending
 * against letter-substitution — a filter that chases obfuscation is a filter
 * that starts eating ordinary words again, and a human moderator is the answer
 * to somebody who is trying.
 */
const BAD_WORD_PATTERN = new RegExp(
    `\\b(${BAD_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'i',
);

/** Does this message trip the filter? Exported so XP can ask the same question. */
export function violatesFilter(content: string): boolean {
    const lowered = content.toLowerCase();

    return BAD_WORD_PATTERN.test(lowered) || BAD_FRAGMENTS.some(f => lowered.includes(f));
}

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
 * Tells the site who is actually in the server.
 *
 * Linking a Discord account and being in the guild are different facts, and
 * the site only ever knew the first — so a profile could show the community
 * badge for somebody who left a year ago. The bot has always held the answer;
 * this is it finally saying so.
 *
 * Joins and leaves are reported as they happen, and the full roster goes over
 * on startup, which repairs anything missed while the bot was down.
 */
export function setupGuildMembership(client: Client) {
    const api = ApiService.getInstance();

    client.on(Events.GuildMemberAdd, (member: GuildMember) => {
        void api.reportMembership(member.id, true, member.joinedAt?.toISOString());
    });

    client.on(Events.GuildMemberRemove, (member) => {
        void api.reportMembership(member.id, false);
    });

    client.once(Events.ClientReady, async () => {
        try {
            const guild = client.guilds.cache.first();
            if (!guild) return;

            const members = await guild.members.fetch();
            await api.syncMembership(members.map((m) => m.id));
        } catch (error) {
            console.error('⚠️ Guild roster sync failed:', error instanceof Error ? error.message : 'Unknown error');
        }
    });

    console.log('👥 Guild membership handler registered');
}

/**
 * Sets up auto-moderation (bad word filter) for incoming messages.
 */
export function setupModeration(client: Client) {
    client.on(Events.MessageCreate, async (message: Message) => {
        if (message.author.bot) return;

        if (violatesFilter(message.content)) {
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
 * Only fires for guild members (not DMs). One call per user per 30s, and only
 * when what they are playing has actually changed.
 */
export function setupPresenceTracking(client: Client) {
    const reported = new Map<string, { game: string | null; ts: number }>();
    const wanted = new Map<string, string | null>();
    const waiting = new Map<string, ReturnType<typeof setTimeout>>();
    const THROTTLE_MS = 30_000;

    const report = async (userId: string) => {
        const gameName = wanted.get(userId) ?? null;
        const before = reported.get(userId);

        if (before && before.game === gameName) return;

        // The window opens before the call, so a slow or failing backend cannot
        // be asked again inside it. The state itself is only recorded once it
        // arrived, so a report that failed is sent again the next time presence
        // moves rather than being remembered as delivered.
        reported.set(userId, { game: before?.game ?? null, ts: Date.now() });

        try {
            await axios.post(`${config.apiUrl}/discord/presence`, {
                discord_id: userId,
                game_name: gameName,
            }, {
                headers: { 'X-Discord-Bot-Token': config.botSecret },
                timeout: 5000,
            });

            reported.set(userId, { game: gameName, ts: Date.now() });
        } catch {
            // Non-critical — presence update failures are silent
        }
    };

    client.on(Events.PresenceUpdate, (_old: Presence | null, newPresence: Presence) => {
        const userId = newPresence.userId;
        if (!userId || newPresence.user?.bot) return;

        // Find the first PLAYING (type 0) activity
        const gameActivity = newPresence.activities.find(a => a.type === 0);
        const gameName = gameActivity?.name ?? null;

        wanted.set(userId, gameName);

        /*
         * The throttle used to sit on the wrong half of this.
         *
         * An unchanged state went out again every thirty seconds — and Discord
         * emits PresenceUpdate for a great deal more than the game: going idle,
         * a Spotify track, a rich-presence timer ticking. The backend stores
         * state rather than a heartbeat, so all of that was rewriting the same
         * row, one `last_played_at` write per player per half minute, all
         * evening. A change, meanwhile, was never throttled at all, and that is
         * the case that costs something: switching titles banks a play session
         * on the site, so a launcher flickering between two of them writes
         * sessions that were never played.
         *
         * So an unchanged state is silence, and a change waits out the window.
         * The wait carries whatever is current when it expires, not what
         * started it — which is the part a throttle that simply drops the event
         * would get wrong, since presence updates stop arriving the moment
         * somebody settles on one game.
         */
        const prev = reported.get(userId);

        if (prev && prev.game === gameName) return;
        if (waiting.has(userId)) return;

        const wait = prev ? Math.max(0, THROTTLE_MS - (Date.now() - prev.ts)) : 0;

        waiting.set(userId, setTimeout(() => {
            waiting.delete(userId);
            void report(userId);
        }, wait));
    });

    console.log('🎮 Presence tracking handler registered');
}

