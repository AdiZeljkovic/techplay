import NewsTabsWidget from "./NewsTabsWidget";
import DiscordWidget from "./DiscordWidget";
import ForumWidget from "./ForumWidget";

export default function HomeSidebar() {
    return (
        <aside className="lg:col-span-4 space-y-8">
            <NewsTabsWidget />
            <DiscordWidget />
            <ForumWidget />
        </aside>
    );
}
