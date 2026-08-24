"use client";

import useSWR from "swr";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import PlatformMark from "@/components/games/PlatformMark";
import { useState } from "react";
import { Loader2, Link2, Link2Off, RefreshCw, CheckCircle2, Clock, AlertCircle, Shield, X, Eye, EyeOff } from "lucide-react";

interface ConnectedAccount {
    id: number;
    provider: string;
    display_name: string | null;
    /** 'expired' is PlayStation's own: the token aged out and only the reader can renew it. */
    sync_status: "idle" | "pending" | "syncing" | "done" | "error" | "expired" | "private";
    sync_error?: string | null;
    last_synced_at: string | null;
    visibility: string;
    /** Xbox only — whether the gamertag was ever proved to be theirs. */
    verified?: boolean;
    /** PlayStation only — the date its token stops refreshing. */
    reconnect_after?: string | null;
}

const fetcher = (url: string) => axios.get(url).then((r) => r.data?.data ?? []);

const PROVIDERS: {
    id: string;
    name: string;
    description: string;
    color: string;
    iconBg: string;
    connectMode?: "redirect" | "gamertag" | "npsso" | "gogcode";
    /** Said plainly on the card, because it is not obvious and it matters. */
    caveat?: string;
    logo: React.ReactNode;
}[] = [
    {
        id: "steam",
        name: "Steam",
        description: "Import your full library, playtime and achievements",
        color: "#1b2838",
        iconBg: "#171a21",
        connectMode: "redirect",
        // Drawn from the shared mark rather than a second tracing of it. The
        // path that used to sit here drew the disc and the valve as one filled
        // shape, which reads as a white blob wherever it is not sitting on
        // Steam's own dark circle.
        logo: <PlatformMark platform="steam" size={24} className="text-white" />,
    },
    {
        id: "xbox",
        name: "Xbox",
        description: "Import your played titles, achievements and Gamerscore by gamertag",
        color: "#107C10",
        iconBg: "#0e2f0e",
        connectMode: "gamertag",
        caveat: "Xbox reports achievements but not playtime, so hours stay blank for these games.",
        logo: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#3FBB48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912A11.942 11.942 0 0 0 24 12.004a11.95 11.95 0 0 0-3.57-8.536s-.027-.022-.082-.042a.847.847 0 0 0-.281-.045c-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042A11.956 11.956 0 0 0 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245a.725.725 0 0 0-.281.045zM12 4.958S9.055 3.233 6.755 3.152c-.905-.033-1.454.295-1.52.335C7.379 1.996 9.659 0 12 0h.016c2.341 0 4.615 1.996 6.762 3.487-.065-.04-.611-.368-1.518-.335-2.3.081-5.244 1.8-5.26 1.806z"/>
            </svg>
        ),
    },
    {
        id: "playstation",
        name: "PlayStation",
        description: "Import the games you have trophies in, and how far through each one you are",
        color: "#003791",
        iconBg: "#00246b",
        connectMode: "npsso",
        caveat: "Sony has no official sign-in for other sites, so this needs a token you copy from your own browser — and it needs renewing about every two months.",
        logo: (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#5B8BF7" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.499v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.06 1.472 1.588 2.072-.473.601-1.622 1.03-1.622 1.03l-8.536 3.079v-2.276zM1.807 18.867c-1.9-.535-2.213-1.65-1.348-2.29.802-.594 2.16-1.04 2.16-1.04l5.626-2.003v2.286l-4.05 1.45c-.715.257-.826.62-.246.813.586.192 1.637.14 2.352-.117l1.944-.705v2.045c-.124.02-.26.04-.386.06-1.939.318-4.004.187-6.052-.5z"/>
            </svg>
        ),
    },
    {
        id: "gog",
        name: "GOG",
        description: "Import everything you own on GOG",
        color: "#8A2BE2",
        iconBg: "#4b1a7a",
        connectMode: "gogcode",
        caveat: "GOG has no sign-in for other sites either, so this needs a code you copy from the address bar. GOG reports what you own and nothing else — no playtime, no achievements.",
        logo: (
            <svg viewBox="0 0 48 24" className="w-7 h-6" fill="#C084FC" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.4 4.8C4.6 4.8 2 7.6 2 12s2.6 7.2 6.4 7.2h5.2v-7.6H9.1v2.8h1.7v2H8.6c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4h5V4.8H8.4zm14 0C18.6 4.8 16 7.6 16 12s2.6 7.2 6.4 7.2h1.9c3.8 0 6.4-2.8 6.4-7.2s-2.6-7.2-6.4-7.2h-1.9zm.2 2.8h1.5c2 0 3.2 1.5 3.2 4.4s-1.2 4.4-3.2 4.4h-1.5c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4zm16.2-2.8C35 4.8 32.4 7.6 32.4 12s2.6 7.2 6.4 7.2H44v-7.6h-4.5v2.8h1.7v2H39c-2 0-3.2-1.5-3.2-4.4s1.2-4.4 3.2-4.4h5V4.8h-5.2z"/>
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
        case "expired":
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Connection expired — reconnect
                </span>
            );
        // Steam answered and told us nothing: the account's Game details are
        // private. Not an error — nothing broke, and reconnecting will not
        // help — but the opposite of "Synced", which is what it used to say
        // over an empty shelf. The instruction is in `sync_error`, below.
        case "private":
            return (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                    <EyeOff className="w-3.5 h-3.5" /> Library is private
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
    const [npssoOpen, setNpssoOpen] = useState(false);
    const [npsso, setNpsso] = useState("");
    const [gogOpen, setGogOpen] = useState(false);
    const [gogCode, setGogCode] = useState("");
    const [verifying, setVerifying] = useState<number | null>(null);
    const [verifyCode, setVerifyCode] = useState<string | null>(null);

    async function handleNpssoConnect() {
        if (npsso.trim().length < 32) {
            toast.error("That doesn't look like an npsso token.");
            return;
        }

        setConnecting("playstation");
        try {
            const res = await axios.post("/connected-accounts/playstation/connect", { npsso: npsso.trim() });
            toast.success(res.data?.message ?? "Connected.");
            setNpssoOpen(false);
            setNpsso("");
            mutate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't connect to PlayStation.");
        } finally {
            setConnecting(null);
        }
    }

    async function handleGogConnect() {
        const code = gogCode.trim();

        // A pasted URL is the likelier mistake than a pasted code — people
        // copy the address bar, not the fragment of it we asked for. Pull the
        // code out rather than refusing a reader who did the sensible thing.
        const fromUrl = code.match(/[?&]code=([^&\s]+)/);
        const value = fromUrl ? decodeURIComponent(fromUrl[1]) : code;

        if (value.length < 10) {
            toast.error("That doesn't look like a GOG code.");
            return;
        }

        setConnecting("gog");
        try {
            const res = await axios.post("/connected-accounts/gog/connect", { code: value });
            toast.success(res.data?.message ?? "Connected.");
            setGogOpen(false);
            setGogCode("");
            mutate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't connect to GOG.");
        } finally {
            setConnecting(null);
        }
    }

    async function startVerification() {
        try {
            const res = await axios.post("/connected-accounts/xbox/verify");
            setVerifyCode(res.data?.data?.code ?? null);
        } catch {
            toast.error("Couldn't start verification.");
            setVerifying(null);
        }
    }

    async function confirmVerification() {
        try {
            await axios.post("/connected-accounts/xbox/verify/confirm");
            toast.success("Verified — that gamertag is yours.");
            setVerifying(null);
            setVerifyCode(null);
            mutate();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't verify yet.");
        }
    }

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

    /**
     * The copy above this list has always said the reader controls visibility.
     * Until now there was no control: connecting set it public and only
     * disconnecting could undo that.
     */
    async function handleVisibility(id: number, next: "public" | "private") {
        setBusyId(id);

        try {
            const res = await axios.patch(`/connected-accounts/${id}/visibility`, { visibility: next });
            toast.success(res.data?.message ?? "Updated.");
            mutate();
        } catch {
            toast.error("Couldn't change that.");
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
                    <div key={provider.id} className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                        {/* Logo */}
                        <div className="w-12 h-12 rounded-[var(--radius-card)] flex items-center justify-center shrink-0" style={{ backgroundColor: provider.iconBg }}>
                            {provider.logo}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[14px] font-bold text-white">{provider.name}</span>
                                {account && (
                                    <span className="text-[11px] font-semibold text-white/40 truncate">
                                        {account.display_name ?? "Connected"}
                                    </span>
                                )}
                                {/* Linking a gamertag proves nothing on its own —
                                    OpenXBL reads public data and does not care who
                                    is asking. This says which state it is in. */}
                                {account && provider.id === "xbox" && (
                                    account.verified ? (
                                        <span className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-[4px] bg-emerald-500/[0.12] text-[9.5px] font-bold uppercase tracking-[0.08em] text-emerald-400">
                                            <Shield className="w-2.5 h-2.5" /> Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center h-[18px] px-1.5 rounded-[4px] bg-white/[0.07] text-[9.5px] font-bold uppercase tracking-[0.08em] text-white/40">
                                            Unverified
                                        </span>
                                    )
                                )}
                            </div>
                            {account ? (
                                <div className="flex flex-col gap-1">
                                    {syncStatusBadge(account.sync_status, account.last_synced_at)}
                                    {account.reconnect_after && account.sync_status !== "expired" && (
                                        <span className="text-[11px] text-white/30">
                                            Needs reconnecting after {new Date(account.reconnect_after).toLocaleDateString()}
                                        </span>
                                    )}
                                    {account.sync_error && (
                                        <span className="text-[11px] text-amber-400/70">{account.sync_error}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[12px] text-white/40">{provider.description}</span>
                                    {provider.caveat && (
                                        <span className="text-[11px] text-white/25 leading-snug">{provider.caveat}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {account ? (
                                <>
                                    <button
                                        onClick={() => handleVisibility(account.id, account.visibility === "public" ? "private" : "public")}
                                        disabled={isBusy}
                                        title={account.visibility === "public"
                                            ? "Shown on your profile — click to hide"
                                            : "Hidden from your profile — click to show"}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] text-[12px] font-semibold border transition-colors disabled:opacity-40 ${
                                            account.visibility === "public"
                                                ? "text-emerald-400 bg-emerald-500/[0.06] border-emerald-500/[0.18] hover:bg-emerald-500/[0.12]"
                                                : "text-white/45 bg-white/[0.04] border-white/[0.1] hover:text-white"
                                        }`}
                                    >
                                        {isBusy
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : account.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        {account.visibility === "public" ? "Visible" : "Hidden"}
                                    </button>
                                    {provider.id === "xbox" && !account.verified && (
                                        <button onClick={() => setVerifying(account.id)} disabled={isBusy}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] text-[12px] font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-colors disabled:opacity-40">
                                            <Shield className="w-3.5 h-3.5" /> Verify
                                        </button>
                                    )}
                                    <button onClick={() => handleSync(account.id)} disabled={isBusy || account.sync_status === "syncing"}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] text-[12px] font-semibold text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-colors disabled:opacity-40">
                                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                        Re-sync
                                    </button>
                                    <button onClick={() => handleDisconnect(account.id, account.display_name)} disabled={isBusy}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] text-[12px] font-semibold text-red-400 hover:text-red-300 bg-red-500/[0.06] hover:bg-red-500/[0.12] border border-red-500/[0.15] transition-colors disabled:opacity-40">
                                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
                                        Disconnect
                                    </button>
                                </>
                            ) : provider.connectMode === "gogcode" ? (
                                <button onClick={() => setGogOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors">
                                    <Link2 className="w-3.5 h-3.5" /> Connect
                                </button>
                            ) : provider.connectMode === "npsso" ? (
                                <button onClick={() => setNpssoOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors">
                                    <Link2 className="w-3.5 h-3.5" /> Connect
                                </button>
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
                                            className="w-40 bg-[var(--surface-1)] border border-white/[0.1] rounded-[var(--radius-card)] px-3 py-2 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[var(--accent)]/50"
                                        />
                                        <button onClick={() => handleGamertagConnect(provider.id)} disabled={connecting === provider.id}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
                                            {connecting === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => { setGamertagFor(null); setGamertag(""); }}
                                            className="p-2 rounded-[var(--radius-card)] text-white/40 hover:text-white transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setGamertagFor(provider.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors">
                                        <Link2 className="w-3.5 h-3.5" />
                                        Connect
                                    </button>
                                )
                            ) : (
                                <button onClick={() => handleConnect(provider.id)} disabled={connecting === provider.id}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60">
                                    {connecting === provider.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* ── PlayStation: the token, and why we have to ask ── */}
            {npssoOpen && (
                <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--surface-1)] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">Connect PlayStation</p>
                            <p className="mt-2 text-[12px] text-white/45 leading-relaxed max-w-[560px]">
                                Sony runs no sign-in for other sites, so there is no button we can send you to. Instead:
                                sign in at <span className="text-white/70">playstation.com</span>, then open{" "}
                                <a
                                    href="https://ca.account.sony.com/api/v1/ssocookie"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    this page
                                </a>{" "}
                                and copy the long value next to <span className="text-white/70">npsso</span>.
                            </p>
                            <p className="mt-2 text-[11px] text-white/25 leading-relaxed max-w-[560px]">
                                The token is encrypted before it is stored and is only used to read your trophy list. It stops
                                working after about two months, and this page will tell you before it does.
                            </p>
                        </div>
                        <button onClick={() => { setNpssoOpen(false); setNpsso(""); }} className="text-white/30 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <input
                            autoFocus
                            value={npsso}
                            onChange={(e) => setNpsso(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleNpssoConnect(); }}
                            placeholder="Paste your npsso token"
                            className="flex-1 min-w-[220px] h-10 px-3 rounded-[var(--radius-card)] bg-[var(--surface-0)] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[var(--accent)]/50"
                        />
                        <button
                            onClick={handleNpssoConnect}
                            disabled={connecting === "playstation"}
                            className="flex items-center gap-1.5 h-10 px-4 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                        >
                            {connecting === "playstation" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            Connect
                        </button>
                    </div>
                </div>
            )}

            {/* ── GOG: the code out of the address bar ── */}
            {gogOpen && (
                <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--surface-1)] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">Connect GOG</p>
                            <p className="mt-2 text-[12px] text-white/45 leading-relaxed max-w-[560px]">
                                GOG runs no sign-in for other sites, so this works the way the GOG Galaxy app does.{" "}
                                <a
                                    href="https://auth.gog.com/auth?client_id=46899977096215655&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code&layout=client2"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[var(--accent)] hover:underline"
                                >
                                    Open this sign-in page
                                </a>
                                , log in, and you will land on a blank page. Copy its whole address — or just the{" "}
                                <span className="text-white/70">code=</span> part — and paste it here.
                            </p>
                            <p className="mt-2 text-[11px] text-white/25 leading-relaxed max-w-[560px]">
                                The code works once and expires quickly. GOG tells us what you own and nothing more — no
                                playtime, no achievements — so those games land on your shelf as backlog.
                            </p>
                        </div>
                        <button onClick={() => { setGogOpen(false); setGogCode(""); }} className="text-white/30 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <input
                            autoFocus
                            value={gogCode}
                            onChange={(e) => setGogCode(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleGogConnect(); }}
                            placeholder="Paste the address, or just the code"
                            className="flex-1 min-w-[220px] h-10 px-3 rounded-[var(--radius-card)] bg-[var(--surface-0)] border border-white/[0.1] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[var(--accent)]/50"
                        />
                        <button
                            onClick={handleGogConnect}
                            disabled={connecting === "gog"}
                            className="flex items-center gap-1.5 h-10 px-4 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                        >
                            {connecting === "gog" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                            Connect
                        </button>
                    </div>
                </div>
            )}

            {/* ── Xbox: proving the gamertag is yours ── */}
            {verifying !== null && (
                <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-white">Prove it is yours</p>
                            <p className="mt-2 text-[12px] text-white/45 leading-relaxed max-w-[560px]">
                                Anyone can type any gamertag, so linking one proves nothing. Put a short code in your Xbox
                                profile bio and we will go and read it back — then you can take it out again.
                            </p>
                        </div>
                        <button onClick={() => { setVerifying(null); setVerifyCode(null); }} className="text-white/30 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {verifyCode ? (
                        <div className="mt-3.5 flex flex-wrap items-center gap-3">
                            <code className="h-10 px-4 inline-flex items-center rounded-[var(--radius-card)] bg-[var(--surface-0)] border border-white/[0.1] font-display text-[15px] font-black tracking-[0.14em] text-[var(--accent)]">
                                {verifyCode}
                            </code>
                            <button
                                onClick={confirmVerification}
                                className="flex items-center gap-1.5 h-10 px-4 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" /> I have added it
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={startVerification}
                            className="mt-3.5 flex items-center gap-1.5 h-10 px-4 rounded-[var(--radius-card)] text-[13px] font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            <Shield className="w-3.5 h-3.5" /> Give me a code
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-start gap-2 mt-2 p-3 rounded-[var(--radius-card)] bg-white/[0.02] border border-white/[0.05]">
                <Shield className="w-3.5 h-3.5 text-white/25 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/30 leading-relaxed">
                    Platform tokens are encrypted at rest. We only read library data — we never post, purchase, or modify anything on your behalf. You can disconnect at any time.
                </p>
            </div>
        </div>
    );
}
