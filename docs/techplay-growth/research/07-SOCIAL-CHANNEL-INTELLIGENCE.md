# 07 — Social and Distribution Channel Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: every channel the brief names (Parts 7 and 8), with a role and a priority class for TechPlay. Machine-readable version: `social-channel-matrix.csv`.

**How to read the evidence.** Two research agents were assigned to this file and were stopped before writing. It was assembled from the platform documentation they had already fetched, from the live audit of TechPlay's own accounts (02), and from competitor pages (04). Each claim is labelled. Statements about how a platform ranks content are marked VERIFIED only where a platform's own documentation or code was fetched on 27 Sep 2026. Everything else about algorithms is marked UNVERIFIED and should be checked before it shapes a plan. No follower counts are given unless they were visible on a fetched page.

## Executive summary

1. **FACT — TechPlay's owned social footprint is close to zero, except Discord.** Discord has 160 members with 24 online. YouTube has 20 subscribers, joined 9 Feb 2026, with no videos found. An X account `@TechPlayGG` exists but is not linked from the site's footer. Facebook and Instagram pages sit behind login walls. No TikTok, Bluesky or LinkedIn presence was found (02, 27 Sep 2026).
2. **FACT — Google Discover is the channel whose rules were just rewritten.** Google's February 2026 Discover core update (5 Feb 2026) says it shows more locally relevant content, reduces sensational content and clickbait, and favours "in-depth, original, and timely content from websites with expertise in a given area", judged "on a topic-by-topic basis". A site with shallow coverage across many topics is the pattern that loses.
3. **FACT — Google Discover supports a "Follow" feature driven by the site's RSS or Atom feed**, which site owners link in `<head>`. TechPlay publishes `/rss` and `/feed`, but the live audit found hardware items link to a 404 path and the feed lagged about 24 hours.
4. **FACT — Google News inclusion is automatic, not by application.** Publisher Center help says results "come from eligible content we find across the web and automatically identify as news-related." A news sitemap may list only articles from the last two days and up to 1,000 entries. TechPlay has both pieces of plumbing and still earns no News visibility (03).
5. **FACT — X's ranking code is public and scores predicted actions, including negative ones.** The open-source For You feed predicts likes, replies, reposts, clicks (including link clicks), dwell time and negative actions (not interested, mute, block, report), then combines them with weights. The README warns that weights scale the viewer's own predicted probabilities, not raw counts.
6. **FACT — Reddit's sitewide rules require authentic participation.** "Participate authentically in communities where you have a personal interest, and do not spam." Reddit offers a free Reddit Pro business tool. Individual subreddit self-promotion rules could not be fetched (blocked) and are UNVERIFIED here.
7. **FACT — Web push has structural limits.** Chrome automatically enrols sites with very low notification acceptance into a quieter prompt (Chromium blog, 2020). On iPhone and iPad, web push works only for web apps added to the Home Screen (WebKit, iOS 16.4). TechPlay has no service worker today (01).
8. **RECOMMENDATION (for the planning phase) — Four primary channels: Google Discover and News, Discord, email, and one short-video platform to be chosen by test.** Everything else is secondary, experimental or not worth current resources, with reasons below.

## 1. TechPlay's current channel inventory (FACT, 02)

| Channel | Account | Size seen | Linked from site? | Activity |
|---|---|---|---|---|
| Discord | invite in footer and widgets | 160 members, 24 online | yes (two different invite codes in code) | bot posts every article; Sunday recap |
| YouTube | channel exists | 20 subscribers | yes | no videos found |
| X | @TechPlayGG | UNVERIFIED | no | UNVERIFIED |
| Facebook | page exists | login wall | yes | UNVERIFIED |
| Instagram | account exists | login wall | yes | UNVERIFIED |
| TikTok, Bluesky, Threads, LinkedIn, Twitch | not found | — | — | — |
| RSS | `/rss`, `/feed` | — | yes | hardware links broken; ~24 h lag |
| Email | newsletter desk | subscriber count UNKNOWN | three capture points | manual campaigns only |
| Web push | none | — | — | not built |

## 2. Classification

| Channel | Class | Why (evidence) |
|---|---|---|
| Google Discover | **PRIMARY** | Largest free distribution for news and features; the Feb 2026 update rewards topic expertise, which TechPlay can build in narrow areas (WoW, PC fixes, platform questions). Measurement needs Search Console. |
| Google Search (evergreen) | **PRIMARY** | See 03 and 09. |
| Google News / Top Stories | **SECONDARY now, PRIMARY later** | Automatic inclusion; zero visibility today (03). Earns its place only once original reporting exists. |
| Discord | **PRIMARY** | Only owned channel with a live community (160 members) and a bot already wired to site accounts, XP and articles. |
| Email newsletter | **PRIMARY** | Owned, unaffected by algorithms; system built but unused (20). |
| YouTube (Shorts + long form) | **EXPERIMENTAL → candidate PRIMARY** | Gaming's largest video platform; TechPlay has 20 subscribers and no videos. Test a repeatable format before committing (19). |
| TikTok | **EXPERIMENTAL** | Large gaming audience; no presence; production cost and on-camera question unresolved (19). |
| Instagram (Reels, carousels) | **EXPERIMENTAL** | Carousels suit data cards and lists; account exists. |
| Facebook (Page, Reels) | **LOW PRIORITY** | Account exists; gaming publishers post there but link reach is widely reported as weak (UNVERIFIED, not re-checked). |
| Facebook Groups | **EXPERIMENTAL** (participation only) | Game-specific groups exist; self-promotion rules vary per group (not fetched). |
| X | **SECONDARY** | Breaking-news and journalist network; open-source ranking favours predicted replies and dwell; account exists but unlinked. |
| Threads | **LOW PRIORITY** | Cross-post from Instagram if cheap; no gaming-publisher evidence gathered. |
| Bluesky | **LOW PRIORITY** | Eurogamer and IsThereAnyDeal list Bluesky; audience size not measured. |
| Reddit | **SECONDARY** (contribution, not promotion) | Largest gaming discussion surface; sitewide rule demands authentic participation; original data and tools are the accepted currency. |
| Steam Community (Curator) | **EXPERIMENTAL** | A curator page puts TechPlay recommendations inside Steam store pages; fits the database and reviews. |
| Twitch | **NOT WORTH CURRENT RESOURCES** | Requires live on-camera hosts and schedule; IGN runs a channel but TechPlay has no presenters. |
| LinkedIn | **LOW PRIORITY** (B2B only) | For publisher and PR relationships, not gamers. |
| Pinterest | **NOT WORTH CURRENT RESOURCES** | No gaming-publisher precedent found; the trends page fetched returned no gaming content. |
| Snapchat | **NOT WORTH CURRENT RESOURCES** | Publisher programme access not realistic; creator monetisation needs scale. |
| Mastodon / Fediverse | **LOW PRIORITY** | Gaming instances exist (gamedev.place); cost of a presence is low if automated from RSS. |
| Web push | **EXPERIMENTAL** (release reminders only) | Useful for "your game is out today"; low value as a news blast; Chrome quiet UI punishes low opt-in. |
| RSS | **SECONDARY** (infrastructure) | Feeds Discover Follow, Feedly, Inoreader, Flipboard and Discord bots; must be fixed first. |
| Bing / Microsoft Start (MSN) | **LOW PRIORITY** | IndexNow already implemented; MSN partner pages returned server errors; syndication access UNKNOWN. |
| Apple News | **NOT WORTH CURRENT RESOURCES** | Requires Apple News Format or RSS via News Publisher; audience skew and approval uncertain for a non-US/UK small publisher. |
| Flipboard | **LOW PRIORITY** | RSS-fed; federates to the Fediverse; near-zero cost once RSS works. |
| SmartNews, NewsBreak, Opera News, Upday | **NOT WORTH CURRENT RESOURCES** | Local/general news aggregators; pages blocked or irrelevant to gaming. |

## 3. Platform notes

### 3.1 Google Discover (VERIFIED from Google documentation)

- **Images:** at least 1200 px wide, more than 300,000 total pixels, 16:9 recommended; enabled by `max-image-preview:large`. TechPlay sets this tag on every sampled page (03).
- **Titles:** avoid "misleading or exaggerated details in preview content (title, snippets, or images)" and avoid "withholding crucial information".
- **Content:** "timely for current interests, tells a story well, or provides unique insights."
- **February 2026 core update:** local relevance by country, less clickbait, more original and in-depth content from sites with topic expertise, judged per topic.
- **Follow:** users can follow a site through its RSS/Atom feed linked in `<head>`.
- **Industry signal (UNVERIFIED detail):** Search Engine Roundtable reported this week that Google is testing a Discover "Dive deeper" feature that "takes traffic away from publishers", and that the September 2026 spam update (the fourth of the year) is rolling out.
- **TechPlay implication (HYPOTHESIS):** the update's "topic-by-topic" expertise favours a site that goes deep on a few topics. TechPlay's WoW tools, platform-availability data and PC-fix coverage are candidates. Generic rewrites of IGN stories are the pattern Discover now demotes.

### 3.2 Google News (VERIFIED)

- Inclusion is automatic for content identified as news; there is no application.
- News sitemap: articles from the last two days only, up to 1,000 entries, with publication name, language, date and title.
- TechPlay's robots.txt has a Googlebot-News group and a news sitemap exists (03).
- **UNKNOWN:** whether Google treats TechPlay as a news publisher at all. Its `site:` feed in Google News is dominated by game-database pages (03).

### 3.3 Discord (partly VERIFIED)

- **FACT — TechPlay's server has 160 members and the bot** posts every article, welcomes joiners, mirrors XP, posts a weekly recap and runs 20 slash commands (01 Part B).
- **FACT — Discord's own programmes:** "Become Discord Official" verifies game studios' official servers; Quests are a paid, opt-in reward-based ad product for brands and game publishers, and Orbs launched globally on 14 Jul 2025 with a pilot that drove a 16× increase in first-time Shop purchasers. Neither is a tool for a community like TechPlay's.
- **FACT — Discord's community-building guides were fetched** (member referrals, server insights, event metrics, rules, moderation automation, channel naming). Discovery, Onboarding, Events and Forum documentation pages returned a Cloudflare challenge; their requirements are UNVERIFIED this session.
- **FACT — Discord's age verification** was re-launched after privacy backlash this month (GameSpot, GamesIndustry.biz, RPS, 21–27 Sep 2026). Impact on community servers is UNKNOWN.
- **Role:** the retention and community core, and the place where the site's XP, quests and giveaways become visible (13).

### 3.4 Email (see 20)

- **FACT:** the newsletter desk exists; no automated mail is sent; capture points are few (01).
- **Role:** the owned return channel. Personalised "your releases this week" from shelves and wishlists is the product-led version (20).

### 3.5 YouTube, TikTok, Instagram and Facebook video

- **FACT:** TechPlay has a YouTube channel with 20 subscribers and no videos found; no TikTok.
- **FACT (competitors):** Hookshot's Nintendo Life shows 852k YouTube subscribers on its own page; GamingBolt runs a large YouTube operation; IGN streams on Twitch.
- **UNVERIFIED this session:** YouTube Shorts length and monetisation rules, TikTok's ranking documentation, Instagram's statements on Reels and link handling, Facebook's link-post reach. The social agent was stopped before fetching them. The planning session should read YouTube Help, TikTok's "How TikTok recommends content" and Instagram's creator guidance directly.
- **Role:** one short-video platform, chosen by a four-to-six-week test of the pipelines in 19.

### 3.6 X (VERIFIED from X's published ranking code)

- The For You feed blends followed and out-of-network posts and ranks them with a model ("Phoenix") that predicts the probability of each action: favourite, reply, repost, quote, share, clicks on post, profile, link or media, dwell and active time, and negative actions (not interested, mute, block, report, not dwelled). Final score is the weighted sum.
- A separate system labels accounts from how others respond to them, including blocks and reports relative to favourites.
- **Implication (HYPOTHESIS):** posts that invite replies and hold attention score well; posts that people mute or report hurt the account. A link post is not penalised by rule in this code; what matters is predicted engagement. Whether other link handling exists outside this repository is UNKNOWN.
- **Role:** fast news reactions, following developers and journalists, and live-event coverage (showcases, The Game Awards).

### 3.7 Reddit (partly VERIFIED)

- **VERIFIED:** sitewide rule: participate authentically, do not spam or manipulate. Reddit Pro is a free business tool for finding and joining conversations.
- **UNVERIFIED:** per-subreddit self-promotion ratios and news-source rules (the rules pages returned blocked responses).
- **FACT (trend data, 06):** top posts in gaming subreddits are overwhelmingly art, cosplay, screenshots, nostalgia and complaints; link posts from publishers are rare in the top of the week.
- **Role:** contribution with original data (for example Steam rank movements, release congestion) and useful tools, posted by a real person with history in the community. Never a link-drop channel.

### 3.8 Steam Community

- **FACT:** Steam Curators exist, and users must sign in to follow them and see their recommendations. Steam's content rules page was fetched but returned little text.
- **HYPOTHESIS:** a TechPlay curator page with its reviews and "hidden gems" from the database puts a recommendation and link on Steam store pages that players already visit. Low cost; follower growth is slow for small curators (UNVERIFIED).

### 3.9 Web push (VERIFIED limits)

- Chrome's quieter permission UI applies automatically to users who usually block prompts and to sites with very low acceptance.
- iOS and iPadOS support web push only for Home Screen web apps.
- Vendors such as OneSignal recommend a soft "slidedown" prompt before the native browser prompt.
- **Role:** opt-in release reminders and followed-game alerts only, asked at the moment a user taps "remind me". Not a site-wide prompt.

### 3.10 RSS, Flipboard, Feedly, Inoreader

- **FACT:** Discover Follow reads RSS; Flipboard ingests RSS and federates to the Fediverse; Feedly and Inoreader are the main RSS readers.
- **FACT (02):** TechPlay's feed has broken hardware links and lags publishing. Fixing it is a prerequisite for every RSS-fed channel, including the Discord bot's own feed consumers.

### 3.11 Bing, IndexNow, Microsoft Start

- **FACT:** TechPlay pings IndexNow on publish (docs/README.md). Bing and Yandex both document IndexNow support.
- **FACT:** MSN partner pages returned server errors to the fetcher; how a small publisher joins MSN syndication is UNKNOWN.

### 3.12 LinkedIn, Pinterest, Snapchat, Mastodon, Twitch

- **LinkedIn:** help pages about newsletters returned 404. Role is B2B only: publisher PR contacts, partnerships, the media kit (`/marketing`).
- **Pinterest:** the business and trends pages were fetched; no gaming-publisher use case was found. Not recommended.
- **Snapchat:** business and creator pages fetched; no realistic publisher route for TechPlay.
- **Mastodon:** gaming-related servers exist (gamedev.place fetched). An RSS-driven account costs almost nothing but reaches few gamers.
- **Twitch:** the Partner programme targets committed streamers; IGN has a channel. TechPlay has no hosts; not worth current resources.

## 4. How gaming publishers use these channels (from 04)

- **Discord:** Insider Gaming, Eurogamer, RPS and SteamDB link a Discord; none of the nine group-B publishers had a Discord link on their homepage.
- **YouTube:** the large brands (IGN, GameSpot, Polygon, Eurogamer, Nintendo Life) run large channels; GamingBolt runs its own "GamingBoltLive".
- **Newsletters:** nearly all run one; Future's is generic, GamesRadar+ weekly, Wccftech a daily digest.
- **Push:** no push-vendor or service-worker code was found in the homepage HTML of 15 publishers checked (Part A except GameSpot, and all of Part B). Part C was not checked.
- **Google preferred source:** IGN and Valnet sites prompt readers to "Add us on Google".

## 5. Common mistakes to avoid (grounded)

- Link-dropping into Reddit communities (Reddit sitewide rules).
- Clickbait headlines for Discover (Google Discover documentation; Feb 2026 update).
- A site-wide push prompt on first visit (Chrome quiet UI).
- Opening accounts that go silent (TechPlay's YouTube channel today).
- Inconsistent brand links: two different Discord invite codes are hardcoded (01).

## Sources used

Fetched 27 Sep 2026: Google Search Central "Get on Discover"; Google Search Central Blog "Google's February 2026 Discover Core Update" (5 Feb 2026); Publisher Center Help "News content across Google"; Google "Create a News Sitemap"; Search Engine Roundtable on the September 2026 spam update and Discover "Dive deeper" test; Chromium Blog "Introducing quieter permission UI for notifications"; WebKit "Web Push for Web Apps on iOS and iPadOS"; OneSignal web permission prompts documentation; X's open-source For You algorithm repository (README and `param.rs`, fetched 27 Sep 2026; exact URL not logged); Reddit Rules; Reddit Pro; Discord Communities, Become Discord Official, Orbs launch press release, Quests page, community guides; Steam Curators; Bing IndexNow; Yandex IndexNow; Apple News Publisher user guide; Flipboard about and Fediverse pages; Mastodon servers; Pinterest business and newsroom; Snapchat business and creators; Twitch Partner programme; IGN Twitch channel. Full URLs in `research-sources.csv`.

## Gaps / needs more data

- Current documentation for YouTube, TikTok, Instagram, Facebook and Threads ranking and link handling was not fetched.
- Subreddit-level self-promotion rules were blocked.
- Discord Discovery and Onboarding requirements were blocked by a Cloudflare challenge.
- Follower counts for TechPlay's X, Facebook and Instagram accounts are unknown.
- No engagement data exists for any TechPlay social account.
