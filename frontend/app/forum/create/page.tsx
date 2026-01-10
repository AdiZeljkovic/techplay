"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Category {
    id: number;
    name: string;
    slug: string;
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
            setError("Please fill in all fields.");
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

            // Redirect to the new thread
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
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <AlertCircle className="w-16 h-16 text-[var(--accent)]" />
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Login Required</h1>
                <p className="text-[var(--text-secondary)]">You must be logged in to create a thread.</p>
                <Link href="/login">
                    <Button>Go to Login</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="container mx-auto px-4 py-6">
                    <Link
                        href="/forum"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Forums
                    </Link>

                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Create New Thread</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Start a new discussion in the community.</p>
                </div>
            </div>

            {/* Form */}
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Category Select */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={categoryId || ""}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                            required
                        >
                            <option value="">Select a category...</option>
                            {allCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Thread Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a descriptive title for your thread..."
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
                            maxLength={255}
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1 text-right">
                            {title.length}/255
                        </p>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write the main content of your thread here. Be descriptive and clear..."
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-gray-500 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all min-h-[250px] resize-y"
                            required
                        />
                    </div>

                    {/* Guidelines */}
                    <div className="bg-[var(--bg-elevated)]/50 border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-secondary)]">
                        <h4 className="font-semibold text-[var(--text-primary)] mb-2">Posting Guidelines</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Be respectful and constructive in your discussions.</li>
                            <li>Post in the correct category to help others find your thread.</li>
                            <li>Use a clear, descriptive title.</li>
                            <li>No spam, self-promotion, or offensive content.</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Link href="/forum">
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !content.trim() || !categoryId}
                            className="shadow-lg shadow-[var(--accent)]/20"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Create Thread
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Loading fallback for Suspense
function LoadingFallback() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
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
