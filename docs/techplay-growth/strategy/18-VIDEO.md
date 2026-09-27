# 18 — Video and Repurposing System

Status: Phase 2 plan — 27 Sep 2026

- **One source, ten outputs.** Every flagship piece runs the same chain: ARTICLE → SOCIAL POST → CAROUSEL → REEL → TIKTOK → SHORT → X → DISCORD → NEWSLETTER → REDDIT ANGLE. The article is written once; everything after it is a template fill, not a new piece of writing [R19 §2–§3].
- **The brief is the hinge.** ED ends each flagship article with a 10-minute repurpose brief (hook, three facts, one number, one question, CTA URL, rights notes, Reddit angle). SC and DS work only from the brief and the article, so nothing downstream invents a fact.
- **One vertical edit, four exports.** Reel, TikTok, YouTube Short and Facebook Reel are the same 1080×1920 master with a different caption, per the spine's "one production" rule for vertical video [SPINE §12, C49].
- **Three flagship chains a week** (Out This Week on Monday, Confirmed or Rumour? on Thursday, Fix It Friday on Friday), plus GTA countdown Shorts and a Wednesday rotation. Show definitions and the Q4 grid are in `09-YOUTUBE.md`.
- **Fits the team:** about 10 h of SC's 25 h and 3 h of DS's 10 h a week in steady state (§5), leaving SC about 15 h for Discord, rituals, the Reddit programme and newsletter assembly. ED adds under 2 h on top of the articles it already writes.
- **Three fully worked examples** with every output's final copy: Out This Week for 19–25 Oct (§6), Fix It Friday on shader compilation stutter (§7), and the GTA 6 Confirmed-or-Rumour ledger for 1 Oct (§8).
- **Rights first:** official press-kit art and TechPlay's own screens by default; no leaks, no re-uploaded trailers, no gameplay capture of a publisher's game until its video policy is logged; human voice only [R17 §10; R19 §4, §6]. Checklist in §9.
- **Minimum viable stack** named by tool, not price (§10). Nothing is bought before the first four weeks show the chain runs on time.

---

## 1. The chain

| # | Output | Platform(s) | Built from | Freshness window | Priority class [SPINE §12] |
|---|---|---|---|---|---|
| 1 | ARTICLE | techplay.gg | Original reporting, calendar, ledger, tested fix | T0 | Primary (Search, Discover) |
| 2 | SOCIAL POST | Facebook Page, Threads, Bluesky | Article hook + link | T0 + 30 min | Experimental |
| 3 | CAROUSEL | Instagram (4:5), reused as Facebook album | Brief facts, template | Same day | Secondary |
| 4 | REEL | Instagram Reels, Facebook Reels | Vertical master | Same day 16:00 or scheduled | Secondary |
| 5 | TIKTOK | TikTok | Same master | Same slot | Secondary |
| 6 | SHORT | YouTube Shorts | Same master | Same slot | Secondary |
| 7 | X | X thread with one image | Brief facts | T0 + 30 min | Secondary |
| 8 | DISCORD | TechPlay Discord channel for the topic | Brief + question | T0 + 1 h | Primary |
| 9 | NEWSLETTER | The Save File, Friday (F21, C40) | One slot, 60–90 words | Next Friday | Primary |
| 10 | REDDIT ANGLE | Relevant subreddit, as a helpful comment | Brief facts, no link by default | When a matching thread appears, within 48 h | Secondary (C47) |

Rules for the chain:

1. **Nothing leaves the chain that is not in the article.** If the Short needs a fact the article lacks, ED adds it to the article first.
2. **Every output carries one CTA and it points to the site** (calendar reminder, ledger, guide, tool) or to Discord. Links carry UTMs per SPINE §9; Discord invites use the campaign's invite code (C36).
3. **Each output is written for its platform.** X gets the facts as a thread, Discord gets a question, Reddit gets an answer with no link, the newsletter gets context the reader did not have on Monday.
4. **Skip rather than pad.** If a chain step has nothing useful to add (a Reddit angle with no matching thread), it is skipped and logged as skipped.

## 2. The repurpose brief (TPL-BRIEF)

ED writes this block at the bottom of the draft (or in the shared brief file) before publishing. Ten minutes, eight fields:

```
BRIEF — {date} — {franchise id} — {article title}
URL: {final URL}
Hook (≤ 12 words, no hype): 
Facts (3, each with source and date):
  1.
  2.
  3.
Number (one figure the Short or X can lead with, with source):
Community question (for Discord and comments):
CTA (one URL + the action): 
Rights notes (which art/footage may be used, credit line, anything not to show):
Reddit angle (subreddit, the question it answers, or "none this week"):
```

## 3. Workflows

### 3.1 Stage table

Times are ESTIMATE for a person working from templates; basis is R19 §2 (30–45 min for a calendar short, 45–60 min for a guide short, 20–30 min for a number card, 10 min for a daily countdown) plus our own allowances for captions and uploads.

| # | Stage | Owner | Time | Template | Output file (example for w43 Out This Week) |
|---|---|---|---|---|---|
| 1 | Article + brief | ED | Article: editorial plan · Brief: 10 min | TPL-BRIEF | `2026-10-19_f01_otw-w43_brief_v1.md` |
| 2 | Social post (3 networks) | SC | 10 min | TPL-S-POST (reuses carousel slide 1) | `2026-10-19_f01_otw-w43_post_4x5_v1.png` |
| 3 | Carousel | DS fill 30–45 min; SC caption 10 min | 40–55 min | TPL-C-OTW / -LEDGER / -FIX / -NUMBER / -ORDER | `2026-10-19_f01_otw-w43_carousel-01_4x5_v1.png` … `-07` |
| 4 | Reel (vertical master edit) | SC | 30–60 min by franchise | TPL-V-OTW / -COUNT / -LEDGER / -FIX / -NUMBER / -VERDICT / -ORDER / -DEMO / -WOW | `2026-10-19_f01_otw-w43_master_9x16_v1.mp4` |
| 5 | TikTok export and caption | SC | 5 min + 5 min upload | same master | `2026-10-19_f01_otw-w43_tiktok_9x16_v1.mp4` |
| 6 | YouTube Short export and caption | SC | 5 min + 5 min upload | same master | `2026-10-19_f01_otw-w43_short_9x16_v1.mp4` |
| 7 | X thread | SC | 15 min | TPL-X (16:9 image) | `2026-10-19_f01_otw-w43_x-01_16x9_v1.png` |
| 8 | Discord post | SC | 10 min | TPL-D (text) | logged in video log |
| 9 | Newsletter slot | SC writes, EIC edits in assembly | 10 min | TPL-N-SLOT | logged |
| 10 | Reddit angle | SC (EIC for data posts, C48) | 15–20 min, reactive | TPL-R-NOTE | logged, with thread URL |
| — | Video log row per output | SC | 2 min each | `video-log` sheet | — |

Total per flagship chain: about 2.5–3.5 h across SC and DS.

### 3.2 Step lists

**Stage 1 — Article and brief (ED)**
1. Publish the article with its CTA block (C46) and correct game-page links.
2. Fill TPL-BRIEF; paste the final URL.
3. Drop the brief into the week's folder and post "brief ready: {title}" in the team channel.

**Stage 2 — Social post (SC)**
1. Build the UTM link with the campaign URL helper (D-009): `utm_source={facebook|threads|bluesky}&utm_medium=organic-social&utm_campaign={cid}-{slug}&utm_content={fid}-post`.
2. Write one version and trim it for Bluesky's shorter limit.
3. Use carousel slide 1 as the image. Alt text from the brief's hook.
4. Post Facebook and Threads natively; Bluesky natively.

**Stage 3 — Carousel (DS, SC)**
1. DS duplicates the franchise template and fills slides from the brief (one fact per slide, source line on every slide with a claim).
2. DS exports 4:5 PNGs with the file names above.
3. SC writes the caption: first line is the hook, then the facts in one short paragraph, then the CTA ("Link in bio" plus the path), one question, three hashtags maximum.
4. SC writes alt text for each slide (the slide's text, in a sentence).
5. SC posts to Instagram, or schedules in Meta's scheduler, and reuses as a Facebook album only if the Facebook Page is active that week.

**Stage 4 — Reel master (SC)**
1. Duplicate the franchise video template; replace text layers from the brief; drop in art from the rights-cleared folder only.
2. Keep every text layer inside the safe area (§4.2).
3. Add the licensed music bed at low level, or none. No VO on Shorts.
4. Check each card is on screen long enough to read aloud twice.
5. Export the 1080×1920 master; watch it once on a phone with sound off.
6. Post to Instagram as a Reel with the Reel caption; cross-post to Facebook Reels where available (CHECK V-04).

**Stage 5 — TikTok (SC)**
1. Upload the same master; do not re-edit.
2. Caption: hook plus two facts plus the path, three to five hashtags.
3. Add the on-platform text title if the upload tool offers it; turn on the platform's auto-captions only as a backup to burned-in text.

**Stage 6 — YouTube Short (SC)**
1. Upload the same master with the title formula from `09-YOUTUBE.md` §6 and the Shorts description template (§7.2 there).
2. Set the related-video link to the matching long-form or playlist where the feature exists (CHECK C-02 in 09).
3. Add to the show's playlist.

**Stage 7 — X (SC)**
1. Thread of three to five posts; post 1 carries the link and the 16:9 image; the rest carry facts, one per post.
2. No hashtags beyond one topic tag where it is standard (#GTA6).
3. Quote-post the first post from the TechPlay account later in the week only if a fact changes.

**Stage 8 — Discord (SC)**
1. Post in the channel the topic belongs to (release news, #gta6, #pc-help, #wow), not everywhere.
2. Lead with the list or the fix, then one question that invites a reply.
3. Link with `utm_source=discord&utm_medium=community`.

**Stage 9 — Newsletter slot (SC, EIC)**
1. Write 60–90 words that add context the Monday reader did not have (what changed, what's next).
2. One link with `utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w{NN}`.

**Stage 10 — Reddit angle (SC)**
1. Read the subreddit's rules and sidebar before the first comment in it; log the rule on links.
2. Answer the question in the comment itself, fully. Link only when the rules allow it and the page adds something the comment cannot (a tool, a full list).
3. Never post the article as a link post from the brand account unless it is a C48 data post approved by EIC.
4. Log the thread URL and whether a link was used.

## 4. Templates, sizes and file naming

### 4.1 Template library (DS builds in w40–w41, about 8 h)

| Template | Size | Used by | Fixed elements | Variable fields |
|---|---|---|---|---|
| TPL-BRIEF | text | all | eight fields (§2) | all |
| TPL-V-OTW | 1080×1920 | F01 | title card, per-game card, end card | week dates, cover, day, title, platform chips, one line |
| TPL-V-COUNT | 1080×1920 | F02 | big number, "days to GTA 6", source strip | number, fact, source |
| TPL-V-LEDGER | 1080×1920 | F03 | stamp set CONFIRMED / REPORTED / RUMOUR / NOT ANNOUNCED | claim, stamp, source, date |
| TPL-V-FIX | 1080×1920 | F07 | problem card, step card with capture window, "won't fix" card | steps, captures |
| TPL-V-NUMBER | 1080×1920 | F04 | number animation, label, source | figure, label, source |
| TPL-V-VERDICT | 1080×1920 | F10 | question card, reasons, YES / WAIT / SKIP stamp | reasons, verdict |
| TPL-V-ORDER | 1080×1920 | F09 | timeline strip, "start here" card | covers, years |
| TPL-V-DEMO | 1080×1920 | F23 | three-demo card, "wishlist / skip" stamp | titles, lines |
| TPL-V-WOW | 1080×1920 | F15 | capture frame, "3 things to fix" card | capture, flags |
| TPL-C-{franchise} | 1080×1350 | carousels | cover slide, fact slide, CTA slide | per slide |
| TPL-X | 1600×900 | X, Bluesky | headline, date strip | headline |
| TPL-S-POST | 1080×1350 | Facebook, Threads | carousel slide 1 | — |
| TPL-L-THUMB-{show} | 1280×720 | long-form | see 09 §5 | text, art |
| TPL-L-CHAPTER, TPL-L-END, TPL-L-LOWER | 1920×1080 | long-form | chapter card, end screen, source lower-third | text |
| TPL-D, TPL-N-SLOT, TPL-R-NOTE | text | Discord, newsletter, Reddit | structure only | copy |

Sizes are working specs; each platform's current requirements are CHECK V-01.

### 4.2 Design rules

- Background `#05070A`; text white; crimson `#DC143C` only for bars, stamps and chips (crimson is 4.04:1 on the background, below the 4.5:1 small-text bar; white on crimson is 4.99:1) (frontend `globals.css`).
- Instrument Sans for headlines, IBM Plex Sans for body, IBM Plex Mono for dates, numbers and source lines. All three are Google Fonts under open licences, the same families the site loads.
- Vertical safe area (working rule, HYPOTHESIS until checked per platform): keep text between 90 and 990 px horizontally and 220 and 1,500 px vertically, clear of the top bar, right-side buttons and bottom caption.
- Minimum on-screen text: 48 px for body lines, 96 px for headlines.
- Source line on every claim card: `Source: {name} · {date}` in Plex Mono, 32 px, 70% white.
- Stamps: CONFIRMED white on crimson; REPORTED white outline; RUMOUR white on dark grey with a dashed border; NOT ANNOUNCED grey outline. The same four styles appear on the site ledger so the two match.

### 4.3 File naming and folders

Pattern: `{publish-date}_{franchise-or-campaign}_{slug}_{asset}_{ratio}_{version}.{ext}`

| Part | Values |
|---|---|
| publish-date | `YYYY-MM-DD` |
| franchise-or-campaign | `f01`…`f24`, or `c50` for long-form |
| slug | short kebab-case: `otw-w43`, `shader-stutter`, `gta6-ledger-1001` |
| asset | `brief`, `article`, `post`, `carousel-01`…, `master`, `tiktok`, `short`, `reel`, `x-01`, `thumb`, `script`, `vo`, `captions-en`, `capture-{what}` |
| ratio | `9x16`, `4x5`, `16x9` (omit for text) |
| version | `v1`, `v2`…; `raw` for unedited captures |

Examples: `2026-10-16_f07_shader-stutter_capture-nvcp_raw.mp4` · `2026-10-30_c50_release-radar-2026-11_master_16x9_v3.mp4` · `2026-10-30_c50_release-radar-2026-11_captions-en_v1.srt`.

Folders: `Video/2026/w{NN}/{franchise}-{slug}/` with `src/` (art, captures), `work/` (project files), `exports/` (final files) and `social/` (captions, thread text). Shared: `Video/_templates/`, `Video/_rights/` (licence and permission records), `Video/_music/` (licensed beds with their licence file).

The `video-log` sheet has one row per output: date, franchise, platform, URL, UTM, sources, rights notes, views at 7 days, link clicks, notes.

## 5. Weekly video batch schedule

### 5.1 Steady-state week (weeks 41, 42, 45; adjust per §5.3)

| Day | Owner | Task | Time |
|---|---|---|---|
| Fri (week before) | ED | Mark next week's six Out This Week picks in the calendar export; write the OTW brief skeleton | 30 min |
| Fri (week before) | SC | Edit next Monday's OTW master from the export | 45 min |
| Fri (week before) | SC | Build next Tue and Sat GTA countdown Shorts from TPL-V-COUNT | 30 min |
| Fri (week before) | DS | Fill the OTW carousel | 45 min |
| Mon | ED | Publish OTW article 09:00; finalise brief | (editorial) + 10 min |
| Mon | SC | Social post, X thread, Discord, Instagram carousel | 45 min |
| Mon | SC | Publish OTW Short on four platforms at 16:00 | 20 min |
| Mon | SC | Schedule Tue and Sat countdown Shorts on four platforms | 20 min |
| Tue | ED | Script the Wednesday rotation Short (number, verdict or order) | 20 min |
| Tue | SC | Edit the rotation Short | 45 min |
| Tue | DS | Rotation assets (number animation, verdict stamp, covers) | 30 min |
| Wed | SC | Publish rotation Short; comment pass across platforms | 35 min |
| Wed | ED | Record the Fix It Friday screen captures while testing the guide; write the 60-second version | 35 min |
| Thu | ED | Ledger status check 09:00 and site update | 20 min + (editorial) |
| Thu | DS | Update ledger cards (carousel and video) | 30 min |
| Thu | SC | CoR Short edit and publish; X, Discord #gta6, social post | 75 min |
| Thu | SC | Edit the Fix It Friday master | 60 min |
| Thu | DS | Fill the Fix It Friday carousel | 45 min |
| Fri | ED | Publish the Fix It Friday guide 09:00 | (editorial) |
| Fri | SC | FIF social post, X, Discord #pc-help, carousel; publish FIF Short 16:00 | 65 min |
| Fri | SC | Three newsletter slots for The Save File | 30 min |
| Fri | SC | Video log and 7-day numbers | 30 min |
| Fri | DS | Template upkeep and fixes found during the week | 30 min |
| Sat | SC | Check the scheduled countdown Short went out | 10 min |
| Across the week | SC | Reddit angles (three chains) | 45 min |
| Across the week | SC | Comment moderation (Mon, Thu, Sat) | 40 min |

### 5.2 Hours against capacity (ESTIMATE)

| Role | Chain work per week | Of which video | Capacity [SPINE §1] | Left for other work |
|---|---|---|---|---|
| SC | ~9.9 h | ~6.1 h | 25 h | ~15 h: Discord rebuild and rituals (C35–C39), Reddit programme (C47), newsletter assembly (C40), X and community replies |
| DS | ~3.0 h | ~1.5 h | 10 h | ~7 h: data-story graphics (C20–C26), OG images, hub visuals |
| ED | ~1.9 h (on top of articles) | ~1.2 h | 40 h | Articles, guides, ledger |
| EIC | ~0.5 h (approvals, policy log) | — | 40 h | — |

### 5.3 Weeks that differ

| Week | Change | Net effect on SC |
|---|---|---|
| w40 (28 Sep–4 Oct) | Setup: DS builds templates (~8 h across w40–w41); SC cleans channels, opens TikTok, answers policy checks, makes one unlisted test Short | No Shorts published |
| w43 (19–25 Oct) | Next Fest Diary: three extra Shorts (Wed 21, Fri 23, Sun 25) at 45 min each; Wednesday rotation dropped; Reddit angle for OTW limited to Next Fest threads | +1.5 h |
| w44 (26 Oct–1 Nov), w46 (9–15 Nov) | Long-form pilot edits (6 h and 8 h, see 09 §10.4); Wednesday rotation dropped; Reddit time halved | +5 h and +7 h; covered by dropping the rotation and half of C47 that week |
| w47 (16–22 Nov) | GTA VI launch: countdown ends; launch Shorts need the team's own play; Fix It Friday may switch to a console settings piece | Carousel for OTW replaced by a single image |
| w52 (21–27 Dec) | Holiday week: OTW and one rotation Short only | −4 h |

## 6. Worked example 1 — Out This Week, 19–25 October (w43)

**Campaign** C04 · **Franchise** F01 · **Publish** Mon 19 Oct 2026 · `utm_campaign=c04-out-this-week` · `utm_content=f01-{asset}-w43`
**Dates used** (all from R05 §1): Steam Next Fest 19–26 Oct (confirmed); PS Plus Extra/Premium October drop 20 Oct (reported); Final Fantasy Resonance, Nintendo Switch Sports Resort, Once Human: Isles of Abyss 22 Oct (confirmed); Call of Duty: Modern Warfare 4 23 Oct on PS5, Xbox, PC and Switch 2, first CoD on a Nintendo platform since Ghosts, not day one on Game Pass (confirmed); campaign early access from 16 Oct (confirmed); next week Scream V Fest 26 Oct–2 Nov, Minecraft Bedrock on Switch 2 27 Oct, Phantom Blade Zero on PS5 and PC 29 Oct.

### 6.1 Brief

```
BRIEF — 2026-10-19 — F01 — Out This Week: Modern Warfare 4, Final Fantasy Resonance and Steam Next Fest (19–25 October)
URL: https://techplay.gg/news/{slug-assigned-by-cms}
Hook: Call of Duty on a Nintendo console again, and a week of free demos.
Facts:
  1. MW4, Fri 23 Oct: PS5, Xbox Series X|S, PC, Switch 2. Not day one on Game Pass. (Activision; Wikipedia)
  2. Steam Next Fest runs until Mon 26 Oct. (Steamworks events page)
  3. Thu 22 Oct: Final Fantasy Resonance, Nintendo Switch Sports Resort, Once Human: Isles of Abyss. (publishers)
Number: 4 platforms for MW4 on day one.
Community question: Which Next Fest demo are you trying first?
CTA: https://techplay.gg/calendar — set a reminder per game.
Rights notes: publisher key art from press sites; Steam capsule art for Next Fest; no gameplay footage.
Reddit angle: Next Fest discussion threads (r/Steam, r/pcgaming) with our first three demo verdicts; no link.
```

### 6.2 Article (ED, final copy)

**Headline:** Out This Week: Modern Warfare 4, Final Fantasy Resonance and Steam Next Fest (19–25 October)
**Dek:** Call of Duty arrives on four platforms on Friday, three games land on Thursday, and Steam's demo festival runs all week.

> Steam Next Fest runs all week, Call of Duty: Modern Warfare 4 arrives on Friday on four platforms including Switch 2, and Thursday brings three releases at once. Next week opens with Steam's Scream V Fest and ends with Phantom Blade Zero.
>
> **All week: Steam Next Fest (until Monday 26 October)**
> Demos for upcoming games are playable on Steam until Monday. We're trying three a day in the Next Fest Diary, and every game we rate has a "Remind me" button, so you hear about it when it actually releases.
>
> **Tuesday 20 October: PlayStation Plus Extra and Premium**
> The October additions are reported for Tuesday, with Mycopunk reported as a day-one addition. We'll confirm the list when Sony publishes it.
>
> **Thursday 22 October: three releases**
> Final Fantasy Resonance from Square Enix, Nintendo Switch Sports Resort, and Once Human: Isles of Abyss from NetEase. Platforms for each are on their game pages.
>
> **Friday 23 October: Call of Duty: Modern Warfare 4**
> MW4 launches on PS5, Xbox Series X|S, PC and Switch 2. It's the first Call of Duty on a Nintendo platform since Ghosts, and it isn't a day-one Game Pass release. Digital pre-order owners have had the campaign since 16 October. On PC, Friday's Fix It Friday covers Secure Boot and TPM, which some anti-cheat systems require.
>
> **Next week**
> Steam Scream V Fest (26 October to 2 November), Minecraft Bedrock Edition on Switch 2 (27 October), and Phantom Blade Zero on PS5 and PC (29 October).
>
> *CTA block (C46):* **Set a reminder on any game above and we'll tell you on release day.** [Open the calendar] · [Join the Discord] · [Get The Save File on Fridays]

The CTA line "we'll tell you on release day" assumes release-day alerts by email and Discord DM go live on 19 Oct (C43). If C43 slips, the line becomes "and it will be waiting in your notifications on release day".

### 6.3 Social post (SC)

- **Facebook:** "Out this week: Modern Warfare 4 on Friday (PS5, Xbox, PC and Switch 2), three releases on Thursday, and a full week of Steam Next Fest demos. Every date, with a reminder button: https://techplay.gg/news/{slug}?utm_source=facebook&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-post-w43"
- **Threads:** "Call of Duty on a Nintendo console for the first time since Ghosts. That's Friday. Thursday has Final Fantasy Resonance, Switch Sports Resort and Once Human: Isles of Abyss. Next Fest demos all week. Full list: {link, utm_source=threads}"
- **Bluesky:** "This week: MW4 on Fri 23 Oct (PS5, Xbox, PC, Switch 2), three releases on Thu 22, Steam Next Fest until Mon 26. Dates and reminders: {link, utm_source=bluesky}"

### 6.4 Carousel (DS fill, SC caption) — 7 slides, TPL-C-OTW

| Slide | On-slide text | Art |
|---|---|---|
| 1 | "Out this week" / "19–25 Oct" / small: "Swipe for dates" | Collage of three official covers |
| 2 | "All week" / "Steam Next Fest" / "Free demos until Mon 26 Oct" / Source: Steamworks | Next Fest capsule art |
| 3 | "Tue 20" / "PS Plus Extra & Premium: October additions" / stamp REPORTED | PlayStation Plus logo from Sony's press site |
| 4 | "Thu 22" / "Final Fantasy Resonance" · "Nintendo Switch Sports Resort" · "Once Human: Isles of Abyss" | Three covers |
| 5 | "Fri 23" / "Call of Duty: Modern Warfare 4" / chips PS5 · Xbox · PC · Switch 2 / "First CoD on Nintendo since Ghosts. Not day one on Game Pass." | MW4 key art |
| 6 | "Next week" / "Scream V Fest 26 Oct" · "Minecraft Bedrock on Switch 2, 27 Oct" · "Phantom Blade Zero, 29 Oct" | Phantom Blade Zero key art |
| 7 | "Set a reminder" / "techplay.gg/calendar" / "We'll tell you on release day." | TechPlay mark on crimson |

**Caption:** "Modern Warfare 4 on Friday, three games on Thursday, Steam Next Fest all week. Every date is on the TechPlay calendar with a reminder button (link in bio: techplay.gg/calendar). Which Next Fest demo are you trying first? #newgames #callofduty #steamnextfest"
**Alt text, slide 5:** "Friday 23 October: Call of Duty: Modern Warfare 4 on PS5, Xbox, PC and Switch 2. First Call of Duty on a Nintendo platform since Ghosts. Not day one on Game Pass."

### 6.5 Vertical master (Reel / TikTok / Short), 40 s, TPL-V-OTW, no VO

| Time | On screen | Art |
|---|---|---|
| 0:00–0:03 | "Out this week" · "19–25 Oct" | Collage |
| 0:03–0:08 | "All week: Steam Next Fest" · "Free demos until 26 Oct" | Next Fest art |
| 0:08–0:12 | "Tue 20: PS Plus Extra & Premium additions" · REPORTED | Logo |
| 0:12–0:16 | "Thu 22: Final Fantasy Resonance" | Cover |
| 0:16–0:20 | "Thu 22: Nintendo Switch Sports Resort" | Cover |
| 0:20–0:24 | "Thu 22: Once Human: Isles of Abyss" | Cover |
| 0:24–0:33 | "Fri 23: Modern Warfare 4" · PS5 · Xbox · PC · Switch 2 · "First CoD on Nintendo since Ghosts" | Key art, slow push-in |
| 0:33–0:37 | "Next week: Phantom Blade Zero, 29 Oct" | Key art |
| 0:37–0:40 | "Reminders: techplay.gg/calendar" | End card |

Audio: licensed music bed at −20 dB or silence. Captions are the on-screen text.

- **Instagram Reel caption:** "Out this week, 19–25 Oct. MW4 on Friday, three releases Thursday, Next Fest all week. Reminders at techplay.gg/calendar (link in bio). #newgames #callofduty #nextfest"
- **Facebook Reel caption:** "This week's releases in 40 seconds. Set reminders: techplay.gg/calendar"
- **TikTok caption:** "Games out this week (19–25 Oct): Modern Warfare 4 on 4 platforms incl. Switch 2, Final Fantasy Resonance, Switch Sports Resort, Once Human: Isles of Abyss, and Steam Next Fest all week. #gaming #newgames #callofduty #mw4 #steamnextfest"
- **YouTube Short title:** "Out this week: MW4, Final Fantasy Resonance, Next Fest (19–25 Oct)"
- **YouTube Short description:** "The week's releases with dates and platforms. Full list with reminders: techplay.gg/calendar · Sources: publisher pages, Steamworks events · #mw4 #nextfest"

### 6.6 X thread (SC)

1. "Out this week (19–25 Oct): Modern Warfare 4 on Friday, three games on Thursday, Steam Next Fest all week. Dates and reminders: https://techplay.gg/news/{slug}?utm_source=x&utm_medium=organic-social&utm_campaign=c04-out-this-week&utm_content=f01-x-w43" [image: TPL-X]
2. "Fri 23: Call of Duty: Modern Warfare 4. PS5, Xbox Series X|S, PC and Switch 2. First CoD on a Nintendo platform since Ghosts. Not day one on Game Pass."
3. "Thu 22: Final Fantasy Resonance, Nintendo Switch Sports Resort, Once Human: Isles of Abyss."
4. "All week: Steam Next Fest, until Mon 26 Oct. We're trying three demos a day and posting short verdicts in the Next Fest Diary."
5. "Next week: Scream V Fest from 26 Oct, Minecraft Bedrock on Switch 2 on 27 Oct, Phantom Blade Zero on 29 Oct."

### 6.7 Discord (SC, release channel; #announcements until C35 creates one)

> **Out this week · 19–25 Oct**
> **Fri 23** Call of Duty: Modern Warfare 4 (PS5, Xbox Series X|S, PC, Switch 2)
> **Thu 22** Final Fantasy Resonance · Nintendo Switch Sports Resort · Once Human: Isles of Abyss
> **Tue 20** PS Plus Extra/Premium October additions (reported)
> **All week** Steam Next Fest, until Mon 26 Oct
>
> Which demo are you trying first? Post it in #what-are-you-playing and the best finds go into Friday's diary.
> Reminders: <https://techplay.gg/calendar?utm_source=discord&utm_medium=community&utm_campaign=c04-out-this-week&utm_content=f01-discord-w43>

### 6.8 Newsletter slot (The Save File, Fri 23 Oct, week 43)

> **Out today, and still running**
> Modern Warfare 4 is out today on PS5, Xbox, PC and Switch 2, the first Call of Duty on a Nintendo platform since Ghosts. If you're playing on PC, today's Fix It Friday covers the Secure Boot setting some anti-cheat systems ask for. Steam Next Fest runs until Monday, and every demo we've tried so far is rated in the diary. Next Thursday: Phantom Blade Zero.
> [This week's dates and reminders →](https://techplay.gg/news/{slug}?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w43&utm_content=f01-slot)

### 6.9 Reddit angle (SC, C47)

- **Where:** Next Fest discussion threads in r/Steam or r/pcgaming, if the subreddit runs one (check the sidebar first; both were in the R06 sample).
- **Comment (no link):** "Tried three so far. {Demo A}: {one honest line, what works and what doesn't}. {Demo B}: {line}. {Demo C}: {line}. First-run stutter in {Demo X} went away on the second run, so it's worth replaying the first section before judging it."
- **Where not:** no link post of the article in r/gaming or r/Games; R06 found their top posts are visual and community-made, and a publisher link is the wrong register [R06 exec §6].

## 7. Worked example 2 — Fix It Friday: shader compilation stutter (Fri 16 Oct, w42)

**Campaign** C60 (PC Fix Hub, launched 12 Oct) · **Franchise** F07 · `utm_campaign=c60-pc-fix-hub` · `utm_content=f07-{asset}-shader`
**Why this topic:** "shader compilation stutter fix" had no PC Gamer, IGN or Game Rant result on page one on 27 Sep; utility blogs and micro-sites held it [R09 EA-001]. The week before Next Fest, when players start many first-run demos, is the natural moment.
**Accuracy rule:** the technical steps below are the editor's draft. ED tests each on a TechPlay PC, records the driver and Steam client versions in the article's "Tested on" line, and cuts any step that cannot be reproduced. Menu paths are copied from the screen on test day, not from this plan.

### 7.1 Brief

```
BRIEF — 2026-10-16 — F07 — Shader compilation stutter: what it is and what actually helps
URL: https://techplay.gg/guides/pc-fixes/shader-compilation-stutter
Hook: The first-time hitch that goes away on the second run, explained.
Facts:
  1. Stutter the first time an effect appears, smooth the second time = shader compilation. (Tested; engine docs linked in guide)
  2. A driver or game update clears the cache, so the stutter can come back once. (Tested)
  3. Steam's Shader Pre-Caching mostly helps Vulkan and OpenGL games, not DirectX 12. (Steam settings, checked on test day)
Number: none.
Community question: Which game stutters worst for you, and does it stop on the second run?
CTA: the full guide; Discord #pc-help for specific cases.
Rights notes: screen captures of Windows, NVIDIA Control Panel, AMD Software and Steam settings only; no game footage.
Reddit angle: r/pcgaming and r/pcmasterrace threads reporting first-run stutter in a new UE5 release or Next Fest demo.
```

### 7.2 Article (ED, final copy for the guide body)

**Title:** Shader compilation stutter: what it is and what actually helps (2026)
**Dek:** Why a new game hitches the first time you see something, how to tell it from other stutter, and five things worth checking.

> **Short answer:** shader compilation stutter is a brief freeze the first time your PC draws a new effect, because the game is building that shader on the spot. It usually fades as you play, because compiled shaders are cached. The steps below make it happen less often or earlier. None of them can remove it from a game that doesn't precompile.
>
> **Is it shader stutter?**
> - A short freeze the first time you see a new effect, enemy or area, and the same moment is smooth the second time: shader compilation.
> - A hitch in the same place every time, often when you enter a new area: that's asset streaming (traversal stutter). These steps won't fix it.
> - Frame times that are uneven all the time: that's frame pacing. See our micro-stutter guide.
>
> **1. Let the game finish compiling shaders.** Many DirectX 12 and Unreal Engine 5 games compile shaders on first launch or after an update, usually behind a progress bar. Let it reach 100% before you play. Skipping it moves the work into gameplay.
>
> **2. Expect it once more after an update.** A new GPU driver or a game patch invalidates the cache, so the first session afterwards can stutter again. That's normal and it settles.
>
> **3. Give the shader cache room.** On NVIDIA, the Shader Cache Size setting in NVIDIA Control Panel should not be set to Disabled; Driver Default is fine. On AMD, leave the shader cache setting in AMD Software on its default. (Exact menu paths are in the screenshots, taken on {test date} with driver {version}.)
>
> **4. Turn on Steam's Shader Pre-Caching.** It's in Steam's settings under Downloads. It mostly helps Vulkan and OpenGL games, so it won't do much for a DirectX 12 title, but it costs nothing to leave on.
>
> **5. Install the game on an SSD.** It won't stop compilation hitches, but it removes the streaming stutter that often arrives with them.
>
> **What doesn't help:** deleting the shader cache to "clean" it (everything has to compile again; only do it if the game's support tells you to), and capping the frame rate (smoother pacing, same hitches).
>
> **Playing Next Fest demos?** Every demo is a first run, so every shader is new. If a demo stutters in its first minutes, play the same section again before you judge it.
>
> *Tested on: {CPU, GPU, RAM, Windows build, driver version} · Last checked: 16 Oct 2026 · Seeing something different? Tell us in Discord #pc-help.*

### 7.3 Social post (SC)

- **Facebook:** "If a new PC game hitches the first time you see something and is smooth the second time, that's shader compilation stutter. What it is, how to tell it from other stutter, and five things worth checking: {link, utm_source=facebook, utm_content=f07-post-shader}"
- **Threads:** "Stutters the first time, smooth the second time? That's the game compiling shaders as you play. Here's what actually helps (and what doesn't): {link, utm_source=threads}"
- **Bluesky:** "Shader compilation stutter, explained: why a new game hitches once and then doesn't, and five things to check before blaming your GPU. {link, utm_source=bluesky}"

### 7.4 Carousel — 6 slides, TPL-C-FIX

| Slide | On-slide text |
|---|---|
| 1 | "Fix It Friday" / "Stutters the first time, smooth the second?" / "That's shader compilation." |
| 2 | "Is it shader stutter?" / "Once, then gone: shaders" · "Same spot every time: streaming" · "Uneven all the time: frame pacing" |
| 3 | "1. Let it finish" / "If the game compiles shaders at launch, wait for 100%." |
| 4 | "2. Cache on" / "NVIDIA shader cache: not Disabled." · "AMD: leave the default." · "Steam: Shader Pre-Caching on (helps Vulkan/OpenGL)." |
| 5 | "What doesn't help" / "Deleting the cache" · "Capping FPS" |
| 6 | "Full guide, tested settings" / "techplay.gg/guides/pc-fixes" |

**Caption:** "The first-time hitch that disappears on the second run is your PC compiling shaders. Five checks and two myths in the full guide (link in bio: techplay.gg/guides/pc-fixes). Which game does it worst for you? #pcgaming #pcfix #stutter"

### 7.5 Vertical master, 55 s, TPL-V-FIX, no VO, screen capture

| Time | On screen | Visual |
|---|---|---|
| 0:00–0:04 | "Stutters the first time, smooth the second?" | Problem card |
| 0:04–0:10 | "That's shader compilation. Here's what helps." | Card |
| 0:10–0:18 | "1. Let the shader step finish before playing" | Capture: a generic compile progress bar from a game we have rights to show, or a mock-up card |
| 0:18–0:27 | "2. NVIDIA: Shader Cache Size ≠ Disabled" | Capture: NVIDIA Control Panel |
| 0:27–0:34 | "AMD: leave shader cache on default" | Capture: AMD Software |
| 0:34–0:42 | "3. Steam: Shader Pre-Caching on (Vulkan/OpenGL)" | Capture: Steam settings |
| 0:42–0:48 | "Won't help: deleting the cache, capping FPS" | "Won't fix" card |
| 0:48–0:55 | "Tested steps: techplay.gg/guides/pc-fixes" | End card |

- **TikTok caption:** "PC game stutters the first time you see something, then it's fine? That's shader compilation. 3 settings to check, 2 things that don't help. Full tested guide: techplay.gg/guides/pc-fixes #pcgaming #pctips #stutter #nvidia #steam"
- **Instagram Reel caption:** "Fix It Friday: shader compilation stutter in 55 seconds. Tested steps in the full guide, link in bio."
- **Facebook Reel caption:** "Why new PC games hitch once and then don't, and what to check. Full guide: techplay.gg/guides/pc-fixes"
- **YouTube Short title:** "Shader compilation stutter on PC: 5-step fix"
- **YouTube Short description:** "What shader stutter is, how to tell it from traversal stutter, and the settings worth checking. Full guide: techplay.gg/guides/pc-fixes · Tested on {spec}, 16 Oct 2026 · #pcgaming #stutter"

### 7.6 X thread (SC)

1. "Fix It Friday: shader compilation stutter. If a game hitches the first time you see something and is smooth the second time, this is why, and what helps: {link, utm_source=x, utm_content=f07-x-shader}" [image]
2. "Tell it apart: once then gone = shaders. Same spot every time = streaming (traversal stutter). Uneven all the time = frame pacing. The fixes are different."
3. "What helps: let the game's shader step finish; keep the NVIDIA/AMD shader cache on; turn on Steam's Shader Pre-Caching (mainly Vulkan/OpenGL); install on an SSD."
4. "What doesn't: deleting the cache to 'clean' it, and capping FPS. Expect one rough session after any driver or game update."

### 7.7 Discord (SC, #pc-help)

> **Fix It Friday: shader compilation stutter**
> Hitches the first time you see something, smooth the second time? That's the game compiling shaders. Quick checks:
> 1. Let the in-game shader step finish before playing
> 2. NVIDIA shader cache not Disabled · AMD cache on default
> 3. Steam → Downloads → Shader Pre-Caching on (mostly Vulkan/OpenGL)
> 4. Game on an SSD
> Full guide with screenshots: <https://techplay.gg/guides/pc-fixes/shader-compilation-stutter?utm_source=discord&utm_medium=community&utm_campaign=c60-pc-fix-hub&utm_content=f07-discord-shader>
> Stuck on a specific game? Post the game, your GPU and driver version here and we'll look at it.

### 7.8 Newsletter slot (The Save File, Fri 16 Oct, week 42)

> **Fix It Friday: the first-run hitch**
> Next Fest starts Monday, and every demo you try is a first run, which is exactly when shader compilation stutter shows up. This week's guide explains how to tell it from other stutter, the four settings worth checking, and the two "fixes" that make it worse. Tested on a mid-range PC, with the driver version written down.
> [Read the guide →](https://techplay.gg/guides/pc-fixes/shader-compilation-stutter?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w42&utm_content=f07-slot)

### 7.9 Reddit angle (SC)

- **Where:** r/pcgaming or r/pcmasterrace threads where someone reports stutter in a new release or a demo (both in the R06 sample; read each sub's rules on links first).
- **Comment (full answer, no link by default):** "If it's a short freeze the first time something appears and it's smooth when you go back, that's shader compilation, not your hardware. Check the game finished its shader step if it has one, make sure your NVIDIA shader cache isn't set to Disabled (or AMD's isn't changed from default), and expect one rough session after any driver update. If it hitches in the same spot every time, that's streaming, and it's the game, not your settings."
- Link to the guide only if someone asks for screenshots and the sub allows links.

## 8. Worked example 3 — GTA 6: Confirmed or Rumour?, 1 October (C07 launch)

**Campaign** C07 · **Franchise** F03 · Ledger published Thu 1 Oct 2026 on `/gta6/everything-we-know`; the first vertical version publishes Thu 8 Oct, when the Shorts system is running, re-checked that morning · `utm_campaign=c07-gta6-ledger` · `utm_content=f03-{asset}-1001`
**Days to launch:** 49 on 1 Oct; 42 on 8 Oct.
**Statuses** are taken from the R17 ledger as of 27 Sep 2026. ED re-checks every line against its source on the morning of publication; a status only changes when a primary source changes it.

### 8.1 Brief

```
BRIEF — 2026-10-01 — F03 — GTA 6: confirmed or rumour? (1 October)
URL: https://techplay.gg/gta6/everything-we-know#ledger
Hook: What's actually confirmed about GTA 6, 49 days out, with a source for every line.
Facts:
  1. 19 Nov 2026 on PS5 and Xbox Series X|S; no PC at launch. (Rockstar Newswire; IGN 4 May 2026)
  2. $79.99, Ultimate $99.99; "a single-player experience" at launch. (IGN 24 Jun 2026)
  3. GTA Online for VI in 2027 is a rumour. (The Mirror 18 Sep 2026)
Number: 49 days.
Community question: Which claim do you want us to check next?
CTA: the ledger on /gta6/everything-we-know; reminder on /games/grand-theft-auto-vi.
Rights notes: Rockstar official screenshots and logo only, credited; no leaked material; no trailer re-upload.
Reddit angle: r/GTA6 questions of the form "is X confirmed?"; answer with source and date, no link post.
```

### 8.2 Ledger update (ED, final copy for the page)

> **GTA 6: confirmed or rumour?** Updated Thursday 1 October 2026 · 49 days to launch
> Every claim below has a status and a source. We change a status only when a primary source changes it. Something missing? Tell us in Discord #gta6.
>
> **New this week (21–30 September)**
> - Rockstar's new modding guidelines, which rule out story expansions, ports and map mashups, were reported by Eurogamer and Rock Paper Shotgun on 21 September. **Reported.**
> - A Switch 2 version: former developers have commented, but nothing has been announced. **Not announced.**
> - Sales "heavily skewed" to PS5 was reported by Pure Xbox on 24 September, and Xbox responded. **Reported.**

| Status | Claim | Source |
|---|---|---|
| CONFIRMED | Release on 19 November 2026 on PS5 and Xbox Series X\|S | Rockstar Newswire; Xbox store |
| CONFIRMED | $79.99; Ultimate Edition $99.99 | IGN, 24 Jun 2026 |
| CONFIRMED | "A single-player experience" at launch | IGN, 24 Jun 2026 |
| CONFIRMED | No PC version at launch | IGN on Take-Two's CEO, 4 May 2026 |
| CONFIRMED | Pre-orders open since 25 June; Vintage Vice City Pack bonus | Rockstar Newswire |
| CONFIRMED | GTA VI: The Album, with Atlantic Records, on 19 November | Rockstar Newswire |
| CONFIRMED | "The Goodtime State – Vice City Collection" set, about $400, does not include the game | Rockstar Newswire; GameSpot; Eurogamer |
| CONFIRMED | "An Extended Look" gameplay video was captured on PS5 | Rockstar Newswire |
| REPORTED | Limited-edition GTA VI DualSense | Game Informer, 3 Sep 2026 |
| REPORTED | New modding guidelines | Eurogamer; Rock Paper Shotgun, 21 Sep 2026 |
| REPORTED | 30 fps on consoles at launch, no performance mode promised | Tom's Hardware, 29 Aug 2026 |
| REPORTED | Netflix preview drove 100,000+ sign-ups in six hours | GamesIndustry.biz, 10 Sep 2026 |
| REPORTED | Sales skewed to PS5; Xbox responded | Pure Xbox, 24 Sep 2026 |
| RUMOUR | GTA Online for GTA VI in 2027 | The Mirror, 18 Sep 2026 |
| NOT ANNOUNCED | PC release date | — |
| NOT ANNOUNCED | Switch 2 version | Ex-developer commentary only (GamesRadar+, Wccftech, 25 Sep 2026) |

> *CTA:* **Get a reminder on launch day** → `/games/grand-theft-auto-vi` · **Join #gta6 on Discord**

### 8.3 Social post (SC)

- **Facebook:** "GTA 6 is 49 days away. Here's what Rockstar has actually confirmed, what's only been reported, and what's still a rumour, with a source on every line: {link, utm_source=facebook, utm_content=f03-post-1001}"
- **Threads:** "49 days to GTA 6. Confirmed: 19 Nov, PS5 and Xbox, $79.99, single-player at launch, no PC at launch. Rumour: GTA Online in 2027. The full ledger with sources: {link, utm_source=threads}"
- **Bluesky:** "GTA 6 ledger, 1 Oct: 8 things confirmed, 5 reported, 1 rumour, 2 not announced. Every line sourced. {link, utm_source=bluesky}"

### 8.4 Carousel — 8 slides, TPL-C-LEDGER

| Slide | Stamp | On-slide text | Source line |
|---|---|---|---|
| 1 | — | "GTA 6: confirmed or rumour?" / "1 Oct · 49 days to go" | — |
| 2 | CONFIRMED | "19 Nov 2026 · PS5 and Xbox Series X\|S" | Rockstar Newswire |
| 3 | CONFIRMED | "$79.99 · Ultimate $99.99" | IGN · 24 Jun 2026 |
| 4 | CONFIRMED | "Single-player at launch · No PC at launch" | IGN · 24 Jun / 4 May 2026 |
| 5 | CONFIRMED | "The $400 Vice City Collection doesn't include the game" | Rockstar Newswire |
| 6 | REPORTED | "30 fps on consoles at launch" | Tom's Hardware · 29 Aug 2026 |
| 7 | RUMOUR / NOT ANNOUNCED | "GTA Online in 2027: rumour" · "PC date, Switch 2: not announced" | The Mirror · 18 Sep 2026 |
| 8 | — | "Full ledger, every source" / "techplay.gg/gta6" | — |

**Caption:** "49 days to GTA 6. Confirmed, reported, rumour: we label every claim and link the source, and we only change a status when Rockstar or a primary source does. Full ledger: techplay.gg/gta6 (link in bio). Which claim should we check next? #GTA6 #GTAVI"

### 8.5 Vertical master, 40 s, TPL-V-LEDGER (publishes Thu 8 Oct)

| Time | On screen |
|---|---|
| 0:00–0:04 | "GTA 6: confirmed or rumour?" · "8 Oct · 42 days" |
| 0:04–0:10 | CONFIRMED · "19 Nov · PS5 · Xbox Series X\|S" · Source: Rockstar Newswire |
| 0:10–0:15 | CONFIRMED · "$79.99 · Ultimate $99.99" · Source: IGN, 24 Jun 2026 |
| 0:15–0:20 | CONFIRMED · "No PC at launch" · Source: IGN, 4 May 2026 |
| 0:20–0:26 | REPORTED · "30 fps on consoles" · Source: Tom's Hardware, 29 Aug 2026 |
| 0:26–0:31 | RUMOUR · "GTA Online in 2027" · Source: The Mirror, 18 Sep 2026 |
| 0:31–0:36 | NOT ANNOUNCED · "Switch 2 version" |
| 0:36–0:40 | "Every source: techplay.gg/gta6" |

If a status changed between 1 and 8 Oct, the changed card moves to second position and gets the label "Changed this week".

- **TikTok caption:** "GTA 6 in 42 days. What's confirmed vs reported vs rumour, with sources. We don't do leaks. #gta6 #gtavi #gta #rockstargames #vicecity"
- **Instagram Reel caption:** "Confirmed or rumour, 42 days out. Sources on every card; full ledger in bio."
- **Facebook Reel caption:** "GTA 6: what's confirmed and what isn't, 42 days before launch. techplay.gg/gta6"
- **YouTube Short title:** "GTA 6: confirmed or rumour? (8 Oct)"
- **YouTube Short description:** "What Rockstar has confirmed about GTA VI, what's only reported, and what's rumour, 42 days out. Every source: techplay.gg/gta6 · #GTA6"

### 8.6 X thread (SC)

1. "GTA 6, 49 days out: what's confirmed, what's reported, what's rumour. Every line has a source. {link, utm_source=x, utm_content=f03-x-1001} #GTA6" [image]
2. "Confirmed: 19 Nov on PS5 and Xbox Series X|S. $79.99, Ultimate $99.99. Single-player at launch. No PC at launch. (Rockstar Newswire; IGN)"
3. "Reported, not confirmed by Rockstar: 30 fps on consoles at launch (Tom's Hardware, 29 Aug), a limited DualSense (Game Informer, 3 Sep), new modding guidelines (Eurogamer/RPS, 21 Sep)."
4. "Rumour: GTA Online for VI in 2027 (The Mirror, 18 Sep). Not announced: a PC date, a Switch 2 version. We'll update every Thursday."

### 8.7 Discord (SC, #gta6)

> **GTA 6 ledger · 1 Oct · 49 days**
> ✅ Confirmed: 19 Nov · PS5 + Xbox Series X|S · $79.99 / $99.99 · single-player at launch · no PC at launch
> Reported: 30 fps on consoles · limited DualSense · new modding rules
> Rumour: GTA Online in 2027
> Not announced: PC date · Switch 2
> Full list with sources: <https://techplay.gg/gta6/everything-we-know?utm_source=discord&utm_medium=community&utm_campaign=c07-gta6-ledger&utm_content=f03-discord-1001>
> Seen a claim you want checked? Drop the link here and we'll look at it before next Thursday.

(One emoji, as the only one in the post.)

### 8.8 Newsletter slot (The Save File, first issue, Fri 2 Oct, week 40)

> **GTA 6, 48 days out: what's actually confirmed**
> We started a ledger: every GTA 6 claim with a status (confirmed, reported, rumour, not announced) and a source. Short version: 19 November on PS5 and Xbox Series X|S, $79.99, single-player at launch, no PC at launch. The 30 fps report is still only a report, and GTA Online in 2027 is still a rumour. We update it every Thursday.
> [See the ledger →](https://techplay.gg/gta6/everything-we-know?utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w40&utm_content=f03-slot)

### 8.9 Reddit angle (SC)

- **Where:** r/GTA6 (in the R06 sample; its top posts are detail-spotting, map-size videos and countdown threads [R17 §5]). Read the rules on links and news posts first.
- **Comment template for "Is X confirmed?" questions:** "Not confirmed by Rockstar yet. The {claim} comes from {outlet} on {date}. What Rockstar has confirmed so far: 19 Nov on PS5 and Xbox Series X|S, $79.99 / $99.99 Ultimate, single-player at launch, and no PC at launch (Take-Two's CEO, via IGN on 4 May)."
- No link posts of the ledger. If the subreddit keeps a pinned FAQ or megathread and allows it, SC may offer the ledger as a sourced list, once.

## 9. Rights checklist

Tick every line before an output leaves `exports/`. Anything unticked goes back to the editor.

| # | Check | Default rule |
|---|---|---|
| 1 | Art source | Official press-kit or newsroom art (Rockstar Newswire, publisher press sites, platform press pages), or TechPlay's own screens. Credit line in the description or on the card |
| 2 | Leaks | Nothing leaked, datamined or "found", ever; Rockstar is actively policing its IP (modding guidelines 21 Sep; a GTA V leak story ran 18 Sep) [R17 §10] |
| 3 | Trailers | No re-uploads of official trailers. Clips only in long-form, only as long as the point needs, with commentary over them, and only after the publisher's policy is logged (09 check C-13) |
| 4 | Gameplay capture | None of a publisher's game until its video policy is read and logged in `_rights/` (Nintendo Game Content Guidelines, Rockstar/Take-Two, Blizzard, Bethesda, Activision) [R19 §4] |
| 5 | Next Fest demos | Short capture only where the developer's press kit or store page allows it; otherwise capsule art and store screenshots |
| 6 | Steam assets | Capsule art and store screenshots used to identify the game, linked to its store or TechPlay page; Valve's asset terms checked once and logged |
| 7 | Third-party software screens | Windows, NVIDIA, AMD and Steam settings screens for instruction only; no vendor logos used as endorsement |
| 8 | Logos and names | Used only to identify the product (platform chips, game names); no implied partnership |
| 9 | GTA 6 map | May be shown; must not be called TechPlay's own dataset until gtadb.org attribution is settled (D-020); mention that 211 of 1,058 locations are flagged unconfirmed |
| 10 | GTA 6 vehicles | No "real-world equivalent" claims until C12 has filled the fields with sources |
| 11 | Giveaways | No giveaway mention until verified in admin (C09); no "share to enter" mechanics in video copy [R23 §C18] |
| 12 | Music | One licensed source whose licence covers every platform we post to (licence file in `_music/`); otherwise silence. Business-account music rules per platform are CHECK V-03 |
| 13 | Fonts | Instrument Sans, IBM Plex Sans, IBM Plex Mono (open licences) only |
| 14 | People | No member names, avatars or libraries without written opt-in (F19); Discord and Reddit usernames blurred in screenshots |
| 15 | Voice | Human voice only in Q4; no AI voice or synthetic presenter (09 check C-12) |
| 16 | Claims | Every factual card has a source line; statuses match the site ledger; no member counts, "thousands", "biggest", "#1" or "benchmarks" [SPINE §2] |
| 17 | Content ID | Any claim or dispute is logged in the video log within 48 h and reviewed by EIC |

### 9.1 Platform checks for cross-posting (not researched) [R19 §6]

| ID | Question | Default until answered | Owner | Due |
|---|---|---|---|---|
| V-01 | Current upload specs per platform (aspect, resolution, length, file size) | 1080×1920, ≤ 60 s, H.264 | SC | 2 Oct |
| V-02 | TikTok's US operating status and recommendation documentation in 2026 | Post to TikTok but judge it on its own numbers at the 16 Nov review | EIC | 2 Oct |
| V-03 | Music rules for business accounts on TikTok, Instagram and YouTube | Silence or one cross-platform licensed library | SC | 2 Oct |
| V-04 | Instagram → Facebook Reels cross-posting and scheduling in Meta's tools | Post natively to both | SC | 2 Oct |
| V-05 | Instagram's treatment of Reels versus carousels, and link handling | Post both; link in bio | SC | 16 Oct |
| V-06 | Native scheduling availability for TikTok on our account type | Publish manually at 16:00 | SC | 2 Oct |
| V-07 | Synthetic-media and AI-content labels on TikTok, Instagram and Facebook | Not applicable while we use no AI voice or visuals | EIC | 11 Jan 2027 |

## 10. Minimum viable stack

Named tools, no prices. EIC confirms the plan tier of each at sign-up; nothing paid is added before the 2 Nov review shows the chain runs on schedule.

| Job | Tool | Why this one |
|---|---|---|
| Templates and carousels | Canva or Figma (pick one, not both) | R19 names Canva for template-driven video; one tool keeps templates in one place [R19 §2] |
| Vertical and long-form editing | CapCut desktop (DaVinci Resolve as the alternative for long-form) | Template editing, auto-captions to correct, 9:16 and 16:9 exports [R19 §2] |
| Screen capture | OBS Studio | Captures TechPlay pages and settings screens at 1080p |
| Voice-over | Audacity and one USB microphone, recorded in a quiet room | Long-form VO only; noise reduction and levelling |
| Captions | Editor's auto-captions, corrected by hand; `.srt` uploaded for long-form | Burned-in text on Shorts; files for YouTube |
| Scheduling | YouTube Studio, Meta's scheduler for Instagram and Facebook, native posting for TikTok, X and Bluesky | No third-party scheduler until volume justifies it |
| Links | Campaign URL helper (D-009) and the `video-log` sheet | UTMs per SPINE §9 |
| Discord attribution | Campaign invite codes logged in the invite sheet; bot reads joins (D-011) | `discord_join` by code |
| Storage | One shared drive with the folder structure in §4.3 | Templates, rights records and exports together |
| Art sources | Publisher press sites and newsrooms, Rockstar Newswire, platform press pages, Steam store assets, TechPlay's own OG and cover data | See §9 |

## 11. QA before publishing (every output)

1. Every date matches the calendar or the ledger, and the day of the week is right (19 Oct is a Monday; 19 Nov is a Thursday).
2. Every game name is spelled as its publisher spells it (Modern Warfare 4, Final Fantasy Resonance, Once Human: Isles of Abyss).
3. Platform chips match the game page.
4. Every claim card has a source line; every REPORTED or RUMOUR item carries its stamp.
5. UTMs are present and lower-case, and the link resolves (open it on a phone).
6. Text sits inside the safe area; nothing is covered by platform buttons.
7. Burned-in text is readable with the sound off.
8. No banned phrases (SPINE §0), no fake urgency, at most one emoji.
9. Alt text is written for every carousel slide.
10. The rights checklist (§9) is ticked and the video log row is filled.

## 12. Measurement

| Output | utm_source | utm_medium | utm_campaign | utm_content pattern |
|---|---|---|---|---|
| Social post | facebook / threads / bluesky | organic-social | `{cid}-{slug}` (e.g. `c04-out-this-week`) | `{fid}-post-{tag}` |
| Carousel | instagram | organic-social | same | `{fid}-carousel-{tag}` |
| Reel | instagram / facebook | organic-social | same | `{fid}-reel-{tag}` |
| TikTok | tiktok | organic-social | same | `{fid}-tiktok-{tag}` |
| Short | youtube | organic-social | same | `{fid}-short-{tag}` |
| Long-form | youtube | organic-social | `c50-release-radar`, `c50-gta-in-order` | `{show}-desc`, `-desc-2`… |
| X | x | organic-social | same | `{fid}-x-{tag}` |
| Discord | discord | community | same | `{fid}-discord-{tag}` |
| Newsletter | newsletter | email | `c40-save-file-2026w{NN}` | `{fid}-slot` |
| Reddit (when a link is used) | reddit | community | same | `{fid}-reddit-{tag}`; `utm_term={subreddit}` |

Vertical outputs mostly send people via on-screen paths and bio links, which carry no UTMs; until vanity redirects exist (09, open question 1), vertical video is judged on platform metrics plus the change in direct and bio-link sessions on the day of posting. Weekly review uses: outputs published versus planned, 7-day views per output, link sessions by `utm_content`, and the downstream events `reminder_set`, `tool_run`, `registration_complete` and `discord_join` [SPINE §10].

## Dependencies and open questions

**Dependencies**
- `09-YOUTUBE.md`: show definitions, Q4 grid, pilots, YouTube policy checks C-01 to C-13.
- C03 / D-007, D-008, D-009: key events, UTM capture and the URL helper; without them only platform metrics exist.
- C35 / C36 / D-011: Discord channels named in the examples (#gta6, #pc-help, #what-are-you-playing) and campaign invite codes.
- C40: The Save File's first issue on Fri 2 Oct carries the ledger slot (§8.8).
- C43: release-day alerts by email and Discord DM on 19 Oct, or the Out This Week CTA copy changes (§6.2).
- C46 / D-010: the article-end CTA block used in every example article.
- C60: the PC Fix Hub at `/guides/pc-fixes` by 12 Oct and one tested guide each Friday.
- C07: the ledger section on `/gta6/everything-we-know` by 1 Oct, with the four stamp styles matching the video templates.
- D-020, C12, C09: map attribution, vehicle data and giveaway verification before any video touches them.

**Open questions**
1. Vanity redirects for on-screen paths (proposed extension of D-009) so vertical video traffic can be attributed.
2. Canva or Figma: DS picks one by 29 Sep; the templates are built only once.
3. Is the Facebook Page active enough to receive every output, or should it get only the Reel and the social post (channel is EXPERIMENTAL)?
4. Which test PC and driver version does ED use for Fix It Friday, and who owns keeping it current?
5. The Out This Week article slug pattern (`/news/{slug}`) and category must be confirmed with the CMS so the examples' links are correct; the GTA series slug for `/games/series/{slug}` also needs confirming.

**Conflicts found**
- None with the spine. Note: the spine lists F04 The Number as static cards on X, Threads, Bluesky, Instagram and Facebook; the vertical Number Shorts in 09 are an addition in the Wednesday rotation, not a replacement.
