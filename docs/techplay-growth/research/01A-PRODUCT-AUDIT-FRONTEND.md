# 01A — TechPlay Product Audit: FRONTEND (repository inspection)

Status: Phase 1 research draft — 27 Sep 2026
Agent: repo-frontend
Scope: `frontend/` of `/home/user/techplay` (Next.js 16.3.0, React 19.2.3, App Router). Every claim below is labelled FACT (read in the repo, file:line given), OBSERVATION (seen but not measured), ESTIMATE, HYPOTHESIS or RECOMMENDATION. No external URL was fetched for this document; the only sources are repository files and `docs/README.md` (7 Sep 2026 measurements).

## Executive summary

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

## 0. Method and scope

- FACT — Files enumerated with `find frontend/app -name "*.tsx" -o -name "*.ts"` (185 files), `frontend/components/**` (204 files), `frontend/lib`, `frontend/context`, `frontend/hooks`, `frontend/public`, `next.config.ts`, `package.json`. Line numbers are from `cat -n` on 27 Sep 2026.
- FACT — `docs/README.md` §6 says "84 stranice, 5 route handlera"; the tree actually contains 9 route handlers (`/api/revalidate`, `/rss`, `/feed`, `/proxy/gtag`, `/proxy/ga/[...path]`, `/og/list`, `/og/profile`, `/og/studio`, `/app-check`). The README's count is stale by four (the three OG routes and `/app-check`).
- OBSERVATION — Nearly every file carries long rationale comments describing measured incidents (e.g. "0 anchors into a catalogue of 332,455 games, measured on production", `app/games/page.tsx:72-73`). Those numbers are quoted here as FACT-in-code, i.e. what the developer wrote, not as fresh measurements.

---

## 1. Route inventory

Legend: **Render** = `export const revalidate` / `dynamic` as written in the page file; **Meta** = `generateMetadata` (GM), static `metadata` (S), or none (−); **LD** = JSON-LD `@type`s emitted server-side; **Canon** = canonical tag; **OG img** = og:image source; **noindex** = robots directive; **CTA** = primary conversion element on the page.

### 1.1 Home, feed, editorial

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

### 1.2 Games database and studios

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

### 1.3 Calendar, tools, GTA6

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

### 1.4 Community: forum, profiles, lists, leaderboard, social, giveaways

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

### 1.5 Commerce, static, legal, auth, help

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

### 1.6 Route handlers

| Handler | Purpose | Evidence |
|---|---|---|
| `GET /rss`, `GET /feed` | Proxy the backend RSS (`{root}/feed`), 15-min cache, `application/rss+xml` | `app/rss/route.ts:16-42`, `app/feed/route.ts:10-12` |
| `POST /api/revalidate` | On-demand ISR purge by tag/path; accepts `x-revalidate-token` or Bearer; reads `REVALIDATE_SECRET_TOKEN \|\| REVALIDATION_SECRET` | `app/api/revalidate/route.ts:24-71` |
| `GET /og/list`, `/og/profile`, `/og/studio` | Edge `ImageResponse` 1200×630 share cards; 404 for unknown entities; WebP/AVIF covers filtered out because Satori cannot decode them (41% of covers are WebP per comment) | `app/og/*/route.tsx`, `lib/ogCovers.ts:9-31` |
| `GET /proxy/gtag`, `POST /proxy/ga/[...path]` | First-party GA4 loader and collect relay (also copies hits to backend counter) | `app/proxy/gtag/route.ts:1-25`, `docs/README.md §19` |
| `GET /app-check` | Bare Turnstile page for the (paused) mobile app WebView; `noindex,nofollow` meta | `app/app-check/route.ts:1-30` |

---

## 2. Product capability map

Format per feature: **Current state** (FACT) · **User value / audience** · **Discovery · SEO · Social · Registration · Retention · Referral · Community · Marketing** (each rated Low/Med/High as ESTIMATE from code) · **Weaknesses** (FACT/OBSERVATION) · **Opportunity** (HYPOTHESIS/RECOMMENDATION).

### 2.1 Editorial

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

### 2.2 Games database

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

### 2.3 Accounts, library and gamification

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

### 2.4 Community

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

### 2.5 Tools and campaigns

**F28 — WoW Analyzer** — FACT: no login required, WebApplication+FAQPage schema, 2.5 MB PNG as OG image, ~100 meta keywords. Discovery High (niche search), Registration Low. RECOMMENDATION: convert OG to a ≤300 KB 1200×630 asset; the keyword list is harmless but reads as 2010 SEO.

**F29 — GTA 6 Hub** — FACT: 6 indexable pages, Leaflet map with 1,000+ pins, characters with `generateStaticParams`, FAQPage, newsletter CTA "Don't miss a single GTA 6 drop — Join the Crew", pre-order block with retailer links that are `"#"` placeholders until "redakcija fills affiliate URLs" (`Gta6PreOrder.tsx:4`), countdown to 2026-11-19 hardcoded (`app/gta6/page.tsx:17`). Discovery High (event-driven), Marketing High. Weakness: FACT — the release date is hardcoded in three places (`gta6/page.tsx:17`, `everything-we-know/page.tsx:39`, JSON-LD `datePublished`), and the Discord link differs from the site-wide one. RECOMMENDATION: single source for the date; fill retailer links before launch window.

**F30 — The Last Disc (petition)** — FACT: email signature with country, live counts (signatures, countries, latest), countdown to Jan 2028, poll, share row, coverage search; letter page with Article schema. Social High, Referral High, Registration Low (email only, not an account). Weakness: FACT — comment says the honest signature count "is currently zero" (`app/last-disc/page.tsx:93-96`), i.e. launched with no seeding. RECOMMENDATION: pair the campaign with the giveaway's task engine ("sign the letter" as a task).

**F31 — Frontiers (teaser)** — FACT: static teaser, "Notify me" writes to the general newsletter (no segment), nav says "coming". Weakness: OBSERVATION — interest in an unreleased game is indistinguishable from news subscribers in the mail audience. RECOMMENDATION: tag the source at subscribe time (backend may support `source` — UNVERIFIED).

**F32 — Tools directory (`/tools`)** — FACT: ItemList of 5 (WoW, Backlog Advisor, Game Lists, GTA 6, Last Disc). Discovery Med.

### 2.6 Commerce and support

**F33 — Shop** — FACT: indexable, "Coming Soon" when no products (README §17: `products` table empty, PayPal sandbox). Marketing Low until launched. RECOMMENDATION: `noindex` the shop until inventory exists, or publish merch.

**F34 — Support tiers (donations)** — FACT: PayPal subscriptions, tiers from admin, RewardsStore items gated by `required_tier`. Weakness: README §17 says tiers table empty → page renders "Support tiers are unavailable right now" (FACT in code). Footer links "Support Us" to it on every page.

**F35 — Advertising (AdSense)** — FACT: three hand-placed unit types (in-feed, display, in-article; `AdSense.tsx:38-42`), auto ads off, host-gated to `techplay.gg` (`ads/config.ts:23-30`), consent via Google CMP, `ads.txt` present. Homepage 1 unit, article ≥5 slots desktop, game page 1 conditional unit. Marketing High. OBSERVATION: ad density on articles is the main mobile friction (see §6).

**F36 — "Advertise with us" (`/marketing`)** — FACT: formats (300×250 etc.), "Balkans-founded, US and EU audience", giveaway sponsorship offer, mailto, "Agency? Ask for our agency rate card." No numbers (comment: two audience numbers were removed as unverifiable, `MarketingClient.tsx:8`). Marketing Med.

### 2.7 Platform plumbing that affects growth

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

## 3. Conversion points inventory (actual copy from code)

### 3.1 Registration / sign-in CTAs

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

### 3.2 Newsletter CTAs

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

### 3.3 Discord CTAs

| Where | Copy | URL | Evidence |
|---|---|---|---|
| Footer (every page) | "Join our Discord — Talk games with the community" | `settings.discord_url` else `https://discord.gg/wPQG9gUMXH` | `Footer.tsx:50,129-149` |
| Article/tech sidebar (desktop only, `xl:` rail) | Panel "Community Discord — {site name} — Official server" perks "News the moment it publishes / Giveaway pings before they close / Squads, LFG and the editors" → "Join Discord" | same | `DiscordWidget.tsx:17-63`, `ArticleDetailView.tsx:364,378` |
| GTA 6 newsletter block | "or join our Discord community" | `https://discord.gg/techplaygg` (hardcoded, different) | `Gta6NewsletterCTA.tsx:7,85` |
| Help centre "Still need help" | "Ask on Discord" | `discordUrl` | `StillNeedHelp.tsx:137-144` |
| Giveaway task | "Be part of our community — Join" (`discord_join`) | task URL | `GiveawayClient.tsx:150` |
| Article footer social row | Discord icon when `discord_url` set | settings | `ArticleFooter.tsx:17-23` |
| Organization `sameAs` | includes `settings.discord_url` | — | `app/layout.tsx:187-195` |

### 3.4 Share buttons

| Surface | Networks | Evidence |
|---|---|---|
| `SocialShare` (articles hero bar + footer, reviews, guides, giveaways task sheet) | X (`twitter.com/intent/tweet`), Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Copy link, native `navigator.share`; `onShared` callback for giveaway credit | `SocialShare.tsx:38-85`, `ArticleDetailView.tsx:275-280,349-358` |
| Forum thread | "Share" button (`handleShare`) | `ThreadClient.tsx:400,953-957` |
| Profile | `ShareCard` modal: system Share, "Save image", "Copy link" (uses `/og/profile` image) | `ShareCard.tsx:96-143`, `ProfileHero.tsx:385,654` |
| Game list | `ListSocialBar` share + like + comments | `ListSocialBar.tsx:62,119` |
| Last Disc | Facebook, X (with prewritten text "Sony is ending physical PlayStation discs in 2028. Digital is only bad when it's the only option — sign the open letter."), Reddit, Copy | `ShareRow.tsx:8-34` |
| Giveaway invite | WhatsApp/Telegram/Facebook/X invite links + "copy referral" | `GiveawayClient.tsx:185-200,497-499` |
| Game page, studio page, calendar, facet hubs, leaderboard | **no share control** (grep `SocialShare|ShareCard` in those files: 0) | — |

### 3.5 Follow / save / wishlist actions

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

## 4. SEO implementation audit

### 4.1 Metadata generation

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

### 4.2 JSON-LD actually emitted by the frontend (server HTML unless noted)

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

### 4.3 Sitemaps, RSS, robots (served by backend, linked by frontend)

- FACT — `nginx-site-techplay.conf:36-58` proxies `/robots.txt` and `^/sitemap.*\.xml$` to the backend; `SitemapController::index` lists pages, articles, categories, hub, guides, products, lists, series, news, images, games-{n}, studios (`SitemapController.php:43-125`); README §12: 15 maps, 295,024 game URLs. Robots: `User-agent: *`, `Allow: /`, `Disallow: /search`, `Sitemap:` (`:813-821`); README §12 adds `/api/`, `/admin/`, `/_next/data/`, `/login`, `/register`, `?_rsc=`, named AI bots, `meta-externalagent` and `Amazonbot` blocked.
- FACT — Frontend declares only one feed (`/rss`) in `<link rel=alternate>`; `llms.txt` (`public/llms.txt`) advertises `https://techplay.gg/feed` and the sitemaps.
- FACT — `sitemap-hub.xml` includes facet pages; the code comments record that 13 of 20 tag pages served empty grids under `index,follow` before the noindex gate (`lib/gameFacets.ts:50-60`).
- FACT — `sitemap-pages.xml` (`SitemapController::pages`, `backend/app/Http/Controllers/SitemapController.php:142-232`) lists 32 static URLs (`/`, section roots, `/calendar`, `/games`, `/forum`, `/shop`, `/frontiers`, `/last-disc`, `/last-disc/letter`, `/tools`, `/wow-analyzer`, `/backlog-advisor`, `/lists`, legal/about pages, six GTA6 pages) plus GTA6 character pages. It does **not** list `/studios`, `/leaderboard`, `/latest`, `/news|reviews|guides|hardware/page/[n]`, `/lists/tag/*`, `/studios/country/*`, `/social`, `/giveaways`, or `/calendar/*` (the last deliberately, comment at `calendar/[slug]/page.tsx:85-89`). Paged archives therefore rely on the pager links alone for discovery.

### 4.4 Canonical handling

- FACT — Always present via `generatePageMetadata`, article `canonical_url` override, hardcoded `https://techplay.gg` on games/facets/wow/last-disc/frontiers/shop (ignores `NEXT_PUBLIC_APP_URL`), relative on studios/lists-tag/forum/shop-product (resolved by `metadataBase`).
- FACT — Missing canonical: `/giveaway/[slug]`, `/social`, `/support/checkout`, `/shop/checkout`, `/verify-email`, `/newsletter/verify`, `/auth/callback` (none set metadata with alternates).
- FACT — Cross-canonical: `/calendar/[slug]` → `/games/[slug]`.
- FACT — `news/layout.tsx`, `reviews/layout.tsx`, `hardware/layout.tsx` still declare `alternates.canonical: "/news"` etc.; pages override with their own `alternates`, so no live harm, but any future page under these segments that forgets `alternates` inherits the section root canonical (the exact bug the forum layout comment describes, `forum/layout.tsx:4-15`).

### 4.5 Pagination

- FACT — `/news|reviews|guides|hardware/page/[n]`, n∈[2,500], `ROBOTS_INDEX`, self-canonical, numbered `<Link>` pager (`SectionHub.tsx:224-301`), 404 beyond last page.
- FACT — Category hubs, author grids (`?page=`), games hub ("load more", `GameDatabaseHub.tsx:288-320`), studios, lists, forum boards are client-paged only; the games hub uses `?page` state in memory, so a crawler never sees page 2 of any facet (30 games max per facet page in HTML, `facetGames.ts:63`).

### 4.6 hreflang / language

- FACT — Only `x-default` = canonical (`lib/seo.ts:261`); `<html lang="en">`; `og:locale en_US` on articles. No regional or Bosnian/Croatian/Serbian alternates exist anywhere. `llms.txt` states "Primary language: English, Region: Bosnia and Herzegovina (global audience)".

### 4.7 Robots / indexability rules in code

- Indexable by default (root `ROBOTS_INDEX`).
- noindex,nofollow: auth pages, cart, settings, forum/create, giveaways hub, unsubscribed, game pages with ≤50-char description, category hubs with 0 articles, not-found variants.
- noindex,follow: uncurated/empty facets, non-indexable studios/series, forum search, help search.
- FACT — Inherit index while they should not (OBSERVATION as weakness): `/social` (login wall), `/verify-email`, `/newsletter/verify`, `/support/checkout`, `/shop/checkout`, `/auth/callback`.

### 4.8 Internal linking patterns

- FACT — Header mega-menus: Discover (News 6 cats, Reviews 5, Hardware 4, Guides), Feed, Games (8 genres, 5 platforms, years, "open-world" tag), Studios (6 countries), Community (Forum, Leaderboard, Social Hub, Giveaways, Frontiers "coming"), Tools (5), Shop (`Header.tsx:60-96,563-642`). Footer: About, Help Centre, Contact, Advertise, Rating System, Roadmap, Shop, Support Us, legal, RSS (`Footer.tsx:62-85`).
- FACT — Game page outbound: studios, series, similar (8), related shelves, member lists, news & reviews, forum threads, "Where to get it" external. The "Tags" panel renders up to 24 plain `<span>` chips with **no links** (`app/games/[slug]/page.tsx:1656-1666`), so 332k game pages pass nothing to the ~20 indexable `/games/tag/*` hubs, and genre/platform names in the facts panel are likewise not linked to `/games/genre/*` or `/games/platform/*` (no `href` to those paths anywhere in the file).
- FACT — Article outbound: author, category hub, recommended (4), release calendar (5 games), game info card, breadcrumbs.
- FACT — Homepage server HTML links: hero CTAs, 4 quick links, editorial spotlight, review wall; discovery rails are client-only.
- Weakness (FACT): no "related guides" on game pages unless included in `bundle.articles`; no article → facet hub links; no studio → country link verified in body (country link present in header only).

### 4.9 Other provable weaknesses

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

## 5. Social metadata audit (OG / Twitter per page type)

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

## 6. Mobile experience notes (from code) — OBSERVATION unless marked

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

## 7. Newsletter, web push, RSS, notifications — exactly what exists

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

## 8. Things that look like features but are not wired (cross-checked with `docs/README.md` §17)

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

## 9. Sources used

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

External URLs fetched: none. Sources CSV written with header only: `scratchpad/sources/repo-frontend.csv`.

---

## 10. Gaps / needs more data

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
