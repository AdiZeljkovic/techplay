/**
 * What the phone's top bar says on a given route.
 *
 * On a tab root the bar carries the logo, the way an app's home screen does.
 * Anywhere else it carries a back arrow and the name of where you are — which
 * is the single clearest signal that you have gone *into* something and can
 * come back out. A logo on a detail screen tells the reader nothing they
 * didn't already know.
 *
 * The label is the section, not the item. The header has no idea what article
 * it is above, and inventing one from `document.title` gives a bar that says
 * something different the moment a page sets its own title late. "News" above
 * a news story is true on every route that matches it.
 */

export interface MobileBar {
    mode: "brand" | "back";
    title: string;
    /** Where back goes when there is no history to go back to. */
    fallback: string;
}

/** Routes that own a tab. These keep the logo. */
const TAB_ROOTS = ["/", "/latest", "/games", "/forum"];

/**
 * Longest prefix wins, so `/forum/thread` beats `/forum` and the order of this
 * table does not matter.
 */
const LABELS: Array<[string, string, string]> = [
    // path prefix          label            back falls to
    ["/news", "News", "/news"],
    ["/reviews", "Reviews", "/reviews"],
    ["/hardware", "Tech", "/hardware"],
    ["/guides", "Guides", "/guides"],
    ["/games", "Games", "/games"],
    ["/calendar", "Calendar", "/calendar"],
    ["/forum/thread", "Thread", "/forum"],
    ["/forum/create", "New thread", "/forum"],
    ["/forum/rules", "Rules", "/forum"],
    ["/forum/search", "Search", "/forum"],
    ["/forum", "Board", "/forum"],
    ["/leaderboard", "Leaderboard", "/leaderboard"],
    ["/giveaways", "Giveaways", "/giveaways"],
    ["/giveaway", "Giveaway", "/giveaways"],
    ["/shop", "Shop", "/shop"],
    ["/cart", "Cart", "/shop"],
    ["/support", "Support", "/support"],
    ["/profile", "Profile", "/"],
    ["/settings", "Settings", "/"],
    ["/friends", "Friends", "/"],
    ["/messages", "Messages", "/"],
    ["/social", "Social", "/"],
    ["/lists", "List", "/"],
    ["/author", "Author", "/"],
    ["/wow-analyzer", "WoW Analyzer", "/"],
    ["/backlog-advisor", "Backlog Advisor", "/"],
    ["/wrapped", "Wrapped", "/"],
    ["/frontiers", "Frontiers", "/"],
    ["/last-disc", "Last Disc", "/"],
    ["/gta6", "GTA 6", "/"],
    ["/login", "Sign in", "/"],
    ["/register", "Join", "/"],
    ["/about", "About", "/"],
    ["/contact", "Contact", "/"],
    ["/privacy", "Privacy", "/"],
    ["/terms", "Terms", "/"],
    ["/cookies", "Cookies", "/"],
    ["/impressum", "Impressum", "/"],
    ["/marketing", "Advertise", "/"],
    ["/roadmap", "Roadmap", "/"],
    ["/rating-system", "Rating system", "/"],
];

export function mobileBar(pathname: string): MobileBar {
    const path = pathname || "/";

    // A tab root, or the profile you land on from the Profile tab.
    if (TAB_ROOTS.includes(path)) return { mode: "brand", title: "", fallback: "/" };

    let best: [string, string, string] | null = null;
    for (const row of LABELS) {
        if (path === row[0] || path.startsWith(row[0] + "/")) {
            if (!best || row[0].length > best[0].length) best = row;
        }
    }

    if (!best) return { mode: "brand", title: "", fallback: "/" };
    return { mode: "back", title: best[1], fallback: best[2] };
}
