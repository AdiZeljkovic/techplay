export interface Achievement {
    id: number;
    name: string;
    description: string;
    points: number;
    icon_path?: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

export interface UserRank {
    name: string;
    icon?: string;
    color?: string;
    min_xp?: number;
}

export interface ActiveSupport {
    tier: {
        name: string;
        color: string;
    };
}

export interface ProfileUser {
    id: number;
    username: string;
    display_name?: string;
    role: string;
    email: string;
    created_at: string;
    threads: any[];
    posts: any[];
    xp: number;
    gamertags: any;
    pc_specs: any;
    achievements: Achievement[];
    avatar_url?: string;
    cover_image?: string;
    bio?: string;
    location?: string;
    tagline?: string;
    playstyle_tags?: string[];
    forum_reputation?: number;
    rank?: UserRank;
    active_support?: ActiveSupport;
}

export interface ProfileStats {
    threads_count: number;
    posts_count: number;
    comments_count: number;
    reputation: number;
    joined_at: string;
    xp: number;
    achievements_count: number;
    level: number;
    /** Published game reviews — same definition as /me/dashboard */
    reviews_count?: number;
    /** Published articles, staff only */
    articles_count?: number;
    hours_played?: number;
    friends_count?: number;
    // Game collection counts (Phase 1 — default 0 until populated)
    games_count?: number;
    playing_count?: number;
    backlog_count?: number;
    completed_count?: number;
    wishlist_count?: number;
    favorites_count?: number;
    dropped_count?: number;
    games_added_this_month?: number;
    bounty_balance?: number;
}

/** A self-set target, measured live against the collection. */
export interface CollectionGoal {
    type: "complete_games" | "unlock_achievements" | "shrink_backlog";
    label: string;
    target: number;
    current: number;
    percent: number;
    done: boolean;
    /** True while the user hasn't set this one — it's showing our suggestion. */
    is_default: boolean;
}

export interface RewardItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    cost: number;
    type: string;
    image: string | null;
    stock: number | null;
}

export interface BountyTransaction {
    id: number;
    amount: number;
    type: string;
    reason: string | null;
    balance_after: number;
    created_at: string;
}

export interface RecentArticle {
    id: number;
    title: string;
    slug: string;
    type: string;
    featured_image?: string;
    excerpt?: string;
    published_at: string;
    views: number;
}

export interface PlayingNowGame {
    slug: string;
    name: string;
    background_image: string | null;
    platform_names: string[];
    progress: number;
    hours_played: number;
    /**
     * Where the playtime came from. null means nothing measured it — show
     * a prompt to connect Steam or Discord rather than "0h played".
     */
    playtime_source?: "steam" | "discord" | "presence" | "manual" | null;
}

export interface DistributionStat {
    name: string;
    count: number;
    percent: number;
}

export interface PlatformsGenres {
    platforms: DistributionStat[];
    genres: DistributionStat[];
    total: number;
}

export interface GamerDna {
    genres: DistributionStat[];
    platforms: DistributionStat[];
    playstyle: string[];
    franchises: string[];
}

export type CollectionStatus = "playing" | "backlog" | "completed" | "wishlist" | "dropped";

export interface CollectionEntry {
    id: number;
    status: CollectionStatus;
    is_favorite: boolean;
    showcase_order?: number | null;
    progress: number;
    hours_played: number;
    platform: string | null;
    started_at: string | null;
    completed_at: string | null;
    /** When it entered the shelf — distinct from the last edit. */
    added_at?: string | null;
    updated_at: string;
    game: {
        id: number;
        slug: string;
        name: string;
        released: string | null;
        rating: number;
        background_image: string | null;
        platform_names: string[];
        genre_names: string[];
    } | null;
}

export interface ReputationData {
    reputation: number;
    reputation_delta_percent: number | null;
    percentile: number;
    tier: string;
    tier_color: string;
    division: string;
    history?: number[];
    monthly_contribution: number;
    monthly_contribution_delta_percent: number | null;
}

export interface CollectionSnapshotTile {
    status: string;
    label: string;
    color: string;
    count: number;
    cover: string | null;
}

export interface Recognition {
    type: string;
    label: string;
    count: number;
}

export interface Milestone {
    key: string;
    label: string;
    icon: string | null;
    current: number;
    target: number;
    percent: number;
    completed: boolean;
}

export interface GameListPreview {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_public?: boolean;
    items_count: number;
    covers: string[];
    updated_at?: string;
}

export interface GameListItemEntry {
    id: number;
    position: number;
    game: {
        slug: string;
        name: string;
        released: string | null;
        rating: number;
        background_image: string | null;
        platform_names: string[];
    } | null;
}

export interface GameListDetail extends GameListPreview {
    items: GameListItemEntry[];
    user?: { username: string; display_name?: string; avatar_url?: string };
}

export interface EquippedCosmetic {
    name: string;
    value: string | null;
    asset: string | null;
}

export interface CustomizationSummaryRow {
    type: string;
    label: string;
    owned: number;
    total: number;
}

export interface CustomizationData {
    equipped: { theme: EquippedCosmetic | null; frame: EquippedCosmetic | null; badge: EquippedCosmetic | null };
    perks?: { active: string[]; animated_avatar: boolean; profile_spotlight: boolean };
    summary: CustomizationSummaryRow[];
    tier: string | null;
}

export interface CustomizationCatalogItem {
    id: number;
    name: string;
    slug: string;
    type: string;
    description: string | null;
    cost: number;
    required_tier: string | null;
    value: string | null;
    asset: string | null;
    owned: boolean;
    equipped: boolean;
    tier_locked: boolean;
    affordable: boolean;
}

export interface ActivityItem {
    category: string;
    type: string;
    title: string;
    url: string | null;
    created_at: string | null;
}

/** How the viewer relates to the profile owner. 'incoming' = they asked me. */
export type FriendStatus = "self" | "none" | "pending" | "incoming" | "accepted";

export interface UserProfile {
    user: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    next_rank: { name: string; min_xp: number; color?: string | null } | null;
    is_online?: boolean;
    streak?: { days: number; claimed_today: boolean };
    /** Owner's setting. `can_view` is the resolved answer for *this* viewer. */
    is_private?: boolean;
    can_view?: boolean;
    friend_status?: FriendStatus;
    recent_articles?: RecentArticle[];
    is_staff?: boolean;
    collection_snapshot?: CollectionSnapshotTile[];
    playing_now?: PlayingNowGame[];
    showcase?: PlayingNowGame[];
    connected_accounts?: string[];
    xbox_profile?: { gamertag: string | null; gamerscore: number } | null;
    clan?: { name: string; slug: string; tag: string | null; logo: string | null; role: string } | null;
    platforms_genres?: PlatformsGenres;
    gamer_dna?: GamerDna;
    reputation?: ReputationData;
    recognitions?: Recognition[];
    milestones?: Milestone[];
    lists?: GameListPreview[];
    customization?: CustomizationData;
}
