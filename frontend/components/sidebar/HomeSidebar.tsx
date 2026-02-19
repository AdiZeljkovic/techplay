import NewsTabsWidget from "./NewsTabsWidget";
import WowAnalyzerWidget from "./WowAnalyzerWidget";
import DiscordWidget from "./DiscordWidget";
import ForumWidget from "./ForumWidget";
import AdUnit from "@/components/ads/AdUnit";

export default function HomeSidebar() {
    return (
        <aside className="lg:col-span-4 space-y-8">
            <NewsTabsWidget />
            <AdUnit position="sidebar_top" />
            <WowAnalyzerWidget />
            <DiscordWidget />
            <AdUnit position="home_sidebar" />
            <ForumWidget />
            <AdUnit position="sidebar_bottom" />
        </aside>
    );
}
