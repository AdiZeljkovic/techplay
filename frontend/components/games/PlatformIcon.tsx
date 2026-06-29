import { Monitor, Gamepad } from "lucide-react";

/**
 * Brand glyph for a platform chip label (PS5, SERIES, PC, SWITCH, …).
 * No icon library is installed, so PlayStation/Xbox use inline SVGs;
 * PC and Nintendo fall back to lucide icons.
 */
export default function PlatformIcon({ label, className = "w-3.5 h-3.5" }: { label: string; className?: string }) {
    const l = label.toUpperCase();

    // PlayStation family
    if (l === "PS5" || l === "PS4" || l === "PS") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M8.98 2.6v16.9c1.2.38 2.16.07 2.16-1.27V6.06c0-.7.32-1.2.83-1.04.66.18.8.85.8 1.55v4.7c1.66.8 2.96-.01 2.96-2.13 0-2.17-.77-3.13-3.03-3.91-.89-.3-2.5-.8-3.72-1.1zM14.3 16.5l4.36-1.56c.5-.18.57-.43.17-.56-.4-.13-1.13-.1-1.62.08l-2.9 1.02v-1.64l.17-.06s.83-.3 2-.4c1.16-.13 2.59.02 3.71.44 1.27.4 1.41 1 1.09 1.42-.32.4-1.1.7-1.1.7l-5.85 2.1V16.5zM3.6 16.32c-1.3-.37-1.52-1.13-.92-1.58.55-.41 1.5-.72 1.5-.72l3.9-1.39v1.58l-2.81 1c-.5.18-.57.43-.17.56.4.13 1.13.1 1.62-.08l1.36-.5v1.42c-.09.01-.18.03-.27.04-1.33.22-2.74.13-3.94-.35z"/>
            </svg>
        );
    }

    // Xbox family
    if (l === "SERIES" || l === "ONE" || l === "XBOX") {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
                <path d="M4.1 5.4C6 3.3 8.8 2 12 2s6 1.3 7.9 3.4c.3.4.3.5-.2.2C17.9 4.4 14.4 6.6 12 9 9.6 6.6 6.1 4.4 4.3 5.6c-.5.3-.5.2-.2-.2zM2.4 7.6C3.9 9.9 6.7 13 9 15.5c-1.7 2-4.4 4.8-5.6 6.2C2 19.9 1.3 17.6 1.3 15c0-2.7.4-5.2 1.1-7.4zm19.2 0c.7 2.2 1.1 4.7 1.1 7.4 0 2.6-.7 4.9-2.1 6.7-1.2-1.4-3.9-4.2-5.6-6.2 2.3-2.5 5.1-5.6 6.6-7.9zM12 10.6c1.9 1.9 5.6 6.1 7.3 8.6C17.4 21.3 14.9 22 12 22s-5.4-.7-7.3-2.8c1.7-2.5 5.4-6.7 7.3-8.6z"/>
            </svg>
        );
    }

    // Nintendo Switch
    if (l === "SWITCH") return <Gamepad className={className} aria-hidden="true" />;

    // PC / fallback
    return <Monitor className={className} aria-hidden="true" />;
}
