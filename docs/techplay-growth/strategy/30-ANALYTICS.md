# 30 — Analytics, KPIs, Events and UTMs

Status: Phase 2 plan — 27 Sep 2026

Parts 42–44 of the brief: the KPI framework, the analytics event specification and the UTM system, plus the weekly dashboard and the Monday review. Machine-readable copy of the KPIs: `kpis.json`. Experiments that use these events are in `31-EXPERIMENTS.md`.

- **Growth is not measurable today.** No ad pixel, GA4 events only for the onboarding wizard, a first-party collector that drops `utm_*` by design, and no reader for the Redis funnel counters [R16 §0, R01 B.12 #17]. C03 Measurement Foundation (28 Sep–16 Oct) comes before any promotion that needs a number, and before any paid spend (no paid before 19 Oct, spine §13).
- **Three sources, three jobs.** The production database counts people and actions (registrations, shelves, subscribers, comments). The first-party collector counts every visit and every GA event name without identifiers. GA4 attributes sessions to channels, but only for visitors who consent. Where they disagree, the database wins for counts and the collector wins for traffic.
- **What cannot be measured, said plainly:** unique visitors across days (the visitor hash is re-salted nightly), returning visitors (same reason), EEA visitors who decline consent in GA4, and anything on Facebook or Instagram that SC does not type in by hand. Retention is therefore measured on accounts, not visitors [R12].
- **North Star: Weekly Returning Members (WRM)** (spine §3). Baseline UNKNOWN; the first reading is due Mon 5 Oct from query Q-01. TARGET 45–70 WRM in the last week of December.
- **27 KPIs** (K00–K26): 1 North Star, 18 brief KPIs, 4 guardrails, 4 loop and measurement-health metrics. Every one has a dated baseline or the query that produces it, and three TARGET checkpoints (31 Oct, 30 Nov, 31 Dec). Absolute TARGETs are re-set on Mon 2 Nov from four weeks of real data.
- **27 analytics events** from spine §10, each with trigger, parameters, file path, client or server side, key-event status, dedupe rule and privacy note. Seven are GA4 key events. DEV work is D-007 (events), D-008 (collector UTMs), D-008a (first-touch attribution columns), D-008b (event parameters in the collector), D-009 (URL builder), D-011 (bot invite attribution), D-008c (growth page).
- **UTM system:** spine §9 taxonomy, a validator regex for each parameter plus cross-field rules, 32 worked URLs, one Discord invite code per campaign logged in a sheet, and QR rules.
- **Weekly rhythm:** SC fills the growth sheet Monday 09:00–10:00; the review runs Monday 11:00–11:45 CET with EIC, SC and DEV; first review Mon 5 Oct.

---

## 1. Measurement constraints (read before any number)

| Constraint | What it means | Evidence | What we do |
|---|---|---|---|
| GA4 sees consenting visitors only in the EEA, UK and Switzerland | nginx serves `denied` by default there until Google's CMP records a yes; US and rest of world default `granted`. Until 20 Sep only 2–7% of hits were consented; since the CMP change the rate is UNKNOWN | README §19; [R16 §0] | GA4 is used for rates and channel mix in the consented sample, never for totals. EEA consent rate is itself a KPI (K26) |
| The first-party visitor is `sha256(salt + IP + agent)` with a salt thrown away every night | Same person tomorrow = new hash. No unique visitors per week or month, no returning visitors, no multi-day attribution | `AnalyticsCollector::salt()`; README §19 | Report visitor-days and sessions, never "users". Returning is measured on accounts (K11) |
| The collector keeps the path only and the referrer host only | `utm_*` and `gclid` are dropped; paid and organic Facebook look the same | `AnalyticsCollector::path()` comment; [R16 §4.1] | D-008 parses UTMs before the query string is dropped; D-008a stores first touch on the account and the subscriber |
| Sessions exist only where GA sends a session id (`sid`) | For declined-consent pings the `sid` may be missing or per page (UNVERIFIED) | `RollUpAnalytics` counts `distinct session` | Q-09 measures the share of hits without `sid`, by consent state, before pages-per-session is trusted |
| The collector stores the event name (`en`) but not event parameters | A `registration_complete` fired by gtag is counted for every visitor, consented or not, but its `method` is lost | `AnalyticsCollector::record()` | D-008b adds a whitelisted `params` column |
| `/track/event` is auth-only, 30/min, whitelist of 8 events; counters live in Redis for 90 days | Guest events cannot use it; history disappears after 90 days; nothing reads it except `php artisan analytics:funnel` | `routes/api.php` L668; `FunnelAnalytics.php` | Guest events go through gtag (and so through the relay into the collector); server events go to a persistent table (D-007) |
| `d1_return` is guarded per browser with localStorage | Cross-device returns are missed | `lib/track.ts` | Keep it for continuity; the account-based D1 from D-007 server events is the one we report |
| Bots are marked, not dropped | Reports must read `is_bot = false` and say how many were set aside | README §19 | Every dashboard number from the collector carries the bot count beside it |
| No Search Console access in the research session | Discover, News and query data are UNKNOWN in the research files, although the team has GSC (README §12 quotes it) | [R03] | ED exports GSC baselines on Mon 28 Sep (§3) |
| Social platforms: login walls and no API access | Facebook and Instagram counts were unverifiable; TikTok, Bluesky and LinkedIn accounts were not found | [R02] | SC types follower counts into the sheet every Monday |
| Discord Server Insights needs more than 500 members | No Discord analytics at 160 members | [R13] | The bot counts joins, messages and command use (D-011) |
| Small numbers | 60 members, 22 comments, 1–2 search clicks a day | [R01] | Report counts beside every percentage; no A/B significance claims (31 §2) |

**Honest reporting rules.** A number goes in the dashboard with its source and date. A rate is shown with its numerator and denominator. Nothing measured on the site is published externally (spine §0) unless it is a live count from the API.

## 2. Sources of truth and the metric tree

| Question | Source of truth | Cross-check | Never use |
|---|---|---|---|
| How many people registered, verified, activated, subscribed, commented? | Production DB | GA4 key events (consented share) | GA4 totals |
| How much traffic, from which referrer? | First-party collector (`analytics_daily`, `analytics_events`) | GA4 sessions (consented) | Summed daily visitors as "uniques" |
| Which campaign brought the traffic? | Collector UTM columns (D-008), then first-touch on the account (D-008a) | GA4 session source/medium | Platform-reported clicks alone |
| Which campaign brought the member? | `users.signup_from` / `signup_utm_*` (D-008a) | GA4 `registration_complete` with session source | Last-click guesses in a meeting |
| Search and Discover | Google Search Console | Collector referrer `google.*` | Bing results pages |
| Discord | Bot (`guild.memberCount`, join log by invite code) | Discord invite API | Code comments with member counts |
| Social reach | Each platform's own analytics, typed in by SC | UTM sessions in the collector | Screenshots with no date |

Metric tree (how the North Star is fed):

```
WRM (K00)
├── Activated members (K08) ← verified registrations (K07) ← registration starts ← traffic by channel (K01–K06)
├── Product loops: reminders set (K23) → alerts delivered → visit (K24)
├── Community: comments (K14), Discord members (K10) and linked accounts
└── Owned reach: newsletter verified (K09), social followers (K15), video views (K16)
Guardrails: K19 complaints · K20 unsubscribes · K21 giveaway-only share · K22 moderation queue
Cost: K17 CAC · K18 cost per verified registration (paid only, from 19 Oct)
```

## 3. Baseline day (Mon 28 Sep – Fri 2 Oct)

| Task | Owner | Hours | Output |
|---|---|---|---|
| Run queries Q-01 to Q-14 (§5) against production read-only; paste results with timestamp | DEV | 2 | Baseline tab in the growth sheet |
| Export GSC: last 28 days clicks, impressions by query and page, Discover and News tabs (or "no data"), Pages report counts, crawl stats | ED | 1 | GSC tab |
| Record follower counts on X, Instagram, Facebook, YouTube, TikTok (if created), Threads, Bluesky, LinkedIn; Discord member count via the invite API | SC | 0.5 | Channels tab |
| Record the newsletter list size (form source, verified, active) and whether any campaign has been sent since 11 Sep | SC | 0.25 | Newsletter tab |
| Run `php artisan analytics:funnel` for the last 30 days | DEV | 0.25 | Funnel tab |
| Verify in admin whether the GTA 6 giveaway is live (spine §0) and record entries | SC | 0.25 | Giveaways tab |

Every baseline row carries: value, date and time, source, who ran it. Baselines are not revised later; corrections are added as new rows.

## 4. KPI framework (Part 42)

Format for each KPI: definition, formula, source, baseline (dated), TARGET at 31 Oct / 30 Nov / 31 Dec, owner and cadence. **All targets are TARGETs we set, not forecasts.** Ranges that depend on an unknown baseline are relative to that baseline. On Mon 2 Nov the review replaces relative ranges with absolute ones using four weeks of D-007/D-008 data; the targets in 15-REGISTRATION follow the same rule, and its one absolute target (100 A2 members by 31 Dec) is K08's.

### K00 — Weekly Returning Members (WRM) — North Star
*North Star* · Owner **EIC** · Cadence: weekly (Monday review) · Events: `shelf_add`, `rating_created`, `comment_created`, `list_created`, `reminder_set`, `tool_run`

- **Definition:** Accounts with at least one meaningful action in a rolling 7-day window: shelf change, rating, comment, list edit, reminder set, Analyzer run tied to an account, Discord linked-XP event.
- **Formula:** COUNT(DISTINCT user_id) over the union of user_games.updated_at, game_ratings, comments, game_lists/game_list_items, reminder changes (user_games.notify_on_release), user_wow_characters activity and Discord XP rows in the reward ledger, for the 7 days ending Sunday 23:59 CET (query Q-01).
- **Source:** Production DB (read replica or read-only query)
- **Baseline:** UNKNOWN — run Q-01 (2026-09-27). Proxy: of 55 members, 45 had zero XP (code comment, before 31 Aug 2026) [R01]. Anonymous WoW analyses (wow_analyses has no user_id) cannot count.
- **31 Oct:** TARGET 15–25 · **30 Nov:** TARGET 30–50 · **31 Dec:** TARGET 45–70

### K01 — Traffic — human sessions per week
*Traffic* · Owner **EIC** · Cadence: weekly · Events: `page_view`

- **Definition:** Sessions (distinct GA session ids) from non-bot hits in the first-party collector, per ISO week.
- **Formula:** SUM(analytics_daily.sessions) for the ISO week (Q-02). Visitor counts are per-day hashes; never add them up as 'unique visitors'.
- **Source:** First-party collector (analytics_daily)
- **Baseline:** UNKNOWN — run Q-02 for W39 (21–27 Sep) (2026-09-27). First full week after the Google CMP change of 20 Sep; earlier weeks are not comparable [README §19].
- **31 Oct:** TARGET +25–50% vs W39 · **30 Nov:** TARGET +100–200% vs W39 (GTA VI week) · **31 Dec:** TARGET +75–150% vs W39

### K02 — Organic search clicks
*Organic search* · Owner **ED** · Cadence: weekly; monthly deep-dive · Events: none (external source)

- **Definition:** Google Search clicks (web search type) per day, 7-day average.
- **Formula:** GSC Performance > Search results > clicks / 7, by week; split brand vs non-brand by query filter 'techplay'.
- **Source:** Google Search Console
- **Baseline:** 1–2 per day (2026-09-07). About 100 a day before the Cloudflare 403 incident of 17 Aug 2026 [R03, README §12].
- **31 Oct:** TARGET 15–30/day · **30 Nov:** TARGET 40–80/day · **31 Dec:** TARGET 60–120/day

### K03 — Google Discover clicks
*Discover* · Owner **ED** · Cadence: weekly · Events: none (external source)

- **Definition:** Clicks from Google Discover per week.
- **Formula:** GSC Performance > Discover > clicks, weekly. If the report shows no data, record 'below reporting threshold'.
- **Source:** Google Search Console (Discover report)
- **Baseline:** UNKNOWN — no GSC access in research (2026-09-27). Discover readiness partly met (max-image-preview:large present; some OG images multi-MB) [R03 §12].
- **31 Oct:** TARGET Discover report shows data (any clicks) · **30 Nov:** TARGET ≥ 3 articles with ≥ 100 Discover clicks each in November · **31 Dec:** TARGET Discover ≥ 20% of all Google clicks in December

### K04 — Google News visibility
*Google News* · Owner **ED** · Cadence: monthly (first Monday) · Events: none (external source)

- **Definition:** Whether TechPlay articles appear in Google News for topics it covered, plus News clicks where GSC reports them.
- **Formula:** Monthly probe: 16 own-topic Google News RSS searches (R03 method) → count of probes returning a TechPlay article; GSC 'News' search type clicks if available.
- **Source:** Google News RSS probe (manual, ED); GSC
- **Baseline:** 0 of 16 topics; 0 of 751 results (2026-09-27). site:techplay.gg News feed returned 99 game-database pages and 1 article [R02, R03].
- **31 Oct:** TARGET 0 game pages in the site: News feed (D-022) · **30 Nov:** TARGET ≥ 2 of 16 probes return a TechPlay article · **31 Dec:** TARGET ≥ 4 of 16

### K05 — Direct sessions
*Direct* · Owner **EIC** · Cadence: weekly · Events: `page_view`

- **Definition:** Sessions whose landing hit has no referrer and no UTM.
- **Formula:** COUNT(DISTINCT session) from analytics_events where the session's first hit has referrer_host IS NULL and (after D-008) utm_source IS NULL, is_bot = false (Q-03, raw table, 90-day window).
- **Source:** First-party collector (raw analytics_events)
- **Baseline:** UNKNOWN — run Q-03 (2026-09-27). Direct is not in analytics_daily_breakdowns (the referrer breakdown skips empty values); it must be read from raw rows.
- **31 Oct:** TARGET +20% vs W39 · **30 Nov:** TARGET +50% vs W39 · **31 Dec:** TARGET +50% vs W39

### K06 — Social referral sessions
*Social* · Owner **SC** · Cadence: weekly · Events: `page_view`, `cta_click`

- **Definition:** Sessions arriving from social platforms: referrer_host in the social host list, or utm_medium in (organic-social, paid-social, community) after D-008.
- **Formula:** COUNT(DISTINCT session) per week, by platform (Q-04). Paid-social reported separately.
- **Source:** First-party collector; GA4 (consented) for engagement
- **Baseline:** UNKNOWN — run Q-04 (2026-09-27). Social accounts: Discord 160, YouTube 20 subscribers, X/Facebook/Instagram counts unverified [R02].
- **31 Oct:** TARGET ×2 vs W39 · **30 Nov:** TARGET ×4 vs W39 · **31 Dec:** TARGET ×3 vs W39

### K07 — Verified registrations
*Registration* · Owner **EIC** · Cadence: weekly · Events: `registration_start`, `registration_complete`, `email_verified`

- **Definition:** New accounts that reached A1 Reachable (email verified or social sign-up) in the period.
- **Formula:** COUNT(users) WHERE created_at in period AND email_verified_at IS NOT NULL (Q-05), split by signup method and from= (after D-008).
- **Source:** Production DB (users); GA4 registration_complete for consented attribution
- **Baseline:** 60 users total (2026-09-07). 50 of 55 confirmed email (code comment, before 31 Aug) [R01, R12].
- **31 Oct:** TARGET 40–60 new in October · **30 Nov:** TARGET 70–120 new in November · **31 Dec:** TARGET 60–120 new in December

### K08 — Activation (A2 Shelved)
*Activation* · Owner **DEV** · Cadence: weekly (cohorts one week late) · Events: `library_connected`, `shelf_add`, `wizard_pick_done`

- **Definition:** Share of a registration cohort that links a platform OR has ≥ 3 shelf items within 7 days of sign-up (spine §3, R11 §6); plus the cumulative count of A2 members.
- **Formula:** A2 ÷ A0 for each weekly cohort, read 7 days after the cohort closes (Q-06); cumulative A2 members.
- **Source:** Production DB (connected_accounts, user_games)
- **Baseline:** 13 connected accounts of 60 users (21.7%) (2026-09-07). Stricter reading: 3 of 55 added a game and 2 linked a platform (before 31 Aug) [R12]. A2 itself: UNKNOWN until Q-06 runs.
- **31 Oct:** TARGET cohort A2 ≥ 30%; 35–50 A2 members · **30 Nov:** TARGET cohort A2 ≥ 35%; 60–80 A2 members · **31 Dec:** TARGET cohort A2 ≥ 40%; 100 A2 members (Founding 100, C68)

### K09 — Newsletter verified subscribers
*Newsletter* · Owner **SC** · Cadence: weekly; per send · Events: `newsletter_signup`, `newsletter_verified`

- **Definition:** Double-opt-in subscribers who asked (source = form), verified, active, not suppressed.
- **Formula:** COUNT(newsletter_subscribers) WHERE source = 'form' AND email_verified_at IS NOT NULL AND is_active (Q-07); net new = this week minus last week.
- **Source:** Production DB (newsletter_subscribers, mail suppression)
- **Baseline:** UNKNOWN — run Q-07 (2026-09-27). Count was never published; 'thousands of fans' copy is unverified [R11, R20]. Rows with source = 'account' are not subscribers.
- **31 Oct:** TARGET +60–120 net verified since 28 Sep · **30 Nov:** TARGET +200–400 net since 28 Sep · **31 Dec:** TARGET +330–650 net since 28 Sep

### K10 — Discord members
*Discord* · Owner **SC** · Cadence: weekly · Events: `discord_click`, `discord_join`

- **Definition:** Members in the TechPlay.gg Discord server.
- **Formula:** Bot guild.memberCount at Monday 09:00; joins by invite code from D-011.
- **Source:** Discord API via Professor Buffy
- **Baseline:** 160 members (24 online) (2026-09-27). A code comment gives 153 (undated) [R01]; use the API figure.
- **31 Oct:** TARGET 210–240 · **30 Nov:** TARGET 300–380 · **31 Dec:** TARGET 400–500 (C36 Road to 500)

### K11 — Returning users
*Returning users* · Owner **EIC** · Cadence: weekly · Events: `d1_return`

- **Definition:** Primary: returning members = accounts active on ≥ 2 distinct days in the week (last_seen_at / action dates). Secondary: GA4 returning users (consented visitors only, directional).
- **Formula:** Q-08 on accounts; GA4 Explore 'new vs returning' for the consented sample. The first-party collector cannot answer this: the visitor hash is re-salted nightly [README §19].
- **Source:** Production DB; GA4 (consented)
- **Baseline:** UNKNOWN — run Q-08 (2026-09-27). No returning-visitor count exists anywhere today [R12, R16 §4].
- **31 Oct:** TARGET 20–30 returning members/week · **30 Nov:** TARGET 40–60 · **31 Dec:** TARGET 55–80

### K12 — Pages per session
*Engagement* · Owner **ED** · Cadence: weekly · Events: `page_view`, `cta_click`

- **Definition:** Page views per session.
- **Formula:** SUM(pageviews) ÷ SUM(sessions) from analytics_daily (Q-02); segment by landing type (article, game, hub) from raw rows.
- **Source:** First-party collector; GA4 views per session (consented) as a cross-check
- **Baseline:** UNKNOWN — run Q-02 (2026-09-27). Sessions exist only for hits with a GA session id; check the share of hits without one (Q-09).
- **31 Oct:** TARGET +10% vs W39 · **30 Nov:** TARGET +20% vs W39 · **31 Dec:** TARGET +20% vs W39

### K13 — Member retention D7 / D30
*Retention* · Owner **DEV** · Cadence: weekly (D7), monthly (D30) · Events: `d1_return`, `shelf_add`, `reminder_set`

- **Definition:** Share of A2 members who perform a meaningful action on day 7 (days 6–8) and day 30 (days 28–32) after sign-up.
- **Formula:** Cohort query Q-10 over the WRM action union.
- **Source:** Production DB
- **Baseline:** UNKNOWN — run Q-10 (2026-09-27). Cohorts are tiny; report counts next to percentages.
- **31 Oct:** TARGET D7 ≥ 35% · **30 Nov:** TARGET D7 ≥ 40%; D30 ≥ 20% · **31 Dec:** TARGET D7 ≥ 45%; D30 ≥ 25%

### K14 — Approved comments
*Community* · Owner **SC** · Cadence: weekly · Events: `comment_created`, `comment_approved`

- **Definition:** Comments with status = approved created in the week, and the number of distinct commenters.
- **Formula:** COUNT(comments) WHERE status = 'approved' by created_at week; COUNT(DISTINCT user_id) (Q-11).
- **Source:** Production DB (comments)
- **Baseline:** 22 comments total (2026-09-07). 7 of 55 members had commented (before 31 Aug) [R12].
- **31 Oct:** TARGET 8–15/week from ≥ 5 commenters · **30 Nov:** TARGET 20–40/week from ≥ 12 commenters · **31 Dec:** TARGET 15–30/week from ≥ 12 commenters

### K15 — Social follower growth
*Social* · Owner **SC** · Cadence: weekly · Events: `social_share`

- **Definition:** Net new followers per platform per week (X, Instagram, Facebook, TikTok, YouTube, Threads, Bluesky, LinkedIn).
- **Formula:** Follower count Monday minus previous Monday, typed into the sheet by SC from each platform's own page.
- **Source:** Platform analytics (manual entry)
- **Baseline:** YouTube 20 subscribers; others UNVERIFIED — SC records all on 28 Sep (2026-09-27). Facebook and Instagram counts sit behind login walls; TikTok, Bluesky, LinkedIn accounts not found [R02].
- **31 Oct:** TARGET YouTube 40–60; every active platform shows net growth in ≥ 3 of 5 weeks · **30 Nov:** TARGET YouTube 80–150; X/IG/FB +20% vs 28 Sep · **31 Dec:** TARGET YouTube 120–250; X/IG/FB +40% vs 28 Sep

### K16 — Video views
*Video* · Owner **SC** · Cadence: weekly · Events: `cta_click`

- **Definition:** Views of TechPlay short and long videos per week, all platforms, and the median 7-day views per video.
- **Formula:** Sum of platform-reported views for videos published since 5 Oct; median of 7-day views per video; utm sessions per 1,000 views.
- **Source:** Platform analytics (TikTok, YouTube Studio, Instagram, Facebook); first-party utm sessions
- **Baseline:** 0 (no public videos found) (2026-09-27). YouTube channel joined 9 Feb 2026, 20 subscribers, no uploads visible [R02].
- **31 Oct:** TARGET ≥ 12 videos published; October median recorded as baseline · **30 Nov:** TARGET median 7-day views ≥ 2× October median · **31 Dec:** TARGET median 7-day views ≥ 3× October median; ≥ 1 session per 500 views

### K17 — Campaign CAC (paid)
*Paid* · Owner **EIC** · Cadence: weekly while spending · Events: `registration_complete`, `library_connected`

- **Definition:** Paid spend per activated (A2) member attributed to a paid campaign.
- **Formula:** Spend in period ÷ A2 members whose users.signup_utm_medium in (cpc, paid-social) (D-008). Reported per campaign (C56, C57, C58).
- **Source:** Ad platform spend exports; production DB
- **Baseline:** Not applicable — no paid spend before 19 Oct (2026-09-27). No ad pixel installed; collector drops UTMs today [R16].
- **31 Oct:** TARGET ≤ $25 per A2 member (ESTIMATE basis: $10 per verified registration ÷ 40% A2) · **30 Nov:** TARGET ≤ $25 per A2 member; stop any campaign above $60 · **31 Dec:** TARGET ≤ $20 per A2 member

### K18 — Cost per verified registration
*Paid* · Owner **EIC** · Cadence: weekly while spending · Events: `registration_complete`, `email_verified`, `newsletter_verified`, `discord_join`

- **Definition:** Paid spend per verified registration (A1) attributed to paid; companion costs per newsletter_verified and per Discord join.
- **Formula:** Spend ÷ verified registrations with paid signup UTM; spend ÷ newsletter_verified with paid UTM; spend ÷ discord_join by paid invite code.
- **Source:** Ad platform exports; production DB; D-011 join log
- **Baseline:** Not applicable — no paid spend before 19 Oct (2026-09-27). R16 §3: worth a second quarter under ~$10, stop above ~$25; newsletter < $8 (T9); Discord join < $3 (T4).
- **31 Oct:** TARGET ≤ $10 per verified registration (C56 only running) · **30 Nov:** TARGET ≤ $10; ≤ $8 per newsletter_verified; ≤ $3 per Discord join · **31 Dec:** TARGET ≤ $10; stop-loss $25

### K19 — Email complaint rate (guardrail)
*Guardrail* · Owner **SC** · Cadence: per send · Events: `newsletter_verified`

- **Definition:** Spam complaints per delivered email, per send.
- **Formula:** Complaints ÷ delivered for each campaign and automated stream.
- **Source:** Mail desk (mail_campaigns); provider feedback where available
- **Baseline:** UNKNOWN — complaints are not ingested (MailSuppression never records them) [R01 B.12] (2026-09-27). Self-hosted sender without Gmail reputation; DNS/SMTP changes need approval [R20].
- **31 Oct:** GUARDRAIL < 0.1% per send · **30 Nov:** GUARDRAIL < 0.1% per send · **31 Dec:** GUARDRAIL < 0.1% per send

### K20 — Unsubscribe rate (guardrail)
*Guardrail* · Owner **SC** · Cadence: per send · Events: none (external source)

- **Definition:** Unsubscribes per delivered email, per send.
- **Formula:** Unsubscribes attributed to a send ÷ delivered.
- **Source:** Mail desk
- **Baseline:** UNKNOWN — run per send (2026-09-27). Unsubscribe links are deliberately untracked; count via token use [R20].
- **31 Oct:** GUARDRAIL < 0.5% per send · **30 Nov:** GUARDRAIL < 0.5% per send · **31 Dec:** GUARDRAIL < 0.5% per send

### K21 — Giveaway-only account share (guardrail)
*Guardrail* · Owner **SC** · Cadence: per giveaway; weekly while live · Events: `giveaway_entered`, `giveaway_task_done`

- **Definition:** Share of accounts created through a giveaway that, 14 days later, have no action other than giveaway entry and tasks.
- **Formula:** Accounts with from=giveaway (D-008) and no WRM action 14 days after creation ÷ all from=giveaway accounts (Q-12).
- **Source:** Production DB
- **Baseline:** UNKNOWN; 21 of 55 members had entered a giveaway (before 31 Aug) (2026-09-27). 25-GIVEAWAYS sets ≤ 60% at close; paid giveaway traffic stops above 70% [R16 T13].
- **31 Oct:** GUARDRAIL ≤ 60% · **30 Nov:** GUARDRAIL ≤ 60% · **31 Dec:** GUARDRAIL ≤ 60%

### K22 — Comment moderation queue time (guardrail)
*Guardrail* · Owner **SC** · Cadence: weekly · Events: `comment_created`, `comment_approved`

- **Definition:** Median and maximum hours from comment_created to approval or rejection for pending comments.
- **Formula:** comments.updated_at − created_at where status moved from pending (Q-11b); needs an approved_at timestamp to be exact.
- **Source:** Production DB; Filament moderation
- **Baseline:** UNKNOWN — run Q-11b (2026-09-27). First three comments of every new member are held [R11 §1.3].
- **31 Oct:** GUARDRAIL max < 24 h · **30 Nov:** GUARDRAIL max < 24 h (GTA week: < 12 h) · **31 Dec:** GUARDRAIL max < 24 h

### K23 — Reminders set
*Product loop* · Owner **DEV** · Cadence: weekly · Events: `reminder_set`, `game_followed`

- **Definition:** Release reminders switched on per week (members and, after D-016, guests who registered through the modal).
- **Formula:** COUNT(user_games) WHERE notify_on_release switched on in the week (Q-13; needs an audit timestamp or the reminder_set event log).
- **Source:** Production DB; GA4 reminder_set
- **Baseline:** UNKNOWN — run Q-13 (2026-09-27). Reminders exist but are delivered to the bell only [R12].
- **31 Oct:** TARGET 30–60/week · **30 Nov:** TARGET 80–150/week (GTA VI release-time tool) · **31 Dec:** TARGET 40–80/week

### K24 — Alert delivered → visit rate
*Product loop* · Owner **DEV** · Cadence: weekly · Events: `reminder_delivered`, `alert_clicked`

- **Definition:** Share of delivered release-day, price-drop and personalised alerts (email, Discord DM, push) followed by a click-through within 24 hours.
- **Formula:** alert_clicked ÷ reminder_delivered per channel and alert type.
- **Source:** Mail click tracking; bot DM log; D-019 push log
- **Baseline:** Not applicable — no alert leaves the site before C43 (19 Oct) (2026-09-27). 20 of 22 notification types are bell-only [R01].
- **31 Oct:** TARGET ≥ 20% (first two weeks of C43) · **30 Nov:** TARGET ≥ 20% · **31 Dec:** TARGET ≥ 20%

### K25 — Index health of the priority set
*Organic search* · Owner **DEV** · Cadence: weekly · Events: none (external source)

- **Definition:** Share of priority URLs (articles, hubs, enriched game pages) that Google reports as indexed; Googlebot requests per day.
- **Formula:** GSC Pages report filtered to the priority sitemaps; GSC crawl stats requests/day.
- **Source:** Google Search Console
- **Baseline:** 56,355 indexed / 338,358 not; ~290 Googlebot requests/day (77 game pages) (2026-09-07). The total indexed count is not a goal; the priority set is [R03 §9].
- **31 Oct:** TARGET ≥ 80% of articles published since 28 Sep indexed · **30 Nov:** TARGET ≥ 90% of articles + hubs indexed · **31 Dec:** TARGET ≥ 90% of priority set indexed; crawl requests ≥ 2× 290/day

### K26 — Measurement health: EEA consent rate and attribution coverage
*Measurement health* · Owner **DEV** · Cadence: weekly · Events: none (external source)

- **Definition:** EEA/UK/CH share of visitors with analytics consent granted; share of registrations with a from/UTM value; share of Discord joins attributed to an invite code.
- **Formula:** Consented visitors ÷ visitors for EEA countries (collector consent column, Q-14); registrations with signup_from ÷ registrations; attributed joins ÷ joins.
- **Source:** First-party collector; production DB; D-011 join log
- **Baseline:** Consent 2–7% before 20 Sep; post-CMP UNKNOWN (2026-09-20). If EEA consent stays under 30%, EEA paid tests are read on first-party data only [R16 §4].
- **31 Oct:** REPORT only; attribution coverage ≥ 90% of registrations · **30 Nov:** REPORT; ≥ 90% · **31 Dec:** REPORT; ≥ 90%


## 5. Baseline and weekly queries

PostgreSQL, run read-only. Week boundaries are ISO weeks (Monday 00:00 to Sunday 23:59, Europe/Sarajevo). Table and column names were read from the migrations on 27 Sep 2026; DEV confirms before the first run.

**Q-01 WRM (approximation until D-007 server events exist).** Uses creation timestamps because `user_games.updated_at` is touched by the 30-minute Steam playtime refresh and would count people who did nothing.

```sql
WITH acts AS (
  SELECT user_id, created_at AS at FROM user_games
  UNION ALL SELECT user_id, updated_at FROM game_ratings WHERE is_draft = false
  UNION ALL SELECT user_id, created_at FROM comments
  UNION ALL SELECT user_id, updated_at FROM game_lists
  UNION ALL SELECT user_id, updated_at FROM user_wow_characters
)
SELECT count(DISTINCT user_id) AS wrm
FROM acts
WHERE at >= date_trunc('week', now()) - interval '7 days'
  AND at <  date_trunc('week', now());
```
Known gaps: reminder toggles and Discord XP have no timestamp table today; imports count as shelf adds. From D-007 onward Q-01 reads `growth_events` instead.

**Q-02 Traffic, pages per session (weekly).**
```sql
SELECT date_trunc('week', day) AS wk, sum(sessions) AS sessions, sum(pageviews) AS pageviews,
       round(sum(pageviews)::numeric / nullif(sum(sessions), 0), 2) AS pages_per_session,
       sum(bot_hits) AS bot_hits_set_aside, sum(consented_visitors) AS consented_visitor_days
FROM analytics_daily WHERE day >= '2026-09-21' GROUP BY 1 ORDER BY 1;
```

**Q-03 Direct sessions** (raw rows, first hit per session).
```sql
WITH first_hit AS (
  SELECT DISTINCT ON (session) session, referrer_host, occurred_at
  FROM analytics_events WHERE is_bot = false AND session IS NOT NULL
    AND occurred_at >= now() - interval '7 days'
  ORDER BY session, occurred_at)
SELECT count(*) FILTER (WHERE referrer_host IS NULL OR referrer_host = '') AS direct_sessions,
       count(*) AS all_sessions FROM first_hit;
```
After D-008 add `AND utm_source IS NULL` to the direct filter. If internal navigation carries `techplay.gg` as referrer, exclude it from "referred".

**Q-04 Social referral sessions.** Same `first_hit` CTE, grouped by `referrer_host` where it matches: `t.co`, `x.com`, `twitter.com`, `facebook.com`, `m.facebook.com`, `l.facebook.com`, `lm.facebook.com`, `instagram.com`, `l.instagram.com`, `reddit.com`, `old.reddit.com`, `out.reddit.com`, `youtube.com`, `m.youtube.com`, `tiktok.com`, `threads.net`, `bsky.app`, `linkedin.com`, `lnkd.in`, `discord.com`, `steamcommunity.com`, `store.steampowered.com`. After D-008: `utm_medium IN ('organic-social','community','paid-social')`.

**Q-05 Verified registrations per week.**
```sql
SELECT date_trunc('week', created_at) AS wk, count(*) AS registered,
       count(*) FILTER (WHERE email_verified_at IS NOT NULL) AS verified
FROM users WHERE created_at >= '2026-09-01' GROUP BY 1 ORDER BY 1;
```

**Q-06 A2 Shelved per weekly cohort.**
```sql
SELECT date_trunc('week', u.created_at) AS cohort, count(*) AS a0,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM connected_accounts c
                     WHERE c.user_id = u.id AND c.created_at < u.created_at + interval '7 days')
               OR (SELECT count(*) FROM user_games g
                     WHERE g.user_id = u.id AND g.created_at < u.created_at + interval '7 days') >= 3) AS a2
FROM users u GROUP BY 1 ORDER BY 1;
```

**Q-07 Newsletter verified subscribers (people who asked).**
```sql
SELECT count(*) FILTER (WHERE email_verified_at IS NOT NULL AND is_active) AS verified_active,
       count(*) FILTER (WHERE email_verified_at IS NULL) AS unverified
FROM newsletter_subscribers WHERE source = 'form';
```
Subtract addresses on the suppression list if they are not already `is_active = false`.

**Q-08 Returning members.** Q-01's `acts` CTE grouped by `user_id` and `date(at)` for the last 7 days; count users with ≥ 2 distinct dates. Add `users.last_seen_at` dates once D-007 records daily activity.

**Q-09 Session coverage by consent.**
```sql
SELECT substr(consent, 4, 1) = '1' AS analytics_granted,
       count(*) AS hits, count(*) FILTER (WHERE session IS NULL) AS hits_without_session
FROM analytics_events WHERE is_bot = false AND occurred_at >= now() - interval '7 days' GROUP BY 1;
```

**Q-10 D7 / D30 retention of A2 members.** For each A2 member, any action in Q-01's union on days 6–8 (D7) or 28–32 (D30) after `users.created_at`. Report `n` and `%`.

**Q-11 Comments.** `SELECT date_trunc('week', created_at), count(*) FILTER (WHERE status = 'approved'), count(DISTINCT user_id) FILTER (WHERE status = 'approved') FROM comments GROUP BY 1;`

**Q-11b Moderation queue.** Median and max of `updated_at - created_at` for comments that are no longer `pending` and were created as pending (needs `approved_at`, added under D-007; until then `updated_at` is the proxy).

**Q-12 Giveaway-only share.** Accounts whose first `giveaway_entries.created_at` is within 1 hour of `users.created_at` (until `signup_from` exists), with no row in Q-01's union in the 14 days after creation, ÷ all such accounts.

**Q-13 Reminders.** `SELECT count(*) FROM user_games WHERE notify_on_release;` recorded every Monday; the weekly difference is the net change. From D-007, `reminder_set` rows in `growth_events` give gross weekly adds.

**Q-14 EEA consent rate.**
```sql
SELECT country, count(DISTINCT visitor) AS visitor_days,
       count(DISTINCT visitor) FILTER (WHERE substr(consent, 4, 1) = '1') AS consented
FROM analytics_events
WHERE is_bot = false AND occurred_at >= now() - interval '7 days'
  AND country IN ('DE','FR','IT','ES','NL','PL','SE','AT','BE','HR','SI','GB','CH','IE','PT','DK','FI','CZ','RO','GR','HU','BG','SK','LT','LV','EE','LU','CY','MT','NO','IS','LI')
GROUP BY country ORDER BY visitor_days DESC;
```
The authoritative country list lives in nginx (`conf.d/zz-techplay-consent.conf`), not the repository; DEV copies it into this query.

## 6. Analytics events (Part 43)

### 6.1 How events flow

```
Browser ──gtag('event', name, params)──► /proxy/ga/g/collect (first-party relay)
                                          ├─► Google Analytics 4 (full params; consent-mode applies)
                                          └─► POST /api/v1/analytics/collect ─► analytics_events.event (+ params after D-008b)
Backend (controllers, jobs, observers) ──► growth_events table (D-007, server truth) + FunnelAnalytics::increment (Redis, 90 days)
Discord bot ──► POST /api/v1/discord/joins (D-011) ─► discord_joins table
```

Implementation notes for DEV (D-007, about 12 h):

1. **`frontend/lib/track.ts` stays the single registry.** Add a `GrowthEvent` union for the spine §10 names and `trackEvent(name, params)`, which calls `gtag('event', name, params)` only. Keep `track()` and the eight wizard events unchanged; they still POST to `/track/event` for signed-in members. Params are strings, numbers or booleans; no email, username, user id or free text.
2. **Guests are covered by the relay.** Because every gtag hit passes through `/proxy/ga`, the collector records the event name for all visitors, including EEA visitors who declined (Consent Mode sends cookieless pings; README §19 counted 2,094 denied (`gcs=G100`) hits on the relay on 8 Sep). D-008b adds a `params` JSON column holding only whitelisted keys (`method`, `from`, `platform`, `placement`, `cta_id`, `tool`, `type`, `network`, `content_type`, `status`, `channel`, `campaign`), so first-party counts can be split without GA.
3. **Server truth in one table.** New `growth_events` (`id`, `user_id` nullable, `event`, `params` json, `occurred_at`), written by the controllers and jobs named in §6.2 through one `GrowthEvents::record()` helper that also calls `FunnelAnalytics::increment()`. Retained for 400 days so December can be compared with next year. This is a schema change: the Baza section of `docs/README.md` is updated in the same commit (CLAUDE.md rule).
4. **New-account signal for social sign-ups.** `SocialAuthController`, `GoogleAuthController`, `BattleNetAuthController` (and the Steam sign-in from D-015) append `&new=1&method=<provider>` to the `/auth/callback` redirect when `wasRecentlyCreated`; `app/auth/callback/page.tsx` fires `registration_complete` once.
5. **First touch (D-008a, about 6 h).** On landing, the frontend keeps `from` and the five UTM values from the URL in `sessionStorage` (`tp_ft`, the landing values only, no identifier) and sends them with `POST /auth/register`, the social redirect `state`, and `POST /newsletter/subscribe`. The backend stores `signup_from`, `signup_utm_source`, `signup_utm_medium`, `signup_utm_campaign`, `signup_utm_content` on `users`, and `placement`, `from`, `utm_campaign` on `newsletter_subscribers`. Open question for EIC: whether this landing-only session storage needs a line in the privacy policy (§11).
6. **GA4 admin (EIC, 1 h, by 16 Oct).** Mark the seven key events in §6.3; register event-scoped custom dimensions for the params in note 2; create a custom channel group keyed on our `utm_medium` values so `organic-social`, `community`, `creator`, `partner` and `qr` are not left in "Unassigned".
7. **QA (SC, 1 h, 16 Oct).** GA4 DebugView plus a collector query for each event on phone and desktop, in a consented US session and a declined EEA session (VPN not required: GA's own debug parameter and the collector's `country` column are enough to confirm the path).

### 6.2 Event specification

Side: C = client (gtag, so also the collector), S = server (`growth_events`), B = bot. Key = GA4 key event.

| Event | Trigger (fires when…) | Params | Side | Where in the repo | Key | Dedupe rule | Privacy | D-ID |
|---|---|---|---|---|---|---|---|---|
| `registration_start` | first focus on a /register field, or first click on a social/Steam button | `method`, `from` | C | `frontend/app/(auth)/register/RegisterClient.tsx`, `components/auth/GoogleSignInButton.tsx` | no | once per page view (ref guard) | no PII | D-007 |
| `registration_complete` | email path: 201 from `POST /auth/register`; social: `/auth/callback` with `new=1` | `method` (email, google, discord, battlenet, steam), `from` | C + S | `RegisterClient.tsx`, `frontend/app/auth/callback/page.tsx`; `AuthController::register`, `SocialAuthController`, `GoogleAuthController`, `BattleNetAuthController` | **yes** | server writes once per user; client guard `sessionStorage tp_reg_done` | never send email or username; no GA User-ID | D-007, D-008a |
| `email_verified` | `email_verified_at` set by the verify link; client fires on `/verify-email` when polling returns verified | `method=email` | C + S | `VerificationController::verify`; `frontend/app/(auth)/verify-email/page.tsx` | **yes** | once per account (server column) | social sign-ups are verified on creation and counted in the DB, not re-fired | D-007 |
| `library_connected` | first successful link of a platform (not a reconnect) | `platform` (steam, xbox, psn, gog, epic), `first` (true if the member's first platform) | S (+C on success screen) | `ConnectedAccountController` (steam/xbox callbacks already call `FunnelAnalytics::increment`), PSN/GOG/Epic connect handlers; `components/settings/ConnectedAccountsSection.tsx`, `components/profile/WelcomeOnboarding.tsx` | **yes** | `wasRecentlyCreated` only | platform ids never leave the backend | D-007 |
| `shelf_add` | a new `user_games` row created by a manual action | `status`, `source` (manual) | C + S | `GameCollectionController::upsert`; `components/games/TrackGameButton.tsx` | no | new row only; status changes are not shelf adds; imports write one `library_import` summary row, not one per game | game slug allowed, no user data | D-007 |
| `game_followed` | "Follow" / "Remind me" on a game (D-016); until D-016, wishlist status set | `from`, `guest` (true if it started as a guest) | C + S | `TrackGameButton.tsx`, D-016 modal; `GameCollectionController::upsert` | no | once per user per game | — | D-016, D-007 |
| `reminder_set` | release reminder switched on | `from`, `channel_pref` (bell, email, discord, push) | C + S | `CalendarController::toggleReminder`; `frontend/hooks/useReleaseReminder.ts`; `ReleaseClient.tsx` | **yes** | once per user per game (toggle off/on does not re-count within 24 h) | — | D-007 |
| `reminder_delivered` | a release-day, price-drop or personalised alert is sent | `channel` (email, discord, push, bell), `type` | S | `SendReleaseReminders` job, `wishlist:check-releases`, C41/C43 senders (D-013, D-027, D-028) | no | one per user per game per channel per day | recipient list never exported | D-013 |
| `alert_clicked` | click on an alert link | `channel`, `type` | S (+C on landing with `utm_campaign` c41/c43/c59) | `MailTrackingController` signed redirect; bot DM links; push click handler | no | first click per alert | click logs keep user id 90 days | D-013, D-019 |
| `newsletter_signup` | 200 from `POST /newsletter/subscribe` | `placement` (home, article-end, hub-sidebar, gta6, game-page, newsletter-page, frontiers, discord-welcome, giveaway), `from` | C + S | `components/editorial/SectionHub.tsx`, `components/gta6/Gta6NewsletterCTA.tsx`, `FrontiersClient.tsx`, new `/newsletter` (D-012); `NewsletterController::subscribe` | no | one per address per 24 h | address never sent to GA | D-007, D-012 |
| `newsletter_verified` | token accepted and the row was not already verified | `placement` | C + S | `frontend/app/newsletter/verify/page.tsx`; `NewsletterController::verify` (return `newly_verified`) | **yes** | once per address | — | D-007 |
| `comment_created` | `CommentController::store` succeeds | `status` (pending, approved), `content_type` | C + S | `components/comments/CommentsSection.tsx`; `CommentController::store` | no | one per comment id | comment text never sent | D-007 |
| `comment_approved` | a pending comment becomes approved | `hours_in_queue` | S | comment moderation in Filament / comment observer; add `approved_at` | no | one per comment | — | D-007 |
| `rating_created` | new non-draft rating | `from` | C + S | `components/games/GameRating.tsx`; `GameRatingController::upsert` | no | first rating per user per game | — | D-007 |
| `list_created` | new game list | `from` | C + S | `components/games/AddToListButton.tsx`; `GameListController::store` | no | one per list id | list title not sent | D-007 |
| `discord_click` | click on any Discord invite link | `placement`, `campaign`, `invite_code` | C | one shared `DiscordLink` component used by `Footer.tsx`, `DiscordWidget.tsx`, `Gta6NewsletterCTA.tsx`, `RoadmapCTA.tsx`, `StillNeedHelp.tsx`, giveaway `discord_join` task, D-010 block | **yes** | none (clicks) | — | D-004, D-007 |
| `discord_join` | a member joins the server | `invite_code` (or `oauth`, `unknown`, `ambiguous`) | B | `discord/src/handlers/events.ts` GuildMemberAdd + invite cache (§7.5) → `POST /discord/joins` | n/a (not in GA) | one per Discord user per 30 days | Discord user id stored hashed for unlinked members; code-level counts kept | D-011 |
| `giveaway_entered` | first entry of a user into a giveaway | `giveaway`, `method`, `from` | C + S | `app/giveaway/[slug]/GiveawayClient.tsx`; `GiveawayController::enter` | **yes** (reported apart from registrations) | first entry only; daily bonus and tasks are not entries | no IP in growth_events (the entry row keeps its own) | D-007 |
| `giveaway_task_done` | a giveaway task is verified | `task_type` | S | `GiveawayController` task completion | no | one per user per task | — | D-007 |
| `social_share` | click on a share control or native share | `network`, `content_type` | C | `components/share/SocialShare.tsx`, `components/profile/ShareCard.tsx`, Last Disc `ShareRow.tsx`, `GiveawayClient.tsx` | no | one per page view per network | intent clicks only; completion is not visible | D-007 |
| `notification_enabled` | browser push permission granted after "Notify me" | `topic` | C + S | service worker and prompt (D-019) | no | one per browser per topic | push endpoint stored server-side only | D-019 |
| `tool_run` | a tool returns a result | `tool` (wow, backlog, release-time, calc), `guest` | C (+S for wow, backlog) | `components/wow/WowAnalyzerClient.tsx`, `app/backlog-advisor/AdvisorClient.tsx`, release-time tool (D-018), calculator (D-037); `WowAnalyzerController`, `BacklogAdvisorController` | no | one per result (not per retry within 60 s) | character names never sent to GA | D-007, D-018, D-037 |
| `profile_completed` | the three-item checklist is done: platform linked or 3 shelf items, one reminder, avatar or favourite | none | S | `ProfileChecklist.tsx` state computed server-side | no | once per account | — | D-007 |
| `share_card_generated` | Save or Share on a generated card | `type` (gamer-dna, library-worth, profile, list, yir, predictions) | C | `ShareCard.tsx`, D-024 cards, D-025 year in review | no | one per card type per day | card images show only what the member made public | D-024 |
| `d1_return` | account aged 24–48 h returns | none | C (existing) + S | `lib/track.ts trackD1Return`; server version from `growth_events` | no | existing localStorage guard; server: one per account | — | existing, D-007 |
| `search_performed` | search submitted or a result selected | `section`, `results_bucket` (0, 1–5, 6+) | C | `components/layout/SearchDropdown.tsx` | no | debounce 1 s; one per query | query text is not sent to GA (it can contain personal data); `analytics:game_search` keeps it server-side | D-007 |
| `cta_click` | click on any tracked CTA | `cta_id` | C | `JoinPrompt.tsx`, `HomeHero.tsx`, `ProfileCtaBand.tsx`, D-010 article-end block, D-016 modal, register buttons | no | none | — | D-007 |

`cta_id` format: `<surface>-<action>[-<variant>]`, lower-case with hyphens, for example `article-end-newsletter`, `article-end-join-game`, `hero-start-library`, `reg-google`, `leaderboard-empty-connect` (the `reg-*` ids match 15-REGISTRATION). `from` values are the list in 15-REGISTRATION §6.

### 6.3 GA4 key events

`registration_complete`, `email_verified`, `library_connected`, `reminder_set`, `newsletter_verified`, `discord_click`, `giveaway_entered`. Import into Google Ads only when C56 runs, and only `registration_complete` and `newsletter_verified` as conversions; Meta receives the same two through CAPI after D-031 (hashed email, shared `event_id` for deduplication with the pixel, never in denied-consent regions [R16 §4]).

**Naming decision.** R16 proposed GA4's recommended `sign_up` and `newsletter_submit`; the spine's `registration_complete` and `newsletter_signup` are canonical. We do not send both, because two events for one action double-count in every report.

## 7. UTM system (Part 44)

### 7.1 Rules

1. **UTMs go on links that leave our control only**: social posts, emails, pushes, Discord posts, partner and creator links, ads, QR codes. **Never on internal links**, which would restart the GA session and overwrite the real source. Internal markers use `from=` (15-REGISTRATION §6).
2. Lower-case, hyphens only, no spaces, no underscores except inside a subreddit name in `utm_term`.
3. `utm_campaign` is the business campaign the destination belongs to (spine §8 ID + slug), not the production system. A Fix It Friday short for the PC Fix Hub is `c60-pc-fix-hub`, not `c49-vertical-video`. C49 and C50 are used only when the video itself is the campaign (platform tests, the long-form pilot).
4. Newsletter issues are `c40-save-file-2026wNN` (ISO week of the send). Automated product mail uses `utm_source=email`; The Save File uses `utm_source=newsletter`.
5. Meta ads use `utm_source=facebook` for every Meta placement, with the placement in `utm_content` if needed; organic Instagram posts use `utm_source=instagram`.
6. A member's own share of a card or list: `utm_source=<network>`, `utm_medium=referral`, campaign of the feature. Our own posts are `organic-social`.
7. Every URL is built in the builder (sheet now, D-009 admin helper from 16 Oct) and logged with date and owner. No hand-typed UTMs.
8. `utm_term` only for `cpc`, `paid-social` and Reddit (subreddit name without `r/`).

### 7.2 Allowed values (spine §9)

| Parameter | Allowed |
|---|---|
| `utm_source` | google, facebook, instagram, tiktok, youtube, x, threads, bluesky, reddit, discord, newsletter, email, push, linkedin, steam, `creator-<handle>`, `partner-<name>`, `pr-<outlet>` |
| `utm_medium` | organic-social, community, email, push, paid-social, cpc, referral, pr, creator, partner, qr |
| `utm_campaign` | `c<01–71>[a-z]?-<slug>` |
| `utm_content` | `<franchise f01–f24 or asset>-<variant>` |
| `utm_term` | audience, subreddit or keyword; paid and Reddit only |

### 7.3 Validator

Regexes (used in the sheet with `REGEXMATCH`, in D-009's PHP helper and in D-008 before a value is stored; an invalid value is stored in `utm_invalid` so mistakes are visible rather than silently lost):

```
utm_source   ^(google|facebook|instagram|tiktok|youtube|x|threads|bluesky|reddit|discord|newsletter|email|push|linkedin|steam|(creator|partner|pr)-[a-z0-9]+(-[a-z0-9]+)*)$
utm_medium   ^(organic-social|community|email|push|paid-social|cpc|referral|pr|creator|partner|qr)$
utm_campaign ^c(0[1-9]|[1-6][0-9]|7[01])[a-z]?-[a-z0-9]+(-[a-z0-9]+)*$
utm_content  ^[a-z0-9]+(-[a-z0-9]+)+$
utm_term     ^[a-z0-9_]+(-[a-z0-9_]+)*$
```

Cross-field rules (checked by the same helper):

| If | Then |
|---|---|
| `utm_medium=cpc` | `utm_source=google`; `utm_term` required |
| `utm_medium=paid-social` | source in facebook, instagram, reddit, tiktok, youtube; `utm_term` required; date on or after 19 Oct 2026 |
| `utm_medium=email` | source is newsletter or email |
| `utm_medium=push` | source is push or discord (Discord DM alerts) |
| source starts `creator-` / `partner-` / `pr-` | medium is creator / partner or qr / pr |
| `utm_medium=qr` | `utm_content` starts `qr-` |
| `utm_source=newsletter` | campaign matches `^c40-save-file-2026w(4[0-9]|5[0-3])$` or a c40 special |
| any | whole URL ≤ 300 characters; host is techplay.gg |

JavaScript version for the builder (D-009):

```js
const RX = {
  utm_source: /^(google|facebook|instagram|tiktok|youtube|x|threads|bluesky|reddit|discord|newsletter|email|push|linkedin|steam|(creator|partner|pr)-[a-z0-9]+(-[a-z0-9]+)*)$/,
  utm_medium: /^(organic-social|community|email|push|paid-social|cpc|referral|pr|creator|partner|qr)$/,
  utm_campaign: /^c(0[1-9]|[1-6][0-9]|7[01])[a-z]?-[a-z0-9]+(-[a-z0-9]+)*$/,
  utm_content: /^[a-z0-9]+(-[a-z0-9]+)+$/,
  utm_term: /^[a-z0-9_]+(-[a-z0-9_]+)*$/,
};
const invalid = (p) => Object.keys(RX).filter((k) => p[k] !== undefined && !RX[k].test(p[k]));
```

### 7.4 Worked examples (32)

| # | Campaign | Placement | URL |
|---|---|---|---|
| 1 | C04 / F01 | Instagram carousel, Story link sticker (Mon) | `https://techplay.gg/calendar?utm_source=instagram&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-carousel-a` |
| 2 | C04 / F01 | X post with carousel image | `https://techplay.gg/calendar?utm_source=x&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-post-a` |
| 3 | C04 / F01 | TikTok bio link during the week | `https://techplay.gg/calendar?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-short-w41` |
| 4 | C06 / F02 | Instagram Story, 5 Oct (45 days to go) | `https://techplay.gg/gta6?utm_source=instagram&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-day45-story` |
| 5 | C06 / F02 | Discord #gta6 daily post | `https://techplay.gg/gta6?utm_source=discord&utm_medium=community&utm_campaign=c06-gta6-countdown&utm_content=f02-day45-post` |
| 6 | C07 / F03 | X thread, Thursday ledger update (W41) | `https://techplay.gg/gta6/everything-we-know?utm_source=x&utm_medium=organic-social&utm_campaign=c07-gta6-ledger&utm_content=f03-thread-w41` |
| 7 | C07 / F03 | Reddit comment where the ledger answers the question | `https://techplay.gg/gta6/everything-we-know?utm_source=reddit&utm_medium=community&utm_campaign=c07-gta6-ledger&utm_content=f03-comment-a&utm_term=gta6` |
| 8 | C08 | Release-time tool link in The Save File, 16 Oct | `https://techplay.gg/gta6/release-time?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w42&utm_content=gta6-release-time-link` |
| 9 | C40 / F21 | First issue, top story link, 2 Oct | `https://techplay.gg/news?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w40&utm_content=f21-top-story-1` |
| 10 | C41 | Personalised releases email, first send 26 Oct | `https://techplay.gg/calendar?utm_source=email&utm_medium=email&utm_campaign=c41-your-releases-2026w44&utm_content=game-card` |
| 11 | C43 | Release-day alert email | `https://techplay.gg/games/grand-theft-auto-vi?utm_source=email&utm_medium=email&utm_campaign=c43-release-alerts&utm_content=release-day-a` |
| 12 | C43 | Release-day Discord DM | `https://techplay.gg/games/grand-theft-auto-vi?utm_source=discord&utm_medium=push&utm_campaign=c43-release-alerts&utm_content=dm-release-day` |
| 13 | C59 | Web push on release day | `https://techplay.gg/games/grand-theft-auto-vi?utm_source=push&utm_medium=push&utm_campaign=c59-web-push&utm_content=reminder-release-day` |
| 14 | C42 | Welcome email 2, connect Steam | `https://techplay.gg/settings?utm_source=email&utm_medium=email&utm_campaign=c42-welcome&utm_content=email2-connect-steam` |
| 15 | C05 / F16 | Facebook image post, wishlist picks | `https://techplay.gg/news?utm_source=facebook&utm_medium=organic-social&utm_campaign=c05-steam-autumn-sale&utm_content=f16-image-a` |
| 16 | C18 / F23 | TikTok short, Next Fest diary day 1 | `https://techplay.gg/news?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c18-next-fest-tracker&utm_content=f23-day1-short` |
| 17 | C60 / F07 | YouTube Shorts description, shader stutter fix | `https://techplay.gg/guides/pc-fixes?utm_source=youtube&utm_medium=organic-social&utm_campaign=c60-pc-fix-hub&utm_content=f07-short-shader-stutter` |
| 18 | C50 | Long-form video description, 12 Nov | `https://techplay.gg/gta6?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-youtube-longform&utm_content=gta-in-order-description` |
| 19 | C13 / F15 | Reddit answer in r/wow linking the Analyzer | `https://techplay.gg/wow-analyzer?utm_source=reddit&utm_medium=community&utm_campaign=c13-wow-readiness&utm_content=f15-answer-a&utm_term=wow` |
| 20 | C20 | Link in the press release sent to an outlet (replace outletname per pitch) | `https://techplay.gg/data/release-congestion-2026?utm_source=pr-outletname&utm_medium=pr&utm_campaign=c20-release-congestion&utm_content=press-release-link` |
| 21 | C48 | Reddit data post in r/gamedev | `https://techplay.gg/data/release-congestion-2026?utm_source=reddit&utm_medium=community&utm_campaign=c48-reddit-data-posts&utm_content=c20-chart-post&utm_term=gamedev` |
| 22 | C51 | Creator credit link under a chart (replace handle) | `https://techplay.gg/data/release-congestion-2026?utm_source=creator-handle&utm_medium=creator&utm_campaign=c51-creator-data&utm_content=chart-credit-link` |
| 23 | C55 | QR on a flyer at a partner event | `https://techplay.gg/studios/country/ba?utm_source=partner-a1-adria&utm_medium=qr&utm_campaign=c55-balkan-partners&utm_content=qr-flyer-a` |
| 24 | C56 | Google Ads final URL suffix, branded RSA | `https://techplay.gg/?utm_source=google&utm_medium=cpc&utm_campaign=c56-google-branded&utm_content=rsa-a&utm_term=techplay` |
| 25 | C57 | Meta ad, library-import demo (T2) | `https://techplay.gg/register?from=paid-meta&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57-meta-registration&utm_content=t2-wizard-demo-15s-a&utm_term=us-18-44-broad` |
| 26 | C58 | Reddit Conversation Placement, GTA 6 map (T4) | `https://techplay.gg/gta6/map?utm_source=reddit&utm_medium=paid-social&utm_campaign=c58-reddit-hub-test&utm_content=t4-conversation-a&utm_term=gta6` |
| 27 | C58 | Reddit ad, WoW Analyzer result (T5) | `https://techplay.gg/wow-analyzer?utm_source=reddit&utm_medium=paid-social&utm_campaign=c58-reddit-hub-test&utm_content=t5-result-screenshot&utm_term=wow` |
| 28 | C69 | Steam Curator review link | `https://techplay.gg/reviews?utm_source=steam&utm_medium=referral&utm_campaign=c69-steam-curator&utm_content=curator-review-link` |
| 29 | C29 / F12 | Threads post opening the prediction league | `https://techplay.gg/awards/2026?utm_source=threads&utm_medium=organic-social&utm_campaign=c29-prediction-league&utm_content=f12-post-a` |
| 30 | C28 | Member shares a year-in-review card on X | `https://techplay.gg/year-in-review?utm_source=x&utm_medium=referral&utm_campaign=c28-your-2026&utm_content=yir-card-share` |
| 31 | C37 / F11 | Facebook question post, What Are You Playing? | `https://techplay.gg/forum?utm_source=facebook&utm_medium=organic-social&utm_campaign=c37-what-are-you-playing&utm_content=f11-question-a` |
| 32 | C66 | LinkedIn post on the Last Disc survey | `https://techplay.gg/last-disc?utm_source=linkedin&utm_medium=organic-social&utm_campaign=c66-last-disc&utm_content=post-a` |

### 7.5 Discord invite codes

- **Default invite:** `https://discord.gg/wPQG9gUMXH` is the only working public invite today and stays the fallback for the footer and any link without a campaign (spine §0). `discord.gg/techplaygg` and `discord.gg/techplay` are dead and are removed by D-004.
- **Campaign invites:** SC creates one extra invite per campaign and placement (never-expiring, unlimited uses, landing in the channel the campaign is about, for example `#gta6`). Discord generates the code; we cannot choose it (no vanity URL [R13]). Each code is tested with the invite API before it is published and logged in the **Invites** tab:

| Column | Example |
|---|---|
| code | (Discord-generated) |
| url | https://discord.gg/(code) |
| campaign | c06-gta6-countdown |
| placement | instagram-story-link |
| landing channel | #gta6 |
| created by / on | SC / 1 Oct 2026 |
| status | live, retired (never delete a code that is printed or in old posts) |
| joins this week / to date | from the D-011 log |

- **Site CTAs** use the default invite plus a `discord_click` event carrying `placement` and `campaign`; D-010's article-end line and the sidebar widget get their own codes for X-028.
- **Bot attribution (D-011, about 8 h).** Add `GatewayIntentBits.GuildInvites` in `discord/src/index.ts` (the bot currently requests Guilds, GuildMessages, GuildMembers, MessageContent, GuildPresences) and grant the bot Manage Server so it can read invites. On `ClientReady`, cache `guild.invites.fetch()` as code → uses; update the cache on `InviteCreate` and `InviteDelete`. In the existing `GuildMemberAdd` handler (`setupGuildMembership` in `handlers/events.ts`), fetch invites again and find the code whose `uses` rose by one. Exactly one → that code; none → `oauth` if the member arrived through the site's Discord sign-in (`guilds.join`) within the last 5 minutes, else `unknown`; two or more → `ambiguous`. Report to a new `POST /api/v1/discord/joins` using the bot's existing API token. The join log also gives the 7-day "posted at least once" rate used in X-027 (count messages per new member for 7 days, no content stored).
- **Reddit, creators and partners** always get their own code; a post on Reddit that links Discord uses the Reddit campaign's code.

### 7.6 QR codes

- Used only where a person is physically present: C55 Balkan partner events and meetups, printed flyers for the C21 census, and any conference badge or sticker. Not on screens that already have a link.
- Encode the full UTM URL directly (no shortener, no redirect that waits for a deploy [R01 F38]); `utm_medium=qr`, `utm_source=partner-<name>` or `pr-<outlet>`, `utm_content=qr-<placement>-<variant>`.
- Error correction level M, at least 2 × 2 cm printed, dark on light, with the human-readable path printed under it (for example `techplay.gg/studios/country/ba`).
- Test on two phones (iOS camera, Android camera) before printing; log in the UTM tab with print quantity and where it was placed.

## 8. Weekly dashboard

### 8.1 Phase 1 — the growth sheet (from Mon 5 Oct; SC, about 1 h each Monday)

| Tab | Rows | Columns | Filled by |
|---|---|---|---|
| KPIs | K00–K26 | ISO weeks W39–W53 (value, source, note), TARGET column for each checkpoint, traffic-light (on track ≥ 90% of the pro-rated target, watch 70–90%, off < 70%) | SC from Q-queries (DEV pastes until automated), GSC export (ED), platform counts (SC) |
| Funnel | sessions → registration_start → registration_complete → email_verified → A2 → A3 | by week and by `from` / `utm_campaign` | collector + DB |
| Campaigns | one row per `utm_campaign` live that week | sessions, registrations, newsletter verified, Discord joins by code, spend, cost per verified action | collector (after D-008), DB (after D-008a), ad exports |
| Channels | X, Instagram, Facebook, TikTok, YouTube, Threads, Bluesky, LinkedIn, Reddit, Steam Curator, Discord | followers, posts, utm sessions, notes | SC |
| Newsletter | each send | delivered, unique clicks, click rate, unsubscribes, complaints, list size | SC from the mail desk |
| Experiments | X-IDs running | start, end, metric, current count, threshold, decision | SC; EIC decides |
| Invites | §7.5 | — | SC |
| UTM log | every URL built | date, owner, campaign, URL, validator result | builder |
| Annotations | dated events | releases, sales, outages, algorithm updates, deploys | anyone |

### 8.2 Phase 2 — Filament "Growth" page (D-008c, by Fri 13 Nov; DEV about 10 h)

Location: next to **System → Analitika** in Filament. Widgets:

1. WRM line chart (13 weeks) with the TARGET band.
2. Funnel table for the last complete week, by `signup_from` and by `signup_utm_campaign` (includes the registration widget 15-REGISTRATION calls D-007a).
3. Campaign table: sessions (collector UTM), registrations, A2, newsletter verified, Discord joins, with bot hits set aside shown.
4. Loops: reminders set, alerts delivered, alert → visit rate by channel.
5. Guardrails: last send's complaint and unsubscribe rates, giveaway-only share, oldest pending comment age (red above 24 h).
6. Measurement health: EEA consent rate, share of hits without session, share of registrations with a `from` value, share of joins attributed.

A Monday 05:30 command `growth:snapshot` writes one row per KPI per week to `growth_weekly` so history survives the 90-day raw-hit prune and the Redis TTL. Schema change: README Baza updated in the same commit.

## 9. Monday review ritual

**When:** every Monday 11:00–11:45 CET, after F01 Out This Week is published. First review Mon 5 Oct. Monthly deep-dive on the first Monday (2 Nov, 7 Dec, 4 Jan) runs 75 minutes.
**Who:** EIC (chair, decides), SC (runs the sheet), DEV (data and measurement health). ED joins the monthly deep-dive and any week with an SEO item. DS is not required.
**Prep:** SC 09:00–10:00 fills the sheet; DEV 30 minutes for queries until D-008c automates them.

| Minute | Item | Output |
|---|---|---|
| 0–5 | North Star: WRM this week vs last and vs TARGET band | one sentence in the log |
| 5–15 | Funnel: registrations by method and `from`, A2 of the cohort closed last week, verification rate | the one leak to work on this week |
| 15–25 | Channels and campaigns: top 3 and bottom 3 `utm_campaign` rows by verified actions, not by sessions | keep / change / stop per campaign |
| 25–35 | Experiments: which reached their minimum count; read against the threshold in 31; start the next from the queue | decisions logged with X-ID |
| 35–40 | Guardrails and measurement health | any red item gets an owner and a date |
| 40–45 | Actions: at most three, each with owner and due date | entered in the sheet |

Rules: no decision on less than 14 days of data unless a stop-loss triggers; compare like with like (same weekdays, annotate GTA VI week, Steam sales and deploys); counts beside rates; a metric that cannot be measured is written as UNKNOWN in the log, not guessed. Capacity: about 3 h a week in total (EIC 0.75, SC 1.75, DEV 0.5–1), inside the spine §1 budget.

**Monthly deep-dive additions:** cohort retention (K13), target recalibration (2 Nov), channel keep-or-kill against 31's thresholds, a check of every public number on the site against the API (spine §0), and a review of the UTM log for invalid values.

## 10. C03 Measurement Foundation timeline

| Dates | Item | Owner | Hours (ESTIMATE) | Done when |
|---|---|---|---|---|
| 28 Sep–2 Oct | Baselines (§3); D-004 dead invites replaced | DEV, ED, SC | 5 | Baseline tab complete; no dead invite in the build |
| 28 Sep–2 Oct | UTM builder sheet with validator; Invites tab; first campaign codes (C06, C35, C40) | SC | 2 | Every post from W40 uses a logged URL |
| 29 Sep–9 Oct | D-007 client events, `growth_events`, social `new=1` flag | DEV | 12 | All §6.2 C/S events visible in DebugView and the table |
| 5–14 Oct | D-008 collector UTM columns + campaign breakdown; D-008a first touch; D-008b params | DEV | 16 | A tagged test visit appears in the campaign breakdown and on the test user row |
| 5–16 Oct | D-011 bot invite attribution | DEV | 8 | A test join through a new code is logged with that code |
| 12–16 Oct | D-009 admin URL helper (replaces the sheet builder for mail and ads) | DEV | 4 | Campaign desk links carry validated UTMs |
| 16 Oct | GA4 key events, custom dimensions, channel group; QA pass | EIC, SC | 2 | QA checklist signed; paid gate may open on 19 Oct |
| by 30 Oct | D-031 Pixel + CAPI behind consent (before C57 on 2 Nov) | DEV | 10 | Pixel absent in denied regions; CAPI test events deduplicated |
| by 13 Nov | D-008c Filament Growth page + `growth:snapshot` | DEV | 10 | Monday review runs from Filament |

DEV total about 60 h across seven weeks, competing with C01/C02 fixes and C44 registration work in the same weeks. If DEV has less than 20 h a week free for this, D-008b and D-008c move right; D-007, D-008 and D-008a do not, because every paid test and most experiments in 31 depend on them.

## Dependencies and open questions

- **D-IDs used:** D-001, D-003, D-004, D-005, D-007, D-008, D-009, D-010, D-011, D-012, D-013, D-016, D-017, D-018, D-019, D-021, D-022, D-024, D-025, D-027, D-028, D-031, D-036, D-037, D-039. **New sub-items proposed:** D-008a (first-touch columns on `users` and `newsletter_subscribers`), D-008b (whitelisted event params in the collector), D-008c (Filament Growth page and weekly snapshot), and `growth_events` inside D-007. All four change the schema and need the README Baza update in the same commit.
- **Conflicts with research, resolved in favour of the spine:** R16 §4 proposed `utm_source=meta`, `utm_medium=paid_social` and `utm_campaign=reg-gta6hub-202610`; spine §9 uses `facebook`, `paid-social` and `c57-…`. R16 named `sign_up` and `newsletter_submit`; spine §10 uses `registration_complete` and `newsletter_signup`. R12 §4 defined activation as ≥ 5 shelf entries; the spine and R11 use ≥ 3 (A2), which K08 follows.
- **Spine tension:** §0 says wPQG9gUMXH is the only working invite and §9 asks for one invite per campaign. Both hold: the default stays, and campaign codes are added only after an invite-API check.
- **Open (EIC):** does landing-only `sessionStorage` of `from`/UTM values need a privacy-policy line? The collector itself needs no consent because it stores no identifier; this is a separate, functional storage question.
- **Open (DEV):** whether declined-consent pings carry a stable `sid` (Q-09). If not, sessions and pages per session describe consented traffic only and K12 is labelled accordingly.
- **Open (DEV):** reminders have no change timestamp; K23 is a net weekly delta until `reminder_set` rows exist.
- **Open (SC):** newsletter list size and campaign history since 11 Sep are UNKNOWN [R20]; K09 and paid test T12 wait on them.
- **Open (ED):** whether the GSC Discover and News reports show any data for techplay.gg; K03 and K04 targets change if they do not.
- **Open:** Discord member count 160 comes from the invite API on 27 Sep [R02, R13]; the bot's own count becomes the source from 5 Oct.
- **Dependency on other Phase 2 files:** activation stages and `from=` values follow 15-REGISTRATION; giveaway guardrails follow 25-GIVEAWAYS (entrant → A2 ≥ 25%, giveaway-only ≤ 60%, paid stop at 70%); paid budgets and dates follow spine §13 and the paid-media plan.
