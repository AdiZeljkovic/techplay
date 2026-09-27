# 20 — Newsletter Intelligence (and monetisation side effects)

Status: Phase 1 research draft — 27 Sep 2026
Scope: Part 24 (newsletters) and, as the last chapter, Part 25 (how different kinds of growth could later support revenue).

The video-and-newsletter agent was stopped before it researched this topic. This file draws on the repository (docs/README.md §20, 01), the paid-media research on newsletter acquisition (16), competitor newsletter pages fetched for 04, and Future plc's published results (04 Part C).

## Executive summary

1. **FACT — TechPlay owns a capable, underused mail system.** Double opt-in, one-click unsubscribe, a suppression list, four audience segments with XP and recency filters, open and click tracking with signed links, and paced sending (10 messages every 3 seconds by default). Every campaign is written and sent by hand (docs/README.md §20, 01 Part B).
2. **FACT — No automated email goes out.** The Friday weekly digest exists but is delivered only to the on-site bell. Release reminders, wishlist notices and comment replies are also bell-only (01 Part B).
3. **FACT — Capture is weak.** Three sign-up points: section-hub sidebars ("Stay in the loop — The bigger stories, sent when there is something worth sending."), the GTA 6 hub ("Join thousands of fans…", an unverified claim), and the Frontiers teaser, which writes into the same list with no tag. None on the homepage, articles, game pages or calendar. The unsubscribe page links to a `/#newsletter` anchor that does not exist (01 Part A).
4. **FACT — Deliverability is the binding constraint.** TechPlay sends from its own server, which "arrives at Gmail without any reputation"; the pacing exists for that reason, and DNS, SPF, DKIM, DMARC and SMTP must not be changed without asking (docs/README.md §14, §20).
5. **FACT — Competitors' newsletters are mostly generic.** Future's TechRadar prompt is a single "daily insight, inspiration and deals"; GamesRadar+ sends "weekly digests"; Wccftech a daily digest; Kotaku "Level up your inbox"; Game Rant "The best of GameRant, directly in your inbox" (04). Hookshot's sites have no dedicated newsletter page (04 Part B).
6. **FACT — Newsletter-first media businesses exist at small scale.** Game File has 29K+ subscribers at $10 a month (04 Part C). Aftermath and other worker-owned outlets rely on memberships.
7. **FACT — The cheapest paid subscriber sources require leaving self-hosting.** beehiiv's paid recommendations (an example of $2.20 per verified subscriber), SparkLoop ($2–20 per subscriber) and Substack recommendations (Substack says they drive half of new subscriptions on its platform) only work for lists hosted there (16).
8. **HYPOTHESIS — TechPlay's newsletter advantage is personalisation from shelves.** "Your releases this week", "your wishlist is on sale" and "your friends started playing X" are emails no generic gaming newsletter can send.

## 1. Frequency, format and voice (OBSERVATION from competitors)

| Publisher | Cadence | Promise |
|---|---|---|
| Wccftech | daily | "An everyday digest of the latest technology news" |
| GamesRadar+ | weekly | "Weekly digests, tales from the communities you love" |
| TechRadar (Future) | daily | "Daily insight, inspiration and deals" |
| Kotaku | not stated | "Level up your inbox—Don't miss the latest reviews, news and tips" |
| Game Rant | not stated | "The best of GameRant, directly in your inbox" |
| Rock Paper Shotgun | not stated; supporters get a monthly editor's letter | — |
| Game File | daily, paid | Reporting from Stephen Totilo (04 Part C) |
| Steam (as a model) | event-driven | Wishlist items released or discounted (Steamworks) |

**Lesson:** the generic digest is table stakes and interchangeable. A newsletter with a clear job (a date, a price, a personal list) is not.

## 2. Proposed newsletter products (HYPOTHESIS, for the planning phase)

| Product | Audience | Cadence | Content | Data source | Personalised? |
|---|---|---|---|---|---|
| "This week in games" | all subscribers | weekly (Friday) | 5–7 stories, releases this week, one data point, one community item | editorial + calendar | no |
| "Your releases this week" | members with wishlists or reminders | weekly (Monday) | Games from your list releasing, pre-load dates, price | reminders, wishlist | **yes** |
| Price-drop alert | members with wishlists | event-driven | "X is 40% off" | nightly Steam prices | **yes** |
| GTA 6 briefing | GTA 6 sign-ups | weekly to launch, then daily launch week | Confirmed vs rumoured, dates, tools | GTA 6 hub | segment |
| WoW weekly | WoW Analyzer users | weekly (reset day) | Patch notes summary, Analyzer prompt | Analyzer | segment |
| Monthly data report | all | monthly | One TechPlay dataset story (14) | database | no |

The weekly digest already assembled for the bell is the natural seed for "your releases this week".

## 3. Conversion (placements)

- **Evidence of what exists:** GR+ gates a GTA 6 franchise page behind a newsletter sign-up; Kotaku, RPS and Game Rant place newsletter links in the header navigation (04).
- **RECOMMENDATION (placements to test):** end of every article (today there is only an account prompt), game pages ("email me when it releases"), calendar pages, homepage, and the Discord welcome message.
- **Honesty rule:** remove "Join thousands of fans" until it is true; the register page's "15K+ MEMBERS" has the same problem (02).

## 4. Retention and deliverability

- **Welcome series:** one confirmation (exists), one welcome that asks what platforms you play (feeds segments), one "link your library" nudge.
- **Re-engagement:** suppress non-openers and non-clickers after a set period, because a self-hosted sender cannot afford complaint rates; unsubscribe links are deliberately untracked so they always work (README §20).
- **Measurement:** clicks are the trusted metric; opens are a floor because of Apple Mail Privacy Protection and Gmail proxying (README §20).
- **Benchmarks:** Mailchimp's public benchmark page states it was last updated in December 2023; no reliable 2026 gaming benchmark was captured.

## 5. Sponsorship potential

- **FACT:** Future reports direct advertising up while programmatic falls (UK +9% direct vs −19% programmatic in H1 2026, 04 Part C). Direct, contextual sponsorship is where the market is moving.
- **HYPOTHESIS:** a segmented list (for example "PC players who own more than 200 Steam games") is sellable to hardware and game publishers at small size, if the numbers are real and consented.
- **UNVERIFIED:** newsletter sponsorship CPM ranges for gaming were not captured this session.

## 6. Metrics

| Metric | Definition |
|---|---|
| Verified subscribers | Double-opt-in confirmed, not suppressed |
| Capture rate | Verified sign-ups per 1,000 article views, per placement |
| Click rate | Unique clickers per delivered email |
| Downstream action | Reminders set, shelf adds or sign-ups within 24 hours of a send |
| Complaint and bounce rates | Per send; the first deliverability warning |
| Unsubscribe rate | Per send and per product |

## Monetization side effects of growth (Part 25)

Growth is the goal; this chapter only notes what each kind of traffic could later support, and where monetisation could damage the growth itself.

| Traffic type | Display ads | Sponsorship | Affiliate | Newsletter sponsorship | Premium |
|---|---|---|---|---|---|
| News / Discover | Yes, volatile | Low | Low | Feeds list | No |
| Evergreen guides and fixes | Yes, steady | Low | Hardware fixes → peripherals | Feeds list | No |
| Game database pages | Yes, low value per page | No | Store links, deals | No | No |
| Tools (library, alerts, Analyzer) | Light | Brand-sponsored tools | Price alerts → store affiliate | Segments | Ad-free or supporter tier |
| Hubs (GTA 6, WoW) | Yes | Launch sponsorship | Editions, pre-orders (disclosed) | Segment | No |
| Newsletter | — | Direct sponsor slots | Deals section | Yes | Paid tier later |
| Community (Discord, forum) | No | Event sponsorship | No | No | Supporter roles |

**Evidence and cautions:**

- **FACT — TechPlay monetises through AdSense today.** AdSense limited ads site-wide for "No CMP" until Google's certified CMP replaced TechPlay's banner on 20 Sep 2026 (docs/README.md §19). The US is about 35% of traffic.
- **FACT — Competitors' ad stacks:** GamingBolt runs Playwire; Insider Gaming runs Raptive/AdThrive (04 Part C). Entry thresholds for Raptive, Mediavine and Ezoic were **not fetched** this session and must be checked before any plan relies on them.
- **FACT — Affiliate revenue is shrinking for the biggest player.** Future's organic e-commerce affiliate revenue fell 24% in H1 2026 (04 Part C).
- **FACT — Membership works at the small end.** Hookshot sells $3.99 a month with no paywall; Eurogamer £2.99/$2.99; Game File $10 (04).
- **FACT — Affiliate programmes exist for peripherals:** Newegg through Rakuten; Logitech G has an affiliate page (15). Commission rates were not captured.
- **RECOMMENDATION — Protect the growth engine.** Ad density already pushes the account prompt below three ad units on mobile article pages (01 Part A). Discover's February 2026 update rewards depth and penalises low-quality experiences (07). Heavier ads on thin pages would work against both search recovery and sign-ups.
- **RECOMMENDATION — Disclose affiliate links.** The GTA 6 hub's pre-order buttons are placeholders today; if they become affiliate links, they need a visible disclosure (02 noted none on store links).

## Sources used

`docs/README.md` §14, §19, §20; 01 (Parts A and B); 02; 04 (newsletter pages of TechRadar, GamesRadar+, Wccftech, Kotaku, Game Rant, RPS, Hookshot; Future plc results via Press Gazette and PPC Land); 16 (beehiiv, SparkLoop, Substack, Newsletrix); Mailchimp benchmarks page; Steamworks wishlist documentation; 15 (affiliate programmes).

## Gaps / needs more data

- TechPlay's current subscriber count and past campaign results.
- Current ad-network thresholds (Raptive, Mediavine, Ezoic) and AdSense RPM.
- Gaming newsletter benchmarks for 2026 and sponsorship CPMs.
- Affiliate commission rates for games and peripherals.
