import Gw2Shell from "@/components/gw2/Gw2Shell";

/**
 * Every /gw2 page — the account half and the public reference half — inside
 * the tool's own frame. The frame is client-side (it knows which entry is
 * current and whether a key is connected); the pages under it stay whatever
 * they were, server-rendered and cached where they were before.
 *
 * `tp-page` stays on each page rather than moving here. It carries the
 * enter animation and the dim during navigation, and both belong to the page
 * that changes, not to the menu that stays put.
 */
export default function Gw2Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            <Gw2Shell>{children}</Gw2Shell>
        </div>
    );
}
