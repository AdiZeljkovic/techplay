"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import ConnectKey from "@/components/gw2/ConnectKey";
import DashboardView from "@/components/gw2/DashboardView";
import { getDashboard, type Gw2Dashboard, type Gw2Intent } from "@/lib/gw2";

/**
 * Four states, and the third is the one that is easy to get wrong.
 *
 *   signed out      there is nothing to personalise
 *   no connection   draw the key form
 *   reading         connected, but the queued sync has not finished
 *   ready           the dashboard
 *
 * "Reading" exists because nothing on this page calls ArenaNet while somebody
 * waits — the game's rate limit is counted per IP and every request the site
 * makes leaves from one server, so a page that fetched on render would spend the
 * whole site's budget on whoever happened to open it. The read is a queued job,
 * it takes about half a minute, and for that half minute the honest thing to draw
 * is a sentence saying so rather than an empty dashboard that looks broken.
 */
export default function Gw2Client() {
    const { user, isLoading: authLoading } = useAuth();

    const [dashboard, setDashboard] = useState<Gw2Dashboard | null>(null);
    const [intent, setIntent] = useState<Gw2Intent>({ minutes: null, avoid: [] });
    const [state, setState] = useState<"loading" | "disconnected" | "reading" | "ready" | "error">("loading");
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        async (next: Gw2Intent, quiet = false) => {
            if (!quiet) setBusy(true);

            try {
                const payload = await getDashboard(next);

                if (payload) {
                    setDashboard(payload);
                    setState("ready");
                } else {
                    // Connected, no snapshot yet.
                    setState("reading");
                }
            } catch (e: unknown) {
                const status = (e as { response?: { status?: number } }).response?.status;

                // 404 is the documented answer for "no account is connected",
                // which is a state and not a failure.
                setState(status === 404 ? "disconnected" : "error");
            } finally {
                setBusy(false);
            }
        },
        []
    );

    /*
     * Signed out is a branch below, not a state set from here — it is already
     * derivable from `user`, and setting it in an effect body costs a second
     * render and reads as if the two could disagree.
     */
    useEffect(() => {
        if (authLoading || !user) return;

        void load(intent, true);
        // `intent` is deliberately a dependency: changing the time budget or the
        // avoid list is a new question, and the backend answers it without
        // caching. The quiet flag only suppresses the spinner on first paint.
    }, [authLoading, user, intent, load]);

    /*
     * While the first sync runs, poll — but slowly and not forever. A full read
     * is eighteen requests through a queue; if it has not landed inside a minute
     * something is wrong and a spinner that never stops is worse than a button.
     */
    useEffect(() => {
        if (state !== "reading") return;

        let tries = 0;
        const timer = setInterval(() => {
            tries += 1;

            if (tries > 6) {
                clearInterval(timer);

                return;
            }

            void load(intent, true);
        }, 10000);

        return () => clearInterval(timer);
    }, [state, intent, load]);

    if (!authLoading && !user) {
        return (
            <Panel material="lit" crown title="Sign in to connect your account">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        The advisor reads your own Guild Wars 2 account, so it needs a TechPlay profile to
                        attach the key to.
                    </p>
                    <div className="flex gap-3">
                        <Button asChild>
                            <Link href="/login?redirect=/gw2">Sign in</Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/register">Create an account</Link>
                        </Button>
                    </div>
                </div>
            </Panel>
        );
    }

    if (authLoading || state === "loading") {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (state === "error") {
        return (
            <Panel material="matte">
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not load your advisor. Your data is not lost — this is a problem reaching
                        our own server.
                    </p>
                    <Button variant="secondary" onClick={() => void load(intent)} isLoading={busy}>
                        Try again
                    </Button>
                </div>
            </Panel>
        );
    }

    if (state === "disconnected") {
        return <ConnectKey onConnected={() => setState("reading")} />;
    }

    if (state === "reading" || !dashboard) {
        return (
            <Panel material="instrument" title="Reading your account">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We are pulling your characters, masteries, achievements and inventory from ArenaNet.
                        It takes about half a minute, and it only has to happen once — after this we read
                        your account overnight.
                    </p>
                    <Skeleton className="h-20 w-full" />
                    <Button variant="ghost" size="sm" onClick={() => void load(intent)} isLoading={busy}>
                        Check now
                    </Button>
                </div>
            </Panel>
        );
    }

    return (
        <DashboardView
            dashboard={dashboard}
            intent={intent}
            onIntentChange={setIntent}
            onRefresh={() => void load(intent)}
            busy={busy}
        />
    );
}
