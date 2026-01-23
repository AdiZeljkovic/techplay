import NewsTabsWidget from "./NewsTabsWidget";
import DiscordWidget from "./DiscordWidget";
import ForumWidget from "./ForumWidget";
import AdUnit from "@/components/ads/AdUnit";

export default function HomeSidebar() {
    return (
        <aside className="lg:col-span-4 space-y-8">
            <AdUnit position="home_sidebar" />
            <NewsTabsWidget />
            <AdUnit position="sidebar_top" />
            <DiscordWidget />
            <ForumWidget />
            <AdUnit position="sidebar_bottom" />
        </aside>
    );
}
