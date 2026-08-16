"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Send, AlertCircle, Tag as TagIcon, X, Gamepad2, Loader2, Check } from "lucide-react";
import ForumShell from "@/components/forum/ForumShell";
import { decodeHtml } from "@/lib/decode";
import { getAvatarSrc, getCategoryIcon } from "@/lib/forum";

// PERF: Dynamic import for heavy editor (~50KB+ with Tiptap extensions)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
    loading: () => <div className="h-64 bg-white/[0.03] rounded-[var(--radius-card)] animate-pulse" />,
    ssr: false,
});
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    children?: Category[];
}

function CreateThreadForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCategory = searchParams.get("category");
    const preselectedGameSlug = searchParams.get("game");

    const { user, isLoading: authLoading } = useAuth({ middleware: "auth" });

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameSearch, setGameSearch] = useState("");
    const [selectedGame, setSelectedGame] = useState<{ id: number; name: string } | null>(null);

    const { data: gameResults, isLoading: gameSearchLoading } = useSWR(
        gameSearch.trim().length >= 2 ? `/games?search=${encodeURIComponent(gameSearch.trim())}&page_size=8` : null,
        fetcher
    );

    // Preselect the linked game from the URL (e.g. "Start a Thread" on a game's page)
    const { data: preselectedGameData } = useSWR(
        preselectedGameSlug ? `/games/${preselectedGameSlug}` : null,
        fetcher
    );
    useEffect(() => {
        if (preselectedGameData && !selectedGame) {
            setSelectedGame({ id: preselectedGameData.id, name: preselectedGameData.name });
        }
    }, [preselectedGameData, selectedGame]);

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || tags.length >= 5 || tags.includes(value)) return;
        setTags([...tags, value]);
        setTagInput("");
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter((t) => t !== tag));
    };

    // Fetch forum categories for the board picker
    const { data: categoriesData } = useSWR<Category[]>("/forum/categories", fetcher);

    // Flatten categories (they come as parent -> children structure).
    // Memoised because the preselect effect below depends on it: a fresh array
    // on every render meant that effect re-ran on every keystroke in the title.
    const allCategories = useMemo(
        () => categoriesData?.flatMap((parent) => (parent.children ? parent.children : [parent])) ?? [],
        [categoriesData]
    );

    // Preselect category from URL
    useEffect(() => {
        if (preselectedCategory && allCategories.length > 0) {
            const found = allCategories.find((c) => c.slug === preselectedCategory);
            if (found) setCategoryId(found.id);
        }
    }, [preselectedCategory, allCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !categoryId) {
            setError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post("/forum/threads", {
                title: title.trim(),
                content: content.trim(),
                category_id: categoryId,
                tags: tags.length > 0 ? tags : undefined,
                game_id: selectedGame?.id,
            });

            router.push(`/forum/thread/${response.data.slug}`);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || "Failed to create thread. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--surface-0)] flex flex-col items-center justify-center gap-5 p-4 text-center">
                <span className="w-16 h-16 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                    <AlertCircle className="w-8 h-8" strokeWidth={1.6} />
                </span>
                <div>
                    <h1 className="font-display text-[22px] font-black uppercase tracking-tight text-white">Sign in to post</h1>
                    <p className="mt-1.5 text-[13px] text-white/40">Threads carry a name, so we need yours first.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/login?redirect=/forum/create"><Button variant="outline">Log in</Button></Link>
                    <Link href="/register"><Button>Sign up</Button></Link>
                </div>
            </div>
        );
    }

    const selectedCategory = allCategories.find((c) => c.id === categoryId);
    const userAvatar = getAvatarSrc(user.avatar_url);

    // A disabled button that will not say why is a dead end. This is what is
    // still missing, printed beside the button rather than discovered by
    // pressing it.
    const missing = [
        !categoryId && "a board",
        !title.trim() && "a title",
        !content.replace(/<[^>]*>/g, "").trim() && "a first post",
    ].filter(Boolean) as string[];

    const field = "w-full rounded-[9px] bg-white/[0.03] border border-white/[0.09] text-white placeholder:text-white/25 focus:outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] transition-colors";
    const legend = "font-display text-[9.5px] font-black uppercase tracking-[0.16em] text-white/40";

    /* The preview sits in the shell's rail rather than inside the form: it is
       something to look at, not something to fill in. */
    const preview = (
        <div className="xl:sticky xl:top-24">
            <div
                className="rounded-[var(--radius-panel)] border overflow-hidden"
                style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
                <header className="px-4 py-3 border-b border-[var(--line)]">
                    <h2 className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                        How it will look
                    </h2>
                </header>

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.05] shrink-0">
                            {userAvatar ? (
                                <Image src={userAvatar} alt="" width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white font-bold text-[13px]">
                                    {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block font-display text-[13.5px] font-bold leading-snug line-clamp-3 text-white">
                                {title.trim() || <span className="text-white/20">Your title lands here</span>}
                            </span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-[var(--ink-faint)]">
                                <span className="font-medium text-[var(--ink-low)]">{user.username}</span>
                                {selectedCategory && (
                                    <>
                                        <span aria-hidden>·</span>
                                        <span>{selectedCategory.name}</span>
                                    </>
                                )}
                                <span aria-hidden>·</span>
                                <span>just now</span>
                            </span>
                        </span>
                    </div>

                    {(tags.length > 0 || selectedGame) && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {selectedGame && (
                                <span className="inline-flex items-center gap-1 h-[20px] px-2 rounded-[5px] bg-white/[0.05] border border-[var(--line)] text-[9.5px] font-bold text-[var(--ink-mid)]">
                                    <Gamepad2 className="w-3 h-3" /> {selectedGame.name}
                                </span>
                            )}
                            {tags.map((t) => (
                                <span key={t} className="inline-flex items-center h-[20px] px-2 rounded-[5px] bg-white/[0.04] text-[9.5px] font-bold text-[var(--ink-faint)]">
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-t border-[var(--line)] space-y-1.5">
                    {[
                        "Search first — the answer may already be on the board.",
                        "Say what you already tried; it saves everybody a reply.",
                        "One question per thread.",
                    ].map((tip) => (
                        <p key={tip} className="flex gap-2 text-[11.5px] text-[var(--ink-faint)] leading-snug">
                            <span aria-hidden className="mt-[6px] w-1 h-1 rounded-full bg-[var(--accent)] shrink-0" />
                            {tip}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );

    /* This page sits outside the boards layout on purpose. That layout carries
       the forum's own sidebar — active threads, popular boards, everything you
       would browse — and a list of other people's threads beside a half-written
       one is an invitation to abandon it. So the container is built here, and
       the rail shows this thread as the board will list it. */
    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
          <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 md:px-6">
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_324px]">
              <ForumShell
                crumbs={[
                { label: "Forum", href: "/forum" },
                ...(selectedCategory ? [{ label: selectedCategory.name, href: `/forum/${selectedCategory.slug}` }] : []),
                { label: "New thread" },
            ]}
            title="New thread"
            description={selectedCategory?.description ? decodeHtml(selectedCategory.description) : "Pick a board, give it a title people will search for, and say what you already tried."}
            action={
                /* Who is posting belonged in the header, not in a bordered card
                   of its own above the form. */
                <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-[color-mix(in_srgb,var(--accent)_45%,transparent)] shrink-0">
                        {userAvatar ? (
                            <Image src={userAvatar} alt="" width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                            <span className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white font-bold text-[13px]">
                                {user.username?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                        )}
                    </span>
                    <span className="text-[11.5px] text-[var(--ink-faint)]">
                        Posting as <span className="font-medium text-white">{user.username}</span>
                    </span>
                </span>
            }
              >
                <form onSubmit={handleSubmit}>
                    {/* ── the sheet ──

                        This was six bordered panels stacked — posting as,
                        category, title, content, tags, game — each at panel
                        radius with its own 24px of padding, which is a form
                        pretending to be six sections of a page. One sheet,
                        hairlines between the parts. */}
                    <div
                        className="min-w-0 rounded-[var(--radius-panel)] border overflow-hidden"
                        style={{ background: "var(--surface-1)", borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                    >
                        {error && (
                            <p className="flex items-center gap-3 px-5 py-3.5 bg-red-500/10 border-b border-red-500/25 text-[13px] text-red-300">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </p>
                        )}

                        {/* ── board ── */}
                        <fieldset className="p-5 border-b border-white/[0.07]">
                            <legend className={legend}>
                                Board <span className="text-[var(--accent)]">*</span>
                            </legend>

                            {preselectedCategory && selectedCategory ? (
                                <p className="mt-3 inline-flex items-center gap-2.5 h-11 px-4 rounded-[9px] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[var(--accent-soft)]">
                                    <Check className="w-4 h-4 text-[var(--accent)]" />
                                    <span className="font-display text-[12px] font-bold text-white">{selectedCategory.name}</span>
                                    <span className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Locked</span>
                                </p>
                            ) : (
                                /* Boards as marks, not a bare select. The select
                                   had appearance-none with no chevron drawn back
                                   on, so it read as a text field that did
                                   nothing — and it never showed which board you
                                   were about to post into until after you had. */
                                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {allCategories.map((cat) => {
                                        const Mark = getCategoryIcon(cat.slug);
                                        const on = cat.id === categoryId;

                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategoryId(cat.id)}
                                                aria-pressed={on}
                                                className={`flex items-center gap-2.5 h-[52px] px-3 rounded-[10px] border text-left transition-colors duration-200 ${
                                                    on
                                                        ? "border-[color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[var(--accent-soft)]"
                                                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/25"
                                                }`}
                                            >
                                                <Mark className={`w-[28px] h-[28px] shrink-0 transition-opacity duration-200 ${on ? "opacity-100" : "opacity-45"}`} />
                                                <span className={`min-w-0 font-display text-[11.5px] font-bold leading-tight ${on ? "text-white" : "text-white/60"}`}>
                                                    {cat.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                        </fieldset>

                        {/* ── title ── */}
                        <fieldset className="p-5 border-b border-white/[0.07]">
                            <legend className={legend}>
                                Title <span className="text-[var(--accent)]">*</span>
                            </legend>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="The question, in one line"
                                className={`${field} mt-3 h-12 px-4 font-display text-[16px] font-bold`}
                                maxLength={255}
                                required
                            />
                            <p className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                                <span className="text-white/30">Specific beats clever — this is what people search.</span>
                                <span className={`tabular-nums ${title.length > 220 ? "text-amber-400" : "text-white/25"}`}>
                                    {title.length}/255
                                </span>
                            </p>
                        </fieldset>

                        {/* ── the post ── */}
                        <fieldset className="p-5 border-b border-white/[0.07]">
                            <legend className={legend}>
                                First post <span className="text-[var(--accent)]">*</span>
                            </legend>
                            <div className="mt-3">
                                <RichTextEditor
                                    uploadPath="/forum/uploads"
                                    content={content}
                                    onChange={setContent}
                                    placeholder="What happened, what you tried, and what you are asking."
                                    minHeight="260px"
                                />
                            </div>
                        </fieldset>

                        {/* ── the optional half ──

                            Tags and a linked game are both metadata nobody has
                            to fill in, and each had a panel to itself. They
                            share a row. */}
                        <fieldset className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <legend className={legend}>
                                    Tags <span className="text-white/25">up to 5</span>
                                </legend>
                                {tags.length > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                        {tags.map((tag) => (
                                            <span key={tag} className="inline-flex items-center gap-1.5 h-[26px] pl-2.5 pr-1.5 rounded-full bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[10.5px] font-bold text-[var(--accent-ink)]">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="hover:text-white">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {tags.length < 5 && (
                                    <div className="relative mt-2">
                                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                                            }}
                                            onBlur={addTag}
                                            placeholder="Type a tag, press Enter"
                                            className={`${field} h-10 pl-9 pr-3 text-[13px]`}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <legend className={legend}>Link a game</legend>
                                {selectedGame ? (
                                    <p className="mt-3 flex items-center justify-between gap-2 h-10 px-3 rounded-[9px] bg-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
                                        <span className="min-w-0 text-[12.5px] font-semibold text-white truncate">{selectedGame.name}</span>
                                        <button type="button" onClick={() => setSelectedGame(null)} aria-label="Remove linked game" className="shrink-0 text-[var(--accent-ink)] hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </p>
                                ) : (
                                    <div className="relative mt-3">
                                        <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                                        <input
                                            type="text"
                                            value={gameSearch}
                                            onChange={(e) => setGameSearch(e.target.value)}
                                            placeholder="Search the catalogue"
                                            className={`${field} h-10 pl-9 pr-3 text-[13px]`}
                                        />
                                        {gameSearch.trim().length >= 2 && (
                                            <div className="absolute z-20 left-0 right-0 top-[44px] max-h-56 overflow-y-auto rounded-[10px] border border-white/[0.1] bg-[var(--surface-2)] shadow-[0_20px_44px_rgba(0,0,0,0.6)]">
                                                {gameSearchLoading ? (
                                                    <p className="flex items-center gap-2 p-3 text-[12px] text-white/35"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…</p>
                                                ) : (gameResults?.results?.length ?? 0) === 0 ? (
                                                    <p className="p-3 text-[12px] text-white/30">Nothing matched.</p>
                                                ) : (
                                                    gameResults.results.map((g: { id: number; name: string; slug: string }) => (
                                                        <button
                                                            key={g.id}
                                                            type="button"
                                                            onClick={() => { setSelectedGame({ id: g.id, name: g.name }); setGameSearch(""); }}
                                                            className="w-full text-left px-3 py-2.5 text-[12.5px] text-white hover:bg-white/[0.05] transition-colors"
                                                        >
                                                            {g.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        {/* ── the action ── */}
                        <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.07]" style={{ background: "var(--surface-2)" }}>
                            {missing.length > 0 && (
                                <span className="mr-auto font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/30">
                                    Still needs {missing.join(", ")}
                                </span>
                            )}
                            <Link href="/forum">
                                <Button type="button" variant="ghost">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting || missing.length > 0}>
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing…</>
                                    : <><Send className="w-4 h-4 mr-2" /> Publish thread</>}
                            </Button>
                        </div>
                    </div>

                </form>
              </ForumShell>

              <aside className="min-w-0">{preview}</aside>
            </div>
          </div>
        </div>
    );
}

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[var(--surface-0)] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

// Main page component wrapped in Suspense
export default function CreateThreadPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CreateThreadForm />
        </Suspense>
    );
}
