# Research Complete — Phase 1

Status: Phase 1 research closed — 27 Sep 2026
This is the summary for the session that will write TechPlay's marketing strategy. Labels follow the rest of the folder (FACT, OBSERVATION, ESTIMATE, HYPOTHESIS, RECOMMENDATION). Numbers in parentheses point to the research file with the evidence.

**Scope note.** The research phase was stopped by the user before most research agents had written up. Files were then assembled from the pages already fetched, without further searching. The weakest areas as a result are platform algorithm documentation for YouTube, TikTok and Instagram (07, 19), newsletter benchmarks (20) and Twitch and TikTok trend data (06). They are listed under "areas requiring more data".

## 25 most important discoveries

1. **FACT —** Google search traffic collapsed to 1–2 clicks a day after a Cloudflare block of Googlebot from 17 Aug 2026 and had not recovered by 7 Sep (03).
2. **FACT —** TechPlay appeared in none of 114 Bing results pages and none of 751 Google News results for its own recent stories (03, 17).
3. **FACT —** 99.8% of indexable URLs are game, studio and series pages; only 0.7% of game pages carry anything TechPlay wrote (03).
4. **FACT —** Google's February 2026 Discover core update favours original, in-depth content from sites with expertise judged topic by topic, and less clickbait (07).
5. **FACT —** The site makes false public claims: "15K+ members" (60 exist), "50K+ games" (333k exist), XP for reading articles (none), "thousands of fans", "50K+ players analyzed" (02, 11).
6. **FACT —** Two Discord invite links in the code are dead, including the GTA 6 hub's (13).
7. **FACT —** Breadcrumb category links on every article and hardware links in the RSS feed return 404 (02).
8. **FACT —** GTA 6 news is attached to a 2019 parody game's page, and the GTA 6 hub renders almost no crawlable text (17).
9. **FACT —** TechPlay has 305 API endpoints and a complete gamification economy that almost no one uses: of 55 members, 3 added a game and 2 linked a platform (01).
10. **FACT —** 20 of 22 notification types, including release reminders and the weekly digest, never leave the on-site bell; no automated email exists (01, 12).
11. **FACT —** No ad pixel is installed, UTM parameters are dropped by the first-party collector, and returning visitors cannot be identified; acquisition cannot be measured today (16).
12. **FACT —** Steam is a connect method, not a sign-in method, although Steam's OpenID allows sign-in (11).
13. **FACT —** Free import from Steam, PlayStation, Xbox, GOG and Epic is rare: Backloggd has none, HowLongToBeat imports Steam only, and paid trackers charge $3–9 a month for it (04, 10).
14. **FACT —** Gaming media is contracting: IGN, GameSpot and Eurogamer cut staff in 2026; Future's profit fell 67% with Google traffic down about 20%; Polygon was sold to Valnet (04).
15. **FACT —** Valnet sites publish guides at industrial scale (73 guides for one game in three days); competing on volume is not viable (04).
16. **FACT —** Hookshot's per-platform database model is the closest competitor to TechPlay, and its community shows up in polls (thousands of votes) far more than in ratings (0–1 per new game) (04).
17. **FACT —** GTA VI launches 19 Nov 2026 on PS5 and Xbox Series X|S at $79.99, single-player at launch, no PC at launch; fan domains own nearly all GTA 6 search results (05, 17).
18. **FACT —** The Q4 calendar is fixed and public: Steam Autumn Sale 1–8 Oct, Next Fest 19–26 Oct, MW4 23 Oct, WoW: Forever 4 Nov, Black Friday 27 Nov, The Game Awards 10 Dec, Winter Sale 17 Dec–4 Jan (05).
19. **FACT —** This week's dominant stories are Xbox's restructuring and layoffs, Sony's plans to end PlayStation discs, and generative-AI disputes (06).
20. **FACT —** TechPlay's reviews run 2,100–2,900 words but arrive 16–21 days after launch, and stopped in July; three of four guides target Genshin Impact, where wikis dominate (08).
21. **FACT —** Discord Discovery requires 1,000 members and Server Insights 500; TechPlay has 160 (13).
22. **FACT —** Media outlets' own Discords are small (PC Gamer 948, Eurogamer 1,775); creator-owned outlets are large (Second Wind 20,859 members and 19,449 patrons) (13).
23. **FACT —** IGDB's API documentation describes the API as free for non-commercial use; TechPlay's catalogue came from a one-off IGDB import and the site is ad-supported (10).
24. **FACT —** TechPlay is not listed on Metacritic and no OpenCritic listing was found; OpenCritic weighs a demonstrated commitment to reviewing (15).
25. **FACT —** Chrome demotes sites with low push acceptance to a quieter prompt, and iOS allows web push only for Home Screen apps (07).

## 25 biggest opportunities

1. Fix the false claims, dead links and broken paths in `23-CRITICAL-FINDINGS.md` section A (RECOMMENDATION; 02, 13, 17).
2. Decide the indexable set: noindex game pages with nothing original until enriched (03).
3. Deliver existing loops outside the site: release-day and price alerts by email and Discord DM (12).
4. "Your releases this week" personalised email from shelves and wishlists (20).
5. Steam sign-in plus library import as the first step of registration (11).
6. GTA 6 release-time tool with reminder, before 19 Nov (17).
7. GTA 6 "confirmed vs rumoured" ledger and vehicle real-world view (17).
8. WoW / MMO hub around the WoW Analyzer, re-aimed per patch (18).
9. Steam / PC platform hub: Next Fest tracker, sale picks from wishlists, most-played movers (18).
10. Switch 2 platform hub: editions, upgrades, key cards, performance (18).
11. Shareable cards: Gamer DNA, library worth, year in review across five platforms (10).
12. Public, logged-out versions of Backlog Advisor and a Steam library calculator (10).
13. "Where to play", release date, file size and requirements templates on the top few hundred game pages (09).
14. PC troubleshooting hub where page one has no gaming outlet (09).
15. Series-order pages for 2027 launches (FF7 Revelation, Persona 4 Revival, Kingdom Hearts IV, Fable) (09, 18).
16. Data stories from TechPlay's own data: release congestion, studio closures, Balkan game-dev census (14).
17. Weekly rituals shared by site and Discord: what are you playing, poll, monthly club (13).
18. The Game Awards prediction league for 10 Dec (13).
19. Discord Onboarding, Server Guide and one weekly event to reach 500, then 1,000 members (13).
20. One short-video format ("games out this week") on one platform for six weeks (19).
21. Newsletter capture on the homepage, after articles and on game pages (20).
22. An ownership, funding and AI-use page and an honest press page (15).
23. Restart reviews with a new format (launch verdict or "30 days later") and seek OpenCritic listing (08, 15).
24. Review-code access through Steam Curator Connect and Keymailer (15).
25. Measurement first: key GA4 events, UTM capture, and a small branded-search and US Meta registration test only after that (16).

## 10 biggest threats

1. Search may not recover without shrinking the thin indexable set (03).
2. Google's scaled-content and spam policies applied to 295k thin pages (03, 08).
3. Discover volatility after the February 2026 update and a September 2026 spam update (07).
4. AI features in Search absorbing simple answers (release times, definitions) (08).
5. False public numbers discovered by a journalist, partner or regulator (02, 11).
6. IGDB licence terms for the imported catalogue (10).
7. Deliverability damage from self-hosted sending if volume grows too fast (20).
8. GTA 6 saturation by IGN, Game Rant, Dexerto and dozens of fan domains (17).
9. Two-person editorial capacity spread across news, reviews, guides, hubs and social (02, 08).
10. Ad policy conflicts with giveaway share tasks and with young audiences (16).

## 10 things TechPlay is underusing

1. Five-platform library import (01, 10).
2. Release reminders and wishlist notices (built, bell-only) (12).
3. The Friday weekly digest (built, bell-only) (12).
4. Professor Buffy and the Discord bot as a host for rituals (13).
5. The WoW Analyzer (stale copy, heavy OG image) (10, 18).
6. Gamer DNA and Taste Match (no share cards, sign-in walled) (10).
7. The release calendar (no exports, no alerts outside the site) (10).
8. The newsletter desk (manual only; three capture points) (20).
9. The GTA 6 database (1,058 locations, 121 vehicles) as tools rather than lists (17).
10. Studio data (57,630 studios with countries) for data stories and regional coverage (14, 15).

## 10 areas requiring more data

1. Search Console: impressions, queries, index coverage reasons, crawl stats.
2. Account metrics: activation, D1/D7/D30 retention by source.
3. Newsletter: subscriber count and past campaign results.
4. Traffic by content type and by country since the 20 Sep consent change.
5. Current YouTube, TikTok, Instagram and Facebook ranking and link documentation.
6. Search volumes for the top evergreen and GTA 6 queries.
7. Backlink profile and referring domains.
8. Engagement data for TechPlay's X, Facebook and Instagram accounts.
9. Ad-network thresholds, AdSense RPM and affiliate commission rates.
10. IGDB licence position and subscription-catalogue data sources (Game Pass, PS Plus).

## Exact files created

All in `docs/techplay-growth/research/`:

- `00-RESEARCH-INDEX.md`
- `01-TECHPLAY-PRODUCT-AUDIT.md`
- `02-TECHPLAY-PUBLIC-PRESENCE.md`
- `03-SEARCH-INTELLIGENCE.md`
- `04-COMPETITOR-INTELLIGENCE.md`
- `05-GAMING-MARKET-2026-2027.md`
- `06-TREND-INTELLIGENCE.md`
- `07-SOCIAL-CHANNEL-INTELLIGENCE.md`
- `08-CONTENT-INTELLIGENCE.md`
- `09-EVERGREEN-OPPORTUNITIES.md`
- `10-PRODUCT-LED-GROWTH.md`
- `11-REGISTRATION-INTELLIGENCE.md`
- `12-RETENTION-INTELLIGENCE.md`
- `13-COMMUNITY-INTELLIGENCE.md`
- `14-DIGITAL-PR.md`
- `15-CREATORS-PARTNERSHIPS.md`
- `16-PAID-MEDIA-INTELLIGENCE.md`
- `17-GTA6-INTELLIGENCE.md`
- `18-GAME-HUB-OPPORTUNITIES.md`
- `19-VIDEO-INTELLIGENCE.md`
- `20-NEWSLETTER-INTELLIGENCE.md`
- `21-MASTER-OPPORTUNITY-MATRIX.md`
- `22-SOURCES.md`
- `23-CRITICAL-FINDINGS.md`
- `RESEARCH-COMPLETE.md`
- `opportunities.json`
- `evergreen-opportunities.csv`
- `game-opportunities.csv`
- `competitor-matrix.csv`
- `social-channel-matrix.csv`
- `research-sources.csv`
