"use client";

import { useState } from "react";
import { LayoutGrid, BookOpen, History } from "lucide-react";
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
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="Library views">
                {VIEWS.map(({ id, label, icon: Icon, hint }) => {
                    const on = view === id;

                    return (
                        <button
                            key={id}
                            onClick={() => setView(id)}
                            aria-pressed={on}
                            title={hint}
                            className={`inline-flex items-center gap-2 h-9 px-4 rounded-full font-display text-[10.5px] font-bold uppercase tracking-[0.12em] border transition-colors duration-300 ${
                                on
                                    ? "bg-[var(--accent)] border-transparent text-white"
                                    : "bg-white/[0.03] border-white/[0.09] text-white/45 hover:text-white hover:border-white/25"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    );
                })}
            </nav>

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
