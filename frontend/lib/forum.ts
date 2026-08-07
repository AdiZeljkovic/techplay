import {
    MessageCircle, Megaphone, Gamepad2, Star, Coffee, Monitor,
    HelpCircle, Trophy, ShoppingBag, Users2,
} from "lucide-react";
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

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    // Parent categories
    community: Users2,
    gaming: Gamepad2,
    hardware: Monitor,
    // Child categories
    "news-announcements": Megaphone,
    "feedback-support": HelpCircle,
    "general-gaming": Gamepad2,
    "game-reviews": Star,
    "user-reviews": Star,
    esports: Trophy,
    "pc-builds": Monitor,
    "pc-builds-upgrades": Monitor,
    consoles: Gamepad2,
    "consoles-peripherals": Gamepad2,
    "the-lounge": Coffee,
    marketplace: ShoppingBag,
    "game-guides": Star,
    "hardware-tech": Monitor,
    "tech-gear-talk": ShoppingBag,
};

export function getCategoryIcon(slug: string): React.ComponentType<{ className?: string }> {
    return categoryIcons[slug] ?? MessageCircle;
}

export function getAvatarSrc(avatarUrl?: string): string | null {
    if (!avatarUrl) return null;
    const url = avatarUrl.startsWith("http")
        ? avatarUrl
        : `${process.env.NEXT_PUBLIC_STORAGE_URL}/${avatarUrl}`;
    return getImageUrl(url, "thumb");
}
