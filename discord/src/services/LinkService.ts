import { CommandInteraction, GuildMember, MessageFlags, Role } from 'discord.js';
import { ApiService } from './ApiService';

/**
 * Ties a Discord member to their TechPlay account, and their rank to a role.
 *
 * The map between the two used to be written here by hand:
 *
 *     Newbie, Gamer, Pro Gamer, Elite, Legend
 *
 * "Gamer" and "Pro Gamer" have never existed in the rank table. "Newbie" and
 * "Noob" were retired on 24 Aug 2026 when two seeded ladders were merged. Of
 * the five, two still matched anything — so /sync could assign the correct
 * role for two rungs out of twenty, and silently did nothing for the rest.
 *
 * The ladder now comes from /discord/ranks, which reads the same table the
 * site promotes people against. A second copy of a list is a list that drifts.
 */
export class LinkService {
    private api: ApiService;

    /** Roles that are ours to manage. Anything else on a member is left alone. */
    private static ladder: string[] | null = null;

    constructor() {
        this.api = ApiService.getInstance();
    }

    public async handleLinkCommand(interaction: CommandInteraction) {
        await interaction.reply({
            content:
                `🔗 **Link your TechPlay account**\n\n` +
                `Open [your settings](https://techplay.gg/settings?section=connections) and press **Connect Discord**. Then run \`/sync\` here.\n\n` +
                `**What linking gets you**\n` +
                `• Your rank role in this server, kept current as you climb\n` +
                `• XP for talking here, counted toward the same ladder as the site\n` +
                `• \`/profile\`, \`/library\` and \`/match\` start answering about you\n` +
                `• Whatever you are playing shows on your profile automatically`,
            flags: MessageFlags.Ephemeral,
        });
    }

    public async handleSyncCommand(interaction: CommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const data = await this.api.getUserByDiscordId(interaction.user.id);

        if (!data || !data.user) {
            await interaction.editReply({
                content:
                    `❌ **Not linked yet.**\n\n` +
                    `Open [your settings](https://techplay.gg/settings?section=connections) and press **Connect Discord**, then run \`/sync\` again.`,
            });
            return;
        }

        const user = data.user;
        const member = interaction.member as GuildMember;
        const result = await this.syncRankRole(member, user.rank);

        const lines = [
            `✅ **Synced** — ${user.name} (@${user.username})`,
            `Rank **${user.rank}** · ${Number(user.xp).toLocaleString()} XP · Level ${user.level}`,
        ];

        if (result === 'assigned') lines.push(`Role **${user.rank}** is yours.`);
        // A rung with no role in this server is worth saying out loud: silence
        // here is what hid the broken map for months.
        if (result === 'missing') lines.push(`⚠️ There is no **${user.rank}** role in this server yet — ask a moderator to add one.`);

        await interaction.editReply({ content: lines.join('\n') });
    }

    /**
     * Give the member the role for their rank, and take away the ones for
     * rungs they have passed or not reached.
     *
     * Only roles named in the ladder are touched. Somebody's Booster, staff or
     * ping roles are none of this method's business.
     */
    private async syncRankRole(member: GuildMember, rankName: string): Promise<'assigned' | 'missing' | 'skipped'> {
        if (!member || !rankName) return 'skipped';

        const ladder = await this.ladderNames();
        if (ladder.length === 0) return 'skipped';

        const managed = new Set(ladder.map(n => n.toLowerCase()));
        const wanted = rankName.toLowerCase();

        const stale = member.roles.cache.filter(
            (r: Role) => managed.has(r.name.toLowerCase()) && r.name.toLowerCase() !== wanted,
        );

        for (const role of stale.values()) {
            try {
                await member.roles.remove(role);
            } catch {
                // A role above the bot in the hierarchy cannot be removed.
                // Not fatal, and not worth failing the whole sync over.
            }
        }

        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() === wanted);

        if (!role) return 'missing';

        if (member.roles.cache.has(role.id)) return 'assigned';

        try {
            await member.roles.add(role);
            return 'assigned';
        } catch (error) {
            console.error(`[LinkService] could not assign ${rankName}:`, error);
            return 'missing';
        }
    }

    /** The ladder, fetched once per process. It changes about once a year. */
    private async ladderNames(): Promise<string[]> {
        if (LinkService.ladder) return LinkService.ladder;

        const ranks = await this.api.getRanks();

        if (ranks.length > 0) {
            LinkService.ladder = ranks.map(r => r.name);
        }

        return LinkService.ladder ?? [];
    }
}
