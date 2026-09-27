# 12 — Discord: The TechPlay Server Operating System

Status: Phase 2 plan — 27 Sep 2026
Campaigns: C35 Discord Rebuild (28 Sep–12 Oct) · C36 Road to 500 (12 Oct–31 Dec) · C37 What Are You Playing? · C38 Game Club · C39 Poll of the Week · C65 On This Day · C68 Founding 100 · touches C06, C09, C10, C13, C18, C21, C29, C30, C67.
Owner: SC. Support: EIC (AMAs, decisions), ED (article feedback, breaking pings, Fix It Friday), DS (Buffy art, event cards), DEV (bot items in §17).

## Summary

- Discord is a PRIMARY channel and TechPlay's only owned channel with a live community: 160 members, 24 online, Community enabled, rules screening on, no Onboarding, no vanity URL, landing in "🎮┃gaming" [R13, R02]. The bot, Professor Buffy, already links Discord to site accounts, XP and ranks, posts every article and runs a Sunday recap [R01 B.8]. The gap is not plumbing. It is rituals, onboarding and a reason to come back [R13].
- C35 (28 Sep–12 Oct) rebuilds the server: 7 categories, 11 default channels (all open to everyone, above Discord's floor of 7 default and 5 public [R13]), 3 onboarding questions that assign platform, game and ping roles, a Server Guide with 5 to-dos, and rank roles cleaned with the bot's own `/admin roles` tool.
- The weekly spine is five rituals shared with the site: F01 Out This Week (Mon), F11 What Are You Playing? (Mon), F15 Readiness Check (Tue), F12 Poll of the Week (Wed), F14 Buffy's Weekly Wrap (Sun). F22 Game Club runs monthly. One human-hosted event a week (Squad Night, Thu 20:00 CET) is the reason to be online at a set time.
- Professor Buffy keeps his job and loses the costume lines: no "centuries of wisdom", "young one", prophecies or wand-waving. He becomes "a senior guild member, not a cartoon teacher" [R13]. "Profesor" gets fixed on the WoW Analyzer (D-040).
- C36 "Road to 500" (12 Oct–31 Dec) is a TARGET, not a forecast: +340 net members in about 12 weeks, where the historical growth rate is unknown (153 in an undated code comment, 160 today). Every campaign gets its own invite code; joins are attributed by the bot once D-011 ships. 500 unlocks Server Insights; 1,000 makes the server eligible to apply for Discovery [R13].
- Three things are broken or misleading today and must not be promoted until fixed: the dead invites on the GTA 6 hub and roadmap (D-004); the bot's giveaway links, which point to `/giveaways/{slug}` while the site's route is `/giveaway/{slug}` (new finding, D-041); and `/daily`, which pays uncapped XP outside `XpService` (D-035) [R01 B.2.7].
- Capacity: SC about 9.5 h/week on Discord after a 12 h setup spread over C35; EIC 1 h, ED 1.5 h, DS 0.5 h. Bot work is 13 small DEV items, mostly XS–S.

---

## 1. Where the server stands (27 Sep 2026)

| Area | State | Source |
|---|---|---|
| Size | 160 members, 24 online (Discord API) | R13, R02 |
| Server features | COMMUNITY, NEWS, WELCOME_SCREEN, MEMBER_VERIFICATION_GATE (rules screening) | R02 |
| Onboarding / vanity URL | None / none | R13 |
| Landing channel | 🎮┃gaming | R13 |
| Full channel list | UNKNOWN (not captured in research). SC exports it on 28 Sep | — |
| Invites | `wPQG9gUMXH` works (footer, homepage, forum, leaderboard, help). `techplaygg` (GTA 6 hub, roadmap) and `techplay` (settings seeder default) are dead | R13 |
| Bot commands | 20 slash commands: /profile /link /sync /search /game /library /match /backlog /daily /leaderboard /stats /help /tip /techplay /latest /giveaways /forum /subscribe /gift /admin | R01 B.8.1 |
| Bot automations | Article push to `latest-news`; welcome in `new-people`; message XP 15 per message with 60 s cooldown through the capped `XpService`; rank-up and achievement embeds; leaderboard overtakes; Sunday 20:00 recap; stats voice channels; status rotation; DM subscriptions; presence and "Discord Native" badge sync | R01 B.8.2 |
| Bot gaps | No onboarding or reaction roles, no scheduled content besides the recap, no thread creation, no invite tracking, no Bounty/quests on Discord, no command analytics | R01 B.8.3 |
| Rank roles | Created when the bot was written: `Rokie`, `Challener`, `Legendary`, `Global Elite`, `God Of Gaming`, `Noob`, `Newbie`; `Apex` never created. The bot's `/admin roles` plans and applies renames, never deletes | `RoleLadderService.ts` |
| XP leak | `/daily` pays 50 XP + streak bonus straight into `users.xp`, uncapped, no season multiplier; it shares the streak columns with the site streak | R01 B.2.7 |
| Double XP | `/admin event` exists; whether any XP code reads its multiplier is UNVERIFIED | R01 B.12 #20 |
| Giveaway links (new) | `/giveaways` command and giveaway DMs link `techplay.gg/giveaways/{slug}`; the site route is `/giveaway/{slug}` and no redirect exists | `commands.ts:537`, `SubscriptionService.ts:192`, `frontend/app/giveaway/[slug]` |
| Stale number | Bot constant `CATALOGUE_SIZE = '332,000'` | `BuffyService.ts:48` |

### 1.1 Code dependencies to respect while rebuilding

| The bot looks for | How | Consequence of renaming |
|---|---|---|
| `new-people` | Exact channel name (`events.ts:79`) | Rename it, or add an emoji prefix, and welcomes stop silently. Keep the name exactly until D-011a adds a channel ID setting |
| `latest-news` | `LATEST_NEWS_CHANNEL_ID` env, else exact name | Set the env ID before any rename |
| Announcements | `RECAP_CHANNEL_ID` env, else a channel named `announcements`, `general` or `news` | Set the env ID to the new #announcements |
| Stats voice channels | "📊 Members", "🟢 Online", "🤖 Bots", updated every 10 min | Leave them as they are |

---

## 2. Operating principles

1. **Rituals over channels.** A new channel only when a ritual needs it. Four or five channels per category at most [R13].
2. **Buffy announces; humans moderate** [R13]. Buffy never explains a moderation decision, a correction or a delay.
3. **Live numbers or none.** Member counts come from Discord itself. No "thousands", no invented stats [SPINE §0].
4. **Site and server share rituals.** What Are You Playing, the poll and the Game Club run on the forum too, and Discord posts link to shelves, lists and the calendar.
5. **One owner per ritual**, one backup. If a ritual misses two weeks running, it is paused and announced, not left to rot.
6. **No DMs from staff or bot that members did not ask for.** `/subscribe` DMs are opt-in and stay that way.

---

## 3. Channel list

Slow-mode is the default; staff raise it during events. "Default" = shown to every new member through Onboarding.

### 3.1 📌 START HERE

| Channel | Type | Purpose | Who posts | Slow-mode | Default |
|---|---|---|---|---|---|
| #rules | Text, read-only | Rules (§12.1), used by rules screening | Staff | — | Yes |
| #announcements | Announcement | Server news, Weekly Wrap (F14), leaderboard climbs, milestones, "You asked, we did" | Staff + Buffy (`RECAP_CHANNEL_ID`) | — | Yes |
| #new-people | Text | Buffy's welcome embed; members say hello | Buffy + members | 30 s | Yes |
| #how-techplay-works | Text, read-only | `/link`, XP, ranks, commands, Founder role, what the site does | Staff | — | Yes |

### 3.2 📰 NEWS

| Channel | Type | Purpose | Who posts | Slow-mode | Default |
|---|---|---|---|---|---|
| #latest-news | Text, read-only; threads allowed | Buffy posts every article (existing). Members discuss in the article's thread | Buffy | — | Yes |
| #releases | Text; threads allowed | F01 Out This Week (Mon); a thread per big release day | SC | 60 s | Yes |
| #deals | Text | F16 Deal Radar during sales (C05, C31, C32, C34); members may post a deal with a store link | SC + members | 5 min | No (Deals role) |
| #article-feedback | Forum | Corrections, questions, ideas about a specific article. Tags: Correction, Question, Idea, Thanks | Members; ED replies | 10 min per post | No (visible to all) |

### 3.3 💬 COMMUNITY

| Channel | Type | Purpose | Who posts | Slow-mode | Default |
|---|---|---|---|---|---|
| #general | Text | Main chat; F06 On This Day; F05 Hidden Gem prompt | Everyone; Buffy | 0 (5 s during events) | Yes |
| #what-are-you-playing | Forum | One post per week (F11), members reply; F19 Library Card spotlight | SC opens; members reply | — | Yes |
| #polls | Text | F12 Poll of the Week (native poll), on-this-day quiz, awards voting (C30) | Staff | Members cannot post; they vote | Yes |
| #screenshots | Forum, gallery view | Screenshot of the week; tags per game | Members | 1 post per 10 min | No |
| #looking-for-group | Forum | Find players. Tags: PC, PlayStation, Xbox, Switch 2, Mobile, WoW, GTA 6 | Members | 1 post per 15 min | No |
| #suggestions | Forum | Ideas for the server and the site. Tags: New, Under review, Planned, Shipped, Not doing | Members; SC tags | 1 post per 30 min | Yes |

### 3.4 🎮 GAMES (opt-in through Onboarding)

| Channel | Type | Purpose | Who posts | Slow-mode | Visible to |
|---|---|---|---|---|---|
| #gta6 | Text | F02 daily countdown until 19 Nov, F03 Confirmed or Rumour? (Thu), launch talk | SC + members | 10 s (30 s launch week) | GTA 6 role |
| #gta6-spoilers | Text | Opens 19 Nov; story spoilers allowed | Members | 10 s | GTA 6 role |
| #wow | Text | F15 Readiness Check (Tue), patch days (C13), WoW: Forever (C14) | SC + members | 5 s | WoW role |
| #mmo | Text | FFXIV, Guild Wars 2, other MMOs; /mmo hub (C15) | Members | 5 s | MMO role |
| #pc-help | Forum | F07 Fix It Friday; members' PC problems. Tags: Solved, Stutter, Crash, Settings, Hardware | ED + members | 1 post per 15 min | PC role or PC Fixes role |
| #switch-2 | Text | Editions, upgrades, /switch-2 hub (C61) | Members | 5 s | Switch 2 role |
| #indie-and-demos | Text | Next Fest diary (F23, C18), indie picks, C71 developer drops | ED + members | 10 s | Everyone (not default) |

### 3.5 🎉 EVENTS & CLUB

| Channel | Type | Purpose | Who posts | Slow-mode | Default |
|---|---|---|---|---|---|
| #events | Text, read-only | Event details; each Scheduled Event links here | Staff | — | Yes |
| #game-club | Forum | One post per month (F22, C38) with weekly checkpoints | SC opens; members reply | — | No (Game Club role or visible to all) |
| #community-games | Text | Guess the Game (Sat), quizzes | SC + members | 3 s during games | No |
| #giveaways | Text, read-only | Only when a giveaway is live (C09 and later) | Staff | — | No (Giveaways role) |
| TechPlay Stage | Stage | AMAs, watch parties, awards reveal | Staff + speakers | — | — |
| 🔊 Lounge, 🔊 Squad 1, 🔊 Squad 2 | Voice | Hanging out, Squad Night | Members | — | — |

### 3.6 📊 SERVER STATS

Existing "📊 Members", "🟢 Online", "🤖 Bots" voice channels stay unchanged (bot updates them every 10 minutes [R01 B.8.2]).

### 3.7 🛡 STAFF (private)

| Channel | Purpose |
|---|---|
| #staff | Coordination, rota, decisions |
| #mod-log | AutoMod alerts, actions taken, notes |
| #bot-admin | `/admin` commands |
| #content-desk | ED/SC: which article gets the @Breaking ping, poll wording, ritual queue |
| #invite-log | Invite codes sheet link; weekly join-by-invite report once D-011 ships |

### 3.8 Migration rules (C35, 28 Sep–12 Oct)

1. 28 Sep: SC exports the current channel list and maps old → new in the sheet.
2. Channels with history are moved to an "Archive" category as read-only, not deleted.
3. Set `RECAP_CHANNEL_ID` and `LATEST_NEWS_CHANNEL_ID` before renaming anything. Keep `new-people` exactly.
4. "🎮┃gaming" becomes #general (rename keeps its history).
5. One announcement explains the change on the day it happens (copy in §6.4).

---

## 4. Roles

### 4.1 Role table

| Group | Role | How you get it | What it does | Hoisted | Colour |
|---|---|---|---|---|---|
| Staff | Editor | EIC, ED | Staff permissions | Yes | Brand primary |
| Staff | Community Manager | SC | Staff + mod permissions | Yes | Brand primary |
| Staff | Moderator | Appointed volunteers (§12.4) | Timeout, manage messages | Yes | Distinct |
| Bot | Professor Buffy | Bot | — | No | — |
| Platform | PC, PlayStation, Xbox, Switch 2, Steam Deck / Handheld, Mobile | Onboarding Q1 | LFG tags, #pc-help and #switch-2 access | No | Neutral |
| Interest | GTA 6, WoW, MMO, PC Fixes, Deals, Indie & Demos | Onboarding Q2 | Unlocks game channels | No | Neutral |
| Pings | @Breaking News, @Out This Week, @Events, @Giveaways, @Game Club | Onboarding Q3 (all off by default) | Mentionable by staff only | No | None |
| Recognition | Founder | Site Founder badge (C68 Founding 100) + `/link`. Manual until D-011g | Name colour, thanks in #how-techplay-works | Yes | Gold |
| Recognition | Member of the Week | Picked in F14 (opt-in, rotates weekly) | Hoisted for 7 days | Yes | Distinct |
| Recognition | Helper | 3 posts marked Solved in #pc-help | Recognition only | No | Distinct |
| Recognition | Inviter | Invites that brought 3 members who stayed 7 days and posted once (D-011, D-011b) | Recognition; monthly mention | No | Distinct |
| Recognition | Game Club Regular | Attended 3 discussion nights | Recognition | No | Distinct |
| Recognition | Season 2 Champion | Site season badge after `season:conclude` (C67), mirrored manually until D-011g | Recognition | No | Distinct |
| Ranks | Newcomer … Eternal (20) | `/sync` after `/link`, mirrored from site XP | Shows site rank | No | Rank colours from site |

Rank roles are not hoisted: 20 hoisted groups would bury the member list.

### 4.2 Rank-role clean-up (C35, week 1)

| Step | Command / action | Owner |
|---|---|---|
| 1 | `/admin roles` (plan only). Paste the plan into #bot-admin | SC |
| 2 | Check it: Noob → Newcomer, Newbie → Player, Rokie → Rookie, Challener → Challenger, Legendary → Legend, God Of Gaming → Eternal; create Apex | SC |
| 3 | `/admin roles apply` | SC |
| 4 | `Global Elite` is an orphan (it sat at 150,000 XP next to Radiant). Announce, then remove it by hand after 7 days | SC + EIC |
| 5 | Post in #announcements: "Rank roles now match the site's 20 ranks. If yours looks wrong, run `/sync`." | SC |

---

## 5. Onboarding (C35)

Discord's guidance: at least 7 default channels, 5 of them open to everyone; questions assign roles and channels; drop bot-verification gates [R13]. TechPlay's gate is Discord's own rules screening, not a bot; keep it and keep the rules short. (Note: R07 records the Onboarding help pages as blocked by Cloudflare for its agent, while R13 reports them read from the source log. Re-check the numbers in Discord's settings screen on 28 Sep.)

### 5.1 Default channels (11, all open to everyone)

#rules, #announcements, #new-people, #how-techplay-works, #general, #latest-news, #releases, #what-are-you-playing, #polls, #suggestions, #events.

### 5.2 Questions

| # | Shown | Question | Type | Options → roles / channels |
|---|---|---|---|---|
| Q1 | Pre-join | Where do you play? | Multi-select, optional | PC → PC role · PlayStation → PlayStation · Xbox → Xbox · Switch 2 → Switch 2 + #switch-2 · Steam Deck or another handheld → Steam Deck / Handheld · Phone → Mobile |
| Q2 | Pre-join | What do you want to follow here? | Multi-select, optional | GTA 6 → #gta6 · World of Warcraft → #wow · Other MMOs (FFXIV, GW2…) → #mmo · PC performance and fixes → #pc-help · Deals and sales → #deals · Indie games and demos → #indie-and-demos · Screenshots → #screenshots · Finding people to play with → #looking-for-group |
| Q3 | Post-join | Which pings do you want? We keep them rare. | Multi-select, optional, none pre-selected | Breaking news (2 a week at most) → @Breaking News · Out This Week, Mondays → @Out This Week · Game nights and AMAs → @Events · Giveaways (only when one is live) → @Giveaways · Game Club → @Game Club |

Descriptions under each option say what the member will get and how often, in one line. No question asks for age, country or email.

### 5.3 Settings checklist

| Setting | Value | Why |
|---|---|---|
| Rules screening | On, 8 rules (§12.1) | Already on; keep |
| Verification level | Medium (account older than 5 min) | Blocks throwaway raids without a bot gate |
| 2FA requirement for moderation | On | A Discovery prerequisite [R13]; protects the server now |
| Default notifications | Mentions only | Members choose pings in Q3 |
| Explicit media filter | All members | Safety settings are a Discovery prerequisite [R13] |
| Server Guide | On (§6) | Replaces the old Welcome Screen [R13] |
| Community updates channel | #staff | Discord notices go to staff |

---

## 6. Server Guide and welcome flow

### 6.1 Welcome sign (Server Guide)

> **TechPlay is the gaming publication that knows what you play.** This server is where the editors and readers talk about it: what's out this week, what we're playing, and what's broken on PC. The news arrives by itself in #latest-news. Everything else is people.

### 6.2 To-dos (5)

| # | To-do | Action | Channel |
|---|---|---|---|
| 1 | Say hello | Send a message | #new-people |
| 2 | Tell us what you're playing this week | Reply to the pinned post | #what-are-you-playing |
| 3 | Link your TechPlay account so your chat counts toward your site rank | Read | #how-techplay-works |
| 4 | Vote in this week's poll | Read / vote | #polls |
| 5 | See what's out this week | Read | #releases |

Resource pages: Rules · How XP and ranks work here · This month's Game Club · This week's events · Invite a friend (default invite `https://discord.gg/wPQG9gUMXH`).

### 6.3 #how-techplay-works (pinned, read-only)

> **What TechPlay is.** A gaming publication with a free game library behind it: 333,000+ games catalogued, and an import from Steam, PlayStation, Xbox, GOG and Epic that fills your shelf for you. The release calendar, reminders and the GTA 6 hub run on the same database.
>
> **Linking.** Run `/link` here. It sends you to your TechPlay settings; press Connect Discord, then run `/sync`. Once linked, chatting here earns site XP (15 per message, once a minute, inside the site's daily cap) and your rank shows as a role.
>
> **Commands worth knowing.** `/profile` your card · `/game` look up any game · `/library` your shelf · `/backlog` three things to play next from what you own · `/match @someone` how much your libraries overlap · `/leaderboard` · `/subscribe` opt-in DMs for news or giveaways.
>
> **Founder role.** The first 100 members who set up a full TechPlay profile get the Founder badge on the site and the Founder role here.
>
> **Pings.** Change them any time in Channels & Roles at the top of the channel list.
>
> No account? You don't need one to talk here. If you want one: https://techplay.gg/register?from=discord

(`/daily` is left out of this list until D-035 routes it through the XP cap; see §9.)

### 6.4 Rebuild announcement (Mon 12 Oct, #announcements, @everyone once)

> We've rebuilt the server.
>
> - Pick your platforms, games and pings in **Channels & Roles** at the top. Game channels (GTA 6, WoW, MMOs, PC help, Switch 2) only show if you want them.
> - New weekly rhythm: Out This Week and What Are You Playing on Mondays, the WoW Readiness Check on Tuesdays, the poll on Wednesdays, Squad Night on Thursdays at 20:00 CET, Guess the Game on Saturdays, and the Weekly Wrap on Sundays.
> - Rank roles now match the site's 20 ranks. If yours looks wrong, run `/sync`.
> - Ideas and complaints go in #suggestions. We tag every one and post what we did with them at the end of each month.
>
> That's the last @everyone for a while.

### 6.5 First week for a new member (no unsolicited DMs)

| Day | What they see | Where |
|---|---|---|
| 0 | Onboarding Q1–Q3, Server Guide, Buffy's welcome embed (§8.3) | Onboarding, #new-people |
| 0 | SC or a moderator replies by name to their hello within 12 h (evenings CET covered by staff) | #new-people |
| 1–7 | The current What Are You Playing post is pinned at the top of the forum | #what-are-you-playing |
| First Thu | Squad Night event card with "Interested" button | #events |
| First Sun | Weekly Wrap mentions "new this week: N members" (live count, no names without consent) | #announcements |

---

## 7. Rituals, events and community programmes

### 7.1 Weekly rituals

| Ritual | ID | When (CET) | Channel | Owner | Template |
|---|---|---|---|---|---|
| Out This Week | F01 / C04 | Mon 10:00 | #releases, @Out This Week | SC (from ED's site article) | "Out this week: [5–8 games with platform and day]. Full list with prices and reminders: [calendar link, utm_source=discord]. What are you picking up?" |
| What Are You Playing? | F11 / C37 | Mon 12:00 | #what-are-you-playing (forum post) | SC | "Week [ISO week]: what are you playing? One line is enough. Bonus: why, and would you recommend it. If your shelf is on TechPlay, drop the link." SC replies first with a real answer |
| Readiness Check | F15 / C13 | Tue 18:00 (US reset day) | #wow | SC | "Reset day. One thing to check before you queue: [tip]. Run your character: [WoW Analyzer link after D-040]. What's your goal this week?" |
| Poll of the Week | F12 / C39 | Wed 12:00, runs 7 days | #polls | SC | Native poll, ≤10 answers, up to one week [R13]. Questions in §7.4 |
| Hidden Gem Thursday | F05 / C64 | Thu 17:00 | #general | SC | "This week's hidden gem: [game], [year], [one line]. Anyone played it?" + site link |
| Confirmed or Rumour? | F03 / C07 | Thu 17:30 (until Dec) | #gta6 | ED | "This week in the ledger: [2–3 lines, each labelled Confirmed / Reported / Rumour, with source]. Full ledger: [link]" |
| Squad Night | ritual 15 | Thu 20:00–21:30 | 🔊 Squad 1 + Scheduled Event | SC (host), rotating member co-host | Game chosen by a Monday vote in #looking-for-group from 3 options everyone can play (free-to-play or widely owned) |
| Fix It Friday | F07 / C60 | Fri 17:00 | #pc-help (forum post) | ED | "This week's fix: [problem]. The short version: [3 steps]. Full guide: [link]. Post your own problem in a new thread." |
| Library Card | F19 | Fri 18:00 | #what-are-you-playing | SC | Opt-in only; member volunteers in advance; "[member]'s shelf: [3 facts from their Gamer DNA]. Want to be next? Reply here." |
| Guess the Game | community game | Sat 19:00–19:30 | #community-games + Scheduled Event ("Somewhere else") | SC | §7.5 |
| Buffy's Weekly Wrap | F14 | Sun 20:00 (existing cron) | #announcements | Buffy + SC edits | §8.4 |

Daily items: F06 On This Day (09:00, #general) and F02 GTA 6 Countdown (10:00, #gta6, until 19 Nov). See §13.1.

### 7.2 Game Club (F22, C38)

| Month | Game | Kickoff | Checkpoints | Discussion night |
|---|---|---|---|---|
| October | Control Resonant | Thu 1 Oct 18:00, forum post in #game-club | Thu 8, 15, 22 Oct (one question each) | Tue 27 Oct 20:00, 🔊 Lounge |
| November | Grand Theft Auto VI | Thu 19 Nov (launch day) | Sun 22 Nov first impressions | Sun 29 Nov 19:00, 🔊 Lounge |
| December | Member vote (poll 25 Nov–1 Dec, nominations 18–24 Nov) | Thu 3 Dec 18:00 | Thu 10 Dec | Tue 15 Dec 20:00, 🔊 Lounge |

Kickoff copy:
> Game Club, [month]: **[game]**. Play at your own pace; we'll post one question a week and meet on [date] at [time] CET to talk about it. Spoilers inside the forum post only, tagged by week. Add it to your shelf so we can see who's in: [game page link].

### 7.3 Monthly and seasonal events

| Date | Event | Format | Owner |
|---|---|---|---|
| 1–8 Oct | Steam Autumn Sale thread (C05) | Thread in #deals | SC |
| 5–12 Oct | WoW 12.1.5 readiness push (C13; patch date is a prediction) | #wow pinned post | SC |
| Mon 12 Oct | Rebuild done, Road to 500 starts | #announcements | SC |
| 19–26 Oct | Next Fest Diary (F23, C18) | Nightly thread in #indie-and-demos: 3 demos, one line each | ED |
| Sat 24 Oct 19:00 | Demo Night | Voice + screen share, members show demos | SC |
| Fri 23 Oct | Modern Warfare 4 release thread (C17) | Thread in #releases | SC |
| Thu 29 Oct 20:00 | AMA: the Balkan Game Dev Census (C21), EIC | TechPlay Stage (replaces Squad Night that week) | EIC |
| Sat 31 Oct 20:00 | Halloween horror night (C19) | Voice; horror picks from the site list | SC |
| Sun 1 Nov | Season 2 "Overdrive" starts (C67; verify dates in admin) | #announcements: the 4 season quests | SC |
| Wed 4 Nov | WoW: Forever launch thread (C14) | #wow | SC |
| Thu 12 Nov 20:00 | GTA 6 launch Q&A with ED: editions, unlock time, pre-load (C10) | TechPlay Stage | ED |
| 18 Nov–10 Dec | The Game Awards Prediction League (C29) | #announcements + site | SC |
| Thu 19 Nov | Vice City Launch Lounge (C10). Starts at the official unlock time if announced (C08 tool); otherwise 20:00 CET. #gta6-spoilers opens | 🔊 Lounge + Scheduled Event | SC + ED |
| 27 Nov, 30 Nov | Black Friday / Cyber Monday threads (C31, C32) | #deals | SC |
| 1–20 Dec | TechPlay Community Awards (C30): nominations 1–7 Dec (forum post), votes 8–14 Dec (one native poll per category), reveal Sun 20 Dec | #polls, Stage | SC |
| Thu 10 Dec | The Game Awards watch party (F20). Start time from the official announcement | TechPlay Stage + live thread | SC + EIC |
| 14–31 Dec | "Your 2026 in Games" share thread (C28) | #what-are-you-playing | SC |
| 17 Dec | Steam Winter Sale thread (C34) | #deals | SC |
| 24–27 Dec | Light schedule: no events; Buffy's Wrap and On This Day continue | — | — |
| Thu 31 Dec | Season 2 ends; year-end Wrap with Road to 500 result | #announcements | SC |

Scheduled Events rules: every event above is created as a Discord Scheduled Event at least 3 days ahead so "Interested" members are notified; voice events cap at 99 participants; an event nobody starts is removed after an hour, so the host starts it on time [R13].

### 7.4 Poll of the Week calendar (F12, Wednesdays 12:00)

| Date | Question | Answers | Tie |
|---|---|---|---|
| 30 Sep | If PlayStation stopped making discs, what would you do? | Keep buying physical while I can · Go fully digital · Play more on PC · Doesn't change anything for me | C66 |
| 7 Oct | How many new games do you actually start in a busy month? | None · 1 · 2–3 · 4 or more · I finish my backlog instead | C20 |
| 14 Oct | Modern Warfare 4 on 23 Oct | Day one · Later, on sale · Skipping this one · I don't play CoD | C17 |
| 21 Oct | How many Next Fest demos will you try? | None · 1–2 · 3–5 · 6 or more | C18 |
| 28 Oct | WoW: Forever on 4 Nov: going back? | Yes · Maybe · No · Never played WoW | C14 |
| 4 Nov | GTA VI: which edition? | Standard ($79.99) · Ultimate ($99.99) · Waiting for reviews · Not buying | C10 |
| 11 Nov | Where are you playing GTA VI at launch? | PS5 · Xbox Series X|S · Waiting for a PC version · Not playing | C10 |
| 18 Nov | First night in Vice City: what do you do first? | Straight into the story · Drive around · Find a fast car · Open the map and stare | C10 |
| 25 Nov | December Game Club pick | Top 4–6 member nominations | C38 |
| 2 Dec | What did you buy in the sales? | Nothing · One game · 2–4 games · Hardware · A subscription | C31/C32 |
| 9 Dec | The Game Awards: who should win Game of the Year? | Official nominees, filled when announced | F20 |
| 16 Dec | Winter Sale plan | Wishlist first · Backlog first · Skipping it · Buying a gift | C34 |
| 23 Dec | How many games did you finish in 2026? | 0 · 1–5 · 6–15 · 16 or more · I don't count | C28 |

Results: the next poll's message opens with one line on last week's result. Every poll is mirrored as a forum poll on the site the same day (C39).

### 7.5 Community games

| Game | How it runs | Data | Prize | Needs |
|---|---|---|---|---|
| Guess the Game (Sat 19:00) | 5 rounds. Each round: a tight crop of a cover, then wider at 60 s, full cover at 120 s with the answer and a link to the game page | Covers from TechPlay game pages | Mention in the Weekly Wrap. No XP from staff commands (keeps the XP ledger clean) | Manual now; `/guess` later (D-011i). Cover rights question in open items |
| On This Day quiz (Wed, with the poll) | Native poll: "Which of these came out on this day?" 4 options, answer next morning in F06 | `/games/on-this-day` endpoint [R09 EB-137] | None | Manual; later D-011d |
| Screenshot of the Week | Members post in #screenshots; staff pick one on Sunday for the Wrap | Members' own screenshots | Mention + Member of the Week eligibility | — |

A weekly themed contest voted by members is the pattern Discord's photography case study credits with 20–30% new-member retention [R13]. Screenshot of the Week is our version; it gets a theme from November (e.g. "Vice City at night" in launch week).

### 7.6 Giveaways (C09 and later)

| Step | Date | Action |
|---|---|---|
| Verify | Mon 28 Sep | EIC/SC check in Filament whether the GTA 6 giveaway is real and live (code comment says it closes 20 Oct; the live page showed nothing on 27 Sep) [SPINE §0] |
| Fix first | by announcement | D-041: the bot's `/giveaways` and giveaway DMs link to a URL that 404s |
| If live: announce | Within 48 h of verification | #giveaways + @Giveaways ping (only that role): prize, end date, "no purchase necessary", rules link, entry link. Its "Join our Discord" task uses the C09 invite code |
| Reminder | Sun 18 Oct 18:00 | #giveaways, no ping: "Closes Tuesday 20 Oct. Entry: [link]" |
| Winner | Wed 21 Oct | #giveaways + #announcements, winner named only with consent |
| If not live | — | No Discord mention. SC asks DEV to remove "Giveaway pings before they close" from the site's Discord widget until one runs [R02] |

Never: "invite N people to enter", boosts as entry tasks, or giveaways run only inside Discord without the site's rules page.

### 7.7 Article feedback

- #article-feedback is a forum. One post per article, title = article headline, tag = Correction / Question / Idea / Thanks.
- ED replies within 24 h. A confirmed correction is fixed on the site with a dated note ("Updated 14 Oct: the release date was 22 Oct, not 23 Oct. Thanks to a reader on our Discord.") and the post is tagged Correction + closed.
- Monthly count of corrections goes into the "You asked, we did" post. This supports C01 Trust Reset.

### 7.8 Breaking-news pings

Buffy posts every article to #latest-news without a ping (existing). The @Breaking News ping is a human decision in #content-desk, posted by ED.

| Pings only when | Never ping for |
|---|---|
| An official date, price or platform change for a game many members follow (GTA VI, a major release on the calendar) | Rumours, leaks, "reportedly" stories |
| A showcase announcement that members asked us to watch | Our own features, lists or data posts |
| A studio closure or delisting that affects a game members own | Anything already more than 6 hours old |

Cap: 2 pings a week. Copy: "@Breaking News [one factual sentence]. [Link]". No emoji, no "BREAKING".

### 7.9 AMAs

Fixed: EIC on the Balkan Game Dev Census (Thu 29 Oct 20:00, after C21 publishes on 28 Oct) and ED's GTA 6 launch Q&A (Thu 12 Nov 20:00). Conditional: an indie developer from C71 outreach during Next Fest (only if one agrees by 12 Oct) and a Balkan studio via C55 in November (only if a partner is confirmed by 10 Nov). Format: 45 minutes on Stage; questions collected in a thread 48 h before; SC runs the queue; a written summary goes in #announcements the next day and, with the guest's approval, on the site.

### 7.10 Suggestions with visible outcomes

- Every suggestion is tagged within 7 days: Under review, Planned, Shipped, Not doing (with one line of why).
- Last Friday of each month (30 Oct, 27 Nov, 18 Dec) SC posts "You asked, we did" in #announcements:

> **You asked, we did (October).** [N] suggestions this month. Shipped: [list]. Planned: [list, with the month]. Not doing: [list, one line why each]. Corrections to articles from #article-feedback: [N]. Thanks to everyone who posted.

- Shipped site items also go on /roadmap, which today shows everything as "Planned" or "In progress" [R02].

---

## 8. Professor Buffy

### 8.1 Voice sheet

| Buffy is | Buffy is not |
|---|---|
| Knowledgeable, dry, warm, brief | "Centuries of wisdom", prophecies, "young one", "student" |
| A senior guild member | A cartoon teacher, a wizard, a hype man |
| Plain in instructions | Jokey in instructions |
| One owl touch per message at most | "Hoot hoot!" in every line; stacked exclamation marks |

Rules [R13]: never guilt members about streaks or absence; never speak on moderation decisions; never claim a number that is not live (catalogue size, member counts); label AI-generated tips as AI-generated; keep the footer "🦉 Professor Buffy | TechPlay Community" as the only emoji in embeds that do not need more.

### 8.2 Line replacements (D-011a)

| Where (`BuffyService.ts`) | Today | Replacement |
|---|---|---|
| Welcome titles | "Hoot hoot! 🦉 A new adventurer has joined our ranks!", "The prophecy spoke of your arrival... Welcome, young one!", "*adjusts spectacles* Ah, a new student! Excellent!", "My feathers are tingling! A new gamer approaches!", "By my wise owl eyes!…" | Pool: "Welcome in." · "Someone new. Hello." · "Good to have you here." · "Pull up a chair." |
| Welcome body | "I'm Professor Buffy, your guide to the gaming world!… Let the adventure begin! 🚀" | §8.3 |
| Rank-up lines | "Even in my centuries of wisdom, your progress amazes me!", "The ancient gaming scrolls foretold this moment!", "*ruffles feathers proudly* My student grows stronger!" | Pool: "Promotion. Well earned." · "Up a rank. The leaderboard noticed." · "New rank. Same you, more XP." · "That's one for the records." |
| Rank-up footer line | "Keep going, young gamer! The leaderboard awaits! 🏆" | "**{username}** is now **{rank}** · {xp} XP total." |
| Daily claimed | "*hands over a glowing orb of XP* Use it wisely!" | "Daily bonus claimed. See you tomorrow." |
| Already claimed | "Patience, young gamer!…", "Even my magic needs time to recharge!" | "You've had today's. Next one in {h} hours." |
| Tip intro | "*Professor Buffy adjusts his spectacles and speaks:*" | (none) Title = tip category; body = the tip |
| News DM | "*Hoot! Professor Buffy has news for you!*" | "New on TechPlay:" |
| Giveaway DM | "*Hoot hoot! Free stuff alert!*" | "A new giveaway is open:" |
| Event start / end | "*Professor Buffy waves his wand...*" / "*waves goodbye...*" | "Starting now." / "That's the end of it. Thanks for coming." |
| Catalogue size | Constant "332,000" | Live count from the API, or no number (D-011l) |

On the site: "Profesor Buffy's Tips" in `frontend/components/wow/OverviewTab.tsx` (lines 52, 67) and "Profesor Buffy" in `frontend/app/wow-analyzer/page.tsx` (lines 7, 200, 270) become "Professor Buffy", and the tips panel gets the label "Generated by an AI model from your character data" (D-040).

### 8.3 New welcome embed

> **Welcome in.**
>
> Welcome to TechPlay, **{username}**. I'm Professor Buffy. I post the news and keep score; the people here do the talking.
>
> Worth doing first:
> • Pick your games and pings in **Channels & Roles**
> • Tell us what you're playing in #what-are-you-playing
> • Have a TechPlay account? `/link` makes your chat here count toward your site rank
>
> Rules are short: #rules. You're member #{memberCount}.

### 8.4 Buffy's Weekly Wrap (F14, Sun 20:00)

Existing recap: Member of the Week, all-time top 5, latest 3 articles, server status [R01 B.8.2]. Upgraded content (manual additions by SC until D-011f):

> **The week on TechPlay, [date range]**
>
> **Member of the week:** {member} ({reason: most XP gained / best answer in #pc-help / screenshot of the week}).
> **New here this week:** {N} members. Say hi in #new-people.
> **Most read:** [3 articles with links].
> **Out next week:** [3–5 releases from the calendar] → [calendar link].
> **Poll result:** {one line}.
> **Coming up:** Squad Night Thu 20:00 · Guess the Game Sat 19:00 · [special event].
> **Suggestions:** {N} tagged this week, {N} shipped.
>
> See you Monday.

### 8.5 Where Buffy speaks and where he does not

| Buffy posts | Humans post |
|---|---|
| Welcome, rank-ups, achievement unlocks, leaderboard climbs | Replies to new members |
| Article feed, Weekly Wrap | Breaking pings, corrections, apologies |
| On This Day (after D-011d), poll opening (after D-011e) | Moderation notices and decisions |
| Event start notices | AMA hosting, Game Club discussion |
| Tips (`/tip`) | Giveaway winner announcements |

Visual: Buffy art is not in the repository [R13]. DS delivers one silhouette and an avatar file at a working URL by 9 Oct, then seasonal variants (Halloween, GTA launch week, December) if time allows (1 h each).

---

## 9. XP and progression on Discord

| Mechanism | State | Plan |
|---|---|---|
| Message XP | 15 XP per message, 60 s cooldown, through the capped `XpService` (100/day) [R01 B.2.1, B.8.2] | Keep. Explain it in #how-techplay-works. Linked-account XP events count toward WRM [SPINE §3] |
| `/daily` | 50 XP + streak bonus directly into `users.xp`: no cap, no season multiplier, no Bounty; shares the streak columns with the site streak, so claiming one uses up the other [R01 B.2.7] | Do not promote until D-035 routes it through `XpService`. Not in the Server Guide or #how-techplay-works |
| `/gift` | Moves 10–1,000 XP from giver to receiver (backend decrements the sender) | Leave as is; not promoted |
| `/admin event` (Double XP) | Multiplier consumer UNVERIFIED [R01 B.12 #20] | No Double XP announcements until D-011k confirms it works |
| Rank roles | Mirrored via `/sync` | Clean-up §4.2 |
| Season 2 "Overdrive" | 1 Nov–31 Dec, 4 season quests (30-day streak, 5 completions, publish a list, 3 discussions) [R01 B.2.5]; dates UNVERIFIED in production | Announce 1 Nov with the quest list; mention the list quest in Game Club and Screenshot threads |
| "Discord Native" achievement | 75 points for being in the guild (linked) [R01 B.2.4] | Mention in #how-techplay-works |
| Quests on Discord | Not visible (no `/quests`) [R01 B.8.3] | Weekly Wrap line "This week's quests" (manual) until a command exists (not planned this quarter) |

Rule: staff never hand out XP with `/admin xp give` for event wins or games. Recognition is roles and mentions; XP stays earned.

---

## 10. Metrics

| Metric | Definition | Source | TARGET by 31 Dec |
|---|---|---|---|
| Members | Discord's own count | Discord API / stats channel | 500 (C36) |
| Net joins per week | Joins minus leaves | Bot logs; D-011 | ≥ 26 average (arithmetic from the 500 target) |
| Joins by invite code | Per campaign | D-011 | Reported weekly from D-011 go-live |
| New-member activation | Share of joiners who post within 7 days | D-011c | ≥ 40% (baseline unknown) |
| Weekly posters | Unique members who posted in the week ÷ members | D-011c, then Server Insights at 500 | ≥ 20% (Discord's guide calls about 30% communicating healthy [R13]) |
| Linked members | Guild members with a linked TechPlay account | Backend (Discord Native badge holders) | Baseline on 28 Sep; TARGET = baseline + 60 |
| Ritual participation | Replies to F11 post; poll votes; Squad Night attendance | Manual count Sunday | F11 ≥ 15 replies/week; Squad Night ≥ 8 people by Dec |
| Article feedback resolved | Posts answered within 24 h | Forum tags | 100% |
| Mod response | Reports handled within 24 h | #mod-log | 100% [SPINE §3 guardrail] |
| Discord → site | Sessions `utm_source=discord` (after D-008, D-009) | Collector / GA4 | Reported |

---

## 11. Retention

The same four days every week (Mon releases and check-in, Wed poll, Thu Squad Night, Sun Wrap); staff reply by name to every hello; visible progress (rank, Founder, Helper, Inviter, Season Champion roles); programmes that end with a results post (Game Club months, seasons, Prediction League, Community Awards); no streak guilt, no "we miss you" DMs, @everyone at most once a month [R13]. D-011c's first-week activation number decides monthly which Onboarding options and channels stay.

---

## 12. Moderation

### 12.1 Rules (#rules and rules screening)

> 1. **Be decent.** Argue about games, not people. No slurs, harassment or pile-ons.
> 2. **Spoilers go in spoiler tags** for 14 days after a game's release, and in #gta6-spoilers for GTA VI.
> 3. **No piracy, cheats for online games, account selling or leaks**, including leaked footage.
> 4. **No self-promotion or server invites** without asking staff. #looking-for-group is for finding players.
> 5. **No NSFW content.**
> 6. **Keep personal information private**, yours and everyone else's.
> 7. **Questions about a moderation decision go to a staff member by DM.** Ideas for rules go in #suggestions.
> 8. **Discord's Terms and Community Guidelines apply.**
>
> What happens: a note, then a timeout, then a kick, then a ban. Scams, doxxing and hate speech go straight to a ban.

### 12.2 AutoMod

| Rule | Setting |
|---|---|
| Commonly flagged words (all preset lists) | Block + alert #mod-log |
| Mention spam | Block messages with more than 5 mentions; timeout 10 min |
| Suspected spam content | Block + alert |
| Custom keywords: server invites | Block `discord.gg/` and `discord.com/invite/` except TechPlay's own codes; alert |
| Custom keywords: scams | "free nitro", "steam gift" + link, "claim your", "airdrop"; block + alert |
| Exempt roles | Staff, Moderator |

The bot also has a bad-word and invite filter that deletes and DMs [R01 B.8.2]. To avoid double action, AutoMod is primary; D-011j makes the bot's filter configurable and exempts TechPlay's own invite codes.

### 12.3 Ladder

| Step | Action | Logged |
|---|---|---|
| 1 | Note (public reply or DM, one line, rule number) | #mod-log |
| 2 | Timeout 1 h | #mod-log |
| 3 | Timeout 24 h | #mod-log |
| 4 | Kick | #mod-log |
| 5 | Ban | #mod-log + reason |
| Skip to 5 | Scams and phishing, doxxing, hate speech, sexual content involving minors (also reported to Discord), raids | — |

### 12.4 Team

| Members | Moderators | Coverage |
|---|---|---|
| Now (160) | SC (lead), EIC, ED | Evenings CET; daily pass by SC |
| 300 | + 2 volunteer moderators from regulars, one in US time zones | Evening CET + US afternoon/evening |
| 500 | 4 volunteers | Rota in #staff |

Volunteers: invited, not applied for; active 4+ weeks, no warnings, 2FA on. One-page handbook: rules, ladder, when to escalate to SC, never argue in public, never discuss decisions in public channels. Bots support moderators and do not replace them [R13].

Open risk: Discord's age verification was relaunched after privacy backlash in September 2026; the effect on community servers is UNKNOWN [R06, R07]. SC reads Discord's notice when it reaches #staff and posts a plain summary if members are affected.

---

## 13. Rhythms (times are CET = Sarajevo local; CEST until 25 Oct)

### 13.1 Daily

| Time | Item | Channel | Owner | Minutes |
|---|---|---|---|---|
| 09:00 | F06 On This Day (C65): one anniversary from `/games/on-this-day`, one line + game link | #general | SC (Buffy after D-011d) | 5 |
| 10:00 | F02 GTA 6 Countdown (C06, until 19 Nov): "[N] days to Vice City. Today: [one confirmed fact from the hub]. Source: [Rockstar/trailer]." Only confirmed map locations; attribution for map data pending D-020 | #gta6 | SC | 5 |
| All day | Article feed (automatic) | #latest-news | Buffy | 0 |
| 12:00 | Reply by name to new hellos | #new-people | SC | 5 |
| 18:00 | Moderation pass: #mod-log, reports, forum tags | all | SC | 10 |
| 21:30 | Evening check (weekdays), reply in #pc-help and #article-feedback | — | SC / ED | 5–10 |

### 13.2 Weekly

| Day | Time | Item | Owner | Hours |
|---|---|---|---|---|
| Mon | 10:00 | F01 Out This Week + @Out This Week | SC | 0.25 |
| Mon | 12:00 | F11 What Are You Playing? forum post; Squad Night game vote in #looking-for-group | SC | 0.25 |
| Tue | 18:00 | F15 Readiness Check | SC | 0.25 |
| Wed | 12:00 | F12 Poll + on-this-day quiz poll | SC | 0.25 |
| Thu | 17:00 / 17:30 | F05 Hidden Gem · F03 Confirmed or Rumour? | SC / ED | 0.5 |
| Thu | 20:00–21:30 | Squad Night (Scheduled Event) | SC host | 1.5 |
| Fri | 15:00 | Suggestions triage (tags) | SC | 0.25 |
| Fri | 17:00 / 18:00 | F07 Fix It Friday · F19 Library Card | ED / SC | 0.5 |
| Sat | 19:00–19:30 | Guess the Game | SC | 0.75 |
| Sun | 18:00 | Prepare Wrap additions; pick Member of the Week and Screenshot of the Week | SC | 0.5 |
| Sun | 20:00 | F14 Buffy's Weekly Wrap | Buffy + SC | 0.25 |
| — | — | Daily items (§13.1) × 7 | SC | 3.5 |
| — | — | Create next week's Scheduled Events (Mon) | SC | 0.25 |
| **SC total** | | | | **≈ 9.5 h** |

### 13.3 Monthly

| When | Item | Owner | Dates this quarter |
|---|---|---|---|
| 1st week | Game Club kickoff (F22) | SC | Thu 1 Oct · Thu 19 Nov · Thu 3 Dec |
| 1st Monday | Rules, roles and Onboarding check; invite report; Road to 500 progress post | SC | 5 Oct · 2 Nov · 7 Dec |
| Mid-month | Stage event (AMA or Q&A) | EIC / ED | Thu 29 Oct · Thu 12 Nov · Thu 10 Dec (TGA watch party) |
| Last Saturday | Community night (Activity or party game in voice) | SC | Sat 31 Oct (Halloween) · Sat 28 Nov · Sat 19 Dec |
| Late month | Game Club discussion night | SC | Tue 27 Oct · Sun 29 Nov · Tue 15 Dec |
| Last Friday | "You asked, we did" | SC | 30 Oct · 27 Nov · 18 Dec |
| Monthly | Buffy seasonal avatar variant (optional) | DS | Halloween · GTA week · December |

---

## 14. Road to 500 (C36, 12 Oct–31 Dec)

### 14.1 The numbers

- Start: 160 members on 27 Sep (Discord API) [R13].
- TARGET: 500 by 31 Dec. That is +340 net, about 26 a week over 13 weeks. The historical growth rate is unknown (a code comment recorded 153 at an unknown date [R01 B.8]), so this is a stretch target, not a forecast.
- Milestones (TARGET): **200 by Sun 25 Oct · 300 by Sun 22 Nov (GTA VI launch week) · 400 by Sun 13 Dec · 500 by Thu 31 Dec.**
- What the milestones unlock: at 500, Server Insights (member activity and retention data); at 1,000 the server can apply for Server Discovery, which also needs the server to be at least eight weeks old, active, with clean names, 2FA for moderators and safety settings [R13]. 1,000 is a 2027 goal.
- Scale check: PC Gamer's server has 948 members and Eurogamer's 1,775 [R13]. Media servers are small; ours will be judged by activity, not size.

### 14.2 Invite codes (one per campaign)

SC creates each invite as "never expire, no use limit", records it in the "discord-invites" sheet (code, campaign ID, placement, date, creator) and never reuses a code across campaigns [SPINE §9]. The default invite `wPQG9gUMXH` stays on the footer, homepage, forum, leaderboard and help centre, and replaces the dead invites via D-004 on 28 Sep.

| Label | Campaign | Placement | Live from | Owner |
|---|---|---|---|---|
| default | — | Footer, homepage, forum, leaderboard, help centre, article sidebar | Now (`wPQG9gUMXH`) | — |
| c46-article | C46 | Article-end CTA block (D-010) | 16 Oct | DEV/SC |
| c40-newsletter | C40 | The Save File footer | 2 Oct | SC |
| c42-welcome | C42 | Welcome email 3 | 12 Oct | SC |
| c10-gta6 | C06/C10 | GTA 6 hub CTA (swap from default once D-011 attributes), countdown posts on social | After D-011 | SC |
| c13-wow | C13/C14 | WoW Analyzer results page: "Talk about your character in #wow" (DEV adds link) | 23 Oct | DEV |
| c47-reddit | C47 | Editors' Reddit profiles only | 28 Sep | SC |
| c49-video | C49 | TikTok, Shorts, Reels bios | 5 Oct | SC |
| social-x, social-threads, social-bluesky, social-instagram, social-facebook | — | Each network's bio | 5 Oct | SC |
| c09-giveaway | C09 | Giveaway "Join our Discord" task | If C09 live | SC |
| c58-reddit-ads | C58 | Paid Reddit test T4 (Discord destination) [R16] | 9 Nov | EIC |
| disboard, discadia | C36 | Free listings, tags: gaming, pc, playstation, xbox, gta6, wow [R16] | 12 Oct | SC |
| c71-nextfest | C71 | Indie studios' Next Fest outreach | 5 Oct | EIC |
| c55-balkan | C55 | Regional partners | Nov | EIC |
| creator-{handle} | C51 | One per creator partner | 20 Oct | EIC |
| c69-steam-curator | C69 | Steam Curator page | 20 Oct | ED |

Member invites: members use their own invite links; once D-011 records the inviter, the Inviter role goes to members whose invites brought 3 people who stayed 7 days and posted once (D-011b). No prizes for invites.

### 14.3 Levers, in order of expected usefulness (ESTIMATE, no join numbers forecast)

| Lever | Why | Owner | When |
|---|---|---|---|
| Fix dead invites (D-004) | The GTA 6 hub has sent everyone who clicked Discord to an error [R13] | DEV | 28 Sep |
| Article-end CTA with Discord (C46, D-010) | Articles are the only pages with organic traffic and carry no CTA in the body today [R02] | DEV | 16 Oct |
| GTA 6 hub and launch week (C06, C10) | The one topic with a fixed date and a daily ritual; Launch Lounge is the reason to join that week | SC | Oct–Nov |
| Events as the reason to join | Discord's growth guidance: events are the reason to join; reward top inviters with roles [R13] | SC | Weekly |
| Newsletter + welcome email (C40, C42) | Owned channels already reaching people who opted in | SC | From 2 Oct |
| Free listings (Disboard, Discadia) | Zero cost; a 2023 experiment saw single-digit members from a day of bumping [R16] | SC | From 12 Oct; bump when online |
| Paid Reddit test to Discord (C58, T4) | Only paid route that targets named gaming communities; kill rule: $100 with fewer than 20 Discord clicks [R16] | EIC | 9–25 Nov |
| Creators and partners (C51, C55, C71) | Their communities, their invitation | EIC | Oct–Nov |

### 14.4 Announcement copy

**A. Road to 500 launch** (Mon 12 Oct, #announcements, included in the rebuild post or the day after; no @everyone if the rebuild post used it)
> We're {live_count} people here. Discord turns on server analytics at 500 members and lets servers apply for Discovery at 1,000. We'd like to reach 500 by the end of the year by giving people a reason to be here, not by begging for invites.
>
> So: something every day (On This Day, the GTA 6 countdown), something most days of the week (releases and What Are You Playing on Monday, the poll on Wednesday, Squad Night on Thursday, Guess the Game on Saturday, the Wrap on Sunday), and a Game Club each month.
>
> If you know someone who'd like it here, your own invite link works. If three people you invite stay for a week and say something, you get the Inviter role. That's the whole scheme.

**B. 200 members** (#announcements, no ping)
> 200. Thanks to everyone who's been posting, especially in #what-are-you-playing and at Squad Night. Next milestone is 300, which we'd like to reach around GTA VI's launch on 19 November.

**C. 300 members** (#announcements, no ping)
> 300 people, in the week GTA VI came out. If you joined for Vice City: #gta6-spoilers is open, the Launch Lounge recap is in #events, and Game Club this month is GTA VI. Stick around for the rest.

**D. 400 members** (#announcements, no ping)
> 400. A hundred to go before Discord gives us Server Insights, which will tell us which channels you actually use and which we should close. The Community Awards vote is running in #polls until 14 December.

**E. 500 members** (#announcements, @everyone, the one allowed that month)
> We're 500. Thank you.
>
> What changes: Server Insights is on, so from January we'll use real numbers to decide which channels, events and rituals stay. We'll post the first changes it leads to in #announcements.
>
> What doesn't: the rules, the rhythm, the Wrap on Sunday.
>
> Next stop is 1,000, where Discord lets servers apply for Discovery. That's a 2027 goal, and it'll happen the same way this one did.

**F. External post** (X, Threads, Bluesky; one per network per week at most; invite code per network)
> Our Discord has a daily GTA 6 countdown, a WoW reset-day check, PC fix help on Fridays, and Squad Night every Thursday at 20:00 CET. Link your TechPlay account and your chat counts toward your site rank. {invite}

**G. Disboard / Discadia listing**
> TechPlay.gg's community server. Daily GTA 6 countdown, What Are You Playing on Mondays, WoW reset-day checks, PC fix help, Squad Night on Thursdays, and a monthly Game Club. The news from techplay.gg arrives on its own; everything else is people. Link your TechPlay account and your chat counts toward your site rank.

---

## 15. Capacity (hours per week, ESTIMATE)

| Role | Setup (C35, 28 Sep–12 Oct, total) | Weekly from 12 Oct | Notes |
|---|---|---|---|
| SC | 12 h | 9.5 h | §13.2; plus event nights |
| EIC | 2 h (decisions, rules) | 1 h (AMA prep monthly, Stage) | More in AMA weeks (2 h) |
| ED | 1 h | 1.5 h | F07 post, F03 in #gta6, #article-feedback, breaking pings |
| DS | 4 h (Buffy avatar, event card template, Server Guide banner) | 0.5 h | Seasonal variants optional |
| DEV | See §17 | — | About 25–35 h across the quarter |

---

## 16. Week-by-week (C35 → C36)

| Week | Dates | Focus |
|---|---|---|
| 1 | 28 Sep–4 Oct | Export channels; set env channel IDs; D-004 invites; rank clean-up; verify C09 giveaway; start F06, F02, F11 (28 Sep), F12 (30 Sep); Game Club October kickoff 1 Oct |
| 2 | 5–11 Oct | Build categories, Onboarding, Server Guide, AutoMod, #how-techplay-works; Buffy copy PR (D-011a); first Squad Night Thu 8 Oct; WoW 12.1.5 readiness |
| 3 | 12–18 Oct | Rebuild announcement + Road to 500 (12 Oct); invite codes live; Disboard/Discadia; giveaway reminder 18 Oct (if live) |
| 4 | 19–25 Oct | Next Fest Diary nightly; Demo Night Sat 24 Oct; MW4 thread; giveaway winner 21 Oct; milestone 200 |
| 5 | 26 Oct–1 Nov | Game Club discussion Tue 27 Oct; census AMA Thu 29 Oct; Halloween night; "You asked, we did" 30 Oct; Season 2 1 Nov |
| 6 | 2–8 Nov | Monthly check; WoW: Forever thread 4 Nov; recruit 2 volunteer moderators |
| 7 | 9–15 Nov | C58 paid test starts (Discord destination); GTA Q&A Stage Thu 12 Nov |
| 8 | 16–22 Nov | GTA VI launch week: countdown ends 19 Nov; Launch Lounge; #gta6-spoilers; Game Club GTA VI; Prediction League opens 18 Nov; milestone 300 |
| 9 | 23–29 Nov | Black Friday; Game Club Dec vote 25 Nov; discussion night Sun 29 Nov; community night Sat 28 Nov |
| 10 | 30 Nov–6 Dec | Cyber Monday; Community Awards nominations 1–7 Dec; Game Club Dec kickoff Thu 3 Dec |
| 11 | 7–13 Dec | Awards voting 8–14 Dec; TGA watch party 10 Dec; milestone 400 |
| 12 | 14–20 Dec | Game Club discussion Tue 15 Dec; Winter Sale thread 17 Dec; "You asked, we did" 18 Dec; community night 19 Dec; Awards reveal Sun 20 Dec |
| 13 | 21–31 Dec | Light schedule; Your 2026 in Games share thread; year-end Wrap 31 Dec with the Road to 500 result |

---

## 17. Bot improvement requests

Existing spine IDs are used where they fit. Bot items with no spine ID are proposed as sub-items of D-011 (the bot's parent item) or of the nearest existing D-ID; the backlog owner may renumber them.

| ID | Request | Why | Campaign | Priority / size |
|---|---|---|---|---|
| D-004 | Replace dead invites (`techplaygg`, `techplay`) with `wPQG9gUMXH` in `Gta6NewsletterCTA.tsx:7`, `RoadmapCTA.tsx:17` and the `discord_url` seeder default | Hub and roadmap send people to an error [R13] | C35, C36 | P0 XS (spine) |
| D-011 | Record the invite code used by each join and report per campaign | Road to 500 attribution | C36 | P1 M (spine) |
| D-011a | Welcome channel by env ID (`WELCOME_CHANNEL_ID`) instead of the exact name `new-people`; voice rewrite of welcome, rank-up, daily, tip, DM and event lines (§8.2); new welcome embed (§8.3); hosted Buffy avatar | Renames break welcomes silently; voice fix [R13] | C35 | P1 XS |
| D-011b | Inviter role at 3 retained invitees; weekly report to #invite-log | Reward top inviters with roles [R13] | C36 | P2 S (after D-011) |
| D-011c | Activity counters: weekly unique posters, joiners who post within 7 days, command usage | No command analytics today [R01 B.8.3]; Server Insights only at 500 | C36 | P2 S |
| D-011d | Daily On This Day post at 09:00 CET from `/games/on-this-day` | F06 automation (C65 "Buffy automation later") | C65 | P2 S |
| D-011e | Ritual scheduler: Monday F11 forum post, Wednesday F12 native poll from a staff-edited queue, Monday F01 post from `/calendar` | Removes about 1 h/week of SC manual work | C37, C39, C04 | P3 M |
| D-011f | Weekly Wrap upgrade: next week's releases from the calendar, new-member count, suggestions shipped, poll result; UTMs on links | F14 as specified in §8.4 | F14 | P2 S |
| D-011g | Sync Founder (C68) and Season Champion (C67) site badges to Discord roles on `/sync` | Recognition parity [R13 §6] | C68, C67 | P2 S |
| D-011h | `/remind <game>` sets a site release reminder for a linked account; release-day DM through the C43 path | "Discord `/game` and `/remind`" opportunity [R21 TOOL-40]; alerts off-site | C43 | P2 M (with D-027 for price alerts) |
| D-011i | `/guess` cover quiz from `/games/random` (games with a cover and a rating only) | Community game without manual cropping | C36 | P3 S |
| D-011j | Make the bot's word/invite filter configurable; exempt TechPlay invite codes; avoid double action with AutoMod | Two filters today | C35 | P2 S |
| D-011k | Verify that the `/admin event` multiplier is applied anywhere; if not, remove the option or wire it through `XpService` | UNVERIFIED consumer [R01 B.12 #20] | — | P3 XS |
| D-011l | Replace `CATALOGUE_SIZE = '332,000'` with the live count or drop the number | Never claim numbers that are not live [SPINE §0] | C01 | P2 XS |
| D-011m | Optional auto-thread per article in #latest-news | No thread creation today [R01 B.8.3] | C35 | P3 S |
| D-009 | Campaign URL helper applied to bot links (`utm_source=discord&utm_medium=community&utm_campaign=<campaign>`) in PollingService, RecapService, `/latest`, `/game`, DMs | Discord traffic is not attributable | C03 | P1 S (spine) |
| D-035 | Route `/daily` through `XpService` (cap, season multiplier, ledger) | Largest uncapped XP source [R01 B.2.7] | — | P2 S (spine) |
| D-041 | Bot giveaway links: `commands.ts:537` and `SubscriptionService.ts:192` build `techplay.gg/giveaways/{slug}`; the site route is `/giveaway/{slug}` | Every giveaway link from the bot 404s | C09 | P0 XS (before any giveaway promotion) |
| D-040 | "Profesor" → "Professor" in the WoW Analyzer (`page.tsx` lines 7, 200, 270; `OverviewTab.tsx` lines 52, 67); label AI tips; remove false stats | Spelling and trust [R13, R02] | C13, C14 | P0 XS (spine) |

---

## Dependencies and open questions

| Item | Owner | Needed by | Blocks |
|---|---|---|---|
| Current channel and role list export (not in research) | SC | 28 Sep | Migration map |
| Is the GTA 6 giveaway live in admin? [SPINE §0] | EIC/SC | 28 Sep | C09 Discord flow |
| D-004, D-041, D-040 shipped | DEV | 2 Oct | Any Discord, giveaway or WoW promotion |
| `RECAP_CHANNEL_ID` / `LATEST_NEWS_CHANNEL_ID` set before renames | DEV/SC | 5 Oct | Recap and news feed |
| Server time zone of the bot host: the recap cron is `0 20 * * 0` in server local time; confirm it is Europe/Sarajevo, not UTC | DEV | 4 Oct | F14 timing |
| Season dates in production (two migrations disagree) [R01 B.2.5] | DEV | 25 Oct | Season 2 announcement 1 Nov |
| D-011 invite attribution | DEV | 23 Oct | C36 reporting, Inviter role |
| Buffy avatar art (none in repo) [R13] | DS | 9 Oct | New welcome embed |
| Onboarding thresholds: R13 reports 7 default / 5 public from Discord's help centre, R07 says the Onboarding pages were blocked; confirm in Discord's settings screen | SC | 5 Oct | §5 |
| Cover images for Guess the Game: rights for covers imported into the catalogue (IGDB licence question [R10, R23]) | EIC | 10 Oct | §7.5 |
| Map data attribution before using hub locations as countdown facts (D-020) | EIC | 28 Sep | F02 content |
| Official GTA VI unlock time and The Game Awards start time | ED | 12 Nov / 1 Dec | Launch Lounge and TGA event start times |
| Volunteer moderators: who, and in which time zones | SC | 6 Nov | §12.4 |
| Discord age-verification relaunch: effect on community servers UNKNOWN [R06, R07] | SC | Ongoing | Moderation notes |
| Baseline for linked members in the guild (backend count) | DEV | 28 Sep | §10 TARGET |
