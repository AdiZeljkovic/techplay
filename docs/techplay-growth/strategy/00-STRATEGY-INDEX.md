# 00 — Strategy Index

Status: Phase 2 plan — 27 Sep 2026
Scope: the executable growth and marketing plan for TechPlay.gg, Mon 28 Sep 2026 to Thu 31 Dec 2026, with Q1 2027 continuity. Built from the Phase 1 research in `../research/` (cited as [R00]–[R23]).

## Start here

1. **STRATEGY-COMPLETE.md**: what to do tomorrow, this week, and what must be decided.
2. **01-GROWTH-STRATEGY.md**: why the plan looks the way it does.
3. **calendar-2026-MM.csv** (or calendar.json): what TechPlay posts, publishes and ships on any date. Every date from 28 Sep to 31 Dec has a row.
4. **28-CAMPAIGN-LIBRARY.md**: the copy and creative for each campaign named in the calendar.
5. **32-DEVELOPMENT-BACKLOG.md**: what DEV builds, in which week.

## Which file wins when two disagree

| Topic | Canonical source | Why |
|---|---|---|
| Dates for anything that needs DEV | 32-DEVELOPMENT-BACKLOG (sprint plan and "What slips") | It is the only file that adds DEV hours up against 20 h/week. The calendar follows it |
| Social/Community hours per channel | 04-CHANNEL-STRATEGY §2 "Weekly hours budget" | Per-network files (06, 07, 11, 12, 17) describe full effort; 04 is what fits 25 h. Discord and email win a clash |
| KPI definitions and TARGETS | kpis.json / 30-ANALYTICS | One set of numbers; 01, 03 and 16 were reconciled to it on 27 Sep |
| GTA VI countdown posts | 19-GTA6 §6.2 | Each post has a source, a gate and a fallback; the calendar reads it directly |
| Campaign copy | 28-CAMPAIGN-LIBRARY / campaigns.json | Other files carry examples; the library carries the approved copy |
| IDs (C, D, F, S, P) | Spine IDs as used in 01 and 28; sub-IDs as registered in 32 "Children and aliases" | Several files invented sub-IDs in parallel; 32 lists the resolved ones |

## Files

| File | Lines | What it holds |
|---|---|---|
| [01-GROWTH-STRATEGY.md](01-GROWTH-STRATEGY.md) | 265 | The strategy: situation, positioning, North Star (WRM), seven bets, what we won't do, editorial mix, phases and monthly objectives, weekly rhythm, capacity, risks |
| [02-AUDIENCES.md](02-AUDIENCES.md) | 466 | Segments S1–S10: needs, real search patterns, channels, landing pages, triggers, exact CTAs; Q4 priority order; message matrix |
| [03-FUNNEL.md](03-FUNNEL.md) | 426 | Discovery → advocacy with A1–A4 activation; friction, CTA copy, events and KPI formula per stage; biggest leak per stage |
| [04-CHANNEL-STRATEGY.md](04-CHANNEL-STRATEGY.md) | 614 | 43 channels with role, priority class, audience, formats, frequency, voice, CTA, metric, workflow and don'ts; weekly hours budget (canonical for SC hours) |
| [05-SOCIAL-MEDIA.md](05-SOCIAL-MEDIA.md) | 676 | Social operating system: pipeline, templates, approvals, SLAs, crisis protocol, all 24 franchises with a written example, posting-time grid |
| [06-FACEBOOK.md](06-FACEBOOK.md) | 662 | Page and Groups playbook (experimental): 13 templates with two filled examples each, 30-day Groups ladder, cadence, KPIs |
| [07-INSTAGRAM.md](07-INSTAGRAM.md) | 642 | Carousels slide by slide, Stories (GTA countdown, polls), Reels scripts, captions, bio links, launch-week and TGA plans |
| [08-TIKTOK.md](08-TIKTOK.md) | 427 | Presenter-free TikTok: 11 formats with timed scripts, 12-week plan, production workflow, rights rules, keep/kill rule |
| [09-YOUTUBE.md](09-YOUTUBE.md) | 624 | 13 shows, 48 video ideas, both long-form pilots scripted, thumbnails/titles/descriptions, Community tab, setup checklist, policy checks |
| [10-X-THREADS-BLUESKY.md](10-X-THREADS-BLUESKY.md) | 295 | A distinct job per network, 45 written posts, live-event playbook, journalist/developer list method, reply rules |
| [11-REDDIT.md](11-REDDIT.md) | 612 | 90-day reputation plan: rules checklist, accounts, 18 subreddit roles, answer bank, full data-post and tool-post drafts, 13-week calendar, red lines |
| [12-DISCORD.md](12-DISCORD.md) | 772 | Discord OS: channels, roles, onboarding, rituals, Buffy voice, moderation, daily/weekly/monthly timetables, Road to 500 |
| [13-SEO-CONTENT.md](13-SEO-CONTENT.md) | 603 | Indexable-set decision (D-021), plumbing fixes, 124 query→page mappings, programmatic templates, hubs, editorial mix and grid, title rewrites |
| [14-DISCOVER-NEWS.md](14-DISCOVER-NEWS.md) | 365 | Separate Discover and Google News strategies: headline patterns, 20 example headlines, image/freshness rules, author identity, daily checklist |
| [15-REGISTRATION.md](15-REGISTRATION.md) | 451 | 36 registration mechanisms with copy, tests and events; rewritten /register, verify and login pages; rollout |
| [16-ACTIVATION-RETENTION.md](16-ACTIVATION-RETENTION.md) | 457 | First 60 s / 5 min / day / week screen by screen; 28 retention loops with ethics checks; WRM and D1/D7/D30 SQL |
| [17-NEWSLETTER-EMAIL.md](17-NEWSLETTER-EMAIL.md) | 694 | The Save File, personalised releases email, GTA briefing; 37 subject lines; issue #1 and GTA launch edition in full; 12 lifecycle sequences; deliverability |
| [18-VIDEO.md](18-VIDEO.md) | 714 | Article → social → carousel → vertical → X → Discord → newsletter → Reddit workflow with three fully worked examples |
| [19-GTA6.md](19-GTA6.md) | 590 | GTA VI master campaign: fix, build, 53-post gated countdown, 40-query map, hour-by-hour launch plan, per-channel copy, post-launch |
| [20-GAME-HUBS.md](20-GAME-HUBS.md) | 452 | MMO, Steam, Switch 2 hubs, MW4 mini-hub, Fable/FF7 prep, Deadlock watch: pages, titles, cadence, promotion |
| [21-GAMING-TOOLS.md](21-GAMING-TOOLS.md) | 434 | 55 tool ideas scored on 8 criteria; NOW / NEXT / LATER roadmap; one-page specs for NOW and NEXT |
| [22-DIGITAL-PR.md](22-DIGITAL-PR.md) | 951 | 32 data-led PR campaigns with method, targets, hooks and dates; top 10 pitch emails; methodology standard; press-list process |
| [23-CREATORS.md](23-CREATORS.md) | 378 | Creator programme: tiers, 12 low-budget formats, qualification, disclosure, 12-week calendar, 10 outreach templates |
| [24-PARTNERSHIPS.md](24-PARTNERSHIPS.md) | 452 | 10 partner types, what we offer and ask, 14 outreach messages with follow-ups, /press spec, CRM layout |
| [25-GIVEAWAYS.md](25-GIVEAWAYS.md) | 409 | Giveaways as funnels: activation-weighted points, Meta-safe tasks, Q4 calendar, rules template, three full giveaways, fraud checks |
| [26-PAID-MEDIA.md](26-PAID-MEDIA.md) | 461 | Launch gates, 13 campaigns with every field, LEAN/GROWTH/AGGRESSIVE monthly allocations, what not to buy |
| [27-RETARGETING.md](27-RETARGETING.md) | 409 | 13 audiences with rules, windows, consent, copy, caps and exclusions; owned-channel equivalents that need no pixel |
| [28-CAMPAIGN-LIBRARY.md](28-CAMPAIGN-LIBRARY.md) | 3288 | All 71 campaigns (C01–C71) with goal, KPI, audience, dates, per-channel copy, creative, UTM, owner, budget, events, dependencies |
| [29-CREATIVE-BRIEFS.md](29-CREATIVE-BRIEFS.md) | 729 | Brand tokens from the codebase, safe zones for every size, F01–F24 templates, 21 campaign briefs, production checklist |
| [30-ANALYTICS.md](30-ANALYTICS.md) | 684 | 27 KPIs with baselines/queries and TARGETS, measurement constraints, 27 events mapped to code, UTM validator, dashboard, Monday review |
| [31-EXPERIMENTS.md](31-EXPERIMENTS.md) | 776 | 96 experiments with hypothesis, metric, threshold and design suited to low traffic |
| [32-DEVELOPMENT-BACKLOG.md](32-DEVELOPMENT-BACKLOG.md) | 864 | 67 items + 28 children with files, acceptance criteria, effort; DEV sprint plan W40–W53; what slips and the no-DEV interim (canonical for dates) |
| [33-QUICK-WINS.md](33-QUICK-WINS.md) | 375 | Next 24 h / 3 / 7 / 14 / 30 days with owner, exact action and done-when; Stop Doing list |
| [34-2027-BRIDGE.md](34-2027-BRIDGE.md) | 305 | What to start recording now, Q1 2027 launches and objectives, decision rules for 1 Jan |
| [calendar-2026-09.csv](calendar-2026-09.csv) | 4 | Daily plan 28–30 Sep (41 fields per day) |
| [calendar-2026-10.csv](calendar-2026-10.csv) | 32 | Daily plan October |
| [calendar-2026-11.csv](calendar-2026-11.csv) | 31 | Daily plan November |
| [calendar-2026-12.csv](calendar-2026-12.csv) | 32 | Daily plan December |
| [calendar.json](calendar.json) | 4135 | All 95 days in one file |
| [campaigns.json](campaigns.json) | 6312 | Campaign library as data |
| [campaign-library.csv](campaign-library.csv) | 280 | Campaign library as a sheet |
| [experiments.json](experiments.json) | 1916 | Experiments as data |
| [experiments.csv](experiments.csv) | 97 | Experiments as a sheet |
| [kpis.json](kpis.json) | 639 | KPI definitions, baselines and TARGETS |
| [channels.json](channels.json) | 1091 | 43 channels as data |
| [development-backlog.json](development-backlog.json) | 2664 | Dev backlog as data |
| [development-backlog.csv](development-backlog.csv) | 96 | Dev backlog as a sheet |
| [STRATEGY-COMPLETE.md](STRATEGY-COMPLETE.md) | 199 | Top priorities, tomorrow's actions, next 7 days, first campaigns, first dev work, KPIs, opportunities, risks, decisions needed |

## Conventions

- **Owners:** EIC Founder/Editor-in-Chief · ED Journalist/Editor · SC Social/Community · DS Designer · DEV Developer.
- **IDs:** S1–S10 segments · P1–P5 pillars · F01–F24 franchises · C01–C71 campaigns · D-001+ dev items · X-001+ experiments · K00+ KPIs.
- **Labels:** TARGET is a goal we set. ESTIMATE is our forecast. Neither is a promise. Unknown numbers stay as `[N]` until a query fills them on the day.
- **UTM:** `utm_source` = platform, `utm_medium` = organic-social | community | email | push | paid-social | cpc | referral | pr | creator | partner | qr, `utm_campaign` = `<cid>-<slug>`, `utm_content` = `<franchise/asset>-<variant>` (30-ANALYTICS has the validator).
- **Discord link everywhere on the site:** https://discord.gg/wPQG9gUMXH. Campaign invite codes appear only in campaign posts.

## Dependencies and open questions

The decisions that block parts of this plan are listed once, with owners and dates, in STRATEGY-COMPLETE.md §8.
