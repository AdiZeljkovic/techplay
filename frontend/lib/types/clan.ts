/** The clan system's shared shapes — directory rows, the profile payload,
 *  and the roster. Backend: ClanController (docs/33-clan-system-plan.md). */

export type ClanRole = "owner" | "officer" | "member";
export type ClanStatus = "recruiting" | "invite_only" | "closed";
export type ClanSizeCategory = "small" | "medium" | "large";

export interface ClanProgress {
    level: number;
    tier: number;
    tier_name: string;
    xp: number;
    level_start: number;
    next_level_xp: number;
    percent: number;
}

export interface ClanResources {
    intel: number;
    materials: number;
    prestige: number;
    prestige_lifetime: number;
}

/** One row of the /clans directory. */
export interface ClanSummary {
    id: number;
    name: string;
    slug: string;
    tag: string | null;
    description: string | null;
    motto: string | null;
    logo: string | null;
    banner: string | null;
    focus: string | null;
    region: string | null;
    playstyle: string | null;
    status: ClanStatus | null;
    level: number;
    tier_name: string;
    members_count: number;
    member_limit: number;
    active_members: number;
    activity_score: number;
    prestige_lifetime: number;
    size_category: ClanSizeCategory;
    created_at: string;
}

export interface ClanRosterMember {
    user: { username: string; avatar: string | null; xp: number };
    role: ClanRole;
    joined_at: string | null;
    online: boolean;
    in_game: string | null;
    main_game: string | null;
    contribution: number;
    contribution_week: number;
}

export interface ClanFeedItem {
    id: number;
    type: string;
    title: string;
    meta: Record<string, unknown> | null;
    created_at: string;
    user: { id: number; username: string; avatar_url: string | null } | null;
}

export interface ClanGameRow {
    slug: string;
    name: string;
    background_image: string | null;
    players: number;
    percent: number;
}

export interface ClanApplicationRow {
    id: number;
    message: string | null;
    status: string;
    created_at: string;
    user: { id: number; username: string; display_name: string | null; avatar_url: string | null; xp: number };
}

/** What the profile page knows about the person looking at it. */
export interface ClanViewerState {
    role: ClanRole | null;
    in_other_clan: boolean;
    application_pending: boolean;
}

export interface ClanProfile extends ClanSummary {
    requirements: string | null;
    language: string | null;
    owner: { id: number; username: string; avatar: string | null };
    progress: ClanProgress;
    resources: ClanResources;
    online_count: number;
    roster: ClanRosterMember[];
    top_contributors: ClanRosterMember[];
    clan_games: ClanGameRow[];
    viewer: ClanViewerState | null;
    pending_applications: number;
    forum_slug: string;
    feed: ClanFeedItem[];
}
