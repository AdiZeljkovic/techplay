# 23 — Creators: a no-budget programme for micro creators, streamers, podcasters and community leaders

Status: Phase 2 plan — 27 Sep 2026
Part 26 of the growth plan. Research inputs: R13, R15 (§2–§5), R14 (data points), R05/R06 (dates and topics), R10 (tools), R17 (GTA VI), R18 (WoW/MMO). Spine campaign: C51 Creator Data Partnerships (from 20 Oct), with tie-ins to C13, C14, C18, C28, C29, C30, C36, C38, C10. Owners: EIC, SC, DS, DEV.

- **TechPlay has no creator budget and no audience numbers to trade.** 60 members, 160 Discord members, no measured traffic [R13, R23]. Creator marketplaces (Lurkit, Creator.co, Collabstr) are built for brands that pay [R15 §2]. So the currency is data, tools, distribution and credit: a true number for a video, a tool their audience can use, a Discord stage, a link [R15 §5].
- **Twelve low-cost formats** from R15 §3, each tied to a dated moment: data points from the PR calendar (22), creator profile pages, co-hosted Discord events, a Game Awards prediction league with creator leagues, Taste Match challenges, WoW "rate my character" with the Analyzer, Game Club hosts, embedded videos in guides, year-in-review cards.
- **Five tiers:** community leaders (Discord owners, guild leaders), nano (<1k), micro (1k–50k, R15's band), mid (50k–250k, data points only), and creator-owned outlets and podcasts (EIC only, low odds). A regional track runs in parallel.
- **Found without paid tools:** YouTube and TikTok search on Q4 topics, Twitch categories, video descriptions that credit Keymailer or Lurkit keys, Blizzard forum guild recruitment posts, Podchaser, our own Discord. Every candidate is scored on six criteria before contact.
- **Nine outreach templates,** each with an email, a DM and two follow-ups, all in plain English with the offer in the first two lines.
- **Everything is tracked** with `utm_source=creator-<handle>`, one Discord invite code per creator (C36, D-011), `/register?from=creator-<handle>` (D-014), and the canonical events `discord_join`, `registration_complete`, `tool_run`.
- **Disclosure is non-negotiable.** Anything of value (keys, prizes) means the creator uses the platform's paid-partnership label; data credits are credits, not sponsorships. TechPlay labels its side too.
- **TARGET by 20 Dec:** 45 creators and community leaders contacted, 12 active collaborations, 4 co-hosted Discord events, and every collaboration measurable by its own code. Capacity about 7 hours a week (SC 4, EIC 2, DS 1).

---

## 1. What we can honestly offer, and what we cannot

| We can offer | We cannot offer (do not imply) |
|---|---|
| A verified number and chart for a video, with method, before anyone else has it (22 §5) | Money, paid sponsorships, audience size, "exposure" |
| Tools the creator's audience can use for free: WoW Analyzer (works logged out [R10]), release calendar and reminders, five-platform library import, Taste Match, Backlog Advisor | Guaranteed coverage or reviews |
| A profile on TechPlay that shows their library and links their channel, plus an award-only "Creator" badge | Member counts or reach claims (spine §0) |
| A Discord Stage or voice event, promoted as a Scheduled Event, with Professor Buffy posting reminders [R13] | Keys from publishers unless the publisher agrees (24 §2) |
| Credit and a link: in the data page, the newsletter, the Discord announcement, and the game or guide page that embeds their video | Anything that asks the creator to misstate a number |

What creators respond to [R15 §5]: a clear, true number; tools their audience can use; membership mechanics they already use (Discord roles); credit and a link.

## 2. Prerequisites (before the first message)

| Gate | Why a creator cares | Owner | Due |
|---|---|---|---|
| C01 Trust Reset: no "15K+ members", "4.9/5", "thousands of fans" on public pages (D-001) | A creator who checks us and finds false numbers says so in public | DEV/EIC | 2 Oct |
| Working Discord invite everywhere (D-004) and one invite code per creator (C36; bot attribution D-011) | Their audience must land in the server, and we must see it | SC/DEV | 9 Oct; D-011 by 16 Oct |
| `/about/ownership` and `/press` (C54) | Creators vet who they are associating with | EIC/DEV | 9 Oct |
| WoW Analyzer copy fixed (D-040): no "Midnight launches March 2, 2026", no "50K+ players analyzed" | The WoW formats depend on it | DEV | 2 Oct |
| `/register?from=` honoured, redirect back (D-014) | Attribution for creator links | DEV | 26 Oct (C44) |
| "Creator" badge: an award-only badge in the existing Customization system, the same mechanism as the Founder badge (`campaign:founders`), granted by hand | Recognition that costs nothing | DEV (XS, confirm the admin can grant it) | 16 Oct |
| Discord Scheduled Events and a Stage channel (C35 rebuild) | Event formats | SC | 12 Oct |
| Prediction league (D-026, C29) | Creator leagues | DEV | live 18 Nov |
| Taste Match shareable link (R10 #5; today Taste Match renders only for a signed-in viewer on another member's profile [R10 §1]) | Taste Match challenge | DEV (S; not in spine backlog, proposed) | before W10 or the format waits |
| Your 2026 in Games (C28, D-025) | Year-in-review share week | DEV/DS | live 14 Dec |

## 3. Creator types and tiers

| Tier | Who | Where they live | What they want (R15 §2) | Our main format | Max active at once |
|---|---|---|---|---|---|
| T0 Community leaders | Discord server owners and moderators in pillar games; WoW guild leaders; forum regulars | Discord, Blizzard forums (recruitment posts follow a fixed format: faction, realm, progression, raid nights, roles [R13]) | Tools that save time, recognition | Guild readiness night, co-hosted events, server league in the prediction game | 8 |
| T1 Nano (<1k followers) | Next Fest demo streamers, new WoW and PC-fix YouTubers | YouTube, Twitch, TikTok | Anything that helps them grow; being taken seriously | Co-hosted event, profile + badge, embed in guides | 6 |
| T2 Micro (1k–50k) | YouTubers, TikTokers and streamers in P1–P5 topics | YouTube, TikTok, Twitch | Keys, stories, credible numbers | Data points, rate-my-character, Taste Match | 6 |
| T3 Mid (50k–250k) | Larger channels in the same topics | YouTube, TikTok | A number nobody else has | Data points only | no cap; one-off |
| T4 Creator-owned outlets and podcasts | Second Wind, Kinda Funny, Digital Foundry, Friends Per Second (Lucy James, Ralph Panebianco) [R15] | YouTube, Patreon, podcast apps | Stories, data, guests with a take | EIC data pitch; podcast guest pitch | EIC decides |
| TR Regional | Bosnian, Croatian, Serbian and wider Adria creators; A1 Adria League streamers (names UNVERIFIED) | YouTube, Twitch, Instagram | Local recognition, local stories | Balkan census data point (PR-07), regional Next Fest demos (PR-04), co-hosted event | 4 |

Follower bands are our segmentation for workload; only the 1k–50k micro band comes from the research [R15 §2]. Subscriber counts for specific creators were not gathered in research and are recorded fresh at qualification, labelled with the date.

## 4. Formats

| # | Format (R15 §3 ref) | TechPlay provides | Creator provides | Tie-in and dates | Effort per creator |
|---|---|---|---|---|---|
| CF-1 | Data point for a video (#1) | Chart PNG with credit line, three verified numbers, method link, 48 h before the data page goes public | A mention and the link in the description | PR-02 (7 Oct), PR-03 (14 Oct), PR-04 (20 Oct), PR-09 (4 Nov), PR-10 (11 Nov), PR-13 (23 Nov), PR-15 (8 Dec) | EIC 0.5 h |
| CF-2 | Creator profile page (#2) | Help linking Steam/PS/Xbox/GOG/Epic; Creator badge; channel link on profile; a F19 Library Card spotlight with consent | Signs up, links a library, shares their profile | Rolling from W4 | SC 0.5 h |
| CF-3 | Co-hosted Discord event (#6, #14) | Stage or voice channel, Scheduled Event, Buffy announcement, promotion on X/Bluesky/Discord, a recap post (ritual 27 [R13]) | Hosts or co-hosts 45–60 min; shares the invite code | Next Fest demo nights (19–26 Oct, F23), GTA VI launch night (18–19 Nov, C10), The Game Awards watch party (10 Dec, F20) | SC 2 h |
| CF-4 | Creator league in the prediction game (#15, C29) | A named league with a join link; a results post on TGA night | Makes picks on stream or video; invites audience | 18 Nov–10 Dec | SC 0.5 h |
| CF-5 | Taste Match challenge (#10) | The creator's public library and a Taste Match link | "How close is your library to mine?" post | W10–W12, only if the shareable link ships | SC 0.5 h |
| CF-6 | WoW "rate my character" (#9) | Analyzer walkthrough, one Buffy-signed tips card template, a 15-minute call to answer questions | Runs viewers' characters through the Analyzer on stream or in a video | WoW 12.1.5 (~6 Oct, a cadence prediction [R05]), WoW: Forever 4 Nov (C14) | EIC 1 h |
| CF-7 | Game Club host (#7, C38) | Forum thread, Discord channel, weekly prompts, Buffy reminders | Hosts one month: kickoff, one mid-month voice night, wrap | Dec 2026 (member vote) or Jan 2027 | SC 2 h |
| CF-8 | Embedded videos in guides, with credit (#3) | An embed in a Fix It Friday guide (F07/C60), an In Order page (F09/C63) or a hub; a note to the creator | Nothing; permission for the embed | Rolling from 12 Oct | ED 0.25 h |
| CF-9 | Podcast guest spot for the EIC (#5) | A data or regional angle; charts for the show notes | A 20–40 minute segment | GTA VI week, Black Friday, year-end | EIC 2 h |
| CF-10 | Year-in-review share (#11, C28) | Early access to "Your 2026 in Games" for creators with linked libraries | Shares their card | 14–31 Dec | SC 0.5 h |
| CF-11 | Community competition judged by a creator (#8) | Prize through the giveaways system, only when a real prize exists (C09 status: VERIFY IN ADMIN) | Judges; announces winner | Q1 2027 unless C09 is live | SC 3 h |
| CF-12 | Guest "30 days later" Verdict (#4, F24) | Editing, publication, byline | A 600–900 word piece | Q1 2027, after C52 has restarted reviews | EIC 3 h |

Not now: affiliate revenue share (#13) has no live affiliate programme to share (24 §5); Steam Curator co-curation (#16) is covered in 24 §4.

## 5. Finding creators without paid tools

| Source | Method | Record |
|---|---|---|
| YouTube search | Query bank below; filter by upload date "this month"; open the channel's Videos tab and About page | Channel URL, subscribers as shown (dated), upload dates of last 10, views of last 10, business email if the About page publishes one, language |
| TikTok search | Same queries; check the last 15 posts | Handle, followers as shown (dated), post dates, bio link, contact if published |
| Twitch categories | Browse World of Warcraft, Grand Theft Auto V, and demo streams in Next Fest week; read channel panels | Channel, schedule, Discord link in panels, contact in panels |
| Video descriptions crediting keys | Search YouTube for "key provided by Keymailer" or "key provided via Lurkit" with a genre or "Next Fest" | Creators who already cover indie games with keys; how much of Keymailer, Lurkit or Terminals is browsable without a publisher account is UNVERIFIED [R15], so we use their public footprint |
| Blizzard forums, guild recruitment | Read recruitment threads for EU and US realms [R13] | Guild, realm, progression, raid nights, recruiter's BattleTag or Discord as posted |
| Podchaser | Search games podcasts by topic (industry, PC, MMO) [R15] | Show, cadence, episode count, guest history, contact from the show page |
| Our own Discord and site | Ask in #introductions and the F11 thread: "Do you stream or make videos? Tell us where." | Members who create; they start at T1 with a head start on trust |
| Regional | EIC searches YouTube and Instagram in BCS ("GTA 6 na PS5", "najbolje igre 2026") and checks A1 Adria League pages | Same fields; language BCS |

Query bank for Q4 (YouTube and TikTok):

| Pillar | Queries |
|---|---|
| P3 WoW / MMO | "WoW 12.1.5", "WoW Forever explained", "Midnight mythic plus tips", "is my WoW character ready", "FFXIV Evercold" |
| P1 Steam / releases | "Steam Next Fest October 2026 demos", "Steam Autumn Sale 2026 picks", "Scream Fest 2026", "games out this week" |
| P4 GTA VI | "GTA 6 map comparison", "GTA 6 cars real life", "GTA 6 release time", "play GTA 5 before GTA 6" |
| P1 Switch 2 | "Switch 2 edition worth it", "MW4 Switch 2", "Minecraft Bedrock Switch 2" |
| P2 PC fixes | "shader stutter fix", "Secure Boot anti cheat", "Windows 11 gaming settings" |
| Backlog and discovery | "hidden gems 2026", "games you missed 2026", "backlog tier list" |
| P5 Industry | "Xbox layoffs explained", "PlayStation discs ending" |

Target list size: 90 candidates by 16 Oct (SC, about 6 hours), scored, of which the best 45 are contacted over the 12 weeks.

## 6. Qualification

Score each criterion 0, 1 or 2. Contact at 8 or more out of 12. Any hard "no" ends it.

| # | Criterion | 2 | 1 | 0 |
|---|---|---|---|---|
| 1 | Pillar fit (P1–P5) | ≥3 of last 10 uploads on a pillar topic | 1–2 | none |
| 2 | Activity | ≥2 uploads or streams in the last 30 days | 1 | none |
| 3 | Conversation | Comments discuss the content (read 20) | mixed | spam or empty |
| 4 | View consistency (house heuristic; no benchmark exists in the research) | Median of last 10 within reach of the typical video, no single outlier carrying the channel | one outlier | views collapsed or erratic |
| 5 | Disclosure habit | Labels sponsorships and keys | sometimes | never, while clearly sponsored |
| 6 | Fit with TechPlay's voice | Explains, tests, shows sources | opinion-led but fair | rage-bait |

Hard no: uses or promotes leaked footage (Rockstar is actively policing IP [R17 §10]); promotes cheats (a live problem this autumn, e.g. WARDOGS [R06]); gambling, skin-betting or crypto promotion; harassment; an audience that is visibly mostly under 18 (paid work is 18+ only, spine §13, and Roblox-style audiences are out of scope [R05]); signs of bought followers (sudden jumps with no matching views).

## 7. Offers and asks by tier

| Tier | We offer | We ask | We never ask |
|---|---|---|---|
| T0 | Guild readiness night with the Analyzer; co-hosted event; a server league in the prediction game; Creator badge for the leader | Share the invite code with members; one recap post | Mass invites, forced joins, bot installs in their server |
| T1 | Co-hosted event; profile + badge; embed in a guide; credit in the newsletter | Link with UTM in the description or panel; shout-out on stream | Posting on a schedule |
| T2 | Data points 48 h early; rate-my-character support; Taste Match challenge; event co-host | Link and credit line; one post in their community | Editorial control, scripted praise |
| T3 | Data points 48 h early | Credit line with link | Anything else |
| T4 | Data and a guest with a regional or data take | Credit if used | Promotion |
| TR | Local data (PR-04, PR-07), local-language co-hosted event | Link and credit | — |

## 8. Disclosure rules

1. **Credit is not sponsorship.** When TechPlay gives only data or a tool, the creator writes "Data: TechPlay (techplay.gg/data/…)". No paid label is needed because nothing of value changed hands; the brief says this in writing.
2. **Anything of value triggers a label.** Game keys, prizes, hardware, money, or a paid trip: the creator uses the platform's own paid-partnership or branded-content label and says it in the video or post. Current label names on YouTube, TikTok, Instagram and Twitch were not researched [R19 gap]; SC checks them before the first such deal and records the date checked.
3. **Publisher keys stay with the publisher's intent.** Keys received for TechPlay's own reviews are not passed to creators unless the publisher agrees in writing; every key is logged in the key ledger (24 §8).
4. **TechPlay labels its side.** Creator profiles show "Featured creator. No payment." or "Featured creator. Received [item] from TechPlay." Embeds read "Video by [creator], embedded with permission."
5. **No manipulated signals.** Creators are never asked to rate games, leave reviews, vote in TechPlay polls on our behalf, or state numbers TechPlay has not published.
6. **Under-18s.** No DMs to creators who appear to be under 18; no events designed for under-18s.
7. **Giveaway mechanics** avoid "share to enter" tasks on Meta surfaces, which Meta forbids [R16 via R23 C18].

## 9. 12-week creator calendar (W1 Mon 28 Sep to W12 Sun 20 Dec)

| Week | Dates | Spine tie-in | Creator work | Templates | Owner, hours |
|---|---|---|---|---|---|
| W1 | 28 Sep–4 Oct | C01, C35 | Build the candidate list (first 40: WoW, Next Fest, GTA VI); set up the Creators tab (24 §8); draft briefs | — | SC 5, EIC 1 |
| W2 | 5–11 Oct | C13 WoW 12.1.5 (predicted ~6 Oct), PR-02 | First guild leader messages (readiness night the week after the patch lands); PR-02 data point to 5 T2/T3 release-calendar creators | T6, T1 | SC 4, EIC 2 |
| W3 | 12–18 Oct | C18 Next Fest prep, C35 done | Invite 4 T1 streamers to co-host Next Fest demo nights (21, 23, 25 Oct); schedule events; finish list to 90 | T3 | SC 5 |
| W4 | 19–25 Oct | C51 starts 20 Oct, C18, C71, PR-03, PR-04 | Next Fest demo nights run; PR-04 country data to regional creators; first creator profiles and badges | T1, T10 | SC 5, EIC 2 |
| W5 | 26 Oct–1 Nov | C14 WoW: Forever (28 Oct–8 Nov), PR-06/07 | Rate-my-character offers to 4 WoW creators; atlas data to regional creators | T7, T10 | EIC 2, SC 3 |
| W6 | 2–8 Nov | WoW: Forever 4 Nov, PR-09 4 Nov | Rate-my-character streams run; sequel-gap data point to GTA creators; podcast pitches for GTA week | T7, T1, T4 | EIC 3, SC 3 |
| W7 | 9–15 Nov | PR-10 11 Nov, C10 prep | Invite 2–3 creators to co-host GTA VI launch night; $80 tracker data point; prediction-league creator invites | T3, T1, T5 | SC 5, EIC 1 |
| W8 | 16–22 Nov | C10 GTA VI week, C29 opens 18 Nov | GTA VI launch night in Discord (evening of 18 Nov CET into 19 Nov); creator leagues open | T5 | SC 6 |
| W9 | 23–29 Nov | PR-13 23 Nov, C31/C32 | Cost-per-hour data point to deal and TikTok creators; league reminders | T2 | SC 3, EIC 1 |
| W10 | 30 Nov–6 Dec | C30 Community Awards (1–20 Dec) | Creators nominate a category each; Taste Match challenge if the link has shipped | T9 | SC 4 |
| W11 | 7–13 Dec | PR-15 8 Dec, TGA 10 Dec | Achievement data point; TGA watch party with 2 creator co-hosts; league results on the night | T1, T3 | SC 6, EIC 1 |
| W12 | 14–20 Dec | C28 Your 2026 in Games (live 14 Dec), C38 | Creators with linked libraries share their cards; invite a Game Club host for Jan 2027; programme review | T9, T8 | SC 4, EIC 2 |

Continuity (Q1 2027): monthly Game Club host (T8), data points from PR-20 onward, Next Fest 22 Feb 2027 demo nights, FFXIV Evercold (January) MMO creators, Fable (23 Feb) watch party.

## 10. Outreach templates

Rules for all: first name, one specific reference to their work, the offer in the first two lines, one ask, no attachments in a first DM, a clear way to say no. Contact only through the route the creator published (business email on their About page, contact in their panels, or open DMs). Follow-up 1 on day 5, follow-up 2 on day 12, then stop. Every link carries the creator's UTM; every Discord link carries their invite code.

### T1 · Data point for a video (T2/T3 YouTubers)

**Email subject:** A number for your next [topic] video, before it's public

> Hi [name],
>
> I liked your [video title], especially [specific moment]. I edit TechPlay, a games publication with a 333,000-game database, and we are publishing [campaign, e.g. a count of every release week since 2010] on [date].
>
> If it's useful for a video, you can have the chart and the three main numbers 48 hours early: [one teaser line with no number]. No payment either way; all we'd ask is a credit line and the link if you use it.
>
> Want the pack?
>
> Adi Zeljković, TechPlay · techplay.gg/about/ownership

**DM:** Hi [name], liked [video]. We're publishing [topic] data on [date]. Want the chart and numbers 48h early for a video? Free, credit and link if you use it. Adi, TechPlay

**Follow-up 1:** "The [topic] data goes live on [date]. The early pack is ready if you want it: three numbers, one chart, method."
**Follow-up 2:** "It's public now: [clean link]. Use anything with a credit. I won't chase further."

### T2 · Stat pack for a short (TikTok, Shorts, Reels creators)

**Email subject:** One number for a 30-second video: [topic]

> Hi [name],
>
> Your short on [topic] was the clearest one I saw this week. We've worked out [e.g. what each 2026 release costs per hour of play], and one number would fit your format: [teaser without the number].
>
> I can send a vertical chart (1080×1920) with the source on it and the one-line method, today. Credit "Data: TechPlay" on screen or in the caption is all we ask.
>
> Adi Zeljković, TechPlay

**DM:** Your [topic] short was great. We have a [topic] number that fits a 30s video, with a vertical chart. Want it? Free, just credit "Data: TechPlay".

**Follow-up 1:** "Chart's ready if you want it. It's [one-line description]."
**Follow-up 2:** "Last note from me. It's here if you need it later: [link]."

### T3 · Co-host a Discord night (streamers: Next Fest demos, GTA VI launch, The Game Awards)

**Email subject:** Co-host a [Next Fest demo night / GTA VI launch night] with us?

> Hi [name],
>
> You stream [what they stream] and your [stream/VOD] of [game] was fun to watch. On [date, time CET / time ET] we're running [event] in the TechPlay Discord: [format, e.g. three demos, 20 minutes each, chat votes on which one to wishlist].
>
> Would you co-host? You'd pick one of the games, keep your own stream running if you want, and we'd promote the event with your name and channel on our Discord, X and Bluesky. There's no fee. You get your own invite link so we can show you exactly who came from your channel.
>
> Adi Zeljković, TechPlay · Discord: discord.gg/wPQG9gUMXH

**DM:** Hi [name]! Running a [event] in our Discord on [date/time]. Want to co-host one segment? We promote you, you keep streaming, no fee, and you get your own invite link. Details if you're up for it.

**Follow-up 1:** "We've locked [time]; one co-host slot left. Want it?"
**Follow-up 2:** "Slot's gone for this one, but we run [next event] on [date] if that suits you better."

### T4 · Podcast guest pitch (T4 and T2 podcasts)

**Email subject:** Guest idea: [topic] with numbers nobody else has

> Hi [host names],
>
> I listened to [episode] and your point about [specific] stuck with me. I edit TechPlay in Sarajevo and I've spent the autumn counting things: [e.g. how crowded the release calendar really is, which studios closed this year, what the $80 game looks like across 2026].
>
> If a 20-minute segment on [topic] fits an upcoming episode, I can bring three charts for the show notes and talk through what the numbers do and don't show. I'm also happy to talk about making games coverage from outside the usual UK/US base.
>
> Adi Zeljković, Editor-in-Chief, TechPlay · techplay.gg/press

**DM:** Hi, loved [episode]. I have data on [topic] that might suit a short guest segment. Happy to send the charts first so you can judge.

**Follow-up 1:** "Here's the chart I'd bring: [link]. No pressure."
**Follow-up 2:** "If the timing's wrong now, [next topic] lands in [month]. I'll leave it with you."

### T5 · Discord server owner (co-hosted event or a server league)

**Email / DM (server owners mostly reply in DMs):**

> Hi [name], I help run the TechPlay server (games news and a release calendar). Your [server] has a great [channel/ritual]. Two ideas, either or neither:
> 1) A joint [GTA VI launch night / TGA watch party] on [date]: your members and ours in one Stage, your mods co-host.
> 2) A private league for your server in our Game Awards prediction game (opens 18 Nov): your members pick winners, your league gets its own leaderboard, and we post the results on 10 Dec.
> No bots in your server, no mass invites. Would either work?

**Follow-up 1 (day 5):** "The league link is live now if you want to try it: [link with code]. Takes a minute."
**Follow-up 2 (day 12):** "I'll leave it there. If you ever want a co-hosted night, just message me."

### T6 · WoW guild leader (guild readiness night)

**Email / in-game mail / forum DM, as the recruitment post allows:**

> Hi [name], saw [guild]'s recruitment post on the [realm] forums. We built a free WoW character analyzer on TechPlay: it reads Blizzard's API and Raider.IO and tells a player what to fix before the next tier. Want to use it for a guild readiness night after [12.1.5 / WoW: Forever]? We'd join your Discord call, run your raiders through it, and send you a one-page summary per character. Nothing to install; nobody needs an account.

**Follow-up 1:** "Here's what one report looks like: [link to a sample analysis]. Happy to run it for your officers first."
**Follow-up 2:** "Offer stands for the next reset if this one's busy."

### T7 · WoW creator (rate my character)

**Email subject:** "Rate my character" with a free analyzer your viewers can use

> Hi [name],
>
> Your [video on Midnight M+ / WoW: Forever] was the one people linked in our Discord. We run a free WoW Analyzer on TechPlay: paste a character, it reads Blizzard's API and Raider.IO and lists what to fix. It works without an account.
>
> Would you try a "rate my character" segment with viewers' characters on stream or in a video around [WoW: Forever on 4 Nov]? We'll walk you through it in 15 minutes, answer any "why did it say that" questions, and give you your own link so your viewers land straight in the tool.
>
> The tips are written by an AI model from those API numbers, and the page says so. If a verdict looks wrong, tell us and we'll fix it.
>
> Adi Zeljković, TechPlay · techplay.gg/wow-analyzer

**DM:** Hi [name], we run a free WoW character analyzer (Blizzard API + Raider.IO, no account). Fancy a "rate my character" segment around WoW: Forever? Your own link, 15-min walkthrough. Interested?

**Follow-up 1:** "Sample result for a character from your guild: [link]. That's what viewers would see."
**Follow-up 2:** "If WoW: Forever week is packed, the offer holds for the next patch."

### T8 · Game Club host (monthly club, C38)

**Email subject:** Host a month of the TechPlay Game Club?

> Hi [name],
>
> Every month our Discord and forum play one game together: a kickoff post, weekly prompts, one voice night, and a wrap-up. [Month]'s pick is [game or "voted by members"], and you've clearly thought more about [game/genre] than most people.
>
> Would you host it? That means opening the month, joining one voice night on a date you choose, and writing the wrap-up (a paragraph is fine). We handle the channel, the reminders and the promotion, and your name and channel go on every post that month.
>
> Adi Zeljković, TechPlay

**DM:** Hi [name], would you host [month] of our Game Club ([game])? One kickoff, one voice night you pick, a short wrap. We do the rest and credit you on every post.

**Follow-up 1:** "Voting closes [date]; if you'd rather host a different month, pick one."
**Follow-up 2:** "No worries if it's not for you. The door's open for any month in 2027."

### T9 · Taste Match or year-in-review challenge

**Email subject:** How close is your audience's taste to yours?

> Hi [name],
>
> TechPlay imports game libraries from Steam, PlayStation, Xbox, GOG and Epic for free, and compares two libraries with Taste Match. [From 14 Dec it also makes a "Your 2026 in Games" card across all five.]
>
> Idea: link your library, post "match your library with mine", and your viewers see their overlap with you. We'll set up your profile with a Creator badge and your channel link, and feature your card in our Discord and newsletter if you're happy for us to.
>
> Your library is public only if you choose; you can remove it any time.
>
> Adi Zeljković, TechPlay

**DM:** Want to try a "match your game library with mine" post? Free five-platform import, your own link, Creator badge on your profile. I'll help set it up.

**Follow-up 1:** "Here's a sample Taste Match between two staff profiles: [link]."
**Follow-up 2:** "Leaving it here. The year-in-review card goes live 14 Dec if that's a better fit."

### T10 · Regional creator (English template; EIC writes the BCS version)

**Email / DM:**

> Hi [name], I'm Adi from TechPlay in Sarajevo. We just counted the game studios in the region: [N] in Bosnia and Herzegovina, [N] in Croatia, [N] in Serbia [publish-day numbers]. Next week [N] of them have demos in Steam Next Fest. Would a list of the local demos, with links, be useful for a stream or a post? And if you'd like to co-host a regional demo night in our Discord, you'd have your own invite link.

**Follow-up 1:** "Here's the list of regional demos: [link]."
**Follow-up 2:** "The census page is here whenever you need it: [link]."

## 11. Tracking

| Mechanism | Rule | Canonical event |
|---|---|---|
| UTM | `utm_source=creator-<handle>`, `utm_medium=creator`, `utm_campaign=<campaign id>-<slug>` (e.g. `c51-creator-data`, `c29-prediction-league`, `c14-wow-forever`), `utm_content=<format>-<asset>` (e.g. `cf1-pr02`, `cf3-nextfest-night2`) | Session source in the collector (D-008) |
| Link helper | D-009 campaign URL helper builds every creator link | — |
| Discord invite codes | One permanent code per creator, created by SC, logged in the Creators tab (code, creator, campaign, created date); the bot reads joins by code (D-011) | `discord_join` (invite code) |
| Registration | `https://techplay.gg/register?from=creator-<handle>` | `registration_complete` (`from=creator-<handle>`) |
| Activation | A2 Shelved within 7 days [R11] | `library_connected`, `shelf_add` |
| Tools | Analyzer and Taste Match links carry the UTM | `tool_run` (`tool=wow`) |
| Prediction league | League join link per creator | league join count (D-026) |
| Giveaways | Existing referral codes only while a giveaway is live [R13] | `giveaway_entered` |

Creators tab (in the CRM, 24 §8): `creator_id, handle, platform, tier, channel_url, audience_as_shown + date, language, pillar, score (0–12), contact_route + source_url, first_contact, template_used, status, format, campaign_id, utm_source, invite_code, event_date, sessions, discord_joins, registrations, activated, tool_runs, disclosure_checked (y/n), notes, opt_out`.

## 12. KPIs

| KPI | Formula | TARGET by 20 Dec |
|---|---|---|
| Contacted | count of creators with a first message | 45 |
| Reply rate | replies ÷ contacted | Reviewed at 20 contacts; change targeting if low |
| Active collaborations | creators who delivered a format | 12 |
| Co-hosted events | events with a creator co-host | 4 (Next Fest, GTA VI night, TGA, one WoW night) |
| Discord joins by creator code | `discord_join` grouped by code | Reported per creator; no target until two weeks of data |
| Registrations and activations | `registration_complete` and A2 by `from=creator-*` | Reported per creator |
| Cost per activated member | (creator programme hours) ÷ activated members from creator sources | Compared with other channels in the monthly review |
| Disclosure compliance | collaborations with correct labels ÷ collaborations with anything of value | 100% |

The honest expectation (ESTIMATE, basis: Discord's own guide says community-run events draw 30–50 people and moderator-run events 200–300 in established servers [R13]): a first co-hosted event in a 160-member server will be smaller than either figure. The measure that matters is how many attendees join, link a platform and come back the next week.

## 13. Capacity

| Role | Hours/week | Work |
|---|---|---|
| SC | 4 (6 in event weeks) | Discovery, scoring, DMs, event running, tracking |
| EIC | 2 | Data packs, WoW and podcast conversations, T4 pitches |
| DS | 1 | Vertical chart crops, event cards |
| DEV | 0 recurring | One-off items in §2 |

## 14. Risks

| Risk | Mitigation |
|---|---|
| A creator repeats a wrong number | Data packs carry the method link; corrections go to every creator who used a number |
| A co-host says something that breaks server rules | Rules channel ladder (Time Out → Kick → Ban [R13]) applies to guests too; SC moderates |
| Creators expect money | Say "no fee" in the first message; never imply budget |
| Analyzer verdicts embarrass on stream | EIC test-runs the creator's own character first; the AI label is visible |
| Low turnout makes the server look empty | Schedule events only where the co-host commits to promoting; recap posts show what happened, not attendance numbers |

---

## Dependencies and open questions

- **Taste Match share link** is not in the spine backlog; without it CF-5 and T9 fall back to year-in-review cards (C28). DEV/EIC decide by 30 Oct.
- **Creator badge** assumes the admin can grant an award-only Customization badge like the Founder badge (`campaign:founders`); DEV confirms (XS).
- **D-011 invite-code attribution** must work by 16 Oct or Next Fest events cannot be measured per creator.
- **C09 giveaway** status is VERIFY IN ADMIN; CF-11 waits for a real prize.
- **Platform disclosure labels** were not researched [R19]; SC verifies before the first collaboration that involves anything of value.
- **Keymailer, Lurkit and Terminals** discovery depth without a paid publisher account is UNVERIFIED; the plan uses their public footprint only.
- **WoW 12.1.5 date** is a cadence prediction [R05]; guild outreach in W2 waits for Blizzard's announcement.
- **Regional creator names** (A1 Adria League streamers) are UNVERIFIED; EIC builds the list.
- **Open question:** whether the EIC is the public face of every creator message, or SC signs T3, T5, T8 and T9 under their own name (recommended once `/about` lists SC).
