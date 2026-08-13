"use client";

import { useState } from "react";
import { LayoutGrid, BookOpen, History } from "lucide-react";
import Segmented from "@/components/ui/Segmented";
import CollectionGrid from "./CollectionGrid";
import JournalTab, { type JournalView } from "./JournalTab";

type LibraryView = "shelf" | JournalView;

const VIEWS: { id: LibraryView; label: string; icon: typeof LayoutGrid; hint: string }[] = [
    { id: "shelf", label: "Shelf", icon: LayoutGrid, hint: "Everything you own, by status" },
    { id: "diary", label: "Diary", icon: BookOpen, hint: "What you played, and when" },
    { id: "timeline", label: "Timeline", icon: History, hint: "What you finished, and what you said" },
];

interface Props {
    username: string;
    isOwnProfile: boolean;
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
export default function LibraryTab({ username, isOwnProfile }: Props) {
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
                items={VIEWS.map(({ id, label, icon, hint }) => ({ id, label, icon, title: hint }))}
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
