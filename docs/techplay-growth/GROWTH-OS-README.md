# TechPlay Growth OS

Status: Phase 3 — built 27 Sep 2026
Location: `growth-os/` (repository root, next to `frontend/`, `backend/`, `discord/`)

Growth OS is the internal command center for executing the TechPlay growth plan. It turns the Phase 2 strategy (`docs/techplay-growth/strategy/`) and the Phase 1 research (`docs/techplay-growth/research/`) into one working application. Open it in the morning and it shows today's work, with the exact copy for every channel, one click to copy and one click to mark done.

It is not part of techplay.gg. It is not deployed, it does not call the production API or database, and nothing in the public site changed to build it.

---

## 1. How to run

Requirements: Node 20+ (tested on Node 22) and npm.

```bash
cd growth-os
npm install
npm run dev            # syncs the strategy data, then serves http://127.0.0.1:3100
```

Production mode on the same machine:

```bash
npm run build          # syncs data, type-checks, builds
npm start              # http://127.0.0.1:3100
```

| Command | What it does |
|---|---|
| `npm run sync-data` | Re-reads `docs/techplay-growth` into `data/generated/` |
| `npm run dev` | Sync + dev server on 127.0.0.1:3100 |
| `npm run build` / `npm start` | Sync + production build / serve on 127.0.0.1:3100 |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest: parsers, UTM rules (incl. every worked example in 30-ANALYTICS §7.4), state reducer, file store, date logic, data integrity |
| `npm run e2e` | Browser smoke test (47 checks) against a running server; start the server with `GROWTH_OS_STATE_FILE=/tmp/gos-smoke.json` so the test never touches real state |

### Access and privacy

- `npm run dev` and `npm start` bind to `127.0.0.1` only.
- `proxy.ts` enforces HTTP Basic auth whenever `GROWTH_OS_USER` and `GROWTH_OS_PASSWORD` are set. In production mode without them it answers only on localhost (503 otherwise). `GROWTH_OS_ALLOW_OPEN=1` overrides that; do not use it on a public host.
- Every response carries `X-Robots-Tag: noindex`, `Cache-Control: private, no-store`, `X-Frame-Options: DENY` and `Referrer-Policy: no-referrer`.
- Working state lives in `growth-os/data/state/` (git-ignored). `.env*` is git-ignored; `.env.example` lists every variable with no values.

---

## 2. What was built

### Screens

| Screen | What it answers |
|---|---|
| **Overview** | Today's goal, the open items that matter most, critical deadlines for the next 7 days, active campaigns, KPIs with sparklines, upcoming launches (3 weeks), quick wins, top opportunities, progress for the day, week and month, days left in 2026 |
| **Today** | Every plan item for the day, grouped by area (operations, publish/SEO, social, video, community, email, outreach, paid). Each item shows what to do, the exact copy with COPY, owner, priority, status, links, campaign and creative-brief links, plus CTA, landing page and KPI. A side panel shows email sends, due tasks, industry moments, PR and video due that day. Filters: area, hide done, only items with copy. Previous/next day and a date picker. |
| **Calendar** | Month, week and day views over 28 Sep – 31 Dec. Filters: channel, campaign, content type (area or franchise F01–F24), owner, priority, status, organic/paid. Clicking an item opens full details with copy. |
| **Campaigns** | All 71 campaigns (table or cards). Filters: status, type, owner, priority, month, channel, organic/paid. Detail page: goal, KPI, target, message, every platform's copy, extra copy (emails, pitches, page text), paid set-up, creative brief, creative list, tracking and UTM, timeline with every calendar day that uses the campaign, assets with status, dependencies, and editable results and notes. |
| **Content** | 462 research and strategy opportunities, plus 66 dated moments and 24 social franchises. Tabs by type (evergreen, search, game hub, trend/news, social). Filters: status (Idea → Published, or Rejected), priority, topic, game, platform, format, intent. |
| **Social** | One tab per network (Facebook, Facebook Groups, Instagram, TikTok, YouTube, X, Threads, Bluesky, Reddit, Discord, Twitch, LinkedIn). Each shows the channel strategy, today's items, the next 7 days, recurring formats and approved example copy. |
| **SEO** | This week's SEO tasks, evergreen topics (filter by impact, difficulty, game, intent, status), the 131-row query map, game hubs, plumbing fixes and title rewrites (with status), internal linking and programmatic rules, Discover and Google News, and 55 scored tools |
| **Community** | Discord and Reddit tasks for 7 days, rituals, channel list, events and polls, giveaways (with the fairness fixes that must ship first), a member feedback log, and rhythms and moderation |
| **Video** | Pipeline board (Idea → Script → Recording → Editing → Ready → Published) with 48 ideas and every daily vertical, a platform filter, the 13 shows, both long-form pilots and the repurposing workflow |
| **Email** | 37 dated sends with subject and preview copy and status (Draft/Scheduled/Sent), 12 lifecycle sequences with full copy, full issues (Save File #1, GTA VI launch edition), sign-up placements, products and structure |
| **Paid Media** | Campaigns from 26-PAID-MEDIA with set-up and ad copy. Manual spend logging and CSV import compute spend, CTR, CPC and cost per registration. Also budget plans, launch gates and what not to buy. |
| **PR** | 32 campaigns on a board (Idea → Data collection → Creation → Outreach → Coverage → Complete) or a table. Each has its card, a copyable pitch subject, body and follow-up, and editable targets, assets, coverage and backlinks. |
| **Partnerships** | A light pipeline (Target → … → Complete) seeded with every outreach in 23 and 24. Each message template splits into copyable parts. You can add real contacts. |
| **Experiments** | 96 experiments with filters, and editable start, end, baseline, result, decision and learning. Status: Backlog, Running, Won, Lost or Inconclusive. |
| **Analytics** | 27 KPIs plus Users and Pageviews, with definition, formula, baseline and TARGETS. Enter values manually or import them from CSV, with sparklines. Integration status is also shown here. |
| **Copy Library** | 1,798 pieces of public copy: calendar posts, campaign copy, subject lines, ads, scripts, and outreach and lifecycle emails. Search and filters by channel, source, month and campaign. |
| **Assets** | 279 required assets (campaign creative and daily template fills) with dimensions, brief, due date, owner and status (Needed → Published) |
| **Tasks** | Quick wins, calendar operations and the dev backlog, plus your own tasks. Grouped as Overdue, Today, Next 7 days and Later. Quick complete, filters, create and edit, and CSV export. |
| **Opportunities** | 291 scored opportunities and 66 key dates with before/during/after guidance |
| **UTM Builder** | Enforces 30-ANALYTICS §7: allowed sources and mediums, c01–c71 campaign ids, cross-field rules, techplay.gg only, 300-character limit. Copy the URL and keep a link log. |
| **Strategy docs** | Every Phase 2 document rendered, with a section list |
| **Settings** | Plan-date override, "viewing as", theme, re-sync from docs, dataset downloads (CSV and JSON), working-state export, import and reset, integration and AI status |

### Cross-cutting behaviour

- **"Viewing as".** Choose Everyone, EIC, ED, SC, DS or DEV in the top bar. Today, Overview, Calendar and Tasks then show only that person's work.
- **Global search.** Press ⌘K, Ctrl+K or `/`. It searches campaigns, tasks, content, copy, experiments, opportunities, key dates, PR, calendar items and docs, plus your own tasks.
- **COPY copies only public copy.** Calendar copy is exactly the text the generator wrapped in `«…»`. Campaign copy is the channel value from the campaign library. Labels, sizes, owners and instructions are never copied. A toast confirms, and a fallback works on plain-http LAN addresses.
- **Consistent statuses.**
  - Tasks and items: TODO, IN PROGRESS, DONE, BLOCKED.
  - Campaigns: PLANNED, ACTIVE, PAUSED, COMPLETE. Defaults come from the dates; a status set by hand wins.
  - Content: IDEA, PLANNED, CREATING, READY, PUBLISHED, REJECTED.
  - Priorities: P0–P3.
- **Export.** Every table has CSV and JSON export of the filtered rows. Settings can download any whole dataset.
- **Mobile.** A bottom tab bar gives Today, Tasks, Copy, Campaigns and Calendar; the full menu is a drawer. The smoke test checks that there is no horizontal page scroll at 390 px.

---

## 3. Architecture

**Decision: a separate Next.js app in `growth-os/`.** The alternative was an isolated route inside `frontend/`. That would have shipped marketing plans inside the public site's build and deploy, shared its auth assumptions (there is no server-side auth in `frontend/`; the token lives in localStorage), and put internal copy one routing mistake away from the public internet. A sibling app matches how the repo is already organised (independently deployable `frontend/`, `backend/`, `discord/`). It uses the same stack as the frontend, so nothing new has to be learned: Next 16.3, React 19.2, TypeScript, Tailwind 4 and lucide-react. It cannot affect production: `techplay-deploy.sh` and nginx do not know it exists.

```
docs/techplay-growth/            (source of truth, edited by people)
  research/*.csv|json            ─┐
  strategy/*.md|json|csv          │  npm run sync-data
  strategy/_generator/*.py        │  (scripts/sync-data.mjs + scripts/lib/*)
                                  ▼
growth-os/data/generated/*.json   (disposable, git-ignored)
        │  lib/data.ts (server only; the one module to swap for a DB)
        ▼
Server components (app/**/page.tsx) → slice + enrich → client views
        ▲                                    │ dispatch(op)
        │ GET /api/state                     ▼
growth-os/data/state/state.json ◀── POST /api/state (lib/state/store.ts)
```

| Folder | Role |
|---|---|
| `scripts/lib/parse.mjs`, `extract.mjs` | Pure parsers: markdown tables and sections, blockquoted copy, CSV, calendar cells into items, paid Field/Plan tables. Unit-tested. |
| `scripts/sync-data.mjs` | Builds the normalised datasets: calendar, campaigns, briefs, paid, experiments, kpis, channels, backlog, content, opportunities, seo, video, email, pr, partners, community, social, tasks, assets, copy, docs, meta |
| `lib/data.ts` | Typed loaders for the generated JSON. The only place that knows the storage format. |
| `lib/state/` | `types.ts` (the working-state shape and operations), `reducer.ts` (pure `applyOp`, shared by server and client), `store.ts` (the `StateStore` interface and `FileStateStore`), `client.tsx` (React provider, optimistic updates, localStorage fallback) |
| `lib/enrich.ts` | Joins calendar items with campaign copy and brief availability on the server, so the browser never loads the 260 KB campaign file on Today |
| `lib/utm.ts` | UTM convention and validator |
| `lib/search.ts`, `app/api/search` | Global search index |
| `lib/integrations/` | `MetricsProvider` interface and a registry (GA4, Search Console, Meta Ads, YouTube, TikTok, newsletter). Reports whether it is configured; fetching is not implemented. |
| `lib/ai/` | Optional assist actions (alternative Facebook copy, Reel script, campaign brief, repurpose article). A registry only; nothing runs without an implementation and `ANTHROPIC_API_KEY`. |
| `components/` | Shell and navigation, ItemCard, the DataView filter/table/drawer system, Kanban, copy primitives, Markdown |
| `proxy.ts` | Access guard (Next 16's renamed middleware) |

API routes:

| Route | Purpose |
|---|---|
| `GET/POST /api/state` | Read the working state, or apply operations to it |
| `GET /api/day/[date]` | One day's items, enriched |
| `GET /api/search?q=` | Global search |
| `GET /api/export/[name]?format=csv\|json` | Dataset download |
| `POST /api/sync` | Re-run the sync (disabled in production unless `GROWTH_OS_ALLOW_SYNC=1`) |
| `GET /api/integrations` | Integration and AI configuration status; variable names only, never values |

---

## 4. Data

Everything shown comes from the Phase 1 and Phase 2 files. **No demo or invented data was added.** Where a source has no value, the UI says "—", "UNKNOWN" or "not configured".

| Dataset | Source | Count |
|---|---|---|
| Calendar days and items | `strategy/calendar.json` (generated by `strategy/_generator`) | 95 days, 2,310 items |
| Campaigns | `strategy/campaigns.json` | 71 |
| Creative briefs | `29-CREATIVE-BRIEFS` §3 | 21 |
| Paid set-ups | `26-PAID-MEDIA` §4 Field/Plan tables | 11 |
| Experiments, KPIs, channels, dev backlog | `experiments.json`, `kpis.json`, `channels.json`, `development-backlog.json` | 96, 27, 43, 95 |
| Content | `research/evergreen-opportunities.csv`, `game-opportunities.csv`, `13-SEO-CONTENT` §5 | 462 (+66 key dates, +24 franchises) |
| Opportunities and key dates | `research/opportunities.json` | 291, 66 |
| Video ideas and shows | `09-YOUTUBE` §4, §8.3 | 48, 13 |
| Email sends and lifecycle | `17-NEWSLETTER-EMAIL` §9, §12 | 37, 12 |
| PR | `22-DIGITAL-PR` §5–§7 | 32 |
| Partner and creator templates | `24-PARTNERSHIPS` §6, `23-CREATORS` §10 | 14 + 10 |
| Community | `12-DISCORD` §3, §7; `11-REDDIT` §4, §6, §13; `25-GIVEAWAYS` §6 | tables and sections |
| Seed tasks | `33-QUICK-WINS` next-24h/3/7/14/30-day tables plus the dev backlog | 161 |
| Assets | Campaign creative lists plus daily franchise creative | 279 |
| Copy library | Calendar `«…»` copy, campaign copy, subject and preview lines, ad fields, blockquoted examples in 05–26, templates, lifecycle sequences | 1,798 |

### How to update campaigns

Edit `docs/techplay-growth/strategy/campaigns.json`, which is canonical, and keep `28-CAMPAIGN-LIBRARY.md` in step. Then click **Settings → Re-sync from docs**, or run `npm run sync-data`. The UI has no campaign-specific code for particular IDs; a new campaign appears everywhere it is referenced.

### How to add or change calendar items

The calendar is generated. Edit the generator in `docs/techplay-growth/strategy/_generator/`:

- `cal_data.py`: weekly franchise content (Out This Week, polls, Fix It Friday topics and so on), On This Day, and the countdown rules.
- `cal_days.py`: date-specific additions, `d("2026-10-07", article=[…], pr=[…], x=[…], …)`, and the per-day CTA, landing page and KPI.
- `gen_calendar.py`: the weekday templates. The GTA VI countdown is read from `19-GTA6.md` §6.2.

Wrap any text meant to be posted in `«…»`, which is what COPY copies. Then:

```bash
cd docs/techplay-growth/strategy/_generator && python3 gen_calendar.py
cd ../../../../growth-os && npm run sync-data
```

That rewrites `calendar-2026-*.csv` and `calendar.json`. One-off tasks that don't belong in the plan go in **Tasks → New task** instead.

### How persistence works

Anything a person changes is an operation on the working state:

| Operation | Covers |
|---|---|
| `setStatus` | Status of any item, task, campaign, asset, video, PR or experiment |
| `setField` | Notes, results, links and similar fields |
| `upsertTask` | Your own tasks |
| `addMetric` | KPI values |
| `addPaid` | Paid spend rows |
| `upsertPipeline` | Partnership and creator contacts |
| `addFeedback` | Member feedback |

The same pure reducer runs in the browser (optimistic) and on the server. The server writes `data/state/state.json` with a serialised read-modify-write and an atomic rename, so two tabs cannot interleave. If the API is unreachable, the browser falls back to localStorage and says so in the sidebar.

To move to a database, implement `StateStore` (`read`, `apply(ops)`) against Postgres or Redis and return it from `getStore()`. The operation log shape is already event-like. To replace the JSON data source, change `lib/data.ts`. Settings has state export, import and reset for backups.

---

## 5. Testing performed (27 Sep 2026)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | Clean |
| `npm test` | 31 tests passed, including every worked UTM example in 30-ANALYTICS §7.4 |
| `npm run build` | Succeeds; 31 routes, proxy active |
| `npm run e2e` | 47 of 47 checks, run in Chromium against `next start` |

The e2e checks cover:
- all 24 main routes load with no console errors;
- COPY puts exactly the copy text on the clipboard and shows a toast;
- mark-complete persists across a reload;
- Today area and copy-only filters; Calendar channel filter, item drawer and month view; Campaigns type filter;
- global search, UTM validation and valid build, task create and quick complete, KPI value entry, the empty state outside the plan;
- mobile (390 px): no horizontal scroll on Today, Tasks, Copy, Campaigns and Overview; the tab bar shows and the menu opens.

The screens were also checked visually in dark and light mode, on desktop (1440 px) and mobile (390 px).

---

## 6. Known limitations

- **No live data.** GA4, Search Console, Meta, YouTube, TikTok and the newsletter are interfaces only. KPI values and paid spend are entered by hand or imported as CSV.
- **Single-machine state.** The file store suits one person, or a small team using one machine on a LAN. There are no user accounts or per-person audit; everyone behind the Basic-auth credentials is the same user. Multi-user use needs a DB-backed `StateStore` and real auth.
- **The calendar is generated text.** Instructions are the generator's words. Items that reference a campaign without their own `«…»` copy offer the campaign library's copy for that channel. A few operational items have no copy by design.
- **Some Phase 2 sections are prose, not tables.** Paid sub-campaigns C57d–e and some Discord rhythm tables appear as rendered markdown or in the Strategy docs view, not as structured records.
- **Status defaults are date-derived.** A campaign shows ACTIVE inside its dates until someone sets it otherwise. The DEV sprint slips recorded in `32-DEVELOPMENT-BACKLOG` are in each campaign's "Delivery status" and in the calendar, not in the campaign dates themselves.
- **Re-sync does not migrate state.** State is keyed by item ids (`date:channel:index`). If an edit to the generator reorders a day's items, statuses already set on that day can attach to a different item. Re-sync before work starts on a day, not after.
- **No drag and drop on boards.** Cards move with the stage select, which also works on phones.

## 7. Future integrations

1. **Search Console (K02, K03, K25).** Implement `fetch()` in `lib/integrations` with a service account (`GOOGLE_APPLICATION_CREDENTIALS`, `GSC_SITE_URL`). Map `searchanalytics.query` by date and searchType web, discover or news into `MetricPoint`s, and merge them with manual values in Analytics, with the source shown.
2. **GA4 (K01, K05, K06, K11, K12).** Use the Data API with `GA4_PROPERTY_ID`. It counts consented traffic only, so label it that way, as 30-ANALYTICS requires.
3. **Newsletter.** Read counts from the TechPlay admin mail desk API, or from a provider through `NEWSLETTER_API_URL/TOKEN`: verified subscribers, sends, complaints and unsubscribes (K09, K19, K20).
4. **Meta, TikTok and YouTube.** Daily spend, impressions and clicks into Paid Media, in the same rows the CSV import writes (campaign id = the C5x sub-id in the ad name).
5. **TechPlay database, read-only.** WRM (K00), registrations and A2 activation (K07, K08) from the Q-01 to Q-14 queries in 30-ANALYTICS. Use a read replica or a read-only user; never write.
6. **AI assist.** Implement `runAssist` server-side with the spine's banned-phrase list and fact rules as context. Return drafts to edit, and never auto-post.

Credentials always go in `growth-os/.env.local` on the machine that runs the app. They are never committed, and never shown in the UI: only whether each provider is configured.
