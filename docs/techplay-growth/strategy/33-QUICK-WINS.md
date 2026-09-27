# 33 — Quick Wins and the Stop-Doing List

Status: Phase 2 plan — 27 Sep 2026

- **Nothing gets promoted until it is true.** The first 24 hours remove the false numbers, the dead Discord links and the two giveaway defects that stop a no-task entrant from winning [R02, R13, 25-GIVEAWAYS].
- **Five horizons, one table each:** next 24 hours (Mon 28 Sep), 3 days (to Wed 30 Sep), 7 days (to Sun 4 Oct), 14 days (to Sun 11 Oct) and 30 days (to Tue 27 Oct). Every row names an owner, a time ESTIMATE, the exact action, the expected effect and a "done when" test.
- **DEV rows follow 32-DEVELOPMENT-BACKLOG exactly.** DEV's first week is full (18 h planned of 20). Everything else in the first week is admin, copy or account work that EIC, ED, SC and DS can do without code.
- **Three decisions carry dates:** is the GTA 6 giveaway live (EIC, 28 Sep); Meta Pixel option A or B (EIC, 5 Oct, see 32 §D-031); the gtadb.org answer (EIC, by 16 Oct).
- **Copy for every changed string is in this file**, so DEV does not wait for words.
- **The Stop-Doing list frees about 20 hours a week (ESTIMATE)** from low-value content, social busywork, SEO tactics and paid habits. Each item names what replaces it.
- **Baseline first.** EIC records the 28 Sep numbers (Search Console, GA4, users, subscribers, Discord) before any change ships. Without them no TARGET in the plan can be read.

Owners: EIC editor-in-chief · ED editor/journalists · SC social and community · DS designer · DEV developer. Times are ESTIMATES in hours or minutes of that person's time.

## NEXT 24 HOURS — Monday 28 Sep

| # | Owner | Time | Exact action | Expected effect | Done when |
|---|---|---|---|---|---|
| 1 | EIC | 30 min | Baseline snapshot into the KPI sheet (tab "2026-09-28"): Search Console clicks/day for the last 28 days, indexed and not-indexed pages, top 20 queries; GA4 sessions by source since 20 Sep; `users` count and connected accounts (Filament Users); verified mailable newsletter subscribers (Filament → Newsletter Subscribers, filter "mailable"); Discord member count from the invite page | Every TARGET in the plan gets a starting number; nothing is estimated later from memory | The sheet has all eight numbers with today's date and their source |
| 2 | EIC | 20 min | Filament → Giveaways: open the GTA 6 giveaway and record status, is_public, starts/ends (the code comment says it closes 20 Oct), prize and value, task list, and entries count. Open `giveaways:unfinished` output (Filament dashboard alert) for the old World of Tanks draw that has sat undrawn for about 207 days [R01 B.2.9] | Decides C09: promote from Tue 29 Sep (after D-039a/b and D-041 ship) or pause. Surfaces the undrawn draw for the public fix in the 3-day list | Decision posted in the team channel: "live, closes …" or "not live" |
| 3 | DEV | 1 h | **D-004.** `frontend/components/gta6/Gta6NewsletterCTA.tsx:7` and `frontend/components/roadmap/RoadmapCTA.tsx:17`: replace `https://discord.gg/techplaygg` with `settings.discord_url`, falling back to `https://discord.gg/wPQG9gUMXH` (the same pattern as `Footer.tsx:50`). In `RoadmapCTA.tsx:15` change YouTube to `https://youtube.com/@techplay_gg`, and remove the unverified Twitch row at `:16`. `backend/database/seeders/SiteSettingSeeder.php:23` default → `https://discord.gg/wPQG9gUMXH`. Confirm Filament → Settings → Socials `discord_url` holds the same | Discord clicks from the GTA 6 hub and roadmap reach the server instead of "Unknown Invite" [R13] | `grep -rn "discord.gg/techplay"` in frontend and backend returns 0; both buttons open the server on the live site |
| 4 | DEV | 1 h | **D-041.** `discord/src/handlers/commands.ts:537` and `discord/src/services/SubscriptionService.ts:192`: build `https://techplay.gg/giveaway/{slug}` (singular), not `/giveaways/{slug}`. Rebuild and restart the bot with `techplay-deploy.sh` | Giveaway links from Discord stop returning 404 | `/giveaways` in Discord opens a live giveaway page |
| 5 | DEV | 3 h | **D-039a + D-039b.** Base points on entry so a no-task entrant can be drawn (`Giveaway.php:225-229` draws only `total_points > 0`). One per-IP guard used by `enter()`, `completeTask()` and `claimDailyBonus()` in `GiveawayController.php`. Feature tests for both | "Free to enter" becomes true, and the entry limit cannot be bypassed [25-GIVEAWAYS] | Tests pass; an entry with no tasks shows its base points in `viewParticipants` |
| 6 | DEV | 2 h (of 4) | **D-001, first half.** Apply the strings in "Copy for the 24-hour fixes" below to `RegisterClient.tsx:33,202-204`, `LoginClient.tsx:23-25`, `BrandPanel.tsx:21`, `Gta6NewsletterCTA.tsx:51-56`, `WowAnalyzerClient.tsx:186,196`, `HomeHero.tsx:43`, `LeaderboardClient.tsx:645` | The page where people decide to sign up stops making claims anyone can disprove [R02 §6.1, R11 §1.4] | No "15K+", "50K+", "thousands of fans", "4.9/5" or "article you read" on the live site |
| 7 | SC | 45 min | Claim handles, with logins in the team password manager and 2FA on: TikTok **@techplay.gg** (fallback @techplaygg; both returned "Couldn't find this account" on 27 Sep [R02]); Bluesky **techplaygg.bsky.social** (the techplay.gg domain handle can follow through the HTTPS well-known file, with no DNS change); Threads **@techplay.gg** through the Instagram account (existence UNVERIFIED) | Brand handles cannot be taken by someone else during the GTA VI window | Each handle shows the TechPlay avatar and the bio from 05-SOCIAL-MEDIA §4 |
| 8 | SC | 15 min | Filament → Settings → Socials: set `twitter_url` = `https://x.com/TechPlayGG`. The footer renders X only when this is set (`Footer.tsx:47`) | X is linked from every page; today it is only in `twitter:site` [R02 §8.2] | The X icon appears in the live footer and opens @TechPlayGG |
| 9 | SC | 40 min | Discord → Server Settings → Invites: create non-expiring, unlimited-use invites, one per campaign: `c06-gta6-countdown`, `c04-out-this-week`, `c40-save-file`, `c47-reddit`, `c09-gta6-giveaway`, `c13-wow-readiness`, `c49-video`. Log them in the sheet (code, campaign, utm_campaign, created, where used, uses every Monday). Site-wide links keep `wPQG9gUMXH` | Per-campaign Discord joins can be counted by hand until D-011 (2027) | Seven codes logged; each tested from a logged-out browser |
| 10 | SC | 15 min | Update bios on X, YouTube, Instagram and Facebook to the 05-SOCIAL-MEDIA §4 lines. The X/YouTube line "We test hardware until it breaks" goes: there is no hardware testing [R02] | Social profiles stop promising what the site does not do | Four bios changed; screenshots in the sheet |
| 11 | EIC | 20 min | Send the gtadb.org email (text below) and log it as D-020 | Starts the legal check the map tracker (C11) and any data PR depend on | Email sent; reply deadline 16 Oct noted in the sheet |
| 12 | EIC | 15 min | Brief ED: from today, news must fit pillars P1–P5 (spine §4). No general tech or phones, no Genshin guides, no rewrites without a TechPlay data point or link (Stop-Doing list below) | Writer hours move to formats TechPlay can win | Brief posted; ED confirms |
| 13 | ED | 90 min | Publish F01 Out This Week #1 (C04): "Out this week: Minecraft Dungeons II, Ace Combat 8 and the Steam Autumn Sale". Entries: 29 Sep Minecraft Dungeons II; 30 Sep PS Plus Essential October reveal (reported); 1 Oct Ghost of Yōtei Complete Edition (reported); 2 Oct Ace Combat 8; Steam Autumn Sale 1–8 Oct. Each game name links to its `/games/` page; each unreleased game gets "Remind me" [R05 §1] | The first post that only TechPlay's calendar makes easy; internal links into the catalogue | Article live with ≥5 game links; posted to Discord with `c04-out-this-week` |
| 14 | SC | 15 min | C37: Discord thread and forum thread "What are you playing this week?" Body: "One game, one line on why. If it's on your TechPlay shelf, paste the link." | Starts the Monday ritual [R13 ritual 1] | Thread live in both places |
| 15 | SC | 10 min | C06 day 1 of the countdown on IG/FB Stories and X: "52 days to GTA VI. 19 November, PS5 and Xbox Series X|S. No PC version at launch." Link to /gta6 with `utm_source=instagram&utm_medium=organic-social&utm_campaign=c06-gta6-countdown&utm_content=f02-day52-story` | The daily habit starts on the confirmed facts only [R17 §2] | Posted on 3 networks |

### Copy for the 24-hour fixes (D-001, D-040)

| File:line | Now | Replace with |
|---|---|---|
| `RegisterClient.tsx:33`, `BrandPanel.tsx:21` | "Earn XP for every comment and article you read" | "Earn XP for comments, ratings and the games you finish" |
| `RegisterClient.tsx:202-204` | "15K+ MEMBERS · 50K+ GAMES · FREE FOREVER" | "333,000+ GAMES · 5 PLATFORMS · FREE". The figure comes from the API, rounded down to the thousand; drop it if the API is unavailable |
| `LoginClient.tsx:23-25` | "15K+ MEMBERS · 50K+ GAMES · 24/7 COMMUNITY" | "333,000+ GAMES · 5 PLATFORMS · FREE" (same rule) |
| `Gta6NewsletterCTA.tsx:51-56` | "Don't miss a single GTA 6 drop — Join thousands of fans and get the latest news, leaks and updates — straight to your inbox." · "Join the Crew" | Headline "GTA VI, once a week, until 19 November". Body "What Rockstar confirmed, what is still rumour, and the dates that matter. One email a week, then launch week." Button "Send me the briefing" (no "leaks": Rockstar polices IP actively [R17 §10]) |
| `WowAnalyzerClient.tsx:186-196` | "50K+ players analyzed · 4.9/5 rating" | "Free · No login · Data from Blizzard and Raider.IO" |
| `WowAnalyzerClient.tsx:565` | "Midnight launches March 2, 2026. Analyze your WoW character now…" | "Check any character's gear, Mythic+ score and raid progress, and get a short list of what to fix next. Free, no login." |
| `app/wow-analyzer/page.tsx:6-7` | "Free Midnight Readiness Score… expert tips from Profesor Buffy" | Title "WoW Character Analyzer: free readiness check for your main". Description "Check gear, Mythic+ score, raid progress and collections for any World of Warcraft character. Free, no login, data from Blizzard and Raider.IO." |
| `HomeHero.tsx:43` | "3 · Platforms in one place" | "5 · Platforms that import" |
| `LeaderboardClient.tsx:645` | "Read articles and leave comments" | "Leave comments and rate games" |

### Email to gtadb.org (EIC, D-020)

> Subject: Credit for GTA VI location data on techplay.gg
>
> Hello, I'm Adi Zeljković, editor of TechPlay (techplay.gg), an independent gaming publication in Sarajevo. Our GTA VI map at techplay.gg/gta6/map uses location records that appear to come from map.gtadb.org. Before we build anything on top of it, we want to get this right. May we keep using the data? If yes, how would you like to be credited (wording and link)? If you would rather we remove it, say so and we will. Thank you, Adi

## NEXT 3 DAYS — to Wednesday 30 Sep

| # | Owner | Time | Exact action | Expected effect | Done when |
|---|---|---|---|---|---|
| 1 | DEV | 2 h | **D-001, second half.** Add the `1[34][0-9],?000\+?` pattern to `FixSeoGameCounts.php`, run `php artisan seo:fix-game-counts --dry-run`, send the list to EIC, then run it for real. Also fix the `lib/seo.ts:187` fallback ("141,000-game catalogue" → "the game catalogue") | "140,000+" disappears from six titles and descriptions [R02 Appx B] | Dry-run list approved; live `<title>` of /games carries no stale figure |
| 2 | DEV | 2 h | **D-040.** Apply the WoW copy above to `app/wow-analyzer/page.tsx:6-270`; remove the ~100-entry `keywords` array; spell "Professor"; OG → `/og/wow-analyzer.jpg` (DS file, ≤300 KB) | The unique tool stops advertising a past date [R10 §3] | Page source shows the new title, no keywords list, and the OG image under 300 KB |
| 3 | DEV | 2 h | **D-002.** Breadcrumb href built from `lib/categories.ts` and `articleHref()` in `ArticleDetailView.tsx:147` | The 404 on every article disappears [R02 §11.1] | 20 sampled breadcrumbs return 200 |
| 4 | DEV | 1 h | **D-020 (DEV part).** Count GtaLocation rows with `gtadb_key` and `is_unconfirmed`; note that the seeder reads `backend/database/data/gta6_landmarks.json` | EIC has facts for the gtadb conversation | Two numbers in the D-020 log |
| 5 | EIC | 45 min | Public draw of the old World of Tanks giveaway in Filament (pickWinner). Contact the winner by hand. Publish a short note on /news and in Discord: "We ran this draw late. Here is the winner, and what we changed so it does not happen again" (base points on entry, IP limit, daily unfinished-draw check) | Removes the most damaging fact about the giveaway system before C09 is promoted | Winner contacted; note live; Discord post pinned for 7 days |
| 6 | SC | 1 h | C09 promotion, only if EIC confirmed "live" and D-039a/b and D-041 are deployed. Discord post with `c09-gta6-giveaway`, X post, and an article-end swap (automatic through `JoinPrompt`). Use no share or retweet task in any Meta-facing post [R16 §2.15] | Entries start from people who can actually win | Post live; first `giveaway_entered` rows visible in Filament |
| 7 | ED | 1 h | C07 ledger rows for `/gta6/everything-we-know` (the R17 §2 ledger: claim, status, source, date) sent to DEV by Tue 29 Sep. DEV pushes them Wed 30 Sep in ops time (D-062 interim) | The weekly "Confirmed or Rumour?" format exists before its first Thursday | Rows on the live page with a "last updated 30 Sep" line |
| 8 | EIC | 30 min | Filament → Page SEO: remove "Benchmarks" from the /hardware and /reviews titles (no benchmarks exist [R02 §6.2]). /hardware → "PC Hardware News, Fixes and Buying Advice". /reviews → "Game Reviews and Verdicts". /about description: replace "responds within 24 hours" with "two working days" | Titles stop promising content that does not exist | Live `<title>`s changed |
| 9 | EIC | 20 min | Filament → Support Tiers: remove the video promises ("Early access to videos", "Your name in video credits", supporter-only forum) from tier descriptions until they exist [R02 §6.2] | Supporter page stops selling undeliverable benefits | Tier text changed or tiers hidden |
| 10 | SC | 20 min | C39: Wednesday native Discord poll and X poll: "Sony plans to end PlayStation discs. Would it change what you buy?" Options: "I'd buy fewer games", "No change", "I'd buy more on PC", "I already buy digital". One line linking The Last Disc (C66) | Poll ritual starts on the week's live controversy [R06] | Polls live on 30 Sep |
| 11 | SC | 1 h | C35 start: enable Discord Onboarding and write the Server Guide's three to-dos (say hello, link your TechPlay account with `/link`, pick your platforms). **Do not rename `#new-people`**: the bot finds it by exact name until D-011a (`events.ts:80`) | New members get a first step [R13 §2] | Onboarding on; the welcome still posts in #new-people |
| 12 | DS | 3 h | Six GTA 6 OG images (1200×630, ≤300 KB) and the WoW Analyzer OG, delivered to DEV for D-017 and D-040 | Share previews load on X, Discord and WhatsApp [R02 §1.4] | Files in the shared folder with sizes listed |
| 13 | SC + EIC | 2 h | C40 The Save File #1 drafted for Fri 2 Oct (structure and subject lines owned by 17-NEWSLETTER-EMAIL §3). Test send to staff on Thu 1 Oct | First issue goes on time | Test received and clicked by two staff members |

## NEXT 7 DAYS — to Sunday 4 Oct

| # | Owner | Time | Exact action | Expected effect | Done when |
|---|---|---|---|---|---|
| 1 | DEV | 4 h | **D-012 part A.** New `/newsletter` page (what The Save File is, Friday send, sample link, form, privacy line) and a homepage section with `id="newsletter"`, so the unsubscribe page's `/#newsletter` link finally lands. Live by Thu 1 Oct | Social posts can link a capture page for issue #1 [R01 A.3.2] | `/newsletter` returns 200, is indexable and is in sitemap-pages; `/#newsletter` scrolls to the form |
| 2 | ED | 1 h | C07 launch Thu 1 Oct: F03 "Confirmed or Rumour?" on X and Threads, with the ledger link | Trust format tied to the hub [R17 §2] | Posted with the source line |
| 3 | ED | 2 h | C64 Hidden Gem Thursday #1 (1 Oct) and C60/F07 Fix It Friday #1 (2 Oct): "Shader compilation stutter: what it is and every fix that works" [R09 EA-001] | Pillar P2 starts with the evergreen that scores highest in its class [R21] | Both published and linked from Discord #pc-help |
| 4 | SC + EIC | 1 h | C40 The Save File #1 sent Fri 2 Oct at 15:00 Sarajevo time. Links tagged `utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026w40` | First send from the mail desk; click rate is the number to read (opens are a floor, README §20) | Sent; clicks, unsubscribes and complaints logged in the sheet on Mon 5 Oct |
| 5 | ED + SC | 3 h | C05 Steam Autumn Sale (1–8 Oct): "Steam Autumn Sale: 10 picks worth your wishlist", with game-page links and US prices labelled US | The first F16 Deal Radar; wishlist adds from the article | Published 1 Oct; carousel posted |
| 6 | EIC | 30 min | Search Console → Crawl stats: check for 4xx/403 answers to Googlebot in the last 7 days. DEV checks Cloudflare security events for challenges to verified bots. This is the cause of the collapse since 17 Aug [R03] | Confirms the crawler can reach the site before any SEO work counts | Zero challenges to verified bots in 7 days, noted in the sheet |
| 7 | EIC + DEV | 20 min | Filament → Settings → robots.txt: add `User-agent: Googlebot-News` / `Disallow: /games/`. DEV reads the live `/robots.txt` back | Stops catalogue pages from being the site's "news" [R02 §8.3]; the JSON-LD half of D-022 follows in W51 | Live robots.txt shows the block; the rest of the file is unchanged |
| 8 | EIC | 15 min | Filament → Seasons: confirm Season 2 "Overdrive" starts 1 Nov (two migrations disagree [R01]) | C67 date is real before anyone announces it | Dates noted; fixed in admin if wrong |
| 9 | SC | 30 min/day | C65 On This Day by hand in Discord #general from `/games/on-this-day`, and C06 countdown daily | Daily rituals keep running until automation (D-049, 2027) | Seven posts each by Sun 4 Oct |
| 10 | DS | 4 h | Templates: F01 carousel, F02 countdown story, F04 "The Number" card | Later posts are fills, not designs (spine §1) | Three templates in the shared folder |
| 11 | EIC | 10 min | Pixel decision prepared for 5 Oct: read 32 §"D-031: the 19 Oct question" | The November retargeting question is closed on time | Decision on Mon 5 Oct |

## NEXT 14 DAYS — to Sunday 11 Oct

| # | Owner | Time | Exact action | Expected effect | Done when |
|---|---|---|---|---|---|
| 1 | DEV | 8 h | **D-044 + D-045** by Tue 6 Oct: `data:release-congestion` (day-precise releases per ISO week, "notable" flag) and `/data/release-congestion-2026` (table, method, CSV, chart, Dataset JSON-LD) | C20 has a stable URL for its number [R14 §2] | Page live and CSV downloadable on 6 Oct |
| 2 | EIC | 4 h | C20 Release Congestion Index published Wed 7 Oct; pitch list and Reddit data post as in 22-DIGITAL-PR (C48) | First data story built on TechPlay's own rows | Published; pitches sent; replies logged |
| 3 | DEV | 8 h | **D-005** (GTA 6 news on the real game page, relinked through the model) and **D-017** page half (server-rendered H1 and counters, cross-links, PC row "Not announced", disclosure line) | The Q4 landing page shows real numbers to crawlers [R17 §1] | Server HTML of `/gta6` contains the counts; `/games/gta-6` lists no GTA VI news |
| 4 | DEV | 3 h | **D-012 part B** on Wed 7 Oct: shared form with `signup_source`, and CampaignAudience filter by source | From 8 Oct, GTA hub sign-ups can receive the GTA briefing alone | New sign-ups show a source in Filament |
| 5 | EIC | 10 min | GTA briefing #1 (8 Oct): earlier GTA-hub sign-ups carry no source (FACT), so send issue #1 once to all verified subscribers with a one-click "keep me on the GTA briefing" link | No one gets a series they did not choose | Sent; opt-in clicks counted |
| 6 | EIC | 1 h | C54 interim: publish "Who owns TechPlay, who pays for it, and how we use AI" as an article on 9 Oct, linked from /about. D-038 pages follow in December | Trust page exists for PR and partners [R02 §6.2] | Article live and linked |
| 7 | ED | 3 h | C16 Gears of War: E-Day (6 Oct): release time by region, platforms, and what to play first in the series (links to the series page) | Launch utility in pillar P1 | Published 5 Oct |
| 8 | EIC | 4 h | C52 Verdict #1 on Tue 6 Oct, on a game released 29 Sep–6 Oct that the team has played. Short verdict, score, "full review to follow" line | Review cadence restarts toward C53 (≥8 reviews by 14 Dec) [R08] | Published; the review count is logged |
| 9 | SC | 1 h | C13 WoW readiness push (5–12 Oct): F15 Tuesday post "Reset day: run your main through the Analyzer before 12.1.5". The patch date is a prediction [R05], so say "expected" | First tool-driven weekly ritual | Posts on 6 Oct; `tool_run` visible after D-007 |
| 10 | EIC | 2 h | C71 Next Fest outreach: email the first 10 studios with demos in Next Fest (19–26 Oct), offering a F23 diary slot | Demo codes and quotes for the diary | 10 emails sent; replies logged |
| 11 | ED | 1 h | C18: create the public TechPlay list "Steam Next Fest October 2026: demos we're trying" (lists already support likes, comments and OG cards) | Zero-DEV demo tracker; D-043 captures it later | List public with ≥15 entries by 16 Oct |
| 12 | SC | 1 h | C69 Steam Curator page created and filled with 10 recommendations (launch 20 Oct) | Store-page presence [R10 idea 43] | Curator page public with 10 entries |
| 13 | SC | 2 h | C35 complete by 12 Oct: channels, roles, Server Guide, AutoMod presets (12-DISCORD) | Ready for C36 from 12 Oct | Checklist in 12-DISCORD ticked |

## NEXT 30 DAYS — to Tuesday 27 Oct

| # | Owner | Time | Exact action | Expected effect | Done when |
|---|---|---|---|---|---|
| 1 | DEV | 10 h | **D-018** `/gta6/release-time` live Wed 14 Oct. The unlock time shows only if Rockstar announces it; until then the page says so | C08 promotion runs 14 Oct–19 Nov on a real tool [R17 §7.1] | Page live; "Remind me" sets the GTA VI reminder |
| 2 | ED + SC | 3 h/week | C08 promotion: countdown posts link the release-time page from 14 Oct; the Discord pin in #gta6 | `reminder_set` on GTA VI grows weekly (TARGET: rising week on week; baseline 0) | Weekly count in the sheet |
| 3 | DEV | 9 h | **D-003** RSS paths and tag purge (by 16 Oct); **D-029** hide zero modules (by 18 Oct); **D-017** OG swap | Feed readers and first-time visitors stop seeing 404s and zeros [R02 §11] | `/rss` items resolve; no "0 Members" on /forum for guests |
| 4 | ED | 2 h | C12 vehicle guide (21 Oct): fill `real_equivalent` in Filament only where a source exists; DEV ships **D-061** on Mon 19 Oct so the field shows | "gta 6 cars real life" answered with sourced rows [R17 §3 row 14] | ≥20 vehicles with a sourced equivalent |
| 5 | SC + EIC | 1 h | C09 close 20 Oct: EIC draws in Filament on 21 Oct and contacts the winner by hand (winner mail D-039f is not in 2026 DEV capacity); SC posts the winner (first name and initial only, with consent) | The first honest draw result in public | Winner block or post live on 21 Oct |
| 6 | DEV | 17 h | **D-033** date-change log (live by 25 Oct), **D-007 phase A** GA4 events, **D-014** register rewrite including `?from=` | Registration becomes measurable by source; the 2027 slip dataset starts | `registration_complete` with `from` in GA4 DebugView; first rows in `game_release_changes` |
| 7 | EIC | 30 min | In GA4 admin, mark `registration_complete`, `newsletter_verified` and `library_connected` as key events once D-007 phase A is live | Key events exist for C56 and C58 | Three key events marked |
| 8 | ED | 3 h/week | F09/C63 In Order every Saturday from 3 Oct (FF7, Persona, Metroid and God of War first, for Q1 2027; see 34) as articles until D-057 gives series pages an intro | Series-order demand builds months before the Q1 launches [R18] | Four In Order pieces by 24 Oct |
| 9 | ED | 1 h/week | C22 Studios Closed in 2026 as one article updated weekly from 14 Oct, with each studio linked to its `/studios/` page (dataset page later, D-060) | Studio Watch starts without code | Article updated every Wednesday |
| 10 | ED | 4 h | C17 MW4 hub (12 Oct–1 Nov) as a pillar article: requirements, Switch 2 notes, "which CoD should I get" | Launch-week utility without a new route [R18 #7] | Published 12 Oct; updated 23 Oct |
| 11 | ED + SC | 2 h/day | C18/F23 Next Fest Diary 19–26 Oct: 3 demos a day, rated, on the site, in Shorts and in Discord | Pillar content that fits Steam users (S1, S3) | Eight diary entries |
| 12 | DEV | 4 h | **D-044/D-045** Studio Atlas export and page by Tue 27 Oct for C21 on 28 Oct | C21 has its stable URL | `/data/studio-atlas` live 27 Oct |
| 13 | SC | 30 min/week | C36: every Monday, read "uses" per invite code in Discord and fill the sheet | Discord growth per campaign is known without D-011 | Weekly rows from 12 Oct |
| 14 | EIC | 1 h | Monthly review on Mon 26 Oct: baseline vs now for registrations, verified subscribers, Discord members, organic clicks, reminders set, Save File clicks | Keep, change or stop decisions based on four weeks of data | Review notes in the sheet |

## STOP DOING (Part 48)

Each line says what stops, the evidence, and what the hours go to instead. EIC enforces the list; SC flags breaches in the Monday review.

### Content

| Stop | Why (evidence) | Replace with | Owner / from |
|---|---|---|---|
| General tech and phone news in /hardware (iPhone, WhatsApp redesigns, AI apps) | Off-topic for a gaming brand; Discover rewards topic expertise [R02 §6.2; R08 table; R07] | F07 Fix It Friday and P2 PC performance pieces | ED, from 28 Sep |
| Genshin Impact guides | Three of four guides target Genshin, where Game8 and Icy Veins own search [R08] | F09 In Order and F07 fixes | ED, from 28 Sep |
| Commodity rewrites of widely covered news | 577 news pieces against 38 reviews and 4 guides; no body links; two authors carry 95% [R02; R08; R23 B14-15] | News only inside pillars P1–P5, each with a TechPlay data point (calendar, game page, dataset) and 3–5 links | ED, from 28 Sep |
| Codes pages, daily answers, Wordle-style content | "Do not copy": search demand without loyalty, owned by Valnet sites [R08 row 10; R12] | F06 On This Day from TechPlay's own data | ED, now |
| Full reviews 16–21 days after launch | They arrive after demand and cannot rank [R08] | F24 Verdict at launch, growing into a full review | EIC, from 6 Oct |
| Hubs for Minecraft, Fortnite, Roblox, EA FC, LoL, Valorant, PoE2 | Search owned by wikis and stat tools [R18 "Do not build"] | GTA VI, WoW/MMO, Steam, Switch 2 hubs | EIC, now |
| Titles and meta that promise benchmarks, "global media team", "24 hours" | No benchmark exists; About contradicts itself [R02 §6.2] | Titles that describe what is on the page | EIC, 30 Sep |

### Social busywork

| Stop | Why (evidence) | Replace with | Owner / from |
|---|---|---|---|
| Promoting YouTube (20 subscribers, no videos) as a main channel in the footer and posts | Promotes an empty channel over X, where the account is active [R02 §8.2] | X in the footer; YouTube Shorts as one output of the C49 vertical-video system | SC, 28 Sep |
| Posting the same link to every network with no format change | Channel classes differ (spine §12); nothing is measured per post | One post per platform format, with a UTM per spine §9 | SC, 28 Sep |
| Advertising giveaways that are not running (register page perk, Discord card "giveaway pings") | Promised in three places with nothing live and no winner ever [R02 §10] | Run one honest giveaway (C09) or remove the promise | EIC, 28 Sep |
| Opening new channels (Twitch, Pinterest, Snapchat, news aggregators) | NOT NOW class (spine §12); a two-person desk cannot feed them [R23 B15] | Depth on Discord, email and Search | EIC, now |
| Hand-typing campaign links | UTMs drift; the collector cannot read them anyway until D-008 [R16 §4] | The SC link sheet now, the D-009 helper in 2027 | SC, 28 Sep |
| Renaming Discord channels on impulse | The welcome breaks silently if `#new-people` changes (`events.ts:80`) | Rename only after D-011a | SC, now |

### SEO

| Stop | Why (evidence) | Replace with | Owner / from |
|---|---|---|---|
| Mass long-tail templates across the 295k game pages | Scaled-content policy; 0.7% of game pages carry original content; crawl reaches ~77 game pages a day [R03 §9; R01 B.5] | Enrich by demand (top few hundred games and upcoming releases) and decide the indexable set (D-021) | EIC, now |
| Keyword stuffing (the ~100-entry `keywords` array on the WoW Analyzer; stacked keyword titles) | Keywords meta carries no ranking value, and a stuffed page reads as low quality [R01 A.1.3] | One title per query the page answers ("WoW character checker") | DEV via D-040, 30 Sep |
| Treating IndexNow as the Google strategy | Google does not consume IndexNow [R01 B.12 #16] | Sitemaps, internal links (D-023) and working breadcrumbs (D-002) | DEV, now |
| Letting game pages stand in for news in Google News | 99 of 100 site results were catalogue pages [R02 §8.3] | robots.txt Googlebot-News block (7-day list) and D-022 | EIC, 4 Oct |
| Publishing rumours as facts on GTA 6 | Rumour volume is high; labelling protects Discover and News trust [R17 §10] | The Confirmed or Rumour? ledger | ED, 1 Oct |
| Writing numbers into prose by hand ("140,000+", "3 platforms") | Numbers rot and contradict each other across the site [R02 Appx B] | Live API figures or none | ED/DEV, now |

### Paid

| Stop | Why (evidence) | Replace with | Owner / from |
|---|---|---|---|
| Boosting posts from the Facebook or Instagram page | Worst targeting, no conversion optimisation, no UTM discipline [R16 §5.4] | Nothing until C03 measurement; then the structured tests C56 and C58 | EIC, now |
| Content-recommendation networks (Taboola, Outbrain, MGID), buy or sell side | [R16 §5.3, §2.14] | Organic distribution through Discord, email and Reddit contribution | EIC, now |
| X Ads | [R16 §5.7; spine §12 NOT NOW] | Organic X threads for F03 and F20 | EIC, now |
| Buying pageviews, traffic arbitrage, game-name keywords, PMax/Demand Gen | A paid click that ends in one pageview earns one AdSense impression; PMax needs 100+ conversions [R16 §5.1-2, 5.5-6] | Branded and tool-exact search only (C56), after measurement | EIC, now |
| Paid traffic to giveaways, or targeting under-18s | Share/retweet tasks conflict with Meta's promotions policy; teens cannot be followed up [R16 §5.8-9] | Giveaways promoted organically; all paid set to 18+ | EIC, now |

### Vanity metrics

| Stop reporting | Why (evidence) | Report instead | Owner / from |
|---|---|---|---|
| Follower counts on their own | They say nothing about returns; small networks swing on single posts | Clicks to the site per platform (UTM) and `discord_join` per invite code | SC, 5 Oct review |
| Total pageviews without session quality | 43 of 84 paid-ad visitors left within ten seconds; bots are flagged in the collector [R01 A.6; R16 §4.7] | Sessions with `is_bot = false`, returning sessions, registrations per 1,000 sessions | EIC, 5 Oct |
| Member and fan counts that are not live ("15K+", "thousands of fans") | False by a factor of about 250 [R02 §6.1] | Live API numbers or none, anywhere public | Everyone, 28 Sep |
| Email open rate | Apple MPP and Gmail proxies inflate opens (README §20) | Clicks per delivered email, unsubscribes and complaints per send | SC, from issue #1 |
| Giveaway entries counted as registrations | Giveaway-only accounts are an anti-metric [R11 §6; R16 §5.8] | Entrants who reach A2 (linked library or 3 shelf items) within 7 days | SC, 21 Oct |
| Indexed page count as success | 56,355 indexed, 1–2 clicks a day [R03] | Organic clicks, and indexed pages that carry TechPlay content | EIC, monthly |

## Dependencies and open questions

1. **Giveaway status (EIC, 28 Sep)** decides rows 24h-2, 3d-6 and D-039. If it is not live, C09 content moves to the next giveaway that 25-GIVEAWAYS plans.
2. **DEV's first week is full.** Any DEV request not in this file waits for the ops hours in W40 (2 h) or goes to 32's queue.
3. **UNVERIFIED:** whether Threads @techplay.gg is already held, and whether TikTok accepts the dotted handle (fallback @techplaygg, per 08-TIKTOK).
4. **Bluesky domain handle** needs a file served at `https://techplay.gg/.well-known/atproto-did` (DEV, XS, not in W40). The `.bsky.social` handle is used until then. No DNS change is planned.
5. **17-NEWSLETTER-EMAIL** plans "Your releases this week" from 26 Oct; DEV capacity moves it to 23 Nov (32). The welcome sequence moves from 12 Oct to about 6 Nov.
6. **The World of Tanks draw:** confirm the prize can still be delivered before announcing. If not, EIC says so publicly and offers the winner a replacement of equal value.
7. **The Stop-Doing list assumes EIC's authority over ED's topic choice.** If sponsorship or client work requires general tech coverage, it goes in a labelled section outside the gaming pillars.
