# 04 — Channel Strategy

Status: Phase 2 plan — 27 Sep 2026

- Five channels carry the quarter (spine §12 PRIMARY): Google Search, Google Discover, Discord, Email/Newsletter and the site's own product loops (remind me, alerts, shelves). Everything else either feeds them or is a test with an end date.
- Social is one production line, not twelve accounts: one vertical video master (C49) goes to TikTok, Shorts, Reels and Facebook Reels; one card goes to X, Threads, Bluesky, Instagram and Facebook with a different caption per network.
- Every channel section below gives Role, Priority, Audience (S-IDs), Formats, Frequency, Voice, the exact CTA, the success metric, the workflow and what not to do. The machine-readable version is `channels.json` (43 channels, same numbers).
- Channel operations cost **56.25 hours a week** out of ~135 (SC 24.75, DS 10, EIC 13, ED 7.5, DEV 1 plus backlog items). The remaining ~79 hours go to editorial and product work (§2).
- Starting point is close to zero outside Discord: 160 Discord members, 20 YouTube subscribers and no videos, an unlinked X account, no TikTok, Bluesky or LinkedIn, and 1–2 Google clicks a day since 17 Aug [R02, R03, R07, R23]. No follower, reach or conversion baseline exists, so targets are formulas until four weeks of data are in.
- Experimental channels (Facebook Page and Groups, Threads, Bluesky, Steam Curator, web push, YouTube long-form, paid) get a six-week test and a written keep/cut decision at the social review on **Mon 9 Nov** (Steam Curator and push on their own dates).
- Nothing gets promoted until the trust reset (C01) and plumbing sprint (C02) remove false claims, dead Discord invites and broken RSS links. Social bios are part of C01: the current X/YouTube bio claims "We test hardware until it breaks", and no benchmarks exist [R02].
- NOT NOW this quarter: Twitch, Pinterest, Snapchat, YouTube livestreams, Instagram Broadcast Channel, paid influencers, site-wide browser notification prompts.

---

## 0. How to read this file

- **Priority classes** are the spine's (§12): PRIMARY, SECONDARY, EXPERIMENTAL, LOW PRIORITY, NOT NOW. Where the brief lists a channel the spine does not class (Instagram Broadcast Channel, YouTube Community tab, gaming forums, game-specific communities, Digital PR, creators, referral, word-of-mouth), the class is assigned here and flagged in §5.
- **Owners** are role codes: EIC (40 h), ED (40 h), SC (25 h), DS (10 h), DEV (20 h).
- **UTM** follows spine §9. Pattern: `?utm_source=<platform>&utm_medium=organic-social|community|email|push|referral|pr|creator|partner&utm_campaign=<cid>-<slug>&utm_content=<franchise>-<variant>`. Until the campaign URL helper ships (D-009), SC builds links in the shared UTM sheet.
- **Discord links** use `https://discord.gg/wPQG9gUMXH` only. `discord.gg/techplaygg` and `discord.gg/techplay` are dead [R13]. After D-011, SC issues one invite code per campaign and logs it.
- **Deeper plans.** `06-FACEBOOK.md`, `07-INSTAGRAM.md`, `08-TIKTOK.md`, `09-YOUTUBE.md`, `11-REDDIT.md`, `12-DISCORD.md`, `13-SEO-CONTENT.md`, `14-DISCOVER-NEWS.md`, `17-NEWSLETTER-EMAIL.md`, `18-VIDEO.md`, `19-GTA6.md`, `22-DIGITAL-PR.md`, `23-CREATORS.md`, `24-PARTNERSHIPS.md`, `25-GIVEAWAYS.md`, `26-PAID-MEDIA.md`, `30-ANALYTICS.md`. File 05 is the social operating system and file 10 covers X, Threads and Bluesky. Where a per-network file sets a different cadence, the hours in §2 must be re-checked, because SC has 15 minutes of slack.
- **Evidence limits.** Platform ranking documentation for YouTube, TikTok, Instagram, Facebook and Threads was not fetched in Phase 1 [R07, R19]. Image sizes and link handling on those platforms are standard specs to verify before templates are locked; they are not research findings.

## 1. Channel map

| # | Channel | Class | Job in one line | Audiences | Posts/wk | Owner | h/wk |
|---|---|---|---|---|---|---|---|
| 1 | Google Search | PRIMARY | Evergreen pages built from DB and tools | S1 S3 S5 S6 S7 | 4 new/updated | ED | 3.5 |
| 2 | Google Discover | PRIMARY | Pillar stories with topic depth | S1 S3 S4 S5 S8 | ≤15 | ED | 1.5 |
| 3 | Google News | SECONDARY | Original, sourced news only | S8 S4 S1 | ~10 | ED | 0.5 |
| 4 | Bing | LOW PRIORITY | IndexNow, monthly check | S1 S3 | auto | EIC | 0.25 |
| 5 | Microsoft Start | LOW PRIORITY | Access unknown; no work | S8 | 0 | EIC | 0 |
| 6 | Facebook Page | EXPERIMENTAL | Native images, polls, questions | S1 S7 S9 S10 | 15 (batched) | SC | 1.0 |
| 7 | Facebook Groups | EXPERIMENTAL | Answers as a named person | S5 S9 S10 | 3 | SC | 0.5 |
| 8 | Facebook Reels | SECONDARY | Placement of the video master | S1 S3 S4 | 5 | SC | 0.25 |
| 9 | Facebook Stories | EXPERIMENTAL | Mirror of IG Stories | S4 S10 | 7 | SC | 0.25 |
| 10 | Instagram Feed | SECONDARY | Single stat/verdict cards | S1 S4 S8 | 3 | SC/DS | 0.75 |
| 11 | Instagram Carousel | SECONDARY | Lists and data from the DB | S1 S2 S4 S6 S7 | 4 | DS | 3.75 |
| 12 | Instagram Reels | SECONDARY | Placement of the video master | S1 S3 S4 | 5 | SC | 0.25 |
| 13 | Instagram Stories | SECONDARY | Daily countdown + weekly poll | S4 S10 S1 | 9 | SC | 1.5 |
| 14 | Instagram Broadcast Channel | NOT NOW | Revisit 9 Nov | S10 | 0 | SC | 0 |
| 15 | TikTok | SECONDARY | Master for vertical video (C49) | S1 S3 S4 S7 | 5 | SC | 5.0 |
| 16 | YouTube long-form | EXPERIMENTAL | Two pilots (C50) | S4 S1 | 2 per quarter | EIC | 2.5 |
| 17 | YouTube Shorts | SECONDARY | Placement of the video master | S1 S3 S4 | 5 | SC | 0.25 |
| 18 | YouTube Community tab | LOW PRIORITY | Poll + link, if eligible | S10 | 2 | SC | 0.25 |
| 19 | YouTube livestreams | NOT NOW | No presenters | S10 | 0 | EIC | 0 |
| 20 | X | SECONDARY | News, live events, press network | S8 S4 S1 S3 S5 | 24 + replies | SC | 3.5 |
| 21 | Threads | EXPERIMENTAL | Questions and opinion prompts | S10 S1 S6 | 12 | SC | 0.75 |
| 22 | Bluesky | EXPERIMENTAL | Data and industry audience | S8 S9 S3 | 10 | SC | 1.0 |
| 23 | Reddit | SECONDARY | Contribution by real people (C47) | S3 S4 S5 S2 S8 | 6 answers | SC | 3.0 |
| 24 | Discord | PRIMARY | Rituals and retention | S10 S5 S4 S2 | 22 + 1 event | SC | 5.0 |
| 25 | Twitch | NOT NOW | No presenters | S10 | 0 | — | 0 |
| 26 | LinkedIn | LOW PRIORITY | B2B, PR, partners | S8 S9 | 1 | EIC | 0.5 |
| 27 | Pinterest | NOT NOW | No precedent | — | 0 | — | 0 |
| 28 | Snapchat | NOT NOW | No route | — | 0 | — | 0 |
| 29 | Steam Community / Curator | EXPERIMENTAL | Picks on Steam store pages (C69) | S1 S2 S3 S7 | 3 | ED | 1.0 |
| 30 | Gaming forums | LOW PRIORITY | Monitor only | S8 | 0 | SC | 0 |
| 31 | Game-specific communities | SECONDARY | WoW, GTA, Next Fest participation | S5 S4 S9 | 3 | SC | 0.75 |
| 32 | Email (lifecycle, alerts) | PRIMARY | Automated return channel | S1 S2 S7 S4 | 1 + events | SC/DEV | 0.5 |
| 33 | Newsletter (The Save File) | PRIMARY | Weekly Friday issue (C40) | S1 S2 S7 S8 S10 | 1 | SC | 3.0 |
| 34 | Web Push | EXPERIMENTAL | Reminders only, from 9 Nov (C59) | S1 S4 | event | DEV | 0 |
| 35 | Browser notifications (site-wide) | NOT NOW | Never prompt on load | — | 0 | DEV | 0 |
| 36 | RSS (+ Flipboard, Mastodon) | SECONDARY | Infrastructure for Follow and readers | S8 S3 | auto | DEV | 0 |
| 37 | Digital PR | SECONDARY | Data campaigns C20–C26 | S8 S9 | 1 per 2 wks | EIC | 5.0 |
| 38 | Creators | EXPERIMENTAL | Data partnerships (C51) | S4 S5 S1 | 2 offers | EIC | 1.5 |
| 39 | Influencers (paid) | NOT NOW | No budget line | — | 0 | EIC | 0 |
| 40 | Partnerships | EXPERIMENTAL | C71 indies, C55 Balkans | S9 S1 | 1 per 2 wks | EIC | 1.0 |
| 41 | Referral | EXPERIMENTAL | Invite codes, referral roles (C36, C68) | S10 | always on | SC | 0.5 |
| 42 | Word-of-mouth | SECONDARY | Outcome of share cards and C28 | S2 S10 | measured | SC | 0 |
| 43 | Site product loops | PRIMARY | Remind me, follow, alerts | S1 S2 S4 S7 | continuous | DEV/SC | 0.25 |

## 2. Weekly hours budget

Steady-state week (from Mon 5 Oct, once DS has built the template library in week 1). Numbers are ESTIMATE; they match `channels.json`.

| Role | Weekly capacity | Channel operations | Of which: largest items | Left for editorial / product |
|---|---|---|---|---|
| SC | 25 | **24.75** | Discord 5.0, vertical video 2.5, X 2.5, newsletter 2.5, Reddit 2.5, planning/report 1.5 | 0.25 |
| DS | 10 | **10.0** | Carousels 3.0, video templates 2.0, template upkeep + card resizes + buffer 3.0 | 0 |
| EIC | 40 | **13.0** | Digital PR 4.0, YouTube pilots 2.0 (avg), creators 1.5, approvals/planning 1.5 | 27.0 (Verdict reviews, data stories, editing) |
| ED | 40 | **7.5** | Search packaging 3.0, Discover checks 1.5, Steam Curator 1.0 | 32.5 (news, F01, F07–F09 pages, hubs) |
| DEV | 20 | **1.0** + backlog | PR data pulls 1.0; RSS, push, invite attribution, email are backlog items D-003, D-011, D-012, D-013, D-019, D-027, D-028 | 19.0 (backlog) |
| **Total** | **135** | **56.25** | | **78.75** |

Per-channel hours (non-zero only): Search 3.5 · Discover 1.5 · News 0.5 · Bing 0.25 · FB Page 1.0 · FB Groups 0.5 · FB Reels 0.25 · FB Stories 0.25 · IG Feed 0.75 · IG Carousel 3.75 · IG Reels 0.25 · IG Stories 1.5 · TikTok (video master) 5.0 · YouTube long-form 2.5 · Shorts 0.25 · YT Community 0.25 · X 3.5 · Threads 0.75 · Bluesky 1.0 · Reddit 3.0 · Discord 5.0 · LinkedIn 0.5 · Steam Curator 1.0 · Game communities 0.75 · Email 0.5 · Newsletter 3.0 · Digital PR 5.0 · Creators 1.5 · Partnerships 1.0 · Referral 0.5 · Product-loop copy 0.25 · planning/approvals/report 4.0 · DS template upkeep and buffer 3.0 = **56.25**.

**Pressure weeks and what gives way.** SC has 15 minutes of slack, so peaks are paid for by pausing named items, not by overtime:

| Week | Extra load | Paused to pay for it |
|---|---|---|
| 28 Sep–2 Oct | DS builds all templates (10 h); SC rebuilds Discord (C35) | No carousels or videos this week; text posts and Stories only |
| 19–26 Oct (Next Fest, F23) | Daily Discord diary, Steam Curator picks | F09 carousel and Threads extras paused |
| 16–22 Nov (GTA VI launch, C10) | Live coverage, launch-night event, push day | F09, F18, Reddit to 3 answers, Facebook Groups, LinkedIn paused; DS countdown cards pre-built in October |
| 10 Dec (The Game Awards, F20) | Night live thread + Discord watch party | SC starts Fri 11 Dec at 14:00; Friday newsletter assembled Wed 9 Dec |
| 21–31 Dec | Holidays; C28 share week; C70 | Batch-schedule 21 Dec; Discord rituals continue; no Reddit or Groups |

## 3. Channel sections

### 3.1 Search and aggregators (detail: 13-SEO-CONTENT.md, 14-DISCOVER-NEWS.md)

#### 1. Google Search — PRIMARY

| Field | Plan |
|---|---|
| Role | Compounding traffic to pages only TechPlay can build from its catalogue and tools. Search starts from near zero: 1–2 clicks/day, 56,355 URLs indexed, 99.8% of indexable URLs are database pages [R03, R23]. |
| Audience | S1, S3, S5, S6, S7 |
| Formats | Living hubs: /calendar, /gta6, /gta6/release-time (new, C08), /guides/pc-fixes (new, C60), /switch-2 (new, C61), /steam (new, C62), /mmo (new, C15). Templates: F07 Fix It Friday, F08 Where Can I Play It?, F09 In Order (C63). |
| Frequency | 4 new or substantially updated evergreen pages a week (F07 Fri, F08 Tue + Sat, F09 Sat) plus hub updates on news days. |
| Voice | Answer in the first two sentences; "Updated on" line; source links; no "benchmarks" or "140,000+" in titles (C01, D-001). |
| CTA | On release pages: button **"Remind me on release day"** (C45). On fix pages: **"Add this game to your library and we'll tell you when it's patched"** → /register?from=pc-fix. |
| Success metric | Search Console clicks to pillar pages. TARGET formula: week-4 baseline × 1.5 by week 12, set on Mon 26 Oct once four weeks of Search Console data exist. |
| Workflow | ED packages each page from its template (45 min: title, H1, 3–5 internal links, "Updated on", schema check). EIC reads Search Console every Monday 10:00 (30 min) and sends ED the three queries to act on. DEV items: D-002, D-006, D-021, D-023. |
| Do not | Publish scaled thin pages, codes or daily-answer pages [R04]; claim benchmarks; create game stubs with no TechPlay text; chase "GTA 6 news" head terms owned by fan domains [R17]. |

#### 2. Google Discover — PRIMARY

| Field | Plan |
|---|---|
| Role | Largest free distribution for timely stories. The February 2026 update favours "in-depth, original, and timely content from websites with expertise in a given area", judged topic by topic [R07, R08]. TechPlay's topics are the five pillars (P1–P5). |
| Audience | S1, S3, S4, S5, S8 |
| Formats | Pillar news with something added (dates, platforms, "what it means for you"), data stories (C20–C26), F10, F24 Verdict, F03 ledger updates. |
| Frequency | Every pillar article (ESTIMATE ≤15 a week once general tech and phones are dropped; current output is ~3.3–3.5 items a day [R02]). |
| Voice | Title states the news. No withheld answers, no "quietly", no exaggeration [R07]. |
| CTA | Article-end block (D-010): **"Get the Friday issue: what's out, what's on sale, what to play"** + **"Join the Discord"** + **"Connect Steam and see your hours"**. |
| Success metric | Discover clicks by pillar (Search Console). Guardrail: share of Discover clicks from P1–P5 ≥80% (TARGET). |
| Workflow | ED runs a five-item check before publish (5 min): 16:9 hero ≥1200 px wide, title states the fact, byline, date, primary source linked. `max-image-preview:large` is already set [R03]. |
| Do not | Rewrite IGN stories with nothing added; publish phone or general-tech news under TechPlay's name; use images under 1200 px. |

#### 3. Google News / Top Stories — SECONDARY

| Field | Plan |
|---|---|
| Role | Inclusion is automatic [R07]. Today Google News lists 99 game-database pages and 1 article for site:techplay.gg [R02]; fixing that is plumbing (D-022), and earning a place needs original reporting. |
| Audience | S8, S4, S1 |
| Formats | Sourced news in the pillars, F17 Studio Watch, F03 ledger, PR data stories. |
| Frequency | ~10 news items a week that meet the sourcing bar. |
| Voice | Who, what, source link in the first paragraph; timestamped "Update:" lines on developing stories [R04 Kotaku lesson]. |
| CTA | **"Add TechPlay as a preferred source on Google"** (existing block, moved into the article-end CTA stack). |
| Success metric | Count of TechPlay articles (not game pages) in a Google News site: search, checked weekly; Top Stories impressions in Search Console. |
| Workflow | ED 30 min a week: audit five items for source links and update lines. DEV ships D-022 in C02. |
| Do not | Treat eligibility as a plan; leave sources unlinked (0 external links in 6 sampled articles [R02]). |

#### 4. Bing — LOW PRIORITY

| Field | Plan |
|---|---|
| Role | IndexNow already pings on publish [R07]. TechPlay appeared in none of 114 Bing results pages checked [R03]; fixes that help Google help Bing. |
| Audience / Formats | S1, S3 / same pages as Google Search |
| Frequency / Owner | Automated / EIC checks Bing Webmaster Tools the first Monday of each month (15 min) |
| CTA / Metric | Same on-page CTAs / Bing clicks and indexed articles, monthly |
| Do not | Build Bing-specific content or buy Microsoft Ads. |

#### 5. Microsoft Start (MSN) — LOW PRIORITY

| Field | Plan |
|---|---|
| Role | Syndication route for a small publisher is UNKNOWN; partner pages returned server errors [R07]. |
| Work | None this quarter. EIC re-checks the route once in Q1 2027 and records apply / do not apply. |
| Do not | Spend time before the route is documented. |

### 3.2 Meta: Facebook (detail: 06-FACEBOOK.md)

The Facebook Page and Instagram account exist behind login walls; follower counts are UNVERIFIED [R02]. Facebook link reach is widely reported as weak but was not re-checked [R07]. The spine ranks the Page EXPERIMENTAL (R07 said LOW PRIORITY; see §5).

#### 6. Facebook Page — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Six-week test of native images, polls and questions. Regional readers share through Facebook and WhatsApp; article share buttons already include WhatsApp [R02]. |
| Audience | S1, S7, S9, S10 |
| Formats | F06 On This Day image (daily), F04 The Number (Tue/Thu/Sat), F01 link post (Mon), F11 question (Mon), F12 poll (Wed), F05 card (Thu), F24 Verdict card. |
| Frequency | 15 a week, all batch-scheduled on Monday. |
| Voice | One question or one fact per post. The link goes in the post only when the post is about the page. |
| CTA | F01: **"Every release this week, each with a remind-me button: techplay.gg/calendar"** (utm_source=facebook, utm_medium=organic-social, utm_campaign=c04-out-this-week, utm_content=f01-link-a). |
| Success metric | Comments and link clicks per post; the Mon 9 Nov read decides keep (≥ median of the first three weeks sustained) or cut to F01 + F12 only. |
| Workflow | SC schedules the week in Meta Business Suite, Mon 12:00–12:30; replies in the MBS inbox at the 18:30 slot (1 h/week). |
| Do not | Post link-only; run "like and share to win" (Meta forbids requiring shares [R16]); press "Boost" (worst-instrumented spend [R16]). |

#### 7. Facebook Groups — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Answers in two or three WoW, GTA or regional gaming groups, from a named staff profile. Group rules were not fetched [R07]. |
| Audience | S5, S9, S10 |
| Formats / Frequency | Helpful answers, a tool link only where rules allow / 3 a week |
| Voice | First person, signed: "— [name], TechPlay" |
| CTA | Only when asked: the exact page that answers, e.g. **"The Analyzer checks this in about five seconds: techplay.gg/wow-analyzer"** (utm_source=facebook, utm_medium=community). |
| Success metric | Answers thanked or accepted; facebook/community sessions |
| Workflow | SC, 30 min a week at the 18:30 slot, after reading each group's rules. |
| Do not | Drop links and leave; post articles into groups; join groups that ban publishers. |

#### 8. Facebook Reels — SECONDARY (part of the vertical video system)

| Field | Plan |
|---|---|
| Role | One more placement for the C49 master file. No Facebook-only edit. |
| Audience / Formats | S1, S3, S4 / F01, F02 (3 a week to 19 Nov), F07; F18 after 19 Nov |
| Frequency | 5 a week |
| CTA | Caption line: **"Remind yourself about any of these: techplay.gg/calendar"** |
| Success metric | 3-second views per Reel, compared with the same file on other platforms |
| Workflow | SC cross-posts with the Instagram Reel in Meta Business Suite (3 min each). |
| Do not | Upload TikTok-watermarked files; use audio we cannot license. |

#### 9. Facebook Stories — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Mirror of Instagram Stories at no extra cost. |
| Formats / Frequency | F02 countdown card, F12 poll / 7 a week |
| CTA | Link: **"Set a GTA VI reminder"** → techplay.gg/games/grand-theft-auto-vi |
| Metric / Workflow | Views and link taps / cross-post toggle in MBS (15 min a week of checks) |
| Do not | Make Facebook-only Stories. |

### 3.3 Meta: Instagram (detail: 07-INSTAGRAM.md)

#### 10. Instagram Feed (single images) — SECONDARY

| Field | Plan |
|---|---|
| Role | Single cards people save or screenshot: stats and verdicts. |
| Audience | S1, S4, S8 |
| Formats / Frequency | F04 The Number (T2, 1080×1350), F24 Verdict card / 3 a week |
| Voice | One fact and a source line on the image itself. |
| CTA | Caption: **"Source and full story: link in bio"** (bio link → /calendar with utm_content=bio). Link handling in captions is UNVERIFIED [R07]. |
| Success metric | Saves and shares per post |
| Workflow | DS fills the card (10 min); SC schedules in the Monday batch. |
| Do not | Publish a number without a source line, or any member count. |

#### 11. Instagram Carousel — SECONDARY

| Field | Plan |
|---|---|
| Role | The main Instagram format: lists the database produces. Carousels suit data cards and lists [R07]. |
| Audience | S1, S2, S4, S6, S7 |
| Formats | F01 Out This Week (Mon, 8 slides), F03 Confirmed or Rumour? (Thu, 6 slides, to 19 Nov; F16 or F18 after), F05 Hidden Gem (Thu, 5 slides), F09 In Order (Sat, 8–10 slides). F08 monthly. |
| Frequency | 4 a week |
| Voice | Slide 1 gives the payoff ("11 games out this week. 4 on Switch 2."). Last slide says what to do on the site. |
| CTA | Last slide: **"Every date, one tap to remind you. techplay.gg/calendar"** |
| Success metric | Saves per carousel; bio-link sessions with utm_content=f01-carousel-a and similar |
| Workflow | Mon: ED exports the week from /calendar. Tue–Wed: DS fills the carousel template (40 min each). SC writes caption and alt text (10 min each). |
| Do not | Use cover art without a credit line; design one-off layouts outside the template library (file 05 §3). |

#### 12. Instagram Reels — SECONDARY (part of the vertical video system)

| Field | Plan |
|---|---|
| Role / Formats | Placement of the C49 master / F01, F02, F07, F18 |
| Frequency | 5 a week |
| CTA | **"Full list with reminders: link in bio"** |
| Metric / Workflow | Plays, shares, bio sessions / SC uploads with the FB cross-post (3 min) |
| Do not | Repost trailers; rely on trending audio. |

#### 13. Instagram Stories — SECONDARY

| Field | Plan |
|---|---|
| Role | Daily habit to 19 Nov: the GTA VI countdown, plus the weekly poll. |
| Audience | S4, S10, S1 |
| Formats | F02 countdown card (daily), F12 poll sticker (Wed), F01 teaser (Mon) |
| Frequency | 9 a week |
| Voice | One line, one fact, one sticker. |
| CTA | Link sticker **"Remind me on 19 Nov"** → techplay.gg/games/grand-theft-auto-vi?utm_source=instagram&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-dayNN-story |
| Success metric | Link taps, poll votes, reminder_set with utm_source=instagram |
| Workflow | DS builds all 52 countdown cards in week 1 from one template with a day field; SC schedules seven each Monday. |
| Do not | Put a rumour on a countdown card; keep counting after launch (switch to "what to do first"). |

#### 14. Instagram Broadcast Channel — NOT NOW

| Field | Plan |
|---|---|
| Why not | A one-to-many channel needs an engaged following; Instagram's count is UNVERIFIED [R02]. |
| Trigger | Revisit at the 9 Nov review if carousel saves hold for six weeks. |
| Do not | Open a channel that will go silent (the YouTube lesson [R07]). |

### 3.4 Short video and YouTube (detail: 08-TIKTOK.md, 09-YOUTUBE.md, 18-VIDEO.md)

TechPlay has a YouTube channel with 20 subscribers and no videos, and no TikTok [R02, R19]. R19 recommends one weekly format on one short-form platform first; the spine makes vertical video one production placed on four platforms (C49 from 5 Oct). The test answers which placement earns the most per file.

#### 15. TikTok — SECONDARY (master platform for vertical video)

| Field | Plan |
|---|---|
| Role | Where the master is made and posted first. Account to be created as @techplay.gg (both handles were free on 27 Sep [R02]). |
| Audience | S1, S3, S4, S7 |
| Formats | F01 Out This Week (30–45 s, Mon), F02 GTA countdown (15–20 s, Tue/Thu/Sat to 19 Nov), F07 Fix in 60 seconds (Fri), F18 Games Like (Sun, from 22 Nov). |
| Frequency | 5 a week (4 after 19 Nov) |
| Voice | No presenter. Burned-in captions, data visuals, cover art with credit. No hype voice-over. |
| CTA | On-screen end card and caption: **"Every release this week with a remind-me button. Link in profile."** |
| Success metric | Views, completion proxy and profile visits per video over six weeks (5 Oct–15 Nov); read on Mon 16 Nov decides which placement leads in December. |
| Workflow | Mon: ED exports data (30 min). Tue: DS drops it into the video template (CapCut or Canva [R19]). SC edits and exports masters (30–45 min each [R19]); scheduled the same day. |
| Do not | Re-upload trailers or leaked footage (Rockstar is policing IP [R17]); use AI voice before disclosure rules are checked [R19]; post watermarked exports elsewhere. |

#### 16. YouTube long-form — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Two pilots only (C50): **"Every GTA game in order before VI"** (Thu 12 Nov) and **"Release Radar: January 2027"** (Mon 28 Dec). Data-and-map videos travel without a presenter [R19]. |
| Audience | S4, S1 |
| Formats | 8–12 minute voice-over with motion slides and credited official stills |
| Frequency | 2 in the quarter |
| Voice | Calm narrator, dated, sources on screen. |
| CTA | Description line 1: **"Every GTA VI date and reminder: techplay.gg/gta6"**; end screen to the channel's Shorts playlist. |
| Success metric | 28-day read per pilot: average view duration and subscribers gained. Go/no-go on monthly Release Radar made on Mon 25 Jan 2027. |
| Workflow | Per pilot: EIC script 4 h, DS 8 motion slides 4 h, SC assembly and upload 3 h. |
| Do not | Start weekly long-form before the pilots are read; use more than short credited excerpts of official footage before publisher video policies are read [R19]. |

#### 17. YouTube Shorts — SECONDARY (part of the vertical video system)

| Field | Plan |
|---|---|
| Role / Formats | Second placement of the master; fills the empty channel before the pilots / F01, F02, F07, F18 |
| Frequency | 5 a week |
| CTA | Pinned comment: **"This week's releases, each with a reminder: techplay.gg/calendar"** |
| Metric / Workflow | Views and subscribers gained per Short / SC uploads in YouTube Studio (3 min) |
| Do not | Use titles that withhold the answer. |

#### 18. YouTube Community tab — LOW PRIORITY

| Field | Plan |
|---|---|
| Role | Poll and link post for subscribers, if the channel is eligible (rules UNVERIFIED). |
| Frequency / CTA | 2 a week: the F12 poll and the F01 link, same wording as X |
| Metric / Workflow | Poll votes / SC, 5 minutes |
| Do not | Treat it as a growth channel. |

#### 19. YouTube livestreams — NOT NOW

| Field | Plan |
|---|---|
| Why not | No presenters, no schedule [R07]. Live events run as Discord watch parties and X live threads (F20). |
| Do not | Restream The Game Awards or publisher streams. |

### 3.5 Text networks (detail: 10-X-THREADS-BLUESKY.md)

#### 20. X — SECONDARY

| Field | Plan |
|---|---|
| Role | Breaking news in the pillars, live events, and the network of journalists and developers. @TechPlayGG exists but is not linked from the footer (fix in C02) [R02]. X's open ranking code scores predicted replies, reposts, clicks and dwell, and subtracts predicted mutes, blocks and reports [R07]. |
| Audience | S8, S4, S1, S3, S5 |
| Formats | F02 countdown (daily to 19 Nov), F06 On This Day (daily), F04 The Number (Tue/Thu/Sat), F01 thread (Mon), F13 Steam Movers (Tue), F03 ledger (Thu), F17 Studio Watch (Wed), F12 poll (Wed), F11 question (Mon), F24 Verdict, F20 live threads. |
| Frequency | 24 scheduled posts a week plus replies and news posts |
| Voice | Dry and sourced. The first line carries the fact. |
| CTA | Default: **"Every date, with reminders: techplay.gg/calendar"** (utm_source=x). File 10 has per-post CTAs. |
| Success metric | Replies and profile follows per post; sessions by utm_campaign |
| Workflow | SC schedules franchise posts in the Monday batch; ED posts pillar news within 30 min of publishing; EIC spends 30 min a week replying to journalists and developers. |
| Do not | Run X Ads [R16]; post engagement bait; state rumours as fact; quote-post to mock. |

#### 21. Threads — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Conversation first: one question a post, tied to the week. Whether @techplay.gg exists on Threads is UNVERIFIED [R02]. |
| Audience | S10, S1, S6 |
| Formats / Frequency | F11 question, F12 poll, question-led F02, F04 card / 12 a week |
| Voice | Warm and curious; links mostly in replies. |
| CTA | In a reply, when relevant: **"Your shelf can track this for you: techplay.gg/register?from=threads"** |
| Success metric | Replies per post; the 9 Nov read decides keep or fold into Instagram only |
| Workflow | SC writes the Threads variants in the Monday batch (30 min) and replies at the 18:30 slot. |
| Do not | Clone the X post; auto-crosspost. |

#### 22. Bluesky — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | The data and industry audience. Eurogamer, IsThereAnyDeal, Backloggd and the Hookshot sites list Bluesky [R04, R07]. TechPlay has no account; "techplay.gg" is not taken [R02]. |
| Audience | S8, S9, S3 |
| Formats / Frequency | F04, F17, F13, PR data threads, F06 / 10 a week |
| Voice | Analyst: method and source in the post; links are fine. |
| CTA | **"Methodology and full table: techplay.gg/data/studios-closed-2026"** (new, C22) and similar |
| Success metric | Reposts by industry accounts; bluesky/organic-social sessions |
| Workflow | SC 45 min a week; EIC 15 min on replies. Domain handle via DNS needs approval (README §14), so DEV serves the web-file method if chosen. |
| Do not | Post memes first or auto-crosspost from X. |

### 3.6 Communities (detail: 11-REDDIT.md, 12-DISCORD.md)

#### 23. Reddit — SECONDARY (contribution)

| Field | Plan |
|---|---|
| Role | C47 Reputation Program (28 Sep–27 Dec): two named staff accounts answer questions with TechPlay data. Reddit's rules require authentic participation [R07]; top gaming posts are art, nostalgia and complaints, and publisher links are rare [R06]. |
| Audience | S3, S4, S5, S2, S8 |
| Formats | Answers in r/pcgaming, r/patientgamers, r/wow, r/GTA6, r/Steam; F13 data as a comment; C48 data posts on PR dates only. |
| Frequency | 6 answers a week; data posts on 7 Oct, 14 Oct, 28 Oct, 4 Nov, 8 Dec, if each subreddit's rules allow. |
| Voice | First person. When linking: "Disclosure: I work on TechPlay." |
| CTA | Only when it answers the question, e.g. **"I wrote up the fix with screenshots here (I work on TechPlay): techplay.gg/guides/pc-fixes"** (utm_source=reddit, utm_medium=community, utm_term=<subreddit>). |
| Success metric | Answers with positive score; reddit/community sessions per subreddit |
| Workflow | SC 30 min each weekday; EIC reviews every C48 post before it goes up. Per-subreddit rules are UNVERIFIED and must be read first [R07]. |
| Do not | Link-drop, post from a brand account, ask for votes, or post into art and meme threads. |

#### 24. Discord — PRIMARY

| Field | Plan |
|---|---|
| Role | Retention core. 160 members, Community enabled, no Onboarding [R13]. Buffy already posts articles, welcomes, XP and a Sunday recap. Discovery needs 1,000 members and Insights 500 [R13]. |
| Audience | S10, S5, S4, S2 |
| Formats | F11 thread (Mon), F12 native poll (Wed), F06 by Buffy (daily), F02 in #gta6 (daily to 19 Nov), F14 Sunday wrap (20:00), F15 in #wow (Tue), F13 (Tue), F05 (Thu), F07 in #pc-help (Fri), F20 watch parties, F22 Game Club, F23 Next Fest diary. |
| Frequency | 22 posts a week and one Scheduled Event |
| Voice | Buffy hosts: dry, one owl line at most, never guilt [R13]. Humans moderate. |
| CTA | Everywhere else: **"Talk about it with us on Discord: discord.gg/wPQG9gUMXH"**, one invite code per campaign after D-011 (C36). |
| Success metric | Weekly chatters ÷ members (Discord's guide calls ~30% communicating healthy [R13]); discord_join by invite code. TARGET: 500 members by 31 Dec (C36 "Road to 500"). |
| Workflow | C35 rebuild 28 Sep–12 Oct (Onboarding, Server Guide, channels, AutoMod). Then SC's weekly checklist: Mon thread, Wed poll, Sun wrap, 30 min moderation a day, one event. |
| Do not | Add channels without a ritual; @everyone except for events; show member counts that are not live. |

#### 25. Twitch — NOT NOW

Needs presenters and a fixed schedule; IGN streams, TechPlay has no hosts [R07]. Revisit in Q2 2027.

#### 29. Steam Community / Curator — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | C69 (live 20 Oct): TechPlay picks appear on Steam store pages; later, Curator Connect for review copies [R15]. |
| Audience | S1, S2, S3, S7 |
| Formats | F05 Hidden Gem, F24 Verdict and F23 Next Fest picks as curator recommendations |
| Frequency | 3 a week |
| Voice | Two sentences: who it is for, one thing to know. |
| CTA | Recommendation link: **"Our verdict and where else to play it: techplay.gg/games/<slug>"** (utm_source=steam, utm_medium=referral) |
| Success metric | Curator followers (Steam's counter) and steam/referral sessions; review at 8 weeks (Mon 14 Dec) |
| Workflow | ED, 20 min per recommendation, from that week's F05/F24/F23 output. |
| Do not | Recommend games nobody on staff played; let the page go stale [R07]. |

#### 30. Gaming forums (ResetEra and similar) — LOW PRIORITY

Monitoring only; rules pages were blocked in research [R13]. No brand posting. Covered inside Reddit reading time.

#### 31. Game-specific communities — SECONDARY (participation)

| Field | Plan |
|---|---|
| Role | Be useful where TechPlay's tools meet a live need: WoW patch readiness and guild recruiting (recruit posts list progression and item level, which the Analyzer reads [R13]); GTA VI fact-checking; Next Fest developer feedback. |
| Audience / Frequency | S5, S4, S9 / 3 contributions a week |
| CTA | When relevant: **"Paste your character and it checks gear and M+ readiness: techplay.gg/wow-analyzer"** (utm_medium=community) |
| Metric / Workflow | tool_run with utm_medium=community / SC 45 min a week |
| Do not | Post TechPlay's Discord invite in other servers. |

### 3.7 Professional and not-now networks

#### 26. LinkedIn — LOW PRIORITY

| Field | Plan |
|---|---|
| Role | B2B only: PR data, partners, the press page (C54). No company page was found [R02]. |
| Formats / Frequency | Thursday F04 card, F17 summary, PR releases / 1 a week, Thu 09:30 Sarajevo |
| Voice | Plain business English; method first. |
| CTA | **"Methodology, data and contacts: techplay.gg/press"** (new, C54) |
| Metric / Workflow | Inbound press and partner contacts / EIC, 30 min |
| Do not | Post gamer content or engagement bait. |

#### 27. Pinterest — NOT NOW. No gaming-publisher precedent found [R07].

#### 28. Snapchat — NOT NOW. No realistic publisher route [R07].

### 3.8 Owned channels (detail: 17-NEWSLETTER-EMAIL.md, 16-ACTIVATION-RETENTION.md)

#### 32. Email (lifecycle and alerts) — PRIMARY

| Field | Plan |
|---|---|
| Role | The automated return channel that does not exist yet: 20 of 22 notification types stay on the site bell [R12, R20]. Builds: welcome sequence (C42, 12 Oct), release-day and price alerts (C43, 19 Oct; C31 20 Nov–1 Dec), "Your releases this week" (C41, first send Mon 26 Oct). |
| Audience | S1, S2, S7, S4 |
| Formats | 3-email welcome; Monday personalised releases; event-driven alerts |
| Frequency | 1 scheduled send a week plus alerts |
| Voice | First line is the fact: "Gears of War: E-Day is out today on Xbox Series X\|S and PC." Buffy signs in one line. |
| CTA | **"Open your library"** / **"See this week's releases"** → techplay.gg/calendar?utm_source=email&utm_medium=email&utm_campaign=c41-your-releases |
| Success metric | Click rate per delivered email; reminder_set or shelf_add within 24 h; guardrails complaint <0.1%, unsubscribe <0.5% per send (spine §3) |
| Workflow | DEV builds D-013, D-027, D-028. SC reads bounce/complaint numbers Mon and Thu (30 min a week). |
| Do not | Change DNS, SPF, DKIM, DMARC or SMTP without approval; mail unverified addresses; jump volume on a self-hosted sender with no Gmail reputation [R20]. |

#### 33. Newsletter: The Save File — PRIMARY

| Field | Plan |
|---|---|
| Role | Weekly Friday issue (F21, C40, first issue Fri 2 Oct). The generic digest is table stakes; a newsletter with a job (dates, prices, your list) is not [R20]. |
| Audience | S1, S2, S7, S8, S10 |
| Formats | 5–7 items: out this week, one number, one community item, what to play, GTA VI days left (to 19 Nov) |
| Frequency | 1 a week, Fri 08:30 Sarajevo (02:30 ET; US readers find it in the morning) |
| Voice | Editor's letter; dry and specific. |
| CTA | Capture: **"The Save File: every Friday, what's out, what's on sale, what to play. One email."** → techplay.gg/newsletter (new, D-012). In-issue: **"Set reminders for next week: techplay.gg/calendar"**. |
| Success metric | Verified subscribers (newsletter_verified); click rate; unsubscribe <0.5% per send. TARGET formula: verified subs = capture rate per 1,000 article views × article views; capture rate measured from 12 Oct. |
| Workflow | SC assembles Thu 14:00–16:30; EIC edits Thu 17:00 (30 min); scheduled for Fri 08:30. |
| Do not | Say "thousands of readers"; buy list growth before the hosting decision [R16]. |

#### 34. Web Push (reminders only) — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | C59 (live Mon 9 Nov): a soft prompt appears only after a user taps "Remind me". Chrome demotes sites with low acceptance; iOS supports push only for Home Screen web apps [R07]. |
| Audience / Formats | S1, S4 / release-day push; the GTA VI launch push |
| Frequency | Event-driven; max one push per user per day |
| Voice | "Grand Theft Auto VI is out on PS5 and Xbox Series X\|S." Nothing else. |
| CTA | The push opens the game page with store links. |
| Success metric | Opt-in rate at the remind-me prompt; alert_clicked ÷ reminder_delivered (channel=push). Stop rule from R16 T14: under 1% opt-in after two weeks → hide the prompt. |
| Workflow | Automated (D-019); SC reads opt-in weekly from 16 Nov in the Monday report. |
| Do not | Prompt on page load; push news. |

#### 35. Browser notifications (site-wide prompt) — NOT NOW

Never ask for notification permission on page load. None of 15 publishers checked uses push, and Chrome's quieter UI punishes low acceptance [R04, R07]. The only prompt is the contextual one in channel 34.

#### 36. RSS (plus Flipboard and Mastodon via RSS) — SECONDARY (infrastructure)

| Field | Plan |
|---|---|
| Role | Feeds Discover Follow, Feedly, Inoreader, Flipboard and bots [R07]. Today hardware links 404 and the feed lags ~24 h [R02]. |
| Work | DEV fixes /tech → /hardware and regenerate-on-publish (D-003, C02). ED checks the feed on Fridays inside Search time. Flipboard and Mastodon are fed from RSS at zero cost once it works (spine LOW PRIORITY). |
| CTA | RSS link inside the article-end block (D-010) |
| Metric | Feed lag under 15 minutes; zero broken links |
| Do not | Truncate items or add ads to the feed. |

#### 43. Site product loops — PRIMARY

| Field | Plan |
|---|---|
| Role | Every channel above should end in one of these: **Remind me** (C45), **Follow**, price alerts (C31, C43), shelves, ICS export (D-036). Only 3 of 55 members had added a game [R23]. |
| Audience | S1, S2, S4, S7 |
| CTA | **"Remind me"** on every game and calendar row; **"Follow"** on series and studios |
| Success metric | reminder_set per 1,000 game-page views; alert_clicked ÷ reminder_delivered |
| Workflow | DEV per backlog; SC owns alert copy (15 min a week). |
| Do not | Send guilt-trip notifications [R13]. |

### 3.9 Earned channels (detail: 22-DIGITAL-PR.md, 23-CREATORS.md, 24-PARTNERSHIPS.md)

#### 37. Digital PR — SECONDARY

| Field | Plan |
|---|---|
| Role | Links and citations from TechPlay's own data. Sites that earn links own a dataset others need to cite [R14]. Campaigns: C20 Release Congestion Index (Wed 7 Oct), C22 Studios Closed tracker (Wed 14 Oct, weekly updates), C21 Studio Atlas + Balkan census (Wed 28 Oct), C23 Sequel Gap (Wed 4 Nov), C24 The $80 Tracker (Wed 11 Nov), C25 cost per hour (Mon 23 Nov), C26 Achievement difficulty (Tue 8 Dec), C27 drafted for 12 Jan. |
| Audience | S8, S9 |
| Formats | Data page with methodology and CSV; 20 tailored pitches per campaign; a Reddit or Bluesky data post |
| Frequency | One campaign every two weeks on average |
| Voice | Method, numbers, caveats; no superlatives. |
| CTA | **"Methodology and CSV: techplay.gg/data/<slug>"** (utm_medium=pr) |
| Success metric | Referring domains per campaign; journalist replies |
| Workflow | DEV 1 h/week for data pulls; EIC 4 h/week writing and pitching. GamesPress will not carry TechPlay's releases [R15], so every pitch is direct. |
| Do not | Present the GTA map as TechPlay's own dataset before D-020; publish a number that cannot be reproduced from the site. |

#### 38. Creators — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | C51 (from 20 Oct): the currency is data and distribution, not money [R15]. A creator gets a data point, an embed or a Discord Stage slot; TechPlay gets a credited link. |
| Audience | S4, S5, S1 |
| Formats | Data pack for a video (e.g. Next Fest demo stats, GTA VI edition table); Discord Stage AMA; co-built list |
| Frequency | 2 tailored offers a week |
| Voice | Peer to peer; the offer in the first line. |
| CTA | Requested credit line: **"Data: techplay.gg/<page>"** (utm_source=creator-<handle>, utm_medium=creator) |
| Success metric | Credited mentions; creator-<handle> sessions |
| Workflow | EIC, 45 min per offer, targets from Keymailer, Lurkit and the list method in file 10. |
| Do not | Pay for posts, hide arrangements, or quote audience figures we cannot show. |

#### 39. Influencers (paid) — NOT NOW

No budget line and no measurement until C03 is done. Paid tests are gated to Meta, Reddit and branded search from 19 Oct (spine §13).

#### 40. Partnerships — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | C71 Next Fest outreach to studios and indies (5–20 Oct); C55 Balkan partners in November (studios, A1 Adria League, regional press) [R15]. |
| Audience / Frequency | S9, S1 / one partner action every two weeks |
| CTA | **"Your studio page: techplay.gg/studios/<slug>"**; regional: techplay.gg/studios/country/ba |
| Metric / Workflow | Partner links and joint posts delivered / EIC, 1 h a week |
| Do not | Sign exclusivity; disguise paid placements as editorial. |

#### 41. Referral — EXPERIMENTAL

| Field | Plan |
|---|---|
| Role | Invite codes per campaign and referral roles (C36); Founding 100 badge for the first 100 activated members (C68). |
| CTA | **"Bring one friend who plays what you play. Your invite link is on your profile."** |
| Metric | discord_join and registration_complete by referral code |
| Workflow | SC keeps the invite-code log (30 min a week). |
| Do not | Pay cash or giveaway entries for invites; use share-to-enter tasks on Meta [R16]. |

#### 42. Word-of-mouth — SECONDARY (an outcome, not a schedule)

| Field | Plan |
|---|---|
| Role | What product loops produce: Gamer DNA share cards (D-024), Your 2026 in Games (C28, 14–31 Dec), lists, Game Club talk. |
| CTA | **"Make yours: techplay.gg/year-in-review"** (new) |
| Metric | share_card_generated and social_share per weekly returning member |
| Do not | Invent testimonials or member numbers. |

## 4. Start order

| Week | Channels switched on |
|---|---|
| 28 Sep | Discord rebuild (C35), X (linked in footer by C02), Instagram and Facebook Stories countdown, Reddit program (C47), bios rewritten (C01) |
| 5 Oct | Vertical video on TikTok, Shorts, Reels, FB Reels (C49); carousels; Threads and Bluesky accounts opened; newsletter issue 2 |
| 12 Oct | Welcome email (C42); PC Fix Hub (C60) in Search |
| 19–26 Oct | Alerts (C43), Remind me for guests (C45), Steam Curator (20 Oct), creators (C51), first personalised email (26 Oct) |
| 9 Nov | Web push (C59); **social review**: keep or cut Facebook Page, Groups, Threads, Bluesky, IG Broadcast trigger |
| 16 Nov | Vertical video placement read |
| 14 Dec | Steam Curator review |

## 5. Decisions and conflicts recorded here

- **Class differences from R07.** The spine is canonical: Facebook Page, Threads and Bluesky are EXPERIMENTAL (R07 said LOW PRIORITY); vertical video and Instagram carousels/Stories are SECONDARY (R07 said EXPERIMENTAL). This file follows the spine.
- **Classes assigned here** (not in spine §12): Instagram Broadcast Channel NOT NOW; YouTube Community tab LOW PRIORITY; YouTube livestreams NOT NOW; gaming forums LOW PRIORITY; game-specific communities SECONDARY (under C47); Digital PR SECONDARY; creators, partnerships and referral EXPERIMENTAL; paid influencers NOT NOW; word-of-mouth SECONDARY as an outcome.
- **"Browser notifications" and "Web Push"** are treated as two channels: the site-wide permission prompt (NOT NOW) and contextual reminder push (EXPERIMENTAL).

## Dependencies and open questions

- **C01/C02 first.** No channel promotes the site until D-001 (false claims), D-004 (dead invites) and D-003 (RSS) are live. Owner: DEV/EIC, by 2 Oct.
- **Account inventory (SC, 28 Sep):** confirm logins and follower counts for X, Facebook, Instagram and YouTube; confirm whether Threads exists; create TikTok and Bluesky. Baselines go in the first Monday report.
- **C09 giveaway status:** VERIFY IN ADMIN on 28 Sep. No channel mentions a GTA VI giveaway until verified, and any Meta-facing giveaway drops the share and retweet tasks [R16].
- **/newsletter (D-012)** must be live by Fri 2 Oct; otherwise the first issue's capture CTA points to the /news sidebar form.
- **D-011 invite attribution** decides whether discord_join can be read by campaign; until then use discord_click.
- **D-020 map provenance:** no channel presents the 1,058-location map as TechPlay's own dataset until gtadb.org attribution is settled.
- **Consistency with per-network files:** 06–09, 11, 12, 17, 18 and 22–24 were written in parallel. Their posting frequencies must sum to no more than SC's 25 h and DS's 10 h; any excess is resolved in favour of the PRIMARY channels.
- **Platform specs** (image sizes, link handling in captions, Community tab eligibility, TikTok scheduling) were not researched [R07, R19]; SC verifies each in platform help during week 1.
- **Time zones:** Sarajevo moves from CEST to CET on 25 Oct and the US leaves daylight time on 1 Nov, so the ET offset is 5 hours from 25 Oct to 31 Oct and 6 hours otherwise. Scheduled US-slot posts must be checked that week.
