"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, AlertCircle, FileText, Hash, AlignLeft, Sparkles } from "lucide-react";
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

    const { user, isLoading: authLoading } = useAuth({ middleware: 'auth' });

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [categoryId, setCategoryId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                category_id: categoryId
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
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-6 p-4">
                <div className="w-24 h-24 bg-[var(--bg-card)] rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-[var(--accent)]" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Login Required</h1>
                    <p className="text-[var(--text-secondary)] mb-6">You must be logged in to create a thread.</p>
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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-8">
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[var(--accent)] to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                            <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Create New Thread</h1>
                            <p className="text-[var(--text-secondary)]">Start a new discussion in the community</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Author Preview */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[var(--accent)]">
                                    {user.avatar_url ? (
                                        <Image src={user.avatar_url} alt={user.username} width={48} height={48} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[var(--accent)] text-white font-bold text-lg">
                                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-[var(--text-muted)]">Posting as</div>
                                    <div className="font-bold text-[var(--text-primary)]">{user.username}</div>
                                </div>
                            </div>

                            {/* Category Select */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                    <Hash className="w-4 h-4 text-[var(--accent)]" />
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {preselectedCategory && selectedCategory ? (
                                    // Locked View
                                    <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] flex items-center justify-between opacity-80 cursor-not-allowed">
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
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer appearance-none"
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
                                    <p className="mt-2 text-sm text-[var(--text-muted)]">{selectedCategory.description}</p>
                                )}
                            </div>

                            {/* Title */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                                    Thread Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a clear, descriptive title..."
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-lg"
                                    maxLength={255}
                                    required
                                />
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs text-[var(--text-muted)]">Make it specific and searchable</span>
                                    <span className={`text-xs ${title.length > 220 ? 'text-yellow-500' : 'text-[var(--text-muted)]'}`}>
                                        {title.length}/255
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                                    <AlignLeft className="w-4 h-4 text-[var(--accent)]" />
                                    Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Share your thoughts, questions, or ideas..."
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-4 text-[var(--text-primary)] placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all min-h-[250px] resize-y leading-relaxed"
                                    required
                                />
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
                                    className="w-full sm:w-auto shadow-lg shadow-[var(--accent)]/20"
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
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-6">
                            <h4 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                                Posting Tips
                            </h4>
                            <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
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
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
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
