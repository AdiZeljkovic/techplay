"use client";

import { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { AlertTriangle, MessageSquare, Search, X } from "lucide-react";
import ForumShell from "@/components/forum/ForumShell";
import ThreadRow, { ThreadRowHeader, type ThreadRowData } from "@/components/forum/ThreadRow";
import { decodeHtml } from "@/lib/decode";

const fetcher = (url: string) => axios.get(url);

interface SearchResult {
    threads: (ThreadRowData & { category: { name: string; slug: string } })[];
    posts: {
        id: number;
        content: string;
        thread: { id: number; title: string; slug: string };
        author: { username: string };
        created_at: string;
    }[];
    query: string;
}

/**
 * A snippet around the match, rather than the first line of the post.
 *
 * Results used to be title-only, so nothing on the page explained why a given
 * thread was an answer to what you typed. Content arrives as HTML from the
 * editor; it is reduced to text here and only text is rendered.
 */
function snippet(html: string, query: string, span = 190): { before: string; hit: string; after: string } {
    const text = decodeHtml(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    const at = text.toLowerCase().indexOf(query.toLowerCase());

    if (at < 0 || !query) {
        return { before: text.slice(0, span) + (text.length > span ? "…" : ""), hit: "", after: "" };
    }

    const from = Math.max(0, at - Math.floor(span / 3));
    const to = Math.min(text.length, at + query.length + Math.floor((span * 2) / 3));

    return {
        before: (from > 0 ? "…" : "") + text.slice(from, at),
        hit: text.slice(at, at + query.length),
        after: text.slice(at + query.length, to) + (to < text.length ? "…" : ""),
    };
}

function ForumSearchResults() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const q = searchParams.get("q") || "";
    const board = searchParams.get("category") || "";
    const author = searchParams.get("author") || "";
    const since = searchParams.get("since") || "";

    const [typed, setTyped] = useState(q);
    const [boardDraft, setBoardDraft] = useState(board);
    const [authorDraft, setAuthorDraft] = useState(author);
    const [sinceDraft, setSinceDraft] = useState(since);

    // The boards, so narrowing by one is a list rather than a slug to remember.
    const { data: boards } = useSWR<{ slug: string; name: string; children?: { slug: string; name: string }[] }[]>(
        "/forum/categories",
        (url: string) => axios.get(url).then((r) => r.data)
    );
    const boardOptions = (boards ?? []).flatMap((b) => (b.children?.length ? b.children : [b]));
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => { setTyped(q); }, [q]);
    useEffect(() => { setBoardDraft(board); setAuthorDraft(author); setSinceDraft(since); }, [board, author, since]);

    useEffect(() => {
        if (!q || q.length < 3) {
            // Leaving the old rows on screen under a new query read as if they
            // were results for it.
            setResults(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setHasError(false);
        const params = new URLSearchParams({ q });
        if (board) params.set("category", board);
        if (author) params.set("author", author);
        if (since) params.set("since", since);

        fetcher(`/forum/search?${params.toString()}`)
            .then((res) => setResults(res.data))
            .catch(() => setHasError(true))
            .finally(() => setIsLoading(false));
    }, [q, board, author, since]);

    /** One place that builds the URL, so every control agrees on its shape. */
    const go = (next: { q?: string; category?: string; author?: string; since?: string }) => {
        const params = new URLSearchParams();
        const query = (next.q ?? typed).trim();
        if (query.length < 3) return;

        params.set("q", query);
        const cat = next.category ?? boardDraft;
        const who = next.author ?? authorDraft;
        const when = next.since ?? sinceDraft;
        if (cat) params.set("category", cat);
        if (who.trim()) params.set("author", who.trim());
        if (when) params.set("since", when);

        router.push(`/forum/search?${params.toString()}`);
    };

    const threads = results?.threads ?? [];
    const posts = results?.posts ?? [];
    const total = threads.length + posts.length;

    return (
        <ForumShell
            crumbs={[{ label: "Forum", href: "/forum" }, { label: "Search" }]}
            title="Search the boards"
            description={q ? `Threads and posts matching “${q}”.` : "Find a thread, or a reply inside one."}
            stats={q && results ? [
                { label: "Threads", value: threads.length },
                { label: "Posts", value: posts.length },
            ] : undefined}
        >
            {/* The search page had no search field. Refining a query meant going
                back to wherever you came from and typing it again. */}
            <form
                role="search"
                onSubmit={(e) => { e.preventDefault(); go({}); }}
                className="mb-4 flex gap-2"
            >
                <label htmlFor="forum-search" className="sr-only">Search the forum</label>
                <span className="relative flex-1">
                    <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-faint)]" strokeWidth={1.6} />
                    <input
                        id="forum-search"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder="Search threads and posts…"
                        className="h-11 w-full rounded-[var(--radius-card)] border border-[var(--line-strong)] bg-[var(--surface-2)] pl-10 pr-3 text-white outline-none transition-colors focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                    />
                </span>
                <button
                    type="submit"
                    disabled={typed.trim().length < 3}
                    className="btn-command inline-flex h-11 items-center px-5 bg-[var(--accent)] font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-40"
                >
                    Search
                </button>
            </form>

            {/* Without these the only way to narrow a search was to think of a
                rarer word, which is guessing rather than searching. */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
                <select
                    aria-label="Board"
                    value={boardDraft}
                    onChange={(e) => { setBoardDraft(e.target.value); go({ category: e.target.value }); }}
                    className="h-9 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-3 text-[12.5px] text-white outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                >
                    <option value="">Every board</option>
                    {boardOptions.map((b) => (
                        <option key={b.slug} value={b.slug}>{b.name}</option>
                    ))}
                </select>

                <select
                    aria-label="Posted within"
                    value={sinceDraft}
                    onChange={(e) => { setSinceDraft(e.target.value); go({ since: e.target.value }); }}
                    className="h-9 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-3 text-[12.5px] text-white outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                >
                    <option value="">Any time</option>
                    <option value="day">Past day</option>
                    <option value="week">Past week</option>
                    <option value="month">Past month</option>
                    <option value="year">Past year</option>
                </select>

                <input
                    aria-label="Posted by"
                    value={authorDraft}
                    onChange={(e) => setAuthorDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") go({ author: authorDraft }); }}
                    onBlur={() => { if (authorDraft !== author) go({ author: authorDraft }); }}
                    placeholder="Posted by…"
                    className="h-9 w-[150px] rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-1)] px-3 text-[12.5px] text-white placeholder:text-[var(--ink-faint)] outline-none focus:border-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                />

                {(board || author || since) && (
                    <button
                        type="button"
                        onClick={() => { setBoardDraft(""); setAuthorDraft(""); setSinceDraft(""); go({ category: "", author: "", since: "" }); }}
                        className="inline-flex items-center gap-1 text-[11.5px] text-[var(--ink-faint)] transition-colors hover:text-[var(--accent-ink)]"
                    >
                        <X className="h-3 w-3" /> Clear filters
                    </button>
                )}
            </div>

            {q && q.length < 3 && (
                <p className="text-[12.5px] text-[var(--ink-faint)]">Type at least three characters.</p>
            )}

            {isLoading && (
                <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)]">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3.5 py-3.5 animate-pulse">
                            <span className="h-8 w-8 shrink-0 rounded-[var(--radius-inner)] bg-white/[0.05]" />
                            <span className="flex-1 space-y-2">
                                <span className="block h-3 w-2/5 rounded bg-white/[0.05]" />
                                <span className="block h-2.5 w-1/4 rounded bg-white/[0.035]" />
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {hasError && (
                <div className="flex items-center gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] px-4 py-4">
                    <AlertTriangle aria-hidden className="h-5 w-5 shrink-0 text-[var(--accent)]" strokeWidth={1.6} />
                    <p className="text-[13px] text-[var(--ink-mid)]">Search is not answering right now. Try again in a moment.</p>
                </div>
            )}

            {!isLoading && !hasError && q.length >= 3 && total === 0 && (
                <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-1)] px-5 py-10 text-center">
                    <MessageSquare aria-hidden className="mx-auto h-7 w-7 text-white/12" strokeWidth={1.4} />
                    <p className="mt-3 font-display text-[14px] font-bold text-white">Nothing matched “{q}”</p>
                    <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">Try a shorter phrase, or a different word.</p>
                </div>
            )}

            {threads.length > 0 && (
                <section className="mb-6">
                    <h2 className="mb-2 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                        Threads
                    </h2>
                    <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] overflow-hidden">
                        <ThreadRowHeader showCategory />
                        <div className="divide-y divide-[var(--line)]">
                            {threads.map((t) => (
                                <ThreadRow key={t.id} thread={t} showCategory />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {posts.length > 0 && (
                <section>
                    <h2 className="mb-2 font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                        Inside replies
                    </h2>
                    <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-1)] divide-y divide-[var(--line)] overflow-hidden">
                        {posts.map((p) => {
                            const s = snippet(p.content, q);
                            return (
                                <Link
                                    key={p.id}
                                    href={`/forum/thread/${p.thread.slug}?post=${p.id}#post-${p.id}`}
                                    className="block px-3.5 py-3 hover:bg-white/[0.025] transition-colors"
                                >
                                    <span className="block truncate font-display text-[13px] font-bold text-white">
                                        {decodeHtml(p.thread.title)}
                                    </span>
                                    <span className="mt-1 block text-[12.5px] leading-relaxed text-[var(--ink-low)]">
                                        {s.before}
                                        {s.hit && <mark className="rounded-[3px] bg-[var(--accent-soft)] px-0.5 text-[var(--accent-ink)]">{s.hit}</mark>}
                                        {s.after}
                                    </span>
                                    <span className="mt-1 block text-[11px] text-[var(--ink-faint)]">
                                        {p.author?.username}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </ForumShell>
    );
}

export default function ForumSearchPage() {
    return (
        <Suspense fallback={null}>
            <ForumSearchResults />
        </Suspense>
    );
}
