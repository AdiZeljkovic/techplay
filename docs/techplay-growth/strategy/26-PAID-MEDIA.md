# 26 — Paid Media

Status: Phase 2 plan — 27 Sep 2026
Parts 29 and 30 of the growth strategy. Channel class: EXPERIMENTAL, gated [spine §12, §13]. Owners: EIC (budget, go/stop decisions), SC (build, daily checks), DS (creative templates), DEV (measurement gates). All benchmarks quoted are vendor panels from R16 and are ESTIMATES; nothing below promises a CPC, CPM or CPA.

- **No paid spend before Mon 19 Oct, and none on any line until its gate is green.** Today TechPlay has no ad pixel, the first-party collector drops `utm_*`, and GA4 records only onboarding events [R16 §0]. Buying media before C03 (Measurement Foundation, 28 Sep–16 Oct) buys clicks nobody can read.
- **Paid buys four things only: verified registrations, activated accounts (A2), verified newsletter subscribers and Discord joins.** No campaign optimises for pageviews or reach; a paid article click earns one AdSense impression [R16 §5].
- **Thirteen campaigns across six platforms, plus one optional newsletter swap (C40a), all with spine IDs or sub-IDs:** Google Search C56a (branded) and C56b (tool queries); YouTube C56c (Shorts demo, AGGRESSIVE only); Meta C57a (library registration), C57b (GTA 6 hub), C57c (newsletter), C57d (retargeting, see 27), C57e (Winter Keys giveaway, see 25), C57f (Instagram vertical, AGGRESSIVE only); Reddit C58a (GTA 6 → Discord), C58b (WoW Analyzer), C58c (Backlog Advisor, gated on guest mode); TikTok C49a (Spark boost of a proven C49 video, AGGRESSIVE only).
- **October spend is the same at every budget level ($104)** because the gates, not the money, bind: only Google branded and tool-query search can run between 19 and 31 Oct. Meta starts 2 Nov (C57), Reddit 9 Nov (C58) [spine §8].
- **Black Friday week (23–30 Nov) is retargeting-only.** Prospecting on Meta ends 22 Nov as the spine sets; Reddit's spine window runs to 25 Nov with a cut rule if CPMs jump.
- **Budgets (monthly caps, not targets to spend):** LEAN $300 → Q4 spend $677; GROWTH $1,000 → up to $2,035; AGGRESSIVE $3,000 → up to $5,649. Unspent money is not rolled forward and is not forced into weaker lines.
- **Every campaign is US 18+ first,** because EEA/UK/CH consent is denied by default until the CMP records a yes and nobody has measured the EEA consent rate yet [R16 §0, §2.14b]. EEA ad sets open only if that rate is ≥30% (R16 §4.6).
- **Stop rules come from R16's test cards T1–T15,** and the continue/stop line for a second quarter is R16's: cost per verified registration under ~$10 → continue; over ~$25 → stop [R16 §3].
- **Not worth running:** X Ads, Google Display prospecting, Performance Max, Demand Gen, content-recommendation networks, game-name keywords, boosted Page posts, Discord Quests and paid listing tiers, beehiiv/SparkLoop (structurally unavailable), and anything aimed at under-18s (§8).

---

## 1. Starting position (FACT)

| Fact | Consequence for paid | Source |
|---|---|---|
| No Meta, TikTok, Reddit or Google Ads tag installed; GA4 via first-party relay only | No conversion objective can be bought until D-031 (Pixel + CAPI) and D-007 (GA4 key events) ship | R16 §0 |
| Collector stores path only; `utm_*` and `gclid` dropped by design | Paid sessions are invisible in the one counter that sees EEA non-consenters; D-008 required | R16 §0, §4.5 |
| Consent: EEA/UK/CH denied until CMP consent; US and rest of world granted; US ≈35% of traffic | US-first by construction; EEA results directional only | R16 §0 (README §19) |
| 60 registered users (7 Sep), 13 connected accounts | No seed for lookalikes; no customer-list audiences worth uploading | R16 §0; R11 §1.5 |
| 1–2 Google clicks/day since the 17 Aug Cloudflare incident | Paid search cannot replace organic; branded only | R16 §0; R23 A1 |
| TikTok `@techplay.gg` and `@techplaygg` not found; YouTube 20 subscribers, no public videos; Instagram and Facebook unverified | Spark Ads and Shorts need organic video first (C49 from 5 Oct) | R02 §8.2 |
| Giveaway tasks include share and retweet | Any Meta-promoted giveaway needs the Profile A task set (25 §3) | R16 §2.1 |
| Register page carries false numbers; WoW Analyzer says "50K+ players analyzed · 4.9/5" | No ad may point at a page with a false claim: C01/D-001 and D-040 are hard gates | R23 A3 |

---

## 2. Gates (C03 and friends)

A campaign launches only when every gate in its row is green. SC checks the list every Monday from 12 Oct; EIC signs off.

| Gate | Item | Needed by | For | Check |
|---|---|---|---|---|
| G1 | D-001 false claims removed (register, login, WoW, GTA 6 "thousands", "140,000+") | 2 Oct | all | Page text reviewed by EIC |
| G2 | D-040 WoW Analyzer copy + OG fixed | 16 Oct | C56b, C58b, C56c | Page reviewed |
| G3 | D-007 GA4 key events per spine §10, at least `registration_complete`, `email_verified`, `library_connected`, `newsletter_verified`, `reminder_set`, `tool_run`, `discord_click`, `giveaway_entered` | 16 Oct | all | DebugView shows each event once per action |
| G4 | D-008 collector stores `utm_source/medium/campaign` + campaign breakdown | 16 Oct | all | A test URL shows up under its campaign in Filament |
| G5 | D-009 campaign URL helper (one spelling of every UTM) | 16 Oct | all | Every ad URL in this file generated by the helper |
| G6 | Google Ads account linked to GA4; conversions imported (`registration_complete`, `tool_run`) | 19 Oct | C56 | Conversions visible in Google Ads |
| G7 | D-031 Meta Pixel + CAPI behind consent (`fbq('consent','revoke')` before init in denied regions; CAPI with hashed email, `fbp/fbc`, shared `event_id`) | **19 Oct** (so retargeting pools build for five weeks before 23 Nov) | C57 | Events Manager shows browser + server events deduplicated; EEA test visit fires nothing before consent |
| G8 | C44/D-014 register page rewrite, social sign-in first, redirect honoured | 26 Oct | C57a, C57b | New page live |
| G9 | D-012 `/newsletter` landing | 9 Oct (spine P0) | C57c | Page live, double opt-in works |
| G10 | D-011 Discord invite code per campaign logged by Buffy | 9 Nov | C58a | Join by test code logged |
| G11 | D-017 GTA 6 hub fixes; C08 `/gta6/release-time` live (14 Oct); D-020 map provenance answered | 2 Nov | C57b, C58a | Hub reviewed; map card removed if D-020 is open |
| G12 | D-037 Backlog Advisor guest mode | 6 Nov | C58c | Guest can run the advisor |
| G13 | 25 §9 giveaway gates (Profile A, D-039a/b/e, rules, T13 history) | 30 Nov | C57e | SC checklist |
| G14 | An organic C49 video that beats 2× the median views of the account's last 12 posts | before each C49a flight | C49a, C57f | TikTok analytics |
| G15 | EEA consent rate measured from `analytics_events.consent` (`G111` share by country) | 30 Oct | any EEA ad set | Filament chart; EEA opens only if ≥30% |

If G7 slips past 26 Oct, C57a moves its start from 2 Nov to the day G7 goes green and ends 22 Nov regardless; C57d (retargeting) is dropped for November.

---

## 3. Shared rules

**Audience.** 18+ on every ad set on every platform; teens cannot be retargeted on Meta or Google and gain TechPlay nothing in paid [R16 §2.15]. US only unless G15 passes. Exclude registered users from registration ads and subscribers from newsletter ads (27 §4).

**UTM (spine §9, built by D-009).** `utm_source` = facebook | instagram | google | youtube | reddit | tiktok; `utm_medium` = paid-social | cpc; `utm_campaign` = `<sub-ID>-<slug>` (e.g. `c57a-meta-library-reg`); `utm_content` = `<asset>-<variant>`; `utm_term` = audience, subreddit or keyword. Meta ad sets with Advantage+ placements use `utm_source=facebook`; Instagram-only ad sets use `utm_source=instagram`. Every landing URL also carries `from=<sub-ID>` so the register page records the source in `registration_complete`.

**Event mapping.**

| Spine event | GA4 | Meta (Pixel + CAPI) | Google Ads | Reddit / TikTok (no pixel in Q4) |
|---|---|---|---|---|
| `registration_complete` | key event | CompleteRegistration | imported conversion | read in GA4/collector by UTM |
| `email_verified` | key event | custom `EmailVerified` (server) | — | same |
| `library_connected` | key event | custom `LibraryConnected` (server) | secondary | same |
| `newsletter_verified` | key event | Lead (server, at verify click) | — | same |
| `reminder_set` | key event | custom `ReminderSet` | — | same |
| `tool_run` (tool=wow, backlog, release-time) | key event | custom `ToolRun` | imported (C56b) | same |
| `discord_click` / `discord_join` | key event / bot log | custom `DiscordClick` | — | joins by invite code |
| `giveaway_entered` | key event | custom `GiveawayEntered` | — | — |

Reddit and TikTok pixels are not installed in Q4: their consent behaviour was not researched [R16 §2.14b]. Their results are read from the first-party collector (G4) and GA4 by UTM, with registrations joined on `from=`.

**Reporting.** Monday 30 min, EIC + SC: spend, clicks, CPC, conversions by event, cost per verified registration, cost per A2 (joined in the DB on `from=`), frequency, policy flags. One sheet row per ad set per week. Results are per session and per account, never "per user" [R16 §4 item 8].

**Readability** [R16 §4.2]: a CPC is stable at ~200 clicks; a CPA at ~30 conversions. Anything smaller reports a CPC and a ceiling, not a CPA.

**Global scale rule.** A line scales only when (a) ≥30 verified conversions, (b) cost per verified registration ≤$10 [R16 §3], and (c) ≥25% of those accounts reach A2 within 7 days (TARGET, same as 25 §2). Scale in steps of at most +25% daily budget every 4 days, never above the month's allocation.

**Global stop rule.** Stop a line at its T-card stop-loss, or when cost per verified registration exceeds $25 after 30 conversions [R16 §3], or on any policy rejection (fix, then relaunch as a new ad).

---

## 4. Campaigns by platform

### 4.1 Google Search

**C56a — Google branded exact (T1)**

| Field | Plan |
|---|---|
| Objective | Protect the brand slot; learn whether anyone bids on "techplay"; capture navigational clicks cheaply |
| Audience | Search, US + all countries where TechPlay has traffic (branded search is not personalised, so consent does not limit serving); 18+ irrelevant for non-personalised search but no audience lists attached |
| Keywords (exact) | [techplay], [techplay gg], [techplay.gg], [techplay wow analyzer], [techplay backlog advisor], [techplay gta 6] |
| Creative | 2 responsive search ads; sitelinks /calendar, /gta6, /wow-analyzer, /games |
| Headlines (≤30 chars) | TechPlay Official Site · Gaming, on the record · One Library for All You Play · Release Calendar & Reminders · 333,000 Games Catalogued · Free WoW Character Analyzer · GTA 6: Confirmed or Rumour |
| Descriptions (≤90) | News you can act on, 333,000 games and a free library that fills itself. · Connect Steam, PlayStation, Xbox, GOG and Epic. Your games arrive with hours played. |
| CTA | (Search ads have no button) "Start your library" in description 2 variant |
| Landing | https://techplay.gg/?utm_source=google&utm_medium=cpc&utm_campaign=c56a-google-branded&utm_content=rsa-a&utm_term={keyword} |
| Tracking | GA4 `registration_complete`, `library_connected` imported |
| Retargeting | None |
| Budget | $3/day all levels: Oct $39 (19–31), Nov $90, Dec $93 |
| Test duration | 14 days to read (T1), then always-on |
| Scale condition | Competitor ads appear on brand terms (auction insights) → raise to $5/day |
| Stop condition | T1: CPC > $1.00 or <10 impressions/week after 14 days → pause, check monthly |

**C56b — Google tool-query exact (T7)**

| Field | Plan |
|---|---|
| Objective | Learn whether tool-intent queries exist at all (volumes UNKNOWN [R16 §2.3]); `tool_run` and registrations |
| Audience | Search, US 18+ (no lists) |
| Keywords (exact) | Ad group WoW: [wow raid readiness], [wow character checker], [wow character analyzer]. Ad group Backlog: [what should i play next], [backlog tool], [steam backlog] |
| Creative | 1 RSA per ad group |
| Headlines — WoW | WoW Character Readiness Check · Paste Your Character Name · Free, No Download Needed |
| Descriptions — WoW | Enter realm and name. It reads your character from Blizzard and Raider.IO data. · Free, and you don't need an account to run a check. |
| Headlines — Backlog | What Should I Play Next? · Let Your Backlog Decide · Connect Steam in One Click |
| Descriptions — Backlog | Free account. Connect Steam and the advisor reads your backlog, hours and taste. |
| Landing | WoW: https://techplay.gg/wow-analyzer?utm_source=google&utm_medium=cpc&utm_campaign=c56b-google-tools&utm_content=rsa-wow-a&utm_term={keyword} · Backlog: https://techplay.gg/backlog-advisor?…&utm_content=rsa-backlog-a (sign-in wall until D-037; ad text says "free account") |
| Tracking | `tool_run` (tool=wow), `registration_complete`, `library_connected` |
| Retargeting | None |
| Budget | T7 flight 19 Oct–1 Nov at $5/day: Oct $65, Nov $5. Continuation at $5/day (GROWTH Dec $155; AGGRESSIVE Nov $145 + Dec $155) only if T7 passes |
| Cost note | Every WoW analysis is an LLM call (Groq) [R16 §2.3]; SC checks Groq spend weekly |
| Scale condition | ≥20 impressions/week per ad group and ≥1 `tool_run` per $10 → continue |
| Stop condition | T7: <20 impressions/week after 14 days; C58b rule: Groq cost > ad cost |

### 4.2 YouTube

**C56c — YouTube Shorts: WoW Analyzer demo (T15), AGGRESSIVE only**

| Field | Plan |
|---|---|
| Objective | Test whether Shorts reach is cheap enough to drive `tool_run` around WoW: Forever (4 Nov) |
| Audience | US 18–34 (R16 T15), 18+ enforced; no personalised lists (teen rule and consent) |
| Creative | 15 s vertical screen recording: 0–3 s realm + name typed; 3–10 s result scrolls (what to fix first); 10–15 s end card "Free · techplay.gg/wow-analyzer". Uploaded to the TechPlay YouTube channel first |
| Headline | Check your WoW character in 15 seconds |
| Primary text | Type realm and name; get the list of what to fix first. Free, no account needed. |
| CTA | Learn more |
| Landing | https://techplay.gg/wow-analyzer?utm_source=youtube&utm_medium=cpc&utm_campaign=c56c-youtube-wow-shorts&utm_content=demo15-a&utm_term=us-18-34 |
| Tracking | `tool_run` (tool=wow) by UTM in GA4 and collector |
| Retargeting | Video viewers list only if the channel link and ≥100 active users/30 days are met (27) |
| Budget | AGGRESSIVE Nov: 2–15 Nov, $15/day = $210. LEAN and GROWTH: $0 |
| Test duration | 14 days |
| Scale condition | CPM ≤$5 and ≥1 `tool_run` per $5 → repeat for the MMO hub (C15) in Q1 |
| Stop condition | T15: CPM > $8 or 0 tool runs after $150 |

### 4.3 Meta (Facebook, with Instagram placements)

Common settings: Advantage+ audience (interests only as suggestions, since granular interests were deprecated in January 2026 [R16 §2.1]); US; 18+; Advantage+ placements unless stated; optimisation on the conversion event named; exclusions per 27 §4. Launch window 2–22 Nov, then 1–14 Dec [spine C57].

**C57a — Library registration (T2)**

| Field | Plan |
|---|---|
| Objective | Sales/Leads objective optimised for CompleteRegistration (verified server event); secondary read `library_connected` |
| Audience | US, 18–44 (R16 T2), Advantage+; exclude `registration_complete` (180 days) and all current account emails via CAPI match (no list upload) |
| Creative A | 12 s screen recording of the import wizard (existing `wizard_*` flow): 0–2 s "Connect Steam" pressed; 2–7 s shelf fills with covers and hours; 7–10 s PlayStation and Xbox rows appear; 10–12 s end card "TechPlay · free · no card" |
| Creative B | Static 4:5 card: five store logos in a row → one shelf; line "Five stores. One shelf." |
| Headline | Every game you own, on one shelf |
| Primary text | Connect Steam, PlayStation, Xbox, GOG or Epic and your games arrive on their own, with the hours you've played. Then TechPlay tells you what's releasing, what's on sale and what to play next. Free, no card. |
| CTA | Sign Up |
| Landing | https://techplay.gg/register?from=c57a&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57a-meta-library-reg&utm_content=wizard-video-a&utm_term=us-18-44 |
| Tracking | `registration_complete` (CompleteRegistration), `email_verified`, `library_connected`; A2 joined on `from=c57a` |
| Retargeting | Visitors who started registration feed C57d (27, audience R2) |
| Budget | LEAN Nov $189 ($9/day) and Dec $196 (if it beat C57c); GROWTH Nov $252 ($12/day); AGGRESSIVE Nov $420 ($20/day). Dec "winner" line in §5 |
| Test duration | 21 days (2–22 Nov) |
| Scale condition | Global scale rule; winner of C57a/b/c takes the December Meta line |
| Stop condition | T2: $150 spent with <5 verified accounts |

**C57b — GTA 6 hub cards (T3)**

| Field | Plan |
|---|---|
| Objective | CompleteRegistration via a GTA 6 launch reminder; secondary `reminder_set`; test whether hub cards beat the generic creative |
| Audience | US 18–44, Advantage+; same exclusions as C57a |
| Creative | Carousel, 4 cards (+1 if D-020 clears): 1 "19 November. PS5 and Xbox Series X\|S. No PC at launch." → /gta6/everything-we-know · 2 "What time does it unlock where you live?" → /gta6/release-time (C08) · 3 "Confirmed or rumour? We keep the ledger, with sources." → /gta6/everything-we-know · 4 "Remind me on launch day" → /register?from=c57b · (5 "The map, location by location" → /gta6/map, only if D-020 resolved) |
| Headline | GTA VI: what's confirmed, and when it unlocks |
| Primary text | GTA VI is out on 19 November on PS5 and Xbox Series X\|S, $79.99. We keep a ledger of what's confirmed and what's rumour, with the source next to each line, and a release-time tool for your time zone. Set a reminder and we'll tell you on the day. |
| CTA | Learn More |
| Landing | Card URLs as above with `utm_source=facebook&utm_medium=paid-social&utm_campaign=c57b-meta-gta6-hub&utm_content=card{n}-a&utm_term=us-18-44` and `from=c57b` |
| Tracking | `registration_complete`, `reminder_set`, `tool_run` (tool=release-time) |
| Retargeting | GTA 6 audience (27, R4) for post-launch C11 map tracker in Q1 |
| Budget | GROWTH Nov $105 ($5/day); AGGRESSIVE Nov $315 ($15/day); LEAN $0 |
| Test duration | 2–18 Nov (pre-launch); 19–22 Nov switches card 4 to "It's out. Track your map progress" only if C11 is live |
| Scale condition | CTR ≥ C57a's CTR and cost per registration within the global rule |
| Stop condition | T3: CTR <1% at 5,000 impressions |

**C57c — The Save File newsletter (T9)**

| Field | Plan |
|---|---|
| Objective | Leads optimised for `newsletter_verified` (server event at the verify click), not form submit [R16 §2.1] |
| Audience | US 18+ Advantage+; exclude verified subscribers (server-matched) and registered users |
| Creative | Static 4:5 image of a real Save File issue header + three lines from it; variant B: 6 s scroll of an issue |
| Headline | One email on Fridays |
| Primary text | The Save File: next week's releases with platforms and prices, one verdict, and one number worth knowing. Written by TechPlay's editors in Sarajevo. Free, and unsubscribing is one click. |
| CTA | Subscribe |
| Landing | https://techplay.gg/newsletter?from=c57c&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57c-meta-save-file&utm_content=issue-static-a&utm_term=us-18-plus |
| Tracking | `newsletter_signup`, `newsletter_verified` |
| Retargeting | Newsletter-page non-signups (27, R8) |
| Budget | GROWTH Nov $105 ($5/day); AGGRESSIVE Nov $189 ($9/day); LEAN Dec $196 only if C57a hit its stop-loss |
| Test duration | 21 days |
| Scale condition | Cost per `newsletter_verified` ≤$8 (T9 hypothesis) after 30 verifications |
| Stop condition | T9: $100 with 0 verified |
| Deliverability guard | New subscribers from ads are mailed at the same pace as others; complaint rate <0.1% per send (spine §3); pause if breached |

**C57d — Retargeting (T10).** Full audience definitions, exclusions and messages in 27. Budget: GROWTH Nov $120 (23–30 Nov, $15/day) and Dec $140 (1–14 Dec, $10/day); AGGRESSIVE Nov $200 ($25/day) and Dec $350 ($25/day); LEAN $0 (pools too small). Launches only if the relevant pool passes 27's size gate. Stop: T10, pool <500 after 30 days → skip.

**C57e — Winter Keys giveaway (T13).** Copy and gates in 25 §9. GROWTH Dec $140 ($10/day, 1–14 Dec), AGGRESSIVE Dec $280 ($20/day). Stop: T13, >70% of paid entrants with zero other activity.

### 4.4 Instagram

Instagram inventory is bought inside C57 through Advantage+ placements; R16 recommends treating Reels as a creative format, not a separate budget, and TechPlay has no Reels library yet [R16 §2.2]. Requirement: the Instagram account (`instagram.com/techplay.gg`, unverified [R02]) must be connected to the ad account; SC confirms by 16 Oct.

**C57f — Instagram vertical cut, AGGRESSIVE only**

| Field | Plan |
|---|---|
| Objective | CompleteRegistration; tests whether a 9:16 cut in Stories/Reels beats Advantage+ placements for the same message |
| Audience | US 18–34, Instagram Stories + Reels placements only; C57a exclusions |
| Creative | 9:16 version of C57a Creative A with on-screen captions; if G14 passes, the best C49 video instead |
| Headline | Your games, already on the shelf |
| Primary text | Connect Steam, PlayStation or Xbox and your library arrives with the hours on it. Free. |
| CTA | Sign Up |
| Landing | https://techplay.gg/register?from=c57f&utm_source=instagram&utm_medium=paid-social&utm_campaign=c57f-instagram-vertical&utm_content=wizard-916-a&utm_term=us-18-34 |
| Tracking | as C57a |
| Retargeting | IG engagers feed 27 R6 (video viewers) |
| Budget | AGGRESSIVE Nov $168 ($8/day, 2–22 Nov) |
| Scale / stop | Stop at T2's loss line ($150, <5 verified); fold into C57a if cost per registration is within 20% of C57a's |

### 4.5 TikTok

**C49a — Spark boost of a proven C49 video (T8), AGGRESSIVE only**

No TikTok spine campaign number exists for paid; C49 is the vertical video system whose posts this would boost, so the boost is C49a. The TikTok accounts checked on 27 Sep do not exist [R02 §8.2]; C49 must create the account and post from 5 Oct. Campaign floor $50/day [R16 §2.7].

| Field | Plan |
|---|---|
| Objective | Traffic to a tool page (Community Interaction as fallback); read CPM and UTM sessions, registrations via `from=` |
| Audience | US, 18+ where the age setting allows (minimum targetable age UNKNOWN [R16 §2.15]), broad |
| Creative | The C49 video that passes G14. Flight 1 (25–31 Oct): best F01 Out This Week or F02 GTA countdown video. Flight 2 (12–18 Nov): best GTA 6 countdown video. Flight 3 (3–9 Dec): best C29 prediction-league video. Commercial disclosure toggle on if a creator's post is used [R16 §2.15] |
| Headline / caption | The organic post's caption stays; the ad CTA line: "Release times, reminders and the ledger at techplay.gg" |
| CTA | Learn more |
| Landing | Flight 1: https://techplay.gg/gta6/release-time?from=c49a&utm_source=tiktok&utm_medium=paid-social&utm_campaign=c49a-tiktok-spark&utm_content=f02-day{n}-spark&utm_term=us-18-plus · Flight 2: same page · Flight 3: /awards/2026 (new, C29) |
| Tracking | Collector UTM sessions; `reminder_set`, `registration_complete` by `from=c49a` (no TikTok pixel in Q4) |
| Retargeting | None in Q4 |
| Budget | AGGRESSIVE: Oct $350, Nov $350, Dec $350 (7 days × $50 each). LEAN/GROWTH $0 |
| Scale condition | CPM ≤$6 (T8 hypothesis) and ≥1 registration per $50 → a fourth flight for Fable (Feb 2027) |
| Stop condition | T8: $350 (one flight) with CPM > $10 or 0 registrations; skip any flight whose G14 fails |

### 4.6 Reddit

Common settings: community targeting of named subreddits (sizes cited by vendors are UNVERIFIED [R16 §2.8]); Conversation Placement preferred; US 18+; ads written like posts, first person, no marketing voice; minimum $5/day per campaign. Window 9–25 Nov [spine C58]. **Cut rule:** if week-3 CPM is more than 1.3× week-1 CPM (Black Friday pressure), end on 22 Nov.

**C58a — GTA 6 hub → Discord (T4)**

| Field | Plan |
|---|---|
| Objective | Discord joins through the GTA 6 hub; KPI cost per `discord_click`, joins by invite code |
| Audience | r/GTA6, r/GTA, r/PS5, r/XboxSeriesX (verify names and eligibility in Reddit Ads) |
| Creative | Image: screenshot of the confirmed/rumour ledger with source column visible |
| Headline | GTA 6: what's confirmed, with a source next to each line |
| Body | We've been keeping a GTA 6 ledger: every claim marked confirmed or rumour, with the source. What's confirmed so far: 19 November, PS5 and Xbox Series X\|S, $79.99, no PC at launch. Our Discord's #gta6 channel posts one confirmed fact a day until launch. |
| CTA | Learn More |
| Landing | https://techplay.gg/gta6/everything-we-know?from=c58a&utm_source=reddit&utm_medium=paid-social&utm_campaign=c58a-reddit-gta6-discord&utm_content=ledger-img-a&utm_term=r-gta6 (one ad group per subreddit so `utm_term` names it); page CTA "Join #gta6 on Discord" uses invite code `c58a` |
| Tracking | `discord_click` (GA4, collector), `discord_join` (bot, invite code) |
| Retargeting | None (no Reddit pixel in Q4) |
| Budget | GROWTH Nov $136 ($8/day); AGGRESSIVE Nov $255 ($15/day); LEAN $0 |
| Scale condition | Cost per Discord join ≤$3 (T4 hypothesis) → December extension line (needs EIC sign-off; spine window ends 25 Nov) |
| Stop condition | T4: $100 with <20 Discord clicks |

**C58b — WoW Analyzer (T5)**

| Field | Plan |
|---|---|
| Objective | `tool_run` (tool=wow) per dollar; registrations via Battle.net sign-in second |
| Audience | r/wow, r/CompetitiveWoW, r/wownoob |
| Creative | Screenshot of a real analysis result (own character, names visible only with consent) |
| Headline | I built a character check you can run before reset |
| Body | Type your realm and character name. It reads your character from Blizzard's API and Raider.IO and lists what to fix first. Free, no download, no account needed. If you want it to remember your characters, Battle.net sign-in takes one click. |
| CTA | Learn More |
| Landing | https://techplay.gg/wow-analyzer?from=c58b&utm_source=reddit&utm_medium=paid-social&utm_campaign=c58b-reddit-wow-analyzer&utm_content=result-img-a&utm_term=r-wow |
| Tracking | `tool_run`, `registration_complete` (method=battlenet) |
| Retargeting | WoW Analyzer users (27, R11) via owned channels |
| Budget | GROWTH Nov $85 ($5/day); AGGRESSIVE Nov $170 ($10/day) |
| Scale condition | ≥1 analysis per $3.30 (30 analyses per $100) and Groq cost < ad cost |
| Stop condition | T5: $100 with <30 analyses, or Groq cost > ad cost |

Note: the headline "I built" is first-person Reddit style and must be true of the person whose account posts it (EIC or DEV); otherwise use "We built".

**C58c — Backlog Advisor (T6), gated on D-037**

| Field | Plan |
|---|---|
| Objective | `tool_run` (tool=backlog) → `library_connected` |
| Audience | r/patientgamers, r/ShouldIbuythisgame, r/Steam |
| Creative | 10 s screen tour: a Steam backlog goes in, three "play this next" picks come out with the reason for each |
| Headline | Too many games, no idea what to play next? |
| Body | Connect Steam and the advisor reads what you own, what you've played and for how long, then picks three to start with and says why. Free. |
| CTA | Learn More |
| Landing | https://techplay.gg/backlog-advisor?from=c58c&utm_source=reddit&utm_medium=paid-social&utm_campaign=c58c-reddit-backlog&utm_content=tour-a&utm_term=r-patientgamers |
| Tracking | `tool_run`, `library_connected`, `registration_complete` |
| Budget | GROWTH Nov $85; AGGRESSIVE Nov $170. **If G12 is not green by 6 Nov, the money moves to C58a (GROWTH) or is left unspent (AGGRESSIVE)** |
| Stop condition | T6: CTR <0.2% |

### 4.7 Paid newsletter swap

**C40a — One paid swap with a gaming newsletter (T12), AGGRESSIVE only.** $300 in November, only if TechPlay's verified subscriber count is known and disclosed to the partner, and the partner's list is gaming-relevant. Blurb: "The Save File, from TechPlay: next week's releases with platforms and prices, one verdict and one number, every Friday." Link: https://techplay.gg/newsletter?from=c40a&utm_source=partner-{name}&utm_medium=partner&utm_campaign=c40a-newsletter-swap&utm_content=blurb-a. Stop: do not run before the list size is known (T12).

---

## 5. Budget plans (exact monthly allocations, USD)

All figures are caps. A line whose gate or condition fails is not spent and is not moved elsewhere unless the table says so.

### 5.1 LEAN — $300/month

| Line | Oct (19–31) | Nov | Dec | Condition |
|---|---|---|---|---|
| C56a branded | 39 | 90 | 93 | G5, G6 |
| C56b tool exact (T7 flight) | 65 | 5 | 0 | G2 |
| C57a library registration | 0 | 189 (2–22 Nov, $9/day) | 196 (1–14 Dec, $14/day) | G7, G8; Dec only if T2 stop-loss not hit |
| C57c newsletter (Dec fallback) | 0 | 0 | (196 instead of C57a) | only if C57a stopped |
| **Total** | **104** | **284** | **289** | Q4 **$677** |
| Unspent | 196 | 16 | 11 | |

**LEAN can learn:** whether anyone bids on the brand (T1); whether tool queries have any volume (T7); one Meta CPC and a ceiling on click→verified registration (T2). **It cannot learn:** a CPA (≈30 conversions needed [R16 §4.2]), anything about Reddit, TikTok, retargeting or EEA.

### 5.2 GROWTH — $1,000/month

| Line | Oct | Nov | Dec | Condition |
|---|---|---|---|---|
| C56a branded | 39 | 90 | 93 | |
| C56b tool exact | 65 | 5 | 155 | Dec only if T7 passed |
| C57a library registration | 0 | 252 ($12/day) | — | G7, G8 |
| C57b GTA 6 hub | 0 | 105 ($5/day) | — | G11 |
| C57c newsletter | 0 | 105 ($5/day) | — | G9 |
| C57 winner (best of a/b/c) | — | — | 280 ($20/day, 1–14 Dec) | scale rule |
| C57d retargeting | 0 | 120 ($15/day, 23–30 Nov) | 140 ($10/day, 1–14 Dec) | 27 size gate |
| C57e Winter Keys giveaway | — | — | 140 ($10/day, 1–14 Dec) | G13 |
| C58a GTA 6 → Discord | 0 | 136 ($8/day, 9–25 Nov) | — | G10, G11 |
| C58b WoW Analyzer | 0 | 85 ($5/day) | — | G2 |
| C58c Backlog Advisor | 0 | 85 ($5/day) | — | G12, else → C58a |
| C58 winner extension | — | — | 140 ($10/day, 1–14 Dec) | EIC sign-off (outside spine window) |
| **Total** | **104** | **983** | **948** | Q4 up to **$2,035** |
| Unspent | 896 | 17 | 52 | |

**GROWTH can learn:** everything LEAN learns, plus a first comparison of cost per verified registration vs newsletter subscriber vs Discord join; whether GTA 6 hub creative beats the library message (T3); whether Reddit communities convert to tools (T4–T6); whether a retargeting pool forms by late November (T10); whether a promoted giveaway brings activated entrants (T13). **It cannot learn:** stable CPAs on more than one or two lines (each stays below the ~50 conversions/week learning phase [R16 §3]), TikTok or Shorts economics, EEA behaviour unless G15 passes.

### 5.3 AGGRESSIVE — $3,000/month

| Line | Oct | Nov | Dec | Condition |
|---|---|---|---|---|
| C56a branded | 39 | 90 | 93 | |
| C56b tool exact | 65 | 150 (5 + 145) | 155 | continuation only if T7 passed |
| C56c YouTube Shorts WoW | 0 | 210 ($15/day, 2–15 Nov) | 0 | G2, video uploaded |
| C57a library registration | 0 | 420 ($20/day) | — | G7, G8 |
| C57f Instagram vertical | 0 | 168 ($8/day) | — | G7 |
| C57b GTA 6 hub | 0 | 315 ($15/day) | — | G11 |
| C57c newsletter | 0 | 189 ($9/day) | — | G9 |
| C57 winner | — | — | 700 ($50/day, 1–14 Dec) | scale rule |
| C57d retargeting | 0 | 200 ($25/day, 23–30 Nov) | 350 ($25/day, 1–14 Dec) | 27 size gate |
| C57e Winter Keys giveaway | — | — | 280 ($20/day) | G13 |
| C58a GTA 6 → Discord | 0 | 255 ($15/day) | — | |
| C58b WoW Analyzer | 0 | 170 ($10/day) | — | |
| C58c Backlog Advisor | 0 | 170 ($10/day) | — | G12 |
| C58 winner extension | — | — | 280 ($20/day, 1–14 Dec) | EIC sign-off |
| C49a TikTok Spark | 350 (25–31 Oct) | 350 (12–18 Nov) | 350 (3–9 Dec) | G14 per flight |
| C40a newsletter swap | 0 | 300 | 0 | list size known |
| **Total** | **454** | **2,987** | **2,208** | Q4 up to **$5,649** |
| Unspent | 2,546 | 13 | 792 | |

**AGGRESSIVE can learn:** everything GROWTH learns, plus TikTok Spark CPM and whether boosted tool videos produce registrations (T8); Shorts CPM for a tool demo (T15); a paid swap's cost per verified subscriber (T12); readable CPAs on the two or three best lines; whether a second quarter of paid is justified under R16's $10/$25 rule. **It cannot learn:** anything a pixel cannot see in the EEA without consent; lookalike performance (no seed of useful size); anything about Demand Gen or PMax, which stay excluded [spine §12]. It also cannot spend its October money responsibly, and the plan says so rather than inventing lines.

### 5.4 Why December stops on 14 Dec

The spine window for C57 ends 14 Dec. After that the useful acquisition message is C28 "Your 2026 in Games" (live 14–31 Dec), which is best delivered to members by email and to guests by organic share cards (D-024). Whether to extend C57d retargeting to 15–23 Dec with a Year-in-Review message is an open question for EIC on 7 Dec, decided on the November retargeting read.

---

## 6. Paid calendar (week view)

| Week | Paid activity | Decision point |
|---|---|---|
| 28 Sep–18 Oct | None. DEV ships G1–G5, G7; DS builds C57a/b/c creatives (6 h); SC sets up accounts, audiences, invite codes | Fri 16 Oct: EIC gate review |
| 19–25 Oct | C56a, C56b start | — |
| 26 Oct–1 Nov | C56a, C56b; C49a flight 1 (AGGRESSIVE, if G14) | Fri 30 Oct: T7 read; G15 EEA consent rate |
| 2–8 Nov | + C57a, C57b, C57c, C57f; C56c (AGGRESSIVE) | Mon 9 Nov: first Meta read (CPC, CTR) |
| 9–15 Nov | + C58a, C58b, C58c (if G12) | Mon 16 Nov: T2/T3/T4 stop-loss checks |
| 16–22 Nov | GTA VI launch week; C57b switches card 4 if C11 live; C49a flight 2 (12–18) | Sun 22 Nov: prospecting ends |
| 23–30 Nov | Black Friday: C57d retargeting only; C58 ends 25 Nov (or 22 on cut rule) | Mon 30 Nov: pick December winners |
| 1–14 Dec | C57 winner, C57d, C57e, C58 extension; C49a flight 3 (3–9) | Mon 7 Dec: Year-in-Review extension decision |
| 15–31 Dec | C56a and C56b only | Mon 4 Jan: Q4 paid report, Q1 go/stop |

---

## 7. Operations and hours (ESTIMATE)

| Task | Owner | Hours |
|---|---|---|
| Measurement gates G3–G7 (inside C03 and D-031) | DEV | counted in C03 (not extra) |
| Account setup, audiences, conversions, invite codes | SC | 6 once (week of 12 Oct) |
| Creatives: wizard recording, carousel, newsletter card, Reddit screenshots, 9:16 cut | SC 3 / DS 6 | 9 once |
| Daily checks (spend, rejections, frequency) | SC | 0.25/day while live ≈ 1.75/week |
| Monday review | EIC + SC | 1/week |
| Replies to comments on Reddit and Meta ads (every ad is a post people answer) | SC | 1–2/week in November |
| Q4 report | EIC | 3 |

Peak paid load is ≈5 h/week in November, mostly SC, which is why the plan runs at most eight lines at once.

---

## 8. Campaigns not worth running (and why)

| Channel / tactic | Verdict | Reason |
|---|---|---|
| X Ads | Do not run | Ad revenue collapse and last place for marketer trust three years running; cheap clicks because demand left; TechPlay's product is credibility [R16 §2.9]. X stays organic |
| Google Display (prospecting) | Do not run | Clicks land on the same site the person left; no 2026 benchmark; value to a publisher low [R16 §2.4]. Only a possible later retargeting layer (27) |
| Performance Max | Do not run | Needs conversion history and assets; with none it spends on Display [R16 §2.3]; not before ≥100 ad-attributed conversions [R16 §5] |
| Demand Gen | Do not run | Google recommends budget ≥10× target CPA; at $15 tCPA that is $4,500/month, above every scenario [R16 §2.6]; spine NOT NOW |
| Taboola / Outbrain / MGID | Do not run, buy or sell side | Lowest-quality clicks, MFA inventory, brand cost [R16 §2.14] |
| Game-name search keywords ("gta 6 release date", "<game> review") | Do not run | SERP owned by stores, wikis, big media; the outcome is one pageview [R16 §2.3] |
| "Boost post" from the Page | Do not run | Worst targeting, no conversion optimisation, no UTM discipline [R16 §5] |
| Traffic / reach / video-views objectives for articles | Do not run | Buys pageviews; forbidden by arithmetic [R16 §5] |
| Discord Quests; paid Discord listing tiers | Do not run | Quests are sales-led for publishers; paid listings showed 1–6 members in a 2023 test; free Disboard listing instead (T11) [R16 §2.11] |
| Gleam-type giveaway platforms | Do not use | In-house system is stronger (account-gated) and keeps data; fraud tiers unclear [R16 §2.12] |
| beehiiv / SparkLoop / Substack networks | Not available | Require the list to live on their platform; TechPlay self-hosts [R16 §2.10] |
| Any under-18 targeting | Never | Cannot be retargeted; policy exposure [R16 §2.15] |
| TikTok before an organic account exists | Not possible | Spark Ads boost organic posts [R16 §2.7; R02] |
| Snapchat, Pinterest, Twitch ads | Not now | Spine §12 NOT NOW; no research basis |

---

## Dependencies and open questions

**Dependencies**

- C03 (D-007, D-008, D-009, D-011) complete by 16 Oct; D-031 Pixel + CAPI by 19 Oct.
- C01/D-001 and D-040: no ad points at a page with a false claim.
- C44/D-014 register rebuild by 26 Oct; D-012 `/newsletter`; C08 release-time tool (14 Oct); D-017 hub fixes; D-020 map provenance; D-037 guest Backlog Advisor.
- C49 vertical video from 5 Oct (TikTok account creation) for C49a and C57f.
- 25-GIVEAWAYS (C57e gates, Profile A tasks) and 27-RETARGETING (C57d audiences and exclusions).
- EIC budget decision: LEAN, GROWTH or AGGRESSIVE, by Fri 16 Oct.

**Open questions**

1. Which budget level does EIC approve, and is the giveaway prize budget (25 §4) separate from it?
2. What is the EEA consent rate since 20 Sep 2026? (Decides whether any UK/DE/FR ad set opens.)
3. Does the Google CMP expose the US "Do Not Sell or Share" signal to page JavaScript, so Meta Limited Data Use can be sent for the 14 listed states [R16 §2.1]?
4. Is a "Video games" or "PC gaming" Meta interest still available after the January 2026 deprecation (UNVERIFIED [R16 §8])? The plan does not depend on it.
5. Reddit official documentation (minimums, Conversation Placement, promotion rules) could not be fetched; confirm in the Reddit Ads UI before 9 Nov [R16 §2.8].
6. Does an Instagram account exist and can it be connected to the ad account?
7. Should C58 run past its spine window (25 Nov) into 1–14 Dec if it meets the scale rule? (Budget tables include it as conditional.)
8. Should C57d extend to 15–23 Dec for C28 Year in Review? (Decide 7 Dec.)
9. Terms of service age floor for TechPlay accounts is UNKNOWN [R16 §2.15]; 18+ in ads regardless.
