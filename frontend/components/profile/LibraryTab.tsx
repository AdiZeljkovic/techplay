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
            {/* One switch, not three loose buttons.
                These pick a lens on the same set of games — a thing with one
                setting at a time — and three separated pills say "three
                filters, choose any" instead. Housed together in a single track
                the control reads as what it is, and it stops competing with
                the status chips further down the page, which really are loose
                pills because they really are a filter. */}
            <nav
                className="inline-flex items-center p-1 rounded-[10px] border"
                style={{ background: "var(--surface-2)", borderColor: "var(--line-strong)" }}
                aria-label="Library views"
            >
                {VIEWS.map(({ id, label, icon: Icon, hint }) => {
                    const on = view === id;

                    return (
                        <button
                            key={id}
                            onClick={() => setView(id)}
                            aria-pressed={on}
                            title={hint}
                            className={`inline-flex items-center gap-2 h-8 px-3.5 rounded-[7px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                                on
                                    ? "bg-[var(--accent)] text-white shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                    : "text-white/40 hover:text-white hover:bg-white/[0.05]"
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
