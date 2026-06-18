"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { Loader2, Link2, Link2Off, RefreshCw, CheckCircle2, Clock, AlertCircle, Shield } from "lucide-react";

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

const PROVIDERS = [
    {
        id: "steam",
        name: "Steam",
        description: "Import your full library, playtime and achievements",
        color: "#1b2838",
        iconBg: "#171a21",
        logo: (
            <svg viewBox="0 0 233 233" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="116.5" cy="116.5" r="116.5" fill="#1B2838"/>
                <path d="M116.5 28C68.1 28 28 68.1 28 116.5c0 43.5 30.7 79.9 71.7 88.5l26.4-65.3a27.3 27.3 0 01-6.1.7c-15.1 0-27.3-12.2-27.3-27.3s12.2-27.3 27.3-27.3 27.3 12.2 27.3 27.3c0 .8 0 1.5-.1 2.3l-64.2 26.6c2.4 6.6 6.5 12.5 11.9 17l65.8-27.3a27.3 27.3 0 003.8-13.3c0-15.1-12.2-27.3-27.3-27.3zM87.3 144.7l-12.2 5.1c2.3 4.6 6.5 8.2 11.7 9.7 10.6 3 21.5-3.2 24.5-13.8 3-10.6-3.2-21.5-13.8-24.5-5.5-1.5-11.1-.7-15.7 2.1l12.6 5.2a9.1 9.1 0 11-7.1 16.2z" fill="white"/>
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
