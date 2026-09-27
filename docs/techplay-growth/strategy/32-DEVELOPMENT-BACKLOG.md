# 32 — Development Backlog (marketing-driven)

Status: Phase 2 plan — 27 Sep 2026

- **The spine's D-001…D-040 are kept with their IDs.** D-041 is the verified bot-giveaway-link bug. D-042…D-062 are new items this plan needed. D-007b, D-011a and D-039a–c are sub-items from other Phase 2 plans that are scheduled here. The other sub-IDs those plans registered are listed as children at the end of this file.
- **Demand is about twice what DEV can build.** The 67 items total 460 h ESTIMATE, and the 28 children add 105 h. DEV has 256 h from 28 Sep to 31 Dec (20 h a week, less over the holidays). The sprint plan schedules 225 h and keeps 31 h for deploys, incidents and README updates.
- **The order follows R23:** fix what is false or broken, make growth measurable, deliver the loops that already exist (email, alerts), build on the data (tools, datasets, year in review), then promote. GTA VI on 19 Nov is the hard deadline for the hub work.
- **All 16 P0 items land in October.** Giveaway integrity (D-039a/b, D-041) ships in week 1, so C09 can be promoted from Tue 29 Sep.
- **What fits in 2026:** trust and plumbing fixes, GA4 key events (phase A), UTM capture, the newsletter landing page, the welcome and reminder mail, "Your releases this week", price alerts, the GTA 6 release-time tool and map tracker, two dataset pages, three logs that start the 2027 datasets (D-033, D-042, D-059), and Your 2026 in Games.
- **What slips to Q1 2027:** Steam sign-in (D-015), the indexable-set change (D-021/D-023), platform hubs (D-032), the article-end block (D-010), bot invite attribution (D-011), web push (D-019), the Meta Pixel (D-031) and the prediction league (D-026). Each slip has a no-DEV interim in the "What slips" table.
- **Decision needed by 5 Oct:** the Meta Pixel cannot ship by 19 Oct without displacing P0 and dataset work. The default drops November retargeting and C57 for 2026 (see "D-031: the 19 Oct question").
- **Q1 2027 DEV time is already committed.** The 2026 carry-over fills about 13 weeks at 17 h. The 1 Jan decision is to add DEV capacity or cut from the Q1 list (34-2027-BRIDGE).

## How to read an item

| Field | Meaning |
|---|---|
| Priority | **P0** false, broken or blocking promotion: ship before the campaign that depends on it. **P1** unlocks a dated campaign or a core loop. **P2** valuable, not dated. **P3** later or conditional |
| Effort | XS ≤2 h · S 3–7 h · M 8–18 h · L 20–32 h · XL 40 h+. Hours are ESTIMATES from reading the files named. They include tests, Pint/ESLint and the README update, but not review time by others. Where the spine set an effort label (D-002 S, D-020 S) it is kept, even if the DEV hours come out lower |
| Target | ISO week in which DEV works on it (2026-W40 = 28 Sep–4 Oct). "Q1" weeks are carry-over, not commitments |
| Problem | A FACT with its research reference ([R01] = `research/01-…`). File:line references were checked in the repository on 27 Sep 2026 |
| Unlocks | Campaign IDs from the spine (C01–C71) that depend on the item |

**Changes from the spine list.** D-033 P2 → P1: the log cannot be backfilled, so every week of delay is data lost for good. D-006 is "remove", not "build /search". D-039 is conditional on the giveaway being live. D-041 is used for the bot giveaway links, as the coordinator asked, so the GTA 6 ledger item this plan first numbered D-041 is now D-062. D-054 is the same item as D-013c in 17-NEWSLETTER-EMAIL. D-052 absorbs D-007a (funnel widget). D-049 absorbs D-011d/e. D-047 absorbs D-011h. D-011a absorbs D-011l. D-013 absorbs D-013a. D-015 absorbs D-015a. D-021 absorbs D-021a–d.

## Rules every item inherits (CLAUDE.md and docs/README.md)

1. **Observers are registered in `AppServiceProvider` only.** A second registration runs the whole fan-out twice (`PublishHappensOnceTest` guards it).
2. **Status changes go through the model** (`$article->update()`), never a query-builder `update()`. This applies to the D-005 re-link and to any bulk fix.
3. **Cache keys come from `CacheService`** (`articleShowKey()`, `forgetArticle()`, `forgetListings()`). They are never written by hand, in code or tests. Revalidation is by tag through `RevalidationService`.
4. **Schema changes update the Baza section (§8) of `docs/README.md` in the same commit.** New features update the relevant section too. The README is the only reference document.
5. **No DNS, SPF, DKIM, DMARC, MX or SMTP change without asking first** (README §14). D-013, D-028 and D-054 raise mail volume from our own server: EIC signs off each before its first send, and the default pacing stays at 10 messages every 3 seconds.
6. **User content goes through `SanitizationService`, and controllers use the `ApiResponse` trait.** New public tables have eager-loaded queries (lazy loading throws outside production).
7. **Deploy with `techplay-deploy.sh`** (frontend, backend or both) and never by hand as root: ownership is split between `www-data` and `techplay`. The bot restarts as `techplay` under pm2.
8. **No public number that is not live.** Counts come from the API or are not shown: no members, subscribers, "thousands", ratings or "analyzed" totals.
9. **UTMs follow spine §9 and events follow spine §10.** Events go in `lib/track.ts` only. Campaign links come from one helper (D-009) or the SC sheet until then.
10. **Do not remove features or public routes without an instruction from EIC.** Noindex keeps a page live. Frontiers, the shop and support tiers stay until EIC decides.

## Backlog at a glance

| Priority | Items | Hours (ESTIMATE) | IDs |
|---|---|---|---|
| P0 | 16 | 61 | D-001, D-002, D-003, D-004, D-005, D-006, D-007, D-008, D-012, D-017, D-020, D-029, D-039a, D-039b, D-040, D-041 |
| P1 | 29 | 247 | D-007b, D-009, D-010, D-011, D-011a, D-013, D-014, D-015, D-016, D-018, D-021, D-022, D-023, D-025, D-027, D-028, D-033, D-038, D-039, D-039c, D-042, D-044, D-045, D-050, D-052, D-054, D-056, D-057, D-059 |
| P2 | 20 | 143 | D-019, D-024, D-026, D-030, D-031, D-032, D-035, D-036, D-037, D-043, D-046, D-047, D-048, D-049, D-051, D-053, D-055, D-058, D-060, D-061 |
| P3 | 2 | 9 | D-034, D-062 |
| Children (other plans) | 28 | 105 | listed at the end |

By area: trust and plumbing (D-001–D-006, D-022, D-029, D-030, D-040, D-041, D-053, D-058); measurement (D-007, D-007b, D-008, D-009, D-011, D-031, D-052); mail and alerts (D-012, D-013, D-019, D-027, D-028, D-047, D-054); registration (D-014, D-015, D-016, D-037); GTA 6 (D-005, D-017, D-018, D-020, D-056, D-061, D-062); giveaways (D-039, D-039a–c); SEO structure and hubs (D-021, D-023, D-032, D-057); data and PR (D-033, D-034, D-042, D-043, D-044, D-045, D-048, D-060); community and bot (D-011a, D-035, D-049, D-050); products (D-024, D-025, D-026, D-036, D-046, D-051, D-055, D-059).

## Items
### D-001 — Remove false claims (register, login, WoW, GTA 6, stale catalogue figures)
**P0 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C01, C44, C09, C06, C13, C54**
- **Problem.** FACT: /register and /login print "15K+ MEMBERS · 50K+ GAMES" (60 users, 333,198 games) and promise "XP for every comment and article you read" (reads award nothing since 11 Aug 2026); the GTA 6 block says "Join thousands of fans"; the WoW Analyzer says "50K+ players analyzed · 4.9/5"; page_seo rows and the lib/seo.ts fallback still say 140,000+/141,000 games; the homepage says 3 platforms while 5 import [R02 §6.1, §11; R11 §1.4; R23 A3].
- **Requirement / acceptance criteria:**
  - grep over frontend/app, frontend/components and frontend/lib for "15K+", "50K+", "thousands of fans", "4.9/5", "article you read" and "141,000" returns no user-facing hit (code comments excepted)
  - Register/login strip reads a live catalogue figure from the API (rounded down to the thousand) or shows no number; member counts are never shown
  - XP perk line reads: "Earn XP for comments, ratings and the games you finish" in RegisterClient and BrandPanel
  - Homepage hero stat reads "5 · Platforms that import" (Steam, PlayStation, Xbox, GOG, Epic)
  - seo:fix-game-counts gains a pattern for 1[34][0-9],?000\+? and is run with --dry-run first, then for real; EIC signs off the dry-run list
  - Leaderboard 'How to earn more XP' row no longer lists reading articles
  - Feature test or snapshot proves the register page renders without the removed strings; docs/README.md notes the removed claims under Zamke if any rule changes
- **Files likely touched:** `frontend/app/(auth)/register/RegisterClient.tsx:33,202-204`, `frontend/app/(auth)/login/LoginClient.tsx:23-25`, `frontend/components/auth/BrandPanel.tsx:21`, `frontend/components/gta6/Gta6NewsletterCTA.tsx:51-56`, `frontend/components/wow/WowAnalyzerClient.tsx:186,196`, `frontend/lib/seo.ts:187`, `frontend/components/home/HomeHero.tsx:43`, `frontend/app/leaderboard/LeaderboardClient.tsx:645`, `backend/app/Console/Commands/FixSeoGameCounts.php (patterns)`
- **Growth impact:** Trust precondition for every campaign; removes a claim any journalist, partner or advertiser can falsify in ten seconds. Guardrail for registration conversion (registration_complete / registration_start). **Dependencies:** EIC approves replacement copy (supplied in 33-QUICK-WINS).

### D-002 — Fix breadcrumb category hrefs on every article
**P0 · S (2 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C02**
- **Problem.** FACT: every article breadcrumb links /news/news-industry, /news/news-gaming or /news/tech-tech-news, all 404; ArticleDetailView builds `/news/${category.slug}` from the DB slug, while lib/categories.ts maps the id news-industry to the slug industry and tech articles live under /hardware [R02 §11.1; R23 A5].
- **Requirement / acceptance criteria:**
  - Breadcrumb href is built from one helper that maps category type to segment (tech → /hardware) and DB slug to route slug via lib/categories.ts
  - A check over 20 live articles (news, reviews, hardware) returns 200 for every breadcrumb link
  - The helper lives beside articleHref() so the mapping exists in one place
- **Files likely touched:** `frontend/components/news/ArticleDetailView.tsx:143-148`, `frontend/lib/articleHref.ts`, `frontend/lib/categories.ts`
- **Growth impact:** Removes a site-wide 404 that every article sends to crawlers and readers; internal-link equity to category hubs (organic clicks). **Dependencies:** none.

### D-003 — Fix RSS item paths and regenerate the feed on publish
**P0 · S (3 h ESTIMATE) · Owner DEV · Target 2026-W42 (12–18 Oct) · Unlocks C02**
- **Problem.** FACT: RssController maps category type 'tech' to /tech/<slug> (404; the page is /hardware/<slug>) and has no case for 'reviews', which falls to the /news default; the feed ran about 24 h behind sitemap-news on 27 Sep [R02 §11.2-3; backend/app/Http/Controllers/RssController.php:114-121].
- **Requirement / acceptance criteria:**
  - getArticleTypePath() maps news→news, reviews→reviews, tech→hardware and a feature test asserts one item of each type
  - frontend/app/rss/route.ts and feed/route.ts fetch with a cache tag ('rss'); RevalidationService::revalidateArticle() purges that tag on publish, update and delete
  - A newly published article appears in /rss within 15 minutes (checked on two publishes)
  - No new observer registration outside AppServiceProvider
- **Files likely touched:** `backend/app/Http/Controllers/RssController.php:36,114-121`, `backend/app/Services/RevalidationService.php`, `frontend/app/rss/route.ts:16-40`, `frontend/app/feed/route.ts`, `frontend/app/api/revalidate/route.ts`
- **Growth impact:** Feed readers, Discord bots and the planned Flipboard/Mastodon RSS automation stop receiving dead links (referral sessions). **Dependencies:** none.

### D-004 — Replace dead Discord invites with discord.gg/wPQG9gUMXH
**P0 · XS (1 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C02, C06, C35, C36**
- **Problem.** FACT: discord.gg/techplaygg (GTA 6 newsletter block, roadmap CTA) and discord.gg/techplay (seeder default for discord_url) return Unknown Invite; only wPQG9gUMXH works [R13 §1; Gta6NewsletterCTA.tsx:7; RoadmapCTA.tsx:17; SiteSettingSeeder.php:23].
- **Requirement / acceptance criteria:**
  - Both components read settings.discord_url with https://discord.gg/wPQG9gUMXH as the fallback, the same way Footer.tsx does; no invite is hard-coded elsewhere
  - SiteSettingSeeder default changed to wPQG9gUMXH; the live admin value is confirmed to be wPQG9gUMXH
  - RoadmapCTA social row: YouTube points to @techplay_gg (the real handle) and the unverified Twitch link is removed
  - grep for 'techplaygg' Discord invites returns 0; /gta6 and /roadmap Discord buttons open the server
- **Files likely touched:** `frontend/components/gta6/Gta6NewsletterCTA.tsx:7,85`, `frontend/components/roadmap/RoadmapCTA.tsx:14-17`, `backend/database/seeders/SiteSettingSeeder.php:23`, `frontend/components/layout/Footer.tsx:50 (reference pattern)`
- **Growth impact:** Every Discord click from the GTA 6 hub (the Q4 landing page) currently fails; restores discord_join from the hub. **Dependencies:** none.

### D-005 — Re-point GTA 6 news to /games/grand-theft-auto-vi and neutralise the parody entry
**P0 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W41 (5–11 Oct) · Unlocks C02, C06, C07, C10**
- **Problem.** FACT: TechPlay's GTA 6 stories are linked to /games/gta-6, a 2019 stickman parody, not /games/grand-theft-auto-vi, and the hub links to neither [R02 §11.4; R17 §1; R21 FIX-05].
- **Requirement / acceptance criteria:**
  - Every article whose game_id is the parody entry is re-linked to Grand Theft Auto VI through the model ($article->update()), not a query-builder update, so observers revalidate
  - PublishHappensOnceTest still passes and no Discord announcement or author payout fires for the re-link (updates are not publishes)
  - The parody game's link_name is changed so ContentGameLinker cannot match 'GTA 6' or 'GTA VI' to it; a unit test covers the match
  - /games/grand-theft-auto-vi lists the GTA 6 articles; /games/gta-6 lists none
- **Files likely touched:** `backend/app/Services/ContentGameLinker.php`, `backend/app/Observers/ArticleObserver.php (read, no change expected)`, `backend/app/Console/Commands/LinkContentToGames.php (reuse for the backfill)`, `backend/tests/Feature/PublishHappensOnceTest.php`
- **Growth impact:** Concentrates GTA 6 relevance on the real game page before 19 Nov; organic clicks and internal links for the P4 pillar. **Dependencies:** none.

### D-006 — Remove the WebSite SearchAction (build /search later)
**P0 · XS (1 h ESTIMATE) · Owner DEV · Target 2026-W51 (14–20 Dec) · Unlocks C02**
- **Problem.** FACT: the root layout's WebSite.potentialAction points to /search?q=, which does not exist and is disallowed in robots.txt [R01 A.4.2; R03; frontend/app/layout.tsx:205-209].
- **Requirement / acceptance criteria:**
  - potentialAction removed from the WebSite JSON-LD; Rich Results Test shows valid Organization and WebSite blocks
  - A /search results page is logged as a Q1 2027 candidate, not built now
- **Files likely touched:** `frontend/app/layout.tsx:205-209`
- **Growth impact:** Removes a structured-data defect Google can see on every page. **Dependencies:** none.

### D-007 — GA4 key events per the canonical event list
**P0 · M (12 h ESTIMATE) · Owner DEV · Target 2026-W43 (phase A, 6 h); 2027-W04 (phase B, 6 h) · Unlocks C03, C44, C56, C57, C58**
- **Problem.** FACT: GA4 receives only page_view plus eight onboarding events from lib/track.ts; there is no sign-up, newsletter, Discord, giveaway or library event, so no campaign has a conversion to count [R16 §0, §4; R01 A.2.7 F42].
- **Requirement / acceptance criteria:**
  - lib/track.ts FunnelEvent union extended with the spine §10 names (single registry; no inline gtag calls)
  - Phase A (S4): registration_start, registration_complete{method,from}, email_verified, newsletter_signup, newsletter_verified (server truth from NewsletterController::verify), library_connected{platform}, reminder_set, discord_click{campaign}, cta_click{cta_id}
  - Phase B (2027-W04): shelf_add, game_followed, comment_created, rating_created, list_created, giveaway_entered (first entry only, server-side), social_share, tool_run, share_card_generated, search_performed
  - Guest events go to GA4 only (the /track/event endpoint stays auth-only); events respect Consent Mode
  - EIC marks registration_complete, newsletter_verified and library_connected as key events in GA4 admin
- **Files likely touched:** `frontend/lib/track.ts`, `frontend/app/(auth)/register/RegisterClient.tsx`, `frontend/app/auth/callback/page.tsx`, `frontend/app/(auth)/verify-email/`, `frontend/components/editorial/SectionHub.tsx:180-186`, `frontend/components/gta6/Gta6NewsletterCTA.tsx:23-27`, `frontend/app/newsletter/verify/page.tsx`, `frontend/hooks/useReleaseReminder.ts`, `frontend/components/layout/Footer.tsx`, `backend/app/Http/Controllers/Api/V1/NewsletterController.php`, `backend/app/Http/Controllers/Api/V1/ConnectedAccountController.php`, `backend/app/Http/Controllers/Api/V1/TrackingController.php`
- **Growth impact:** Makes registrations, verified subscribers and activated members countable per campaign; gate for any paid spend (C56–C58). **Dependencies:** D-012 (newsletter form component).

### D-007b — member_actions table (the data under Weekly Returning Members)
**P1 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W45 (2–8 Nov) · Unlocks C03**
- **Problem.** FACT: meaningful actions are spread over many tables and several (reminder set, Analyzer run, Discord XP) leave no timestamped row, so WRM cannot be computed [16-ACTIVATION-RETENTION; R12 §4; R11 §6].
- **Requirement / acceptance criteria:**
  - member_actions (user_id, action, subject_type, subject_id, created_at) written at the points where QuestService::progress() already fires, plus the calendar reminder toggle, signed-in Analyzer runs (needs user_id on wow_analyses, D-040a) and at most one Discord XP row per user per day
  - Logins, page views, streak claims and giveaway daily visits excluded on purpose
  - Pruning policy and README §8 entry in the same commit
- **Files likely touched:** `backend/app/Services/QuestService.php`, `backend/app/Http/Controllers/Api/V1/CalendarController.php:242-266`, `backend/app/Http/Controllers/Api/V1/DiscordXpController.php`, `backend/database/migrations/ (new)`, `docs/README.md §8`
- **Growth impact:** Makes the North Star (WRM) and D1/D7/D30 on actions computable from 9 Nov. **Dependencies:** none.

### D-008 — First-party collector: UTM columns and a campaign breakdown
**P0 · M (10 h ESTIMATE) · Owner DEV · Target 2026-W44 (26 Oct–1 Nov) · Unlocks C03, C36, C47, C56, C57, C58**
- **Problem.** FACT: AnalyticsCollector keeps the path only and drops the query string, including utm_* and gclid, and keeps only the referrer host, so the one counter that sees consent-denied EEA traffic cannot tell a campaign from organic [R16 §0, §4.5, §4.1; backend/app/Services/AnalyticsCollector.php:131-157].
- **Requirement / acceptance criteria:**
  - Migration adds utm_source, utm_medium, utm_campaign, utm_content (nullable, lower-cased, length-capped) to analytics_events; docs/README.md §8 Baza updated in the same commit
  - Collector parses those four keys before the query string is dropped; nothing else from the query is stored
  - RollUpAnalytics gains a campaign dimension; the Filament Analytics page shows sessions by utm_campaign with is_bot = false
  - Test: a hit with ?utm_source=reddit&utm_campaign=c47-reddit-rep is stored and rolled up; a hit with other params stores none of them
- **Files likely touched:** `backend/app/Services/AnalyticsCollector.php:77-157`, `backend/app/Console/Commands/RollUpAnalytics.php`, `backend/app/Models/AnalyticsEvent.php`, `backend/app/Models/AnalyticsBreakdown.php`, `backend/database/migrations/ (new)`, `backend/app/Filament/Pages/ (Analytics page)`, `docs/README.md §8, §19`
- **Growth impact:** Campaign-level sessions for every UTM in the spine taxonomy, including EEA visitors GA cannot see; input to keep/kill decisions on 1 Jan 2027. **Dependencies:** none.

### D-009 — Campaign URL helper (one spelling for every UTM)
**P1 · S (4 h ESTIMATE) · Owner DEV · Target 2027-W12 (22–28 Mar) · Unlocks C03**
- **Problem.** FACT: nothing builds campaign links; the research warns that hand-written UTMs drift the way hand-written cache keys did [R16 §4.1, §5.11].
- **Requirement / acceptance criteria:**
  - Backend CampaignUrl::build(url, source, medium, campaign, content, term) enforces the spine §9 vocabulary (lower-case, hyphens, known sources/mediums)
  - Filament action 'Copy campaign link' on articles, giveaways and mail campaigns; campaign mail links are tagged utm_source=newsletter automatically
  - Unit test rejects an unknown medium and upper-case values
- **Files likely touched:** `backend/app/Support/CampaignUrl.php (new)`, `backend/app/Filament/Resources/NewsResource.php`, `backend/app/Filament/Resources/GiveawayResource.php`, `backend/app/Filament/Resources/MailCampaignResource.php`, `backend/app/Services/CampaignBody.php`
- **Growth impact:** Clean campaign data in D-008 without relying on a spreadsheet; lowers SC time per post. **Dependencies:** D-008.

### D-010 — Article-end CTA block, related module and contextual links
**P1 · M (14 h ESTIMATE) · Owner DEV · Target 2027-W05–W06 (1–14 Feb) · Unlocks C46, C40, C44**
- **Problem.** FACT: 0 contextual body links in six sampled articles; the end of an article offers Google preferred source, author box and 'Follow Us' but no newsletter and no game action; on phones three ad units sit between the body and the comments [R02 §4.2, §13.5-6; R01 A.6].
- **Requirement / acceptance criteria:**
  - One ArticleEndCta component under every article body, ordered: game action ('Add {game} to your shelf' when game_id is set) → newsletter one-liner → Discord (live API count or none)
  - Related module (4 items) by game_id first, then category; server-rendered
  - Editors get InternalLinkService suggestions in the editor (exists for staff) and the style guide asks for 3–5 contextual links
  - Ad-unit order on mobile is an EIC decision recorded in the PR; no ad unit is removed without it
- **Files likely touched:** `frontend/components/news/ArticleDetailView.tsx:333-378`, `frontend/components/news/JoinPrompt.tsx`, `frontend/components/news/RecommendedNews.tsx`, `backend/app/Services/InternalLinkService.php`, `backend/app/Http/Controllers/Api/V1/FeedController.php`
- **Growth impact:** Newsletter capture per 1,000 article views; shelf adds from articles; pages per session. **Dependencies:** D-012.

### D-011 — Bot: invite-code join attribution
**P1 · M (10 h ESTIMATE) · Owner DEV · Target 2027-W07 (15–21 Feb) · Unlocks C36, C03**
- **Problem.** FACT: the bot has no invite tracking; spine §9 asks for one invite code per campaign, and joins are only visible to the bot [R01 B.8.3; R16 §4.1; discord/src/index.ts:23-27 has no GuildInvites intent].
- **Requirement / acceptance criteria:**
  - GuildInvites intent added; invite uses cached on ready and on inviteCreate/inviteDelete; on GuildMemberAdd the code whose uses rose is posted to a new /discord/joins endpoint (discord.bot token)
  - discord_joins table (code, discord_user_id hash, joined_at); README §8 updated; Filament table of joins by code per week
  - Bot role has Manage Server (required to read invites); documented in docs/README.md
- **Files likely touched:** `discord/src/index.ts:21-28`, `discord/src/handlers/events.ts:76-106`, `discord/src/services/ApiService.ts`, `backend/routes/api.php (discord group, ~L169-204)`, `backend/app/Http/Controllers/Api/V1/ (new DiscordJoinController)`, `backend/database/migrations/ (new)`
- **Growth impact:** discord_join per campaign; the only way to rank campaigns by Discord growth. Until built, SC reads invite uses by hand in Server Settings → Invites. **Dependencies:** SC creates campaign invite codes.

### D-011a — Bot: welcome channel by ID and Buffy voice rewrite
**P1 · XS (2 h ESTIMATE) · Owner DEV · Target 2026-W51 (14–20 Dec) · Unlocks C35, C01**
- **Problem.** FACT: the welcome handler finds the channel by the exact name 'new-people', so a rename silently stops welcomes; Buffy's lines ('centuries of wisdom', 'young one') break the voice sheet; the hard-coded avatar URL 404ed [R13 §7; discord/src/handlers/events.ts:76-90; BuffyService.ts:21-116; 12-DISCORD §8.2].
- **Requirement / acceptance criteria:**
  - WELCOME_CHANNEL_ID env setting with the name as fallback; documented in discord/.env.example
  - Welcome, rank-up, daily, tip, DM and event lines replaced with the 12-DISCORD §8.2 copy; catalogue constant removed or made live (covers D-011l)
  - Avatar served from a working URL
- **Files likely touched:** `discord/src/handlers/events.ts:75-90`, `discord/src/services/BuffyService.ts:21-247`, `discord/src/config.ts`, `discord/.env.example`
- **Growth impact:** Onboarding in the only community channel reads like the brand (Discord new-member activation). **Dependencies:** SC supplies final lines from 12-DISCORD.

### D-012 — Newsletter landing /newsletter, homepage block and article capture
**P0 · S (7 h ESTIMATE) · Owner DEV · Target 2026-W40 (landing + homepage, 4 h) and 2026-W41 (shared form + signup_source, 3 h) · Unlocks C40, C42, C46**
- **Problem.** FACT: /newsletter returns 404; capture exists only in section-hub sidebars, the GTA 6 hub and Frontiers; the homepage has none although the unsubscribe page links to /#newsletter, an anchor that does not exist; subscribe posts carry no source [R01 A.3.2, A.7; R20 §3].
- **Requirement / acceptance criteria:**
  - New /newsletter page: what The Save File is, the send day (Friday), a sample of the last issue (link to web archive when C40 has one), form, privacy line; indexable; added to sitemap-pages
  - Shared NewsletterForm component used on /newsletter, homepage (section id="newsletter"), article end and existing sidebars
  - POST /newsletter/subscribe accepts an optional signup_source (validated slug, e.g. home, article, gta6, hub-switch-2, newsletter-page); migration adds the column; CampaignAudience can filter by it so a GTA briefing can go to gta6 sign-ups only (placement half of D-012a); README §8 and §20 updated
  - No subscriber count is displayed anywhere
  - Double opt-in unchanged; no DNS or SMTP change
- **Files likely touched:** `frontend/app/newsletter/page.tsx (new)`, `frontend/components/newsletter/NewsletterForm.tsx (new)`, `frontend/app/HomeClient.tsx`, `frontend/components/editorial/SectionHub.tsx:620-640`, `frontend/app/newsletter/unsubscribed/page.tsx:46`, `backend/app/Http/Controllers/Api/V1/NewsletterController.php:16-40`, `backend/app/Models/NewsletterSubscriber.php`, `backend/app/Http/Controllers/SitemapController.php:142-232`, `docs/README.md §8, §20`
- **Growth impact:** Verified newsletter subscribers (input metric) with a source per sign-up; needed for the first Save File on Fri 2 Oct. **Dependencies:** EIC/SC copy for the landing page.

### D-013 — Welcome sequence and mail channel for reminders and the digest
**P1 · M (16 h ESTIMATE) · Owner DEV · Target 2026-W45 (2–8 Nov) · Unlocks C42, C43, C41**
- **Problem.** FACT: 20 of 22 notification classes are database-only, including release reminders, wishlist notices and the Friday digest; there is no welcome mail; two reminder paths can notify the same person twice on release day [R01 B.2.10-2.12, B.12 #11; R12 §1; README §20].
- **Requirement / acceptance criteria:**
  - Welcome sequence: 3 mails to newsletter_verified subscribers (day 0 welcome + what to expect, day 3 'tell us your platforms', day 7 'link your library'), words editable as MailTemplate rows, suppression via MailSuppression::filter(), paced like campaigns
  - Release-day reminder and wishlist 'out today / in 3 days' notices gain a mail channel only for verified members who opt in (settings.notifications), deduplicated across SendReleaseReminders and wishlist:check-releases
  - WeeklyDigestNotification gains an opt-in mail channel (default off); unsubscribe in every mail; no preheader hidden text
  - Tests: MailDeskTest-style coverage for suppression, dedupe and opt-out; README §20 table of mails updated from five to the new count
  - EIC approval recorded before first send because volume from our own server rises; no DNS/SMTP/SPF/DKIM change
- **Files likely touched:** `backend/app/Notifications/GameReleaseNotification.php`, `backend/app/Notifications/WishlistGameReleasingNotification.php`, `backend/app/Notifications/WishlistGameReleasingSoonNotification.php`, `backend/app/Notifications/WeeklyDigestNotification.php:38-41`, `backend/app/Jobs/SendReleaseReminders.php`, `backend/app/Console/Commands/CheckWishlistReleases.php`, `backend/app/Console/Commands/SendWeeklyDigest.php`, `backend/app/Models/MailTemplate.php`, `backend/database/seeders/MailTemplateSeeder.php`, `frontend/app/settings/SettingsClient.tsx:657-716`, `docs/README.md §20`
- **Growth impact:** Turns built loops into returns: alert→visit rate, reminder_delivered, WRM. Welcome mail lifts A2 activation (link a library). **Dependencies:** D-012; D-054 (complaint visibility before volume grows); EIC deliverability sign-off.

### D-014 — Register page rewrite: social-first, true copy, honour redirect
**P1 · S (7 h ESTIMATE) · Owner DEV · Target 2026-W43 (19–25 Oct) · Unlocks C44**
- **Problem.** FACT: the register pitch sells XP/forum/giveaways and not the library; Google/Discord/Battle.net sit below a four-field form with Turnstile and five password rules; ?redirect=back from comments is ignored [R11 §1.2-1.3, §4 rows 1-2, 18, 25].
- **Requirement / acceptance criteria:**
  - Left panel reuses the homepage mechanisms (one library, hours counted, taste, match) with no numbers except the API catalogue figure
  - Google, Discord and Battle.net buttons above the form; form under 'or with email'
  - /register reads ?from= (ignored today) and ?redirect=; both survive email registration, verify-email and the OAuth round trip (state); from is stored on the new user row (signup_source column, README §8) and sent with registration_complete; comment sign-ups return to the comment box
  - /verify-email explains what works before verification and what verification unlocks; page is noindex
  - registration_start/registration_complete fire with method and from (D-007)
- **Files likely touched:** `frontend/app/(auth)/register/RegisterClient.tsx:186-495`, `frontend/app/(auth)/login/LoginClient.tsx`, `frontend/app/(auth)/verify-email/`, `frontend/components/auth/SignInWall.tsx`, `frontend/components/comments/CommentsSection.tsx:267-279`, `backend/app/Http/Controllers/Api/V1/SocialAuthController.php`
- **Growth impact:** Registration completion rate and share of social sign-ups (fewer inbox-dependent accounts). **Dependencies:** D-001; D-007.

### D-015 — Steam OpenID sign-in
**P1 · M (14 h ESTIMATE) · Owner DEV · Target 2027-W01 (4–10 Jan) · Unlocks C44, C68**
- **Problem.** FACT: Steam is a connect method only; Valve's OpenID docs allow the SteamID as login; 2 of 55 members had linked a platform [R11 §5; R01 exec 2].
- **Requirement / acceptance criteria:**
  - /auth/steam/redirect and /callback create or log in an account from the SteamID64 (reusing the connect flow's OpenID validation) and queue SyncSteamLibrary
  - Steam-only accounts are 'activated but unreachable': full shelf use; email requested when a reminder or newsletter action needs it; comments, giveaways and redemptions still need a verified email
  - Official 'Sign in through Steam' button per Valve's guidelines on /register and /login
  - Security review of the state/nonce handling; feature tests for new user, returning user, link-intent
- **Files likely touched:** `backend/app/Http/Controllers/Api/V1/SocialAuthController.php`, `backend/app/Http/Controllers/Api/V1/ConnectedAccountController.php (Steam OpenID)`, `backend/app/Services/SteamService.php`, `backend/routes/api.php:121-162`, `frontend/app/(auth)/register/RegisterClient.tsx`, `frontend/app/(auth)/login/LoginClient.tsx`, `frontend/app/auth/callback/page.tsx`
- **Growth impact:** A2 activation (library linked) at sign-up; the headline promise 'one library' becomes one click. **Dependencies:** D-014.

### D-016 — Guest 'Remind me' and 'Track' open a sign-up modal that returns to the page
**P1 · M (12 h ESTIMATE) · Owner DEV · Target 2026-W51 (lite, 8 h); 2027-W03 (rest, 4 h) · Unlocks C45, C08, C44**
- **Problem.** FACT: guest clicks on Track, Rate, 'Remind me on release day' and calendar wishlist send people to /login or show 'Sign in to track releases.'; nothing brings them back to the game they were on [R01 A.3.1; R11 §4 rows 3, 5, 6].
- **Requirement / acceptance criteria:**
  - AuthModal (Google, Discord, email; Steam once D-015 ships) opens from TrackGameButton, ReleaseClient, CalendarClient and GameRating for guests
  - The pending action (game slug + action) is stored and replayed after sign-up or login, then the user lands back on the same URL
  - Lite version (S12): modal + replay for 'Remind me' and 'Track'; full version (2027-W03): rating and list actions
  - reminder_set and registration_complete{from=game|calendar|gta6} fire
- **Files likely touched:** `frontend/components/games/TrackGameButton.tsx:101-129`, `frontend/app/calendar/[slug]/ReleaseClient.tsx:97-123`, `frontend/app/calendar/CalendarClient.tsx:140,349,626`, `frontend/components/games/GameRating.tsx:300-381`, `frontend/hooks/useReleaseReminder.ts`, `frontend/components/auth/AuthModal.tsx (new)`, `frontend/context/AuthContext.tsx`
- **Growth impact:** Registrations from game, calendar and GTA 6 pages; reminders set per session. **Dependencies:** D-014.

### D-017 — GTA 6 hub: server-rendered counters and H1, cross-links, PC status, OG ≤300 KB
**P0 · S (6 h ESTIMATE) · Owner DEV · Target 2026-W41 (page, 4 h) and 2026-W42 (OG images, 2 h) · Unlocks C06, C07, C10, C02**
- **Problem.** FACT: the hub serves 296 words of crawlable text, an empty H1 and hero counters that read 0 until JavaScript runs; it links neither /games/grand-theft-auto-vi nor the calendar; the pre-order block says 'PC — Coming Soon' while Everything We Know says PC is not confirmed; six OG PNGs weigh 1.9–2.1 MB [R17 §1; R02 §4.4, §13.13, §13.15; public/gta6/og-*.png].
- **Requirement / acceptance criteria:**
  - Server HTML of /gta6 contains a non-empty H1, the real location/character/vehicle counts and days-to-launch computed at render time (client animation may run after)
  - Hub links to /games/grand-theft-auto-vi, /calendar (November 2026), /gta6/everything-we-know and /gta6/release-time (when D-018 ships); the game page links back to /gta6
  - Gta6PreOrder PC row reads 'Not announced' and carries no link; a disclosure line sits under the retailer buttons
  - og-*.png replaced by 1200×630 JPG/WebP ≤300 KB (DS supplies) and metadata updated; homepage server HTML links /gta6
- **Files likely touched:** `frontend/app/gta6/page.tsx:14-118`, `frontend/components/gta6/Gta6HubHero.tsx:46-55`, `frontend/components/gta6/Gta6HypeBar.tsx:18-60`, `frontend/components/gta6/Gta6PreOrder.tsx:4-8,45-49`, `frontend/public/gta6/og-*.png`, `frontend/app/games/[slug]/page.tsx`, `frontend/app/HomeClient.tsx`
- **Growth impact:** The Q4 landing page stops showing zeros to crawlers and visitors; organic clicks and newsletter_signup from /gta6 during C06–C10. **Dependencies:** DS OG images.

### D-018 — /gta6/release-time tool with reminder
**P1 · M (10 h ESTIMATE) · Owner DEV · Target 2026-W42 (12–18 Oct) · Unlocks C08, C10**
- **Problem.** FACT: none of the observed GTA 6 countdown sites pairs the timer with an account reminder; 'gta 6 release time', 'pre load time' and 'file size' are High-priority queries with no incumbent observed [R17 §3 rows 2, 25-26, §7.1; R10 idea 12-13].
- **Requirement / acceptance criteria:**
  - New /gta6/release-time page: unlock time by time zone computed from one admin-editable UTC value; while Rockstar has not announced it, the page says so and shows only the date (19 Nov 2026, PS5 and Xbox Series X|S)
  - Pre-load date and file size fields shown only when set by an editor, each with a source link
  - 'Remind me' sets the GTA VI release reminder (guests go to login until D-016 lite ships)
  - Server-rendered text, FAQPage JSON-LD for the confirmed facts only, OG ≤300 KB, in sitemap-pages
  - tool_run{tool=release-time} and reminder_set fire
- **Files likely touched:** `frontend/app/gta6/release-time/page.tsx (new)`, `frontend/components/gta6/Gta6Countdown.tsx`, `backend/app/Filament/Pages/Settings.php (gta6_unlock_utc, gta6_preload_at, gta6_file_size settings)`, `backend/app/Http/Controllers/SitemapController.php:142-232`, `frontend/hooks/useReleaseReminder.ts`
- **Growth impact:** reminder_set on GTA VI (the launch-week return loop) and organic clicks on launch-time queries. **Dependencies:** D-017.

### D-019 — Web push for reminders (opt-in at 'Remind me')
**P2 · M (16 h ESTIMATE) · Owner DEV · Target 2027-W12–W13 (only if the 1 Jan 2027 decision is go) · Unlocks C59**
- **Problem.** FACT: no service worker, no PushManager, no permission prompt; the manifest exists; Chrome quietens prompts on sites with low acceptance and iOS allows push only for Home Screen apps [R01 A.7; R07 via RESEARCH-COMPLETE #25].
- **Requirement / acceptance criteria:**
  - Service worker + VAPID keys (new env secrets, not DNS); push_subscriptions table; README §8 and §11 updated
  - Permission is asked only after a user sets a reminder, never on page load
  - Release-day reminder delivered by push with a per-game opt-out; notification_enabled and reminder_delivered{channel=push} fire
- **Files likely touched:** `frontend/public/sw.js (new)`, `frontend/public/manifest.json`, `frontend/hooks/useReleaseReminder.ts`, `backend/app/Notifications/GameReleaseNotification.php`, `backend/composer.json (web-push channel package)`, `backend/database/migrations/ (new)`
- **Growth impact:** A third delivery channel for reminders; value depends on acceptance rate, which is unknown. **Dependencies:** D-013; D-016.

### D-020 — GTA 6 map data provenance check (gtadb)
**P0 · S (1 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C11, C10, C48**
- **Problem.** FACT: GtaLocation rows carry gtadb_key ids, apparently from map.gtadb.org; 211 of 1,058 are flagged unconfirmed; the map cannot be presented as TechPlay's dataset without permission or attribution [spine §0; R17 §6; R01 B.6].
- **Requirement / acceptance criteria:**
  - DEV exports a provenance summary: source of backend/database/data/gta6_landmarks.json (read by Gta6LocationsSeeder), count with gtadb_key, count unconfirmed
  - EIC sends the permission/attribution request (text in 33-QUICK-WINS) and records the answer
  - Outcome decides D-056: yes/attribution → build tracker with visible credit; no answer by 16 Oct → tracker is built on confirmed locations only with credit line; refusal → D-056 is replaced by D-021 + D-023 in S7
- **Files likely touched:** `backend/database/seeders/Gta6LocationsSeeder.php`, `backend/database/data/gta6_landmarks.json`, `backend/app/Models/GtaLocation.php`, `frontend/app/gta6/map/`
- **Growth impact:** Legal precondition for C11 and for any PR that presents the map as a dataset. **Dependencies:** EIC outreach.

### D-021 — Tighten Game::indexable() and noindex the long tail
**P1 · M (12 h ESTIMATE) · Owner DEV · Target 2027-W02 (11–17 Jan) · Unlocks C60, C61, C62, C63**
- **Problem.** FACT: 99.8% of indexable URLs are database pages; 1,967 of 295,024 game pages carry anything TechPlay wrote; Googlebot fetches about 77 game pages a day; the rule today is only 'description longer than 50 characters' [R03 §9; R01 B.5; R23 B9].
- **Requirement / acceptance criteria:**
  - EIC decision recorded (option 1+2+4 of R03 §9 recommended): indexable only with an original signal — linked TechPlay article, reader rating, shelf count ≥ N, or editor-written block
  - Game::indexable(), the partial index and the frontend noindex rule change together; sitemap:generate emits only indexable games; noindexed pages stay live and crawlable (follow)
  - Before/after counts written to docs/README.md §12 in the same commit; rollout staged (1 night) and watched in Search Console for 14 days
  - No public route is removed (CLAUDE.md: do not break public routes)
- **Files likely touched:** `backend/app/Models/Game.php:139-171`, `backend/database/migrations/ (partial index)`, `backend/app/Console/Commands/GenerateSitemap.php`, `frontend/app/games/[slug]/page.tsx (robots)`, `docs/README.md §12`
- **Growth impact:** Crawl budget moves to pages that can rank; the structural precondition for organic recovery (organic clicks). **Dependencies:** EIC decision by 18 Dec 2026; Search Console access.

### D-022 — Stop game pages appearing as Google News items
**P1 · S (3 h ESTIMATE) · Owner DEV · Target 2026-W51 (14–20 Dec) · Unlocks C02**
- **Problem.** FACT: Google News returned 99 game-database pages and 1 article for site:techplay.gg, dated by the game's release year; the game page JSON-LD emits VideoGame.datePublished = released [R02 §8.3; R03; frontend/app/games/[slug]/page.tsx:1113].
- **Requirement / acceptance criteria:**
  - datePublished removed from the VideoGame JSON-LD on game and calendar pages (release date stays visible on the page)
  - EIC adds 'User-agent: Googlebot-News / Disallow: /games/' through the robots.txt setting in Filament Settings
  - sitemap-news.xml contains articles only (verified)
- **Files likely touched:** `frontend/app/games/[slug]/page.tsx:1105-1120`, `frontend/app/calendar/[slug]/page.tsx`, `backend/app/Filament/Pages/Settings.php (robots.txt field)`, `backend/app/Observers/ArticleObserver.php (regenerateNewsSitemap, read only)`
- **Growth impact:** Google News surface shows TechPlay's journalism instead of catalogue rows (News clicks). **Dependencies:** none.

### D-023 — Game pages link their genres, platforms and tags to facet hubs
**P1 · S (5 h ESTIMATE) · Owner DEV · Target 2027-W02 (11–17 Jan) · Unlocks C61, C62, C63**
- **Problem.** FACT: the Tags panel renders up to 24 plain spans and genre/platform names are unlinked, so 332k game pages pass nothing to the indexable /games/tag, /games/genre and /games/platform hubs [R01 A.4.8, A.4.9 #13; frontend/app/games/[slug]/page.tsx:1656-1666].
- **Requirement / acceptance criteria:**
  - Genres and platforms link to their hubs; tags link only when the tag hub is indexable (lib/gameFacets.ts allow-list), otherwise stay text
  - No link to a noindexed facet; server-rendered
- **Files likely touched:** `frontend/app/games/[slug]/page.tsx:1656-1666`, `frontend/lib/gameFacets.ts:50-60`
- **Growth impact:** Internal links into the hub pages that sitemap-hub asks Google to rank (organic clicks on facets). **Dependencies:** D-021 (ship together).

### D-024 — Gamer DNA share card (OG image)
**P2 · S (6 h ESTIMATE) · Owner DEV · Target 2027-W12 (22–28 Mar) · Unlocks C28, C68**
- **Problem.** FACT: Gamer DNA is computed for every profile but has no share image; the only card is the generic /og/profile [R10 §1, idea 2; R01 B.10].
- **Requirement / acceptance criteria:**
  - /og/dna?username= edge route (same pattern as /og/profile), 1200×630, public profiles only, 404 for private
  - ShareCard offers the DNA card; share_card_generated{type=dna} fires
- **Files likely touched:** `frontend/app/og/dna/route.tsx (new)`, `frontend/app/og/profile/route.tsx (pattern)`, `frontend/components/profile/ShareCard.tsx`, `frontend/lib/ogCovers.ts`
- **Growth impact:** Share-driven sign-ups from profiles; reuses the D-025 card work. **Dependencies:** D-025.

### D-025 — Your 2026 in Games (cross-platform year in review)
**P1 · L (32 h ESTIMATE) · Owner DEV · Target 2026-W49–W50 (30 Nov–13 Dec) · Unlocks C28**
- **Problem.** FACT: Steam, Xbox and PlayStation each publish a single-platform year in review; a cross-platform one is unclaimed; TechPlay holds five-platform libraries; menu-wrapped.webp art exists but no route [R10 idea 1; R12 §2; R01 A.8].
- **Requirement / acceptance criteria:**
  - /year-in-review (members) and /year-in-review/{username} (public profiles only) built from existing tables: games added, finished, dropped and rated in 2026; top genres; platforms linked; achievements unlocked in 2026 where dated; top games by lifetime hours clearly labelled 'lifetime' (2026-only hours do not exist before D-059)
  - Share card /og/year?username= 1200×630; social_share and share_card_generated fire
  - Empty or thin libraries get an honest short version plus 'link a platform' CTA
  - Load-tested on the largest library; cached per user via CacheService keys, never hand-written
  - Live 14 Dec, linked from profile, newsletter and Discord; README §6 documents the route
- **Files likely touched:** `backend/app/Services/YearInReviewService.php (new)`, `backend/app/Http/Controllers/Api/V1/ (new YearInReviewController, ApiResponse trait)`, `backend/routes/api.php (public profile group ~L613-627)`, `backend/app/Services/CacheService.php`, `frontend/app/year-in-review/page.tsx (new)`, `frontend/app/year-in-review/[username]/page.tsx (new)`, `frontend/app/og/year/route.tsx (new)`, `frontend/public/images/menu/menu-wrapped.webp`
- **Growth impact:** December share loop into registrations (from=year-in-review) and WRM; the one viral artefact only a five-platform library can make. **Dependencies:** D-007 (share events).

### D-026 — Prediction league and awards polls
**P2 · M (14 h ESTIMATE) · Owner DEV · Target decide 1 Jan 2027 (TGA 2027) · Unlocks C29, C30**
- **Problem.** FACT: no scoring for predictions exists; forum polls exist (one per thread) and Discord has native polls; The Game Awards is 10 Dec [R13 ritual 6-7; R10 idea 38; backend/app/Models/Poll.php].
- **Requirement / acceptance criteria:**
  - Categories and nominees entered by staff; one pick per category per member; picks lock at a set time; scoring after the show; leaderboard page
  - 2026 fallback without this item: C29 runs on one forum poll per category + Discord polls, scored by SC in a sheet
- **Files likely touched:** `backend/app/Models/Poll.php`, `backend/app/Http/Controllers/Api/V1/PollController.php`, `backend/database/migrations/ (new predictions tables)`, `frontend/app/awards/2026/page.tsx (new)`
- **Growth impact:** Community participation and registrations around TGA; low evidence of acquisition value at 160 Discord members. **Dependencies:** none.

### D-027 — Wishlist price-drop alerts
**P1 · M (12 h ESTIMATE) · Owner DEV · Target 2026-W48 (23–29 Nov) · Unlocks C31, C32, C34**
- **Problem.** FACT: RefreshShelfPrices prices only games members own (Steam US, 1,017 games); wishlisted games are not priced, no price history is kept, and nothing alerts on a drop [R01 B.2.15; R12 §3; R10 idea 6].
- **Requirement / acceptance criteria:**
  - Nightly job also prices wishlisted games that have a Steam appid; a minimal price history table keeps the previous final price (README §8)
  - A drop of ≥ the member's threshold (default 20%) or to a historical low creates a notification: bell always, mail if opted in (D-013 channel)
  - No affiliate link without a visible disclosure line; US prices labelled as US
  - Test for threshold, dedupe (one alert per game per sale) and suppression
- **Files likely touched:** `backend/app/Jobs/RefreshShelfPrices.php`, `backend/app/Services/SteamPriceService.php:9-28`, `backend/app/Models/GamePrice.php`, `backend/app/Notifications/ (new PriceDropNotification)`, `backend/routes/console.php:171-182`, `docs/README.md §8, §10`
- **Growth impact:** Alert→visit rate during Black Friday and the Steam Winter Sale; a reason to keep a wishlist on TechPlay (retention, WRM). **Dependencies:** D-013.

### D-028 — 'Your releases this week' personalised email
**P1 · M (10 h ESTIMATE) · Owner DEV · Target 2026-W47 (16–22 Nov) · Unlocks C41**
- **Problem.** FACT: SendWeeklyDigest already assembles each member's wishlist releases and shelf news every Friday, but only for the bell; no newsletter can send 'your releases' except one built on shelves [R01 B.2.11; R20 §2].
- **Requirement / acceptance criteria:**
  - Monday job sends to opted-in verified members with ≥1 wishlisted or reminded game releasing Mon–Sun; skips empty mails
  - Content: game, platforms, date, pre-load if known, link to the game page with utm_source=email&utm_campaign=c41-your-releases-<yyyyww>
  - Paced sending, suppression filter, unsubscribe link untracked; open rate never reported without click rate
- **Files likely touched:** `backend/app/Console/Commands/SendWeeklyDigest.php:34-93`, `backend/app/Services/NewsletterAudience.php`, `backend/app/Services/CampaignAudience.php`, `backend/app/Models/MailTemplate.php`, `backend/routes/console.php:258`
- **Growth impact:** Monday return visits from members (WRM), reminder_delivered{channel=email}. **Dependencies:** D-013; D-054.

### D-029 — Hide zero-value modules for guests
**P0 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W42 (12–18 Oct) · Unlocks C01**
- **Problem.** FACT: anonymous visitors see '0 Online 0 Threads 0 Members', 'Nobody has moved yet this week', 'No draws have been settled yet', 'Most wishlisted — No wishlists yet', '0 votes so far' and empty Hidden Gems/On This Day rails [R02 §6.1, §11.14, §13.7].
- **Requirement / acceptance criteria:**
  - Each listed module renders nothing (or a useful alternative) when its live value is zero or unhydrated in server HTML
  - No placeholder dash or zero is visible to a signed-out visitor on /, /forum, /leaderboard, /giveaways, /last-disc
  - GTA 6 counters handled in D-017
- **Files likely touched:** `frontend/components/forum/ForumSidebar.tsx`, `frontend/app/leaderboard/LeaderboardClient.tsx`, `frontend/app/giveaways/GiveawayHub.tsx`, `frontend/app/last-disc/LastDiscClient.tsx`, `frontend/app/HomeClient.tsx`
- **Growth impact:** First impression for every new visitor from campaigns; removes signals of an empty site (registration rate). **Dependencies:** none.

### D-030 — Unify author URLs and fix the doubled brand in author titles
**P2 · XS (2 h ESTIMATE) · Owner DEV · Target 2027-W06 (8–14 Feb) · Unlocks C01, C52, C53**
- **Problem.** FACT: two author URL schemes (/author/adi and /author/adi-zeljkovic) split the Person entity in JSON-LD; author titles read 'Articles by X - TechPlay | TechPlay' [R02 §11.6; R01 A.4.1, A.4.9 #10].
- **Requirement / acceptance criteria:**
  - One canonical author URL per person; old URLs 301 via the admin redirect map (compiled on next deploy)
  - Review and guide JSON-LD use the canonical author URL
  - Author <title> has the brand once
- **Files likely touched:** `frontend/app/author/[slug]/page.tsx:39`, `frontend/app/reviews/[slug]/page.tsx`, `frontend/app/guides/[slug]/page.tsx`, `backend/app/Filament/Resources/Redirects/`
- **Growth impact:** Author authority for reviews (Verdict restart, OpenCritic application). **Dependencies:** none.

### D-031 — Meta Pixel + Conversions API behind consent
**P2 · M (14 h ESTIMATE) · Owner DEV · Target 2027-W10 (only if paid scale is approved on 1 Jan 2027); November 2026 retargeting dropped · Unlocks C57**
- **Problem.** FACT: no ad pixel is installed (grep fbq: 0); CSP already allows connect.facebook.net; EEA/UK/CH consent is denied by default until the Google CMP grants it [R16 §0, §4.3; R01 A.8].
- **Requirement / acceptance criteria:**
  - Pixel initialises only after consent in denied regions (fbq('consent','revoke') before init) and never fires for 'denied'
  - CAPI job sends registration_complete and newsletter_verified with hashed email and a shared event_id for dedupe
  - Cookie policy already names Meta Pixel; EIC confirms wording; access token stored as env secret
- **Files likely touched:** `frontend/app/layout.tsx`, `frontend/components/analytics/ConsentAwareAnalytics.tsx`, `frontend/next.config.ts (CSP)`, `backend/app/Jobs/ (new SendMetaConversion)`, `backend/config/services.php`
- **Growth impact:** Required before any Meta registration test; without it C57 cannot optimise or report. **Dependencies:** D-007; EIC paid decision 1 Jan 2027.

### D-032 — Platform hub template: /switch-2, /steam, /mmo (and /guides/pc-fixes)
**P2 · M (18 h ESTIMATE) · Owner DEV · Target 2027-W03–W04 (18–31 Jan) · Unlocks C61, C62, C15, C60**
- **Problem.** FACT: platform hubs score with GTA VI on the raw total (Switch 2 38, Steam/PC 38) and the WoW/MMO hub ranks first when tools and competition are weighted; no hub route exists except /gta6 [R18 ranked table, adjusted ranking, blueprints 1, 3, 4].
- **Requirement / acceptance criteria:**
  - One server-rendered hub template fed by existing APIs (platform facet, calendar filtered by platform, articles by tag/game, tools) plus an editor-written intro and FAQ
  - Four configs: /switch-2, /steam (sales, Next Fest, movers), /mmo (WoW Analyzer, patch calendar, FFXIV, GW2), /guides/pc-fixes
  - Each hub links to its /games/platform/* facet and back; in sitemap-pages; OG image per hub
  - Interim until shipped: each hub launches as an ED pillar article that the hub later absorbs (canonical moves by 301)
- **Files likely touched:** `frontend/app/switch-2/page.tsx (new)`, `frontend/app/steam/page.tsx (new)`, `frontend/app/mmo/page.tsx (new)`, `frontend/app/guides/pc-fixes/page.tsx (new)`, `frontend/components/hubs/PlatformHub.tsx (new)`, `backend/app/Http/Controllers/Api/V1/GameHubController.php`, `backend/app/Http/Controllers/SitemapController.php:142-232`
- **Growth impact:** SEO scale on durable platform queries; the 2027 Q1 launches (Metroid 28 Jan, Next Fest 22 Feb) land on these hubs. **Dependencies:** D-057 (editor intro field).

### D-033 — Release-date change log (game_release_changes)
**P1 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W43 (19–25 Oct) · Unlocks C23, C27**
- **Problem.** FACT: releases:sync rewrites a game's date in place (StoreSync forceFill()->save()) and keeps no history, so slip statistics are impossible until a log exists; R14 lists 'Slip Rate' and 'GTA 6 Shadow' as needing this log [R14 §3 #3, §4 point 4; backend/app/Services/Releases/StoreSync.php:180-197].
- **Requirement / acceptance criteria:**
  - Migration: game_release_changes (game_id, old_released, new_released, old_precision, new_precision, source store, detected_at); README §8 Baza updated in the same commit
  - Written in StoreSync where the date changes (knows the store) and in GameObserver::updated for admin edits (source='admin'); merges log source='merge'
  - No backfill claimed: the log starts on the deploy date and every publication states that start date
  - Test: a sync that moves a date writes one row; an unchanged sync writes none
- **Files likely touched:** `backend/app/Services/Releases/StoreSync.php:180-197`, `backend/app/Services/Releases/GameMerger.php:227-248`, `backend/app/Observers/GameObserver.php`, `backend/database/migrations/ (new)`, `docs/README.md §8`
- **Growth impact:** Starts the only dataset that cannot be recreated later; by 12 Jan 2027 it gives a Q4 n for State of the Catalogue and by late 2027 a full-year Slip Rate PR (backlinks). **Dependencies:** none.

### D-034 — Tombstone reason column
**P3 · S (3 h ESTIMATE) · Owner DEV · Target 2027-W08 (22–28 Feb) · Unlocks C27**
- **Problem.** FACT: 61,034 game_tombstones mix merged duplicates from the 08/2026 rebuild with purges and delistings, so 'games that vanished' would be a false number without a reason field [R14 §3 #12, §4 point 3].
- **Requirement / acceptance criteria:**
  - Migration adds reason (merged|purged-adult|purged-clutter|delisted|other); GameObserver::deleted and the purge commands pass it; README §8 updated
  - Backfill only where the source is certain; the rest stays 'unknown' and is excluded from PR numbers
- **Files likely touched:** `backend/app/Observers/GameObserver.php`, `backend/app/Console/Commands/PurgeAdultGames.php`, `backend/app/Console/Commands/PurgeClutterGames.php`, `backend/app/Services/Releases/GameMerger.php`, `backend/database/migrations/ (new)`
- **Growth impact:** Makes 'The Vanished Catalogue' data story publishable (backlinks) in 2027. **Dependencies:** none.

### D-035 — Route Discord /daily through XpService and the streak
**P2 · S (4 h ESTIMATE) · Owner DEV · Target 2027-W12 (22–28 Mar) · Unlocks C67, C36**
- **Problem.** FACT: DiscordDailyController pays 50 + min(streak×5, 50) XP straight into users.xp, bypassing the daily cap, season multiplier, Bounty and ledger, and consumes the site's daily claim [R01 B.2.7; DiscordDailyController.php:60-76].
- **Requirement / acceptance criteria:**
  - EIC decides the reward size; /daily awards through XpService::awardXp and StreakService so caps, ledger and season rules apply
  - Bot reply text updated; test covers cap and shared streak
- **Files likely touched:** `backend/app/Http/Controllers/Api/V1/DiscordDailyController.php:60-76`, `backend/app/Services/XpService.php`, `backend/app/Services/StreakService.php`, `discord/src/handlers/commands.ts`
- **Growth impact:** Fair leaderboards for Season 2 and Discord referral roles (community trust). **Dependencies:** EIC reward decision.

### D-036 — ICS calendar export (public feed + private wishlist feed)
**P2 · S (5 h ESTIMATE) · Owner DEV · Target 2027-W08 (22–28 Feb) · Unlocks C33, C04**
- **Problem.** FACT: the calendar has no export; reminders stay on the site [R10 idea 8; R01 exec map].
- **Requirement / acceptance criteria:**
  - /calendar.ics?platform= for notable releases; per-user tokenised feed of wishlist and reminders (token column, revocable in settings; README §8)
  - Links from /calendar and the release pages
- **Files likely touched:** `backend/app/Http/Controllers/Api/V1/CalendarController.php`, `backend/routes/api.php (calendar group ~L676-706)`, `frontend/app/calendar/CalendarClient.tsx`
- **Growth impact:** Sticky return path for S1 Release Planners; low build cost. **Dependencies:** none.

### D-037 — Public Backlog Advisor / Steam library calculator (guest mode)
**P2 · M (16 h ESTIMATE) · Owner DEV · Target 2027-W11 (15–21 Mar) · Unlocks C44**
- **Problem.** FACT: Backlog Advisor is behind a sign-in wall and nothing is indexable for guests; HowLongToBeat's public Steam calculator is the proven pattern [R10 §3, idea 4, 19].
- **Requirement / acceptance criteria:**
  - Guest enters a public Steam profile; the server reads owned games once (Steam Web API), shows backlog stats and three picks via GameRecommendationService without storing the library
  - Rate-limited; 'Import it for real' CTA leads to Steam sign-in (D-015); tool_run{tool=backlog} fires
- **Files likely touched:** `frontend/app/backlog-advisor/AdvisorClient.tsx:258,465`, `backend/app/Http/Controllers/Api/V1/BacklogAdvisorController.php`, `backend/app/Services/GameRecommendationService.php`, `backend/app/Services/SteamService.php`
- **Growth impact:** Indexable tool for 'what game should I play next' and a registration path (tool_run → registration_complete). **Dependencies:** D-015.

### D-038 — /about/ownership and /press pages
**P1 · S (5 h ESTIMATE) · Owner DEV · Target 2026-W51 (14–20 Dec) · Unlocks C54, C53, C20**
- **Problem.** FACT: ownership sits only in the Impressum (Luminor Solutions, Sarajevo); there is no press page and no AI-use statement; SEO meta on About contradicts its own copy [R02 §6.2; RESEARCH-COMPLETE opp. 22; R21 PART-03].
- **Requirement / acceptance criteria:**
  - /about/ownership: owner, funding (ads, no investors unless stated by EIC), editorial independence, AI-use policy — text by EIC
  - /press: what TechPlay is, live numbers from the API only (games, studios, published pieces), contact, logo files, dataset links
  - Both in sitemap-pages with Organization JSON-LD; interim from 9 Oct: EIC publishes the ownership text as an article linked from /about
- **Files likely touched:** `frontend/app/about/ownership/page.tsx (new)`, `frontend/app/press/page.tsx (new)`, `frontend/app/about/page.tsx`, `backend/app/Http/Controllers/SitemapController.php:142-232`
- **Growth impact:** Trust for PR pitches, partners and OpenCritic; press-page links from data stories. **Dependencies:** EIC copy.

### D-039 — Giveaway hub indexable while a giveaway is live; canonical on giveaway pages
**P1 · XS (2 h ESTIMATE) · Owner DEV · Target 2026-W41 (only if the GTA 6 giveaway is live on 28 Sep) · Unlocks C09**
- **Problem.** FACT: /giveaways is noindex,nofollow even when a giveaway runs; /giveaway/[slug] emits no canonical [R01 A.1.4, A.4.4; frontend/app/giveaways/page.tsx:10].
- **Requirement / acceptance criteria:**
  - Hub robots = index,follow only while ≥1 public giveaway is active (server fetch of hub stats), otherwise noindex
  - Every /giveaway/{slug} emits a self canonical
  - Only built if EIC confirms on 28 Sep that the GTA 6 giveaway is live; otherwise moves to the next live giveaway
- **Files likely touched:** `frontend/app/giveaways/page.tsx:5-11`, `frontend/app/giveaway/[slug]/page.tsx:71-127`, `backend/app/Http/Controllers/Api/V1/GiveawayHubController.php`
- **Growth impact:** Organic discovery of a live giveaway (giveaway_entered from search). **Dependencies:** EIC verifies giveaway status 28 Sep.

### D-039a — Giveaway: base points on entry so every entrant can win
**P0 · XS (1 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C09**
- **Problem.** FACT: Giveaway::pickWinner() draws only from entries with total_points > 0, and entering alone gives 0 points, so an entrant who does no task can never win although the copy says 'free to enter' [backend/app/Models/Giveaway.php:225-229; 25-GIVEAWAYS].
- **Requirement / acceptance criteria:**
  - Entering awards base points (10, per 25-GIVEAWAYS) via the entry creation path; existing entries of the live draw get the same base points once (idempotent command)
  - pickWinner() and pickWinnersByTiers() tests cover a no-task entrant being eligible
  - Ships before C09 is promoted or drawn
- **Files likely touched:** `backend/app/Models/Giveaway.php:212-260`, `backend/app/Models/GiveawayEntry.php`, `backend/app/Http/Controllers/Api/V1/GiveawayController.php:218-272`, `backend/app/Observers/GiveawayEntryObserver.php (registered in AppServiceProvider only)`
- **Growth impact:** Makes the 'free to enter' promise true (trust, giveaway_entered → registration_complete). **Dependencies:** none.

### D-039b — Giveaway: enforce the per-IP entry limit on every entry path
**P0 · S (2 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C09**
- **Problem.** FACT: the 5-entries-per-IP limit is checked only in enter(); completeTask() and claimDailyBonus() also create entries with firstOrCreate and bypass it [GiveawayController.php:230-238, 346-352, 488-494].
- **Requirement / acceptance criteria:**
  - One guard method used by enter(), completeTask() and claimDailyBonus() before an entry can be created
  - Feature test: the sixth account from one IP is refused on all three paths
- **Files likely touched:** `backend/app/Http/Controllers/Api/V1/GiveawayController.php:218-500`, `backend/config/giveaway.php`
- **Growth impact:** Protects draw integrity before promotion (guardrail: giveaway-only accounts share). **Dependencies:** none.

### D-039c — Giveaway: verified task types instead of credit-on-click
**P1 · S (5 h ESTIMATE) · Owner DEV · Target 2027-W04 (25–31 Jan) · Unlocks C09, C36**
- **Problem.** FACT: most giveaway tasks (share, visit, follow) are credited when clicked, without verification; Meta's promotions rules also forbid requiring shares [R16 §0, §2.15; GiveawayTask.php:31-45; 25-GIVEAWAYS].
- **Requirement / acceptance criteria:**
  - New server-verified task types: library_connected (a connected_accounts row exists), shelf_3 (≥3 shelf items), reminder_set, discord_join (verified through the bot's guild-membership sync)
  - Click-only tasks stay available but are labelled 'honour system' in the admin and capped in points
  - giveaway_task_done fires with the task type
- **Files likely touched:** `backend/app/Models/GiveawayTask.php:31-45`, `backend/app/Http/Controllers/Api/V1/GiveawayController.php:334-470`, `backend/app/Http/Controllers/Api/V1/DiscordMembershipController.php`, `backend/app/Filament/Resources/GiveawayResource.php`
- **Growth impact:** Turns giveaway entries into activation (A2) instead of clicks; the precondition for any paid giveaway traffic. **Dependencies:** D-039a.

### D-040 — WoW Analyzer: remove stale and unverifiable copy, replace the 2.5 MB OG image
**P0 · XS (2 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C13, C14, C01**
- **Problem.** FACT: the Analyzer says 'Midnight launches March 2, 2026', '50K+ players analyzed' and '4.9/5 rating', spells 'Profesor Buffy', carries ~100 keywords entries, and uses '/WoW Analyzer.png' (2.5 MB, space in the name) as OG [R02 §11.10; R10 §3; frontend/app/wow-analyzer/page.tsx:6-251; WowAnalyzerClient.tsx:186,196,565].
- **Requirement / acceptance criteria:**
  - Title/description re-aimed at the live game: 'WoW Character Analyzer — free readiness check for your main' with no expansion date
  - Stats row and rating removed; 'Professor Buffy' spelled right; tips labelled as AI-generated
  - keywords array removed; FAQ answers rewritten without 'Midnight readiness'
  - OG replaced by /og/wow-analyzer.jpg 1200×630 ≤300 KB
- **Files likely touched:** `frontend/app/wow-analyzer/page.tsx:6-270`, `frontend/components/wow/WowAnalyzerClient.tsx:186-196,565`, `frontend/public/WoW Analyzer.png`
- **Growth impact:** The only unique tool among media sites stops advertising a past date (tool_run{tool=wow}, organic clicks). **Dependencies:** DS OG image.

### D-041 — Bot giveaway links 404 (/giveaways/{slug} → /giveaway/{slug})
**P0 · XS (1 h ESTIMATE) · Owner DEV · Target 2026-W40 (28 Sep–4 Oct) · Unlocks C09, C36**
- **Problem.** FACT: the bot's /giveaways command and the giveaway DM subscription build https://techplay.gg/giveaways/{slug}; the only route is frontend/app/giveaway/[slug] and next.config.ts has no redirect, so every giveaway link from Discord 404s [discord/src/handlers/commands.ts:537; discord/src/services/SubscriptionService.ts:192; 12-DISCORD].
- **Requirement / acceptance criteria:**
  - Both URLs built as https://techplay.gg/giveaway/{slug} from one helper in the bot, with utm_source=discord&utm_medium=community&utm_campaign=c09-gta6-giveaway
  - Optional belt-and-braces: a permanent redirect /giveaways/:slug → /giveaway/:slug in next.config.ts
  - Bot rebuilt and restarted as the techplay user under pm2 via techplay-deploy.sh; /giveaways in Discord opens a live page
- **Files likely touched:** `discord/src/handlers/commands.ts:537`, `discord/src/services/SubscriptionService.ts:192`, `frontend/next.config.ts (redirects)`
- **Growth impact:** Every giveaway click from the most active owned channel currently fails; gate for C09 promotion (giveaway_entered from Discord). **Dependencies:** none.

### D-042 — Launch-price snapshots for notable releases
**P1 · S (5 h ESTIMATE) · Owner DEV · Target 2026-W44 (26 Oct–1 Nov) · Unlocks C24, C25, C31, C27**
- **Problem.** FACT: GamePrice holds only current Steam US prices for games members own; the $80 Tracker and cost-per-hour stories need the base price at launch, captured at the time [R14 §3 #17, #42, §4 point 7; R01 B.2.15].
- **Requirement / acceptance criteria:**
  - Daily job records, for games with Notability above the calendar threshold releasing within ±3 days, the store price found in store payloads (Steam first; PlayStation/Xbox only where the payload carries a price — UNVERIFIED which do)
  - game_launch_prices (game_id, store, currency, base_price, edition label if known, captured_at); README §8 updated
  - Weekly export for ED; gaps are listed, not guessed; capture starts on the deploy date (about 26 Oct), so MW4 (23 Oct) and earlier launch prices are recorded by ED by hand from public store pages
- **Files likely touched:** `backend/app/Services/Releases/Notability.php`, `backend/app/Services/Releases/SteamCatalog.php`, `backend/app/Services/Releases/PlaystationCatalog.php`, `backend/app/Services/Releases/XboxCatalog.php`, `backend/app/Services/SteamPriceService.php`, `backend/database/migrations/ (new)`, `backend/routes/console.php`
- **Growth impact:** Primary data for C24 (11 Nov) and C25 (23 Nov) and a price series that compounds into 2027 (backlinks, Discover). **Dependencies:** none.

### D-043 — Steam Next Fest participant capture
**P2 · S (4 h ESTIMATE) · Owner DEV · Target 2027-W05 (1–7 Feb) · Unlocks C18, C71**
- **Problem.** FACT: a Next Fest demo tracker is a 'Need' data item; Next Fest runs 19–26 Oct 2026 and again from 22 Feb 2027 [R10 idea 48; R05 §1-2].
- **Requirement / acceptance criteria:**
  - 2026 (no DEV): ED curates the demos as a public TechPlay list (lists support tiers, likes, comments and OG cards)
  - Command next-fest:capture {list} stores appid, name, developer studio, studio country and demo date from that list into a table, so February 2027 can report how many October demos have since released
- **Files likely touched:** `backend/app/Console/Commands/ (new CaptureNextFest)`, `backend/app/Models/GameList.php`, `backend/database/migrations/ (new)`
- **Growth impact:** A repeatable Next Fest dataset (F23, Feb 2027 Next Fest) and indie outreach material (C71). **Dependencies:** none.

### D-044 — Dataset export pack for data PR
**P1 · M (12 h ESTIMATE) · Owner DEV · Target 2026-W41 (congestion, 3 h), W44 (atlas, 2 h), W52 (State of the Catalogue, 3 h); 2027-W09 (achievements, 4 h) · Unlocks C20, C21, C22, C23, C27, C48**
- **Problem.** FACT: the datasets for C20–C27 exist in the database (release_date × precision × platform, studios × country × founded, game_series first/last year) but no export or methodology tooling exists [R14 §1, §3 #1, #7, #8, #24].
- **Requirement / acceptance criteria:**
  - data:release-congestion (per ISO week, precision=day only, 'notable' flag = critic score or ≥2 store links) — S2, for C20 on 7 Oct
  - data:studio-atlas (studios by country incl. null-country count, per-million using a population file EIC supplies) — S5, for C21 on 28 Oct
  - data:sequel-gap (years between entries per series; top 50 series flagged for hand check) — ops time before C23 on 4 Nov
  - data:state-of-catalogue bundle (all of the above + D-033 and D-042 counts with their start dates) — S13, for C27
  - Every CSV carries a header comment with query date, filters and known gaps
  - 2027-W09 extension (about 4 h): data:achievement-difficulty from Steam's public global achievement percentages for 500 games, with the 'ending achievement' mapping file published (C26 moved to Q1 2027)
- **Files likely touched:** `backend/app/Console/Commands/ (new Data* commands)`, `backend/app/Models/Game.php`, `backend/app/Models/Studio.php`, `backend/app/Models/GameSeries.php`, `backend/config/countries.php`
- **Growth impact:** Referring domains from data stories (PR pillar P5); the Reddit data posts in C48. **Dependencies:** EIC methodology sign-off per dataset.

### D-045 — /data/* dataset pages
**P1 · S (7 h ESTIMATE) · Owner DEV · Target 2026-W41 (congestion page, 5 h) and W44 (atlas page, 2 h) · Unlocks C20, C21, C22, C48**
- **Problem.** FACT: data stories earn links when the number has a stable URL with a table, method and download (TwoAverageGamers, SteamDB, HLTB patterns); TechPlay has no such page type [R14 exec, §2].
- **Requirement / acceptance criteria:**
  - /data/release-congestion-2026 live by Tue 6 Oct: server-rendered table, methodology, CSV download, DS chart image, Dataset JSON-LD, 'last updated' line
  - /data/studio-atlas by Tue 27 Oct from the same component; /data/studios-closed-2026 when ED's list is ready
  - In sitemap-pages; OG ≤300 KB per page
- **Files likely touched:** `frontend/app/data/release-congestion-2026/page.tsx (new)`, `frontend/app/data/studio-atlas/page.tsx (new)`, `frontend/components/data/DatasetPage.tsx (new)`, `frontend/public/data/*.csv (new)`, `backend/app/Http/Controllers/SitemapController.php:142-232`
- **Growth impact:** Link-worthy URLs for C20/C21/C22 (backlinks, referral sessions from press and Reddit). **Dependencies:** D-044; DS chart images.

### D-046 — WoW Analyzer re-aim per patch + share card
**P2 · S (6 h ESTIMATE) · Owner DEV · Target 2027-W09 (1–7 Mar) · Unlocks C13, C14, C15**
- **Problem.** FACT: GroqService's prompt is built around Midnight (MIDNIGHT_LAUNCH 2026-03-02) and 'Midnight collection' tips; WoW 12.1.5 is predicted ~6 Oct, WoW: Forever lands 4 Nov and The Last Titan late 2027 [backend/app/Services/GroqService.php:34-170; R05; R18 blueprint 1].
- **Requirement / acceptance criteria:**
  - Target content (patch/expansion name, date, focus areas) read from one config/setting, used by the prompt and the page copy
  - /og/wow share card for an analysis (character, class, score) and share_card_generated fires
- **Files likely touched:** `backend/app/Services/GroqService.php:34-170`, `backend/app/Http/Controllers/Api/V1/WowAnalyzerController.php:42-177`, `frontend/app/wow-analyzer/page.tsx`, `frontend/app/og/wow/route.tsx (new)`
- **Growth impact:** Keeps the unique tool current per patch (F15 Readiness Check, tool_run). **Dependencies:** D-040.

### D-047 — Discord DM release alerts for linked members
**P2 · S (6 h ESTIMATE) · Owner DEV · Target 2027-W06 (8–14 Feb) · Unlocks C43, C36**
- **Problem.** FACT: the bot already DMs news and giveaway subscriptions every 5 minutes, but not releases; reminders stay in the bell [R01 B.8.2, B.8.3; R12 §3].
- **Requirement / acceptance criteria:**
  - /subscribe releases for linked accounts; daily DM at 09:00 UTC listing the member's reminded/wishlisted games out today
  - Backend endpoint returns releases per linked Discord id (discord.bot token); reminder_delivered{channel=discord}
- **Files likely touched:** `discord/src/services/SubscriptionService.ts:13-62`, `discord/src/commands/definitions.ts`, `backend/routes/api.php (discord group)`, `backend/app/Http/Controllers/Api/V1/ (Discord subscriptions controller)`
- **Growth impact:** Second off-site delivery channel for reminders where the community already is (WRM). **Dependencies:** D-013.

### D-048 — Steam most-played weekly snapshot
**P2 · S (4 h ESTIMATE) · Owner DEV · Target 2027-W05 (1–7 Feb) · Unlocks C62**
- **Problem.** FACT: F13 Steam Movers and the Steam hub need weekly most-played ranks; no Steam charts call exists in the codebase (grep) [R10 idea 27; R18 blueprint 3].
- **Requirement / acceptance criteria:**
  - Weekly command stores rank and peak per appid from Steam's public charts API (endpoint confirmed at build time)
  - Export or API for 'biggest movers this week'; feeds the /steam hub module
- **Files likely touched:** `backend/app/Console/Commands/ (new SnapshotSteamCharts)`, `backend/app/Services/SteamService.php`, `backend/routes/console.php`, `backend/database/migrations/ (new)`
- **Growth impact:** Weekly F13 content without manual lookup; a time series that compounds. **Dependencies:** none.

### D-049 — Buffy ritual scheduler (On This Day, What Are You Playing?, poll)
**P2 · M (8 h ESTIMATE) · Owner DEV · Target 2027-W09 (1–7 Mar) · Unlocks C65, C37, C39**
- **Problem.** FACT: the bot has no scheduled content beyond the Sunday recap and article pushes; /games/on-this-day and the calendar endpoints exist [R01 B.8.3; R13 §3].
- **Requirement / acceptance criteria:**
  - RitualService posts: daily On This Day (from /games/on-this-day), Monday 'What are you playing?' thread, Wednesday native poll from a text SC queues in admin
  - Times configurable; posts link with utm_source=discord&utm_medium=community
- **Files likely touched:** `discord/src/services/RitualService.ts (new)`, `discord/src/index.ts:53-105`, `discord/src/services/ApiService.ts`, `backend/app/Http/Controllers/Api/V1/GameController.php (onThisDay)`
- **Growth impact:** Saves SC about an hour a week and keeps rituals on schedule (Discord weekly active members). **Dependencies:** none.

### D-050 — Founding 100: extend the Founder badge campaign
**P1 · XS (1 h ESTIMATE) · Owner DEV · Target 2026-W44 (26 Oct–1 Nov) · Unlocks C68, C67**
- **Problem.** FACT: campaign:founders runs daily at 10:00 with --limit=50 (first 50 full profiles); the spine's C68 extends it to 100 [backend/routes/console.php:265; CampaignFounders --limit option].
- **Requirement / acceptance criteria:**
  - Schedule passes --limit=100; FounderBadgeNotification copy names the Founding 100
  - SC can read remaining slots from the command output; no public count of members is shown
- **Files likely touched:** `backend/routes/console.php:263-265`, `backend/app/Console/Commands/ (campaign:founders)`, `backend/app/Notifications/FounderBadgeNotification.php`
- **Growth impact:** Activation incentive (A2) for October sign-ups. **Dependencies:** none.

### D-051 — 'Out This Week' draft generator
**P2 · S (5 h ESTIMATE) · Owner DEV · Target 2027-W07 (15–21 Feb) · Unlocks C04**
- **Problem.** FACT: F01 runs every Monday from the calendar, which already scores notability per month; ED builds it by hand [R02 §13.20; R01 B.5 (Notability, CalendarVisibility)].
- **Requirement / acceptance criteria:**
  - Filament action creates a draft Article (status draft, via the model) listing the week's notable releases with platforms, date and game links
  - ED edits and publishes; nothing publishes automatically
- **Files likely touched:** `backend/app/Services/Releases/Notability.php`, `backend/app/Services/Releases/CalendarVisibility.php`, `backend/app/Filament/Resources/NewsResource.php`
- **Growth impact:** Cuts ED time on F01 (ESTIMATE 1–2 h/week) and adds game links to every Monday post. **Dependencies:** none.

### D-052 — North Star report: Weekly Returning Members and activation funnel
**P1 · S (4 h ESTIMATE) · Owner DEV · Target 2026-W52 (21–27 Dec) · Unlocks C03**
- **Problem.** FACT: no definition or report of activation exists; FunnelAnalytics counters have a writer and no reader; the spine's North Star (WRM) is not computed anywhere [R11 §6; R12 §4; R01 B.12 #17].
- **Requirement / acceptance criteria:**
  - Artisan command + Filament widget: WRM per ISO week (accounts with ≥1 meaningful action: shelf change, rating, comment, list edit, reminder set, analyzer run by a signed-in user, Discord linked-XP event)
  - Activation A0–A3 per registration week and per from=/provider; D1/D7/D30 on actions
  - Reads member_actions (D-007b) and the Redis funnel counters (the D-007a widget in 15-REGISTRATION is folded into this item)
  - Interim until it ships: DEV runs the WRM SQL weekly from member_actions and pastes the number into the KPI sheet (ops time)
- **Files likely touched:** `backend/app/Console/Commands/FunnelReport.php`, `backend/app/Services/FunnelAnalytics.php:9-30`, `backend/app/Filament/Widgets/ (new NorthStarWidget)`
- **Growth impact:** Makes the North Star and activation measurable; basis for every 1 Jan 2027 decision. **Dependencies:** D-007; D-007b.

### D-053 — Noindex login-walled and utility pages
**P2 · XS (2 h ESTIMATE) · Owner DEV · Target 2027-W08 (22–28 Feb) · Unlocks C02**
- **Problem.** FACT: /social, /verify-email, /newsletter/verify, /support/checkout, /shop/checkout and /auth/callback inherit index,follow [R01 A.4.7].
- **Requirement / acceptance criteria:**
  - Each route returns robots noindex (follow where useful); verified in server HTML
- **Files likely touched:** `frontend/app/social/page.tsx`, `frontend/app/(auth)/verify-email/`, `frontend/app/newsletter/verify/page.tsx`, `frontend/app/support/checkout/`, `frontend/app/shop/checkout/`, `frontend/app/auth/callback/page.tsx`
- **Growth impact:** Index hygiene; small crawl-budget saving. **Dependencies:** none.

### D-054 — Mail bounce/complaint ingestion and per-send guardrails (same item as D-013c in 17-NEWSLETTER-EMAIL)
**P1 · S (5 h ESTIMATE) · Owner DEV · Target 2026-W48 (23–29 Nov) · Unlocks C40, C41, C42**
- **Problem.** FACT: MailSuppression supports bounced and complained, but only unsubscribe writes to it; no provider feedback is ingested; the spine guardrails (complaint <0.1%, unsubscribe <0.5% per send) cannot be read [R01 B.3, B.12 #13; R20 §4].
- **Requirement / acceptance criteria:**
  - Provider webhook or feedback source identified with EIC (README §11); endpoint writes MailSuppression::suppress(bounced|complained); no DNS, SPF, DKIM, DMARC or SMTP change
  - MailCampaignResource shows per send: delivered, clicks, unsubscribes, complaints, bounces, with the guardrail thresholds highlighted
- **Files likely touched:** `backend/app/Models/MailSuppression.php:32-76`, `backend/app/Http/Controllers/ (new MailFeedbackController)`, `backend/app/Filament/Resources/MailCampaignResource.php`, `docs/README.md §11, §20`
- **Growth impact:** Protects deliverability as automated mail starts (guardrail metrics). **Dependencies:** EIC confirms mail provider and approves any provider-side setting.

### D-055 — Review JSON-LD dedupe and 'Verdict' format support
**P2 · S (4 h ESTIMATE) · Owner DEV · Target 2027-W06 (8–14 Feb) · Unlocks C52, C53**
- **Problem.** FACT: review pages emit Product JSON-LD twice (server and client); reviews stopped on 8 Jul and arrive 16–21 days after launch; the spine restarts them as F24 Verdict [R01 A.4.9 #1; R08; R02 §6.2].
- **Requirement / acceptance criteria:**
  - Client duplicate removed from ReviewDetailView
  - review_data gains verdict_type (launch-verdict | full) and an 'Updated on' line when a verdict grows into a full review
- **Files likely touched:** `frontend/components/reviews/ReviewDetailView.tsx:82-113`, `frontend/app/reviews/[slug]/page.tsx:186-231`, `backend/app/Filament/Resources/ReviewResource.php`
- **Growth impact:** Clean review markup for the Verdict restart and the OpenCritic application. **Dependencies:** none.

### D-056 — GTA 6 map progress tracker (saved to accounts)
**P1 · M (18 h ESTIMATE) · Owner DEV · Target 2026-W46–W47 (9–22 Nov) · Unlocks C11, C10**
- **Problem.** FACT: the map holds 1,058 locations (211 unconfirmed); MapGenie-style progress saving is the proven hook; 'gta 6 collectibles map' is a High-priority post-launch query [R17 §3 row 34, §7.6; R10 idea 14].
- **Requirement / acceptance criteria:**
  - Members mark a location found/visited; progress per category; stored in user_gta_locations (README §8); guests see a sign-up prompt (D-016 when shipped)
  - Attribution line per D-020 outcome; unconfirmed locations visibly labelled
  - Live by 18 Nov, switched on in the UI on 19 Nov; 2 h launch-week support reserved
- **Files likely touched:** `frontend/components/gta6/Gta6MapClient.tsx`, `frontend/components/gta6/Gta6LeafletMap.tsx`, `backend/app/Models/GtaLocation.php`, `backend/app/Http/Controllers/Api/V1/ (Gta6 locations controller)`, `backend/routes/api.php:640-655`, `backend/database/migrations/ (new)`
- **Growth impact:** Launch-week registrations and returns from GTA 6 players (registration_complete{from=gta6}, WRM). **Dependencies:** D-020.

### D-057 — Editorial intros on series and facet hubs
**P1 · M (10 h ESTIMATE) · Owner DEV · Target 2026-W53 (5 h); 2027-W01 (5 h) · Unlocks C63, C70**
- **Problem.** FACT: series pages and facet hubs carry no editorial copy and there is no Filament resource for series; In Order pages and the 2027 pre-release hubs (FF7 Revelation, Fable, Persona 4 Revival, Metroid, God of War, Metro) need an editor-written intro on the series page, which R18 names the canonical 'in order' URL [R18 'Connecting hubs'; R01 B.10; backend/app/Models/GameSeries.php:19-27].
- **Requirement / acceptance criteria:**
  - Migration adds intro (sanitised HTML via SanitizationService) and intro_updated_at to game_series; hub_intros table keyed by facet path; README §8
  - GameSeriesResource and a HubIntro resource in Filament; saving revalidates the page by tag
  - Rendered server-side above the grid on /games/series/[slug] and facet hubs
- **Files likely touched:** `backend/app/Models/GameSeries.php`, `backend/app/Filament/Resources/ (new GameSeriesResource, HubIntroResource)`, `frontend/app/games/series/[slug]/page.tsx`, `frontend/app/games/genre/[genre]/page.tsx`, `backend/database/migrations/ (new)`, `docs/README.md §8`
- **Growth impact:** Turns the series index into the F09 In Order landing pages for Q1 2027 launches (organic clicks). **Dependencies:** none.

### D-058 — Stale surfaces: roadmap data and the expired Frontiers countdown
**P2 · XS (2 h ESTIMATE) · Owner DEV · Target 2027-W07 (15–21 Feb) · Unlocks C01**
- **Problem.** FACT: /roadmap shows shipped features as 'Planned' and paused ones as upcoming; Frontiers counts down to 13 Sep 2026 with no backend [R01 A.8; R02 §11.11; R11 §1.4].
- **Requirement / acceptance criteria:**
  - lib/roadmapData.ts updated to what shipped (text from EIC)
  - Frontiers countdown hidden; keeping or removing the page is an EIC decision (CLAUDE.md: no feature removal without instruction)
- **Files likely touched:** `frontend/lib/roadmapData.ts:16-160`, `frontend/app/frontiers/FrontiersClient.tsx:15`
- **Growth impact:** Trust for anyone evaluating the product (partners, press). **Dependencies:** EIC copy and Frontiers decision.

### D-059 — Lifetime-hours baseline snapshot on 31 Dec 2026
**P1 · XS (2 h ESTIMATE) · Owner DEV · Target 2026-W52 (build); runs 31 Dec 2026 23:00 UTC · Unlocks C28**
- **Problem.** FACT: user_games.hours_played is lifetime; no snapshot exists, so 'hours played in 2026' cannot be computed and the 2027 year in review would have the same gap [R01 B.2.15; D-025 note].
- **Requirement / acceptance criteria:**
  - Command snapshots (user_id, game_id, hours_played, platform, captured_at) for all connected accounts at 23:00 UTC on 31 Dec 2026; README §8
  - Runs again every 1 Jan; retention policy documented; excluded from public exports
- **Files likely touched:** `backend/app/Console/Commands/ (new SnapshotHours)`, `backend/routes/console.php`, `backend/database/migrations/ (new)`
- **Growth impact:** Makes 'Your 2027 in Games' report real hours played in 2027. **Dependencies:** none.

### D-060 — Studio status editing and a closures feed
**P2 · S (5 h ESTIMATE) · Owner DEV · Target 2027-W10 (if D-031 is not approved) else 2027-W12 · Unlocks C22**
- **Problem.** FACT: studios carry status and changed_at history fields, but there is no Filament resource for studios, so ED cannot record a closure; C22 tracks studio closures weekly [R01 B.5; Filament resource list].
- **Requirement / acceptance criteria:**
  - StudioResource (edit status, changed_at, source URL) with an observer registered in AppServiceProvider that revalidates the studio page
  - /data/studios-closed-2026 reads studios with status closed and changed_at in 2026
- **Files likely touched:** `backend/app/Models/Studio.php:23-27`, `backend/app/Filament/Resources/ (new StudioResource)`, `backend/app/Providers/AppServiceProvider.php`, `frontend/app/data/studios-closed-2026/page.tsx (new)`
- **Growth impact:** Turns F17 Studio Watch from an article into a maintained dataset linked from studio pages (backlinks). **Dependencies:** D-045.

### D-061 — GTA 6 vehicles: show real-world equivalents
**P2 · XS (2 h ESTIMATE) · Owner DEV · Target 2026-W43 (19–25 Oct) · Unlocks C12**
- **Problem.** FACT: Gta6Vehicle has real_equivalent and vehicle_class fields editable in Filament, but the frontend renders only the class; 'gta 6 cars real life' is a High-priority query [R17 §3 row 14; Gta6VehicleResource.php:84,128; grep of frontend: 0 uses of real_equivalent].
- **Requirement / acceptance criteria:**
  - Vehicle cards and detail pages show 'Based on (reported): …' only where ED filled the field with a source; filter by class
  - No equivalent is shown without a source note
- **Files likely touched:** `frontend/components/gta6/Gta6EntityGrid.tsx:19`, `frontend/components/gta6/Gta6EntityDetail.tsx`, `frontend/components/gta6/Gta6EntityCard.tsx`
- **Growth impact:** Shareable vehicle content for C12 (organic clicks, social_share). **Dependencies:** ED data entry.

### D-062 — GTA 6 'Confirmed or Rumour?' ledger editable without a deploy
**P3 · S (6 h ESTIMATE) · Owner DEV · Target interim: weekly text update in ops, W40–W47; full build decided 1 Jan 2027 · Unlocks C07**
- **Problem.** FACT: /gta6/everything-we-know holds its facts and FAQ as constant arrays in page.tsx, so every weekly ledger update (F03, Thursdays) needs a code change and deploy [frontend/app/gta6/everything-we-know/page.tsx:37-90; R17 §2].
- **Requirement / acceptance criteria:**
  - Interim (S1–S8): ED sends the week's ledger rows by Wednesday; DEV applies them to the arrays and deploys Thursday morning (≤1 h, counted in the weekly ops reserve)
  - Full item (only if the ledger continues into 2027 as a GTA Online/PC status tracker): Gta6LedgerEntry model + Filament resource + observer registered in AppServiceProvider that revalidates the page by tag; each row has claim, status (confirmed/reported/rumour/denied), source URL, date
- **Files likely touched:** `frontend/app/gta6/everything-we-know/page.tsx:37-90`, `backend/app/Filament/Resources/Gta6CharacterResource.php (pattern)`, `backend/app/Providers/AppServiceProvider.php`
- **Growth impact:** Keeps the weekly ledger (trust signal for Discover and News) cheap to update. **Dependencies:** none.
## Sprint plan for DEV (20 h a week, 28 Sep–31 Dec 2026)

Capacity is 240 h over W40–W51, plus 10 h in W52 and 6 h in W53, for 256 h in total. Planned items take 225 h. The "ops" column holds deploys, incidents, the weekly GTA 6 ledger push (D-062 interim) and the weekly WRM query until D-052 ships. Items are listed in the order DEV takes them within the week.

| Week | Dates | Campaign deadlines that week | DEV items (h ESTIMATE) | Planned | Ops | Note |
|---|---|---|---|---|---|---|
| W40 | 28 Sep–4 Oct | C01 to 2 Oct; C09 verify 28 Sep; C07 1 Oct; C40 issue 1 on 2 Oct | D-004 1 · D-041 1 · D-039a 1 · D-039b 2 · D-001 4 · D-040 2 · D-002 2 · D-020 1 · D-012 landing + homepage 4 | 18 | 2 | Giveaway fixes go first, so C09 can be promoted from Tue 29 Sep. Ledger text for C07 goes live Wed 30 Sep |
| W41 | 5–11 Oct | C20 7 Oct; C13 5–12 Oct; C02 ends 9 Oct; C54 9 Oct | D-044 congestion 3 · D-045 page 5 (both Mon–Tue) · D-005 4 · D-017 page 4 · D-012 form + source 3 | 19 | 1 | If the giveaway is live, D-039 (2 h) replaces D-012 part B, which moves into W42 ops. C54: EIC publishes the ownership text as an article; the pages follow in W51 |
| W42 | 12–18 Oct | C08 14 Oct; C22 14 Oct; C42 12 Oct; C46 16 Oct; C03 ends 16 Oct | D-018 10 (Mon–Wed) · D-017 OG 2 · D-003 3 · D-029 4 | 19 | 1 | C42 moves to W45. C46: the article gets the D-012 newsletter form only |
| W43 | 19–25 Oct | C12 21 Oct; C43 and C45 19 Oct; C56 from 19 Oct; Next Fest 19–26 Oct | D-061 2 (Mon) · D-033 4 · D-007 phase A 6 · D-014 7 | 19 | 1 | C43 and C45 slip. C56 waits for D-008 |
| W44 | 26 Oct–1 Nov | C21 28 Oct; C41 26 Oct; C61 26 Oct; C44 ends 26 Oct; C67 1 Nov | D-044 atlas 2 · D-045 atlas 2 (Mon–Tue) · D-008 10 · D-042 5 · D-050 1 | 20 | 0 | Full week. If anything breaks, D-042 moves first, then D-050 |
| W45 | 2–8 Nov | C57 2 Nov; C62 2 Nov; C23 4 Nov; WoW: Forever 4 Nov | D-013 16 · D-007b 4 | 20 | 0 | Welcome and reminder mail go live about 6 Nov after EIC's deliverability sign-off. C57 does not run (no D-031). C23 uses the sequel-gap query DEV writes with the W41 export (EIC runs it; no extra DEV hours) |
| W46 | 9–15 Nov | C58 9 Nov; C59 9 Nov; C15 10 Nov; C24 11 Nov | D-056 16 | 16 | 4 | Tracker built on the D-020 outcome; switched on 19 Nov. C59 goes to the 1 Jan decision. C58 can run: D-008 is live |
| W47 | 16–22 Nov | C10; GTA VI 19 Nov; C11 19 Nov; C29 18 Nov | D-056 launch support 2 · D-028 10 | 12 | 8 | Launch week: 8 h held for incidents. First "Your releases this week" on Mon 23 Nov |
| W48 | 23–29 Nov | C25 23 Nov; C31 from 20 Nov; Black Friday 27 Nov | D-027 12 · D-054 5 | 17 | 3 | Price alerts live Wed 25 Nov. Complaint and bounce data before the December sends |
| W49 | 30 Nov–6 Dec | C32 30 Nov; C30 from 1 Dec; C33 | D-025 17 | 17 | 3 | — |
| W50 | 7–13 Dec | TGA 10 Dec; C26 was 8 Dec | D-025 15 | 15 | 5 | Your 2026 in Games code-complete 13 Dec. C26 moves to Q1 |
| W51 | 14–20 Dec | C28 live 14 Dec; C53 14 Dec; C34 17 Dec | D-016 lite 8 · D-022 3 · D-038 5 · D-011a 2 · D-006 1 | 19 | 1 | — |
| W52 | 21–27 Dec (10 h) | C70 from 21 Dec; C27 draft | D-044 State of the Catalogue 3 · D-059 2 · D-052 4 | 9 | 1 | — |
| W53 | 28–31 Dec (6 h) | D-059 snapshot 31 Dec 23:00 UTC | D-057 5 | 5 | 1 | D-057 finishes in 2027-W01 |

**Risk.** W41–W45 run at 95–100% of DEV time. The first four weeks decide the quarter: if a P0 fix grows, D-042, then D-050, then D-007b move to the next week that has ops slack (W46–W48).

**The one lever that changes this table (option for EIC, no cost assumed):** about 10 more DEV hours a week from 12 Oct to 22 Nov (60 h) would bring back D-015 Steam sign-in (14 h), D-016 in full before 19 Oct (12 h), D-010 (14 h), D-011 (10 h) and D-031 (14 h), in that order.

## What slips, and what runs without DEV

| Campaign | Spine date | DEV dependency | New date | Interim without DEV |
|---|---|---|---|---|
| C02 Plumbing Sprint | 28 Sep–9 Oct | D-003, D-006, D-022 | D-003 16 Oct; D-006 and D-022 in W51 | D-002, D-004, D-005 and D-017 land inside the window; titles fixed through page_seo by EIC in Filament |
| C42 Welcome sequence | 12 Oct | D-013 | about 6 Nov | SC sends a short manual welcome campaign on Fridays to that week's verified subscribers (mail desk "signups" segment) |
| C43 Release-day alerts off-site | 19 Oct | D-013 (email), D-047 (Discord DM) | email about 6 Nov; DM 2027-W06 | SC posts "Out today" in Discord each morning from /calendar |
| C41 "Your releases this week" | 26 Oct | D-028 | 23 Nov | None; F01 Out This Week covers the general version |
| C44 Registration rebuild | 5–26 Oct | D-014 (on time), D-015 | Steam sign-in 2027-W01 | Steam stays "connect after sign-up"; the welcome mail pushes it |
| C45 Guest "Remind me" | 19 Oct | D-016 | 18 Dec (lite) | Buttons send guests to /login?redirect= (after D-014) |
| C46 Article end CTA | 5–16 Oct | D-010 | Feb 2027 | D-012 newsletter form under articles from 5 Oct; ED adds 3–5 contextual links by hand |
| C54 Ownership + press pages | 9 Oct | D-038 | 18 Dec | EIC's ownership, funding and AI-use text published 9 Oct as an article linked from /about |
| C56 Google branded search | from 19 Oct | D-007, D-008 | earliest 2 Nov | No spend before measurement (spine §13) |
| C57 Meta registration test | 2–22 Nov; 1–14 Dec | D-031 | Not in 2026 | Decision on 1 Jan 2027 |
| C58 Reddit tool/hub test | 9–25 Nov | D-008 | On time | Landing-page counter plus UTMs as the source of truth [R16 §4.6] |
| C59 Web push | 9 Nov | D-019 | 1 Jan decision | Email and bell only |
| C60 PC Fix Hub | 12 Oct | D-032 route | Jan 2027 | Guides publish one by one; a "PC fixes" pillar guide lists them and is later redirected into /guides/pc-fixes |
| C61 / C62 / C15 hubs | 26 Oct / 2 Nov / 10 Nov | D-032 (+D-048, D-046) | Jan 2027 | ED pillar articles; the hubs absorb them with 301s in January |
| C29 Prediction league | 18 Nov–10 Dec | D-026 | 2027 (TGA 2027) | One forum poll per category plus Discord polls; SC scores in a sheet |
| C26 Achievement difficulty | 8 Dec | D-044 extension | 2027-W09 | None; fits the Q1 data calendar |
| C36 Invite attribution | from 12 Oct | D-011 | 2027-W07 | SC reads "uses" per invite code in Server Settings → Invites every Monday |
| C65 On This Day automation | "later" | D-049 | 2027-W09 | SC posts by hand |
| C31 Price alerts | 20 Nov | D-027 | 25 Nov | Deal Radar (F16) posts without personalisation from 20 Nov |
| C28 Your 2026 in Games | build by 10 Dec | D-025 | 13 Dec, live 14 Dec | — |
| On time | C07, C08, C09, C11, C12, C20, C21, C68 | D-062 interim, D-018, D-039a/b + D-041, D-056, D-061, D-044/045, D-050 | as planned | — |

## D-031: the 19 Oct question

The Meta Pixel with CAPI is 14 h. Retargeting in November needs the pixel collecting from about 19 Oct.

- **Option A, default:** drop November retargeting and C57 for 2026. D-031 goes to 2027-W10, and only if paid scale is approved on 1 Jan. Reasons: seed audiences are too small for lookalikes or meaningful retargeting pools [R16 §0]; spine §13 gates paid on measurement; and every October week is already full of P0 and dated work.
- **Option B:** a pixel-only slice (6 h: consent-gated PageView plus a browser registration_complete event, with CAPI later) in W42 by 18 Oct. Displacement chain:
  - D-029 (P0 empty modules) moves W42 → W43.
  - D-003 (RSS) moves W42 → W51.
  - D-033 (date log) moves W43 → W44, so it starts a week later.
  - D-042 (launch prices) moves W44 → W48, so it misses Phantom Blade Zero, WoW: Forever and GTA VI launch week, which weakens C24 and C25.
  - D-054 (bounce ingestion) moves to 2027, while automated mail volume rises.
  - D-022 moves to 2027.
  - EIC must also create the Meta dataset and confirm the consent wiring by 12 Oct.
- **Recommendation: Option A.** EIC decides by Mon 5 Oct. If the answer is B, DEV re-issues this table the same day.

## Q1 2027 carry-over (not a commitment; see 34-2027-BRIDGE)

| Week | Items (h ESTIMATE) | Why then |
|---|---|---|
| 2027-W01 (4–10 Jan) | D-015 14 · D-057 finish 5 | Steam sign-in before the January activation push; series intros before the FF7/Fable/Persona hubs |
| 2027-W02 (11–17 Jan) | D-021 12 · D-023 5 | Indexable-set change once EIC has decided (by 18 Dec) |
| 2027-W03 (18–24 Jan) | D-032 template + /switch-2 12 · D-016 rest 4 | Switch 2 hub before Metroid Ravenous (28 Jan) |
| 2027-W04 (25–31 Jan) | D-032 /mmo, /steam, /guides/pc-fixes 6 · D-007 phase B 6 · D-039c 5 | MMO hub while FFXIV Evercold is current; Steam hub before Next Fest (22 Feb) |
| 2027-W05 (1–7 Feb) | D-043 4 · D-048 4 · D-010 9 | Next Fest capture and movers before 22 Feb |
| 2027-W06 (8–14 Feb) | D-010 5 · D-047 6 · D-055 4 · D-030 2 | God of War Laufey (16 Feb), Persona 4 Revival (18 Feb), Fable (23 Feb) reviews use Verdict |
| 2027-W07 (15–21 Feb) | D-011 10 · D-051 5 · D-058 2 | — |
| 2027-W08 (22–28 Feb) | D-034 3 · D-036 5 · D-053 2 | Next Fest and Fable week: light plan |
| 2027-W09 (1–7 Mar) | D-046 6 · D-049 8 · D-044 achievements 4 | C26 data story in March |
| 2027-W10 (8–14 Mar) | D-031 14 if paid is approved, otherwise D-060 5 + children | — |
| 2027-W11 (15–21 Mar) | D-037 16 | Steam Spring Sale 18–25 Mar (price alerts already live) |
| 2027-W12–W13 | D-009 4 · D-024 6 · D-035 4 · D-019 16 if push is a go | Reminders ahead of FF7 Revelation (8 Apr) |

This leaves no room for the 28 children (105 h). Without more capacity, children stay unscheduled.

## Children and aliases registered by other Phase 2 plans

Folded into a parent here, with no separate hours: D-007a → D-052 · D-011d, D-011e → D-049 · D-011h → D-047 · D-011l → D-011a · D-013a → D-013 · D-013c = D-054 · D-015a → D-015 · D-021a–d → D-021. Scheduled as full items above: D-007b, D-011a, D-039a, D-039b, D-039c.

**ID collisions to resolve.**
- 15-REGISTRATION uses D-011a for "bot link reply", and 16-ACTIVATION-RETENTION uses D-011b for "Buffy DM on link". Both IDs belong to 12-DISCORD's list.
- This file renames them **D-011n** and **D-011o**.

| ID | Parent | Registered in | What | P | Effort | h (ESTIMATE) | 2026/2027 status |
|---|---|---|---|---|---|---|---|
| D-011b | D-011 | 12-DISCORD | Inviter role at 3 retained invitees; weekly #invite-log report | P2 | S | 4 | 2027 Q1 backlog, after D-011 |
| D-011c | D-011 | 12-DISCORD | Activity counters: weekly unique posters, joiners who post within 7 days, command usage | P2 | S | 5 | 2027 Q1 backlog |
| D-011f | D-011 | 12-DISCORD | Weekly Wrap upgrade: next week's releases, new-member count, poll result, UTMs | P2 | S | 4 | 2027 Q1 backlog (SC adds these by hand until then) |
| D-011g | D-011 | 12-DISCORD | Sync Founder (C68) and Season Champion (C67) badges to Discord roles on /sync | P2 | S | 3 | 2027 Q1 backlog (manual roles until then) |
| D-011i | D-011 | 12-DISCORD | /guess cover quiz from /games/random | P3 | S | 5 | decide 1 Jan 2027 |
| D-011j | D-011 | 12-DISCORD | Configurable word/invite filter; exempt TechPlay invite codes; no double action with AutoMod | P2 | S | 3 | 2027 Q1 backlog |
| D-011k | D-011 | 12-DISCORD | Verify whether the /admin event multiplier is applied anywhere; wire it through XpService or remove it | P3 | XS | 1 | 2027 Q1 (ops time) |
| D-011m | D-011 | 12-DISCORD | Optional auto-thread per article in #latest-news | P3 | S | 4 | decide 1 Jan 2027 |
| D-011n | D-011 | 15-REGISTRATION (listed there as D-011a) | Bot replies to unlinked members with a Discord OAuth sign-up link (renamed to avoid the D-011a collision) | P1 | S | 3 | 2027 Q1 backlog |
| D-011o | D-011 | 16-ACTIVATION-RETENTION (listed there as D-011b) | Buffy DM on /link or Discord sign-up (renamed to avoid the D-011b collision) | P2 | XS | 2 | 2027 Q1 backlog |
| D-012a | D-012 | 17-NEWSLETTER-EMAIL, 19-GTA6, 20-GAME-HUBS | Interest tags on subscribe (placement is covered by D-012 signup_source) | P2 | S | 3 | 2027 Q1 backlog |
| D-012b | D-012 | 17-NEWSLETTER-EMAIL | Web archive /newsletter/archive/{n}, noindex until issues carry original writing | P2 | S | 5 | 2027 Q1 backlog |
| D-013b | D-013 | 16-ACTIVATION-RETENTION | Mail channel for comment and forum replies (max 1 per thread per 24 h) | P2 | S | 6 | 2027 Q1 backlog |
| D-013d | D-013 | 16-ACTIVATION-RETENTION | Member time zone for quiet hours (D-013 ships with UTC quiet hours) | P2 | S | 3 | 2027 Q1 backlog |
| D-013e | D-013 | 17-NEWSLETTER-EMAIL | 'inactive' suppression for non-clickers after re-engagement | P2 | XS | 2 | 2027 Q1 backlog (saved SQL until then) |
| D-014a | D-014 | 15-REGISTRATION | Security decision: a scoped token before email verification (library, shelf, wishlist only) | P1 | XS | 2 | decision by 26 Oct 2026 (EIC with DEV, ops time); build only if approved, 2027 Q1 |
| D-016b | D-016 | 15-REGISTRATION | Guest '+ Shelf' row action in the search dropdown | P2 | S | 4 | 2027 Q1 backlog |
| D-018a | D-018 | 19-GTA6 | Release-time share card ('GTA VI unlocks at {time} in {city}') | P2 | S | 3 | only if D-018 finishes under estimate in 2026-W42; otherwise dropped |
| D-021e | D-021 | 13-SEO-CONTENT | Template fields on games: unlock time, file size per platform, crossplay, subscriptions, sources (13-SEO plans 12–23 Oct) | P1 | M | 10 | 2027-W05 or later (not in 2026 DEV capacity) |
| D-022a | D-022 | 14-DISCOVER-NEWS | 'Material update' checkbox drives dateModified and the 'Updated' line (14-DISCOVER plans 23 Oct) | P1 | S | 4 | 2027 Q1 backlog (not in 2026 DEV capacity) |
| D-024a | D-024 | 15-REGISTRATION | Guest Taste Match preview (weights shown, % blurred) | P2 | S | 5 | 2027 Q1 backlog |
| D-029a | D-029 | 15-REGISTRATION | Weekly shelf-add counter on the homepage, hidden below 50 | P2 | XS | 2 | 2027 Q1 backlog |
| D-032a | D-032 | 20-GAME-HUBS | 'Part of the {Hub} hub' link on game pages | P2 | XS | 2 | with D-032, 2027-W03–W04 |
| D-035a | D-035 | 16-ACTIVATION-RETENTION | Streak freeze (1 earned per 7-day streak, 2 banked) | P2 | S | 4 | with D-035, 2027-W12 |
| D-039d | D-039 | 25-GIVEAWAYS | Referral credit only when the referee reaches A2; cap 5; same-IP excluded | P2 | S | 5 | 2027 Q1 backlog |
| D-039e | D-039 | 25-GIVEAWAYS | Fraud score column and filter in viewParticipants; draw excludes score ≥70 | P1 | S | 5 | not in 2026 DEV capacity; SC reviews entrants by hand before each 2026 draw |
| D-039f | D-039 | 25-GIVEAWAYS | Winner and result mails, public winner block, closing reminder by mail | P1 | S | 5 | not in 2026 DEV capacity; EIC contacts winners by hand; mail after D-013 in 2027 Q1 |
| D-040a | D-040 | 15-REGISTRATION, 16-ACTIVATION-RETENTION | Store user_id on wow_analyses when signed in (WRM counts Analyzer runs only after this) | P1 | XS | 1 | 2027 Q1 backlog |
Hours for children are this plan's ESTIMATE where the source file gave none. Where a source plan dates a child inside 2026 (D-021e 12–23 Oct in 13-SEO-CONTENT, D-022a 23 Oct in 14-DISCOVER-NEWS, D-039e before a 3 Nov draw and D-039f by 21 Oct in 25-GIVEAWAYS, D-011a in W41 in 12-DISCORD), that date does not fit the capacity above. The owning plan should use its manual interim.

## Dependencies and open questions

1. **EIC, 28 Sep:** is the GTA 6 giveaway live, and what are its end date and tasks? This decides D-039 (W41) and the order of C09 promotion. D-039a, D-039b and D-041 ship either way.
2. **EIC, by 5 Oct:** D-031 Option A or B (above).
3. **EIC, by 16 Oct:** the gtadb.org answer, or no answer (D-020). This decides whether W46 builds D-056 or swaps in D-021 + D-023.
4. **EIC, before the first automated send (about 6 Nov):** deliverability sign-off for D-013/D-028. Also, which provider feedback source D-054 can read (README §11). No DNS or SMTP change is involved.
5. **EIC, by 18 Dec:** the indexable-set rule for D-021 (R03 §9 options). It is the largest SEO decision in the plan and cannot be reversed quickly.
6. **UNKNOWN:** whether PlayStation and Xbox store payloads carry prices (D-042). Whether Steam's charts endpoint is still public (D-048). Whether the discord.js invite-diff approach works with the bot's permissions (D-011).
7. **UNKNOWN:** the live season dates (two migrations disagree [R01 B gaps]). SC checks them in Filament before C67 on 1 Nov. No DEV work unless they are wrong.
8. **Capacity:** every date here assumes 20 DEV hours a week with no other project. If DEV is also the person doing deploys for editorial fixes, the ops column is too small.
9. **Research correction:** R01 names `database/data/gta6_assets.php` as the location source. The seeder actually reads `backend/database/data/gta6_landmarks.json` (checked 27 Sep).
