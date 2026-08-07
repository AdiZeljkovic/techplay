"use client";

import { useRef, useState } from "react";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import { Settings, X, Loader2, Upload, Trash2, Shield, ImageIcon, Check, UserPlus } from "lucide-react";
import { getStorageUrl } from "@/lib/imageUrl";
import type { ClanProfile } from "@/lib/types/clan";

const PLAYSTYLES = [
    { id: "competitive", label: "Competitive" },
    { id: "casual", label: "Casual" },
    { id: "mixed", label: "Mixed" },
];

const STATUSES = [
    { id: "recruiting", label: "Recruiting — anyone can join" },
    { id: "invite_only", label: "Invite only — applications reviewed" },
    { id: "closed", label: "Closed — not taking members" },
];

/**
 * The clan's settings, in one place. Officers edit presentation; the name
 * and tag belong to the owner, and the form says so rather than letting an
 * officer type into a field the server will ignore.
 */
export default function ManageClanModal({
    clan, isOwner, onClose, onSaved,
}: {
    clan: ClanProfile;
    isOwner: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [inviteName, setInviteName] = useState("");
    const [inviting, setInviting] = useState(false);

    const sendInvite = async () => {
        const username = inviteName.trim();
        if (!username) return;

        setInviting(true);
        try {
            await axios.post(`/clans/${clan.slug}/invite`, { username });
            toast.success(`Invite sent to ${username}.`);
            setInviteName("");
        } catch (e: unknown) {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Couldn't send that invite.");
        } finally {
            setInviting(false);
        }
    };

    const [form, setForm] = useState({
        name: clan.name,
        tag: clan.tag ?? "",
        motto: clan.motto ?? "",
        description: clan.description ?? "",
        region: clan.region ?? "",
        language: clan.language ?? "",
        playstyle: clan.playstyle ?? "",
        status: clan.status ?? "recruiting",
        requirements: clan.requirements ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [busyMedia, setBusyMedia] = useState<"logo" | "banner" | null>(null);
    const [logo, setLogo] = useState(clan.logo);
    const [banner, setBanner] = useState(clan.banner);

    const logoInput = useRef<HTMLInputElement>(null);
    const bannerInput = useRef<HTMLInputElement>(null);

    const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

    const fail = (e: unknown, fallback: string) => {
        const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message ?? fallback);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: Record<string, string | null> = {
                motto: form.motto || null,
                description: form.description || null,
                region: form.region || null,
                language: form.language || null,
                playstyle: form.playstyle || null,
                status: form.status,
                requirements: form.requirements || null,
            };
            if (isOwner) {
                payload.name = form.name;
                payload.tag = form.tag || null;
            }

            await axios.put(`/clans/${clan.slug}`, payload);
            toast.success("Clan updated.");
            onSaved();
            onClose();
        } catch (e: unknown) {
            fail(e, "Couldn't save those settings.");
        } finally {
            setSaving(false);
        }
    };

    const upload = async (kind: "logo" | "banner", file: File) => {
        setBusyMedia(kind);
        try {
            const body = new FormData();
            body.append(kind, file);
            const res = await axios.post(`/clans/${clan.slug}/media`, body, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const data = res.data?.data ?? {};
            if (kind === "logo") setLogo(data.logo);
            else setBanner(data.banner);
            toast.success(kind === "logo" ? "Emblem updated." : "Banner updated.");
            onSaved();
        } catch (e: unknown) {
            fail(e, "Couldn't upload that image.");
        } finally {
            setBusyMedia(null);
        }
    };

    const remove = async (kind: "logo" | "banner") => {
        setBusyMedia(kind);
        try {
            await axios.delete(`/clans/${clan.slug}/media/${kind}`);
            if (kind === "logo") setLogo(null);
            else setBanner(null);
            toast.success("Artwork removed.");
            onSaved();
        } catch (e: unknown) {
            fail(e, "Couldn't remove that image.");
        } finally {
            setBusyMedia(null);
        }
    };

    const field = "w-full h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]";
    const label = "block font-display text-[9px] font-bold uppercase tracking-[0.14em] text-white/40 mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10 bg-black/75 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl rounded-[14px] border border-white/[0.1] bg-[var(--surface-2)] shadow-[0_28px_60px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                    <h2 className="flex items-center gap-2.5 font-display text-[16px] font-black text-white">
                        <Settings className="w-[18px] h-[18px] text-[var(--accent)]" /> Manage clan
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── artwork ── */}
                <div className="p-5 border-b border-white/[0.07]">
                    <p className={label}>Artwork</p>

                    {/* banner strip with the emblem sitting on it, as it renders live */}
                    <div className="relative h-[132px] rounded-[10px] overflow-hidden border border-white/[0.08] bg-[var(--surface-1)]">
                        {banner ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getStorageUrl(banner)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <span
                                aria-hidden
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: "radial-gradient(80% 140% at 30% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%)" }}
                            >
                                <span className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                                    <ImageIcon className="w-4 h-4" /> No banner
                                </span>
                            </span>
                        )}
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />

                        <span className="absolute bottom-3 left-3 w-[62px] h-[62px] rounded-[14px] border-2 border-[var(--accent)] bg-[var(--surface-1)] overflow-hidden flex items-center justify-center">
                            {logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={getStorageUrl(logo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="w-7 h-7 text-[var(--accent)]" strokeWidth={1.6} />
                            )}
                        </span>

                        <span className="absolute bottom-3 right-3 flex items-center gap-2">
                            {([
                                ["logo", "Emblem", logoInput, logo] as const,
                                ["banner", "Banner", bannerInput, banner] as const,
                            ]).map(([kind, text, ref, current]) => (
                                <span key={kind} className="flex items-center gap-1">
                                    <button
                                        onClick={() => ref.current?.click()}
                                        disabled={busyMedia !== null}
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[7px] bg-black/60 backdrop-blur-sm border border-white/[0.12] hover:border-[var(--accent)] font-display text-[9px] font-black uppercase tracking-[0.1em] text-white transition-colors"
                                    >
                                        {busyMedia === kind ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                        {text}
                                    </button>
                                    {current && (
                                        <button
                                            onClick={() => remove(kind)}
                                            disabled={busyMedia !== null}
                                            title={`Remove ${text.toLowerCase()}`}
                                            className="w-8 h-8 rounded-[7px] bg-black/60 backdrop-blur-sm border border-white/[0.12] flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </span>
                    </div>

                    <input
                        ref={logoInput}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload("logo", f); e.target.value = ""; }}
                    />
                    <input
                        ref={bannerInput}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload("banner", f); e.target.value = ""; }}
                    />

                    <p className="mt-2 text-[10.5px] text-white/25 leading-snug">
                        Emblem up to 2 MB, square reads best. Banner up to 4 MB, wide — it backs the clan page and the
                        directory header while your clan is featured.
                    </p>
                </div>

                {/* ── settings ── */}
                <form onSubmit={save} className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <span className={label}>Clan name {!isOwner && <span className="text-white/20 normal-case tracking-normal">· owner only</span>}</span>
                            <input
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                disabled={!isOwner}
                                minLength={3}
                                maxLength={40}
                                className={`${field} disabled:opacity-40 disabled:cursor-not-allowed`}
                            />
                        </div>
                        <div>
                            <span className={label}>Tag</span>
                            <input
                                value={form.tag}
                                onChange={(e) => set("tag", e.target.value.toUpperCase())}
                                disabled={!isOwner}
                                maxLength={8}
                                className={`${field} disabled:opacity-40 disabled:cursor-not-allowed`}
                            />
                        </div>
                    </div>

                    <div>
                        <span className={label}>Motto</span>
                        <input value={form.motto} onChange={(e) => set("motto", e.target.value)} maxLength={120} placeholder="One Legion. Unbroken." className={field} />
                    </div>

                    <div>
                        <span className={label}>Description</span>
                        <textarea
                            value={form.description}
                            onChange={(e) => set("description", e.target.value.slice(0, 500))}
                            rows={3}
                            placeholder="What is this clan about?"
                            className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <span className={label}>Region</span>
                            <input value={form.region} onChange={(e) => set("region", e.target.value)} maxLength={40} placeholder="Europe" className={field} />
                        </div>
                        <div>
                            <span className={label}>Language</span>
                            <input value={form.language} onChange={(e) => set("language", e.target.value)} maxLength={40} placeholder="English" className={field} />
                        </div>
                        <div>
                            <span className={label}>Playstyle</span>
                            <select value={form.playstyle} onChange={(e) => set("playstyle", e.target.value)} className={`${field} cursor-pointer`}>
                                <option value="">—</option>
                                {PLAYSTYLES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <span className={label}>Recruitment status</span>
                        <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`${field} cursor-pointer`}>
                            {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <span className={label}>Requirements</span>
                        <textarea
                            value={form.requirements}
                            onChange={(e) => set("requirements", e.target.value.slice(0, 1000))}
                            rows={2}
                            placeholder="18+, mic, active weekly…"
                            className="w-full px-3 py-2.5 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] resize-none"
                        />
                    </div>

                    {/* Invite by username — the endpoint has been live all
                        along, and the clans directory already tells people
                        this is how they get in. */}
                    <div className="pt-1">
                        <label className="block font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/40 mb-1.5">
                            Invite a player
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="Username"
                                className="flex-1 h-10 px-3 rounded-[8px] bg-white/[0.04] border border-white/[0.09] text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
                            />
                            <button
                                type="button"
                                onClick={sendInvite}
                                disabled={inviting || !inviteName.trim()}
                                className="btn-command inline-flex items-center gap-2 h-10 px-4 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 text-white font-display text-[10px] font-black uppercase tracking-[0.1em] transition-colors"
                            >
                                {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                Invite
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="h-10 px-5 rounded-[8px] bg-white/[0.05] text-white/60 font-display text-[10.5px] font-bold uppercase tracking-[0.1em]">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 h-10 px-6 rounded-[8px] bg-[var(--accent)] hover:brightness-110 disabled:opacity-50 text-white font-display text-[10.5px] font-bold uppercase tracking-[0.1em] transition-[filter]"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Save changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
