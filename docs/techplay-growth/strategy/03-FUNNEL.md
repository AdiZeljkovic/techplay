# 03 — Funnel

Status: Phase 2 plan — 27 Sep 2026

- Ten stages from DISCOVERY to ADVOCACY. ACTIVATION is split into four steps as in [R11 §6]: **A1 Reachable** (verified email), **A2 Shelved** (a linked platform or ≥3 shelf items within 7 days), **A3 Returned** (a second active day within 7 days) and **A4 Contributor** (first approved comment, rating, list or forum post).
- The only funnel numbers we have are small and old. On 31 Aug: 55 registered, 50 confirmed, 21 entered a giveaway, 7 commented, 3 added a game, 2 linked a platform, and 45 had zero XP [R01, R12]. On 1 Sep, 84 paid-ad arrivals produced 0 visits to `/register` [R11]. Search is at 1–2 clicks a day [R03]. Every target below is a TARGET, and where the baseline is missing we give a relative change and the query to run first (§2).
- **Biggest leaks, in order:** (1) activation: the library is where members stop (3 of 55 added a game); (2) retention: 20 of 22 notification types never leave the on-site bell; (3) discovery: search collapsed after the Cloudflare block; (4) registration: five gates, false claims on the form, and Steam is not a sign-in method [R11, R12, R03].
- **Headline TARGETS for 31 Dec 2026:** 170–300 new registrations; ≥40% of them reach A2 within 7 days; 100 cumulative A2 members (C68 Founding 100); Weekly Returning Members (WRM) of 45–70 in the last week of December; Discord at 400–500 members (C36); organic search back to 30–60 clicks a day, with ~100/day (the pre-incident level) as the stretch.
- Tracking uses only the spine §10 event names plus GA4's automatic `page_view` and session metrics. Nothing in this funnel can be measured until C03 ships D-007 (GA4 key events), D-008 (UTM columns in the collector), D-009 (campaign URL helper) and D-011 (invite-code attribution).
- Per-segment variants are in §7 for S1 Release Planners, S2 Multi-platform Collectors, S4 GTA 6 Waiters and S5 MMO/WoW Players.
- Every CTA line is written to be true on the date it appears. Lines that promise email, Steam sign-in or the release-time tool carry their go-live date.

---

## 1. The funnel in one picture

```
DISCOVERY     Search · Discover · Reddit answers · X / IG / Shorts / TikTok · Discord invite codes · PR · newsletter forwards
   │  impressions → clicks                         (utm_source / utm_medium / utm_campaign on every owned link)
   ▼
VISIT         lands on: article · /games/{slug} · /calendar · /gta6/* · /wow-analyzer · hubs (/steam, /switch-2, /mmo, /guides/pc-fixes)
   │  engaged session
   ▼
ENGAGEMENT    reads to the end · tool_run · search_performed · cta_click
   │                                   ├──► SIDE PATH A: newsletter_signup → newsletter_verified   (reachable guest)
   ▼                                   └──► SIDE PATH B: discord_click → discord_join              (community guest)
SECOND PAGE   game page · calendar · hub · related article (≥2 page_views in the session)
   │
   ▼
REGISTRATION  registration_start → registration_complete (method = email|google|discord|battlenet|steam, from = <source>)
   │
   ▼
ACTIVATION    A1 Reachable ─► A2 Shelved ─► A3 Returned ─► A4 Contributor
              email_verified   library_connected |      d1_return /        comment_approved | rating_created |
                               ≥3 shelf_add in 7 d      2nd active day     list_created | forum post approved
   │          (Steam sign-in path: A2 can come before A1 — the email is asked for at the first reminder_set)
   ▼
RETENTION     WRM: ≥1 meaningful action in 7 days ◄── reminder_delivered · alert_clicked · C41 Monday email · F21 Friday · rituals
   │
   ▼
COMMUNITY     Discord linked · comment_created/approved · forum threads · Game Club · polls
   │
   ▼
REFERRAL      share_card_generated · social_share · Taste Match links · member invite codes · giveaway referral codes
   │
   ▼
ADVOCACY      public lists · member verdicts · Library Card (F19) · awards votes · unprompted mentions
```

Side paths A and B are not failures. A verified subscriber or a Discord member who never registers is still reachable, and C42 (welcome sequence) and the bot's `/link` exist to bring them into REGISTRATION later.

---

## 2. What we know today, and the baseline queries to run first

### 2.1 Known numbers (FACT)

| Measure | Value | Date | Source |
|---|---|---|---|
| Registered users | 60 | 7 Sep 2026 | docs/README.md via [R01] |
| Funnel in code comment | 55 registered → 50 confirmed → 21 giveaway → 7 commented → 3 added a game → 2 linked a platform; 45 with zero XP | 31 Aug 2026 | [R01, R12] |
| Connected platform accounts | 13 (rows, not distinct users) | 7 Sep 2026 | [R11] |
| Shelf entries | 2,599 | 7 Sep 2026 | [R11] |
| Comments / forum threads / lists | 22 / 7 / 4 | 7 Sep 2026 | [R01] |
| Paid-ad arrivals → /register | 84 arrivals, 33 stayed >1 min, 0 loaded /register | 1 Sep 2026 | code comment in `JoinPrompt` [R11] |
| Google clicks per day | 1–2 (about 100 before 17 Aug) | 7 Sep 2026 | [R03] |
| Indexed / not indexed | 56,355 / 338,358 | 7 Sep 2026 | [R03] |
| Discord members / online | 160 / 24 | 27 Sep 2026 | [R13] |
| GA consent before 20 Sep CMP change | 2–7% of visitors | — | [R11] |
| US share of traffic | ≈35% | 20 Sep 2026 | [R16] |
| Newsletter subscribers | UNKNOWN | — | [R20] |

**Two cautions about these numbers.** First, 50 of 55 confirmed looks like a healthy A1, but `users:prune-unverified` deletes unverified accounts after 30 days. The survivors are the ones who verified, so the true verification rate is lower and still UNKNOWN [R11 §1.3]. Second, "2 linked a platform" (31 Aug) and "13 connected accounts" (7 Sep) count different things (people vs rows) on different dates. Both baselines have to come from the queries below.

### 2.2 Baseline queries — run in week 40 (28 Sep–4 Oct), owner DEV, 4 h

| # | Question | Query / source | Feeds stage |
|---|---|---|---|
| Q1 | Registrations by month, by method, verified or not | `users` by `created_at` month × (`google_id`, discord id, battlenet id, password) × `email_verified_at IS NOT NULL` | REGISTRATION, A1 |
| Q2 | A2 rate, historical | users with `EXISTS connected_accounts` OR `COUNT(user_games) ≥ 3` where `user_games.created_at ≤ users.created_at + 7 days` | A2 |
| Q3 | Distinct linkers | `COUNT(DISTINCT user_id) FROM connected_accounts` by provider | A2 |
| Q4 | Time to first shelf item | `MIN(user_games.created_at) − users.created_at` median | A2 |
| Q5 | Would-be prunes | `php artisan users:prune-unverified --dry-run` | A1 |
| Q6 | Register page loads vs completions by `from=` | nginx: `GET /register?from=*` vs `POST /auth/register` 201s, last 30 days | REGISTRATION |
| Q7 | Wizard funnel | `FunnelAnalytics::counts()` for 90 days (the counters are written but never read [R11 §6]) | A2, A3 |
| Q8 | Active members per week (WRM proxy) | `users.last_seen_at` and any row in `user_games`, `comments`, `game_ratings`, `game_lists` updated in each 7-day window | RETENTION |
| Q9 | Newsletter list | verified, unsubscribed, suppressed counts; campaign clicks | SIDE PATH A |
| Q10 | Search | Search Console: clicks, impressions, CTR, Discover report, last 28 days | DISCOVERY |
| Q11 | GA4 after the CMP change | sessions, engaged sessions, pages/session by country and landing page, 20 Sep onward | VISIT, SECOND PAGE |
| Q12 | Comment moderation | pending comments and median time to approval | A4, COMMUNITY |
| Q13 | Giveaway state | Is the GTA 6 draw (JoinPrompt comment: closes 20 Oct) live in admin? | ENGAGEMENT (C09) |
| Q14 | WoW Analyzer use | `WowAnalysis` rows per week, and distinct characters | S5 |

The results go into the first weekly funnel review (§9) on Mon 5 Oct. Any TARGET below written as a relative change is re-based on these numbers that day.

---

## 3. Stage by stage

Each stage lists the behaviour, the friction we can prove, the message, the exact CTA, the mechanism (**exists** or **needs D-xxx**), the channel, the events, and the KPI with a formula and a TARGET for 31 Dec 2026.

### 3.1 DISCOVERY

| Field | Detail |
|---|---|
| User behaviour | Searches a release date, a fix or a GTA 6 question; scrolls Discover; sees a countdown Story, a Reddit answer or a data chart; clicks a Discord invite from a friend. |
| Current friction (FACT) | Clicks fell from about 100 a day to 1–2 after Cloudflare served Googlebot a 403 from 17 Aug [R03]. TechPlay appeared in 0 of 114 Bing results pages and 0 of 751 Google News results for its own stories [R03]. 99.8% of indexable URLs are database pages, and 0.7% of game pages carry anything TechPlay wrote [R03]. Google News lists game pages as "news" [R02]. RSS hardware links 404 and lag about a day [R02]. No TikTok, Bluesky or LinkedIn account exists; YouTube has 20 subscribers and no videos [R02]. |
| Message | Specific and useful before it is clever: the date, the fix, the confirmed fact, the number with a source. |
| CTA copy | Social posts end with one line and one link. Example (F01): "Out this week, with platforms and prices: techplay.gg/calendar". Reddit: no CTA. Answer the question and link only when the page answers it better [R07]. |
| Product mechanism | Exists: news sitemap, `max-image-preview:large`, IndexNow, RSS. Needs: D-003 (RSS fix), D-021 (indexable-set decision), D-022 (stop game pages in Google News), D-017 (GTA hub SSR text and OG ≤300 KB), D-006 (SearchAction). |
| Marketing channel | PRIMARY: Google Search, Discover, Discord. SECONDARY: X, Reddit (contribution), vertical video (C49), IG carousels [spine §12]. |
| Tracking events | GA4 session source/medium/campaign (needs D-008 in the first-party collector too); `discord_join` by invite code (D-011); Search Console. |
| KPI and formula | Organic clicks/day = Search Console clicks, 7-day average. Owned-channel sessions/week = sessions where `utm_medium` ∈ {organic-social, community, email, push}. |
| TARGET 31 Dec | Organic: 30–60 clicks/day (stretch ≥100, the pre-17 Aug level). Owned-channel sessions: 2× from the first full UTM week (week 42) to week 51. |
| Baseline first | Q10, Q11. |

### 3.2 VISIT

| Field | Detail |
|---|---|
| User behaviour | Lands on one page, mostly on a phone [R11, R02], and decides within seconds whether the page answers the question. |
| Current friction (FACT) | Empty modules shown to guests: "Most read — Not enough reading yet to rank anything", "0 Online 0 Threads 0 Replies 0 Members", "Discussion (0)", GTA hub counters "0 Days to launch · 0 Map locations" [R02]. The homepage first fold has no news, though 84% of output is news [R02]. `/calendar` is 441 KB of HTML [R02]. OG images of 2–2.5 MB break previews on some apps [R02]. EEA visitors see the CMP dialog first [R02]. |
| Message | The page's first screen answers the query. The brand line appears once: "Gaming, on the record." |
| CTA copy | None above the answer. |
| Product mechanism | Needs D-029 (hide zero-value modules for guests), D-017 (GTA hub), D-001 (false numbers). |
| Marketing channel | n/a (on-site). |
| Tracking events | GA4 `page_view`, engaged session (GA4 automatic). |
| KPI and formula | Engaged-session rate = engaged sessions ÷ sessions (GA4; US, rest of world and consenting EEA). |
| TARGET 31 Dec | +10–20% relative to weeks 40–41. |
| Baseline first | Q11. |

### 3.3 ENGAGEMENT

| Field | Detail |
|---|---|
| User behaviour | Reads to the end, runs a tool (Analyzer, release-time, Backlog Advisor), searches the catalogue, taps a CTA. |
| Current friction (FACT) | No newsletter capture on articles, game pages, calendar or homepage; only listing sidebars and the GTA hub [R01 A.3.2]. The article-end account panel (`JoinPrompt`) exists in code for guests [R01, R11] but did not appear in the server HTML the live audit saw [R02], so it is client-rendered and invisible to crawlers. On mobile the account prompt sits below three ad units [R20]. While a giveaway runs, the panel is swapped for the giveaway on every article [R11]. Backlog Advisor and Taste Match are behind sign-in walls [R10]. `/search` is a noindex 404 [R03]. |
| Message | "Keep track of the games in this story." |
| CTA copy (article end block, C46/D-010) | Heading **"Keep track of the games in this story"** · primary **"Add {game} to my shelf"** · line under it (until 19 Oct) **"It goes on your release calendar and your shelf. Free, no card."**, (from 19 Oct) **"We'll tell you when it's out, on sale or reviewed. Free, no card."** · secondary **"Get The Save File on Fridays"** (email field) · tertiary **"Join the Discord"** |
| Product mechanism | Exists: `JoinPrompt` panel, `?from=article`. Needs D-010 (end block + related module + contextual links), D-012 (newsletter capture on articles and homepage), D-040 (WoW copy), D-018 (release-time tool), D-037 (Backlog Advisor guest mode). |
| Marketing channel | On-site; tools are promoted through F15 (WoW) and C08 (GTA). |
| Tracking events | `cta_click` (cta_id), `tool_run` (tool), `search_performed`, `newsletter_signup`, `discord_click`. |
| KPI and formula | End-block click rate = `cta_click` where cta_id starts `art-end-` ÷ guest article `page_view`. Tool use = `tool_run` per 1,000 sessions. |
| TARGET 31 Dec | End-block click rate: provisional 1–3% of guest article views, re-based after the first two weeks of D-010 data. `tool_run`: 2× from week 42 to week 51. |
| Baseline first | Q13 (giveaway swap), Q14. |

### 3.4 SECOND PAGE

| Field | Detail |
|---|---|
| User behaviour | Follows a link to the game, the calendar, a hub or a related story. |
| Current friction (FACT) | Every article breadcrumb category link returns 404 [R02]. Six sampled articles had zero contextual links in the body [R02]. No related-articles module [R02]. GTA 6 news links to a 2019 parody game [R02]. The GTA hub links neither the real game page nor the calendar [R17]. Game pages render genres and platforms as plain text [R01]. Homepage server HTML has no link to /gta6, /guides, /wow-analyzer or /leaderboard [R02]. |
| Message | "Next: the game page, with where to play it and when." |
| CTA copy | Related module heading **"Read next"**. Game link text **"{Game}: platforms, release date and where to buy"**. |
| Product mechanism | Needs D-002 (breadcrumbs), D-005 (GTA relation), D-010 (related + contextual links), D-017 (hub ↔ game page ↔ calendar links), D-023 (game page → facet hubs). |
| Marketing channel | On-site. |
| Tracking events | GA4 `page_view` count per session. |
| KPI and formula | Second-page rate = sessions with ≥2 `page_view` ÷ sessions. |
| TARGET 31 Dec | +25–50% relative to weeks 40–41 once C02 and C46 are live. |
| Baseline first | Q11. |

### 3.5 REGISTRATION

| Field | Detail |
|---|---|
| User behaviour | Taps "Remind me", "Add to my shelf", "Start your library" or "Sign up" in the comments; picks a method; completes. |
| Current friction (FACT) | False claims on the form: "15K+ MEMBERS · 50K+ GAMES · FREE FOREVER" (60 users, 333,198 games), "Earn XP for every comment and article you read" (reads earn nothing) [R11]. Login shows "24/7 COMMUNITY" [R11]. Cloudflare Turnstile on register and login; if it fails to load, the button silently refuses [R11]. Five password rules (≥8, upper, lower, number, symbol) [R11]. Social buttons sit below the long form [R11]. Steam is not a sign-in method [R11 §5]. The page ignores `redirect` [R11]. `from=` is only in nginx logs; the page does not read it (repo). Guests who tap track or rate on a game page go to `/login`, not `/register` [R01 A.3.1]. The help centre's two most-read articles are about the greyed-out button and the verification email [R02]. |
| Message | Same promise as the homepage: "One library for everything you play." |
| CTA copy (register page, C44/D-014) | H1 **"One library for everything you play."** · sub **"Connect Steam, PlayStation, Xbox, GOG and Epic and your games arrive with the hours you've played."** · buttons in this order: **"Sign in through Steam"** (from D-015) · **"Continue with Google"** · **"Continue with Discord"** · **"Continue with Battle.net"** · link **"Or sign up with email"** · strip **"{live game count} games catalogued · Free, no card"** (API-fed; no member count) |
| CTA copy (guest modal on game/calendar, C45/D-016) | Title **"Where should the reminder go?"** · same four buttons · **"Use email instead"** · footnote **"We'll bring you back to this page."** |
| Product mechanism | Exists: Google, Discord and Battle.net OAuth (skip Turnstile and verification) [R11 §5]. Needs D-001, D-014 (rewrite, social-first, honour redirect), D-015 (Steam OpenID), D-016 (guest modal), D-007 (events). |
| Marketing channel | On-site; paid tests only from 19 Oct and 18+ (C56–C58). |
| Tracking events | `registration_start`, `registration_complete` (method, from), `cta_click`. |
| KPI and formula | Completion = `registration_complete` ÷ `registration_start`. Guest conversion = `registration_complete` ÷ guest sessions × 1,000. Method mix = share by method. |
| TARGET 31 Dec | Completion ≥60% overall and ≥85% for Steam/Google/Discord/Battle.net. 170–300 new registrations between 28 Sep and 31 Dec (K07). ≥60% of them through a social or Steam method. |
| Baseline first | Q1, Q6. |

**Funnel math (no invented rates).** Sessions needed = target registrations ÷ measured guest conversion rate. With the mid-target of 275 registrations, required guest sessions = 275 ÷ r, where r comes from Q6 plus two weeks of D-007 data. If r turns out so low that the session count is out of reach, the fix is registration friction (this stage), not more traffic.

### 3.6 ACTIVATION (A1–A4)

| Step | Definition [R11 §6] | Current friction (FACT) | Message / CTA (exact) | Mechanism | Events | KPI (formula) | TARGET 31 Dec |
|---|---|---|---|---|---|---|---|
| **A1 Reachable** | `email_verified_at IS NOT NULL` | Verification is required before login; no token until verified; mail comes from TechPlay's own server with no Gmail reputation; unverified accounts are pruned at 30 days; Steam OpenID returns no email [R11] | `/verify-email`: **"Check your inbox for a link from TechPlay. It can take a few minutes; look in spam if it hasn't arrived. Faster next time: Google or Discord skip this step."** Steam-only accounts, at the first reminder: **"Where should the reminder go? Add an email and we'll confirm it once."** | Exists: verify mail, resend. Needs D-013 (mail channel), D-015 (Steam email ask) | `email_verified` | A1 = verified within 72 h ÷ `registration_complete` (email method); Steam: accounts with email ÷ Steam accounts at day 14 | ≥90% of email registrants within 72 h (measured before the prune); ≥60% of Steam-only accounts add an email within 14 days |
| **A2 Shelved** | linked platform OR ≥3 shelf items within 7 days | 3 of 55 added a game, 2 linked a platform [R01]; PlayStation needs a pasted `npsso`, GOG/Epic pasted codes [R10]; no Nintendo import; the wizard's counters are never read [R11] | Onboarding step 1: **"Connect Steam and your library fills itself."** · alternatives **"Link Xbox with your gamertag"** / **"Add three games you're playing or waiting for"** · skip **"Later"** | Exists: wizard, checklist, 5 connectors, reminders create wishlist rows. Needs D-015 (Steam sign-in = connect), C68 (Founder badge to 100) | `library_connected`, `shelf_add`, `reminder_set`, `profile_completed` | A2 = users meeting the rule within 7 d ÷ registrations in the cohort week | ≥40% of new registrations within 7 days; 100 cumulative A2 members by 31 Dec (C68) |
| **A3 Returned** | second distinct active day within 7 days | Nothing reaches the member off-site before C43 [R12]; `d1_return` is guarded per browser and undercounts cross-device [R11] | Day-1 email (C42 #2): subject **"Your shelf, one day in"**, body line **"Here is what we found in your library, and what's coming out from it this month."** | Exists: `d1_return`, `last_seen_at`. Needs D-013, C42 | `d1_return`, any meaningful action | A3 = A2 members active on a 2nd day ≤7 d ÷ A2 | ≥35% of A2 |
| **A4 Contributor** | first approved comment, rating, list or forum post | First three comments held for approval; >1 link held; comment XP waits for approval [R11]; ratings need sign-in and a modal [R01] | At `completed` status: **"Finished it? Rate it in one tap, and add a line if you like."** Before the first comment: **"A person reads your first three comments, then yours go straight up."** | Exists: moderation, ratings, lists. Needs a "rate on complete" prompt (part of D-010 scope or new sub-item; §10) | `comment_created`, `comment_approved`, `rating_created`, `list_created` | A4 = A2 members with ≥1 approved contribution within 30 d ÷ A2 | ≥15% of A2; moderation queue median <24 h (guardrail) |

**Steam path ordering.** For a Steam sign-in, A2 (library connected) happens at registration and A1 comes later, if at all. Report A2 on every account. Report A1 separately as "reachable members", because only reachable members count toward email reach and campaign audiences (README §20 via [R11]).

### 3.7 RETENTION

| Field | Detail |
|---|---|
| User behaviour | Comes back because something changed in their games: a release, a price, a reset, a friend's activity, a weekly ritual. |
| Current friction (FACT) | 20 of 22 notification classes are database-only (bell), including release reminders, wishlist notices and the Friday digest [R01 B.2.12]. The Settings toggle "What may reach your inbox" governs nothing [R11]. No web push and no service worker [R01]. Two streak systems with no freeze; Discord `/daily` pays uncapped XP [R12, R01]. Season dates disagree between two migrations [R12]. |
| Message | "Your games changed" [R12]: it's out, it's cheaper, it's reset day, your friend started it. |
| CTA copy | Release-day email (C43): subject **"{Game} is out today"**, first line **"{Game} is out on {platforms}. It unlocks at {local time}."**, button **"Open {Game}"**, sign-off **"— Buffy"**. Monday email (C41): subject **"Your releases this week: {Game A}, {Game B} and {n} more"**. Price alert (C31): subject **"{Game} is {pct}% off on Steam"**. |
| Product mechanism | Exists: reminders, T-3 wishlist check, digest builder, campaign sender with suppression. Needs D-013, D-027, D-028, D-019 (push, C59 from 9 Nov), D-035 (merge `/daily` into the XP cap). |
| Marketing channel | Email (PRIMARY), Discord DM, web push (EXPERIMENTAL, reminders only). |
| Tracking events | `reminder_set`, `reminder_delivered` (channel), `alert_clicked`, `notification_enabled`, `newsletter_verified`, plus every WRM action. |
| KPI and formula | WRM = accounts with ≥1 meaningful action in a 7-day window [spine §3]. Alert return = `alert_clicked` ÷ `reminder_delivered`, per channel. D30 = A2 members of cohort week w with a meaningful action in days 22–30 ÷ A2 in week w. |
| TARGET 31 Dec | WRM in the last week of December: 45–70, per kpis.json K00 (basis: 100 A2 members from C68 plus Discord-linked regulars; today ESTIMATE ≤10, since 45 of 55 had zero XP). Alert return: 20–35%, re-based after four weeks of C43. D30 ≥30% of A2. Guardrails per send: complaints <0.1%, unsubscribes <0.5%. |
| Baseline first | Q8, Q9. |

### 3.8 COMMUNITY

| Field | Detail |
|---|---|
| User behaviour | Joins Discord, links the account, posts in a weekly thread, comments on an article, turns up to Game Club. |
| Current friction (FACT) | `discord.gg/techplaygg` (GTA hub, roadmap) and `discord.gg/techplay` (seeder default) are dead [R13]. No Discord Onboarding and no Server Guide; landing channel "🎮┃gaming" [R13]. Forum shows "0 Members" before hydration [R02]. 22 comments and 7 threads site-wide [R01]. Discovery needs 1,000 members, Insights needs 500 [R13]. |
| Message | "A server small enough that the editors answer you." |
| CTA copy | Everywhere: **"Join the Discord"** → https://discord.gg/wPQG9gUMXH (a per-campaign invite code once D-011 lands). Bot to unlinked members: **"Link your TechPlay account with /link — your shelf answers in Discord too."** Comments, guest: **"Reply — a person reads your first three comments, then yours go straight up."** |
| Product mechanism | Exists: bot with 20 commands, XP mirror, Sunday recap, Discord OAuth `guilds.join`. Needs D-004, D-011, C35 (Onboarding, Server Guide, channels), D-029 (hide zero counters). |
| Marketing channel | Discord (PRIMARY), newsletter footer, article end block. |
| Tracking events | `discord_click` (campaign), `discord_join` (invite code), `comment_created`, `comment_approved`. |
| KPI and formula | Discord members (invite API count). Linked share = Discord-linked accounts ÷ Discord members. Weekly talkers = distinct members posting in 7 days ÷ members. |
| TARGET 31 Dec | 500 members (C36). ≥25% of members linked. Weekly talkers 20–30% of members (Discord's own guide calls ~30% healthy [R13]). |
| Baseline first | Discord API count (160 on 27 Sep); linked Discord IDs in `users`. |

### 3.9 REFERRAL

| Field | Detail |
|---|---|
| User behaviour | Shares a card or a match link, invites a friend to Discord, sends a calendar entry. |
| Current friction (FACT) | No referral mechanism outside giveaways [R01 A.8]. The "Squad Goals" achievement (invite 5) is unreachable [R11]. Taste Match renders only for a signed-in viewer on someone else's profile [R10]. Game, studio, calendar, hub and leaderboard pages have no share control [R01 A.3.4]. Share buttons include Reddit and Telegram but not Discord [R01]. OG images are generic or heavy [R02]. |
| Message | "Show what you play, and see how close a friend's taste is." |
| CTA copy | Profile: **"Compare your taste with mine"** (copies the Taste Match link). Year in Review (C28): **"Share your 2026 in games"**. Discord: **"Get your own invite link"** (C36). |
| Product mechanism | Exists: profile ShareCard, list share, giveaway referral codes. Needs D-024 (Gamer DNA share card), D-025 (Year in Review), D-011 (member invite codes), D-026 (prediction league). |
| Marketing channel | Member-driven: WhatsApp, Discord, X, Reddit (by members, not by us). |
| Tracking events | `share_card_generated` (type), `social_share` (network, content_type), `registration_complete` with `from=share`/`from=match`/`from=yir`, `discord_join` (member invite code). |
| KPI and formula | Referred share = registrations where `from` ∈ {share, match, yir, invite} ÷ all registrations. Cards per active member = `share_card_generated` ÷ WRM. |
| TARGET 31 Dec | Referred share ≥10% of December registrations (C28 window). ≥1 `share_card_generated` for every 3 WRM in 14–31 Dec. |
| Baseline first | None exists (giveaway referral counts only). |

### 3.10 ADVOCACY

| Field | Detail |
|---|---|
| User behaviour | Publishes a list, writes a verdict, lets their Library Card be featured, votes in the community awards, mentions TechPlay without being asked. |
| Current friction (FACT) | 4 lists, two in the sitemap, one by `deleted_user_95` [R02]; guides show "HELPFUL: 0" [R02]; no consented spotlight flow; review prompts are banners, not tied to marking a game completed [R13]. |
| Message | "Your shelf, your verdict, credited to you." |
| CTA copy | F19 opt-in: **"Want your Library Card featured on Friday? Reply yes and we'll show it with your username only."** Lists: **"Make a list of five — it gets its own page and share image."** Awards (C30): **"Vote in the TechPlay Community Awards 2026."** |
| Product mechanism | Exists: lists, tier lists, ratings, profile OG card, forum polls. Needs D-026 (awards and prediction polls), a consent record for F19 (process, not code). |
| Marketing channel | Discord, newsletter, IG/X (F19 with consent). |
| Tracking events | `list_created`, `rating_created`, `share_card_generated`, `comment_approved`. |
| KPI and formula | Public member lists (count). Featured members = F19 posts with recorded consent. Awards voters = distinct accounts voting ÷ WRM. |
| TARGET 31 Dec | ≥30 public member lists (from 4). ≥10 consented Library Card features. Awards voters ≥50% of WRM in 1–20 Dec. |
| Baseline first | Lists and ratings counts by month. |

---

## 4. Stage-to-stage conversion formulas

| From → to | Formula | Source | Readable from |
|---|---|---|---|
| Discovery → Visit | clicks ÷ impressions (search); sessions with utm ÷ post reach (social) | Search Console; platform insights + GA4 | 5 Oct (GSC); 16 Oct (UTM) |
| Visit → Engagement | engaged sessions ÷ sessions | GA4 | now |
| Engagement → Second page | sessions with ≥2 `page_view` ÷ engaged sessions | GA4 | now |
| Second page → Registration start | `registration_start` ÷ guest sessions with ≥2 `page_view` | GA4 (D-007) | 16 Oct |
| Registration start → complete | `registration_complete` ÷ `registration_start`, by method | GA4 (D-007) | 16 Oct |
| Complete → A1 | `email_verified` within 72 h ÷ `registration_complete` (email) | DB (Q1) | now |
| A1 → A2 | shelved within 7 d ÷ A1 cohort (for Steam: A2 ÷ all registrations) | DB (Q2) | now |
| A2 → A3 | 2nd active day within 7 d ÷ A2 | DB + `d1_return` | now (proxy) |
| A3 → Retention | meaningful action in days 22–30 ÷ A3 cohort | DB (Q8) | 12 Oct |
| Retention → Community | Discord-linked or `comment_approved` within 30 d ÷ retained | DB + bot | now |
| Community → Referral | members with ≥1 referred registration or invite join ÷ community members | DB + D-011 | 12 Oct (invites) |
| Referral → Advocacy | members with public list, verdict or consented feature ÷ referrers | DB + consent log | Nov |
| Side path A | `newsletter_verified` ÷ `newsletter_signup` | DB + GA4 | 9 Oct (D-012) |
| Side path B | `discord_join` ÷ `discord_click`, by campaign | GA4 + bot (D-011) | 12 Oct |
| Side path A → Registration | registrations with the email of a verified subscriber ÷ verified subscribers, per 30 d | DB | 12 Oct (C42) |

---

## 5. Biggest leak per stage and the fix

| Stage | Biggest leak (evidence) | Fix | Campaign / D-item | Owner | Due |
|---|---|---|---|---|---|
| Discovery | Search at 1–2 clicks/day after the crawl block; 295k thin pages dilute crawl [R03] | Decide the indexable set; fix Google News misread; RSS; hubs with crawlable text | D-021, D-022, D-003, D-017 (C02) | EIC decides, DEV builds | 9 Oct |
| Visit | Zeros and dashes shown to every guest [R02] | Hide zero-value modules; replace hard-coded numbers with live API figures or none | D-029, D-001 (C01) | DEV | 2 Oct |
| Engagement | No email capture where people read; account panel under ads on mobile [R01, R20] | Article end block with shelf, newsletter and Discord; newsletter on homepage | D-010, D-012 (C46, C40) | DEV/ED | 16 Oct |
| Second page | Zero contextual links, 404 breadcrumbs, no related module [R02] | Breadcrumb fix, related module, 3–5 contextual links per article | D-002, D-010 (C02, C46) | DEV/ED | 16 Oct |
| Registration | False claims + five gates + social buttons last + no Steam sign-in [R11] | Honest copy; social and Steam first; honour redirect; guest modal returns to page | D-001, D-014, D-015, D-016 (C44, C45) | DEV/EIC | 26 Oct |
| A1 | Inbox dependency on a no-reputation sender; Steam accounts have no email [R11] | Steer to Google/Discord; ask for email at the first reminder; welcome sequence | D-013, C42 | DEV/SC | 12 Oct |
| A2 | 3 of 55 added a game [R01] | Steam sign-in = import; "3 reminders" route; Founder badge to 100 | D-015, C45, C68 | DEV/SC | 26 Oct |
| A3 | Nothing reaches members off-site [R12] | Day-1 email; release alerts; Monday personalised email | C42, C43, C41 | DEV/SC | 26 Oct |
| A4 | Contribution asked for with banners, not at the natural moment [R13] | Rate-on-complete prompt; moderation notice shown before the first comment | D-010 scope (see §10) | DEV/ED | Nov |
| Retention | 20 of 22 notifications bell-only; digest never emailed [R01] | Deliver existing loops by email and Discord DM; push for reminders only | D-013, D-028, D-019 | DEV | 9 Nov |
| Community | Dead invites; no Onboarding [R13] | Replace invites; Onboarding + Server Guide; per-campaign codes | D-004, C35, D-011 | DEV/SC | 12 Oct |
| Referral | No mechanism outside giveaways; Taste Match gated [R01, R10] | Member invite codes; DNA card; Year in Review | D-011, D-024, D-025 | DEV/DS | 10 Dec |
| Advocacy | Almost no public UGC; no consent flow [R02] | Monthly list prompt; F19 with recorded consent; community awards | C30, F19, D-026 | SC | 1 Dec |

---

## 6. Proposed `cta_id` values (for `cta_click`)

Short and stable, so the weekly review can compare placements. DEV maps them in D-007.

| cta_id | Where | Copy |
|---|---|---|
| `art-end-shelf` | article end block, primary | "Add {game} to my shelf" |
| `art-end-newsletter` | article end block | "Get The Save File on Fridays" |
| `art-end-discord` | article end block | "Join the Discord" |
| `game-remind` | unreleased game page | "Remind me on release day" |
| `game-track` | released game page | "Add to my shelf" |
| `cal-remind` | calendar row | "Remind me on release day" |
| `gta-release-remind` | /gta6/release-time | "Remind me when GTA VI unlocks in my time zone" |
| `gta-map-save` | /gta6/map (from 19 Nov) | "Save your map progress" |
| `wow-save-character` | Analyzer result | "Save this character and re-check it after the next reset" |
| `price-alert` | wishlist / game page | "Alert me when it's cheaper" |
| `reg-steam` / `reg-google` / `reg-discord` / `reg-bnet` / `reg-email` | register page and modal | provider buttons |
| `home-hero-library` | homepage hero | "Start your library" |
| `pcfix-discord` | PC fix pages | "Still stuck? Post your error in #pc-help on our Discord" |
| `profile-match` | profile | "Compare your taste with mine" |
| `yir-share` | Year in Review | "Share your 2026 in games" |

---

## 7. Per-segment funnel variants

### 7.1 S1 Release Planners — "remind me" is the whole funnel

| Stage | What happens | CTA (exact) | Event | KPI / TARGET |
|---|---|---|---|---|
| Discovery | F01 Out This Week (Mon) on X, IG carousel and Shorts; search "[game] release date" (EB-150), "game release dates november 2026" (EA-103) | "Out this week, with platforms and prices: techplay.gg/calendar" | session with `utm_campaign=c04-out-this-week` | sessions/week from C04: 2× week 42 → week 51 |
| Visit → Engagement | /calendar or an unreleased /games/{slug} | — | `page_view` | engaged-session rate on /calendar +15% |
| Registration | guest taps Remind me → modal → social/Steam sign-up → back on the page with the reminder set | "Remind me on release day" → "Where should the reminder go?" | `cta_click` (cal-remind, game-remind), `registration_complete` (from=calendar/game) | ≥25% of S1 registrations come from the modal (TARGET) |
| A2 | three reminders = three wishlist rows = A2 without a store link | "Add two more you're waiting for" (after the first reminder) | `reminder_set` ×3 | S1 A2 ≥50% within 7 days |
| Retention | release-day email/DM (C43); Monday email (C41); F21 Friday | "{Game} is out today" | `reminder_delivered`, `alert_clicked` | alert return 20–35% |
| Community → Referral | F11 thread; Discord release pings; sends a calendar entry to a friend | "Waiting for the same game? Send them this." (needs share control) | `social_share` (content_type=release) | set after share control ships |

**S1 leak to watch:** reminders set by guests who never return before C43 is live. Hold the modal launch (C45, 19 Oct) to the same day as C43 so the first reminder can actually be delivered.

### 7.2 S2 Multi-platform Collectors — sign-in and import are one step

| Stage | What happens | CTA (exact) | Event | KPI / TARGET |
|---|---|---|---|---|
| Discovery | Reddit answers in backlog threads (C47); "export howlongtobeat backlog" (EA-078), "what game should I play next" (EB-128); F05, F18 | Reddit: no CTA; profile link only | session `utm_source=reddit` | Reddit sessions tracked from week 41 |
| Engagement | Backlog Advisor guest mode (D-037) or homepage hero | "Start your library" | `tool_run` (backlog), `cta_click` (home-hero-library) | — |
| Registration | Sign in through Steam (D-015) | "Sign in through Steam" · "Your library fills itself, with the hours you've played." | `registration_complete` (method=steam) | ≥35% of registrations via Steam once D-015 is live |
| A2 | library imports at sign-in | — | `library_connected` (steam) | S2 A2 ≥80% within 1 day |
| A1 | email requested at the first reminder or price alert | "Where should the reminder go?" | `email_verified` | ≥60% within 14 days |
| Retention | price drops on wishlist (C31), Monday email (C41), session proposals | "{Game} is {pct}% off on Steam" | `alert_clicked` | D30 ≥35% for S2 A2 cohort |
| Referral | Taste Match link, Gamer DNA card, Year in Review | "Compare your taste with mine" · "Share your 2026 in games" | `share_card_generated` | ≥1 card per 3 S2 WRM in Dec |

**S2 leak to watch:** PlayStation's `npsso` paste. Do not lead with PlayStation in any S2 message until the flow is simpler. Lead with Steam, then Xbox gamertag.

### 7.3 S4 GTA 6 Waiters — convert before 19 Nov, hand over after

| Stage | What happens | CTA (exact) | Event | KPI / TARGET |
|---|---|---|---|---|
| Discovery | F02 daily Stories/X/Threads (C06); F03 Thursday ledger (C07); Reddit comments with sources; C58 paid Reddit test 9–25 Nov (18+) | "One confirmed fact a day until 19 November. Sources: techplay.gg/gta6/everything-we-know" | sessions `utm_campaign=c06-gta6-countdown` | C06 sessions per day ↑ week over week to 16 Nov |
| Visit | /gta6 (SSR counters and H1 fixed, D-017), /gta6/release-time from 14 Oct | — | `page_view` | engaged-session rate on /gta6/* +20% after D-017 |
| Engagement | runs the release-time tool | "Show the unlock time for my time zone" | `tool_run` (release-time) | tool runs per day tracked from 14 Oct |
| Registration | reminder → modal → Google/Discord/Steam | "Remind me when GTA VI unlocks in my time zone" | `cta_click` (gta-release-remind), `registration_complete` (from=gta6) | registrations from=gta6: largest single source in 26 Oct–22 Nov (TARGET) |
| A2 | GTA VI + two more reminders, or Xbox gamertag link | "Waiting for anything else this year? Add two more." | `reminder_set`, `library_connected` (xbox) | S4 A2 ≥40% |
| Retention | launch-day alert 19 Nov; map progress tracker (C11); Game Club Nov (C38) | "GTA VI is out. It unlocks at {local time}." · "Save your map progress" | `alert_clicked`, `cta_click` (gta-map-save) | alert return ≥30% on 19 Nov |
| Handover (after 22 Nov) | S4 members moved to S1 content: C70 2027 anticipated, "games like GTA", F01 | "What to play when you've finished the story" | `shelf_add` on non-GTA games | ≥30% of S4 A2 add a non-GTA game by 31 Dec |

**S4 leaks to watch:** the dead Discord invite on the hub (fix in C02 before any GTA push), and the giveaway swap: if the GTA 6 draw is live (verify 28 Sep, C09), the article panel shows the giveaway instead of the reminder. Treat giveaway registrants as a separate cohort (`from=giveaway`) and do not count them toward S4 A2 targets until they shelve.

### 7.4 S5 MMO/WoW Players — tool first, account second

| Stage | What happens | CTA (exact) | Event | KPI / TARGET |
|---|---|---|---|---|
| Discovery | F15 Readiness Check on reset day (Tue, US); r/wow answers; C13 (5–12 Oct), C14 (28 Oct–8 Nov); C58 Reddit test | "Patch day. Check your character before tonight: techplay.gg/wow-analyzer" | sessions `utm_campaign=c13-wow-readiness` | Analyzer sessions ↑ in each patch week vs the week before |
| Engagement | runs the Analyzer without an account (copy fixed by D-040) | "Analyze my character" | `tool_run` (tool=wow) | tool runs/week 2× from week 41 to week 46 (WoW: Forever) |
| Registration | "Save this character" → Battle.net (one click, no Turnstile) | "Save this character and re-check it after the next reset" | `cta_click` (wow-save-character), `registration_complete` (method=battlenet) | ≥10% of distinct analysed characters saved to an account |
| Activation | saved character (segment activation); canonical A2 only if they add games or link Steam | "Also on Steam? Connect it and your other games come too." | `library_connected`, `tool_run` | report saved-character rate next to A2 |
| Retention | reset-day re-check (F15); patch-day re-run (C13); WoW note in F21 | "Reset day. Your last score was {score}; re-check it." | `tool_run` by returning account | ≥30% of saved characters re-checked within 14 days |
| Community | #wow channel; guild-recruit format using Analyzer fields | "Post your guild's recruit ad in #wow with your Analyzer link" | `discord_join` (code for #wow campaign) | tracked from D-011 |

**S5 leaks to watch:** stale and false Analyzer claims (D-040 before any promotion); `?region=eu` on Battle.net sign-up for US players (test before C58); "Profesor" spelling in the tips block.

---

## 8. Guest paths that are wins in their own right

| Path | Why it counts | CTA | Event | TARGET 31 Dec |
|---|---|---|---|---|
| Newsletter-only (side path A) | Reachable by email without the registration gates; C42 converts later | "Get The Save File on Fridays" | `newsletter_signup`, `newsletter_verified` | verified subscribers 3× the Q9 baseline, with complaint rate <0.1% per send |
| Discord-only (side path B) | Community presence; the bot converts with `/link` | "Join the Discord" | `discord_click`, `discord_join` | 500 members (C36) |
| Tool-only (Analyzer, release-time) | Proves utility; builds search identity for tool names [R03] | tool CTAs | `tool_run` | 2× tool runs week 42 → week 51 |

---

## 9. Weekly funnel review (process)

- **When:** Mondays 10:00 CET from 5 Oct, 30 minutes. **Who:** EIC (chair), DEV, SC. About 1.5 h/week in total, including preparing the sheet.
- **Inputs:** one sheet, one row per stage, columns: last week, 4-week average, target, owner, note. Data from GA4 (D-007), the collector with UTMs (D-008), DB queries Q1–Q8 turned into an artisan report or a Filament widget reading the `FunnelAnalytics` counters [R11 §6], and the bot's invite joins (D-011).
- **Rule:** pick the single stage with the largest gap to target, agree one change, and name the owner. No second change on the same stage until the first has had two weeks.
- **Monthly (first Monday):** cohort view by registration week (A1, A2, A3, D30) split by `method` and `from`, and the segment re-rank in 02-AUDIENCES §4.

---

## 10. Instrumentation map

| Stage | Can we measure it on 28 Sep? | Needed | Ready (ESTIMATE) |
|---|---|---|---|
| Discovery | Search: yes (Search Console access assumed; research had none). Social: no | D-008, D-009, per-post UTMs | 16 Oct |
| Visit / Second page | Partly (GA4 automatic, consent-limited) | nothing new; US/RoW default-granted | now |
| Engagement | No (`cta_click`, `tool_run` not wired) | D-007 | 16 Oct |
| Registration | Partly (nginx `from=`, DB) | D-007 (`registration_start`/`complete` with method and from) | 16 Oct |
| Activation | Yes from DB; wizard counters unread | report on Q2–Q4, Q7 | 9 Oct |
| Retention | Partly (DB actions) | `reminder_delivered`, `alert_clicked` (C43) | 19 Oct |
| Community | Discord count yes; joins by source no | D-011 | 12 Oct |
| Referral / Advocacy | No | D-011, D-024, D-025, `share_card_generated` | Nov–Dec |

---

## Dependencies and open questions

**Dependencies.** C01 (D-001, D-029) before any promotion. C03 (D-007, D-008, D-009, D-011) before any TARGET here can be judged. C44/C45 (D-014, D-015, D-016) for the registration and A2 targets. C42/C43 (D-013) for A1, A3 and retention. C35/C36 for the community targets. C28 (D-025) for the referral target. The per-segment variants depend on C08 (S4), D-040 (S5), D-015 (S2) and C45 (S1). 02-AUDIENCES carries the matching segment messages.

**Open questions and conflicts found:**

1. **Article CTAs, R01/R11 vs R02.** The repo audit finds a guest account panel at every article's end (`JoinPrompt`). The live audit found no register, newsletter or Discord CTA in article bodies. Both are right: the panel renders client-side after an auth check. DEV should confirm it renders on mobile below the ads, and D-010 should render the end block server-side.
2. **A2 threshold.** ≥3 shelf items [R11] (spine) vs ≥5 [R12] vs the Founder badge job's ≥5 games. This plan uses ≥3 for A2. EIC to decide whether C68 "Founding 100" counts A2 members or keeps its ≥5-games rule. The target of 100 assumes A2.
3. **A1 baseline is survivor-biased** by the 30-day prune (§2.1). Measure A1 at 72 hours from now on.
4. **Steam accounts reverse A1 and A2.** Confirm with EIC that "reachable" is reported separately, and that a Steam-only member counts toward WRM but not toward email audiences.
5. **Spine event gaps.** §10 has no `cta_view` and no page-level exposure event, so CTA click rates use page views of pages carrying the module as the denominator. Add `cta_view` if placement tests need true exposure rates (decision: DEV/EIC, in C03).
6. **Rate-on-complete prompt (A4)** is not in the D-list. Propose it as a sub-item of D-010 or a new item; DEV to size (ESTIMATE S).
7. **Share controls on game/calendar pages** (referral for S1/S6) are not in the D-list either; same proposal.
8. **Search Console access** is assumed for DISCOVERY. The research had none [R03]; EIC to confirm on 28 Sep.
9. **GTA 6 giveaway (C09).** If it is live, the article panel shows the giveaway to every guest until 20 Oct and registrations from articles will read `from=article` on `/giveaway/*`. Report giveaway registrants as their own cohort.
10. **WRM target realism.** 45–70 depends on C43 and C41 shipping on time. If C43 slips past 2 Nov, re-set the WRM target at the 2 Nov review rather than pushing rituals harder.
