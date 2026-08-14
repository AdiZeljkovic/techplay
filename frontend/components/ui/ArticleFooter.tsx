"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import SocialShare from "@/components/share/SocialShare";
import CommentsSection from "@/components/comments/CommentsSection";
import { isOwnUpload } from "@/lib/imageUrl";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
);

const SOCIAL_ICON_MAP: Record<string, { Icon: React.ComponentType<{ className?: string }>; label: string }> = {
    twitter_url:   { Icon: Twitter,     label: "Twitter" },
    facebook_url:  { Icon: Facebook,    label: "Facebook" },
    instagram_url: { Icon: Instagram,   label: "Instagram" },
    youtube_url:   { Icon: Youtube,     label: "YouTube" },
    discord_url:   { Icon: DiscordIcon, label: "Discord" },
};

interface ArticleFooterProps {
    author?: {
        username?: string;
        author_slug?: string;
        display_name?: string;
        avatar_url?: string;
        bio?: string;
    };
    tags: string[];
    shareUrl: string;
    shareTitle: string;
    shareDescription?: string;
    commentableId: number;
    commentableType: 'article' | 'review' | 'guide';
    initialComments?: any[];
}

export default function ArticleFooter({
    author, tags, shareUrl, shareTitle, shareDescription = "",
    commentableId, commentableType, initialComments,
}: ArticleFooterProps) {
    const { settings } = useSiteSettings();

    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({ ...SOCIAL_ICON_MAP[key], href: settings[key] || '#' }));

    const filteredTags = tags.filter(Boolean);

    return (
        <div className="mt-12">
            <div className="bg-[var(--surface-1)] border border-white/[0.07] rounded-[20px] overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-7 pb-6 text-center">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--accent)]/40" />
                        <span className="text-[var(--accent)] font-bold tracking-[0.22em] text-[11px] uppercase shrink-0">Stay Connected</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--accent)]/40" />
                    </div>
                </div>

                {/* Tags + Share row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-t border-white/[0.07]">
                    {filteredTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest shrink-0">Tags:</span>
                            {filteredTags.map((tag, i) => (
                                <span key={i} className="px-3 py-1 bg-[var(--surface-0)] border border-white/[0.07] hover:border-[var(--accent)]/40 hover:text-[var(--accent)] text-white/45 text-[12px] rounded-[var(--radius-card)] transition-all cursor-default">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-white/35 text-[11px] font-bold uppercase tracking-widest">Share:</span>
                        <SocialShare url={shareUrl} title={shareTitle} description={shareDescription} vertical={false} />
                    </div>
                </div>

                {/* Author + Follow row */}
                {author && (
                    <div className="flex items-start sm:items-center justify-between gap-4 px-5 py-5 border-t border-white/[0.07]">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <Link href={`/author/${author.author_slug || author.username || 'me'}`} aria-label={`${author.display_name || author.username || 'Author'} profile`} className="shrink-0">
                                {author.avatar_url ? (
                                    <Image
                                        src={author.avatar_url}
                                        alt={author.display_name || author.username || ''}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-[var(--accent)]/30 hover:border-[var(--accent)] transition-colors"
                                        unoptimized={!isOwnUpload(author.avatar_url)}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border-2 border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] font-bold text-[18px]">
                                        {(author.display_name || author.username || 'T').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 mb-0.5">The Author</span>
                                <Link href={`/author/${author.author_slug || author.username || 'me'}`} className="text-white font-bold text-[15px] hover:text-[var(--accent)] transition-colors leading-tight">
                                    {author.display_name || author.username}
                                </Link>
                                {author.bio && (
                                    <p className="text-white/35 text-[13px] leading-relaxed mt-1 line-clamp-2">{author.bio}</p>
                                )}
                                <Link href={`/author/${author.author_slug || author.username || 'me'}`} className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1 group w-max">
                                    View Author Page <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                                </Link>
                            </div>
                        </div>

                        {socialLinks.length > 0 && (
                            <div className="hidden sm:flex flex-col gap-2 items-end shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Follow Us</span>
                                <div className="flex items-center gap-1.5">
                                    {socialLinks.map((s, i) => (
                                        <Link key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                                            className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all duration-200">
                                            <s.Icon className="w-[14px] h-[14px]" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Comments */}
                <div className="border-t border-white/[0.07] px-5 py-8">
                    <CommentsSection
                        commentableId={commentableId}
                        commentableType={commentableType}
                        initialComments={initialComments}
                    />
                </div>
            </div>
        </div>
    );
}
