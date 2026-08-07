import Link from "next/link";
import Image from "next/image";
import { Star, Calendar, ChevronRight, Gamepad2 } from "lucide-react";

export interface LinkedGame {
    slug: string;
    name: string;
    cover_url: string | null;
    released: string | null;
    rating: number | null;
    genres: string[];
    platforms: string[];
    critic_scores?: {
        opencritic?: { score?: number | null; url?: string | null } | null;
        metacritic?: { score?: number | null; url?: string | null } | null;
    } | null;
}

const tone = (score: number) =>
    score >= 75 ? "bg-emerald-600/90" : score >= 50 ? "bg-yellow-600/90" : "bg-red-700/90";

/**
 * The game a piece of content is about, as a sidebar card — the spine
 * between the newsroom and the games database made visible. One shape for
 * news, reviews and guides; the payload comes from ContentGameLinker.
 */
export default function GameInfoCard({ game }: { game: LinkedGame }) {
    const year = game.released?.slice(0, 4);
    const oc = game.critic_scores?.opencritic?.score ?? null;
    const mc = game.critic_scores?.metacritic?.score ?? null;

    return (
        <div className="rounded-[8px] border border-white/[0.07] bg-[var(--surface-1)] overflow-hidden">
            <p className="px-4 pt-3.5 font-display text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
                About this game
            </p>

            <Link href={`/games/${game.slug}`} prefetch={false} className="group block">
                <div className="relative mx-4 mt-3 aspect-video rounded-[5px] overflow-hidden border border-white/[0.06] bg-black/40">
                    {game.cover_url ? (
                        <Image src={game.cover_url} alt={game.name} fill sizes="308px"
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-white/10" />
                        </div>
                    )}
                </div>

                <div className="px-4 pt-3">
                    <p className="font-display text-[15px] font-black text-white leading-tight group-hover:text-[var(--accent)] transition-colors">
                        {game.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-white/40">
                        {year && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {year}
                            </span>
                        )}
                        {(game.rating ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="font-display font-black tabular-nums">{Number(game.rating).toFixed(1)}</span>
                            </span>
                        )}
                        {game.genres.slice(0, 2).map((g) => (
                            <span key={g}>{g}</span>
                        ))}
                    </div>
                </div>
            </Link>

            {(oc !== null || mc !== null) && (
                <div className="px-4 pt-3 flex flex-wrap gap-2">
                    {oc !== null && (
                        <span className="inline-flex items-center overflow-hidden rounded-[5px] border border-white/[0.1]">
                            <span className={`px-1.5 py-0.5 font-display text-[12px] font-black tabular-nums text-white leading-none ${tone(oc)}`}>{oc}</span>
                            <span className="px-1.5 py-0.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50 bg-black/40 leading-none">OpenCritic</span>
                        </span>
                    )}
                    {mc !== null && (
                        <span className="inline-flex items-center overflow-hidden rounded-[5px] border border-white/[0.1]">
                            <span className={`px-1.5 py-0.5 font-display text-[12px] font-black tabular-nums text-white leading-none ${tone(mc)}`}>{mc}</span>
                            <span className="px-1.5 py-0.5 font-display text-[8.5px] font-black uppercase tracking-[0.1em] text-white/50 bg-black/40 leading-none">Metacritic</span>
                        </span>
                    )}
                </div>
            )}

            {game.platforms.length > 0 && (
                <div className="px-4 pt-2.5 flex flex-wrap gap-1.5">
                    {game.platforms.map((p) => (
                        <span key={p} className="rounded-[5px] border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/55">
                            {p}
                        </span>
                    ))}
                </div>
            )}

            <Link href={`/games/${game.slug}`} prefetch={false}
                className="btn-command btn-command-quiet mt-3.5 mx-4 mb-4 flex items-center justify-center gap-1.5 h-9 bg-[var(--fill-2,rgba(255,255,255,0.05))] font-display text-[10px] font-black uppercase tracking-[0.12em] text-white/60 hover:text-white hover:bg-[var(--fill-3,rgba(255,255,255,0.09))] transition-colors">
                Full game page <ChevronRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}
