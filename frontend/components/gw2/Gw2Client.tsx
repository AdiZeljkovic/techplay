"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import ConnectKey from "@/components/gw2/ConnectKey";
import { Gw2Panel } from "@/components/gw2/Gw2Ui";
import { Gw2Card } from "@/components/gw2/Gw2PageParts";
import DashboardView from "@/components/gw2/DashboardView";
import AdviceView from "@/components/gw2/AdviceView";
import { useGw2Shell } from "@/components/gw2/Gw2Shell";
import {
    disconnect,
    getDashboard,
    gw2Error,
    requestSync,
    type Gw2Connection,
    type Gw2Dashboard,
    type Gw2Intent,
} from "@/lib/gw2";

/**
 * Five states, and the last two are the ones that are easy to get wrong.
 *
 *   signed out      there is nothing to personalise
 *   no connection   draw the key form
 *   ready           the dashboard
 *   reading         connected, but the queued sync has not finished
 *   failed          connected, never read, and the read said why
 *
 * "Reading" exists because nothing on this page calls ArenaNet while somebody
 * waits — the game's rate limit is counted per IP and every request the site
 * makes leaves from one server, so a page that fetched on render would spend the
 * whole site's budget on whoever happened to open it. The read is a queued job,
 * it takes about half a minute, and for that half minute the honest thing to draw
 * is a sentence saying so rather than an empty dashboard that looks broken.
 *
 * "Failed" exists because a first read can fail, and until the connection came
 * back with the dashboard there was no way to tell that apart from one still
 * running: the page said "reading" for ever.
 *
 * Two pages draw the ready state, from the same payload: the dashboard
 * (`overview`) and "What should I do next?" (`next`), which is where the
 * question can be re-asked with a goal, a time budget and things to leave out.
 * One client for both, so the five states above are handled in one place.
 */
export default function Gw2Client({ view = "overview" }: { view?: "overview" | "next" }) {
    const { user, isLoading: authLoading } = useAuth();

    const [dashboard, setDashboard] = useState<Gw2Dashboard | null>(null);
    const [connection, setConnection] = useState<Gw2Connection | null>(null);
    const [intent, setIntent] = useState<Gw2Intent>({ minutes: null, avoid: [] });
    const [state, setState] = useState<"loading" | "disconnected" | "reading" | "failed" | "ready" | "error">(
        "loading"
    );
    const [busy, setBusy] = useState(false);
    const [retrying, setRetrying] = useState(false);

    /*
     * The first paint has its own skeleton; every load after it is a question
     * the player just asked, and changing the time budget with nothing on screen
     * moving reads as a button that did not work.
     */
    const loadedOnce = useRef(false);

    /*
     * The menu beside this page shows the connection too, and this page is where
     * it changes — connected, read, failed, disconnected. Every answer here is
     * passed along, so the two never disagree until the next navigation.
     */
    const reportConnection = useGw2Shell()?.reportConnection;

    const load = useCallback(async (next: Gw2Intent, quiet = false) => {
        if (!quiet) setBusy(true);

        try {
            const result = await getDashboard(next);

            setConnection(result.connection);
            reportConnection?.(result.connection);

            if (result.dashboard) {
                setDashboard(result.dashboard);
                setState("ready");
            } else {
                // Connected, no snapshot yet — and the connection says whether
                // that is a read in progress or one that gave up.
                setState(result.connection?.sync_status === "error" ? "failed" : "reading");
            }
        } catch (e: unknown) {
            const status = (e as { response?: { status?: number } }).response?.status;

            // 404 is the documented answer for "no account is connected",
            // which is a state and not a failure.
            setState(status === 404 ? "disconnected" : "error");

            if (status === 404) reportConnection?.(null);
        } finally {
            loadedOnce.current = true;
            setBusy(false);
        }
    }, [reportConnection]);

    /*
     * Signed out is a branch below, not a state set from here — it is already
     * derivable from `user`, and setting it in an effect body costs a second
     * render and reads as if the two could disagree.
     */
    useEffect(() => {
        if (authLoading || !user) return;

        // `intent` is deliberately a dependency: changing the time budget or the
        // avoid list is a new question, and the backend answers it without
        // caching.
        void load(intent, !loadedOnce.current);
    }, [authLoading, user, intent, load]);

    /*
     * While the first sync runs, poll — but slowly and not forever. A full read
     * is a couple of dozen requests through a queue; if it has not landed inside
     * a minute something is wrong and a spinner that never stops is worse than a
     * button.
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

    function disconnected() {
        setDashboard(null);
        setConnection(null);
        reportConnection?.(null);
        setState("disconnected");
    }

    async function retryFirstRead() {
        setRetrying(true);

        try {
            await requestSync(true);
            setState("reading");
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not ask for a read just now."));
        } finally {
            setRetrying(false);
        }
    }

    async function disconnectFromFailed() {
        if (!confirm("Disconnect this Guild Wars 2 account? The key is deleted, along with anything read with it.")) {
            return;
        }

        try {
            await disconnect();
            toast.success("Disconnected. The key is gone.");
            disconnected();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not disconnect just now."));
        }
    }

    if (!authLoading && !user) {
        return (
            <Gw2Panel title="Sign in to connect your account">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        The advisor reads your own Guild Wars 2 account, so it needs a TechPlay profile to
                        attach the key to.
                    </p>
                    <div className="flex gap-3">
                        <Button asChild>
                            <Link href={`/login?redirect=${view === "next" ? "/gw2/next" : "/gw2"}`}>Sign in</Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/register">Create an account</Link>
                        </Button>
                    </div>
                </div>
            </Gw2Panel>
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
            <Gw2Card>
                <div className="space-y-3">
                    <p className="text-sm text-[var(--ink-mid)]">
                        We could not load your advisor. Your data is not lost — this is a problem reaching
                        our own server.
                    </p>
                    <Button variant="secondary" onClick={() => void load(intent)} isLoading={busy}>
                        Try again
                    </Button>
                </div>
            </Gw2Card>
        );
    }

    if (state === "disconnected") {
        return (
            <ConnectKey
                onConnected={(connected) => {
                    reportConnection?.(connected);
                    setState("reading");
                }}
            />
        );
    }

    if (state === "failed") {
        return (
            <Gw2Panel title="We could not read your account">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--ink-mid)]">
                        {connection?.sync_error ??
                            "The first read of your account did not finish. Nothing is lost — your key is stored and can be read again."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => void retryFirstRead()} isLoading={retrying}>
                            Try reading again
                        </Button>
                        <Button variant="ghost" onClick={() => void disconnectFromFailed()}>
                            Disconnect this key
                        </Button>
                    </div>
                </div>
            </Gw2Panel>
        );
    }

    if (state === "reading" || !dashboard) {
        return (
            <Gw2Panel title="Reading your account">
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
            </Gw2Panel>
        );
    }

    if (view === "next") {
        return (
            <AdviceView
                dashboard={dashboard}
                intent={intent}
                onIntentChange={setIntent}
                onRefresh={() => void load(intent)}
                busy={busy}
            />
        );
    }

    return <DashboardView dashboard={dashboard} onRefresh={() => void load(intent)} />;
}
