import Link from "next/link";
import type { Gta6Entity } from "@/types";
import { resolveGta6Image } from "@/lib/gta6";

interface Props {
    /**
     * How the art sits in the card. `cover` fills it, which is right for
     * photographs; `contain` shows the whole thing, which is the only way a
     * cut-out strip — a 713x58 baseball bat — reads as what it is.
     */
    fit?: "cover" | "contain";
    entity: Gta6Entity;
    basePath: string;     // e.g. /gta6/characters
    subtitle?: string | null;
    linkable?: boolean;   // false = plain showcase card without a detail page link
}

export default function Gta6EntityCard({ entity, basePath, subtitle, linkable = true, fit = "cover" }: Props) {
    const img = resolveGta6Image(entity.image);

    const Wrapper = linkable ? Link : "div";
    const wrapperProps = linkable ? { href: `${basePath}/${entity.slug}` } : {};

    return (
        // @ts-expect-error — Wrapper is either Link (needs href) or div (doesn't)
        <Wrapper
            {...wrapperProps}
            className="group relative bg-[var(--surface-1)] border border-white/[0.07] rounded-[var(--radius-card)] overflow-hidden gta6-card"
        >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--gta-pink)] scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-2)]">
                {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={img}
                        alt={entity.name}
                        loading="lazy"
                        className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                            fit === "contain" ? "object-contain p-3" : "object-cover"
                        }`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--gta-pink)]/15 to-[var(--surface-2)]">
                        <span className="font-display text-[40px] font-black text-white/15 select-none">
                            {entity.name.charAt(0)}
                        </span>
                    </div>
                )}
                {entity.status === "rumored" && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#F59E0B] text-black text-[9px] font-bold rounded uppercase tracking-wider">
                        Rumored
                    </span>
                )}
            </div>

            <div className="p-4">
                <h3 className="text-[15px] font-bold text-white leading-tight truncate group-hover:text-[var(--gta-pink)] transition-colors">
                    {entity.name}
                </h3>
                {subtitle && (
                    <p className="text-[11px] text-[var(--gta-cyan)] mt-1 uppercase tracking-wide font-semibold">{subtitle}</p>
                )}
            </div>
        </Wrapper>
    );
}
