# 22 — Sources

Status: Phase 1 research draft — 27 Sep 2026
The complete log is **`research-sources.csv`** in this folder: 1315 unique URLs, each with source name, date accessed (27 Sep 2026), the claim or use it supports, the research file(s) that rely on it, and how it was obtained. This page summarises it and lists the primary sources that carry the most weight.

## How the log was built

- **Agent logs.** Five research agents wrote source CSVs as they worked (live site, market, community, evergreen B, paid media).
- **Canonical URLs of every page fetched.** About 1,560 saved pages were scanned and the canonical URL recorded inside each page was logged. Pages that returned a Cloudflare challenge, a 404 or an empty shell are excluded.
- **Row-level sources** from the evergreen and game-hub CSVs.
- **URLs cited inline** in the finished research files.
- **Headlines** from 20 outlets' RSS feeds that were used in the trend analysis (06).

Search-results pages (Bing, Google News RSS) are logged because they are the evidence for "who ranks" statements. Repository files are cited by path inside each research file and are not repeated here. `docs/README.md` (measured 7 Sep 2026) is the source for all production numbers.

## Counts

| Access method | URLs |
|---|---|
| fetched or search result (agent log) | 514 |
| fetched (canonical URL recorded in page) | 377 |
| RSS feed item | 217 |
| cited in research file | 166 |
| agent log (evergreen row source) | 40 |
| cited in hub CSV | 1 |

| Research file | URLs relied on |
|---|---|
| 02 | 98 |
| 03 | 55 |
| 04 | 194 |
| 05 | 129 |
| 06 | 248 |
| 07 | 65 |
| 08 | 47 |
| 09 | 219 |
| 10 | 14 |
| 11 | 30 |
| 12 | 54 |
| 13 | 112 |
| 14 | 121 |
| 15 | 66 |
| 16 | 60 |
| 17 | 48 |
| 18 | 39 |
| 19 | 12 |

| Most-used domains | URLs |
|---|---|
| en.wikipedia.org | 138 |
| techplay.gg | 127 |
| bing.com | 47 |
| eurogamer.net | 47 |
| discord.com | 33 |
| rockpapershotgun.com | 33 |
| ign.com | 31 |
| gamesindustry.biz | 31 |
| gamesradar.com | 30 |
| purexbox.com | 26 |
| pcgamer.com | 23 |
| nintendolife.com | 22 |
| pushsquare.com | 22 |
| gamerant.com | 21 |
| kotaku.com | 20 |
| gamespot.com | 17 |
| support.discord.com | 16 |
| dexerto.com | 15 |
| tomshardware.com | 15 |
| youtube.com | 13 |
| gameinformer.com | 13 |
| thegamer.com | 13 |
| polygon.com | 12 |
| wccftech.com | 12 |
| developers.google.com | 11 |

## Primary sources that carry the most weight

### Platform and search documentation
| Source | URL | Supports |
|---|---|---|
| Google Search Central Blog, February 2026 Discover core update (5 Feb 2026) | https://developers.google.com/search/blog/2026/02/discover-core-update | Discover rewards topic expertise, original and local content (07, 08) |
| Google, Get on Discover | https://developers.google.com/search/docs/appearance/google-discover | Image specs, clickbait guidance, Follow via RSS (07) |
| Google, optimizing for generative AI in Search (15 May 2026) | https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing | "Non-commodity content" (08) |
| Google, site reputation policy update (28 Aug 2026) | https://developers.google.com/search/blog/2026/08/update-site-reputation-policy | EEA enforcement change (08) |
| Google, creating helpful content | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | Content quality (08) |
| Google, News sitemap | https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap | Two-day window, 1,000 entries (07) |
| Publisher Center, News content across Google | https://support.google.com/news/publisher-center/answer/9607025?hl=en | Automatic News eligibility (07) |
| Search Engine Roundtable, September 2026 spam update | https://www.seroundtable.com/google-september-2026-spam-update-42163.html | Update in progress (07, 08) |
| Chromium Blog, quieter notification permission UI | https://blog.chromium.org/2020/01/introducing-quieter-permission-ui-for.html | Push opt-in limits (07, 12) |
| WebKit, Web Push for iOS web apps | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ | Home Screen only (07) |
| Reddit Rules | https://redditinc.com/policies/reddit-rules | Authentic participation (07) |
| Discord help centre (Discovery, Onboarding, Events, Insights) | https://support.discord.com/hc/en-us/articles/360030843331-Enabling-Server-Discovery | Thresholds and features (13) |
| Discord API invite lookups | https://discord.com/api/v10/invites/wPQG9gUMXH?with_counts=true | TechPlay 160 members; dead invites (13) |
| Steamworks upcoming events | https://partner.steamgames.com/doc/marketing/upcoming_events | Steam sale and fest dates (05) |
| Steam Web API terms | Steam Community Web API Terms of Use | 100,000 calls a day (10) |
| IGDB API documentation | IGDB API docs | Free for non-commercial use; 4 requests/s (10) |
| X open-source For You algorithm (README) | URL not logged | Ranking by predicted actions (07) |

### Market and release facts
| Source | URL | Supports |
|---|---|---|
| Rockstar Newswire, GTA VI on 19 Nov 2026 | https://www.rockstargames.com/newswire/article/ak3ak31a49a221/grand-theft-auto-vi-is-now-set-to-launch-november-19-2026 | Release date (05, 17) |
| IGN, GTA 6 price confirmed (24 Jun 2026) | https://www.ign.com/articles/gta-6-price-finally-confirmed-features-a-single-player-experience-at-launch | $79.99 / $99.99, single-player (17) |
| Wikipedia, List of video games released in 2026 and 2027 | https://en.wikipedia.org/wiki/List_of_video_games_released_in_2026 | Q4 2026 and Q1 2027 dates (05) |
| Game Informer, State of Play and Nintendo Direct round-ups (Sep 2026) | https://gameinformer.com/state-of-play/2026/09/03/everything-announced-at-the-september-2026-playstation-state-of-play | Announcements (05) |
| Xbox Wire, Tokyo Game Show 2026 recap | https://news.xbox.com/en-us/2026/09/17/xbox-tokyo-game-show-2026-recap/ | Dates (05) |
| Steam charts API and popular-wishlist search | https://store.steampowered.com/search/?filter=popularwishlist | Momentum (05, 06) |
| The Game Awards | https://thegameawards.com/ | 10 Dec 2026 (05) |

### Media industry
| Source | URL | Supports |
|---|---|---|
| PPC Land on Future plc H1 2026 (14 May 2026) | https://ppc.land/future-plcs-google-problem-profit-falls-67-as-search-traffic-shrinks/ | Profit −67%, Google traffic −20% (04) |
| Aftermath, IGN layoffs (14 Sep 2026) | https://aftermath.site/ign-layoffs-altano-macy/ | Media contraction (04) |
| VGC, Eurogamer cuts (26 Feb 2026) | https://www.videogameschronicle.com/news/games-media-set-for-more-layoffs-as-ign-owned-eurogamer-cuts-editorial-staff/ | Media contraction (04) |
| Game Developer, Polygon sold to Valnet (2 May 2025) | https://www.gamedeveloper.com/business/polygon-sold-to-valnet-many-staff-laid-off | Ownership (04) |

## Reliability notes

- **Wikipedia** is used for dates and facts it cites to publishers; where a date matters for planning, the publisher page should be re-checked closer to the event.
- **Low-authority sources** are flagged in the files where they are used (for example a PS Plus price change and a layoff count in 05).
- **Search-results pages** (Bing) were sometimes degraded; only query-relevant pages are used as evidence (03).
- **Blocked sites** (Cloudflare challenges, JS-only pages) are listed in each file's Gaps section; no claims are made from them.

## Gaps / needs more data

- Some agents did not log sources before they were stopped; their fetched pages are captured by canonical URL instead, which records that a page was read but not always which sentence was used.
- The PR agent's own source CSV was not saved; its sources are listed inline in 14 and captured here from that list.
