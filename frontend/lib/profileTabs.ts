import { UserRound, Library, Award, ListOrdered, Dna, ShoppingBag, type LucideIcon } from "lucide-react";

/**
 * The profile's section set — one source of truth for the tab strip, the
 * page's tab router and any deep link that wants to name a section.
 */
export type ProfileTab = "overview" | "library" | "lists" | "progression" | "rewards" | "stats";

/**
 * Sections that used to exist on their own, and where they went.
 *
 * Links out in the wild — shared profiles, bookmarks, our own older markup —
 * still carry these, and landing on a 404 tab because we reorganised is our
 * mistake to absorb, not the reader's.
 */
export const LEGACY_TABS: Record<string, ProfileTab> = {
    achievements: "progression",
    collection: "library",
    journal: "library",
    // The activity tab folded into the overview a while back.
    activity: "overview",
    forum: "overview",
};

export const PROFILE_TABS: {
    id: ProfileTab;
    label: string;
    icon: LucideIcon;
    /** Owner-only sections — a wallet and what it buys is nobody else's. */
    ownOnly?: boolean;
}[] = [
    { id: "overview", label: "Overview", icon: UserRound },
    { id: "library", label: "Library", icon: Library },
    // Ordered, not a checklist: every list type on the site is a ranking —
    // Top 10, Top 25, Top 100 — and ticks would promise a to-do.
    { id: "lists", label: "Lists", icon: ListOrdered },
    { id: "progression", label: "Progression", icon: Award },
    // Its own destination rather than the third lens inside Progression: it is
    // the only part of the loop you *do* something in, and it was the one part
    // a visitor could never see, so it kept a switch position that was empty
    // for half the people looking at it.
    { id: "rewards", label: "Rewards", icon: ShoppingBag, ownOnly: true },
    { id: "stats", label: "Gamer DNA", icon: Dna },
];
