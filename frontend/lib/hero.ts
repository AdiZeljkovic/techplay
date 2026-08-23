import { getStorageUrl } from "@/lib/imageUrl";
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
    /** Rank artwork. Null until the icons are seeded — the UI falls back. */
    rank_icon: string | null;
    next_rank: { name: string; min_xp: number; color: string | null; icon?: string | null } | null;
    is_online: boolean;
    /** Staff tick next to the name. */
    verified: boolean;
    /** Platform handles in display order — key plus the tag itself. */
    platforms: { key: string; handle: string }[];
    /** Paint for the avatar ring, from the equipped frame cosmetic. */
    frame_value: string | null;
    /** Where the current rank band starts — the gauge fills across the band. */
    rank_min_xp: number;
    streak_days: number;
    /** "Apr 2021" */
    joined: string | null;
    /** Visible achievement catalog size; null when the payload can't say. */
    achievements_total: number | null;
    stats: { games: number; completed: number; reviews: number; achievements: number; hours: number };
    /**
     * The first year anything on this shelf was played. A visitor's deck ends
     * on it, because "since 2016" is the one figure that separates a shelf
     * somebody filled last week from nine years of playing. Null when nothing
     * carries a date — most shelves.
     */
    playing_since: number | null;
    /** Used behind the identity when no cover image is set. */
    backdrop_fallback: string | null;
    /** Drives the owner's primary CTA; visitors get a friend action instead. */
    continue_playing: { slug: string; name: string } | null;
    /**
     * The wallet, for the section bar's readout. Null for anyone but the
     * owner — the API strips it from a visitor's payload, and a balance is
     * nobody else's business.
     */
    bounty: number | null;
    /** What they said they are playing right now. Null when nothing is set. */
    playing_label: string | null;
    /** The game page, when the picker matched one in the catalogue. */
    playing_slug: string | null;
}

/** Drops empty tags and fixes the order, so the chips never shuffle. */
const PLATFORM_ORDER = ["steam", "epic", "psn", "xbox", "discord", "pc", "switch"];

function toPlatforms(gamertags: Record<string, string> | undefined | null) {
    const tags = gamertags ?? {};

    return PLATFORM_ORDER.filter((key) => !!tags[key]).map((key) => ({ key, handle: tags[key] }));
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
        rank_icon: user.rank_icon ? getStorageUrl(user.rank_icon) : null,
        next_rank: user.next_rank,
        // You are looking at your own page, so you are online by definition.
        is_online: true,
        playing_label: data.presence?.game_name ?? null,
        playing_slug: data.presence?.game_slug ?? null,
        verified: !!user.is_staff,
        platforms: toPlatforms(user.gamertags),
        frame_value: user.frame ?? null,
        rank_min_xp: user.rank_min_xp ?? 0,
        streak_days: data.streak?.streak ?? 0,
        joined: user.member_since ?? null,
        achievements_total: stats.achievements_total ?? null,
        stats: {
            games: stats.games_count,
            completed: stats.completed_count,
            reviews: stats.reviews_count,
            achievements: stats.achievements_count,
            hours: stats.hours_played,
        },
        // Your own deck ends on the loot crate, not on a year — the dashboard
        // payload has no reason to carry one.
        playing_since: null,
        bounty: data.stats.bounty_balance ?? null,
        backdrop_fallback: firstPlaying?.cover_url ?? data.favorites[0]?.cover_url ?? null,
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
        rank_icon: user.rank?.icon ? getStorageUrl(user.rank.icon) : null,
        next_rank: profile.next_rank
            ? { name: profile.next_rank.name, min_xp: profile.next_rank.min_xp, color: profile.next_rank.color ?? null }
            : null,
        is_online: profile.is_online ?? false,
        playing_label: profile.presence?.game_name ?? null,
        playing_slug: profile.presence?.game_slug ?? null,
        verified: !!profile.is_staff,
        platforms: toPlatforms(user.gamertags),
        frame_value: profile.customization?.equipped?.frame?.value ?? null,
        rank_min_xp: user.rank?.min_xp ?? 0,
        streak_days: profile.streak?.days ?? 0,
        joined: stats.joined_at ?? null,
        // The catalogue size, from the payload. This used to count the
        // `achievements` array — which is the five most recent unlocks, not the
        // catalogue — so every visitor read "16 / 5".
        achievements_total: profile.stats?.achievements_total ?? null,
        stats: {
            games: stats.games_count ?? 0,
            completed: stats.completed_count ?? 0,
            reviews: stats.reviews_count ?? 0,
            achievements: stats.achievements_count,
            hours: stats.hours_played ?? 0,
        },
        playing_since: profile.player_card?.span?.from ?? null,
        bounty: stats.bounty_balance ?? null,
        backdrop_fallback: firstPlaying?.cover_url ?? profile.showcase?.[0]?.cover_url ?? null,
        continue_playing: firstPlaying ? { slug: firstPlaying.slug, name: firstPlaying.name } : null,
    };
}
