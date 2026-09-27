# 27 — Retargeting

Status: Phase 2 plan — 27 Sep 2026
Part 31 of the growth strategy. Owners: SC (audiences, ads, owned sends), DEV (pixel/CAPI, events, owned-channel plumbing), EIC (consent and legal sign-off). Paid retargeting runs as C57d (and the giveaway ad set inside C57e); owned-channel retargeting runs through C42, C43, C59, C40 and the Discord bot. Budgets are in 26 §5.

- **Every paid retargeting pool is zero today.** No ad pixel is installed, the first-party collector re-salts visitor hashes nightly and cannot recognise a returning visitor, and GA4 events cover only onboarding [R16 §0, §4]. Pools start building the day D-031 (Pixel + CAPI) and D-007 (GA4 events) go live, TARGET 19 Oct.
- **Consent decides who can be in a pool.** EEA/UK/CH visitors are denied by default and enter pools only after they consent through the Google CMP; US and rest-of-world default to granted; unknown countries (`XX`/`T1`) are denied [R16 §0]. No pixel fires and no server event is sent for anyone who has not consented.
- **Size gates:** Google documents a minimum of 100 active users in 30 days per list for Search, Display and YouTube [R16 §2.4]. Meta's minimum is not documented in the research [R16 §8 item 10]; TechPlay uses working gates of **500 to test** (T10) and **1,000 to spend more than $10/day** (R16 §3), both ESTIMATES.
- **Thirteen audiences** (R1–R13): the twelve in the brief plus registration starters (R2), which R16's T10 names as the most valuable pool. Hand-raisers (R2 registration starters, R13 remind-me clickers, R6 giveaway non-entrants) come first; broad pools (R1 all visitors, R3 article readers) are used mainly as exclusion bases and seeds.
- **Paid retargeting in Q4 is small and late:** nothing in LEAN; GROWTH $120 (23–30 Nov) + $140 (1–14 Dec); AGGRESSIVE $200 + $350. Black Friday week is the one window where retargeting runs while prospecting is paused (26 §5).
- **Owned channels do most of the retargeting and need no pixel:** email segments that already exist (everyone, members, signups, giveaway; filters for XP, recency and registration age), Discord DM subscriptions and the bot, web push at "remind me" (C59, live 9 Nov), and on-site personalisation (JoinPrompt swap, logged-in modules). Every audience below has an owned equivalent, and for registered members the owned route is always used first.
- **Exclusions are not optional:** registered users out of registration ads, activated users out of activation ads, recent converters out for 14 days, 18+ on every ad set, EEA non-consenters out by construction, fraud-flagged giveaway entrants out of everything.
- **No creepy copy.** Ads never say "you looked at" or name a page someone visited; the message is the next useful step, stated plainly.

---

## 1. Starting point (FACT)

| Fact | Effect on retargeting | Source |
|---|---|---|
| No Meta, Google Ads, TikTok or Reddit tag | No platform pool exists; nothing can be retargeted before D-031 / G6 | R16 §0 |
| First-party collector hashes IPs with a nightly salt; stores path only; drops `utm_*` | Cannot count returning visitors or pool sizes; after D-008 it counts campaign sessions, still not people | R16 §4 item 8; R12 |
| GA4 events: `wizard_*`, `checklist_steam_click`, `d1_return` only | Event-based pools (reminder clickers, registration starters) need D-007 | R16 §0 |
| Consent by country via nginx + Google CMP (since 20 Sep 2026); consent state stored per hit (`gcs`) | Pool membership in EEA = consenters only; the consent rate is readable from `analytics_events.consent` | R16 §0, §4.6 |
| 60 registered users | Customer-list audiences are too small to use and not worth the privacy cost | R16 §0 |
| Mail campaign segments: everyone, members, signups, giveaway; filters `min_xp`, `seen_within_days`, `registered_within_days`; unverified and banned never included | Owned retargeting of members and subscribers works today by manual send | R01 B §20 |
| 20 of 22 notification types are bell-only | Owned retargeting by release reminder / wishlist needs C43 (mail + Discord DM, 19 Oct) and C59 (push, 9 Nov) | R12 §1 |
| Discord bot DM subscriptions (`/subscribe news|giveaway|status`) | An owned retargeting channel for Discord members already exists | R01 |

---

## 2. Size gates and how to read pool size

| Platform | Documented minimum | TechPlay gate | How to read size |
|---|---|---|---|
| Google (Search, YouTube; Display not used) | 100 active users in the last 30 days per list [R16 §2.4] | Use a list only when Google Ads shows it as eligible | Google Ads audience manager (after GA4 link, G6) |
| Meta | Not documented in research [R16 §8] | ≥500 people to launch a test ad set (T10); ≥1,000 to spend >$10/day (R16 §3); ESTIMATES | Ads Manager audience size |
| Reddit, TikTok | Not researched; no pixel in Q4 | No paid retargeting in Q4 | — |

**Planning formula (no invented inputs).** Expected pool ≈ V × (s_US+RoW + s_EEA × c_EEA) × m, where V = distinct people meeting the rule in the window, s = traffic shares by consent region (US ≈35% of traffic [R16 §0]; the rest split unknown), c_EEA = EEA consent rate (UNKNOWN; measure by 30 Oct, G15 in 26), m = platform match rate (UNKNOWN; the platform reports the result). SC does not forecast pool sizes; SC reads them every Monday from 26 Oct and records them in the paid sheet.

**Combine before you drop.** If a single audience is below the gate, it is merged with its nearest neighbour (R2 + R13 → "hand-raisers"; R4 + R10 → "engaged guests") before being skipped.

---

## 3. Consent constraints

| Region | Default | Pixel (browser) | CAPI (server) | Google tags | What this means |
|---|---|---|---|---|---|
| EEA, UK, CH | denied until CMP consent | `fbq('consent','revoke')` before `init` on every page; `grant` only after consent [R16 §2.1] | Send only for events whose consent state (stored with the event) is granted | `ad_storage`, `ad_user_data`, `ad_personalization` must be granted for list membership [R16 §2.4] | Pools hold consenters only; EEA retargeting results are directional |
| US | granted | fires | sent | granted | Main pool. If the CMP exposes a "Do Not Sell or Share" opt-out, send Meta Limited Data Use for the 14 listed states (CA, CO, CT, DE, FL, MT, NE, NH, NJ, OR, TX, MN, MD, RI) [R16 §2.1]; UNKNOWN whether the signal is readable |
| Rest of world | granted | fires | sent | granted | Included in pools; ads target US only in Q4, so RoW members are latent |
| Unknown (`XX`, `T1`) | denied | revoked | not sent | denied | Never in pools |

**Rules.**

1. No customer-list upload (hashed emails) in Q4. The list is small, the consent basis for uploading EEA members' emails to an ad platform is not established, and events carry the same signal with consent attached. Legal review before any upload in Q1.
2. On-site personalisation for guests (localStorage flags such as "has seen three pages") is a per-browser convenience. In the EEA, flags used to change marketing messages are set only after CMP consent, unless legal review classes them as strictly necessary. Flags never leave the browser.
3. Under-18s: 18+ on every ad set; Meta uses only age and location for teens and Google disables personalisation under 18 [R16 §2.15]. TechPlay does not collect birth dates, so no list-based age exclusion is possible; the platform age setting is the control.

---

## 4. Exclusion rules (apply to every paid retargeting ad set)

| ID | Exclude | Rule | Applies to |
|---|---|---|---|
| X1 | Registered users | `registration_complete` ever (browser + CAPI, longest window the platform allows) and CAPI match on hashed email of every login event | All registration ads (C57a, C57b, C57f, R2, R4, R10, R13 ads) |
| X2 | Activated users | `library_connected` ever, or server event `ShelfThree` | Activation ads (R9) |
| X3 | Recent converters | Converted on the ad set's own objective in the last 14 days (30 days for `newsletter_verified`) | All |
| X4 | Under-18 | Ad set age 18+ (platform control) | All |
| X5 | EEA/UK/CH without consent | Not in pools by construction (§3) | All |
| X6 | Newsletter subscribers | `newsletter_verified` ever | Newsletter ads (C57c, R8) |
| X7 | Discord members | `discord_join` via any invite code, or linked Discord ID | Discord ads (C58a) |
| X8 | Fraud-flagged entrants | Giveaway fraud score ≥50 (25 §11.1), sent as server event `GiveawayFlagged` | Everything |
| X9 | Staff and test accounts | Internal emails and office IPs | Everything |
| X10 | Winners and entrants of the current giveaway | `giveaway_entered` for the live giveaway | Giveaway ads (R6) |

---

## 5. Audience catalogue

| ID | Audience | Rule (Meta / GA4) | Window | Primary use | Paid in Q4? | Owned equivalent (§7) |
|---|---|---|---|---|---|---|
| R1 | All visitors | Any PageView | 30 days | Exclusion base; future lookalike seed | No | RSS, footer Discord, newsletter capture |
| R2 | Registration starters | `registration_start` without `registration_complete` | 7 days | Finish sign-up (T10) | Yes (hand-raisers) | On-site "finish creating your account" |
| R3 | Article readers | URL contains `/news/`, `/guides/`, `/reviews/`, `/hardware/` | 30 days | Newsletter | AGGRESSIVE Dec only, via R8 ad | Article-end newsletter capture (C46) |
| R4 | Multi-page visitors | ≥3 PageViews in one session (GA4 condition; Meta: 3+ pages within 30 days, confirm option in Ads Manager) | 30 days | Library registration | GROWTH/AGGR | Third-page JoinPrompt |
| R5 | GTA 6 users | URL contains `/gta6` or equals `/games/grand-theft-auto-vi`; or `tool_run` tool=release-time | 60 days | GTA 6 reminder, then map tracker | AGGRESSIVE Nov | Discord #gta6, push "GTA 6 news" (T14), GTA 6 briefing email |
| R6 | Giveaway visitors, not entrants | URL contains `/giveaway/` without `giveaway_entered` | 7 days or until close | Enter (Winter Keys only) | GROWTH/AGGR Dec (inside C57e) | JoinPrompt swap, Discord #giveaways, push |
| R7 | Video viewers | Meta/IG: viewed ≥50% of a TechPlay Reel or video; YouTube: channel viewers (list needs channel link) | 30 days | Next step from the video | AGGRESSIVE only, with C57f | Pinned comment, bio link, Discord |
| R8 | Newsletter page visitors, not subscribers | URL contains `/newsletter` without `newsletter_signup` | 14 days | Subscribe | GROWTH/AGGR Dec | Sample issue archive (F21) |
| R9 | Registered, not activated | `registration_complete` and no `library_connected` / `ShelfThree` within 7 days | 7–30 days after registration | Link a library | No (owned first); AGGRESSIVE only for Steam-only accounts without email, Q1 | Welcome sequence email 3 (C42), ProfileChecklist, Discord DM |
| R10 | Unregistered return visitors | GA4: `session_count ≥ 2` without `registration_complete`; Meta: visited on ≥2 separate days (confirm option) | 30 days | Library registration | GROWTH/AGGR (merged with R4) | Returning-visitor hero variant |
| R11 | Inactive members | Account with no WRM action in 30 days (server) | 30–90 days | Come back | No (owned only) | Email segment with inverse `seen_within_days`; Discord DM |
| R12 | WoW Analyzer users | `tool_run` tool=wow, or URL contains `/wow-analyzer` | 30 days | MMO hub (C15), WoW: Forever explainer (C14) | No paid in Q4 (owned) | Discord #wow F15, WoW weekly email segment |
| R13 | Calendar / remind-me clickers | `cta_click` cta_id=remind-me without `reminder_set`; or URL contains `/calendar` with `cta_click` on a game | 14 days | Save the reminder (sign up) | Yes (hand-raisers) | Push opt-in at "remind me" (C59), guest modal (D-016) |

---

## 6. Audience cards

Each card: definition, gate, consent note, message, creative, frequency cap (TARGET; applied where the platform offers a cap, otherwise SC pauses the ad set when reported frequency passes it), exclusions, owned equivalent. Landing URLs follow spine §9 via D-009: `utm_source=facebook&utm_medium=paid-social&utm_campaign=c57d-meta-retargeting&utm_content=<audience>-<variant>&utm_term=<audience id>`.

### R2 + R13 — Hand-raisers (registration starters and remind-me clickers)

- **Definition.** R2: fired `registration_start`, no `registration_complete`, last 7 days. R13: `cta_click` with cta_id `remind-me` (guest, D-016) and no `reminder_set`, last 14 days.
- **Gate.** Combined ≥500 on Meta by 20 Nov to launch on 23 Nov; otherwise skip November and re-check 30 Nov.
- **Consent.** US + consenting EEA; `registration_start` sent server-side only with consent flag.
- **Baseline first.** From 19 Oct to 1 Nov (no ads), DB query: share of R2 who complete registration within 7 days, and share of R13 who set the reminder within 14 days. Retargeting's "recovered share" is the exposed rate minus this baseline; T10's hypothesis is 10% recovered.
- **Message.** The reminder or the account you started isn't saved yet; one click with Google, Discord or Battle.net finishes it.
- **Creative.** Static 1:1 and 9:16: the "Remind me" button next to a calendar row, then the Google/Discord/Battle.net buttons.
  - Headline: Finish setting up your reminders
  - Primary text: Release reminders, price alerts and your library, all on one free account. Signing in with Google, Discord or Battle.net takes one click.
  - CTA: Sign Up → https://techplay.gg/register?from=c57d-r2&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57d-meta-retargeting&utm_content=handraisers-static-a&utm_term=r2-r13
- **Frequency cap.** 2 per day, 8 per 7 days; ad set stops showing a person after 7 days in the audience.
- **Exclusions.** X1, X3, X4, X5, X8, X9.
- **Owned equivalent.** On-site: the register page keeps a per-browser draft flag and shows "Finish creating your account" on the next visit (DEV XS, inside D-014). R13: at "remind me", offer web push (C59, 9 Nov) as the no-account path, then the account for email and Discord delivery.
- **Budget.** GROWTH Nov $10/day (23–30), Dec $6/day (1–14); AGGRESSIVE Nov $12/day, Dec $12/day.

### R4 + R10 — Engaged guests (multi-page and return visitors)

- **Definition.** R4: ≥3 pages in a session, last 30 days. R10: ≥2 sessions in 30 days, no registration. Merge on Meta; keep separate in GA4 for reading.
- **Gate.** ≥1,000 to spend (these are warmer than R1 but still broad).
- **Message.** The library pitch, not a reminder of their browsing.
- **Creative.** Re-use C57a Creative A (wizard video).
  - Headline: Every game you own, on one shelf
  - Primary text: Connect Steam, PlayStation, Xbox, GOG or Epic and your games arrive with the hours you've played. TechPlay then tells you what's releasing and what's on sale. Free.
  - CTA: Sign Up → /register?from=c57d-r4 (UTM as above, `utm_content=engaged-wizard-a`)
- **Frequency cap.** 1 per day, 4 per 7 days.
- **Exclusions.** X1, X3, X4, X5, X8, X9; also exclude R2/R13 (they get the hand-raiser ad).
- **Owned equivalent.** On-site third-page variant of JoinPrompt ("You've read a few things here. The account is for keeping track of what you play.") and a returning-visitor homepage hero variant; both need per-browser flags (DEV S, after C46; consent rule §3.2).
- **Budget.** GROWTH Nov $5/day; AGGRESSIVE Nov $8/day, Dec $8/day.

### R5 — GTA 6 users

- **Definition.** Visited `/gta6*` or `/games/grand-theft-auto-vi`, or ran the release-time tool; 60 days.
- **Gate.** ≥1,000 (AGGRESSIVE only).
- **Consent.** Standard.
- **Message by date.** Until 18 Nov: set a launch reminder and check the unlock time. 19–30 Nov: if C11 map progress tracker is live, "track your map progress"; if not, no GTA ad (nothing useful to say that an organic post doesn't). December: none.
- **Creative (pre-launch).** Static card "19 November · PS5 and Xbox Series X|S · no PC at launch".
  - Headline: What time does GTA VI unlock where you live?
  - Primary text: The release-time tool shows your local unlock time for PS5 and Xbox Series X|S. Set a reminder and we'll tell you on the day.
  - CTA: Learn More → https://techplay.gg/gta6/release-time?from=c57d-r5&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57d-meta-retargeting&utm_content=gta6-releasetime-a&utm_term=r5
- **Creative (launch, only with C11).** Headline: Track your GTA VI map progress · Primary text: Mark the locations you've found; your progress is saved to your TechPlay account. Free.
- **Frequency cap.** 1 per day, 5 per 7 days.
- **Exclusions.** X1 for the reminder ad (registered users get the reminder by owned channels), X3, X4, X5, X8, X9.
- **Owned equivalent.** Discord #gta6 daily F02 post; push opt-in "GTA 6 news" on hub pages (T14, C59); GTA 6 briefing email to subscribers who signed up on the hub (needs a source tag on `newsletter_subscribers`, which does not exist today [R01 B §20]; DEV XS).
- **Budget.** AGGRESSIVE Nov: $5/day inside C57d (23–30 Nov only if C11 is live; otherwise that $5 goes to hand-raisers).

### R6 — Giveaway visitors who did not enter

- **Definition.** Visited `/giveaway/{slug}` for the live giveaway, no `giveaway_entered`; until the giveaway closes, max 7 days.
- **Gate.** ≥500; runs only for C33a Winter Keys (the only giveaway cleared for paid in Q4, 25 §9).
- **Consent.** Standard.
- **Message.** The real closing date and the fact that entry is free. No countdown timers, no "last chance".
- **Creative.** Prize static (Winter Keys card).
  - Headline: Winter Keys closes 20 December
  - Primary text: Steam keys from indie studios plus $50 of store credit, drawn on 21 December. Free to enter with a TechPlay account; no purchase necessary, 18+. Official rules on the page. Not sponsored by or associated with Meta.
  - CTA: Learn More → https://techplay.gg/giveaway/{slug}?from=c57e-r6&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57e-winter-keys-giveaway&utm_content=r6-static-a&utm_term=r6
- **Frequency cap.** 1 per day, 3 in total.
- **Exclusions.** X10 (already entered), X3, X4, X5, X8, X9.
- **Owned equivalent.** JoinPrompt swap on every article while live; Discord #giveaways (opening, midpoint, −24 h); push for opted-in visitors; G3 closing reminder for entrants.
- **Budget.** Inside C57e (GROWTH $10/day, AGGRESSIVE $20/day, 1–14 Dec), split 50/50 between prospecting and R6 once R6 passes the gate.

### R7 — Video viewers

- **Definition.** Meta/Instagram: viewed ≥50% of a TechPlay video or Reel in 30 days (engagement audience built from on-platform views, not the site pixel). YouTube: channel viewers, only after the channel is linked to Google Ads and the list reaches 100 active users.
- **Gate.** ≥1,000 on Meta.
- **Consent.** On-platform engagement audiences do not depend on TechPlay's site consent; whether they are acceptable for EEA users under TechPlay's privacy notice is a legal-review question. In Q4 the ad set targets the US only, which sidesteps it.
- **Message.** The next step after the video: the tool it showed.
- **Creative.** The same video's end card as a static, with the tool link. Headline: the tool's own line, e.g. "Check your WoW character in 15 seconds" or "See your whole library on one shelf". Primary text: one sentence on what the tool does and "Free".
- **Frequency cap.** 1 per day, 4 per 7 days.
- **Exclusions.** X1 (for registration messages), X3, X4, X8, X9.
- **Owned equivalent.** Pinned comment and bio link on each C49 video; Discord post of each new video.
- **Budget.** AGGRESSIVE only, from C57f's line when G14 has produced a video worth following up. No dedicated money.

### R8 — Newsletter page visitors who did not subscribe (and R3 article readers)

- **Definition.** R8: visited `/newsletter` (new, D-012) without `newsletter_signup`, 14 days. R3 (broad): article readers, 30 days; used only if R8 is below the gate, and only in AGGRESSIVE December.
- **Gate.** ≥500.
- **Message.** What the Save File is, shown with a real issue.
- **Creative.** 4:5 image of the latest issue header.
  - Headline: One email on Fridays
  - Primary text: Next week's releases with platforms and prices, one verdict, one number worth knowing. Free; unsubscribe in one click.
  - CTA: Subscribe → https://techplay.gg/newsletter?from=c57d-r8&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57d-meta-retargeting&utm_content=savefile-issue-a&utm_term=r8
- **Frequency cap.** 1 per day, 3 per 7 days.
- **Exclusions.** X6 (subscribers), X3, X4, X5, X8, X9.
- **Owned equivalent.** Article-end newsletter block (C46/D-010), web archive of past issues (F21), Discord welcome message link.
- **Budget.** GROWTH Dec $4/day; AGGRESSIVE Dec $5/day.

### R9 — Registered, not activated

- **Definition.** `registration_complete` and no A2 event within 7 days; days 7–30 after registration.
- **Paid?** No in Q4. These people are members with a verified email (password and social sign-ups) and are reachable for free; buying ads to reach them would spend money on people TechPlay can already email. Exception for Q1: Steam-only accounts created after D-015 have no email [R11 §5]; if that group grows, a small Meta ad set on the server event is the only way back to them.
- **Owned sequence (C42 welcome, live 12 Oct; D-013 channel).**
  - Day 0: verification (exists).
  - Day 1: "What TechPlay does with a library" — link Steam, PlayStation, Xbox, GOG or Epic; games arrive with hours.
  - Day 4 (only if no A2): Subject "Your shelf is empty, which is fixable" — one button per platform; one line on the PlayStation `npsso` step with the help-centre link, since it is the hard one [R11 §1.4].
  - Day 10 (only if no A2): "Three games is enough to start" — add three by search; Backlog Advisor and reminders work from there.
- **Day 4 email in full (SC, template in C42):**
  > Subject: Your shelf is empty, which is fixable
  >
  > Hi {username},
  >
  > You made a TechPlay account on {date}, and your shelf still has nothing on it. That's the part that makes the rest work: release reminders, price alerts and "what to play next" all read from it.
  >
  > The quickest way is to link a store. Steam takes about half a minute. Xbox needs your gamertag. PlayStation asks you to paste a sign-in token, and the help page walks through it: {help link}.
  >
  > [Link Steam] [Link Xbox] [Link PlayStation] [Link GOG] [Link Epic]
  >
  > If you'd rather not link anything, add three games you're playing or waiting for, and we'll take it from there.
  >
  > TechPlay
- **Other owned.** ProfileChecklist on the profile (exists); Discord DM from Buffy for members who linked Discord ("Your TechPlay shelf is empty; `/library` shows it once you link a store").

### R11 — Inactive members

- **Definition.** Account with at least one past WRM action and none in the last 30 days (server-side, spine §3).
- **Paid?** No. Customer-list upload is out in Q4 (§3 rule 1).
- **Owned.** Mail campaign to members with an inverse recency filter (the segment builder has `seen_within_days`; it needs a "not seen within" option, DEV XS inside D-013). Monthly, first Monday, content = their own data: "Since you were last here: {n} games on your wishlist released; {n} are on sale" (C41 data). Only people with a verified email and not unsubscribed. Discord DM for linked members, max once a month.
- **Monthly email in full:**
  > Subject: {n} games from your wishlist came out since you were last here
  >
  > Hi {username},
  >
  > Since {last active date}: {game A} and {game B} from your wishlist released; {game C} is {x}% off on Steam until {date}. Next week, {game D} is out on {platform}.
  >
  > [See your shelf]
  >
  > You're getting this because you have a TechPlay account with a wishlist. One email a month at most; stop them here: {unsubscribe}.
  >
  > If nothing on your wishlist moved, this email is not sent.
- **Guardrails.** Unsubscribe <0.5% and complaints <0.1% per send (spine §3); stop the monthly send for anyone who has not clicked in three sends (R20 §4 re-engagement suppression).

### R12 — WoW Analyzer users

- **Definition.** `tool_run` tool=wow or `/wow-analyzer` visit, 30 days.
- **Paid?** No in Q4 (C58b and C56b cover WoW acquisition; the pool is better served in Discord). Revisit with the MMO hub (C15, 10 Nov) for Q1.
- **Owned.** F15 Readiness Check every Tuesday in Discord #wow; WoW weekly email segment for members with a saved character (`WowCharacter` rows exist [R11 §4 row 27]); on-site: after an analysis, "Save this character" → Battle.net sign-in.

### R1 — All visitors

- **Use.** Exclusion base and future seed only. No ads to "everyone who visited", which is a pageview campaign in disguise [R16 §5].
- **Owned.** Footer Discord invite (wPQG9gUMXH), RSS, newsletter capture points.

---

### 6.1 Event spec for pools (what DEV builds in D-007 / D-031)

| Spine event | Fired where | Browser (Pixel) | Server (CAPI) | Key params | Consent handling | Feeds |
|---|---|---|---|---|---|---|
| PageView | every page | yes | no | URL | revoked until consent in EEA | R1, R3, R4, R5, R6, R8, R10 |
| `registration_start` | first keystroke or social button on `/register` | yes | yes | `from` | server sends only with stored consent = granted | R2 |
| `registration_complete` | `AuthController` / social callbacks | yes (CompleteRegistration) | yes | `method`, `from` | same | X1, R9 |
| login (not a spine event; server-only) | `AuthController::login` and social callbacks | no | yes (custom `MemberLogin`) | — | same | X1 for members who registered before the pixel existed |
| `email_verified` | verify endpoint | no | yes (EmailVerified) | — | same | C57a optimisation |
| `library_connected` | first successful `Sync*Library` job | no | yes (LibraryConnected) | `platform` | same | X2 |
| `shelf_add` ×3 | third `user_games` row within 7 days | no | yes (ShelfThree) | — | same | X2 |
| `reminder_set` | reminder endpoint | yes | yes (ReminderSet) | `game_id` | same | R13 exclusion, C57b |
| `cta_click` (remind-me) | guest "Remind me" button (D-016) | yes | no | `cta_id`, `game_id` | browser only | R13 |
| `tool_run` | WoW, backlog, release-time tools | yes | no | `tool` | browser only | R5, R12 |
| `newsletter_signup` / `newsletter_verified` | form submit / verify click | yes / no | no / yes (Lead) | `from` | same | R8, X6 |
| `giveaway_entered` | first entry only | yes | yes | `giveaway` | same | R6, X10 |
| `GiveawayFlagged` | fraud score ≥50 | no | yes | `giveaway` | same | X8 |

Deduplication: every event sent by both browser and server carries the same `event_id` [R16 §2.1]. Server events include hashed email and `external_id` only for accounts; guests are matched on `fbp`/`fbc` alone.

### 6.2 Google lists (GA4 audiences shared to Google Ads, observation only)

| List | GA4 condition | Membership used for |
|---|---|---|
| G-R2 | event `registration_start` and not `registration_complete`, 7 days | Observation on C56a to see whether starters search the brand |
| G-R5 | `page_location` contains `/gta6` or `/games/grand-theft-auto-vi` | Size read only |
| G-R10 | `session_count` ≥2 and not `registration_complete`, 30 days | Observation on C56a/C56b |
| G-R12 | event `tool_run` with `tool` = wow | Observation on C56b WoW ad group; C56c viewers comparison |
| G-R13 | event `cta_click` with `cta_id` = remind-me and not `reminder_set` | Size read only |

No Display or Demand Gen campaign uses these lists in Q4 [spine §12]. Lists become usable only at 100 active users in 30 days and only for users with `ad_storage`, `ad_user_data` and `ad_personalization` granted [R16 §2.4].

## 7. Owned-channel retargeting (no pixel needed)

| Audience | Email | Discord | Web push (C59, 9 Nov) | On-site personalisation | Needs |
|---|---|---|---|---|---|
| R1 All visitors | — | Footer invite | — | Newsletter capture on homepage/article end | D-012, C46 |
| R2 Registration starters | — (no address yet) | — | — | "Finish creating your account" on next visit | DEV XS (D-014) |
| R3 Article readers | Save File (if subscribed) | Article auto-posts | — | Article-end newsletter block, related module | C46/D-010 |
| R4 Multi-page | — | — | — | Third-page JoinPrompt variant | DEV S |
| R5 GTA 6 users | GTA 6 briefing to hub sign-ups | #gta6 F02 daily | "GTA 6 news" opt-in (T14) | Hub counters, reminder CTA | Source tag on subscribers (XS), C59 |
| R6 Giveaway non-entrants | Giveaway block in Save File | #giveaways posts | Opt-in "giveaway opens/closes" | JoinPrompt swap (exists) | — |
| R7 Video viewers | — | New-video post | — | — | — |
| R8 Newsletter visitors | — | Welcome message link | — | Sample issue on `/newsletter` | D-012 |
| R9 Registered, not activated | C42 welcome days 1/4/10 | Buffy DM if linked | Only if opted in | ProfileChecklist (exists) | D-013 |
| R10 Return guests | — | — | — | Returning-visitor hero variant | DEV S |
| R11 Inactive members | Monthly "since you were last here" | Monthly DM if linked | Only for their reminders | Logged-in "what changed" module | Inverse recency filter (XS), C41 data |
| R12 WoW users | WoW weekly segment | #wow F15 Tuesdays | — | "Save this character" after a run | — |
| R13 Remind-me clickers | — | — | Push at "remind me" (no account needed) | Guest modal returning to the page | D-016, C59 |

**Why owned first.** Owned channels reach EEA non-consenters (the pixel cannot), cost nothing per contact, and carry the member's own data ("your wishlist", "your reminder"), which no ad can do without being creepy. Paid retargeting is reserved for people TechPlay has no other way to reach: guests who raised a hand (R2, R13, R6) and guests who keep coming back (R4, R10).

**Web push specifics.** Opt-in only at a moment of intent ("remind me", "GTA 6 news"), never on page load, because Chrome demotes sites with low acceptance to a quieter prompt and iOS supports web push only for Home Screen apps [R23 D; RESEARCH-COMPLETE #25]. T14 stop: <1% opt-in after two weeks [R16 T14].

---

## 8. Q4 paid retargeting schedule (links to 26 §5)

| Window | LEAN | GROWTH (C57d) | AGGRESSIVE (C57d) |
|---|---|---|---|
| 19 Oct–22 Nov | Pools build; baselines measured; no spend | same | same |
| 23–30 Nov (Black Friday week; prospecting paused) | — | $15/day: hand-raisers $10, engaged guests $5 → $120 | $25/day: hand-raisers $12, engaged guests $8, GTA 6 (R5) $5 if C11 live → $200 |
| 1–14 Dec | — | $10/day: hand-raisers $6, newsletter visitors (R8) $4 → $140; R6 inside C57e | $25/day: hand-raisers $12, engaged guests $8, R8 $5 → $350; R6 inside C57e |
| 15–31 Dec | — | none (Year-in-Review extension is an open question, 26 §5.4) | same |

If a pool misses its gate on the launch day, its share is not moved to prospecting; it is left unspent and the pool is re-checked a week later.

---

## 9. Measurement

| Metric | Definition | Source |
|---|---|---|
| Pool size by audience | Platform-reported size, Monday | Ads Manager, Google Ads |
| Baseline completion | Share of the audience completing the target action with no ads (19 Oct–1 Nov) | DB joined with GA4 events |
| Recovered share | Exposed completion rate − baseline | DB + platform |
| Cost per recovered conversion | Spend ÷ (conversions − baseline-expected conversions) | Sheet |
| Frequency | Average impressions per person per 7 days | Platform |
| Negative signals | Hides, "irrelevant" feedback, comments complaining about tracking | Platform + SC notes |
| Owned-channel return | Visits within 24 h of an email/DM/push per type (R12 metric) | Signed-link clicks, collector UTM |

T10 read on 7 Dec: if cost per recovered registration is under the global $10 line (26 §3) keep hand-raisers in Q1; if over $25 or the pool never passed 500, drop paid retargeting and keep the owned equivalents.

---

## 9a. Creative rotation and copy rules

| Rule | Detail |
|---|---|
| Two variants per ad set | A and B from launch; the loser is paused at 1,000 impressions each if its CTR is below half the winner's |
| Refresh | New creative when 7-day frequency passes the cap or CTR falls by half from week 1 |
| No behaviour in copy | Never "you looked at", "still thinking about", "we noticed"; say what the product does |
| Real dates only | Closing dates and release dates as published; no timers, no "last chance", no "only today" |
| Numbers | Only numbers TechPlay can back: 333,000 games, five platforms, $79.99, 19 November. Never member or subscriber counts |
| Emoji | None in ads |
| Giveaway lines | "No purchase necessary", "18+", rules link and the Meta non-association line in every giveaway ad [R16 §2.15] |

| Avoid | Use instead |
|---|---|
| "Still thinking about GTA VI?" | "What time does GTA VI unlock where you live?" |
| "Don't miss out, the giveaway ends soon" | "Winter Keys closes 20 December" |
| "Join thousands of gamers" | "Free, and signing in with Google takes one click" |
| "You left something behind" | "Finish setting up your reminders" |

## 10. Build checklist and hours

| Item | Owner | Hours (ESTIMATE) | By |
|---|---|---|---|
| D-031 Pixel + CAPI with consent gating and `event_id` dedupe; server events `EmailVerified`, `LibraryConnected`, `ShelfThree`, `ReminderSet`, `GiveawayFlagged` | DEV | inside D-031 (M) | 19 Oct |
| D-007 events `registration_start`, `registration_complete`, `cta_click` (remind-me), `tool_run`, `newsletter_signup` | DEV | inside D-007 | 16 Oct |
| GA4 audiences R2, R4, R5, R10, R12, R13 shared to Google Ads (observation only; no Display) | SC | 2 | 23 Oct |
| Meta custom audiences R1–R10, R13 + exclusion audiences X1–X10 | SC | 3 | 26 Oct |
| Baseline queries (R2, R13, R6) | SC with DEV | 2 | 2 Nov |
| Owned: subscriber source tag, inverse recency filter, register draft flag | DEV | 4–6 | 9 Nov |
| Owned: third-page JoinPrompt and returning hero variants | DEV | 6 | Q1 unless DEV has slack in Nov |
| Creatives: hand-raisers static, R5 card, R8 issue card | DS | 3 | 16 Nov |
| Weekly pool read and frequency check | SC | 0.5/week | from 26 Oct |

---

## 11. Privacy and legal checklist (EIC before 19 Oct)

1. Privacy policy names the Meta Pixel/CAPI and Google Ads tags, what they collect and the consent choice (EEA/UK/CH).
2. CMP vendor list includes Meta and Google Ads purposes; revoking consent stops both pixel and server events.
3. Server events store the consent state captured at the time of the action; events without granted consent are dropped, not queued.
4. No customer-list uploads in Q4.
5. US opt-out: check whether the CMP exposes the "Do Not Sell or Share" choice to page JS; if yes, send Limited Data Use for the listed states.
6. Retargeting copy review: no reference to specific pages visited, no health/finance-type inferences, no urgency beyond real dates.
7. Data retention for `GiveawayFlagged` and IP-based fraud signals stated in the giveaway rules (25 §8 rule 10).

---

## 12. Q1 2027 continuity

| Date (spine §11) | Audience | Message | Channel |
|---|---|---|---|
| Jan (after C28) | R9, R11 | "Your 2026 in Games" card as the reason to link a library | Email, Discord |
| 15 Jan Stranger Than Heaven; 28 Jan Metroid Ravenous, Until Dawn 2 | R13 (reminder clickers) | Reminder saved? Release-day alert | Push, email |
| 22 Feb Steam Next Fest | R4/R10 engaged guests | Next Fest demo tracker (repeat of C18) | Owned first; paid only if Q4 T10 passed |
| 23 Feb Fable | R13, R7 | Release-time and reminder | Push, Meta (if Q4 passed) |
| 18–25 Mar Steam Spring Sale | R9, R11 | Wishlist price alerts | Email, Discord DM |
| 8 Apr FF7 Revelation | R3 article readers | In Order series page (F09) and reminder | Owned; newsletter |

Q1 decision on 4 Jan: keep paid retargeting only for audiences whose recovered-share cost met the 26 §3 rule in Q4; everything else stays owned.

## Dependencies and open questions

**Dependencies**

- D-031 Pixel + CAPI (19 Oct), D-007 events, D-008 collector UTM, D-009 URL helper (C03).
- D-012 `/newsletter`, D-014 register rebuild, D-016 guest remind-me modal, C59/D-019 web push (9 Nov), C42/D-013 welcome sequence and mail channel, C43 release-day alerts, C41 personalised releases email, C11 map tracker (for the R5 launch message).
- 25-GIVEAWAYS for R6 and exclusion X8/X10; 26-PAID-MEDIA for budgets and the global scale/stop rules.

**Open questions**

1. What is the EEA consent rate since 20 Sep 2026, and therefore how much of each pool is EEA? (Read from `analytics_events.consent` by 30 Oct.)
2. Does Meta's website custom audience builder offer "visited on ≥2 days" and "≥3 pages" rules in the current Ads Manager? (R4/R10 definitions depend on it; confirm in the UI.)
3. Are on-platform engagement audiences (R7) acceptable for EEA users under TechPlay's privacy notice?
4. Can the CMP's US opt-out signal be read for Limited Data Use?
5. Should on-site personalisation flags for guests in the EEA wait for consent, or are they strictly necessary? (Legal.)
6. Will Steam-only accounts (D-015) be numerous enough in Q1 to justify the R9 paid exception?
7. Retargeting beyond 14 Dec for C28 Year in Review: decide 7 Dec with the November numbers.
