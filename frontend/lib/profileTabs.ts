import { User, Gamepad2, Award, List, Gift, Dna, type LucideIcon } from "lucide-react";

/**
 * The profile's section set — one source of truth for the tab strip, the
 * page's tab router and any deep link that wants to name a section.
 */
export type ProfileTab = "overview" | "collection" | "lists" | "achievements" | "rewards" | "stats";

export const PROFILE_TABS: {
    id: ProfileTab;
    label: string;
    icon: LucideIcon;
    /** Your economy hub — never shown on someone else's profile. */
    ownOnly?: boolean;
}[] = [
    { id: "overview", label: "Overview", icon: User },
    { id: "collection", label: "Collection", icon: Gamepad2 },
    { id: "lists", label: "Lists", icon: List },
    { id: "achievements", label: "Achievements", icon: Award },
    { id: "stats", label: "Gamer DNA", icon: Dna },
    { id: "rewards", label: "Rewards", icon: Gift, ownOnly: true },
];
