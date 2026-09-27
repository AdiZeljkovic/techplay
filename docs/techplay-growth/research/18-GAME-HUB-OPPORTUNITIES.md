# 18 — Game Hub Opportunities

Status: Phase 1 research draft — 27 Sep 2026
Scope: which games, franchises or platforms could support a TechPlay hub like `/gta6`: an evergreen landing page, database-style sub-pages, guides, a news stream and tools. 37 candidates are scored. Machine-readable version: `game-opportunities.csv`.

The hub agent was stopped before it produced findings. This evaluation was built from facts verified this session by other research streams: release dates and statuses (05, with sources), Steam's most-played and most-wishlisted charts (05, 06), this week's headlines (06), search observations (03, 09) and competitor ownership of search (04). Every status in the table has a source URL in the CSV. **All scores are ESTIMATE.** Competition is scored inversely: 5 means weak competition, which is good for TechPlay.

## Executive summary

1. **FACT — Only one candidate has a tool nobody else offers on-site: World of Warcraft.** TechPlay's WoW Analyzer reads Blizzard's API and Raider.IO. WoW has a patch expected about 6 Oct (cadence prediction), WoW: Forever on 4 Nov 2026 and The Last Titan in late 2027.
2. **FACT — Platform hubs score as well as the biggest game.** Switch 2 (23M+ units, price rise to $499.99 on 1 Sep 2026, a steady stream of "Switch 2 Edition" releases) and Steam/PC (a fixed public event calendar and TechPlay's library import) tie with GTA VI on the raw total.
3. **OBSERVATION — Raw demand misleads.** Minecraft, Pokémon, Fortnite, Path of Exile 2 and EA FC have enormous demand but their search results are owned by dedicated wikis and tools (Minecraft Wiki, Serebii, poe.ninja, FUTBIN). A hub there would be invisible.
4. **HYPOTHESIS — Series-order hubs for 2027 launches are cheap and early.** Final Fantasy VII Revelation (8 Apr 2027), Persona 4 Revival (18 Feb 2027), Kingdom Hearts IV (late 2027) and Fable (23 Feb 2027) all generate "in order" and recap searches months before release, and TechPlay stores series relations.
5. **RECOMMENDATION — Build at most three hubs in the next six months:** keep GTA VI, add a WoW/MMO hub around the Analyzer, and turn Steam/PC plus Switch 2 into platform hubs fed by the database and release calendar.

## Ranked table (raw totals)

| Rank | Game / hub | Status (verified) | Demand | Competition (5 = weak) | Timing | Depth | Tools | Community | SEO | Social | Long-term | Total | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | GTA VI (existing hub) | 19 Nov 2026 | 5 | 1 | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 38 | HIGH |
| 2 | Nintendo Switch 2 (platform hub) | Live; 23M+ units by Jun 2026; $499.99 from 1 Sep 2026 | 5 | 2 | 5 | 5 | 4 | 3 | 5 | 4 | 5 | 38 | HIGH |
| 3 | Steam / PC gaming (platform hub) | Fixed event calendar (Autumn Sale 1–8 Oct, Next Fest 19–26 Oct, Winter Sale 17 Dec–4 Jan) | 5 | 2 | 5 | 5 | 5 | 3 | 5 | 3 | 5 | 38 | HIGH |
| 4 | World of Warcraft (Midnight, WoW: Forever, The Last Titan) | Midnight live since 2 Mar 2026; 12.1.5 ~6 Oct (predicted); WoW: Forever 4 Nov 2026; The Last Titan late 2027 | 4 | 2 | 5 | 5 | 5 | 4 | 4 | 3 | 5 | 37 | HIGH |
| 5 | Pokémon (Winds & Waves, Champions) | Gen 10 in 2027; Champions released 8 Apr 2026 | 5 | 1 | 3 | 5 | 3 | 3 | 5 | 4 | 5 | 34 | HIGH |
| 6 | Path of Exile 2 | 1.0 on 11 Dec 2026 (reported) | 4 | 1 | 5 | 5 | 2 | 4 | 4 | 3 | 5 | 33 | MED |
| 7 | Minecraft | Live; Dungeons II 29 Sep; Bedrock on Switch 2 27 Oct; The Sift dimension 2027 | 5 | 1 | 4 | 5 | 2 | 3 | 4 | 4 | 5 | 33 | HIGH |
| 8 | Final Fantasy VII Revelation | 8 Apr 2027 | 5 | 2 | 4 | 4 | 2 | 3 | 4 | 3 | 4 | 31 | HIGH |
| 9 | Call of Duty: Modern Warfare 4 | 23 Oct 2026 (campaign early access 16 Oct) | 5 | 1 | 5 | 3 | 2 | 3 | 4 | 4 | 3 | 30 | HIGH |
| 10 | Deadlock | Unreleased; top of Steam wishlists; top-25 most played | 4 | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 4 | 30 | MED |
| 11 | Monster Hunter Wilds | Switch 2 on 4 Dec 2026; Ascendance expansion 2027 | 4 | 2 | 4 | 5 | 2 | 3 | 3 | 3 | 4 | 30 | HIGH |
| 12 | Steam hardware (Steam Frame, Steam Machine, Deck) | Frame 18 Sep 2026; Machine 29 Jun 2026; Deck OLED price rise | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 30 | HIGH |
| 13 | Fable | 23 Feb 2027 (moved to avoid GTA VI) | 4 | 3 | 4 | 3 | 2 | 3 | 4 | 3 | 3 | 29 | HIGH |
| 14 | Final Fantasy XIV (Evercold 8.0) | Evercold January 2027 | 3 | 3 | 4 | 4 | 2 | 4 | 3 | 2 | 4 | 29 | HIGH |
| 15 | Counter-Strike 2 | Live; Steam #1 (1.35M peak); PGL Major 25 Nov–13 Dec | 5 | 2 | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 28 | HIGH |
| 16 | Helldivers 2 | 20M+ copies; Warbonds ongoing | 3 | 3 | 3 | 3 | 2 | 4 | 3 | 4 | 3 | 28 | HIGH |
| 17 | GPU and PC hardware (platform hub) | RTX 50 Super rumored CES 2027; next gen H2 2027+ | 4 | 1 | 3 | 4 | 3 | 2 | 4 | 2 | 5 | 28 | MED |
| 18 | Guild Wars 2 / Guild Wars 3 | GW2 quarterly releases; GW3 beta fall 2027 | 2 | 4 | 3 | 4 | 2 | 3 | 3 | 2 | 4 | 27 | HIGH |
| 19 | Battlefield 6 | Season 5 later 2026 (window) | 4 | 2 | 4 | 3 | 2 | 3 | 3 | 3 | 3 | 27 | MED |
| 20 | Kingdom Hearts IV | Late 2027 | 4 | 2 | 3 | 3 | 1 | 3 | 4 | 3 | 4 | 27 | HIGH |
| 21 | Fortnite | C7S4 ends ~1 Nov (community timers) | 5 | 1 | 3 | 3 | 1 | 2 | 3 | 5 | 3 | 26 | LOW |
| 22 | Marvel Rivals | Season 10 from 11 Sep 2026 | 4 | 2 | 3 | 3 | 1 | 3 | 3 | 4 | 3 | 26 | MED |
| 23 | Gears of War: E-Day | 6 Oct 2026 | 4 | 2 | 5 | 3 | 1 | 3 | 3 | 3 | 2 | 26 | HIGH |
| 24 | Hollow Knight: Silksong | Released; Sea of Sorrow DLC scheduled 2026 | 3 | 2 | 3 | 4 | 2 | 3 | 3 | 3 | 3 | 26 | MED |
| 25 | Persona 4 Revival | 18 Feb 2027 (Switch 2 on 20 May 2027) | 3 | 3 | 4 | 3 | 1 | 3 | 3 | 3 | 3 | 26 | HIGH |
| 26 | Diablo IV | Lord of Hatred 28 Apr 2026; ~3-month seasons; Switch 2 version 16 Sep 2026 | 3 | 2 | 3 | 4 | 2 | 3 | 3 | 2 | 3 | 25 | HIGH |
| 27 | Resident Evil (Requiem, Veronica remake) | Requiem Feb 2026 ($500M+); Veronica remake 2027 | 4 | 2 | 3 | 3 | 1 | 2 | 4 | 3 | 3 | 25 | HIGH |
| 28 | The Witcher IV | Planned 2028 | 4 | 2 | 2 | 3 | 1 | 3 | 3 | 3 | 4 | 25 | HIGH |
| 29 | League of Legends | Worlds 15 Oct–14 Nov 2026 | 4 | 1 | 4 | 3 | 1 | 2 | 3 | 3 | 3 | 24 | HIGH |
| 30 | Phantom Blade Zero | 29 Oct 2026 | 3 | 3 | 4 | 3 | 1 | 2 | 3 | 3 | 2 | 24 | HIGH |
| 31 | Roblox | Live; age verification since Jan 2026 | 5 | 2 | 2 | 3 | 1 | 1 | 3 | 3 | 3 | 23 | MED |
| 32 | EA Sports FC 27 | Launched 25 Sep 2026 | 5 | 1 | 3 | 3 | 1 | 2 | 3 | 3 | 2 | 23 | MED |
| 33 | Valorant | Champions final 18 Oct 2026 | 3 | 2 | 3 | 3 | 1 | 2 | 3 | 3 | 3 | 23 | HIGH |
| 34 | The Elder Scrolls VI | No release date | 4 | 2 | 1 | 2 | 1 | 3 | 3 | 3 | 4 | 23 | HIGH |
| 35 | Marvel's Wolverine | Released 15 Sep 2026; 1.9M in 3 days | 4 | 2 | 2 | 3 | 1 | 2 | 3 | 3 | 2 | 22 | HIGH |
| 36 | Metro 2039 | 4 Feb 2027 | 3 | 3 | 4 | 2 | 1 | 2 | 3 | 2 | 2 | 22 | HIGH |
| 37 | Crimson Desert | Released 19 Mar 2026; DLC 15 Oct; Switch 2 early 2027 | 3 | 2 | 3 | 3 | 1 | 2 | 3 | 2 | 2 | 21 | HIGH |

## Adjusted ranking for TechPlay

The raw total treats every criterion equally. Weighting tool possibilities and competition double (the two things a small team can actually win on) gives this order:

| # | Hub | Why |
|---|---|---|
| 1 | **World of Warcraft / MMO hub** (WoW + FFXIV + GW2) | Unique tool; patch and expansion calendar to 2027; MMO questions have moderate competition (09 cluster C) |
| 2 | **GTA VI** (existing) | Launch on 19 Nov; data and accounts, not news volume (17) |
| 3 | **Steam / PC platform hub** | Library import, prices, Next Fest, sales; nobody ties Steam data to a personal library |
| 4 | **Nintendo Switch 2 platform hub** | Editions, upgrades, key cards, performance; structured data is thin elsewhere |
| 5 | **Final Fantasy VII Revelation** (pre-release series hub) | Six months of recap and order demand before 8 Apr 2027 |
| 6 | **Fable** (pre-release) | Top-4 Steam wishlist; Game Pass angle; 23 Feb 2027 |
| 7 | **Call of Duty: Modern Warfare 4** (launch mini-hub) | Four platforms incl. Switch 2; requirements and settings for three weeks, then fold into the series page |
| 8 | **Steam hardware** (Frame, Machine, Deck) inside the Steam hub | Verified/VR-ready lists from the database |
| 9 | **Persona and Kingdom Hearts series pages** | Low competition on "in order" (09: EB-009) |
| 10 | **Deadlock** (watch) | Most-wishlisted on Steam and already top-25 most played; hub when it releases |

## Hub blueprints (RECOMMENDATION)

### 1. WoW / MMO hub
- **Pages:** WoW Analyzer (re-aimed per patch), patch calendar, "is WoW worth it in 2026", WoW: Forever explainer, class overview linking out to Wowhead/Icy Veins rather than duplicating them, MMO comparison (WoW vs FFXIV vs GW2), guild recruitment helper using Analyzer data.
- **Tools:** Analyzer share card; weekly reset checklist; Discord `/wow` command.
- **Cadence:** patch days, weekly resets, expansions (Evercold January 2027; The Last Titan late 2027).
- **Defensibility:** the only on-site character analyzer among media sites.

### 2. GTA VI
See 17 for the full plan: plumbing fixes, release-time tool, confirmed-vs-rumour ledger, map progress tracker.

### 3. Steam / PC platform hub
- **Pages:** Steam event calendar, Next Fest demo tracker, sale picks by wishlist, most-played movers weekly, Deck-verified lists, PC fixes (09 cluster PC issues).
- **Tools:** price alerts, library worth card, public Steam calculator (10).
- **Defensibility:** personal library data; SteamDB has data but not your shelf.

### 4. Nintendo Switch 2 platform hub
- **Pages:** Switch 2 Edition and upgrade tracker, key-card explainer, 120Hz/VRR list, upcoming Switch 2 games (Minecraft Bedrock 27 Oct, MW4 23 Oct, MH Wilds 4 Dec, Metroid Ravenous 28 Jan 2027).
- **Defensibility:** structured per-game platform data from the database.

### 5–6. Pre-release series hubs (FF7 Revelation, Fable)
- **Pages:** series in order, story recap, platform and edition facts, countdown with reminder.
- **Defensibility:** early, sourced, and linked to reminders.

### 7. MW4 launch mini-hub
- **Pages:** requirements, settings by GPU tier, Switch 2 performance, "which CoD should I get". Retire into the series page after launch month.

## Do not build a hub for

| Candidate | Reason |
|---|---|
| Minecraft | Minecraft Wiki and official site own search; only platform pages (Switch 2 Bedrock) |
| Fortnite | Season dates rely on community timers; item-shop and map sites own the space |
| Roblox | Young audience, codes-page economy |
| EA Sports FC 27 | FUTBIN and FUT.GG own player and SBC data |
| League of Legends, Valorant | Stat sites own tools; TechPlay has no data edge |
| Path of Exile 2 | poe.ninja, Path of Building and Maxroll own tools |
| The Elder Scrolls VI, The Witcher IV | No dates; too early (series pages only) |
| Marvel's Wolverine, Crimson Desert | Post-launch; news only |

## Platform hub versus game hub

- **Platform hubs** last as long as the platform, reuse the database for every game, and fit the "one library" positioning. They depend on structured data TechPlay must add (editions, upgrades, subscription catalogues).
- **Game hubs** spike around a launch and need editorial upkeep. They are worth it only with a tool (GTA VI map and reminders; WoW Analyzer).

## Connecting hubs to the database (HYPOTHESIS)

- Each hub should link to its `/games/[slug]` page, and the game page should link back to the hub as its "home". Today the GTA 6 hub and the GTA VI game page do not link to each other, and GTA 6 news sits on a different game (17).
- Series pages (`/games/series/[s]`) should be the canonical "in order" page; hubs link to them rather than duplicating the list.
- Facet pages (genre, platform) should link to hubs as featured entries.
- One canonical URL per intent avoids cannibalisation between hub, game page and calendar entry (03 §11).

## Sources used

Per-candidate source URLs are in `game-opportunities.csv` (Wikipedia release pages, Rockstar Newswire, Steamworks events, EA and Activision pages, Xbox Wire, Game Informer round-ups, Blizzard Watch, Notebookcheck). Chart data: Steam charts API (weekly most played to 26 Sep 2026) and Steam store popular-wishlist search (27 Sep 2026).

## Gaps / needs more data

- No subreddit sizes, Twitch viewership or trailer view counts were captured (sources blocked).
- Competition scores rely on observed search results for some candidates (03, 09) and on known incumbents for others; the latter are ESTIMATE.
- Fortnite season dates are unverified.
- Hub traffic potential cannot be estimated without search-volume data.
