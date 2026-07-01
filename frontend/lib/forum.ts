import {
    MessageCircle, Megaphone, Gamepad2, Star, Coffee, Monitor,
    HelpCircle, Trophy, ShoppingBag, Users2,
} from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";

export function fmtStat(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return n.toString();
}

const categoryColors: Record<string, string> = {
    "news-announcements": "#ef4444",
    "feedback-support": "#3b82f6",
    "general-gaming": "#8b5cf6",
    "user-reviews": "#f59e0b",
    esports: "#10b981",
    "pc-builds": "#06b6d4",
    consoles: "#6366f1",
    "the-lounge": "#ec4899",
    marketplace: "#14b8a6",
    "game-guides": "#f97316",
    "hardware-tech": "#84cc16",
};

export function getCategoryColor(slug: string): string {
    return categoryColors[slug] ?? "#64748b";
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
