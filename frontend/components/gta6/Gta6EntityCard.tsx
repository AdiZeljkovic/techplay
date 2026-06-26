import Link from "next/link";
import type { Gta6Entity } from "@/types";

function resolveImage(image?: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

interface Props {
    entity: Gta6Entity;
    basePath: string;     // e.g. /gta6/characters
    subtitle?: string | null;
}

export default function Gta6EntityCard({ entity, basePath, subtitle }: Props) {
    const img = resolveImage(entity.image);

    return (
        <Link
            href={`${basePath}/${entity.slug}`}
            className="group relative bg-[#0B0E14] border border-[#161B22] rounded-xl overflow-hidden gta6-card"
        >
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--gta-pink)] scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300 z-20" />

            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#10141B]">
                {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={img}
                        alt={entity.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--accent)]/15 to-[#1A1F26]">
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
        </Link>
    );
}
