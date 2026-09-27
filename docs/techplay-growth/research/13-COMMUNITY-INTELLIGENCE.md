# 13 — Community Intelligence (including Professor Buffy)

Status: Phase 1 research draft — 27 Sep 2026
Scope: TechPlay's community surface today, what makes gaming communities work on Discord, Reddit, forums, MMO guilds and creator communities, a catalogue of rituals, moderation and recognition models, user-generated content, and the Professor Buffy brand character.

The community agent was stopped before writing. It had logged 71 sources (Discord's API and help centre, Discord's community guides, Reddit feeds, Blizzard forums, Patreon campaign data, brand guidelines). This file is written from that source log, the repository and the live audit.

## Executive summary

1. **FACT — Two of the three Discord invite links in TechPlay's code are dead.** `discord.gg/techplaygg`, hardcoded in the GTA 6 newsletter block (`Gta6NewsletterCTA.tsx:7`) and the roadmap CTA (`RoadmapCTA.tsx:17`), and `discord.gg/techplay`, the seeder default for the `discord_url` setting, both return "Unknown Invite" from Discord's API. Only `discord.gg/wPQG9gUMXH` works, and the live footer, homepage, forum and leaderboard use it. Anyone who clicked Discord from the GTA 6 hub or the roadmap landed on an error.
2. **FACT — TechPlay's server is small but set up as a Community server.** 160 members, 24 online, Community and rules screening enabled, no Onboarding, no vanity URL, landing channel "🎮┃gaming" (Discord API, 27 Sep 2026).
3. **FACT — Discord's growth tools have thresholds TechPlay has not reached.** Server Discovery needs 1,000 members, a server at least eight weeks old, activity, clean names, two-factor authentication for moderators and safety settings. Server Insights needs more than 500 members.
4. **FACT — Media Discords are small even for big brands; creator Discords are large.** PC Gamer's server has 948 members and Eurogamer's 1,775. Giant Bomb has 9,716, Kinda Funny 8,692 and Second Wind 20,859. Game servers run to millions (Minecraft 4.0M, Valorant 2.7M, Fortnite 1.9M, Helldivers 1.3M).
5. **FACT — What drives creator communities is membership, not publishing.** Second Wind has 19,449 Patreon patrons (10,605 paid) with Discord roles from $1; Digital Foundry 27,585 (3,704 paid); Kinda Funny ties Discord roles to $25 tiers (Patreon API).
6. **FACT — Communities run on rituals.** r/Games runs "What have you been playing" weekly and "Indie Sunday"; r/gaming runs "Simple Questions Sunday" and "Making Friends Monday"; r/patientgamers runs a bi-weekly general thread. Discord's own case study of a photography server describes a weekly themed contest that keeps new-member retention at 20–30%.
7. **FACT — TechPlay's site community is nearly empty in public.** 7 forum threads and 22 comments (7 Sep 2026); the live forum shows "0 Online 0 Threads 0 Replies 0 Members" before hydration, and articles show "Discussion (0)" (02).
8. **FACT — Professor Buffy is a real, voiced character in Discord and a visual one on the site.** A "wise owl" who says "Hoot hoot!", "*adjusts spectacles*" and calls members "young one". His avatar file was a 404 until the bot switched to its Discord avatar. On the site he appears in the article join panel and the homepage profile band, and as "Profesor Buffy's Tips" (misspelled) in the WoW Analyzer.
9. **RECOMMENDATION — Build community around two or three weekly rituals that the site and Discord share,** not around more channels. Fix the dead invites first.

## 1. TechPlay's current community surface (FACT)

| Surface | State | Source |
|---|---|---|
| Discord server | 160 members, 24 online; Community enabled; no Onboarding; no vanity URL | Discord API |
| Discord bot | 20 slash commands; posts every article to #latest-news; welcomes in #new-people; XP mirror; Sunday 20:00 recap; leaderboard climb announcements; DM subscriptions | 01 Part B |
| Invite links | 1 working (`wPQG9gUMXH`, used by footer and widgets); `techplaygg` dead and hardcoded on the GTA 6 hub and roadmap; `techplay` dead, seeder default only | Discord API; repo grep |
| Forum | 7 threads; solutions, polls, reactions, self-pin supported | README, 01 |
| Comments | 22; first three per member held for approval; more than one link also held | README §4 |
| Lists and tier lists | 4 lists (2 in sitemap) | README, 02 |
| Leaderboards | 6 boards; season timer | 01 |
| Friends, chat, presence | built; small network | 01 |
| Giveaways | referral codes, share tasks, daily streak, per-giveaway leaderboard; none active now | 01, 02 |
| Quests and seasons | 23 core + 4 seasonal; Season 1 "Ignition", Season 2 "Overdrive" | 01 Part B |

**Strengths:** the plumbing is unusually complete for a site this size: accounts, XP and Discord are already linked, and the bot can speak for the site.
**Gaps:** no rituals, no events, no onboarding, dead invite links, public counters that read zero, and nothing on public pages that shows a community exists.

## 2. What makes gaming communities work (evidence)

### Discord (VERIFIED from Discord help centre and community guides)

- **Setup:** rules and info channels at the top, four or five channels per category, a vanity URL pointing at the top channel.
- **Onboarding:** at least seven default channels, five open to everyone; customisation questions assign roles and channels; remove bot-verification gates. The Server Guide (welcome sign, three to five to-dos) replaces the old Welcome Screen.
- **Events:** Scheduled Events notify "Interested" members; voice events cap at 99 participants; unstarted events are removed after an hour. Stage formats include AMAs, roundtables, town halls, live shows, weekly 15-minute chats.
- **Forum channels:** tags (can be required), post guidelines, list or gallery view.
- **Native polls:** up to 10 answers, one hour to one week.
- **Moderation:** AutoMod keyword presets; escalation ladder Time Out → Kick → Ban; bots support moderators rather than replacing them.
- **Growth:** permanent invite links, reward top inviters with roles, and "events as the reason to join".
- **Benchmarks (Discord's own guide):** about 30% of members communicating is healthy; aim for 50% of members visiting and 50% of visitors talking. A 1–2% rise in participation is progress and 3–5% is the gold standard. Community-run events draw 30–50 people, moderator-run events 200–300.
- **Case studies:** Rocket League Germany (28,000 members, 15 moderators, a suggestions channel); a photography server whose weekly themed contest, voted by members and rewarded with points and roles, plus an introductions channel, keeps new-member retention at 20–30%.

### Reddit (FACT, subreddit feeds)

- Weekly and bi-weekly megathreads carry the recurring conversation: "What have you been playing" (r/Games), "Simple Questions Sunday", "Making Friends Monday" (r/gaming), a general backlog-and-recommendations thread (r/patientgamers), a Monday megathread for newcomers (r/IndieDev).
- No "Screenshot Saturday" thread was visible in r/gamedev's feed this week.

### Forums and MMO guilds (FACT, Blizzard forums)

- WoW forum guidelines: flag rather than reply to bad posts; moderators do not pre-screen; use Like instead of "+1".
- Guild recruitment posts follow a strict format: faction and realm, progression (e.g. 8/8 Heroic, 2/8 Mythic, AOTC, CE), raid nights and times, roles needed. This is structured data TechPlay's WoW Analyzer already understands.

### Creator communities (FACT, Patreon API)

- Second Wind: 19,449 patrons (10,605 paid), tiers $1–$50, Discord roles from $1, premium channels from $3, monthly art print and private hangout.
- Digital Foundry: 27,585 patrons (3,704 paid), $5/$10/$15 tiers with early access and weekly question submission.
- Kinda Funny: tiers $10–$1,000, monthly call-in show, Discord role from $25.

### Community-voted events (FACT)

- The Steam Awards: nominations during the autumn sale, voting during the winter sale; about 15 million nominations in 2016; community-invented categories.
- Helldivers 2 "Major Orders": collective missions that move the game's story.

## 3. Rituals catalogue (27)

Required feature: **E** exists, **P** partial, **M** missing.

| # | Ritual | Cadence | Where | Feature | Why it works elsewhere | TechPlay fit | Moderation load |
|---|---|---|---|---|---|---|---|
| 1 | What are you playing this week? | Weekly (Mon) | Both | E (forum, Discord) | r/Games weekly thread; Hookshot weekend thread | High; link to shelves | Low |
| 2 | Monthly game club | Monthly | Both | E | GR+ RPG Club; HLTB Game of the Month | High | Low |
| 3 | Weekly poll | Weekly | Both | E (forum polls, Discord polls) | Nintendo Life polls with thousands of votes | High | Low |
| 4 | Release-day thread | Per big release | Both | P | r/Games launch megathreads (OBSERVATION) | High | Med |
| 5 | Showcase watch party with live thread | Per showcase | Discord | E (events) | Stage events guide | High (State of Play, Directs, TGA) | Med |
| 6 | The Game Awards prediction league | Yearly (10 Dec) | Both | M (scoring) | Polygon predictions; Steam Awards voting | High | Low |
| 7 | TechPlay community awards | Yearly | Both | P (polls) | The Steam Awards | High | Med |
| 8 | Screenshot of the week | Weekly | Discord | E (forum channel, gallery view) | Photography server case study | Med | Med |
| 9 | Clip of the month with prize | Monthly | Both | P (giveaways) | GR+ Replay ($250 vouchers) | Med | Med |
| 10 | Backlog Sunday (pick one game to finish) | Weekly | Both | E (shelves) | r/patientgamers culture | High; ties to Backlog Advisor | Low |
| 11 | Member spotlight | Weekly | Both | P (profiles) | Discord recognition advice | Med | Low |
| 12 | Leaderboard "rising" post | Weekly | Discord | E (bot computes overtakes) | Bot already announces climbs | Med | Low |
| 13 | Season launch and finale | Bi-monthly | Both | E (seasons) | Live-service seasons | High | Low |
| 14 | Community challenge (collective goal) | Monthly | Both | P (quests) | Helldivers Major Orders | Med | Low |
| 15 | Squad-up night (free-to-play game) | Weekly | Discord | E (voice, events) | Discord LFG patterns | Med | Med |
| 16 | Jackbox or Activity night | Monthly | Discord | E (Activities) | Jackbox via screen share | Med | Low |
| 17 | AMA with a developer | Occasional | Discord (Stage) | E | Stage guide; Reddit AMAs | High for indies | Med |
| 18 | Price-drop and deals thread | Per sale | Both | P (prices) | r/GameDeals culture | Med | Med |
| 19 | Next Fest demo diary | Twice yearly | Both | E | Steam Next Fest | High | Low |
| 20 | Nostalgia "on this day" | Daily | Discord | E (module) | r/CallOfDuty nostalgia threads (06) | High | Low |
| 21 | Tier list of the month | Monthly | Site | E (tier lists) | Tier-list content everywhere | High | Low |
| 22 | WoW weekly reset check-in | Weekly | Discord | P (Analyzer) | WoW community rhythms | High (niche) | Low |
| 23 | GTA 6 countdown ritual | Weekly to 19 Nov | Both | E (hub) | r/GTA6 activity | High | Med |
| 24 | Introductions channel | Always | Discord | E | Photography server case study | High | Low |
| 25 | Suggestions channel with visible outcomes | Always | Discord | E | Rocket League Germany | High (roadmap page exists) | Med |
| 26 | Year-in-review share week | Yearly (Dec) | Both | P (data) | Steam Replay, Letterboxd | High | Low |
| 27 | Game-night recap post | After events | Both | E | Discord event metrics guide | Med | Low |

## 4. Moderation and trust

- **FACT — TechPlay holds a member's first three comments for approval,** and any comment with more than one link (README §4).
- **FACT — Discourse's trust levels** move members from Basic to Member, Regular and Leader based on reading and participation over time; Regulars can lose status; small communities start new users at a higher level during a bootstrap phase ("first 50 users").
- **RECOMMENDATION:** map TechPlay's existing ranks to trust. After three approved comments, lift the hold (already implemented). At a higher rank, allow links and forum pinning suggestions. Celebrate promotions in Discord, as Discourse advises.
- **RECOMMENDATION:** use Discord AutoMod presets and a Time Out → Kick → Ban ladder written into the rules channel; keep human moderators for events.

## 5. User-generated content

- **Game reviews by members** exist (XP 10 + Bounty 15) but are few. Hookshot shows ratings stay thin even at scale (04). Prompt reviews at the moment a member marks a game "completed", not with banners.
- **Lists and tier lists** are the most shareable UGC TechPlay already supports (share button and OG image). Seed them with monthly prompts (ritual 21).
- **Screenshots and clips** need a gallery surface (Discord forum channel in gallery view) before a site feature.
- **Guild recruitment posts** could reuse WoW Analyzer data (progression and item level) for a structured "recruiting" format.

## 6. Recognition systems

- Existing: 67 achievements, 20 ranks, seasons with a champion badge, leaderboards, recognitions (four types), supporter tiers (unlaunched).
- Evidence: Eurogamer's pink "supporter" label in comments; PC Gamer's badges; Discord roles for top inviters; Patreon-gated roles.
- Recommendation: show rank badges next to names in comments and forum posts, and mirror them as Discord roles (the bot already mirrors XP).

## 7. Professor Buffy

### What exists (FACT)

- **Identity:** "Professor Buffy - TechPlay's wise owl mascot" (`discord/src/services/BuffyService.ts`). Footer on every embed: "🦉 Professor Buffy | TechPlay Community".
- **Voice samples:** welcome lines "Hoot hoot! 🦉 A new adventurer has joined our ranks!", "*adjusts spectacles* Ah, a new student! Excellent!", "The prophecy spoke of your arrival... Welcome, young one!"; level-up lines "Even in my centuries of wisdom, your progress amazes me!"; leaderboard "⚔️ *Professor Buffy announces:* … The competition heats up! 🔥".
- **Roles in Discord today:** welcome embed with getting-started steps (`/link`, `/profile`, XP, `/leaderboard`), rank-up and achievement embeds, leaderboard climb announcements, news and giveaway notification embeds, status rotation.
- **Visual assets:** no Buffy art in the bot; its avatar pointed to `techplay.gg/images/buffy-avatar.png`, which returned 404, so embeds went out without a thumbnail until the bot switched to its own Discord avatar. On the site: `buffy-controller.webp` in the article join panel and `profile-cta-buffy.webp` in the homepage band.
- **Other uses:** WoW Analyzer shows "Profesor Buffy's Tips" (spelled with one "s"), generated by the Groq model; settings copy says "Professor Buffy can see you in our server and mirror your XP."
- **Stale detail:** the bot's catalogue size constant is "332,000" (last checked 29 Aug 2026).

### How brands use mascots without becoming childish (FACT from brand pages)

| Brand | Mascot | What it does | Lesson |
|---|---|---|---|
| Reddit | Snoo | "Genderless mascot and community ambassador"; subreddits make themed Snoos | Let the community remix the character |
| GitHub | Mona the Octocat | 162 numbered variants in the Octodex | A consistent silhouette with many costumes (events, seasons) |
| Mailchimp | Freddie | Always paired with the company name, always winking; voice guide says "subtle over noisy, wry over farcical" | Restraint is what keeps it adult |
| Discord | Wumpus and Clyde | Wumpus is the mascot (stickers); Clyde is the trademarked logo character | Separate the logo from the character |
| Duolingo | Duo the owl | Passive-aggressive notification memes; April Fools push | Works for Duolingo; also shows how a mascot becomes a nag |

### Possible roles (RECOMMENDATION)

| Place | Role | Guardrail |
|---|---|---|
| Discord | Host of rituals (weekly thread, polls, game club, recaps) | Buffy announces; humans moderate |
| Onboarding | Three-step "link a platform, add five games, join Discord" guide | One line per step, no jokes in instructions |
| Notifications | Signs release-day and price alerts ("Your game is out.") | Plain first line; character only in the sign-off |
| Achievements | Presents badges and season results | Short, one line |
| Tips | Contextual help on tools (WoW Analyzer, Backlog Advisor) | Fix the spelling; label AI-generated tips as such |
| Social | Signature on weekly data cards and on-this-day posts | Character as a small corner mark, not the post |
| Newsletter | Sign-off line | One sentence |
| Error pages | 404 and maintenance | A single dry line |

### Voice sheet skeleton (RECOMMENDATION)

- **Is:** knowledgeable, dry, warm, brief; a senior guild member rather than a cartoon teacher.
- **Is not:** "centuries of wisdom", prophecies, "young one", exclamation stacks.
- **Rules:** instructions in plain words; one owl joke at most per message; never guilt users about streaks or absence; never speak on moderation decisions; never claim numbers that are not live (catalogue size, member counts).
- **Visual:** one silhouette, seasonal variants (Octocat model), a proper avatar asset hosted at a working URL.

## Sources used

Discord API invite lookups for TechPlay's three invite codes and for Helldivers, Path of Exile, Warframe, Larian, Giant Bomb, Kinda Funny, Second Wind, PC Gamer, Eurogamer, Minecraft, Valorant and Fortnite servers; Discord help centre (Community Server, Server Discovery, Discovery Guidelines, Community Guidelines, Onboarding FAQ, Server Guide FAQ, Scheduled Events, Forum Channels, AutoMod, Polls, LFG Channels, Guilds, Apps, Server Insights, Server Setup Guide, Advanced Community Server Setup); Discord community guides (server rules, member referrals, server insights, stages, channel names, safety, moderation automation, Rocket League Germany and photography case studies, event metrics); Discord branding; Wikipedia (Discord, Letterboxd, Helldivers 2, Duolingo, GitHub, Reddit, Giant Bomb, The Steam Awards, The Game Awards); Discourse trust levels blog; Reddit RSS for r/patientgamers, r/Games, r/gaming, r/IndieDev, r/gamedev; Blizzard WoW forum guidelines, categories and recruitment feeds; Patreon help and campaign API for Kinda Funny, Second Wind and Digital Foundry; Reddit brand page; GitHub Octodex; Mailchimp voice-and-tone guide and design page; Jackbox how-to-play; Digital Foundry homepage; techplay.gg. Full URLs in `research-sources.csv`.

## Gaps / needs more data

- Message volume and active-member counts inside TechPlay's Discord are unknown (Server Insights needs 500+ members).
- ResetEra and NeoGAF rules were blocked.
- Whether the bot's DM subscription feature has any users is unknown.
- Buffy's visual design is not in the repository; the planning phase needs the actual artwork.
