"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useAuthContext } from "@/context/AuthContext";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
    Loader2, Save, User, Lock, CheckCircle, ShieldCheck, Download, Trash2, Link2, Eye, Globe, Users, Check, Gamepad2,
    Bell, MapPin, Quote, type LucideIcon,
} from "lucide-react";
import ConnectedAccountsSection from "@/components/settings/ConnectedAccountsSection";
import ProfilePreviewCard from "@/components/settings/ProfilePreviewCard";
import ImageDropzone from "@/components/settings/ImageDropzone";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";

type Visibility = "public" | "friends";
type SectionId = "profile" | "connections" | "notifications" | "privacy" | "security" | "account";

const VISIBILITY_OPTIONS: { id: Visibility; label: string; description: string; icon: LucideIcon }[] = [
    {
        id: "public",
        label: "Public",
        description: "Anyone can open your profile, and you appear on leaderboards and in member search.",
        icon: Globe,
    },
    {
        id: "friends",
        label: "Friends only",
        description: "Only accepted friends see which games you own, what you played and anything you wrote. Everyone else still sees your name, level, rank, and three totals — how many games, how many hours, how many achievements — plus a way to send a friend request.",
        icon: Users,
    },
];

/**
 * The sections, in the order somebody actually needs them.
 *
 * Two are gone. Gamertags asked you to type a handle on five platforms and
 * proved none of them; Connected platforms links the same accounts through
 * OAuth and syncs a library off the back of it, so the typed version was a
 * worse copy of a thing sitting one tab away. PC Specs was never displayed to
 * the person filling it in — their own Overview is the dashboard, and the card
 * that drew specs only rendered on somebody else's screen.
 */
const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; blurb: string }[] = [
    { id: "profile", label: "Profile", icon: User, blurb: "Name, tagline, bio and the pictures" },
    { id: "connections", label: "Connections", icon: Link2, blurb: "Steam, PlayStation, Xbox and Discord" },
    { id: "notifications", label: "Notifications", icon: Bell, blurb: "What may reach your inbox" },
    { id: "privacy", label: "Privacy", icon: Eye, blurb: "Who can see your profile" },
    { id: "security", label: "Security", icon: Lock, blurb: "Password" },
    { id: "account", label: "Your data", icon: ShieldCheck, blurb: "Export or delete everything" },
];

/** One labelled block inside a section. */
function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 mb-2">
                <label className="font-display text-[9px] font-black uppercase tracking-[0.16em] text-white/55">{label}</label>
                {hint && <span className="text-[11px] text-white/50">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

/** A section's own frame, so every one of them opens the same way. */
function Section({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
    return (
        <div
            className="rounded-[var(--radius-panel)] border overflow-hidden"
            style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
            <header className="px-5 md:px-6 py-4 border-b border-white/[0.07]">
                <h2 className="font-display text-[12px] font-black uppercase tracking-[0.15em] text-white">{title}</h2>
                <p className="mt-1 text-[12px] text-white/50">{blurb}</p>
            </header>
            <div className="p-5 md:p-6">{children}</div>
        </div>
    );
}

export default function SettingsClient() {
    const { user, isLoading, logout } = useAuth({ middleware: "auth" });
    // The hook handles the redirect; the context is what actually holds the
    // user everything else renders from, so a save has to update that too.
    const { updateUser } = useAuthContext();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [section, setSection] = useState<SectionId>("profile");

    /**
     * The section is addressable. Until now it was not, so every link into
     * settings landed on Profile no matter what it was pointing at — which is
     * why "Connect platforms" on the profile hero needs this to exist.
     *
     * Read after mount rather than through useSearchParams: this route is
     * prerendered, and reading the query during render would either force the
     * whole page dynamic or hand the client a different section than the
     * server just rendered.
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const wanted = params.get("section");
        if (wanted && SECTIONS.some((s) => s.id === wanted)) setSection(wanted as SectionId);

        /*
         * What came back from Steam.
         *
         * The callback has always ended by redirecting here with one of these
         * two flags, and nothing has ever read either — so a reader who linked
         * their account returned to an unchanged page and a reader whose link
         * failed returned to the same unchanged page. Both looked like a button
         * that does nothing. The flags are cleared once read, so a refresh does
         * not announce it twice.
         */
        if (params.get("steam_connected")) {
            toast.success("Steam connected — your library is importing now.");
        } else if (params.get("steam_error")) {
            toast.error("Steam couldn't confirm that sign-in. Please try again.");
        }

        if (params.has("steam_connected") || params.has("steam_error")) {
            params.delete("steam_connected");
            params.delete("steam_error");
            const rest = params.toString();
            window.history.replaceState(null, "", rest ? `/settings?${rest}` : "/settings");
        }
    }, []);

    /** Switching sections rewrites the address, so a refresh or a shared link
     *  comes back to the same place. replaceState, not a navigation — the page
     *  is already here and re-running the route would drop the form state. */
    const openSection = (id: SectionId) => {
        setSection(id);
        window.history.replaceState(null, "", id === "profile" ? "/settings" : `/settings?section=${id}`);
    };
    const [isExporting, setIsExporting] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    // Deleting an account is irreversible, so the API now re-authenticates it.
    const [deletePassword, setDeletePassword] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ── the profile form ──
    const [bio, setBio] = useState(user?.bio || "");
    const [displayName, setDisplayName] = useState(user?.display_name || "");
    // Both of these are drawn on the profile hero and neither had a field
    // here — the hero even carries an "Edit your tagline" link that landed on
    // a page with nowhere to edit it.
    const [tagline, setTagline] = useState(user?.tagline || "");
    const [location, setLocation] = useState(user?.location || "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(user?.cover_image || null);

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    // Toggles that save on click rather than waiting for the profile form's
    // button — they live in sections that have no form to submit.
    const [visibility, setVisibility] = useState<Visibility>((user?.profile_visibility as Visibility) || "public");
    const [savingVisibility, setSavingVisibility] = useState(false);
    const [emails, setEmails] = useState<boolean>(user?.email_notifications ?? true);
    const [autoShelf, setAutoShelf] = useState<boolean>(user?.auto_add_played_games ?? true);
    const [savingShelf, setSavingShelf] = useState(false);
    const [savingEmails, setSavingEmails] = useState(false);

    // Seed the form from the account once. This used to run during render on
    // every pass, so deleting the last character of a bio immediately restored
    // the old text — the field could be edited but never emptied.
    const seeded = useRef(false);
    useEffect(() => {
        if (seeded.current || !user) return;
        seeded.current = true;

        setBio(user.bio || "");
        setDisplayName(user.display_name || "");
        setTagline(user.tagline || "");
        setLocation(user.location || "");
        setVisibility((user.profile_visibility as Visibility) || "public");
        setEmails(user.email_notifications ?? true);
        setAutoShelf(user.auto_add_played_games ?? true);
        if (user.avatar_url) setAvatarPreview(user.avatar_url);
        if (user.cover_image) setCoverPreview(user.cover_image);
    }, [user]);

    // Nothing to save is a disabled button, not a request that changes
    // nothing and reports success anyway.
    const dirty = useMemo(() => {
        if (!user) return false;

        return bio !== (user.bio || "")
            || displayName !== (user.display_name || "")
            || tagline !== (user.tagline || "")
            || location !== (user.location || "")
            || !!avatarFile
            || !!coverFile
            || coverPreview !== (user.cover_image || null);
    }, [user, bio, displayName, tagline, location, avatarFile, coverFile, coverPreview]);

    const handleVisibilityChange = async (next: Visibility) => {
        if (next === visibility || savingVisibility) return;
        const previous = visibility;
        setVisibility(next);
        setSavingVisibility(true);
        try {
            const form = new FormData();
            form.append("_method", "PUT");
            form.append("profile_visibility", next);
            await axios.post("/user/profile", form, { headers: { "Content-Type": "multipart/form-data" } });
            if (user?.username) mutate(`/users/${user.username}`);
            toast.success(next === "friends" ? "Your profile is now friends only." : "Your profile is public.");
        } catch {
            setVisibility(previous);
            toast.error("Could not update profile visibility.");
        } finally {
            setSavingVisibility(false);
        }
    };

    const handleEmailsChange = async (next: boolean) => {
        if (next === emails || savingEmails) return;
        const previous = emails;
        setEmails(next);
        setSavingEmails(true);
        try {
            const form = new FormData();
            form.append("_method", "PUT");
            form.append("email_notifications", next ? "1" : "0");
            const { data } = await axios.post("/user/profile", form, { headers: { "Content-Type": "multipart/form-data" } });
            if (data?.user) updateUser(data.user);
            toast.success(next ? "We'll email you again." : "Emails off. Everything still shows on site.");
        } catch {
            setEmails(previous);
            toast.error("Could not save that.");
        } finally {
            setSavingEmails(false);
        }
    };

    const handleShelfChange = async (next: boolean) => {
        if (next === autoShelf || savingShelf) return;
        const previous = autoShelf;
        setAutoShelf(next);
        setSavingShelf(true);
        try {
            const form = new FormData();
            form.append("_method", "PUT");
            form.append("auto_add_played_games", next ? "1" : "0");
            const { data } = await axios.post("/user/profile", form, { headers: { "Content-Type": "multipart/form-data" } });
            if (data?.user) updateUser(data.user);
            toast.success(next
                ? "We'll shelve what we see you play."
                : "Off. Your library only changes when you change it.");
        } catch {
            setAutoShelf(previous);
            toast.error("Could not save that.");
        } finally {
            setSavingShelf(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("_method", "PUT"); // PUT cannot carry files; Laravel reads the spoof
            formData.append("bio", bio);
            formData.append("display_name", displayName);
            formData.append("tagline", tagline);
            formData.append("location", location);

            if (avatarFile) formData.append("avatar", avatarFile);

            // Removing a cover is not the same as not changing it: without an
            // explicit flag the API kept the old image and "Remove" did nothing.
            if (!coverFile && !coverPreview) formData.append("remove_cover", "1");
            if (coverFile) formData.append("cover_image", coverFile);

            const { data } = await axios.post("/user/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Without this the page keeps rendering the user it was given on
            // mount, so a freshly uploaded cover looks like it never saved.
            if (data?.user) {
                updateUser(data.user);
                setCoverPreview(data.user.cover_image ?? null);
                setCoverFile(null);
                setAvatarFile(null);
            }

            if (user?.username) mutate(`/users/${user.username}`);
            // Completion is computed from these very fields — refresh it now
            mutate("/me/dashboard");
            toast.success("Saved.");
            router.refresh();
        } catch (error: unknown) {
            const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg ?? "Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setSaving(true);
        try {
            await axios.put("/user/password", {
                current_password: passwords.current,
                new_password: passwords.new,
                new_password_confirmation: passwords.confirm,
            });
            setShowSuccessModal(true);
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (error: unknown) {
            const res = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
            const msg = res?.data?.message || "Failed to change password.";
            const valErrors = res?.data?.errors ? Object.values(res.data.errors).flat().join("\n") : "";
            toast.error(valErrors ? `${msg}\n${valErrors}` : msg);
        } finally {
            setSaving(false);
        }
    };

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const res = await axios.get("/user/export-data", { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `techplay-data-${user?.username}-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error("Failed to export data. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== user?.username) {
            toast.error(`Please type your username "${user?.username}" to confirm.`);
            return;
        }
        if (!confirm("This will permanently delete your account. This action CANNOT be undone.")) return;
        setIsDeletingAccount(true);
        try {
            await axios.delete("/user/account", { data: { current_password: deletePassword } });
            logout();
        } catch (err: unknown) {
            const message = (err as { response?: { status?: number } })?.response?.status === 422
                ? "That password is not correct."
                : "Failed to delete account. Please contact support.";
            toast.error(message);
        } finally {
            setIsDeletingAccount(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen pt-24 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const current = SECTIONS.find((s) => s.id === section)!;

    return (
        <div className="min-h-screen pt-24 pb-12">
            <div className="container-page">
                {/* The account, rather than the word "Settings".
                
                    This was a page title in the same treatment every other page
                    uses, with the identity demoted to a grey line under it and
                    the completion widget dropped full-width above the content —
                    so the first thing on a page about your account was a heading
                    and a progress bar, and the account itself was a footnote.
                    The avatar anchors it now and the two facts that matter sit
                    beside it. */}
                {/* The page's name, and the one fact about the account that
                    is not on show anywhere else in it.

                    What stood here was an avatar, a display name and a handle —
                    all three drawn again by the preview card a few centimetres
                    below, which is the thing actually being edited. Beside them
                    sat a completion ring listing "add a tagline", "pick
                    playstyle tags", next to the very fields that set them. */}
                <header className="mb-6">
                    <h1 className="font-display text-[26px] md:text-[32px] font-black uppercase tracking-tight leading-none text-white">
                        Settings
                    </h1>
                    <p className="mt-1.5 text-[12.5px] text-white/50 truncate">
                        Signed in as {user.email}
                    </p>
                </header>

                {/* A rail rather than a chip bar. Settings are navigated, not
                    browsed: you arrive knowing which one you came for, and a
                    list you can read down finds it faster than six chips that
                    scroll sideways. */}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
                    <nav className="lg:sticky lg:top-24" aria-label="Settings sections">
                        <div className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
                            {SECTIONS.map(({ id, label, icon: Icon, blurb }) => {
                                const on = id === section;

                                return (
                                    <button
                                        key={id}
                                        onClick={() => openSection(id)}
                                        aria-current={on ? "page" : undefined}
                                        className={`group/nav shrink-0 flex items-center gap-3 lg:h-auto lg:py-2.5 h-11 px-3.5 rounded-[9px] text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-300 ${
                                            on
                                                ? "bg-[var(--accent)]/[0.12] text-[var(--accent-ink)]"
                                                : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                                        }`}
                                    >
                                        <Icon
                                            className="w-[19px] h-[19px] shrink-0 transition-transform duration-300 group-hover/nav:scale-110"
                                            strokeWidth={1.6}
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate">{label}</span>
                                            {/* Every section already carried a
                                                blurb and only the panel header
                                                ever showed it — which is the one
                                                place you have already arrived. */}
                                            <span className={`hidden lg:block mt-0.5 font-display text-[9px] font-medium normal-case tracking-normal truncate ${on ? "text-[var(--accent-ink)]/50" : "text-white/45"}`}>
                                                {blurb}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="min-w-0 space-y-5">
                        {section === "profile" && (
                            <>
                                {/* The thing being edited, above the boxes that
                                    edit it. Six fields existed to change this
                                    one object and none of them showed it, so
                                    the only way to see a change was to save it
                                    and go looking. */}
                                <ProfilePreviewCard
                                    username={user.username}
                                    displayName={displayName}
                                    tagline={tagline}
                                    location={location}
                                    bio={bio}
                                    avatarUrl={avatarPreview}
                                    coverUrl={coverPreview}
                                />

                                <Section title="Who you are" blurb={current.blurb}>
                                    {/* Two columns where a field is short and one
                                        where it is not. This was a single
                                        max-w-xl strip, so on any wide screen the
                                        form occupied a third of the page and the
                                        rest was empty — which is most of what
                                        made it read as unfinished. */}
                                    <div className="space-y-5">
                                        {/* The three that fit on one line, on one
                                            line. Two of them are read-only, so
                                            leaving them stacked full-width gave
                                            the most space on the page to the two
                                            fields nobody can edit. */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                            <Field label="Username" hint="Cannot be changed">
                                                <Input value={user.username} disabled className="opacity-50 cursor-not-allowed bg-[var(--surface-2)]" />
                                            </Field>
                                            <Field label="Email" hint="Cannot be changed here">
                                                <Input value={user.email} disabled className="opacity-50 cursor-not-allowed bg-[var(--surface-2)]" />
                                            </Field>
                                            <Field label="Display name" hint={`Falls back to ${user.username}`}>
                                                <Input
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder={user.username}
                                                    maxLength={50}
                                                />
                                            </Field>
                                        </div>

                                        {/* Tagline is the wider of the two — it is
                                            a sentence, and Location is a place. */}
                                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                                            <Field label="Tagline" hint={`${tagline.length}/120`}>
                                                <Input
                                                    value={tagline}
                                                    onChange={(e) => setTagline(e.target.value.slice(0, 120))}
                                                    placeholder="One line, under your name on your profile"
                                                />
                                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/50">
                                                    <Quote className="w-3 h-3" /> Shown on your profile header, above your bio.
                                                </p>
                                            </Field>

                                            <Field label="Location" hint={`${location.length}/100`}>
                                                <Input
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value.slice(0, 100))}
                                                    placeholder="Sarajevo, BA"
                                                />
                                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/50">
                                                    <MapPin className="w-3 h-3" /> Optional, and public.
                                                </p>
                                            </Field>
                                        </div>

                                        <Field label="Bio" hint={`${bio.length}/500`}>
                                            <Textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                                                placeholder="What you play, and why."
                                                className="h-32"
                                            />
                                        </Field>
                                    </div>
                                </Section>

                                <Section title="Pictures" blurb="The portrait and the banner behind it">
                                    {/* Two dropzones rather than two browser
                                        file buttons — see ImageDropzone. Side
                                        by side on a wide screen: they are one
                                        decision about how the header looks, and
                                        stacking them in a narrow column made
                                        the page longer without making it
                                        clearer. */}
                                    <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 xl:gap-8">
                                        <ImageDropzone
                                            shape="avatar"
                                            label="Avatar"
                                            preview={avatarPreview}
                                            hint="JPG, PNG or WEBP. Max 2 MB."
                                            onFile={(file) => { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }}
                                        />

                                        <ImageDropzone
                                            shape="cover"
                                            label="Cover"
                                            preview={coverPreview}
                                            hint="Recommended 1920×480. Max 5 MB."
                                            onFile={(file) => { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); }}
                                            onClear={() => { setCoverFile(null); setCoverPreview(null); }}
                                        />
                                    </div>
                                </Section>

                                {/* The bar only appears when there is something to
                                    save. A permanently live Save button teaches
                                    people to press it and find out. */}
                                <div className="sticky bottom-4 z-10">
                                    <div
                                        className={`flex items-center justify-between gap-4 rounded-[12px] border px-4 py-3 transition-opacity duration-300 ${dirty ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                                        style={{
                                            background: "var(--surface-2)",
                                            borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                                            boxShadow: "0 18px 40px -20px rgba(0,0,0,0.9)",
                                        }}
                                    >
                                        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/45">
                                            Unsaved changes
                                        </span>
                                        <Button onClick={handleSave} disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save changes
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {section === "connections" && (
                            <Section title="Connected platforms" blurb={current.blurb}>
                                <div className="max-w-xl">
                                    <ConnectedAccountsSection />

                                    {/* Discord used to live under Gamertags, next to
                                        four text fields — a real OAuth link filed
                                        beside four strings anybody could type. */}
                                    <div className="mt-6 pt-6 border-t border-white/[0.07]">
                                        <div className="flex items-center gap-4">
                                            <span className="w-11 h-11 shrink-0 rounded-[10px] bg-[#5865F2]/12 border border-[#5865F2]/30 flex items-center justify-center text-[18px]">
                                                💬
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-display text-[12.5px] font-bold text-white">Discord</p>
                                                <p className="text-[11.5px] text-white/50 leading-snug">
                                                    {user.discord_linked
                                                        ? "Linked. Professor Buffy can see you in our server and mirror your XP."
                                                        : "Link it so the bot recognises you in our server, and your membership shows on your profile."}
                                                </p>
                                            </div>
                                            {user.discord_linked ? (
                                                <span className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-[8px] bg-emerald-500/12 border border-emerald-500/30 font-display text-[10px] font-black uppercase tracking-[0.1em] text-emerald-400">
                                                    <Check className="w-3.5 h-3.5" /> Linked
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/discord/redirect`; }}
                                                    className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-[#5865F2] hover:brightness-110 font-display text-[10px] font-black uppercase tracking-[0.1em] text-white transition-[filter]"
                                                >
                                                    <Link2 className="w-3.5 h-3.5" /> Connect
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Section>
                        )}

                        {section === "notifications" && (
                            <Section title="Notifications" blurb={current.blurb}>
                                <div className="max-w-xl">
                                    <button
                                        onClick={() => handleEmailsChange(!emails)}
                                        disabled={savingEmails}
                                        role="switch"
                                        aria-checked={emails}
                                        className="w-full flex items-center gap-4 text-left group/sw disabled:opacity-60"
                                    >
                                        <span className={`shrink-0 ${emails ? "text-[var(--accent)]" : "text-white/25"}`}>
                                            <Bell className="w-5 h-5" strokeWidth={1.6} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[13px] font-semibold text-white">Email me</span>
                                            <span className="block text-[11.5px] text-white/50 leading-snug">
                                                Giveaway reminders and anything else that needs to reach you when you are not here.
                                                Turning this off never hides anything on the site.
                                            </span>
                                        </span>
                                        <span className={`shrink-0 relative w-[42px] h-[24px] rounded-full transition-colors duration-300 ${emails ? "bg-[var(--accent)]" : "bg-white/[0.12]"}`}>
                                            <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-300 ${emails ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
                                        </span>
                                    </button>

                                    {/* Sits here rather than under Privacy: it is
                                        about what the site does on your behalf,
                                        which is the same question the switch
                                        above answers. */}
                                    <div className="mt-5 pt-5 border-t border-white/[0.07]">
                                        <button
                                            onClick={() => handleShelfChange(!autoShelf)}
                                            disabled={savingShelf}
                                            role="switch"
                                            aria-checked={autoShelf}
                                            className="w-full flex items-center gap-4 text-left disabled:opacity-60"
                                        >
                                            <span className={`shrink-0 ${autoShelf ? "text-[var(--accent)]" : "text-white/25"}`}>
                                                <Gamepad2 className="w-5 h-5" strokeWidth={1.6} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[13px] font-semibold text-white">Shelve what I play</span>
                                                <span className="block text-[11.5px] text-white/50 leading-snug">
                                                    When Steam or Discord shows you playing something for more than a couple of
                                                    minutes, add it to your library as Playing. This is also what lets your hours
                                                    be counted — a game with no shelf entry has nowhere to record them.
                                                </span>
                                            </span>
                                            <span className={`shrink-0 relative w-[42px] h-[24px] rounded-full transition-colors duration-300 ${autoShelf ? "bg-[var(--accent)]" : "bg-white/[0.12]"}`}>
                                                <span className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-300 ${autoShelf ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
                                            </span>
                                        </button>
                                    </div>

                                    <p className="mt-5 pt-5 border-t border-white/[0.07] text-[11.5px] text-white/50 leading-relaxed">
                                        Release reminders are set per game, on the calendar — the bell on any unreleased title.
                                        On-site notifications are always on; they are the bell in the header.
                                    </p>
                                </div>
                            </Section>
                        )}

                        {section === "privacy" && (
                            <Section title="Profile visibility" blurb={current.blurb}>
                                <div className="max-w-lg space-y-2">
                                    <p className="text-[12.5px] text-white/55 leading-relaxed mb-3">
                                        Controls who can open your collection, stats, activity and achievements. Your forum
                                        posts, comments and published reviews stay public either way — they were posted to
                                        public pages.
                                    </p>

                                    {VISIBILITY_OPTIONS.map((opt) => {
                                        const active = visibility === opt.id;

                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleVisibilityChange(opt.id)}
                                                disabled={savingVisibility}
                                                className={`w-full text-left p-4 rounded-[var(--radius-card)] border transition-colors disabled:opacity-60 ${
                                                    active
                                                        ? "border-[var(--accent)] bg-[var(--accent)]/[0.07]"
                                                        : "border-[var(--line)] hover:border-white/25"
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <opt.icon className={`w-4 h-4 ${active ? "text-[var(--accent)]" : "text-white/35"}`} />
                                                    <span className={`font-bold text-sm ${active ? "text-[var(--accent)]" : "text-white"}`}>
                                                        {opt.label}
                                                    </span>
                                                    {active && <Check className="w-4 h-4 ml-auto text-[var(--accent)]" />}
                                                </span>
                                                <span className="block text-[11.5px] text-white/50 mt-1.5 leading-relaxed">{opt.description}</span>
                                            </button>
                                        );
                                    })}

                                    {visibility === "friends" && (
                                        <p className="pt-2 text-[11.5px] text-white/50 leading-relaxed">
                                            While private you also drop off the leaderboards and out of member search. Anyone
                                            with your link still sees your name, level and rank — with an <strong>Add Friend</strong> button.
                                        </p>
                                    )}
                                </div>
                            </Section>
                        )}

                        {section === "security" && (
                            <Section title="Password" blurb={current.blurb}>
                                <div className="max-w-md space-y-5">
                                    <Field label="Current password">
                                        <Input
                                            type="password"
                                            autoComplete="current-password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        />
                                    </Field>
                                    <Field label="New password" hint="Min 8 characters">
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        />
                                    </Field>
                                    <Field label="Confirm new password">
                                        <Input
                                            type="password"
                                            autoComplete="new-password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                    </Field>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={saving || !passwords.current || !passwords.new || passwords.new !== passwords.confirm}
                                        className="w-full"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                                        Change password
                                    </Button>
                                </div>
                            </Section>
                        )}

                        {section === "account" && (
                            <>
                                <Section title="Download your data" blurb="Everything we hold, as one JSON file">
                                    <div className="max-w-lg">
                                        <p className="text-[12.5px] text-white/55 leading-relaxed mb-4">
                                            Your profile, collection, forum posts, orders and achievements. Nothing is deleted
                                            by exporting.
                                        </p>
                                        <Button onClick={handleExportData} disabled={isExporting} variant="outline">
                                            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                            {isExporting ? "Preparing export…" : "Export my data"}
                                        </Button>
                                    </div>
                                </Section>

                                <div className="rounded-[var(--radius-panel)] border border-red-500/25 bg-red-500/[0.04] overflow-hidden">
                                    <header className="px-5 md:px-6 py-4 border-b border-red-500/20">
                                        <h2 className="flex items-center gap-2 font-display text-[12px] font-black uppercase tracking-[0.15em] text-red-400">
                                            <Trash2 className="w-4 h-4" /> Delete your account
                                        </h2>
                                        <p className="mt-1 text-[12px] text-white/50">Permanent, and it cannot be undone.</p>
                                    </header>
                                    <div className="p-5 md:p-6 max-w-lg space-y-3">
                                        <Field label={`Type ${user.username} to confirm`}>
                                            <input
                                                type="text"
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                placeholder={user.username}
                                                className="w-full border border-red-500/30 bg-white/[0.03] rounded-[var(--radius-card)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                            />
                                        </Field>
                                        <Field label="Confirm your password">
                                            <input
                                                type="password"
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                autoComplete="current-password"
                                                className="w-full border border-red-500/30 bg-white/[0.03] rounded-[var(--radius-card)] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                            />
                                        </Field>
                                        <Button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeletingAccount || deleteConfirmText !== user.username || !deletePassword}
                                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {isDeletingAccount ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                            {isDeletingAccount ? "Deleting…" : "Delete my account"}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-6 max-w-sm w-full shadow-[0_28px_60px_rgba(0,0,0,0.7)] text-center"
                        >
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Password changed</h3>
                            <p className="text-white/55 mb-6">
                                Password changed successfully. Please log out and log in again for security reasons.
                            </p>
                            <Button
                                onClick={() => { setShowSuccessModal(false); logout(); }}
                                className="w-full bg-[var(--accent)] hover:brightness-110 text-white font-bold"
                            >
                                OK, log out
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
