"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, AlertCircle, FileText, Hash, AlignLeft, Sparkles, Tag as TagIcon, X, Gamepad2, Search, Loader2 } from "lucide-react";
import { getAvatarSrc } from "@/lib/forum";

// PERF: Dynamic import for heavy editor (~50KB+ with Tiptap extensions)
const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
    loading: () => <div className="h-64 bg-white/[0.03] rounded-[var(--radius-card)] animate-pulse" />,
    ssr: false
});
import useSWR from "swr";
import ForumSidebar from "@/components/forum/ForumSidebar";

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

    const { user, isLoading: authLoading } = useAuth({ middleware: 'auth' });

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
        setTags(tags.filter(t => t !== tag));
    };

    // Fetch forum categories for dropdown
    const { data: categoriesData } = useSWR<Category[]>('/forum/categories', fetcher);

    // Flatten categories (they come as parent -> children structure)
    const allCategories = categoriesData?.flatMap(parent =>
        parent.children ? parent.children : [parent]
    ) || [];

    // Preselect category from URL
    useEffect(() => {
        if (preselectedCategory && allCategories.length > 0) {
            const found = allCategories.find(c => c.slug === preselectedCategory);
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
            const response = await axios.post('/forum/threads', {
                title: title.trim(),
                content: content.trim(),
                category_id: categoryId,
                tags: tags.length > 0 ? tags : undefined,
                game_id: selectedGame?.id,
            });

            router.push(`/forum/thread/${response.data.slug}`);
        } catch (err: any) {
            console.error("Failed to create thread:", err);
            setError(err.response?.data?.message || "Failed to create thread. Please try again.");
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
            <div className="min-h-screen bg-[var(--surface-0)] flex flex-col items-center justify-center gap-6 p-4">
                <div className="w-24 h-24 bg-[var(--surface-1)] rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-[var(--accent)]" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Login Required</h1>
                    <p className="text-white/45 mb-6">You must be logged in to create a thread.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/login">
                        <Button variant="outline">Log In</Button>
                    </Link>
                    <Link href="/register">
                        <Button>Sign Up</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const selectedCategory = allCategories.find(c => c.id === categoryId);
    const userAvatar = getAvatarSrc(user.avatar_url);

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            {/* Header */}
            <div className="bg-[var(--surface-1)] border-b border-white/[0.07]">
                <div className="container-page py-8">
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-white/35 hover:text-[var(--accent)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[var(--accent)] rounded-[var(--radius-panel)] flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Create New Thread</h1>
                            <p className="text-white/45">Start a new discussion in the community</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container-page py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-[var(--radius-panel)] p-4 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Author Preview */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[var(--accent)]">
                                    {userAvatar ? (
                                        <Image src={userAvatar} alt={user.username} width={48} height={48} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white font-bold text-lg">
                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-white/35">Posting as</div>
                                    <div className="font-bold text-white">{user.username}</div>
                                </div>
                            </div>

                            {/* Category Select */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                                    <Hash className="w-4 h-4 text-[var(--accent)]" />
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {preselectedCategory && selectedCategory ? (
                                    // Locked View
                                    <div className="w-full border border-white/[0.07] rounded-[var(--radius-card)] px-4 py-3 text-white flex items-center justify-between opacity-80 cursor-not-allowed">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{selectedCategory.name}</span>
                                            <span className="text-xs bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full border border-[var(--accent)]/20">
                                                Locked
                                            </span>
                                        </div>
                                        {/* Hidden input to ensure value submits if needed, though state is handled */}
                                    </div>
                                ) : (
                                    // Select View
                                    <select
                                        value={categoryId || ""}
                                        onChange={(e) => setCategoryId(Number(e.target.value))}
                                        className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-card)] px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer appearance-none"
                                        required
                                    >
                                        <option value="">Select a category...</option>
                                        {allCategories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {selectedCategory?.description && (
                                    <p className="mt-2 text-sm text-white/35">{selectedCategory.description}</p>
                                )}
                            </div>

                            {/* Title */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                                    Thread Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a clear, descriptive title..."
                                    className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-card)] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-lg"
                                    maxLength={255}
                                    required
                                />
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs text-white/35">Make it specific and searchable</span>
                                    <span className={`text-xs ${title.length > 220 ? 'text-yellow-500' : 'text-white/35'}`}>
                                        {title.length}/255
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                                    <AlignLeft className="w-4 h-4 text-[var(--accent)]" />
                                    Content <span className="text-red-500">*</span>
                                </label>
                                <RichTextEditor
                                    content={content}
                                    onChange={setContent}
                                    placeholder="Share your thoughts, questions, or ideas..."
                                    minHeight="250px"
                                />
                            </div>

                            {/* Tags */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                                    <TagIcon className="w-4 h-4 text-[var(--accent)]" />
                                    Tags <span className="text-white/35 font-normal normal-case">(optional, up to 5)</span>
                                </label>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove tag ${tag}`}>
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                {tags.length < 5 && (
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === ",") {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        onBlur={addTag}
                                        placeholder="Type a tag and press Enter..."
                                        className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-card)] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                                    />
                                )}
                            </div>

                            {/* Link a Game */}
                            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                                    <Gamepad2 className="w-4 h-4 text-[var(--accent)]" />
                                    Link a Game <span className="text-white/35 font-normal normal-case">(optional)</span>
                                </label>
                                {selectedGame ? (
                                    <div className="flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-card)] bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                                        <span className="text-sm font-medium text-white">{selectedGame.name}</span>
                                        <button type="button" onClick={() => setSelectedGame(null)} aria-label="Remove linked game">
                                            <X className="w-4 h-4 text-[var(--accent)]" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input
                                            type="text"
                                            value={gameSearch}
                                            onChange={(e) => setGameSearch(e.target.value)}
                                            placeholder="Search for a game to discuss..."
                                            className="w-full border border-white/[0.07] bg-white/[0.02] rounded-[var(--radius-card)] pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                                        />
                                        {gameSearch.trim().length >= 2 && (
                                            <div className="mt-2 max-h-56 overflow-y-auto rounded-[var(--radius-card)] border border-white/[0.07] bg-[var(--surface-1)]">
                                                {gameSearchLoading ? (
                                                    <div className="flex items-center justify-center py-4 text-white/35">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    </div>
                                                ) : (gameResults?.results?.length ?? 0) === 0 ? (
                                                    <p className="text-xs text-white/35 text-center py-4">No games found.</p>
                                                ) : (
                                                    gameResults.results.map((g: { id: number; name: string; slug: string }) => (
                                                        <button
                                                            key={g.id}
                                                            type="button"
                                                            onClick={() => { setSelectedGame({ id: g.id, name: g.name }); setGameSearch(""); }}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/[0.04] transition-colors"
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

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                                <Link href="/forum">
                                    <Button type="button" variant="ghost" className="w-full sm:w-auto">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
                                    className="w-full sm:w-auto"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Creating Thread...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Publish Thread
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Guidelines */}
                        <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-panel)] p-6 mb-4">
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                Posting Tips
                            </h4>
                            <ul className="space-y-3 text-sm text-white/45">
                                <li className="flex gap-2">
                                    <span className="text-[var(--accent)] font-bold">•</span>
                                    <span>Use a clear, specific title</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[var(--accent)] font-bold">•</span>
                                    <span>Choose the right category</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[var(--accent)] font-bold">•</span>
                                    <span>Be respectful and constructive</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[var(--accent)] font-bold">•</span>
                                    <span>Search before posting duplicates</span>
                                </li>
                            </ul>
                        </div>

                        <ForumSidebar />
                    </div>
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
