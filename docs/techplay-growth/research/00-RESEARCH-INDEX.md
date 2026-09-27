# 00 — TechPlay Growth Research: Index

Status: Phase 1 research — 27 Sep 2026
Purpose: the factual and strategic foundation for a later session that will write TechPlay's marketing strategy and campaign calendar. **This folder contains no marketing plan and no calendar of posts.** No production code was changed.

## Start here

1. `RESEARCH-COMPLETE.md` — the summary: key discoveries, opportunities, threats, underused assets, data gaps, file list.
2. `23-CRITICAL-FINDINGS.md` — what is broken, what caps growth, what the advantages are.
3. `21-MASTER-OPPORTUNITY-MATRIX.md` — 291 scored opportunities.

## Labels used in every file

**FACT** — verified in the repository or on a page fetched on 27 Sep 2026. **OBSERVATION** — seen but not measured. **ESTIMATE** — a reasoned approximation with its basis. **HYPOTHESIS** — untested. **RECOMMENDATION** — a suggested action for the planning phase. **UNVERIFIED / UNKNOWN** — could not be checked. No traffic, ranking, search-volume or conversion number was invented; production numbers come from `docs/README.md` (measured 7 Sep 2026).

## Files

| File | Brief part | What it answers | How it was produced |
|---|---|---|---|
| `01-TECHPLAY-PRODUCT-AUDIT.md` | 1 | What TechPlay actually is: routes, 305 API endpoints, gamification, notifications, database, capability maps | Two repository audits (frontend, backend + Discord bot), merged |
| `02-TECHPLAY-PUBLIC-PRESENCE.md` | 2 | The live site and social accounts: messaging, CTAs, trust, errors, scorecard | Live-site audit of ~95 pages |
| `03-SEARCH-INTELLIGENCE.md` | 3 | Index footprint, brand and non-brand visibility, News, Discover, thin-page problem | Assembled from saved Bing and Google News results and the README |
| `04-COMPETITOR-INTELLIGENCE.md` | 4 | 21 named publishers plus ~40 databases, trackers and new outlets; acquisition matrix | Part A assembled from fetched pages; Parts B and C by research agents (C partly) |
| `05-GAMING-MARKET-2026-2027.md` | 5, 11 | Release and event calendar to Q1 2027, 2027 opportunities, ecosystem scores, opportunity calendar | Assembled from the market agent's 65 sourced calendar rows and ~130-source log |
| `06-TREND-INTELLIGENCE.md` | 6 | This week's stories, questions, formats, controversies; 32 trend-to-action rows | Analysis of 685 headlines from 20 outlets, 772 Reddit titles, Steam charts |
| `07-SOCIAL-CHANNEL-INTELLIGENCE.md` | 7, 8 | Role and priority class for every channel; verified platform rules | Assembled from fetched platform documentation |
| `08-CONTENT-INTELLIGENCE.md` | 9 | Which content types bring traffic, links, accounts, returns; TechPlay's current output | Assembled from fetched TechPlay articles, competitor templates, Google posts |
| `09-EVERGREEN-OPPORTUNITIES.md` | 10 | 294 evergreen query concepts with competition and fit | Two research agents' tables |
| `10-PRODUCT-LED-GROWTH.md` | 12 | The tools landscape and 55 TechPlay tool ideas | Assembled from ~55 tool pages and the repo |
| `11-REGISTRATION-INTELLIGENCE.md` | 13 | Why people sign up; TechPlay's friction; 35-row account conversion map | Research agent |
| `12-RETENTION-INTELLIGENCE.md` | 14 | Loops that bring people back; fit and ethics; metrics | Assembled |
| `13-COMMUNITY-INTELLIGENCE.md` | 15, 16 | Discord, Reddit, forums, creator communities; 27 rituals; Professor Buffy | Assembled from the community agent's 71-source log and the repo |
| `14-DIGITAL-PR.md` | 17 | How gaming sites earn links; 60 data campaign ideas | Research agent |
| `15-CREATORS-PARTNERSHIPS.md` | 18, 19 | Creator formats, partnership matrix, prerequisites | Assembled from the PR agent's fetched pages |
| `16-PAID-MEDIA-INTELLIGENCE.md` | 20 | Channel-by-objective fit, benchmarks, budgets, 15 test cards | Research agent |
| `17-GTA6-INTELLIGENCE.md` | 21 | Hub audit, confirmed vs rumoured, 40 queries, tools, launch plan candidates | Assembled from the GTA 6 agent's saved pages |
| `18-GAME-HUB-OPPORTUNITIES.md` | 22 | 37 hub candidates scored; top 10 and blueprints | Assembled from verified market data (hub agent produced nothing) |
| `19-VIDEO-INTELLIGENCE.md` | 23 | 22 video formats, pipelines, minimum stack; open policy questions | Assembled from captured YouTube results; platform policies not researched |
| `20-NEWSLETTER-INTELLIGENCE.md` | 24, 25 | Newsletter products, capture, deliverability; monetisation side effects | Assembled |
| `21-MASTER-OPPORTUNITY-MATRIX.md` | 27 | 291 opportunities on 12 dimensions | Generated from files 09–18 plus hand-scored fixes |
| `22-SOURCES.md` | 28 | How the source log was built; key primary sources | Generated |
| `23-CRITICAL-FINDINGS.md` | 26, 30 | The findings that change priorities | Synthesis |
| `RESEARCH-COMPLETE.md` | — | Completion summary | Synthesis |

SWOT (Part 26) is covered by `23-CRITICAL-FINDINGS.md` (sections A–D) and by `RESEARCH-COMPLETE.md`.

## Machine-readable files

| File | Rows | Contents |
|---|---|---|
| `opportunities.json` | 291 + 66 calendar | Master matrix scores and the opportunity calendar |
| `evergreen-opportunities.csv` | 294 | Evergreen concepts |
| `game-opportunities.csv` | 37 | Hub candidates with scores and sources |
| `competitor-matrix.csv` | 42 | Competitor acquisition matrix |
| `social-channel-matrix.csv` | 26 | Channel classification and platform notes |
| `research-sources.csv` | 1,315 | Every URL used, with claim and file |

## How this research was done, and its limits

- Twenty research agents worked in parallel on 27 Sep 2026. The session's shared web-search quota ran out partway through, after which agents fetched known pages directly.
- The research phase was stopped by the user before most agents had written their files. Seven files were written by agents (01 parts, 02, 04 Parts B and C, 09 tables, 11, 14, 16). The rest were assembled from the pages those agents had already fetched and saved, with no further searching. Each file says how it was produced.
- Many sites block automated fetching (Cloudflare challenges, JavaScript-only pages). Those are listed in each file's gaps; nothing is claimed from them.
- There was no access to Search Console, GA, the production database or any social account's analytics.
