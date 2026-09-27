# 17 — GTA 6 Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: TechPlay's GTA 6 hub as it is today, what is confirmed versus rumoured, who owns GTA 6 search, what the community asks, which tools fans already use, and how TechPlay could build authority in the 53 days before launch and after it.

The GTA 6 agent was stopped before writing. This file uses the pages it saved (TechPlay's hub, Rockstar Newswire, IGN, the Xbox store, 40 Bing results pages, fan sites, r/GTA6 feeds) and this week's GTA 6 headlines from 20 outlets (06).

## Executive summary

1. **FACT — GTA VI launches Thursday 19 Nov 2026 on PS5 and Xbox Series X|S.** Rockstar Newswire and the Xbox store state the date. No PC version at launch; Take-Two's CEO explained why (IGN, 4 May 2026). Price $79.99, Ultimate Edition $99.99, "a single-player experience" at launch (IGN, 24 Jun 2026). Pre-orders opened 25 Jun 2026 (Rockstar Newswire).
2. **FACT — TechPlay appears in none of the 19 query-relevant GTA 6 results pages checked on Bing.** Page one belongs to Rockstar, Wikipedia, IGN and a crowd of dedicated fan domains: gtabase.com, map.stateofleonida.net, exploregta6.com, gtasixmap.com, gtavimap.com, gtaboom.com, gta6index.com, specvi.com, and at least seven countdown sites.
3. **FACT — TechPlay's hub is thin in the HTML a crawler receives.** Server-rendered text: hub 296 words, "Everything We Know" 496, vehicles 252, weapons 113, characters 105, map 51. The hub's H1 is empty and its hero counters read "0 Days · 0 Map locations · 0 Characters" until JavaScript runs (02).
4. **FACT — The hub's Discord button is dead.** It links `discord.gg/techplaygg`, which Discord reports as an unknown invite (13).
5. **FACT — The hub is cut off from the rest of the site.** None of its pages links to the `/games/grand-theft-auto-vi` game page or the calendar, and TechPlay's GTA 6 news is attached to `/games/gta-6`, a 2019 parody game (02).
6. **FACT — The hub has real data nobody else combines with accounts.** 121 vehicles, 36 weapons, 12 characters and 1,058 map locations (docs/README.md §1), an ItemList per section, FAQPage schema on "Everything We Know", and a newsletter block.
7. **FACT — The news cycle this month is dense and specific.** $400 Vice City collector's set (and scalpers at $1,500), modding guidelines restricting story mods and map mashups (21 Sep), the voice cast reminded of NDAs, a Game Informer cover story (26 Sep), a Netflix preview that drove more than 100,000 sign-ups (10 Sep), reports of 30 fps on consoles at launch (Tom's Hardware via Wikipedia, 29 Aug), and the Rockstar–IWGB tribunal over dismissed staff (14 Sep).
8. **HYPOTHESIS — TechPlay cannot win "GTA 6 news" or "GTA 6 map" in 53 days.** It can win narrower, data-backed and account-linked things: a release-time and pre-load tool, a sourced "confirmed versus rumoured" changelog, vehicle real-world equivalents, and a launch-day progress tracker on its existing map.

## 1. Hub audit (FACT, pages fetched 27 Sep 2026)

| Page | Title | Server-rendered words | Structured data | Notes |
|---|---|---|---|---|
| `/gta6` | "GTA 6 — Interactive Map, Characters, Vehicles & Complete Guide" | 296 | VideoGame (datePublished 2026-11-19), BreadcrumbList | Empty H1; hero counters show 0 before hydration; lists "PC — Coming Soon"; 4 latest news cards; newsletter and Discord CTA |
| `/gta6/everything-we-know` | "GTA 6: Everything We Know (Updated 2026) — Release Date, Map, Story & Cast" | 496 | FAQPage | Says "PC version not yet confirmed", contradicting the hub's "PC — Coming Soon" |
| `/gta6/vehicles` | "GTA 6 Vehicles — Every Confirmed Car, Bike, Boat & Aircraft" | 252 | ItemList | 124 images; filters are client-side |
| `/gta6/weapons` | "GTA 6 Weapons — Complete Arsenal…" | 113 | ItemList | |
| `/gta6/characters` | "GTA 6 Characters — Jason, Lucia & Every Confirmed Cast Member" | 105 | ItemList; 12 detail pages | Lucia page: 429 words, Person schema |
| `/gta6/map` | "GTA 6 Interactive Map — 1,000+ Locations in Vice City & Leonida" | 51 | — | H1 reads "1,058 locations" |

**Strengths:** clean titles aimed at real queries; structured data per section; an actual database behind the pages; a newsletter block.
**Weaknesses:** almost no crawlable text; no "last updated" on data pages; no countdown that renders server-side; no release reminder; no comments or share on data pages; dead Discord link; pre-order retailer buttons are `#` placeholders (01 Part A); no links to the game page or calendar; contradictory PC statements.

## 2. Confirmed facts versus rumours (ledger)

| Claim | Status | Source and date |
|---|---|---|
| Release 19 Nov 2026, PS5 and Xbox Series X|S | **Confirmed** | Rockstar Newswire; Xbox store page |
| Two earlier dates (Fall 2025, 26 May 2026) | **Confirmed** delays | Rockstar Newswire posts; Wikipedia |
| Price $79.99; Ultimate $99.99 | **Confirmed** | IGN, 24 Jun 2026 |
| "Single-player experience" at launch | **Confirmed** | IGN, 24 Jun 2026 |
| No PC at launch | **Confirmed** | IGN on Take-Two CEO, 4 May 2026 |
| Pre-orders from 25 Jun 2026; Vintage Vice City Pack bonus | **Confirmed** | Rockstar Newswire; Rockstar pre-order page |
| "An Extended Look" gameplay video, captured on PS5 | **Confirmed** | Rockstar Newswire |
| Netflix preview drove 100,000+ sign-ups in six hours | **Reported** | GamesIndustry.biz, 10 Sep 2026 |
| GTA VI: The Album with Atlantic Records, 19 Nov | **Confirmed** | Rockstar Newswire |
| "The Goodtime State – Vice City Collection" collector's set (~$400, no game) | **Confirmed** | Rockstar Newswire; GameSpot, Eurogamer |
| Limited-edition GTA VI DualSense | **Reported** | Game Informer State of Play round-up, 3 Sep 2026 |
| New modding guidelines (no story expansions, ports, map mashups) | **Reported** | Eurogamer and RPS, 21 Sep 2026 |
| 30 fps on consoles at launch, no performance mode promised | **Reported** | Tom's Hardware, 29 Aug 2026 (cited by Wikipedia) |
| Map "a very big map", beyond RDR2 | **Confirmed** (quote) | IGN, 27 Aug 2026 |
| GTA Online for GTA VI in 2027 | **RUMOR** | The Mirror, 18 Sep 2026; Twitch CEO expectation (RPS, 17 Sep) |
| Switch 2 version | **Denied by ex-developer commentary; no announcement** | GamesRadar+, Wccftech, 25 Sep 2026 |
| Sales "heavily skewed" to PS5 | **Report; Xbox responded** | Pure Xbox, 24 Sep 2026 |
| Rockstar–IWGB tribunal over dismissed staff | **Confirmed proceeding** | GamesIndustry.biz, 14 Sep 2026 |

## 3. Search opportunity table (40 queries)

"Observed" rows come from Bing on 27 Sep 2026. Other rows are standard query forms from the evergreen research (09) and are marked "not observed".

| # | Query | Intent | Who ranks now | TechPlay page | Freshness | Priority |
|---|---|---|---|---|---|---|
| 1 | gta 6 release date | informational | Rockstar, Wikipedia, tech-insider, Xbox, beebom (observed) | Everything We Know | until launch | Med |
| 2 | gta 6 release time | informational | not observed | **new**: time-zone unlock tool | launch week | **High** |
| 3 | gta 6 countdown | navigational | 7+ countdown domains (observed) | hub countdown (fix SSR) | until launch | Med |
| 4 | gta 6 map | informational | stateofleonida, gtabase, exploregta6, gtasixmap, gtavimap (observed) | `/gta6/map` | ongoing | Med |
| 5 | gta 6 interactive map | tool | same fan maps (observed) | `/gta6/map` | ongoing | Med |
| 6 | gta 6 map size | informational | gtabase, Screen Rant, gtavispot, IGN (observed) | **new**: sourced comparison | per reveal | Med |
| 7 | gta 6 leonida | informational | Fandom, fan maps (observed) | map regions | ongoing | Low |
| 8 | gta 6 vice city | informational | gtabase, Rockstar, Wikipedia (observed) | map region page | ongoing | Low |
| 9 | gta 6 characters | informational | gtabase, gtaintel, Fandom (observed) | `/gta6/characters` | per reveal | Med |
| 10 | gta 6 jason | informational | Fandom, fan wikis (observed) | character page | per reveal | Low |
| 11 | gta 6 lucia caminos | informational | Fandom, gtaboom (observed) | character page (429 words) | per reveal | Low |
| 12 | gta 6 cast voice actors | informational | degraded result | **new** | per reveal | Low |
| 13 | gta 6 vehicles list | informational | degraded result | `/gta6/vehicles` | per reveal | Med |
| 14 | gta 6 cars real life | informational | not observed | **new**: real-world equivalents view | per reveal | **High** |
| 15 | gta 6 weapons | informational | degraded result | `/gta6/weapons` | per reveal | Low |
| 16 | gta 6 price | commercial | Rockstar Store, beebom, gta6index, Xbox, IGN (observed) | editions page | stable | Med |
| 17 | gta 6 editions compared | commercial | not observed | **new** | stable | Med |
| 18 | gta 6 collector's edition | commercial | degraded result | news + editions page | stable | Low |
| 19 | gta 6 pre order bonus | commercial | Rockstar, GameStop, Xbox, PlayStation Store (observed "pre order") | editions page | until launch | Med |
| 20 | gta 6 pc | informational | gtaboom, IGN, Rockstar, specvi (observed) | **new**: PC status tracker | until announced | **High** |
| 21 | gta 6 pc requirements | informational | specvi, techbenchpro, gtavispot, pcgamebenchmark (observed) | tie to "can I run it" (only once official) | on announcement | Med |
| 22 | gta 6 switch 2 | informational | gtaboom, Vice, Game Rant, Dexerto (observed) | PC status tracker covers platforms | stable | Low |
| 23 | gta 6 ps5 pro | informational | not observed | platform performance page | launch | Med |
| 24 | gta 6 60fps / 30fps | informational | degraded result | platform performance page | launch | **High** |
| 25 | gta 6 file size | informational | not observed | **new**: pre-load and size page | launch week | **High** |
| 26 | gta 6 pre load time | informational | not observed | same | launch week | **High** |
| 27 | gta 6 online | informational | allthings.how, Polygon, Screen Rant, IGN, Forbes, Mirror (observed) | Online status tracker | 2027 | Med |
| 28 | gta 6 delayed | informational | Rockstar, techwiser, IGN, gtasixguide (observed) | delay timeline section | event-driven | Low |
| 29 | gta 6 trailer 3 | informational | YouTube, Netflix, gta6info, Forbes, beebom (observed) | trailers timeline | event-driven | Low |
| 30 | gta 6 news | news | gtabase, gtaboom, Wikipedia, Rockstar (observed) | hub news feed | daily | Low |
| 31 | gta 6 everything we know | informational | degraded result | Everything We Know (expand) | weekly | Med |
| 32 | gta 6 cheats | informational | degraded result | launch guide | post-launch | Med |
| 33 | gta 6 missions list | informational | not observed | post-launch database | post-launch | Med |
| 34 | gta 6 collectibles map | tool | not observed | map progress tracker | post-launch | **High** |
| 35 | gta 6 best cars | informational | not observed | vehicles DB with stats | post-launch | Med |
| 36 | gta 6 how to make money | informational | not observed | launch guide | post-launch | Med |
| 37 | gta 6 trophies / achievements | informational | not observed | achievement list (TechPlay imports trophies) | post-launch | Med |
| 38 | gta 6 mods rules | informational | not observed (news this week) | explainer | stable | Low |
| 39 | games like gta 6 | discovery | not observed | "games like" template | stable | Med |
| 40 | gta games in order | informational | not observed (see 09 EB rows) | series page | stable | Med |

## 4. Social and video opportunities

| Idea | Format | Evidence | Note |
|---|---|---|---|
| "Things you missed" in each Rockstar drop | Short video, carousel | r/GTA6 top posts are detail-spotting (the lit fridge, "hair physics") | Only from official footage; see risks |
| Map size, sourced | Short video, card | r/GTA6 "Made a video that ACTUALLY shows the size of Vice City" | Cite Rockstar's statement |
| Countdown cards | Daily story/post | Countdown sites own the query | Pair with reminder sign-up |
| Edition comparison | Carousel | $400 set and scalper stories | Clear table |
| "Confirmed vs rumour" weekly | Card or short | Rumour volume high | Trust-building |
| Real-world car matches | Carousel | Vehicle DB exists | Shareable |

## 5. Community demand (FACT from r/GTA6 top-of-year feed and this week's headlines)

Recurring themes: physics and visual detail ("The hair physics are fucking mental"), physical editions ("First look at GTA 6 physical edition"), gifts and spending, staff firings and protests ("GTA 6 developers protest outside Rockstar Games office…"), official image drops ("50 new pictures released by Rockstar Games"), a countdown thread, and worry about the game ("My biggest concern for the game"). Subscriber counts could not be read (Reddit blocked the API).

## 6. Tools fans already use (FACT from pages fetched)

| Tool | What it is |
|---|---|
| map.stateofleonida.net, exploregta6.com, gtasixmap.com, gtavimap.com, gta6map.io, gtalab.gg, leonidaexplorer.com | Fan interactive maps (observed in search) |
| map.gtadb.org | "The original interactive map of GTA IV, V and VI, including all in-game buildings and their real-life…" counterparts |
| gta6.gg | "The Centralized GTA6 Platform — Guides, Databases, Forums, News, Modding, Cheats, Interactive Map" |
| gta6-map.com | Map "with markers, collectibles, quests, locations" |
| gta6countdown.net, gta-6-countdown.com, vicountdown.com, gtasixcountdown.com | Countdowns to 19 Nov 2026 |
| gtabase.com | News, characters, map, vehicles, weapons, missions, radio stations |
| IGN GTA 6 wiki and game page | Guide hub |
| gta6planner.com | "Release Date Countdown & Cost Tools" (observed in search) |

## 7. Tool and database opportunities (13)

1. **Release-time and pre-load tool by time zone**, with a reminder (none of the countdowns observed pairs the timer with an account reminder).
2. **"Confirmed vs rumoured" changelog** with source and date per line.
3. **PC and platform status tracker** (PC, Switch 2, PS5 Pro, 30/60 fps) updated on each statement.
4. **Vehicle real-world equivalents view** from the existing 121-vehicle database.
5. **Edition and bonus comparison** with prices.
6. **Map progress tracker** on the existing 1,058-location map, saved to accounts, switched on at launch.
7. **Collectibles checklist** post-launch, tied to the map.
8. **Achievement/trophy list** using TechPlay's achievement import for "which have I earned".
9. **Character relationship map** from the 12 profiles.
10. **Timeline of every official reveal** (trailers, Extended Look, Game Informer cover).
11. **"Play GTA V first?" story recap** pointing to GTA V Enhanced (in Steam's top 25 this week).
12. **GTA 6 Discord countdown ritual** with Buffy posting daily.
13. **Launch-week performance page** (resolution, frame rate by console) once reviews land.

## 8. Authority-building plan candidates before launch (RECOMMENDATION)

Order matters because the crawl budget is small (03):

1. Fix the plumbing: server-render the counters and a real H1, fix the Discord link, remove `#` pre-order buttons or fill them with disclosed links, link hub ↔ `/games/grand-theft-auto-vi` ↔ calendar, move GTA 6 news off `/games/gta-6`, align the PC statement.
2. Add "last updated" and a changelog to every hub page, and make each data page carry a paragraph of crawlable text.
3. Ship the release-time tool and reminder (09: EA-097).
4. Publish the "confirmed vs rumoured" ledger and update it on every beat.
5. Add the real-world vehicle view.
6. Run the Discord countdown and a launch-night event.

## 9. Launch-window playbook candidates

Before (by 12 Nov): pre-load time and size, editions, unlock time by region, performance expectations. During (19–22 Nov): what to do first, map tracker live, early money and cars, settings (console). After (first month): missions list, collectibles, trophies, "best cars", Online status, PC status.

## 10. Risks

- **DMCA and IP:** Rockstar's new modding guidelines (21 Sep) show active IP policing; use only official media and never leaked footage (a 200GB GTA 5 leak story ran 18 Sep).
- **Misinformation:** rumours dominate the space; labelling protects Discover and News trust.
- **Saturation:** fan domains, IGN, Game Rant and Dexerto will publish hundreds of pages; compete on tools and accounts, not volume.
- **Delay:** two delays already; content must survive a date change.
- **Labour controversy:** the IWGB tribunal is live; cover it factually or not at all.

## Sources used

Rockstar Newswire (release date, Extended Look, The Album, Vice City Collection, pre-orders); Rockstar GTA VI and pre-order pages; Xbox store GTA VI page; IGN (price and single-player, 24 Jun 2026; map size, 27 Aug 2026; no PC at launch, 4 May 2026; GTA 6 wiki and game page); The Mirror (GTA 6 Online 2027, 18 Sep 2026); Wikipedia "Grand Theft Auto VI"; headlines from Eurogamer, GameSpot, GamesRadar+, GamesIndustry.biz, IGN, Pure Xbox, Push Square, RPS, Wccftech and Tom's Hardware (10–27 Sep 2026); Bing results for 40 GTA 6 queries; r/GTA6 RSS; fan sites listed in §6; TechPlay `/gta6` pages. Full URLs in `research-sources.csv`.

## Gaps / needs more data

- Google rankings (only Bing was observed); Search Console for the hub.
- r/GTA6 subscriber and activity counts (Reddit blocked the API).
- TikTok and YouTube GTA 6 trends (pages did not render).
- Hub traffic and newsletter sign-ups from the GTA 6 block.
