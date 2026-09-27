# 29 — Creative Briefs

Status: Phase 2 plan — 27 Sep 2026

Part 34 of the growth plan. This file sets the visual and copy rules every TechPlay asset follows from Mon 28 Sep to Thu 31 Dec 2026. It gives a template for each franchise (F01–F24) and a full brief for 21 campaigns. IDs, dates and landing pages follow the spine. Research is cited as [R02], [R17] and so on.

- **The brand is already defined in code. Use it.** `frontend/app/globals.css` ("Design System v2, Refined HUD") has exactly four near-black surfaces, one crimson accent (`#DC143C`) and a brighter cut (`#FF4D6A`) for accent-coloured text. The fonts are Instrument Sans for display, IBM Plex Sans for body and IBM Plex Mono 600 for figures. Social, email and ad creative use the same tokens, so a post looks like the site it links to.
- **Every number on a creative is either live or sourced. If it's neither, it doesn't go on.** No member counts, no "thousands", no ratings the site does not measure. The false claims fixed under C01 are the reason for this rule [R02, R23].
- **Images are official screenshots, publisher press assets, store capsules or TechPlay UI captures, and every one carries a credit.** Fan art needs written permission. Leaked footage is never used. For GTA VI, which Rockstar actively polices, the only source is Rockstar Newswire or press material [R17, R19].
- **Portrait covers are never stretched or cropped into landscape slots.** In a 1.91:1 or 16:9 frame, either composite covers side by side (the existing `/og/studio` pattern) or use a landscape screenshot [R02].
- **OG images are 1200×630 JPEG or WebP, ≤300 KB, and their real pixel size matches the size they declare.** Today the six GTA 6 OGs are 1731×909 PNGs of about 2 MB each but declare 1200×630. `/WoW Analyzer.png` is 1536×1024, 2.55 MB, with a space in its filename. The homepage OG is 880 KB [R02; repo check 27 Sep].
- **Professor Buffy appears as one silhouette in a small corner mark, and only where there's a community host role.** He never appears on trust, layoffs, PR data or paid ads. His copy is dry and brief, with no "centuries of wisdom", "young one" or "Hoot hoot" [R13].
- **Five master canvases cover all 24 franchise templates:** 4:5 card, 1:1 card, 9:16 story/video, 1.91:1 OG and 16:9 hero/thumbnail. DS builds the masters in weeks 1–2 (about 20 h across two 10 h weeks). SC fills them after that, at 10–45 minutes per asset (ESTIMATE, based on the R19 pipeline times).
- **Vertical safe zones are a house convention, not verified platform data.** R19 did not fetch 2026 TikTok, Reels or Shorts UI documentation, so every template carries conservative margins and gets one test upload per platform before it goes into rotation.

---

## 1. Brand treatment system

### 1.1 Colour tokens (FACT: read from `frontend/app/globals.css` and `public/manifest.json`, 27 Sep 2026)

| Token | Value | Use in creative |
|---|---|---|
| `--surface-0` | `#05070A` | Canvas background for every asset. Also scrims over screenshots, used at 60–80% opacity. Manifest `background_color`. |
| `--surface-1` | `#0B0E14` | Cards and panels placed on the canvas |
| `--surface-2` | `#10141B` | Inner cards, table rows, chips |
| `--surface-3` | `#161B22` | Highlighted row, "not announced" chip fill |
| `--line` / `--line-strong` | `rgba(255,255,255,.06)` / `.12` | Dividers and card borders (1 px on a 1080 canvas; 2 px at 1920) |
| `--ink-hi` | `#FFFFFF` | Headlines and primary text |
| `--ink-mid` | `rgba(255,255,255,.70)` | Detail lines, dates |
| `--ink-low` | `rgba(255,255,255,.45)` | Source and credit lines. Only at ≥24 px on a 1080 canvas. |
| `--ink-faint` | `rgba(255,255,255,.30)` | Decorative only. Never for text a reader needs. |
| `--accent` | `#DC143C` (crimson) | Fills only: CTA buttons, chips, the logo mark, kicker bars. Manifest `theme_color`. |
| `--accent-ink` / `--accent-hover` | `#FF4D6A` | Accent-coloured **text** (kickers, highlighted words) |
| `--accent-deep` | `#4A0D1A` | Glow, gradient floor, low end of chart ramps |
| `--success` | `#10B981` | "Confirmed" chip, upward movement in charts |
| `--warning` | `#F59E0B` | "Reported" chip |
| `--danger` | `#EF4444` | Errors only. Keep it out of brand creative, because it sits too close to crimson. |
| `--info` | `#3B82F6` | Links in the email body only |
| `--score-*` | `#22c55e` (masterpiece/great) · `#eab308` (good/fair) · `#ef4444` (poor) | Review score badges on F24 Verdict when there is a full review. Nowhere else. |
| `--gta-pink` / `--gta-cyan` / `--gta-orange` / `--gta-violet` | `#FF2E88` / `#25E0FF` / `#FF7A00` / `#7A2FF7` | **GTA 6 franchise only (F02, F03, C06–C10).** Use as a sub-accent (one gradient hairline or the sunset band). The crimson TechPlay mark stays. |

Contrast rules. The first three are measured and noted in the `globals.css` comments; the rest are the rules we follow:
- Crimson `#DC143C` on `#05070A` measures 4.04:1, which is under 4.5:1. **Don't set crimson text below 40 px on a 1080 canvas.** Use `#FF4D6A` for small accent text instead (6.26:1).
- White on crimson measures 4.99:1, so white text on crimson buttons and chips is fine.
- Chips use the status colour as the fill, with `#05070A` text on success and warning. The word is always printed on the chip. Colour never carries the meaning alone.
- The site is dark only (CLAUDE.md), so there is no light-mode variant. Email is the one exception, covered in §1.10.

### 1.2 Type (FACT: `frontend/app/layout.tsx`)

| Role | Face | Weights used | Sizes on a 1080-wide canvas | Rules |
|---|---|---|---|---|
| Display: headlines, kickers | **Instrument Sans** (variable, `wdth` axis loaded; tops out at 700) | 600 kicker, 700 headline | Headline 72–96 px (1:1 and 4:5), 88–120 px (9:16), 56–64 px (OG) | Sentence case for headlines. Uppercase only for kickers, with 0.08em tracking. The weight doesn't exist above 700, so never fake a "Black". Tighten the width slightly (wdth 90–95) for long names. |
| Body: detail lines, captions, copy | **IBM Plex Sans** | 400, 500 | 32–40 px detail, 40–44 px burned-in captions, 22–28 px credit and source | Never below 22 px on a 1080 canvas |
| Numbers: dates, prices, countdowns, ranks, scores | **IBM Plex Mono** | 600 only | 28 px dates up to 360 px countdown digits | All figures a reader compares go in Mono, so columns line up. This matches the site. |

The fonts are Google Fonts. DS installs all three in the design tool's brand kit. The `layout.tsx` comment still mentions Archivo, but Archivo is not loaded, so don't use it.

### 1.3 Logo (FACT: `frontend/public/`)

| File | Size | What it is | Use |
|---|---|---|---|
| `techplay-logo.png` | 800×135 RGBA | Crimson "T/play" mark + "TECH" in white + "PLAY" in crimson | Wordmark on dark canvases. Min width 200 px on a 1080 canvas and 180 px on OG. |
| `logo.png` | 600×101 RGBA | Same lockup, smaller | Email header (600 px layout) |
| `techplay-mark.png` | 256×189 RGBA | Crimson mark alone | Corner mark on stories and video, 56–72 px tall. Also avatars. |
| `icon-512.png`, `icon-maskable-512.png` | 512×512 | App icon | Profile pictures on social accounts |

Rules:
- Clear space around the wordmark equals the height of the "T" mark on every side.
- Place the wordmark bottom-left on cards and the mark top-left on video.
- **Never put the wordmark on a crimson fill.** "PLAY" and the mark disappear into it. DS makes a mono-white version (DS, 1 h, week 1).
- No SVG exists in the repo, only PNGs. DS asks EIC for the vector source (open question).
- The mark never shrinks below 40 px, is never outlined or recoloured, and never goes on busy screenshots without a scrim.
- **Tagline** where one fits: "Gaming, on the record." **One-liner** where a sentence fits: "TechPlay is the gaming publication that knows what you play." (spine §2). Don't use the old bios ("We test hardware until it breaks") [R02].

### 1.4 Professor Buffy (FACT on assets; rules are RECOMMENDATION built on R13)

| Asset | Size | Description | Use |
|---|---|---|---|
| `images/buffy-portrait.jpg` | 560×560 | Bust: goggles with the T mark, black hooded jacket, dark red glow background | **The one silhouette.** DS cuts it out to a transparent PNG (`buffy-mark-bust_512.png`) and uses it as the corner mark. |
| `images/buffy-controller.webp` | 560×560 | Full body mid-jump holding a controller, crimson HUD rings | Discord only (welcome, rank-up embeds). Not on social. |
| `images/profile-cta-buffy.webp` | 2135×736 | Homepage band: Buffy with a tablet, surrounded by illustrative UI cards ("1,284h", "RPGs 42%") and Steam/PlayStation/Xbox logos | **Homepage band only.** Don't reuse it in social or ads. The figures are illustrative and would read as claims, and the platform logos read as endorsement. |

Rules:
1. **One silhouette.** Use the bust from `buffy-portrait.jpg`. Don't mix art styles, commission a new pose per post or add costumes until EIC approves a variant set. The Octocat model, one silhouette with seasonal variants, is the long-term path [R13].
2. **Size.** As a corner mark he's 72–96 px on a 1080 canvas: bottom-right on cards, top-right inside the safe box on 9:16. That's no more than about 1% of the canvas. He's never the subject of the image.
3. **Where he appears:** F06 On This Day, F11 What Are You Playing?, F12 Poll of the Week, F14 Buffy's Weekly Wrap, F22 Game Club, F15 Readiness Check (Discord), the newsletter sign-off and Discord embeds.
4. **Where he never appears:** C01 Trust Reset, F17 Studio Watch (layoffs and closures), C20/C21 PR data graphics, C57 paid ads, F24 Verdict, F03 ledger, anything about money owed or a giveaway result.
5. **Voice.** "A senior guild member, not a cartoon teacher" [R13]. Plain first line, with character only in the sign-off. One owl joke per message at most. Never "centuries of wisdom", "young one", prophecies, "Hoot hoot!" or stacked exclamations. Never guilt anyone about a streak. Never quote a number that isn't live.
6. **Spelling.** It's "Professor Buffy". The WoW Analyzer tip header currently reads "Profesor", which is in scope for D-040 [R13].
7. **Rights.** Where the Buffy art came from and under what licence is not recorded in the repo. EIC confirms TechPlay owns it before any paid or merch use (open question).

Example sign-offs (use as written):
- "That's the week. — Buffy"
- "Your game's out today. The rest can wait. — Buffy"
- "Poll closes Sunday. Change your mind as often as you like. — Buffy"

### 1.5 Imagery and rights

| Source | Allowed for | Credit line on the asset | Notes |
|---|---|---|---|
| Publisher press sites and newsrooms (Rockstar Newswire, Xbox Wire, PlayStation Blog, Blizzard press, Activision press) | Editorial posts, articles, OG, organic video | "Image: {Publisher}" in the credit slot | GTA VI uses Rockstar Newswire only [R17] |
| Steam store capsules and screenshots | F01, F05, F13, F16, F18, F23 | "Image: {Developer} / Steam" | Landscape header capsules exist. Use them in landscape slots instead of covers. |
| IGDB-derived covers in our catalogue | Portrait slots only (3:4 frames, cover rows) | "Cover: {Publisher}" | Never stretch. Never use `cdn.mobygames.com` URLs, because that source is retired [R02]. |
| **TechPlay UI captures** (calendar, library, Analyzer, ledger, map) | Everything, **including paid ads** | none needed | Capture from a staff account with real data and the staff member's consent. Use no invented figures, and mark demo data "Example". |
| TechPlay's own photos and screen recordings (Windows settings, hardware on the desk) | F07, F10 | none | |
| Fan art, community screenshots | Only with the creator's written permission, stored in the asset log | "Art: @{handle}, used with permission" | |
| Leaked footage or images, datamines, "insider" images | **Never** | — | |
| AI-generated images of real games, characters, logos or people | **Never** | — | Buffy is an existing brand asset, not a new generation |
| Official game logos (e.g. `public/gta6/logo.png` is Rockstar's GTA VI logo) | Editorial context only, never in paid ads, never altered | — | EIC confirms use (open question) |
| Platform logos (Steam, PlayStation, Xbox, GOG, Epic) | Editorial "where to play" rows at small size, unaltered | — | In ads, write the platform names as text instead |

Paid ads (C57) use **TechPlay UI captures only**. Permission to show an official screenshot in an editorial post is not permission to use it in an ad.

**GTA 6 map captures.** The map pins carry `gtadb_key` ids, and 211 of 1,058 are flagged unconfirmed. Until D-020 settles attribution, a creative can show the TechPlay map UI but may not present the pins as "our dataset", and the caption must not say "1,058 confirmed locations" (spine §0).

### 1.6 Status chips (used by F03, F08, C07, C08, C17)

| Chip text | Fill | Text colour | Meaning |
|---|---|---|---|
| CONFIRMED | `#10B981` | `#05070A` | Stated by the publisher or platform holder, with a source link |
| REPORTED | `#F59E0B` | `#05070A` | Named outlet reporting, not confirmed by the publisher |
| RUMOUR | transparent, 2 px `--line-strong` border | `#FFFFFF` | Unnamed or single-source claim |
| NOT ANNOUNCED | `#161B22` | `rgba(255,255,255,.70)` | Nothing official either way (e.g. GTA VI unlock time) |
| DENIED | `#161B22` | `#FFFFFF`, struck-through claim text beside it | Publisher said no |

Chip spec: Instrument Sans 600, 24 px, uppercase, tracking 0.08em, 12×20 px padding, radius 3 px (`--radius-inner`). Every chip line has a source and date beside or under it, in Plex Sans 22–24 px `--ink-low`.

### 1.7 Grid and safe zones

Common rules: 8 px baseline grid. The outer margin is 64 px on 1080-wide canvases. Six columns with 24 px gutters on 1080 canvases (column 136 px). Radius is 5 px on cards (`--radius-card`) and 8 px on panels. The notched "command" corner (11 px cut, from `.btn-command`) goes on **one** CTA element per asset at most. The site reserves it for the single decisive action, so it means something only when it's rare.

| Format | Canvas | Safe box (critical text and logo) | Keep clear | Status |
|---|---|---|---|---|
| Square feed (X, Threads, Bluesky, FB, IG single) | 1080×1080 | x 64–1016, y 64–1016 | none beyond margins | house rule |
| Portrait feed / carousel (IG, FB) | 1080×1350 | x 64–1016, y 80–1270. **Headline and key figure within y 135–1215**, the centre 1:1 area, in case the profile grid crops to square. | top 80, bottom 80 | Grid crop UNVERIFIED [R07 §3.5]. The conservative choice costs nothing. |
| Vertical (TikTok, Reels, Shorts, Stories) | 1080×1920 | **x 64–940, y 250–1500** | Top 250 (account name, progress bar). **Bottom 420** (caption, audio, CTA). **Right 140** (like/comment/share rail). | House convention. R19 §6 lists platform UI documentation as not researched. Verify with one private test upload per platform before first use (SC, 1 h). |
| Story with link or poll sticker | 1080×1920 | same as vertical | Reserve y 1300–1500 × x 240–840 for the sticker | house rule |
| YouTube thumbnail | 1280×720 | x 48–1232, y 40–680 | Bottom-right 240×100 (duration stamp) | JPEG ≤500 KB (house rule, safely under any upload limit) |
| OG / link card (site, X, Discord, FB, LinkedIn, WhatsApp) | **1200×630** | x 60–1140, y 60–570. Title block in the left 640 px, image right. | 60 px all edges | **JPEG or WebP ≤300 KB**; declared width and height must equal the real pixels [R02] |
| Article / Discover hero | 1600×900 (16:9) | subject in the centre 1200×675 | no text burned in (the H1 is on the page) | Discover needs ≥1200 px wide, >300k pixels, 16:9 recommended, `max-image-preview:large` [R07 §3.1] |
| Homepage band | 1920×640 (matches `images/page-hero.webp`) | Text lives in HTML, not the image. Keep the image subject in the right 50%. | left 50% dark for HTML copy | WebP ≤150 KB |
| Email header | 1200×400 exported, displayed at 600×200 | x 40–1160 | — | JPEG ≤100 KB |
| Discord embed image | reuse the 1200×630 OG | as OG | — | — |
| Discord scheduled-event cover | 1600×640 house size (2.5:1) | centre 1200×480 | — | Discord's recommended size UNVERIFIED. Check in the event editor. |

### 1.8 OG images: current offenders and replacements (FACT: repo, 27 Sep 2026)

| Current file | Real size / weight | Declared | Replacement file (this spec) | Owner / date |
|---|---|---|---|---|
| `/gta6/og-hub.png` | 1731×909, 1.99 MB | 1200×630 | `og_gta6-hub_1200x630_v1.jpg` | DS art, DEV swap (D-017) · by 2 Oct |
| `/gta6/og-map.png` | 1731×909, 2.10 MB | 1200×630 | `og_gta6-map_1200x630_v1.jpg` | same |
| `/gta6/og-characters.png` | 1731×909, 2.04 MB | — | `og_gta6-characters_1200x630_v1.jpg` | same |
| `/gta6/og-vehicles.png` | 1731×909, 2.11 MB | — | `og_gta6-vehicles_1200x630_v1.jpg` | same |
| `/gta6/og-weapons.png` | 1731×909, 1.95 MB | — | `og_gta6-weapons_1200x630_v1.jpg` | same |
| `/gta6/og-everything-we-know.png` | 1731×909, 2.18 MB | — | `og_gta6-ledger_1200x630_v1.jpg` (C07) | by 30 Sep |
| `/WoW Analyzer.png` | 1536×1024 (3:2), 2.55 MB, space in name | — | `og_wow-analyzer_1200x630_v1.jpg` | DS art, DEV swap (D-040) · by 2 Oct |
| homepage OG `storage/seo/…7EK3.png` | 965×541, 880 KB | — | `og_home_1200x630_v1.jpg` | by 9 Oct |
| generic fallback `storage/seo/01KG0…png` (a dozen pages) | — | — | `og_hub-generic_1200x630_v1.jpg` plus DEV extends `/og/studio` to `/og/hub` and `/og/game` [R02 fix 13] | DEV, P2 |

OG layout (all hubs): `--surface-0` canvas. Kicker in Instrument 600, 24 px caps, `#FF4D6A`, at x 60 y 60. Title in Instrument 700, 60 px, white, max 3 lines inside x 60–700. One detail line in Plex Sans 28 px, 70% white. Right panel at x 740–1140, y 60–570: a landscape screenshot (radius 5, credit in 18 px at the bottom edge of the panel) **or** 2 portrait covers at 190×282 side by side. Wordmark at 180 px bottom-left, y 520–560. Export as JPEG at quality 80–85, then check the file is ≤300 KB.

### 1.9 Website banners

**Homepage band (C44/C40 period).** Size 1920×640. The image is the existing `profile-cta-buffy.webp` style, with HTML text on the left:
- Eyebrow: "Gaming, on the record"
- H2: "Start your library."
- Body: "Connect Steam, PlayStation, Xbox, GOG or Epic and your games arrive on their own, with the hours you've put in. Free."
- Primary button (the one notched command button): "Start your library". Secondary link: "Browse 333,000+ games". The number is API-fed. If it isn't, write "Browse the catalogue".

**Article-end CTA block (C46, D-010).** An HTML component, not an image. Three rows on `--surface-1` with a 1 px `--line` border, radius 8, 24 px padding, placed directly under the body and above the tags:

| Row | Label (Instrument 600, 14 px caps, `#FF4D6A`) | Copy (Plex Sans 16 px) | Button |
|---|---|---|---|
| 1 Newsletter | THE SAVE FILE | "One email on Fridays: what came out, what's next, what's cheap." | email field + "Subscribe" |
| 2 Library | YOUR LIBRARY | "Connect Steam and see every game you own, with your hours." | "Connect Steam" → `/register?from=article-end` |
| 3 Discord | DISCORD | "Talk about this story with the editors and readers." + live member count from the invite API, or nothing | "Join Discord" → `https://discord.gg/wPQG9gUMXH` |

No Buffy in the block. Buffy already sits in the JoinPrompt panel, and two owls on one page is one too many.

**Newsletter landing `/newsletter` (new, D-012, C40).** Hero 1920×640. The image is a flat render of one real past issue on a `--surface-1` card, tilted 0°, with the right 50% of the frame holding the issue. The HTML carries the copy: H1 "The Save File", sub "Every Friday. What came out this week, what's out next week, what's on sale, and the one story worth your time.", then the form and the link "Read last week's issue". OG: `og_newsletter_1200x630_v1.jpg`.

### 1.10 Email

The body is 600 px wide, surface `#0B0E14`, text `#FFFFFF`/70%, links `#FF4D6A`. The header is `logo.png` on `#05070A`. Dark backgrounds get inverted by some mail clients (UNVERIFIED which ones). So DS also exports a header with a transparent-safe mark on a solid dark tile, and SC tests the send in Gmail web, Gmail Android and Apple Mail before issue 1.

### 1.11 Copy on creative

- Headlines are ≤48 characters on cards, ≤6 words on thumbnails and ≤60 characters in `<title>`/OG titles. Don't cut mid-word. Two current titles are truncated mid-word [R02].
- Every figure has a source line. Every date is absolute ("Thu 19 Nov"), never "next week".
- Leave out prices unless they were checked on the store on the day of posting ("Price checked 28 Sep, 10:00 CET").
- One emoji at most per post, and none on cards.
- No hype words. The banned list in the spine applies to captions and on-image copy too.
- Discord links always go to `https://discord.gg/wPQG9gUMXH`.
- Every outbound link carries UTMs per spine §9, built with the campaign URL helper (D-009) once it ships.

---

## 2. Franchise templates F01–F24

Five masters, built once by DS: **M1** 1080×1350 card · **M2** 1080×1080 card · **M3** 1080×1920 story/video · **M4** 1200×630 OG · **M5** 1600×900 hero / 1280×720 thumbnail.

**M1 layout (the workhorse)**, top to bottom inside 64 px side margins:

| Zone | y range | Content | Type |
|---|---|---|---|
| Kicker | 80–128 | Franchise name left; date or issue number right | Instrument 600 28 px caps `#FF4D6A`; date in Plex Mono 600 28 px 70% white |
| Headline | 160–520 | Up to 3 lines, ≤48 chars | Instrument 700 80 px white |
| Media | 560–1110 | 952×550 landscape image, radius 5, **or** a portrait cover row, **or** a table | — |
| Detail | 1130–1180 | One line of platform, date or price | Plex Sans 32 px 70% white |
| Credit/source | 1186–1210 | "Image: … · Source: …" | Plex Sans 22 px 45% white |
| Footer | 1222–1270 | Wordmark 200 px left; Buffy mark 72 px right (only where §1.4 allows) | — |

**M3 layout.** Mark 56 px top-left at (64, 250). Kicker at y 320. Hero text block y 380–900. Media y 920–1300. Sticker or CTA zone y 1300–1500. Nothing critical outside x 64–940, y 250–1500.

| ID | Template name | Masters and sizes | Layout specifics | Data / image source | Buffy | Fill time (ESTIMATE) |
|---|---|---|---|---|---|---|
| F01 | Out This Week | M1 carousel (cover + ≤8 game slides + CTA slide); M3 Reel 20–30 s; M4 for X/article; M5 article hero composite | Game slide: landscape capsule in the media zone, game name as headline, "Out Tue 29 Sep" in Mono, platforms as a text line, price only if checked. Cover slide: "Out this week" + date range + 4 capsule thumbnails in a 2×2 grid. | `/calendar`, Steam capsules, press | CTA slide only | 45 min carousel, 30–45 min Reel [R19] |
| F02 | GTA 6 Countdown ("X days to Vice City") | M3 story; M2 for X/Threads; Discord text | Digits in Plex Mono 600 at 360 px, white. "days to Vice City" in Instrument 700 64 px. One fact ≤140 chars in Plex Sans 40 px. Source line. Background: official Rockstar screenshot under a 70% `#05070A` scrim, with a 4 px `--gta-pink` → `--gta-violet` hairline at y 900. | Rockstar Newswire; R17 ledger | no | 10 min [R19] |
| F03 | Confirmed or Rumour? | M1 carousel (cover + 1 claim per slide + "full ledger" slide); M4 ledger OG | Claim slide: status chip at y 160, claim as headline (≤60 chars), source + date in the detail zone. No screenshot on claim slides, which keeps the focus on the claim. | `/gta6/everything-we-know` ledger | no | 30 min [R19] |
| F04 | The Number | M2 (X, Threads, Bluesky, FB); M1 (IG); M4 (LinkedIn Thu) | Figure in Plex Mono 600 up to 240 px, centred at y 300–600. One context sentence ≤90 chars. **Source line mandatory**, 24 px. No photo. The accent is a 6 px crimson bar left of the figure. | News source or TechPlay dataset | no | 20–30 min [R19] |
| F05 | Hidden Gem Thursday | M1 carousel (cover, "why", "where to play", CTA) | Cover slide: portrait cover in a 540×720 frame, centred. It's a portrait slot, so this is allowed. Show "Aggregate score {x}" with the source named, never as "reader score" [R02]. | DB hidden-gems module | no | 30 min |
| F06 | On This Day | M2; Discord text by Buffy | Kicker "On this day · 28 Sep". Headline "{Game}, {N} years ago". Portrait cover right, 300×400. One line of why it mattered. | `/games/on-this-day` endpoint | corner mark | 10 min |
| F07 | Fix It Friday | M3 video 45–60 s; M5 guide hero; M1 steps carousel | Video: hook card 0–2 s ("Shader stutter in {game}? Try this."). Then 3–5 steps, each a screen capture with a step number in Mono 120 px top-left and caption 40–44 px inside the safe box. End card: "Full guide: techplay.gg/guides/pc-fixes". | Own Windows captures | no | 45–60 min [R19] |
| F08 | Where Can I Play It? | M1 table card; M4 | Table: rows PC / PS5 / Xbox Series X\|S / Switch 2 / Game Pass / PS Plus. Each cell says "Yes", "No" or "Not announced" as text, with a chip where the status is contested. Hero capsule at the top, 952×300. | DB platforms, store pages | no | 30 min |
| F09 | In Order | M1 carousel (≤10 entries per slide); M5 hero cover row | Timeline: year in Mono 36 px, title in Instrument 600 36 px, platform in Plex Sans 24 px. Covers in rows of 4 at 200×267 (portrait slots). | Series relations in DB | no | 45 min |
| F10 | Worth It in 2026? | M1 verdict card; M3 Short | Verdict chip ("Yes" / "Wait for a sale" / "Skip") at y 160, 72 px. Three reasons ≤60 chars each. Game capsule in the media zone. No numeric score. | Editorial | no | 30 min |
| F11 | What Are You Playing? | M2 text-only question card; Discord/forum thread | Question at 96 px, centred: "What are you playing this week?" Sub: "Tell us, or show us your shelf." | — | corner mark | 10 min |
| F12 | Poll of the Week | M3 story with poll sticker; M2 question and results cards | Results card: bar per option in crimson ramp (`#4A0D1A` → `#DC143C` → `#FF4D6A`), % in Mono, **"n = {votes}" always printed** | Native polls | corner mark | 20 min |
| F13 | Steam Movers | M1 chart card; M4 | Five rows: rank now (Mono), arrow and positions moved (`#10B981` up, 45% white down), game name. Source: "Steam weekly most-played, week ending {date}". | Steam charts API [R06] | no | 30 min |
| F14 | Buffy's Weekly Wrap | M4 Discord embed image; M5 "Week in review" hero | Title "The week, wrapped · {date range}". Three story tiles. "Member of the week: @{name}" (opt-in only). Next week's 3 releases. | Site + Discord | corner mark (max 96 px) | 30 min |
| F15 | Readiness Check | Discord text + M4 card; M3 monthly Short | Analyzer UI capture in the media zone. "This week: {one tip}". CTA "Run your character". | WoW Analyzer | corner mark in Discord only | 20 min |
| F16 | Deal Radar | M1 carousel; M4; email block | Per game: capsule, price now in Mono 64 px, regular price struck in 45% white, store, "ends {date}". "Prices checked {date time} CET". Affiliate line if any link earns. | Store pages | no | 45 min |
| F17 | Studio Watch | M1; M4 | **Sober variant.** No crimson fills, no photo of people. Studio name, what happened, "Games affected:" list, source line. The kicker is 70% white, not accent. | Studios DB + sources | **never** | 30 min |
| F18 | Games Like… | M1 carousel; M3 Short | Seed slide: "Games like {seed}" + seed capsule. Then 1 game per slide with "Like {seed} because {reason ≤60 chars}". | Similar-games data | no | 30–45 min [R19] |
| F19 | Library Card | M1 member card (generated, D-024) | Avatar, username, platforms connected (text), top 3 genres, games count. Hours only if the member turns them on. | `/og/profile` pattern | no | 10 min (consent check) |
| F20 | Showcase Live | M4 "Live: {event}" header; Discord event cover; M5 live-blog hero | Mono timestamps. "LIVE" chip in crimson fill with white text. No logos of the showcase organiser. | — | no | 20 min setup |
| F21 | The Save File | Email header 1200×400; M4 archive OG; M1 sign-up card | Header: wordmark left, "The Save File · #{n} · {date}" right in Mono. Sections separated by text labels, not images. | Weekly content | sign-off line only | 3 h assembly (SC) |
| F22 | Game Club | Discord event cover 1600×640; M5 forum banner | "Game Club · October" kicker. Game name headline. Official key art under a 60% scrim. Discussion dates in Mono. | Press kit | corner mark | 20 min |
| F23 | Next Fest Diary | M1 daily card; M3 Short | "Next Fest Diary · Day {n}". Three rows, each: capsule 400×187, demo name, verdict chip (WISHLIST / MAYBE / SKIP), one line. | Steam demo pages | no | 30 min |
| F24 | Verdict | M1; M4; M5 hero | Game name, verdict line ≤80 chars. The score badge (`--score-*` colour) **appears only on a full review** under `/rating-system`. Launch verdicts carry the label "Launch verdict · full review to follow". | Editorial | **never** | 30 min |

---

## 3. Campaign creative briefs

Every brief uses the same fields. Placeholders in `{braces}` are filled from live data on the day of production. Anything outside braces is the exact copy. UTMs follow spine §9 and invites go to `https://discord.gg/wPQG9gUMXH`.

### C01 — Trust Reset announcement (28 Sep–2 Oct · DEV/EIC)

- **Objective:** Tell the few people who already know TechPlay that the false numbers are gone, and put a correction on record that a partner or journalist can find. Success is the note being live and linked from `/about` by 2 Oct. There's no reach target.
- **Decision (EIC, 28 Sep):** a public editor's note, recommended, or a corrections-log entry only. The About page promises that "corrections are visible" [R02].
- **Formats and sizes:** site note (article, M5 hero 1600×900 text-free); M4 OG 1200×630; X post (text only); Discord #announcements post (text only).
- **Headline:** "We took down the numbers we couldn't back up"
- **Hierarchy:** 1) the headline; 2) the list of removed claims; 3) the rule from now on (live numbers or none).
- **Copy (site note, exact):**
  > Until this week, TechPlay's sign-up page said "15K+ members". It promised XP for reading articles, which stopped on 11 August. The WoW Analyzer claimed "50K+ players analyzed" and a 4.9/5 rating we have no way to measure. The GTA 6 hub asked you to "join thousands of fans". Six page titles said the database held 140,000 games. It holds more than 333,000.
  >
  > None of that should have been there, and it's gone. From now on a number on TechPlay is read from our database when the page loads, or it isn't shown. If you find one that breaks that rule, write to the editorial inbox on /contact and we'll fix it and say so here.
  >
  > One more fix: if you tried to join our Discord from the GTA 6 hub and got an error, that link was dead. This one works: https://discord.gg/wPQG9gUMXH
  >
  > — Adi Zeljković, Editor-in-Chief
- **Copy (X):** "We removed claims from techplay.gg we couldn't back up: a member count, a rating, an old games total. Numbers on the site are now live from the database or not shown. The note: {url}"
- **Image concept:** OG is type only. Kicker "EDITOR'S NOTE", the headline, and a single line "Gaming, on the record." No screenshots of the old claims, because re-circulating the false figures in an image would keep them alive in search.
- **CTA:** none beyond "Read the note". Discord link in the body.
- **Brand treatment:** `--surface-0` canvas, white headline, kicker in `#FF4D6A`. No crimson fills, no Buffy, no notch.
- **Avoid:** any new number except 333,000+, which is API-fed and checked on the day. Apology theatre. Blaming the agency. Replacing one false figure with another (e.g. "a growing community of hundreds").
- **UTM:** `utm_campaign=c01-trust-reset`, `utm_content=note-x`.

### C04 — Out This Week (weekly from Mon 28 Sep · ED/SC)

- **Objective:** Make Monday's F01 the site's first recurring piece built from its own database. Every asset sends people to `/calendar` and its remind-me buttons. TARGET: published every Monday by 12:00 CET, 14 weeks running.
- **Formats and sizes:** site article + M5 hero composite (4 capsules on `--surface-1`); IG carousel M1 (cover + ≤8 + CTA); Reel/TikTok/Shorts M3 20–30 s; X thread with M4; Discord #releases post; newsletter block.
- **Headline:** "Out this week: 28 Sep – 4 Oct"
- **Hierarchy:** 1) the date range; 2) the biggest release of the week, which gets the first game slide; 3) "Remind me" on the calendar.
- **Copy (week 40 caption, exact apart from braces):**
  > Out this week, 28 Sep to 4 Oct. Minecraft Dungeons II on Tuesday, Ace Combat 8 on Friday, and Ghost of Yōtei Complete Edition on Thursday (date reported, not yet confirmed by Sony). The Steam Autumn Sale starts Thursday too. Platforms, prices and a remind-me button for each: techplay.gg/calendar
- **Slide copy:** game slide headline `{Game}`; detail line "Out {Tue 29 Sep} · {platforms}"; price line "{price} on {store}, checked {date}" or nothing. CTA slide: "Every release, every platform. Tap remind me and we'll tell you on the day." + "techplay.gg/calendar".
- **Reel script (25 s):** 0–2 s "Out this week" + dates. 2–20 s one game per 3 s: capsule, name, day. 20–25 s end card "Full calendar: link in bio". No voice-over until the AI-voice question is answered [R19 §6]. Captions burned in.
- **Image concept:** Steam or publisher landscape capsules. Portrait covers only in the 2×2 cover-slide grid.
- **CTA:** "Set a reminder" → `/calendar`.
- **Brand treatment:** M1 standard. Crimson kicker bar. Buffy mark on the CTA slide only.
- **Avoid:** listing a reported date as confirmed. Prices not checked that day. "Biggest week ever"-style claims. Portrait covers stretched to fill the 952×550 media box.
- **UTM:** `c04-out-this-week`, `utm_content=f01-carousel-a` / `f01-reel-a`.

### C05 — Steam Autumn Sale: Wishlist Picks (1–8 Oct · ED/SC)

- **Objective:** Turn sale traffic into wishlist and library activity: a pick list plus a push to check your own wishlist on TechPlay. TARGET: one article, one carousel, two X posts, one newsletter special.
- **Formats and sizes:** article + M5 hero; F16 carousel M1 (cover + 10 picks + CTA); M4 for X; newsletter block; Discord post.
- **Headline:** "Steam Autumn Sale: 10 picks, and your own wishlist checked"
- **Hierarchy:** 1) "Steam Autumn Sale" + end date "until Thu 8 Oct"; 2) the picks; 3) "Connect Steam to see which of your wishlist games are cut".
- **Copy (carousel caption):**
  > The Steam Autumn Sale runs until Thursday 8 October. Here are ten games we'd buy at these prices. Every price was checked on {date} at {time} CET. If you connect Steam to TechPlay, your library and wishlist come across on their own, and you can see what's cheaper without scrolling the store. techplay.gg/register?from=c05
- **Slide copy:** `{Game}` / "{sale price} (was {regular price}) · Steam" / "Why: {one line ≤60 chars}".
- **Image concept:** Steam header capsules. The CTA slide is a TechPlay UI capture of a real staff library with the wishlist tab, labelled "Example library".
- **CTA:** "Connect Steam" → `/register?from=c05`.
- **Brand treatment:** F16. The price in Plex Mono is the largest element after the game name. An affiliate disclosure line goes in the credit zone if any link earns.
- **Avoid:** "lowest price ever" unless a price history shows it. Showing TechPlay wishlist counts (the base is too small to be meaningful). Countdown timers or "last chance" language before 7 Oct.
- **UTM:** `c05-steam-autumn-sale`, `utm_content=f16-carousel-a`.

### C06 — GTA 6 Countdown (daily 28 Sep–19 Nov · SC/DS)

- **Objective:** A daily habit in Stories, X, Threads and Discord #gta6, each post carrying one confirmed fact and sending people to the hub and the reminder. TARGET: 53 consecutive posts with zero unconfirmed claims.
- **Formats and sizes:** M3 story 1080×1920 (IG/FB); M2 1080×1080 (X, Threads); Discord text + M2; Shorts 3×/week (M3, 8–12 s: digits, then fact, then end card).
- **Headline pattern:** "{N} days to Vice City"
- **Hierarchy:** 1) the number; 2) the fact; 3) source line + "Set a reminder".
- **Copy, first week (exact):**

| Date | N | Fact line | Source line |
|---|---|---|---|
| Mon 28 Sep | 52 | "GTA VI is out Thursday 19 November on PS5 and Xbox Series X\|S." | Rockstar Newswire |
| Tue 29 Sep | 51 | "Standard edition $79.99. Ultimate Edition $99.99." | IGN, 24 Jun 2026 |
| Wed 30 Sep | 50 | "At launch, GTA VI is a single-player game." | IGN, 24 Jun 2026 |
| Thu 1 Oct | 49 | "No PC version at launch. Take-Two's CEO has said why." | IGN, 4 May 2026 |
| Fri 2 Oct | 48 | "Pre-orders opened 25 June and include the Vintage Vice City Pack." | Rockstar Newswire |
| Sat 3 Oct | 47 | "GTA VI: The Album, with Atlantic Records, comes out the same day as the game." | Rockstar Newswire |
| Sun 4 Oct | 46 | "The $400 Vice City collector's set does not include the game." | Rockstar Newswire |

  Later facts come from the confirmed rows of the R17 ledger and the hub (the 12 characters, vehicles by name). Day 0, Thu 19 Nov: "Out today." + "Unlock time in your zone: techplay.gg/gta6/release-time". Discord text: "{N} days. {fact} Source: {source}. Reminder: techplay.gg/games/grand-theft-auto-vi"
- **Image concept:** official Rockstar screenshots from Newswire, rotated so the same image never runs twice in a week, under a 70% scrim. Credit "Image: Rockstar Games".
- **CTA:** Story link sticker "Set a reminder" → `/games/grand-theft-auto-vi` (the real game page, not `/games/gta-6`) [R17].
- **Brand treatment:** F02. GTA sub-palette hairline only. The crimson mark top-left. No Buffy.
- **Avoid:** rumours (GTA Online 2027, Switch 2, 60 fps), leaked or datamined images, fan art, the Rockstar logo altered or recoloured, "confirmed map locations" claims (D-020), "the most complete GTA 6 resource" or any superlative.
- **UTM:** `c06-gta6-countdown`, `utm_content=f02-day52-story`.

### C07 — GTA 6 Confirmed-or-Rumour Ledger (launch Thu 1 Oct, weekly Thu · ED)

- **Objective:** Make `/gta6/everything-we-know` the page that labels every claim with a status, source and date, and bring it to people every Thursday. TARGET: ledger live 1 Oct with ≥18 rows; weekly update logged.
- **Formats and sizes:** ledger page OG M4 (`og_gta6-ledger_1200x630_v1.jpg`); F03 carousel M1 (cover + 5 claims + CTA); X post with M4; Shorts M3 (claims flip one by one, 15 s).
- **Headline:** "GTA VI: confirmed, reported or rumour?"
- **Hierarchy:** 1) the status chip; 2) the claim; 3) the source and date.
- **Copy (launch carousel, exact):** cover "GTA VI: confirmed, reported or rumour? · Updated Thu 1 Oct". Slides:
  - CONFIRMED · "Out 19 Nov on PS5 and Xbox Series X|S" · Rockstar Newswire
  - CONFIRMED · "No PC version at launch" · IGN, 4 May 2026
  - REPORTED · "30 fps on consoles at launch" · Tom's Hardware, 29 Aug 2026
  - RUMOUR · "GTA Online for GTA VI in 2027" · The Mirror, 18 Sep 2026
  - NOT ANNOUNCED · "A Switch 2 version" · no announcement; ex-developer commentary only (GamesRadar+, 25 Sep 2026)
  - CTA: "Every claim, with its source. Updated every Thursday: techplay.gg/gta6/everything-we-know"
- **Caption:** "Every Thursday we sort what's been said about GTA VI into confirmed, reported and rumour, with a source and date on each line. This week's ledger: {url}"
- **Image concept:** no screenshots on claim slides. The cover uses one official screenshot under a scrim.
- **CTA:** "Read the ledger".
- **Brand treatment:** §1.6 chips. GTA hairline. No Buffy.
- **Avoid:** promoting a rumour to a headline without its chip. Screenshots from leaks. Wording that makes the rumour row the hook ("GTA Online is coming!").
- **UTM:** `c07-gta6-ledger`, `utm_content=f03-carousel-w40`.

### C08 — GTA 6 Release-Time Tool + Reminder (promote 14 Oct–19 Nov · DEV/ED)

- **Objective:** Promote `/gta6/release-time` (new, D-018), which shows the unlock time in the visitor's time zone once Rockstar or the platforms announce it, and collects reminders until then. TARGET: `reminder_set` and `tool_run` (tool=release-time) events tracked from day one.
- **Formats and sizes:** tool OG M4; M3 story + Short (screen recording of the tool, 12 s); M2 for X; hub banner inside `/gta6` (HTML); Discord pinned message.
- **Headline:** "What time can you play GTA VI where you live?"
- **Hierarchy:** 1) the question; 2) the current state ("Not announced yet"); 3) "Get told when it is".
- **Copy (before the time is official, exact):**
  > GTA VI is out Thursday 19 November. Rockstar hasn't announced the unlock time yet. Pick your time zone, set a reminder, and we'll tell you the moment it's official, then again when it unlocks. techplay.gg/gta6/release-time
- **Copy (after it's official):** "GTA VI unlocks at {time} {zone} on {day date}. Your local time is on the page, with pre-load details when they're confirmed: techplay.gg/gta6/release-time"
- **Image concept:** a TechPlay UI capture of the tool showing a time-zone selector and the "NOT ANNOUNCED" chip. After the announcement, the capture shows the real time.
- **CTA:** "Set a reminder".
- **Brand treatment:** M4 with a UI capture in the right panel. GTA hairline. Status chip.
- **Avoid:** guessed unlock times ("likely midnight"). File sizes or pre-load dates before they're official. Countdown clocks to an unannounced hour.
- **UTM:** `c08-gta6-release-time`, `utm_content=tool-story-a`.

### C09 — GTA 6 Giveaway (verify 28 Sep; if live, close Tue 20 Oct; winner Wed 21 Oct · SC/EIC)

- **Objective:** Only if the giveaway exists in admin on 28 Sep, run it honestly to its close and publish a real winner. The code comment alone doesn't count (spine §0). If it's not live, **no creative is produced**, and the register page and Discord card stop mentioning giveaways (C01).
- **Formats and sizes:** giveaway page OG M4; M1 announcement; M3 story (reminder at T-48h, 18 Oct); M2 winner card; Discord embed.
- **Headline:** "Win {prize from admin}"
- **Hierarchy:** 1) the prize, exactly as in admin; 2) the close date and time with zone; 3) how to enter + "No purchase necessary".
- **Copy (announcement, exact apart from braces):**
  > We're giving away {prize}. Entries close Tuesday 20 October at {time} CET. To enter, sign in and tap Enter on the giveaway page. Extra tasks are optional. No purchase necessary; rules and eligibility: techplay.gg/giveaway/{slug}
- **Winner card:** "Winner: @{username}". Show the username only with the winner's consent; otherwise write "Winner drawn and contacted on 21 Oct". Then "Thanks to everyone who entered."
- **Image concept:** press image of the prize from the manufacturer or publisher. If the prize is a key, the game's official capsule. No stacks of cash or fake "value" figures.
- **CTA:** "Enter" → `/giveaway/{slug}`. The page is made indexable while live (D-039).
- **Brand treatment:** M1. The notched command button on the CTA only. No Buffy on the result.
- **Avoid:** share or repost as a condition of entry in anything Meta-facing [R23 §18]. Inventing the number of entrants. Moving the close date. Posting at all if it's not verified.
- **UTM:** `c09-gta6-giveaway`, `utm_content=announce-a`.

### C10 — GTA 6 Launch Week (16–22 Nov · all)

- **Objective:** Be the useful page on launch week: unlock time, what's confirmed about performance, a Discord launch night, and first-hour guidance once the team has played. TARGET: every asset points to a TechPlay tool or hub page, not just to news.
- **Formats and sizes:** hub OG refresh M4 ("Out now" variant, 19 Nov); Countdown finale M3; Discord event cover 1600×640 "Launch night, Wed 18 Nov" (the confirmed unlock time goes in once known); F20 live-blog hero M5; "What to do first" carousel M1 (from 20 Nov); YouTube thumbnail 1280×720 for the C50 pilot link; Game Club November cover (C38).
- **Headlines:** "GTA VI is out" · "Launch night in Discord" · "Your first hours in Leonida: what we'd do first"
- **Hierarchy (launch-day OG):** 1) "GTA VI is out"; 2) "Unlock times, performance by console, the map"; 3) the TechPlay wordmark.
- **Copy (19 Nov X post):** "GTA VI is out on PS5 and Xbox Series X|S. Unlock times by zone, what's confirmed about performance, and the map, all in one place: techplay.gg/gta6"
- **Copy (Discord event):** "GTA VI launch night. We'll be in voice from {time} CET until it unlocks, then comparing first impressions. No story spoilers in #gta6 for two weeks; use #gta6-spoilers."
- **Image concept:** Rockstar launch screenshots and key art from Newswire. TechPlay UI captures of the map tracker (C11) once live.
- **CTA:** "Open the hub" / "Join launch night" → `https://discord.gg/wPQG9gUMXH`.
- **Brand treatment:** GTA sub-palette permitted at full strength on the Discord event cover only. Everything else is standard.
- **Avoid:** story spoilers in any thumbnail, title or first line until 3 Dec. Performance claims before tested or official. Review scores before we've finished it (F24 launch verdict label). "Record-breaking launch" figures before the publisher states them.
- **UTM:** `c10-gta6-launch`, `utm_content=launch-og` / `discord-event`.

### C13 — WoW 12.1.5 Readiness Push (5–12 Oct · ED/SC)

- **Objective:** Re-aim the WoW Analyzer at the next patch with honest copy and a light OG (D-040), and get runs from r/wow helpers and Discord #wow. TARGET: `tool_run` (tool=wow) tracked; the stale Midnight date and false claims gone before the first post.
- **Formats and sizes:** Analyzer OG M4 (`og_wow-analyzer_1200x630_v1.jpg`, ≤300 KB); M3 Short (screen recording of one run, 20 s); F15 Discord card M4; X post M2.
- **Headline:** "Is your character ready for 12.1.5?"
- **Hierarchy:** 1) the question; 2) "Readiness score and gear check in about five seconds"; 3) "No account needed".
- **Copy (exact):**
  > Patch 12.1.5 is expected around 6 October; Blizzard hasn't confirmed the date. Put your character through the TechPlay WoW Analyzer before it lands: readiness score, gear check, and what to fix first. Free, no account needed. techplay.gg/wow-analyzer
- **Short script:** 0–2 s "Ready for 12.1.5?" 2–15 s: realm and name typed, then the result screen, with the tip panel headed "Professor Buffy's tips" (spelling fixed). 15–20 s end card "techplay.gg/wow-analyzer".
- **Image concept:** Analyzer UI capture on a real character, with the owner's consent. Blizzard official screenshots only for backgrounds. The repo's `WoW_Midnight_DarknessDevours_Wallpaper_1920x1080…jpg` is used only if EIC confirms it's official press material.
- **CTA:** "Check your character".
- **Brand treatment:** M4 standard. Buffy corner mark in Discord only. The AI-generated tips are labelled "Tips generated by AI from your character data".
- **Avoid:** "50K+ players analyzed", "4.9/5" or any usage figure. Stating 6 Oct as fact. "Midnight launches March 2, 2026". Class tier claims.
- **UTM:** `c13-wow-1215`, `utm_content=f15-discord` / `short-a`; `utm_term=wow` on Reddit.

### C17 — Modern Warfare 4 launch hub (12 Oct–1 Nov · ED)

- **Objective:** One page that answers the dates, early access, platforms and "which CoD should I get?", plus F09 "Every Call of Duty in order". TARGET: hub live 12 Oct; updated on 16 Oct (campaign early access) and 23 Oct (launch).
- **Formats and sizes:** hub M5 hero + M4 OG; F08 "Where can I play MW4?" card M1; F09 "Call of Duty in order" carousel M1; X posts M2; Short M3 (release-day times card).
- **Headline:** "Modern Warfare 4: dates, early access and platforms"
- **Hierarchy:** 1) "Out Fri 23 Oct"; 2) "Campaign early access from Fri 16 Oct"; 3) the platform table.
- **Copy (X, 12 Oct):** "Call of Duty: Modern Warfare 4 is out Friday 23 October, with campaign early access from 16 October. Platforms, editions and what early access includes, with a source on each line: {url}"
- **F09 caption:** "Every Call of Duty in release order, with the platforms each one is on today. Start wherever you like; we've marked the ones people ask about most. {url}"
- **Image concept:** Activision press key art and screenshots. Covers in portrait slots on the in-order carousel.
- **CTA:** "Set a reminder" → `/games/{mw4-slug}`.
- **Brand treatment:** standard. Status chips on the platform table if any version (e.g. Switch 2 [R06]) is not confirmed by Activision.
- **Avoid:** early-access times not published by Activision. Leaked multiplayer footage. "Best CoD ever". A CoD logo recoloured into brand crimson.
- **UTM:** `c17-mw4-hub`, `utm_content=f09-carousel-a`.

### C18 — Steam Next Fest Demo Tracker (12–30 Oct; Fest 19–26 Oct · ED/SC)

- **Objective:** The F23 diary tries three demos a day during Next Fest, and a tracker page lets readers set a release reminder per game (C45 guest remind-me goes live 19 Oct). TARGET: 24 demos covered, and every one has a remind-me link.
- **Formats and sizes:** tracker page M5 + M4; F23 daily card M1 (Mon 19–Mon 26 Oct); daily Short M3 (3 × 8 s clips, own capture); Discord #next-fest thread; newsletter block on 23 Oct.
- **Headline:** "Next Fest Diary, day {n}: {game A}, {game B}, {game C}"
- **Hierarchy:** 1) the three game names; 2) the verdict chips (WISHLIST / MAYBE / SKIP); 3) "Remind me when it's out".
- **Copy (day card caption):**
  > Next Fest Diary, day {n}. We played {game A}, {game B} and {game C} today. {one sentence on the best one}. Verdicts and a release reminder for each: techplay.gg/steam
- **Image concept:** our own gameplay capture of each demo (captured by TechPlay) or Steam store screenshots. Developers contacted through C71 can supply press kits.
- **CTA:** "Remind me when it's out".
- **Brand treatment:** F23. Chips in the §1.6 style: WISHLIST as the success fill, MAYBE as the warning fill, SKIP as the surface-3 fill.
- **Avoid:** scoring demos out of 10. Calling a demo "the best of Next Fest" before the week ends. Using a developer's logo as the main image without their press kit.
- **UTM:** `c18-next-fest`, `utm_content=f23-day{n}`.

### C20 — Release Congestion Index 2026 (PR, publish Wed 7 Oct · EIC/DEV)

- **Objective:** A citable chart from TechPlay's own release data, showing which weeks of 2026 had the most releases, with a method note journalists can check. TARGET: page, method and a press image ready by 6 Oct.
- **Formats and sizes:** `/data/release-congestion-2026` (new) with an embedded chart; press image 1600×900 PNG (charts stay crisp) plus a 1200×630 JPEG OG; social chart M1; X thread with 3 × M2; Reddit data post image M5 (C48).
- **Headline:** "The most crowded weeks for game releases in 2026" (final wording after the data is in; no superlative that the data doesn't show)
- **Hierarchy:** 1) the busiest week and its count; 2) the whole-year heatmap; 3) "Source: TechPlay release database, {date}; method: {url}".
- **Copy (chart subtitle, exact):** "Games released per week in 2026, counted from TechPlay's database of {N} titles with a confirmed 2026 release date. Counts include {platform scope}; DLC and editions are {included/excluded}."
- **Image concept:** a calendar heatmap (53 week cells) in the crimson ramp `#161B22` → `#4A0D1A` → `#DC143C` → `#FF4D6A`. Axis labels in Plex Sans 22 px, figures in Plex Mono. One annotation for the week of 19 Nov (GTA VI) if the data supports a point about it.
- **CTA:** "Read the method" / "Download the chart".
- **Brand treatment:** wordmark bottom-left, source line bottom-right on every exported chart. No Buffy. No game screenshots.
- **Avoid:** publishing any figure before DEV's query is signed off by EIC. Truncated y-axes. "Record year" unless compared with a year the data covers the same way. The IGDB licence question (R23 §16): EIC checks this before PR use (open question).
- **UTM:** `c20-release-congestion`, `utm_source=pr-{outlet}` for outreach links.

### C21 — World Atlas of Game Studios + Balkan Game Dev Census (PR, Wed 28 Oct · EIC/DEV)

- **Objective:** A world map of where game studios are, from 57,630 studio records, with a Balkan zoom that regional press can use. TARGET: `/data/studio-atlas` (new) live with method; regional outreach list sent (C55).
- **Formats and sizes:** press map 1600×900 PNG; Balkan zoom 1600×900 + M1 social; M4 OG; X thread M2 ×4; LinkedIn M4.
- **Headline:** "Where the world's game studios are" / Balkan: "Game studios in the Western Balkans, counted"
- **Hierarchy:** 1) the map; 2) the top countries by count; 3) the note on what counts as a studio.
- **Copy (method line, exact):** "Counted from {N} studio records in TechPlay's catalogue that list a country. A studio is any developer or publisher credited on at least one catalogued game; the site shows pages for the {M} with an indexable game, which is why /studios lists fewer."
- **Copy (regional X/LinkedIn):** "We counted the game studios in our catalogue by country. Bosnia and Herzegovina: {n}. Croatia: {n}. Serbia: {n}. Slovenia: {n}. North Macedonia: {n}. Montenegro: {n}. Method and the full map: {url}"
- **Image concept:** a choropleth map in the crimson ramp on `#05070A`, with country borders in `--line-strong`. The Balkan inset has labels in Plex Sans and counts in Mono.
- **CTA:** "See your country" → `/studios/country/{code}`.
- **Brand treatment:** as C20. No flags as decoration. No Buffy.
- **Avoid:** reconciling 31,970 and 57,630 silently (state both [R02]); calling a country "the Balkan leader" without the count shown; implying studios are active when the data only shows credits.
- **UTM:** `c21-studio-atlas`.

### C28 — Your 2026 in Games (build by 10 Dec; live 14–31 Dec · DEV/DS)

- **Objective:** Give each member a cross-platform year recap they can share. The card is generated from their own library (D-025, D-024) and carries the only viral loop the product has in December. TARGET: `share_card_generated` (type=year) events; activation of new members from shared-card clicks tracked via `?from=yir`.
- **Formats and sizes:** generated cards: M3 1080×1920 (Stories), M1 1080×1350 (feed), M4 1200×630 (link preview); in-page recap; announcement assets M1 + M3 + email block.
- **Headline (card):** "My 2026 in games"
- **Hierarchy (card):** 1) "{username}'s 2026 in games"; 2) three figures: games added, games finished, platforms connected; 3) most-played game with its cover, then "techplay.gg/year-in-review".
- **Copy (announcement, exact):**
  > Your 2026 in games is ready. It's built from your own library across Steam, PlayStation, Xbox, GOG and Epic, whichever you've connected: what you added, what you finished, what you played most. Hours are hidden unless you switch them on. techplay.gg/year-in-review
- **Share caption prefilled:** "My 2026 in games, read from my own library. Make yours: techplay.gg/year-in-review"
- **Image concept:** generated. `--surface-0` card, figures in Plex Mono 120 px, most-played cover in a 3:4 frame, the member's avatar, wordmark bottom-left.
- **CTA:** "Make yours" → `/year-in-review` (register if logged out, returning to the page).
- **Brand treatment:** M3/M1. Crimson kicker "2026". No Buffy on member cards; he can appear on the announcement.
- **Avoid:** percentile or rank comparisons ("top 1% of players"), which are meaningless on a small base. Inventing "gamer types" that the product doesn't compute. Showing hours by default. Cards for members who haven't opted in to sharing.
- **UTM:** `c28-year-in-review`, `utm_content=card-story` (appended to the card's URL).

### C29 — Game Awards Prediction League (18 Nov–10 Dec · SC/DEV)

- **Objective:** Members pick winners per category, get a shareable "my picks" card, and are scored on the night (D-026). TARGET: league open within 24 h of the official nominee list; results card on 11 Dec.
- **Formats and sizes:** league page OG M4; "My picks" generated card M1 + M3; results card M1 ("I got {x} of {y} right"); Discord event cover (10 Dec watch party, F20); X posts M2.
- **Headline:** "Call The Game Awards before they happen"
- **Hierarchy:** 1) "The Game Awards · Thu 10 Dec"; 2) "Pick a winner in each category"; 3) "Picks lock when the show starts".
- **Copy (exact):**
  > The Game Awards are on Thursday 10 December. Pick your winner in each category before the show starts; we score everyone's picks as the awards are read out, and the table goes up in Discord the same night. techplay.gg/awards/2026
- **Image concept:** type-led. Category names in Instrument 600, nominee capsules (publisher press art) in rows. **No Game Awards logo or trophy image.**
- **CTA:** "Make your picks".
- **Brand treatment:** M1/M3. Buffy corner mark on the Discord event cover only.
- **Avoid:** listing nominees before the official announcement. Implying any affiliation with the show. Prizes, unless a giveaway is set up under C09 rules.
- **UTM:** `c29-prediction-league`, `utm_content=picks-card`.

### C31 — Black Friday Wishlist Price Alerts (20 Nov–1 Dec · DEV/SC)

- **Objective:** Sign people up for price-drop alerts on games they already want (D-027, C43 channels), timed for Black Friday (27 Nov) and Cyber Monday (30 Nov). TARGET: `reminder_set` and `alert_clicked` tracked; the alert email passes the §4 checklist.
- **Formats and sizes:** landing banner 1920×640; M1 carousel (how it works in 3 slides); M3 story; alert email template (600 px); Discord post; newsletter special 27 Nov.
- **Headline:** "Tell us what you want. We'll tell you when it's cheaper."
- **Hierarchy:** 1) the headline; 2) "Price alerts on your wishlist, by email or Discord DM"; 3) "Free, with a TechPlay account".
- **Copy (carousel, exact):** slide 1 as headline; slide 2 "Add games to your wishlist, or connect Steam and bring yours across."; slide 3 "When the price drops on a store we track, you get one email or Discord DM. Not a newsletter, just the price."; slide 4 CTA "Set up alerts: techplay.gg/register?from=c31".
- **Alert email (exact apart from braces):** subject "{Game} is {price} on {store}". Preheader "It was {previous price} when you added it. Sale ends {date}, if the store says." Body: "{Game} dropped to {price} on {store} ({percent}% off). [See the deal] · Stop alerts for this game · Manage alerts". A disclosure line if the link earns.
- **Image concept:** TechPlay UI capture of the wishlist with an alert toggle, plus the email as it renders. No retailer logos as hero.
- **CTA:** "Set up alerts".
- **Brand treatment:** M1. Prices in Mono. The notched button on the email CTA.
- **Avoid:** "lowest price ever" or "best deal" unless price history shows it. Fake countdowns. Sending alerts for games the member didn't choose.
- **UTM:** `c31-bf-price-alerts`; on alert emails `utm_source=email&utm_medium=email&utm_content=alert-{store}`.

### C33 — Gift Guide from Wishlists (1–20 Dec · ED/SC)

- **Objective:** A gift guide sorted by the kind of player (segments S1–S7) that nudges readers to share their own TechPlay wishlist link so family knows what to buy. TARGET: 6 segment guides live by 4 Dec.
- **Formats and sizes:** hub article M5; 6 × M1 carousels (one per segment); M3 story "send them your wishlist"; newsletter block 4 and 11 Dec.
- **Headline:** "Gifts for people who play games, sorted by the kind of player"
- **Segment titles (exact):** "For the one counting down to a release" (S1) · "For the collector with three consoles" (S2) · "For the PC tinkerer" (S3) · "For the one still waiting on GTA VI" (S4) · "For the MMO player" (S5) · "For the Switch 2 owner" (S6)
- **Hierarchy:** 1) the segment; 2) 5–8 picks with price checked on {date}; 3) "Or ask for their wishlist".
- **Copy (story, exact):** "Not sure what they've already got? Their TechPlay wishlist link shows what they want, and their library shows what they already own. Send them this: techplay.gg/register?from=c33"
- **Image concept:** publisher and manufacturer press images. TechPlay UI capture of a wishlist page (staff account, labelled "Example").
- **CTA:** "Share your wishlist".
- **Brand treatment:** M1. Crimson kicker per segment. No seasonal clip art, no Santa Buffy (the variant isn't approved).
- **Avoid:** prices not checked that week. Undisclosed affiliate links. "Must-have". Recommending hardware the team hasn't used, with a claim of testing.
- **UTM:** `c33-gift-guide`, `utm_content=s3-carousel`.
- **Dependency:** a shareable public wishlist URL. Whether one exists today is UNKNOWN (DEV to confirm by 20 Nov). If not, the CTA becomes "Send them your library".

### C40 — The Save File newsletter relaunch (first issue Fri 2 Oct · SC/EIC)

- **Objective:** Relaunch the newsletter as a named weekly (F21) with a landing page and sign-up points in the article-end block, on the homepage and on game pages. TARGET: an issue every Friday by 09:00 CET; `newsletter_signup` and `newsletter_verified` tracked; guardrails (complaints <0.1%, unsubscribes <0.5% per send) held.
- **Formats and sizes:** email header 1200×400 (F21); `/newsletter` hero 1920×640 + OG M4; sign-up card M1 (IG, FB) and M2 (X, Threads, Bluesky); Discord announcement.
- **Headline:** "The Save File"
- **Hierarchy (sign-up card):** 1) "The Save File"; 2) "Every Friday: what came out, what's next, what's cheap"; 3) "techplay.gg/newsletter".
- **Issue 1 subject (exact):** "The Save File #1: Autumn Sale, Ace Combat 8, and the GTA VI ledger"
- **Preheader:** "What came out this week, what's out next week, and what's cheap."
- **Issue 1 sections:** Out this week (F01 condensed) · Out next week (Gears of War: E-Day, Tue 6 Oct; Dragon's Dogma 2: Dark Arisen, Fri 9 Oct) · On sale (Steam Autumn Sale until 8 Oct, 3 picks) · The ledger (C07 launch) · The Number (F04) · What are you playing? (link to the Discord and forum thread) · sign-off "That's the week. — Buffy".
- **Sign-up copy (exact):** "The Save File. One email on Fridays: what came out this week, what's out next week, what's on sale, and the one story worth your time. Unsubscribe in one click."
- **Image concept:** type-only header. Issue content uses publisher capsules at 560 px wide.
- **CTA:** "Subscribe".
- **Brand treatment:** §1.10 email rules. Buffy in the sign-off line only.
- **Avoid:** subscriber counts ("join 10,000 readers"). "Thousands of fans" (the old GTA hub box). Image-only emails. More than one issue a week in the first month (deliverability [R23 §19]).
- **UTM:** `c40-save-file-2026w40` (issue-specific campaign per spine), `utm_content=f21-{section}`.

### C44 — Registration rebuild (5–26 Oct · DEV/EIC)

- **Objective:** Replace the "NEW PLAYER · 15K+ MEMBERS" register page (D-014) with a library-first pitch, social sign-in first, Steam sign-in (D-015) and redirect back to where the visitor came from. TARGET: `registration_start` → `registration_complete` by `method` and `from` tracked from 5 Oct.
- **Formats and sizes:** register page (HTML) with one side visual 960×1080 (desktop right panel; hidden on mobile); `/register` OG is not needed (noindex); homepage band refresh 1920×640.
- **Headline (H1):** "Start your library."
- **Hierarchy:** 1) H1; 2) sign-in buttons: Steam, Google, Discord, Battle.net, then "or use email"; 3) three benefit lines.
- **Copy (exact):**
  > Start your library.
  > Sign in with Steam and your games come across with your hours. PlayStation, Xbox, GOG and Epic connect after, just as fast.
  > · Your games from five platforms in one place, free
  > · A reminder on the day the games you're waiting for come out
  > · What to play next, from what you already own
  > [Continue with Steam] [Continue with Google] [Continue with Discord] [Continue with Battle.net]
  > Or sign up with email
  > Free, and no card. Already have an account? Sign in
- **Image concept:** TechPlay UI capture of a real staff library (consent given), labelled "Example library". No `profile-cta-buffy.webp` figures, no platform logos beyond the sign-in buttons' own icons.
- **CTA:** "Continue with Steam", the primary and notched button.
- **Brand treatment:** `--surface-0` page, `--surface-1` panel. Buffy optional as a 72 px mark in the success state ("You're in. Connect a platform next.").
- **Avoid:** member counts, "XP for every article you read" (false since 11 Aug), "exclusive giveaways" unless one is live, gamer jargon ("Create your player", "Character creation").
- **UTM/params:** `from=<source>` per spine §7; e.g. `/register?from=article-end`.

### C49 — Vertical Video System (from 5 Oct · SC/DS)

- **Objective:** One production line feeding TikTok, Shorts, Reels and FB Reels from three templates: F01 Out This Week (Mon), F02 GTA countdown (3×/week), F07 Fix It Friday (Fri). TARGET: 5 videos a week for 6 weeks, then keep only the format and platform that earn calendar, reminder or guide clicks [R19 §3].
- **Formats and sizes:** M3 1080×1920, 30 fps, H.264 MP4, captions burned in, plus a clean version without captions for platforms with native captions.
- **Template structure (all three):**

| Beat | Time | Content | Type |
|---|---|---|---|
| Hook | 0–2 s | One line of text that states the payoff ("Out this week: 5 games, 28 Sep – 4 Oct" / "51 days to Vice City" / "Shader stutter? One setting to check") | Instrument 700 96 px, inside y 380–900 |
| Body | 2–20/45 s | One idea per 3 s; capsules or screen capture; step numbers in Mono | captions Plex Sans 44 px at y 1150–1300 |
| End card | last 2–3 s | One action: "Remind me: link in bio" / "Full guide: link in bio" | mark 56 px top-left, wordmark in the safe box |

- **Headline pattern:** matches the hook. The platform post title repeats it.
- **Copy (F07 week 1 caption, exact):** "If {game} stutters the first time you reach a new area, it's usually shaders compiling. Here's what to check in Windows and in the game. Full guide on TechPlay, link in bio."
- **Image concept:** capsules and official screenshots (F01, F02). Own screen captures of Windows and settings (F07). No gameplay footage until publisher video policies are read (Nintendo, Rockstar, Blizzard, Bethesda, Take-Two) [R19 §4].
- **CTA:** one per video, always a site action [R19 §5].
- **Brand treatment:** mark top-left, crimson progress bar at y 250 (4 px) that fills across the video. No Buffy.
- **Avoid:** AI voice-over until disclosure rules are checked [R19 §6]. Trending audio with lyrics over facts. Text in the bottom 420 px or right 140 px. "Wait for it" hooks. Re-uploading official trailers.
- **UTM:** link-in-bio page with `utm_source={tiktok|youtube|instagram|facebook}&utm_medium=organic-social&utm_campaign=c49-vertical-video&utm_content={f01|f02|f07}-{yyyymmdd}`.

### C57 — Paid: Meta registration test, US 18+ (2–22 Nov, then 1–14 Dec · EIC/SC)

- **Objective:** Test whether Meta can buy verified, activated registrations at a cost EIC accepts. **No spend unless** D-031 (pixel + CAPI behind consent) and C03 measurement are live (spine §13). TARGET: cost per activated member (A2 Shelved) measured by ad variant. The budget tier is set in the paid plan.
- **Formats and sizes:** Feed 1080×1350 (primary), 1080×1080, Stories/Reels 1080×1920 static and 10 s motion. Three concepts × two visuals = 6 ads.
- **Concepts (exact copy):**

| Ad | Primary text (≤125 chars) | Headline (≤40 chars) | Visual |
|---|---|---|---|
| A · Library | "Connect Steam, PlayStation, Xbox, GOG or Epic. Your games come across on their own, with your hours. Free." | "All your games, one library" | UI capture: real staff library grid, labelled "Example" |
| B · Reminders | "Pick the games you're waiting for. We'll email you on the day they come out. Free, no card." | "Get told on release day" | UI capture: calendar with remind-me toggled |
| C · GTA VI (2–19 Nov only) | "GTA VI is out 19 Nov on PS5 and Xbox Series X\|S. Set a reminder and we'll send the unlock time for your zone when it's announced." | "GTA VI: know when it unlocks" | UI capture of `/gta6/release-time` (no Rockstar art in ads) |

- **Hierarchy:** 1) the benefit in the headline; 2) the UI capture proving it; 3) the "Sign Up" button.
- **CTA:** Meta "Sign Up" → `/register?from=meta-c57-{a|b|c}` with redirect back to the promised page.
- **Brand treatment:** `--surface-0` frame around the UI capture. Wordmark bottom-left. Headline overlay ≤6 words in Instrument 700. **No Buffy.** No platform logos (names in text instead).
- **Avoid:** member counts or social proof. Giveaway ads with share requirements [R23 §18]. Copy that asserts personal attributes ("You're a gamer who…"; check against Meta's current ad policies). Official game art (rights). Concept C might be refused for trademark use, so hold A and B ready.
- **UTM:** `utm_source=facebook|instagram&utm_medium=paid-social&utm_campaign=c57-meta-registration&utm_content=ad-{a|b|c}-{1350|1080|1920}`.

---

## 4. Production

### 4.1 Build order and DS hours (ESTIMATE; DS has 10 h/week)

| Week | DS builds | Hours | SC fills from then on |
|---|---|---|---|
| 28 Sep–2 Oct | Brand kit (tokens §1.1, fonts §1.2, mono-white wordmark, Buffy bust cut-out). GTA 6 OG ×6 and WoW OG (for D-017/D-040). M1 and M3 masters. F02 countdown. | 10 | F02 daily; F01 manual in M1 |
| 5–9 Oct | F01 (carousel + Reel), F03 chips + ledger OG, F04, F21 email header, `/newsletter` hero, C44 register side visual | 10 | F01, F03, F04, F21, C05 |
| 12–16 Oct | F07 video template, F23, F08, F09, C08 tool promo, C17 hub hero, M4 hub generic OG, C20 chart style | 10 | F07, F23, F09, C17, C18 |
| 19–23 Oct | F05, F13, F16, F18, F10, F24, homepage OG, C21 map style | 10 | all weekly franchises |
| 26–30 Oct | C57 ad set (6 ads × 3 sizes) · F06, F11, F12, F14, F15, F17, F19, F20, F22 variants | 10 | — |
| Nov | C10 launch set, C29 card spec (with DEV), C31 alert email, C28 card spec (with DEV, D-024/D-025) | 6–8/week | per campaign |
| Dec | C33 carousels, C28 announcement, C34/C70 reuse of F16/F01 | 4–6/week | per campaign |

SC's fill time for the weekly franchises is about 6–8 h a week (ESTIMATE from the fill times in §2). That sits inside SC's 25 h next to community work.

### 4.2 File naming convention

```
{yyyymmdd}_{campaign}_{franchise}_{asset}_{WxH}_{variant}_v{n}.{ext}
```

- All lower case, and hyphens only inside a token. **No spaces**, which is the `WoW Analyzer.png` lesson.
- Use `x` in sizes. `{campaign}` is the spine ID (`c04`, `c06a`) or `evergreen`. `{franchise}` is `f01`–`f24` or `na`. `{asset}` is one of `carousel-s01…s10`, `story`, `reel`, `short`, `card`, `og`, `hero`, `thumb`, `email-header`, `ad-a`. `{variant}` is `a`/`b`/`c` for tests, or a day or issue number (`day52`, `w40`).
- Examples:
  - `20260928_c06_f02_story_1080x1920_day52_v1.jpg`
  - `20260928_c04_f01_carousel-s01_1080x1350_a_v1.jpg`
  - `20261002_c40_f21_email-header_1200x400_w40_v1.jpg`
  - `20261102_c57_na_ad-b_1080x1350_a_v2.jpg`
  - Site OGs (stable names, no date): `og_{page}_1200x630_v{n}.jpg`, e.g. `og_gta6-hub_1200x630_v1.jpg`
- `utm_content` mirrors the filename's franchise-asset-variant (`f02-day52-story`), so a click traces back to a file.
- Store assets in one shared folder per month: `/creative/2026-10/{campaign}/`. Keep master templates in `/creative/_masters/`. Keep the rights log `/creative/_rights.csv` with columns: file, source URL, publisher, licence or permission, date, who checked.

### 4.3 Export settings

| Asset | Format | Max weight | Notes |
|---|---|---|---|
| OG 1200×630 | JPEG q80–85 or WebP q80 | **300 KB** | Real pixels = declared `og:image:width/height` |
| Feed cards | JPEG q85 | 500 KB | sRGB |
| Charts (PR) | PNG-8/24 | 1 MB | Plus a JPEG OG version ≤300 KB |
| Stories | JPEG q85 | 800 KB | |
| Video | MP4 H.264, 1080×1920, 30 fps, AAC | platform limits (UNVERIFIED, check in upload UI) | Burned-in captions plus a clean copy |
| Email header | JPEG q80 | 100 KB | 1200×400, shown at 600×200 |
| Homepage/hero banners | WebP q80 | 150 KB (band) / 250 KB (1600×900 hero) | Next image optimisation handles srcset for our uploads (CLAUDE.md) |

### 4.4 Pre-publish checklist (every asset, SC ticks; EIC signs off C01, C09, C20, C21, C57)

**Facts**
1. Every figure has a source on the asset or in the caption, and the source was opened today.
2. Counts come from the API on the day (games, studios, Discord members), or they're left out. No member count, no "thousands", no ratings the site doesn't measure.
3. Dates are absolute and weekdays are correct (the spine calendar is the reference). Reported or rumoured items carry a chip or the word "reported".
4. Prices carry "checked {date time} CET". Affiliate links carry a disclosure line.

**Rights**
5. Each image comes from an allowed source (§1.5) and has a row in `_rights.csv`. The credit line is on the asset.
6. No leaked, datamined, fan-made (without permission) or AI-generated game imagery. No official logos altered. Nothing but TechPlay UI in paid ads.
7. Member data (F19, C28, winners) only with recorded consent.

**Brand**
8. Tokens only. There's no hex outside §1.1, crimson text sits at ≥40 px, and small accent text is `#FF4D6A`.
9. Fonts are Instrument Sans, IBM Plex Sans and IBM Plex Mono only. No text under 22 px on a 1080 canvas.
10. Buffy only where §1.4 allows. One silhouette, 72–96 px, and his line follows the voice rules.
11. One notched element at most. Wordmark clear space respected, and never on a crimson fill.
12. **No portrait cover in a landscape slot.** Covers go in 3:4 frames or composite rows only.

**Format**
13. Correct canvas. Critical text inside the §1.7 safe box. For vertical, a private test upload was checked on the target platform the first time the template ran.
14. The file is within its weight limit (OG ≤300 KB) and named per §4.2.
15. Alt text is written for every image post (≤125 characters, describing what's shown, including the figure on the card).
16. Video has burned-in captions and a text hook in the first 2 s, and it ends on one site action.

**Links**
17. The link carries UTMs per spine §9 and resolves (open it on mobile). The Discord link is `https://discord.gg/wPQG9gUMXH`.
18. Link previews checked: X, Discord and Facebook for any new OG. WhatsApp once per template, to see its crop.

**Copy**
19. No banned words (spine §0), no "!!!", at most one emoji, no fake urgency, headline ≤48 characters on cards.
20. GTA VI assets: facts only from the confirmed or reported rows of the ledger, labelled as such. The game page link is `/games/grand-theft-auto-vi`.

### 4.5 What to avoid, across every campaign

| Don't | Because | Instead |
|---|---|---|
| Fake or unbacked numbers (members, subscribers, "50K+ analyzed", ratings) | C01 exists because of them [R02, R23] | Live API figures or none |
| Clickbait ("You won't believe", "GTA 6 PC CONFIRMED?!") | Discover's Feb 2026 update demotes it [R07] | State the payoff plainly |
| Leaked footage, datamines | Rockstar and others police IP actively [R17] | Newswire and press kits |
| Portrait covers stretched into 1.91:1 or 16:9 | Game-page OGs already fail this way [R02] | Cover rows or landscape screenshots |
| Multi-MB PNG OG images | 2–2.5 MB previews fail or lag in X, Discord and WhatsApp [R02] | JPEG/WebP ≤300 KB |
| Reusing `profile-cta-buffy.webp` outside the homepage | Its "1,284h" and percentages read as claims | UI captures labelled "Example" |
| Buffy on serious or money topics | The mascot turns into a nag or a joke at the wrong moment [R13] | No mascot on those |
| Dead Discord invites (`discord.gg/techplaygg`, `discord.gg/techplay`) | Both return "Unknown Invite" [R13] | `discord.gg/wPQG9gUMXH` |

---

## Dependencies and open questions

**Dependencies**

| Item | Needed for | Owner | By |
|---|---|---|---|
| D-001 false claims removed | C01 note, C44, C13 copy | DEV | 2 Oct |
| D-017 GTA hub fixes incl. OG ≤300 KB | C06–C08 link previews | DEV + DS files | 2 Oct |
| D-040 WoW Analyzer copy and OG | C13 | DEV + DS files | 2 Oct (before 5 Oct push) |
| D-012 `/newsletter` landing | C40 | DEV | 2 Oct |
| D-010 article-end CTA block | C40, C44 capture | DEV | 16 Oct |
| D-018 `/gta6/release-time` | C08, C57 concept C | DEV | 14 Oct |
| D-014/D-015 register rewrite + Steam sign-in | C44, C57 | DEV | 26 Oct |
| D-027 price-drop alerts, C43 delivery channels | C31 | DEV | 20 Nov |
| D-024/D-025 share card + Year in Review | C28, F19 | DEV + DS | 10 Dec |
| D-026 prediction league | C29 | DEV | 18 Nov |
| D-031 pixel + CAPI behind consent; C03 measurement | C57 (no spend without it) | DEV | before 2 Nov |
| D-009 campaign URL helper | all UTMs | DEV | 16 Oct (manual UTMs until then) |
| D-020 gtadb provenance | any creative presenting the GTA map as our data | EIC | before C10 |
| C09 giveaway status | C09 creative at all | SC/EIC | 28 Sep |

**Open questions**

1. **Vector logo.** Only PNGs (`techplay-logo.png` 800×135, `techplay-mark.png` 256×189) are in the repo. Where is the SVG or source file? (EIC)
2. **Buffy rights and source files.** R13 said Buffy's artwork was not in the repository, but three renders are (`buffy-portrait.jpg`, `buffy-controller.webp`, `profile-cta-buffy.webp`). Who made them, under what licence, and is there a layered source for a clean cut-out? Needed before any paid, merch or variant use. (EIC)
3. **Official logos in the repo.** `public/gta6/logo.png` is Rockstar's GTA VI logo. Confirm it's used in editorial context only and never in ads. (EIC)
4. **Blizzard wallpaper** `WoW_Midnight_DarknessDevours_Wallpaper_1920x1080…jpg` in `public/`. Confirm its source before any creative uses it. (EIC)
5. **Vertical safe zones and video limits** for TikTok, Reels and Shorts in 2026 are UNVERIFIED [R19 §6]. SC runs one private test upload per platform in the week of 5 Oct and adjusts §1.7.
6. **AI voice-over and synthetic-media disclosure rules** per platform: not researched [R19 §6]. No AI voice until checked.
7. **Publisher video policies** (Nintendo, Rockstar, Blizzard, Bethesda, Take-Two) must be read before any gameplay-footage format [R19 §4]. Until then video uses stills, capsules and our own captures.
8. **IGDB licence** for PR use of catalogue-derived data (C20, C21) [R23 §16]. EIC decides before 6 Oct.
9. **Public wishlist URL** exists or not (C33). DEV confirms.
10. **Design tool.** Figma or Canva for masters (DS's choice). SC needs a tool where the fonts in §1.2 are available.
11. **Stale comments, minor.** `globals.css` describes the GTA palette as a "TechPlay orange base", but the accent is crimson. `layout.tsx` mentions Archivo, but Instrument Sans is loaded. Neither changes the creative. Both are worth a one-line code comment fix.

**Conflicts noted against research and spine**

- The GTA 6 OG files **declare** 1200×630 in `app/gta6/page.tsx` and `app/gta6/map/page.tsx`, but the files are 1731×909. R02 reported their weight (about 2 MB), not this mismatch. The replacement spec in §1.8 fixes both.
- R13 lists "Buffy's visual design is not in the repository" as a gap. The repo does contain three Buffy renders (see open question 2).
- The Ghost of Yōtei Complete Edition date (1 Oct) is "reported" in the spine key dates, so C04 copy labels it that way.
