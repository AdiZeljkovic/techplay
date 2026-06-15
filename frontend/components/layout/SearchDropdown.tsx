"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, FileText } from "lucide-react";
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

interface SearchDropdownProps {
    className?: string;
    placeholder?: string;
    isMobile?: boolean;
    onClose?: () => void;
    autoFocus?: boolean;
}

export default function SearchDropdown({ className, placeholder = "Search...", isMobile = false, onClose, autoFocus = false }: SearchDropdownProps) {
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
                const res = await axios.get('/search/articles', {
                    params: { q: query },
                    signal: abortController.signal
                });
                // Only update state if not aborted
                if (!abortController.signal.aborted) {
                    setResults(res.data.results || []);
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
                    "absolute top-1/2 -translate-y-1/2 transition-colors pointer-events-none",
                    isMobile ? "w-5 h-5 left-4" : "w-4 h-4 left-3",
                    isLoading ? "text-tp-accent" : "text-[#4B5563] group-focus-within:text-tp-accent"
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
                        "w-full bg-[#0D1117] border border-white/[0.1] text-white focus:outline-none focus:border-tp-accent focus:ring-1 focus:ring-tp-accent/50 transition-all placeholder:text-[#4B5563]",
                        isMobile
                            ? "rounded-xl py-3 pl-12 pr-10 text-base"
                            : "rounded-lg py-2 pl-9 pr-8 text-sm"
                    )}
                />

                {/* Loading/Clear button */}
                {(isLoading || query.length > 0) && (
                    <button
                        onClick={clearSearch}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors",
                            isMobile ? "right-4" : "right-3"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
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
                            "absolute z-50 bg-[#0D1117] backdrop-blur-xl border border-white/[0.07] rounded-xl shadow-2xl overflow-hidden",
                            isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[min(400px,calc(100vw-2rem))]"
                        )}
                        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(252,65,0,0.1)" }}
                    >
                        <div className="h-[2px] bg-gradient-to-r from-tp-accent/80 to-tp-accent/20 w-full" />
                        <div className="max-h-[400px] overflow-y-auto">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => navigateTo(result.url)}
                                    className={cn(
                                        "w-full flex items-start gap-3 p-3 text-left transition-colors",
                                        selectedIndex === index
                                            ? "bg-[var(--accent)]/20"
                                            : "hover:bg-white/5"
                                    )}
                                >
                                    {/* Thumbnail */}
                                    {result.image ? (
                                        <img
                                            src={result.image}
                                            alt=""
                                            className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-gray-400" />
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

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                            <p className="text-xs text-gray-400 text-center">
                                Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-400">↵</kbd> to select,
                                <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-400 ml-1">↑↓</kbd> to navigate
                            </p>
                        </div>
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
                            "absolute z-50 bg-[#0D1117] backdrop-blur-xl border border-white/[0.07] rounded-xl shadow-2xl p-6 text-center",
                            isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[min(300px,calc(100vw-2rem))]"
                        )}
                        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
                    >
                        <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No results found for "{query}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
