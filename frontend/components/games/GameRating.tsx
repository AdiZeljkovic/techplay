"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, Trash2, X, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import axios from "@/lib/axios";

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

interface ReviewsResponse {
    aggregate: Aggregate;
    reviews: { data: Review[]; last_page: number; current_page: number };
}

interface Props {
    slug: string;
    isAuthenticated: boolean;
}

export default function GameRating({ slug, isAuthenticated }: Props) {
    const [aggregate, setAggregate]     = useState<Aggregate | null>(null);
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

    useEffect(() => {
        fetchRatings(1);
        if (isAuthenticated) fetchMyRating();
    }, [slug]);

    async function fetchRatings(page: number) {
        setLoading(true);
        try {
            const res = await axios.get(`/api/v1/games/${slug}/ratings?page=${page}`);
            const data: ReviewsResponse = res.data;
            setAggregate(data.aggregate);
            setReviews((prev) => page === 1 ? data.reviews.data : [...prev, ...data.reviews.data]);
            setLastPage(data.reviews.last_page);
            setCurrentPage(page);
        } catch {}
        setLoading(false);
    }

    async function fetchMyRating() {
        try {
            const res = await axios.get(`/api/v1/games/${slug}/ratings/my`);
            if (res.data) {
                setMyRating(res.data.rating);
                setMyReview(res.data.review ?? "");
            }
        } catch {}
    }

    async function submitRating() {
        if (!myRating) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            await axios.post(`/api/v1/games/${slug}/ratings`, {
                rating: myRating,
                review: myReview.trim() || null,
            });
            setShowForm(false);
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 3000);
            fetchRatings(1);
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.response?.data?.errors?.review?.[0] ?? "Something went wrong.";
            setSubmitError(msg);
        }
        setSubmitting(false);
    }

    async function deleteRating() {
        setSubmitting(true);
        try {
            await axios.delete(`/api/v1/games/${slug}/ratings`);
            setMyRating(0);
            setMyReview("");
            setShowForm(false);
            fetchRatings(1);
        } catch {}
        setSubmitting(false);
    }

    const starLabel = ["", "Terrible", "Bad", "OK", "Good", "Excellent"];

    return (
        <>
        <div className="bg-[#0f1221]/80 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="w-5 h-5 text-[var(--accent)]" />
                Community Ratings
            </h2>

            {/* Aggregate stats */}
            {aggregate && aggregate.count > 0 && (
                <div className="flex gap-6 mb-6 p-4 bg-white/5 rounded-2xl">
                    <div className="text-center shrink-0">
                        <p className="text-4xl font-black text-white">{aggregate.average?.toFixed(1)}</p>
                        <div className="flex gap-0.5 mt-1 justify-center">
                            {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(aggregate.average ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{aggregate.count.toLocaleString()} ratings</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        {[5,4,3,2,1].map((s) => {
                            const pct = aggregate.count > 0 ? ((aggregate.distribution[s] ?? 0) / aggregate.count * 100) : 0;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-3">{s}</span>
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-6 text-right">{aggregate.distribution[s] ?? 0}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Rating form */}
            {isAuthenticated ? (
                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-3">Your rating:</p>

                    {/* Stars */}
                    <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map((s) => (
                            <button key={s}
                                onMouseEnter={() => setHovered(s)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => { setMyRating(s); setShowForm(true); }}
                                className="p-1 transition-transform hover:scale-110">
                                <Star className={`w-7 h-7 transition-colors ${
                                    s <= (hovered || myRating) ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                                }`} />
                            </button>
                        ))}
                        {(hovered || myRating) > 0 && (
                            <span className="ml-2 text-sm text-gray-300">{starLabel[hovered || myRating]}</span>
                        )}
                        {myRating > 0 && (
                            <button onClick={deleteRating} disabled={submitting}
                                className="ml-auto text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Success message */}
                    {submitSuccess && (
                        <div className="mb-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm">
                            Your rating has been saved!
                        </div>
                    )}

                    {/* Error message */}
                    {submitError && (
                        <div className="mb-3 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
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
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[var(--accent)]"
                            />
                            <div className="flex items-center gap-2">
                                <button onClick={submitRating} disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    Submit
                                </button>
                                <button onClick={() => { setShowForm(false); setSubmitError(null); }}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-all">
                                    Cancel
                                </button>
                                {myReview.length > 0 && (
                                    <span className="ml-auto text-xs text-gray-500">{myReview.length}/1000</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Not logged in — show stars but clicking opens login modal */
                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-3">Rate this game:</p>
                    <div className="flex items-center gap-1 mb-4">
                        {[1,2,3,4,5].map((s) => (
                            <button key={s}
                                onMouseEnter={() => setHovered(s)}
                                onMouseLeave={() => setHovered(0)}
                                onClick={() => setShowLoginModal(true)}
                                className="p-1 transition-transform hover:scale-110">
                                <Star className={`w-7 h-7 transition-colors ${s <= hovered ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                            </button>
                        ))}
                        {hovered > 0 && (
                            <span className="ml-2 text-sm text-gray-300">{starLabel[hovered]}</span>
                        )}
                    </div>
                    <button onClick={() => setShowLoginModal(true)}
                        className="w-full py-2.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] rounded-xl text-sm font-semibold transition-all">
                        Sign in to rate this game
                    </button>
                </div>
            )}

            {/* Reviews list */}
            {reviews.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Reviews</h3>
                    {reviews.map((r) => (
                        <div key={r.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                    {r.user?.name?.[0]?.toUpperCase() ?? "?"}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{r.user?.name}</p>
                                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                                </div>
                                <div className="ml-auto flex gap-0.5 shrink-0">
                                    {[1,2,3,4,5].map((s) => (
                                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                                    ))}
                                </div>
                            </div>
                            {r.review && <p className="text-sm text-gray-300 leading-relaxed">{r.review}</p>}
                        </div>
                    ))}

                    {currentPage < lastPage && (
                        <button onClick={() => fetchRatings(currentPage + 1)} disabled={loading}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition-all disabled:opacity-50">
                            {loading ? "Loading..." : "Load more reviews"}
                        </button>
                    )}
                </div>
            )}

            {!loading && reviews.length === 0 && (!aggregate || aggregate.count === 0) && (
                <p className="text-center text-gray-500 text-sm py-4">No ratings yet. Be the first!</p>
            )}
        </div>

        {/* Login modal */}
        {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
                <div className="bg-[#0f1221] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Rate this game</h3>
                        <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Sign in to rate games, write reviews and track your gaming history.
                    </p>

                    <div className="space-y-3">
                        <Link href="/login" onClick={() => setShowLoginModal(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl font-semibold transition-all">
                            <LogIn className="w-4 h-4" />
                            Sign In
                        </Link>
                        <Link href="/register" onClick={() => setShowLoginModal(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-semibold transition-all">
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
