"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { Loader2, Link2, Link2Off, RefreshCw, CheckCircle2, Clock, AlertCircle, Shield, X } from "lucide-react";

interface ConnectedAccount {
    id: number;
    provider: string;
    provider_user_id: string;
    display_name: string | null;
    sync_status: "idle" | "pending" | "syncing" | "done" | "error";
    last_synced_at: string | null;
    visibility: string;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

const PROVIDERS: {
    id: string;
    name: string;
    description: string;
    color: string;
    iconBg: string;
    connectMode?: "redirect" | "gamertag";
    logo: React.ReactNode;
}[] = [
    {
        id: "steam",
        name: "Steam",
        description: "Import your full library, playtime and achievements",
        color: "#1b2838",
        iconBg: "#171a21",
        connectMode: "redirect",
        logo: (
            <svg viewBox="0 0 233 233" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="116.5" cy="116.5" r="116.5" fill="#1B2838"/>
                <path d="M116.5 28C68.1 28 28 68.1 28 116.5c0 43.5 30.7 79.9 71.7 88.5l26.4-65.3a27.3 27.3 0 01-6.1.7c-15.1 0-27.3-12.2-27.3-27.3s12.2-27.3 27.3-27.3 27.3 12.2 27.3 27.3c0 .8 0 1.5-.1 2.3l-64.2 26.6c2.4 6.6 6.5 12.5 11.9 17l65.8-27.3a27.3 27.3 0 003.8-13.3c0-15.1-12.2-27.3-27.3-27.3zM87.3 144.7l-12.2 5.1c2.3 4.6 6.5 8.2 11.7 9.7 10.6 3 21.5-3.2 24.5-13.8 3-10.6-3.2-21.5-13.8-24.5-5.5-1.5-11.1-.7-15.7 2.1l12.6 5.2a9.1 9.1 0 11-7.1 16.2z" fill="white"/>
            </svg>
        ),
    },
    {
        id: "xbox",
        name: "Xbox",
        description: "Import your played titles, achievements and Gamerscore by gamertag",
        color: "#107C10",
        iconBg: "#0e2f0e",
        connectMode: "gamertag",
        logo: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#3FBB48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.022-.082-.042a.847.847 0 0 0-.281-.045c-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042A11.956 11.956 0 0 0 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245a.725.725 0 0 0-.281.045zM12 4.958S9.055 3.233 6.755 3.152c-.905-.033-1.454.295-1.52.335C7.379 1.996 9.659 0 12 0h.016c2.341 0 4.615 1.996 6.762 3.487-.065-.04-.611-.368-1.518-.335-2.3.081-5.244 1.8-5.26 1.806z"/>
            </svg>
        ),
    },
];

function syncStatusBadge(status: ConnectedAccount["sync_status"], lastSynced: string | null) {
    switch (status) {
        case "done":
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lastSynced ? `Synced ${new Date(lastSynced).toLocaleDateString()}` : "Synced"}
                </span>
            );
        case "syncing":
        case "pending":
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…
                </span>
            );
        case "error":
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Sync error
                </span>
            );
        default:
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-white/30">
                    <Clock className="w-3.5 h-3.5" /> Never synced
                </span>
            );
    }
}

export default function ConnectedAccountsSection() {
    const { data: accounts = [], mutate } = useSWR<ConnectedAccount[]>("/connected-accounts", fetcher);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [connecting, setConnecting] = useState<string | null>(null);
    const [gamertagFor, setGamertagFor] = useState<string | null>(null);
    const [gamertag, setGamertag] = useState("");

    async function handleGamertagConnect(providerId: string) {
        if (gamertag.trim().length < 2) {
            toast.error("Enter your gamertag first.");
            return;
        }
        setConnecting(providerId);
        try {
            const res = await axios.post(`/connected-accounts/${providerId}/connect`, { gamertag: gamertag.trim() });
            toast.success(res.data?.message ?? "Connected — importing your library.");
            setGamertagFor(null);
            setGamertag("");
            mutate();
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Couldn't connect. Check the gamertag.");
        } finally {
            setConnecting(null);
        }
    }

    async function handleConnect(providerId: string) {
        setConnecting(providerId);
        try {
            const res = await axios.get(`/connected-accounts/${providerId}/connect`);
            window.location.href = res.data?.data?.url;
        } catch {
            toast.error("Couldn't start connection. Try again.");
            setConnecting(null);
        }
    }

    async function handleSync(id: number) {
        setBusyId(id);
        try {
            await axios.post(`/connected-accounts/${id}/sync`);
            toast.success("Sync queued — library will update shortly.");
            mutate();
        } catch {
            toast.error("Couldn't queue sync.");
        } finally {
            setBusyId(null);
        }
    }

    async function handleDisconnect(id: number, displayName: string | null) {
        if (!confirm(`Disconnect ${displayName ?? "this account"}? Your existing collection won't be removed.`)) return;
        setBusyId(id);
        try {
            await axios.delete(`/connected-accounts/${id}`);
            toast.success("Account disconnected.");
            mutate();
        } catch {
            toast.error("Couldn't disconnect.");
        } finally {
            setBusyId(null);
        }
    }

    const connected = (providerId: string) => accounts.find((a) => a.provider === providerId);

    return (
        <div className="space-y-4">
            <p className="text-[13px] text-white/50 max-w-lg">
                Connect your gaming accounts to automatically import your library, playtime, and achievements. Your data is encrypted and only you control its visibility.
            </p>

            {PROVIDERS.map((provider) => {
                const account = connected(provider.id);
                const isBusy = busyId === account?.id;

                return (
                    <div key={provider.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                        {/* Logo */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: provider.iconBg }}>
                            {provider.logo}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[14px] font-bold text-white">{provider.name}</span>
                                {account && (
                                    <span className="text-[11px] font-semibold text-white/40 truncate">
                                        {account.display_name ?? account.provider_user_id}
                                    </span>
                                )}
                            </div>
                            {account ? (
                                syncStatusBadge(account.sync_status, account.last_synced_at)
                            ) : (
                                <span className="text-[12px] text-white/40">{provider.description}</span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {account ? (
                                <>
                                    <button onClick={() => handleSync(account.id)} disabled={isBusy || account.sync_status === "syncing"}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-colors disabled:opacity-40">
                                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                        Re-sync
                                    </button>
                                    <button onClick={() => handleDisconnect(account.id, account.display_name)} disabled={isBusy}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-red-400 hover:text-red-300 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/[0.15] transition-colors disabled:opacity-40">
                                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                                        Disconnect
                                    </button>
                                </>
                            ) : provider.connectMode === "gamertag" ? (
                                gamertagFor === provider.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={gamertag}
                                            onChange={(e) => setGamertag(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") handleGamertagConnect(provider.id); }}
                                            placeholder="Your gamertag"
                                            className="w-40 bg-[#0B0E14] border border-white/[0.1] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[var(--accent)]/50"
                                        />
                                        <button onClick={() => handleGamertagConnect(provider.id)} disabled={connecting === provider.id}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
                                            {connecting === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => { setGamertagFor(null); setGamertag(""); }}
                                            className="p-2 rounded-lg text-white/40 hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setGamertagFor(provider.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors shadow-[0_0_16px_rgba(252,65,0,0.2)]">
                                        <Link2 className="w-3.5 h-3.5" />
                                        Connect
                                    </button>
                                )
                            ) : (
                                <button onClick={() => handleConnect(provider.id)} disabled={connecting === provider.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors shadow-[0_0_16px_rgba(252,65,0,0.2)] disabled:opacity-60">
                                    {connecting === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <Shield className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/30 leading-relaxed">
                    Platform tokens are encrypted at rest. We only read library data — we never post, purchase, or modify anything on your behalf. You can disconnect at any time.
                </p>
            </div>
        </div>
    );
}
