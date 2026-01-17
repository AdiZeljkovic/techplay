"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import axios from "@/lib/axios";
import {
    Menu, X, Search, User, LogOut, ShoppingCart,
    ChevronDown, Facebook, Twitter, Instagram, Youtube, Linkedin,
    Gamepad2, Mail, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import SearchDropdown from "./SearchDropdown";

// Social Icon Mapping
const SOCIAL_ICON_MAP: Record<string, any> = {
    twitter_url: Twitter,
    facebook_url: Facebook,
    instagram_url: Instagram,
    youtube_url: Youtube,
    discord_url: Linkedin, // Using Linkedin as placeholder for Discord
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
function NavItem({ item }: { item: NavItemType }) {
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
                    "flex items-center gap-1 text-[13px] font-bold tracking-wide transition-colors whitespace-nowrap px-1 py-1",
                    isActive || isHovered ? "text-[var(--accent)]" : "text-gray-300 hover:text-white"
                )}
            >
                {item.name}
                {item.hasDropdown && (
                    <ChevronDown className={cn(
                        "w-3 h-3 mt-0.5 opacity-70 transition-transform duration-200",
                        isHovered ? "rotate-180" : "rotate-0"
                    )} />
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
                        className="absolute top-full left-0 mt-2 w-56 bg-[#001540]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-2"
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const { settings } = useSiteSettings();
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItemType[]>(INITIAL_NAV_ITEMS);
    const [notifications, setNotifications] = useState({ unread_messages: 0, pending_requests: 0 });

    // Build dynamic social links from settings
    const socialLinks = Object.keys(SOCIAL_ICON_MAP)
        .filter(key => settings[key])
        .map(key => ({
            icon: SOCIAL_ICON_MAP[key],
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

    // Fetch Notifications (Poll every 30s)
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/user/notifications/counts');
                setNotifications(res.data);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications(); // Initial fetch
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, [user]);

    // Close mobile menu on route change
    useEffect(() => setIsMobileMenuOpen(false), [pathname]);

    return (
        <div className="w-full font-sans sticky top-0 z-50">
            {/* TOP BAR */}
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
                                <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                                    <social.icon className="w-3.5 h-3.5" />
                                </Link>
                            ))}
                        </div>

                        <Link href="/cart" className="relative text-gray-400 hover:text-white transition-colors">
                            <ShoppingCart className="w-4 h-4" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[var(--accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
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
                                        <img
                                            src={user.avatar_url}
                                            alt={user.username}
                                            className="w-8 h-8 rounded-full object-cover border border-white/20 group-hover:border-[var(--accent)] transition-colors"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-[var(--accent)] transition-colors text-white">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-gray-200 font-medium group-hover:text-[var(--accent)] text-xs leading-tight truncate max-w-[120px]">
                                            {user.display_name || user.username || "My Profile"}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono leading-tight">
                                            Lvl {Math.floor((user.xp || 0) / 1000) + 1}
                                        </span>
                                    </div>
                                </Link>
                                <button onClick={logout} className="ml-2 text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full" title="Sign Out">
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
                            <NavItem key={item.name} item={item} />
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
                            className="hidden md:flex items-center gap-2 px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-bold rounded-full transition-all shadow-lg shadow-[var(--accent)]/20 uppercase tracking-wide"
                        >
                            SUPPORT US
                        </Link>

                        {/* Mobile Toggle */}
                        <button
                            className="xl:hidden p-2 text-gray-300 hover:text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* MOBILE MENU overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "100vh" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="xl:hidden fixed inset-0 top-[80px] bg-[#00215E] z-50 overflow-y-auto"
                    >
                        <div className="container mx-auto px-4 py-6 space-y-6">
                            {/* User Section for Mobile */}
                            {user ? (
                                <div className="bg-[#001540] rounded-2xl p-4 border border-white/10">
                                    <Link
                                        href={`/profile/${user.username || 'me'}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-4"
                                    >
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.username} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--accent)]" />
                                        ) : (
                                            <div className="w-14 h-14 bg-[var(--accent)]/20 rounded-full flex items-center justify-center text-[var(--accent)] text-xl font-bold">
                                                {user.username?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-lg">{user.display_name || user.username}</p>
                                            <p className="text-gray-400 text-sm">Level {Math.floor((user.xp || 0) / 1000) + 1}</p>
                                        </div>
                                    </Link>
                                    <div className="flex gap-2 mt-4">
                                        <Link
                                            href="/messages"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
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
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
                                        >
                                            <Users className="w-5 h-5" />
                                            <span className="text-sm font-medium">Friends</span>
                                            {notifications.pending_requests > 0 && (
                                                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications.pending_requests}</span>
                                            )}
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                                        className="w-full mt-3 py-3 text-red-400 hover:text-red-300 text-sm font-medium border border-red-400/20 rounded-xl hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-colors"
                                >
                                    <User className="w-5 h-5" />
                                    Sign In / Register
                                </Link>
                            )}

                            {/* Search for Mobile */}
                            <SearchDropdown placeholder="Search TechPlay..." isMobile />

                            <nav className="flex flex-col space-y-2">
                                {navItems.map((item) => (
                                    <div key={item.name} className="flex flex-col">
                                        <Link
                                            href={item.href}
                                            onClick={() => !item.children && setIsMobileMenuOpen(false)}
                                            className="py-3 px-4 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl font-bold text-lg transition-colors flex justify-between items-center"
                                        >
                                            {item.name}
                                            {item.hasDropdown && <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </Link>

                                        {/* Mobile Submenu (Simple Indent) */}
                                        {item.children && (
                                            <div className="pl-8 flex flex-col gap-2 mt-1 mb-2">
                                                {item.children.map((child, idx) => (
                                                    <Link
                                                        key={idx}
                                                        href={child.href}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                        className="py-2 text-gray-400 hover:text-[var(--accent)] text-sm font-medium"
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </nav>

                            {/* Utility Links Mobile */}
                            <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-y-4">
                                {UTILITY_LINKS.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn("text-xs font-semibold tracking-wider hover:text-white", link.highlight ? "text-[var(--accent)]" : "text-gray-500")}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile Footer Area */}
                            <div className="pt-6 flex flex-col gap-6">
                                <div className="flex justify-center gap-6">
                                    {socialLinks.map((social, idx) => (
                                        <Link key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                                            <social.icon className="w-6 h-6" />
                                        </Link>
                                    ))}
                                </div>
                                {!user && (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full text-center text-sm font-bold text-white bg-white/10 border border-white/10 px-4 py-3 rounded-xl uppercase tracking-wider"
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
