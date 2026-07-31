import { Monitor, Laptop, Smartphone, Gamepad2 } from "lucide-react";

/**
 * Brand glyph for a platform label (PS5, SERIES, SWITCH, PC, MAC, …).
 * PlayStation / Xbox / Switch are drawn as inline brand marks; everything
 * else falls back to a device glyph. Rendered at currentColor.
 */
export default function PlatformIcon({ label, className = "w-4 h-4" }: { label: string; className?: string }) {
    const l = label.toUpperCase();

    // PlayStation family
    if (l === "PS5" || l === "PS4" || l === "PS") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.997.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.297-.448-3.664-1.19-5.393-1.496zm4.656 16.242l6.296-2.275c.715-.258.826-.62.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.785.03 5.437.661 1.848.601 2.041 1.472 1.576 2.072-.474.601-1.63 1.036-1.63 1.036l-8.516 3.054v-2.27zM1.807 18.6c-1.9-.545-2.214-1.658-1.354-2.298.802-.588 2.165-1.032 2.165-1.032l5.634-2.005v2.288L4.19 17.014c-.717.256-.827.62-.246.818.586.19 1.636.138 2.354-.123l1.947-.71v2.05c-.124.021-.261.04-.386.06-1.938.316-4.006.184-6.052-.51z" />
            </svg>
        );
    }

    // Xbox family — the sphere with its crossing sweeps
    if (l === "SERIES" || l === "ONE" || l === "XBOX") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M12 24a11.95 11.95 0 0 1-7.9-2.97c-1.88-1.91 4.32-8.71 7.9-11.42 3.59 2.71 9.78 9.51 7.9 11.42A11.94 11.94 0 0 1 12 24zM3.55 3.47A11.95 11.95 0 0 1 12 0c3.2 0 6.12 1.25 8.28 3.29-2.6-1.6-6.16 1.32-8.28 3.36C9.88 4.6 6.32 1.68 3.72 3.28c-.06.06-.11.12-.17.19zM2.4 4.86A11.95 11.95 0 0 0 0 12c0 3.35 1.37 6.38 3.58 8.56-1.3-2.6 3.05-8.86 5.15-11.42C7.02 7.1 4.24 4.86 2.4 4.86zm19.2 0c-1.84 0-4.62 2.24-6.33 4.28 2.1 2.56 6.45 8.82 5.15 11.42A11.95 11.95 0 0 0 24 12c0-2.7-.9-5.2-2.4-7.14z" />
            </svg>
        );
    }

    // Nintendo Switch — the two-Joy-Con mark
    if (l === "SWITCH" || l === "NINTENDO") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                {/* left Joy-Con (filled) */}
                <path d="M7.6 1.5h3.1v21H7.6A5.6 5.6 0 0 1 2 16.9V7.1a5.6 5.6 0 0 1 5.6-5.6zm-.4 3.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z" />
                {/* right Joy-Con (outlined) */}
                <path d="M16.4 1.5h-3.1v21h3.1A5.6 5.6 0 0 0 22 16.9V7.1a5.6 5.6 0 0 0-5.6-5.6zm0 2.2A3.4 3.4 0 0 1 19.8 7.1v9.8a3.4 3.4 0 0 1-3.4 3.4h-.9V3.7h.9zm.4 10.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z" />
            </svg>
        );
    }

    if (l === "MAC" || l.includes("MACINTOSH") || l.includes("MACOS")) {
        return <Laptop className={className} aria-hidden="true" strokeWidth={2.2} />;
    }

    if (l === "MOBILE" || l === "IOS" || l === "ANDROID") {
        return <Smartphone className={className} aria-hidden="true" strokeWidth={2.2} />;
    }

    if (l === "PC" || l === "WINDOWS" || l === "LINUX") {
        return <Monitor className={className} aria-hidden="true" strokeWidth={2.2} />;
    }

    return <Gamepad2 className={className} aria-hidden="true" strokeWidth={2.2} />;
}
