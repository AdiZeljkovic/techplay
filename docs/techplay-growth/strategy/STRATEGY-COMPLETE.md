# STRATEGY COMPLETE — TechPlay Q4 2026

Status: Phase 2 plan — 27 Sep 2026
Scope: the one-page answer to "what does TechPlay do next?" Everything here points into the files listed in 00-STRATEGY-INDEX. Execution runs Mon 28 Sep 2026 to Thu 31 Dec 2026.

## Summary

- **The plan is built.** 34 strategy files, a daily calendar with a row for each of the 95 days, 71 campaigns with copy, 96 experiments, 27 KPIs, 43 channels and a 95-entry dev backlog.
- **The first three weeks are repair, not promotion.** False numbers come off the site, dead links get fixed, giveaways become fair, and measurement gets built. Promotion that points at broken pages wastes the traffic it earns.
- **The North Star is Weekly Returning Members (WRM):** members who did something meaningful in the last seven days. Activation means linking a platform or putting at least 3 games on the shelf within 7 days (A2).
- **DEV time is the binding constraint.** The campaigns asked for about 257 DEV hours in October against about 100 available. 32 re-sequenced the work: every P0 fix lands by 1 Nov, and several features move to January 2027 with a manual interim.
- **GTA VI (19 Nov) is the registration moment of the year.** The plan wins the narrow, useful queries: release time, the confirmed-vs-rumour ledger, and a map progress tracker. It does not chase "GTA 6 news".
- **Paid is small and late on purpose.** No spend before 2 Nov, and none without working measurement. Meta is out for 2026 by default unless the Editor-in-Chief chooses otherwise on 5 Oct.

## 1. Top priorities for Q4 2026

1. **Tell the truth on every page (C01, D-001, D-040).** Remove "15K+ MEMBERS", "50K+ GAMES", "thousands of fans", "4.9/5", "Earn XP for every article you read", "140,000+" and "We test hardware until it breaks". Done by Fri 2 Oct.
2. **Fix the plumbing (C02).** Dead Discord invites, bot giveaway links that 404, breadcrumbs, the GTA 6 page relation, RSS and SearchAction. All by 18 Oct.
3. **Make giveaways fair before promoting any (D-039a, D-039b, D-041).** A plain entry can win, the per-IP limit covers every entry path, and the overdue World of Tanks draw is run in public on 29–30 Sep.
4. **Build the return loops in the order DEV can ship them.**
   - Newsletter landing and the form under every article (W40–W41).
   - Register rewrite that honours `?from=` (W43).
   - Welcome and release-day email (about 6 Nov).
   - Personalised releases email (23 Nov) and price alerts (25 Nov).
   - Guest "Remind me" in a lite version (18 Dec).
5. **Run the franchise rhythm every week without exception.** F01 Out This Week on Monday, the Save File on Friday, Buffy's Wrap on Sunday, and the GTA countdown daily until 19 Nov.
6. **Publish four data stories only TechPlay can publish.**
   - Release Congestion Index (7 Oct).
   - Studios Closed tracker (14 Oct).
   - World Atlas of Game Studios and the Balkan census (28 Oct).
   - Sequel Gap (4 Nov).
   Two more follow in November: the $80 Tracker (11 Nov) and Best Value Games (23 Nov).
7. **Own GTA VI utility.** Release-time tool (14 Oct), vehicle guide (21 Oct, sourced entries only), launch-night Discord event, and the map tracker live at unlock (19 Nov).
8. **Grow Discord to 400–500 (C36)** with onboarding, weekly rituals and one invite code per campaign.
9. **Restart reviews (C52).** The first Verdict is Gears of War: E-Day on Thu 8 Oct, then weekly, so the OpenCritic application can go in on 14 Dec.
10. **Close the year with shareable things.** Your 2026 in Games (14 Dec), the TGA prediction league on forum polls, and the Community Awards.

## 2. Tomorrow — Monday 28 Sep, exact actions

The full table with "done when" is 33-QUICK-WINS §"NEXT 24 HOURS". In order:

| # | Owner | Time | Action |
|---|---|---|---|
| 1 | EIC | 30 min | Record today's baselines in the KPI sheet: Search Console clicks and indexed pages, GA4 sessions since 20 Sep, users and connected accounts, mailable newsletter subscribers, Discord member count |
| 2 | EIC | 20 min | Filament → Giveaways. Record the GTA 6 giveaway's status, dates, prize, tasks and entries. Find the undrawn World of Tanks draw. Post "live, closes …" or "not live" in the team channel |
| 3 | DEV | 1 h | D-004: replace `discord.gg/techplaygg` in `Gta6NewsletterCTA.tsx:7` and `RoadmapCTA.tsx:17`, and the seeder default, with `https://discord.gg/wPQG9gUMXH`. Fix the YouTube handle to `@techplay_gg` |
| 4 | DEV | 1 h | D-041: bot giveaway links, `/giveaways/{slug}` → `/giveaway/{slug}` in `commands.ts:537` and `SubscriptionService.ts:192`. Deploy with `techplay-deploy.sh` |
| 5 | DEV | 3 h | D-039a/b: base points on entry, and one per-IP guard across `enter()`, `completeTask()` and `claimDailyBonus()`, with feature tests |
| 6 | DEV | 2 h | D-001 first half: the replacement strings in 33-QUICK-WINS for the register, login, GTA 6 newsletter box, WoW Analyzer, home hero and leaderboard |
| 7 | SC | 45 min | Claim TikTok @techplay.gg (fallback @techplaygg) and the Bluesky and Threads handles; turn on 2FA |
| 8 | SC | 15 min | Set `twitter_url` in Filament so X appears in the footer; update the X, YouTube, Instagram and Facebook bios |
| 9 | SC | 40 min | Create and test the first seven Discord invite codes, one per campaign, and log them in the sheet |
| 10 | EIC | 20 min | Send the gtadb.org attribution email (D-020) and the IGDB licence email (24-PARTNERSHIPS M11) |
| 11 | EIC | 15 min | Brief ED on the pillar filter: P1–P5 only, and no general tech, phones, Genshin or rewrites without added value |
| 12 | ED | 90 min | Publish F01 Out This Week #1 at 08:30 CET: Minecraft Dungeons II, the PS Plus October reveal (reported), Ghost of Yōtei Complete Edition (reported), Ace Combat 8 and the Steam Autumn Sale, each linked to its /games page |
| 13 | SC | 25 min | C06 day 52 on X, Threads, Bluesky, Stories and Discord, using 19-GTA6 §6.2 post 1. Open the "What are you playing?" thread (C37) in Discord and the forum |

## 3. The next 7 days (28 Sep – 4 Oct)

| Date | What ships or publishes | Owners |
|---|---|---|
| Mon 28 Sep | Actions in §2; F01 #1; countdown day 52; Reddit rules read for all 18 subreddits, with no links posted | all |
| Tue 29 Sep | Minecraft Dungeons II news; The Last Disc explainer (C66); overdue World of Tanks draw run in public; F08 Where Can I Play It; F15 Readiness Check; D-001 second half; D-040 WoW copy | ED, EIC, DEV, SC |
| Wed 30 Sep | Winner post for the old draw; PS Plus October games; first Poll of the Week (C39: "Do you still buy games on disc?"); F10 on Game Pass Ultimate | ED, SC |
| Thu 1 Oct | Steam Autumn Sale picks (C05, 19:15 CET); GTA 6 Confirmed-or-Rumour ledger relaunch (C07); Hidden Gem #1: Chants of Sennaar | ED |
| Fri 2 Oct | **The Save File #1** at 15:00 CET (C40); Fix It Friday #1 on shader compilation stutter; Ace Combat 8 news; C01 closed with screenshots | SC, EIC, ED |
| Sat 3 Oct | In Order #1: Gears of War (C63); F08 on Gears of War: E-Day platforms | ED |
| Sun 4 Oct | Games Like Gears of War; Buffy's Weekly Wrap at 20:00 CET | ED, SC |

DEV in week 40 works on D-004, D-041, D-039a, D-039b, D-001, D-040, D-002, D-020 and the D-012 newsletter landing, about 18 h in total. If the GTA 6 giveaway is live, it can be promoted once D-039a/b and D-041 are deployed, not before.

## 4. Campaigns launching first

| Campaign | Starts | Why first |
|---|---|---|
| C01 Trust Reset | 28 Sep | Every other campaign links to pages that currently state false numbers |
| C02 Plumbing Sprint | 28 Sep | Dead links and 404s waste any traffic we earn |
| C06 GTA 6 Countdown | 28 Sep | 52 daily posts of sourced facts build the habit before 19 Nov |
| C04 Out This Week | 28 Sep | The weekly piece only TechPlay's calendar makes easy; it feeds social, Discord and the newsletter |
| C37 What Are You Playing? | 28 Sep | Starts the Monday community ritual |
| C35 Discord Rebuild | 28 Sep | Onboarding and channels ready before Road to 500 (C36) on 12 Oct |
| C47 Reddit Reputation | 28 Sep | Accounts need weeks of genuine answers before any data post |
| C66 The Last Disc revival | 29 Sep | A live controversy (Sony and discs) with an existing petition page |
| C39 Poll of the Week | 30 Sep | Low-cost engagement in Discord and on X |
| C05 Autumn Sale picks | 1 Oct | The first seasonal moment (1–8 Oct) |
| C07 GTA 6 ledger | 1 Oct | The sourced answer to "what's confirmed?" |
| C64 Hidden Gem Thursday | 1 Oct | Weekly discovery that adds to shelves |
| C40 The Save File | 2 Oct | The most reliable return trigger we control |
| C63 In Order | 3 Oct | Evergreen search pages |
| C49 Vertical video | 5 Oct | Three verticals a week, one edit per platform |
| C52 Verdict | 8 Oct | Credibility and the OpenCritic run |
| C20 Release Congestion Index | 7 Oct | The first data PR; pitches wait until the ownership article and EIC author page are live |

## 5. Development needed first

Sprint weeks W40–W42, from 32-DEVELOPMENT-BACKLOG:

| Week | Items | Unlocks |
|---|---|---|
| W40 (28 Sep–4 Oct) | D-004 dead invites · D-041 bot giveaway links · D-039a/b giveaway fairness · D-001 false claims · D-040 WoW copy · D-002 breadcrumbs · D-020 map provenance check · D-012 newsletter landing and homepage block | C01, C02, C09, C40 |
| W41 (5–11 Oct) | D-044/D-045 congestion data and page · D-005 GTA 6 page relation · D-017 GTA 6 hub SSR · D-012 article form and source tag | C20, C06, C07, C40 |
| W42 (12–18 Oct) | D-018 release-time tool · D-017 OG images ≤300 KB · D-003 RSS · D-029 hide zero-value modules · D-006 SearchAction | C08, C02 |
| W43–W44 | D-061 · D-033 release-date log · D-007 GA4 events · D-014 register rewrite · D-008 UTM capture · D-042 · D-050 | C44, C03, paid gate, C23 |

**The single lever:** about 10 more DEV hours a week from 12 Oct to 22 Nov (around 60 h in total). That would bring back these features before 2027, in this order:
- Steam sign-in
- the full guest "Remind me"
- the article-end block
- Discord invite attribution
- the Meta pixel

## 6. Primary KPIs

Canonical values are in kpis.json. All are TARGETS, re-based at the Monday reviews on 2 Nov and 7 Dec.

| KPI | Baseline | 31 Oct | 30 Nov | 31 Dec |
|---|---|---|---|---|
| K00 Weekly Returning Members | ESTIMATE ≤10 (run Q-01) | 15–25 | 30–50 | 45–70 |
| K07 New verified registrations | 60 users total (7 Sep) | 40–60 in Oct | 70–120 in Nov | 60–120 in Dec |
| K08 A2 activation (7-day) | 2 of 55 linked a platform (31 Aug) | cohort ≥30% | ≥35% | ≥40%, 100 A2 members |
| K09 Verified newsletter subscribers | UNKNOWN (count on 28 Sep) | +60–120 | +200–400 | +330–650 net since 28 Sep |
| K10 Discord members | 160 (27 Sep) | 210–240 | 300–380 | 400–500 |
| K02 Organic search clicks per day | 1–2 (since 17 Aug) | 10–20 | 20–40 | 30–60 (stretch 100) |
| Guardrails | — | complaints <0.1% and unsubscribes <0.5% per send; moderation queue <24 h; giveaway-only accounts ≤60% of giveaway sign-ups | | |

## 7. Biggest opportunities

1. **The library is the moat.** No competitor connects news to what a reader owns and wants. Every CTA asks for a library action: remind, follow, shelve or link.
2. **GTA VI launch utility.** Release time, a sourced ledger and a map tracker are narrow enough to win in 53 days, where "GTA 6 news" is not.
3. **Datasets only TechPlay holds.** Release dates with precision flags, 57,630 studios with country and ownership, series tables and critic scores. These earn links without paying for them. The IGDB licence answer governs part of this.
4. **The Balkan angle.** A regional census and regional partners (S9) is a story nobody else in the space is positioned to tell.
5. **Search recovery.** Clicks fell because of a technical block, not an editorial one. Fixing the plumbing and the indexable set (D-021) should recover part of the pre-17 Aug level. That is a TARGET, not a promise.
6. **Discord plus Buffy.** A bot with 20 commands and XP already exists. Onboarding and rituals turn members into regulars.
7. **The seasonal run of Black Friday, TGA and the Winter Sale.** Wishlist price alerts and "Your 2026 in Games" turn deal traffic into members and shares.

## 8. Decisions needed, with owner and date

| # | Decision | Owner | By | Blocks |
|---|---|---|---|---|
| 1 | Is the GTA 6 giveaway live? Promote after D-039a/b and D-041, or pause | EIC | 28 Sep | C09 |
| 2 | Activation threshold: ≥3 shelf items (spine, R11) or ≥5 (R12, the existing Founder badge job, the wizard's PICK_TARGET). Public copy uses the badge rule until decided | EIC | 2 Oct | C68, K08 |
| 3 | D-031 Option A (no pixel, no Meta in 2026; default) or Option B (6 h pixel slice, displaces D-029/D-003/D-042/D-054/D-022) | EIC | 5 Oct | C57, November retargeting |
| 4 | gtadb.org attribution for the GTA 6 map data (D-020) | EIC | 16 Oct reply deadline | Location countdown posts, C11 tracker, GTA data PR, Reddit GTA ad |
| 5 | IGDB licence for derived data (studio country and founding, series, time-to-beat) | EIC | 18 Dec | C21, C23, C25, C27, the free CSV |
| 6 | Approve the six extra /data URLs proposed in 22 or fold them into the three spine data pages | EIC | 2 Oct | C23–C27 landing pages |
| 7 | Use of Rockstar's official GTA VI logo (`public/gta6/logo.png`): editorial only, never in ads | EIC | 2 Oct | 29 creative, C06 |
| 8 | Season 2 "Overdrive": the repo has no Season 2 configured; the only season ("Summer of Gaming 2026") ended 21 Sep. Configure it or skip the announcement. Replace the 30-day streak quest behind its champion badge (ethics rule, 16) | EIC/SC | 26 Oct | C67 |
| 9 | Referral points on Meta-promoted giveaways: 25 removes them (Meta forbids rewarding people for publicising a promotion). Legal confirmation needed | EIC | before any Meta-promoted giveaway | 25, C09 |
| 10 | Does storing first-touch UTMs in sessionStorage need a privacy-policy line? | EIC | 16 Oct | D-008a |
| 11 | Bounce and complaint ingestion (D-054) may touch mail-provider settings. DNS and SMTP changes need the owner's approval first | EIC | before 6 Nov | C42, C43 volume |
| 12 | The ownership article must explain the Impressum's "Luminor Solutions" relationship | EIC | 9 Oct | C54, all outreach |
| 13 | Buy launch copies of GTA VI so guides and map pins can be verified in play | EIC | 1 Nov | C10, C11 |
| 14 | Extra DEV hours (about 10 a week, 12 Oct–22 Nov) | EIC | 9 Oct | Steam sign-in, full guest modal, D-010, D-011, D-031 |

## 9. Major risks

| Risk | Early signal | Response |
|---|---|---|
| DEV overrun in W41–W45 (95–100% booked) | A P0 fix grows at the Monday review | Move D-042, then D-050, then D-007b to W46–W48; never slip a P0 |
| GTA VI slips again | Rockstar Newswire | Pause C06 the same day; update the ledger and release-time tool within the hour; move launch-week hours to Black Friday |
| The countdown or map states something unconfirmed | Vehicle and weapon names come from image filenames (seeder comment); 780 of 1,058 pins have no name, 211 are unconfirmed and 171 are tagged "2022" | Only gated posts from 19-GTA6 §6.2; say "pins", never "mapped locations"; no leaks, ever |
| Social/Community over capacity | The per-network files add up to more than 25 h a week | 04's budget is canonical. Cut in this order: Facebook Groups, Sunday F18 video, Saturday F08, Threads/Bluesky extras |
| A giveaway draws an unfair winner or gets gamed | Entries without points; many entries per IP | D-039a/b before any promotion; fraud score in 25 |
| Search does not recover after the plumbing fixes | Search Console at the 2 Nov review | Stage D-021 (noindex the thin long tail) with its rollback rules; add no new page types |
| Email reputation on the self-hosted sender | Complaint rate above 0.1% | Pause sends and check list sources; no DNS or SMTP change without approval |
| A number in a data story is wrong | Second-person re-run on publication day | Every number is a `[N]` until queried on the day; corrections policy in C54 |
| Rockstar or another rights holder takes down content | A DMCA notice | Official assets only, credited; no gameplay capture unless policy allows |

## 10. What the final QA pass checked (27 Sep)

- **Dates:** every date from 28 Sep to 31 Dec exists once in the calendar (95 rows, 41 fields). No field is empty; days without planned work say so explicitly.
- **Files:** all 34 strategy files, 4 calendar CSVs, 3 library CSVs and 6 JSON files are present. Every JSON parses. Every markdown file ends with "Dependencies and open questions".
- **Copy:** zero matches for the banned phrases. The false live-site numbers appear only as "before" text in fix lists. Only the working Discord invite is used in links.
- **Conflicts reconciled across files:**
  - WRM, registrations, Discord and search TARGETS now use one set (kpis.json).
  - The first Verdict is on 8 Oct.
  - Publishing slots are 08:30, 14:30 and 19:00 CET.
  - Countdown posts come from 19-GTA6.
  - Calendar dates follow the DEV sprint plan: hubs, web push, Meta, the personalised email, alerts and the guest modal are moved and have interims.
  - C26 moves to Q1.
  - The prediction league runs on polls.
  - The "61,034 delisted games" claim was removed, because the tombstones table records TechPlay's own clean-ups.
- **Code facts verified during the pass:**
  - The giveaway draw ignores zero-point entries (`Giveaway.php:225-229`).
  - The bot's giveaway links point to a route that does not exist.
  - The GTA 6 asset names are generated from image filenames.
  - Tombstones record deletions and purges, not store delistings.
- **Not verified and labelled so in the files:**
  - subreddit rules
  - platform policies on links, AI voice and music
  - GTA VI unlock times and download size
  - WoW: Forever details
  - OpenCritic, Metacritic and Steam API terms
  - affiliate rates
  - regional outlets' games coverage

## Dependencies and open questions

The decisions in §8 are the open questions for the whole plan. The per-file lists at the end of each strategy file hold the rest. 32-DEVELOPMENT-BACKLOG's "Children and aliases" section resolves duplicate sub-IDs created in parallel. If a file's date for DEV work disagrees with 32, 32 wins, and the calendar already follows it.
