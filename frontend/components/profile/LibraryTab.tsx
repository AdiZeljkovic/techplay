"use client";

import { useState } from "react";
import { LayoutGrid, BookOpen } from "lucide-react";
import Segmented from "@/components/ui/Segmented";
import CollectionGrid from "./CollectionGrid";
import JournalTab, { type JournalView } from "./JournalTab";

/**
 * Two, since Timeline moved up to the profile's own tab strip.
 *
 * Shelf and Diary are two readings of the same set of games — what is on it,
 * and what happened this week. Timeline was never that: it is the record of
 * what somebody finished and what they thought of it, which is what a visitor
 * comes to a profile to read, and it sat two clicks down behind a switch.
 */
type LibraryView = "shelf" | Extract<JournalView, "diary">;

/**
 * Two voices, because the page has two readers.
 *
 * "Everything you own" is the right sentence on your own library and the
 * wrong one on somebody else's, where it addressed the visitor about a shelf
 * that was not theirs. The owner keeps the second person; a visitor is told
 * whose shelf they are reading.
 */
const VIEWS = (who: string | null): { id: LibraryView; label: string; icon: typeof LayoutGrid; hint: string }[] => [
    { id: "shelf", label: "Shelf", icon: LayoutGrid, hint: who ? `Everything ${who} owns, by status` : "Everything you own, by status" },
    { id: "diary", label: "Diary", icon: BookOpen, hint: who ? `What ${who} played, and when` : "What you played, and when" },
];

interface Props {
    username: string;
    isOwnProfile: boolean;
    /** Whose shelf this is, for a visitor's copy. Falls back to the username. */
    displayName?: string | null;
}

/**
 * Library — one set of games, three lenses.
 *
 * Collection and Journal were separate tabs describing the same objects. A
 * session is always about a game on the shelf; the completed timeline and the
 * reviews were collection data wearing a journal heading. Kept apart, the
 * journal read as an empty tab to almost everybody — and an empty tab looks
 * like a broken product, while an empty diary inside a full shelf looks like an
 * invitation.
 *
 * The lens is local state rather than a URL parameter on purpose: ?tab=
 * already names the section, and a reader sharing their library means the
 * library, not the particular way they were looking at it.
 */
export default function LibraryTab({ username, isOwnProfile, displayName = null }: Props) {
    const [view, setView] = useState<LibraryView>("shelf");

    // A game handed from the shelf to the diary. Held here because it crosses
    // the two views, and cleared by the composer when it closes.
    const [logging, setLogging] = useState<{ slug: string; name: string; cover_url: string | null } | null>(null);

    const openDiaryWith = (game: { slug: string; name: string; cover_url: string | null }) => {
        setLogging(game);
        setView("diary");
    };

    return (
        <div className="space-y-5">
            {/* One switch, not three loose buttons — and the same switch the
                status filters below are drawn with, so the two bars on this
                page read as one instrument rather than two conventions. */}
            <Segmented
                ariaLabel="Library views"
                value={view}
                onChange={(id) => setView(id as LibraryView)}
                items={VIEWS(isOwnProfile ? null : displayName || username).map(({ id, label, icon, hint }) => ({ id, label, icon, title: hint }))}
            />

            {view === "shelf" ? (
                <CollectionGrid
                    username={username}
                    isOwnProfile={isOwnProfile}
                    onLogSession={openDiaryWith}
                />
            ) : (
                <JournalTab
                    username={username}
                    view={view}
                    prefill={logging}
                    onPrefillConsumed={() => setLogging(null)}
                />
            )}
        </div>
    );
}
