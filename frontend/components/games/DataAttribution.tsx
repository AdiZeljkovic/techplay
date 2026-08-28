/**
 * Where the catalogue comes from.
 *
 * The IGDB API is free under the Twitch Developer Services Agreement and asks
 * that the source be credited. That is the whole reason this exists — not
 * decoration, and not something to leave to the footer of a page nobody
 * scrolls to. It sits at the bottom of the pages actually built from that data:
 * a game, a studio, the database itself.
 *
 * Quiet on purpose. A credit that shouts is a credit that gets removed.
 */
export default function DataAttribution({ className = "" }: { className?: string }) {
    return (
        <p className={`text-[11.5px] leading-relaxed text-white/45 ${className}`}>
            Game and studio data from{" "}
            <a
                href="https://www.igdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 underline decoration-white/15 underline-offset-2 hover:text-white/70 hover:decoration-white/40 transition-colors"
            >
                IGDB
            </a>
            , with release information from Steam, PlayStation, Xbox and Nintendo.
        </p>
    );
}
