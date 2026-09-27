# 05 — Social Media Operating System

Status: Phase 2 plan — 27 Sep 2026

- Social runs as one weekly production line: **Monday planning → Tuesday/Wednesday batch design → scheduling → daily 18:30 community slot → Monday report**. SC owns it; DS fills templates; ED supplies data and fact checks; EIC approves anything sensitive.
- Twenty-four franchises (F01–F24) are the only recurring content. Each has a fixed template, a hook pattern, a CTA and a repurposing path. Nothing is designed from scratch after week 1.
- The template library is seven static templates and three video templates in TechPlay's own dark UI: near-black surfaces (#05070A, #0B0E14), crimson #DC143C for fills, #FF4D6A for accent text, Instrument Sans for headlines, IBM Plex Sans for body, IBM Plex Mono for numbers and source lines (from `frontend/app/globals.css`).
- Three approval tiers: templated posts go straight out; anything with a number, price, date or platform gets an ED check; GTA VI status changes, layoffs, giveaways, corrections and disputes need EIC.
- Response SLAs: Discord questions 4 h in staffed hours (09:00–23:00 Sarajevo), public comments and DMs 24 h, corrections acknowledged in 2 h and fixed in 24 h, crisis holding line in 1 h.
- Posting today happens only 17:30–21:30 CET, with nothing in US daytime [R02]. The grid in §11 adds a 08:30 Sarajevo slot for Europe and 15:30/22:30 Sarajevo slots for the US morning and afternoon (US is ~35% of traffic [R16]). All slot times are hypotheses to test, not benchmarks.
- Every public number is live or sourced. No member counts, no "thousands", no "#1" (spine §2). Social bios are rewritten in C01 because the current X and YouTube bios claim hardware testing that does not exist [R02].
- Tooling is free or already owned: Meta Business Suite, YouTube Studio, a free-tier scheduler for X/Threads/Bluesky/LinkedIn, Discord native events and polls, Professor Buffy, Figma/Canva, CapCut. No pricing is claimed; plan limits are checked before use.

---

## 1. Roles

| Role | Social responsibilities | Hours/week (from file 04) | Decides |
|---|---|---|---|
| SC | Calendar, captions, scheduling on all networks, daily community slot, Discord rituals and moderation, Reddit program, newsletter assembly, Monday report | 24.75 | What posts when; replies; moderation up to Time Out |
| DS | Template library (week 1), per-post fills, video templates, OG/share card upkeep | 10 | Layout within the brand rules in §3 |
| ED | Data exports (calendar, Steam charts, hidden gems, on-this-day), Tier B fact checks, pillar news posts on X within 30 min of publish, F07 scripts | 7.5 on channels | Whether a number, date or platform is right |
| EIC | Tier C approvals, crisis lead, journalist and developer replies, PR data posts, YouTube pilot scripts | 13 on channels | Rumour status, corrections, anything legal or reputational |
| DEV | UTM helper (D-009), invite attribution (D-011), share cards (D-024), Buffy automation of F06 (C65) | backlog | Technical feasibility |
| Professor Buffy (bot) | Posts F06 On This Day, the Sunday wrap (F14), welcomes, rank-ups, article announcements | automated | Nothing; Buffy announces, humans moderate [R13] |

## 2. Weekly production pipeline

All times Sarajevo (CEST to 25 Oct, CET after).

| Day | Time | Who | Task | Minutes |
|---|---|---|---|---|
| Mon | 09:30–10:00 | SC, ED, DS, EIC | Planning stand-up: pick each franchise's topic for the week from the checklist below; confirm GTA VI facts against the R17 ledger; name the Tier C items | 30 |
| Mon | 10:00–11:00 | ED | Exports: /calendar week (F01), hidden-gems endpoint shortlist (F05), on-this-day list for 7 days (F06), last week's shelf and poll numbers (F14) | 60 |
| Mon | 10:00–11:30 | SC | Captions for the week, one variant per network (X, Threads, Bluesky, IG, FB, TikTok, LinkedIn); UTM links from the sheet | 90 |
| Mon | 11:30–12:00 | SC | Monday report (§12) | 30 |
| Mon | 12:00–12:30 | SC | Schedule Stories, Facebook and Instagram batch in Meta Business Suite; X/Threads/Bluesky batch in the scheduler | 30 |
| Mon | 17:30 | ED | F01 article live; SC releases F01 posts (already scheduled) | — |
| Tue | 09:00–12:00 | DS | Batch design 1: F01 carousel, F04 cards ×3, F08/F09 slides, F02 video fills | 180 |
| Tue | 13:00–14:30 | SC | Edit and export vertical video masters (F01, F02) | 90 |
| Wed | 09:00–11:00 | DS | Batch design 2: F03, F05 carousels, F24 card, F07 video fill | 120 |
| Wed | 11:00–12:00 | SC | Edit F07 master; schedule the rest of the week | 60 |
| Thu | 14:00–16:30 | SC | Assemble The Save File (F21) | 150 |
| Thu | 17:00–17:30 | EIC | Edit newsletter; clear Tier C queue | 30 |
| Daily | 18:30–19:00 | SC | Community slot: replies on all networks, Facebook Groups answers, Threads replies | 30 |
| Weekdays | 30 min (varies) | SC | Reddit answers (C47) | 30 |
| Daily | 2 × 15 min | SC | Discord moderation and ritual prompts | 30 |
| Sun | 20:00 | Buffy + SC | F14 Weekly Wrap posts; SC adds member of the week | 15 |

**Monday topic checklist** (one line each, filled in the stand-up): F01 releases · F02 seven facts · F03 ledger changes · F04 three numbers with sources · F05 gem · F07 fix · F08 question · F09 series · F10 game · F11 prompt · F12 poll question · F13 movers (Tue data) · F15 tip · F16 (sale weeks) · F17 (if news) · F18 game · F19 member (opt-in) · F20 (event weeks) · F22/F23 (their months) · F24 game.

## 3. Template library

DS builds all masters in Figma in week 1 (28 Sep–2 Oct) and exports Canva copies for SC's text-only fills. Sizes are the standard platform specs; platform documentation was not fetched in Phase 1 [R07, R19], so SC confirms each in platform help before the templates are locked on Fri 2 Oct.

### 3.1 Brand rules for every template

| Element | Rule |
|---|---|
| Background | #05070A (surface-0). Panels #0B0E14; inner cards #10141B. No other near-blacks. |
| Accent fills | #DC143C (crimson) for bars, chips, day-number blocks, poll bars. White on crimson passes contrast (4.99:1 measured in the site's CSS). |
| Accent text | #FF4D6A only. Crimson text on black is 4.04:1, under the 4.5:1 small-text bar; #FF4D6A is 6.26:1. |
| Text | #FFFFFF for headlines; 70% white for body; 45% white for credits. |
| Fonts | Headline: Instrument Sans SemiBold. Body: IBM Plex Sans. Numbers, dates, kickers, source lines: IBM Plex Mono. All three load from Google Fonts. |
| Kicker | Franchise name top-left in IBM Plex Mono caps, 28 px on 1080-wide canvases, #FF4D6A, e.g. `OUT THIS WEEK · 12–18 OCT`. |
| Source line | Bottom-left, IBM Plex Mono 22 px, 45% white: `Source: Steam charts, week to 26 Sep 2026`. Mandatory on any number. |
| Wordmark | `techplay.gg` bottom-right, IBM Plex Mono 24 px, white. |
| Buffy mark | Optional 56 px corner mark, bottom-right above the wordmark, only on F06, F11, F14 [R13: "character as a small corner mark, not the post"]. Needs the artwork (open question). |
| Cover art | Official store or press art only, credited in the source line ("Art: Rockstar Games"). No leaked or datamined images [R17]. |
| Margins | 64 px on all sides; nothing but background in the outer 64 px. |

### 3.2 Static templates

| Code | Size | Used by | Zones (top to bottom) |
|---|---|---|---|
| T1 Square card | 1080×1080 | F04, F06 on X, Bluesky, Threads, Facebook | Kicker (y 64–110) · headline number in Plex Mono 180 px (y 260–460) · one-line context in Instrument Sans 48 px (y 500–640) · crimson rule 8 px (y 700) · source line + wordmark (y 960–1016) |
| T2 Portrait slide | 1080×1350 | IG carousels and singles; F01, F03, F05, F08, F09, F24 | Kicker (64–110) · title 72 px (140–360) · content block: up to 4 rows of cover (160×213) + name + date/platform chips (400–1150) · slide counter "3/8" top-right · source + wordmark (1230–1286) |
| T3 Vertical card | 1080×1920 | IG/FB Stories: F02 countdown, F12 poll, F01 teaser | Keep text inside y 250–1670 (UI safe area; verify). Day number block: crimson square 520×520 centred, white Plex Mono 260 px · fact in Instrument Sans 56 px below · space for link or poll sticker at y 1350–1600 |
| T4 Landscape | 1600×900 | X and Bluesky images, Discord embed images, Next Fest diary | Left 60%: headline and three bullets; right 40%: cover or chart; source line bottom-left |
| T5 OG image | 1200×630, JPEG/WebP ≤300 KB | Articles, hubs, data pages | Title left, cover right, kicker top-left. Replaces 2–2.5 MB PNGs on the GTA 6 hub and WoW Analyzer [R02] |
| T6 YouTube thumbnail | 1280×720 | C50 pilots | Title max 5 words in Instrument Sans Bold 110 px; one image; no arrows or shocked faces |
| T7 Data chart | 1600×900 and 1080×1350 | F13, F17, PR data posts | Bar or slope chart in white and crimson only; axis labels in Plex Mono; "Method: …" line above the source line |

### 3.3 Video templates (built in CapCut or Canva [R19])

| Code | Length | Used by | Structure |
|---|---|---|---|
| V1 Out This Week | 30–45 s | F01 | 0–2 s: "Out this week" + date range · 2–35 s: one game per 3 s card (cover, name, day, platform chips) · last 4 s: end card "Remind me: link in profile" |
| V2 Countdown | 15–20 s | F02 (Tue/Thu/Sat) | 0–2 s: day number · 2–15 s: one confirmed fact on official still with credit · end: "19 Nov · PS5 · Xbox Series X\|S" |
| V3 Fix in 60 | 45–60 s | F07, F10, F18 | 0–3 s: the problem as the player types it ("Game says Secure Boot is off") · steps as screen captures with big step numbers · end: "Full guide: link in profile" |

Captions burned in on all video (sound-off viewing). No AI voice until disclosure rules are checked [R19]. Masters exported without watermarks.

## 4. Profiles and bios (part of C01, live by Fri 2 Oct)

The current X/YouTube bio says "We test hardware until it breaks. We play games until 4 AM to write honest reviews" [R02]; there is no hardware testing and reviews stopped on 8 Jul. Replace everywhere:

| Network | Handle | New bio | Link |
|---|---|---|---|
| X | @TechPlayGG (exists) | The gaming publication that knows what you play. Release dates, PC fixes, WoW tools, GTA VI countdown. Independent, Sarajevo. Gaming, on the record. | techplay.gg/calendar |
| Instagram | techplay.gg (exists) | What's out, where to play it, how to fix it. Free library for Steam, PlayStation, Xbox, GOG and Epic. Gaming, on the record. | techplay.gg/calendar (UTM bio) |
| Facebook | techplaygg (exists) | Independent gaming publication from Sarajevo. News you can act on, a database of 333,000 games and a free library that fills itself. | techplay.gg |
| YouTube | @techplay_gg (exists, 20 subs) | Games out this week, PC fixes in a minute, and the GTA VI countdown. No presenters, no hype, sources on screen. | techplay.gg/calendar |
| TikTok | @techplay.gg (create) | Games out this week. PC fixes in 60 seconds. GTA VI countdown. Gaming, on the record. | techplay.gg/calendar |
| Threads | @techplay.gg (confirm) | Same as Instagram | — |
| Bluesky | techplay.gg (create; domain handle needs DEV) | Independent gaming publication, Sarajevo. Release data, a studio closures tracker, PC fixes. Methods and sources in every post. | techplay.gg |
| LinkedIn | TechPlay (create company page) | TechPlay is an independent gaming publication based in Sarajevo, with a database of 333,000 games and a free library that imports from Steam, PlayStation, Xbox, GOG and Epic. Press and data: techplay.gg/press | techplay.gg/press |

## 5. Approval rules

| Tier | What | Who approves | When |
|---|---|---|---|
| A — publish from template | F06, F11, F12, F14, F22 prompts; F02 when the fact is "Confirmed" in the R17 ledger; replies that answer a factual question with a link | SC | — |
| B — fact check | Any number, price, date, platform, subscription status or ranking (F01, F04, F05, F08, F09, F10, F13, F16, F18, F23, F24 cards) | ED | Before scheduling on Monday or Wednesday |
| C — editorial approval | Any change to a GTA VI rumour/confirmed status (F03); layoffs, closures and named people (F17); giveaways (C09); corrections; replies in a dispute; posts that name journalists or developers; PR data claims; anything about the GTA 6 map as TechPlay's data (blocked until D-020) | EIC | Same day; EIC checks the queue at 17:00 |

Hard rules for every tier:
- A number without a source line is not published.
- No member, follower or subscriber counts unless read live from an API that day (spine §2).
- A rumour is never the first line of a post. If it appears, it carries its label: **Rumour**, **Reported**, or **Confirmed** (with source).
- Nothing about the GTA VI giveaway until C09 is verified in admin.

## 6. Response SLAs

| Situation | Where | Target | Owner |
|---|---|---|---|
| Question or @mention | Discord | 4 h, 09:00–23:00 Sarajevo; next morning 10:00 otherwise | SC (Buffy answers slash commands instantly) |
| Comment or DM | X, Threads, Bluesky, IG, FB, TikTok, YouTube | 24 h, every day except Sunday (Sunday: next day) | SC |
| Site comment moderation queue | techplay.gg | < 24 h (spine guardrail); first three comments per member are held [R13] | SC |
| Factual error pointed out | Anywhere | Acknowledge in 2 h (staffed hours); fix and correction note in 24 h | SC → ED/EIC |
| Press or partner question | Any | Same working day forward to EIC; EIC replies in 1 working day | EIC |
| Crisis (L3, §8) | Any | Holding line in 1 h | EIC |

## 7. Community management rules

1. **Staff speak as people, Buffy speaks as the host.** Buffy's voice: knowledgeable, dry, warm, brief; one owl line at most; never "young one", prophecies or exclamation stacks; never guilt about streaks; never comments on moderation [R13].
2. **Moderation ladder** (written in #rules): warning → Time Out → Kick → Ban [R13]. AutoMod keyword presets on. SC can Time Out; Kick and Ban need a second staff member.
3. **Spoilers.** From Thu 19 Nov, #gta6-spoilers is the only place for GTA VI story talk for 14 days; spoiler tags required elsewhere. The same rule applies to Game Club games.
4. **Leaks and piracy.** No leaked footage, datamines presented as fact, or piracy links. Delete, then explain once in public without repeating the link.
5. **Rumours.** Members may discuss rumours; staff posts label them. Buffy never posts rumours.
6. **Self-promotion.** Members' streams, videos and games go in one #show-your-stuff channel; no DMs advertising.
7. **Disclosure.** Staff say "I work on TechPlay" whenever they link to TechPlay outside our own spaces (Reddit, Facebook Groups, other Discords).
8. **AI.** WoW Analyzer tips are generated by a model; they are labelled as such and the "Profesor" typo is fixed (D-040 area) [R13].
9. **Numbers.** Never state member counts in replies ("we're a big community"); say what exists ("the server runs a Monday thread and a Wednesday poll").
10. **Giveaways.** No "share to enter" or "tag a friend" mechanics on Meta surfaces [R16]; every giveaway post links official rules and says "No purchase necessary".
11. **Age.** Discord's age verification changes are live and their effect on community servers is UNKNOWN [R07]; SC reads Discord's help page in week 1 and adjusts the rules channel.

## 8. Crisis and corrections protocol

| Level | Examples | Response |
|---|---|---|
| L1 — error | Wrong date, price, platform or name in a post | Fix or delete within 24 h. If the post had replies or shares: reply to it with the correction. Log in the corrections sheet. |
| L2 — credibility | A false number in our copy is called out (e.g. an old "15K+ members" screenshot); a rumour posted as fact; a data-story figure challenged | EIC decides in 2 h. Public correction post on the same network, update the page with a visible "Correction" line (the About page promises visible corrections [R02]), add to /corrections (open item). |
| L3 — safety or legal | Account compromise, harassment campaign, doxxing in Discord, leaked GTA VI footage posted in our spaces, a publisher takedown request | EIC holding line in 1 h; SC locks affected channels or pauses scheduling; DEV rotates credentials if an account is compromised. No debate in public. |

**Correction copy (L1/L2), exact form:**

> Correction: we said Gears of War: E-Day launches on PS5. It launches on Xbox Series X|S and PC on 6 Oct. The post has been updated.

**Holding line (L3):**

> We know about [issue] and are dealing with it. We'll post an update here by [time]. Please don't share the link or files in the meantime.

**Pausing rule.** When a real-world tragedy or major outage dominates, SC pauses all scheduled posts in the scheduler and Meta Business Suite for 24 h; EIC decides when to resume.

## 9. Tooling

No pricing is stated; SC checks current free-tier limits before committing.

| Tool | Use | Owner |
|---|---|---|
| Meta Business Suite | Schedule Facebook and Instagram posts, Stories and Reels; shared inbox | SC |
| Free-tier scheduler (Buffer or similar; choose one that supports X, Threads, Bluesky and LinkedIn — verify limits) | Batch scheduling of text networks | SC |
| YouTube Studio | Shorts and pilot uploads, scheduling, pinned comments | SC |
| TikTok (native scheduling if available in TikTok Studio — verify) | Master video posting | SC |
| Discord native tools | Scheduled Events, native polls (up to 10 answers, 1 h to 1 week), forum channels, AutoMod, Onboarding and Server Guide [R13] | SC |
| Professor Buffy | F06, F14, welcomes, article posts; invite-code attribution after D-011 | DEV/SC |
| Figma (masters) + Canva (fills) | Template library | DS / SC |
| CapCut or Canva video | V1–V3 [R19] | SC / DS |
| Google Sheets | Content calendar, UTM builder (until D-009), invite-code log, corrections log, GTA VI fact ledger | SC / ED |
| Reddit Pro (free) | Finding conversations to answer [R07] | SC |
| Search Console, GA4, first-party collector | Referral sessions by UTM (after D-008), key events (after D-007) | SC / EIC |

## 10. Franchises

Format for each: what it is for, where it runs, the template, how the hook is built, one post written in full, the CTA and where it goes next. Dates in examples are real Q4 2026 dates from the spine and research. Numbers in example posts come from R05, R06, R14 and R17; anything "reported" or "rumour" is labelled as such in the copy.

### F01 — Out This Week (Mon; C04)

| | |
|---|---|
| Purpose | Turn the calendar into a weekly habit and reminders (S1, S6, S7) |
| Platforms | Site article, IG carousel, TikTok/Shorts/Reels (V1), X thread, Discord, Facebook, newsletter |
| Format / template | T2 carousel (8 slides), V1 video, X thread of 5–7 posts |
| Hook structure | Count + the one release that matters most + the platform twist ("first CoD on a Nintendo platform since Ghosts") |
| CTA | "Every date, one tap to remind you: techplay.gg/calendar" |
| Repurposing | Article → carousel → V1 video → X thread → Discord post → newsletter section → Monday "Your releases" email (C41) |

Example (X thread, Mon 12 Oct, 17:30):

> Out this week, 12–18 Oct. The one to watch is Call of Duty: Modern Warfare 4's campaign early access on Fri 16 Oct for digital pre-orders. Full launch is 23 Oct on PS5, Xbox, PC and Switch 2.
>
> Tue 13 Oct: Planet Zoo 2.
> Thu 15 Oct: Enshrouded leaves early access (1.0), Castlevania: Belmont's Curse, and Crimson Desert's Charting the Unknown DLC (all reported dates).
> All week: Steam Cooking Fest, 12–19 Oct.
>
> Every date, with a remind-me button: techplay.gg/calendar

### F02 — GTA 6 Countdown: "X days to Vice City" (daily to 19 Nov; C06)

| | |
|---|---|
| Purpose | Daily return habit for S4 and reminder sign-ups on the real game page |
| Platforms | IG/FB Stories (daily), X (daily), Discord #gta6 (daily), Threads (daily, question-led), Shorts/TikTok/Reels V2 (Tue/Thu/Sat) |
| Format / template | T3 card with day block; V2 video |
| Hook structure | Day number + one confirmed fact + its source. Never a rumour. |
| CTA | "Set a reminder for 19 Nov: techplay.gg/games/grand-theft-auto-vi" |
| Repurposing | 52 cards → Discord → weekly newsletter line ("48 days to go") → launch-week "what to do first" series from 16 Nov |

Example (X, Mon 12 Oct, 12:00):

> 38 days to Vice City.
> Pre-order before 19 Nov 23:59:59 and Rockstar adds the Vintage Vice City Pack and one month of GTA+. PS5 and Xbox Series X|S only at launch.
> Reminder for launch day: techplay.gg/games/grand-theft-auto-vi

### F03 — Confirmed or Rumour? (Thu; C07, from 1 Oct)

| | |
|---|---|
| Purpose | Trust: a sourced weekly GTA VI ledger (S4, S8) and a reason to cite /gta6/everything-we-know |
| Platforms | Site ledger, X, IG carousel (6 slides), Reddit (as a sourced comment where asked) |
| Format / template | T2 slides with a status chip per claim: CONFIRMED (crimson fill), REPORTED (outline), RUMOUR (grey) |
| Hook structure | "This week's GTA VI claims, sorted" + the most-shared claim first |
| CTA | "Every claim with its source and date: techplay.gg/gta6/everything-we-know" |
| Repurposing | Ledger update → carousel → X post → newsletter item → Reddit answers → YouTube pilot script (C50) |

Example (IG carousel caption, Thu 1 Oct, 18:00):

> GTA VI, sorted by what's actually confirmed.
> Confirmed: 19 Nov on PS5 and Xbox Series X|S; $79.99, Ultimate $99.99; single-player at launch; no PC at launch (Take-Two CEO, May).
> Reported: 30 fps on consoles at launch (Tom's Hardware, 29 Aug). Rockstar hasn't said.
> Rumour: GTA Online for VI in 2027 (The Mirror, 18 Sep).
> No announcement: a Switch 2 version.
> Sources on every line: link in bio.

### F04 — The Number (Tue/Thu/Sat; LinkedIn Thu)

| | |
|---|---|
| Purpose | One verified stat that travels (S8, S1); single numbers were the week's most-shared stories [R06] |
| Platforms | X, Threads, Bluesky, IG single, Facebook image, LinkedIn (Thu) |
| Format / template | T1 square, T2 for Instagram |
| Hook structure | The number alone on line 1; what it measures on line 2; source on line 3 |
| CTA | Link to the page that holds the context (story, tracker or data page) |
| Repurposing | Card → newsletter "number of the week" → quarter-end C27 report |

Example (X, Tue 29 Sep, 15:30):

> 1,354,009
> Counter-Strike 2's peak concurrent players in the week to 26 Sep. Still Steam's most-played game, ahead of Dota 2 (875,875).
> Source: Steam charts. Who moved up this week: techplay.gg/news

### F05 — Hidden Gem Thursday (Thu; C64, from 1 Oct)

| | |
|---|---|
| Purpose | Discovery from the database's hidden-gems module (highly rated, little played); shelf adds (S2, S1) |
| Platforms | Site list, IG carousel (5 slides), Facebook, Reddit (r/patientgamers answers), Discord, Steam Curator |
| Format / template | T2: cover slide, "why it's worth it" slide, "who it's for", "where to play", CTA |
| Hook structure | "If you liked [well-known game], try [gem]" |
| CTA | "Add it to your shelf: techplay.gg/games/<slug>" |
| Repurposing | Carousel → Steam Curator recommendation (C69) → newsletter "what to play" → Discord #recommendations |

Example (Facebook, Thu 29 Oct, 18:00; Scream Fest week — the pick each week is whatever /games/hidden-gems returns, checked by ED; this example shows the format):

> Hidden Gem Thursday, Halloween week: Signalis.
> A survival horror game from rose-engine, a two-person studio, released in 2022 on PC, Switch, PlayStation and Xbox. Think old-school Resident Evil inventory puzzles with a stranger, sadder story.
> Who it's for: people who finished Requiem and want something smaller.
> Add it to your shelf: techplay.gg/games/signalis

### F06 — On This Day (daily; C65)

| | |
|---|---|
| Purpose | Nostalgia is a durable register [R06]; daily low-cost presence |
| Platforms | Discord #general (Buffy), X, Threads, Facebook |
| Format / template | T1 square with year in Plex Mono 180 px and cover |
| Hook structure | "On this day in [year], [game] came out." + one plain detail |
| CTA | "What were you playing then? The game's page: techplay.gg/games/<slug>" |
| Repurposing | Card → Discord → yearly "on this day" archive page |

Rule: dates come from the /games/on-this-day endpoint and ED checks each against the game page before scheduling.

Example (X, Wed 11 Nov, 12:00):

> On this day in 2011, The Elder Scrolls V: Skyrim came out. Fifteen years later it is still on sale on more platforms than most games released this year.
> Its page, with every edition: techplay.gg/games/the-elder-scrolls-v-skyrim

### F07 — Fix It Friday (Fri; C60)

| | |
|---|---|
| Purpose | Pillar P2; page one for PC-fix queries has no gaming outlet [R09 via R04] (S3) |
| Platforms | Site guide on /guides/pc-fixes, TikTok/Shorts/Reels V3, Reddit answers, Discord #pc-help |
| Format / template | V3 video; T4 step image for X |
| Hook structure | The error text as players type it, then "here's the 60-second check" |
| CTA | "Full guide with screenshots: techplay.gg/guides/pc-fixes" |
| Repurposing | Guide → V3 → Reddit answers for 4 weeks → Discord pinned → newsletter |

Example (TikTok caption and V3 script, Fri 16 Oct):

> Game says Secure Boot is off? Check in 20 seconds.
> 1. Press Windows + R, type msinfo32, Enter.
> 2. Find "Secure Boot State". On = done. Off = it's switched off in your motherboard firmware (UEFI).
> 3. Before you change anything there, check that your drive uses GPT and your PC boots in UEFI mode, or Windows won't start.
> Full guide with screenshots, link in profile.

### F08 — Where Can I Play It? (Tue + Sat)

| | |
|---|---|
| Purpose | Pillar P1: platform, subscription and edition questions (S1, S6) |
| Platforms | Site template/article, IG carousel (monthly), X |
| Format / template | T2 grid: platforms as chips, subscription row, edition row |
| Hook structure | The question exactly as asked ("Is MW4 on Game Pass?") and the answer in the first line |
| CTA | "Every platform and edition: techplay.gg/games/<slug>" |
| Repurposing | Page → X → Discord answer bank → Switch 2 hub (C61) |

Example (X, Tue 20 Oct, 15:30):

> Is Call of Duty: Modern Warfare 4 on Game Pass on day one? No. It's the first CoD in a while that isn't.
> It launches 23 Oct on PS5, Xbox, PC and Switch 2, the first CoD on a Nintendo platform since Ghosts. Digital pre-orders get campaign early access from 16 Oct.
> Editions and platforms: techplay.gg/games/call-of-duty-modern-warfare-4

### F09 — In Order (Sat; C63)

| | |
|---|---|
| Purpose | Evergreen series-order pages for launches and 2027 (S1, S4) |
| Platforms | Site series page, IG carousel (8–10 slides), Reddit answers |
| Format / template | T2 timeline: year chip + cover + one-line "where it fits" |
| Hook structure | "Every [series] game in order, before [new game]" |
| CTA | "Release order, story order and where to play each: techplay.gg/<series page>" |
| Repurposing | Page → carousel → YouTube pilot (C50 for GTA) → Reddit answers |

Example (IG carousel caption, Sat 14 Nov):

> Every Grand Theft Auto, in release order, before VI on Thursday.
> GTA (1997) · GTA 2 (1999) · GTA III (2001) · Vice City (2002) · San Andreas (2004) · Liberty City Stories (2005) · Vice City Stories (2006) · GTA IV (2008) · Chinatown Wars (2009) · GTA V (2013) · GTA VI (19 Nov 2026).
> Vice City is where VI goes back to. Which ones you can still buy, and where: link in bio.

### F10 — Worth It in 2026? (Wed)

| | |
|---|---|
| Purpose | Short verdicts on games and hardware people ask about (S1, S7) |
| Platforms | Site verdict, Shorts (V3), X |
| Format / template | T2 single with a YES / WAIT / SKIP chip |
| Hook structure | "Is [thing] worth it in 2026?" + the one-word answer + the condition |
| CTA | "The reasoning and where it's cheapest: techplay.gg/<page>" |
| Repurposing | Verdict → Short → YouTube long-form script material |

Example (X, Wed 28 Oct, 15:30):

> Is GTA V worth playing before GTA VI? Yes, if you've never finished the story.
> It's still in Steam's top 25 most-played (75,985 peak in the week to 26 Sep), which tells you how many people are doing exactly this.
> What to skip and how long the story takes: techplay.gg/games/grand-theft-auto-v

### F11 — What Are You Playing? (Mon; C37)

| | |
|---|---|
| Purpose | Weekly check-in that links conversation to shelves (S10) |
| Platforms | Discord thread, forum thread, X, Threads, Bluesky, Facebook |
| Format / template | Text; T1 only on Facebook |
| Hook structure | One concrete prompt tied to the week, not "what are you playing?" alone |
| CTA | "Put it on your shelf and your profile keeps count: techplay.gg/register?from=f11" |
| Repurposing | Answers → F14 wrap → newsletter community item |

Example (Threads, Mon 5 Oct, 20:00):

> What are you playing this week, and is anyone skipping Gears of War: E-Day on Tuesday to finish something else first?
> Honest answers only. Backlogs count.

### F12 — Poll of the Week (Wed; C39, from 30 Sep)

| | |
|---|---|
| Purpose | Polls out-engage ratings by orders of magnitude at Hookshot [R04]; feeds Discord and the site forum (S10) |
| Platforms | Discord native poll, IG Story poll, X poll, Facebook poll, forum poll |
| Format / template | T3 poll card for Stories; native polls elsewhere |
| Hook structure | A question with a real split, tied to the week's news; 3–4 answers |
| CTA | "Results and the argument: techplay.gg/forum" |
| Repurposing | Results → F14 wrap → newsletter → F04 card when the split is striking |

Example (X poll, Wed 30 Sep, 20:00; ties to C66 The Last Disc):

> Sony plans to end PlayStation disc production. Your console library today is…
> Mostly discs
> Mostly digital
> About half and half
> I'm on PC, discs are history

### F13 — Steam Movers (Tue)

| | |
|---|---|
| Purpose | Data news from Steam's weekly charts (S3, S8) |
| Platforms | Site short, X, Bluesky, Reddit data comment, Discord |
| Format / template | T7 slope chart: last week's rank → this week's rank |
| Hook structure | The biggest jump first, with the reason if known |
| CTA | "The full top 100 and what moved: techplay.gg/steam (new, C62)" |
| Repurposing | Chart → X/Bluesky → Reddit comment → monthly data summary |

Example (Bluesky, Tue 29 Sep, 15:30):

> Steam most-played, week to 26 Sep. Biggest mover: Total War: WARHAMMER III, 67th → 28th after its DLC.
> Also up: FiveM 12 → 10, Aniimo 14 → 11, Deadlock 26 → 23.
> Down: Marvel Rivals 9 → 13, GTA V Enhanced 20 → 24.
> Ranks by weekly peak players, from Steam's charts API.

### F14 — Buffy's Weekly Wrap (Sun 20:00)

| | |
|---|---|
| Purpose | Close the week in Discord; recognition (S10) |
| Platforms | Discord (existing Sunday recap, upgraded), site "Week in review" |
| Format / template | Discord embed; Buffy corner mark |
| Hook structure | Three things that happened + member of the week (opt-in) + next week's dates |
| CTA | "Next week's releases, with reminders: techplay.gg/calendar" |
| Repurposing | Wrap → newsletter skeleton for Thursday |

Example (Discord, Sun 4 Oct, 20:00):

> Week 40, wrapped.
> Steam's Autumn Sale runs until Thursday 8 Oct. Ace Combat 8 came out Friday. Gears of War: E-Day is Tuesday on Xbox Series X|S and PC.
> 46 days to GTA VI.
> Member of the week: [member, with their permission], for the best answer in #pc-help.
> Next week's dates: techplay.gg/calendar
> — Buffy

### F15 — Readiness Check (Tue, WoW weekly reset; C13)

| | |
|---|---|
| Purpose | Put the WoW Analyzer in front of S5 every reset |
| Platforms | Discord #wow, X, r/wow answers, Shorts demo monthly |
| Format / template | T4 with one tip; monthly V3 Analyzer demo |
| Hook structure | "Reset day." + one change this week + "check your character" |
| CTA | "Paste your character, get a readiness check in seconds: techplay.gg/wow-analyzer" |
| Repurposing | Tip → Discord → MMO hub (C15) → WoW: Forever explainer (C14) |

Example (X, Tue 6 Oct, 15:30 = 09:30 ET, before the US reset):

> Reset day. Patch 12.1.5 is expected around now on Blizzard's usual eight-week rhythm, but Blizzard hasn't dated it, so don't plan a raid night around it yet.
> What you can do today: check your gear and M+ readiness against the current season.
> techplay.gg/wow-analyzer

### F16 — Deal Radar (sale weeks; C05, C31, C32, C34)

| | |
|---|---|
| Purpose | Sale picks filtered by wishlists; price alerts (S7) |
| Platforms | Site, IG carousel, Facebook, X, newsletter special |
| Format / template | T2 with price chips (only verified prices, dated) |
| Hook structure | What's actually different this sale, then the picks |
| CTA | "Wishlist it and we'll email you when it drops: techplay.gg/calendar" (C43 live from 19 Oct) |
| Repurposing | Carousel → newsletter special → Discord deals thread |

Example (X, Fri 27 Nov, 09:00):

> Black Friday, the short version: there's no Steam sale this week. Steam's Winter Sale starts 17 Dec.
> Hardware went up this year, not down: Switch 2 is $499.99 since 1 Sep, Xbox Series X $649.99 since 1 Aug.
> Wishlist what you're waiting on and we'll email you when it drops: techplay.gg/calendar

### F17 — Studio Watch (Wed, as news warrants; C22 from 14 Oct)

| | |
|---|---|
| Purpose | Maintained record of 2026 studio closures and layoffs linked to studio pages (S8, S9) |
| Platforms | Site tracker /data/studios-closed-2026 (new), X, LinkedIn, Bluesky |
| Format / template | T7 list chart; plain text posts |
| Hook structure | What changed this week, sourced; affected games named |
| CTA | "The tracker, with sources and affected games: techplay.gg/data/studios-closed-2026" |
| Repurposing | Tracker → X/Bluesky/LinkedIn → Reddit data post (C48) → C27 annual report |

Example (Bluesky, Wed 14 Oct, 15:30):

> We're keeping a tracker of 2026 studio closures and layoffs, with a source for every line and the games each studio made.
> September alone: Xbox confirmed 268 more layoffs; Halo Studios was reported effectively closed; Ninja Theory was reported to be heading for closure; Obsidian is moving under Bethesda.
> Corrections welcome, with a link: techplay.gg/data/studios-closed-2026

### F18 — Games Like… (Sun)

| | |
|---|---|
| Purpose | Recommendations from similar-games data (S1, S2) |
| Platforms | Site "games like X", TikTok/Shorts (V3), IG carousel |
| Format / template | V3 or T2 list, 5 games |
| Hook structure | "Games like [X] you can play right now" + the constraint (platform, price, length) |
| CTA | "Add any of them to your shelf: techplay.gg/games/<slug>" |
| Repurposing | Page → video → carousel → Backlog Advisor prompt |

Example (TikTok caption, Sun 22 Nov):

> GTA VI isn't on PC. Five open-world crime games that are, tonight:
> GTA V Enhanced · Red Dead Redemption 2 · Mafia: Definitive Edition · Sleeping Dogs: Definitive Edition · Cyberpunk 2077.
> Which ones you already own across Steam, Epic and GOG: link in profile.

### F19 — Library Card (Fri; opt-in only)

| | |
|---|---|
| Purpose | Show the library product through a real member, with consent (S2, S10) |
| Platforms | IG, X, Discord |
| Format / template | Gamer DNA share card (D-024) inside T2 frame |
| Hook structure | One surprising line from the member's own card |
| CTA | "Connect Steam, PlayStation or Xbox and get your own card: techplay.gg/register?from=f19" |
| Repurposing | Card → Discord shout-out → C28 Year in Review launch examples |

Rule: numbers come only from the member's own card, shown with their written OK in Discord DM; no card is edited. Until D-024 ships, F19 runs as a text spotlight in Discord only.

Example (Discord, Fri 6 Nov, template filled from a consenting member's card):

> Library Card: @[member] linked Steam and Xbox. Their card says their most-played genre is [genre from card] and their oldest unfinished game is [title from card].
> Want yours? Connect a platform: techplay.gg/register?from=f19

### F20 — Showcase Live (event days)

| | |
|---|---|
| Purpose | Live coverage without video: X live thread, Discord watch party, site live blog (S4, S8, S10) |
| Platforms | X, Discord (Stage or voice event), site live blog; Threads for the reaction question |
| Format / template | Text posts; T4 card per major reveal, pre-built blank |
| Hook structure | One post per announcement: name, platforms, date if given, source |
| CTA | "Add it to your wishlist as it's announced: techplay.gg/calendar" |
| Repurposing | Live thread → "every announcement" article → newsletter → wishlist prompts |

Example (X, Thu 10 Dec, before the show):

> The Game Awards are tonight at the Peacock Theater in Los Angeles. We'll post every game announcement here with its platforms and date, and nothing we can't source.
> Watching with others? Our Discord has a watch party: discord.gg/wPQG9gUMXH

Full live-event playbook in file 10 §7.

### F21 — The Save File (Fri newsletter; C40)

| | |
|---|---|
| Purpose | Owned weekly return channel (S1, S2, S7, S8, S10) |
| Platforms | Email + web archive; promoted on X, Discord and the article-end block |
| Format / template | Plain editorial email; one T5 header |
| Hook structure | Subject line = the week's most useful fact, not a teaser |
| CTA | "Set reminders for next week: techplay.gg/calendar" |
| Repurposing | Issue → web archive page → X Friday post "This week's Save File" |

Example (issue #1, Fri 2 Oct, 08:30):

> Subject: 48 days to GTA VI, and what the Steam sale is actually for
>
> The Save File, #1. One email a week: what's out, what's on sale, what to play.
> Out this week: Ace Combat 8: Wings of Theve (today). Gears of War: E-Day on Tuesday, Xbox Series X|S and PC.
> On sale: Steam's Autumn Sale runs until Thursday 8 Oct. Check your wishlist before you browse the front page.
> One number: 1,354,009, Counter-Strike 2's peak players last week.
> From the community: this week's poll asked how much of your console library is on disc.
> What to play: if you've never finished GTA V, now is the time. 48 days left.
> — Adi, TechPlay

### F22 — Game Club (monthly, 1st week; C38)

| | |
|---|---|
| Purpose | One shared game a month (GR+ RPG Club and HLTB Game of the Month models [R04]) (S10) |
| Platforms | Discord + forum |
| Format / template | Discord event + forum thread; T2 announcement card |
| Hook structure | The game, why this month, two discussion dates |
| CTA | "Join the discussion nights: discord.gg/wPQG9gUMXH" |
| Repurposing | Discussion → newsletter community item → site "Game Club" page |

Example (Discord, Thu 1 Oct):

> October's Game Club game is Control Resonant, Remedy's new one, out since 24 Sep on PC, PS5 and Xbox Series X|S.
> Discussion nights: Thu 15 Oct (first half, spoilers tagged) and Thu 29 Oct (the ending), both 20:00 Sarajevo in #game-club.
> November's pick is GTA VI. December's is your vote.

### F23 — Next Fest Diary (19–26 Oct; C18)

| | |
|---|---|
| Purpose | Three demos a day, tried and rated; demos → wishlists → reminders (S1, S9) |
| Platforms | Site diary, Shorts, Discord, Steam Curator |
| Format / template | T4 per demo; V1 variant for a daily Short |
| Hook structure | "Day N: three demos, one line each" |
| CTA | "Wishlist the ones you like and we'll remind you when they launch: techplay.gg/calendar" |
| Repurposing | Diary → Curator picks → newsletter → C71 studio outreach |

Example (X, Fri 16 Oct, announcing the diary):

> Steam Next Fest runs 19–26 Oct. We'll try three demos every day and write one honest line on each.
> Scale check: June's Next Fest had 4,358 demos, by GameDiscoverCo's count. Send us the ones we shouldn't miss.
> The diary and a remind-me for each game: techplay.gg/steam

### F24 — Verdict (weekly; C52)

| | |
|---|---|
| Purpose | Restarted reviews: a short launch verdict that grows into a full review (S1, S8); needed for OpenCritic (C53) |
| Platforms | Site review format, X, Facebook, IG |
| Format / template | T2 card: game, verdict line, score chip, "what we played" line |
| Hook structure | What we played and for how long, then the verdict |
| CTA | "The full verdict and where to play it: techplay.gg/reviews" |
| Repurposing | Verdict → Steam Curator pick → full review → newsletter |

Example (X, Tue 6 Oct, announcing Thursday's verdict):

> Gears of War: E-Day is out today on Xbox Series X|S and PC. We're playing the campaign on PC this week.
> Our short verdict is up Thursday: is the prequel worth it if you've never played a Gears game?
> Series order if you need a refresher: techplay.gg/reviews

## 11. Posting-time grid

TechPlay publishes only between 17:30 and 21:30 CET today, and has no morning or US-daytime slot [R02]. The grid adds three slots. Times are Sarajevo; ET is shown for the US. From 25 Oct to 31 Oct the gap is 5 hours (Europe leaves summer time first); otherwise 6.

| Slot (Sarajevo) | US ET (6 h / 5 h week) | Purpose | What goes out |
|---|---|---|---|
| 08:30 | 02:30 / 03:30 | Europe morning; US inbox by breakfast | Fri newsletter; one pillar article scheduled overnight (Discover) |
| 12:00 | 06:00 / 07:00 | Europe lunch | F02 Stories and X; F06 On This Day |
| 15:30 | 09:30 / 10:30 | US morning | X/Bluesky data posts (F04, F13, F17), F08, F10, F15; LinkedIn Thu 09:30 Sarajevo instead |
| 18:00 | 12:00 / 13:00 | Existing EU evening + US noon | Carousels, Reels/TikTok/Shorts, F01, F05, F24, Facebook |
| 20:00 | 14:00 / 15:00 | Discord and conversation | F11, F12 polls, F14 (Sun), Threads questions, Game Club nights |
| 22:30 | 16:30 / 17:30 | US afternoon | Second X post of the day's best performer; Threads second post |
| 01:30 (scheduled) | 19:30 / 20:30 | US evening | Second placement of the day's video on TikTok/Shorts (test weeks only) |

Weekly grid (Oct–Nov; F02 drops after 19 Nov and F18/F16 take its slots):

| Day | 08:30 | 12:00 | 15:30 | 18:00 | 20:00 | 22:30 |
|---|---|---|---|---|---|---|
| Mon | Pillar article | F02, F06 | F01 X thread | F01 carousel + V1 video; FB F01 | F11 (Discord, Threads, X, FB) | Best post re-share |
| Tue | Pillar article | F02, F06 | F13 (X, Bluesky); F04; F08; F15 | F02 V2 video | Discord #wow check-in | Threads |
| Wed | Pillar article | F02, F06 | F17 (as news); F10 | F24 or F08 | F12 poll everywhere | Best post re-share |
| Thu | Pillar article | F02, F06 | F04; LinkedIn 09:30 | F03 carousel; F05 carousel; F02 V2 | Game Club (1st/3rd Thu) | Threads |
| Fri | Newsletter F21 | F02, F06 | F07 X | F07 V3 video; F19 | Discord #pc-help | Best post re-share |
| Sat | — | F02, F06 | F04; F08 | F09 carousel; F02 V2 | — | — |
| Sun | — | F02, F06 | — | F18 (from 22 Nov) | F14 Weekly Wrap | — |

Test plan for times: for four weeks (5 Oct–1 Nov) F04 alternates between 15:30 and 22:30; compare replies and link sessions per post in the Monday report. No slot is treated as "best" before that.

## 12. Weekly report (Monday, 30 minutes)

| Network | What SC records | Where from |
|---|---|---|
| All | Posts published vs planned; sessions by utm_source and utm_campaign | Scheduler; first-party collector after D-008 (GA4 before) |
| X / Threads / Bluesky | Replies, reposts, follows gained, link sessions | Native analytics where available (verify); UTM |
| Instagram / Facebook | Saves, shares, Story link taps, Reel plays | Meta Business Suite |
| TikTok / Shorts | Views, profile visits per video | Native analytics |
| Discord | Members (API), weekly chatters, event attendance, discord_join by invite code | Discord, Buffy (D-011) |
| Reddit | Answers posted, score, reddit/community sessions | Accounts, UTM |
| Newsletter | Verified subscribers, clicks, unsubscribes, complaints | Mail system |
| Site outcomes | reminder_set, newsletter_verified, registration_complete, discord_click by utm_source | GA4 key events (D-007) |

Baselines are recorded in the first report (Mon 5 Oct). TARGETs per network are set on Mon 26 Oct from four weeks of data using the formula: next-4-week TARGET = 4-week median per post × planned posts × 1.2.

## Dependencies and open questions

- **C01 bios and false claims** (by Fri 2 Oct) and **C02 dead invites** before any social post links to the site.
- **Account access and counts (SC, Mon 28 Sep):** X, Facebook, Instagram, YouTube logins; confirm whether Threads exists; create TikTok and Bluesky. Follower counts are UNVERIFIED today [R02].
- **Professor Buffy artwork:** the bot uses its Discord avatar and no approved art exists [R13]; DS needs the character asset for the corner mark, or the mark is dropped.
- **D-007 / D-008 / D-009** decide whether the Monday report can read site outcomes by channel; until then only GA4 page sessions with UTM are available.
- **D-011** decides whether Discord joins can be attributed to posts.
- **D-020** blocks any post presenting the GTA 6 map's 1,058 locations as TechPlay's own data.
- **C09 giveaway:** verify in admin on 28 Sep; no giveaway copy until then; any Meta-facing giveaway drops share/retweet tasks [R16].
- **Platform rules not researched:** image specs, caption link handling, Community tab eligibility, TikTok scheduling, AI-voice disclosure, publisher video policies [R07, R19]. SC checks in week 1.
- **Scheduler choice:** free-tier limits (number of channels, queued posts) not researched; SC picks by Wed 30 Sep.
- **F05 picks** depend on the hidden-gems endpoint returning sensible games; the SSR module was empty on 27 Sep [R02]. If it returns DLC or fan games (as `/games` top-rated did [R02]), ED hand-picks from the endpoint's list.
- **F06 dates** must be checked against game pages; historical dates in examples (Skyrim 11 Nov 2011) are checked by ED before scheduling.
- **The Game Awards start time** is not in the research; SC confirms from thegameawards.com by 1 Dec and plans the night shift (file 04 §2).
