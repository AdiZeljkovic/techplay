"use client";

export default function DiscordCTAWidget() {
    return (
        <div className="rounded-xl overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, #1e0b4a 0%, #0f1f5c 50%, #0a2a6e 100%)',
            border: '1px solid rgba(120,100,255,0.25)',
        }}>
            {/* Decorative glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at 85% 15%, rgba(88,101,242,0.22) 0%, transparent 60%)',
            }} />

            <div className="relative px-5 pt-6 pb-5">
                {/* Logo + text row */}
                <div className="flex items-center gap-4 mb-5">
                    {/* Large Discord logo */}
                    <div className="flex-shrink-0">
                        <svg width="46" height="34" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.292408 45.3914C0.304666 45.5608 0.397299 45.7223 0.525813 45.8253C6.62445 50.2024 12.5418 52.8443 18.3499 54.5905C18.4422 54.6189 18.5401 54.5847 18.5985 54.5082C19.9402 52.6724 21.1367 50.7361 22.1617 48.6999C22.2228 48.5759 22.165 48.4292 22.0363 48.3804C20.1372 47.6524 18.3283 46.7686 16.5889 45.7674C16.4462 45.6844 16.4351 45.4815 16.5665 45.3844C16.9248 45.1154 17.2832 44.8351 17.6248 44.5518C17.6889 44.4983 17.7757 44.4871 17.8513 44.5208C29.5316 49.7925 42.163 49.7925 53.7028 44.5208C53.7784 44.4843 53.8652 44.4955 53.9321 44.549C54.2737 44.8323 54.6321 45.1154 54.9932 45.3844C55.1245 45.4815 55.1162 45.6844 54.9735 45.7674C53.2369 46.7883 51.4252 47.6524 49.5234 48.3776C49.3946 48.4264 49.3397 48.5759 49.4007 48.6999C50.4479 50.7334 51.6443 52.6669 52.9611 54.5054C53.0167 54.5847 53.1174 54.6189 53.2097 54.5905C59.0451 52.8443 64.9624 50.2024 71.061 45.8253C71.1923 45.7223 71.2821 45.5636 71.2944 45.3942C72.7667 30.0791 68.8416 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z" fill="white"/>
                        </svg>
                    </div>

                    {/* Heading + description */}
                    <div>
                        <div className="text-white font-black uppercase leading-tight" style={{ fontSize: '14px', letterSpacing: '0.08em' }}>
                            Join Our Discord
                        </div>
                        <div className="mt-1.5" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.52)', lineHeight: '1.5' }}>
                            Connect with 50,000+ gamers,<br />exclusive events &amp; community fun!
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <a
                    href="https://discord.gg/wPQG9gUMXH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full font-black uppercase transition-all active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(90deg, #5865f2 0%, #4752c4 100%)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '11px',
                        color: '#ffffff',
                        letterSpacing: '0.1em',
                        boxShadow: '0 4px 20px rgba(88,101,242,0.4)',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.12)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.filter = 'none')}
                >
                    Join Discord Server
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        </div>
    );
}
