# 16 — Activation and Retention

Status: Phase 2 plan — 27 Sep 2026
Scope: Parts 17 and 18. What an activated TechPlay member is, what a new member sees in the first minute, five minutes, day and week (with exact copy), the daily, weekly and monthly loops that bring members back, the ethics rules those loops follow, and the retention metrics with SQL-ready definitions. Registration surfaces are in `15-REGISTRATION.md`; full email copy is in `17-NEWSLETTER-EMAIL.md`.

- **Activation fails at the library today.** Of 55 members, 3 added a game and 2 linked a platform; 45 had zero XP [R01, R12]. The homepage sells a library that almost nobody builds.
- **The activation event is A2 Shelved:** a linked platform or at least three shelf items within 7 days of sign-up [R11 §6]. A0 Registered, A1 Reachable, A3 Returned and A4 Contributor sit around it (§1).
- **The first 60 seconds end with the member's own library on screen** ("{n} games, {h} hours on record"), not with a points toast. The wizard, checklist and first messages are rewritten in §3 with exact copy.
- **TechPlay built the loops and delivers almost none of them.** 20 of 22 notification types stay in the bell, including release reminders and the Friday digest [R12 §1]. The first retention work is delivery (C43 email and Discord DM, 19 Oct; C41 Monday email, 26 Oct; C59 push, 9 Nov), not new mechanics.
- **Loops are "your games changed" loops first** (release day, price drop, reply, session suggestion), then shared rituals (What Are You Playing, Poll, Game Club, Save File), then seasonal events (Season 2, TGA league, Year in Review). 28 loops are specified with trigger, action, reward, investment, owner, requirement, cap and ethics check (§4).
- **Ethics are rules, not intentions:** streak freeze, streaks never emailed or pushed, per-topic opt-in, no guilt copy, no fake urgency, Bounty stays cosmetic [R12 §3]. Two existing mechanics break these rules and are fixed before Season 2 starts on 1 Nov: the 30-day streak quest and the uncapped Discord `/daily` (§4.6).
- **WRM (Weekly Returning Members) needs one view.** Meaningful actions are scattered over eight tables and some (reminder set, Analyzer run, Discord XP) leave no timestamped row. D-007b is a `member_actions` view over the `growth_events` table that D-007 adds (30-ANALYTICS), fed from the `QuestService::progress()` calls that already fire at every meaningful action (§2, §5).
- **Retention is measured on accounts and actions,** never on visits: the first-party counter re-salts IP hashes nightly and cannot see returning people [R12 §0].
- **Capacity:** about 60 DEV hours (mostly C41, C43, D-007b, D-035), SC about 4 h/week for rituals and the weekly retention report, DS 6 h for onboarding screens.

---

## 1. What "activated TechPlay member" means

| Stage | Name | Definition | SQL (PostgreSQL; `u` = users) | Why this line |
|---|---|---|---|---|
| A0 | Registered | account exists | `SELECT id, created_at FROM users u` | — |
| A1 | Reachable | confirmed email | `u.email_verified_at IS NOT NULL` | Social sign-ups pass on creation; Steam-only accounts pass when they add an email (15 R-06) [R11 §5] |
| **A2** | **Shelved (the activation event)** | linked platform OR ≥3 shelf items, within 7 days of sign-up | see query A2 below | Matches the homepage promise; ≥3 because the wizard makes 1 trivial [R11 §6] |
| A3 | Returned | meaningful actions on ≥2 distinct days within 7 days of sign-up | see query A3 below (needs D-007b) | A library nobody re-reads is an export [R11 §6] |
| A4 | Contributor | first approved comment, published rating, published list or forum post | see query A4 below | The moderation queue makes this exact [R11 §6] |

**An "activated TechPlay member" is an account that reached A2 within 7 days.** A "retained member" is one that is in WRM (§5) in a given week. A4 is optional and never required for anything.

```sql
-- A2 Shelved within 7 days
SELECT u.id,
       (EXISTS (SELECT 1 FROM connected_accounts ca
                 WHERE ca.user_id = u.id
                   AND ca.created_at < u.created_at + INTERVAL '7 days')
        OR (SELECT COUNT(*) FROM user_games ug
             WHERE ug.user_id = u.id
               AND ug.created_at < u.created_at + INTERVAL '7 days') >= 3) AS a2_shelved
FROM users u;

-- A3 Returned (needs member_actions, D-007b)
SELECT u.id,
       (SELECT COUNT(DISTINCT DATE(ma.created_at)) FROM member_actions ma
         WHERE ma.user_id = u.id
           AND ma.created_at < u.created_at + INTERVAL '7 days') >= 2 AS a3_returned
FROM users u;

-- A4 Contributor (first contribution timestamp)
SELECT u.id, LEAST(
  (SELECT MIN(c.created_at)  FROM comments c     WHERE c.user_id = u.id AND c.status = 'approved'),
  (SELECT MIN(gr.created_at) FROM game_ratings gr WHERE gr.user_id = u.id AND gr.is_draft = false),
  (SELECT MIN(gl.created_at) FROM game_lists gl   WHERE gl.user_id = u.id AND gl.is_public = true AND gl.is_draft = false),
  (SELECT MIN(p.created_at)  FROM posts p         WHERE p.user_id = u.id)
) AS a4_first_contribution_at
FROM users u;
```

Column names follow the models and migrations read on 27 Sep 2026: `GameRating` has `is_draft`; `Comment::approved()` uses `status = 'approved'`; `game_lists` has `is_public` and `is_draft`; forum replies live in `posts` (forum migration); `users.is_banned` exists.

**Baseline.** Only a proxy exists: 13 connected accounts / 60 users = 21.7% ever connected [R11 §6]. The A2 rate by 7-day cohort is UNKNOWN until the query runs on production (DEV, W40).

**TARGETs** (shared with 03-FUNNEL §4): 100 cumulative A2 members by 31 Dec 2026 (Founding 100, C68); A2 ≥ 40% of new registrations within 7 days; A3 ≥ 35% of A2; A4 ≥ 15% of A2 within 30 days. Re-based on Mon 2 Nov from four weekly cohorts.

---

## 2. `member_actions`: the North Star view (D-007b, on top of D-007's `growth_events`)

Meaningful actions (spine §3) live in eight places and three leave no usable row: reminders are a boolean on `user_games`, `wow_analyses` has no `user_id`, and Discord XP is applied without a persistent ledger row. 30-ANALYTICS already specifies one server-side event table, `growth_events` (`id`, `user_id`, `event`, `params`, `occurred_at`), written inside D-007. This file does not add a second table. **D-007b is a database view, `member_actions`, over `growth_events`**, restricted to the meaningful actions and with one normalised `action` name, so every retention query in §5 reads one place.

| View column | From `growth_events` | Notes |
|---|---|---|
| user_id | user_id | non-null only |
| action | mapped from `event` | shelf_change (`shelf_add` and member-initiated status changes), rating (`rating_created`), comment (`comment_created`), list_edit (`list_created` and list edits), reminder_set, analyzer_run (`tool_run` tool=wow, signed in; needs D-040a), discord_xp (at most one per user per day), session_logged, forum_post, library_connected |
| source | params.source | web, discord, email, push |
| created_at | occurred_at | — |

**Where the writes come from.** `QuestService::progress()` is already called at nearly every meaningful action (`comment_posted`, `platform_connected`, `game_added`, `game_completed`, `game_rated`, `list_published`, `session_logged`, `thread_started`, `forum_post`, `friend_made`) [R01 B.2.5]. Recording the matching `growth_events` row next to those calls, plus the reminder toggle in `CalendarController`, the signed-in Analyzer run and `DiscordXpController`, covers the whole list with one helper (`GrowthEvents::record()` in 30-ANALYTICS).

**Excluded on purpose:** logins, page views, daily streak claims, giveaway daily visits and sync-created shelf rows. A loop that only rewards showing up must not move the North Star (§4.6). Until D-007 ships, WRM is read with the approximation query Q-01 in 30-ANALYTICS. Effort for the view: DEV 2 h (ESTIMATE); the event writes are budgeted in D-007.

---

## 3. The first 60 seconds, 5 minutes, day and week

### 3.1 First 60 seconds

| t | Screen | Exact copy | Events | Build |
|---|---|---|---|---|
| 0 s | Social callback with a `redirect` | Returns to the page; toast: "You're in. {Game} is on your shelf." or "You're in. We'll email you on {date}." | `registration_complete` (method, from), resumed action | D-014, D-016 |
| 0 s | Social callback without a redirect, or email link confirmed | Onboarding wizard, screen 1 | `wizard_shown` (existing Redis counter) | rewrite `WelcomeOnboarding.tsx` |
| 0–20 s | **Wizard 1: Bring your games in** | Title "Bring your games in". Sub "Pick one. You can add the others later in Settings." Card A "Connect Steam and your library fills itself. Hours and achievements come too; the import runs in the background while you look around." [Connect Steam]. Card B "Link Xbox with your gamertag. No password; your Xbox privacy must let others see your game history." [Connect Xbox]. Card C "PlayStation, GOG or Epic: these take a code you paste once. We'll walk you through it." [Set up]. Card D "Add three games you're playing or waiting for." [Pick games]. Text link "Later" (checklist stays on your profile). Card A, B, D and "Later" use the lines agreed in 03-FUNNEL §4. | `wizard_steam_click`, `wizard_xbox_submitted`, `wizard_pick_started`, `wizard_skipped` | DS 2 h, DEV 2 h |
| — | *Signed up with Steam (after D-015)* | Wizard 1 is skipped; screen 2 opens directly | `library_connected` (steam) | D-015 |
| 20–50 s | **Wizard 2: Importing** | "Importing your Steam library" / "{n} games so far. This updates itself, and you can leave the page; the import keeps going." | — | poll sync status |
| — | Steam profile private (sync status `private`) | "Steam says your game details are private, so we can't see your library. In Steam: Profile → Edit Profile → Privacy Settings → Game details → Public. Then [Try again]." Secondary: "Pick games by hand instead" | — | copy |
| 50–60 s | **Wizard 3: Your library** | "{n} games, {h} hours on record." / "Most played: {game} ({hours} h)." / Buttons: [Mark what you're playing now] [Find something to play tonight] (Backlog Advisor) [See your profile] | `library_connected`; A2 reached | DEV 2 h |
| 60 s | If eligible for Founding 100 (C68) | Line under the numbers: "You qualify for the Founder badge. It arrives within a day." | — | C68 |

Hand-picked path ends: "Three games on your shelf. That's enough for Gamer DNA and Taste Match to start; more games make them sharper." (Replaces the toast "Added {n} games to your collection!"; `PICK_TARGET` in `WelcomeOnboarding.tsx` changes from 5 to 3 to match A2.) Copy removes the current "Welcome to TechPlay 👋" and "Full profile in ~30 seconds" (import time is not measured).

### 3.2 First 5 minutes

| Screen | Exact copy | Action → event | Why |
|---|---|---|---|
| **Playing now** (after import) | "What are you playing at the moment?" / tiles of the 6 most recent Steam games by recent playtime / [Save] · "Skip" | status `playing` → `shelf_add` (status=playing) | Feeds "Continue playing", presence and the Monday thread |
| **Waiting for** | "Anything you're waiting for?" / up to 8 upcoming games from the calendar matching the member's top genres, plus GTA VI until 19 Nov / toggle "Remind me" on each / microcopy "One email on release day for each one you pick. Nothing else." (before C43: "A notification on release day.") | `reminder_set` | Creates the first "your games changed" trigger (L-D1) |
| **Discord** (not shown to Discord sign-ups) | "Your shelf works in Discord too." / "/library, /backlog and /match work in the TechPlay server once you link." / [Link Discord] · "Not now" | `discord_click` (campaign=onboarding) | Second surface for the account [R11 §5] |
| **Profile dashboard with checklist** | See 3.3 | — | — |

### 3.3 Checklist (rewrite of `ProfileChecklist.tsx`, 7 items → 7 items, re-ordered by activation value)

Title: "Set up your library". Footer: "No deadline and no streak. This list disappears when it's done."

| # | Item copy | Link | Counts toward |
|---|---|---|---|
| 1 | "Bring your games in — Steam and Xbox take one click" | wizard | A2 |
| 2 | "Mark what you're playing now" | shelf | A2 |
| 3 | "Get a reminder for one game you're waiting for — one email on release day" | /calendar | L-D1 |
| 4 | "Rate three games you've finished — it sharpens Gamer DNA and Taste Match" | shelf, filter completed | A4 |
| 5 | "Star a favourite — favourites head your profile" | shelf | identity |
| 6 | "Link Discord — your XP and shelf come with you" | Settings → Connections | L-W2 |
| 7 | "Say what you're playing in this week's thread" | current C37 forum thread | A4 |

Removed: "Create a game list" (moves to week 2, L-M4) and "Join a forum discussion" (replaced by item 7, which points at a thread that exists every week).

### 3.4 First day

| When | Channel | Content | Requirement |
|---|---|---|---|
| Within 5 min of A1 (social: of sign-up) | Email | Member welcome M1 (17 §12, E-01): subject "Your TechPlay library is ready for games"; or, if A2 already reached, "{n} games are on your shelf" | D-013, C42 |
| On `/link` or Discord sign-up | Discord DM from Professor Buffy | See copy below | D-011o (DM on link) |
| First achievement unlocks ("Verified Gamer", "Game Hunter") | Bell and toast (existing) | unchanged; no email | exists |
| +24 h, no A2 | Bell | "Your shelf is empty. Steam and Xbox take one click, or add three games by hand. [Bring your games in]" | copy |
| First return visit (24–48 h) | Dashboard card | If Steam linked and `SessionSuggestionService` has a proposal: "Steam says you played {game} for {h} h since yesterday. Log it as a session?" [Log it] [Not a session]. Otherwise: "Out this week: {3 releases from the calendar}" | exists (suggestions), `d1_return` counter |

**First Buffy DM (Discord-linked members only).** Plain first lines, character only in the sign-off [R13 §7]:

> Linked. Your Discord account is now connected to {username} on TechPlay.
>
> What works now:
> `/library` shows your shelf · `/backlog` picks three things to play next · `/match @someone` compares your taste with theirs.
> Release-day reminders can arrive here as DMs. Turn them on in Settings → Notifications on the site.
>
> This week's thread is in #what-are-you-playing.
> — Buffy (I only DM when you've asked me to.)

### 3.5 First week (maximum four emails plus alerts the member set)

| Day | Site | Email (17 §12) | Discord |
|---|---|---|---|
| D0 | Wizard, checklist | M1 welcome | Buffy DM if linked |
| D1 | Session suggestion or "Out this week" card | M2: A2 members "Your shelf, one day in" (03-FUNNEL); others "What do you play on?" | — |
| D2 | — | — | — |
| D3 | Bell nudge if no A2 | E-03 profile incomplete, only if no A2 | — |
| D4 | Hidden Gem Thursday on homepage rail (if Thursday) | — | F05 post (channel per 12-DISCORD) |
| D5 | Bell weekly digest (existing, Friday 16:00) | The Save File, only if opted in | Poll result, Game Club reminder |
| D6 | — | M3: variant A (no A2) "Your library in one click"; variant B (A2) "How close is your taste to ours?" | — |
| D7 | Monday thread (C37) | C41 "Your releases this week", only if a reminder or wishlist game releases in the next 7 days (from 26 Oct) | Buffy posts the Monday thread |

If the member unsubscribes from lifecycle mail, the site-side steps continue unchanged.

### 3.6 Measuring the first week

| Step | Formula | Source | TARGET |
|---|---|---|---|
| Wizard reach | `wizard_shown ÷ registration_complete` (non-redirect sign-ups) | Redis `FunnelAnalytics` (existing), D-007a widget | ↑ toward all non-redirect sign-ups |
| Wizard choice | `wizard_steam_click`, `wizard_xbox_submitted`, `wizard_pick_started`, `wizard_skipped` each ÷ `wizard_shown` | same | skip share ↓ |
| Import success | `library_connected` ÷ (`wizard_steam_click` + `wizard_xbox_submitted`) | `connected_accounts` sync status `done` vs `private`/`error` | ↑; every `private` result is shown the fix copy in §3.1 |
| Time to A2 | median minutes from `users.created_at` to the A2 moment | §1 query with timestamps | ↓ |
| First reminder | members with `reminder_set` within 24 h ÷ A2 members | `growth_events` | ↑ |
| D1 return | A3's first half: action on day 1 (§5.2) | `member_actions` | ↑ (03-FUNNEL: A3 ≥ 35% of A2) |
| First-week email clicks | unique clickers on M1–M3 ÷ delivered | campaign tracking | ↑ |

SC reads this block in the Monday report (§5.4) for the cohort that signed up 7–14 days earlier.

---

## 4. Retention loops

Each loop: trigger → action → reward → investment (what the member puts in that makes the next loop better). Owner is who runs it once built. Caps are per member unless stated. "Ethics" applies the test in §4.6.

### 4.1 Daily and event-driven loops ("your games changed")

| ID | Loop | Trigger → action → reward → investment | Owner | Requirement | Cap | Ethics check |
|---|---|---|---|---|---|---|
| L-D1 | Release-day alert | A game with a reminder or on the wishlist releases today (09:00 jobs) → email / Discord DM / push → opens the game page, marks Playing or buys → knows it's out, where and for how much → shelf status, next reminder | DEV build, SC monitor | C43, D-013, D-019 (push from 9 Nov) | 1 per game per release; several games on one day go in one email; the two existing paths (calendar flag and wishlist check) are de-duplicated | Only games the member picked; "stop reminders for this game" link in every alert |
| L-D2 | Wishlist price drop | Nightly Steam price for a wishlisted game drops below the member's threshold (default: any discount ≥ 20%) → email / DM → store click → saves money → sets thresholds on more games | DEV | D-027 (Steam prices only, US) | 1 per game per 14 days (Steam's own cooldown [R11 §2.2]); max 1 price email per day | Sale end date shown only if the store states it; affiliate links disclosed in the email |
| L-D3 | Reply to your comment or thread | `CommentReplyNotification`, `ForumReplyNotification`, `ThreadWatchNotification` → email with the reply text → replies → conversation → reputation, recognitions | DEV | D-013b (mail channel for replies) | 1 email per thread per 24 h; max 3 reply emails per day; the rest stay in the bell | Reply text in the email, no teaser ("someone replied…"); per-topic opt-out |
| L-D4 | Session suggestion | `SessionSuggestionService` proposes a session from two Steam playtime readings → dashboard card → "Log it" → journal fills without typing → Gamer DNA and year in review get richer | exists | exists | site only, never emailed | It is "a proposal, never a fact"; the member confirms [R11 §3] |
| L-D5 | Daily check-in streak | Member opens the site → claims the day → small Bounty → streak count | SC | D-035 (merge Discord `/daily` into `XpService` cap), D-035a (freeze) | once per day, site or Discord, same reward | Freeze: 1 earned per 7-day streak, 2 banked max; never emailed, pushed or DMed; no "at risk" warnings outside the site; excluded from WRM |
| L-D6 | On This Day | Buffy posts one anniversary in #general (F06, C65) → reactions, replies → nostalgia, message XP (capped) → Discord presence | SC (manual until Buffy automation) | C65; bot scheduled post later | 1 per day | Fact from `/games/on-this-day`; no engagement bait |
| L-D7 | GTA VI countdown | Daily confirmed fact (F02, C06) on Stories, X, Discord #gta6 → hub visit → "Remind me on launch day" → reminder set | SC, DS | C06, D-017 | 1 per day per channel; ends 19 Nov | Confirmed facts only; rumours carry "Rumour" and a source [R17 §2] |

### 4.2 Weekly loops

| ID | Loop | Trigger → action → reward → investment | Owner | Requirement | Cap | Ethics check |
|---|---|---|---|---|---|---|
| L-W1 | Your releases this week (Mon) | Monday 08:00 UTC send to members with a reminder or wishlist game releasing in 7 days → opens games → plans the week → more reminders | DEV build, SC QA | C41, D-028 | 1 per week; skipped if empty | Built only from the member's own list; empty weeks send nothing |
| L-W2 | What Are You Playing? (Mon) | Buffy opens the thread in Discord and the forum (F11, C37) → member posts, links shelf → replies and recognitions → shelf status kept current | SC | C37 | 1 thread per week | Opt-in participation; no ping to @everyone |
| L-W3 | Readiness Check (Tue, WoW reset) | Tuesday post in #wow (F15) → re-run Analyzer on the saved character → score change since last week → saved character, gear goals | ED, SC | D-040, D-040a | 1 per week | Label AI-generated tips as such; fix "Profesor" spelling [R13 §7] |
| L-W4 | Poll of the Week (Wed) | Discord native poll + forum poll (F12, C39) → vote → see the result Friday in the Save File → next poll | SC | C39 | 1 per week | No prize for voting |
| L-W5 | Hidden Gem Thursday | Rail + Discord post (F05, C64) → wishlist or add → a find others missed → wishlist grows (feeds L-D1, L-D2) | ED, SC | C64 | 1 per week | Games chosen by rating and low play, stated on the post |
| L-W6 | The Save File (Fri) | Friday 15:00 Sarajevo time newsletter (F21, C40) → clicks to stories and tools → knows the week → shelf and reminder actions from links | SC assembles, EIC edits | C40 | 1 per week | One-click unsubscribe; clicks, not opens, are the metric |
| L-W7 | Weekly digest (bell) and Buffy's Weekly Wrap (Sun) | Existing Friday bell digest; Sunday 20:00 recap upgraded (F14) with member of the week and next week's releases → visit → recognition → profile | SC | exists; F14 copy | 1 bell item, 1 Discord post | Member of the week only with opt-in (F19 rule) |
| L-W8 | Rising this week | Monday Discord post: top 3 by XP gain since last Monday (existing "rising" computation) → visit leaderboard → recognition → more activity | SC | exists | 1 per week | Private profiles already excluded; friends-only board as default view for members (avoids the empty-room effect [R12 §3]) |
| L-W9 | Weekly quests | Rate a Game, Finish One, Five Sessions, Make a Friend [R01 B.2.5] → bell and quest board → Bounty and XP → shelf and ratings | SC | exists; remove streak-only quests (§4.6) | 3 shown per week (existing shortlist) | Only quests that do something useful for the member |
| L-W10 | Recognition received | `RecognitionNotification` (helpful, insightful, friendly, leader) → bell; weekly count in Monday email if > 0 → visit profile → reputation → more contribution | exists | D-028 (block in Monday email) | 10 per giver per day (existing) | Never shown as a leaderboard of recognitions |

### 4.3 Monthly loops

| ID | Loop | Trigger → action → reward → investment | Owner | Requirement | Cap | Ethics check |
|---|---|---|---|---|---|---|
| L-M1 | Game Club | First week of the month (F22, C38): October Control Resonant, November GTA VI, December member vote → Discord event + forum thread → shared play → status Playing, rating at month end | SC, EIC | C38 | 1 club per month; 2 reminders (start, discussion night) | Nobody is told to buy the game; club picks include what members already own when possible |
| L-M2 | Monthly quests and seasons | Monthly quests (Three Finished, Five Ratings, Two Discussions) and Season 2 "Overdrive" from 1 Nov (C67) → progress on the board → Bounty, champion badge → a profile with a record | SC, DEV | C67; season dates verified in admin; quest fixes §4.6 | monthly board; season announcement once in Discord and once in the Save File | Champion badge must not require a 30-day streak (§4.6) |
| L-M3 | Your month on TechPlay | First Monday of the month: block in the C41 email and a bell item: hours played (Steam), games finished, achievements unlocked, reminders that came true → visit profile → a record → more logging | DEV | D-028 | 1 per month, inside existing email | Shows only true numbers from the member's own data; hidden when all zero |
| L-M4 | Tier list of the month | Prompt in Discord and the Save File ("Your October: tier the games you played") → list created → share card (`/og/list`) → public list | SC | exists | 1 prompt per month | No prize; featured lists chosen by editors with credit |
| L-M5 | Collection goals | Three live targets (finish 10, unlock 25, shrink backlog by 10) [R01 B.2.18] → progress line in the first-Monday email → finish a game → goal and journal | DEV | D-028 | inside existing email | Goals set by the member; defaults can be removed |

### 4.4 Seasonal and yearly loops (Q4 2026)

| ID | Loop | Dates | Trigger → action → reward → investment | Owner | Requirement | Cap / ethics |
|---|---|---|---|---|---|---|
| L-S1 | Steam sale picks from your wishlist | 1–8 Oct (C05), 17 Dec–4 Jan (C34) | Sale starts → email/DM "{n} games on your wishlist are discounted" → store → savings → more wishlist | ED, DEV | D-027 | 1 sale email at start + 1 at last 48 h, only with ≥1 discounted wishlist game |
| L-S2 | Next Fest diary | 19–26 Oct (C18, F23) | Daily "3 demos tried" post → wishlist from the post → demos saved → reminders | ED, SC | C18 | 1 post per day; no email beyond the Save File |
| L-S3 | Black Friday wishlist alerts | 20 Nov–1 Dec (C31) | Price drops across wishlists → one daily digest email only on days with drops → purchases → thresholds | DEV, SC | D-027, C31 | max 1 per day; affiliate disclosure |
| L-S4 | The Game Awards prediction league | 18 Nov–10 Dec (C29) | Picks before the show → live table on the night → bragging rights, badge → next year's league | SC, DEV | D-026 | Picks lock at show start; no paid entry |
| L-S5 | Community Awards 2026 | 1–20 Dec (C30) | Nominate and vote → results post → recognition for picks → community lists | SC | forum and Discord polls | 1 nomination email, 1 voting email to opted-in members |
| L-S6 | Your 2026 in games | 14–31 Dec (C28) | Recap across five platforms → share card → friends sign up to see theirs → their libraries | DEV, DS | D-025, D-024 | 1 email when it's ready; built only from the member's data |

### 4.5 Channel caps (all loops together)

| Channel | Cap per member | Priority when caps collide |
|---|---|---|
| Email | ≤1 non-alert email per day; ≤6 emails per rolling 7 days (verify and password reset excluded); alerts on the same day are merged into one email | 1 security (verify, reset) · 2 alerts the member set (release day, price) · 3 replies · 4 lifecycle · 5 newsletter. Lower priority waits for the next Monday email |
| Discord DM | ≤2 per day, only for alert types the member turned on | same order |
| Web push (from 9 Nov, C59) | ≤1 per day; reminders only; permission asked only after a click on "Remind me" | alerts only |
| Bell | uncapped, grouped by type per day | — |
| Quiet hours | No email, DM or push sent between 22:00 and 08:00 in the member's time zone (browser time zone saved at sign-up, D-013d); default UTC | alerts wait until 08:00 |

### 4.6 Ethics rules and the two fixes needed before 1 Nov

A mechanic is acceptable if it tells the member something true about their own games or community, and unacceptable if it creates loss aversion for its own sake [R12 §3].

| Rule | Applies to | Test before shipping |
|---|---|---|
| Per-topic opt-in and one-click off | every email, DM, push type | Settings → Notifications lists each type with its own switch (D-013a) |
| No guilt copy | all channels | Banned: "We miss you", "Don't lose your streak", "You're falling behind", "Last chance" (unless a real deadline), "Your friends are waiting" |
| Streaks have a freeze and no penalty messaging | L-D5 | Freeze exists; streak never mentioned in email, DM or push |
| No fake urgency | L-D2, L-S1, L-S3 | End dates shown only when the store states them |
| Rewards stay cosmetic | Bounty, giveaway points | No cash value, no paid boosts; store items are cosmetics [R01 B.2.6] |
| True numbers only | L-M3, L-S6, share cards | Hidden when zero; never estimated without saying so |
| Buffy never nags | bot and notifications | Plain first line; one owl joke at most; never mentions absence [R13 §7] |
| Minors | giveaways, paid | Paid tests 18+ (spine §13); giveaway rules checked per draw |

**Fix 1 — the 30-day streak quest (before 1 Nov).** Season 2 "Overdrive" includes "Thirty Days Running" (streak 30), and the champion badge goes only to members who complete every quest of the season [R01 B.2.5]. That makes the season's top reward a 30-day streak. Replace it with "Log sessions on 12 different days" (`session_logged`, value 12) via the quest admin or a migration. Owner SC decides, DEV 1 h.

**Fix 2 — Discord `/daily` (D-035).** It pays 50 XP plus up to 50 streak bonus directly into `users.xp`, bypassing the 100 XP daily cap, the season multiplier and the ledger, and shares the streak columns with the site claim [R01 B.2.7]. Route it through `XpService` with the same reward as the site claim. DEV 3 h.

**Monitoring:** the streak honesty check (§5) runs monthly. If more than a third of members who lose a 7+ day streak show no action in the next 14 days, the streak UI is reduced to a plain "active days" count.

### 4.7 Notification copy rules and examples

Plain first line, the member's own data, one action, a way off. Character (Buffy) only in the sign-off, never in the first line [R13 §7].

| Type | Channel | Example |
|---|---|---|
| Release day | Email subject / DM | "Out today: Gears of War: E-Day" · body first line "Gears of War: E-Day is out today on PC and Xbox. You asked us to tell you." |
| Two releases same day | Email subject | "Out today: Planet Zoo 2 and 1 more on your list" |
| Price drop | DM | "Price drop: {Game} is {price} on Steam ({discount}% off). Your alert was set at {threshold}%. [Store page] · Stop alerts for this game" |
| Reply | Email subject | "{user} replied to your comment on '{article title}'" · body quotes the reply |
| Session suggestion | Dashboard | "Steam says you played {game} for {h} h since yesterday. Log it as a session?" |
| Rank up | Bell | "You're now Rookie. Next rank at 600 XP." |
| Quest done | Bell | "Quest done: Rate a Game. +60 XP, +60 Bounty." |
| Season launch | Discord, once | "Season 2, Overdrive, runs 1 November to 31 December. Four quests, a champion badge for finishing them. Details on the leaderboard page." |

### 4.8 Followed games, personalisation and profiles

These are the surfaces the loops above feed. None needs a new model before 31 Dec.

| Surface | How it works in Q4 | Copy | Requirement |
|---|---|---|---|
| "Follow" a game | Until a follow model exists, **Follow = wishlist (unreleased) or shelf (released) + news on**. The C45 button reads "Remind me" on unreleased games and "Follow" on released ones. Articles linked to a followed game already raise `GameNewsNotification` [R01 B.2.10]; those go to the bell and, batched, to the Monday email | Button "Follow" → state "Following" · tooltip "News about this game in your bell and your Monday email. Unfollow any time." | C45, D-016, D-028; event `game_followed` |
| Studio follow | not built this quarter (no model) [R11 §3] | — | Q1 2027 candidate |
| "For you" feed | `/feed/personalized` reorders, never hides, and reports when it knows nothing [R01 B.2.17]. Make it the default tab of `/latest` for A2 members | Empty state: "We don't know your taste yet. Add three games and this page sorts itself around them. [Bring your games in]" | copy, DEV 1 h |
| Personal game-page block | `/games/{slug}/suggested` is already personalised when signed in | Heading for members: "Because you played {game}" (only when the reason is a shelf game) | copy |
| Profile as the reward | Gamer DNA, trophy case, favourites, recent activity [R01 B.2.16, B.2.18] | Owner's empty trophy case: "Pick five achievements to show here. Steam achievements count." | copy |
| Share card | Gamer DNA and list cards (D-024, `/og/list` exists) | Button "Share your DNA card" · after share: "Anyone who opens it can make their own in one step." | D-024 |
| Achievements | 67 in the catalogue; unlocks toast and go to the bell [R01 B.2.4] | No email for achievements. Rare ones (fewer than 5% of members) get a "Share" button once D-024 exists | D-024 |

### 4.9 Buffy's voice in these loops

The Discord welcome embed, rank-up, daily, tip, DM and event lines are rewritten in 12-DISCORD §8.2–8.3 (D-011a); this file does not repeat them. Loops in §4 follow the same rules: plain first line with the member's own data, at most one owl line in the sign-off, never a mention of absence or streak risk [R13 §7]. The one new message this file adds is the DM on account link (§3.4, D-011o); 12-DISCORD's `/remind` and release-day DM (D-011h) carry L-D1 on Discord.

### 4.10 Loop coverage check

Every retention lever named in the brief, and the loop that carries it:

| Lever | Loops |
|---|---|
| Followed games | L-D1, L-W1, §4.8 Follow |
| Release reminders | L-D1, L-W1, L-D7 |
| Comments and replies | L-D3, L-W2 |
| Profiles | L-W10, L-M3, §4.8 |
| XP and achievements | L-W8, L-W9, L-M2, §4.7 |
| Collections | L-D4, L-M4, L-M5 |
| Game activity | L-D4, L-M3, L-S6 |
| Community | L-W2, L-W4, L-M1, L-S4, L-S5 |
| Email and newsletter | L-D1, L-D2, L-D3, L-W1, L-W6 |
| Notifications (bell, DM, push) | L-D1, L-D2, L-D3, L-W7, §4.5 |
| Personalisation | L-W1, L-M3, §4.8 "For you" |

---

## 5. Retention metrics (SQL-ready)

All metrics are computed on accounts from `member_actions` (D-007b). Weeks are ISO weeks, Monday 00:00 UTC.

### 5.1 North Star: Weekly Returning Members (WRM)

Accounts with at least one meaningful action in the 7-day window (spine §3).

```sql
-- WRM for the ISO week starting :week_start
SELECT COUNT(DISTINCT ma.user_id) AS wrm
FROM member_actions ma
JOIN users u ON u.id = ma.user_id
WHERE ma.created_at >= :week_start
  AND ma.created_at <  :week_start + INTERVAL '7 days'
  AND u.is_banned IS NOT TRUE;   -- users.is_banned exists (User model)
```

**WRM composition** (reported every Monday):

```sql
WITH wk AS (
  SELECT DISTINCT user_id FROM member_actions
  WHERE created_at >= :week_start AND created_at < :week_start + INTERVAL '7 days'),
prev4 AS (
  SELECT DISTINCT user_id FROM member_actions
  WHERE created_at >= :week_start - INTERVAL '28 days' AND created_at < :week_start)
SELECT
  COUNT(*) FILTER (WHERE u.created_at >= :week_start)                                  AS wrm_new,
  COUNT(*) FILTER (WHERE u.created_at <  :week_start AND wk.user_id IN (SELECT user_id FROM prev4))     AS wrm_retained,
  COUNT(*) FILTER (WHERE u.created_at <  :week_start AND wk.user_id NOT IN (SELECT user_id FROM prev4)) AS wrm_resurrected
FROM wk JOIN users u ON u.id = wk.user_id;
```

**TARGET.** This file sets no separate WRM number. Two strategy files already do and they differ: 30-ANALYTICS K00 sets 15–25 (31 Oct), 30–50 (30 Nov), 45–70 (last week of December); 03-FUNNEL sets 60–120 averaged over 7–20 Dec. EIC to pick one on 2 Nov once the first four readings exist (open question 7). Week-on-week WRM ↑ from W44 is the directional TARGET for the loops in §4.

### 5.2 D1, D7, D30 action retention

Daily volumes are small, so each "day N" uses a bracket window. Cohort = accounts that reached A2 (activated), grouped by sign-up week; the same query on all A0 accounts is reported alongside.

| Metric | Window after `users.created_at` |
|---|---|
| D1 | any action in [1 day, 2 days) |
| D7 | any action in [7 days, 14 days) |
| D30 | any action in [30 days, 37 days) |

```sql
-- Dn action retention for the A2 cohort who signed up in :cohort_week
WITH cohort AS (
  SELECT u.id, u.created_at FROM users u
  WHERE u.created_at >= :cohort_week AND u.created_at < :cohort_week + INTERVAL '7 days'
    AND (EXISTS (SELECT 1 FROM connected_accounts ca WHERE ca.user_id = u.id
                   AND ca.created_at < u.created_at + INTERVAL '7 days')
         OR (SELECT COUNT(*) FROM user_games ug WHERE ug.user_id = u.id
               AND ug.created_at < u.created_at + INTERVAL '7 days') >= 3))
SELECT
  COUNT(*) AS cohort_size,
  AVG(CASE WHEN EXISTS (SELECT 1 FROM member_actions ma WHERE ma.user_id = c.id
        AND ma.created_at >= c.created_at + INTERVAL '1 day'
        AND ma.created_at <  c.created_at + INTERVAL '2 days')   THEN 1 ELSE 0 END) AS d1,
  AVG(CASE WHEN EXISTS (SELECT 1 FROM member_actions ma WHERE ma.user_id = c.id
        AND ma.created_at >= c.created_at + INTERVAL '7 days'
        AND ma.created_at <  c.created_at + INTERVAL '14 days')  THEN 1 ELSE 0 END) AS d7,
  AVG(CASE WHEN EXISTS (SELECT 1 FROM member_actions ma WHERE ma.user_id = c.id
        AND ma.created_at >= c.created_at + INTERVAL '30 days'
        AND ma.created_at <  c.created_at + INTERVAL '37 days')  THEN 1 ELSE 0 END) AS d30
FROM cohort c;
```

Import rows: a Steam or Wednesday re-sync (`platforms:resync`) writes `user_games` rows that are not the member's action. D-007b must record `shelf_change` only for member-initiated changes (source = web/discord), not for sync jobs.

### 5.3 Supporting metrics

| Metric | Definition | Direction |
|---|---|---|
| Activation rate | A2 ÷ A0 per sign-up week (query §1) | ↑ |
| Time to first shelf item | median of `MIN(user_games.created_at) − users.created_at` per sign-up week | ↓ |
| Alert → visit rate | `alert_clicked ÷ reminder_delivered`, per channel (email, discord, push) and type | ↑ |
| Alert → action rate | members with a `member_actions` row within 24 h of `reminder_delivered` ÷ members who received one | ↑ |
| Newsletter downstream action | members with an action within 24 h of a send ÷ members who clicked | ↑ |
| Ritual participation | distinct members posting in the Monday thread, voting in the poll, attending Game Club | ↑ |
| Notification opt-outs by type | switches turned off per type per week ÷ members with the type on | ↓ (guardrail) |
| Streak honesty check | members who lost a ≥7-day streak and had no action in the next 14 days ÷ members who lost a ≥7-day streak | ↓ (alarm above one third) |
| Resurrected share | `wrm_resurrected ÷ wrm` | watch |
| Discord linked share | linked Discord IDs ÷ server members (API count) | ↑ |

### 5.5 Where each event fires (for D-007)

| Event (spine §10) | Fired from | Notes |
|---|---|---|
| `library_connected` (platform) | server, `ConnectedAccountObserver` | also writes `member_actions` |
| `shelf_add` (status) | server, `GameCollectionController` | member-initiated only; sync jobs excluded |
| `game_followed` | server, C45 endpoint | Follow = wishlist or shelf + news on |
| `reminder_set` | server, `CalendarController` reminder toggle | writes `member_actions` (no timestamp exists today) |
| `reminder_delivered` (channel) | server, alert sender (C43) | one per game per channel |
| `alert_clicked` | server, signed click redirect (`/api/v1/mail/…`) and DM/push deep links with `utm_medium=email` or `push` | clicks are trusted, opens are not [R20 §4] |
| `rating_created`, `comment_created`, `comment_approved`, `list_created` | server observers | `comment_approved` is the A4 moment for comments |
| `tool_run` (tool) | server for WoW (D-040a), client for release-time and backlog | — |
| `notification_enabled` (push) | client, after permission granted | — |
| `d1_return` | existing `FunnelAnalytics` (localStorage-guarded, per browser) | undercounts cross-device; A3 via `member_actions` is the reliable version |
| `share_card_generated` (type) | server, OG route hit with `?share=1` | — |

### 5.4 Weekly retention report (SC, Mondays, 30 minutes; reads D-007a widget)

Five numbers and one sentence each: WRM (with new / retained / resurrected), A2 rate for the cohort two weeks ago, D7 for the cohort three weeks ago, alert → visit rate by channel, opt-outs by type. Posted in the staff channel; EIC decides one change per week at most.

---

## 6. Rollout by week

| Week | Dates | Ships | Loops live | Owner | Hours (ESTIMATE) |
|---|---|---|---|---|---|
| W40 | 28 Sep–4 Oct | A2 baseline query run once on production; C37 thread and C65 On This Day start; C39 poll from 30 Sep | L-W2, L-W4, L-D6 | DEV, SC | DEV 1, SC 4 |
| W41 | 5–11 Oct | D-007b `member_actions` view (after D-007's `growth_events`); wizard, checklist and verify-state copy (§3); Game Club October opens (Control Resonant) | L-M1 | DEV, DS, SC | DEV 8, DS 4, SC 3 |
| W42 | 12–18 Oct | C42 welcome sequence (17); D-011o Buffy DM on link; D-013a notification preferences | first-day steps | DEV, SC | DEV 8, SC 3 |
| W43 | 19–25 Oct | C43 release-day email and Discord DM; D-013b replies by email; Next Fest diary | L-D1, L-D3, L-S2 | DEV, ED | DEV 10, ED 6 |
| W44 | 26 Oct–1 Nov | C41 Monday email (26 Oct); D-035 and Fix 1 before Season 2 (1 Nov); D-035a freeze | L-W1, L-D5, L-M2 | DEV, SC | DEV 10 |
| W45 | 2–8 Nov | Targets set from four cohorts; D-027 price alerts start (Steam) | L-D2 | DEV, EIC | DEV 8 |
| W46 | 9–15 Nov | C59 web push for reminders; D-040a saved characters (Readiness Check full loop) | L-W3 full | DEV | DEV 6 |
| W47 | 16–22 Nov | GTA VI week: no new retention builds; reminders and Game Club (GTA VI) run | L-D1 at peak | SC | SC 4 |
| W48 | 23–29 Nov | C31 Black Friday alerts; first monthly "your month" block ready for 7 Dec | L-S3 | DEV | DEV 4 |
| W49 | 30 Nov–6 Dec | Community Awards (C30) nominations; L-M3 first send Mon 7 Dec | L-S5, L-M3 | SC, DEV | SC 3 |
| W50 | 7–13 Dec | TGA league night 10 Dec | L-S4 | SC | SC 4 |
| W51–W53 | 14–31 Dec | Year in Review; Winter Sale alerts; streak honesty check; Q1 review | L-S6, L-S1 | DEV, SC, EIC | SC 3, EIC 2 |

Totals (ESTIMATE): DEV ≈ 65 h over 13 weeks (overlapping the C41/C43 hours also counted in 17), SC ≈ 4 h/week, DS ≈ 6 h, ED ≈ 6 h, EIC ≈ 1 h/week for the Monday decision.

---

## Dependencies and open questions

**Dependencies**
- D-007 (`growth_events`, specified in 30-ANALYTICS) and D-007b (`member_actions` view) before any WRM or D1/D7/D30 number is reported; D-007a widget to read it.
- C43 (release-day email and DM, 19 Oct), C41 and D-028 (Monday email, 26 Oct), D-027 (price alerts), C59 and D-019 (push, 9 Nov), D-013 (mail channel), D-013a (per-type preferences), D-013b (reply emails), D-013d (member time zone for quiet hours), D-011o (Buffy DM on link; D-011h in 12-DISCORD covers `/remind` and the release-day DM path), D-035 and D-035a (streak merge and freeze), D-040 and D-040a (Analyzer saved characters), D-024 and D-025 (cards, Year in Review), D-026 (prediction league).
- New sub-IDs introduced here: D-007b `member_actions` view, D-011o Buffy DM on link, D-013a notification preference centre, D-013b reply mail channel, D-013d member time zone, D-035a streak freeze.
- 15-REGISTRATION.md (R-03 Steam sign-in skips wizard screen 1; R-06 email capture) and 17-NEWSLETTER-EMAIL.md (M1–M3, E-01 to E-12 copy).

**Open questions**
1. Season dates: two migrations disagree (Ignition 1 Sep–31 Oct and Overdrive 1 Nov–31 Dec, versus 22 Sep–21 Dec and 22 Dec–21 Mar). C67 assumes 1 Nov. SC to read the `seasons` table in admin on 28 Sep [R01 B.2.5].
2. A2 threshold: spine and [R11] say ≥3 shelf items; [R12] says ≥5; `campaign:founders` uses ≥5. This file uses ≥3; the Founder badge rule must match whatever EIC confirms.
3. Import rows versus member actions: confirm that `user_games.sources` or another field distinguishes sync-created rows, so D-007b can exclude them from WRM.
4. Is the "Thirty Days Running" quest editable in admin, or does Fix 1 need a migration?
5. Discord DM delivery for release alerts: the bot's DM subscriptions poll every 5 minutes for news and giveaways only [R01 B.8.2]. 12-DISCORD proposes D-011h (`/remind` plus a release-day DM through the C43 path); DEV confirms that path by 9 Oct so L-D1 has one Discord implementation, not two.
6. Quiet hours need a time zone per member; none is stored today. Until D-013d, sends go at fixed UTC times chosen for EU mornings and US mornings (17 §2).
7. WRM TARGETs differ between 03-FUNNEL (60–120 averaged 7–20 Dec) and 30-ANALYTICS K00 (45–70 in the last week of December). This file adopts neither; EIC to choose one number on 2 Nov.
