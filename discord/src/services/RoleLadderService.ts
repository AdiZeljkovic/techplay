import { Guild, Role } from 'discord.js';
import { ApiService } from './ApiService';

export interface LadderPlan {
    /** Discord roles to rename, because the rank they stand for was renamed. */
    renames: { from: string; to: string }[];
    /** Ranks with no role in this server at all. */
    missing: string[];
    /** Roles that look like ranks but match nothing on the ladder any more. */
    orphans: string[];
    /** Ranks already correct. Counted, not listed — twenty lines of "fine" helps nobody. */
    correct: number;
    /** True when there is nothing to do. */
    clean: boolean;
}

/**
 * Brings the server's rank roles in line with the ladder.
 *
 * The roles in this server are the ladder as it was when the bot was written,
 * typos and all: `Rokie`, `Challener`, `Legendary`, `Global Elite`,
 * `God Of Gaming`, and `Noob` and `Newbie` which were retired on 24 Aug 2026
 * when two separately seeded ladders were merged. `Apex` was never created at
 * all. Twenty roles, and only twelve of them name a rank that still exists.
 *
 * Two things this deliberately does not do.
 *
 * It does not guess. The renames below are the historical record of that
 * merge, not a fuzzy match — `Legendary` became `Legend` because that is what
 * happened to the row, and a name this list does not know is reported rather
 * than touched.
 *
 * And it never deletes. Removing a role takes it off everybody who has it,
 * which is somebody's rank vanishing from their name to fix a spelling. What
 * cannot be matched is listed for a human to decide on.
 */
export class RoleLadderService {
    /**
     * What each retired role became, from the 24 Aug 2026 merge.
     *
     * `Global Elite` has no entry: it sat at 150,000 XP alongside `Radiant`,
     * and the merge kept Radiant. Renaming it would collide with a role that
     * already exists, so it surfaces as an orphan for a human to retire.
     */
    private static readonly RENAMED: Record<string, string> = {
        'noob': 'Newcomer',
        'newbie': 'Player',
        'rokie': 'Rookie',
        'challener': 'Challenger',
        'legendary': 'Legend',
        'god of gaming': 'Eternal',
    };

    constructor(private readonly api: ApiService) {}

    /** What is out of line, without changing anything. */
    public async plan(guild: Guild): Promise<LadderPlan | null> {
        const ranks = await this.api.getRanks();

        if (ranks.length === 0) return null;

        await guild.roles.fetch();

        const ladder = ranks.map(r => r.name);
        const byLower = new Map(guild.roles.cache.map(r => [r.name.toLowerCase(), r] as const));
        const ladderLower = new Set(ladder.map(n => n.toLowerCase()));

        const renames: { from: string; to: string }[] = [];
        const missing: string[] = [];
        const orphans: string[] = [];

        for (const [oldName, newName] of Object.entries(RoleLadderService.RENAMED)) {
            const role = byLower.get(oldName);

            // Only when the destination is free. If both names somehow exist,
            // renaming would make two roles with one name.
            if (role && !byLower.has(newName.toLowerCase())) {
                renames.push({ from: role.name, to: newName });
            } else if (role) {
                orphans.push(role.name);
            }
        }

        const willExist = new Set([
            ...[...byLower.keys()],
            ...renames.map(r => r.to.toLowerCase()),
        ]);

        for (const name of ladder) {
            if (!willExist.has(name.toLowerCase())) missing.push(name);
        }

        // A role that looks like it belongs to the ladder — sitting between
        // the rank roles — but names nothing on it. Only the ones this class
        // knows were retired are reported; everything else in the server is
        // none of its business.
        for (const [lower, role] of byLower) {
            if (ladderLower.has(lower)) continue;
            if (RoleLadderService.RENAMED[lower] && !orphans.includes(role.name)) continue;
            if (lower === 'global elite' && !orphans.includes(role.name)) orphans.push(role.name);
        }

        const correct = ladder.filter(n => byLower.has(n.toLowerCase())).length;

        return {
            renames,
            missing,
            orphans,
            correct,
            clean: renames.length === 0 && missing.length === 0 && orphans.length === 0,
        };
    }

    /**
     * Carry the plan out. Renames first, then the ranks that have no role.
     *
     * Every step is allowed to fail on its own: a role above the bot in the
     * hierarchy cannot be renamed, and the sensible answer is to say which one
     * rather than to abandon the other nineteen.
     */
    public async apply(guild: Guild, plan: LadderPlan): Promise<{ renamed: string[]; created: string[]; failed: string[] }> {
        const renamed: string[] = [];
        const created: string[] = [];
        const failed: string[] = [];

        for (const { from, to } of plan.renames) {
            const role = guild.roles.cache.find(r => r.name === from);
            if (!role) continue;

            try {
                await role.setName(to, 'Rank ladder alignment');
                renamed.push(`${from} → ${to}`);
            } catch {
                failed.push(`rename ${from} → ${to}`);
            }
        }

        const ranks = await this.api.getRanks();
        const colours = new Map(ranks.map(r => [r.name, r.color] as const));

        for (const name of plan.missing) {
            try {
                const role = await guild.roles.create({
                    name,
                    color: this.colourOf(colours.get(name)),
                    // Not hoisted and not mentionable: twenty rank roles each
                    // carving out their own section of the member list would
                    // make the sidebar unreadable.
                    hoist: false,
                    mentionable: false,
                    reason: 'Rank ladder alignment',
                });
                created.push(role.name);
            } catch {
                failed.push(`create ${name}`);
            }
        }

        return { renamed, created, failed };
    }

    /** `#FC4100` as discord.js wants it, or the default grey. */
    private colourOf(hex?: string | null): number {
        if (!hex) return 0x99AAB5;
        const clean = hex.replace('#', '');

        return /^[0-9a-fA-F]{6}$/.test(clean) ? parseInt(clean, 16) : 0x99AAB5;
    }
}
