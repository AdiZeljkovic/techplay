import type { DashboardData } from "@/lib/types/dashboard";
import type { UserProfile } from "@/lib/types/profile";

/**
 * One identity band serves every profile, but it is fed by two endpoints:
 * `/me/dashboard` for your own page and `/users/{username}` for everyone
 * else's. Both are normalised here so `ProfileHero` never has to know which
 * one it is looking at.
 */
export interface HeroModel {
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
    rank_color: string | null;
    next_rank: { name: string; min_xp: number; color: string | null } | null;
    is_online: boolean;
    /** Staff tick next to the name. */
    verified: boolean;
    /** Gamertag keys — steam / psn / xbox / epic / discord. */
    platforms: string[];
    /** Paint for the avatar ring, from the equipped frame cosmetic. */
    frame_value: string | null;
    /** Where the current rank band starts — the gauge fills across the band. */
    rank_min_xp: number;
    streak_days: number;
    stats: { games: number; reviews: number; hours: number; achievements: number; friends: number };
    /** Used behind the identity when no cover image is set. */
    backdrop_fallback: string | null;
    /** Drives the owner's primary CTA; visitors get a friend action instead. */
    continue_playing: { slug: string; name: string } | null;
}

export function heroFromDashboard(data: DashboardData): HeroModel {
    const { user, stats, playing_now } = data;
    const firstPlaying = playing_now[0];

    return {
        username: user.username,
        display_name: user.display_name || user.username,
        avatar_url: user.avatar_url,
        cover_image: user.cover_image,
        bio: user.bio,
        location: user.location,
        tagline: user.tagline,
        playstyle_tags: user.playstyle_tags ?? [],
        level: user.level,
        xp: user.xp,
        rank_name: user.rank_name,
        rank_color: user.rank_color,
        next_rank: user.next_rank,
        // You are looking at your own page, so you are online by definition.
        is_online: true,
        verified: !!user.is_staff,
        platforms: user.platforms ?? [],
        frame_value: user.frame ?? null,
        rank_min_xp: user.rank_min_xp ?? 0,
        streak_days: data.streak?.streak ?? 0,
        stats: {
            games: stats.games_count,
            reviews: stats.reviews_count,
            hours: stats.hours_played,
            achievements: stats.achievements_count,
            friends: stats.friends_count,
        },
        backdrop_fallback: firstPlaying?.background_image ?? data.favorites[0]?.background_image ?? null,
        continue_playing: firstPlaying ? { slug: firstPlaying.slug, name: firstPlaying.name } : null,
    };
}

export function heroFromProfile(profile: UserProfile): HeroModel {
    const { user, stats } = profile;
    const firstPlaying = profile.playing_now?.[0];

    return {
        username: user.username,
        display_name: user.display_name || user.username,
        avatar_url: user.avatar_url ?? null,
        cover_image: user.cover_image ?? null,
        bio: user.bio ?? null,
        location: user.location ?? null,
        tagline: user.tagline ?? null,
        playstyle_tags: user.playstyle_tags ?? [],
        level: stats.level,
        xp: stats.xp ?? user.xp ?? 0,
        rank_name: user.rank?.name ?? null,
        rank_color: user.rank?.color ?? null,
        next_rank: profile.next_rank
            ? { name: profile.next_rank.name, min_xp: profile.next_rank.min_xp, color: profile.next_rank.color ?? null }
            : null,
        is_online: profile.is_online ?? false,
        verified: !!profile.is_staff,
        platforms: Object.entries(user.gamertags ?? {})
            .filter(([, v]) => !!v)
            .map(([k]) => k),
        frame_value: profile.customization?.equipped?.frame?.value ?? null,
        rank_min_xp: user.rank?.min_xp ?? 0,
        streak_days: profile.streak?.days ?? 0,
        stats: {
            games: stats.games_count ?? 0,
            reviews: stats.reviews_count ?? 0,
            hours: stats.hours_played ?? 0,
            achievements: stats.achievements_count,
            friends: stats.friends_count ?? 0,
        },
        backdrop_fallback: firstPlaying?.background_image ?? profile.showcase?.[0]?.background_image ?? null,
        continue_playing: firstPlaying ? { slug: firstPlaying.slug, name: firstPlaying.name } : null,
    };
}
