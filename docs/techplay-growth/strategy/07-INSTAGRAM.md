# 07 — Instagram: carousels, Stories, Reels and the link in bio

Status: Phase 2 plan — 27 Sep 2026

- **Priority: SECONDARY** for carousels and Stories; Reels belong to the one vertical-video production (C49, see `08-TIKTOK.md`) [spine §12]. The account `instagram.com/techplay.gg` exists and is linked from the footer, but its followers and history are unknown (login wall, HTTP 429) [R02 §8.2]. SC records the baseline on 28 Sep.
- **Instagram's job: turn TechPlay's data into things people save and come back to.** Release lists, where-to-play answers, series orders and a sourced GTA VI ledger suit carousels [R07, R19]. The measurable action is a reminder set, a library connected or a Discord join, not a like.
- **Five recurring carousels carry the week:** F01 Out This Week (Mon), F03 Confirmed or Rumour / F05 Hidden Gem (Thu, alternating), F09 In Order or F08 Where Can I Play It (Sat). F04 The Number runs as a single image on Tuesdays. Thirteen carousels are written out slide by slide below.
- **Stories are the daily habit:** the F02 GTA VI countdown from 52 days (Mon 28 Sep) to launch day (Thu 19 Nov), with a poll on Wednesdays, a quiz on Thursdays, a Q&A box on Fridays, and a link sticker to a release page with UTMs on every release day.
- **Two event plans:** GTA VI launch week (C10, 16–22 Nov) and The Game Awards (F20, Thu 10 Dec).
- **Captions are short and sourced; three to five specific hashtags; no generic hashtag walls.** Hashtag effects were not researched, so this is a house rule, not a growth claim.
- **No Broadcast Channel this quarter.** Discord is the one-to-many community channel [spine §12]. Revisit in January against the criteria in §10.
- **Creator Collabs from 20 Oct under C51,** trading data and tools for credit, never money this quarter, and always disclosed.
- **Budget ESTIMATE: SC 4 h, DS 1 h, ED 0.5 h a week** after a one-off DS template build of 5 hours in week 1.

---

## 1. Role, baseline and what success looks like

| Item | Plan |
|---|---|
| Class | SECONDARY (carousels, Stories). R07 rated Instagram EXPERIMENTAL; the spine upgrades it because carousels carry TechPlay's data well. This plan follows the spine. |
| Audience segments | S1 Release Planners, S4 GTA VI Waiters, S6 Switch 2 Owners, S2 Collectors; S3 PC Tinkerers via F07 Reels |
| Baseline (28 Sep, SC) | Followers, posts, last 90 days' reach per post if any. If the account is empty, the baseline is zero and every target is set on 26 Oct from weeks 1–4. |
| Primary actions | `reminder_set`, `library_connected`, `discord_join` on the Instagram invite code, `newsletter_verified`, `registration_complete` with from=instagram |
| Secondary signals | saves ÷ reach and shares ÷ reach per carousel; sticker taps per Story; profile visits → bio link sessions |
| Review date | Sun 22 Nov, with the Facebook and TikTok reviews |

---

## 2. Profile setup (week of 28 Sep, SC 1 h)

**Name:** TechPlay
**Bio (148 characters):**
```
Gaming, on the record.
What's out, where to play it, what to play next.
333,000+ games · free library for Steam, PlayStation, Xbox, GOG, Epic.
Sarajevo.
```
**Bio links.** Instagram allows several links in the bio (the exact limit was not verified; plan for five and drop from the bottom). Every link has its own `utm_content` so the collector can tell them apart once D-008 ships.

| Slot | Label | Target (TO 19 Nov) | After 19 Nov |
|---|---|---|---|
| 1 | GTA VI unlock time + reminder | `/gta6/release-time?utm_source=instagram&utm_medium=organic-social&utm_campaign=c08-gta6-release-time&utm_content=bio-link1` (until 14 Oct: `/gta6/everything-we-know` with `c07-gta6-ledger`) | 20 Nov–1 Dec: price alerts (`c31-bf-price-alerts`); 14–31 Dec: Your 2026 in Games (`c28-year-in-review`) |
| 2 | This week's releases | `/calendar?utm_source=instagram&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=bio-link2` | same |
| 3 | Discord | Instagram-only invite code from the C36 sheet; until it exists `https://discord.gg/wPQG9gUMXH` | same |
| 4 | Newsletter | `/newsletter?utm_source=instagram&utm_medium=organic-social&utm_campaign=c40-save-file&utm_content=bio-link4` — only once D-012 ships; until then, omit | same |
| 5 | Start your library | `/register?from=instagram&utm_source=instagram&utm_medium=organic-social&utm_campaign=c44-registration&utm_content=bio-link5` | same |

**Story Highlights (covers from the DS master):** GTA VI · Out This Week · Fix It · Verdicts · Ask Us. Each Highlight keeps the last four weeks; older frames are removed so nothing stale (a passed date, a closed giveaway) stays visible.

**Remove** anything on the account that claims follower, member or reader numbers (C01).

---

## 3. Design system (DS, week 1: 5 hours one-off)

| Master | Size | Slides | Elements |
|---|---|---|---|
| Carousel A: list (F01, F18, F05) | 1080×1350 | 6–8 | Cover with week or theme; one item per slide: key art top 60%, name, date, platforms, one line; last slide CTA |
| Carousel B: status ledger (F03) | 1080×1350 | 8–10 | Status tag top-left in three fixed colours: CONFIRMED / REPORTED / RUMOUR (plus grey NOT ANNOUNCED); claim in large type; source + date footer |
| Carousel C: platform grid (F08) | 1080×1350 | 6–8 | One platform per slide, "Yes / Not at launch / Not announced" in large type, one line of detail |
| Carousel D: timeline (F09) | 1080×1350 | 8–10 | Number, title, year, one line on where it sits in the story; "verify" check done before export |
| Carousel E: Verdict (F24) | 1080×1350 | 5 | Score, verdict line, what we played, what we have not tested, reviewer name |
| Single: The Number (F04) | 1080×1350 | 1 | One number, one line, source |
| Story frames (F02, poll, quiz, Q&A, reminder) | 1080×1920 | 3 per set | Top and bottom 250 px kept clear for the interface |

**Rules on every slide:** a source line where a fact appears; official art only, credited in small type ("Image: Rockstar Games"); Buffy only as a small corner mark on F04 and F06 [R13 §7]; no numbers we cannot back [spine §0]; one emoji at most per post, and none on slides.

---

## 4. Carousels, slide by slide

Each carousel is filled by SC from the master in 30–45 minutes (ESTIMATE). Facts come from R05, R06 and R17 unless the slide says to pull live data. `[ ]` means fill at build time.

### 4.1 F01 Out This Week — week of 19 Oct (w43), Mon 19 Oct (C04, C18, C17)

| Slide | Copy |
|---|---|
| 1 (cover) | **Out this week** · 19–25 October · Next Fest demos, PS Plus, and the first Call of Duty on Switch 2 |
| 2 | **All week: Steam Next Fest** · 19–26 Oct · Free demos on Steam. We are trying three a day and writing down what we'd buy. |
| 3 | **Tue 20 Oct: PS Plus Extra and Premium** · October's games arrive. Mycopunk is day one (reported). |
| 4 | **Thu 22 Oct: Final Fantasy Resonance** · [platforms from /calendar/[slug]] |
| 5 | **Thu 22 Oct: Nintendo Switch Sports Resort** · [platforms] · and **Once Human: Isles of Abyss** · [platforms] |
| 6 | **Fri 23 Oct: Call of Duty: Modern Warfare 4** · PS5, Xbox Series X|S, PC, Switch 2 · Not day one on Game Pass · Campaign early access for digital pre-orders since 16 Oct |
| 7 | **Next week** · Steam Scream V Fest starts 26 Oct · Minecraft Bedrock on Switch 2, 27 Oct · Phantom Blade Zero, 29 Oct |
| 8 (CTA) | **Tap Remind me on any game at techplay.gg/calendar.** We tell you on release day, by email or Discord. · Link in bio: This week's releases |

**Caption**
```
Out this week, 19–25 October: Steam Next Fest all week, PS Plus Extra and Premium on Tuesday, and Modern Warfare 4 on Friday, the first Call of Duty on a Nintendo platform since Ghosts.
Save this for the week. Every date is on techplay.gg/calendar, where you can set a reminder for any game.
#SteamNextFest #ModernWarfare4 #PSPlus #NintendoSwitch2
```
Release-day reminders by email and Discord depend on C43 (live 19 Oct) and the guest "Remind me" on C45 (19 Oct). If either slips, slide 8 says "set a reminder in your TechPlay library" instead.

### 4.2 F03 Confirmed or Rumour? GTA VI — Thu 1 Oct, 49 days (C07 launch)

| Slide | Tag | Copy | Source line |
|---|---|---|---|
| 1 | — | **GTA VI: confirmed or rumour?** Week of 28 September · 49 days to go | — |
| 2 | CONFIRMED | **19 November 2026, PS5 and Xbox Series X|S** | Rockstar Newswire; Xbox store |
| 3 | CONFIRMED | **$79.99. Ultimate Edition $99.99.** "A single-player experience" at launch. | IGN, 24 Jun 2026 |
| 4 | CONFIRMED | **No PC version at launch.** No PC date announced. | IGN on Take-Two's CEO, 4 May 2026 |
| 5 | CONFIRMED | **The ~$400 Vice City collector's set does not include the game.** | Rockstar Newswire; GameSpot |
| 6 | REPORTED | **30 fps on consoles at launch, no performance mode promised.** Rockstar has not said. | Tom's Hardware, 29 Aug 2026 |
| 7 | REPORTED | **A limited-edition GTA VI DualSense.** | Game Informer, 3 Sep 2026 |
| 8 | RUMOUR | **GTA Online for GTA VI in 2027.** Not announced. | The Mirror, 18 Sep 2026 |
| 9 | NOT ANNOUNCED | **A Switch 2 version.** No announcement; ex-developer commentary says don't expect one. | GamesRadar+, Wccftech, 25 Sep 2026 |
| 10 | — | **Every line, with its source, updated each Thursday.** · techplay.gg/gta6/everything-we-know · Link in bio | — |

**Caption**
```
Where GTA VI stands, 49 days out. Four things Rockstar or Take-Two have confirmed, two that are reported but not confirmed, one rumour, and one thing nobody has announced.
We update this every Thursday until launch. If a line changes, we say what changed and when.
#GTA6 #GTAVI #RockstarGames
```
Each Thursday the slides are re-checked by ED against the site ledger; anything moved between tags gets a "Changed this week" sticker on its slide.

### 4.3 F08 Where Can I Play It? — GTA VI, Sat 10 Oct, 40 days

| Slide | Copy |
|---|---|
| 1 | **Where can I play GTA VI?** · Launch: Thursday 19 November |
| 2 | **PS5** · Yes, at launch. |
| 3 | **Xbox Series X|S** · Yes, at launch. |
| 4 | **PC** · Not at launch. No date announced. |
| 5 | **Switch 2** · Not announced. |
| 6 | **PS4 and Xbox One** · Not on the platform list. |
| 7 | **Price** · $79.99 · Ultimate Edition $99.99 · Pre-order bonus: Vintage Vice City Pack |
| 8 | **Get told when it unlocks where you live.** · Unlock-time page and reminder from 14 Oct · Link in bio |

**Caption**
```
GTA VI is PS5 and Xbox Series X|S only at launch on 19 November. No PC version at launch, and nothing announced for Switch 2.
Sources: Rockstar Newswire, the Xbox store, IGN (24 Jun and 4 May 2026).
#GTA6 #PS5 #XboxSeriesX
```

### 4.4 F08 Where Can I Play It? — Modern Warfare 4, Tue 13 Oct

| Slide | Copy |
|---|---|
| 1 | **Modern Warfare 4: where can I play it?** · Out Friday 23 October |
| 2 | **PS5** · Yes. |
| 3 | **Xbox Series X|S** · Yes. Not a day-one Game Pass release. |
| 4 | **PC** · Yes. Requirements on our MW4 page. |
| 5 | **Switch 2** · Yes. The first Call of Duty on a Nintendo platform since Ghosts. |
| 6 | **Early access** · Campaign from 16 October for digital pre-orders. |
| 7 | **Link in bio: This week's releases** · Set a reminder for 23 October. |

**Caption**
```
Modern Warfare 4 is on PS5, Xbox Series X|S, PC and Switch 2 from 23 October. It is not day one on Game Pass. Digital pre-orders get the campaign from 16 October.
#ModernWarfare4 #CallofDuty #NintendoSwitch2
```

### 4.5 F09 In Order — Gears of War, Sat 3 Oct (C63, C16)

Build rule: every title and year is checked against `/games/series/[gears-slug]` before export, and the story order against the publisher's own timeline. If sources disagree, ED resolves it before export; titles and years below are from editorial knowledge, not from the research files, so this check is mandatory.

| Slide | Copy |
|---|---|
| 1 | **Gears of War in order** · before E-Day on Tuesday 6 October |
| 2 | **Release order** · Gears of War (2006) · Gears of War 2 (2008) · Gears of War 3 (2011) · Gears of War: Judgment (2013) · Gears of War 4 (2016) · Gears 5 (2019) · Gears Tactics (2020) · Gears of War: E-Day (2026) |
| 3 | **Story order starts with E-Day.** It is set on Emergence Day, years before the first game. |
| 4 | **Then the two prequels: Judgment and Gears Tactics** · [order between them as the publisher's timeline gives it] |
| 5 | **Then Gears of War 1, 2 and 3**, the original trilogy. |
| 6 | **Then Gears of War 4 and Gears 5**, a generation later. |
| 7 | **Remasters and collections** · listed on our series page, not counted here. |
| 8 | **New to the series?** Release order or start with E-Day. Both work. |
| 9 | **Add the whole series to your library in one tap** · techplay.gg/games/series/[gears-slug] · Link in bio |

**Caption**
```
Gears of War in order, release and story, before E-Day comes out on Tuesday 6 October on Xbox and PC.
Save it for the weekend. Our series page lets you add every entry to your library at once.
#GearsofWar #GearsofWarEDay #Xbox
```

### 4.6 F09 In Order — Grand Theft Auto, Sat 14 Nov, 5 days (C63, C50 tie-in)

Build rule as 4.5, against `/games/series/[gta-slug]`. Only 1997 (first game) and 2026 (GTA VI) come from the research files; every other year is checked.

| Slide | Copy |
|---|---|
| 1 | **Every GTA in order** · before GTA VI on Thursday |
| 2 | **Grand Theft Auto (1997)** · Where it began. |
| 3 | **GTA 2 (1999)** |
| 4 | **GTA III (2001)** |
| 5 | **Vice City (2002)** · The city GTA VI returns to. |
| 6 | **San Andreas (2004)** |
| 7 | **GTA IV (2008)** |
| 8 | **GTA V (2013)** · GTA V Enhanced is in Steam's weekly top 25 most-played, eight weeks before VI. |
| 9 | **GTA VI (19 November 2026)** · PS5 and Xbox Series X|S. |
| 10 | **Handheld and spin-off entries are on our series page.** · techplay.gg/games/series/[gta-slug] · Link in bio |

**Caption**
```
Every main GTA in release order, from 1997 to Thursday. The stories stand alone, so you do not need any of them to start VI.
Spin-offs and handheld entries are on our series page.
#GTA6 #GrandTheftAuto #ViceCity
```
The Steam fact is from the week ending 26 Sep [R05 §6]; if GTA V Enhanced is no longer in the top 25 on the day, the slide drops that line.

### 4.7 Hardware carousel — "What it costs now", Tue 24 Nov (C31 run-up to Black Friday)

| Slide | Copy | Source line |
|---|---|---|
| 1 | **What gaming hardware costs now** · Before Black Friday on 27 November | — |
| 2 | **Switch 2: $499.99** · since 1 September 2026 | Nintendo, via R05 |
| 3 | **Xbox Series X: $649.99** · since 1 August 2026 | Microsoft, via R05 |
| 4 | **PS5: price rose on 2 April 2026** · [current US price from PlayStation Direct on the day] | Sony |
| 5 | **Steam Deck OLED: $789 / $949** · since 27 May 2026 | Valve |
| 6 | **Steam Frame VR: $1,059 / $1,299** · launched 18 September 2026 | Valve |
| 7 | **If a Black Friday deal quotes a "was" price,** check it against these. | — |
| 8 | **Follow the games you want and we'll tell you when the price drops.** · Price alerts from 20 Nov · Link in bio | — |

**Caption**
```
Hardware went up in 2026, not down. Switch 2 is $499.99, Xbox Series X $649.99, Steam Deck OLED from $789. Save this before you read any Black Friday deal post.
#BlackFriday #NintendoSwitch2 #SteamDeck
```
Slide 8 depends on D-027 price alerts (C31, from 20 Nov). If they are not live, slide 8 points to the Deal Radar article instead.

### 4.8 Steam's Q4 calendar — Tue 29 Sep (C05, F04 slot)

| Slide | Copy |
|---|---|
| 1 | **Every Steam sale and fest to March** · Save this. |
| 2 | **Autumn Sale** · 1–8 October |
| 3 | **Cooking Fest** · 12–19 October |
| 4 | **Next Fest** · 19–26 October · free demos |
| 5 | **Scream V Fest** · 26 October–2 November |
| 6 | **Auto-Battler RPG Fest** · 16–23 November |
| 7 | **Winter Sale** · 17 December–4 January |
| 8 | **Next Fest (February)** · from 22 February 2027 · **Spring Sale** · 18–25 March 2027 |
| 9 | **Connect Steam to TechPlay once** and your library fills itself. Free. · Link in bio: Start your library |

Source footer on slides 2–8: "Steamworks upcoming events, fetched 27 Sep 2026."

**Caption**
```
Every Steam sale and fest date from now to March, straight from Valve's own event calendar. No Steam sale falls on Black Friday this year; the Winter Sale starts 17 December.
#Steam #SteamSale #SteamNextFest
```
(The "no Steam sale on Black Friday" point is from R05's Black Friday row: "note no Steam sale near BF".)

### 4.9 F17 Studio Watch — "Xbox's restructuring: what we know", Wed 14 Oct (C22 launch)

Neutral. No adjectives about people or companies; every slide is sourced.

| Slide | Copy | Source line |
|---|---|---|
| 1 | **Xbox's restructuring: what we know** · as of 14 October | — |
| 2 | **268 more layoffs** confirmed in September 2026 | Eurogamer, week of 21 Sep |
| 3 | **Halo Studios** · effectively closed | Eurogamer, GamesRadar+ |
| 4 | **Ninja Theory** · heading to closure | Eurogamer |
| 5 | **Obsidian** · moving to Bethesda | Eurogamer |
| 6 | **What happens to their games?** Each studio's released and announced games are listed on its studio page. | TechPlay studios database |
| 7 | **We keep a running list of studios closed in 2026, updated weekly.** · Link in bio | — |

**Caption**
```
What has actually been confirmed about Xbox's restructuring so far, with sources. We update the studio tracker every week, and each studio page lists the games it made.
#Xbox #GameIndustry
```
Before export, ED re-reads each claim against the current source; anything that has changed since 27 Sep is updated or cut. Bio link 1 carries `c22-studios-closed-2026` on the day.

### 4.10 The Game Awards — "How to follow it", Tue 8 Dec (F20, C29)

| Slide | Copy |
|---|---|
| 1 | **The Game Awards 2026** · Thursday 10 December · Peacock Theater, Los Angeles |
| 2 | **Start time** · [from thegameawards.com, converted to CET and ET] |
| 3 | **Our coverage** · Live thread on X · Watch party in Discord · Live blog on techplay.gg |
| 4 | **Prediction league** · Pick your winners before the show; results on the leaderboard afterwards. Entries close [time] on 10 December. |
| 5 | **After the show** · Every reveal linked to its game page, so you can add it to your calendar in one tap. |
| 6 | **Join the watch party** · Link in bio: Discord |

**Caption**
```
The Game Awards are on Thursday 10 December. We'll be in the Discord watch party and on the live blog, and every reveal goes onto its game page the same night so you can set a reminder.
Prediction league entries close before the show.
#TheGameAwards #TGA2026
```
Slide 4 runs only if C29 / D-026 shipped; otherwise it becomes a Story poll "Game of the Year: who takes it?" with the nominees.

### 4.11 F05 Hidden Gem Thursday (template; C64 from 1 Oct)

The game is pulled from the `/games/hidden-gems` module on the day: rating 8 or above, at least 3 votes, least-known first (repo: `GameController::hiddenGems`). ED plays or checks it before it is featured; a game nobody on the team knows is not posted.

| Slide | Copy |
|---|---|
| 1 | **Hidden Gem Thursday** · [Game] ([year]) |
| 2 | **What it is** · [genre] · [platforms] · [one sentence in our words, not the store blurb] |
| 3 | **Why it's here** · Rated [x] on our database from a small number of players, so few people have found it. |
| 4 | **Play it if you liked** · [two games from similar-games data] |
| 5 | **How long** · [time to beat if we hold it; otherwise omit this slide] |
| 6 | **Add it to your library** · techplay.gg/games/[slug] · Link in bio |

**Caption skeleton**
```
Hidden Gem Thursday: [Game], a [genre] from [year] that [one specific thing]. On [platforms].
Found one we missed? Reply with it and we'll look.
#HiddenGem #[GenreTag] #[PlatformTag]
```
Do not print the vote count as "few people played it"; the rating count is how many rated it on our database, not how many played it.

### 4.12 F18 Games Like… (template; Sun, from 4 Oct)

Picks come from the similar-games data for the anchor game, then an editor removes any pick they would not personally recommend. Anchor games follow the calendar: Gears of War: E-Day (4 Oct), Control Resonant (11 Oct), Modern Warfare 4 (25 Oct), Phantom Blade Zero (1 Nov), GTA VI (15 Nov), Path of Exile 2 (13 Dec).

| Slide | Copy |
|---|---|
| 1 | **Games like [anchor]** · [one-line reason people are asking] |
| 2–6 | **[Game]** · [platforms] · [one line: what it shares with the anchor, specifically] |
| 7 | **Your library knows what you've played.** Connect Steam, PlayStation or Xbox and Backlog Advisor picks from what you already own. · Link in bio |

**Filled example, Sun 15 Nov: "Games like GTA VI to play this week"**
- Slide 1: **Games like GTA VI** · four days to go, and what to play until Thursday
- Slide 2: **GTA V Enhanced** · [platforms from its game page] · The obvious one, and in Steam's weekly top 25 in September.
- Slides 3–6: [four picks from similar-games data for `/games/grand-theft-auto-vi`, each with one line]
- Slide 7: as template.

### 4.13 F24 Verdict (template; C52 from 6 Oct)

| Slide | Copy |
|---|---|
| 1 | **Verdict: [Game]** · [score]/10 |
| 2 | "[One-sentence verdict from the review.]" — [Reviewer] |
| 3 | **Played** · [platform], [n] hours, [what we finished] |
| 4 | **Not tested yet** · [modes or platforms]. The review grows as we play. |
| 5 | **Full review and where to buy** · techplay.gg/reviews/[slug] · Link in bio |

Score and verdict line come only from the published review. Scores follow `/rating-system`.

---

## 5. Stories

### 5.1 F02 GTA VI countdown (C06), daily 28 Sep–19 Nov

**Three frames a day, 1080×1920:**

| Frame | Content |
|---|---|
| 1 | "**[n] days to Vice City**" on official Rockstar art (credited). Same position every day so the number reads at a glance. |
| 2 | One fact from the rotation below, with its status tag (CONFIRMED / REPORTED) and source line. |
| 3 | The action for that day: poll, quiz, question box, or a link sticker. |

**Weekly rotation**

| Day | Frame 2 fact type | Frame 3 action |
|---|---|---|
| Mon | Platform, date or price fact | Link sticker "What time it unlocks" (`/gta6/release-time` from 14 Oct; `/gta6/everything-we-know` before) |
| Tue | A character from `/gta6/characters` (name + one confirmed line; Jason and Lucia Caminos first) | Link sticker to that character page |
| Wed | Edition or bonus fact | Poll (F12 when GTA-themed) |
| Thu | This week's Confirmed or Rumour change | Quiz sticker |
| Fri | A vehicle from `/gta6/vehicles` (official image and name only; no class or real-world match until C12 on 21 Oct) | Question box: "What do you want answered before launch?" |
| Sat | A place Rockstar has named (Vice City, Leonida) with an official image | Link sticker to `/gta6` |
| Sun | Recap: "[n] days. This week: [three short facts]" | Link sticker to the game page `/games/grand-theft-auto-vi` (after D-005) with "Remind me" |

Map location names and counts are not used as frame content until D-020 clears attribution [spine §0].

**Fact bank for frame 2 (all from R17 §2; ED checks each before its first use)**

| # | Fact | Status | Source |
|---|---|---|---|
| 1 | 19 November 2026 on PS5 and Xbox Series X|S | CONFIRMED | Rockstar Newswire; Xbox store |
| 2 | It was dated Fall 2025, then 26 May 2026, before 19 November | CONFIRMED | Rockstar Newswire |
| 3 | $79.99; Ultimate Edition $99.99 | CONFIRMED | IGN, 24 Jun 2026 |
| 4 | "A single-player experience" at launch | CONFIRMED | IGN, 24 Jun 2026 |
| 5 | No PC version at launch | CONFIRMED | IGN, 4 May 2026 |
| 6 | Pre-orders opened 25 June 2026 | CONFIRMED | Rockstar Newswire |
| 7 | Pre-order bonus: Vintage Vice City Pack | CONFIRMED | Rockstar pre-order page |
| 8 | "An Extended Look" gameplay video was captured on PS5 | CONFIRMED | Rockstar Newswire |
| 9 | GTA VI: The Album, with Atlantic Records, also out 19 November | CONFIRMED | Rockstar Newswire |
| 10 | The Goodtime State – Vice City Collection (~$400) does not include the game | CONFIRMED | Rockstar Newswire; GameSpot |
| 11 | "A very big map", bigger than RDR2's | CONFIRMED (quote) | IGN, 27 Aug 2026 |
| 12 | A limited-edition DualSense | REPORTED | Game Informer, 3 Sep 2026 |
| 13 | 30 fps on consoles at launch | REPORTED | Tom's Hardware, 29 Aug 2026 |
| 14 | New modding guidelines: no story expansions, ports or map mashups | REPORTED | Eurogamer, RPS, 21 Sep 2026 |
| 15 | Game Informer cover story | CONFIRMED (published) | Game Informer, 26 Sep 2026 |

**Filled example, Wed 30 Sep (50 days)**
- Frame 1: "50 days to Vice City"
- Frame 2: CONFIRMED · "The ~$400 Vice City collector's set does not include the game." · Rockstar Newswire; GameSpot
- Frame 3: Poll: "Would you buy a collector's set without the game?" · "Yes, for the stuff" / "No"

**Filled example, Thu 22 Oct (28 days)**
- Frame 1: "28 days to Vice City"
- Frame 2: REPORTED · "30 fps on consoles at launch, no performance mode promised. Rockstar hasn't said." · Tom's Hardware, 29 Aug 2026
- Frame 3: Quiz: "Which of these has Rockstar confirmed?" · A) PC at launch B) $79.99 price (correct) C) Online at launch

**Link sticker UTM:** `utm_source=instagram&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-day[n]-story` (for example `f02-day28-story`).

### 5.2 Poll of the Week (F12, C39), Wednesdays

Frame 1: context fact with source. Frame 2: poll sticker. Results frame the following Wednesday, combined with Discord and forum votes as a percentage only when total votes are shown alongside.

| Date | Question | Options |
|---|---|---|
| Wed 30 Sep | Collector's set without the game? | Yes, for the stuff / No |
| Wed 7 Oct | Your last three PS5 games were… | All discs / All digital or a mix |
| Wed 14 Oct | Modern Warfare 4: where are you playing? | Console / PC or Switch 2 |
| Wed 21 Oct | Next Fest: demos before buying? | Always / Rarely |
| Wed 28 Oct | GTA VI: Standard or Ultimate? | $79.99 / $99.99 |
| Wed 4 Nov | Would you play GTA VI at 30 fps? | Yes / Wait for a patch |
| Wed 11 Nov | $80 games: the new normal? | Fine / Too much |
| Wed 18 Nov | GTA VI tomorrow: pre-load or wait? | Pre-loading / Buying later |
| Wed 25 Nov | Black Friday: buying hardware or games? | Hardware / Games |
| Wed 2 Dec | Game of the Year before TGA | [two strongest nominees] |
| Wed 9 Dec | TGA: what matters more? | Winners / Reveals |
| Wed 16 Dec | Winter Sale: wishlist or impulse? | Wishlist / Impulse |

### 5.3 Quiz stickers (Thursdays, with F03)

The quiz always has one answer that is a confirmed fact and two that are common misconceptions from the ledger (rumours or things not announced). The answer frame names the source.

### 5.4 Question box (Fridays)

"Ask us anything about [GTA VI launch / Modern Warfare 4 on Switch 2 / Next Fest]." Answers go out as Story frames the following Monday, three at a time, each with a source or "we don't know yet". No answer is invented to fill a frame. Good questions become F03 lines or `09`-style evergreen pages.

### 5.5 Release reminders (every release day on the F01 list)

Frame: key art, "Out today: [Game] · [platforms]". Link sticker: `/calendar/[slug]` for upcoming releases, or `/games/[slug]` once released, with `utm_campaign=c04-out-this-week&utm_content=release-[slug]-story`. On launch mornings for GTA VI (19 Nov) and Modern Warfare 4 (23 Oct), the link goes to the game page with the "Remind me" or "Add to library" action.

---

## 6. Reels (from the C49 production)

Reels are the same vertical exports as TikTok and Shorts (see `08-TIKTOK.md` for production and timing). Instagram-specific notes:

| Reel | Day | Cover frame (for the grid) | Caption first line |
|---|---|---|---|
| F01 Out This Week | Mon | "Out this week · [dates]" | "[Biggest release] on [day], plus [n] more worth knowing about." |
| F02 GTA VI countdown short | Tue, Thu, Sat | "[n] days" | "[n] days to GTA VI. Today: [fact]." |
| F07 Fix It Friday | Fri | "Fix: [problem]" | "If [symptom], it is probably [cause]. The full fix is on our site." |
| F18 Games Like | Sun | "Games like [anchor]" | "Four games to play if [anchor] is your thing." |

**Script examples (full scripts and timing are in 08):**

**Reel A — F01, Mon 19 Oct (voice-over or on-screen text)**
```
0–2s   "Five things out this week. One is Call of Duty on Switch 2."
2–7s   "Monday: Steam Next Fest, free demos all week."
7–15s  "Tuesday: PS Plus Extra and Premium. Thursday: Final Fantasy Resonance and Switch Sports Resort."
15–25s "Friday: Modern Warfare 4 on PS5, Xbox, PC and Switch 2. Not on Game Pass day one."
25–30s "Every date's on techplay.gg/calendar. Set a reminder there."
```

**Reel B — F02, Tue 29 Sep (51 days)**
```
0–2s   "GTA VI in 51 days. It's not coming to PC at launch."
2–7s   "Rockstar's platforms for 19 November: PS5 and Xbox Series X|S."
7–15s  "Take-Two's CEO addressed PC in May. No PC date has been announced since."
15–25s "Switch 2? Nothing announced either."
25–30s "We keep the full list of what's confirmed, with sources. Link in bio."
```

**Reel C — F07, Fri 16 Oct (shader stutter)**
```
0–2s   "Your game stutters, then smooths out? Probably shaders."
2–7s   "Games compile shaders for your graphics card, sometimes while you play."
7–15s  "That's why it hitches in new areas and not the second time through."
15–25s "Our guide covers how to tell it apart from other stutter, and what actually helps per game."
25–30s "Fix It Friday. Link in bio."
```

---

## 7. Event coverage

### 7.1 GTA VI launch week (C10), Mon 16 – Sun 22 Nov

| Day | Feed | Stories | Reel |
|---|---|---|---|
| Mon 16 | F01 Out This Week led by GTA VI (Thu) | F02 "3 days"; question box "What do you need to know for Thursday?" | F01 |
| Tue 17 | Carousel: "GTA VI launch checklist" — unlock time by region (C08), pre-load (only once Rockstar or the store states it), editions, platform list | F02 "2 days"; answers to Monday's questions | F02 short |
| Wed 18 | Single: "Tomorrow." with the unlock time for CET and ET, only if confirmed | F02 "1 day"; poll "Pre-loading or buying later?" | — |
| Thu 19 | Single at unlock: "GTA VI is out on PS5 and Xbox Series X|S." Carousel at 18:00: "What to do in your first hour" (from our launch guide, only what we played) | "Out today" frame with link sticker to `/games/grand-theft-auto-vi` (add to library) and `/gta6/map` | F02 finale "0 days" |
| Fri 20 | F24 launch verdict carousel ("review in progress": what we've played so far, no score until the review says so) | Story Q&A: "What's surprised you?" | — |
| Sat 21 | Carousel: map progress tracker is live (C11), how to save your progress | Link sticker to `/gta6/map` | Reel: map tracker screen recording |
| Sun 22 | Carousel: GTA VI Confirmed or Rumour, final edition (what turned out true) | F14 Weekly Wrap frame | — |

Rules for the week: no leaked or datamined content; no modded footage; spoilers only behind a "spoiler" cover slide and never in the first frame or caption line; performance claims only from our own play or cited reviews.

### 7.2 The Game Awards (F20), Thu 10 Dec

| When | What |
|---|---|
| Tue 8 Dec | Carousel 4.10 |
| Wed 9 Dec | Story poll: Game of the Year pick |
| Thu 10 Dec, before the show | Story: "Tonight. Watch party in Discord." with link sticker to the Discord invite |
| During the show | Stories only, one frame per world premiere: "[Game] · [platform] · [date if given]" with link sticker to its `/calendar/[slug]` page once DEV or ED has created it. Maximum 12 frames. |
| Fri 11 Dec, 09:00 CET | Carousel: "Every winner" (category and winner per slide, grouped) and a second carousel "Every reveal, with dates" linking to the calendar |

---

## 8. Caption system

```
Line 1: the answer or the news, specific, under ~125 characters so it shows before "more" (length UNVERIFIED; keep it short anyway).
Line 2: the one detail that makes it useful (date, platform, price, what changed).
Line 3: source, if the slides don't already carry it.
Line 4: the action: "Save this", "Link in bio: [label]", "Reminder link in today's Stories". One action only.
Line 5: 3–5 hashtags.
```

**Tone:** dry, specific, English. No "Don't miss", "You won't believe", "!!!", countdown pressure or invented scarcity. No member or follower numbers. One emoji at most, and usually none.

**Replies:** SC answers questions in comments within 24 hours (spine guardrail). If a comment corrects us and is right, the correction goes into the slide's next version and the caption is edited with "Corrected: [what]".

---

## 9. Hashtag policy

- **Three to five per post, all specific:** the game (#GTA6, #ModernWarfare4), the platform (#PS5, #NintendoSwitch2), the event (#SteamNextFest, #TheGameAwards) or the franchise tag (#HiddenGem).
- **Never** generic walls (#gaming #gamer #gamersofinstagram #instagaming), unrelated trending tags, or tags for games not in the post.
- **Same core tags per franchise** so the grid is searchable: F01 uses the week's biggest game and #NewReleases; F03 always #GTA6 #GTAVI; F09 the series name.
- **UNVERIFIED:** how much reach hashtags drive on Instagram in 2026; the research did not cover it [R07 §3.5, R19 §6]. This is a relevance rule. If Instagram Insights show hashtag reach under 5% of total for four weeks, drop to two tags and stop spending time on them.

---

## 10. Broadcast Channel: decision

**Decision: do not open an Instagram Broadcast Channel in Q4 2026.**

| Reason | Evidence |
|---|---|
| Discord is TechPlay's one-to-many community channel and is PRIMARY; a Broadcast Channel would split the same announcements across two places SC has to feed | spine §12; R13 |
| The account's audience is unknown; a channel needs followers who want more, not fewer | R02 |
| SC hours are the constraint; every new surface has to replace another | spine §1 |

**Revisit in the week of 11 Jan 2027** and open one only if both are true for four weeks of December: (1) Story replies and question-box submissions average more than SC can answer in 30 minutes a week, which shows demand for one-to-many updates on Instagram itself; and (2) Instagram actions per SC hour (§13) are at or above the median of the other SECONDARY channels. If opened, it carries only F01 on Mondays and release-day reminders, nothing more.

---

## 11. Collabs with creators (C51, from 20 Oct)

TechPlay offers data, a tool or a Discord audience; the creator offers reach. No money changes hands this quarter [R15]. Every Collab is a co-authored post that appears on both profiles.

| Format | Partner type | What TechPlay brings | Post | When |
|---|---|---|---|---|
| Data card co-post | Gaming creator who covers releases or industry | A chart or F04 card from our data (release counts, studio closures), credited | Carousel on both profiles; creator's commentary on slide 2 | From 20 Oct; C20 data (7 Oct) and C22 (14 Oct) are the first sources |
| "Rate my character" | WoW creator | WoW Analyzer run on a character they choose | Reel: screen recording of the Analyzer on their character + their reaction in text | Around WoW: Forever (4 Nov) and C14 |
| GTA VI "first hour" | GTA creator | Our launch checklist and map tracker | Carousel co-post, launch week | 19–22 Nov |
| Balkan spotlight | Regional creator or A1 Adria League (C55) | Regional studio data from `/studios/country/ba` and C21 | Carousel co-post in English, caption line in the local language | November |

**Rules**
- Creator approves final slides; TechPlay approves any facts attributed to us.
- If anything of value is exchanged (keys, prizes), use Instagram's paid-partnership label; the exact 2026 rules were not researched and must be checked before the first Collab [R16 §2.15].
- Official footage and art only; credit the creator and the publisher.
- UTM on any link: `utm_source=creator-<handle>&utm_medium=creator&utm_campaign=c51-creator-data&utm_content=<format>`.
- Creator's own numbers are never quoted by TechPlay unless they are visible on their profile on the day.

---

## 12. Weekly slots and cadence

| Day | Feed | Reel | Stories |
|---|---|---|---|
| Mon | F01 Out This Week carousel | F01 | F02 + Monday answers (from Friday's box) |
| Tue | F04 The Number single, or F08 carousel when a big launch needs it | F02 short | F02 |
| Wed | — | — | F02 + F12 poll |
| Thu | F03 Confirmed or Rumour (GTA weeks to 19 Nov) or F05 Hidden Gem (alternating; F05 every Thursday after 19 Nov) | F02 short | F02 + quiz |
| Fri | F24 Verdict when a review lands | F07 | F02 + question box |
| Sat | F09 In Order, or F08 | F02 short | F02 |
| Sun | — | F18 Games Like | F02 recap + F14 wrap frame |

**Volume:** 3–4 feed posts, 5–6 Reels (produced in C49), 7 Story sets a week. Release-day reminder frames add 1–3 Story frames on release days.

**Seasonal overrides:** F16 Deal Radar carousel replaces F05 on Thu 1 Oct (C05), Fri 27 Nov (C32) and Thu 17 Dec (C34); F23 Next Fest Diary Story frames daily 19–26 Oct (C18); GTA launch week §7.1; TGA §7.2; C28 "Your 2026 in Games" share-card carousel and Story sticker from Mon 14 Dec.

---

## 13. Hours (ESTIMATE)

| Task | Owner | Weekly hours |
|---|---|---|
| Carousel fills (3 a week × ~40 min) | SC | 2.0 |
| Story sets (7 × ~10 min) and release frames | SC | 1.2 |
| Captions, replies, Highlights upkeep | SC | 0.8 |
| New masters, fixes, special carousels (4.7, 4.10) | DS | 1.0 |
| Fact check of F03, F08 and F09 slides against the site | ED | 0.5 |
| **Total** | | **SC 4.0, DS 1.0, ED 0.5** |
| One-off, week 1 | DS 5 h (six masters, Story frames, Highlight covers); SC 1 h profile | |

---

## 14. KPIs and formulas

| KPI | Formula | Source | TARGET |
|---|---|---|---|
| Save rate | saves ÷ reach, per carousel; weekly median | Instagram Insights | set 26 Oct from weeks 1–4; +20% by 22 Nov |
| Share rate | shares ÷ reach, per carousel | Insights | set 26 Oct |
| Carousel completion | reach on last slide ÷ reach on first slide, where Insights provides it | Insights | watch; no target |
| Story tap-through | link sticker taps ÷ Story frame reach | Insights | set 26 Oct |
| Poll and quiz participation | votes ÷ frame reach | Insights | set 26 Oct |
| Instagram sessions | sessions with `utm_source=instagram`, split by `utm_content` (bio-link1…5, f02-day[n]-story, release-[slug]-story) | first-party collector after D-008 | baseline week of 19 Oct |
| Actions | `reminder_set` + `library_connected` + `registration_complete` + `newsletter_verified` attributed to Instagram, + `discord_join` on the Instagram invite code | GA4 after D-007; bot after D-011 | baseline week of 19 Oct |
| **Actions per SC hour** | actions ÷ SC hours on Instagram | as above + time log | compared with Facebook, X and Reddit on 22 Nov |
| Reel retention | average watch time ÷ length | Insights | compared with TikTok and Shorts for the same video (08) |
| Corrections | corrections issued ÷ posts | SC log | reported; every one handled within 24 h |

---

## 15. What not to do

- No follower, member or reader numbers anywhere, including "join thousands" [spine §0].
- No generic hashtag walls, no "follow for follow", no engagement pods.
- No leaked, datamined or modded GTA content; official art and footage only, credited [R17 §10].
- No map location counts presented as TechPlay's own until D-020 clears.
- No GTA VI unlock time until Rockstar or a store confirms it.
- No giveaway that asks people to share, tag or repost; Meta's Promotions policy covers Instagram, and every giveaway post needs "no purchase necessary", eligibility, a rules link and the line that Meta is not involved [R16].
- No score or verdict on a carousel before the review is published.
- No story frames with passed dates left in Highlights.
- No boosting from the app; paid Meta runs only through C57 after C03 and D-031.

---

## Dependencies and open questions

**Dependencies**
- DS week-1 capacity: 5 of DS's 10 hours go to Instagram masters, alongside Facebook (1 h) and video templates (see 08). If DS cannot give 5 hours, F01 and F03 masters come first; F09 and F24 wait a week.
- C01 / D-001 before the bio sends people to `/register` (the register page's "15K+ members" claim).
- D-005: GTA VI game page `/games/grand-theft-auto-vi` as the target for "Remind me", not `/games/gta-6`.
- C08 / D-018: `/gta6/release-time` by 14 Oct for bio link 1 and Monday frames.
- C43 and C45 (19 Oct) for the reminder CTA on F01; C31 / D-027 (20 Nov) for the price-alert CTA.
- C29 / D-026 for the TGA prediction league slide.
- D-012 `/newsletter` landing for bio link 4.
- D-020: GTA map attribution. C12 (21 Oct) before any vehicle class or real-world match appears.
- C03 / D-007 / D-008: without them only Instagram Insights are readable.
- C51 creator outreach (EIC) for Collabs; C55 for Balkan partners.

**Open questions**
- UNKNOWN: account followers, post history and whether it sits in the same Meta business portfolio as the Facebook Page (needed for Stories cross-posting and C57).
- UNVERIFIED: 2026 Instagram rules on bio link count, link stickers, carousel length, caption truncation, hashtag reach and paid-partnership labelling [R07 §3.5, R19 §6]. SC checks each in the app in week 1 and adjusts this plan.
- Conflict noted: R07 classed Instagram EXPERIMENTAL; the spine classes carousels and Stories SECONDARY. This plan follows the spine.
- Year and title checks for F09 carousels depend on the series data being right; if `/games/series/` pages are thin or wrong for Gears or GTA, ED fixes the data first (it is also C63's page).
- The PS5 price after the 2 April rise is not in our sources; slide 4.7/4 reads it from Sony on the day.
