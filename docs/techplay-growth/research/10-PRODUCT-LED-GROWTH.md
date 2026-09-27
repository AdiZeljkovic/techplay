# 10 — Product-Led Growth

Status: Phase 1 research draft — 27 Sep 2026
Scope: what gaming tools and utilities exist, why people use them, return to them, link to them and sign up for them; what TechPlay already has; and at least 50 tool ideas TechPlay could realistically build from its own data.

The product-led-growth agent was stopped before writing. This file combines its fetched pages (about 55 tool sites, of which about 20 blocked the fetcher), the competitor research on databases and trackers (04 Part C), and the repository audit (01).

## Executive summary

1. **FACT — TechPlay already ships more tools than most competitors, and hides them.** Library import from Steam, PlayStation, Xbox, GOG and Epic; seven shelf statuses; nightly Steam prices ("shelf worth"); Gamer DNA; Taste Match; Backlog Advisor; release reminders; wishlist release notices; lists and tier lists; leaderboards; a WoW character analyzer; The Last Disc petition; a GTA 6 database with 1,058 map locations (01). The `/tools` page lists five of them.
2. **FACT — Most of TechPlay's tools are invisible to a logged-out visitor.** Backlog Advisor, Taste Match and the quest board sit behind sign-in walls; Taste Match only renders for a signed-in viewer looking at someone else's profile, so it cannot be shared with a non-member (01 Part A F21).
3. **FACT — The winning pattern elsewhere is "useful logged out, better logged in".** HowLongToBeat's Steam calculator works for anyone with a public Steam ID and turns into an import when you log in. Deku Deals and IsThereAnyDeal answer price questions publicly and add alerts for accounts. SteamDB is fully public and asks for donations (04 Part C).
4. **FACT — Cross-platform import is the feature trackers charge for.** SavePoint charges $9 a month for Steam, Xbox and PSN import; Infinite Backlog $3 a month; Gamery is a paid Apple-only app. Backloggd has no import at all (04 Part C). TechPlay gives five-platform import away.
5. **FACT — Data access has limits that shape what TechPlay can build.** The Steam Web API allows 100,000 calls a day. IGDB's API documentation says it is "free for non-commercial usage under the terms of the Twitch Developer Service Agreement" with a limit of four requests per second (fetched 27 Sep 2026). TechPlay's catalogue was seeded by a one-off IGDB import in August 2026 (docs/README.md §8); the licence terms of that import for a commercial, ad-supported site should be checked.
6. **HYPOTHESIS — Three tool families are TechPlay's best growth bets:** shareable identity cards from imported libraries (Gamer DNA, "library worth", year in review across platforms), release and price alerts on shelves (the return loop), and public per-game utility blocks on database pages (where to play, requirements, length, price) that give the 295k pages a reason to exist.

## 1. What already exists in TechPlay (FACT, from 01)

| Tool | Logged-out use | Share surface | Main weakness |
|---|---|---|---|
| Library import (5 platforms) | No | Profile share card | PSN, GOG and Epic need pasted codes; 2 of 55 members linked a platform |
| Shelves (7 statuses) and wishlist | No | Profile | No price or release alert by email or push |
| Shelf worth (Steam prices, nightly) | No | None | Steam and US prices only |
| Gamer DNA | No | Generic profile OG image only | No DNA-specific share card |
| Taste Match | No | None | Needs both people signed up |
| Backlog Advisor | No | None | Behind sign-in; nothing indexable |
| Release calendar + reminders | Calendar yes; reminders no | None on calendar pages | Reminders only reach the on-site bell |
| Lists and tier lists | Read yes | Share + OG image | 4 lists exist |
| Leaderboards and seasons | Read yes | None | Tiny population |
| WoW Analyzer | **Yes** | Share counter | Copy still says "Midnight launches March 2, 2026" |
| The Last Disc petition | **Yes** | Share row with prewritten text | Signature count UNKNOWN |
| GTA 6 hub (vehicles, weapons, characters, map) | **Yes** | Share on pages | Hero counters show zeros before hydration (02) |
| Homepage rails (hidden gems, on this day) | Yes | None | "Trending" is actually top-rated ≥8.5 |
| Frontiers | Teaser only | None | Countdown expired 13 Sep 2026; no product behind it |

## 2. The tools landscape, by category

Evidence levels: **FACT** where the tool's own page was fetched; **04C** where the competitor research fetched it; **BLOCKED** where the site refused the fetcher and nothing is claimed beyond the name.

| Category | Examples | Why people use and return (evidence) | Registration | Monetisation | Lesson for TechPlay |
|---|---|---|---|---|---|
| Build planners | Maxroll D4Planner (FACT: "character builder for Diablo 4 including Equipment, Legendary Aspects…"), Path of Building (FACT: "A powerful build planner for Path of Exile"), Raidbots (FACT: "The easiest way to use SimulationCraft") | Every patch and season reshuffles builds | Optional | Ads, premium, Patreon | Only where TechPlay has data: WoW via Blizzard and Raider.IO APIs |
| Economy/meta stats | poe.ninja (FACT: "economy and build overviews"), Blitz (FACT: overlays, meta stats, tier lists; "Get Premium", "Go Ad-Free") | Live data changes daily | Optional | Premium, ads | Not TechPlay's lane |
| Interactive maps | MapGenie (FACT: "Find locations, loot, and more"), IGN Maps (FACT) | Checklists of collectibles; progress saved | Account saves progress | Pro tier, ads | GTA 6 map already exists; progress tracking is the hook at launch |
| Character/progress trackers | Raider.IO (FACT: Mythic+ and raid rankings, character profiles), WarcraftLogs, FFLogs, Tomestone (BLOCKED or thin) | Weekly lockouts and scores | Optional | Premium | WoW Analyzer can cite Raider.IO data it already uses |
| Achievement trackers | TrueAchievements, PSNProfiles, Exophase, Steam Hunters, completionist.me (all BLOCKED) | Completion and rarity | Required to track | Pro ad removal | TechPlay stores members' Steam achievements (~16k rows, per user); global rarity needs Steam's public percentages (14); rarity pages are open ground (09: EB-089) |
| Release trackers | IGN Upcoming Games (FACT), GamesRadar+ 2026 schedule (FACT), Push Square release list (FACT) | Planning purchases | No | Ads | TechPlay's calendar plus reminders is stronger than a static list |
| Price trackers | Deku Deals, IsThereAnyDeal (04C), CheapShark API (FACT), GG.deals, PSPrices (BLOCKED) | Wishlist price alerts | For alerts | Affiliate, Patreon | Alerts on TechPlay wishlists; CheapShark offers a public price API |
| Collection/backlog | Backloggd, HowLongToBeat, Grouvee, Infinite Backlog, Stash, Gamery, SavePoint, Playnite, GOG Galaxy (04C) | Identity, logging, lists | Required | Patreon, subscriptions | TechPlay's import is the differentiator |
| Game length | HowLongToBeat (FACT: "Create a backlog, submit your…"; daily guessing game) | One number every buyer wants | No for lookup | Ads | Show members' own hours from imports |
| PC building | Logical Increments (FACT: "Helping you build a PC, at any budget"), PCPartPicker (BLOCKED), GPUCheck and bottleneck calculators (BLOCKED) | Budget planning | No | Affiliate | Later; hardware testing absent |
| Performance DBs | PCGamingWiki, ProtonDB (BLOCKED or empty) | Fixes and compatibility | Contribute | Donations | Link out; do not duplicate |
| Comparison engines | versus.com (FACT: "Compare everything") | Specs side by side | No | Affiliate | Not gaming-specific |
| Year in review | Steam Replay (FACT: sign-in required), Xbox Year in Review, PlayStation Wrap-Up (404 at fetch), Backloggd year in review (rate-limited) | Identity and sharing once a year | Required | None | **Cross-platform** year in review is unclaimed |
| Steam utilities | SteamDB calculator (FACT), Steam ID finders (BLOCKED) | Account value, lookups | Steam login | Donations | "Library worth" card already half-built |
| Rankings | Steam250 (04C: 130k games, 223+ daily rankings, hidden gems) | Discovery | No | Patreon | TechPlay's hidden-gems rail can become ranked pages |

**Data-access facts that constrain building (FACT):**

- Steam Web API: 100,000 calls a day; free; Valve can change it.
- IGDB API: free for non-commercial use under the Twitch Developer Service Agreement; four requests a second.
- Steam Curator Connect lets developers send review copies to curators "with the right voice, personality, and audience" (Steamworks documentation). A TechPlay curator page could receive codes this way.

## 3. Why TechPlay's current tools are under-discovered (OBSERVATION)

- **Names do not match queries.** "Backlog Advisor" returns Backloggd on Bing; "WoW analyzer" returned Blizzard pages (03). Users search "what game should I play next" and "WoW character checker".
- **Tools sit behind sign-in walls** with nothing indexable for guests.
- **Articles do not link to tools.** The live audit found no contextual links in article bodies (02).
- **No share images for the most shareable outputs** (Gamer DNA, Taste Match, library worth).
- **Copy is stale** (WoW Analyzer's Midnight launch date; "50K+ players analyzed · 4.9/5" claims that the live audit could not verify).

## 4. TechPlay tool and product ideas (55)

Columns: registration needed (No / Optional / Yes), SEO landing potential, share potential and retention loop on 1–5 (ESTIMATE), build effort S/M/L/XL (ESTIMATE), and data status (Have / Partial / Need).

| # | Idea | User job | Data | Reg. | SEO | Share | Retention | Effort | Risks / dependencies | Comparable | Why it could win |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Cross-platform year in review ("Your 2026 in games") | Show off my year | Have (imports, playtime) | Yes | 3 | 5 | 3 | M | Needs enough linked accounts | Steam Replay, Xbox YIR, PS Wrap-Up | Only one covering all five platforms |
| 2 | Gamer DNA share card | Show my gamer identity | Have | Yes | 1 | 5 | 2 | S | OG image route | Backloggd stats | Already computed; needs an image |
| 3 | "My library is worth $X" card | Brag / insure / curiosity | Have (Steam prices) | Optional | 3 | 5 | 2 | S | Steam-only, US prices | SteamDB calculator | Public Steam ID mode for guests |
| 4 | Public Steam library calculator (logged out) | See my backlog stats instantly | Have | No | 4 | 4 | 2 | M | Public profiles only | HLTB Steam calculator | Converts to import on sign-up |
| 5 | Taste Match invite link | Compare with a friend | Have | Yes (both) | 1 | 5 | 3 | S | Needs friend to sign up | Letterboxd compatibility | Referral loop built in |
| 6 | Wishlist price-drop alerts (email/Discord/push) | Buy at the right price | Partial (Steam prices) | Yes | 2 | 2 | 5 | M | Only Steam today; add CheapShark | Deku Deals, ITAD | Alerts on a list the user already has |
| 7 | Release-day alerts outside the site | Know when my game is out | Have (reminders) | Yes | 2 | 2 | 5 | S | Mail channel, bot DM | Stash, Gamery | Reminders exist; just deliver them |
| 8 | Calendar export (ICS) for wishlist releases | Put releases in my calendar | Have | Optional | 3 | 2 | 4 | S | — | Gamery countdowns | Cheap, sticky |
| 9 | "Where to play" block on every game page | Is it on my platform / sub? | Partial (store links ~48k) | No | 5 | 1 | 2 | M | Subscription catalogue data needed | GRDB "Where to Play" | Answers the most common question |
| 10 | Game Pass / PS Plus catalogue tracker | What's joining/leaving my sub | Need | No | 4 | 3 | 4 | M | Data sourcing | Push Square, Pure Xbox lists | Pairs with shelves: "on your Game Pass" |
| 11 | "Can I run it" against a saved PC spec | Will it run on my PC? | Partial (requirements) | Optional | 5 | 2 | 3 | L | Requirements data quality | Can You Run It, PCGameBenchmark | Checks the whole wishlist at once |
| 12 | Release time by time zone | When does it unlock here? | Need per title | No | 4 | 3 | 1 | S | Manual per big release | Countdown sites | GTA 6 and MW4 first |
| 13 | GTA 6 countdown with reminder | Count down and get pinged | Have | Optional | 4 | 4 | 3 | S | 19 Nov 2026 fixed | vicountdown.com etc. | Converts to reminder, not just a timer |
| 14 | GTA 6 map progress tracker (at launch) | Track collectibles | Partial (1,058 locations) | Yes to save | 4 | 3 | 4 | M | Needs post-launch data | MapGenie | Existing map + accounts |
| 15 | GTA 6 vehicle database with real-world equivalents | Which car is which | Have (121 vehicles) | No | 4 | 4 | 2 | S | Accuracy pre-launch | Fan wikis | Already built |
| 16 | GTA 6 edition comparison and price by region | Which edition should I buy | Partial | No | 4 | 3 | 1 | S | Price accuracy | Beebom, gta6index | Official prices known |
| 17 | WoW Analyzer, re-aimed per patch | Is my character ready | Have (Blizzard, Raider.IO) | No | 4 | 4 | 4 | S | API terms | Raider.IO, Raidbots | Unique on-site; weekly reason to return |
| 18 | WoW weekly checklist | What to do this reset | Need | Optional | 3 | 2 | 5 | M | Content upkeep | Wowhead | Pairs with Analyzer |
| 19 | Backlog Advisor, public quiz version | What should I play next | Have (engine) | No → Yes | 5 | 3 | 3 | M | Needs guest mode | Inventory Full, SavePoint | Query "what game should I play" |
| 20 | "Games like X" pages | Find similar games | Have (similar-games field) | No | 5 | 2 | 2 | M | Quality of similarity | Many list sites | Template over 333k rows |
| 21 | Series order pages ("X games in order") | Play a series right | Have (series relations) | No | 5 | 2 | 2 | M | Series data gaps | playinorder.net, IGN | "Add whole series to shelf" |
| 22 | Backlog time calculator | How long will my backlog take | Partial (time-to-beat field) | Optional | 3 | 4 | 2 | S | Data completeness | HLTB | Uses imported library |
| 23 | Achievement rarity pages | Rarest achievements per game | Partial (per-user `steam_achievements`; global percentages obtainable from Steam Web API) | No | 4 | 3 | 2 | M | Only Steam | Steam Hunters, TrueAchievements | Open ground in search |
| 24 | Easiest platinum / 100% list | Quick completions | Partial | No | 4 | 3 | 2 | M | Needs difficulty data | PSNProfiles | Uses completion rates |
| 25 | Personal completion dashboard across platforms | Track my completions | Have | Yes | 1 | 3 | 4 | M | PSN/Xbox trophy sync | Exophase | Cross-platform |
| 26 | Year's release congestion chart | Which weeks are crowded | Have (calendar) | No | 3 | 4 | 1 | S | — | GameDiscoverCo commentary | Data story + tool (14) |
| 27 | Steam rank movers weekly | What's rising | Have (Steam API) | No | 3 | 4 | 3 | S | — | SteamDB charts | Weekly post and page |
| 28 | Studio pages with "games at risk" after closures | What happens to my games | Have (57k studios) | No | 3 | 4 | 1 | M | Accuracy | News only | Timely (Xbox closures) |
| 29 | Studios-closed-in-2026 tracker | Industry state | Partial | No | 3 | 4 | 2 | S | Editorial upkeep | Layoff trackers | Links to studio and game pages |
| 30 | Physical vs digital status per game | Can I buy it on disc | Need | No | 3 | 3 | 1 | M | Data sourcing | None structured | Sony disc story |
| 31 | Switch 2 edition / upgrade tracker | Is there an upgrade, what cost | Need | No | 4 | 2 | 2 | S | Manual data | Nintendo Life lists | Fits current demand |
| 32 | Crossplay and cross-save table | Can I play with friends | Need | No | 5 | 2 | 1 | M | Data upkeep | Scattered articles | Template FAQ pages |
| 33 | File size and pre-load table | Do I have space | Need | No | 4 | 1 | 1 | S | Per-release data | Scattered | Launch-week traffic |
| 34 | Hidden gems ranked pages | Find great unknown games | Have (ratings) | No | 4 | 3 | 2 | S | Rating sample sizes | Steam250 | Rail already exists |
| 35 | On-this-day pages and social card | Nostalgia | Have | No | 3 | 4 | 3 | S | — | — | Daily content for Discord and social |
| 36 | Daily guessing game (cover, screenshot or release year) | Daily fun habit | Have (333k games, images) | Optional | 2 | 5 | 5 | M | Moderation of answers | HLTB game, IGN Daily Games | Streak loop without manipulation |
| 37 | Weekly poll with results page | Have my say | Have (forum polls) | Optional | 2 | 4 | 4 | S | — | Nintendo Life polls | Polls beat ratings (04) |
| 38 | Prediction league (The Game Awards, showcases) | Beat my friends | Need | Yes | 2 | 4 | 4 | M | Scoring logic | Polygon predictions | TGA on 10 Dec |
| 39 | Monthly game club | Play together | Have (forum, Discord) | Optional | 2 | 3 | 5 | S | Host time | GR+ RPG Club, HLTB Game of the Month | Cheap community ritual |
| 40 | Discord `/game` and `/remind` commands | Look up and remind from Discord | Partial (20 commands) | No | 1 | 3 | 4 | S | — | SteamDB bot | Distribution inside servers |
| 41 | Embeddable "currently playing" badge | Show my game on forums/streams | Have (presence) | Yes | 1 | 4 | 2 | S | — | Steam signatures | Backlinks from profiles |
| 42 | Embeddable release countdown widget | Put a countdown on my site | Have | No | 2 | 3 | 1 | S | — | Countdown sites | Backlinks |
| 43 | Steam Curator page fed from reviews and gems | Recommendations inside Steam | Have | No | 2 | 2 | 2 | S | Curator growth slow | Steam250 curator | Store-page presence |
| 44 | Monthly data report ("state of the backlog") | Industry curiosity | Have (anonymised shelves) | No | 3 | 4 | 2 | M | Privacy and sample size | GameDiscoverCo | PR and links (14) |
| 45 | Review-score vs sales tracker | Did the reviews matter | Partial (OpenCritic 25/day) | No | 3 | 4 | 1 | M | Sales data sparse | Alinea commentary | Data story |
| 46 | Price history per game | Is this a good deal | Partial (nightly Steam) | No | 4 | 2 | 3 | M | Only Steam | SteamDB, ITAD | Public block on game pages |
| 47 | Black Friday / Steam sale picks from my wishlist | What to buy in the sale | Partial | Yes | 3 | 3 | 4 | M | Price coverage | ITAD | Sale events are fixed (05) |
| 48 | Demo tracker for Steam Next Fest | Which demos to try | Need | Optional | 3 | 3 | 3 | S | Data from Steam | — | 19–26 Oct and Feb 2027 |
| 49 | Handheld verified list (Deck, Ally, Switch 2) | Will it run on my handheld | Partial | No | 4 | 2 | 2 | M | Deck status data | Steam Deck HQ | Growing segment |
| 50 | Multiplayer squad finder via Discord | Find people to play with | Have (friends, Discord) | Yes | 1 | 3 | 4 | M | Moderation | Discord LFG servers | Uses presence and shelves |
| 51 | "Friends playing now" feed | See what friends play | Have (presence) | Yes | 1 | 2 | 4 | S | Steam-only polling | Steam friends | Social proof inside site |
| 52 | Completion goals and reading list | Set and hit goals | Have (goals) | Yes | 1 | 2 | 4 | S | — | Goodreads challenge | Already modelled |
| 53 | Gift ideas from a friend's wishlist | Buy a gift | Have | Optional | 3 | 3 | 1 | S | Privacy settings | Steam wishlist gifting | Christmas window |
| 54 | Collector's edition and pre-order tracker | Which editions exist | Need | No | 3 | 3 | 1 | M | Affiliate disclosure | Retail pages | Commercial intent |
| 55 | Accessibility settings database | Can I play with my needs | Need | No | 3 | 3 | 1 | L | Data collection | Can I Play That | Differentiated, trust-building |

## 5. How tools rank, get linked and monetise (OBSERVATION from 04C and fetched pages)

- **Rank:** per-entity pages that answer a question (HLTB "How long is Elden Ring?", SteamDB app pages, MapGenie maps) rank for "[game] + [question]".
- **Get linked:** canonical data sources (SteamDB, HLTB, OpenCritic) are cited by journalists; embeddable widgets and badges carry backlinks.
- **Monetise:** ads for anonymous traffic; Patreon or supporter tiers for ad removal (SteamDB, PlayTracker, Playnite, Backloggd); affiliate for prices (Deku Deals, ITAD); premium planners (Maxroll, Blitz).
- **Require registration** only where state must persist (progress, alerts, lists). Lookup is free and public.

## Sources used

Fetched 27 Sep 2026: maxroll.gg D4Planner; Path of Building Community; poe.ninja; Raidbots; Raider.IO; Blitz; MapGenie; IGN Interactive Maps; IGN Upcoming Games; GamesRadar+ 2026 release schedule; HowLongToBeat; CheapShark API; IGDB API docs; Steam Web API Terms of Use; Steamworks "Curators and Curator Connect"; Steam Replay (sign-in page); SteamDB calculator; Logical Increments; versus.com; Tomestone; OpenCritic; Infinite Backlog; Backloggery. Blocked: Backloggd (secure-connection page), GG.deals, PSPrices, PCPartPicker, PCGamingWiki, TrueAchievements, TrueTrophies, PSNProfiles, Exophase, Steam Hunters, completionist.me, tracker.gg, Mobalytics, light.gg, WarcraftLogs, FFLogs, WoWProgress, GPUCheck, bottleneck calculators, Steam ID finders. Plus 04 Part C and 01.

## Gaps / needs more data

- Usage data for TechPlay's own tools (Analyzer runs, Backlog Advisor sessions, Last Disc signatures) was not available.
- Many tool sites blocked the fetcher, so their registration and monetisation details come from third-party descriptions in 04 Part C.
- IGDB licence terms for the August 2026 import need a legal read.
- Subscription catalogue data sources (Game Pass, PS Plus) were not researched.
