import {
  AtSign, Briefcase, Camera, CircleDollarSign, Clapperboard, Cloud, Compass, FileText, Hash, Mail, Megaphone, MessageCircle,
  MessagesSquare, Newspaper, Play, Search, Send, Settings2, Target, Users, Video, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  editorial: FileText, seo: Search, "google-news": Newspaper, discover: Compass, facebook: Users, "facebook-groups": MessagesSquare,
  instagram: Camera, stories: Camera, reels: Clapperboard, tiktok: Video, youtube: Play, "youtube-shorts": Play, x: AtSign,
  threads: Hash, bluesky: Cloud, reddit: MessageCircle, discord: MessagesSquare, newsletter: Mail, push: Send, community: Users,
  pr: Megaphone, creator: Video, partnership: Briefcase, paid: CircleDollarSign, retargeting: Target, ops: Settings2,
};

export function ChannelIcon({ channel, size = 14 }: { channel: string; size?: number }) {
  const Icon = MAP[channel] || FileText;
  return <Icon size={size} aria-hidden />;
}

export const GROUP_LABEL: Record<string, string> = {
  editorial: "Publish & SEO", social: "Social", video: "Video", community: "Community", email: "Email & push",
  outreach: "PR, creators & partners", paid: "Paid & retargeting", ops: "Operations & product",
};
export const GROUP_ORDER = ["ops", "editorial", "social", "video", "community", "email", "outreach", "paid"];
