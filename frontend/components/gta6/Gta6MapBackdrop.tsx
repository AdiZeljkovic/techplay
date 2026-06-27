// Decorative Vice City sunset + palm backdrop behind the map (pure CSS/SVG).
// The Leaflet container is transparent so this shows through empty/ocean edges.
function Palm({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 200" className={className} aria-hidden fill="currentColor">
            {/* trunk */}
            <path d="M99 200c-4-40-6-70-2-104l6 1c-3 33-1 63 2 103z" opacity="0.9" />
            {/* fronds */}
            <path d="M100 96c-22-20-44-30-72-30 26-4 52 2 74 18zM100 96c-10-28-26-48-52-62 26 6 46 24 58 50zM100 96c12-28 30-46 58-56-24 12-42 32-52 60zM100 96c24-16 50-22 78-16-26-10-54-8-80 8zM100 96c2-30-4-56-22-80 22 16 32 44 28 76z" />
        </svg>
    );
}

export default function Gta6MapBackdrop() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Sunset gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg,#3a1d6e 0%,#7a2ff7 22%,#c23a8f 50%,#ff4d7e 72%,#ff8a3d 100%)",
                }}
            />
            {/* Glow sun near horizon */}
            <div className="absolute left-1/2 top-[58%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full"
                 style={{ background: "radial-gradient(circle, rgba(255,200,120,0.5) 0%, transparent 60%)" }} />
            {/* Retro grid horizon */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 gta6-grid opacity-30" />
            {/* Palm silhouettes */}
            <Palm className="absolute -left-8 top-2 w-[34vh] h-[34vh] text-[#2a0f3a]/70 -scale-x-100 rotate-6" />
            <Palm className="absolute -right-10 top-0 w-[40vh] h-[40vh] text-[#2a0f3a]/70 -rotate-6" />
            <Palm className="absolute right-[14%] bottom-[-4%] w-[26vh] h-[26vh] text-[#3a0f2a]/60" />
            {/* Darken so the map reads clearly on top */}
            <div className="absolute inset-0 bg-[#05070A]/35" />
        </div>
    );
}
