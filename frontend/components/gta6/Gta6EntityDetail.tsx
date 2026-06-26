import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Gta6Entity } from "@/types";

function resolveImage(image?: string | null): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${process.env.NEXT_PUBLIC_STORAGE_URL}/${image}`;
}

interface MetaRow { label: string; value: string }

interface Props {
    entity: Gta6Entity;
    sectionLabel: string;   // "Characters"
    sectionPath: string;    // /gta6/characters
    meta: MetaRow[];
}

export default function Gta6EntityDetail({ entity, sectionLabel, sectionPath, meta }: Props) {
    const hero = resolveImage(entity.image);
    const gallery = (entity.gallery ?? []).map(resolveImage).filter(Boolean) as string[];

    return (
        <div className="min-h-screen bg-[#05070A]">
            {/* Breadcrumb bar */}
            <div className="relative bg-[#0B0E14] border-b border-[#161B22]">
                <div className="gta6-accent-line absolute bottom-0 left-0 right-0" />
                <div className="max-w-[1100px] mx-auto px-4 xl:px-8 py-4">
                    <nav className="flex items-center gap-1.5 text-[12px] text-[#71717A]">
                        <Link href="/gta6" className="hover:text-[var(--gta-pink)] transition-colors">GTA 6</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href={sectionPath} className="hover:text-[var(--gta-pink)] transition-colors">{sectionLabel}</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#A1A1AA] truncate">{entity.name}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-[1100px] mx-auto px-4 xl:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-8">
                    {/* Image */}
                    <div>
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#10141B] border border-[#161B22]">
                            {hero ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={hero} alt={entity.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--gta-pink)]/15 to-[#1A1F26]">
                                    <span className="font-display text-[64px] font-black text-white/15">{entity.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        {gallery.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {gallery.map((g, i) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={i} src={g} alt={`${entity.name} ${i + 1}`} className="aspect-square w-full object-cover rounded-lg border border-[#161B22]" />
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
                                    <span key={m.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0E14] border border-[#161B22] text-[12px]">
                                        <span className="text-[#71717A]">{m.label}:</span>
                                        <span className="text-white font-semibold capitalize">{m.value}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {entity.description ? (
                            <p className="text-[#A1A1AA] text-[15px] leading-relaxed whitespace-pre-line">{entity.description}</p>
                        ) : (
                            <p className="text-[#71717A] text-[14px] italic">More details coming soon.</p>
                        )}

                        <div className="mt-8">
                            <Link href={sectionPath} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B0E14] border border-[#161B22] text-white text-[13px] font-semibold hover:border-[var(--gta-pink)]/40 transition-colors">
                                ← Back to {sectionLabel}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
