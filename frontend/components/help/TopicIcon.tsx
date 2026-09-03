import {
    BarChart3,
    Gift,
    Grid2x2,
    KeyRound,
    LifeBuoy,
    Link2,
    Mail,
    MessagesSquare,
    MessageSquareText,
    ShieldCheck,
    ShoppingBag,
    UserCircle2,
    Wrench,
    type LucideIcon,
} from "lucide-react";

/**
 * The mark on a topic card.
 *
 * The icon is stored on the topic as a **heroicon** name, because that is what
 * the Filament admin picks from — its icon field is a heroicon set and the
 * editor choosing one is choosing from that list. The site draws with Lucide.
 * So one has to be translated into the other, and this is the only place that
 * knows both names.
 *
 * The alternative was storing a Lucide name and giving the admin a text box to
 * type it into, which turns a picker into a spelling test.
 *
 * Anything unmapped falls back to the lifebuoy rather than to nothing: a card
 * with no mark next to eleven that have one reads as broken, and a new topic
 * added in the admin should never be able to produce that.
 */
const MARKS: Record<string, LucideIcon> = {
    "heroicon-o-key": KeyRound,
    "heroicon-o-link": Link2,
    "heroicon-o-user-circle": UserCircle2,
    "heroicon-o-chart-bar": BarChart3,
    "heroicon-o-chat-bubble-left-ellipsis": MessageSquareText,
    "heroicon-o-chat-bubble-left-right": MessagesSquare,
    "heroicon-o-squares-2x2": Grid2x2,
    "heroicon-o-wrench-screwdriver": Wrench,
    "heroicon-o-gift": Gift,
    "heroicon-o-shopping-bag": ShoppingBag,
    "heroicon-o-envelope": Mail,
    "heroicon-o-shield-check": ShieldCheck,
    "heroicon-o-lifebuoy": LifeBuoy,
};

export default function TopicIcon({
    icon,
    className = "w-[18px] h-[18px]",
}: {
    icon?: string | null;
    className?: string;
}) {
    const Mark = (icon && MARKS[icon]) || LifeBuoy;

    return <Mark className={className} strokeWidth={1.75} aria-hidden />;
}
