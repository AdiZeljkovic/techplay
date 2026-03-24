import NewsTabsWidget from "./NewsTabsWidget";
import WowAnalyzerWidget from "./WowAnalyzerWidget";
import DiscordWidget from "./DiscordWidget";
import ForumWidget from "./ForumWidget";
import AdUnit from "@/components/ads/AdUnit";
import { Article } from "@/types";

interface HomeSidebarProps {
    latestGlobal?: Article[];
    popularGlobal?: Article[];
}

export default function HomeSidebar({ latestGlobal = [], popularGlobal = [] }: HomeSidebarProps) {
    return (
        <aside className="lg:col-span-4 space-y-8">
            <NewsTabsWidget latestNews={latestGlobal} popularNews={popularGlobal} />
            <AdUnit position="sidebar_top" />
            <WowAnalyzerWidget />
            <DiscordWidget />
            <AdUnit position="home_sidebar" />
            <ForumWidget />
            <AdUnit position="sidebar_bottom" />
        </aside>
    );
}
