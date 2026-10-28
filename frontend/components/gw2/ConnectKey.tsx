"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Gw2Panel } from "@/components/gw2/Gw2Ui";
import { Gw2Card } from "@/components/gw2/Gw2PageParts";
import { connectKey, type Gw2Connection } from "@/lib/gw2";

/**
 * Pasting a Guild Wars 2 API key.
 *
 * ArenaNet retired OAuth, so there is no "sign in with" button to offer — what a
 * player has is a key they generate themselves, read-only, scoped to whichever
 * permissions they tick. That makes this screen carry an unusual amount of
 * weight: somebody is about to paste a credential into a site, and the only
 * thing that makes that reasonable is being plain about what it can see, what we
 * do with it, and how to take it back.
 *
 * So the permissions list below is not filler. Two are required because the tool
 * answers nothing without them; the rest are named with the feature each one
 * buys, and leaving one out costs that feature and nothing else. A player who
 * would rather not share their inventory should be able to make that trade
 * knowingly, and still get a working advisor.
 */

/** Ticked on the key page at account.arena.net. */
const PERMISSIONS: { name: string; required?: boolean; buys: string }[] = [
    { name: "account", required: true, buys: "who you are, your world, your fractal level" },
    { name: "progression", required: true, buys: "masteries, achievements, raids, the Wizard's Vault" },
    { name: "characters", buys: "your characters, their gear and Agony Resistance" },
    { name: "builds", buys: "which specializations and traits you are running" },
    { name: "inventories", buys: "what you own across bags, bank and material storage" },
    { name: "unlocks", buys: "mounts, recipes and the Legendary Armory" },
    { name: "wallet", buys: "your currencies, for goal and material planning" },
];

export default function ConnectKey({ onConnected }: { onConnected: (connection: Gw2Connection) => void }) {
    const [key, setKey] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!key.trim() || busy) return;

        setBusy(true);
        setError(null);

        try {
            const connection = await connectKey(key);
            // The key never stays in component state a moment longer than the
            // request needs it.
            setKey("");
            onConnected(connection);
        } catch (e: unknown) {
            /*
             * The backend's message is the useful one — it distinguishes a key
             * missing `progression` from a key ArenaNet refused from a key
             * already attached to another profile, and each of those has a
             * different next step. A generic "something went wrong" would throw
             * all three away.
             */
            const response = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })
                .response?.data;

            setError(
                response?.errors?.api_key?.[0] ??
                    response?.message ??
                    "We could not reach the server. Nothing was saved — try again in a moment."
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Gw2Panel title="Connect your Guild Wars 2 account">
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="gw2-key" className="block text-sm font-medium text-[var(--ink-mid)]">
                            Your API key
                        </label>
                        <Input
                            id="gw2-key"
                            value={key}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setKey(e.target.value)}
                            placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX…"
                            autoComplete="off"
                            spellCheck={false}
                            disabled={busy}
                            aria-describedby="gw2-key-help"
                        />
                        <p id="gw2-key-help" className="text-xs text-[var(--ink-low)]">
                            Copy the whole line. Keys are long and wrap in the browser — a key cut short is
                            the most common reason this fails.
                        </p>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-[var(--radius-card)] border px-3 py-2 text-sm"
                            style={{ borderColor: "var(--line-strong)", background: "var(--fill-1)", color: "var(--danger)" }}
                        >
                            {error}
                        </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button type="submit" isLoading={busy}>
                            Connect account
                        </Button>
                        <a
                            href="https://account.arena.net/applications"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-ink)] hover:underline"
                        >
                            Make a key at account.arena.net
                            <ExternalLink size={13} aria-hidden />
                        </a>
                    </div>
                </form>
            </Gw2Panel>

            <div className="space-y-4">
                <Gw2Panel title="What to tick">
                    <ul className="space-y-3">
                        {PERMISSIONS.map((permission) => (
                            <li key={permission.name} className="text-sm">
                                <span className="font-numeric font-medium text-[var(--ink-hi)]">
                                    {permission.name}
                                </span>
                                {permission.required && (
                                    <span className="ml-2 text-[11px] text-[var(--accent-ink)]">required</span>
                                )}
                                <span className="mt-0.5 block text-[var(--ink-low)]">{permission.buys}</span>
                            </li>
                        ))}
                    </ul>
                </Gw2Panel>

                <Gw2Card className="space-y-2 p-5 text-sm text-[var(--ink-mid)]">
                    <p>
                        A Guild Wars 2 key is <strong className="text-[var(--ink-hi)]">read-only</strong>.
                        It cannot spend, trade, move or delete anything, and it is not your password.
                    </p>
                    <p>
                        We store it encrypted and never show it again — not even to you, and not
                        partly masked.
                    </p>
                    <p>
                        Disconnecting deletes the key and everything we read with it. You can also
                        delete the key at account.arena.net at any time, and it stops working
                        immediately.
                    </p>
                </Gw2Card>
            </div>
        </div>
    );
}
