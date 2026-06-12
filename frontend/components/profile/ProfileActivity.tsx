"use client";

import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileActivityProps {
    posts: any[];
}

export default function ProfileActivity({ posts }: ProfileActivityProps) {
    if (!posts || posts.length === 0) {
        return (
            <div className="p-10 text-center border border-dashed border-white/[0.06] rounded-xl text-white/30">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--accent)]/40 via-white/[0.06] to-transparent" />

            <div className="flex flex-col gap-4">
                {posts.slice(0, 5).map((post: any, i: number) => (
                    <div key={post.id} className="relative flex gap-4 pl-1">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-1.5">
                            <div
                                className={`w-[10px] h-[10px] rounded-full border-2 ${
                                    i === 0
                                        ? "bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_8px_rgba(252,65,0,0.4)]"
                                        : "bg-[var(--bg-secondary)] border-white/20"
                                }`}
                            />
                        </div>

                        {/* Content card */}
                        <div className="flex-1 glow-card rounded-xl bg-[var(--bg-card)] border border-white/[0.06] p-4 hover:border-white/10 transition-all">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-tp-accent/10 flex-shrink-0">
                                    <MessageSquare className="w-4 h-4 text-tp-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                                        {post.content?.replace(/<[^>]*>?/gm, "").substring(0, 150)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-white/30">
                                        <span>Forum reply</span>
                                        <span className="text-white/10">&bull;</span>
                                        <span suppressHydrationWarning>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
