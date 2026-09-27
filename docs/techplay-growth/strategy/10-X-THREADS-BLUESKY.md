# 10 — X, Threads and Bluesky

Status: Phase 2 plan — 27 Sep 2026

- Three text networks, three different jobs. **X** is for speed: pillar news, live events (MW4 launch, GTA VI launch night, The Game Awards on 10 Dec), countdown and threads, plus the journalist and developer network. **Threads** is for conversation: one question per post, links in replies. **Bluesky** is for data and the industry audience: methods, trackers, sources and corrections.
- No post is cloned across the three. SC writes one variant per network in the Monday batch (file 05 §2); the same fact gets a different angle and CTA.
- X's open-source ranking code predicts each viewer's likely actions and adds them up with weights: replies and quotes weigh 5.0, a like 0.5, a link open 0.2, while predicted "not interested" (−43.2), mute (−58.8), block (−31.2) and report (−234) subtract. The weights multiply predicted probabilities, not raw counts [R07]. Posts that start conversations score; posts people want to hide cost more than likes earn.
- Starting point: @TechPlayGG exists on X but is not linked from the site; Threads existence is UNVERIFIED; there is no Bluesky account [R02]. Follower counts are unknown, so success is measured per post (replies, follows gained, sessions) until baselines exist.
- 45 written example posts below (15 per network), all tied to real Q4 dates, a live-event playbook, a method for building journalist and developer lists without buying or guessing handles, reply rules and metrics.
- Threads and Bluesky are EXPERIMENTAL (spine §12) and get a keep/cut decision on Mon 9 Nov; X is SECONDARY and stays through the quarter.
- Hours: X 3.5 h/week (SC 2.5, ED 0.5, EIC 0.5), Threads 0.75 h (SC), Bluesky 1.0 h (SC 0.75, EIC 0.25) — inside the file 04 budget.

---

## 1. Distinct jobs

| Use case | X | Threads | Bluesky |
|---|---|---|---|
| Breaking news | Yes: pillar news within 30 min of our article (ED) | No | Only industry news with context (layoffs, ownership, discs) |
| Live events | Yes: live threads for launches and showcases | Next-morning reaction question | Next-morning sourced list of announcements |
| Threads (multi-post) | F01 weekly, F03 ledger, launch-week guides | Rarely | Data threads with method and CSV |
| Opinion questions | Polls (F12) | Main format (F11, prompts) | Rarely; only on industry questions |
| Developer interaction | Replies to devs whose games we cover | Casual, community-facing | Indie and Balkan developer community (C21, C71) |
| Community participation | Countdown (F02), On This Day (F06) | Question-led countdown; what are you playing | Research, data and games-industry feeds |
| Journalist networking | Sourced replies; offering data after the news cycle | No | Main place: data offers, corrections, trackers |
| Links | In the post when the post is about the page; A/B test link-in-reply | In replies | In the post; methods pages welcome |
| Voice | Dry, sourced, first line is the fact | Warm, curious, one question | Analyst: method, source, caveat |

## 2. What X's ranking code says, and what we do about it

From X's open-source For You repository (README and `param.rs`, fetched 27 Sep 2026) [R07]. The weights below are from the `param.rs` file saved during Phase 1.

| Fact [R07] | What TechPlay does |
|---|---|
| Posts from followed and non-followed accounts are ranked together by a model that predicts each viewer's chance of liking, replying, reposting, quoting, sharing, clicking, dwelling and giving negative feedback. | Write for the reply: end threads and polls with a real question; no "thoughts?" filler. |
| Reply 5.0, quote 5.0, share 2.0, repost 1.0, like 0.5, click 0.4, open link 0.2, dwell 0.05. A reply from a mutual follow gets a 15.0 boost; follow-author 4.0; share via copy link 20.0, via DM 5.0. | Earn mutual follows with journalists and developers through useful replies (§8). Make posts worth copying into a Discord or group chat: dates, tables, single numbers. |
| Negative actions subtract: not interested −43.2, mute −58.8, block −31.2, report −234, not dwelled −0.02. The code comments say these multiply predicted probabilities, and that a report is over 1,000 times rarer than a like. | No engagement bait, no rumour-first posts, no dunking, no repeated links to the same page in a day. One bad-fit post can cost more than it earns. |
| The code shows no explicit link penalty; what matters is predicted engagement. Other link handling outside the repository is UNKNOWN. | Test for four weeks (5 Oct–1 Nov): F04 with the link in the post vs in the first reply, alternating weeks; compare link sessions and replies. |
| A separate labelling system scores accounts on how others respond to them, including blocks and reports relative to likes. | Mute trolls instead of arguing; never mass-follow; never reply to bait accounts. |

## 3. X — 15 example posts

Times are Sarajevo. UTM on every link: `utm_source=x&utm_medium=organic-social&utm_campaign=<cid>-<slug>&utm_content=<franchise>-<variant>`.

**X1 — Countdown (F02, C06). Mon 28 Sep, 12:00**
> 52 days to Vice City. What's confirmed: 19 Nov, PS5 and Xbox Series X|S, $79.99 or $99.99 for Ultimate, single-player at launch, no PC at launch.
> That's the full list. Everything else is a guess.
> techplay.gg/gta6/everything-we-know

**X2 — Data thread opener (F13). Tue 29 Sep, 15:30**
> Steam most-played, week to 26 Sep. Total War: WARHAMMER III jumped from 67th to 28th after its DLC. GTA V Enhanced slipped from 20th to 24th, still in the top 25 eight weeks before VI. Full movers below.

**X3 — Poll (F12, C39/C66). Wed 30 Sep, 20:00**
> Sony plans to end PlayStation disc production. How much of your console library is on disc?
> (Poll: Mostly discs / Mostly digital / About half / I'm on PC)

**X4 — Ledger thread opener (F03, C07). Thu 1 Oct, 18:00**
> GTA VI claims, sorted by source. Confirmed, reported, rumour, and what nobody has announced. We'll update this every Thursday until launch. 1/5

**X5 — Release-day news (P1). Tue 6 Oct, 17:30**
> Gears of War: E-Day is out today on Xbox Series X|S and PC, in Game Pass Ultimate and PC Game Pass from day one. It's a prequel set on Emergence Day itself.
> Platforms and editions: techplay.gg/games/gears-of-war-e-day

**X6 — PR data launch (C20). Wed 7 Oct, 15:30**
> Which week of 2026 had the most new games? We counted every dated release in our calendar by week and platform, including the pile-up before GTA VI.
> The busiest weeks, the empty ones, and the CSV: techplay.gg/data/release-congestion-2026

**X7 — Tracker launch (F17, C22). Wed 14 Oct, 15:30**
> We now keep a public tracker of 2026 studio closures and layoffs: every line sourced, each studio linked to the games it made. Tell us what's missing, with a source.
> techplay.gg/data/studios-closed-2026

**X8 — Launch-window news (F08). Fri 16 Oct, 18:00**
> Modern Warfare 4's campaign early access opens today for digital pre-orders. Full launch is Fri 23 Oct on PS5, Xbox, PC and Switch 2. Not on Game Pass on day one.
> techplay.gg/games/call-of-duty-modern-warfare-4

**X9 — Live thread opener (F20). Fri 23 Oct, 12:00**
> Call of Duty: Modern Warfare 4 is out on PS5, Xbox, PC and Switch 2. We'll add confirmed patch notes, server status from the official channels and Switch 2 details to this thread as they land. Nothing unconfirmed.

**X10 — Tool launch (C08). Wed 14 Oct, 18:00**
> When does GTA VI unlock where you are? Pick your city and our tool shows the time in your zone as soon as Rockstar confirms it, then reminds you on the night.
> techplay.gg/gta6/release-time

**X11 — Launch-night opener (C10). Wed 18 Nov, 22:30**
> GTA VI launch night thread. We'll post the unlock time per region only from official sources, plus pre-load and store status. No leaked footage, no spoilers in this thread.
> Launch-night chat on our Discord: discord.gg/wPQG9gUMXH

**X12 — Launch-day answer (F08). Thu 19 Nov, 12:00**
> GTA VI is out on PS5 and Xbox Series X|S. On PC? Not at launch, and Rockstar hasn't announced a PC date. We'll update this page the day it does.
> techplay.gg/gta6/everything-we-know

**X13 — Prediction league close (C29). Thu 10 Dec, 20:00**
> The Game Awards are tonight at the Peacock Theater. Prediction League entries close when the show starts. Game of the Year pick, three categories, one tiebreaker.
> techplay.gg/awards/2026

**X14 — Developer interaction (C71/F23). Tue 20 Oct, reply to a developer whose demo we covered**
> Thanks for putting the demo up for Next Fest. It's in today's diary with a remind-me button, so anyone who wishlists it through us gets told on launch day: techplay.gg/calendar

**X15 — Journalist networking (F17). Reply to a reporter's closure story, after the news cycle**
> For anyone tracking this: our 2026 closures tracker lists each studio with its source and the games it made. Free to cite; the CSV is on the page.
> techplay.gg/data/studios-closed-2026

## 4. Threads — 15 example posts

Links go in a reply unless the post is about the page. Threads handle to confirm on Mon 28 Sep.

**T1 — F11. Mon 28 Sep, 20:00**
> First question of the week: what's the one game you want finished before GTA VI takes over on 19 Nov?

**T2 — Release day. Tue 29 Sep, 18:00**
> Minecraft Dungeons II is out today. Who's playing co-op with someone who has never touched Minecraft? How's it going?

**T3 — Question-led countdown (F02). Thu 1 Oct, 12:00**
> 49 days to Vice City. Two leads this time, Jason and Lucia. Whose side of the story are you more curious about, and why?

**T4 — Sale habits. Sat 3 Oct, 20:00**
> Steam Autumn Sale rule we're trying: nothing gets bought while a game from last year's sale is still unplayed. What's your rule, and do you keep it?

**T5 — Opinion. Wed 7 Oct, 20:00**
> Honest one: do you still read reviews before you buy, or do you watch ten minutes of someone playing and decide?

**T6 — Switch 2 owners (S6). Mon 12 Oct, 20:00**
> Switch 2 owners: Dragon's Dogma 2 got a Switch 2 version on 9 Oct. Is that a game you'd actually play handheld, or is it a TV game for you?

**T7 — Next Fest (F23). Mon 19 Oct, 20:00**
> Steam Next Fest starts today. Drop the one demo you think nobody's talking about. We'll try the most-mentioned one for tomorrow's diary.

**T8 — Halloween (C19). Mon 26 Oct, 20:00**
> Halloween week. What's the scariest game you never finished because it was too much? No judgement, we have a list too.

**T9 — WoW: Forever (C14). Wed 4 Nov, 20:00**
> WoW: Forever launches today, and it's separate from Retail. If you quit WoW years ago, is this the version that brings you back?

**T10 — Behind the scenes (C59). Mon 9 Nov, 20:00**
> Small thing we shipped today: tap "Remind me" on any game and you can get a browser notification on release day. Only then. Never on page load. Would you switch it on?

**T11 — Launch week (C10). Mon 16 Nov, 20:00**
> Three days to GTA VI. Taking the day off, playing after work, or waiting a week for the patches and the reviews?

**T12 — Spoiler-free (C10). Fri 20 Nov, 20:00**
> No spoilers: what's the first thing you did in GTA VI that wasn't a mission?

**T13 — Black Friday (C32). Fri 27 Nov, 20:00**
> No Steam sale on Black Friday this year; the Winter Sale starts 17 Dec. Buying anything this weekend, or holding out?

**T14 — Morning after TGA (F20). Fri 11 Dec, 12:00**
> Morning after The Game Awards. One announcement you'd actually pre-order, and one you're already tired of?

**T15 — Year in review (C28). Mon 14 Dec, 20:00**
> Your 2026 in games is live: every platform you've linked, on one card. Which number on yours surprised you?

## 5. Bluesky — 15 example posts

Bluesky posts stay under 300 characters. Method and source in the post; links welcome.

**B1 — Data (F13). Tue 29 Sep, 15:30**
> Steam most-played, week to 26 Sep: GTA V Enhanced is 24th with a 75,985 peak, eight weeks before VI. Biggest jump: Total War: WARHAMMER III, 67th to 28th after its DLC. Source: Steam's weekly charts API.

**B2 — Industry context (C66). Wed 30 Sep, 15:30**
> Sony's plan to end PlayStation disc production is the week's biggest player-side story; Wikipedia's 2026 summary puts it at January 2028. We run an open letter asking Sony to keep physical games alive: techplay.gg/last-disc

**B3 — PR data (C20). Wed 7 Oct, 15:30**
> New data: 2026 release congestion, week by week, from every dated release in our calendar. Method (what counts as a release, how platforms are merged) and the CSV are on the page. techplay.gg/data/release-congestion-2026

**B4 — Tracker (C22). Wed 14 Oct, 15:30**
> We're keeping a 2026 studio closures and layoffs tracker. Every line has a source; every studio links to the games it made. Corrections with a link are welcome. techplay.gg/data/studios-closed-2026

**B5 — Next Fest context (F23). Mon 19 Oct, 15:30**
> Steam Next Fest runs 19–26 Oct. For scale: GameDiscoverCo counted 4,358 demos in June's edition. We're trying three a day and logging which ones have a release date. techplay.gg/calendar

**B6 — Developer community (C21). Wed 28 Oct, 15:30**
> We mapped the countries of the 57,630 studio records in our database, with a first census of game studios in the Balkans. Method, gaps and the CSV: techplay.gg/data/studio-atlas

**B7 — Developer call-in (C21/C55). Thu 29 Oct, 15:30**
> Making games in Bosnia and Herzegovina? Check your studio is listed and correct: techplay.gg/studios/country/ba. Corrections go straight to our editors in Sarajevo. Neighbouring countries next.

**B8 — PR data (C23). Wed 4 Nov, 15:30**
> GTA V came out in September 2013; GTA VI lands on 19 Nov 2026. We measured the gap between entries across long-running series to see whether 13 years is an outlier or the new normal. techplay.gg/news

**B9 — PR data (C24). Wed 11 Nov, 15:30**
> GTA VI is $79.99, Ultimate $99.99. The $80 Tracker lists every 2026 game we found at that price or higher, with the date and source of each price. techplay.gg/news

**B10 — Journalist offer. Any weekday, 15:30**
> If you're writing about 2026 layoffs and need a studio's full game list, our studio pages are free to cite: techplay.gg/studios. Ask us for a CSV and we'll send it.

**B11 — Corrections policy. Mon 16 Nov, 15:30**
> How we correct things: when we get a number wrong, we fix it, say so under the post and log it. Our GTA VI ledger works the same way, a source and a date on every line. techplay.gg/gta6/everything-we-know

**B12 — Launch-day context (C10). Thu 19 Nov, 15:30**
> GTA VI launches today on PS5 and Xbox Series X|S, after two announced delays (Fall 2025, then 26 May 2026). Fable moved to 23 Feb 2027 to stay out of its way. No PC version at launch.

**B13 — PR data (C25, only if the time-to-beat licence check clears). Mon 23 Nov, 15:30**
> Best value games of 2026, measured as launch price divided by typical hours to finish. Method, sources and caveats (length data is crowd-reported) are on the page. techplay.gg/news

**B14 — PR data (C26). Tue 8 Dec, 15:30**
> Which genres have the hardest achievements? We looked at global unlock rates for 500 Steam games. Method, the list and the CSV: techplay.gg/news

**B15 — Winter Sale (C34). Thu 17 Dec, 15:30**
> Steam's Winter Sale runs 17 Dec–4 Jan, with Steam Awards voting during the sale. Our picks are filtered by what readers actually wishlisted, not by who paid. techplay.gg/steam

Rules for B-series data posts: the number in the post must match the page; the page must carry a method paragraph and a CSV [R14]; EIC approves (Tier C). B6 and any map-related data wait for their own checks (D-020 applies to the GTA map only).

## 6. Weekly rhythm on the three networks

| Day | X | Threads | Bluesky |
|---|---|---|---|
| Mon | F02, F06, F01 thread, F11 | F11 question; F02 question | F06 |
| Tue | F02, F06, F13, F04, F15 | F02 question | F13, F04 |
| Wed | F02, F06, F17, F12 poll | F12 in words | F17 or PR data |
| Thu | F02, F06, F03 thread, F04 | F02 question | F04 |
| Fri | F02, F06, F07, newsletter post | Weekend question | Industry context post |
| Sat | F02, F06, F04, F08 | F02 question | — |
| Sun | F02, F06 | F02 question | F06 |

## 7. Live-event playbook

### 7.1 Standard pattern for any showcase or launch (F20)

| When | Action | Owner |
|---|---|---|
| T−7 days | Confirm start time from the official page; create the Discord Scheduled Event; draft the X thread opener; pre-build blank T4 cards | SC |
| T−1 day | Post the event on X and Threads; pin in Discord; build a Google Sheet with columns: time, game, platforms, date, source link, posted? | SC, ED |
| T−15 min | X opener (X11-style): what we will and won't post | SC |
| During | ED posts one reply in the thread per announcement: game, platforms, date if given, "Source: [stream]". SC runs the Discord watch party and pulls quotes for Threads. | ED, SC |
| During, rule | Nothing unconfirmed; no leaked footage; no screenshots of copyrighted streams beyond a single credited still | ED |
| T+30 min | "Every announcement" article from the sheet; link from the X thread's last post | ED |
| Next morning | Threads reaction question (T14); Bluesky sourced list; newsletter item | SC |

### 7.2 Event-specific plans

| Event | Date | X | Threads | Bluesky | Discord |
|---|---|---|---|---|---|
| MW4 campaign early access / launch | Fri 16 Oct / Fri 23 Oct | X8, X9 live thread (patch notes, server status from official channels, Switch 2 details) | Question on Switch 2 version | — | #cod thread |
| Steam Next Fest | 19–26 Oct | Daily diary post 18:00 | T7 on day 1 | B5 on day 1 | F23 diary, one voice event |
| GTA VI launch week | 16–22 Nov | 16 Nov: release-time tool (X10 reposted); 18 Nov 22:30: launch-night thread (X11); 19 Nov: X12; 20–22 Nov: "what to do first" posts from the hub | T11, T12 | B12 | Launch-night event from 22:00 Wed 18 Nov; #gta6-spoilers opens |
| The Game Awards | Thu 10 Dec | X13 before; live thread during; "every announcement" link after | T14 next morning | Sourced list next morning | Watch party (Stage or voice), prediction league results (C29) |
| Unannounced showcases (State of Play, Nintendo Direct, Xbox) | none dated in research [R05] | Standard pattern 7.1 as soon as the official post appears | Reaction question | — | Watch party if notice ≥24 h |

**GTA VI launch-night specifics.** The unlock time is not in the research; the release-time tool (C08) shows only officially confirmed times. Server or store problems are posted only when PlayStation, Xbox or Rockstar status pages confirm them. Spoiler rules from file 05 §7 apply from 19 Nov. The Discord event is staffed by SC; ED runs the X thread; EIC is on call for Tier C calls.

**The Game Awards specifics.** The start time is not in the research; SC confirms it from thegameawards.com by Tue 1 Dec. If the show starts after midnight Sarajevo, SC and ED work the night and start at 14:00 on Fri 11 Dec (file 04 §2).

## 8. Building journalist and developer lists

The aim is a working network, not a follower count: people who cite data, cover TechPlay's pillars or make games TechPlay writes about. No handles are guessed; each account is found by name on the network and checked against the person's outlet or studio page before it goes on a list.

| List | Who belongs (types) | Seed names from research | Where to find more |
|---|---|---|---|
| Industry reporters | Reporters who break or analyse business news | Jason Schreier, Christopher Dring, Jez Corden (cited in Push Square's Physint story), Tom Henderson (Insider Gaming), Stephen Totilo (Game File) [R04] | Bylines on the stories TechPlay links in its news; GamesIndustry.biz and VGC staff pages |
| Independent outlets | Worker-owned and small outlets | Aftermath, Second Wind, Rogue, Respec, Game File, Post Games, Giant Bomb [R04] | Their own sites' social links |
| Data and trackers | People and projects that publish citable data | GameDiscoverCo (Simon Carless), SteamDB, IsThereAnyDeal, HowLongToBeat, Backloggd [R04, R14] | Sources cited in TechPlay's data pages |
| Platform and publisher news | Official accounts whose posts are primary sources | Rockstar Newswire, Xbox Wire, PlayStation Blog, Nintendo, Steam, Blizzard/WoW [R05, R17] | Official sites' social links |
| Developers we cover | Studios with a game in F01, F05, F23 or a Verdict | Next Fest demo studios (from Steam's event page), Balkan studios (/studios/country/ba) [R15] | Studio pages in TechPlay's DB; Steam store pages |
| Regional | Balkan media and esports | A1 Adria League [R15] | Regional conference coverage TechPlay already does (Weekend.19 [R02]) |

Method:
1. **Seed (week 1, SC, 2 h once):** build private lists on X and lists on Bluesky (Bluesky list and starter-pack mechanics are UNVERIFIED [R07]; check in-app) from the seed table. Record each account in a sheet: name, outlet/studio, beat, network, source that confirmed the account.
2. **Grow (20 min a week, SC):** add anyone who (a) cited a data source TechPlay also covers, (b) covered a game in that week's F01/F24, or (c) replied usefully to a TechPlay post. Maximum 20 follows a week; no follow-unfollow.
3. **Engage (EIC 30 min a week on X, 15 on Bluesky):** reply only when adding a fact, a source or a dataset (X15, B10). Pitches go by email, never in replies to breaking news.
4. **Prune (monthly):** remove inactive accounts; move anyone who asked for data into the PR contact sheet for C20–C26.

## 9. Reply rules

1. Reply within the SLA (file 05 §6): 24 h for comments and mentions.
2. Add information: a date, a source, a link to the exact page. No "great point!", no emoji-only replies.
3. One link per reply, and only to the page that answers the question.
4. Rumour in a reply to us: answer with the ledger status and source ("Reported by Tom's Hardware on 29 Aug; Rockstar hasn't confirmed"). Never argue with the account that spread it.
5. No quote-dunks and no mocking other outlets, even when they are wrong.
6. Criticism of TechPlay: thank, check, fix if we are wrong (file 05 §8), say so publicly.
7. Trolls and bait: mute, do not reply. Block and report only for abuse, threats or doxxing.
8. Developers: never ask a developer for keys in public; offer coverage where it exists (X14).
9. Journalists: never pitch in the replies of a breaking story; offer data after the cycle (X15, B10).
10. Disclose when relevant: staff accounts say "I work on TechPlay" when they link to TechPlay.
11. Nothing about the GTA VI giveaway until C09 is verified in admin.

## 10. Metrics

No baselines exist; the first Monday report (5 Oct) records them. TARGETs are set on Mon 26 Oct using the formula in file 05 §12.

| Network | Primary | Secondary | Guardrail | Site event |
|---|---|---|---|---|
| X | Replies per post (median, by franchise) | Profile follows gained per week; link sessions by utm_campaign; list members who replied | Follower losses in the 24 h after a post; any report or block notice | cta_click, reminder_set (utm_source=x) |
| Threads | Replies per post | Follows gained; reply-link sessions | Posts with zero replies after 24 h (three in a row → change the prompt style) | registration_start (from=threads) |
| Bluesky | Reposts and quotes by accounts on our lists | Referral sessions; citations or links from journalists (tracked in the PR sheet) | Unanswered correction requests (must be zero) | cta_click on /data pages |

**Keep/cut on Mon 9 Nov (Threads, Bluesky):** keep if the median replies per post (Threads) or list-account reposts per week (Bluesky) rose between weeks 1–3 and weeks 4–6; otherwise cut to one post a week and move the hours to Discord.

## Dependencies and open questions

- **C02 link fix:** X must be linked from the footer and "Follow Us" block before promotion [R02]; Reddit, Discord and Bluesky share buttons are a DEV item.
- **Accounts:** confirm Threads handle; create Bluesky. A techplay.gg domain handle needs either a DNS record (changes need approval, README §14) or a web-file method served by DEV.
- **New pages referenced in posts:** /gta6/release-time (C08, 14 Oct), /data/release-congestion-2026 (C20), /data/studios-closed-2026 (C22), /data/studio-atlas (C21), /awards/2026 (C29), /steam (C62, 2 Nov). Posts do not go out before their page is live; B8, B9, B13 and B14 link to /news until each data page's URL is fixed.
- **C25** depends on the IGDB time-to-beat terms check; B13 is held until it clears.
- **D-020:** no post presents the GTA map's location count as TechPlay's own data until attribution is settled.
- **Unknown times:** GTA VI unlock times and The Game Awards start time are not in the research; both are confirmed from official sources before any post names them.
- **X analytics access** and Bluesky/Threads native analytics were not researched; if unavailable, metrics come from UTM sessions and manual reply counts.
