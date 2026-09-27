# 22 — Digital PR: data campaigns, pitches and the press room

Status: Phase 2 plan — 27 Sep 2026
Part 25 of the growth plan. Research inputs: R04, R05, R06, R10, R13, R14 (all 60 candidates, §4–§6), R15, R17, R18, R23. Campaign IDs follow the spine (C20–C27 are the PR spine; extra items use sub-IDs such as C20a). Owners: EIC, ED, SC, DS, DEV.

- **The only PR currency TechPlay has is data it owns.** Sites that earn links without paying for them own a dataset people need to cite (SteamDB, HowLongToBeat, GameDiscoverCo, TwoAverageGamers) [R14 §1]. TechPlay's defensible tables are release dates with `release_precision` at 333k scale, 57,630 studios with country/founded/parent, series spans and critic scores [R14 §2].
- **32 campaigns, PR-01 to PR-32**, run from 30 Sep 2026 to 31 Mar 2027. Eleven are priority A, including all eight spine PR campaigns (C20–C27). 18 use only data already in the database; 5 need a public API pull; 9 need editorial logging or a log that starts in October.
- **Gates come first.** No journalist gets a pitch until the false claims are gone (C01), `/press` and `/about/ownership` exist (C54, D-038), the EIC has an author page with a contact route, and the IGDB licence question has been put to IGDB in writing (see §2). A journalist who checks "15K+ members" and finds 60 does not come back [R23 A3].
- **Every campaign lives on a permanent URL updated in place**, with a methodology block above the fold, medians where the tail is long, a CSV, a changelog and a "cite this" line [R14 §5]. Numbers come from a query run on publication day and re-run by a second person [R14 §6].
- **Distribution is direct.** GamesPress does not carry releases from websites [R14 §1.8], so distribution is one-to-one pitches to named writers found on their own bylines, Reddit OC posts under each subreddit's rules, stat cards (F04 The Number), and the free Qwoted tier (2 pitches a month) [R14 §1.6].
- **Two research assumptions do not survive a look at the code**, and the plan is adjusted: `game_tombstones.reason` exists but records TechPlay's own catalogue clean-ups (`deleted`, purge reasons), not store delistings, so "The Vanished Catalogue" (R14 #12) cannot be built from it; and `hype_score` measures store-page completeness (40 points per store, 2 per screenshot, 15 for a trailer), so "Hype vs Reality" (R14 #39) is dropped (§15).
- **Capacity:** about 14 hours a week across the team in Q4 (EIC 8, DEV 3, DS 2, SC 1), inside the 135-hour envelope. One major piece every one to two weeks, never two majors in one week.
- **KPIs are links and citations, not reach.** Baseline referring domains are unknown today [R14 gaps]; the first task is to record them on 28 Sep so every later number has something to be compared with.

---

## 1. Starting position (what a journalist will see)

| Fact | Consequence for PR | Source |
|---|---|---|
| Google clicks 1–2 a day since the 17 Aug Cloudflare block; TechPlay absent from 114 Bing and 751 Google News result pages for its own stories | Nobody finds the data pages by search at first; pitches and Reddit carry the launch | R23 A1–A2 |
| Register page claims "15K+ MEMBERS · 50K+ GAMES"; WoW Analyzer claims "50K+ players analyzed · 4.9/5" | Any journalist can falsify these in ten seconds; C01 must be finished before the first pitch | R23 A3, R02 |
| No press page; `/marketing` sells "Global reach" with no numbers; Impressum names Luminor Solutions (Sarajevo) as publisher and owner | `/press` and `/about/ownership` must state plainly who owns and pays for TechPlay | R02, R15 §1 |
| GamesPress does not publish releases from games websites | No wire; pitches are one-to-one | R14 §1.8 |
| 60 registered members, 13 connected accounts, 160 Discord members | No member-derived statistic is publishable (thresholds in §3) | R14 §2, §6; R13 |
| No backlink baseline in the research | Record it before PR-02 goes out | R14 gaps |

## 2. Gates before the first pitch

| # | Gate | Owner | Due | Blocks |
|---|---|---|---|---|
| G1 | C01 Trust Reset complete: no "15K+", "50K+", "140,000+", "thousands of fans", "4.9/5" anywhere (D-001) | DEV/EIC | Fri 2 Oct | Every pitch |
| G2 | `/press` stub live (full version with C54 on 9 Oct): who we are, owner, contact, live catalogue count from the API, data campaigns list, cite-this line, logo files (spec in 24 §3) | EIC 2 h, DEV 2 h | Tue 6 Oct | PR-02 pitches |
| G3 | `/about/ownership` (C54, D-038): owner (Luminor Solutions per Impressum), funding (ads, affiliate if any), AI policy (what AI is used for, e.g. the WoW Analyzer tips via Groq, and what it is never used for), corrections policy | EIC | Fri 9 Oct | Trade press pitches from 9 Oct |
| G4 | EIC author page (`/author/adi-zeljkovic` exists) gets a bio, beat list and a contact route; this is the "named analyst" journalists quote [R14 §5.6] | EIC 1 h | Tue 6 Oct | All |
| G5 | Data page template `/data/<slug>`: title, dek, hero chart, methodology block, results table, CSV link, "cite this", changelog, "last updated" | DEV 8 h, DS 3 h | Mon 5 Oct | PR-02 onward |
| G6 | Chart template (DS): phone-width, source line printed on the image, TechPlay mark in the corner, two crops (1200×675 and 1080×1350) | DS 3 h | Fri 2 Oct | All |
| G7 | IGDB licence question sent to IGDB (partner address published in IGDB's API docs, R14 §6; message text in 24 §6 M11). Until answered, any campaign that uses IGDB-derived fields (studio country/founded/parent, series, `time_to_beat`, popularity) names IGDB as a source and carries IGDB's visible attribution | EIC | Mon 28 Sep | PR-05 to PR-09, PR-13, PR-19, PR-21 onward |
| G8 | Backlink baseline: export Search Console "Links → Top linking sites" and save it dated 28 Sep | EIC 0.5 h | Mon 28 Sep | KPIs |
| G9 | D-020 gtadb.org provenance answered before any map-based claim | EIC | before PR-05 | PR-05 (map only) |
| G10 | Logging starts: D-033 release-date change log (weekly diff of `releases:sync`), launch-price capture for PR-10, store-link removal log (new, see PR-24) | DEV 6 h | Mon 19 Oct | PR-11, PR-10, PR-24, PR-32 |

**Schedule tension (flagged):** the spine publishes C20 on 7 Oct and C54 on 9 Oct. This plan keeps the C20 page and Reddit/social launch on 7 Oct, sends the trade pitches on the morning of 7 Oct only if G2 and G4 are live, and otherwise holds pitches to Fri 9 Oct.

## 3. Methodology standard (acceptance test for every campaign)

Built from the traits of pieces that earned links [R14 §5] and TechPlay's own accuracy history [R14 §6]. A campaign that fails any line does not ship.

1. **One permanent URL, updated in place.** The 2026 congestion page becomes the 2027 page through a changelog, not a new URL (Tom's Hardware GPU hierarchy model).
2. **Methodology block above the fold:** source tables, date and time the query ran, filters, exclusions, the definition of "notable", n, and what the data cannot say.
3. **Medians, not means,** whenever the distribution has a long tail (release counts, studio sizes, completion rates).
4. **CSV for every chart,** plus the SQL in plain text on the page (collapsed). Anyone can re-run the logic.
5. **One chart that works at phone width,** source printed on the image, because the image travels without the article.
6. **A named analyst.** Byline Adi Zeljković (EIC) with an author page; quotes attributed to him by name.
7. **"Cite this" line** on the page and in every pitch (§4).
8. **A hook date,** chosen from the fixed calendar [R05]: Steam sales and fests, GTA VI on 19 Nov, Black Friday 27 Nov, The Game Awards 10 Dec, Next Fest 22 Feb 2027.
9. **Disclose exclusions,** the way the first-party analytics report already prints how many bot hits it excluded [R14 §5.9].
10. **Two-person rule.** The number on the page comes from a query run on publication day by DEV and re-run by EIC or ED from the committed SQL. If the two differ, nothing ships until they agree [R14 §6].
11. **Upstream credit.** Every page names where the rows came from: Steam, PlayStation, Xbox, Nintendo, GOG and Epic catalogues for release data; IGDB for studio metadata, series, time-to-beat and popularity; OpenCritic and Metacritic for critic scores; Steam Web API for achievement percentages. Scraping SteamDB or HowLongToBeat is ruled out (SteamDB forbids it; HowLongToBeat prohibits reproduction) [R14 §1.2, §6].
12. **Member data thresholds.** No statistic derived from members until (a) the Terms allow aggregate anonymised use, (b) n ≥ 500 members overall, (c) every published cell has at least 20 members, (d) no per-game figure where fewer than 20 members own the game [R14 §6]. None of these is met today.
13. **Traffic only as an index.** First-party analytics cannot count unique visitors by design; any traffic-derived chart is pageviews or an index (100 = a reference day), never "users" [R14 §6].
14. **Corrections.** A visible "Corrected on [date]: [what changed]" line in the changelog, and an email to every journalist who cited the old number.
15. **Hand-check named entities.** Any campaign that names companies (publishers, studios, series) hand-verifies the top 20–50 entries against a primary source, because relation quality from the August 2026 IGDB import is unmeasured [R14 §6].

### "Notable release" definition v1 (used by PR-02, PR-11, PR-12, PR-14, PR-18, PR-22, PR-25)

The raw release count is dominated by a long tail of tiny store listings, so every release campaign publishes two numbers, all releases and notable releases [R14 #1].

| Rule | Field | Note |
|---|---|---|
| Day-precise date only | `games.release_precision = 'day'` and `games.released` not null | R14 calls the column `release_date`; the model column is `released` (FACT, `app/Models/Game.php`) |
| Released in the window | `released` between window start and end | ISO weeks for weekly counts |
| Notable | `critic_scores` is not null, OR the game has store links in 2 or more distinct stores in `game_store_links` | R14 #1 |
| Sensitivity check (not the headline) | `popularity` not null | IGDB-derived (FACT, popularity migration); report as a second line only |
| Exclude | Rows removed from the catalogue (they are no longer in `games`), and DLC or bundles if a type field is found | A DLC/type column was not found in the model; UNKNOWN, check before PR-02 |

SQL skeleton (Postgres; committed alongside the page):

```sql
-- Notable, day-precise releases per ISO week, 2026
with links as (
  select game_id, count(distinct store) as stores
  from game_store_links group by game_id
)
select date_trunc('week', g.released)::date as iso_week,
       count(*) as all_day_precise,
       count(*) filter (where g.critic_scores is not null or coalesce(l.stores,0) >= 2) as notable
from games g
left join links l on l.game_id = g.id
where g.release_precision = 'day'
  and g.released >= date '2026-01-01' and g.released < date '2027-01-01'
group by 1 order by 1;
```

## 4. "Cite this" boilerplate and methodology block

Printed on every data page, under every chart in the CSV header, and at the foot of every pitch.

> **Cite this:** TechPlay Games Database (techplay.gg), [N] games, query run [DD Mon YYYY]. Method and CSV: techplay.gg/data/[slug]. Release dates from the Steam, PlayStation, Xbox, Nintendo, GOG and Epic catalogues; studio and series metadata from IGDB; critic scores from OpenCritic and Metacritic.

Short form for image captions: *Source: TechPlay Games Database, [DD Mon YYYY]. techplay.gg/data/[slug]*

Methodology block (template):

> **How we counted.** We counted [unit] in the TechPlay Games Database on [date, time CET]. We included [filters]. We excluded [exclusions and how many rows they removed]. "Notable" means [definition]. n = [N]. What this cannot tell you: [limits, e.g. sales, player counts]. The SQL and the CSV are below. Corrections go to [editorial inbox]; we log every change in the changelog at the foot of this page.

## 5. Campaign calendar (Q4 2026 and Q1 2027)

Priority: A = spine PR or strongest link case; B = cheap follow-up from the same queries; C = light, optional. Effort from R14 (S/M/L).

| ID | Spine | Campaign | Publish | Data status | Effort | Priority | Owner |
|---|---|---|---|---|---|---|---|
| PR-01 | C66 | The Last Disc: what Sony's disc plan means for your library | Wed 30 Sep | have (editorial + petition) | S | B | EIC/SC |
| PR-02 | C20 | Release Congestion Index 2026 | Wed 7 Oct | have | S | A | EIC/DEV |
| PR-03 | C22 | Studios Closed in 2026 tracker | Wed 14 Oct, weekly | needs collection (editorial log) + have | M | A | ED |
| PR-04 | C71a | Next Fest by country: who is demoing, from where | Tue 20 Oct | have + obtainable | S | B | EIC/ED |
| PR-05 | C12 | 121 GTA VI vehicles and the real cars behind them | Wed 21 Oct | needs collection (editorial entry) | M | B | ED |
| PR-06 | C21 | World Atlas of Game Studios | Wed 28 Oct | have (IGDB-derived) | M | A | EIC/DEV |
| PR-07 | C21a | Balkan Game Dev Census | Thu 29 Oct | have (IGDB-derived) | S | A | EIC |
| PR-08 | C21b | Free dataset: studios by country and founding year (CSV, CC BY 4.0) | Wed 28 Oct; v2 Tue 12 Jan | have | S | A | DEV/EIC |
| PR-09 | C23 | Sequel Gap Inflation: why GTA VI took 13 years | Wed 4 Nov | have (IGDB-derived) | M | A | EIC |
| PR-10 | C24 | The $80 Tracker | Wed 11 Nov | needs collection (launch prices) | M | A | ED |
| PR-11 | C20a | The GTA VI shadow: games that moved away from November | Mon 16 Nov | hand-compiled + D-033 log | M | A | ED/EIC |
| PR-12 | C20b | Thursday is the new Tuesday: release weekdays | Tue 17 Nov | have | S | B | DEV/EIC |
| PR-13 | C25 | Best value games of 2026: cost per hour | Mon 23 Nov | have (IGDB `time_to_beat`) + PR-10 prices | M | A | EIC |
| PR-14 | C25a | Do Q4 games score higher? Critic score by release month | Tue 1 Dec | have | S | B | DEV/EIC |
| PR-15 | C26 | Achievement difficulty by genre, 500 Steam games | Tue 8 Dec | obtainable (Steam Web API) + have | M | A | EIC/DEV |
| PR-16 | C22b | Live-service shutdown counter 2026 | Tue 15 Dec | needs collection | M | B | ED |
| PR-17 | C70a | The TBA Index: how many 2027 games have no date | Tue 22 Dec | have | S | B | DEV/ED |
| PR-18 | — (F-year end) | Title word trends: "Simulator", "Remastered", "Souls" | Tue 29 Dec | have | S | C | DEV/SC |
| PR-19 | C22c | Publisher families: who owns whom in our data | ready 30 Nov; fire on next deal; fallback Tue 5 Jan | have (IGDB-derived) | M | B | EIC |
| PR-20 | C27 | State of the Catalogue 2026 | Tue 12 Jan 2027 | have | L | A | EIC |
| PR-21 | C27a | Platform exclusivity map: single-store releases | Wed 20 Jan | have | S | B | DEV/EIC |
| PR-22 | C27b | Which countries make the best-reviewed games? | Wed 27 Jan | have (IGDB-derived + critic scores) | M | B | EIC |
| PR-23 | C27c | Remakes and remasters: share of notable releases by year | Wed 10 Feb | have | M | B | ED |
| PR-24 | C27d | Delisted: games that left the stores (replaces "Vanished Catalogue") | Wed 3 Feb | needs collection from 19 Oct | M | B | DEV/ED |
| PR-25 | C18a | What happened to October's Next Fest demos | Wed 17 Feb | captured 19–26 Oct + have | M | B | ED |
| PR-26 | C26a | Achievement inflation: achievements per game by year | Wed 24 Feb | obtainable (reuses PR-15 pulls) | S | C | DEV |
| PR-27 | C21c | Studio founding waves, 1970–2025 | Wed 3 Mar | have (IGDB-derived) | S | B | DEV/EIC |
| PR-28 | C21d | Studio activity curve: who is still shipping | Wed 10 Mar | have | M | B | EIC |
| PR-29 | C34a | Steam vs GOG: same game, which store is cheaper | Tue 16 Mar | obtainable (snapshots from Nov) | M | C | DEV |
| PR-30 | C34b | Regional price index: the same 50 games in 20 Steam regions | Tue 23 Mar | obtainable (terms UNVERIFIED) | M | C | DEV/EIC |
| PR-31 | C27e | Genre tide chart 2005–2026 | Wed 31 Mar | have | S | B | DEV |
| PR-32 | C20c | Slip rate: six months of date changes | Wed 31 Mar (interim line in PR-20) | needs collection (D-033) | M | B | DEV/EIC |

Rhythm check: in Q4 there is at most one priority-A piece per week, and none in the week of 16–22 Nov except PR-11, which is prepared in October.

---

## 6. Campaign cards

Publication names below are only those that appear in the research (R04, R06, R14). Regional outlets are UNVERIFIED as game-covering outlets [R14 gaps]. "Journalist types" means the beat to look for on bylines, not named people, except where a named analyst appears in R14.

### PR-01 · C66 The Last Disc — Wed 30 Sep (reactive to 15 Oct) — B — EIC/SC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Sony wants to stop making PlayStation discs. Here is what happens to the games you already own** · Alternates: "Will my PS5 discs still work? What Sony has said, and what it has not" · "The Last Disc: a list of what we know about PlayStation's end of physical" |
| Dataset | Not a data campaign. Sony's statements and the player/developer survey as reported (Push Square, Eurogamer, Kotaku, GamesRadar, GamesIndustry.biz) [R06 §6]; the `/last-disc` petition (signature count only if the live API returns one; UNKNOWN today [R10]) |
| Method | A dated ledger of statements, each with a source link; no forecast. Signature count shown live or not at all |
| Targets | Journalist types: Platform/PlayStation news writers; consumer-rights and digital-ownership writers. Publications: Push Square, Eurogamer, Kotaku, GamesRadar+, GamesIndustry.biz (they covered the survey) |
| Hook and timeline | Hook: Sony's disc survey this week [R06]; PS Plus October reveal Wed 30 Sep [R05]. Timeline: Draft Mon 28 Sep; publish Wed 30 Sep; update on each Sony statement to 15 Oct |
| Landing | https://techplay.gg/last-disc |
| Outreach angle | No cold pitch; reply-style use only (Reddit answers, X replies with the explainer link). Pitching a petition to journalists reads as advocacy |
| Social | X/Threads/Bluesky: "What happens to your discs" three-line explainer + link; FB question post; Discord #general poll "Do you still buy discs?" (F12); newsletter C40 issue 1 item |
| SEO value | Question query "will my ps5 discs still work" (R06 #59); internal links to affected game pages |

### PR-02 · C20 Release Congestion Index 2026 — Wed 7 Oct — A — EIC/DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The most crowded weeks for game releases in 2026, counted: week [N] had [N] notable launches** · Alternates: "Autumn 2026 is the busiest release season in [N] years, by our count" · "Everyone said September was crowded. Here are the numbers for every week since 2010" |
| Dataset | `games.released`, `release_precision`, `platforms`, `critic_scores`; `game_store_links.store` (R14 #1, #5) |
| Method | Notable v1 (§3). ISO weeks 2010–2026, both series (all day-precise, notable). Day-level heatmap for 2026 (R14 #5). Median notable releases per week per year as the baseline. n printed per year. Caveats: store listings added after release inflate recent years; release dates for digital storefronts can differ by time zone; 2026 weeks after 7 Oct are "announced", not "released", and are shaded |
| Targets | Journalist types: Industry/business reporters; release-calendar editors; data-minded newsletter writers. Publications: GamesIndustry.biz, GamesBeat, GameDiscoverCo (Simon Carless), GamesRadar+, PC Gamer, Game Informer (all run release lists), Spilled.gg (wrote the June 2026 "most crowded month" piece without a dataset) [R14 §1.4] |
| Hook and timeline | Hook: Steam Autumn Sale 1–8 Oct; the pre-GTA VI crowding (Gears of War: E-Day 6 Oct, MW4 23 Oct, Phantom Blade Zero 29 Oct, WoW: Forever 4 Nov) and Fable's move to 23 Feb 2027 to avoid GTA VI [R05]. Timeline: Query and chart Mon 28 Sep–Fri 2 Oct; second-person re-run Mon 5 Oct; page live Wed 7 Oct 09:00 CET; pitches 09:30 CET; Reddit OC post 15:00 CET (US morning); follow-up Tue 13 Oct |
| Landing | https://techplay.gg/data/release-congestion-2026 (new) |
| Outreach angle | "You list the releases; we counted all of them." Offer a custom cut by platform (Switch 2, PS5) and the CSV. Full pitch: §7 P1 |
| Social | X thread (5 posts: headline stat, heatmap, the quiet weeks, method, link); Bluesky same; Threads single chart; LinkedIn Thu 8 Oct (industry framing); r/dataisbeautiful "[OC]" heatmap with source-and-tool comment; IG carousel (cover, heatmap, top 5 weeks, method, "remind me" CTA to /calendar); Discord #news; F04 The Number Tue 13 Oct; C40 newsletter |
| SEO value | The first `/data/` page; links to /calendar and to the game pages of each week's notable releases, which gives crawlers a path into database pages that carry TechPlay text [R14 §2] |

### PR-03 · C22 Studios Closed in 2026 — Wed 14 Oct, updated weekly (F17 Studio Watch) — A — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Every game studio closed in 2026, with the games they made** · Alternates: "[N] studios closed this year. This is the list, with sources" · "Halo Studios, Ninja Theory and [N] others: the 2026 closures tracker" |
| Dataset | Editorial log (new table or sheet: studio_id, date announced, status closed/closing/merged, source URL, parent at closure) joined to `studios` (country, founded, parent_id) and their games |
| Method | A studio enters only with a primary source (company statement) or two independent reports; "closing" and "closed" are separate states; layoffs without closure are excluded and noted. Median studio age at closure uses `founded` where present; coverage % disclosed |
| Targets | Journalist types: Labour/industry reporters; Xbox/PlayStation platform writers. Publications: GamesIndustry.biz, Game Developer, Aftermath, Eurogamer, VGC, Kotaku, Insider Gaming, Push Square, Pure Xbox |
| Hook and timeline | Hook: Xbox restructuring week: 268 more layoffs, Halo Studios effectively closed, Ninja Theory heading to closure (67 Xbox headlines, 29 layoff/closure headlines in one week) [R06]. Timeline: Build Mon 5–Fri 9 Oct; live Wed 14 Oct; weekly update every Wed with a changelog line |
| Landing | https://techplay.gg/data/studios-closed-2026 (new) |
| Outreach angle | "What happens to the games" is the part news coverage skips [R06 §8]. Full pitch: §7 P2 |
| Social | F17 Studio Watch every Wed: X/Bluesky/LinkedIn post with the week's change; r/Games only as a helpful comment linking the tracker when a closure thread is live; Discord #news |
| SEO value | Links each closed studio's `/studios/[slug]` page and its games; "which games are affected by [studio] closing" queries |

### PR-04 · C71a Next Fest by country — Tue 20 Oct — B — EIC/ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Where October's Steam Next Fest demos come from: [N] countries, [N] from the Balkans** · Alternates: "Next Fest, mapped: the countries behind [N] demos" · "The Balkan studios in this week's Steam Next Fest" |
| Dataset | Next Fest participant list captured 19 Oct (obtainable from the Steam event page) matched to `games` and `studios.country` (R14 #38) |
| Method | Match by store_id; unmatched demos reported as a count; country only where the studio row has one; no quality judgement |
| Targets | Journalist types: Indie beat writers; regional tech editors. Publications: GameDiscoverCo readers (newsletter), Game Developer; regional: Netokracija, Bug.hr, Benchmark.rs, klix.ba (all UNVERIFIED) |
| Hook and timeline | Hook: Steam Next Fest 19–26 Oct [R05]. Timeline: Capture Mon 19 Oct; publish Tue 20 Oct; regional pitches same day |
| Landing | Article on /news, linked from https://techplay.gg/studios/country/ba and, once live, /steam (new, C62) |
| Outreach angle | Regional: "Local studios in Valve's showcase this week, with their demos." |
| Social | F23 Next Fest Diary tie-in; X/Bluesky map card; Discord #next-fest; regional FB post in English |
| SEO value | Studio and game pages for demo titles; /studios/country/* pages |

### PR-05 · C12 GTA VI vehicles and their real-world equivalents — Wed 21 Oct — B — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **All 121 confirmed GTA VI vehicles, and the real cars they are based on** · Alternates: "GTA VI's cars, matched to real ones (with the trailer frame for each)" · "The real-world garage of Leonida" |
| Dataset | `gta6` vehicles (121 names); `vehicle_class` and `real_equivalent` are EMPTY and need editorial entry [spine §0] |
| Method | Each match needs a source: official Rockstar media timestamp or screenshot; confidence label per row (clear match / likely / unknown). No leaked footage [R17 §10] |
| Targets | Journalist types: GTA/Rockstar news writers; car-culture writers. Publications: Dexerto, Insider Gaming, GamesRadar+ (runs a GTA 6 franchise page); car press crossover (type only, named in R14 #35 as "Jalopnik-type") |
| Hook and timeline | Hook: GTA VI on 19 Nov; r/GTA6 detail-spotting culture [R17 §4]. Timeline: Data entry 5–16 Oct (ED 10 h); publish Wed 21 Oct |
| Landing | https://techplay.gg/gta6/vehicles |
| Outreach angle | Low-key pitch only to GTA beat writers; value is Reddit and social |
| Social | IG carousel "Real car / GTA car" pairs; F02 countdown days use one vehicle each; r/GTA6 only if rules allow link posts (UNKNOWN) |
| SEO value | "gta 6 cars real life" rated High in R17 §3 |

### PR-06 · C21 World Atlas of Game Studios — Wed 28 Oct — A — EIC/DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Where the world's game studios are: 57,000+ studios mapped by country, and per million people** · Alternates: "Which country has the most game studios per person? We counted" · "The map of game development, from Sweden to Bosnia" |
| Dataset | `studios` (57,630 rows): `country` (numeric ISO), `founded`, `parent_id`, `developed_count`, `published_count`; World Bank population (obtainable) (R14 #7) |
| Method | Count studios with ≥1 developed game; report `country is null` share first (UNKNOWN until queried) and exclude it from rates; per-million with a minimum of 20 studios per country; "studio" ≠ "active studio" stated in the dek; hand-check the top 20 countries' largest studios |
| Targets | Journalist types: Data journalists; national tech press; industry newsletter writers. Publications: GamesIndustry.biz, Game Developer, GamesBeat; r/dataisbeautiful (community); national outlets in top-ranked countries (identify at publication, UNVERIFIED) |
| Hook and timeline | Hook: Industry contraction story (Xbox closures) gives "where the industry actually lives" a reason now [R06]; C55 Balkan push in November. Timeline: Queries 5–16 Oct; hand-checks 19–23 Oct; re-run Mon 26 Oct; publish Wed 28 Oct with PR-08 CSV |
| Landing | https://techplay.gg/data/studio-atlas (new) |
| Outreach angle | "Nobody publishes studios by country at this scale; here is the CSV." Full pitch: §7 P3 |
| Social | r/dataisbeautiful choropleth [OC]; X/Bluesky map + per-million top 10; LinkedIn Thu 29 Oct; IG carousel (map, top 10, per-million, Balkans, CSV); Discord; newsletter |
| SEO value | 250-odd `/studios/country/[iso]` pages get a reason to be linked and crawled |

### PR-07 · C21a Balkan Game Dev Census — Thu 29 Oct — A — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The Balkan game industry in one list: [N] studios, [N] games, the oldest founded in [year]** · Alternates: "Every game studio in Bosnia and Herzegovina, Croatia, Serbia, Slovenia, North Macedonia and Montenegro" · "Made in the Balkans: [N] games from [N] studios" |
| Dataset | `studios` where country in BA 070, HR 191, RS 688, SI 705, MK 807, ME 499, AL 008, BG 100, RO 642, GR 300 (Kosovo has no ISO numeric code; check how the import stored it, UNKNOWN); their games (R14 #8, #46) |
| Method | Small numbers: present as a directory plus facts, not trends; every studio row checked by hand (EIC knows the region); corrections form linked |
| Targets | Journalist types: Regional tech and business editors; games-industry association communicators. Publications: Netokracija, Bug.hr, Benchmark.rs, klix.ba, N1 (all UNVERIFIED as game-covering); EGDF (association, not press) |
| Hook and timeline | Hook: PR-06 the day before; C55 Balkan partnerships in November. Timeline: Hand-check 12–23 Oct; publish Thu 29 Oct; BCS-language pitch versions written by EIC |
| Landing | https://techplay.gg/studios/country/ba plus a census section on /data/studio-atlas |
| Outreach angle | "A Sarajevo publication counted the region's studios; here is the list and a badge for studios." Full pitch: §7 P4 |
| Social | FB and LinkedIn in English with a BCS first comment; Discord #balkan (if created in C35); IG carousel per country |
| SEO value | Regional queries; studio sites linking back through the embeddable badge (R14 #56, see 24 §5) |

### PR-08 · C21b Free dataset: studios by country and founding year — Wed 28 Oct (v2 Tue 12 Jan) — A — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Download the TechPlay studio dataset: 57,000+ studios with country and founding year, free under CC BY 4.0** · Alternates: "An open list of the world's game studios" · "The studio table behind our atlas, as a CSV" |
| Dataset | `studios`: name, slug, country (ISO alpha-2 and numeric), founded (year only), parent slug, developed_count, published_count, TechPlay URL. No descriptions (IGDB text) [R14 #54] |
| Method | Details in §8. Licence decision depends on G7 (IGDB answer) |
| Targets | Journalist types: Data journalists; academics; dataset curators. Publications: Community channels first (r/datasets, Kaggle as a mirror); trade press only as a line in PR-06 pitches |
| Hook and timeline | Hook: PR-06 publication. Timeline: Build with PR-06; v2 adds per-year release aggregates on 12 Jan with PR-20 |
| Landing | https://techplay.gg/data/studio-atlas#download |
| Outreach angle | Included in PR-06 and PR-20 pitches, not pitched alone |
| Social | One X/Bluesky post; r/datasets post; LinkedIn |
| SEO value | Datasets turn one article into long-lived citations (R14 §4.11) |

### PR-09 · C23 Sequel Gap Inflation — Wed 4 Nov — A — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Why GTA VI took 13 years: the gap between sequels has grown from [N] to [N] years** · Alternates: "Big franchises now wait [N] years between main entries. In the 2000s it was [N]" · "The longest waits between sequels, 1990–2026" |
| Dataset | `game_series` (series_key, first_year, last_year, games_count), `game_relations`, `games.released` (R14 #24, #25) |
| Method | Main entries only (exclude remasters, ports, DLC via relation type; list the rule); series with ≥3 main entries; median gap by decade of the earlier entry; hand-verify the top 50 series; GTA line from the verified entries only. Caveat: series membership comes from the IGDB import and is unmeasured [R14 §6] |
| Targets | Journalist types: Feature and culture writers; GTA beat writers; mainstream tech desks. Publications: GamesRadar+, PC Gamer, Eurogamer, VGC, Dexerto, Insider Gaming, Game Informer |
| Hook and timeline | Hook: GTA VI on 19 Nov; Game Informer cover story (26 Sep) [R17]. Timeline: Series verification 12–30 Oct (ED 8 h); chart 2 Nov; publish Wed 4 Nov |
| Landing | https://techplay.gg/data/sequel-gap (new, not in spine §7 — proposed) with a link from /gta6/everything-we-know |
| Outreach angle | The GTA hook for people who have written the "why so long" piece already. Full pitch: §7 P5 |
| Social | X thread with the gap chart; IG carousel "longest waits"; F09 In Order tie-in; r/Games self-post only if rules allow (UNKNOWN) |
| SEO value | Links to series pages (F09/C63) and to /games/grand-theft-auto-vi |

### PR-10 · C24 The $80 Tracker — Wed 11 Nov — A — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **How many of 2026's big releases cost $79.99? We logged every launch price** · Alternates: "The $80 game is here: [N] of [N] major 2026 releases launched at $79.99 or more" · "Standard, deluxe, ultimate: what 2026's launch editions cost" |
| Dataset | New launch-price log: game, store, edition, price in USD and EUR, date captured, source URL; captured from G10 onward for new launches, backfilled by hand for Jan–Sep from publisher store pages (R14 #17) |
| Method | "Major release" defined transparently (list of publishers or store-page criteria, published); base edition price as the headline; edition ladder as a second chart; region stated. Caveat: backfilled prices depend on archived store pages |
| Targets | Journalist types: Consumer/pricing writers; business reporters (the $80 debate was live in TechRadar, GameSpot, Operation Sports [R14 §1.4]). Publications: GameSpot, GamesRadar+, PC Gamer, Insider Gaming, Dexerto, GamesIndustry.biz |
| Hook and timeline | Hook: GTA VI at $79.99 / $99.99 Ultimate on 19 Nov [R17]. Timeline: Backfill 12 Oct–30 Oct (ED 10 h); publish Wed 11 Nov; update at each major launch |
| Landing | https://techplay.gg/data/80-dollar-tracker (new, proposed) |
| Outreach angle | A living list writers can cite at every launch. Full pitch: §7 P6 |
| Social | F04 The Number Thu 12 Nov; X/Bluesky/Threads price ladder card; FB question "Would you pay $80?" (F12 poll) |
| SEO value | Price queries per game; game pages gain a launch-price line |

### PR-11 · C20a The GTA VI shadow — Mon 16 Nov — A — ED/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The GTA VI shadow: the games that moved out of November, and where they went** · Alternates: "Fable, and [N] others: every release that dodged GTA VI" · "November 2026 has [N] notable releases. November 2025 had [N]" |
| Dataset | Hand-compiled list of announced date changes with sources (Fable to 23 Feb 2027 is sourced [R05]); D-033 change log from 19 Oct; notable counts for Oct–Dec 2026 from PR-02 |
| Method | A game counts only if a publisher statement or store page shows the old and new dates; "moved away" means moved out of 1–30 Nov; motive is never claimed unless the publisher said it |
| Targets | Journalist types: GTA beat writers; release-calendar editors. Publications: Insider Gaming, Dexerto, GamesRadar+, VGC, Eurogamer, GamesIndustry.biz |
| Hook and timeline | Hook: GTA VI launch week (C10). Timeline: Compile 19 Oct–6 Nov; publish Mon 16 Nov as an update to the PR-02 page |
| Landing | https://techplay.gg/data/release-congestion-2026#gta-window |
| Outreach angle | Launch-week filler journalists need. Full pitch: §7 P7 |
| Social | X/Bluesky chart "November before and after"; F02 countdown day card; Discord #gta6 |
| SEO value | /calendar and moved games' pages |

### PR-12 · C20b Thursday is the new Tuesday — Tue 17 Nov — B — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **GTA VI launches on a Thursday. So did [N]% of 2026's notable releases** · Alternates: "Release day moved: Tuesday to Thursday and Friday, by platform and decade" · "What day do games come out? 30 years of release weekdays" |
| Dataset | `released`, `release_precision='day'`, `platforms` (R14 #6) |
| Method | Weekday share by year and platform; notable v1; caveat on time zones for digital releases |
| Targets | Journalist types: Podcast hosts and feature writers (a talking point). Publications: GamesRadar+, PC Gamer, Push Square, Nintendo Life |
| Hook and timeline | Hook: GTA VI Thursday 19 Nov. Timeline: Prepared in October; publish Tue 17 Nov |
| Landing | https://techplay.gg/data/release-congestion-2026#weekday |
| Outreach angle | One-paragraph note to writers already covering launch week; no standalone push |
| Social | F04 The Number; X/Threads/Bluesky; r/dataisbeautiful if PR-02 was received well |
| SEO value | "what day do games release" style queries |

### PR-13 · C25 Best value games of 2026: cost per hour — Mon 23 Nov — A — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The best value games of 2026, by price per hour of play** · Alternates: "Cheapest hour in gaming: 2026 releases ranked by dollars per hour" · "Black Friday maths: what each 2026 game costs per hour, at full price and on sale" |
| Dataset | `games.time_to_beat` (IGDB-derived) + PR-10 launch prices + Black Friday prices where captured (R14 #42) |
| Method | Median "normally" time only; minimum submission count if IGDB exposes one (UNKNOWN); exclude live-service and endless games; list price at launch; do not use HowLongToBeat data [R14 §6] |
| Targets | Journalist types: Deals and consumer writers; mainstream shopping desks. Publications: PC Gamer (deals), GamesRadar+, GameSpot, Dexerto |
| Hook and timeline | Hook: Black Friday Fri 27 Nov; C31/C32 deal campaigns [R05]. Timeline: Gated on G7 (IGDB terms); data 2–13 Nov; publish Mon 23 Nov; update 30 Nov with sale prices |
| Landing | https://techplay.gg/data/cost-per-hour-2026 (new, proposed), linked from C32 Deal Radar |
| Outreach angle | A consumer stat with a shopping hook. Full pitch: §7 P8 |
| Social | IG carousel "Top 10 by $/hour"; X/Bluesky card; F16 Deal Radar; newsletter Black Friday special |
| SEO value | Game pages carry a "cost per hour" line; deals hub links |

### PR-14 · C25a Do Q4 games score higher? — Tue 1 Dec — B — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Do games released in autumn review better? Critic scores by release month, 2015–2026** · Alternates: "The Game Awards season effect, measured" · "September games average [N], February games [N]" |
| Dataset | `critic_scores` (OpenCritic, Metacritic), `released` (R14 #40) |
| Method | Median score by month; n per month; caveat that enrichment favours most-viewed games; OpenCritic terms for aggregate republication UNVERIFIED (check before publishing) |
| Targets | Journalist types: Awards-season writers; podcast hosts. Publications: Polygon (runs GOTY predictions), GamesRadar+, Eurogamer |
| Hook and timeline | Hook: The Game Awards Thu 10 Dec; C29 Prediction League. Timeline: Publish Tue 1 Dec |
| Landing | Article on /news linking /awards/2026 (new, C29) |
| Outreach angle | Short note to awards-season writers |
| Social | X/Bluesky chart; Discord #awards prompt |
| SEO value | Low; supports C29 |

### PR-15 · C26 Achievement difficulty by genre, 500 Steam games — Tue 8 Dec — A — EIC/DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Which genres do players actually finish? Completion rates for 500 Steam games** · Alternates: "Only [N]% of players finish the average [genre] game" · "The most-finished and least-finished genres on Steam" |
| Dataset | Steam Web API `GetGlobalAchievementPercentagesForApp` + `GetSchemaForGame` (public; terms UNVERIFIED for this volume) joined to `games.genres` (R14 #18) |
| Method | 500 single-player games with an identifiable "finished the story" achievement; mapping file published; median completion % by genre; n per genre ≥ 20; extends the 19-game TwoAverageGamers piece 25× |
| Targets | Journalist types: Feature writers; player-behaviour and design writers. Publications: PC Gamer, Rock Paper Shotgun, GamesRadar+, Eurogamer, Game Developer; r/patientgamers (community) |
| Hook and timeline | Hook: Year-end "games you never finished" season; Steam Winter Sale 17 Dec. Timeline: Mapping by ED 2–27 Nov (12 h); pulls by DEV (4 h); publish Tue 8 Dec |
| Landing | https://techplay.gg/data/achievement-difficulty (new, proposed) |
| Outreach angle | A number readers argue about. Full pitch: §7 P9 |
| Social | r/dataisbeautiful and r/patientgamers (rules check); X/Bluesky; IG carousel by genre; Discord poll "Which game did you not finish?" |
| SEO value | Game pages gain a completion line; "how many people finish [game]" long tail |

### PR-16 · C22b Live-service shutdown counter 2026 — Tue 15 Dec — B — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **[N] online games shut down in 2026. Median time from launch to shutdown: [N] months** · Alternates: "The 2026 live-service graveyard, with dates" · "How long did 2026's shut-down games last?" |
| Dataset | Editorial log (game, announcement date, shutdown date, type: servers off / delisted / online features removed, source) + `games.released` (R14 #13) |
| Method | Definitions printed; each entry sourced; counts by type |
| Targets | Journalist types: Preservation and industry writers. Publications: Kotaku, Aftermath, Eurogamer, GamesIndustry.biz; preservation orbit (Delisted Games, Video Game History Foundation) named in R14 #12 |
| Hook and timeline | Hook: Year-end lists. Timeline: Log maintained weekly from 14 Oct with PR-03; publish Tue 15 Dec |
| Landing | https://techplay.gg/data/studios-closed-2026#live-service |
| Outreach angle | Note to writers of year-end industry recaps |
| Social | X/Bluesky; F17 |
| SEO value | Game pages marked "shut down" with date |

### PR-17 · C70a The TBA Index — Tue 22 Dec — B — DEV/ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **[N]% of announced 2027 games still have no release date** · Alternates: "2027 is full of games without dates" · "How many of 2027's most anticipated have a day, a month, or just a year?" |
| Dataset | `release_precision` for games with `released` in 2027 or announced for 2027 (R14 #4) |
| Method | Share by precision (day/month/quarter/year) for notable upcoming games; R14's example figure is illustrative only |
| Targets | Journalist types: Year-ahead preview writers. Publications: GamesRadar+, Game Informer, PC Gamer (all run 2027 lists) |
| Hook and timeline | Hook: C70 2027 Most Anticipated (21–31 Dec). Timeline: Publish Tue 22 Dec |
| Landing | https://techplay.gg/data/release-congestion-2026#tba (becomes the 2027 page in January) |
| Outreach angle | Line in the C70 promotion; no standalone push |
| Social | F04; X/Bluesky |
| SEO value | /calendar 2027 months |

### PR-18 · Title word trends — Tue 29 Dec — C — DEV/SC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The rise and fall of "Simulator": words in game titles, 1990–2026** · Alternates: "When did every game become a 'Remastered'?" · "Souls, Legends and colons: 36 years of game titles" |
| Dataset | `games.name`, `released` (R14 #28) |
| Method | Share of titles per year containing a word; all releases, not notable only; stated |
| Targets | Journalist types: Light features. Publications: Community first (r/dataisbeautiful); no press push |
| Hook and timeline | Hook: Quiet news week between Christmas and New Year. Timeline: Publish Tue 29 Dec |
| Landing | Article on /news |
| Outreach angle | None |
| Social | r/dataisbeautiful [OC]; X/Threads/Bluesky; IG single image |
| SEO value | Low; brand |

### PR-19 · C22c Publisher families — ready Mon 30 Nov; fire on the next acquisition or closure headline; fallback Tue 5 Jan — B — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Who owns whom: the biggest publisher families in our database** · Alternates: "[Owner] now controls [N] studios in our data" · "The ownership map of games after the EA buyout and the Xbox restructuring" |
| Dataset | `studios.parent_id` tree, `developed_count` (R14 #10) |
| Method | Top 20 trees hand-checked against press releases; stale nodes corrected before publishing; date of check per node |
| Targets | Journalist types: Business reporters. Publications: GamesIndustry.biz, Game Developer, GamesBeat, VGC |
| Hook and timeline | Hook: EA's $55B buyout closed 4 Aug 2026; Obsidian to Bethesda [R05, R06]; next deal. Timeline: Checks 16–27 Nov (EIC 6 h) |
| Landing | https://techplay.gg/data/studio-atlas#owners |
| Outreach angle | Reactive: send within 3 hours of a deal headline with the updated tree |
| Social | X/Bluesky/LinkedIn treemap |
| SEO value | Publisher `/studios/[slug]` pages |

### PR-20 · C27 State of the Catalogue 2026 — Tue 12 Jan 2027 — A — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **State of the Catalogue 2026: what 333,000 games tell us about the year** · Alternates: "2026 in games, counted: releases, studios, closures and prices" · "The TechPlay 2026 report" |
| Dataset | All of the above, re-run on one date (R14 #43) |
| Method | One dated PDF + web page; every chart re-run; peer review by ED and DEV; interim slip-rate line with its n |
| Targets | Journalist types: Industry reporters; newsletter writers; Wikipedia editors (as a source for counts). Publications: GamesIndustry.biz, GamesBeat, Game Developer, GameDiscoverCo, Game File |
| Hook and timeline | Hook: January is when annual reports land (GDC's State of the Industry lands in January [R14 §1.4]). Timeline: Draft 7–18 Dec; freeze 4 Jan; re-run 8 Jan; publish Tue 12 Jan |
| Landing | https://techplay.gg/data/state-of-the-catalogue-2026 (new, proposed) |
| Outreach angle | The document that lets everything else be cited as "per TechPlay's 2026 report". Full pitch: §7 P10 |
| Social | X thread; LinkedIn Thu 14 Jan; Bluesky; IG carousel of five charts; newsletter |
| SEO value | Highest-authority page; links to every /data page |

### PR-21 · C27a Platform exclusivity map — Wed 20 Jan — B — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **[N]% of 2026's releases are on one store only** · Alternates: "Steam-only, PlayStation-only, Switch-only: 2026's single-store games" · "How exclusive is exclusive in 2026?" |
| Dataset | `game_store_links.store` (R14 #14, #48) |
| Method | Lower bounds because link coverage is uneven (Steam far denser); stated |
| Targets | Journalist types: PC and platform writers. Publications: PC Gamer, Rock Paper Shotgun, Push Square, Pure Xbox, Nintendo Life |
| Hook and timeline | Hook: GTA VI launched without PC [R17]. Timeline: Publish Wed 20 Jan |
| Landing | https://techplay.gg/data/state-of-the-catalogue-2026#platforms |
| Outreach angle | Platform-specific cuts for each outlet |
| Social | X/Bluesky; r/pcgaming comment context only |
| SEO value | Platform facet pages |

### PR-22 · C27b Which countries make the best-reviewed games? — Wed 27 Jan — B — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Which countries make the best-reviewed games? Median critic score by developer country** · Alternates: "Poland, Japan, Sweden: the countries behind the highest-rated games" · "Critic scores by country, minimum 30 games" |
| Dataset | `critic_scores`, `studios.country` via developer (R14 #11) |
| Method | Minimum 30 scored games per country; median; big selection-bias caveat (OpenCritic covers a subset; enrichment favours most-viewed games) in the dek, not the footer |
| Targets | Journalist types: National press in top countries; curiosity desks. Publications: r/dataisbeautiful; national outlets (identify at publication, UNVERIFIED) |
| Hook and timeline | Hook: None fixed; evergreen. Timeline: Publish Wed 27 Jan |
| Landing | https://techplay.gg/data/studio-atlas#critics |
| Outreach angle | Country-specific pitch to the top three countries' press |
| Social | r/dataisbeautiful; X/Bluesky |
| SEO value | Country pages |

### PR-23 · C27c Remakes and remasters — Wed 10 Feb — B — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **One in [N] notable releases of 2026 was a remake, remaster or re-release** · Alternates: "The remake years: re-releases as a share of notable games, 2000–2026" · "Before Persona 4 Revival: how common are remakes now?" |
| Dataset | `game_relations` + title patterns (R14 #30) |
| Method | Notable v1; relation types listed; hand-check the notable set |
| Targets | Journalist types: Feature writers. Publications: Eurogamer, VGC, GamesRadar+, Push Square, Nintendo Life |
| Hook and timeline | Hook: Persona 4 Revival 18 Feb 2027; Hyrule Warriors DE 25 Feb [R05]. Timeline: Publish Wed 10 Feb |
| Landing | https://techplay.gg/data/state-of-the-catalogue-2026#remakes |
| Outreach angle | Hook to Persona coverage |
| Social | X/Bluesky; IG carousel |
| SEO value | Series pages |

### PR-24 · C27d Delisted: games that left the stores — Wed 3 Feb — B — DEV/ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **[N] games disappeared from Steam, PlayStation, Xbox and Nintendo stores between October and January** · Alternates: "Gone from the store: what was delisted this winter" · "The quiet delistings: [N] store pages that vanished" |
| Dataset | NEW log of store links that disappear on sync (store, store_id, game, first missing date, confirmed-gone date). Not `game_tombstones`: its `reason` column holds TechPlay's own clean-ups ("deleted", purge reasons), not store delistings (FACT, `GameObserver`) |
| Method | A link counts as delisted after it is missing on two consecutive syncs and a manual check of the store URL; bulk catalogue changes excluded |
| Targets | Journalist types: Preservation writers. Publications: Kotaku, Aftermath, Eurogamer; preservation orbit (Delisted Games, Video Game History Foundation) |
| Hook and timeline | Hook: Digital ownership anxiety after Sony's disc plan (PR-01). Timeline: Logging from 19 Oct (G10); publish Wed 3 Feb |
| Landing | https://techplay.gg/data/delisted (new, proposed) |
| Outreach angle | Offer the log as a feed for preservation projects |
| Social | X/Bluesky; r/Games comment context |
| SEO value | Game pages marked "delisted from [store] on [date]" |

### PR-25 · C18a What happened to October's Next Fest demos — Wed 17 Feb — B — ED

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Four months after Next Fest: [N]% of October's demos have released** · Alternates: "Next Fest to launch: how long the demos took" · "From demo to release: October 2026's Next Fest, followed up" |
| Dataset | Participant list captured 19–26 Oct + `released` (R14 #37) |
| Method | Follow the same cohort; median gap; unreleased and delayed separated |
| Targets | Journalist types: Indie and Steam-economics writers. Publications: GameDiscoverCo (Simon Carless), Game Developer, GamesIndustry.biz |
| Hook and timeline | Hook: Steam Next Fest 22 Feb 2027. Timeline: Publish Wed 17 Feb |
| Landing | /steam (new, C62) Next Fest section |
| Outreach angle | A cohort study GameDiscoverCo readers use |
| Social | X/Bluesky/LinkedIn; r/gamedev only if rules allow (UNKNOWN) |
| SEO value | /steam hub |

### PR-26 · C26a Achievement inflation — Wed 24 Feb — C — DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Games ship with [N]% more achievements than in 2015** · Alternates: "The achievement count, by year" · "From 20 to [N]: how many achievements a Steam game has" |
| Dataset | `GetSchemaForGame` pulls from PR-15 plus a random sample (R14 #19) |
| Method | Median achievements per game by release year; Steam only |
| Targets | Journalist types: Light features. Publications: Community first |
| Hook and timeline | Hook: None; filler between Q1 launches. Timeline: Publish Wed 24 Feb |
| Landing | https://techplay.gg/data/achievement-difficulty#inflation |
| Outreach angle | None |
| Social | r/dataisbeautiful; X |
| SEO value | Low |

### PR-27 · C21c Studio founding waves — Wed 3 Mar — B — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The 2010s founded more game studios than [N] earlier decades combined** · Alternates: "When game studios were born: 1970–2025" · "Studio births by country, 2015–2025" |
| Dataset | `studios.founded`, `country` (R14 #9, #44) |
| Method | Coverage % of `founded` printed first (UNKNOWN until queried); R14's headline is a HYPOTHESIS and changes if the data says otherwise |
| Targets | Journalist types: Industry writers around GDC month (GDC 2027 dates UNVERIFIED). Publications: Game Developer, GamesIndustry.biz |
| Hook and timeline | Hook: GDC month. Timeline: Publish Wed 3 Mar |
| Landing | https://techplay.gg/data/studio-atlas#founding |
| Outreach angle | Pair with PR-28 as a two-part pitch |
| Social | LinkedIn; X/Bluesky |
| SEO value | Studio pages |

### PR-28 · C21d Studio activity curve — Wed 10 Mar — B — EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Of studios founded in 2015, [N]% have released a game since 2023** · Alternates: "Who is still shipping? Studio activity by founding year" · "The studio activity curve, 2005–2023 cohorts" |
| Dataset | `studios.founded`, games' `released` (R14 #52) |
| Method | Framed as activity, never "survival"; no release ≠ closed |
| Targets | Journalist types: Labour and industry writers. Publications: Game Developer, GamesIndustry.biz, Aftermath |
| Hook and timeline | Hook: GDC month; the 2026 SOTGI layoffs finding (28% laid off in two years) [R14 §1.4]. Timeline: Publish Wed 10 Mar |
| Landing | https://techplay.gg/data/studio-atlas#activity |
| Outreach angle | Pair with PR-27 |
| Social | LinkedIn; X/Bluesky |
| SEO value | Studio pages |

### PR-29 · C34a Steam vs GOG price — Tue 16 Mar — C — DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Same game, two stores: GOG was cheaper for [N]% of shared titles this winter** · Alternates: "Steam or GOG? A price comparison of [N] games" · "Where the same PC game costs less" |
| Dataset | Daily snapshots from Mon 2 Nov of a fixed list of 300 games on both stores (Steam storefront and GOG; obtainable); `game_prices` for shelved games is too narrow [R14 #15] |
| Method | Same region and currency; snapshots kept; no price history claims beyond the window |
| Targets | Journalist types: PC deals writers. Publications: PC Gamer, Rock Paper Shotgun |
| Hook and timeline | Hook: Steam Spring Sale 18–25 Mar. Timeline: Publish Tue 16 Mar |
| Landing | /steam (new, C62) |
| Outreach angle | Deals writers only |
| Social | X; r/pcgaming comment context |
| SEO value | Game pages price block |

### PR-30 · C34b Regional price index — Tue 23 Mar — C — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **The same 50 Steam games cost [N]% more in Bosnia and Herzegovina than in [country]** · Alternates: "Steam regional pricing, per hour of play" · "Where a Steam game costs the most" |
| Dataset | Steam `appdetails?cc=` for 20 regions (obtainable; Steam storefront terms UNVERIFIED — check before pulling) (R14 #16) |
| Method | Throttled, cached, dated; prices converted at one stated rate on one date |
| Targets | Journalist types: Regional tech editors; PC writers. Publications: Regional outlets (UNVERIFIED); PC Gamer |
| Hook and timeline | Hook: Spring Sale running. Timeline: Publish Tue 23 Mar |
| Landing | /steam (new) |
| Outreach angle | Country cuts for regional press |
| Social | FB/LinkedIn regional; X |
| SEO value | Regional queries |

### PR-31 · C27e Genre tide chart — Wed 31 Mar — B — DEV

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **Roguelikes went from [N]% to [N]% of releases: the genre tide, 2005–2026** · Alternates: "Twenty years of genres in one chart" · "Which genres are growing on Steam?" |
| Dataset | `games.genres` TEXT[] (R14 #26) |
| Method | Genre taxonomy normalised; mapping file published |
| Targets | Journalist types: Steam-economics writers. Publications: GameDiscoverCo, Game Developer; r/dataisbeautiful |
| Hook and timeline | Hook: Spring slate. Timeline: Publish Wed 31 Mar |
| Landing | https://techplay.gg/data/state-of-the-catalogue-2026#genres |
| Outreach angle | Community-first |
| Social | r/dataisbeautiful; X/Bluesky |
| SEO value | Genre facet pages |

### PR-32 · C20c Slip rate — interim in PR-20 (12 Jan), standalone Wed 31 Mar — B — DEV/EIC

| Field | Detail |
|---|---|
| Headline (and 2 alternates) | **One in [N] dated games moved its release date at least once in the last six months** · Alternates: "How often do release dates slip? Six months of data" · "Dated and delayed: the slip rate, October to March" |
| Dataset | D-033 `release_date_changes` from 19 Oct (R14 #2, #3) |
| Method | Only changes confirmed by a store page; interim with explicit n; full-year version October 2027 |
| Targets | Journalist types: Industry and release-calendar writers. Publications: GamesIndustry.biz, GameDiscoverCo, Game Developer |
| Hook and timeline | Hook: Q1 2027 delays. Timeline: Interim line in PR-20; standalone Wed 31 Mar (runs with PR-31 as a two-chart update) |
| Landing | https://techplay.gg/data/release-congestion-2026#slips (2027 page) |
| Outreach angle | Update note to PR-02 contacts |
| Social | X/Bluesky/LinkedIn |
| SEO value | /calendar |

---

## 7. Pitch emails for the top 10

Rules for every pitch (all ten follow them):

- One person, one email, written to their last relevant piece. Name the piece in line one; if you cannot name one, the person is not on the list (§11).
- Under 150 words. The number in the first three lines. Chart as an inline PNG (under 300 KB), no attachments over that, no PDF.
- The "view the chart" link carries `?utm_source=pr-<outlet>&utm_medium=pr&utm_campaign=<campaign id>-<slug>`; the "cite this" line underneath carries the clean canonical URL, so a copied link in an article stays clean.
- Every `[N]` is filled from the publication-day query (§3, rule 10). No number is typed from memory.
- Sign-off: name, role, TechPlay, Sarajevo, `/press` and `/about/ownership` links. Opt-out line at the foot.
- **Follow-up:** one only, after four working days, and only with something new (a platform cut, a regional cut, an updated number). Never on the day of a major news event (a showcase, a big layoff story). Then stop.
- **Early look:** for PR-02, PR-06, PR-09 and PR-20, one outlet per campaign may get the data 24 hours early under embargo (subject line starts "EMBARGO [date time CET]"). Pick the outlet whose writer covered the exact topic most recently.

### P1 · PR-02 Release Congestion Index (C20)

**Subject:** Data: the most crowded release weeks of 2026, counted (CSV inside)

> Hi [first name],
>
> Your piece on [title, date] said this autumn is packed. We counted it: every day-precise release in our database since 2010, split into all releases and "notable" ones (a critic score, or listed on two or more stores).
>
> The busiest week of 2026 so far is week [N], with [N] notable releases. The median week this year had [N]; in 2016 it was [N]. [One finding the writer has not seen, e.g. the quietest week before GTA VI.]
>
> Chart, method and CSV: techplay.gg/data/release-congestion-2026
>
> If a cut for PS5, Switch 2 or PC would help, I can send it the same day, and I'm happy to explain the count on the record.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo)
> techplay.gg/press · techplay.gg/about/ownership
> Not useful? Reply "no data" and I won't send more.

**Follow-up (day 4):** "One addition since my note: the Switch 2 cut. [N] notable Switch 2 releases in October, against a monthly median of [N] this year. Chart: [link]. That's the last I'll send on this one."

### P2 · PR-03 Studios Closed in 2026 (C22)

**Subject:** A tracker of every studio closed in 2026, with the games each one made

> Hi [first name],
>
> You covered [closure story, date]. Readers kept asking the same follow-up in the week's threads: what happens to the games. We built a tracker that answers it.
>
> It lists every studio closed or announced as closing in 2026, each with a source, its founding year, its parent at the time, and the games it developed. [N] studios so far; median age at closure [N] years (where the founding date is known, [N]% of rows).
>
> techplay.gg/data/studios-closed-2026. It is updated every Wednesday and keeps a public changelog.
>
> If you spot a studio we have missed or got wrong, reply and it will be fixed with a credit line.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (next Wednesday, only if a studio was added):** "This week's update adds [studio], sourced to [statement]. The tracker now lists [N]."

### P3 · PR-06 World Atlas of Game Studios + PR-08 CSV (C21, C21b)

**Subject:** 57,000 game studios by country, mapped, with a free CSV

> Hi [first name],
>
> We mapped every studio in the TechPlay Games Database by country: 57,000+ studios, of which [N] have a known country. [Country] has the most; per million people, [country] leads with [N]. [One regional surprise.]
>
> Map, method and download (CC BY 4.0): techplay.gg/data/studio-atlas
>
> The country data comes from IGDB via our catalogue import, and we hand-checked the largest studios in the top 20 countries. The page says what the data cannot tell you: a studio in our list is not necessarily active.
>
> If you want your country's full list, I can send it as a sheet.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (day 4):** "If it's useful for your readers, here is [country] on its own: [N] studios, oldest founded [year], [N] released a game in 2026. Sheet attached as a link: [link]."

### P4 · PR-07 Balkan Game Dev Census (C21a) — English version; EIC writes the BCS version

**Subject:** Census of Balkan game studios: [N] studios and [N] games, country by country

> Hi [first name],
>
> TechPlay is a games publication based in Sarajevo. We counted the game studios in our database for Bosnia and Herzegovina, Croatia, Serbia, Slovenia, North Macedonia, Montenegro and neighbouring countries: [N] studios and [N] games. The oldest studio on record was founded in [year] in [city/country]; [country] has the most studios per million people in the region.
>
> Full list, per country, with each studio's games: techplay.gg/studios/country/ba (links to every country page).
>
> Every row was checked by hand, but small lists have gaps. If a studio is missing, the correction form on the page reaches me directly.
>
> I can talk about what the numbers show, in English or in our language.
>
> Adi Zeljković, Editor-in-Chief, TechPlay · techplay.gg/press

**Follow-up (day 5):** "Since my note, [N] studios have sent corrections, and the list now has [N]. Updated page: [link]."

### P5 · PR-09 Sequel Gap Inflation (C23)

**Subject:** Why GTA VI took 13 years: sequel gaps by decade, 1990–2026

> Hi [first name],
>
> You wrote [piece on GTA VI's development time, date]. We measured the wider pattern: the median gap between main entries in long-running series, by decade.
>
> In the 2000s it was [N] years. For entries released since 2020 it is [N]. GTA VI's 13 years is [the longest / one of N longer gaps] among the [N] series we checked by hand.
>
> Chart, series list and method: techplay.gg/data/sequel-gap
>
> Remasters, ports and DLC are excluded, and the page lists each series and its entries so you can check any line.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (day 4):** "One line that may fit a launch-week piece: of the [N] series that waited 10+ years between entries, [N] came back in the last five years."

### P6 · PR-10 The $80 Tracker (C24)

**Subject:** The $80 tracker: every major 2026 launch price, logged

> Hi [first name],
>
> Your piece on [$80 pricing article, date] asked whether $79.99 is becoming standard. We logged the base price of every major 2026 release at launch: [N] of [N] launched at $79.99 or more; [N] at $69.99.
>
> The page also shows the edition ladder (standard, deluxe, ultimate) and how "major" is defined, so you can disagree with the list and still use the numbers.
>
> techplay.gg/data/80-dollar-tracker. It updates at every major launch, including GTA VI on 19 Nov.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (19 Nov, only if GTA VI changes the count):** "With GTA VI out today at $79.99, the 2026 count is now [N] of [N]."

### P7 · PR-11 The GTA VI shadow (C20a)

**Subject:** The games that moved out of GTA VI's month, with sources

> Hi [first name],
>
> For launch week: a sourced list of the games that changed their release date out of November 2026 after GTA VI was dated. [N] games, from Fable (now 23 Feb 2027) to [game]. Each entry links the publisher's statement or store page showing both dates; we only say why a game moved when the publisher said so.
>
> November 2026 now has [N] notable releases, against a [N]-per-month median this year.
>
> techplay.gg/data/release-congestion-2026#gta-window
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up:** none; launch week is too busy for a second email.

### P8 · PR-13 Best value games of 2026 (C25)

**Subject:** Black Friday data: 2026 releases ranked by price per hour

> Hi [first name],
>
> Ahead of Black Friday, we divided each major 2026 release's launch price by the typical time to finish it. The cheapest hour belongs to [game] at [$N]; the most expensive to [game] at [$N]. The median 2026 release costs [$N] per hour at full price.
>
> Method and full table: techplay.gg/data/cost-per-hour-2026. Completion times are IGDB's "normally" figures; live-service and endless games are left out.
>
> On 30 Nov I'll add the Black Friday sale prices; if you want the updated table that morning, reply and I'll send it.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (Mon 30 Nov, only to those who asked):** "Updated with sale prices: the best value game this weekend is [game] at [$N] per hour."

### P9 · PR-15 Achievement difficulty by genre (C26)

**Subject:** Completion rates for 500 Steam games, by genre

> Hi [first name],
>
> Steam publishes the share of players who unlock each achievement. We took 500 single-player games with a clear "finished the story" achievement and grouped them by genre. The median game is finished by [N]% of its players; [genre] games are finished least ([N]%), [genre] most ([N]%).
>
> Chart, method and the full mapping of which achievement we counted for each game: techplay.gg/data/achievement-difficulty
>
> It extends earlier work on 19 games to 500, using the same public Steam numbers, so any line can be checked on Steam itself.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (day 4):** "A detail that may be useful: the least-finished game of the 500 is [game] at [N]%."

### P10 · PR-20 State of the Catalogue 2026 (C27)

**Subject:** State of the Catalogue 2026: releases, studios, closures and prices (report + CSV)

> Hi [first name],
>
> Our first annual report on the games catalogue is out: 2026 in [N] charts, from the busiest release week ([N] notable releases) to studio closures ([N]), launch prices ([N] at $79.99+) and date slips ([N]% of dated games moved in the last quarter, n = [N]).
>
> Report and datasets: techplay.gg/data/state-of-the-catalogue-2026. Every chart has its method and CSV, and the numbers were re-run on [date].
>
> If one chart fits a piece you're writing, I can send it at full resolution or cut for your region.
>
> Adi Zeljković, Editor-in-Chief, TechPlay (Sarajevo) · techplay.gg/press

**Follow-up (day 5):** "Most-requested chart so far is [chart]; here it is on its own: [link]."

### Reddit OC post template (C48, used with PR-02, PR-06, PR-15, PR-18, PR-22, PR-31)

- Title (r/dataisbeautiful): `[OC] Game releases per week, 2010–2026, all vs "notable"` (plain description, no brand, no hype).
- Image: the chart with the source line on it.
- First comment by the poster, within one minute: "Source: TechPlay Games Database (I work there), query run [date]. Notable = has a critic score or is on 2+ stores. Tool: Postgres + [charting tool]. Method and CSV: [clean URL]." The disclosure is in the comment, always.
- Before posting in any other subreddit (r/Games, r/pcgaming, r/patientgamers, r/GTA6, r/wow), SC reads its current rules; self-promotion rules for these were UNKNOWN in the research [R14 gaps]. When in doubt, answer a relevant thread with the number and link in context instead (C47).

---

## 8. Free CSV release (R14 #54)

| Item | Decision |
|---|---|
| Files | `techplay-studios-v1.csv` (28 Oct); `techplay-releases-by-week-v1.csv` (7 Oct, PR-02); `techplay-catalogue-2026-v2.zip` (12 Jan, aggregates from PR-20) |
| Studios columns | `slug, name, country_alpha2, country_numeric, founded_year, parent_slug, developed_count, published_count, techplay_url` |
| Never included | Descriptions, cover images, any IGDB text; any member data |
| Licence | CC BY 4.0 with attribution "TechPlay Games Database (techplay.gg)". Gated on G7: if IGDB objects to redistribution of fields it supplied, v1 ships as aggregates only (studios per country per decade), which are facts TechPlay computed |
| Hosting | Static, versioned filenames under the data page; a README block listing columns, row count, date, known gaps (null country share, null founded share) |
| Tracking | `cta_click` with `cta_id=csv-<file>-v<n>`; server log count as a cross-check |
| Mirrors | Kaggle dataset page (Kaggle hosts comparable game datasets [R14 #54]); r/datasets post |
| Corrections | Row-level corrections via the same form as the Balkan census; changelog in the README |

## 9. Expert-quote programme (R14 #59, R15 format 12)

| Service | Tier | What we use it for |
|---|---|---|
| Qwoted | Basic, free: 2 pitches a month, 2-hour response delay. Pro ($149/month) is not justified now | Two carefully chosen answers a month to business or mainstream queries about game prices, release volume, industry contraction |
| Featured (relaunched HARO) | Free newsletter of requests, three a day | Skim for gaming, consumer tech, Black Friday, GTA VI economics |
| Source of Sources | Free | Same |

Process: SC skims the digests Mon/Wed/Fri (15 minutes each) with the filter words *video game, gaming, Steam, PlayStation, Xbox, Nintendo, GTA, game prices, layoffs, Black Friday, holiday gifts games*. A match goes to EIC in the team channel with the deadline. EIC answers within two hours with a 60–120 word quote, one chart link and the "cite this" line. Only questions TechPlay can answer from its own data or reporting get an answer; nothing on sales forecasts, player counts or anything the database cannot show.

Prepared answer bank (EIC writes once, updates monthly):

1. How many games come out each week, and is it getting worse? (PR-02)
2. Are $80 games becoming normal? (PR-10)
3. How many studios have closed this year? (PR-03)
4. Is a game still worth buying at full price? Price per hour (PR-13)
5. What does Sony ending discs mean for players? (PR-01, only what Sony has said)
6. The games industry in the Western Balkans (PR-07)
7. Why do big sequels take so long now? (PR-09)
8. How many players finish games? (PR-15)

Answer template:

> "[One-sentence answer with the number.] [One sentence of context.] [One sentence on what the number does not show.]" — Adi Zeljković, Editor-in-Chief, TechPlay. Data: techplay.gg/data/[slug]

## 10. Wikipedia: conflict-of-interest rules and the sourcing habit (R14 §1.9, #60)

What the research established: a source joins the video-games reliable-sources list only after a talk-page discussion; reliability is judged on fact-checking, editorial oversight, professional staff, publication history and independence; unlisted sites are cited for uncontroversial facts when the page shows editorial process (masthead, author page, corrections policy). TechPlay is assumed not to be on the list [R14].

Rules for everyone at TechPlay:

1. Nobody at TechPlay adds a link to TechPlay in a Wikipedia article. Not a data page, not a studio page, not a review.
2. Anyone at TechPlay who edits Wikipedia on a games topic declares the conflict of interest on their user page.
3. Where a TechPlay page holds a fact an article lacks (a Balkan studio's founding year, a count), ED may post one note on the article's talk page: who they are, that they work for TechPlay, the fact, and the source. Editors decide. Maximum two such notes a month.
4. Never argue on a talk page for TechPlay's reliability. If a discussion about TechPlay starts, EIC may answer factual questions once, with the COI stated.
5. No paid editing, no asking friends or members to add links.
6. Make the pages citable instead: author pages, `/about/ownership`, corrections log, methodology blocks (G3, G4, §3).

Monthly habit (ED, 2 hours, first Monday): list "Video games in [country]" articles for the Balkan countries and any country where PR-06 found a notable fact; note where a fact on TechPlay is missing a source there; post at most two talk-page notes under rule 3.

## 11. Building the press list (no invented emails)

1. **Start from the story, not the outlet.** For each campaign, search the outlet's own site for the topic over the last 90 days (for PR-03: "studio closure"; for PR-10: "$80", "price"). The byline on a matching piece is the target.
2. **Record the evidence.** Two article URLs per person; no evidence, no pitch.
3. **Find a contact route the person published,** in this order: address on the writer's author page; outlet masthead or contact page (news desk or tips address); a DM route the writer states is open in their social bio; Qwoted's free media database. Record the URL where the route was found.
4. **Never** guess address patterns, buy lists, scrape, or use an address found in a leak, a PDF metadata field or a private context.
5. **Cap and tier.** At most 15 people per campaign. Tier A: wrote about this exact topic in the last 30 days. Tier B: the beat matches. Tier C: the outlet's news desk.
6. **Regional list (PR-04, PR-07, PR-30).** EIC builds it from the outlets' own contact pages; every regional outlet stays marked UNVERIFIED until an article about games is found on its site [R14 gaps].
7. **Opt-out.** Every pitch carries the opt-out line; a "no" is logged within 24 hours and honoured permanently.
8. **Housekeeping.** Review the list every quarter; delete people not contacted in 12 months.

Press list sheet (tab "Press" in the partnership CRM, see 24 §8):

| Column | Example / rule |
|---|---|
| person_id | J-001 |
| name, outlet, role/beat | from byline |
| evidence_url_1, evidence_url_2 | their recent pieces on the topic |
| contact_route | author page / masthead / tips desk / social DM / Qwoted |
| contact_value | the address or handle exactly as published |
| contact_source_url | where it was published |
| region, language | for regional pitches |
| tier | A / B / C |
| campaigns_relevant | PR-02, PR-10 |
| last_pitched, pitch_id | date, P1 |
| response | none / reply / declined / covered |
| coverage_url, link_present | URL, yes/no |
| opt_out | yes/no, date |

## 12. Distribution and social repurposing standard

Every data campaign gets the same package; the card for each campaign says which parts apply. Own posts use the spine UTM rules, for example `utm_source=x&utm_medium=organic-social&utm_campaign=c20-release-congestion&utm_content=f04-card-a`.

| Network (spine class) | Format | Copy rule | Owner |
|---|---|---|---|
| Site `/data/[slug]` | Permanent page (G5) | Methodology above the fold | EIC/DEV |
| X (secondary) | 3–5 post thread: number, chart, surprise, method, link | Number first, no adjectives | SC |
| Bluesky, Threads (experimental) | Same chart as a single post | One sentence plus link | SC |
| LinkedIn (low, Thu only) | Chart plus two-paragraph industry reading | Business framing | EIC |
| Reddit (secondary, contribution) | [OC] post where rules allow; otherwise helpful comments | Disclosure in the first comment (§7) | SC/EIC |
| Instagram carousel | 5 slides: headline number, chart, three findings, method, where to see it | Source on every slide | DS/SC |
| Facebook Page (experimental) | Chart image plus question | One question, no bait | SC |
| Discord (primary) | #news post by Buffy plus a discussion thread | "Here's the chart, what surprised you?" | SC |
| Newsletter F21 (primary) | One item per campaign in The Save File | Two sentences plus link | SC/EIC |
| F04 The Number | One stat card per campaign within a week of launch | Source line on the card | DS/SC |
| Vertical video (C49) | Only for PR-02, PR-10, PR-13: 30–45 s "one number" explainer | Script: number, why, where to check | SC |

## 13. Measurement and KPIs

| KPI | How it is measured | TARGET / use |
|---|---|---|
| New referring domains | Search Console Links, compared with the G8 baseline, monthly | TARGET: at least one earned editorial link for 4 of the 11 priority-A campaigns by 31 Mar 2027 |
| Coverage and citations | Coverage URLs logged in the Press tab; weekly search for "TechPlay" plus campaign keywords | Every citation gets a thank-you note and a correction check |
| Pitch reply rate | replies ÷ pitches, per campaign | Reviewed after the first 30 pitches; if replies are near zero, change the list, not the volume |
| Data page sessions by referrer | First-party collector `sources` breakdown; GA4 after C03 | Compare referral vs social vs search per page |
| CSV downloads | `cta_click` with `cta_id=csv-*` | Trend only |
| Registrations from data pages | `registration_complete` with `from=data-<slug>` (D-014 honours `from`) | Share of all registrations |
| Newsletter sign-ups from data pages | `newsletter_signup` on /data pages | Trend only |
| Reddit OC posts kept up | Removed / kept | 100% kept is the only acceptable outcome; a removal means the rules were misread |
| Accuracy | Corrections logged per campaign | Zero corrections to a headline number is the standard |

## 14. Capacity

| Week type | EIC | DEV | ED | DS | SC | Total |
|---|---|---|---|---|---|---|
| Setup weeks (28 Sep–9 Oct: gates G1–G8, PR-01, PR-02) | 10 | 10 | 1 | 5 | 2 | 28 |
| Priority-A launch week (for example PR-06, PR-09) | 8 | 3 | 2 | 2 | 2 | 17 |
| B/C week | 3 | 2 | 2 | 1 | 1 | 9 |
| Tracker upkeep (PR-03 every Wed) | — | — | 1.5 | — | — | 1.5 |

The setup fortnight competes with C01–C03 for DEV time. If DEV cannot give 10 hours in week 1, G5 (data page template) slips and PR-02 launches as a normal article with the CSV attached, converted to `/data/` later.

## 15. Not now, and why

| R14 id | Campaign | Reason |
|---|---|---|
| #12 | The Vanished Catalogue (61,034 tombstones) | `game_tombstones.reason` records TechPlay's own removals (`deleted` from `GameObserver`, purge-specific reasons from the adult and clutter purges), not store delistings. Publishing it as "games removed from stores" would be false. Replaced by PR-24 with a new store-link log |
| #39 | Hype vs Reality | `hype_score` is store-page completeness (40 points per store, 2 per screenshot, 15 for a trailer; FACT, popularity migration comment). It is not hype |
| #21–23, #36 | Member completion, backlog ratio, cross-platform overlap, WoW readiness by class | Member thresholds in §3 rule 12 are not met (60 members, 13 connected accounts) |
| #33 | GTA 6 interest map from hub pageviews | Traffic is too small for an index to mean anything; would invite a claim about audience we cannot support |
| #34 | Leonida Atlas | Map data provenance (D-020) and the per-location source requirement |
| #32 | The Invisible Catalogue | Advertises thin pages while D-021 decides the indexable set |
| #31, #29 | Cover colour timeline, title length | Low authority for the effort |
| #50, #51 | Cheapest month to buy, discount depth | Need 12 months of snapshots; PR-29 starts the snapshots |
| #53 | Description-language audit | `games.languages` exists (IGDB-derived); revisit after G7 |
| #55, #56, #57, #58 | Embeddable calendar, studio badge, backlog and library calculators | Product work; the badge is in 24 §5, calculators in the product plan |

---

## Dependencies and open questions

- **IGDB licence (G7).** Studio country/founded/parent, series, `time_to_beat` and popularity came from the one-off IGDB import; IGDB's docs describe the API as free for non-commercial use and TechPlay is ad-supported [R10, R23 C16]. PR-06 to PR-09, PR-13, PR-19, PR-22, PR-27, PR-28 and the CSV depend on IGDB's answer. Owner EIC; message in 24 §6 M11.
- **OpenCritic and Metacritic terms** for publishing aggregate statistics from their scores are UNVERIFIED (R14 fetched OpenCritic's terms page but did not summarise them). Check before PR-14 and PR-22.
- **Steam Web API and storefront terms** for PR-15, PR-26, PR-29 and PR-30 are UNVERIFIED at the needed volumes [R14 §6]. The Steam Web API allows 100,000 calls a day [R10].
- **Column name.** R14 refers to `games.release_date`; the model column is `released`. All SQL in this file uses `released`.
- **DLC/type field.** No DLC or edition type column was found on `Game`; notable v1 may count DLC. DEV checks before PR-02.
- **New URLs not in spine §7.** This plan proposes `/data/sequel-gap`, `/data/80-dollar-tracker`, `/data/cost-per-hour-2026`, `/data/achievement-difficulty`, `/data/state-of-the-catalogue-2026` and `/data/delisted`. EIC to approve or fold them into the three spine `/data/` pages.
- **New dev items** beyond the spine backlog: G5 data page template; launch-price log (PR-10); store-link removal log (PR-24, a sub-item of D-034, whose premise changes because `reason` already exists); Next Fest participant capture (PR-04, PR-25). D-033 must start by 19 Oct for PR-11 and PR-32.
- **Spine conflicts found:** (1) C20 publishes 7 Oct but `/press` (C54) lands 9 Oct; handled in §2. (2) D-034 "tombstone reason column" already exists as `game_tombstones.reason`; the missing piece is a delisting signal, not a column. (3) R14 #39's "hype_score semantics UNKNOWN" is answered by the code: it is not usable for a hype story.
- **Luminor Solutions ownership.** `/about/ownership` must describe the relationship between TechPlay and Luminor Solutions (named as publisher and owner in the Impressum [R02]). EIC decides the wording; PR cannot start without it.
- **UNKNOWN until queried:** `studios.country` and `studios.founded` null shares; series quality for PR-09; whether IGDB `time_to_beat` carries submission counts.
- **Open question for EIC:** whether the regional (BCS) versions of PR-07 and PR-30 are published as separate pages or only pitched; the spine is English-first.
