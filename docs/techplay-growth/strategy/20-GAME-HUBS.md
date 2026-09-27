# 20 — Game and Platform Hubs (Part 23)

Status: Phase 2 plan — 27 Sep 2026

- **Three new hubs, one mini-hub, two pre-release series hubs, one watch.** Build `/switch-2` (C61, 26 Oct), `/steam` (C62, 2 Nov) and `/mmo` (C15, 10 Nov). Run Modern Warfare 4 as a three-week mini-hub on its game page (C17, 12 Oct–1 Nov). Prepare Fable (23 Feb 2027) and Final Fantasy VII Revelation (8 Apr 2027) series hubs in December. Keep Deadlock on a monthly watch. GTA VI is covered in 19-GTA6.md.
- **Why these:** R18 scores Switch 2, Steam/PC and GTA VI equal on raw total (38) with WoW at 37; weighting tools and weak competition double puts the WoW/MMO hub first because the WoW Analyzer is the only on-site character analyzer among the media sites reviewed [R18, R23 #23].
- **Platform hubs outlast game hubs.** They reuse the database for every game and fit the positioning "the gaming publication that knows what you play" [R18; spine §2]. Game hubs earn their keep only with a tool.
- **One template (D-032), not three builds.** A hub is: an intro and FAQ the editor edits in Filament, sections fed by staff-owned game lists and calendar queries, related articles and a "Last updated" line. DEV builds it once (about 8 h, 12–23 Oct) and each hub instance takes about 2 h, because DEV has 20 h a week and October is full of P0 work.
- **Every hub links down to `/games/[slug]`, across to series pages and the calendar, and every hub game page links back up** ("Part of the Switch 2 hub", D-032a). One URL per intent [R18; R03 §11].
- **Content is templates and trackers, not volume.** Valnet sites publish 73 guides for one game in three days; the plan does not compete there [RESEARCH-COMPLETE #15]. About 60 titled pieces across all hubs by 31 Dec, most of them short, sourced and reusable.
- **Capacity:** 11–28 h/week in October and November across all hubs, about 3 h in GTA launch week, then 16–17 h/week in December (§11). Hub DEV work never exceeds 5 h in a week.
- **Do not build:** Minecraft, Fortnite, Roblox, EA FC, LoL, Valorant, Path of Exile 2, Elder Scrolls VI, Witcher IV, Wolverine, Crimson Desert. Their search results are owned by wikis and dedicated tools, or they have no date yet [R18].

---

## 1. Hub selection

| Hub | R18 raw total | Adjusted rank [R18] | Decision | Campaign | Launch |
|---|---|---|---|---|---|
| WoW / MMO (WoW, FFXIV, GW2) | 37 | 1 | Build `/mmo` around the WoW Analyzer | C13, C14, C15 | 10 Nov |
| GTA VI | 38 | 2 | Existing hub; see 19-GTA6.md | C06–C12 | live |
| Steam / PC | 38 | 3 | Build `/steam` (sales, Next Fest, movers, hardware) | C05, C18, C62, C34 | 2 Nov |
| Nintendo Switch 2 | 38 | 4 | Build `/switch-2` (editions and upgrades) | C61 | 26 Oct |
| Final Fantasy VII Revelation | 31 | 5 | Pre-release series hub, content from Dec | C63 batch | pages 12 Dec |
| Fable | 29 | 6 | Pre-release series hub, content from Dec | C63 batch | pages 5–7 Dec |
| Call of Duty: Modern Warfare 4 | 30 | 7 | Mini-hub on the game page, retire 1 Nov | C17 | 12 Oct |
| Steam hardware | 30 | 8 | Section inside `/steam` | C62 | 2 Nov |
| Persona / Kingdom Hearts | 26–27 | 9 | Series pages only (C63) | C63 | Saturdays |
| Deadlock | 30 | 10 | Watch; one explainer page | — | 20 Oct |

---

## 2. The shared hub template (D-032, with D-032a and D-023)

### 2.1 What DEV builds (about 8 h, 12–23 Oct; D-032 "lite")

The cheap version: a `HubPage` component plus one config entry per hub in the repo (slug, section list ids, calendar filters, event strip). The intro and FAQ are a Guide record (`/guides` model, editable by ED in Filament) fetched by slug `hub-{slug}`, so editors change words without a deploy. A Filament `hubs` table can come in 2027 if more hubs follow.

| Block | Source | Server-rendered | Notes |
|---|---|---|---|
| H1 + intro (150–250 words) + "Last updated {date}" | Guide record `hub-{slug}` (content) + repo config (title) | Yes | Intro is editor-written, dated from the guide's updated_at |
| Up to six sections | Each section = a public game list owned by a TechPlay staff account (`/lists/{staff}/{slug}`) or a calendar query (`/calendar?platform=&month=&genre=`) | First 12 items SSR | Reuses lists, their OG cards and ItemList schema [R01 A.2.3 F19] |
| Related articles | Articles whose `game_id` is in any section list, newest 8 | Yes | No manual curation needed |
| FAQ (5–8 questions) | The same guide's `steps` JSON, one step per question | Yes, FAQPage JSON-LD | Each answer dated and sourced |
| Event calendar strip | Repo config (date, name, confidence label) | Yes | Confidence labels from R05: confirmed / reported / predicted |
| Follow / remind CTA | Existing reminder and wishlist actions; guest modal after D-016 | Client | "Remind me" on every upcoming game tile |
| Newsletter capture | `/newsletter/subscribe` with `source=hub-{slug}` (D-012a pattern) | Client | One line of copy per hub (below) |

- **D-032a (2 h):** a game page shows "Part of the {Hub} hub →" when the game is in any section list of a hub.
- **D-023 (P1):** game pages link their platform and genre facets; `/games/platform/nintendo` and `/games/platform/pc` add a featured link to `/switch-2` and `/steam`.
- **Robots:** hubs are `index, follow` from launch because each ships with an intro and at least 20 items; a hub with fewer than 20 items is `noindex, follow` until it has them.
- **OG image:** one static 1200×630 per hub, ≤ 300 KB (DS 1 h each).

### 2.2 Internal-linking rules (all hubs)

1. Hub → every game in its sections → `/games/[slug]`.
2. `/games/[slug]` → hub (D-032a) and → series page (existing series rail).
3. Hub → series pages (`/games/series/[slug]`) for "in order" intent; the hub never duplicates an in-order list [R18].
4. Hub → `/calendar` with the hub's platform or genre filter.
5. Every hub article → hub (breadcrumb-style link in the first paragraph) + game page + one tool.
6. `/tools` lists tools; each hub links the tools that fit it; each tool links its hub.
7. One canonical URL per intent. If an article and the hub both target the same question, the hub FAQ links to the article and does not repeat it.

### 2.3 Hub newsletter lines (exact)
- `/switch-2`: "Switch 2 releases and upgrade prices, once a week in The Save File. No spam, one-click unsubscribe."
- `/steam`: "Sale picks from people who read the patch notes. Every Friday in The Save File."
- `/mmo`: "Patch dates and readiness checks for WoW, FFXIV and Guild Wars 2, in The Save File."

---

## 3. WoW / MMO hub — `/mmo` (C13, C14, C15)

### 3.1 Facts the hub is built on
- WoW: Midnight live since 2 Mar 2026; patch 12.1.5 predicted about 6 Oct on an eight-week cadence (Blizzard Watch; **prediction**); WoW: Forever on 4 Nov 2026 (**reported**); Blizzard warned WoW: Forever players about gold buying; The Last Titan late 2027 [R05, R06, R18].
- FFXIV: Evercold (8.0) in January 2027 (month confirmed); Switch 2 version since 4 Aug 2026 with a separate subscription [R09 EB-127, EB-148].
- Guild Wars: GW2 quarterly releases; Guild Wars 3 announced June 2026, beta fall 2027 [R09 EB-069].
- WoW Analyzer: public, no login, Blizzard API + Raider.IO + Groq; stores analyses with a public leaderboard and share counter; copy still aimed at "Midnight launches March 2, 2026", claims "50K+ players analyzed · 4.9/5", and its OG image is a 2.5 MB PNG [R01 B.7, R02].

### 3.2 Pages and URLs

| Page | URL | Status | Purpose |
|---|---|---|---|
| MMO hub | /mmo (new) | C15, 10 Nov | Patch calendar (WoW, FFXIV, GW2), Analyzer entry, "Which MMO" section, guides |
| WoW Analyzer | /wow-analyzer | existing; re-aimed 5 Oct | Title "WoW Character Analyzer: patch 12.1.5 readiness check" (change the patch name only when Blizzard confirms it; until then "current patch readiness check") |
| Game pages | /games/{world-of-warcraft slug}, /games/{ffxiv slug}, /games/{guild-wars-2 slug} — verify slugs | existing | Hub badge (D-032a) |
| Series | /games/series/{warcraft slug — verify} | existing | Linked from hub |

### 3.3 Content list (exact titles)

| # | Title | URL | Query / source | Date | Owner | Hours |
|---|---|---|---|---|---|---|
| 1 | WoW patch 12.1.5: release date and a patch-day checklist | /guides/wow-patch-12-1-5-checklist | EB-144; C13 | Mon 5 Oct (headline says "expected" until Blizzard dates it) | ED | 3 |
| 2 | Is your character ready for 12.1.5? Run the WoW Analyzer | /wow-analyzer (copy) | C13, D-040 | Mon 5 Oct | DEV/ED | 3 |
| 3 | What is a good Raider.IO score? The colours explained | /guides/what-is-a-good-raider-io-score | EB-064 (Raider.IO's own percentile tiers) | Tue 13 Oct | ED | 3 |
| 4 | Is WoW worth playing in 2026? | /guides/is-wow-worth-playing-2026 | EB-059 | Tue 20 Oct | ED | 4 |
| 5 | WoW: Forever explained: what it is, when it launches, who it's for | /guides/wow-forever-explained | C14; R05 | Wed 28 Oct (sourced to Blizzard; reported date labelled) | ED | 4 |
| 6 | Which WoW should you play: Retail, Classic or Forever? | /guides/which-wow-should-you-play | R05 "after" row; EB-068 | Wed 4 Nov (launch day) | ED | 4 |
| 7 | Guild Wars 2 vs WoW in 2026 | /guides/guild-wars-2-vs-wow | EB-062 (LOW competition) | Tue 10 Nov | ED | 4 |
| 8 | Best MMOs to play in 2026 | /guides/best-mmo-2026 | EB-060 | Tue 10 Nov | ED | 4 |
| 9 | How to get into Final Fantasy XIV in 2026 | /guides/how-to-get-into-ffxiv | EB-061 | Tue 24 Nov | ED | 3 |
| 10 | FFXIV on Switch 2: subscription and cross-play explained | /guides/ffxiv-switch-2 | EB-127 | Tue 1 Dec | ED | 2 |
| 11 | FFXIV Evercold: release date and what's confirmed (living) | /guides/ffxiv-evercold-release-date | EB-148 | Tue 8 Dec | ED | 2 |
| 12 | Guild Wars 3: everything we know (living) | /guides/guild-wars-3-everything-we-know | EB-069 | Tue 15 Dec | ED | 2 |

Not planned: class guides, tier lists, addon roundups. Wowhead, Icy Veins and Archon own those [R09 cluster D]. The Midnight addons guide stays but gets no promotion.

### 3.4 Tools
- **WoW Analyzer re-aim (D-040, P0, by 5 Oct):** remove "50K+ players analyzed · 4.9/5"; replace "Midnight launches March 2, 2026"; change the Groq readiness prompt's launch-date constant (`GroqService.php:110`) to the current content; OG to a 1200×630 JPEG ≤ 300 KB named `wow-analyzer-og.jpg`.
- **Analyzer share card (TOOL-17 extension):** "{Character}, {realm}: readiness {score}/100 for {patch}" on the existing shareable analysis pages.
- **Save to profile (REG-27):** after a run, "Save this character to your TechPlay profile" → Battle.net sign-in (one click, already built).
- **Weekly reset checklist (TOOL-18):** LATER; see 21-GAMING-TOOLS.md.

### 3.5 Cadence
- **F15 Readiness Check, every Tuesday** (US weekly reset): Discord #wow post + one X/Bluesky post with a tip and the Analyzer link. Exact template: "Weekly reset. One thing to check before your first key: {tip, from patch notes}. Run your character: techplay.gg/wow-analyzer". Tips come only from Blizzard patch notes or Raider.IO's own documentation.
- **Patch days** (confirmed by Blizzard): checklist article updated the same day.
- **Expansion calendar:** Evercold (Jan 2027), Guild Wars 3 beta (fall 2027), The Last Titan (late 2027) listed in the hub strip with confidence labels.

### 3.6 Promotion plan

| Channel | What | When | Owner |
|---|---|---|---|
| Search | Items 3, 4, 7, 8 target MED/LOW-competition queries [R09] | from 13 Oct | ED |
| Discover | Items 5 and 6 around the 4 Nov launch; landscape image from Blizzard press assets | 28 Oct–5 Nov | ED |
| Discord | `#wow` channel; `@WoW` role in Onboarding; F15 weekly; WoW: Forever launch-night thread 4 Nov (text, not an event) | from 6 Oct | SC |
| Reddit (C47) | r/wow and r/classicwow helpful answers on readiness and Raider.IO questions, Analyzer link only when it answers the question | 1 comment/week | SC |
| X / Bluesky | F15 Tuesday post; hub launch post 10 Nov: "New: one page for WoW, FFXIV and Guild Wars 2 patch dates, with a readiness check for your WoW character. techplay.gg/mmo" | weekly | SC |
| Email | "MMO desk" line in The Save File on patch weeks | as needed | SC |
| Paid | C58 Reddit test (WoW Analyzer creative) only if the GTA ad set leaves budget; 18+ | 9–25 Nov | EIC |

### 3.7 KPIs

| KPI | Event | TARGET |
|---|---|---|
| Analyzer runs | `tool_run` (tool=wow) per week | Up week over week for four weeks after 5 Oct; review 2 Nov |
| Analyzer → account | `registration_complete` (method=battlenet, from=wow-analyzer) ÷ runs | ≥ 3% |
| Hub search presence | Search Console impressions for /mmo and items 3, 4, 7, 8 | > 0 for all by 30 Nov |
| Discord | Distinct members posting in #wow per week | 10 by 30 Nov |
| Share | `share_card_generated` (type=wow) | ≥ 1 per 20 runs |

Owner: ED (hub editor), DEV (D-040, template instance), SC (Discord, Reddit). Hours: C13 9 h, C14 8 h, C15 16 h (DEV 2, ED 12, DS 1, SC 1), then 3 h/week.

---

## 4. Steam / PC hub — `/steam` (C05, C18, C62, C34)

### 4.1 Facts the hub is built on
- Steam calendar (Steamworks, confirmed): Autumn Sale 1–8 Oct; Cooking Fest 12–19 Oct; Next Fest 19–26 Oct (press preview 8 Oct); Scream V Fest 26 Oct–2 Nov; Auto-Battler RPG Fest 16–23 Nov; Winter Sale 17 Dec–4 Jan; Next Fest from 22 Feb 2027; Spring Sale 18–25 Mar 2027 [R05].
- Valve hardware: Steam Machine (29 Jun 2026), Steam Frame VR headset (18 Sep 2026, $1,059/$1,299), Deck OLED price rise to $789/$949 (27 May 2026) [R05].
- Weekly most played (week to 26 Sep): CS2, Dota 2, PUBG top three; WARDOGS fifth; Total War: WARHAMMER III from 67th to 28th after a DLC; Deadlock and GTA V Enhanced in the top 25 [R05, R06].
- TechPlay's edge: Steam sign-in and library import, nightly Steam prices for owned games (US, Steam only), wishlists and reminders [R01, R10]. SteamDB has data but not your shelf [R18].

### 4.2 Pages and URLs

| Page | URL | Purpose |
|---|---|---|
| Steam hub | /steam (new, 2 Nov) | Event calendar strip; "This week on Steam" (F13 movers); sale section (live during sales); Next Fest section (archive after 26 Oct, live again Feb 2027); hardware section; PC fixes link; "Import your Steam library" CTA |
| Next Fest list | /lists/{staff}/steam-next-fest-october-2026 | C18 tracker as a staff list (tier list format: "Play now", "Wishlist", "Skip") |
| Sale lists | /lists/{staff}/steam-autumn-sale-2026-picks, /lists/{staff}/steam-winter-sale-2026-picks | Picks with shelf buttons |
| PC fixes | /guides/pc-fixes (C60, 12 Oct) | Linked as a hub section |
| Steam Curator | TechPlay curator page on Steam (C69, 20 Oct) | Links back to /steam |

### 4.3 Content list (exact titles)

| # | Title | URL | Campaign / source | Date | Hours |
|---|---|---|---|---|---|
| 1 | Steam Autumn Sale 2026: 20 picks, and how to check your wishlist in one go | /news/steam-autumn-sale-2026-picks + staff list | C05; F16 | Thu 1 Oct 09:00 CET | ED 4 |
| 2 | Steam Autumn Sale: last-day picks under $10 | /news/steam-autumn-sale-last-day-picks | C05 | Wed 7 Oct | ED 2 |
| 3 | What time do Steam games release? How unlock times work | /guides/what-time-do-steam-games-release | EA-099 | Fri 9 Oct | ED 3 |
| 4 | Steam Next Fest October 2026: 20 demos to try first | /news/steam-next-fest-october-2026-demos + staff list | C18; R05 | Fri 16 Oct | ED 5 |
| 5 | Next Fest Diary: day {n}, three demos tried and rated | /news/next-fest-diary-day-{n} (8 short posts) | F23 | Mon 19–Mon 26 Oct | ED 8 total |
| 6 | Next Fest wrap: the demos we'd wishlist | /news/steam-next-fest-october-2026-wrap | C18 | Tue 27 Oct | ED 2 |
| 7 | What is Deadlock, and can you play it? | /guides/what-is-deadlock | R06 #23 | Tue 20 Oct | ED 3 |
| 8 | Steam Movers: this week's biggest climbers (weekly) | /news/steam-movers-{yyyy-ww} | F13; TOOL-27 | Tuesdays from 29 Sep | ED 1/week |
| 9 | Steam Frame launched: VR games to start with | /news/steam-frame-vr-games-to-start-with | R06 #28 | Tue 3 Nov | ED 3 |
| 10 | Steam Machine: specs, price and what it runs | /guides/steam-machine-faq | EA-064 | Thu 5 Nov | ED 3 |
| 11 | Is the Steam Deck worth it in 2026? | /guides/is-steam-deck-worth-it-2026 | EA-109; F10 | Wed 11 Nov | ED 3 |
| 12 | Steam Deck Verified explained: Verified, Playable, Unsupported | /guides/steam-deck-verified-explained | EA-058 | Wed 25 Nov | ED 2 |
| 13 | Steam Winter Sale 2026: our picks, filtered by what you already own | /news/steam-winter-sale-2026-picks + staff list | C34 | Thu 17 Dec, when the sale opens | ED 4 |
| 14 | Steam Winter Sale: the second-week list | /news/steam-winter-sale-2026-week-two | C34 | Wed 23 Dec | ED 2 |

The "Steam sale" start time in titles is only stated if Valve publishes it; otherwise "when the sale opens".

### 4.4 Tools
- **Now:** library import (existing), wishlist + release reminder (existing), Steam Movers weekly (TOOL-27, editorial), Next Fest tracker as a staff list (TOOL-48, editorial).
- **Next (Nov–Dec):** wishlist price-drop alerts (D-027, C31 from 20 Nov), "My library is worth $X" card (TOOL-03), sale picks from your wishlist (TOOL-47). Specs in 21-GAMING-TOOLS.md.
- **Later (2027):** public Steam library calculator (D-037), price history block, Deck-verified list.

### 4.5 Cadence
Weekly Tuesday F13 movers; sale events per Steam's calendar; Next Fest twice a year; hardware when Valve ships or prices change.

### 4.6 Promotion plan

| Channel | What | When | Owner |
|---|---|---|---|
| Search | Items 3, 7, 10, 11, 12 (evergreen); sale pages refreshed in place each year | ongoing | ED |
| Discord | `#steam-deals` channel; sale picks posted once at open, once on last day; Next Fest Diary daily | during events | SC |
| Reddit (C47) | r/Steam and r/pcgaming helpful answers; F13 movers table as a comment where the thread asks about player counts | 1/week | SC |
| X / Threads / Bluesky | F13 Tuesday card "Up this week on Steam: {game} from {rank} to {rank}" (Steam charts API numbers only) | weekly | SC |
| Instagram carousel | Sale picks (5 slides) on sale day one | 1 Oct, 17 Dec | SC, DS |
| Email | The Save File sale edition on 2 Oct and 18 Dec; C31/C32 alerts later | per event | SC |
| Steam Curator (C69) | 10 recommendations at launch (20 Oct), each linking its game page; one per week after | from 20 Oct | ED |
| Studio outreach (C71) | Next Fest developers in the Balkans offered a line in the Diary if their demo is in the fest | 5–20 Oct | EIC |

Launch post for `/steam` (2 Nov, X, exact): "New on TechPlay: one page for Steam. The event calendar, this week's biggest movers, sale picks when there's a sale, and a link to import your Steam library if you want picks that skip what you own. techplay.gg/steam"

### 4.7 KPIs

| KPI | Event | TARGET |
|---|---|---|
| Steam imports from the hub | `library_connected` (platform=steam, from=steam-hub) | ≥ 5% of hub sessions that click the CTA |
| Wishlist adds from sale and Next Fest lists | `shelf_add` (status=wishlist) with list referrer | 150 across Autumn Sale, Next Fest and Winter Sale |
| Hub search presence | Impressions for /steam and items 3, 7, 10–12 | > 0 for all by 15 Dec |
| Curator followers | Steam Curator page count (Steam-reported) | Record baseline 20 Oct; report monthly |

Owner: ED. Hours: C05 6 h; C18 15 h (ED 13, SC 2); C62 hub 10 h (DEV 2, ED 6, DS 1, SC 1); weekly F13 1 h; C34 8 h.

---

## 5. Nintendo Switch 2 hub — `/switch-2` (C61, Mon 26 Oct)

### 5.1 Facts the hub is built on
- Switch 2: 23M+ units by June 2026; price $499.99 from 1 Sep 2026; a production cut above 30% reported by Bloomberg; backward compatible with most Switch games, with exceptions [R05, R09 EB-122].
- Dated Switch 2 releases (R05, confirmed unless noted): Dragon's Dogma 2: Dark Arisen incl. Switch 2 (9 Oct, reported); Call of Duty: Modern Warfare 4 (23 Oct); Minecraft Bedrock (27 Oct); Pikmin 4 Switch 2 Edition + Dandori Academy and Metaphor: ReFantazio (12 Nov); Xenoblade Chronicles 3 Switch 2 Edition (3 Dec); Monster Hunter Wilds (4 Dec); Metroid Ravenous (28 Jan 2027); 007 First Light (March 2027, month confirmed); Persona 4 Revival Switch 2 (20 May 2027). Already out: Diablo IV (16 Sep 2026), FFXIV (4 Aug 2026).
- Mario Kart World: 15.39M sold by 30 Jun 2026 [R09 EB-125].

### 5.2 Pages and URLs

| Page | URL | Purpose |
|---|---|---|
| Switch 2 hub | /switch-2 (new) | Upgrade tracker, upcoming releases (calendar query platform = Switch 2), FAQ, guides |
| Edition and upgrade tracker | /switch-2#tracker (section; staff list + table in hub row) | TOOL-31 |
| Upcoming Switch 2 games | /calendar?platform={Switch 2 value — verify} | Linked, not duplicated |
| Platform facet | /games/platform/nintendo | Featured link to /switch-2 (D-023) |

### 5.3 The edition and upgrade tracker (TOOL-31)
Columns: Game (links `/games/[slug]`) · Type (Switch 2 native / Switch 2 Edition / paid upgrade / port) · Release date · Upgrade price (from Nintendo eShop when listed; otherwise "not listed") · Physical format note (only if Nintendo or the publisher states it) · Source link · Last checked. Launch set: the 11 titles in §5.1 plus any game the ED confirms from Nintendo's own pages during the week of 19 Oct. Updated every Tuesday (F08 day).

### 5.4 Content list (exact titles)

| # | Title | URL | Source | Date | Hours |
|---|---|---|---|---|---|
| 1 | Does Switch 2 play Switch 1 games? What works and what doesn't | /guides/does-switch-2-play-switch-games | EB-122 | Tue 20 Oct | ED 3 |
| 2 | Modern Warfare 4 on Switch 2: what's confirmed | /news/modern-warfare-4-switch-2-confirmed | R05; EA-070 | Wed 21 Oct | ED 2 |
| 3 | Switch 2 setup: 120Hz, VRR, HDR and microSD Express | /guides/switch-2-setup-120hz-vrr-hdr | EA-016 | Sat 24 Oct (F08) | ED 3 |
| 4 | Every Switch 2 Edition and upgrade, with prices (tracker) | /switch-2#tracker | TOOL-31 | Mon 26 Oct (hub launch) | ED 5 |
| 5 | Minecraft Bedrock on Switch 2: the upgrade and cross-play questions answered | /news/minecraft-bedrock-switch-2-faq | R06 #19 | Tue 27 Oct | ED 2 |
| 6 | Switch to Switch 2: moving saves, system transfer and upgrade packs | /guides/switch-to-switch-2-transfer | EA-076 | Sat 31 Oct | ED 3 |
| 7 | Upcoming Switch 2 games: November and December 2026 | /news/upcoming-switch-2-games-nov-dec-2026 | EB-124 | Sun 1 Nov | ED 2 |
| 8 | Is Switch 2 worth it at $499.99? | /guides/is-switch-2-worth-it | F10 | Wed 4 Nov | ED 3 |
| 9 | Pikmin 4 and Metaphor on Switch 2: are the upgrades worth it? | /news/pikmin-4-metaphor-switch-2-upgrades | R05 row 12 Nov | Thu 12 Nov | ED 2 |
| 10 | Monster Hunter Wilds on Switch 2: what to expect on 4 December | /news/monster-hunter-wilds-switch-2-what-to-expect | EB-126 | Tue 1 Dec | ED 2 |
| 11 | Best Switch 2 games of 2026 | /guides/best-switch-2-games-2026 | EB-123 | Tue 15 Dec | ED 4 |
| 12 | Just got a Switch 2? The first hour, and how to track your games | /guides/new-switch-2-owner-guide | R05 25 Dec row | Mon 21 Dec | ED 3 |

Note on item 12: TechPlay imports Steam, Xbox, PlayStation, GOG and Epic, not Nintendo [R01]. The guide says so plainly and shows the shelf's manual add instead of implying an import.

### 5.5 Promotion plan

| Channel | What | When | Owner |
|---|---|---|---|
| Search | Items 1, 3, 6 evergreen; tracker targets "switch 2 edition upgrade price" | from 20 Oct | ED |
| F08 Where Can I Play It? | Tue + Sat; Switch 2 questions first while the hub is new | from 20 Oct | ED, SC |
| Instagram carousel | "Every Switch 2 upgrade this autumn, with prices" (6 slides) | 26 Oct | DS, SC |
| X / Threads / Bluesky | Launch post 26 Oct (exact): "We've started a Switch 2 upgrade tracker: every Switch 2 Edition and paid upgrade, the price where Nintendo lists one, and the source. techplay.gg/switch-2" | 26 Oct | SC |
| Reddit (C47) | r/NintendoSwitch2 helpful answers on upgrade prices, linking Nintendo first | 1/week | SC |
| Discord | `#nintendo` channel; tracker updates posted Tuesdays | weekly | SC |
| Email | Save File line on 30 Oct and 13 Nov | — | SC |

### 5.6 KPIs
- Tracker freshness: updated 10 of 10 Tuesdays to 29 Dec (process).
- `reminder_set` on Switch 2 games from hub tiles: TARGET 100 by 31 Dec.
- Search Console impressions for /switch-2 and items 1, 3, 6: > 0 by 30 Nov.

Owner: ED. Hours: build 14 h (DEV 2, ED 10, DS 2), then 3 h/week.

---

## 6. Modern Warfare 4 mini-hub (C17, Mon 12 Oct – Sun 1 Nov)

**Home:** `/games/{modern-warfare-4 slug — verify}`, with a pinned "MW4 launch guide" box listing the pieces below. No separate route; after 1 Nov the box is removed and the pieces link to `/games/series/{call-of-duty slug}` [R18: "retire into the series page"].

**Facts:** campaign early access 16 Oct for digital pre-orders; full launch 23 Oct on PS5, Xbox, PC and Switch 2; not day one on Game Pass; first CoD on a Nintendo platform since Ghosts [R05].

| # | Title | URL | Source / query | Date | Hours |
|---|---|---|---|---|---|
| 1 | Modern Warfare 4: release date, early access and platforms | /news/modern-warfare-4-release-date-early-access | EB-145; R05 | Mon 12 Oct | ED 2 |
| 2 | Modern Warfare 4 PC requirements, explained | /guides/modern-warfare-4-pc-requirements | EA-086 (official requirements only) | Tue 13 Oct or when Activision publishes | ED 2 |
| 3 | Modern Warfare 4 release time and pre-load, by platform | /news/modern-warfare-4-release-time-preload | EA-098 (official only) | Wed 14 Oct | ED 2 |
| 4 | Which Call of Duty should you get in 2026? | /guides/which-call-of-duty-should-you-get-2026 | R06 #9 | Thu 15 Oct | ED 4 |
| 5 | Every Call of Duty in order | /games/series/{call-of-duty slug} | EB-010; C63 | Sat 17 Oct | ED 3 |
| 6 | Is Modern Warfare 4 on Game Pass? Not on day one | /news/modern-warfare-4-game-pass | R05 | Tue 20 Oct | ED 1 |
| 7 | Modern Warfare 4 on Switch 2: what's confirmed | /news/modern-warfare-4-switch-2-confirmed | shared with §5.4 item 2 | Wed 21 Oct | — |
| 8 | Modern Warfare 4 is out: crossplay, platforms and what to know | /news/modern-warfare-4-launch-day | EA-070 (crossplay only as officially stated) | Fri 23 Oct | ED 2 |
| 9 | Modern Warfare 4, Secure Boot and anti-cheat: how to check your PC | /guides/modern-warfare-4-secure-boot | EA-006 (only if Activision requires it) | Mon 26 Oct | ED 3 |

Not planned: "best settings by GPU tier" (EA-050) needs testing TechPlay does not do [R09]; loadout and Warzone guides (Dexerto-class competition).

**Promotion:** X thread on 12 Oct linking items 1–4; Discord `#fps` post 23 Oct; F08 on 17 Oct ("Where can I play MW4? Four platforms, including Switch 2"); Reddit r/CallOfDuty helpful answers on platform and Game Pass questions (1 comment). No paid.

**KPIs:** `reminder_set` on the MW4 game page before 23 Oct (TARGET 50); impressions for items 1–3 in Search Console (> 0 by 23 Oct).

Owner: ED. Hours: 21 h total, 12–26 Oct.

---

## 7. Pre-release series hubs: Fable and Final Fantasy VII Revelation (Q4 preparation)

Both use existing surfaces: the game page (countdown + Remind me), the series page (in-order list, C63) and one living "everything confirmed" article. No new route.

### 7.1 Fable (23 Feb 2027; PS5, PC, Xbox; Game Pass day one; moved to avoid GTA VI; top-four Steam wishlist) [R05, R18]

| Title | URL | Date | Hours |
|---|---|---|---|
| Fable games in order | /games/series/{fable slug — verify} (C63 Saturday batch) | Sat 5 Dec | ED 3 |
| Fable (2027): release date, platforms and Game Pass | /news/fable-2027-release-date-platforms-game-pass (living) | Mon 7 Dec (before The Game Awards on 10 Dec) | ED 3 |
| Fable: everything shown so far (updated after The Game Awards) | same URL, TGA section | Fri 11 Dec | ED 1 |

### 7.2 Final Fantasy VII Revelation (8 Apr 2027; PS5, PC, Xbox, Switch 2) [R05, R18]

| Title | URL | Date | Hours |
|---|---|---|---|
| Final Fantasy games in order, and which ones connect | /games/series/{final-fantasy slug — verify} (C63) | Sat 12 Dec | ED 4 |
| Final Fantasy VII Revelation: release date, platforms and editions | /news/final-fantasy-vii-revelation-release-date (living) | Mon 14 Dec | ED 2 |
| Final Fantasy VII Remake and Rebirth: the story so far | /guides/final-fantasy-vii-remake-rebirth-story-so-far | draft Dec, publish Tue 12 Jan 2027 | ED 6 |

**Promotion (both):** game-page "Remind me" as the CTA on every piece; C70 "2027 Most Anticipated" (21–31 Dec) links both; X post on publication; Discord `#rpg` thread. **KPI:** `reminder_set` for Fable and FF7 Revelation, TARGET 75 each by 31 Jan 2027. **Owner:** ED. **Hours:** 19 h across December and January.

---

## 8. Deadlock watch

- **Facts:** unreleased; first on Steam's most-wishlisted list; 23rd in weekly most played (84,476 peak, week to 26 Sep) [R05, R06].
- **Page:** "What is Deadlock, and can you play it?" (§4.3 item 7, 20 Oct), linked from `/steam` and the game page.
- **Monthly check (ED, 30 min, first Tuesday):** Steam charts rank, store page status, any Valve release statement. Logged in the hub sheet.
- **Trigger to build a hub:** Valve announces a release date or opens public access. Then: hero list, "can I play it" FAQ, reminder, `/steam` section. Until then, no further content.

---

## 9. Hub page layouts (exact copy for launch)

### 9.1 `/switch-2` (26 Oct)

| Block | Copy (exact) |
|---|---|
| Title tag | Switch 2 Hub: editions, upgrades and release dates \| TechPlay |
| H1 | Nintendo Switch 2: editions, upgrades and what's coming |
| Intro, first paragraph | "Switch 2 costs $499.99 in the US since 1 September, and more games now arrive as a Switch 2 Edition or a paid upgrade than as new releases. This page tracks both: what each upgrade costs where Nintendo lists a price, when it lands, and where the information comes from. Updated every Tuesday." |
| Section 1 | "Upgrades and Switch 2 Editions" (tracker table, §5.3) |
| Section 2 | "Coming to Switch 2" (calendar query, next 90 days; each tile has Remind me) |
| Section 3 | "Questions people ask" (FAQ: backward compatibility, 120Hz/VRR, transfer, microSD Express, MW4, Minecraft) |
| Section 4 | "Guides" (§5.4 items, newest first) |
| CTA strip | "Track the Switch 2 games you want. We'll remind you on release day." Button "Start your library" → `/register?from=hub-switch-2` |
| Footer line | "Sources are linked on every row. Spot an error: redakcija@techplay.gg." |

### 9.2 `/steam` (2 Nov)

| Block | Copy (exact) |
|---|---|
| Title tag | Steam Hub: sales, Next Fest, weekly movers \| TechPlay |
| H1 | Steam: what's on sale, what's rising, what's next |
| Intro, first paragraph | "Steam runs on a public calendar: sales, themed fests and Next Fest twice a year. This page follows it, adds the week's biggest movers from Steam's own charts, and, if you import your Steam library, leaves out what you already own. Updated every Tuesday." |
| Event strip | Scream V Fest 26 Oct–2 Nov · Auto-Battler RPG Fest 16–23 Nov · Winter Sale 17 Dec–4 Jan · Next Fest from 22 Feb 2027 · Spring Sale 18–25 Mar 2027 (all "confirmed", Steamworks) |
| Section 1 | "Up this week" (F13 table: game, rank now, rank last week, peak players, source: Steam charts) |
| Section 2 | "Sale picks" (staff list; hidden outside sale windows) |
| Section 3 | "Next Fest" (archive list; "Next edition: 22 Feb 2027") |
| Section 4 | "Valve hardware" (Steam Deck, Steam Machine, Steam Frame guides) |
| Section 5 | "When PC games break" (link block to `/guides/pc-fixes`) |
| CTA strip | "Import your Steam library and every list on this page skips what you already own." Button "Sign in with Steam" (after D-015) or "Link Steam" → `/register?from=hub-steam` |

### 9.3 `/mmo` (10 Nov)

| Block | Copy (exact) |
|---|---|
| Title tag | MMO Hub: WoW, FFXIV and Guild Wars 2 patch dates \| TechPlay |
| H1 | MMOs: patch dates, readiness and which one to play |
| Intro, first paragraph | "Three MMOs, one calendar. World of Warcraft, Final Fantasy XIV and Guild Wars 2 patch and expansion dates, each marked confirmed, reported or predicted, plus a readiness check for your WoW character that reads Blizzard's and Raider.IO's data. Updated on patch days." |
| Tool block | "Is your character ready? Enter a name and realm." → `/wow-analyzer` (no login) |
| Section 1 | "Dates" (event strip: WoW patch, WoW: Forever 4 Nov (reported), Evercold January 2027, Guild Wars 3 beta fall 2027, The Last Titan late 2027) |
| Section 2 | "Which MMO?" (items 4, 6, 7, 8) |
| Section 3 | "FFXIV" and "Guild Wars" (items 9–12) |
| CTA strip | "Save your WoW character to a TechPlay profile with one Battle.net sign-in." Button "Sign in with Battle.net" |

---

## 10. Measurement

| Campaign | `utm_campaign` | Key events | Report |
|---|---|---|---|
| C05 Steam Autumn Sale | c05-steam-autumn-sale | `shelf_add` (wishlist), `cta_click` (list) | 9 Oct |
| C13 WoW 12.1.5 push | c13-wow-patch | `tool_run` (wow), `registration_complete` (battlenet) | 13 Oct |
| C17 MW4 mini-hub | c17-mw4-hub | `reminder_set` (MW4) | 26 Oct |
| C18 Next Fest | c18-next-fest | `shelf_add` from list | 27 Oct |
| C61 Switch 2 hub | c61-switch2-hub | `reminder_set`, `newsletter_signup` (source=hub-switch-2) | monthly |
| C62 Steam hub | c62-steam-hub | `library_connected` (steam), `shelf_add` | monthly |
| C14 / C15 MMO | c14-wow-forever, c15-mmo-hub | `tool_run` (wow), `share_card_generated` (wow) | monthly |
| C34 Winter Sale | c34-steam-winter-sale | `shelf_add`, `alert_clicked` (after D-027) | 5 Jan 2027 |

Hub sessions are read from the first-party collector by path (it counts sessions, not unique visitors [R14 §6]); Search Console is read per hub URL every Monday by ED.

---

## 11. Hub calendar and capacity

| Week | Hub work (IDs) | EIC | ED | SC | DS | DEV | Total |
|---|---|---|---|---|---|---|---|
| 28 Sep–4 Oct | C05 picks; C13 prep; D-040 | 0 | 8 | 2 | 1 | 3 | 14 |
| 5–11 Oct | C13 launch (5 Oct); C05 last day; Steam release-time guide | 0 | 9 | 2 | 0 | 0 | 11 |
| 12–18 Oct | C17 MW4 (items 1–5); C18 list; D-032 lite (part 1) | 1 | 16 | 3 | 1 | 3 | 24 |
| 19–25 Oct | Next Fest Diary; MW4 launch; Switch 2 content; D-032 lite (part 2) | 1 | 16 | 4 | 2 | 5 | 28 |
| 26 Oct–1 Nov | C61 `/switch-2` launch; C14 WoW: Forever; Steam hub prep | 0 | 14 | 3 | 2 | 2 | 21 |
| 2–8 Nov | C62 `/steam` launch; D-032a badge; WoW: Forever launch day | 0 | 11 | 3 | 1 | 4 | 19 |
| 9–15 Nov | C15 `/mmo` launch; Steam Deck guide; Pikmin/Metaphor | 0 | 10 | 2 | 1 | 2 | 15 |
| 16–22 Nov | GTA launch week: F13 and trackers only | 0 | 2 | 1 | 0 | 0 | 3 |
| 23 Nov–13 Dec (per week) | FFXIV items; Switch 2 tracker; Fable and FF7 prep; MH Wilds | 0 | 12 | 3 | 1 | 1 | 17 |
| 14 Dec–31 Dec (per week) | C34 Winter Sale; best Switch 2 of 2026; new-owner guide | 0 | 11 | 3 | 1 | 1 | 16 |

Combined with GTA (19-GTA6.md §14), the heaviest weeks are 12–18 Oct (GTA 22 h + hubs 24 h = 46 h), 19–25 Oct (16 h + 28 h = 44 h) and 16–22 Nov (60 h + 3 h = 63 h). All stay under half of the 135 h budget, leaving the rest for news, franchises, email and community. DEV is the tight role: GTA plus hubs take 13 of DEV's 20 h in the week of 12 Oct and 8 h in the week of 19 Oct. If ED hours run out, drop in this order: Next Fest Diary (keep day one and the wrap), Steam Frame piece, FFXIV Switch 2 piece, MW4 Secure Boot piece.

---

## 12. KPI summary

| Hub | Primary KPI | TARGET | Review |
|---|---|---|---|
| /mmo | Analyzer runs → accounts | ≥ 3% conversion | 30 Nov |
| /steam | Steam imports from hub CTA; wishlist adds from lists | ≥ 5% of CTA clicks; 150 adds | 4 Jan 2027 |
| /switch-2 | Reminders from hub tiles; tracker freshness | 100; 10 of 10 Tuesdays | 31 Dec |
| MW4 | Reminders on the game page | 50 by 23 Oct | 26 Oct |
| Fable / FF7 | Reminders | 75 each by 31 Jan 2027 | 31 Jan 2027 |
| All hubs | Search Console impressions on every hub URL | > 0 within 4 weeks of launch | monthly |

All targets are goals set without a traffic baseline (none exists [R03]); reset them after the first four weeks of measured data under C03.

---

## Dependencies and open questions

**Dependencies**
- D-032 hub template (lite: component + repo config + guide-record intro) by 23 Oct; D-032a hub badge on game pages; D-023 facet links.
- D-040 WoW Analyzer copy, prompt date and OG by 5 Oct; REG-27 "Save this character" (Battle.net sign-in exists).
- D-016 guest Remind-me modal (19 Oct) so hub tiles convert guests; D-012a newsletter `source` tag for hub sign-ups.
- C35 Discord channels (`#wow`, `#steam-deals`, `#nintendo`, `#fps`, `#rpg`) and Onboarding roles by 12 Oct.
- C60 PC Fix Hub (12 Oct) for the `/steam` PC section; C69 Steam Curator page (20 Oct).
- D-027 price alerts for the Winter Sale section to show "on sale from your wishlist".

**Open questions**
1. Game and series slugs for WoW, FFXIV, GW2, MW4, Call of Duty, Fable and Final Fantasy (verify in the database before links are written).
2. The platform value the calendar uses for Switch 2 (`platform=` filter); `/games/platform/` today only has family facets (pc, playstation, xbox, nintendo, mobile, retro) in `lib/gameFacets.ts`.
3. Is WoW patch 12.1.5 dated by Blizzard? The plan treats 6 Oct as a prediction [R05].
4. What exactly WoW: Forever is, from Blizzard's own pages. The research has the date (reported) and the gold-buying warning, not the product description.
5. Which staff account owns the hub lists (a "TechPlay Editors" account is suggested so lists read as editorial, not personal).
6. Spine landing-page list: this plan adds no new top-level routes beyond `/mmo`, `/steam` and `/switch-2` (already in the spine); hub sections live on lists, guides and news URLs.
