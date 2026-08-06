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
    featured?: boolean;
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
    cover_url: string | null;
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

/* ── the base (F3) ─────────────────────────────────────────────────────── */

export interface ClanBuildingRow {
    key: string;
    name: string;
    level: number;
    max_level: number;
    locked: boolean;
    requires_cc: number;
    next_cost: { intel: number; materials: number } | null;
    build_hours: number;
    effects: string[];
    next_effects: string[];
    project_id: number | null;
}

export interface ClanProjectRow {
    id: number;
    building_key: string;
    building_name: string;
    target_level: number;
    status: "funding" | "building" | "done" | "cancelled";
    cost_intel: number;
    cost_materials: number;
    funded_intel: number;
    funded_materials: number;
    funded_percent: number;
    finishes_at: string | null;
    started_by: string | null;
}

export interface ClanContributionRow {
    username: string;
    avatar_url: string | null;
    total: number;
}

export interface ClanMissionRow {
    id: number;
    name: string;
    description: string | null;
    type: "individual" | "squad" | "operation";
    criteria_type: string;
    target: number;
    progress: number;
    percent: number;
    per_member_target: number | null;
    qualified_members: number | null;
    stage: number;
    stages: { target: number; intel?: number; materials?: number; prestige?: number }[] | null;
    status: "active" | "completed" | "expired";
    ends_at: string | null;
    rewards: { intel: number; materials: number; prestige: number };
    top_contributors: { username: string; amount: number }[];
}

export interface ClanBoostRow {
    key: string;
    name: string;
    description: string;
    duration_hours: number;
    cost: { resource: "intel" | "materials" | "prestige"; amount: number };
    active: boolean;
    ends_at: string | null;
    on_cooldown: boolean;
    cooldown_until: string | null;
    affordable: boolean;
}

export interface ClanTrophyRow {
    id: number;
    key: string;
    title: string;
    description: string | null;
    awarded_at: string;
}

export interface ClanDnaPayload {
    genres: { name: string; count: number; percent: number }[];
    eras: { key: string; label: string; color: string; percent: number }[];
    games: number;
    completed: number;
    completion_rate: number;
    dominant_archetype: string | null;
}

export interface ClanThemeRow {
    key: string;
    name: string;
    value: string;
    requires_workshop: number;
    requires_prestige: number;
    unlocked: boolean;
}

export interface ClanPollRow {
    id: number;
    question: string;
    ends_at: string;
    closed: boolean;
    total_votes: number;
    my_vote: number | null;
    options: { label: string; votes: number; percent: number }[];
}

export interface ClanBasePayload {
    clan: {
        name: string;
        slug: string;
        tag: string | null;
        motto: string | null;
        logo: string | null;
        region: string | null;
        level: number;
        progress: ClanProgress;
        member_limit: number;
        members_count: number;
    };
    resources: {
        intel: number;
        materials: number;
        prestige: number;
        prestige_lifetime: number;
        rates: Partial<Record<"intel" | "materials" | "prestige", number>>;
        capacity: number;
    };
    base: {
        buildings: ClanBuildingRow[];
        projects: ClanProjectRow[];
        project_slots: number;
    };
    missions: ClanMissionRow[];
    boosts: { boosters: ClanBoostRow[]; slots: number; active_count: number };
    dna: ClanDnaPayload | null;
    themes: { equipped: string | null; catalog: ClanThemeRow[]; workshop_level: number };
    polls: { enabled: boolean; items: ClanPollRow[] };
    trophies: ClanTrophyRow[];
    contributions: { week: ClanContributionRow[]; month: ClanContributionRow[]; all: ClanContributionRow[] };
    recent_activity: ClanFeedItem[];
    viewer_role: ClanRole;
    can_manage: boolean;
}

export interface ClanProfile extends ClanSummary {
    requirements: string | null;
    language: string | null;
    owner: { id: number; username: string; avatar_url: string | null };
    progress: ClanProgress;
    resources: ClanResources;
    online_count: number;
    roster: ClanRosterMember[];
    top_contributors: ClanRosterMember[];
    clan_games: ClanGameRow[];
    viewer: ClanViewerState | null;
    pending_applications: number;
    forum_slug: string;
    trophies: ClanTrophyRow[];
    theme_color: string | null;
    feed: ClanFeedItem[];
}
