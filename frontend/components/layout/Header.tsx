"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import axios from "@/lib/axios";
import {
    Menu, X, Search, User, LogOut, ShoppingCart,
    ChevronDown, Facebook, Twitter, Instagram, Youtube,
    Mail, Users, Sword, Monitor, Tag, Calendar, Gamepad2,
    Newspaper, Trophy, Star, Cpu, ArrowRight,
    Film, Mic, MessageSquare, Briefcase,
    Clock, ThumbsUp, Gem, Rocket, Gauge, BookOpen, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdown from "./SearchDropdown";
import { decodeHtml } from "@/lib/decode";
import NotificationPanel from "./NotificationPanel";

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055A19.9 19.9 0 0 0 6.131 21.3a.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
);

// Social Icon Mapping with names for accessibility
const SOCIAL_ICON_MAP: Record<string, { icon: any; name: string }> = {
    twitter_url: { icon: Twitter, name: 'Twitter' },
    facebook_url: { icon: Facebook, name: 'Facebook' },
    instagram_url: { icon: Instagram, name: 'Instagram' },
    youtube_url: { icon: Youtube, name: 'YouTube' },
    discord_url: { icon: DiscordIcon, name: 'Discord' },
};

// Utility Links (Top Bar)
const UTILITY_LINKS = [
    { name: "ABOUT US", href: "/about" },
    { name: "IMPRESSUM", href: "/impressum" },
    { name: "MARKETING", href: "/marketing", highlight: true },
    { name: "CONTACT", href: "/contact" },
    { name: "OUR RATING SYSTEM", href: "/rating-system" },
];

// Types for Navigation
interface NavSubCategory {
    name: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    description?: string;
}

interface NavItemType {
    name: string;
    href: string;
    hasDropdown?: boolean;
    children?: NavSubCategory[];
    viewAllLabel?: string;
}

const DB_GENRES = [
    { label: "Action",       slug: "action" },
    { label: "RPG",          slug: "rpg" },
    { label: "Shooter",      slug: "shooter" },
    { label: "Indie",        slug: "indie" },
    { label: "Adventure",    slug: "adventure" },
    { label: "Strategy",     slug: "strategy" },
    { label: "Puzzle",       slug: "puzzle" },
    { label: "Horror",       slug: "horror" },
    { label: "Racing",       slug: "racing" },
    { label: "Sports",       slug: "sports" },
    { label: "Platformer",   slug: "platformer" },
    { label: "Simulation",   slug: "simulation" },
];

const DB_PLATFORMS = [
    { label: "PC",          slug: "pc" },
    { label: "PlayStation", slug: "playstation" },
    { label: "Xbox",        slug: "xbox" },
    { label: "Nintendo",    slug: "nintendo" },
    { label: "Mobile",      slug: "mobile" },
];

const DB_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];

// Mega-dropdown for DATABASE nav item
function DatabaseNavItem() {
    const pathname = usePathname();
    const isActive = pathname.startsWith("/games");
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => setIsHovered(false), [pathname]);

    return (
        <div className="relative h-full flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Link href="/games" className={cn(
                "flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors whitespace-nowrap px-2 py-2.5",
                isActive || isHovered ? "text-tp-accent" : "text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white"
            )}>
                DATABASE
                <ChevronDown className={cn("w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200", isHovered ? "rotate-180" : "rotate-0")} />
            </Link>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] rounded-xl shadow-2xl overflow-hidden z-[100] bg-white dark:bg-[#0D1117] backdrop-blur-xl border border-zinc-200 dark:border-white/5"
                    >
                        <div className="h-[3px] bg-tp-accent w-full" />
                        <div className="p-5">
                            <div className="grid grid-cols-3 gap-5">
                                {/* Genres */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sword className="w-3.5 h-3.5 text-tp-accent" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/40">Genres</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                                        {DB_GENRES.map((g) => (
                                            <Link key={g.slug} href={`/games/genre/${g.slug}`} prefetch={false}
                                                className="px-2 py-1.5 text-[12px] font-medium text-zinc-600 dark:text-[#A1A1AA] hover:text-tp-accent dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-all">
                                                {g.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Platforms + Years */}
                                <div className="flex flex-col gap-5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Monitor className="w-3.5 h-3.5 text-tp-accent" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/40">Platforms</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {DB_PLATFORMS.map((p) => (
                                                <Link key={p.slug} href={`/games/platform/${p.slug}`} prefetch={false}
                                                    className="px-2 py-1.5 text-[12px] font-medium text-zinc-600 dark:text-[#A1A1AA] hover:text-tp-accent dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-all">
                                                    {p.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="w-3.5 h-3.5 text-tp-accent" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-white/40">Years</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            {DB_YEARS.map((y) => (
                                                <Link key={y} href={`/games/year/${y}`} prefetch={false}
                                                    className="px-2 py-1.5 text-[12px] font-medium text-zinc-600 dark:text-[#A1A1AA] hover:text-tp-accent dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-all">
                                                    {y}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                <Link href="/games" className="flex items-center gap-1.5 text-[11px] font-bold text-tp-accent hover:text-tp-accent-hover uppercase tracking-wider transition-colors group">
                                    Browse All Games
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link href="/games/tag/open-world" className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 dark:text-white/30 hover:text-tp-accent dark:hover:text-white transition-colors">
                                    <Tag className="w-3 h-3" /> Popular Tags
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    NEWS:     Newspaper,
    REVIEWS:  Star,
    TECH:     Cpu,
    VIDEO:    Film,
    GUIDES:   BookOpen,
    CALENDAR: Calendar,
    DATABASE: Gamepad2,
    FORUM:    MessageSquare,
    SHOP:     ShoppingCart,
};

// Initial Nav Items (will be populated with children from API)
const INITIAL_NAV_ITEMS: NavItemType[] = [
    { name: "NEWS", href: "/news", hasDropdown: true, viewAllLabel: "All News", children: [
        { name: "Gaming",      href: "/news/gaming",      icon: Gamepad2,      description: "Game news & announcements" },
        { name: "PC",          href: "/news/pc",          icon: Cpu,           description: "PC gaming & hardware" },
        { name: "Consoles",    href: "/news/consoles",    icon: Monitor,       description: "PlayStation, Xbox & Nintendo" },
        { name: "Movies & TV", href: "/news/movies-tv",   icon: Film,          description: "Adaptations & entertainment" },
        { name: "Industry",    href: "/news/industry",    icon: Briefcase,     description: "Business & dev news" },
        { name: "E-sport",     href: "/news/e-sport",     icon: Trophy,        description: "Tournaments & pro gaming" },
        { name: "Opinions",    href: "/news/opinions",    icon: MessageSquare, description: "Editorials & columns" },
        { name: "Interviews",  href: "/news/interviews",  icon: Mic,           description: "Conversations with creators" },
    ]},
    { name: "REVIEWS", href: "/reviews", hasDropdown: true, viewAllLabel: "All Reviews", children: [
        { name: "Latest",          href: "/reviews/latest",          icon: Clock,    description: "Fresh off the press" },
        { name: "Editor's Choice", href: "/reviews/editors-choice",  icon: ThumbsUp, description: "Our top picks" },
        { name: "AAA Titles",      href: "/reviews/aaa-titles",      icon: Gamepad2, description: "Big-budget blockbusters" },
        { name: "Indie Gems",      href: "/reviews/indie-gems",      icon: Gem,      description: "Hidden indie treasures" },
        { name: "Retro",           href: "/reviews/retro",           icon: Rocket,   description: "Classics revisited" },
    ]},
    { name: "TECH", href: "/hardware", hasDropdown: true, viewAllLabel: "All Hardware", children: [
        { name: "Reviews",    href: "/hardware/reviews",    icon: Star,      description: "Hands-on hardware reviews" },
        { name: "Benchmarks", href: "/hardware/benchmarks", icon: Gauge,     description: "Performance testing" },
        { name: "Guides",     href: "/hardware/guides",     icon: BookOpen,  description: "Buying & build guides" },
        { name: "Tech News",  href: "/hardware/news",       icon: Newspaper, description: "Latest tech headlines" },
    ]},
    { name: "VIDEO",    href: "/videos" },
    { name: "GUIDES",   href: "/guides" },
    { name: "CALENDAR", href: "/calendar" },
    { name: "DATABASE", href: "/games", hasDropdown: true, children: [
        { name: "All Games", href: "/games" },
        { name: "── Genres ──", href: "/games" },
        ...DB_GENRES.map(g => ({ name: g.label, href: `/games/genre/${g.slug}` })),
        { name: "── Platforms ──", href: "/games" },
        ...DB_PLATFORMS.map(p => ({ name: p.label, href: `/games/platform/${p.slug}` })),
    ]},
    { name: "FORUM", href: "/forum", hasDropdown: true, viewAllLabel: "Open Forum", children: [
        { name: "Forum",       href: "/forum",       icon: MessageSquare, description: "Discussions, help & clan halls" },
        { name: "Leaderboard", href: "/leaderboard", icon: Trophy,        description: "Top gamers by XP & reputation" },
        { name: "Clans",       href: "/clans",       icon: Shield,        description: "Join or create a clan" },
        { name: "Friends",     href: "/friends",     icon: Users,         description: "Your gaming crew" },
    ]},
    { name: "SHOP",  href: "/shop" },
];

// Logo Component
function BrandLogo() {
    return (
        <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-tp-accent rounded-lg flex items-center justify-center shadow-lg group-hover:bg-tp-accent-hover transition-colors">
                <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-[18px] text-zinc-900 dark:text-white tracking-tight leading-none">TECHPLAY</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-400 mt-[3px]">GAMING PORTAL</span>
            </div>
        </Link>
    );
}

// Nav dropdown component — mega menu (vertical) or plain link
function NavItem({ item, badge, onHoverChange }: {
    item: NavItemType;
    badge?: number;
    onHoverChange?: (name: string | null) => void;
}) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(item.href);
    const [isOpen, setIsOpen] = useState(false);
    const isMegaMenu = !!(item.hasDropdown && item.children?.[0]?.icon);

    useEffect(() => { setIsOpen(false); onHoverChange?.(null); }, [pathname]);

    const handleEnter = () => { setIsOpen(true); onHoverChange?.(item.name); };
    const handleLeave = () => { setIsOpen(false); onHoverChange?.(null); };

    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <Link
                href={item.href}
                className={cn(
                    "relative flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors whitespace-nowrap px-2 py-2.5",
                    isActive || isOpen ? "text-tp-accent" : "text-zinc-600 dark:text-slate-300 hover:text-tp-accent dark:hover:text-white"
                )}
            >
                {item.name}
                {badge ? (
                    <span className="ml-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
                {item.hasDropdown && (
                    <ChevronDown className={cn("w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")} aria-hidden="true" />
                )}
                {isActive && (
                    <span style={{
                        position: 'absolute', bottom: 0, left: '8px', right: '8px',
                        height: '3px', borderRadius: '2px 2px 0 0',
                        background: 'linear-gradient(90deg, #FC4100, rgba(252,65,0,0.6))',
                        boxShadow: '0 0 8px rgba(252,65,0,0.6)',
                    }} />
                )}
            </Link>

            <AnimatePresence>
                {item.hasDropdown && item.children && item.children.length > 0 && isOpen && (
                    isMegaMenu ? (
                        /* ── MEGA DROPDOWN — vertikalno, pozicionirano ispod nav linka ── */
                        <motion.div
                            key="mega"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-0 z-[100] w-[300px] bg-white dark:bg-[#0D1117] border border-t-0 border-zinc-200 dark:border-white/[0.07] shadow-xl dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)] rounded-b-xl overflow-hidden"
                        >
                            <div className="flex flex-col p-2">
                                {item.children.map((child, idx) => {
                                    const Icon = child.icon;
                                    return (
                                        <Link
                                            key={idx}
                                            href={child.href}
                                            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.05] group transition-all duration-150"
                                        >
                                            {Icon && (
                                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.07] group-hover:bg-tp-accent/10 group-hover:border-tp-accent/25 flex items-center justify-center shrink-0 transition-all duration-150">
                                                    <Icon className="w-[18px] h-[18px] text-zinc-500 dark:text-[#A1A1AA] group-hover:text-tp-accent transition-colors duration-150" />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[13px] font-bold text-zinc-900 dark:text-white group-hover:text-tp-accent transition-colors duration-150 leading-tight">
                                                    {child.name}
                                                </span>
                                                {child.description && (
                                                    <span className="text-[11px] text-zinc-500 dark:text-[#6B7280] leading-tight mt-0.5">
                                                        {child.description}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {item.viewAllLabel && (
                                <div className="px-5 py-3 border-t border-zinc-100 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02]">
                                    <Link
                                        href={item.href}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-tp-accent hover:text-tp-accent-hover uppercase tracking-wider transition-colors group"
                                    >
                                        VIEW ALL {item.name}
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-150" />
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── REGULAR DROPDOWN ── */
                        <motion.div
                            key="dropdown"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute top-full left-0 z-[100] w-[220px] bg-white dark:bg-[#0D1117] border border-t-0 border-zinc-200 dark:border-white/[0.07] shadow-xl dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)] rounded-b-xl overflow-hidden"
                        >
                            <div className="p-2 flex flex-col">
                                {item.children.map((child, idx) => (
                                    <Link
                                        key={idx}
                                        href={child.href}
                                        className="block px-4 py-3 text-[13px] font-medium text-zinc-700 dark:text-[#A1A1AA] hover:text-tp-accent dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Header() {
    const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenu();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const { settings } = useSiteSettings();
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItemType[]>(INITIAL_NAV_ITEMS);
    const [notifications, setNotifications] = useState({ unread_messages: 0, pending_requests: 0, forum_replies: 0, unread_notifications: 0 });
    const refreshNotifCounts = () => {
        if (!user) return;
        axios.get('/user/notifications/counts').then((r) => setNotifications(r.data)).catch(() => {});
    };



    // Build dynamic social links from settings
    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({
            icon: SOCIAL_ICON_MAP[key].icon,
            name: SOCIAL_ICON_MAP[key].name,
            href: settings[key] || '#'
        }));

    // Fetch Categories from Backend
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/navigation/tree');
                const tree = res.data; // { news: [], reviews: [], tech: [] }

                setNavItems((prevItems) => prevItems.map(item => {
                    const key = item.name.toLowerCase();
                    if (tree[key] && Array.isArray(tree[key])) {
                        // Merge API children with existing icon/description by href match
                        const apiChildren: NavSubCategory[] = tree[key];
                        const mergedChildren = apiChildren.map((apiChild: NavSubCategory) => {
                            const existing = item.children?.find(c =>
                                c.href === apiChild.href || c.name.toLowerCase() === apiChild.name.toLowerCase()
                            );
                            return existing
                                ? { ...apiChild, icon: existing.icon, description: existing.description }
                                : apiChild;
                        });
                        return { ...item, children: mergedChildren };
                    }
                    return item;
                }));
            } catch (error) {
                console.error("Failed to fetch navigation tree:", error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch Notifications (Poll every 30s, pause when tab hidden for battery/performance)
    useEffect(() => {
        if (!user) return;

        let interval: NodeJS.Timeout | null = null;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/user/notifications/counts');
                setNotifications(res.data);
            } catch (error) {
                // Silent fail - non-critical
            }
        };

        const startPolling = () => {
            fetchNotifications(); // Immediate fetch
            interval = setInterval(fetchNotifications, 60000);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        // PERF: Use Page Visibility API to pause polling when tab is hidden
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
            } else {
                startPolling(); // Resume and fetch immediately when tab becomes visible
            }
        };

        // Start polling if tab is visible
        if (!document.hidden) {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    // Close mobile menu and search on route change
    useEffect(() => { setIsMobileMenuOpen(false); setIsSearchOpen(false); }, [pathname]);

    // Close search on Escape
    useEffect(() => {
        if (!isSearchOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsSearchOpen(false); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [isSearchOpen]);

    return (
        <div className="w-full font-sans fixed top-0 left-0 right-0 z-50 flex flex-col shadow-2xl">
            {/* MOBILE: TOP BAR (Sign In / Search) */}
            <div className="border-b border-white/5 xl:hidden bg-[#020305]">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 flex justify-between items-center h-[34px]">
                    {/* Left: Sign In / Register */}
                    {user ? (
                        <Link
                            href={`/profile/${user.username || 'me'}`}
                            className="flex items-center gap-2 text-white text-xs font-medium"
                        >
                            {user.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt={user.username || 'Avatar'}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 rounded-full object-cover"
                                    unoptimized={user.avatar_url.includes('discord') || user.avatar_url.includes('gravatar')}
                                />
                            ) : (
                                <User className="w-4 h-4" />
                            )}
                            <span>{decodeHtml(user.display_name || user.username)}</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-white text-xs font-medium"
                        >
                            <User className="w-4 h-4" />
                            <span className="uppercase tracking-wide">Sign In / Register</span>
                        </Link>
                    )}

                    {/* Right: Search */}
                    <button
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>

            </div>

            {/* DESKTOP TOP BAR */}
            <div className="hidden xl:block bg-zinc-100 dark:bg-[#020305] transition-colors duration-300">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 flex justify-between items-center h-[34px]">
                    {/* Left: Utility Links */}
                    <div className="flex items-center gap-6">
                        {UTILITY_LINKS.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "text-[10px] uppercase font-bold transition-colors tracking-widest",
                                    link.highlight ? "text-tp-accent" : "text-zinc-500 dark:text-slate-400 hover:text-tp-accent"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right: Socials & Auth */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-zinc-200 dark:border-white/10">
                            {socialLinks.map((social, idx) => (
                                <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-zinc-500 dark:text-slate-400 hover:text-tp-accent transition-colors" aria-label={`Follow us on ${social.name}`}>
                                    <social.icon className="w-3.5 h-3.5" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>

                        <Link href="/cart" className="relative text-gray-400 hover:text-white transition-colors" aria-label="Shopping cart">
                            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center" aria-label={`${itemCount} items in cart`}>
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="flex items-center gap-4 pl-4 border-l border-white/10 ml-2">
                                {/* Navigation Icons */}
                                <div className="flex items-center gap-1">
                                    <Link href="/messages" className="p-2 text-gray-400 hover:text-[var(--accent)] hover:bg-white/5 rounded-full transition-colors relative" title="Messages">
                                        <Mail className="w-5 h-5" />
                                        {notifications.unread_messages > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#020816]">
                                                {notifications.unread_messages}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href="/friends" className="p-2 text-gray-400 hover:text-[var(--accent)] hover:bg-white/5 rounded-full transition-colors relative" title="Friends">
                                        <Users className="w-5 h-5" />
                                        {notifications.pending_requests > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#020816]">
                                                {notifications.pending_requests}
                                            </span>
                                        )}
                                    </Link>
                                    <NotificationPanel
                                        unreadCount={notifications.unread_notifications}
                                        onCountRefresh={refreshNotifCounts}
                                    />
                                </div>

                                <div className="h-6 w-px bg-white/10 mx-1" />

                                <Link href={`/profile/${user.username || 'me'}`} className="flex items-center gap-2 group">
                                    {user.avatar_url ? (
                                        <Image
                                            src={user.avatar_url}
                                            alt={user.username || 'Avatar'}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover border border-white/20 group-hover:border-[var(--accent)] transition-colors"
                                            unoptimized={user.avatar_url.includes('discord') || user.avatar_url.includes('gravatar')}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors text-white">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-medium group-hover:text-[var(--accent)] text-xs leading-tight truncate max-w-[120px]">
                                            {decodeHtml(user.display_name || user.username) || "My Profile"}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono leading-tight">
                                            Lvl {Math.floor((user.xp || 0) / 1000) + 1}
                                        </span>
                                    </div>
                                </Link>
                                <button onClick={logout} className="ml-2 text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full" title="Sign Out">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-[10px] uppercase tracking-wide font-semibold">
                                <User className="w-3 h-3" />
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN HEADER */}
            <header className="w-full bg-white/95 dark:bg-gradient-to-b dark:from-[#0F141D]/98 dark:to-[#05070A]/98 backdrop-blur-md border-b-[3px] border-tp-accent relative shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="max-w-[1320px] mx-auto px-4 xl:px-0 h-[72px] flex items-center justify-between">
                    {/* Logo (Left) */}
                    <BrandLogo />

                    {/* Desktop Nav (Center) */}
                    <nav className="hidden xl:flex items-center gap-5 h-full">
                        {navItems.map((item) =>
                            item.name === "DATABASE" ? (
                                <DatabaseNavItem key="DATABASE" />
                            ) : (
                                <NavItem
                                    key={item.name}
                                    item={item}
                                    badge={item.name === 'FORUM' && notifications.forum_replies > 0 ? notifications.forum_replies : undefined}
                                />
                            )
                        )}
                    </nav>

                    {/* Actions (Right) */}
                    <div className="flex items-center gap-4">
                        {/* Search button */}
                        <button
                            onClick={() => setIsSearchOpen(prev => !prev)}
                            className={cn(
                                "hidden xl:flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                                isSearchOpen
                                    ? "bg-tp-accent text-white shadow-lg shadow-tp-accent/30"
                                    : "text-zinc-600 dark:text-slate-400 hover:text-tp-accent dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                            )}
                            aria-label="Toggle search"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isSearchOpen ? (
                                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                        <X className="w-[18px] h-[18px]" />
                                    </motion.span>
                                ) : (
                                    <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                                        <Search className="w-[18px] h-[18px]" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>

                        {/* Auth Buttons (main nav bar - desktop, guests only) */}
                        {!user && (
                            <div className="hidden xl:flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-slate-300 hover:text-white font-semibold transition-colors text-[11px] uppercase tracking-widest"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center bg-tp-accent hover:bg-tp-accent-hover text-white px-6 h-[34px] rounded-sm font-semibold transition-colors uppercase text-[11px] tracking-widest leading-none"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                        {/* Support Us (for logged-in users) */}
                        {user && (
                            <Link
                                href="/support"
                                className="hidden md:inline-flex items-center justify-center bg-tp-accent hover:bg-tp-accent-hover text-white px-6 h-[34px] rounded-sm font-semibold transition-colors uppercase text-[11px] tracking-widest leading-none"
                            >
                                Support Us
                            </Link>
                        )}

                        {/* Hamburger Menu - Mobile Only */}
                        <button
                            className="xl:hidden p-2 text-gray-300 hover:text-white active:bg-white/10 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                        </button>

                    </div>
                </div>
            </header>

            {/* MOBILE SEARCH PANEL — outside overflow-hidden so results can flow freely */}
            <AnimatePresence>
                {mobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="xl:hidden bg-[#0A0D13]/98 backdrop-blur-md border-b border-white/[0.06] w-full"
                        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                    >
                        <div className="max-w-[1320px] mx-auto px-4 py-3">
                            <SearchDropdown
                                isMobile
                                placeholder="Search TechPlay..."
                                onClose={() => setMobileSearchOpen(false)}
                                autoFocus={true}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DESKTOP SEARCH DROPDOWN */}
            <AnimatePresence>
                {isSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="hidden xl:block bg-[#0A0D13]/98 backdrop-blur-md border-b border-white/[0.06] w-full"
                        style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                    >
                        <div className="max-w-[1320px] mx-auto px-4 xl:px-0 py-3 flex justify-end">
                            <div className="w-[420px]">
                                <SearchDropdown
                                    isMobile={false}
                                    placeholder="Search articles, games, reviews..."
                                    onClose={() => setIsSearchOpen(false)}
                                    autoFocus={true}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MOBILE MENU — right-side drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="xl:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[45]"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="xl:hidden fixed inset-0 bg-[#080B11] z-[60] flex flex-col"
                            style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.7)" }}
                        >
                            {/* Drawer header */}
                            <div className="flex items-center justify-between px-5 h-[60px] border-b border-white/[0.06] shrink-0">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-tp-accent rounded-lg flex items-center justify-center shadow-lg shadow-tp-accent/30">
                                        <Gamepad2 className="w-4 h-4 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="font-display font-bold text-[15px] text-white tracking-tight">TECHPLAY</span>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 mt-[2px]">GAMING PORTAL</span>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User card */}
                            {user && (
                                <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
                                    <Link href={`/profile/${user.username || 'me'}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 mb-3">
                                        {user.avatar_url ? (
                                            <Image src={user.avatar_url} alt={user.username || ''} width={40} height={40}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-tp-accent/40"
                                                unoptimized={user.avatar_url.includes('discord') || user.avatar_url.includes('gravatar')} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-tp-accent/15 border-2 border-tp-accent/30 flex items-center justify-center">
                                                <User className="w-5 h-5 text-tp-accent" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-bold text-[14px] leading-tight">{decodeHtml(user.display_name || user.username)}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">Level {Math.floor((user.xp || 0) / 1000) + 1} · {user.xp || 0} XP</div>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2">
                                        <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}
                                            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-slate-400 text-[11px] font-bold uppercase tracking-wide hover:text-white hover:bg-white/10 transition-colors">
                                            <Mail className="w-3.5 h-3.5" /> Messages
                                            {notifications.unread_messages > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifications.unread_messages}</span>}
                                        </Link>
                                        <Link href="/friends" onClick={() => setIsMobileMenuOpen(false)}
                                            className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-slate-400 text-[11px] font-bold uppercase tracking-wide hover:text-white hover:bg-white/10 transition-colors">
                                            <Users className="w-3.5 h-3.5" /> Friends
                                            {notifications.pending_requests > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">{notifications.pending_requests}</span>}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Nav */}
                            <nav className="flex-1 overflow-y-auto py-1">
                                {navItems.map((item) => {
                                    const Icon = NAV_ICONS[item.name];
                                    return (
                                        <div key={item.name}>
                                            {item.hasDropdown && item.children ? (
                                                <>
                                                    <button
                                                        onClick={() => setExpandedMobileItem(expandedMobileItem === item.name ? null : item.name)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group"
                                                    >
                                                        {Icon && (
                                                            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 group-hover:bg-tp-accent/10 group-hover:border-tp-accent/20 transition-all">
                                                                <Icon className="w-[15px] h-[15px] text-slate-400 group-hover:text-tp-accent transition-colors" />
                                                            </div>
                                                        )}
                                                        <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.07em] text-slate-200 group-hover:text-white transition-colors text-left">{item.name}</span>
                                                        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0", expandedMobileItem === item.name ? "rotate-180 text-tp-accent" : "")} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {expandedMobileItem === item.name && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.18 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="ml-[52px] mr-4 mb-1 pl-3 border-l border-tp-accent/25 flex flex-col gap-0.5">
                                                                    <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-tp-accent text-[11px] font-bold uppercase tracking-widest">
                                                                        All {item.name}
                                                                    </Link>
                                                                    {item.children.map((child, idx) => (
                                                                        <Link key={idx} href={child.href} onClick={() => setIsMobileMenuOpen(false)}
                                                                            className="py-1.5 text-[13px] text-slate-400 hover:text-white transition-colors">
                                                                            {child.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </>
                                            ) : (
                                                <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group">
                                                    {Icon && (
                                                        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center shrink-0 group-hover:bg-tp-accent/10 group-hover:border-tp-accent/20 transition-all">
                                                            <Icon className="w-[15px] h-[15px] text-slate-400 group-hover:text-tp-accent transition-colors" />
                                                        </div>
                                                    )}
                                                    <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-slate-200 group-hover:text-white transition-colors">{item.name}</span>
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Utility links */}
                                <div className="mx-4 mt-2 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-1">
                                    {UTILITY_LINKS.map((link) => (
                                        <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn("py-2 px-2 text-[11px] font-semibold tracking-wider rounded-lg hover:bg-white/5 transition-colors",
                                                link.highlight ? "text-tp-accent" : "text-slate-500 hover:text-slate-300")}>
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>
                            </nav>

                            {/* Bottom */}
                            <div className="shrink-0 border-t border-white/[0.06] px-4 py-4 flex flex-col gap-3">
                                {socialLinks.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {socialLinks.map((social, idx) => (
                                            <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-tp-accent/10 hover:border-tp-accent/30 transition-all">
                                                <social.icon className="w-[14px] h-[14px]" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {user ? (
                                    <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-2.5 text-red-400 border border-red-400/20 rounded-xl hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-wide">
                                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                                    </button>
                                ) : (
                                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center py-3 font-bold text-white bg-tp-accent hover:bg-tp-accent-hover rounded-xl transition-colors text-[12px] uppercase tracking-widest shadow-lg shadow-tp-accent/20">
                                        Sign In / Register
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
