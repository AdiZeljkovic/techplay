# 28 — Campaign Library

Status: Phase 2 plan — 27 Sep 2026

## Summary

- **All 71 campaigns (C01–C71) are fully formed**: goal, KPI formula, TARGET, audience (S-IDs), channels, dates and key moments, message and proof, exact copy, creative sizes, CTA, landing page, a full UTM example, owner, effort, budget, tracking events, follow-up and dependencies. The 11 product and analytics campaigns also carry acceptance criteria. Every campaign carries at least one piece of finished copy (a post, an email, an outreach letter, page text or an internal launch note); 30 have platform-by-platform copy for six or more channels. Channels a campaign does not need are marked 'not used' rather than padded.
- **Order of work follows the research:** fix what is false or broken (C01, C02), make it measurable (C03), deliver the loops that already exist (C40–C46, C43), build on the data (C20–C27, C60–C63), then promote (C56–C58) [R23]. Nothing is promoted to a page that still carries a false number.
- **Four anchor moments carry the quarter:** Steam Autumn Sale and Next Fest in October (C05, C18, C71), GTA VI on Thu 19 Nov (C06–C12, C10 launch week), Black Friday 27 Nov and Cyber Monday 30 Nov (C31, C32, C25), and The Game Awards 10 Dec into the Winter Sale 17 Dec–4 Jan (C28–C30, C34, C70) [R05].
- **Paid is small and gated:** three test families only (C56 Google branded/tool, C57 Meta US 18+, C58 Reddit, with sub-lines defined in 26-PAID-MEDIA), none before 19 Oct and none before C03 passes on 16 Oct. LEAN-tier caps for the quarter: **$677** (Oct $104, Nov $284, Dec $289), inside the spine's $300/month ceiling in every month and identical to 26-PAID-MEDIA §5.1 [R16 §3].
- **Copy is ready to paste but not to invent:** every bracketed field ([N], [Game], [price], [date]) is filled from a live query or a store page on the day. No member, follower or subscriber number appears in any public copy; GTA 6 claims come only from the C07 ledger (Confirmed / Reported / Rumour).
- **DEV is the binding constraint.** One-off DEV work in campaigns starting in October adds up to about 257 h against roughly 100 h of DEV time; November adds about 139 h against ~80 h (ESTIMATE). `32-DEVELOPMENT-BACKLOG.md` resolves this by moving Steam sign-in, the platform hubs, the article-end block, invite attribution, web push, the Meta Pixel and the prediction league to 2027; each affected campaign here carries a delivery-status line and a no-DEV interim, and announcement copy is held until the feature ships.
- **Content and community fit the ~135 h/week budget** because the recurring work is templated: franchises F01–F24 run on fixed layouts, one vertical-video production feeds four platforms (C49), and the daily items (C06 countdown, C65 On This Day) take 10–15 minutes each from fixed templates.
- **Biggest open risks:** the GTA 6 giveaway may not exist (verify 28 Sep, C09); the map's provenance (D-020) blocks C11 and the Reddit GTA ad; IGDB licence terms decide C25; Season 2 dates are not in the repo (C67); WoW 12.1.5 is a predicted date (C13).

## How to read this library

- **Scope:** Part 32 (campaign library, C01–C71) and Part 33 (exact copy). Execution window Mon 28 Sep → Thu 31 Dec 2026, with Q1 2027 continuity. Machine-readable twin: `campaigns.json` in this folder (same content, one object per campaign; `tracking_events` holds canonical event names and `tracking_notes` the parameters).
- **IDs and names** are canonical from the spine (§8). Franchise IDs (F01–F24), segments (S1–S10), dev items (D-001…) and landing pages (§7) are used exactly as defined there. Pages marked "(new)" do not exist yet.
- **TARGET** is a goal we set; **ESTIMATE** is a forecast with a basis. Where no baseline exists, the KPI is written as a formula and the first period becomes the baseline. Research is cited as [R05], [R17] and so on.
- **Links in copy are shown bare** (techplay.gg/calendar) for readability. Every posted link is built by the campaign URL helper (D-009) using the spine §9 taxonomy; each campaign shows one full example. Discord links use the one working invite (https://discord.gg/wPQG9gUMXH) or a per-campaign invite code created by SC and logged in the invite sheet (D-011).
- **Channel keys** in each campaign's copy block follow `campaigns.json`: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy. Channels a campaign deliberately does not use are listed as "not used" rather than filled with filler.
- **Priority tiers:** T1 must (protect even in a bad week), T2 should, T3 cut first if DEV or ED time runs short.
- **Copy rules applied throughout:** plain, specific English; no hype words; no fake urgency; at most one emoji per post (none used here); every number either sourced in the research or left as a bracketed field to fill from live data.

## Campaign index

| ID | Campaign | Type | Tier | Dates | Owner | Budget (LEAN) | TARGET (short) |
|---|---|---|---|---|---|---|---|
| C01 | Trust Reset — remove false claims site-wide | Product | T1 | 09-28 → 10-02 | DEV | $0 | 0 by Fri 2 Oct 2026 (DOWN from at least 10 distinct false strings on 27 Sep [R02 App. B]). |
| C02 | Plumbing Sprint — breadcrumbs, RSS, dead invites, SearchAction, GTA page relation, titles | SEO | T1 | 09-28 → 10-09 | DEV | $0 | 0 by Fri 9 Oct 2026 (DOWN from: breadcrumb 404 on every article; all RSS hardware items; 2 dead invite… |
| C03 | Measurement Foundation — GA4 key events, UTM capture, campaign URL helper, invite codes | Analytics | T1 | 09-28 → 10-16 | DEV | $0 | 27/27 events verified and ≥95% of links in the campaign sheet built by the helper by Fri 16 Oct 2026; zero… |
| C04 | Out This Week (F01) | Social | T1 | 09-28 → 12-28 | ED | $0 | UP week over week for 6 weeks; by week 6 (2 Nov) at least one platform chosen as the video home (C49)… |
| C05 | Steam Autumn Sale: Wishlist Picks | Seasonal | T2 | 10-01 → 10-08 | ED | $0 | first measured baseline (this is the first sale campaign); set the Winter Sale (C34) target at 1.5× this… |
| C06 | GTA 6 Countdown ('X days to Vice City', F02) | Social | T1 | 09-28 → 11-19 | SC | $0 | 52 consecutive daily posts with zero unconfirmed claims; reminder conversion UP month over month (Oct vs… |
| C07 | GTA 6 Confirmed-or-Rumour Ledger (F03) | SEO | T1 | 10-01 → 12-31 | ED | $0 | 8 weekly updates by 19 Nov with a changelog; Search Console clicks UP week over week from first… |
| C08 | GTA 6 Release-Time Tool + Reminder | Product | T1 | 10-01 → 11-19 | DEV | $0 | tool live by Wed 14 Oct; reminder rate measured from day 1 and UP weekly to launch; page indexed within 7… |
| C09 | GTA 6 Giveaway | Giveaway | T2 | 09-28 → 10-21 | SC | $0 | winner published 21 Oct; giveaway-only accounts (entered, no other action in 7 days) BELOW 70% of entrants… |
| C10 | GTA 6 Launch Week | Community | T1 | 11-16 → 11-22 | EIC | $0 | highest weekly WRM of the quarter; Discord joins in launch week UP vs the previous 4-week average. |
| C11 | GTA 6 Map Progress Tracker | Product | T3 | 11-02 → 12-31 | DEV | $0 | live at unlock on 19 Nov; D-020 provenance resolved before launch; share of trackers with ≥10 marks after… |
| C12 | GTA 6 Vehicle Guide (classes + real-world equivalents, sourced) | SEO | T2 | 10-05 → 10-21 | ED | $0 | 121/121 classes and ≥60 equivalents (only where a trailer/screenshot supports it) by 21 Oct; each… |
| C13 | WoW 12.1.5 Readiness Push | Community | T1 | 10-05 → 10-12 | ED | $0 | runs in patch week UP vs the previous 7 days (baseline from the collector); copy fixed (D-040) before 5 Oct. |
| C14 | WoW: Forever Explainer + Analyzer | SEO | T2 | 10-28 → 11-08 | ED | $0 | explainer live 28 Oct and updated on 4 Nov; indexed before launch day. |
| C15 | MMO Hub launch (/mmo) | SEO | T3 | 11-02 → 11-10 | ED | $0 | live 10 Nov with ≥6 linked pillar pages; indexed within 14 days; Analyzer click-through measured from week 1. |
| C16 | Gears of War: E-Day launch utility | SEO | T2 | 10-01 → 10-10 | ED | $0 | 'Gears of War in order' live 3 Oct (C63); launch page live 5 Oct; Verdict by 10 Oct if a copy is available. |
| C17 | Modern Warfare 4 launch hub | SEO | T2 | 10-12 → 11-01 | ED | $0 | hub article live 12 Oct; PC fix tie-in (C60) live 16 Oct; 'which CoD should I get' comparison live 20 Oct. |
| C18 | Steam Next Fest Demo Tracker (with F23 Next Fest Diary) | Community | T1 | 10-12 → 10-30 | ED | $0 | 24 demos covered (3/day × 8 days); reminder_set from tracker measured; ≥1 developer AMA from C71 outreach. |
| C19 | Scream Fest + Halloween horror picks | Seasonal | T2 | 10-22 → 11-02 | ED | $0 | list live 22 Oct; measured shelf-add rate becomes the baseline for C33/C34 list posts. |
| C20 | Release Congestion Index 2026 (PR) | PR | T1 | 09-30 → 10-21 | EIC | $0 | published 7 Oct; ≥10 personal pitches sent; ≥3 citations or links by 31 Dec; one r/dataisbeautiful OC post… |
| C21 | World Atlas of Game Studios + Balkan Game Dev Census (PR) | PR | T2 | 10-14 → 11-15 | EIC | $0 | published 28 Oct; ≥8 regional pitches (BA, HR, RS, SI, MK, ME); ≥2 regional citations by 31 Dec;… |
| C22 | Studios Closed in 2026 tracker (F17) | PR | T2 | 10-14 → 12-31 | ED | $0 | live 14 Oct; updated every Wednesday; every row has a primary source; ≥2 citations by 31 Dec. |
| C23 | Sequel Gap Inflation: 'Why GTA 6 took 13 years' (PR) | PR | T2 | 10-19 → 11-18 | EIC | $0 | published 4 Nov with the top 50 series hand-verified; ≥8 pitches (mainstream + trade); ≥2 citations by 31… |
| C24 | The $80 Tracker (PR) | PR | T2 | 10-26 → 12-31 | ED | $0 | published 11 Nov with a transparent 'notable' definition; updated at each notable launch to 31 Dec; ≥2… |
| C25 | Best Value Games of 2026: cost per hour (PR, Black Friday hook) | PR | T3 | 11-09 → 12-01 | EIC | $0 | published 23 Nov only if the time-to-beat licence check passes; otherwise ship the price-only version. |
| C26 | Achievement Difficulty by Genre, 500 Steam games (PR) | PR | T3 | 11-16 → 12-22 | EIC | $0 | published 8 Dec with the mapping file; ≥2 citations by 15 Jan 2027. |
| C27 | State of the Catalogue 2026 report | PR | T3 | 12-01 → 2027-01-12 | EIC | $0 | draft by 18 Dec; peer-checked by a second person; publish Tue 12 Jan 2027. |
| C28 | Your 2026 in Games — cross-platform year in review | Product | T2 | 11-16 → 12-31 | DEV | $0 | built and QA'd by 10 Dec; live 14 Dec; library_connected in 14–31 Dec UP vs 1–13 Dec daily average. |
| C29 | Game Awards Prediction League | Community | T3 | 11-18 → 12-11 | SC | $0 | league open within 48 h of the official nominee list (or 18 Nov if already public); entries UP vs C09… |
| C30 | TechPlay Community Awards 2026 | Community | T3 | 12-01 → 12-20 | SC | $0 | 6 categories; results published 20 Dec with the number of voters shown (whatever it is). |
| C31 | Black Friday Wishlist Price Alerts | Product | T2 | 11-20 → 12-01 | DEV | $0 | alerts live by 20 Nov; complaint rate <0.1% and unsubscribe <0.5% per send (guardrails); wishlist adds UP… |
| C32 | Cyber Monday Deal Radar (F16) | Seasonal | T2 | 11-27 → 11-30 | ED | $0 | live 07:00 CET 30 Nov; updated twice that day. |
| C33 | Gift Guide from Wishlists | Seasonal | T3 | 12-01 → 12-20 | ED | $0 | share-your-wishlist link live 1 Dec; guide live 3 Dec; gift-list registrations reported 21 Dec. |
| C34 | Steam Winter Sale Picks | Seasonal | T2 | 12-17 → 2027-01-04 | ED | $0 | ratio ≥1.5× C05 baseline; alerts CTR ≥ C31's. |
| C35 | Discord Rebuild — onboarding, channels, roles, Server Guide | Community | T1 | 09-28 → 10-12 | SC | $0 | rebuild complete 12 Oct; 7-day message rate for new members UP in the 4 weeks after vs the 4 weeks before… |
| C36 | Discord Road to 500 | Community | T2 | 10-12 → 12-31 | SC | $0 | 500 members by 31 Dec 2026 (baseline 160 on 27 Sep, R13); ≥30% of new joins post within 7 days. |
| C37 | What Are You Playing? weekly (F11) | Community | T1 | 09-28 → 12-28 | SC | $0 | 13 consecutive Mondays; replies UP month over month. |
| C38 | Game Club (Oct: Control Resonant; Nov: GTA VI; Dec: member vote) | Community | T2 | 10-05 → 12-31 | SC | $0 | 3 clubs run to the wrap; attendance recorded each time. |
| C39 | Poll of the Week (F12) | Community | T1 | 09-30 → 12-30 | SC | $0 | 13 polls; results posted every following Wednesday. |
| C40 | The Save File newsletter relaunch (F21) | Email | T1 | 10-02 → 12-31 | SC | $0 | 13 issues on Fridays; verified subscribers UP every week; complaint <0.1%, unsubscribe <0.5% per send. |
| C41 | "Your releases this week" personalised email | Email | T2 | 10-05 → 12-28 | DEV | $0 | first send Mon 26 Oct; click rate above The Save File's click rate by the third send; guardrails held. |
| C42 | Welcome sequence (3 emails) | Email | T1 | 10-05 → 10-12 | DEV | $0 | live 12 Oct; A2 activation among recipients UP vs members who joined 28 Sep–11 Oct (no sequence). |
| C43 | Release-day & price alerts off-site (email + Discord DM) | Product | T1 | 10-05 → 10-19 | DEV | $0 | live 19 Oct (Next Fest start, MW4 week); CTR tracked per channel; guardrails held. |
| C44 | Registration rebuild — register page rewrite, social first, Steam sign-in, redirect-back | Product | T1 | 10-05 → 10-26 | DEV | $0 | live 26 Oct; completion rate UP vs the 4 weeks before (baseline from C03 events); Steam share of… |
| C45 | "Remind me / Follow" guest CTA on game & calendar pages | Product | T1 | 10-05 → 10-19 | DEV | $0 | live 19 Oct; conversion measured weekly; reminders set per day UP vs pre-launch. |
| C46 | Article end CTA block + contextual links + related module | Product | T1 | 10-05 → 10-16 | DEV | $0 | live 16 Oct on all articles; article → action rate measured weekly from then. |
| C47 | Reddit Reputation Program (90 days) | Community | T1 | 09-28 → 12-27 | SC | $0 | 12 weeks × ≥10 helpful comments per account; links in ≤1 of 10 comments; zero removals for self-promotion. |
| C48 | Reddit Data Posts (tied to C20/C21/C22/C26) | PR | T2 | 10-07 → 12-08 | EIC | $0 | 4 OC posts (7–8 Oct, 14 Oct, 28 Oct, 8 Dec); zero removals. |
| C49 | Vertical Video System (Out This Week + GTA countdown + Fix It Friday) | Video | T2 | 10-05 → 12-31 | SC | $0 | 6-week test 5 Oct–15 Nov (≥3 videos/week); by 16 Nov pick the primary platform; ESTIMATE 2–3 h/week SC + 1… |
| C50 | YouTube long-form pilot: 'Every GTA game in order before VI' + 'Release Radar' monthly | Video | T3 | 10-19 → 12-07 | EIC | $0 | 3 videos published (12 Nov, 2 Nov Radar, 7 Dec Radar); decision on long-form in January based on view… |
| C51 | Creator Data Partnerships | Creator | T2 | 10-20 → 12-31 | EIC | $0 | 15 personal outreach emails by 30 Nov; 3 completed collaborations by 31 Dec. |
| C52 | Verdict: review restart (F24) | SEO | T1 | 10-06 → 12-31 | EIC | $0 | ≥8 Verdicts by 14 Dec (C53 gate); median days from release ≤7 (DOWN from 16–21 days) [R23 #14]. |
| C53 | OpenCritic application | PR | T2 | 12-07 → 12-14 | EIC | $0 | submitted 14 Dec with ≥8 reviews since 6 Oct, the review policy page and /about/ownership linked. |
| C54 | Ownership, Funding & AI Policy page + /press | PR | T1 | 10-01 → 10-09 | EIC | $0 | both pages live 9 Oct; every pitch from 9 Oct links /press. |
| C55 | Balkan regional partnerships (studios, A1 Adria League, regional press) | Partnership | T3 | 11-01 → 11-30 | EIC | $0 | 10 studio contacts, 1 esports/media partner conversation, 2 regional press pickups in November. |
| C56 | Paid: Google branded + tool exact match | Paid | T2 | 10-19 → 12-31 | EIC | $292 | branded impression share and a real CPC by 2 Nov; stop tool keywords with <20 impressions/week after 14… |
| C57 | Paid: Meta registration test (US 18+) | Paid | T2 | 11-02 → 12-14 | EIC | $385 | read a CPC and a click→verified rate; stop-loss $150 with <5 verified accounts (R16 T2). No CPA promise. |
| C58 | Paid: Reddit tool/hub test (GTA 6 hub, WoW Analyzer) | Paid | T3 | 11-09 → 11-25 | EIC | $0 | TARGET (GROWTH tier only): stop-loss $100 with <20 Discord clicks (GTA) or <30 analyses (WoW); CTR below… |
| C59 | Web push for reminders (opt-in at 'remind me') | Product | T3 | 10-26 → 11-09 | DEV | $0 | live 9 Nov (before GTA launch); opt-in rate measured; stop if <1% after 2 weeks (R16 T14). |
| C60 | PC Fix Hub (/guides/pc-fixes) + Fix It Friday (F07) | SEO | T1 | 10-12 → 12-31 | ED | $0 | hub + first guide 12 Oct; 10 guides by 18 Dec; organic clicks UP month over month. |
| C61 | Switch 2 Hub (/switch-2) | SEO | T2 | 10-19 → 12-31 | ED | $0 | live 26 Oct (the day before Minecraft Bedrock on Switch 2); edition tracker covers every dated Switch 2… |
| C62 | Steam Hub (/steam) | SEO | T2 | 10-26 → 12-31 | ED | $0 | live 2 Nov; movers updated every Tuesday; Winter Sale (C34) runs on it. |
| C63 | In Order series pages batch (F09) | SEO | T2 | 10-03 → 2027-01-02 | ED | $0 | 13 pages by 26 Dec + Metroid on 2 Jan; each indexed within 14 days. |
| C64 | Hidden Gem Thursday (F05) | Social | T2 | 10-01 → 12-31 | ED | $0 | 13 Thursdays; shelf adds per post UP month over month. |
| C65 | On This Day (F06) | Social | T2 | 09-28 → 12-31 | SC | $0 | daily from 28 Sep, manual until Buffy automation (then 0 SC minutes). |
| C66 | The Last Disc revival (Sony disc survey) | PR | T2 | 09-29 → 10-15 | EIC | $0 | counters render real values (or hide) by 29 Sep; explainer live 30 Sep; signatures reported 15 Oct. |
| C67 | Season 2 "Overdrive" launch (site seasons) | Community | T2 | 10-26 → 12-31 | SC | $0 | dates verified and season configured by 26 Oct; launch post 1 Nov; leaderboard never shows an empty state… |
| C68 | Founding 100 (Founder badge extended from 50 to 100) | Product | T2 | 10-01 → 10-31 | DEV | $0 | limit raised to 100 on 1 Oct; badges awarded daily by the existing 10:00 job; count reported weekly… |
| C69 | Steam Curator page launch | Partnership | T2 | 10-12 → 12-31 | ED | $0 | live 20 Oct with ≥15 recommendations; Curator Connect enabled; ≥3 keys received by 31 Dec. |
| C70 | 2027 Most Anticipated + Q1 bridge | SEO | T2 | 12-21 → 12-31 | ED | $0 | list live 21 Dec; reminders on listed games UP in 21 Dec–10 Jan vs 1–20 Dec. |
| C71 | Studio/indie Next Fest outreach (partnership) | Partnership | T2 | 10-05 → 10-20 | EIC | $0 | 30 emails by 16 Oct; ≥5 replies; ≥1 Discord AMA during the fest; regional studios prioritised. |

## Key moments by week

Generated from each campaign's dated key moments (ISO weeks, Monday start). Recurring franchise slots are not repeated here; they run every week (F01 Mon, F11 Mon, F12 Wed, F05 Thu, F03 Thu, F07 Fri, F21 Fri, F14 Sun).

| Week of | Dated moments |
|---|---|
| 28 Sep 2026 | C01 28 Sep: DEV starts D-001, D-040, D-029<br>C02 28 Sep: D-004 dead invites replaced (XS, first task)<br>C04 28 Sep: issue 1 (28 Sep–4 Oct)<br>C06 28 Sep: Day 52<br>C09 28 Sep: SC + EIC verify in admin: prize, rules, end date, tasks. If nothing live: stop here and remove 'Enter exclusive giveaways' from register/Discord copy<br>C35 28 Sep: baseline count; D-004 invites fixed<br>C47 28 Sep: accounts named (SC and EIC personal accounts with flair/bio 'works at TechPlay'); each sub's rules read and logged<br>C65 28 Sep: manual posting starts<br>C09 29 Sep: remove share/retweet tasks from any entry path promoted on Meta; add official rules + 'no purchase necessary'<br>C66 29 Sep: /last-disc counters fixed (D-029); page copy updated<br>C01 30 Sep: EIC reviews every replacement line<br>C05 30 Sep: article drafted with placeholders; picks list chosen from games with ≥ the site's hidden-gem rating threshold<br>C20 30 Sep: query written; second person re-runs it<br>C39 30 Sep: poll 1: PlayStation discs<br>C40 30 Sep: /newsletter landing live (D-012)<br>C66 30 Sep: 'Will my PS5 discs still work? What Sony has said' explainer; poll (C39)<br>C02 1 Oct: D-002 breadcrumbs + D-003 RSS live<br>C05 1 Oct: sale opens: article live, social set, Discord pin<br>C07 1 Oct: ledger v1 live (converted from the existing FAQ page)<br>C08 1 Oct: DEV build starts (D-018)<br>C09 1 Oct: /giveaways indexable while live (D-039)<br>C49 1 Oct: TikTok account created (@techplay.gg or @techplaygg if free); bios aligned<br>C54 1 Oct: drafts<br>C68 1 Oct: run with --limit=100; announcement<br>C01 2 Oct: grep of 95 URLs returns zero hits; correction note posted<br>C03 2 Oct: D-009 campaign URL helper usable by SC<br>C05 2 Oct: The Save File issue 1 carries the picks (C40)<br>C13 2 Oct: D-040 copy live (no stale Midnight date, no unbacked figures)<br>C35 2 Oct: channel map + roles live<br>C40 2 Oct: issue 1<br>C66 2 Oct: newsletter<br>C16 3 Oct: Gears of War in order (F09/C63)<br>C63 3 Oct: Gears of War (E-Day 6 Oct) |
| 5 Oct 2026 | C02 5 Oct: D-005 GTA relation + D-017 hub SSR H1/counters<br>C04 5 Oct: issue 2 (Gears of War: E-Day week)<br>C05 5 Oct: mid-sale update: 5 more picks<br>C12 5 Oct: data entry starts (ED, 20 vehicles/day max)<br>C13 5 Oct: 'Patch 12.1.5 checklist' article; Readiness Check post<br>C16 5 Oct: 'Gears of War: E-Day: release time, platforms and PC specs'<br>C20 5 Oct: chart and methodology reviewed by EIC<br>C38 5 Oct: October kickoff: Control Resonant<br>C41 5 Oct: build (D-028) on the existing weekly-digest data<br>C42 5 Oct: copy approved<br>C43 5 Oct: build<br>C44 5 Oct: copy approved by EIC (D-014)<br>C46 5 Oct: block design<br>C49 5 Oct: first Out This Week video<br>C71 5 Oct: list from Steam's Next Fest pages and press-preview materials; Balkan studios first<br>C13 6 Oct: first weekly reset post after patch (F15 Tue)<br>C16 6 Oct: launch<br>C52 6 Oct: Verdict #1 (candidate: Control Resonant, released 24 Sep)<br>C03 7 Oct: D-007 key events (registration_complete, email_verified, library_connected, newsletter_verified, discord_click) in GA4<br>C20 7 Oct: publish + pitches<br>C35 7 Oct: Onboarding + Server Guide live<br>C39 7 Oct: poll 2: 'Would you pay $80 for a game?'<br>C54 7 Oct: EIC sign-off<br>C05 8 Oct: last day post: 'What to wait on until the Winter Sale (17 Dec)'<br>C16 8 Oct: Verdict (C52) if played<br>C18 8 Oct: press preview (developers' materials)<br>C20 8 Oct: r/dataisbeautiful OC (C48)<br>C47 8 Oct: data posts only via C48<br>C48 8 Oct: r/dataisbeautiful: release congestion (C20)<br>C71 8 Oct: press preview<br>C02 9 Oct: D-006 SearchAction decision shipped; crawl shows zero 404s<br>C49 9 Oct: first Fix It Friday video<br>C54 9 Oct: live (D-038)<br>C71 9 Oct: emails<br>C63 10 Oct: Call of Duty (MW4 23 Oct) |
| 12 Oct 2026 | C03 12 Oct: D-008 collector utm columns + campaign breakdown in Filament<br>C13 12 Oct: wrap<br>C17 12 Oct: 'Call of Duty: Modern Warfare 4: release date, editions, early access, platforms'<br>C18 12 Oct: 'Next Fest October 2026: 20 demos to try' pre-list<br>C35 12 Oct: Buffy voice sheet applied to bot copy; announcement<br>C36 12 Oct: invite codes per campaign live; free listings (Disboard, Discadia) set up<br>C40 12 Oct: welcome sequence live (C42)<br>C42 12 Oct: live<br>C46 12 Oct: contextual link rule in the editor (ED)<br>C60 12 Oct: hub + 'Shader compilation stutter: what it is and every fix that works' (EA-001)<br>C69 12 Oct: curator page created, description written<br>C09 13 Oct: 'one week left' reminder<br>C06 14 Oct: Day 36: release-time tool ships (C08); countdown links switch to it<br>C08 14 Oct: tool live; countdown links switch<br>C21 14 Oct: query: count(*) where country is null reported<br>C22 14 Oct: launch with the September 2026 entries<br>C39 14 Oct: poll 3: 'Which WoW will you play from 4 Nov?'<br>C44 14 Oct: register page + redirect live<br>C48 14 Oct: r/Games (self-post, if rules allow): studios closed tracker (C22)<br>C38 15 Oct: midpoint voice chat<br>C66 15 Oct: update with any Sony statement; campaign review<br>C03 16 Oct: D-011 bot logs discord_join with invite code; readiness review by EIC<br>C11 16 Oct: D-020 decision: permission/attribution from gtadb.org or rebuild of the location set<br>C17 16 Oct: campaign early access (digital pre-orders)<br>C43 16 Oct: QA<br>C46 16 Oct: live<br>C56 16 Oct: C03 gate passed (EIC)<br>C60 16 Oct: 'Secure Boot and TPM 2.0 for anti-cheat games: how to enable safely' (EA-006)<br>C63 17 Oct: Resident Evil |
| 19 Oct 2026 | C04 19 Oct: Next Fest + MW4 week<br>C12 19 Oct: review by EIC<br>C18 19 Oct: fest opens; diary day 1<br>C23 19 Oct: query on game_series + hand check of top 50<br>C43 19 Oct: live; announcement<br>C45 19 Oct: live on /games/{slug} (unreleased), /calendar, /gta6/release-time<br>C50 19 Oct: script 'Every GTA game in order' (EIC)<br>C56 19 Oct: campaigns live<br>C71 19 Oct: fest (C18)<br>C09 20 Oct: close (per code comment; confirm the hour in admin)<br>C17 20 Oct: 'Which Call of Duty should I get?' comparison<br>C51 20 Oct: shortlist of 30 micro creators (GTA, WoW, PC, release-news) via Keymailer/Lurkit search and YouTube<br>C69 20 Oct: launch with 15 recommendations (Verdicts + Hidden Gems)<br>C09 21 Oct: winner post<br>C12 21 Oct: publish + carousel<br>C20 21 Oct: pitch follow-ups end<br>C21 21 Oct: map + Balkan table reviewed<br>C39 21 Oct: poll 4: 'MW4: which platform?'<br>C19 22 Oct: 'Horror games worth your Scream Fest money' list<br>C17 23 Oct: launch on PS5, Xbox, PC, Switch 2<br>C41 23 Oct: QA on staff accounts<br>C60 23 Oct: 'DXGI_ERROR_DEVICE_REMOVED and DEVICE_HUNG crashes explained' (EA-002)<br>C61 23 Oct: MW4 on Switch 2 (first CoD on a Nintendo platform since Ghosts)<br>C63 24 Oct: Final Fantasy VII (Revelation 8 Apr 2027) |
| 26 Oct 2026 | C18 26 Oct: fest ends; 'best demos' wrap<br>C19 26 Oct: Scream Fest opens: deal picks<br>C24 26 Oct: price capture starts (store launch price per notable release; manual log)<br>C41 26 Oct: first send (MW4 week wrap + Next Fest)<br>C44 26 Oct: Steam sign-in live (D-015); announcement<br>C51 26 Oct: first 5 emails (offer: a custom chart from C20/C21 or a WoW Analyzer segment)<br>C59 26 Oct: build (service worker, OneSignal free tier or native)<br>C61 26 Oct: hub live<br>C67 26 Oct: SC verifies Season 2 dates, multiplier and quests in admin (the seeded 'Summer of Gaming' season ended 21 Sep)<br>C61 27 Oct: Minecraft Bedrock on Switch 2<br>C14 28 Oct: 'WoW: Forever explained: which WoW should you play?'<br>C21 28 Oct: publish; regional pitches; OC post (C48)<br>C48 28 Oct: r/dataisbeautiful: studios per million people (C21)<br>C38 29 Oct: wrap thread<br>C18 30 Oct: 'Next Fest demos you can remind yourself about'<br>C57 30 Oct: D-031 Pixel + CAPI behind consent verified<br>C60 30 Oct: 'Windows 11 gaming settings checklist' (EA-004)<br>C19 31 Oct: Halloween: 'short horror you can finish tonight'<br>C63 31 Oct: Grand Theft Auto (VI 19 Nov)<br>C68 31 Oct: campaign closes or continues until 100 are awarded<br>C17 1 Nov: fold into Call of Duty series page (C63)<br>C67 1 Nov: launch |
| 2 Nov 2026 | C11 2 Nov: build starts<br>C15 2 Nov: template ready (D-032)<br>C19 2 Nov: fest ends<br>C23 2 Nov: review<br>C50 2 Nov: Release Radar: November<br>C55 2 Nov: studio list from /studios/country/ba and neighbours<br>C56 2 Nov: 14-day read; cut dead tool keywords<br>C57 2 Nov: wave 1: library demo vs GTA 6 reminder creative<br>C62 2 Nov: live (Scream Fest ends)<br>C65 2 Nov: Buffy posts automatically (bot job)<br>C14 4 Nov: launch day update + impressions<br>C23 4 Nov: publish + pitches<br>C58 6 Nov: landing pages checked (hub SSR, Analyzer copy)<br>C59 6 Nov: QA<br>C60 6 Nov: 'Steam content file locked and other update errors' (EA-003)<br>C63 7 Nov: Persona (4 Revival 18 Feb 2027)<br>C14 8 Nov: 'first week of WoW: Forever' follow-up; feeds /mmo (C15) |
| 9 Nov 2026 | C08 9 Nov: push opt-in at 'remind me' (C59)<br>C25 9 Nov: EIC checks IGDB terms for time-to-beat use (commercial use requires agreement; partner@igdb.com) — go/no-go<br>C51 9 Nov: GTA-focused wave (map tracker, ledger)<br>C55 9 Nov: A1 Adria League contact<br>C58 9 Nov: live<br>C59 9 Nov: live<br>C15 10 Nov: hub live<br>C24 11 Nov: publish<br>C39 11 Nov: 'GTA 6: day one or wait for reviews?'<br>C06 12 Nov: Day 7: final week format (one sourced fact + one tool)<br>C50 12 Nov: GTA pilot published<br>C61 12 Nov: Pikmin 4 Switch 2 Edition; Metaphor: ReFantazio on Switch 2<br>C31 13 Nov: D-027 in QA<br>C60 13 Nov: 'GPU driver clean install and rollback' (EA-007)<br>C63 14 Nov: Kingdom Hearts (IV late 2027) |
| 16 Nov 2026 | C04 16 Nov: GTA VI week (merged with C10)<br>C10 16 Nov: 'GTA 6 launch week: everything you need' article; Out This Week is GTA week<br>C11 16 Nov: feature-flagged QA<br>C26 16 Nov: Steam Web API terms read; pull script (DEV)<br>C28 16 Nov: build starts (D-025, D-024)<br>C49 16 Nov: platform decision<br>C55 16 Nov: first studio spotlight article<br>C62 16 Nov: Auto-Battler RPG Fest note<br>C10 17 Nov: editions + unlock times recap (if official); pre-load post<br>C06 18 Nov: Day 1<br>C10 18 Nov: Discord 'Launch Eve' voice/Stage event<br>C23 18 Nov: pitch follow-up before GTA week<br>C29 18 Nov: league opens (after nominees are public)<br>C36 18 Nov: GTA Launch Eve event<br>C58 18 Nov: mid read<br>C06 19 Nov: Launch day: handover to C10<br>C07 19 Nov: launch: rumours about the base game resolve; ledger shifts to Online/PC status<br>C08 19 Nov: launch<br>C10 19 Nov: launch: live blog (F20) from unlock; map tracker live (C11); 'What to do first' guide<br>C11 19 Nov: live with launch<br>C12 19 Nov: update from launch play<br>C24 19 Nov: GTA VI entry ($79.99 standard, $99.99 Ultimate)<br>C40 19 Nov: GTA launch special<br>C49 19 Nov: launch-week shorts (C10)<br>C10 20 Nov: Game Club November kicks off (C38)<br>C25 20 Nov: draft<br>C31 20 Nov: 'Price alerts are live' announcement<br>C38 20 Nov: November kickoff: GTA VI (day after launch)<br>C60 20 Nov: 'Game crashes to desktop with no error: triage' (EA-009)<br>C10 21 Nov: (to 22 Nov) launch verdict (C52) once an editor has played enough; first guides (money, cars, settings)<br>C63 21 Nov: Yakuza / Like a Dragon (Stranger Than Heaven 15 Jan 2027)<br>C57 22 Nov: wave 1 ends; read |
| 23 Nov 2026 | C25 23 Nov: publish<br>C58 25 Nov: end<br>C11 26 Nov: first adoption report<br>C25 27 Nov: Black Friday reshare<br>C31 27 Nov: Black Friday<br>C32 27 Nov: Black Friday roundup (same page, starts BF)<br>C60 27 Nov: 'Low GPU usage and CPU bottlenecks' (EA-008)<br>C63 28 Nov: Metro (2039 on 4 Feb 2027) |
| 30 Nov 2026 | C26 30 Nov: 'ending achievement' mapping reviewed by hand<br>C31 30 Nov: Cyber Monday (C32)<br>C32 30 Nov: Cyber Monday update<br>C32 30 Nov: newsletter special<br>C55 30 Nov: review<br>C27 1 Dec: outline<br>C30 1 Dec: nominations open (members suggest, 4 days)<br>C31 1 Dec: report<br>C33 1 Dec: 'Share your wishlist as a gift list' live<br>C38 1 Dec: December vote (3 candidates)<br>C51 1 Dec: TGA prediction league co-host offer<br>C57 1 Dec: wave 2: C57a continues only if the T2 stop-loss was not hit; otherwise C57c newsletter (26 §5.1)<br>C33 3 Dec: editorial gift guide<br>C38 3 Dec: GTA VI club night<br>C61 3 Dec: Xenoblade Chronicles 3 Switch 2 Edition<br>C60 4 Dec: 'Game launcher errors hub' (EA-005)<br>C61 4 Dec: Monster Hunter Wilds on Switch 2<br>C30 5 Dec: voting opens<br>C63 5 Dec: Monster Hunter (Wilds on Switch 2, 4 Dec)<br>C29 6 Dec: reminder |
| 7 Dec 2026 | C38 7 Dec: December kickoff<br>C50 7 Dec: Release Radar: December<br>C53 7 Dec: checklist review<br>C26 8 Dec: publish + OC post<br>C48 8 Dec: r/dataisbeautiful + r/patientgamers (if allowed): completion by genre (C26)<br>C28 10 Dec: QA with staff libraries<br>C29 10 Dec: predictions lock 1 h before the show; Discord watch party + F20 live thread<br>C36 10 Dec: TGA watch party<br>C29 11 Dec: leaderboard final; winners posted<br>C60 11 Dec: 'Can I run it? Reading system requirements before a sale'<br>C63 12 Dec: Tomb Raider (Legacy of Atlantis 12 Feb 2027) |
| 14 Dec 2026 | C28 14 Dec: live; members emailed<br>C33 14 Dec: reminder with Year in Review<br>C52 14 Dec: C53 submission<br>C53 14 Dec: submit<br>C57 14 Dec: end<br>C30 17 Dec: voting closes<br>C34 17 Dec: sale opens: picks live<br>C62 17 Dec: Winter Sale (C34)<br>C27 18 Dec: draft complete<br>C34 18 Dec: newsletter<br>C40 18 Dec: year-end issue<br>C63 19 Dec: Fable (23 Feb 2027)<br>C30 20 Dec: results<br>C33 20 Dec: last shipping-safe push (digital gifts only after) |
| 21 Dec 2026 | C28 21 Dec: reminder to those who haven't opened it<br>C38 21 Dec: December wrap<br>C70 21 Dec: '2027's most anticipated games, by date'<br>C26 22 Dec: follow-ups<br>C34 22 Dec: 'best of 2026 on sale'<br>C40 25 Dec: no issue (Christmas Day); next issue 1 Jan 2027 is optional<br>C63 26 Dec: God of War (Laufey 16 Feb 2027) |
| 28 Dec 2026 | C04 28 Dec: last issue of the year points at Q1 2027 (C70)<br>C34 28 Dec: 'Steam Awards voting explained' (if Valve runs voting in the sale, as in past years)<br>C70 28 Dec: Out This Week becomes 'Out in January 2027'<br>C22 30 Dec: year-end summary feeding C27<br>C24 31 Dec: year total feeds C27<br>C28 31 Dec: close of 2026 data<br>C36 31 Dec: count<br>C56 31 Dec: end-of-quarter read<br>C70 31 Dec: newsletter year-end + 2027 calendar<br>C63 2 Jan: Metroid (Ravenous 28 Jan 2027) |
| 4 Jan 2027 | C34 4 Jan: last-day post<br>C27 8 Jan: numbers re-run |
| 11 Jan 2027 | C27 12 Jan: publish |

## Capacity check (ESTIMATE)

Assumed weekly hours from the spine: EIC 40, ED 40, SC 25, DS 10, DEV 20 (≈135). Figures below come from the effort line of each campaign; they are estimates for planning, not measurements.

### Recurring weekly load from this library

| Role | Recurring items (h/week) | Total h/week | Left for news, reviews, admin |
|---|---|---|---|
| EIC | Verdict C52 (8), Reddit C47 (1), newsletter edit C40 (1), creators C51 (2), Game Club host C38 (0.5), Monday metrics review (0.5) | ≈13 | ≈27 h, of which PR bursts (C20, C21, C23, C26: ≈10 h each) take one week in four |
| ED | Out This Week C04 (1.5), ledger C07 (2), Studio Watch C22 (1.5), PC fix C60 (4), In Order C63 (3), Hidden Gem C64 (1), hubs C61/C62 (2), countdown fact check C06 (1) | ≈16 | ≈24 h for news; Next Fest week (C18) adds 3 h/day, so F10/F18 pause that week |
| SC | Out This Week C04 (2), countdown C06 (2.5), ledger C07 (1), Road to 500 C36 (3), WAYP C37 (1), poll C39 (1.5), newsletter C40 (3), Reddit C47 (3), video C49 (3), On This Day C65 (1.2; automation is 2027 per 32), gems C64 (0.5), fixes C60 (0.5) | ≈24 | ≈1 h; bursts (C18, C10) are paid for by skipping C65 on those days and cutting C49 to two videos that week |
| DS | template fills C04/C06/C07 (1.5), video C49 (1), campaign cards (2) | ≈4.5 | ≈5.5 h for one-off templates; the first two weeks are over (C04, C06, C07, C49 templates ≈17 h) — stagger: C04 + C06 in week 1, C07 + C49 in week 2 |
| DEV | alerts/job upkeep (2) | ≈2 | ≈18 h for the one-off build list below |

### One-off DEV hours by campaign start month

| Month | Campaigns with DEV work (h) | Total | Available (≈20 h/week) |
|---|---|---|---|
| Oct (from 28 Sep) | C01 10, C02 16, C03 30, C08 16, C09 1, C13 1, C20 8, C21 10, C23 4, C35 4, C40 4, C41 20, C42 12, C43 16, C44 24, C45 16, C46 16, C54 4, C59 16, C60 2, C61 8, C62 10, C65 4, C66 2, C67 2, C68 1 | 257 h | ≈100 h |
| Nov | C10 6, C11 24, C15 8, C25 3, C26 10, C28 40, C29 16, C31 20, C57 12 | 139 h | ≈80 h |
| Dec | C27 6, C33 6 | 12 h | ≈60 h |

**Reading it:** October asks for well over the DEV time available. The protected order is: C01 → C02 → C03 (P0 fixes and measurement, ≈56 h) → C08 (release-time tool by 14 Oct) → C46 end block → C44 register copy (D-014) → C45 guest remind → C43 release-day alerts → C42 welcome → C41 personalised email → C44 Steam sign-in (D-015). Anything that does not fit slips by one week at a time, and its marketing dates slip with it. **Cut order if DEV is short:** C59 push (keep email/DM), C29 league (fallback: one forum poll per category, scored by hand), C33 gift-list link (keep the editorial guide), C15 hub template (fold MMO pages into /guides), C11 map tracker (only if D-020 is also unresolved), C26 (move to January), C65 automation (keep manual).

### Delivery status after the DEV sprint plan

`32-DEVELOPMENT-BACKLOG.md` reached the same conclusion from the backlog side (demand about twice DEV capacity) and schedules 225 h to 31 Dec. The campaign records below keep the spine's dates, because the spine is canonical, and carry a delivery-status line with the DEV date and the no-DEV interim. Where copy announces a feature, it is held until the feature ships.

| Campaign | Delivery per 32 |
|---|---|
| C02 | D-002, D-004, D-005, D-017 land inside the window; D-003 (RSS) on 16 Oct; D-006 and D-022 in W51. Titles fixed by EIC through page SEO in Filament. Hold the RSS announcement copy until 16 Oct. |
| C15 | D-032 hub template slips to Jan 2027. Interim: ED publishes the MMO pillar article on /guides on 10 Nov; the hub absorbs it with a 301 in January. Hub copy is held until then. |
| C26 | D-044 extension scheduled 2027-W09. The campaign moves to the Q1 data calendar; 8 Dec copy is held. |
| C28 | D-025 built by 13 Dec, live 14 Dec as planned. |
| C29 | D-026 slips to 2027 (used for TGA 2027). Interim for 10 Dec: one forum poll per category plus Discord polls; SC scores in a sheet and Buffy posts the table on the night. Copy stays, with 'techplay.gg/awards/2026' replaced by the forum thread link. |
| C31 | D-027 price alerts ship 25 Nov (not 20 Nov). From 20 Nov, Deal Radar (F16) posts run without personalisation; the 'Price alerts are live' copy goes out on 25 Nov. |
| C36 | D-011 invite attribution slips to 2027-W07. Interim: SC reads 'uses' per invite code in Server Settings → Invites every Monday and logs them in the invite sheet. |
| C41 | D-028 first send 23 Nov (not 26 Oct). Out This Week (C04) covers the general version until then. |
| C42 | D-013 about 6 Nov. Interim: SC sends a short manual welcome campaign each Friday to that week's verified subscribers (Email 1 copy, trimmed). |
| C43 | Email channel about 6 Nov (D-013); Discord DM 2027-W06 (D-047). Interim: SC posts 'Out today' in Discord each morning from /calendar. Announcement copy is split: email part on 6 Nov, DM part in 2027. |
| C44 | D-014 register rewrite on time (by 26 Oct); D-015 Steam sign-in slips to 2027-W01. Steam stays 'connect after sign-up' and the welcome mail pushes it. Hold the 'Sign in with Steam' announcement copy until it ships. |
| C45 | D-016 lite version 18 Dec. Interim: 'Remind me' sends guests to /login?redirect= (after D-014). |
| C46 | D-010 slips to Feb 2027. Interim from 5 Oct: the D-012 newsletter form under articles, and ED adds 3–5 contextual links by hand to every article. |
| C54 | D-038 pages ship 18 Dec. Interim on 9 Oct: EIC's ownership, funding and AI-use text is published as an article linked from /about; pitches link that article until /press exists. |
| C56 | Needs D-007 and D-008; earliest start 2 Nov per 32 (26-PAID-MEDIA plans 19 Oct). No spend before measurement. |
| C57 | D-031 decision due 5 Oct. 32's default (Option A) drops C57 and November retargeting for 2026 and decides on 1 Jan 2027; 26-PAID-MEDIA budgets C57 from 2 Nov. Copy and creative here are ready for whichever date is chosen. |
| C59 | D-019 slips to a 1 Jan decision. Reminders go by email and bell only in 2026. |
| C60 | D-032 route slips to Jan 2027. Guides publish one by one on /guides as scheduled; a 'PC fixes' pillar guide lists them and is later redirected into /guides/pc-fixes. |
| C61 | D-032 hub template slips to Jan 2027. Interim: ED publishes a Switch 2 pillar article on 26 Oct with the edition tracker as a table; the hub absorbs it with a 301 in January. |
| C62 | D-032 hub template slips to Jan 2027. Interim: a Steam pillar article on 2 Nov (event calendar + weekly movers table); C34 Winter Sale picks run as a /news article linked from it. |
| C65 | D-049 automation scheduled 2027-W09. SC posts by hand through December. |
| On time | C07, C08, C09, C11, C12, C20, C21, C58, C68 |

## Paid budget (LEAN tier; spine §13)

| ID | Test | Window | LEAN | GROWTH | AGGRESSIVE | Gate | Stop-loss |
|---|---|---|---|---|---|---|---|
| C56 | Google branded (C56a) + tool exact (C56b) | from 19 Oct | $292 in Q4 (Oct $104, Nov $95, Dec $93) | + $155 tool terms in Dec if T7 passed | per 26 §5.3 | C03 passed 16 Oct | branded CPC > $1.00; tool term < 20 impressions/week after 14 days (R16 T1/T7) |
| C57 | Meta registration, US 18+ (C57a; C57b–f in GROWTH+) | 2–22 Nov, 1–14 Dec | $385 (Nov $189, Dec $196) | Nov $582 across a/b/c/d; Dec winner + retargeting + giveaway | per 26 §5.3 | D-031 Pixel + CAPI behind consent | $150 with < 5 verified accounts (R16 T2) |
| C58 | Reddit tool/hub (C58a GTA, C58b WoW, C58c Backlog) | 9–25 Nov | $0 | $306 in Nov (+$140 Dec extension with EIC sign-off) | per 26 §5.3 | D-020 for C58a; D-040 for C58b | $100 with < 20 Discord clicks or < 30 analyses (R16 T4/T5); CTR < 0.2% (T6) |
| | **Total Q4 (LEAN)** | | **$677** | up to $2,035 | up to $5,649 | | Monthly LEAN spend: Oct $104, Nov $284, Dec $289 (caps; unspent money is not rolled forward) |

Budgets follow `26-PAID-MEDIA.md` §5 exactly; that file holds the sub-line detail, gates G1–G13 and the retargeting and giveaway lines.

**Open conflict:** 26 budgets C57 from 2 Nov and C56 from 19 Oct; 32's default (Option A, decision due 5 Oct) drops C57 for 2026 and puts the earliest C56 start at 2 Nov. If Option A holds, LEAN Q4 spend falls to about $188 (C56 from 2 Nov only).

No other campaign has media spend here. Giveaway prizes: C09 uses what is already configured; the prize lines for C31a and C33a are costed in `25-GIVEAWAYS.md`.

## Tracking map (spine §10 events → campaigns)

| Event | Campaigns that report on it |
|---|---|
| `alert_clicked` | C03, C31, C34, C41, C43, C59 |
| `comment_created` | C10, C12, C18, C30, C37, C38, C39, C52, C60, C65, C67 |
| `cta_click` | C01, C02, C03, C04, C05, C06, C07, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27, C29, C30, C32, C33, C34, C39, C40, C45, C46, C47, C48, C49, C50, C51, C52, C53, C54, C55, C56, C58, C60, C61, C62, C63, C64, C65, C66, C67, C69, C70, C71 |
| `d1_return` | C03, C11, C28, C29, C43, C67 |
| `discord_click` | C02, C03, C05, C06, C35, C36, C46, C47, C58 |
| `discord_join` | C03, C06, C09, C10, C13, C18, C19, C29, C30, C35, C36, C37, C38, C42, C51, C55, C71 |
| `email_verified` | C03, C44, C57 |
| `game_followed` | C03, C45 |
| `giveaway_entered` | C03, C09 |
| `giveaway_task_done` | C09 |
| `library_connected` | C03, C05, C09, C10, C28, C42, C44, C57, C62, C68 |
| `list_created` | C19 |
| `newsletter_signup` | C03, C05, C07, C14, C15, C20, C21, C22, C23, C27, C32, C34, C40, C46, C60, C61, C66 |
| `newsletter_verified` | C03, C40, C42 |
| `notification_enabled` | C08, C31, C59 |
| `rating_created` | C52 |
| `registration_complete` | C01, C03, C04, C05, C08, C09, C10, C11, C13, C28, C29, C30, C31, C33, C34, C40, C42, C44, C45, C56, C57, C58, C62, C68 |
| `registration_start` | C01, C03, C44, C46 |
| `reminder_delivered` | C03, C08, C10, C31, C41, C43, C59 |
| `reminder_set` | C03, C04, C06, C07, C08, C16, C17, C18, C40, C43, C45, C49, C50, C57, C61, C63, C70, C71 |
| `share_card_generated` | C03, C28 |
| `shelf_add` | C03, C04, C10, C11, C16, C17, C18, C19, C25, C31, C32, C33, C34, C37, C38, C41, C42, C46, C52, C61, C63, C64, C68, C70 |
| `social_share` | C04, C06, C07, C12, C20, C21, C22, C23, C24, C25, C26, C28, C33, C48, C49, C64, C66 |
| `tool_run` | C03, C08, C13, C14, C15, C47, C51, C56, C58 |

## Part 32 — Campaign library, with Part 33 exact copy

### C01–C03: Foundations: trust, plumbing, measurement

#### C01 — Trust Reset — remove false claims site-wide

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also Trust / PR hygiene) | T1 must | Mon 28 Sep 2026 → Fri 2 Oct 2026 | S1, S2, S5, S8, S10 | site, Discord, newsletter | DEV (build), EIC (wording and sign-off) | DEV 10 h, EIC 3 h, SC 0.5 h | $0 |

**Goal.** Remove every public number and promise TechPlay cannot back before any promotion starts, so that a partner, journalist or new member who checks a claim finds it true [R02, R11, R23].  
**KPI.** False-claim count = number of the 95 audited URLs whose server-rendered HTML contains any string on the banned list (15K+, 50K+, 140,000+, 'thousands of fans', '50K+ players analyzed', '4.9/5', 'March 2, 2026', 'Earn XP for every comment and article you read', '24/7 COMMUNITY').  
**TARGET.** 0 by Fri 2 Oct 2026 (DOWN from at least 10 distinct false strings on 27 Sep [R02 App. B]).  
**Core message.** Numbers on TechPlay come from the database or they do not appear.  
**Proof.** About page already reads live counts (333,920 games, 57,630 studios) [R02 §2.1]; the correction policy on /about promises visible corrections.

**Key moments.** 2026-09-28 — DEV starts D-001, D-040, D-029 · 2026-09-30 — EIC reviews every replacement line · 2026-10-02 — grep of 95 URLs returns zero hits; correction note posted

**Acceptance criteria.**
- [ ] /register and /login: '15K+ MEMBERS · 50K+ GAMES · FREE FOREVER' and '24/7 COMMUNITY' removed; replaced by the homepage account pitch ('One library, every platform' / 'Hours counted without you' / 'Your taste, in numbers' / 'How close your taste is to anyone else's') with the game count read from the API (D-001).
- [ ] Perk 'Earn XP for every comment and article you read' changed to 'Earn XP for comments, reviews and the games you finish' on register, login and SignInWall (D-001).
- [ ] '140,000+' removed from the /games title and five meta descriptions; replaced with the API count or no number (D-001).
- [ ] GTA 6 newsletter block: 'Join thousands of fans' replaced with 'Get the GTA 6 briefing: confirmed facts, dates and tools, once a week until launch.' (D-001).
- [ ] WoW Analyzer: '50K+ players analyzed · 4.9/5 rating' and 'Midnight launches March 2, 2026' removed; H1 and meta re-aimed at the current patch; OG image recompressed to ≤300 KB and renamed without a space (D-040).
- [ ] Zero-value modules hidden for guests: forum stats bar, 'Most read', 'Coming out', 'Rising Players', 'Recent winners', 'Most wishlisted', Last Disc counters until they hold a real value (D-029).
- [ ] /hardware and /reviews titles no longer promise 'benchmarks' (EIC wording).
- [ ] Scripted grep across the 95 URLs from R02 returns zero banned strings; result pasted into the campaign sheet.

**Exact copy (Part 33).**

- **X:** A correction, on the record: our sign-up page claimed "15K+ members". That was never true, and it is gone, along with a promise of XP for reading articles. Numbers on TechPlay now come from the database or not at all.
- **Bluesky:** A correction, on the record: our sign-up page claimed "15K+ members". It was never true and it is gone, along with a promise of XP for reading articles. Numbers on TechPlay now come from the database or not at all.
- **Discord:** Housekeeping from the editors. Our sign-up and login pages said "15K+ members" and "50K+ games". The first was never true. The catalogue is 333,000+ games, so the second was wrong the other way. We also promised XP for reading articles, which the site stopped awarding in August. All of it is gone. Numbers on TechPlay now come from the database or they do not appear. Spot one that looks off? Tell us in #suggestions.
- **Newsletter blurb:** One housekeeping note: we removed numbers from our sign-up page that were wrong, including a member count we could not back. If you ever see a TechPlay figure that looks off, reply to this email.

*Corrections log entry (/about corrections section)*
> 2 Oct 2026 — The register and login pages claimed 15K+ members and 50K+ games, and promised XP for reading articles. The member figure was never accurate; the catalogue holds 333,000+ games; reading has not earned XP since 11 Aug 2026. The claims were removed. The WoW Analyzer's usage and rating figures were removed for the same reason.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* Not used. · *web banner:* None. This campaign removes claims; it does not advertise.

**CTA.** None (correction). Secondary: 'Tell us in #suggestions'.  
**Landing page.** https://techplay.gg/register (fixed page); https://techplay.gg/about (corrections entry)  
**UTM example.** `https://techplay.gg/about?utm_source=discord&utm_medium=community&utm_campaign=c01-trust-reset&utm_content=announcement-a`  
**Tracking.** `registration_start`, `registration_complete`, `cta_click`  
**Follow-up.** Re-run the grep on the 1st of every month; any new hard-coded number needs an API source. EIC decides whether the X/Bluesky correction posts go out or only the corrections-log entry (both are optional; the site fix is not).  
**Dependencies.** D-001, D-040, D-029, C02  
**Risks.** Public correction draws attention to past claims; mitigated by publishing it quietly (log + Discord) if EIC prefers.

#### C02 — Plumbing Sprint — breadcrumbs, RSS, dead invites, SearchAction, GTA page relation, titles

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Product) | T1 must | Mon 28 Sep 2026 → Fri 9 Oct 2026 | S1, S3, S4, S8 | site, RSS, Discord, X | DEV | DEV 16 h, ED 1 h (GTA relation check), SC 0.5 h | $0 |

**Goal.** Fix the systematic 404s and wrong relations that every article and the GTA 6 hub carry today, so that crawl budget, RSS readers and Discord clicks stop landing on errors [R02 §11, R13, R17].  
**KPI.** Broken-link count = (article breadcrumb 404s) + (RSS items with 404 links) + (dead Discord invites in code) + (GTA 6 articles attached to /games/gta-6), measured by a crawl of all published articles.  
**TARGET.** 0 by Fri 9 Oct 2026 (DOWN from: breadcrumb 404 on every article; all RSS hardware items; 2 dead invite codes; 5+ GTA VI stories on the parody entry).  
**Core message.** The feed works again: follow TechPlay in any RSS reader or Discover.  
**Proof.** RSS hardware links pointed to /tech/<slug> (404) and lagged ~24 h [R02 §1, R07 §3.10].

**Key moments.** 2026-09-28 — D-004 dead invites replaced (XS, first task) · 2026-10-01 — D-002 breadcrumbs + D-003 RSS live · 2026-10-05 — D-005 GTA relation + D-017 hub SSR H1/counters · 2026-10-09 — D-006 SearchAction decision shipped; crawl shows zero 404s

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-002, D-004, D-005, D-017 land inside the window; D-003 (RSS) on 16 Oct; D-006 and D-022 in W51. Titles fixed by EIC through page SEO in Filament. Hold the RSS announcement copy until 16 Oct.

**Acceptance criteria.**
- [ ] Every article breadcrumb category href resolves 200 (/news/industry, /news/gaming, /hardware/news) (D-002).
- [ ] /rss and /feed: hardware items link to /hardware/<slug>; feed regenerates on publish; newest item timestamp within 5 minutes of sitemap-news (D-003).
- [ ] No occurrence of discord.gg/techplaygg or discord.gg/techplay in the codebase or settings seeders; all invites use https://discord.gg/wPQG9gUMXH (D-004).
- [ ] All GTA VI articles related to /games/grand-theft-auto-vi; /games/gta-6 renamed so name matching cannot pick it; hub links to game page and calendar and back (D-005).
- [ ] WebSite SearchAction removed from JSON-LD or pointing to a working, indexable search page (D-006, EIC decides).
- [ ] /gta6 has a real H1 and server-rendered counters (days to launch, 1,058 locations, 12 characters); OG images ≤300 KB (D-017).
- [ ] Truncated titles fixed; author URLs unified (/author/adi → 301 to /author/adi-zeljkovic) if DEV time allows (D-030, optional).

**Exact copy (Part 33).**

- **X:** Housekeeping: the TechPlay RSS feed is fixed. Hardware links no longer 404 and new articles reach the feed when they publish, not a day later. Works with Feedly, Inoreader and Discover follow: techplay.gg/rss
- **Bluesky:** The TechPlay RSS feed is fixed: hardware links no longer 404, and new articles land in the feed as they publish. If you read gaming news in Feedly, Inoreader or any reader: techplay.gg/rss
- **Discord:** Two fixes worth knowing. 1) The Discord button on our GTA 6 hub pointed at a dead invite. If you tried it and got an error, that was us; it now brings you here. 2) The RSS feed is fixed, so #latest-news and any reader you use get articles as they publish. Feed: https://techplay.gg/rss
- **Newsletter blurb:** Small fix, useful if you use an RSS reader: techplay.gg/rss now carries every article as it publishes, hardware included.

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Not required. Optional: plain card 'RSS: techplay.gg/rss' in brand type, no imagery.

**CTA.** Follow the RSS feed  
**Landing page.** https://techplay.gg/rss  
**UTM example.** `https://techplay.gg/gta6?utm_source=discord&utm_medium=community&utm_campaign=c02-plumbing&utm_content=hub-link-fixed`  
**Tracking.** `discord_click`, `cta_click`  
**Follow-up.** Monthly crawl of articles for 404s; a failed crawl blocks promotion of the affected section. Link-check the GTA hub before every C06/C10 push.  
**Dependencies.** D-002, D-003, D-004, D-005, D-006, D-017, D-030

#### C03 — Measurement Foundation — GA4 key events, UTM capture, campaign URL helper, invite codes

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Analytics | T1 must | Mon 28 Sep 2026 → Fri 16 Oct 2026 | S10 | site, GA4, first-party collector, Discord bot | DEV (build), EIC (sign-off), SC (invite codes and sheet) | DEV 30 h, SC 3 h, EIC 2 h | $0 |

**Goal.** Make every campaign in this library measurable: canonical events fire, UTM parameters survive into the first-party collector, every link is built by one helper, and Discord joins are attributed by invite code [R16 §4, R23 #11].  
**KPI.** Coverage = canonical events from spine §10 verified firing in GA4 DebugView ÷ 27; plus share of campaign sessions in the collector with a non-empty utm_campaign.  
**TARGET.** 27/27 events verified and ≥95% of links in the campaign sheet built by the helper by Fri 16 Oct 2026; zero paid spend until then (gate for C56–C58).  
**Core message.** Internal: if a link is not built by the helper, it does not exist in the report.  
**Proof.** Collector drops utm_* by design; GA4 has only onboarding events; no ad pixel [R16 §0].

**Key moments.** 2026-10-02 — D-009 campaign URL helper usable by SC · 2026-10-07 — D-007 key events (registration_complete, email_verified, library_connected, newsletter_verified, discord_click) in GA4 · 2026-10-12 — D-008 collector utm columns + campaign breakdown in Filament · 2026-10-16 — D-011 bot logs discord_join with invite code; readiness review by EIC

**Acceptance criteria.**
- [ ] All 27 event names in spine §10 exist in the frontend track registry (lib/track.ts FunnelEvent union) or are sent server-side; parameters as specified (method, from, platform, status, channel, campaign, invite code, network, content_type, tool, type, cta_id).
- [ ] registration_complete, email_verified, library_connected, newsletter_verified, reminder_set and discord_click marked as GA4 key events.
- [ ] analytics_events stores utm_source, utm_medium, utm_campaign (lower-case); RollUpAnalytics has a campaign dimension; README Baza section updated in the same commit.
- [ ] Campaign URL helper (admin form + backend function) produces links per spine §9 and logs each generated URL to the campaign sheet.
- [ ] Professor Buffy records the invite code on member join (discord_join) and SC has one invite code per campaign (C04, C06, C09, C13, C18, C20, C29, C35, C36, C40, C57, C58 at minimum).
- [ ] Consent: nothing new fires before consent in EEA/UK/CH; privacy page line added.
- [ ] A one-page weekly dashboard (Filament) shows: registrations by from=, verified subscribers, reminders set, discord joins by invite code, top utm_campaign sessions.

**Exact copy (Part 33).**

*Internal launch note (Discord #staff, 16 Oct)*
> Measurement is live. From today every link we post goes through the campaign URL helper in the admin (Marketing → Campaign links). Pick the campaign ID, the platform and the asset; copy the link it gives you. Discord invites: use the code for the campaign in the invite sheet, never the generic one. If a post goes out with a bare link, it counts as organic noise and we learn nothing from it. Weekly numbers land in the dashboard every Monday at 09:00.  

*Privacy page line (added under 'Analytics')*
> When you arrive through one of our own links, the link carries a campaign name (utm parameters). We store that name with the page view so we know which posts, emails and ads are worth making. It is not linked to your identity, and it is only recorded where you have consented to analytics.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* None public. Internal: one-page Filament dashboard layout (DEV), no design work.

**CTA.** Internal only  
**Landing page.** Internal (Filament dashboard); public: https://techplay.gg/privacy  
**UTM example.** `https://techplay.gg/calendar?utm_source=x&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-thread-a`  
**Tracking.** `registration_start`, `registration_complete`, `email_verified`, `library_connected`, `shelf_add`, `game_followed`, `reminder_set`, `reminder_delivered`, `alert_clicked`, `newsletter_signup`, `newsletter_verified`, `discord_click`, `discord_join`, `giveaway_entered`, `tool_run`, `share_card_generated`, `d1_return`, `cta_click`  
**Follow-up.** Monday metrics review uses this dashboard (15 min, EIC + SC). Any campaign with <90% helper-built links is flagged in the review.  
**Dependencies.** D-007, D-008, D-009, D-011, D-031 (Pixel+CAPI, later, before C57)

### C04–C05: Weekly release rhythm and the first sale

#### C04 — Out This Week (F01)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Social (also SEO / content) | T1 must | Mon 28 Sep 2026 → Mon 28 Dec 2026 | S1, S2, S6, S7 | site article, Instagram carousel, TikTok, YouTube Shorts, Instagram Reels, Facebook Page, X thread, Threads, Bluesky, Discord, newsletter | ED (article, Fri pull) / SC (social) / DS (template once, then 20 min fills) | ED 1.5 h/week, SC 2 h/week, DS 0.5 h/week (template 4 h once) | $0 |

**Goal.** Make Monday's release list the one weekly post people expect from TechPlay, and turn each view into a reminder or calendar visit [R19 pipeline 1, R05].  
**KPI.** Reminders per issue = reminder_set events with utm_campaign=c04-out-this-week in 7 days after posting; plus calendar sessions from C04 links ÷ total C04 impressions (per platform).  
**TARGET.** UP week over week for 6 weeks; by week 6 (2 Nov) at least one platform chosen as the video home (C49) based on calendar sessions per post.  
**Core message.** Every notable release this week, with platforms and a remind-me button.  
**Proof.** The release calendar server-renders the whole month (1,422 September releases) and each game page has platforms and store links [R02 §4.4].

**Key moments.** Every Monday 09:00 CET: article + social set · 2026-09-28 — issue 1 (28 Sep–4 Oct) · 2026-10-05 — issue 2 (Gears of War: E-Day week) · 2026-10-19 — Next Fest + MW4 week · 2026-11-16 — GTA VI week (merged with C10) · 2026-12-28 — last issue of the year points at Q1 2027 (C70)

**Exact copy (Part 33).**

- **Facebook:**

> Out this week, 28 Sep to 4 Oct:  
> • Minecraft Dungeons II — Tue 29 Sep  
> • Ghost of Yōtei Complete Edition, with the Most Wanted mode — Thu 1 Oct (reported)  
> • Ace Combat 8: Wings of Theve — Fri 2 Oct  
> • Steam Autumn Sale — 1 to 8 Oct  
> Platforms, prices and a reminder button for each game are on the calendar: techplay.gg/calendar  

- **Facebook Groups:** Participation only: when a group member asks what is coming out, answer in the thread with the two or three games that fit the group and link the calendar once. No roundup link posts.
- **Instagram:**

> Carousel (6 slides). S1: OUT THIS WEEK / 28 Sep – 4 Oct. S2: Minecraft Dungeons II / Tue 29 Sep. S3: Ghost of Yōtei Complete Edition + Most Wanted mode / Thu 1 Oct (reported). S4: Ace Combat 8: Wings of Theve / Fri 2 Oct. S5: Steam Autumn Sale / 1–8 Oct. S6: Full week, platforms, reminders / link in bio.  
> Caption: Four dates for your week. Which one are you playing? Platforms, prices and a remind-me button for every release are on the TechPlay calendar (link in bio).  

- **TikTok script:** 30 s, no presenter, cover art + text. 0–2 s: text 'Out this week' over a fast cut of four covers. 2–8 s: 'Tuesday: Minecraft Dungeons II'. 8–14 s: 'Thursday: Ghost of Yōtei Complete Edition (reported)'. 14–20 s: 'Friday: Ace Combat 8: Wings of Theve'. 20–26 s: 'And the Steam Autumn Sale runs 1–8 Oct'. 26–30 s: 'Every release, with reminders: techplay.gg/calendar'. On-screen caption: 'Which one?' Sound: neutral library track.
- **X:**

> Out this week (28 Sep–4 Oct):  
> Tue — Minecraft Dungeons II  
> Thu — Ghost of Yōtei Complete Edition + Most Wanted mode (reported)  
> Fri — Ace Combat 8: Wings of Theve  
> 1–8 Oct — Steam Autumn Sale  
> Platforms + reminders: techplay.gg/calendar  

- **Threads:** Four dates for this week: Minecraft Dungeons II (Tue), Ghost of Yōtei Complete Edition with the Most Wanted mode (Thu, reported), Ace Combat 8 (Fri), and the Steam Autumn Sale from Thursday to next Thursday. Which one are you picking up?
- **Bluesky:** Out this week: Minecraft Dungeons II (Tue 29 Sep), Ghost of Yōtei Complete Edition (Thu 1 Oct, reported), Ace Combat 8: Wings of Theve (Fri 2 Oct), Steam Autumn Sale (1–8 Oct). Platforms and reminders: techplay.gg/calendar
- **Reddit angle:** No link posts. Use the calendar to answer release-date questions where they are asked (r/gaming Simple Questions Sunday, platform subreddits), in plain text, linking only when the link answers the question (C47 rules).
- **Discord:** Buffy in #announcements, Mon 09:00: "Out this week — Tue: Minecraft Dungeons II. Thu: Ghost of Yōtei Complete Edition (reported). Fri: Ace Combat 8: Wings of Theve. Steam Autumn Sale runs 1–8 Oct. Set reminders on the calendar and I will ping you on release day once alerts go live: https://techplay.gg/calendar"
- **YouTube:** Shorts upload of the TikTok cut. Title: 'Out this week: 28 Sep – 4 Oct (Minecraft Dungeons II, Ace Combat 8)'. Description first line: 'Every release with platforms and reminders: techplay.gg/calendar'.
- **Shorts/Reels script:** VO-free. Frame 1 (0–2 s) 'OUT THIS WEEK' + date range. Frames 2–5, one game each, 5–6 s: cover left, day + date right, one line of what it is (genre, platforms if confirmed). Frame 6 (last 4 s): 'Reminders: techplay.gg/calendar'. Same file to TikTok, Shorts, IG Reels, FB Reels.
- **Newsletter blurb:** Next week's releases: the Monday list is on the calendar with a remind-me button on every game. [3 games + dates, pulled Friday]

*Site article title and dek (weekly template)*
> Title: Out this week: [date range] — [Game A], [Game B] and [Game C]  
> Dek: Every notable release this week with platforms, price at launch and a reminder button. Updated if a date moves.  
> Body: one H2 per day; per game: two sentences (what it is; what is new), platforms, launch price if the store lists one, links to the game page and store. Close with 'Also out' (up to 10 smaller releases) and 'Dates that moved this week'.  

Not used for this campaign: Push text, Ad copy.

**Creative.** *1080x1350:* Carousel: black background, cover art cropped 4:5, day in large type, date and platform line under it; last slide a calendar screenshot with 'Remind me' highlighted. · *1080x1920:* Short-video frames from the same template; Stories version with a link sticker to the calendar. · *1080x1080:* Facebook and X single-image variant: four covers in a grid with the days. · *1280x720 thumbnail:* Site article hero: four covers in a row with 'Out this week' and the date range. · *web banner:* Homepage strip 'Out this week' linking to the article (970x90 / 320x100).

**CTA.** Set a reminder on the calendar  
**Landing page.** https://techplay.gg/calendar (and the weekly article on /news)  
**UTM example.** `https://techplay.gg/calendar?utm_source=instagram&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-carousel-a`  
**Tracking.** `cta_click`, `reminder_set`, `shelf_add`, `registration_complete`, `social_share`  
**Follow-up.** Week 6 review (2 Nov): keep the platform with the best calendar sessions per post as the video home; drop the lowest. Merge into C10 in GTA week; hand over to C70 on 28 Dec.  
**Dependencies.** C03, C45 (guest remind-me from 19 Oct), C43 (release-day alerts from 19 Oct), C49

#### C05 — Steam Autumn Sale: Wishlist Picks

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Seasonal (also Social / Email) | T2 should | Thu 1 Oct 2026 → Thu 8 Oct 2026 | S7, S1, S3, S2 | site article, Instagram carousel, Facebook, X, Threads, Bluesky, Discord #deals, newsletter | ED (picks, article) / SC (social, Discord) | ED 5 h, SC 3 h, DS 2 h | $0 (No paid spend: paid is gated until 19 Oct.) |

**Goal.** Use the first fixed Steam event of the quarter to show what a connected library is for, and collect newsletter and Discord sign-ups from deal hunters [R05 §7, R06 #20].  
**KPI.** Sign-ups per 1,000 article sessions = (newsletter_signup + registration_complete with from=c05) ÷ article sessions × 1,000; library_connected with utm_campaign=c05-steam-autumn-sale.  
**TARGET.** first measured baseline (this is the first sale campaign); set the Winter Sale (C34) target at 1.5× this ratio.  
**Core message.** Twenty picks worth your money in the Autumn Sale, and what to skip until December.  
**Proof.** Steam Autumn Sale 1–8 Oct and Winter Sale 17 Dec–4 Jan are on Valve's public calendar [R05]; every pick links to its TechPlay game page.

**Key moments.** 2026-09-30 — article drafted with placeholders; picks list chosen from games with ≥ the site's hidden-gem rating threshold · 2026-10-01 — sale opens: article live, social set, Discord pin · 2026-10-02 — The Save File issue 1 carries the picks (C40) · 2026-10-05 — mid-sale update: 5 more picks · 2026-10-08 — last day post: 'What to wait on until the Winter Sale (17 Dec)'

**Exact copy (Part 33).**

- **Facebook:** The Steam Autumn Sale runs until 8 October. We picked [N] games worth buying at their sale price and noted which ones usually go lower in the Winter Sale (17 Dec). Each pick links to its game page with platforms and store links: [link]
- **Instagram:**

> Carousel (8 slides). S1: STEAM AUTUMN SALE / 1–8 Oct / Picks worth the money. S2–S7: one game each: cover, '[price] (−[discount]%)', one line why. S8: 'Full list + what to wait for: link in bio'.  
> Caption: Our picks from the Autumn Sale, checked on day one. Prices change during the sale; the article is updated when they do.  

- **X:** Steam Autumn Sale (until 8 Oct): [N] picks worth the sale price, and a short list of what usually drops further in the Winter Sale on 17 Dec. [link]
- **Threads:** The Steam Autumn Sale is on until 8 October. Our rule for the picks: games we would recommend at full price, now cheaper. Plus a list of what to leave for December. What's on your cart?
- **Bluesky:** Steam Autumn Sale picks (1–8 Oct): games we would recommend at full price, now cheaper, and what to leave for the Winter Sale on 17 Dec. [link]
- **Reddit angle:** No self-links in r/GameDeals or r/Steam. When someone asks 'is X worth it at this price', answer with the reason and, if TechPlay has a Verdict or game page that helps, link it once, disclosing it is ours (C47).
- **Discord:** #deals pin (Buffy): "The Steam Autumn Sale is on until 8 Oct. Staff picks, updated during the sale: [link]. Post your own finds in this channel; the best three go in Friday's newsletter with credit."
- **Newsletter blurb:** Steam Autumn Sale, until 8 Oct: [N] picks worth the money, and three games that usually go lower in the Winter Sale. [link]

*Article title and structure*
> Title: Steam Autumn Sale 2026: [N] picks worth the money (and what to wait for)  
> Dek: Checked on 1 Oct. Updated during the sale. Each pick links to its TechPlay game page.  
> Sections: Best under $10 / Best under $20 / Bigger games at their lowest this year (only where a store shows it; no invented price history) / Wait for the Winter Sale / How to see your own wishlist here (connect Steam).  
> Affiliate: if any store link is an affiliate link, the disclosure line sits above the first pick.  

Not used for this campaign: Facebook Groups, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Carousel: Steam-blue accent, cover, sale price large, discount small, one-line verdict. · *1080x1080:* FB/X card: 'Steam Autumn Sale — picks worth the money' + 4 covers. · *1080x1920:* Story: countdown sticker to 8 Oct 19:00 CET (Valve's end time to be checked) + link sticker. · *1280x720 thumbnail:* Article hero: 6 covers on a shelf graphic, 'Autumn Sale picks'. · *web banner:* Homepage strip 'Autumn Sale picks' until 8 Oct.

**CTA.** Read the picks; connect Steam to bring your wishlist to TechPlay  
**Landing page.** https://techplay.gg/news/steam-autumn-sale-2026-picks (article on /news); connect: https://techplay.gg/register?from=c05  
**UTM example.** `https://techplay.gg/news/steam-autumn-sale-2026-picks?utm_source=facebook&utm_medium=organic-social&utm_campaign=c05-steam-autumn-sale&utm_content=f16-post-a`  
**Tracking.** `cta_click`, `newsletter_signup`, `registration_complete`, `library_connected`, `discord_click`  
**Follow-up.** 8 Oct wrap post; ratio feeds C31/C34 targets. Game pages of the picks get a 'Deals' mention in C62 once /steam exists.  
**Dependencies.** C02 (RSS/links), C03 (UTMs), C40 (issue 1), C46 (article CTA block, partial)

### C06–C12: GTA VI (to 19 Nov and launch week)

#### C06 — GTA 6 Countdown ('X days to Vice City', F02)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Social (also Community) | T1 must | Mon 28 Sep 2026 → Thu 19 Nov 2026 | S4, S10, S1 | Instagram Stories, Facebook Stories, X, Threads, Discord #gta6, YouTube Shorts (3/week), TikTok (3/week) | SC (daily posting) / DS (template once) / ED (fact check against ledger) | SC 15 min/day + 45 min/week video, DS 4 h once, ED 10 min/day | $0 |

**Goal.** Own a daily, low-cost GTA 6 habit that ends in a reminder or a hub visit, using only confirmed facts [R17 §4, R13 ritual 23].  
**KPI.** Reminder conversion = reminder_set on /games/grand-theft-auto-vi or /gta6/release-time with utm_campaign=c06-gta6-countdown ÷ C06 link clicks; secondary: Story replies, Discord #gta6 messages per day.  
**TARGET.** 52 consecutive daily posts with zero unconfirmed claims; reminder conversion UP month over month (Oct vs Nov).  
**Core message.** [N] days to Vice City. One confirmed fact a day, and a reminder when it matters.  
**Proof.** Every card carries its source (Rockstar Newswire, Xbox store, IGN) from the C07 ledger [R17 §2].

**Key moments.** 2026-09-28 — Day 52 · 2026-10-14 — Day 36: release-time tool ships (C08); countdown links switch to it · 2026-11-12 — Day 7: final week format (one sourced fact + one tool) · 2026-11-18 — Day 1 · 2026-11-19 — Launch day: handover to C10

**Exact copy (Part 33).**

- **Facebook:** Stories only (same frames as Instagram).
- **Instagram:**

> Story frame template: '[N] DAYS TO VICE CITY' / fact line / source line / link sticker 'Remind me'.  
> Seed facts (confirmed only):  
> Day 52 (28 Sep): GTA VI launches Thursday 19 November on PS5 and Xbox Series X|S. Source: Rockstar Newswire.  
> Day 51: Standard edition $79.99. Source: IGN, 24 Jun 2026.  
> Day 50: Ultimate Edition $99.99. Source: IGN, 24 Jun 2026.  
> Day 49: No PC version at launch. Source: IGN on Take-Two's CEO, 4 May 2026.  
> Day 48: At launch Rockstar calls it 'a single-player experience'. Source: IGN, 24 Jun 2026.  
> Day 47: Pre-orders opened 25 June, with the Vintage Vice City Pack as a bonus. Source: Rockstar Newswire.  
> Day 46: 'An Extended Look' gameplay was captured on PS5. Source: Rockstar Newswire.  
> Day 45: GTA VI: The Album, with Atlantic Records, releases the same day. Source: Rockstar Newswire.  
> Day 44: The Vice City collector's set costs about $400 and does not include the game. Source: Rockstar Newswire.  
> Day 43: Two earlier dates were announced before 19 November. Source: Rockstar Newswire.  
> Day 42: 1,058 marked locations on the TechPlay GTA 6 map (map attribution per D-020).  
> Day 41: 12 character profiles, Jason and Lucia first. Source: hub + Rockstar.  
> From Day 40, facts come from the ledger (C07); anything marked Reported carries the word 'Reported'; rumours never appear.  

- **TikTok script:** Mon/Wed/Fri. 12 s: black screen, number counts down from [N+1] to [N] (1 s); fact appears line by line (8 s); source line; end card 'Reminders: techplay.gg/gta6' (3 s). Official art or Rockstar screenshots only, credited; no leaked footage.
- **X:**

> [N] days to Vice City.  
>
> [Fact.]  
>
> Source: [source, date]. Every confirmed fact, with sources: techplay.gg/gta6  

- **Threads:** [N] days to Vice City. Today's confirmed fact: [fact] ([source]). What's the one thing you still want Rockstar to confirm before launch?
- **Reddit angle:** Not used for countdown posts (r/GTA6 has its own countdown threads). Answer factual questions there with the ledger when it helps (C47).
- **Discord:** Buffy in #gta6 daily 10:00 CET: "[N] days to Vice City. Today's confirmed fact: [fact] (source: [source]). Tomorrow's is picked from your questions: reply with what you want checked."
- **YouTube:** Shorts upload of the TikTok cut, same title pattern: '[N] days to GTA 6: [fact in 6 words]'.
- **Shorts/Reels script:** 12 s vertical. 0–1 s count flips to [N]. 1–9 s fact typed in 2–3 lines. 9–10 s source line. 10–12 s 'Set a reminder: techplay.gg/gta6'. Captions burned in.
- **Newsletter blurb:** GTA 6: [N] days left. This week's confirmed facts, with sources, are in the briefing below (C07).

Not used for this campaign: Facebook Groups, Bluesky, Push text, Ad copy.

**Creative.** *1080x1920:* Story/short frame: huge day number in brand red, fact in white, source in grey at the bottom, small Buffy corner mark. · *1080x1080:* X/Threads card version of the same frame. · *1080x1350:* Weekly recap carousel (Sundays): the week's seven facts. · *1280x720 thumbnail:* Shorts cover: '[N] days' in large type over official key art (credited). · *web banner:* Hub counter is the banner: server-rendered 'Days to launch' on /gta6 (D-017).

**CTA.** Set a GTA 6 reminder  
**Landing page.** https://techplay.gg/gta6 (until 14 Oct), then https://techplay.gg/gta6/release-time (new)  
**UTM example.** `https://techplay.gg/gta6/release-time?utm_source=instagram&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-day36-story`  
**Tracking.** `cta_click`, `reminder_set`, `discord_click`, `discord_join`, `social_share`  
**Follow-up.** 19 Nov handover to C10; the Discord countdown becomes 'Day [N] in Vice City' for launch week only, then stops.  
**Dependencies.** C07 (ledger as fact source), C08 (release-time tool from 14 Oct), D-017, D-020 (map attribution before Day 42 card), D-004  
**Risks.** Repetition fatigue: Sunday recap replaces the daily frame if replies drop two weeks running. Delay risk: if Rockstar moves the date, the countdown stops the same day and the ledger explains.

#### C07 — GTA 6 Confirmed-or-Rumour Ledger (F03)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Social / trust) | T1 must | Thu 1 Oct 2026 → Thu 31 Dec 2026 | S4, S8, S1 | site, X, Threads, Bluesky, Instagram carousel, Reddit (comments), Discord #gta6, newsletter | ED (research and updates) / SC (distribution) / DS (template) | ED 2 h/week, SC 1 h/week, DS 3 h once | $0 |

**Goal.** Make /gta6/everything-we-know the sourced reference for what is confirmed, reported and rumoured about GTA VI, updated every Thursday and on every Rockstar beat [R17 §2, R07 §3.1].  
**KPI.** Ledger sessions from organic search and Discover (Search Console clicks on /gta6/everything-we-know) per week; plus newsletter_signup on the ledger page ÷ ledger sessions.  
**TARGET.** 8 weekly updates by 19 Nov with a changelog; Search Console clicks UP week over week from first measurement; zero corrections that change a 'Confirmed' label.  
**Core message.** What is confirmed about GTA 6, what is only reported, and what is rumour — with the source and date on every line.  
**Proof.** Ledger rows already sourced in research: date, price, platforms, single-player at launch, no PC at launch, pre-order bonus, album, collector's set; reported: 30 fps, DualSense LE, modding guidelines; rumour: GTA Online 2027 [R17 §2].

**Key moments.** 2026-10-01 — ledger v1 live (converted from the existing FAQ page) · Every Thursday — update + changelog + social card · 2026-11-19 — launch: rumours about the base game resolve; ledger shifts to Online/PC status · Dec — monthly updates only

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-062 interim).

**Exact copy (Part 33).**

- **Facebook:** GTA 6: confirmed or rumour? Our ledger lists every claim with its status and source. This week: [change 1], [change 2]. Nothing on the list is guesswork: [link]
- **Instagram:**

> Carousel (5 slides). S1: GTA 6 / CONFIRMED OR RUMOUR? / week of [date]. S2: CONFIRMED (green): 19 Nov, PS5 + Xbox Series X|S; $79.99 / $99.99; single-player at launch; no PC at launch. S3: REPORTED (amber): [e.g. 30 fps on consoles at launch — Tom's Hardware]. S4: RUMOUR (grey): [e.g. GTA Online for VI in 2027 — The Mirror]. S5: 'Every line has a source: link in bio'.  
> Caption: The GTA 6 ledger, updated every Thursday. If it is not confirmed, it says so.  

- **X:**

> GTA 6 ledger, updated [date]:  
> Confirmed: 19 Nov, PS5/Xbox Series X|S, $79.99, no PC at launch  
> Reported: [item] ([source])  
> Rumour: [item]  
> Changelog + sources: techplay.gg/gta6/everything-we-know  

- **Threads:** Every Thursday we sort GTA 6 claims into confirmed, reported and rumour, with a source on each line. This week's change: [change]. Anything you want checked for next week?
- **Bluesky:** GTA 6 ledger update ([date]): [change]. Confirmed, reported and rumoured claims, each with a source and date: techplay.gg/gta6/everything-we-know
- **Reddit angle:** In r/GTA6 and r/GamingLeaksAndRumours threads where a claim is being argued, reply with the status and the primary source (Rockstar Newswire, the Xbox store listing). Link the ledger only when the thread asks for a round-up, and say it is TechPlay's page (C47).
- **Discord:** #gta6 every Thursday (Buffy): "Ledger updated. Moved to Confirmed: [x]. New rumour logged: [y]. Want something checked? Post it with a link and we'll source it for next Thursday."
- **Newsletter blurb:** GTA 6 briefing: [N] days to launch. Confirmed this week: [x]. Still only reported: [y]. The full ledger with sources: [link]

*Page H1, intro and ledger format*
> H1: GTA 6: everything confirmed, reported and rumoured  
> Intro: GTA VI launches on 19 November 2026 on PS5 and Xbox Series X|S. This page lists every claim we track about it, with a status and the source. Confirmed means Rockstar, Take-Two or a platform store says it. Reported means a named outlet reports it without confirmation. Rumour means neither. Updated every Thursday; the changelog is at the bottom.  
> Row format: Claim | Status | Source (linked) | Date | Last checked.  

Not used for this campaign: Facebook Groups, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Carousel with three colour bands (green/amber/grey) and source lines. · *1080x1080:* Single card 'Moved to Confirmed this week' for X/Threads/Bluesky. · *1280x720 thumbnail:* Page OG: ledger table graphic, ≤300 KB (D-017). · *1080x1920:* Story: 'Confirmed or rumour?' poll sticker using one live claim. · *web banner:* Hub module 'Ledger updated [date]' on /gta6.

**CTA.** Read the ledger; get the weekly GTA 6 briefing  
**Landing page.** https://techplay.gg/gta6/everything-we-know  
**UTM example.** `https://techplay.gg/gta6/everything-we-know?utm_source=x&utm_medium=organic-social&utm_campaign=c07-gta6-ledger&utm_content=f03-card-w41`  
**Tracking.** `cta_click`, `newsletter_signup`, `reminder_set`, `social_share`  
**Follow-up.** After launch: ledger becomes 'GTA 6 Online and PC status' (monthly). Fix the PC contradiction on the hub ('PC — Coming Soon' vs 'not yet confirmed') on day one [R17 §1].  
**Dependencies.** D-017, C02 (hub links), C40 (briefing slot)

#### C08 — GTA 6 Release-Time Tool + Reminder

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also SEO) | T1 must | Thu 1 Oct 2026 → Thu 19 Nov 2026 | S4, S1, S10 | site tool, all C06/C07/C10 posts, Discord, newsletter, web push (from 9 Nov) | DEV (build) / ED (copy, sources, monitoring) / SC (promotion) | DEV 16 h, ED 4 h + 15 min/day monitoring from 1 Nov, SC 2 h | $0 |

**Goal.** Ship the one GTA 6 page no countdown site pairs with an account reminder: unlock time in your time zone plus 'remind me', and use it as the hub's main conversion point to launch [R17 §3 q2/q25/q26, R09 EA-097, R21 TOOL-13].  
**KPI.** Reminder rate = reminder_set on /gta6/release-time ÷ tool sessions; tool_run (tool=release-time) per day; registration_complete with from=gta6-release-time.  
**TARGET.** tool live by Wed 14 Oct; reminder rate measured from day 1 and UP weekly to launch; page indexed within 7 days of launch (Search Console).  
**Core message.** What time GTA 6 unlocks where you live, as soon as it is official, and a reminder so you do not have to check.  
**Proof.** Rockstar has not published unlock or pre-load times as of 27 Sep; the page says so instead of guessing [R17, R09 EA-097].

**Key moments.** 2026-10-01 — DEV build starts (D-018) · 2026-10-14 — tool live; countdown links switch · 2026-11-09 — push opt-in at 'remind me' (C59) · When Rockstar or the stores publish unlock times — tool updated within 1 hour; everyone with a reminder is told · 2026-11-19 — launch

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-018).

**Acceptance criteria.**
- [ ] /gta6/release-time server-renders an H1, the confirmed date (19 Nov 2026, PS5 and Xbox Series X|S) and a status line: 'Unlock time: not announced yet' until an official source exists.
- [ ] Visitor's time zone detected; manual override; once official, shows unlock and pre-load times per platform with the source link.
- [ ] 'Remind me' works for guests via the C45 modal and for members directly; reminder channels: email (C43), Discord DM (C43), web push after C59.
- [ ] No invented times or file sizes anywhere; a 'Last checked' timestamp on the page.
- [ ] FAQPage schema for 'What time does GTA 6 release?', 'Can I pre-load GTA 6?', 'Is GTA 6 on PC?' with answers that match the ledger.
- [ ] tool_run (tool=release-time) fires on time-zone render; reminder_set fires on reminder.

**Exact copy (Part 33).**

- **Facebook:** What time does GTA 6 unlock where you live? Rockstar hasn't published unlock times yet. Our release-time page will show them in your time zone the moment they are official, and it can remind you when pre-load opens: techplay.gg/gta6/release-time
- **Instagram:** Story: 'What time does GTA 6 unlock where you are?' / 'Not announced yet.' / 'We'll show it in your time zone the minute it is.' / link sticker 'Remind me'.
- **TikTok script:** 15 s: phone screen recording of the page: time zone auto-detected, 'Not announced yet', tap 'Remind me'. Text: 'Nobody knows the unlock time yet. This page will, first.'
- **X:** GTA 6 unlock times by time zone: not announced yet. When Rockstar or the stores publish them, this page shows yours and can remind you when pre-load opens: techplay.gg/gta6/release-time
- **Threads:** Nobody has official GTA 6 unlock times yet, whatever the countdown sites say. We built a page that shows yours the moment they exist, and reminds you. What time zone are you counting from?
- **Bluesky:** GTA 6 release time by time zone: not announced yet. This page will show yours as soon as it is official and can remind you: techplay.gg/gta6/release-time
- **Reddit angle:** Answer 'what time does GTA 6 release in [country]' threads with 'not announced yet' and the official sources to watch; link the page only once times are official (C47).
- **Discord:** #gta6 pin: "Unlock time by time zone, and a reminder when pre-load opens: https://techplay.gg/gta6/release-time — members with a reminder get a DM here when it's official."
- **Newsletter blurb:** New: the GTA 6 release-time page. It shows the unlock time in your time zone once Rockstar publishes it, and can remind you when pre-load opens. [link]
- **Push text:** GTA 6 unlock times are out. Yours: [time, zone]. Pre-load: [date/time or 'not yet'].

Not used for this campaign: Facebook Groups, YouTube, Shorts/Reels script, Ad copy.

**Creative.** *1080x1920:* Screen recording of the tool for Stories/Shorts. · *1080x1080:* Card: world clock faces with '?' and 'Not announced yet — we'll tell you'. · *1280x720 thumbnail:* Page OG ≤300 KB: clock + 'GTA 6 release time in your time zone'. · *1080x1350:* Launch-week carousel once times are official: one slide per region. · *web banner:* Hub hero button 'What time does it unlock for me?' + article inline card.

**CTA.** Remind me when GTA 6 unlocks  
**Landing page.** https://techplay.gg/gta6/release-time (new)  
**UTM example.** `https://techplay.gg/gta6/release-time?utm_source=x&utm_medium=organic-social&utm_campaign=c08-gta6-release-time&utm_content=tool-launch-a`  
**Tracking.** `tool_run(tool=release-time)`, `reminder_set`, `reminder_delivered`, `registration_complete`, `notification_enabled`  
**Follow-up.** After 19 Nov: page becomes 'GTA 6 on PC: status' tracker with the same reminder mechanic (announcement watch).  
**Dependencies.** D-018, D-016 / C45, D-013 / C43, C59 (push), C07

#### C09 — GTA 6 Giveaway

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Giveaway | T2 should | Mon 28 Sep 2026 → Wed 21 Oct 2026 | S4, S10, S1 | site (/giveaway/{slug}, JoinPrompt slot), Discord, X, Instagram, Facebook, newsletter | SC (running it) / EIC (rules, prize, winner sign-off) | SC 4 h, EIC 2 h, DEV 1 h (D-039) | $0 (Prize as already configured in admin; no new spend. No paid promotion (R16: not before fraud score and task audit).) |

**Goal.** If a GTA 6 giveaway is really configured in the admin, run it honestly to its 20 Oct close and publish a winner on 21 Oct; if not, remove every promise of giveaways until one exists [R02 §10, R16 §2.15].  
**KPI.** Quality entrants = giveaway_entered (first entry) whose account reaches library_connected or ≥3 shelf items within 7 days ÷ all giveaway_entered.  
**TARGET.** winner published 21 Oct; giveaway-only accounts (entered, no other action in 7 days) BELOW 70% of entrants (stop rule from R16 T13).  
**Core message.** A GTA 6 prize, free entry with a TechPlay account, drawn on 20 October.  
**Proof.** Entry requires an account (anti-fraud), official rules are linked, the winner is published on the site and in Discord [R16 §2.12].

**Key moments.** 2026-09-28 — SC + EIC verify in admin: prize, rules, end date, tasks. If nothing live: stop here and remove 'Enter exclusive giveaways' from register/Discord copy · 2026-09-29 — remove share/retweet tasks from any entry path promoted on Meta; add official rules + 'no purchase necessary' · 2026-10-01 — /giveaways indexable while live (D-039) · 2026-10-13 — 'one week left' reminder · 2026-10-20 — close (per code comment; confirm the hour in admin) · 2026-10-21 — winner post

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-039a/b + D-041; promotion possible from Tue 29 Sep if the giveaway is confirmed live).

**Exact copy (Part 33).**

- **Facebook:** We're giving away [prize] for GTA 6. Entry is free with a TechPlay account; no purchase necessary. Closes [20 Oct, time CET]. Official rules and entry: [link]. This promotion is not sponsored, endorsed or administered by Meta.
- **Instagram:**

> Post (1080x1350): prize photo, 'GTA 6 GIVEAWAY / closes 20 Oct'.  
> Caption: [Prize] for GTA 6, drawn on 20 October. Free entry with a TechPlay account, no purchase necessary. Rules and entry: link in bio. Not sponsored or administered by Instagram or Meta.  

- **X:** GTA 6 giveaway: [prize]. Free entry with a TechPlay account, no purchase necessary, closes 20 Oct. Rules + entry: techplay.gg/giveaway/[slug]
- **Threads:** We're drawing [prize] on 20 October for GTA 6. Free with a TechPlay account. Rules and entry at techplay.gg/giveaway/[slug]
- **Discord:** #announcements: "The GTA 6 giveaway closes 20 Oct. Prize: [prize]. Enter with your TechPlay account (sign in with Discord takes one click): [link]. Rules are on the page. The winner is announced here on 21 Oct."
- **Newsletter blurb:** Last call: the GTA 6 giveaway ([prize]) closes on 20 October. Free entry with a TechPlay account: [link]

*Winner post (21 Oct, site + Discord + X)*
> The GTA 6 giveaway is drawn. Winner: @[username] (with their consent), picked at random from [N] valid entries on 20 Oct. Thanks to everyone who entered. The next giveaway will be posted here and in Discord first.  

*If no giveaway is live (28 Sep decision)*
> Remove 'Enter exclusive giveaways' from /register, SignInWall and the Discord card 'Giveaway pings before they close' until a giveaway is configured. No public post.  

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Prize photo on dark background, 'Closes 20 Oct', 'Free entry with a TechPlay account'. · *1080x1080:* X/FB version with rules URL in small type. · *1080x1920:* Story with countdown sticker to close. · *1280x720 thumbnail:* Giveaway page OG. · *web banner:* JoinPrompt giveaway slot (already built) on articles for guests.

**CTA.** Enter the giveaway (free with a TechPlay account)  
**Landing page.** https://techplay.gg/giveaway/{slug} (and https://techplay.gg/giveaways while live)  
**UTM example.** `https://techplay.gg/giveaway/gta-6?utm_source=discord&utm_medium=community&utm_campaign=c09-gta6-giveaway&utm_content=announce-a`  
**Tracking.** `giveaway_entered`, `giveaway_task_done`, `registration_complete`, `library_connected`, `discord_join`  
**Follow-up.** Report entrants, quality-entrant share and giveaway-only share by 23 Oct; that result decides whether C30/C29 use a prize at all.  
**Dependencies.** Admin verification 28 Sep, D-039, C01 (register copy), C03 (giveaway_entered)  
**Risks.** Meta Promotions policy bans required shares; account-as-entry may count as consideration in some US states (legal check before any paid push) [R16 §2.15].

#### C10 — GTA 6 Launch Week

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Social / SEO / Product) | T1 must | Mon 16 Nov 2026 → Sun 22 Nov 2026 | S4, S10, S1, S2 | site (hub, live blog, guides), Discord (event + #gta6), X live thread, Instagram, TikTok/Shorts/Reels, Facebook, Threads, Bluesky, newsletter, web push | EIC (verdict, live blog lead) / ED (guides) / SC (Discord event, social) / DS (launch set) / DEV (on call for tracker) | EIC 12 h, ED 20 h, SC 14 h, DS 6 h, DEV 6 h (week total) | $0 |

**Goal.** Be useful to GTA VI players for the seven days around 19 Nov: unlock time, what to do first, the map tracker, a live thread in Discord, and a launch verdict, each ending in a reminder, a shelf add or a Discord join [R17 §9].  
**KPI.** Launch-week conversions = registration_complete + library_connected + discord_join (invite C10) + shelf_add (GTA VI) during 16–22 Nov, by utm_campaign.  
**TARGET.** highest weekly WRM of the quarter; Discord joins in launch week UP vs the previous 4-week average.  
**Core message.** GTA 6 is out. Here's the time it unlocked for you, what to do first, and a map that remembers what you've found.  
**Proof.** Release-time tool, ledger, 1,058-location map with progress tracker, 121 vehicles with classes (C12), 12 characters [R17].

**Key moments.** 2026-11-16 — 'GTA 6 launch week: everything you need' article; Out This Week is GTA week · 2026-11-17 — editions + unlock times recap (if official); pre-load post · 2026-11-18 20:00 CET — Discord 'Launch Eve' voice/Stage event · 2026-11-19 — launch: live blog (F20) from unlock; map tracker live (C11); 'What to do first' guide · 2026-11-20 — Game Club November kicks off (C38) · 2026-11-21 — (to 22 Nov) launch verdict (C52) once an editor has played enough; first guides (money, cars, settings)

**Exact copy (Part 33).**

- **Facebook:** GTA 6 is out on PS5 and Xbox Series X|S. Three things on TechPlay for your first night: the unlock-time page, a 'what to do first' guide with no story spoilers, and a map that remembers what you've found when you sign in: techplay.gg/gta6
- **Facebook Groups:** In GTA groups, answer launch-night questions (unlock time, pre-load, 'is it on PC') in plain text; link the release-time page only where it answers the question.
- **Instagram:**

> Launch-day carousel (6 slides): 1 'GTA 6 IS OUT' / 2 'Unlocked at [time] in your zone? Check: link in bio' / 3 'What to do first (no spoilers)' / 4 'Map tracker: mark what you've found' / 5 'Join the launch thread on our Discord' / 6 'Launch verdict: this weekend'.  
> Caption: Out now on PS5 and Xbox Series X|S. No PC version at launch. Everything we built for the first week is on the hub.  

- **TikTok script:** Launch day, 20 s: 'GTA 6 is out. Three things before you start:' 1) 'Check your unlock time (it varies by region)' 2) 'The map tracker saves what you've found' 3) 'Our verdict lands this weekend'. End card techplay.gg/gta6.
- **X:**

> GTA 6 is out on PS5 and Xbox Series X|S.  
>
> Live thread below: unlock times as they happen, server status, what to do first. Map tracker (sign in to save progress): techplay.gg/gta6/map  

- **Threads:** GTA 6 is out. We're running a live thread in our Discord all night: unlock times, server status, first impressions. Come argue about the radio stations.
- **Bluesky:** GTA 6 is out on PS5 and Xbox Series X|S. Live notes, unlock times and a spoiler-free 'what to do first' on the hub: techplay.gg/gta6
- **Reddit angle:** No launch self-posts. Help in r/GTA6 launch megathreads with specific answers (unlock time sources, pre-load, platform questions). Link the map tracker only when someone asks for a way to track collectibles (C47).
- **Discord:** Event (created 9 Nov): 'GTA 6 Launch Eve' — Wed 18 Nov, 20:00 CET, #gta6-stage. "Countdown, the last confirmed facts, and a vote on what everyone does first. Launch-night thread opens at unlock." Launch post Thu: "It's out. #gta6-launch is the spoiler-free thread; #gta6-spoilers for everything else. Map tracker saves your progress if you're signed in: https://techplay.gg/gta6/map"
- **YouTube:** Shorts: 'GTA 6 unlock time explained in 20 seconds' (only once official) and 'First thing to do in GTA 6 (no spoilers)'. Long-form pilot on 12 Nov (C50) is the pre-launch piece.
- **Shorts/Reels script:** 'What to do first in GTA 6 (no spoilers)', 25 s: 5 on-screen tips from the guide, each 4 s, official screenshots only, end card techplay.gg/gta6.
- **Newsletter blurb:** Special issue, Thu 19 Nov: GTA 6 is out. Unlock times, what to do first, the map tracker, and the Game Club schedule for November.
- **Push text:** GTA 6 is unlocked where you are. What to do first, spoiler-free: [link]

*Launch-week article list (ED)*
> 16 Nov: GTA 6 launch week: dates, editions, unlock times and what we know. 17 Nov: How to pre-load GTA 6 on PS5 and Xbox (only once official). 19 Nov: Live blog. 19 Nov: What to do first in GTA 6 (no story spoilers). 20 Nov: GTA 6 on PC: what Take-Two has said (status tracker). 21–22 Nov: Verdict (C52). 22 Nov: How to make money early in GTA 6 / best early cars (only from play, not rumours).  

Not used for this campaign: Ad copy.

**Creative.** *1080x1350:* Launch carousel on official key art (credited). · *1080x1920:* Stories: unlock-time frames per region; 'Launch Eve' event poster. · *1080x1080:* Discord event cover and X card. · *1280x720 thumbnail:* Live blog and verdict OG images ≤300 KB. · *web banner:* Homepage takeover strip 16–22 Nov linking /gta6 (SSR link, fixes R02 §4.1 gap).

**CTA.** Open the map tracker / join the launch thread  
**Landing page.** https://techplay.gg/gta6 ; https://techplay.gg/gta6/map ; https://techplay.gg/gta6/release-time (new)  
**UTM example.** `https://techplay.gg/gta6/map?utm_source=x&utm_medium=organic-social&utm_campaign=c10-gta6-launch-week&utm_content=live-thread-a`  
**Tracking.** `registration_complete`, `library_connected`, `shelf_add`, `discord_join`, `reminder_delivered`, `cta_click`, `comment_created`  
**Follow-up.** 23 Nov retro: what converted. GTA content then moves to monthly: PC status, Online status, guides that search picks up.  
**Dependencies.** C06, C07, C08, C11, C12, C38, C52, C59, D-017, D-020  
**Risks.** Server-status and performance claims only from official channels or own play; no leaked footage (Rockstar is policing IP) [R17 §10].

#### C11 — GTA 6 Map Progress Tracker

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product | T3 cut first | Mon 2 Nov 2026 → Thu 31 Dec 2026 | S4, S2, S10 | site, C10 launch posts, Discord, push | DEV (build) / EIC (D-020 decision) / SC (launch posts) | DEV 24 h, EIC 2 h, SC 1 h | $0 |

**Goal.** Turn the existing map into a tool players keep open after launch: sign in, mark locations found, see progress; ships on 19 Nov [R17 §7 #6, R21 TOOL-14].  
**KPI.** Tracker adoption = accounts with ≥1 location marked ÷ accounts that opened /gta6/map signed in; registrations from=gta6-map.  
**TARGET.** live at unlock on 19 Nov; D-020 provenance resolved before launch; share of trackers with ≥10 marks after 7 days measured and reported 26 Nov.  
**Core message.** A GTA 6 map that remembers what you've found.  
**Proof.** 1,058 marked locations already on /gta6/map; accounts and shelves already exist [R17].

**Key moments.** 2026-10-16 — D-020 decision: permission/attribution from gtadb.org or rebuild of the location set · 2026-11-02 — build starts · 2026-11-16 — feature-flagged QA · 2026-11-19 — live with launch · 2026-11-26 — first adoption report

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-056).

**Acceptance criteria.**
- [ ] Signed-in users can mark/unmark any location; progress bar per category and overall; state saved server-side.
- [ ] Guests see a 'Sign in to save your progress' prompt (C45 modal) and return to the map after registering.
- [ ] Attribution line on the map reflects the D-020 outcome; 211 unconfirmed locations visibly labelled as such.
- [ ] Post-launch additions (collectibles) can be added in the admin without a deploy.
- [ ] cta_click (cta_id=map-mark) and registration_complete (from=gta6-map) fire.

**Exact copy (Part 33).**

- **Instagram:** Story: screen recording of marking three locations and the progress bar moving. Link sticker 'Track your map'.
- **X:** The GTA 6 map on TechPlay now saves your progress: mark what you've found, see what's left per category. Sign in to keep it across devices: techplay.gg/gta6/map
- **Discord:** #gta6: "The map tracker is live: mark locations as found and it remembers. Sign in with Discord to save progress: https://techplay.gg/gta6/map"
- **Newsletter blurb:** New for launch: the GTA 6 map remembers what you've found once you sign in. [link]
- **Push text:** Your GTA 6 map: [N] locations found. [Category] has [M] left.

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Ad copy.

**Creative.** *1080x1920:* Screen recording of the tracker for Stories/Shorts. · *1080x1080:* Card: map crop with checkmarks, 'Your map remembers'. · *1280x720 thumbnail:* /gta6/map OG ≤300 KB.

**CTA.** Sign in to save your map progress  
**Landing page.** https://techplay.gg/gta6/map  
**UTM example.** `https://techplay.gg/gta6/map?utm_source=discord&utm_medium=community&utm_campaign=c11-gta6-map-tracker&utm_content=launch-a`  
**Tracking.** `cta_click`, `registration_complete`, `shelf_add`, `d1_return`  
**Follow-up.** Collectibles layer added as guides confirm them; report 26 Nov decides whether trackers get a share card.  
**Dependencies.** D-020, D-016 / C45, C10  
**Risks.** Presenting third-party map data as our own; blocked until D-020 is resolved.

#### C12 — GTA 6 Vehicle Guide (classes + real-world equivalents, sourced)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Social) | T2 should | Mon 5 Oct 2026 → Wed 21 Oct 2026 | S4, S10 | site, Instagram carousel, TikTok/Shorts, X, Threads, Discord #gta6 | ED (data entry, sourcing) / DS (silhouettes) / SC (distribution) | ED 12 h, DS 4 h, SC 1.5 h, EIC 1 h | $0 |

**Goal.** Fill the empty vehicle_class and real_equivalent fields for the 121 vehicles with sourced editorial data, then publish the one GTA 6 vehicle view fan sites do not have: 'what real car is this?' [R17 §3 q14, R21 TOOL-15].  
**KPI.** Search Console clicks on /gta6/vehicles; carousel saves and shares; share of 121 vehicles with a sourced class and labelled equivalent.  
**TARGET.** 121/121 classes and ≥60 equivalents (only where a trailer/screenshot supports it) by 21 Oct; each equivalent labelled 'our reading'.  
**Core message.** Every confirmed GTA 6 vehicle, its class, and the real car it looks like, with the frame we took it from.  
**Proof.** 121 vehicle names already in the hub; classes and equivalents are editorial readings with a source frame per entry [spine §0].

**Key moments.** 2026-10-05 — data entry starts (ED, 20 vehicles/day max) · 2026-10-19 — review by EIC · 2026-10-21 — publish + carousel · 2026-11-19 — update from launch play

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-061).

**Exact copy (Part 33).**

- **Instagram:**

> Carousel (7 slides). S1: GTA 6 CARS / AND THE REAL CARS THEY LOOK LIKE. S2–S6: one vehicle each: in-game name, class, 'Looks like: [real car]', 'Source: [trailer, timestamp]'. S7: 'All 121 vehicles: link in bio'.  
> Caption: Our reading of five GTA 6 cars and the real cars behind them. Rockstar doesn't name real models; these are our matches, with the frame we used. Disagree? Tell us which one.  

- **TikTok script:** 25 s: side-by-side stills (official screenshot left, real car silhouette right, no third-party photos without licence), 5 vehicles × 4 s, text 'Our reading'. End: 'All 121: techplay.gg/gta6/vehicles'.
- **X:** GTA 6 has 121 confirmed vehicles on our list. We matched [N] of them to the real cars they look like, with the trailer frame for each. Our reading, not Rockstar's: techplay.gg/gta6/vehicles
- **Threads:** Which real car is this GTA 6 car based on? We went through the trailers and matched [N] of 121. Tell us where we got it wrong.
- **Discord:** #gta6: "Vehicle list updated: classes for all 121 and our real-world matches for [N]. Post the ones you think are wrong with a timestamp, and we'll fix and credit you."
- **Newsletter blurb:** GTA 6 vehicles: all 121 now have a class, and [N] have a real-world match with the frame we took it from. [link]

Not used for this campaign: Facebook, Facebook Groups, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Carousel: in-game screenshot top, real-car silhouette drawing bottom (DS draws; no licensed photos needed). · *1080x1920:* Short-video frames from the same assets. · *1080x1080:* X card: grid of 4 matches. · *1280x720 thumbnail:* /gta6/vehicles OG ≤300 KB.

**CTA.** See all 121 vehicles  
**Landing page.** https://techplay.gg/gta6/vehicles  
**UTM example.** `https://techplay.gg/gta6/vehicles?utm_source=instagram&utm_medium=organic-social&utm_campaign=c12-gta6-vehicles&utm_content=carousel-a`  
**Tracking.** `cta_click`, `social_share`, `comment_created`  
**Follow-up.** Launch update from play; community corrections credited in the changelog.  
**Dependencies.** Admin fields vehicle_class / real_equivalent editable, D-017 (OG)  
**Risks.** Trademark: no manufacturer logos; say 'looks like', never 'is'.

### C13–C15: WoW and MMO

#### C13 — WoW 12.1.5 Readiness Push

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Product / Social) | T1 must | Mon 5 Oct 2026 → Mon 12 Oct 2026 | S5, S10 | site, Discord #wow, X, Reddit (comments), Threads, Bluesky, newsletter, Shorts | ED (article, Analyzer copy) / SC (Discord, Reddit, social) | ED 5 h, SC 4 h, DEV 1 h (D-040) | $0 |

**Goal.** Re-aim the WoW Analyzer at the next patch and get WoW players to run it the week the patch lands (predicted ~6 Oct), from Discord, r/wow answers and a patch-day checklist [R05, R06 #12, R21 TOOL-17].  
**KPI.** Analyzer runs = tool_run (tool=wow) during 5–12 Oct, by utm_source; registrations with method=battlenet in the same window.  
**TARGET.** runs in patch week UP vs the previous 7 days (baseline from the collector); copy fixed (D-040) before 5 Oct.  
**Core message.** Patch 12.1.5 is close. Paste your character and see what to fix before it lands.  
**Proof.** The Analyzer reads Blizzard's API and Raider.IO; the only on-site character analyzer among the media sites reviewed [R18, R23 #23].

**Key moments.** 2026-10-02 — D-040 copy live (no stale Midnight date, no unbacked figures) · 2026-10-05 — 'Patch 12.1.5 checklist' article; Readiness Check post · ~2026-10-06 — patch (Blizzard has not dated it as of 27 Sep; move with the real date) · 2026-10-06 — first weekly reset post after patch (F15 Tue) · 2026-10-12 — wrap

**Exact copy (Part 33).**

- **Facebook Groups:** WoW guild/community groups: answer readiness questions; share the Analyzer only if the group allows tool links.
- **X:** WoW patch 12.1.5 is expected around 6 Oct (Blizzard hasn't dated it yet). Before it lands: paste your character into the Analyzer and get a gear, enchant and progression check. No account needed: techplay.gg/wow-analyzer
- **Threads:** WoW players: 12.1.5 is expected early October. What are you fixing before it lands? The Analyzer gives a quick gear and enchant check if you want a second opinion.
- **Bluesky:** WoW 12.1.5 is expected around 6 Oct. A quick readiness check (gear, enchants, progression) takes a character name and realm: techplay.gg/wow-analyzer
- **Reddit angle:** r/wow, r/wownoob: answer 'am I ready for X' and 'what should I upgrade' questions with specific advice first. Mention the Analyzer only when the poster asks for a tool, disclosing it is TechPlay's (C47).
- **Discord:** #wow (Buffy, Tue after reset): "Readiness Check: patch 12.1.5 is close. Run /analyze or paste your character at https://techplay.gg/wow-analyzer and post your score. Lowest-scoring volunteer this week gets a staff gear review in voice on Thursday."
- **YouTube:** Shorts: same recording. Title: 'WoW 12.1.5: check your character in 20 seconds'.
- **Shorts/Reels script:** 20 s screen recording: type character + realm, result appears, zoom on 'Missing enchants: 2'. Text: 'Patch 12.1.5 is close. Check yours: techplay.gg/wow-analyzer'.
- **Newsletter blurb:** WoW 12.1.5 is expected early October. Our patch checklist and the Analyzer's readiness check: [link]

*Article*
> Title: WoW patch 12.1.5: the checklist before it lands  
> Dek: Blizzard hasn't dated 12.1.5 yet; the patch cycle points to early October. Blizzard Watch's preview mentions the Labyrinth and Aqir invasions (check against Blizzard's own notes before publishing). What to prepare, and a 20-second character check.  

Not used for this campaign: Facebook, Instagram, TikTok script, Push text, Ad copy.

**Creative.** *1080x1920:* Analyzer screen recording (Shorts/Stories). · *1080x1080:* Card: sample analysis result (a staff character), 'Ready for 12.1.5?'. · *1280x720 thumbnail:* New Analyzer OG ≤300 KB (D-040).

**CTA.** Check your character  
**Landing page.** https://techplay.gg/wow-analyzer  
**UTM example.** `https://techplay.gg/wow-analyzer?utm_source=discord&utm_medium=community&utm_campaign=c13-wow-1215-readiness&utm_content=f15-reset-a`  
**Tracking.** `tool_run(tool=wow)`, `registration_complete`, `discord_join`, `cta_click`  
**Follow-up.** Analyzer copy re-aimed per patch from now on; F15 Readiness Check continues every Tuesday.  
**Dependencies.** D-040, C01  
**Risks.** Patch date is a prediction; copy says 'expected' until Blizzard dates it.

#### C14 — WoW: Forever Explainer + Analyzer

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Community) | T2 should | Wed 28 Oct 2026 → Sun 8 Nov 2026 | S5, S1 | site, X, Threads, Bluesky, Discord #wow, Reddit (comments), newsletter | ED | ED 6 h, SC 2 h | $0 |

**Goal.** Answer 'what is WoW: Forever and which WoW should I play' before and after its 4 Nov launch, and route Retail players to the Analyzer [R05 row 4 Nov, R06 #11].  
**KPI.** Explainer organic clicks (Search Console) + Discover clicks; tool_run (tool=wow) from the explainer; newsletter_signup from the explainer.  
**TARGET.** explainer live 28 Oct and updated on 4 Nov; indexed before launch day.  
**Core message.** Retail, Classic and WoW: Forever, in plain words, and which one fits the time you have.  
**Proof.** TechPlay covered 'WoW: Forever is not for Retail' (24 Sep); Blizzard's gold-buying warning is on record [R02 §7.2, R06].

**Key moments.** 2026-10-28 — 'WoW: Forever explained: which WoW should you play?' · 2026-11-04 — launch day update + impressions · 2026-11-08 — 'first week of WoW: Forever' follow-up; feeds /mmo (C15)

**Exact copy (Part 33).**

- **X:** WoW: Forever launches 4 Nov. Which WoW is which, what carries over and what doesn't, and which one fits the time you have: [link]
- **Threads:** WoW has three live versions from 4 November. We wrote the plain explanation we wanted: what WoW: Forever is, who it's for, and what it isn't.
- **Bluesky:** WoW: Forever launches 4 Nov. A plain explainer: Retail vs Classic vs Forever, and which one fits your schedule. [link]
- **Reddit angle:** Answer 'should I play Forever or Retail' threads in r/wow with the actual differences from Blizzard's FAQ; link the explainer only if asked for a summary (C47).
- **Discord:** #wow: "WoW: Forever is out 4 Nov. Explainer here: [link]. Launch-night voice channel opens at 19:00 CET for anyone trying it."
- **Newsletter blurb:** WoW: Forever launches 4 November. Which WoW is which, in five minutes: [link]

*Article H1 and dek*
> H1: WoW: Forever explained: which World of Warcraft should you play?  
> Dek: Blizzard launches WoW: Forever on 4 November. How it differs from Retail (Midnight) and Classic, what it costs, and what carries over, from Blizzard's own FAQ. Checked on [date].  
> Analyzer note: 'The Analyzer reads Retail characters today. If Blizzard's API covers WoW: Forever characters, we'll add them and say so here.'  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Three-column card: Retail / Classic / Forever with one line each. · *1280x720 thumbnail:* Explainer OG. · *1080x1350:* Carousel version of the comparison.

**CTA.** Read the explainer; check your Retail character  
**Landing page.** https://techplay.gg/guides/wow-forever-explained (article on /guides); https://techplay.gg/wow-analyzer  
**UTM example.** `https://techplay.gg/guides/wow-forever-explained?utm_source=bluesky&utm_medium=organic-social&utm_campaign=c14-wow-forever&utm_content=explainer-a`  
**Tracking.** `cta_click`, `tool_run(tool=wow)`, `newsletter_signup`  
**Follow-up.** Explainer moves into /mmo (C15) as a pillar page on 10 Nov.  
**Dependencies.** C13, C15

#### C15 — MMO Hub launch (/mmo)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Product) | T3 cut first | Mon 2 Nov 2026 → Tue 10 Nov 2026 | S5, S10 | site, Discord #wow, X, Bluesky, newsletter | ED (content) / DEV (template) | ED 8 h, DEV 8 h (share of D-032) | $0 |

**Goal.** Give pillar P3 a home: one hub for WoW (Analyzer, patch calendar, WoW: Forever), FFXIV (Evercold, Jan 2027) and GW2/GW3, built on the hub template [R18 blueprint 1].  
**KPI.** Hub sessions from search and Discover; hub → Analyzer click-through (cta_click cta_id=mmo-analyzer); newsletter_signup (WoW weekly segment).  
**TARGET.** live 10 Nov with ≥6 linked pillar pages; indexed within 14 days; Analyzer click-through measured from week 1.  
**Core message.** Everything TechPlay has for MMO players in one place, starting with the only character analyzer on a gaming site.  
**Proof.** WoW Analyzer; WoW: Forever explainer; patch calendar; FFXIV Evercold January 2027; Guild Wars 3 beta fall 2027 [R05, R18].

**Key moments.** 2026-11-02 — template ready (D-032) · 2026-11-10 — hub live · 2027-01 — FFXIV Evercold update

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-032 hub template slips to Jan 2027. Interim: ED publishes the MMO pillar article on /guides on 10 Nov; the hub absorbs it with a 301 in January. Hub copy is held until then.

**Acceptance criteria.**
- [ ] /mmo server-renders an H1, intro paragraph, links to Analyzer, WoW patch calendar, WoW: Forever explainer, FFXIV Evercold page, GW2/GW3 page, MMO comparison.
- [ ] Hub linked from the header Tools/Discover menu (SSR) and from every WoW article's end block.
- [ ] WoW weekly newsletter segment sign-up box on the hub.

**Exact copy (Part 33).**

- **X:** New on TechPlay: an MMO hub. WoW Analyzer, the patch calendar, WoW: Forever explained, and FFXIV Evercold ahead of January: techplay.gg/mmo
- **Bluesky:** We put our MMO coverage in one place: WoW Analyzer, patch calendar, WoW: Forever explainer, FFXIV Evercold and Guild Wars: techplay.gg/mmo
- **Discord:** #wow + #announcements: "New hub for MMO players: https://techplay.gg/mmo — tell us what's missing in #suggestions."
- **Newsletter blurb:** New: the TechPlay MMO hub, with a weekly WoW email for Analyzer users if you want it. [link]

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* Hub OG: three game logos-free panels (WoW, FFXIV, GW) with typography only. · *web banner:* Analyzer result page module 'More for MMO players'.

**CTA.** Open the MMO hub  
**Landing page.** https://techplay.gg/mmo (new)  
**UTM example.** `https://techplay.gg/mmo?utm_source=discord&utm_medium=community&utm_campaign=c15-mmo-hub&utm_content=launch-a`  
**Tracking.** `cta_click`, `tool_run(tool=wow)`, `newsletter_signup`  
**Follow-up.** Monthly: patch calendar refresh; Evercold page Jan 2027.  
**Dependencies.** D-032, C14, C13

### C16–C19: October launches and Steam events

#### C16 — Gears of War: E-Day launch utility

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Social) | T2 should | Thu 1 Oct 2026 → Sat 10 Oct 2026 | S1, S3, S2 | site, X, Instagram carousel, Threads, Discord, newsletter | ED | ED 6 h, SC 1.5 h, DS 1 h | $0 |

**Goal.** Cover Gears of War: E-Day (6 Oct, PC and Xbox) with the pages players search for around launch: series order, release time, PC requirements from official sources, and a Verdict [R05, R18 #23].  
**KPI.** Organic + Discover clicks on the three Gears pages in 1–10 Oct; shelf_add for E-Day.  
**TARGET.** 'Gears of War in order' live 3 Oct (C63); launch page live 5 Oct; Verdict by 10 Oct if a copy is available.  
**Core message.** E-Day is out 6 October on PC and Xbox. The order to play the series in, and what your PC needs.  
**Proof.** Series relations in the database; release date confirmed by the publisher [R05].

**Key moments.** 2026-10-03 — Gears of War in order (F09/C63) · 2026-10-05 — 'Gears of War: E-Day: release time, platforms and PC specs' · 2026-10-06 — launch · 2026-10-08 to 10 — Verdict (C52) if played

**Exact copy (Part 33).**

- **Instagram:** Carousel: 'GEARS OF WAR IN ORDER' — one slide per game with year and where to play it now; last slide 'E-Day: 6 Oct'. Caption: Story order vs release order, and where each Gears game is playable today.
- **X:** Gears of War: E-Day is out 6 Oct on PC and Xbox. Every Gears game in order, with where each one is playable today: techplay.gg/[link]
- **Threads:** E-Day is out 6 October. Is anyone replaying the whole series first, or going straight in?
- **Discord:** #gaming: "Gears of War: E-Day is out 6 Oct. Series order here: [link]. Launch thread opens on the day."
- **Newsletter blurb:** Gears of War: E-Day is out Tuesday on PC and Xbox. The series in order, and official PC requirements: [link]

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Series timeline carousel. · *1280x720 thumbnail:* Article OG: timeline strip. · *1080x1080:* X card: 'E-Day, 6 Oct, PC + Xbox'.

**CTA.** Read the series order / add E-Day to your shelf  
**Landing page.** https://techplay.gg/guides/gears-of-war-in-order (article on /guides)  
**UTM example.** `https://techplay.gg/guides/gears-of-war-in-order?utm_source=x&utm_medium=organic-social&utm_campaign=c16-gears-eday&utm_content=f09-thread-a`  
**Tracking.** `cta_click`, `shelf_add`, `reminder_set`  
**Follow-up.** Series page stays evergreen; update with E-Day's reception.  
**Dependencies.** C63, C52

#### C17 — Modern Warfare 4 launch hub

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Social) | T2 should | Mon 12 Oct 2026 → Sun 1 Nov 2026 | S1, S3, S6, S7 | site, X, Instagram carousel, TikTok/Shorts, Threads, Discord, newsletter | ED / SC | ED 10 h, SC 3 h, DS 2 h | $0 |

**Goal.** Answer the MW4 launch questions TechPlay can answer precisely: editions and early access (16 Oct), release date (23 Oct), platforms including Switch 2, Game Pass status, PC requirements and Secure Boot/anti-cheat setup [R05, R09 EA-006].  
**KPI.** Organic + Discover clicks on MW4 pages 12 Oct–1 Nov; library_connected + shelf_add for MW4 from those pages.  
**TARGET.** hub article live 12 Oct; PC fix tie-in (C60) live 16 Oct; 'which CoD should I get' comparison live 20 Oct.  
**Core message.** MW4: early access on 16 October, full launch on 23 October, and the first Call of Duty on a Nintendo platform since Ghosts.  
**Proof.** Release, early access and platforms confirmed by Activision; not day one on Game Pass [R05].

**Key moments.** 2026-10-12 — 'Call of Duty: Modern Warfare 4: release date, editions, early access, platforms' · 2026-10-16 — campaign early access (digital pre-orders) · 2026-10-20 — 'Which Call of Duty should I get?' comparison · 2026-10-23 — launch on PS5, Xbox, PC, Switch 2 · 2026-11-01 — fold into Call of Duty series page (C63)

**Exact copy (Part 33).**

- **Instagram:** Carousel: S1 'MW4: THE DATES'. S2 '16 Oct — campaign early access (digital pre-orders)'. S3 '23 Oct — launch: PS5, Xbox, PC, Switch 2'. S4 'Not day one on Game Pass'. S5 'First CoD on a Nintendo platform since Ghosts'. S6 'Editions + PC specs: link in bio'.
- **TikTok script:** 15 s text-on-footage (official trailer, credited): '16 Oct: early access. 23 Oct: launch. Four platforms, Switch 2 included. Not on Game Pass at launch.' End card link.
- **X:** Modern Warfare 4: campaign early access 16 Oct for digital pre-orders, full launch 23 Oct on PS5, Xbox, PC and Switch 2. It is not on Game Pass at launch. Editions and PC requirements: [link]
- **Threads:** MW4 on Switch 2 is the part I'm most curious about. Anyone planning to play it there instead of PS5 or PC?
- **Discord:** #fps: "MW4 dates: early access 16 Oct, launch 23 Oct. Squad-up thread for launch weekend is open, post your platform."
- **Shorts/Reels script:** 15 s: three date cards over official footage, final card 'Switch 2 included. Not on Game Pass at launch.'
- **Newsletter blurb:** Modern Warfare 4: early access Friday 16 Oct, launch 23 Oct on four platforms. What each edition includes: [link]

Not used for this campaign: Facebook, Facebook Groups, Bluesky, Reddit angle, YouTube, Push text, Ad copy.

**Creative.** *1080x1350:* Dates carousel. · *1080x1920:* Short-video frames. · *1280x720 thumbnail:* Hub article OG. · *1080x1080:* X card.

**CTA.** Read the MW4 guide; set a launch reminder  
**Landing page.** https://techplay.gg/guides/modern-warfare-4-release-date-editions (article on /guides)  
**UTM example.** `https://techplay.gg/guides/modern-warfare-4-release-date-editions?utm_source=instagram&utm_medium=organic-social&utm_campaign=c17-mw4-hub&utm_content=carousel-a`  
**Tracking.** `cta_click`, `reminder_set`, `shelf_add`  
**Follow-up.** After 1 Nov: merge into CoD series page; keep PC settings page in the PC Fix Hub.  
**Dependencies.** C60, C63, C61 (Switch 2 angle)

#### C18 — Steam Next Fest Demo Tracker (with F23 Next Fest Diary)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also SEO / Social) | T1 must | Mon 12 Oct 2026 → Fri 30 Oct 2026 | S3, S1, S9, S10 | site tracker article, Discord #next-fest, TikTok/Shorts/Reels, X, Threads, Bluesky, Reddit (comments), newsletter | ED (demos, ratings) / SC (daily social + Discord) | ED 3 h/day for 8 days + 4 h prep, SC 1.5 h/day, DS 3 h template | $0 |

**Goal.** Cover Next Fest (19–26 Oct) as a player would: three demos a day tried and rated, a tracker of demos worth your time, and 'remind me at release' on every one [R05, R06 #21, R14 #37-38].  
**KPI.** Reminders from Next Fest = reminder_set on demo games' pages with utm_campaign=c18-next-fest; plus Discord messages in #next-fest.  
**TARGET.** 24 demos covered (3/day × 8 days); reminder_set from tracker measured; ≥1 developer AMA from C71 outreach.  
**Core message.** Three Next Fest demos a day, played and rated, with a reminder for the ones that stick.  
**Proof.** Steam Next Fest 19–26 Oct is on Valve's calendar; every demo links to its TechPlay game page with 'remind me' (C45 from 19 Oct) [R05].

**Key moments.** 2026-10-08 — press preview (developers' materials) · 2026-10-12 — 'Next Fest October 2026: 20 demos to try' pre-list · 2026-10-19 — fest opens; diary day 1 · 2026-10-26 — fest ends; 'best demos' wrap · 2026-10-30 — 'Next Fest demos you can remind yourself about'

**Exact copy (Part 33).**

- **TikTok script:** Daily 30 s: '3 Next Fest demos in 30 seconds'. 9 s per demo: official demo footage (captured by us), name, one-line verdict, 'remind me' tag.
- **X:** Next Fest diary, day [N]: we played [Demo A], [Demo B] and [Demo C]. Best of the three: [Demo] — [one line why]. Ratings + remind-me buttons: [link]
- **Threads:** Next Fest day [N]. Played three demos; one was great, one wasn't finished, one surprised me. What's the best demo you've tried this fest?
- **Bluesky:** Next Fest diary, day [N]: [Demo A], [Demo B], [Demo C], rated. Each has a reminder for its release: [link]
- **Reddit angle:** In r/pcgaming and r/Steam Next Fest threads, write two lines about demos you actually played. Link the tracker only in threads asking for round-ups, disclosed (C47).
- **Discord:** #next-fest (Buffy, daily 18:00 CET): "Today's three: [A], [B], [C]. Scores and notes: [link]. Your picks go in the pinned thread; the most-recommended member pick gets played on stream-free voice night Thursday."
- **YouTube:** Shorts from the daily TikTok; one pinned 'best of Next Fest' Short on 27 Oct.
- **Shorts/Reels script:** 30 s: title card; 3 × 9 s segments (capture + name + verdict + score /10); end card 'Remind me at release: techplay.gg/[tracker]'.
- **Newsletter blurb:** Next Fest: the eight demos worth your time from this week's diary, each with a release reminder. [link]

Not used for this campaign: Facebook, Facebook Groups, Instagram, Push text, Ad copy.

**Creative.** *1080x1920:* Daily short template with score badge. · *1080x1350:* Wrap carousel 'Best demos of Next Fest'. · *1080x1080:* Daily X card with three covers. · *1280x720 thumbnail:* Tracker article OG.

**CTA.** Remind me when this game releases  
**Landing page.** https://techplay.gg/guides/steam-next-fest-october-2026-demo-tracker (article on /guides); from 2 Nov inside /steam  
**UTM example.** `https://techplay.gg/guides/steam-next-fest-october-2026-demo-tracker?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c18-next-fest&utm_content=f23-day3-short`  
**Tracking.** `reminder_set`, `shelf_add`, `cta_click`, `discord_join`, `comment_created`  
**Follow-up.** Log the participant list (R14 #37 'Next Fest demo → release tracker' needs it); reuse format for Feb 2027 Next Fest (22 Feb).  
**Dependencies.** C45 (guest remind-me live 19 Oct), C71 (developer outreach), C49  
**Risks.** Capacity: 8 days at 3 h/day for ED; offset by pausing F10 and F18 that week.

#### C19 — Scream Fest + Halloween horror picks

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Seasonal (also Social) | T2 should | Thu 22 Oct 2026 → Mon 2 Nov 2026 | S7, S1, S2 | site list, Instagram carousel, Facebook, X, Threads, TikTok/Shorts, Discord, newsletter | ED (list) / SC (social, Discord night) | ED 4 h, SC 3 h, DS 2 h | $0 |

**Goal.** Use Steam Scream V Fest (26 Oct–2 Nov) and Halloween for a horror list built from the database, with shelf-add as the action [R05, R06 #22].  
**KPI.** shelf_add + list_created from the horror list per 1,000 sessions.  
**TARGET.** list live 22 Oct; measured shelf-add rate becomes the baseline for C33/C34 list posts.  
**Core message.** Horror games worth playing this Halloween, picked from the database, with the ones you can finish in one night.  
**Proof.** Genre and rating data for 333,000+ games; every pick links to its page [R02].

**Key moments.** 2026-10-22 — 'Horror games worth your Scream Fest money' list · 2026-10-26 — Scream Fest opens: deal picks · 2026-10-31 — Halloween: 'short horror you can finish tonight' · 2026-11-02 — fest ends

**Exact copy (Part 33).**

- **Facebook:** Steam's Scream Fest runs 26 Oct to 2 Nov. Our horror list: [N] games worth your money, with the short ones marked for a single evening: [link]
- **Instagram:** Carousel: 'HORROR FOR ONE NIGHT' — six games you can finish in an evening (length from store/official info only). Caption: For Halloween, short horror first. Full list and Scream Fest deals: link in bio.
- **TikTok script:** 20 s: 'Horror games you can finish tonight' — 5 covers, 4 s each, one line each. End card list link.
- **X:** Halloween plan: horror you can finish in one evening. [N] picks, and what's discounted in Steam's Scream Fest (26 Oct–2 Nov): [link]
- **Threads:** What's the scariest game you've actually finished? Building our Halloween list and want the ones people stick with.
- **Discord:** #gaming: "Halloween game night, Sat 31 Oct 20:00 CET: vote the game in the poll above. List of candidates: [link]"
- **Newsletter blurb:** Scream Fest runs until 2 Nov. Our horror list, short games first: [link]

Not used for this campaign: Facebook Groups, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Carousel with dark palette, covers. · *1080x1920:* Story poll 'Which one tonight?' · *1080x1080:* X card. · *1280x720 thumbnail:* List OG.

**CTA.** Add one to your shelf  
**Landing page.** https://techplay.gg/lists (staff list 'Horror worth your Scream Fest money')  
**UTM example.** `https://techplay.gg/lists?utm_source=instagram&utm_medium=organic-social&utm_campaign=c19-scream-fest&utm_content=carousel-a`  
**Tracking.** `shelf_add`, `list_created`, `cta_click`, `discord_join`  
**Follow-up.** List stays live and is updated for Halloween 2027.  
**Dependencies.** C39 (poll for game night)

### C20–C27: Digital PR and data

#### C20 — Release Congestion Index 2026 (PR)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also SEO / Reddit) | T1 must | Wed 30 Sep 2026 → Wed 21 Oct 2026 | S8, S1 | site data page, email pitches, X, Bluesky, LinkedIn, Reddit OC (C48), Threads, newsletter | EIC (analysis, pitches) / DEV (query, CSV export, chart) | EIC 10 h, DEV 8 h, DS 3 h | $0 |

**Goal.** Publish the only dataset-backed answer to 'is this the most crowded release season?': releases per ISO week 2010–2026 from 333,000+ games, with a methodology block and CSV, pitched to trade press [R14 #1, #5, R21 PR-01].  
**KPI.** Referring domains linking to /data/release-congestion-2026 (manual log until a backlink tool exists) + press mentions; CSV downloads (cta_click cta_id=csv).  
**TARGET.** published 7 Oct; ≥10 personal pitches sent; ≥3 citations or links by 31 Dec; one r/dataisbeautiful OC post (C48).  
**Core message.** Week [N] of 2026 had [N] dated releases, the most since [year]. Here's the data, and the week GTA 6 cleared.  
**Proof.** Counts only day-precision release dates; 'notable' = has a critic score or ≥2 store links; both series shown; CSV downloadable [R14 §5].

**Key moments.** 2026-09-30 — query written; second person re-runs it · 2026-10-05 — chart and methodology reviewed by EIC · 2026-10-07 — publish + pitches · 2026-10-08 — r/dataisbeautiful OC (C48) · 2026-10-21 — pitch follow-ups end

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-044/D-045).

**Exact copy (Part 33).**

- **X:** We counted every dated game release per week since 2010 from TechPlay's database (333,000+ games). Week [N] of 2026 had [N] notable releases, the most since [year]. Method, chart and CSV: techplay.gg/data/release-congestion-2026
- **Threads:** Was autumn 2026 really the most crowded release season in years? We counted. The answer is [yes/no], with one caveat worth reading.
- **Bluesky:** Release congestion, measured: dated releases per week since 2010, all platforms. 2026's busiest week: [N] notable releases. Methodology + CSV: techplay.gg/data/release-congestion-2026
- **Reddit angle:** See C48 (r/dataisbeautiful OC post, chart + source/tool comment).
- **Discord:** #news: "New TechPlay data: release congestion per week since 2010. Chart + CSV: [link]. Tell us which week surprised you."
- **Newsletter blurb:** This week's data story: how crowded 2026's release calendar really was, week by week, with the CSV if you want to check us. [link]

*Pitch email (EIC, personal, to trade reporters)*
> Subject: Data: 2026's busiest release week, counted  
>
> Hi [Name],  
>
> You wrote about [their piece]. We counted every dated game release per ISO week since 2010 from our database (333,000+ games, day-precision dates only) and split 'notable' releases (critic score or at least two store links) from the long tail.  
>
> The short version: week [N] of 2026 had [N] notable releases, the most since [year]. The weeks around 19 November are [finding].  
>
> Chart, method and the CSV are here: [link]. Happy to run a cut for you (by platform, genre or month) if it helps a story.  
>
> [Name], Editor-in-Chief, TechPlay (Sarajevo)  

*LinkedIn (EIC, 1 post)*
> We published a small dataset: game releases per week since 2010, all platforms, from TechPlay's catalogue. The methodology is on the page and the CSV is free to use with credit. [link]  

*Cite-this line (page footer)*
> Source: TechPlay Games Database, [N] titles, pulled [date]. Day-precision release dates only. CC BY 4.0.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Single chart: weekly bars 2010–2026, 2026 highlighted, source line printed on the image. · *1080x1080:* Square crop of the 2026 weeks with the peak annotated. · *1280x720 thumbnail:* Page OG chart ≤300 KB. · *web banner:* Homepage module 'Data: release congestion 2026'.

**CTA.** Read the method and download the CSV  
**Landing page.** https://techplay.gg/data/release-congestion-2026 (new)  
**UTM example.** `https://techplay.gg/data/release-congestion-2026?utm_source=pr-gamesindustrybiz&utm_medium=pr&utm_campaign=c20-release-congestion&utm_content=pitch-a`  
**Tracking.** `cta_click`, `newsletter_signup`, `social_share`  
**Follow-up.** Update in place quarterly (same URL, changelog); feeds C27 State of the Catalogue.  
**Dependencies.** C03, C48, C54 (/press page for credibility)  
**Risks.** Numbers must be re-run by a second person on publication day [R14 §6].

#### C21 — World Atlas of Game Studios + Balkan Game Dev Census (PR)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Partnership / SEO) | T2 should | Wed 14 Oct 2026 → Sun 15 Nov 2026 | S8, S9 | site data page, regional press email, LinkedIn, X, Bluesky, Reddit OC (C48), Facebook (regional), newsletter | EIC (analysis, pitches) / DEV (query, map) | EIC 10 h, DEV 10 h, DS 3 h | $0 |

**Goal.** Publish studios per country (and per million people) from 57,630 studio records, with a Balkan cut for regional press, and make /studios/country/ba the reference page for Bosnian game development [R14 #7, #8, #44].  
**KPI.** Referring domains + regional press mentions; sessions on /data/studio-atlas and /studios/country/*; r/dataisbeautiful OC engagement (C48).  
**TARGET.** published 28 Oct; ≥8 regional pitches (BA, HR, RS, SI, MK, ME); ≥2 regional citations by 31 Dec; null-country share disclosed on the page.  
**Core message.** Where the world's game studios are, counted: [N] countries, [N] studios, and the Balkan numbers nobody had put in one place.  
**Proof.** 57,630 studios with country, founding date and parent company in TechPlay's database; country pages already exist [R14 §2].

**Key moments.** 2026-10-14 — query: count(*) where country is null reported · 2026-10-21 — map + Balkan table reviewed · 2026-10-28 — publish; regional pitches; OC post (C48) · 2026-11 — feeds C55 regional partnerships

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-044/D-045).

**Exact copy (Part 33).**

- **Facebook:** How many game studios does Bosnia and Herzegovina have, and how does the region compare? We counted every studio in our database by country. Balkan census and world map: [link]
- **X:** We mapped [N] game studios by country from TechPlay's database. Most studios per million people: [country]. The Balkans: [N] studios across [N] countries, the oldest founded in [year]. Map + method: techplay.gg/data/studio-atlas
- **Bluesky:** A world atlas of game studios: [N] studios by country and per million people, from TechPlay's database, with a Balkan census. Method and data: techplay.gg/data/studio-atlas
- **Reddit angle:** See C48 (r/dataisbeautiful '[OC] Game studios per million people, by country').
- **Discord:** #news: "New data: studios per country, plus a Balkan census. If your studio is missing or wrong, tell us and we'll fix it: [link]"
- **Newsletter blurb:** Data story: where the world's game studios are, per country and per million people, with a Balkan census. [link]

*Regional pitch (EIC; send in English or the outlet's language)*
> Subject: [N] game studios in Bosnia and Herzegovina — regional census  
>
> Hi [Name],  
>
> TechPlay is a gaming publication based in Sarajevo. We counted every game studio in our database of 57,630 studios by country. For the region: Bosnia and Herzegovina [N], Croatia [N], Serbia [N], Slovenia [N], North Macedonia [N], Montenegro [N]. The oldest studio in the region in our records was founded in [year].  
>
> The full table, the method and the gaps (studios with no country on record) are here: [link]. The data is free to use with credit. If you want a cut for your country, I can send it today.  
>
> [Name], Editor-in-Chief, TechPlay  

*LinkedIn (EIC)*
> We published a census of game studios by country from TechPlay's database, with a section on the Balkans. If you run a studio in the region and it's missing, send me the details and we'll add it. [link]  

Not used for this campaign: Facebook Groups, Instagram, TikTok script, Threads, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Choropleth map, studios per million people, source line on image. · *1080x1080:* Balkan bar chart. · *1280x720 thumbnail:* Page OG map ≤300 KB. · *web banner:* /studios landing module 'Studio atlas'.

**CTA.** Explore the atlas; correct your studio  
**Landing page.** https://techplay.gg/data/studio-atlas (new); https://techplay.gg/studios/country/ba  
**UTM example.** `https://techplay.gg/data/studio-atlas?utm_source=pr-klix&utm_medium=pr&utm_campaign=c21-studio-atlas&utm_content=pitch-ba`  
**Tracking.** `cta_click`, `newsletter_signup`, `social_share`  
**Follow-up.** Studio corrections form in the page footer; free CSV (R14 #54) once legal check passes; update yearly.  
**Dependencies.** C48, C55, C54, IGDB licence check (R10) before republishing IGDB-derived fields  
**Risks.** Studio ≠ active studio; state it. Regional outlet list is unverified [R14 gaps].

#### C22 — Studios Closed in 2026 tracker (F17)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also SEO / content) | T2 should | Wed 14 Oct 2026 → Thu 31 Dec 2026 | S8, S9 | site tracker, X, Bluesky, LinkedIn, Threads, newsletter, Reddit (comments) | ED (weekly updates) / EIC (launch pitch) | ED 1.5 h/week (6 h launch), EIC 2 h | $0 |

**Goal.** Maintain the structured page the week's biggest story lacks: every studio closure and major layoff in 2026 with source, date and affected games linked to game pages [R06 #1, §8, R21 TOOL-29].  
**KPI.** Organic + Discover clicks; referring domains; weekly updates shipped on time.  
**TARGET.** live 14 Oct; updated every Wednesday; every row has a primary source; ≥2 citations by 31 Dec.  
**Core message.** Every studio closed or cut in 2026, with the source and the games affected.  
**Proof.** Each row links the announcement or a named outlet's report; affected games link to TechPlay game pages [R06].

**Key moments.** 2026-10-14 — launch with the September 2026 entries · Every Wednesday — update + one-line social post (F17) · 2026-12-30 — year-end summary feeding C27

**Exact copy (Part 33).**

- **X:** Studio Watch, week of [date]: [Studio] [closed / cut N roles] ([source]). Affected games: [A], [B]. The 2026 tracker, with sources: techplay.gg/data/studios-closed-2026
- **Threads:** We keep a list of every studio closed in 2026, with sources and the games affected. This week: [change].
- **Bluesky:** Studio Watch: [change this week] ([source]). The 2026 closures and layoffs tracker, every row sourced: techplay.gg/data/studios-closed-2026
- **Reddit angle:** In r/Games layoff threads, answer 'which games are affected' with facts and the primary source; link the tracker when someone asks for the full list (C47).
- **Newsletter blurb:** Studio Watch: [change]. The full 2026 list, sourced: [link]

*Page intro*
> H1: Game studios closed in 2026  
> Intro: A running list of game studio closures and large layoffs announced in 2026. Each row gives the studio, the parent company, what was announced, the date, the source, and the games the studio worked on (linked to their TechPlay pages). 'Reported' means a named outlet reported it without company confirmation. Updated every Wednesday.  
> Launch rows include Xbox's September 2026 restructuring (as reported by Eurogamer and others), with each studio listed separately and its status wording taken from the source.  

*LinkedIn (EIC, launch)*
> We started a structured tracker of 2026 studio closures and layoffs: studio, parent, date, source, affected games. It is updated weekly and corrections are welcome. [link]  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Weekly card: studio name, status, date, source. · *1280x720 thumbnail:* Tracker OG. · *web banner:* /studios module 'Studio Watch'.

**CTA.** Read the tracker  
**Landing page.** https://techplay.gg/data/studios-closed-2026 (new)  
**UTM example.** `https://techplay.gg/data/studios-closed-2026?utm_source=bluesky&utm_medium=organic-social&utm_campaign=c22-studios-closed&utm_content=f17-w42`  
**Tracking.** `cta_click`, `newsletter_signup`, `social_share`  
**Follow-up.** Needs a status field on studios later (D-034-style); year-end numbers feed C27.  
**Dependencies.** C48 (Reddit timing), C54  
**Risks.** Wording must match sources; labour stories are sensitive; no speculation about unannounced closures.

#### C23 — Sequel Gap Inflation: 'Why GTA 6 took 13 years' (PR)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Social) | T2 should | Mon 19 Oct 2026 → Wed 18 Nov 2026 | S8, S4 | site data page, email pitches, X, Bluesky, Threads, Instagram single, Reddit OC (C48, optional), newsletter | EIC | EIC 10 h, DEV 4 h, DS 2 h | $0 |

**Goal.** Use series data to measure how long franchises now wait between main entries, by decade, with GTA V (2013) to GTA VI (2026) as the hook in launch month [R14 #24].  
**KPI.** Referring domains + press mentions; Discover clicks; social shares of the chart.  
**TARGET.** published 4 Nov with the top 50 series hand-verified; ≥8 pitches (mainstream + trade); ≥2 citations by 31 Dec.  
**Core message.** GTA 6 took 13 years. Across the biggest series, the gap between main entries has grown from [N] years in the [decade] to [N] now.  
**Proof.** Series relations and first/last years in the database; top 50 series checked by hand against publisher release dates [R14 #24].

**Key moments.** 2026-10-19 — query on game_series + hand check of top 50 · 2026-11-02 — review · 2026-11-04 — publish + pitches · 2026-11-18 — pitch follow-up before GTA week

**Exact copy (Part 33).**

- **Instagram:** Single image (1080x1350): chart of median sequel gap by decade; caption: GTA V to GTA VI took 13 years. Across [N] big series, gaps have grown from [N] to [N] years. Source: TechPlay Games Database, series checked by hand.
- **X:** GTA V came out in 2013. GTA VI arrives 19 Nov 2026: 13 years. Is that normal now? Across [N] major series, the median gap between main entries went from [N] years to [N]. Chart + method: [link]
- **Threads:** 13 years between GTA V and VI. We checked whether that's an outlier or the new normal for big series. It's [finding].
- **Bluesky:** 13 years between GTA V and GTA VI. We measured the gap between main entries in [N] big series, by decade: [finding]. [link]
- **Reddit angle:** Optional r/dataisbeautiful OC post if the chart passes EIC review; same rules as C48.
- **Discord:** #gta6: "New data piece: sequel gaps by decade, GTA included. Which series waited longest? [link]"
- **Newsletter blurb:** Data story: why GTA 6 took 13 years, and what that says about every big series. [link]

*Pitch (EIC)*
> Subject: GTA 6 took 13 years. Is that the new normal? (data)  
>
> Hi [Name],  
>
> Ahead of GTA VI on 19 November: we measured the gap between main entries across [N] major series using TechPlay's database, checking the top 50 by hand. The median gap went from [N] years in the [decade] to [N] in the 2020s. GTA's 13 years is [rank] on the list.  
>
> Chart and method: [link]. Free to use with credit; I can send cuts by publisher or genre.  
>
> [Name], TechPlay  

Not used for this campaign: Facebook, Facebook Groups, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Line/dot chart: median gap by decade, GTA highlighted. · *1080x1080:* Square version. · *1280x720 thumbnail:* Page OG.

**CTA.** See the data  
**Landing page.** https://techplay.gg/news/why-gta-6-took-13-years-sequel-gaps (article on /news, data section)  
**UTM example.** `https://techplay.gg/news/why-gta-6-took-13-years-sequel-gaps?utm_source=pr-gamesbeat&utm_medium=pr&utm_campaign=c23-sequel-gap&utm_content=pitch-a`  
**Tracking.** `cta_click`, `social_share`, `newsletter_signup`  
**Follow-up.** Feeds C27; add C63 series pages as links from the chart.  
**Dependencies.** D-033 (release-date change log, helps future slip stats), C63  
**Risks.** Series membership quality from the IGDB import is unmeasured; publish only the hand-checked set.

#### C24 — The $80 Tracker (PR)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also SEO) | T2 should | Mon 26 Oct 2026 → Thu 31 Dec 2026 | S7, S8, S1 | site tracker, X, Bluesky, Threads, Facebook, Instagram single, newsletter, pitches | ED (log) / EIC (review, pitch) | ED 6 h + 15 min per launch, EIC 3 h, DS 1.5 h | $0 |

**Goal.** Log the launch base price of every notable 2026 release and publish how many launched at $79.99, a week before GTA VI makes the $80 debate mainstream [R14 #17].  
**KPI.** Referring domains + mentions; organic clicks on the tracker; update cadence kept.  
**TARGET.** published 11 Nov with a transparent 'notable' definition; updated at each notable launch to 31 Dec; ≥2 citations.  
**Core message.** How many of 2026's big games cost $80 at launch? We logged every one.  
**Proof.** Launch price read from the platform store on launch day, logged with date; GTA VI $79.99 / $99.99 confirmed [R17].

**Key moments.** 2026-10-26 — price capture starts (store launch price per notable release; manual log) · 2026-11-11 — publish · 2026-11-19 — GTA VI entry ($79.99 standard, $99.99 Ultimate) · 2026-12-31 — year total feeds C27

**Exact copy (Part 33).**

- **Facebook:** $70 or $80? We logged the launch price of every notable game in 2026. Here's how many went to $79.99, and which ones: [link]
- **Instagram:** Single image: bar split $59.99 / $69.99 / $79.99 counts. Caption: The $80 tracker: launch prices for notable 2026 games. GTA VI: $79.99. Full table: link in bio.
- **X:** The $80 game is here. Of [N] notable 2026 releases we logged, [N] launched at $79.99 base price, [N] at $69.99. GTA VI joins on 19 Nov at $79.99. The full log: [link]
- **Threads:** Is $80 the new standard price? We logged every notable 2026 launch to check. It's [finding]. Would you pay it for GTA 6?
- **Bluesky:** We logged the launch price of every notable 2026 game. [N] launched at $79.99. Method and the full table: [link]
- **Newsletter blurb:** The $80 tracker: every notable 2026 game's launch price, and how many hit $79.99. [link]

*Definition box on page*
> Notable = released in 2026 on PS5, Xbox Series X|S, Switch 2 or PC by a publisher on our list [link to list], or with a critic score on OpenCritic. Price = US base-edition price on the platform store on launch day. Deluxe and Ultimate editions are listed separately.  

Not used for this campaign: Facebook Groups, TikTok script, Reddit angle, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Price bands chart. · *1080x1080:* Card: '[N] of [N] launched at $79.99'. · *1280x720 thumbnail:* Tracker OG.

**CTA.** See every launch price  
**Landing page.** https://techplay.gg/news/the-80-dollar-tracker-2026 (article on /news, updated in place)  
**UTM example.** `https://techplay.gg/news/the-80-dollar-tracker-2026?utm_source=x&utm_medium=organic-social&utm_campaign=c24-80-tracker&utm_content=card-a`  
**Tracking.** `cta_click`, `social_share`  
**Follow-up.** Feeds C25 cost-per-hour and C27.  
**Dependencies.** C25

#### C25 — Best Value Games of 2026: cost per hour (PR, Black Friday hook)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Seasonal) | T3 cut first | Mon 9 Nov 2026 → Tue 1 Dec 2026 | S7, S8, S1 | site data page, X, Bluesky, Threads, Facebook, Instagram carousel, newsletter, pitches (consumer press) | EIC | EIC 8 h, DEV 3 h, DS 2 h | $0 |

**Goal.** Rank 2026 releases by price per hour of play, published four days before Black Friday, using launch prices (C24) and a licensed time-to-beat source [R14 #42].  
**KPI.** Referring domains + mentions; organic + Discover clicks 23 Nov–1 Dec; shelf_add from the list.  
**TARGET.** published 23 Nov only if the time-to-beat licence check passes; otherwise ship the price-only version.  
**Core message.** The best-value games of 2026, measured in dollars per hour.  
**Proof.** Launch prices from C24; time-to-beat from IGDB only under agreed terms; HowLongToBeat data is not used (reproduction prohibited) [R14 §6].

**Key moments.** 2026-11-09 — EIC checks IGDB terms for time-to-beat use (commercial use requires agreement; partner@igdb.com) — go/no-go · 2026-11-20 — draft · 2026-11-23 — publish · 2026-11-27 — Black Friday reshare

**Exact copy (Part 33).**

- **Facebook:** Before Black Friday: which 2026 games give you the most hours per dollar? We divided launch price by typical completion time. Top of the list: [Game]. [link]
- **Instagram:** Carousel: 'MOST HOURS PER DOLLAR, 2026' — top 8, each with $/hour. Caption: Launch price divided by median completion time. Sale prices make these even better.
- **X:** Best value games of 2026, by cost per hour: [Game] works out at $[N]/hour, [Game] at $[N]. Method (launch price ÷ median time to beat) and the full list: [link]
- **Threads:** Cost per hour is a crude way to value a game, and we did it anyway. The winner surprised us: [Game].
- **Bluesky:** Cost per hour for 2026's releases: launch price ÷ median time to beat. Method, caveats and list: [link]
- **Newsletter blurb:** Before Black Friday: 2026's best value games, in dollars per hour. [link]

Not used for this campaign: Facebook Groups, TikTok script, Reddit angle, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Ranked carousel. · *1080x1080:* Card top 3. · *1280x720 thumbnail:* Page OG.

**CTA.** See the list; add a game to your shelf  
**Landing page.** https://techplay.gg/news/best-value-games-2026-cost-per-hour (article on /news)  
**UTM example.** `https://techplay.gg/news/best-value-games-2026-cost-per-hour?utm_source=facebook&utm_medium=organic-social&utm_campaign=c25-cost-per-hour&utm_content=post-a`  
**Tracking.** `cta_click`, `shelf_add`, `social_share`  
**Follow-up.** Link from C31/C32 Black Friday posts.  
**Dependencies.** C24, IGDB terms check (R10, R14 §6), C31  
**Risks.** Licence: IGDB API is free for non-commercial use; TechPlay is ad-supported. No-go = publish without hours.

#### C26 — Achievement Difficulty by Genre, 500 Steam games (PR)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Reddit) | T3 cut first | Mon 16 Nov 2026 → Tue 22 Dec 2026 | S8, S3, S2 | site data page, Reddit OC (C48), X, Bluesky, Threads, Instagram carousel, newsletter, pitches | EIC (analysis) / DEV (pull) | EIC 10 h, DEV 10 h, DS 2 h | $0 |

**Goal.** Extend a known 19-game analysis 25-fold: share of players who reach the 'finished the story' achievement, 500 Steam games, by genre, using Steam's public global achievement percentages and TechPlay's genre data [R14 #18].  
**KPI.** Referring domains + mentions; r/dataisbeautiful and r/patientgamers reception (C48); mapping-file downloads.  
**TARGET.** published 8 Dec with the mapping file; ≥2 citations by 15 Jan 2027.  
**Core message.** Most players never see the credits. Across 500 games, the median share who finish is [N]%, and it varies by genre from [N]% to [N]%.  
**Proof.** Steam's own public achievement percentages, so anyone can verify; the ending-achievement mapping is published [R14 #18].

**Key moments.** 2026-11-16 — Steam Web API terms read; pull script (DEV) · 2026-11-30 — 'ending achievement' mapping reviewed by hand · 2026-12-08 — publish + OC post · 2026-12-22 — follow-ups

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-044 extension scheduled 2027-W09. The campaign moves to the Q1 data calendar; 8 Dec copy is held.

**Exact copy (Part 33).**

- **Instagram:** Carousel: S1 'HOW MANY PLAYERS FINISH?' S2 median. S3–S6 genres. S7 'Source: Steam global achievement %, 500 games'.
- **X:** How many players finish the games they start? Across 500 Steam games, the median share who unlock the 'finished the story' achievement is [N]%. By genre: [genre] [N]%, [genre] [N]%. Data + mapping file: [link]
- **Threads:** Only [N]% of players finish the average game, by Steam's own achievement numbers. Which genre do you think finishes least?
- **Bluesky:** 500 Steam games, one question: what share of players finish? Median [N]%, with a big spread by genre. Method and data: [link]
- **Reddit angle:** C48: r/dataisbeautiful '[OC] Share of Steam players who finish the story, by genre (500 games)'.
- **Newsletter blurb:** Data story: how many players finish what they start, across 500 Steam games. [link]

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Box plot by genre, source line on image. · *1080x1080:* Card: median. · *1280x720 thumbnail:* Page OG.

**CTA.** See the data and mapping file  
**Landing page.** https://techplay.gg/news/how-many-players-finish-games-500-steam-games (article on /news)  
**UTM example.** `https://techplay.gg/news/how-many-players-finish-games-500-steam-games?utm_source=reddit&utm_medium=community&utm_campaign=c26-achievement-difficulty&utm_content=oc-post&utm_term=dataisbeautiful`  
**Tracking.** `cta_click`, `social_share`  
**Follow-up.** Feeds C27; backlog angle for January (resolutions).  
**Dependencies.** C48, Steam Web API terms (R14 gaps)

#### C27 — State of the Catalogue 2026 report

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR | T3 cut first | Tue 1 Dec 2026 → Tue 12 Jan 2027 | S8, S9 | site report page + PDF, pitches, LinkedIn, X, Bluesky, newsletter | EIC | EIC 16 h, DEV 6 h, DS 6 h | $0 |

**Goal.** One dated, citable document that collects 2026's TechPlay datasets (release congestion, studios, closures, prices, completion) so outlets and Wikipedia editors can cite 'TechPlay's 2026 report' [R14 #43].  
**KPI.** Citations and referring domains in Q1 2027; downloads (cta_click cta_id=report-pdf).  
**TARGET.** draft by 18 Dec; peer-checked by a second person; publish Tue 12 Jan 2027.  
**Core message.** 2026 in games, counted: releases, studios, closures, prices and who finishes what.  
**Proof.** Every number re-run on publication day from the database and public sources, with methods [R14 §5–6].

**Key moments.** 2026-12-01 — outline · 2026-12-18 — draft complete · 2027-01-08 — numbers re-run · 2027-01-12 — publish

**Exact copy (Part 33).**

- **X:** The TechPlay State of the Catalogue 2026: releases per week, studios by country, closures, launch prices and completion rates, in one report with methods. [link]
- **Bluesky:** Our 2026 data in one report: release congestion, studio geography, closures, the $80 question and completion rates. Free with credit: [link]
- **Newsletter blurb:** Our first annual report is out: 2026 in games, counted. [link]

*LinkedIn (EIC)*
> TechPlay's first annual data report, State of the Catalogue 2026, is out. Methods are in the document; the numbers are free to cite. [link]  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Reddit angle, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* Report cover. · *1080x1350:* Five-chart summary card.

**CTA.** Read the report  
**Landing page.** https://techplay.gg/data/state-of-the-catalogue-2026 (new, Jan 2027)  
**UTM example.** `https://techplay.gg/data/state-of-the-catalogue-2026?utm_source=linkedin&utm_medium=organic-social&utm_campaign=c27-state-of-catalogue&utm_content=launch-a`  
**Tracking.** `cta_click`, `newsletter_signup`  
**Follow-up.** Annual; pitch to GDC-week coverage in March.  
**Dependencies.** C20, C21, C22, C24, C26

### C28–C30: Year-end product and community

#### C28 — Your 2026 in Games — cross-platform year in review

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also Social / viral) | T2 should | Mon 16 Nov 2026 → Thu 31 Dec 2026 | S2, S1, S10 | site, Instagram Stories, X, Threads, TikTok, Discord, newsletter, push | DEV (build) / DS (card design) / SC (launch) | DEV 40 h, DS 8 h, SC 4 h, ED 2 h | $0 |

**Goal.** Give members a shareable year-in-review built from all five linked platforms, the artefact competitors limited to one store cannot produce, and use it as December's main registration reason [R11 §3, R21 TOOL-01].  
**KPI.** share_card_generated ÷ year-in-review views; registration_complete with from=year-in-review; library_connected in 14–31 Dec.  
**TARGET.** built and QA'd by 10 Dec; live 14 Dec; library_connected in 14–31 Dec UP vs 1–13 Dec daily average.  
**Core message.** Your 2026 in games, across Steam, PlayStation, Xbox, GOG and Epic, in one card.  
**Proof.** Five platforms import for free; hours come from the platforms, not from guesses [spine §2, R11].

**Key moments.** 2026-11-16 — build starts (D-025, D-024) · 2026-12-10 — QA with staff libraries · 2026-12-14 — live; members emailed · 2026-12-21 — reminder to those who haven't opened it · 2026-12-31 — close of 2026 data

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-025 built by 13 Dec, live 14 Dec as planned.

**Acceptance criteria.**
- [ ] /year-in-review renders for signed-in members with ≥1 linked platform or ≥3 shelf items; empty-state explains how to fill it.
- [ ] Card shows only data we hold (games played, hours where the platform reports them, top genre, most-played game, platforms); every number has a basis note.
- [ ] Share card 1080x1920 and 1200x630 generated server-side (share_card_generated); no personal data in the URL beyond username with consent.
- [ ] Guest page explains the feature with a staff example and a Steam/Google sign-in (C44).

**Exact copy (Part 33).**

- **Facebook:** Your 2026 in games, from every platform you play on, in one card. Link Steam, PlayStation, Xbox, GOG or Epic and it builds itself: [link]
- **Instagram:** Story template (member share): '[username]'s 2026 in games / [N] games / [N] hours / top genre [X] / most played [Y] / made on TechPlay'. Brand Story: 'Your 2026 in games, across every platform you play on. Link a library and it builds itself.'
- **TikTok script:** 15 s: staff member's card animating in stat by stat; text 'Your year across every platform'. End: techplay.gg/year-in-review
- **X:** Your 2026 in games, across Steam, PlayStation, Xbox, GOG and Epic: games played, hours, top genre, most-played. Link a library and the card builds itself: techplay.gg/year-in-review
- **Threads:** Made our own year-in-review card from five platforms at once. Mine says I played [N] games and finished [N]. What would yours say?
- **Discord:** #announcements: "Your 2026 in games is live. Post your card in #year-in-review; Buffy picks five for Friday's newsletter (only with your OK)."
- **Newsletter blurb:** Your 2026 in games is ready: every platform you linked, one card. [personal link]
- **Push text:** Your 2026 in games is ready. [N] games, [N] hours. Open your card.

Not used for this campaign: Facebook Groups, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Ad copy.

**Creative.** *1080x1920:* Member share card (vertical). · *1200x630 / 1280x720:* Landscape share card for X/Discord. · *1080x1350:* Brand carousel explaining the card with a staff example. · *web banner:* Homepage hero swap 14–31 Dec.

**CTA.** See your 2026 in games  
**Landing page.** https://techplay.gg/year-in-review (new)  
**UTM example.** `https://techplay.gg/year-in-review?utm_source=instagram&utm_medium=organic-social&utm_campaign=c28-year-in-review&utm_content=story-share`  
**Tracking.** `share_card_generated`, `registration_complete`, `library_connected`, `social_share`, `d1_return`  
**Follow-up.** Keep live into January as 'Your 2026'; Gamer DNA card (D-024) stays year-round.  
**Dependencies.** D-025, D-024, C44, C42 (email), C59 (push)  
**Risks.** Scope (L): if D-025 slips past 10 Dec, ship a reduced card (games + top platform) rather than nothing.

#### C29 — Game Awards Prediction League

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Product) | T3 cut first | Wed 18 Nov 2026 → Fri 11 Dec 2026 | S10, S1, S8 | site (/awards/2026), Discord (watch party), X, Threads, Bluesky, Instagram, newsletter | SC (running it) / DEV (league, D-026) | DEV 16 h, SC 8 h, DS 3 h, EIC 2 h (live night) | $0 (No prize by default; if C09 showed good entrant quality, EIC may add a single game key.) |

**Goal.** Run a free prediction league for The Game Awards (10 Dec), scored live on the night in Discord, so the biggest December event produces accounts and a watch party [R13 ritual 6, R15 #15].  
**KPI.** Entries = members with ≥5 category predictions; discord_join (invite C29); registration_complete from=awards.  
**TARGET.** league open within 48 h of the official nominee list (or 18 Nov if already public); entries UP vs C09 entrants; watch party held 10 Dec.  
**Core message.** Pick The Game Awards winners before 10 December. We score it live on the night.  
**Proof.** Nominee pages linked to TechPlay game pages; scoring is one point per correct category, published in advance.

**Key moments.** 2026-11-18 — league opens (after nominees are public) · 2026-12-06 — reminder · 2026-12-10 — predictions lock 1 h before the show; Discord watch party + F20 live thread · 2026-12-11 — leaderboard final; winners posted

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-026 slips to 2027 (used for TGA 2027). Interim for 10 Dec: one forum poll per category plus Discord polls; SC scores in a sheet and Buffy posts the table on the night. Copy stays, with 'techplay.gg/awards/2026' replaced by the forum thread link.

**Exact copy (Part 33).**

- **Instagram:** Story: poll sticker 'Game of the Year?' with two nominees + link sticker 'Predict every category'.
- **X:** The Game Awards are on 10 Dec. Our prediction league is open: pick the winners, we score it live on the night, the leaderboard is public. Free with a TechPlay account: techplay.gg/awards/2026
- **Threads:** Game of the Year: who takes it? Our prediction league is open until 10 Dec. I'm going with [staff pick], which is probably wrong.
- **Bluesky:** TGA prediction league: pick every category before 10 Dec; scored live on the night. techplay.gg/awards/2026
- **Discord:** Event: 'The Game Awards watch party' — Thu 10 Dec, voice + #tga-live. "Predictions lock one hour before the show. Buffy posts the leaderboard after every category."
- **Newsletter blurb:** The Game Awards prediction league is open. Pick the winners before 10 Dec; the top three predictors are named in the next issue. [link]

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1920:* Story/event poster. · *1080x1080:* Leaderboard card template (live on the night). · *1280x720 thumbnail:* /awards/2026 OG.

**CTA.** Make your predictions  
**Landing page.** https://techplay.gg/awards/2026 (new)  
**UTM example.** `https://techplay.gg/awards/2026?utm_source=x&utm_medium=organic-social&utm_campaign=c29-tga-predictions&utm_content=open-a`  
**Tracking.** `registration_complete`, `discord_join`, `cta_click`, `d1_return`  
**Follow-up.** Leaderboard winners get a site badge; same page hosts C30.  
**Dependencies.** D-026, C30, C36

#### C30 — TechPlay Community Awards 2026

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community | T3 cut first | Tue 1 Dec 2026 → Sun 20 Dec 2026 | S10, S2 | site (/awards/2026), Discord polls, forum, X, Instagram, newsletter | SC | SC 8 h, ED 3 h (results article), DS 2 h | $0 |

**Goal.** A members' vote on the year, run on the site and in Discord, with results on 20 Dec; small, honest, and a reason to come back twice [R13 ritual 7].  
**KPI.** Voters = members casting ≥1 vote; comment_created on the results page; discord_join during voting.  
**TARGET.** 6 categories; results published 20 Dec with the number of voters shown (whatever it is).  
**Core message.** Your game of the year, by people who log what they play.  
**Proof.** Votes from verified members; the results page shows how many voted.

**Key moments.** 2026-12-01 — nominations open (members suggest, 4 days) · 2026-12-05 — voting opens · 2026-12-17 — voting closes · 2026-12-20 — results

**Exact copy (Part 33).**

- **Instagram:** Carousel: the six categories. Caption: Our members' awards for 2026. Voting until 17 Dec; results on the 20th, with the vote counts.
- **X:** TechPlay Community Awards 2026: members vote on six categories, from game of the year to best Next Fest demo. Voting open until 17 Dec: techplay.gg/awards/2026
- **Threads:** Voting's open in our community awards. The category I'm most curious about: 'best game you played this year, from any year'.
- **Discord:** #announcements: "Community Awards: nominate in the forum thread until 4 Dec, vote from 5 Dec. Categories: Game of the Year (released in 2026), Best game you played this year (any year), Biggest surprise, Best Next Fest demo, Best soundtrack, Buffy's award for the game the server wouldn't stop talking about."
- **Newsletter blurb:** Vote in the TechPlay Community Awards before 17 December. Six categories, results on the 20th. [link]

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Category carousel. · *1080x1080:* Results cards (20 Dec). · *1280x720 thumbnail:* Results OG.

**CTA.** Vote  
**Landing page.** https://techplay.gg/awards/2026 (new)  
**UTM example.** `https://techplay.gg/awards/2026?utm_source=discord&utm_medium=community&utm_campaign=c30-community-awards&utm_content=vote-a`  
**Tracking.** `registration_complete`, `comment_created`, `discord_join`, `cta_click`  
**Follow-up.** Results feed C70 and C40's last issue of the year.  
**Dependencies.** D-026, C29, C18 (Next Fest category)

### C31–C34: Deals season

#### C31 — Black Friday Wishlist Price Alerts

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also Seasonal / Email) | T2 should | Fri 20 Nov 2026 → Tue 1 Dec 2026 | S7, S2, S1 | email, Discord DM, web push, site, X, Instagram, Facebook, newsletter | DEV (D-027) / SC (announcement) | DEV 20 h, SC 3 h, DS 1 h | $0 |

**Goal.** Make Black Friday week the moment price alerts prove themselves: members who wishlist a game get an email or Discord DM when its Steam or GOG price drops [R11 §3, R21 TOOL-47, CH-03].  
**KPI.** Alert CTR = alert_clicked ÷ reminder_delivered (channel=email|discord) for price alerts sent 20 Nov–1 Dec; new wishlists added (shelf_add status=wishlist) in the same window.  
**TARGET.** alerts live by 20 Nov; complaint rate <0.1% and unsubscribe <0.5% per send (guardrails); wishlist adds UP vs the previous 10 days.  
**Core message.** Wishlist it once. We'll tell you when it's cheaper.  
**Proof.** Nightly Steam and GOG prices are already refreshed for games on members' shelves; alerts go to email or Discord DM [R14 §2].

**Key moments.** 2026-11-13 — D-027 in QA · 2026-11-20 — 'Price alerts are live' announcement · 2026-11-27 — Black Friday · 2026-11-30 — Cyber Monday (C32) · 2026-12-01 — report

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-027 price alerts ship 25 Nov (not 20 Nov). From 20 Nov, Deal Radar (F16) posts run without personalisation; the 'Price alerts are live' copy goes out on 25 Nov.

**Acceptance criteria.**
- [ ] Price alert fires when a wishlisted game's Steam or GOG price is ≥[threshold]% below the last alert price; max one alert per game per 14 days (Steam's own cadence as a model).
- [ ] Channels: email (verified addresses only), Discord DM (linked accounts), push after C59.
- [ ] Every alert states the store, the price, the date checked, and links to the game page and store.
- [ ] Settings page lets members turn price alerts off per channel in one click.

**Exact copy (Part 33).**

- **Facebook:** Black Friday week: instead of checking prices every day, wishlist the games you want on TechPlay. When the Steam or GOG price drops, you get an email or a Discord DM. Free: [link]
- **Instagram:** Story: 'Wishlist it once. We'll tell you when it's cheaper.' Screen recording: tap Wishlist on a game page, then the alert email. Link sticker.
- **X:** Price alerts are live on TechPlay: wishlist a game and we'll email you (or DM you on Discord) when its Steam or GOG price drops. Just in time for Black Friday: techplay.gg/calendar
- **Threads:** We finally built the thing: wishlist a game, get told when it's cheaper. What's the one game you're waiting to drop?
- **Discord:** #deals: "Price alerts are live. Wishlist games on TechPlay and I'll DM you here when the Steam or GOG price drops (link your Discord in Settings). One alert per game per two weeks, no spam."
- **Newsletter blurb:** New before Black Friday: wishlist a game and we'll tell you when it gets cheaper on Steam or GOG. [link]
- **Push text:** [Game] dropped to [price] on [store] (−[N]%). Checked [time].

*Alert email*
> Subject: [Game] is [N]% off on [Store]  
> Preheader: Now [price], down from [price]. Checked [date, time CET].  
> Body: [Game] is on your TechPlay wishlist. On [Store] it's now [price] (was [price]). [Button: See the deal] [Link: Game page]  
> Footer: You get one alert per game per two weeks. Turn off price alerts: [link]. — Professor Buffy, TechPlay  

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Ad copy.

**Creative.** *1080x1920:* Screen recording wishlist → alert. · *1080x1080:* Card 'Wishlist it once'. · *1280x720 thumbnail:* Announcement OG. · *web banner:* Game page inline 'Get a price alert' button label.

**CTA.** Wishlist a game to get price alerts  
**Landing page.** https://techplay.gg/calendar and any /games/{slug} page (Wishlist button)  
**UTM example.** `https://techplay.gg/calendar?utm_source=discord&utm_medium=community&utm_campaign=c31-bf-price-alerts&utm_content=deals-pin`  
**Tracking.** `shelf_add(status=wishlist)`, `reminder_delivered`, `alert_clicked`, `registration_complete`, `notification_enabled`  
**Follow-up.** Alerts stay on permanently; C34 Winter Sale is the second test.  
**Dependencies.** D-027, D-013, C43, C59  
**Risks.** Deliverability: a price-alert spike from a self-hosted sender; cap sends and monitor complaints [R20 §4].

#### C32 — Cyber Monday Deal Radar (F16)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Seasonal (also Social) | T2 should | Fri 27 Nov 2026 → Mon 30 Nov 2026 | S7, S6, S3 | site, Instagram carousel, Facebook, X, Threads, Discord #deals, newsletter special | ED (roundup) / SC (social) | ED 6 h, SC 3 h, DS 2 h | $0 (Affiliate links only if disclosed above the first deal.) |

**Goal.** One well-made Cyber Monday roundup for games and hardware people actually asked about, with honest price context after 2026's console price rises [R05 §5, R05 row 30 Nov].  
**KPI.** Roundup sessions; cta_click on store links; newsletter_signup from the roundup.  
**TARGET.** live 07:00 CET 30 Nov; updated twice that day.  
**Core message.** The Cyber Monday deals worth it, and the context: consoles cost more in 2026 than they did a year ago.  
**Proof.** Switch 2 $499.99 since 1 Sep 2026; Xbox Series X $649.99 since 1 Aug; PS5 rose 2 Apr [R05 §1 exec 7].

**Key moments.** 2026-11-27 — Black Friday roundup (same page, starts BF) · 2026-11-30 — Cyber Monday update · 2026-11-30 — newsletter special

**Exact copy (Part 33).**

- **Facebook:** Cyber Monday: the deals worth it, checked this morning. Context first: consoles got more expensive this year (Switch 2 is $499.99 since September), so a 'deal' needs a baseline. Our list: [link]
- **Instagram:** Carousel: S1 'CYBER MONDAY: WORTH IT?' S2 'Console prices in 2026' (Switch 2 $499.99; Series X $649.99). S3–S7 deals with price and one-line verdict. S8 'Full list, updated today'.
- **X:** Cyber Monday deals worth it, checked at [time]. A reminder: Switch 2 has been $499.99 since 1 Sep and Series X $649.99 since 1 Aug, so check what the 'sale' price compares to. [link]
- **Threads:** Cyber Monday check: what did you actually buy this weekend? Asking for the 'regret it / glad I did' follow-up.
- **Discord:** #deals: "Cyber Monday roundup, updated at [time]: [link]. Post finds with the price and store; staff check the best ones for the list."
- **Newsletter blurb:** Cyber Monday special: the deals worth it and the ones to skip. Updated at [time]. [link]

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Deals carousel. · *1080x1080:* Price-context card. · *1280x720 thumbnail:* Roundup OG.

**CTA.** See the deals worth it  
**Landing page.** https://techplay.gg/hardware/black-friday-cyber-monday-2026-deals (article on /hardware)  
**UTM example.** `https://techplay.gg/hardware/black-friday-cyber-monday-2026-deals?utm_source=facebook&utm_medium=organic-social&utm_campaign=c32-cyber-monday&utm_content=f16-post-a`  
**Tracking.** `cta_click`, `newsletter_signup`, `shelf_add`  
**Follow-up.** Remove expired deals 1 Dec; page becomes 'what to wait for until the Winter Sale'.  
**Dependencies.** C31, C25

#### C33 — Gift Guide from Wishlists

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Seasonal (also Product) | T3 cut first | Tue 1 Dec 2026 → Sun 20 Dec 2026 | S2, S1, S10 | site, Instagram, Facebook, X, Threads, Discord, newsletter | ED (guide) / SC (social) / DEV (share link) | ED 6 h, SC 3 h, DEV 6 h, DS 2 h | $0 |

**Goal.** Let members share a gift list made from their TechPlay wishlist, and publish an editorial gift guide that links to it; the gift list is a registration reason for the giver and the receiver [R21 TOOL-53].  
**KPI.** Gift lists shared (social_share content_type=gift-list); registration_complete from=gift-list; shelf_add from the guide.  
**TARGET.** share-your-wishlist link live 1 Dec; guide live 3 Dec; gift-list registrations reported 21 Dec.  
**Core message.** Send your wishlist instead of a hint.  
**Proof.** Wishlists already exist on shelves; the list shows platform so gifts fit the right console [R11].

**Key moments.** 2026-12-01 — 'Share your wishlist as a gift list' live · 2026-12-03 — editorial gift guide · 2026-12-14 — reminder with Year in Review · 2026-12-20 — last shipping-safe push (digital gifts only after)

**Acceptance criteria.**
- [ ] Members can create a public link to their wishlist (opt-in, off by default) showing game, platform owned and store links.
- [ ] Visitors to a gift list see 'Make your own' → C44 sign-in.
- [ ] social_share (content_type=gift-list) fires on share.

**Exact copy (Part 33).**

- **Facebook:** Easier than hinting: make your TechPlay wishlist into a gift list, with the right platform for each game, and send the link. [link]
- **Instagram:** Story: 'Send your wishlist instead of a hint.' Screen recording of turning on the gift-list link.
- **X:** Gift season fix: turn your TechPlay wishlist into a shareable gift list, platform included, so nobody buys you the PS5 version of a game you own on PC. [link]
- **Threads:** Best gift you ever got that was actually on your list? And the worst 'close but wrong platform' gift?
- **Discord:** #general: "Gift lists are live: Settings → Wishlist → Share as gift list. Post yours in #gift-lists if you want the server to see it."
- **Newsletter blurb:** Two things for December: our gift guide, and a way to send your own wishlist as a gift list. [link]

*Guide title*
> Gaming gift guide 2026: games and gear by budget, and how to send your wishlist instead  

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1920:* Story recording. · *1080x1350:* Gift guide carousel by budget. · *1280x720 thumbnail:* Guide OG.

**CTA.** Share your wishlist as a gift list  
**Landing page.** https://techplay.gg/guides/gaming-gift-guide-2026 (article on /guides); gift list at https://techplay.gg/profile/{username}  
**UTM example.** `https://techplay.gg/guides/gaming-gift-guide-2026?utm_source=instagram&utm_medium=organic-social&utm_campaign=c33-gift-guide&utm_content=story-a`  
**Tracking.** `social_share`, `registration_complete`, `shelf_add`, `cta_click`  
**Follow-up.** Gift list stays for birthdays; review usage in January.  
**Dependencies.** C44, Profile wishlist privacy setting (DEV check)

#### C34 — Steam Winter Sale Picks

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Seasonal (also Social / Email) | T2 should | Thu 17 Dec 2026 → Mon 4 Jan 2027 | S7, S3, S1, S2 | site (/steam), Instagram, Facebook, X, Threads, Bluesky, Discord, newsletter, push | ED / SC | ED 8 h, SC 5 h, DS 2 h | $0 |

**Goal.** Run the quarter's biggest sale moment on the /steam hub, with picks, wishlist price alerts and Steam Awards voting, and beat the Autumn Sale's sign-up ratio [R05 row 17 Dec].  
**KPI.** Sign-ups per 1,000 sale-page sessions (as C05) and alert_clicked from price alerts during the sale.  
**TARGET.** ratio ≥1.5× C05 baseline; alerts CTR ≥ C31's.  
**Core message.** Winter Sale picks, and your own wishlist checked for you.  
**Proof.** Price alerts from C31; /steam hub from C62.

**Key moments.** 2026-12-17 — sale opens: picks live · 2026-12-18 — newsletter · 2026-12-22 — 'best of 2026 on sale' · 2026-12-28 — 'Steam Awards voting explained' (if Valve runs voting in the sale, as in past years) · 2027-01-04 — last-day post

**Exact copy (Part 33).**

- **Facebook:** The Steam Winter Sale runs until 4 January. Our picks are up, and if you wishlist games on TechPlay you'll get an alert when they drop: [link]
- **Instagram:** Carousel: 'WINTER SALE PICKS' — 8 games, price, one line. Caption: Updated during the sale. Set alerts for the rest of your wishlist: link in bio.
- **X:** Steam Winter Sale (until 4 Jan): our picks, and a tip: wishlist on TechPlay and we'll alert you when the price drops, so you don't have to check daily. [link]
- **Threads:** Winter Sale's on. What's the one game you've waited all year to buy on sale?
- **Bluesky:** Steam Winter Sale picks, updated during the sale, plus price alerts for your wishlist: [link]
- **Discord:** #deals: "Winter Sale thread. Post the price and store with each find. Alerts: wishlist on TechPlay and I'll DM you when it drops."
- **Newsletter blurb:** Steam Winter Sale: our picks, the best of 2026 on sale, and alerts for your wishlist. [link]
- **Push text:** Winter Sale: [Game] from your wishlist is [price] (−[N]%).

Not used for this campaign: Facebook Groups, TikTok script, Reddit angle, YouTube, Shorts/Reels script, Ad copy.

**Creative.** *1080x1350:* Picks carousel. · *1080x1920:* Stories with countdown to 4 Jan. · *1280x720 thumbnail:* Hub OG. · *web banner:* Homepage strip 17 Dec–4 Jan.

**CTA.** See the picks; wishlist for alerts  
**Landing page.** https://techplay.gg/steam (new)  
**UTM example.** `https://techplay.gg/steam?utm_source=newsletter&utm_medium=email&utm_campaign=c34-winter-sale&utm_content=picks-a`  
**Tracking.** `cta_click`, `shelf_add`, `alert_clicked`, `newsletter_signup`, `registration_complete`  
**Follow-up.** Spring Sale (18–25 Mar 2027) reuses the format.  
**Dependencies.** C62, C31, C05 (baseline)

### C35–C39: Discord and community rituals

#### C35 — Discord Rebuild — onboarding, channels, roles, Server Guide

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community | T1 must | Mon 28 Sep 2026 → Mon 12 Oct 2026 | S10, S4, S5, S3 | Discord | SC (build) / DEV (bot copy) / DS (banner) | SC 12 h, DEV 4 h, DS 3 h | $0 |

**Goal.** Rebuild the server so a new member knows what to do in 30 seconds: Onboarding questions assign platform and interest roles, a Server Guide with three to-dos, channels that match the weekly rituals [R13 §2, R07 §3.3].  
**KPI.** New-member 7-day retention = members who joined in week W and sent ≥1 message within 7 days ÷ joins in week W (manual count until Server Insights at 500).  
**TARGET.** rebuild complete 12 Oct; 7-day message rate for new members UP in the 4 weeks after vs the 4 weeks before (baseline counted by SC on 28 Sep).  
**Core message.** Pick your platforms and games, and the server shows you the right channels.  
**Proof.** Bot already mirrors XP, posts every article and runs a Sunday recap [R13 §1].

**Key moments.** 2026-09-28 — baseline count; D-004 invites fixed · 2026-10-02 — channel map + roles live · 2026-10-07 — Onboarding + Server Guide live · 2026-10-12 — Buffy voice sheet applied to bot copy; announcement

**Acceptance criteria.**
- [ ] Channel map: START HERE (#rules, #announcements, #introductions, #suggestions) · TALK (#general, #what-are-you-playing, #polls, #game-club) · GAMES (#gta6, #wow, #fps, #next-fest, #pc-help, #switch-2) · DEALS (#deals) · SITE (#latest-news bot, #leaderboard bot) · VOICE (Lounge, Game Night, Stage).
- [ ] Onboarding questions: 'Where do you play?' (PC / PlayStation / Xbox / Switch 2 / Steam Deck) and 'What are you here for?' (GTA 6 / WoW & MMOs / PC help / deals / release dates / just to chat) → roles and channel visibility.
- [ ] Server Guide: welcome line + to-dos 'Say hi in #introductions', 'Tell us what you're playing', 'Link your TechPlay account with /link (optional)'.
- [ ] Buffy copy rewritten per the voice sheet (no 'young one', no prophecies, max one owl joke per message); avatar hosted at a working URL.
- [ ] AutoMod presets on; rules include Time Out → Kick → Ban ladder.

**Exact copy (Part 33).**

- **X:** We rebuilt the TechPlay Discord: pick your platforms and games when you join and it shows you the right channels. GTA 6, WoW, PC help, deals, release dates. discord.gg/wPQG9gUMXH
- **Discord:** #announcements (12 Oct): "The server has a new layout. When you open it you'll be asked two questions (where you play, what you're here for) and you'll only see the channels that fit. Everything else is in Channels & Roles. Weekly things to know: Monday 'What are you playing?', Wednesday poll, Sunday wrap. — Buffy"
- **Newsletter blurb:** Our Discord has a new layout: two questions when you join, and you see only the channels you care about. [invite]

*Buffy voice sheet (pinned for staff)*
> Buffy is a senior guild member, not a cartoon teacher. Plain instructions. One owl joke per message at most. Never guilt people about streaks or absence. Never announce moderation decisions. Never state a number unless it comes from the API.  
> Welcome line: "Welcome, [name]. Two quick questions and the server sorts itself out. Say hi in #introductions when you're ready."  
> Rank-up: "[name] reached [rank]. Nice."  
> News post footer: "— Buffy, TechPlay"  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Server banner and icon refresh (DS). · *web banner:* Discord Server Guide banner 1920x1080 (Discord spec).

**CTA.** Join the Discord  
**Landing page.** https://discord.gg/wPQG9gUMXH  
**UTM example.** Discord invite code per campaign (e.g. invite 'c35-rebuild' created by SC); site link: https://techplay.gg/?utm_source=x&utm_medium=organic-social&utm_campaign=c35-discord-rebuild&utm_content=announce-a  
**Tracking.** `discord_click`, `discord_join`  
**Follow-up.** Monthly channel audit; archive channels with no messages for 30 days.  
**Dependencies.** D-004, D-011 (join attribution), C37, C39, C38

#### C36 — Discord Road to 500

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Growth) | T2 should | Mon 12 Oct 2026 → Thu 31 Dec 2026 | S10, S4, S5, S3, S1 | Discord, site CTAs, newsletter, all social, Disboard/Discadia free listings | SC | SC 3 h/week | $0 (No paid listings (R16 §2.11: paid tiers not worth testing before Reddit).) |

**Goal.** Grow the server to 500 members (unlocks Server Insights) through per-campaign invites, weekly events and a referral role, never through paid member-buying [R13 exec 3, R16 §2.11].  
**KPI.** Net members (Discord API count) weekly; joins by invite code (discord_join); share of joins that post within 7 days.  
**TARGET.** 500 members by 31 Dec 2026 (baseline 160 on 27 Sep, R13); ≥30% of new joins post within 7 days.  
**Core message.** The TechPlay Discord: weekly game nights, GTA 6 and WoW channels, deal alerts, and editors who answer.  
**Proof.** Bot-run rituals, account-linked XP, alerts by DM [R13].

**Key moments.** 2026-10-12 — invite codes per campaign live; free listings (Disboard, Discadia) set up · Weekly — one scheduled event (Game Club night, poll results, squad night, watch party) · 2026-11-18 — GTA Launch Eve event · 2026-12-10 — TGA watch party · 2026-12-31 — count

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-011 invite attribution slips to 2027-W07. Interim: SC reads 'uses' per invite code in Server Settings → Invites every Monday and logs them in the invite sheet.

**Exact copy (Part 33).**

- **Facebook:** The TechPlay Discord has a game night every week. This week: [event]. Join: discord.gg/wPQG9gUMXH
- **X:** Our Discord runs one event a week: Game Club, polls, squad nights, and a watch party for every big show. This week: [event, day, time CET]. discord.gg/wPQG9gUMXH
- **Threads:** We do a game night in our Discord every week. This week it's [event]. Come by if you want people to play with.
- **Discord:** #announcements (12 Oct): "New role: Recruiter. Invite friends with your personal invite (Server menu → Invite People); when three of them stay a week, you get the role and a line in Sunday's wrap. No bots, no alt accounts."
- **Newsletter blurb:** This week in the Discord: [event, day, time]. Invite: [link]

*Disboard/Discadia listing description*
> TechPlay.gg — the Discord of a gaming publication. Weekly game nights and a monthly game club, GTA 6 and WoW channels, PC help, deal alerts from your wishlist, and editors who answer questions. Tags: gaming, pc, playstation, xbox, gta6, wow.  

Not used for this campaign: Facebook Groups, Instagram, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Weekly event card template. · *1080x1920:* Story event poster.

**CTA.** Join the Discord  
**Landing page.** https://discord.gg/wPQG9gUMXH  
**UTM example.** Invite code per campaign, e.g. discord.gg/<code-c06>, logged in the invite sheet; site CTA: https://techplay.gg/?utm_source=newsletter&utm_medium=email&utm_campaign=c36-road-to-500&utm_content=event-w44  
**Tracking.** `discord_click`, `discord_join`  
**Follow-up.** At 500: enable Server Insights and set the next target (1,000 for Discovery) with real retention data.  
**Dependencies.** C35, D-011, C03

#### C37 — What Are You Playing? weekly (F11)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community | T1 must | Mon 28 Sep 2026 → Mon 28 Dec 2026 | S10, S2 | Discord, forum, X, Threads, Bluesky, Facebook | SC | SC 1 h/week | $0 |

**Goal.** One weekly check-in shared by Discord, the forum and social, linking answers to shelves so the question feeds the product [R13 ritual 1].  
**KPI.** Replies per week across Discord thread + forum thread; shelf_add from the forum thread link.  
**TARGET.** 13 consecutive Mondays; replies UP month over month.  
**Core message.** What are you playing this week?  
**Proof.** r/Games has run a weekly 'What have you been playing' thread for years; it is the most common community ritual in the research [R13 §2].

**Key moments.** Every Monday 12:00 CET

**Exact copy (Part 33).**

- **Facebook:** What are you playing this week? Tell us in the comments. We're on [game] and [game].
- **X:** What are you playing this week? We're on [staff game 1] and [staff game 2].
- **Threads:** Monday question: what are you playing this week, and is it good or are you just finishing it out of stubbornness?
- **Bluesky:** What are you playing this week? Staff: [game], [game].
- **Discord:** Buffy, Mon 12:00 in #what-are-you-playing (thread): "What are you playing this week? One line is enough. If you keep a TechPlay shelf, mark it Playing and it shows on your profile."

*Forum thread title*
> What are you playing? Week of [date]  

Not used for this campaign: Facebook Groups, Instagram, TikTok script, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1080:* Optional: plain type card 'What are you playing?' reused weekly.

**CTA.** Reply / mark it Playing on your shelf  
**Landing page.** https://techplay.gg/forum (weekly thread)  
**UTM example.** `https://techplay.gg/forum?utm_source=x&utm_medium=organic-social&utm_campaign=c37-what-are-you-playing&utm_content=f11-w40`  
**Tracking.** `comment_created`, `shelf_add`, `discord_join`  
**Follow-up.** Best answers quoted in Sunday's wrap (F14).  
**Dependencies.** C35

#### C38 — Game Club (Oct: Control Resonant; Nov: GTA VI; Dec: member vote)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Editorial) | T2 should | Mon 5 Oct 2026 → Thu 31 Dec 2026 | S10, S4 | Discord (#game-club, voice), forum, X, newsletter | SC (logistics) / EIC (host) | SC 2 h/month, EIC 2 h/month | $0 |

**Goal.** One game a month, played together, with a kickoff, a midpoint voice chat and a wrap, hosted by an editor [R13 ritual 2, R21 TOOL-39].  
**KPI.** Participants = members posting in the club thread; voice attendance at the midpoint night.  
**TARGET.** 3 clubs run to the wrap; attendance recorded each time.  
**Core message.** One game a month, played together, talked about properly.  
**Proof.** Control Resonant is the month's momentum release (24 headlines in a week) [R06].

**Key moments.** 2026-10-05 — October kickoff: Control Resonant · 2026-10-15 20:00 CET — midpoint voice chat · 2026-10-29 — wrap thread · 2026-11-20 — November kickoff: GTA VI (day after launch) · 2026-12-03 20:00 CET — GTA VI club night · 2026-12-01 to 04 — December vote (3 candidates) · 2026-12-07 — December kickoff · 2026-12-21 — December wrap

**Exact copy (Part 33).**

- **X:** October's TechPlay Game Club: Control Resonant. Play along, midpoint chat on 15 Oct in our Discord, wrap on the 29th. discord.gg/wPQG9gUMXH
- **Threads:** Starting a Control Resonant game club this month. Anyone else just starting it?
- **Discord:** Buffy, 5 Oct in #game-club: "October's Game Club: Control Resonant. Play at your own pace; spoiler tags for anything past the first hours. Midpoint voice chat Thu 15 Oct, 20:00 CET, hosted by [editor]. Wrap on 29 Oct."
- **Newsletter blurb:** Game Club: October is Control Resonant. Midpoint voice chat Thursday 15 Oct, 20:00 CET. [invite]

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Monthly club card with the game cover and three dates.

**CTA.** Join this month's Game Club  
**Landing page.** https://discord.gg/wPQG9gUMXH (#game-club); https://techplay.gg/forum (thread)  
**UTM example.** `https://techplay.gg/forum?utm_source=newsletter&utm_medium=email&utm_campaign=c38-game-club&utm_content=oct-control`  
**Tracking.** `discord_join`, `comment_created`, `shelf_add`  
**Follow-up.** Each wrap thread becomes a short 'Game Club verdict' paragraph in the Verdict (C52) for that game.  
**Dependencies.** C35

#### C39 — Poll of the Week (F12)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Social) | T1 must | Wed 30 Sep 2026 → Wed 30 Dec 2026 | S10, S8, S1 | Discord native poll, Instagram Story poll, X poll, Facebook poll, forum poll, Threads | SC | SC 1.5 h/week | $0 |

**Goal.** One debate question a week, tied to the week's news, voted everywhere and reported back on the site, because polls draw far more participation than ratings [R04 via R23 #16, R13 ritual 3].  
**KPI.** Total votes across platforms; results-post sessions.  
**TARGET.** 13 polls; results posted every following Wednesday.  
**Core message.** One question a week, and the result back to you.  
**Proof.** Hookshot's polls draw thousands of votes while its game ratings draw 0–1 per new game; polls are where readers participate [R23 #16, R04].

**Key moments.** 2026-09-30 — poll 1: PlayStation discs · 2026-10-07 — poll 2: 'Would you pay $80 for a game?' · 2026-10-14 — poll 3: 'Which WoW will you play from 4 Nov?' · 2026-10-21 — poll 4: 'MW4: which platform?' · 2026-11-11 — 'GTA 6: day one or wait for reviews?' · Weekly after, from the week's news

**Exact copy (Part 33).**

- **Facebook:** Poll: if PlayStation stops making discs, what do you do? Buy discs while you can / Go digital now / Buy fewer PS games / Already digital.
- **Instagram:** Story poll: 'PlayStation without discs: fine or not?' Fine / Not fine. Next frame: link to The Last Disc letter (C66).
- **X:**

> If PlayStation stops making discs, what do you do?  
> • Buy discs while I can  
> • Go digital now  
> • Buy fewer PS games  
> • Already digital  

- **Threads:** Honest question: how many of your PS5 games are on disc? Mine's about [N]%.
- **Discord:** Poll (1 week): "Sony plans to stop making PlayStation discs. What do you do? — Keep buying discs while I can / Go fully digital now / Stop buying PlayStation games / Don't care, I'm already digital"

*Results post (site, forum)*
> Poll of the week: [question]. [N] votes across Discord, X, Instagram, Facebook and the forum. Result: [split]. What you said: [two quotes].  

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1920:* Story poll template. · *1080x1080:* Results card.

**CTA.** Vote  
**Landing page.** https://techplay.gg/forum (results thread)  
**UTM example.** `https://techplay.gg/forum?utm_source=instagram&utm_medium=organic-social&utm_campaign=c39-poll-of-the-week&utm_content=f12-w40-story`  
**Tracking.** `comment_created`, `cta_click`  
**Follow-up.** Poll results feed the newsletter and, where large, a news item.  
**Dependencies.** C35, C66

### C40–C43: Email and alerts

#### C40 — The Save File newsletter relaunch (F21)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Email | T1 must | Fri 2 Oct 2026 → Thu 31 Dec 2026 | S1, S4, S7, S8, S10 | email, web archive, all site capture points, Discord, social | SC (assembly) / EIC (edit, sign-off) | SC 3 h/week, EIC 1 h/week, DEV 4 h (D-012) | $0 |

**Goal.** Relaunch the newsletter as a weekly Friday issue with a clear job: this week's releases, one data point, GTA 6 briefing to launch, community picks, and nothing padded [R20 §2].  
**KPI.** Verified subscribers (newsletter_verified, cumulative); click rate = unique clickers ÷ delivered; downstream actions within 24 h (reminder_set, shelf_add, registration_complete with utm_source=newsletter).  
**TARGET.** 13 issues on Fridays; verified subscribers UP every week; complaint <0.1%, unsubscribe <0.5% per send.  
**Core message.** The Save File: every Friday, what's out, what's worth it, and one thing only TechPlay can tell you.  
**Proof.** Built on the release calendar, the database and the GTA 6 ledger [R20].

**Key moments.** 2026-09-30 — /newsletter landing live (D-012) · 2026-10-02 — issue 1 · 2026-10-12 — welcome sequence live (C42) · 2026-11-19 — GTA launch special · 2026-12-18 — year-end issue · 2026-12-25 — no issue (Christmas Day); next issue 1 Jan 2027 is optional

**Exact copy (Part 33).**

- **Facebook:** Our newsletter is back: The Save File, every Friday. Next week's releases, one number worth knowing, and the GTA 6 briefing until launch. [link]
- **Instagram:** Story: 'The Save File, every Friday' + sample issue screenshot + link sticker.
- **X:** We're restarting our newsletter, The Save File: every Friday, next week's releases, one number worth knowing, and the GTA 6 briefing until launch. First issue tomorrow: techplay.gg/newsletter
- **Threads:** Restarting our Friday newsletter. Short, one job: what's out next week and what's worth your time. Link in bio.
- **Discord:** #announcements: "The Save File is back: every Friday, next week's releases, one data point, community picks (yours, with credit). Sign up: https://techplay.gg/newsletter"

*Issue 1 (Fri 2 Oct) — subject lines (A/B)*
> A: The Save File #1: Autumn Sale picks and 48 days to GTA 6  
> B: What's out next week, and what's worth it in the Steam sale  
> Preheader: Gears of War: E-Day on Tuesday, WoW 12.1.5 expected, and our first poll result.  

*Issue 1 — body*
> Hi, this is The Save File from TechPlay. Every Friday: what's out next week, one number worth knowing, and a few things from the community. It takes three minutes.  
>
> 1. OUT NEXT WEEK  
> Gears of War: E-Day — Tue 6 Oct, PC and Xbox. [Series order] [Remind me]  
> Dragon's Dogma 2: Dark Arisen — Fri 9 Oct, with a Switch 2 version (reported). [Remind me]  
> All releases: [calendar link]  
>
> 2. STEAM AUTUMN SALE (UNTIL 8 OCT)  
> Our picks, and what to wait for until the Winter Sale on 17 Dec. [link]  
>
> 3. GTA 6: 48 DAYS  
> Confirmed this week: nothing new from Rockstar. Still only reported: 30 fps on consoles at launch (Tom's Hardware). The ledger: [link]  
>
> 4. THE NUMBER  
> [One verified stat with source, e.g. Steam's weekly most-played top three]  
>
> 5. FROM THE COMMUNITY  
> Poll: [result]. Game Club starts Monday: Control Resonant. [Discord]  
>
> That's it. Reply if something's wrong; a person reads every reply.  
> — The TechPlay editors  
> [Unsubscribe] [Archive]  

*Standing sections (every issue)*
> Out next week · The Number · GTA 6 briefing (until 19 Nov) · One thing worth reading (ours) · From the community · Deals (only during sales)  

*/newsletter landing copy (D-012)*
> H1: The Save File  
> Every Friday: next week's releases with reminders, one number worth knowing, and what our community is playing. Three minutes, no filler. [email] [Subscribe] — Double opt-in; unsubscribe in one click. Read past issues: [archive].  

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1920:* Story with sample issue. · *1080x1080:* Launch card 'The Save File, every Friday'. · *web banner:* Article-end capture (C46) and homepage module. · *1280x720 thumbnail:* /newsletter OG.

**CTA.** Subscribe to The Save File  
**Landing page.** https://techplay.gg/newsletter (new)  
**UTM example.** `https://techplay.gg/calendar?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w40&utm_content=out-next-week-a`  
**Tracking.** `newsletter_signup`, `newsletter_verified`, `cta_click`, `reminder_set`, `registration_complete`  
**Follow-up.** After 6 issues: drop the lowest-clicked section. Non-openers of 8 consecutive issues are suppressed (deliverability).  
**Dependencies.** D-012, C42, C46, C03  
**Risks.** Self-hosted sending without Gmail reputation; start small, pace sends, no DNS/SMTP changes without approval [R20 §4].

#### C41 — "Your releases this week" personalised email

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Email (also Product) | T2 should | Mon 5 Oct 2026 → Mon 28 Dec 2026 | S1, S2, S7 | email, Discord DM (opt-in) | DEV (build) / SC (copy, monitoring) | DEV 20 h, SC 2 h + 0.5 h/week | $0 |

**Goal.** Send every member with wishlists or reminders a Monday email of their own releases this week, the email no generic gaming newsletter can send [R20 §2, R21 CH-02].  
**KPI.** Click rate = unique clickers ÷ delivered; alert_clicked; shelf status changes within 48 h of send.  
**TARGET.** first send Mon 26 Oct; click rate above The Save File's click rate by the third send; guardrails held.  
**Core message.** Your releases this week, from your own wishlist and reminders.  
**Proof.** The weekly digest already assembles 'next 14 days' releases for each member's bell [R11 §3].

**Key moments.** 2026-10-05 — build (D-028) on the existing weekly-digest data · 2026-10-23 — QA on staff accounts · 2026-10-26 — first send (MW4 week wrap + Next Fest) · Every Monday 08:00 CET after

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-028 first send 23 Nov (not 26 Oct). Out This Week (C04) covers the general version until then.

**Acceptance criteria.**
- [ ] Only members with a verified email and ≥1 wishlist/reminder; skip the send when a member has nothing releasing (no empty emails).
- [ ] Each game: release date, platforms the member owns, price if known, pre-load note if official, link to game page.
- [ ] One-click unsubscribe from this product only; list-unsubscribe header.
- [ ] reminder_delivered (channel=email) and alert_clicked fire.

**Exact copy (Part 33).**

- **Discord:** DM variant: "Your releases this week: [Game] (Tue, [platform]), [Game] (Fri, [platform]). Details: [link]. Turn off: /alerts off"

*Email*
> Subject: Your releases this week: [Game A] and [N] more  
> Preheader: From your TechPlay wishlist and reminders.  
> Body: Hi [username], [N] games you're waiting for release this week.  
> TUESDAY — [Game A] · [platforms you have] · [price or 'price not listed yet'] · [See game]  
> FRIDAY — [Game B] · ...  
> Not on your list but big this week: [one game from Out This Week].  
> Manage what you get: [settings]. — Buffy, TechPlay  

*Announcement (site banner + Save File line)*
> New: every Monday, members with a wishlist get their own releases this week by email. Wishlist a game to start getting it.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* Settings page and game page line 'Get it in your Monday email'.

**CTA.** Wishlist a game to get your Monday email  
**Landing page.** https://techplay.gg/calendar (wishlist buttons); email links to /games/{slug}  
**UTM example.** `https://techplay.gg/games/grand-theft-auto-vi?utm_source=email&utm_medium=email&utm_campaign=c41-your-releases-2026w44&utm_content=game-card`  
**Tracking.** `reminder_delivered(channel=email)`, `alert_clicked`, `shelf_add`  
**Follow-up.** Add price where known (C31 data) in November.  
**Dependencies.** D-028, D-013, C42

#### C42 — Welcome sequence (3 emails)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Email (also Product) | T1 must | Mon 5 Oct 2026 → Mon 12 Oct 2026 | S1, S2, S10 | email | DEV (D-013) / SC (copy) | DEV 12 h, SC 3 h | $0 |

**Goal.** Take a new member or subscriber from sign-up to a linked library in their first week with three short emails [R20 §4, R11 §6].  
**KPI.** A2 activation (linked platform OR ≥3 shelf items within 7 days) among welcome recipients ÷ recipients; click rate per email.  
**TARGET.** live 12 Oct; A2 activation among recipients UP vs members who joined 28 Sep–11 Oct (no sequence).  
**Core message.** Your library fills itself. Link one platform and see.  
**Proof.** Steam, PlayStation, Xbox, GOG and Epic import for free [spine §2].

**Key moments.** 2026-10-05 — copy approved · 2026-10-12 — live

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-013 about 6 Nov. Interim: SC sends a short manual welcome campaign each Friday to that week's verified subscribers (Email 1 copy, trimmed).

**Acceptance criteria.**
- [ ] Email 1 on verification (or instantly for social sign-ups), Email 2 at +2 days if no platform linked, Email 3 at +6 days; any email skipped if its goal is already met.
- [ ] Separate short variant for newsletter-only subscribers (one email: 'make it an account').
- [ ] library_connected attributed to utm_campaign=c42-welcome.

**Exact copy (Part 33).**

*Email 1 (day 0)*
> Subject: Your TechPlay library, in one step  
> Body: Welcome to TechPlay. The quickest way to see what it does: link Steam (one click), or PlayStation, Xbox, GOG or Epic. Your games arrive with the hours you've already played. [Link a platform]  
> If you'd rather add games by hand, search any of 333,000+ games and mark it Playing, Backlog or Wishlist.  
> — Buffy, TechPlay  

*Email 2 (day 2, only if no platform linked)*
> Subject: Three games is enough to start  
> Body: TechPlay gets useful once it knows a few things you play. Add three games (or link one platform) and you'll get: release reminders for what you're waiting on, price alerts for your wishlist, and a profile that reads your taste back to you. [Add games]  

*Email 3 (day 6)*
> Subject: What TechPlay does in the background  
> Body: A few things that now run for you: a Monday email with your releases this week (if you have wishlists), price alerts on Steam and GOG, and the Friday newsletter if you want it [toggle]. There's also a Discord where the editors hang out: [invite]. That's the last welcome email.  

*Newsletter-only variant*
> Subject: You're subscribed to The Save File  
> Body: Thanks for confirming. The Save File comes every Friday. If you also want release reminders and price alerts for games you care about, that needs a free account: one click with Google, Discord or Steam. [Make it an account]  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* Email header: plain TechPlay wordmark, no hero image (deliverability and load); Buffy sign-off mark only.

**CTA.** Link a platform  
**Landing page.** https://techplay.gg/settings (connected accounts) / https://techplay.gg/register?from=newsletter  
**UTM example.** `https://techplay.gg/settings?utm_source=email&utm_medium=email&utm_campaign=c42-welcome&utm_content=email1-link`  
**Tracking.** `library_connected`, `shelf_add`, `newsletter_verified`, `registration_complete`, `discord_join`  
**Follow-up.** Review activation by email step after 4 weeks; rewrite the weakest email.  
**Dependencies.** D-013, C44

#### C43 — Release-day & price alerts off-site (email + Discord DM)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also Email) | T1 must | Mon 5 Oct 2026 → Mon 19 Oct 2026 | S1, S2, S4, S7 | email, Discord DM, site settings | DEV | DEV 16 h, SC 1.5 h | $0 |

**Goal.** Deliver the reminders and wishlist notices that today only reach the on-site bell, by email and Discord DM, so a member who stops visiting still hears when their game is out [R23 #10, R21 CH-03].  
**KPI.** Alert CTR = alert_clicked ÷ reminder_delivered, by channel; d1_return after an alert.  
**TARGET.** live 19 Oct (Next Fest start, MW4 week); CTR tracked per channel; guardrails held.  
**Core message.** When your game is out, you'll hear about it, even if you haven't opened TechPlay in weeks.  
**Proof.** Reminder jobs already run at 09:00 daily (T-3 and T-0); only the channel is new [R11 §1.4].

**Key moments.** 2026-10-05 — build · 2026-10-16 — QA · 2026-10-19 — live; announcement

**Delivery status (32-DEVELOPMENT-BACKLOG).** Email channel about 6 Nov (D-013); Discord DM 2027-W06 (D-047). Interim: SC posts 'Out today' in Discord each morning from /calendar. Announcement copy is split: email part on 6 Nov, DM part in 2027.

**Acceptance criteria.**
- [ ] Release reminders (T-3 and T-0) and wishlist release notices go by email (verified) and Discord DM (linked, opted-in).
- [ ] Settings: per-channel toggles; the 'What may reach your inbox' toggle now actually governs these.
- [ ] reminder_delivered(channel) and alert_clicked fire.
- [ ] Max one email per member per day; batch multiple games into one.

**Exact copy (Part 33).**

- **X:** TechPlay reminders now leave the site: set 'remind me' on any game and you'll get an email or a Discord DM on release day. Try it on something you're waiting for: techplay.gg/calendar
- **Discord:** #announcements: "Release reminders now arrive as a DM from me, if you've linked your account and turned DMs on in Settings. Set one on any game page."
- **Newsletter blurb:** Release reminders now come by email or Discord DM. Set one on any game: [calendar]

*Reminder email*
> Subject: [Game] is out today  
> Preheader: [Platforms you own]. [Pre-load/unlock note if official].  
> Body: [Game] releases today on [platforms]. [See game page] [Store]. You asked us to remind you on [date]. Manage reminders: [link]. — Buffy  

*Reminder DM*
> "[Game] is out today on [platforms]. [link]"  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Card: 'Remind me' button → phone notification.

**CTA.** Set a reminder  
**Landing page.** https://techplay.gg/calendar  
**UTM example.** `https://techplay.gg/games/grand-theft-auto-vi?utm_source=email&utm_medium=email&utm_campaign=c43-alerts&utm_content=release-day`  
**Tracking.** `reminder_set`, `reminder_delivered`, `alert_clicked`, `d1_return`  
**Follow-up.** Price alerts added via D-027 for C31; push via C59.  
**Dependencies.** D-013, D-027 (price half, by 20 Nov), C45

### C44–C46: Registration and on-site conversion

#### C44 — Registration rebuild — register page rewrite, social first, Steam sign-in, redirect-back

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product | T1 must | Mon 5 Oct 2026 → Mon 26 Oct 2026 | S2, S3, S1, S4 | site, X, Discord, newsletter | DEV (build) / EIC (copy sign-off) | DEV 24 h, EIC 2 h, SC 1 h | $0 |

**Goal.** Rebuild /register around the library pitch, put one-click sign-in (Steam, Google, Discord) above the form, add Steam OpenID sign-in, and return people to the page they came from [R11 §4 #1-2, #18, §5].  
**KPI.** Registration completion = registration_complete ÷ registration_start, by method; A2 activation within 7 days by method.  
**TARGET.** live 26 Oct; completion rate UP vs the 4 weeks before (baseline from C03 events); Steam share of registrations reported.  
**Core message.** Sign in with Steam and your library is already here.  
**Proof.** Steam's OpenID explicitly allows sign-in for third-party sites; TechPlay already holds the API key [R11 §5].

**Key moments.** 2026-10-05 — copy approved by EIC (D-014) · 2026-10-14 — register page + redirect live · 2026-10-26 — Steam sign-in live (D-015); announcement

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-014 register rewrite on time (by 26 Oct); D-015 Steam sign-in slips to 2027-W01. Steam stays 'connect after sign-up' and the welcome mail pushes it. Hold the 'Sign in with Steam' announcement copy until it ships.

**Acceptance criteria.**
- [ ] Order: 'Sign in with Steam' (Valve's official button), Google (full width), Discord, Battle.net; then 'or with email'.
- [ ] Left panel: homepage's four mechanisms with the live game count; no member count.
- [ ] Redirect-back honoured for social sign-ups (?redirect= and from=); email sign-ups return after verification.
- [ ] Steam-only accounts: full shelf use; email asked when setting a reminder ('Where should we send it?').
- [ ] registration_start / registration_complete (method, from) fire.

**Exact copy (Part 33).**

- **X:** You can now sign in to TechPlay with Steam. One click and your Steam library, with hours, is on your shelf. PlayStation, Xbox, GOG and Epic link after: techplay.gg/register
- **Threads:** We added Sign in with Steam. The thing I like: your library shows up immediately, instead of after three forms.
- **Discord:** #announcements: "Sign in with Steam is live. If you've been putting off making an account because of the form: it's one click now."
- **Newsletter blurb:** New: sign in to TechPlay with Steam. One click and your library is there, hours included. [link]

*Register page copy (D-014)*
> H1: Start your library  
> Sub: Link Steam, PlayStation, Xbox, GOG or Epic and your games arrive on their own, with the hours you've played. Free, and no card.  
> Buttons: Sign in through Steam · Continue with Google · Continue with Discord · Continue with Battle.net · or sign up with email  
> Left panel: One library, every platform / Hours counted without you / Your taste, in numbers / How close your taste is to anyone else's · [live] games in the catalogue  
> Under form: We read the first three comments from new members before they appear. After that, you're through.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1920:* Screen recording: Steam sign-in → shelf filled. · *1080x1080:* Card: 'Sign in with Steam'.

**CTA.** Sign in with Steam  
**Landing page.** https://techplay.gg/register?from=<source>  
**UTM example.** `https://techplay.gg/register?from=c44-x&utm_source=x&utm_medium=organic-social&utm_campaign=c44-registration&utm_content=steam-signin`  
**Tracking.** `registration_start`, `registration_complete(method=steam|google|discord|battlenet|email)`, `email_verified`, `library_connected`  
**Follow-up.** Report method mix and completion 2 Nov; this is the landing for C57 paid.  
**Dependencies.** D-014, D-015, C01, C03

#### C45 — "Remind me / Follow" guest CTA on game & calendar pages

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also SEO) | T1 must | Mon 5 Oct 2026 → Mon 19 Oct 2026 | S1, S4, S6, S7 | site | DEV | DEV 16 h | $0 |

**Goal.** Turn the largest page set (game pages and the calendar) into sign-ups at the moment of intent: a guest clicks 'Remind me' and signs up in a modal that returns to the same game [R11 §4 #3, #5].  
**KPI.** Guest reminder conversion = registration_complete with from=game-remind ÷ guest clicks on 'Remind me' (cta_click cta_id=remind-guest).  
**TARGET.** live 19 Oct; conversion measured weekly; reminders set per day UP vs pre-launch.  
**Core message.** Remind me when it's out.  
**Proof.** Reminder jobs exist; C43 makes them leave the site [R11].

**Key moments.** 2026-10-19 — live on /games/{slug} (unreleased), /calendar, /gta6/release-time

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-016 lite version 18 Dec. Interim: 'Remind me' sends guests to /login?redirect= (after D-014).

**Acceptance criteria.**
- [ ] Guest 'Remind me' opens a modal: Steam / Google / Discord / email; after sign-up the reminder is set and the user is back on the same page.
- [ ] Released games show 'Add to shelf' with the same modal.
- [ ] game_followed / reminder_set fire with from=game.

**Exact copy (Part 33).**

*Modal copy*
> Title: Get a reminder for [Game]  
> Body: We'll email you (or DM you on Discord) when it's out. Free account, one click.  
> Buttons: Steam · Google · Discord · Email  
> Small print: No spam. One email per day at most.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* Modal and button states designed once by DS (1 h): 'Remind me' default, hover, set; modal with four sign-in options.

**CTA.** Remind me  
**Landing page.** https://techplay.gg/games/{slug}; https://techplay.gg/calendar  
**UTM example.** `https://techplay.gg/games/grand-theft-auto-vi?utm_source=x&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-day30-card`  
**Tracking.** `cta_click`, `registration_complete`, `reminder_set`, `game_followed`  
**Follow-up.** Extend to studio pages ('Follow this studio's releases') in Q1.  
**Dependencies.** D-016, C44, C43

#### C46 — Article end CTA block + contextual links + related module

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also SEO) | T1 must | Mon 5 Oct 2026 → Fri 16 Oct 2026 | S1, S3, S8, S10 | site | DEV (build) / ED (link rule) | DEV 16 h, ED 2 h + 5 min per article, DS 2 h | $0 |

**Goal.** Give every article one consistent end block (newsletter, Discord, connect a platform), 3–5 contextual links and a related module, so news readers have somewhere to go [R02 fix #5-6].  
**KPI.** Article → action rate = (newsletter_signup + discord_click + registration_start from=article-end) ÷ article sessions; pages per session from articles.  
**TARGET.** live 16 Oct on all articles; article → action rate measured weekly from then.  
**Core message.** Every article ends with somewhere to go: the newsletter, the Discord, or your own library.  
**Proof.** Six sampled articles had zero body links and no newsletter prompt [R02 §4.2].

**Key moments.** 2026-10-05 — block design · 2026-10-12 — contextual link rule in the editor (ED) · 2026-10-16 — live

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-010 slips to Feb 2027. Interim from 5 Oct: the D-012 newsletter form under articles, and ED adds 3–5 contextual links by hand to every article.

**Acceptance criteria.**
- [ ] End block above comments: newsletter box, Discord card with live member count from the API (or no count), 'Link Steam and see your hours' (guests) or 'Add [game] to your shelf' (members, if article has game_id).
- [ ] Related module: 3 by game, then category.
- [ ] ED style rule: 2–5 contextual links per article (game page, primary source, a hub or tool).
- [ ] cta_click with cta_id per element.

**Exact copy (Part 33).**

*End block copy*
> Newsletter: 'The Save File — every Friday, next week's releases and one number worth knowing. [email] [Subscribe]'  
> Discord: 'Talk about this in the TechPlay Discord: game nights, GTA 6 and WoW channels, and the editors. [Join]'  
> Library (guest): 'Link Steam, PlayStation or Xbox and TechPlay keeps your library for you. [Start your library]'  
> Library (member, article has a game): 'Add [Game] to your shelf. [Add]'  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* End-block component (DS: one design, three states).

**CTA.** Subscribe / Join Discord / Start your library  
**Landing page.** All articles (/news, /reviews, /guides, /hardware)  
**UTM example.** Internal CTA; tracked by cta_id (e.g. cta_id=article-end-newsletter), no UTM  
**Tracking.** `cta_click`, `newsletter_signup`, `discord_click`, `registration_start`, `shelf_add`  
**Follow-up.** A/B the order of the three elements after 4 weeks.  
**Dependencies.** D-010, D-012, C40

### C47–C48: Reddit

#### C47 — Reddit Reputation Program (90 days)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community | T1 must | Mon 28 Sep 2026 → Sun 27 Dec 2026 | S3, S4, S5, S7, S8 | Reddit | SC (primary) / EIC (data subs) | SC 3 h/week, EIC 1 h/week | $0 |

**Goal.** Earn standing in the subreddits where TechPlay's tools answer real questions, by helping first, disclosing affiliation, and linking only when the link is the answer [R07 §3.7, R13].  
**KPI.** Helpful comments per week; comment karma on the two named accounts; share of comments with a link (keep low); discord_click / cta_click with utm_source=reddit.  
**TARGET.** 12 weeks × ≥10 helpful comments per account; links in ≤1 of 10 comments; zero removals for self-promotion.  
**Core message.** Help first. Link only when it answers the question, and say it's ours.  
**Proof.** Reddit's sitewide rule: participate authentically; top posts are rarely publisher links [R07 §3.7, R06].

**Key moments.** 2026-09-28 — accounts named (SC and EIC personal accounts with flair/bio 'works at TechPlay'); each sub's rules read and logged · Weekly — 10 helpful comments per account · 2026-10-08 onward — data posts only via C48

**Exact copy (Part 33).**

- **Reddit angle:**

> Comment pattern (example, r/pcgaming 'stutter in new game'): "Shader compilation stutter usually shows up in the first minutes or when a new area loads. Things that help: let the game finish building shaders on the menu if it offers it, update the GPU driver, and don't cap the shader cache in the driver settings. If it's still bad, the fix list we keep at TechPlay (I work there) is here: [link]. But try the first three first."  
> Subs and angles: r/wow and r/wownoob (readiness, gear questions; Analyzer only on request), r/pcgaming and r/techsupport-style threads (fixes, C60), r/patientgamers (recommendations; no links), r/GTA6 (facts with primary sources), r/Steam (sale, refunds, library questions), r/NintendoSwitch2 (edition/upgrade questions, C61).  


*Rules for the two accounts*
> 1. Read each subreddit's rules before the first comment; log self-promotion rules in the sheet. 2. Nine of ten comments have no TechPlay link. 3. Every link to TechPlay says 'I work there'. 4. Never post a TechPlay article as a link post. 5. Never ask for upvotes, never coordinate votes. 6. If a mod asks us to stop, stop in that sub.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* None. Reddit comments are text; screenshots only when they answer the question.

**CTA.** None (help); links only where they answer  
**Landing page.** Varies (C60 fixes, /wow-analyzer, /gta6/everything-we-know)  
**UTM example.** `https://techplay.gg/guides/pc-fixes?utm_source=reddit&utm_medium=community&utm_campaign=c47-reddit-reputation&utm_content=comment&utm_term=pcgaming`  
**Tracking.** `cta_click`, `discord_click`, `tool_run`  
**Follow-up.** Day-90 review (27 Dec): which subs welcomed us; decides C58 targeting and future data-post subs.  
**Dependencies.** C48, C60, C13

#### C48 — Reddit Data Posts (tied to C20/C21/C22/C26)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Community) | T2 should | Wed 7 Oct 2026 → Tue 8 Dec 2026 | S8, S3 | Reddit | EIC | EIC 1.5 h per post + 1 h of replies | $0 |

**Goal.** Post TechPlay's original charts as native OC in subreddits that accept data, with source and tool in the comment, on the PR campaigns' publish dates [R14 §1.7].  
**KPI.** Post score and comments; referral sessions (utm_source=reddit, utm_term=<subreddit>); removals.  
**TARGET.** 4 OC posts (7–8 Oct, 14 Oct, 28 Oct, 8 Dec); zero removals.  
**Core message.** Original charts, posted natively, with the source in the first comment.  
**Proof.** r/dataisbeautiful requires [OC] and a source/tool comment [R14 §1.7].

**Key moments.** 2026-10-08 — r/dataisbeautiful: release congestion (C20) · 2026-10-14 — r/Games (self-post, if rules allow): studios closed tracker (C22) · 2026-10-28 — r/dataisbeautiful: studios per million people (C21) · 2026-12-08 — r/dataisbeautiful + r/patientgamers (if allowed): completion by genre (C26)

**Exact copy (Part 33).**

- **Reddit angle:**

> Title: "[OC] Video game releases per week, 2010–2026 (dated releases, all platforms)"  
> Image: the C20 chart with source line.  
> First comment (EIC account): "Source: TechPlay's games database (I work there), [N] titles, pulled [date]. Only releases with an exact day are counted; 'notable' means the game has a critic score or at least two store links. Tool: [Python/matplotlib or chart tool]. Full method and CSV: [link]. Happy to answer questions about the data."  


Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1350:* Chart exported at Reddit-friendly size with source line on image.

**CTA.** Source comment link  
**Landing page.** The C20/C21/C22/C26 data pages  
**UTM example.** `https://techplay.gg/data/release-congestion-2026?utm_source=reddit&utm_medium=community&utm_campaign=c48-reddit-data&utm_content=oc-congestion&utm_term=dataisbeautiful`  
**Tracking.** `cta_click`, `social_share`  
**Follow-up.** Reply to every good-faith question for 24 h after posting.  
**Dependencies.** C20, C21, C22, C26, C47

### C49–C51: Video and creators

#### C49 — Vertical Video System (Out This Week + GTA countdown + Fix It Friday)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Video (also Social) | T2 should | Mon 5 Oct 2026 → Thu 31 Dec 2026 | S1, S4, S3 | TikTok, YouTube Shorts, Instagram Reels, Facebook Reels | SC (edit, post) / DS (templates) | SC 3 h/week, DS 6 h once + 1 h/week | $0 |

**Goal.** Run one templated vertical-video production that publishes to TikTok, YouTube Shorts, Instagram Reels and Facebook Reels, with three repeatable formats and no presenter, then keep the platform that sends people to the site [R19 §3].  
**KPI.** Site sessions per 1,000 views, by platform (utm_source=tiktok|youtube|instagram|facebook); follows per week.  
**TARGET.** 6-week test 5 Oct–15 Nov (≥3 videos/week); by 16 Nov pick the primary platform; ESTIMATE 2–3 h/week SC + 1 h DS after templates.  
**Core message.** Useful in 30 seconds: what's out, one GTA 6 fact, one PC fix.  
**Proof.** Formats built from existing data; no presenter needed [R19 §2].

**Key moments.** 2026-10-01 — TikTok account created (@techplay.gg or @techplaygg if free); bios aligned · 2026-10-05 — first Out This Week video · 2026-10-09 — first Fix It Friday video · 2026-11-16 — platform decision · 2026-11-19 — launch-week shorts (C10)

**Exact copy (Part 33).**

- **Facebook:** Facebook Reels from the same files.
- **Instagram:** Reels from the same files; bio link to /calendar.
- **TikTok script:** Weekly slots: Mon — Out This Week (C04 script). Wed — GTA 6 countdown (C06 script). Fri — Fix It Friday: 'Stutter in new PC games? 3 fixes in 40 seconds' (screen capture of Windows/driver settings, captions, end card techplay.gg/guides/pc-fixes).
- **YouTube:** Same files as Shorts; channel banner and bio updated; playlist per format. Bio: 'Games out this week, GTA 6 facts, PC fixes. From TechPlay.gg.'
- **Shorts/Reels script:** Fix It Friday template, 40 s: 0–3 s problem statement on screen ('Game stutters when you enter a new area?'); 3–33 s three fixes, 10 s each, screen capture with arrows; 33–40 s 'Full guide: techplay.gg/guides/pc-fixes'. No music under instructions.

*Profile bio (all four platforms)*
> Games out this week, GTA 6 facts, PC fixes. TechPlay.gg — gaming, on the record.  

Not used for this campaign: Facebook Groups, X, Threads, Bluesky, Reddit angle, Discord, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1920:* Three templates (DS): Out This Week, Countdown, Fix It Friday; safe zones for each platform's UI. · *1280x720 thumbnail:* Shorts covers per format.

**CTA.** Link in bio / description  
**Landing page.** https://techplay.gg/calendar ; https://techplay.gg/gta6 ; https://techplay.gg/guides/pc-fixes (new)  
**UTM example.** `https://techplay.gg/guides/pc-fixes?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c49-vertical-video&utm_content=f07-fix-stutter`  
**Tracking.** `cta_click`, `reminder_set`, `social_share`  
**Follow-up.** 16 Nov: keep the best platform; the others get reposts only. Spark Ads (paid) only if a video has already performed organically (R16 T8) and only in 2027.  
**Dependencies.** C04, C06, C60, Publisher video-content policies read (R19 §6)  
**Risks.** Footage rights: official media only, credited; AI voice not used until platform disclosure rules are checked.

#### C50 — YouTube long-form pilot: 'Every GTA game in order before VI' + 'Release Radar' monthly

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Video | T3 cut first | Mon 19 Oct 2026 → Mon 7 Dec 2026 | S4, S1 | YouTube, Shorts cut-downs, site embeds | EIC (script, VO) / SC (edit, publish) | EIC 10 h, SC 12 h, DS 4 h (GTA pilot); Radar 5 h each | $0 |

**Goal.** Test two long-form formats built from data, not personality: a GTA series explainer before launch and a monthly release radar, before deciding whether long-form earns a place [R19 §1 #4, #9].  
**KPI.** Average view duration; subscribers gained per video; site sessions from video descriptions.  
**TARGET.** 3 videos published (12 Nov, 2 Nov Radar, 7 Dec Radar); decision on long-form in January based on view duration.  
**Core message.** Every GTA game in order, in [N] minutes, before VI.  
**Proof.** Series relations and release data from the database; official media only [R19].

**Key moments.** 2026-10-19 — script 'Every GTA game in order' (EIC) · 2026-11-02 — Release Radar: November · 2026-11-12 — GTA pilot published · 2026-12-07 — Release Radar: December

**Exact copy (Part 33).**

- **X:** We made a video: every GTA game in order, from the first to GTA VI, and where you can play each one today. [link]
- **Discord:** #gta6: "Our first long video: every GTA game in order before VI. Tell us what we missed: [link]"
- **YouTube:**

> Title: Every GTA game in order before GTA 6  
> Description: Every Grand Theft Auto game, from the first to GTA VI on 19 November 2026, in release order, with where you can still play each one. Chapters in the timeline. Series page: techplay.gg/[link]. Countdown and reminders: techplay.gg/gta6  
> Release Radar title: 'Release Radar: every notable game out in November 2026'  

- **Shorts/Reels script:** Cut-downs: '3 GTA games most people skipped' (45 s) and 'GTA map sizes, in order' (only with sourced figures).
- **Newsletter blurb:** New video: every GTA game in order, before VI. [link]

*Script outline (GTA pilot, ~10–12 min, voice-over by an editor)*
> Cold open (20 s): 'GTA VI is out on 19 November. Here's every GTA game before it, in order, and where you can still play them.' Sections follow the release order on the C63 series page (dates read from the database and checked against Rockstar's own listings): the early games, the 3D era, the handheld entries, GTA IV, GTA V and its re-releases, then GTA VI: what's confirmed (date, price, platforms, single-player at launch, no PC at launch). Close: 'Series page and a GTA 6 reminder are on TechPlay.' Visuals: official art, box art, timeline graphics; no leaked footage.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* GTA timeline strip with 'Every GTA in order' (no Rockstar logo misuse). · *1080x1920:* Shorts cut-downs.

**CTA.** Series page / GTA 6 reminder  
**Landing page.** https://techplay.gg/gta6 ; series article from C63 (31 Oct)  
**UTM example.** `https://techplay.gg/gta6?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-youtube-pilot&utm_content=gta-in-order-desc`  
**Tracking.** `cta_click`, `reminder_set`  
**Follow-up.** January decision: continue Radar monthly or stop long-form.  
**Dependencies.** C63 (GTA in order, 31 Oct), C49

#### C51 — Creator Data Partnerships

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Creator (also PR) | T2 should | Tue 20 Oct 2026 → Thu 31 Dec 2026 | S4, S5, S8, S3 | email/DM outreach, creator videos, Discord co-hosted events | EIC | EIC 2 h/week | $0 |

**Goal.** Offer creators free, credited charts and tool embeds from TechPlay's data for their videos and streams, in exchange for a link and a mention; the currency is data, not money [R15 exec 7, §3 #1, #9].  
**KPI.** Creator mentions with a link (manual log); sessions with utm_source=creator-<handle>; discord_join by creator invite codes.  
**TARGET.** 15 personal outreach emails by 30 Nov; 3 completed collaborations by 31 Dec.  
**Core message.** We have data your audience would like; use it with credit.  
**Proof.** Datasets (release congestion, studios, GTA 6 ledger), tools (WoW Analyzer, map tracker), and an honest press page [R15].

**Key moments.** 2026-10-20 — shortlist of 30 micro creators (GTA, WoW, PC, release-news) via Keymailer/Lurkit search and YouTube · 2026-10-26 — first 5 emails (offer: a custom chart from C20/C21 or a WoW Analyzer segment) · 2026-11-09 — GTA-focused wave (map tracker, ledger) · 2026-12-01 — TGA prediction league co-host offer

**Exact copy (Part 33).**

- **Discord:** Co-hosted event template: "[Creator] joins us Thursday [time CET] in Stage: [topic, e.g. 'rate my character' with the WoW Analyzer]. Bring your character name."

*Outreach email (EIC)*
> Subject: A chart for your next [GTA / WoW / release] video, free  
>
> Hi [Name],  
>
> I'm [Name], editor at TechPlay, a small gaming publication in Sarajevo. I watched your [video]. We keep a database of 333,000+ games and some tools (a WoW character analyzer, a GTA 6 map and a confirmed-vs-rumour ledger).  
>
> If it's useful, I can make you a chart for an upcoming video, for example [specific idea tied to their channel], with our data and your branding. All we'd ask is a credit and a link in the description. No fee either way, and no obligation to use it.  
>
> Our press page, with who we are and what our numbers are, is here: techplay.gg/press  
>
> [Name]  

*Follow-up (7 days, once)*
> Hi [Name], one follow-up on the chart offer; if the timing's wrong, no problem, and I won't email again about it.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1920x1080 / 1280x720:* Chart packs in 16:9 for video, with a small 'Data: TechPlay.gg' line. · *1080x1920:* Vertical chart for Shorts creators.

**CTA.** Credit + link to the data page  
**Landing page.** https://techplay.gg/press (new) and the relevant data page  
**UTM example.** `https://techplay.gg/data/release-congestion-2026?utm_source=creator-handle&utm_medium=creator&utm_campaign=c51-creator-data&utm_content=chart-credit`  
**Tracking.** `cta_click`, `discord_join`, `tool_run`  
**Follow-up.** Log every outreach and answer; no mass emails, no follow-up beyond one.  
**Dependencies.** C54 (/press), C20, C21, C07, C13

### C52–C55: Editorial credibility, trust and partnerships

#### C52 — Verdict: review restart (F24)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Editorial / PR) | T1 must | Tue 6 Oct 2026 → Thu 31 Dec 2026 | S1, S2, S3, S8 | site, X, Facebook, Instagram, Threads, Bluesky, newsletter, Steam Curator (C69) | EIC (reviews) / ED (second reviewer) | EIC 8 h/week (play + write), SC 0.5 h/week | $0 (Games via review codes (C69 Curator Connect, Keymailer) or bought within the existing editorial budget (UNKNOWN amount; EIC decides).) |

**Goal.** Restart reviews with a weekly launch Verdict (short, scored when enough is played) that can grow into a full review, to rebuild credibility and qualify for OpenCritic [R02 §7, R15 exec 1].  
**KPI.** Reviews published (count, dated); days from release to Verdict; organic clicks on Verdict pages.  
**TARGET.** ≥8 Verdicts by 14 Dec (C53 gate); median days from release ≤7 (DOWN from 16–21 days) [R23 #14].  
**Core message.** Verdict: what it is, who it's for, and whether it's worth the money, within a week of release.  
**Proof.** Reviews use the published /rating-system scale; the reviewer's hours and platform are stated on every Verdict.

**Key moments.** 2026-10-06 — Verdict #1 (candidate: Control Resonant, released 24 Sep) · Weekly Mon or Thu after · Candidates by date: Ace Combat 8 (2 Oct), Gears of War: E-Day (6 Oct), Dragon's Dogma 2: Dark Arisen (9 Oct), Planet Zoo 2 (13 Oct), MW4 campaign (16 Oct early access), Phantom Blade Zero (29 Oct), GTA VI (19 Nov, weekend verdict), Dawn of War IV (3 Dec), Path of Exile 2 1.0 (11 Dec, reported) · 2026-12-14 — C53 submission

**Exact copy (Part 33).**

- **Facebook:** Our Verdict on [Game]: [score]/10. [Two sentences on who it's for]. Played for [N] hours on [platform]. [link]
- **Instagram:** Single image 1080x1350: cover, score, one-line verdict, 'Played [N] h on [platform]'. Caption: the two-sentence verdict + 'Full Verdict: link in bio'.
- **X:** Verdict: [Game] — [score]/10. [One sentence]. Played [N] hours on [platform]. [link]
- **Threads:** Finished [N] hours of [Game]. Short version: [verdict line]. Longer version on the site.
- **Bluesky:** Verdict: [Game], [score]/10. [One sentence]. [link]
- **Newsletter blurb:** This week's Verdict: [Game], [score]/10. [One line.] [link]

*Verdict format*
> 600–900 words. Header box: score, platform played, hours played, price at time of writing, 'Who it's for / Who should wait'. Sections: What it is · What works · What doesn't · Verdict. If a later full review follows, the Verdict URL is updated in place with 'Updated after [N] hours' and the score change (if any) explained.  

Not used for this campaign: Facebook Groups, TikTok script, Reddit angle, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Verdict card template. · *1280x720 thumbnail:* Verdict OG. · *1080x1080:* X card.

**CTA.** Read the Verdict  
**Landing page.** https://techplay.gg/reviews  
**UTM example.** `https://techplay.gg/reviews?utm_source=x&utm_medium=organic-social&utm_campaign=c52-verdict&utm_content=f24-control-resonant`  
**Tracking.** `cta_click`, `rating_created`, `shelf_add`, `comment_created`  
**Follow-up.** Game Club wraps (C38) feed a 'community verdict' paragraph.  
**Dependencies.** C69 (review codes), C53  
**Risks.** Capacity: EIC 8 h/week is the largest single commitment; drop F10 'Worth It' in weeks with a big Verdict.

#### C53 — OpenCritic application

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR | T2 should | Mon 7 Dec 2026 → Mon 14 Dec 2026 | S8, S1 | OpenCritic submission form | EIC | EIC 2 h | $0 |

**Goal.** Apply to OpenCritic once TechPlay shows a steady review cadence (≥8 new Verdicts since 6 Oct), so reviews reach store pages that embed OpenCritic [R15 exec 1, R14 §1.2].  
**KPI.** Application submitted; outcome.  
**TARGET.** submitted 14 Dec with ≥8 reviews since 6 Oct, the review policy page and /about/ownership linked.  
**Core message.** A steady weekly review cadence on a published scale, from named reviewers.  
**Proof.** OpenCritic weighs 'demonstrated commitment to critically reviewing games' and structured, professional reviews [R15].

**Key moments.** 2026-12-07 — checklist review · 2026-12-14 — submit

**Exact copy (Part 33).**

*Application note (EIC)*
> TechPlay is an independent gaming publication based in Sarajevo (ownership and funding: techplay.gg/about/ownership). We restarted our review programme on 6 October with a weekly Verdict format and have published [N] reviews since, typically within a week of release, on a published scale (techplay.gg/rating-system). Reviewer, platform and hours played are stated on every review. Recent reviews: [links].  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *web banner:* None. The application links existing pages: /reviews, /rating-system, /about/ownership.

**CTA.** Submit the application (internal action)  
**Landing page.** https://techplay.gg/reviews  
**UTM example.** Not applicable (no public link)  
**Tracking.** `cta_click`  
**Follow-up.** If declined, ask what is missing and re-apply after the gap is closed.  
**Dependencies.** C52, C54

#### C54 — Ownership, Funding & AI Policy page + /press

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Trust) | T1 must | Thu 1 Oct 2026 → Fri 9 Oct 2026 | S8, S9 | site, LinkedIn, X | EIC (text) / DEV (pages) | EIC 5 h, DEV 4 h | $0 |

**Goal.** Publish who owns TechPlay, how it is funded, how it uses AI, and a press page with honest numbers, before any outreach asks a partner to trust us [R15 §1, R21 PART-03].  
**KPI.** Pages live; outreach emails that link /press (share of C20/C21/C51/C55 pitches).  
**TARGET.** both pages live 9 Oct; every pitch from 9 Oct links /press.  
**Core message.** Who we are, who pays for this, how we use AI, and the numbers we can stand behind.  
**Proof.** Impressum lists Luminor Solutions, Sarajevo; AdSense is the revenue model [R02 §6.2, R20].

**Key moments.** 2026-10-01 — drafts · 2026-10-07 — EIC sign-off · 2026-10-09 — live (D-038)

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-038 pages ship 18 Dec. Interim on 9 Oct: EIC's ownership, funding and AI-use text is published as an article linked from /about; pitches link that article until /press exists.

**Acceptance criteria.**
- [ ] /about/ownership: owner and publisher (Luminor Solutions, Sarajevo), funding sources (advertising via Google AdSense; any affiliate links disclosed), editorial independence statement, AI policy (where AI is used: e.g. WoW Analyzer tips labelled as AI-generated; where it is not: reviews and news are written by named people), corrections policy and log link.
- [ ] /press: what TechPlay is (one paragraph), team with author pages, live numbers only (games and studios in the catalogue from the API; articles published; Discord members from the Discord API), logos, contact, how we source data.
- [ ] Both linked from the footer and About page.

**Exact copy (Part 33).**

- **X:** We published two pages we should have had earlier: who owns and funds TechPlay and how we use AI (techplay.gg/about/ownership), and a press page with numbers we can stand behind (techplay.gg/press).

*AI policy (page text)*
> News, reviews, guides and data stories on TechPlay are written and edited by the people named on them. We use AI in two places, and label both: the tips in the WoW Analyzer are generated by a language model from your character's data and marked as such; and we use automated tools to check spelling and to help find source documents. AI is never used to write a review or to invent a quote, a number or a source.  

*LinkedIn (EIC)*
> We published TechPlay's ownership, funding and AI-use policy, and a press page. If you work with gaming media in the region, that's where to start: techplay.gg/press  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* Plain OG for both pages.

**CTA.** Read /press  
**Landing page.** https://techplay.gg/about/ownership (new); https://techplay.gg/press (new)  
**UTM example.** `https://techplay.gg/press?utm_source=linkedin&utm_medium=organic-social&utm_campaign=c54-ownership-press&utm_content=launch-a`  
**Tracking.** `cta_click`  
**Follow-up.** Update /press numbers automatically (API); review text every quarter.  
**Dependencies.** D-038, C01

#### C55 — Balkan regional partnerships (studios, A1 Adria League, regional press)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Partnership | T3 cut first | Sun 1 Nov 2026 → Mon 30 Nov 2026 | S9, S8 | email, LinkedIn, regional Facebook, Discord (AMA) | EIC | EIC 3 h/week in November, ED 3 h per spotlight | $0 |

**Goal.** Use TechPlay's Sarajevo base and studio data to become the regional games reference: studio spotlights, a media partnership with A1 Adria League, and regional press pickups of C21 [R15 §4, R21 PART-04].  
**KPI.** Partnerships agreed; regional referral sessions (utm_source=partner-<name>); studio pages corrected by studios.  
**TARGET.** 10 studio contacts, 1 esports/media partner conversation, 2 regional press pickups in November.  
**Core message.** The region's game studios, counted and covered, from a publication based here.  
**Proof.** Studio census (C21); /studios/country/ba exists; About says 'Independent · Sarajevo' [R15 exec 6].

**Key moments.** 2026-11-02 — studio list from /studios/country/ba and neighbours · 2026-11-09 — A1 Adria League contact · 2026-11-16 — first studio spotlight article · 2026-11-30 — review

**Exact copy (Part 33).**

- **Facebook:** We're covering game studios from Bosnia and Herzegovina and the region: who they are, what they're making, and where to play it. If you run a studio here, write to us. [link]
- **Discord:** #announcements: "Studio spotlight: [Studio], [city]. They answer questions in #ama on [date, time CET]."

*Studio email (EIC)*
> Subject: TechPlay studio spotlight — [Studio]  
>
> Hi [Name],  
>
> TechPlay is a gaming publication based in Sarajevo. Your studio is in our database ([link to studio page]); if anything there is wrong, tell me and we'll fix it.  
>
> We're running short spotlights on studios from the region: what you're making, where to play it, and a Q&A in our Discord if you want one. No cost. Interested?  
>
> [Name]  

*A1 Adria League (EIC)*
> Subject: Media partnership — TechPlay × A1 Adria League  
>
> Hi [Name],  
>
> TechPlay (Sarajevo) covers games for an English-first audience with a regional base, and keeps a database of 333,000+ games and 57,630 studios. We'd like to talk about coverage of the league's season: results write-ups, player and team pages linked to our game pages, and cross-promotion in our Discord and newsletter. Our press page: techplay.gg/press. Could we set up a call?  
>
> [Name]  

Not used for this campaign: Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1080:* Studio spotlight card. · *1280x720 thumbnail:* Spotlight article OG.

**CTA.** Studios: get in touch / readers: read the spotlight  
**Landing page.** https://techplay.gg/studios/country/ba  
**UTM example.** `https://techplay.gg/studios/country/ba?utm_source=partner-a1adria&utm_medium=partner&utm_campaign=c55-balkan-partnerships&utm_content=league-link`  
**Tracking.** `cta_click`, `discord_join`  
**Follow-up.** Keep spotlights monthly in 2027 if pickups happen.  
**Dependencies.** C21, C54  
**Risks.** Reboot Develop status unverified; do not plan around it [R15 §4].

### C56–C58: Paid tests (gated)

#### C56 — Paid: Google branded + tool exact match

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Paid | T2 should | Mon 19 Oct 2026 → Thu 31 Dec 2026 | S5, S2, S1 | Google Search | EIC | EIC 3 h setup + 0.5 h/week | $292 (LEAN, aligned with 26-PAID-MEDIA §5.1: C56a branded $39 (Oct) + $90 (Nov) + $93 (Dec); C56b tool-exact flight $65 (Oct) + $5 (Nov). GROWTH adds $155 of tool terms in Dec if T7 passed [spine §13, R16 §3].) |

**Goal.** Protect the brand query and learn the real CPC and volume of tool queries with a tiny exact-match budget, only after measurement is live [R16 §2.3, T1, T7].  
**KPI.** Impression share (branded); CPC; tool_run and registration_complete per $ (tool queries).  
**TARGET.** branded impression share and a real CPC by 2 Nov; stop tool keywords with <20 impressions/week after 14 days; pause branded if CPC > $1.00 (R16 T1 stop-loss).  
**Core message.** TechPlay: gaming news, a 333,000-game database and free tools, on the query that names us.  
**Proof.** Branded exact match is cheap and defensive; tool-query volumes are unknown, and this test is how they get measured [R16 §2.3].

**Key moments.** 2026-10-16 — C03 gate passed (EIC) · 2026-10-19 — campaigns live · 2026-11-02 — 14-day read; cut dead tool keywords · 2026-12-31 — end-of-quarter read

**Delivery status (32-DEVELOPMENT-BACKLOG).** Needs D-007 and D-008; earliest start 2 Nov per 32 (26-PAID-MEDIA plans 19 Oct). No spend before measurement.

**Exact copy (Part 33).**

- **Ad copy:**

> RSA headlines (≤30 chars): 'TechPlay.gg Official Site' · 'Gaming, on the Record' · 'Free WoW Character Analyzer' · 'Check Your WoW Character' · 'One Library for All Platforms' · 'Steam, PlayStation, Xbox, GOG' · 'Release Calendar + Reminders' · 'Backlog Advisor, Free' · 'No Card, Free to Use'  
> Descriptions (≤90 chars): 'Gaming news, a 333,000-game database and a free library that fills itself from Steam.' · 'Paste your character and realm. Gear, enchants and progression checked in seconds.' · 'Link Steam, PlayStation, Xbox, GOG or Epic. Reminders and price alerts for your wishlist.' · 'What to play next, read from your own library. Free, no card.'  
> Sitelinks: WoW Analyzer (/wow-analyzer) · Release Calendar (/calendar) · GTA 6 Hub (/gta6) · The Save File (/newsletter)  
> Keywords (exact): [techplay] [techplay gg] [techplay.gg] [techplay wow analyzer] [techplay backlog advisor]; tool test: [wow raid readiness] [wow character analyzer] [backlog tool] [what should i play next]  


Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text.

**Creative.** *web banner:* Search ads are text only; sitelink descriptions written with the RSA.

**CTA.** Visit / check your character  
**Landing page.** https://techplay.gg/ ; https://techplay.gg/wow-analyzer ; https://techplay.gg/backlog-advisor  
**UTM example.** `https://techplay.gg/wow-analyzer?utm_source=google&utm_medium=cpc&utm_campaign=c56-google-branded-tools&utm_content=rsa-wow&utm_term=wow-character-analyzer`  
**Tracking.** `cta_click`, `tool_run`, `registration_complete`  
**Follow-up.** Keep branded if any competitor appears in auction insights; otherwise reduce to $1/day in 2027.  
**Dependencies.** C03 (gate), D-007, D-009

#### C57 — Paid: Meta registration test (US 18+)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Paid | T2 should | Mon 2 Nov 2026 → Mon 14 Dec 2026 | S2, S4, S1 | Meta (Facebook + Instagram, Advantage+ placements) | EIC (budget, sign-off) / SC (setup, creative) | EIC 3 h, SC 6 h, DS 4 h, DEV (D-031) 12 h | $385 (LEAN, aligned with 26-PAID-MEDIA §5.1: C57a $189 (2–22 Nov, $9/day) + $196 (1–14 Dec, $14/day, only if T2 stop-loss not hit; else C57c). GROWTH adds C57b GTA hub, C57c newsletter, C57d retargeting and C57e giveaway lines (26 §5.2) [spine §13, R16 §3].) |

**Goal.** Test whether a library-import demo can buy verified, activated accounts in the US at a sane cost, with measurement that respects consent [R16 T2, T3, §2.1].  
**KPI.** Cost per verified account = spend ÷ email_verified (or social registration) attributed to c57; cost per A2 activated account.  
**TARGET.** read a CPC and a click→verified rate; stop-loss $150 with <5 verified accounts (R16 T2). No CPA promise.  
**Core message.** Your Steam, PlayStation and Xbox games in one library, free.  
**Proof.** Free five-platform import; Steam sign-in (C44).

**Key moments.** 2026-10-30 — D-031 Pixel + CAPI behind consent verified · 2026-11-02 — wave 1: library demo vs GTA 6 reminder creative · 2026-11-22 — wave 1 ends; read · 2026-12-01 — wave 2: C57a continues only if the T2 stop-loss was not hit; otherwise C57c newsletter (26 §5.1) · 2026-12-14 — end

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-031 decision due 5 Oct. 32's default (Option A) drops C57 and November retargeting for 2026 and decides on 1 Jan 2027; 26-PAID-MEDIA budgets C57 from 2 Nov. Copy and creative here are ready for whichever date is chosen.

**Exact copy (Part 33).**

- **Ad copy:**

> Ad A (C57a library registration, all tiers; 1080x1350 + 1080x1920 video 12 s)  
> Primary text: Your Steam, PlayStation and Xbox games in one library, with the hours you've already played. Free, no card.  
> Headline: Start your library  
> Description: Sign in with Steam in one click  
> CTA button: Sign up  
>
> Ad B (C57b GTA 6 hub, GROWTH tier only)  
> Primary text: GTA 6 is out 19 November on PS5 and Xbox Series X|S. Set a reminder and get the unlock time for your time zone when it's official.  
> Headline: Remind me about GTA 6  
> CTA button: Sign up  
>
> Ad C (C57c newsletter; GROWTH in Nov, LEAN only as the Dec fallback if Ad A hit its stop-loss)  
> Primary text: The Save File: every Friday, next week's releases with reminders and one number worth knowing. Free, one click to leave.  
> Headline: Get The Save File  
> CTA button: Subscribe  
>
> Targeting: US, 18+, Advantage+ audience (no interest stacks), placements automatic. Objective: Leads/Conversions optimised on registration_complete via CAPI (consent-gated).  


Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text.

**Creative.** *1080x1350:* Ad A static: shelf screenshot with Steam/PS/Xbox badges. · *1080x1920:* Ad A video: 12 s screen recording Steam sign-in → shelf fills. · *1080x1080:* Ad B: GTA 6 key art (licensed/official use only) + 'Remind me'. · *1080x1350:* Ad C: sample Save File issue on a phone, subject line visible.

**CTA.** Sign up  
**Landing page.** https://techplay.gg/register?from=c57 ; https://techplay.gg/gta6/release-time (new) ; https://techplay.gg/newsletter (new)  
**UTM example.** `https://techplay.gg/register?from=c57&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57-meta-registration&utm_content=ad-a-video&utm_term=us-18plus-adv`  
**Tracking.** `registration_complete`, `email_verified`, `library_connected`, `reminder_set`  
**Follow-up.** If cost per verified account beats C58, extend into Q1 2027; if stop-loss triggers, stop and report CPC + conversion ceiling.  
**Dependencies.** C03, D-031, C44, C08, C40, 26-PAID-MEDIA gates G7/G8  
**Risks.** EEA consent default denied: test is US-only by design; teen audiences excluded [R16 §2.14b].

#### C58 — Paid: Reddit tool/hub test (GTA 6 hub, WoW Analyzer)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Paid | T3 cut first | Mon 9 Nov 2026 → Wed 25 Nov 2026 | S4, S5 | Reddit Ads (feed + conversation placement) | EIC (budget) / SC (setup, replies) | EIC 2 h, SC 4 h, DS 1 h | $0 (LEAN: $0 (26-PAID-MEDIA §5.1: at $300/month Meta gets the money). GROWTH: C58a $136 ($8/day) + C58b $85 + C58c $85 in 9–25 Nov; AGGRESSIVE per 26 §5.3 [spine §13, R16 §3].) |

**Goal.** Test Reddit community targeting with post-style ads for the two TechPlay assets that fit named subreddits: the GTA 6 map/hub and the WoW Analyzer [R16 T4, T5, §2.8].  
**KPI.** Cost per discord_click and per tool_run (tool=wow); registrations; CTR (below 0.2% = targeting problem).  
**TARGET.** stop-loss $100 with <20 Discord clicks (GTA) or <30 analyses (WoW); CTR below 0.2% on Ad 3 ends it (R16 T4–T6); read CPC per sub.  
**Core message.** Tools, not articles: the GTA 6 map and the WoW Analyzer, shown to the communities they are built for.  
**Proof.** Community targeting of named subreddits is the closest thing to buying a gaming audience after Meta's interest consolidation; post-style ads fit Reddit's register [R16 §2.8].

**Key moments.** 2026-11-06 — landing pages checked (hub SSR, Analyzer copy) · 2026-11-09 — live · 2026-11-18 — mid read · 2026-11-25 — end

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (needs D-008); landing-page counter plus UTMs are the source of truth.

**Exact copy (Part 33).**

- **Reddit angle:** Comments on promoted posts are answered by SC within 12 hours; no deleting critical comments.
- **Ad copy:**

> Ad 1 (C58a GTA 6 → Discord; subs r/GTA6, r/GTA, r/PS5)  
> Headline: The GTA 6 map, with the unconfirmed spots marked  
> Body: 1,058 marked locations, 211 of them flagged as unconfirmed. From 19 November it remembers what you've found if you sign in. Free.  
> CTA: Learn more → /gta6/map  
>
> Ad 2 (C58b WoW Analyzer; subs r/wow, r/wownoob, r/CompetitiveWoW)  
> Headline: Paste your WoW character, get a readiness check  
> Body: Gear, enchants and progression checked against Blizzard and Raider.IO data. No account needed. The tips are AI-generated and labelled.  
> CTA: Try it → /wow-analyzer  
>
> Ad 3 (C58c Backlog Advisor; subs r/patientgamers, r/Steam, r/ShouldIbuythisgame)  
> Headline: Too many games, not enough evenings?  
> Body: The Backlog Advisor reads the games you already own and suggests what to play next. Link Steam and it fills itself. Free.  
> CTA: Learn more → /backlog-advisor  


Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Push text.

**Creative.** *1080x1080:* Map screenshot with unconfirmed markers visible. · *1080x1350:* Analyzer result screenshot (staff character).

**CTA.** Learn more / Try it  
**Landing page.** https://techplay.gg/gta6/map ; https://techplay.gg/wow-analyzer ; https://techplay.gg/backlog-advisor  
**UTM example.** `https://techplay.gg/wow-analyzer?utm_source=reddit&utm_medium=paid-social&utm_campaign=c58-reddit-tools&utm_content=ad2-analyzer&utm_term=wow`  
**Tracking.** `discord_click`, `tool_run(tool=wow)`, `registration_complete`, `cta_click`  
**Follow-up.** Compare with C57 on cost per verified account; winner gets the Q1 budget.  
**Dependencies.** C03, D-020 (map attribution before Ad 1), D-040, C54 (AI-tip label, per the AI policy), C47 (organic reputation first)  
**Risks.** Ad 1 runs only if D-020 is resolved; otherwise run Ad 2 alone.

### C59: Web push

#### C59 — Web push for reminders (opt-in at 'remind me')

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product | T3 cut first | Mon 26 Oct 2026 → Mon 9 Nov 2026 | S4, S1, S7 | web push | DEV | DEV 16 h | $0 (OneSignal free tier up to 10,000 web-push subscribers per send [R16 §2.13].) |

**Goal.** Add web push as a reminder channel, asked only at the moment someone taps 'Remind me', never as a site-wide prompt [R07 §3.9, R16 T14].  
**KPI.** Opt-in rate = notification_enabled ÷ reminder_set on web; push CTR = alert_clicked(channel=push) ÷ reminder_delivered(channel=push).  
**TARGET.** live 9 Nov (before GTA launch); opt-in rate measured; stop if <1% after 2 weeks (R16 T14).  
**Core message.** Get it as a notification.  
**Proof.** Chrome demotes sites with low acceptance; iOS supports web push only for Home Screen apps; hence opt-in only at reminder time [R07 §3.9].

**Key moments.** 2026-10-26 — build (service worker, OneSignal free tier or native) · 2026-11-06 — QA · 2026-11-09 — live

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-019 slips to a 1 Jan decision. Reminders go by email and bell only in 2026.

**Acceptance criteria.**
- [ ] Soft prompt shown only after a reminder is set: 'Also get it as a notification?' → native prompt only on Yes.
- [ ] No prompt on first visit or on articles.
- [ ] Pushes: release day, GTA unlock times (C08), price drops (C31), year in review (C28); max 1 per day.
- [ ] notification_enabled fires.

**Exact copy (Part 33).**

- **Push text:** Examples: 'GTA 6 unlock times are out. Yours: [time].' · '[Game] is out today on [platform].' · '[Game] from your wishlist is [price] on [store].'

*Soft prompt*
> Also get this as a notification on this device? We only send reminders you set. [Yes] [No thanks]  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, X, Threads, Bluesky, Reddit angle, Discord, YouTube, Shorts/Reels script, Newsletter blurb, Ad copy.

**Creative.** *web banner:* Soft-prompt component under the 'Remind me' confirmation (DS, 1 h). Push icon uses the site favicon at 192x192.

**CTA.** Yes, notify me  
**Landing page.** Any page with 'Remind me' (/games/{slug}, /calendar, /gta6/release-time)  
**UTM example.** `https://techplay.gg/gta6/release-time?utm_source=push&utm_medium=push&utm_campaign=c59-web-push&utm_content=gta-unlock`  
**Tracking.** `notification_enabled`, `reminder_delivered(channel=push)`, `alert_clicked`  
**Follow-up.** If opt-in <1% after 2 weeks, keep push only for GTA and price alerts.  
**Dependencies.** D-019, C43, C45

### C60–C63: SEO hubs and evergreen

#### C60 — PC Fix Hub (/guides/pc-fixes) + Fix It Friday (F07)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Video) | T1 must | Mon 12 Oct 2026 → Thu 31 Dec 2026 | S3 | site, TikTok/Shorts/Reels (C49), Reddit (C47), Discord #pc-help, X, newsletter | ED | ED 4 h/guide, SC 0.5 h/week, DEV 2 h (hub page) | $0 |

**Goal.** Build pillar P2: a PC troubleshooting hub with one new fix guide a week, where page one has few gaming outlets, feeding Fix It Friday shorts and Reddit help [R09 EA-001..009, R06 §8].  
**KPI.** Organic clicks to /guides/pc-fixes and its guides (Search Console); newsletter_signup from guides.  
**TARGET.** hub + first guide 12 Oct; 10 guides by 18 Dec; organic clicks UP month over month.  
**Core message.** PC problems, fixed in order of what's most likely to work.  
**Proof.** Each guide lists steps from the vendor or platform documentation and says which fixes are safe [R09].

**Key moments.** 2026-10-12 — hub + 'Shader compilation stutter: what it is and every fix that works' (EA-001) · 2026-10-16 — 'Secure Boot and TPM 2.0 for anti-cheat games: how to enable safely' (EA-006) · 2026-10-23 — 'DXGI_ERROR_DEVICE_REMOVED and DEVICE_HUNG crashes explained' (EA-002) · 2026-10-30 — 'Windows 11 gaming settings checklist' (EA-004) · 2026-11-06 — 'Steam content file locked and other update errors' (EA-003) · 2026-11-13 — 'GPU driver clean install and rollback' (EA-007) · 2026-11-20 — 'Game crashes to desktop with no error: triage' (EA-009) · 2026-11-27 — 'Low GPU usage and CPU bottlenecks' (EA-008) · 2026-12-04 — 'Game launcher errors hub' (EA-005) · 2026-12-11 — 'Can I run it? Reading system requirements before a sale'

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-032 route slips to Jan 2027. Guides publish one by one on /guides as scheduled; a 'PC fixes' pillar guide lists them and is later redirected into /guides/pc-fixes.

**Exact copy (Part 33).**

- **X:** Fix It Friday: [problem]. The three fixes most likely to work, in order, and what not to try: [link]
- **Reddit angle:** Answer PC problem threads with the steps in the comment itself; the guide link goes last, disclosed (C47).
- **Discord:** #pc-help pin: "The PC Fix Hub: https://techplay.gg/guides/pc-fixes — one new guide every Friday. If your problem isn't there, post it here with your GPU, CPU and the game; if it comes up twice, it becomes a guide."
- **Shorts/Reels script:** See C49 Fix It Friday template.
- **Newsletter blurb:** Fix It Friday: [problem] and the fixes that work. [link]

*Hub intro*
> H1: PC gaming fixes  
> Intro: The PC problems we see most, with fixes in the order most likely to work. Each guide says what the fix does, what to check first, and what not to change. New guide every Friday.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, YouTube, Push text, Ad copy.

**Creative.** *1080x1920:* Fix It Friday short template (C49). · *1280x720 thumbnail:* Guide OG template: problem in large type. · *web banner:* Hardware section header link to the hub.

**CTA.** Read the fix  
**Landing page.** https://techplay.gg/guides/pc-fixes (new)  
**UTM example.** `https://techplay.gg/guides/pc-fixes?utm_source=reddit&utm_medium=community&utm_campaign=c60-pc-fix-hub&utm_content=comment&utm_term=pcgaming`  
**Tracking.** `cta_click`, `newsletter_signup`, `comment_created`  
**Follow-up.** Guides updated when a patch or driver changes a step; 'Last checked' on every guide.  
**Dependencies.** C49, C47

#### C61 — Switch 2 Hub (/switch-2)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Product) | T2 should | Mon 19 Oct 2026 → Thu 31 Dec 2026 | S6, S1, S7 | site, X, Instagram carousel, Facebook, Threads, Reddit (C47), Discord #switch-2, newsletter | ED (content) / DEV (template) | ED 10 h + 1 h/week, DEV 8 h (share of D-032), DS 2 h | $0 |

**Goal.** Launch the Switch 2 platform hub: Switch 2 Editions and upgrades, upcoming releases, price context and 'is it on Switch 2' answers from the database [R18 blueprint 4, R21 HUB-003].  
**KPI.** Hub organic + Discover clicks; shelf_add / reminder_set from the hub; newsletter_signup.  
**TARGET.** live 26 Oct (the day before Minecraft Bedrock on Switch 2); edition tracker covers every dated Switch 2 Edition to Jan 2027.  
**Core message.** Everything coming to Switch 2, which editions are upgrades, and what they cost.  
**Proof.** Dates from Nintendo/publishers; Switch 2 price $499.99 since 1 Sep 2026 [R05].

**Key moments.** 2026-10-23 — MW4 on Switch 2 (first CoD on a Nintendo platform since Ghosts) · 2026-10-26 — hub live · 2026-10-27 — Minecraft Bedrock on Switch 2 · 2026-11-12 — Pikmin 4 Switch 2 Edition; Metaphor: ReFantazio on Switch 2 · 2026-12-03 — Xenoblade Chronicles 3 Switch 2 Edition · 2026-12-04 — Monster Hunter Wilds on Switch 2 · 2027-01-28 — Metroid Ravenous

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-032 hub template slips to Jan 2027. Interim: ED publishes a Switch 2 pillar article on 26 Oct with the edition tracker as a table; the hub absorbs it with a 301 in January.

**Acceptance criteria.**
- [ ] /switch-2 server-renders: upcoming Switch 2 releases (from the calendar), Switch 2 Edition tracker table (game, date, upgrade path/price where officially stated), price history line for the console, 'Is it on Switch 2?' search box.
- [ ] Linked from every Switch 2 game page and the header platform menu.

**Exact copy (Part 33).**

- **Facebook:** Switch 2 owners: we built one page with every upcoming release, which Switch 2 Editions are upgrades from Switch 1, and the price context. [link]
- **Instagram:** Carousel: 'COMING TO SWITCH 2' — MW4 (23 Oct), Minecraft Bedrock (27 Oct), Pikmin 4 S2 Edition + Metaphor (12 Nov), Xenoblade 3 S2 Edition (3 Dec), Monster Hunter Wilds (4 Dec), Metroid Ravenous (28 Jan). Caption: The full list, with upgrade details, is on the hub.
- **X:** New: a Switch 2 hub. Every upcoming Switch 2 release, which Switch 2 Editions are upgrades, and what they cost: techplay.gg/switch-2
- **Threads:** Which Switch 2 Edition upgrade is actually worth paying for? Building a tracker and want to know which ones people care about.
- **Reddit angle:** r/NintendoSwitch2: answer edition and upgrade questions with the official info; link the tracker only when it answers the question (C47).
- **Discord:** #switch-2: "The Switch 2 hub is live: https://techplay.gg/switch-2 — missing a game? Post it here."
- **Newsletter blurb:** New: the Switch 2 hub, with every upcoming release and edition upgrade. [link]

Not used for this campaign: Facebook Groups, TikTok script, Bluesky, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Release carousel. · *1280x720 thumbnail:* Hub OG. · *1080x1080:* X card.

**CTA.** Open the Switch 2 hub  
**Landing page.** https://techplay.gg/switch-2 (new)  
**UTM example.** `https://techplay.gg/switch-2?utm_source=instagram&utm_medium=organic-social&utm_campaign=c61-switch-2-hub&utm_content=carousel-a`  
**Tracking.** `cta_click`, `shelf_add`, `reminder_set`, `newsletter_signup`  
**Follow-up.** Edition tracker updated with each Nintendo Direct; file-size field for Switch 2 games when data allows (R09 EA-101).  
**Dependencies.** D-032, D-023

#### C62 — Steam Hub (/steam)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Product) | T2 should | Mon 26 Oct 2026 → Thu 31 Dec 2026 | S3, S7, S1, S2 | site, X, Reddit (data comments), Discord, newsletter | ED (content) / DEV (template, movers job) | ED 8 h + 1 h/week, DEV 10 h | $0 |

**Goal.** Launch the Steam/PC platform hub: the Steam event calendar, Next Fest tracker archive, weekly most-played movers (F13), sale picks and a connect-Steam CTA; the page SteamDB cannot give you because it doesn't know your shelf [R18 blueprint 3, R21 HUB-004].  
**KPI.** Hub organic clicks; library_connected (platform=steam) from the hub; weekly movers post sessions.  
**TARGET.** live 2 Nov; movers updated every Tuesday; Winter Sale (C34) runs on it.  
**Core message.** Steam's calendar, this week's biggest movers, and your own Steam library, in one place.  
**Proof.** Steam's weekly most-played chart is public (e.g. week to 26 Sep: CS2 peak 1,354,009; Total War: WARHAMMER III up from 67th to 28th) [R05 §6].

**Key moments.** 2026-11-02 — live (Scream Fest ends) · Every Tuesday — Steam Movers (F13) from the Steam charts API · 2026-11-16 to 23 — Auto-Battler RPG Fest note · 2026-12-17 — Winter Sale (C34)

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-032 hub template slips to Jan 2027. Interim: a Steam pillar article on 2 Nov (event calendar + weekly movers table); C34 Winter Sale picks run as a /news article linked from it.

**Acceptance criteria.**
- [ ] /steam server-renders: event calendar (Autumn Sale, Next Fest, Scream Fest, Auto-Battler Fest, Winter Sale, 2027 Next Fest 22 Feb, Spring Sale 18–25 Mar), movers table with week and source, current sale picks, 'Sign in with Steam' CTA.
- [ ] Movers generated from the charts API with the week-ending date.

**Exact copy (Part 33).**

- **X:** Steam Movers, week to [date]: biggest climber [Game] ([rank] → [rank]). Top three by peak players: [A], [B], [C]. Source: Steam's weekly most-played chart. More: techplay.gg/steam
- **Bluesky:** Steam Movers, week to [date]: [Game] up [N] places. Table and source: techplay.gg/steam
- **Reddit angle:** In r/Steam and r/pcgaming threads about a game's player count, reply with the rank movement and Steam's chart as the source; link /steam only if asked (C47).
- **Discord:** #pc-gaming (Buffy, Tue): "Steam Movers this week: [Game] up [N] places. Full table: https://techplay.gg/steam"
- **Newsletter blurb:** The Number: [Game] climbed from [rank] to [rank] on Steam's most-played chart this week. [link]

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Movers card: arrow, game, rank change, source line. · *1280x720 thumbnail:* Hub OG.

**CTA.** Open the Steam hub / Sign in with Steam  
**Landing page.** https://techplay.gg/steam (new)  
**UTM example.** `https://techplay.gg/steam?utm_source=x&utm_medium=organic-social&utm_campaign=c62-steam-hub&utm_content=f13-movers-w45`  
**Tracking.** `library_connected(platform=steam)`, `cta_click`, `registration_complete`  
**Follow-up.** Library-worth card and public Steam calculator (R10) are Q1 candidates for this hub.  
**Dependencies.** D-032, C44 (Steam sign-in), C18, C34

#### C63 — In Order series pages batch (F09)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO | T2 should | Sat 3 Oct 2026 → Sat 2 Jan 2027 | S1, S2, S4 | site, Instagram carousel, X, Reddit (answers), newsletter | ED | ED 3 h/page, DS 0.5 h/page, SC 0.5 h/page | $0 |

**Goal.** Publish one 'X games in order' page every Saturday from the series data, timed to each series' next release, with 'add the whole series to your shelf' [R09 EB-001, EB-022, R18 exec 4].  
**KPI.** Organic clicks per page (Search Console); shelf_add from series pages.  
**TARGET.** 13 pages by 26 Dec + Metroid on 2 Jan; each indexed within 14 days.  
**Core message.** Every [series] game in order, where to play each one today, and whether you need to.  
**Proof.** Series relations for 333,000+ games; release dates checked against publisher listings [R09].

**Key moments.** 2026-10-03 — Gears of War (E-Day 6 Oct) · 2026-10-10 — Call of Duty (MW4 23 Oct) · 2026-10-17 — Resident Evil · 2026-10-24 — Final Fantasy VII (Revelation 8 Apr 2027) · 2026-10-31 — Grand Theft Auto (VI 19 Nov) · 2026-11-07 — Persona (4 Revival 18 Feb 2027) · 2026-11-14 — Kingdom Hearts (IV late 2027) · 2026-11-21 — Yakuza / Like a Dragon (Stranger Than Heaven 15 Jan 2027) · 2026-11-28 — Metro (2039 on 4 Feb 2027) · 2026-12-05 — Monster Hunter (Wilds on Switch 2, 4 Dec) · 2026-12-12 — Tomb Raider (Legacy of Atlantis 12 Feb 2027) · 2026-12-19 — Fable (23 Feb 2027) · 2026-12-26 — God of War (Laufey 16 Feb 2027) · 2027-01-02 — Metroid (Ravenous 28 Jan 2027)

**Exact copy (Part 33).**

- **Instagram:** Carousel template: S1 '[SERIES] IN ORDER'. One slide per game: year, platform(s) available today. Last slide: 'Next: [new game], [date]. Full order + where to play: link in bio.'
- **X:** [Series] in order, before [new game] on [date]: [N] games, release order and story order, and where each one is playable today. [link]
- **Reddit angle:** Answer 'what order should I play [series]' threads in text with the order; link the page only when the thread asks where to buy/play each (C47).
- **Newsletter blurb:** In Order: every [series] game before [new game]. [link]

Not used for this campaign: Facebook, Facebook Groups, TikTok script, Threads, Bluesky, Discord, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Series timeline carousel template. · *1280x720 thumbnail:* Series OG template.

**CTA.** Add the whole series to your shelf  
**Landing page.** https://techplay.gg/guides/[series]-games-in-order (articles on /guides, linked to /games/series pages)  
**UTM example.** `https://techplay.gg/guides/grand-theft-auto-games-in-order?utm_source=instagram&utm_medium=organic-social&utm_campaign=c63-in-order&utm_content=f09-gta`  
**Tracking.** `shelf_add`, `cta_click`, `reminder_set`  
**Follow-up.** Each page updated when the new game launches (e.g. GTA page on 19 Nov).  
**Dependencies.** D-023, C16, C17, C50

### C64–C68: Recurring social and site community

#### C64 — Hidden Gem Thursday (F05)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Social (also SEO) | T2 should | Thu 1 Oct 2026 → Thu 31 Dec 2026 | S1, S2, S10 | site list, Instagram, Facebook, X, Threads, Bluesky, Discord, Reddit (r/patientgamers context only) | ED (pick, write) / SC (post) | ED 1 h/week, SC 0.5 h/week | $0 |

**Goal.** Every Thursday, one highly rated, little-played game from the database's hidden-gems module, written up in 150 words; the only recommendation post only TechPlay can source [R02 fix #20, R21 TOOL-34].  
**KPI.** shelf_add per post; saves on Instagram; organic clicks to the hidden-gems list page.  
**TARGET.** 13 Thursdays; shelf adds per post UP month over month.  
**Core message.** Brilliantly rated. Almost nobody has played it.  
**Proof.** Picked from the hidden-gems module (high rating, few players), then played or checked by an editor before posting.

**Key moments.** Every Thursday 17:00 CET

**Exact copy (Part 33).**

- **Facebook:** Hidden Gem Thursday: [Game] ([year]). [Two sentences.] Where to play it today: [link]
- **Instagram:** Single image: cover + 'HIDDEN GEM THURSDAY'. Caption: [Game] ([year], [platforms]). [Two sentences: what it is, why it's worth it.] Rated [aggregate score, labelled as aggregate], barely played. On your shelf yet?
- **X:** Hidden Gem Thursday: [Game] ([year], [platforms]). [One sentence.] [link]
- **Threads:** This week's hidden gem: [Game]. Has anyone here actually played it?
- **Bluesky:** Hidden Gem Thursday: [Game] ([year]). [One sentence.] [link]
- **Reddit angle:** No link posts. Recommend the game in r/patientgamers threads that ask for that kind of game, in text only.
- **Discord:** #what-are-you-playing: "Hidden gem this week: [Game]. Anyone played it? If you have, tell us if we're right."

Not used for this campaign: Facebook Groups, TikTok script, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1350:* Gem template: cover, small gem icon, rating labelled 'aggregate'. · *1080x1080:* Square version.

**CTA.** Add it to your shelf  
**Landing page.** https://techplay.gg/lists (Hidden Gems list, updated weekly)  
**UTM example.** `https://techplay.gg/lists?utm_source=instagram&utm_medium=organic-social&utm_campaign=c64-hidden-gem&utm_content=f05-w40`  
**Tracking.** `shelf_add`, `social_share`, `cta_click`  
**Follow-up.** Quarterly 'Hidden gems of the quarter' list page for search.  
**Dependencies.** D-029 (module not empty for guests)

#### C65 — On This Day (F06)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Social (also Community) | T2 should | Mon 28 Sep 2026 → Thu 31 Dec 2026 | S10, S2 | Discord #general, X, Threads, Facebook | SC (manual) → DEV (automation) | SC 10 min/day until automated, DEV 4 h | $0 |

**Goal.** A daily anniversary card from the on-this-day endpoint, posted by Buffy in Discord and cross-posted to X, Threads and Facebook; nostalgia is a durable register [R06 §4, R21 TOOL-35].  
**KPI.** Replies per post (Discord + X); on-this-day page sessions.  
**TARGET.** daily from 28 Sep, manual until Buffy automation (then 0 SC minutes).  
**Core message.** On this day in [year]: [Game] came out.  
**Proof.** Release dates from the database; only day-precision dates used.

**Key moments.** 2026-09-28 — manual posting starts · 2026-11-02 — Buffy posts automatically (bot job)

**Delivery status (32-DEVELOPMENT-BACKLOG).** D-049 automation scheduled 2027-W09. SC posts by hand through December.

**Exact copy (Part 33).**

- **Facebook:** On this day in [year], [Game] came out. Did you play it back then?
- **X:** On this day in [year]: [Game] released on [platforms]. Did you play it at launch?
- **Threads:** [N] years ago today: [Game]. What do you remember about it?
- **Discord:** Buffy, daily 09:00 CET: "On this day in [year]: [Game] came out on [platforms]. First time you played it?"

Not used for this campaign: Facebook Groups, Instagram, TikTok script, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1080:* On-this-day card: cover, year, 'On this day'.

**CTA.** Reply  
**Landing page.** https://techplay.gg/games/{slug} (the game's page)  
**UTM example.** `https://techplay.gg/games/grand-theft-auto-vi?utm_source=x&utm_medium=organic-social&utm_campaign=c65-on-this-day&utm_content=f06-card`  
**Tracking.** `comment_created`, `cta_click`  
**Follow-up.** Pick only games with a TechPlay page that's worth landing on.  
**Dependencies.** D-029 (on-this-day module populated)

#### C66 — The Last Disc revival (Sony disc survey)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| PR (also Community) | T2 should | Tue 29 Sep 2026 → Thu 15 Oct 2026 | S2, S8, S10 | site (/last-disc + explainer), X, Threads, Bluesky, Facebook, Instagram, Reddit (comments), Discord, newsletter | EIC (explainer) / SC (distribution) | EIC 4 h, SC 3 h, DEV 2 h (D-029 part), DS 2 h | $0 |

**Goal.** Revive TechPlay's own campaign page while Sony's disc plans are the week's biggest player controversy: a plain 'will my discs still work?' explainer, the open letter, and a poll [R06 §6, #2, R02 §4.4].  
**KPI.** Letter signatures (from the existing form); explainer organic + Discover clicks; newsletter_signup from /last-disc.  
**TARGET.** counters render real values (or hide) by 29 Sep; explainer live 30 Sep; signatures reported 15 Oct.  
**Core message.** Sony is asking players about ending PlayStation discs. Here's what's known, and a letter you can sign.  
**Proof.** Sony's disc plans and survey reported by Push Square, Eurogamer, Kotaku, GamesRadar and GamesIndustry.biz; Wikipedia's 2026 summary gives January 2028 [R05, R06].

**Key moments.** 2026-09-29 — /last-disc counters fixed (D-029); page copy updated · 2026-09-30 — 'Will my PS5 discs still work? What Sony has said' explainer; poll (C39) · 2026-10-02 — newsletter · 2026-10-15 — update with any Sony statement; campaign review

**Exact copy (Part 33).**

- **Facebook:** Sony is asking players about ending disc production for PlayStation. We explained what's known and what it means for the discs you own, and you can sign our open letter asking Sony to keep physical games alive: [link]
- **Instagram:** Carousel: S1 'THE LAST DISC?' S2 'What Sony has said (sources)'. S3 'What happens to discs you own: what we know / what we don't'. S4 'Sign the letter: link in bio'.
- **X:** Sony is surveying players about ending PlayStation discs (Wikipedia's 2026 summary gives January 2028). What we know, what happens to the discs you own, and the open letter asking Sony to keep physical games: techplay.gg/last-disc
- **Threads:** If PlayStation stops making discs, what happens to the ones you already own? We wrote down what's actually known, and there's a letter to sign if you want physical games kept.
- **Bluesky:** Sony is asking players about the end of PlayStation discs. What's known so far, and an open letter for keeping physical games: techplay.gg/last-disc
- **Reddit angle:** In r/PS5 and r/gaming disc threads, answer 'will my discs still work' with what Sony has actually said and a source; mention the letter only where people ask how to push back (C47).
- **Discord:** #playstation: "Sony's disc survey: here's the explainer and our letter: https://techplay.gg/last-disc — vote in this week's poll too."
- **Newsletter blurb:** PlayStation discs: what Sony has said, what it means for your collection, and a letter to sign. [link]

Not used for this campaign: Facebook Groups, TikTok script, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1350:* Explainer carousel with sources. · *1080x1080:* Letter card. · *1280x720 thumbnail:* /last-disc hero is already webp; keep ≤300 KB.

**CTA.** Sign the open letter  
**Landing page.** https://techplay.gg/last-disc  
**UTM example.** `https://techplay.gg/last-disc?utm_source=x&utm_medium=organic-social&utm_campaign=c66-last-disc&utm_content=explainer-a`  
**Tracking.** `cta_click`, `newsletter_signup`, `social_share`  
**Follow-up.** Explainer updated on each Sony statement; 'physical vs digital status' per-game field is a Q1 idea [R06 #3].  
**Dependencies.** D-029, C39  
**Risks.** Keep it factual; the letter is an opinion, the explainer is not.

#### C67 — Season 2 "Overdrive" launch (site seasons)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Community (also Product) | T2 should | Mon 26 Oct 2026 → Thu 31 Dec 2026 | S10 | site, Discord, newsletter, X | SC (config, posts) / DEV (checks) | SC 3 h, DEV 2 h, DS 1 h | $0 |

**Goal.** Start the site's next season on 1 Nov (dates to be verified in admin) so XP, quests and leaderboards have a fresh start going into GTA month [R13 §1, R11 §3].  
**KPI.** Members with ≥1 quest completed in the first 14 days of the season; weekly leaderboard participants.  
**TARGET.** dates verified and season configured by 26 Oct; launch post 1 Nov; leaderboard never shows an empty state to guests.  
**Core message.** Season 2 starts today: new quests, a fresh leaderboard.  
**Proof.** Seasons, quests, ranks and leaderboards exist; Buffy mirrors XP to Discord roles [R13].

**Key moments.** 2026-10-26 — SC verifies Season 2 dates, multiplier and quests in admin (the seeded 'Summer of Gaming' season ended 21 Sep) · 2026-11-01 — launch · Season end — per admin

**Exact copy (Part 33).**

- **X:** Season 2 on TechPlay starts today: new quests, fresh leaderboard, until [end date]. XP comes from comments, reviews and the games you finish.
- **Discord:** #announcements: "Season 2 'Overdrive' starts today and runs until [end date]. New quests are on your profile; the season leaderboard starts at zero. [Multiplier line only if configured.] Your Discord role follows your rank."
- **Newsletter blurb:** Season 2 has started on TechPlay: new quests and a fresh leaderboard until [end date].

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Season 2 card (DS). · *web banner:* Leaderboard header 'Season 2: Overdrive'.

**CTA.** See this season's quests  
**Landing page.** https://techplay.gg/leaderboard  
**UTM example.** `https://techplay.gg/leaderboard?utm_source=discord&utm_medium=community&utm_campaign=c67-season-2&utm_content=launch-a`  
**Tracking.** `cta_click`, `d1_return`, `comment_created`  
**Follow-up.** Season recap in F14 Sunday wraps.  
**Dependencies.** D-029, D-035, Admin verification  
**Risks.** If the season is not configured, do not announce it.

#### C68 — Founding 100 (Founder badge extended from 50 to 100)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Product (also Community) | T2 should | Thu 1 Oct 2026 → Sat 31 Oct 2026 | S2, S10, S1 | site, Discord, newsletter, X | DEV (config) / SC (posts) | DEV 1 h, SC 2 h | $0 |

**Goal.** Give early members a concrete reason to set up a real profile now: the first 100 members with a full library get the permanent Founder badge (existing campaign:founders, limit raised to 100) [R11 §3].  
**KPI.** Founder badges awarded (cumulative); library_connected in October.  
**TARGET.** limit raised to 100 on 1 Oct; badges awarded daily by the existing 10:00 job; count reported weekly (internal only).  
**Core message.** Be one of the first 100 members with a full library and keep the Founder badge for good.  
**Proof.** The command awards the Founder badge to the first N users with at least 5 games in their collection; a linked library passes that line on import.

**Key moments.** 2026-10-01 — run with --limit=100; announcement · Daily 10:00 — awards · 2026-10-31 — campaign closes or continues until 100 are awarded

**Delivery status (32-DEVELOPMENT-BACKLOG).** On time (D-050).

**Acceptance criteria.**
- [ ] Scheduler runs campaign:founders --limit=100.
- [ ] Copy states the real rule (5 games in the collection) and does not state how many badges remain unless read live.
- [ ] Badge visible on profile and next to comments.

**Exact copy (Part 33).**

- **X:** The first 100 TechPlay members with at least five games in their library get the Founder badge, permanently. Link Steam and you're there in one click: techplay.gg/register
- **Discord:** #announcements: "Founder badge: the first 100 members with 5+ games on their shelf get it for good. Link a platform and it's automatic; I'll announce each new Founder here."
- **Newsletter blurb:** Founder badge: the first 100 members with five or more games on their shelf keep it permanently. [link]

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1080x1080:* Founder badge card.

**CTA.** Start your library  
**Landing page.** https://techplay.gg/register?from=c68  
**UTM example.** `https://techplay.gg/register?from=c68&utm_source=discord&utm_medium=community&utm_campaign=c68-founding-100&utm_content=announce-a`  
**Tracking.** `registration_complete`, `library_connected`, `shelf_add`  
**Follow-up.** When 100 are awarded, announce it and close; never re-open.  
**Dependencies.** C44, Spine A2 activation rule (≥3 items or a linked platform) differs from the badge rule (≥5 games); copy uses the badge rule

### C69–C71: Steam Curator, Q1 bridge, developer outreach

#### C69 — Steam Curator page launch

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Partnership (also Social) | T2 should | Mon 12 Oct 2026 → Thu 31 Dec 2026 | S3, S1, S7 | Steam Curator, X, Discord, newsletter | ED | ED 4 h setup + 0.5 h/week | $0 |

**Goal.** Put TechPlay's Verdicts and Hidden Gems on Steam store pages through a curator page, and use Curator Connect to receive review copies [R07 §3.8, R15 exec 2].  
**KPI.** Curator followers (from Steam); review copies received via Curator Connect; clicks from curator links (utm_source=steam).  
**TARGET.** live 20 Oct with ≥15 recommendations; Curator Connect enabled; ≥3 keys received by 31 Dec.  
**Core message.** TechPlay on Steam: recommendations from our Verdicts and hidden gems.  
**Proof.** Steam Curator Connect sends review copies to curators; Steam users follow curators to see recommendations on store pages [R15].

**Key moments.** 2026-10-12 — curator page created, description written · 2026-10-20 — launch with 15 recommendations (Verdicts + Hidden Gems) · Weekly — add each new Verdict and gem

**Exact copy (Part 33).**

- **X:** TechPlay now has a Steam Curator page: our Verdicts and hidden gems, shown on the store pages of the games themselves. Follow if you want our take while you browse Steam.
- **Discord:** #announcements: "We're on Steam as a curator now. Follow the TechPlay curator and our recommendations show up on store pages."
- **Newsletter blurb:** We're a Steam Curator now: follow us and our Verdicts appear on Steam store pages. [link]

*Curator description*
> TechPlay.gg — gaming, on the record. Verdicts from our editors within a week of release, and hidden gems from a database of 333,000+ games. Every recommendation links to the full text.  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Push text, Ad copy.

**Creative.** *1280x720 thumbnail:* Curator header (Steam spec to be checked).

**CTA.** Follow on Steam  
**Landing page.** Steam Curator page (URL on creation); recommendations link to https://techplay.gg/reviews  
**UTM example.** `https://techplay.gg/reviews?utm_source=steam&utm_medium=referral&utm_campaign=c69-steam-curator&utm_content=recommendation`  
**Tracking.** `cta_click`  
**Follow-up.** Answer Curator Connect offers within 48 h; decline ones we can't review in two weeks.  
**Dependencies.** C52, C64

#### C70 — 2027 Most Anticipated + Q1 bridge

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| SEO (also Social / Email) | T2 should | Mon 21 Dec 2026 → Thu 31 Dec 2026 | S1, S2, S4, S6 | site, Instagram carousel, Facebook, X, Threads, Bluesky, TikTok/Shorts, Discord, newsletter | ED (list) / SC (social) | ED 6 h, SC 3 h, DS 3 h | $0 |

**Goal.** Close the year with a 2027 most-anticipated list and a Q1 calendar that sets up reminders for Fable, FF7 Revelation and the rest, so January starts with members' reminders already set [R05 §2-3].  
**KPI.** reminder_set on 2027 games from the list; organic clicks in January.  
**TARGET.** list live 21 Dec; reminders on listed games UP in 21 Dec–10 Jan vs 1–20 Dec.  
**Core message.** 2027, by date: what's coming, on which platforms, and a reminder for each.  
**Proof.** Jan: FFXIV Evercold, Stranger Than Heaven (15 Jan), Metroid Ravenous and Until Dawn 2 (28 Jan). Feb: Metro 2039 (4 Feb), Tomb Raider: Legacy of Atlantis (12 Feb), God of War Laufey (16 Feb), Persona 4 Revival (18 Feb), Next Fest (22 Feb), Fable (23 Feb). Mar: Wo Long 2 (4 Mar), Spring Sale (18–25 Mar). Apr: FF7 Revelation (8 Apr). Later: Pokémon Winds & Waves, Kingdom Hearts IV, WoW: The Last Titan [R05].

**Key moments.** 2026-12-21 — '2027's most anticipated games, by date' · 2026-12-28 — Out This Week becomes 'Out in January 2027' · 2026-12-31 — newsletter year-end + 2027 calendar

**Exact copy (Part 33).**

- **Facebook:** The first four months of 2027 are busy: Metroid Ravenous, Metro 2039, God of War Laufey, Persona 4 Revival, Fable on 23 Feb and Final Fantasy VII Revelation on 8 April. All dated, all with reminders: [link]
- **Instagram:** Carousel: '2027, BY DATE' — Jan: Stranger Than Heaven (15), Metroid Ravenous + Until Dawn 2 (28). Feb: Metro 2039 (4), Tomb Raider (12), God of War Laufey (16), Persona 4 Revival (18), Fable (23). Apr: FF7 Revelation (8). Caption: Reminders for all of them on the calendar.
- **TikTok script:** 25 s: '2027 in 25 seconds': month cards with covers; end card calendar link.
- **X:** 2027 by date: Metroid Ravenous (28 Jan), Metro 2039 (4 Feb), God of War Laufey (16 Feb), Persona 4 Revival (18 Feb), Fable (23 Feb), FF7 Revelation (8 Apr). Reminders for each: [link]
- **Threads:** Which 2027 game are you most sure you'll buy on day one? Fable and FF7 Revelation are the obvious ones, but February alone has five.
- **Bluesky:** 2027's dated games so far, with reminders: [link]
- **Discord:** #announcements: "2027 calendar is up. Set reminders now and I'll DM you on each release day: [link]"
- **Shorts/Reels script:** 25 s: Jan / Feb / Mar / Apr cards, 5 s each, covers + dates; end card 'Reminders: techplay.gg/calendar'.
- **Newsletter blurb:** Last issue of 2026: the year in our data, your community awards, and 2027 by date with reminders. [link]

Not used for this campaign: Facebook Groups, Reddit angle, YouTube, Push text, Ad copy.

**Creative.** *1080x1350:* 2027 carousel. · *1080x1920:* Short-video frames. · *1280x720 thumbnail:* List OG.

**CTA.** Set reminders for 2027  
**Landing page.** https://techplay.gg/news/most-anticipated-games-2027 (article on /news) + https://techplay.gg/calendar  
**UTM example.** `https://techplay.gg/calendar?utm_source=instagram&utm_medium=organic-social&utm_campaign=c70-2027-anticipated&utm_content=carousel-a`  
**Tracking.** `reminder_set`, `shelf_add`, `cta_click`  
**Follow-up.** Q1 plan: F09 pages for Fable/FF7 already live (C63); hubs for Fable and FF7 Revelation decided in January [R18].  
**Dependencies.** C63, C43

#### C71 — Studio/indie Next Fest outreach (partnership)

| Type | Tier | Dates | Audience | Channels | Owner | Effort (ESTIMATE) | Budget |
|---|---|---|---|---|---|---|---|
| Partnership (also Creator) | T2 should | Mon 5 Oct 2026 → Tue 20 Oct 2026 | S9, S3, S10 | email, X DMs, Discord Stage | EIC (regional) / ED (international) | EIC 4 h, ED 4 h, SC 2 h (AMA) | $0 |

**Goal.** Contact developers with demos in October Next Fest before the fest (press preview 8 Oct), offering a Next Fest Diary slot, a Discord AMA, and a game-page check; in return, keys, access and links [R15 §3 #18, R14 #38].  
**KPI.** Developers replied; AMAs held; demos covered from outreach; links from developer pages/press kits.  
**TARGET.** 30 emails by 16 Oct; ≥5 replies; ≥1 Discord AMA during the fest; regional studios prioritised.  
**Core message.** We'll play your demo during Next Fest and tell our readers what we think.  
**Proof.** Next Fest 19–26 Oct; TechPlay's diary covers three demos a day with release reminders [R05, C18].

**Key moments.** 2026-10-05 — list from Steam's Next Fest pages and press-preview materials; Balkan studios first · 2026-10-08 — press preview · 2026-10-09 to 16 — emails · 2026-10-19 to 26 — fest (C18)

**Exact copy (Part 33).**

- **X:** DM template: "Hi — I edit TechPlay. We're playing three Next Fest demos a day (19–26 Oct) and would like to include [Game]. Any chance of a quick Discord Q&A during the fest? Details: [email]"
- **Discord:** #ama event: "[Developer] from [Studio] answers questions about [Game] on [day] at [time CET]. Demo is on Steam during Next Fest."

*Email (EIC or ED)*
> Subject: [Game] in TechPlay's Next Fest diary  
>
> Hi [Name],  
>
> I'm [Name] at TechPlay, a gaming publication based in Sarajevo. During Next Fest (19–26 Oct) we're playing three demos a day and writing a short, honest take on each, with a reminder button for readers who want to know when the game releases.  
>
> We'd like to include [Game]. Two optional extras: a 30-minute Q&A in our Discord during the fest, and a check of your game's page on TechPlay ([link]) so the details are right.  
>
> No cost, no conditions on what we write. Our press page: techplay.gg/press  
>
> [Name]  

Not used for this campaign: Facebook, Facebook Groups, Instagram, TikTok script, Threads, Bluesky, Reddit angle, YouTube, Shorts/Reels script, Newsletter blurb, Push text, Ad copy.

**Creative.** *1080x1080:* AMA poster template.

**CTA.** Reply to set up coverage / AMA  
**Landing page.** https://techplay.gg/guides/steam-next-fest-october-2026-demo-tracker  
**UTM example.** `https://techplay.gg/guides/steam-next-fest-october-2026-demo-tracker?utm_source=partner-studio&utm_medium=partner&utm_campaign=c71-next-fest-outreach&utm_content=dev-link`  
**Tracking.** `cta_click`, `discord_join`, `reminder_set`  
**Follow-up.** Keep the contact list for February Next Fest (22 Feb 2027) and C55.  
**Dependencies.** C18, C54, C55

## Dependencies and open questions

### Conflicts with the spine or between campaigns

1. **DEV capacity versus spine dates.** Summed from the effort lines, one-off DEV work for campaigns starting in October is about 257 h and in November about 139 h, against roughly 100 h and 80 h of DEV time (ESTIMATE). `32-DEVELOPMENT-BACKLOG.md` resolves this independently by moving D-015 (Steam sign-in), D-032 (hubs), D-010 (article-end block), D-011 (invite attribution), D-019 (push), D-031 (Meta Pixel) and D-026 (prediction league) to 2027, and by re-dating C41–C46, C54 and C31. This library keeps the spine dates in each record and adds the delivery status and interim from 32; EIC should confirm 32's plan on 28 Sep or add DEV hours.
2. **C43 vs D-027.** The spine puts "release-day & price alerts" live on 19 Oct. Price alerts depend on D-027 (M). This library ships release-day alerts on 19 Oct and price alerts by 20 Nov (C31). If D-027 lands earlier, C31 simply starts earlier.
3. **C56/C57 timing: 26 and 32 disagree.** `26-PAID-MEDIA.md` budgets C56 from 19 Oct and C57 from 2 Nov; `32-DEVELOPMENT-BACKLOG.md` puts the earliest C56 start at 2 Nov (D-007/D-008) and, by default (Option A), drops C57 for 2026 because D-031 cannot ship by 19 Oct without displacing P0 work. Decision due 5 Oct (EIC). Budgets here follow 26; if Option A holds, LEAN Q4 spend falls to about $188.
4. **C57 wave 2 creative.** The spine runs C57 on 1–14 Dec; the Year in Review (C28) is not live until 14 Dec, so wave 2 continues the C57a library creative (or C57c newsletter as fallback, per 26 §5.1) rather than a Year in Review ad.
5. **C68 activation rule.** The Founder badge command awards on "≥5 games in the collection"; the spine's A2 activation is "linked platform OR ≥3 shelf items". The public copy uses the badge rule; reports use A2.
6. **C09 giveaway existence.** The README (7 Sep) lists 2 giveaways; the live /giveaways page on 27 Sep showed none active; JoinPrompt's comment says the GTA 6 draw closes 20 Oct [R02, R11]. Nothing in C09 is posted until SC and EIC confirm the prize, rules and end time in the admin on 28 Sep.
7. **C67 Season 2 dates.** The season seeder only contains "Summer of Gaming 2026" (20 Jun–21 Sep, 1.25× multipliers). Season 2 "Overdrive" is named in the research but its dates and multiplier are not in the repository. No announcement until the admin shows a configured season.

### Decisions needed (owner, by when)

- **D-020 map provenance (EIC, by 16 Oct):** permission/attribution from gtadb.org or a rebuilt location set. Blocks the C06 Day 42 card wording, C11 and C58 Ad 1.
- **IGDB licence position (EIC, by 9 Nov):** decides C25's hours data and whether C21 can publish IGDB-derived studio fields as a free CSV [R10, R14 §6].
- **Steam Web API terms (DEV, by 16 Nov):** read before C26 pulls achievement percentages for 500 games [R14 gaps].
- **Paid gate (EIC, 16 Oct):** C03 acceptance criteria met, or C56–C58 wait.
- **Public correction posts in C01 (EIC, by 2 Oct):** corrections-log entry only, or also the Discord/X/Bluesky notes.
- **Review budget (EIC):** whether Verdicts (C52) can rely on bought copies when no code arrives; amount UNKNOWN.

### Facts that are not confirmed and must be re-checked before posting

- WoW patch 12.1.5 (~6 Oct) is a cadence prediction; WoW: Forever (4 Nov) is reported, not publisher-confirmed [R05].
- Ghost of Yōtei Complete Edition (1 Oct), Dragon's Dogma 2: Dark Arisen's Switch 2 version (9 Oct) and Path of Exile 2 1.0 (11 Dec) are reported dates; copy marks them "(reported)".
- GTA 6 unlock and pre-load times are not announced; C08 shows "not announced yet" until they are. 30 fps at launch is reported only; GTA Online in 2027 is rumour [R17].
- The Game Awards nominee date is unknown; C29 opens when nominees are public (18 Nov planned).
- Steam Awards voting during the Winter Sale is inferred from past years [R13]; C34 checks Valve's announcement first.
- Discord Discovery (1,000 members) and Server Insights (500) thresholds come from Discord's help centre; Onboarding and Discovery docs were partly blocked [R07, R13].

### Channels that do not exist yet

- TikTok: no account found (C49 creates one on 1 Oct). Bluesky: no account (create before the first Bluesky post in C02/C20). Threads, LinkedIn: existence unverified. YouTube: 20 subscribers, no videos (C49/C50). Facebook and Instagram exist; follower counts unknown [R02 §8.2]. None of these numbers appears in public copy.
- Platform rules for TikTok, YouTube Shorts, Instagram Reels and publisher video-content policies (Rockstar, Nintendo, Blizzard) were not researched; SC reads them before C49's first upload [R19 §6].
- Subreddit self-promotion rules were blocked during research; C47 and C48 log each subreddit's rules before the first comment or post [R07 §3.7].

### Measurement gaps that change how targets are read

- No baselines exist for registrations by source, activation, newsletter list size, Discord retention or Search Console clicks by page [RESEARCH-COMPLETE]. Every "UP vs baseline" target starts with a baseline week measured through C03.
- EEA consent is denied by default until the CMP records a yes; platform-pixel results are US-first by construction, and the first-party collector (with utm columns from D-008) is the source of truth for EEA [R16 §2.14b].
- Referring domains for PR campaigns (C20–C27) are logged by hand until a backlink tool exists; no baseline of TechPlay's referring domains was available [R14 gaps].
- Newsletter deliverability: sending is self-hosted with no Gmail reputation; DNS, SPF, DKIM, DMARC and SMTP changes need explicit approval [R20 §4].

### Inputs to other strategy files

- The week table above is the campaign layer of the master calendar; franchise slots (F01–F24) and news are scheduled elsewhere.
- Dev items referenced here: D-001–D-020, D-023–D-032, D-035, D-038–D-040. Items this library assumes but the spine does not list: a public wishlist/gift-list link (C33), a studio-corrections form (C21) and the Next Fest participant capture (C18); check them against 32's D-041–D-062 before building (Buffy's on-this-day automation is 32's D-049).
- Paid sub-lines (C56a/b, C57a–f, C58a–c) are defined in `26-PAID-MEDIA.md`; giveaway sub-campaigns (C31a, C33a, C71a) in `25-GIVEAWAYS.md`.
