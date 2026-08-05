import { Monitor, Laptop, Smartphone, Gamepad2 } from "lucide-react";

/**
 * What each platform's mark is actually coloured, for surfaces that want the
 * logo to look like the logo rather than like the site.
 *
 * PC, Mac and mobile are deliberately absent: they are categories, not brands,
 * and inventing a colour for them would be the only made-up entry here.
 */
export const PLATFORM_BRAND: Record<string, string> = {
    PS5: "#0070D1",
    PS4: "#0070D1",
    PS: "#0070D1",
    PLAYSTATION: "#0070D1",
    SERIES: "#107C10",
    ONE: "#107C10",
    XBOX: "#107C10",
    SWITCH: "#E60012",
    NINTENDO: "#E60012",
    STEAM: "#C7D5E0",
    EPIC: "#F5F5F5",
    DISCORD: "#5865F2",
};

/** The mark's own colour, or null when the platform is a category rather than a brand. */
export function platformBrandColor(label: string): string | null {
    return PLATFORM_BRAND[label.toUpperCase()] ?? null;
}

/**
 * Brand glyph for a platform label (PS5, SERIES, SWITCH, PC, MAC, …).
 * PlayStation / Xbox / Switch are drawn as inline brand marks; everything
 * else falls back to a device glyph. Rendered at currentColor, so the caller
 * decides whether it wears its brand colour or the surface's.
 */
export default function PlatformIcon({ label, className = "w-4 h-4" }: { label: string; className?: string }) {
    const l = label.toUpperCase();

    // PlayStation family
    if (l === "PS5" || l === "PS4" || l === "PS" || l === "PLAYSTATION") {
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

    // Steam — the valve nozzle inside its ring
    if (l === "STEAM") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M11.98 0C5.61 0 .39 4.93 0 11.2l6.44 2.66a3.4 3.4 0 0 1 1.92-.59l.17.01 2.86-4.15v-.06a4.54 4.54 0 1 1 4.54 4.54h-.11l-4.08 2.92v.16a3.41 3.41 0 0 1-6.75.66L.05 15.3C1.44 20.24 5.29 24 11.98 24 18.6 24 24 18.62 24 12S18.6 0 11.98 0zm-4.4 18.2 -1.48-.61a2.56 2.56 0 0 0 1.33 1.26 2.57 2.57 0 0 0 3.34-3.34 2.56 2.56 0 0 0-2.34-1.6c-.33 0-.65.06-.94.18l1.53.63a1.89 1.89 0 1 1-1.44 3.48zm11.35-9.14a3.03 3.03 0 1 0-6.06 0 3.03 3.03 0 0 0 6.06 0zm-5.3 0a2.28 2.28 0 1 1 4.55 0 2.28 2.28 0 0 1-4.55 0z" />
            </svg>
        );
    }

    // Epic Games — the shield
    if (l === "EPIC") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M4.2 0C3.02 0 2.6.42 2.6 1.6v14.06c0 .27.02.5.06.7.05.2.12.38.24.55.11.16.24.32.42.47.18.15.4.3.68.47l7.3 4.22c.28.16.52.28.72.36.2.08.4.12.6.12.2 0 .4-.04.6-.12.2-.08.44-.2.72-.36l7.3-4.22c.28-.17.5-.32.68-.47.18-.15.31-.31.42-.47.12-.17.19-.35.24-.55.04-.2.06-.43.06-.7V1.6C22.64.42 22.22 0 21.04 0H4.2zm3.36 4.6h5.3v1.62H9.4v2.02h3.24v1.62H9.4v2.1h3.5v1.62H7.56V4.6zm7.9 0h1.84v6.98c0 .53.1.9.3 1.1.2.2.5.3.9.3.2 0 .4-.02.58-.06.18-.04.34-.1.48-.16v1.6c-.2.08-.44.14-.7.18-.26.04-.54.06-.84.06-.88 0-1.54-.22-1.98-.66-.44-.44-.66-1.12-.66-2.04V4.6z" />
            </svg>
        );
    }

    // Discord — the face
    if (l === "DISCORD") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M20.32 4.37A19.79 19.79 0 0 0 15.43 2.85a.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04c-1.71.3-3.35.8-4.89 1.52a.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.13l.37-.29a.08.08 0 0 1 .08 0 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .12c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z" />
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
