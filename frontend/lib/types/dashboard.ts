import type { PlayingNowGame } from "@/lib/types/profile";

/** GET /me/dashboard — aggregated payload for the logged-in homepage. */

export interface DashboardGameCover {
    slug: string;
    name: string;
    background_image: string | null;
}

export interface DashboardUser {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
    xp: number;
    rank_name: string | null;
    next_rank: { name: string; min_xp: number } | null;
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
}

export interface DashboardData {
    user: DashboardUser;
    stats: DashboardStats;
    playing_now: PlayingNowGame[];
    favorites: DashboardGameCover[];
    backlog_preview: DashboardGameCover[];
    streak: { days: number; claimed_today: boolean };
}
