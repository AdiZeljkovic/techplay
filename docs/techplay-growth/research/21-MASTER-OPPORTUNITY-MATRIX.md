# 21 — Master Opportunity Matrix

Status: Phase 1 research draft — 27 Sep 2026
Scope: every significant opportunity found in files 01–20, scored on one model so the planning phase can compare a tool against a data story against a technical fix. **291 opportunities** are scored. Machine-readable copy: `opportunities.json` (same scores, plus notes and source file).

## How to read the scores

Twelve dimensions, each 1–5. **All scores are ESTIMATE** made from the evidence in the source file named in each row; none is a measured forecast. Three dimensions are oriented so that 5 is better for TechPlay:

| Dimension | 5 means |
|---|---|
| Potential traffic | large addressable demand |
| Growth rate | demand rising or tied to a near event |
| Competition | **weak** competition |
| TechPlay fit | uses data, tools or assets TechPlay already has |
| SEO value | builds durable search visibility |
| Social value | likely to be shared |
| Registration value | gives a reason to create an account |
| Retention value | gives a reason to return |
| Backlink value | likely to be cited |
| Revenue potential | later supports ads, affiliate or sponsorship |
| Difficulty | **easy** (small build) |
| Time to impact | **fast** |

Total is the sum (maximum 60). Scores were assigned by rules per source type, then hand-set for fixes and channel plays:

- **Tools (10):** traffic and SEO from the SEO landing column; social from share; retention from retention; difficulty and time from effort (S=5, M=3, L=2, XL=1); fit 5 if the data exists.
- **Digital PR (14):** social from shareability; backlink from authority; fit 5 when the dataset exists today.
- **Registration (11):** registration 5; difficulty from whether the feature exists; time from priority (P1=5).
- **Game hubs (18):** taken from the hub scores directly.
- **Evergreen (09):** the 45 highest by traffic and competition; SEO 5.
- **Community (13):** retention 5; difficulty and time from whether the feature exists.

**Caveat:** the totals reward cheap, fast, on-brand items. A single high-effort item (for example tightening `Game::indexable()`) can matter more than ten cheap ones. The planning phase should read the top of each type, not only the overall top.

## Top 60 overall

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TOOL-13 | tool | GTA 6 countdown with reminder | 4 | 3 | 3 | 5 | 4 | 4 | 4 | 3 | 4 | 2 | 5 | 5 | 46 |
| 2 | HUB-004 | game-hub | Steam / PC gaming (platform hub) | 5 | 5 | 2 | 5 | 5 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 46 |
| 3 | TOOL-17 | tool | WoW Analyzer, re-aimed per patch | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 4 | 4 | 2 | 5 | 5 | 45 |
| 4 | HUB-003 | game-hub | Nintendo Switch 2 (platform hub) | 5 | 5 | 2 | 4 | 5 | 4 | 3 | 5 | 2 | 3 | 2 | 5 | 45 |
| 5 | TOOL-03 | tool | "My library is worth $X" card | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 2 | 4 | 2 | 5 | 5 | 44 |
| 6 | HUB-002 | game-hub | GTA VI (existing hub) | 5 | 5 | 1 | 4 | 4 | 5 | 3 | 5 | 2 | 3 | 2 | 5 | 44 |
| 7 | HUB-001 | game-hub | World of Warcraft (Midnight, WoW: Forever, The Last Titan) | 4 | 5 | 2 | 5 | 4 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 44 |
| 8 | TOOL-15 | tool | GTA 6 vehicle database with real-world equivalents | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 2 | 5 | 5 | 43 |
| 9 | TOOL-37 | tool | Weekly poll with results page | 2 | 3 | 3 | 5 | 2 | 4 | 4 | 4 | 4 | 2 | 5 | 5 | 43 |
| 10 | TOOL-22 | tool | Backlog time calculator | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 2 | 4 | 2 | 5 | 5 | 42 |
| 11 | TOOL-27 | tool | Steam rank movers weekly | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 3 | 4 | 2 | 5 | 5 | 42 |
| 12 | TOOL-35 | tool | On-this-day pages and social card | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 3 | 4 | 2 | 5 | 5 | 42 |
| 13 | TOOL-01 | tool | Cross-platform year in review ("Your 2026 in games") | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 41 |
| 14 | TOOL-05 | tool | Taste Match invite link | 1 | 3 | 3 | 5 | 1 | 5 | 4 | 3 | 4 | 2 | 5 | 5 | 41 |
| 15 | TOOL-08 | tool | Calendar export (ICS) for wishlist releases | 3 | 3 | 3 | 5 | 3 | 2 | 4 | 4 | 2 | 2 | 5 | 5 | 41 |
| 16 | TOOL-36 | tool | Daily guessing game (cover, screenshot or release year) | 2 | 3 | 3 | 5 | 2 | 5 | 4 | 5 | 4 | 2 | 3 | 3 | 41 |
| 17 | TOOL-39 | tool | Monthly game club | 2 | 3 | 3 | 5 | 2 | 3 | 4 | 5 | 2 | 2 | 5 | 5 | 41 |
| 18 | TOOL-53 | tool | Gift ideas from a friend's wishlist | 3 | 3 | 3 | 5 | 3 | 3 | 4 | 1 | 2 | 4 | 5 | 5 | 41 |
| 19 | TOOL-02 | tool | Gamer DNA share card | 1 | 3 | 3 | 5 | 1 | 5 | 4 | 2 | 4 | 2 | 5 | 5 | 40 |
| 20 | TOOL-07 | tool | Release-day alerts outside the site | 2 | 3 | 3 | 5 | 2 | 2 | 4 | 5 | 2 | 2 | 5 | 5 | 40 |
| 21 | TOOL-16 | tool | GTA 6 edition comparison and price by region | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 1 | 2 | 4 | 5 | 5 | 40 |
| 22 | TOOL-26 | tool | Year's release congestion chart | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 1 | 4 | 2 | 5 | 5 | 40 |
| 23 | TOOL-29 | tool | Studios-closed-in-2026 tracker | 3 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 4 | 2 | 5 | 5 | 40 |
| 24 | TOOL-34 | tool | Hidden gems ranked pages | 4 | 3 | 3 | 5 | 4 | 3 | 2 | 2 | 2 | 2 | 5 | 5 | 40 |
| 25 | REG-01 | registration | /register left panel — Replace the four perks and "15K+ / 50K+" with the homepage's four mechanisms and live n | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 26 | REG-25 | registration | /verify-email — Explain what verification unlocks (comments, giveaways, digest) vs what already works | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 27 | REG-26 | registration | Login page — Replace "15K+ MEMBERS · 24/7 COMMUNITY" with nothing or true numbers | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 28 | FIX-05 | technical-fix | Move GTA 6 news from /games/gta-6 (2019 parody) to /games/grand-theft-auto-vi; link hub ↔ game page ↔ calendar | 4 | 5 | 3 | 5 | 5 | 1 | 2 | 2 | 1 | 2 | 5 | 5 | 40 |
| 29 | FIX-06 | technical-fix | Server-render GTA 6 hub counters and H1; add crawlable text and last-updated to data pages | 4 | 5 | 2 | 5 | 5 | 2 | 2 | 2 | 2 | 2 | 4 | 5 | 40 |
| 30 | CH-03 | channel | Release-day and price alerts delivered by email, Discord DM and opt-in push | 3 | 4 | 4 | 5 | 1 | 1 | 5 | 5 | 1 | 4 | 3 | 4 | 40 |
| 31 | TOOL-04 | tool | Public Steam library calculator (logged out) | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 2 | 3 | 3 | 39 |
| 32 | TOOL-14 | tool | GTA 6 map progress tracker (at launch) | 4 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 2 | 2 | 3 | 3 | 39 |
| 33 | TOOL-19 | tool | Backlog Advisor, public quiz version | 5 | 3 | 3 | 5 | 5 | 3 | 2 | 3 | 2 | 2 | 3 | 3 | 39 |
| 34 | TOOL-31 | tool | Switch 2 edition / upgrade tracker | 4 | 3 | 3 | 3 | 4 | 2 | 2 | 2 | 2 | 4 | 5 | 5 | 39 |
| 35 | TOOL-41 | tool | Embeddable "currently playing" badge | 1 | 3 | 3 | 5 | 1 | 4 | 4 | 2 | 4 | 2 | 5 | 5 | 39 |
| 36 | TOOL-47 | tool | Black Friday / Steam sale picks from my wishlist | 3 | 3 | 3 | 4 | 3 | 3 | 4 | 4 | 2 | 4 | 3 | 3 | 39 |
| 37 | TOOL-48 | tool | Demo tracker for Steam Next Fest | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 2 | 5 | 5 | 39 |
| 38 | PR-01 | digital-pr | Release Congestion Index — releases per ISO week, all platforms, 2010–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 5 | 5 | 39 |
| 39 | EA-001 | evergreen | shader compilation stutter fix — Shader compilation stutter: what it is and every fix that works | 4 | 3 | 4 | 4 | 5 | 1 | 4 | 2 | 3 | 2 | 4 | 3 | 39 |
| 40 | EA-109 | evergreen | is steam deck worth it 2026 — Worth it: Steam Deck OLED in 2026 (vs Xbox Ally X, Legion Go 2, Steam Machine, w | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 3 | 3 | 4 | 3 | 39 |
| 41 | FIX-12 | technical-fix | Make /giveaways indexable while a giveaway is live; add canonical to giveaway pages | 2 | 3 | 4 | 5 | 3 | 3 | 4 | 2 | 2 | 1 | 5 | 5 | 39 |
| 42 | FIX-13 | technical-fix | Update WoW Analyzer copy (Midnight launch date) and compress its 2.5 MB OG image | 3 | 3 | 4 | 5 | 4 | 3 | 2 | 2 | 2 | 1 | 5 | 5 | 39 |
| 43 | FIX-14 | technical-fix | Add contextual links from articles to game pages, tools and calendar | 3 | 3 | 5 | 5 | 4 | 1 | 4 | 3 | 1 | 2 | 4 | 4 | 39 |
| 44 | CH-02 | channel | Email: automate weekly digest and "your releases this week" | 3 | 4 | 5 | 5 | 1 | 1 | 4 | 5 | 1 | 3 | 3 | 4 | 39 |
| 45 | PR-05 | digital-pr | Most Crowded Release Day of 2026 (day-level heatmap) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 46 | PR-26 | digital-pr | Genre Tide Chart — share of releases per genre per year 2005–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 47 | PR-27 | digital-pr | Platform Life Cycles — releases per platform per year (PS4 tail vs PS5, Switch vs Switch 2) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 48 | PR-54 | digital-pr | Free Dataset Release — studios×country×founded CSV under CC-BY 4.0 | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 5 | 1 | 5 | 5 | 38 |
| 49 | REG-02 | registration | /register form order — Put Google/Discord/Steam buttons above the password form, form below "or with email" (I | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 50 | REG-03 | registration | Game page (333K pages) — "Add to your shelf" / "Wishlist — we'll tell you when it lands" → sign-up in a modal  | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 51 | REG-05 | registration | Game page (unreleased) — "Remind me" → account | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 52 | REG-08 | registration | Article page — giveaway swap — Keep; add "an account is all it takes — no card, one click with Google" to redu | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 53 | REG-13 | registration | /leaderboard (signed out) — Replace empty state with "Be the first this week — connect Steam and your completi | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 54 | REG-20 | registration | Discord server (bot) — Bot replies with a one-click link that registers via Discord OAuth and lands on the she | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 55 | REG-31 | registration | /roadmap — Fix stale "Planned" items that exist; CTA "Try lists now" instead of "Join TechPlay" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 56 | HUB-008 | game-hub | Pokémon (Winds & Waves, Champions) | 5 | 3 | 1 | 3 | 5 | 4 | 2 | 5 | 2 | 3 | 2 | 3 | 38 |
| 57 | HUB-010 | game-hub | Path of Exile 2 | 4 | 5 | 1 | 2 | 4 | 3 | 2 | 5 | 2 | 3 | 2 | 5 | 38 |
| 58 | HUB-013 | game-hub | Minecraft | 5 | 4 | 1 | 2 | 4 | 4 | 2 | 5 | 2 | 3 | 2 | 4 | 38 |
| 59 | HUB-005 | game-hub | Call of Duty: Modern Warfare 4 | 5 | 5 | 1 | 2 | 4 | 4 | 2 | 3 | 2 | 3 | 2 | 5 | 38 |
| 60 | EA-004 | evergreen | best Windows 11 settings for gaming — Windows 11 gaming settings checklist (Game Mode, VBS/Memory Integrity, H | 4 | 3 | 5 | 4 | 5 | 1 | 2 | 2 | 2 | 3 | 4 | 3 | 38 |

## Top five by type

### technical-fix (16 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 28 | FIX-05 | technical-fix | Move GTA 6 news from /games/gta-6 (2019 parody) to /games/grand-theft-auto-vi; link hub ↔ game page ↔ calendar | 4 | 5 | 3 | 5 | 5 | 1 | 2 | 2 | 1 | 2 | 5 | 5 | 40 |
| 29 | FIX-06 | technical-fix | Server-render GTA 6 hub counters and H1; add crawlable text and last-updated to data pages | 4 | 5 | 2 | 5 | 5 | 2 | 2 | 2 | 2 | 2 | 4 | 5 | 40 |
| 41 | FIX-12 | technical-fix | Make /giveaways indexable while a giveaway is live; add canonical to giveaway pages | 2 | 3 | 4 | 5 | 3 | 3 | 4 | 2 | 2 | 1 | 5 | 5 | 39 |
| 42 | FIX-13 | technical-fix | Update WoW Analyzer copy (Midnight launch date) and compress its 2.5 MB OG image | 3 | 3 | 4 | 5 | 4 | 3 | 2 | 2 | 2 | 1 | 5 | 5 | 39 |
| 43 | FIX-14 | technical-fix | Add contextual links from articles to game pages, tools and calendar | 3 | 3 | 5 | 5 | 4 | 1 | 4 | 3 | 1 | 2 | 4 | 4 | 39 |

### tool (55 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TOOL-13 | tool | GTA 6 countdown with reminder | 4 | 3 | 3 | 5 | 4 | 4 | 4 | 3 | 4 | 2 | 5 | 5 | 46 |
| 3 | TOOL-17 | tool | WoW Analyzer, re-aimed per patch | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 4 | 4 | 2 | 5 | 5 | 45 |
| 5 | TOOL-03 | tool | "My library is worth $X" card | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 2 | 4 | 2 | 5 | 5 | 44 |
| 8 | TOOL-15 | tool | GTA 6 vehicle database with real-world equivalents | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 2 | 5 | 5 | 43 |
| 9 | TOOL-37 | tool | Weekly poll with results page | 2 | 3 | 3 | 5 | 2 | 4 | 4 | 4 | 4 | 2 | 5 | 5 | 43 |

### game-hub (37 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 | HUB-004 | game-hub | Steam / PC gaming (platform hub) | 5 | 5 | 2 | 5 | 5 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 46 |
| 4 | HUB-003 | game-hub | Nintendo Switch 2 (platform hub) | 5 | 5 | 2 | 4 | 5 | 4 | 3 | 5 | 2 | 3 | 2 | 5 | 45 |
| 6 | HUB-002 | game-hub | GTA VI (existing hub) | 5 | 5 | 1 | 4 | 4 | 5 | 3 | 5 | 2 | 3 | 2 | 5 | 44 |
| 7 | HUB-001 | game-hub | World of Warcraft (Midnight, WoW: Forever, The Last Titan) | 4 | 5 | 2 | 5 | 4 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 44 |
| 56 | HUB-008 | game-hub | Pokémon (Winds & Waves, Champions) | 5 | 3 | 1 | 3 | 5 | 4 | 2 | 5 | 2 | 3 | 2 | 3 | 38 |

### evergreen (45 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 39 | EA-001 | evergreen | shader compilation stutter fix — Shader compilation stutter: what it is and every fix that works | 4 | 3 | 4 | 4 | 5 | 1 | 4 | 2 | 3 | 2 | 4 | 3 | 39 |
| 40 | EA-109 | evergreen | is steam deck worth it 2026 — Worth it: Steam Deck OLED in 2026 (vs Xbox Ally X, Legion Go 2, Steam Machine, w | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 3 | 3 | 4 | 3 | 39 |
| 60 | EA-004 | evergreen | best Windows 11 settings for gaming — Windows 11 gaming settings checklist (Game Mode, VBS/Memory Integrity, H | 4 | 3 | 5 | 4 | 5 | 1 | 2 | 2 | 2 | 3 | 4 | 3 | 38 |
| 61 | EA-085 | evergreen | is [game] on pc — Availability: Programmatic: 'Is [game] on PC / PS5 / Xbox / Switch 2?' for all 3 | 4 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 38 |
| 62 | EA-101 | evergreen | [game] file size — Programmatic game file sizes ('how big is [game] on PS5/Xbox/PC/Switch 2') | 4 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 38 |

### registration (35 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 25 | REG-01 | registration | /register left panel — Replace the four perks and "15K+ / 50K+" with the homepage's four mechanisms and live n | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 26 | REG-25 | registration | /verify-email — Explain what verification unlocks (comments, giveaways, digest) vs what already works | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 27 | REG-26 | registration | Login page — Replace "15K+ MEMBERS · 24/7 COMMUNITY" with nothing or true numbers | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 49 | REG-02 | registration | /register form order — Put Google/Discord/Steam buttons above the password form, form below "or with email" (I | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 50 | REG-03 | registration | Game page (333K pages) — "Add to your shelf" / "Wishlist — we'll tell you when it lands" → sign-up in a modal  | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |

### community (27 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 68 | COM-01 | community | What are you playing this week? | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 69 | COM-02 | community | Monthly game club | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 70 | COM-03 | community | Weekly poll | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 71 | COM-05 | community | Showcase watch party with live thread | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 72 | COM-10 | community | Backlog Sunday (pick one game to finish) | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |

### channel (10 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 30 | CH-03 | channel | Release-day and price alerts delivered by email, Discord DM and opt-in push | 3 | 4 | 4 | 5 | 1 | 1 | 5 | 5 | 1 | 4 | 3 | 4 | 40 |
| 44 | CH-02 | channel | Email: automate weekly digest and "your releases this week" | 3 | 4 | 5 | 5 | 1 | 1 | 4 | 5 | 1 | 3 | 3 | 4 | 39 |
| 114 | CH-01 | channel | Google Discover: topic-depth plan in 2–3 areas (WoW, PC fixes, platform questions) | 5 | 4 | 2 | 4 | 3 | 3 | 2 | 2 | 2 | 4 | 3 | 3 | 37 |
| 160 | CH-04 | channel | Discord: Onboarding, Server Guide, one weekly event; path to 500 and 1,000 members | 1 | 4 | 4 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 4 | 4 | 36 |
| 161 | CH-09 | channel | Add a homepage and end-of-article newsletter capture | 1 | 3 | 5 | 5 | 1 | 1 | 3 | 4 | 1 | 2 | 5 | 5 | 36 |

### digital-pr (60 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 38 | PR-01 | digital-pr | Release Congestion Index — releases per ISO week, all platforms, 2010–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 5 | 5 | 39 |
| 45 | PR-05 | digital-pr | Most Crowded Release Day of 2026 (day-level heatmap) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 46 | PR-26 | digital-pr | Genre Tide Chart — share of releases per genre per year 2005–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 47 | PR-27 | digital-pr | Platform Life Cycles — releases per platform per year (PS4 tail vs PS5, Switch vs Switch 2) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 48 | PR-54 | digital-pr | Free Dataset Release — studios×country×founded CSV under CC-BY 4.0 | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 5 | 1 | 5 | 5 | 38 |

### partnership (5 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 198 | PART-04 | partnership | Regional partners: Balkan studios, A1 Adria League | 2 | 3 | 5 | 4 | 2 | 3 | 2 | 2 | 4 | 2 | 3 | 3 | 35 |
| 199 | PART-05 | partnership | Creator data partnerships (charts for creators, with credit) | 2 | 3 | 4 | 5 | 2 | 4 | 2 | 1 | 4 | 1 | 4 | 3 | 35 |
| 231 | PART-03 | partnership | Ownership, funding and AI-use page; press page with honest numbers | 1 | 2 | 5 | 5 | 2 | 1 | 2 | 1 | 3 | 2 | 5 | 5 | 34 |
| 276 | PART-01 | partnership | Review-code access: Steam Curator Connect, Keymailer, PressEngine accounts | 3 | 3 | 3 | 4 | 3 | 2 | 1 | 1 | 2 | 2 | 4 | 3 | 31 |
| 283 | PART-02 | partnership | Restart reviews and apply to OpenCritic once cadence is steady | 3 | 3 | 2 | 4 | 3 | 2 | 1 | 1 | 4 | 2 | 3 | 2 | 30 |

### paid-media (1 scored)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 291 | PAID-01 | paid-media | Branded search protection and a US Meta registration test after measurement is in place | 2 | 3 | 3 | 3 | 1 | 1 | 4 | 1 | 1 | 1 | 3 | 3 | 26 |

## Reading across the matrix (OBSERVATION)

- **Cheap fixes cluster near the top of their type** because they are fast and on-brand: dead Discord invites, broken breadcrumbs, RSS links, false social proof, the GTA 6 page split. They unlock other items and carry little risk.
- **Tools built on existing data dominate the overall top 60:** GTA 6 countdown with reminder, library-worth card, WoW Analyzer refresh, Taste Match invites, year in review, calendar export, polls.
- **Platform hubs (Steam/PC, Switch 2) score with GTA VI and WoW**, because they reuse the database for every game.
- **Evergreen pages score lower on this model** because they are slow and hard to rank; their value is compounding, which one-off scores understate.
- **Digital PR scores well on links and social but low on registration and retention**; it serves authority, not accounts.
- **Paid media barely appears** because nothing can be measured yet (16).

## Full matrix (all 291)

| Rank | ID | Type | Opportunity | Traffic | Growth | Comp. | Fit | SEO | Social | Reg. | Ret. | Links | Rev. | Ease | Speed | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TOOL-13 | tool | GTA 6 countdown with reminder | 4 | 3 | 3 | 5 | 4 | 4 | 4 | 3 | 4 | 2 | 5 | 5 | 46 |
| 2 | HUB-004 | game-hub | Steam / PC gaming (platform hub) | 5 | 5 | 2 | 5 | 5 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 46 |
| 3 | TOOL-17 | tool | WoW Analyzer, re-aimed per patch | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 4 | 4 | 2 | 5 | 5 | 45 |
| 4 | HUB-003 | game-hub | Nintendo Switch 2 (platform hub) | 5 | 5 | 2 | 4 | 5 | 4 | 3 | 5 | 2 | 3 | 2 | 5 | 45 |
| 5 | TOOL-03 | tool | "My library is worth $X" card | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 2 | 4 | 2 | 5 | 5 | 44 |
| 6 | HUB-002 | game-hub | GTA VI (existing hub) | 5 | 5 | 1 | 4 | 4 | 5 | 3 | 5 | 2 | 3 | 2 | 5 | 44 |
| 7 | HUB-001 | game-hub | World of Warcraft (Midnight, WoW: Forever, The Last Titan) | 4 | 5 | 2 | 5 | 4 | 3 | 4 | 5 | 2 | 3 | 2 | 5 | 44 |
| 8 | TOOL-15 | tool | GTA 6 vehicle database with real-world equivalents | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 2 | 5 | 5 | 43 |
| 9 | TOOL-37 | tool | Weekly poll with results page | 2 | 3 | 3 | 5 | 2 | 4 | 4 | 4 | 4 | 2 | 5 | 5 | 43 |
| 10 | TOOL-22 | tool | Backlog time calculator | 3 | 3 | 3 | 4 | 3 | 4 | 4 | 2 | 4 | 2 | 5 | 5 | 42 |
| 11 | TOOL-27 | tool | Steam rank movers weekly | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 3 | 4 | 2 | 5 | 5 | 42 |
| 12 | TOOL-35 | tool | On-this-day pages and social card | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 3 | 4 | 2 | 5 | 5 | 42 |
| 13 | TOOL-01 | tool | Cross-platform year in review ("Your 2026 in games") | 3 | 3 | 3 | 5 | 3 | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 41 |
| 14 | TOOL-05 | tool | Taste Match invite link | 1 | 3 | 3 | 5 | 1 | 5 | 4 | 3 | 4 | 2 | 5 | 5 | 41 |
| 15 | TOOL-08 | tool | Calendar export (ICS) for wishlist releases | 3 | 3 | 3 | 5 | 3 | 2 | 4 | 4 | 2 | 2 | 5 | 5 | 41 |
| 16 | TOOL-36 | tool | Daily guessing game (cover, screenshot or release year) | 2 | 3 | 3 | 5 | 2 | 5 | 4 | 5 | 4 | 2 | 3 | 3 | 41 |
| 17 | TOOL-39 | tool | Monthly game club | 2 | 3 | 3 | 5 | 2 | 3 | 4 | 5 | 2 | 2 | 5 | 5 | 41 |
| 18 | TOOL-53 | tool | Gift ideas from a friend's wishlist | 3 | 3 | 3 | 5 | 3 | 3 | 4 | 1 | 2 | 4 | 5 | 5 | 41 |
| 19 | TOOL-02 | tool | Gamer DNA share card | 1 | 3 | 3 | 5 | 1 | 5 | 4 | 2 | 4 | 2 | 5 | 5 | 40 |
| 20 | TOOL-07 | tool | Release-day alerts outside the site | 2 | 3 | 3 | 5 | 2 | 2 | 4 | 5 | 2 | 2 | 5 | 5 | 40 |
| 21 | TOOL-16 | tool | GTA 6 edition comparison and price by region | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 1 | 2 | 4 | 5 | 5 | 40 |
| 22 | TOOL-26 | tool | Year's release congestion chart | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 1 | 4 | 2 | 5 | 5 | 40 |
| 23 | TOOL-29 | tool | Studios-closed-in-2026 tracker | 3 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 4 | 2 | 5 | 5 | 40 |
| 24 | TOOL-34 | tool | Hidden gems ranked pages | 4 | 3 | 3 | 5 | 4 | 3 | 2 | 2 | 2 | 2 | 5 | 5 | 40 |
| 25 | REG-01 | registration | /register left panel — Replace the four perks and "15K+ / 50K+" with the homepage's four mechanisms and live n | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 26 | REG-25 | registration | /verify-email — Explain what verification unlocks (comments, giveaways, digest) vs what already works | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 27 | REG-26 | registration | Login page — Replace "15K+ MEMBERS · 24/7 COMMUNITY" with nothing or true numbers | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 5 | 40 |
| 28 | FIX-05 | technical-fix | Move GTA 6 news from /games/gta-6 (2019 parody) to /games/grand-theft-auto-vi; link hub ↔ game page ↔ calendar | 4 | 5 | 3 | 5 | 5 | 1 | 2 | 2 | 1 | 2 | 5 | 5 | 40 |
| 29 | FIX-06 | technical-fix | Server-render GTA 6 hub counters and H1; add crawlable text and last-updated to data pages | 4 | 5 | 2 | 5 | 5 | 2 | 2 | 2 | 2 | 2 | 4 | 5 | 40 |
| 30 | CH-03 | channel | Release-day and price alerts delivered by email, Discord DM and opt-in push | 3 | 4 | 4 | 5 | 1 | 1 | 5 | 5 | 1 | 4 | 3 | 4 | 40 |
| 31 | TOOL-04 | tool | Public Steam library calculator (logged out) | 4 | 3 | 3 | 5 | 4 | 4 | 2 | 2 | 4 | 2 | 3 | 3 | 39 |
| 32 | TOOL-14 | tool | GTA 6 map progress tracker (at launch) | 4 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 2 | 2 | 3 | 3 | 39 |
| 33 | TOOL-19 | tool | Backlog Advisor, public quiz version | 5 | 3 | 3 | 5 | 5 | 3 | 2 | 3 | 2 | 2 | 3 | 3 | 39 |
| 34 | TOOL-31 | tool | Switch 2 edition / upgrade tracker | 4 | 3 | 3 | 3 | 4 | 2 | 2 | 2 | 2 | 4 | 5 | 5 | 39 |
| 35 | TOOL-41 | tool | Embeddable "currently playing" badge | 1 | 3 | 3 | 5 | 1 | 4 | 4 | 2 | 4 | 2 | 5 | 5 | 39 |
| 36 | TOOL-47 | tool | Black Friday / Steam sale picks from my wishlist | 3 | 3 | 3 | 4 | 3 | 3 | 4 | 4 | 2 | 4 | 3 | 3 | 39 |
| 37 | TOOL-48 | tool | Demo tracker for Steam Next Fest | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 2 | 5 | 5 | 39 |
| 38 | PR-01 | digital-pr | Release Congestion Index — releases per ISO week, all platforms, 2010–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 5 | 5 | 39 |
| 39 | EA-001 | evergreen | shader compilation stutter fix — Shader compilation stutter: what it is and every fix that works | 4 | 3 | 4 | 4 | 5 | 1 | 4 | 2 | 3 | 2 | 4 | 3 | 39 |
| 40 | EA-109 | evergreen | is steam deck worth it 2026 — Worth it: Steam Deck OLED in 2026 (vs Xbox Ally X, Legion Go 2, Steam Machine, w | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 3 | 3 | 4 | 3 | 39 |
| 41 | FIX-12 | technical-fix | Make /giveaways indexable while a giveaway is live; add canonical to giveaway pages | 2 | 3 | 4 | 5 | 3 | 3 | 4 | 2 | 2 | 1 | 5 | 5 | 39 |
| 42 | FIX-13 | technical-fix | Update WoW Analyzer copy (Midnight launch date) and compress its 2.5 MB OG image | 3 | 3 | 4 | 5 | 4 | 3 | 2 | 2 | 2 | 1 | 5 | 5 | 39 |
| 43 | FIX-14 | technical-fix | Add contextual links from articles to game pages, tools and calendar | 3 | 3 | 5 | 5 | 4 | 1 | 4 | 3 | 1 | 2 | 4 | 4 | 39 |
| 44 | CH-02 | channel | Email: automate weekly digest and "your releases this week" | 3 | 4 | 5 | 5 | 1 | 1 | 4 | 5 | 1 | 3 | 3 | 4 | 39 |
| 45 | PR-05 | digital-pr | Most Crowded Release Day of 2026 (day-level heatmap) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 46 | PR-26 | digital-pr | Genre Tide Chart — share of releases per genre per year 2005–2026 | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 47 | PR-27 | digital-pr | Platform Life Cycles — releases per platform per year (PS4 tail vs PS5, Switch vs Switch 2) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 5 | 5 | 38 |
| 48 | PR-54 | digital-pr | Free Dataset Release — studios×country×founded CSV under CC-BY 4.0 | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 5 | 1 | 5 | 5 | 38 |
| 49 | REG-02 | registration | /register form order — Put Google/Discord/Steam buttons above the password form, form below "or with email" (I | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 50 | REG-03 | registration | Game page (333K pages) — "Add to your shelf" / "Wishlist — we'll tell you when it lands" → sign-up in a modal  | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 51 | REG-05 | registration | Game page (unreleased) — "Remind me" → account | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 52 | REG-08 | registration | Article page — giveaway swap — Keep; add "an account is all it takes — no card, one click with Google" to redu | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 53 | REG-13 | registration | /leaderboard (signed out) — Replace empty state with "Be the first this week — connect Steam and your completi | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 54 | REG-20 | registration | Discord server (bot) — Bot replies with a one-click link that registers via Discord OAuth and lands on the she | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 5 | 38 |
| 55 | REG-31 | registration | /roadmap — Fix stale "Planned" items that exist; CTA "Try lists now" instead of "Join TechPlay" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 5 | 3 | 38 |
| 56 | HUB-008 | game-hub | Pokémon (Winds & Waves, Champions) | 5 | 3 | 1 | 3 | 5 | 4 | 2 | 5 | 2 | 3 | 2 | 3 | 38 |
| 57 | HUB-010 | game-hub | Path of Exile 2 | 4 | 5 | 1 | 2 | 4 | 3 | 2 | 5 | 2 | 3 | 2 | 5 | 38 |
| 58 | HUB-013 | game-hub | Minecraft | 5 | 4 | 1 | 2 | 4 | 4 | 2 | 5 | 2 | 3 | 2 | 4 | 38 |
| 59 | HUB-005 | game-hub | Call of Duty: Modern Warfare 4 | 5 | 5 | 1 | 2 | 4 | 4 | 2 | 3 | 2 | 3 | 2 | 5 | 38 |
| 60 | EA-004 | evergreen | best Windows 11 settings for gaming — Windows 11 gaming settings checklist (Game Mode, VBS/Memory Integrity, H | 4 | 3 | 5 | 4 | 5 | 1 | 2 | 2 | 2 | 3 | 4 | 3 | 38 |
| 61 | EA-085 | evergreen | is [game] on pc — Availability: Programmatic: 'Is [game] on PC / PS5 / Xbox / Switch 2?' for all 3 | 4 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 38 |
| 62 | EA-101 | evergreen | [game] file size — Programmatic game file sizes ('how big is [game] on PS5/Xbox/PC/Switch 2') | 4 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 38 |
| 63 | EA-013 | evergreen | ps5 pro best settings — PS5 / PS5 Pro best display settings (120Hz, VRR, HDR, PSSR modes) | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 3 | 4 | 3 | 38 |
| 64 | EA-063 | evergreen | handheld tdp explained — Handheld TDP explained: watts vs FPS vs battery (Deck vs Ally vs Legion Go vs Sw | 3 | 3 | 5 | 4 | 5 | 1 | 2 | 2 | 3 | 3 | 4 | 3 | 38 |
| 65 | EA-106 | evergreen | what game should I play next — Backlog Advisor: 'what should I play next' given hours available | 3 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 3 | 2 | 3 | 3 | 38 |
| 66 | EB-060 | evergreen | best mmo 2026 — Best MMO to play in 2026 | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 3 | 4 | 3 | 38 |
| 67 | EB-062 | evergreen | guild wars 2 vs wow — Guild Wars 2 vs WoW | 3 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 38 |
| 68 | COM-01 | community | What are you playing this week? | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 69 | COM-02 | community | Monthly game club | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 70 | COM-03 | community | Weekly poll | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 71 | COM-05 | community | Showcase watch party with live thread | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 72 | COM-10 | community | Backlog Sunday (pick one game to finish) | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 73 | COM-13 | community | Season launch and finale | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 74 | COM-17 | community | AMA with a developer | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 75 | COM-19 | community | Next Fest demo diary | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 76 | COM-20 | community | Nostalgia "on this day" | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 77 | COM-21 | community | Tier list of the month | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 78 | COM-23 | community | GTA 6 countdown ritual | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 79 | COM-24 | community | Introductions channel | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 80 | COM-25 | community | Suggestions channel with visible outcomes | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 38 |
| 81 | TOOL-06 | tool | Wishlist price-drop alerts (email/Discord/push) | 2 | 3 | 3 | 4 | 2 | 2 | 4 | 5 | 2 | 4 | 3 | 3 | 37 |
| 82 | TOOL-11 | tool | "Can I run it" against a saved PC spec | 5 | 3 | 3 | 4 | 5 | 2 | 4 | 3 | 2 | 2 | 2 | 2 | 37 |
| 83 | TOOL-12 | tool | Release time by time zone | 4 | 3 | 3 | 3 | 4 | 3 | 2 | 1 | 2 | 2 | 5 | 5 | 37 |
| 84 | TOOL-20 | tool | "Games like X" pages | 5 | 3 | 3 | 5 | 5 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 37 |
| 85 | TOOL-21 | tool | Series order pages ("X games in order") | 5 | 3 | 3 | 5 | 5 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 37 |
| 86 | TOOL-38 | tool | Prediction league (The Game Awards, showcases) | 2 | 3 | 3 | 3 | 2 | 4 | 4 | 4 | 4 | 2 | 3 | 3 | 37 |
| 87 | TOOL-44 | tool | Monthly data report ("state of the backlog") | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 2 | 4 | 2 | 3 | 3 | 37 |
| 88 | TOOL-45 | tool | Review-score vs sales tracker | 3 | 3 | 3 | 4 | 3 | 4 | 2 | 1 | 4 | 4 | 3 | 3 | 37 |
| 89 | TOOL-46 | tool | Price history per game | 4 | 3 | 3 | 4 | 4 | 2 | 2 | 3 | 2 | 4 | 3 | 3 | 37 |
| 90 | TOOL-51 | tool | "Friends playing now" feed | 1 | 3 | 3 | 5 | 1 | 2 | 4 | 4 | 2 | 2 | 5 | 5 | 37 |
| 91 | TOOL-52 | tool | Completion goals and reading list | 1 | 3 | 3 | 5 | 1 | 2 | 4 | 4 | 2 | 2 | 5 | 5 | 37 |
| 92 | PR-06 | digital-pr | Weekday of release by platform and decade (Tuesday US retail → Thursday/Friday digital) | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 4 | 1 | 5 | 5 | 37 |
| 93 | PR-08 | digital-pr | Balkan Game Dev Census (BA, HR, RS, SI, MK, ME, XK, AL, BG, RO, GR) | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 4 | 1 | 5 | 5 | 37 |
| 94 | PR-09 | digital-pr | Studio Founding Waves — founding year distribution 1970–2025 | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 4 | 1 | 5 | 5 | 37 |
| 95 | PR-28 | digital-pr | Title Word Trends — "Simulator", "Souls", "Legends", colons and subtitles by year | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 2 | 1 | 5 | 5 | 37 |
| 96 | PR-33 | digital-pr | GTA 6 Interest Map — hub pageviews by country and day (aggregate, no identifiers) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 2 | 1 | 5 | 5 | 37 |
| 97 | PR-44 | digital-pr | Studio Births by Country per Year (2015–2025) | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 4 | 1 | 5 | 5 | 37 |
| 98 | HUB-007 | game-hub | Final Fantasy VII Revelation | 5 | 4 | 2 | 2 | 4 | 3 | 2 | 4 | 2 | 3 | 2 | 4 | 37 |
| 99 | HUB-037 | game-hub | Steam hardware (Steam Frame, Steam Machine, Deck) | 4 | 4 | 3 | 3 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 4 | 37 |
| 100 | EB-022 | evergreen | [series] games in order — PROGRAMMATIC FAMILY: '<series> games in order' template | 5 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 37 |
| 101 | EB-128 | evergreen | what game should i play next — What game should I play next? (quiz / picker) | 4 | 3 | 4 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 37 |
| 102 | EA-006 | evergreen | how to enable secure boot for battlefield 6 — Secure Boot and TPM 2.0 for anti-cheat games (BF6, CoD, Valorant | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 37 |
| 103 | EA-016 | evergreen | switch 2 vrr docked — Switch 2 setup: 120Hz, VRR (handheld only vs docked), HDR, microSD Express | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 37 |
| 104 | EA-048 | evergreen | cs2 best settings — Best settings: Counter-Strike 2 | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 3 | 4 | 3 | 37 |
| 105 | EA-050 | evergreen | modern warfare 4 best settings — Best settings: Call of Duty: Modern Warfare 4 (Oct 23 2026) | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 3 | 4 | 3 | 37 |
| 106 | EA-059 | evergreen | best steam deck verified games — Best Steam Deck Verified games (living list, by genre, by price) | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 3 | 3 | 3 | 37 |
| 107 | EB-009 | evergreen | persona games in order — Persona games order | 3 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 37 |
| 108 | EB-059 | evergreen | is wow worth playing in 2026 — Is WoW worth playing in 2026? | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 3 | 2 | 3 | 3 | 37 |
| 109 | EB-134 | evergreen | how to clear gaming backlog — How to clear your gaming backlog | 3 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 37 |
| 110 | EB-135 | evergreen | what kind of gamer are you quiz — Gaming personality quiz / what kind of gamer are you | 3 | 3 | 5 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 37 |
| 111 | EB-141 | evergreen | marvel rivals season end date — Marvel Rivals Season 10 end date | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 37 |
| 112 | EA-002 | evergreen | DXGI_ERROR_DEVICE_REMOVED fix — DXGI_ERROR_DEVICE_REMOVED and DEVICE_HUNG crashes explained | 3 | 3 | 4 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 37 |
| 113 | FIX-03 | technical-fix | Fix RSS hardware links (/tech → /hardware) and regenerate feed on publish | 2 | 3 | 5 | 5 | 3 | 3 | 1 | 3 | 1 | 1 | 5 | 5 | 37 |
| 114 | CH-01 | channel | Google Discover: topic-depth plan in 2–3 areas (WoW, PC fixes, platform questions) | 5 | 4 | 2 | 4 | 3 | 3 | 2 | 2 | 2 | 4 | 3 | 3 | 37 |
| 115 | TOOL-10 | tool | Game Pass / PS Plus catalogue tracker | 4 | 3 | 3 | 3 | 4 | 3 | 2 | 4 | 2 | 2 | 3 | 3 | 36 |
| 116 | TOOL-18 | tool | WoW weekly checklist | 3 | 3 | 3 | 3 | 3 | 2 | 4 | 5 | 2 | 2 | 3 | 3 | 36 |
| 117 | TOOL-28 | tool | Studio pages with "games at risk" after closures | 3 | 3 | 3 | 5 | 3 | 4 | 2 | 1 | 4 | 2 | 3 | 3 | 36 |
| 118 | PR-04 | digital-pr | TBA Index — share of upcoming games with only year/quarter precision | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 119 | PR-07 | digital-pr | World Atlas of Game Studios — studios per country and per million people | 3 | 3 | 4 | 5 | 3 | 5 | 1 | 1 | 4 | 1 | 3 | 3 | 36 |
| 120 | PR-14 | digital-pr | Platform Exclusivity Map — share of releases per platform that are single-store | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 121 | PR-25 | digital-pr | Longest-Running Franchises — `first_year`/`last_year` span | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 122 | PR-38 | digital-pr | Oct 2026 Next Fest Pre-Coverage — demos already in the catalogue, by genre and country | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 123 | PR-40 | digital-pr | Critic Score by Release Month — do Q4 games score higher? | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 124 | PR-48 | digital-pr | Genre × Platform Exclusives — which genres stay PC-only | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 5 | 5 | 36 |
| 125 | REG-04 | registration | Game page — "See your own hours and rarity here — connect Steam" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 126 | REG-06 | registration | /calendar — Same as 5, batch: "Track everything you're waiting for" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 127 | REG-07 | registration | Article page — JoinPrompt — Keep the shelf offer; add the reader's own game if the article has game_id: "Add { | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 128 | REG-09 | registration | Review page (score block) — "Rate it yourself — your rating counts toward the community score" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 129 | REG-11 | registration | Homepage hero — Keep "Start your library"; add a live "N games imported this week" counter (HLTB model: activi | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 130 | REG-12 | registration | Homepage closing band — Add a real, consented member's Gamer DNA card as the image | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 131 | REG-14 | registration | /profile/[username] (someone else's) — "Compare your taste — see your match %" → sign-up → TasteMatch | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 132 | REG-17 | registration | Search dropdown (hero/header) — Result row action "＋ shelf" for guests → sign-up returning to the game | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 133 | REG-22 | registration | Newsletter (campaigns) — Campaign footer "You are a subscriber, not a member — claim your shelf" with a signed | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 134 | REG-23 | registration | Newsletter verify success page — "While you're here: make it an account" (email pre-filled, Google button) | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 135 | REG-28 | registration | /gta6 hub — Newsletter "Join the Crew" → also offer account with GTA 6 wishlisted + release reminder | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 136 | REG-29 | registration | /backlog-advisor — "Import your backlog instead of typing it" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 137 | REG-33 | registration | Giveaway page — Offer "sign in with Google/Discord" as the entry step itself; show daily check-in streak as th | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 3 | 36 |
| 138 | HUB-006 | game-hub | Fable | 4 | 4 | 3 | 2 | 4 | 3 | 2 | 3 | 2 | 3 | 2 | 4 | 36 |
| 139 | EB-103 | evergreen | is [game] crossplay — PROGRAMMATIC FAMILY: 'is <game> crossplay' / '<game> co-op how many players' | 5 | 3 | 2 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 140 | EB-133 | evergreen | games like [game] — PROGRAMMATIC FAMILY: 'games like <game>' for every title with similar_games | 5 | 3 | 2 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 141 | EA-026 | evergreen | what is frame generation — Glossary: What is frame generation (and multi-frame generation) | 4 | 3 | 3 | 4 | 5 | 1 | 2 | 2 | 3 | 2 | 4 | 3 | 36 |
| 142 | EA-027 | evergreen | dlss vs fsr vs xess — Glossary: Upscaling explained: DLSS vs FSR vs XeSS vs PSSR (and which to pick pe | 4 | 3 | 3 | 4 | 5 | 1 | 2 | 2 | 3 | 2 | 4 | 3 | 36 |
| 143 | EA-073 | evergreen | games with cross save — Cross-save matrix: which games carry saves across PC/PS5/Xbox/Switch 2 | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 144 | EA-094 | evergreen | is [game] on game pass — Programmatic 'Is [game] on Game Pass?' / 'Is [game] on PS Plus?' | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 145 | EA-116 | evergreen | steam deck vs rog xbox ally x — Compare: Steam Deck OLED vs ROG Xbox Ally X vs Legion Go 2 vs Switch 2 | 4 | 3 | 3 | 4 | 5 | 1 | 2 | 2 | 2 | 3 | 4 | 3 | 36 |
| 146 | EB-004 | evergreen | yakuza games in order — Yakuza / Like a Dragon games in order | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 147 | EB-084 | evergreen | easiest platinum trophies ps5 — Easiest platinum trophies PS5 (2026) | 4 | 3 | 3 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 36 |
| 148 | EB-106 | evergreen | gta 6 release date — GTA 6 release date | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 4 | 3 | 36 |
| 149 | EA-008 | evergreen | low gpu usage high cpu usage games fix — Low GPU usage / CPU bottleneck diagnosis in games | 3 | 3 | 4 | 4 | 5 | 1 | 2 | 2 | 3 | 2 | 4 | 3 | 36 |
| 150 | EA-012 | evergreen | how to fix micro stutter in games — Frame pacing and micro-stutter: V-Sync, frame caps, Reflex, Anti-Lag expla | 3 | 3 | 4 | 4 | 5 | 1 | 2 | 2 | 3 | 2 | 4 | 3 | 36 |
| 151 | EA-030 | evergreen | what is input lag — Glossary: Input lag / latency: what it is, how it is measured, how to reduce it | 3 | 3 | 4 | 4 | 5 | 1 | 2 | 2 | 3 | 2 | 4 | 3 | 36 |
| 152 | COM-08 | community | Screenshot of the week | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 36 |
| 153 | COM-12 | community | Leaderboard "rising" post | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 36 |
| 154 | COM-15 | community | Squad-up night (free-to-play game) | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 36 |
| 155 | COM-16 | community | Jackbox or Activity night | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 36 |
| 156 | COM-27 | community | Game-night recap post | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 5 | 5 | 36 |
| 157 | FIX-01 | technical-fix | Fix dead Discord invites (discord.gg/techplaygg on GTA 6 hub and roadmap) | 1 | 3 | 5 | 5 | 1 | 2 | 3 | 4 | 1 | 1 | 5 | 5 | 36 |
| 158 | FIX-07 | technical-fix | Replace false social proof (15K+ members, 50K+ games, thousands of fans, 4.9/5) with live or no numbers | 1 | 3 | 5 | 5 | 1 | 2 | 4 | 2 | 2 | 1 | 5 | 5 | 36 |
| 159 | FIX-09 | technical-fix | Tighten Game::indexable() to pages with original signal; noindex the long tail | 5 | 4 | 4 | 5 | 5 | 1 | 2 | 1 | 1 | 3 | 3 | 2 | 36 |
| 160 | CH-04 | channel | Discord: Onboarding, Server Guide, one weekly event; path to 500 and 1,000 members | 1 | 4 | 4 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 4 | 4 | 36 |
| 161 | CH-09 | channel | Add a homepage and end-of-article newsletter capture | 1 | 3 | 5 | 5 | 1 | 1 | 3 | 4 | 1 | 2 | 5 | 5 | 36 |
| 162 | TOOL-09 | tool | "Where to play" block on every game page | 5 | 3 | 3 | 4 | 5 | 1 | 2 | 2 | 2 | 2 | 3 | 3 | 35 |
| 163 | TOOL-23 | tool | Achievement rarity pages | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 2 | 2 | 2 | 3 | 3 | 35 |
| 164 | TOOL-24 | tool | Easiest platinum / 100% list | 4 | 3 | 3 | 4 | 4 | 3 | 2 | 2 | 2 | 2 | 3 | 3 | 35 |
| 165 | TOOL-33 | tool | File size and pre-load table | 4 | 3 | 3 | 3 | 4 | 1 | 2 | 1 | 2 | 2 | 5 | 5 | 35 |
| 166 | TOOL-40 | tool | Discord `/game` and `/remind` commands | 1 | 3 | 3 | 4 | 1 | 3 | 2 | 4 | 2 | 2 | 5 | 5 | 35 |
| 167 | TOOL-42 | tool | Embeddable release countdown widget | 2 | 3 | 3 | 5 | 2 | 3 | 2 | 1 | 2 | 2 | 5 | 5 | 35 |
| 168 | TOOL-43 | tool | Steam Curator page fed from reviews and gems | 2 | 3 | 3 | 5 | 2 | 2 | 2 | 2 | 2 | 2 | 5 | 5 | 35 |
| 169 | PR-10 | digital-pr | Publisher Families — the largest ownership trees via `parent_id` | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 35 |
| 170 | PR-11 | digital-pr | Country vs Critic Score — mean OpenCritic score by developer country (min 30 scored games) | 3 | 3 | 4 | 5 | 3 | 5 | 1 | 1 | 3 | 1 | 3 | 3 | 35 |
| 171 | PR-12 | digital-pr | The Vanished Catalogue — 61,034 tombstones: what disappears from stores, by year and platform | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 35 |
| 172 | PR-24 | digital-pr | Sequel Gap Inflation — years between series entries by decade | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 35 |
| 173 | PR-30 | digital-pr | Remake/Remaster Share — % of releases that are re-releases, by year | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 35 |
| 174 | PR-52 | digital-pr | Studio Survival Curve — share of studios founded in year X with a release in the last 3 years | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 35 |
| 175 | PR-56 | digital-pr | Embeddable Studio Country badge ("Made in Bosnia — 1 of N studios") | 2 | 3 | 4 | 5 | 3 | 2 | 1 | 1 | 3 | 1 | 5 | 5 | 35 |
| 176 | PR-60 | digital-pr | Wikipedia sourcing programme — cite TechPlay studio/country pages on "Video games in <country>" articles where | 2 | 3 | 4 | 5 | 3 | 1 | 1 | 1 | 4 | 1 | 5 | 5 | 35 |
| 177 | REG-10 | registration | Review page — "Been meaning to play this? Backlog it." | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 178 | REG-15 | registration | /lists/* public list — "Save this list / make your own" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 179 | REG-18 | registration | Comments CTA — "Reply — your first three are read by a person, then you're through" and honour ?redirect=back  | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 2 | 3 | 35 |
| 180 | REG-19 | registration | Forum thread foot — Keep "Join the Discussion"; add watch-thread as the hook ("Get replies in your bell") | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 181 | REG-24 | registration | /register success screen — Show the shelf-import buttons while they wait for the mail (import needs no verifie | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 2 | 3 | 35 |
| 182 | REG-27 | registration | /wow-analyzer result — "Save this character to your profile" (Battle.net sign-up is already one click) | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 183 | REG-30 | registration | Help centre (help.techplay.gg) — Direct connect buttons inside the article | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 184 | REG-32 | registration | 404 / game tombstone (410) — "Search your library instead" with sign-in | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 185 | REG-34 | registration | Steam Presence ("Playing now") on homepage/game pages — "Show yours — connect Steam" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 3 | 2 | 35 |
| 186 | HUB-009 | game-hub | Deadlock | 4 | 3 | 3 | 3 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 3 | 35 |
| 187 | HUB-024 | game-hub | Monster Hunter Wilds | 4 | 4 | 2 | 2 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 4 | 35 |
| 188 | EA-079 | evergreen | is gta 6 coming to pc — Availability: GTA 6 on PC (not announced) | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 189 | EA-086 | evergreen | modern warfare 4 system requirements — System requirements: Call of Duty: Modern Warfare 4 | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 190 | EA-091 | evergreen | can I run [game] — System requirements: Programmatic 'Can my PC run [game]?' across the games DB wi | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 191 | EA-097 | evergreen | gta 6 release time — GTA 6 release time by region + pre-load + file size (Nov 19 2026) | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 192 | EA-118 | evergreen | gta 6 ps5 pro vs ps5 — Compare: PS5 Pro vs PS5 vs Xbox Series X for GTA 6 (Nov 2026) | 5 | 3 | 1 | 4 | 5 | 1 | 2 | 2 | 2 | 3 | 4 | 3 | 35 |
| 193 | EB-104 | evergreen | gta 5 cheats — GTA 5 cheats (all platforms) | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 194 | EB-115 | evergreen | pokemon type chart — Pokémon type chart | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 195 | EB-150 | evergreen | [game] release date — PROGRAMMATIC FAMILY: '<game> release date' via the calendar | 5 | 3 | 1 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 196 | EA-022 | evergreen | ps5 120fps games list — 120Hz console games list and how to enable 120Hz on PS5/Xbox/Switch 2 | 4 | 3 | 2 | 4 | 5 | 1 | 4 | 2 | 2 | 2 | 3 | 3 | 35 |
| 197 | FIX-11 | technical-fix | Fix titles: truncated news titles, "Crimson Desert - review", "140,000+" in titles, duplicated brand on author | 3 | 3 | 4 | 5 | 4 | 2 | 1 | 1 | 1 | 1 | 5 | 5 | 35 |
| 198 | PART-04 | partnership | Regional partners: Balkan studios, A1 Adria League | 2 | 3 | 5 | 4 | 2 | 3 | 2 | 2 | 4 | 2 | 3 | 3 | 35 |
| 199 | PART-05 | partnership | Creator data partnerships (charts for creators, with credit) | 2 | 3 | 4 | 5 | 2 | 4 | 2 | 1 | 4 | 1 | 4 | 3 | 35 |
| 200 | TOOL-25 | tool | Personal completion dashboard across platforms | 1 | 3 | 3 | 5 | 1 | 3 | 4 | 4 | 2 | 2 | 3 | 3 | 34 |
| 201 | TOOL-32 | tool | Crossplay and cross-save table | 5 | 3 | 3 | 3 | 5 | 2 | 2 | 1 | 2 | 2 | 3 | 3 | 34 |
| 202 | TOOL-49 | tool | Handheld verified list (Deck, Ally, Switch 2) | 4 | 3 | 3 | 4 | 4 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 34 |
| 203 | TOOL-50 | tool | Multiplayer squad finder via Discord | 1 | 3 | 3 | 5 | 1 | 3 | 4 | 4 | 2 | 2 | 3 | 3 | 34 |
| 204 | PR-02 | digital-pr | The GTA 6 Shadow — how many dated 2026 releases moved *out* of the launch window | 3 | 3 | 4 | 3 | 3 | 5 | 1 | 1 | 4 | 1 | 3 | 3 | 34 |
| 205 | PR-17 | digital-pr | $70 / $80 Tracker — base price of every notable 2026 release at launch | 3 | 3 | 4 | 3 | 3 | 5 | 1 | 1 | 4 | 1 | 3 | 3 | 34 |
| 206 | PR-18 | digital-pr | Achievement Difficulty by Genre — median completion % of the "finished the story" achievement, 500 games | 3 | 3 | 4 | 4 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 34 |
| 207 | PR-20 | digital-pr | Rarest Platinum — hardest 100% completions on Steam by global % | 2 | 3 | 4 | 4 | 3 | 3 | 1 | 1 | 2 | 1 | 5 | 5 | 34 |
| 208 | PR-23 | digital-pr | Cross-Platform Overlap — % of members whose libraries span Steam + PSN/Xbox | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 1 | 1 | 5 | 5 | 34 |
| 209 | PR-29 | digital-pr | Title Length Inflation — characters per title by year | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 1 | 1 | 5 | 5 | 34 |
| 210 | PR-31 | digital-pr | Cover Colour Timeline — dominant cover colours by year (GD histogram on `cover_url`) | 3 | 3 | 4 | 5 | 3 | 5 | 1 | 1 | 2 | 1 | 3 | 3 | 34 |
| 211 | PR-32 | digital-pr | The Invisible Catalogue — games with no description/no store link/no score | 2 | 3 | 4 | 5 | 3 | 2 | 1 | 1 | 2 | 1 | 5 | 5 | 34 |
| 212 | PR-41 | digital-pr | Critic Score by Genre and Price Tier | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 3 | 1 | 3 | 3 | 34 |
| 213 | PR-42 | digital-pr | Length vs Price vs Score — cost per hour of 2026 releases | 3 | 3 | 4 | 4 | 3 | 5 | 1 | 1 | 3 | 1 | 3 | 3 | 34 |
| 214 | PR-43 | digital-pr | Annual "State of the Catalogue" report (PDF + web) | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 5 | 1 | 2 | 2 | 34 |
| 215 | PR-47 | digital-pr | Regional Critic Averages — Balkan-made games' OpenCritic mean vs Europe | 2 | 3 | 4 | 5 | 3 | 2 | 1 | 1 | 2 | 1 | 5 | 5 | 34 |
| 216 | REG-16 | registration | /studios/[slug] — "Follow this studio's releases" | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 2 | 2 | 34 |
| 217 | REG-21 | registration | Discord news posts (PollingService) — Footer "Track {game} on your shelf" deep link | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 2 | 2 | 34 |
| 218 | REG-35 | registration | Weekly digest (if mailed) — Include "invite a friend — compare taste" link (would make "Squad Goals" reachable | 2 | 3 | 5 | 5 | 2 | 2 | 5 | 3 | 1 | 2 | 2 | 2 | 34 |
| 219 | HUB-011 | game-hub | Final Fantasy XIV (Evercold 8.0) | 3 | 4 | 3 | 2 | 3 | 2 | 2 | 4 | 2 | 3 | 2 | 4 | 34 |
| 220 | HUB-018 | game-hub | Counter-Strike 2 | 5 | 3 | 2 | 2 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 3 | 34 |
| 221 | HUB-036 | game-hub | GPU and PC hardware (platform hub) | 4 | 3 | 1 | 3 | 4 | 2 | 2 | 5 | 2 | 3 | 2 | 3 | 34 |
| 222 | HUB-016 | game-hub | Battlefield 6 | 4 | 4 | 2 | 2 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 4 | 34 |
| 223 | HUB-031 | game-hub | Gears of War: E-Day | 4 | 5 | 2 | 1 | 3 | 3 | 2 | 2 | 2 | 3 | 2 | 5 | 34 |
| 224 | COM-04 | community | Release-day thread | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 34 |
| 225 | COM-07 | community | TechPlay community awards | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 34 |
| 226 | COM-22 | community | WoW weekly reset check-in | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 34 |
| 227 | COM-26 | community | Year-in-review share week | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 34 |
| 228 | FIX-02 | technical-fix | Fix 404 breadcrumb category links on every article | 3 | 2 | 5 | 5 | 4 | 1 | 1 | 1 | 1 | 1 | 5 | 5 | 34 |
| 229 | FIX-10 | technical-fix | Link game pages to genre, platform, series and tag hubs (today plain text) | 4 | 3 | 4 | 5 | 5 | 1 | 1 | 1 | 1 | 2 | 4 | 3 | 34 |
| 230 | FIX-15 | technical-fix | Add utm capture to first-party analytics and GA4 key events (sign_up, newsletter_verified, library_connected) | 1 | 3 | 5 | 5 | 1 | 1 | 3 | 3 | 1 | 3 | 4 | 4 | 34 |
| 231 | PART-03 | partnership | Ownership, funding and AI-use page; press page with honest numbers | 1 | 2 | 5 | 5 | 2 | 1 | 2 | 1 | 3 | 2 | 5 | 5 | 34 |
| 232 | TOOL-54 | tool | Collector's edition and pre-order tracker | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 | 2 | 4 | 3 | 3 | 33 |
| 233 | PR-16 | digital-pr | Regional Price Index — the same 50 games in 20 Steam regions | 3 | 3 | 4 | 4 | 3 | 4 | 1 | 1 | 3 | 1 | 3 | 3 | 33 |
| 234 | PR-21 | digital-pr | Games Nobody Finishes — TechPlay members' completion vs Steam global | 2 | 3 | 4 | 5 | 3 | 2 | 1 | 1 | 1 | 1 | 5 | 5 | 33 |
| 235 | PR-22 | digital-pr | Backlog Ratio — backlog vs completed on TechPlay shelves | 2 | 3 | 4 | 5 | 3 | 2 | 1 | 1 | 1 | 1 | 5 | 5 | 33 |
| 236 | PR-34 | digital-pr | Leonida Atlas — interactive map of 1,058 locations with real-world Florida analogues | 3 | 3 | 4 | 5 | 3 | 5 | 1 | 1 | 3 | 1 | 2 | 2 | 33 |
| 237 | PR-35 | digital-pr | 121 Vehicles vs Real Cars — spec comparison table | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 2 | 1 | 3 | 3 | 33 |
| 238 | PR-37 | digital-pr | Next Fest Demo → Release Tracker — what happened to past Next Fest demos | 3 | 3 | 4 | 3 | 3 | 4 | 1 | 1 | 4 | 1 | 3 | 3 | 33 |
| 239 | PR-45 | digital-pr | Consolidation Timeline — acquisitions visible in `parent_id` with dates | 3 | 3 | 4 | 5 | 3 | 4 | 1 | 1 | 4 | 1 | 2 | 2 | 33 |
| 240 | PR-46 | digital-pr | Ex-Yu Games Directory — every game made in ex-Yugoslav countries, with studios | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 4 | 1 | 3 | 3 | 33 |
| 241 | PR-58 | digital-pr | "Price of a Library" Calculator — what your Steam library cost at full price vs paid (via Steam import) | 3 | 3 | 4 | 4 | 3 | 5 | 1 | 1 | 2 | 1 | 3 | 3 | 33 |
| 242 | PR-59 | digital-pr | Expert-quote programme via Qwoted (free tier), Source of Sources, Featured/HARO | 2 | 3 | 4 | 3 | 3 | 2 | 1 | 1 | 3 | 1 | 5 | 5 | 33 |
| 243 | HUB-033 | game-hub | Helldivers 2 | 3 | 3 | 3 | 2 | 3 | 4 | 2 | 3 | 2 | 3 | 2 | 3 | 33 |
| 244 | HUB-026 | game-hub | Kingdom Hearts IV | 4 | 3 | 2 | 1 | 4 | 3 | 2 | 4 | 2 | 3 | 2 | 3 | 33 |
| 245 | HUB-014 | game-hub | Fortnite | 5 | 3 | 1 | 1 | 3 | 5 | 2 | 3 | 2 | 3 | 2 | 3 | 33 |
| 246 | HUB-035 | game-hub | Persona 4 Revival | 3 | 4 | 3 | 1 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 4 | 33 |
| 247 | FIX-08 | technical-fix | Stop game pages appearing as Google News items (check VideoGame datePublished) | 3 | 3 | 5 | 5 | 4 | 1 | 1 | 1 | 1 | 1 | 4 | 4 | 33 |
| 248 | CH-06 | channel | Reddit contribution with original data (no link-drops) | 3 | 3 | 3 | 4 | 2 | 4 | 2 | 1 | 4 | 1 | 3 | 3 | 33 |
| 249 | CH-10 | channel | Google "preferred source" prompt on articles (verify eligibility) | 3 | 3 | 3 | 4 | 3 | 1 | 1 | 3 | 1 | 2 | 5 | 4 | 33 |
| 250 | PR-13 | digital-pr | Live-Service Shutdown Counter 2026 | 3 | 3 | 4 | 3 | 3 | 4 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 251 | PR-15 | digital-pr | Cross-Store Price Delta — Steam vs GOG price for the same game | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 252 | PR-36 | digital-pr | WoW Readiness by Class — aggregate analyzer scores by class/spec/realm | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 253 | PR-39 | digital-pr | Hype vs Reality — `hype_score` at announcement vs critic score at release | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 254 | PR-49 | digital-pr | Release Precision by Publisher Size — who announces dates last | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 255 | PR-50 | digital-pr | "Cheapest Month to Buy" — discount seasonality for the top 500 games | 3 | 3 | 4 | 3 | 3 | 4 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 256 | PR-53 | digital-pr | Description-Language Audit — games with store pages in N languages (from `payload`) | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 257 | PR-55 | digital-pr | Embeddable Release Calendar widget (per platform / per month) with attribution link | 2 | 3 | 4 | 5 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 32 |
| 258 | PR-57 | digital-pr | Backlog Time Calculator — hours to clear a shelf using IGDB time-to-beat | 3 | 3 | 4 | 4 | 3 | 4 | 1 | 1 | 2 | 1 | 3 | 3 | 32 |
| 259 | HUB-012 | game-hub | Guild Wars 2 / Guild Wars 3 | 2 | 3 | 4 | 2 | 3 | 2 | 2 | 4 | 2 | 3 | 2 | 3 | 32 |
| 260 | HUB-022 | game-hub | Marvel Rivals | 4 | 3 | 2 | 1 | 3 | 4 | 2 | 3 | 2 | 3 | 2 | 3 | 32 |
| 261 | HUB-025 | game-hub | Resident Evil (Requiem, Veronica remake) | 4 | 3 | 2 | 1 | 4 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 32 |
| 262 | HUB-019 | game-hub | League of Legends | 4 | 4 | 1 | 1 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 4 | 32 |
| 263 | HUB-030 | game-hub | Phantom Blade Zero | 3 | 4 | 3 | 1 | 3 | 3 | 2 | 2 | 2 | 3 | 2 | 4 | 32 |
| 264 | COM-06 | community | The Game Awards prediction league | 1 | 3 | 5 | 5 | 1 | 3 | 3 | 5 | 1 | 1 | 2 | 2 | 32 |
| 265 | COM-09 | community | Clip of the month with prize | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 32 |
| 266 | COM-11 | community | Member spotlight | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 32 |
| 267 | COM-14 | community | Community challenge (collective goal) | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 32 |
| 268 | COM-18 | community | Price-drop and deals thread | 1 | 3 | 5 | 3 | 1 | 3 | 3 | 5 | 1 | 1 | 3 | 3 | 32 |
| 269 | CH-05 | channel | One short-video platform test with "games out this week" | 3 | 4 | 2 | 4 | 1 | 5 | 2 | 2 | 1 | 2 | 3 | 3 | 32 |
| 270 | TOOL-30 | tool | Physical vs digital status per game | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 | 2 | 2 | 3 | 3 | 31 |
| 271 | PR-03 | digital-pr | Slip Rate — % of announced dates that move, by publisher size and platform | 2 | 3 | 4 | 3 | 3 | 3 | 1 | 1 | 4 | 1 | 3 | 3 | 31 |
| 272 | PR-19 | digital-pr | Achievement Inflation — achievements per game by release year | 2 | 3 | 4 | 4 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 31 |
| 273 | HUB-032 | game-hub | Hollow Knight: Silksong | 3 | 3 | 2 | 2 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 31 |
| 274 | HUB-034 | game-hub | Metro 2039 | 3 | 4 | 3 | 1 | 3 | 2 | 2 | 2 | 2 | 3 | 2 | 4 | 31 |
| 275 | FIX-04 | technical-fix | Remove or build /search target of WebSite SearchAction | 2 | 2 | 5 | 5 | 3 | 1 | 1 | 2 | 1 | 1 | 4 | 4 | 31 |
| 276 | PART-01 | partnership | Review-code access: Steam Curator Connect, Keymailer, PressEngine accounts | 3 | 3 | 3 | 4 | 3 | 2 | 1 | 1 | 2 | 2 | 4 | 3 | 31 |
| 277 | PR-51 | digital-pr | Discount Depth by Genre — how fast genres hit −50% | 2 | 3 | 4 | 3 | 3 | 3 | 1 | 1 | 3 | 1 | 3 | 3 | 30 |
| 278 | HUB-021 | game-hub | Diablo IV | 3 | 3 | 2 | 2 | 3 | 2 | 2 | 3 | 2 | 3 | 2 | 3 | 30 |
| 279 | HUB-027 | game-hub | The Witcher IV | 4 | 2 | 2 | 1 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 2 | 30 |
| 280 | HUB-015 | game-hub | Roblox | 5 | 2 | 2 | 1 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 2 | 30 |
| 281 | HUB-017 | game-hub | EA Sports FC 27 | 5 | 3 | 1 | 1 | 3 | 3 | 2 | 2 | 2 | 3 | 2 | 3 | 30 |
| 282 | HUB-020 | game-hub | Valorant | 3 | 3 | 2 | 1 | 3 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 30 |
| 283 | PART-02 | partnership | Restart reviews and apply to OpenCritic once cadence is steady | 3 | 3 | 2 | 4 | 3 | 2 | 1 | 1 | 4 | 2 | 3 | 2 | 30 |
| 284 | TOOL-55 | tool | Accessibility settings database | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 | 2 | 2 | 2 | 2 | 29 |
| 285 | CH-07 | channel | X: live coverage of showcases and TGA; link the account from the site | 2 | 3 | 2 | 3 | 1 | 4 | 1 | 2 | 2 | 1 | 4 | 4 | 29 |
| 286 | HUB-028 | game-hub | The Elder Scrolls VI | 4 | 1 | 2 | 1 | 3 | 3 | 2 | 4 | 2 | 3 | 2 | 1 | 28 |
| 287 | HUB-023 | game-hub | Marvel's Wolverine | 4 | 2 | 2 | 1 | 3 | 3 | 2 | 2 | 2 | 3 | 2 | 2 | 28 |
| 288 | HUB-029 | game-hub | Crimson Desert | 3 | 3 | 2 | 1 | 3 | 2 | 2 | 2 | 2 | 3 | 2 | 3 | 28 |
| 289 | CH-08 | channel | Steam Curator page fed by reviews and hidden gems | 2 | 2 | 3 | 4 | 1 | 2 | 1 | 1 | 2 | 1 | 5 | 3 | 27 |
| 290 | FIX-16 | technical-fix | Resolve IGDB licence question for the August 2026 import | 1 | 1 | 5 | 5 | 1 | 1 | 1 | 1 | 1 | 3 | 3 | 3 | 26 |
| 291 | PAID-01 | paid-media | Branded search protection and a US Meta registration test after measurement is in place | 2 | 3 | 3 | 3 | 1 | 1 | 4 | 1 | 1 | 1 | 3 | 3 | 26 |

## Sources used

Every row names its source file in `opportunities.json`; evidence and URLs are in that file and in `research-sources.csv`.

## Gaps / needs more data

- No search volumes, traffic data or conversion rates exist to calibrate these scores. Replace estimates with Search Console, first-party analytics and account data as soon as they are available.
- Scores are comparable within a type more than across types.
