# 06 — Facebook: Page, Reels, Stories and Group participation

Status: Phase 2 plan — 27 Sep 2026

- **Priority: EXPERIMENTAL** (spine §12). TechPlay's Page exists (`facebook.com/techplaygg`) but its follower count and engagement are unknown behind a login wall, link reach is widely reported as weak but was not verified, and no Facebook traffic data exists [R02, R07]. We run it cheaply and measure it. We do not grow it on faith.
- **The Page has one hard job this quarter: be a credible ad identity for C57** (Meta registration test, 2–22 Nov). A Page that has posted on a schedule for five weeks before the first ad runs is worth the ~2 hours a week.
- **Almost everything on the Page is repurposed:** Instagram carousels become multi-image posts, the C49 vertical videos become Reels, the F02 countdown Stories go out on both platforms from one design, and F04, F06, F11 and F12 are the same cards and questions used on X and Discord. New Facebook-only work is limited to captions and Group replies.
- **Groups are a participation programme (C47a), not a distribution list.** One named person (SC) with a disclosed TechPlay affiliation, a 30-day ladder that starts with reading and answering, a 9:1 help-to-link ratio, and links only where admins say yes.
- **Giveaways on Facebook follow Meta's Promotions policy:** no "share, tag or repost to enter", a line saying Meta has nothing to do with it, eligibility, and a link to official rules [R16]. TechPlay's `share_giveaway` and `twitter_retweet` tasks must be switched off on any giveaway that Facebook promotes.
- **Thirteen post templates with full copy, image spec, CTA and link rule**, each with two filled examples from real Q4 2026 events [R05, R06, R17].
- **Budget ESTIMATE: 4.5 SC hours a week (2 Page, 2.5 Groups), 0.5 DS hours a week after a one-off 1 hour template pass, no ED time beyond the fact checks already done for other channels.**
- **Decision point: Sun 22 Nov.** Upgrade, hold or cut based on actions per hour against the SECONDARY channels (formulas in §11). Nothing is decided from reach alone.

---

## 1. Why EXPERIMENTAL, and what would upgrade it

| Question | Evidence | Consequence |
|---|---|---|
| Does TechPlay have a Facebook audience? | Page exists; followers and posts UNVERIFIED (login wall) [R02 §8.2] | Baseline must be read from Meta Business Suite on 28 Sep before any target is set |
| Do link posts reach people? | "Link reach is widely reported as weak" — UNVERIFIED, not re-checked [R07 §2] | We test link placement (§4) rather than assume |
| Are gamers on Facebook Groups? | Game-specific groups exist; self-promotion rules vary per group; none were fetched [R07 §2] | Participation only, vetted group by group |
| Does Facebook matter for S9 (Balkan gamers)? | TechPlay is Sarajevo-based; regional partnerships are C55 [spine §8] | Balkan groups are one of five group categories |
| Does anything else depend on the Page? | C57 paid Meta test runs 2–22 Nov and 1–14 Dec; D-031 Pixel+CAPI must exist first [spine §8, §14; R16] | The Page must look alive and honest by 2 Nov |
| Can we measure it? | UTMs are dropped by the first-party collector until D-008; GA4 has no registration event until D-007 [R16, R23] | Before 16 Oct, count only Business Suite clicks and Discord joins via a Facebook-only invite code |

**Upgrade to SECONDARY (more hours, own weekly content) only if both hold for four consecutive weeks between 19 Oct and 22 Nov:**
1. Facebook's **actions per SC hour** (formula §11) is at or above the median of Instagram, X and Reddit for the same weeks.
2. At least one Group has given written admin permission for recurring TechPlay resource posts, and those posts were not removed.

**Cut to autopilot** (Reels and Stories cross-posted from Instagram, no captions written for Facebook, Groups stopped) if actions per SC hour are below a quarter of that median for four consecutive weeks, or if any Group removes a post for spam twice.

**Hold** (this plan unchanged) in every other case.

---

## 2. Page setup (Mon 28 Sep – Fri 2 Oct, SC 1.5 h, DS 1 h, one-off)

| Item | Setting |
|---|---|
| Name / handle | TechPlay / `techplaygg` (keep; it is linked from the site footer [R02]) |
| Category | Media/news company (or the nearest Meta offers) |
| Intro (bio) | "Gaming, on the record. The gaming publication that knows what you play: release calendar, 333,000+ games, and a free library for Steam, PlayStation, Xbox, GOG and Epic. Independent, Sarajevo." |
| Action button | "Sign up" → `https://techplay.gg/register?from=facebook&utm_source=facebook&utm_medium=organic-social&utm_campaign=c44-registration&utm_content=page-button` |
| Website field | `https://techplay.gg/?utm_source=facebook&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=page-about` |
| Cover image | 1640×924 (safe centre area 1200×628): "What's out this week, where you can play it, and what to play next." plus the logo. No numbers except "333,000+ games". |
| Profile image | Logo mark, not Buffy (Buffy is a corner mark on cards only [R13 §7]) |
| Pinned post | The current F01 Out This Week post, replaced every Monday; from 16 Nov to 22 Nov, the GTA VI launch-week post (C10) |
| Discord link | A Facebook-only invite code created by SC (C36 sheet). Until it exists: `https://discord.gg/wPQG9gUMXH`. Never `techplaygg` or `techplay` (dead) [R13] |
| Remove | Any "members", "fans" or follower claims in old posts or the About tab (C01 Trust Reset) |
| Baseline to record (28 Sep) | Followers, posts in last 90 days, average reach per post in last 90 days if any posts exist. If there are none, the baseline is zero and says so. |

---

## 3. What runs on the Page

| Format | Source | Franchise / campaign | Per week | Made by |
|---|---|---|---|---|
| Multi-image post (carousel) | Instagram carousel export, 1080×1350 | F01, F05, F09, F08, F03 | 2–3 | SC (caption only) |
| Reel | C49 vertical export, 1080×1920, no other platform's watermark | F01, F02, F07, F18 | 3 | SC (upload + caption) |
| Story | Instagram F02 frames, same file | F02 (C06) | daily to 19 Nov | SC |
| Single image | F04 The Number card, 1080×1350 | F04 | 3 (Tue/Thu/Sat) | SC fills DS template |
| Link post | Article URL with its OG card | news, F24, F10 | ≤1 a day | SC |
| Question / poll | text or text-on-image | F11, F12 | 2 | SC |
| On This Day | image card from `/games/on-this-day` | F06 (C65) | 3 of 7 days (Mon/Wed/Fri) | SC |
| Native long video | none this quarter | — | 0 | — |

Native long video is out: we have no presenter and no footage rights beyond official trailers [R19]. Reels cover video.

---

## 4. Link rule (applies to every template)

The research could not verify how Facebook treats links in 2026 [R07]. So:

| Code | Meaning | Used for |
|---|---|---|
| **L1** | Link in the post body; Facebook builds the preview from our OG tags | News shares, Verdict, guides, breaking news |
| **L2** | No link in the body; link as the first comment by the Page, posted within one minute | Weeks 1–4 test: alternate L1 and L2 on news shares |
| **L0** | No link anywhere; the post stands on its own | Questions, polls, nostalgia, meme-adjacent, most Group posts |

**Test, weeks 1–4 (28 Sep–25 Oct):** every news share alternates L1/L2. Compare `link clicks ÷ reach` per post. From week 5, use whichever wins by at least 25% on the median; if neither does, keep L1 (simpler, and the preview card carries the image).

**Every link carries UTMs:** `utm_source=facebook&utm_medium=organic-social&utm_campaign=<cid>-<slug>&utm_content=<franchise>-fb-<variant>`. Groups use `utm_medium=community`. Build them with the campaign URL helper once D-009 ships; until then, from the sheet.

**OG images:** article covers are 25–166 KB and fine. Hub OG images are 2–2.5 MB [R02 §1.4]; until D-017 fixes them, link posts to `/gta6` or `/wow-analyzer` carry an uploaded 1080×1350 card instead of relying on the preview.

---

## 5. Post templates (13), each with two filled examples

Conventions: `[ ]` = fill at posting time. Image sizes: feed 1080×1350 (4:5), link preview 1200×630, Story/Reel 1080×1920. One DS master per template; SC fills. Maximum one emoji per post; most use none. Every fact carries a source in the image footer or the caption.

### T1 — News share

**Copy structure**
```
[What happened, one sentence, with the date.]
[Why it matters to a player: platform, price, or what changes.]
[One detail the headline did not have.]

[L1 link or "Link in the first comment."]
```
**Image:** article cover via OG (L1) or 1080×1350 card: title in two lines, source line at the bottom.
**CTA:** read the article. No "click here".
**Link rule:** L1/L2 alternating in weeks 1–4.

**Example 1a — Tue 6 Oct (C16)**
```
Gears of War: E-Day is out today on Xbox and PC.
Game Pass: [state the tier that includes it, copied from Microsoft's store page on the day; if the page does not say, cut this line].
Our page lists the editions, the PC requirements and the series order if you are coming in fresh.

https://techplay.gg/news/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c16-gears-eday&utm_content=news-fb-l1
```
Fact check before posting: the Game Pass line is filled only from Microsoft's own page; it is never guessed.

**Example 1b — Fri 23 Oct (C17)**
```
Call of Duty: Modern Warfare 4 launches today on PS5, Xbox Series X|S, PC and Switch 2.
It is the first Call of Duty on a Nintendo platform since Ghosts, and it is not a day-one Game Pass release.
Digital pre-orders have had the campaign since 16 October.

Link in the first comment.
```
First comment: `https://techplay.gg/news/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c17-mw4-hub&utm_content=news-fb-l2`

### T2 — Discussion starter

**Copy structure**
```
[A fact, dated and sourced.]
[The open question it raises, asked once.]
[Your own short position, optional, one line, signed by the editor.]
```
**Image:** 1080×1350 card, the fact in large type, the question small at the bottom.
**CTA:** reply in comments. **Link rule:** L0; article link only in a Page reply if someone asks.

**Example 2a**
```
Fable moved to 23 February 2027, and the 29 May announcement said the reason was to avoid GTA VI on 19 November.
Is moving out of GTA's way sensible, or should more publishers hold their dates and trust their audience?
— Adi, editor
```
Image footer: "Source: Fable release date announcement, 29 May 2026, via Wikipedia."

**Example 2b**
```
GTA VI launches on 19 November as a single-player game. Rockstar has not dated an online mode; a 2027 GTA Online is a rumour, not an announcement.
Would you rather have the story alone at launch, or wait longer for both together?
```
Image footer: "Confirmed: Rockstar via IGN, 24 Jun 2026. Rumour: The Mirror, 18 Sep 2026."

### T3 — Giveaway (Meta Promotions policy)

**Rules before this template is used (all must be true):**
1. The giveaway is live in admin and has an end date (C09: VERIFY 28 Sep) [spine §0].
2. Its task list on the site has `share_giveaway` and `twitter_retweet` switched off for this draw [R16 §2.15].
3. Official rules page exists: prize, eligibility (age, countries), start and end dates, how the winner is picked and contacted, and a free way to enter.
4. Nothing on Facebook asks people to like, share, tag, comment or follow to enter.

**Copy structure**
```
[Prize, stated plainly.] Draw closes [date, time, time zone].
Enter on TechPlay: [link]. Entry needs a free account. [Free alternative entry method if the rules provide one.]
No purchase necessary. Open to [eligibility]. Official rules: [link].
This giveaway is not sponsored, endorsed or administered by, or associated with, Meta or Facebook.
```
**Image:** 1080×1350, prize image or official key art, "Closes [date]" and "No purchase necessary" on the image. No "WIN!!!".
**CTA:** enter on the site. **Link rule:** L1 to `/giveaway/{slug}`.

**Example 3a — C09, only if verified live (target close 20 Oct)**
```
[Prize as listed in admin]. The draw closes Tuesday 20 October at [time] CET.
Enter on TechPlay: https://techplay.gg/giveaway/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c09-gta6-giveaway&utm_content=giveaway-fb-a
Entry needs a free TechPlay account.
No purchase necessary. Open to [eligibility from rules]. Official rules: https://techplay.gg/giveaway/[slug]#rules
This giveaway is not sponsored, endorsed or administered by, or associated with, Meta or Facebook.
```
Winner post, Wed 21 Oct: "The [prize] draw is closed and the winner has been contacted by email. If we do not hear back by [date], we redraw, as the rules say." No winner name unless the rules and the winner allow it.

**Example 3b — C30 Community Awards prize draw (1–20 Dec), only if a prize is confirmed**
```
Vote in the TechPlay Community Awards 2026 and you are entered for [prize as listed in admin]. Voting and the draw close Sunday 20 December at 23:59 CET.
Vote here: https://techplay.gg/awards/2026?utm_source=facebook&utm_medium=organic-social&utm_campaign=c30-community-awards&utm_content=giveaway-fb-b
One entry per account. No purchase necessary. Open to [eligibility]. Official rules: [link]
This giveaway is not sponsored, endorsed or administered by, or associated with, Meta or Facebook.
```
`/awards/2026` is a new page (spine §7); if it is not live, this post does not run.

### T4 — GTA VI

**Copy structure**
```
[Days to 19 Nov, if in countdown period.] [One confirmed fact, with source.]
[What it means for the reader.]
[Where the full list lives.]
```
**Image:** 1080×1350 GTA VI card on the F02/F03 master; official Rockstar art only, credited "Image: Rockstar Games". Status tag on the card: CONFIRMED / REPORTED / RUMOUR.
**CTA:** the ledger (`/gta6/everything-we-know`) or, from 14 Oct, the release-time tool (`/gta6/release-time`, C08). **Link rule:** L1.
**Do not** use the 1,058-location figure as TechPlay's own dataset until D-020 clears attribution [spine §0].

**Example 4a — Thu 1 Oct, F03 launch (C07)**
```
49 days to GTA VI. Here is where the facts stand this week.
Confirmed: 19 November, PS5 and Xbox Series X|S, $79.99 or $99.99 for the Ultimate Edition, single-player at launch, no PC at launch.
Reported, not confirmed by Rockstar: 30 fps on consoles at launch (Tom's Hardware, 29 Aug).
Rumour: GTA Online for GTA VI in 2027.
Every line, with its source and date: https://techplay.gg/gta6/everything-we-know?utm_source=facebook&utm_medium=organic-social&utm_campaign=c07-gta6-ledger&utm_content=f03-fb-w40
```

**Example 4b — Wed 14 Oct (C08)**
```
36 days to GTA VI. What time it unlocks where you live is the question we get most, so we built a page that answers it by time zone, and updates the moment Rockstar confirms the unlock time.
Set a reminder there and we will tell you when pre-load opens.
https://techplay.gg/gta6/release-time?utm_source=facebook&utm_medium=organic-social&utm_campaign=c08-gta6-release-time&utm_content=tool-fb-a
```
Runs only if C08 shipped on 14 Oct; the unlock time is not stated anywhere until Rockstar confirms it.

### T5 — Guide (F07 Fix It Friday, C60)

**Copy structure**
```
[The problem in the player's words.]
[What causes it, one line.]
[What the guide covers, as a list of 3.]
[Link.]
```
**Image:** 1080×1350 card: the problem as a headline, "Fix It Friday" label, a screenshot of the relevant Windows or game setting screen (our own capture).
**CTA:** read the guide; from 12 Oct, "all fixes in one place" at `/guides/pc-fixes`. **Link rule:** L1.

**Example 5a — Fri 16 Oct**
```
Your game stutters for the first minutes, or every time you enter a new area, and then smooths out.
That is usually shader compilation: the game is building shaders on the fly for your GPU.
Our guide covers how to tell it apart from other stutter, the in-game and driver settings that help, and per-game notes for this month's big releases.
https://techplay.gg/guides/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c60-pc-fix-hub&utm_content=f07-fb-a
```

**Example 5b — Fri 23 Oct**
```
Launch day for Modern Warfare 4 on PC, and the first question is always the same: which Windows 11 settings actually matter for games?
We checked the ones people argue about and wrote down what each does, what to leave alone, and how to undo it.
https://techplay.gg/guides/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c60-pc-fix-hub&utm_content=f07-fb-b
```

### T6 — Review (F24 Verdict, C52)

**Copy structure**
```
Verdict: [Game]. [Score if the format gives one]/10.
[One-sentence verdict in the reviewer's words.]
Played on [platform] for [hours] hours. [What we have not tested yet.]
Full review: [link]. This review grows as we play further.
```
**Image:** 1080×1350 Verdict master: key art (publisher press kit, credited), game name, score, one-line verdict, reviewer name. Scores follow `/rating-system`.
**CTA:** read the review; add the game to your shelf. **Link rule:** L1.
**Rule:** the verdict line and score come from the published review. The examples below are shape only.

**Example 6a — week of 6 Oct (Gears of War: E-Day)** — ILLUSTRATIVE, replace the bracketed parts from the review
```
Verdict: Gears of War: E-Day. [score]/10.
[Reviewer's one-sentence verdict.]
Played on [Xbox Series X / PC] for [n] hours. Horde and ranked multiplayer are not covered yet; we add them after launch week.
Full review: https://techplay.gg/reviews/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c52-verdict&utm_content=f24-fb-gears
```

**Example 6b — week of 2 Nov (Phantom Blade Zero, launched 29 Oct on PS5 and PC)** — ILLUSTRATIVE
```
Verdict: Phantom Blade Zero. [score]/10.
[Reviewer's one-sentence verdict.]
Played on [PS5 / PC] for [n] hours. It sat in Steam's top ten most-wishlisted games before launch, so we tested [PC performance point] as well.
Full review: https://techplay.gg/reviews/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c52-verdict&utm_content=f24-fb-pbz
```
The wishlist fact is from Steam's popular-wishlist filter on 27 Sep [R05 §6].

### T7 — Breaking news

**Copy structure**
```
[Name]: [what changed], [when]. Source: [primary source].
[What we do not know yet.]
[We will update the article; link.]
```
**Image:** plain 1080×1350 text card on the "Just in" master; no key art needed. **CTA:** article. **Link rule:** L1. Post only once the primary source (publisher, platform holder) has published; never on a rumour.

**Example 7a — Wed 30 Sep (PS Plus Essential October reveal, reported date)**
```
PlayStation Plus Essential for October: [game 1], [game 2] and [game 3]. Source: PlayStation Blog.
Not yet announced: the Extra and Premium games, which arrive 20 October.
We have linked each game to its page so you can add it to your library before it lands.
https://techplay.gg/news/[slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=breaking-fb-psplus
```

**Example 7b — WoW patch 12.1.5, only when Blizzard dates it (predicted ~6 Oct) (C13)**
```
World of Warcraft patch 12.1.5 is live. Source: Blizzard.
Not yet known: [tuning or content still marked "coming later" in the notes].
Before your first run, the WoW Analyzer checks your character against the new content and tells you what to fix first.
https://techplay.gg/wow-analyzer?utm_source=facebook&utm_medium=organic-social&utm_campaign=c13-wow-1215&utm_content=breaking-fb-a
```

### T8 — Poll (F12 Poll of the Week, C39)

**Copy structure**
```
[Context fact.]
Poll: [question]
A) [option]  B) [option]  (C) [option])
Results next Wednesday, with the Discord and forum votes added in.
```
**Image:** if the Page cannot post a native poll, a 1080×1350 card with the options and "Tell us which, and why, in the comments." Never "Like for A, Love for B": reaction-voting is treated by Meta as engagement bait (platform rule not re-verified in research; avoid it anyway).
**CTA:** vote or comment with a reason. **Link rule:** L0.

**Example 8a — Wed 30 Sep**
```
GTA VI costs $79.99, or $99.99 for the Ultimate Edition.
Poll: which are you buying?
A) Standard  B) Ultimate  C) Waiting for a sale or a PC version
Results next Wednesday, with the Discord and forum votes added in.
```

**Example 8b — Wed 7 Oct (C66 context, neutral)**
```
Sony is surveying players and developers about ending PlayStation disc production.
Poll: how did you buy your last three PS5 games?
A) All discs  B) All digital  C) A mix
Results next Wednesday. If you have a reason, put it in the comments; we read them all.
```

### T9 — Community discussion (F11 What Are You Playing?, C37)

**Copy structure**
```
What are you playing this week?
[One line from an editor about what they are playing, specific.]
[Optional hook tied to the week.]
If you keep a TechPlay library, your shelf shows it for you: [link to /register or profile].
```
**Image:** 1080×1350 card "What are you playing?" with the week's date; or no image.
**CTA:** reply. **Link rule:** L0 in the post; the register link goes in a Page reply to the first comment, only once.

**Example 9a — Mon 28 Sep**
```
What are you playing this week?
Nenad is [n] hours into Control Resonant and has opinions about the Faults.
If you are waiting for Minecraft Dungeons II tomorrow or the Steam Autumn Sale on Thursday, say what you are finishing first.
```
([n] is Nenad's real playtime; if he has not started it, swap in whatever he is actually playing.)

**Example 9b — Mon 19 Oct**
```
What are you playing this week?
Steam Next Fest starts today and runs to 26 October. Adi has [demo] on his list first.
Which demo are you trying, and which one would you buy on the strength of it?
```

### T10 — Nostalgia

**Copy structure**
```
[Anchor: an anniversary, a return, or a "then vs now".]
[One specific memory prompt.]
[Question.]
```
**Image:** 1080×1350 "then and now" split, official art only, credited. From `/games/on-this-day` where it fits (F06).
**CTA:** reply. **Link rule:** L0; the series page in a Page reply if asked.

**Example 10a — Sat 3 Oct (C63, F09 hook)**
```
GTA started in 1997. On 19 November it goes back to Vice City.
Which GTA map do you still know without looking?
```
Image: official art from the first GTA and GTA VI, "1997 → 2026". Series page in a reply: `/games/series/[gta-slug]`.

**Example 10b — Sat 17 Oct (ahead of MW4 on 23 Oct)**
```
Modern Warfare 4 is out on Friday. The loudest threads on r/CallOfDuty this autumn are about World at War and Modern Warfare 2 from 2009.
What was your first Call of Duty, and on what?
```

### T11 — Hardware

**Copy structure**
```
[The number, with the date it changed.]
[Context: before and after, or compared with the alternatives.]
[What it means for someone deciding now.]
```
**Image:** 1080×1350 F04 "The Number" master: the number huge, one line under it, "Source: [publisher], [date]".
**CTA:** hardware article or the Deal Radar in sales. **Link rule:** L1 if an article exists, else L0.

**Example 11a — Tue 29 Sep (F04)**
```
$499.99.
That is the Switch 2 price since 1 September. Xbox Series X is $649.99 after 1 August, the PS5 went up on 2 April, and Steam Deck OLED is $789 or $949 since 27 May.
If you are buying a console for the holidays, check today's price before you trust an old deal post.
```
The PS5 amount is not in our sources, only the date, so the card gives the date and no figure for PS5.

**Example 11b — Thu 8 Oct (F04)**
```
$1,059.
The starting price of Valve's Steam Frame VR headset, which launched on 18 September. The higher configuration is $1,299.
We list the Steam games that support it on its hardware page, so you can check your own library before you decide.
```
Only if the VR-ready list (R06 action 28) exists on the site; otherwise drop the last sentence.

### T12 — Question (reader question, answered)

**Copy structure**
```
"[Question as readers ask it.]"
Short answer: [one line].
Longer answer: [two or three lines with sources].
[Link to the page that keeps the answer current.]
```
**Image:** 1080×1350 Q&A master: the question in quotes, "Short answer:" underneath.
**CTA:** the explainer or template page. **Link rule:** L1.

**Example 12a — Tue 6 Oct**
```
"Is GTA 6 coming to PC?"
Short answer: not at launch.
Longer answer: GTA VI launches 19 November on PS5 and Xbox Series X|S only. Take-Two's CEO addressed why there is no PC version at launch in May (IGN, 4 May 2026). No PC date has been announced. No Switch 2 version has been announced either.
We update this the day anything changes: https://techplay.gg/gta6/everything-we-know?utm_source=facebook&utm_medium=organic-social&utm_campaign=c07-gta6-ledger&utm_content=question-fb-pc
```

**Example 12b — Thu 1 Oct (C66)**
```
"Will my PS5 discs still work if Sony stops making them?"
Short answer: the plan reported this month is about ending disc production. What it means for discs you already own is exactly what we are tracking.
Longer answer: Sony is still surveying players and developers, and publishers say Sony is "hearing" the backlash. Our explainer logs each Sony statement with its date and source, and answers your question as soon as Sony does.
https://techplay.gg/news/[explainer-slug]?utm_source=facebook&utm_medium=organic-social&utm_campaign=c66-last-disc&utm_content=question-fb-discs
```
The explainer must exist before this runs; if Sony makes a statement about existing discs first, the short answer quotes Sony.

### T13 — Meme-adjacent editorial

A familiar format carrying a real fact. It is dry, it never mocks a person or a studio's staff, and it never uses a copyrighted meme image; the layout is ours.

**Copy structure**
```
[Short caption, deadpan.]
[One fact line that makes the joke true.]
```
**Image:** 1080×1350 two-panel card in house style (labels + official art or plain type). Buffy may appear as the small corner mark.
**CTA:** none, or a reply. **Link rule:** L0.

**Example 13a**
```
Release calendars everywhere, looking at 19 November.
Fable moved to 23 February 2027 to stay out of GTA VI's way. Our calendar shows who else is close: https://techplay.gg/calendar?utm_source=facebook&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=meme-fb-a
```
(Exception to L0: one link, because the calendar is the punchline.)
Image: panel 1 "Every publisher's Q4 plan", panel 2 the November calendar with 19 Nov circled.

**Example 13b**
```
Counter-Strike 2, 2026: the most-played game on Steam, and now you can raise a chicken in it.
1,354,009 peak players in the week to 26 September, according to Steam's own charts.
```
Image: CS2 official art with a hand-drawn chicken in the corner, clearly ours.

---

## 6. Stories and Reels

**Stories.** The F02 countdown runs daily from Mon 28 Sep (52 days) to Thu 19 Nov (launch day). The frames are designed for Instagram (see `07-INSTAGRAM.md` §5) and posted to Facebook as the same files. If Meta's cross-posting from Instagram to the Facebook Page is available in Accounts Center, use it; if links or stickers do not carry across, post the link frame to Facebook manually with the same UTM but `utm_source=facebook`.

**Reels.** Every C49 vertical video (see `08-TIKTOK.md`) is uploaded natively to the Page as a Reel, from the clean export, with a Facebook caption:
```
[Hook line from the video.]
[One sentence of context.]
[Where the full answer lives: link in the first comment.]
```
Reels do not carry a link in the caption body; the Page posts it as the first comment (L2) with `utm_content=<franchise>-fbreel-<variant>`.

---

## 7. Facebook Groups: the participation programme (C47a)

### 7.1 Who and how

- **One person, named, disclosed.** SC participates from a personal profile whose work line reads "Community, TechPlay (techplay.gg)". Every post that links to TechPlay says so in plain words: "I work on TechPlay."
- Posting as the Page inside Groups is not used. Whether a Page can join a given Group varies and was not verified [R07]; people answer people.
- **Language:** post in the group's language. For Balkan groups that means Bosnian, Croatian or Serbian; the templates below are the English masters and SC translates.
- **Maximum five active groups at any time** after day 30.

### 7.2 Finding groups (no names invented; SC builds the list)

| Category | Segment | Facebook search terms | What a good group looks like |
|---|---|---|---|
| GTA VI fan groups | S4 | "GTA 6", "GTA VI", "Grand Theft Auto 6", "Vice City" | Rules pinned; posts in the last 24 h; admins remove spam; news posts allowed with sources |
| Console owner groups | S1, S2, S6 | "PS5 owners", "PlayStation 5 community", "Xbox Series X owners", "Game Pass", "Switch 2", "Nintendo Switch 2 owners" | Release and deal talk is on-topic; questions get answered |
| PC building and PC gaming | S3 | "PC build help", "PC building", "PC gaming help", "Steam Deck" | Help requests are frequent; answers with screenshots are welcome |
| WoW guilds and communities | S5 | "World of Warcraft", "WoW guild recruitment", "WoW [region] players", "Mythic+" | Guild recruitment posts use the faction/realm/progression format [R13 §2] |
| Balkan gaming | S9 | "gaming BiH", "gejmeri", "igrice", "PlayStation Srbija", "PC gaming Hrvatska", "Xbox Balkan" | Regional language; local deals and events; regional studios welcome |

**Vetting sheet** (one row per group, kept by SC): category, URL, language, rules summary (links allowed? self-promotion day? news allowed?), admin names, posts in the last 7 days (count by eye), visible member count (record only; never quote it publicly), date joined, status (watching / answering / permitted / dropped).

**Drop a group** if the rules ban links and self-promotion entirely and SC has no interest in it as a player, if the feed is mostly spam, or if admins have not posted or moderated in 30 days.

### 7.3 The 30-day ladder

| Days | Dates (first cohort) | What SC does | Output target (TARGET) | Links |
|---|---|---|---|---|
| 1–3 | 28–30 Sep | Search, vet and log 15 candidate groups (3 per category); join the 8 best | 15 rows, 8 joins | none |
| 4–10 | 1–7 Oct | Read. Answer questions where SC actually knows the answer: release dates, platform availability, PC fixes, WoW gear questions | 3 useful replies per group per week | none |
| 11–17 | 8–14 Oct | Post one native value post per group, no link: e.g. the week's releases for that platform as text, a sourced price fact, a WoW patch checklist | 1 post per group | none |
| 18–24 | 15–21 Oct | Message admins of the groups where replies landed well, asking permission for specific resources (template §7.5) | 5 requests | none |
| 25–30 | 22–27 Oct | Where permitted, one resource post following the admin's terms; where not, continue value-only; review the sheet and cut to 5 groups | ≤1 link per permitted group | as permitted |

From day 31 the rhythm is **2.5 hours a week**: replies first, one native value post per group per fortnight, links only as §7.4 allows.

### 7.4 Ratio and link rules

1. **9:1.** At least nine contributions without a TechPlay link (answers, native posts, useful comments) for every one with a link, counted per group over a rolling 30 days.
2. **One link per group per 14 days**, and only where the rules or an admin allow it.
3. **Never the same link into more than two groups within 24 hours.**
4. **Answer in the thread first.** A link is added only when the full answer does not fit, and the answer stands alone without the click.
5. **Links point to utility, not news:** `/calendar`, `/calendar/[slug]`, `/gta6/everything-we-know`, `/gta6/release-time` (from 14 Oct), `/guides/pc-fixes` (from 12 Oct), `/wow-analyzer`, series pages. News articles only when an admin asks for sources.
6. **UTM:** `utm_source=facebook&utm_medium=community&utm_campaign=c47a-fb-groups&utm_content=fbgroup-<category>-<nn>` where category is `gta`, `ps`, `xbox`, `switch`, `pc`, `wow` or `balkan`, and `nn` is the sheet row number. Group names do not go into URLs.
7. **If a post is removed, it stays removed.** No repost, no argument; SC messages the admin once to ask what would be acceptable, then follows the answer.

### 7.5 Admin permission request (template)

```
Hi [admin name],
I've been answering questions in [group] for a few weeks (mostly [topic]). I work on TechPlay, a small independent gaming site in Sarajevo.
We keep [resource: a release calendar you can filter by platform / a GTA VI page that lists what is confirmed and what is rumour, with sources / a WoW character checker that needs no account].
Would you be OK with me sharing it [once when it's relevant / in your weekly links thread / when someone asks]? If you'd rather I didn't, no problem, I'll keep answering as I have been.
Thanks, [first name]
```

### 7.6 Native value posts for groups (examples, no links)

| Category | Example post |
|---|---|
| Console owners (PS5) | "PS5 this week, 19–25 October: the PS Plus Extra and Premium games land on the 20th (Mycopunk is day one, as reported) and Modern Warfare 4 is out on the 23rd. [Other PS5 releases from /calendar filtered to PS5.] Anything I missed?" |
| Switch 2 | "Switch 2 in the next six weeks: Minecraft Bedrock on 27 October, Pikmin 4 Switch 2 Edition and Metaphor: ReFantazio on 12 November, Xenoblade Chronicles 3 Switch 2 Edition on 3 December, Monster Hunter Wilds on 4 December. Which one are you getting?" |
| PC building | "If your new build stutters in the first minutes of a game and then settles, check whether it is shader compilation before you blame the GPU. Happy to look at specific games in the comments." |
| WoW | "12.1.5 is expected around 6 October going by the usual eight-week cadence, but Blizzard hasn't dated it. If you want a pre-patch checklist, here's what I check on my own character: [three items]." |
| GTA VI | "Where things stand, 49 days out: confirmed 19 Nov, PS5 and Xbox Series X|S, $79.99 or $99.99, single-player at launch, no PC at launch. Reported but not confirmed by Rockstar: 30 fps on consoles. Rumour: Online in 2027." |
| Balkan | (in the group's language) "Regional studios with games at Steam Next Fest, 19–26 October: [list from /studios/country/ba and C71 outreach]. Anyone trying them?" |

### 7.7 Never post in a Group

- A giveaway, unless an admin approved that specific giveaway in writing.
- "Join our Discord" or "follow our Page" drops.
- Rumours as facts, or anything without a source line.
- Leaked footage or screenshots, or modded GTA footage [R17 §10].
- Affiliate links, pre-order links or "deals" that pay TechPlay.
- The same article in several groups.
- Anything that asks people to share, tag or react.
- Screenshots of other members' posts or profiles.
- Member counts, follower counts or "thousands of readers".
- Opinions on layoffs that name or blame individual staff; the layoff coverage stays factual [R06 §6].
- Replies to trolls. SC leaves the thread.
- Any post in a group whose rules ban it, even if others ignore the rule.

---

## 8. Posting cadence and weekly slots

Times are CET. There is no audience-time data [R07]; weeks 1–4 alternate two windows (12:30 and 19:30) for feed posts, and week 5 keeps whichever shows the higher median reach.

| Day | Feed (Page) | Reel | Story | Groups (SC) |
|---|---|---|---|---|
| Mon | F01 Out This Week carousel (pinned) · F11 What are you playing? · F06 On This Day | F01 Out This Week | F02 frames | replies 30 min |
| Tue | F04 The Number · one news share (L1/L2) | F02 countdown short | F02 frames | — |
| Wed | F12 Poll · F06 On This Day | — | F02 frames + poll frame | replies 30 min |
| Thu | F05 Hidden Gem or F03 Confirmed or Rumour (alternate) · F04 · F24 Verdict when a review lands | F02 countdown short | F02 frames | native value post (rotating group) |
| Fri | F07 Fix It Friday guide share · F06 On This Day | F07 Fix It Friday | F02 frames | replies 30 min |
| Sat | F09 In Order carousel · F04 | F02 countdown short | F02 frames | — |
| Sun | F18 Games Like carousel or nothing | F18 Games Like | F02 frames | replies 30 min |

**Weekly volume:** 12–15 feed posts (all but ~4 captions reused), 5–6 Reels (reused), 7 Story sets (reused). **Ceiling:** no more than 3 feed posts a day, and never two link posts within 3 hours.

**Seasonal overrides**

| Window | Change |
|---|---|
| 1–8 Oct (C05 Steam Autumn Sale) | F16 Deal Radar carousel replaces F05 on Thu 1 Oct; one "sale ends tonight" post Thu 8 Oct, no countdown pressure |
| 19–26 Oct (C18 Next Fest) | Daily F23 demo diary card replaces F06 on weekdays |
| 16–22 Nov (C10 GTA VI launch week) | Pinned: GTA VI launch post. Daily GTA VI post; F04 and F06 paused; Groups: GTA fan groups only, replies only on launch day |
| 27 Nov–1 Dec (C31/C32) | F16 Deal Radar daily; price-alert CTA (`reminder_set`) instead of articles |
| 10 Dec (F20, TGA) | One pre-show post, one winners post the next morning. No live posting on Facebook; the live thread is on X and Discord |
| 17 Dec–4 Jan (C34) | F16 Steam Winter Sale Picks three times a week; C28 "Your 2026 in Games" share-card post from 14 Dec |

---

## 9. Hours (ESTIMATE)

| Task | Owner | Weekly hours |
|---|---|---|
| Captions and scheduling for reused carousels, Reels, Stories, cards | SC | 1.25 |
| Facebook-only posts (T1, T2, T9, T12 captions) and comment replies | SC | 0.75 |
| Groups (days 1–30: 3.0 h; from day 31: 2.5 h) | SC | 2.5 |
| Card fills beyond templates (rare) | DS | 0.5 |
| One-off: Page setup (SC 1.5 h) and template sizes for 1080×1350 and 1640×924 (DS 1 h) | SC, DS | week 1 only |
| **Total** | | **SC 4.5, DS 0.5** |

If SC's week is over 25 hours, Groups are the first thing cut, down to replies only (1 hour).

---

## 10. What not to do

- Do not boost posts from the Page. Boosting uses Business Suite targeting that lost its interests in 2025 and cannot optimise for registrations [R16 §5].
- Do not run paid Meta before C03 and D-031 are done and before 19 Oct [spine §13].
- Do not post a number we cannot back: no follower, member or reader counts; "333,000+ games" is fine [spine §2].
- Do not post giveaways that require sharing, tagging or reposting, and do not promote on Facebook a giveaway whose site tasks include share or retweet [R16].
- Do not use "Like for A, Love for B" voting, "tag a friend" or "share if you agree".
- Do not use the GTA VI map's 1,058-location count as TechPlay's own dataset until D-020 clears.
- Do not post modded, leaked or non-official GTA footage or screenshots [R17 §10].
- Do not post political takes on layoffs, or name staff in closure stories.
- Do not open a Facebook Group of our own this quarter. Discord is the community core [spine §12].
- Do not cross-post a TikTok or YouTube export with another platform's watermark.

---

## 11. KPIs and formulas

All KPIs are weekly. Before 16 Oct, sessions and registrations cannot be attributed (C03); Business Suite link clicks and the Facebook Discord invite code are the only action signals.

| KPI | Formula | Source | TARGET |
|---|---|---|---|
| Engagement rate | (reactions + comments + shares + saves) ÷ reach, per post, median per week | Business Suite | Set on 26 Oct from weeks 1–4 median; TARGET is +20% by 22 Nov |
| Link CTR | link clicks ÷ reach, per link post | Business Suite | Used to settle L1 vs L2 in week 5 |
| Facebook sessions | sessions with `utm_source=facebook` | first-party collector (after D-008) | baseline from week of 19 Oct |
| Actions | `registration_complete` with from=facebook or utm_source=facebook + `newsletter_verified` (same) + `discord_join` on the Facebook invite code + `reminder_set` (same) | GA4 (after D-007), bot (after D-011) | baseline from week of 19 Oct |
| **Actions per SC hour** | actions ÷ SC hours logged for Facebook that week | above + SC time log | Compared with Instagram, X and Reddit for the §1 decision |
| Group health | links removed by admins ÷ links posted | Groups sheet | 0; two removals in one group ends links there |
| Group help ratio | non-link contributions ÷ link contributions, per group, rolling 30 days | Groups sheet | ≥ 9 |
| Group referrals | sessions with `utm_medium=community` and `utm_source=facebook` | collector | reported, no target until 22 Nov |
| Reel retention | average watch time ÷ video length | Business Suite | compared with the same video on Instagram and TikTok |
| Comment response time | median time from a comment to a Page reply | manual sample of 10 a week | < 24 h (spine guardrail) |

---

## Dependencies and open questions

**Dependencies**
- C01 / D-001: remove false claims from the site before the Page links to it; the register page still says "15K+ members" [R02].
- D-004: Discord invites; a Facebook-only invite code from SC (C36) and join attribution via D-011.
- C03 / D-007 / D-008 / D-009: GA4 events, UTM capture and the URL helper. Before they ship, Facebook's contribution cannot be measured.
- D-014: `/register?from=facebook` must be honoured; the register page does not currently read `from` (repo check).
- D-017: hub OG images under 300 KB before relying on link previews for `/gta6`.
- D-020: GTA map attribution before the location count appears in any post.
- C09: giveaway status in admin on 28 Sep; share and retweet tasks off for any Facebook-promoted draw; official-rules page; legal view on "account required to enter" and a free alternative entry method [R16 §2.15].
- C57 / D-031: Pixel and CAPI behind consent before any Meta spend.
- DS week-1 capacity: Facebook needs 1 hour of the 10, alongside Instagram and video templates (see 07 and 08).

**Open questions**
- UNKNOWN: current Page followers, post history and any past reach. SC reads Business Suite on 28 Sep; if the Page has a history of off-brand or inflated posts, those are archived as part of C01.
- UNKNOWN: whether the Page and the Instagram account sit in the same Meta Business portfolio. Stories cross-posting and C57 both need it.
- UNVERIFIED: how Facebook treats link posts and link-in-comment in 2026; settled only by the week 1–4 test.
- UNVERIFIED: whether native polls are available on the Page; T8 has a fallback.
- Conflict noted: R07 rated the Facebook Page LOW PRIORITY and Groups EXPERIMENTAL; the spine rates both EXPERIMENTAL. This plan follows the spine and keeps the Page cost near zero by reuse.
- Sub-ID C47a (Facebook Group participation) is new; it sits under C47's community-contribution principle and needs adding to the campaign sheet.
- Who translates Balkan-group posts if SC does not write BCS? UNKNOWN.
