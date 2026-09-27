# 13 — SEO Recovery, Topical Clusters and Editorial Mix

Status: Phase 2 plan — 27 Sep 2026

Covers brief Parts 13 (SEO and content) and 14 (editorial mix). Execution window Mon 28 Sep → Thu 31 Dec 2026, with Q1 2027 continuity. Owners are role codes from the spine (EIC, ED, SC, DS, DEV). Research is cited as [R03], [R09] etc.

**Summary**

- Organic search starts from zero: 1–2 Google clicks a day since the Cloudflare 403 of 17 Aug 2026, 56,355 URLs indexed and 338,358 declined, and 99.8% of the indexable surface is game, studio and series pages with no TechPlay text [R03, R23]. No traffic target in this file is a forecast; every number we set is a TARGET on work done, not on clicks.
- **Decision D-021 (recommended): shrink the indexable game set to pages with an original or demand signal, in four stages between 28 Sep and 13 Nov**, with a safety list built from Search Console so nothing that already earns impressions is removed. The long tail stays crawlable (`noindex, follow`) and re-enters the index automatically when it earns a signal.
- Plumbing first (C02, 28 Sep–9 Oct): breadcrumbs (D-002), GTA 6 news re-pointed to the real game (D-005), SearchAction removed (D-006), game pages out of Google News (D-022), game pages linking to facet hubs (D-023), RSS (D-003) and titles.
- Five pillar clusters (P1–P5) plus game, tech, evergreen, seasonal, guide and hub clusters are mapped query by query: **124 mapped rows** using real queries from [R09] and [R17], each ending in a product action (reminder, shelf add, newsletter, analyzer run).
- Programmatic templates (where to play, release time, file size, requirements, crossplay, games like, series order) are built as **sections on the canonical game or series page, not new URLs**, and rolled out only to a demand list: 50 titles in October, capped at 300 by 31 Dec (TARGET).
- Editorial mix for 2 writers + EIC: about 62 production hours a week. News drops from ~24 mostly rewritten items a week to 10 pillar-filtered news and breaking items plus 4 news franchises; evergreen, templates, a weekly Verdict and a fortnightly data story take the freed time. A three-slot publishing grid adds 08:30 and 14:30 Sarajevo slots to today's 17:30–21:30 habit [R02].
- Title rules end truncated titles, stale numbers ("140,000+"), promised "benchmarks" that do not exist and duplicated brand suffixes; 16 before/after rewrites are in §9.
- "Do not waste effort on" list: general tech and phones, Genshin guides, reviews that land weeks late with no new angle, commodity rewrites, codes pages, live-service tier lists, long-tail template spam.

---

## 1. Where we start (the facts that shape the plan)

| Fact | Evidence | Consequence for this plan |
|---|---|---|
| Google clicks 1–2/day since 17 Aug; not recovered 7 Sep | [R03] §exec, docs/README.md §12 | No click targets; measure impressions, indexed pages and crawl first |
| 295,024 game URLs in sitemaps; 1,967 (0.7%) carry TechPlay text; Googlebot fetches ~77 game pages/day | [R03] §2, [R01] B.5 | One crawl pass ≈ 10 years. The index decision (§2) comes before any new URL family |
| Current rule: game indexable iff stripped description > 50 chars; thin pages are `noindex, nofollow` | `Game::scopeIndexable()`, [R01] F09 | The rule measures length, not originality; `nofollow` also blocks link equity to studios and series |
| TechPlay in 0 of 114 Bing SERPs and 0 of 751 Google News results for its own stories | [R03] §3–6 | Brand and topical authority must be built, not recovered |
| Google News `site:` feed: 99 of 100 items are game-database pages | [R02] §8.3 | D-022 is a precondition for any News strategy (see file 14) |
| 0 contextual links in 6 sampled articles; every breadcrumb category link 404s | [R02] §4.2 | Internal linking rules (§4) and D-002 |
| 577 news, 38 reviews (none since 8 Jul), 4 guides (3 Genshin) | [R02] §7.1, [R08] | Editorial mix (§8) moves hours from rewrites to evergreen, Verdict and data |
| Feb 2026 Discover update: topic-by-topic expertise; Sep 2026 spam update rolling out | [R07] §3.1, [R08] | Pillars P1–P5 are the topic boundary for everything we publish |
| PC troubleshooting SERPs held by utility blogs, no major gaming outlet | [R09] EA-001, EA-002, EA-004 | P2 is the fastest evergreen bet |

---

## 2. Decision D-021: the indexable set

**Owner:** EIC decides (by Fri 2 Oct), DEV builds (M, ~12 h across October). **Status today:** 295,024 game URLs indexable by a length rule.

### 2.1 Options (from [R03] §9, costed)

| # | Option | What changes | Upside | Cost / risk | Effort |
|---|---|---|---|---|---|
| 0 | Do nothing | Keep the 50-character rule | No work | Crawl stays spread over 295k near-duplicate pages; scaled-content exposure [R03] §9, [R08] §6; recovery depends on Google changing its mind | 0 |
| 1 | Tighten `Game::indexable()` | Indexable only with an original or demand signal | Crawl concentrates on pages with a reason to exist; likely cut to "thousands" [R03] | Fewer URLs in the index short term; wrong threshold could drop pages with real demand | M |
| 2 | Noindex the long tail, keep it crawlable | `noindex, follow` + out of sitemaps | Pages stay useful to members and pass links to studios/series | Long-tail visits foregone until enriched | S |
| 3 | Hub and spoke | Series, genre, platform, year hubs get editorial copy and become the entry points | Fewer, stronger pages targeting head terms ("best RPG games", "[series] in order") | Needs editorial intros and D-023 links | M (ongoing ED) |
| 4 | Enrich by demand | Templates and "ours" paragraphs on top titles first | Adds original signal where demand exists | ED hours; must not become long-tail spam | Ongoing |
| 5 | Fix the News misread | Game pages out of Google News | Cleans the News identity | None | S (D-022) |

### 2.2 Recommended path

**Adopt 1 + 2 + 3 + 4 + 5 together, staged.** Options 1 and 2 are the same move seen from two sides: the rule decides the set; the long tail becomes `noindex, follow` instead of disappearing. Options 3 and 4 are how pages earn their way back in. Option 5 ships in the plumbing sprint.

**New rule (proposal for EIC sign-off).** A game page is indexable if its stripped description is longer than 50 characters **and** at least one of these is true:

| Signal | Data (exists?) | Why it counts |
|---|---|---|
| S-a TechPlay editorial link: any published article or guide with `game_id` = this game | `articles.game_id`, `guides.game_id` (exists) | Something original points at the page |
| S-b Reader rating or written reader review | `game_ratings` (exists; volume small) | User-generated "ours" content [R01] B.5 |
| S-c On at least one member shelf | `user_games` (2,599 rows) | Real member interest |
| S-d Upcoming: release date in the next 12 months and passes the calendar's `Notability` threshold | `released`, `release_precision`, `Notability` (exists) | Release-date demand; reminder conversion [R09] EB-150 |
| S-e Completed template block (where to play + one of requirements / crossplay / file size) | new fields (§6) | Editor-checked facts |
| S-f Member of a series page with an editorial intro | `series_key` + series intro (new) | Hub-and-spoke entry |
| S-g Safety list: URL had ≥1 click or ≥10 impressions in Search Console's last 16 months | GSC export (EIC) | Never remove a page that already earns search exposure |
| S-h Demand list: Wave 1–3 titles (§6.3) | editorial list | Top titles by demand even before enrichment |

**What stays unchanged:** studios keep their own `indexable` flag; series keep their indexable scope; tombstoned slugs keep answering 410 [R01] B.5.

### 2.3 Staged rollout

| Stage | Dates | Action | Owner (h) | Check before moving on |
|---|---|---|---|---|
| 0 Measure | 28 Sep–2 Oct | DEV runs one read-only query: counts of indexable games by each signal S-a…S-d and their union. EIC exports GSC Pages → game URLs with clicks/impressions (16 months) as the safety list S-g. Also export GSC "Why pages aren't indexed" reasons | DEV 4, EIC 2 | EIC sees the size of the proposed set; decision memo Fri 2 Oct |
| 1 Quick fix | 5–9 Oct | Thin pages (≤50 chars) switch from `noindex, nofollow` to `noindex, follow` [R01] F09. `Googlebot-News` robots group gets `Disallow: /games/` and `/studios/` (D-022) | DEV 2 | Spot-check 20 thin pages' robots meta |
| 2a Sitemap cut | 12–16 Oct | New scope live behind a flag; `sitemap-games-*.xml` lists only the new set. Pages outside it keep `index` for now | DEV 5 | GSC sitemap report: submitted count equals the new set; no spike in errors |
| 2b Noindex batch 1 | 26 Oct | `noindex, follow` for pages outside the set **with no store link and release year before 2015** | DEV 1 | GSC: retained set's indexed count stable or rising over 14 days |
| 2c Noindex batch 2 | 9 Nov | `noindex, follow` for the rest of the pages outside the set | DEV 1 | Same check; finishes a week before GTA VI launch week |
| 3 Re-entry loop | from 16 Nov, nightly | Scheduled job recomputes the set; a page that gains a signal (new article, rating, shelf, template) re-enters the sitemap next run | DEV (inside Stage 2a) | Weekly: count of pages that re-entered |

**Rollback rule.** If, 28 days after a batch, the retained set's indexed count in GSC has fallen rather than risen, or GSC impressions for game URLs fall by more than half against the previous 28 days (both measured, not assumed), EIC reverts that batch to `index` and reviews the threshold. The safety list S-g is applied before every batch.

### 2.4 Implementation notes for DEV (from the code)

- `Game::scopeIndexable()` and the partial index `games_indexable_slug_idx` (migration `2026_08_29_030000`) must use the **identical** predicate, or Postgres silently stops using the index. Change both, or neither (comment in `backend/app/Models/Game.php`).
- The frontend repeats the rule (noindex when description ≤ 50 chars, [R01] F09). Replace it with an `is_indexable` boolean returned by the game bundle so backend and frontend cannot drift.
- Update the Baza section of `docs/README.md` in the same commit (CLAUDE.md rule).
- Sub-items: **D-021a** compute signals into a nightly `indexable_tier` column; **D-021b** robots meta from `is_indexable`; **D-021c** sitemap reads the tier; **D-021d** admin override (force index / force noindex) on `GameResource` for editors.

**Measurement of the decision.** Inputs we can read without Search Console access in this session: sitemap count (public), Googlebot requests per day to `/games/` in nginx logs (baseline ~77/day [R03]). In GSC: indexed count of the retained set, crawl stats, impressions for `/games/` URLs. TARGET: by 30 Nov, Googlebot requests to retained game pages exceed requests to non-retained ones (formula: retained-page Googlebot hits ÷ all game-page Googlebot hits > 0.5, from nginx logs).

---

## 3. Plumbing fixes (C02, 28 Sep–9 Oct)

| ID | Fix | Evidence | Exact change | Owner / size | Done when |
|---|---|---|---|---|---|
| D-002 | Breadcrumb category hrefs 404 | `/news/news-industry` etc. [R02] §4.2 | Category link uses the category's own slug: `/news/industry`, `/news/gaming`, `/hardware/news`. Keep `BreadcrumbList` JSON-LD in sync | DEV S | 10 random articles: every breadcrumb link returns 200 |
| D-005 | GTA 6 news on a 2019 parody game | `/games/gta-6` shows five GTA VI stories [R02] §4.2 | Re-point every article with `game_id` = gta-6 to `grand-theft-auto-vi`; rename the parody entry's `name`/`link_name` so `ContentGameLinker` cannot match "GTA 6"; lock fields; parody page `noindex`. Link `/gta6` ↔ `/games/grand-theft-auto-vi` ↔ `/calendar` both ways (with D-017) | DEV S, ED 1 h to check article list | `/games/grand-theft-auto-vi` lists all GTA VI coverage; parody page lists none |
| D-006 | SearchAction points to `/search`, a noindex 404 | [R01] F12, [R03] §10 | Remove `potentialAction` from `WebSite` JSON-LD now. Revisit only if a real `/search` page is built | DEV XS | JSON-LD validates with no SearchAction |
| D-022 | Game pages shown as Google News items | 99/100 `site:` items are game pages [R02] §8.3 | (1) Robots row `seo_robots_txt_content` (admin, Settings → SEO): add `Disallow: /games/` and `Disallow: /studios/` under `User-agent: Googlebot-News`. (2) Add a `googlebot-news` noindex robots meta on game and studio pages (verify token in Google's robots meta documentation before shipping). (3) Keep `VideoGame.datePublished` (it is the game's release date) | DEV S, EIC 0.5 h admin edit | Weekly Google News RSS `site:techplay.gg` check (method from [R02]) shows articles, not games; see file 14 §9 |
| D-023 | Game pages pass no links to facet hubs | Tags render as `<span>`; genres and platforms are plain text [R01] A.4.8 | Tags → `/games/tag/{t}` (only the ~20 indexable tags), genres → `/games/genre/{g}`, platforms → `/games/platform/{p}`, series name → `/games/series/{s}`, studio already linked. Thin-page `follow` fixed in Stage 1 | DEV S | A sampled game page links to ≥3 hubs |
| D-003 | RSS hardware links → 404; feed ~24 h behind | [R02] exec §6 | `/tech/` → `/hardware/`; regenerate on publish in the fan-out | DEV S | New article appears in `/rss` within 15 min |
| D-017 | GTA 6 hub renders empty H1 and zero counters | [R17] §1 | SSR counters, real H1 "GTA 6 hub: map, characters, vehicles and release facts", crawlable intro paragraph and "Last updated" per data page, OG ≤300 KB | DEV S, ED 2 h copy | `curl` of `/gta6` shows 1,058 and an H1 |
| D-030 | Two author URLs per person | `/author/adi` vs `/author/adi-zeljkovic` [R02] §4.2 | 301 the short form; JSON-LD `author.url` always `author_slug` | DEV XS | One Person URL per author (file 14 §7) |
| D-039 | Giveaway hub `noindex, nofollow` | [R01] A.4.9 | Indexable while a giveaway is live; canonical on `/giveaway/{slug}` | DEV XS | Only if C09 verifies a live giveaway |
| Titles | Truncated, stale or duplicated titles | [R03] §10, [R02] App. A | Rules and rewrites in §9; `meta_title` cut at a word boundary, never mid-word; one separator " \| TechPlay"; author titles lose the doubled brand | DEV S (truncation, separator, author), ED/EIC 3 h rewrites | The 16 rewrites in §9 are live |

Also in the sprint: server-rendered homepage links to `/gta6`, `/guides`, `/hardware`, `/wow-analyzer`, `/calendar` (none today in SSR [R02] §4.1), and category hubs get `/page/[n]` like section roots [R01] F05 (DEV S, P2).

---

## 4. Internal linking rules

These apply to every piece from Mon 28 Sep. ED and EIC add links while writing; D-010 (C46) adds the automatic parts.

**In the body (writer's job)**

1. **First mention of each game** links to its `/games/{slug}` page, maximum three game links per article. If the game page is outside the indexable set, link it anyway: the link itself is signal S-a and brings it back in (§2.2).
2. **One pillar hub link** per article: `/calendar`, `/switch-2`, `/steam`, `/guides/pc-fixes`, `/mmo`, `/wow-analyzer`, `/gta6` or a `/data/...` page, whichever the story belongs to.
3. **One product link where it fits**: a tool (`/wow-analyzer`, `/backlog-advisor`, `/gta6/release-time`), a series page, or the release calendar day.
4. **The primary source, linked once**, in the paragraph where it is used (Rockstar Newswire, the publisher's post, the court filing). Today sources are named but not linked [R02] §4.2.
5. Total: **3–5 contextual links** per news piece, 5–10 per evergreen guide.
6. Anchor text describes the target ("GTA 6 release time by region", "Persona games in order"), never "here" or "this article". Vary anchors; do not repeat one exact-match anchor across dozens of articles.

**Automatic (D-010, D-023)**

7. Article end: related module (same game first, then same pillar hub), CTA block (Discord, newsletter, connect Steam) [R02] §13 #5–6.
8. Game page: links to genre, platform, tag and series hubs (D-023), the game's hub if it has one (`/gta6`, `/mmo`), and a "TechPlay coverage" list of articles and guides with that `game_id` (verify guides are in the bundle [R01] F03).
9. Hub ↔ game page reciprocity: every hub links to its game pages; every game page with a hub links back to it as its "home" [R18].
10. Series pages are the one canonical "in order" page. Hubs and articles link to them rather than repeating the list.

**One URL per intent (anti-cannibalisation)**

| Intent | Canonical URL | Must not compete |
|---|---|---|
| GTA 6 news, guides, everything we know | `/gta6` and `/gta6/everything-we-know` | News articles link up to it |
| GTA 6 as a game entity (date, platforms, editions, reminder) | `/games/grand-theft-auto-vi` | `/games/gta-6` (parody, noindex) |
| GTA 6 unlock time | `/gta6/release-time` (new, D-018) | No separate "release time" article |
| "[series] in order" | `/games/series/{slug}` | F09 posts upgrade the series page; no parallel article |
| "[game] release date / is it on PC / file size / crossplay" | sections on `/games/{slug}` | No per-question URLs |
| Upcoming game detail | `/games/{slug}` (calendar detail already canonicals there [R01] F13) | — |
| Monthly release list | one living page per month (e.g. "Every game releasing in November 2026") | F01 weekly posts link to it |

**Weekly hygiene (ED, 30 min, Mondays):** run the staff orphan-page report (`InternalLinkService` / `SeoController` [R01] B.4) and add links to any orphan published in the last 7 days.

---

## 5. Topical clusters: query → page → action

**How to read the tables.** Query comes from [R09] (evergreen CSV ID in brackets), [R17] (GTA 6 query table) or a named research trend. No search volume is claimed; competition and traffic scores are in the CSV. "Target page" is the exact working title (H1); the `<title>` follows §9 rules. "Links" lists the main inbound (←) and outbound (→) links beyond the §4 defaults. Conversion names the spine event (§10 of the spine). Guest CTAs before 19 Oct go to `/register?from=<page>`; from 19 Oct they open the D-016 modal and return the reader to the page (C45).

Status key: **L** live page to fix, **N** new page, **S** section on an existing page, **Q1** January–March 2027.

### 5.1 P1 Release & platform intelligence (hubs: `/calendar`, `/switch-2` (new), `/steam` (new))

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← in / → out) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 1 | game release dates november 2026 [EA-103] | info | Every game releasing in November 2026, by date and platform | N | F01 weekly posts | /calendar | ← F01, newsletter, homepage; → each game page, /gta6 | Remind me (per row) | reminder_set |
| 2 | game release dates october 2026 [EA-103 variant] | info | Every game releasing in October 2026, by date and platform | N | F01, MW4 guide | /calendar | ← F01; → game pages | Remind me (per row) | reminder_set |
| 3 | what time do steam games release [EA-099] | info | What time do new Steam games unlock? Release times explained | N | row 4 | /steam | ← F01; → /calendar | Remind me on release day | reminder_set |
| 4 | how to preload games ps5 [EA-100] | how-to | How to pre-load games on PS5, Xbox Series X\|S and PC | N | /gta6/release-time | /calendar | ← GTA 6 and MW4 pages; → row 3 | Remind me on release day | reminder_set |
| 5 | game pass tiers explained [EA-092] | comm-info | Game Pass tiers explained: what each plan includes and costs in 2026 | N | row 6 | /games/platform/xbox | ← Xbox news; → row 9 | Import your Xbox library | library_connected (xbox) |
| 6 | game pass day one games 2026 [EA-095] | info | Every Game Pass day-one game still to come in 2026 and early 2027 | N | Fable, Persona 4 Revival pages | /calendar | ← row 5; → game pages | Wishlist | shelf_add (wishlist) |
| 7 | ps plus games this month [EA-096] | info | PS Plus Essential games for October 2026 (then monthly) | N | PS Plus Extra/Premium October additions (20 Oct) | /games/platform/playstation | ← news; → game pages | Add to shelf | shelf_add |
| 8 | ps plus extra vs premium [EA-093] | comm-info | PS Plus Essential vs Extra vs Premium: what each tier includes in 2026 | N | renewal price note (reported, verify with Sony [R05]) | /games/platform/playstation | ← row 7; → row 9 | Newsletter | newsletter_signup |
| 9 | game pass vs ps plus [EA-112] | commercial | Game Pass vs PS Plus in 2026: which subscription fits the games you play | N | rows 5, 8 | /calendar | ← rows 5, 8 | Import your library | library_connected |
| 10 | will my ps5 discs still work [R06 Q59] | info | Will my PS5 discs still work? What Sony's disc plans mean for your library | N | /last-disc, F17 news | /last-disc | ← disc news; → /last-disc/letter | Import your PlayStation library | library_connected (psn) |
| 11 | is switch 2 worth it 2026 [EA-110] | commercial | Is Switch 2 worth it at $499.99? A verdict for late 2026 | N (F10) | row 15 | /switch-2 | ← Switch 2 news; → rows 12, 15 | Newsletter | newsletter_signup |
| 12 | does switch 2 play switch games [EB-122, EA-128] | info | Does Switch 2 play Switch 1 games? Compatibility, upgrade packs and exceptions | N | row 13 | /switch-2 | ← row 11; → row 14 | Build your Switch shelf | shelf_add |
| 13 | what is a game key card switch 2 [EA-017] | info | Switch 2 game-key cards explained: what's on the card and what you download | N | file-size sections | /switch-2 | ← Switch 2 Edition news | Add to shelf | shelf_add |
| 14 | switch to switch 2 transfer [EA-076] | how-to | How to move saves and games from Switch to Switch 2 | N | row 12 | /switch-2 | ← row 12 | Newsletter | newsletter_signup |
| 15 | upcoming switch 2 games [EB-124] | info | Upcoming Switch 2 games: every dated release to March 2027 | N | rows 89–92 | /switch-2 | ← F01; → game pages | Remind me (per row) | reminder_set |
| 16 | best switch 2 games [EB-123] | commercial | The best Switch 2 games, from our database with editor picks | N | facet /games/platform/nintendo | /switch-2 | ← row 11 | Add to shelf | shelf_add |
| 17 | xbox play anywhere explained [EA-077] | info | Xbox Play Anywhere explained: which games you buy once for Xbox and PC | N | row 5 | /games/platform/xbox | → row 18 | Import your Xbox library | library_connected (xbox) |
| 18 | games with cross save [EA-073] | info | Games with cross-save between PC, PlayStation, Xbox and Switch 2 | N | crossplay sections (§6) | /steam | ← row 17 | Add to shelf | shelf_add |
| 19 | switch 2 vrr docked [EA-016] | how-to | Switch 2 display settings: 120Hz, VRR in handheld and docked, and HDR | N | glossary row 39 | /switch-2 | → row 39 | Newsletter | newsletter_signup |

### 5.2 P2 PC performance & fixes (hub: `/guides/pc-fixes`, C60 from 12 Oct; franchise F07 Fix It Friday)

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 20 | shader compilation stutter fix [EA-001] | fix | Shader compilation stutter: what causes it and every fix that works | N (F07 #2, 16 Oct) | per-game fix FAQ on UE5 game pages | /guides/pc-fixes | ← UE5 game pages, MW4 guide; → rows 27, 36 | PC fixes newsletter | newsletter_signup |
| 21 | best Windows 11 settings for gaming [EA-004] | how-to | Windows 11 gaming settings checklist: Game Mode, Memory Integrity, HAGS and Xbox Mode | N (F07 #3, 23 Oct) | changelog block | /guides/pc-fixes | ← row 32; → rows 28, 20 | PC fixes newsletter | newsletter_signup |
| 22 | how to enable secure boot for battlefield 6 [EA-006] | how-to | How to enable Secure Boot and TPM 2.0 for anti-cheat games like Battlefield 6 | N (F07 #1, Fri 9 Oct, before MW4) | MW4 requirements section | /guides/pc-fixes | ← MW4 guide, BF6 page; → row 25 | Remind me: Modern Warfare 4 | reminder_set |
| 23 | DXGI_ERROR_DEVICE_REMOVED fix [EA-002] | fix | DXGI_ERROR_DEVICE_REMOVED and DEVICE_HUNG: what the crash means and how to fix it | N (F07 #4, 30 Oct) | row 25 | /guides/pc-fixes | → rows 24, 25 | PC fixes newsletter | newsletter_signup |
| 24 | game crashes to desktop no error windows 11 [EA-009] | fix | Game crashes to desktop with no error on Windows 11: a fix list in order | N (F07 #5, 6 Nov) | row 23 | /guides/pc-fixes | → rows 25, 21 | PC fixes newsletter | newsletter_signup |
| 25 | how to clean install nvidia drivers DDU [EA-007] | how-to | How to clean-install GPU drivers with DDU (Nvidia, AMD and Intel) | N | — | /guides/pc-fixes | ← rows 22–24 | PC fixes newsletter | newsletter_signup |
| 26 | low gpu usage high cpu usage games fix [EA-008] | fix | Low GPU usage in games: how to tell if your CPU is the bottleneck | N | row 41 | /guides/pc-fixes | → row 41 | PC fixes newsletter | newsletter_signup |
| 27 | how to fix micro stutter in games [EA-012] | fix | Micro-stutter and frame pacing: V-Sync, frame caps, Reflex and Anti-Lag explained | N | row 20 | /guides/pc-fixes | ← row 20; → row 41 | PC fixes newsletter | newsletter_signup |
| 28 | windows 11 hdr washed out fix [EA-010] | how-to | Windows 11 HDR looks washed out in games: how to fix it | N | row 21 | /guides/pc-fixes | ← row 21 | PC fixes newsletter | newsletter_signup |
| 29 | steam content file locked [EA-003] | fix | Steam "content file locked" error: every fix, in order | N | row 31 | /guides/pc-fixes, /steam | → row 31 | Connect Steam | library_connected (steam) |
| 30 | EA app not launching game fix [EA-005] | fix | EA app won't launch your game: the fixes that work | N | row 22 | /guides/pc-fixes | ← BF6 page | PC fixes newsletter | newsletter_signup |
| 31 | move steam games to another drive [EA-075] | how-to | How to move Steam games to another drive without downloading them again | N | row 29 | /steam | ← row 29 | Connect Steam | library_connected (steam) |
| 32 | windows 10 end of support gaming [EA-046] | info | Gaming on Windows 10 after end of support: what still works | N | row 21 | /guides/pc-fixes | → row 21 | PC fixes newsletter | newsletter_signup |
| 33 | steam deck verified meaning [EA-058] | info | Steam Deck Verified, Playable, Unsupported: what the badges mean | N | row 34 | /steam | ← Steam hardware news | Connect Steam | library_connected (steam) |
| 34 | handheld tdp explained [EA-063] | info | Handheld TDP explained: watts, frame rate and battery on Deck, Ally and Switch 2 | N | row 33 | /steam | ← row 33 | PC fixes newsletter | newsletter_signup |
| 35 | ps5 error code ce-108255 [EA-014] | fix | PS5 error CE-108255-1: what it means and how to fix it | N | — | /guides/pc-fixes (console section) | ← PS5 news | Import your PlayStation library | library_connected (psn) |

**Tech glossary sub-cluster** (hub: glossary section of `/guides/pc-fixes`; ~800 words each; one per fortnight in the F07 slot or W2 evergreen slot)

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 36 | what is dlss [EA-025] | info | What is DLSS? Upscaling and frame generation explained | N | row 38 | /guides/pc-fixes | ← requirements sections; → rows 37, 38 | PC fixes newsletter | newsletter_signup |
| 37 | what is frame generation [EA-026] | info | What is frame generation, and when should you turn it on? | N | row 36 | /guides/pc-fixes | ← row 36 | PC fixes newsletter | newsletter_signup |
| 38 | dlss vs fsr vs xess [EA-027] | info | DLSS vs FSR vs XeSS vs PSSR: which upscaler to use on your hardware | N | rows 36–37 | /guides/pc-fixes | ← MW4, GTA 6 performance pages | PC fixes newsletter | newsletter_signup |
| 39 | what is vrr [EA-029] | info | What is VRR, and does your TV or monitor support it for games? | N | row 19 | /guides/pc-fixes | ← row 19 | PC fixes newsletter | newsletter_signup |
| 40 | how much vram do i need [EA-037] | info | How much VRAM do you need for 1080p, 1440p and 4K gaming in 2026? | N | requirements sections | /guides/pc-fixes | ← requirements sections | PC fixes newsletter | newsletter_signup |
| 41 | frame time vs fps [EA-033] | info | Frame time vs FPS: why 60fps can still feel choppy | N | row 27 | /guides/pc-fixes | ← rows 26, 27 | PC fixes newsletter | newsletter_signup |
| 42 | what is input lag [EA-030] | info | What is input lag, and how do you reduce it on PC and console? | N | row 39 | /guides/pc-fixes | ← row 39 | PC fixes newsletter | newsletter_signup |

### 5.3 P3 MMO / WoW (hubs: `/wow-analyzer`, `/mmo` from 10 Nov (C15))

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 43 | is wow worth playing in 2026 [EB-059] | comm-info | Is WoW worth playing in 2026? A verdict for returning players | N (F10) | row 45 | /mmo | ← WoW news; → /wow-analyzer | Check your character in the WoW Analyzer | tool_run (wow) |
| 44 | what is a good raider io score [EB-064] | info | What is a good Raider.IO score? The colour tiers explained | N | Analyzer results page | /wow-analyzer | ← F15 posts; → /wow-analyzer | Run the Analyzer | tool_run (wow) |
| 45 | wow retail or classic [EB-068] | commercial | WoW: Forever, Classic or Midnight: which World of Warcraft should you play? | N (C14, 28 Oct) | WoW: Forever news (4 Nov, reported) | /mmo | ← row 43; → /wow-analyzer | Run the Analyzer | tool_run (wow) |
| 46 | wow patch 12.1.5 release date [R05, prediction] | info/news | WoW patch 12.1.5: expected timing and what to check before it lands | N (C13, 5 Oct; label "predicted") | patch notes digest on the day | /wow-analyzer | ← F15; → /wow-analyzer | Re-run your character after the patch | tool_run (wow) |
| 47 | best wow addons 2026 [EB-065] | info | Best WoW Midnight addons in 2026 (existing guide, refreshed) | L | — | /mmo | → /wow-analyzer | Run the Analyzer | tool_run (wow) |
| 48 | best class for beginners wow [EB-067] | info | Best WoW class for a beginner in Midnight, and how to check your gear after | N (short; links out to class guides) | row 44 | /mmo | → /wow-analyzer | Run the Analyzer | tool_run (wow) |
| 49 | wow the last titan [EB-070] | info | WoW: The Last Titan: everything Blizzard has confirmed | N | game page | /mmo | ← row 45 | Follow the game | game_followed |
| 50 | best mmo 2026 [EB-060] | commercial | The best MMOs to play in 2026: WoW, FFXIV, Guild Wars 2 and more | N | rows 51–52 | /mmo | → rows 51, 52 | Add to shelf | shelf_add |
| 51 | guild wars 2 vs wow [EB-062] | commercial | Guild Wars 2 vs World of Warcraft in 2026: cost, time and who each suits | N | row 50 | /mmo | ← row 50 | Add to shelf | shelf_add |
| 52 | how to get into ffxiv / ffxiv free trial limits [EB-061, EB-026] | info | How to start Final Fantasy XIV in 2026: free trial limits and where to begin | N | row 53 | /mmo | ← row 50; → row 53 | Add to shelf | shelf_add |
| 53 | ffxiv evercold release date [EB-148] | info | FFXIV: Evercold release date, early access and what we know | N (Dec; January 2027 expansion) | game page | /mmo | ← row 52 | Remind me | reminder_set |
| 54 | guild wars 3 release date [EB-069] | info | Guild Wars 3: beta timing and everything ArenaNet has announced | N | row 51 | /mmo | ← row 51 | Follow the game | game_followed |

### 5.4 P4 GTA 6 launch utility (hub: `/gta6`; seasonal to Jan 2027)

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 55 | gta 6 release time [EA-097, R17 #2] | info/tool | GTA 6 release time: when it unlocks in your time zone | N (D-018, C08, 14 Oct) | pre-load section | /gta6 | ← every GTA article, game page, hub; → row 4 | Remind me when GTA 6 unlocks | reminder_set, tool_run (release-time) |
| 56 | gta 6 release date [EB-106, R17 #1] | info | GTA 6: Everything We Know (updated weekly) | L | ledger (row 69) | /gta6 | ← news; → rows 55, 57 | Remind me | reminder_set |
| 57 | is gta 6 coming to pc / gta 6 pc release date [EA-079, EB-108, R17 #20] | info | Is GTA 6 on PC? What Take-Two has said, and what it hasn't | N (platform status tracker; covers Switch 2 [R17 #22]) | row 63 | /gta6 | ← PC news; → game page | Tell me if a PC version is announced | newsletter_signup, game_followed |
| 58 | gta 6 price / editions compared [EB-109, R17 #16–19] | commercial | GTA 6 editions compared: $79.99 Standard, $99.99 Ultimate, and the $400 set without the game | N | collector's set news | /gta6 | ← $400 set news | Wishlist GTA 6 | shelf_add (wishlist) |
| 59 | gta 6 file size / pre load time [EB-114, R17 #25–26] | info | Section on row 55: "GTA 6 pre-load and file size" ("Not announced, checked {date}" until Rockstar or the stores publish it) | S | row 4 | /gta6 | ← row 55 | Remind me | reminder_set |
| 60 | gta 6 countdown [R17 #3] | nav | Hub countdown "Days to GTA 6", server-rendered (D-017) | S | F02 daily cards | /gta6 | ← social F02 | Remind me | reminder_set |
| 61 | gta 6 map / interactive map [R17 #4–5] | tool | GTA 6 Interactive Map: 1,058 locations in Vice City and Leonida | L (attribution per D-020) | map progress tracker (row 68) | /gta6 | ← hub, characters | Create an account to track progress (from 19 Nov) | registration_complete |
| 62 | gta 6 map size [EB-107, R17 #6] | info | How big is GTA 6's map? What Rockstar has actually said | N | IGN quote "a very big map" [R17] | /gta6 | → row 61 | Newsletter | newsletter_signup |
| 63 | gta 6 cars real life [R17 #14] | info | GTA 6 cars and the real-world models they are based on | N (C12, 21 Oct; after sourced data entry of 121 vehicles) | /gta6/vehicles | /gta6 | ← vehicles page | Share / newsletter | social_share, newsletter_signup |
| 64 | gta 6 characters [EB-110, R17 #9] | info | GTA 6 Characters: Jason, Lucia and every confirmed cast member | L | 12 character pages | /gta6 | → character pages | Newsletter | newsletter_signup |
| 65 | gta 6 online [EB-112, R17 #27] | info | Does GTA 6 have online at launch? What Rockstar has confirmed | N | ledger | /gta6 | ← row 69 | Follow GTA 6 | game_followed |
| 66 | gta 6 ps5 pro vs ps5 / 30fps [EA-118, R17 #23–24] | commercial | GTA 6 on PS5, PS5 Pro and Xbox Series X\|S: frame rate and resolution, what's confirmed | N (update at launch) | glossary rows 38–39 | /gta6 | → row 39 | Newsletter | newsletter_signup |
| 67 | gta games in order [EB-020, R17 #40] | info | Every GTA game in order, and which to play before GTA 6 | S (series page `/games/series/grand-theft-auto`, slug to confirm) | C50 YouTube pilot (12 Nov) | /gta6 | ← hub, row 70 | Add the series to your shelf | shelf_add |
| 68 | gta 6 collectibles map / trophies [R17 #34, #37] | tool | GTA 6 map progress tracker (C11) and GTA 6 trophy list (once published) | N (19 Nov) | row 61 | /gta6 | ← launch-week articles | Sign in to save progress | registration_complete, library_connected |
| 69 | gta 6 confirmed or rumour [R17 §2, C07] | info | GTA 6: confirmed or rumour? The weekly ledger | S (ledger block in row 56) | F03 | /gta6 | ← F03 social | Newsletter | newsletter_signup |
| 70 | games like gta 6 [R17 #39] | discovery | Games like GTA 6 to play while you wait | N (F18) | row 67 | /gta6 | → game pages | Add to shelf | shelf_add |
| 71 | gta 6 mods rules [R17 #38] | info | What Rockstar's new modding rules mean for GTA 6 | N | — | /gta6 | ← modding news | Newsletter | newsletter_signup |

### 5.5 P5 Industry data (hubs: `/data/*` (new), `/studios`)

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 72 | game studios closed 2026 [R06 trend 1] | info | Game studios closed in 2026: the tracker, with the games affected | N (C22, 14 Oct, weekly) | F17 Studio Watch | /data/studios-closed-2026 | ← Xbox news; → /studios/{slug} | Monthly data newsletter | newsletter_signup |
| 73 | xbox layoffs 2026 which studios [R06 Q60] | news-info | Xbox's 2026 restructuring: every studio and game affected so far | N | row 72 | /data/studios-closed-2026 | → studio pages | Monthly data newsletter | newsletter_signup |
| 74 | busiest release weeks 2026 [C20] | info | Release Congestion Index 2026: the most crowded weeks to launch a game | N (7 Oct) | row 1 | /data/release-congestion-2026 | ← F01; → /calendar | Monthly data newsletter | newsletter_signup |
| 75 | why did gta 6 take so long [C23] | info | Why GTA 6 took 13 years: how long sequels take now | N (4 Nov) | series pages | /data | ← /gta6; → row 67 | Monthly data newsletter | newsletter_signup |
| 76 | $80 games list [C24] | info | The $80 Tracker: every game priced at $80 or more | N (11 Nov) | row 58 | /data | ← GTA editions | Wishlist | shelf_add |
| 77 | best value games 2026 [C25] | commercial | Best value games of 2026: cost per hour of play | N (23 Nov; needs time-to-beat terms check) | Black Friday pages | /data | ← row 112 | Connect a library | library_connected |
| 78 | rarest steam achievements [EB-089, C26] | info | Achievement difficulty by genre: what 500 Steam games tell us | N (8 Dec) | — | /data | → /steam | Connect Steam | library_connected (steam) |
| 79 | game developers in bosnia / balkan game studios [C21] | info | World Atlas of Game Studios, with the Balkan game-dev census | N (28 Oct) | /studios/country/ba | /data/studio-atlas | → country pages | Monthly data newsletter | newsletter_signup |
| 80 | best-selling games of 2026 [R06 trend 26] | info | Best-selling games of 2026 so far, with the sources for every figure | N | row 72 | /data | → game pages | Add to shelf | shelf_add |

### 5.6 Game clusters beyond GTA and WoW

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 81 | modern warfare 4 system requirements [EA-086] | info | Modern Warfare 4 system requirements: minimum and recommended PC specs | S (game page) + MW4 launch guide (C17) | row 22 | MW4 launch guide | ← CoD news; → rows 22, 38 | Remind me: 23 Oct | reminder_set |
| 82 | modern warfare 4 release time [EA-098, EB-145] | info | What time does Modern Warfare 4 unlock? (campaign early access 16 Oct, launch 23 Oct) | S | row 4 | MW4 launch guide | ← F01 | Remind me | reminder_set |
| 83 | modern warfare 4 crossplay switch 2 [EA-070, EB-102] | info | Is Modern Warfare 4 crossplay on Switch 2? Platforms, crossplay and progression | S | /switch-2 | MW4 launch guide | ← row 15 | Add to shelf | shelf_add |
| 84 | which call of duty should i get [R06 Q10, trend 9] | commercial | Modern Warfare 4 or an older Call of Duty: which one to buy | N | row 85 | MW4 launch guide | → row 85 | Add to shelf | shelf_add |
| 85 | call of duty games in order [EB-010] | info | Every Call of Duty game in order | S (series page) | row 84 | /games/series/call-of-duty | ← MW4 guide | Add the series to your shelf | shelf_add |
| 86 | is modern warfare 4 on game pass [EA-094] | info | Section "Is Modern Warfare 4 on Game Pass?" (not day one [R05]) | S | row 5 | MW4 launch guide | ← row 6 | Add to shelf | shelf_add |
| 87 | modern warfare 4 best settings [EA-050] | how-to | Modern Warfare 4 best PC settings (only if tested on our own hardware) | N (conditional) | row 81 | MW4 launch guide | → row 38 | PC fixes newsletter | newsletter_signup |
| 88 | gears of war games in order [F09] + gears e-day game pass/requirements [EA-094, EA-091] | info | Gears of War games in order, before E-Day (plus game-page sections) | S | C16 | /games/series/gears-of-war | ← E-Day news (6 Oct) | Add the series to your shelf | shelf_add |
| 89 | minecraft switch 2 [R05, 27 Oct] | info | Minecraft on Switch 2: what changes on 27 October, and whether you pay again | N | row 15 | /switch-2 | ← row 15 | Remind me | reminder_set |
| 90 | monster hunter wilds switch 2 [EB-126] | info | Monster Hunter Wilds on Switch 2 (4 December): performance, crossplay and what's included | N | row 15 | /switch-2 | ← row 15 | Remind me | reminder_set |
| 91 | pikmin 4 switch 2 edition [R05, 12 Nov] | commercial | Pikmin 4 Switch 2 Edition: is the upgrade worth it? | N (F10) | row 12 | /switch-2 | ← row 15 | Add to shelf | shelf_add |
| 92 | dragon's dogma 2 switch 2 [R05, 9 Oct, reported] | info | Where-to-play section on Dragon's Dogma 2 (Switch 2 and Dark Arisen) | S | — | /switch-2 | ← F01 | Remind me | reminder_set |
| 93 | ff7 remake games in order [EB-003 variant] | info | Final Fantasy VII Remake trilogy in order: what to play before Revelation | S (series page, Dec) | row 94 | /games/series/final-fantasy-vii | ← FF news | Remind me: 8 Apr 2027 | reminder_set |
| 94 | ff7 revelation release date [R05] | info | Final Fantasy VII Revelation: release date, platforms and editions | S (game page) | row 93 | /games/series/final-fantasy-vii | ← row 93 | Remind me | reminder_set |
| 95 | fable release date / is fable on ps5 [R05, EA-085] | info | Fable (2027): release date, platforms and Game Pass | S (game page) | row 96 | /calendar | ← row 6 | Remind me: 23 Feb 2027 | reminder_set |
| 96 | fable games in order [F09] | info | Every Fable game in order, before Fable (2027) | S (series page, Q1) | row 95 | /games/series/fable | ← row 95 | Add the series to your shelf | shelf_add |
| 97 | persona games in order [EB-009] | info | Persona games in order: do you need to play them in sequence? | S (series page, Nov) | row 98 | /games/series/persona | ← row 98 | Add the series to your shelf | shelf_add |
| 98 | persona 4 revival release date [R05] | info | Persona 4 Revival: release date, platforms and Game Pass | S (game page) | row 97 | /games/series/persona | ← row 6 | Remind me: 18 Feb 2027 | reminder_set |
| 99 | pokemon games in order [EB-120] (selective) | info | Pokémon games in order: every mainline generation | S (series page) | Pokémon Winds & Waves game page (2027, date TBA) | /games/series/pokemon | ← /switch-2 | Add the series to your shelf | shelf_add |
| 100 | yakuza games in order [EB-004] | info | Yakuza and Like a Dragon games in order, and where to start | S (series page) | Stranger Than Heaven (15 Jan 2027) | /games/series/yakuza | ← RGG news | Add the series to your shelf | shelf_add |

Also as F09 series pages in the Saturday queue, no extra rows needed beyond the page itself: Kingdom Hearts [EB-005], Resident Evil [EB-002], God of War [EB-011] (Laufey 16 Feb 2027), Tomb Raider (12 Feb 2027), Metro (4 Feb 2027), Monster Hunter [EB-021], Metroid (28 Jan 2027).

### 5.7 Evergreen discovery and backlog cluster (hubs: `/backlog-advisor`, `/games`)

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 101 | what game should i play next [EB-128, EA-106] | tool | What should I play next? Pick from the games you already own | L→ public guest mode (D-037) | row 102 | /backlog-advisor | ← rows 102–106 | Connect a library | library_connected, tool_run (backlog) |
| 102 | how to clear gaming backlog [EB-134] | info | How to clear your gaming backlog without buying anything | N | row 101 | /backlog-advisor | → row 101 | Run the Backlog Advisor | tool_run (backlog) |
| 103 | hidden gem games [EB-136] | commercial | Hidden gems: highly rated games almost nobody has played (weekly, F05) | N (living list) | `/games/hidden-gems` data | /games | ← F05 posts | Add to shelf | shelf_add |
| 104 | games like baldur's gate 3 [EB-129] | commercial | Games like Baldur's Gate 3: RPGs to play next, and where to play them | N (F18) | similar-games data | /games/genre/rpg | → game pages | Add to shelf | shelf_add |
| 105 | games like elden ring [EB-130] | commercial | Games like Elden Ring: soulslikes worth your time | N (F18) | Phantom Blade Zero page | /games | → game pages | Add to shelf | shelf_add |
| 106 | games like stardew valley / hollow knight [EB-131, EB-132] | commercial | Games like Stardew Valley (then: Games like Hollow Knight) | N (F18) | — | /games | → game pages | Add to shelf | shelf_add |
| 107 | easiest platinum trophies ps5 [EB-084] | comm-info | Easiest PS5 platinum trophies, and roughly how long each takes | N | achievement import | /games/platform/playstation | ← row 78 | Import your PlayStation library | library_connected (psn) |

### 5.8 Seasonal clusters (Q4 fixed calendar [R05])

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 108 | steam autumn sale 2026 [C05, R05] | commercial | Steam Autumn Sale 2026 (1–8 October): the wishlisted games worth buying | N (live 1 Oct) | F16 Deal Radar | /steam | ← F01, newsletter | Connect Steam to see your wishlist picks | library_connected (steam) |
| 109 | steam next fest october 2026 demos [C18, R05] | info | Steam Next Fest October 2026: the demo tracker, updated daily | N (F23, 19–26 Oct) | daily diary posts | /steam | ← Discord, F01 | Remind me when it releases | reminder_set |
| 110 | steam scream fest / horror games on sale [C19] | commercial | Steam Scream V Fest: horror games worth buying, picked from our database | N (26 Oct) | /games/genre/horror | /steam | ← row 111 | Add to shelf | shelf_add |
| 111 | halloween events games 2026 [R05, 31 Oct] | info | Halloween 2026 events in live games, with dates confirmed by each publisher | N | — | /calendar | → row 110 | Newsletter | newsletter_signup |
| 112 | black friday 2026 console and game deals [C31, R05] | commercial | Black Friday 2026: what counts as a real games deal after this year's price rises | N (20 Nov, live to 30 Nov) | row 77, price history | /steam | ← newsletter; → row 113 | Wishlist + price alert (D-027) | shelf_add (wishlist) |
| 113 | cyber monday game deals [C32] | commercial | Cyber Monday 2026: game deals checked against price history | N (30 Nov) | row 112 | /steam | ← row 112 | Wishlist + price alert | shelf_add (wishlist) |
| 114 | the game awards 2026 nominees / predictions [C29, R05] | info | The Game Awards 2026 nominees, and the TechPlay prediction league | N (/awards/2026, 18 Nov) | F20 live blog | /awards/2026 | ← Discord, newsletter | Join the prediction league | registration_complete |
| 115 | game awards 2026 time / live [F20, 10 Dec] | news | The Game Awards 2026 live: every reveal and winner | N (live blog 10 Dec) | "every trailer" roundup 11 Dec | /awards/2026 | → game pages | Add the reveals to your wishlist | shelf_add (wishlist) |
| 116 | steam winter sale 2026 [C34, R05] | commercial | Steam Winter Sale 2026 (17 Dec–4 Jan): picks from your wishlist | N | F16 | /steam | ← newsletter | Connect Steam | library_connected (steam) |
| 117 | best games of 2026 [EB-139 pattern, C30] | commercial | The best games of 2026: our picks and the community's votes | N (Dec) | C30 awards | /awards/2026 | → game pages | Vote (members) | registration_complete |
| 118 | most anticipated games 2027 [C70] | info | Most anticipated games of 2027, with the dates we can confirm | N (21 Dec) | rows 93–100 | /calendar | → game pages | Remind me (per row) | reminder_set |
| 119 | new switch 2 what to buy [R05 25 Dec] | commercial | Just got a Switch 2? The first games to get and the settings to change | N (22 Dec) | rows 16, 19 | /switch-2 | ← row 16 | Build your shelf | shelf_add |
| 120 | gift ideas for gamers [C33] | commercial | Gift ideas built from real wishlists | N (1 Dec) | wishlist share | /lists | ← newsletter | Share your wishlist | social_share |

### 5.9 Launch guide cluster (only games the team plays [R08])

| # | Query [src] | Intent | Target page (exact title) | St. | Supporting | Hub | Links (← / →) | CTA | Conversion |
|---|---|---|---|---|---|---|---|---|---|
| 121 | does control resonant have new game plus [R06 Q1] | info | Does Control Resonant have New Game Plus? (Game Club, October, C38) | N | Game Club thread | /forum | ← Discord Game Club | Join Game Club on Discord | discord_join |
| 122 | phantom blade zero pc requirements [EA-091 pattern, R05 29 Oct] | info | Section "Can your PC run Phantom Blade Zero?" + launch verdict (F24) | S | Verdict | game page | ← row 105 | Remind me: 29 Oct | reminder_set |
| 123 | path of exile 2 1.0 changes [EB-140, R05 11 Dec reported] | info | Path of Exile 2 1.0: what changes on 11 December | N | link out to build sites | /steam | ← F01 | Add to shelf | shelf_add |
| 124 | dawn of war iv system requirements [EA-091 pattern, R05 3 Dec] | info | Section "Dawn of War IV PC requirements" + Verdict | S | Verdict | game page | ← F01 | Remind me | reminder_set |

**Row count: 124 mapped rows** (19 P1, 16 P2, 7 glossary, 12 P3, 17 P4, 9 P5, 20 game, 7 evergreen, 13 seasonal, 4 launch guides).

---

## 6. Programmatic templates

[R09] ranks the template families among its 30 best bets (EA-085, EA-101, EA-091, EB-103, EB-133, EB-022, EB-150) and warns in the same breath that mass-producing them across the long tail repeats the thin-page problem. This section is how we take the first half of that advice without the second.

### 6.1 Rules

1. **Sections, not URLs.** Every per-game template is an H2 section on the canonical `/games/{slug}` page ("Where to play Fable", "What time does Modern Warfare 4 unlock?"). No `/games/{slug}/file-size` style URLs. Exceptions: series order lives on the existing `/games/series/{slug}` page; "games like X" gets a standalone guide only for titles with editor-written picks (F18).
2. **Demand list only.** A section is filled only for titles on the wave list (§6.3). Nothing is generated for the other 332,000 games.
3. **Sourced and dated.** Each filled fact carries a source link and a "Checked {date}" line. No source, no section.
4. **Hide when empty.** A section with no data does not render. No "Unknown" blocks, no filler text, no AI-written paragraphs.
5. **Answer first.** The first sentence of the section answers the question ("Yes. Fable is on PS5, PC and Xbox, and on Game Pass from day one.").
6. **Filling a section counts as signal S-e** (§2.2), so a wave title is always in the indexable set.
7. **Structured data:** keep `VideoGame`; question-style sections may carry FAQ markup, but we do not count on a rich result (eligibility to be checked in Google's documentation before DEV builds it).

### 6.2 Template specifications

| Template | Query pattern [src] | Where it renders | Data source and status | Minimum to publish | CTA → event | Owner / effort |
|---|---|---|---|---|---|---|
| Where to play | is [game] on pc / ps5 / switch 2 / game pass [EA-085, EA-094] | `/games/{slug}` H2 "Where to play {Game}" | Platforms array and store links exist (store links on ~48k games [R09]); subscriptions: **no data source** [RESEARCH-COMPLETE gap 10] → manual monthly entry for wave titles | Platforms confirmed by store link or publisher; subscription status with month checked | Wishlist / Import your library → shelf_add, library_connected | DEV S (render + fields); W2 via F08 (2 titles/week) + wave entry |
| Release time | what time does [game] unlock [EA-097, EA-098, EA-099] | Game page H2 for titles releasing within 14 days; GTA 6 gets `/gta6/release-time` (D-018) | New fields: unlock time, time zone, "global simultaneous or midnight local", source URL | Publisher or store statement; otherwise the section says only the date | Remind me → reminder_set | DEV S; W1 on F01 Monday |
| File size | [game] file size, pre-load [EA-101, EB-114] | Game page H2 "How big is {Game}?" | New per-platform size fields + source; Switch 2 key-card note [EA-017] | Size from a platform store listing or publisher | Remind me / Add to shelf → reminder_set | DEV S; W2 wave entry |
| Requirements | can I run [game], [game] system requirements [EA-091, EA-086] | Game page H2 "Can your PC run {Game}?" | Steam appdetails requirements: **coverage UNKNOWN** [R09 EA-091] → DEV measures first (Stage 0 query) | Minimum and recommended from the store or publisher | Remind me / PC fixes newsletter → reminder_set, newsletter_signup | DEV S (render from existing data); links to glossary rows 36–40 |
| Crossplay | is [game] crossplay [EB-103, EA-072] | Game page H2 "Is {Game} crossplay?" | New fields: crossplay yes/no/partial, platforms, cross-progression, source | Publisher statement; multiplayer games only | Add to shelf → shelf_add | DEV S; W2 wave entry |
| Games like | games like [game] [EB-133] | Game page already shows 8 similar games [R09]; standalone F18 guide for wave titles | `similar_games` exists; editor picks and one line each for F18 | ≥6 picks, each with where to play and one sentence written by us | Add to shelf → shelf_add | W2 1.5 h/week (F18) |
| Series order | [series] games in order [EB-022] | `/games/series/{slug}` (canonical) | Series relations exist [R09]; add editor intro (150–250 words), release vs story order toggle, where-to-play per entry | Intro written + order checked against publisher/Wikipedia | Add the whole series to your shelf → shelf_add | W1 via F09 (2.5 h/week); DEV S for "add series" button and toggle |

**New fields (D-021e, DEV M ~10 h, 12–23 Oct):** `unlock_at` + `unlock_tz` + `unlock_scope`, `file_size_{platform}`, `crossplay` (enum) + `crossplay_platforms` + `cross_progression`, `subscriptions` (json: service, tier, from, to, checked_at), `template_source_urls` (json), `template_checked_at`. Add them to `GameResource` and to `locked_fields` so the store aggregator never overwrites editor data. Update the Baza section of `docs/README.md` in the same commit.

### 6.3 The demand list and waves

**Wave 1 — 50 titles, filled 5–31 Oct (TARGET).** Chosen from verified research lists only: the Q4 release calendar [R05 §1], Steam's weekly most-played and most-wishlisted [R05 §6], and the spine's Q1 dates.

- Q4 releases (27): Minecraft Dungeons II, Ghost of Yōtei Complete Edition, Ace Combat 8, Gears of War: E-Day, Dragon's Dogma 2 (Dark Arisen / Switch 2), Planet Zoo 2, Enshrouded, Castlevania: Belmont's Curse, Final Fantasy Resonance, Switch Sports Resort, Once Human, Call of Duty: Modern Warfare 4, Minecraft (Bedrock on Switch 2), Phantom Blade Zero, World of Warcraft (Forever), Stellar Blade Complete Edition, Pikmin 4, Metaphor: ReFantazio, Grand Theft Auto VI, Football Manager 27, Warhammer 40,000: Dawn of War IV, Dragon Quest Monsters: The Withered World, Xenoblade Chronicles 3, Rayman Legends Retold, Monster Hunter Wilds, Professor Layton and the New World of Steam, Path of Exile 2.
- Steam most-played (10): Counter-Strike 2, Dota 2, PUBG: Battlegrounds, WARDOGS, Apex Legends, Slay the Spire 2, Marvel Rivals, Deadlock, Grand Theft Auto V Enhanced, Total War: WARHAMMER III.
- Steam most-wishlisted and Q1 2027 (13): Fable, Light No Fire, Total War: WARHAMMER 40,000, Resident Evil Veronica, Witchbrook, Metro 2039, Persona 4 Revival, Final Fantasy VII Revelation, Stranger Than Heaven, Metroid Ravenous, God of War Laufey, Tomb Raider: Legacy of Atlantis, Kingmakers.

Which templates apply: requirements only for PC titles; crossplay only for multiplayer titles; release time only inside the 14-day window; file size when a store lists it.

**Wave 2 — +100 titles, November.** Criteria in order: (a) games with a TechPlay article or guide linked since 28 Sep; (b) November–February releases passing `Notability`; (c) the 50 games most often on member shelves (from `user_games`); (d) any game URL in Search Console with impressions but no template (EIC export).

**Wave 3 — +150 titles, December.** Driven by Search Console: game URLs ranked by impressions for question queries ("pc", "crossplay", "size", "time"). **Cap: 300 titles by 31 Dec (TARGET)**, reviewed by EIC before any expansion to 500 in Q1.

**Effort (ESTIMATE):** about 20 minutes per title for where-to-play, crossplay and file size together → 50 titles ≈ 17 h, carried by W2 at 4 h/week through October; waves 2–3 at the same rate plus DEV-imported requirements.

---

## 7. Game and platform hubs

Built on the D-032 hub template (DEV M). **Standard hub anatomy:** H1 naming the thing as people search it; a 150–250-word dated intro written by us; "Updated {date}: {what changed}" line; key-facts table; links to every child page and to the relevant `/games/*` facet; server-rendered latest articles (not client-only); one tool block; one CTA block (Discord invite https://discord.gg/wPQG9gUMXH, newsletter, connect library); short FAQ.

| Hub | Launch | Pages at launch | Recurring updates | Tool / CTA | Owner, hours | After the peak |
|---|---|---|---|---|---|---|
| `/gta6` (exists) | fixes by 9 Oct (D-017, D-005); release-time tool 14 Oct | Hub, map, characters, vehicles, weapons, Everything We Know + ledger, release-time (N), PC status tracker (N), editions (N) | F03 ledger Thu; F02 daily facts; launch week C10 16–22 Nov | Release-time reminder (C08), map progress tracker (C11) | W1 1.5 h/wk ledger + 2 h/wk upkeep; DEV per D-017/D-018/C11 | Post-launch guides for the team's own play only; Online/PC status tracker stays live into Q1 |
| `/guides/pc-fixes` (C60) | 12 Oct | Hub + rows 22, 31 already live + glossary section | +1 F07 guide per week; glossary every fortnight | PC fixes newsletter segment; links from requirements sections | W1 3 h/wk; DEV 2 h (hub page) | Evergreen; quarterly check of every fix |
| `/switch-2` (C61) | 26 Oct | Hub, rows 11–16, 19, 89–91 | Switch 2 Edition releases from F01; upgrade verdicts (F10) | Remind me on every upcoming row | W1/W2 1 h/wk; DEV via D-032 | Evergreen platform hub |
| `/steam` (C62) | 2 Nov | Hub; Next Fest tracker archive (row 109); sale pages (rows 108, 116); F13 movers archive; rows 3, 31, 33 | F13 weekly; sale pages per Steam event | Connect Steam; wishlist picks | W1 1 h/wk; DEV via D-032 | Evergreen; next events: Next Fest 22 Feb 2027, Spring Sale 18–25 Mar 2027 |
| `/mmo` (C15) | 10 Nov | Hub; rows 43–54; Analyzer block | F15 weekly Readiness Check; patch days | WoW Analyzer run | W1 1 h/wk; DEV via D-032; EIC copy on Analyzer (D-040) | Evercold (Jan 2027); The Last Titan (late 2027) |
| Modern Warfare 4 launch guide (C17) | 12 Oct | One pinned guide "Modern Warfare 4: release time, requirements, crossplay and editions" + game-page sections rows 81–86 | Daily updates 16–30 Oct | Remind me; Secure Boot guide | W1 3 h (launch-guide slot) | Folded into `/games/series/call-of-duty` on 1 Nov; guide stays, updated monthly |
| FF7 Revelation and Fable pre-release | series pages in December; game-page sections in Wave 1 | Rows 93–96 | Monthly | Remind me (8 Apr / 23 Feb 2027) | W1 via F09 | Full hubs only if Q1 data (impressions) justifies them |
| `/data` index (P5) | 7 Oct with C20 | Rows 72–80 as published | Per data campaign | Monthly data newsletter | EIC | Ongoing |

---

## 8. Editorial mix (Part 14)

### 8.1 Capacity assumptions

| Person | Weekly hours (ESTIMATE, spine §1) | Production hours in this plan | The rest goes to |
|---|---|---|---|
| EIC (Adi Zeljković) | 40 | **22** | PR and data outreach, partnerships, OpenCritic prep, paid tests, editing others |
| W1 (Nenad Divljaković, ED core) | 30 of ED's 40 | **30** | — |
| W2 (contributor pool, inside ED's 40) | 10 of ED's 40 | **10** | — |
| **Total editorial production** | | **62** | |

If W2 is unavailable in a week, drop W2's rows in this order: pillar news, F18, F08; W1 absorbs nothing extra. Video production, social, the newsletter and Discord are SC/DS hours and are not counted here; writers supply scripts only.

### 8.2 Weekly balance

Today: ~24 news items a week, mostly rewrites, all published 17:30–21:30 CET; no reviews since 8 Jul; 4 guides in total [R02 §7, R08]. The balance below keeps output at about 26 pieces a week but changes what they are.

| Type | Definition for TechPlay | Count / week | Hours each | Hours / week | Owner | Share of 62 h |
|---|---|---|---|---|---|---|
| News, pillar-filtered | P1–P5 story passing the added-value test (§8.5); 400–700 words; 3–5 links; primary source linked | 7 (W1 5, W2 2) | 1.25 | 8.75 | W1, W2 | 14% |
| Breaking | Fast short version (150–250 words) within 60 minutes of a P1–P5 announcement, updated in place with an "Updated" line | 3 | 0.75 | 2.25 | W1 | 4% |
| News franchises | F01 Out This Week, F13 Steam Movers, F17 Studio Watch, F03 Confirmed or Rumour (to 19 Nov) | 4 | 1–2 | 5.5 | W1 | 9% |
| Evergreen | F07 Fix It Friday, glossary (fortnightly), F09 In Order series page, F05 Hidden Gem, F18 Games Like, cross-game lists (rows 5–9, 18) | 4.5 | 1–3 | 9.25 | W1, W2 | 15% |
| Templates | F08 Where Can I Play It (2 game-page sections) + wave data entry (§6.3) | 2 + wave | 1 / 20 min per title | 6 | W2 | 10% |
| Launch guides | One per week for a game the team is playing (MW4, GTA 6 launch, Phantom Blade Zero, Game Club title) | 1 | 3 | 3 | W1 | 5% |
| Hub upkeep | GTA 6 data pages, `/switch-2`, `/steam`, `/mmo` intros and "Updated" lines | — | — | 2 | W1 | 3% |
| Features | One explainer or analysis a week in a pillar ("what it means for you"), 1,000–1,500 words | 1 | 4 | 4 | EIC | 6% |
| Reviews (Verdict, F24) | Launch verdict of 600–900 words within 72 hours of launch, grows into a full review later; score only when the full review lands | 1 | 6 | 6 | EIC | 10% |
| Worth It in 2026? (F10) | Short verdict on a game or hardware people ask about | 1 | 1.5 | 1.5 | EIC | 2% |
| Interviews | Balkan studios (C21, C55) and Next Fest indies (C71); 1,000–1,200 words | 0.5 | 3 | 1.5 | EIC | 2% |
| Original reporting | Documents, surveys, own questions to companies; e.g. what Sony's disc survey asked players (C66) | 0.5 | 3 | 1.5 | EIC | 2% |
| Data journalism | C20–C27 datasets with DEV queries; one piece every two weeks on average | 0.5 | 10 | 5 | EIC (+DEV queries) | 8% |
| Video scripts | Three 45–60 second scripts: Out This Week, GTA 6 countdown, Fix It Friday (C49); production by SC/DS | 3 | 0.5 | 1.5 | W1 | 2% |
| Editing, titles, Discover checklist, orphan check | File 14 §10 checklist on every Discover-intended piece; §9 title rules | — | — | 3 | EIC 2.5, W1 0.5 | 5% |
| Buffer | Corrections, updates, launch surprises | — | — | 1.25 | W1 | 2% |
| **Total** | | **≈26 pieces** | | **62** | | 100% |

Against [R08]'s proposed mix: news ~27% of hours (proposed ~25%), evergreen + templates + launch guides 29% (~25%), data + reporting + interviews 13% (~15%), reviews 12% (~10%). Hub upkeep looks low at 3% because GTA ledger time sits in news franchises and template time in its own row. Community formats (~10% in [R08]) belong to SC.

### 8.3 Weekly publishing grid

Slots are Sarajevo local time: CEST until Sun 25 Oct, CET after. **M 08:30** = EU morning (02:30 ET). **D 14:30** = 08:30 ET, the US East Coast morning. **E 19:00** = 13:00 ET, EU evening and US lunchtime. Between 25 Oct and 1 Nov the US offset is 5 hours instead of 6. M and weekend pieces are written the working day before and scheduled in Filament; `articles:publish-scheduled` runs every minute through the model, so revalidation, IndexNow, the Discord push and `sitemap-news.xml` all fire (fixed 29 Aug 2026, CLAUDE.md). **B** = breaking, any time 07:00–23:00, pillar stories only.

| Day | M 08:30 | D 14:30 | E 19:00 | Also that day (not writers) |
|---|---|---|---|---|
| Mon | F01 Out This Week (W1, written Fri) | Pillar news (W1) | Pillar news (W1) | F11 What Are You Playing? (SC); personalised releases email from 26 Oct (C41) |
| Tue | F08 Where Can I Play It #1 (W2, scheduled Mon) | F13 Steam Movers (W1) | Interview (EIC, odd weeks) / pillar news (W2, even weeks) | F15 Readiness Check (SC, WoW reset day) |
| Wed | F10 Worth It in 2026? (EIC, scheduled Tue) | Data story (EIC, per C-date) or F17 Studio Watch (W1) | Pillar news (W1) | F12 Poll of the Week (SC) |
| Thu | F05 Hidden Gem Thursday (W1, scheduled Wed) | F24 Verdict (EIC) | F03 Confirmed or Rumour (W1, to 19 Nov) / pillar news (W1, after) | F04 The Number (SC) |
| Fri | F07 Fix It Friday (W1, scheduled Thu) | Feature / explainer (EIC) | Pillar news (W2) | F21 The Save File newsletter (SC) |
| Sat | F09 In Order series page (W1, scheduled Fri) | F08 Where Can I Play It #2 (W2, scheduled Fri) | B only | F04 The Number (SC) |
| Sun | F18 Games Like (W2, scheduled Fri) | Original reporting (EIC, even weeks, scheduled Fri) | B only | F14 Buffy's Weekly Wrap (SC, 20:00) |

Launch-guide weeks: the launch guide takes the D or E pillar-news slot on the day before or the day of release. Glossary pieces take the Fri M slot on alternate weeks when the F07 queue has a finished fix guide ready for the following week.

### 8.4 Named slots, weeks 40–44 (28 Sep–1 Nov)

| Date | Slot | Piece (working title) | Owner | Campaign / row |
|---|---|---|---|---|
| Mon 28 Sep | M | Out this week: Minecraft Dungeons II, Ghost of Yōtei Complete Edition, Ace Combat 8, and the Steam Autumn Sale | W1 | C04, F01 |
| Wed 30 Sep | D | PS Plus Essential games for October 2026 (on reveal; reported date) | W1 | row 7 |
| Thu 1 Oct | D | Steam Autumn Sale 2026 (1–8 October): the wishlisted games worth buying | W1 | C05, row 108 |
| Thu 1 Oct | E | GTA 6: confirmed or rumour? The weekly ledger (first edition) | W1 | C07, row 69 |
| Fri 2 Oct | M | How to move Steam games to another drive without downloading them again | W1 | F07, row 31 |
| Fri 2 Oct | D | Xbox's 2026 restructuring: every studio and game affected so far | EIC | row 73 |
| Sat 3 Oct | M | Gears of War games in order, before E-Day | W1 | C63, C16, row 88 |
| Sun 4 Oct | M | Games like Elden Ring: soulslikes worth your time | W2 | F18, row 105 |
| Mon 5 Oct | E | WoW patch 12.1.5: expected timing and what to check before it lands (labelled predicted) | W1 | C13, row 46 |
| Wed 7 Oct | D | Release Congestion Index 2026: the most crowded weeks to launch a game | EIC | C20, row 74 |
| Thu 8 Oct | D | Gears of War: E-Day Verdict (first Verdict; C52 starts this week) | EIC | C52, F24 |
| Fri 9 Oct | M | How to enable Secure Boot and TPM 2.0 for anti-cheat games like Battlefield 6 | W1 | F07, row 22 |
| Sat 10 Oct | M | Every Call of Duty game in order | W1 | C63, row 85 |
| Mon 12 Oct | M | Modern Warfare 4: release time, requirements, crossplay and editions (launch guide, updated daily to 30 Oct) | W1 | C17, rows 81–86 |
| Mon 12 Oct | — | `/guides/pc-fixes` hub live | W1 + DEV | C60 |
| Wed 14 Oct | D | Game studios closed in 2026: the tracker, with the games affected | W1 | C22, row 72 |
| Wed 14 Oct | E | GTA 6 release time: when it unlocks in your time zone (tool live) | W1 + DEV | C08, row 55 |
| Fri 16 Oct | M | Shader compilation stutter: what causes it and every fix that works | W1 | F07, row 20 |
| Sat 17 Oct | M | Every GTA game in order, and which to play before GTA 6 | W1 | C63, row 67 |
| Mon 19 Oct | D | Steam Next Fest October 2026: the demo tracker, updated daily (to 26 Oct) | W1 + SC | C18, F23, row 109 |
| Wed 21 Oct | D | GTA 6 cars and the real-world models they are based on | W1 | C12, row 63 |
| Fri 23 Oct | M | Windows 11 gaming settings checklist: Game Mode, Memory Integrity, HAGS and Xbox Mode | W1 | F07, row 21 |
| Sat 24 Oct | M | Resident Evil games in order | W1 | C63, [EB-002] |
| Mon 26 Oct | D | Halloween 2026 events in live games, with dates confirmed by each publisher | W2 | C19, row 111 |
| Mon 26 Oct | E | Steam Scream V Fest: horror games worth buying, picked from our database | W1 | C19, row 110 |
| Mon 26 Oct | — | `/switch-2` hub live | W1 + DEV | C61 |
| Tue 27 Oct | D | Minecraft on Switch 2: what changes on 27 October, and whether you pay again | W2 | row 89 |
| Wed 28 Oct | D | World Atlas of Game Studios, with the Balkan game-dev census | EIC | C21, row 79 |
| Wed 28 Oct | E | WoW: Forever, Classic or Midnight: which World of Warcraft should you play? | W1 | C14, row 45 |
| Thu 29 Oct | D | Phantom Blade Zero Verdict | EIC | F24, row 122 |
| Fri 30 Oct | M | DXGI_ERROR_DEVICE_REMOVED and DEVICE_HUNG: what the crash means and how to fix it | W1 | F07, row 23 |

November and December follow the same grid with the campaign anchors in the spine: C15 `/mmo` 10 Nov, C23 4 Nov, C24 11 Nov, C10 GTA 6 launch week 16–22 Nov (all slots GTA-first; F09/F18 paused), C25 23 Nov, C31/C32 Black Friday and Cyber Monday, C26 8 Dec, TGA live blog 10 Dec, C34 Winter Sale 17 Dec, C70 21 Dec.

### 8.5 The added-value test (before any news piece is written)

A story is written only if it belongs to P1–P5 **and** at least one of these is true. The writer names which in the Filament "change summary" field.

1. **Our data:** the database adds something (platforms, release history, studio history, series, member shelves, Steam ranks).
2. **Primary source:** we read the original (filing, patch notes, publisher post, earnings call), link it, and report a detail others left out.
3. **Reader question answered:** the piece answers "when / where / how much / will it run / does it affect my library" for P1–P4 readers.
4. **Original quote or document** we obtained ourselves.

If none applies, the story goes to Discord `#news` as a one-line link by SC, not to the site.

### 8.6 Do not waste effort on

| Do not | Evidence | Instead |
|---|---|---|
| General tech and phones (iPhone, WhatsApp, Windows redesigns without a gaming angle, AI energy) | 3 of 22 recent items; `/hardware` promises benchmarks and runs phone news [R02 §7.2, R08 §3] | P2 PC fixes and gaming hardware settings |
| Genshin Impact guides | 3 of 4 guides; Game8, Icy Veins and the wiki own the results [R03 §4, R08] | Guides only for games the team plays |
| Reviews published 16–21 days after launch with no new angle | WoW Midnight, Crimson Desert, Diablo IV reviews all late; SERPs owned by IGN, PC Gamer, GameSpot [R08 §1] | Verdict within 72 h; full review later; "30 days later" when member hours exist |
| Commodity rewrites of stories 20 outlets already ran | 0 of 751 Google News results; Discover demotes shallow coverage [R03 §6, R07] | Added-value test §8.5 or Discord link only |
| Codes pages (Roblox, Fortnite, daily answers) | RPS guides index template #10 "do not copy" [R08 §2]; Roblox "not worth resources" [R05 §4] | — |
| Build guides and tier lists for live-service games | Maxroll, Icy Veins, Mobalytics update per patch [R09 "What not to chase"] | WoW via the Analyzer only; link out |
| Mass templates across the long tail | Scaled-content policy; 295k thin pages already [R03 §9, R09 exec 7] | Wave list, 300-title cap (§6.3) |
| Pokémon type charts, Minecraft mechanics, EA FC SBCs, Fortnite season timers | Serebii, Bulbapedia, Minecraft Wiki, FUTBIN own them; Fortnite dates are community timers [R05 §4, R18] | Series order and Switch 2 questions only |
| Esports results without an owner | No esports section or owner [R05 §7] | One results line in F01 if a pillar game is involved |
| Conference coverage filed as gaming news (4 of 22 items were Weekend.19) | [R02 §7.2] | At most one piece per event, filed under Industry, with a games-business angle |
| Trailer-reaction posts with nothing added | Commodity; fails §8.5 | Add to the game page's video block; F01 mention |

---

## 9. Title and meta rules

**Rules (apply from 28 Sep; EIC checks every Discover-intended piece, W1 every other piece)**

| # | Rule | Why |
|---|---|---|
| T1 | Every article gets a hand-written `meta_title` of at most 60 characters before " \| TechPlay". The H1 may be longer and more natural; the OG title is the H1 | Two live titles are cut mid-sentence [R02 §8.1] |
| T2 | If a title is generated, it is cut at the last whole word, never mid-word (DEV, C02) | Same |
| T3 | Entity first, spelled the way people search it: "GTA 6" in the title, "Grand Theft Auto VI" in the H1 or description | Query forms in [R17] §3 |
| T4 | State the key fact when there is one: date, platform, price, score, unlock time | Answer-first pages; AI summaries take the rest [R08 §6] |
| T5 | No number we cannot back. Counts come from the API (games) or are left out; never members, "thousands", "#1", "biggest" | False claims [R23 A3]; spine §2 |
| T6 | No promise of content that does not exist: "benchmarks", "expert", "global", "leading", "most complete" | `/hardware`, `/reviews`, `/about` titles [R02 App. A] |
| T7 | Years only when the page is updated for that year; facet titles take the current year from the date, never a hard-coded "2026" | [R01] F10 |
| T8 | One separator style, " \| TechPlay", once. Author and shop titles lose the doubled brand | [R01] A.4.1 |
| T9 | Rumours say so in the title: "reportedly", "rumour", "predicted" | Discover and News trust (file 14) |
| T10 | Reviews: "{Game} review: {verdict phrase} ({score}/10)". Verdicts: "{Game} Verdict: {verdict phrase}". Guides: the question or the task. News: subject, verb, concrete detail | Review titles lose to "X Review - IGN" [R03 §10] |
| T11 | Meta description 140–160 characters: the answer first, then one supporting fact. Never store or press copy, never a CTA | GTA VI page uses store pre-order text [R03 §5] |
| T12 | "(Updated)" never goes in the title; updates are shown on the page (file 14 §8) | Honest freshness |

**Before and after**

| # | Page | Before (live, 27 Sep) | After | Owner |
|---|---|---|---|---|
| 1 | Crimson Desert review | Crimson Desert - review | Crimson Desert review: {verdict phrase from the conclusion} ({review_score}/10) | EIC |
| 2 | GTA 6 collector's set news | GTA 6 is getting a $400 Collector's Set which does not | GTA 6's $400 collector's set doesn't include the game | W1 |
| 3 | Wolverine GPS aids news | Now you can turn off GPS aids in Marvel's Wolverine for side | Marvel's Wolverine update lets you turn off GPS aids | W1 |
| 4 | Windows 11 look (hardware) | Windows 11 is finally getting a more modern look | No rewrite: off-pillar. Keep live; do not publish this kind of story again (§8.6) | — |
| 5 | GTA VI game page | Grand Theft Auto VI (2026) \| TechPlay + pre-order store text as description | Title: GTA 6 (Grand Theft Auto VI): release date, platforms, price \| TechPlay. Description: Out 19 November 2026 on PS5 and Xbox Series X\|S. $79.99, or $99.99 for the Ultimate Edition. No PC version at launch. | W1 + DEV (D-005) |
| 6 | `/games` | Video Game Database \| Search 140,000+ Titles & Specs \| TechPlay | Video Game Database: {N}+ games, release dates and platforms \| TechPlay (N from the API, rounded down to the thousand) | DEV |
| 7 | Author page | Articles by Adi Zeljković - TechPlay \| TechPlay | Adi Zeljković, Editor-in-Chief \| TechPlay | DEV (D-030) |
| 8 | WoW Analyzer | WoW Character Analyzer — Free Midnight Readiness Score & Gear Check \| TechPlay | WoW Character Checker: free gear and Mythic+ readiness score \| TechPlay (H1: Check your WoW character's gear and readiness) | EIC + DEV (D-040) |
| 9 | `/news` | Gaming News 2026 \| Breaking Headlines & Industry Updates \| TechPlay | Gaming News: Releases, Platforms, PC and Industry \| TechPlay | EIC (PageSeo) |
| 10 | `/reviews` | Game Reviews 2026 \| Expert Scores & Performance Benchmarks \| TechPlay | Game Reviews and Verdicts \| TechPlay (description without "benchmarks" or "140,000+") | EIC (PageSeo) |
| 11 | `/hardware` | Hardware Reviews 2026 \| GPU, CPU & PC Component Benchmarks \| TechPlay | PC Gaming Hardware, Settings and Fixes \| TechPlay | EIC (PageSeo) |
| 12 | `/guides` | Pro Gaming Guides, Strategy Walkthroughs & Tips \| TechPlay | Gaming Guides: PC Fixes, Series Order and Where to Play \| TechPlay | EIC (PageSeo) |
| 13 | Genre facets | Best Action Games in 2026 \| TechPlay (hard-coded year) | Best Action Games, Ranked ({current year}) \| TechPlay | DEV |
| 14 | `/about` and `/contact` | About TechPlay \| Expert Gaming News & Tech Media Team; "global media team responds within 24 hours" | About TechPlay: who writes it and how we work \| TechPlay; "we reply within two working days" (matches the Contact page) | EIC |
| 15 | `/rating-system` | Game Review Rating System \| Transparent Scoring Methodology \| TechPlay ("hardware-integrated benchmarks… 140,000+ titles") | How We Score Games: The TechPlay Rating System \| TechPlay | EIC |
| 16 | `/gta6` hub | Empty H1; description "The most complete GTA 6 resource online… Updated weekly" | H1: GTA 6 hub: map, characters, vehicles and release facts. Description: Interactive map with 1,058 locations, 12 characters and 121 vehicles, plus a weekly ledger of what's confirmed. Out 19 November 2026. | W1 + DEV (D-017) |
| 17 | WoW addons guide | Top World of Warcraft: Midnight addons to use in 2026 | Best WoW Midnight Addons in 2026 (add "checked for 12.1.5" only after re-checking every addon post-patch) | W1 |

Good practice to keep: the Tim Schafer piece uses a sharper SEO title ("Tim Schafer blames gaming layoffs on corporate greed") than its H1 [R02 §8.1]. That split is the pattern T1 asks for.

---

## 10. Measuring SEO work

No click targets are set while the baseline is 1–2 clicks a day. Targets are on work shipped and on leading indicators. Search Console access is assumed for EIC; none of its data was available to the research [R03].

| Metric | Formula / source | Cadence | TARGET (work, not traffic) |
|---|---|---|---|
| Plumbing done | D-002, D-003, D-005, D-006, D-022, D-023, titles 1–17 live | weekly | All by 9 Oct |
| Retained-set index rate | GSC indexed URLs in retained game set ÷ URLs in retained set | weekly from Stage 2a | Rising week on week after 26 Oct |
| Crawl focus | Googlebot hits on retained game pages ÷ all Googlebot hits on `/games/` (nginx logs) | weekly | > 0.5 by 30 Nov |
| Cluster impressions | GSC impressions for pages in each cluster §5.1–5.9 (page groups by URL list) | weekly | Reported per cluster; no target until 4 weeks of data |
| Query coverage | Mapped queries (§5) with ≥1 GSC impression ÷ mapped queries | monthly | Reported; baseline set in November |
| Conversion per page type | (reminder_set + shelf_add + library_connected + newsletter_signup + tool_run) ÷ pageviews ×1,000, by cluster (GA4 events, D-007) | weekly from C03 | Reported; compare clusters to reallocate hours in December |
| Template coverage | Wave titles with ≥2 sections filled ÷ wave titles | weekly | 50 by 31 Oct; 300 by 31 Dec |
| Orphans | New pages with 0 internal links after 7 days | weekly | 0 |
| Mix adherence | Hours by type vs §8.2 (writers log in the change summary) | weekly | Within ±20% |

---

## Dependencies and open questions

**Dependencies**

- D-021 needs an EIC decision on Fri 2 Oct and a Search Console export for the safety list; without GSC access the Stage 2 batches do not start.
- D-021e (template fields), D-018 (release-time tool), D-032 (hub template), D-037 (public Backlog Advisor), D-010 (related module and CTA block) and D-016 (guest reminder modal) are DEV items this plan relies on; DEV has 20 h a week across the whole backlog, so hub launches slip if P0 items run long. The P0 plumbing in §3 comes first.
- C03 measurement (D-007, D-008) must be live before §10 conversion metrics mean anything.
- The GTA 6 map is presented only with attribution settled (D-020); vehicle real-world data (C12) needs editorial entry first because `vehicle_class` and `real_equivalent` are empty (spine §0).
- Newsletter CTAs assume `/newsletter` (D-012) and a PC-fixes segment in the newsletter desk.
- Subscription catalogues (Game Pass, PS Plus) have no data source; they stay manual for wave titles only.

**Open questions**

1. Is W2 a real, steady 10 hours a week? If not, the template waves shrink first (§8.1).
2. Search Console: which reasons does it give for the 338,358 not-indexed URLs? The answer may change the Stage 2 thresholds.
3. How many games have Steam requirement data today (EA-091 coverage is UNKNOWN)?
4. Does the game bundle include guides in "News & reviews" (UNVERIFIED [R01] F03)? If not, guides do not count toward S-a until it does.
5. IGDB licence (research risk C16): if the imported descriptions must be replaced, the indexable rule may need an "own description" signal sooner.
6. Does EIC want esports covered at all? This plan assumes no.
7. Series slugs in §5 (`grand-theft-auto`, `call-of-duty`, `persona`…) are indicative; confirm against `game_series` before linking.
8. Conflict noted with the spine: none found. One nuance: spine C52 says Verdict "weekly from 6 Oct"; this plan publishes the first Verdict on Thu 8 Oct, inside that week.
