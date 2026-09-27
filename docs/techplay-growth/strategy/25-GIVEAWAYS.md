# 25 — Giveaways as Funnels

Status: Phase 2 plan — 27 Sep 2026
Part 28 of the growth strategy. Owners: SC (runs giveaways), EIC (prizes, partners, legal sign-off), DEV (mechanics fixes), DS (templates). Campaign IDs follow the spine: C09 is the only giveaway campaign in §8; the others below are sub-IDs of the campaigns they ride on (C71a, C31a, C33a, C36a).

- **The machine is built and has never paid out.** Giveaways have 13 task types, referral codes, a daily check-in streak, a per-giveaway leaderboard and a 5-entries-per-IP limit, and entry needs an account (auth-only endpoint) [R01 B.2.9, R16 §2.12]. No winner has ever been announced; a World of Tanks draw sat undrawn for 207 days; `/giveaways` is `noindex, nofollow` and showed nothing active on 27 Sep [R01, R02 §10].
- **A GTA 6 draw closing 20 Oct is referenced in code** (`JoinPrompt.tsx` comment) but not visible on the live hub. Status: **VERIFY IN ADMIN on Mon 28 Sep** before a single post promotes it (C09).
- **Three code-level defects must be fixed before any giveaway is promoted** (found reading the repo for this plan, not in Phase 1 research): an entrant who completes no task holds 0 points and is excluded from `pickWinner()`, so "free entry" currently means "no chance"; the 5-per-IP limit is checked only in `enter()`, not in the task and daily-bonus paths that also create entries; and all task types except `referral` and `forum_post` are "self-reported by the click alone" (controller comment).
- **Redesign the points so they reward activation, not follows.** Linking a library, adding three games, setting a release reminder and joining Discord (verified by the bot) earn the points. Shares, retweets, tags and referral points are removed from any giveaway that is advertised or posted on Meta surfaces, because Meta forbids requiring or incentivising entrants to share or publicise a promotion [R16 §2.1, §2.15].
- **Q4 calendar (TARGET):** C09 GTA 6 draw (to 20 Oct, if live) → C71a Next Fest Keys (19 Oct–2 Nov, partner keys, $0) → C31a Wishlist Wins (20 Nov–1 Dec, $180) → C33a Winter Keys (1–20 Dec, partner keys + $50). Cash prize cap for the quarter: **$330–$380 TARGET**, plus up to $100 for C09 if its prize is not already bought.
- **The funnel is GIVEAWAY → REGISTRATION → ACTIVATION → NEWSLETTER → COMMUNITY → RETURN**, measured on accounts, with `giveaway_entered` counted on first entry only and giveaway-only accounts never counted as registrations [spine §3, §10; R16 §2.12].
- **Quality gates:** entrant→A2 within 7 days TARGET ≥25%; giveaway-only share at close TARGET ≤60%, hard stop for paid giveaway traffic at >70% (R16 T13); fraud score reviewed before every draw.
- **Official rules template** below (no purchase necessary, eligibility, dates, draw method, winner notification, platform release). **Legal review needed before C09 is promoted and before any paid giveaway traffic**; whether "create an account" counts as consideration in some US states is UNKNOWN [R16 §2.15].
- **Every draw is announced publicly with its method and its entry count**, starting with the overdue World of Tanks draw. A giveaway that never announces a winner is worse for trust than no giveaway [R02 §13 item 16].

---

## 1. What exists today (FACT unless labelled)

| Item | State | Source |
|---|---|---|
| Models | `Giveaway` (rules, prize name/value/type, platform, region, entry_type, starts/ends, winner), `GiveawayEntry` (total_points, referral_code, referred_by, streak_days, ip, user agent), `GiveawayTask`, `GiveawayPrizeTier` | R01 B.2.9; repo |
| Task types | `facebook_like`, `facebook_share`, `instagram_follow`, `youtube_subscribe`, `twitter_follow`, `twitter_retweet`, `discord_join`, `visit_url`, `share_giveaway`, `daily_visit`, `referral`, `forum_post`, `custom` (13; the frontend renders 12) | `GiveawayTask.php`; R01 |
| Verification | Only `referral` (paid when a referred person enters) and `forum_post` (requires a forum post since the giveaway started) are checked. Every other task is credited on click | `GiveawayController::completeTask` comments |
| Points | Default cap 100 per user; max 50 referrals; daily check-in streak bonuses 3 days +5, 7 +10, 14 +20, 30 +50 | `config/giveaway.php` |
| Draw | `pickWinner()` weighted by points using `random_int`; **only entries with `total_points > 0` are eligible**; `pickWinnersByTiers()` for tiered prizes | `Giveaway.php` |
| Entry limits | Account required (auth:sanctum); 10 requests/min; max 5 entries per IP **checked in `enter()` only**; `completeTask()` and `claimDailyBonus()` also `firstOrCreate` an entry and skip the IP check | `routes/api.php` 746–753; controller |
| Reminders | `SendGiveawayReminders` every 6 h, 24 h before end, **bell only**; `giveaways:unfinished` nags admins about undrawn draws daily at 10:00 | R01 B.2.9 |
| Winner notice | `GiveawayWinnerNotification` is database (bell) only | R01 notification table |
| Hub | `/giveaways` is `noindex, nofollow`, not in any sitemap, not linked from homepage SSR; "No draws have been settled yet"; `/giveaway/[slug]` has no canonical | R01 A.1.4; R02 §10 |
| Article slot | While a giveaway is active, `JoinPrompt` swaps the signed-out account panel for "Giveaway · closes {date} … Enter the giveaway" linking `/giveaway/{slug}?from=article` | R01; `JoinPrompt.tsx` |
| Economy link | First entry fires the `giveaway_entered` quest ("Try Your Luck"); points are otherwise a closed economy | R01 |
| Mail | Campaign audience segment `giveaway` (entrants of any or one giveaway) exists for manual mail campaigns | R01 B §20 |
| Discord | `/subscribe giveaway` DM subscription; status line "{n} Active Giveaways"; sidebar card promises "Giveaway pings before they close" | R01; R02 |
| History | 2 giveaways, 21 entries from 55 members (the widest door on the site), 0 winners announced; a World of Tanks draw undrawn for 207 days | R01 |
| GTA 6 draw | Comment in `JoinPrompt.tsx`: "the GTA 6 draw closes on 20 October". Hub showed nothing active on 27 Sep | R02, R11; spine §0 |
| Marketing page | Sells giveaway sponsorship: "You supply the keys or hardware, we run the entry, the draw and the winner contact." | R02 §10 |

**What this means.** The mechanics are richer than most third-party giveaway tools; the problems are policy (share tasks on Meta), fairness (zero-point entrants), abuse (IP bypass, click-credited tasks) and trust (no winner ever shown). All four are cheap to fix. None of the fixes needs a new tool; keep giveaways in-house [R16 §2.12].

---

## 2. The funnel: GIVEAWAY → REGISTRATION → ACTIVATION → NEWSLETTER → COMMUNITY → RETURN

| Stage | What the entrant does | Mechanism (exists / new) | Event (spine §10) | Metric | TARGET per giveaway |
|---|---|---|---|---|---|
| GIVEAWAY | Lands on `/giveaway/{slug}` from an article, Discord, email, social or ad | Page exists; JoinPrompt swap exists; hub indexable while live (D-039) | page view with `from=` + UTM; `cta_click` (cta_id=giveaway-enter) | Page views by source | n/a (volume is an output) |
| REGISTRATION | Creates an account to enter; social sign-in first | Register rebuild C44 (social buttons first, redirect back to the giveaway, D-014); Steam sign-in D-015 | `registration_start`, `registration_complete` (from=giveaway-<slug>), `email_verified` | Entry page → registration_complete rate; A1 verified rate | A1 ÷ A0 ≥ 90% within 72 h (social sign-ups verify automatically [R11 §5]) |
| ENTRY | Presses Enter; receives 10 base points (new) | `enter()`; base points D-039a | `giveaway_entered` (first entry only) | Entrants | — |
| ACTIVATION | Links a library or shelves 3 games; sets a reminder | New verified task types D-039c | `library_connected`, `shelf_add`, `reminder_set`, `giveaway_task_done` | Entrant → A2 within 7 days | ≥25% (basis: 13 of 60 members had a connected account, 21.7% site-wide [R11 §1.5]; a giveaway that pays for linking should beat the site average) |
| NEWSLETTER | Ticks an optional, unticked box after entry | Post-entry panel; `/newsletter/subscribe` double opt-in exists | `newsletter_signup`, `newsletter_verified` | Entrants → verified subscribers | ≥15% (TARGET; no baseline exists [R20]) |
| COMMUNITY | Joins Discord through the giveaway's own invite code | Invite code per giveaway (C36, D-011); bot-verified task D-039c | `discord_click`, `discord_join` | Entrants → Discord joins | ≥10% (TARGET) |
| RETURN | Comes back on another day: daily check-in, closing reminder, winner post, a reminder firing | Daily check-in exists; reminder mail (D-013); winner post | `d1_return`, WRM action | Entrants with a second active day within 7 days (A3) | ≥30% (TARGET) |

**Rules for the funnel.**

1. The account is the entry ticket, so the register page must honour the return to the giveaway. Until C44/D-014 lands (26 Oct), a new registrant lands on `/verify-email` and loses the giveaway page [R11 §1.3 gate 8]. Interim fix for C09: the post-verification screen links "Back to the giveaway" when `from=giveaway-*` is present (DEV, XS, inside D-014).
2. Newsletter consent is never a condition of entry and carries no points by default. Tying marketing consent to a prize is a GDPR "freely given" risk; legal review may approve a points task later, not before.
3. Nothing counts twice. A giveaway entrant who registers counts once in `registration_complete` with `from=giveaway-<slug>`, and is reported separately as giveaway-sourced. Spine guardrail: giveaway-only accounts share [spine §3].
4. Every stage has an owned follow-up (§7), so a person who enters and loses still ends up with a reminder, a newsletter or a Discord seat.

---

## 3. Mechanics redesign: reward activation, not follows

### 3.1 Points table for every Q4 giveaway ("Profile A — promotable")

Profile A is the default for all Q4 giveaways, because each will be posted on Facebook/Instagram or advertised. Cap stays at 100 points per entrant.

| Task | Points | Verification | Type (existing / new) | Why |
|---|---|---|---|---|
| Enter the giveaway (account) | 10 | server | **new: base points on entry (D-039a)** | Makes "free to enter" true; fixes the zero-point exclusion |
| Link a library (Steam, PlayStation, Xbox, GOG or Epic) | 25 | server: a `connected_accounts` row exists for the user | **new `library_connected` task (D-039c)** | This is A2, the real activation |
| Put 3 games on your shelf | 15 | server: ≥3 `user_games` rows | **new `shelf_three` task (D-039c)** | A2 for people who will not link a store |
| Set one release reminder | 10 | server: a reminder row exists | **new `reminder_set` task (D-039c)** | Creates a future reason to return |
| Join the TechPlay Discord and run `/link` | 10 | bot: linked Discord ID is a guild member | **`discord_join` upgraded to verified (D-039c)** | Community stage; today it is click-credited |
| Daily check-in | 1 per day + existing streak bonuses (3 days +5, 7 +10, 14 +20) | server, once per calendar day | existing `daily_visit` | Return stage; kept small, never in ad copy [R16 §2.15] |
| Rate a game you have played | 5 | server: rating row | new `rating_created` task (D-039c, optional) | A4 contribution, one tap |

Maximum reachable without any daily check-in: 10 + 25 + 15 + 10 + 10 + 5 = 75. With check-ins across a three-week giveaway, an entrant can reach the 100 cap. **ESTIMATE:** the ratio between a base-only entrant (10) and a fully active one (100) is 1:10; that is the trade-off legal review should confirm is acceptable for a free-entry sweepstakes.

### 3.2 Tasks switched off in Profile A

| Task | Why it is off |
|---|---|
| `share_giveaway`, `facebook_share`, `twitter_retweet` | Meta Promotions policy: must not "require or incentivize participants to share, repost, tag others, or in any other way publicize your promotion" [R16 §2.1]. Ads for a giveaway page carrying these risk rejection and a Page strike |
| `referral` with points | Rewarding an invite link is incentivising publicity under the same clause (interpretation; confirm in legal review). The invite link can still be shown, with no points |
| `facebook_like`, `instagram_follow`, `twitter_follow`, `youtube_subscribe` | Meta's policy is silent on follows on other platforms [R16 §2.15], but follows are not activation, and the YouTube channel has 20 subscribers and no videos [R02 §8.2]. Buying follows with prize points produces a follower count that does not read anything |
| `visit_url`, `custom` | Click-credited; only allowed at 0–2 points for genuinely informative links (e.g. "read the rules") |

### 3.3 Profile B — community-only giveaways

Used only for giveaways that are never posted or advertised on Meta surfaces, e.g. C36a (Discord 500 milestone). Adds a referral task **paid when the referred person reaches A2**, not on entry (D-039d), counted for at most 5 referrals per entrant (config `max_referrals` 50 → 5), and never counted when referrer and referee share an IP. Share buttons stay available with no points.

### 3.4 Dev items (sub-IDs of D-039; spine D-039 = hub indexable while live + canonical)

| ID | Change | Size | Needed by | Owner |
|---|---|---|---|---|
| D-039 | `/giveaways` indexable while a giveaway is live; canonical on `/giveaway/[slug]`; add hub to sitemap while live | XS | before C09 promotion (1 Oct) | DEV |
| D-039a | Base points on entry (observer on `GiveawayEntry::created`, 10 points, retroactive for current entries of the live draw) | XS | **before C09 draw (20 Oct), ideally 1 Oct** | DEV |
| D-039b | Apply the per-IP limit in `completeTask()` and `claimDailyBonus()` (they create entries too) | XS | 1 Oct | DEV |
| D-039c | Server-verified task types `library_connected`, `shelf_three`, `reminder_set`, `rating_created`; `discord_join` verified via bot link | S–M | C71a start (19 Oct) | DEV |
| D-039d | Referral credit on referee A2, cap 5, same-IP excluded | S | C36a (Profile B only) | DEV |
| D-039e | Fraud score column and filter in `viewParticipants`; draw excludes score ≥70 | S | C71a draw (3 Nov) | DEV |
| D-039f | Winner mail (not only bell), entrant result mail, public winner block on hub; closing reminder by mail via D-013 channel | S | C09 draw (21 Oct) for winner mail; rest by C31a | DEV |

DEV load: roughly 3 h (D-039, a, b), 10–14 h (c), 3 h (d), 4 h (e), 5 h (f) = **25–29 h over four weeks**, inside DEV's 20 h/week only if D-039/a/b/f ship in week 1–3 alongside the P0 queue. If DEV cannot fit D-039c before 19 Oct, C71a runs with base points and daily check-in only, and the activation tasks arrive with C31a.

---

## 4. Q4 giveaway calendar

| ID | Giveaway | Dates (TARGET) | Prize | Sourcing | Cash budget | Profile | Promotion |
|---|---|---|---|---|---|---|---|
| — | World of Tanks draw (overdue) | Draw Tue 29 Sep, post 30 Sep | As originally advertised (VERIFY in admin) | Already committed | VERIFY | — | Trust post on site, Discord, X |
| C09 | GTA 6 Giveaway | Verify 28 Sep; promote 1–20 Oct; closes Tue 20 Oct 23:59 (confirm timezone in admin); draw and winner post Wed 21 Oct | Grand Theft Auto VI, standard edition, PS5 or Xbox Series X\|S (winner's choice), $79.99 [R17 via spine §0] | Already set up? If the prize is not bought, budget line | ≤$100 (only if not already covered) | A | JoinPrompt on every article, `/gta6` hub, F02 countdown Stories, Discord #gta6, C40 Save File, X. No paid (paid gate opens 19 Oct, one day before close) |
| C71a | Next Fest Keys | Opens Mon 19 Oct (Next Fest day 1), closes Mon 2 Nov 23:59, draw Tue 3 Nov | 8–15 Steam keys for **already released** indie games from 3–5 studios, one key per winner, tiered by game | C71 outreach 5–20 Oct; Steam keys are a free Steamworks service developers may give to press and influencers [R15]; written permission to use them as prizes | $0 | A | F23 Next Fest Diary posts, C18 tracker page, Discord, newsletter, IG carousel |
| C31a | Wishlist Wins (Black Friday) | Opens Fri 20 Nov, closes Tue 1 Dec 23:59, draw Wed 2 Dec | 3 winners; each gets one game **from their own TechPlay wishlist**, up to $60, as a digital gift or store credit | Budget | $180 | A | C31 price-alert pages, C32 Deal Radar, newsletter, Discord. Organic only: Black Friday week is excluded from paid prospecting (see 26) |
| C33a | Winter Keys | Opens Tue 1 Dec, closes Sun 20 Dec 23:59, draw Mon 21 Dec, codes out by Wed 23 Dec | Tiered: 1 × $50 store credit; 5–10 partner keys (C71/C55 contacts, publishers met through Keymailer/PressEngine [R15]) | Partners + small budget | $50 | A | C33 Gift Guide, C29/C30 awards pages, TGA night (10 Dec) Discord watch party, newsletter; paid C57e only if gates in §9 are met |
| C36a | Discord 500 | Triggered when the server reaches 500 members (C36), runs 7 days | 3 partner keys | Leftover partner keys | $0 | B | Discord only |

**Quarter total cash: $230 (C31a + C33a) + up to $100 (C09) + WoT prize if not yet bought = TARGET cap $380 excluding WoT.** Approval: EIC by 30 Sep. Source of funds is separate from the paid-media budget in 26.

**Prize sourcing without budget (EIC, C71/C55).**

1. **Indie studios at Next Fest.** Ask developers of *released* games the team already covers (F05 Hidden Gem, F23 diary picks, Balkan studios from C55 and `/studios/country/ba`) for 2–3 keys each. Offer: named credit on the giveaway page, a link to their store page, an entry in the F23 diary. Never promise reach numbers (spine §0).
2. **The existing sponsorship offer** on `/marketing` ("You supply the keys or hardware, we run the entry, the draw and the winner contact" [R02 §10]). A sponsored giveaway is labelled "Prize provided by {Studio}" on the page and in every post.
3. **Keymailer / PressEngine / Curator Connect** [R15] supply *review* copies. Review keys are not prize keys: use a key as a prize only with the publisher's written permission (email kept in the giveaway's admin notes).
4. **Rule for all donated prizes:** region and platform stated on the page; key tested as unredeemed only by the donor, never by staff; donor's permission and key list stored before the giveaway opens.

**Pitch email to a studio (EIC, C71a).**

> Subject: Keys for a Next Fest giveaway on TechPlay (19 Oct–2 Nov)
>
> Hi {name},
>
> I'm Adi, editor at TechPlay, an independent games site in Sarajevo. During Next Fest we're running a small giveaway of released indie games alongside our daily demo diary, and I'd like to include {game}.
>
> What we'd ask for: 2–3 Steam keys and your OK to use them as prizes. What you get: {game} named with a store link on the giveaway page, in the Discord announcement and in our Friday newsletter, plus a spot in the Next Fest diary if you have a demo running.
>
> Winners are drawn on 3 November and we send the keys ourselves within 48 hours. The rules page will say "Prize provided by {studio}". I can't promise traffic numbers because we don't publish numbers we can't back, but I can send you the entry count and the page's click-throughs to your store after the draw.
>
> Thanks,
> Adi Zeljković, TechPlay

---

## 5. C09 GTA 6 Giveaway: verification and decision tree

**Mon 28 Sep, SC with EIC, 45 min in Filament `GiveawayResource`:**

| Check | Where | Pass condition |
|---|---|---|
| Row exists | Giveaways list | A GTA 6 giveaway exists |
| Status and visibility | `status`, `is_public` | active or scheduled; `is_public` = true |
| Dates | `starts_at`, `ends_at` | `ends_at` = 20 Oct; note the timezone the admin stores |
| Prize | `prize_name`, `prize_value`, `prize_type`, `platform`, `region` | Stated precisely; platform is PS5/Xbox Series X\|S only (no PC at launch [R17]) |
| Prize secured | EIC | Bought, budgeted, or sponsor-confirmed in writing |
| Rules | `rules` field | Present; replace with §8 template |
| Tasks | task list | Profile A only (remove share/retweet/referral points) |
| Entries | `viewParticipants` | Count and any fraud clusters noted |
| World of Tanks draw | Ended giveaways | Winner drawn? Prize still available? |

**Decision tree.**

1. **Row exists and prize is secured** → apply Profile A tasks (entrants who already completed removed tasks keep their points; say so in the rules), ship D-039a/b, D-039 indexable, publish rules, promote from Thu 1 Oct. Draw Wed 21 Oct; winner post same day.
2. **Row exists, prize not secured** → EIC decides by Tue 29 Sep: approve ≤$100, or close the giveaway early with a public note and void entries. Do not promote a giveaway whose prize is not in hand.
3. **No row or not public** → do not create one retroactively "to match the code". Either EIC approves creating C09 (1–20 Oct, $100), or C09 is dropped, the JoinPrompt stays on the account panel (it swaps automatically only when a giveaway is active), and the register page stops promising "exclusive giveaways" until C71a opens (C01).

---

## 6. Copy for three giveaways

Voice: plain, specific, no urgency beyond the real closing date, no invented numbers, at most one emoji per post.

### 6.1 C09 — GTA 6 Giveaway (if live)

- **Page title:** Win Grand Theft Auto VI (PS5 or Xbox Series X|S)
- **Subtitle:** Free to enter with a TechPlay account. Closes 20 October, 23:59 {TZ}. One winner.
- **Description:** GTA VI is out on 19 November for PS5 and Xbox Series X|S, $79.99 for the standard edition. We're giving one copy away, on the platform of the winner's choice. Entering takes a free TechPlay account. The tasks below add entries; none of them costs anything, and none asks you to share or tag anyone.
- **Prize block:** Grand Theft Auto VI, standard edition, PS5 or Xbox Series X|S, delivered as a digital code or store credit of equal value in the winner's store region within 7 days of the winner confirming. Approximate retail value $79.99.
- **Task list (Profile A):**
  - Enter the giveaway — 10 points
  - Link a library: Steam, PlayStation, Xbox, GOG or Epic — 25 points ("Your games arrive on their own, with the hours you've played.")
  - Put 3 games on your shelf — 15 points
  - Set a launch reminder for GTA VI — 10 points ("We'll tell you on 19 November.")
  - Join the TechPlay Discord and run `/link` — 10 points
  - Check in once a day — 1 point a day, with small streak bonuses
- **Footer line:** No purchase necessary. 18+. Full rules below. This giveaway is not sponsored, endorsed or administered by, or associated with, Rockstar Games, Take-Two, Sony, Microsoft, Meta, X, Reddit or TikTok.
- **JoinPrompt (article slot) body:** GTA VI giveaway · closes 20 Oct. Free to enter with a TechPlay account, and the account is the thing that keeps your library, your reminders and your finished games in one place. → Enter the giveaway
- **Discord (#announcements, SC):** GTA VI giveaway is open until 20 October. One copy, PS5 or Xbox Series X|S, winner's choice. Free with a TechPlay account; linking a library or setting the launch reminder adds entries. Rules and entry: https://techplay.gg/giveaway/{slug}?utm_source=discord&utm_medium=community&utm_campaign=c09-gta6-giveaway&utm_content=announce-a
- **X post:** We're giving away one copy of GTA VI, PS5 or Xbox Series X|S. Free to enter with a TechPlay account, closes 20 Oct. No retweet needed; linking your game library adds entries. {link with utm_source=x&utm_medium=organic-social&utm_campaign=c09-gta6-giveaway&utm_content=x-post-a}
- **Facebook / Instagram post:** One copy of GTA VI, PS5 or Xbox Series X|S, to one winner. Entry is free with a TechPlay account and closes 20 October. Link in bio / below. No purchase necessary, 18+. This promotion is not sponsored, endorsed or administered by, or associated with, Meta.
- **Newsletter block (C40 Save File, issues of 2, 9 and 16 Oct):** **The GTA VI giveaway closes 20 October.** One copy, PS5 or Xbox Series X|S. If you've already got a TechPlay account, you're one click from entering. → Enter
- **24-hour reminder (bell now; mail once D-039f ships):** Subject: The GTA VI giveaway closes tomorrow at 23:59. Body: You're entered with {points} points. If you haven't linked a library yet, that's the largest one left (25 points). Winner announced on 21 October at /giveaways.

### 6.2 C71a — Next Fest Keys

- **Page title:** Next Fest Keys: {n} indie games to win
- **Subtitle:** While Steam Next Fest runs (19–26 Oct) we're giving away keys to released indie games from the studios we've been covering. Closes 2 November.
- **Description:** Every prize below is a Steam key for a game that's already out, donated by the studio that made it. Each winner gets one key; if you win, you pick from what's left in your tier. Enter with a free TechPlay account.
- **Prize block (per game):** {Game} by {Studio} ({country}) · Steam key · {n} available · Prize provided by {Studio} · {store link}
- **Tasks:** Enter — 10 · Link Steam (or any library) — 25 · Add 3 Next Fest demos you tried to your wishlist — 15 (counts as `shelf_three`, wishlist status) · Set a reminder for one of them — 10 · Join Discord and `/link` — 10 · Daily check-in — 1/day
- **Discord:** Next Fest Keys is open: {n} Steam keys for released indie games, donated by {Studio A}, {Studio B} and {Studio C}. Enter with a TechPlay account by 2 Nov. Our Next Fest diary (three demos a day) is in #steam. {link, utm_source=discord&utm_medium=community&utm_campaign=c71a-nextfest-keys}
- **X:** Next Fest starts today. We're giving away Steam keys for {n} indie games that are already out, donated by the studios. Enter free with a TechPlay account until 2 Nov. {link}
- **Instagram carousel (5 slides, DS template):** 1 "Next Fest Keys" / 2–4 one game per slide: cover, studio, one-line pitch written by ED / 5 "Free to enter with a TechPlay account. Closes 2 Nov. Link in bio. Not sponsored by Meta. 18+."
- **Winner post:** see §10.

### 6.3 C31a — Wishlist Wins (Black Friday)

- **Page title:** Wishlist Wins: we'll buy one game off your wishlist
- **Subtitle:** Three winners. Each gets one game from their own TechPlay wishlist, up to $60. Closes 1 December.
- **Description:** Put the games you want on your TechPlay wishlist (or import it: linking Steam brings your library in, and your price alerts start working). On 2 December we draw three winners and buy each of them one game from their list, up to $60, as a digital gift or store credit where the store allows it. If nothing on your list fits, we'll send store credit of the same amount.
- **Tasks:** Enter — 10 · Link a library — 25 · Have 3 games on your wishlist — 15 · Turn on a price alert for one of them — 10 (`reminder_set` family; C31 alert) · Join Discord and `/link` — 10 · Daily check-in — 1/day
- **Email to verified newsletter subscribers (C40, Fri 20 Nov):** Subject: We'll buy one game off your wishlist. Body: Three winners, one game each, up to $60, picked from your own TechPlay wishlist. It closes on 1 December. The wishlist also does something useful this week: turn on a price alert and we'll tell you when a game you want drops. → Enter Wishlist Wins
- **Discord:** Wishlist Wins is open until 1 Dec. Three winners; we buy each one a game from their own TechPlay wishlist, up to $60. Price alerts are live for the sales this week: `/remind` or the bell on any game page.
- **Facebook post:** Three winners, one game each from their own wishlist, up to $60. Free to enter with a TechPlay account until 1 December. No purchase necessary, 18+. Not sponsored, endorsed or administered by, or associated with, Meta. {link}

---

## 7. Follow-up sequences (entrant email and Discord)

Delivery today: mail only by manual campaign to the `giveaway` audience segment; automated mail needs the D-013 channel (C42, live 12 Oct). Discord DMs via `/subscribe giveaway`. Result messages (entry confirmation, win/lose) are service messages announced in the rules; nurture messages go only to people with a verified newsletter subscription or an explicit opt-in (legal review to confirm the split).

| # | When | Channel | Audience | Subject / message | CTA | Owner |
|---|---|---|---|---|---|---|
| G0 | On entry | On-site panel | All entrants | "You're in with {points} points. The two that count most: link a library (25), set a reminder (10). Optional: get the Friday newsletter [ ] (unticked)." | Link a library | DEV (UI), SC (copy) |
| G1 | Entry +1 day | Email (D-013) or bell | Entrants without A2 | "Your giveaway entry, and the part that stays useful." Body: link Steam/PS/Xbox/GOG/Epic; the shelf fills with hours already on it; 25 points. | Link a library | SC |
| G2 | Entry +3 days | Email (opted-in) / Discord DM | Entrants with A2, no reminder | "One reminder worth setting." Next week's releases from /calendar that match their shelf genres (C41 data when live). | Set reminder | SC |
| G3 | Close −24 h | Email (D-039f) + bell + Discord DM | All entrants | "{Giveaway} closes tomorrow at 23:59." Points so far; one missing task. | Open giveaway | DEV/SC |
| G4 | Draw day | Email + bell | All entrants | Winner email to winner (§10); to everyone else: "We drew {giveaway} today. The winner is {username}. {n} people entered; the draw is explained here." | See the draw | SC |
| G5 | Draw +2 days | Email (opted-in) | Non-winners | "The next one opens {date}. Meanwhile, what your account already does:" reminders, price alerts, Save File. | Next giveaway / newsletter | SC |
| D1 | Entry | Discord bot | Entrants who linked Discord | Role "Entrant: {giveaway}" for the duration; removed after draw | — | SC/DEV |

**Discord interplay.** #giveaways channel carries: opening post, one mid-point post ("halfway; {n} entered"), close −24 h, draw post. Buffy's status line already counts active giveaways [R01]. No "ping everyone" more than twice per giveaway.

---

## 8. Official rules template (LEGAL REVIEW NEEDED before use)

> **{Giveaway title} — Official Rules**
>
> **NO PURCHASE OR PAYMENT OF ANY KIND IS NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING.**
>
> **1. Sponsor.** {Legal entity name}, {address}, operating techplay.gg ("TechPlay"). [If donated: Prize provided by {Studio}, which is not responsible for the administration of this giveaway.]
>
> **2. Eligibility.** Open to individuals who are 18 or older (or the age of majority where they live, if higher) at the time of entry and who live in {eligible countries / "any country where this giveaway is not prohibited by law and to which the prize can lawfully be delivered"}. Void where prohibited. TechPlay staff, contributors and their immediate families are not eligible.
>
> **3. Entry period.** Starts {date} at {time} {timezone} and ends {date} at 23:59 {timezone}. Entries received outside this period do not count.
>
> **4. How to enter.** Sign in to a free TechPlay account at techplay.gg and press "Enter" on the giveaway page. Entering gives you 10 points. Optional tasks listed on the giveaway page give additional points, up to a maximum of 100 points per person. No task requires a purchase, and no task requires you to share, repost or tag anyone. [AMOE, if legal requires: You may also enter without creating an account by emailing {giveaways@techplay.gg — confirm the mailbox exists} with the subject "{giveaway title}", your name and country; each emailed entry receives 10 points. One emailed entry per person.]
>
> **5. Limits.** One entry per person. Multiple accounts, automated entries and entries from the same network beyond 5 per giveaway are void. TechPlay may disqualify any entry it reasonably believes to be fraudulent, duplicated or automated.
>
> **6. Draw.** On {draw date}, TechPlay will draw {n} winner(s) at random from all eligible entries. Each entry's chance is proportional to its points (points ÷ total points of all eligible entries). The draw uses a cryptographically secure random number generator on TechPlay's server. [Tiered prizes: tiers are drawn in the order listed; one prize per person.]
>
> **7. Odds.** Odds depend on the number of eligible entries and points received.
>
> **8. Winner notification.** Winners are notified by email to the address on their account and on their TechPlay notifications within 48 hours of the draw, and must reply within 7 days, confirming eligibility and (for platform prizes) their platform and store region. If a winner does not reply, is ineligible or declines, an alternate winner is drawn by the same method. Winners' TechPlay usernames are published on the giveaway page and on TechPlay's channels; no other personal data is published.
>
> **9. Prize.** {Prize description, platform, region, delivery form}. Approximate retail value: {amount and currency}. No cash alternative except as stated. TechPlay may substitute a prize of equal or greater value if the stated prize becomes unavailable. Keys and codes are subject to the platform's terms and regional restrictions. Winners are responsible for any taxes.
>
> **10. Privacy.** Entry data (account, entry time, points, IP address and user agent for fraud checks) is used to run this giveaway and is handled under TechPlay's Privacy Policy {link}. Entering does not subscribe you to any newsletter.
>
> **11. Platforms.** This giveaway is in no way sponsored, endorsed or administered by, or associated with, Meta (Facebook, Instagram), X, Reddit, TikTok, Discord, Google/YouTube, Valve, Sony, Microsoft, Nintendo, Rockstar Games or Take-Two. Entrants release these companies from any liability connected with the giveaway.
>
> **12. General.** TechPlay may cancel or modify the giveaway if fraud, technical failure or any other cause beyond its control affects its integrity; any change will be posted on this page with the date. Governing law: {to be set by legal review}.
>
> **13. Winner list.** Available at techplay.gg/giveaways after the draw, or by email to {address}.

Legal questions to resolve (EIC, before 1 Oct): (a) is account creation consideration in any target market, and is the email AMOE needed [R16 §2.15]; (b) governing law and the entity name; (c) whether points-weighted odds are acceptable in the EU and UK; (d) 18+ versus 13+ with guardian consent (the plan chooses 18+ for simplicity and to match paid rules [R16 §2.15]); (e) tax treatment for prizes over any local threshold.

---

## 9. Paid giveaway traffic (link to 26)

Paid traffic to a giveaway is allowed **only** when all of these are true (R16 §5 item 8, T13):

1. Profile A task set live (no share, retweet, tag or referral points).
2. D-039a (base points), D-039b (IP limit), D-039e (fraud score) shipped.
3. Rules page live and reviewed.
4. `giveaway_entered` and `library_connected` firing through GA4 and Meta CAPI behind consent (D-007, D-031).
5. Previous giveaway's giveaway-only share at close ≤70%.

In Q4 this makes C33a Winter Keys the only candidate (C57e, 1–14 Dec, GROWTH and AGGRESSIVE only; see 26). C09 is organic-only; C71a is organic-only (fraud score lands during it); C31a is organic-only (Black Friday week).

Ad copy for C57e (Meta, US 18+):
- **Headline:** Win one of {n} games this December
- **Primary text:** Winter Keys: Steam keys from indie studios plus $50 of store credit, drawn on 21 December. Free to enter with a TechPlay account; no purchase necessary, 18+. Official rules on the page. Not sponsored by or associated with Meta.
- **CTA:** Learn More → https://techplay.gg/giveaway/{slug}?from=c57e&utm_source=facebook&utm_medium=paid-social&utm_campaign=c57e-winter-keys-giveaway&utm_content=prize-static-a&utm_term=us-18-plus
- Stop: >70% of paid entrants with zero other activity after 7 days (T13).

---

## 10. Winner announcements

Every draw gets the same five-part public post on the giveaway page, `/giveaways` "Recent winners", Discord and X.

**Template (site and Discord):**

> **{Giveaway} — winner drawn**
>
> We drew {giveaway} on {date} at {time} {TZ}. {E} people entered; after removing {X} entries for duplicate accounts or automated activity, {E−X} were eligible. Each entry's chance was its points divided by the total. The draw ran on our server with a secure random number generator, and {staff name} ran it.
>
> The winner is **{username}**. [For tiered prizes, list by tier.] They've been emailed and have seven days to reply; if they don't, we draw again and update this post.
>
> Thanks to {Studio} for the prize. [if donated]
>
> Next: {next giveaway, date} — or set a reminder for {relevant release}.

**Winner email:**

> Subject: You won {prize} in the TechPlay {giveaway} giveaway
>
> Hi {username},
>
> You were drawn as the winner of {giveaway} today. To send your prize we need three things: confirm you're 18 or older and live in {eligible countries}; tell us your platform ({options}); and your store region. Reply to this email within 7 days, by {date}.
>
> We'll send the code within 48 hours of your reply. We'll publish your TechPlay username as the winner and nothing else.
>
> TechPlay

**Delivered post (after the winner confirms receipt):** "{username} has their copy of {prize}. Thanks for entering, everyone." (Only with the winner's consent for anything beyond the username.)

**Overdue World of Tanks post (C01 trust reset, SC/EIC, 30 Sep):**

> **We owed you a draw**
>
> Earlier this year we ran a World of Tanks giveaway and never drew it. That's our mistake, and it's why the giveaways page has said "No draws have been settled yet" for months. We drew it today: {n} people had entered, and the winner is **{username}**. [If the prize is no longer available: The original prize is no longer available, so the winner gets {equal or greater substitute}.] From now on every draw is posted here with the date, the number of entries and how it was run.

---

## 11. Quality measurement

| Metric | Definition (accounts, not visits) | Source | TARGET / threshold |
|---|---|---|---|
| Entrants | distinct `giveaway_entries.user_id` for the giveaway | DB | output, no target |
| New-account share | entrants whose `users.created_at` is within 24 h before their entry ÷ entrants | DB | report only |
| Entrant → A1 | new-account entrants with `email_verified_at` within 72 h ÷ new-account entrants | DB | ≥90% |
| Entrant → A2 (7 days) | entrants with `connected_accounts` row or ≥3 `user_games` within 7 days of entry ÷ entrants | DB | ≥25% |
| Giveaway-only share | entrants with **no** WRM action (shelf change, rating, comment, list edit, reminder, analyzer run, Discord linked-XP event) outside the giveaway within 14 days of entry ÷ entrants | DB | ≤60%; >70% stops paid traffic (T13) |
| Entrant → newsletter verified | entrants whose email appears verified in `newsletter_subscribers` within 14 days ÷ entrants | DB | ≥15% |
| Entrant → Discord join | joins through the giveaway's invite code (D-011) ÷ entrants | bot | ≥10% |
| Entrant → A3 return | entrants with a second active day within 7 days ÷ entrants | `last_seen_at` / `d1_return` | ≥30% |
| 30-day retention | entrants with ≥1 WRM action in days 23–30 after entry ÷ entrants | DB | report; compare to non-giveaway registrants |
| Cost per A2 | (prize cash + paid media) ÷ A2 entrants | finance + DB | report; paid threshold in 26 |
| Source split | every metric above by `from=` / UTM | collector (D-008), GA4 | report |

**Read-out:** SC runs the queries the day after each draw and posts a 10-line summary in the team channel; EIC decides the next giveaway's task set from it. A Filament widget for these numbers is part of D-039e if DEV time allows; otherwise saved SQL.

### 11.1 Fraud signals and the fraud score (D-039e)

| Signal | Rule | Score |
|---|---|---|
| New account | account created <1 h before entry | +25 |
| Shared network | entrant's IP shared with ≥3 other entrants of this giveaway | +20 |
| Disposable domain | email domain on a maintained disposable-domain list | +20 |
| No life outside the giveaway | zero WRM actions at draw time | +15 |
| Cloned device | identical user agent and same /24 network as ≥3 other entrants | +10 |
| Burst tasks | ≥4 tasks credited within 10 s of entry | +10 |
| Referral chain | referred by an entrant who is themself ≥50 (Profile B only) | +10 |
| Gmail variants | same local part with dots/plus tags as another entrant | +20 |

Scores are ESTIMATES to tune after C71a. **≥50:** manual review by SC before the draw. **≥70:** excluded from the draw under rule 5, with the count published in the winner post. Before any prize is sent the winner is checked by hand: verified email, one account, not staff, country eligible, reply confirms 18+.

**Existing protections to keep:** account required; 10 requests/minute; 5 entries per IP (after D-039b closes the bypass); `random_int` draw; locked draw transaction; email verification before login for password accounts [R11 §1.3]. Steam-only accounts (after D-015) have no email and are ineligible to win until an email is attached and verified [R11 §5].

---

## 12. Capacity (per giveaway, ESTIMATE)

| Task | Owner | Hours |
|---|---|---|
| Prize sourcing and donor emails (C71a, C33a) | EIC | 4 |
| Admin setup: page, tasks, rules, prize tiers, invite code | SC | 2 |
| Visual template (hero, carousel, winner card) — once, then fills | DS | 4 once, 1 per giveaway |
| Copy (page, posts, emails) from §6 templates | SC | 2 |
| Running: posts, Discord, replies | SC | 1.5 per week |
| Fraud review and draw | SC | 1.5 |
| Winner contact and delivery | SC | 1 |
| Read-out | SC | 1 |
| **Total per giveaway** | | **≈14 h once, then ≈10 h** |

With C09, C71a, C31a and C33a in Q4 this is ≈45 h across 13 weeks, about 3.5 h/week, mostly SC. Fits the 135 h/week team only because the templates are reused.

---

## Dependencies and open questions

**Dependencies**

- C01/D-001: register page must stop promising "exclusive giveaways" whenever none is live; JoinPrompt already swaps automatically.
- C03: D-007 (GA4 `giveaway_entered`, `giveaway_task_done`, `library_connected`), D-008 (UTM in collector), D-009 (URL helper), D-011 (Discord invite-code attribution).
- C42/D-013 mail channel for G1–G5 and closing reminders; D-039f for winner mail.
- C44/D-014 register rebuild with redirect back to the giveaway (26 Oct); D-015 Steam sign-in.
- D-039 series (§3.4). D-039a and D-039b are prerequisites for promoting C09.
- C71 partner outreach (5–20 Oct) and C55 Balkan partners for donated keys.
- 26-PAID-MEDIA (C57e) and 27-RETARGETING (giveaway-visitor audience).

**Open questions**

1. Does the GTA 6 giveaway exist, is it public, and is its prize secured? (VERIFY 28 Sep; spine §0.)
2. What was the World of Tanks prize, and can it still be delivered?
3. Legal: account as consideration; AMOE; points-weighted odds in the EU/UK; governing law; entity name; 18+ confirmation (§8).
4. Is referral-with-points "incentivising publicity" under Meta's policy? The plan assumes yes and removes it from Profile A.
5. Does a giveaways mailbox exist for AMOE and winner replies?
6. Which store regions can TechPlay buy PlayStation/Xbox codes or credit for? This sets the eligible-country list for C09 and C31a.
7. Cash prize budget approval (TARGET cap $380 plus C09 if needed) and whether it sits outside the paid-media budget.
8. Can DEV fit D-039c (verified activation tasks) before 19 Oct, or do they move to C31a?
