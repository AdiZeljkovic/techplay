# 31 — Experiments

Status: Phase 2 plan — 27 Sep 2026

Part 45 of the brief: the experiment register for Q4 2026. Machine-readable copy: `experiments.json` (all entries `status: "backlog"`). Event names and KPIs are defined in `30-ANALYTICS.md`.

- **96 experiments (X-001 to X-096)** across registration (10), activation (8), newsletter (8), Discord (7), content and SEO (10), Discover headlines (6), social formats (9), video (6), email (6), giveaways (5), paid (15, one per R16 test card T1–T15) and tools (6).
- **Priorities:** 30 P1, 41 P2, 25 P3. P1s ride on work already scheduled in the spine (C44, C45, C46, C08, C11, C28, C40, C41, C60, C68); few need extra build.
- **Nothing is read before C03 is done.** No experiment that uses a spine §10 event starts before D-007 ships (target 9 Oct); no paid experiment starts before 19 Oct (spine §13), and none on Meta before D-031.
- **TechPlay's numbers are too small for classical A/B tests.** 60 members, 22 comments, 1–2 search clicks a day [R01, R03]. The designs here are pre/post windows, alternating weeks (ABAB), user-id parity holdouts for email, and matched page groups for SEO, with large-effect thresholds and minimum counts written in advance (§2).
- **Every success threshold is explicit** and was written before the data exists. A result below the minimum count is "inconclusive", never "failed" or "won".
- **One change per surface at a time.** Conflicting experiments on the same surface run in sequence (§3).
- **Capacity:** reading and logging experiments costs about 1.5 h a week (SC 1 h, EIC 0.5 h) inside the Monday review (30 §9). Build hours sit in the campaigns they belong to.

---

## 1. How to use this register

1. An experiment moves `backlog → ready → running → read → decided` in the sheet's Experiments tab (30 §8.1). The JSON keeps the backlog state; the sheet keeps the live one.
2. **Ready** means: its dependencies are live, its events appear in QA (30 §6.1 note 7), and the pre-window data exists.
3. **Read** happens at the Monday review once the duration has passed or the minimum count is reached, whichever is later. Stop-losses (paid) are checked daily by EIC.
4. **Decided** is one of: ship, revert, iterate (new X-ID with a suffix, for example X-006a), or inconclusive (extend once, then drop).
5. Every experiment is annotated with anything that could explain the result: GTA VI week (16–22 Nov), Steam Autumn Sale (1–8 Oct), Next Fest (19–26 Oct), Black Friday (27 Nov), The Game Awards (10 Dec), Steam Winter Sale (17 Dec–4 Jan), Google updates, deploys and outages.

## 2. Sample-size reality

A conventional A/B test needs far more traffic than TechPlay has. Standard arithmetic for comparing two conversion rates at 95% confidence and 80% power:

n per arm = (1.96 + 0.84)² × [p₁(1 − p₁) + p₂(1 − p₂)] ÷ (p₁ − p₂)²

To detect a lift from 2% to 3% that is 7.84 × (0.0196 + 0.0291) ÷ 0.0001 ≈ **3,800 visitors per arm** reaching the surface, and roughly 75–115 conversions per arm. The register page, the verify page and most CTAs will not see that in a quarter. So:

| Design | When we use it | Guard against |
|---|---|---|
| **Pre/post** with fixed windows (usually 14 or 21 days each, same weekday mix) | Copy and flow changes that cannot run side by side (X-001, X-002, X-012) | Seasonality and launches: annotate, and never let a window straddle GTA VI week unless the experiment is about it |
| **ABAB alternating weeks** (or days, or issues) | Two variants of one surface where a switch is cheap (X-006, X-011, X-020, X-022) | Week effects: each variant gets at least two periods |
| **Holdout by user id parity** | Email and alerts, where assignment is clean (X-014, X-067, X-068) | Small arms: below 30 per arm, read as directional only |
| **Matched page groups** (difference in differences) | SEO and Discover, where the unit is a page (X-036, X-039, X-040, X-047) | Uneven groups: match on impressions and page type before treating |
| **Sequential reading with a stop rule** | Paid tests, with the R16 stop-losses | Peeking: only stop-losses end a test early; success waits for the full window |
| **Keep-or-kill** | Channels (X-054, X-060) | Sunk cost: the threshold is written before the first post |
| **Concurrent comparison** | Two things live at the same time, read with one yardstick (X-003 sign-up methods, X-028 invite placements, X-066 two emails) | Different audiences per arm: report who each arm reached |
| **Absolute threshold, no control** | New surfaces with no prior to compare against (X-005, X-019, X-091) | Crediting the change for background growth: set the threshold high and check site-wide traffic in the same weeks |

Three habits follow:

- **Only large effects count.** Thresholds are 1.2× to 3× because only effects that size can be told apart from noise at our volumes. A 10% lift is invisible here, and we do not pretend otherwise.
- **Counts beside rates.** "40% (4 of 10)" is written that way in the log.
- **Zero is informative.** With 0 conversions in n tries, the true rate is plausibly as high as about 3 ÷ n (the rule of three, 95% upper bound). 0 registrations from 300 sessions still allows a rate up to 1%.

## 3. Sequencing and conflicts

| Surface | Order | Why |
|---|---|---|
| /register | X-002 (with C01, W40) → X-001 (with C44) → X-003 (Steam, from 26 Oct) | Correctness first, then friction, then the new method |
| Game pages | X-005 (from 19 Oct) → X-025 (from 16 Nov, after 28 days of X-005) | Both change the guest ask on the same page |
| Article end | X-020 and X-028 together (different elements of the D-010 block), then X-006 | X-006 changes the account element X-020 is ordering |
| Newsletter sends | X-022 and X-070 alternate on different issues; X-023 waits until both are read | Three variables on one send cannot be separated |
| Giveaways | X-071 → X-072 → X-073 and X-074 on successive giveaways (25-GIVEAWAYS calendar) | Each needs a full giveaway |
| Wizard | X-011 before X-015 | Order first, length second |

**Starting order (TARGET):** W40–W41: X-002, X-019 prep, X-027, X-034 decision, X-041, X-030, X-046, X-053. W42–W44: X-001, X-005, X-012, X-020, X-024, X-028, X-037, X-042, X-060, X-071, X-073, X-076, X-086, X-091. W44–W48: X-003, X-010, X-014, X-066, X-077, X-079, X-089, X-093, X-094. W49–W53: X-095, X-096, X-069 (from issue 9) and reads of everything above.

## 4. The register

Each entry: hypothesis, audience, change, metric (event names from 30 §6.2), effort (S up to 4 h, M 4–16 h, L more than 16 h), duration, success threshold, expected learning, dependencies, priority.

### 4.1 Registration

**X-001 · Social sign-in above the email form** · P1 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** Putting Google, Discord and Battle.net (and Steam once D-015 ships) above the password form raises completion, because social sign-up skips Turnstile, the five-rule password and the inbox wait [R11 §1.3]. **Audience:** All visitors to /register (phone layout first: 1,487 phone vs 184 desktop requests [R11]).
- **Change:** RegisterClient.tsx: full-width social buttons on top, 'or with email' form below (C44 page rewrite, R-02 in 15-REGISTRATION). **Metric:** registration_complete ÷ /register sessions (first-party), split by method.
- **Success threshold:** Post-window completion rate ≥ 1.5× the 14-day pre-window AND ≥ 60% of completions via a social method, with ≥ 15 completions in the post window.
- **Expected learning:** Whether friction (the gates) or motivation (the offer) is what stops sign-ups. **Dependencies:** D-014, C44, D-007.

**X-002 · Honest register panel (trust fix)** · P1 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** Replacing '15K+ MEMBERS · 50K+ GAMES' and the false read-XP perk with the homepage's four mechanisms and an API-fed game count does not reduce completion. **Audience:** All /register visitors.
- **Change:** D-001 copy change on /register and /login; no other change in the same fortnight. **Metric:** registration_complete ÷ /register sessions.
- **Success threshold:** Non-inferiority: post-window completion rate ≥ 0.8× the pre-window rate. A lower result is recorded, not reverted.
- **Expected learning:** Shows that removing false social proof costs nothing measurable; the change ships regardless because it is a correctness fix. **Dependencies:** D-001, C01.

**X-003 · Steam as a sign-in method** · P1 · Effort M · 28 days · Design: concurrent comparison by sign-up method
- **Hypothesis:** A 'Sign in through Steam' button produces A2 Shelved members at ≥ 2× the rate of email sign-ups, because the library imports on the first click [R11 §5]. **Audience:** /register visitors and the onboarding wizard; S2 Multi-platform Collectors, S3 PC Tinkerers.
- **Change:** D-015 Steam OpenID login creating the account from the SteamID64 and starting the import job; email asked for later (X-016). **Metric:** registration_complete (method=steam); library_connected within 7 days by method.
- **Success threshold:** ≥ 10 Steam sign-ups in 28 days AND their 7-day A2 rate ≥ 2× the email-method A2 rate in the same window.
- **Expected learning:** Whether 'the library is the sign-up' is TechPlay's best acquisition argument. **Dependencies:** D-015, C44, D-007.

**X-004 · Return new members to where they started** · P2 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** Returning a new member to the page they came from (comment box, game page, giveaway) raises the share who act within the first hour. **Audience:** Registrants arriving from comments, game pages, giveaways (from=comments|game|giveaway).
- **Change:** D-014 honours ?redirect= for social sign-ups and verified email sign-ups; D-016 resumes the action. **Metric:** Share of registration_complete followed by comment_created, shelf_add or reminder_set within 60 minutes.
- **Success threshold:** ≥ 40% of redirected registrants act within 60 minutes (pre-period share from a users/comments/user_games timestamp query), minimum 10 registrants.
- **Expected learning:** How much intent is lost at the registration hop today. **Dependencies:** D-014, D-016, D-007.

**X-005 · Guest 'Remind me' on game and calendar pages** · P1 · Effort M · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Game pages are the largest sign-up surface (56,355 URLs indexed [R03]); a guest 'Remind me' that opens a sign-up modal and returns to the game converts better than today's login link. **Audience:** Guests on unreleased game pages, /calendar and /calendar/[slug].
- **Change:** D-016 modal ('Tell me when {game} is out. Free account, one click with Google or Discord.'), C45. **Metric:** registration_complete (from=game|calendar); reminder_set in the first session.
- **Success threshold:** ≥ 20 registrations with from=game or from=calendar in 28 days AND ≥ 70% of them have reminder_set in the same session.
- **Expected learning:** Whether release intent is a stronger sign-up reason than 'start your library'. **Dependencies:** D-016, C45, D-007.

**X-006 · Game-specific article-end prompt** · P2 · Effort S · 28 days · Design: ABAB weeks
- **Hypothesis:** On articles with a game_id, 'Add {game} to your shelf' earns more clicks than the generic account panel. **Audience:** Guests reading articles that carry articles.game_id.
- **Change:** JoinPrompt variant inside the D-010 article-end block; alternate generic and game variants by ISO week (ABAB). **Metric:** cta_click (cta_id=article-end-join-generic vs article-end-join-game) per 1,000 article sessions; registration_complete from=article-game.
- **Success threshold:** Game variant click rate ≥ 1.3× generic in both of its weeks, with ≥ 30 clicks in total.
- **Expected learning:** Whether specificity beats a general pitch on the surface with the most readers. **Dependencies:** D-010, C46, D-007.

**X-007 · Verify-email page that says what already works** · P2 · Effort S · 42 days · Design: pre/post
- **Hypothesis:** Explaining what works before verification (shelf, import) and what verification unlocks (comments, giveaways, digest) raises 72-hour verification. **Audience:** Email-method registrants waiting on /verify-email.
- **Change:** Copy change on /verify-email (R-05 in 15-REGISTRATION): one list of 'works now', one of 'after you click the link'. **Metric:** email_verified within 72 h ÷ registration_complete (method=email); weekly prune count.
- **Success threshold:** ≥ 90% verify within 72 h (last reading: 50 of 55 confirmed, undated window [R12]) AND prune count does not rise.
- **Expected learning:** Whether the inbox gate loses people through confusion or through a missing mail. **Dependencies:** D-014, D-007.

**X-008 · Newsletter verify page offers an account** · P2 · Effort S · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** The moment after double opt-in is warm; a pre-filled 'make it an account' with Google one-tap converts ≥ 10% of new verified subscribers. **Audience:** People landing on /newsletter/verify after clicking the confirmation link.
- **Change:** Panel on app/newsletter/verify/page.tsx: 'You're on the list. Want your games in one place too?' with Google/Discord buttons and email pre-filled. **Metric:** registration_complete (from=newsletter-verify) ÷ newsletter_verified.
- **Success threshold:** ≥ 10% of newly verified subscribers register within 10 minutes, measured over ≥ 50 verifications.
- **Expected learning:** Whether newsletter and account are one audience or two. **Dependencies:** D-012, D-007.

**X-009 · Leaderboard empty state becomes an invitation** · P3 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Replacing 'Nobody has moved yet this week' with 'Be the first this week: connect Steam and your completions count' turns an empty page into a sign-up path. **Audience:** Guests on /leaderboard.
- **Change:** Copy and CTA on the empty state (D-029 hides zero-value modules elsewhere). **Metric:** cta_click (cta_id=leaderboard-empty-connect); registration_complete (from=leaderboard).
- **Success threshold:** ≥ 5 registrations with from=leaderboard in 28 days (pre-period assumed 0; nothing measured it).
- **Expected learning:** Whether competitive framing works at a population of 60. **Dependencies:** D-029, D-007.

**X-010 · Buffy replies with a one-click account link** · P1 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Unlinked Discord members who use /daily, /profile or /library register at ≥ 20% when the bot answers with a Discord OAuth link that lands on the shelf [R11 row 20]. **Audience:** Discord members with no linked TechPlay account who run a member command.
- **Change:** Bot reply footer: 'This works better with your library behind it. Link in one click:' → Discord OAuth → /profile shelf. **Metric:** registration_complete (method=discord, from=discord) ÷ distinct unlinked command users.
- **Success threshold:** ≥ 20% of unlinked members who trigger a command register within 14 days, minimum 10 distinct members.
- **Expected learning:** Whether the Discord room is the highest-intent acquisition pool TechPlay has. **Dependencies:** C35, D-007.

### 4.2 Activation

**X-011 · Wizard order: connect Steam first vs pick games first** · P2 · Effort S · 28 days · Design: ABAB weeks
- **Hypothesis:** Opening the onboarding wizard on 'connect Steam' produces more A2 members than opening on 'pick games', because import fills the shelf in one step. **Audience:** New members who see WelcomeOnboarding.tsx.
- **Change:** Alternate the first wizard step by ISO week (ABAB). **Metric:** wizard_shown → library_connected or wizard_pick_done; A2 within 7 days.
- **Success threshold:** Winning order's 7-day A2 rate ≥ 1.3× the other across both of its weeks, with ≥ 15 wizard_shown per arm; otherwise extend by 2 weeks and call it inconclusive.
- **Expected learning:** Which first step carries more members over the A2 line. **Dependencies:** D-007.

**X-012 · Founding 100 framing** · P1 · Effort S · 42 days · Design: pre/post
- **Hypothesis:** Telling registrants that the first 100 members who connect a platform or shelve three games get the Founder badge raises the A2 rate. **Audience:** All new members from launch of C68.
- **Change:** Extend campaign:founders from 50 (≥5 games) to 100 with the A2 rule; show a live 'N of 100 claimed' count from the API on /register and in the wizard. **Metric:** A2 within 7 days of registration_complete; badges awarded.
- **Success threshold:** 7-day A2 rate ≥ 1.5× the 21-day pre-window AND ≥ 25 badges awarded by 31 Oct. The count shown must be live; no placeholder.
- **Expected learning:** Whether scarcity that is true moves activation without inflating anything. **Dependencies:** C68, D-007.

**X-013 · Library-worth card straight after import** · P2 · Effort M · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Showing 'Your Steam library: N games, $X at today's prices' right after import increases sharing and 7-day return. **Audience:** Members completing a Steam import (US Steam prices only [R01]).
- **Change:** Card on the import-complete screen with Save/Share (D-024 share card route). **Metric:** share_card_generated (type=library-worth) ÷ library_connected (platform=steam); A3 within 7 days.
- **Success threshold:** ≥ 15% of Steam importers generate a card AND ≥ 3 registrations arrive through card links (from=share-card) in 28 days.
- **Expected learning:** Whether a number about their own library is the share trigger TOOL-03 scored it as [R21]. **Dependencies:** D-024, D-007.

**X-014 · Welcome email 2: link your library** · P1 · Effort M · 42 days · Design: holdout (user id parity)
- **Hypothesis:** A day-2 email ('Your shelf is empty. Steam takes 30 seconds.') raises A2 among members who have not activated. **Audience:** Non-activated new members; alternate by user id parity (treated vs holdout).
- **Change:** Email 2 of the C42 welcome sequence; holdout receives nothing on day 2. **Metric:** library_connected within 7 days, treated vs holdout.
- **Success threshold:** Treated A2 rate ≥ holdout + 10 percentage points with ≥ 30 members per arm; below 30 per arm the result is read as directional only.
- **Expected learning:** Whether email can do activation work the bell cannot. **Dependencies:** C42, D-013, D-007.

**X-015 · Three-item checklist instead of seven** · P2 · Effort S · 56 days · Design: pre/post
- **Hypothesis:** Cutting ProfileChecklist from seven items to three (connect a platform, add three games, set one reminder) raises completion of those three. **Audience:** New members on their dashboard.
- **Change:** ProfileChecklist.tsx shows three items; the other four move to a 'later' list. **Metric:** Share of new members with library_connected or 3× shelf_add AND reminder_set within 7 days.
- **Success threshold:** Share completing all three ≥ 2× the share who did the same three things in the 28-day pre-window.
- **Expected learning:** Whether choice overload is part of the activation gap (3 of 55 added a game [R12]). **Dependencies:** D-007.

**X-016 · Ask Steam-only accounts for email at the reminder** · P2 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Asking 'Where should we send the release reminder?' at the moment of reminder_set gets an email from ≥ 50% of Steam-only accounts [R11 §5]. **Audience:** Accounts created through Steam sign-in with no email.
- **Change:** Inline email field in the reminder confirmation; email verified by link. **Metric:** Email attached ÷ Steam-only accounts that set a reminder.
- **Success threshold:** ≥ 50% attach and verify an email, minimum 10 Steam-only reminder setters.
- **Expected learning:** Whether Steam sign-in accounts can become reachable without a gate. **Dependencies:** D-015, D-013.

**X-017 · Gamer DNA card at ten shelf items** · P2 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Prompting the Gamer DNA share card once a member reaches ten shelf items produces shares that bring registrations. **Audience:** Members crossing ten user_games rows.
- **Change:** One-time prompt with the D-024 card and Save/Share. **Metric:** share_card_generated (type=gamer-dna); registration_complete (from=share-card).
- **Success threshold:** ≥ 20% of eligible members generate a card AND ≥ 5 registrations via card links in 28 days.
- **Expected learning:** Whether identity cards travel for TechPlay the way recaps do elsewhere [R11 §2.5]. **Dependencies:** D-024, D-007.

**X-018 · Backlog Advisor guest mode** · P2 · Effort M · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Letting guests type five games and get a pick, then offering 'import your backlog instead of typing it', converts better than the sign-in wall. **Audience:** Guests on /backlog-advisor (today a SignInWall).
- **Change:** D-037 guest mode; result screen ends with Steam/Google sign-up that imports. **Metric:** tool_run (tool=backlog, guest); registration_complete (from=advisor).
- **Success threshold:** ≥ 100 guest runs AND ≥ 5% of runs followed by registration within the session.
- **Expected learning:** Whether a useful answer before sign-up beats a promise of one. **Dependencies:** D-037, D-007.

### 4.3 Newsletter

**X-019 · Homepage newsletter block** · P1 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A homepage capture block for The Save File converts at least 3 per 1,000 homepage sessions; today there is no homepage capture [R20]. **Audience:** Homepage visitors, signed out and signed in.
- **Change:** D-012 block under the hero: 'The Save File. Fridays. The week's releases, one fix, one number. No spam, one-click unsubscribe.' **Metric:** newsletter_signup (placement=home) per 1,000 homepage sessions; newsletter_verified ÷ newsletter_signup.
- **Success threshold:** ≥ 3 signups per 1,000 homepage sessions AND ≥ 70% verify within 72 h.
- **Expected learning:** The capture rate of the most-seen page, to size every other placement against. **Dependencies:** D-012, C40, D-007.

**X-020 · Article end: newsletter first vs account first** · P1 · Effort S · 28 days · Design: ABAB weeks
- **Hypothesis:** One ordering of the D-010 end block (newsletter field above the account prompt, or the reverse) produces more total owned-audience actions. **Audience:** All article readers.
- **Change:** Alternate order by ISO week (ABAB); copy identical. **Metric:** (newsletter_signup + registration_complete) per 1,000 article sessions.
- **Success threshold:** Winning order ≥ 1.25× the combined rate in both of its weeks, with ≥ 40 combined actions in total.
- **Expected learning:** Which ask a reader at the end of a news story will accept. **Dependencies:** D-010, D-012, D-007.

**X-021 · /newsletter landing with a real sample issue** · P2 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** Showing the latest issue (web archive of F21) on /newsletter raises conversion of that page. **Audience:** Visitors to /newsletter (new) from social, Discord and the footer.
- **Change:** Embed the most recent issue under the form from the first issue onward; before that, the promise only. **Metric:** newsletter_signup ÷ /newsletter sessions.
- **Success threshold:** Post-window rate ≥ 1.3× pre-window with ≥ 200 landing sessions across both windows.
- **Expected learning:** Whether proof of the product beats a description of it. **Dependencies:** D-012, C40.

**X-022 · Specific subject lines vs numbered ones** · P2 · Effort S · 56 days · Design: alternating issues
- **Hypothesis:** Subject lines naming the week's concrete items ('GTA VI pre-load date, 6 releases, 1 fix') get more clicks than numbered ones ('The Save File #3'). **Audience:** All verified subscribers.
- **Change:** Alternate style by issue over eight issues. **Metric:** Unique clicks ÷ delivered per issue (opens are a floor only [R20]).
- **Success threshold:** Specific style click rate ≥ 1.2× numbered across 4 issues each, with unsubscribe ≤ 0.5% on every send.
- **Expected learning:** Which subject style drives the click, the only trusted email metric. **Dependencies:** C40.

**X-023 · Send time: Friday 08:00 vs 16:00 CET** · P3 · Effort S · 56 days · Design: alternating weeks
- **Hypothesis:** The Save File sent Friday 08:00 CET gets more 48-hour clicks than Friday 16:00 CET (the digest's current slot). **Audience:** All verified subscribers.
- **Change:** Alternate send time by week for eight weeks. **Metric:** Unique clicks within 48 h ÷ delivered.
- **Success threshold:** One slot wins by ≥ 20% relative in at least 3 of 4 weekly pairs; otherwise keep 16:00.
- **Expected learning:** Whether the US-heavy audience (about 35% of traffic [R16]) changes the best slot. **Dependencies:** C40.

**X-024 · GTA 6 briefing with a dated promise** · P1 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** Replacing 'Join thousands of fans' with a dated promise ('One email a week until 19 Nov, daily in launch week. Confirmed facts, sources linked.') raises capture on /gta6. **Audience:** GTA 6 hub visitors (S4).
- **Change:** Gta6NewsletterCTA.tsx copy (D-001) and a gta6 tag on the subscriber row (D-012). **Metric:** newsletter_signup (placement=gta6) per 1,000 /gta6 sessions.
- **Success threshold:** Post-window rate ≥ 1.5× the pre-window with ≥ 30 signups in the post window.
- **Expected learning:** Whether a specific, time-bound promise outperforms vague social proof. **Dependencies:** D-001, D-012, C07.

**X-025 · Email-only release alert for guests** · P2 · Effort M · 28 days · Design: ABAB weeks
- **Hypothesis:** An email-only 'tell me when it's out' on unreleased game pages captures more guests than the account-only reminder, and ≥ 20% of those later register. **Audience:** Guests on unreleased game pages.
- **Change:** Alternate weeks: account modal (X-005) vs email-only alert field; run after X-005 has 28 days of data. **Metric:** newsletter_signup (placement=game-page) + reminder by email per 1,000 game sessions; registration_complete within 30 days.
- **Success threshold:** Email-only capture ≥ 2× the account variant per 1,000 game sessions AND ≥ 20% of email-only signups register within 30 days.
- **Expected learning:** Whether asking for less (an address) beats asking for an account at the release moment. **Dependencies:** D-016, D-013, D-012.

**X-026 · Newsletter line in Buffy's welcome** · P3 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** One line with the /newsletter link in the Discord welcome embed converts ≥ 5% of new joiners to subscribers. **Audience:** New Discord members.
- **Change:** BuffyService welcome embed adds: 'Fridays: The Save File, the week in one email.' with utm_source=discord&utm_medium=community&utm_campaign=c35-discord-rebuild. **Metric:** newsletter_signup with utm_source=discord ÷ discord_join.
- **Success threshold:** ≥ 5% of joiners subscribe within 28 days, minimum 40 joins.
- **Expected learning:** Whether Discord and email audiences overlap or feed each other. **Dependencies:** D-011, D-012, C35.

### 4.4 Discord

**X-027 · Discord Onboarding questions** · P1 · Effort S · 42 days · Design: pre/post
- **Hypothesis:** Three Onboarding questions (platforms, games followed, which pings) raise the share of joiners who post within seven days. **Audience:** New Discord joiners.
- **Change:** C35 rebuild: Onboarding with three questions assigning roles and channels. **Metric:** Joiners with ≥ 1 message within 7 days ÷ joiners (bot count).
- **Success threshold:** Rate ≥ 1.5× the 21-day pre-window with ≥ 30 joiners in the post window.
- **Expected learning:** Whether the first minute in the server decides whether people stay. **Dependencies:** C35, D-011.

**X-028 · End-of-article Discord line vs sidebar widget** · P1 · Effort S · 28 days · Design: concurrent comparison (two invite codes)
- **Hypothesis:** An end-of-article Discord line gets more clicks per 1,000 article sessions than the desktop-only sidebar widget, because the phone layout is the real one [R11]. **Audience:** Article readers.
- **Change:** D-010 end block gains a Discord line with its own invite code; the sidebar widget gets a second code. **Metric:** discord_click (placement=article-end vs article-sidebar); discord_join by invite code.
- **Success threshold:** Article-end ≥ 2× sidebar clicks per 1,000 sessions AND joins by code point the same way.
- **Expected learning:** Where Discord asks work on a phone-first site. **Dependencies:** D-010, D-011, D-004.

**X-029 · Invite copy that names a dated event** · P2 · Effort S · 28 days · Design: alternating posts
- **Hypothesis:** Invites naming a dated event ('Game Club night this Thursday, 20:00 CET: Control Resonant') convert better than 'Join our Discord'. **Audience:** Social followers and newsletter readers.
- **Change:** Two invite codes, two copies, alternated across posts for four weeks. **Metric:** discord_join per 100 discord_click, per invite code.
- **Success threshold:** Event copy ≥ 1.5× joins per 100 clicks with ≥ 20 joins in total.
- **Expected learning:** Whether events are the reason to join [R13]. **Dependencies:** C38, D-011.

**X-030 · 'What Are You Playing?' on site and Discord together** · P2 · Effort S · 56 days · Design: pre/post (weeks 1–4 vs 5–8)
- **Hypothesis:** Running F11 as one prompt on Discord and the forum, cross-linked, lifts distinct participants compared with Discord alone. **Audience:** Discord members, forum readers, social followers.
- **Change:** C37 weekly thread posted Monday in Discord and /forum with links both ways; first four weeks Discord-only, next four both. **Metric:** Distinct participants per week (Discord authors + forum repliers); comment_created on the forum thread.
- **Success threshold:** Distinct participants in weeks 5–8 ≥ 1.3× weeks 1–4 AND the forum thread averages ≥ 5 replies.
- **Expected learning:** Whether the forum can borrow Discord's activity instead of competing with it. **Dependencies:** C37.

**X-031 · Recruiter role for member invites** · P2 · Effort M · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A 'Recruiter' role for members who bring three joiners through their own invite codes produces ≥ 15% of joins. **Audience:** Existing Discord members (160 on 27 Sep [R13]).
- **Change:** C36: members create personal invites; the bot credits joins by code (D-011); role at 3 joins. **Metric:** Share of discord_join attributed to member-created codes.
- **Success threshold:** ≥ 15% of joins from member codes AND zero raid or spam incidents linked to the scheme.
- **Expected learning:** Whether the community can grow itself at this size. **Dependencies:** D-011, C36.

**X-032 · Buffy's daily On This Day post** · P3 · Effort S · 28 days · Design: pre/post
- **Hypothesis:** A daily automated anniversary post (F06) raises distinct daily posters in #general. **Audience:** Discord members.
- **Change:** C65: Buffy posts one anniversary from /games/on-this-day at a fixed time. **Metric:** Distinct authors per day in #general (bot count; Server Insights needs 500+ members [R13]).
- **Success threshold:** Distinct daily posters +25% vs the 14-day pre-window, with no rise in moderation actions.
- **Expected learning:** Whether automated prompts start conversations or become wallpaper. **Dependencies:** C65, D-011.

**X-033 · Link-your-account line in the welcome** · P2 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A welcome message asking members to link their TechPlay account (XP carries over) raises linked members. **Audience:** New Discord joiners.
- **Change:** Welcome embed line with the /link command and the site link. **Metric:** Joiners with a linked account within 14 days (users.discord_id with discord_guild_member = true).
- **Success threshold:** ≥ 15% of joiners link within 14 days.
- **Expected learning:** How much of the Discord audience will cross to the site. **Dependencies:** C35.

### 4.5 Content and SEO

**X-034 · Shrink the indexable game set** · P1 · Effort L · 42 days · Design: pre/post
- **Hypothesis:** Noindexing game pages without an original signal shifts Googlebot's ~290 daily fetches toward articles and hubs and speeds article indexing [R03 §9]. **Audience:** Googlebot; all organic searchers.
- **Change:** D-021: Game::indexable() requires an original signal; the long tail stays crawlable and linked but noindex. **Metric:** GSC crawl stats (requests by page type), indexed articles, organic clicks.
- **Success threshold:** Articles+hubs share of Googlebot requests ≥ 2× the pre-window AND ≥ 90% of articles published after the change indexed within 7 days, with organic clicks not falling below the pre-window.
- **Expected learning:** Whether index quality, not access, is what holds search back. **Dependencies:** D-021, C02.

**X-035 · Contextual links in every article** · P1 · Effort M · 56 days · Design: pre/post
- **Hypothesis:** Three to five contextual links per article (game page, calendar, tool) raise pages per session from article landings. **Audience:** Article readers.
- **Change:** D-010 contextual links and related module; ED adds links at publish. **Metric:** Pages per session for sessions landing on an article (first-party, sessions with sid); cta_click.
- **Success threshold:** Pages per session from article landings +15% vs the 28-day pre-window.
- **Expected learning:** Whether articles can feed the database and tools. **Dependencies:** D-010, C46.

**X-036 · Review titles that carry a verdict** · P2 · Effort S · 56 days · Design: matched page groups
- **Hypothesis:** 'Crimson Desert review: [verdict in five words] (PS5, PC)' gets a higher Search CTR than 'Crimson Desert - review' [R03 §10]. **Audience:** Searchers seeing TechPlay reviews.
- **Change:** Retitle the 10 reviews with most impressions; 10 comparable reviews untouched as control. **Metric:** GSC CTR, treated vs control, 28 days before and after (difference-in-differences).
- **Success threshold:** Treated CTR change ≥ 30% relative above the control group's change, with ≥ 500 impressions per group.
- **Expected learning:** Whether title quality is part of the invisibility of reviews. **Dependencies:** C52.

**X-037 · PC fix guides vs news for search clicks** · P1 · Effort M · 56 days · Design: concurrent comparison (guides vs news, same weeks)
- **Hypothesis:** P2 fix guides earn search clicks faster than news because page one has no gaming outlet for them [R09]. **Audience:** S3 PC Tinkerers searching fixes.
- **Change:** C60 PC Fix Hub: one F07 guide a week from 12 Oct. **Metric:** GSC clicks per page at day 28, fix guides vs news published the same weeks.
- **Success threshold:** Median fix guide ≥ 3× median news article clicks at day 28, with ≥ 4 guides.
- **Expected learning:** Where ED hours earn the most durable traffic. **Dependencies:** C60.

**X-038 · Series order pages** · P2 · Effort M · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** F09 'In Order' pages reach page one for '[series] games in order' within six weeks. **Audience:** Searchers preparing for 2027 launches.
- **Change:** C63: one series page each Saturday from 3 Oct. **Metric:** GSC average position and clicks for each page's main query.
- **Success threshold:** ≥ 3 of the first 6 pages at average position ≤ 10 for their main query by day 42.
- **Expected learning:** Whether evergreen order guides are winnable for a small site. **Dependencies:** C63.

**X-039 · 'Where can I play it' blocks on 200 game pages** · P2 · Effort L · 56 days · Design: matched page groups
- **Hypothesis:** A verified 'where to play' block (platforms, subscriptions, Switch 2 edition) on 200 high-demand game pages lifts impressions against 200 matched pages without it [R09 EA-085]. **Audience:** Searchers asking 'is [game] on PC/PS5/Switch 2'.
- **Change:** F08 template filled by ED on 200 pages; 200 matched pages as control. **Metric:** GSC impressions and clicks per page group.
- **Success threshold:** Treated group impressions +50% relative to the control group's change over the same window.
- **Expected learning:** Whether original structured answers make database pages worth indexing. **Dependencies:** D-023, C63.

**X-040 · A paragraph of our own on game pages** · P2 · Effort L · 42 days · Design: matched page groups
- **Hypothesis:** Two sentences of TechPlay context plus linked news or review turns boilerplate game pages into indexable ones [R02 fix 12]. **Audience:** Game pages with any TechPlay signal (1,967 of 295,024 [R03]).
- **Change:** 150 treated pages get the paragraph; 150 matched pages do not. **Metric:** Indexed status (URL Inspection sample) and impressions per group.
- **Success threshold:** ≥ 25% more treated pages indexed than control pages at day 42.
- **Expected learning:** The editorial cost of making a game page 'ours'. **Dependencies:** D-021, D-023.

**X-041 · One home for GTA 6 in search** · P1 · Effort S · 56 days · Design: pre/post
- **Hypothesis:** Re-pointing GTA 6 news to /games/grand-theft-auto-vi and linking hub, game page and calendar makes one URL rank for GTA queries [R17]. **Audience:** S4 GTA 6 Waiters searching.
- **Change:** D-005 relation fix, D-017 server-rendered hub counters and H1, internal links. **Metric:** GSC impressions for queries containing 'gta 6' or 'gta vi' on /gta6* and the game page.
- **Success threshold:** Impressions ×3 vs the 28-day pre-window AND at least one page at average position ≤ 20 for a 'gta 6 …' query by 19 Nov.
- **Expected learning:** Whether the hub can compete at all before launch week. **Dependencies:** D-005, D-017, C08.

**X-042 · Google News clean-up plus original pieces** · P1 · Effort S · 63 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Stopping game pages from appearing as news and publishing original data pieces gets TechPlay articles into Google News [R03 §6]. **Audience:** Google News readers.
- **Change:** D-022 (datePublished on game pages); C20 and C22 as original reporting. **Metric:** Monthly probe of 16 own-topic Google News RSS searches (R03 method); GSC News tab if shown.
- **Success threshold:** By 31 Oct: zero game pages in the site: News feed. By 30 Nov: ≥ 2 of 16 probes return a TechPlay article.
- **Expected learning:** Whether Google News is reachable this quarter. **Dependencies:** D-022, C20, C22.

**X-043 · RSS repair feeding Flipboard and Mastodon** · P3 · Effort S · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Fixing RSS and piping it to Flipboard and Mastodon produces referral sessions for under an hour a week. **Audience:** RSS readers.
- **Change:** D-003; SC connects the feed once. **Metric:** Sessions by referrer_host (flipboard.com, Mastodon instance hosts).
- **Success threshold:** ≥ 20 sessions/week by week 6 at ≤ 1 h/week effort; otherwise stop maintaining.
- **Expected learning:** Whether low-priority channels pay for their setup. **Dependencies:** D-003.

### 4.6 Discover headlines

**X-044 · Concrete headlines vs question headlines** · P2 · Effort S · 28 days · Design: alternating days
- **Hypothesis:** Headlines that put the answer in the title ('Gears of War: E-Day release time in every time zone') earn more Discover clicks than question headlines. **Audience:** Discover users following P1–P3 topics.
- **Change:** Alternate style by publishing day for four weeks on pillar news. **Metric:** Discover clicks per article in the first 72 h (GSC Discover report).
- **Success threshold:** Concrete style median ≥ 1.5× question style with ≥ 20 articles per style. Void if the Discover report shows no data.
- **Expected learning:** Which headline style Discover rewards for TechPlay after the Feb 2026 update [R07]. **Dependencies:** C04.

**X-045 · Original 1200px images vs store key art** · P2 · Effort S · 28 days · Design: alternating articles
- **Hypothesis:** Original large images (annotated screenshots, data cards) get a higher Discover CTR than publisher key art. **Audience:** Discover users.
- **Change:** DS templates; alternate by article; all images ≥ 1200px wide and ≤ 300 KB. **Metric:** Discover CTR per article.
- **Success threshold:** Original-image CTR ≥ 1.25× key-art CTR with ≥ 15 articles per arm.
- **Expected learning:** Whether image originality is worth DS hours. **Dependencies:** D-017.

**X-046 · Pillar concentration** · P1 · Effort S · 84 days · Design: pre/post
- **Hypothesis:** Putting ≥ 70% of news into pillars P1–P3 for six weeks (and dropping general tech and phones) raises Discover impressions through topic expertise [R07, R08]. **Audience:** Discover and Search users.
- **Change:** EIC editorial rule for six weeks; ED tags each article with its pillar. **Metric:** Discover impressions per week; total Google clicks.
- **Success threshold:** Weekly Discover impressions in weeks 4–6 ≥ 2× the pre-window mean, with total Google clicks not lower.
- **Expected learning:** Whether focus beats volume for a two-author newsroom. **Dependencies:** C04, C60.

**X-047 · Author expertise boxes on guides** · P3 · Effort S · 42 days · Design: matched page groups
- **Hypothesis:** A short author box (what they play, test hardware, how it was tested) on P2 and P3 guides improves Discover and Search performance. **Audience:** Readers of guides.
- **Change:** Box on 8 guides; 8 comparable guides later. **Metric:** Clicks per guide over 42 days, treated vs control.
- **Success threshold:** Treated guides ≥ 1.2× control clicks.
- **Expected learning:** Whether visible expertise signals move a small site. **Dependencies:** C60.

**X-048 · Publishing time for US stories** · P3 · Effort S · 28 days · Design: alternating days
- **Hypothesis:** US-relevant stories published 13:00–15:00 CET (US morning) earn more Discover clicks in 48 h than those published at 08:00 CET. **Audience:** US Discover users (about 35% of traffic [R16]).
- **Change:** Alternate publish slot by day for four weeks. **Metric:** Discover clicks in the first 48 h.
- **Success threshold:** US-slot median ≥ 1.3× morning-slot median with ≥ 12 stories per slot.
- **Expected learning:** Whether the Sarajevo schedule costs US reach. **Dependencies:** C04.

**X-049 · Stories framed on TechPlay's own data** · P2 · Effort S · 42 days · Design: concurrent comparison (data-framed vs rewrites)
- **Hypothesis:** News framed around a figure from TechPlay's calendar or database gets more Discover clicks than a rewrite of the same news. **Audience:** Discover users; S8 Industry Watchers.
- **Change:** ED adds one database figure (with source line) as the news hook, F04 style. **Metric:** Discover clicks per article, data-framed vs rewrite.
- **Success threshold:** Data-framed median ≥ 2× rewrites with ≥ 8 data-framed pieces.
- **Expected learning:** Whether owned data is the originality Discover wants. **Dependencies:** C20.

### 4.7 Social formats

**X-050 · Out This Week: carousel vs single image on Instagram** · P2 · Effort S · 42 days · Design: alternating weeks
- **Hypothesis:** An F01 carousel earns more saves per 1,000 reach than a single image of the same list. **Audience:** Instagram followers and explore.
- **Change:** Alternate format by week for six weeks; same DS template family. **Metric:** Saves + shares per 1,000 reach (platform analytics); link-sticker sessions with utm_content f01-*.
- **Success threshold:** Carousel ≥ 1.5× saves per 1,000 reach across 3 weeks each.
- **Expected learning:** Which format justifies DS time on the weekly anchor. **Dependencies:** C04.

**X-051 · GTA countdown Stories: fact card vs poll sticker** · P2 · Effort S · 14 days · Design: alternating days
- **Hypothesis:** An F02 Story with a poll sticker gets more interactions per viewer than a fact card alone. **Audience:** Instagram and Facebook Story viewers.
- **Change:** Alternate by day for 14 days. **Metric:** Replies + sticker taps per 100 viewers; link taps with utm_content f02-dayNN-story.
- **Success threshold:** Winner ≥ 1.3× interactions per 100 viewers; adopt it for the rest of C06.
- **Expected learning:** Which Story mechanic to use for the remaining countdown. **Dependencies:** C06.

**X-052 · X: thread vs single post for Out This Week** · P3 · Effort S · 28 days · Design: alternating weeks
- **Hypothesis:** A single post with the carousel image and one link sends more sessions than a thread. **Audience:** X followers.
- **Change:** Alternate by week for four weeks. **Metric:** Sessions with utm_source=x and utm_content f01-*.
- **Success threshold:** Winner ≥ 1.5× sessions per post.
- **Expected learning:** The cheapest X format that still sends readers. **Dependencies:** C04, D-009.

**X-053 · Reddit: answer first, link second** · P1 · Effort S · 56 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Answers that solve the question in the thread and link only when a TechPlay page adds data or a tool keep standing positive and still send readers [R13]. **Audience:** Subreddits on the C47 list.
- **Change:** C47 rules: 9 of 10 contributions without a link; links carry utm_medium=community and utm_term=<subreddit>. **Metric:** Removals and bans; median comment score; sessions with utm_source=reddit.
- **Success threshold:** Zero removals or bans, median score ≥ 2, and ≥ 30 sessions/week by week 8.
- **Expected learning:** Whether Reddit can be a steady source without burning the account. **Dependencies:** C47, D-009.

**X-054 · Threads and Bluesky cross-posts of The Number** · P3 · Effort S · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Cross-posting F04 to Threads and Bluesky costs under an hour a week and returns ≥ 10 sessions a week on each. **Audience:** Threads and Bluesky users.
- **Change:** SC cross-posts F04 three times a week. **Metric:** Sessions with utm_source=threads / bluesky; SC minutes logged.
- **Success threshold:** Each platform ≥ 10 sessions/week in weeks 4–6 at ≤ 1 h/week; otherwise stop that platform.
- **Expected learning:** Keep-or-kill for two experimental channels. **Dependencies:** D-009.

**X-055 · Facebook: Page vs relevant Groups for Hidden Gem** · P3 · Effort S · 42 days · Design: alternating weeks
- **Hypothesis:** F05 shared in relevant Facebook Groups (with admin permission) sends more readers than the Page alone. **Audience:** Facebook users in genre groups.
- **Change:** Alternate Page-only and Group shares by week for six weeks. **Metric:** Sessions with utm_source=facebook, utm_content f05-*.
- **Success threshold:** Group weeks ≥ 3× Page-only weeks in sessions, with zero removals.
- **Expected learning:** Whether Facebook's reach lives in Groups for TechPlay. **Dependencies:** C64.

**X-056 · LinkedIn Studio Watch** · P3 · Effort S · 84 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** One F17 post a week on LinkedIn brings industry readers and press contacts. **Audience:** S8 Industry Watchers, developers, press.
- **Change:** EIC posts F17 each Thursday with the /data/studios-closed-2026 tracker. **Metric:** Sessions with utm_source=linkedin; inbound industry contacts logged.
- **Success threshold:** Median ≥ 15 sessions per post AND ≥ 2 inbound industry contacts by 31 Dec.
- **Expected learning:** Whether LinkedIn earns its slot for PR. **Dependencies:** C22.

**X-057 · Library Card member spotlight** · P3 · Effort S · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** An opt-in member spotlight (F19) makes other readers start their own library. **Audience:** Followers on Instagram, X, Discord.
- **Change:** SC posts one consenting member's Gamer DNA card each Friday. **Metric:** registration_start and registration_complete with utm_content f19-*.
- **Success threshold:** Median ≥ 3 registrations per spotlight over 6 spotlights, with written consent logged for every member featured.
- **Expected learning:** Whether members' own artefacts sell accounts better than our copy. **Dependencies:** C68, D-024.

**X-058 · Steam Curator page referrals** · P3 · Effort S · 70 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A Steam Curator page with short verdicts linking to TechPlay reviews brings followers and referral sessions. **Audience:** Steam users following curators.
- **Change:** C69 launch with 20 recommendations, 2 new per week. **Metric:** Curator followers; sessions with utm_source=steam.
- **Success threshold:** ≥ 50 curator followers and ≥ 10 sessions/week by 31 Dec.
- **Expected learning:** Whether Steam is a distribution channel for Verdict. **Dependencies:** C69, C52.

### 4.8 Video

**X-059 · Hook: number on screen vs talking-head intro** · P2 · Effort S · 56 days · Design: alternating videos
- **Hypothesis:** F01 videos that open on an on-screen date or number hold viewers longer than those opening on a presenter line. **Audience:** Short-form viewers.
- **Change:** Alternate hook style across 8 F01 videos. **Metric:** Average percentage viewed; 3-second hold (platform analytics).
- **Success threshold:** Winning hook ≥ 1.2× average percentage viewed across 4 videos each.
- **Expected learning:** The hook template for the whole C49 system. **Dependencies:** C49.

**X-060 · One production, four platforms** · P1 · Effort S · 42 days · Design: concurrent keep-or-kill across platforms
- **Hypothesis:** Posting the same vertical file to TikTok, YouTube Shorts, Instagram Reels and Facebook Reels shows which one or two platforms deserve the time. **Audience:** Short-form viewers on four platforms.
- **Change:** C49 posts identical files; SC records views, follows and link sessions per platform. **Metric:** Views at 7 days, follows per 1,000 views, utm sessions per 1,000 views, per platform.
- **Success threshold:** Keep platforms at ≥ 2× the median of the others on follows per 1,000 views; drop any platform below one quarter of the best after 6 weeks.
- **Expected learning:** Where video attention should go in Q1 2027. **Dependencies:** C49.

**X-061 · Fix It Friday shorts with a guide link** · P2 · Effort S · 42 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** F07 shorts send readers to the full guide through the description or pinned-comment link. **Audience:** S3 PC Tinkerers on YouTube and TikTok.
- **Change:** Every F07 short links /guides/pc-fixes/<guide> with utm_content f07-short-<slug>. **Metric:** Sessions per 1,000 views with utm_content f07-*.
- **Success threshold:** Median ≥ 2 sessions per 1,000 views.
- **Expected learning:** Whether video can feed the pillar that search rewards. **Dependencies:** C60, C49.

**X-062 · Out This Week length: 20–30 s vs 45–60 s** · P3 · Effort S · 42 days · Design: alternating weeks
- **Hypothesis:** Shorter F01 videos have higher completion without losing views. **Audience:** Short-form viewers.
- **Change:** Alternate length by week for six weeks. **Metric:** Completion rate and views at 7 days.
- **Success threshold:** Short version completion ≥ 1.3× with views not lower than 0.8× the long version.
- **Expected learning:** The default length for the weekly anchor. **Dependencies:** C49.

**X-063 · YouTube long-form pilot** · P2 · Effort L · 28 days · Design: concurrent comparison (long-form vs Shorts)
- **Hypothesis:** One long video ('Every GTA game in order before VI', 12 Nov) earns more subscribers per production hour than Shorts. **Audience:** YouTube viewers searching GTA order before launch.
- **Change:** C50 pilot; EIC scripts, SC edits. **Metric:** Subscribers gained per production hour at day 28; views at day 28; utm sessions.
- **Success threshold:** Subscribers per production hour ≥ 2× the Shorts figure over the same 28 days.
- **Expected learning:** Whether long-form belongs in Q1 2027 plans. **Dependencies:** C50.

**X-064 · WoW Analyzer 15-second demo** · P2 · Effort S · 14 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A screen recording of an Analyzer result drives tool runs from YouTube and TikTok. **Audience:** S5 MMO/WoW players.
- **Change:** One organic demo per month (F15), linked with utm_campaign=c13-wow-readiness. **Metric:** tool_run (tool=wow) with utm_campaign c13-*.
- **Success threshold:** ≥ 30 tool runs from video links in 14 days.
- **Expected learning:** Whether the demo is strong enough to justify paid T15 later. **Dependencies:** C13, D-040.

### 4.9 Email

**X-065 · Welcome email 1 asks which platforms you play** · P2 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** One-click platform links in welcome email 1 tag ≥ 40% of new members and feed segments [R20 §4]. **Audience:** New members.
- **Change:** C42 email 1: 'Where do you play? Click all that apply' (PC, PS5, Xbox, Switch 2, handheld). **Metric:** Unique clicks on platform links ÷ delivered.
- **Success threshold:** ≥ 40% of delivered click at least one platform link.
- **Expected learning:** Whether members will self-segment by email. **Dependencies:** C42, D-013.

**X-066 · Personalised releases email vs generic list** · P1 · Effort M · 28 days · Design: concurrent comparison (same members, two emails)
- **Hypothesis:** 'Your releases this week' (C41) gets ≥ 2× the click rate of the generic release section in The Save File for the same members. **Audience:** Members with wishlists or reminders who also subscribe.
- **Change:** Send C41 Mondays from 26 Oct; compare with clicks on the release section of Friday's issue. **Metric:** Unique clicks ÷ delivered (alert_clicked for C41).
- **Success threshold:** C41 click rate ≥ 2× the generic section's, with ≥ 100 delivered on each.
- **Expected learning:** Whether personalisation is TechPlay's newsletter advantage [R20]. **Dependencies:** C41, D-028.

**X-067 · Release-day alert: email vs Discord DM** · P2 · Effort M · 42 days · Design: holdout (user id parity)
- **Hypothesis:** For members reachable on both, a Discord DM release alert produces more visits within 24 h than email. **Audience:** Members with email and linked Discord who set reminders.
- **Change:** Channel assigned by user id parity for alerts sent from 19 Oct. **Metric:** alert_clicked ÷ reminder_delivered, per channel.
- **Success threshold:** One channel ≥ 1.3× the other after ≥ 60 deliveries per channel; adopt it as the default.
- **Expected learning:** Which default channel to set for reminders. **Dependencies:** C43, D-013.

**X-068 · Price-drop threshold: member-set vs fixed** · P3 · Effort M · 28 days · Design: holdout (user id parity)
- **Hypothesis:** Letting members set their own discount threshold raises clicks per alert and lowers unsubscribes. **Audience:** Members with wishlisted Steam games.
- **Change:** D-027 with a threshold field vs a fixed 30% default; parity split. **Metric:** Clicks per alert; unsubscribes per alert.
- **Success threshold:** Member-set arm ≥ 1.2× clicks per alert with unsubscribes not higher than the fixed arm.
- **Expected learning:** How to keep deal alerts useful through Black Friday (C31). **Dependencies:** D-027, C31.

**X-069 · Suppress non-clickers after eight sends** · P1 · Effort S · 56 days · Design: pre/post
- **Hypothesis:** Suppressing subscribers with no click in eight consecutive sends keeps complaints under 0.1% without losing clicks. **Audience:** Newsletter subscribers.
- **Change:** Suppression rule in the campaign desk from issue 9. **Metric:** Complaint rate per send; total unique clicks per send.
- **Success threshold:** Complaint rate < 0.1% on every send AND total clicks per send down less than 5%.
- **Expected learning:** The list-hygiene rule for a self-hosted sender [R20 §4]. **Dependencies:** C40.

**X-070 · Plain-text style vs designed template** · P3 · Effort S · 42 days · Design: alternating issues
- **Hypothesis:** A plain, letter-style issue gets more clicks than the designed template. **Audience:** Newsletter subscribers.
- **Change:** Alternate template by issue for six issues. **Metric:** Unique clicks ÷ delivered.
- **Success threshold:** Winner ≥ 1.2× click rate across 3 issues each.
- **Expected learning:** Whether design effort helps deliverability or clicks. **Dependencies:** C40.

### 4.10 Giveaways

**X-071 · Remove share and retweet tasks** · P1 · Effort S · 21 days · Design: pre/post between consecutive giveaways
- **Hypothesis:** Removing share_giveaway and twitter_retweet tasks (Meta Promotions policy [R16 §2.15]) does not reduce entries by more than 20%. **Audience:** Giveaway visitors.
- **Change:** Next giveaway runs without those tasks; compare with the previous one. **Metric:** giveaway_entered per 1,000 giveaway-page sessions.
- **Success threshold:** Non-inferiority: entry rate ≥ 0.8× the previous giveaway's rate.
- **Expected learning:** Whether compliance costs anything; it is required before any paid giveaway promotion. **Dependencies:** C09.

**X-072 · One-click entry with Google or Discord** · P2 · Effort S · 21 days · Design: pre/post between consecutive giveaways
- **Hypothesis:** Making social sign-in the entry step raises entry completion for guests. **Audience:** Guests on /giveaway/{slug}.
- **Change:** Entry button opens social sign-in and enters on return (D-014 redirect). **Metric:** giveaway_entered ÷ guest sessions on the giveaway page.
- **Success threshold:** Entry rate ≥ 1.5× the previous giveaway's guest entry rate.
- **Expected learning:** How much of the giveaway drop is registration friction. **Dependencies:** C09, D-014.

**X-073 · Import prompt after entry** · P1 · Effort S · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** After entry, 'Connect Steam and your library is ready when the draw closes' (no extra entries offered) raises entrants' A2. **Audience:** New giveaway entrants.
- **Change:** Post-entry panel with Steam/Xbox connect buttons (25-GIVEAWAYS SHELVE stage). **Metric:** library_connected within 7 days ÷ giveaway_entered (first entries); giveaway-only share.
- **Success threshold:** Entrant→A2 ≥ 25% AND giveaway-only share at close ≤ 60% (guardrail in 25-GIVEAWAYS).
- **Expected learning:** Whether giveaway accounts can become real members. **Dependencies:** C09, D-007.

**X-074 · Daily check-in with a weekly freeze** · P3 · Effort M · 21 days · Design: pre/post between consecutive giveaways
- **Hypothesis:** Adding one freeze per week to the giveaway check-in streak keeps entrants returning without punishing a missed day [R12]. **Audience:** Giveaway entrants.
- **Change:** Streak freeze on the daily bonus in the next giveaway. **Metric:** Distinct return days per entrant; share of streak-breakers who never return.
- **Success threshold:** Median return days ≥ 1.3× the previous giveaway AND the never-return share among streak-breakers falls.
- **Expected learning:** Whether a humane streak retains as well as a strict one. **Dependencies:** C09.

**X-075 · Giveaway hub indexable while live** · P2 · Effort S · 21 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Making /giveaways indexable while a draw is open brings organic entrants [R01]. **Audience:** Searchers for game giveaways.
- **Change:** D-039 index while live, canonical on giveaway pages. **Metric:** Organic sessions to /giveaways and /giveaway/* during the live window.
- **Success threshold:** ≥ 20 organic sessions/week by week 3 of a live giveaway.
- **Expected learning:** Whether giveaways can be found without paid or social push. **Dependencies:** D-039.

### 4.11 Paid (R16 T1–T15)

**X-076 · T1 Google branded exact match** · P1 · Effort S · 28 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** A branded exact-match campaign costs almost nothing and shows whether anyone bids on 'techplay' [R16 T1]. **Audience:** Searchers typing techplay, techplay gg, techplay wow analyzer, techplay backlog advisor.
- **Change:** C56 from 19 Oct: 2 RSAs, sitelinks to /games, /wow-analyzer, /backlog-advisor; $60–90/month. **Metric:** Impression share, CPC, sessions with utm_medium=cpc.
- **Success threshold:** Keep if CPC ≤ $1.00 and ≥ 10 impressions/week after 14 days; otherwise pause (R16 stop-loss).
- **Expected learning:** The real branded CPC and whether the brand has any search demand. **Dependencies:** C56, C03, D-009.

**X-077 · T2 Meta library-import demo** · P1 · Effort M · 21 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** A 6–15 s screen recording of the Steam/Xbox/PSN import converts US adults to verified accounts more cheaply than a content ad [R16 T2]. **Audience:** US 18+, broad, Advantage+ placements.
- **Change:** C57 (2–22 Nov): Leads/registration objective, on-site event via CAPI, three creatives. **Metric:** Cost per email_verified; cost per A2.
- **Success threshold:** Continue if ≤ $10 per verified registration; stop at $150 spent with < 5 verified accounts.
- **Expected learning:** A first readable cost per verified registration. **Dependencies:** C57, D-031, D-007, D-008.

**X-078 · T3 GTA 6 hub carousel vs generic creative** · P2 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Cards for the map, vehicles and characters out-click a generic 'gaming news' creative [R16 T3]. **Audience:** Same as X-077.
- **Change:** Carousel creative in C57, each card deep-linked with its own utm_content. **Metric:** CTR; cost per registration_complete.
- **Success threshold:** Keep if CTR ≥ 1% at 5,000 impressions; stop below 1%.
- **Expected learning:** Whether the GTA 6 hub is TechPlay's best paid hook before 19 Nov. **Dependencies:** C57, D-017, D-031.

**X-079 · T4 Reddit Conversation Placement to Discord** · P1 · Effort M · 17 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Ads in GTA 6 threads drive Discord joins at under $3 each [R16 T4]. **Audience:** 3–5 GTA 6 and gaming subreddits, 18+.
- **Change:** C58 (9–25 Nov): post-style ad ('1,058 GTA 6 locations on one free map, and a Discord for launch week.'); map wording cleared under D-020, own invite code. **Metric:** Cost per discord_click; discord_join by invite code.
- **Success threshold:** Continue if cost per attributed join ≤ $3; stop at $100 with < 20 Discord clicks.
- **Expected learning:** Paid cost of a community member. **Dependencies:** C58, D-011, D-020.

**X-080 · T5 WoW Analyzer tool ad on Reddit** · P2 · Effort M · 17 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** A tool ad in WoW subreddits beats any article ad on tool runs per dollar [R16 T5]. **Audience:** r/wow and similar communities, 18+.
- **Change:** C58 ad set: screenshot of an analysis result, 'Paste your character'. **Metric:** tool_run (tool=wow) per $; registration_complete.
- **Success threshold:** Continue if ≥ 30 analyses per $100; stop at $100 with < 30 analyses or if Groq cost exceeds ad cost.
- **Expected learning:** Whether a niche tool can be bought cheaply. **Dependencies:** C58, D-040.

**X-081 · T6 Backlog Advisor on Reddit** · P3 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Backlog Advisor resonates with 'too many games' communities [R16 T6]. **Audience:** r/patientgamers-type communities, 18+.
- **Change:** Screen tour of the advisor output; lands on guest mode (D-037). **Metric:** tool_run (tool=backlog) → library_connected.
- **Success threshold:** Stop if CTR < 0.2%; continue if ≥ 10% of tool runs import a library.
- **Expected learning:** Whether the backlog problem is a paid acquisition hook. **Dependencies:** C58, D-037.

**X-082 · T7 Tool exact-match search** · P3 · Effort S · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Exact-match tool queries ('wow raid readiness', 'what should I play next', 'backlog tool') have real volume [R16 T7]. **Audience:** Google searchers.
- **Change:** Second ad group in C56 once T1 is stable. **Metric:** Impressions/week, CPC, tool_run.
- **Success threshold:** Stop if < 20 impressions/week after 14 days.
- **Expected learning:** Search demand for TechPlay's tools, which no research could size [R03]. **Dependencies:** C56.

**X-083 · T8 TikTok Spark boost** · P3 · Effort M · 7 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Boosting an organic GTA 6 map video that already performs reaches under $6 CPM [R16 T8]. **Audience:** US 18+ broad.
- **Change:** Only at the AGGRESSIVE budget and only if an organic video beat the median by 3×. **Metric:** CPM; utm sessions in the first-party counter; registration_complete.
- **Success threshold:** Stop at $350 if CPM > $10 or 0 registrations.
- **Expected learning:** Whether paid video amplification is worth the $50/day floor. **Dependencies:** C49, D-008.

**X-084 · T9 Meta newsletter double opt-in** · P2 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Newsletter double opt-in from ads costs less than $8 per verified subscriber [R16 T9]. **Audience:** US plus consented UK/DE adults.
- **Change:** C57 second ad set to /newsletter with the 'weekly releases, one fix, one number' promise. **Metric:** Cost per newsletter_verified.
- **Success threshold:** Continue if ≤ $8 per verified subscriber; stop at $100 with 0 verified.
- **Expected learning:** Whether email is cheaper to buy than accounts. **Dependencies:** C57, D-012, D-031.

**X-085 · T10 Meta retargeting of registration starters** · P3 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Retargeting people who started registration recovers 10% of them [R16 T10]. **Audience:** Pixel audience: visited /register or the wizard in 7 days, no registration.
- **Change:** Only if the pool reaches 500 within 30 days. **Metric:** Cost per registration_complete; recovered share.
- **Success threshold:** Skip if pool < 500 after 30 days; continue if ≥ 10% of the pool recovers at ≤ $10 each.
- **Expected learning:** Whether a small-site retargeting pool is usable at all. **Dependencies:** D-031, C57.

**X-086 · T11 Free Discord listings** · P2 · Effort S · 28 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Disboard and Discadia listings deliver measurable joins at no cost [R16 T11]. **Audience:** Discord users browsing tags (gta6, wow, pc).
- **Change:** SC lists the server with one invite code per listing. **Metric:** discord_join per week by invite code; 7-day posting rate of those joiners.
- **Success threshold:** Keep if ≥ 5 joins/week sustained over 4 weeks and ≥ 30% post within 7 days; drop if 0 joins in 4 weeks.
- **Expected learning:** A zero-cost baseline for Discord acquisition. **Dependencies:** D-011, C36.

**X-087 · T12 Paid newsletter swap** · P3 · Effort S · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** A paid swap with one gaming newsletter beats Meta on cost per verified subscriber [R16 T12]. **Audience:** A partner newsletter's list.
- **Change:** One dedicated blurb with UTM; only once TechPlay's own list size is known and can be stated honestly. **Metric:** Cost per newsletter_verified.
- **Success threshold:** Run only after the list size is known; succeed if cost per verified < the X-084 result.
- **Expected learning:** Whether newsletter-to-newsletter is a viable channel for a self-hosted list. **Dependencies:** C40, C51.

**X-088 · T13 Giveaway ads** · P3 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Giveaway ads pull entrants who also connect a library [R16 T13]. **Audience:** US 18+.
- **Change:** Only after X-071 (no share tasks) and legal review of no-purchase-necessary and AMOE [R16 §2.15]. **Metric:** Entrants with library_connected within 7 days; giveaway-only share.
- **Success threshold:** Stop if > 70% of paid entrants have zero other activity (R16 T13 hard stop).
- **Expected learning:** Whether paid giveaway traffic creates members or only entries. **Dependencies:** C09, D-031.

**X-089 · T14 Web push opt-in on GTA 6 reminders** · P2 · Effort M · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Push opt-in offered only after 'Notify me' on GTA 6 pages builds a re-engagement list for free [R16 T14; spine C59]. **Audience:** GTA 6 hub and release-time tool users.
- **Change:** C59 prompt only after the user clicks 'Notify me'; never on page load (Chrome demotes low-acceptance sites [R07]). **Metric:** notification_enabled ÷ /gta6* sessions; click rate on the first push.
- **Success threshold:** Keep if opt-in ≥ 1% of hub sessions after 2 weeks and first-push click rate ≥ 5%; stop below 1%.
- **Expected learning:** Whether push is worth keeping after launch week. **Dependencies:** C59, D-019.

**X-090 · T15 YouTube Shorts ad for the WoW demo** · P3 · Effort S · 14 days · Design: sequential read with R16 stop-loss
- **Hypothesis:** Shorts CPM is cheap enough for a 15-second Analyzer demo [R16 T15]. **Audience:** US 18–34.
- **Change:** Parked for Q4: the spine excludes Demand Gen (§12). Revisit in Q1 2027 as a video-views buy only if X-064 succeeds. **Metric:** CPM, view rate, tool_run.
- **Success threshold:** Stop if CPM > $8 or 0 tool runs after $150.
- **Expected learning:** Whether paid Shorts can feed a niche tool. **Dependencies:** C13.

### 4.12 Tools

**X-091 · GTA 6 release-time tool with reminder** · P1 · Effort M · 36 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A tool that shows the unlock time in the visitor's time zone and offers 'remind me at pre-load and unlock' gets reminder_set from ≥ 10% of users [R17]. **Audience:** S4 GTA 6 Waiters.
- **Change:** D-018 /gta6/release-time (new), C08; reminder through D-016. **Metric:** reminder_set ÷ tool_run (tool=release-time).
- **Success threshold:** ≥ 10% of tool users set a reminder AND ≥ 200 reminders by 18 Nov.
- **Expected learning:** Whether a utility tool converts better than content before a launch. **Dependencies:** D-018, C08, D-016.

**X-092 · Calendar export (ICS) and return visits** · P3 · Effort S · 42 days · Design: matched comparison (exporters vs non-exporters)
- **Hypothesis:** Members who export their wishlist calendar return more, because each calendar entry links back with from=ics. **Audience:** Members with wishlists.
- **Change:** D-036 ICS export; event descriptions link to the game page with from=ics (internal marker, no UTM). **Metric:** Sessions with from=ics; D30 retention of exporters vs matched non-exporters.
- **Success threshold:** Exporters' D30 retention ≥ 1.5× matched non-exporters, with ≥ 20 exporters.
- **Expected learning:** Whether a calendar entry is a retention channel. **Dependencies:** D-036.

**X-093 · GTA 6 map tracker: save progress with an account** · P1 · Effort M · 21 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** Letting guests tick locations and asking for an account only to save progress converts ≥ 5% of tracker users. **Audience:** GTA 6 players from 19 Nov.
- **Change:** C11 tracker in guest mode; 'Save your progress' opens the D-016 modal. **Metric:** registration_complete (from=gta6) ÷ guest tool users.
- **Success threshold:** ≥ 5% of guest users register, with ≥ 200 guest users in launch week.
- **Expected learning:** Whether launch-week utility is the best registration moment of the quarter. **Dependencies:** C11, D-016, D-020.

**X-094 · Game Awards prediction league** · P2 · Effort M · 23 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A free prediction league for 10 Dec brings new registrations and a reason to return on the night. **Audience:** S10 Community Regulars, S8, awards followers.
- **Change:** C29 / D-026 league with a public leaderboard; entry needs an account. **Metric:** registration_complete (from=predictions); entries; returns on 10–11 Dec.
- **Success threshold:** ≥ 100 entries AND ≥ 25 new registrations from the league AND ≥ 50% of entrants return on 10–11 Dec.
- **Expected learning:** Whether event-driven games create accounts that stay. **Dependencies:** C29, D-026.

**X-095 · Your 2026 in Games** · P1 · Effort L · 18 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A cross-platform year in review produces shares that bring registrations. **Audience:** Members with shelves; their followers.
- **Change:** C28 / D-025 live 14–31 Dec with a share card (D-024). **Metric:** share_card_generated (type=yir) ÷ members viewing; registration_complete with utm_campaign=c28-your-2026.
- **Success threshold:** ≥ 25% of eligible members generate a card AND ≥ 1 registration per 10 shares.
- **Expected learning:** Whether the library can market itself once a year. **Dependencies:** D-025, D-024, C28.

**X-096 · Taste Match invite link** · P2 · Effort M · 28 days · Design: absolute threshold, no control (volume too small)
- **Hypothesis:** A 'compare your taste with me' link brings verified accounts and makes the unreachable 'Squad Goals' achievement reachable [R11 §3]. **Audience:** Members and the people they invite.
- **Change:** Invite link on the profile and Gamer DNA card; landing shows a blurred match until sign-up. **Metric:** registration_complete (from=profile) ÷ invite-link visitors.
- **Success threshold:** ≥ 10% of invite visitors register AND ≥ 10 registrations in 28 days.
- **Expected learning:** Whether member-to-member invites work at TechPlay's size. **Dependencies:** D-024.


## 5. Summary table

| ID | Name | Area | Effort | Days | Priority |
|---|---|---|---|---|---|
| X-001 | Social sign-in above the email form | registration | S | 28 | P1 |
| X-002 | Honest register panel (trust fix) | registration | S | 28 | P1 |
| X-003 | Steam as a sign-in method | registration | M | 28 | P1 |
| X-004 | Return new members to where they started | registration | S | 28 | P2 |
| X-005 | Guest 'Remind me' on game and calendar pages | registration | M | 28 | P1 |
| X-006 | Game-specific article-end prompt | registration | S | 28 | P2 |
| X-007 | Verify-email page that says what already works | registration | S | 42 | P2 |
| X-008 | Newsletter verify page offers an account | registration | S | 42 | P2 |
| X-009 | Leaderboard empty state becomes an invitation | registration | S | 28 | P3 |
| X-010 | Buffy replies with a one-click account link | registration | S | 28 | P1 |
| X-011 | Wizard order: connect Steam first vs pick games first | activation | S | 28 | P2 |
| X-012 | Founding 100 framing | activation | S | 42 | P1 |
| X-013 | Library-worth card straight after import | activation | M | 28 | P2 |
| X-014 | Welcome email 2: link your library | activation | M | 42 | P1 |
| X-015 | Three-item checklist instead of seven | activation | S | 56 | P2 |
| X-016 | Ask Steam-only accounts for email at the reminder | activation | S | 28 | P2 |
| X-017 | Gamer DNA card at ten shelf items | activation | S | 28 | P2 |
| X-018 | Backlog Advisor guest mode | activation | M | 28 | P2 |
| X-019 | Homepage newsletter block | newsletter | S | 28 | P1 |
| X-020 | Article end: newsletter first vs account first | newsletter | S | 28 | P1 |
| X-021 | /newsletter landing with a real sample issue | newsletter | S | 28 | P2 |
| X-022 | Specific subject lines vs numbered ones | newsletter | S | 56 | P2 |
| X-023 | Send time: Friday 08:00 vs 16:00 CET | newsletter | S | 56 | P3 |
| X-024 | GTA 6 briefing with a dated promise | newsletter | S | 28 | P1 |
| X-025 | Email-only release alert for guests | newsletter | M | 28 | P2 |
| X-026 | Newsletter line in Buffy's welcome | newsletter | S | 28 | P3 |
| X-027 | Discord Onboarding questions | discord | S | 42 | P1 |
| X-028 | End-of-article Discord line vs sidebar widget | discord | S | 28 | P1 |
| X-029 | Invite copy that names a dated event | discord | S | 28 | P2 |
| X-030 | 'What Are You Playing?' on site and Discord together | discord | S | 56 | P2 |
| X-031 | Recruiter role for member invites | discord | M | 42 | P2 |
| X-032 | Buffy's daily On This Day post | discord | S | 28 | P3 |
| X-033 | Link-your-account line in the welcome | discord | S | 28 | P2 |
| X-034 | Shrink the indexable game set | content-seo | L | 42 | P1 |
| X-035 | Contextual links in every article | content-seo | M | 56 | P1 |
| X-036 | Review titles that carry a verdict | content-seo | S | 56 | P2 |
| X-037 | PC fix guides vs news for search clicks | content-seo | M | 56 | P1 |
| X-038 | Series order pages | content-seo | M | 42 | P2 |
| X-039 | 'Where can I play it' blocks on 200 game pages | content-seo | L | 56 | P2 |
| X-040 | A paragraph of our own on game pages | content-seo | L | 42 | P2 |
| X-041 | One home for GTA 6 in search | content-seo | S | 56 | P1 |
| X-042 | Google News clean-up plus original pieces | content-seo | S | 63 | P1 |
| X-043 | RSS repair feeding Flipboard and Mastodon | content-seo | S | 42 | P3 |
| X-044 | Concrete headlines vs question headlines | discover | S | 28 | P2 |
| X-045 | Original 1200px images vs store key art | discover | S | 28 | P2 |
| X-046 | Pillar concentration | discover | S | 84 | P1 |
| X-047 | Author expertise boxes on guides | discover | S | 42 | P3 |
| X-048 | Publishing time for US stories | discover | S | 28 | P3 |
| X-049 | Stories framed on TechPlay's own data | discover | S | 42 | P2 |
| X-050 | Out This Week: carousel vs single image on Instagram | social | S | 42 | P2 |
| X-051 | GTA countdown Stories: fact card vs poll sticker | social | S | 14 | P2 |
| X-052 | X: thread vs single post for Out This Week | social | S | 28 | P3 |
| X-053 | Reddit: answer first, link second | social | S | 56 | P1 |
| X-054 | Threads and Bluesky cross-posts of The Number | social | S | 42 | P3 |
| X-055 | Facebook: Page vs relevant Groups for Hidden Gem | social | S | 42 | P3 |
| X-056 | LinkedIn Studio Watch | social | S | 84 | P3 |
| X-057 | Library Card member spotlight | social | S | 42 | P3 |
| X-058 | Steam Curator page referrals | social | S | 70 | P3 |
| X-059 | Hook: number on screen vs talking-head intro | video | S | 56 | P2 |
| X-060 | One production, four platforms | video | S | 42 | P1 |
| X-061 | Fix It Friday shorts with a guide link | video | S | 42 | P2 |
| X-062 | Out This Week length: 20–30 s vs 45–60 s | video | S | 42 | P3 |
| X-063 | YouTube long-form pilot | video | L | 28 | P2 |
| X-064 | WoW Analyzer 15-second demo | video | S | 14 | P2 |
| X-065 | Welcome email 1 asks which platforms you play | email | S | 28 | P2 |
| X-066 | Personalised releases email vs generic list | email | M | 28 | P1 |
| X-067 | Release-day alert: email vs Discord DM | email | M | 42 | P2 |
| X-068 | Price-drop threshold: member-set vs fixed | email | M | 28 | P3 |
| X-069 | Suppress non-clickers after eight sends | email | S | 56 | P1 |
| X-070 | Plain-text style vs designed template | email | S | 42 | P3 |
| X-071 | Remove share and retweet tasks | giveaways | S | 21 | P1 |
| X-072 | One-click entry with Google or Discord | giveaways | S | 21 | P2 |
| X-073 | Import prompt after entry | giveaways | S | 28 | P1 |
| X-074 | Daily check-in with a weekly freeze | giveaways | M | 21 | P3 |
| X-075 | Giveaway hub indexable while live | giveaways | S | 21 | P2 |
| X-076 | T1 Google branded exact match | paid | S | 28 | P1 |
| X-077 | T2 Meta library-import demo | paid | M | 21 | P1 |
| X-078 | T3 GTA 6 hub carousel vs generic creative | paid | M | 14 | P2 |
| X-079 | T4 Reddit Conversation Placement to Discord | paid | M | 17 | P1 |
| X-080 | T5 WoW Analyzer tool ad on Reddit | paid | M | 17 | P2 |
| X-081 | T6 Backlog Advisor on Reddit | paid | M | 14 | P3 |
| X-082 | T7 Tool exact-match search | paid | S | 14 | P3 |
| X-083 | T8 TikTok Spark boost | paid | M | 7 | P3 |
| X-084 | T9 Meta newsletter double opt-in | paid | M | 14 | P2 |
| X-085 | T10 Meta retargeting of registration starters | paid | M | 14 | P3 |
| X-086 | T11 Free Discord listings | paid | S | 28 | P2 |
| X-087 | T12 Paid newsletter swap | paid | S | 14 | P3 |
| X-088 | T13 Giveaway ads | paid | M | 14 | P3 |
| X-089 | T14 Web push opt-in on GTA 6 reminders | paid | M | 14 | P2 |
| X-090 | T15 YouTube Shorts ad for the WoW demo | paid | S | 14 | P3 |
| X-091 | GTA 6 release-time tool with reminder | tools | M | 36 | P1 |
| X-092 | Calendar export (ICS) and return visits | tools | S | 42 | P3 |
| X-093 | GTA 6 map tracker: save progress with an account | tools | M | 21 | P1 |
| X-094 | Game Awards prediction league | tools | M | 23 | P2 |
| X-095 | Your 2026 in Games | tools | L | 18 | P1 |
| X-096 | Taste Match invite link | tools | M | 28 | P2 |

## Dependencies and open questions

- **Blocking dependencies:** D-007 (events) gates almost every experiment; D-008/D-008a gate every campaign-level read; D-011 gates every Discord experiment that counts joins; D-031 gates Meta tests X-077, X-078, X-084, X-085, X-088. If D-007 slips past 9 Oct, W42–W44 starts move by the same amount.
- **Decisions needed from EIC:** D-021 indexable-set rule (X-034, X-040) before 9 Oct; which paid budget tier applies from 19 Oct (spine §13) since X-083 needs the AGGRESSIVE tier; legal review of giveaway rules before X-088; D-020 map attribution before X-079 and X-093 use map wording.
- **Spine alignment:** X-090 (R16 T15) is parked because spine §12 lists Demand Gen as NOT NOW; X-083 (T8) runs only at the AGGRESSIVE budget. X-089 follows spine C59 (opt-in only after "Notify me"), which narrows R16 T14's 30-second prompt.
- **Data unknowns:** newsletter list size (X-022, X-023, X-069, X-070 and X-087 need at least a few hundred delivered per issue to read anything); whether the GSC Discover report shows data (X-044 to X-049 are void without it); the EEA consent rate (EEA paid reads use first-party data only if it stays under 30% [R16 §4]).
- **Overlap with other Phase 2 files:** registration mechanisms R-01 to R-05 in 15-REGISTRATION correspond to X-001 to X-007 here; this register is the one that carries thresholds and read dates. Giveaway experiments follow the 25-GIVEAWAYS calendar and guardrails.
- **Ethics line (R12):** no experiment adds loss aversion for its own sake. Streak changes add a freeze (X-074), not penalties; scarcity claims are live counts only (X-012); no giveaway gives extra entries for sharing (X-071, X-073).
