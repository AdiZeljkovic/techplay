import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, Mail, Shield, FileText, Globe, Phone, Sparkles, Crown, PenTool, Newspaper } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Panel from "@/components/ui/Panel";

/**
 * Impressum — publisher details, the masthead, and the legal links.
 *
 * The old version graded the accent by rank: a full-strength border for the
 * Editor-in-Chief, 60% for editors, 40% for journalists, 30% for moderators.
 * Read as a page it just looked like the CSS was fading out. Rank is a label
 * here, said in words, and every card gets the same surface.
 *
 * A server component: the staff list arrives as a prop and nothing on the page
 * reacts to anything.
 */

interface StaffMember {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    role: string;
    joined_at: string;
}

interface StaffData {
    [key: string]: StaffMember[];
}

const SECTIONS: { key: string; label: string; icon: typeof Crown; featured?: boolean; cols: string }[] = [
    { key: "Editor-in-Chief", label: "Editor-in-Chief", icon: Crown, featured: true, cols: "sm:grid-cols-2 lg:grid-cols-3" },
    { key: "Editor", label: "Editors", icon: PenTool, cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" },
    { key: "Journalist", label: "Journalists", icon: Newspaper, cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" },
    { key: "Moderator", label: "Community Moderators", icon: Shield, cols: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" },
];

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function TeamMemberCard({ member, featured = false }: { member: StaffMember; featured?: boolean }) {
    return (
        <Link
            href={`/profile/${member.username}`}
            className="group flex flex-col items-center text-center rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
        >
            <span className={`relative ${featured ? "w-20 h-20" : "w-16 h-16"} mb-3.5 rounded-full overflow-hidden bg-[var(--fill-2)] border border-[var(--line-strong)]`}>
                {member.avatar_url ? (
                    <Image
                        unoptimized
                        src={member.avatar_url}
                        alt={member.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center font-display text-[15px] font-black text-[var(--ink-low)]">
                        {initials(member.name)}
                    </span>
                )}
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                {member.role}
            </span>
            <span className="mt-1 font-display text-[13.5px] font-bold text-[var(--ink-hi)] group-hover:text-[var(--accent)] transition-colors duration-300">
                {member.name}
            </span>

            {featured && member.bio && (
                <span className="mt-2 text-[12px] text-[var(--ink-low)] leading-snug line-clamp-2">{member.bio}</span>
            )}

            <span className="mt-2 text-[11px] text-[var(--ink-faint)]">Since {member.joined_at}</span>
        </Link>
    );
}

export default function ImpressumClient({ staff }: { staff: StaffData | null }) {
    return (
        <main className="min-h-screen bg-[var(--surface-0)]">
            <PageHero
                title="Impressum"
                description="Who publishes TechPlay, who writes it, and how to reach us."
                iconNode={<Building2 className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.75} />}
            />

            <div className="container-page py-10 md:py-14 space-y-10 md:space-y-14">
                <section className="tp-fade-up tp-d1 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
                    <Panel title="Publisher & owner" variant="console">
                        <h3 className="font-display text-[22px] font-black uppercase tracking-tight text-[var(--ink-hi)]">
                            Luminor Solutions
                        </h3>
                        <p className="mt-1 text-[13px] text-[var(--ink-low)]">Digital Media &amp; Technology Agency</p>
                        <p className="mt-3.5 text-[13px] text-[var(--ink-mid)] leading-relaxed max-w-xl">
                            Luminor Solutions is the company behind TechPlay.gg. We handle the business side — hosting,
                            legal compliance, partnerships — so our editorial team can focus on what matters: creating
                            great content.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px]">
                            <span className="flex items-center gap-2 text-[var(--ink-low)]">
                                <MapPin className="w-4 h-4 text-[var(--ink-faint)]" />
                                Sarajevo, Bosnia and Herzegovina
                            </span>
                            <a
                                href="https://luminor.solutions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[var(--accent)] hover:underline"
                            >
                                <Globe className="w-4 h-4" />
                                luminor.solutions
                            </a>
                        </div>
                    </Panel>

                    <Panel title="Contact us">
                        <div className="space-y-2.5">
                            {[
                                { icon: Mail, label: "Email", value: "redakcija@techplay.gg", href: "mailto:redakcija@techplay.gg" },
                                { icon: Phone, label: "Phone", value: "+387 62 574 783", href: "tel:+38762574783" },
                            ].map((row) => (
                                <a
                                    key={row.label}
                                    href={row.href}
                                    className="group flex items-center gap-3.5 rounded-[var(--radius-inner)] border border-[var(--line)] p-3.5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] transition-colors duration-300"
                                >
                                    <span className="inline-flex w-9 h-9 shrink-0 rounded-[var(--radius-inner)] bg-[var(--fill-2)] text-[var(--accent)] items-center justify-center">
                                        <row.icon className="w-4 h-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{row.label}</span>
                                        <span className="block text-[13px] text-[var(--ink-hi)] group-hover:text-[var(--accent)] transition-colors duration-300 truncate">
                                            {row.value}
                                        </span>
                                    </span>
                                </a>
                            ))}
                        </div>
                    </Panel>
                </section>

                {SECTIONS.map((section, i) => {
                    const members = staff?.[section.key] ?? [];
                    if (members.length === 0) return null;

                    return (
                        <section key={section.key} className={`tp-fade-up tp-d${Math.min(i + 2, 6)}`}>
                            <h2 className="flex items-center gap-2.5 mb-5 font-display text-[15px] font-bold uppercase tracking-[0.12em] text-[var(--ink-hi)]">
                                <section.icon className="w-4 h-4 text-[var(--accent)]" />
                                {section.label}
                            </h2>
                            <div className={`grid ${section.cols} gap-4`}>
                                {members.map((member) => (
                                    <TeamMemberCard key={member.id} member={member} featured={section.featured} />
                                ))}
                            </div>
                        </section>
                    );
                })}

                <section className="tp-fade-up tp-d6 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-[var(--line)] p-6 text-center">
                    <Sparkles className="w-6 h-6 text-[var(--accent)] mx-auto mb-3" />
                    <h3 className="font-display text-[15px] font-bold uppercase tracking-wider text-[var(--ink-hi)] mb-2">
                        Want to join the team?
                    </h3>
                    <p className="mx-auto max-w-2xl text-[13px] text-[var(--ink-low)] leading-relaxed mb-5">
                        We&apos;re always looking for talented writers, video editors, and developers who share our
                        passion for honest tech journalism. If you think you&apos;d be a good fit, drop us a line.
                    </p>
                    <a
                        href="mailto:redakcija@techplay.gg?subject=Želim da se pridružim TechPlay timu"
                        className="btn-command inline-flex items-center gap-2 h-11 px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-display text-[13px] font-bold uppercase tracking-wider transition-colors duration-300"
                    >
                        <Mail className="w-4 h-4" />
                        Get in Touch
                    </a>
                </section>

                <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-[var(--line)] pt-6 text-[12px] text-[var(--ink-faint)]">
                    <span className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        © {new Date().getFullYear()} TechPlay.gg. All rights reserved.
                    </span>
                    <span className="flex flex-wrap justify-center gap-4">
                        {[
                            ["/privacy", "Privacy Policy"],
                            ["/terms", "Terms of Service"],
                            ["/cookies", "Cookie Policy"],
                        ].map(([href, label]) => (
                            <Link key={href} href={href} className="flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors duration-300">
                                <FileText className="w-3.5 h-3.5" /> {label}
                            </Link>
                        ))}
                    </span>
                </div>
            </div>
        </main>
    );
}
