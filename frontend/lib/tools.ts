import { ShieldHalf, Compass, ListOrdered, MapPinned, Disc3, type LucideIcon } from "lucide-react";

/**
 * The tools, in one place.
 *
 * This list lived inside the header's dropdown and nowhere else, which is why
 * "All Tools" in that dropdown pointed at /wow-analyzer — one of the five, not
 * the set. The hub at /tools and the dropdown now read the same array, so a
 * tool cannot appear in the menu and be missing from the page that lists them.
 *
 * `blurb` is longer than the menu's one-liner: the dropdown has a row's width
 * to work with and the hub has a card.
 */
export interface Tool {
    name: string;
    href: string;
    icon: LucideIcon;
    /** One line, for the header dropdown. */
    description: string;
    /** A sentence or two, for the hub card. */
    blurb: string;
}

export const TOOLS: Tool[] = [
    {
        name: "WoW Analyzer",
        href: "/wow-analyzer",
        icon: ShieldHalf,
        description: "Character readiness check",
        blurb: "Reads a World of Warcraft character and scores how ready it is for Midnight — gear, Mythic+ rating and raid progress, with the gaps named rather than implied.",
    },
    {
        name: "Backlog Advisor",
        href: "/backlog-advisor",
        icon: Compass,
        description: "What should you play next?",
        blurb: "Answers what to play tonight from your own library: the genres you finish, the lengths you finish, and the games sitting unplayed that fit both.",
    },
    {
        name: "Game Lists",
        href: "/lists",
        icon: ListOrdered,
        description: "Rankings and tier lists by the community",
        blurb: "Top 10s, Top 100s and tier lists made by people here, ordered by their authors rather than by an average.",
    },
    {
        name: "GTA 6 Hub",
        href: "/gta6",
        icon: MapPinned,
        description: "Map, characters, vehicles, weapons",
        blurb: "An interactive Leonida map with over a thousand marked locations, plus every confirmed character, vehicle and weapon — updated as Rockstar confirms things, not as rumours appear.",
    },
    {
        name: "The Last Disc",
        href: "/last-disc",
        icon: Disc3,
        description: "Open letter: keep physical games",
        blurb: "An open letter to Sony from players who want PlayStation games to keep shipping on a disc you own. Read it, and add your name if you agree.",
    },
];
