"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import { useAuth } from "@/context/AuthContext";
import Gw2Nav, { activeEntry, type Gw2ConnectionState } from "@/components/gw2/Gw2Nav";
import { getConnection, type Gw2Connection } from "@/lib/gw2";

/**
 * The frame every /gw2 page sits in: the tool's menu on the left, the page on
 * the right, the site's own header above both.
 *
 * The mockups draw the tool as an app with its own top bar. Keeping the site
 * header instead was a decision (28 October 2026): the reader is still on
 * TechPlay, and the header's search, account menu, consent and ads keep working
 * the way they do on every other page. What the mockup's top bar carried — the
 * connection and the account name — moved to the head of the menu.
 *
 * Below `lg` the menu is the site's bottom sheet, opened from a bar at the top
 * of the page that names where you are. That bar is the only navigation a phone
 * gets inside the tool, so it says the current page rather than just "Menu".
 */

const ShellContext = createContext<{ reportConnection: (connection: Gw2Connection | null) => void } | null>(null);

/**
 * For a page that learns about the connection before the menu does.
 *
 * The dashboard reads the connection with every load, and is where a key is
 * connected and disconnected. Without this the menu would say "No account
 * connected" beside a dashboard that had just read one, until the next
 * navigation — and the fix would be a second request for what is already here.
 */
export function useGw2Shell() {
    return useContext(ShellContext);
}

export default function Gw2Shell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { user, isLoading: authLoading } = useAuth();
    const userId = user?.id ?? null;

    const [menuOpen, setMenuOpen] = useState(false);

    /*
     * Keyed by the user it was read for. Signing in as somebody else must not
     * show the previous person's account for the length of a request, and a
     * stale answer is told apart by its key rather than by clearing state in an
     * effect.
     */
    const [read, setRead] = useState<{ user: number; value: Gw2Connection | null | "unknown" } | null>(null);

    useEffect(() => {
        if (authLoading || userId === null) return;

        let live = true;

        getConnection()
            .then((value) => {
                if (live) setRead({ user: userId, value });
            })
            .catch(() => {
                if (live) setRead({ user: userId, value: "unknown" });
            });

        return () => {
            live = false;
        };
    }, [authLoading, userId]);

    const reportConnection = useCallback(
        (value: Gw2Connection | null) => {
            if (userId !== null) setRead({ user: userId, value });
        },
        [userId]
    );

    const context = useMemo(() => ({ reportConnection }), [reportConnection]);

    // Sheet watches this in an effect, so it has to stay the same function.
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const connection: Gw2ConnectionState = authLoading
        ? { kind: "loading" }
        : userId === null
          ? { kind: "signed-out" }
          : !read || read.user !== userId
            ? { kind: "loading" }
            : read.value === "unknown"
              ? { kind: "unknown" }
              : read.value === null
                ? { kind: "none" }
                : { kind: "connected", connection: read.value };

    const entry = activeEntry(pathname);
    const EntryIcon = entry?.icon;

    return (
        <ShellContext.Provider value={context}>
            <div className="container-page lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8 xl:gap-10">
                <aside aria-label="Guild Wars 2" className="hidden border-r border-[var(--line)] lg:block">
                    <div className="sticky top-[72px] max-h-[calc(100dvh-72px)] overflow-y-auto overscroll-contain py-6 pr-5 scrollbar-hide">
                        <Gw2Nav connection={connection} active={entry?.href ?? null} />
                    </div>
                </aside>

                <div className="min-w-0 pb-12">
                    <div className="under-bar -mx-4 bg-[var(--surface-0)] px-4 py-2 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            aria-haspopup="dialog"
                            aria-expanded={menuOpen}
                            className="flex h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-card)] border px-3 transition-colors hover:bg-[var(--fill-1)]"
                            style={{ borderColor: "var(--line-strong)", background: "var(--surface-1)" }}
                        >
                            <span className="flex min-w-0 items-center gap-2.5 text-[14px] text-[var(--ink-hi)]">
                                {EntryIcon && (
                                    <EntryIcon size={16} strokeWidth={1.6} aria-hidden className="text-[var(--accent-ink)]" />
                                )}
                                <span className="truncate">{entry?.label ?? "Guild Wars 2"}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[var(--ink-low)]">
                                Guild Wars 2
                                <Menu size={16} aria-hidden />
                            </span>
                        </button>
                    </div>

                    {children}
                </div>
            </div>

            <Sheet open={menuOpen} onClose={closeMenu} title="Guild Wars 2">
                <Gw2Nav connection={connection} active={entry?.href ?? null} onNavigate={closeMenu} />
            </Sheet>
        </ShellContext.Provider>
    );
}
