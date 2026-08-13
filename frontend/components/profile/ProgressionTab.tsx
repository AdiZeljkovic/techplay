"use client";

import SeasonPanel from "./dashboard/SeasonPanel";
import QuestBoard from "./dashboard/QuestBoard";

/**
 * Progression — the run you are on.
 *
 * Five full sections used to be stacked here: season, quest board, our
 * achievements with their own filters and sidebar, Steam's, and the whole
 * rewards store. That is not one page, it is five pages that happen to share
 * a scrollbar — and every one of them fetched on mount, so opening this tab
 * fired eight requests before you had looked at anything.
 *
 * What is left is the season and the work it asks for, which is one thought.
 * The cabinet of what the run left behind is its own tab, and so is the store
 * that the run pays into: three different questions, asked on three different
 * visits, and the only thing they gained by sharing a page was length.
 */
export default function ProgressionTab({ isOwnProfile }: { username: string; isOwnProfile: boolean }) {
    return (
        <div className="space-y-5">
            <SeasonPanel />

            {/* Owner only — a quest board is a to-do list, and somebody else's
                to-do list is not a thing to read. */}
            {isOwnProfile && <QuestBoard />}
        </div>
    );
}
