"use client";

import { useState } from "react";
import GameIcon from "@/components/gw2/GameIcon";
import WikiLink from "@/components/gw2/WikiLink";
import { Gw2Panel } from "@/components/gw2/Gw2Ui";
import type { Gw2VaultSeason } from "@/lib/gw2";

/**
 * The Wizard's Vault season, and what is still on its shelf for this account.
 *
 * The end date is the only deadline the game publishes, and the purchases
 * against each limit are the only way to say what is left — so this is two
 * facts from the API and the acclaim in the wallet beside them. Nothing is
 * recommended: what is worth buying is the player's call.
 */
export default function SeasonPanel({ season }: { season: Gw2VaultSeason }) {
    const [all, setAll] = useState(false);

    const ends = new Date(season.ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const listings = season.still_to_buy?.listings ?? [];
    const shown = all ? listings : listings.slice(0, 6);

    return (
        <Gw2Panel
            title={season.title ?? "Wizard's Vault season"}
            meta={
                <span className="font-numeric text-xs text-[var(--ink-faint)]">
                    {season.days_left > 0 ? `ends in ${season.days_left} days` : "ends today"}
                </span>
            }
        >
            <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                    <div>
                        <div className="font-numeric text-lg text-[var(--ink-hi)]">{season.acclaim.toLocaleString()}</div>
                        <div className="text-[11px] text-[var(--ink-low)]">Astral Acclaim to spend</div>
                    </div>
                    <div className="text-right text-[11px] text-[var(--ink-low)]">Season ends {ends}</div>
                </div>

                {season.still_to_buy === null ? (
                    <p className="text-xs text-[var(--ink-low)]">
                        We have not read what you have bought from the vault yet. It arrives with the next full read.
                    </p>
                ) : listings.length === 0 ? (
                    <p className="text-xs text-[var(--ink-low)]">Every limited reward this season is bought.</p>
                ) : (
                    <>
                        <p className="text-[11px] text-[var(--ink-faint)]">
                            {listings.length} limited rewards not bought up to their limit — everything left would cost{" "}
                            <span className="font-numeric">{season.still_to_buy.cost_of_everything.toLocaleString()}</span>.
                        </p>
                        <ul className="space-y-2">
                            {shown.map((listing) => (
                                <li key={listing.id} className="flex items-center gap-2.5">
                                    <GameIcon src={listing.icon} alt="" size="sm" rarity={listing.rarity ?? undefined} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                            <span className="truncate text-xs text-[var(--ink-hi)]">
                                                {listing.count > 1 ? `${listing.count}× ` : ""}
                                                {listing.name ?? `Item ${listing.item_id}`}
                                            </span>
                                            <WikiLink wiki={listing.wiki} name={listing.name} compact />
                                        </div>
                                        <div className="text-[11px] text-[var(--ink-faint)]">
                                            {listing.type} · {listing.left} left
                                        </div>
                                    </div>
                                    <span
                                        className="shrink-0 rounded-full border border-[var(--line-strong)] bg-[var(--fill-1)] px-2 py-0.5 font-numeric text-[11px]"
                                        style={{ color: listing.affordable ? "var(--success)" : "var(--ink-low)" }}
                                    >
                                        {listing.cost}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {listings.length > shown.length && (
                            <button
                                type="button"
                                onClick={() => setAll(true)}
                                className="text-xs text-[var(--accent-ink)] hover:underline"
                            >
                                Show all {listings.length}
                            </button>
                        )}
                    </>
                )}

                {season.notes && season.notes.length > 0 && (
                    <ul className="space-y-1 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                        {season.notes.map((note) => (
                            <li key={note.text} className="text-[11px] text-[var(--ink-faint)]">
                                <span>
                                    {note.text}{" "}
                                    <a
                                        href={note.source}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="underline hover:text-[var(--accent-ink)]"
                                    >
                                        Source
                                    </a>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Gw2Panel>
    );
}
