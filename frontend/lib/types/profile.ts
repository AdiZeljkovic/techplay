export interface Achievement {
    id: number;
    name: string;
    description: string;
    points: number;
    icon_path?: string;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

/* ── Gaming Journal ────────────────────────────────────────────────────── */

export interface JournalGameRef {
    slug: string;
    name: string;
    cover_url: string | null;
}

export interface GamingMoment {
    id: number;
    type: "screenshot" | "clip";
    url: string | null;
    provider: string | null;
    thumbnail_url: string | null;
    /** Signed, short-lived URL — screenshots are no longer on the public disk. */
    image_url: string | null;
    caption: string | null;
    has_spoilers: boolean;
}

export interface PlaySession {
    id: number;
    played_on: string;
    minutes: number;
    platform: string | null;
    progress_label: string | null;
    progress_percent: number | null;
    note: string | null;
    mood: string | null;
    companions: string[];
    has_spoilers: boolean;
    is_private: boolean;
    can_edit: boolean;
    game: JournalGameRef | null;
    moments: GamingMoment[];
}

export interface JournalPayload {
    sessions: PlaySession[];
    total_sessions: number;
    summary: {
        sessions: number;
        minutes: number;
        hours: number;
        games: number;
        days: number;
        busiest_month: { month: string; label: string; minutes: number } | null;
        current_streak: number;
    };
    calendar: { date: string; minutes: number; sessions: number; games: string[] }[];
    per_game: { game: JournalGameRef; minutes: number; sessions: number; percent: number; last_played: string | null }[];
    completed_timeline: {
        slug: string; name: string; cover_url: string | null;
        completed_at: string | null; hours: number; from_backlog: boolean;
    }[];
    /**
     * The years behind a player, assembled from dates rather than from logged
     * sessions — so an imported library has a history without anyone having
     * typed a diary entry.
     *
     * `hours_held` is the hours those games hold in total. It is not hours
     * played in that year: Steam reports one lifetime figure per game and
     * never says when any of it happened, so a year's real measure is its
     * unlocks, each of which carries the moment it happened.
     */
    history: {
        span: { from: number; to: number } | null;
        totals: { hours: number; games_with_time: number; unlocks: number };
        devices: {
            minutes: Record<string, number>;
            attributed_hours: number;
            total_hours: number;
        };
        years: {
            year: number;
            games_left_off: number;
            hours_held: number;
            unlocks: number;
            unlock_games: number;
            games: { slug: string; name: string; cover_url: string | null; hours: number; status: string; platform: string | null }[];
            finished: { slug: string; name: string; cover_url: string | null }[];
        }[];
    };
    reviews: {
        id: number; rating: number; review: string | null;
        created_at: string | null; game: JournalGameRef;
    }[];
    moods: string[];
    is_owner: boolean;
}

/* ── Gamer DNA ─────────────────────────────────────────────────────────── */

/** One axis of the playstyle fingerprint. `measured` is false where the value
 *  is read out of genre vocabulary rather than observed play. */
export interface DnaAxis {
    key: string;
    left: string;
    right: string;
    value: number;
    basis: string;
    measured: boolean;
}

export interface DnaEra {
    key: string;
    label: string;
    range: string;
    color: string;
    count: number;
    percent: number;
}

export interface DnaArchetype {
    key: string;
    name: string;
    icon: string;
    level: number;
    max_level: number;
    value: number;
    next_at: number | null;
    percent: number;
    hint: string;
}

export interface GamerDnaPayload {
    identity: { traits: string[]; blurb: string; tier: string };
    score: {
        value: number;
        max: number;
        component_max: number;
        breakdown: { key: string; label: string; value: number }[];
        /** null until enough profiles carry a score for the figure to mean anything. */
        percentile: number | null;
    };
    genres: DistributionStat[];
    platforms: DistributionStat[];
    eras: DnaEra[];
    fingerprint: DnaAxis[];
    collection: {
        total: number; playing: number; played: number; completed: number; backlog: number;
        wishlist: number; dropped: number; favorites: number; completion_rate: number;
    };
    /**
     * What the shelf did, rather than what it holds.
     *
     * `median_hours` and not an average: one MMO drags a mean far enough to
     * describe nobody. `devices` reports its own coverage because Steam only
     * began attributing playtime to a machine partway through.
     */
    play: {
        hours: number;
        games_played: number;
        median_hours: number | null;
        deepest: { slug: string; name: string; cover_url: string | null; hours: number; share: number } | null;
        devices: { minutes: Record<string, number>; placed_hours: number; total_hours: number };
        span: { from: number; to: number; years_active: number } | null;
    };
    /** Steam's own achievements — what happened inside the games. */
    platform_achievements: {
        total: number; earned: number; games: number; perfected: number; rate: number;
    };
    contribution: { label: string; value: number; target: number; percent: number }[];
    badges: { items: { id: number; name: string; icon_path?: string; points: number }[]; more: number };
    setup: {
        specs: Record<string, string>;
        tier: { label: string; level: number; note: string } | null;
        gamertags: Record<string, string>;
    };
    archetypes: DnaArchetype[];
    /** The three games that took the hours — or, failing hours, the choices. */
    signature: {
        slug: string; name: string; cover_url: string | null;
        hours: number; status: string; is_favorite: boolean;
        basis: "hours" | "favorite" | "completed";
    }[];
    /** Read off the journal: a shelf says what you own, sessions say what you did. */
    rhythm: {
        sessions: number; minutes: number; average: number; longest: number;
        best_day: { name: string; minutes: number } | null;
        moods: DistributionStat[];
    };
    /** Medians, not means: the habit rather than its worst night. */
    milestones: {
        collecting_since: string | null;
        collecting_days: number;
        finish_days: number | null;
        finish_sample: number;
        backlog_months: number | null;
        clears_per_month: number;
        patience_days: number | null;
        patience_label: string | null;
    };
    /** Member ratings are 1-5, the catalogue is 0-10 — both sides here are 0-10. */
    verdicts: {
        sample: number;
        yours: number | null;
        crowd: number | null;
        delta: number | null;
        label: string | null;
    };
    /** Dropped is a decision, dormant is a drift. Both are true. */
    graveyard: {
        dropped: number;
        dormant: number;
        items: { slug: string; name: string; cover_url: string | null; hours: number; status: string }[];
    };
    /** Shelves that overlap yours, straight off the chronicle. */
    peers: { username: string; display_name: string | null; avatar_url: string | null }[];
    updated_at: string;
}

export type AchievementRarity = "common" | "rare" | "epic";

/** One row of the achievements page — the catalog entry plus this viewer's standing against it. */
export interface AchievementEntry extends Achievement {
    category: string;
    criteria_type: string;
    criteria_value: number;
    /** null on manual-grant achievements, which have nothing to measure. */
    current: number | null;
    percent: number | null;
    /** null while the player base is too small for the figure to mean anything. */
    rarity_percent: number | null;
    rarity: AchievementRarity | null;
}

export interface AchievementsPayload {
    items: AchievementEntry[];
    score: number;
    unlocked_count: number;
    total: number;
    rarity_available: boolean;
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
    /** Catalogue size, counted the way the Achievements tab counts it. */
    achievements_total?: number;
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
    played_count?: number;
    backlog_count?: number;
    completed_count?: number;
    wishlist_count?: number;
    favorites_count?: number;
    dropped_count?: number;
    games_added_this_month?: number;
    /**
     * What the shelf is worth, in US cents at full price.
     *
     * `unpriced` is part of the answer, not a footnote: a shelf holds
     * free-to-play games and games the store has withdrawn, and a total that
     * counted those as zero without saying how many there were would quietly
     * understate itself.
     */
    shelf_worth?: {
        full_cents: number;
        on_sale_cents: number;
        priced: number;
        unpriced: number;
        currency: string;
    };
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

export type StoreRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

/** One entry of the unified store — a cosmetic or a redeemable good, with the
 *  viewer's standing against it already resolved server-side. */
export interface StoreItem {
    key: string;
    source: "cosmetic" | "reward";
    id: number;
    slug: string;
    name: string;
    description: string | null;
    type: string;
    category: string;
    cost: number;
    rarity: StoreRarity;
    image: string | null;
    /** The colour or gradient the cosmetic paints with — the card art uses it. */
    value: string | null;
    asset: string | null;
    owned: boolean;
    equipped: boolean;
    tier_locked: boolean;
    required_tier: string | null;
    stock: number | null;
    limited: boolean;
    affordable: boolean;
    sold_out?: boolean;
    purchase: { path: string };
}

export interface StoreCatalog {
    items: StoreItem[];
    categories: { id: string; label: string; count: number }[];
    balance: number;
    supporter_tier: string | null;
}

export interface RewardTier {
    name: string;
    family: string;
    numeral: string;
    color: string;
    level: number;
    max_level: number;
    floor: number;
    next: { name: string; at: number } | null;
    progress: number;
    remaining: number;
}

export interface BountyWallet {
    balance: number;
    transactions: BountyTransaction[];
    earned_lifetime: number;
    spent_lifetime: number;
    tier: RewardTier;
    ladder: { name: string; family: string; color: string; level: number; at: number }[];
}

export interface RewardRedemption {
    id: number;
    cost: number;
    status: string;
    created_at: string;
    reward_item?: { id: number; name: string; type: string; image: string | null } | null;
}

export interface BountyTransaction {
    id: number;
    amount: number;
    type: string;
    reason: string | null;
    balance_after: number;
    created_at: string;
}

export interface PlayingNowGame {
    slug: string;
    name: string;
    cover_url: string | null;
    platforms: string[];
    /** Running right now, per the connected store — not a shelf state. */
    live?: boolean;
    progress: number | null;
    hours_played: number | null;
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

/**
 * How serious a player is, in four figures — the question a visitor arrives
 * with and the status counts never answered.
 */
export interface PlayerCard {
    hours: number;
    games_played: number;
    /** First and last year anything was played. Null when nothing is dated. */
    span: { from: number; to: number } | null;
    deepest: { slug: string; name: string; cover_url: string | null; hours: number; share: number } | null;
    /** Null when no platform is connected — different from having earned none. */
    achievements: { total: number; earned: number; rate: number } | null;
}

export type CollectionStatus = "playing" | "replaying" | "played" | "backlog" | "completed" | "wishlist" | "dropped";

export interface CollectionEntry {
    id: number;
    status: CollectionStatus;
    is_favorite: boolean;
    showcase_order?: number | null;
    progress: number;
    hours_played: number;
    /** The reader's own label for where they play it. Free text, editable. */
    platform: string | null;
    /** Which stores reported it — provenance, which is what the marks mean. */
    sources?: string[];
    started_at: string | null;
    completed_at: string | null;
    /** How many times it has been finished. A replay is the next one after. */
    playthroughs?: number;
    /** When it entered the shelf — distinct from the last edit. */
    added_at?: string | null;
    updated_at: string;
    game: {
        id: number;
        slug: string;
        name: string;
        released: string | null;
        rating: number;
        cover_url: string | null;
        platforms: string[];
        genres: string[];
    } | null;
}

/**
 * Where a player stands on the site's one ladder.
 *
 * Was `ReputationData`, and carried a Standing tier + division of its own —
 * a second ladder on forum reputation whose names collided with the XP ranks
 * and whose first promotion nobody on the site had ever reached.
 */
export interface StandingData {
    /** The XP rank — the same one the hero draws. */
    rank: { name: string; color: string | null; icon: string | null; min_xp: number } | null;
    /** The next band up. Null at the top of the ladder. */
    next_rank: { name: string; min_xp: number } | null;
    xp: number;
    xp_delta_percent: number | null;
    /** Top X% of the community, by XP. */
    percentile: number;
    /** XP over the last six months, ending on today's value. */
    history?: number[];
    monthly_contribution: number;
    monthly_contribution_delta_percent: number | null;
    /** Still counted, still ranks the leaderboard — no longer a ladder. */
    reputation: number;
    reputation_delta_percent: number | null;
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

export type ListType = "top10" | "top25" | "top100" | "genre" | "custom" | "tier";

/**
 * The rungs of a tier list, best first.
 *
 * Fixed, and mirrored from GameList::TIERS. The letters are the format — S
 * above A comes from the Japanese 秀 (shū, "excellent") sitting above a
 * standard A–F report card, and it reached gaming through fighting-game
 * forums in the nineties.
 */
export const TIERS = ["S", "A", "B", "C", "D", "F"] as const;

export type Tier = (typeof TIERS)[number];

export interface GameListPreview {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_public?: boolean;
    list_type?: ListType;
    /** How many games the type allows, or null when unbounded. */
    item_limit?: number | null;
    category?: string | null;
    tags?: string[];
    allow_comments?: boolean;
    has_spoilers?: boolean;
    is_draft?: boolean;
    items_count: number;
    likes_count?: number;
    comments_count?: number;
    liked_by_me?: boolean;
    /**
     * Artwork the author chose for this list. Null means they have not, and
     * `covers` — the first few game covers — stands in.
     */
    cover_image?: string | null;
    covers: string[];
    updated_at?: string;
    user?: { username: string; display_name?: string; avatar_url?: string };
}

export interface GameListComment {
    id: number;
    body: string;
    created_at: string;
    user: { username: string; display_name?: string | null; avatar_url?: string | null };
}

export interface GameListItemEntry {
    id: number;
    position: number;
    /** Which rung, on a tier list. Null is the unranked tray, not a missing value. */
    tier?: Tier | null;
    note?: string | null;
    /** 1.0–10.0, the ranking's own scale — not the 1–5 game rating. */
    score?: number | null;
    game: {
        slug: string;
        name: string;
        released: string | null;
        rating: number;
        cover_url: string | null;
        platforms: string[];
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

/** One shelf in the trophy case, already resolved to something drawable. */
export interface TrophyCaseItem {
    source: "techplay" | "steam";
    reference: number;
    name: string;
    description: string | null;
    icon: string | null;
    /** Null for platform unlocks — they carry no score of ours. */
    points: number | null;
    game: { name: string; slug: string } | null;
    unlocked_at: string | null;
    position?: number;
}

/** How the viewer relates to the profile owner. 'incoming' = they asked me. */
export type FriendStatus = "self" | "none" | "pending" | "incoming" | "accepted";

export interface UserProfile {
    user: ProfileUser;
    stats: ProfileStats;
    achievements: Achievement[];
    trophy_case?: TrophyCaseItem[];
    /** Linked Discord, and whether they are actually in the server. */
    discord?: { member: boolean; since: string | null } | null;
    next_rank: { name: string; min_xp: number; color?: string | null } | null;
    is_online?: boolean;
    /** What they are playing while the dot is lit; null when nothing is set. */
    presence?: { game_name: string | null; game_slug: string | null; source: string | null } | null;
    streak?: { days: number; claimed_today: boolean };
    /** Owner's setting. `can_view` is the resolved answer for *this* viewer. */
    is_private?: boolean;
    can_view?: boolean;
    friend_status?: FriendStatus;
    is_staff?: boolean;
    collection_snapshot?: CollectionSnapshotTile[];
    playing_now?: PlayingNowGame[];
    showcase?: PlayingNowGame[];
    connected_accounts?: string[];
    /** Feeds the Collection tab's Platforms panel. */
    platforms_genres?: PlatformsGenres;
    /* xbox_profile, milestones, is_premium and premium_tier used to arrive here
       too, and no component has ever read one of them — they were built for
       panels that were never wired. `gamer_dna` was a fourth: a duplicate of
       platforms_genres plus a favourites query, computed on every public
       profile view and read by nothing. `player_card` took its place. */
    player_card?: PlayerCard;
    standing?: StandingData;
    recognitions?: Recognition[];
    lists?: GameListPreview[];
    customization?: CustomizationData;
}
