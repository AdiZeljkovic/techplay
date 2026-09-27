# 12 — Retention Intelligence

Status: Phase 1 research draft — 27 Sep 2026
Scope: which daily, weekly and monthly loops bring gamers back to media, community and tracking products; which of them TechPlay already has in code; which fit without becoming manipulative; and how to measure retention for a site that is half publication, half platform.

The retention half of the registration-and-retention agent's assignment was not written before it stopped (its registration file, 11, is complete). This file uses the pages it and the community agent fetched, plus the repository audit (01).

## Executive summary

1. **FACT — TechPlay built nearly every retention mechanic and delivers almost none of them outside the site.** It has release reminders, wishlist release checks, a Friday weekly digest, quests, seasons, streaks, achievements, leaderboards, friends and chat. But 20 of 22 notification types go only to the on-site bell, including the weekly digest and release reminders (01 Part B). A member who does not come back never hears from TechPlay.
2. **FACT — The measured funnel shows where members drop.** Of 55 registered members, 50 confirmed their email, 21 entered a giveaway, 7 commented, 3 added a game and 2 linked a platform; 45 had zero XP (code comment dated 31 Aug 2026, 01 Part B). The library, the product the homepage sells, is where activation fails.
3. **FACT — Steam's own retention loop is the wishlist.** Steamworks documentation: when a game releases or goes on discount, players who wishlisted it "automatically receive a notification". TechPlay has wishlists and nightly Steam prices; it lacks the notification.
4. **FACT — Streak design has a known ethical safety valve.** Duolingo's own blog describes the Streak Freeze, which "allows you to hit pause on your streak for a day", as a deliberate flexibility feature. TechPlay has two separate streak systems (site daily streak paying Bounty; Discord `/daily` paying uncapped XP) with no freeze (01 Part B).
5. **FACT — A major gaming loyalty programme is closing.** PlayStation Stars "fully ends on November 2, 2026" (playstation.com). Reward-points loyalty is not a proven long-term retention model even for platform holders.
6. **HYPOTHESIS — TechPlay's strongest honest loops are "your games changed" loops,** not streaks: your wishlisted game is out, it is on sale, it joined your subscription, your friend started playing it, your WoW character's score moved. Each uses data TechPlay already holds.
7. **RECOMMENDATION — Define retention by action, not visit.** Visits cannot identify returning people in the first-party counter by design (it re-salts IP hashes nightly; docs/README.md §19). Retention must be measured on accounts.

## 1. Retention mechanics TechPlay already has (FACT, 01 Part B)

| Mechanic | Exists | Delivered where | Gap |
|---|---|---|---|
| Release reminders | yes | bell | no email, Discord DM or push |
| Wishlist release and review notices | yes | bell | same |
| Weekly digest (Friday 16:00) | yes | bell only | never emailed |
| Daily streak (site) | yes | site | no freeze; separate from Discord `/daily` |
| Discord `/daily` | yes | Discord | bypasses XP cap and ledger |
| Quests (23 core + 4 seasonal) | yes | owner-only tab | not surfaced in email or Discord |
| Seasons (Ignition Sep–Oct, Overdrive Nov–Dec 2026) | yes | leaderboard timer | no launch announcement; two migrations disagree on dates |
| Achievements (67) | yes | profile | no share card |
| Leaderboards (6) | yes | public | tiny population |
| Friends, chat, presence | yes | site | small network |
| Weekly Discord recap | yes | Discord, Sunday 20:00 | only community stats |
| Comment replies | yes | bell | no email |
| Newsletter | yes (manual) | email | no automation, few capture points |
| Web push | no | — | not built |

## 2. What works elsewhere

### Daily loops

| Product | Loop | Evidence | Notes |
|---|---|---|---|
| Duolingo | Streak with freeze | Duolingo blog on the streak and Streak Freeze | The freeze is the anti-anxiety valve |
| HowLongToBeat | "HowLongToBeat: The Game", a daily guessing game | HLTB homepage; forum thread with 2.4K replies (04C) | Daily reason to visit a database site |
| IGN | IGN Daily Games | IGN page (04 Part A) | Same pattern at a major |
| GuessThe.Game, Gamedle | Daily cover or screenshot guess | Pages fetched (JS apps) | Proven genre for gamers |
| Valnet sites | 21 daily puzzles, Wordle answers | 04 Part B | Search-driven, not loyalty-driven |

### Weekly loops

| Product | Loop | Evidence |
|---|---|---|
| Rock Paper Shotgun | "The Sunday Papers" link round-up | homepage (04 Part A) |
| Hookshot sites | "What Are You Playing This Weekend?", "Box Art Brawl" polls | 04 Part B |
| Reddit r/patientgamers and r/gaming | bi-weekly general discussion threads | Reddit RSS this week (06) |
| Steam | Wishlist release and discount notifications | Steamworks documentation |
| TechPlay | Friday digest (bell), Sunday Discord recap | repo |

### Monthly and yearly loops

| Product | Loop | Evidence |
|---|---|---|
| GamesRadar+ | Monthly RPG Club; monthly clip contest with prizes | 04 Part A |
| HowLongToBeat | Game of the Month (#140 in September 2026) | 04 Part C |
| Steam, Xbox, PlayStation | Year in review (Steam Replay, Xbox YIR, PlayStation Wrap-Up) | pages fetched (sign-in or 404) |
| Backloggd, Letterboxd, Goodreads | Year in review and yearly challenges | Backloggd rate-limited; Letterboxd blocked; Goodreads challenge page thin |

### Notifications and email

- **FACT — Steam** sends wishlist emails on release and discount automatically.
- **FACT — Price trackers** (Deku Deals, IsThereAnyDeal) make alerts the reason to hold an account (04 Part C).
- **FACT — Chrome** moves sites with very low acceptance rates to a quieter permission prompt; iOS supports web push only for Home Screen web apps (07).
- **FACT — Mailchimp's industry benchmark page** states it was last updated in December 2023, so it is not a reliable 2026 baseline (fetched 27 Sep 2026).

### Trust and progression (community retention)

- **FACT — Discourse trust levels** rank members from Basic (reading) to Regular ("the backbone of your community … over a period of months") and Leader, unlocking abilities as trust grows. TechPlay's "first three comments are held" rule is a simple version of Basic.

### Loyalty points

- **FACT — PlayStation Stars ends on 2 Nov 2026.** Points-for-actions programmes are being wound down even by platform holders.

## 3. Fit for TechPlay

| Mechanic | In repo? | Evidence it works elsewhere | Manipulation risk | Recommended form | Measure |
|---|---|---|---|---|---|
| Release-day alert (email/Discord/push) | reminders exist; delivery missing | Steam wishlist emails; Stash, Gamery | Low | Opt-in per game | Alert → visit rate |
| Price-drop alert on wishlist | prices exist (Steam) | Deku Deals, ITAD | Low | Threshold set by user | Alert CTR, affiliate clicks |
| Weekly personalised email ("your week in games") | digest exists (bell) | Newsletters (20) | Low | Weekly, one send day | Open floor, clicks, unsubscribes |
| Discord DM for followed games | bot supports DM subscriptions | SteamDB bot | Low | `/remind` command | Commands used per week |
| Daily guessing game | no | HLTB, IGN, Gamedle | Low–Med (streak pressure) | Daily puzzle with an honest streak and a freeze | Daily players, day-7 return |
| Site streak | yes | Duolingo | **Med–High** | Add a freeze; merge with Discord `/daily`; never punish loss | Streak length distribution |
| Seasons with visible start and end | yes | Live-service games | Med | Public season page; announce in Discord and email | Season participants |
| Quests | yes | Game battle passes | Med | Only quests that do something useful (link a platform, rate 5 games) | Quest completions tied to activation |
| Achievements and badges | yes | PC Gamer badges, Future+ | Low | Share cards; rarity | Share clicks |
| Leaderboards | yes | Hookshot, Raider.IO | Med (small populations feel empty) | Friends-only and weekly "rising" views | Weekly active on boards |
| Comment-reply notifications by email | bell only | All forums | Low | Opt-in, batched | Replies per commenter |
| Monthly club | forum and Discord exist | GR+ RPG Club, HLTB Game of the Month | Low | One game a month, one thread, one Discord event | Participants |
| Year in review across platforms | data exists | Steam Replay, Xbox YIR | Low | December, shareable | Shares, new sign-ups from shares |
| Loyalty points (Bounty store) | yes | PlayStation Stars (ending) | Med | Keep cosmetic; do not expand into a points economy | — |

**Ethical line (RECOMMENDATION):** a mechanic is acceptable if it tells the user something true about their own games or community, and unacceptable if it creates loss aversion for its own sake. Streaks need a freeze and no punishment; notifications need per-topic opt-in; nothing should imitate a slot machine (giveaway entries and Bounty already sit close to that line and should stay cosmetic).

## 4. Proposed retention metrics

Because the first-party counter cannot recognise returning visitors (by design) and GA sees only consenting EEA visitors, account-based metrics are the only reliable ones.

| Metric | Definition | Why |
|---|---|---|
| Activation | Account with a linked platform **or** at least 5 shelf entries within 7 days of sign-up | The library is the core product (see 11 §6) |
| D1 / D7 / D30 retention | Share of activated accounts with any meaningful action (shelf change, rating, comment, list edit, reminder set, Analyzer run) on day 1 / 7 / 30 | Actions, not page views |
| Weekly active members | Accounts with a meaningful action in 7 days | Trend line for the community |
| Notification-driven return | Visits within 24 hours of an email, DM or push, per notification type | Shows which loops work |
| Newsletter health | Clicks per send (opens are a floor), unsubscribe rate, complaint rate | Deliverability from a self-hosted sender |
| Discord health | Weekly messages from distinct members, event attendance | Community pulse |
| Streak honesty check | Share of users who lose a streak and never return | Detects harmful pressure |

## Sources used

Fetched 27 Sep 2026: Duolingo blog, "The Duolingo Streak Uses Habit Research to Keep You Motivated" (https://blog.duolingo.com/how-duolingo-streak-builds-habit/); Steamworks "Wishlists" documentation; PlayStation Stars page (https://www.playstation.com/en-us/playstation-stars/); Discourse blog, "Understanding Discourse Trust Levels" (https://blog.discourse.org/2018/06/understanding-discourse-trust-levels/); Mailchimp email benchmarks page; Google Discover documentation (Follow); HowLongToBeat; GuessThe.Game; Gamedle; Steam Replay; PlayStation Wrap-Up (404). Plus 01, 04 and 07.

## Gaps / needs more data

- Letterboxd, Backloggd year-in-review and Reddit karma pages were blocked or rate-limited.
- No 2025–2026 email or push benchmarks from a reliable source were captured.
- TechPlay's own return rates are unknown; the account-based metrics above need building.
- Which season dates are live in production is unverified (two migrations disagree).
