import { UserRound, Library, Flame, Trophy, ListOrdered, Dna, ShoppingBag, type LucideIcon } from "lucide-react";

/**
 * The profile's section set — one source of truth for the tab strip, the
 * page's tab router and any deep link that wants to name a section.
 */
export type ProfileTab = "overview" | "library" | "lists" | "progression" | "achievements" | "rewards" | "stats";

/**
 * Sections that used to exist on their own, and where they went.
 *
 * Links out in the wild — shared profiles, bookmarks, our own older markup —
 * still carry these, and landing on a 404 tab because we reorganised is our
 * mistake to absorb, not the reader's.
 */
export const LEGACY_TABS: Record<string, ProfileTab> = {
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
    // The season and its quests: the run you are on. Achievements are what
    // the run leaves behind, which is a different question and a different
    // visit — one is a to-do list with a deadline, the other a cabinet.
    //
    // Owner-only, because to a visitor it was empty: the quest board is the
    // owner's, and what remained — the season banner — comes from
    // /seasons/active, one global row. Every profile on the site drew the
    // identical panel, so the tab told you nothing about the person whose
    // name was above it. It comes back for visitors when a season carries a
    // per-player standing worth reading.
    { id: "progression", label: "Progression", icon: Flame, ownOnly: true },
    { id: "achievements", label: "Achievements", icon: Trophy },
    // Its own destination rather than the third lens inside Progression: it is
    // the only part of the loop you *do* something in, and it was the one part
    // a visitor could never see, so it kept a switch position that was empty
    // for half the people looking at it.
    { id: "rewards", label: "Rewards", icon: ShoppingBag, ownOnly: true },
    { id: "stats", label: "Gamer DNA", icon: Dna },
];
