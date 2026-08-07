"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Building2, MapPin, Mail, Shield, FileText, Globe, Users, Phone, Sparkles, Crown, PenTool, Newspaper } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

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

// Get role color based on role type
const getRoleColor = (role: string) => {
    switch (role) {
        case 'Super Admin':
            return { border: 'border-[var(--accent)]', text: 'text-[var(--accent)]', bg: 'from-[var(--accent)] to-[var(--accent-deep)]' };
        case 'Editor-in-Chief':
            return { border: 'border-[var(--accent)]/80', text: 'text-[var(--accent)]', bg: 'from-[var(--accent)] to-[var(--accent-deep)]' };
        case 'Editor':
            return { border: 'border-[var(--accent)]/60', text: 'text-[var(--accent)]/80', bg: 'from-[var(--accent)]/80 to-[var(--accent-deep)]' };
        case 'Journalist':
            return { border: 'border-[var(--accent)]/40', text: 'text-[var(--accent)]/70', bg: 'from-[var(--accent)]/70 to-[var(--accent-deep)]/70' };
        case 'Moderator':
            return { border: 'border-[var(--accent)]/30', text: 'text-[var(--accent)]/60', bg: 'from-[var(--accent)]/60 to-[var(--accent-deep)]/60' };
        default:
            return { border: 'border-[var(--accent)]', text: 'text-[var(--accent)]', bg: 'from-[var(--accent)] to-[var(--accent-deep)]' };
    }
};

// Get role icon based on role type
const getRoleIcon = (role: string) => {
    switch (role) {
        case 'Super Admin':
            return Crown;
        case 'Editor-in-Chief':
            return Sparkles;
        case 'Editor':
            return PenTool;
        case 'Journalist':
            return Newspaper;
        default:
            return Users;
    }
};

// Team member card component
const TeamMemberCard = ({ member, featured = false }: { member: StaffMember; featured?: boolean }) => {
    const roleColors = getRoleColor(member.role);
    const initials = member.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <Link href={`/profile/${member.username}`}>
            <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -4 }}
                className={`bg-[var(--surface-1)] border ${roleColors.border} border-opacity-50 rounded-[var(--radius-panel)] ${featured ? 'p-8' : 'p-5'} flex flex-col items-center text-center group cursor-pointer hover:border-opacity-100 hover:shadow-lg hover:shadow-[var(--accent)]/10 transition-all duration-300`}
            >
                {/* Avatar */}
                <div className={`relative ${featured ? 'w-28 h-28' : 'w-20 h-20'} mb-4`}>
                    <div className={`relative w-full h-full rounded-full overflow-hidden border-2 ${roleColors.border} bg-[var(--surface-2)]`}>
                        {member.avatar_url ? (
                            <Image
                                src={member.avatar_url}
                                alt={member.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${roleColors.bg} text-white ${featured ? 'text-3xl' : 'text-xl'} font-bold`}>
                                {initials}
                            </div>
                        )}
                    </div>
                </div>

                {/* Role Badge */}
                <span className={`${roleColors.text} font-bold text-[10px] uppercase tracking-wider mb-1`}>
                    {member.role}
                </span>

                {/* Name */}
                <h3 className={`${featured ? 'text-xl' : 'text-base'} font-bold text-white group-hover:text-white transition-colors`}>
                    {member.name}
                </h3>

                {/* Bio (for featured only) */}
                {featured && member.bio && (
                    <p className="text-sm text-white/35 mt-2 line-clamp-2">
                        {member.bio}
                    </p>
                )}

                {/* Joined date */}
                <span className="text-[11px] text-white/35 mt-2">
                    Since {member.joined_at}
                </span>
            </motion.div>
        </Link>
    );
};

export default function ImpressumClient({ staff }: { staff: StaffData | null }) {
    // Get staff by role - each role gets its own section
    const editorInChief = staff?.['Editor-in-Chief'] || [];
    const editors = staff?.['Editor'] || [];
    const journalists = staff?.['Journalist'] || [];
    const moderators = staff?.['Moderator'] || [];

    return (
        <div className="min-h-screen">
            <PageHero
                title="Impressum"
                description="Meet the people behind TechPlay and get in touch with our team."
            />

            <div className="container-page py-16">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-12"
                >
                    {/* Publisher Section */}
                    <motion.section variants={fadeInUp}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Publisher Card */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)] border border-[var(--line)] rounded-[var(--radius-panel)] p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                    <Building2 className="w-64 h-64" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-[var(--accent)]/10 rounded-[var(--radius-card)]">
                                            <Building2 className="w-6 h-6 text-[var(--accent)]" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Publisher & Owner</h2>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">Luminor Solutions</h3>
                                    <p className="text-white/55 text-lg mb-4">Digital Media & Technology Agency</p>
                                    <p className="text-sm text-white/35 leading-relaxed max-w-xl">
                                        Luminor Solutions is the company behind TechPlay.gg. We handle the business side—hosting, legal compliance,
                                        partnerships—so our editorial team can focus on what matters: creating great content.
                                    </p>

                                    <div className="flex flex-wrap gap-6 mt-8">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-white/35" />
                                            <span className="text-white/55">Sarajevo, Bosnia and Herzegovina</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-[var(--accent)]" />
                                            <a href="https://luminor.solutions" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                                                luminor.solutions
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Card */}
                            <div className="bg-gradient-to-br from-[var(--accent)]/10 to-[var(--surface-1)] border border-[var(--accent)]/30 rounded-[var(--radius-panel)] p-8 flex flex-col justify-center">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-[var(--accent)]" />
                                    Contact Us
                                </h3>
                                <div className="space-y-4">
                                    <a
                                        href="mailto:redakcija@techplay.gg"
                                        className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--line)] hover:border-[var(--accent)] transition-colors group"
                                    >
                                        <div className="p-2 bg-[var(--accent)]/10 rounded-[var(--radius-card)]">
                                            <Mail className="w-5 h-5 text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/35">Email</p>
                                            <p className="text-white group-hover:text-[var(--accent)] transition-colors">redakcija@techplay.gg</p>
                                        </div>
                                    </a>
                                    <a
                                        href="tel:+38762574783"
                                        className="flex items-center gap-4 p-4 rounded-[var(--radius-card)] border border-[var(--line)] hover:border-[var(--accent)] transition-colors group"
                                    >
                                        <div className="p-2 bg-[var(--accent)]/10 rounded-[var(--radius-card)]">
                                            <Phone className="w-5 h-5 text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/35">Phone</p>
                                            <p className="text-white group-hover:text-[var(--accent)] transition-colors">+387 62 574 783</p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Editor-in-Chief Section */}
                    {editorInChief.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <div className="flex items-center gap-3 mb-6">
                                <Crown className="w-6 h-6 text-[var(--accent)]" />
                                <h2 className="text-2xl font-bold text-white">Editor-in-Chief</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {editorInChief.map((member) => (
                                    <TeamMemberCard key={member.id} member={member} featured />
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Editors Section */}
                    {editors.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <div className="flex items-center gap-3 mb-6">
                                <PenTool className="w-6 h-6 text-[var(--accent)]" />
                                <h2 className="text-2xl font-bold text-white">Editors</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {editors.map((member) => (
                                    <TeamMemberCard key={member.id} member={member} />
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Journalists Section */}
                    {journalists.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <div className="flex items-center gap-3 mb-6">
                                <Newspaper className="w-6 h-6 text-[var(--accent)]" />
                                <h2 className="text-2xl font-bold text-white">Journalists</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {journalists.map((member) => (
                                    <TeamMemberCard key={member.id} member={member} />
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Moderators Section */}
                    {moderators.length > 0 && (
                        <motion.section variants={fadeInUp}>
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="w-6 h-6 text-[var(--accent)]" />
                                <h2 className="text-2xl font-bold text-white">Community Moderators</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {moderators.map((member) => (
                                    <TeamMemberCard key={member.id} member={member} />
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Legal Links */}
                    <motion.section variants={fadeInUp}>
                        <div className="bg-[var(--surface-1)]/50 border border-[var(--line)] rounded-[var(--radius-panel)] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-white/35" />
                                <span className="text-white/55 text-sm">© 2025 TechPlay.gg. All rights reserved.</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                                <Link href="/privacy" className="flex items-center gap-2 text-sm text-white/35 hover:text-[var(--accent)] transition-colors">
                                    <FileText className="w-4 h-4" /> Privacy Policy
                                </Link>
                                <Link href="/terms" className="flex items-center gap-2 text-sm text-white/35 hover:text-[var(--accent)] transition-colors">
                                    <FileText className="w-4 h-4" /> Terms of Service
                                </Link>
                                <Link href="/cookies" className="flex items-center gap-2 text-sm text-white/35 hover:text-[var(--accent)] transition-colors">
                                    <FileText className="w-4 h-4" /> Cookie Settings
                                </Link>
                            </div>
                        </div>
                    </motion.section>

                    {/* Join Us CTA */}
                    <motion.section variants={fadeInUp}>
                        <div className="bg-gradient-to-r from-[var(--accent)]/20 via-[var(--surface-1)] to-[var(--accent)]/10 border border-[var(--line)] rounded-[var(--radius-panel)] p-10 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5" />
                            <div className="relative z-10">
                                <Sparkles className="w-10 h-10 text-[var(--accent)] mx-auto mb-4" />
                                <h3 className="text-3xl font-bold text-white mb-3">Want to Join the Team?</h3>
                                <p className="text-white/55 mb-8 max-w-2xl mx-auto">
                                    We're always looking for talented writers, video editors, and developers who share our passion
                                    for honest tech journalism. If you think you'd be a good fit, drop us a line.
                                </p>
                                <a
                                    href="mailto:redakcija@techplay.gg?subject=Želim da se pridružim TechPlay timu"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-[var(--radius-card)] transition-all hover:scale-105 shadow-lg shadow-[var(--accent)]/30"
                                >
                                    <Mail className="w-5 h-5" />
                                    Get in Touch
                                </a>
                            </div>
                        </div>
                    </motion.section>

                    {/* Footer */}
                    <motion.div variants={fadeInUp} className="text-center pt-8">
                        <p className="text-sm text-white/35">
                            Made with ❤️ by{' '}
                            <a href="https://luminor.solutions" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                                Luminor.solutions
                            </a>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
