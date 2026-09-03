"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, FileText, Gamepad2, LifeBuoy, User as UserIcon } from "lucide-react";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";
import { decodeHtml } from "@/lib/decode";

interface SearchResult {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    image: string | null;
    category: string;
    category_slug: string;
    type: string;
    url: string;
}

/** What `/search/help` answers with — a different shape from the other three. */
interface HelpSearchRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    topic: string | null;
    topic_slug: string | null;
    /** Absolute, and the only one here that is: it leaves for help.techplay.gg. */
    url: string;
}

interface SearchDropdownProps {
    className?: string;
    placeholder?: string;
    isMobile?: boolean;
    onClose?: () => void;
    autoFocus?: boolean;
    /** Register Ctrl/⌘+K to focus the input and show a kbd hint chip. */
    hotkey?: boolean;
    /**
     * The homepage hero wears the same control at a different size — 52px tall
     * with a submit button on its end. A second component would have been a
     * traced copy of the debounce, the abort, the keyboard handling and the
     * click-outside; this is one prop instead.
     */
    variant?: "default" | "hero";
    /**
     * Where plain Enter goes when nothing in the list is highlighted.
     *
     * Without it Enter did nothing at all unless you had arrowed onto a row,
     * which is the wrong answer to a keypress in a search box. The hero passes
     * the catalogue; the header does not, and keeps its old behaviour.
     */
    seeAllHref?: (query: string) => string;
}

export default function SearchDropdown({ className, placeholder = "Search...", isMobile = false, onClose, autoFocus = false, hotkey = false, variant = "default", seeAllHref }: SearchDropdownProps) {
    const isHero = variant === "hero";
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    // Ctrl/⌘+K focuses the search field
    useEffect(() => {
        if (!hotkey) return;
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [hotkey]);

    // Debounced search with proper cleanup to prevent memory leaks
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const abortController = new AbortController();

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const [articlesRes, gamesRes, usersRes, helpRes] = await Promise.allSettled([
                    axios.get('/search/articles', { params: { q: query }, signal: abortController.signal }),
                    axios.get('/search/games', { params: { q: query }, signal: abortController.signal }),
                    axios.get('/search/users', { params: { q: query }, signal: abortController.signal }),
                    axios.get('/search/help', { params: { q: query }, signal: abortController.signal }),
                ]);
                // Only update state if not aborted
                if (!abortController.signal.aborted) {
                    const articles = articlesRes.status === 'fulfilled' ? (articlesRes.value.data.results || []) : [];
                    const games = gamesRes.status === 'fulfilled' ? (gamesRes.value.data.results || []) : [];
                    const users = usersRes.status === 'fulfilled' ? (usersRes.value.data.results || []) : [];

                    /*
                     * Help answers, and they go first.
                     *
                     * Somebody typing "steam not syncing" into the bar at the
                     * top of the site is exactly who the help centre was built
                     * for, and three unrelated news stories are what sends
                     * them to email instead. Putting help above the rest costs
                     * nothing on an ordinary query — a search for a game or a
                     * studio matches no help answer, so nothing moves — and it
                     * is the whole difference on the queries that do.
                     *
                     * The endpoint returns at most five, and the rows carry
                     * their topic so it is obvious what kind of result this is.
                     */
                    const help = (helpRes.status === 'fulfilled' ? (helpRes.value.data.results || []) : [])
                        .map((row: HelpSearchRow): SearchResult => ({
                            id: row.id,
                            title: row.title,
                            slug: row.slug,
                            excerpt: row.excerpt,
                            image: null,
                            category: row.topic ? `Help · ${row.topic}` : 'Help centre',
                            category_slug: row.topic_slug ?? 'help',
                            type: 'help',
                            url: row.url,
                        }));

                    setResults([...help, ...articles, ...games, ...users]);
                    setIsOpen(true);
                }
            } catch (error: any) {
                // Ignore abort errors, only log real failures
                if (error?.name !== 'CanceledError' && !abortController.signal.aborted) {
                    console.error("Search failed:", error);
                    setResults([]);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(timer);
            abortController.abort();
        };
    }, [query]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Enter is answered even with the list closed or empty — somebody who
        // typed a word and pressed return has asked for the full results, and
        // returning nothing is how a search box earns "it doesn't work".
        if (e.key === "Enter" && seeAllHref && selectedIndex < 0) {
            const q = query.trim();
            if (q.length >= 2) {
                e.preventDefault();
                navigateTo(seeAllHref(q));
            }
            return;
        }

        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    navigateTo(results[selectedIndex].url);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    const navigateTo = (url: string) => {
        setIsOpen(false);
        setQuery("");
        onClose?.();

        /*
         * A help answer lives on another hostname.
         *
         * `router.push` navigates inside this application's route tree; handed
         * an absolute URL to help.techplay.gg it has no route to match and the
         * click does nothing at all. Every other result here is a path, so
         * this branch is only ever taken by a help row.
         */
        if (/^https?:\/\//i.test(url)) {
            window.location.href = url;
            return;
        }

        router.push(url);
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Search Input */}
            <div className="relative group">
                <Search className={cn(
                    "absolute top-1/2 -translate-y-1/2 transition-colors pointer-events-none z-10",
                    isHero ? "w-4 h-4 left-4" : isMobile ? "w-5 h-5 left-4" : "w-4 h-4 left-3",
                    isLoading ? "text-[var(--accent)]" : "text-[var(--ink-faint)] group-focus-within:text-[var(--accent)]"
                )} />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full text-white focus:outline-none transition-all placeholder:text-[var(--ink-faint)]",
                        isHero
                            // The hero's own field: taller, translucent over the
                            // art behind it, and leaving room on the right for
                            // the submit button rather than a clear icon.
                            ? "h-[52px] rounded-[var(--radius-card)] bg-[var(--surface-0)]/70 backdrop-blur-sm border border-[var(--line-strong)] pl-10 pr-[104px] text-[14px] focus:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] focus:shadow-[var(--glow-accent)]"
                            : cn(
                                "bg-[var(--surface-2)] border border-[var(--line-strong)] focus:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] focus:ring-1 focus:ring-[var(--accent-soft)]",
                                isMobile
                                    ? "rounded-[var(--radius-card)] py-3 pl-12 pr-10 text-base"
                                    : "rounded-[var(--radius-card)] py-2 pl-9 pr-8 text-sm"
                            )
                    )}
                />

                {/* Loading/Clear button */}
                {(isLoading || query.length > 0) && (
                    <button
                        onClick={clearSearch}
                        type="button"
                        aria-label="Clear search"
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-white/45 hover:text-white transition-colors z-10",
                            isHero ? "right-[58px]" : isMobile ? "right-4" : "right-3"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                    </button>
                )}

                {/* The hero keeps its button. A dropdown answers the person who
                    types and waits; the button answers the one who types and
                    reaches for the obvious control, and on a phone that is the
                    same gesture as tapping "go". */}
                {isHero && (
                    <button
                        type="button"
                        aria-label="Search"
                        onClick={() => {
                            const q = query.trim();
                            if (q.length >= 2) navigateTo(seeAllHref ? seeAllHref(q) : `/games?search=${encodeURIComponent(q)}`);
                        }}
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 w-10 h-10 rounded-[var(--radius-inner)] bg-[var(--fill-2)] hover:bg-[var(--accent)] text-[var(--ink-low)] hover:text-white flex items-center justify-center transition-colors duration-300 z-10"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute z-50 bg-[var(--surface-2)] backdrop-blur-xl border border-white/[0.07] rounded-[var(--radius-card)] shadow-2xl overflow-hidden",
                            isHero || isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[min(400px,calc(100vw-2rem))]"
                        )}
                        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(220, 20, 60,0.1)" }}
                    >
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--accent)_60%,transparent)] to-transparent w-full" />
                        <div className="max-h-[400px] overflow-y-auto">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => navigateTo(result.url)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 text-left transition-colors",
                                        selectedIndex === index
                                            ? "bg-[var(--accent)]/20"
                                            : "hover:bg-[var(--fill-2)]"
                                    )}
                                >
                                    {/* Thumbnail */}
                                    {result.image ? (
                                        <img
                                            src={result.image}
                                            alt=""
                                            className="w-16 h-12 object-cover rounded-[var(--radius-card)] flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-12 bg-[var(--fill-3)] rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0">
                                            {result.type === 'game'
                                                ? <Gamepad2 className="w-5 h-5 text-white/45" />
                                                : result.type === 'user'
                                                    ? <UserIcon className="w-5 h-5 text-white/45" />
                                                    : result.type === 'help'
                                                        ? <LifeBuoy className="w-5 h-5 text-[var(--accent)]" />
                                                        : <FileText className="w-5 h-5 text-white/45" />}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm leading-tight line-clamp-2">
                                            {decodeHtml(result.title)}
                                        </p>
                                        <p className="text-xs text-[var(--accent)] uppercase tracking-wide mt-1">
                                            {decodeHtml(result.category)}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer.

                            The keyboard hint is for a keyboard. Where a
                            see-all destination exists it becomes a real row
                            instead — five suggestions are not the catalogue,
                            and a phone has no arrow keys to be told about. */}
                        {seeAllHref ? (
                            <button
                                type="button"
                                onClick={() => navigateTo(seeAllHref(query.trim()))}
                                className="w-full px-4 py-3 border-t border-[var(--line-strong)] bg-[var(--fill-2)] text-left text-[12.5px] font-semibold text-white/70 hover:text-white hover:bg-[var(--fill-3)] transition-colors"
                            >
                                See every result for <span className="text-[var(--accent)]">&ldquo;{query.trim()}&rdquo;</span>
                            </button>
                        ) : (
                            <div className="px-4 py-2 border-t border-[var(--line-strong)] bg-[var(--fill-2)]">
                                <p className="text-xs text-white/45 text-center">
                                    Press <kbd className="px-1 py-0.5 bg-[var(--fill-3)] rounded text-white/45">↵</kbd> to select,
                                    <kbd className="px-1 py-0.5 bg-[var(--fill-3)] rounded text-white/45 ml-1">↑↓</kbd> to navigate
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* No results */}
                {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute z-50 bg-[var(--surface-2)] backdrop-blur-xl border border-white/[0.07] rounded-[var(--radius-card)] shadow-2xl p-6 text-center",
                            isHero || isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[min(300px,calc(100vw-2rem))]"
                        )}
                        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
                    >
                        <Search className="w-8 h-8 text-white/30 mx-auto mb-2" />
                        <p className="text-white/45 text-sm">No results found for "{query}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
