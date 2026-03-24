"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useMobileMenu } from "@/context/MobileMenuContext";
import axios from "@/lib/axios";
import {
    Menu, X, Search, User, LogOut, ShoppingCart,
    ChevronDown, Facebook, Twitter, Instagram, Youtube,
    Gamepad2, Mail, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdown from "./SearchDropdown";
import { decodeHtml } from "@/lib/decode";

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
}

interface NavItemType {
    name: string;
    href: string;
    hasDropdown?: boolean;
    children?: NavSubCategory[];
}

// Initial Nav Items (will be populated with children from API)
const INITIAL_NAV_ITEMS: NavItemType[] = [
    { name: "NEWS", href: "/news", hasDropdown: true },
    { name: "REVIEWS", href: "/reviews", hasDropdown: true },
    { name: "TECH", href: "/hardware", hasDropdown: true },
    { name: "VIDEO", href: "/videos" },
    { name: "GUIDES", href: "/guides" },
    { name: "CALENDAR", href: "/calendar" },
    { name: "DATABASE", href: "/games" },
    { name: "FORUM", href: "/forum" },
    { name: "SHOP", href: "/shop" },
];

// Logo Component
function BrandLogo() {
    return (
        <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Gamepad2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
                <span className="font-bold text-2xl leading-none text-white tracking-tight">
                    TECH<span className="text-[var(--accent)]">PLAY</span>
                </span>
                <span className="text-[10px] font-medium text-gray-400 tracking-[0.2em] uppercase leading-none mt-1 group-hover:text-[var(--accent)] transition-colors">
                    Gaming Portal
                </span>
            </div>
        </Link>
    );
}

// Nav Dropdown Component
function NavItem({ item, badge }: { item: NavItemType; badge?: number }) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(item.href);
    const [isHovered, setIsHovered] = useState(false);

    // Close dropdown when route changes
    useEffect(() => setIsHovered(false), [pathname]);

    return (
        <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-1 text-[13px] font-bold tracking-wide transition-colors whitespace-nowrap px-2 py-2.5",
                    isActive || isHovered ? "text-[var(--accent)]" : "text-gray-300 hover:text-white"
                )}
            >
                {item.name}
                {badge ? (
                    <span className="ml-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1" aria-label={`${badge} unread notifications`}>
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
                {item.hasDropdown && (
                    <ChevronDown className={cn(
                        "w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200",
                        isHovered ? "rotate-180" : "rotate-0"
                    )} aria-hidden="true" />
                )}
            </Link>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {item.hasDropdown && item.children && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-[min(224px,calc(100vw-2rem))] bg-[#001540]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-2"
                        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
                    >
                        <div className="flex flex-col gap-1">
                            {item.children.map((child, idx) => (
                                <Link
                                    key={idx}
                                    href={child.href}
                                    className="block px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                    {child.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Header() {
    const { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen } = useMobileMenu();
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const { settings } = useSiteSettings();
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItemType[]>(INITIAL_NAV_ITEMS);
    const [notifications, setNotifications] = useState({ unread_messages: 0, pending_requests: 0, forum_replies: 0 });

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
                    if (tree[key]) {
                        return { ...item, children: tree[key] };
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

    // Close mobile menu on route change
    useEffect(() => setIsMobileMenuOpen(false), [pathname]);

    return (
        <div className="w-full font-sans sticky top-0 z-50">
            {/* MOBILE: TOP BAR (Sign In / Search) */}
            <div className="bg-[#000B25] border-b border-white/5 xl:hidden">
                <div className="container mx-auto px-4 flex justify-between items-center h-10">
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

                {/* Mobile Search Dropdown */}
                <AnimatePresence>
                    {mobileSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-white/5"
                        >
                            <div className="container mx-auto px-4 py-3">
                                <SearchDropdown placeholder="Search TechPlay..." isMobile />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* DESKTOP TOP BAR */}
            <div className="bg-[#001540] border-b border-white/5 text-xs py-1 hidden xl:block">
                <div className="container mx-auto px-4 flex justify-between items-center h-9">
                    {/* Left: Utility Links */}
                    <div className="flex items-center gap-6">
                        {UTILITY_LINKS.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "font-semibold transition-colors hover:text-white uppercase tracking-wider text-[10px]",
                                    link.highlight ? "text-[var(--accent)]" : "text-gray-400"
                                )}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right: Socials & Auth */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                            {socialLinks.map((social, idx) => (
                                <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label={`Follow us on ${social.name}`}>
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
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#001540]">
                                                {notifications.unread_messages}
                                            </span>
                                        )}
                                    </Link>
                                    <Link href="/friends" className="p-2 text-gray-400 hover:text-[var(--accent)] hover:bg-white/5 rounded-full transition-colors relative" title="Friends">
                                        <Users className="w-5 h-5" />
                                        {notifications.pending_requests > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#001540]">
                                                {notifications.pending_requests}
                                            </span>
                                        )}
                                    </Link>
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
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 text-white font-semibold rounded transition-all text-[10px] uppercase tracking-wide border border-white/5"
                            >
                                <User className="w-3 h-3" />
                                Sign In / Register
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN HEADER */}
            <header className="bg-[#00215E]/95 backdrop-blur-md border-b border-white/5 shadow-lg relative z-40">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    {/* Logo (Left) */}
                    <BrandLogo />

                    {/* Desktop Nav (Center) */}
                    <nav className="hidden xl:flex items-center gap-5 h-full">
                        {navItems.map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                badge={item.name === 'FORUM' && notifications.forum_replies > 0 ? notifications.forum_replies : undefined}
                            />
                        ))}
                    </nav>

                    {/* Actions (Right) */}
                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="hidden 2xl:block">
                            <SearchDropdown placeholder="Search articles..." />
                        </div>

                        {/* Support Us Button */}
                        <Link
                            href="/support"
                            className="hidden md:flex items-center gap-2 px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-[var(--accent)]/20 uppercase tracking-wide"
                        >
                            SUPPORT US
                        </Link>

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

            {/* MOBILE MENU overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "tween", duration: 0.25 }}
                        className="xl:hidden fixed inset-0 top-[128px] bg-[#00215E] z-50 overflow-y-auto"
                    >
                        <div className="container mx-auto px-4 py-4 space-y-4">
                            {/* User Quick Actions (if logged in) */}
                            {user && (
                                <div className="flex gap-2">
                                    <Link
                                        href="/messages"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#001540] rounded-xl text-gray-300 hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <Mail className="w-5 h-5" />
                                        <span className="text-sm font-medium">Messages</span>
                                        {notifications.unread_messages > 0 && (
                                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.unread_messages}</span>
                                        )}
                                    </Link>
                                    <Link
                                        href="/friends"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#001540] rounded-xl text-gray-300 hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <Users className="w-5 h-5" />
                                        <span className="text-sm font-medium">Friends</span>
                                        {notifications.pending_requests > 0 && (
                                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.pending_requests}</span>
                                        )}
                                    </Link>
                                </div>
                            )}

                            {/* Navigation with Accordion Dropdowns */}
                            <nav className="flex flex-col">
                                {navItems.map((item) => (
                                    <div key={item.name} className="border-b border-white/5 last:border-b-0">
                                        {item.hasDropdown && item.children ? (
                                            <>
                                                {/* Accordion Header */}
                                                <button
                                                    onClick={() => setExpandedMobileItem(
                                                        expandedMobileItem === item.name ? null : item.name
                                                    )}
                                                    className="w-full py-4 px-2 text-gray-300 hover:text-white font-bold text-base transition-colors flex justify-between items-center"
                                                >
                                                    {item.name}
                                                    <ChevronDown className={cn(
                                                        "w-5 h-5 text-gray-400 transition-transform duration-200",
                                                        expandedMobileItem === item.name ? "rotate-180" : ""
                                                    )} />
                                                </button>

                                                {/* Accordion Content */}
                                                <AnimatePresence>
                                                    {expandedMobileItem === item.name && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pl-4 pb-3 flex flex-col gap-1">
                                                                {/* Link to main category page */}
                                                                <Link
                                                                    href={item.href}
                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                    className="py-2.5 px-3 text-[var(--accent)] text-sm font-semibold rounded-lg hover:bg-white/5 transition-colors"
                                                                >
                                                                    All {item.name}
                                                                </Link>
                                                                {item.children.map((child, idx) => (
                                                                    <Link
                                                                        key={idx}
                                                                        href={child.href}
                                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                                        className="py-2.5 px-3 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium rounded-lg transition-colors"
                                                                    >
                                                                        {child.name}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </>
                                        ) : (
                                            <Link
                                                href={item.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="block py-4 px-2 text-gray-300 hover:text-white font-bold text-base transition-colors"
                                            >
                                                {item.name}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </nav>

                            {/* Utility Links Mobile */}
                            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
                                {UTILITY_LINKS.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn(
                                            "text-xs font-semibold tracking-wider hover:text-white py-3 px-3 rounded-lg hover:bg-white/5 transition-colors",
                                            link.highlight ? "text-[var(--accent)]" : "text-gray-400"
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Social Links & Sign Out */}
                            <div className="pt-4 flex flex-col gap-4">
                                <div className="flex justify-center gap-6">
                                    {socialLinks.map((social, idx) => (
                                        <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-2">
                                            <social.icon className="w-5 h-5" />
                                        </Link>
                                    ))}
                                </div>
                                {user ? (
                                    <button
                                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="w-full py-3 text-red-400 hover:text-red-300 text-sm font-medium border border-red-400/20 rounded-xl hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center py-3 font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-xl transition-colors"
                                    >
                                        Sign In / Register
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
