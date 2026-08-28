"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, Trash2, X, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import axios from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface Aggregate {
    count: number;
    average: number | null;
    distribution: Record<number, number>;
}

interface Review {
    id: number;
    rating: number;
    review: string | null;
    created_at: string;
    user: { id: number; name: string; username: string; avatar: string | null };
}

interface TechplayScore {
    score: number;
    editorial: number | null;
    community: number | null;
}

interface ReviewsResponse {
    aggregate: Aggregate;
    techplay_score: TechplayScore | null;
    reviews: { data: Review[]; last_page: number; current_page: number };
}

interface Props {
    slug: string;
    /** From the page payload; zero skips the list request entirely. */
    ratingsCount?: number;
}

/**
 * @param ratingsCount  How many ratings the server says exist, from the payload
 *   the page already fetched. Zero means the list is not requested: Googlebot
 *   made 18,225 of those calls in nine days and 99% came back with an empty
 *   aggregate, because almost no game in a catalogue of 332,455 has been rated.
 *
 *   The rating form is untouched — a reader can still be the first to rate, and
 *   `fetchMyRating` only ever runs for a signed-in visitor, which a crawler is
 *   not.
 */
export default function GameRating({ slug, ratingsCount = 0 }: Props) {
    const { user } = useAuth();
    const isAuthenticated = !!user;
    const [aggregate, setAggregate]     = useState<Aggregate | null>(null);
    const [techplayScore, setTechplayScore] = useState<TechplayScore | null>(null);
    const [reviews, setReviews]         = useState<Review[]>([]);
    const [lastPage, setLastPage]       = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [myRating, setMyRating]       = useState<number>(0);
    const [myReview, setMyReview]       = useState<string>("");
    const [hovered, setHovered]         = useState<number>(0);
    const [loading, setLoading]         = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [showForm, setShowForm]       = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [submitSuccess, setSubmitSuccess]   = useState(false);
    const [submitError, setSubmitError]       = useState<string | null>(null);
    const [isDraft, setIsDraft]               = useState(false);

    useEffect(() => {
        if (ratingsCount > 0) fetchRatings(1);
    }, [slug, ratingsCount]);

    useEffect(() => {
        if (isAuthenticated) fetchMyRating();
    }, [slug, isAuthenticated]);

    async function fetchRatings(page: number) {
        setLoading(true);
        try {
            const res = await axios.get(`/games/${slug}/ratings?page=${page}`);
            const data: ReviewsResponse = res.data;
            setAggregate(data.aggregate);
            setTechplayScore(data.techplay_score ?? null);
            setReviews((prev) => page === 1 ? data.reviews.data : [...prev, ...data.reviews.data]);
            setLastPage(data.reviews.last_page);
            setCurrentPage(page);
        } catch {}
        setLoading(false);
    }

    async function fetchMyRating() {
        try {
            const res = await axios.get(`/games/${slug}/ratings/my`);
            if (res.data) {
                setMyRating(res.data.rating);
                setMyReview(res.data.review ?? "");
                setIsDraft(!!res.data.is_draft);
            }
        } catch {}
    }

    async function submitRating(asDraft = false) {
        if (!myRating) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            await axios.post(`/games/${slug}/ratings`, {
                rating: myRating,
                review: myReview.trim() || null,
                is_draft: asDraft,
            });
            setIsDraft(asDraft);
            setShowForm(asDraft); // keep the editor open so a draft can be finished
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 3000);
            if (!asDraft) fetchRatings(1);
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.response?.data?.errors?.review?.[0] ?? "Something went wrong.";
            setSubmitError(msg);
        }
        setSubmitting(false);
    }

    async function deleteRating() {
        setSubmitting(true);
        try {
            await axios.delete(`/games/${slug}/ratings`);
            setMyRating(0);
            setMyReview("");
            setShowForm(false);
            fetchRatings(1);
        } catch {}
        setSubmitting(false);
    }

    const starLabel = ["", "Terrible", "Bad", "OK", "Good", "Excellent"];

    /* The panel below speaks the language the rest of the game page speaks. It
       carried a hardcoded `#0f1221` from an earlier design — a colour in no
       token file, so it drifted from every surface around it as those changed. */
    return (
        <>
        <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
                <h2 className="flex items-center gap-2 font-display text-[11px] font-black uppercase tracking-[0.14em] text-white/45">
                    <Star className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Reader ratings
                </h2>
                {aggregate && aggregate.count > 0 && (
                    <span className="font-display text-[10px] font-bold tabular-nums text-white/45">
                        {aggregate.count.toLocaleString()}
                    </span>
                )}
            </div>

            <div className="p-4 space-y-4">

            {/* TechPlay Score — editorial + community blend */}
            {techplayScore && (
                <div className="flex items-center gap-4 rounded-[10px] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-3.5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent)]">
                        <span className="font-display text-[22px] font-black leading-none tabular-nums text-white">
                            {techplayScore.score.toFixed(1)}
                        </span>
                    </span>
                    <div className="min-w-0">
                        <p className="font-display text-[10px] font-black uppercase tracking-[0.14em] text-white">TechPlay Score</p>
                        <p className="mt-1 text-[12px] text-white/45">
                            {techplayScore.editorial != null && `Editorial ${techplayScore.editorial.toFixed(1)}`}
                            {techplayScore.editorial != null && techplayScore.community != null && " · "}
                            {techplayScore.community != null && `Readers ${techplayScore.community.toFixed(1)}`}
                            {" / 10"}
                        </p>
                    </div>
                </div>
            )}

            {/* Aggregate stats */}
            {aggregate && aggregate.count > 0 && (
                <div className="flex gap-5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <div className="shrink-0 text-center">
                        <p className="font-display text-[34px] font-black leading-none tabular-nums text-white">
                            {aggregate.average?.toFixed(1)}
                        </p>
                        <div className="mt-1.5 flex justify-center gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(aggregate.average ?? 0) ? "text-amber-400 fill-amber-400" : "text-white/15"}`} />
                            ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-white/50 tabular-nums">
                            {aggregate.count.toLocaleString()} {aggregate.count === 1 ? "rating" : "ratings"}
                        </p>
                    </div>
                    <div className="flex-1 space-y-1.5 self-center">
                        {[5,4,3,2,1].map((s) => {
                            const pct = aggregate.count > 0 ? ((aggregate.distribution[s] ?? 0) / aggregate.count * 100) : 0;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <span className="w-3 font-display text-[10px] font-bold tabular-nums text-white/50">{s}</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                                        <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="w-6 text-right text-[10.5px] tabular-nums text-white/50">{aggregate.distribution[s] ?? 0}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Rating form */}
            {isAuthenticated ? (
                <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3.5">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50 mb-2.5">Your rating</p>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map((s) => (
                            <button key={s}
                                onMouseEnter={() => setHovered(s)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => { setMyRating(s); setShowForm(true); }}
                                /* Five stars, and the API validates 1–5. The
                                   label said "out of 10", so a screen reader
                                   announced a scale this control does not have. */
                                aria-label={`Rate ${s} out of 5`}
                                className="p-1 transition-transform hover:scale-110">
                                <Star className={`w-7 h-7 transition-colors ${
                                    s <= (hovered || myRating) ? "text-amber-400 fill-amber-400" : "text-white/15"
                                }`} />
                            </button>
                        ))}
                        {(hovered || myRating) > 0 && (
                            <span className="ml-2 text-sm text-white/60">{starLabel[hovered || myRating]}</span>
                        )}
                        {myRating > 0 && (
                            <button onClick={deleteRating} disabled={submitting}
                                className="ml-auto text-white/35 hover:text-red-400 transition-colors disabled:opacity-40">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Success message */}
                    {submitSuccess && (
                        <div className="mb-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-[var(--radius-card)] text-green-400 text-sm">
                            Your rating has been saved!
                        </div>
                    )}

                    {/* Error message */}
                    {submitError && (
                        <div className="mb-3 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-[var(--radius-card)] text-red-400 text-sm">
                            {submitError}
                        </div>
                    )}

                    {/* Review form */}
                    {showForm && (
                        <div className="space-y-3">
                            <textarea
                                value={myReview}
                                onChange={(e) => setMyReview(e.target.value)}
                                placeholder="Write a short review (optional, min 10 chars)..."
                                maxLength={1000}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-[var(--radius-card)] px-4 py-3 text-sm text-white placeholder-white/35 resize-none focus:outline-none focus:border-[var(--accent)]"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <button onClick={() => submitRating(false)} disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-[var(--radius-card)] text-sm font-semibold transition-all disabled:opacity-50">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isDraft ? "Publish review" : "Submit"}
                                </button>
                                {/* Drafts stay private and earn nothing until published */}
                                {myReview.trim().length >= 10 && (
                                    <button onClick={() => submitRating(true)} disabled={submitting}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-[var(--radius-card)] text-sm transition-all disabled:opacity-50">
                                        Save draft
                                    </button>
                                )}
                                <button onClick={() => { setShowForm(false); setSubmitError(null); }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-[var(--radius-card)] text-sm transition-all">
                                    Cancel
                                </button>
                                {myReview.length > 0 && (
                                    <span className="ml-auto text-xs text-white/35">{myReview.length}/1000</span>
                                )}
                            </div>
                            {isDraft && (
                                <p className="text-[11px] text-amber-400/80">
                                    Saved as a draft — only you can see it until you publish.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* Not logged in — show stars but clicking opens login modal */
                <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3.5">
                    <p className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50 mb-2.5">Rate this game</p>
                    <div className="mb-3.5 flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                            <button key={s}
                                onMouseEnter={() => setHovered(s)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setShowLoginModal(true)}
                                aria-label={`Rate ${s} out of 5`}
                                className="p-1 transition-transform hover:scale-110">
                                <Star className={`w-7 h-7 transition-colors ${s <= hovered ? "text-amber-400 fill-amber-400" : "text-white/15"}`} />
                            </button>
                        ))}
                        {hovered > 0 && (
                            <span className="ml-2 text-[13px] text-white/55">{starLabel[hovered]}</span>
                        )}
                    </div>
                    <button onClick={() => setShowLoginModal(true)}
                        className="flex h-10 w-full items-center justify-center rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] transition-colors">
                        Sign in to rate this game
                    </button>
                </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-display text-[9.5px] font-black uppercase tracking-[0.12em] text-white/50">Reviews</h3>
                    {reviews.map((r) => (
                        <div key={r.id} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-3.5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center font-display text-[11px] font-black text-white shrink-0">
                                    {r.user?.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display text-[13px] font-bold text-white truncate">{r.user?.name}</p>
                                    <p className="text-xs text-white/35">{new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                                </div>
                                <div className="ml-auto flex gap-0.5 shrink-0">
                                    {[1,2,3,4,5].map((s) => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                                    ))}
                                </div>
                            </div>
                            {r.review && <p className="text-sm text-white/60 leading-relaxed">{r.review}</p>}
                        </div>
                    ))}

                    {currentPage < lastPage && (
                        <button onClick={() => fetchRatings(currentPage + 1)} disabled={loading}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-[var(--radius-card)] text-sm transition-all disabled:opacity-50">
                            {loading ? "Loading..." : "Load more reviews"}
                        </button>
                    )}
                </div>
            )}

            {!loading && reviews.length === 0 && (!aggregate || aggregate.count === 0) && (
                <p className="py-1 text-center text-[12.5px] text-white/30">Nobody has rated this yet.</p>
            )}
            </div>
        </div>

        {/* Login modal */}
        {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
                <div className="bg-[#0f1221] border border-white/10 rounded-[var(--radius-panel)] p-8 max-w-sm w-full shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Rate this game</h3>
                        <button onClick={() => setShowLoginModal(false)} className="text-white/45 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-white/45 text-sm mb-6">
                        Sign in to rate games, write reviews and track your gaming history.
                    </p>

                    <div className="space-y-3">
                        <Link href="/login" onClick={() => setShowLoginModal(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-[var(--radius-card)] font-semibold transition-all">
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </Link>
                        <Link href="/register" onClick={() => setShowLoginModal(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 rounded-[var(--radius-card)] font-semibold transition-all">
                            <UserPlus className="w-4 h-4" />
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
