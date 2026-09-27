# 03 — Search Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: how discoverable techplay.gg is in Google Search, Google News, Google Discover and Bing, and what it would take to change that.

**Limit stated first: there is no Search Console or Bing Webmaster access in this session.** Everything below is either a measured number copied from `docs/README.md` (7 Sep 2026), a page fetched on 27 Sep 2026, or a public results page observed on 27 Sep 2026. No ranking position, impression count or click number is invented.

## Executive summary

1. **FACT — Search traffic is near zero and has been since 17 Aug 2026.** Cloudflare served a 403 challenge to Googlebot for about two and a half weeks. Clicks fell from about 100 a day to 1–2 a day, and on 7 Sep 2026 had not recovered although the site was technically clean again (docs/README.md §12).
2. **FACT — Google has indexed 56,355 URLs and declined 338,358.** The sitemaps offer 295,024 game URLs, and only 1,967 of those game pages carry anything TechPlay wrote (0.7%). Googlebot fetched about 290 URLs a day, 77 of them game pages, which is roughly ten years for one pass over the catalogue.
3. **FACT — TechPlay did not appear in any of 114 observed Bing results pages.** 74 came from the search audit and 40 from the GTA 6 audit. They covered its own review titles, its own news topics, GTA 6 queries, tool names ("backlog advisor", "wow analyzer") and famous game names. About 45 pages were query-relevant; the rest were degraded by Bing and are not used as evidence.
4. **FACT — Google News did not return TechPlay for any of 16 of its own recent stories.** The 13 searches that returned anything produced 751 results, and none linked to techplay.gg. A `site:techplay.gg` Google News search returns mostly game-database pages for obscure German-market titles such as "Medicopter 117" and "ProTrain Perfect 2", not articles.
5. **FACT — The technical basics are mostly right.** Every sampled page is `index, follow` with `max-image-preview:large`, a canonical and JSON-LD (NewsArticle, Review, VideoGame, FAQPage, HowTo, ItemList). There is a Google News sitemap and a Googlebot-News robots group.
6. **FACT — Several on-page defects are provable.** The WebSite SearchAction points at `/search`, which returns "This area isn't in the build" with `noindex`. Every article breadcrumb links to a 404 category URL. Some titles are truncated or thin ("Crimson Desert - review"; "GTA 6 is getting a $400 Collector's Set which does not"). The GTA VI game page's meta description is store pre-order text. GTA 6 news is attached to the wrong game page.
7. **HYPOTHESIS — The index problem is now quality and crawl allocation, not access.** With 295k near-identical game pages and ~640 articles, Google is spending its small crawl budget on pages that give it little reason to index. Shrinking the indexable set to pages with something original is the most likely lever, but it is a decision with trade-offs, set out in §9.

## 1. Methodology and limits

| Method | What it shows | Limit |
|---|---|---|
| `docs/README.md` §12 | Indexed and not-indexed counts, clicks, Googlebot volume | Measured 7 Sep 2026, twenty days old |
| Fetches of techplay.gg pages, sitemaps and robots.txt | Titles, meta, canonicals, JSON-LD, sitemap sizes | Server-rendered HTML only |
| Bing results pages fetched by script (74 queries, plus 40 from the GTA 6 audit) | Who ranks on Bing, whether TechPlay appears | About half the pages were degraded to generic results and discarded |
| Google results via the session's search tool | Who ranks on Google for a subset of evergreen queries (see 09) | US results; tool budget ran out |
| Google News RSS search (`news.google.com/rss/search`) | Whether TechPlay appears in News for its own topics | RSS shows up to 100 items per query |

## 2. Index footprint

| Measure | Value | Source |
|---|---|---|
| Sitemap index | 16 child sitemaps | `/sitemap.xml`, fetched |
| Articles sitemap | 683 URLs | fetched |
| Game sitemaps | 6 files, 295,024 URLs (49,997 in games-1 alone, 9.2 MB) | fetched, README §12 |
| Studios sitemap | 31,970 URLs | fetched |
| Series sitemap | 4,181 URLs | fetched |
| Lists sitemap | 2 URLs | fetched |
| Guides sitemap | 4 URLs | fetched |
| News sitemap | 7 URLs in its 48-hour window | fetched |
| Google indexed / not indexed | 56,355 / 338,358 | README §12, 7 Sep |
| Bing `site:techplay.gg` | "7,670 results" | Bing results page, 27 Sep |

**OBSERVATION — The indexable surface is 99.8% database pages.** 295k game URLs plus 32k studios plus 4k series against 683 articles. Whatever Google thinks of the game pages is what it thinks of the site.

## 3. Brand queries

- **FACT — "techplay" on Bing** returned Microsoft pages, not TechPlay. The brand name is generic enough that "techplay" alone does not resolve to the site.
- **FACT — "techplay gta 6" on Bing** returned pages about Taiwan. The brand has no search identity yet.
- **FACT — Earlier in this session a Google search for "techplay.gg gaming"** returned techplay.gg pages (leaderboard, shop, home, roadmap, games database, two game pages, news). Google recognises the domain when it is typed in full.
- **RECOMMENDATION — Treat "TechPlay" as a brand to be built, not one to be found.** Use "TechPlay.gg" in titles of hub pages and social profiles until the plain name resolves.

## 4. Non-brand queries observed (Bing, 27 Sep 2026)

The GTA 6 rows come from the GTA 6 audit's 40 queries; the rest from the search audit's 74.

"Relevant" means Bing returned results about the query. Rows marked "degraded" returned generic pages and are listed only for completeness.

| Query | Relevant? | TechPlay? | Who ranked (first results) |
|---|---|---|---|
| crimson desert review | yes | no | IGN, PC Gamer, Metacritic, Game8, Game Rant, GameSpot, Digital Spy |
| world of warcraft midnight review | yes | no | IGN, PC Gamer, Metacritic, GameSpot, WoW forums |
| diablo 4 lord of hatred review | partly | no | Blizzard, Wikipedia, Steam, Fandom |
| windrose early access review | yes | no | Steam, official site, two fan wikis |
| gta 6 map | yes | no | map.stateofleonida.net, gtabase.com, exploregta6.com, gtasixmap.com, gtavimap.com |
| gta 6 characters | yes | no | gtabase.com, gtaintel.com, gta.fandom.com, gta6post.com, wikigtavi.com |
| gta 6 release date | yes | no | rockstargames.com, Wikipedia, tech-insider.org, xbox.com, beebom.com |
| gta 6 lucia caminos | yes | no | GTA Fandom, gtaboom.com, gtabase-style fan sites |
| gta 6 countdown | yes | no | gtasixcountdown.com, vicountdown.com, gta6-countdown.web.app, grandtheftcountdown.com |
| gta 6 pc requirements | yes | no | specvi.com, techbenchpro.com, gtavispot.com, pcgamebenchmark.com |
| gta 6 price | yes | no | Rockstar Store, beebom.com, gta6index.com, xbox.com, IGN |
| gta 6 online | yes | no | allthings.how, Polygon, Screen Rant, IGN, Forbes, Mirror |
| gta 6 switch 2 | yes | no | gtaboom.com, Vice, Game Rant, Dexerto, Notebookcheck |
| gta 6 trailer 3 | yes | no | YouTube, Netflix, gta6info.com, Forbes, beebom.com |
| gta 6 news | yes | no | gtabase.com, gtaboom.com, Wikipedia, Rockstar, aboutgta.com |
| sandrone genshin impact guide | yes | no | Genshin Wiki, Game8, Icy Veins (TechPlay has a Sandrone guide) |
| best open world games 2026 | yes | no | GamesRadar+, GameSpot, small list sites |
| best games of 2026 | yes | no | GameSpot, IGN, GamesRadar+, Esquire, Metacritic |
| pokemon games in order | yes | no | Pocket Tactics, IGN, Wikipedia, small list sites |
| backlog advisor | yes | no | Backloggd, then generic "backlog" definitions |
| elden ring | yes | no | Fextralife, Wikipedia, Steam, official, IGN guide, Fandom |
| the witcher 3 wild hunt | yes | no | official, Steam, Wikipedia, IGN, Fandom, Game8 |
| cyberpunk 2077 | yes | no | official, Wikipedia, Steam, Fandom, IGN |
| hollow knight silksong | yes | no | Steam, official, Wikipedia, wiki, MapGenie |
| red dead redemption 2 | yes | no | Rockstar, Steam, Wikipedia |
| stardew valley | yes | no | Stardew wiki, official, Steam |
| hades 2 | yes | no | Wikipedia, Steam, Hades wiki, IGN review |
| god of war ragnarok | yes | no | Steam, Wikipedia, IGN, Fandom, Epic |
| zelda breath of the wild | yes | no | Wikipedia, Zelda Dungeon, IGN, Zelda Wiki, Nintendo |
| minecraft game | yes | no | official, browser-game sites |
| nintendo games list | yes | no | Nintendo official, Wikipedia |
| minecraft 425 million copies sold | partly | no | official, wikis |
| quake champions no longer free to play | partly | no | Wikipedia, Steam, Bethesda |
| rayman legends retold trailer | partly | no | Wikipedia, fan wiki, Ubisoft, Steam |
| cs2 rush mode update chickens | degraded | no | generic CS2 pages |
| crimson desert system requirements | degraded | no | "Crimson" definitions |
| wow analyzer | degraded | no | Blizzard pages |
| game release calendar 2026 | degraded | no | browser-game portals |
| video game database | degraded | no | video sites |
| game backlog tracker | degraded | no | browser-game portals |

**OBSERVATION — Even TechPlay's own tool names do not return TechPlay.** "Backlog advisor" returns Backloggd first. "WoW analyzer" was degraded on Bing, so it is unverified there.

## 5. Game-page visibility

- **FACT — For 10 well-known titles checked on Bing, no TechPlay game page appeared.** Results are dominated by the official site, Steam, Wikipedia, dedicated wikis (Fextralife, Fandom, Game8) and IGN guides.
- **FACT — For obscure titles, Bing ignored the query.** Queries like "kaiju fishing game", "geriatric skeet shooting", "blades of time dismal swamp" and "simple 1500 series" returned unrelated pages. This says the titles are too ambiguous for Bing, not that TechPlay's pages are absent from its index.
- **FACT — Google News lists TechPlay game pages as if they were news.** The `site:techplay.gg` feed returns items such as "Medicopter 117: Jedes Leben zählt 4 (2004) - techplay.gg". The live audit (02) hypothesised that the `VideoGame` JSON-LD date is being read as a publication date.
- **FACT — The sampled game pages carry no TechPlay-written text.** Crimson Desert's description is one sentence; Elden Ring's is an encyclopedic summary; the GTA VI page's meta description is store pre-order copy ("Purchase prior to 19 November 2026 23:59:59 to receive…").

## 6. News visibility

- **FACT — Eligibility plumbing exists.** A news sitemap is published, robots.txt has a Googlebot-News group allowing `/news/`, `/guides/`, `/reviews/` and `/hardware/`, and articles carry `NewsArticle` with author `Person`, dates and `SpeakableSpecification`.
- **FACT — Outcome is zero.** For 16 recent topics TechPlay covered (Minecraft 425M copies, Control Resonant leak, GTA 6 $400 set, Xbox in-game ads patent, Diablo Lord of Hatred review, Crimson Desert review, and others), Google News returned up to 100 results each (751 in total) and none were TechPlay.
- **HYPOTHESIS — Being eligible is not the same as being selected.** Google News favours sources with an established track record, original reporting and topical authority. A site that publishes rewrites of stories 20 larger outlets already ran, two authors, and a 17-day crawl blackout in August has no signal that sets it apart.
- **UNKNOWN — Publisher Center status.** Whether TechPlay has a Google Publisher Center profile could not be checked.

## 7. Evergreen visibility

- **FACT — TechPlay has 4 guides and 38 reviews.** The evergreen surface is almost entirely the database.
- **FACT — Its one WoW guide targets a contested query with a thin title.** "Top World of Warcraft: Midnight addons to use in 2026" competes with Wowhead and Icy Veins, which own WoW search.
- **OBSERVATION — The least-defended evergreen areas are PC troubleshooting and structured "where can I play it" answers** (09, observed SERPs).

## 8. Content and topical-authority gaps

| Gap | Evidence | Who fills it now |
|---|---|---|
| Nothing ranks for GTA 6 despite a 1,200-entity hub | 19 relevant GTA 6 SERPs, no TechPlay | gtabase.com and dozens of exact-match fan domains |
| Reviews are invisible | Crimson Desert and WoW Midnight review SERPs | IGN, PC Gamer, GameSpot, Game Rant, Metacritic |
| No evergreen library | 4 guides | Wikis, Game8, Game Rant |
| Tool pages have no search identity | "backlog advisor", "wow analyzer" | Backloggd; Blizzard |
| Database pages add nothing to Steam/Wikipedia | 3 sampled pages with 0 original words | Steam, Wikipedia, Fandom |

## 9. The programmatic-SEO question: 295k thin game pages

**FACT — Google's scaled-content-abuse policy** describes generating many pages primarily to manipulate rankings, with little value to users, as spam, regardless of how the pages were made. TechPlay's game pages were built as a database, not to manipulate rankings, but they look to a crawler much like pages that were.

**OBSERVATION — Signals Google can see today:** hundreds of thousands of pages with store-sourced descriptions, identical layout, no reviews, no comments, and inconsistent numbers across the site (the live audit found "140,000+", "50K+" and "333,000" games in different places).

**Options (RECOMMENDATION, each with its cost):**

1. **Tighten `Game::indexable()`.** Today it only excludes descriptions under 50 characters. Requiring an original signal (a TechPlay review or news link, a reader rating, a shelf count, a completed "where to play" block) would cut the indexable set to thousands. Cost: fewer URLs in the index in the short term.
2. **Noindex the long tail, keep it crawlable.** Pages stay useful to members and link to each other but stop competing for crawl budget. Cost: long-tail search visits foregone until pages are enriched.
3. **Hub and spoke.** Make series, genre, platform and year hubs the indexable entry points with editorial copy, and link to games from them. The frontend audit found game pages render genres and platforms as plain text, so these links do not exist yet.
4. **Enrich by demand, not by alphabet.** Start with the top few hundred games by search interest and release timing (09 and 18), and the ~2,000 with any TechPlay signal.
5. **Fix the News misread.** Stop game pages from appearing in Google News by checking which date field it is reading (`VideoGame.datePublished` is the suspect).

## 10. Weak titles and intent mismatches (quoted)

| Page | Current `<title>` | Problem |
|---|---|---|
| Crimson Desert review | "Crimson Desert - review" | No score, platform or verdict; loses to "Crimson Desert Review - IGN" |
| GTA 6 collector's set news | "GTA 6 is getting a $400 Collector's Set which does not" | Truncated mid-sentence |
| Windows 11 hardware news | "Windows 11 is finally getting a more modern look" | No brand suffix; general tech, not gaming |
| GTA VI game page | "Grand Theft Auto VI (2026) \| TechPlay" with store pre-order text as description | Description is not ours and not useful |
| /games | "Video Game Database \| Search 140,000+ Titles & Specs" | Wrong number (333k) |
| Author pages | "Articles by X - TechPlay \| TechPlay" | Duplicated brand (01 Part A) |
| WoW Analyzer | "…Free Midnight Readiness Score…" | Tied to a launch that happened in March |
| Search | `/search` returns a noindex 404 | SearchAction in JSON-LD points to it |

## 11. Cannibalisation and duplication risks

- **FACT — `/latest` and `/news` both list the same articles**, each indexable with its own canonical. Low risk, since they target different intents.
- **FACT — GTA 6 has three competing homes**: the `/gta6` hub, `/games/grand-theft-auto-vi`, and `/games/gta-6` (a 2019 parody game that GTA 6 news is wrongly attached to). None links to the others.
- **FACT — `/calendar/[slug]` and `/games/[slug]` both describe upcoming games.** Canonical handling between them was not verified.
- **OBSERVATION — Genre, tag and platform facets overlap** (for example `/games/genre/rpg` empty while `/games/tag/open-world` populated).

## 12. Google Discover readiness

| Requirement (Google documentation) | TechPlay status |
|---|---|
| Large images at least 1200px wide | OG images exist; several are multi-MB PNGs (02); game OG images are hardcoded 1280×720 for portrait covers (01) |
| `max-image-preview:large` | Present on all sampled pages |
| Clear author and date | Present on articles |
| Titles that describe the content without clickbait | Mostly fine; some truncated |
| Timely, engaging content | ~3.5 news posts a day, mostly rewrites |
| No evidence of Discover traffic | UNKNOWN without Search Console |

## 13. Top search opportunities

1. **Recover crawl trust first.** Reduce the indexable set and fix News misreads before adding more URLs.
2. **Template families on the top few hundred games**: "where to play", release time, file size, requirements, crossplay, "games like" (09).
3. **PC troubleshooting hub** where page one has no gaming outlet (09: EA-001, EA-002, EA-004).
4. **GTA 6 data pages that fan sites do not have**, rather than another news stream (17).
5. **Fix the SearchAction, breadcrumbs, titles and the GTA page split.** Cheap and provable.
6. **Give tool pages their own search identity** by naming them after the query users type ("what should I play next", "WoW character checker").

## Sources used

- `docs/README.md` §12 (measured 7 Sep 2026).
- techplay.gg pages fetched 27 Sep 2026: home, backlog-advisor, games/crimson-desert, games/elden-ring, games/grand-theft-auto-vi, games/00, gta6/vehicles, a WoW guide, a hardware article, a news article, a review, latest, wow-analyzer, search, sitemap.xml and children, robots.txt.
- Bing results pages for 74 queries, fetched 27 Sep 2026 (`bing.com/search?q=…`).
- Google News RSS searches (`news.google.com/rss/search?q=…`) for `site:techplay.gg` with 30-day, 90-day and 1-year windows, and for 16 recent TechPlay topics.
- Google Search Central: scaled content abuse policy; Discover documentation (see 22).

## Gaps / needs more data

- Search Console and Bing Webmaster data: impressions, queries, index coverage reasons, crawl stats.
- Google rankings for most queries; Bing is a weak proxy.
- Whether Google Publisher Center has a TechPlay profile.
- Backlink profile: no referring-domain data was available.
- Whether the post-20 Sep consent change altered any measured traffic.
