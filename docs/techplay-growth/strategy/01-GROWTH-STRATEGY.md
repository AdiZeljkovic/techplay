# 01 — Growth Strategy

Status: Phase 2 plan — 27 Sep 2026
Scope: the strategy every other file in this folder executes. Covers Part 1 (growth strategy), the editorial mix at a glance (Part 14, detail in 13), the weekly operating rhythm (Part 40), monthly objectives for October, November and December (Part 41), and team capacity. Period: Mon 28 Sep 2026 to Thu 31 Dec 2026, with the Q1 2027 hand-off in 34.

## Summary

- **The problem is not traffic first. It is that nothing on TechPlay turns a visit into a reason to come back.** 60 accounts, 2 with a linked platform, 20 of 22 notifications that never leave the site, no newsletter landing page, a dead Discord link on the GTA 6 hub, and false numbers on the register page [R01, R02, R11, R23]. Buying or earning more visits into that is wasted.
- **The asset nobody else combines is the library.** 333,000+ games, five platform imports, a release calendar and reminders. Competitors own news; nobody owns "the publication that knows what you play" [R04, R10]. Everything in this plan routes traffic toward that one mechanism.
- **North Star: Weekly Returning Members (WRM)** — accounts with at least one meaningful action in a 7-day window. Activation is **A2 Shelved**: a linked platform or at least 3 shelf items within 7 days of registering [R11].
- **Three phases.** Fix and measure (28 Sep–18 Oct). Build the loops and ride the October launches (19 Oct–15 Nov). Convert the two biggest moments of the year, GTA VI on 19 Nov and the Black Friday / TGA / Winter Sale run, into members (16 Nov–31 Dec).
- **Five pillars decide what gets written:** release and platform intelligence, PC performance and fixes, MMO/WoW, GTA 6 launch utility, industry data. General tech and phones stop [R08, R21].
- **Primary channels:** Google Search, Discover, Discord, email, and the site's own reminder loops. Everything else is secondary or an experiment with a keep/kill date [R07, R16].
- **No paid spend before 19 Oct**, and none at all unless the measurement gate (C03) passes. The paid tests are small, 18+ only, and exist to learn, not to buy growth [R16].
- **Targets are ranges, set against the few baselines that exist.** Headline TARGETS for 31 Dec 2026: 200–350 new verified registrations, at least 40% of them reaching A2 within 7 days, WRM of 60–120, Discord at 500 members, organic search back to 30–60 clicks a day. All are TARGETS, not forecasts (03, 30).

---

## 1. Where TechPlay stands on 27 Sep 2026

These are the facts the plan is built on. Each is from Phase 1; none is estimated.

| Area | State | Source |
|---|---|---|
| Accounts | 60 users (7 Sep); funnel 55 registered → 50 confirmed → 21 entered a giveaway → 7 commented → 3 added a game → 2 linked a platform | R11 |
| Notifications | 20 of 22 types are database-only (bell icon). Weekly digest, release reminders and wishlist checks never reach an inbox | R01, R12 |
| Newsletter | Manual send desk, double opt-in, suppression list; `/newsletter` returns 404 | R20 |
| Search | Clicks fell to 1–2 a day after the Cloudflare 403 of 17 Aug; 295,024 game URLs indexable, 1,967 carry TechPlay content | R03 |
| Visibility | Absent from 114 Bing results pages and 751 Google News results checked | R03, R04 |
| Trust | Register page says "15K+ MEMBERS · 50K+ GAMES"; WoW Analyzer says "50K+ players analyzed · 4.9/5"; GTA 6 hub says "Join thousands of fans"; titles say "140,000+" | R02 |
| Plumbing | Breadcrumb 404s; RSS `/tech/` 404 and ~24 h lag; SearchAction points to a 404; GTA 6 news attached to a 2019 parody game page | R02, R03 |
| Community | Discord 160 members / 24 online; only working invite is discord.gg/wPQG9gUMXH | R13 |
| Social | YouTube 20 subscribers, no videos; X account not linked from the site; no TikTok, Bluesky or LinkedIn | R02, R07 |
| Editorial | ~3.3–3.5 news items a day, published 17:30–21:30 CET; reviews stopped 8 Jul (38 total); 4 guides, 3 of them Genshin | R02, R08 |
| Product | Library import from Steam, PlayStation, Xbox, GOG, Epic; Gamer DNA, Taste Match, Backlog Advisor, WoW Analyzer; GTA 6 hub with 12 characters, 36 weapons, 121 vehicles, 1,058 locations; quests, 67 achievements, 20 ranks | R01, R10, R17 |

**What this means.** TechPlay has more product than most publications its size and almost none of the plumbing that makes product produce members. The plan spends the first three weeks on that plumbing, because every campaign after it depends on it.

## 2. Positioning

- **One line:** TechPlay is the gaming publication that knows what you play.
- **Tagline (kept):** Gaming, on the record.
- **Value proposition:** News you can act on, a database of 333,000 games, and a free library that fills itself from Steam, PlayStation, Xbox, GOG and Epic — then tells you what's releasing, what's on sale and what to play next.
- **Proof we can state:** 333,000+ games catalogued; five platforms import free; release calendar with reminders; GTA 6 hub (1,058 mapped locations, attribution pending D-020); WoW character analyzer; independent, based in Sarajevo.
- **Never state:** member counts, "thousands", "biggest", "#1", ratings we did not collect, benchmarks we did not run.

**Why this position and not "gaming news".** Page one for news queries belongs to IGN, GameSpot, Eurogamer, PC Gamer, VGC, Dexerto and a crowd of fan sites [R04]. TechPlay cannot outpublish them with two writers. It can do something they do not: connect a news item to the reader's own library and act on it (remind, alert, add, compare). Every CTA in this plan is an action on the library, not a "subscribe" for its own sake.

## 3. North Star and the metric tree

**North Star: Weekly Returning Members (WRM).** Accounts with at least one meaningful action in the last 7 days: shelf change, rating, comment, list edit, reminder set, analyzer run, or a Discord XP event from a linked account.

Why this and not sessions or registrations: sessions can be bought and registrations can be farmed by giveaways; neither says TechPlay is useful. WRM only moves when people come back and do something. It is also countable today from the database, while the analytics collector cannot count unique visitors by design (nightly-salted hash) [R01].

```
WRM
├── New members who activate (A2 within 7 days)
│   ├── Verified registrations  ← search, Discover, social, Discord, tools, giveaways
│   └── A2 rate                 ← onboarding, library import, "remind me" flows
├── Returning members
│   ├── Off-site triggers        ← email (C41, C42, C43), web push (C59), Discord DMs
│   └── On-site reasons          ← calendar, map tracker, Year in Review, awards
└── Reactivated members          ← reactivation email, seasonal moments
```

**Input metrics** (defined in 30-ANALYTICS): verified registrations; A2 activation rate; verified newsletter subscribers; Discord members (API count); returning-visit sessions (first-party counter, sessions only); organic clicks and Discover clicks (Search Console); reminders set; alert delivered→visit rate.

**Guardrails:** email complaint rate under 0.1% per send; unsubscribes under 0.5% per send; share of accounts whose only action is a giveaway entry; comment moderation queue under 24 h.

## 4. Strategic bets

Each bet has a reason from the research, the campaigns that carry it, and how we will know by 31 Dec whether it worked.

### Bet 1 — Fix trust and plumbing before promotion
- **Why:** false numbers on the register page and dead links in the most-visited hub undermine every campaign that points at them [R02, R13]. Search collapsed after a technical block, not an editorial one [R03].
- **Carried by:** C01 Trust Reset, C02 Plumbing Sprint, C03 Measurement Foundation, C54 Ownership and press pages.
- **Proof by 16 Oct:** zero invented numbers live; breadcrumb, RSS, SearchAction and GTA page relation fixed; GA4 key events and UTM capture working. If C03 is not done, paid does not start.

### Bet 2 — Turn every visit into a library action
- **Why:** the library is the differentiator, but only 2 of 55 accounts linked a platform [R11]. Registration asks for trust before offering anything, and nothing reminds a guest to come back [R11, R12].
- **Carried by:** C44 registration rebuild, C45 guest "Remind me / Follow", C46 article-end CTA and related module, C42 welcome sequence, C43 off-site alerts, C41 personalised releases email, C68 Founding 100.
- **Proof by 31 Dec:** A2 rate among new verified members at least 40% within 7 days (TARGET); reminders set per week rising month over month.

### Bet 3 — Own narrow, useful things instead of broad head terms
- **Why:** TechPlay cannot win "GTA 6 news" or "GTA 6 map" in 53 days; page one is full [R17]. It can win "GTA 6 release time", real-world vehicle equivalents, a sourced confirmed-vs-rumour ledger, PC fixes, "where can I play X", series order and release data [R09, R17, R18].
- **Carried by:** C07, C08, C12, C60, C61, C62, C63, C15; franchises F03, F07, F08, F09.
- **Proof by 31 Dec:** organic clicks back to 30–60 a day (TARGET; 100 a day is the stretch) with at least half going to pages that did not exist or were rebuilt after 28 Sep.

### Bet 4 — Earn links with data only TechPlay holds
- **Why:** the sites that earn links without buying them own a dataset others need to cite [R14]. TechPlay holds release dates with precision flags, 57,630 studios with country and ownership, 61,034 tombstones, series tables and critic scores [R14].
- **Carried by:** C20, C21, C22, C23, C24, C25, C26, C27 and C48 (Reddit data posts).
- **Proof by 31 Dec:** at least 10 referring domains from editorial sources across the campaigns (TARGET); every campaign published with a method note and CSV; zero corrections needed on numbers.

### Bet 5 — Community where people already are: Discord first
- **Why:** Discord exists, has a bot with 20 commands and XP, and the members who join are the ones who return [R13]. Other social platforms are for reach, not for community.
- **Carried by:** C35 rebuild, C36 Road to 500, C37, C38, C39, C29, C30, F14, F15.
- **Proof by 31 Dec:** 500 members (TARGET; unlocks Server Insights) and a weekly-active share that does not fall as membership grows.

### Bet 6 — One video production, four vertical platforms
- **Why:** video is where discovery happens for younger players, but a lean team cannot run four channels [R19]. One edit goes to TikTok, Shorts, Reels and Facebook Reels; YouTube long-form gets two pilots only.
- **Carried by:** C49, C50; franchises F01, F02, F07, F09.
- **Proof by 20 Nov (keep/kill):** at least one format produces profile visits and site clicks worth its hours. Rule in 08-TIKTOK and 31-EXPERIMENTS.

### Bet 7 — GTA VI as the year's registration moment
- **Why:** 19 Nov is the biggest gaming date of the year and the one where TechPlay already has a hub with real data [R17]. The hub is thin in the HTML crawlers see and disconnected from the rest of the site [R17].
- **Carried by:** C06, C07, C08, C09, C10, C11, C12, C23, C50.
- **Proof by 30 Nov:** registrations with `from=gta6-*` and map-tracker members; not pageviews.

## 5. What we will not do in Q4 2026

- Chase "GTA 6 news" head terms or publish leaks and unconfirmed footage [R17].
- Publish member counts, fan counts or ratings we did not collect.
- Mass-generate programmatic pages across the 295,000-game long tail. Templates roll out only for titles with demand [R03, R09].
- Run Twitch, Pinterest, Snapchat, Apple News, aggregator apps, X Ads, Display, Performance Max, Demand Gen or content-recommendation networks [R07, R16].
- Require shares or follows to enter any promoted giveaway (Meta policy) [R16].
- Post links on Reddit from brand accounts, or post before reading each subreddit's rules [R07].
- Write general tech, phones, Genshin guides or codes pages [R08].
- Spend on paid before measurement works.

The full stop-doing list with replacements is in 33-QUICK-WINS.

## 6. Editorial mix at a glance (Part 14)

Detail, hours and the weekly grid are in 13-SEO-CONTENT. The shape:

| Type | Per week | Owner | Why |
|---|---|---|---|
| Pillar-filtered news | 15–20 (down from ~24, but one in a morning slot) | ED | Google News and Discover need freshness in the pillars, not volume across all topics [R08] |
| Franchise pieces (F01, F05, F07, F08×2, F09, F10, F13, F17, F18) | 10 | ED | Search utility that compounds; each feeds social and the newsletter |
| Verdict (review) | 1 | EIC | Credibility; OpenCritic needs a steady run before 14 Dec [R04] |
| GTA 6 ledger and hub updates | 1–2 (daily in launch week) | ED | Seasonal utility with a clear end |
| Data story / PR campaign | about 1 every 10 days | EIC (+DEV) | Links and citations [R14] |
| Hub / evergreen pages | 1 new or rebuilt | ED | /guides/pc-fixes, /switch-2, /steam, /mmo |
| Newsletter | 1 (+1 personalised from 26 Oct) | SC/EIC | The most reliable return trigger we control |

**Publishing times.** Today everything goes out 17:30–21:30 CET [R02]. From 28 Sep one piece a day goes out in the morning (07:30–09:00 CET) so it is fresh for Europe's day and the US morning. F01 goes out Monday 07:30 CET.

## 7. Phases and monthly objectives (Part 41)

### Phase A — Fix and measure: 28 Sep to 18 Oct

**October objective 1: stop the leaks.** All false claims gone by 2 Oct (C01). Breadcrumbs, RSS, dead invites, SearchAction and the GTA page relation fixed by 9 Oct (C02). Measurement working by 16 Oct (C03).
**October objective 2: start the rhythm.** Every franchise live by 12 Oct: F01 from 28 Sep, F02 from 28 Sep, F03 from 1 Oct, F05 from 1 Oct, F07 from 2 Oct, F09 from 3 Oct, F24 from 6 Oct. The Save File sends every Friday from 2 Oct.
**October objective 3: build the return loops.** Welcome sequence (12 Oct), off-site alerts and guest "Remind me" (19 Oct), registration rebuild (26 Oct), first personalised releases email (26 Oct).
**October objective 4: first two data stories.** Release Congestion Index (7 Oct), Studios Closed tracker (14 Oct), Balkan Game Dev Census (28 Oct).

| October TARGET (by 31 Oct) | Range |
|---|---|
| Invented numbers live on the site | 0 |
| Verified newsletter subscribers | +40 to +80 on the 7 Sep base (run baseline query Q-NL first) |
| New verified registrations | 50–90 |
| A2 rate, members registered after 26 Oct | ≥ 35% within 7 days |
| Discord members | 250 |
| Organic clicks per day (7-day average) | 10–20 |
| Referring domains from C20/C21/C22 | ≥ 3 |

### Phase B — Loops and launches: 19 Oct to 15 Nov

**November objective 1: catch the October–November launches with utility pages.** MW4 hub (12 Oct), Next Fest Diary (19–26 Oct), Switch 2 hub (26 Oct), Steam hub (2 Nov), MMO hub (10 Nov).
**November objective 2: GTA VI launch readiness.** Release-time tool (14 Oct), vehicle guide (21 Oct), YouTube pilot (12 Nov), map progress tracker built and tested before 18 Nov.
**November objective 3: test paid once, cheaply.** Branded search from 19 Oct; Meta registration test 2–22 Nov and Reddit test 9–25 Nov only if gated (26-PAID-MEDIA).

### Phase C — Convert the season: 16 Nov to 31 Dec

**November objective 4: GTA VI launch week as the registration peak.** Map tracker live at unlock; launch-night Discord event; special newsletter; review in progress within 24 h.
**December objective 1: turn deal season into activation.** Black Friday wishlist price alerts (20 Nov–1 Dec), gift guide from wishlists (1–20 Dec), Winter Sale picks (17 Dec–4 Jan). Every deal piece asks for a wishlist or follow, not just a click.
**December objective 2: give members something to share.** Your 2026 in Games (14 Dec), TGA prediction league (18 Nov–10 Dec), Community Awards (1–20 Dec).
**December objective 3: set up 2027.** OpenCritic application (14 Dec), State of the Catalogue drafted, 2027 Most Anticipated from member follows (21 Dec), keep/kill decisions on every experimental channel (31 Dec).

| TARGET by 30 Nov | Range | TARGET by 31 Dec | Range |
|---|---|---|---|
| New verified registrations (cumulative since 28 Sep) | 130–230 | New verified registrations | 200–350 |
| A2 rate within 7 days | ≥ 40% | A2 rate within 7 days | ≥ 40% |
| WRM (weekly) | 40–80 | WRM | 60–120 |
| Discord members | 380 | Discord members | 500 |
| Organic clicks per day | 20–40 | Organic clicks per day | 30–60 |
| Verdicts published since 6 Oct | ≥ 8 | OpenCritic application | submitted 14 Dec |

These are TARGETS set against a tiny base. They are reviewed on 2 Nov and 7 Dec (30-ANALYTICS) and raised or lowered on evidence, not on hope.

## 8. The weekly operating rhythm (Part 40)

The calendar files hold every date. This is the pattern they follow.

| Day | Franchise output | Community and email | Team rituals |
|---|---|---|---|
| **Mon** | F01 Out This Week (07:30 CET); F24 Verdict on most weeks; F11 forum thread | F11 in Discord; C41 personalised email 08:00 CET (from 26 Oct); YouTube Community poll | 09:30 **Monday review** (EIC, ED, SC; 30 min): last week's KPI sheet, this week's calendar rows, blockers. DEV sprint check (15 min) |
| **Tue** | F08 Where Can I Play It?; F13 Steam Movers; F04 The Number | F15 Readiness Check 16:00 CET (US WoW reset); Facebook Groups slot | DS batch day 1: this week's templates filled |
| **Wed** | F12 Poll; F10 Worth It in 2026?; F17 Studio Watch; GTA countdown vertical | Discord native poll; Story poll | PR/data day for EIC when a campaign is due |
| **Thu** | F05 Hidden Gem; F03 Confirmed or Rumour?; F04 The Number | LinkedIn (EIC, one post); Groups slot | SC video batch: next week's three verticals edited |
| **Fri** | F07 Fix It Friday; F19 Library Card (from Nov, opt-in) | **F21 The Save File 15:00 CET** | 14:00 newsletter QA (SC + EIC); weekend posts scheduled |
| **Sat** | F09 In Order; F08 Where Can I Play It?; F04 The Number | Groups slot; weekend Discord thread | Scheduled only; one ED on news watch |
| **Sun** | F18 Games Like… (written Fri) | **F14 Buffy's Weekly Wrap 20:00 CET** | Scheduled only |
| **Daily** | F02 GTA countdown until 19 Nov; F06 On This Day; up to 3 pillar news | Discord countdown in #gta6; Reddit helpful answers (30–45 min) | Moderation queue under 24 h |

**Video cadence (C49, from 5 Oct):** three verticals a week (Mon F01, Wed GTA countdown until 18 Nov then F10, Fri F07), one edit per video posted to TikTok, Shorts, Reels and Facebook Reels. Five to seven in GTA launch week. F09 verticals on Saturdays from 7 Nov if the keep/kill review on 2 Nov says video is working.

## 9. Team capacity

Assumed hours per week (ESTIMATE; some roles may be one person): EIC 40, ED 40, SC 25, DS 10, DEV 20 — about 135 h.

| Work block | EIC | ED | SC | DS | DEV | Total |
|---|---|---|---|---|---|---|
| Routine news (pillar-filtered) | 4 | 22 | – | – | – | 26 |
| Franchise pieces and hubs | 4 | 14 | – | – | – | 18 |
| Verdict | 5 | – | – | – | – | 5 |
| Data / PR campaigns | 10 | – | – | – | 4 | 14 |
| Social scheduling, Discord, Reddit | 2 | 2 | 16 | – | – | 20 |
| Vertical video (3/week) | 1 | – | 5 | 3 | – | 9 |
| Newsletter | 1 | – | 3 | 1 | – | 5 |
| Templates and cards | – | – | – | 6 | – | 6 |
| Partnerships, creators, outreach | 6 | – | 1 | – | – | 7 |
| Product backlog (P0/P1) | 2 | – | – | – | 16 | 18 |
| Planning, review, analytics | 5 | 2 | – | – | – | 7 |
| **Total** | **40** | **40** | **25** | **10** | **20** | **135** |

**What gives when a week overflows,** in this order: Saturday F08, Threads and Bluesky posts, Facebook Groups slots, the Saturday vertical, F13. Never the newsletter, the Monday F01, Discord moderation or a P0 fix.

**Launch week (16–22 Nov) and TGA night (10–11 Dec)** need extra hours: EIC and ED on shifts, SC on Discord through the event. Plan time off the week before, not during.

## 10. How the files fit together

| Need | File |
|---|---|
| Who we are talking to | 02-AUDIENCES |
| Where people leak and how to measure it | 03-FUNNEL |
| What each channel is for | 04-CHANNEL-STRATEGY, channels.json |
| Social operating system and franchises | 05-SOCIAL-MEDIA |
| Per-platform playbooks | 06 to 12 |
| Search, Discover, News | 13, 14 |
| Registration, activation, retention, email | 15, 16, 17 |
| Video workflow | 18 |
| GTA VI, other hubs, tools | 19, 20, 21 |
| PR, creators, partnerships, giveaways | 22 to 25 |
| Paid and retargeting | 26, 27 |
| Every campaign with copy | 28-CAMPAIGN-LIBRARY, campaigns.json, campaign-library.csv |
| Creative specs | 29 |
| Measurement, experiments | 30, 31, kpis.json, experiments.json |
| What DEV builds | 32, development-backlog.csv / .json |
| First 30 days, stop doing | 33 |
| Q1 2027 | 34 |
| Every day, 28 Sep to 31 Dec | calendar-2026-09/10/11/12.csv, calendar.json |

## 11. Risks that could change the plan

| Risk | Signal | Response |
|---|---|---|
| GTA VI slips a third time | Rockstar Newswire | C06 pauses on the day; ledger and release-time tool update within the hour; the hub's value (map, vehicles) stays; launch-week budget moves to Black Friday |
| The GTA 6 giveaway is not live, or rules are unclear | Admin check 28 Sep | No promotion; C09 creative not made; a Black Friday or TGA giveaway replaces it (25-GIVEAWAYS) |
| gtadb.org does not grant attribution for the map data | D-020 by 9 Oct | Map locations are not used in countdown or PR; tracker ships with TechPlay-verified locations only, or not at all |
| Search does not recover after plumbing | Search Console, 2 Nov review | Escalate D-021 (indexable set) and check crawl logs; do not add more pages |
| Measurement not ready by 16 Oct | C03 gate | Paid does not start; decisions use Search Console and database queries only |
| Team hours overrun | Monday review | Cut in the order in §9 |
| Rockstar takes down fan content or footage | DMCA notice | Official assets only, credited; no leaked footage ever [R17] |
| An email complaint spike on the self-hosted sender | complaint rate > 0.1% | Pause sends, check list source; no DNS or SMTP changes without the owner's approval [R20] |

## Dependencies and open questions

- **GTA 6 giveaway status:** verify in Filament on 28 Sep (EIC). Everything in C09 depends on it.
- **D-020 map attribution:** decision by 9 Oct. Countdown location facts are scheduled only after that date.
- **A2 threshold:** R11 and the spine use "≥3 shelf items"; R12 and the existing Founder badge job use 5. EIC decides one definition before C68 launches on 12 Oct.
- **Search Console access:** EIC confirms the property is verified and shares access with ED and DEV on 28 Sep; the search targets assume it.
- **Season 2 dates:** migrations disagree on Season 1/2 boundaries; verify in admin by 26 Oct before announcing C67.
- **Team hours** are assumptions. If SC is fewer than 25 h, the first cuts are Threads, Bluesky and Facebook Groups.
- **Unlock times for GTA VI** are not announced. Nothing in this plan states one until Rockstar or the platforms publish it.
