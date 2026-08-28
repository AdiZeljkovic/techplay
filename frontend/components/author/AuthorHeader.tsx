import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Calendar, Crown, PenLine, Shield, Globe, Twitter, Linkedin, Youtube, Instagram } from "lucide-react";
import type { AuthorProfile, AuthorStats } from "@/types";
import { isOwnUpload } from "@/lib/imageUrl";

interface AuthorHeaderProps {
    author: AuthorProfile;
    stats: AuthorStats;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }> = {
    "Editor-in-Chief": { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", Icon: Crown },
    "Editor":          { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  Icon: PenLine },
    "Journalist":      { color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/30", Icon: PenLine },
    "Moderator":       { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   Icon: Shield },
    "Admin":           { color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10", border: "border-[var(--accent)]/30", Icon: Crown },
    "Super Admin":     { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", Icon: Crown },
};

const STATS: Array<{ key: keyof AuthorStats; label: string }> = [
    { key: "total",   label: "Total" },
    { key: "news",    label: "News" },
    { key: "reviews", label: "Reviews" },
    { key: "tech",    label: "Tech" },
    { key: "guides",  label: "Guides" },
];

export default function AuthorHeader({ author, stats }: AuthorHeaderProps) {
    const roleConf = ROLE_CONFIG[author.role] ?? ROLE_CONFIG["Journalist"];
    const { color, bg, border, Icon: RoleIcon } = roleConf;

    return (
        <div className="relative overflow-hidden bg-[var(--surface-1)] border-b border-white/[0.07]">
            {/* Gradient background */}
            <div className="relative h-36 md:h-44">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/5 via-transparent to-[var(--surface-1)]" />
                <div className="absolute top-0 left-[10%] w-[60%] h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />
            </div>

            {/* Profile content */}
            <div className="container-page -mt-20 pb-8 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    {/* Avatar */}
                    <div className="shrink-0">
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-[var(--radius-panel)] border-2 border-[var(--accent)]/40 overflow-hidden bg-[var(--surface-2)]">
                            {author.avatar_url ? (
                                <Image
                                    src={author.avatar_url}
                                    alt={author.display_name}
                                    width={144}
                                    height={144}
                                    className="object-cover w-full h-full"
                                    unoptimized={!isOwnUpload(author.avatar_url)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--accent)]">
                                    {author.display_name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pb-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${color} ${bg} border ${border} mb-3`}>
                            <RoleIcon className="w-3 h-3" />
                            {author.role}
                        </span>

                        <h1 className="font-display text-[28px] md:text-[36px] font-black text-white leading-tight mb-1">
                            {author.display_name}
                        </h1>

                        {author.tagline && (
                            <p className="text-white/45 text-[15px] mb-3">{author.tagline}</p>
                        )}

                        {author.bio && (
                            <p className="text-white/35 text-[13px] leading-relaxed max-w-2xl mb-4 line-clamp-3">
                                {author.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                                Member since {author.joined_at}
                            </span>
                            <Link
                                href={`/profile/${author.username}`}
                                className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View gamer profile
                            </Link>
                        </div>

                        {/* Social links */}
                        {author.social_links && Object.values(author.social_links).some(Boolean) && (
                            <div className="flex items-center gap-2 mt-3">
                                {author.social_links.twitter && (
                                    <Link href={`https://x.com/${author.social_links.twitter}`} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
                                        aria-label="Twitter / X">
                                        <Twitter className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                                {author.social_links.linkedin && (
                                    <Link href={`https://linkedin.com/in/${author.social_links.linkedin}`} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
                                        aria-label="LinkedIn">
                                        <Linkedin className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                                {author.social_links.youtube && (
                                    <Link href={author.social_links.youtube} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
                                        aria-label="YouTube">
                                        <Youtube className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                                {author.social_links.instagram && (
                                    <Link href={`https://instagram.com/${author.social_links.instagram}`} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
                                        aria-label="Instagram">
                                        <Instagram className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                                {author.social_links.website && (
                                    <Link href={author.social_links.website} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-[var(--radius-card)] bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/35 hover:text-white hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all"
                                        aria-label="Website">
                                        <Globe className="w-3.5 h-3.5" />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats strip */}
                <div className="mt-6 grid grid-cols-5 gap-3">
                    {STATS.map(({ key, label }) => (
                        <div key={key} className="bg-[var(--surface-0)] border border-white/[0.07] rounded-[var(--radius-card)] px-3 py-3 text-center">
                            <span className="block text-[22px] font-black text-white font-display">{stats[key]}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
