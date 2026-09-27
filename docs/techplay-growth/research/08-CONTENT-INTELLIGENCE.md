# 08 — Content Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: every content category the brief lists, judged on what brings immediate traffic, what compounds, what earns links and shares, what converts to accounts, and what brings people back. Includes TechPlay's current output measured from its own pages, the page templates that rank for competitors, and Google's current rules.

The content research agent was stopped before writing. This file was assembled from the pages it had already fetched (TechPlay articles, competitor templates, Google Search Central posts) and from the other research files.

## Executive summary

1. **FACT — Google's rules in 2026 reward depth by topic, not volume.** The February 2026 Discover core update favours "in-depth, original, and timely content from websites with expertise in a given area", judged "on a topic-by-topic basis" (5 Feb 2026). Google's May 2026 guide on generative AI in Search stresses "valuable, unique, non-commodity content" (15 May 2026). The September 2026 spam update, the fourth of the year, is rolling out now (Search Engine Roundtable).
2. **FACT — TechPlay's output is mostly short rewrites of widely covered news.** The six recent news and hardware pieces sampled run 409–845 words. The live audit counted 577 news items against 38 reviews and 4 guides, about 3.3–3.5 news posts a day, with two authors writing about 95% of the last 20 items, and no contextual links in article bodies (02).
3. **FACT — TechPlay's reviews are long and late.** Four reviews sampled run 2,164–2,882 words by one author. World of Warcraft: Midnight (released 2 Mar 2026) was reviewed on 19 Mar. Crimson Desert (19 Mar) on 4 Apr. Diablo IV: Lord of Hatred (28 Apr) on 19 May. By then IGN, PC Gamer, GameSpot and Metacritic own the results page (03).
4. **FACT — TechPlay's guides are long but off-strategy.** Three of the four are Genshin Impact guides (857 and 2,536 words sampled), where Game8, Icy Veins and the official wiki dominate (03). The fourth is a WoW addons list.
5. **OBSERVATION — The page types that rank for competitors are structured and maintained, not written once.** Tom's Hardware's GPU hierarchy has resolution-by-resolution tables and an update date. Game8's tier list is versioned ("7.1 Tier List … as of September 2026"). Push Square's "New PS5 Games Release Dates in 2026" carries an updated date. PCGamesN's "League of Legends system requirements 2026" answers Windows, Mac, Steam Deck and "can I run it" in four headings.
6. **HYPOTHESIS — TechPlay's content should feed its database and tools, not compete with them.** Every article that names a game should link to that game's page and offer the shelf, reminder or wishlist action. That is where content turns into accounts.
7. **RECOMMENDATION — Cut commodity rewrites, add structured evergreen and a small amount of original work.** A proposed mix is in §4 as an ESTIMATE.

## 1. Category-by-category analysis

Scale: Low / Med / High. "TechPlay readiness" reflects existing assets. Evidence notes follow the table.

| Category | Immediate traffic | Compounds | Earns links | Social shares | Converts to account | Repeat usage | Cost | TechPlay readiness | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| Breaking news (rewrites) | Med if fast | Low | Low | Med | Low | Low | Low | High (current habit) | Reduce |
| News with added value (context, data, "what it means for you") | Med | Low–Med | Med | Med | Low | Med | Med | Med | Keep, selectively |
| Original reporting / interviews | Med | Med | **High** | High | Low | Low | High | Low | Small, regular slot |
| Guides / how-to (new releases) | High in launch week | Med | Low | Low | Med | Med | Med | Low | Only for games the team plays |
| Evergreen guides (fixes, settings, platform) | Low at start | **High** | Med | Low | Med | Med | Med | Med | **Grow** (09) |
| Reviews (late) | Low | Low | Low | Low | Low | Low | High | Med | Change timing or format |
| Reviews (day one, with score) | High | Med | Med | Med | Low | Low | High | Low (needs codes) | Needs publisher access (15) |
| Previews | Low–Med | Low | Low | Low | Low | Low | Med | Low | Low priority |
| Features / opinion | Discover-dependent | Low | Med | High | Low | Low | Med | Med | A few, tied to expertise |
| Lists ("best X games") | Med | **High** | Med | High | Med | Low | Low–Med | **High** (database) | **Grow** |
| Game hubs | Med | **High** | Med | Med | **High** | **High** | Med | High (GTA 6 model) | **Grow** (18) |
| Explainers / glossary | Low | High | Med | Low | Low | Low | Low | Med | Grow for hardware |
| Lore | Discover | Med | Low | Med | Low | Low | Med | Low | Only for franchise hubs |
| Build guides / tier lists | High | Med (per patch) | Low | Med | Med | Med | **High** (upkeep) | Low | Avoid, except WoW |
| Hardware news | Med | Low | Low | Low | Low | Low | Low | High (current habit) | Refocus to gaming hardware |
| Comparisons / buying guides | Med | High | Med | Low | Low | Low | High (testing) | Low | Later, with affiliate |
| Release information | **High** around dates | Med | Low | Med | **High** (reminders) | **High** | Low | **High** (calendar) | **Grow** |
| System requirements / performance | High at launch | Med | Low | Low | Med | Low | Low (data) | Med | Template over DB |
| Benchmarks | Med | Med | **High** | Med | Low | Low | High | Low | Not now |
| Game database pages | Low (today) | **High** if enriched | Med | Low | **High** | Med | Low per page | High (333k rows) | Enrich top pages |
| Statistics / data journalism | Med | Med | **High** | **High** | Low | Low | Med | **High** (own data) | **Grow** (14) |
| Interactive tools | Med | **High** | **High** | High | **High** | **High** | High (build) | Med (several exist) | **Grow** (10) |
| Community content (polls, clubs) | Low | Low | Low | High | **High** | **High** | Low | Med | **Grow** (13) |
| User reviews / lists / ratings | Low | Med | Low | Med | **High** | Med | Low | Built, empty | Seed with rituals, not prompts |

Evidence behind the key ratings:

- **Links and shares for data:** this week's most-shared industry stories were single statistics (Minecraft's 300,000 new players a day, Requiem's $500M, Wolverine's 1.9M, cheating as an $8.5B market) (06).
- **Community over ratings:** Hookshot's sites had 0–1 user ratings on a new release but 5,106 and 9,331 votes on single polls (04 Part B).
- **Tools compound:** HowLongToBeat, SteamDB and Deku Deals rank with per-game utility pages that work logged out (04 Part C).
- **Guides at launch:** Game Rant listed 73 guides for one game in three days (04 Part B). Volume is the incumbents' game.

## 2. Template anatomy: ten page types that rank

| # | Page | Source fetched | What makes it work | TechPlay version |
|---|---|---|---|---|
| 1 | GPU Benchmarks Hierarchy 2026 | Tom's Hardware | Tables by resolution (1080p, 1440p, 4K), rasterisation and ray tracing sections, "choosing a card" advice, update date in data | Not now (needs testing); later, a "which games run on my GPU" view over requirements data |
| 2 | Versioned tier list | Game8 ("7.1 Tier List … as of September 2026") | Version number in title; 40 tables; "What can you do as a free member?" block | Only for WoW via the Analyzer |
| 3 | Game wiki hub | Game8 Genshin hub; IGN Elden Ring guide | Sections: checklists, beginner's guide, walkthrough, bosses, map, weapons; free-member features | The GTA 6 hub is already this shape |
| 4 | Release-date list | Push Square "New PS5 Games Release Dates in 2026" | One living URL per year and platform; update date | Generate from the release calendar, with "remind me" on every row |
| 5 | System requirements | PCGamesN "League of Legends system requirements 2026" | H2s for Windows, Mac, Steam Deck, "Can I run" | Template over game pages (09: EA-086, EA-091) |
| 6 | Game length | HowLongToBeat "How long is Elden Ring?" | One number answered first; tables of submissions | Link to HLTB or show TechPlay members' own hours |
| 7 | PC performance review | Digital Foundry "Control Resonant: An Impressive PC Version…" | Tested, dated, specific | Not now |
| 8 | New-release guide | Game Rant "How do Battles Work in Graveyard Keeper 2?" | Question title; H2s for when, preparing, how, winning, rewards; reader question at the end | Only for games the team plays |
| 9 | Evergreen best-of list | RPS "The best PC games to play right now" | "Updated on" date; comments; hivemind byline | Generate candidates from DB ratings plus editor picks |
| 10 | Codes and daily answers | RPS guides index (codes, Wordle, NYT Connections) | Daily search demand | **Do not copy** |

## 3. TechPlay's current content (OBSERVATION from pages fetched 27 Sep 2026)

| Piece | Published | Words (approx.) | Notes |
|---|---|---|---|
| News: Minecraft sold 425M copies | 27 Sep | 845 | Widely covered topic |
| News: Xbox in-game ads patent | 26 Sep | 409 | Widely covered |
| News: GTA 6 $400 collector's set | 25 Sep | 435 | Title truncated in `<title>` |
| News: CS2 Rush mode and chickens | 24 Sep | 578 | Widely covered |
| News: Tim Schafer on layoffs | 24 Sep | 812 | Quote-driven |
| Hardware: Windows 11 modern look | 22 Sep | 744 | General tech, not gaming |
| Hardware: Nvidia CEO on AI | 21 Sep | 515 | General tech |
| Hardware: iPhone 18 Pro | 10 Sep | 1,450 | Phones, off-topic for a gaming brand |
| Review: WoW Midnight | 19 Mar (launch 2 Mar) | 2,882 | 17 days after launch |
| Review: Crimson Desert | 4 Apr (launch 19 Mar) | 2,522 | 16 days after launch |
| Review: Diablo IV Lord of Hatred | 19 May (launch 28 Apr) | 2,436 | 21 days after launch |
| Review: Windrose (early access) | 11 Jun | 2,164 | — |
| Guide: Genshin Finale of the Deep | 17 Jun | 857 | Game8/Icy Veins territory |
| Guide: Genshin Sandrone | 21 Jul | 2,536 | Same |
| Guide: WoW Midnight addons | 5 Mar | 2,179 | Wowhead/Icy Veins territory |

Word counts are the text of the page's `<article>` element and include captions and related links, so they overstate body length slightly.

**Structural observations (02, 03):** articles carry NewsArticle or Review JSON-LD with author and dates, `max-image-preview:large`, and breadcrumbs; but breadcrumbs link to 404 category URLs, bodies have no contextual links, and the "Hardware" section publishes general technology news although its title promises benchmarks.

## 4. Content mix (RECOMMENDATION, ESTIMATE shares for the planning phase)

| Share of effort | Content | Why |
|---|---|---|
| ~25% | News with added value, only in TechPlay's topic areas (PC, platform questions, WoW, release news) | Discover's topic-expertise rule; drop general tech and phones |
| ~25% | Evergreen templates and living pages (release lists, where-to-play, requirements, PC fixes) | Compounds; built on the database |
| ~15% | Data stories from TechPlay's own data | Links and shares (14) |
| ~15% | Hub upkeep (GTA 6 now, one or two more in 18) | Registration and return visits |
| ~10% | Community formats (polls, club, weekly thread, lists) | Accounts and repeat visits |
| ~10% | Reviews or verdicts, repositioned (see below) | Credibility |

**Reviews, repositioned (HYPOTHESIS):** without early codes, a review 16–21 days late cannot rank. Two alternatives: a short verdict on the game page at launch that grows into a full review, or a "30 days later" format that competitors do not cover, linked to TechPlay members' own playtime from library imports.

## 5. Content-to-product bridges

| Content | Product action it should end in |
|---|---|
| Any article naming a game | Link to the game page; "Add to shelf" / "Wishlist" |
| Release news and lists | "Remind me on release day" (calendar reminders exist) |
| Reviews and verdicts | Rate it yourself; see how many members played it |
| PC-fix and requirements pages | Save your PC spec (future) for "can I run it" across your wishlist |
| WoW content | Run the WoW Analyzer on your character |
| "What to play" pieces | Backlog Advisor over your imported library |
| GTA 6 pages | GTA 6 reminder, newsletter, Discord |
| Data stories | Newsletter sign-up for the monthly data report |

## 6. Risks

- **AI features in Search** take clicks from simple answers. Google's own May 2026 guidance points to "non-commodity content". Release times, file sizes and definitions are the most exposed; tools, personal data and community are the least.
- **Scaled-content policy** applies to the 295k thin game pages (03 §9).
- **Discover volatility:** a single core update reshapes traffic; the February 2026 update favoured topic experts.
- **Commodity news** wastes the scarce resource, two authors' time.

## Sources used

- TechPlay pages fetched 27 Sep 2026: five news articles, three hardware articles, four reviews, three guides, author page, game pages.
- Google Search Central Blog: "Google's February 2026 Discover Core Update" (https://developers.google.com/search/blog/2026/02/discover-core-update); "A new resource for optimizing for generative AI in Google Search" (https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing, 15 May 2026); "Update to the Site Reputation Policy" (https://developers.google.com/search/blog/2026/08/update-site-reputation-policy, 28 Aug 2026); "Updating our site reputation abuse policy" (https://developers.google.com/search/blog/2024/11/site-reputation-abuse); "March 2024 core update and new spam policies" (https://developers.google.com/search/blog/2024/03/core-update-spam-policies); "Creating Helpful, Reliable, People-First Content".
- Search Engine Roundtable on the September 2026 spam update.
- Competitor templates: Tom's Hardware GPU hierarchy; Game8 Genshin hub and tier list; IGN Elden Ring guide; HowLongToBeat Elden Ring; Digital Foundry Control Resonant PC review; Push Square PS5 release dates 2026; PCGamesN League of Legends system requirements; Game Rant Graveyard Keeper 2 guide; RPS guides index.

## Gaps / needs more data

- No traffic data by content type for TechPlay; Search Console and the first-party collector should be split by section.
- No link-attraction study was fetched; link claims rely on observed industry behaviour.
- PC Gamer's best-settings pages and PCGamingWiki blocked the fetcher.
- Discover and AI Overviews exposure by query type is not measured.
