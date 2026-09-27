# 14 — Google Discover and Google News

Status: Phase 2 plan — 27 Sep 2026

Covers brief Part 15. Execution Mon 28 Sep → Thu 31 Dec 2026. Discover is a PRIMARY channel and Google News a SECONDARY one in the spine (§12). Owners are role codes (EIC, ED/W1/W2, SC, DS, DEV). Research is cited as [R07], [R08] etc. The editorial grid and title rules this file relies on are in file 13 (§8, §9).

**Summary**

- **No promise of exposure.** Discover and Google News choose what they show; being eligible is not being selected [R03 §6]. TechPlay had no visible presence in either on 27 Sep (0 of 751 News results for its own stories; `site:` News feed was 99 game pages and 1 article) [R02, R03]. Everything here is a TARGET on process, not on traffic.
- **Two channels, two jobs.** Discover rewards depth by topic, judged topic by topic since the 5 Feb 2026 core update [R07 §3.1]; we concentrate Discover-intended pieces in P1 (release and platform), P2 (PC fixes), P3 (WoW/MMO), P4 (GTA 6 until January) and P5 (own data). Google News inclusion is automatic [R07 §3.2]; we earn it with original reporting, data and trackers, and first stop Google reading game pages as news (D-022).
- **Headlines:** eight patterns, all built on a concrete fact; 20 examples for real Q4 stories set good against the clickbait version we will not use.
- **Images:** 1920×1080 masters (≥1200 px wide, 16:9), ≤300 KB, `max-image-preview:large` kept, no text-heavy thumbnails, no leaked or AI-faked images.
- **Freshness:** breaking within 60 minutes; "Updated" lines only for material changes; no re-dating; morning and US-morning slots added to today's evening-only publishing [R02 §7.2].
- **Entity authority:** one URL per author (D-030), real bios mapped to pillars, `Person` and `NewsMediaOrganization` markup with an ownership and corrections page (C54, D-038).
- **Technical dependencies:** news sitemap health, Googlebot-News rules for `/games/` and `/studios/` (D-022), a Publisher Center check (status UNKNOWN), the existing preferred-source prompt, RSS fixed for Discover Follow (D-003), honest `dateModified`.
- **Process:** a 12-point checklist on every Discover-intended piece (about 10 minutes, EIC or W1) and a 30-minute Monday review.
- **Measurement:** Search Console Discover and News reports with the formulas in §11, plus the weekly Google News RSS check the research used, so progress is visible even before Search Console shows a Discover report.

---

## 0. What this plan does not promise

Discover and Google News are algorithmic surfaces that TechPlay does not control. The February 2026 Discover core update reshaped who gets shown; a September 2026 spam update is rolling out now; Google is reported to be testing a Discover feature that "takes traffic away from publishers" [R07 §3.1, R08 §1]. This plan therefore:

- sets **no Discover or News traffic target** for Q4 2026;
- does not make any campaign, launch or revenue plan depend on Discover traffic;
- measures what we control (topic focus, headline and image quality, freshness discipline, technical health) and reports what Google does with it;
- treats any Discover spike as a bonus to be converted (CTA block, newsletter, reminders), never as a baseline to plan on.

---

## 1. Starting point

| Fact | Evidence | Implication |
|---|---|---|
| `max-image-preview:large`, `max-snippet:-1` on every indexable page | [R01] F08, [R03] §12 | Keep them in any SEO refactor |
| Articles carry `NewsArticle` with `Person` author, dates, `SpeakableSpecification` | [R03] §6 | Plumbing exists; outcome is zero |
| News sitemap exists (7 URLs in its 48-hour window on 27 Sep); robots has a Googlebot-News group allowing `/news/`, `/guides/`, `/reviews/`, `/hardware/` | [R03] §2, §6 | Eligibility is not the problem |
| Google News `site:techplay.gg`: 99 of 100 items are game pages dated by release year | [R02] §8.3 | D-022 first |
| All 22 recent news items published 13:43–21:22 CET, most after 17:30; none in the morning | [R02] §7.2 | Add M and D slots (file 13 §8.3) |
| Output is mostly rewrites of widely covered stories; 2 authors wrote ~95% | [R02] §7, [R08] | Shallow coverage across topics is what Discover now demotes [R07] |
| Author entity split: `/author/adi` and `/author/adi-zeljkovic` | [R02] §4.2 | D-030 |
| OG images up to 2.5 MB; game OG images are portrait covers declared 1280×720 | [R02] §8.1, [R01] A.5 | Image rules §6 |
| "Add TechPlay.gg as a preferred source on Google" box under every article | `components/ui/GoogleNewsFollow.tsx`, [R01] F01 | Keep; add two more placements (§9) |
| RSS hardware links 404; feed ~24 h behind | [R02] exec 6 | Discover Follow reads RSS [R07] — D-003 |
| US ≈35% of traffic | [R01] baseline | US times and dollar prices in P1 pieces |

---

## 2. Two channels, two strategies

| | Google Discover | Google News (and Top Stories) |
|---|---|---|
| What it is | Personalised feed on Google's mobile surfaces; no query | News surfaces built from content Google identifies as news [R07 §3.2] |
| Priority (spine §12) | PRIMARY | SECONDARY now, PRIMARY later |
| What Google says it rewards | "In-depth, original, and timely content from websites with expertise in a given area", judged topic by topic; less clickbait; more local relevance [R07 §3.1] | Eligible content found across the web; inclusion is automatic, no application [R07 §3.2] |
| What we believe selects (HYPOTHESIS) | Topic depth over time in a few areas; strong images; titles that describe | Track record, original reporting, topical authority [R03 §6] |
| Our formats | Features and explainers, data stories, Verdicts, F10 Worth It, launch guides, trackers, series pages at launch moments | Original reporting, interviews, data stories, trackers (studio closures), breaking pillar news with a primary source |
| Formats we do not push | F08 sections, glossary, programmatic sections | Evergreen guides, series pages, lists |
| Main risk | Volatility; clickbait penalties | Game pages polluting the News identity (D-022) |
| First milestone (TARGET) | Every Discover-intended piece passes the §10 checklist from 5 Oct | Zero game or studio pages in the `site:` News feed by 30 Nov |

---

## 3. Topic selection

### 3.1 Rules

1. **Discover-intended pieces are chosen at planning, not after publishing.** EIC marks 6–8 pieces a week as "Discover" in the Monday plan; they get the full checklist (§10).
2. **Home topics:** P1, P2, P3 all quarter; P4 (GTA 6) until the end of January 2027; P5 per data campaign. TARGET: 100% of Discover-intended pieces sit in a home topic; 0 general tech, phones, esports results or codes.
3. **Depth before breadth.** A topic gets a Discover push only if it already has a hub or at least three linked pieces on the site (so a Discover visitor lands in a cluster, not on an island).
4. **Topic-by-topic expertise is built by the same bylines.** P2 and P1 pieces go under W1's byline; P3 WoW and Verdicts under EIC's; data stories under EIC's. Bylines are not rotated for volume.
5. **Local relevance** (Feb 2026 update): US readers get ET times and dollar prices in P1 pieces; Balkan stories (C21 studio atlas, C55 regional partnerships, interviews with regional studios) are written in English with regional detail. HYPOTHESIS: these can earn local relevance in Bosnia, Croatia and Serbia without a local-language edition.

### 3.2 Per pillar

| Pillar | Discover angles (examples) | Google News angles | Avoid |
|---|---|---|---|
| P1 Release & platform | Switch 2 at $499.99 verdict; "Will my PS5 discs still work?"; Minecraft on Switch 2 (27 Oct); MW4 on Switch 2 (23 Oct); Out This Week (F01) on big weeks | Platform policy changes with a primary source (Sony disc survey, subscription tier changes once confirmed) | Unconfirmed prices from low-authority sources (the PS Plus renewal report is flagged low-authority [R05]) |
| P2 PC fixes | Launch-week performance fixes for big PC releases (MW4, Phantom Blade Zero, Dawn of War IV); Windows 11 settings checklist | Rarely; only when a platform change breaks games (e.g. a Windows update) | Hardware reviews without testing; "best GPU" lists [R09] |
| P3 WoW / MMO | Patch 12.1.5 readiness (labelled predicted); WoW: Forever explainer (4 Nov, reported); "Is WoW worth it in 2026?" | Blizzard announcements with Analyzer context | Class tier lists [R09] |
| P4 GTA 6 | Release-time tool; editions compared; confirmed-vs-rumour ledger; cars and real-world models (C12); launch week (C10) | Confirmed Rockstar or Take-Two statements, with the ledger linked | Leaks, trailer frame-by-frame speculation, rumour as fact [R17 §10] |
| P5 Industry data | Release Congestion Index (7 Oct); studios closed tracker (14 Oct); "Why GTA 6 took 13 years" (4 Nov); $80 Tracker (11 Nov) | Studio closures and layoffs with our tracker as the added value | Hot takes on layoffs without data |

---

## 4. Headline patterns

### 4.1 Rules for Discover and News headlines (H1 / OG title)

- Say what happened or what the reader gets, with one concrete fact: a date, price, platform, number or named thing.
- A question headline must be answered in the first sentence of the piece.
- Rumours carry the label in the headline ("reportedly", "rumour", "predicted").
- No withheld information ("this one change"), no superlatives we cannot back, no ALL CAPS, no "!!!", no "you won't believe", no "fans are furious" unless we quote them.
- Keep the H1 under about 90 characters; the `<title>` follows file 13 §9 (≤60 before the brand).

### 4.2 Eight patterns

| # | Pattern | Template | Use for |
|---|---|---|---|
| H1 | Fact + consequence | "{Thing} {happened}. {What it means for you}" | Platform news (P1) |
| H2 | Date + platform + one detail | "{Game} arrives on {platform} on {date}: {detail}" | Release news |
| H3 | Honest question, answered at once | "{Question}? {Short answer or 'what we know'}" | Explainers, F10 |
| H4 | The tracker | "{Topic}: our running list, with {what's included}" | P5 trackers, GTA ledger |
| H5 | The number, sourced | "{Number} {things}: {what our data shows}" | Data stories |
| H6 | The fix | "{Error or problem}: {what causes it} and how to fix it" | P2 |
| H7 | Verdict | "{Game} Verdict: {verdict phrase}" | F24 |
| H8 | Confirmed vs not | "{Topic}: what {company} has confirmed, and what it hasn't" | P4, rumours |

### 4.3 Twenty examples for real Q4 stories

Facts in the "good" column come from the research files; bracketed items are filled when the fact is known.

| # | Story (date, source) | Good headline (we publish) | Clickbait version (we do not) | Pattern / note |
|---|---|---|---|---|
| 1 | GTA VI launch, 19 Nov, PS5/Xbox Series X\|S, no PC at launch [R17] | GTA 6 launches 19 November on PS5 and Xbox Series X\|S, with no PC version yet | GTA 6 PC players just got TERRIBLE news | H2 |
| 2 | GTA 6 unlock time not yet announced [R17] | When does GTA 6 unlock? The release time by region, and what Rockstar hasn't said yet | GTA 6 release time LEAKED? | H3 / H8 |
| 3 | $400 Vice City collector's set without the game [R17] | GTA 6's $400 collector's set doesn't include the game | Rockstar's $400 GTA 6 box is a slap in the face | H1 |
| 4 | GTA 6 "single-player experience" at launch; Online rumoured for 2027 [R17] | Does GTA 6 have online at launch? What Rockstar has confirmed, and what's only rumour | GTA 6 Online is coming sooner than you think | H8 |
| 5 | MW4 on Switch 2, 23 Oct; first CoD on a Nintendo platform since Ghosts [R05] | Modern Warfare 4 is the first Call of Duty on a Nintendo console since Ghosts: what the Switch 2 version includes | Call of Duty on Switch 2 changes everything | H1 |
| 6 | MW4 not day one on Game Pass [R05] | Modern Warfare 4 isn't on Game Pass at launch. What that means for subscribers | Xbox just betrayed Game Pass players | H1 |
| 7 | WoW: Forever, 4 Nov (reported) [R05] | WoW: Forever arrives 4 November. How it differs from Classic and Midnight | Blizzard's new WoW is the one you've been waiting for | H2 |
| 8 | WoW patch 12.1.5, ~6 Oct (cadence prediction) [R05] | WoW patch 12.1.5 is predicted for early October. Check your character before it lands | WoW's next patch is HUGE | H1, labelled |
| 9 | Sony plans to end PS discs; player survey [R06] | Sony surveyed players about ending PS5 discs. What the plan means for games you already own | Sony is killing your PS5 games | H1 |
| 10 | Xbox September layoffs and studio closures [R05, R06] | Xbox's September cuts: the studios and games affected, one by one | Xbox is dying and here's proof | H4 |
| 11 | Switch 2 price to $499.99 on 1 Sep [R05] | Switch 2 now costs $499.99. Is it still worth buying this Christmas? | Nintendo's price hike is a disaster for fans | H3 (F10) |
| 12 | Steam Next Fest, 19–26 Oct [R05] | Steam Next Fest runs 19–26 October. We're tracking the demos worth your evening | These Next Fest demos will blow your mind | H4 |
| 13 | Steam Autumn Sale, 1–8 Oct [R05] | Steam Autumn Sale runs 1–8 October. How to find the games from your wishlist that are discounted | Steam is basically giving games away right now | H1 |
| 14 | Fable moved to 23 Feb 2027 to avoid GTA VI [R05] | Fable moved to 23 February 2027 to stay clear of GTA 6. These games did the same | GTA 6 is scaring every other game away | H1 / H4 |
| 15 | The Game Awards, 10 Dec [R05] | The Game Awards 2026 is on 10 December. Make your picks before the show | TGA 2026 predictions that will shock you | H2 (C29) |
| 16 | Black Friday after 2026 console price rises [R05] | Console prices rose this year. What a real Black Friday games deal looks like in 2026 | Black Friday deals you'd be crazy to miss | H1 |
| 17 | Minecraft Bedrock on Switch 2, 27 Oct [R05] | Minecraft comes to Switch 2 on 27 October. Do you have to buy it again? | Minecraft on Switch 2 is finally here and it's insane | H3 |
| 18 | Studios closed in 2026 (C22) [R06] | Game studios closed in 2026: our running list, with the games affected | The gaming industry is collapsing | H4 |
| 19 | Release Congestion Index (C20) | The most crowded weeks to release a game in 2026, from our release database | Why 2026 was the worst year ever to launch a game | H5 |
| 20 | PS Plus annual renewals from 6 Nov (low-authority report) [R05] | Publish only if Sony confirms: "PS Plus annual renewals cost {new price} from 6 November". Until then: "PS Plus renewal prices: what Sony has and hasn't confirmed" | Sony is raising PS Plus prices AGAIN | H8, verify first |

---

## 5. Freshness rules

| # | Rule | Owner |
|---|---|---|
| R1 | Breaking pillar stories publish a short, sourced version within 60 minutes, then grow in place | W1 (B slot) |
| R2 | If we are more than 24 hours behind a story, we publish only with a new angle (file 13 §8.5) | W1, EIC |
| R3 | "Updated {date}, {time} {zone}: {what changed}" goes under the byline for every material change: new fact, correction, new section. Typos and link fixes are not updates | Writer |
| R4 | `dateModified` changes only on a material update. No bulk re-saves (every review shows 27 Aug 2026 22:32 as modified [R02 §6.2]); DEV item D-022a below | DEV, EIC |
| R5 | Trackers and ledgers (GTA 6 ledger, studios closed, Next Fest tracker) keep one URL, a top line with the latest change and a dated changelog at the bottom | W1 |
| R6 | Never republish a story under a new URL to look fresh; update the original | EIC |
| R7 | Evergreen pages (P2 fixes, series pages) are re-checked quarterly; the "Updated" line changes only after the check | W1 |
| R8 | No relative time in headlines ("tomorrow", "this week"); use dates. Discover can show a piece for days | Writer |
| R9 | Stories that break overnight European time go out in the 08:30 M slot; US-daytime stories in the 14:30 D slot | W1 |
| R10 | Live events (Game Awards, launch nights) use one live URL with timestamped entries (F20) | W1, EIC |

---

## 6. Image rules

| # | Rule | Basis |
|---|---|---|
| I1 | Master image 1920×1080, 16:9. Never under 1200 px wide or 300,000 pixels | Google Discover documentation [R07 §3.1] |
| I2 | `max-image-preview:large` stays on every indexable page | Present today [R01] F08 |
| I3 | Featured image = OG image, with width and height declared (the media library measures on upload) | [R01] A.5 |
| I4 | No text-heavy thumbnails: at most a three-word label; no arrows, circles, red text, or reaction faces | Discover warns against misleading or exaggerated preview images [R07 §3.1] |
| I5 | Sources: official press kits and screenshots (credited in the caption), our own captures from play, our own charts. No leaked footage or images | IP risk [R17 §10] |
| I6 | No AI-generated images presented as real games, hardware or people | Trust; AI policy (C54) |
| I7 | Files ≤300 KB (JPEG or WebP); no multi-MB PNGs | [R02] §13 #13 |
| I8 | A distinct image for every piece; the generic fallback is never a featured image | Generic image on a dozen pages [R02 §8.1] |
| I9 | Game pages: landscape `/og/game` card composited from the portrait cover (DS template, DEV) instead of a portrait cover declared 1280×720 | [R01] F09, [R02] §13 #13 |
| I10 | Alt text describes what is in the image, in one sentence | Accessibility |
| I11 | Data stories: the chart is the image, headline not baked in, axis labels readable at phone width | DS chart frame |

**DS templates (6 h one-off, by 9 Oct):** data-chart frame 1920×1080; Verdict frame (game art with a small score chip added only when the full review lands); explainer frame (clean key art, optional three-word label); `/og/game` layout spec for DEV.

---

## 7. Entity authority and author identity

### 7.1 One URL per author (D-030, DEV XS, C02)

- 301 `/author/adi` → `/author/adi-zeljkovic`; same pattern for any other short form.
- Every template's JSON-LD uses `author_slug`; reviews and guides fall back to `username` today (`author_slug || username` in `frontend/app/reviews/[slug]/page.tsx` and `guides/[slug]/page.tsx`), so every staff account needs an `author_slug` set (EIC checks in the user admin).
- Hardware category JSON-LD uses `username` [R01] F04; switch to `author_slug`.

### 7.2 Author page specification

| Element | Now | After |
|---|---|---|
| `<title>` | "Articles by Adi Zeljković - TechPlay \| TechPlay" | "Adi Zeljković, Editor-in-Chief \| TechPlay" |
| Role line | not shown in byline | Role under the name on the author page and in every byline |
| Bio | free text | 80–150 words: beats mapped to pillars, what the person has written, how to contact the desk |
| Pillar sections | one grid | Grid grouped by pillar (P1–P5, Verdicts) |
| `Person` JSON-LD | present | `name`, `url` (canonical), `image`, `jobTitle`, `worksFor` (the site's `NewsMediaOrganization` `@id`), `sameAs` (only real, active profiles), `knowsAbout` (pillar topics) |
| `twitter:card` | `summary` | keep `summary` (square avatar) |

### 7.3 Bio drafts (fill the braces; never add a claim we cannot back)

- **Adi Zeljković, Founder and Editor-in-Chief.** "Adi founded TechPlay in Sarajevo and edits it. He writes the Verdicts and reviews, the World of Warcraft coverage and TechPlay's data stories, which are built on the site's own release and studio database. {One line on what he plays and on which platforms.} Corrections and tips: {editorial inbox}."
- **Nenad Divljaković, Journalist and Editor.** "Nenad covers release schedules, platforms and PC fixes for TechPlay. He writes Out This Week every Monday, Fix It Friday, and the weekly GTA 6 ledger of what is confirmed and what is rumour. {One line of background.} Contact: {editorial inbox}."

### 7.4 Organisation identity

- `/about/ownership` and `/press` (C54, D-038, 9 Oct): who owns TechPlay (Luminor Solutions, Sarajevo, per the Impressum [R02 §6.2]), how it is funded (ads; affiliate links disclosed where used), the AI-use policy, and a visible corrections log (the About page promises "Corrections are visible" and no corrections page exists [R02 §6.2]).
- Link those pages from the `NewsMediaOrganization` markup (schema.org publishing-principles and corrections-policy properties; DEV verifies names against schema.org before shipping) and from the footer.
- Remove boilerplate that contradicts the About page ("global media team", "within 24 hours") (file 13 §9 #14).

---

## 8. Content presentation

| Element | Rule |
|---|---|
| Byline block | Name (canonical author link), role, published date and time with zone, "Updated" line when R3 applies |
| Key facts box | P1 and P4 news start with a 3–5 line box: date, platforms, price, status (Confirmed / Reported / Rumour) |
| Status labels | Claims in GTA 6 and platform stories carry Confirmed / Reported / Rumour, as in the ledger [R17 §2] |
| Sources | Primary source linked at first use; a "Sources" line at the end listing each one (today sources are named, not linked [R02 §4.2]) |
| Internal links | 3–5 per news piece, one hub, one product link (file 13 §4) |
| Spoilers | Warning line above any story detail for games under 30 days old |
| CTA | The article-end block (D-010): newsletter, Discord (https://discord.gg/wPQG9gUMXH), connect a library; plus the preferred-source box |
| AI | If AI assisted a piece (translation, data cleaning), say so at the end, per the policy page |
| Mobile | Open question for EIC: phones show three ad units between the last paragraph and the comments [R01 A.6]; Discover readers are on phones |

---

## 9. Technical dependencies

| # | Dependency | Status | Action | Owner / ID | Due |
|---|---|---|---|---|---|
| 1 | Game and studio pages out of Google News | Broken: 99/100 `site:` items are game pages [R02] | Admin robots row: `Disallow: /games/` and `/studios/` under `User-agent: Googlebot-News`; `googlebot-news` noindex meta on game and studio templates (verify the token in Google's documentation) | DEV S, EIC admin edit (D-022) | 9 Oct |
| 2 | News sitemap health | Exists; 48-hour window; file ownership bug fixed 29 Aug (CLAUDE.md) | Weekly check: newest article in `sitemap-news.xml` within 15 minutes of publishing; only articles, never games | W1 check, DEV if broken | Weekly from 5 Oct |
| 3 | Publisher Center | UNKNOWN whether a TechPlay publication exists [R03 §6] | Sign in; if a publication exists, confirm name "TechPlay", logo, URL and ownership; if not, note that inclusion is automatic [R07] and decide whether a profile is worth creating for presentation | EIC 1 h | 9 Oct |
| 4 | Preferred-source prompt | Live under every article (`google.com/preferences/source?q=techplay.gg`) | Keep; add as a footer line in The Save File (C40) and a pinned message in Discord `#announcements`; track clicks as `cta_click` with `cta_id=google-preferred-source` | SC, DEV XS (event) | 2 Oct / 16 Oct |
| 5 | RSS for Discover Follow | Hardware links 404; ~24 h lag [R02] | D-003; confirm `<link rel="alternate">` stays in `<head>` | DEV S | 9 Oct |
| 6 | Honest `dateModified` | Reviews bulk-modified 27 Aug [R02] | **D-022a (new sub-item):** a "material update" checkbox in the editor sets the date JSON-LD and the "Updated" line use; ordinary saves do not | DEV S | 23 Oct |
| 7 | Author URLs and `Person` markup | Split [R02] | D-030 + §7.2 | DEV XS, EIC | 9 Oct |
| 8 | OG image weight | 2–2.5 MB GTA 6 and WoW images [R02] | D-017, D-040; compress homepage OG | DEV XS, DS | 9 Oct |
| 9 | Game OG card | Portrait cover declared 1280×720 [R01] | `/og/game` landscape card | DEV S, DS | 30 Oct |
| 10 | Breadcrumbs | Category link 404 [R02] | D-002 | DEV S | 2 Oct |
| 11 | Duplicate `Product` JSON-LD on reviews | [R01] A.4.9 | Drop the client-side copy before Verdicts restart | DEV XS | 6 Oct |
| 12 | Morning publishing | Scheduler fires observers since 29 Aug (CLAUDE.md) | Use Filament scheduling for M, D and weekend slots | W1, W2, EIC | 28 Sep |

---

## 10. Editorial process

### 10.1 Discover checklist (every Discover-intended piece, about 10 minutes, EIC or W1 before scheduling)

1. Pillar named (P1–P5) and at least three linked pieces or a hub already live on the topic.
2. Added-value test passed (file 13 §8.5); which one is written in the change summary.
3. Headline follows a §4.2 pattern, carries one concrete fact, contains none of the clickbait markers in §4.1.
4. Rumour or prediction labelled in the headline and in the key-facts box.
5. `meta_title` ≤60 characters before the brand, cut at a word (file 13 §9).
6. Image: 1920×1080, ≤300 KB, at most three words of text, credited, alt text written.
7. Byline is the canonical author; role shown.
8. Primary source linked at first use; "Sources" line present.
9. 3–5 internal links including one hub and one product link.
10. "Updated" line present only if this is a material update.
11. Slot chosen (M, D or E) for the audience it serves.
12. After publishing (W1, 15 minutes later): the piece is in `sitemap-news.xml`, in `/rss`, and Professor Buffy posted it to Discord.

### 10.2 Daily rhythm

| Time (Sarajevo) | Who | What |
|---|---|---|
| 08:15 | W1 | Scan overnight news against P1–P5; decide B pieces; confirm the 08:30 M piece went live |
| 08:30 | — | M slot publishes (scheduled the evening before) |
| 13:45 | EIC | Checklist on the D piece if it is Discover-intended |
| 14:30 | — | D slot |
| 18:15 | EIC or W1 | Checklist on the E piece |
| 19:00 | — | E slot |
| 21:30 | W1 | Schedule next day's M piece; check news sitemap and RSS for the day's pieces |

### 10.3 Monday review (EIC, 30 minutes)

- Search Console Discover and News reports for the last 7 days (formulas §11).
- The Google News RSS check (§11) for `site:techplay.gg` and for last week's five most important own stories.
- Mark next week's 6–8 Discover-intended pieces in the plan.
- One lesson written into the plan doc ("pieces with charts as images got impressions; explainers without did not") only when the data shows it.

---

## 11. Measurement

**Sources.** Search Console Performance → Discover; Search Console Performance → search type "News"; Google News RSS search (the method the research used [R02, R03]); GA4 events (spine §10) once C03 is live.

If Search Console shows no Discover report yet, record "no Discover data" as the baseline and keep publishing to the checklist; the report's appearance is itself the first signal.

| Metric | Formula | Cadence | TARGET or status |
|---|---|---|---|
| Discover clicks, impressions | From the GSC Discover report | weekly | Reported, no target |
| Discover CTR | Discover clicks ÷ Discover impressions | weekly | Reported |
| Discover hit rate by pillar | Discover-intended pieces in pillar p with ≥1 Discover impression within 7 days ÷ Discover-intended pieces in p published that week | weekly | Reported per pillar; used to move slots between pillars in December |
| Topic concentration | Discover impressions on P1–P5 pages ÷ all Discover impressions | monthly | Reported (should be ~100% once off-pillar publishing stops) |
| Discover lifespan | Median days between first and last day with Discover impressions, per piece | monthly | Reported |
| Checklist compliance | Discover-intended pieces with all 12 checks ticked ÷ Discover-intended pieces | weekly | TARGET 100% from 5 Oct |
| Member actions on Discover-hit pages (proxy) | (newsletter_signup + registration_complete + reminder_set + shelf_add) on pages that had Discover clicks that day ÷ pageviews on those pages × 1,000 | weekly from C03 | Reported; a proxy because GA4 does not separate Discover cleanly |
| News identity | Article URLs ÷ all techplay.gg items in the Google News RSS `site:techplay.gg` feed (30-day window) | weekly | Baseline 1/100 [R02]; TARGET: no game or studio pages by 30 Nov |
| Own-story News presence | Of last week's five most important own stories, how many return techplay.gg in a Google News RSS search for the story topic | weekly | Baseline 0 of 16 [R03 §6]; reported |
| Google News clicks | GSC search type "News" clicks and impressions | weekly | Reported |
| Preferred-source clicks | `cta_click` where `cta_id = google-preferred-source` | weekly | Reported |

---

## 12. Google News specifics

- **Inclusion is automatic** for content Google identifies as news; there is no application [R07 §3.2]. The news sitemap lists articles from the last two days, up to 1,000 URLs [R07].
- **What we publish for News:** original reporting (EIC, fortnightly), interviews (fortnightly), data stories and the studio-closures tracker, breaking P1–P5 news with a linked primary source, Verdicts. These carry `NewsArticle` (Verdicts keep `Review`).
- **What stays out of News:** game and studio pages (D-022), series pages, glossary, template sections. Guides stay eligible under the existing robots group but are not written for News.
- **Transparency signals News readers and Google can see:** bylines with roles, dates with zones, linked sources, `/about/ownership` with funding and corrections (C54), contact details already on `/contact` and `/impressum` [R02 §6.2].
- **Live coverage:** The Game Awards (10 Dec) and GTA 6 launch night (18–19 Nov) run as one live URL each, timestamped entries, final summary at the top when the event ends (F20).
- **What would change this plan:** if, after D-022 and eight weeks of pillar-only publishing, News still shows no TechPlay articles for own stories, EIC reduces breaking coverage further and moves those hours to data stories and interviews, which serve Discover and links as well.

---

## Dependencies and open questions

**Dependencies**

- File 13: publishing grid (§8.3), added-value test (§8.5), title rules (§9), internal linking (§4) and D-021 (the indexable set).
- DEV: D-022, D-022a, D-030, D-003, D-002, D-017, D-040, `/og/game`, the review JSON-LD fix, and the `cta_click` event for the preferred-source box — about 12–14 hours in total inside C02 and C03.
- DS: the three image frames and the `/og/game` spec (about 6 hours by 9 Oct).
- C54 / D-038 ownership and corrections page by 9 Oct.
- Search Console access for EIC (research had none [R03]).

**Open questions**

1. Does a Google Publisher Center publication already exist for techplay.gg, and who owns it?
2. Is Search Console showing a Discover report today? If yes, what was the pre-17 Aug pattern (useful baseline, not a target)?
3. Will EIC reduce ad density between the article end and the comments on phones? Discover traffic is mobile.
4. Which staff have `author_slug` set, and which real social profiles should go into `sameAs`?
5. Is a "Game Awards" or "GTA 6 launch" live-blog template (with live-blog structured data) worth DEV time this quarter, or does a plain updated article suffice? This plan assumes the plain article.
6. Conflicts with the spine: none found. Note: the spine lists D-022 as "Stop game pages in Google News (datePublished)"; this plan keeps `VideoGame.datePublished` (it is the game's release date) and fixes the problem through Googlebot-News robots rules and a `googlebot-news` meta instead, because removing the date would weaken the game entity for normal search.
