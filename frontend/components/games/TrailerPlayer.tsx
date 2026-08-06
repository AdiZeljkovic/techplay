"use client";

import { useEffect, useRef } from "react";

/**
 * One player for every trailer URL the catalogue holds. Steam publishes HLS
 * manifests now (.m3u8) — Safari plays those natively, everyone else needs
 * hls.js; plain files and old mp4s go straight into the tag. YouTube links
 * never reach this component (the page embeds those as iframes).
 */
export default function TrailerPlayer({ src, poster }: { src: string; poster?: string | null }) {
    const ref = useRef<HTMLVideoElement>(null);

    const isHls = src.includes(".m3u8");

    useEffect(() => {
        const video = ref.current;
        if (!video || !isHls) return;
        if (video.canPlayType("application/vnd.apple.mpegurl")) return; // Safari

        let hls: { destroy: () => void } | null = null;
        let cancelled = false;

        import("hls.js").then(({ default: Hls }) => {
            if (cancelled || !Hls.isSupported()) return;
            const instance = new Hls({ capLevelToPlayerSize: true });
            instance.loadSource(src);
            instance.attachMedia(video);
            hls = instance;
        });

        return () => {
            cancelled = true;
            hls?.destroy();
        };
    }, [src, isHls]);

    return (
        <video
            ref={ref}
            controls
            preload="metadata"
            poster={poster ?? undefined}
            className="w-full aspect-video bg-black"
            src={isHls ? undefined : src}
        >
            {isHls && <source src={src} type="application/vnd.apple.mpegurl" />}
        </video>
    );
}
