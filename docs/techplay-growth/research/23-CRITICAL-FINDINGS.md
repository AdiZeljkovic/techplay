# 23 — Critical Findings

Status: Phase 1 research draft — 27 Sep 2026
Scope: the findings from files 01–22 that should change what the planning phase does first. Each one is a FACT unless labelled, with the file that holds the evidence. They are grouped by urgency, not by topic.

## A. Broken or false today (fix before any promotion)

1. **Search traffic is near zero.** Google clicks fell from about 100 a day to 1–2 after Cloudflare served Googlebot a 403 challenge from 17 Aug 2026 for about two and a half weeks; they had not recovered by 7 Sep. Only 56,355 URLs are indexed and 338,358 are not (03; docs/README.md §12). Any growth plan that assumes organic search starts from zero.
2. **TechPlay appeared in none of 114 Bing results pages and none of 751 Google News results for its own recent stories** (03, 17).
3. **Public claims are false in ways a partner or reader can check.** `/register` says "15K+ MEMBERS · 50K+ GAMES" (reality: 60 members, 333,198 games); it promises XP for reading articles, which awards nothing. The GTA 6 block says "Join thousands of fans". The WoW Analyzer claims "50K+ players analyzed · 4.9/5" and still says "Midnight launches March 2, 2026". Titles say "140,000+" games (02, 11).
4. **Two Discord invite links are dead.** The GTA 6 hub and roadmap send people to `discord.gg/techplaygg`, which Discord reports as unknown (13).
5. **Every article's breadcrumb category link returns 404** (`/news/news-industry` and similar), and **RSS hardware links point to a 404 path** and lag publishing by about a day (02).
6. **GTA 6 news is attached to the wrong game.** It sits on `/games/gta-6`, a 2019 parody game, not `/games/grand-theft-auto-vi`, and the hub links to neither (02, 17).
7. **The WebSite SearchAction in JSON-LD points to `/search`, which returns a noindex 404** (01, 03).
8. **Google News lists game-database pages for obscure German titles as TechPlay's "news"** (03).

## B. Structural problems that cap growth

9. **99.8% of indexable URLs are database pages, and 0.7% of game pages carry anything TechPlay wrote.** Googlebot fetches about 77 game pages a day; one pass over 295,024 URLs takes about ten years (03). Google's scaled-content policy and the February 2026 Discover update both penalise this pattern (07, 08).
10. **No automated email exists.** 20 of 22 notification types, including release reminders, wishlist notices and the Friday digest, go only to the on-site bell. A member who stops visiting never hears from TechPlay (01, 12).
11. **Nothing is measurable for acquisition.** No ad pixel; GA4 events only for the onboarding wizard; the first-party collector drops UTM parameters by design; returning visitors cannot be identified; GA saw only 2–7% of visitors until the CMP change on 20 Sep 2026 (16, 12, docs/README.md §19).
12. **Activation fails at the core product.** Of 55 members, 3 added a game and 2 linked a platform; 45 had zero XP (01 Part B). Steam is a connect method, not a sign-in method, although Steam's OpenID allows it (11).
13. **Registration is a five-gate chain** (Turnstile, password rules, email verification before login, 30-day prune, first three comments held). Two readers in one week reported the form as broken (11).
14. **The content mix competes where TechPlay cannot win.** 577 news posts, mostly rewrites of widely covered stories, versus 38 reviews (none since 8 Jul) and 4 guides, three of them on Genshin Impact. Reviews arrive 16–21 days after launch (02, 08).
15. **Two authors wrote about 95% of the last 20 news items** (02). Capacity is the constraint: any plan that adds formats must remove others.

## C. Risks to watch

16. **IGDB licence.** The catalogue was seeded by a one-off IGDB import (August 2026). IGDB's API documentation says the API is free for non-commercial use under the Twitch Developer Service Agreement; TechPlay is ad-supported (10).
17. **Discover volatility.** Google's February 2026 core update reweighted Discover toward topic expertise and local relevance; a September 2026 spam update is rolling out now (07, 08).
18. **Giveaway mechanics versus ad policy.** Meta forbids requiring entrants to share or repost; TechPlay's giveaway tasks include share and retweet tasks (16).
19. **Deliverability.** TechPlay sends from its own server with no Gmail reputation; DNS and SMTP changes need explicit approval (20, docs/README.md §14).
20. **Industry contraction** raises the bar for trust: IGN, GameSpot and Eurogamer cut staff in 2026; Future's profit fell 67% with Google traffic down about 20% (04).

## D. Advantages the evidence supports

21. **Free five-platform library import is rare.** Competitors either have no import (Backloggd), import Steam only (HowLongToBeat) or charge for PSN and Xbox import (SavePoint $9/month, Infinite Backlog $3/month) (04, 10).
22. **TechPlay owns its game rows.** Competitors that rent IGDB data cannot correct or enrich it locally (04).
23. **The WoW Analyzer is the only on-site character analyzer among the media sites reviewed** (18).
24. **Discord, site accounts and XP are already wired together through Professor Buffy** (13).
25. **The calendar is dense and fixed:** Steam Autumn Sale (1–8 Oct), Next Fest (19–26 Oct), MW4 (23 Oct), WoW: Forever (4 Nov), GTA VI (19 Nov), Black Friday (27 Nov), The Game Awards (10 Dec), Steam Winter Sale (17 Dec–4 Jan), Fable (23 Feb 2027), FF7 Revelation (8 Apr 2027) (05).

## What this means for the planning phase (RECOMMENDATION)

- Order work as: **fix what is broken or false → make growth measurable → deliver the loops that already exist (email, alerts, Discord) → build on the data (tools, templates, hubs) → promote.**
- Treat GTA VI's 19 Nov launch as a deadline for section A fixes on the hub.
- Decide on the indexable-set question (03 §9) early; it changes how much of the database strategy is possible.
