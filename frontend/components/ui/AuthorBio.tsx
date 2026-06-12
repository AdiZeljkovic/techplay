"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { decodeHtml } from "@/lib/decode";

interface AuthorBioProps {
    author?: {
        username?: string;
        display_name?: string;
        avatar_url?: string;
        bio?: string;
    };
    fallbackBio?: string;
}

/**
 * Author bio panel displayed at the end of articles, reviews and guides.
 */
export default function AuthorBio({ author, fallbackBio = "TechPlay editor and gaming enthusiast. Covering the latest in technology, esports, and hardware reviews." }: AuthorBioProps) {
    const displayName = decodeHtml(author?.display_name || author?.username || "The Author");

    return (
        <div className="mt-12 relative overflow-hidden bg-[#0B0E14]/80 backdrop-blur-md border border-[#161B22] rounded-[24px] p-6 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            {/* Orange accent hairline + glow */}
            <div className="absolute top-0 left-[10%] w-[50%] h-[1px] bg-gradient-to-r from-transparent via-[#FC4100]/40 to-transparent" />
            <div className="absolute -top-[100px] -left-[50px] w-[250px] h-[250px] bg-[#FC4100]/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                {/* Avatar */}
                <Link href={`/profile/${author?.username}`} className="shrink-0 group/avatar">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#161B22] ring-2 ring-tp-accent/30 group-hover/avatar:ring-tp-accent transition-all bg-[#1A1F26]">
                        {author?.avatar_url ? (
                            <Image
                                src={author.avatar_url}
                                alt={displayName}
                                width={80}
                                height={80}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-tp-accent">
                                {author?.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </Link>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <span className="text-tp-accent font-bold tracking-[0.15em] text-[10px] uppercase mb-1.5 block">
                        THE AUTHOR
                    </span>
                    <Link href={`/profile/${author?.username}`} className="inline-block group">
                        <h3 className="font-display text-[20px] font-bold text-white mb-2 group-hover:text-tp-accent transition-colors">
                            {displayName}
                        </h3>
                    </Link>
                    <p className="text-[#A1A1AA] text-[14px] leading-relaxed mb-4">
                        {decodeHtml(author?.bio || "") || fallbackBio}
                    </p>
                    <Link
                        href={`/profile/${author?.username}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-tp-accent hover:text-tp-accent-hover uppercase tracking-wider transition-colors group/link"
                    >
                        VIEW FULL PROFILE
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
