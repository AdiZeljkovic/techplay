# 21 — Gaming Tools Roadmap (Part 24)

Status: Phase 2 plan — 27 Sep 2026

- **55 tool ideas scored** from R10 (and the matching TOOL rows in `opportunities.json`) on eight criteria, 1–5, all ESTIMATE, weighted toward what a 20-hour-a-week developer can ship and what brings members back (the North Star is Weekly Returning Members [spine §3]).
- **NOW, by 31 Oct (15 items):** the GTA 6 release-time tool with reminder (C08), the WoW Analyzer re-aim (C13), release-day alerts outside the site (C43), and twelve tools that are mostly editorial templates on data TechPlay already has: weekly poll, game club, Next Fest tracker, Steam movers, on-this-day card, GTA vehicle real-world view, GTA editions table, studios-closed tracker, hidden gems, release congestion chart, Switch 2 upgrade tracker, Steam Curator page.
- **NEXT, Nov–Dec (10 items):** GTA 6 map progress tracker (C11), wishlist price-drop alerts and sale picks from your wishlist (C31), a no-code Game Awards prediction league (C29), Gamer DNA and "library worth" share cards, Your 2026 in Games (C28). Three are "if capacity": wishlist gift link, ICS export, Taste Match invite link.
- **LATER, 2027 (29 items)** by quarter; January carries the backlog tools (public Backlog Advisor quiz, Steam calculator, backlog time calculator) because New Year backlog resolutions are their natural hook [R14 #22, #57].
- **Dates beat scores.** The score ranks value per hour; the bucket follows the campaign calendar. A lower-scoring tool with a fixed date (Next Fest, Black Friday, The Game Awards) goes before a higher-scoring one without.
- **DEV is the constraint.** Tool work takes 2–16 h of DEV's 20 h in any week (§5). The prediction league runs on existing forum polls to save about 16 DEV hours in November.
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
| Thu 1 Oct (first club night 8 Oct) | Monthly game club (TOOL-39) | C38 | SC, EIC | 0 |
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

