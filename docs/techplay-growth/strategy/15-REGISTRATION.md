# 15 — Registration

Status: Phase 2 plan — 27 Sep 2026
Scope: Part 16. Every place a visitor can become a TechPlay member, what each one says, what it needs built, how it is tested and how it is measured. Builds on the 35-row account conversion map in [R11] §4. Activation and retention after sign-up are in `16-ACTIVATION-RETENTION.md`; email capture and lifecycle mail are in `17-NEWSLETTER-EMAIL.md`.

- **The decision page lies today.** `/register` and `/login` say "15K+ MEMBERS · 50K+ GAMES" (60 users, 333,198 games) and promise XP for reading articles, which awards nothing [R11 §1.4, R02 §5.1]. Removing that is W40 work (D-001, C01) and comes before any promotion.
- **Sell the library, not the points.** The homepage already argues "One library for everything you play"; the register page argues XP, ranks, forum and giveaways. Every CTA in this file uses the library argument, because the log is the hook on every platform that turns gamers into members [R11 §2.5].
- **Social first, email second.** Google, Discord and Battle.net skip Turnstile and the inbox; they are drawn below a four-field form today. The rebuild (C44, D-014) puts them on top, and adds "Sign in through Steam" as the first button once D-015 ships (target 26 Oct) [R11 §5].
- **Return people to where they were.** `?redirect=back` is ignored and only `?from=article` exists. Every CTA gets a `from=` value and every sign-up returns to its page (D-014, D-016).
- **The largest sign-up surface does not exist yet:** a guest "Remind me / Follow" on game and calendar pages that opens a sign-up modal and returns to the game (C45, D-016, live 19 Oct) [R11 §4 rows 3, 5].
- **36 mechanisms** are specified below (R-01 to R-36), each with copy, audience, requirement, A/B test, events (spine §10 names) and a metric formula. Eleven need no new code beyond copy.
- **Honest proof only:** live catalogue count, five free imports, first three comments read by a person, Founding 100 badge (C68). No member counts, no "thousands", no ratings.
- **Measurement first:** the funnel is `registration_start → registration_complete → email_verified → library_connected | shelf_add×3` (A2 Shelved, defined in 16). None of it can be read today (R11 §6; D-007, D-008). No A/B test starts before D-007 is live.
- **Capacity:** about 70 DEV hours over 13 weeks for registration items (≈5.4 h/week of the 20 h DEV budget), about 20 EIC/ED hours of copy, 12 DS hours.

---

## 1. Starting point (FACT unless labelled)

| Fact | Evidence | Consequence for this plan |
|---|---|---|
| 60 users, 13 connected accounts, 2,599 shelf rows (7 Sep 2026) | docs/README.md §8, [R11 §1.5] | Any member count we show invites a comparison with "0 Members" on the forum. We show none. |
| Of 55 members: 50 confirmed email, 21 entered a giveaway, 7 commented, 3 added a game, 2 linked a platform; 45 had zero XP | code comment, [R01 exec summary, R12] | Registration is not the only leak; activation is worse. This file hands over to 16 at `registration_complete`. |
| Five gates for an email sign-up: Turnstile, five password rules plus a breach check, email verification before login, 30-day prune, first three comments held | [R11 §1.3], `RegisterClient.tsx` | Password path is the slow path. Social path is one click. |
| Two readers in one week reported the form as "broken" (Turnstile never rendered; missing upper-case letter) | `RegisterClient.tsx` comments, [R11] | Microcopy must name the rules before typing and name the way out when Turnstile fails. |
| Help centre's two most-read articles are "The Create account button is greyed out" and the missing verification email | [R02 §9] | The verify-email page is a conversion page, not a receipt. |
| Steam is a connect method only; Valve allows OpenID sign-in and asks for its official button | [R11 §5] | D-015: Steam sign-in with library import as step one. |
| Steam OpenID returns no email | [R11 §5] | A Steam-only account is "activated but unreachable" until it adds an email (R-06). |
| `/register` ignores `redirect`; only `from=article` exists and is read from nginx logs | [R11 §1.3 row 8, R01 F16] | D-014 honours `redirect` for social sign-ups and for verified email sign-ups; D-008 captures `from`. |
| Funnel counters (`wizard_shown … d1_return`) are written to Redis and read by nobody | [R11 §6, R01 B.12 #17] | D-007a: a Filament widget that reads them, W41. |
| Giveaway swap replaces the article JoinPrompt while a giveaway runs; GTA 6 draw referenced as closing 20 Oct, nothing active on 27 Sep | [R01 A.3.1, spine §0] | R-11 runs only after the giveaway is verified in admin on 28 Sep (C09). |

## 2. Rules every registration surface follows

1. **One argument.** "One library for everything you play" plus the one mechanism relevant to the page (reminder on game pages, taste match on profiles, character on the Analyzer). No generic perk lists.
2. **Say what the account costs.** "Free, no card." Name the step count honestly: social sign-up is one step; email sign-up needs one click in the inbox.
3. **Never block reading.** No interstitials, no scroll walls. Modals open only on a click the visitor made (D-016).
4. **Every CTA carries `from=<surface>`** from the list in §6, and every sign-up returns to the page it started on (`redirect`), except email sign-ups before verification, which return after the link is clicked (the verify link carries the redirect; D-014).
5. **Gate only what needs an inbox.** Comments, forum posts, giveaway entries and redemptions stay behind a confirmed address. Library, shelf and wishlist should not (security decision D-014a, §4.5).
6. **No numbers we cannot back** (§5). Where a live module reads zero for a guest, hide it (D-029).
7. **One primary action per surface.** On game pages that is "Remind me" (unreleased) or "Add to your shelf" (released); the newsletter sits below it, never beside it.

---

## 3. Mechanism register (R-01 to R-36)

Audience codes are spine §5 segments. "Exists" means no code beyond copy. Metric formulas use spine §10 events; "views" means GA4 `page_view` for guests on that path unless stated. TARGET gives the direction we want; baselines are unknown until D-007 and D-008 are live, so absolute targets are set in W44 from four weeks of data (§7).

### 3.1 Trigger, place, copy, value, audience

| ID | Trigger | Location | Exact CTA copy (headline / button / microcopy) | User value | Audience |
|---|---|---|---|---|---|
| R-01 | Visitor opens the sign-up page | `/register` left panel | "One library for everything you play." / (no button; panel) / "Free, no card. {gameCount} games in the catalogue. Steam, Xbox, PlayStation, GOG and Epic import free." Full copy §4.1 | Knows what the account is for before filling anything | all |
| R-02 | Same | `/register` right panel, top | "Create your account" / "Sign in through Steam" · "Continue with Google" · "Continue with Discord" · "Continue with Battle.net" / "Each one creates your account in one step. Email is below." | One click instead of four fields and an inbox | all |
| R-03 | Clicks the Steam button anywhere (register, login, onboarding, game page modal) | Steam OpenID | Valve's official "Sign in through Steam" image button / microcopy "Your Steam library comes with you. Steam doesn't share your email; we'll ask for one only if you want reminders." | Account and full library in one step | S1, S2, S3, S7 |
| R-04 | Any sign-up that started on another page | all CTAs | No visible copy; after sign-up: toast "You're back where you were. {Game} is on your shelf." (when the start action was a shelf or reminder action) | Finishes the thing they came to do | all |
| R-05 | Email sign-up submitted | `/verify-email` | "Check your inbox" / "Resend the link" / "Not there after five minutes? Check spam and promotions, then resend. Or use Google, Discord or Steam; they don't need this step." Full copy §4.3 | Knows what to expect and has a way out | all email registrants |
| R-06 | Steam-only member sets a first reminder or wishlists an unreleased game | reminder toast/modal | "Where should we send the release-day email?" / "Send it here" / "One email per game, on the day it's out. Change this in Settings." | Gets the reminder they asked for | S1, S2 |
| R-07 | Guest sees the header on any page | Header (desktop) and mobile "Join" tab | Test "Join TechPlay" vs "Start your library" / microcopy none | Clear label for what joining gives | all |
| R-08 | First visit to homepage | Homepage hero (existing) | Keep "One library for everything you play." / "Start your library" / "Free, and no card." plus live line "{n} games added to shelves this week" shown only when n ≥ 50 | Sees the product in use, with a number that can be checked | all |
| R-09 | Scrolls to the end of homepage | Homepage closing band `ProfileCtaBand` | "The record builds itself." / "Start your library" / "This is {member}'s profile card, shared with permission." with a real Gamer DNA card image | Sees the artefact instead of a description of it | S2, S10 |
| R-10 | Reader passes 60% of an article that has `game_id` | Article end block (C46; copy shared with 03-FUNNEL §3.3) | "Keep track of the games in this story" / "Add {game} to my shelf" / until 19 Oct "It goes on your release calendar and your shelf. Free, no card."; from 19 Oct "We'll tell you when it's out, on sale or reviewed. Free, no card." | Tracks the game the article was about | S1, S3, S4, S5, S6 |
| R-11 | Reader passes 60% of any article while a verified giveaway is live | Article end, giveaway swap (exists) | "Giveaway · closes {date}" / "Enter with Google or Discord" / "Free to enter. One click creates the account; the account keeps your library too." | Enters a draw with no form | S4, S7, S10 |
| R-12 | Guest clicks "Remind me" on an unreleased game | Game page and release page (C45) | Modal: "Get a reminder for {Game}" / "Continue with Google" · "Sign in through Steam" · "Discord" · "Use email" / "We'll email you on {date} and put it on your calendar page. You'll come straight back here." | Reminder set without losing the page | S1, S4, S6 |
| R-13 | Guest clicks "Add to Collection"/"Track" on a released game | Game page `TrackGameButton` | Modal: "Put {Game} on your shelf" / same buttons / "Or bring your whole library: Steam and Xbox connect in one click." | Starts a library from the game they're looking at | S2, S3 |
| R-14 | Guest clicks stars on "Rate this game" | Game page `GameRating` | Modal: "Rate {Game}" / same buttons / "Your rating counts toward the reader score on this page." | Their opinion shows on the page | S2, S10 |
| R-15 | Guest clicks "Wishlist" on the calendar or the "Sign in to track" tile | `/calendar` (C45) | "Track everything you're waiting for" / "Start tracking" / "Wishlist games from the calendar and get one email on release day for each. Nothing else unless you ask." | One place for the release dates they care about | S1, S6, S7 |
| R-16 | GTA 6 hub visitor | `/gta6`, `/games/grand-theft-auto-vi` | "19 November, on PS5 and Xbox Series X\|S." / "Remind me on launch day" / "One email on 19 November with the unlock time for your time zone. Free account, one click." | A dated reminder from a source that separates confirmed from rumour | S4 |
| R-17 | Visitor uses the release-time tool | `/gta6/release-time` (C08, D-018) | "Unlocks at {local time} where you are." / "Remind me an hour before" / "We'll email you at {time−1h}. Needs a free account; Google or Steam takes one click." | A reminder at the right hour | S4 |
| R-18 | Guest clicks "Reply" or the comment box | `CommentsSection` | "Join the conversation" / "Sign in to reply" · "Create an account" / "We read the first three comments from every new member before they go up. After that yours appear straight away." | Knows the rule before they commit | S10 |
| R-19 | Guest at the end of a forum thread | `ThreadClient` foot | "Want the replies?" / "Watch this thread" / "Replies land in your notifications. Free account." | Follows a conversation without refreshing | S10, S3 |
| R-20 | Guest opens `/leaderboard` while "Nobody has moved yet this week" | Leaderboard empty state (D-029) | "Nobody has moved yet this week." / "Be the first" / "Connect Steam and your completions and hours count from today." | Turns an empty board into an invitation | S10, S2 |
| R-21 | Guest reads a member's public profile | `/profile/{username}` | "How close is your taste to {username}'s?" / "Find out" / "Taste Match compares genres, shared games and platforms. It needs at least three games on your shelf." | Curiosity with published weights | S2, S10 |
| R-22 | Guest reads a public list or tier list | `/lists/*` | "Make your own" / "Start a list" / "Lists are public, shareable and get their own image when you post them." | Makes the thing they just read | S10, S2 |
| R-23 | Guest types a game into search | Search dropdown | Row action "+ Shelf" / modal as R-13 / "Adds {Game} and brings you back to your search." | Captures intent at its peak | S2 |
| R-24 | Guest opens Backlog Advisor | `/backlog-advisor` guest mode (D-037) | "What should I play next?" / "Import my backlog" · "Answer three questions instead" / "Import is free for Steam, Xbox, PlayStation, GOG and Epic." | Gets an answer as a guest; better one as a member | S2 |
| R-25 | WoW Analyzer result shown | `/wow-analyzer` (D-040) | "Save {character} and track it each reset" / "Continue with Battle.net" / "No password. One click with the account you already play on." | Re-check the same character every Tuesday | S5 |
| R-26 | Unlinked Discord member uses `/profile`, `/library`, `/daily` or `/match` | Discord bot reply | "You haven't linked a TechPlay account yet." / "Link with Discord" (button) / "One click. Your Discord XP and roles follow you to the site." | Their Discord activity counts | S10 |
| R-27 | New Discord member joins | Welcome embed in #new-people (C35) | "Welcome to TechPlay." / "Link your account" / "Step 1: link with /link. Step 2: bring your games in on the site. Step 3: say what you're playing in #what-are-you-playing." | Clear first steps | S10 |
| R-28 | Newsletter subscriber confirms | `/newsletter/verify` success (D-012) | "You're subscribed. First issue: Friday." / "Make it an account" / "Same email, one click with Google. Adds release reminders and a library to the newsletter." | Converts the warmest moment | all subscribers |
| R-29 | Subscriber reads The Save File | Newsletter footer block (D-013) | "You get the newsletter, not the library." / "Claim your shelf" / "Uses this address. Steam, Xbox, PlayStation, GOG and Epic import free." | Upgrade from reader to member | all subscribers |
| R-30 | Email registrant fills the form | `/register` form | Checkbox (unchecked): "Send me The Save File, one email on Fridays." / — / "Stop it from any issue." | Newsletter consent inside sign-up (Hookshot model) | all |
| R-31 | Guest opens a live giveaway | `/giveaway/{slug}` (C09, D-039) | "Enter with one click" / "Continue with Google" · "Discord" · "Steam" / "Come back each day for a bonus entry. Winners are announced on the page and on their profile." | Entry without a form; a reason to return daily until close | S4, S7 |
| R-32 | Member with ≥3 shelf items in first 7 days | Onboarding, register left panel footer (C68) | "Founding 100" / "Start your library" / "The first 100 members who put three games on their shelf get the Founder badge. {remaining} left." | Real, countable scarcity | all |
| R-33 | Someone opens a shared Gamer DNA or list card | OG landing on `/profile/{u}` or `/lists/*` (D-024) | "This is {username}'s gaming DNA." / "See yours" / "Built from the games on a shelf. Connect Steam and yours is ready in one step." | Makes their own version of what they saw | S2, S10 |
| R-34 | December; visitor sees a shared recap | `/year-in-review` (C28, D-025) | "{username}'s 2026 in games" / "See your 2026" / "Across Steam, Xbox, PlayStation, GOG and Epic. Free account; your recap is ready when your library is." | Year in review across platforms, which no platform offers | S2, S10 |
| R-35 | Visitor reads the TGA predictions page | `/awards/2026` (C29, D-026) | "Call The Game Awards before 10 December." / "Make my picks" / "Free account. Picks lock when the show starts; the table updates live." | Compete with friends and the editors | S8, S10 |
| R-36 | Returning visitor opens `/login` | `/login` left panel | "Welcome back." / "Continue with Steam" · "Google" · "Discord" · "Battle.net" / "No account yet? Any of these creates one." | Login page stops repeating false numbers; converts visitors with no account | all |

### 3.2 Requirement, test, events, metric

| ID | Product requirement | A/B test (A vs B) | Events (spine §10) | Success metric (formula, TARGET) |
|---|---|---|---|---|
| R-01 | Copy only; `gameCount` from existing API; D-001, D-014 | A: four mechanism rows. B: one real profile card image plus two rows | `registration_start` (from=*) | `registration_complete ÷ registration_start` on /register, TARGET ↑ |
| R-02 | D-014 (reorder, full-width buttons) | A: social on top. B: email form on top (current order), run only one week as control | `cta_click` (cta_id=reg-google/-discord/-bnet/-steam/-email), `registration_complete` (method) | share of `registration_complete` with method≠email, TARGET ↑; completion rate per method |
| R-03 | D-015 Steam OpenID sign-in, account creation from SteamID64, import job on create | A: Steam first. B: Google first | `registration_complete` (method=steam), `library_connected` (platform=steam) | A2 Shelved rate within 7 days for method=steam vs others, TARGET: steam highest |
| R-04 | D-014 honour `redirect`; D-016 resume action after auth | none (hygiene) | `registration_complete` (from), then the resumed action event (`reminder_set`, `shelf_add`, `comment_created`) | share of registrations with a resumed action within 10 min, TARGET ↑ |
| R-05 | Copy; resend exists; D-014 | A: "resend" primary. B: "use Google instead" primary | `email_verified` | `email_verified ÷ registration_complete(method=email)` within 72 h, TARGET ↑; prune count (`users:prune-unverified --dry-run`), TARGET ↓ |
| R-06 | D-015a email capture for Steam-only accounts, sends verify mail | A: ask at first reminder. B: ask on day 2 in the bell | `email_verified` (method=steam) | Steam accounts with verified email ÷ Steam accounts, TARGET ↑ |
| R-07 | Copy | A: "Join TechPlay". B: "Start your library" | `cta_click` (cta_id=header-join) | header clicks ÷ guest page views, TARGET ↑ |
| R-08 | Counter from `user_games.created_at` (D-029a), hidden below 50 | A: counter shown. B: none | `cta_click` (cta_id=home-hero-library) | hero clicks ÷ homepage guest views, TARGET ↑ |
| R-09 | D-024 card image; written consent from the member (SC) | A: card image. B: four text rows (current) | `cta_click` (cta_id=home-band) | band clicks ÷ homepage guest views, TARGET ↑ |
| R-10 | D-010 article-end block with game variant; `articles.game_id` exists | A: "Add {game} to my shelf". B: generic "Create your profile" (current) | `cta_click` (cta_id=art-end-shelf), `registration_complete` (from=article-game) | registrations from=article-game ÷ article guest views with game_id, TARGET ↑ vs from=article |
| R-11 | Exists; giveaway verified in admin (C09) | A: "Enter with Google or Discord". B: "Enter the giveaway" (current) | `giveaway_entered`, `registration_complete` (from=giveaway) | A2 Shelved rate of from=giveaway accounts, guardrail: giveaway-only share (entered, never shelved) TARGET ↓ |
| R-12 | D-016 guest modal, returns to page; C43 email delivery | A: modal with Steam first. B: Google first | `cta_click` (cta_id=game-remind), `registration_complete` (from=game), `reminder_set` | `reminder_set` by new accounts ÷ guest remind clicks, TARGET ↑ |
| R-13 | D-016 | A: "Put {Game} on your shelf". B: "Track {Game}" | `shelf_add` (status), `registration_complete` (from=game) | new-account `shelf_add` within 10 min ÷ guest track clicks, TARGET ↑ |
| R-14 | D-016 | none until volume allows | `rating_created` | ratings by accounts < 24 h old per week, TARGET ↑ |
| R-15 | D-016; C45 | A: "Track everything you're waiting for". B: "Get release-day emails" | `cta_click` (cta_id=cal-remind), `game_followed`, `reminder_set` (from=calendar) | reminders set per 1,000 guest calendar views, TARGET ↑ |
| R-16 | D-016, D-017 (hub SSR), C08 | A: "Remind me on launch day". B: "Get the unlock time for your time zone" | `reminder_set` (game=gta6), `registration_complete` (from=gta6) | GTA VI reminders set ÷ hub guest views, TARGET ↑ through 19 Nov |
| R-17 | D-018 tool, reminder at T−1h (C43 delivery) | A: reminder T−1h. B: reminder at unlock | `tool_run` (tool=release-time), `reminder_set` | `reminder_set ÷ tool_run`, TARGET ↑ |
| R-18 | Copy; D-014 honours `redirect=back` | A: moderation note shown. B: current "earn community XP" line | `comment_created` (account age < 24 h) | first comments from new accounts ÷ guest reply clicks, TARGET ↑ |
| R-19 | Exists (watch); modal via D-016 | none | `cta_click` (cta_id=thread-watch) | registrations from=forum per week, TARGET ↑ |
| R-20 | D-029 empty state copy | none | `cta_click` (cta_id=leaderboard-empty) | registrations from=leaderboard, TARGET ↑ |
| R-21 | D-024c guest Taste Match preview (shows the three weights, blurred %) | A: blurred %. B: text only | `registration_complete` (from=profile) | new accounts that view a match within 24 h, TARGET ↑ |
| R-22 | Exists; modal via D-016 | none | `list_created` (account age < 7 d) | lists created by new accounts per month, TARGET ↑ |
| R-23 | D-016b guest row action in search | none | `search_performed`, `shelf_add` | adds from search by new accounts per week, TARGET ↑ |
| R-24 | D-037 guest mode | A: import first. B: questions first | `tool_run` (tool=backlog), `library_connected` | `library_connected ÷ tool_run(tool=backlog, guest)`, TARGET ↑ |
| R-25 | D-040 copy and OG; D-040a store `user_id` on analysis when signed in | A: "Save and track". B: no CTA (control) | `cta_click` (cta_id=wow-save-character), `tool_run` (tool=wow), `registration_complete` (method=battlenet, from=wow) | Battle.net registrations ÷ Analyzer runs, TARGET ↑ |
| R-26 | D-011n bot reply with Discord OAuth link | none | `registration_complete` (method=discord, from=discord) | linked Discord members ÷ server members (API count), TARGET ↑ |
| R-27 | C35 Discord onboarding; working invite only | A: three steps. B: link step only | `discord_join` (invite code), `registration_complete` (from=discord) | registrations within 7 days of `discord_join`, TARGET ↑ |
| R-28 | D-012 verify page block, email pre-filled | A: Google button. B: email pre-filled form | `newsletter_verified`, `registration_complete` (from=newsletter-verify) | registrations within 10 min of verify ÷ verifies, TARGET ↑ |
| R-29 | D-013 footer block with signed link that pre-fills email | none | `registration_complete` (from=newsletter) | registrations from=newsletter per issue, TARGET ↑ |
| R-30 | D-014 checkbox writes `newsletter_subscribers` with `source=account` and sends the double opt-in | A: unchecked box. B: no box | `newsletter_signup` (placement=register) | newsletter sign-ups per 100 email registrations, TARGET ↑; unsubscribes from this source, guardrail ↓ |
| R-31 | Exists; D-039 hub indexable while live | none | `giveaway_entered`, `registration_complete` (from=giveaway) | entries by method; A2 rate of entrants, TARGET ↑ |
| R-32 | C68 extends `campaign:founders` from 50 to 100 and uses the A2 rule; live `remaining` count | A: badge line shown. B: hidden | `shelf_add`, `library_connected` | A2 rate in first 7 days, TARGET ↑ |
| R-33 | D-024 DNA card; `/og/list` exists | none | `share_card_generated` (type), `registration_complete` (from=share-card) | registrations per 100 cards shared, TARGET ↑ |
| R-34 | D-025 by 10 Dec | none | `share_card_generated` (type=yir), `registration_complete` (from=yir) | as R-33 |
| R-35 | D-026 by 18 Nov | none | `registration_complete` (from=predictions) | prediction entries by new accounts, TARGET ↑ |
| R-36 | D-001 copy; Steam button after D-015 | none | `cta_click` (cta_id=login-social) | registrations started from /login, TARGET ↑ |

### 3.3 A/B testing rules for a small site

Traffic is low and unknown (search clicks 1–2 a day since 17 Aug [R23 #1]), so most tests will not reach significance. Rules:

1. **No test before D-007 and D-008 are live** and `from=` is captured server-side (C03, target 16 Oct).
2. **One test at a time per surface**, 50/50 split by a first-party cookie set at first page view.
3. **Stop rule:** each arm reaches 100 conversions of the metric, or four weeks pass, whichever comes first. Without 100 per arm, the result is labelled "directional" and the simpler or more honest variant ships.
4. **Order of tests** (highest traffic surfaces first): R-10 (articles), R-12 (game pages), R-02 (register), R-16 (GTA 6 hub, to 19 Nov only), R-05 (verify page).
5. **Never test honesty.** Variants that reintroduce unverifiable claims are not allowed as a "B".
6. Results go into a one-line log kept by EIC: date, test, arms, conversions per arm, decision.

---

## 4. The rewritten `/register` page (C44, D-014; copy owner EIC, build DEV)

Live target: copy and order by Mon 12 Oct; Steam button when D-015 ships (target Mon 26 Oct). Until then the Steam button and its microcopy are omitted, not greyed out.

### 4.1 Left panel (desktop); on phones a three-line strip above the buttons

> **Free account**
>
> # One library for everything you play.
>
> Sign in through Steam and your games arrive with the hours you've already put in. Add Xbox, PlayStation, GOG and Epic when you like, or pick games by hand.
>
> **One library, every platform.** Steam and Xbox connect in one click. PlayStation, GOG and Epic take a code you paste once.
>
> **Hours counted for you.** Steam playtime refreshes every 30 minutes. There's nothing to log.
>
> **Told when it matters.** Wishlist an upcoming game and we'll tell you on release day. *(Until C43 ships on 19 Oct: "We flag it in your notifications on release day.")*
>
> **Your taste, in numbers.** Gamer DNA reads your library back to you and shows how it got each number.
>
> {gameCount} games in the catalogue · 5 platforms import free · No card, no trial
>
> Founding 100: the first 100 members who put three games on their shelf get the Founder badge. {remaining} left. *(Shown only while C68 runs and `remaining` > 0.)*
>
> Independent, edited in Sarajevo. [How we're funded](/about/ownership) *(links to /about until C54 ships on 9 Oct)*

Phone strip (three lines): "One library for everything you play." / "Steam and Xbox connect in one click. Free, no card." / "{gameCount} games in the catalogue."

`{gameCount}` comes from the same API field the homepage uses, rounded down to the thousand and written "333,000+". Never hard-coded (D-001).

### 4.2 Right panel: form order

> # Create your account
> Each of these creates your account in one step.
>
> **[Sign in through Steam]** (Valve's official button image) *(after D-015)*
> Your Steam library comes with you. Steam doesn't share your email; we'll ask for one only if you want reminders.
>
> **[Continue with Google]**
>
> **[Continue with Discord]**
> Discord will ask to "join servers for you": that's the TechPlay server, and you can leave it any time. *(Keep only if the callback does join; see open question 3.)*
>
> **[Continue with Battle.net]**
> Useful if you came for the WoW Analyzer.
>
> ——— or use email ———
>
> **Username** — Letters, numbers, hyphen and underscore. Shown on your profile.
> **Email** — We send one confirmation link. Nothing else unless you tick the box below.
> **Password** — *Shown before typing, not after a failure:* At least 8 characters, with an upper-case letter, a lower-case letter, a number and a symbol. Passwords found in known data breaches are refused, however many rules they meet.
> Live checklist under the field: "8+ characters ✓ · A–Z ✓ · a–z · 0–9 · symbol" (ticks as each is met). Strength word replaced by the count: "3 of 5 rules met".
> **Confirm password**
>
> ☐ Send me The Save File, one email on Fridays. Stop it from any issue. *(R-30; unchecked by default)*
>
> [Cloudflare Turnstile widget]
> Cloudflare checks that you're a person. If the check doesn't appear, use Steam, Google or Discord above; they don't need it.
>
> **[Create account]**
> Disabled-state line (always visible when disabled, never silent): "Still needed: {missing items}."
>
> Email sign-up needs one click in your inbox before you can sign in. Steam, Google and Discord don't.
>
> Already have an account? [Sign in](/login) · By creating an account you agree to the [Terms](/terms) and [Privacy Policy](/privacy).

**Error states (exact copy)**

| Condition | Copy |
|---|---|
| Turnstile failed to load | "The security check didn't load, so this form can't submit. Reload the page, or use Steam, Google or Discord above; they don't need the check." |
| Username taken | "That username is taken. Try adding a number or an underscore." |
| Email already registered | "There's already an account with this email. [Sign in] or [reset the password]." |
| Password breached (server) | "This password appears in a known data breach, so we can't accept it. Pick one you haven't used elsewhere." |
| Server error | "Something failed on our side and nothing was created. Try again, or use Steam, Google or Discord." |

### 4.3 Verify-email page (`/verify-email`)

Pending state:

> **One more step**
> # Check your inbox
> We sent a link to **{email}**. Click it and you're in. It usually arrives within a couple of minutes, from TechPlay.
>
> **What the link unlocks:** your library and imports · reminders for games you're waiting for · comments, forum posts and giveaway entries.
>
> **[Resend the link]**
> Not there after five minutes? Check spam and promotions, then resend. Still nothing? Use Steam, Google or Discord instead; they create the account without this step.
>
> Wrong address? [Start again with a different email](/register)
> Unconfirmed accounts are deleted after 30 days, along with the address.
>
> While you wait: [See what's out this week](/calendar?from=verify-wait)

Resent state: "Sent again to {email}. If two arrive, either link works." Error state: "We couldn't send it just now. Wait a minute and try again, or use Steam, Google or Discord."

Confirmed state (after the link):

> **Confirmed**
> # You're in.
> Next: bring your games in. Steam and Xbox take one click; you can also pick games by hand.
> **[Start your library]** → onboarding wizard (16 §3)
> *If a `redirect` was carried:* **[Back to {page title}]** as the primary button, "Start your library" as secondary.

### 4.4 Login page (`/login`) left panel (R-36)

Replace "15K+ MEMBERS · 50K+ GAMES · 24/7 COMMUNITY" with: "Welcome back." / "{gameCount} games in the catalogue · Steam, Xbox, PlayStation, GOG and Epic import free." Social buttons in the same order as register. Under them: "No account yet? Any of these creates one."

### 4.5 Security decision needed before 26 Oct (D-014a, owner EIC with DEV)

Today an email registrant gets no token until verified, by design: unverified tokens let throwaway addresses farm streaks and redemptions [R11 §1.3 row 3]. Option proposed: a **scoped token** at sign-up that allows library connect, shelf, wishlist and reminders (stored, not sent until verified), and nothing that pays Bounty, XP, entries or posts. If EIC declines, §4.3 copy stays as written and the verify page remains the only path. Either way, the copy must describe the real behaviour.

### 4.6 Guest action modal (D-016; used by R-12, R-13, R-14, R-15, R-19, R-22, R-23)

One component, opened only by a click on a member action. It never opens on scroll or on page load.

| State | Copy |
|---|---|
| Header, reminder | "Get a reminder for {Game}" |
| Header, shelf | "Put {Game} on your shelf" |
| Header, rating | "Rate {Game}" |
| Header, thread watch | "Watch this thread" |
| Header, list | "Start a list" |
| Body line | Reminder: "We'll email you on {release date} and you'll come straight back to this page." Shelf: "Your shelf keeps it with your hours and your other games." Rating: "Your rating counts toward the reader score on this page." |
| Buttons | "Sign in through Steam" (after D-015) · "Continue with Google" · "Continue with Discord" · "Use email instead" |
| Microcopy | "Free, no card. Already a member? [Sign in]" |
| After social sign-up | Modal closes, the action runs, toast: "Done. {Game} is on your shelf." / "Done. We'll email you on {date}." |
| After email sign-up | "Check your inbox. When you click the link we'll finish this and bring you back here." (the action is stored with the redirect) |
| Dismiss | "Not now" (text button). No second prompt on the same page view. |

Events: `cta_click` (cta_id = game-remind | game-track | rate-guest | watch-guest | list-guest | search-guest; the first two as named in 03-FUNNEL §6), then `registration_start`, `registration_complete` (from=game | calendar | forum | list | search), then the resumed action event.

### 4.7 Existing copy to replace (W40–W42)

| Surface (file) | Current copy [R11 §1.1, R01 A.3] | New copy | Week |
|---|---|---|---|
| Sign-in walls, default perks (`SignInWall.tsx`, `BrandPanel.tsx`) | "Earn XP for every comment and article you read" · "Level up and unlock community ranks" · "Join discussions on the forum" · "Enter exclusive giveaways" | "Your games from Steam, Xbox, PlayStation, GOG and Epic in one library" · "Release-day reminders for what you're waiting for" · "Gamer DNA and Taste Match from what you actually play" · "Comments, forum and giveaways with the same account" | W40 |
| Register strip | "15K+ MEMBERS · 50K+ GAMES · FREE FOREVER" | "{gameCount} games in the catalogue · 5 platforms import free · No card, no trial" | W40 |
| Login strip | "15K+ MEMBERS · 50K+ GAMES · 24/7 COMMUNITY" | §4.4 | W40 |
| Register headline | "START / NEW GAME" · "CHARACTER CREATION — Create Your Player" · button "Create Player" | §4.1–4.2; button "Create account" | W42 |
| Leaderboard "How to earn more XP" | "Read articles and leave comments" | "Comment, rate and finish games. Reading doesn't earn XP." | W40 |
| Comments guest panel (`CommentsSection.tsx`) | "Join the Conversation — Log in to comment and earn community XP." | R-18 copy | W42 |
| Comment placeholder (members) | "Share your thoughts… (earn 10 XP!)" | "Share your thoughts. XP arrives when the comment is approved." (first three) / "Share your thoughts." (after) | W42 |
| Article JoinPrompt panel | "Free TechPlay account — Your gaming life, in one place…" "XP, twenty ranks and achievements for what you already play" | Replaced by the C46 end block (03-FUNNEL §3.3 copy, R-10) for articles with a game; for articles without one keep the headline and replace the XP bullet with "One email on release day for games you're waiting for" (after C43) | W41 |
| Roadmap CTA (`RoadmapCTA.tsx`) | "Follow our progress… Join TechPlay" and dead invite | "Lists, Backlog Advisor and the Discord bot are live. [Try lists]" and invite wPQG9gUMXH | W40 |
| Support tiers | "Join our inner circle. Get exclusive benefits…" | Hide the page link from the footer until tiers exist (not a registration surface; flagged to EIC) | W40 |
| GTA 6 newsletter block | "Join thousands of fans…" "Join the Crew" and dead invite | 17 §6 copy | W40 |
| WoW Analyzer hero | "50K+ players analyzed · 4.9/5 rating", "Midnight launches March 2, 2026" | "Takes a few seconds · No account required · Free" and current patch copy (D-040) | W40 |

### 4.8 Steam-only accounts: getting an email (R-06, D-015a)

A Steam sign-up has no email, so it cannot receive the release-day mail, a password reset, or any newsletter [R11 §5]. The ask happens at the first moment the email has an obvious job, never at sign-up:

1. **First reminder or first wishlist of an unreleased game.** Inline under the toast: "Where should we send the release-day email?" [email field] **[Send it here]** · "Just show it on the site". Microcopy: "One email per game, on the day it's out. We'll send a confirmation link first."
2. **If skipped:** bell item on day 2: "Your reminder for {Game} will only show here. Add an email to get it in your inbox." One time only.
3. **Settings → Account:** "Email (not set). Needed for reminders, password-free sign-in links and the newsletter."

The address goes through the normal verify mail (17, E-02 copy). Counted as A1 for Steam accounts. Steam-only members appear in WRM (16) because WRM counts actions, not mail.

### 4.9 Which mechanisms lead for which segment

| Segment | Lead mechanism | Second | Why [research] |
|---|---|---|---|
| S1 Release Planners | R-12, R-15 (Remind me) | R-06 | reminders exist, delivery arrives 19 Oct [R12 §3] |
| S2 Multi-platform Collectors | R-03 (Steam sign-in) | R-13, R-33 | import is the differentiator [R10, R11 §3] |
| S3 PC Tinkerers | R-10 on PC-fix guides ("Following {Game}?") | R-19 | article traffic is what exists [R02] |
| S4 GTA 6 Waiters | R-16, R-17 | R-11 (if the giveaway is live) | dated reminder beats "news" [R17 §8] |
| S5 MMO/WoW Players | R-25 (Battle.net) | R-26 | Analyzer needs no account; saving does [R18] |
| S6 Switch 2 Owners | R-12 on Switch 2 editions | R-15 | release-date intent [R05] |
| S7 Deal Hunters | R-15 with price alerts (D-027) | R-31 | alerts are the reason to hold an account [R12 §2] |
| S8 Industry Watchers | R-35 predictions | R-29 | they read, they don't collect [R14] |
| S9 Balkan gamers & devs | R-10 on regional stories; R-27 | — | small, community-led [R14, R15] |
| S10 Community Regulars | R-26, R-27 (Discord) | R-18, R-21 | Discord is the most active owned channel [R01] |

### 4.10 Paid and partner landings (C56–C58; no spend before 19 Oct, spine §13)

Paid traffic lands on the page that matches the ad, never on `/register` directly. The page carries the guest modal (§4.6) and `from=paid-<network>` plus UTMs (spine §9).

| Test | Landing | Headline | Button | Microcopy |
|---|---|---|---|---|
| C57 Meta registration (US 18+) | `/?from=paid-meta` variant of the homepage hero | "Every game you own, in one list." | "Sign in through Steam" · "Continue with Google" | "Steam, Xbox, PlayStation, GOG and Epic. Free, no card." |
| C58 Reddit, GTA 6 | `/gta6/release-time?from=paid-reddit` | "When does GTA VI unlock where you live?" | "Remind me an hour before" | "PS5 and Xbox Series X\|S, 19 November. Free account, one click." |
| C58 Reddit, WoW | `/wow-analyzer?from=paid-reddit` | "Is your character ready for the next patch?" | "Analyze my character" | "No account needed. Save it with Battle.net to re-check each reset." |
| C56 Google, tool exact match | tool page itself | page H1 | page CTA | — |

Meta pixel and CAPI (D-031) must be behind consent and live before C57 starts on 2 Nov; if not, C57 moves.

---

## 5. Honest proof points

| Can say | Source | Where it's allowed | Condition |
|---|---|---|---|
| "{gameCount} games in the catalogue" (333,000+ today) | API, docs/README.md §8 | everywhere | read live, round down |
| "Steam, Xbox, PlayStation, GOG and Epic import free" | [R01 F17, R10] | everywhere | PlayStation, GOG and Epic described as "a code you paste once" |
| "Some trackers charge for PlayStation and Xbox import. We don't." | [R04 Part C, R10]: SavePoint $9/month, Infinite Backlog $3/month | /register B-variant, ads (C57) | never name the competitors in ads |
| "Steam playtime refreshes every 30 minutes" | scheduler, [R01 B.2.19] | register, onboarding | — |
| "We read the first three comments from every new member" | [R11 §1.3 row 7] | comments CTA, register FAQ | — |
| "Founding 100: {remaining} left" | C68, `campaign:founders` | register, onboarding, Discord | live count; hide at 0 |
| "Independent, edited in Sarajevo" | About page, Impressum [R02 §6.2] | register, newsletter, ads | ownership page C54 live |
| "{n} games added to shelves this week" | `user_games.created_at` | homepage hero | show only if n ≥ 50 |
| Discord member count | Discord invite API | Discord CTAs only | live number; not on /register |

**Never say:** member totals, "thousands", "biggest", "#1", "join the community of…", ratings of our own tools, "XP for reading", "Earn XP for every article", "benchmarks", "15K+", "50K+", "140,000+", "Join thousands of fans", "players analyzed" [spine §2, R02 Appendix B].

---

## 6. `from=` values (one per surface; D-008 stores them on the user row at `registration_complete`)

| Value | Surface | Value | Surface |
|---|---|---|---|
| header | header "Join" | profile | someone else's profile |
| hero | homepage hero | list | public list |
| band | homepage closing band | search | search dropdown |
| article | article end, generic | advisor | Backlog Advisor |
| article-game | article end, game variant | wow | WoW Analyzer |
| giveaway | giveaway page or swap | discord | bot reply or welcome |
| game | game page action | newsletter | newsletter footer |
| calendar | calendar action | newsletter-verify | verify success page |
| gta6 | GTA 6 hub | share-card | shared card landing |
| release-time | release-time tool | yir | year in review |
| comments | comment reply | predictions | TGA league |
| forum | thread foot | login | login page |
| leaderboard | leaderboard empty state | paid-meta, paid-google, paid-reddit | C56–C58 landings (also carry UTMs, spine §9) |

---

## 7. Funnel, reporting and targets

**Funnel stages** (A-stages are defined with SQL in 16 §1):

| Stage | Event | Read from |
|---|---|---|
| Visit to sign-up surface | `page_view` / `cta_click` | GA4 (consented share only) |
| Start | `registration_start` (from) | GA4 + server log |
| Registered (A0) | `registration_complete` (method, from) | `users` row + GA4 |
| Reachable (A1) | `email_verified` | `users.email_verified_at` |
| Shelved (A2) | `library_connected` or third `shelf_add` in 7 days | `connected_accounts`, `user_games` |

GA4 sees only consenting visitors; since the CMP change on 20 Sep 2026 the share is unknown [R23 #11]. Server-side counts (users table, `from` column, nginx) are the source of truth for totals; GA4 is used for rates within the consenting sample.

**Weekly registration report** (SC assembles Mondays, 30 min; D-007a widget):
- registrations by method and by `from`
- verification rate (A1 ÷ A0, email method only, 72 h)
- A2 rate by method and by `from` (7-day cohorts, reported a week late)
- giveaway-only accounts (entered, never shelved) as a share of new accounts — guardrail
- unverified accounts pruned this week

**Targets.** Baselines are unknown. TARGETs are set on Mon 2 Nov from four weeks of D-007/D-008 data using: `target = observed rate for the best method × share we expect to move to it`. Directional TARGETs until then: social share of registrations ↑, verification rate ↑, A2 rate ↑, giveaway-only share ↓, prune count ↓. One absolute TARGET is set now because it is a count we control: **100 members reach A2 by 31 Dec 2026** (Founding 100 badges all awarded, C68).

### 7.1 Weekly sign-up QA (SC, Mondays, 20 minutes)

Two readers found the form broken before we did [R11 §1.3]. Every Monday SC runs each path on a phone and on desktop, in a private window, and logs pass or fail:

1. Email sign-up with a password that misses one rule: the missing rule is named, the button says why it is disabled.
2. Email sign-up with a breached password (use a known test string): the breach message appears.
3. Turnstile blocked (content blocker on): the fallback copy appears and names Steam, Google and Discord.
4. Google, Discord, Battle.net and (after 26 Oct) Steam: account created, lands on the page it started from.
5. Verify mail arrives in Gmail, Outlook and one Apple Mail inbox; note spam or promotions placement.
6. Guest "Remind me" on one unreleased game page: modal, sign-up, return, reminder set.
7. `from=` value present on the new user row for each path (admin view, D-008).
8. No false number on /register, /login, sign-in walls, GTA 6 hub, WoW Analyzer (grep list in D-001).

A failure on 1–6 goes to DEV the same day as P0.

---

## 8. Rollout by week

| Week | Dates | Ships | Mechanisms | Owner | Hours (ESTIMATE) |
|---|---|---|---|---|---|
| W40 | 28 Sep–4 Oct | D-001 false claims off /register, /login, GTA 6 CTA, sign-in walls; D-004 dead invites; verify giveaway in admin (C09) | R-36 copy, R-01 interim copy | DEV, EIC | DEV 4, EIC 2 |
| W41 | 5–11 Oct | D-007 events for §3 names; D-007a funnel widget; D-010 article-end block starts (C46) | R-10 build | DEV, ED | DEV 8 |
| W42 | 12–18 Oct | D-014 register rewrite: social first, copy §4, `redirect`, `from`, R-30 checkbox, verify page; D-012 newsletter landing and verify block; Discord welcome (C35); D-018 release-time tool (C08, 14 Oct) | R-01, R-02, R-04, R-05, R-17, R-18, R-27, R-28, R-30 | DEV, EIC, SC | DEV 10, EIC 4, DS 4 |
| W43 | 19–25 Oct | D-016 guest Remind/Follow modal (C45, 19 Oct); C43 release-day email; D-011n bot link reply | R-12, R-13, R-14, R-15, R-16, R-19, R-26 | DEV, SC | DEV 12 |
| W44 | 26 Oct–1 Nov | D-015 Steam sign-in (C44 close, 26 Oct); D-015a email ask; C68 Founding 100 live; first test R-10 | R-03, R-06, R-32 | DEV, SC | DEV 12 |
| W45 | 2–8 Nov | Targets set (§7); D-029 empty states; C57 Meta test landing uses from=paid-meta (needs D-031) | R-20, R-22, R-23 | DEV, EIC | DEV 6 |
| W46 | 9–15 Nov | D-037 Advisor guest mode; D-024c guest Taste Match preview; R-12 test | R-21, R-24 | DEV | DEV 8 |
| W47 | 16–22 Nov | **Freeze** on registration code (GTA VI week). R-16 runs as built. | — | SC | monitoring 2 |
| W48 | 23–29 Nov | D-024 DNA card; D-040/D-040a Analyzer | R-09, R-25, R-33 | DEV, DS | DEV 6, DS 4 |
| W49 | 30 Nov–6 Dec | R-02 test; R-35 already live from 18 Nov via D-026 | R-35 | DEV | DEV 2 |
| W50 | 7–13 Dec | D-025 Year in Review ready 10 Dec | R-34 | DEV, DS | (budgeted in C28) |
| W51–W53 | 14–31 Dec | YIR live; review all tests; write Q1 list | R-34 | EIC, SC | EIC 3, SC 3 |

Total ESTIMATE for registration items in this file: DEV ≈ 70 h over 13 weeks, EIC ≈ 12 h, ED ≈ 6 h (R-10 game variants), SC ≈ 13 h (weekly report 30 min × 13, Discord copy), DS ≈ 12 h (buttons, modal, card). This shares the DEV budget with C02, C03, C08, C11, C28, C41, C43; the peak weeks W43–W44 need ≈ 12 h of the 20 h DEV week, which leaves no room for other P1 work in those two weeks. See open question 1.

---

## Dependencies and open questions

**Dependencies**
- D-001 and C01 (false claims) before any paid or PR traffic points at /register.
- D-007, D-007a, D-008 (C03) before any A/B test and before targets are set.
- D-014 (register rewrite, redirect, from, checkbox), D-014a (scoped-token decision), D-015 (Steam sign-in), D-015a (email capture for Steam-only accounts), D-016 (guest modal), D-016b (search row action), D-010 (article end block), D-012 (newsletter verify block), D-011n (bot link reply), D-024 and D-024c (cards, guest match), D-025, D-026, D-029 and D-029a (empty states, shelf counter), D-037, D-039, D-040 and D-040a.
- New sub-IDs introduced here (not in the spine list): D-007a funnel widget, D-011n bot link reply, D-014a scoped token decision, D-015a Steam email capture, D-016b search "+ Shelf", D-024c guest Taste Match preview, D-029a weekly shelf-add counter, D-040a store user_id on WoW analyses (the `wow_analyses` table has no `user_id` column today, so Analyzer runs cannot be tied to members).
- C43 (release-day email, 19 Oct) makes the "we'll email you" copy true; until then copy says "notifications".
- 17-NEWSLETTER-EMAIL.md for R-28, R-29, R-30 flows and the Steam-only verify mail.

**Open questions**
1. DEV capacity: W43–W44 carry D-016 and D-015 together (≈24 h). If C08/C11 GTA work cannot slip, D-015 moves to W45 and the register page ships without Steam until 2 Nov. Decision: EIC by 9 Oct.
2. D-014a: does EIC accept a scoped pre-verification token? It changes §4.3 copy and likely the A1→A2 gap more than any copy change.
3. Does the Discord OAuth callback actually add the user to the server (`guilds.join` requested, behaviour unverified)? The microcopy in §4.2 is only true if it does.
4. Founding 100 (C68): `campaign:founders` currently uses "≥5 games" for 50 users; this plan uses the A2 rule (≥3 games or a linked platform) and 100. Confirm which rule the badge uses so the copy matches.
5. Spine and research disagree on the A2 threshold: spine and [R11] use ≥3 shelf items, [R12] uses ≥5. This file uses ≥3.
6. Legal basis for R-30 in the EU: an unchecked opt-in box with double opt-in is assumed sufficient; EIC to confirm with whoever handles privacy.
7. PlayStation import is a manual npsso paste that nobody has completed [R01 F17]; the copy calls it "a code you paste once". If the path is broken, drop PlayStation from "import free" lines until it is fixed.
8. C57 (2–22 Nov) and C58 (9–25 Nov) run through the W47 registration-code freeze. They touch only landings and UTMs, so the freeze holds; confirm with EIC that no landing change is needed in W47.
9. The sign-up QA in §7.1 needs a known breached test password and a test Gmail, Outlook and Apple Mail inbox owned by TechPlay. SC to set these up in W40.
