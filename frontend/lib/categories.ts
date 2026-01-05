import {
    Flame, Gamepad2, Monitor, Trophy, Briefcase, MessageSquare,
    Star, Clock, ThumbsUp, Gem, Rocket,
    Gauge, BookOpen, Newspaper
} from "lucide-react";

export const NEWS_CATEGORIES = [
    { id: "all", label: "All News", icon: Flame, slug: "all" },
    { id: "news-gaming", label: "Gaming", icon: Gamepad2, slug: "gaming" },
    { id: "news-consoles", label: "Consoles", icon: Monitor, slug: "consoles" },
    { id: "news-pc", label: "PC", icon: Monitor, slug: "pc" },
    { id: "news-e-sport", label: "Esports", icon: Trophy, slug: "e-sport" },
    { id: "news-industry", label: "Industry", icon: Briefcase, slug: "industry" },
    { id: "news-opinions", label: "Opinions", icon: MessageSquare, slug: "opinions" },
];

export const REVIEW_CATEGORIES = [
    { id: "all", label: "All Reviews", icon: Star, slug: "all" },
    { id: "reviews-latest", label: "Latest", icon: Clock, slug: "latest" },
    { id: "reviews-editors-choice", label: "Editor's Choice", icon: ThumbsUp, slug: "editors-choice" },
    { id: "reviews-aaa-titles", label: "AAA Titles", icon: Gamepad2, slug: "aaa-titles" },
    { id: "reviews-indie-gems", label: "Indie Gems", icon: Gem, slug: "indie-gems" },
    { id: "reviews-retro", label: "Retro", icon: Rocket, slug: "retro" },
];

export const HARDWARE_CATEGORIES = [
    { id: "tech", label: "All Hardware", icon: Monitor, slug: "all" }, // Main endpoint
    { id: "tech-reviews", label: "Reviews", icon: Star, slug: "reviews" },
    { id: "tech-benchmarks", label: "Benchmarks", icon: Gauge, slug: "benchmarks" },
    { id: "tech-guides", label: "Guides", icon: BookOpen, slug: "guides" },
    { id: "tech-news", label: "Tech News", icon: Newspaper, slug: "news" },
];
