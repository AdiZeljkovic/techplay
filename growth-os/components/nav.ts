import {
  BookOpen, CalendarDays, CircleDollarSign, Clapperboard, Copy, FileText, FlaskConical, Handshake, Image, LayoutDashboard,
  Lightbulb, LineChart, Link2, ListChecks, Mail, Megaphone, Newspaper, Search, Settings, Share2, Sun, Users,
} from "lucide-react";

export const NAV = [
  { group: "Run the day", items: [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/today", label: "Today", icon: Sun },
    { href: "/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/tasks", label: "Tasks", icon: ListChecks },
    { href: "/copy", label: "Copy Library", icon: Copy },
    { href: "/assets", label: "Assets", icon: Image },
  ] },
  { group: "Plan & channels", items: [
    { href: "/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/content", label: "Content", icon: FileText },
    { href: "/social", label: "Social", icon: Share2 },
    { href: "/seo", label: "SEO", icon: Search },
    { href: "/community", label: "Community", icon: Users },
    { href: "/video", label: "Video", icon: Clapperboard },
    { href: "/email", label: "Email", icon: Mail },
    { href: "/paid", label: "Paid Media", icon: CircleDollarSign },
    { href: "/pr", label: "PR", icon: Newspaper },
    { href: "/partnerships", label: "Partnerships", icon: Handshake },
  ] },
  { group: "Learn & measure", items: [
    { href: "/experiments", label: "Experiments", icon: FlaskConical },
    { href: "/analytics", label: "Analytics", icon: LineChart },
    { href: "/opportunities", label: "Opportunities", icon: Lightbulb },
    { href: "/utm", label: "UTM Builder", icon: Link2 },
  ] },
  { group: "System", items: [
    { href: "/docs", label: "Strategy docs", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ] },
];
