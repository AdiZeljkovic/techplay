# 21 — Gaming Tools Roadmap (Part 24)

Status: Phase 2 plan — 27 Sep 2026

- **55 tool ideas scored** from R10 (and the matching TOOL rows in `opportunities.json`) on eight criteria, 1–5, all ESTIMATE, weighted toward what a 20-hour-a-week developer can ship and what brings members back (the North Star is Weekly Returning Members [spine §3]).
- **NOW, by 31 Oct (15 items):** the GTA 6 release-time tool with reminder (C08), the WoW Analyzer re-aim (C13), release-day alerts outside the site (C43), and twelve tools that are mostly editorial templates on data TechPlay already has: weekly poll, game club, Next Fest tracker, Steam movers, on-this-day card, GTA vehicle real-world view, GTA editions table, studios-closed tracker, hidden gems, release congestion chart, Switch 2 upgrade tracker, Steam Curator page.
- **NEXT, Nov–Dec (10 items):** GTA 6 map progress tracker (C11), wishlist price-drop alerts and sale picks from your wishlist (C31), a no-code Game Awards prediction league (C29), Gamer DNA and "library worth" share cards, Your 2026 in Games (C28). Three are "if capacity": wishlist gift link, ICS export, Taste Match invite link.
- **LATER, 2027 (29 items)** by quarter; January carries the backlog tools (public Backlog Advisor quiz, Steam calculator, backlog time calculator) because New Year backlog resolutions are their natural hook [R14 #22, #57].
- **Dates beat scores.** The score ranks value per hour; the bucket follows the campaign calendar. A lower-scoring tool with a fixed date (Next Fest, Black Friday, The Game Awards) goes before a higher-scoring one without.
- **DEV is the constraint.** Tool work takes 2–18 h of DEV's 20 h in any week (§5). The prediction league runs on existing forum polls to save about 16 DEV hours in November.
- **Every tool is useful logged out and better logged in** [R10 §5]: the public view ranks and gets shared; the account saves, reminds or personalises.
- **Honesty rules:** no tool shows a number it cannot back (no fake counters, no "players analyzed"); every data tool prints its source and "last updated"; member-derived statistics wait for n ≥ 500 [R14 §6].

---

## 1. How the tools were scored

| Criterion | 5 means | Weight | Why this weight |
|---|---|---|---|
| Development effort | Small build (S) or no code | 1.5 | DEV has 20 h/week and a P0 backlog [spine §1, §14] |
| Traffic | Large addressable demand | 1.0 | Search is near zero today [R03]; traffic is a later payoff |
| SEO | Durable search landing page | 1.0 | Same |
| Backlinks | Likely to be cited or embedded | 0.75 | Serves authority, not accounts [R21] |
| Retention | Reason to come back weekly | 1.5 | North Star is WRM |
| Registration | Reason to create an account | 1.25 | Accounts feed WRM |
| Shareability | Output people post | 0.75 | Useful, but social is a secondary channel class [spine §12] |
| Time to launch | Can ship fast | 1.25 | Q4 dates are fixed [R05] |

Weighted total = Σ(weight × score); maximum 45. Base scores are R21's (from R10's columns). Adjusted rows are marked `*` in §2:

- TOOL-12 release time: registration 2→4 and retention 1→2, because C08 pairs it with a reminder that brings the person back on launch day.
- TOOL-17 WoW Analyzer: registration 2→3, because "Save this character" is one Battle.net click (REG-27).
- TOOL-07 release-day alerts: effort 5→3 and time 5→4, because the spine sizes D-013 as M with a 19 Oct date.
- TOOL-01 year in review: effort 3→2 and time 3→2, because D-025 is L.
- TOOL-15 GTA vehicles: effort 5→4, because 121 rows need sourcing by hand (19-GTA6.md §5.3).
- TOOL-26 congestion chart: backlinks 4→5, because R14 ranks release congestion first among 60 PR ideas.
- TOOL-38 prediction league: effort 3→5 and time 3→5, because v1 runs on existing forum polls with no new code (§4.4).
- TOOL-27 Steam movers: effort stays 5 because v1 is an editor reading Steam's public weekly chart; no script.

---

## 2. Scores and buckets (all 55)

| Rank | ID | Tool | Effort | Traffic | SEO | Backlinks | Retention | Registration | Share | Time | Weighted /45 | Bucket | Campaign · D-ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TOOL-17* | WoW Analyzer, re-aimed per patch | 5 | 4 | 4 | 4 | 4 | 3 | 4 | 5 | 37.50 | NOW | C13 · D-040 |
| 2 | TOOL-13 | GTA 6 countdown with reminder | 5 | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 37.25 | NOW | C08/C06 · D-018 |
| 3 | TOOL-37 | Weekly poll with results page | 5 | 2 | 2 | 4 | 4 | 4 | 4 | 5 | 34.75 | NOW | C39 · — |
| 4 | TOOL-38* | Prediction league (The Game Awards, showcases) | 5 | 2 | 2 | 4 | 4 | 4 | 4 | 5 | 34.75 | NEXT | C29 · (D-026 in 2027) |
| 5 | TOOL-03 | "My library is worth $X" card | 5 | 3 | 3 | 4 | 2 | 4 | 5 | 5 | 34.50 | NEXT | C31 · D-024a |
| 6 | TOOL-39 | Monthly game club | 5 | 2 | 2 | 2 | 5 | 4 | 3 | 5 | 34.00 | NOW | C38 · — |
| 7 | TOOL-08 | Calendar export (ICS) for wishlist releases | 5 | 3 | 3 | 2 | 4 | 4 | 2 | 5 | 33.75 | NEXT | C70 · D-036 |
| 8 | TOOL-22 | Backlog time calculator | 5 | 3 | 3 | 4 | 2 | 4 | 4 | 5 | 33.75 | LATER Q1 (Jan) | — |
| 9 | TOOL-12* | Release time by time zone | 5 | 4 | 4 | 2 | 2 | 4 | 3 | 5 | 33.50 | NOW | C08 · D-018 |
| 10 | TOOL-48 | Demo tracker for Steam Next Fest | 5 | 3 | 3 | 2 | 3 | 4 | 3 | 5 | 33.00 | NOW | C18 · — |
| 11 | TOOL-27* | Steam rank movers weekly | 5 | 3 | 3 | 4 | 3 | 2 | 4 | 5 | 32.75 | NOW | F13 · — |
| 12 | TOOL-35 | On-this-day pages and social card | 5 | 3 | 3 | 4 | 3 | 2 | 4 | 5 | 32.75 | NOW | C65 · — |
| 13 | TOOL-05 | Taste Match invite link | 5 | 1 | 1 | 4 | 3 | 4 | 5 | 5 | 32.00 | NEXT | C28 · D-024c |
| 14 | TOOL-15* | GTA 6 vehicle database with real-world equivalents | 4 | 4 | 4 | 4 | 2 | 2 | 4 | 5 | 31.75 | NOW | C12 · D-017 |
| 15 | TOOL-36 | Daily guessing game (cover, screenshot or release year) | 3 | 2 | 2 | 4 | 5 | 4 | 5 | 3 | 31.50 | LATER Q1 | — |
| 16 | TOOL-29 | Studios-closed-in-2026 tracker | 5 | 3 | 3 | 4 | 2 | 2 | 4 | 5 | 31.25 | NOW | C22 · — |
| 17 | TOOL-14 | GTA 6 map progress tracker (at launch) | 3 | 4 | 4 | 2 | 4 | 4 | 3 | 3 | 31.00 | NEXT | C11 · D-018b |
| 18 | TOOL-34 | Hidden gems ranked pages | 5 | 4 | 4 | 2 | 2 | 2 | 3 | 5 | 31.00 | NOW | C64 · — |
| 19 | TOOL-02 | Gamer DNA share card | 5 | 1 | 1 | 4 | 2 | 4 | 5 | 5 | 30.50 | NEXT | C28 · D-024 |
| 20 | TOOL-26* | Year's release congestion chart | 5 | 3 | 3 | 5 | 1 | 2 | 4 | 5 | 30.50 | NOW | C20 · — |
| 21 | TOOL-31 | Switch 2 edition / upgrade tracker | 5 | 4 | 4 | 2 | 2 | 2 | 2 | 5 | 30.25 | NOW | C61 · D-032 |
| 22 | TOOL-53 | Gift ideas from a friend's wishlist | 5 | 3 | 3 | 2 | 1 | 4 | 3 | 5 | 30.00 | NEXT | C33 · D-024b |
| 23 | TOOL-18 | WoW weekly checklist | 3 | 3 | 3 | 2 | 5 | 4 | 2 | 3 | 29.75 | LATER Q1 | C15 follow-up |
| 24 | TOOL-41 | Embeddable "currently playing" badge | 5 | 1 | 1 | 4 | 2 | 4 | 4 | 5 | 29.75 | LATER Q2 | — |
| 25 | TOOL-51 | "Friends playing now" feed | 5 | 1 | 1 | 2 | 4 | 4 | 2 | 5 | 29.75 | LATER Q2 | — |
| 26 | TOOL-52 | Completion goals and reading list | 5 | 1 | 1 | 2 | 4 | 4 | 2 | 5 | 29.75 | LATER Q2 | — |
| 27 | TOOL-16 | GTA 6 edition comparison and price by region | 5 | 4 | 4 | 2 | 1 | 2 | 3 | 5 | 29.50 | NOW | C07a · — |
| 28 | TOOL-07* | Release-day alerts outside the site | 3 | 2 | 2 | 2 | 5 | 4 | 2 | 4 | 29.00 | NOW | C43 · D-013 |
| 29 | TOOL-19 | Backlog Advisor, public quiz version | 3 | 5 | 5 | 2 | 3 | 2 | 3 | 3 | 29.00 | LATER Q1 (Jan) | D-037 |
| 30 | TOOL-47 | Black Friday / Steam sale picks from my wishlist | 3 | 3 | 3 | 2 | 4 | 4 | 3 | 3 | 29.00 | NEXT | C31/C34 · D-027a |
| 31 | TOOL-10 | Game Pass / PS Plus catalogue tracker | 3 | 4 | 4 | 2 | 4 | 2 | 3 | 3 | 28.50 | LATER Q1 | — |
| 32 | TOOL-11 | "Can I run it" against a saved PC spec | 2 | 5 | 5 | 2 | 3 | 4 | 2 | 2 | 28.00 | LATER Q2 | — |
| 33 | TOOL-33 | File size and pre-load table | 5 | 4 | 4 | 2 | 1 | 2 | 1 | 5 | 28.00 | LATER Q1 (Fable, FF7) | — |
| 34 | TOOL-40 | Discord `/game` and `/remind` commands | 5 | 1 | 1 | 2 | 4 | 2 | 3 | 5 | 28.00 | LATER Q1 | C36 follow-up |
| 35 | TOOL-01* | Cross-platform year in review ("Your 2026 in games") | 2 | 3 | 3 | 4 | 3 | 4 | 5 | 2 | 27.75 | NEXT | C28 · D-025 |
| 36 | TOOL-04 | Public Steam library calculator (logged out) | 3 | 4 | 4 | 4 | 2 | 2 | 4 | 3 | 27.75 | LATER Q1 (Jan) | D-037 |
| 37 | TOOL-06 | Wishlist price-drop alerts (email/Discord/push) | 3 | 2 | 2 | 2 | 5 | 4 | 2 | 3 | 27.75 | NEXT | C31 · D-027 |
| 38 | TOOL-20 | "Games like X" pages | 3 | 5 | 5 | 2 | 2 | 2 | 2 | 3 | 26.75 | LATER Q1 | — |
| 39 | TOOL-21 | Series order pages ("X games in order") | 3 | 5 | 5 | 2 | 2 | 2 | 2 | 3 | 26.75 | LATER Q1 | — |
| 40 | TOOL-43 | Steam Curator page fed from reviews and gems | 5 | 2 | 2 | 2 | 2 | 2 | 2 | 5 | 26.25 | NOW | C69 · — |
| 41 | TOOL-46 | Price history per game | 3 | 4 | 4 | 2 | 3 | 2 | 2 | 3 | 26.25 | LATER Q2 | — |
| 42 | TOOL-09 | "Where to play" block on every game page | 3 | 5 | 5 | 2 | 2 | 2 | 1 | 3 | 26.00 | LATER Q1 | D-023 follow-up |
| 43 | TOOL-44 | Monthly data report ("state of the backlog") | 3 | 3 | 3 | 4 | 2 | 2 | 4 | 3 | 25.75 | LATER Q1 (C27) | — |
| 44 | TOOL-23 | Achievement rarity pages | 3 | 4 | 4 | 2 | 2 | 2 | 3 | 3 | 25.50 | LATER Q1 | C26 follow-up |
| 45 | TOOL-24 | Easiest platinum / 100% list | 3 | 4 | 4 | 2 | 2 | 2 | 3 | 3 | 25.50 | LATER Q2 | — |
| 46 | TOOL-42 | Embeddable release countdown widget | 5 | 2 | 2 | 2 | 1 | 2 | 3 | 5 | 25.50 | LATER Q1 | — |
| 47 | TOOL-32 | Crossplay and cross-save table | 3 | 5 | 5 | 2 | 1 | 2 | 2 | 3 | 25.25 | LATER Q2 | — |
| 48 | TOOL-25 | Personal completion dashboard across platforms | 3 | 1 | 1 | 2 | 4 | 4 | 3 | 3 | 25.00 | LATER Q2 | — |
| 49 | TOOL-50 | Multiplayer squad finder via Discord | 3 | 1 | 1 | 2 | 4 | 4 | 3 | 3 | 25.00 | LATER Q3 | — |
| 50 | TOOL-49 | Handheld verified list (Deck, Ally, Switch 2) | 3 | 4 | 4 | 2 | 2 | 2 | 2 | 3 | 24.75 | LATER Q2 | — |
| 51 | TOOL-28 | Studio pages with "games at risk" after closures | 3 | 3 | 3 | 4 | 1 | 2 | 4 | 3 | 24.25 | LATER Q2 | — |
| 52 | TOOL-45 | Review-score vs sales tracker | 3 | 3 | 3 | 4 | 1 | 2 | 4 | 3 | 24.25 | LATER Q2 | — |
| 53 | TOOL-30 | Physical vs digital status per game | 3 | 3 | 3 | 2 | 1 | 2 | 3 | 3 | 22.00 | LATER Q3 | — |
| 54 | TOOL-54 | Collector's edition and pre-order tracker | 3 | 3 | 3 | 2 | 1 | 2 | 3 | 3 | 22.00 | LATER Q3 | — |
| 55 | TOOL-55 | Accessibility settings database | 2 | 3 | 3 | 2 | 1 | 2 | 3 | 2 | 19.25 | LATER Q3 | — |

TOOL-12 and TOOL-13 ship as one product (C08). TOOL-16 ships as a section of the ledger (C07a). TOOL-31 ships inside the `/switch-2` hub.

---

## 3. Roadmap

### 3.1 NOW — ship by Sat 31 Oct

| Ship date | Tool | Campaign | Owner | DEV h |
|---|---|---|---|---|
| Wed 30 Sep, then weekly | Weekly poll with results (TOOL-37) | C39 | SC | 0 |
| Thu 1 Oct | GTA 6 editions and price table (TOOL-16) | C07a | ED | 0 |
| Thu 1 Oct, then weekly | Hidden Gem Thursday (TOOL-34) | C64 | ED | 0 |
| Mon 28 Sep, then daily | On-this-day card (TOOL-35) | C65 | SC, DS | 0 |
| Tue 29 Sep, then weekly | Steam Movers (TOOL-27) | F13 | ED | 0 |
| Thu 1 Oct (club nights 15 and 29 Oct) | Monthly game club (TOOL-39) | C38 | SC, EIC | 0 |
| Mon 5 Oct | WoW Analyzer re-aim (TOOL-17) | C13 | DEV, ED | 3 |
| Wed 7 Oct | Release congestion chart (TOOL-26) | C20 | EIC, DEV | counted in the PR plan |
| Wed 14 Oct | GTA 6 release-time tool + reminder (TOOL-12/13) | C08 | DEV, ED | 16 + 3 |
| Wed 14 Oct | Studios-closed tracker (TOOL-29) | C22 | ED | 2 |
| Fri 16 Oct | Next Fest demo tracker (TOOL-48) | C18 | ED | 0 |
| Mon 19 Oct | Release-day alerts by email and Discord DM (TOOL-07) | C43 | DEV | counted in the email/product plan (D-013) |
| Tue 20 Oct | Steam Curator page (TOOL-43) | C69 | ED | 0 |
| Wed 21 Oct | GTA 6 vehicle real-world view (TOOL-15) | C12 | ED, DEV | 2 |
| Mon 26 Oct | Switch 2 edition and upgrade tracker (TOOL-31) | C61 | ED | inside D-032 |

### 3.2 NEXT — November and December

| Ship date | Tool | Campaign | Owner | DEV h |
|---|---|---|---|---|
| Fri 30 Oct | Gamer DNA share card (TOOL-02) | feeds C28 | DEV | 6 |
| Wed 18 Nov | Prediction league v1, forum polls (TOOL-38) | C29 | SC | 0 |
| Thu 19 Nov | GTA 6 map progress tracker (TOOL-14) | C11 | DEV, ED | 24 |
| Mon 16 Nov (live), Fri 20 Nov (campaign) | Wishlist price-drop alerts (TOOL-06) | C31 | DEV | 16 |
| Fri 20 Nov | Sale picks from your wishlist (TOOL-47) | C31, C32, C34 | DEV, ED | 6 |
| Mon 23 Nov | "My library is worth $X" card (TOOL-03) | C31 | DEV | 6 |
| Mon 14 Dec | Your 2026 in Games (TOOL-01) | C28 | DEV, DS | 32 |
| Tue 1 Dec (if capacity) | Share-my-wishlist gift link (TOOL-53) | C33 | DEV | 4 |
| Mon 21 Dec (if capacity) | ICS calendar export (TOOL-08) | C70 | DEV | 6 |
| Mon 21 Dec (if capacity) | Taste Match invite link (TOOL-05) | C28 | DEV | 6 |

If DEV falls behind, cut in this order: TOOL-05, TOOL-08, TOOL-53, then TOOL-03. Never cut TOOL-14 (GTA launch) or TOOL-06 (Black Friday).

### 3.3 LATER — 2027

| Quarter | Tools | Hook |
|---|---|---|
| Q1 (January) | Backlog Advisor public quiz (TOOL-19, D-037), public Steam library calculator (TOOL-04, D-037), backlog time calculator (TOOL-22, needs IGDB time-to-beat terms check [R14 #42, #57]) | New Year backlog resolutions; C27 State of the Catalogue (12 Jan) |
| Q1 | WoW weekly checklist (TOOL-18), Discord `/game` and `/remind` (TOOL-40), daily guessing game (TOOL-36), Game Pass / PS Plus tracker (TOOL-10), "where to play" block (TOOL-09), "games like" pages (TOOL-20), series-order tool view (TOOL-21), file size and pre-load table for Fable and FF7 Revelation (TOOL-33), embeddable countdown widget (TOOL-42), monthly data report (TOOL-44), achievement rarity pages (TOOL-23, after C26) | Evercold (Jan), Fable (23 Feb), Next Fest (22 Feb), FF7 Revelation (8 Apr) |
| Q2 | Can I run it (TOOL-11), price history (TOOL-46), crossplay table (TOOL-32), handheld list (TOOL-49), easiest platinum list (TOOL-24), embeddable "currently playing" badge (TOOL-41), friends playing now (TOOL-51), completion goals (TOOL-52), completion dashboard (TOOL-25), studio "games at risk" (TOOL-28), review score vs sales (TOOL-45) | Needs new data sources or a bigger member base |
| Q3 | Squad finder (TOOL-50), physical vs digital status (TOOL-30), collector's edition tracker (TOOL-54), accessibility database (TOOL-55) | Data collection or moderation load too high for 2026 |

---

## 4. Specs for NOW and NEXT tools

Format for each: user story · data · UX copy (exact) · share card · SEO page · dev item · launch plan · KPI.

### 4.1 NOW

#### N1. GTA 6 release-time tool + reminder (TOOL-12 + TOOL-13) — C08, D-018, live Wed 14 Oct
- **User story:** "I'm buying GTA VI and I live outside the US. Tell me when it unlocks where I am, and tell me again on the day."
- **Data:** release date constant (single source, D-017). New Filament table `release_times` (game_id, platform, region, unlock_at in UTC, preload_at, size_gb, source_url, checked_at) filled by ED **only from Rockstar, PlayStation or Xbox**. Visitor time zone from the browser.
- **UX copy:** H1 "GTA 6 release time: when it unlocks where you are". State A lead: "GTA VI comes out on Thursday 19 November 2026 on PS5 and Xbox Series X|S. Rockstar hasn't published unlock times yet. When it does, this page shows them in your time zone ({tz}), with the source." State B row: "{Platform}, {region}: unlocks {local date and time} ({tz}). Pre-load from {date}. Download size {n} GB. Source: {link}, checked {time}." State C: "Unlocked in {region} at {local time}." State D: "Rockstar has moved GTA VI to {date}. Your reminder moves with it." Buttons "Remind me on launch day" / "Email me instead".
- **Share card (D-018a):** 1200×630, state B only: "GTA VI unlocks at {time} on {date} · {time zone}". State A: "GTA VI · 19 November · Unlock times not published yet".
- **SEO page:** `/gta6/release-time`; title "GTA 6 Release Time: When It Unlocks in Your Time Zone"; state text server-rendered; FAQPage with three questions (release date, unlock time, pre-load); linked from `/gta6`, the ledger and `/games/grand-theft-auto-vi`.
- **Dev:** D-018 (M, about 16 h), D-018a share card (3 h). Events `tool_run` (tool=release-time), `reminder_set`, `share_card_generated`.
- **Launch plan:** countdown day 36 post (14 Oct); GTA briefing #2 (15 Oct); Discord #gta6 pin; landing for the C58 Reddit test (9–25 Nov); full channel plan in 19-GTA6.md §5.1 and §8.
- **KPI:** `reminder_set` ÷ `tool_run` ≥ 6% (TARGET).
- **Reuse in 2027:** the same table and component power release-time pages for Fable (23 Feb) and FF7 Revelation (8 Apr).

#### N2. WoW Analyzer, re-aimed (TOOL-17) — C13, D-040, Mon 5 Oct
- **User story:** "A new patch is out. Is my character ready, and what's missing?"
- **Data:** existing `POST /wow/analyze` (Blizzard API + Raider.IO + Groq), stored analyses, public leaderboard and shareable analysis pages [R01 B.7].
- **UX copy:** title "WoW Character Analyzer: current patch readiness check". H1 "Is your character ready for this patch?" Sub "Enter a name and realm. It reads Blizzard's and Raider.IO's data for gear, Mythic+ rating and raid progress, and names the gaps. No account needed." Remove "50K+ players analyzed · 4.9/5 rating" and "Midnight launches March 2, 2026". Result footer: "Save this character to your TechPlay profile" (Battle.net sign-in).
- **Share card:** "{Character} · {realm} · readiness {score}/100 · checked {date}" on the existing analysis page OG.
- **SEO page:** `/wow-analyzer`; FAQPage stays, answers updated; OG replaced by a 1200×630 JPEG under 300 KB.
- **Dev:** D-040 (XS; about 3 h including the Groq prompt's date constant in `GroqService.php`).
- **Launch plan:** patch-day checklist article (5 Oct), F15 every Tuesday, `#wow` in Discord, one r/wow helpful answer a week, `/mmo` hub from 10 Nov (20-GAME-HUBS.md §3).
- **KPI:** runs up week over week to 2 Nov; runs → Battle.net accounts ≥ 3%.

#### N3. Release-day alerts outside the site (TOOL-07) — C43, D-013, Mon 19 Oct
- **User story:** "I pressed Remind me. I want the reminder where I'll see it, not in a bell on a site I haven't opened."
- **Data:** existing `notify_on_release` flag, `SendReleaseReminders` and `wishlist:check-releases` (daily 09:00); both database-only today [R01 B.2.10].
- **UX copy:** Settings toggle "Release reminders: by email (on) · Discord DM (on if Discord is linked)". Email subject "{Game} is out today on {platforms}". Body "You asked us to remind you. {Game} is out today on {platforms}. [Open the game page] · Turn off release reminders in Settings." Discord DM from Buffy: "{Game} is out today on {platforms}. You set this reminder on TechPlay: {link}".
- **Share card:** none (private).
- **SEO page:** none; improves the conversion of every "Remind me" button (calendar, game pages, hubs).
- **Dev:** D-013 (M; counted in the email/product plan). Dedup the two reminder paths so one person gets one message per game [R01 B.12 #11].
- **Launch plan:** release note in The Save File (23 Oct); calendar toast copy changes from "Sign in to track releases." to "Sign in and we'll email you on release day."
- **KPI:** `reminder_delivered` → `alert_clicked` rate; unsubscribes < 0.5% per send.

#### N4. Weekly poll with results (TOOL-37) — C39, from Wed 30 Sep
- **User story:** "I want to say what I think in one tap and see where everyone else landed."
- **Data:** existing forum `ThreadPoll`; Discord native polls; no new code.
- **UX copy (first poll, Wed 30 Sep):** "Sony plans to stop making PlayStation discs. How do you buy your games now? Mostly on disc · Mostly digital · About half and half". Results thread title "Poll: disc or digital? Results and your comments". Next polls follow the week's news [R06].
- **Share card:** DS template 1080×1350 with the result bars and "Voted on TechPlay and our Discord, {n} votes" (n from the forum poll API).
- **SEO page:** the forum thread (indexable, DiscussionForumPosting).
- **Dev:** none.
- **Launch plan:** Discord poll + forum poll + X/Threads/Bluesky poll + IG Story poll, every Wednesday; results post Friday links the forum thread.
- **KPI:** forum poll votes from signed-in members per week; `comment_created` in the thread.

#### N5. Monthly game club (TOOL-39) — C38, from Thu 1 Oct
- **User story:** "I want a reason to finish a game and people to talk to about it."
- **Data:** forum + Discord; no new code.
- **UX copy:** October: "Game Club: Control Resonant. Play at your pace; we talk on Thursday 15 and Thursday 29 October at 20:00 CET in Discord." November: GTA VI (19-GTA6.md §9.5). December: member vote (poll on 1 Dec).
- **Share card:** DS template "Game Club · {game} · {month}".
- **SEO page:** one forum thread per month, spoiler-tagged.
- **Dev:** none. **Launch plan:** Discord event per night; X post on the 1st; F11 Monday check-in mentions it.
- **KPI:** attendees per club night; posts in the monthly thread.

#### N6. Next Fest demo tracker (TOOL-48) — C18, Fri 16 Oct
- **User story:** "Next Fest has thousands of demos. Which twenty should I try first, and will you remind me when they come out?"
- **Data:** a public tier list owned by the TechPlay staff account (`/lists/{staff}/steam-next-fest-october-2026`) with tiers "Play now", "Wishlist", "Skip"; each game links its game page with Remind me. Participant list captured during the fest for R14 #37 (a 2027 PR piece).
- **UX copy:** list title "Steam Next Fest October 2026: our demo tracker". Description "Twenty demos we'd try first, updated each day of the fest (19–26 October) as we play them. Tap any game to get a reminder when the full version is out."
- **Share card:** existing `/og/list` tier-board image.
- **SEO page:** the list page plus `/news/steam-next-fest-october-2026-demos`.
- **Dev:** none. **Launch plan:** 20-GAME-HUBS.md §4.3 items 4–6; F23 Next Fest Diary; C71 studio outreach.
- **KPI:** `reminder_set` and `shelf_add` (wishlist) from the list: 60 by 27 Oct (TARGET).

#### N7. Steam Movers (TOOL-27) — F13, every Tuesday from 29 Sep
- **User story:** "What's suddenly being played on Steam this week, and why?"
- **Data:** Steam's public weekly most-played chart (the charts API the research read [R05]); ED copies ranks and peaks into a table; no script in 2026.
- **UX copy:** title "Steam Movers, week {nn}: {biggest climber} jumps from {rank} to {rank}". Table columns: game, rank this week, last week, peak players, one-line reason (patch, DLC, sale) with a link.
- **Share card:** DS 1200×675 "Up this week on Steam" with three rows; "Source: Steam charts".
- **SEO page:** `/news/steam-movers-2026-w{nn}`; archived weekly; linked from `/steam`.
- **Dev:** none now; a charts script is LATER. **Launch plan:** X/Threads/Bluesky Tuesday; Discord `#steam-deals`; r/Steam comment where a thread asks about player counts.
- **KPI:** Search Console impressions for "{game} player count" terms; weekly shipped (process).

#### N8. On-this-day card (TOOL-35) — C65, daily from Mon 28 Sep
- **User story:** "Remind me what came out today years ago."
- **Data:** existing `/games/on-this-day` endpoint [R01 B.5].
- **UX copy:** "On this day in {year}: {game} came out on {platform}. {one line from the game page}. Played it? Add it to your shelf." Discord post by SC (Buffy automation later, C65).
- **Share card:** DS template 1080×1080 "On this day · {date} · {year}" with the cover.
- **SEO page:** the game page (no new page in 2026).
- **Dev:** none now; an OG route is LATER.
- **Launch plan:** Discord #general 10:00 CET; X and Threads; Facebook Page.
- **KPI:** `shelf_add` from on-this-day links (UTM `f06-onthisday`).

#### N9. GTA 6 vehicle real-world view (TOOL-15) — C12, Wed 21 Oct
- **User story:** "Which real car is that in the trailer?"
- **Data:** 121 catalogued names from image filenames (unverified); ED's sourcing sheet fills `vehicle_class`, `real_equivalent`, source URL and basis (19-GTA6.md §5.3).
- **UX copy:** section heading "Real-world view". Intro "Rockstar doesn't license real cars, so every match below is our reading of the footage, with the timestamp or screenshot it comes from. Rows without a source aren't matched yet." Row: "{Name} · {class} · closest real-world match: {model} (our reading) · shown at {source}".
- **Share card:** 1080×1350 carousel frames "In GTA VI: {name} · Looks like: {model} · Source: {trailer, time}".
- **SEO page:** `/gta6/vehicles` (query "gta 6 cars real life", R17 #14).
- **Dev:** 2 h (server-rendered table with class filter).
- **Launch plan:** countdown days 29, 24, 22, 17; F03 carousel; GTA briefing #3.
- **KPI:** Search Console impressions for query #14; share of rows with sources (TARGET 60 by 21 Oct).

#### N10. Studios closed in 2026 tracker (TOOL-29) — C22, Wed 14 Oct, updated weekly
- **User story:** "Which studios closed this year, and what happens to their games?"
- **Data:** editorial list (studio, owner, date, what happened, affected games, source), linking `/studios/{slug}` and game pages; the database has no closure field [R14 §2].
- **UX copy:** H1 "Studios closed in 2026: the running list". Standfirst "Every closure, shutdown path and sale we can source, with the games each studio made. Updated every Wednesday." Row example (only when sourced): "Ninja Theory · Xbox · heading to closure (reported) · source".
- **Share card:** 1200×675 "Studios closed in 2026: {n} so far · Source: TechPlay".
- **SEO page:** `/data/studios-closed-2026`.
- **Dev:** 2 h (page template reusing the data-page layout).
- **Launch plan:** F17 Studio Watch Wednesdays; LinkedIn (Thursday); Bluesky; C48 Reddit data post when warranted.
- **KPI:** referring domains to the page (baseline needed [R14 gaps]).

#### N11. Hidden Gem Thursday (TOOL-34) — C64, weekly from Thu 1 Oct
- **User story:** "Show me something good nobody's talking about."
- **Data:** existing `/games/hidden-gems` endpoint (daily); ED picks one and checks that the rating has a meaningful sample.
- **UX copy:** "Hidden Gem Thursday: {game} ({year}). {two sentences on why}. On {platforms}. Add it to your shelf."
- **Share card:** DS 1080×1350 cover + "Hidden gem" label.
- **SEO page:** the game page gets the editor's note (that is 1 of the 0.7% of game pages with our own words [R03]).
- **Dev:** none now; ranked `/games/hidden-gems` page LATER. **Launch plan:** F05 channels; r/patientgamers only as an answer to a request.
- **KPI:** `shelf_add` on featured games.

#### N12. Release congestion chart (TOOL-26) — C20, Wed 7 Oct
- **User story (journalist):** "Is this autumn really more crowded than usual? I need a number I can cite."
- **Data:** `games.release_date` with `release_precision = day`, split into all releases and "notable" (critic score or ≥ 2 store links), ISO weeks 2010–2026 [R14 #1].
- **UX copy:** H1 "Release congestion 2026: how crowded each week is". Method block above the fold; CSV download; "Cite as: TechPlay Games Database, {n} titles, pulled {date}".
- **Share card:** heatmap 1200×675 with the source printed on it.
- **SEO page:** `/data/release-congestion-2026` (one permanent URL, updated in place).
- **Dev:** query and page counted in the PR plan (C20).
- **Launch plan:** C48 Reddit data post; direct pitches; X/Bluesky chart.
- **KPI:** referring domains; citations.

#### N13. Switch 2 edition and upgrade tracker (TOOL-31) — C61, Mon 26 Oct
- **User story:** "Is there a Switch 2 upgrade for my game, and what does it cost?"
- **Data and copy:** 20-GAME-HUBS.md §5.3 and §9.1.
- **Share card:** carousel "Every Switch 2 upgrade this autumn, with prices".
- **SEO page:** `/switch-2#tracker`. **Dev:** inside D-032.
- **KPI:** tracker updated 10 of 10 Tuesdays; `reminder_set` from tiles.

#### N14. GTA 6 editions and price table (TOOL-16) — C07a, Thu 1 Oct
- **User story:** "Which edition should I buy, and what does the $400 box actually contain?"
- **Data:** G04 ($79.99 / $99.99 Ultimate), G07 (pre-order bonus), G10 (collector's set about $400, no game) [R17]. Regional prices only where the official store shows them; none are listed in the research, so the table is US-only at launch.
- **UX copy:** heading "GTA 6 editions and prices". Rows: "Standard · $79.99 · the game" / "Ultimate Edition · $99.99 · {contents as Rockstar lists them}" / "The Goodtime State – Vice City Collection · about $400 · collector's items, **no game**". Note: "Pre-order bonus: Vintage Vice City Pack. Prices in US dollars from Rockstar and the platform stores; last checked {date}."
- **Share card:** F03-style card "GTA VI: $79.99, $99.99, and a $400 box without the game".
- **SEO page:** `/gta6/everything-we-know#editions` (queries 16–19).
- **Dev:** none. **KPI:** impressions for "gta 6 price".

#### N15. Steam Curator page (TOOL-43) — C69, Tue 20 Oct
- **User story (developer):** "Is there a curator who'll actually look at my game?" **(Player):** "Recommendations inside Steam from people who explain them."
- **Data:** TechPlay reviews, Verdicts (C52) and Hidden Gems; Steam Curator Connect for review copies [R10].
- **UX copy:** curator description "TechPlay.gg: independent reviews and hidden gems from Sarajevo. Every recommendation links to the full piece." Recommendation text: one sentence + "Full verdict on TechPlay.gg".
- **Share card:** none. **SEO page:** none (off-site); each recommendation links the game page.
- **Dev:** none. **Launch plan:** 10 recommendations at launch, one a week after; link from `/steam`.
- **KPI:** curator followers (Steam-reported), review keys received.

### 4.2 NEXT

#### X1. GTA 6 map progress tracker (TOOL-14) — C11, D-018b, Thu 19 Nov
- **User story:** "I want to tick off the places I've found in Leonida, and see how much is left."
- **Data:** existing `GtaLocation` (1,058 pins, `is_unconfirmed`, categories); new `user_gta_locations` (user_id, location_id, status visited/found, updated_at); new per-pin `verified_in_game` flag set by ED after launch. Only runs if D-020 allows the data (19-GTA6.md §4.1).
- **UX copy:** toggle "Tracker mode". Pin popup: "{name} · {region} · Been here" (signed in) / "Sign in to save your progress" (guest). Progress bar "{n} of {total} places in {region}". Unverified pins: "Pre-launch identification; not yet checked in game."
- **Share card:** "I've found {n} places in {region} · techplay.gg/gta6/map".
- **SEO page:** `/gta6/map` (queries 4, 5, 34).
- **Dev:** about 24 h, 2–18 Nov; feature flag switched on at 08:30 CET on 19 Nov.
- **Launch plan:** 19-GTA6.md §8.2 and §10.1.
- **KPI:** 100 accounts with ≥ 5 places marked by 31 Dec (TARGET).

#### X2. Wishlist price-drop alerts (TOOL-06) — C31, D-027, live Mon 16 Nov, campaign Fri 20 Nov
- **User story:** "Tell me when a game on my wishlist drops below a price I'd pay."
- **Data:** extend the nightly `RefreshShelfPrices` (Steam US, owned games only today; 1,017 games priced [R01 B.2.15]) to wishlisted Steam games; GOG later. No scraping of SteamDB or ITAD; ITAD's API needs attribution and forbids competing apps [R14 §1.2].
- **UX copy:** wishlist row "Alert me when it's under ${x}" (default: any discount). Email subject "{Game} is {discount}% off: ${price} on Steam". Body "It's on your TechPlay wishlist. Steam price now ${price} (was ${full}). Sale ends {date if Steam shows it}. [Open on Steam] [Stop alerts for this game]".
- **Share card:** none (private). **SEO page:** none.
- **Dev:** D-027 (M, about 16 h, 26 Oct–16 Nov).
- **Launch plan:** C31 Black Friday Wishlist Price Alerts (20 Nov–1 Dec); The Save File; `/steam` CTA "Import your Steam wishlist and get alerts".
- **KPI:** `alert_clicked` ÷ alerts sent; wishlist adds in November.

#### X3. Sale picks from your wishlist (TOOL-47) — C31, C32, C34, D-027a, Fri 20 Nov
- **User story:** "In a sale, show me what's discounted from the list I already made."
- **Data:** D-027 prices × the member's wishlist and shelves (excludes owned games).
- **UX copy:** block on `/steam` and sale articles: "On sale from your wishlist: {n} games" (signed in) / "Import your Steam library and this list shows only what you don't own" (guest).
- **Share card:** none. **SEO page:** sale articles (20-GAME-HUBS.md §4.3).
- **Dev:** about 6 h after D-027. **Launch plan:** Black Friday (27 Nov), Cyber Monday (30 Nov), Winter Sale (17 Dec).
- **KPI:** clicks from the block to Steam; Steam imports during sale weeks.

#### X4. Game Awards prediction league v1 (TOOL-38) — C29, Wed 18 Nov – Thu 10 Dec
- **User story:** "I want to call the winners before the show and see how I did against everyone."
- **Data:** one forum thread with one `ThreadPoll` per category (nominee lists once The Game Awards publishes them, expected mid-November [R05]); SC scores entries in a sheet; leaderboard posted after the show. D-026 (a proper league) moves to 2027.
- **UX copy:** thread title "The Game Awards 2026 prediction league: pick your winners". Rules "One vote per category, signed-in members only, votes lock at 00:00 CET on 10 December. One point per correct pick. Ties share the place." Results post "Prediction league results: {top three usernames} called {n} of {m}."
- **Share card:** DS template "I called {n} of {m} at The Game Awards" (made by SC for the top ten, with consent).
- **SEO page:** the forum thread. **Dev:** none.
- **Launch plan:** Discord event for the show (F20 Showcase Live, 10 Dec); X; The Save File 20 Nov and 4 Dec.
- **KPI:** members who vote in ≥ 5 categories (TARGET 50); `registration_complete` with from=prediction-league.

#### X5. Gamer DNA share card (TOOL-02) — D-024, Fri 30 Oct
- **User story:** "Show me what kind of player I am, in a picture I'd post."
- **Data:** existing `GamerDnaService` (three taste axes, eras, signature games); percentiles only above 50 scored profiles, so v1 shows axes, not rankings [R01 B.2.16].
- **UX copy:** profile button "Share my Gamer DNA". Card text "{username}'s Gamer DNA: {axis 1 label} · {axis 2 label} · {axis 3 label} · signature game: {game}".
- **Share card:** `/og/dna?username=` 1200×630, same pattern as `/og/profile`.
- **SEO page:** none (profiles). **Dev:** about 6 h.
- **Launch plan:** F19 Library Card (Fridays, opt-in); prompt after library import; feeds C28.
- **KPI:** `share_card_generated` (type=dna).

#### X6. "My library is worth $X" card (TOOL-03) — D-024a, Mon 23 Nov
- **User story:** "What's my Steam library worth at today's prices?"
- **Data:** `ProfileService::shelfWorth()` full vs on-sale totals and unpriced count; Steam US prices only [R01 B.2.15]. The card says so.
- **UX copy:** "{username}'s Steam library: {n} games, ${full} at full price today ({unpriced} not priced). Prices: Steam US, {date}."
- **Share card:** `/og/worth?username=` 1200×630.
- **SEO page:** none in 2026 (the public calculator is TOOL-04, 2027). **Dev:** about 6 h.
- **Launch plan:** Black Friday week; r/Steam only in reply to "what's your library worth" threads; The Save File.
- **KPI:** `share_card_generated` (type=worth); Steam imports in the week.

#### X7. Your 2026 in Games (TOOL-01) — C28, D-025, build by Thu 10 Dec, live Mon 14–Thu 31 Dec
- **User story:** "Show me my year across Steam, PlayStation, Xbox, GOG and Epic in one place." Steam Replay, Xbox Year in Review and PlayStation Wrap-Up each cover one platform [R10].
- **Data:** imports and playtime, shelf statuses, completions, ratings, journal sessions; 2026 only. Works with one platform; says what's missing ("Link Xbox to add your Xbox year").
- **UX copy:** "Your 2026 in games. {hours} hours across {n} games on {platforms}. Most played: {game}. Finished: {n}. The one you dropped: {game}." End screen "Share your year" · "Link another platform".
- **Share card:** five 1080×1920 story frames + one 1200×630 summary; DS templates by 30 Nov.
- **SEO page:** `/year-in-review` (landing explains it; the personal pages are noindex).
- **Dev:** D-025 (L, about 32 h, 30 Nov–10 Dec).
- **Launch plan:** C28 campaign; C57 Meta December flight (18+, only if D-031 is live); GTA pool B invitation (19-GTA6.md §9.11).
- **KPI:** `share_card_generated` (type=yir); `library_connected` during 14–31 Dec.

#### X8. Share-my-wishlist gift link (TOOL-53) — C33, D-024b, Tue 1 Dec (if capacity)
- **User story:** "My family asks what I want. Send them one link."
- **Data:** wishlist shelf; profile visibility respected (public or friends).
- **UX copy:** wishlist tab button "Share my wishlist as a gift list". Page title "{username}'s gift list". Line "Games {username} wants, with where to buy them. Prices change; check before you buy."
- **Share card:** "{username}'s gift list · {n} games".
- **SEO page:** noindex (personal). **Dev:** about 4 h.
- **Launch plan:** C33 Gift Guide from Wishlists (1–20 Dec).
- **KPI:** gift-list page views from outside the site; registrations from gift-list visitors.

#### X9. ICS calendar export (TOOL-08) — D-036, Mon 21 Dec (if capacity)
- **User story:** "Put the releases I care about in my own calendar."
- **Data:** member's wishlist and reminders with release dates; a tokenised private ICS feed.
- **UX copy:** Settings: "Add your release dates to Google Calendar, Apple Calendar or Outlook. The feed updates when dates change." Button "Copy calendar link".
- **Share card:** none. **SEO page:** none. **Dev:** about 6 h.
- **Launch plan:** C70 "2027 Most Anticipated" (21–31 Dec): "Add all of them to your calendar."
- **KPI:** feeds created; `reminder_set` in the same session.

#### X10. Taste Match invite link (TOOL-05) — D-024c, Mon 21 Dec (if capacity)
- **User story:** "Compare my taste with a friend who isn't on TechPlay yet."
- **Data:** `TasteMatchService` (50% genres, 30% library overlap, 20% platforms; needs ≥ 3 games each) [R01 B.2.16].
- **UX copy:** profile button "Compare with a friend". Invite page "{username} wants to compare taste in games. Link Steam or add three games and you'll see your match." Result "You and {username}: {n}% match. You both play {genre}; you split on {genre}."
- **Share card:** "{a} × {b}: {n}% match".
- **SEO page:** none. **Dev:** about 6 h.
- **Launch plan:** Year in Review end screen; Discord `/match` already exists.
- **KPI:** `registration_complete` with from=taste-invite.

---

## 5. DEV load for tools (hours per week, ESTIMATE)

| Week of | Tool work | Tool DEV h | Of which already counted in 19-GTA6.md |
|---|---|---|---|
| 28 Sep | D-040 (3), C08 start (4) | 7 | 4 |
| 5 Oct | C08 (6) | 6 | 6 |
| 12 Oct | C08 finish + share card (9), C22 page (2) | 11 | 9 |
| 19 Oct | C12 table (2) | 2 | 2 |
| 26 Oct | D-024 DNA card (6), D-027 start (6) | 12 | 0 |
| 2 Nov | C11 (8), D-027 (6) | 14 | 8 |
| 9 Nov | C11 (12), D-027 (4) | 16 | 12 |
| 16 Nov | C11 launch fixes (4) | 4 | 4 |
| 23 Nov | TOOL-47 (6), D-024a worth card (6) | 12 | 0 |
| 30 Nov | D-025 (14), TOOL-53 (4, if capacity) | 18 | 0 |
| 7 Dec | D-025 (14) | 14 | 0 |
| 14 Dec | D-025 fixes (4) | 4 | 0 |
| 21 Dec | D-036 (6), TOOL-05 (6), both if capacity | 12 | 0 |

The week of 30 Nov leaves DEV only 2 h for everything else, and the week of 7 Dec 6 h; EIC decides by 20 Nov whether Year in Review keeps that slot or the "if capacity" items drop. C20 and C43 DEV hours sit in the PR and email plans. D-019 web push (live 9 Nov) and D-031 pixel (before 2 Nov) are not tool work but compete for the same weeks.

---

## Dependencies and open questions

**Dependencies**
- D-017 (single GTA date constant) before N1; D-020 before X1; C12 sourcing sheet before N9.
- D-013 mail channel before N3 and X2; deliverability guardrails from the email plan (complaints < 0.1%, unsubscribes < 0.5%).
- D-016 guest modal and D-014 redirect-back for every "Remind me" and "Save" button.
- D-007 events (`tool_run`, `reminder_set`, `share_card_generated`) before any tool KPI can be read.
- D-031 (consent-gated pixel) before X7 is promoted with paid media.
- D-032 hub template for N13.

**Open questions**
1. Steam Web API and storefront terms for nightly price pulls on wishlisted games (R14 lists them as unverified) before X2 scales past owned games.
2. IGDB licence position for a commercial site (R23 #16) before TOOL-22 uses time-to-beat data in 2027.
3. Whether the backend credits giveaway referrals end to end (R01 A.10 #5): matters if X10's invite pattern is reused for referrals.
4. Nominee announcement date for The Game Awards 2026 (expected mid-November, not dated in research [R05]); X4 opens when it's published.
5. Which staff account owns editorial lists (N6, hubs) so they read as TechPlay's, not a person's.
6. Scoring note for the planning spine: R21's tool scores reward cheap items; this file re-weights toward retention and registration. Where the two disagree (e.g. TOOL-19 ranks 33 in R21 and 29 here), dates and DEV capacity, not the score, set the bucket.
