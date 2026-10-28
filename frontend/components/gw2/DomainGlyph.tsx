import { Award, Bird, BookOpen, Compass, Gift, Layers, Shield, Sparkles, Swords, type LucideIcon } from "lucide-react";

/**
 * A domain's own mark, for where the subject has no picture of its own.
 *
 * About one achievement in twelve has neither an icon nor a category with one,
 * and an unspent-points card is about a region, which the API draws nothing
 * for. The mockups never leave a card without a glyph in its ring, so these
 * stand in — the same marks the dashboard's readouts use.
 */
const GLYPHS: Record<string, LucideIcon> = {
    gear: Shield,
    fractals: Layers,
    masteries: Sparkles,
    achievements: Award,
    mounts: Bird,
    raids: Swords,
    content: Swords,
    vault: Gift,
    story: BookOpen,
};

export default function DomainGlyph({ domain, size = 20 }: { domain: string; size?: number }) {
    const Icon = GLYPHS[domain] ?? Compass;

    return <Icon size={size} strokeWidth={1.6} aria-hidden />;
}
