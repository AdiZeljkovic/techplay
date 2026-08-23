"use client";

import { User as UserIcon } from "lucide-react";

/**
 * The portrait and the ring around it.
 *
 * Lifted out of ProfileHero so the locked profile can wear the same object
 * rather than a copy of it: one armoured ring, one set of insets, one place to
 * change. A traced second version is how a wrong Steam logo came to live in two
 * files earlier in this codebase.
 */
export default function AvatarRing({
    src,
    alt,
    frame,
    online,
    className = "w-[124px] h-[124px] md:w-[150px] md:h-[150px]",
}: {
    src: string | null;
    alt: string;
    frame: string | null;
    online: boolean;
    /** The box the ring fills; the art and insets scale with it. */
    className?: string;
}) {
    // An equipped cosmetic frame is a colour the reader paid for, so it wins.
    // With nothing equipped the house frame is drawn instead — the armoured
    // ring with the crest, rather than a flat crimson circle.
    const cosmetic = !!frame;

    return (
        <div className={`relative shrink-0 ${className}`}>
            {cosmetic ? (
                <>
                    <span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: frame!,
                            boxShadow: "0 0 24px -4px color-mix(in srgb, var(--accent) 55%, transparent)" }}
                    />
                    {/* the gap that keeps the ring reading as a ring, not a border */}
                    <span aria-hidden className="absolute inset-[2.5px] rounded-full bg-[var(--surface-0)]" />
                </>
            ) : (
                <span
                    aria-hidden
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                        // Drawn over the portrait, not behind it: the ring has a
                        // crest that oversails its own circle at top and bottom,
                        // and behind the image those would be clipped away.
                        backgroundImage: "url(/images/profile/avatar-frame.webp)",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--accent) 45%, transparent))",
                    }}
                />
            )}

            {/* 11.3%, not a round number: the ring's opening measures 978px
                across a 1280 square, which is an inset of 11.8% exactly. Half
                a percent tighter puts the portrait's edge under the metal
                rather than flush against it, so no hairline of page shows
                between them where the art anti-aliases. */}
            <span className={`absolute rounded-full overflow-hidden bg-[var(--surface-2)] ${cosmetic ? "inset-[7px]" : "inset-[11.3%]"}`}>
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover transition-transform duration-500 ease-[var(--ease-hud)] group-hover/av:scale-[1.05]"
                    />
                ) : (
                    <span className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-[var(--ink-faint)]" />
                    </span>
                )}
            </span>

            {online && (
                // On the ring's lower-left arc, between the crest at the bottom
                // and the ornament on the left. Further out it floated in the
                // corner of the box, detached from the portrait it belongs to.
                <span className={`absolute z-30 w-[18px] h-[18px] ${cosmetic ? "bottom-[6%] left-[13%]" : "bottom-[13%] left-[13%]"}`} title="Online now">
                    <span aria-hidden className="tp-pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                    <span
                        className="relative block w-full h-full rounded-full ring-[3px] ring-[var(--surface-0)]"
                        style={{ background: "radial-gradient(circle at 35% 30%, #a7f3d0 0%, #10b981 55%, #047857 100%)" }}
                    />
                    <span className="sr-only">Online</span>
                </span>
            )}
        </div>
    );
}
