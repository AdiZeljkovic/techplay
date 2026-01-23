"use client";

import Link from "next/link";

/**
 * Footer message component displayed at the end of all articles.
 * Contains social links and copyright notice.
 */
export default function ArticleFooterMessage() {
    return (
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
            {/* Social Links */}
            <div className="mb-4 text-center">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Stay Connected: </span>
                <span className="text-sm text-[var(--text-secondary)]">
                    <Link href="https://discord.gg/techplay" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Discord</Link>
                    {" | "}
                    <Link href="https://youtube.com/@TechPlayGG" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">YouTube</Link>
                    {" | "}
                    <Link href="https://instagram.com/techplaygg" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Instagram</Link>
                    {" | "}
                    <Link href="https://facebook.com/TechPlayGG" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Facebook</Link>
                    {" | "}
                    <Link href="https://techplay.gg" className="text-[var(--accent)] hover:underline">TechPlay.gg</Link>
                </span>
            </div>

            {/* Copyright Notice */}
            <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
                © 2026 TechPlay.gg. All rights reserved. Content sharing is permitted only with a mandatory active link to the original source. Unauthorized use of text, photos, or video is prohibited.
            </p>
        </div>
    );
}
