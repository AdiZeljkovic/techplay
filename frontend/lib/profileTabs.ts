import { User, Gamepad2, Award, List, Dna, BookOpen, type LucideIcon } from "lucide-react";

/**
 * The profile's section set — one source of truth for the tab strip, the
 * page's tab router and any deep link that wants to name a section.
 */
export type ProfileTab = "overview" | "collection" | "journal" | "lists" | "progression" | "stats";

/**
 * Sections that used to exist on their own, and where they went.
 *
 * Links out in the wild — shared profiles, bookmarks, our own older markup —
 * still carry these, and landing on a 404 tab because we reorganised is our
 * mistake to absorb, not the reader's.
 */
export const LEGACY_TABS: Record<string, ProfileTab> = {
    achievements: "progression",
    rewards: "progression",
    // The activity tab folded into the overview a while back.
    activity: "overview",
    forum: "overview",
};

export const PROFILE_TABS: {
    id: ProfileTab;
    label: string;
    icon: LucideIcon;
    /** Owner-only sections. Nothing uses this since Rewards folded into
     *  Progression, which shows its public half to everyone. */
    ownOnly?: boolean;
}[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "collection", label: "Collection", icon: Gamepad2 },
    { id: "journal", label: "Journal", icon: BookOpen },
    { id: "lists", label: "Lists", icon: List },
    { id: "progression", label: "Progression", icon: Award },
    { id: "stats", label: "Gamer DNA", icon: Dna },
];
