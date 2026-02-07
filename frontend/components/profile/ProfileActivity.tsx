"use client";

import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileActivityProps {
    posts: any[];
}

export default function ProfileActivity({ posts }: ProfileActivityProps) {
    if (!posts || posts.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-xl text-[var(--text-muted)]">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {posts.slice(0, 5).map((post: any) => (
                <div
                    key={post.id}
                    className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] hover:border-[var(--accent)] transition-all"
                >
                    <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-[var(--text-muted)] mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-[var(--text-primary)] text-sm line-clamp-3">
                                &ldquo;{post.content?.replace(/<[^>]*>?/gm, "").substring(0, 150)}...&rdquo;
                            </p>
                            <div className="mt-2 text-xs text-[var(--text-muted)]">
                                Replied to a thread &bull; {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
