import type { PlayingNowGame } from "@/lib/types/profile";

/** GET /me/dashboard — aggregated payload for the logged-in homepage. */

export interface DashboardGameCover {
    slug: string;
    name: string;
    background_image: string | null;
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
    next_rank: { name: string; min_xp: number; color: string | null } | null;
    is_staff: boolean;
    /** Gamertag keys with a value — drives the platform icons in the hero. */
    platforms: string[];
}

export interface DashboardStats {
    games_count: number;
    playing_count: number;
    backlog_count: number;
    completed_count: number;
    wishlist_count: number;
    favorites_count: number;
    achievements_count: number;
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

export interface DashboardReview {
    id: number;
    /** 1–5 scale — multiply by 2 for the 10-point ScoreBadge */
    rating: number;
    excerpt: string;
    created_at: string | null;
    game: DashboardGameCover;
}

export interface FriendOnline {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
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
    background_image: string | null;
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
    highlights: { updates_from_followed: number; releases_this_week: number };
    recent_achievements: DashboardAchievement[];
    recent_reviews: DashboardReview[];
    friends_online: FriendOnline[];
    profile_completion: ProfileCompletion;
}
