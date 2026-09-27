# 17 — Newsletter and Email

Status: Phase 2 plan — 27 Sep 2026
Scope: Part 19 (newsletter products, capture, welcome, reactivation, subject lines, two full issues) and Part 20 (lifecycle email automation and deliverability). Registration surfaces are in `15-REGISTRATION.md`; loops, caps and ethics in `16-ACTIVATION-RETENTION.md`.

- **The mail system is better than its use.** Double opt-in, one-click unsubscribe, suppression, segments, signed click tracking and paced sending exist since 11 Sep 2026; every campaign is written and sent by hand, and no automated email goes out [R20, R01 B.3].
- **Three products, no daily.** The Save File (Fridays, F21, C40, first issue Fri 2 Oct), "Your releases this week" (Mondays, personalised, C41, from Mon 26 Oct) and a small number of special editions (GTA VI launch week, Black Friday, The Game Awards, Steam Winter Sale). A daily newsletter is argued against in §2.3.
- **Personalisation is the product nobody else can send.** "Your releases this week", "your wishlist is on sale" and "your game is out today" come from shelves and reminders TechPlay already stores [R20 exec summary #8].
- **Capture moves to where readers are:** a new `/newsletter` landing (D-012), article end, homepage, game pages, calendar and the GTA 6 hub, with exact copy for each (§6). "Join thousands of fans" is removed in W40.
- **The preview text is the first visible line of the email.** The project's own spam filter penalised hidden preheaders, so none is used (docs/README.md §20). Every subject line in §9 comes with its first line.
- **Twelve lifecycle sequences** (E-01 to E-12) with trigger, delay, cap, full copy, exit conditions and requirement (§12). They need D-013 (mail channel for notifications), D-027 (price alerts) and D-028 (personalised releases email).
- **Deliverability is the binding constraint.** TechPlay sends from its own server with no Gmail reputation; DNS, SPF, DKIM, DMARC, MX and SMTP are not touched without explicit approval [R20, docs/README.md §14]. Rules for pacing, suppression, bounce handling and volume are in §14.
- **Metrics:** clicks per delivered email (opens are a floor), downstream member actions within 24 h, unsubscribe < 0.5% and complaints < 0.1% per send (spine §3). Subscriber count is UNKNOWN [R11 §8]; no number is published.
- **Capacity:** SC ≈ 3.5 h and EIC ≈ 1 h per week for The Save File; DEV ≈ 75 h over the quarter for the automation, shared with the loops in 16.

---

## 1. Constraints this plan works inside (FACT)

| Constraint | Source | What it means for every email |
|---|---|---|
| Five mail types are sent today: verify, reset, newsletter confirmation, contact form, campaign | docs/README.md §20 | Everything else in this file is new mail; it starts small |
| 20 of 22 notification classes are bell-only, including the weekly digest and release reminders | [R01 B.2.12] | D-013 adds a `mail` channel per class, behind per-type preferences (D-013a) |
| Own server, no reputation at Gmail; default pacing 10 messages every 3 seconds | docs/README.md §20 | Keep the pacing; grow volume gradually (§14) |
| DNS, SPF, DKIM, DMARC, MX and SMTP settings are not changed without asking | docs/README.md §14 | Every deliverability fix in this file is application-side unless EIC approves otherwise |
| Hidden preheaders are not used; the first visible line does that job | docs/README.md §20 | "Preview line" = the first sentence of the body (§3.3) |
| Templates are words only; buttons and links are drawn by code | docs/README.md §20 | Editors write copy; DEV owns links, tokens and signed URLs |
| Unverified addresses are never in an audience; `MailSuppression::filter()` is the single gate | docs/README.md §20 | Lifecycle mail to unverified accounts is limited to the verify mail itself (E-02) |
| Opens are a floor (Apple Mail Privacy Protection, Gmail proxy); clicks are trusted; unsubscribe link untracked | docs/README.md §20 | All metrics use clicks |
| No bounce or complaint ingestion found; suppression reasons `bounced`/`complained` are never written | [R01 B.3, B.12 #13] | D-013c before volume grows; may touch provider config, so ask first |
| Subscriber rows carry `source` = form or account only; no tags; Frontiers "Notify me" writes to the same list | [R01 B.3, A.2.5 F31] | D-012a adds placement and interest tags |
| Subscriber count UNKNOWN | [R11 §8, R20 gaps] | Read it in admin on 28 Sep; never publish it |

---

## 2. Product line-up

| ID | Product | Audience | Cadence and send time | Owner | Hours / week (ESTIMATE) | Starts |
|---|---|---|---|---|---|---|
| N1 | **The Save File** (F21, C40) | verified newsletter subscribers (form and account opt-in) | Fridays 14:00 UTC (16:00 Sarajevo until 25 Oct, 15:00 after; 10:00 New York) | SC assembles, EIC edits and signs | SC 3, EIC 1 | Fri 2 Oct |
| N2 | **Your releases this week** (C41, D-028) | members with ≥1 reminder or wishlist game releasing in the next 7 days, mail preference on | Mondays 08:00 UTC; nothing sent if the list is empty | DEV builds, SC spot-checks | SC 0.5 | Mon 26 Oct |
| N3 | **GTA VI briefing** (C10) | opt-in tag `gta6` only | Thursdays 15 Oct–12 Nov, then Wed 18, Thu 19 and Sun 22 Nov; stops after 22 Nov | ED writes, SC sends | ED 1, SC 0.5 | Thu 15 Oct |
| N4 | **Specials** | see §5 | Black Friday (Fri 27 Nov, replaces N1), The Game Awards (Fri 11 Dec, replaces N1; Thu 10 Dec reminder to league entrants), Steam Winter Sale (Thu 17 Dec, wishlist members) | EIC, SC | 2 per special | 27 Nov |
| — | Alerts (release day, price drop, replies) | members who set them | event-driven; lifecycle, not newsletter (§12) | DEV | — | 19 Oct |

No Save File on Fri 25 Dec; issue #13 goes on Thu 31 Dec. Save File numbering: #1 on 2 Oct (W40) to #13 on 31 Dec.

### 2.1 Why the Save File goes only to people who asked for it

Members are not added to The Save File unless they tick the box at sign-up (15 R-30) or subscribe later. Sending a newsletter to every verified member would grow the list faster and put the self-hosted sender's reputation at risk with people who never asked for it. Members get their own lifecycle and alert mail under per-type preferences (D-013a).

### 2.2 What "personalised" means here

N2 and the member block in N1 use only data the member created: shelf, wishlist, reminders, ratings. Nothing inferred from reading is shown as a fact. If `InterestProfile` knows nothing, the block is omitted rather than filled with "popular" items [R01 B.2.17].

### 2.3 The case against a daily newsletter (decision: no daily in Q4)

1. **Capacity.** SC has about 25 hours a week for all social, Discord, Reddit and newsletter work (spine §1). A daily issue takes 5–7 of those hours on its own (ESTIMATE: 1 h assembly and QA per issue).
2. **Deliverability.** Five sends a week instead of one multiplies complaint and bounce exposure from a sender with no reputation and no bounce ingestion yet (§1).
3. **No differentiator.** The daily gaming digests we found are generic ("An everyday digest of the latest technology news", "Daily insight, inspiration and deals") [R20 §1]. TechPlay's advantage is personal and dated, which is weekly or event-driven.
4. **Daily already exists elsewhere.** Discord #latest-news posts every article the moment it publishes, RSS carries the last 40 items, and On This Day runs daily in Discord [R01 B.8.2].
5. **The one justified exception** is GTA VI launch week for people who opt in to the briefing: three sends in five days (18, 19, 22 Nov), after which it stops. Revisit a daily only if N1 click rates hold for eight issues and SC capacity grows.

---

## 3. The Save File: structure

Target length under 600 words, at most 12 links, one image at most (≤150 KB, with alt text), a plain-text part (`body_text`) always filled.

| # | Section | Content rule | Owner | Source |
|---|---|---|---|---|
| 0 | Subject | §3.2 system | EIC | — |
| 1 | Preview line | first visible sentence, §3.3 | EIC | — |
| 2 | Editor's line | 2–3 sentences, signed (EIC or ED in rotation), what this week was about | EIC | — |
| 3 | The week | at most 3 stories through pillars P1–P5; each: bold headline, 2 sentences on what happened, 1 on why it matters to what you play, 1 link | ED | site articles |
| 4 | Out next week (F01) | 5–8 releases from /calendar: date, platforms, price if listed; "Remind me" signed link for members, calendar link for subscribers | SC | /calendar |
| 5 | The Number (F04) | one stat with a source line | ED | F04 card of the week |
| 6 | GTA VI: {n} days (until 19 Nov) | one confirmed fact, one ledger link (C07) | ED | /gta6/everything-we-know |
| 7 | Worth your time | one TechPlay guide, tool or verdict (F07, F05, F24, F09) | ED | site |
| 8 | Community | poll result (F12), Game Club (F22), one quoted member post with consent, Discord invite | SC | Discord, forum |
| 9 | Your shelf (members) | "{n} of your games are out next week. {m} on your wishlist are discounted." Hidden if both are zero; generic until D-028 | DEV | D-028 |
| 10 | Account prompt (subscribers without account) | R-29 block | — | 15 |
| 11 | Footer | why you're receiving this, one-click unsubscribe, preferences, web archive, postal address | DEV | — |

Footer text (fixed): "You're getting The Save File because you subscribed at techplay.gg. [Unsubscribe] (one click) · [Email preferences] · [Read past issues] · TechPlay is published by Luminor Solutions, 71000 Sarajevo, Bosnia and Herzegovina." Buffy's one-line sign-off sits above the footer.

### 3.1 CTA and link rules

- One primary action per issue, chosen by EIC (for example "Set a reminder for GTA VI" or "Nominate your games of 2026"), drawn as the only button. Everything else is a text link.
- Link text says where it goes ("the release-time page", "Gears of War: E-Day on the calendar"), never "click here".
- Every link carries `utm_source=newsletter&utm_medium=email&utm_campaign=c40-save-file-2026wNN&utm_content=<section>-<position>` (spine §9), then the signed click redirect wraps it.
- Only techplay.gg links and store links; no URL shorteners; affiliate links (if any) labelled "(affiliate link)" in the text.

### 3.2 Subject-line system

- Pattern for N1: **"The Save File #{n}: {item 1}, {item 2}, {item 3}"**. Items are proper nouns or dates. Under 70 characters where possible.
- Pattern for N2: **"This week: {Game} and {k} more on your list"** or **"This week: {Game} ({weekday})"**.
- Pattern for specials: **"{Event}: {specific promise}"**.
- Rules: no all caps, no "!!!", no emoji, no "you won't believe", no invented urgency, no numbers we cannot back, no "Re:" or "Fwd:".
- Testing: the list is small, so no split test per send. Alternate two subject styles over eight issues (items-first versus question-first) and compare click rate per style. EIC keeps the log.

### 3.3 Preview-line system (first visible line)

- One or two sentences, 90–120 characters, the single most useful fact first, then the second item or a date.
- It must make sense alone in an inbox list and repeat nothing from the subject word for word.
- "View in browser" and logos never come first; the web-archive link lives in the footer.
- Personalised products put the member's own game first: "{Game} is out Thursday on {platforms}."

### 3.4 How the newsletter promotes the site, and the site promotes the newsletter

| Direction | Mechanism | Owner |
|---|---|---|
| Email → site | sections 3–8 each link to a TechPlay page; section 4 to the calendar with reminders; one tool per issue | ED, SC |
| Email → account | section 10 (subscribers) and N-W3 in the welcome sequence | DEV |
| Site → email | placements P-01 to P-12 (§6) | DEV, DS |
| Discord → email | Friday post in #announcements: "The Save File #{n} is out: {subject items}. Read it or subscribe: techplay.gg/newsletter" | SC |
| Web archive | each issue published at `/newsletter/archive/{n}` the next day (D-012b), `noindex` until it carries original writing | DEV |
| Social | Friday X/Threads/Bluesky post with one item from the issue and the /newsletter link (utm_source per network) | SC |

---

## 4. "Your releases this week" (N2): structure

| # | Section | Content |
|---|---|---|
| 0 | Subject | "This week: {Game A} and {k} more on your list" |
| 1 | Preview line | "{Game A} is out {weekday} on {platforms}. {Game B} on {weekday}." |
| 2 | Out this week, from your list | each game: day, platforms, Steam price if known, "[Game page]" · "Stop reminders for this game" |
| 3 | Also out, close to your taste | at most 3 games from `GameRecommendationService`, each with its reason ("Because you played {game}"); omitted if `MIN_SIGNALS` not met |
| 4 | On sale from your wishlist | from D-027 when live; omitted if none |
| 5 | Your month (first Monday only) | hours played (Steam), games finished, achievements unlocked, reminders that came true (16 L-M3) |
| 6 | Footer | "This email is built from your shelf and reminders. [Change what's in it] · [Stop Monday emails] · address" |

Rules: sent only when section 2 has at least one game; at most 10 games listed, rest linked; skipped entirely if the member already received three alert emails in the previous 48 hours (cap, 16 §4.5).

---

## 5. Special editions

| Special | Date(s) | Audience | Structure | Primary CTA |
|---|---|---|---|---|
| GTA VI weekly briefing | Thu 15, 22, 29 Oct; 5, 12 Nov | tag `gta6` | days left; ledger changes this week (confirmed, reported, rumour, each with source); one TechPlay tool; Discord #gta6 | "Set a launch-day reminder" |
| GTA VI eve | Wed 18 Nov | tag `gta6` | unlock time by region (as confirmed); pre-load and size (as listed by the stores); editions and price | "Open the release-time page" |
| GTA VI launch edition | Thu 19 Nov | tag `gta6` + members with GTA VI reminder | full copy §11 | "Start here" (map tracker) |
| GTA VI first weekend | Sun 22 Nov | tag `gta6` | what to do first, early money, cars, the map tracker; "This is the last briefing; tick the box to keep getting GTA VI guides" | "Keep GTA VI guides" (signed link sets tag `gta6-guides`) |
| Black Friday (Save File #9) | Fri 27 Nov | N1 audience | members: discounted games from their wishlist at the top (D-027); everyone: editor picks with prices checked that morning, affiliate links labelled | "See your wishlist deals" |
| Cyber Monday (inside N2) | Mon 30 Nov | N2 audience | wishlist games still discounted, checked that morning | — |
| TGA league reminder | Thu 10 Dec, morning | C29 entrants | picks lock at show start; link to picks and live table | "Check your picks" |
| The Game Awards (Save File #11) | Fri 11 Dec | N1 audience | winners list, reveals worth attention (linked to game pages with "Remind me"), league final table | "Remind me about the reveals" |
| Steam Winter Sale | Thu 17 Dec | members with ≥1 discounted wishlist game | "{n} games on your wishlist are in the Winter Sale", prices, sale end 4 Jan (Steam's stated date) | "See them all" |

---

## 6. Sign-up placements (exact copy)

All forms post to `/newsletter/subscribe` with `placement` and optional interest tags (D-012a); all use double opt-in. Event: `newsletter_signup` (placement), then `newsletter_verified`. No placement shows a subscriber count.

### P-01 `/newsletter` landing (new, D-012; live by Mon 12 Oct)

> **The Save File**
> # One email on Fridays.
> The week's games news that changes what you play, what's out next week, one number worth knowing, and what the TechPlay community is arguing about. Written and edited by the TechPlay team in Sarajevo.
>
> **What's in it**
> · The week: three stories at most, and why they matter to what you play
> · Out next week: release dates, platforms and prices, with reminders
> · The Number: one statistic with its source
> · Until 19 November: one confirmed GTA VI fact a week
>
> [email] **[Subscribe]**
>
> Also send me (optional):
> ☐ The GTA VI briefing: weekly until launch, three emails in launch week, then it stops.
> ☐ Sale alerts during Steam sales and Black Friday.
>
> We send one confirmation email first. Nothing else arrives until you click it. Every email has a one-click unsubscribe.
>
> [Read past issues] · Want reminders for specific games? That's the free account: [Start your library]

Success state: "Check your inbox. Click the link in the email from TechPlay and the first issue arrives on Friday." SEO: title "The Save File — TechPlay's weekly games newsletter"; indexable.

### P-02 Article end (D-010, C46; below the account block for guests, alone for members who aren't subscribed)

> **The Save File** — The week in games, in one email on Fridays.
> [email] **[Subscribe]**
> One confirmation email first. Unsubscribe from any issue in one click.

### P-03 Homepage band (new; above the footer)

> # Friday, in one email.
> What happened, what's out next week, and one number worth knowing. From the TechPlay editors.
> [email] **[Get The Save File]** · [See a past issue]

### P-04 Game page, released game (below "Add to your shelf")

> News about games like {Game}, every Friday. [email] **[Subscribe]**

### P-05 Game page, unreleased game (below "Remind me")

> Or get next week's releases every Friday in The Save File. [Subscribe]

### P-06 GTA 6 hub (replaces "Don't miss a single GTA 6 drop — Join thousands of fans…"; W40)

> # GTA VI, only when something is confirmed.
> A short email each Thursday until 19 November: what's confirmed, what's still rumour, and the sources. In launch week, the unlock time for your time zone. After launch it stops, unless you ask for guides.
> [email] **[Get the GTA VI briefing]**
> One confirmation email first. Or talk it through on Discord: [discord.gg/wPQG9gUMXH](https://discord.gg/wPQG9gUMXH)

Tags: `gta6`, placement `gta6-hub`. The dead `discord.gg/techplaygg` link is replaced in the same change (D-004).

### P-07 `/calendar` (top of the page, one line)

> Next week's releases, every Friday. [email] **[Subscribe]** · Members get a personal list on Mondays: [Start your library]

### P-08 Section hub sidebars (existing box on /news, /reviews, /hardware, /guides)

> **The Save File** — One email on Fridays: the stories that change what you play, and what's out next week.
> [email] **[Subscribe]**

(Replaces "Stay in the loop — The bigger stories, sent when there is something worth sending.", which promised no cadence.)

### P-09 Registration form (15 R-30)

> ☐ Send me The Save File, one email on Fridays. Stop it from any issue.

### P-10 Unsubscribed page (fix dead `/#newsletter` anchor)

> You're unsubscribed. No more issues will arrive.
> Left by mistake? [Subscribe again](/newsletter) — we'll send one email to confirm it's you.

### P-11 Discord (#announcements pinned post and C35 welcome)

> The Save File: one email on Fridays with the week, next week's releases and the poll result. techplay.gg/newsletter

### P-12 Footer (every page, text link)

> The Save File, every Friday → /newsletter

**Double opt-in email (edit the `NewsletterVerification` template; words only):**
Subject: "Confirm The Save File" · First line: "One click and the first issue arrives on Friday." · Body: "You (or someone using this address) asked for The Save File at techplay.gg. If that wasn't you, ignore this email; nothing else will arrive." · Button (drawn by code): "Confirm my subscription".

---

## 7. Welcome sequence for newsletter subscribers (C42; live Mon 12 Oct)

Trigger: `newsletter_verified`. Exit: unsubscribe; N-W3 is skipped if the subscriber becomes a member. If a step would land on a Friday, it moves to Saturday so it never sits beside an issue.

**N-W1 — immediately after confirmation**
- Subject: "You're in: here's what arrives on Fridays"
- First line: "The Save File arrives on Fridays at about 14:00 UTC. Here's what's in it, and how to make it more useful."
- Body:
  "Each issue has the week's stories that change what you play (three at most), the releases coming next week with platforms and prices, one number with its source, and what the community argued about.
  Two things you can do now:
  1. Add {from_address} to your contacts, so the first issue doesn't land in promotions. *(DEV fills the real sending address; it is not changed by this plan.)*
  2. Read last week's issue: [past issues].
  If something in an issue is wrong, reply to it. A person reads the replies, and corrections go in the next issue.
  — {EIC name}, editor, TechPlay"
- CTA: "Read the last issue"

**N-W2 — day 2**
- Subject: "What do you play on?"
- First line: "One click tells us which releases and deals to put first. You can pick more than one."
- Body: "Tap the ones you use. Each link saves the answer and takes you back to the site; nothing else changes.
  [PC] [PlayStation 5] [Xbox Series X|S] [Switch 2] [Steam Deck or another handheld]
  We use it for one thing: the order of 'Out next week'. Change it any time under Email preferences."
- CTA: the five signed links (each writes a platform tag, D-012a)

**N-W3 — day 5 (skipped for members)**
- Subject: "The library that fills itself"
- First line: "Connect Steam and every game you own arrives with the hours you've played. It's free."
- Body: "The Save File tells everyone what's out. A TechPlay account tells you what's out from your own list: one email on release day for each game you're waiting for, and a Monday email with the week's releases from your wishlist.
  Steam and Xbox connect in one click. PlayStation, GOG and Epic take a code you paste once. Some trackers charge for this; ours is free.
  [Start your library] (uses this email address; Google or Steam takes one click)"
- CTA: "Start your library" (`from=newsletter`, 15 R-29)

---

## 8. Reactivation and list hygiene (newsletter)

| Step | Rule | Copy |
|---|---|---|
| Watch | subscriber with no click in 90 days **and** at least 8 issues delivered | — |
| R-1 | one email, sent on a Tuesday | Subject "Still want The Save File?" · First line "You haven't clicked anything in The Save File for three months, which is fine. We'd rather ask than keep sending." · Buttons "Keep sending it" (signed click = re-engaged) and "Unsubscribe me" · "If we don't hear back, we'll stop sending in two weeks. You can subscribe again at techplay.gg/newsletter." |
| Suppress | no click within 14 days of R-1 | set inactive (D-013e: an `inactive` reason or `is_active=false`); never deleted, never re-added without a new opt-in |
| Hard bounce | first hard bounce | suppressed as `bounced` (needs D-013c) |
| Complaint | any spam complaint | suppressed as `complained` (needs D-013c) |

No guilt copy: "We miss you", "Come back", "Last chance" are banned (16 §4.6).

---
## 9. Subject lines and preview lines, Q4 2026

Dates are from the spine calendar (§11) and [R05]; "reported" items are phrased as reported. Braces are filled from live data at send time; a line whose data is missing is rewritten, not sent with a blank.

| # | Send date | Product | Subject | Preview line (first visible line) |
|---|---|---|---|---|
| 1 | Fri 2 Oct | N1 #1 | The Save File #1: Autumn Sale, Ace Combat 8, 48 days to GTA VI | Steam's Autumn Sale runs until Thursday 8 October, Ace Combat 8 is out today, and Gears of War: E-Day arrives Tuesday. |
| 2 | Fri 9 Oct | N1 #2 | The Save File #2: Gears of War: E-Day, and when GTA VI unlocks for you | Gears of War: E-Day has been out since Tuesday on PC and Xbox. Next week: Planet Zoo 2 on Tuesday and our GTA VI release-time page. |
| 3 | Thu 15 Oct | N3 | GTA VI briefing: 35 days, and when it unlocks where you live | 35 days to go. The release-time page is live: it shows the unlock time for your time zone as soon as it's confirmed. |
| 4 | Fri 16 Oct | N1 #3 | The Save File #3: MW4 early access, Next Fest starts Monday | Modern Warfare 4's campaign early access opens today. Steam Next Fest runs 19–26 October, and we're trying three demos a day. |
| 5 | Thu 22 Oct | N3 | GTA VI briefing: 28 days, and the cars we could source | 28 days to go. Our vehicle guide now lists real-world equivalents, with a source for each one we could confirm. |
| 6 | Fri 23 Oct | N1 #4 | The Save File #4: Modern Warfare 4 is out, Next Fest halfway | Call of Duty: Modern Warfare 4 launched today on PS5, Xbox, PC and Switch 2. The best Next Fest demos so far are below. |
| 7 | Mon 26 Oct | N2 (first) | This week: Phantom Blade Zero and {k} more on your list | Phantom Blade Zero is out Thursday on PS5 and PC. Minecraft Bedrock reaches Switch 2 on Tuesday. |
| 8 | Thu 29 Oct | N3 | GTA VI briefing: 21 days, the two editions compared | 21 days to go. Standard is $79.99 and Ultimate $99.99; here's what the extra $20 buys, from Rockstar's own listing. |
| 9 | Fri 30 Oct | N1 #5 | The Save File #5: Phantom Blade Zero, Scream Fest picks, Season 2 | Phantom Blade Zero came out yesterday. Steam's Scream Fest runs until 2 November, and these horror games are worth the discount. |
| 10 | Mon 2 Nov | N2 | This week: WoW: Forever on Wednesday | World of Warcraft: Forever launches Wednesday 4 November. Stellar Blade Complete Edition follows on Thursday. |
| 11 | Thu 5 Nov | N3 | GTA VI briefing: 14 days, what's actually known about performance | 14 days to go. Reports say 30 fps on consoles at launch; Rockstar hasn't confirmed a frame rate. The ledger has the sources. |
| 12 | Fri 6 Nov | N1 #6 | The Save File #6: WoW: Forever is live, 13 days to GTA VI | World of Warcraft: Forever launched on Wednesday. GTA VI is 13 days away; here's what is confirmed and what isn't. |
| 13 | Mon 9 Nov | N2 | This week: Pikmin 4 and Metaphor on Switch 2 | Pikmin 4's Switch 2 Edition and Metaphor: ReFantazio for Switch 2 both arrive Thursday 12 November. |
| 14 | Thu 12 Nov | N3 | GTA VI in one week: editions, pre-load, unlock time | GTA VI is out next Thursday on PS5 and Xbox Series X\|S at $79.99, or $99.99 for the Ultimate Edition. |
| 15 | Fri 13 Nov | N1 #7 | The Save File #7: GTA VI week starts Monday | GTA VI is out Thursday 19 November. Set a reminder and we'll email you the unlock time for your time zone once it's confirmed. |
| 16 | Mon 16 Nov | N2 | This week: GTA VI, Thursday | GTA VI is out Thursday on PS5 and Xbox Series X\|S. It's on your list, so you'll get one email on the day. |
| 17 | Wed 18 Nov | N3 | GTA VI unlocks tomorrow. Here's when, where you are | The release-time page lists the unlock time for each region, updated as Rockstar and the stores confirm it. |
| 18 | Wed 18 Nov | N4 (all opted-in members) | The Game Awards prediction league is open | Pick the winners before 10 December. Picks lock when the show starts, and the table updates live. |
| 19 | Thu 19 Nov | N3 launch edition | GTA VI is out. Start here. | GTA VI is out today on PS5 and Xbox Series X\|S. It's single-player at launch, and there's no PC version yet. |
| 20 | Fri 20 Nov | N1 #8 | The Save File #8: GTA VI's first day, and what's next | GTA VI has been out since yesterday. What to do first, the map tracker, and what we know about a PC version. |
| 21 | Sun 22 Nov | N3 (last) | GTA VI, first weekend: the map tracker and what to do first | Our map tracker lets you tick off locations as you find them, and it saves to your account. This is the last briefing. |
| 22 | Mon 23 Nov | N2 | This week: {n} of your wishlist games are on sale | Black Friday is Friday 27 November, but {Game} is already {discount}% off on Steam. |
| 23 | Fri 27 Nov | N1 #9 Black Friday | The Save File #9: Black Friday, sorted by your wishlist | Members: the discounted games from your wishlist are at the top. Everyone: our picks, with prices checked this morning. |
| 24 | Mon 30 Nov | N2 Cyber Monday | Cyber Monday: what's still discounted on your wishlist | Steam prices for the games you wishlisted, checked at 06:00 UTC today. |
| 25 | Tue 1 Dec | N4 (opted-in members) | Nominate your games of 2026 | The TechPlay Community Awards are open until 20 December. Six categories; members nominate, then everyone votes. |
| 26 | Fri 4 Dec | N1 #10 | The Save File #10: Dawn of War IV, Monster Hunter Wilds on Switch 2 | Dawn of War IV came out yesterday, and Monster Hunter Wilds reaches Switch 2 today. The Game Awards are next Thursday. |
| 27 | Mon 7 Dec | N2 | This week: Professor Layton, and your November | Professor Layton and the New World of Steam is out Thursday 10 December, the same night as The Game Awards. |
| 28 | Thu 10 Dec | N4 (league entrants) | Tonight: The Game Awards, and your picks lock at showtime | The show starts tonight. You can change your picks until it does; after that the table updates with each award. |
| 29 | Fri 11 Dec | N1 #11 TGA | The Save File #11: every Game Awards winner, and the reveals worth a reminder | The Game Awards were last night. The winners, the reveals worth your time, and how the prediction league finished. |
| 30 | Mon 14 Dec | N4 (A2 members) | Your 2026 in games is ready | {h} hours across {p} platforms, and your most played game was {game}. See the rest, and share it if you like. |
| 31 | Thu 17 Dec | N4 Winter Sale | Winter Sale: {n} games on your wishlist are discounted | Steam's Winter Sale started today and runs to 4 January. {Game} is {discount}% off. |
| 32 | Fri 18 Dec | N1 #12 | The Save File #12: the Winter Sale, and the Community Awards results | Steam's Winter Sale runs until 4 January; here's what's worth it. Voting in the Community Awards closes Sunday. |
| 33 | Mon 21 Dec | N2 | This week: {n} wishlist games still discounted, and nothing out on Christmas Day | {Game} is still {discount}% off in the Winter Sale. Nothing on your list releases this week. |
| 34 | Thu 31 Dec | N1 #13 | The Save File #13: 2026 in games, and what's coming in 2027 | The year in releases and studio closures, and the 2027 dates already fixed: Fable on 23 February, FF7 Revelation on 8 April. |
| 35 | on confirm | N-W1 | You're in: here's what arrives on Fridays | The Save File arrives on Fridays at about 14:00 UTC. Here's what's in it, and how to make it more useful. |
| 36 | reactivation | R-1 | Still want The Save File? | You haven't clicked anything in The Save File for three months, which is fine. We'd rather ask than keep sending. |

Check before each send (SC): every date and platform against the game page; every "reported" item labelled; Braces filled; no line claims a count we cannot show.

---

## 10. Full copy: The Save File #1, Friday 2 October 2026

Audience: all verified subscribers. UTM campaign `c40-save-file-2026w40`. Items in square brackets are editor fills from the site on the morning of 2 Oct; nothing in brackets goes out unfilled.

**Subject:** The Save File #1: Autumn Sale, Ace Combat 8, 48 days to GTA VI

> Steam's Autumn Sale runs until Thursday 8 October, Ace Combat 8 is out today, and Gears of War: E-Day arrives Tuesday.
>
> This is the first Save File in its new form: one email on Fridays, short enough to finish with a coffee. If something here is wrong, reply and tell us; a person reads every reply, and corrections go in the next issue.
> — Adi Zeljković, editor
>
> **The week**
>
> **Xbox had its hardest week in years.** Outlets reported Halo Studios' effective closure, Ninja Theory heading towards closure, Obsidian moving under Bethesda and a split at Double Fine, all within a few days. If you own games from these studios nothing changes in your library, but patches and sequels are another matter. We're building a tracker of every studio closed in 2026, with the games each one made; it goes live on 14 October. [Our coverage](/news/industry)
>
> **Sony asked players about ending discs.** Sony's reported plan to stop making PlayStation discs, and the survey it sent players, drew coverage across the press this week. Digital is only bad when it's the only option. [Sign The Last Disc](/last-disc), our open letter asking Sony to keep a physical choice.
>
> **Ace Combat 8: Wings of Theve is out today.** [Game page, with where to play it](/games/[slug])
>
> **Out next week**
>
> | Date | Game | Where |
> |---|---|---|
> | Tue 6 Oct | Gears of War: E-Day | PC, Xbox |
> | Fri 9 Oct | Dragon's Dogma 2: Dark Arisen (reported), with a Switch 2 version | [platforms from the game page] |
> | Tue 13 Oct | Planet Zoo 2 | [platforms from the game page] |
>
> World of Warcraft patch 12.1.5 is expected around 6 October on Blizzard's usual eight-week rhythm; that's our estimate, not a Blizzard date. [Check your character with the WoW Analyzer](/wow-analyzer) before it lands.
> [Everything releasing this month](/calendar)
>
> **The Number: 4**
> Call of Duty: Modern Warfare 4 launches on 23 October on four platforms: PS5, Xbox, PC and Switch 2. It's the first Call of Duty on a Nintendo platform since Ghosts. *Source: Activision's announcement, via our release calendar.*
>
> **GTA VI: 48 days**
> Confirmed: 19 November, PS5 and Xbox Series X|S, $79.99, or $99.99 for the Ultimate Edition. Single-player at launch, and no PC version at launch. Everything else you read this week is either reported or rumour, and our new ledger says which, with sources. [Confirmed or rumour?](/gta6/everything-we-know)
>
> **Worth your time**
> The Autumn Sale's biggest discounts are on games you've probably already been told to buy. We picked from Steam's most-wishlisted list instead, and checked each price this morning. [Autumn Sale: the wishlist picks] *(C05 article)*
>
> **Community**
> Game Club starts on Monday: in October we're playing Control Resonant. The kick-off thread opens Monday 5 October on the forum and in Discord, with a voice night date in the thread.
> This week's poll asks whether you'd buy a console with no disc drive at all. It closes tonight; results next Friday. [Vote in Discord](https://discord.gg/wPQG9gUMXH)
>
> **[Set a reminder for GTA VI]** *(primary button; signed link to the reminder for members, to the GTA VI game page for subscribers)*
>
> *For subscribers without an account:*
> **You get the newsletter, not the library.** A free account keeps every game you own in one place, from Steam, Xbox, PlayStation, GOG and Epic, and emails you on release day for the games you're waiting for. [Claim your shelf] (uses this address)
>
> Buffy, our owl, has read the patch notes so you don't have to. See you next Friday.
>
> You're getting The Save File because you subscribed at techplay.gg. [Unsubscribe] (one click) · [Email preferences] · [Read past issues] · TechPlay is published by Luminor Solutions, 71000 Sarajevo, Bosnia and Herzegovina.

Word count ≈ 560. Links: 11. Checks by EIC before 13:00 UTC: the studio items match our own published articles; the Last Disc page loads; the ledger (C07, due 1 Oct) is live, otherwise the GTA link points to `/gta6`.

---

## 11. Full copy: GTA VI launch edition, Thursday 19 November 2026

Audience: tag `gta6` plus members with a GTA VI reminder (members also receive the release-day alert; this edition replaces it for them, so they get one email, not two). Sent at 08:00 UTC. UTM campaign `c10-gta6-launch`.

**Subject:** GTA VI is out. Start here.

> GTA VI is out today on PS5 and Xbox Series X|S. It's single-player at launch, and there's no PC version yet.
>
> **The facts that matter today**
> · Platforms: PS5 and Xbox Series X|S. No PC version at launch; Take-Two has said why, and nothing about a PC date is confirmed.
> · Price: $79.99, or $99.99 for the Ultimate Edition.
> · Single-player at launch. Anything you read about Online dates is unconfirmed until Rockstar says otherwise.
> · Pre-order bonus: the Vintage Vice City Pack.
> · GTA VI: The Album, with Atlantic Records, is out today too.
>
> **When it unlocks where you are**
> [The release-time page](/gta6/release-time) lists the unlock time for each region as Rockstar and the stores confirmed them. Download size is listed on each store's product page; we've copied it onto the same page.
>
> **Start here**
> · **The map tracker** is live: tick off locations as you find them and it saves to your account. [Open the map](/gta6/map)
> · **The vehicle guide** lists the cars and bikes Rockstar has shown, with the real-world equivalents we could source. [Vehicles](/gta6/vehicles)
> · **Confirmed or rumour?** keeps running after launch. Performance reports from the first day will go in with sources, and nothing else. [The ledger](/gta6/everything-we-know)
>
> **This weekend on TechPlay**
> What to do in your first hours, early money that doesn't need a grind, the cars worth finding first, and the console settings worth changing. Each guide goes up as soon as it's tested, not before.
>
> **Game Club: November is GTA VI**
> The launch thread is open in Discord in #gta6. Story spoilers go in the spoiler thread only; the first week is spoiler-free in the main channel. [Join the thread](https://discord.gg/wPQG9gUMXH)
>
> **On your shelf**
> *Members:* [Mark GTA VI as Playing] (one click). If you've linked Xbox or PlayStation, it will also appear after the next library sync. Console playtime doesn't reach us automatically, so log sessions in your journal if you want them in your 2026 recap in December.
> *Subscribers:* A free account adds GTA VI to a library with everything else you play, and the map tracker saves to it. [Start your library]
>
> **[Open the map tracker]** *(primary button)*
>
> One more briefing on Sunday with the first weekend's guides; then the GTA VI briefing stops. If you'd like GTA VI guides after that, the Sunday email has a one-click option.
> — The TechPlay editors
>
> You're getting this because you asked for the GTA VI briefing at techplay.gg. [Unsubscribe from the briefing] · [Unsubscribe from everything] · TechPlay is published by Luminor Solutions, 71000 Sarajevo, Bosnia and Herzegovina.

Pre-send checks (ED, 07:00 UTC): release-time page shows confirmed times only; map attribution settled (D-020) or the tracker is presented without claiming the location data as TechPlay's own; vehicle guide live (C12); any performance claim in the email is labelled "reported" with a source, or removed.

---
