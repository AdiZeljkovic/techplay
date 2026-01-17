"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, FileText } from "lucide-react";
import axios from "@/lib/axios";
import { cn } from "@/lib/utils";

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
}

export default function SearchDropdown({ className, placeholder = "Search...", isMobile = false }: SearchDropdownProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await axios.get('/search/articles', { params: { q: query } });
                setResults(res.data.results || []);
                setIsOpen(true);
            } catch (error) {
                console.error("Search failed:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
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
                    "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                    isMobile ? "w-5 h-5 left-4" : "w-4 h-4",
                    isLoading ? "text-[var(--accent)]" : "text-gray-500 group-focus-within:text-[var(--accent)]"
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
                        "bg-[#1e293b] border border-[#334155] text-gray-300 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-gray-600",
                        isMobile
                            ? "w-full rounded-xl py-3 pl-12 pr-10 text-white"
                            : "w-56 rounded-full py-2 pl-10 pr-8 text-sm"
                    )}
                />

                {/* Loading/Clear button */}
                {(isLoading || query.length > 0) && (
                    <button
                        onClick={clearSearch}
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors",
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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "absolute z-50 bg-[#001540]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden",
                            isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[400px]"
                        )}
                        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
                    >
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
                                            <FileText className="w-5 h-5 text-gray-500" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm leading-tight line-clamp-2">
                                            {result.title}
                                        </p>
                                        <p className="text-xs text-[var(--accent)] uppercase tracking-wide mt-1">
                                            {result.category}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                            <p className="text-xs text-gray-500 text-center">
                                Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-400">↵</kbd> to select,
                                <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-400 ml-1">↑↓</kbd> to navigate
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* No results */}
                {isOpen && query.length >= 2 && !isLoading && results.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "absolute z-50 bg-[#001540]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-6 text-center",
                            isMobile ? "left-0 right-0 mt-2" : "left-0 mt-2 w-[300px]"
                        )}
                    >
                        <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No results found for "{query}"</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
