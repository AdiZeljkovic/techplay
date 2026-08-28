import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Gta6Entity } from "@/types";
import { resolveGta6Image } from "@/lib/gta6";

interface MetaRow { label: string; value: string }

interface Props {
    entity: Gta6Entity;
    sectionLabel: string;   // "Characters"
    sectionPath: string;    // /gta6/characters
    meta: MetaRow[];
}

export default function Gta6EntityDetail({ entity, sectionLabel, sectionPath, meta }: Props) {
    const hero = resolveGta6Image(entity.image);
    const gallery = (entity.gallery ?? []).map(resolveGta6Image).filter(Boolean) as string[];

    return (
        <div className="min-h-screen bg-[var(--surface-0)]">
            {/* Breadcrumb bar */}
            <div className="relative bg-[var(--surface-1)] border-b border-white/[0.07]">
                <div className="gta6-accent-line absolute bottom-0 left-0 right-0" />
                <div className="max-w-[1100px] mx-auto px-4 xl:px-8 py-4">
                    <nav className="flex items-center gap-1.5 text-[12px] text-white/50">
                        <Link href="/gta6" className="hover:text-[var(--gta-pink)] transition-colors">GTA 6</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href={sectionPath} className="hover:text-[var(--gta-pink)] transition-colors">{sectionLabel}</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-white/45 truncate">{entity.name}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 xl:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-8">
                    {/* Image */}
                    <div>
                        <div className="relative aspect-[4/3] w-full rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface-2)] border border-white/[0.07]">
                            {hero ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={hero} alt={entity.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--gta-pink)]/15 to-[var(--surface-2)]">
                                    <span className="font-display text-[64px] font-black text-white/15">{entity.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        {gallery.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {gallery.map((g, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={g} alt={`${entity.name} ${i + 1}`} className="aspect-square w-full object-cover rounded-[var(--radius-card)] border border-white/[0.07]" />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        {entity.status === "rumored" && (
                            <span className="inline-block px-2 py-0.5 bg-[#F59E0B] text-black text-[10px] font-bold rounded uppercase tracking-wider mb-3">
                                Rumored
                            </span>
                        )}
                        <h1 className="font-display text-[34px] md:text-[44px] font-black text-white leading-tight mb-4">
                            {entity.name}
                        </h1>

                        {meta.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {meta.map(m => (
                                    <span key={m.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-[12px]">
                                        <span className="text-white/35">{m.label}:</span>
                                        <span className="text-white font-semibold capitalize">{m.value}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {entity.description ? (
                            <p className="text-white/45 text-[15px] leading-relaxed whitespace-pre-line">{entity.description}</p>
                        ) : (
                            <p className="text-white/50 text-[14px] italic">More details coming soon.</p>
                        )}

                        <div className="mt-8">
                            <Link href={sectionPath} className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-card)] bg-[var(--surface-1)] border border-white/[0.07] text-white text-[13px] font-semibold hover:border-[var(--gta-pink)]/40 transition-colors">
                                ← Back to {sectionLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
