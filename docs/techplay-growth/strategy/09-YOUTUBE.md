# 09 — YouTube: Long-form and Shorts

Status: Phase 2 plan — 27 Sep 2026

- **Starting point is zero.** The channel `youtube.com/@techplay_gg` has 20 subscribers, joined 9 Feb 2026, and no public videos; its bio makes a claim we cannot back ("We test hardware until it breaks"); TikTok does not exist [R02, R19]. Nothing below assumes an audience.
- **YouTube runs on two tracks with different priority classes.** Shorts belong to the SECONDARY vertical-video system (C49), produced once and exported to YouTube Shorts, TikTok, Instagram Reels and Facebook Reels. Long-form is EXPERIMENTAL: exactly two pilots under C50 plus gated follow-ups [SPINE §12].
- **No presenter, no reactions, no re-uploaded trailers.** Every show is built from TechPlay's own data and tools (calendar, GTA 6 hub, WoW Analyzer, series pages, PC-fix guides), text-led templates, screen capture and, for long-form only, a human voice-over by an editor [R19 §2–§4].
- **Ten recurring shows, six Shorts a week in steady state.** Out This Week (Mon), GTA 6 Countdown (Tue/Sat to 19 Nov), Confirmed or Rumour? (Thu), Fix It Friday (Fri), a Wednesday rotation (The Number, Worth It in 2026?, In Order, Readiness Check), plus Next Fest Diary in week 43. TARGET: at least 60 Shorts published by 31 Dec.
- **Two long-form pilots, both with full outlines and opening scripts below:** "Release Radar: November 2026" (Fri 30 Oct) and "Every GTA Game in Order Before GTA VI" (Thu 12 Nov). Release Radar December and January only run if the pilot passes the gate on 16 Nov.
- **Every video ends on one measurable action** on the site: set a reminder, open the GTA 6 hub, run the Analyzer, read the fix, join Discord through a YouTube-specific invite code [R19 §5; SPINE §9–§10].
- **Policy unknowns are treated as checks, not assumptions.** Shorts length, clickable links from Shorts, end screens on Shorts, monetisation thresholds, AI-voice and synthetic-media disclosure, and publisher footage policies were not researched [R19 §6]. §15 lists each check with an owner and a due date; the plan is built so that none of them blocks launch on 5 Oct.
- **Capacity: about 6 h SC and 2 h DS a week in steady state, plus about 34 h across two pilot weeks.** The weekly batch schedule, repurposing chain and file conventions live in `18-VIDEO.md`.
- **Livestreaming: not now.** Revisit on 11 Jan 2027 against five criteria (§13).

---

## 1. Where we start (FACT)

| Item | State on 27 Sep 2026 | Source |
|---|---|---|
| YouTube channel | `@techplay_gg`, display name "TechplayGG", 20 subscribers, joined 9 Feb 2026, 0 video renderers on `/videos` | [R02 §8.2] |
| Channel bio | "Built by gamers, for gamers… We test hardware until it breaks and play games until 4 AM…" (no benchmarks exist, so this claim goes under C01) | [R02 §2.1] |
| Site promotion | Footer and article "Follow Us" link YouTube; X, the account that actually exists, is not linked | [R02 §8.2] |
| Promises tied to video | Support tiers promise "Early access to videos" (Super Fan) and "Your name in video credits" (Legend); `/videos` returns 404 | [R02 §5.2, §1.1] |
| TikTok | `@techplay.gg` and `@techplaygg`: "Couldn't find this account" | [R02 §8.2] |
| YouTube API key in backend | Used for trailers only (`YOUTUBE_KEY`) | docs/README.md |
| Evidence on formats | Breakdowns, "everything we know", map explainers and data comparisons surface for GTA 6; publishers re-upload official footage within hours, so TechPlay would lose that race | [R19 §1, §4] |
| Evidence on pipelines | Release calendar → weekly short 30–45 min; news → number card 20–30 min; guide → short 45–60 min; GTA countdown 10 min daily; feature → long video 1–2 days | [R19 §2] |

What this means: the first job is to stop the channel saying things that are not true, then to prove that one weekly format can be produced on time for six weeks [R19 §3]. The long-form pilots are the exception the spine makes for two dates that matter (C50).

## 2. What YouTube is for, and what it is not for

| Job | How | Measured by |
|---|---|---|
| Send release planners (S1) to the calendar | Out This Week and Release Radar end on `/calendar` reminders | `reminder_set` in sessions with `utm_source=youtube` |
| Serve GTA 6 waiters (S4) with confirmed facts only | Countdown, Confirmed or Rumour?, GTA order pilot; every card carries a source and date | `/gta6` sessions from YouTube; `reminder_set` on `/games/grand-theft-auto-vi` |
| Answer PC tinkerers (S3) where no major outlet ranks | Fix It Friday built on the PC Fix Hub guides (C60) [R09 EA-001, EA-004] | Guide sessions from YouTube; saves and comments with questions |
| Put the WoW Analyzer in front of MMO players (S5) | Readiness Check demos by screen capture | `tool_run` (tool=wow) from YouTube sessions |
| Earn search presence on YouTube for "in order" and "worth it" questions | In Order and Worth It in 2026? | Views from YouTube search (Studio traffic source) |

Not for: reaction videos (needs a personality we do not have), official-footage re-uploads (rights and speed), hands-on impressions (needs access), creator stunts, leaks of any kind [R19 §1 rows 6–10; R17 §10].

## 3. Production model without a presenter

| Method | What it is | Used by | Voice | Tools (see 18-VIDEO §10) |
|---|---|---|---|---|
| A. Template cards | Text-led cards filled from a data export: cover art or key art from press kits, date, platform chips, one line of copy, source line | Out This Week, Countdown, Confirmed or Rumour?, The Number, In Order Shorts | None; burned-in text; optional licensed music bed | Canva or Figma templates, CapCut |
| B. Screen capture | Recording TechPlay's own pages (calendar, map, Analyzer, series page) or PC settings screens (Windows, NVIDIA/AMD control panels, Steam) | Fix It Friday, Readiness Check, GTA map tracker, Worth It (tool demos) | None for Shorts; editor VO for long-form | OBS Studio, CapCut |
| C. Voice-over over cards and official media | A scripted long-form piece voiced by an editor over Method A and B visuals plus official trailers or screenshots, used briefly and credited | Release Radar, In Order long-form | Human VO by EIC (backup ED), recorded in one take per chapter | Audacity, USB microphone, CapCut or DaVinci Resolve |

Rules that apply to every method:

1. **Human voice only in Q4.** No AI-generated voice or synthetic presenters. This removes the disclosure question for now; if AI voice is ever proposed, the disclosure rules of each platform are checked first and the use is stated on `/about/ownership` (C54) [R19 §6].
2. **Captions on everything.** Shorts carry burned-in text because most are silent-first; long-form gets a human-corrected caption file uploaded to YouTube.
3. **Every claim card shows its source** in IBM Plex Mono at the bottom: `Source: Rockstar Newswire · 25 Jun 2026`.
4. **No member data on screen without opt-in** (Library Card F19 consent applies to video too). Discord and Reddit screenshots have usernames blurred.
5. **Brand:** background `#05070A`, white text, crimson `#DC143C` for bars, stamps and highlights only. Crimson on the dark background measures 4.04:1, under the 4.5:1 needed for small text, so crimson is never used for small text; white on crimson (4.99:1) is fine (frontend `globals.css`). Display type Instrument Sans, body IBM Plex Sans, numbers and dates IBM Plex Mono, the same families the site loads.

## 4. The shows

### 4.1 Show table

| # | Show | Franchise / campaign | Format and length | Cadence | Method | Owner (script / edit / art) | Source asset | End action (CTA) |
|---|---|---|---|---|---|---|---|---|
| L1 | Release Radar | C50 | Long, 8–10 min, 16:9 | Monthly; pilot Fri 30 Oct; Dec and Jan gated | C | EIC / SC / DS | `/calendar` month view, publisher pages | Set reminders on `/calendar` |
| L2 | In Order (long) | F09, C50, C63 | Long, 12–15 min | Pilot Thu 12 Nov; next one a Q1 candidate | C | EIC / SC / DS; ED fact-check | `/games/series/[slug]`, GTA 6 hub | Open the series page; remind me on `/games/grand-theft-auto-vi` |
| L3 | Worth It in 2026? (long) | F10 | Long, 8–12 min | Not in Q4; scripts drafted from Shorts that perform | C | EIC | Verdict articles | Tool or shelf action |
| S1 | Out This Week | F01, C04 | Short, 30–45 s, 9:16 | Mon from 5 Oct | A | SC / SC / DS template | `/calendar` week export | "Remind me" on `/calendar` |
| S2 | GTA 6 Countdown | F02, C06 | Short, 15–25 s | Tue and Sat from 6 Oct to 17 Nov, plus Wed 18 Nov and Thu 19 Nov | A | SC / SC / DS template | `/gta6/everything-we-know`, R17 ledger | `/gta6`; release-time tool from 14 Oct |
| S3 | Confirmed or Rumour? | F03, C07 | Short, 30–45 s | Thu from 8 Oct to 26 Nov | A | ED (status check) / SC | Ledger on `/gta6/everything-we-know` | Read the ledger |
| S4 | Fix It Friday | F07, C60 | Short, 45–60 s | Fri from 9 Oct | B | ED (60-second version of the guide) / SC | PC Fix Hub guide (`/guides/pc-fixes`, new) | Full guide |
| S5 | The Number | F04, C20–C26 | Short, 15–20 s | Wed rotation when a data piece lands | A | EIC (number and source) / SC | Data stories C20, C22, C23, C25, C26 | The data page |
| S6 | Worth It in 2026? (short) | F10 | Short, 45–60 s | Wed rotation | A + B | ED / SC | Verdict article, game or hardware page | Verdict article; shelf or tool |
| S7 | In Order (short) | F09, C63 | Short, 45–60 s | Wed rotation, about monthly | A | ED / SC | Series page | Series page, "add whole series" |
| S8 | Readiness Check demo | F15, C13, C14 | Short, 45–60 s | Monthly, patch or launch week | B | ED / SC | `/wow-analyzer` | Run the Analyzer |
| S9 | Next Fest Diary | F23, C18 | Short, 30–45 s | 3 in week 43 (19–26 Oct) | A + short demo capture | ED plays, SC edits | Site diary entries | Remind me at release |
| S10 | Games Like… | F18 | Short, 30–45 s | Swap-in only | A | ED / SC | Similar-games data | Game page, shelf add |

### 4.2 Show specs

**L1 Release Radar.** One month of dates in release order, grouped by week, with platform chips and a confidence label (confirmed by publisher / reported / rumour) taken straight from the calendar research format [R05 §1]. Rumours are either cut or shown with a RUMOUR stamp; nothing low-authority is presented as a date. Visuals: calendar screen capture for transitions, one card per game with official key art, and a "still TBA" card for window-only items. VO: EIC. Length target 8–10 min (under 15 min, see check C-06). Published in the last week before the month starts.

**L2 In Order.** The order games were released in, the order their stories happen in, where each one can be played today (from each game's TechPlay page on recording day), and the two a newcomer should actually play. Built from the series page (C63) so the video and the page agree. The GTA pilot (§9) sets the pattern; Final Fantasy VII before Revelation (8 Apr 2027) is the Q1 candidate [R05 §3; R18].

**S1 Out This Week.** Title card ("Out this week · 19–25 Oct"), one card per release (cover, day, platforms, one line of context), an end card with `techplay.gg/calendar`. Five to seven cards, 4–5 s each. Games come from the calendar in the order they release; the Friday before, ED marks which six matter.

**S2 GTA 6 Countdown.** One confirmed fact per video, big day number, one sentence, source line. Only items marked Confirmed in the R17 ledger, the release-time tool, or TechPlay's own data. Fact schedule in §8.2.

**S3 Confirmed or Rumour?** Four to six claim cards, each stamped CONFIRMED, REPORTED, RUMOUR or NOT ANNOUNCED, each with source and date. The status check is ED's on Thursday morning; if nothing changed in a week, the video says so on the first card ("No change this week. Here's where things stand.").

**S4 Fix It Friday.** Problem card (the symptom in the viewer's words), three to five step cards with a screen-capture window, a "what it does not fix" card, end card to the full guide. Steps are the guide's steps verbatim; nothing appears in the video that is not in the published guide.

**S5 The Number.** A single figure animated in, one line on what it counts, source, end card to the data page. Only figures from TechPlay's own data stories or a named source [R06 §4].

**S6 Worth It in 2026?** The question, three reasons for, one reason against, a stamp (YES / WAIT / SKIP) and who it is for. Hardware items show only published specifications and prices, never test results we do not have [SPINE §2].

**S7 In Order (short).** A timeline strip of covers with years, then "start here" and "skip unless you're a completionist". The full list lives on the series page.

**S8 Readiness Check demo.** Screen recording of the Analyzer on a staff character (or a member's, with consent), showing the three things it flagged and what to fix before the patch. Uses the Analyzer's current copy only after D-040 has removed the stale claims [R23 §A3].

**S9 Next Fest Diary.** Three demos per video, a one-line verdict each, and a "wishlist or skip" stamp. Demo footage only where the developer's press kit or store page permits; otherwise capsule art and store screenshots (checklist in 18-VIDEO §9).

**S10 Games Like…** Five games from the similar-games data, one line each, cover art. Swap-in when a slot falls through.

## 5. Thumbnail specification

| Property | Rule |
|---|---|
| Size | 1280×720 px, 16:9, JPEG or PNG under the platform's file limit (limit: CHECK C-07) |
| Text | 4 words maximum, Instrument Sans Bold, white, at least 110 px cap height so it reads at phone size |
| Accent | One crimson `#DC143C` element per thumbnail: a bar, a stamp or a date chip. Never crimson text on the dark background |
| Background | `#05070A` or official key art darkened to keep text contrast |
| Imagery | Official key art or box art from publisher press kits, or a crop of a TechPlay page. No faces pulled from trailers to fake a reaction; no arrows or circles on leaked or unofficial images |
| Brand mark | TechPlay mark, bottom-left, 64 px high. Keep the bottom-right corner clear (the duration badge sits there) |
| Consistency | Each show has a fixed layout so the channel reads as a set (templates `TPL-L-THUMB-RADAR`, `TPL-L-THUMB-ORDER`, `TPL-L-THUMB-WORTH`) |
| Check | Preview at 168×94 px before upload: if the four words cannot be read, cut words |

Per-show thumbnail copy:

| Video | Text (≤4 words) | Image | Crimson element |
|---|---|---|---|
| Release Radar: November 2026 | "November's big dates" | Three official covers fanned: GTA VI, WoW: Forever, Metaphor: ReFantazio | Date chip "19 NOV" on the GTA cover |
| Every GTA Game in Order | "Every GTA, in order" | Timeline strip of box art 1997 → 2026, VI at the end | Bar under "2026" |
| Release Radar: December 2026 | "December's big dates" | Covers: Dawn of War IV, Monster Hunter Wilds (Switch 2), Path of Exile 2 | Chip "10 DEC · TGA" |
| Worth It in 2026? (future long) | "Worth it now?" | Product shot from the maker's press kit | YES / WAIT / SKIP stamp |

Shorts: the first frame is the cover. Every Short opens on a frame that works as a thumbnail (show name, one line, crimson bar). Whether a custom Shorts cover can be uploaded is CHECK C-08.

## 6. Title formulas

Keep titles under about 60 characters so the key words survive truncation (HYPOTHESIS; test in Studio). Put the searchable noun first.

| Show | Formula | Example |
|---|---|---|
| Release Radar | `Release Radar: [Month Year] — [biggest date] and [N] more` | "Release Radar: November 2026 — GTA VI and 11 more dates" (N counted from the final script) |
| In Order | `Every [Series] Game in Order Before [New Game]` | "Every GTA Game in Order Before GTA VI" |
| Worth It | `Is [Thing] Worth It in 2026?` | "Is the Steam Deck OLED Worth It in 2026?" |
| Out This Week | `Out this week: [Game], [Game] and [Event] ([dates])` | "Out this week: MW4, Final Fantasy Resonance, Next Fest (19–25 Oct)" |
| GTA Countdown | `[N] days to GTA 6: [fact in five words]` | "44 days to GTA 6: what it costs" |
| Confirmed or Rumour? | `GTA 6: confirmed or rumour? ([date])` | "GTA 6: confirmed or rumour? (8 Oct)" |
| Fix It Friday | `[Problem] on PC: [N]-step fix` | "Shader compilation stutter on PC: 5-step fix" |
| The Number | `[Number]: [what it counts]` | "13 years: the gap between GTA V and GTA VI" |
| Readiness Check | `Is your WoW character ready for [patch]?` | "Is your WoW character ready for 12.1.5?" |
| Next Fest Diary | `Steam Next Fest: 3 demos, [day]` | "Steam Next Fest: 3 demos worth your evening, day 2" |

## 7. Descriptions, pinned comments, end screens

### 7.1 Long-form description template

```
{One sentence: the question this video answers, in plain words.}

Set a reminder for every date in this video: https://techplay.gg/calendar?utm_source=youtube&utm_medium=organic-social&utm_campaign={cid}-{slug}&utm_content={asset}-desc
{Primary page name}: {URL}?utm_source=youtube&utm_medium=organic-social&utm_campaign={cid}-{slug}&utm_content={asset}-desc-2
Discord: https://discord.gg/{YouTube invite code; wPQG9gUMXH until SC creates it}
The Save File, our Friday newsletter: https://techplay.gg/newsletter?utm_source=youtube&utm_medium=organic-social&utm_campaign={cid}-{slug}&utm_content={asset}-desc-nl   (use once /newsletter is live, D-012)

Chapters
00:00 {Cold open}
{mm:ss} {Chapter}
...

Sources
- {Publisher or outlet, page title, date}
- ...

Footage and art: official material from {publishers}, used for reporting and commentary. No leaked material.
Written and voiced by {editor name}. Edited by TechPlay.
{AI-use line from /about/ownership once C54 is live, 9 Oct.}

TechPlay is the gaming publication that knows what you play. Gaming, on the record.
https://techplay.gg/?utm_source=youtube&utm_medium=organic-social&utm_campaign={cid}-{slug}&utm_content={asset}-desc-home
```

Chapter rule of thumb: first chapter at 00:00 and at least three chapters; current requirements are CHECK C-09.

### 7.2 Shorts description template

```
{One line: what the Short says.} {Date range or status date.}
Full list with reminders: techplay.gg/{path}
Source: {source, date}
#{game or topic} #{second tag}
```

Shorts assume no clickable link (CHECK C-02). The on-screen end card shows a short path (`techplay.gg/calendar`, `techplay.gg/gta6`), and where YouTube offers a "related video" link on a Short it points at the long-form video or playlist that goes deeper. UTM tracking for Shorts therefore depends on a vanity redirect (open question in the dependency section).

### 7.3 Pinned comment templates

| Show | Pinned comment |
|---|---|
| Release Radar | "Which of these are you actually buying this month? The dates are all on techplay.gg/calendar, and you can set a reminder per game. If we missed a date, reply with the source and we'll add it." |
| In Order (GTA) | "Which GTA did you start with? Reply with the game and the year. Every release date and platform in this video is on the series page: techplay.gg/games/series/{gta slug}" |
| Worth It | "Our verdict is WAIT/YES/SKIP for {audience}. Tell us what you'd use it for and we'll answer in the replies." |
| Fix It Friday | "Did this fix it? Reply with your GPU, the game, and what you tried. The full guide has the steps we cut for time." |
| GTA Countdown / CoR | "Everything here is confirmed by Rockstar or labelled otherwise. Seen a claim you want checked? Reply with the link." |
| Readiness Check | "Run your own character (it takes a few seconds, no account): techplay.gg/wow-analyzer. Post the one thing it flagged." |

Moderation: SC reads comments on each video within 24 h of publishing (guardrail from SPINE §3), hides spam and leaks, and replies to questions with facts and a link only when the answer is on the site.

### 7.4 End screens and cards (long-form)

- Last 20 seconds use `TPL-L-END`: next video on the left, subscribe element centre-right, playlist bottom-right, crimson bar across the top with the line "Next Radar: {date}".
- VO over the end screen, Release Radar: "Next month's Radar goes up on {date}. Every date from this video is on the TechPlay calendar, linked below."
- VO over the end screen, In Order: "If you want the short version, the series page lists every game with where to play it today. And if you're counting down, the GTA 6 hub has the release time for your time zone."
- One info card at the moment each tool is mentioned (calendar, `/gta6/release-time`, series page). Whether cards and end screens can link to an external site from this channel is CHECK C-10.
- End screens on Shorts: CHECK C-03; plan assumes none.

## 8. Q4 publishing plan

Publish time: 16:00 Sarajevo time for every video (10:00 US Eastern for most of the period; 11:00 in the week of 26–31 Oct when Europe has changed clocks and the US has not). This is a HYPOTHESIS to test in weeks 45–48, not a known best time.

### 8.1 Weekly grid

Blank cells are intentional. "Pilot week" means the Wednesday rotation is dropped to free SC hours for the long-form edit.

| Week | Mon | Tue | Wed (rotation) | Thu | Fri | Sat | Extra / long-form |
|---|---|---|---|---|---|---|---|
| w40 28 Sep–4 Oct | Setup: channel clean-up (§14), templates, policy checks (§15) | | | | | | One unlisted test Short to check exports |
| w41 5–11 Oct | OTW: Gears of War: E-Day, Dragon's Dogma 2: Dark Arisen | GTA 44 days | The Number: Release Congestion Index (C20, 7 Oct) | CoR 8 Oct (42 days) | FIF: Windows 11 settings for gaming | GTA 40 days | Readiness demo the day after WoW 12.1.5 goes live (predicted ~6 Oct; runs whenever the patch lands) |
| w42 12–18 Oct | OTW: Planet Zoo 2, Enshrouded 1.0, Castlevania: Belmont's Curse, MW4 early access | GTA 37 days | The Number: Studios Closed in 2026 (C22, 14 Oct) | CoR 15 Oct | FIF: shader compilation stutter (worked example, 18-VIDEO §7) | GTA 33 days: release-time tool | |
| w43 19–25 Oct | OTW: MW4, FF Resonance, Next Fest (worked example, 18-VIDEO §6) | GTA 30 days | Next Fest Diary 1 | CoR 22 Oct | FIF: Secure Boot and TPM for anti-cheat games | GTA 26 days | Next Fest Diary 2 (Fri 23), Diary 3 wrap (Sun 25) |
| w44 26 Oct–1 Nov | OTW: Scream V Fest, Minecraft Bedrock on Switch 2, Phantom Blade Zero | GTA 23 days | Pilot week | CoR 29 Oct | FIF: DXGI_ERROR_DEVICE_REMOVED | GTA 19 days | **Long: Release Radar: November 2026, Fri 30 Oct** |
| w45 2–8 Nov | OTW: WoW: Forever, Stellar Blade Complete Edition | GTA 16 days | Worth It: Is WoW worth playing in 2026? (Analyzer demo, WoW: Forever day) | CoR 5 Nov | FIF: game crashes to desktop with no error | GTA 12 days = The Number: 13 years (C23) | |
| w46 9–15 Nov | OTW: Pikmin 4 and Metaphor: ReFantazio on Switch 2 | GTA 9 days | Pilot week | CoR 12 Nov | FIF: how to pre-load on PS5 and Xbox | GTA 5 days | **Long: Every GTA Game in Order Before GTA VI, Thu 12 Nov** |
| w47 16–22 Nov | OTW: GTA VI week | GTA 2 days | GTA 1 day: unlock time by region | Launch: "It's out. The map tracker is live" (C11) | FIF: low GPU usage and CPU bottlenecks | GTA launch: what to do first, part 1 | Sun 22: what to do first, part 2 (only from our own play) |
| w48 23–29 Nov | OTW: a quiet week, what's on sale instead | The Number: cost per hour (C25, 23 Nov) | Worth It: Steam Deck OLED in 2026 | GTA one week in: what's confirmed now (final CoR) | FIF: micro-stutter and frame pacing | Deal Radar: what counts as a real deal after the 2026 price rises (Black Friday) | Release Radar: December 2026, Fri 27 Nov (gated) |
| w49 30 Nov–6 Dec | OTW: Dawn of War IV, DQ Monsters, Xenoblade 3 and Monster Hunter Wilds on Switch 2 | | Worth It: Is Switch 2 worth it in 2026? | TGA Prediction League: how to play (C29) | FIF: Steam "content file locked" | In Order: Monster Hunter before Wilds on Switch 2 | |
| w50 7–13 Dec | OTW: The Game Awards week, Professor Layton, Path of Exile 2 1.0 | | The Number: achievement difficulty by genre (C26, 8 Dec) | | FIF: clean driver install with DDU | TGA 2026: every announcement, one line each (text-led) | |
| w51 14–20 Dec | OTW + Your 2026 in Games (C28) | Your 2026 in Games: how to make your card | Readiness demo (December) | Deal Radar: Steam Winter Sale picks from wishlists (C34) | FIF: Steam Cloud save conflict | | |
| w52 21–27 Dec | OTW: holiday week | | In Order: Persona before Persona 4 Revival | | | | Light week |
| w53 28 Dec–3 Jan | OTW + Release Radar: January 2027 (gated) | | Worth It: Is an 8GB RTX 3060 still enough in 2026? | 2027's most anticipated, in release order (C70) | | | |

Count: about 72 Shorts planned; TARGET is 60 published, which allows for slips.

### 8.2 GTA 6 Countdown fact schedule (confirmed items only)

| Date | Days left | Fact on the card | Source line |
|---|---|---|---|
| Tue 6 Oct | 44 | $79.99. Ultimate Edition $99.99. | IGN, 24 Jun 2026 [R17] |
| Thu 8 Oct | 42 | Confirmed or Rumour? #2 | Ledger |
| Sat 10 Oct | 40 | No PC version at launch. PS5 and Xbox Series X|S only. | IGN on Take-Two CEO, 4 May 2026 |
| Tue 13 Oct | 37 | Rockstar calls it "a single-player experience" at launch. | IGN, 24 Jun 2026 |
| Sat 17 Oct | 33 | What time does it unlock where you live? (release-time tool, C08). If the tool is not live: "Two delays: Fall 2025, then 26 May 2026, now 19 Nov 2026." | TechPlay tool / Rockstar Newswire |
| Tue 20 Oct | 30 | Pre-order bonus: the Vintage Vice City Pack. | Rockstar Newswire |
| Sat 24 Oct | 26 | The $400 Vice City Collection does not include the game. | Rockstar Newswire; GameSpot |
| Tue 27 Oct | 23 | Two delays before this date: Fall 2025, then 26 May 2026. | Rockstar Newswire |
| Sat 31 Oct | 19 | GTA VI vehicles and their real-world lookalikes, only if C12 has filled `real_equivalent` with sources by 21 Oct. Fallback: "GTA VI: The Album, with Atlantic Records, same day as the game." | TechPlay vehicles page / Rockstar Newswire |
| Tue 3 Nov | 16 | "An Extended Look" gameplay video was captured on PS5. | Rockstar Newswire |
| Sat 7 Nov | 12 | The Number: 13 years between GTA V (2013) and GTA VI (C23 data piece) | TechPlay data, C23 |
| Tue 10 Nov | 9 | "A very big map", bigger than Red Dead Redemption 2's, in Rockstar's words. | IGN, 27 Aug 2026 |
| Sat 14 Nov | 5 | The TechPlay map tracker switches on at launch (only if C11 is on track; else "Jason and Lucia: the two leads"). | TechPlay / Rockstar |
| Tue 17 Nov | 2 | Pre-load and file size: official numbers only; if none are published, the card says "not announced yet". | Platform store pages |
| Wed 18 Nov | 1 | Unlock times by region (release-time tool). | TechPlay tool |
| Thu 19 Nov | 0 | It's out. The map tracker is live. | — |

Not used on countdown cards: the 30 fps report, GTA Online in 2027, Switch 2, sales skew, the tribunal. Those are reported or rumoured and belong only in Confirmed or Rumour?, with their labels [R17 §2]. The giveaway (C09) is not mentioned in any video until SC and EIC have verified it in admin.

### 8.3 Video idea bank (48 concrete ideas)

"Slot" says whether the idea is in the grid above or waits as a swap-in. Target is either a query from the research or an audience segment.

| # | Title | Format | Length | Source asset | Target query / audience | Publish window | CTA | Slot |
|---|---|---|---|---|---|---|---|---|
| 1 | Release Radar: November 2026 — GTA VI and the rest of the month | Long | 8–10 min | `/calendar`, R05 §1 | "game release dates november 2026" [R09 EA-103]; S1 | Fri 30 Oct | Reminders on `/calendar` | Grid |
| 2 | Every GTA Game in Order Before GTA VI | Long | 12–15 min | Series page, GTA 6 hub | "gta games in order" [R09 EB-020]; S4 | Thu 12 Nov | Series page; remind me on `/games/grand-theft-auto-vi` | Grid |
| 3 | Release Radar: December 2026 — The Game Awards and the rest of the month | Long | 8–10 min | `/calendar` | S1 | Fri 27 Nov (gated) | `/calendar` | Grid |
| 4 | Release Radar: January 2027 | Long | 8–10 min | `/calendar`, Q1 list [R05 §2] | S1 | Mon 28 Dec (gated) | `/calendar` | Grid |
| 5 | Every Final Fantasy VII Game in Order Before Revelation | Long | 12–15 min | Series page | "final fantasy games in order" [R09 EB-003]; 8 Apr 2027 | Q1 2027 candidate | Series page | Q1 |
| 6 | Out this week: Gears of War: E-Day, Dragon's Dogma 2: Dark Arisen (5–11 Oct) | Short | 35 s | Calendar | S1 | Mon 5 Oct | `/calendar` | Grid |
| 7 | Out this week: Planet Zoo 2, Enshrouded, Castlevania (12–18 Oct) | Short | 40 s | Calendar | S1 | Mon 12 Oct | `/calendar` | Grid |
| 8 | Out this week: MW4, Final Fantasy Resonance, Next Fest (19–25 Oct) | Short | 40 s | Calendar | S1, S3 | Mon 19 Oct | `/calendar` | Grid |
| 9 | Out this week: Phantom Blade Zero, Minecraft on Switch 2, Scream Fest (26 Oct–1 Nov) | Short | 40 s | Calendar | S1, S6 | Mon 26 Oct | `/calendar` | Grid |
| 10 | Out this week: GTA VI (16–22 Nov) | Short | 30 s | Calendar, hub | S4 | Mon 16 Nov | `/gta6/release-time` | Grid |
| 11 | Out this week: Dawn of War IV and three Switch 2 editions (30 Nov–6 Dec) | Short | 40 s | Calendar | S1, S6 | Mon 30 Nov | `/calendar` | Grid |
| 12 | 44 days to GTA 6: what it costs | Short | 20 s | Ledger | "gta 6 price" [R17 q16]; S4 | Tue 6 Oct | `/gta6` | Grid |
| 13 | 40 days to GTA 6: no PC at launch | Short | 20 s | Ledger | "is gta 6 coming to pc" [R09 EA-079] | Sat 10 Oct | `/gta6/everything-we-know` | Grid |
| 14 | What time does GTA 6 unlock where you live? | Short | 25 s | `/gta6/release-time` (C08) | "gta 6 release time" [R09 EA-097] | Sat 17 Oct; again Wed 18 Nov | Release-time tool + reminder | Grid |
| 15 | The $400 GTA 6 box that doesn't include GTA 6 | Short | 25 s | Ledger | "gta 6 collector's edition" [R17 q18] | Sat 24 Oct | `/gta6` | Grid |
| 16 | GTA 6 cars and their real-world lookalikes | Short | 45 s | `/gta6/vehicles` after C12 | "gta 6 cars real life" [R17 q14] | Sat 31 Oct (conditional) | Vehicles page | Grid |
| 17 | GTA 6: confirmed or rumour? (weekly) | Short | 40 s | Ledger | "gta 6 everything we know" [R17 q31] | Thu 8 Oct–26 Nov | Ledger | Grid |
| 18 | 13 years: the gap between GTA V and GTA VI | Short | 20 s | C23 data | S4, S8 | Sat 7 Nov | C23 page | Grid |
| 19 | GTA 6 launch: the map tracker is live | Short | 30 s | `/gta6/map` (C11) | "gta 6 collectibles map" [R17 q34] | Thu 19 Nov | Map tracker (account) | Grid |
| 20 | GTA 6: what to do in your first hour | Short | 45 s | Team's own play | S4 | Sat 21–Sun 22 Nov | `/gta6` | Grid |
| 21 | Play GTA V before VI? The story so far in 60 seconds | Short | 60 s | GTA V game page | "gta 6 vs gta 5" family; S4 | Swap-in, 1–15 Nov | GTA V page, shelf add | Swap-in |
| 22 | Games like GTA to play while you wait | Short | 40 s | Similar-games data | "games like gta 6" [R17 q39] | Swap-in, Oct | Game pages | Swap-in |
| 23 | Is GTA 6 on PS5 Pro worth the upgrade? What we know and don't | Short | 50 s | Hub, PS5 Pro spec page | "gta 6 ps5 pro vs ps5" [R09 EA-118] | Swap-in, 9–18 Nov | Hub | Swap-in |
| 24 | Windows 11 settings for gaming: 5 switches to check | Short | 55 s | PC Fix guide | "best windows 11 settings for gaming" [R09 EA-004]; S3 | Fri 9 Oct | Guide | Grid |
| 25 | Shader compilation stutter on PC: 5-step fix | Short | 55 s | PC Fix guide | "shader compilation stutter fix" [R09 EA-001]; S3 | Fri 16 Oct | Guide | Grid |
| 26 | Secure Boot and TPM for anti-cheat games, safely | Short | 60 s | PC Fix guide | "how to enable secure boot for battlefield 6" [R09 EA-006] | Fri 23 Oct | Guide | Grid |
| 27 | DXGI_ERROR_DEVICE_REMOVED: what it means and what to try | Short | 55 s | PC Fix guide | [R09 EA-002] | Fri 30 Oct | Guide | Grid |
| 28 | Game crashes to desktop with no error: a triage order | Short | 55 s | PC Fix guide | [R09 EA-009] | Fri 6 Nov | Guide | Grid |
| 29 | How to pre-load on PS5 and Xbox before a big launch | Short | 45 s | Guide | "how to preload games ps5" [R09 EA-100]; S4 | Fri 13 Nov | Guide + GTA reminder | Grid |
| 30 | Low GPU usage in games: is it a CPU bottleneck? | Short | 55 s | PC Fix guide | [R09 EA-008] | Fri 20 Nov | Guide | Grid |
| 31 | Micro-stutter and frame pacing: V-Sync, caps, Reflex | Short | 55 s | PC Fix guide | [R09 EA-012] | Fri 27 Nov | Guide | Grid |
| 32 | Steam "content file locked": the fix | Short | 45 s | PC Fix guide | [R09 EA-003] | Fri 4 Dec | Guide; Steam import | Grid |
| 33 | Clean GPU driver install with DDU | Short | 55 s | PC Fix guide | [R09 EA-007] | Fri 11 Dec | Guide | Grid |
| 34 | Steam Cloud save conflict: which one to keep | Short | 45 s | PC Fix guide | [R09 EA-011] | Fri 18 Dec | Guide; Steam import | Grid |
| 35 | Is WoW worth playing in 2026? Run your character first | Short | 60 s | `/wow-analyzer`, WoW: Forever explainer (C14) | "is wow worth playing in 2026" [R09 EB-059]; S5 | Wed 4 Nov | Analyzer | Grid |
| 36 | Is your WoW character ready for 12.1.5? | Short | 50 s | Analyzer | S5 | Patch day + 1 (~7 Oct, predicted) | Analyzer | Grid |
| 37 | Is the Steam Deck OLED worth it in 2026? | Short | 55 s | Hardware verdict | "is steam deck worth it 2026" [R09 EA-109]; S3, S7 | Wed 25 Nov | Verdict article | Grid |
| 38 | Is Switch 2 worth it in 2026? (now $499.99) | Short | 55 s | Switch 2 hub (C61) | "is switch 2 worth it 2026" [R09 EA-110]; S6 | Wed 2 Dec | `/switch-2` | Grid |
| 39 | Is an 8GB RTX 3060 still enough in 2026? | Short | 55 s | Hardware verdict | "is rtx 3060 still good 2026" [R09 EA-111]; S3 | Wed 30 Dec | Verdict article | Grid |
| 40 | Game Pass or PS Plus in 2026? | Short | 55 s | Explainer | "game pass vs ps plus" [R09 EA-112]; S7 | Swap-in, after Sony confirms the 6 Nov price change | Explainer | Swap-in |
| 41 | The Number: the Release Congestion Index | Short | 20 s | C20 | S8 | Wed 7 Oct | C20 page | Grid |
| 42 | The Number: studios closed in 2026 | Short | 20 s | C22 tracker | S8 | Wed 14 Oct | `/data/studios-closed-2026` | Grid |
| 43 | The Number: the best-value games of 2026 by cost per hour | Short | 20 s | C25 | S7 | Tue 24 Nov | C25 page | Grid |
| 44 | The Number: achievement difficulty by genre | Short | 20 s | C26 | S2 | Wed 9 Dec | C26 page | Grid |
| 45 | Every Call of Duty in order before MW4 | Short | 60 s | Series page | "call of duty games in order" [R09 EB-010] | Swap-in, 12–22 Oct | Series page | Swap-in |
| 46 | Monster Hunter in order, now that Wilds is on Switch 2 | Short | 60 s | Series page | [R09 EB-021]; S6 | Sat 5 Dec | Series page | Grid |
| 47 | Persona in order before Persona 4 Revival | Short | 60 s | Series page | "persona games in order" [R09 EB-009] | Wed 23 Dec | Series page | Grid |
| 48 | Steam Next Fest: 3 demos worth your evening (days 1, 3, wrap) | Short ×3 | 40 s | Next Fest Diary (F23) | S1, S3 | Wed 21, Fri 23, Sun 25 Oct | Remind me at release | Grid |

## 9. Pilot 1: "Every GTA Game in Order Before GTA VI"

- **Publish:** Thu 12 Nov 2026, 16:00 Sarajevo, seven days before launch. Campaign C50; `utm_campaign=c50-gta-in-order`.
- **Length:** 12–14 min (kept under 15 min unless verification for longer uploads is confirmed, CHECK C-06).
- **Audience:** S4 GTA 6 waiters, especially people whose first GTA was V or who have never played one.
- **Promise:** the release order, the story order, where each game can be played today, and the two worth playing before VI. Nothing about VI that is not confirmed.
- **Dependencies:** GTA series page with "start here" block done by Sat 7 Nov (C63, ED); `/games/grand-theft-auto-vi` carries the GTA 6 news relation (D-005) and "Remind me"; `/gta6/release-time` live (C08); official box art and screenshots only [R17 §10].
- **Fact-check:** release years, settings and story years below are the editor's outline, not research findings. ED checks every one against the TechPlay series page and Rockstar's own pages before VO is recorded (Mon 9 Nov). Anything that cannot be sourced is cut, not softened.

### 9.1 Outline and chapters

| Chapter | Time (approx.) | Content | Visuals |
|---|---|---|---|
| 00:00 Cold open | 0:00–1:00 | Script below | Black frame, crimson line, box art timeline builds |
| 01:00 How to read this list | 1:00–2:00 | Three eras: the top-down games, the PS2-era "3D" games, the modern "HD" games. Why it matters: each era is its own continuity, so you can start anywhere | Three columns card |
| 02:00 The top-down era | 2:00–3:30 | Grand Theft Auto (1997), the London expansions (1999), GTA 2 (1999). The first game already had Liberty City, San Andreas and Vice City as cities | Box art, era card |
| 03:30 The 3D era, release order | 3:30–6:00 | GTA III (2001), Vice City (2002), San Andreas (2004), Advance (2004), Liberty City Stories (2005), Vice City Stories (2006) | Timeline strip, one card each with "where to play today" chips from the game page |
| 06:00 The 3D era, story order | 6:00–7:30 | Vice City Stories (1984), Vice City (1986), San Andreas (1992), Liberty City Stories (1998), Advance (2000), III (2001). Two Vice City games, both set in the 1980s | Re-sorted timeline animation |
| 07:30 The HD era | 7:30–9:30 | GTA IV (2008), The Lost and Damned and The Ballad of Gay Tony (2009), Chinatown Wars (2009), GTA V and GTA Online (2013), GTA V's later re-releases including GTA V Enhanced on PC, which sits in Steam's weekly top 25 eight weeks before VI [R05 §6] | Cards; Steam chart card with source line |
| 09:30 What VI actually confirms | 9:30–11:00 | 19 Nov, PS5 and Xbox Series X|S, $79.99 / $99.99, single-player at launch, no PC at launch, set in Vice City and the state of Leonida. What is not confirmed: GTA Online for VI, a PC date, a Switch 2 version [R17 §2] | Ledger cards with stamps |
| 11:00 The two to play first | 11:00–12:30 | Editorial pick with reasons: Vice City (the city VI returns to) and GTA V (the most recent single-player GTA). Where each is playable today, from the game pages | Two cards, platform chips |
| 12:30 Before you go | 12:30–end | Release-time tool, series page, reminder; end screen | TPL-L-END |

### 9.2 Opening 60 seconds (script)

> **[0:00–0:08]** *Black frame. A crimson line draws left to right. Box art appears on it, one by one, oldest first.*
> VO: "Grand Theft Auto has been around for almost thirty years. In one week, on the nineteenth of November, the next one comes out on PS5 and Xbox Series X and S. And it goes back to Vice City."
>
> **[0:08–0:22]** *The line fills with covers. Text on screen: "Do you need to play them first?"*
> VO: "If the only GTA you've played is Five, or you've never played one, here's the honest answer first. You don't need to play anything before Six. Each game has its own characters and its own story."
>
> **[0:22–0:40]** *Covers split into three coloured groups. Labels: "Top-down", "3D era", "HD era".*
> VO: "But the series has a shape, and knowing it helps. There are three separate eras that don't share a continuity, one city that keeps coming back, and a couple of games most people have never heard of."
>
> **[0:40–0:55]** *Chapter list appears as text, one line at a time.*
> VO: "In the next twelve minutes: every GTA in the order it came out, the order the stories happen in, where you can still play each one today, and the two worth your time before launch."
>
> **[0:55–1:00]** *Source line on screen: "Dates and platforms: TechPlay game pages, checked 9 Nov 2026."*
> VO: "Every date and platform in this video comes from TechPlay's game pages, and they're linked below."

### 9.3 Description (final copy)

```
Every Grand Theft Auto game in release order and story order, where each one can be played today, and the two worth playing before GTA VI arrives on 19 November.

Every GTA game, with platforms: https://techplay.gg/games/series/{gta-slug}?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-gta-in-order&utm_content=gta-order-desc
GTA VI release time for your time zone: https://techplay.gg/gta6/release-time?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-gta-in-order&utm_content=gta-order-desc-2
Remind me on launch day: https://techplay.gg/games/grand-theft-auto-vi?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-gta-in-order&utm_content=gta-order-desc-3
Discord: https://discord.gg/{C50 YouTube invite code}

Chapters
00:00 Almost thirty years of GTA
01:00 How to read this list
02:00 The top-down games
03:30 The 3D era, in release order
06:00 The 3D era, in story order
07:30 The HD era
09:30 What GTA VI actually confirms
11:00 The two to play first
12:30 Release time and reminders

Sources
- Rockstar Newswire: GTA VI release date, pre-orders, "An Extended Look"
- IGN, 24 Jun 2026: price and single-player at launch; 4 May 2026: no PC at launch
- Steam weekly most-played chart, week ending 26 Sep 2026
- TechPlay game and series pages, checked 9 Nov 2026

Footage and art: official Rockstar Games material, used for reporting and commentary. No leaked material.
Written and voiced by {EIC name}. Edited by TechPlay.

TechPlay is the gaming publication that knows what you play. Gaming, on the record.
```

## 10. Pilot 2: "Release Radar: November 2026"

- **Publish:** Fri 30 Oct 2026, 16:00 Sarajevo. Campaign C50; `utm_campaign=c50-release-radar`, `utm_content=rr-2026-11-*`.
- **Length:** 8–10 min.
- **Audience:** S1 Release Planners first; S4, S5 and S6 through their dates.
- **Rules:** every date is from the calendar research [R05 §1] and re-checked on Tue 27 Oct against the publisher page; low-authority items (PS Plus renewal prices on 6 Nov) are included only if Sony has confirmed them by 27 Oct; Fortnite's season change is described as unconfirmed or cut; "TBA" items get one shared card.
- **Why a pilot now:** R19 advises six weeks of Shorts before long-form [R19 §3]. By 30 Oct the Shorts system has run four weeks. The pilot is kept anyway because it reuses the calendar (lowest-cost long-form we can make) and because November is the busiest month of the quarter. If the Shorts schedule has slipped by more than two videos in weeks 41–43, the pilot is cut to a 5-minute text-led version without VO (decision Mon 26 Oct, EIC).

### 10.1 Outline and chapters

| Chapter | Time (approx.) | Content | Visuals |
|---|---|---|---|
| 00:00 Cold open | 0:00–1:00 | Script below | Month grid animates in |
| 01:00 Week 1 (2–8 Nov) | 1:00–3:00 | WoW: Forever, 4 Nov (reported), with a pointer to the Analyzer; Stellar Blade Complete Edition, 5 Nov; Guardians of the Galaxy and Edge of Memories on new platforms, 5 Nov; IEM Beijing, 2–8 Nov (one line); PlayStation Stars ends 2 Nov (one line, as listed in SPINE §11) | Cards with platform chips and confidence labels |
| 03:00 Week 2 (9–15 Nov) | 3:00–4:30 | Pikmin 4 Switch 2 Edition and Metaphor: ReFantazio on Switch 2, 12 Nov; League of Legends Worlds final, 14 Nov | Cards |
| 04:30 Week 3 (16–22 Nov) | 4:30–6:30 | GTA VI and GTA VI: The Album, 19 Nov: platforms, price, single-player, no PC; the limited DualSense (reported); Steam Auto-Battler RPG Fest, 16–23 Nov | GTA ledger cards; release-time tool capture |
| 06:30 Week 4 (23–30 Nov) | 6:30–7:45 | PGL CS2 Major from 25 Nov; US Thanksgiving 26 Nov; Black Friday 27 Nov and Cyber Monday 30 Nov, with the note that hardware prices rose in 2026 (Switch 2 to $499.99 on 1 Sep, Xbox Series X to $649.99 on 1 Aug) [R05 exec §7] | Price-history card |
| 07:45 Dated "sometime in November" | 7:45–8:45 | Football Manager 27, Battlefield 6 Season 5, Xbox Series X25 Limited Edition, Golden Joystick Awards: window only, no date yet | One TBA card |
| 08:45 How to not miss any of it | 8:45–end | Calendar reminders, the Friday newsletter; end screen | Calendar screen capture; TPL-L-END |

### 10.2 Opening 60 seconds (script)

> **[0:00–0:10]** *November grid on `#05070A`. The 19th fills crimson.*
> VO: "November has one date everyone already knows: the nineteenth, when GTA Six comes out on PS5 and Xbox. It isn't the only date worth knowing."
>
> **[0:10–0:28]** *Other dates light up in white as they are named: 4, 5, 12, 14, 27.*
> VO: "World of Warcraft: Forever is due on the fourth. Switch 2 gets new editions of Pikmin 4 and Metaphor: ReFantazio on the twelfth. League of Legends crowns a world champion on the fourteenth. And Black Friday lands on the twenty-seventh, in a year when console prices went up, not down."
>
> **[0:28–0:45]** *Text on screen: "Release Radar". Three stamps appear: CONFIRMED, REPORTED, RUMOUR.*
> VO: "This is Release Radar: once a month, the dates that matter, checked against the publishers' own pages. If something is only reported, we say so. If it's a rumour, it's labelled as one, or it isn't here."
>
> **[0:45–1:00]** *Screen capture: a game page on TechPlay, cursor on "Remind me".*
> VO: "Every game in this video has a page on TechPlay where you can set a reminder for release day. The link's below. Here's the first week."

### 10.3 Description (final copy)

```
Every notable game release and gaming date in November 2026, week by week, with platforms and a label on anything that isn't confirmed.

Set a reminder for any of these: https://techplay.gg/calendar?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-release-radar&utm_content=rr-2026-11-desc
GTA VI release time for your time zone: https://techplay.gg/gta6/release-time?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-release-radar&utm_content=rr-2026-11-desc-2
Is your WoW character ready for Forever? https://techplay.gg/wow-analyzer?utm_source=youtube&utm_medium=organic-social&utm_campaign=c50-release-radar&utm_content=rr-2026-11-desc-3
Discord: https://discord.gg/{C50 YouTube invite code}

Chapters
00:00 November at a glance
01:00 Week 1: WoW: Forever and Stellar Blade
03:00 Week 2: Switch 2 editions and the Worlds final
04:30 Week 3: GTA VI
06:30 Week 4: Black Friday and Cyber Monday
07:45 Dated "November", no day yet
08:45 How not to miss any of it

Sources: publisher and platform pages as listed on each game's TechPlay page; Steamworks upcoming events; Rockstar Newswire; IGN (24 Jun 2026, 4 May 2026). Checked 27 Oct 2026.

Footage and art: official publisher material, used for reporting. No leaked material.
Written and voiced by {EIC name}. Edited by TechPlay.

TechPlay is the gaming publication that knows what you play. Gaming, on the record.
```

### 10.4 Production plan for both pilots (ESTIMATE, hours)

| Step | Release Radar Nov | GTA in Order | Owner | When |
|---|---|---|---|---|
| Script from calendar / series page | 4 | 6 | EIC | RR: Mon 26 Oct · GTA: Tue 3–Thu 5 Nov |
| Fact-check against sources | 1 | 1.5 | ED | RR: Tue 27 Oct · GTA: Mon 9 Nov |
| VO recording and clean-up | 1 | 1.5 | EIC | RR: Tue 27 Oct · GTA: Mon 9 Nov |
| Cards, chapter cards, thumbnail | 2 | 2.5 | DS | RR: 26–27 Oct · GTA: 5–9 Nov |
| Edit, captions, export | 6 | 8 | SC | RR: 27–29 Oct · GTA: 9–11 Nov |
| Upload, description, end screen, pinned comment | 0.5 | 0.5 | SC | Day before publish |
| **Total** | **14.5** | **20** | | |

R19 puts a long video at one to two days [R19 §2]; these totals sit inside that range. In both pilot weeks the Wednesday rotation Short is dropped and SC's Reddit time is halved (C47) to pay for the edit.

## 11. Gate for continuing long-form (decided Mon 16 Nov, EIC)

Release Radar December (Fri 27 Nov) and January (Mon 28 Dec) run only if at least three of these hold for Release Radar November at 17 days. Thresholds are our own bar, set now so the decision is not made after seeing the numbers; they are not industry benchmarks.

| # | Criterion | TARGET |
|---|---|---|
| 1 | Published on the planned day | Yes |
| 2 | Production hours | ≤ 1.25 × the 14.5 h estimate |
| 3 | Average percentage viewed (Studio) | ≥ 35% |
| 4 | Traffic that reached the site | ≥ 1 tracked `reminder_set` or `registration_complete` from `utm_campaign=c50-release-radar` (requires D-007/D-008) |
| 5 | Comments that asked a question we could answer | ≥ 3 |

The GTA pilot is reviewed on Thu 26 Nov with the same five criteria; its result decides whether In Order becomes a quarterly long-form (FF7 in Q1) or stays a Shorts-and-page format.

## 12. Community posts plan

Availability of community posts for a channel this size is CHECK C-05. If available:

| When | Post | Type |
|---|---|---|
| Every Wed from 30 Sep | Mirror of Poll of the Week (F12), same question as Discord and X | Poll |
| 30 Oct, 12 Nov | "New: {video title}" with one line on what it answers | Text + image |
| Sat 17 Oct, 31 Oct, 14 Nov | GTA 6 countdown card (33, 19 and 5 days), same art as the Short | Image |
| Wed 18 Nov | "Tomorrow. Unlock time for your time zone: techplay.gg/gta6/release-time" | Image |
| Mon 2 Nov | "Which series should In Order cover next? Final Fantasy VII / Persona / Metro / Monster Hunter" (result picks the Q1 long-form) | Poll |
| Mon 23 Nov | "December's Radar: which date are you waiting for? The Game Awards / Monster Hunter Wilds on Switch 2 / Path of Exile 2 1.0 / Steam Winter Sale" | Poll |
| Tue 15 Dec | "Your 2026 in Games is live: make your card at techplay.gg/year-in-review" (C28) | Text + image |

Poll results are reported back in the next Save File issue and never inflated; if a poll gets few votes, we don't publish the result as a percentage.

## 13. Livestreaming: not now

Decision: no YouTube live in Q4. The Game Awards (10 Dec) is covered with an X live thread, a Discord watch party and a site live blog (F20), which need no video rights and no presenter [SPINE §6]. Twitch is NOT NOW [SPINE §12].

Revisit on Mon 11 Jan 2027. Go live only if all five hold:

1. Both long-form pilots met the gate in §11.
2. Shorts ran eight consecutive weeks with no more than two missed slots in total.
3. A named person is willing to be the voice on a live show and has 4 hours a week for it without taking hours from EIC's reviews or PR.
4. There is a live format built on TechPlay data rather than personality, for example a monthly "Release Radar live" answering calendar questions, or a WoW patch-night Analyzer session with Discord members.
5. Live-stream eligibility, moderation tools and music rules for the channel are checked (CHECK C-12).

## 14. Channel setup checklist (w40, 28 Sep–2 Oct)

| # | Task | Owner | Due |
|---|---|---|---|
| 1 | Rename display name "TechplayGG" to "TechPlay"; keep handle `@techplay_gg` | SC | Tue 29 Sep |
| 2 | Replace the bio with the About text below; remove "We test hardware until it breaks and play games until 4 AM" everywhere it appears (YouTube and X), part of C01 | SC, EIC approves | Tue 29 Sep |
| 3 | Profile image: TechPlay mark, white on crimson; banner: "Gaming, on the record." and the schedule line "Out This Week every Monday · Fix It Friday · Release Radar monthly" on `#05070A`, all text inside the centre safe area (banner spec: CHECK C-11) | DS | Thu 1 Oct |
| 4 | Links: techplay.gg, Release calendar, GTA 6 hub, Discord (YouTube invite code), X `@TechPlayGG`; add The Save File once `/newsletter` is live | SC | Thu 1 Oct |
| 5 | Create playlists (list below), each with a one-line description | SC | Fri 2 Oct |
| 6 | Upload defaults: category Gaming, language English, description template §7.2, comments on, links in comments held for review | SC | Fri 2 Oct |
| 7 | Channel verification for custom thumbnails and uploads over 15 minutes (CHECK C-06) | EIC | Fri 2 Oct |
| 8 | Blocked-words list for comments: leak site names, slurs, "free download", "mod menu" | SC | Fri 2 Oct |
| 9 | Create the YouTube Discord invite code(s): one for C49 Shorts, one for C50 long-form; log them in the invite sheet (C36) | SC | Fri 2 Oct |
| 10 | Decide the Support tier promises ("early access to videos", "name in video credits"): remove until long-form continues, or deliver from 30 Oct (credits card for Legend supporters, only with their consent) | EIC | Fri 2 Oct |
| 11 | Create TikTok `@techplay.gg` (both handles were free on 27 Sep); same bio, link to techplay.gg | SC | Fri 2 Oct |
| 12 | Policy checks C-01 to C-13 answered and logged (§15) | EIC | Fri 2 Oct (C-04 and C-12 can wait) |

**About text (final copy):**

> TechPlay is the gaming publication that knows what you play. Gaming, on the record.
>
> Short, sourced videos about what's releasing, what's actually confirmed, and how to fix what's broken on your PC: Out This Week every Monday, Fix It Friday, a GTA 6 countdown to 19 November, and Release Radar once a month.
>
> No presenter, no reaction videos, no re-uploaded trailers. Dates come from publishers and platforms, rumours are labelled as rumours, and every video lists its sources.
>
> Behind the channel is techplay.gg: a database of 333,000+ games and a free library that fills itself from Steam, PlayStation, Xbox, GOG and Epic, then tells you what's releasing, what's on sale and what to play next. Independent, based in Sarajevo.

**Playlists:** Out This Week · GTA 6: Countdown to Vice City · GTA 6: Confirmed or Rumour? · Fix It Friday (PC fixes) · Release Radar · In Order · Worth It in 2026? · The Number · WoW Readiness Check · Steam Next Fest Diary (October 2026).

## 15. Policy checks (unknown, not researched) [R19 §6]

None of these was verified in Phase 1. Each gets a written answer, with the link to the platform's own help page and the date checked, in the video log before the dependent format ships.

| ID | Question | Why it matters | Default until answered | Owner | Due |
|---|---|---|---|---|---|
| C-01 | Current maximum length of a YouTube Short, and how Shorts views are counted | Format lengths | Every Short ≤ 60 s | EIC | 2 Oct |
| C-02 | Can a Short carry a clickable link (description, related video, comments)? | Tracking and CTA | On-screen short path; related video to long-form | SC | 2 Oct |
| C-03 | Are end screens or cards available on Shorts? | CTA | None | SC | 2 Oct |
| C-04 | YouTube Partner Programme thresholds in 2026 | Monetisation (not a Q4 goal) | Ignore in Q4 | EIC | 11 Jan 2027 |
| C-05 | Are community posts available to a channel of this size? | §12 | Mirror polls in Discord and X only | SC | 2 Oct |
| C-06 | Verification needed for uploads over 15 minutes and custom thumbnails | Pilots | Keep long-form under 15 min; verify phone | EIC | 2 Oct |
| C-07 | Thumbnail file-size and format limits | §5 | JPEG under 2 MB | DS | 2 Oct |
| C-08 | Can a custom cover be set for a Short? | §5 | First frame designed as cover | SC | 2 Oct |
| C-09 | Chapter requirements (minimum count and length) | §7.1 | 00:00 first, three or more, none under 10 s | SC | 23 Oct |
| C-10 | Can cards and end screens link to techplay.gg from this channel? | CTA | Description links only | SC | 23 Oct |
| C-11 | Current banner and profile image specs | §14 | Keep text in the centre third | DS | 1 Oct |
| C-12 | AI-generated voice and synthetic media disclosure rules on YouTube, TikTok, Instagram and Facebook | Any future AI voice | No AI voice or synthetic visuals in Q4 | EIC | 11 Jan 2027 |
| C-13 | Publisher video policies: Rockstar / Take-Two, Nintendo Game Content Guidelines, Blizzard, Bethesda, Activision, Valve (Steam store assets) | Any official footage or art | Official press-kit art and short credited clips only; no gameplay capture of a publisher's game until its policy is logged | EIC | 2 Oct for Rockstar and Blizzard; before first use for the others |

TikTok's US operating status and recommendation documentation and Instagram's treatment of Reels versus carousels are also open [R19 §6]; they are tracked in `18-VIDEO.md` §9 because they affect cross-posting, not the YouTube plan.

## 16. KPIs and review points

### 16.1 Metrics

| Level | Metric | Definition / formula | TARGET |
|---|---|---|---|
| Output | Shorts published on schedule | published ÷ planned per week | ≥ 90% per week; ≥ 60 Shorts by 31 Dec |
| Output | Long-form pilots | published on date | 2 of 2 |
| Output | Source line present | Shorts with a source line ÷ Shorts with a claim | 100% |
| Attention | Median views per Short at 7 days | from Studio, per show | Baseline weeks 41–43; TARGET weeks 45–48 median ≥ 1.5 × baseline |
| Attention | Average percentage viewed per Short | Studio | Baseline weeks 41–43; TARGET no show below its own baseline for three weeks running (otherwise redesign or drop it) |
| Attention | Subscribers per 1,000 views | subscribers gained ÷ views × 1,000, per show | Baseline; used to rank shows, not to promise growth |
| Long-form | Impressions click-through rate; average percentage viewed | Studio | Gate in §11 |
| Site | Sessions from YouTube | GA4 / collector sessions with `utm_source=youtube` (needs D-008) | Tracked from the first week the collector keeps UTMs |
| Action | Action rate from YouTube | (`reminder_set` + `tool_run` + `registration_complete`) in YouTube sessions ÷ YouTube sessions | Baseline; reported monthly |
| Community | Discord joins from YouTube | `discord_join` with the YouTube invite codes (D-011) | Reported weekly |
| Guardrail | Copyright | Content ID claims logged; copyright strikes | 0 strikes; every claim reviewed within 48 h |
| Guardrail | Comments | Time to first moderation pass | < 24 h |

No subscriber target is set. There is no baseline, and a subscriber number chosen now would be invented.

### 16.2 Review points

| Date | Review | Decision |
|---|---|---|
| Mon 26 Oct | Shorts schedule adherence, weeks 41–43 | Release Radar November: full VO version or 5-minute text-led fallback |
| Mon 2 Nov | Four-week baseline per show | Drop or redesign the weakest rotation format; confirm the Community-post question for the In Order Q1 pick |
| Mon 16 Nov | Six weeks of Shorts [R19 §3]; Release Radar November at 17 days | Go/no-go for Release Radar December (§11); whether all four vertical platforms keep full effort |
| Thu 26 Nov | GTA pilot at 14 days | In Order: quarterly long-form or Shorts-and-page only |
| Mon 14 Dec | Q4 review of every show | Release Radar January go/no-go; which shows continue into Q1 |
| Mon 11 Jan 2027 | Channel decision for Q1 | Long-form cadence; livestream criteria (§13); AI voice policy (C-12) |

## 17. Capacity summary

| Role | Steady state per week (ESTIMATE) | Pilot weeks (w44, w46), extra | Where it comes from |
|---|---|---|---|
| SC | ~6 h: about 4.8 h producing and publishing six Shorts, 1 h comments, community posts and the video log | +6.5 h (RR), +8.5 h (GTA) | Wednesday rotation dropped; C47 Reddit hours halved that week |
| DS | ~2 h: template upkeep, one-off cards | +2 h (RR), +2.5 h (GTA) | DS's carousel fills that week use templates only |
| ED | ~1 h: ledger status check, 60-second version of the Fix It Friday guide | +1 h, +1.5 h fact-check | Already writing the source guides and articles |
| EIC | ~0.5 h: policy log, approvals | +5 h (RR), +7.5 h (GTA) scripts and VO | Two weeks in the quarter |

Full batch schedule, repurposing chain and file naming: `18-VIDEO.md`.

## Dependencies and open questions

**Dependencies**
- C01 / D-001: channel bio and X bio cleaned before the first upload; the Analyzer's stale claims removed (D-040) before any Readiness demo.
- C03 / D-007, D-008, D-009: GA4 key events, UTM capture in the collector and the campaign URL helper, or YouTube traffic cannot be measured beyond Studio.
- D-011 and C36: YouTube-specific Discord invite codes and join attribution.
- C08 / D-018: `/gta6/release-time` live by 14 Oct (countdown 17 Oct and 18 Nov, both pilots).
- C11: map tracker live 19 Nov (countdown 14 Nov and launch Short).
- C12: sourced `real_equivalent` data by 21 Oct, or the 31 Oct Short uses its fallback.
- C63: GTA series page with a "start here" block by 7 Nov; the GTA series slug must be confirmed (not checked in this plan).
- C60 / guides: each Fix It Friday guide published by Thursday of its week.
- D-005: GTA 6 news re-pointed to `/games/grand-theft-auto-vi` before any video sends traffic there.
- D-012: `/newsletter` landing before descriptions link to it.
- D-020: until gtadb.org attribution is settled, videos show the GTA 6 map but never call its 1,058 locations TechPlay's own dataset, and they mention that 211 are flagged unconfirmed.
- C09: no giveaway mention in any video until verified in admin.

**Open questions**
1. Vanity redirects for Shorts (for example `techplay.gg/go/yt-otw` → `/calendar` with UTMs) so on-screen paths are measurable. Proposed as an extension of D-009; needs a DEV estimate and EIC decision.
2. Who records VO if EIC is unavailable in a pilot week: ED as backup, or a text-led cut?
3. Support tier promises about videos (§14 item 10): remove or deliver?
4. Should long-form videos be embedded on the site (Release Radar in the monthly calendar article, GTA order on the series page)? The CSP already allows YouTube embeds [R02 §1.2]; needs an ED decision per page.
5. The Wednesday rotation assumes C20, C22, C25 and C26 publish on their spine dates; if a data piece slips, the slot takes a swap-in from §8.3.

**Conflicts found**
- R19 recommends no long-form until Shorts have run six weeks [R19 §3]; the spine schedules Release Radar November inside week four (C50). Resolved with the fallback in §10 and the gate in §11.
- R09 EA-110 gives the Switch 2 price as $449.99; R05 records a rise to $499.99 on 1 Sep 2026. This plan uses $499.99.
