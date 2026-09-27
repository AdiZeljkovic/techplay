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
  1. Add hello@ … *(DEV: the actual From address)* to your contacts, so the first issue doesn't land in promotions.
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
