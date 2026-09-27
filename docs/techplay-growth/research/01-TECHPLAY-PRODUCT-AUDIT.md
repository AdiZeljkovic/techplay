# 01 — TechPlay Product Audit (repository)

Status: Phase 1 research draft — 27 Sep 2026
Scope: the whole repository at `/home/user/techplay` — `frontend/` (Next.js 16), `backend/` (Laravel 12 API + Filament admin), `discord/` (Professor Buffy bot), `mobile/` (paused Expo app), `docs/README.md` (the project's only reference document, measured 7 Sep 2026).
Method: two independent read-only audits of the code, cross-checked against the live site audit in `02-TECHPLAY-PUBLIC-PRESENCE.md`. Part A covers the frontend and Part B covers the backend and Discord bot. Every FACT carries a `file:line` citation inside the parts. No production code was changed.

Label key: **FACT** verified in the repository or on a fetched page. **OBSERVATION** seen but not measured. **ESTIMATE** reasoned approximation with its basis stated. **HYPOTHESIS** untested idea. **RECOMMENDATION** suggested action.

## Executive summary

1. **FACT — TechPlay is a platform with a publication attached, not a blog.** The API exposes 305 endpoints under `/api/v1`, about 134 of them for signed-in members (Part B §1). The frontend has 84 page routes and 9 route handlers (Part A §0). Most of that surface is invisible to a logged-out reader.
2. **FACT — The member product is deep and nearly unused.** Library import from five platforms, seven shelf statuses, Gamer DNA, Taste Match, Backlog Advisor, lists, friends, chat, 67 achievements, 20 ranks, a seasonal quest ladder, a Bounty currency and reward store all ship today (Part B §2). The measured funnel in a code comment is 55 registered, 50 confirmed, 21 entered a giveaway, 7 commented, 3 added a game and 2 linked a platform. 45 of 55 members had zero XP.
3. **FACT — There is no automated email of any kind.** 20 of 22 notification classes are database-only. The Friday weekly digest only reaches the on-site bell. The newsletter desk (since 11 Sep 2026) works but every campaign is written and sent by hand (Part B §2.11–2.12, §3).
4. **FACT — There is no web push and no service worker.** The PWA manifest exists, so the site is installable but silent (Part A §7).
5. **FACT — Newsletter capture lives in three places only.** The section-hub sidebar, the GTA 6 hub and the Frontiers page. The homepage has none, yet the unsubscribe page links to a `/#newsletter` anchor that does not exist (Part A §3.2).
6. **FACT — The games database is enormous and almost entirely borrowed.** 295,024 indexable game URLs, of which 1,967 (0.7%) carry anything TechPlay wrote (docs/README.md §12). Game pages render genres, tags and platforms as plain text, so they pass no internal links to the facet hubs (Part A §4.8).
7. **FACT — Structured data has provable defects.** The WebSite SearchAction targets a `/search` route that does not exist and robots.txt disallows. Review pages emit the Product JSON-LD twice. `SchemaService` (Review, HowTo, VideoObject) is read only by a staff debug endpoint (Part A §4.2, Part B §12).
8. **FACT — The only built-in viral loop is the giveaway system.** It has referral codes, share tasks, a daily streak and a per-giveaway leaderboard. The giveaway hub is `noindex, nofollow` and reminders are bell-only (Part A §1.4, Part B §2.9).
9. **FACT — The Discord bot is the most active owned channel.** It pushes every published article, welcomes joiners, mirrors XP, posts a Sunday recap and offers 20 slash commands. Its `/daily` reward bypasses the XP cap and ledger that the rest of the economy respects (Part B §2.7, §8).
10. **FACT — Search visibility collapsed on 17 Aug 2026.** Cloudflare served a 403 challenge to Googlebot for about two and a half weeks. Clicks went from about 100 a day to 1–2 a day and had not recovered by 7 Sep 2026 (docs/README.md §12). Every growth plan starts from that baseline.

## Measured baseline (docs/README.md, 7 Sep 2026 unless stated)

| Metric | Value |
|---|---|
| Published articles | 635 of 638 |
| Games in database | 333,198 |
| Indexable game URLs in sitemaps | 295,024 |
| Game pages with TechPlay-written content | 1,967 (0.7%) |
| Studios | 57,630 |
| Registered users | 60 |
| Shelf entries | 2,599 |
| Connected platform accounts | 13 |
| Comments | 22 |
| Forum threads | 7 |
| Game lists | 4 |
| Giveaways | 2 |
| Google: indexed / not indexed | 56,355 / 338,358 |
| Google clicks per day | 1–2 (about 100 before 17 Aug 2026) |
| Googlebot requests per day | about 290, of which 77 game pages |
| GA consent rate before 20 Sep 2026 | 2–7% |
| US share of traffic | about 35% |
| Discord members (live audit, 27 Sep 2026) | 160 |
| YouTube subscribers (live audit, 27 Sep 2026) | 20, no videos found |

## Consolidated capability map — the features that matter most for growth

Ratings are ESTIMATE (Low/Med/High) built from the two detailed maps in Part A §2 (45 rows) and Part B §10 (45 rows). "State" is FACT.

| Feature | State | Discovery | SEO | Social | Registration | Retention | Referral | Biggest weakness | Opportunity (HYPOTHESIS) |
|---|---|---|---|---|---|---|---|---|---|
| News / reviews / hardware articles | Live, ~3.5 news/day, 38 reviews, 4 guides | High | High | Med | Low | Med | Low | Zero contextual internal links, broken breadcrumb category URLs (see 02) | Link every article to its game page, calendar entry and shelf action |
| Game database pages | Live, 295k indexable | High | High (potential) | Low | Low | Low | Low | 0.7% original content, crawl budget 77 pages/day | Enrich by demand; reader reviews as the "ours" layer |
| Facet hubs (genre/platform/year/tag/series/studio) | Live | High | High | Low | Low | Low | Low | No editorial copy; not linked from game pages | "Best X games" hubs with editor intros |
| Release calendar + reminders | Live, own 4-store aggregator | High | High | Med | Med | High | Med | Reminders never leave the site | Release-day email, Discord DM, calendar export |
| Cross-platform library import | Live (Steam, Xbox, PSN, GOG, Epic) | Med | Low | Med | High | High | Med | PSN/GOG/Epic need pasted codes; 2 of 55 linked | Headline onboarding step; shareable library card |
| Shelves, wishlist, shelf worth | Live, 7 statuses, nightly Steam prices | Low | Low | High | High | High | High | Steam-only, US prices | Price-drop alerts; "my library is worth" card |
| Gamer DNA / Taste Match | Live | Low | Low | High | High | Med | High | No share image; needs both sides signed up | "Compare with me" invite link |
| Backlog Advisor | Live, auth-only | Med | Med | Med | High | High | Med | Nothing to index for guests | Public quiz version ending in sign-up |
| XP, ranks, achievements, quests, seasons, Bounty | Live, complete economy | Low | Low | Med | Med | High | Low | Invisible to guests; tiny population | Season launches as marketing beats |
| Giveaways | Live, referral + share tasks + streak | High | Med | High | High | Med | High | Hub is noindex; reminders bell-only | The one ready-made viral loop |
| Forum and comments | Live, 7 threads, 22 comments | Med | Med | Med | High | High | Med | Empty rooms read as dead | Seed per-release threads; Discord bridge |
| Lists and tier lists | Live, 4 lists | Med | Med | High | High | Med | High | Almost none created | Prompted list campaigns |
| GTA 6 hub | Live, 121 vehicles, 36 weapons, 12 characters, 1,058 locations | High | High | Med | Low | Med | Med | GTA 6 news attached to the wrong game page (see 02) | Launch-window authority play (see 17) |
| WoW Analyzer | Live, Groq + Blizzard + Raider.IO | Med | Med | High | Med | Med | High | Copy still aimed at Midnight launch | Re-aim at current patch; share cards |
| Newsletter desk | Live since 11 Sep 2026, manual | Low | Low | Low | Med | High | Low | No automation, three capture points | Automated weekly + personalised releases mail |
| Discord bot | Live, 20 commands, 160 members | Med | Low | High | High | High | Med | No scheduled content beyond the recap | Daily release/giveaway posts from existing endpoints |
| Web push | Absent | — | — | — | — | — | — | Not built | Release-day and followed-game alerts |
| Shop / supporter tiers | Unlaunched, PayPal sandbox | — | — | — | — | — | — | 0 products | Defer until audience exists |

## How to read the rest of this file

- **Part A — Frontend.** Route inventory, 45-row capability map, every conversion point with its real copy, SEO and social-metadata audit, mobile notes, newsletter/push/RSS inventory, and things that look wired but are not.
- **Part B — Backend and Discord bot.** All 305 endpoints by area, the full gamification data model with values, the notification catalogue, the newsletter system, the content model and Filament resources, the games database schema, GTA 6 and tool back ends, the bot's commands and automations, search, a 45-row capability map, and the wired-but-unused list.

---

# Part A — Frontend audit


## A. Executive summary

1. FACT — The frontend is a mature, heavily-commented Next.js 16 app with 84 page routes and 9 route handlers. Metadata is centralised in `lib/seo.ts` (`generatePageMetadata`) which reads `page_seo` and `site_settings` from the API, always emits a canonical, `x-default`, robots block and the admin's default OG image (`frontend/lib/seo.ts:149-278`). Article, review, guide, game, studio, profile, list, forum-thread and GTA6 pages all emit server-rendered JSON-LD.
2. FACT — Registration is asked for in exactly the right places for a growth funnel but the asks are thin: header "Join TechPlay" (`components/layout/Header.tsx:1227`), one `JoinPrompt` under every article body (`components/news/ArticleDetailView.tsx:333`), the homepage `ProfileCtaBand` "Start your library" (`components/home/ProfileCtaBand.tsx:107`), comment box "Join the Conversation" (`components/comments/CommentsSection.tsx:267`), and SignInWalls on gated tools. There is no exit-intent, no scroll-triggered, no game-page-level account pitch beyond `/login` buttons.
3. FACT — Newsletter capture exists in only three surfaces: the section-hub sidebar "Stay in the loop" (`components/editorial/SectionHub.tsx:620-640`), the GTA6 hub "Join the Crew" (`components/gta6/Gta6NewsletterCTA.tsx:51-78`) and the Frontiers "Notify me" (`app/frontiers/FrontiersClient.tsx:63-121`, which posts to the same generic `/newsletter/subscribe`). The homepage has no newsletter block, yet `app/newsletter/unsubscribed/page.tsx:46` links to `/#newsletter`, an anchor that does not exist anywhere in `app/` or `components/` (grep, 0 hits besides that link).
4. FACT — There is no service worker, no web-push, no `PushManager` or `Notification.requestPermission` anywhere in the frontend (grep over `*.ts,*.tsx,*.js,*.json` excluding node_modules: 0 hits). `manifest.json` exists with `display: standalone` and three shortcuts, so the PWA is "installable" but silent.
5. FACT — Share surfaces are consistent (one `SocialShare` component: X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit, copy, native share — `components/share/SocialShare.tsx:38-45`) and appear on articles, reviews, guides, giveaways (as tasks), lists, profiles (rendered share card), forum threads and The Last Disc. Three generated OG-image routes exist (`/og/list`, `/og/profile`, `/og/studio`), all edge runtime.
6. FACT — Discoverability weaknesses provable from code: `/social`, `/verify-email`, `/newsletter/verify`, `/calendar/[slug]`, `/giveaway/[slug]` and forum threads emit no robots block of their own and inherit `index,follow`; `/giveaway/[slug]` emits no canonical at all; `/author/[slug]` doubles the site name in `<title>` ("Articles by X - TechPlay | TechPlay", `app/author/[slug]/page.tsx:39` + root template `app/layout.tsx:101-104`); review pages emit the Product JSON-LD twice (server in `app/reviews/[slug]/page.tsx:186-231`, again client-side via `next/script` in `components/reviews/ReviewDetailView.tsx:82-113`); `WebSite.potentialAction` points at `/search?q=` (`app/layout.tsx:207`) but no `/search` page exists (no `app/search/` directory; `robots.txt` also disallows `/search`, `backend/app/Http/Controllers/SitemapController.php:819`).
7. FACT — `/giveaways` (the hub) is deliberately `noindex, nofollow` (`app/giveaways/page.tsx:10`) while individual giveaways are indexable — the opposite of what a "win a prize" acquisition funnel usually wants. HYPOTHESIS: this was set when the hub was empty and never revisited.
8. FACT — Mobile: a five-tab bottom bar (Home, Feed, You/Sign in, Games, Forum; `components/layout/MobileTabBar.tsx:75-83`), a "More" sheet, 44px touch floors, safe-area padding and reduced-motion guards are all in code. OBSERVATION: article pages on phones carry three ad units after the body (`InArticleAd`, `article_mid`, `DisplayAd 250px`) before the comments, so the comment/registration CTAs are pushed under ads on the device that supplies most of the paid-ad traffic (JoinPrompt comment says 1,487 phone vs 184 desktop requests from one campaign, `components/news/JoinPrompt.tsx:22-24`).
9. FACT — Analytics: GA4 (`G-0J974Y0X23` fallback) is loaded in `<head>` through a first-party proxy (`/proxy/gtag`, `/proxy/ga`), Consent Mode v2 default comes from an nginx-served `/consent` script, Google's own CMP (Funding Choices) is the banner, and the GA relay also copies hits to the backend's own counter (`docs/README.md §19`). GlitchTip (Sentry SDK) captures client and server errors with tracing off.
10. RECOMMENDATION (summary) — The biggest frontend-side growth gaps are all wiring, not design: no homepage/email capture, no web-push, no per-game "follow/remind me" for guests, a noindex giveaway hub, no hreflang/regional targeting despite a Balkan-founded EU/US audience, and no schema for the 40 000+ studio/series/facet pages beyond CollectionPage/Organization. Each of these is detailed below with file evidence.

---

## A.0. Method and scope

- FACT — Files enumerated with `find frontend/app -name "*.tsx" -o -name "*.ts"` (185 files), `frontend/components/**` (204 files), `frontend/lib`, `frontend/context`, `frontend/hooks`, `frontend/public`, `next.config.ts`, `package.json`. Line numbers are from `cat -n` on 27 Sep 2026.
- FACT — `docs/README.md` §6 says "84 stranice, 5 route handlera"; the tree actually contains 9 route handlers (`/api/revalidate`, `/rss`, `/feed`, `/proxy/gtag`, `/proxy/ga/[...path]`, `/og/list`, `/og/profile`, `/og/studio`, `/app-check`). The README's count is stale by four (the three OG routes and `/app-check`).
- OBSERVATION — Nearly every file carries long rationale comments describing measured incidents (e.g. "0 anchors into a catalogue of 332,455 games, measured on production", `app/games/page.tsx:72-73`). Those numbers are quoted here as FACT-in-code, i.e. what the developer wrote, not as fresh measurements.

---

## A.1. Route inventory

Legend: **Render** = `export const revalidate` / `dynamic` as written in the page file; **Meta** = `generateMetadata` (GM), static `metadata` (S), or none (−); **LD** = JSON-LD `@type`s emitted server-side; **Canon** = canonical tag; **OG img** = og:image source; **noindex** = robots directive; **CTA** = primary conversion element on the page.

### A.1.1 Home, feed, editorial

| Route | Purpose | Render | Auth | Meta | LD | Canon | OG img | noindex | Primary CTA |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Homepage: hero + search, quick links, discover rail, editorial, review wall, hidden gems, on-this-day, profile CTA band | `revalidate = 60` (`app/page.tsx:8`); `/home` fetch 60 s, `/games/hub` 3600 s | no | GM via `generatePageMetadata('/')` (`app/page.tsx:10-12`) | Organization + WebSite/SearchAction from root layout (`app/layout.tsx:175-217`); SiteNavigationElement injected client-side after hydration (`components/seo/GlobalSeo.tsx:40`) | yes (`lib/seo.ts:240`) | admin `seo_og_image_default` with measured w/h (`lib/seo.ts:210-216`) | no | "Start your library" → `/register` (`components/home/HomeHero.tsx:111`); "Browse the catalogue"; QuickLinks "My Games → /login" (`components/home/QuickLinksBand.tsx:18`); `ProfileCtaBand` "Start your library" (`ProfileCtaBand.tsx:103-108`) |
| `/latest` | Mixed feed of all sections ("The Feed"; the mobile tab) | `revalidate = 300` (`app/latest/page.tsx:10`) | no (client filters) | GM (`:12-17`) | − | yes | default | no | "Sign in" / "add games" inline (`components/editorial/FeedClient.tsx:184,190`) |
| `/news` | News hub (SectionHub) | `300` (`app/news/(index)/page.tsx:8`) | no | GM, title "Gaming News" (`:21-25`); `news/layout.tsx` also carries a static block (title "Gaming News - Breaking Headlines & Industry Updates", canonical `/news`, `app/news/layout.tsx:116-128`) that the page overrides | − (no CollectionPage/ItemList) | yes | default | no | Sidebar newsletter "Stay in the loop → Subscribe" (`components/editorial/SectionHub.tsx:620-640`) |
| `/news/page/[n]` | Archive pages 2..500 | `300` (`app/news/page/[n]/page.tsx:65`) | no | GM; title "Gaming News — page N"; `ROBOTS_INDEX` forced (`:79-91`) | − | yes, self | default | no; `notFound()` past last page (`:103`) | pager links (`SectionHub.tsx:224-301`) |
| `/news/[slug]` | Article OR category hub (slug matched against `NEWS_CATEGORIES`, `lib/categories.ts:7-17`) | `revalidate = false`, on-demand by tag (`app/news/[slug]/page.tsx:14,71-73`) | no | GM; search title = `meta_title\|\|title`, social title = full headline (`:170-174`) | NewsArticle w/ speakable, Person author `/author/{author_slug}` (`:289-317`) + BreadcrumbList (client `Breadcrumbs`, `ArticleDetailView.tsx:144-150`) | `article.canonical_url \|\| /news/{slug}` (`:243`) | featured image, alt, w/h when measured (`:207-221`) | `article.is_noindex`; empty category → noindex (`:131,247`) | `JoinPrompt` ("Create your profile" / "Enter the giveaway", `JoinPrompt.tsx:228,319`), comments box, Save (members), share row, Google News "preferred source" |
| `/reviews` | Reviews hub | `600` (`app/reviews/(index)/page.tsx:8`) | no | GM "Game Reviews" | − | yes | default | no | newsletter sidebar |
| `/reviews/page/[n]` | Archive | `300` | no | GM | − | yes | default | no | pager |
| `/reviews/[slug]` | Review OR category hub | `false` (`app/reviews/[slug]/page.tsx:12`), fetch tags | no | GM; description falls back to "Rating: X/10. Read our full review…" (`:111-112`) | Product{review: Review, aggregateRating ratingCount "1"} (`:186-224`) **and a second Product block client-side** (`components/reviews/ReviewDetailView.tsx:82-113`, `next/script`) + BreadcrumbList | yes | cover/featured | `is_noindex` | share, comments, "Buy now — {price}" store link in sidebar (`components/reviews/ReviewSidebar.tsx:349-358`) |
| `/guides` | Guides hub | `900` | no | GM "Gaming Guides & Tutorials" | − | yes | default | no | newsletter sidebar |
| `/guides/page/[n]` | Archive | `300` | no | GM | − | yes | default | no | pager |
| `/guides/[slug]` | Guide detail (steps, helpful votes) | `false` (`app/guides/[slug]/page.tsx:10`), fetch 900 s | no | GM; reads `seo_title/seo_description` (`:68-69`) | Article (server, `:123-148`) + HowTo (client component, plain `<script>`, `components/guides/GuideDetailView.tsx:104-116,135-140`) + BreadcrumbList | `guide.canonical_url \|\| /guides/{slug}` | featured | `guide.is_noindex` | "Sign in to answer" helpful vote (`GuideHelpful.tsx:121`), share, comments |
| `/hardware` | Tech hub ("Hardware Lab") | `600` | no | GM "Hardware Lab" | − | yes | default | no | newsletter sidebar |
| `/hardware/page/[n]` | Archive | `300` | no | GM | − | yes | default | no | pager |
| `/hardware/[category]` | Tech article OR category (`HARDWARE_CATEGORIES`) | `600` (`app/hardware/[category]/page.tsx:13`) | no | GM | NewsArticle (`:184-209`); author URL uses `username`, not `author_slug` (`:200`) — inconsistent with news (`news/[slug]/page.tsx:307`) | yes | featured | `is_noindex`, empty cat → noindex | same as news |
| `/author/[slug]` | Author profile + article grid | `3600` (`app/author/[slug]/page.tsx:10`) | no | GM; `title: "Articles by X - TechPlay"` (`:39`) → root template appends "\| TechPlay" again | Person (jobTitle, worksFor, sameAs incl. `/profile/{username}`) (`:73-91`) | yes (`:57-59`) | avatar, `twitter.card: summary` (`:47-55`) | `ROBOTS_INDEX` | author social links (X, LinkedIn, YouTube, Instagram, website; `components/author/AuthorHeader.tsx:100-133`) — no "follow author" action |

### A.1.2 Games database and studios

| Route | Purpose | Render | Auth | Meta | LD | Canon | OG img | noindex | Primary CTA |
|---|---|---|---|---|---|---|---|---|---|
| `/games` | Catalogue hub: first 24 games SSR in Suspense fallback, then client hub with filters | `3600` (`app/games/page.tsx:29`) | no | GM "All Games" | − | yes | default | no | search, filter chips; `GamesIndexShell` H1 + 24 hrefs for crawlers (`components/games/GamesIndexShell.tsx:42-60`) |
| `/games/[slug]` | Game detail (hero, trailer, gallery, about, related shelves, languages, sysreq, box art, member lists, news & reviews, tags, series, similar, forum threads, attribution) | `dynamic = "force-dynamic"` — Cloudflare/nginx cache instead of ISR (`app/games/[slug]/page.tsx:25-30`) | no | GM (`:217-295`); title `Name (Year)`; description = first sentence ≤155 or templated fallback | VideoGame (+AggregateRating when reader ratings exist, +VideoObject trailer, dev/pub Organization with `@id` → `/studios/{slug}`) (`:1108-1145`) + BreadcrumbList (`:1151-1156`) | hardcoded `https://techplay.gg/games/{slug}` (`:274`) | `cover_url` declared `1280x720` for every game (`:281-283`) | `index:false, follow:false` when plain description ≤ 50 chars (`:267,273`) | `TrackGameButton` (guest → `/login`), `AddToListButton` "Save to a list", `GameRating` "Sign in to rate this game" (`components/games/GameRating.tsx:320`), "Start a Thread" `rel=nofollow` (`GameForumThreads.tsx:56-62`), "Where to get it" store links (`:592-660`) |
| `/games/genre/[genre]` | Curated facet (14 genres with landing copy, `GENRE_META`) | `86400`, `dynamicParams = true` (`app/games/genre/[genre]/page.tsx:6-7`) | no | GM; title "Best {Genre} Games in 2026" (`:16-98`) | BreadcrumbList + CollectionPage (`:167-183`) | hardcoded domain (`:113`) | **none** (openGraph defined without `images`, which replaces the root's OG object) | `index:false, follow:true` unless curated AND stocked (`:121-145`) | none — grid only |
| `/games/platform/[platform]` | 5 curated platforms | `86400` | no | GM "Best {Platform} Games in 2026" | Breadcrumb + CollectionPage | yes | none | same rule (`app/games/platform/[platform]/page.tsx:67-91`) | none |
| `/games/tag/[tag]` | ~20 curated tags (open-world, co-op, souls-like…) | `86400` | no | GM | Breadcrumb + CollectionPage | yes | none | same rule (`app/games/tag/[tag]/page.tsx:150-186`) | none |
| `/games/year/[year]` | "Best Games of {year}" | `86400` | no | GM | Breadcrumb + CollectionPage | yes | none | noindex,follow when year outside plausible range (`app/games/year/[year]/page.tsx:36-46`) | none |
| `/games/series/[slug]` | Series page (oldest-first) | `86400` (`app/games/series/[slug]/page.tsx:24`) | no | GM; OG title "{title} \| TechPlay" | BreadcrumbList + VideoGameSeries w/ VideoGame parts (`:129-160`) | yes | none | `worthIndexing(series)` else index:false,follow:true (`:108`) | none |
| `/studios` | Studios directory, first page SSR | `3600` (`app/studios/page.tsx:23`) | no | GM "Game Studios" | − | yes | default | no | none |
| `/studios/[slug]` | Studio detail | `3600` (`app/studios/[slug]/page.tsx:65`) | no | GM; title "{name} — games, releases and history" (`:79`) | Organization (+PostalAddress, parentOrganization) (`:169-178`) | relative `/studios/{slug}` (`:85`) | generated `/og/studio?slug=` 1200×630 (`:112-128`) | `studio.indexable ? ROBOTS_INDEX : index:false,follow:true` (`:100`) | none |
| `/studios/country/[iso]` | Studios by country | `3600` | no | GM "Game studios in {country}" (`app/studios/country/[iso]/page.tsx:40-49`) | − | yes | inherits root (default) | inherits `ROBOTS_INDEX`; 404 when empty (`:56`) | none |

### A.1.3 Calendar, tools, GTA6

| Route | Purpose | Render | Auth | Meta | LD | Canon | OG img | noindex | Primary CTA |
|---|---|---|---|---|---|---|---|---|---|
| `/calendar` | Release calendar (client, seeded with current month) | page: none set; fetch `900` (`app/calendar/page.tsx:33-38`) | no | GM (`:14-19`); `calendar/layout.tsx` static title "Release Calendar" | − | yes | default | no | Wishlist / "Remind me on release day" → "Sign in to track releases." for guests (`app/calendar/CalendarClient.tsx:140,626`) |
| `/calendar/[slug]` | Single upcoming release | `3600` | no | GM (`app/calendar/[slug]/page.tsx:57-103`) | − | **cross-canonical to `/games/{slug}`** (`:91`) | `cover_url` | inherits index (with canonical elsewhere) | "Add to wishlist", "Remind me on release day" (`ReleaseClient.tsx:97-123`) |
| `/tools` | Tools directory | `86400` (`app/tools/page.tsx:17`) | no | GM "Gaming Tools" | BreadcrumbList + ItemList of 5 tools (`:31-59`) | yes | default | no | tool cards |
| `/wow-analyzer` | WoW character readiness tool | none set (client tool) | no login required (meta says so, `app/wow-analyzer/page.tsx:7`) | S; ~100 `keywords` entries (`:8-120`) | WebApplication (Offer 0) + BreadcrumbList + FAQPage (5 Q) (`:177-270`) | `https://techplay.gg/wow-analyzer` (`:169`) | `/WoW Analyzer.png` (2,553,851 bytes, space in filename, `public/`) | no | analyse form |
| `/backlog-advisor` | Personalised "what to play next" from own library | none | **SignInWall** (`app/backlog-advisor/AdvisorClient.tsx:258`) | GM (`app/backlog-advisor/page.tsx:6-12`) | WebApplication + BreadcrumbList (`:31-58`) | yes | default | no (gated page is indexable) | "Sign in" wall; "Add a few games first" empty state (`AdvisorClient.tsx:465`) |
| `/last-disc` | Campaign page: countdown, poll, signature form, coverage | `900` (`app/last-disc/page.tsx:10`) | no (sign by email) | S (`:12-31`) | BreadcrumbList + WebPage{mainEntity Article} (`:99-130`) | yes | hero webp 1983×793 | no | "Sign the open letter" email form (`LastDiscClient.tsx:296-425`), `ShareRow` FB/X/Reddit/copy (`app/last-disc/ShareRow.tsx:18-34`) |
| `/last-disc/letter` | The full letter | inherits | no | S (`app/last-disc/letter/page.tsx:5-36`) | BreadcrumbList + Article (author "The TechPlay community") (`:119-146`) | yes | hero webp | no | back to sign |
| `/frontiers` | Teaser for an unreleased MMO-strategy product | none | no | S (`app/frontiers/page.tsx:6-25`) | − | yes | `frontiers-hero.webp` 1672×941 | no | "Notify me" — posts to the **generic newsletter** endpoint (`FrontiersClient.tsx:76`) |
| `/gta6` | GTA 6 hub (countdown, hype bar, trailers, pre-order, newsletter) | `3600` (`app/gta6/page.tsx:14`) | no | GM (`:20-35`); title "GTA 6 — Interactive Map, Characters, Vehicles & Complete Guide" | VideoGame (Rockstar, datePublished 2026-11-19) + BreadcrumbList (`:88-110`) | yes | `/gta6/og-hub.png` (exists) | no | "Join the Crew" newsletter (`Gta6NewsletterCTA.tsx:77`); "or join our Discord community" → `discord.gg/techplaygg` (`:7,85`) — **a different invite than the footer's `discord.gg/wPQG9gUMXH`** (`Footer.tsx:50`) |
| `/gta6/characters` | Character list | `3600` | no | GM | BreadcrumbList + VideoGame | yes | `og-characters.png` | no | — |
| `/gta6/characters/[slug]` | Character profile | `3600`, `generateStaticParams` (`app/gta6/characters/[slug]/page.tsx:9-27`) | no | GM; word-clamped description (`:63-96`) | Person + BreadcrumbList (4 levels) (`:121-137`) | yes | character image | no | — |
| `/gta6/vehicles`, `/gta6/weapons` | Entity grids | `3600` | no | GM | BreadcrumbList + VideoGame | yes | `og-vehicles.png` / `og-weapons.png` | no | — |
| `/gta6/map` | Leaflet interactive map | `86400` | no | GM | VideoGame + BreadcrumbList | yes | `og-map.png` | `ROBOTS_INDEX` explicit | — |
| `/gta6/everything-we-know` | Evergreen explainer + FAQ | `86400` | no | GM | FAQPage + BreadcrumbList (`app/gta6/everything-we-know/page.tsx:76-90`) | yes | `og-everything-we-know.png` | no | — |

### A.1.4 Community: forum, profiles, lists, leaderboard, social, giveaways

| Route | Purpose | Render | Auth | Meta | LD | Canon | OG img | noindex | Primary CTA |
|---|---|---|---|---|---|---|---|---|---|
| `/forum` | Boards index (client) | none; layout template `%s \| TechPlay Forum` (`app/forum/layout.tsx:17-33`) | no | GM "Community Forums" (`app/forum/(boards)/page.tsx:5-21`) | − | yes (self) | default | no | Sidebar "Join the community → Sign in / Register" (`components/forum/ForumSidebar.tsx:129-144`); "New thread" |
| `/forum/[category]` | Board, first page SSR | `dynamic = "force-dynamic"` (`app/forum/(boards)/[category]/page.tsx:25`) | no | GM via `generatePageMetadata` (`:79`) | − | yes | default | no | same |
| `/forum/thread/[slug]` | Thread, opening post + 15 replies SSR | `force-dynamic` (`app/forum/(boards)/thread/[slug]/page.tsx:21`) | reply requires login | GM; title = thread title, description = excerpt (`:60-87`) | DiscussionForumPosting w/ InteractionCounter (`:104-127`) | relative `/forum/thread/{slug}` | **none** (openGraph without images) | inherits index | Reply box (members), "Share" (`ThreadClient.tsx:953-957`), watch (bell), bookmark, poll vote |
| `/forum/search` | Search (client) | — | no | S in layout; `index:false, follow:true` (`app/forum/(boards)/search/layout.tsx:14-18`) | − | − | − | yes | — |
| `/forum/create` | New thread | — | login | S; `noindex,nofollow` (`app/forum/create/layout.tsx:17-19`) | − | − | − | yes | — |
| `/forum/rules` | Guidelines | — | no | S; canonical `/forum/rules` (`app/forum/(boards)/rules/page.tsx:12-22`) | − | yes | none | no | — |
| `/profile/[username]` | Public player profile (Overview, Library, Timeline, Lists, Progression*, Achievements, Rewards*, Stats) — `*` owner-only (`lib/profileTabs.ts:25-60`) | layout fetch `300` (`app/profile/[username]/layout.tsx:60-63`); page is client | viewing public; `/profile/me` → SignInWall | GM in layout; description built from counts ("X games, Y hours played…", `:26-42`) | − (no Person/ProfilePage) | yes (`:105`) | generated `/og/profile?username=` 1200×630 (`:79,106-117`) | noindex when missing or `can_view === false` (`:85,104`) | Add friend, Message, Share card, "Recognise", Taste match; owner: Welcome onboarding "Connect Steam / Connect Xbox / Pick games by hand" (`components/profile/WelcomeOnboarding.tsx:142-193`) |
| `/settings` | Account settings (profile, connections, notifications, privacy, security, your data) | client | login | S; `noindex` (`app/settings/page.tsx:4-8`) | − | − | − | yes | Connect Steam / Xbox / PlayStation / Epic / GOG (`components/settings/ConnectedAccountsSection.tsx:89-150`) |
| `/friends`, `/messages` | Redirects to `/social` (`app/friends/page.tsx:5`, `app/messages/page.tsx:5`) | server redirect | — | − | − | − | − | − | — |
| `/social` | Social hub: DMs, group chats, friends, requests, blocked | client | **SignInWall** (`app/social/SocialClient.tsx:629-632`) | S: title + description only (`app/social/page.tsx:4-7`) | − | **none** | inherits default | **inherits index** (a login-walled page) | "Squad Up." sign-in wall |
| `/lists` | Community game lists directory | `600` (`app/lists/page.tsx:25`) | no | GM "Game Lists" | BreadcrumbList + CollectionPage/ItemList (`:36-75`) | yes | default | no | none for guests |
| `/lists/[username]/[slug]` | One list (podium, tier board, comments, likes) | fetch `300` (`app/lists/[username]/[slug]/page.tsx:30`) | no | GM; title "{list} — a game list by {owner}" (`:36-67`) | ItemList w/ author (`:397-405`) | yes (`:55`) | generated `/og/list` (tier lists draw the board) (`:48`, `app/og/list/route.tsx:97-120`) | 404-list → noindex | Like ("Sign in to like this list.", `ListSocialBar.tsx:49`), Comments, Share |
| `/lists/tag/[tag]` | Lists by tag | `600` | no | GM (`app/lists/tag/[tag]/page.tsx:15-30`) | − | relative | none (openGraph without images) | 404 when empty (`:57`) | — |
| `/leaderboard` | XP/reputation/collection rankings, season timer | client | no (own row needs login) | GM + custom OG copy "Compete. Climb. Be the legend." (`app/leaderboard/page.tsx:10-25`) | − | yes | default | no | "Change it in settings to compete" for private profiles (`LeaderboardClient.tsx:428`) |
| `/giveaways` | Giveaway hub | client | no | GM then **`robots: {index:false, follow:false}`** (`app/giveaways/page.tsx:10`) | − | yes | default | **yes** | — |
| `/giveaway/[slug]` | Giveaway detail with 12 task types, referral link, entries | client; meta fetch `60` (`app/giveaway/[slug]/page.tsx:71`) | enter requires login | GM; OG title prefixed "🎁" (`:111`); measured image size (`:99-106`) | − | **none** (no `alternates` in the returned object, `:107-127`) | featured/prize image | inherits index | Enter, tasks "Follow / Subscribe / Join / Share / Invite" (`GiveawayClient.tsx:144-156`) |

### A.1.5 Commerce, static, legal, auth, help

| Route | Purpose | Render | Auth | Meta | LD | Canon | OG img | noindex | Primary CTA |
|---|---|---|---|---|---|---|---|---|---|
| `/shop` | Merch shop (currently renders "Coming Soon" empty state when no products, `app/shop/ShopClient.tsx:179-181`) | client | no | S; canonical; `ROBOTS_INDEX` (`app/shop/page.tsx:6-35`) | − | yes | default (comment: `/og-shop.png` never existed, `:19-23`) | no | Add to cart |
| `/shop/[slug]` | Product | `900` (`app/shop/[slug]/page.tsx:24`) | no | GM (`:57-92`) | − (no Product/Offer) | relative | product image | not-found → noindex | Add to cart / PayPal |
| `/shop/checkout`, `/cart` | Checkout, cart | client | — | cart: `noindex` (`app/cart/page.tsx:4-7`); checkout: none | − | − | − | cart yes | PayPal |
| `/support` | Donation tiers (PayPal subscriptions) | `300` (`app/support/page.tsx:8`) | no | GM "Support TechPlay" | − | yes | default | no | tier cards; "Support tiers are unavailable right now" when empty (`SupportTiers.tsx:22`) |
| `/support/checkout` | Tier checkout | client | — | none | − | − | − | inherits index | PayPal |
| `/about` | Mission, counted figures, team | `3600` (`app/about/page.tsx:16`) | no | GM; "independent gaming and hardware publication from Sarajevo… over 330,000 games" (`:19-23`) | **none** (grep `ld+json` in about: 0) | yes | default | no | section links |
| `/contact` | Inboxes redakcija@/marketing@/support@ + form | — | no | GM + layout static block | − | yes | default | no | contact form (Turnstile) |
| `/marketing` | "Advertise with us" | — | no | GM (`app/marketing/page.tsx:5-10`) | − | yes | default | no | mailto; "Agency? Ask for our agency rate card." (`MarketingClient.tsx:186`) |
| `/rating-system`, `/roadmap`, `/privacy`, `/terms`, `/cookies`, `/impressum` | Static/legal | `3600` where set | no | GM via `generatePageMetadata` | − | yes | default | no | roadmap: `RoadmapCTA` → `/register` (`components/roadmap/RoadmapCTA.tsx:52`) |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Auth | — | — | S; `noindex,nofollow` (`app/(auth)/*/page.tsx`) | − | − | − | yes | "Create Player" / "Sign up with Google" / Discord / Battle.net (`RegisterClient.tsx:439-482`) |
| `/verify-email` | Post-registration verification | client | — | **none** (inherits root: index) | − | − | − | **no** | "Resend" |
| `/auth/callback` | OAuth landing | client | — | none | − | − | − | no | — |
| `/newsletter/verify` | Double-opt-in landing (client) | client | — | **none** (inherits index) | − | − | − | **no** | auto-redirect home after 3 s (`app/newsletter/verify/page.tsx:35`) |
| `/newsletter/unsubscribed` | Receipt | server | — | S; `noindex` (`app/newsletter/unsubscribed/page.tsx:16-23`) | − | − | − | yes | "Sign up again → `/#newsletter`" (dead anchor, `:46`) |
| `/help`, `/help/[topic]`, `/help/[topic]/[slug]`, `/help/search` | Help centre, served from `help.techplay.gg` via host rewrite; `techplay.gg/help/*` 301s there (`next.config.ts` redirects/rewrites) | `3600`; search `force-dynamic` | no | GM; own `metadataBase` + template `%s \| TechPlay Help` (`app/help/layout.tsx:46-49`) | CollectionPage (index), Article (answer) (`app/help/page.tsx:88-93`, `app/help/[topic]/[slug]/page.tsx:80-90`) | absolute help-host canonicals | none | search: `ROBOTS_NOINDEX`; index noindex when no topics | "Still need help" → contact / live chat / "Ask on Discord" (`components/help/StillNeedHelp.tsx:56-144`) |

### A.1.6 Route handlers

| Handler | Purpose | Evidence |
|---|---|---|
| `GET /rss`, `GET /feed` | Proxy the backend RSS (`{root}/feed`), 15-min cache, `application/rss+xml` | `app/rss/route.ts:16-42`, `app/feed/route.ts:10-12` |
| `POST /api/revalidate` | On-demand ISR purge by tag/path; accepts `x-revalidate-token` or Bearer; reads `REVALIDATE_SECRET_TOKEN \|\| REVALIDATION_SECRET` | `app/api/revalidate/route.ts:24-71` |
| `GET /og/list`, `/og/profile`, `/og/studio` | Edge `ImageResponse` 1200×630 share cards; 404 for unknown entities; WebP/AVIF covers filtered out because Satori cannot decode them (41% of covers are WebP per comment) | `app/og/*/route.tsx`, `lib/ogCovers.ts:9-31` |
| `GET /proxy/gtag`, `POST /proxy/ga/[...path]` | First-party GA4 loader and collect relay (also copies hits to backend counter) | `app/proxy/gtag/route.ts:1-25`, `docs/README.md §19` |
| `GET /app-check` | Bare Turnstile page for the (paused) mobile app WebView; `noindex,nofollow` meta | `app/app-check/route.ts:1-30` |

---

## A.2. Product capability map

Format per feature: **Current state** (FACT) · **User value / audience** · **Discovery · SEO · Social · Registration · Retention · Referral · Community · Marketing** (each rated Low/Med/High as ESTIMATE from code) · **Weaknesses** (FACT/OBSERVATION) · **Opportunity** (HYPOTHESIS/RECOMMENDATION).

### A.2.1 Editorial

**F01 — News articles (`/news/[slug]`)**
- State: FACT — server-rendered, on-demand ISR by tag, NewsArticle JSON-LD, breadcrumbs, reading progress bar, in-article ad split, JoinPrompt, comments, related "Recommended for you / Popular now" (personalised via `/feed/recommended-news`, `components/news/RecommendedNews.tsx:27-32`), GameInfoCard when linked to a game, Discord widget, release calendar rail, Google News "preferred source" link (`components/ui/GoogleNewsFollow.tsx:8`).
- Value/audience: gaming-news readers, search/Discover traffic.
- Discovery High · SEO High · Social Med · Registration Med (JoinPrompt) · Retention Low (no follow-topic) · Referral Low · Community Med (comments) · Marketing High (ad inventory).
- Weaknesses: FACT — no "follow this game/topic" action for readers; tags array only feeds `<meta keywords>` (`app/news/[slug]/page.tsx:244-246`), there is no `/news/tag/*` page; the article footer's "tags" are `[category name, 'Gaming']` (`ArticleDetailView.tsx:351`), i.e. not real tags. OBSERVATION — desktop reader sees 4 ad slots in the rail plus 1 in-article.
- Opportunity: RECOMMENDATION — connect `article.game` to `TrackGameButton` in the GameInfoCard so a news reader can wishlist the game from the article (the button exists; the card does not use it — `components/games/GameInfoCard.tsx` is imported but the CTA is only on `/games/[slug]`). HYPOTHESIS — topic/tag hubs would create the internal-linking layer between 638 articles and 332k games.

**F02 — Reviews (`/reviews/[slug]`)**
- State: FACT — score badge, pros/cons via `ReviewSidebar`, store "Buy now — {price}" link (`ReviewSidebar.tsx:349-358`), Product+Review JSON-LD with `aggregateRating.ratingCount: "1"` (`app/reviews/[slug]/page.tsx:217-223`), second Product block client-side (`ReviewDetailView.tsx:110-113`). Rating scale 1–10 documented at `/rating-system`.
- Discovery High · SEO High · Social Med · Registration Low · Retention Low · Referral Low · Community Med · Marketing High (affiliate placement exists).
- Weaknesses: FACT — duplicated Product schema; a single editorial review declared as `AggregateRating` of count 1 (self-referential). FACT — reader ratings on the game page are 1–5 stars (`GameRating.tsx:227`) while editorial reviews are 1–10 — two scales on one entity. OBSERVATION — `getStoreUrl` adds no affiliate/UTM parameters (grep for `affiliate|utm|ref=` in `ReviewSidebar.tsx`: 0 hits).
- Opportunity: RECOMMENDATION — drop the client-side duplicate, move `aggregateRating` to the game page's reader ratings only, and add tracked outbound parameters to the store link.

**F03 — Guides (`/guides/[slug]`)**
- State: FACT — steps renderer, helpful/unhelpful vote ("Sign in to answer"), HowTo + Article JSON-LD, share, comments, linked game card.
- Discovery High (evergreen) · SEO High · Social Low · Registration Med (vote gate) · Retention Low · Community Low · Marketing Med.
- Weaknesses: FACT — two article-type schemas (Article + HowTo) on one URL. FACT — `totalTime` derived from reading time (`GuideDetailView.tsx:110`), not from the guide.
- Opportunity: HYPOTHESIS — guides linked to games are the strongest candidates for "game → guides" internal linking; the game page shows "News & reviews" (`app/games/[slug]/page.tsx:1495-1520`) fed by `bundle.articles`; whether guides are included is UNVERIFIED (depends on backend bundle).

**F04 — Hardware/Tech (`/hardware/*`)**
- State: FACT — same template as news, category hubs (reviews, benchmarks, guides, news), NewsArticle schema.
- SEO High (affiliate intent) · Marketing High.
- Weaknesses: FACT — `/hardware/[category]` JSON-LD author URL uses `username` (`:200`) while other templates use `author_slug` — two different author URLs for the same person across the site. OBSERVATION — no spec table / price / affiliate component exists in the frontend for hardware (no component under `components/` named for specs or prices).
- Opportunity: RECOMMENDATION — a `Product`+`Offer` block and a price/spec card for hardware reviews would match the "affiliate monetisation" goal stated in CLAUDE.md.

**F05 — Section hubs and paginated archives (`/news`, `/news/page/[n]` etc.)**
- State: FACT — page 1 static at `/news`, pages 2–500 real URLs, numbered pager with `<Link>`s (`SectionHub.tsx:224-301`), `notFound()` beyond last page. Category tabs link to `/news/{category}` pages with `page_seo` copy.
- SEO High (crawl paths to all articles) · Retention Low.
- Weaknesses: FACT — no `rel=prev/next` (not required by Google since 2019; noted for completeness). FACT — category hubs have no `/page/[n]` (only section roots do: `sectionPages.ts:22-27`), so a category with more than 13 articles is again only client-paged (comment at `SectionHub.tsx:224-226` admits it).
- Opportunity: RECOMMENDATION — extend `/page/[n]` to category hubs.

**F06 — The Feed (`/latest`)**
- State: FACT — client-rendered mixed stream, chips are client filters, personal hints "Sign in"/"add games".
- Discovery Med · SEO Low (no server content; `FeedClient` fetches in browser) · Retention Med (it is the mobile tab).
- Weakness: FACT — the main mobile tab renders no crawlable content server-side.

**F07 — Author pages (`/author/[slug]`)**
- State: FACT — Person schema, social links, paginated grid with `?page=` in the URL, `sameAs` to `/profile/{username}`.
- SEO Med (E-E-A-T) · Social Low.
- Weaknesses: FACT — doubled site name in title; `twitter:card` is `summary`; no "follow author" or author RSS.

**F08 — Google News / Discover readiness**
- State: FACT — `max-image-preview: large`, `max-snippet: -1`, `max-video-preview: -1` on every indexable page (`lib/seo.ts:41-47`), `<time dateTime>` server-rendered (`ArticleDetailView.tsx:50-55`), news sitemap served by backend (`SitemapController.php:421`), "Add TechPlay.gg as a preferred source on Google" link under every article.
- Weakness: OBSERVATION — none visible in frontend; the constraint is publishing volume (638 articles total per README).

### A.2.2 Games database

**F09 — Game detail (`/games/[slug]`)**
- State: FACT — the richest page on the site: 1,758 lines; hero art, trailer (`youtube-nocookie`), screenshots lightbox, box art, about, related shelves (DLC/remakes etc.), languages table, game details, system requirements, "In member lists", "News & reviews", alt titles, series rail, similar games, reader rating (1–5), forum threads, IGDB attribution; `force-dynamic` with nginx/Cloudflare caching; noindex+nofollow when description ≤50 chars.
- Discovery High · SEO High (the 56k indexed pages are mostly these) · Social Med (cover as OG) · Registration Med (track/rate/list all gate to `/login`) · Retention Med · Community Low (threads count mostly 0) · Marketing Med (display ad when description ≥200 chars, `:1099-1103,1383`).
- Weaknesses: FACT — OG image dimensions hardcoded 1280×720 for a portrait cover (`:281-283`). FACT — the thin-page rule uses `follow:false`, so link equity from ~27k description-less games (comment `:1088`) does not pass to their studios/series. FACT — guests see only `/login` links (`TrackGameButton.tsx:105,111`), no value statement. FACT — no `datePublished`/`releaseDate` for upcoming games' reminder CTA on this page; the reminder hook exists (`hooks/useReleaseReminder.ts`) but is used on calendar surfaces.
- Opportunity: RECOMMENDATION — switch thin pages to `index:false, follow:true` (as the facet pages already do); add a guest-facing "Sign in to wishlist — we'll email you on release day" line; add `Offer`s from the existing "Where to get it" store links.

**F10 — Facet hubs (genre/platform/tag/year/series)**
- State: FACT — 14 genres, 5 platforms, ~20 tags, years, series; server-seeded grids (30 games), CollectionPage + BreadcrumbList; noindex,follow when uncurated or empty; listed in backend `sitemap-hub.xml` (`SitemapController.php:541-622`).
- SEO High (head terms "best X games") · Discovery High.
- Weaknesses: FACT — no `og:image` on any facet page (openGraph declared without images). FACT — titles hardcode "in 2026" (`genre/[genre]/page.tsx:16-98`) and will need a yearly edit. FACT — no ItemList of the 30 games in the JSON-LD (only CollectionPage). OBSERVATION — no editorial text beyond a one-sentence intro, so pages compete on thin content.
- Opportunity: RECOMMENDATION — emit `ItemList` with the seeded 30 games; add a dated, editable intro paragraph from `page_seo`; generate an OG card like `/og/list`.

**F11 — Studios (`/studios`, `/studios/[slug]`, `/studios/country/[iso]`)**
- State: FACT — 31,970 studio pages per comment (`app/og/studio/route.tsx:19`), Organization schema, generated OG card, indexable flag from backend, country pages for 135 countries (6 in nav).
- SEO Med–High (long tail "X games developer") · Social Low.
- Weaknesses: FACT — relative canonical `/studios/{slug}` relies on `metadataBase` (fine) but country pages have no JSON-LD. OBSERVATION — nothing on a studio page asks for anything (no follow studio, no newsletter).
- Opportunity: HYPOTHESIS — "follow studio → release reminders" would give the 30k pages a retention hook.

**F12 — Search (header + hero)**
- State: FACT — `SearchDropdown` queries `/search/articles`, `/search/games`, `/search/users`, `/search/help` in parallel with Ctrl/⌘+K hotkey (`components/layout/SearchDropdown.tsx:102-105`); Enter → `/games?search=`.
- Weaknesses: FACT — `WebSite.potentialAction.target` is `/search?q={search_term_string}` (`app/layout.tsx:207`), a URL that does not exist in `app/` and is disallowed in robots.txt — the Sitelinks Searchbox markup points at a 404. FACT — no `/search` results page for articles at all; only games have a results surface.
- Opportunity: RECOMMENDATION — either point `SearchAction` at `/games?search=` or build `/search`.

**F13 — Release calendar (`/calendar`, `/calendar/[slug]`)**
- State: FACT — month view seeded server-side, wishlist + "Remind me on release day" (members), watchlist rail, wishlist counts shown ("Wishlisted on TechPlay"), store links, "also this month".
- Discovery High (recurring visits) · Registration High (reminder is a strong reason) · Retention High · SEO Med (detail canonical points to game page).
- Weaknesses: FACT — guest tap → toast "Sign in to track releases." with no explanation of what they get (`CalendarClient.tsx:140`). FACT — `/calendar/[slug]` has OG tags but canonicals to `/games/{slug}`, so shares resolve to the thinner page while search consolidates on the richer one — acceptable but the two pages differ in CTA (calendar has reminder; game page does not).
- Opportunity: RECOMMENDATION — put the reminder button on `/games/[slug]` for upcoming titles (the hook comment says this was the intent, `useReleaseReminder.ts:15-20`); email reminder for guests (email-only capture) would be the single highest-intent newsletter entry on the site.

**F14 — Homepage discovery rails (Trending / New / Coming, Hidden Gems, On This Day)**
- State: FACT — client-fetched (`DiscoverGames.tsx:51-71`, `HiddenGems.tsx:22`, `OnThisDay.tsx:25`) from `/games`, `/games/calendar`, `/games/hidden-gems`, `/games/on-this-day`; "Trending" is actually top-rated ≥8.5 (comment `DiscoverGames.tsx:58-61`).
- Discovery Med · SEO Low (not in HTML) · Social Med ("On this day" is shareable content).
- Weakness: FACT — none of these rails is server-rendered, so the homepage HTML links to games only through the hero/quick links; OBSERVATION — "On This Day" is a daily-changing hook with no share/notify affordance.
- Opportunity: HYPOTHESIS — "On This Day" + Discord/newsletter daily post is a zero-editorial-cost recurring format.

**F15 — Data attribution / trust**
- State: FACT — IGDB credited on every game/studio page (`DataAttribution.tsx:17-24`); `/rating-system`, `/impressum` (Sarajevo address, `ImpressumClient.tsx:108`), `/about` counted figures.
- Marketing Med (E-E-A-T).

### A.2.3 Accounts, library and gamification

**F16 — Registration / login**
- State: FACT — email+password with Cloudflare Turnstile, Google ("Sign up with Google"), Discord, Battle.net (`RegisterClient.tsx:462-482`); Steam is a *connection*, not a sign-in. Copy: "CHARACTER CREATION — Create Your Player", button "Create Player" (`:219-221,439`). Login: "Continue with Google", Discord, Battle.net, "Forgot?", "New player? Create your account →" (`LoginClient.tsx:327-360`).
- Registration High.
- Weaknesses: FACT — auth is client-only (`context/AuthContext.tsx`, token in `localStorage`), so any server-rendered page shows the signed-out state first (JoinPrompt guards against the flash, `JoinPrompt.tsx:84-87`). FACT — `?from=article` is the only funnel marker and it is read from nginx logs, not GA (`JoinPrompt.tsx:26-29`). OBSERVATION — no referral/invite code on registration (referral exists only inside giveaways, `GiveawayClient.tsx:84-86,388-398`).
- Opportunity: RECOMMENDATION — pass `from=` for every CTA (header, hero, band, comments, calendar toast) and log GA events; consider Steam OpenID as a first-class *sign-in* since the product pitch is "one library".

**F17 — Connected accounts / library import**
- State: FACT — Steam (OpenID redirect), Xbox (gamertag via OpenXBL), PlayStation (manual NPSSO token, renews ~2 months, "unproven" per copy), Epic (code paste), GOG (code paste) (`ConnectedAccountsSection.tsx:89-150`); `WelcomeOnboarding` wizard: Connect Steam / Connect Xbox / pick games by hand.
- Value: the core differentiator ("One Game Library for PC, PlayStation & Xbox").
- Registration High · Retention High · Referral Med (share card shows the library).
- Weaknesses: FACT — Epic/GOG flows are described in-product as ending "on a blank white page" (`:14-15`); PlayStation says "Nobody has linked a PlayStation account here yet" (`:122`). OBSERVATION — the homepage hero promises "Connect Steam, PlayStation and Xbox and your games arrive on their own" (`HomeHero.tsx:86`) while the PlayStation path is a manual token copy.
- Opportunity: RECOMMENDATION — align hero copy with what is frictionless (Steam, Xbox) or fix the PSN path before marketing it.

**F18 — Collection tracking (7 statuses)**
- State: FACT — playing, replaying, played, backlog, completed, wishlist, dropped (`TrackGameButton.tsx:12-23`); upcoming games limited to playing/backlog/wishlist.
- Retention High · Registration High.
- Weakness: FACT — the only guest affordance is a `/login` link.

**F19 — Game lists (Top 10/25/100, genre, custom, tier lists)**
- State: FACT — editor (`ListEditor.tsx`, 869 lines), tags with `/lists/tag/[tag]` pages, likes, comments, generated OG card that draws tier boards, "In member lists" panel on game pages, ItemList schema.
- Social High (tier-list cards are share-native) · SEO Med · Community Med · Registration Med.
- Weaknesses: FACT — directory shows 20 lists (`/game-lists/discover?limit=20`), no pagination (`app/lists/page.tsx:28-31`). README says 7 forum threads / 60 users — OBSERVATION: list volume is unknown here (UNVERIFIED).
- Opportunity: HYPOTHESIS — tier lists + `/og/list` are the most natural Reddit/Discord share unit the site owns; a "make your 2026 tier list" prompt is a campaign, not a feature.

**F20 — XP, levels, ranks, achievements, quests, seasons, streaks, Bounty store**
- State: FACT — `QuestBoard` (daily/weekly/monthly/permanent, `QuestBoard.tsx:41-44`), `DailyStreakWidget` (claim endpoint `/user/streak/claim`), `SeasonPanel` (`/seasons/active`, XP multiplier), `RewardsStore` (frames, themes, badges, perks, discounts, physical; costs in Bounty; supporter-tier gates, `RewardsStore.tsx:31,141,270`), `RewardFeed` toaster on every page (`app/layout.tsx:410`), 20 ranks referenced in JoinPrompt copy, `ProfileChecklist` with 7 activation tasks (`ProfileChecklist.tsx:44-91`).
- Retention High · Community Med · Marketing Med (season = campaign calendar).
- Weaknesses: OBSERVATION — quests/season/store are owner-only tabs, invisible to visitors and to search; nothing on public pages says a season is running except the leaderboard timer (`LeaderboardClient.tsx:192`). FACT — comment placeholder promises "earn 10 XP!" (`CommentsSection.tsx:234`) while README §5 says XP for comments is capped 100/day with a 60 s cooldown — consistent, but the first three comments are held for moderation (README §4), so the promised XP is delayed; the UI copy does not say so.
- Opportunity: RECOMMENDATION — a public `/seasons` (or leaderboard banner) page with the current season's name, dates and multiplier gives marketing a recurring, linkable event.

**F21 — Gamer DNA, Taste Match, Backlog Advisor, Journal, Play History**
- State: FACT — `GamerDnaPanel` (identity card, signature games, rhythm, milestones, verdicts, graveyard, "Taste twins"), `TasteMatch` percentage between two users (`TasteMatch.tsx:41-43`), Backlog Advisor scored recommendations, Journal sessions with mood/percent/played-with (`JournalTab.tsx:251-416`), `SessionSuggestions` from Steam playtime.
- Retention High · Social Med (DNA/taste match are share-worthy) · Referral Med.
- Weaknesses: FACT — Taste Match only renders for a signed-in viewer looking at someone else (`:41-42`), so it cannot be shared to a non-member. OBSERVATION — no OG card for Gamer DNA (only `/og/profile` generic).
- Opportunity: HYPOTHESIS — a public, shareable "DNA card" image (like `/og/list`) is the Spotify-Wrapped-style asset the product already computes; `public/images/menu/menu-wrapped.webp` exists, suggesting a "Wrapped" was planned (UNVERIFIED whether anything renders it — grep for "wrapped" in app/components not run; flagged as a gap).

**F22 — Profile share card / Recognitions / Friends / Messaging / Group chats**
- State: FACT — `ShareCard` (system share, "Save image", copy link; `ShareCard.tsx:121-143`), `GiveRecognitionButton` ("Recognise"), friends (add/accept/block), DMs and group chats over Reverb (`SocialClient.tsx:490-504`), `SendMessageModal`, presence via Steam.
- Community High · Retention Med · Referral Med.
- Weaknesses: FACT — `/social` is indexable while login-walled; README measures 60 users, so the graph is tiny (OBSERVATION).

**F23 — Notifications (bell)**
- State: FACT — in-app only; types: achievement, friend_request, forum_reply, giveaway_won, giveaway_ending, game_release (`NotificationPanel.tsx:26-39`); "On-site notifications are always on; they are the bell in the header" (`SettingsClient.tsx:713`); one email toggle "Email me" (`:671`). Realtime: backend still broadcasts `NotificationReceived` on `user.{id}` but the frontend hook was removed (`hooks/index.ts:8-12`), so the bell refreshes only on open/poll.
- Retention Med.
- Weaknesses: FACT — no push, no email digest actually sent (README §20: `WeeklyDigestNotification` is database-channel only).

### A.2.4 Community

**F24 — Forum (boards, threads, polls, reactions, watch, bookmark, unread marks, live replies)**
- State: FACT — boards and threads SSR (`force-dynamic`), DiscussionForumPosting schema, `ThreadPoll`, `PostReactions`, watch/bookmark (`ThreadClient.tsx:356-372`), realtime via `useRealTimeForum`, read watermarks (`useForumReads.ts`), rules page, "Start a Thread" from every game (nofollow).
- Community High · SEO Med (threads indexable) · Registration Med.
- Weaknesses: FACT — thread OG has no image; FACT — README: 7 threads. OBSERVATION — game-linked threads (`/forum/create?game=`) are the intended bridge between 332k pages and the forum, but each empty game page shows "Start a Thread" to guests who then hit a login wall.
- Opportunity: RECOMMENDATION — auto-create or seed threads for top-N games/releases so game pages show discussion rather than an empty prompt.

**F25 — Comments (articles, reviews, guides, profiles)**
- State: FACT — nested replies, votes ("Sign in to vote on comments."), moderation states, guest panel "Join the Conversation — Log in to comment and earn community XP." with `/login?redirect=back` and `/register?redirect=back` (`CommentsSection.tsx:267-279`).
- Community Med · Registration Med.
- Weakness: README: 22 comments total (FACT from doc).

**F26 — Leaderboard + seasons**
- State: FACT — XP, reputation, collection, completions, reviews, achievements boards; season countdown; "Your position"; private profiles excluded with "Change it in settings to compete".
- Community Med · Retention Med · Social Low (no share of rank).

**F27 — Giveaways**
- State: FACT — 12 task types incl. Facebook like/share, Instagram follow, X follow/retweet, Discord join, share giveaway, referral ("Get points for each friend — Invite"), custom; referral code captured from `?ref=` and persisted per giveaway (`GiveawayClient.tsx:388-462`); OG with measured image; JoinPrompt swaps to the active giveaway automatically (`JoinPrompt.tsx:89-102`); Leaderboard of entrants (`components/giveaway/Leaderboard.tsx`).
- Registration High · Social High · Referral High · Marketing High.
- Weaknesses: FACT — hub `/giveaways` is `noindex,nofollow`; detail pages lack canonical; the referral bug comment says "no referral has ever been registered and no referrer has ever been paid" until the fix (`:388-393`) — whether the backend now credits is UNVERIFIED from the frontend.
- Opportunity: RECOMMENDATION — index the hub (it is the only acquisition landing page with a prize), add canonical to details, and expose the referral URL on the profile so it survives the giveaway.

### A.2.5 Tools and campaigns

**F28 — WoW Analyzer** — FACT: no login required, WebApplication+FAQPage schema, 2.5 MB PNG as OG image, ~100 meta keywords. Discovery High (niche search), Registration Low. RECOMMENDATION: convert OG to a ≤300 KB 1200×630 asset; the keyword list is harmless but reads as 2010 SEO.

**F29 — GTA 6 Hub** — FACT: 6 indexable pages, Leaflet map with 1,000+ pins, characters with `generateStaticParams`, FAQPage, newsletter CTA "Don't miss a single GTA 6 drop — Join the Crew", pre-order block with retailer links that are `"#"` placeholders until "redakcija fills affiliate URLs" (`Gta6PreOrder.tsx:4`), countdown to 2026-11-19 hardcoded (`app/gta6/page.tsx:17`). Discovery High (event-driven), Marketing High. Weakness: FACT — the release date is hardcoded in three places (`gta6/page.tsx:17`, `everything-we-know/page.tsx:39`, JSON-LD `datePublished`), and the Discord link differs from the site-wide one. RECOMMENDATION: single source for the date; fill retailer links before launch window.

**F30 — The Last Disc (petition)** — FACT: email signature with country, live counts (signatures, countries, latest), countdown to Jan 2028, poll, share row, coverage search; letter page with Article schema. Social High, Referral High, Registration Low (email only, not an account). Weakness: FACT — comment says the honest signature count "is currently zero" (`app/last-disc/page.tsx:93-96`), i.e. launched with no seeding. RECOMMENDATION: pair the campaign with the giveaway's task engine ("sign the letter" as a task).

**F31 — Frontiers (teaser)** — FACT: static teaser, "Notify me" writes to the general newsletter (no segment), nav says "coming". Weakness: OBSERVATION — interest in an unreleased game is indistinguishable from news subscribers in the mail audience. RECOMMENDATION: tag the source at subscribe time (backend may support `source` — UNVERIFIED).

**F32 — Tools directory (`/tools`)** — FACT: ItemList of 5 (WoW, Backlog Advisor, Game Lists, GTA 6, Last Disc). Discovery Med.

### A.2.6 Commerce and support

**F33 — Shop** — FACT: indexable, "Coming Soon" when no products (README §17: `products` table empty, PayPal sandbox). Marketing Low until launched. RECOMMENDATION: `noindex` the shop until inventory exists, or publish merch.

**F34 — Support tiers (donations)** — FACT: PayPal subscriptions, tiers from admin, RewardsStore items gated by `required_tier`. Weakness: README §17 says tiers table empty → page renders "Support tiers are unavailable right now" (FACT in code). Footer links "Support Us" to it on every page.

**F35 — Advertising (AdSense)** — FACT: three hand-placed unit types (in-feed, display, in-article; `AdSense.tsx:38-42`), auto ads off, host-gated to `techplay.gg` (`ads/config.ts:23-30`), consent via Google CMP, `ads.txt` present. Homepage 1 unit, article ≥5 slots desktop, game page 1 conditional unit. Marketing High. OBSERVATION: ad density on articles is the main mobile friction (see §6).

**F36 — "Advertise with us" (`/marketing`)** — FACT: formats (300×250 etc.), "Balkans-founded, US and EU audience", giveaway sponsorship offer, mailto, "Agency? Ask for our agency rate card." No numbers (comment: two audience numbers were removed as unverifiable, `MarketingClient.tsx:8`). Marketing Med.

### A.2.7 Platform plumbing that affects growth

**F37 — Metadata engine (`generatePageMetadata`)** — FACT: DB title marked `absolute` to avoid "| TechPlay | TechPlay"; canonical always; `x-default`; keywords from `TagsInput` JSON; noindex switch honoured; 5-min cache. Strength.

**F38 — Editor redirects** — FACT: 21 admin redirects compiled at build via `NEXT_PRIVATE_API_URL` (`next.config.ts` redirects()), plus `/help` → subdomain 301s. Weakness: a redirect added in admin waits for the next deploy (documented).

**F39 — Help centre on `help.techplay.gg`** — FACT: host rewrite, own chrome, zero-JS pages, Article schema, own robots/sitemap from backend. SEO Med (support queries), Retention Med.

**F40 — RSS/Atom** — FACT: `/rss` and `/feed` proxy backend XML (40 articles + 10 guides with enclosures, `RssController.php:11-103`); `<link rel=alternate>` in root; footer "RSS" link. Weakness: FACT — no per-section or per-game feeds; no JSON Feed; no podcast/video feed.

**F41 — PWA manifest** — FACT: standalone, theme `#DC143C`, shortcuts (Profile, News, Database), maskable icon. Weakness: FACT — no service worker, so no offline, no install prompt handling, no push.

**F42 — Analytics/consent** — FACT: GA4 in head via first-party proxy, Consent Mode default from nginx by country, Google CMP, GlitchTip errors, backend hit counter (`/proxy/ga` → `/api/v1/analytics/collect`). No GA `event`s are sent for CTAs (grep `gtag("event"` shows only `page_view` in `ConsentAwareAnalytics.tsx:34`). RECOMMENDATION: instrument register/newsletter/share/wishlist clicks as GA events.

**F43 — Real-time (Reverb)** — FACT: used for forum, chat and notifications channel; presence broadcasting removed (`hooks/index.ts`). Retention Med.

**F44 — Error/404 pages** — FACT: 404 prints the attempted path and five destinations (`app/not-found.tsx:24-30`); route error boundaries per section. Strength for retention of misdirected traffic.

**F45 — Mobile app hooks** — FACT: `/app-check` Turnstile host for the paused Expo app; `manifest.json` shortcuts. Marketing Low until app resumes.

---

## A.3. Conversion points inventory (actual copy from code)

### A.3.1 Registration / sign-in CTAs

| Where | Copy (verbatim) | Target | Evidence |
|---|---|---|---|
| Header (desktop, signed out) | "Sign In" · "Join TechPlay" (`rel="nofollow"`) | `/login`, `/register` | `components/layout/Header.tsx:1213-1228` |
| Mobile tab bar centre slot | "Sign in" (portrait slot) | `/login` | `MobileTabBar.tsx:114,241` |
| More sheet footer (signed out) | "Sign in" · "Register" (`rel="nofollow"`) | `/login`, `/register` | `MoreSheet.tsx:447-454` |
| Homepage hero | "Start your library" · "Browse the catalogue" | `/register`, `/games` | `HomeHero.tsx:111-118` |
| Homepage quick link | "My Games — Your collection, hours and backlog — Open your library" | `/login` | `QuickLinksBand.tsx:18` |
| Homepage closing band | "What an account is for — The record builds itself." … "Start your library" · "Free, and no card · Already have an account?" | `/register`, `/login` | `ProfileCtaBand.tsx:73-114` |
| Every article/tech article body end (guests) | Panel: "Free TechPlay account — Your gaming life, in one place. Link a store and your shelf fills itself — every game, with the hours already on them." bullets "Your whole library, from Steam, Xbox, PlayStation, GOG and Epic / XP, twenty ranks and achievements for what you already play / A record of what you finished, and what you thought of it" → "Create your profile" · "I already have one" · "Free, and it takes a minute." | `/register?from=article`, `/login?from=article` | `JoinPrompt.tsx:33-37,289-331` |
| Same slot while a giveaway is active | "Giveaway · closes {date} — {title} — Free to enter with a TechPlay account — and the account is what keeps your library, your XP and your finished games in one place." → "Enter the giveaway" · "I already have an account" · "Free to enter. The account takes a minute." | `/giveaway/{slug}?from=article` | `JoinPrompt.tsx:196-240` |
| Inline variant (between paragraphs; `variant="inline"`) | "Free account — Bring your games together on one profile." | `/register?from=article` | `JoinPrompt.tsx:138-155` (component supports it; ArticleDetailView uses the panel variant only, `:333`) |
| Comments (guest) | "Join the Conversation — Log in to comment and earn community XP." · buttons to login/register | `/login?redirect=back`, `/register?redirect=back` | `CommentsSection.tsx:267-279` |
| Comment vote (guest) | toast "Sign in to vote on comments." | — | `CommentsSection.tsx:77` |
| Comment placeholder (member) | "Share your thoughts… (earn 10 XP!)" | — | `:234` |
| Game page track button (guest) | icon / full-width button linking to login (no copy beyond icon; full variant text is "Track" title) | `/login` | `TrackGameButton.tsx:101-116,129` |
| Game page rating (guest) | "Rate this game" stars → "Sign in to rate this game"; modal "Sign in to rate games, write reviews and track your gaming history." | `/login` | `GameRating.tsx:300-381` |
| Game page lists | "Save to a list" (members; opens list picker, "New list with this game") | — | `AddToListButton.tsx:89,155` |
| Game page forum | "Start a Thread" (`rel=nofollow`) | `/forum/create?game=` | `GameForumThreads.tsx:56-62` |
| Calendar (guest) | toast "Sign in to track releases."; stat tile "Sign in to track"; rail "Sign in to wishlist" | — | `CalendarClient.tsx:140,349,626` |
| Release page buttons | "Add to wishlist" / "Wishlisted"; "Remind me on release day" / "We'll tell you" | — | `ReleaseClient.tsx:108,123` |
| Guide helpful vote (guest) | "Sign in to answer" | — | `GuideHelpful.tsx:121` |
| List like (guest) | toast "Sign in to like this list." | — | `ListSocialBar.tsx:49` |
| Forum sidebar (guest) | "Join the community" → "Sign in" · "Register" | `/login`, `/register` | `ForumSidebar.tsx:129-144` |
| Forum thread reply (guest) | reply box replaced (member-only "Post a Reply" + "Community Guidelines") | — | `ThreadClient.tsx:1190-1200` |
| SignInWall (profile/me, social, backlog advisor) | e.g. "Members only — Your Profile." … "Sign in" · "New player? Create your account →"; Social: "Squad Up. — Direct messages, group chats and who is online — the hub is yours once you are signed in."; Advisor: "Built from the games you own and how you rate them. Sign in and it starts working immediately." | `/login?redirect={here}`, `/register` | `SignInWall.tsx:59-71`, `profile/[username]/page.tsx:113-120`, `SocialClient.tsx:629-632`, `AdvisorClient.tsx:258` |
| Feed (`/latest`) | "Sign in" … "add games" | `/login`, `/games` | `FeedClient.tsx:184,190` |
| Roadmap | `RoadmapCTA` → `/register` | `/register` | `RoadmapCTA.tsx:52` |
| Leaderboard (private profile) | "Change it in settings to compete." | `/settings` | `LeaderboardClient.tsx:428` |
| Register page pitch | "Create your player profile and unlock everything TechPlay has to offer:" … "CHARACTER CREATION — Create Your Player" … "Username — your gamertag" … "Create Player" · "Sign up with Google" · Discord · Battle.net · "Protected by Cloudflare Turnstile" · "Already a player? Sign in →" | — | `RegisterClient.tsx:186-495` |

### A.3.2 Newsletter CTAs

| Where | Copy | Endpoint | Evidence |
|---|---|---|---|
| Section hubs sidebar (news, reviews, guides, hardware and their category/page variants) | Panel "Stay in the loop — The bigger stories, sent when there is something worth sending." input placeholder "Your email address", button "Subscribe" | `POST /newsletter/subscribe` | `SectionHub.tsx:620-640,180-186` |
| GTA 6 hub | "Don't miss a single GTA 6 drop — Join thousands of fans and get the latest news, leaks and updates — straight to your inbox." placeholder "Enter your email", button "Join the Crew", success "Check your email to verify!"; plus "or join our Discord community" | `POST /newsletter/subscribe` | `Gta6NewsletterCTA.tsx:51-88` |
| Frontiers | "Notify me" form, placeholder "you@email.com" | `POST /newsletter/subscribe` (same list) | `FrontiersClient.tsx:63-121` |
| Unsubscribe receipt | "Left by mistake? Sign up again — we'll send one mail to confirm it's you." | `/#newsletter` (dead anchor) | `newsletter/unsubscribed/page.tsx:44-50` |
| Homepage | **none** | — | grep `newsletter` in `components/home`, `HomeClient.tsx`: 0 |
| Article pages | **none** (JoinPrompt asks for an account, not an email) | — | `ArticleDetailView.tsx` |
| Game/studio/calendar pages | **none** | — | — |

FACT — the GTA6 copy claims "Join thousands of fans"; README measured 60 site users; newsletter subscriber count is UNKNOWN to this audit (backend `newsletter_subscribers` not inspected).

### A.3.3 Discord CTAs

| Where | Copy | URL | Evidence |
|---|---|---|---|
| Footer (every page) | "Join our Discord — Talk games with the community" | `settings.discord_url` else `https://discord.gg/wPQG9gUMXH` | `Footer.tsx:50,129-149` |
| Article/tech sidebar (desktop only, `xl:` rail) | Panel "Community Discord — {site name} — Official server" perks "News the moment it publishes / Giveaway pings before they close / Squads, LFG and the editors" → "Join Discord" | same | `DiscordWidget.tsx:17-63`, `ArticleDetailView.tsx:364,378` |
| GTA 6 newsletter block | "or join our Discord community" | `https://discord.gg/techplaygg` (hardcoded, different) | `Gta6NewsletterCTA.tsx:7,85` |
| Help centre "Still need help" | "Ask on Discord" | `discordUrl` | `StillNeedHelp.tsx:137-144` |
| Giveaway task | "Be part of our community — Join" (`discord_join`) | task URL | `GiveawayClient.tsx:150` |
| Article footer social row | Discord icon when `discord_url` set | settings | `ArticleFooter.tsx:17-23` |
| Organization `sameAs` | includes `settings.discord_url` | — | `app/layout.tsx:187-195` |

### A.3.4 Share buttons

| Surface | Networks | Evidence |
|---|---|---|
| `SocialShare` (articles hero bar + footer, reviews, guides, giveaways task sheet) | X (`twitter.com/intent/tweet`), Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Copy link, native `navigator.share`; `onShared` callback for giveaway credit | `SocialShare.tsx:38-85`, `ArticleDetailView.tsx:275-280,349-358` |
| Forum thread | "Share" button (`handleShare`) | `ThreadClient.tsx:400,953-957` |
| Profile | `ShareCard` modal: system Share, "Save image", "Copy link" (uses `/og/profile` image) | `ShareCard.tsx:96-143`, `ProfileHero.tsx:385,654` |
| Game list | `ListSocialBar` share + like + comments | `ListSocialBar.tsx:62,119` |
| Last Disc | Facebook, X (with prewritten text "Sony is ending physical PlayStation discs in 2028. Digital is only bad when it's the only option — sign the open letter."), Reddit, Copy | `ShareRow.tsx:8-34` |
| Giveaway invite | WhatsApp/Telegram/Facebook/X invite links + "copy referral" | `GiveawayClient.tsx:185-200,497-499` |
| Game page, studio page, calendar, facet hubs, leaderboard | **no share control** (grep `SocialShare|ShareCard` in those files: 0) | — |

### A.3.5 Follow / save / wishlist actions

| Action | Where | Gate | Evidence |
|---|---|---|---|
| Save article for later ("Save"/"Saved") + reading progress | article info bar | members | `ReadingTracker.tsx:119-192` |
| Track game (7 statuses) | game page, tiles (`compact`) | members | `TrackGameButton.tsx` |
| Wishlist + release reminder | calendar, release page, `ReleaseCard`, `UpcomingRelease` | members | `CalendarClient.tsx:128-190`, `useReleaseReminder.ts` |
| Add to list / new list | game page | members | `AddToListButton.tsx` |
| Rate game 1–5 | game page | members | `GameRating.tsx:215-248` |
| Watch thread / bookmark thread | thread | members | `ThreadClient.tsx:356-372` |
| Like list, comment on list | list page | members | `ListSocialBar.tsx` |
| Add friend / message / recognise | profile | members | `ProfileHero.tsx:58-82`, `GiveRecognitionButton.tsx` |
| Favourite games ("Star a favourite — favourites headline your profile") | checklist → `/games` | members | `ProfileChecklist.tsx:74-77` |
| Follow author / follow studio / follow topic / follow game (news) | **do not exist** | — | grep "Follow" hits only giveaway tasks and social icons |
| Google preferred source | under every article | none | `GoogleNewsFollow.tsx` |
| RSS | footer | none | `Footer.tsx:223-229` |

---

## A.4. SEO implementation audit

### A.4.1 Metadata generation

- FACT — Root: `title.default = site_name`, `template = "%s {sep} {site_name}"` (`app/layout.tsx:101-104`); description default "TechPlay puts every game you own in one library — Steam, PlayStation and Xbox together, with the hours you played — then reads your taste back to you. Plus reviews, release dates and the game catalogue." (`:105`); `keywords` array; `robots: ROBOTS_INDEX`; verification tags from settings; `alternates.types` RSS; manifest; icons.
- FACT — `generatePageMetadata(path, defaults)` (`lib/seo.ts:149-278`): DB `meta_title` → `{absolute}`; fallback title → template; description chain `page_seo → defaults → settings → hardcoded string that still says "a 141,000-game catalogue"` (`lib/seo.ts:187`) — a stale number in the last-resort fallback (the root layout's fallback says "the game catalogue"; the two fallbacks disagree). Canonical `pageSeo.canonical_url || APP_URL + path`; `languages: { 'x-default': canonical }`; OG `type: website` with admin image + measured size; Twitter card from settings.
- FACT — Title templates by type (quoted):
  - Articles: `article.meta_title || article.title` + " | TechPlay" (`news/[slug]/page.tsx:170,224`).
  - Reviews: `review.meta_title || review.title`; description fallback `"Rating: {n}/10. Read our full review of {item} on TechPlay."` (`reviews/[slug]/page.tsx:106-112`).
  - Guides: `guide.seo_title || guide.title` (`guides/[slug]/page.tsx:68`).
  - Games: `"{name} ({year})"`; social `"{name} ({year}) — TechPlay"` (`games/[slug]/page.tsx:265-266`).
  - Facets: `"Best {X} Games in 2026"`; OG `"… — TechPlay"` (`genre/[genre]/page.tsx:141,147`).
  - Series: OG `"{title} | TechPlay"` (`series/[slug]/page.tsx:109`) — a third separator style (" — ", " | ", " - ") coexists across the site (author uses " - TechPlay").
  - Studios: `"{name} — games, releases and history"` (`studios/[slug]/page.tsx:79`).
  - Profiles: `"{name}'s Profile"`; OG `"{name} on TechPlay"` (`profile/[username]/layout.tsx:92,107`).
  - Lists: `"{list} — a game list by {owner}"` (`lists/[username]/[slug]/page.tsx:52`).
  - Releases: `"{name} — release date, trailers and platforms"` (`calendar/[slug]/page.tsx:79`).
  - Forum thread: thread title + layout template `"%s | TechPlay Forum"` (`forum/layout.tsx:26`).
  - Help: `"%s | TechPlay Help"` (`help/layout.tsx:48`).
  - Paged archives: `"Gaming News — page {n}"` (`news/page/[n]/page.tsx:86`).
- FACT — Provable title defects: `/author/[slug]` → "Articles by X - TechPlay | TechPlay" (`author/[slug]/page.tsx:39` + root template); `/shop/[slug]` → "{product} — TechPlay Shop | TechPlay" (`shop/[slug]/page.tsx:66`); `/roadmap/layout.tsx:18` static "Roadmap 2026 - TechPlay" is overridden by the page's GM (harmless dead metadata).

### A.4.2 JSON-LD actually emitted by the frontend (server HTML unless noted)

| Type | Where |
|---|---|
| Organization (+logo, sameAs), WebSite (+SearchAction → non-existent `/search`) | root layout, every page |
| SiteNavigationElement graph | client `afterInteractive` (`GlobalSeo.tsx`) — not in initial HTML |
| NewsArticle (+speakable, Person author, publisher logo `/logo.png`) | news, hardware articles |
| Product{Review, AggregateRating(count 1)} ×2 | reviews (server + client duplicate) |
| Article + HowTo | guides |
| BreadcrumbList | articles/reviews/guides (client `Breadcrumbs`, still SSR'd), games, facets, series, tools, lists, gta6, last-disc, backlog advisor, wow |
| VideoGame (+AggregateRating when rated, VideoObject trailer, Organization dev/pub with `@id`) | game detail |
| CollectionPage | facets, lists index, help index |
| VideoGameSeries | series |
| Organization (+PostalAddress, parentOrganization) | studios |
| ItemList | tools, lists index, list detail |
| DiscussionForumPosting (+InteractionCounter) | forum threads |
| Person | authors, GTA6 characters |
| WebApplication (+Offer 0) | wow-analyzer, backlog-advisor |
| FAQPage | wow-analyzer, gta6/everything-we-know |
| WebPage{mainEntity Article}, Article | last-disc, last-disc/letter |
| VideoGame (GTA VI) | gta6 pages |
| Article (help answer) | help centre |
| **Absent** | ProfilePage/Person on `/profile`; `Product`/`Offer` on `/shop/[slug]`; `Event` for releases (calendar); `ItemList` on facet grids; `AboutPage` on `/about`; `Organization` `contactPoint`; `VideoObject` for article video embeds; `SoftwareApplication`/`Event` for giveaways. |

FACT — README §17: backend `SchemaService` output never reaches readers; the frontend blocks above are what Google sees.

### A.4.3 Sitemaps, RSS, robots (served by backend, linked by frontend)

- FACT — `nginx-site-techplay.conf:36-58` proxies `/robots.txt` and `^/sitemap.*\.xml$` to the backend; `SitemapController::index` lists pages, articles, categories, hub, guides, products, lists, series, news, images, games-{n}, studios (`SitemapController.php:43-125`); README §12: 15 maps, 295,024 game URLs. Robots: `User-agent: *`, `Allow: /`, `Disallow: /search`, `Sitemap:` (`:813-821`); README §12 adds `/api/`, `/admin/`, `/_next/data/`, `/login`, `/register`, `?_rsc=`, named AI bots, `meta-externalagent` and `Amazonbot` blocked.
- FACT — Frontend declares only one feed (`/rss`) in `<link rel=alternate>`; `llms.txt` (`public/llms.txt`) advertises `https://techplay.gg/feed` and the sitemaps.
- FACT — `sitemap-hub.xml` includes facet pages; the code comments record that 13 of 20 tag pages served empty grids under `index,follow` before the noindex gate (`lib/gameFacets.ts:50-60`).
- FACT — `sitemap-pages.xml` (`SitemapController::pages`, `backend/app/Http/Controllers/SitemapController.php:142-232`) lists 32 static URLs (`/`, section roots, `/calendar`, `/games`, `/forum`, `/shop`, `/frontiers`, `/last-disc`, `/last-disc/letter`, `/tools`, `/wow-analyzer`, `/backlog-advisor`, `/lists`, legal/about pages, six GTA6 pages) plus GTA6 character pages. It does **not** list `/studios`, `/leaderboard`, `/latest`, `/news|reviews|guides|hardware/page/[n]`, `/lists/tag/*`, `/studios/country/*`, `/social`, `/giveaways`, or `/calendar/*` (the last deliberately, comment at `calendar/[slug]/page.tsx:85-89`). Paged archives therefore rely on the pager links alone for discovery.

### A.4.4 Canonical handling

- FACT — Always present via `generatePageMetadata`, article `canonical_url` override, hardcoded `https://techplay.gg` on games/facets/wow/last-disc/frontiers/shop (ignores `NEXT_PUBLIC_APP_URL`), relative on studios/lists-tag/forum/shop-product (resolved by `metadataBase`).
- FACT — Missing canonical: `/giveaway/[slug]`, `/social`, `/support/checkout`, `/shop/checkout`, `/verify-email`, `/newsletter/verify`, `/auth/callback` (none set metadata with alternates).
- FACT — Cross-canonical: `/calendar/[slug]` → `/games/[slug]`.
- FACT — `news/layout.tsx`, `reviews/layout.tsx`, `hardware/layout.tsx` still declare `alternates.canonical: "/news"` etc.; pages override with their own `alternates`, so no live harm, but any future page under these segments that forgets `alternates` inherits the section root canonical (the exact bug the forum layout comment describes, `forum/layout.tsx:4-15`).

### A.4.5 Pagination

- FACT — `/news|reviews|guides|hardware/page/[n]`, n∈[2,500], `ROBOTS_INDEX`, self-canonical, numbered `<Link>` pager (`SectionHub.tsx:224-301`), 404 beyond last page.
- FACT — Category hubs, author grids (`?page=`), games hub ("load more", `GameDatabaseHub.tsx:288-320`), studios, lists, forum boards are client-paged only; the games hub uses `?page` state in memory, so a crawler never sees page 2 of any facet (30 games max per facet page in HTML, `facetGames.ts:63`).

### A.4.6 hreflang / language

- FACT — Only `x-default` = canonical (`lib/seo.ts:261`); `<html lang="en">`; `og:locale en_US` on articles. No regional or Bosnian/Croatian/Serbian alternates exist anywhere. `llms.txt` states "Primary language: English, Region: Bosnia and Herzegovina (global audience)".

### A.4.7 Robots / indexability rules in code

- Indexable by default (root `ROBOTS_INDEX`).
- noindex,nofollow: auth pages, cart, settings, forum/create, giveaways hub, unsubscribed, game pages with ≤50-char description, category hubs with 0 articles, not-found variants.
- noindex,follow: uncurated/empty facets, non-indexable studios/series, forum search, help search.
- FACT — Inherit index while they should not (OBSERVATION as weakness): `/social` (login wall), `/verify-email`, `/newsletter/verify`, `/support/checkout`, `/shop/checkout`, `/auth/callback`.

### A.4.8 Internal linking patterns

- FACT — Header mega-menus: Discover (News 6 cats, Reviews 5, Hardware 4, Guides), Feed, Games (8 genres, 5 platforms, years, "open-world" tag), Studios (6 countries), Community (Forum, Leaderboard, Social Hub, Giveaways, Frontiers "coming"), Tools (5), Shop (`Header.tsx:60-96,563-642`). Footer: About, Help Centre, Contact, Advertise, Rating System, Roadmap, Shop, Support Us, legal, RSS (`Footer.tsx:62-85`).
- FACT — Game page outbound: studios, series, similar (8), related shelves, member lists, news & reviews, forum threads, "Where to get it" external. The "Tags" panel renders up to 24 plain `<span>` chips with **no links** (`app/games/[slug]/page.tsx:1656-1666`), so 332k game pages pass nothing to the ~20 indexable `/games/tag/*` hubs, and genre/platform names in the facts panel are likewise not linked to `/games/genre/*` or `/games/platform/*` (no `href` to those paths anywhere in the file).
- FACT — Article outbound: author, category hub, recommended (4), release calendar (5 games), game info card, breadcrumbs.
- FACT — Homepage server HTML links: hero CTAs, 4 quick links, editorial spotlight, review wall; discovery rails are client-only.
- Weakness (FACT): no "related guides" on game pages unless included in `bundle.articles`; no article → facet hub links; no studio → country link verified in body (country link present in header only).

### A.4.9 Other provable weaknesses

1. FACT — Duplicate Product JSON-LD on reviews (server + client).
2. FACT — `WebSite.SearchAction` targets a 404 (`/search`).
3. FACT — `og:image` absent on facets, series, forum threads, lists-tag, forum rules.
4. FACT — Facet OG/titles hardcode "2026".
5. FACT — Fallback description in `lib/seo.ts:187` says "141,000-game catalogue" vs 330k+ elsewhere.
6. FACT — GTA6 Discord invite differs from site-wide invite.
7. FACT — Game OG image declared 1280×720 regardless of asset.
8. FACT — Thin game pages use `nofollow`.
9. FACT — `/giveaways` noindex,nofollow while a giveaway is the main paid-ad landing per JoinPrompt comments.
10. FACT — Two author URL schemes (`author_slug` vs `username`) in JSON-LD.
11. FACT — `WoW Analyzer.png` (2.5 MB, space in name) as OG image.
12. FACT — `public/` ships several multi-MB PNGs (`Woman DEX gradient.png` 2.9 MB, `bg-main.png` 1.5 MB, `bg-site.png` 1.6 MB, `game-database.png` 1.5 MB, `forum.png` 1.1 MB) — whether they are referenced is UNVERIFIED; if unreferenced they are dead weight only, not a page-speed issue.
13. FACT — Game pages do not link their own tags, genres or platforms to the facet hubs (`app/games/[slug]/page.tsx:1656-1666`), so the largest page class on the site contributes no internal links to the "Best X Games" landing pages that the sitemap-hub asks Google to rank.
14. FACT — `sitemap-pages.xml` omits `/studios`, `/leaderboard`, `/latest` and every paged archive (§4.3).

---

## A.5. Social metadata audit (OG / Twitter per page type)

| Page type | og:type | og:title | og:description | og:image | width/height | twitter:card | Notes |
|---|---|---|---|---|---|---|---|
| Home / static / hubs via `generatePageMetadata` | website | DB og_title → title → site name | DB → description | admin default (`seo_og_image_default`) | measured by backend | from settings (default `summary_large_image`), `site` handle | FACT `lib/seo.ts:263-276` |
| News / tech article | article | full headline (not the 60-char meta_title) | excerpt | featured, `alt` | only if measured | summary_large_image | `publishedTime`, `modifiedTime`, `authors`, `locale en_US` (`news/[slug]/page.tsx:226-241`) |
| Review | article | headline | meta/summary/excerpt | cover or featured | if measured | summary_large_image | |
| Guide | article | title | excerpt | featured (bare URL, no alt) | none | summary_large_image | `guides/[slug]/page.tsx:74-90` |
| Game | website | "{name} ({year}) — TechPlay" | derived | cover_url | **hardcoded 1280×720** | summary_large_image | `games/[slug]/page.tsx:275-290` |
| Facets / series | website | "Best X Games in 2026 — TechPlay" | copy | **none** | — | summary_large_image (no image → falls back to summary at X) | |
| Studio | profile | name | description | `/og/studio` generated | 1200×630 | summary_large_image | WebP covers excluded from card |
| Profile | profile | "{name} on TechPlay" | counts sentence | `/og/profile` generated | 1200×630 | summary_large_image | private/missing → still generates? No: 404 for unknown user (`og/profile/route.tsx:28-35`) |
| Game list | (default website) | "{list} — game list by {owner}" | description | `/og/list` (tier board for tier lists) | 1200×630 | summary_large_image | |
| Release (calendar) | website | name | description | cover_url | none | summary_large_image | canonical elsewhere |
| Forum thread | article | thread title | excerpt | **none** | — | (inherits root card type) | `publishedTime` set |
| Forum board | website | via generatePageMetadata | | default | | | |
| Giveaway | website | "🎁 {title}" | "Win {prize} worth €{value}! Enter the giveaway and complete tasks…" | featured/prize | measured | summary_large_image | no canonical |
| GTA6 pages | website/article | custom | custom | static `/gta6/og-*.png` (exist) | 1200×630 | (hub: inherits) | |
| WoW | (static) | custom | custom | `/WoW Analyzer.png` | declared in file (not read) | summary_large_image | 2.5 MB |
| Last Disc / letter / Frontiers | website/article | custom | custom | hero `.webp` 1983×793 / 1672×941 | declared | summary_large_image | WebP as og:image: support varies by scraper — UNVERIFIED for X/LinkedIn |
| Author | profile | "Articles by X - TechPlay" | bio | avatar 400×400 | declared | **summary** | |
| Shop product | website | "{name} — TechPlay Shop" | description | product image | none | large if image else summary | |
| Leaderboard | (base) | "TechPlay Leaderboard" | "Compete. Climb. Be the legend." | default | | | |
| Auth / cart / settings | — | — | — | — | — | — | noindex |

OBSERVATION — No page sets `fb:app_id`, `article:section`, `article:tag`, or `twitter:creator`; `twitter:site` comes from settings only when filled (UNVERIFIED whether the admin has a handle set).

---

## A.6. Mobile experience notes (from code) — OBSERVATION unless marked

- FACT — Viewport `width=device-width, initialScale 1, maximumScale 5, userScalable true` (`app/layout.tsx:153-161`).
- FACT — Bottom tab bar (`md:hidden`): Home, Feed(/latest), portrait slot (You / Sign in), Games, Forum; hidden on `/forum/create`, `/shop/checkout`, `/support/checkout`, `/cart`, `/messages` (`MobileTabBar.tsx:75-99`); `<main>` gets `pb-[calc(64px+safe-area)]` (`AppShell.tsx:68`). Between 768 px and 1280 px there is no tab bar and the More sheet shows five "Go to" chips instead (`MoreSheet.tsx:287-291,404-407`).
- FACT — Top bar on a phone: back arrow + section label on non-tab routes (`lib/mobileBar.ts`), search toggle, bell (members), More (`Header.tsx:1230-1260`).
- FACT — CSS: 44 px targets and `touch-action: manipulation` under `(hover: none) and (pointer: coarse)` (`globals.css:326-337`), 16 px inputs to stop iOS zoom (`:357`), `overscroll-behavior: contain`, tiny text sizes bumped on `<768px` (`:434-439`), `.reveal-on-hover` shown permanently on touch (`:858-896`), `prefers-reduced-motion` guards (four blocks), smooth-scroll disabled during history restore (`layout.tsx:244-261`).
- FACT — Images: our uploads optimised with `sizes`; third-party covers `unoptimized`; hero passes `sizes="(max-width: 768px) 100vw, …"`.
- FACT — `scripts/mobile-audit.mjs` measures 7 pages at 390×844 for "first content Y" etc. (not a dependency).
- OBSERVATION (friction): article template on phones stacks hero (390 px tall) → excerpt → body → in-article ad → JoinPrompt → `article_mid` ad → 250 px display ad → Google News box → tags/share → author → comments. Three ad units sit between the last paragraph and the comments/community area.
- OBSERVATION: breadcrumbs are hidden on phones (`hidden md:block`, `ArticleDetailView.tsx:143`); the JSON-LD still renders.
- OBSERVATION: the article sidebar (recommended, calendar, Discord) is `hidden xl:flex`, so phones never see the Discord widget or the recommended rail on articles; the only Discord ask on mobile is the footer.
- OBSERVATION: `/latest`, `/calendar`, `/leaderboard`, `/giveaways`, `/social`, `/forum` index are client-rendered; on slow mobile networks these show skeletons after the shell (the developer's comment on GA hydration timing, `layout.tsx:293-302`, documents 43 of 84 ad visitors leaving inside ten seconds).
- OBSERVATION: newsletter capture lives in the section-hub *sidebar* (`<aside>`), which on phones renders after the article grid — near the bottom of a long list.
- HYPOTHESIS: a compact inline JoinPrompt (the unused `variant="inline"`) after paragraph 3 would reach the ten-second bouncers the panel variant misses; the component already exists.

---

## A.7. Newsletter, web push, RSS, notifications — exactly what exists

**Newsletter (frontend)**
- FACT — Three subscribe forms, all `POST {NEXT_PUBLIC_API_URL}/newsletter/subscribe` with `{ email }` only (no `source`, no `tags`): `SectionHub.tsx:180-186`, `Gta6NewsletterCTA.tsx:23-27`, `FrontiersClient.tsx:76`. Double opt-in landing `/newsletter/verify` posts `{ token }` and redirects home after 3 s. Unsubscribe receipt page. No preference centre; the settings page has one "Email me" toggle for account emails (`SettingsClient.tsx:657-716`), separate from the newsletter.
- FACT (README §20) — Backend sends five mail types; campaigns are written in the admin; digest is not emailed.
- Gaps: no homepage capture, no article capture, no exit/scroll trigger, no segment tagging, dead `/#newsletter` anchor, no subscriber count visible anywhere.

**Web push / PWA**
- FACT — None: no service worker, no `PushManager`, no `Notification.requestPermission`, no `beforeinstallprompt` handler (grep: 0). `manifest.json` present. The Reverb `user.{id}` notification channel is kept server-side "so wiring push notifications later is then a frontend-only job" (`hooks/index.ts:8-12`).

**RSS**
- FACT — `/rss` and `/feed` proxy one backend feed: latest 40 articles + 10 guides with image enclosures (`RssController.php:11-103`). Linked from `<head>` (`/rss`), footer ("RSS"), `llms.txt` (`/feed`). No category, author, game, or forum feeds.

**Notifications**
- FACT — In-app bell (dropdown on desktop, bottom sheet on phone), SWR fetch on open, mark one/all read, types listed in §2 F23; email only via account toggle; no push; no digest email.

---

## A.8. Things that look like features but are not wired (cross-checked with `docs/README.md` §17)

| Item | Looks like | Truth (evidence) | In README §17? |
|---|---|---|---|
| "Sign up again" on unsubscribe page | a newsletter block on the homepage | anchor `/#newsletter` matches nothing in `app/` or `components/` (grep) | no — **new** |
| Sitelinks searchbox (`WebSite.potentialAction`) | a `/search` results page | `app/search/` does not exist; robots disallows `/search` (`layout.tsx:207`, `SitemapController.php:819`) | no — **new** |
| Frontiers "Notify me" | a Frontiers waitlist | generic newsletter subscribe, unsegmented (`FrontiersClient.tsx:76`) | no — **new** |
| GTA 6 "Pre-order now" retailer buttons | affiliate links | `href "#"` placeholders "= disabled" until filled (`Gta6PreOrder.tsx:4,49`) | no — **new** |
| `JoinPrompt variant="inline"` | mid-article CTA | defined, never rendered (`ArticleDetailView.tsx:333` uses panel only) | no — **new** |
| `/roadmap` OG image `/og-roadmap.jpg` | a share image | file absent from `public/`; layout block is overridden by the page's GM so nothing broken, but dead reference (`roadmap/layout.tsx:27-40`) | no |
| Shop OG `/og-shop.png` | share image | removed per comment; default used (`shop/page.tsx:19-23`) | no |
| Roadmap content (`lib/roadmapData.ts`) | current plan | says Q1 2026 "Backlog & Collection Tracker in_progress", "Custom User Lists planned", "Mobile App Q4 planned" — all already shipped or paused per code/README; roadmap is stale (FACT lines 16-160) | no — **new** |
| Header "Frontiers — Clans, territory, resources — coming" | a product | teaser page only | no |
| Shop | a store | "Coming Soon" when no products; PayPal sandbox | yes |
| Support tiers | donation tiers | "Support tiers are unavailable right now" when table empty | yes (tables empty) |
| "PC Specs" | rig showcase | comment in settings: "PC Specs was never displayed" (`SettingsClient.tsx:46`); the dashboard `RigCard.tsx` is presentational and shows connected platforms (imports `PlatformIcon`, no data fetch), not PC hardware | no — **new** |
| `menu-wrapped.webp` art | a "Wrapped" / year-in-review feature | image exists in `public/images/menu/`; no route, component or string named "wrapped" exists (grep over `app`, `components`, `lib`: only the English word in comments) — art for a feature that was never built | no — **new** |
| `WeeklyDigestNotification` | weekly email | database channel only (README §20) | yes (§20) |
| Six realtime hooks (news, reviews, guides, shop, comments, notifications) | live updates | removed; only forum hooks remain (`hooks/index.ts`) | no |
| `SchemaService` (backend) | site JSON-LD | staff debug endpoint only; frontend emits its own | yes |
| `maintenance_mode` setting | site switch | connected to nothing | yes |
| `ImageOptimizationService` | resized uploads | package missing, no-ops | yes |
| Referral URL in giveaways | referral programme | only inside a giveaway; nothing site-wide | no |
| "Trending" rail | trending signal | top-rated ≥8.5 by rating, not traffic (`DiscoverGames.tsx:58-61`) | no |
| Reader "Trending/Popular now" | popularity | `/feed/recommended-news` fallback "Popular now" — source metric UNVERIFIED | no |
| Facebook Pixel / TikTok pixel / Meta CAPI | conversion tracking | CSP whitelists `connect.facebook.net` but no pixel init found (grep `fbq(`: 0 hits) | no |

---

## A.9. Sources used

Repository files (all under `/home/user/techplay/`):

- `frontend/app/layout.tsx`, `frontend/app/page.tsx`, `frontend/app/HomeClient.tsx`, `frontend/app/not-found.tsx`, `frontend/app/error.tsx`, `frontend/app/template.tsx`
- `frontend/app/news/**`, `frontend/app/reviews/**`, `frontend/app/guides/**`, `frontend/app/hardware/**`, `frontend/app/latest/page.tsx`, `frontend/app/author/[slug]/page.tsx`
- `frontend/app/games/**` (page, `[slug]`, genre, platform, tag, year, series), `frontend/app/studios/**`, `frontend/app/calendar/**`
- `frontend/app/forum/**`, `frontend/app/profile/[username]/**`, `frontend/app/lists/**`, `frontend/app/leaderboard/**`, `frontend/app/social/**`, `frontend/app/friends/page.tsx`, `frontend/app/messages/page.tsx`, `frontend/app/settings/**`
- `frontend/app/giveaways/**`, `frontend/app/giveaway/[slug]/**`, `frontend/app/shop/**`, `frontend/app/cart/page.tsx`, `frontend/app/support/**`
- `frontend/app/gta6/**`, `frontend/app/wow-analyzer/page.tsx`, `frontend/app/backlog-advisor/**`, `frontend/app/last-disc/**`, `frontend/app/frontiers/**`, `frontend/app/tools/page.tsx`
- `frontend/app/about/page.tsx`, `frontend/app/contact/**`, `frontend/app/marketing/**`, `frontend/app/roadmap/**`, `frontend/app/rating-system/page.tsx`, `frontend/app/impressum/**`, `frontend/app/help/**`, `frontend/app/(auth)/**`, `frontend/app/auth/callback/page.tsx`, `frontend/app/newsletter/**`
- Route handlers: `frontend/app/rss/route.ts`, `frontend/app/feed/route.ts`, `frontend/app/api/revalidate/route.ts`, `frontend/app/og/{list,profile,studio}/route.tsx`, `frontend/app/proxy/gtag/route.ts`, `frontend/app/app-check/route.ts`
- Components: `layout/{Header,Footer,AppShell,MobileTabBar,MoreSheet,NotificationPanel,SearchDropdown,PageTransition}.tsx`, `seo/{GlobalSeo,Breadcrumbs}.tsx`, `share/SocialShare.tsx`, `news/{ArticleDetailView,JoinPrompt,ReadingTracker,RecommendedNews,NewsCard}.tsx`, `ui/{ArticleFooter,GoogleNewsFollow,ListingPagination,GameTile}.tsx`, `editorial/{SectionHub,FeedClient}.tsx`, `comments/CommentsSection.tsx`, `ads/{AdSense,AdSenseScript,config}.ts(x)`, `analytics/ConsentAwareAnalytics.tsx`, `home/*`, `games/{TrackGameButton,AddToListButton,GameRating,GameForumThreads,DataAttribution,GameDatabaseHub,GamesIndexShell}.tsx`, `guides/{GuideDetailView,GuideHelpful}.tsx`, `reviews/{ReviewDetailView,ReviewSidebar,ReviewCard}.tsx`, `gta6/{Gta6NewsletterCTA,Gta6PreOrder}.tsx`, `profile/**`, `home-dashboard/ProfileHero.tsx`, `settings/ConnectedAccountsSection.tsx`, `forum/ForumSidebar.tsx`, `auth/{SignInWall,BrandPanel}.tsx`, `author/{AuthorHeader,AuthorArticleGrid}.tsx`, `help/StillNeedHelp.tsx`, `roadmap/RoadmapCTA.tsx`
- Lib/context/hooks: `lib/{seo,sectionPages,facetGames,gameFacets,articleHref,categories,tools,roadmapData,consent,ogCovers,help,mobileBar,profileTabs,api,axios,echo}.ts`, `context/AuthContext.tsx`, `hooks/{index,useReleaseReminder,useForumReads}.ts`, `instrumentation-client.ts`, `instrumentation.ts`
- Config/public: `frontend/next.config.ts`, `frontend/package.json`, `frontend/.env.example`, `frontend/public/{manifest.json,ads.txt,llms.txt}`, `frontend/public/` listing, `frontend/app/globals.css`, `frontend/scripts/mobile-audit.mjs`
- Docs/backend for cross-checks: `docs/README.md` (§4, §5, §6, §12, §16, §17, §19, §20), `CLAUDE.md`, `backend/routes/web.php`, `backend/app/Http/Controllers/SitemapController.php`, `backend/app/Http/Controllers/RssController.php`, `deployment/nginx-site-techplay.conf`

External URLs fetched: none. All sources are repository files.

---

## A.10. Gaps / needs more data

1. UNVERIFIED — Newsletter subscriber count, verified vs unverified split, and which `source` (if any) the backend records for `/newsletter/subscribe`.
2. UNVERIFIED — Whether `bundle.articles` on the game page includes guides (backend bundle shape not inspected). Resolved: game tags are plain chips, not links (§4.8).
3. UNVERIFIED — Live HTML: whether `twitter:site` is populated (depends on admin settings), and which admin `page_seo` rows override the code defaults quoted here (44 records existed on 17 Aug 2026 per `lib/seo.ts:5-16`).
4. Resolved — `sitemap-pages.xml` contents are now listed as FACT in §4.3.
5. UNVERIFIED — Whether giveaway referral credit now works end-to-end on the backend.
6. Resolved — no "Wrapped" route exists; `RigCard` is a platforms card (§8).
7. UNKNOWN — Real counts for lists, wishlists, reminders, and Discord members (the Discord widget deliberately shows "no invented member counts", `DiscordWidget.tsx:16`).
8. UNKNOWN — Search Console per-template performance (only README aggregates: 56,355 indexed, 1–2 clicks/day after 17 Aug 2026).
9. UNVERIFIED — Whether the multi-MB PNGs in `public/` (`Woman DEX gradient.png`, `bg-main.png`, `bg-site.png`, `game-database.png`, `forum.png`, `WoW Analyzer.png`) are referenced anywhere other than the WoW OG tag; a `grep -rn` over `app`/`components`/`globals.css` for each filename was not run.
10. RECOMMENDATION for the merge step — treat §4.9 and §8 as the punch-list; every item there is provable from a file:line and fixable inside `frontend/` without backend changes except newsletter segmentation and giveaway referral verification.

---

# Part B — Backend and Discord bot audit


Label key (per protocol): **FACT** = verified in the repository at the cited path/line; **OBSERVATION** = seen but not measured; **ESTIMATE** = reasoned approximation with basis; **HYPOTHESIS** = untested; **RECOMMENDATION** = suggested action. Every production number in this file is copied from `docs/README.md` (measured 7 Sep 2026) or from a code comment that states its own measurement date; none are new measurements.

## B. Executive summary

1. FACT — The API is far larger than the public site suggests: **305 route definitions** under `/api/v1` (`backend/routes/api.php`, counted 27 Sep 2026), of which ~134 are authenticated member endpoints, ~95 are public reads, 18 are Discord-bot-only and 22 are the rate-limited games/calendar/studio catalogue.
2. FACT — Gamification is a complete, coherent economy: XP (10/5/15/10/15 per action, 100/day cap, `XpService.php:13-34`), 20 ranks (`RankSeeder.php:17-44`), a level curve anchored to those ranks (`LevelService.php:140-161`), 67 achievements across 29 criteria types (`AchievementSeeder.php:99-197`), a 23-quest core ladder plus 4 seasonal quests per season (`2026_08_31_210000_one_quest_ladder_from_the_first_day.php:46-125`), Bounty currency with a 12-rung reward tier ladder (`RewardTierService.php:269-282`) and a cosmetics store (`CustomizationSeeder.php`). Almost none of it is visible to a logged-out visitor, and the measured funnel that shaped it was 55 registered → 50 confirmed → 21 entered a giveaway → 7 commented → 3 added a game → 2 linked a platform (code comment, `…one_quest_ladder…php:9-14`).
3. FACT — **Of 22 notification classes, 20 are database-only** (bell icon); only email verification and password reset go out by mail (`app/Notifications/*.php` `via()` methods). The "weekly digest" (`SendWeeklyDigest.php`) is queued every Friday 16:00 (`routes/console.php:258`) and lands only in the on-site bell (`WeeklyDigestNotification.php:38-41`). There is **no automated retention email of any kind**.
4. FACT — A real newsletter/campaign desk exists since 11 Sep 2026 (`MailCampaign`, `CampaignAudience` with 4 segments + XP/recency filters, open/click tracking, suppression list, paced sending), but it is entirely manual: an editor writes and sends each campaign from Filament (`MailCampaignResource.php:169-222, 377`).
5. FACT — The games database schema is rich (time to beat, game modes, perspectives, multiplayer, languages, artworks, similar games, engines, critic scores, store links, prices, relations, series — `Game.php:14-91`), but only **1,967 of 295,023 indexable game pages carry anything "ours"** (0.7 %) per `docs/README.md:592`. Programmatic-SEO facets already exist in the API: genre, platform, year, tag hubs (`GameRatingController.php:214-254`), series (`GameController.php:694`), studios and studio-by-country (`StudioController.php:26-34`), hidden gems, on-this-day, calendar.
6. FACT — The Discord bot ("Professor Buffy", a wise-owl persona, `BuffyService.ts:3-6`) already posts every published article/review/guide/hardware piece to `#latest-news` via push from the backend (`DiscordAnnouncer.php`, `PublishListener.ts`), welcomes joiners in `#new-people`, mirrors XP into the site's capped economy, runs a Sunday 20:00 weekly recap, member-count voice channels, a rotating status, DM subscriptions, and 20 slash commands (`definitions.ts`). It has no scheduled "content" beyond recap and article pushes, no reaction roles, no challenge/quest reactions.
7. FACT — Growth-relevant loose ends found in code: `SchemaService` is read only by a staff-only debug endpoint (`SeoController.php:60-67`); the Discord `/daily` claim bypasses `XpService` and pays 50–100 uncapped XP directly (`DiscordDailyController.php:69-76`) while the same bot's message XP was deliberately routed through the cap (`DiscordXpController.php:15-31`); the shop, support tiers and PayPal are unlaunched/sandbox (`docs/README.md:66, 863`); the Frontiers page collects emails into the general newsletter list with no segment tag (`FrontiersClient.tsx:76`).
8. FACT — Two counters exist for traffic and they disagree by design: GA (consented only until 20 Sep 2026, now Google CMP) and a first-party, cookieless collector fed by the GA relay (`AnalyticsCollector.php:11-22`, `docs/README.md §19`). Search Console figures in `docs/README.md:584-597`: 56,355 indexed, 1–2 clicks/day since the 17 Aug 2026 Cloudflare 403 incident, Googlebot ~290 requests/day of which 77 game pages.

---

## B.0. Method

- Read in full: `docs/README.md` (1,168 lines), `backend/routes/api.php` (766 lines), `backend/routes/console.php` (298 lines), all 22 notification classes' `via()` methods, all seeders for achievements/quests/ranks/rewards/customizations/categories/forum/seasons, the gamification services, the newsletter/campaign services and models, the Discord bot's `src/**` (4,213 lines total, `wc -l`).
- Skimmed by grep/outline: 88 API controllers, 93 model files (`ls backend/app/Models | wc -l` = 93; `docs/README.md:243` says 86 — the difference is most likely models added between 7 and 27 Sep 2026: `MailCampaign*`, `MailSuppression`, `MailTemplate`, `AnalyticsBreakdown/Daily/Event`; OBSERVATION, not verified by git), 275 migrations, 49 commands (README) / 56 command files incl. a `Diagnose/` folder with 9 read-only diagnostics, 43 Filament resource classes + 4 pages + 13 widgets.
- No external web sources were used in this file; the sources CSV therefore contains only the header row.

---

## B.1. API surface map

FACT — All routes are under `Route::prefix('v1')` (`backend/routes/api.php:96`). Counting `Route::get|post|put|patch|delete(` and chained `->get(…)` etc. gives **305 endpoint definitions** (27 Sep 2026). Grouped by the file's own structure:

### B.1.1 Summary table

| # | Area | Endpoints | Auth | Throttle | What a product/marketing person should know | Lines |
|---|---|---|---|---|---|---|
| 1 | System & analytics ingest | 4 | public / shared secret | 6000/min for `/analytics/collect` | `/analytics/collect` receives a copy of every GA hit from the Next relay (first-party counter). `/system/status` is the bot's liveness ping; `/system/app-version` gates the paused mobile app. | 106–118 |
| 2 | Auth & social login | 13 | public (60/min) | forgot/reset 5 per 10 min | Register, login, forgot/reset password, resend verification, **Discord**, **Google** and **Battle.net** OAuth (redirect/callback + authenticated "link-intent"). Turnstile protects registration (README §14). | 121–162 |
| 3 | Discord bot | 18 | `discord.bot` token | 300/min | User card by Discord id, rank ladder, library/match/backlog by Discord id, XP add, presence, guild membership (single + full roster sync), top-10 leaderboard, daily claim, DM subscriptions, gift XP, admin give/remove XP, start event. | 169–204 |
| 4 | Account, notifications, WoW chars, watched threads | 18 | Sanctum | export 5/10 min | Profile update, password, **full data export**, account deletion, notification list/read, WoW character list, watched/bookmarked forum threads, guide helpful vote, Last Disc export (staff). | 207–233 |
| 5 | Friends & Social Hub chat | 16 | Sanctum | — | Friend request/accept/decline/block; conversations (direct + group), messages, reactions, participants, leave. Legacy `/messages` removed 08.08.2026 (comment at 256–260). | 236–254 |
| 6 | Email verification, shop orders | 5 | Sanctum | — | PayPal create/capture order + cash-on-delivery order. Shop is unlaunched (README §1). | 263–269 |
| 7 | Forum (write) | 22 | Sanctum + `ban.check` | 5–60/min | Threads, posts, upvote, pin (staff), **self-pin for 100 Bounty**, lock, edit, delete, restore, merge, mark solution, watch, bookmark, read state, screenshot upload, per-post reactions, one poll per thread. | 274–306 |
| 8 | Ratings, collection, presence | 13 | Sanctum | 30–60/min; import 5/min | Game star rating + written review (upsert/delete), library upsert/delete/showcase, import, manual presence set/clear, slug→status map, upcoming from wishlist, calendar reminder toggle. | 309–329 |
| 9 | "Me" surfaces | 17 | Sanctum | bookmark 60, progress 120/min | Collection goals, trophy case, personalized feed, dashboard, recommendations, upcoming, reading list + read progress, **Backlog Advisor**, daily streak show/claim, quests, recognitions give/remove, friend activity. | 332–366 |
| 10 | Connected accounts | 11 | Sanctum | 6–20/min | Steam (OpenID), Xbox (gamertag + bio verification code), PlayStation (npsso paste), GOG (code paste), Epic (code paste); sync, visibility, disconnect. | 369–388 |
| 11 | Journal, Bounty, rewards, cosmetics | 16 | Sanctum | — | Play-session journal incl. Steam-suggested sessions and "moments" (screenshots), bounty balance, reward catalog/redemptions/redeem, cosmetics acquire/equip/unequip. | 392–409 |
| 12 | Game lists (write) | 13 | Sanctum | 60/min | Create/edit/delete lists, cover upload, add/bulk add/remove/reorder items, tiers (tier lists), like, comment. | 412–426 |
| 13 | Supporter pledges | 2 | Sanctum | — | PayPal pledge + "my support". Sandbox only. | 431–432 |
| 14 | Newsletter & mail tracking | 8 | public | subscribe 5/10 min, verify 5/60 min, unsubscribe 30/min | Double opt-in subscribe, verify, **one-click unsubscribe (GET + RFC 8058 POST)**, open pixel `/mail/o/{token}`, signed click redirect `/mail/c/{token}`. | 438–489 |
| 15 | Last Disc, contact, navigation, home, search, help, feed | 17 | public | sign 5/10 min, contact 3/10 min | Last Disc petition + poll, contact form, nav tree, homepage payload, 4 search endpoints, help centre (help.techplay.gg) reads + "helpful", `/feed/latest`, `/feed/recommended-news`. | 494–532 |
| 16 | Editorial content | 17 | public (3000/min) | — | `/newsroom/{section}` furniture, `/news`, `/reviews`, `/categories/{slug}`, forum reads (stats, categories, active, unanswered, category, thread, search), `/guides`, `/tech`. | 537–565 |
| 17 | Leaderboard, presence, WoW, shop, support, settings, page-SEO, rewards, public lists, seasons | 21 | public | WoW 60/min | Public leaderboard (6 boards × 3 periods), presence by username, **WoW Analyzer** (analyze, leaderboard, recent, show, share, realms), shop products, support tiers, site settings, per-path SEO, rewards catalog, list discovery/tags/show/comments, seasons. | 568–608 |
| 18 | Public profile | 13 | public (taste-match needs viewer) | — | Collection, goals, achievements, **Gamer DNA**, journal, lists, activity, recognitions, Steam achievements, trophy case, profile card, taste match. | 613–627 |
| 19 | Redirects, staff, authors, GTA 6, ads, comments read, tracking | 19 | public; `/track/event` auth | ads click, track 30/min | Redirect map, `/staff` (About page), author pages, GTA 6 (locations, categories, characters, vehicles + classes, weapons + types), ad by position + click, comments by type/id, article view counts, funnel events. | 630–669 |
| 20 | Games, calendar, studios | 22 | public, named `api` limiter (60/min per IP, SSR exempt) | — | Calendar month/day/entry, games hub, games calendar, hidden gems, on this day, random, **facet hubs `/games/hub/{genre|platform|year|tag}/{value}`**, list, per-game bundle/articles/screenshots/videos/series/suggested/ratings/threads, series page, studios list (+country filter) and page. | 676–706 |
| 21 | Comments write, reports | 3 | Sanctum | 30/min; reports 5/min | Comment store/vote, report. | 709–711 |
| 22 | Signed image routes, Discord relay, SEO tools | 7 | signed / Sanctum | — | Journal moment image, DM attachment (signed URLs), manual Discord announce relay (staff), SEO suggest-links / orphan pages / inbound links / **schemas (staff debug)**. | 714–734 |
| 23 | Giveaways | 8 | public reads; Sanctum writes | enter/task/daily 10/min | Hub, list, show, leaderboard, enter (with `referral_code`), complete task, **daily bonus**, my entry. | 741–757 |
| 24 | PayPal webhook | 1 | signature | — | Order/subscription webhooks. | 764 |

### B.1.2 Every endpoint, by area (FACT, `backend/routes/api.php`)

**System & analytics (L106–118)**
- `POST /analytics/collect` (throttle 6000/min, shared `ANALYTICS_INGEST_TOKEN`)
- `GET /system/status` · `GET /system/app-version` · `GET /system/health`

**Auth & social login (L121–162, throttle 60/min)**
- `POST /auth/register` · `POST /auth/login`
- `POST /auth/forgot-password` · `POST /auth/reset-password` (5 per 10 min)
- `POST /email/resend-public` (5 per 10 min)
- `GET /auth/discord/redirect` · `POST /auth/discord/link-intent` (auth) · `GET /auth/discord/callback`
- `GET /auth/google/redirect` · `POST /auth/google/link-intent` (auth) · `GET /auth/google/callback`
- `GET /auth/battlenet/redirect` · `GET /auth/battlenet/callback`

**Discord bot (L169–204, `discord.bot` middleware, 300/min)**
- `GET /discord/user/{discordId}` · `GET /discord/ranks`
- `GET /discord/library/{discordId}` · `GET /discord/match/{discordId}/{otherDiscordId}` · `GET /discord/backlog/{discordId}`
- `POST /discord/xp` · `POST /discord/presence`
- `POST /discord/membership` · `POST /discord/membership/sync`
- `GET /discord/leaderboard` · `POST /discord/daily`
- `GET /discord/subscriptions` · `POST /discord/subscriptions` · `DELETE /discord/subscriptions`
- `POST /discord/gift`
- `POST /discord/admin/xp/give` · `POST /discord/admin/xp/remove` · `POST /discord/admin/event`

**Account & notifications (L207–233, Sanctum)**
- `POST /auth/logout` · `POST /auth/refresh` · `GET /auth/me`
- `PUT /user/profile` · `PUT /user/password` · `GET /user/export-data` (5 per 10 min) · `DELETE /user/account`
- `POST /guides/{slug}/vote` (30/min) · `GET /last-disc/export` (staff)
- `GET /user/notifications/counts` · `GET /notifications` · `PATCH /notifications/{id}/read` · `POST /notifications/read-all`
- `GET /user/wow-characters` · `POST /user/wow-characters/{id}/set-main` · `DELETE /user/wow-characters/{id}`
- `GET /user/watched-threads` · `GET /user/bookmarked-threads`

**Friends & Social Hub (L236–254, Sanctum)**
- `GET /friends` · `POST /friends/request` · `POST /friends/block/{id}` · `DELETE /friends/block/{id}` · `POST /friends/accept/{id}` · `POST /friends/decline/{id}`
- `GET /social` · `GET /conversations` · `POST /conversations` · `GET /conversations/{c}/messages` · `POST /conversations/{c}/messages` · `POST /conversations/{c}/read` · `DELETE /conversations/{c}/messages/{m}` · `POST /conversations/{c}/participants` · `DELETE /conversations/{c}/leave` · `POST /messages/{m}/react`

**Verification & shop (L263–269, Sanctum)**
- `POST /email/resend` · `GET /email/status`
- `POST /shop/orders` · `POST /shop/orders/capture` · `POST /shop/orders/cod`

**Forum write (L274–306, Sanctum, `ban.check` on content writes)**
- `POST /forum/threads` (10/min) · `POST /forum/threads/{slug}/posts` (20/min) · `POST /forum/threads/{slug}/upvote` (20/min)
- `POST /forum/threads/{slug}/pin` (staff) · `POST /forum/threads/{slug}/self-pin` (5/min, 100 Bounty) · `POST /forum/threads/{slug}/lock`
- `PUT /forum/threads/{slug}` · `DELETE /forum/threads/{slug}` · `POST /forum/threads/{slug}/restore` · `POST /forum/threads/{slug}/merge`
- `PUT /forum/threads/{slug}/posts/{postId}` · `DELETE /forum/threads/{slug}/posts/{postId}` · `POST /forum/threads/{slug}/posts/{postId}/solution`
- `POST /forum/threads/{slug}/watch` · `POST /forum/threads/{slug}/bookmark`
- `GET /forum/reads` · `POST /forum/threads/{slug}/read` (60/min) · `POST /forum/reads/all` (10/min)
- `POST /forum/uploads` (10/min) · `POST /forum/threads/{slug}/posts/{postId}/reactions` (40/min)
- `POST /forum/threads/{slug}/poll` (5/min) · `POST /forum/threads/{slug}/poll/vote` (20/min)

**Ratings, collection, presence (L309–329, Sanctum)**
- `GET /games/{slug}/ratings/my` · `POST /games/{slug}/ratings` (30/min) · `DELETE /games/{slug}/ratings` (30/min)
- `GET /collection/games/{slug}` · `PUT /collection/games/{slug}` (60/min) · `DELETE /collection/games/{slug}` (60/min) · `POST /collection/games/{slug}/showcase` (60/min) · `POST /collection/import` (5/min)
- `POST /presence` · `DELETE /presence`
- `GET /collection/index` · `GET /collection/upcoming` · `POST /calendar/{slug}/reminder`

**"Me" surfaces (L332–366, Sanctum)**
- `PUT /me/collection-goals` · `GET /me/trophy-case/available` · `PUT /me/trophy-case`
- `GET /feed/personalized` · `GET /me/dashboard` · `GET /me/recommendations` · `GET /me/upcoming`
- `GET /me/reading` · `POST /articles/{slug}/bookmark` (60/min) · `PUT /articles/{slug}/progress` (120/min)
- `GET /backlog/recommendations`
- `GET /user/streak` · `POST /user/streak/claim` · `GET /user/quests`
- `POST /users/{username}/recognitions` · `DELETE /users/{username}/recognitions/{type}`
- `GET /friends/activity`

**Connected accounts (L369–388, Sanctum)**
- `GET /connected-accounts` · `GET /connected-accounts/steam/connect`
- `POST /connected-accounts/xbox/connect` (10/min) · `POST /connected-accounts/xbox/verify` (10/min) · `POST /connected-accounts/xbox/verify/confirm` (20/min)
- `POST /connected-accounts/playstation/connect` (6/min) · `POST /connected-accounts/gog/connect` (6/min) · `POST /connected-accounts/epic/connect` (6/min)
- `POST /connected-accounts/{id}/sync` · `PATCH /connected-accounts/{id}/visibility` · `DELETE /connected-accounts/{id}`

**Journal, Bounty, rewards, cosmetics (L392–409, Sanctum)**
- `GET /journal/suggestions` · `POST /journal/suggestions/{s}` · `DELETE /journal/suggestions/{s}`
- `POST /journal/sessions` · `PUT /journal/sessions/{s}` · `DELETE /journal/sessions/{s}` · `POST /journal/sessions/{s}/moments` · `DELETE /journal/moments/{m}`
- `GET /bounty` · `GET /rewards/catalog` · `GET /rewards/redemptions` · `POST /rewards/{slug}/redeem`
- `GET /customizations` · `POST /customizations/{id}/acquire` · `POST /customizations/{id}/equip` · `POST /customizations/{id}/unequip`

**Game lists write (L412–426, Sanctum, 60/min)**
- `GET /game-lists/mine` · `POST /game-lists` · `PUT /game-lists/{id}` · `DELETE /game-lists/{id}` · `POST /game-lists/{id}/cover`
- `POST /game-lists/{id}/items` · `POST /game-lists/{id}/items/bulk` · `DELETE /game-lists/{id}/items/{itemId}` · `PUT /game-lists/{id}/reorder` · `PUT /game-lists/{id}/items/{itemId}`
- `POST /game-lists/{id}/like` · `POST /game-lists/{id}/comments` · `DELETE /game-lists/{id}/comments/{commentId}`

**Support (L431–432, Sanctum)** — `POST /support/pledge` · `GET /support/mine`

**Public: newsletter & mail (L438–489)**
- `GET /email/verify/{id}/{hash}` (signed)
- `GET /connected-accounts/steam/callback`
- `POST /newsletter/subscribe` (5 per 10 min) · `POST /newsletter/verify` (5 per 60 min)
- `GET|POST /newsletter/unsubscribe/{token}` (30/min)
- `GET /mail/o/{token}` (open pixel) · `GET /mail/c/{token}` (signed click) (120/min)

**Public: campaigns, contact, navigation, home, search, help, feed (L494–532)**
- `GET /last-disc` · `POST /last-disc/sign` (5 per 10 min) · `POST /last-disc/vote` (10 per 10 min)
- `POST /contact` (3 per 10 min)
- `GET /navigation/tree` · `GET /home`
- `GET /search/articles` · `GET /search/games` · `GET /search/users` · `GET /search/help`
- `GET /help` · `GET /help/search` · `GET /help/topics/{slug}` · `GET /help/answers/{slug}` · `POST /help/answers/{slug}/helpful` (10/min)
- `GET /feed/latest` · `GET /feed/recommended-news`

**Public: editorial (L537–565)**
- `GET /newsroom/{section}` · `GET /news` · `GET /news/{slug}` · `GET /reviews` · `GET /reviews/{slug}` · `GET /categories/{slug}`
- `GET /forum/stats` · `GET /forum/categories` · `GET /forum/active` · `GET /forum/unanswered` · `GET /forum/categories/{slug}` · `GET /forum/threads/{slug}` · `GET /forum/search` (30/min)
- `GET /guides` · `GET /guides/{slug}` · `GET /tech` · `GET /tech/{slug}`

**Public: leaderboard, presence, WoW, shop, settings, SEO, rewards, lists, seasons (L568–608)**
- `GET /leaderboard` · `GET /presence/{username}`
- `POST /wow/analyze` · `GET /wow/leaderboard` · `GET /wow/recent` · `GET /wow/analysis/{id}` · `POST /wow/analysis/{id}/share` · `GET /wow/realms/{region}` (60/min)
- `GET /shop/products` · `GET /shop/products/{slug}` · `GET /support/tiers`
- `GET /settings` · `GET /page-seo` · `GET /page-seo/{path}`
- `GET /rewards`
- `GET /game-lists/discover` · `GET /game-lists/tags` · `GET /game-lists/{id}` · `GET /game-lists/{id}/comments`
- `GET /seasons` · `GET /seasons/active`

**Public profile (L613–627)**
- `GET /users/{username}/taste-match` (needs viewer) · `GET /users/{username}/collection` · `GET /users/{username}/collection-goals` · `GET /users/{username}/achievements` · `GET /users/{username}/gamer-dna` · `GET /users/{username}/journal` · `GET /users/{username}/lists` · `GET /users/{username}/lists/{slug}` · `GET /users/{username}/activity` · `GET /users/{username}/recognitions` · `GET /users/{username}/steam-achievements` · `GET /users/{username}/trophy-case` · `GET /users/{username}`

**Public: redirects, staff, authors, GTA 6, ads, comments, tracking (L630–669)**
- `GET /redirects` · `GET /staff` · `GET /authors/{slug}` · `GET /authors/{slug}/articles`
- `GET /gta6/locations` · `GET /gta6/categories` · `GET /gta6/characters` · `GET /gta6/characters/{slug}` · `GET /gta6/vehicles` · `GET /gta6/vehicles/classes` · `GET /gta6/vehicles/{slug}` · `GET /gta6/weapons` · `GET /gta6/weapons/types` · `GET /gta6/weapons/{slug}`
- `GET /ads/{position}` · `POST /ads/{id}/click`
- `GET /comments/{type}/{id}` · `GET /articles/{slug}/views` · `POST /track/event` (auth, 30/min)

**Games, calendar, studios (L676–706, named `api` limiter)**
- `GET /calendar` · `GET /calendar/day/{date}` · `GET /calendar/{slug}`
- `GET /games/hub` · `GET /games/calendar` · `GET /games/hidden-gems` · `GET /games/on-this-day` · `GET /games/random` · `GET /games/hub/{type}/{value}` · `GET /games`
- `GET /games/{slug}/bundle` · `GET /games/{slug}/articles` · `GET /games/{slug}/screenshots` · `GET /games/{slug}/videos` · `GET /games/series/{slug}` · `GET /games/{slug}/series` · `GET /games/{slug}/suggested` · `GET /games/{slug}/ratings` · `GET /games/{slug}/threads` · `GET /games/{slug}`
- `GET /studios` · `GET /studios/{slug}`

**Comments, reports, signed, relay, SEO tools, giveaways, PayPal (L709–764)**
- `POST /comments` (30/min) · `POST /comments/{id}/vote` (30/min) · `POST /reports` (5/min)
- `GET /journal/moments/{moment}/image` (signed) · `GET /chat/attachments/{message}` (signed)
- `POST /webhooks/discord/notify` (staff, 10/min)
- `POST /seo/suggest-links` · `GET /seo/orphan-pages` · `GET /seo/articles/{article}/inbound-links` · `GET /seo/articles/{article}/schemas` (auth; staff check inside)
- `GET /giveaways/hub` · `GET /giveaways` · `GET /giveaways/{slug}` · `GET /giveaways/{slug}/leaderboard`
- `POST /giveaways/{slug}/enter` · `POST /giveaways/{slug}/tasks/{taskId}/complete` · `POST /giveaways/{slug}/daily-bonus` (10/min) · `GET /giveaways/{slug}/my-entry`
- `POST /webhooks/paypal`

OBSERVATION — Response envelopes are inconsistent across listing endpoints (six shapes across seven endpoints, measured in `docs/README.md:216-228`). The mobile app absorbs this in `mobile/src/lib/paging.ts`; any third-party consumer (a partner, a Zapier-style automation) would meet the same inconsistency.

FACT — Rate limits that matter for growth mechanics: newsletter subscribe 5 per 10 min per IP (`api.php:447`), contact 3 per 10 min (`api.php:499`), Last Disc signature 5 per 10 min (`api.php:495`), giveaway entry actions 10/min (`api.php:749`), catalogue reads 60/min per IP for non-SSR callers (`api.php:672-676`).

---

## B.2. Community & gamification data model

### B.2.1 XP

FACT (`backend/app/Services/XpService.php`):
- Constants: `XP_COMMENT = 10` (L13), `XP_GAME_ADDED = 5` (L15), `XP_GAME_COMPLETED = 15` (L17), `XP_GAME_REVIEW = 10` (L19), `XP_DISCORD_MESSAGE = 15` (L30), `DAILY_XP_CAP = 100` (L32), `COMMENT_COOLDOWN_SECONDS = 60` (L34).
- Season multiplier applied before the cap (L49); cap counted atomically in Redis with midnight TTL (L75-95); quests bypass the cap (`respectDailyCap: false`, `QuestService.php:118`).
- Rank recomputed on every award; demotion is possible when the ladder is re-thresholded and is deliberately not announced (L120-155); a promotion sends `RankUpNotification` and writes to the per-request `RewardLedger` so the page can toast it (`RewardLedger.php:139-153`).
- Other award sites: forum post +20 XP (`PostObserver.php:45`), thread +15 XP (`ThreadObserver.php:105`), comment +10 only once approved (`CommentObserver.php:62`), game added +5 once per game per 30 days (`GameCollectionController.php:240-245`), game completed +15 once ever via ledger reference (`GameCollectionController.php:212-236`), game review +10 once per game (`GameRatingController.php:170-186`), Discord message via `DiscordXpController.php:59`.
- XP is **progression only**; it no longer mirrors into Bounty (comment at `XpService.php:105-108`).

### B.2.2 Levels

FACT (`LevelService.php:140-164`): the XP→level curve is anchored to the rank ladder; anchors `[0→1, 100→2, 300→3, 600→5, 1000→7, 2000→11, 3500→15, 5000→19, 7500→24, 10000→28, 15000→35, 20000→41, 30000→51, 45000→63, 60000→74, 80000→86, 100000→96, 150000→119, 250000→154, 500000→220]`, then 3,788 XP per level beyond. `progress()` returns level, level_start, next_level_xp, percent (L234-249).

### B.2.3 Ranks (20)

FACT (`database/seeders/RankSeeder.php:17-44`), `min_xp`:

| # | Rank | min XP | # | Rank | min XP |
|---|---|---|---|---|---|
| 1 | Newcomer | 0 | 11 | Challenger | 15,000 |
| 2 | Player | 100 | 12 | Elite | 20,000 |
| 3 | Rookie | 300 | 13 | Veteran | 30,000 |
| 4 | Bronze | 600 | 14 | Legend | 45,000 |
| 5 | Silver | 1,000 | 15 | Mythic | 60,000 |
| 6 | Gold | 2,000 | 16 | Immortal | 80,000 |
| 7 | Platinum | 3,500 | 17 | Ascendant | 100,000 |
| 8 | Diamond | 5,000 | 18 | Radiant | 150,000 |
| 9 | Master | 7,500 | 19 | Apex | 250,000 |
| 10 | Grandmaster | 10,000 | 20 | Eternal | 500,000 |

Each has a colour and a `/ranks/{name}.webp` insignia served by the frontend (L55-58). The Discord bot mirrors these as roles (`RoleLadderService.ts`, `LinkService.ts`).

ESTIMATE — At the 100 XP/day cap a member needs ≥ 20 days of maximal activity to reach Gold and ≥ 50 days to reach Diamond; the upper half of the ladder (Veteran+ at 30k) is effectively multi-year at the cap. Basis: `DAILY_XP_CAP` and `RankSeeder` thresholds; quests bypass the cap so real pace is somewhat faster.

### B.2.4 Achievements (67 across 29 criteria types)

FACT — The catalogue lives in `database/seeders/AchievementSeeder.php:97-197` (67 entries, counted); the seeder prunes anything not in that list (L85-87), so the older `XpAchievementsSeeder.php` entries are superseded. Unlock rules: `AchievementService::check()` compares the user's current value for a `criteria_type` against `criteria_value` (L27-81); `special` = manual grant only, `is_hidden` = unreachable (L33-34); meta "achievements_count" sweep runs after any unlock (L68-70); unique index makes duplicate unlocks impossible (L318-355). Unlock is toasted via `RewardLedger` and stored as a database notification (L344-352). Nightly `achievements:sync` at 04:15 catches the ~dozen types with no inline trigger (`routes/console.php:245-252`).

| # | Achievement | criteria_type | value | points | Trigger site (FACT) |
|---|---|---|---|---|---|
| 1 | Verified Gamer | email_verified | 1 | 25 | `VerificationController.php:84` |
| 2 | Gamer Tag | gamertags | 1 | 25 | `AuthController.php:686` |
| 3 | Multi-Platform | gamertags | 3 | 75 | same |
| 4 | Battlestation | pc_specs | 4 | 50 | same |
| 5 | Discord Native | discord (guild member) | 1 | 75 | `DiscordMembershipController.php:132` |
| 6 | Plugged In | connected_accounts | 3 | 100 | `ConnectedAccountController.php` (5 sites) |
| 7 | Early Adopter | early_adopter (< `2027-01-01` default) | 1 | 200 | nightly sweep |
| 8 | Game Hunter | games_added | 1 | 25 | `GameCollectionController.php:196-201` |
| 9 | Growing Library | games_added | 10 | 75 | same |
| 10 | Dedicated Collector | games_added | 50 | 150 | same |
| 11 | Game Hoarder | games_added | 100 | 300 | same |
| 12 | Librarian | games_added | 250 | 500 | same |
| 13 | Platform Pioneer | collection_platforms | 2 | 100 | same |
| 14 | Cross-Platform Gamer | collection_platforms | 5 | 250 | same |
| 15 | In the Zone | games_playing | 1 | 15 | same |
| 16 | Juggler | games_playing | 5 | 75 | same |
| 17 | Dreamer | games_wishlisted | 1 | 50 | same |
| 18 | Window Shopper | games_wishlisted | 25 | 200 | same |
| 19 | Finisher | games_completed | 1 | 50 | same |
| 20 | Completionist | games_completed | 10 | 200 | same |
| 21 | Master of Games | games_completed | 50 | 750 | same |
| 22 | First Blood | backlog_completed | 1 | 75 | same |
| 23 | Ten Down | backlog_completed | 10 | 200 | same |
| 24 | Backlog Slayer | backlog_completed | 25 | 400 | same |
| 25 | Backlog Conqueror | backlog_completed | 50 | 1000 | same |
| 26 | First Opinion | ratings_count (published written) | 1 | 10 | `GameRatingController.php:183` |
| 27 | Critic | ratings_count | 10 | 100 | same |
| 28 | Voice of the People | ratings_count | 50 | 200 | same |
| 29 | First Steps | posts_count | 1 | 50 | `PostObserver.php:50` |
| 30 | Conversation Starter | threads_count | 1 | 75 | `ThreadObserver.php:106` |
| 31 | Active Voice | posts_count | 10 | 100 | observer |
| 32 | Prolific Poster | posts_count | 50 | 250 | observer |
| 33 | Forum Legend | posts_count | 250 | 500 | observer |
| 34 | Elite Member | posts_count | 500 | 750 | observer |
| 35 | Discussion Leader | threads_count | 10 | 200 | observer |
| 36 | Agenda Setter | threads_count | 25 | 400 | observer |
| 37 | Essayist | long_posts (≥2,500 chars) | 5 | 300 | nightly sweep |
| 38 | Problem Solver | solutions_count | 1 | 150 | `ForumController.php:1095` |
| 39 | Solution Machine | solutions_count | 25 | 500 | same |
| 40 | Community Pillar | thread_upvotes_received | 250 | 300 | nightly sweep |
| 41 | Beloved | comment_likes_received | 500 | 400 | nightly sweep |
| 42 | Rising Star | reputation | 100 | 100 | `ThreadObserver.php:106` / sweep |
| 43 | Recognized | reputation | 500 | 300 | same |
| 44 | Local Legend | reputation | 1,000 | 750 | same |
| 45 | Hall of Fame | reputation | 5,000 | 1000 | same |
| 46 | Level 5 | xp | 600 | 100 | `XpService.php:115` |
| 47 | Level 10 | xp | 1,750 | 250 | same |
| 48 | Level 25 | xp | 8,125 | 500 | same |
| 49 | Level 50 | xp | 29,000 | 1000 | same |
| 50 | Warming Up | daily_streak | 3 | 50 | `StreakService.php:65` |
| 51 | One Week Strong | daily_streak | 7 | 100 | same |
| 52 | Iron Habit | daily_streak | 30 | 400 | same |
| 53 | Unbreakable | daily_streak | 100 | 1000 | same |
| 54 | Consistent | active_days | 15 | 100 | same |
| 55 | Dedicated | active_days | 100 | 300 | same |
| 56 | Friendly | friends_count | 1 | 50 | `FriendController.php:101-102` |
| 57 | Socialite | friends_count | 10 | 150 | same |
| 58 | Popular | friends_count | 50 | 300 | same |
| 59 | Squad Goals (hidden) | special — "invite 5 who verify" | 5 | 200 | **manual only; no referral system exists** |
| 60 | Shelf Starter | achievements_count | 5 | 50 | meta sweep |
| 61 | Serious Shelf | achievements_count | 20 | 300 | meta sweep |
| 62 | The Vault | achievements_count | 40 | 500 | meta sweep |
| 63 | Museum Curator | achievements_count | 60 | 1000 | meta sweep |
| 64 | Collector | orders_count | 1 | 50 | PayPal controllers — **shop unlaunched** |
| 65 | Gear Collector | orders_count | 5 | 250 | same |
| 66 | TechPlay Patron | support_tier | 1 | 500 | **tiers unlaunched** |
| 67 | Legacy Supporter | support_duration (months) | 12 | 1000 | same |

### B.2.5 Quests (23 core + 4 per season) and seasons

FACT — The **live** quest catalogue is written by migration `2026_08_31_210000_one_quest_ladder_from_the_first_day.php` (the older `QuestSeeder.php` is superseded; the migration switches old rows off rather than deleting them, L192-196). `docs/README.md:408` counts 53 rows in `quests`, which is the historical total including retired ones. The active board (`[name, type, criteria, value, xp, bounty]`, L46-82):

| Layer | Quest | criteria | value | XP | Bounty |
|---|---|---|---|---|---|
| permanent | Welcome Aboard | daily_login | 1 | 40 | 30 |
| permanent | Link Your Library | platform_connected | 1 | 60 | 100 |
| permanent | First Game | game_added | 1 | 40 | 40 |
| permanent | Stock the Shelf | game_added | 10 | 60 | 80 |
| permanent | First Words | comment_posted | 1 | 40 | 30 |
| permanent | First Session | session_logged | 1 | 50 | 50 |
| permanent | First Completion | game_completed | 1 | 60 | 100 |
| permanent | Try Your Luck | giveaway_entered | 1 | 40 | 50 |
| daily | Check In | daily_login | 1 | 20 | 15 |
| daily | Chime In | comment_posted | 1 | 25 | 15 |
| daily | Log a Session | session_logged | 1 | 30 | 20 |
| daily | Add a Game | game_added | 1 | 20 | 15 |
| weekly | Five Days Running | streak_days | 5 | 60 | 60 |
| weekly | Finish One | game_completed | 1 | 60 | 80 |
| weekly | Five Sessions | session_logged | 5 | 60 | 70 |
| weekly | Rate a Game | game_rated | 1 | 60 | 60 |
| weekly | Five Comments | comment_posted | 5 | 50 | 50 |
| weekly | Make a Friend | friend_made | 1 | 50 | 60 |
| monthly | Three Finished | game_completed | 3 | 80 | 250 |
| monthly | Twenty Days | streak_days | 20 | 80 | 300 |
| monthly | Fifteen Sessions | session_logged | 15 | 80 | 220 |
| monthly | Five Ratings | game_rated | 5 | 80 | 200 |
| monthly | Two Discussions | thread_started | 2 | 80 | 180 |
| Season 1: Ignition | Shelf of Twenty | game_added | 20 | 100 | 400 |
| Season 1: Ignition | Two to the End | game_completed | 2 | 100 | 350 |
| Season 1: Ignition | Ten Sessions | session_logged | 10 | 100 | 300 |
| Season 1: Ignition | Three Ratings | game_rated | 3 | 100 | 300 |
| Season 2: Overdrive | Thirty Days Running | streak_days | 30 | 100 | 500 |
| Season 2: Overdrive | Five to the End | game_completed | 5 | 100 | 500 |
| Season 2: Overdrive | Publish a List | list_published | 1 | 100 | 350 |
| Season 2: Overdrive | Three Discussions | thread_started | 3 | 100 | 400 |

- Seasons in that migration (L93-125): **Season 1: Ignition** 1 Sep–31 Oct 2026, bounty ×1.15, "Two months to build a shelf worth looking at"; **Season 2: Overdrive** 1 Nov–31 Dec 2026, bounty ×1.25, "From a shelf to a voice". "Summer of Gaming 2026" (×1.25 XP and Bounty) was closed on 31 Aug (L130-136). An earlier migration `lay_out_two_clean_seasons.php` had Ignition at 22 Sep–21 Dec and Overdrive 22 Dec–21 Mar 2027 with 1.00 multipliers; the 31 Aug migration is later. UNVERIFIED which dates are in the production table today — seasons are admin-editable (`SeasonResource`).
- Shortlist rule: `QuestController.php:83` shows 3 daily / 3 weekly / 5 monthly / 5 permanent, rotated deterministically per reader per period (L86-103); completed onboarding quests drop off the board.
- Mechanics: `QuestService::progress()` increments only active, unexpired quests whose `season_id` is null or the active season (L33-42); period reset for daily/weekly/monthly on next progress after the period (L77-89); rewards paid once per period; XP outside the daily cap (L104-119); `QuestCompletedNotification` (database).
- Season conclusion: `season:conclude` daily 00:20 (`console.php:255`) awards a "{Season} Champion" badge cosmetic **only to members who completed every quest of that season** (`ConcludeSeason.php:53-85`), deactivates the season and logs a warning if no successor season exists (L98-105). `Season::active()` respects dates, not just the flag (`Season.php:29-49`); multipliers cached 5 min (L72-82).
- Quest criteria with live triggers (grep of `->progress(`): `comment_posted` (`CommentObserver.php:63`, `CommentController.php:242`), `platform_connected` (`ConnectedAccountObserver.php:35`), `forum_post` (`PostObserver.php:51`), `thread_started` (`ThreadObserver.php:107`), `article_published` / `review_published` (`ArticleObserver.php:364-367`), `giveaway_entered` (`GiveawayEntryObserver.php:32`), `streak_days` / `daily_login` (`StreakService.php:60-61`), `list_published` (`GameListController.php:168,195`), `session_logged` (`JournalController.php:107,147`), `friend_made` (`FriendController.php:103-104`), `game_completed` / `game_added` (`GameCollectionController.php:230,239`), `game_rated` (`GameRatingController.php:189`).

### B.2.6 Bounty currency, reward tiers and the store

FACT (`BountyService.php`): Bounty is the spendable currency; every change is a `BountyTransaction` with `balance_after` (L61-68); a `reference` makes an award once-only under a row lock (L45-53); season bounty multiplier applied (L30-32). Earning sites:

| Action | Bounty | Once? | Source |
|---|---|---|---|
| Daily streak claim | 10 + 5×(streak−1), bonus capped at +50 | per day | `StreakService.php:11-15, 55-57` |
| Quest completion | 15–500 (table above) | per period | `QuestService.php:122` |
| Game completed | 50 | once per game (ledger ref) | `GameCollectionController.php:223-229` |
| Written game review published | 15 | once per game | `GameRatingController.php:174-180` |
| Forum answer accepted as solution | 25 (+10 reputation) | once per post | `ForumController.php:1086-1090` |
| Article first published (author) | 30; review 75 | once per article | `ArticleObserver.php:360-363` |

Spending: forum self-pin 100 for 24 h (`ForumController.php:34, 829-864`), cosmetics and reward items. Spends are not toasted (`BountyService.php:70-76`).

FACT — Reward tiers (`RewardTierService.php:269-282`) climb on **lifetime earned** Bounty: Bronze I 0 / II 250 / III 500, Silver I 1,000 / II 1,750 / III 2,500, Gold I 3,500 / II 5,000 / III 7,000, Platinum I 10,000 / II 14,000 / III 20,000.

FACT — Store (`RewardCatalogService.php`): one storefront over `customizations` and `reward_items`. Reward items (`RewardItemSeeder.php:14-19`): Bronze Profile Frame 250, Neon Theme 500, Early Supporter Badge 400, Custom Username Color 750, 10 % Shop Discount 1,000 (stock 100), Featured Profile Spotlight 1,500 (stock 20); five of these are shadowed by identical cosmetics (`RewardCatalogService.php:30-36`). Cosmetics (`CustomizationSeeder.php:15-61`): 10 accent themes (0–900; Gold Prestige gated to Gold supporters), 7 avatar frames (250–800; Diamond Ring gated to Platinum supporters), 6 badges (400–800), 5 forum post colours (200–350), 2 perks (Profile Spotlight 1,500, Animated Avatar 1,000). Season champion badges are award-only (`ConcludeSeason.php:61-71`).

OBSERVATION — Nothing in the store is a real-world good; the two "perks" (spotlight, animated avatar) are the only non-cosmetic items, and "10 % Shop Discount" points at an unlaunched shop.

### B.2.7 Daily streak (site) vs Discord `/daily`

FACT (`StreakService.php`): one claim per local day; streak survives if last claim was today or yesterday (L36-41, L99-100); Bounty 10 + 5×(streak−1) capped at +50 (L54-57); also increments `active_days_count`; fires `streak_days` and `daily_login` quest progress and streak/active-day achievements (L59-67). `info()` reports `at_risk` when alive and unclaimed today (L110-118). No XP is paid by the site streak.

FACT — The **Discord `/daily`** is a separate implementation: `DiscordDailyController.php:60-76` pays **50 XP + min(streak×5, 50) directly into `users.xp`** (`$user->increment('xp', …)`), with no Bounty, no `XpService`, no daily cap, no season multiplier, no `RewardLedger`. It shares the same `last_daily_claim`/`daily_streak` columns as the site streak, so claiming on Discord consumes the day's site claim (and vice versa) with different rewards. OBSERVATION: this contradicts the design stated in `DiscordXpController.php:15-31` and is the single largest XP source on the platform (50–100/day vs the 100/day cap for everything else).

### B.2.8 Leaderboard

FACT (`LeaderboardController.php`): six boards — XP, Reputation (periodic: all/month/week via `reputation_snapshots` baselines), Games (collection count), Completed, Reviews (published written), Achievements (L35-42); top 50 (L21); 5-minute cache (L23); **private (`friends`) profiles are excluded from every board** (L29); viewer's own position counted past the top 50 (L339-363); "rising" = biggest XP gain since Monday (L380-404); season panel with the viewer's season XP (L416-464). Baselines: `profile:snapshot-reputation --weekly` Mondays 00:10, monthly on the 1st 00:30 (`console.php:240-243`; `SnapshotReputation.php`), monthly contribution points = posts×5 + comments×2 + threads×10 (`config/ranking.php`).

### B.2.9 Giveaways

FACT — Models: `Giveaway` (title, slug, description, rules, images, prize name/value/image/type, starts/ends, status, is_public, `max_entries_per_user` = points cap, platform, region, entry_type, entry_goal, winner) with `pickWinner()` weighted by points and `pickWinnersByTiers()` (`Giveaway.php:74-95, 212-395`); `GiveawayEntry` (total_points, `referral_code`, referred_by, referral_count, streak_days, last_visit_date, streak_bonus_points, ip, user agent); `GiveawayTask` types: facebook_like, facebook_share, instagram_follow, youtube_subscribe, twitter_follow, twitter_retweet, discord_join, visit_url, share_giveaway, daily_visit, referral, forum_post, custom (`GiveawayTask.php:31-45`), each with points, url, verification_type, required/repeatable; `GiveawayPrizeTier` (tier_name, prize_description, min_points).
- Entering: max 5 entries per IP (`config/giveaway.php` security; `GiveawayController.php:231-238`); a `referral_code` on entry credits the referrer with the referral task's points (L256-272); a referral task cannot be self-completed (L370-384); daily visit bonus with streak milestones 3→+5, 7→+10, 14→+20, 30→+50 points (`GiveawayEntry.php:194-204`, `config/giveaway.php:33-38`); default max points per user 100, max referrals 50 (`config/giveaway.php:27-30`); per-giveaway leaderboard cached 60 s (L447-465); `getWinChance()` = points / pool (`GiveawayEntry.php:112-120`); referral URL `{public_url}?ref={code}` (L127-130).
- Integration with the economy: entering fires the `giveaway_entered` quest (`GiveawayEntryObserver.php:25-36`; the observer's docblock records that 21 of 55 members had entered a giveaway — the widest door on the site — while the economy "never knew"). Giveaway points are otherwise a closed economy (no XP/Bounty).
- Ops: reminders 24 h before end every 6 h (`SendGiveawayReminders`, `console.php:55`) as **database** notifications (`GiveawayReminderNotification.php:32-34`); `giveaways:unfinished` daily 10:00 nags about ended-but-undrawn draws (a World of Tanks draw sat undrawn 207 days, `console.php:288-297`); admin actions pickWinner / pickWinnersByTiers / manualWinner / viewParticipants / copyLink / onSite (`GiveawayResource.php`).
- Hub (`GiveawayHubController.php:15-23`): stats (active, prize value, winners, participants), facets, featured (closing soonest), recent winners, "mine"; the docblock states "two draws, twenty-one entries, no winners announced yet".
- Campaign audience segment `giveaway` lets a mail campaign target entrants of any/one giveaway (`CampaignAudience.php:91, 174-188`).
- Known UI gap fixed 9 Sep 2026: the right column (points, win chance, streak, referral link, daily-bonus button) was deleted with the leaderboard on 2 Mar 2026 and the daily-bonus endpoint had no caller for six months (`docs/README.md:833-849`).

### B.2.10 Release reminders and wishlist release checks

FACT — Two overlapping mechanisms, both database-only notifications:
1. Calendar reminder: `POST /calendar/{slug}/reminder` toggles `user_games.notify_on_release` (creating a `wishlist` row if needed) (`CalendarController.php:242-266`); `SendReleaseReminders` daily 09:00 notifies watchers of games released today and clears the flag (`SendReleaseReminders.php:35-65`).
2. Wishlist check: `wishlist:check-releases` daily 09:00 notifies wishlist holders for games releasing today and in 3 days, deduplicated over 5 days (`CheckWishlistReleases.php:18-74`).
Also `ArticleObserver::notifyWishlisters()` sends `WishlistGameReviewedNotification` when a review of a wishlisted game is published, and `notifyGameTrackers()` sends `GameNewsNotification` for any article linked to a game on someone's shelf (`ArticleObserver.php:377-435`).

### B.2.11 Weekly digest — database only (FACT)

`profile:send-weekly-digest` runs Fridays 16:00 (`console.php:258`). `SendWeeklyDigest.php:34-93` builds, for every verified user who has not set `settings.notifications.weekly_digest = false`: streak, up to 3 fresh articles (7 d) about games on their shelf or in their chronicle affinities, up to 3 wishlist releases in 14 days, season days remaining; skips empty digests. `WeeklyDigestNotification::via()` returns `['database']` (L38-41) with a docblock dated 31.08.2026 explaining the deliverability reasoning ("exactly four kinds of email"). **Nobody receives a digest by email**; it appears in the bell under "Your week on TechPlay" (L59-64). `docs/README.md:1079-1082` states the same.

### B.2.12 Notifications catalogue (22 classes)

FACT — `via()` per class (`backend/app/Notifications/*.php`):

| Class | `data.type` | Channel |
|---|---|---|
| AchievementUnlockedNotification | achievement | database |
| AdminAlert | — | database |
| ArticleCommentNotification | article_comment | database |
| CommentReplyNotification | comment_reply | database |
| ForumReplyNotification | forum_reply | database (used to add `mail` when email notifications on — removed, comment L33) |
| FounderBadgeNotification | badge_awarded | database (campaign:founders, first 50 full profiles, `console.php:263-265`) |
| FriendRequestNotification | friend_request | database |
| GameNewsNotification | game_news | database |
| GameReleaseNotification | game_release | database |
| GiveawayReminderNotification | giveaway_ending | database |
| GiveawayWinnerNotification | giveaway_won | database |
| MentionNotification | forum_mention | database |
| QuestCompletedNotification | quest_completed | database |
| RankUpNotification | rank_up | database |
| RecognitionNotification | recognition | database |
| ResetPasswordNotification | — | **mail** |
| ThreadWatchNotification | thread_watch | database |
| VerifyEmailNotification | — | **mail** |
| WeeklyDigestNotification | weekly_digest | database |
| WishlistGameReleasingNotification | wishlist_releasing | database |
| WishlistGameReleasingSoonNotification | wishlist_releasing_soon | database |
| WishlistGameReviewedNotification | wishlist_reviewed | database |

Mail actually sent by the platform (README §20, verified against classes/mailables): verify email, reset password, newsletter verification (`App\Mail\NewsletterVerification`), contact form (`ContactFormMessage`), campaign (`CampaignMessage`). Templates for the first three are editable in Filament (`MailTemplateSeeder.php:15-27`, `MailTemplateResource`) — words only, never the button/link (README §20).

### B.2.13 Friends, blocks, messages, recognitions, activity

FACT — Friendship: request/accept/decline/block/unblock (`FriendController.php`); accepted friendship fires `friends_count` achievements for both and `friend_made` quests (L101-104). No "follow" model exists (grep of `Models/`: `Friendship` only). Profile visibility `public|friends` (`User.php:95-97`); private profiles hidden from leaderboards and from Discord shelf commands (`DiscordLibraryController.php:13-20`).
- Social Hub chat (`ChatController.php`): direct and group conversations, reactions, unsend, participants, leave, signed-URL DM attachments, "people you may know" = friends of friends ranked by shared friends (L420-422). Real-time via Reverb on the `live` queue (README §3).
- Recognitions (`RecognitionController.php:20-22`): four kinds — helpful, insightful, friendly, leader — one per giver/receiver/type, 10 per day cap.
- Public activity feed per user (`ActivityService`, `/users/{username}/activity`) and a friends activity feed (`/friends/activity`).
- Presence: Steam polled every 2 min (`PollSteamPresence`, `console.php:152`), Discord Rich Presence pushed by the bot (`events.ts:159-224`), manual set/clear; presence leads the "Continue playing" rail (`ProfileService.php:212-228`).

### B.2.14 Game lists

FACT (`GameList.php` fillable; `GameListController.php`): name, slug, description, is_public, cover, `list_type` (incl. tier lists with `GameList::TIERS`), category, tags (json), allow_comments, has_spoilers, is_draft; likes and comments; `/game-lists/discover` with tag filter and `/game-lists/tags` directory (L414-490); public list URL `/lists/{username}/{slug}`; publishing a list fires `list_published` quest (L168, 195); lists get their own sitemap when any public non-draft list exists (`GenerateSitemap.php:103`). README §1: 4 lists in production (7 Sep 2026).

### B.2.15 Shelves, statuses, connected accounts, journal, prices

FACT — `user_games.status` ∈ playing, replaying, played, backlog, completed, wishlist, dropped (`UserGame.php:24`); `ACTIVE = [playing, replaying]` (L35); fields include is_favorite, showcase_order, progress, playthroughs, hours_played, platform (free text), sources (json), started/completed/last_played (L38-60); `notify_on_release` (§2.10). Connected providers: steam, xbox, playstation, gog, epic with sync statuses idle/pending/syncing/done/error/expired/private and per-account visibility (`ConnectedAccount.php:27-41`). Steam library weekly resync Wednesdays 04:00 (`console.php:143-146`), recent playtime every 30 min (L166-168), Steam achievements nightly 05:00 (L85). Journal: play sessions with "moments" (screenshots), plus Steam-derived session suggestions that must be accepted by the user (`SessionSuggestionService.php:12-31`). Shelf worth: nightly `RefreshShelfPrices` (04:40) prices owned games via Steam US (`SteamPriceService.php:9-28`; only 1,017 of the catalogue's games are owned, `console.php:171-172`), `ProfileService::shelfWorth()` reports full vs on-sale totals and unpriced count (L66-83).

### B.2.16 Gamer DNA and Taste Match

FACT — `GamerDnaService.php` (1,028 lines) derives, never stores: three taste axes (solo↔multi, competitive↔relaxed, story↔systems) from genre/tag vocabularies with weights (L29-73), eras (L75-83), score tiers (L84-88), median-based habit figures (L179-185), "marks harder or softer than the room" rating comparison over games with both a member score (1–5, doubled) and a catalogue score (L234-242), dropped vs dormant (6 months) games (L275-281), peers from the chronicle (L309-314); percentiles only above 50 scored profiles (L26-27). `users.dna_score` column exists (migration `add_dna_score_to_users`).
- `TasteMatchService.php:10-40`: match % = 50 % genres (cosine) + 30 % library overlap (shared/combined) + 20 % platforms; below 3 games per side it refuses (`MIN_LIBRARY`); returns a sentence (L233). Exposed at `/users/{username}/taste-match` (signed-in) and to Discord as `/match`.

### B.2.17 Chronicle, Feed, recommendations

FACT — Chronicle (`Chronicle/ChronicleBuilder.php:10-31`): one summary row per user built from existing tables; each signal has a base weight and decays `e^(−days/180)`; negative map from dropped/low-rated; `MIN_SIGNALS = 5` before anything personalises; nearest 20 peers by cosine over game affinities (L240-244); rebuilt nightly for stale users (`chronicle:rebuild --stale` 04:45) and forgotten on meaningful actions (`TasteProfileService::forget()`). `player_signals` table records searches (weight 0.6, `SearchController.php:207-220`). `TasteProfileService` is the single reader (L10-17).
- Content feed (`Feed/ContentFeed.php`): one union stream over news/reviews/tech articles and guides; `Feed/InterestProfile.php` weighs saves > replies > read-through (50 %) > opens, plus collection genres, and **reports when it knows nothing** (L16-19, 84); `/feed/personalized` reorders, never hides (`FeedController.php:19-24`); `/feed/recommended-news` = articles about the reader's affinity games with honest most-read fallback (L40-44).
- Game recommendations (`GameRecommendationService.php:14-46`): scored, weights sum to 100 across genre fit, peers ("players like you own this"), quality (catalogue rating ≥ 3.2), era; moods action/story/chill/competitive; 400-candidate pool; reasons on the card are the components. Used by `/backlog/recommendations` (Backlog Advisor), `/me/recommendations`, per-game `/games/{slug}/suggested` (personalised when signed in, `GameController.php:741-812`), and Discord `/backlog`.

### B.2.18 Trophy case, collection goals, dashboard, reading list

FACT — Trophy case: five slots the owner chooses from achievements or Steam achievements (`TrophyCaseService.php:12-27`; routes `api.php:334-336`). Collection goals: three live-measured targets — complete_games (default 10), unlock_achievements (25), shrink_backlog (10) (`CollectionGoalController.php:17-38`). Dashboard `/me/dashboard` aggregates user card, stats, playing now, favourites, backlog preview + suggestion, streak, presence, recent achievements, friends online (`DashboardController.php:41-163`). Reading list: bookmarks + forward-only read progress + Redis search history (`ReadingController.php:25-116`). Milestones widget config: 100 forum posts, 25 discussions, 10 wishlist, 50 tracked games, 500 reputation (`config/milestones.php`).

### B.2.19 Scheduler — every recurring task (FACT, `backend/routes/console.php`)

| When | Task | What it does for members/growth | Line |
|---|---|---|---|
| every minute | scheduler heartbeat | proof the cron runs | 50-52 |
| every minute | `articles:publish-scheduled` | scheduled posts go live through the model (fan-out fires) | 149 |
| every 2 min | `PollSteamPresence` | "playing now" from Steam | 152 |
| every 5 min | `FlushViewCounters` | article/game/ad views & clicks to DB | 45 |
| every 10 min | `analytics:rollup` | first-party traffic daily tables | 278-281 |
| every 15 min | `sitemap:generate --content` | articles/categories/pages/lists sitemaps | 206-209 |
| every 30 min | `RefreshRecentSteamPlaytime` | shelf hours never > 30 min stale | 166-168 |
| hourly | `games:enrich-steam` | Steam drip keep-alive | 64-66 |
| hourly | `forum:clear-expired-pins` | bounty self-pins expire | 261 |
| every 6 h | `SendGiveawayReminders` | 24-h-to-go bell notice | 55 |
| 00:10 Mon | `profile:snapshot-reputation --weekly` | weekly leaderboard baseline | 243 |
| 00:20 | `season:conclude` | champion badges, season end | 255 |
| 00:30 1st | `profile:snapshot-reputation` | monthly deltas | 240 |
| 02:10–02:40 | `model:prune`, `sanctum:prune-expired`, `queue:prune-failed` (Mon), `prune:derived-history` | housekeeping | 95-113 |
| 03:00 Sun | `seo:scan-links --limit=500` | broken links report | 129-132 |
| 03:00 Mon | `releases:sync` | pull store release windows | 222 |
| 03:20 | `users:prune-unverified` | delete never-verified signups | 79-82 |
| 03:30 | `sitemap:generate` (full) | 295k game URLs + studios/series | 211-214 |
| 03:40 | `analytics:prune` | raw hits > 90 d | 283-286 |
| 04:00 Wed | `platforms:resync` | library re-sync for connected accounts | 143-146 |
| 04:15 | `achievements:sync` | nightly achievement sweep | 252 |
| 04:40 | `RefreshShelfPrices` | shelf worth | 180-182 |
| 04:45 | `chronicle:rebuild --stale` | taste profiles | 74 |
| 05:00 | `games:sync-steam-achievements` | Steam achievements per member | 85 |
| 05:30 | `games:enrich-opencritic` | 25 critic scores/day | 68 |
| 05:30 Mon | `releases:merge` | fold store duplicates | 223 |
| 06:00 | `games:enrich-trailers` | ~100 YouTube searches/day | 71 |
| 06:30 Mon | `games:sync-series` | series index | 237 |
| 09:00 | `SendReleaseReminders`, `wishlist:check-releases` | release-day bell notices | 58, 185 |
| 10:00 | `campaign:founders` | Founder badge to first 50 full profiles | 265 |
| 10:00 | `giveaways:unfinished` | nag about undrawn giveaways | 296-298 |
| 16:00 Fri | `profile:send-weekly-digest` | bell-only digest | 258 |

Not scheduled (manual): `games:purge-adult`, `games:purge-clutter`, `games:enrich-wikidata`, `content:link-games`, `newsletter:launch`, `xp:sync`, `site:copy`, all `images:*`, `seo:fix-*`, `diagnose*` (`docs/README.md:503`; command list below).

### B.2.20 Artisan command inventory (FACT, `$signature | $description`, 65 files incl. Diagnose)

| Command | Description |
|---|---|
| `campaign:founders` | Award the exclusive Founder badge to the first N users with a full profile |
| `images:backfill-alt` | Fill in missing alt text for article covers and the media library |
| `analytics:backfill` | Rebuild analytics for past days from the relay hits in nginx logs |
| `seo:backfill-image-dimensions` | Record width and height for featured images so share cards can declare them |
| `wishlist:check-releases` | Notify users when a wishlisted game releases today or in 3 days |
| `forum:clear-expired-pins` | Unpin forum threads whose bounty-funded self-pin has expired |
| `season:conclude` | Award season rewards and deactivate the finished season |
| `db:sizes` | Disk usage per table |
| `diagnose:orphans` | Count orphaned and inconsistent rows |
| `games:enrich-opencritic` | Fill critic_scores.opencritic for the most-viewed modern games, within the daily API budget |
| `games:enrich-steam` | Match catalogue games to Steam appids, then drip-fill empty columns from appdetails |
| `games:enrich-wikidata` | Fill series, developers and publishers from Wikidata (CC0), matched by name + year |
| `games:enrich-trailers` | Find official trailers on YouTube for the most-viewed games without a video, within the daily quota |
| `games:enrichment-status` | Report what each enrichment pipeline has actually filled |
| `seo:fix-audience-claims` | Replace unsupported claims about audience size in page SEO |
| `images:fix-paths` | Update database image paths to .webp where the file exists |
| `notifications:fix-profile-links` | Fix old notifications linking to /profile |
| `seo:fix-game-counts` | Replace overstated game-catalogue figures in page SEO with the real one |
| `seo:fix-truncated-titles` | Rewrite meta titles that end in an ellipsis |
| `releases:forget` | Forget what a store told us so the next sync asks again |
| `analytics:funnel` | Show the profile activation funnel (signups, wizard, connects, activation, D1) |
| `images:generate-variants` | Generate responsive image variants |
| `sitemap:generate` | Generate static sitemap XML files |
| `content:link-games` | Link existing articles and guides to catalogue games |
| `releases:merge` | Fold the same game, arriving from several stores, into one calendar entry |
| `images:normalise-paths` | Rewrite absolute image URLs back to relative |
| `images:optimize` | Convert existing images to WebP |
| `analytics:prune` | Delete raw analytics hits older than the retention window |
| `prune:derived-history` | Trim signal, suggestion, notification and version history |
| `users:prune-unverified` | Delete registrations never verified and never used |
| `articles:publish-scheduled` | Publish articles scheduled for release |
| `games:purge-adult` | Delete adult titles, archive them, leave tombstones |
| `games:purge-clutter` | Delete empty shells, DLC stubs and empty editions; archive, tombstone |
| `chronicle:rebuild` | Rebuild user chronicles |
| `releases:refresh` | Re-read presentation fields for games a store already gave us |
| `giveaways:unfinished` | Report giveaways that have ended without a draw |
| `platforms:resync` | Queue a library re-sync for connected platform accounts |
| `analytics:rollup` | Roll raw analytics hits into the daily tables |
| `seo:scan-links` | Scan articles for broken links |
| `newsletter:launch` | Send the launch newsletter to members and subscribers |
| `profile:send-weekly-digest` | Send the weekly digest (bell only, see §2.11) |
| `site:copy` | Apply the reviewed homepage copy, site description and robots.txt |
| `profile:snapshot-reputation` | Snapshot reputation/XP for deltas and weekly leaderboards |
| `games:strip-catalogue-links` | Unwrap `<a>` tags in game descriptions |
| `achievements:sync` | Retroactively check and unlock achievements for all users |
| `games:sync-series` | Rebuild the game_series index |
| `media:sync` | Sync storage images to the Media Library |
| `releases:sync` | Read upcoming releases from the stores |
| `games:sync-steam-achievements` | Pull Steam achievements for connected accounts |
| `xp:sync` | Retroactively recalculate XP for all users |
| `media:tidy` | Fold WebP derivatives into originals |
| `env:validate` | Check the configuration the application will run with |
| `games:gone-map` | Write the nginx 410 map of purged game slugs |
| `diagnose` (+ `:config :db :http :perf :queue :redis :schedule :storage`) | Read-only diagnostics |

---

## B.3. Newsletter / email system

FACT — Subscriber model (`NewsletterSubscriber.php`): email, `source` ∈ form|account (L10-12), is_active, verification_token (consumed), `unsubscribe_token` (64 chars, generated on create, never cleared, L41-46), email_verified_at, unsubscribed_at; `mailable()` scope = active + verified + not unsubscribed (L98-103). Rows for members are created on demand so every recipient has an unsubscribe token (L48-70).
- Flow: `POST /newsletter/subscribe` (5 per 10 min per IP) → double opt-in mail (`NewsletterVerification`) → `POST /newsletter/verify` → lifts an `unsubscribed` suppression only on confirmation (`NewsletterController.php:16-86`); unsubscribe by GET link or RFC 8058 POST, unknown tokens answered identically (L108-122); unsubscribing also writes to `mail_suppressions` (`NewsletterSubscriber.php:87-95`).
- Suppression (`MailSuppression.php`): reasons unsubscribed / bounced / complained, never downgraded (L32-51); `filter()` is the single gate every audience passes through (L69-76). **No bounce/complaint webhook was found** wiring `bounced`/`complained` from the mail provider (grep for `MailSuppression::suppress(` callers shows only the unsubscribe path) — OBSERVATION, needs confirming against provider config.
- Campaigns (`MailCampaign.php`): name, subject, body, body_text, hero (eyebrow, headline, intro, CTA label/url, image), audience rule (json), status draft→scheduled→sending→sent (claimed atomically, L96-106), batch_size / pause_seconds (default 10 per 3 s, README §20), counts and open/click rates (L109-120). Audience segments (`CampaignAudience.php:87-92`): everyone, members, signups, giveaway (any/one giveaway), with `min_xp`, `seen_within_days`, `registered_within_days` filters for member segments (L130-158); unverified and banned accounts never included; resolved at send time and re-checked per recipient (`SendCampaign.php`, `SendCampaignMessage.php:104`). Filament: preview, send test, send (`MailCampaignResource.php:316-377`).
- Tracking: open pixel and signed click redirect under `/api/v1/mail/` (`MailTrackingController.php:35-114`); a click also counts as an open; the unsubscribe link is intentionally untracked (README §20).
- Legacy: `newsletter:launch` command with `--force`, `--to`, `--limit`, `--batch`, `--pause` (`SendLaunchNewsletter.php:22-28`) sends a fixed Blade "launch" mail to `NewsletterAudience::addresses()` (members + signups).
- Admin: `NewsletterSubscriberResource` lists email/verified/active/unsubscribed/mailable with an **export** action; `MailSuppressionResource`, `MailTemplateResource`.
- Cadence: none automated. Campaigns go when an editor presses Send (or `scheduled_for`).
- What is NOT there (FACT by absence): no automated digest/retention/re-engagement email; no welcome sequence beyond the verification mail; no transactional mail for achievements, rank-ups, giveaway wins or release days; no per-topic (news/reviews/hardware) subscription preference on the subscriber row; no tagging of where a signup came from beyond `form|account` (the Frontiers "Notify me" form posts to the same `/newsletter/subscribe`, `FrontiersClient.tsx:76`); no A/B or scheduling automation beyond a single `scheduled_for`; no bounce/complaint ingestion found; no Discord-to-email bridge. Subscriber count: UNKNOWN (not in README; `newsletter_subscribers` is not in the README's row-count table).

---

## B.4. Content model

FACT — `Article` (`Article.php:13-49`): title, slug, views, author_id, featured image url/alt/width/height, **featured_video_url**, excerpt, content, category_id, **game_id** (content↔game spine), is_featured_in_hero, focus_keyword, canonical_url, is_noindex, status, published_at, meta title/description, **review_score** (decimal 1dp), **review_data** (json), tags (json), **reading_time** (integer). Migration history also shows review_pros/cons, language, translation_of_id, fingerprint, content_updated_at (`database/migrations/*articles*`; some later dropped by `drop_dead_article_columns`). Content versions are kept (`ContentVersion`, `ArticleVersionObserver`).
- Article types are **categories with a `type`**: news, reviews, tech; guides are a separate `Guide` model (title, slug, content, `steps` json, excerpt, image, **difficulty** beginner/intermediate/advanced, author, game_id, SEO fields, status) (`Guide.php:15-32`); help articles are a third model on help.techplay.gg (`HelpArticle.php`).
- Categories seeded (`CategorySeeder.php:16-66`): News → Gaming, Consoles, PC, Movies & TV, Industry, E-sport, Opinions, Interviews (8); Reviews → Latest, Editor's Choice, AAA Titles, Indie Gems, Retro (5); Tech → News, Reviews, Benchmarks, Guides (4). That is 3 parents + 17 children = 20 editorial categories; production has **31 rows** (`docs/README.md:411`) because forum categories share the same table (`ForumSeeder.php`: News & Announcements, Feedback & Support, General Gaming, Game Reviews, Esports, PC Builds & Upgrades, Consoles & Peripherals, The Lounge, Marketplace under parent groups) and later migrations added/removed some (`add_interviews_subcategory_to_news`, `cleanup_categories_final`, `drop_orphan_clans_forum_category`). Exact live list: UNVERIFIED (needs a DB read).
- Review fields in the editor (`ReviewResource.php` make() list): review_score, review_data.game_title/developer/publisher/platforms/genres/release_date, pros, cons, conclusion, CTA, and **five sub-ratings** gameplay/visuals/audio/narrative/replayability, plus a catalogue game search that sets `game_id`.
- Editor form (shared `Filament/Components/*`): title, slug, excerpt, content, category, author, game_id, featured image (media picker with alt), featured_video_url, tags, focus_keyword, canonical_url, is_noindex, is_featured_in_hero, status, published_at, **seo_analysis** widget, change_summary/restore versions. No dedicated hardware **spec** fields or **affiliate link** fields exist on the model — hardware pieces are `tech`-type articles with the same schema (FACT by absence in `Article.php` and `TechResource.php`, which reuses the article form). An old `add_specs_to_reviews_table` migration targeted a `reviews` table that was later dropped (`drop_reviews_table`).
- Authors: users with `author_slug`, `author_social_links`, roles (Admin, Super Admin, Editor, Editor-in-Chief, Moderator, Journalist — `DashboardController.php:95`); public author pages `/authors/{slug}` and About page counts articles per staff member (`AboutController.php:43-92`).
- Tags: `Tag` model is polymorphic for forum threads (`Tag.php:14`); article tags are a plain json array on the row; `/games/tag/{t}` uses `games.tags` (TEXT[]).
- Scheduled publishing: `articles:publish-scheduled` every minute through the model so observers fire (`console.php:149`; rule in `docs/README.md:275-278`).
- Publish fan-out (`ArticleObserver.php:78-170`, `PublishArticleFanout` job): revalidate article/category/homepage, regenerate `sitemap-news.xml`, IndexNow via `ContentObserver` (the only IndexNow submitter for articles, L28-32), Discord push, notify wishlisters/game trackers, author bounty + quests; content↔game auto-link at publish (`ContentGameLinker.php:8-34`) with a backfill command for the 485 pre-spine articles (`LinkContentToGames.php:12-19`).
- Related content: per-game article rail (`GameController::articles`), `InternalLinkService` suggestions + orphan-page report for staff (`SeoController.php`), personalised recommended-news (§2.17); no generic "related articles" service beyond category/game (OBSERVATION).
- View counters: Redis counters flushed to DB every 5 min (`FlushViewCounters`, `console.php:36-45`); per-visit logs dropped 11 Aug 2026 (CLAUDE.md).
- Comments: sanitised, spam check, 15 s cooldown, 5 min duplicate window, first three comments of every member held for approval, >1 link held (`CommentController.php:153-190`; README §4). Comments are polymorphic (`Comment` morphMany).

### B.4.1 What editors can do — Filament resources (FACT, 43 resource classes)

| Resource | Model | Editor capability |
|---|---|---|
| NewsResource / ReviewResource / TechResource | Article | Three desks over one model (category type); shared editor fields, media picker, SEO analysis, publish tab, content versions relation manager |
| GuideResource | Guide | Steps, difficulty, game link |
| SeoManagerResource | Article | Article-level SEO overview |
| CategoryResource ("Article Categories") / ForumCategoryResource ("Forum Categories") | Category | Two views over the shared categories table |
| PageSeoResource | PageSeo | Per-path title/description overrides |
| Redirects/RedirectResource | Redirect | 301 map with hit counts |
| BrokenLinkResource ("Broken Links") | BrokenLink | Weekly scan results |
| MediaResource | Media | Media library (WebP variants) |
| CommentResource | Comment | approve / spam actions |
| PostResource, SimpleThreadResource ("Threads") | Post, Thread | Forum moderation |
| ReportResource | Report | User reports queue |
| UserResource, Roles/RoleResource | User, Role | Accounts, Spatie roles |
| GameResource | Game | Edit name, slug, description, cover, genres, platforms, tags, developers, publishers, rating, released, screenshots, videos, website, critic scores (metacritic/opencritic score+url) |
| GameRatingResource ("Game Ratings") | GameRating | Reader reviews moderation |
| UserGameResource ("Game Collections") | UserGame | Shelf rows |
| GiveawayResource | Giveaway | Full giveaway builder incl. tasks (type, points, url, required, repeatable) and prize tiers; pickWinner / pickWinnersByTiers / manualWinner / viewParticipants / copyLink / onSite |
| AchievementResource, QuestResource, RankResource, SeasonResource | — | Edit the whole gamification catalogue (thresholds, rewards, season dates/multipliers) |
| BountyTransactionResource ("Bounty Ledger"), RewardItemResource ("Rewards Store"), CustomizationResource | — | Economy audit and store items |
| MailCampaignResource, MailTemplateResource, MailSuppressionResource, NewsletterSubscriberResource | — | Newsletter desk (§3); subscriber export |
| AdCampaignResource | AdCampaign | Ad positions, CPM, IAB fields, view/click counts |
| Gta6CharacterResource / Gta6VehicleResource / Gta6WeaponResource | Gta6* | GTA 6 hub content |
| HelpArticleResource, HelpCategoryResource | Help* | help.techplay.gg content |
| ProductResource, OrderResource, SupportTierResource, UserSupportResource | Shop | Unlaunched shop/supporter admin |
| SiteSettingResource ("Raw settings table") + Pages/Settings | SiteSetting | Site name/tagline, social URLs, SEO defaults (title separator, OG image, robots.txt, Google/Bing verification, GA/GTM ids, **IndexNow key**, Organization schema fields, address) |
| Pages: Dashboard, Analytics, ReleaseCalendar, Settings; Widgets: NewsroomConsole, DeskPulse, News/Reviews/Tech/Guides/List/Media/BrokenLinks Pulse, MostViewedArticles, RecentContent, AdCampaignStats, TopPerformingAds | — | Editorial cockpit; first-party analytics page (§11) |

---

## B.5. Games database

FACT — Fields per game (`Game.php:14-91`): slug, link_name (headline-matchable name), name, released, rating, cover_url, description, genres[], platforms[], tags[], screenshots, videos, alt_titles, developers[], publishers[], age_ratings, website, series_key, series_name, ratings_count, attributes, box_art, critic_scores (json: metacritic/opencritic score+url), time_to_beat, game_modes[], player_perspectives[], multiplayer, languages, artworks, similar_games, engines[], match_key / release_precision / hype_score / is_editorial / locked_fields (aggregator + editor locks). Plus `views`, `popularity` (migrations `add_views_to_games_table`, `add_popularity_to_games`). Relations: `storeLinks` (store, store_id, url, payload, rejected_reason), `studios` pivot with role developer/publisher/port/support, `links` (kind/service/url — e.g. official/social), `relations` (dlc_of/has_dlc/expansion_of/remake_of… `GameRelation.php:27-33`), `GameExternalId` (provider steam/youtube/… with metadata), `GamePrice` (Steam US full/final cents, discount), `readerRatings` (1–5 + written review, `GameRating.php:10`), `threads` (forum threads per game), `userGames`, `GameSeries` (series_key, name, slug, games_count, first/last year, described_count).
- Studios (`Studio.php:23-27`): igdb_id, name, slug, description, logo, `country` (numeric code mapped via `config/countries.php`), founded, website, parent, status/changed_at/became_studio_id (history), kind, games/developed/published/ported/supported counts, `indexable`. README: 57,630 studios.
- Enrichment sources (scheduled): Steam appdetails drip (hourly keep-alive, `EnrichFromSteam.php:12-25`, `EnrichSteamBatch` job fills only empty columns), OpenCritic via RapidAPI 25 searches/day on most-viewed modern games (`EnrichFromOpenCritic.php:12-24`, 05:30), YouTube ~100 searches/day for trailers where Steam has none, title must contain game name + "trailer" (`EnrichTrailersFromYouTube.php:11-23`, 06:00), Wikidata CC0 for series/developers/publishers by name+year (`EnrichFromWikidata.php:10-22`, manual), Steam prices nightly for owned games only. Store aggregator (`Services/Releases/*`): Steam, PlayStation, Xbox, Nintendo catalogues → quality gate (`config/releases.php` thresholds: default min 200-char description, 4 screenshots, publisher required; Nintendo 40 chars; PlayStation 15 chars/3 screenshots) → `releases:merge` folds duplicates → `Notability` scores a month by store count (40/store), screenshots (2 each), trailer (15), wishlists; `CalendarVisibility` decides what crowds the month. IGDB was a one-off import (20–21 Aug 2026), MobyGames/RAWG retired (README §8). `games:enrichment-status` reports what each source filled (`EnrichmentStatus.php:10-25`).
- Indexability rule (`Game.php:139-171`): a game is indexable iff its description stripped of HTML is longer than 50 characters — matched by a partial index and by the frontend's `noindex`. Sitemaps: 15 maps in the index, games split 50,000 per file, **295,024 game URLs** (README §12); `sitemap:generate --content` every 15 min, full nightly 03:30 (`console.php:206-214`); studios (indexable flag) and series (indexable scope) get their own maps only when non-empty (`GenerateSitemap.php:116-124`); deleted games answer 410 through an nginx map of ~60,900 tombstoned slugs (README §12). Sitemap files: `sitemap.xml` index, `-pages`, `-articles`, `-categories`, `-hub`, `-guides`, `-news`, `-products` (only if products), `-lists` (only if public lists), `-images`, `-studios`, `-series`, `-games-1…6` (`GenerateSitemap.php:79-149`). No `changefreq`/`priority` policy is visible in the command (the values live in `SitemapController`, not reviewed) — UNVERIFIED.
- **"Our" content coverage: 1,967 of 295,023 game pages carry anything of TechPlay's own (0.7 %)** — `docs/README.md:592`, measured 7 Sep 2026. Carry forward as the baseline FACT for programmatic SEO. Googlebot fetched ~290 pages/day, 77 of them game pages (README:591).
- Programmatic-SEO facets already served by the API: `/games/hub/{genre|platform|year|tag}/{value}` with sort, year range and platform sub-filter (`GameRatingController.php:214-254`, genre slug map incl. action, indie, adventure, rpg, strategy, shooter, casual, simulation, puzzle, arcade, platformer, racing, sports, massively-multiplayer, family, fighting, board-games, educational, card, dungeon-crawler, point-and-click, horror, first-person…), `/games?genres=&platforms=&tags=&year_from=&year_to=&min_rating=&status=&series=&ordering=` (`GameController.php:154-179`), hub facets genres/platform families (pc, playstation, xbox, nintendo, mobile, retro)/eras/release status + most wishlisted (`GameHubController.php:33-172`), `/games/series/{slug}` with per-series facets (`GameController.php:694-741`), `/studios?country=` and studio pages with release years and developed/published lists (`StudioController.php:26-252`), `/games/hidden-gems` (daily), `/games/on-this-day` (anniversaries), `/games/random`, `/calendar?month=&platform=&genre=&sort=` and `/calendar/day/{date}`, `/calendar/{slug}` pre-release page distinct from the game page (`CalendarController.php:129-137`). Frontend routes confirm pages exist for genre/platform/series/tag/year and studios/country (`docs/README.md:328-329`).
- Per-game page bundle: one call returns show + articles + screenshots + videos + series + suggested + ratings (+ `threads_count`) (`GameController::bundle`, `api.php:688-690`); a `techplayScore()` blends catalogue and reader ratings (`GameController.php:508`). Reader ratings/reviews and forum threads per game are the only user-generated "ours" content; editorial articles link via `game_id`.

---

## B.6. GTA 6 hub

FACT — Models: `Gta6Vehicle` (slug, name, vehicle_class, real_equivalent, description, image, gallery[], status, is_published, sort_order), `Gta6Weapon` (…, weapon_type, …), `Gta6Character` (…, alias, role, …), `GtaLocation` (gtadb_key, name, game_x/game_y, lat/lng, real_address, categories[], is_unconfirmed) (`app/Models/Gta6*.php`, `GtaLocation.php` fillables). API (`api.php:640-655`): `/gta6/locations?category=&search=&confirmed=`, `/gta6/categories`, `/gta6/characters[/{slug}]?role=`, `/gta6/vehicles[/{slug}]?class=` + `/vehicles/classes`, `/gta6/weapons[/{slug}]?type=` + `/weapons/types`; all cached one day (`Gta6*Controller.php`, `CacheService::TTL_DAY`) and revalidated by `Gta6*Observer`. Admin: three Filament resources; locations come from `Gta6LocationsSeeder` + `data/gta6_assets.php`. Production counts: 121 vehicles, 36 weapons, 12 characters, 1,058 locations (`docs/README.md:62`). Frontend pages: `/gta6`, `/characters`, `/vehicles`, `/weapons`, `/map`, `/everything-we-know` (README:334). Images live in `frontend/public/gta6/` (README §17). OBSERVATION: individual vehicle/weapon/character pages exist as API `show` endpoints, so the hub is already a set of ~169 detail pages plus the map — a programmatic-SEO surface tied to a release-date news cycle (GTA 6 launch timing itself: UNKNOWN in this repo; must come from the market-research agent).

---

## B.7. WoW Analyzer, Backlog Advisor, Last Disc, Frontiers, Tools

- **WoW Analyzer** (FACT): `POST /wow/analyze` (60/min, public) pulls the character from Blizzard (`BlizzardService`), minifies (`BlizzardDataTransformerV2`), adds Raider.IO, and asks Groq `llama-3.3-70b-versatile` (`GroqService.php:19`) for "Midnight expansion readiness" (`WowAnalyzerController.php:42-52`; launch date constant `2026-03-02` in `GroqService.php:110`). Stores `WowAnalysis` rows (character, realm, region, class, race, faction, level, achievement points, readiness_score, ai_advice[], missing_essentials[], void mounts, portrait, view_count, share_count) with a public leaderboard, recent list, shareable analysis pages and a share counter (`api.php:574-581`). Signed-in users can keep WoW characters and set a main (`api.php:227-229`). Battle.net OAuth login exists (`api.php:157-158`).
- **Backlog Advisor** (FACT): `GET /backlog/recommendations` (auth) — no LLM; scored by `GameRecommendationService` with moods any/action/story/chill/competitive, genre filters, exclude backlog/played, and a published weights legend (`BacklogAdvisorController.php:15-53`). Also surfaced on Discord `/backlog` (three picks from what you own, `DiscordLibraryController.php:108-111`).
- **The Last Disc** (FACT): a public campaign page — "An open letter from players asking Sony to keep physical PlayStation games beyond 2028" (`frontend/app/last-disc/page.tsx:19`) — with `GET /last-disc` counts, `POST /last-disc/sign` (5 per 10 min), `POST /last-disc/vote` (choices keep / digital_only / unsure), anonymous voters hashed with the app key, staff CSV export (`LastDiscController.php:17-208`; models `LastDiscSignature`, `LastDiscVote`). Signature count: UNKNOWN (not in README).
- **Frontiers** (FACT): `frontend/app/frontiers/` is a landing page — "TechPlay Frontiers — Build. Unite. Conquer. A new MMO strategy of clans, territory and resources" with sections Build your base / Unite your clan / Take the map / Clan wars, a countdown to `LAUNCH_AT = 2026-09-13T18:00:00+02:00` (already past on 27 Sep 2026), and a "Notify me" form that posts to the **general newsletter** `/newsletter/subscribe` with no source tag (`FrontiersClient.tsx:15, 64-76`). **There is no backend for Frontiers**: the clan system was removed (`migrations/*drop_clan_system.php`, plus earlier `create_clans_tables`, `create_clan_economy/buildings/missions/boosts_and_trophies/identity`). OBSERVATION: the page promises a game that has no code behind it in this repository; what happened on 13 Sep 2026 is UNKNOWN.
- **Tools page** (FACT): `/tools` lists five entries from `frontend/lib/tools.ts:27-55`: `/wow-analyzer`, `/backlog-advisor`, `/lists`, `/gta6`, `/last-disc`, with an ItemList JSON-LD (`tools/page.tsx:51-57`).
- Also present: `/marketing` ("Advertise with us"), `/roadmap`, `/rating-system` public pages (frontend only; ad campaigns are a backend model with positions, CPM, IAB fields, views/clicks flushed with the view counters — `AdCampaign.php`, `AdController.php`).

---

## B.8. Discord bot capability map (Professor Buffy)

FACT — Persona: "Professor Buffy — TechPlay's wise owl mascot" (`BuffyService.ts:3-6`); footer "🦉 Professor Buffy | TechPlay Community" (L37); colour palette (Discord blurple primary, amber XP, purple achievement, blue welcome, L10-19); randomised welcome lines ("Hoot hoot! 🦉 A new adventurer has joined our ranks!", "*adjusts spectacles* Ah, a new student!", L73-80), level-up lines (L109-116), a tips list with a "🦉 Buffy's Wisdom" category (L229-247). The embed thumbnail is the bot's own Discord avatar because the hard-coded `techplay.gg/images/buffy-avatar.png` never existed (L21-35). **No image/brand assets ship in `discord/`** (the folder holds only `src/`, `package.json`, `tsconfig.json`, `.env.example`). Guild size is referenced in a code comment as 153 members (`ServerStatsService.ts:52-54`; date of that observation not stated — OBSERVATION).

### B.8.1 Slash commands (FACT, `discord/src/commands/definitions.ts`, dispatched in `handlers/commands.ts:54-79`)

| Command | What it does | Backend endpoint |
|---|---|---|
| `/profile [user]` | TechPlay profile card (rank, XP, level, shelf, achievements) | `GET /discord/user/{id}` |
| `/link` | Link Discord ↔ TechPlay account | web flow |
| `/sync` | Align Discord role with site rank | `GET /discord/ranks` |
| `/search query` | Search articles | `GET /search/articles` |
| `/game name` | Game lookup with catalogue autocomplete | `GET /search/games`, `GET /games/{slug}` |
| `/library [user] [status]` | Someone's shelf, optionally one status | `GET /discord/library/{id}` |
| `/match user` | Taste overlap between two members | `GET /discord/match/{a}/{b}` |
| `/backlog` | Three things to play next from what you own | `GET /discord/backlog/{id}` |
| `/daily` | Daily XP bonus (50 + streak bonus; uncapped, §2.7) | `POST /discord/daily` |
| `/leaderboard` | Top XP | `GET /discord/leaderboard` |
| `/stats` | Server statistics | guild cache + leaderboard |
| `/help` | Command list embed | — |
| `/tip` | Random gaming/tech tip from Buffy | — |
| `/techplay` | Service status | `GET /system/status` |
| `/latest` | Latest news | `GET /news` |
| `/giveaways` | Active giveaways | `GET /giveaways` |
| `/forum` | Trending forum threads | `GET /forum/active` |
| `/subscribe news|giveaway|status` | DM subscriptions | `/discord/subscriptions` |
| `/gift user amount` | Gift 10–1000 XP | `POST /discord/gift` |
| `/admin stats|recap|roles [apply]|xp give|xp remove|announce|event` | Admin tools (Administrator permission) | `/discord/admin/*` |

### B.8.2 Automations (FACT, `discord/src/index.ts:53-105`)

- **Article push**: backend `DiscordAnnouncer` POSTs to the bot's localhost `PublishListener` (port 8099) on every publish; feeds news/reviews/guides/tech are posted to the channel named `latest-news` with per-feed emoji/label/colour ("🚨 Breaking News", "⭐ New Review", "📖 New Guide", "🔧 Tech & Hardware"; `PollingService.ts:33-76, 187`); a 10-minute poll is the fallback with on-disk watermarks (`config.ts:36-39`, `PollingService.ts:8-14`).
- **Welcome** embed in `#new-people` with member number and getting-started steps (`/link`, `/profile`, earn XP, `/leaderboard`) (`events.ts:75-90`, `BuffyService.ts:86-103`).
- **Moderation**: word-boundary bad-word/invite filter, deletes and DMs (`events.ts:7-66, 132-150`); filtered messages earn no XP (`XpService.ts:67-70`).
- **XP mirroring**: 15 XP per message, 60 s cooldown (`XpService.ts:29-30`), sent to `POST /discord/xp` which routes through `XpService::awardXp` (capped, seasonal) (`DiscordXpController.php:31-59`); rank-ups and achievement unlocks announced with Buffy embeds (`XpService.ts:99-110`); leaderboard "overtake" notices posted in the announcement channel (L146-185).
- **Weekly recap** Sunday 20:00 (`RecapService.ts:17`): Member of the Week (XP gained or messages), all-time top 5, latest 3 articles, server status (L24-84); resets weekly activity.
- **Server stats voice channels**: "📊 Members", "🟢 Online", "🤖 Bots", refreshed every 10 min (`ServerStatsService.ts:9-24`).
- **Status rotation** every minute: "{n} Active Giveaways 🎁" / "TechPlay.gg Online 🟢" (Maintenance after 3 missed health checks) / "{n} Forum Trends 🔥" / "{n} Gamers 🎮" (`StatusService.ts:34-80`).
- **DM subscriptions** for new news and giveaways, polled every 5 min (`SubscriptionService.ts:13-62`).
- **Rich Presence → site presence** (30 s throttle on changes, `events.ts:159-224`) and **guild membership → "Discord Native" badge** with full roster sync on start (`events.ts:93-127`, `DiscordMembershipController.php`).
- Role ladder maintenance `/admin roles` (rename retired roles, create missing, never delete, `RoleLadderService.ts:17-36`).

### B.8.3 What is missing (FACT by absence in `discord/src/**`)

No reaction roles / onboarding questionnaire; no quest or challenge reactions (`handlers/events.ts` has welcome, moderation, presence, membership only); no scheduled content other than the Sunday recap (no "release of the day", no giveaway countdown posts, no forum-thread cross-posts on creation, no wishlist/calendar reminders); no thread/forum-channel creation for articles; no reaction-based polls; no server-boost or invite tracking; no Bounty visibility (commands speak XP only); no `/quests` or `/streak` command (the site streak and quests are invisible on Discord; `/daily` pays XP via a separate uncapped path, §2.7); no image assets/persona art in repo; no multi-guild support (single `guildId`, `config.ts:8`); no bridge from Discord to the newsletter; no analytics on command usage.

---

## B.9. Search

FACT (`SearchController.php`):
- Articles: Postgres full-text `to_tsvector('english', title || ' ' || excerpt) @@ plainto_tsquery` over published news/reviews/tech, 10 results, 60 s cache (L34-46); FTS index migration `2026_03_07_000004_add_fulltext_index_to_articles_table.php`. Guides are **not** in article search (category filter `news, reviews, tech`, L39-41) — OBSERVATION.
- Games: `ILIKE %q%` on `games.name` backed by a trigram index (`2026_07_03_000001_add_trgm_index_to_games_name.php`), only games with a description, ranked prefix > word-start > contains, editions demoted, unrated last, 5 results (L126-190); the first hit is recorded as a chronicle "search" signal for signed-in users (L207-220).
- Users: `/search/users` (present in routes; body not reviewed in detail).
- Help: `HelpArticle::matching()` for the header dropdown, 5 results, absolute help.techplay.gg URLs (L91-120).
- Forum: `/forum/search` with FTS index (`2026_03_07_000002_add_fulltext_index_to_forum_tables.php`, `ForumController::search` L1192).
- No unified search endpoint or search results page API — the header dropdown fans out to four endpoints (comment L84). No search analytics beyond Redis history per user and `analytics:game_search` zsets (`FunnelAnalytics.php:9-10`).

---

## B.10. Product capability map (backend-driven features)

Columns: Feature | Current state | User value | Target audience | Discovery value | SEO value | Social value | Registration value | Retention value | Referral potential | Community potential | Marketing potential | Current weaknesses | Possible future opportunity. Ratings are OBSERVATION/ESTIMATE unless a FACT citation is given in "Current state"; scale Low/Med/High. 45 rows.

| Feature | Current state | User value | Target audience | Discovery | SEO | Social | Registration | Retention | Referral | Community | Marketing | Current weaknesses | Possible future opportunity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Editorial articles (news/reviews/tech) | Live, 638 articles (README:53), full publish fan-out (`ArticleObserver.php`) | High | Gamers, hardware buyers | High | High | Med | Low | Med | Low | Low | High | Traffic collapsed to 1–2 clicks/day since 17 Aug 2026 (README:590); no email distribution | Newsletter + Discord + game-page cross-links per article via `game_id` |
| Guides (with steps, difficulty) | Live model + HowTo schema (`SchemaService.php:129-138`, unused) | High | Players stuck in a game | High | High | Low | Low | Med | Low | Low | Med | Not in article search; HowTo JSON-LD never emitted | Per-game guide hubs; FAQ/HowTo rich results |
| Game database pages | Live, 295,024 indexable URLs (README:548) | Med | Anyone searching a title | High | High (potential) | Low | Low | Low | Low | Low | Med | 0.7 % have "our" content (README:592); Googlebot 77 game pages/day | Prioritise enrichment by search demand; reader reviews/threads as UGC |
| Facet hubs (genre/platform/year/tag) | Live API + pages (`GameRatingController.php:214`) | Med | Browsers, list seekers | High | High | Low | Low | Low | Low | Low | Med | Thin: no editorial intro text, no per-hub SEO copy in code | "Best X games of Y" hubs with editorial paragraphs |
| Series pages | Live, weekly rebuild (`console.php:237`) | Med | Franchise fans | Med | High | Low | Low | Low | Low | Low | Med | Depends on Wikidata/IGDB series keys | Franchise timelines as shareable content |
| Studio pages + country | Live, 57,630 studios (README:54) | Low-Med | Industry followers | Med | High | Low | Low | Low | Low | Low | Low | Mostly bare rows | Country hubs (e.g. Balkan studios) as local-press angle |
| Release calendar | Live, own aggregator of 4 stores, notability score (`Notability.php`) | High | Everyone | High | High | Med | Med | High | Med | Low | High | Reminders are bell-only (§2.10) | Monthly "what's releasing" email/Discord post from the same data |
| Calendar pre-release pages | Live `/calendar/{slug}` (`CalendarController.php:129-137`) | Med | Pre-order shoppers | High | High | Low | Med | Med | Low | Low | Med | Depends on store quality gate | "Everything we know" pages for upcoming AAA |
| Calendar release reminders | Live toggle (`CalendarController.php:242`) | Med | Wishlisters | Low | Low | Low | High | High | Low | Low | Med | Notification never leaves the site | Email/Discord DM on release day |
| Wishlist release + review notices | Live (`CheckWishlistReleases.php`, `ArticleObserver.php:377`) | Med | Collectors | Low | Low | Low | High | High | Low | Low | Med | Database-only | Same |
| Library import (Steam/Xbox/PSN/GOG/Epic) | Live, 13 connected accounts, 2,599 shelf rows (README:414, 404) | High | Multi-platform gamers ("One Game Library" tagline) | Med | Low | Med | High | High | Med | Med | High | PSN/GOG/Epic need pasted codes; only 2 of 55 linked (migration comment) | Import wizard as the headline onboarding + shareable "shelf worth" card |
| Shelf worth (Steam prices) | Live nightly (`RefreshShelfPrices`) | Med | Collectors | Low | Low | High | Med | Med | High | Low | High | US prices only, Steam only | "My library is worth $X" share image |
| Gamer DNA | Live (`GamerDnaService.php`) | High | Profile owners | Low | Low | High | High | Med | High | Med | High | Percentiles need ≥50 profiles; no share image endpoint | OG-image card per DNA; Wrapped-style yearly recap |
| Taste Match | Live web + Discord `/match` | High | Friends | Low | Low | High | High | Med | High | High | High | Requires both sides signed up with ≥3 games | Invite flow: "compare with me" link that registers the friend |
| Backlog Advisor | Live, no LLM cost (`BacklogAdvisorController.php`) | High | Backlog owners | Med | Med | Med | High | High | Med | Low | Med | Auth-only; nothing to index | Public "what to play next" quiz that ends in registration |
| Journal + Steam session suggestions | Live (`SessionSuggestionService.php`) | Med | Diarists | Low | Low | Low | Med | High | Low | Low | Low | Niche; manual acceptance | Monthly playtime recap |
| Game lists (incl. tier lists) | Live, 4 lists (README:60), sitemap | Med | Curators | Med | Med | High | High | Med | High | High | High | Almost none created | Prompted list campaigns ("Top 10 of 2026") with tag hubs |
| Reader game ratings/reviews | Live, XP 10 + Bounty 15 | Med | Opinionated players | Low | Med | Med | High | Med | Low | Med | Med | Few reviews (count UNKNOWN) | Reviews as the "ours" content on 295k game pages |
| Forum | Live, 7 threads (README:58); solutions, polls, reactions, self-pin | Med | Community | Med | Med | High | High | High | Med | High | Med | Quiet; game threads rarely exist (99 % empty per `Game.php:158-160`) | Seed threads per major release; Discord cross-post |
| Comments | Live, 22 (README:59), probation for first 3 | Low | Readers | Low | Low | Med | High | Med | Low | Med | Low | Held comments once felt like a hole (fixed by labelling) | Comment digests to authors |
| XP / ranks / levels | Live, full economy (§2.1-2.3) | Med | Engaged members | Low | Low | Med | Med | High | Low | Med | Med | 45 of 55 members had zero XP (migration comment) | XP/rank on public cards and Discord roles (done) |
| Achievements (67) | Live + nightly sweep | Med | Collectors | Low | Low | High | Med | High | Low | Med | Med | Trophy case visible only on profile | Achievement share cards; rarity % |
| Quests (23 + seasonal) | Live, rotated board | Med | Members | Low | Low | Low | Med | High | Low | Low | Med | Not surfaced by email/Discord | Discord `/quests` + weekly quest post |
| Seasons (Ignition/Overdrive) | Live, champion badge on conclude | Med | Members | Low | Low | Med | Low | High | Low | Med | High | Champion needs all 4 quests; only `/seasons` API public | Season launch as a marketing beat with Discord event |
| Bounty + reward store | Live (§2.6) | Med | Members | Low | Low | Med | Med | High | Low | Low | Med | Only cosmetics; "shop discount" points at unlaunched shop | Real perks (giveaway entries for Bounty, merch) |
| Daily streak | Live site + separate Discord `/daily` | Med | Members | Low | Low | Low | High | High | Low | Low | Low | Two implementations, different rewards (§2.7) | Unify; streak reminder push/email |
| Leaderboards (6 boards) | Live, public | Med | Competitive members | Low | Low | High | Med | High | Low | High | Med | Tiny population | Weekly "rising" post to Discord/newsletter (bot already computes overtakes) |
| Giveaways | Live, 2 draws, 21 entries (hub docblock) | High | Deal seekers | High | Med | High | High | Med | **High** (referral codes, share tasks) | Med | **High** | Reminders bell-only; UI column was missing 6 months; entries are their own economy | Referral leaderboard + social tasks are the only built-in viral loop — use it |
| Newsletter + campaign desk | Live since 11 Sep 2026 (§3) | Med | Subscribers | Low | Low | Low | Med | High | Low | Low | High | Fully manual; subscriber count UNKNOWN | Automate digest from `SendWeeklyDigest` data with `mail` channel |
| Weekly digest | Database-only (§2.11) | Low (as is) | Members | Low | Low | Low | Low | High (if mailed) | Low | Low | High | Never leaves the bell | Add `mail` channel behind opt-in |
| Friends / Social Hub chat | Live, Reverb | Med | Friends | Low | Low | High | High | High | Med | High | Low | Small network | Friend invites by link |
| Recognitions | Live, 4 types | Low | Members | Low | Low | Med | Low | Med | Low | Med | Low | Invisible outside profile | — |
| Profiles (public) | Live, rich payload (`AuthController.php:279-590`) | High | Members | Med | Med (if indexed) | High | High | High | High | Med | High | Private option hides from boards; no OG cards found in backend | Profile OG images (`ImageDimensionService` exists for share cards) |
| Presence ("playing now") | Live Steam + Discord | Low-Med | Friends | Low | Low | High | Med | Med | Low | Med | Low | Steam only for polling | "Friends playing" Discord channel |
| Help centre (help.techplay.gg) | Live, 50 answers (README:65) | High | Stuck users | Med | High | Low | Low | Med | Low | Low | Low | Anonymous by design | Support SEO ("Steam not syncing") |
| Search | Live FTS/trigram (§9) | High | Everyone | High | Low | Low | Low | Med | Low | Low | Low | No guides in article search; no results page API | — |
| GTA 6 hub | Live, 121/36/12/1,058 items (README:62) | High | GTA fans | High | High | Med | Low | Med | Med | Med | High | Static; depends on news cycle | Timed content pushes around GTA 6 dates (UNKNOWN dates) |
| WoW Analyzer | Live, Groq, public leaderboard + share counter | High | WoW raiders | Med | Med | High | Med | Med | High | Med | High | Tied to "Midnight" launch (2 Mar 2026) — ageing | Re-aim at next patch; share cards |
| The Last Disc petition | Live, counts real | Med | PlayStation physical fans | Med | Med | High | Low | Low | High | Med | High | Signature count UNKNOWN | Press angle; export to deliver |
| Frontiers landing | Live page, no backend, countdown passed 13 Sep 2026 | Low | Curious | Low | Low | Low | Low | Low | Low | Low | Med | Promise without product | Decide: build, or take the page down |
| Discord bot | Live, 20 commands, article push, recap | High | Server members | Med | Low | High | High | High | Med | High | High | No scheduled content beyond recap; no quest/streak surface | Daily "release of the day"/giveaway countdown posts from existing endpoints |
| Shop / supporter tiers | Unlaunched, PayPal sandbox (README:66, 863) | — | — | — | — | — | — | — | — | — | Med | 0 products | Merch/supporter launch when audience exists |
| Ads (positions, CPM, click tracking) | Live model (`AdCampaign.php`) | — | Advertisers | — | — | — | — | — | — | — | High | AdSense limited by CMP until 20 Sep 2026 (README §19) | Media kit page `/marketing` |
| First-party analytics | Live, cookieless (`AnalyticsCollector.php`) | — | Staff | — | — | — | — | — | — | — | Med | Cannot answer monthly uniques by design | Funnel events already whitelisted (`FunnelAnalytics.php:21-30`) |
| Mobile app | Paused 9 Sep 2026 (`mobile/README.md`) | — | — | — | — | — | — | — | — | — | Low | No store accounts | — |

---

## B.11. Measured baseline numbers (copied from `docs/README.md`, all dated 7 Sep 2026 unless stated)

| Metric | Value | Source line |
|---|---|---|
| Articles | 638 (635 published, 3 drafts) | README:405 |
| Games | 333,198 | README:399 |
| Studios | 57,630 | README:400 |
| Game tombstones (410 map) | 61,034 | README:401 |
| Store links | ~47,964 | README:402 |
| Steam achievements rows | ~16,438 | README:403 |
| user_games (shelf rows) | 2,599 | README:404 |
| Notifications rows | 420 | README:406 |
| user_achievements | 240 | README:407 |
| Quests rows | 53 | README:408 |
| Help articles | 50 | README:409 |
| Site settings | 44 | README:410 |
| Categories | 31 | README:411 |
| Comments | 22 | README:412 |
| Ranks | 20 | README:413 |
| Connected accounts | 13 | README:414 |
| Users | 60 | README:415 |
| Forum threads | 7 | README:58 |
| Game lists | 4 | README:60 |
| Giveaways | 2 | README:64 |
| GTA 6 hub | 121 vehicles, 36 weapons, 12 characters, 1,058 locations | README:62 |
| Shop products | 0 | README:66 |
| Tables / empty tables | 120 / 73 empty | README:393, 417 |
| Sitemap game URLs | 295,024 | README:548 |
| Google indexed / not indexed | 56,355 / 338,358 | README:588-589 |
| Search clicks per day | 1–2 (was ~100 until 17 Aug 2026) | README:590 |
| Googlebot requests per day | ~290, of which 77 game pages | README:591 |
| Game pages with "our" content | 1,967 of 295,023 (0.7 %) | README:592 |
| GA consent (8 Sep 2026) | 2,094 hits denied vs 157 granted; 11 active users | README:917-919 |
| GA consent (7 Sep 2026) | 25 of 2,137 measurements | README:581-582 |
| Tests | 1,047 passing, 8 skipped | README:666 |
| Funnel (code comment, before 31 Aug 2026) | 55 registered → 50 confirmed → 21 giveaway entrants → 7 commented → 3 added a game → 2 linked a platform; 45 of 55 with 0 XP | `…one_quest_ladder…php:9-14` |
| Giveaway hub (code comment) | 2 draws, 21 entries, 0 winners announced | `GiveawayHubController.php:19-20` |
| Discord guild (code comment) | 153 members | `ServerStatsService.ts:54` (undated) |
| Owned games priced nightly | 1,017 of 332,455 | `console.php:171` |

Not in the README and therefore UNKNOWN from this audit: newsletter subscriber count, mail campaigns sent, Last Disc signatures, WoW analyses count, Discord message volume, bounty in circulation, game ratings count.

---

## B.12. "Wired but unused / unwired" list

1. FACT — `SchemaService` (Review/Product/Rating/Person/Organization/VideoObject/HowTo JSON-LD, `SchemaService.php:34-206`) is called only by `SeoController::getSchemas()` behind a staff check (`SeoController.php:60-67`) and by the Filament Settings page; the frontend writes its own JSON-LD (README §17).
2. FACT — `WeeklyDigestNotification` and 19 other notifications are database-only; the digest command runs weekly and reaches nobody by mail (§2.11).
3. FACT — Discord `/daily` bypasses `XpService` (uncapped, no Bounty, no ledger) while site streak and Discord message XP go through it (§2.7).
4. FACT — `POST /giveaways/{slug}/daily-bonus` had no UI caller for six months (2 Mar → 9 Sep 2026, README:833-849); restored.
5. FACT — Shop, `products`, `orders`, `support_tiers` (TechPlay Fan 4.99 / Super Fan 9.99 / TechPlay Legend 19.99, `SupportTierSeeder.php`), PayPal: unlaunched/sandbox (README:66, 863); achievements Collector / Gear Collector / TechPlay Patron / Legacy Supporter and the "10 % Shop Discount" reward are therefore unreachable.
6. FACT — "Squad Goals" referral achievement is hidden/manual and no account-level referral system exists (§2.4); the only referral mechanism is per-giveaway codes (§2.9).
7. FACT — Frontiers landing page has a countdown that expired 13 Sep 2026 and no backend; the clan system it evokes was dropped (`drop_clan_system` migration).
8. FACT — `ImageOptimizationService` requires a package not in `composer.json` and no-ops (README §17).
9. FACT — `maintenance_mode` setting connected to nothing (README §17); `faq_items`, `seo_metas` empty tables without models (README:862).
10. FACT — Guides are excluded from `/search/articles` (`SearchController.php:39-41`) though they have their own sitemap and feed section.
11. FACT — Two overlapping release-notification paths (calendar reminder flag vs wishlist status check) can notify the same person twice for one game on release day (§2.10) — OBSERVATION on overlap; dedup only exists inside the wishlist command.
12. FACT — `SendLaunchNewsletter` (`newsletter:launch`) is a one-off command superseded by the campaign desk; still in the codebase.
13. FACT — `MailSuppression` supports bounced/complained but no code path writes those reasons (grep shows only `NewsletterSubscriber::unsubscribe()` calling `suppress()`); provider feedback loops are not ingested — OBSERVATION pending provider config.
14. FACT — `/webhooks/discord/notify` manual relay exists for staff to push arbitrary announcements (`api.php:725-726`, `WebhookController.php:12-19`); no admin UI found calling it (OBSERVATION).
15. FACT — `ArticleObserver::regenerateNewsSitemap()` writes `sitemap-news.xml` on publish (L315-323) — a Google News sitemap exists, but whether the site is in Google News/Publisher Center is UNKNOWN.
16. FACT — IndexNow is submitted for articles (`ContentObserver.php:28-76`), guides, help articles and games that gain a description (`GameObserver.php:78-82`); Google does not consume IndexNow, so the article→Google path is sitemap + crawl only.
17. FACT — Funnel event whitelist (`wizard_shown`, `wizard_steam_click`, `wizard_xbox_submitted`, `wizard_pick_started/done`, `wizard_skipped`, `checklist_steam_click`, `d1_return`, `FunnelAnalytics.php:21-30`) implies an onboarding wizard/checklist exists in the frontend; its counters live in Redis for 90 days and surface in `analytics:funnel` — a ready-made onboarding KPI nobody may be reading (OBSERVATION).
18. FACT — `AdminAlert` notification and Telegram error channel exist for staff, but no marketing/growth alert (e.g. new subscriber, new signup) is produced (FACT by absence).
19. FACT — Mobile app paused 9 Sep 2026 with no store accounts (`mobile/README.md`, README §18).
20. FACT — `DiscordAdminController::startEvent()` supports "special events (e.g. Double XP)" with a multiplier (`DiscordAdminController.php:100-157`), but `XpService` reads only `Season::multipliers()` (`XpService.php:49`) — whether the Discord event multiplier is applied anywhere is UNVERIFIED (the controller's `getActiveEvent` was not traced to a consumer).
21. FACT — `users.email_notifications` column exists (`User.php:90`) and `SendWeeklyDigest` reads `settings.notifications.weekly_digest`; both preferences exist without any mail that would honour them beyond the bell.

---

## B. Sources used

No external web sources were used for this file. All facts are from the repository at `/home/user/techplay` as read on 27 Sep 2026, primarily:

- `docs/README.md` (measured state, 7 Sep 2026; §19-20 updated 11-20 Sep 2026)
- `backend/routes/api.php`, `backend/routes/console.php`
- `backend/app/Services/*` (XpService, LevelService, RewardTierService, BountyService, StreakService, AchievementService, QuestService, RewardCatalogService, GamerDnaService, TasteMatchService, Chronicle/*, Feed/*, GameRecommendationService, ProfileService, PresenceService, CampaignAudience, NewsletterAudience, SteamPriceService, ContentGameLinker, DiscordAnnouncer, AnalyticsCollector, FunnelAnalytics, Releases/*)
- `backend/app/Notifications/*.php`, `backend/app/Observers/*.php`, `backend/app/Jobs/*.php`, `backend/app/Console/Commands/*.php`
- `backend/database/seeders/*.php`, `backend/database/migrations/2026_08_13_160000_broaden_the_quest_catalogue.php`, `2026_08_13_120000_lay_out_two_clean_seasons.php`, `2026_08_31_210000_one_quest_ladder_from_the_first_day.php`
- `backend/app/Models/*.php`, `backend/app/Http/Controllers/Api/V1/*.php`, `backend/app/Filament/**`, `backend/config/*.php`
- `discord/src/**/*.ts`
- `frontend/app/{frontiers,tools,last-disc,backlog-advisor}/*.tsx`, `frontend/lib/tools.ts` (for §7 only)
- `mobile/README.md` (context)

No external sources; all sources are repository files.

## B. Gaps / needs more data

1. Live row counts for `newsletter_subscribers`, `mail_campaigns`, `last_disc_signatures`, `wow_analyses`, `game_ratings`, `bounty_transactions`, `quest_progress`, `presences` — not in README; need a production DB read.
2. Which season dates are actually in the `seasons` table today (two migrations disagree; admin-editable).
3. Exact live list of the 31 categories (editorial vs forum) — needs DB read.
4. Whether mail provider (Resend/Postmark/SES per README §11) bounce/complaint webhooks exist outside the repository.
5. Discord guild size and activity today (153 in an undated code comment); Discord channel names beyond `latest-news`, `new-people`, `RECAP_CHANNEL_ID`.
6. Whether Google News / Publisher Center inclusion exists for `sitemap-news.xml`.
7. What happened with Frontiers on 13 Sep 2026 and whether the landing page should stay.
8. Search Console per-section performance (news vs games vs GTA 6 vs help) — only totals are in README.
9. Count of "our content" per game page by type (reader reviews vs threads vs linked articles) — the 1,967 figure is a single total.
10. Confirm the models count (93 files today vs 86 in README) by checking git history — git commands were out of scope for this agent.
11. `SitemapController` changefreq/priority values and whether `sitemap-news.xml` follows the Google News sitemap schema (`<news:news>`) — not opened in this pass.
12. Whether the Discord "event" XP multiplier (`DiscordAdminController::startEvent`) is applied anywhere.
