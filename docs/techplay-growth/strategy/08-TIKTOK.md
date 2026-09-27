# 08 — TikTok and the vertical video machine

Status: Phase 2 plan — 27 Sep 2026

- **TikTok is where the one vertical-video production (C49) is made first;** the same clean exports go to YouTube Shorts, Instagram Reels and Facebook Reels [spine §12]. The spine rates vertical video SECONDARY; R07 rated TikTok on its own EXPERIMENTAL. Both hold: the production is a commitment, native TikTok posting is a six-week test with a keep/kill rule (§11).
- **No presenter is assumed.** Every format works as text on screen over official footage, TechPlay's own site screens and data cards, with an optional human voice-over by ED or SC. If a synthetic (AI) voice is ever used, TikTok's and each other platform's AI-content disclosure rules must be checked first; they were not researched [R19 §6].
- **TechPlay has no TikTok account:** `@techplay.gg` and `@techplaygg` both returned "Couldn't find this account" on 27 Sep [R02]. SC claims `@techplay.gg` in week 1.
- **Eleven formats, each with a fixed timing skeleton** (0–2s hook, 2–7s context, 7–15s information, 15–25s payoff, CTA) and one fully written script on a real Q4 2026 topic [R05, R06, R17].
- **A 12-week plan from 28 Sep to 20 Dec** built on the spine's key dates: Gears of War: E-Day (6 Oct), Next Fest (19–26 Oct), Modern Warfare 4 (23 Oct), WoW: Forever (4 Nov), GTA VI (19 Nov), Black Friday (27 Nov), The Game Awards (10 Dec), Steam Winter Sale (17 Dec).
- **Cadence TARGET: 5–6 videos a week** (F01 Monday, F02 three times a week to 19 Nov, F07 Friday, F18 Sunday, one topical), about 5 SC hours and 2 ED hours a week (ESTIMATE).
- **Footage rules are strict:** official trailers and press screenshots only, credited on screen; no leaked, datamined or modded material; no own GTA gameplay capture until Rockstar's video policy is read. Rockstar is actively policing its IP [R17 §10, R19 §4].
- **Every video ends on one measurable action** on the site: a reminder, a shelf add, an Analyzer run, a Discord join [R19 §5].

---

## 1. Constraints we plan around

| Constraint | Evidence | What we do |
|---|---|---|
| No account, no videos, no data | R02 §8.2; R19 | Claim the handle; treat weeks 1–6 as a test with a decision date |
| No on-camera presenter | R19 exec summary | Text-on-screen and voice-over formats only |
| Platform rules for TikTok, Shorts and Reels were not researched (length, links, AI voice, music) | R19 §6; R07 §3.5 | SC checks each in-app in week 1 and records the answers in the C49 sheet before the first post |
| TikTok's US operation moved to a new joint venture on 22 Jan 2026 and the US algorithm is being retrained; delivery may be volatile | R16 §2.7 | Judge by six-week medians, not single videos |
| Gaming video that works for GTA VI is breakdowns, map explainers, detail-spotting [R19 §1] | R19 | We take the data-and-explainer lane; we do not race IGN on re-uploads |
| SC has 25 hours a week for all community and social work | spine §1 | Templates in CapCut and Canva; batch production; no bespoke edits |

---

## 2. Account setup (week 1, SC 1.5 h, DEV 0.25 h)

| Item | Setting |
|---|---|
| Handle | **Claim `@techplay.gg`** (not found on 27 Sep [R02]). If TikTok refuses the dot or it is taken, `@techplaygg`. Record which in the C49 sheet and use the same on Shorts if free. |
| Display name | TechPlay |
| Account type | Business account, so the analytics are available. Business accounts may be limited to TikTok's commercial music library (UNVERIFIED): plan for no trending sounds. |
| Owner | Registered to a shared company mailbox, not a personal one; two-factor on; SC and EIC both have access |
| Bio | "Gaming, on the record. What's out, where to play it, what to play next. Independent, Sarajevo." |
| Link | `https://techplay.gg/gta6/release-time?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c08-gta6-release-time&utm_content=bio` from 14 Oct; before that `/calendar` with `c04-out-this-week`. Whether a bio link needs a follower threshold is UNVERIFIED; if it does, the CTA says "search TechPlay GTA 6" and the comment pin carries the URL as text. |
| Site | DEV sets the `tiktok_url` site setting so the footer icon links to the account (the slot exists [R16 §2.7]) — once there are at least six videos posted, so the footer never points to an empty profile |
| Pinned videos | 1) the current F01; 2) the GTA VI countdown's latest; 3) "What TechPlay is" (a 20-second screen tour of the calendar, a game page and the library import) |

---

## 3. Voice, look and templates

**Voice options, in order of preference**

| Option | How | Cost | Rule |
|---|---|---|---|
| A. Human voice-over | ED or SC records on a phone with a clip-on mic, one take per script, quiet room | 5–10 min per video | Preferred. Same voice every week builds recognition. |
| B. Text on screen, no voice | Burned-in text, music bed from the licensed library | 0 min | Default for F02 countdown and lists |
| C. Synthetic (AI) voice | TikTok or CapCut text-to-speech | 0 min | Only after SC confirms in writing TikTok's, YouTube's and Meta's current AI-content labelling rules [R19 §6], and applies the label. Never a cloned real voice. |

**Look.** Every video has burned-in captions (most people watch muted), a TechPlay lower-third in the last 3 seconds, a source line whenever a fact is on screen, and a footage credit ("Footage: Rockstar Games") in the top corner whenever publisher footage is used. Safe zones: nothing in the bottom 20% or the right-hand 15% of the frame, where the interface sits.

**CapCut templates (DS builds in week 1, 3 hours)**

| Template | Used by | Structure |
|---|---|---|
| T-Count | F02 countdown | Big day number → fact card with status tag → CTA card; 12–15 s |
| T-List | F01, lists, F18 | Title card → 3–6 item cards (art, name, date, platform) → CTA; 25–40 s |
| T-Explain | explainers, F07, history | Question card → 3 answer beats over footage or screens → payoff card → CTA; 30–60 s |
| T-Number | facts, hardware | One number huge → context → comparison → CTA; 15–25 s |
| T-Ledger | F03, controversies | Status-tagged cards (CONFIRMED / REPORTED / RUMOUR) with sources; 25–35 s |
| T-Verdict | F24 | Score → verdict line → what we played → CTA; 20–30 s |
| T-Reply | comment replies | TikTok's comment sticker over a question card → answer beats → CTA; 15–30 s |

Stills (cards, score boxes, source lines) are made in Canva from the same masters as Instagram (`07-INSTAGRAM.md` §3) and dropped into CapCut.

---

## 4. The timing skeleton (every format)

| Beat | Time | Job | Rule |
|---|---|---|---|
| Hook | 0–2 s | The answer or the surprising part, on screen and in the first words | No "wait for it", no "you won't believe"; say the thing |
| Context | 2–7 s | Why it matters now: the date, the platform, the price | One sentence |
| Information | 7–15 s | The facts, two or three, each with its source on screen | No filler; cut anything unsourced |
| Payoff | 15–25 s | The useful conclusion: what to do, what it means, what we don't know | Honest about unknowns |
| CTA | 25–30 s (or last 3–5 s) | One action on the site, spoken and on screen | One action; no "like and follow" stack |

Longer formats (F07 fixes, history) stretch the information and payoff beats to 60 seconds; the first 7 seconds never change.

---

## 5. Formats, each with one full script

Scripts give voice-over (VO) and on-screen text (OST). Where a bracket appears, it is filled from the named source on the day; the rest is final copy.

### 5.1 News

**Structure:** Hook = what happened + who it's for (0–2) · Context = date and platforms (2–7) · Information = two facts the headline skips (7–15) · Payoff = what to do today (15–25) · CTA = game page or calendar.
**Visuals:** official trailer clip or key art, platform logos, date card. **Frequency:** 1 a week, on launch days.

**Script — "Modern Warfare 4 is out today", Fri 23 Oct**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Call of Duty is on a Nintendo console again. Today." | CALL OF DUTY ON SWITCH 2 · TODAY | MW4 official key art |
| 2–7 s | "Modern Warfare 4 launches today on PS5, Xbox, PC and Switch 2." | 23 OCT · PS5 · XBOX SERIES X|S · PC · SWITCH 2 | Platform logos over trailer clip |
| 7–15 s | "It's the first Call of Duty on a Nintendo platform since Ghosts. And it's not on Game Pass on day one." | FIRST ON NINTENDO SINCE GHOSTS · NOT DAY ONE ON GAME PASS | Trailer clip; source line "Activision" |
| 15–25 s | "If you pre-ordered digitally, you've had the campaign since the sixteenth. Everyone else: check your platform's download size before tonight." | CAMPAIGN EARLY ACCESS SINCE 16 OCT | Date card |
| 25–30 s | "Requirements and editions are on our MW4 page." | techplay.gg · MW4 PAGE · LINK IN BIO | TechPlay lower-third |

Caption: `Modern Warfare 4 is out on PS5, Xbox Series X|S, PC and Switch 2. Not day one on Game Pass. #ModernWarfare4 #CallofDuty #NintendoSwitch2` · Footage credit: Activision. · Pinned comment: `techplay.gg/games/[mw4-slug]?utm_source=tiktok&utm_medium=organic-social&utm_campaign=c17-mw4-hub&utm_content=news-tt-launch`

### 5.2 Explainers

**Structure:** Hook = the question people ask (0–2) · Context = why it's being asked now (2–7) · Information = the answer in three beats (7–15/7–40) · Payoff = the practical takeaway (15–25) · CTA = the page that keeps the answer current. F07 Fix It Friday uses this structure at up to 60 s.

**Script — "Is GTA 6 single-player only?", Tue 27 Oct (23 days)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "At launch, GTA 6 is single-player." | GTA VI AT LAUNCH: SINGLE-PLAYER | Official Rockstar art |
| 2–7 s | "That's how Rockstar described it in June: a single-player experience, out 19 November." | "A SINGLE-PLAYER EXPERIENCE" · IGN, 24 JUN 2026 | Quote card |
| 7–15 s | "So what about GTA Online? Rockstar hasn't announced an online mode for GTA 6. The 2027 date you've seen is a report, not an announcement." | ONLINE: NOT ANNOUNCED · "2027" = RUMOUR (THE MIRROR, 18 SEP) | Ledger cards, RUMOUR tag |
| 15–25 s | "If you're buying for the story, nothing changes. If you're buying for online with friends, you're waiting, and nobody has said how long." | STORY: 19 NOV · ONLINE: NO DATE | Two-column card |
| 25–30 s | "We keep a list of what's confirmed and what's rumour, with sources. Link in bio." | CONFIRMED OR RUMOUR? · techplay.gg/gta6 | Lower-third |

Caption: `GTA VI is single-player at launch. An online mode hasn't been announced; "2027" is a report. Sources on our ledger. #GTA6 #GTAVI #GTAOnline` · Footage credit: Rockstar Games.

### 5.3 Gaming facts

**Structure:** Hook = the number or the fact (0–2) · Context = what it's about (2–7) · Information = how it came to be (7–15) · Payoff = what it tells you (15–25) · CTA. The F02 countdown is this format compressed to 12–15 s (hook = days left; information = one hub fact; CTA = reminder).

**Script — "Fable moved to get out of GTA 6's way", Thu 8 Oct**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Fable moved its release date to avoid GTA 6." | FABLE MOVED. BECAUSE OF GTA VI. | Fable official key art |
| 2–7 s | "Fable now launches on 23 February 2027, on PS5, PC and Xbox, and day one on Game Pass." | 23 FEB 2027 · PS5 · PC · XBOX · GAME PASS DAY ONE | Date card |
| 7–15 s | "When the new date was announced in May, avoiding GTA 6 was the stated reason. GTA 6 launches 19 November." | ANNOUNCED 29 MAY 2026 · GTA VI: 19 NOV | Two-date timeline |
| 15–25 s | "Look at the calendar: October is packed, and the weeks right after GTA 6 are almost empty." | OCT: GEARS · MW4 · PHANTOM BLADE ZERO · NOV 19: GTA VI · AFTER: QUIET | Calendar screen recording from techplay.gg/calendar |
| 25–30 s | "Our calendar shows every date. Set a reminder for Fable there." | techplay.gg/calendar · REMIND ME | Lower-third |

Caption: `Fable moved to 23 Feb 2027 to stay clear of GTA VI. Sources: Wikipedia citing the 29 May 2026 announcement. #Fable #GTA6 #Xbox` · CTA link: `/calendar/[fable-slug]` with `utm_campaign=c04-out-this-week&utm_content=facts-tt-fable`.

### 5.4 Controversies (neutral)

**Structure:** Hook = what changed, stated flatly (0–2) · Context = who said it and when (2–7) · Information = the confirmed facts, then what is only reported (7–15) · Payoff = what it means for a player, and what nobody knows yet (15–25) · CTA = the tracker or explainer. No adjectives about people, no "greed", no blame; every line sourced. Comments are moderated to the spine guardrail (queue < 24 h).

**Script — "Sony and PlayStation discs: what we actually know", Wed 30 Sep (C66)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Sony plans to stop making PlayStation discs." | SONY PLANS TO END PLAYSTATION DISCS | PS5 official product image |
| 2–7 s | "It's been reported this month, and Sony has been surveying players and developers about it." | REPORTED SEP 2026 · SONY SURVEYING PLAYERS | Headline cards: Push Square, Eurogamer, Kotaku (credited) |
| 7–15 s | "One reported timeline is January 2028. Publishers say Sony is hearing the backlash. Sony hasn't set out what happens to discs you already own." | REPORTED DATE: JAN 2028 · EXISTING DISCS: NO STATEMENT YET | Ledger cards: REPORTED tags |
| 15–25 s | "So nothing changes today. What to watch for: a date from Sony itself, and whether disc-only games get digital versions." | NOTHING CHANGES TODAY · WATCH: SONY'S OWN DATE | Plain card |
| 25–30 s | "We log every Sony statement as it lands. Link in bio." | techplay.gg · WILL MY DISCS STILL WORK? | Lower-third |

Caption: `What's confirmed and what's only reported about Sony ending PlayStation discs. We update the explainer every time Sony speaks. #PS5 #PlayStation #PhysicalMedia` · Link: the discs explainer with `utm_campaign=c66-last-disc&utm_content=controversy-tt-discs`.
Note: this video is news, not advocacy. The Last Disc open letter (`/last-disc`) is TechPlay's own campaign and gets its own clearly labelled post, never folded into a neutral explainer.

**Second controversy (outline only), Wed 14 Oct:** "Xbox's restructuring: what's confirmed" — 268 more layoffs in September; Halo Studios effectively closed; Ninja Theory heading to closure; Obsidian moving to Bethesda [R05, R06]; payoff: "what happens to their games" → Studios Closed in 2026 tracker (C22).

### 5.5 Reviews (F24 Verdict)

**Structure:** Hook = the verdict in five words (0–2) · Context = what, where, how long we played (2–7) · Information = best thing, worst thing (7–15) · Payoff = who should buy it (15–25) · CTA = full review.
**Rule:** the score and verdict come from the published review only. The script below is shape; bracketed lines are the reviewer's.

**Script — "Phantom Blade Zero: the verdict", week of 2 Nov (C52)** — ILLUSTRATIVE
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "[Verdict in five words.]" | PHANTOM BLADE ZERO · [SCORE]/10 | Official key art |
| 2–7 s | "Out 29 October on PS5 and PC. We played [n] hours on [platform]." | 29 OCT · PS5 · PC · [n] HOURS | Date card |
| 7–15 s | "Best thing: [one concrete strength]. Worst thing: [one concrete weakness]." | BEST: [x] · WORST: [y] | Official trailer clip |
| 15–25 s | "Buy it if [who]. Wait if [who]." | BUY IF… · WAIT IF… | Two-column card |
| 25–30 s | "Full review, and where it's cheapest, on TechPlay." | techplay.gg/reviews | Lower-third |

Footage credit: S-GAME. The pre-launch fact "top ten on Steam's most-wishlisted list" [R05 §6] may be used as the context line if the reviewer wants it.

### 5.6 Recommendations (F18 Games Like, F05 Hidden Gem)

**Structure:** Hook = the anchor game and the promise (0–2) · Context = why now (2–7) · Information = 3–4 picks, one line each (7–25) · Payoff = the best pick for most people (25–30) · CTA = "your library picks for you" (Backlog Advisor / connect a platform).
Picks come from TechPlay's similar-games data, then an editor removes anything they would not recommend.

**Script — "What to play while you wait for GTA 6", Sun 15 Nov (4 days)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Four days to GTA 6. Here's what to play until then." | 4 DAYS · PLAY THESE FIRST | GTA VI official art |
| 2–7 s | "Start with the obvious one: GTA 5 Enhanced. It's been in Steam's top 25 most-played for weeks." | GTA V ENHANCED · STEAM TOP 25 (SEP 2026) | GTA V key art (Rockstar) |
| 7–15 s | "[Pick 2]: [one line on what it shares with GTA]. [Pick 3]: [one line]." | [PICK 2] · [PICK 3] | Key art per pick |
| 15–25 s | "[Pick 4], if you want [the specific thing]." | [PICK 4] | Key art |
| 25–30 s | "Connect Steam, PlayStation or Xbox to TechPlay and it picks from games you already own." | techplay.gg · FREE LIBRARY · LINK IN BIO | Screen recording of Backlog Advisor |

Caption: `Games to play before GTA VI on Thursday. Picks from our similar-games data, checked by an editor. #GTA6 #GTAV #GamingRecommendations` · UTM `utm_campaign=c49-vertical-video&utm_content=f18-tt-gta6`.
Check before posting: GTA V Enhanced's position in the Steam weekly chart that week; drop "for weeks" if it has fallen out.

### 5.7 Gaming history

**Structure:** Hook = the span of time or the "then vs now" (0–2) · Context = the starting point (2–7) · Information = 3 dated steps (7–20) · Payoff = what the pattern means (20–27) · CTA = the data piece or series page. Up to 45 s.

**Script — "Why GTA 6 took 13 years", Wed 4 Nov (15 days; C23)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Thirteen years between GTA 5 and GTA 6." | 2013 → 2026 · 13 YEARS | Split: GTA V art / GTA VI art (Rockstar) |
| 2–7 s | "GTA 5 came out in 2013. GTA 6 is out on 19 November." | GTA V: 2013 · GTA VI: 19 NOV 2026 | Timeline bar |
| 7–15 s | "And it was dated twice before that: first for fall 2025, then for 26 May 2026." | DATED: FALL 2025 → 26 MAY 2026 → 19 NOV 2026 | Timeline with two struck-through dates |
| 15–27 s | "It's not just Rockstar. We measured the gap between sequels across [n] big series, and [finding from C23 data]." | [C23 FINDING] | Chart from the C23 data piece |
| 27–33 s | "The full data, series by series, is on TechPlay." | techplay.gg · SEQUEL GAP · LINK IN BIO | Lower-third |

The 15–27 s beat is filled only from the published C23 piece; if C23 slips, that beat is cut and the video runs 20 s. Source line for dates: Rockstar Newswire.

### 5.8 Hardware

**Structure:** Hook = the price or spec (0–2) · Context = when it changed (2–7) · Information = the comparison (7–15) · Payoff = what it means for a buyer now (15–25) · CTA.

**Script — "What gaming hardware costs now", Tue 24 Nov (C31 run-up)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Consoles got more expensive this year, not less." | 2026: PRICES WENT UP | Product images (official) |
| 2–7 s | "Before you trust a Black Friday deal, here's what things cost now." | BEFORE BLACK FRIDAY (27 NOV) | Date card |
| 7–15 s | "Switch 2: four ninety-nine ninety-nine since September. Xbox Series X: six forty-nine ninety-nine since August. Steam Deck OLED: from seven eighty-nine since May." | SWITCH 2 $499.99 (1 SEP) · XBOX SERIES X $649.99 (1 AUG) · DECK OLED $789/$949 (27 MAY) | T-Number cards |
| 15–25 s | "The PS5 went up in April too. If a deal's 'was' price is lower than these, it's comparing with last year." | PS5: PRICE ROSE 2 APR · CHECK THE "WAS" PRICE | Card |
| 25–30 s | "Follow the games you want on TechPlay and we'll tell you when they drop in price." | PRICE ALERTS · techplay.gg | Screen recording of follow/alert (C31) |

Sources on screen: manufacturer announcements via R05. CTA depends on D-027 price alerts (20 Nov); if not live, CTA is the Deal Radar article.

### 5.9 Lists

**Structure:** Hook = the list's promise and length (0–2) · Context = the time window (2–7) · Information = items at ~3 s each (7–25) · Payoff = the one to mark (25–28) · CTA = save + calendar.

**Script — "Every Steam sale and fest until March", Tue 29 Sep**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Every Steam sale until March. Save this." | EVERY STEAM SALE → MARCH | Steam logo card |
| 2–7 s | "These are Valve's own dates." | SOURCE: STEAMWORKS EVENTS CALENDAR | Calendar card |
| 7–25 s | "Autumn Sale, first to eighth of October. Next Fest demos, nineteenth to twenty-sixth. Scream Fest, twenty-sixth to second of November. Winter Sale, seventeenth of December to fourth of January. Spring Sale, eighteenth to twenty-fifth of March." | AUTUMN SALE 1–8 OCT · NEXT FEST 19–26 OCT · SCREAM V FEST 26 OCT–2 NOV · WINTER SALE 17 DEC–4 JAN · SPRING SALE 18–25 MAR | T-List cards |
| 25–28 s | "No Steam sale on Black Friday. The big one is December." | BLACK FRIDAY: NO STEAM SALE | Card |
| 28–32 s | "Connect Steam to TechPlay and your wishlist is ready when they start." | techplay.gg · CONNECT STEAM | Lower-third |

Caption: `Every Steam sale and fest date to March 2027, from Valve's calendar. Cooking Fest (12–19 Oct), Auto-Battler RPG Fest (16–23 Nov) and February's Next Fest (from 22 Feb) are on our site too. #Steam #SteamSale #SteamNextFest`

### 5.10 Rapid reactions

**Structure:** Hook = the news in one line (0–2) · Context = where it was announced (2–7) · Information = platform, date, price if given (7–15) · Payoff = what we don't know yet (15–22) · CTA = its calendar page. Target: posted within 60 minutes of the announcement, from the T-Explain template. Only on primary-source announcements.

**Script — The Game Awards reveal, Thu 10 Dec (F20)** (one per major reveal; maximum three that night)
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "[Game] was just announced at The Game Awards." | JUST ANNOUNCED · [GAME] | Official trailer clip (publisher upload) |
| 2–7 s | "It's from [developer], and it's coming to [platforms]." | [DEVELOPER] · [PLATFORMS] | Card |
| 7–15 s | "Release: [date or window as stated]. Price: [if stated; otherwise 'not announced']." | [DATE] · [PRICE / NOT ANNOUNCED] | Card |
| 15–22 s | "Not announced yet: [the obvious open question, e.g. PC, Switch 2, Game Pass]." | NOT ANNOUNCED: [x] | Card |
| 22–26 s | "It's on our calendar now. Set a reminder." | techplay.gg/calendar | Lower-third |

Prep: before 10 Dec, ED creates `/calendar` entries for rumoured reveals only when announced; nothing is pre-published. Footage: the publisher's own trailer upload, credited.

### 5.11 Comment replies

**Structure:** Hook = the question from the comment, shown with TikTok's reply sticker (0–2) · Context = short answer (2–7) · Information = the evidence (7–15) · Payoff = the nuance (15–22) · CTA. Only public comments on TechPlay's own videos; never mock the commenter.

**Script — Reply to "is it on pc tho", Thu 12 Nov (7 days)**
| Time | VO | OST | Visual |
|---|---|---|---|
| 0–2 s | "Is GTA 6 on PC? Not at launch." | [comment sticker] · NOT AT LAUNCH | Comment sticker over GTA VI art |
| 2–7 s | "On 19 November it's PS5 and Xbox Series X and S only." | PS5 · XBOX SERIES X|S | Platform card |
| 7–15 s | "Take-Two's CEO talked about why in May. No PC date has been announced since." | TAKE-TWO CEO · IGN, 4 MAY 2026 · PC DATE: NONE | Source card |
| 15–22 s | "Anything claiming a PC date right now is a rumour. When there's a real one, it'll be on our ledger the same day." | PC DATE CLAIMS = RUMOUR | Ledger card |
| 22–26 s | "Set a reminder on the GTA 6 page and you'll hear first." | techplay.gg/gta6 · REMIND ME | Lower-third |

---

## 6. Franchise map (what the machine makes each week)

| Day | Franchise | Format | Length | Voice |
|---|---|---|---|---|
| Mon | F01 Out This Week (C04) | Lists | 30–40 s | VO (A) |
| Tue | F02 countdown (C06) to 19 Nov; then F10 Worth It in 2026? or hardware | Facts / explainer | 12–15 s / 30 s | Text (B) / VO |
| Wed | Topical: news, controversy, history or data piece (C20–C26 dates) | Per plan | 25–45 s | VO |
| Thu | F02 countdown to 19 Nov; then F05 Hidden Gem | Facts / recommendations | 12–15 s / 30 s | Text / VO |
| Fri | F07 Fix It Friday (C60) | Explainer | 45–60 s | VO |
| Sat | F02 countdown to 19 Nov; then comment reply | Facts / reply | 12–15 s / 20 s | Text / VO |
| Sun | F18 Games Like | Recommendations | 30 s | VO |

Rapid reactions and news are added on event days and replace the Wednesday slot that week, so the weekly total stays at 6–7.

---

## 7. The 12-week plan (28 Sep – 20 Dec)

Days-to-launch numbers are for GTA VI on 19 Nov. "Topical" is the Wednesday slot unless the date says otherwise.

| Wk | Dates | Key dates (spine §11) | Videos (title / hook) |
|---|---|---|---|
| 1 | 28 Sep–4 Oct | Autumn Sale 1–8 Oct; C07 ledger 1 Oct; C66 discs | **Setup week, 3 pilots:** Tue 29 "Every Steam sale until March" (5.9) · Wed 30 "Sony and PlayStation discs: what we know" (5.4) · Sat 3 "47 days to GTA 6: not on PC at launch" (T-Count) |
| 2 | 5–11 Oct | Gears E-Day 6 Oct; WoW 12.1.5 ~6 Oct (prediction); C20 Release Congestion 7 Oct; DD2 Dark Arisen 9 Oct | Mon F01 "Gears, Dragon's Dogma and the end of the Autumn Sale" · Tue News "Gears of War: E-Day is out on Xbox and PC" · Tue F02 "44 days: $79.99, or $99.99 for Ultimate" · Wed Facts "[C20 headline number]: the most crowded release months of 2026" · Thu F02 "42 days: Fable moved to avoid it" (5.3) · Fri F07 "Shader stutter: why it hitches, then stops" · Sat F02 "40 days: single-player at launch" · Sun F18 "Games like Gears of War" |
| 3 | 12–18 Oct | C60 PC Fix Hub 12 Oct; Planet Zoo 2 13 Oct; C08 release-time tool + C22 studios tracker 14 Oct; 15 Oct Enshrouded 1.0 etc.; MW4 campaign early access 16 Oct | Mon F01 "Planet Zoo 2, Enshrouded 1.0, Castlevania" · Tue Explainer "Modern Warfare 4 on Switch 2: what we know" · Wed Controversy "Xbox's restructuring: what's confirmed" (5.4 outline) · Wed F02 "36 days: we built an unlock-time page" · Fri F07 "Windows 11 settings that matter for games" · Sat F02 "33 days: the collector's set doesn't include the game" · Sun F18 "Games like Control Resonant" |
| 4 | 19–25 Oct | Next Fest 19–26 Oct; C43 alerts + C45 Remind me 19 Oct; C12 vehicle guide 21 Oct; MW4 23 Oct | Mon F01 (week of 19 Oct; script in 07 §6) · Tue F23 "Next Fest: three demos we'd buy" · Wed F02 "29 days: [vehicle] and its real-world match" (only if C12 shipped, sourced) · Thu F23 "Next Fest day 4: three more" · Fri News "MW4 out today" (5.1) · Sat F02 "26 days: what's reported, not confirmed" · Sun F18 "Games like Modern Warfare 4" |
| 5 | 26 Oct–1 Nov | Scream V Fest 26 Oct–2 Nov; C61 Switch 2 hub 26 Oct; Minecraft Bedrock Switch 2 27 Oct; C21 Studio Atlas 28 Oct; Phantom Blade Zero 29 Oct; Halloween; C67 Season 2 1 Nov | Mon F01 "Phantom Blade Zero and Minecraft on Switch 2" · Tue Explainer "Is GTA 6 single-player only?" (5.2) · Wed Facts "[C21 finding]: where the world's game studios are" · Thu F02 "21 days: Vice City, officially" · Fri F07 fix of the week · Sat List "Five horror games for Scream Fest from our database" (C19) · Sun F18 "Games like Phantom Blade Zero" |
| 6 | 2–8 Nov | C62 Steam hub 2 Nov; WoW: Forever 4 Nov; C23 sequel gap 4 Nov; Stellar Blade Complete Ed. 5 Nov | Mon F01 "WoW: Forever and a quiet week before GTA" · Tue F02 "16 days: The Album, with Atlantic Records, same day" · Wed History "Why GTA 6 took 13 years" (5.7) · Wed Explainer "WoW: Forever is out. Check your character first" (Analyzer screen recording; only sourced facts: the 4 Nov date as reported, and Blizzard's warning to players about gold buying) · Fri F07 · Sat F02 "12 days: the pre-order bonus" · Sun F18 "Games like WoW, if you're coming back" |
| 7 | 9–15 Nov | C59 web push 9 Nov; C15 MMO hub 10 Nov; C24 $80 Tracker 11 Nov; Pikmin 4 + Metaphor Switch 2 12 Nov; C50 YouTube GTA pilot 12 Nov; **6-week review Sun 15 Nov** | Mon F01 "Switch 2 editions and the last week before GTA" · Tue Facts "[C24 finding]: how many 2026 games cost $80" · Thu Reply "Is GTA 6 on PC?" (5.11) · Thu F02 "7 days" · Fri F07 "PS5 and Xbox: settings to check before GTA 6" (only settings we verified) · Sat List "Every GTA in order in 40 seconds" (cut-down of C50; years verified per 07 §4.6) · Sun F18 "What to play while you wait for GTA 6" (5.6) |
| 8 | 16–22 Nov | **GTA VI launch week (C10)**; Auto-Battler Fest 16–23 Nov; C11 map tracker live 19 Nov | Mon "3 days: launch checklist" · Tue "What time GTA 6 unlocks where you live" (only once confirmed; otherwise "we'll post it the minute Rockstar does") · Wed "Tomorrow: pre-load and file size" (confirmed figures only) · Thu "GTA 6 is out: platforms, price, what's in each edition" · Fri "Your questions, answered" (replies) · Sat "Track your map progress" (C11 screen recording of our site) · Sun "First weekend: what's confirmed about Online now" |
| 9 | 23–29 Nov | C25 cost-per-hour 23 Nov; Thanksgiving 26 Nov; Black Friday 27 Nov; C31 price alerts | Mon F01 "Black Friday week" · Tue Hardware "What hardware costs now" (5.8) · Wed Facts "[C25 finding]: 2026's best value per hour" · Thu Explainer "How to tell if a Black Friday game deal is real" (price history on game pages) · Fri F07 · Sat F24 "GTA 6: launch verdict" (only if the review is published) · Sun F18 "Games like GTA 6, if you're on PC" |
| 10 | 30 Nov–6 Dec | Cyber Monday 30 Nov; C30 awards + C33 gift guide 1 Dec; 3 Dec Dawn of War IV, DQ Monsters, Xenoblade 3 Switch 2 Ed., Rayman Legends Retold; 4 Dec Monster Hunter Wilds Switch 2 | Mon F01 "Dawn of War IV, Xenoblade 3 and Monster Hunter on Switch 2" · Tue List "Switch 2 editions out this autumn" (Minecraft 27 Oct, Pikmin 4 and Metaphor 12 Nov, Xenoblade 3 3 Dec, Monster Hunter Wilds 4 Dec) · Wed "Vote in the TechPlay Community Awards" (C30 screen recording) · Thu F05 Hidden Gem · Fri F07 · Sat Reply · Sun F18 |
| 11 | 7–13 Dec | C26 achievement difficulty 8 Dec; **TGA 10 Dec**; Layton, Attack on Titan 3 10 Dec; Path of Exile 2 1.0 11 Dec (reported) | Mon F01 "TGA week, Layton and Path of Exile 2" · Tue Facts "[C26 finding]: the hardest genre for achievements" · Wed "How to follow The Game Awards" · Thu night Rapid reactions ×2–3 (5.10) · Fri "Every TGA world premiere with a date" (list) · Sat F07 · Sun F18 |
| 12 | 14–20 Dec | C28 Your 2026 in Games live 14 Dec; Winter Sale 17 Dec (C34) | Mon F01 · Mon Product "Your 2026 in games, across five platforms" (C28 screen recording) · Wed "Winter Sale starts Thursday: how to use your wishlist" · Thu "Five Winter Sale picks from our reviews" · Fri F07 · Sat Reply · Sun F18 |

**21–31 Dec (coda, 3 a week):** C70 "2027's most anticipated, by date" (Metroid Ravenous and Until Dawn 2 on 28 Jan, Metro 2039 4 Feb, Tomb Raider: Legacy of Atlantis 12 Feb, God of War Laufey 16 Feb, Persona 4 Revival 18 Feb, Fable 23 Feb, FF7 Revelation 8 Apr); "Every Steam sale in 2027" update; one Winter Sale picks list.

---

## 8. Production workflow

**Weekly batch**

| When | Who | What | Time (ESTIMATE) |
|---|---|---|---|
| Fri (previous week) | ED | Pick topics from §7 and the calendar; draft 6 scripts into the template doc with sources | 1.5 h |
| Mon 09:00 | SC | Record voice-overs for the week in one sitting (options A) | 0.5 h |
| Mon–Tue | SC | Assemble F01, F02 ×3, F07, F18 in CapCut from templates; export clean 1080×1920 files | 3.0 h |
| Wed | SC | Topical video (news, data, controversy) | 0.75 h |
| Daily | SC | Post natively to TikTok; upload the same file to Shorts, Reels and FB Reels with platform captions; pin UTM comment; answer comments | 0.75 h across the week |
| Event nights | SC + ED | Rapid reactions (TGA only this quarter) | 1.5 h, 10 Dec only |
| Monthly | DS | Refresh templates, fix anything that looks tired | 1 h |

**Time per video (ESTIMATE, from template, one editor)**

| Format | Script | Assembly | Total |
|---|---|---|---|
| F02 countdown (text only) | 5 min | 10–15 min | 15–20 min |
| Lists / F01 | 15 min | 30 min | 45 min |
| Explainer / F07 | 20 min | 40 min | 60 min |
| Facts / hardware | 10 min | 20 min | 30 min |
| Controversy (sourced) | 25 min | 30 min | 55 min |
| Verdict (after the review exists) | 10 min | 30 min | 40 min |
| Comment reply | 5 min | 15–20 min | 20–25 min |
| Rapid reaction | 5 min | 25 min | 30 min |
| Cross-posting to three more platforms | — | — | ~10 min per video |

**Weekly total: SC ~5 h, ED ~2 h, DS ~0.25 h** (1 h a month). Week 1: DS 3 h for templates, SC 1.5 h account setup.

**Checklist before any video posts**
1. Every fact on screen has a source line, and ED has checked it against the source on the day.
2. Footage is official, credited, and not modified beyond cropping and captions.
3. No number we cannot back (followers, members, readers).
4. Clean export without any platform watermark.
5. Caption has 3–5 specific hashtags and the pinned comment carries the UTM link.
6. If a synthetic voice or AI-generated visual was used: the platform label is applied (see §3).

---

## 9. Footage and rights rules

| Rule | Why |
|---|---|
| Use only official trailers, official gameplay uploads and press-kit screenshots, credited on screen ("Footage: [publisher]") and in the caption | Publishers upload fast and others re-upload; we avoid rights claims [R19 §4] |
| Never leaked, datamined or modded footage. For GTA VI, nothing from the leak stories | Rockstar published new modding guidelines on 21 Sep 2026 and is policing its IP; a 200 GB GTA V leak story ran 18 Sep [R17 §10] |
| No own gameplay capture of GTA VI, Nintendo, Blizzard or Bethesda games until SC has read that publisher's video policy and logged the answer | Those policies were not fetched [R19 §4, §6] |
| No clips from other creators' videos, even with credit, unless they have agreed in writing (C51) | Their work, not official media |
| TechPlay's own site (calendar, map, Analyzer, Backlog Advisor, Year in Review) may be screen-recorded freely | Our product |
| Map screens do not show or narrate the 1,058-location count as our own dataset until D-020 clears | gtadb attribution [spine §0] |
| Music only from the platform's licensed library for business accounts; no chart songs | Business account terms (UNVERIFIED detail; check in-app) |
| If a video gets a rights claim, it is taken down, logged, and the template rule updated; it is not disputed unless we are sure | Account health |

---

## 10. KPIs

TikTok analytics give per-video views, average watch time, percentage who watched the full video, and traffic sources (names of fields as seen in-app may differ; SC maps them in week 1). Site actions come from UTMs and events once C03 ships.

| KPI | Formula | Source | TARGET |
|---|---|---|---|
| Hook hold | viewers at 2 s ÷ video views (or TikTok's nearest retention point) | TikTok retention curve | Set on 8 Nov from weeks 2–6; the account median is the bar every format is measured against |
| Completion rate | full views ÷ views | TikTok analytics | same |
| Average watch share | average watch time ÷ video length | TikTok analytics | same |
| Follows per 1,000 views | new follows attributed to the video ÷ views × 1,000 | TikTok analytics | reported |
| Profile visits per 1,000 views | profile views ÷ views × 1,000 | TikTok analytics | reported |
| Site sessions per 1,000 views | sessions with `utm_source=tiktok` ÷ views × 1,000 | first-party collector (after D-008) | reported from the week of 19 Oct |
| Actions | `reminder_set` + `library_connected` + `registration_complete` + `newsletter_verified` attributed to TikTok + `discord_join` on the TikTok invite code | GA4 (after D-007), bot (after D-011) | reported |
| **Actions per posting hour** | TikTok actions ÷ hours spent posting and replying on TikTok (not production, which is shared) | above + SC time log | used in §11 |
| Same video, four platforms | views, watch share and actions for the same export on TikTok, Shorts, Reels, FB Reels | each platform | used in §11 |
| Rights claims | claims received | TikTok notices | 0 |

---

## 11. Six-week keep/kill decision

**When:** data from weeks 2–7 (5 Oct–15 Nov, the first six weeks at full cadence), reviewed by EIC and SC on **Sun 15 Nov**. The decision takes effect **Mon 23 Nov**, after GTA VI launch week; nothing is cut during launch week.

**Format level (applies to all four platforms, since the production is shared)**
- A format with at least four videos **stays** if its median completion rate or its median site sessions per 1,000 views is at or above the account median.
- A format **goes** if it is below the account median on both for its last four videos. Its slot goes to the best-performing format's next variant.
- F02 countdown ends on 19 Nov regardless; its Tuesday, Thursday and Saturday slots pass to F10, F05 and comment replies unless the review says otherwise.

**Platform level (native TikTok posting)**
- **Keep TikTok** if both: (1) median views per video in weeks 6–7 are higher than in weeks 2–3; and (2) TikTok's actions per posting hour are at least half of the best of Shorts, Reels and FB Reels for the same videos.
- **Strong keep** (move an extra hour a week to TikTok replies and comment-reply videos) if any video reached ten times the account median views and at least one other video in the next two weeks reached three times.
- **Kill native TikTok** if neither condition holds, or if two rights claims arrive in six weeks. Killing means: stop uploading, keep the handle, pin one video pointing to the site, and give the 10 minutes a video to whichever platform won. The production (C49) continues for Shorts and Reels.
- **Kill the whole vertical production** only if all four platforms together produce fewer actions per production hour than the Instagram carousels do per fill hour for the same six weeks. That decision is EIC's and is logged with the numbers.

Readability caveat: until D-007 and D-008 ship (target 16 Oct), weeks 2–3 have no site-action data. If they slip past 23 Oct, the platform-level rule uses TikTok's own profile visits and link-in-bio clicks in place of site actions, and says so in the review.

---

## 12. What not to do

- No on-camera presenter formats (reaction, hands-on, stunts) [R19 §1].
- No re-uploads of full trailers; we cut short, credited excerpts to illustrate a sourced point.
- No "N things you missed" detail-spotting videos on GTA VI trailers: the format depends on heavy use of Rockstar footage and IGN and creators already own it [R19 §1].
- No giveaways on TikTok this quarter; sweepstakes rules and disclosure were only partly researched [R16 §2.15].
- No paid Spark Ads before C03 and a video that already performs organically [R16 §2.7]; any paid test is part of the paid plan, not this one.
- No engagement bait ("comment 1 if…"), no fake urgency, no "!!!", no follower counts.
- No trending sounds that are not in the business library.
- No political takes on layoffs; no naming or blaming individual staff.
- No unlock times, file sizes or performance claims for GTA VI that Rockstar or a store has not stated.

---

## Dependencies and open questions

**Dependencies**
- SC claims `@techplay.gg` in week 1 (R02: not found on 27 Sep).
- DS: 3 hours in week 1 for CapCut templates, on top of Instagram (5 h) and Facebook (1 h) masters. That is 9 of DS's 10 hours; other channels' DS needs that week must be reconciled in the master plan.
- C03 / D-007 / D-008 / D-009 for UTM capture and events; D-011 for Discord joins by invite code.
- C08 / D-018 unlock-time page (14 Oct) for the bio link and several F02 CTAs.
- C12 vehicle data entry (21 Oct) before any "real-world match" video; D-020 before map counts appear.
- C20–C26 data pieces on their spine dates; the facts videos in §7 use their published findings only.
- C11 map tracker (19 Nov), C28 Year in Review (14 Dec), C30 awards (1 Dec), C31 / D-027 price alerts (20 Nov) for product screen recordings.
- F24 Verdict videos only after C52 reviews are published.
- DEV: set `tiktok_url` in site settings after six videos are live.

**Open questions**
- UNVERIFIED and to be checked by SC in week 1: TikTok's AI-generated content labelling rules, bio link eligibility, business-account music limits, maximum video length, and the same points for Shorts and Reels [R19 §6].
- UNVERIFIED: Rockstar, Nintendo, Blizzard and Bethesda video-content policies [R19 §4]. Until read, their games appear only in official footage.
- Conflict noted: R07 rated TikTok EXPERIMENTAL and recommended one short-video platform chosen by test; the spine makes vertical video SECONDARY with one production for four platforms. This plan does both: the production is committed, native TikTok is tested and can be cut on 23 Nov.
- Conflict noted: the spine lists F02 on "Shorts 3×/wk" and C49 "from 5 Oct"; this plan posts two pilots in week 1 (29–30 Sep) and one F02 pilot (3 Oct) to test templates before the full cadence starts on 5 Oct.
- Who voices the videos? Option A assumes ED or SC is willing to be the recurring voice. If neither is, option B (text only) covers every format except the controversy and history explainers, which then run as text with slower pacing.
- SC hours: this plan assumes ~5 SC hours a week for vertical video, alongside ~4 for Instagram and ~4.5 for Facebook. Together that is about 13.5 of SC's 25 hours before Discord, Reddit, the newsletter and X. The master plan must confirm or cut; the first cut is Facebook Groups, the second is the Sunday F18 video.
