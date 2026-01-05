"use client";

import PageHero from "@/components/ui/PageHero";
import { motion } from "framer-motion";
import { Building2, MapPin, Mail, Shield, FileText, Globe, Code2, Users, Phone } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export default function ImpressumClient({ staff }: { staff: any }) {
    const editorInChief = staff?.['Editor-in-Chief']?.[0];
    const editors = staff?.['Editor'] || [];
    const journalists = staff?.['Journalist'] || [];
    const moderators = staff?.['Moderator'] || [];
    const contributors = [...journalists, ...moderators];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <PageHero
                title="Impressum"
                description="Transparency is our foundation. Meet the team and entity behind TechPlay.gg."
            />

            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    {/* Publisher Card - Large */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <Building2 className="w-64 h-64" />
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-[var(--accent)]/10 rounded-xl">
                                        <Building2 className="w-6 h-6 text-[var(--accent)]" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Publisher & Owner</h2>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">Luminor Solutions</h3>
                                <p className="text-[var(--text-secondary)] text-lg">Digital Media & Technology Agency</p>
                            </div>

                            <div className="space-y-4 mt-8">
                                <div className="flex items-start gap-4">
                                    <MapPin className="w-5 h-5 text-[var(--text-muted)] mt-1" />
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">Headquarters</p>
                                        <p className="text-[var(--text-secondary)]">71000 Sarajevo, Bosnia and Herzegovina</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Globe className="w-5 h-5 text-[var(--text-muted)]" />
                                    <a href="https://luminor.ba" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                                        luminor.ba
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Editor in Chief - Dynamic */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 md:col-span-1 lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 flex items-center md:items-start lg:items-center gap-6 group hover:border-[var(--accent)] transition-colors"
                    >
                        {editorInChief ? (
                            <Link href={`/profile/${editorInChief.username}`} className="flex items-center gap-6 w-full">
                                <Avatar className="w-20 h-20 border-2 border-[var(--accent)]">
                                    <AvatarImage src={editorInChief.avatar_url} />
                                    <AvatarFallback className="bg-gradient-to-br from-[var(--accent)] to-purple-600 text-white text-2xl font-bold">
                                        {editorInChief.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[var(--accent)] font-bold text-xs uppercase tracking-wider mb-1">Editor-in-Chief</p>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{editorInChief.name}</h3>
                                    <p className="text-sm text-[var(--text-muted)] mt-1">Responsible Person</p>
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center w-full h-20 text-[var(--text-muted)]">
                                Loading...
                            </div>
                        )}
                    </motion.div>

                    {/* Editors / Executive Editors - Dynamic */}
                    {editors.length > 0 ? (
                        editors.map((editor: any) => (
                            <motion.div
                                key={editor.id}
                                variants={fadeInUp}
                                className="col-span-1 md:col-span-1 lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 flex items-center md:items-start lg:items-center gap-6 group hover:border-blue-500 transition-colors"
                            >
                                <Link href={`/profile/${editor.username}`} className="flex items-center gap-6 w-full">
                                    <Avatar className="w-20 h-20 border-2 border-blue-500">
                                        <AvatarImage src={editor.avatar_url} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold">
                                            {editor.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">Executive Editor</p>
                                        <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{editor.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">Editorial Team</p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    ) : (
                        // Fallback placeholder if no editors found
                        <motion.div
                            variants={fadeInUp}
                            className="col-span-1 md:col-span-1 lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 hidden md:flex"
                        />
                    )}


                    {/* Contributors List - Dynamic */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 md:col-span-3 lg:col-span-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-3xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-[var(--text-secondary)]" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Contributors & Journalists</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {contributors.length > 0 ? contributors.map((user: any) => (
                                <Link key={user.id} href={`/profile/${user.username}`}>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] transition-colors border border-transparent hover:border-[var(--border)] group">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback className="bg-[var(--bg-secondary)] text-[var(--text-muted)] text-xs font-bold">
                                                {user.name.substring(0, 1)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{user.name}</span>
                                    </div>
                                </Link>
                            )) : (
                                <p className="text-[var(--text-muted)] col-span-full">No contributors yet.</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 flex flex-col justify-center gap-4 hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                        <h3 className="font-bold text-[var(--text-primary)] mb-2">Contact Us</h3>
                        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                            <Mail className="w-5 h-5 text-[var(--accent)]" />
                            <a href="mailto:info@techplay.gg" className="hover:text-white transition-colors">info@techplay.gg</a>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                            <Phone className="w-5 h-5 text-[var(--accent)]" />
                            <span>+387 33 123 456</span>
                        </div>
                    </motion.div>

                    {/* Legal Links */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 md:col-span-2 lg:col-span-4 bg-[var(--bg-secondary)]/50 border border-[var(--border)] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-[var(--text-muted)]" />
                            <span className="text-[var(--text-secondary)] text-sm">© 2026 TechPlay.gg. All rights reserved.</span>
                        </div>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                <FileText className="w-4 h-4" /> Privacy Policy
                            </Link>
                            <Link href="/terms" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                <FileText className="w-4 h-4" /> Terms of Service
                            </Link>
                            <Link href="/cookies" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                                <FileText className="w-4 h-4" /> Cookie Settings
                            </Link>
                        </div>
                    </motion.div>

                    {/* Tech Values - Small Footer */}
                    <motion.div
                        variants={fadeInUp}
                        className="col-span-1 md:col-span-3 lg:col-span-4 text-center mt-8"
                    >
                        <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)] uppercase tracking-widest opacity-50">
                            <Code2 className="w-3 h-3" />
                            Developed with <span className="text-[var(--accent)]">Next.js</span> & <span className="text-red-500">FilamentPHP</span>
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
