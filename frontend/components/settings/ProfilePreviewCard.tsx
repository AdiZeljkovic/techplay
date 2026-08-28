"use client";

import { MapPin, CalendarDays, BadgeCheck, User as UserIcon } from "lucide-react";

/**
 * The profile being edited, as it will look.
 *
 * The form asked for a display name, a tagline, a location, a bio, an avatar
 * and a cover, and showed none of them anywhere — you typed into six boxes,
 * pressed save, then navigated to your own profile to find out what you had
 * done. Every one of those fields exists to change this one object, so the
 * object is on screen while you change it.
 *
 * It mirrors the real header rather than inventing a second look: the same
 * feathered backdrop, the same accent ring, the same order of name, handle,
 * tagline and meta. What it deliberately leaves out is everything the form
 * cannot touch — level, rank, stats, buttons — because a preview that shows
 * controls you cannot reach from here is a screenshot, not a preview.
 */
export default function ProfilePreviewCard({
    username,
    displayName,
    tagline,
    location,
    bio,
    avatarUrl,
    coverUrl,
    memberSince,
    verified = false,
}: {
    username: string;
    displayName: string;
    tagline: string;
    location: string;
    bio: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    memberSince?: string | null;
    verified?: boolean;
}) {
    const name = displayName.trim() || username;

    return (
        <div
            className="relative overflow-hidden rounded-[var(--radius-panel)] border"
            style={{ borderColor: "var(--line-strong)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)" }}
        >
            <span className="absolute top-3 right-3 z-20 inline-flex items-center h-[19px] px-2 rounded-[5px] bg-black/55 backdrop-blur-md font-display text-[8.5px] font-black uppercase tracking-[0.16em] text-white/50">
                Preview
            </span>

            {/* the backdrop, feathered the way the real header feathers it */}
            <div aria-hidden className="absolute inset-0">
                {coverUrl ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] from-[4%] via-[color-mix(in_srgb,var(--surface-1)_60%,transparent)] via-[48%] to-[color-mix(in_srgb,var(--surface-1)_22%,transparent)]" />
                        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface-1)] to-transparent" />
                    </>
                ) : (
                    <span
                        className="absolute inset-0"
                        style={{
                            background: "var(--surface-2), radial-gradient(120% 140% at 15% 0%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 60%)",
                            backgroundColor: "var(--surface-2)",
                        }}
                    />
                )}
            </div>

            <div className="relative flex items-start gap-4 md:gap-5 p-5">
                <span className="shrink-0 w-[72px] h-[72px] rounded-full p-[2px]" style={{ background: "var(--accent)" }}>
                    <span className="block w-full h-full rounded-full p-[3px] bg-[var(--surface-0)]">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="" aria-hidden className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="w-full h-full rounded-full bg-white/[0.06] flex items-center justify-center text-white/25">
                                <UserIcon className="w-7 h-7" />
                            </span>
                        )}
                    </span>
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="flex items-center gap-2 font-display text-[22px] md:text-[26px] font-black text-white leading-none min-w-0">
                        <span className="truncate">{name}</span>
                        {verified && <BadgeCheck className="w-5 h-5 shrink-0 text-[var(--accent)]" />}
                    </h3>

                    <p className="mt-1.5 text-[12.5px] font-semibold text-white/45">@{username}</p>

                    {/* The empty states are the point: they show what the field
                        is for, in the place the words will land. */}
                    <p className={`mt-2.5 text-[13px] truncate ${tagline.trim() ? "text-white/75" : "text-white/20 italic"}`}>
                        {tagline.trim() || "Your tagline goes here"}
                    </p>

                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-white/55">
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-white/25" />
                            <span className={location.trim() ? "" : "text-white/20 italic"}>
                                {location.trim() || "Nowhere in particular"}
                            </span>
                        </span>
                        {memberSince && (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-white/25" /> Member since {memberSince}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {bio.trim() && (
                <div className="relative px-5 pb-5">
                    <p className="pt-3 border-t border-white/[0.07] text-[12.5px] leading-relaxed text-white/55 whitespace-pre-line line-clamp-4">
                        {bio}
                    </p>
                </div>
            )}
        </div>
    );
}
