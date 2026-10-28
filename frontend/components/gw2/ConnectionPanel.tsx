"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Link2Off, RefreshCw } from "lucide-react";
import Panel from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { disconnect, getConnection, gw2Error, requestSync, type Gw2Connection } from "@/lib/gw2";

/**
 * The connection itself: what was read and when, what the key does not share,
 * and the two things the connect screen promises — reading again, and taking
 * the key away.
 *
 * It was the last panel down the dashboard's right-hand column until the
 * redesign of 28 October 2026, which gave that column to two panels. The
 * menu beside every page now says whether the account is connected and when it
 * was read; this is where something is done about it.
 */
export default function ConnectionPanel({
    connection,
    onChanged,
    onRead,
}: {
    connection: Gw2Connection;
    /** The connection after an action — null once it is disconnected. */
    onChanged: (next: Gw2Connection | null) => void;
    /** A queued read has had time to land; whatever the page shows may have moved. */
    onRead?: () => void;
}) {
    const [syncing, setSyncing] = useState<"quick" | "full" | null>(null);
    const missing = Object.entries(connection.missing_features ?? {});

    async function sync(full: boolean) {
        setSyncing(full ? "full" : "quick");

        try {
            const { connection: after, message } = await requestSync(full);

            onChanged(after);

            /*
             * A full read inside the hour is answered with the time of the last
             * one rather than queued, and only a queued read leaves the
             * connection pending. Saying so is the whole response.
             */
            if (after.sync_status !== "pending") {
                toast(message ?? "Your account was read recently.");

                return;
            }

            /*
             * The read is queued, not immediate — the game's rate limit belongs
             * to the whole site, so nothing here waits on ArenaNet. Give the
             * worker a moment, then look again. If it is not done, the next
             * visit catches it.
             */
            await new Promise((resolve) => setTimeout(resolve, full ? 8000 : 4000));
            onChanged(await getConnection());
            onRead?.();
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not ask for a read just now."));
        } finally {
            setSyncing(null);
        }
    }

    async function disconnectAccount() {
        if (
            !confirm(
                "Disconnect your Guild Wars 2 account?\n\nThe key is deleted, and so is everything read with it — " +
                    "including the history since you connected, which the game does not keep and cannot give back."
            )
        ) {
            return;
        }

        try {
            await disconnect();
            toast.success("Disconnected. The key and everything read with it are gone.");
            onChanged(null);
        } catch (e: unknown) {
            toast.error(gw2Error(e, "We could not disconnect just now."));
        }
    }

    return (
        <Panel
            material="matte"
            title="Your connection"
            meta={<span className="truncate text-xs text-[var(--ink-faint)]">{connection.account_name}</span>}
        >
            <div className="space-y-3 text-xs">
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[var(--ink-low)]">
                    <dt>Last read</dt>
                    <dd className="text-right text-[var(--ink-mid)]">
                        {connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : "never"}
                    </dd>
                    <dt>Last full read</dt>
                    <dd className="text-right text-[var(--ink-mid)]">
                        {connection.last_full_sync_at ? new Date(connection.last_full_sync_at).toLocaleString() : "never"}
                    </dd>
                    {connection.key_name && (
                        <>
                            <dt>Key</dt>
                            <dd className="truncate text-right text-[var(--ink-mid)]">{connection.key_name}</dd>
                        </>
                    )}
                    <dt>We hold</dt>
                    <dd className="text-right text-[var(--ink-mid)]">
                        {connection.token_kind === "subtoken"
                            ? `a limited token, until ${
                                  connection.token_expires_at
                                      ? new Date(connection.token_expires_at).toLocaleDateString()
                                      : "—"
                              }`
                            : "your key"}
                    </dd>
                </dl>

                {/* Connections from before limited tokens still hold the key itself.
                    Reconnecting swaps it — said once, plainly. */}
                {connection.token_kind !== "subtoken" && (
                    <p className="text-[var(--ink-faint)]">
                        Connect your key again and we will keep a limited token that expires in a year instead of
                        the key itself.
                    </p>
                )}

                {(connection.sync_status === "pending" || connection.sync_status === "syncing") && (
                    <p className="text-[var(--ink-mid)]">A read is on its way.</p>
                )}

                {connection.sync_status === "error" && connection.sync_error && (
                    <p role="status" className="text-[var(--accent-ink)]">
                        {connection.sync_error}
                    </p>
                )}

                {missing.length > 0 && (
                    <div className="space-y-1.5 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        <p className="text-[var(--ink-mid)]">Your key does not share:</p>
                        <ul className="space-y-1 text-[var(--ink-low)]">
                            {missing.map(([permission, feature]) => (
                                <li key={permission}>
                                    <span className="font-numeric text-[var(--ink-mid)]">{permission}</span>
                                    {" — "}
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <p className="text-[var(--ink-faint)]">A new key with these ticked lights them up.</p>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void sync(false)}
                        isLoading={syncing === "quick"}
                        disabled={syncing !== null}
                        icon={<RefreshCw size={13} />}
                        title="Re-reads what changes within a day: the vault, raids, bosses and dungeons."
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void sync(true)}
                        isLoading={syncing === "full"}
                        disabled={syncing !== null}
                        title="Reads everything again — characters, gear, story and inventory. Once an hour."
                    >
                        Full read
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void disconnectAccount()}
                        icon={<Link2Off size={13} />}
                        className="ml-auto text-[var(--accent-ink)]"
                    >
                        Disconnect
                    </Button>
                </div>
            </div>
        </Panel>
    );
}
