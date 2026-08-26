import type { PlayingNowGame } from "@/lib/types/profile";

/** GET /me/dashboard — aggregated payload for the logged-in homepage. */

export interface DashboardGameCover {
    slug: string;
    name: string;
    cover_url: string | null;
    hours_played?: number;
    progress?: number;
    /** null means nothing measured it — show "not tracked", never "0h". */
    playtime_source?: "steam" | "discord" | "presence" | "manual" | null;
    status?: string;
}

export interface DashboardUser {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    cover_image: string | null;
    bio: string | null;
    location: string | null;
    tagline: string | null;
    playstyle_tags: string[];
    level: number;
    xp: number;
    rank_name: string | null;
    /** Tier colour from the rank ladder (Bronze #cd7f32 … Radiant #00e5ff) */
    rank_color: string | null;
    rank_icon: string | null;
    /** Floor of the current rank band — the gauge fills across the band. */
    rank_min_xp: number;
    next_rank: { name: string; min_xp: number; color: string | null } | null;
    is_staff: boolean;
    /** "Apr 2021" — for the Member since line. */
    member_since: string | null;
    /** Platform handles, keyed by platform — drives the hero's platform chips. */
    gamertags: Record<string, string>;
    /** Equipped avatar-frame cosmetic: a CSS colour or gradient, or null. */
    frame: string | null;
}

export interface DashboardStats {
    games_count: number;
    /** Wallet, for the owner's daily hub. */
    bounty_balance?: number;
    playing_count: number;
    /** Played, set down, not claimed finished — the bucket most of a Steam import lands in. */
    played_count: number;
    backlog_count: number;
    completed_count: number;
    wishlist_count: number;
    favorites_count: number;
    achievements_count: number;
    /** Visible catalog size — the strip reads "68 / 120". */
    achievements_total: number;
    reviews_count: number;
    completed_this_month: number;
    hours_played: number;
    friends_count: number;
}

export interface DashboardAchievement {
    id: number;
    name: string;
    description: string | null;
    icon_path: string | null;
    points: number;
    unlocked_at: string | null;
}

export interface FriendOnline {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    /** Live presence right now — game_name is only set when true. */
    is_online: boolean;
    game_name: string | null;
    game_slug: string | null;
}

export interface ProfileCompletion {
    percent: number;
    missing: { key: string; label: string }[];
}

export interface BacklogSuggestion {
    slug: string;
    name: string;
    cover_url: string | null;
    genres: string[];
    /** null when the library is too thin to score against */
    match_percent: number | null;
}

export interface DashboardData {
    user: DashboardUser;
    stats: DashboardStats;
    playing_now: PlayingNowGame[];
    favorites: DashboardGameCover[];
    backlog_preview: DashboardGameCover[];
    backlog_suggestion: BacklogSuggestion | null;
    /** Shape mirrors StreakService::info */
    streak: { streak: number; claimed_today: boolean; last_claim: string | null; next_bounty: number };
    /** What you told the site you are playing; same shape the profile returns. */
    presence?: { game_name: string | null; game_slug: string | null; source: string | null } | null;
    recent_achievements: DashboardAchievement[];
    friends_online: FriendOnline[];
    profile_completion: ProfileCompletion;
}
