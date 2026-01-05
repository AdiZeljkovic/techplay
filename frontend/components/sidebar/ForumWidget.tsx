"use client";

import Link from "next/link";
import { MessagesSquare, MessageCircle, User } from "lucide-react";

const FORUM_TOPICS = [
    { title: "PC Build Advice: RTX 5080 or wait?", replies: 42, author: "TechGuru99" },
    { title: "Best settings for optimizing Windows 11 for gaming", replies: 128, author: "System32" },
    { title: "Anyone else disappointed with the new CoD?", replies: 256, author: "SniperWolf" },
    { title: "Official TechPlay Esport Tournament Discussion", replies: 89, author: "Admin" },
    { title: "Looking for squadmates - Helldivers 2", replies: 15, author: "FreedomFighter" },
];

export default function ForumWidget() {
    return (
        <div className="bg-[#00215E] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider">
                    <MessagesSquare className="w-4 h-4 text-[var(--accent)]" />
                    Active Discussions
                </h3>
            </div>

            <div className="divide-y divide-white/5">
                {FORUM_TOPICS.map((topic, idx) => (
                    <Link
                        key={idx}
                        href="#"
                        className="block p-4 hover:bg-white/5 transition-colors group"
                    >
                        <h4 className="text-sm font-semibold text-white/90 group-hover:text-[var(--accent)] transition-colors line-clamp-2 mb-2">
                            {topic.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-white/40">
                            <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                {topic.author}
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full">
                                <MessageCircle className="w-3 h-3 text-[var(--accent)]" />
                                {topic.replies}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link href="/forum" className="block py-3 text-center text-xs font-bold text-[var(--accent)] hover:text-white hover:bg-[var(--accent)] transition-all uppercase tracking-widest border-t border-white/5">
                Visit Forums
            </Link>
        </div>
    );
}
