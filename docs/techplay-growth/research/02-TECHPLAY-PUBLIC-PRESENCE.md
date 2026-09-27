# 02 — TechPlay public presence: live-site audit and social footprint

Status: Phase 1 research draft — 27 Sep 2026
Agent: live-site. Method: 90+ pages of techplay.gg fetched with curl (Chrome UA) between 19:50 and 21:30 UTC on 27 Sep 2026, raw HTML saved and parsed (`<head>`, JSON-LD, headings, links, forms, buttons); profile URLs the site itself links were fetched directly; Google News RSS, Discord invite API, Bluesky API and TikTok were queried directly. The session's WebSearch budget was exhausted by other agents before this one ran, so **no web search was performed** — everything below is from direct fetches. Labels: FACT / OBSERVATION / ESTIMATE / HYPOTHESIS / RECOMMENDATION.

## Executive summary

1. FACT — The public site is technically healthy: every page requested returned 200 except `/videos` (404, no longer a section), all key pages carry `index, follow`, canonical tags, Organization + WebSite JSON-LD, and article pages carry `NewsArticle`/`Article` JSON-LD with author and dates. No `X-Robots-Tag` headers, no Cloudflare challenge on any fetch.
2. FACT — Brand positioning is split three ways on the same site: the `<title>`/H1 sell "One library for everything you play" (library product), the About page says "Everyone writes about games. We also keep the record of yours", while the register page, footer, RSS description ("Your daily dose of tech and gaming news"), PWA manifest and YouTube/X bios sell a gaming-news publication ("Built by gamers, for gamers… We test hardware until it breaks"). A first-time visitor lands on a product pitch, but 95% of what is actually published is news.
3. FACT — Social proof on the site is either empty or false. The register page says **"15K+ MEMBERS · 50K+ GAMES"**; the database has 60 users and 333k games (docs/README.md, 7 Sep 2026). The WoW Analyzer says **"50K+ players analyzed · 4.9/5 rating"** (unverifiable, no rating mechanism visible). Meanwhile the forum publicly shows "0 Online 0 Threads 0 Replies 0 Members", the leaderboard "Nobody has moved yet this week", giveaways "No draws have been settled yet", the shop "0 PRODUCTS", every sampled article "Discussion (0)", and the guides "HELPFUL: 0".
4. FACT — Content cadence is real but narrow: the last 20 news items span 22–27 Sep (≈3.3/day, 2 authors write ~95% of them); reviews stopped on 8 Jul 2026 (38 total); there are 4 guides in total; "Hardware" holds 67 items that are mostly general tech news (AI, WhatsApp, iPhone), not hardware reviews, although its `<title>` promises "GPU, CPU & PC Component Benchmarks".
5. FACT — Internal linking inside article bodies is essentially zero: across 6 sampled articles (news, reviews, tech) there were **no contextual links in the body text**, and 0–1 external source links. Every article's category breadcrumb links to a 404 (`/news/news-industry`, `/news/news-gaming`, `/news/tech-tech-news`) while the real category pages live at `/news/industry`, `/news/gaming`. GTA 6 news links to `/games/gta-6`, which is a 2019 stickman parody game, not `/games/grand-theft-auto-vi`.
6. FACT — The RSS feed (`/rss`, `/feed`) links hardware items to `/tech/<slug>`, which returns 404 (the working path is `/hardware/<slug>`), and the feed was ~24 h behind the sitemap at fetch time (latest item 26 Sep 20:15 while four articles were published on 27 Sep).
7. FACT — Social footprint measured directly: Discord **160 members / 24 online**; YouTube **20 subscribers, joined 9 Feb 2026, no videos found in the channel's video page HTML**; X `@TechplayGG` exists (follower count not exposed without JS); Facebook `techplaygg` and Instagram `techplay.gg` are linked from the footer but sit behind login walls (counts UNVERIFIED); TikTok (`@techplay.gg`, `@techplaygg`), Bluesky and LinkedIn: **no account found**. Google News RSS `site:techplay.gg` returns 100 items, 99 of which are game-database pages dated by the game's release year (1982–2026) and only 1 is an article — a sign that the `VideoGame.datePublished` in JSON-LD is being read as publication date.
8. FACT — Conversion path: registration is username/email/password + Cloudflare Turnstile, or Google/Discord/Battle.net OAuth; the only newsletter signups are a bare "Stay in the loop — The bigger stories, sent when there is something worth sending" box on listing sidebars and a "Join the Crew" box on the GTA 6 hub. There is no newsletter, register or Discord CTA inside article bodies, no exit/scroll prompt, and no return-visit hook on articles besides "Add TechPlay.gg as a preferred source on Google".
9. OBSERVATION — The hubs with genuine landing-page potential (GTA 6 hub with 1,058 map pins, 12 character pages, vehicles, weapons, FAQ; release calendar with 1,422 September releases; genre/platform/year hubs with CollectionPage JSON-LD; 31,970 studio pages) are under-linked from the homepage SSR HTML (no server-rendered link to `/gta6`, `/guides`, `/hardware`, `/leaderboard`, `/wow-analyzer`), carry 2–2.5 MB PNG OG images, and several render their headline numbers as "0" or "–" server-side.
10. RECOMMENDATION (summary) — Twenty fixes are listed at the end; the five with the best effort/impact ratio are: remove the false "15K+ members" and "50K+ analyzed" claims; fix the article breadcrumb 404s and the RSS `/tech/` path; add 3–5 contextual internal links per article via the existing game/entity linking; put one consistent CTA block (Discord + newsletter + "connect Steam") under every article; and re-point the GTA 6 news relation from `/games/gta-6` to `/games/grand-theft-auto-vi`.

---

## 1. Fetch log — status codes, headers, page weight

### 1.1 Status codes (FACT, all fetched 27 Sep 2026)

| URL | HTTP | HTML bytes | Notes |
|---|---|---|---|
| `/` | 200 | 169,819 | `x-nextjs-cache: HIT`, `cache-control: s-maxage=60, stale-while-revalidate=31535940` |
| `/news`, `/news/page/2`, `/news/page/3` | 200 | 138k / 129k / 130k | pagination indexable, canonical per page |
| `/reviews`, `/guides`, `/hardware` | 200 | 146k / 89k / 138k | |
| `/videos` | **404** | 66k | listed in CLAUDE.md as a section; 404 page ("This area isn't in the build") has **two conflicting robots metas**: `noindex` and `index, follow` |
| `/games`, `/games/cyberpunk-2077`, `/games/elden-ring` | 200 | 88k / 318k / 283k | game pages are 3–4× heavier than articles |
| `/games/genre/action`, `/games/platform/pc`, `/games/genre/rpg` | 200 | 143k / 144k / 80k | RPG hub SSR shows empty "Top Rated" |
| `/calendar` | 200 | **441,188** | heaviest page fetched |
| `/studios`, `/studios/activision` | 200 | 136k / **371,587** | |
| `/forum`, `/leaderboard`, `/lists`, `/giveaways`, `/shop` | 200 | 72k / 72k / 65k / 67k / 61k | all render empty states |
| `/gta6`, `/gta6/vehicles`, `/gta6/characters`, `/gta6/map`, `/gta6/weapons`, `/gta6/everything-we-know` | 200 | 129k / 209k / 90k / 84k / 112k / 107k | |
| `/wow-analyzer`, `/backlog-advisor`, `/tools`, `/last-disc`, `/last-disc/letter`, `/frontiers` | 200 | | |
| `/about`, `/roadmap`, `/rating-system`, `/marketing`, `/support`, `/contact`, `/impressum`, `/privacy`, `/terms`, `/cookies` | 200 | | |
| `/register`, `/login` | 200 | 72k / 59k | `noindex, nofollow` (also disallowed in robots.txt) |
| `/profile/me`, `/profile/adi`, `/messages`, `/friends` | 200 | ~60k | empty shells for logged-out visitors; `/profile/me` is `noindex` |
| `/author/adi-zeljkovic`, `/author/nenad-divljakovic`, `/author/adi` | 200 | ~80k | `/author/adi` is a **second URL for the same person** and is the one used in review/guide JSON-LD |
| `/rss`, `/feed` | 200 | 29k | RSS 2.0, 44 items |
| `/sitemap.xml` + 16 sub-sitemaps | 200 | | see §1.3 |
| `/robots.txt`, `/manifest.json` | 200 | | |
| `https://help.techplay.gg/` | 200 | 171k | separate hostname, same footer |
| `/news/news-industry`, `/news/news-gaming`, `/news/tech-tech-news` | **404** | 27k | these are the category links every article's breadcrumb uses |
| `/tech/ais-growing-energy-demand-puts-power-grids-to-the-test` | **404** | | the URL the RSS feed publishes for hardware items |
| `/advertise`, `/newsletter`, `/discover`, `/my-games`, `/search?q=`, `/opinions`, `/series`, `/giveaways/1`, `/u/adi`, `/chat` | 404 | | guessed URLs, listed only to show the 404 page works and is styled |

### 1.2 Headers (FACT)

- Served through Cloudflare (`server: cloudflare`, `cf-cache-status: EXPIRED` on HTML), HTTP/2, HSTS with `includeSubDomains`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a long CSP that whitelists GTM, GA, Facebook Pixel, AdSense, Funding Choices (Google CMP), Cloudflare Turnstile, Wowhead tooltips, YouTube/X/Instagram embeds and `glitchtip.techplay.gg` (error reporting).
- **No `X-Robots-Tag` on any response.** Robots directives are only in `<meta>`.
- Homepage: `cache-control: s-maxage=60, stale-while-revalidate=31535940`, `x-nextjs-prerender: 1`, `x-nextjs-stale-time: 300` — ISR is working. Game pages: `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` — game pages are **not** CDN-cacheable (consistent with 0.7–0.9 s TTFB measured from the container; OBSERVATION, single sample, not a benchmark).
- `link: <https://api-beta.techplay.gg>; rel=preconnect` and four preloaded woff2 fonts on every page.

### 1.3 Sitemaps and robots (FACT)

- `sitemap.xml` indexes 16 maps: pages, articles (683 URLs), categories (14), hub (genre/platform/year), guides (4), lists (**2 URLs**, one by `deleted_user_95`), series (4,181), news (7 URLs in the 48-hour window), images (678), games-1…6 (49,997 URLs in games-1 alone, 9.2 MB), studios (31,970 URLs, 6.1 MB).
- `lastmod` on `sitemap-articles`/`sitemap-news`/`sitemap-images` was 27 Sep 20:35 (+02:00) — updated on publish, as CLAUDE.md describes.
- robots.txt allows everything except `/api/`, `/admin/`, `/_next/data/`, `/*?_rsc=`, `/login`, `/register`; names Googlebot-News with `Allow: /news/ /guides/ /reviews/ /hardware/`; explicitly allows GPTBot, ChatGPT-User, anthropic-ai, ClaudeBot, PerplexityBot, cohere-ai; disallows `meta-externalagent` and `Amazonbot`.
- OBSERVATION — `sitemap-pages.xml` includes `/gta6/weapons` and 12 `/gta6/characters/<slug>` pages, but **not** `/leaderboard`, `/giveaways` (noindex anyway), `/studios` (has its own map) or `/latest`.

### 1.4 Page weight (FACT, measured)

- Homepage HTML 170 KB; 21 JS chunks totalling **1.42 MB uncompressed / ≈440 KB compressed**; 20 `<img>` tags, all article/review covers requested through `/_next/image` at `w=1920&q=75` in `src` — the hero at 1920 px weighs 85 KB (JPEG) and the same image at `w=640` is 32 KB (WebP). `sizes` attributes are present (`(max-width: 1024px) 100vw, 45vw` etc.), so browsers that honour `srcset` will pick smaller candidates; the count of `srcset=` attributes in the SSR HTML was 0 on the homepage, so this deserves a check in a real browser (OBSERVATION).
- Article hero (`Epic Games…`) at `w=1920&q=90`: 29.6 KB. Original JPEG on api-beta: 166 KB for a homepage cover (Next is doing its job).
- **OG images are heavy**: homepage OG PNG 880 KB (965×541); `/gta6/og-hub.png` **1.99 MB**; `/WoW Analyzer.png` (with a literal space in the filename) **2.55 MB**. Facebook/LinkedIn scrapers cap around 8 MB but X/Discord previews and WhatsApp are much less tolerant of multi-MB PNGs; these should be ≤300 KB JPEG/WebP at 1200×630 (RECOMMENDATION).
- `/calendar` HTML is 441 KB with 75 images and 164 links — it server-renders the whole month.

---

## 2. Messaging and brand positioning

### 2.1 What the pages actually say (FACT, quoted verbatim)

| Surface | Copy |
|---|---|
| `<title>` homepage | **TechPlay — One Game Library for PC, PlayStation & Xbox** |
| Homepage eyebrow + H1 | "Gaming, on the record" / **"One library for everything you play."** |
| Homepage sub-copy | "Connect Steam, PlayStation and Xbox and your games arrive on their own — with the hours you put in. Add anything else by hand. Then TechPlay reads it back: your taste, your year, and what to play tonight." |
| Homepage stats strip | "3 Platforms in one place · 333,000 Games in the catalogue · Free To keep a library" |
| Meta description | "Connect Steam, PlayStation and Xbox: every game you own in one library, with the hours you played, and a straight answer on what to play tonight." |
| OG title | "TechPlay — one library for everything you play" |
| About H1 | **"Everyone writes about games. We also keep the record of yours."** |
| About body | "TechPlay is a gaming and hardware publication with a games database underneath it and a library on top. Six of us write here. There is no publisher behind us… The publishing has been running since 2021." / "We are not the biggest gaming site. That is not the ambition. The ambition is to be the one that knows what you play — and to be wrong about it out loud when we are." |
| Footer (every page) | "Your home for gaming news, honest reviews, release dates, and a community that actually cares about games." |
| RSS `<description>` | "Your daily dose of tech and gaming news." |
| PWA manifest | "Your source for gaming news, reviews, hardware analysis, and community discussions" |
| Register page | "NEW PLAYER · START NEW GAME · Create your player profile and unlock everything TechPlay has to offer" |
| YouTube / X bio | "Built by gamers, for gamers. At TechPlay, we only care about one thing: Is it actually worth your money? We don't copy-paste press releases, and we don't do sponsored hot takes. We test hardware until it breaks and play games until 4 AM…" |
| Marketing page | "TechPlay isn't just another content farm. We're a community-driven hub where gamers come for deep dives, honest reviews, and tech analysis." / "Balkans-founded, US and EU audience" |
| 404 page | "Signal lost · Error 404 · This area isn't in the build" |

### 2.2 Assessment

- OBSERVATION — The homepage is a **product landing page for the library feature**; the first fold has no news at all. News, reviews and the "TechPlay Reviews" rail come after "Featured Opinions", four quick-link cards and a "Discover Games" tab strip. Yet 577 of the 686 published pieces are news (84%), and the cadence that makes the site look alive is news. Visitors arriving from a news link (the only kind of link the site currently earns) see a homepage that does not resemble the page they came from.
- OBSERVATION — The About page copy ("the catalogue is the ground, the library is built on it, and the profile is a reading of the library") is the clearest articulation of the differentiator anywhere on the web for this brand, and it is written well. It is not echoed on the pages that get traffic (articles). The article template has no "what TechPlay is" block.
- FACT — Numbers disagree on the same site: homepage "333,000 games"; About "333,920 Games catalogued · 57,630 Studios · 679 Pieces published · 5 Platforms"; `/games` `<title>` "Search **140,000+** Titles & Specs"; `/guides`, `/reviews`, `/hardware`, `/rating-system`, `/cookies` meta descriptions all say "140,000+ game database"; register page "**50K+ GAMES**"; `/studios` "31,970 studios" (About says 57,630 — the difference is presumably studios with ≥1 indexable game vs total rows, but nothing on the page says so); homepage "3 platforms" vs About "5 platforms" (Steam, Xbox, PlayStation, GOG, Epic). The register page's "50K+" is a 6.7× understatement and the SEO titles a 2.4× understatement of the actual 333k.
- HYPOTHESIS — The 140,000 figure is a relic from before the 20–21 Aug 2026 IGDB import (CLAUDE.md: the import "roughly doubled the catalogue") and the 50K figure from before the 08/2026 rebuild. Neither was updated because they are hard-coded in page metadata rather than read from the database.
- RECOMMENDATION — Pick one tagline family and one set of numbers, source the numbers from the API (the About page already does this) and use them in `<title>`s, the register page and the marketing page. Given that the earned audience is news readers, the homepage first fold should carry today's news alongside — not instead of — the library pitch; the About page's "publication with a database underneath" framing does this in one sentence.

---

## 3. Calls to action — exact copy and placement (FACT unless noted)

| Location | CTA copy | Target |
|---|---|---|
| Header, every page | "Sign In" · **"Join TechPlay"** | `/login`, `/register` |
| Homepage hero | **"Start your library"** (primary) · "Browse the catalogue" (secondary) | `/register`, `/games` |
| Homepage quick-links | "Browse games" · "See what's next" · **"Open your library"** · "See the boards" | `/games`, `/calendar`, `/login`, `/forum` |
| Homepage bottom block "What an account is for — The record builds itself." | four benefit rows, then **"Start your library"** + "Free, and no card · Already have an account?" | `/register` |
| Homepage/footer | **"Join our Discord — Talk games with the community"** | `discord.gg/wPQG9gUMXH` |
| Article sidebar | "Community · Discord · TechPlay Official server · News the moment it publishes · Giveaway pings before they close · Squads, LFG and the editors · **Join Discord**" | Discord |
| Article end | "**Add TechPlay.gg as a preferred source on Google** — See more of our gaming news, reviews and guides when you search for the latest gaming topics." / "Stay Connected" / "Follow Us" (Facebook, YouTube, Discord icons) | Google preferred-sources, socials |
| Article end | "The Author … **View Author Page →**" | `/author/<slug>` |
| Article sidebar "About this game" | "**Full game page**" (e.g. Fortnite 2020 7.7) | `/games/<slug>` |
| Listing sidebars (`/news`, `/reviews`, `/hardware`, `/guides`) | "**Stay in the loop** — The bigger stories, sent when there is something worth sending." + email + "Subscribe" | newsletter |
| Game page | "**Add to Collection**" · "Sign in to rate this game" · "Where to get it: Steam Amazon GOG Microsoft Store Epic Games Store PlayStation Store" | login / stores |
| Unreleased game page | "**Remind me about Grand Theft Auto VI**" | login |
| Calendar | "Wishlist" (per game) · "0 Sign in to track" | login |
| GTA 6 hub | "**Pre-order Now**" · "Watch Trailer" · "Don't miss a single GTA 6 drop — Join thousands of fans and get the latest news, leaks and updates — straight to your inbox. **Join the Crew** — or join our Discord community" | pre-order (target UNVERIFIED — no `href` found in SSR; likely JS), newsletter, Discord |
| WoW Analyzer | "**Analyze my character** ⚡ Takes 5 seconds • No account required • 100% free" | in-page form |
| Last Disc | "**Sign the open letter**" · "Argue it out on the forum — Join the discussion" · "Share this campaign" | form, forum |
| Forum (logged out) | "Join the community — Log in to post, earn XP, and climb the ranks. Log in / Register" | |
| Roadmap | "Stay updated on our journey … **Join TechPlay**" | `/register` |
| Support | tiers "TechPlay Fan 4.99 €/month · Super Fan 9.99 € · TechPlay Legend 19.99 €" (no button text captured — OBSERVATION: SSR shows tiers, no purchase control) | |
| Marketing | "[email protected] — Agency? Ask for our agency rate card." | email (obfuscated by Cloudflare) |

Assessment:
- OBSERVATION — CTAs are consistent in tone but **all account-centric**. There is no low-commitment CTA in the article body (follow on X, get the RSS, join Discord) until the reader scrolls past the author box; the newsletter box is on listing pages, where readers spend the least time, and not on articles, where they spend the most.
- OBSERVATION — "Add TechPlay.gg as a preferred source on Google" is the only return-visit mechanic on articles. It is a good idea but it is positioned before "Stay Connected" and is not explained (no screenshot/instructions), and it only works for readers signed into Google.
- FACT — The GTA 6 hub's "Pre-order Now" appears before any TechPlay CTA and carries no affiliate disclosure text in the SSR HTML.

---

## 4. Content discovery, navigation and internal linking

### 4.1 Navigation (FACT)

- Header items: **Discover · Feed · Games · Studios · Community · Tools · Shop** + Sign In / Join TechPlay. Mobile bottom bar: Home · Feed · Sign in · Games · Forum.
- The SSR HTML of the homepage contains links to `/games` (×6), `/forum` (×3), `/shop` (×2), `/news`, `/latest`, `/calendar`, `/reviews`, `/tools`, `/studios` — **but no server-rendered link to `/guides`, `/hardware`, `/gta6`, `/wow-analyzer`, `/backlog-advisor`, `/leaderboard`, `/lists`, `/giveaways`, `/last-disc` or `/calendar` beyond the quick-link card**. The Discover/Community/Tools dropdown contents are rendered client-side (OBSERVATION; only 59 `<a>` on the homepage HTML, 35 unique internal).
- Every page carries the same footer: About Us · Help Centre · Contact · Advertise With Us · Our Rating System · Roadmap · Shop · Support Us · Privacy · Terms · Cookies · Impressum · RSS · "Made by Luminor Solutions" (external link to luminor.agency) and social icons Facebook · Instagram · YouTube plus the Discord card.
- "Shop" occupies a top-level nav slot and shows **"0 PRODUCTS"**.

### 4.2 Article template — links per page (FACT, measured inside `<article>`)

| Article | Body words (ESTIMATE, chrome stripped) | Links in `<article>` | Contextual links in body text | External source links |
|---|---|---|---|---|
| Epic Games €100M Fortnite claim (news, 26 Sep) | ≈650 | 17 (breadcrumb ×3, author ×5, game ×2, calendar, socials ×3) | **0** | 0 (SMC, ACM, Epic statement all unlinked) |
| Marvel's Wolverine GPS aids (news, 27 Sep) | ≈300 | 17 | **0** | 0 |
| Tim Schafer "Someone got greedy" (news, 24 Sep) | ≈700 | 15 | **0** | 0 ("In an extensive interview with BBC News ," — the source is named but not linked) |
| GTA 6 $400 Collector's Set (news, 25 Sep) | ≈330 | 18 | **0** | 1 (Rockstar Newswire) |
| Assassin's Creed Black Flag Resynced (review, 8 Jul) | ≈1,150 | 16 | **0** | 0 |
| Crimson Desert (review, 4 Apr) | ≈2,350 | 16 | **0** | 0 |
| AI's growing energy demand (tech, 26 Sep) | ≈1,000 | 15 | **0** | 0 |
| Top WoW Midnight addons (guide, 5 Mar, updated 27 Aug) | ≈1,900 | 42 (includes footer inside `<article>`) | not measurable from SSR; addon names are not links to CurseForge/Wago | 0 |

- FACT — The only game-entity link per article comes from the sidebar "About this game" card (e.g. Fortnite → `/games/fortnite-2`, Wolverine → `/games/wolverine-2022`, GTA 6 → `/games/gta-6`).
- FACT — **The breadcrumb category link on every article is a 404**: `News › Industry` links to `/news/news-industry`, `News › Gaming` to `/news/news-gaming`, `News › Tech News` to `/news/tech-tech-news`. The sitemap and the working pages use `/news/industry`, `/news/gaming`, `/hardware/news`. Reviews link the category to `/reviews` (works).
- FACT — **GTA 6 articles are attached to the wrong game.** `/games/gta-6` is "GTA 6 (2019) · Racing / Driving · PC Windows · 'GTA 6 is an unofficial sequel to Grand Theft Auto V with a humorous tone. You play as a black stickman.'" — and its "News & reviews" block lists five real GTA VI articles. The real entry is `/games/grand-theft-auto-vi` (releases 19 Nov 2026, "Remind me" button). The GTA 6 hub itself links neither.
- FACT — No "Related articles" / "Read next" module exists on the article page. The sidebar has "Popular now" (empty in SSR) and "Upcoming releases › Full calendar" (empty in SSR). Related content is therefore 0 articles for a crawler and for a reader on a slow connection.
- FACT — Reviews link the author to `/author/adi` while news links `/author/adi-zeljkovic`; both resolve, so the Person entity is split across two URLs (the JSON-LD `author.url` differs by content type).
- OBSERVATION — Listing pages show ~13 cards per page with excerpt, author and relative date; the sidebar has "Most read — Not enough reading yet to rank anything" and "Coming out — Nothing dated in the window yet", i.e. two empty modules visible to every visitor of `/news`.

### 4.3 Game pages — how much is "ours" (FACT, 3 samples + GTA VI)

| Page | Total words (SSR) | Description source | TechPlay-authored text | Contradictions |
|---|---|---|---|---|
| `/games/cyberpunk-2077` | 956 | long IGDB/store description (~560 words, "The player portrays V…") | 0 sentences; 3 linked TechPlay news items (Jul/Apr/Mar 2026) is the only original signal | "Reader score 8.1 / 10 · 106 votes · 76 OpenCritic · 86 Metacritic" at the top and "**Nobody has rated this yet**" lower down; "How long to beat · 21 players" |
| `/games/elden-ring` | 840 | IGDB | 0 | OG image `cdn.mobygames.com/…webp` although MobyGames "was retired in the 08/2026 catalogue rebuild" (CLAUDE.md) |
| `/games/animal-company` | 375 | one 60-word store blurb | 0 | "Reader score 9.7 / 10 · 74 votes" vs "Nobody has rated this yet"; "You might also like: 10.0 PokéOne · 10.0 Saints Row IV: Super Dangerous Wad Wad Edition · 9.9 Baldur's Gate 3: Digital Deluxe Edition · 9.9 Pixadom" |
| `/games/baldurs-gate-3-digital-deluxe-edition` | 458 | store text for a DLC upgrade ("unique custom dice skin") | 0 | this DLC edition is what `/games` shows as a 9.9-rated top game |
| `/games/grand-theft-auto-vi` | 609 | meta description is a pre-order blurb: "Purchase prior to 19 November 2026 23:59:59 to receive: -The Vintage Vice City Pack -One Month of GTA+…" | 0 | |

- OBSERVATION — What the game page does well: structured facts (developer, publisher, series, age ratings, "Standing: Top 1% by 24hr peak players"), 20-language table, store links, gallery of 19 screenshots, editions/expansions, "Also known as" — genuinely richer than a typical aggregator. What it lacks: a single sentence written by TechPlay, any linked review even where one exists on the site, and a trustworthy score (the "Reader score" appears to be an imported aggregate presented as if from readers).
- OBSERVATION — `/games` (the database landing) is 167 words: a grid of 24 covers with **no text, no filters and no explanation of what the database is**; the tiles are dominated by fusion/fan games and DLC editions (Pokémon Infinite Fusion, PokéOne, Saints Row IV Wad Wad Edition) because the sort is by an imported rating.
- FACT — `/games/genre/rpg` renders "Top Rated" with no games (SSR), while `/games/genre/action` and `/games/platform/pc` render 30+ Nintendo/Sony first-party titles ranked 9.0–9.4.
- FACT — Footer of game pages: "Game and studio data from IGDB, with release information from Steam, PlayStation, Xbox and Nintendo." — the attribution is correct for the text, but OG images still point at `cdn.mobygames.com` for older titles.

### 4.4 Hubs as landing pages (FACT + OBSERVATION)

- **GTA 6 hub** (`/gta6`): `<title>` "GTA 6 — Interactive Map, Characters, Vehicles & Complete Guide"; JSON-LD `VideoGame` with `datePublished: 2026-11-19` and `dateModified` today; five sub-hubs; 4 latest GTA 6 articles; newsletter + Discord CTA. **In SSR the hero stats read "0 Days to launch · 0 Map locations · 0 Characters · 0 Trailers · 0 News"** (counters hydrate client-side); the map sub-page says "1,058 locations" server-side. `/gta6/everything-we-know` has `FAQPage` JSON-LD and says "PC version not yet confirmed" while the hub's pre-order block lists "PC — Coming Soon". The vehicles page ships 124 images; the characters page has an ItemList and 12 character detail URLs in the sitemap. The hub's H1 is empty (`<h1></h1>`, decorative "The Hype Is Real · Vice City is calling" is not an H1). The one **weak spot is that none of the hub pages links to `/games/grand-theft-auto-vi`, to the calendar, or to any review/preview**, so hub → rest-of-site flow is only via the four news cards.
- **Release calendar**: H1 "September 2026", "1422 This month", per-day lists, "Biggest first" toggle, wishlist buttons. Rich but the entire month is server-rendered into 441 KB; top of page has "0 Sign in to track".
- **Genre/platform/year hubs**: `<title>` pattern "Best Action Games in 2026 | TechPlay", CollectionPage + BreadcrumbList JSON-LD, 30 ranked games, "Random game" button — good SEO shape; RPG hub empty; hubs have no prose paragraph (the meta description is the only sentence).
- **Studios**: 31,970 pages like `/studios/activision` (596 games, subsidiaries, releases by year, 148 internal links, Organization JSON-LD) — the strongest internal-link engine on the site; description is Activision's own corporate boilerplate ("we have built one of the largest portfolios…").
- **Tools hub** (`/tools`): ItemList of five tools with honest one-line descriptions — the best-written index page on the site, but the WoW Analyzer it links to says "Midnight launches March 2, 2026" (stale by seven months) and "50K+ players analyzed · 4.9/5 rating".
- **Last Disc**: petition landing page with countdown to January 2028, poll "0 votes so far", counters "— Signatures — Countries — Anonymous" (dashes in SSR), signature form with GDPR consent, "Latest coverage" (4 articles), forum CTA and "Share this campaign". Good campaign scaffold; empty numbers displayed publicly.
- **Frontiers**: teaser page for "A new MMO strategy of clans, territory and resources … TechPlay Frontiers" with "Add to wishlist / Follow the news" buttons and an empty H1. UNKNOWN whether this is a TechPlay-made game or a partner title; nothing on the page says.

---

## 5. Registration, newsletter and return-visit incentives

### 5.1 Registration as presented (FACT, `/register`)

Copy: "NEW PLAYER · START NEW GAME · Create your player profile and unlock everything TechPlay has to offer: **Earn XP for every comment and article you read** · Level up and unlock community ranks · Join discussions on the forum · Enter exclusive giveaways" — then a stats strip "**15K+ MEMBERS · 50K+ GAMES · FREE FOREVER**" — then the form "CHARACTER CREATION · Create Your Player · Set up your profile — it takes less than a minute." Fields: Username ("your gamertag"), Email, Password, Confirm Password → "Create Player"; "Or sign up with: Sign up with Google · Discord · Battle.net"; "Protected by Cloudflare Turnstile".

- FACT — "15K+ MEMBERS" is false by a factor of ~250 (60 users on 7 Sep 2026). "Earn XP … for every article you read" is false: CLAUDE.md states article reads award nothing since 11 Aug 2026. "Enter exclusive giveaways": there are no active giveaways and no draw has ever settled. The leaderboard's "How to earn more XP" also lists "Read articles and leave comments".
- FACT — The register page pitch (XP, ranks, forum, giveaways) does not mention the library — the one thing the homepage says an account is for. The homepage's own account block ("The record builds itself … Free, and no card") is the better pitch and is not reused on `/register`.
- FACT — Friction: 4 fields + Turnstile + email verification (help centre topic "Your verification email never arrived"; docs §20: verification mail is one of five mails the site sends; `users:prune-unverified` runs nightly). OAuth is a one-click alternative (Google/Discord/Battle.net); Steam sign-in is not offered on the register page even though Steam is the first platform the homepage names (OBSERVATION — Steam linking happens after registration per the help centre).
- OBSERVATION — `/register` is `noindex` and disallowed in robots.txt, which is fine, but it also means the 15K+ claim is not a Google problem — it is a trust problem for the 60 people who did register and for anyone who checks the forum ("0 Members") right after.

### 5.2 Newsletter (FACT)

- Only two entry points: listing-sidebar box ("Stay in the loop — The bigger stories, sent when there is something worth sending." + email + "Subscribe") on `/news`, `/reviews`, `/hardware`, `/guides` (not on `/`, not on articles, not on game pages); and the GTA 6 hub ("Don't miss a single GTA 6 drop — Join thousands of fans … Join the Crew").
- FACT — "Join thousands of fans" is unverifiable and, given 60 registered users, almost certainly false (ESTIMATE).
- FACT — No cadence, no sample issue, no archive, no subscriber count, no "what you get" beyond one sentence. The help centre has "The newsletter" topic (UNREAD; not fetched). The support tier "Super Fan 9.99 €" promises an "Exclusive monthly newsletter" and "Early access to videos", and "TechPlay Legend" promises "Your name in video credits" — there are no videos on the site (`/videos` 404) and no visible YouTube uploads.
- OBSERVATION — docs §20: the campaign tooling exists since 11 Sep 2026 (`mail_campaigns`, tracking, suppression, batch pacing 10 msgs/3 s) — the infrastructure is ahead of the front-end offer.

### 5.3 Return-visit incentives (FACT/OBSERVATION)

- Present: "Add TechPlay.gg as a preferred source on Google" block; Discord card; "Remind me about <game>" on unreleased games (requires login); calendar wishlist (requires login); leaderboard "This Week" tab; daily streak/quests (help centre) for logged-in users; PWA manifest with shortcuts (Profile, Latest News, Game Database).
- Absent: push notifications prompt (manifest exists, no service-worker/push visible in SSR — UNVERIFIED), "follow this topic/game", email alerts for a game or series, bookmarking without an account, RSS link inside articles (only footer), any "next in series" or "read next".
- OBSERVATION — For anonymous readers (the overwhelming majority), the site offers exactly two habits to form: Discord and Google preferred source.

---

## 6. Social proof and trust signals

### 6.1 Social proof visible on the site (FACT)

| Surface | Shown | Reality (docs/README.md 7 Sep 2026 or measured) |
|---|---|---|
| Register | 15K+ MEMBERS · 50K+ GAMES | 60 users · 333,198 games |
| Forum | 0 Online · 0 Threads · 0 Replies · 0 Members | 7 threads in DB (protocol) — the public counter shows 0 (OBSERVATION: SSR counters not hydrated, or excluded) |
| Leaderboard | "Rising Players — Nobody has moved yet this week" | |
| Lists | one list, "Comfort Games @deleted_user_95 · 3 games · 0 · 0" | 2 lists in sitemap |
| Giveaways | "— Active — In prizes — Winners — Taking part"; "No draws have been settled yet" | |
| Shop | 0 PRODUCTS | `products` table empty (docs §8) |
| Articles | "Discussion (0)" on all 6 sampled; guide "HELPFUL: 0 FOUND HELPFUL" | 22 comments site-wide |
| Reviews | "Reader ratings — Nobody has rated this yet" | `user_games` 2,599 rows exist but ratings not surfaced |
| GTA 6 hub | "0 Days to launch · 0 Map locations · 0 Characters · 0 Trailers · 0 News" (SSR) | map page says 1,058 |
| Last Disc | "0 votes so far"; "— Signatures — Countries" | |
| WoW Analyzer | "50K+ players analyzed · 4.9/5 rating" | UNVERIFIED; no rating widget exists on the page |
| About | "333,920 Games catalogued · 57,630 Studios · 679 Pieces published"; per-author piece counts | matches DB order of magnitude |
| Author pages | "Adi Zeljković · 193 pieces (News 97 · Reviews 32 · Tech 63 · Guides 1)"; "Nenad Divljaković · 72"; About also lists "Milan Dogandžić · Contributor · 263 pieces", "Miloš Rešković · 106", "Uroš Kurlagić · 45", "Nemanja Kočica · 5" | sums to ≈684 ≈ sitemap 683 |
| Marketing | "Global reach · Worldwide · Balkans-founded, US and EU audience"; "Mobile Sticky … where most of our traffic is" | no numbers anywhere — no pageviews, no uniques, no demographics |

- OBSERVATION — The pattern is: **inflated where the number is hard-coded, zero where the number is live.** Both kinds hurt: the first is a credibility risk that any journalist, advertiser or Wikipedia editor can falsify in ten seconds (forum "0 Members" is one click away from "15K+ MEMBERS"), the second broadcasts emptiness to every anonymous visitor.
- RECOMMENDATION — Replace hard-coded claims with API-fed numbers where the number is flattering (games, studios, pieces, articles this week, Discord members via the invite API — 160 today) and **hide** modules whose live value is zero (forum stats bar, "Recent winners", "Most read", "Rising players", GTA 6 counters until hydrated). Never show a dash or a zero to an anonymous visitor.

### 6.2 Trust signals (FACT)

Present and good:
- Bylines with real names, photos, bios and author pages (`Person` JSON-LD); About page lists all six writers with roles and counts; "Member since Jan 2026" on author pages.
- Absolute dates on articles (`26/09/2026`) plus `article:published_time` and `article:modified_time` metas and JSON-LD `datePublished/dateModified`; listing pages use relative dates ("1 hour ago").
- Review policy: `/rating-system` (1–10 scale defined per band, five pillars, "reviews reflect the subjective experience of the reviewer"); reviews show score + `Product` JSON-LD.
- Corrections policy stated on About: "Corrections are visible — When we get something wrong we change it and say so, rather than editing quietly and hoping. The help centre says which of its own claims turned out to be wrong." Contact page lists "corrections" as a use of the editorial inbox.
- Independence statement: "There is no publisher behind us, which is why the reviews answer to readers"; "Supporting the site buys an ad-free page and a say in what we look at next — never in what we conclude."
- Impressum: "Publisher & owner: Luminor Solutions — Digital Media & Technology Agency · Sarajevo, Bosnia and Herzegovina · luminor.solutions · Phone +387 62 574 783"; Contact: three inboxes (editorial, advertising, support — emails Cloudflare-obfuscated), "71000 Sarajevo", "within two working days".
- Privacy (1,719 words), Terms, Cookie policy (names AdSense and Meta Pixel), a Google CMP (Funding Choices) in CSP; NewsMediaOrganization JSON-LD on every page.
- Help centre on its own hostname with 11 topics and "Every question asked is one of the pages that ends up here".

Gaps:
- FACT — No corrections log/page exists that a reader can find (the policy says corrections are visible; there is no `/corrections` and no "Updated:" line on the sampled articles despite `dateModified` differing from `datePublished` by minutes to months — e.g. reviews all modified 27 Aug 2026 22:32, a bulk edit).
- FACT — No ethics/affiliate disclosure on pages with store links ("Where to get it: Steam Amazon GOG…", GTA 6 "Pre-order Now"). UNKNOWN whether these are affiliate links (no tags visible in SSR `href`s for Amazon — the hrefs were not present in SSR at all for the pre-order buttons).
- FACT — Review count and recency: 38 reviews, latest 8 Jul 2026 — the review programme that anchors "credibility" has been dormant for 11 weeks.
- FACT — "Hardware Reviews 2026 | GPU, CPU & PC Component Benchmarks" (`/hardware` title) and the Reviews title "Expert Scores & Performance Benchmarks" promise benchmarks; no benchmark, FPS or thermal data appears in any sampled review or in the hardware listing (which is AI/phone/WhatsApp news).
- FACT — Support tiers promise deliverables that do not exist yet (videos, video credits, supporter-only forum, monthly newsletter) and the shop is empty.
- OBSERVATION — The About page headline copy is honest and specific; the meta titles/descriptions written for SEO ("Meet the experts behind TechPlay… global media team responds to all messages within 24 hours", "Leading Global Gaming Media & Tech Experts", "Our global media team") are boilerplate that contradicts the About page's own "We are not the biggest gaming site" and the Contact page's "two working days".

---

## 7. Content depth and frequency

### 7.1 Inventory (FACT, from listing headers 27 Sep)

- News: **577** items, 45 pages. Reviews: **38**, 3 pages, latest 8 Jul 2026. Hardware/Tech: **67**, 6 pages. Guides: **4** (3 Genshin Impact, 1 WoW addons). Total 686 (sitemap-articles 683; About "679"; docs 638 on 7 Sep → **≈45 pieces published in the 20 days since**, i.e. ≈2.2/day).

### 7.2 Last 20 news items by date (FACT, RSS + sitemap-news; times +02:00)

27 Sep: 20:32 Wolverine GPS aids · 18:54 Minecraft 425M · 18:47 CONTROL Resonant leak · 17:37 WhatsApp redesign (hardware)
26 Sep: 20:15 Epic €100M claim · 18:48 Xbox in-game ads patent · 17:52 AI energy demand (hardware)
25 Sep: 19:14 Weekend.19 "No rest for visionaries" · 17:00 GTA 6 $400 Collector's Set
24 Sep: 21:22 Weekend.19 kicks off · 20:59 Tim Schafer · 20:17 WoW Forever not for Retail · 18:36 Quake Champions · 18:31 CS2 update
23 Sep: 19:10 Rayman Legends Retold · 19:02 Discord age verification · 18:57 Realme 16 Pro (hardware) · 13:43 Guild Wars 2 community
22 Sep: 20:15 Weekend.19 in two days (hardware) · 20:06 Xbox restructuring/Halo · 20:00 Windows 11 look (hardware) · 19:54 Valve Lepton

- ESTIMATE — 22 items in 6 days ≈ **3.5/day**, almost all between 17:30 and 21:30 CET (evening publishing; zero morning/US-daytime publishing). Before that: 21 Sep (4 items, one at 00:38), then a **gap 17–20 Sep with nothing**, 16 Sep (1), 14 Sep (2), 13 Sep (4), 12 Sep (1), 11 Sep (3), 10 Sep (4), 9 Sep (3). September pattern: bursts of 3–5 in the evening, several dead days.
- FACT — Authorship of the 22: Adi Zeljković 13, Nenad Divljaković 9 (by listing bylines). Four of the 22 are coverage of "Weekend.19"/"Energy.Weekend" in Rovinj — a regional business/media conference — filed under gaming/tech news.
- OBSERVATION — Story selection is reactive re-reporting of international news (Epic/SMC, Schafer/BBC, Rockstar Newswire, Insomniac patch notes) without linking the primary source; the one distinctive strand is Balkan-region conference coverage. Nothing on the last 20 uses the games database (no "release calendar this week", no "what came out today" post) — the site's own differentiator does not feed the content that gets published.

### 7.3 Depth (ESTIMATE, words of body text)

News 300–700 words (median ≈450 across 4 samples), listed as "2–3 MIN READ"; tech/conference pieces ≈1,000; reviews 1,150–2,350 ("6"/"12 MIN READ"); guide ≈1,900 with five H2 sections and HowTo JSON-LD. Reviews carry 7 images, news 3–4. The review prose is first-person, opinionated and well structured (Crimson Desert: 2,350 words with named locations and mechanics) — clearly the strongest editorial product on the site and the one that has been paused.

---

## 8. Shareability and social presence

### 8.1 On-page (FACT)

- Share buttons on articles: `aria-label` "Share on Facebook", "Share on Twitter", "Share on LinkedIn", "Share on WhatsApp", "Share" (Web Share / copy) — rendered twice (top "SHARE:" row and bottom "Share:" row). No Reddit, no Discord, no Telegram, no Bluesky, no Threads.
- OG/Twitter cards: every page has `og:title`, `og:description`, `og:image` (+width/height/alt on the homepage), `twitter:card summary_large_image`, `twitter:site @TechPlayGG`. Articles use their own cover (`storage/articles/…jpg`, 25–166 KB). Generic fallback `storage/seo/01KG0RGMA…png` is used on `/news/page/2`, `/leaderboard`, `/lists`, `/tools`, `/roadmap`, `/support`, `/studios`, `/giveaways`, `/register`, `/login`, `/backlog-advisor`, help centre — i.e. the same image for a dozen different pages. Game pages use IGDB/MobyGames CDN covers (portrait `t_cover_big` — wrong aspect for a 1200×630 card). Studio pages use a dynamic `/og/studio?slug=` image; profiles `/og/profile?username=` (good pattern, not used for articles or hubs).
- FACT — Two `<title>`s are truncated at ~60 chars mid-word: "GTA 6 is getting a $400 Collector's Set which does not" and "Now you can turn off GPS aids in Marvel's Wolverine for side" — visible in JSON-LD `headline` too.
- FACT — The Tim Schafer article's `<title>` ("Tim Schafer blames gaming layoffs on corporate greed") differs from its H1 ("Tim Schafer on gaming layoffs: 'Someone got greedy'") — the SEO-title field is used, which is good practice; the JSON-LD headline follows the SEO title.

### 8.2 Accounts found (FACT, direct fetches 27 Sep 2026; no WebSearch available)

| Network | Handle / URL | Linked from site? | Measured |
|---|---|---|---|
| Discord | `discord.gg/wPQG9gUMXH` → server "TechPlay.gg" | Yes (footer card, article sidebar, GTA 6 hub, help centre) | **160 members, 24 online**; invite non-expiring; features COMMUNITY, NEWS, WELCOME_SCREEN, MEMBER_VERIFICATION_GATE; lands in `🎮┃gaming` |
| YouTube | `youtube.com/@techplay_gg` ("TechplayGG") | Yes (footer, article "Follow Us") | **20 subscribers**; "Joined Feb 9, 2026"; bio "Built by gamers, for gamers…"; **0 video renderers in `/videos` HTML** → likely no public uploads (UNVERIFIED without JS) |
| X / Twitter | `x.com/TechPlayGG` ("Techplay.gg @TechplayGG") | Only as `twitter:site` meta — **not in footer or Follow Us** | exists; bio "We test hardware until it breaks. We play games until 4 AM to write honest reviews."; follower/post counts not in SSR — UNVERIFIED |
| Facebook | `facebook.com/techplaygg` | Yes (footer, Follow Us) | login wall (HTTP 400 → /login) — likes/followers UNVERIFIED |
| Instagram | `instagram.com/techplay.gg/` | Yes (footer only) | HTTP 429 → login redirect — UNVERIFIED |
| TikTok | `@techplay.gg`, `@techplaygg` | No | **"Couldn't find this account"** (statusCode 10221) for both |
| Threads | `threads.com/@techplay.gg` | No | 200 with generic shell; existence UNVERIFIED |
| Bluesky | `techplay.gg` handle | No | **Profile not found**; actor search "techplay" returns only an unrelated "TechPlayR Services" |
| LinkedIn | `/company/techplay-gg`, `/company/luminor-solutions` | No | both 404 (slugs guessed) — UNVERIFIED |
| Twitch | `twitch.tv/techplaygg` | No | generic shell — UNVERIFIED |
| Reddit | search + `/domain/techplay.gg` | No | HTTP 403 (blocked) — UNVERIFIED |

- OBSERVATION — The footer promotes Facebook, Instagram and YouTube (20 subs, no videos) but not X, where the account actually exists and which is the network gaming journalists and PR people use for sourcing. Discord — the only channel with a measurable community (160) — is promoted well.
- OBSERVATION — Article share buttons include LinkedIn and WhatsApp (reasonable for a Balkan audience) but not Reddit or Discord, the two networks where gaming news actually travels.

### 8.3 Third-party mentions and Google News (FACT)

- Google News RSS `search?q=site:techplay.gg` returned **100 items; 99 are `/games/<slug>` database pages** with titles like "PES 2008: Pro Evolution Soccer (2007) - techplay.gg", "Die Stadt der Löwen (1989) - techplay.gg", "The Feed - techplay.gg", and pubDates equal to the game's original release year (1982–2026); the single article was "Hazelight sold 50M worth of games with only 3 TITLES" (Apr 2026). None of the 40 September news articles appeared.
- HYPOTHESIS — Google is treating `VideoGame.datePublished` / the "(2007)" in the title as article dates and the game pages as the site's "news"; combined with `Googlebot-News: Allow /news/ /guides/ /reviews/ /hardware/` in robots.txt (which does not *disallow* `/games/`), this is polluting the domain's Google News surface with catalogue pages. Worth a Publisher Center check (UNVERIFIED — not accessible from here).
- Google News RSS `search?q=techplay.gg` returned only unrelated "tech play" results → **no third-party news mention of the domain found**.
- Wayback: a snapshot of `techplay.gg` from 8 Apr 2026 exists; the CDX history request failed twice (connection reset) so the archive depth is UNKNOWN.
- Reddit, forums, other-site mentions: **could not be checked** (Reddit blocks, WebSearch budget exhausted). UNVERIFIED — flagged for the follow-up agent.

---

## 9. Conversion friction and mobile

- FACT — Registration: 4 fields, Turnstile, email verification, then platform linking as a second step; OAuth via Google/Discord/Battle.net. Docs §16 records a bug where Discord sign-ups were unverified ("2 of …" — fixed) and a nightly `users:prune-unverified` job; the help centre's #1 "read most" article is "The Create account button is greyed out" and #2 is about the verification email — i.e. the two most-asked questions are both registration friction.
- FACT — Giveaways page is `noindex, nofollow`, lists nothing active and requires sign-in to "keep track of what you have entered"; the register page still sells "Enter exclusive giveaways".
- FACT — Viewport meta `width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes` (correct, zoom allowed); footer social buttons are `h-11` (44 px) — adequate tap size; mobile bottom nav with five items; `theme-color #DC143C`; manifest `display: standalone` with shortcuts.
- OBSERVATION — Mobile weight: ≈440 KB compressed JS + 170 KB HTML + covers; the calendar's 441 KB HTML is the outlier. AdSense (`googlesyndication` in CSP and 2 references on articles), GA (8 `gtag` references) and the Google CMP all load — on a 2–7 % consent rate (protocol) most visitors will see the CMP dialog first.
- FACT — The marketing page states "Mobile Sticky 320×50 / 320×100 — Fixed to the foot of the screen on phones, where most of our traffic is" — the only place the site admits its traffic is mostly mobile.

---

## 10. Giveaway experience (FACT)

`/giveaways`: H1 "GIVEAWAYS", subtitle "Win gaming prizes, collector rewards and exclusive keys.", stat strip "— Active — In prizes — Winners — Taking part" (dashes), tabs Active/All/Ended (all empty), "How it works 1 Find one you want 2 Do what it asks — Some are a single click; some have tasks worth extra entries 3 Winners are drawn — Announced here and on your profile", "Recent winners — No draws have been settled yet — the first winner shows up here.", "Your entries — Sign in to keep track". Page is `noindex, nofollow`; not in any sitemap; not linked from the homepage SSR. Marketing page sells "Giveaways — You supply the keys or hardware, we run the entry, the draw and the winner contact."; Discord card promises "Giveaway pings before they close"; help centre has "How giveaways work". `SendGiveawayReminders` job exists (CLAUDE.md).

- OBSERVATION — Fully built mechanism, zero inventory, promoted in three places. Either run one (even a €20 key) or stop advertising it on the register page and Discord card until there is one.

---

## 11. Errors and inconsistencies hit (FACT)

1. Article breadcrumb category links → 404 on every news/tech article (`/news/news-industry`, `/news/news-gaming`, `/news/tech-tech-news`).
2. RSS `<link>` for hardware items uses `/tech/<slug>` → 404; correct path `/hardware/<slug>`.
3. RSS ≈24 h stale relative to sitemap-news (4 articles from 27 Sep missing at 21:00 UTC).
4. GTA 6 news attached to `/games/gta-6` (2019 parody) instead of `/games/grand-theft-auto-vi`.
5. `/videos` 404 while support tiers promise videos; 404 page emits both `noindex` and `index, follow`.
6. Two author URLs per person (`/author/adi` vs `/author/adi-zeljkovic`), split across content types in JSON-LD.
7. Game pages: "Reader score X/10 · N votes" and "Nobody has rated this yet" on the same page.
8. `/games/genre/rpg` Top Rated empty; `/games` landing has no text.
9. OG images from `cdn.mobygames.com` on older games despite MobyGames being retired; 2–2.5 MB PNG OG images on GTA 6 hub and WoW Analyzer; a filename with a space (`/WoW Analyzer.png`).
10. Hard-coded numbers: 140,000+ (titles/descriptions ×6), 50K+ games and 15K+ members (register), "thousands of fans" (GTA 6), "50K+ players analyzed · 4.9/5" (WoW), "Midnight launches March 2, 2026" (WoW, past), "3 platforms" (home) vs "5 platforms" (about), 31,970 vs 57,630 studios.
11. Roadmap 2026 still shows Q1 "Backlog & Collection Tracker — In progress" and every other item "Planned" at the end of Q3, while several of them (custom lists, backlog advisor, Professor Buffy) are live — the page under-reports what shipped.
12. `/hardware` and `/reviews` titles promise benchmarks that do not exist; About meta promises "responds to all messages within 24 hours" vs Contact "two working days".
13. Two `<title>`s truncated mid-word; JSON-LD `headline` inherits the truncation.
14. Empty-state modules rendered to anonymous visitors: forum stats bar, "Most read", "Coming out", "Rising Players", "Recent winners", "Popular now", "Hidden Gems", "On This Day", GTA 6 hero counters, Last Disc counters, "Most wishlisted — No wishlists yet".
15. Header "Shop" → "0 PRODUCTS".

---

## 12. Scorecard (1–5, with evidence)

| # | Dimension | Score | Evidence |
|---|---|---|---|
| 1 | Messaging & brand positioning | **2** | Three taglines on one site (library product / "publication with a database" / "daily dose of news"); homepage first fold has no news although 84 % of output is news; About copy is excellent but isolated. |
| 2 | Calls to action | **3** | Consistent "Start your library / Join TechPlay / Join Discord"; nothing in article bodies; newsletter only on listing sidebars; "Pre-order Now" precedes any TechPlay CTA on GTA 6 hub. |
| 3 | Content discovery (nav, related, per-page links) | **2** | No related-articles module; sidebar "Popular now" empty in SSR; homepage SSR lacks links to guides/hardware/gta6/leaderboard/tools sub-pages; Shop in nav with 0 products. |
| 4 | Registration incentive as presented | **1** | False "15K+ MEMBERS · 50K+ GAMES", false "XP for every article you read", "exclusive giveaways" with none running; the actual differentiator (library) not mentioned on `/register`. |
| 5 | Newsletter incentive | **2** | One sentence, no cadence/sample/archive, on listing pages only; GTA 6 box claims "thousands of fans"; back-end campaign tooling exists (docs §20). |
| 6 | Return-visit incentive | **2** | Google preferred-source block + Discord; everything else requires login; no follow-a-game/series alerts for anonymous readers; RSS only in footer. |
| 7 | Social proof | **1** | Zeros and dashes everywhere live; inflated where hard-coded; 0 comments on all sampled articles; 20 YouTube subscribers promoted in footer. |
| 8 | Trust signals | **4** | Real bylines, author pages, dates, rating scale, independence and corrections statements, impressum with address/phone, three inboxes, help centre. Minus: no corrections log, no affiliate disclosure, benchmark claims unmet, support tiers promise non-existent videos. |
| 9 | Navigation | **3** | Clear seven-item header, mobile bottom bar, consistent footer; but dropdown contents client-only, Studios given a top slot while Guides/Hardware have none, "Feed" vs "Discover" vs "News" naming unclear. |
| 10 | Content depth & frequency | **3** | ≈3.5 news/day on active days, 300–700 words, reviews 1,150–2,350 words and well written; but reviews paused since 8 Jul, 4 guides total, 4-day gaps, two authors carry it, no primary-source links. |
| 11 | Shareability | **3** | Full OG/Twitter cards with real covers on articles; share buttons (FB/X/LinkedIn/WhatsApp/native); minus generic OG on a dozen hubs, portrait IGDB covers as OG on games, 2 MB PNGs, no Reddit/Discord share. |
| 12 | Internal linking | **1** | 0 contextual links in 6 article bodies; breadcrumb 404s on every article; GTA 6 → wrong game entity; two author URLs. Studio pages (148 links) and hubs are the only strong link sources. |
| 13 | Landing-page potential of hubs | **4** | GTA 6 hub (map 1,058 pins, characters, vehicles, weapons, FAQ, JSON-LD), calendar (1,422 releases), genre/platform/year hubs with CollectionPage, 31,970 studio pages, Last Disc campaign — real assets; held back by SSR zeros, heavy OG images, missing cross-links and thin prose. |
| 14 | Conversion friction | **3** | OAuth ×3 + Turnstile is standard; but verification email and greyed-out button are the top two help-centre questions; Steam (the first platform named) is not a sign-in option; giveaways gated behind login with nothing to enter. |
| 15 | Mobile experience | **3** | Correct viewport, 44 px tap targets, bottom nav, PWA manifest, Next image optimisation working (85 KB hero at 1920); ≈440 KB compressed JS, 441 KB calendar HTML, CMP + AdSense + GA on first visit. |
| 16 | Giveaway experience | **1** | Built, empty, `noindex`, still advertised on register page and Discord card. |
| 17 | GTA 6 hub as landing page | **4** | Best asset on the site for Q4 2026; needs hydrated counters in SSR, an H1, links to the real game page/calendar/reviews, a lighter OG image, consistent PC messaging, affiliate disclosure. |
| 18 | Games database page quality | **2** | Rich structured facts and store links, but 0 TechPlay-written words on all 3 samples, contradictory ratings, MobyGames OG images, DLC/fan games surfacing as top-rated, `/games` landing with no text; Google News is indexing these pages as the site's "news". |
| 19 | Errors / broken pages | **2** | Site is up and fast, but breadcrumb 404s, RSS 404s and the wrong-game relation are systematic (every article), not one-offs. |
| 20 | Social presence | **1** | Discord 160 members is the only living channel; YouTube 20 subs/no videos; X exists but is not linked; TikTok/Bluesky/LinkedIn absent; Facebook/Instagram unmeasurable; zero third-party mentions found in Google News. |

Average ≈ 2.4 / 5. The trust layer (8) and the hub assets (13, 17) are well above the rest; social proof, registration pitch, internal linking, giveaways and social presence are at 1.

---

## 13. Top 20 concrete fixes / opportunities observed on the live site

Each is a RECOMMENDATION tied to a FACT above. Ordered roughly by (impact ÷ effort).

1. **Delete or replace the false numbers on `/register`** ("15K+ MEMBERS", "50K+ GAMES") and the "XP for every article you read" line. FACT: 60 users, 333k games, reads award no XP. Replace with API-fed "333,920 games · 6 writers · 160 on Discord" or nothing. Same for WoW Analyzer "50K+ players analyzed · 4.9/5" and GTA 6 "Join thousands of fans".
2. **Fix the article breadcrumb category href** (`/news/news-industry` → `/news/industry`, `/news/news-gaming` → `/news/gaming`, `/news/tech-tech-news` → `/hardware/news`). FACT: 404 on every article; the slug appears to be prefixed with the parent slug twice.
3. **Fix the RSS item links for hardware** (`/tech/<slug>` → `/hardware/<slug>`) and make the feed regenerate on publish (it lagged sitemap-news by ~24 h). FACT: 404 in feed readers, Feedly/Inoreader/Discord bots included.
4. **Re-point GTA 6 news from `/games/gta-6` to `/games/grand-theft-auto-vi`** and hide/merge the 2019 parody entry (or at least rename its title so it cannot be picked by name match). FACT: five real GTA VI stories currently promote a stickman game.
5. **Add a "Read next / Related" module and 3–5 contextual links per article.** FACT: 0 body links in 6 samples; the site already knows the linked game (sidebar card), the category and the author — related-by-game and related-by-category is a query, not new content. Link the primary source once per story (Rockstar Newswire, BBC, SMC) — it is also a trust signal.
6. **Put one CTA block under every article body**: Discord (160, live count from invite API) + newsletter (one line + what/when) + "Connect Steam and see your hours" — instead of the current order (Google preferred source → Stay Connected → author → Follow Us). FACT: articles are the only pages with organic traffic and carry no newsletter or register CTA.
7. **Hide zero-value modules for anonymous visitors**: forum stats bar ("0 Members"), "Most read — Not enough reading yet", "Coming out — Nothing dated", "Rising Players — Nobody has moved", "Recent winners — No draws", "Most wishlisted — No wishlists yet", "0 votes so far", and render GTA 6 / Last Disc counters server-side (the map page already has "1,058" in SSR). FACT: all visible on 27 Sep.
8. **Unify author URLs** (`/author/adi` → 301 to `/author/adi-zeljkovic`; make review/guide JSON-LD use the canonical). FACT: Person entity split across two URLs.
9. **Make the homepage's first fold carry today's news** next to the library pitch, and echo the About sentence "a gaming and hardware publication with a games database underneath it and a library on top" in the hero sub-copy. FACT: 84 % of output is news; first fold has none.
10. **Source every number from the API and retire "140,000+"** from six `<title>`/meta descriptions, "3 platforms" on the homepage (About says 5), and reconcile 31,970 vs 57,630 studios with a footnote ("with at least one catalogued game").
11. **Restart reviews or re-label the section.** FACT: 38 reviews, last 8 Jul 2026; reviews are the longest, best-written content on the site and the only content with a `Product` schema and a score; the homepage rail still leads with a 2-month-old review. Also drop "Performance Benchmarks"/"GPU, CPU & PC Component Benchmarks" from titles until benchmarks exist.
12. **Ship a game-page paragraph "ours"** for at least the ~2,000 games with any TechPlay signal (docs §12: 1,967 game pages have something of ours). A two-sentence editorial note + linked review/news + "N TechPlay members own this / average hours" (from `user_games`, 2,599 rows) would turn a boilerplate page into a page with a reason to be indexed. Fix the "Reader score X · N votes / Nobody has rated this yet" contradiction (label the imported aggregate as "Aggregate score", show reader ratings separately).
13. **Regenerate OG images**: 1200×630 JPEG/WebP ≤300 KB for `/gta6/og-*.png` (2 MB), `/WoW Analyzer.png` (2.5 MB, space in filename), homepage OG (880 KB PNG); extend the existing dynamic `/og/studio` pattern to `/og/game` (landscape composite from the portrait cover) and `/og/hub` so a dozen pages stop sharing one generic image.
14. **Link X from the footer and "Follow Us"** (the account exists and is already in `twitter:site`); add Reddit and Discord to the share row; drop LinkedIn from share (keep for hardware/tech if wanted). FACT: footer promotes YouTube (20 subs, no videos) over X.
15. **GTA 6 hub for Q4**: give it an H1, SSR the counters, add links to `/games/grand-theft-auto-vi`, the November calendar and every GTA article (not just four), reconcile "PC — Coming Soon" vs "PC version not yet confirmed", add a disclosure line under "Pre-order Now", and make `/gta6` reachable from the homepage SSR HTML. FACT: today the homepage HTML contains no link to `/gta6`.
16. **Run one giveaway or remove the promise.** FACT: register page, Discord card and marketing page all sell giveaways; none exists, no winner ever. If run: make `/giveaways` indexable while a giveaway is live and link it from the article CTA block.
17. **Update `/roadmap`** to show what shipped (backlog advisor, lists, Professor Buffy Discord bot, help centre, library sync for 5 platforms). FACT: everything is "Planned" or "In progress" at end of Q3; the page currently understates the product to anyone evaluating the site.
18. **Add a visible "Updated on …" line and a `/corrections` page** (About promises "Corrections are visible"). FACT: `dateModified` exists in metadata only; reviews were bulk-modified 27 Aug 2026 with no note.
19. **Publish in the morning too.** FACT: 22 of the last 22 news items were published between 13:43 and 21:22 CET, most after 17:30; the register/marketing pages claim a "US and EU audience". One scheduled morning slot (the `articles:publish-scheduled` command exists) would double the day-parts covered without more writing.
20. **Use the database in the news flow**: a daily/weekly "Out today / this week" post generated from `/calendar` (1,422 September releases already server-rendered) and a "TechPlay Hidden Gems" list from the "Brilliantly rated. Almost nobody has played them." module (currently empty in SSR) would be the first content that only TechPlay can publish, and it links the catalogue into the news that Google actually crawls. Also check Publisher Center / consider `Googlebot-News: Disallow: /games/` — FACT: Google News currently surfaces 99 game pages and 1 article for `site:techplay.gg`.

---

## 14. Quick reference — what a first-time visitor sees (OBSERVATION, 27 Sep 2026, desktop SSR)

Homepage: header → "Gaming, on the record" → H1 "One library for everything you play." → two buttons → 3 stats → "Featured Opinions: Top 10 games you can finish in one sitting! · Nenad Divljaković · 3 weeks ago · 8 min read · 01 / 05" → four quick-link cards → "Discover Games (Trending / New Releases / Coming Soon)" → "Editorial Spotlight" with 7 mixed cards (news 1–4 h old, reviews 2 months old, hardware) → "TechPlay Reviews" rail (4 reviews, 2–3 months old, scores 9.6 / 5.6 / 5.8 / 6.6) → "Hidden Gems" (empty) → "On This Day" (empty) → "What an account is for — The record builds itself." → footer with Discord card and social icons.

Article: breadcrumb (category → 404) → H1 → byline/date/read time → "SHARE:" → pull-quote → body (no links) → "Add TechPlay.gg as a preferred source on Google" → tags → share → author box → "Follow Us" → "Discussion (0)"; sidebar: "About this game" card → "Popular now" (empty) → "Upcoming releases" (empty) → Discord card.

---

## Sources used

All accessed 27 Sep 2026 by direct fetch; full list with the claim each supports is in the agent CSV (`scratchpad/sources/live-site.csv`, 95 rows).

- https://techplay.gg/ · /news · /news/page/2 · /news/page/3 · /reviews · /guides · /hardware · /videos (404) · /latest
- https://techplay.gg/news/epic-games-faces-eur100m-fortnite-claim-in-the-netherlands · /news/now-you-can-turn-off-gps-aids-in-marvels-wolverine-for-side-content · /news/tim-schafer-on-gaming-layoffs-someone-got-greedy · /news/gta-6-is-getting-a-400-collectors-set-which-does-not-contain-the-game
- https://techplay.gg/reviews/assassins-creed-black-flag-resynced-review · /reviews/crimson-desert-review · /guides/top-world-of-warcraft-midnight-addons-to-use-in-2026 · /hardware/ais-growing-energy-demand-puts-power-grids-to-the-test · /tech/ais-growing-energy-demand-puts-power-grids-to-the-test (404)
- https://techplay.gg/games · /games/cyberpunk-2077 · /games/elden-ring · /games/animal-company · /games/baldurs-gate-3-digital-deluxe-edition · /games/grand-theft-auto-vi · /games/gta-6 · /games/genre/action · /games/genre/rpg · /games/platform/pc · /games/year/2026
- https://techplay.gg/calendar · /studios · /studios/activision · /forum · /leaderboard · /lists · /giveaways · /shop
- https://techplay.gg/gta6 · /gta6/vehicles · /gta6/characters · /gta6/map · /gta6/weapons · /gta6/everything-we-know
- https://techplay.gg/wow-analyzer · /backlog-advisor · /tools · /last-disc · /last-disc/letter · /frontiers
- https://techplay.gg/about · /roadmap · /rating-system · /marketing · /support · /contact · /impressum · /privacy · /terms · /cookies · /register · /login · /profile/me · /author/adi-zeljkovic · /author/nenad-divljakovic · /author/adi
- https://techplay.gg/rss · /feed · /sitemap.xml · /sitemap-news.xml · /sitemap-pages.xml · /sitemap-hub.xml · /sitemap-articles.xml · /sitemap-categories.xml · /sitemap-lists.xml · /sitemap-series.xml · /sitemap-guides.xml · /sitemap-games-1.xml · /sitemap-studios.xml · /sitemap-images.xml · /robots.txt · /manifest.json
- https://help.techplay.gg/
- https://www.youtube.com/@techplay_gg (+ /videos, /about) · https://x.com/TechPlayGG · https://www.facebook.com/techplaygg · https://www.instagram.com/techplay.gg/ · https://discord.com/api/v10/invites/wPQG9gUMXH?with_counts=true · https://www.tiktok.com/@techplay.gg · https://www.tiktok.com/@techplaygg · https://www.threads.com/@techplay.gg · https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=techplay.gg · https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors?q=techplay · https://www.linkedin.com/company/techplay-gg · https://www.twitch.tv/techplaygg · https://www.reddit.com/search.json?q=%22techplay.gg%22 (403)
- https://news.google.com/rss/search?q=site:techplay.gg · https://news.google.com/rss/search?q=techplay.gg · https://archive.org/wayback/available?url=techplay.gg
- Repo: /home/user/techplay/docs/README.md §8, §12, §19, §20 (measured numbers 7 Sep 2026); /home/user/techplay/CLAUDE.md.

## Gaps / needs more data

- **No WebSearch was possible** (session budget exhausted before this agent ran). Therefore: third-party mentions of techplay.gg on Reddit, forums, other gaming sites, and any press coverage are UNVERIFIED; Facebook/Instagram follower counts are UNVERIFIED (login walls); X follower/post counts UNVERIFIED (not in SSR); Threads/Twitch/LinkedIn existence UNVERIFIED (generic shells or guessed slugs). A follow-up with search budget should run: `"techplay.gg" -site:techplay.gg`, `"TechPlayGG"`, `site:reddit.com "techplay.gg"`, `site:linkedin.com "TechPlay" Sarajevo`, and open the Facebook/Instagram pages in a browser.
- Google News / Publisher Center status: only inferred from the RSS search (99 game pages, 1 article). Whether techplay.gg is an approved Publisher Center source is UNKNOWN.
- Wayback CDX history failed (connection reset); only one snapshot date (8 Apr 2026) confirmed.
- Client-side behaviour not observed: dropdown nav contents, GTA 6 counters after hydration, "Popular now", "Hidden Gems", "On This Day", forum stats, comment widget, Turnstile flow, CMP dialog, srcset behaviour on the homepage, the "Pre-order Now" target and whether store links carry affiliate tags. A headless-browser pass would settle these.
- Mobile: assessed from viewport meta, CSS class sizes and payload weights only; no Lighthouse/CrUX run.
- Newsletter: subscriber count, cadence, and the help-centre "The newsletter" article were not fetched; whether any campaign has been sent since the 11 Sep tooling is UNKNOWN.
- Word counts are estimates from stripped SSR text (article chrome subtracted by inspection); link counts are exact for the `<article>` element only.
- Whether "Frontiers" is a TechPlay-owned game is UNKNOWN.

---

## Appendix A — Per-page `<head>` audit (FACT, 27 Sep 2026)

All pages: `robots: index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1` unless noted; canonical present and self-referencing unless noted; JSON-LD always includes `NewsMediaOrganization` + `WebSite`, extra types listed.

| Page | `<title>` | H1 | Meta description (abridged) | OG image | Extra JSON-LD |
|---|---|---|---|---|---|
| `/` | TechPlay — One Game Library for PC, PlayStation & Xbox | One library for everything you play. | Connect Steam, PlayStation and Xbox: every game you own in one library… | storage/seo/…7EK3.png (880 KB) | — |
| `/news` | Gaming News 2026 \| Breaking Headlines & Industry Updates \| TechPlay | Gaming News | Get real-time 2026 gaming news… PC, PS5, Xbox, and Nintendo Switch | seo/…ZBBP.png | — |
| `/news/page/2` | Gaming News — page 2 | Gaming News | Game announcements… Page 2 of the archive. | generic seo/…JQ77.png | — |
| `/reviews` | Game Reviews 2026 \| Expert Scores & Performance Benchmarks \| TechPlay | Game Reviews | …technical benchmarks, pros/cons… 140,000+ game database | seo/…CM4A.png | — |
| `/guides` | Pro Gaming Guides, Strategy Walkthroughs & Tips \| TechPlay | Gaming Guides | Master any title in our 140,000+ game database… | seo/…BTQM.png | — |
| `/hardware` | Hardware Reviews 2026 \| GPU, CPU & PC Component Benchmarks \| TechPlay | Hardware & Tech | …thermal data and FPS testing for over 140,000 games | seo/…EXCK.png | — |
| `/games` | Video Game Database \| Search 140,000+ Titles & Specs \| TechPlay | GAME DATABASE | …over 140,000 titles. Find system requirements, release dates, and hardware benchmarks | seo/…0CWG.png | — |
| `/games/cyberpunk-2077` | Cyberpunk 2077 (2020) \| TechPlay | Cyberpunk 2077 | first 160 chars of store description | cdn.mobygames.com/…webp | VideoGame, BreadcrumbList |
| `/games/genre/action` | Best Action Games in 2026 \| TechPlay | Best Action Games | The best action games ranked by community rating… | (none found) | BreadcrumbList, CollectionPage |
| `/games/platform/pc` | Best PC Games in 2026 \| TechPlay | Best PC Games | The highest-rated PC games ranked by community score… | (none found) | BreadcrumbList, CollectionPage |
| `/calendar` | Video Game Release Calendar 2026 \| New Upcoming Launches \| TechPlay | September2026 | Never miss a launch… PC, PS5, Xbox Series X/S, and Switch with real-time updates | seo/…QB2N.png | — (no Event/ItemList) |
| `/studios` | Game Studios \| TechPlay | GAME STUDIOS | The developers and publishers behind the games… | generic | — |
| `/studios/activision` | Activision — games, releases and history \| TechPlay | Activision | publisher boilerplate | /og/studio?slug=activision (dynamic) | Organization |
| `/forum` | TechPlay Community Forums \| Global Gaming & Hardware Discussions | TechPlay Community Forum | …share PC build guides, talk esports… | seo/…FXB7.png | — |
| `/leaderboard` | Leaderboard \| TechPlay | Leaderboard | Compete. Climb. Be the legend… | generic | — |
| `/lists` | Game Lists \| TechPlay | GAME LISTS | Rankings made by the community… | generic | BreadcrumbList, CollectionPage |
| `/giveaways` | Giveaways \| TechPlay | GIVEAWAYS | Browse active and past giveaways… | generic | — (**noindex, nofollow**) |
| `/gta6` | GTA 6 — Interactive Map, Characters, Vehicles & Complete Guide \| TechPlay | **(empty H1)** | The most complete GTA 6 resource online — interactive map with 1,000+ locations… Updated weekly. | /gta6/og-hub.png (**2.0 MB**) | VideoGame (datePublished 2026-11-19), BreadcrumbList |
| `/gta6/map` | GTA 6 Interactive Map — 1,000+ Locations in Vice City & Leonida \| TechPlay | GTA 6 Interactive Map 1,058 locations | … | /gta6/og-map.png | VideoGame, BreadcrumbList |
| `/gta6/characters` | GTA 6 Characters — Jason, Lucia & Every Confirmed Cast Member \| TechPlay | GTA 6 Characters | … | /gta6/og-characters.png | BreadcrumbList, VideoGame, ItemList |
| `/gta6/vehicles` | GTA 6 Vehicles — Every Confirmed Car, Bike, Boat & Aircraft \| TechPlay | GTA 6 Vehicles | … | /gta6/og-vehicles.png | BreadcrumbList, VideoGame, ItemList |
| `/gta6/everything-we-know` | GTA 6: Everything We Know (Updated 2026) — Release Date, Map, Story & Cast \| TechPlay | GTA 6: Everything We Know | …November 19 2026 release date… | /gta6/og-everything-we-know.png | FAQPage, BreadcrumbList |
| `/wow-analyzer` | WoW Character Analyzer — Free Midnight Readiness Score & Gear Check \| TechPlay | Ready for Midnight expansion? | …Free WoW analyzer tool - no login | /WoW%20Analyzer.png (**2.5 MB**) | WebApplication, BreadcrumbList, FAQPage; robots only `index, follow` |
| `/backlog-advisor` | Backlog Advisor \| TechPlay | Backlog Advisor | Personalised game recommendations scored against your own collection… | generic | BreadcrumbList, WebApplication |
| `/tools` | Gaming Tools \| TechPlay | Gaming Tools | Five tools built here… | generic | BreadcrumbList, ItemList |
| `/last-disc` | The Last Disc \| TechPlay | The Last Disc | An open letter… asking Sony to keep physical PlayStation games alive beyond 2028 | /images/last-disc/last-disc-hero.webp | BreadcrumbList, WebPage |
| `/frontiers` | Frontiers \| TechPlay | **(empty H1)** | A new MMO strategy of clans, territory and resources… | /images/frontiers/frontiers-hero.webp | — |
| `/about` | About TechPlay \| Expert Gaming News & Tech Media Team | Everyone writes about games. We also keep the record of yours. | Meet the experts behind TechPlay… unbiased reviews, hardware analysis, and global gaming news | seo/…3K8W.png | — (no Organization detail beyond site-wide) |
| `/roadmap` | Roadmap \| TechPlay | Roadmap 2026 | See what's coming next for TechPlay… | generic | — |
| `/rating-system` | Game Review Rating System \| Transparent Scoring Methodology \| TechPlay | Our Rating System | …hardware-integrated benchmarks, and expert criteria for 140,000+ titles | seo/…DZ6GY.png | — |
| `/marketing` | Marketing & Advertising \| Partner with TechPlay \| Global Gaming Reach | Advertising & Partnerships | Partner with TechPlay to reach an audience that arrives for the hardware numbers… 2026 media kit | seo/…PQMF.png | — |
| `/support` | Support Us — Back Independent Gaming Media \| TechPlay | Support TechPlay | TechPlay runs without a publisher behind it… | generic | — |
| `/shop` | Shop — Gaming Merchandise & Gear \| TechPlay | Tech Shop | Official TechPlay merchandise, premium gaming gear… hoodies, peripherals | (none found) | — |
| `/contact` | Contact TechPlay \| Media Inquiries, News Tips & Support | Contact Us | …Our global media team responds to all messages within 24 hours. | seo/…8C3M.png | — |
| `/impressum` | Impressum & Legal Notice \| TechPlay \| Global Media Transparency | Impressum | …company registration details, and editorial responsibility | seo/…BSG3.png | — |
| `/register` | Register \| TechPlay | Create Your Player | Create your TechPlay account | generic | **noindex, nofollow**, no canonical |
| `/login` | Login \| TechPlay | (none) | Sign in to your TechPlay account | generic | **noindex, nofollow**, no canonical |
| `/author/adi-zeljkovic` | Articles by Adi Zeljković - TechPlay \| TechPlay | Adi Zeljković | bio text | storage/avatars/…jpg | Person |
| `/profile/me` | me's Profile \| TechPlay | me on TechPlay | me on TechPlay.gg | /og/profile?username=me | **noindex, nofollow** |
| `help.techplay.gg` | Help Centre — Answers and Troubleshooting \| TechPlay | How can we help? | Answers to what we are asked most… | generic | CollectionPage |
| 404 page | TechPlay | This area isn't in the build | (site default) | generic | both `noindex` **and** `index, follow` metas |

Observations from the table:
- FACT — "TechPlay | TechPlay" is duplicated in author titles ("… - TechPlay | TechPlay").
- FACT — The SEO-written titles/descriptions (news, reviews, guides, hardware, games, rating-system, about, contact, impressum) share a voice ("Expert…", "Global…", "2026", "140,000+", "benchmarks") that is not the site's editorial voice and repeats a stale number six times; the pages written in the site's own voice (tools, lists, studios, backlog advisor, support, calendar description) have no such problems.
- FACT — The genre/platform hubs and `/shop` emit no `og:image`; the calendar, the single richest structured page, has no `Event`/`ItemList` schema.

## Appendix B — Numbers consistency matrix (FACT)

| Figure | Homepage | About | `/games` title & 5 meta descriptions | `/register` | `/studios` | GTA 6 hub | WoW Analyzer | docs/README (7 Sep) |
|---|---|---|---|---|---|---|---|---|
| Games | 333,000 | 333,920 | 140,000+ | 50K+ | — | — | — | 333,198 |
| Studios | — | 57,630 | — | — | 31,970 | — | — | 57,630 |
| Pieces published | — | 679 | — | — | — | — | — | 638 (683 in sitemap today) |
| Members | — | — | — | 15K+ | — | "thousands of fans" (newsletter) | "50K+ players analyzed" | 60 users |
| Platforms linkable | 3 | 5 | — | — | — | — | — | Steam/Xbox/PS/GOG/Epic sync jobs exist (5) |
| Rating | — | — | — | — | — | — | 4.9/5 | no rating table for the tool |
| Map locations | — | — | — | — | — | 1,058 (map) / 0 (hub SSR) / "1,000+" (title) | — | — |
| Midnight launch | — | — | — | — | — | — | "March 2, 2026" (past) | — |

## Appendix C — Article-page anatomy as rendered (FACT, `/news/epic-games-…`, top to bottom)

1. Header nav (Discover · Feed · Games · Studios · Community · Tools · Shop · Sign In · Join TechPlay)
2. Breadcrumb "News › Industry" (Industry → `/news/news-industry` = 404)
3. Category pill "Industry" · H1 · "By Adi Zeljković · 26/09/2026 · 3 MIN READ · CATEGORY: Industry · SHARE:" (Facebook / Twitter / LinkedIn / WhatsApp / native)
4. Hero image via `/_next/image?…&w=1920&q=90` (29.6 KB)
5. Pull-quote (= meta description) in quotation marks
6. Body: ≈650 words, 3 H2s, 0 links, 0 images beyond hero
7. "Add TechPlay.gg as a preferred source on Google — See more of our gaming news, reviews and guides when you search for the latest gaming topics."
8. "Stay Connected" · "Tags: Industry Gaming" · "Share:" row (second instance)
9. "The Author — Adi Zeljković — [bio] — View Author Page →"
10. "Follow Us" (Facebook, YouTube, Discord)
11. "Discussion ( 0 )"
12. Sidebar: "About this game — Fortnite · 2020 · 7.7 · Shooter Simulator · Xbox Series X|S PlayStation 4 Nintendo Switch 2 Android · Full game page" · "Popular now" (empty) · "Upcoming releases — Full calendar" (empty) · "Community — Discord — TechPlay Official server — News the moment it publishes · Giveaway pings before they close · Squads, LFG and the editors — Join Discord"
13. Footer (Discord card, About Us · Help Centre · Contact · Advertise With Us · Our Rating System · Roadmap · Shop · Support Us · Privacy · Terms · Cookies · Impressum · RSS · Made by Luminor Solutions)

Missing from this anatomy, relative to a typical gaming-news template: related/next articles, in-body links, source link, newsletter box, "updated" line, comment prompt copy, structured "Key facts" box, tags linking to a tag page (tags render as text only — UNVERIFIED whether clickable; no `href` found for them in SSR).

## Appendix D — Help centre topics as a map of where users get stuck (FACT, help.techplay.gg)

"Read most": 1. How XP and the daily cap work · 2. The Create account button is greyed out · 3. What we import from each platform · 4. Connect your PlayStation account. Topics: Account & sign-in (5 answers, incl. "Your verification email never arrived", "Sign in with Discord", "Reset a forgotten password") · Connected accounts & your library (11 answers: Steam, Xbox, PlayStation, GOG, Epic; "Your Steam library is not syncing") · Your profile · XP, levels & rewards ("Bounty, and what to spend it on", "The daily streak and quests") · Forum & community · Discord ("What Professor Buffy can do", "Your Discord role does not match your rank") · Games & the catalogue ("Three hundred thousand games… A game is missing, or its details are wrong") · Tools & lists · Giveaways ("How giveaways work") · Shop & supporting us (6 answers on ordering/shipping/returns for a shop with 0 products) · Email & notifications ("Stop getting emails", "The newsletter") · Privacy & your data.

- OBSERVATION — Two of the four "read most" articles are registration failures; the library-linking topic has the most answers (11). The help centre documents a product (library sync across five platforms, XP economy, Bounty, quests, Discord roles) that is far larger than what an anonymous visitor can see anywhere on techplay.gg. It is the best available description of the product's depth, and it is on a separate hostname with a single footer link.
