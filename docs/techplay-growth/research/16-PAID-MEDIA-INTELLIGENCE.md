# 16 — Paid Media Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Agent: paid · Part 20 of the TechPlay growth research programme
Scope: research and intelligence only. No plan, no calendar, no spend authorised.

## Executive summary

1. FACT (repo): TechPlay has **no advertising pixel of any kind installed** — no Meta Pixel, no TikTok pixel, no Reddit pixel, no Google Ads tag. Only GA4 (first-party relay via `/proxy/gtag`) and the in-house collector exist. Nothing can be bought on a conversion objective until that changes, and the in-house collector deliberately drops `utm_*`/`gclid` (see §4), so today paid traffic would be invisible to the one counter that sees everyone.
2. FACT (docs/README.md §19): consent is served by nginx per Cloudflare country — EEA/UK/CH default `denied` until the Google CMP records a yes; US and rest of world default `granted`. US ≈ 35% of traffic (README, 20 Sep 2026). Consequence: any paid test that needs pixel measurement is a **US-first test by construction**; EEA measurement depends on the CMP's consent rate, which has not yet been measured since 20 Sep 2026 (UNKNOWN).
3. ESTIMATE: at the low end the whole gaming/entertainment social auction is cheap per click (LocaliQ/WordStream 2026: Arts & Entertainment Facebook traffic CPC $0.34, lead CPC $0.88, CPL $14.59) — but cheap clicks to a media site are exactly the "low-value pageview" the brief forbids. The only objectives where a click has a defensible value are **account registration, newsletter double-opt-in, Discord join and giveaway entry**, and each needs a conversion event before a dollar is spent.
4. FACT: platform policy limits the audience TechPlay would most want. Meta uses only age + location for under-18s (since Feb 2023); Google blocks personalised ads to under-18s on YouTube, Display and Search; Meta consolidated/deprecated granular interest targeting (ad sets with deprecated interests stopped delivering 15 Jan 2026). "Gamers" as a bought audience now means broad + creative + first-party seeds, not an interest checkbox.
5. FACT: Meta's Promotions policy forbids requiring or incentivising entrants to "share, repost, tag others"; TechPlay's giveaway tasks include `share_giveaway` and `twitter_retweet` (repo, `GiveawayResource.php`). Promoting the current giveaway mechanics on Meta needs a task audit first.
6. RECOMMENDATION (evidence-based): Reddit (minimum $5/day, community targeting of named gaming subreddits, Conversation Placement) and TikTok Spark Ads (boost an organic post that already works; $50/day campaign floor) are the two channels whose mechanics fit a small publisher with tools and hubs to promote. Google Search is worth only a tiny branded/tool-query budget; Google Display, Performance Max, X, and content-recommendation networks (Taboola/Outbrain/MGID) should not be tested with the first $3,000.
7. FACT: newsletter-specific paid channels (beehiiv paid recommendations "$2.20 per subscriber" example; SparkLoop Partner Network "$2–20" CPA; Substack recommendations free, network drives "50% of all new subscriptions") are the cheapest documented cost-per-subscriber anywhere — but every one of them requires the list to live on that platform. TechPlay's newsletter is self-hosted Laravel (README §20), so these channels are **structurally unavailable** without a migration decision.
8. RECOMMENDATION: the first ~$300 of "paid" spend should buy measurement, not media — Meta Pixel + CAPI behind consent, GA4 `sign_up` / `newsletter_verified` / `giveaway_entered` / `discord_click` events, UTM conventions enforced in the campaign tool, and a `utm`-aware column in the first-party collector. Without that, no result of any test in §6 can be read.

---

## 0. TechPlay facts that constrain every channel (verified in repo, 27 Sep 2026)

| Fact | Where | Why it matters for paid |
|---|---|---|
| FACT: 60 registered users, 638 articles, ~333k games, 2 giveaways, 7 forum threads, 22 comments | `docs/README.md` §1, §8 (7 Sep 2026) | Seed audiences too small for lookalikes (Google needs 100 active users/30 days per list; Meta custom audiences would be built from pixel traffic, not from users) |
| FACT: no ad pixel; only GA4 via `/proxy/gtag` + `/proxy/ga/g/collect` relay and the first-party collector | grep of `frontend/` for `fbq`, `ttq`, `rdt(`: only footer icon/legal pages match | Nothing to optimise a conversion campaign against; no retargeting pools exist |
| FACT: GA4 custom events exist only for the onboarding funnel: `wizard_shown`, `wizard_steam_click`, `wizard_xbox_submitted`, `wizard_pick_started`, `wizard_pick_done`, `wizard_skipped`, `checklist_steam_click`, `d1_return` | `frontend/lib/track.ts` | No `sign_up`, no newsletter, no giveaway, no Discord event in GA4 — the conversion definitions in §4 do not exist yet |
| FACT: first-party collector stores the page **path only** ("A query string … also carries `utm_*` and `gclid`, which belong to the referrer report") and the referrer **host only** | `backend/app/Services/AnalyticsCollector.php` | The one counter that sees 100% of traffic cannot tell paid from organic Facebook. A campaign column must be added before any test |
| FACT: consent default is served by nginx from `CF-IPCountry`; EEA/UK/CH denied until Google CMP consent; `XX`/`T1` denied; elsewhere granted. US ≈ 35% of traffic | `docs/README.md` §19 (20 Sep 2026) | Pixel-based measurement works fully for US/RoW, partially for EEA. Meta Pixel must be wired to the same consent signal (`fbq('consent','revoke')` before init in EEA) |
| FACT: giveaway task types: `youtube_subscribe`, `twitter_follow`, `twitter_retweet`, `discord_join`, `visit_url`, `share_giveaway`; plus a daily bonus entry (`canClaimDailyBonus`) | `backend/app/Filament/Resources/GiveawayResource.php`, `GiveawayController.php` | Retweet/share tasks collide with Meta's Promotions policy (§2.1); daily-bonus mechanics need care under "gambling-like" scrutiny (§2.3) |
| FACT: newsletter is self-hosted (`NewsletterSubscriber`, double opt-in via `NewsletterVerification`, campaigns in `mail_campaigns`, signed click redirects) | `docs/README.md` §20, `routes/api.php` lines 448–469 | beehiiv/SparkLoop/Substack growth networks are unavailable without moving the list |
| FACT: Discord invite `discord.gg/wPQG9gUMXH` is the footer fallback; no Discord member count in repo | `frontend/components/layout/Footer.tsx` | Discord size UNKNOWN — needed before any community-growth test is sized |
| FACT: 1–2 Google clicks/day since the 17 Aug 2026 Cloudflare 403 incident; 56,355 pages indexed | `docs/README.md` §12 | Paid search cannot be a substitute for a broken organic channel at 333k pages; branded search is the only defensible search buy |
| FACT: AdSense is the revenue model; "No CMP" limited-ads state until the Google CMP was adopted 20 Sep 2026 | `docs/README.md` §19 | A paid pageview's revenue ceiling is AdSense RPM — the brief's reason to forbid buying pageviews |

---

## 1. Objective × channel matrix

Fit is 1 (poor) to 5 (strong). Every score is an ESTIMATE grounded in the platform facts in §2; nothing here has been tested by TechPlay.

| Channel | Registration | Newsletter | Giveaway entry | Discord / community | Content (articles) | Retargeting | Game hubs (GTA 6, WoW) | Brand |
|---|---|---|---|---|---|---|---|---|
| Meta (FB+IG feed, Advantage+) | 3 | 3 | 4 | 2 | 2 | 4* | 3 | 3 |
| Instagram Reels only | 2 | 2 | 3 | 2 | 2 | 3* | 3 | 4 |
| Google Search (branded + tool queries) | 3 | 1 | 1 | 1 | 1 | 2 | 2 | 2 |
| Google Search (game-name queries) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Performance Max | 2 | 1 | 2 | 1 | 1 | 2 | 1 | 1 |
| Google Display | 1 | 1 | 1 | 1 | 1 | 2* | 1 | 1 |
| YouTube (Shorts / in-feed) | 2 | 1 | 2 | 2 | 2 | 2 | 3 | 4 |
| Google Demand Gen | 2 | 2 | 3 | 1 | 2 | 3* | 3 | 3 |
| TikTok Spark Ads | 2 | 1 | 3 | 3 | 3 | 1 | 4 | 4 |
| Reddit (community + conversation) | 3 | 2 | 3 | 4 | 3 | 1 | 4 | 3 |
| X Ads | 1 | 1 | 2 | 2 | 1 | 1 | 2 | 1 |
| beehiiv / SparkLoop / Substack networks | — | 5† | — | — | — | — | — | — |
| Paid newsletter swaps | 1 | 4 | 2 | 1 | 2 | — | 2 | 2 |
| Discord listing sites (Disboard/Discadia/top.gg) | — | — | — | 3 | — | — | — | 1 |
| Discord Quests | — | — | — | 1 | — | — | 1 | 1 |
| Giveaway platforms (Gleam etc.) | 2 | 3 | 4 | 3 | — | — | 2 | 2 |
| Web push (OneSignal) | — | — | 3 | — | 4 | 4 | 3 | — |
| Taboola / Outbrain / MGID | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

\* Retargeting scores assume a pixel exists and the pool clears platform minimums (Google: 100 active users in 30 days per list — FACT, Google Ads Help). Today the pools are 0.
† Only if the list is migrated to that platform; today unavailable (§2.11).

Rationale by row (short form; full briefs in §2):

- **Meta**: the only self-serve platform where an on-site registration/newsletter/giveaway conversion can be optimised at a $10–20/day budget, provided Pixel+CAPI exist. Arts & Entertainment lead CPL $14.59 (LocaliQ 2026) is the cheapest published lead benchmark of any large platform, but it measures instant-form leads across industries, not gaming-site registrations — ESTIMATE only.
- **Reddit**: community targeting of `r/pcgaming`, `r/GTA6`, `r/wow`, `r/patientgamers`-type subreddits is the closest thing to buying a gaming audience that still exists after Meta's interest consolidation; $5/day floor; Conversation Placement 15–30% cheaper CPM than feed (Stackmatix, Sept 2026 — ESTIMATE from a vendor). Fit for hubs, tools and Discord.
- **TikTok Spark Ads**: boosts an organic post that has already proven itself; attribution stays on the organic post; every objective incl. Lead Generation and Community Interaction supported (TikTok help). $50/day campaign floor makes it a ≥$1,000/month channel in practice.
- **Google Search**: branded protection is cheap and defensive; "wow analyzer"/"backlog advisor" tool queries have UNKNOWN volume (no keyword data fetched — Search Console only); game-name queries compete with stores and wikis and produce a pageview, not an account.
- **Demand Gen / YouTube**: awareness surfaces (Shorts CPM $4–5 in Q1 2026 per two vendor benchmarks — ESTIMATE). Reasonable for a GTA 6 hub trailer-style creative; poor for registrations at TechPlay's scale.
- **X**: lowest published CPC but Kantar has ranked it last for marketer trust three years running (True Interactive, Jul 2026, citing Kantar Media Reactions 2025); TechPlay's own giveaway tasks push people to X, so organic presence matters more than paid.
- **Content-rec networks**: cheap clicks of the lowest documented quality (Digiday 2016; Marketing Brew 2021 — 12.3% of programmatic display spend on MFA inventory per Jounce). Brand-negative for a site whose product is credibility.

### 1.1 Reading the matrix by objective

- **Registration.** The account is the product ("One Game Library for PC, PlayStation & Xbox"), so registration is the only objective where a paid click buys something with a lifetime. Best fits are Meta (on-site `CompleteRegistration` optimisation at small budgets) and Reddit (tool-led posts in the communities where a library tool is a natural topic). Search is limited to brand/tool queries. ESTIMATE of what "good" would look like: a cost per *verified* account under the $14.59 Arts & Entertainment lead CPL benchmark — but that benchmark measures instant-form leads, and TechPlay's account requires email verification plus, ideally, a library import, so the true comparable is unknown.
- **Newsletter.** Cheapest per subscriber by an order of magnitude on beehiiv/SparkLoop/Substack (fit 5), but those require hosting the list there (FACT: it is self-hosted). On the platforms TechPlay can actually use, newsletter is a secondary conversion behind registration: the same visitor, the same form, one more checkbox — so it should ride along on registration campaigns (`newsletter_opt_in` at sign-up) rather than get its own budget until list size is known.
- **Giveaway entry.** Highest raw fit on Meta and via giveaway platforms because prizes convert; lowest quality per entrant of any objective (§2.12). Also the objective with the most policy surface (§2.15). Score is high for *volume*, and the brief's caution applies: an entrant is not a reader.
- **Community / Discord.** Reddit wins because the ad can be a post in the exact community whose members would join a gaming Discord; Meta and TikTok cannot target that precisely any more. Free listing sites are zero-cost and slow. Discord's own ad product is not for communities of this size.
- **Content.** Every platform scores 1–3 because promoting an article buys a pageview. TikTok and Reddit score 3 only for *hub* content that is itself a destination (the GTA 6 map, the catalogue), not for news.
- **Retargeting.** Scores assume a pool that does not exist yet; Meta retargeting is the first to become viable because its pool builds from any pixel-consented visit, while Google needs 100 active users per list and (for EEA) `ad_storage` granted.
- **Game hubs.** GTA 6 and WoW are the two TechPlay assets with a pre-existing audience that can be named on Reddit (subreddits) and shown on TikTok/Shorts (trailer-adjacent creative). Fit 3–4 on those; 1 on Search because game-name CPC buys the same pageview organic search used to deliver.
- **Brand.** Reels, Shorts and TikTok are the cheapest reach (CPM $4–8 range in the fetched panels) but the brief does not fund reach for its own sake; brand is a by-product of hub campaigns, not a line item.

---

## 2. Per-channel briefs

### 2.1 Meta Ads (Facebook + Instagram feed, Advantage+)

**Mechanics and 2026 targeting reality**
- FACT (Social Media Today, 17 Aug 2025; Brandwatch help centre): Meta consolidated detailed-targeting interests and removed detailed-targeting exclusions. "As of December 15, 2025, Advertise will stop supporting the deprecated interests"; ad sets still containing them stopped running **15 January 2026**. Meta's reasoning: options "weren't widely used, they were too granular, or they related to topics that people may perceive as sensitive." Meta's own test claim: removing exclusions gave a "22.6% lower median cost per conversion" (Social Media Today).
- OBSERVATION: whether a "Video games" or "PC gaming" interest survives as a consolidated bucket could not be verified in Ads Manager from this session (UNVERIFIED). Plan for Advantage+ Audience (broad, with interests as suggestions only) plus creative that self-selects gamers.
- FACT (Meta Newsroom, Jan 2023): for under-18s "Age and location will be the only information about a teen that we'll use to show them ads"; gender and engagement-based targeting removed from Feb 2023. A vendor blog (AuditSocials, 2026) claims further 2026 tightening (custom audiences, lookalikes blocked for teens) but cites no Meta source — treat as UNVERIFIED. Practical rule: set 18+ on every ad set; TechPlay gains nothing from teens who cannot be retargeted anyway.
- FACT (Meta Pages/Groups/Events policy): promotions "must not require or incentivize participants to share, repost, tag others, or in any other way publicize your promotion"; entrants must release Meta and acknowledge the promotion is "in no way sponsored, endorsed, administered by, or associated with Meta"; official rules and eligibility must be disclosed. TechPlay's `share_giveaway` and `twitter_retweet` tasks are the kind of mechanic this bans on Meta surfaces; any Meta-promoted giveaway needs a task set that excludes them or the ad risks rejection and the Page a strike.

**Lead forms vs on-site conversions**
- OBSERVATION: Meta's Instant Forms product page could not be fetched (JS-only, curl returned nothing). Known product facts from platform experience — instant forms keep the user on Meta and produce a CSV/CRM lead; on-site conversions need Pixel+CAPI and a `CompleteRegistration`/`Lead` event. Newsletrix (May 2026, operator disclosures) puts Meta Lead Ads at "$3–5" per newsletter subscriber but warns retention-adjusted cost is higher — ESTIMATE from a secondary source.
- RECOMMENDATION: TechPlay's newsletter is double-opt-in (README §20 — unverified addresses are never mailed). An instant-form lead is worthless until it verifies; run lead campaigns only against the on-site form so the verification email is sent immediately, and count `newsletter_verified` as the conversion, not the form submit.

**Measurement requirements (consent, Pixel, CAPI)**
- FACT (Meta developers, Pixel GDPR page): `fbq('consent','revoke')` must be called before `init` and "on every page" until affirmative consent; `fbq('consent','grant')` afterwards. "Each company is responsible for ensuring their own compliance with the GDPR."
- FACT (Meta CAPI docs): server events need at least one `user_data` parameter (hashed email, `external_id`, `fbp`/`fbc`), and Pixel+CAPI duplicates must share an `event_id`.
- FACT (Meta Data Processing Options doc): Limited Data Use covers 14 US states (CA, CO, CT, DE, FL, MT, NE, NH, NJ, OR, TX, MN, MD, RI); "retargeting and measurement capabilities will be limited when Limited Data Use is enabled." README §19 says the US "Do Not Sell or Share" message is on — LDU should be sent for users who opt out, if TechPlay can read that signal (UNKNOWN whether the Google CMP exposes US opt-out to page JS).
- OBSERVATION: a vendor guide (Analytico, 2026) asserts a "mandatory `consent` parameter" for EEA CAPI events under the DMA but cites no Meta URL — UNVERIFIED; check Meta's CAPI changelog before build.
- Implication for TechPlay: Pixel fires unconditionally for US/RoW (default granted), and only after CMP consent in EEA/UK/CH. EEA conversions will be under-counted by roughly the CMP refusal rate (UNKNOWN until measured).

**Benchmarks (all ESTIMATE; sources are panels, not TechPlay data)**
| Metric | Value | Source, date |
|---|---|---|
| Facebook traffic CPC, Arts & Entertainment | $0.34 (CTR 2.71%) | LocaliQ/WordStream 2026 |
| Facebook lead CPC / CVR / CPL, Arts & Entertainment | $0.88 / 15.31% / $14.59 | LocaliQ/WordStream 2026 |
| All-industry lead CPL | $27.39 | LocaliQ/WordStream 2026 |
| Meta CPM, all objectives | $8.17 (Oct 2025) | Gupta Media CPM tracker |
| Meta cost per link click | $0.37 (Oct 2025) | Gupta Media |
| Leads-objective CPM / CPC / CPL | $30–45 / $1.92 / $27.66 (2025 data) | AdAmigo, Sept 2026 |
| US ecommerce CPM | $16.08 (Jul 2026) | Lebesgue via PaceAds |
| Facebook CPC, June 2026 | $0.88 | Bïrch (ex-Revealbot) via Neal Schaffer |
Note the spread: "published Meta CPM benchmarks now differ by more than 2× depending on whose panel you read" (PaceAds, 2026). Use them to size a test, never to promise a CPA.

**Creative tied to TechPlay assets**
- The tagline "One Game Library for PC, PlayStation & Xbox" + a 6-second screen recording of the Steam/Xbox/PSN import wizard (the funnel already instrumented as `wizard_*`).
- GTA 6 hub: 121 vehicles / 36 weapons / 1,058 locations (README §1) as a carousel; each card deep-links to a hub page with `utm_content=<card>`.
- Giveaway: prize image + "no purchase necessary" + the official-rules link in the primary text (policy requirement).

**Pitfalls**
- Boosting posts from the Page ("Boost") uses Business Suite targeting, where interest deprecation landed 21 Aug 2025 — boosted posts are the worst-instrumented spend on the platform.
- Traffic objective optimises for clickers, not registrants; with zero conversion history Meta will still let you pick "Complete registration" but the ad set needs ~50 conversions/week to leave learning (platform norm; UNVERIFIED exact figure for 2026).

### 2.2 Instagram Reels

- FACT (TikTok-style short video is Meta's fastest-growing placement): Reels were >50% of Instagram ad creatives in 2025 and 33–35% of Instagram ad impressions by Q2 2026 (Sensor Tower via CNBC and Tinuiti, quoted by PaceAds 2026) — ESTIMATE, second-hand.
- ESTIMATE: Instagram Stories CPC $1.83 / CPM $6.25; Instagram Feed CPC $3.35 / CPM $7.68 (AdAmigo, Jan 2026 data). Reels-specific rows were blank in that source — UNKNOWN.
- RECOMMENDATION: treat Reels as a *creative format* inside the Meta campaign (Advantage+ placements), not a separate budget line. TechPlay has no Reels library to boost (OBSERVATION: no Instagram content pipeline found in repo or README — UNKNOWN whether an account exists).

### 2.3 Google Search (branded, tool queries, game-name queries) and Performance Max

- FACT (LocaliQ 2026, updated 1 Jun 2026): Search, Arts & Entertainment — CPC $1.63, CTR 12.75%, CVR 5.91%, CPL $26.84; all-industry CPC $5.42, CPL $66.69. Source is LocaliQ's own customer base (SMB-heavy).
- Branded protection: RECOMMENDATION — a $2–3/day exact-match campaign on "techplay", "techplay gg", "techplay wow analyzer", "techplay backlog advisor" costs almost nothing and denies competitors the slot. Evidence of competitors bidding on the brand: UNKNOWN (no auction-insights data available to this research).
- Tool queries ("backlog advisor", "wow analyzer", "what to play next"): search volumes UNKNOWN — no keyword tool was available and Search Console was not accessed. HYPOTHESIS: "wow raid readiness check" type queries exist at low volume with tool intent; a $5/day exact-match test is the cheapest way to learn the real CPC. The WoW Analyzer is a Groq + Blizzard API tool (README §1) — each use costs an LLM call, so a paid click that runs the tool has a marginal cost; cap daily budget accordingly.
- Game-name queries ("GTA 6 release date", "<game> review"): RECOMMENDATION against. The SERP is stores, Rockstar, wikis and big media; the outcome of a click is one pageview whose upside is one AdSense impression; and after the 17 Aug 2026 index collapse (1–2 clicks/day, README §12) paid search cannot substitute for organic at 333k pages. Fit 1 across the board.
- Performance Max: FACT (Google Ads Help) — runs on "YouTube, Display, Search, Discover, Gmail, and Maps"; needs conversion goals, assets and audience signals; positioned for "increasing online sales or generating leads." With no conversion history and a $300–1,000 budget, PMax has nothing to learn from and will spend on Display. RECOMMENDATION: not before a Meta/Reddit test has produced ≥100 registrations attributable to ads.
- Policy: FACT (Google gambling & games policy) — prize promotions by retailers are "out of scope"; raffles need licensing in some jurisdictions (UK example). Loot-box-like mechanics are not addressed in the Google Ads policy text fetched; TechPlay's XP/rank system is not gambling (no stake, no prize of value) — OBSERVATION. Google's Ad protections for children and teens (consolidated 15 Jan 2025 per PPC Land; policy page fetched): "Don't allow ads personalization" for under-18s across YouTube, Display and Search, and gambling is a restricted category for teens.

### 2.4 Google Display (retargeting)

- FACT (Google Ads Help): remarketing lists need "a minimum of 100 active visitors or users within the last 30 days" for Display, Search and YouTube.
- FACT (Google consent mode developer guide): when `ad_storage` is denied no advertising cookies are set; EEA traffic needs `ad_user_data` and `ad_personalization` in addition to `ad_storage`/`analytics_storage`. Google's EU User Consent Policy requires "legally valid consent" for cookies and for "personalization of ads", retained records and revocation instructions (google.com/about/company/user-consent-policy).
- Implication: with EEA default-denied, the retargeting pool is US/RoW visitors plus EEA consenters. Whether 100 *active* users/30 days is reached for a narrow list (e.g. "visited /register, did not complete") is UNKNOWN — the first-party collector cannot answer it because it re-hashes visitors nightly (README §19).
- Benchmarks: no credible 2026 Display-specific CPC/CPM was fetched (WordStream's Google benchmark page returned 403) — UNKNOWN. Display's value for a publisher is low regardless: the click lands on the same site the person already left.
- RECOMMENDATION: Display only as a retargeting layer for a defined 7-day "started registration / started newsletter form" audience, and only after Meta retargeting has been tried, since Meta's pool builds from the same pixel-consented traffic and is cheaper to test.

### 2.5 YouTube Ads (Shorts, in-feed)

- ESTIMATE: Shorts CPM $4.85 / CTR 1.24% (Digital Applied, 20 Apr 2026, composite of vendor data); "~$4" Shorts CPM and $0.10–0.30 CPV (Store Growers, citing Strike Social/Precise.TV 2024–2026); skippable in-stream CPM $5–10, CPV $0.05–0.10 (same). Gaming vertical skippable CTR 1.85%, view rate 41.2% (Digital Applied) — vendor composite, ESTIMATE. Gupta Media: YouTube CPM $7.61 (Oct 2025).
- FACT: teen protections apply to YouTube — no personalised targeting under 18.
- Fit: awareness for a hub (GTA 6, WoW Analyzer demo) at $5/CPM is the cheapest reach on the list, but reach is not the objective the brief allows. TechPlay's video assets: UNKNOWN (no YouTube channel identified in repo; giveaway tasks reference `youtube_subscribe`, implying a channel exists — UNVERIFIED).

### 2.6 Google Demand Gen

- FACT (Google Ads Help, official): placements are "YouTube (including Shorts), Discover, Gmail, Google Display Network, and Google video partners" (the product page lists "YouTube — including Shorts — Discover, and Gmail"); formats image (1.91:1, 4:5, 1:1), video, carousel 2–10 cards; audiences include lookalike segments from "past purchasers, website visitors, or YouTube channel viewers"; bidding on Clicks, Conversions or Conversion Value; "For campaigns using target CPA bidding, Google Ads recommends setting a budget that's at least 10 times your target CPA."
- Relevance for a publisher: Discover is where Google already recommends articles for free; paying to appear there for an article is buying a pageview. The defensible Demand Gen use is a **registration or giveaway** conversion with a lookalike built from site visitors — which again needs a conversion tag and a seed list (Demand Gen lookalikes need a seed; minimum seed size not stated on the fetched page — UNKNOWN).
- ESTIMATE: at target CPA of $15 per registration the recommended daily budget is $150 — i.e. $4,500/month, above every scenario in §3. Demand Gen is a ≥$3,000/month channel for TechPlay.

### 2.7 TikTok Ads (Spark Ads)

- FACT (TikTok Ads help, budget article): campaign daily and lifetime budget "must exceed $50"; ad-group daily budget "must exceed $20"; ad-group lifetime minimum = days × $20.
- FACT (TikTok Ads help, Spark Ads): "a native ad format that allows you to leverage organic TikTok posts and their features in your advertising"; supports Reach, Traffic, Video Views, Community Interaction, App Promotion, Conversions, Lead Generation, Sales; engagement "will be attributed to the original organic post"; creator posts usable with an authorization code of chosen duration; videos under 10 minutes.
- ESTIMATE: Spark CTR 2.4% vs in-feed 1.0%; Spark CPM $11.85 vs $9.16 (Digital Applied 2026 via Enrich Labs); TikTok CPM $4.67, cost per link click $0.49 (Gupta Media, Oct 2025); TikTok's own claims "134% higher completion rate", "157% higher 6-second view-through" for Spark vs in-feed (TikTok for Business "Spark Ads 101", quoted by Enrich Labs). Newsletrix: TikTok Spark Ads "$1–4" per newsletter subscriber (operator disclosures — ESTIMATE).
- FACT (TikTok gambling & games ad policy): sweepstakes are defined as "Promotional events where participants can win prizes by chance, typically with no purchase required"; "surprise-based products" (mystery boxes) need market-specific review; "we do not allow gambling ads to be shown to minors." A TikTok giveaway also must state it is not sponsored by TikTok (ViralSweep/US Sweeps guidance — secondary; the TikTok Branded Content Policy fetched did not address contests directly).
- FACT (Marketing Dive, 25 Mar 2026; Storika 2026): TikTok's US operations moved to TikTok USDS Joint Venture LLC, closed **22 Jan 2026** (Oracle, Silver Lake, MGX 15% each; ByteDance 19.9%); ads-manager buying, billing and TikTok Shop "did not move to a new operator"; the US recommendation algorithm is being retrained on US-only data — reach "could improve, decline, or simply behave differently by content category". Advertiser access in 2026 is normal; the risk is delivery volatility, not availability.
- TechPlay fit: Footer has a TikTok icon slot (`tiktok_url` site setting) but whether an account with posts exists is UNKNOWN. Spark Ads require an organic post to boost — the channel is unusable until TechPlay (or a creator with an authorization code) has a video that already performs. HYPOTHESIS: a "GTA 6 map — every location we've catalogued" 20-second screen tour is the most boostable asset TechPlay owns.
- Pitfalls: $50/day floor means a two-week test is ≥$700; Stackmatix (Sept 2026, uncited) claims ~50 conversions/ad group/week to exit learning — plausible but ESTIMATE.

### 2.8 Reddit Ads

- FACT/ESTIMATE (official Reddit pages were unreachable from this session — `business.reddit.com` blocked, help-centre pages returned empty; figures below come from three vendor guides that agree): minimum daily budget $5 per campaign, minimum lifetime $25 (Stackmatix, 2026); "no minimum spend to get started" (97th Floor guide, quoting Reddit for Business). CPC $0.50–3.50, most $0.75–2.00; CPM $3–12; CPV $0.02–0.08 (Stackmatix, 11 Sep 2026). CPM $0.50–15 and CPC $0.50–4 (97th Floor, citing WordStream).
- Placements: Feed and **Conversation Placement** (inside comment threads), the latter "priced lower than feed placements (15–30% lower CPMs)" (Stackmatix, Sept 2026 — vendor claim, ESTIMATE). Formats: promoted posts (image/video/carousel), free-form posts.
- Targeting: communities (subreddits), interests, keywords, custom audiences (97th Floor). Gaming subreddit sizes cited by Stackmatix (3 Sep 2026): r/gaming 47M+, r/pcgaming 5M+, r/Games 4M+, r/PS5 3M+, r/leagueoflegends 8.3M+ — reported, not verified against Reddit.
- 2026 product news: "MAX Campaigns, launched in January 2026" (AI bid/placement optimisation) appears only in a search snippet from a vendor guide — **reported/unconfirmed**; the Reddit press release could not be fetched.
- Creative advice consistent across sources: "Show real gameplay within the first 3 seconds", raw footage over polished trailers; sub-0.2% CTR signals targeting problems (Stackmatix). Reddit users are hostile to ads that read as ads — an ad written like a post ("We catalogued 1,058 GTA 6 map locations from the trailers — here's the interactive map") is the format.
- Publisher/newsletter use: no credible case study of a publisher buying newsletter subscribers on Reddit was found (searches returned generic guides) — UNKNOWN.
- TechPlay fit: highest for Discord growth (Conversation Placement in game-specific subreddits → Discord invite), for GTA 6 and WoW hubs, and for the Backlog Advisor tool in r/patientgamers-type communities. Ads should link to a landing that shows the tool immediately, not to an article.
- Policy: promotions rules not fetched — UNKNOWN; assume official rules and no-purchase-necessary disclosure as on every platform.

### 2.9 X Ads

- FACT (True Interactive, 7 Jul 2026, citing Social Media Today / Business Insider / The Information): X ad revenue $4.4B (2022) → $2.6B (2024) → $1.8B (2025); Kantar Media Reactions 2025: "Twenty nine percent of marketers plan to decrease spend on X, up from 26% the year before"; Kantar has ranked X last for trust three consecutive years. Kantar 2024: "Only 4% of marketers believe ads on X are brand safe" (via shno.co roundup; Kantar page itself returned 404 — secondary).
- ESTIMATE: median CPC ~$0.18 (Hootsuite 2025 via Marketing LTB), range $0.50–2.00 (WebFX) — cheap because demand left.
- RECOMMENDATION: no paid X for a brand whose product is credibility; keep X organic because giveaway tasks (`twitter_follow`, `twitter_retweet`) already send people there. Fit 1–2.

### 2.10 Newsletter-growth paid channels

- **beehiiv paid recommendations (formerly Boosts)**: FACT (beehiiv features page) — "You're only charged when a subscriber passes verification and actively engages with your content"; states pending/verified/failed; example "$2.20 per subscriber"; "available on Scale and Max" plans; Auto-Pause below an engagement threshold. Fee structure not stated on the fetched page — UNKNOWN (search snippets say 20%).
- **SparkLoop Partner Network / Upscribe**: FACT (SparkLoop pages) — "hundreds of top newsletter brands are waiting to pay $2–20 for each new subscriber"; "We charge a 20% commission (plus 3.5% fees) on any payouts"; recommends "at least 500–1000 subscribers before participating"; "Earn up to $30 per new subscriber who opts in". Retention/refund rules not on the fetched pages — UNKNOWN.
- **Substack recommendations**: FACT (Substack, 22 Feb 2024) — free, "drives 50% of all new subscriptions and 25% of new paid subscriptions on Substack"; no paid recommendations.
- **Paid swaps / sponsored placements**: ESTIMATE (Newsletrix, 28 May 2026, from operator disclosures) — paid swaps $0–3, beehiiv $2–3, SparkLoop $4–7, sponsored placements $6–12, podcast reads $8–15 per subscriber; "SparkLoop at $5 often beats Meta Lead Ads at $4" once 90-day retention is priced in.
- TechPlay constraint: FACT — the list is self-hosted (README §20). All three networks require the publication to live on their platform. Paid swaps with other gaming newsletters are the only variant available today; TechPlay's list size is UNKNOWN (not in README's measured counts) and a swap partner will ask.
- RECOMMENDATION: decide *first* whether the newsletter stays self-hosted. If it stays, the paid newsletter channel is Meta/Reddit → on-site double-opt-in form, at a cost that will be several × the $2–5 network CPAs above.

### 2.11 Discord server advertising

- FACT (Discord Ads page): Quests are "for game developers, publishers, and brands"; formats Play Quests, Video Quests, Arena Quests (press release 2 Oct 2025); "Discord Ads can only be purchased through our sales team"; measurement via AppsFlyer and Gamesight. One brand (Walmart) used Video Quests "to bring players into its own custom Discord server experience" — so a server destination is possible, but this is a sales-led, brand-budget product. Not for a 60-user publisher: fit 1.
- Listing sites: FACT (CommunityOne, 20 Dec 2023, own experiment) — Disboard free, bump every 2 hours, "three new members" from one day of bumping; Discadia $10/month sponsorship, "five new members"; Disforge $15/month auto-bumps, "six new members"; Discords.com $30/month featured, "just one new member". dis.ad (2026) confirms Disboard free/2-hour bump and top.gg "paid promotion … through auctions". Prices in 2026 UNVERIFIED (Discadia's pages returned empty).
- RECOMMENDATION: list on Disboard/Discadia for free (tags: gaming, pc, playstation, xbox, gta6, wow) and have Professor Buffy remind staff to bump — cost is zero, expected gain is single-digit members per week (ESTIMATE from the 2023 experiment). Paid tiers are not worth testing before Reddit.

### 2.12 Giveaway platforms and fraud

- Gleam pricing: **conflicting secondary sources** — KickoffLabs (2026) "Free plan with Gleam branding. Paid plans from $10/month"; a search summary quoted "$59 … to $399 per month"; Gleam's own pricing pages returned 403/404 to this session — UNVERIFIED. Fraud: Gleam's FAQ titles ("Prevent Spam or Bot Entries", "Fraud Filter, Fraud Levels, and CAPTCHA") appeared in search results; KickoffLabs claims "No built-in fraud detection at lower tiers" for Gleam — contradictory, UNVERIFIED.
- KingSumo: FACT (pricing page) — free plan with unlimited giveaways; paid tier a one-time "$49" (list "$228") via AppSumo; no fraud features listed.
- Vyper: FACT — redirects to Blitz Rocket; $19/$49/$99/$199 per month; "Bot detection, AI fraud detection, Real-time suspicious activity scoring" listed as features; "No AI verifications" on the $19 plan.
- Rafflecopter: FACT (KickoffLabs 2026) — "ceased operations in 2025".
- Bot/fraud reality: giveaway aggregator sites (gleamgiveaways.com, giveawaylisting.com) appeared in search results — they exist to funnel serial entrants to every listed giveaway; a paid campaign that lands on a public giveaway page will also attract that traffic for free. TechPlay already gates entry behind an account (`auth` middleware on `/giveaways/{slug}/enter`) — FACT — which is stronger than most third-party tools' email-only entry, but means each fraudulent entrant is also a fake registration polluting the 60-user base.
- RECOMMENDATION: keep giveaways on the in-house system; add a fraud score (disposable-email domains, IP velocity, entries with zero other activity) before running paid traffic to a giveaway; never count a giveaway-only account as a "registration" KPI.

### 2.13 Push-notification re-engagement

- FACT (OneSignal pricing): free tier "Max 10,000 subscribers per send" for web push; Growth "Starts at $19/mo" + "$0.004 per web push subscriber". At 10,000 web push subscribers that is ~$59/month — ESTIMATE.
- OBSERVATION: no web-push implementation found in the frontend (no service-worker push registration grepped) — UNVERIFIED negative; README lists 20 database-only notification classes and a `WeeklyDigestNotification` nobody receives (§20).
- Fit: this is not paid media but the cheapest retargeting TechPlay could own — a push opt-in on GTA 6 hub pages ("notify me when Rockstar drops news") is a first-party audience that no consent-denied pixel can take away. Opt-in rates UNKNOWN.

### 2.14 Content-recommendation networks (Taboola, Outbrain, MGID)

- FACT (Digiday, 15 Nov 2016): Slate and The New Yorker removed the widgets because testing showed "it makes people angry"; premium publishers saw "at least four or five objectionable links per week" slip through; "The money is real, and that's the problem."
- FACT (Marketing Brew, 8 Sep 2021): Taboola and Outbrain are the primary distribution for made-for-advertising sites; Jounce Media put MFA at "approximately 12.3% of global programmatic web display ad spend"; brands including Nike, CVS, Disney appeared there unknowingly. (The ANA 2023 study page returned 404; its 21%-of-impressions figure is therefore not cited here.)
- Search-snippet-level claims: MGID "more permissive content policy", "30–50% cheaper" than Taboola/Outbrain (Brax; vendor) — consistent with lower quality.
- RECOMMENDATION: reject as a **buy side** (TechPlay's ads next to "one weird trick" is a brand cost) and as a **sell side** (the widget on TechPlay pages is the same reputational hit that made Slate remove it). Fit 1 everywhere.

### 2.15 Policy constraints consolidated: giveaways, gambling-like mechanics, minors

**Giveaways / sweepstakes**

| Platform | Rule (as fetched) | TechPlay exposure |
|---|---|---|
| Meta (Pages, Groups, Events policy) | FACT: promotions must comply with law (official rules, eligibility disclosed); entrants must release Meta and acknowledge non-association; "must not require or incentivize participants to share, repost, tag others, or in any other way publicize your promotion" | `share_giveaway` and `twitter_retweet` tasks incentivise publicising; `youtube_subscribe`/`twitter_follow` are entry actions on *other* platforms (Meta policy silent on those). Ads for a giveaway whose page carries share tasks risk rejection |
| Google Ads (gambling & games policy) | FACT: "Prize promotions by retailers promoting goods/services are out of scope of this policy"; raffles and prize draws require licensing in some jurisdictions (UK example) | A free-entry sweepstakes is out of scope of the gambling policy; landing page still needs visible official rules, no-purchase-necessary, eligibility and end date (general Misrepresentation policy — not fetched, UNVERIFIED wording) |
| TikTok (gambling & games ad policy) | FACT: sweepstakes/giveaways are "Promotional events where participants can win prizes by chance, typically with no purchase required. These are product-focused promotions, not ongoing games of chance." | The in-house giveaway is a one-off with an end date — fits the definition. A permanent rolling giveaway with daily bonus entries would drift toward "ongoing games of chance" — RECOMMENDATION: keep end dates on every giveaway |
| TikTok (Branded Content Policy) | FACT: commercial content disclosure toggle required; product/service must be clear without visiting the profile | Any creator post boosted via Spark Ads for a giveaway must carry the toggle |
| Reddit | Promotions rules not fetched — UNKNOWN | Assume no-purchase-necessary + rules link as elsewhere |
| General (US) | Prize + chance + consideration = lottery; remove one (sweepstakes = no consideration) — restated by every legal guide in search results (secondary) | Entry currently requires an account (FACT). Whether "create an account" counts as consideration varies by state — UNKNOWN; the standard mitigation is a free alternative method of entry (AMOE). Legal review needed before paid US promotion |

**Gambling-like mechanics (XP, ranks, daily bonus entries, loot)**

- FACT (Google): gambling is "staking something of value on the outcome of events or processes determined by an element of chance with the opportunity to win something of value." TechPlay's XP has no stake and no prize of value; ranks and achievements are not gambling. OBSERVATION.
- FACT (TikTok): "surprise-based products: Purchases that offer guaranteed rewards, where the exact reward is unknown, such as mystery boxes" need market-specific review. TechPlay sells nothing of the kind (shop has 0 products, README §1) — no exposure unless a loot-box-style mechanic is added to the shop.
- Meta's online gambling and games policy page could not be fetched (404 on two URL variants) — UNVERIFIED; from platform experience Meta requires written permission for real-money gambling and treats social casino as restricted. XP-for-comments does not trigger either. HYPOTHESIS: the only TechPlay mechanic a reviewer might flag is *daily bonus giveaway entries* ("come back every day for another chance") in ad copy — keep it out of ad text.
- Google teens policy: gambling is a restricted category for under-18s (FACT); irrelevant to TechPlay unless giveaway ads are misclassified — another reason to keep "chance"/"win" language minimal and the rules link prominent.

**Minors**

- Meta: FACT — under-18 delivery uses age and location only (Feb 2023). Retargeting/custom audiences for teens: UNVERIFIED for 2026 (vendor claims only).
- Google/YouTube: FACT — no ads personalisation for under-18s across YouTube, Display, Search; policy hub consolidated 15 Jan 2025.
- TikTok: the age-targeting help article returned "no longer exists" — minimum targetable age UNKNOWN from this session; gambling ads to minors prohibited (FACT).
- RECOMMENDATION: 18+ on every ad set on every platform. Gaming skews young, but a teen acquired by ads cannot be followed by any retargeting system, and TechPlay's terms (`/terms`, not read) presumably set an age floor — UNKNOWN. Nothing is lost by excluding under-18s from *paid* acquisition; organic reach to them is unaffected.

---

## 3. Budget scenarios (ESTIMATE ranges; nothing promised)

Assumptions used for arithmetic only: Meta lead-objective CPC ~$0.90–1.90 and CPM ~$8–30 (LocaliQ/AdAmigo/Gupta ranges above); Reddit CPC ~$0.75–2.00; TikTok $50/day floor. Registration conversion rate from an ad click is UNKNOWN for TechPlay — the README's onboarding funnel events exist but no rates were read. Every "could yield" below is a range from benchmark arithmetic, not a forecast.

### $300 / month
- What it is: a measurement month, not a media month. ~$0 media until Pixel+CAPI, GA4 conversion events and UTM discipline exist (§4). Then:
  - Google Search branded exact-match: ~$60–90 (≈$2–3/day). Yield: protection + a real branded CPC number.
  - One Meta campaign, US only (default-granted consent), Advantage+ audience, objective Leads → on-site `newsletter_verified` or `CompleteRegistration`: ~$200. At $8–15 CPM that is 13–25k impressions; at $0.90–1.90 CPC 100–220 clicks; at a 5–15% click→verified rate (LocaliQ Arts & Ent. lead CVR 15.31% is an *instant-form* rate and an upper bound), 5–30 conversions — enough to learn the CPC, not enough to learn the CPA.
- Reddit at $5/day is possible inside $300 but would crowd out Meta; pick one.
- Not feasible at this level: TikTok ($50/day floor), Demand Gen (budget ≥10× tCPA), any retargeting (pools too small).

### $1,000 / month
- Branded search: ~$90.
- Meta Leads, US + UK/DE/FR with CMP consent: ~$450 (two ad sets: registration vs newsletter; three creatives each).
- Reddit: ~$300 (≈$10/day) across 3–5 named subreddits, Conversation Placement, one hub (GTA 6) and one tool (Backlog Advisor or WoW Analyzer) — measured on `discord_click`, `wizard_shown` and registrations.
- Reserve ~$160 for a free Discord listing push (zero cost) and for creative production (screen recordings; no external cost assumed).
- ESTIMATE of learnings: 300–800 paid clicks total; a first read on which of registration / newsletter / Discord has the lowest cost per verified action; still below the ~50 conversions/week that both Meta and TikTok optimisation reportedly need.

### $3,000 / month
- Adds TikTok Spark Ads at the $50/day floor for two weeks (~$700) boosting the best-performing organic hub video — only if an organic post exists.
- Meta scales to ~$1,200 with a retargeting ad set once the pixel pool passes ~1,000 US visitors/30 days (Meta minimum is not documented in fetched sources — ESTIMATE from practice; Google's 100-user floor is the documented one).
- Reddit to ~$600 with community expansion.
- Branded + tool-query search to ~$200 (adds exact-match tool queries).
- ~$300 reserve for a paid newsletter swap with one gaming newsletter (Newsletrix $0–3/sub range) — only if list size is known and disclosed honestly.
- Still excluded: Demand Gen, PMax, Display prospecting, X, content-rec. ESTIMATE: 1,500–3,500 paid clicks/month; if registration CPA comes in under ~$10 at this scale it is worth a second quarter; if over ~$25, stop (see stop-losses in §6).

### Allocation summary (ESTIMATE)

| Line | $300 | $1,000 | $3,000 | Gate before spending |
|---|---|---|---|---|
| Measurement build (one-off engineering, not media) | first | done | done | Pixel+CAPI, GA4 key events, UTM helper, collector `utm` columns |
| Google Search — branded exact | $60–90 | ~$90 | ~$200 (adds tool queries) | UTM helper |
| Meta — Leads/Registration, US | ~$200 | ~$450 | ~$1,200 (adds retargeting ad set) | `sign_up`/`email_verified` events via CAPI; 18+ |
| Reddit — communities + Conversation Placement | 0 or swap with Meta | ~$300 | ~$600 | Landing pages for hubs/tools with UTM; bot invite codes |
| TikTok Spark Ads | 0 (floor too high) | 0 | ~$700 (14 days at floor) | An organic video that already performs |
| Paid newsletter swap | 0 | 0 | ~$300 | Known list size; partner disclosure |
| Discord free listings | $0 | $0 | $0 | Server description, bump routine |
| Web push (OneSignal free tier) | $0 | $0 | $0 (<10k subs) | Service worker + opt-in prompt |
| Reserve / creative | rest | ~$160 | rest | — |

Reading the table: at every level at least one third of the money buys *learning about measurement* rather than reach, and no line is funded before its gate. The $300 tier is honest about being unable to reach statistical confidence on a CPA; its job is to produce a CPC and a click→verified rate for T2/T9 in §6.

---

## 4. Measurement plan prerequisites

1. **Conversion definitions** (RECOMMENDATION; none exist as events today — FACT, `lib/track.ts`):
   - `sign_up` — account created (GA4 recommended event name) with `method` = email|discord|battlenet.
   - `email_verified` — `email_verified_at` set (the README's own rule that unverified accounts don't count).
   - `newsletter_submit` and `newsletter_verified` — the second is the KPI.
   - `giveaway_entered` (first entry only; task completions and daily bonuses are engagement, not acquisition).
   - `discord_click` — outbound click on the invite; joins themselves are only visible via the bot (Professor Buffy can log joins with an invite code per campaign — HYPOTHESIS, needs the bot's `guildMemberAdd` handler to read `invite.code`).
   - `library_connected` — first Steam/Xbox/PSN/GOG/Epic import completed (the product's real activation; `wizard_pick_done` is the nearest existing event).
2. **GA4**: mark `sign_up`, `newsletter_verified`, `library_connected` as key events; import to Google Ads only when a Google campaign exists. FACT: GA4 already runs through the first-party relay and Consent Mode v2 with nginx-served defaults (README §19).
3. **Meta Pixel + CAPI behind consent**: browser Pixel gated on the same `analytics_storage`/`ad_storage` signal the CMP produces (`fbq('consent','revoke')` before init in denied regions — FACT, Meta docs); CAPI from Laravel on `sign_up`/`newsletter_verified` with hashed email, `fbp`/`fbc` and a shared `event_id`; LDU flags for US opt-outs if the CMP exposes them (UNKNOWN).
4. **UTM convention** (GA4 supports `utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_term`, `utm_content`, `utm_source_platform`; `utm_creative_format`/`utm_marketing_tactic` are accepted but "isn't currently reported" — FACT, GA4 Help):
   - `utm_source` = platform (`meta`, `reddit`, `tiktok`, `google`, `newsletter`, `discord`), `utm_medium` = `paid_social` | `cpc` | `email` | `community`, `utm_campaign` = `<objective>-<asset>-<yyyymm>` (e.g. `reg-gta6hub-202610`), `utm_content` = creative id, `utm_term` = audience/subreddit. Lower-case everywhere; the collector compares emails lower-case and had a bug when it did not (README §20) — same discipline for UTMs.
5. **First-party collector**: FACT — it drops the query string and keeps only `referrer_host`. RECOMMENDATION: add `utm_source`/`utm_medium`/`utm_campaign` to `analytics_events` and a `campaign` breakdown to `analytics_daily_breakdowns` so paid sessions are visible in the counter that ignores consent. This is the only way to compare EEA paid traffic (invisible to GA/Meta when denied) against US.
6. **Consent in EEA**: the CMP consent rate since 20 Sep 2026 is UNKNOWN; measure it (share of `gcs=G111` among EEA hits — the collector already stores `consent` per hit, FACT) before deciding whether EEA paid tests are readable at all. If EEA consent is <30%, run EEA tests on Reddit/TikTok with a **landing-page counter** (first-party) rather than a platform pixel as the source of truth.
7. **Fraud and bot exclusion**: the collector flags `is_bot`/`bot_reason` (FACT); paid reports must read `is_bot = false` and state how many were excluded, the same way the Filament report does.
8. **Attribution honesty**: the first-party visitor hash rotates nightly (FACT), so "user came back tomorrow" cannot be read from it; D1 return is only visible via `d1_return` for logged-in accounts. Report paid results per *session* and per *account*, never per "user".

### 4.1 Where each prerequisite lands in the repo (OBSERVATION — locations, not a change request)

| Prerequisite | Likely location | Note |
|---|---|---|
| GA4 `sign_up` / `email_verified` | `frontend/lib/track.ts` (`FunnelEvent` union is the single registry) + the register/verify pages under `frontend/app/(auth)/` | Extend the union rather than calling `gtag` inline — the file's own comment says it is the one place |
| `newsletter_submit` / `newsletter_verified` | frontend newsletter form component; `backend` `NewsletterController::verify` for the server-side truth | Verified count must come from the backend: the frontend cannot see the email click |
| `giveaway_entered` | `GiveawayController::enter` (server) | Count first entry only; task completions and `claimDailyBonus` are engagement |
| `discord_click` | `Footer.tsx` `DISCORD_FALLBACK` and any invite CTA | Per-campaign invite codes let Professor Buffy attribute joins; needs the bot's member-add handler to read the invite — UNVERIFIED that discord.js exposes the used invite without an invite-cache diff |
| `library_connected` | wherever `wizard_pick_done` is fired; or the `Sync*Library` jobs on first successful completion | Server-side is more reliable; job completion already exists |
| Meta Pixel + CAPI | Pixel in `frontend/app/layout.tsx` behind the consent signal; CAPI as a Laravel job dispatched from the model events above | Must respect `next.config.ts` CSP (`connect.facebook.net`, `www.facebook.com`) — README §19 records the CSP trap with the Google CMP domain |
| UTM helper | one backend helper used by `mail_campaigns` links and by admin-generated ad URLs | Single spelling; the cache-key lesson from CLAUDE.md applies |
| Collector `utm_*` columns | `AnalyticsCollector::path()` currently discards the query string by design; a sibling method would parse `utm_source/medium/campaign` before dropping the rest; `RollUpAnalytics::breakdown()` gains a `campaign` dimension | Changes `analytics_events` schema → README §8 must be updated in the same commit |
| Consent rate readout | `analytics_events.consent` (`gcs`) by country | Already stored; a Filament chart is enough |

### 4.2 Test-readability thresholds (ESTIMATE, from platform norms; no official 2026 figure fetched)

- A CPC estimate is stable after ~200 clicks; a CPA estimate after ~30 conversions; platform learning phases are reported at ~50 conversions/week/ad set (Stackmatix for TikTok, uncited; Meta's published figure was not fetched — UNVERIFIED). At the LocaliQ Arts & Entertainment lead numbers ($0.88 CPC, 15% CVR) 30 conversions cost ≈ $175 — which is why the $300 tier can produce one readable CPA and no more.
- Any test whose stop-loss in §6 triggers before 200 clicks reports a CPC and a *ceiling* on conversion rate, not a CPA.

---

## 5. What NOT to do

1. **Do not buy pageviews.** A paid click that ends in one article view earns one AdSense impression (RPM unknown to this research; not in README). No published CPC in §2 is below what a single AdSense impression pays. The brief's rule stands on arithmetic.
2. **No traffic arbitrage** (buying cheap clicks to sell as programmatic impressions) — that is the MFA model Marketing Brew documented brands fleeing (12.3% of spend, Jounce 2021); it also breaches the spirit of AdSense policy on invalid/incentivised traffic (policy text not fetched — UNVERIFIED wording, well-known rule).
3. **No content-recommendation networks**, buy or sell side (§2.14).
4. **No boosting random posts** from the Facebook/Instagram Page: worst targeting (Business Suite lost interests 21 Aug 2025), no conversion optimisation, no UTM discipline.
5. **No game-name keyword buying** on Search (§2.3).
6. **No Performance Max or Demand Gen** before ≥100 ad-attributed conversions exist — both are AI campaigns that need a conversion signal and will otherwise spend on Display/Discover pageviews.
7. **No X Ads** (§2.9).
8. **No paid giveaway traffic** until the share/retweet tasks are reviewed against Meta's Promotions policy and a fraud score exists (§2.12); do not count giveaway-only sign-ups as registrations.
9. **No teen targeting** — set 18+ everywhere; teens cannot be retargeted on Meta or Google (FACT), so acquiring them via ads is buying an audience the funnel cannot follow.
10. **No pixel before consent in EEA/UK/CH** — README §19 records that TechPlay once tracked people who had said no; Meta's own GDPR page puts compliance on the advertiser.
11. **No hand-written cache keys** — irrelevant to ads, but the same lesson: build the UTM in one helper (backend `CampaignUrl::build()` or similar), not in six campaign fields by hand.
12. **Do not promise a CPA** from the benchmarks in §2; every number is a vendor panel and several disagree by 2×.

---

## 6. Test roadmap candidates (all HYPOTHESIS; not sequenced, not budgeted)

| # | Hypothesis | Channel | Audience | Creative | Primary KPI | Stop-loss |
|---|---|---|---|---|---|---|
| T1 | A branded exact-match campaign is near-zero cost and reveals whether anyone bids on "techplay" | Google Search | Exact: techplay, techplay gg, techplay wow analyzer, techplay backlog advisor | 2 RSAs, sitelinks to /games, /wow-analyzer, /backlog-advisor | Impression share, CPC | Pause if CPC > $1.00 or <10 impressions/week after 14 days |
| T2 | A library-import demo converts gamers to accounts cheaper than a content ad | Meta Leads (on-site CompleteRegistration), US, 18+, Advantage+ | Broad US 18–44 | 6–15 s screen recording of the Steam/Xbox/PSN wizard; tagline | Cost per `email_verified` | $150 spent with <5 verified accounts |
| T3 | GTA 6 hub cards out-click generic "gaming news" creative | Meta / IG (traffic vs leads split) | Same as T2 | Carousel: map, vehicles, weapons, characters, each deep-linked | CTR and cost per `sign_up` | CTR <1% at 5k impressions |
| T4 | Conversation Placement in r/GTA6-type threads drives Discord joins at <$3 | Reddit | 3–5 GTA 6 / gaming subreddits, Conversation Placement | Post-style ad: "We catalogued 1,058 GTA 6 locations…", CTA Discord | Cost per `discord_click`; joins via bot invite code | $100 with <20 Discord clicks |
| T5 | WoW Analyzer as a tool ad in WoW subreddits beats any article ad | Reddit | r/wow, r/CompetitiveWoW, r/wownoob (sizes UNVERIFIED) | Screenshot of an analysis result; "paste your character" | Analyses run per $; registrations | $100 with <30 analyses or Groq cost > ad cost |
| T6 | Backlog Advisor resonates with "too many games" communities | Reddit | r/patientgamers, r/ShouldIbuythisgame, r/Steam | Screen tour of the advisor output | `wizard_shown` → `library_connected` | CTR <0.2% (Stackmatix threshold) |
| T7 | Exact-match tool queries have real volume | Google Search | "wow raid readiness", "what should I play next", "backlog tool" (volumes UNKNOWN) | RSA to the tool | Impressions/week, CPC, tool runs | <20 impressions/week after 14 days |
| T8 | A Spark-boosted GTA 6 map video reaches under $6 CPM | TikTok Spark Ads | US 18+ broad; Community Interaction or Traffic | Best existing organic video (if any) | CPM, profile visits, `utm` sessions in first-party counter | $350 (7 days at floor) with CPM > $10 or 0 registrations |
| T9 | Newsletter double-opt-in from ads costs less than $8 | Meta Leads, on-site form | US + consented UK/DE | "Weekly release calendar + one giveaway" value prop | Cost per `newsletter_verified` | $100 with 0 verified |
| T10 | Retargeting registration-starters recovers 10% of them | Meta retargeting | Pixel audience: visited /register or wizard step, no `sign_up`, 7 days (needs pool; UNKNOWN when) | "Finish setting up your library" | Cost per `sign_up`, recovered share | Pool <500 after 30 days → skip |
| T11 | Free Discord listings deliver measurable joins | Disboard + Discadia (free) | Tag browsers | Server description + invite with unique code | Joins/week by invite code | None (free); drop if 0 joins in 4 weeks |
| T12 | A paid swap with one gaming newsletter beats Meta on cost per verified subscriber | Paid newsletter swap | Partner's list (unknown) | One dedicated blurb with UTM | Cost per `newsletter_verified` | Do not run before TechPlay's list size is known |
| T13 | Giveaway ads pull entrants who also connect a library | Meta or Reddit → in-house giveaway | US 18+ | Prize + "no purchase necessary" + rules link; tasks without share/retweet | Entrants with `library_connected` within 7 days | >70% of paid entrants have zero other activity → stop |
| T14 | Push opt-in on GTA 6 pages builds a re-engagement list for free | Web push (OneSignal free tier) | Hub visitors | "Notify me on GTA 6 news" prompt after 30 s | Opt-in rate, click rate on first push | <1% opt-in after 2 weeks |
| T15 | Shorts CPM is cheap enough for a 15-second WoW Analyzer demo | YouTube Shorts (Demand Gen or Video views) | US 18–34 | Vertical demo | CPM, view rate, `utm` sessions | CPM > $8 or 0 tool runs after $150 |

Sequencing note (RECOMMENDATION, not a plan): T1 and T11 cost ~nothing and can start once UTM helpers exist; T2/T4/T9 are the first paid reads; T8/T10/T15 wait on assets and pools.

### 6.1 Creative and format quick reference (FACT where sourced from platform docs)

| Platform | Formats and specs fetched | TechPlay asset that fits |
|---|---|---|
| Google Demand Gen | Image 1.91:1, 4:5, 1:1 (+1:1 logo); video landscape/portrait/square/vertical; carousel 2–10 cards (Google Ads Help) | GTA 6 hub carousel (vehicles / weapons / characters / map); WoW Analyzer 4:5 result card |
| TikTok Spark Ads | Boost an existing organic post (own or creator-authorised); video under 10 minutes; up to 10,000 Spark Ads per account (TikTok help) | Requires an organic video first — none confirmed |
| Reddit | Promoted posts (image/video/carousel), free-form posts; Feed and Conversation Placement (vendor guides) | Post-style copy with a first-person "we catalogued…" line; screenshot of the tool result |
| Meta | Advantage+ placements across Feed/Reels/Stories; instant forms or on-site conversion (Meta docs unreadable; vendor benchmarks) | 6–15 s wizard screen recording; static "3 stores, one library" card |
| YouTube Shorts / in-feed | Vertical short video (benchmarks only; format page not fetched) | 15 s WoW Analyzer demo |
| Discord listings | Server description, tags, invite | Tags per hub (gta6, wow, pc, playstation, xbox) |

Creative principles that recur across the fetched sources and apply to TechPlay's assets: show the product in the first 3 seconds (Reddit gaming guide); prefer raw footage to polished trailers (same); make the offer legible on-screen without visiting the profile (TikTok Branded Content Policy); put official-rules and no-purchase-necessary language in the primary text for any giveaway (Meta Promotions policy).

---

## 7. Sources used

Official platform documentation (fetched 2026-09-27):
- https://support.google.com/google-ads/answer/13695777?hl=en — About Demand Gen campaigns
- https://business.google.com/us/ad-solutions/demand-generation/ — Demand Gen product page
- https://support.google.com/google-ads/answer/10724817?hl=en — Performance Max
- https://support.google.com/google-ads/answer/2472738?hl=en — Remarketing/data segment minimum list sizes
- https://support.google.com/adspolicy/answer/6018017?hl=en — Google Ads gambling and games policy
- https://support.google.com/adspolicy/answer/12205906?hl=en — Ad-serving protections for teens
- https://developers.google.com/tag-platform/security/guides/consent — Consent mode (ad_user_data, ad_personalization)
- https://www.google.com/about/company/user-consent-policy/ — EU User Consent Policy
- https://support.google.com/analytics/answer/10917952?hl=en — GA4 UTM parameters
- https://www.facebook.com/policies_center/pages_groups_events/ — Meta Pages, Groups and Events policy (Promotions)
- https://about.fb.com/news/2023/01/age-appropriate-ads-for-teens/ — Meta teen advertising changes
- https://developers.facebook.com/docs/meta-pixel/implementation/gdpr — Meta Pixel GDPR consent
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters — CAPI matching parameters
- https://developers.facebook.com/docs/marketing-apis/data-processing-options — Limited Data Use
- https://ads.tiktok.com/help/article/budget — TikTok Ads Manager budget minimums
- https://ads.tiktok.com/help/article/spark-ads — Spark Ads
- https://ads.tiktok.com/help/article/tiktok-ads-policy-gambling-and-games — TikTok gambling and games policy
- https://www.tiktok.com/legal/page/global/bc-policy/en — TikTok Branded Content Policy
- https://discord.com/ads/quests — Discord Quests
- https://discord.com/press-releases/discord-launches-newest-ad-format-and-partners-with-appsflyer-gamesight-for-ads-measurement — Discord Arena Quests press release (2 Oct 2025)
- https://on.substack.com/p/substacks-recommendations-network — Substack recommendations (22 Feb 2024)
- https://www.beehiiv.com/features/boosts — beehiiv paid recommendations
- https://sparkloop.app/partner-network — SparkLoop Partner Network
- https://sparkloop.app/upscribe — SparkLoop Upscribe
- https://onesignal.com/pricing — OneSignal pricing
- http://kingsumo.com/pricing — KingSumo pricing
- https://blitzrocket.com/pricing — Vyper → Blitz Rocket pricing

Benchmarks and trade press (fetched 2026-09-27; vendor panels — ESTIMATE quality):
- https://localiq.com/blog/facebook-advertising-benchmarks/ — LocaliQ/WordStream Facebook benchmarks 2026
- https://localiq.com/blog/search-advertising-benchmarks/ — LocaliQ search benchmarks 2026 (updated 1 Jun 2026)
- https://www.guptamedia.com/social-media-ads-cost — Gupta Media CPM tracker (Oct 2025)
- https://www.adamigo.ai/blog/meta-ads-benchmarks-2026-by-objective-and-placement — Meta benchmarks by objective/placement
- https://paceads.com/research/meta-ads-statistics-2026 — Meta CPM by country, Reels share, Advantage+ incrementality
- https://www.socialmediatoday.com/news/meta-removes-more-detailed-ad-targeting-options-facebook-instagram/757856/ — Meta detailed targeting consolidation (17 Aug 2025)
- https://social-media-management-help.brandwatch.com/en/articles/13215856-meta-changes-to-detailed-targeting-interests-in-advertise — deprecation dates 15 Dec 2025 / 15 Jan 2026
- https://www.auditsocials.com/blog/meta-teen-ad-targeting-restrictions-parental-controls-2026-age-gated-campaigns — 2026 teen claims (no Meta source; UNVERIFIED)
- https://ppc.land/google-tightens-advertising-rules-to-protect-minors-across-its-platforms/ — Google children/teens policy consolidation (15 Jan 2025)
- https://www.digitalapplied.com/blog/youtube-ads-benchmarks-2026-cpv-cpm-ctr-industry — YouTube benchmarks (20 Apr 2026)
- https://www.storegrowers.com/youtube-ads-benchmarks/ — YouTube benchmarks compilation
- https://www.enrichlabs.ai/blog/tiktok-spark-ads-complete-guide-2026 — Spark Ads benchmark claims and TikTok "Spark Ads 101" quotes
- https://www.stackmatix.com/blog/tiktok-ads-minimum-daily-budget-2026 — TikTok minimums (8 Sep 2026)
- https://www.stackmatix.com/blog/reddit-ads-minimum-budget-requirements-2026 — Reddit minimum budget
- https://www.stackmatix.com/blog/reddit-ads-cost-pricing-guide-2026 — Reddit costs, Conversation Placement (11 Sep 2026)
- https://www.stackmatix.com/blog/reddit-advertising-gaming — Reddit gaming targeting (3 Sep 2026)
- https://97thfloor.com/articles/reddit-advertising-guide-2026/ — Reddit guide (24 Apr 2024)
- https://www.marketingdive.com/news/tiktok-pitches-advertisers-on-bold-new-chapter-under-us-joint-venture/815632/ — TikTok US JV NewFronts (25 Mar 2026)
- https://www.storika.ai/guides/tiktok-us-joint-venture-influencer-marketing — what changed for brands after 22 Jan 2026
- https://trueinteractive.com/blog/where-does-x-stand-with-advertisers-in-2026/ — X ad revenue, Kantar 2025 (7 Jul 2026)
- https://www.shno.co/marketing-statistics/twitter-ads-statistics — X statistics roundup with attributed sources
- https://digiday.com/media/links-web-ad-units-terrible/ — content-rec widgets (15 Nov 2016)
- https://www.marketingbrew.com/stories/2021/09/08/brands-still-playing-ball-clickbait-ad-sites-advertisings-roach-will-survive-bomb — MFA and Taboola/Outbrain (8 Sep 2021)
- https://newsletrix.com/blog/newsletter-subscriber-acquisition-cost-benchmarks — newsletter CPA by channel (28 May 2026)
- https://blog.communityone.io/underrated-discord-growth-engine/ — Discord listing-site experiment (20 Dec 2023)
- https://dis.ad/en/guides/best-discord-server-lists — Discord server lists 2026
- https://kickofflabs.com/blog/best-giveaway-software-tools-2026/ — giveaway tool pricing/fraud (2026)
- https://www.analyticodigital.com/insights/how-setup-meta-capi-on-website — CAPI setup guide (EEA consent-parameter claim, uncited)

Search-result-only URLs (returned by WebSearch, not fetched; used only to note that a page exists):
- https://www.facebook.com/business/help/458835214668072 (Meta "Updates to Detailed Targeting" — JS-only, unreadable)
- https://www.facebook.com/business/help/229435355723442 (Meta "About Advertising to Teens" — JS-only, unreadable)
- https://gleam.io/faq/technical-and-troubleshooting/prevent-bot-entries-giveaway, https://gleam.io/faq/competitions/actions/how-do-you-handle-cheaters (403)
- https://variety.com/2025/gaming/news/discord-arena-quests-ad-sponsored-games-1236536780/ (paywalled redirect)

Repository files read: `docs/README.md` (§1, §5, §12, §19, §20), `frontend/lib/track.ts`, `frontend/components/analytics/ConsentAwareAnalytics.tsx`, `frontend/components/layout/Footer.tsx`, `backend/app/Services/AnalyticsCollector.php`, `backend/app/Console/Commands/RollUpAnalytics.php`, `backend/app/Filament/Resources/GiveawayResource.php`, `backend/app/Http/Controllers/Api/V1/GiveawayController.php`, `backend/routes/api.php`.

---

## 8. Gaps / needs more data

1. **EEA CMP consent rate since 20 Sep 2026** — UNKNOWN; decides whether EEA paid tests are measurable via platform pixels at all. Readable today from `analytics_events.consent` (`G111` share by country).
2. **Newsletter list size and Discord member count** — not in README's measured tables; needed to size swaps (T12) and to judge T4/T11.
3. **Whether TechPlay has TikTok/Instagram/YouTube accounts with posts** — Footer has slots (`tiktok_url`, YouTube task type) but existence and content are UNVERIFIED. Spark Ads and Reels are impossible without them.
4. **Meta interest availability for "video games"/"PC gaming" after the 15 Jan 2026 deprecation** — UNVERIFIED; needs a look inside Ads Manager.
5. **Official Reddit documentation** — `business.reddit.com` and its help centre were unreachable; minimums, Conversation Placement and "MAX Campaigns" rest on vendor guides and are marked reported/unconfirmed.
6. **Gleam pricing and fraud tiers** — sources conflict ($10/mo vs $59–399/mo); Gleam's own pages returned 403/404.
7. **Google Display CPC/CPM 2026** and **Meta Instant Forms vs Conversion Leads documentation** — not fetched (403 / JS-only); Display marked UNKNOWN, Instant Forms discussed from product knowledge only.
8. **Search volumes for tool queries** ("wow analyzer", "backlog advisor") — no keyword tool; only a live exact-match test (T7) or Search Console can answer.
9. **AdSense RPM** — not in README; the "do not buy pageviews" argument is qualitative until RPM is known.
10. **Meta custom-audience minimum size 2026** — not documented in fetched sources (Google's 100-user floor is); the T10 pool threshold (~500) is a working ESTIMATE.
11. **ANA MFA study (2023) figures** — page 404; only the 2021 Jounce 12.3% figure is cited.
12. **Kantar Media Reactions primary pages** — 404; X trust figures are second-hand via two trade sources.
13. **Web search budget** was exhausted at 200 calls for the whole session before the last ~8 planned queries (Meta instant forms, Reddit MAX official, Disboard mechanics, branded-search evidence, ANA MFA, PMax lead quality, Display benchmarks); those items are covered from fetched pages or marked UNKNOWN above.
