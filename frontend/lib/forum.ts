import {
    MegaphoneMark, SupportMark, LoungeMark, PadMark, VerdictMark, TowerMark, ConsoleMark, BoardMark,
} from "@/components/forum/BoardMarks";
import { getImageUrl } from "@/lib/imageUrl";

export function fmtStat(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toString();
}

/**
 * A tint per category, so a board is recognisable at a glance — drawn from
 * the same five-plus-accent set the rest of the site uses, not a rainbow.
 */
const categoryColors: Record<string, string> = {
    "news-announcements": "#DC143C",
    "feedback-support": "#60a5fa",
    "general-gaming": "#a855f7",
    "game-reviews": "#f0b429",
    "user-reviews": "#f0b429",
    esports: "#34d399",
    "pc-builds": "#60a5fa",
    "pc-builds-upgrades": "#60a5fa",
    consoles: "#a855f7",
    "consoles-peripherals": "#a855f7",
    "the-lounge": "#34d399",
    marketplace: "#f0b429",
    "game-guides": "#60a5fa",
    "hardware-tech": "#34d399",
    "tech-gear-talk": "#f0b429",
};

export function getCategoryColor(slug: string): string {
    return categoryColors[slug] ?? "#9ca3af";
}

type BoardMarkComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>;

/**
 * One mark per board, in the house hand.
 *
 * This was two maps: painted emoji for the seven boards we run and lucide
 * glyphs as a fallback for everything else — so a board added in the admin
 * panel rendered in a different drawing language from its neighbours, and two
 * of the painted ones were the same purple controller. One map now, one hand,
 * and the fallback is a board rather than a generic bubble.
 */
const categoryMarks: Record<string, BoardMarkComponent> = {
    // Parents
    community: SupportMark,
    gaming: PadMark,
    hardware: TowerMark,
    // Boards
    "news-announcements": MegaphoneMark,
    "feedback-support": SupportMark,
    "the-lounge": LoungeMark,
    "general-gaming": PadMark,
    "game-reviews": VerdictMark,
    "user-reviews": VerdictMark,
    esports: VerdictMark,
    "game-guides": VerdictMark,
    "pc-builds": TowerMark,
    "pc-builds-upgrades": TowerMark,
    "hardware-tech": TowerMark,
    consoles: ConsoleMark,
    "consoles-peripherals": ConsoleMark,
    "tech-gear-talk": ConsoleMark,
    marketplace: BoardMark,
};

export function getCategoryIcon(slug: string): BoardMarkComponent {
    return categoryMarks[slug] ?? BoardMark;
}

export function getAvatarSrc(avatarUrl?: string): string | null {
    if (!avatarUrl) return null;
    const url = avatarUrl.startsWith("http")
        ? avatarUrl
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${avatarUrl}`;
    return getImageUrl(url, "thumb");
}
