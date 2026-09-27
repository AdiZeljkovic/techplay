# 02 — Audiences

Status: Phase 2 plan — 27 Sep 2026

- Ten behavioural segments (S1–S10) defined by what people do with games, not by age or gender. No segment has a measured size on TechPlay; every "size signal" below is either a market fact from the research or UNKNOWN, and section 6 says how to measure each one from the first week of C03.
- **Q4 2026 priority order: S1 Release Planners, S4 GTA 6 Waiters, S2 Multi-platform Collectors, S10 Community Regulars, S5 MMO/WoW Players**, then S3, S7, S6, S8, S9. S1 comes first because nearly every other segment passes through it: a "remind me" on one game is the cheapest route to a shelf, an address, and a reason to come back [R11, R12].
- S4 is the largest and most crowded demand of the quarter. TechPlay ranks for none of 19 GTA 6 results pages [R03, R17]. We aim at the narrow jobs nobody pairs with an account (unlock time, confirmed vs rumour, real-world cars, map progress) and hand these readers over to S1 after 19 Nov.
- S2 is where TechPlay is actually different: free import from five platforms, when trackers charge $3–9 a month for PSN and Xbox [R04, R10]. Its limit is acquisition, not product: Steam is not yet a sign-in method [R11]. C44/D-015 decides how fast S2 grows.
- S10 is small (Discord has 160 members, 24 online [R13]) but it is where Weekly Returning Members come from first. It gets retention effort, not acquisition spend.
- The copy for every segment is conditional on dates. Nothing may promise an email or Discord alert before C43 goes live (19 Oct), Steam sign-in before D-015 ships (C44, 5–26 Oct), or a release-time tool before C08 (14 Oct). Until then reminders reach only the on-site bell [R12].
- Section 5 gives each segment exact one-line messages for seven moments: why visit, why return tomorrow, why register, why subscribe, why join Discord, why follow, why recommend.
- Out of scope for acquisition: under-18s in paid media, build and tier-list seekers, codes-page traffic (Roblox, Fortnite, Minecraft), and giveaway-only entrants [R09, R16, R18, R11].

---

## 1. How the segments were built

**Behaviour first.** Each segment is a recurring job a gamer does: plan a purchase, fix a stutter, wait for a launch, check a character before a patch. Every job maps to a first action TechPlay can record (`reminder_set`, `library_connected`, `tool_run`, `discord_join`), so segments can be counted once C03 ships. Demographics are not used. The research has none for TechPlay, and paid platforms target little besides age and location anyway [R16].

**Evidence used.** Real query patterns and IDs from the evergreen catalogue [R09] and the week's 60 question patterns [R06]. Subreddit and headline behaviour from 685 headlines and 772 Reddit titles [R06]. Product facts from the repo audit [R01] and the live audit [R02]. Registration and retention mechanics [R11, R12]. Community patterns [R13]. Hub scoring [R18].

**What we do not know (and will not guess).** Search volumes, TechPlay traffic by segment, country split beyond "US ≈ 35% of traffic" (docs/README.md §19 via [R16]), newsletter subscriber count, and follower counts on X, Facebook and Instagram [R02, R07]. One device fact exists: 1,487 phone requests against 184 desktop requests in the log sample cited in `JoinPrompt` [R11], and the marketing page says most traffic is mobile [R02]. **Every segment's first landing should be designed for a phone.**

**Overlap is normal.** One person can be S4 (waiting for GTA VI), S1 (has five reminders) and S10 (talks in Discord). For reporting, a member's **primary segment is the first qualifying action they take**. Their later actions add secondary tags (section 6).

### 1.1 Segment summary

| ID | Segment | Core job | Pillar [spine §4] | Primary landing | Activation action (A2 route) | Q4 rank |
|---|---|---|---|---|---|---|
| S1 | Release Planners | Know what's out, where, when, for how much; don't miss it | P1 | /calendar, unreleased /games/{slug} | 3 reminders (each creates a wishlist row [R01 B.2.10]) | 1 |
| S2 | Multi-platform Collectors | One record of everything owned and played | P1 | / ("Start your library"), /backlog-advisor | `library_connected` | 3 |
| S3 | PC Tinkerers | Make the game run | P2 | /guides/pc-fixes (new) | Steam connect (weak) | 6 |
| S4 | GTA 6 Waiters | Be ready on 19 Nov | P4 | /gta6, /gta6/release-time (new) | GTA VI + 2 more on shelf, or Xbox/PS link | 2 |
| S5 | MMO/WoW Players | Know if the character is ready | P3 | /wow-analyzer, /mmo (new) | saved character + Battle.net sign-up (see §3 S5 note) | 5 |
| S6 | Switch 2 Owners | Which edition, which upgrade, what runs | P1 | /switch-2 (new) | 3 manual shelf adds (no Nintendo import exists) | 8 |
| S7 | Deal Hunters | Pay less for what's already wanted | P1 | /steam (new), sale-pick articles | wishlist + price alert (D-027) | 7 |
| S8 | Industry Watchers | Understand the state of the business | P5 | /data/* (new), /studios | newsletter (accounts are secondary) | 9 |
| S9 | Balkan/regional gamers & devs | See their region counted | P5 | /studios/country/ba | as S2 (gamers) / none yet (devs) | 10 |
| S10 | Community Regulars | Belong somewhere, be recognised | all | Discord, /forum, /leaderboard | Discord `/link` → Discord OAuth | 4 |

---

## 2. Evidence base per segment (one line each)

| ID | Strongest evidence the segment exists and is reachable |
|---|---|
| S1 | Steam's own retention loop is the wishlist release/discount notification [R12]; TechPlay's calendar showed 1,422 September releases [R02]; "[game] release date" (EB-150) and "[game] release time" (EA-097/098) are template families [R09]. |
| S2 | The log is the mass behaviour on every tracker: Backloggd 69.6M plays logged, HLTB 24,538 new backlogs in 48 h [R11]; paid trackers charge for PSN/Xbox import [R04, R10]; 13 connected accounts average about 200 shelf rows each (ESTIMATE) [R11]. |
| S3 | Page one for shader stutter, Windows 11 settings and DX device-removed errors has no gaming outlet (EA-001/002/004) [R09]; Win11 is 70.97% and Win10 22.90% of the Steam survey, Aug 2026 [R09]. |
| S4 | 17 GTA 6 headlines in one week; r/GTA6 is detail-spotting and countdown threads [R06, R17]; Netflix preview drove 100,000+ sign-ups in six hours (reported) [R17]; seven or more countdown domains rank [R03]. |
| S5 | 13 Warcraft headlines in one week; WoW: Forever 4 Nov; the Analyzer is the only on-site character analyzer among media sites reviewed [R06, R18]. |
| S6 | Switch 2 at 23M+ units by Jun 2026, $499.99 from 1 Sep 2026; a steady stream of Switch 2 Editions through Dec [R05, R18]. |
| S7 | "Price and value" is one of the week's recurring gamer problems [R06 §7]; Deku Deals and IsThereAnyDeal make alerts the reason to hold an account [R12]. |
| S8 | 67 Xbox headlines and 29 on layoffs/closures in one week; "Xbox Game Studios Is Quickly Disappearing" reached the top of r/Games; single-number stories travel [R06]. |
| S9 | TechPlay is Sarajevo-based; four of its last 22 news items covered a regional conference; `/studios/country/ba` exists; A1 Adria League positions itself as "the home of esports & gaming in Adria" [R02, R15]. |
| S10 | Discord: 160 members, 24 online; bot mirrors XP, posts every article, runs a Sunday recap [R13]; 21 of 55 members entered a giveaway, 7 commented [R01]. |

---

## 3. Segment profiles

Query strings below are the exact patterns from [R09] (IDs given) or [R06] (pattern numbers). None carries a volume; volumes were not available [R09].

### S1 — Release Planners

| Field | Detail |
|---|---|
| Who they are | People who follow upcoming games, keep wishlists, and want the date, time and price to hand. Steam's wishlist notification is the proven model [R12]. TechPlay's checklist already promises "Wishlist something unreleased — we'll tell you when it lands" [R11], but the promise only holds for people who come back to see the bell. |
| Needs | Date, unlock time in their time zone, platforms, price, pre-load size, and a reminder that reaches them off-site. |
| Search behaviour | "[game] release date" (EB-150), "gta 6 release time" / "modern warfare 4 release time" (EA-097/098), "what time do steam games release" (EA-099), "game release dates november 2026" (EA-103), "[game] file size" (EA-101), "how to preload games ps5" (EA-100), "is [game] on game pass" (EA-094), "[season] end date" (R06 #58), "What time does [game] unlock?" (R06 #49). |
| Social behaviour | Countdowns, "out this week" lists and release-day threads (R13 ritual 4); r/Games weekly threads [R13]. They screenshot dates and share them in group chats (OBSERVATION, not measured). |
| Content interests | Weekly release lists, "where can I play it", launch hubs (Gears of War: E-Day 6 Oct, MW4 23 Oct), 2027 most-anticipated lists [spine §11]. |
| Problems | Dates move: GTA VI was delayed twice, Fable moved to avoid it [R17, R06]. Unlock times vary by region. TechPlay reminders stay in the bell today. Guests hit "Sign in to track" on the calendar [R01 A.3.1]. |
| Best acquisition channels | Google Search (release date and time templates), Discover, newsletter (C40, then C41), Discord release pings, one vertical video format (F01 via C49), X threads. |
| Best landing pages | /calendar · unreleased /games/{slug} · /gta6/release-time (new) · /steam (new) · /switch-2 (new) |
| Registration trigger | Tapping "Remind me on release day" on a game or calendar entry. This is the P1 conversion point in [R11 §4 rows 5–6]. |
| Retention trigger | Release-day alert by email or Discord DM (C43, from 19 Oct); Monday "Your releases this week" email (C41, first send 26 Oct); T-3 wishlist check already runs daily [R01 B.2.10]. |
| Best CTA (exact) | Button: **"Remind me on release day"** (existing copy, `ReleaseClient`). Guest modal title: **"Where should the reminder go?"** |
| Franchises | F01 Out This Week · F08 Where Can I Play It? · F20 Showcase Live · F21 The Save File · F23 Next Fest Diary |
| Campaigns | C04, C08, C16, C17, C18, C41, C43, C45, C59, C62, C70 |
| Size signal | UNKNOWN for TechPlay. Supply side only: 1,422 releases listed in September [R02]. First measure: `reminder_set` per week and wishlist rows per member (§6). |

### S2 — Multi-platform Collectors

| Field | Detail |
|---|---|
| Who they are | Players with libraries on Steam plus one or more consoles who want one record with hours. The log and diary pattern is the hook everywhere [R11 §2.5]. Sony's disc plans have made "what do I own, and where" a live worry [R06 §7]. |
| Needs | Everything owned in one place, hours counted without typing, "what should I play tonight", proof of taste (profile, favourites). |
| Search behaviour | "export howlongtobeat backlog" (EA-078, flagged in [R09] as TechPlay's direct acquisition audience), "how to clear gaming backlog" (EB-134), "what game should I play next" (EB-128/EA-106), "games like [game]" (EB-133), "games with cross save" (EA-073), "what kind of gamer are you quiz" (EB-135), "delisted games list" (EA-129), "Will my discs still work?" (R06 #59). |
| Social behaviour | r/patientgamers bi-weekly backlog thread; r/Games "What have you been playing"; year-in-review sharing (Steam Replay, Letterboxd, Goodreads, Reddit Recap) [R11, R12, R13]. |
| Content interests | Hidden gems, "games like", backlog advice, library statistics, Year in Review, physical vs digital. |
| Problems | Import friction outside Steam: PlayStation needs a pasted `npsso` token, GOG and Epic need pasted codes [R10]. No Nintendo import exists (the five platforms are Steam, PlayStation, Xbox, GOG, Epic). Steam is only a connect step after registration [R11 §5]. |
| Best acquisition channels | Reddit contribution (C47) with library data as the currency; Steam sign-in (C44/D-015); Discord `/library`, `/match`, `/backlog`; search on backlog and "what to play next" queries; Year in Review sharing (C28). |
| Best landing pages | / (hero "Start your library") · /backlog-advisor (guest mode needs D-037) · /register?from=<source> · /lists · /last-disc |
| Registration trigger | "Sign in through Steam". Registration and import become one step (D-015). Valve documents OpenID for exactly this [R11 §5]. |
| Retention trigger | Price drop on a wishlisted game (D-027/C31), Journal session proposals from Steam playtime, Monday releases email (C41), Year in Review (C28, 14–31 Dec). |
| Best CTA (exact) | **"Sign in through Steam"** (Valve's button), sub-line **"Your library fills itself, with the hours you've played."** Until D-015 ships: **"Start your library"** (existing). |
| Franchises | F05 Hidden Gem Thursday · F11 What Are You Playing? · F18 Games Like… · F19 Library Card · F22 Game Club |
| Campaigns | C28, C31, C37, C38, C44, C47, C64, C66, C68 |
| Size signal | Market: trackers charge for PSN/Xbox import [R04]. TechPlay: 13 connected accounts on 7 Sep; the 31 Aug code comment says 2 of 55 members had linked a platform [R01, R11]. Distinct linkers are UNKNOWN until the baseline query runs (03-FUNNEL §2). |

### S3 — PC Tinkerers

| Field | Detail |
|---|---|
| Who they are | PC players fixing performance, errors and anti-cheat blocks at every big launch [R06 §7.4, §7.6; R09 cluster A]. |
| Needs | A fix that works, in order, for their exact error; settings for their GPU tier; honest "can I run it". |
| Search behaviour | "shader compilation stutter fix" (EA-001), "DXGI_ERROR_DEVICE_REMOVED fix" (EA-002), "best Windows 11 settings for gaming" (EA-004), "how to enable secure boot for battlefield 6" (EA-006), "game crashes to desktop no error windows 11" (EA-009), "modern warfare 4 system requirements" (EA-086), "can I run [game]" (EA-091), "modern warfare 4 best settings" (EA-050), "dlss vs fsr vs xess" (EA-027), "how much vram do I need" (EA-037), "Is this a good GPU?" (R06 #40). |
| Social behaviour | r/pcgaming and r/pcmasterrace: hardware deals, "is this a good GPU", troubleshooting threads [R06]. They trust answers that show steps, not opinions. |
| Content interests | Fix guides, per-game settings, "worth it in 2026" verdicts, Steam most-played movers, handheld settings. |
| Problems | Page one is held by utility-software blogs [R09]. TechPlay's `/hardware` and `/reviews` titles promise "benchmarks" that do not exist [R02], so remove them (D-001) before courting this segment. No saved-PC-spec feature exists ("PC Specs was never displayed") [R01 A.8]. |
| Best acquisition channels | Google Search (PRIMARY), Reddit helpful answers (C47), F07 as a 60-second vertical video (C49), Discord #pc-help. |
| Best landing pages | /guides/pc-fixes (new, C60, 12 Oct) · /hardware · /games/{slug} (requirements block) · /steam (new) |
| Registration trigger | Weak: no account-only PC feature exists. Convert to newsletter and Discord first. For accounts, route through S2 with "Sign in through Steam" on game-specific fix pages. |
| Retention trigger | Fix It Friday every week; a fix page that says "Updated {date}" and changes when drivers or patches change. |
| Best CTA (exact) | **"Still stuck? Post your error in #pc-help on our Discord"** and **"One PC fix every Friday — get The Save File"** |
| Franchises | F07 Fix It Friday · F10 Worth It in 2026? · F13 Steam Movers |
| Campaigns | C17, C47, C49, C60, C62 |
| Size signal | Platform-wide only: Win11 70.97%, Win10 22.90% of Steam survey (Aug 2026) [R09]. TechPlay share UNKNOWN; search is at 1–2 clicks a day, so this segment pays off mostly in Q1 2027 [R03]. |

### S4 — GTA 6 Waiters

| Field | Detail |
|---|---|
| Who they are | Everyone counting down to 19 Nov 2026 (PS5, Xbox Series X\|S, $79.99 / $99.99 Ultimate, single-player at launch, no PC at launch) [R17]. r/GTA6 spends its time on detail-spotting, map size, spending and editions [R06, R17]. |
| Needs | Unlock time where they live, pre-load size, which console, edition differences, what is confirmed vs rumour, then after launch: map progress, collectibles, cars. |
| Search behaviour | "gta 6 release time" (EA-097), "is gta 6 coming to pc" (EA-079), "gta 6 price" (EB-109), "gta 6 file size" (EB-114), "gta 6 pre load time", "gta 6 cars real life", "gta 6 30fps / 60fps", "gta 6 collectibles map" [R17 §3], "gta 6 map size" (EB-107), "gta games in order" (EB-020), "How much have you spent on [game]?" (R06 #16). |
| Social behaviour | Frame-by-frame detail posts, map-size videos, countdown threads, edition and scalper talk [R17 §5]; a TikTok "widows" trend around Lucia is reported but UNVERIFIED [R06]. |
| Content interests | Daily confirmed fact, weekly ledger, vehicles with real-world equivalents, "every GTA in order", launch-week performance. |
| Problems | Rumour fog; PC players cannot play at launch; TechPlay's own hub contradicts itself on PC ("PC — Coming Soon" vs "not yet confirmed"), shows "0" counters before hydration, and links a dead Discord invite [R17]. GTA 6 news sits on a 2019 parody page (D-005). |
| Best acquisition channels | IG/FB Stories, X and Threads daily countdown (F02/C06); Reddit comments with sourced facts (C47) and the paid Reddit hub test (C58, 9–25 Nov, 18+); Shorts 3×/week; Discord #gta6; GTA briefing segment of the newsletter. |
| Best landing pages | /gta6 · /gta6/release-time (new) · /gta6/everything-we-know · /gta6/map · /gta6/vehicles · /games/grand-theft-auto-vi |
| Registration trigger | Before launch: "Remind me when GTA VI unlocks" on the release-time tool (C08). At launch: "Save your map progress" (C11). |
| Retention trigger | Weekly ledger (F03), launch-day alert (C43), map progress tracker from 19 Nov, then the S1 handover: "what to play after GTA VI" and 2027 anticipated (C70). |
| Best CTA (exact) | **"Remind me when GTA VI unlocks in my time zone"** (from 14 Oct); before then **"Remind me on release day"** on /games/grand-theft-auto-vi |
| Franchises | F02 GTA 6 Countdown · F03 Confirmed or Rumour? · F09 In Order (GTA) · F20 Showcase Live · F22 Game Club (Nov: GTA VI) |
| Campaigns | C06, C07, C08, C09 (verify 28 Sep), C10, C11, C12, C23, C38, C50, C58 |
| Size signal | Strongest demand evidence of any segment (Netflix preview 100,000+ sign-ups, reported [R17]; dozens of fan domains [R03]) and the highest competition. TechPlay share UNKNOWN. Seasonal: plan for decay after January. |

### S5 — MMO/WoW Players

| Field | Detail |
|---|---|
| Who they are | WoW players on the weekly reset rhythm, plus lapsed and curious players weighing WoW, FFXIV and GW2 [R13, R18]. Guild recruitment posts follow a strict format (realm, progression, raid nights), which the Analyzer already understands [R13]. |
| Needs | "Is my character ready?", what to do this reset, whether returning is worth it, which MMO to pick. |
| Search behaviour | "is wow worth playing in 2026" (EB-059), "guild wars 2 vs wow" (EB-062), "best mmo 2026" (EB-060), "what is a good raider io score" (EB-064), "wow retail or classic" (EB-068), "best class for beginners wow" (EB-067), "how to get into ffxiv" (EB-061), "ffxiv evercold release date" (EB-148), "wow midnight season 2 start date" (EB-144), "What to do when I want to play but have nothing to do?" (R06 #21). |
| Social behaviour | r/wow, r/ffxiv, r/Guildwars2 questions; guild Discords; Blizzard forums (flag, don't reply) [R13]. |
| Content interests | Patch readiness, WoW: Forever explainer (4 Nov), MMO comparisons, weekly tips. |
| Problems | Analyzer copy is stale and partly false ("Midnight launches March 2, 2026", "50K+ players analyzed · 4.9/5") [R02]; "Profesor Buffy's Tips" is misspelled [R13]; Wowhead and Icy Veins own guides, so do not write class guides [R09]. |
| Best acquisition channels | r/wow helpful answers (C47), Discord #wow, X on reset day (F15), Reddit paid test on the Analyzer (C58), search for comparison and "worth it" queries. |
| Best landing pages | /wow-analyzer · /mmo (new, C15, 10 Nov) |
| Registration trigger | After a result: "Save this character". Battle.net sign-up is one click and skips Turnstile [R11 §5]. |
| Retention trigger | Weekly re-check on reset day (F15); patch-day re-run (C13); WoW weekly segment of the newsletter. |
| Best CTA (exact) | **"Analyze my character"** (existing, keep "No account required"), then **"Save this character and re-check it after the next reset"** |
| Franchises | F15 Readiness Check · F04 The Number (MMO stats) · F20 Showcase Live (only if a Blizzard showcase is announced; none is on the R05 calendar) |
| Campaigns | C13, C14, C15, C47, C58 |
| Size signal | UNKNOWN. `WowAnalysis` rows exist but no count is in the README [R01 B.7]; query first. |

**S5 note.** Battle.net is a sign-in, not a library connector, and WoW is not a Steam or console title. A WoW player can reach A1 and A3 and never reach the canonical A2. Keep A2 as defined [R11 §6], and report "saved character" as a segment-specific activation next to it (open question, section 8).

### S6 — Switch 2 Owners

| Field | Detail |
|---|---|
| Who they are | Owners and buyers of Switch 2 dealing with editions, upgrade packs, key cards and performance [R18]. Nintendo Life's polls draw thousands of votes while ratings stay thin [R04, R11]. |
| Needs | Is the Switch 2 Edition worth the upgrade price, what's a key card, which games run better docked, what's coming. |
| Search behaviour | "what is a game key card switch 2" (EA-017), "switch 2 vrr docked" (EA-016), "switch to switch 2 transfer" (EA-076), "does switch 2 play switch games" (EB-122), "switch 2 backwards compatibility list" (EA-128), "upcoming switch 2 games" (EB-124), "best switch 2 games" (EB-123), "best microsd express switch 2" (EA-124), "is switch 2 worth it 2026" (EA-110), "monster hunter wilds switch 2" (EB-126). |
| Social behaviour | Poll-heavy, edition comparisons, price complaints after the rise to $499.99 [R06, R18]. |
| Content interests | Edition tracker, upcoming list (Dragon's Dogma 2 9 Oct, Minecraft Bedrock 27 Oct, Pikmin 4 and Metaphor 12 Nov, Xenoblade 3 3 Dec, MH Wilds 4 Dec) [spine §11]. |
| Problems | TechPlay has no Nintendo library import, so the shelf is manual. Per-game edition data does not exist yet and needs editorial entry [R18]. |
| Best acquisition channels | Search and Discover (edition and key-card explainers), IG carousels (F08), newsletter. |
| Best landing pages | /switch-2 (new, C61, 26 Oct) · /calendar filtered to Switch 2 · /games/{slug} |
| Registration trigger | "Remind me" on a Switch 2 Edition release. |
| Retention trigger | Switch 2 releases in the Monday personalised email (C41). |
| Best CTA (exact) | **"Remind me when the Switch 2 Edition is out"** |
| Franchises | F08 Where Can I Play It? · F01 Out This Week · F09 In Order (Metroid, from Jan) |
| Campaigns | C61, C04, C41, C45 |
| Size signal | Market: 23M+ units by Jun 2026 [R05]. TechPlay share UNKNOWN. |

### S7 — Deal Hunters

| Field | Detail |
|---|---|
| Who they are | Players who buy on sale and hold wishlists for that reason. "Would you take that deal?" threads, rising prices, $80 games and subscription changes run through the week's conversation [R06]. |
| Needs | Is this a real low, is it on my subscription already, tell me when it drops. |
| Search behaviour | "game pass vs ps plus" (EA-112), "ps plus games this month" (EA-096), "ps plus extra vs premium" (EA-093), "is [game] on game pass" (EA-094), "is steam deck worth it 2026" (EA-109), "best budget gpu 2026" (EA-119), "Would you take that deal?" (R06 #41). Sale-specific queries were not researched: UNKNOWN. |
| Social behaviour | r/GameDeals culture, deal threads per sale (R13 ritual 18). |
| Content interests | Sale picks filtered by wishlists, value per hour (C25), $80 tracker (C24). |
| Problems | TechPlay prices cover shelved games only, from Steam and GOG, in US prices [R10, R14]. Copy must say "Steam price (US)" until regional prices exist. Affiliate links need disclosure [R02, R20]. Deal-only users may be low-WRM, like giveaway-only accounts [R11]. |
| Best acquisition channels | Newsletter specials, IG carousels, X during sales, Discord deals thread. |
| Best landing pages | /steam (new, C62, 2 Nov) · sale-pick articles (C05, C32, C34) · /games/{slug} price block |
| Registration trigger | "Alert me when it's cheaper" on a wishlisted game (D-027, C31 from 20 Nov). |
| Retention trigger | Price-drop alerts (C43 channel), sale specials. |
| Best CTA (exact) | **"Alert me when it's cheaper"** |
| Franchises | F16 Deal Radar · F10 Worth It in 2026? · F21 The Save File (sale issue) |
| Campaigns | C05, C24, C25, C31, C32, C33, C34 |
| Size signal | UNKNOWN. |

### S8 — Industry Watchers

| Field | Detail |
|---|---|
| Who they are | Readers, journalists, developers and PR people following closures, layoffs, pricing and platform strategy. The week's biggest story was Xbox's restructuring [R06]. |
| Needs | The whole board rather than one headline, sources, charts they can cite. |
| Search behaviour | Mostly news-led, not evergreen: "Which studios and games are affected by [layoffs]?" (R06 #60), "Will my discs still work?" (R06 #59), "delisted games list" (EA-129). |
| Social behaviour | X, Bluesky, LinkedIn; r/Games explainer threads; r/dataisbeautiful for charts [R06, R14]. |
| Content interests | Studio closure tracker, release congestion, sequel gaps, $80 tracker, State of the Catalogue. |
| Problems | Story fatigue; rewrites of the same news; the need for original data TechPlay actually has (57,630 studios, release dates) [R14]. |
| Best acquisition channels | PR outreach (C20–C27), Reddit data posts (C48), X, Bluesky, LinkedIn (Thu only), newsletter. |
| Best landing pages | /data/release-congestion-2026 (new) · /data/studios-closed-2026 (new) · /data/studio-atlas (new) · /studios · /press (new) · /last-disc |
| Registration trigger | Low. The goal is a newsletter address and a link, not an account. |
| Retention trigger | Weekly tracker updates (F17), monthly data story. |
| Best CTA (exact) | **"Get the next dataset first — The Save File, Fridays"** and on every chart **"Sources and method below. Cite TechPlay.gg and link this page."** |
| Franchises | F04 The Number · F13 Steam Movers · F17 Studio Watch |
| Campaigns | C20, C21, C22, C23, C24, C25, C26, C27, C48, C54, C66 |
| Size signal | UNKNOWN. Value is links and authority for Discover and News, not accounts. |

### S9 — Balkan/regional gamers & devs

| Field | Detail |
|---|---|
| Who they are | Players and developers in Bosnia and Herzegovina and the wider region who would read a home-region angle. TechPlay is Sarajevo-based and covers regional events [R02]. `/studios/country/ba` exists [R15]. |
| Needs | Their studios and games counted and linked; regional partners (A1 Adria League); English-first coverage that knows the region. |
| Search behaviour | UNKNOWN. Local-language queries were not researched. The site is English-only with no hreflang [R01 A.4.6]. |
| Social behaviour | UNKNOWN beyond a sensible WhatsApp share button [R02]. Regional outlets (Netokracija, Bug.hr, Benchmark.rs, klix.ba) are unverified as games coverers [R14]. |
| Content interests | Balkan Game Dev Census, Ex-Yu games directory, Next Fest demos from the region [R14 #8, #38, #46]. |
| Problems | No local-language pages; no evidence of how many regional readers exist. |
| Best acquisition channels | Regional press pitch (C21), partnerships (C55), studio outreach during Next Fest (C71). |
| Best landing pages | /studios/country/ba · /data/studio-atlas (new) · /studios |
| Registration trigger | Gamers: as S2. Developers: none yet (no "claim your studio" feature exists; do not promise one). |
| Retention trigger | Regional data updates; studio page corrections acknowledged publicly. |
| Best CTA (exact) | **"Missing a studio from your country? Tell us and we'll add it with a source."** (links to the editorial inbox) |
| Franchises | F17 Studio Watch · F04 The Number |
| Campaigns | C21, C55, C71 |
| Size signal | UNKNOWN. |

### S10 — Community Regulars

| Field | Detail |
|---|---|
| Who they are | The 160 people in the Discord [R13] and the handful who comment (22 comments site-wide) or post (7 threads) [R01]. They are the likeliest Weekly Returning Members. |
| Needs | People to talk to, recognition, rituals, a say in what TechPlay covers. |
| Search behaviour | Not search-led. Arrive via Discord, direct visits and the bot. |
| Social behaviour | Discord first. Discord's own guide calls about 30% of members communicating healthy [R13]. |
| Content interests | Weekly threads, polls, Game Club, awards, member spotlights, leaderboards. |
| Problems | Two dead invites (`discord.gg/techplaygg`, `discord.gg/techplay`); no Onboarding; empty public counters ("0 Members", "Discussion (0)"); first three comments held; Discord `/daily` pays uncapped XP that the site does not [R13, R01 B.2.7]. |
| Best acquisition channels | Discord invite codes per campaign (C36), the bot's `/link`, newsletter, site rituals mirrored in Discord. |
| Best landing pages | Discord (https://discord.gg/wPQG9gUMXH) · /forum · /leaderboard · /awards/2026 (new) |
| Registration trigger | Bot replies to an unlinked member using `/profile`, `/library` or `/daily` with a one-click Discord OAuth link [R11 §4 row 20, P1]. |
| Retention trigger | F11 Monday, F12 Wednesday, F14 Sunday wrap, F22 monthly Game Club, Season 2 "Overdrive" (C67). |
| Best CTA (exact) | **"Link your TechPlay account with /link — your shelf answers in Discord too."** |
| Franchises | F11 · F12 · F14 · F19 · F22 · F06 On This Day |
| Campaigns | C29, C30, C35, C36, C37, C38, C39, C65, C67, C68 |
| Size signal | FACT: 160 Discord members, 24 online (27 Sep) [R13]. TARGET 500 by 31 Dec (C36). |

---

## 4. Priority ranking for Q4 2026

Scores are ESTIMATE (1–5). **Timing** = demand concentrated in 28 Sep–31 Dec. **Fit** = how directly the segment reaches A2 and WRM. **Reach now** = can we reach them without organic search, which is near zero [R03]. **Cost** = inverse of team hours needed (5 = cheap). **Evidence** = strength of research support.

| Rank | Segment | Timing | Fit | Reach now | Cost | Evidence | Total | Reasoning |
|---|---|---|---|---|---|---|---|---|
| 1 | S1 Release Planners | 5 | 5 | 4 | 4 | 4 | 22 | Densest release quarter on the calendar [R05]; reminders already exist and create shelf rows; every segment converts through a reminder; C41/C43/C45 all serve it. |
| 2 | S4 GTA 6 Waiters | 5 | 3 | 4 | 3 | 5 | 20 | Biggest demand spike (19 Nov); reachable through daily social and Discord without search; competition means we aim at tools, not news. Handed over to S1 after launch. |
| 3 | S2 Multi-platform Collectors | 3 | 5 | 3 | 3 | 5 | 19 | The differentiator; A2 happens at the moment of sign-up once Steam sign-in ships; Year in Review (C28) is a December share moment. Depends on D-015. |
| 4 | S10 Community Regulars | 3 | 5 | 5 | 4 | 3 | 20* | Already in the room and cheapest to convert (`/link`), so it ranks 4th for acquisition. *For retention it ranks first: it is the WRM floor. |
| 5 | S5 MMO/WoW Players | 4 | 3 | 3 | 4 | 4 | 18 | Unique tool; WoW: Forever 4 Nov and patch ~6 Oct; small, but the Analyzer needs no account to try. |
| 6 | S3 PC Tinkerers | 3 | 2 | 2 | 3 | 5 | 15 | Best evergreen gap [R09], but it pays through search, which is recovering from zero. Build the hub now for Q1 payoff. |
| 7 | S7 Deal Hunters | 5 | 3 | 3 | 3 | 2 | 16 | Three sale windows in the quarter; price data is Steam/US only and alerts arrive late (C31 from 20 Nov). |
| 8 | S6 Switch 2 Owners | 4 | 2 | 2 | 2 | 4 | 14 | Large install base, but no Nintendo import, edition data needs entry, and it depends on search and Discover. |
| 9 | S8 Industry Watchers | 4 | 1 | 3 | 3 | 4 | 15 | Valuable for links and Discover authority (C20–C26), weak for accounts; served by PR work already planned. |
| 10 | S9 Balkan/regional | 2 | 2 | 3 | 4 | 2 | 13 | Cheap identity and regional PR (C21, C55); no evidence of reader volume. |

**What this means for the team (RECOMMENDATION).** Weekly audience-facing work goes first to S1 formats (F01, calendar CTAs), then to S4 through 22 Nov, then to S2 once D-015 is live. S10 rituals run every week regardless, because they are cheap (SC time, templated) and they feed WRM. S3 and S6 get only what their hub launches require (C60, C61) until search clicks recover. S8 and S9 run on the PR calendar, not weekly.

**Re-rank trigger.** Re-score on 2 Nov and 7 Dec using measured `registration_complete` and A2 by `from=` and `utm_campaign`. Any segment whose A2 rate is below half the site average for two consecutive weeks drops one rank.

---

## 5. Message matrix — why visit, return, register, subscribe, join, follow, recommend

One line per moment. Brackets show the earliest date the line is true. "The Save File" is the Friday newsletter (F21/C40). Discord link: https://discord.gg/wPQG9gUMXH. X handle: @TechPlayGG [R02].

### S1 Release Planners

| Moment | Message |
|---|---|
| Why visit | Every notable release this week, with platforms, price and the day it unlocks, on one page. |
| Why return tomorrow | Release dates move; the calendar moves with them, so check before you pre-order. |
| Why register | Tap "Remind me on release day" and it goes on your shelf and in your calendar. (From 19 Oct: "…and we'll email you the morning it's out.") |
| Why subscribe | The Save File lands on Fridays: next week's releases, what slipped, and one number worth knowing. |
| Why join Discord | Release-day pings in one channel, and a Monday thread on what everyone is actually playing. |
| Why follow | Follow @TechPlayGG for Out This Week every Monday morning. |
| Why recommend | Waiting for the same game as a friend? Send them the calendar entry. (Needs a share control on calendar/game pages; see §8.) |

### S2 Multi-platform Collectors

| Moment | Message |
|---|---|
| Why visit | See what you own across Steam, PlayStation, Xbox, GOG and Epic in one place, with the hours already on it. |
| Why return tomorrow | Play tonight; tomorrow your Steam hours are already counted and the session is waiting for you to confirm. |
| Why register | Connect a store and your shelf fills itself. Free, no card. |
| Why subscribe | The Save File: one hidden gem and one "games like" pick every Friday. |
| Why join Discord | Ask Buffy `/backlog` and get three games you already own and haven't finished. |
| Why follow | Follow us on Instagram for Hidden Gem Thursday. |
| Why recommend | Send a friend your Taste Match link and see how close your libraries really are. |

### S3 PC Tinkerers

| Moment | Message |
|---|---|
| Why visit | The fix, in order, with what each step changes, and nothing you have to download from us. |
| Why return tomorrow | We update the page when a driver or patch changes the answer; the date is at the top. |
| Why register | Sign in through Steam and see which of your games a fix applies to. (Only once D-015 ships and the page links fixes to games; until then, do not use.) |
| Why subscribe | One PC fix every Friday in The Save File, tested steps only. |
| Why join Discord | Post your error in #pc-help and someone who has seen it will answer. |
| Why follow | Follow @TechPlayGG for Fix It Friday. |
| Why recommend | If this fixed it, drop the link in the thread where you found the problem. |

### S4 GTA 6 Waiters

| Moment | Message |
|---|---|
| Why visit | What Rockstar has confirmed about GTA VI, with a source and a date on every line. |
| Why return tomorrow | One new confirmed fact a day until 19 November. |
| Why register | Set a reminder for the minute GTA VI unlocks where you live. (From 14 Oct; before that: "Remind me on release day.") |
| Why subscribe | A Thursday GTA VI briefing: what changed, what's still rumour. |
| Why join Discord | #gta6 has the daily countdown, and the November Game Club is GTA VI. |
| Why follow | Follow @TechPlayGG for one confirmed GTA VI fact a day. |
| Why recommend | Settling a rumour with a friend? Send them the ledger line with its source. |

### S5 MMO/WoW Players

| Moment | Message |
|---|---|
| Why visit | Enter your character and realm and get a readiness check in seconds, no account needed. |
| Why return tomorrow | Your score moves when your gear does; re-check after tonight's run. |
| Why register | Save the character and re-check it after every reset without typing the realm again. |
| Why subscribe | A reset-day note in The Save File when a patch changes what matters. |
| Why join Discord | #wow runs a Tuesday readiness check and nobody sells gold there. |
| Why follow | Follow @TechPlayGG for the Readiness Check each reset day. |
| Why recommend | Send the check to your guild's new recruit before raid night. |

### S6 Switch 2 Owners

| Moment | Message |
|---|---|
| Why visit | Every Switch 2 Edition, what the upgrade costs, and whether the cartridge is a game key card. |
| Why return tomorrow | New editions and dates get added as Nintendo and publishers announce them. |
| Why register | Get a reminder when the Switch 2 Edition you're waiting for is out. |
| Why subscribe | Switch 2 releases for the week in Friday's Save File. |
| Why join Discord | Ask whether an upgrade is worth it before you pay for it. |
| Why follow | Follow us on Instagram for Where Can I Play It? every Tuesday and Saturday. |
| Why recommend | Send the edition page to anyone about to buy the wrong version. |

### S7 Deal Hunters

| Moment | Message |
|---|---|
| Why visit | Sale picks chosen from what readers actually wishlist, with the Steam price shown. |
| Why return tomorrow | Sale prices change daily in the first days; the picks page says when it was last checked. |
| Why register | Wishlist a game and we'll alert you when it drops. (From 20 Nov, Steam games, US prices.) |
| Why subscribe | A sale-day issue of The Save File when a big sale starts, and nothing extra otherwise. |
| Why join Discord | One deals thread per sale, no referral spam. |
| Why follow | Follow @TechPlayGG for Deal Radar during Steam sales. |
| Why recommend | Found it cheaper? Post the link in the Discord deals thread. |

### S8 Industry Watchers

| Moment | Message |
|---|---|
| Why visit | Studio closures, release congestion and prices as data you can check, with the method on the page. |
| Why return tomorrow | The trackers are updated every week and say what changed. |
| Why register | Not the ask. Point to the newsletter instead. |
| Why subscribe | The Save File sends the next dataset before it goes anywhere else. |
| Why join Discord | Argue about the numbers with people who read the method. |
| Why follow | Follow TechPlay on LinkedIn or Bluesky for the Thursday chart. (Neither account exists yet [R02]; use only once created.) |
| Why recommend | Cite the chart; the sources and method are underneath it. |

### S9 Balkan/regional

| Moment | Message |
|---|---|
| Why visit | Every game studio we can find in the region, counted and linked to its games. |
| Why return tomorrow | The count changes as studios write in with corrections. |
| Why register | Keep your library in one place, from a site written in Sarajevo. |
| Why subscribe | The Save File, with regional studio news when there is some. |
| Why join Discord | Talk to the editors directly; we're in the same time zone. |
| Why follow | Follow TechPlay on Facebook for regional studio news. |
| Why recommend | Know a studio we missed? Send them the page. |

### S10 Community Regulars

| Moment | Message |
|---|---|
| Why visit | What Are You Playing? every Monday, a poll every Wednesday, Buffy's wrap every Sunday. |
| Why return tomorrow | Your streak can pause for a day without resetting. (Only once a streak freeze exists [R12]; until then, do not use streak copy.) Use instead: "Someone probably answered your post." |
| Why register | Link Discord and your shelf, rank and XP show up in `/profile`. |
| Why subscribe | The Save File names the member of the week. (Only with the member's consent.) |
| Why join Discord | A server small enough that the editors answer you. |
| Why follow | Follow @TechPlayGG to see your Library Card if you opt in to F19. |
| Why recommend | Invite a friend with your own invite link; top inviters get a role. (Needs D-011 invite attribution.) |

---

## 6. Recognising segments in the data

Once C03 ships (D-007, D-008, D-011), each segment is tagged by its first qualifying signal. Tags are stored on the member (a proposal for DEV; nothing like this exists today).

| Segment | First qualifying signal | Event / source [spine §10] | Secondary signal |
|---|---|---|---|
| S1 | `reminder_set` or wishlist add on an unreleased game | `reminder_set`, `game_followed`, `shelf_add` (status=wishlist) | arrival on /calendar |
| S2 | platform connected, or ≥10 shelf items on day one | `library_connected` (platform), `shelf_add` | /backlog-advisor use |
| S3 | landing on /guides/pc-fixes or a hardware fix | page landing + `cta_click` (cta_id `pcfix-*`) | #pc-help join via its invite code |
| S4 | `from=gta6` or `utm_campaign` c06–c12 | `registration_complete` (from), `tool_run` (release-time) | GTA VI on shelf |
| S5 | Analyzer run | `tool_run` (tool=wow), `registration_complete` (method=battlenet) | /mmo landing |
| S6 | Switch 2 platform on shelf items, or /switch-2 landing | `shelf_add` + platform field | reminder on a Switch 2 Edition |
| S7 | price alert set, or arrival via C05/C31–C34 | `reminder_set`/price alert (D-027), `utm_campaign` | `alert_clicked` on price alerts |
| S8 | landing on /data/* or /studios via pr-* source | `utm_source=pr-<outlet>`, `newsletter_signup` | LinkedIn/Bluesky utm_source |
| S9 | country BA, HR, RS, ME, MK, SI in GA4 (consenting sessions) or `/studios/country/*` landing | GA4 geo | `utm_source=partner-<name>` |
| S10 | Discord linked | `discord_join`, Discord `/link` | `comment_approved` |

**Measurement caveats.** The first-party collector re-salts IP hashes nightly and cannot recognise returning visitors [R12]. GA4 sees EEA visitors only with consent [R16]. Segment tags are therefore reliable for **members** and approximate for guests.

---

## 7. Who we are not chasing in Q4

| Group | Why not | Evidence |
|---|---|---|
| Under-18s in paid media | Meta targets under-18s by age and location only; Google blocks personalised ads to them; nothing can be followed up | [R16] |
| Build/tier-list seekers for live-service games | Maxroll, Icy Veins, Mobalytics, Game8 own it and update every patch | [R09] |
| Codes and item-shop traffic (Roblox, Fortnite, Minecraft) | Wikis and dedicated sites own search; young audience | [R18] |
| Giveaway-only entrants | Strong short-term sign-ups, weak retention; share tasks conflict with Meta policy | [R11, R12, R16] |
| General tech/phone readers | Pillars drop general tech; `/hardware` currently holds phone and WhatsApp news | [spine §4, R02] |

---

## Dependencies and open questions

**Dependencies (the copy in §3 and §5 is only true once these ship):**

| Dependency | Needed for | Owner | Date |
|---|---|---|---|
| D-001 remove false claims (register, login, WoW, GTA 6, "140,000+", "benchmarks") | Any segment message; S3 and S5 especially | DEV/EIC | C01, by 2 Oct |
| D-004 dead invites → wPQG9gUMXH | S4, S10 Discord CTAs | DEV | C02, by 9 Oct |
| D-014/D-015 register rewrite + Steam sign-in | S2 registration trigger; "Sign in through Steam" copy | DEV | C44, 5–26 Oct |
| D-016 guest "Remind me" modal returning to page | S1, S4, S6 registration triggers | DEV | C45, 19 Oct |
| D-013 mail channel + C43 alerts | Any "we'll email you" line | DEV/SC | 19 Oct |
| D-018 release-time tool | S4 primary CTA | DEV/ED | C08, 14 Oct |
| D-027 price-drop alerts | S7 registration trigger | DEV | C31, 20 Nov |
| D-040 WoW Analyzer copy + OG | S5 landing | DEV | P0 |
| D-011 invite-code attribution | S10 "invite a friend" line; C36 | DEV | C36 from 12 Oct |
| D-037 Backlog Advisor guest mode | S2 landing | DEV | P2, not before Nov |

**Open questions:**

1. **Activation for non-library segments.** S5 (Battle.net, WoW) and S6 (Switch 2, manual shelf) reach canonical A2 slowly or never. Should the scorecard carry a segment activation ("saved character" for S5, "3 Switch 2 reminders" for S6) next to A2? Recommendation: yes, reported beside A2, never replacing it. Decision: EIC.
2. **A2 threshold conflict.** [R11] proposes ≥3 shelf items (the spine uses this). [R12] proposes ≥5. The existing Founder badge job uses ≥5 games. Keep ≥3 for A2, and decide whether C68's Founder badge moves to the same rule. Decision: EIC/DEV.
3. **Steam-only accounts have no email** [R11 §5]. S2 members who sign in through Steam can be A2 before they are A1. The email ask has to come at `reminder_set` ("Where should the reminder go?").
4. **Share controls.** Game, calendar and studio pages have no share button [R01 A.3.4]. The S1 and S6 "recommend" lines need one. This is not in the D-list; propose adding it to D-016's scope or as a sub-item.
5. **Regional prices.** Price data is Steam/GOG, US prices [R10, R14]. Should S7 copy for EU readers wait until prices are regional, or say "US price" openly? Recommendation: say it openly.
6. **S9 reader volume** is UNKNOWN. After C21 (28 Oct), check GA4 consenting sessions from BA/HR/RS/ME/MK/SI before investing more.
7. **Battle.net region.** The register page passes `?region=eu` to Battle.net [R11 §1.2]. Whether US WoW players can sign up cleanly is unverified. DEV to test before C58 sends US Reddit traffic to the Analyzer.
8. **GTA 6 giveaway status** (C09) must be verified in admin on 28 Sep. If it is live, the article `JoinPrompt` shows the giveaway instead of the account offer for every segment until it closes [R11 §1.1].
