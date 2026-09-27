# 11 — Registration Intelligence: why anyone would create a TechPlay account

Status: Phase 1 research draft — 27 Sep 2026
Agent: reg-retention · Sources: listed in §7 and consolidated in `research-sources.csv`
Labels used throughout: **FACT** (verified in repo or on a fetched page), **OBSERVATION** (seen, not measured), **ESTIMATE** (reasoned, basis stated), **HYPOTHESIS** (untested), **RECOMMENDATION**.

## Executive summary

1. **FACT** — TechPlay's live proposition is coherent on the homepage ("One library for everything you play." → "Start your library") but the `/register` page still sells a different, older product: "Earn XP for every comment and article you read", "15K+ MEMBERS · 50K+ GAMES · FREE FOREVER". Article reads award no XP (the constant was removed 11 Aug 2026), the database holds 60 users and 333,198 games. The one page where a visitor decides to sign up is the one page with two false numbers and one false perk.
2. **FACT** — Registration is a five-gate chain: Turnstile → password with five rules → email verification (no token until verified, login refused until verified) → 30-day prune of unverified accounts → the first three comments of every new member are held for moderation. Two readers in one week reported the form as "broken" because the button silently refused (comment in `RegisterClient.tsx`). Social sign-up (Google, Discord, Battle.net) skips Turnstile and email verification entirely — it is the low-friction path and it is visually subordinate.
3. **FACT** — Steam is a *connect* method (`/connected-accounts/steam/connect`), not a *login* method. Steam is an OpenID 2.0 provider and Valve's docs explicitly allow a SteamID to be "used as the login credentials for the 3rd party website". For a site whose headline is "one library for everything you play", the login button that would fill the library on the first click does not exist.
4. **FACT** — The evidence from the platforms that convert gamers into members (Backloggd 69.6M plays logged / 842K lists; HLTB "354 new users, 24,538 new backlogs, 7,185 completions in 48 hours"; Letterboxd >30M members; Goodreads 20M by 2013) is that the hook is **the log** — a record of what you did — not points, ranks or community. TechPlay already has the stronger version of the log (imported playtime, sessions proposed from Steam readings) and under-sells it on every gated surface except the homepage.
5. **FACT** — Gaming media (IGN, Push Square, Nintendo Life) give a registrant almost nothing: Hookshot's form lists no benefit at all; IGN's flow is email-first ("Enter your email and we'll check if you already have an account") and the reward is Playlist (backlog/wishlist tracking) and a daily game. TechPlay's *media* half therefore competes on a floor where nobody has a strong account proposition, and its *platform* half has one.
6. **OBSERVATION** — The activation funnel is instrumented (Redis counters for `wizard_shown … d1_return`, `?from=article` in nginx logs) but there is no definition of "activated" and no report that reads the counters. 13 connected accounts among 60 users (21.7%) and 2,599 shelf entries (43 per user, ESTIMATE: heavily skewed to a few importers) are the only activation numbers that exist.
7. **RECOMMENDATION** — Treat "connected one store OR three games on the shelf" as the activation event, put Steam/Google/Discord sign-in above the form, make the register page's copy match the homepage, delete the two false numbers today, and gate nothing behind email verification that does not need an inbox (reading the shelf, browsing, wishlisting) while keeping the gate on comments, forum and giveaway entry.

---

## 1. TechPlay's current proposition — what the site actually says and does

### 1.1 Copy inventory: every sign-up call to action on the live site (FACT, repo grep + curl 27 Sep 2026)

| Surface | File | Visible copy | Destination |
|---|---|---|---|
| Header (desktop, signed out) | `components/layout/Header.tsx` | "Sign In" · "Join TechPlay" (`rel="nofollow"`) | `/login`, `/register` |
| Mobile "More" sheet / tab bar | `MoreSheet.tsx`, `lib/mobileBar.ts` | "Register" · tab label "Join" | `/register` |
| Homepage hero | `components/home/HomeHero.tsx` | Eyebrow "Gaming, on the record" · H1 "One library for everything you play." · body "Connect Steam, PlayStation and Xbox and your games arrive on their own — with the hours you put in. Add anything else by hand. Then TechPlay reads it back: your taste, your year, and what to play tonight." · stats "3 Platforms in one place / 333,000 Games in the catalogue / Free To keep a library" · CTA **"Start your library"** + "Browse the catalogue" | `/register`, `/games` |
| Homepage closing band | `components/home/ProfileCtaBand.tsx` | "What an account is for — The record builds itself." Four mechanisms: "One library, every platform", "Hours counted without you", "Your taste, in numbers", "How close your taste is to anyone else's". CTA "Start your library" · "Free, and no card · Already have an account?" | `/register` |
| Article pages (signed-out only) | `components/news/JoinPrompt.tsx` | Panel: "Free TechPlay account — Your gaming life, in one place. Link a store and your shelf fills itself — every game, with the hours already on them." Offer list: whole library from Steam/Xbox/PlayStation/GOG/Epic; "XP, twenty ranks and achievements for what you already play"; "A record of what you finished, and what you thought of it". CTA "Create your profile" · "I already have one" · "Free, and it takes a minute." Inline variant between paragraphs. **When a giveaway is running the panel is replaced by the giveaway** (GTA 6 draw, closes 20 Oct per code comment). | `/register?from=article`, `/giveaway/{slug}?from=article` |
| Comments (signed out) | `components/comments/CommentsSection.tsx` | "Join the Conversation — Log in to comment and earn community XP." Button "Sign Up" | `/register?redirect=back` (the register page ignores `redirect`; see §1.3) |
| Game rating modal | `components/games/GameRating.tsx` | "Rate this game" → "Create Account" | `/register` |
| Forum sidebar / thread foot / create | `ForumSidebar.tsx`, `ThreadClient.tsx`, `forum/create/page.tsx` | "Join the community — Register"; "Join the Discussion — Sign Up"; "Sign up" | `/register` |
| Sign-in walls (profile-only pages) | `components/auth/SignInWall.tsx` + `BrandPanel.tsx` | Login card face; default perks: "Earn XP for every comment and article you read", "Level up and unlock community ranks", "Join discussions on the forum", "Enter exclusive giveaways". "New player? Create your account →" | `/login?redirect=…`, `/register` |
| Roadmap | `components/roadmap/RoadmapCTA.tsx` | "Follow our progress and be the first to know when new features drop. Join our community…" → "Join TechPlay" | `/register` |
| Support tiers | `app/support/SupportClient.tsx`, `TierCard.tsx` | "Join our inner circle. Get exclusive benefits while supporting independent gaming journalism." → "Join Now" | checkout (shop **not launched**: `support_tiers` empty, PayPal sandbox — README §17) |
| Newsletter forms | `SectionHub.tsx` (section hubs), `Gta6NewsletterCTA.tsx` ("Join thousands of fans… Join the Crew"), `FrontiersClient.tsx` | email → `/newsletter/subscribe` (double opt-in) | not an account |
| Lists social bar | `components/profile/ListSocialBar.tsx` | "Sign in to join the discussion." | `/login` |
| Footer | `Footer.tsx` | "Join our Discord" | Discord invite |

**FACT** — `app/newsletter/unsubscribed/page.tsx` links "Sign up again" to `/#newsletter`; no element with `id="newsletter"` exists in `app/` or `components/` (grep). The re-subscribe path lands on the top of the homepage.

**FACT** — The GTA 6 newsletter CTA claims "Join thousands of fans". `newsletter_subscribers` count is not in the README's measured table → **UNKNOWN**; the claim is unverified copy in the same family as "15K+ MEMBERS".

### 1.2 The `/register` page itself (FACT, `app/(auth)/register/RegisterClient.tsx` + live curl)

Left panel (desktop only): eyebrow "NEW PLAYER", headline "START / NEW GAME", "Create your player profile and unlock everything TechPlay has to offer:", four perks (Zap "Earn XP for every comment and article you read", Trophy "Level up and unlock community ranks", MessageSquare "Join discussions on the forum", Gift "Enter exclusive giveaways"), footer strip **"15K+ MEMBERS · 50K+ GAMES · FREE FOREVER"**.

Right panel: eyebrow "CHARACTER CREATION", H1 "Create Your Player", "Set up your profile — it takes less than a minute." Fields: Username ("your gamertag", `^[a-zA-Z0-9_-]+$`), Email, Password (five rules: ≥8, upper, lower, number, symbol — mirrors `RegisterRequest`'s `Password::min(8)->mixedCase()->numbers()->symbols()`), Confirm. Strength labels "TOO SHORT / NOT YET / NOT YET / ALMOST / ONE MORE / READY". Button "Create Player". Divider "Or sign up with": **Google** (full width, "Sign up with Google"), **Discord**, **Battle.net** (`?region=eu`). Footer "Protected by Cloudflare Turnstile". "Already a player? Sign in →".

On success: "Registration successful! Please check your email to verify your account." and redirect to `/verify-email`, which polls `/email/status` every 5 s and offers resend (by address when signed out).

The login page (`LoginClient.tsx`) repeats the numbers: "15K+ MEMBERS · 50K+ GAMES · 24/7 COMMUNITY", with a code comment conceding these are "marketing copy the site has not verified" and deliberately kept off the reusable `BrandPanel` so they do not spread.

### 1.3 Friction map — the chain a stranger walks (FACT unless marked)

| # | Gate | Where | What happens | Evidence / notes |
|---|---|---|---|---|
| 0 | Reaching the page | article pages | Until `JoinPrompt` existed, "nothing on an article page has ever asked": 84 paid-ad arrivals on 1 Sep, 33 stayed >1 min, **0 loaded `/register`** (code comment) | 1,487 phone vs 184 desktop requests → the phone layout is the real one |
| 1 | Cloudflare Turnstile | register **and** login | Token required server-side (`AuthController::register`, `TURNSTILE_ENABLED`); if the widget fails to load the form cannot submit. Social buttons bypass it. | One of two "button does nothing" reports was Turnstile never loading |
| 2 | Five-rule password | register | Client refuses until all five met; server refuses too | The other report was a missing uppercase letter; strength meter used to say "GOOD" at 3/5 |
| 3 | Email verification | `POST /auth/register` | User row created, `VerifyEmailNotification` queued, **no token returned** (`requires_verification: true`); `login()` refuses unverified accounts | Deliberate: an unverified token let throwaway addresses "drive the whole economy — streak claims, redemptions, pledges — forever" |
| 4 | Inbox dependency | mail | Sent from own server "with no reputation at Gmail" (README §20); mail templates editable in admin; class carries fallback copy | Two of three transactional mails "carry the only path into the account" |
| 5 | Prune | `users:prune-unverified` daily 03:20 | Unverified + ≥30 days + no XP/bounty/posts/threads → deleted | A registrant who never verifies silently disappears |
| 6 | Social path | Discord / Google / Battle.net | Creates account, `forceFill(['email_verified_at' => now()])` after create; instant token; Discord path also `guilds.join` | Bug found 10 Sep 2026: 2 of 6 Discord accounts were unverified because `create()` silently dropped the field (README §16) |
| 7 | First-contribution moderation | `CommentController::store` | First **three** comments per member → `pending`, visible only to author; >1 link → pending; 15 s cooldown; 5-min duplicate check; XP and quest progress wait for approval | Message shown: "We check the first three comments from a new member; after that yours appear straight away." |
| 8 | Redirect loss | `/register?redirect=back` from comments | Register page does not honour `redirect` (new account goes to verify-email; `SignInWall` comment: "a promise nothing keeps") | The commenter who signs up is not returned to the comment box |
| 9 | Onboarding | `WelcomeOnboarding.tsx`, `ProfileChecklist.tsx` | Wizard: Steam click / Xbox gamertag / pick games / skip; checklist of 7 ("Connect Steam — import your library in 30s", "Add your first game", "Mark a game as Playing", "Wishlist something unreleased — we'll tell you when it lands", "Star a favourite", "Create a game list", "Join a forum discussion") | Funnel events counted in Redis 90 days: `wizard_shown, wizard_steam_click, wizard_xbox_submitted, wizard_pick_started, wizard_pick_done, wizard_skipped, checklist_steam_click, d1_return` |

**ESTIMATE** — Steps 1–5 together mean a password registrant needs a working inbox within 30 days and typically two tab switches before seeing anything. Social sign-up needs one click and no inbox. With Google full-width and Discord/Battle.net half-width *below* the long form, the low-friction path is presented as the fallback.

### 1.4 What the live copy promises vs. what exists (FACT per row)

| Promise (where) | Reality in repo/db | Verdict |
|---|---|---|
| "Earn XP for every comment **and article you read**" (register, login, SignInWall default perks) | `XpService` constants: comment 10, game added 5, completed 15, review 10, Discord message 15. No read XP; CLAUDE.md: removed 11 Aug 2026 with per-visit view logs | **False** for reads |
| "15K+ MEMBERS" (register, login) | `users` = 60 (7 Sep 2026) | **False ×250** |
| "50K+ GAMES" (register, login) | `games` = 333,198; homepage says 333,000, about page 333,920 | **Under-sells ×6.6** and contradicts the homepage |
| "24/7 COMMUNITY" (login) | 7 forum threads, 22 comments; leaderboard "Nobody has moved yet this week" | Unsupported |
| "Enter exclusive giveaways" | 2 giveaways live; entry requires auth | True |
| "Level up and unlock community ranks" | 20 ranks Newcomer(0)→Eternal(500,000 XP); `LevelService`; 67 achievements; 53 quests; seasons with 1.25× multiplier | True |
| "Join discussions on the forum" | Forum live, 7 threads; meta description "Active community since 2024" | True but thin |
| Homepage "Connect Steam, PlayStation and Xbox and your games arrive on their own — with the hours you put in" | Steam OpenID connect + `SyncSteamLibrary` + `RefreshRecentSteamPlaytime` every 30 min; Xbox via OpenXBL gamertag; PlayStation requires the user to paste an `npsso` token (README §4, §16); GOG, Epic connectors exist | True; PlayStation path is the hard one |
| Homepage "Then TechPlay reads it back: your taste, your year, and what to play tonight" | `GamerDnaService` (derived, with basis), `TasteMatchService` (weights published), `GameRecommendationService`, Backlog Advisor, Journal/`SessionSuggestionService` ("a proposal, never a fact"), `ChronicleBuilder`; OG share cards for profile/list/studio | True |
| Checklist "Wishlist something unreleased — we'll tell you when it lands" | `wishlist:check-releases` 09:00 (today + 3 days) and `SendReleaseReminders` 09:00 → **database notifications only** (bell icon); no email, no push | True only if the user comes back to see the bell |
| Roadmap: "Custom User Lists — Planned", "Bounty System — Planned", "Loyalty Store — Planned", "Professor Buffy AI assistant — Planned Q3", "Mobile App — Planned Q4" | Lists exist (4), bounty exists (`BountyService`, ledger), reward catalog exists, Discord bot Buffy exists (not an AI recommender), mobile app **paused 9 Sep 2026** | Roadmap is stale in both directions |
| Support "Join our inner circle. Get exclusive benefits" | Shop not launched; `support_tiers`, `products`, `orders` empty | Not deliverable today |
| Settings → Notifications "What may reach your inbox" (single toggle) | 20 of 22 notification classes are `['database']` only; only verify + reset mail. The toggle currently governs nothing | Misleading by omission |

### 1.5 Measured baseline (FACT, `docs/README.md` §1, §8, 7 Sep 2026)

users 60 · `user_games` 2,599 · `connected_accounts` 13 · `user_achievements` 240 · comments 22 · notifications 420 · quests 53 · ranks 20 · lists 4 · forum threads 7 · giveaways 2 · articles 638 (635 published). Google-indexed 56,355 pages, 1–2 search clicks/day since the 17 Aug Cloudflare 403 incident; GA consent 2–7% until Google's CMP replaced the banner on 20 Sep 2026.

**ESTIMATE** — 240 achievements / 60 users = 4 each, but "Verified Gamer" (verify email), "Game Hunter" (first game) and "Early Adopter" (before public launch, 200 pts) are near-automatic, so most of the 240 are onboarding artefacts rather than behaviour. 2,599 shelf rows / 13 connected accounts ≈ 200 per connected account: the shelf is almost entirely import-driven (basis: import writes every owned game; manual add is one at a time).

---

## 2. What motivates account creation elsewhere — research by platform type

Method: fetched signup/home/about pages with a browser UA on 27 Sep 2026; where Cloudflare blocked the fetch (GameSpot, Grouvee, IGDB, TrueAchievements, PSNProfiles, Exophase, Steam Hunters, Letterboxd, ResetEra, Serializd body) the Wikipedia article was used as a secondary source and is labelled as such. WebSearch was unavailable in this session (quota exhausted), so no growth interviews could be located — see Gaps.

### 2.1 Gaming media — what a logged-in reader gets

| Site | What the signup page says (FACT) | Hook |
|---|---|---|
| **IGN** (`/register`) | "Join for Free or Log in — Enter your email and we'll check if you already have an account. If not, we'll create a new one." · "Or log in with username" · 18+ confirmation · "Or continue with" [social providers, JS-rendered]. No benefits list on the form. Nav exposes **IGN Daily Games** ("Play today's daily game and challenge your knowledge"), **Playlist**, **Rewards**. | Email-first, one field. Reward is *Playlist* (game tracking: "Backlogged this week", "Wishlisted this week", follow "Playlist Team" lists such as "Most Wanted Games: Playlist Wishlists (All-Time, Unreleased)") and a **daily game**. |
| **HowLongToBeat** (IGN brand, footer) | "Track what you're playing, discover new games. Catalog your gaming collection. Import and conquer your Steam games. See if a potential game purchase is worth your hard earned money. Find out just how long that backlog will take to complete." Account block: "Backlog & Replay", "Custom Lists", "Completed — Mark the games you've completed and help build HowLongToBeat's accuracy", "Retired", "In-Depth Statistics and Tracking". Live counters: "New In The Last 48 Hours: 3 Games Added, 8,596 Games Updated, **354 New Users, 24,538 New Backlogs, 7,185 Games Completed**, 21 New Posts". Also "HowLongToBeat: The Game — A Round-Based Daily Guessing Game". | Log + utility ("is that purchase worth it") + contribution ("help build accuracy") + **social proof from live activity numbers**, not member totals. |
| **Push Square / Nintendo Life** (Hookshot Media, `/users/register`) | Form only: Hookshot Username ("you can change this later, but only once every 90 days"), Email ("We require your email address to send important information about your account"), Password ("You know the drill"), **mandatory radio "Would you like to receive email newsletters from us? Yes/No"**, T&C. **No benefits copy at all.** | None stated. Implicit: comments, game collection/ratings on the game pages, newsletter capture at sign-up. |
| **GameSpot** (`/login-signup/`) | Cloudflare challenge — **UNVERIFIED** | — |

**OBSERVATION** — None of the three fetched media forms sells the account. IGN moved the *reason* out of the form into products (Playlist, Daily Games, Rewards) and removed friction (email-first). Hookshot captures the newsletter consent inside registration, which is a lesson TechPlay can take directly (its newsletter and account are separate lists today).

### 2.2 Game databases and trackers

| Site | Evidence (FACT unless noted) | Hook |
|---|---|---|
| **Backloggd** | Home: "Discover, collect, analyze your games" with counters **Played 69.6M · Games 373K · Ratings 41.4M · Reviews 4.84M · Lists 842K**; "Create a free account or log in". Four pillars: "Track your personal game collection… time tracking, daily journaling, platform ownership"; "Express your thoughts with reviews… Every game has an average rating"; "Keep up with the latest from friends… Follow others for an all-in-one activity feed"; "Create and organize games with lists… tracking your progress or enabling rankings". About: "There's Goodreads for books, Letterboxd for movies, and now Backloggd for games." Free; Patreon backers get a badge and a showcase. Profile has favourite tiles with a movable "crown". Following = "see their activity… based on games they mark as finished". | **Log/journal + identity (favourites, crown) + follow feed + lists.** Ratio 69.6M plays : 4.84M reviews : 842K lists shows the log is the mass behaviour; reviews are 7%, lists 1.2% of plays. |
| **HowLongToBeat** | see 2.1 | Log + utility + contribution + daily game |
| **IGDB** (Wikipedia) | Acquired by Twitch 2019; "letting registered users rate, list and review games. Users can also edit and create pages"; 99,000 members and 428,000 games (Mar 2023) | Contribution/curation; low member count relative to catalogue |
| **Grouvee** | Cloudflare — **UNVERIFIED** | — |
| **TrueAchievements** (Wikipedia; live site Cloudflare-blocked) | "over 400,000 registered users" (Jul 2019); TrueAchievement score = Gamerscore × √(owners/achievers) — a **rarity-weighted score**; friends' feed of completed achievements; "Gaming Sessions — an automated system that assists gamers in arranging play with each other"; badges for milestones and community interaction; regional and user-created leaderboards; per-user stats page (genres, timelines); solutions and walkthroughs. | **Score that re-values what you already have** + leaderboards + sessions (utility) |
| **PSNProfiles, Exophase, Steam Hunters** | Cloudflare — **UNVERIFIED** this session. Known model (OBSERVATION from prior knowledge, not fetched): link a gamertag/Steam ID, get a profile card, rarity stats and leaderboards. | Identity card + rarity |
| **Steam (Valve)** | Wishlist emails "when your game releases or goes on discount", with a **2-week cooldown per appID** and only to customers with verified email (Steamworks docs). Steam Replay / Year in Review pages require sign-in (fetch returned the Sign In page). Steam is an OpenID provider; "a third-party website can use OpenID to obtain a user's SteamID which can be used as the login credentials for the 3rd party website, or linked to an existing account" (Steamworks auth docs); steamcommunity.com/dev: OpenID exists so sites never ask for a Steam password, "which would be a violation of the API Terms of Use", and Valve asks sites to use its sign-in button. | Wishlist→email is Steam's own reactivation hook; the OpenID login is offered to third parties by design |

### 2.3 Communities

| Site | Evidence | Hook |
|---|---|---|
| **ResetEra** (Wikipedia; site Cloudflare-blocked) | "Registration requires admin approval and is required for creating threads and posting messages." | **Scarcity/curation as the hook** — the application is the status. Works only with existing demand; irrelevant to a 7-thread forum. |
| **Reddit** (Wikipedia) | Karma "reflects their standing within the community"; "some subreddits have a karma and account age requirement to discourage bots and spammers"; subscribed subreddits build the personal front page; **Reddit Recap** (Dec 2021, "Spotify Wrapped-like") | Identity via karma + personalisation via subscriptions + annual recap. Reddit's account-age/karma gates are the community-scale version of TechPlay's "first three comments moderated". |
| **Discord** | Quests page (ad product): "Players like our ad format because they are rewarded for engaging… 1. They accept your Quest 2. Play or watch 3. And collect rewards — in-game items and Discord avatar decorations"; Orbs blog (2025): "Reward Your Play: Complete Quests. Earn Orbs. Get Sweet Stuff." | Rewarded tasks funded by advertisers; the currency (Orbs) redeems for cosmetics — a direct analogue of TechPlay's Bounty + reward catalog, with the important difference that Discord's rewards are paid for by a third party. |

### 2.4 Content-logging platforms (the canonical models)

| Platform | Evidence (Wikipedia unless noted) | Hook |
|---|---|---|
| **Letterboxd** | Founded 2011, public Feb 2013; "log, rate, review films, keep a diary of films watched, maintain watchlists, make curated lists, and follow other members' activity"; >30M members (Jul 2026), 17M (Jan 2025, Deadline), "one billion films watched" (2022). Paid Pro/Patron: ad-free, **personal statistics** (hours watched, favourite directors, rating distributions), streaming-availability tool. Annual **Year in Review**. Founding insight: "a film diary, a way for devoted film lovers to share the collecting, watching and cataloging they were already doing privately." | **Diary + four favourites as identity + lists + follow + paid stats.** The product formalises an existing private habit. |
| **Goodreads** | Launched Jan 2007; 650K members Dec 2007 → 10M Jul 2012 → 20M Jul 2013; default shelves read / currently-reading / to-read; **Reading Challenge** ("users commit to reading a certain number of books per year"; literacy research says it increases reading); **My Year in Books** since 2014; "See what books your friends are reading"; Sign in with Apple on every page (fetched). About page: "Goodreads is the world's largest site for readers and book recommendations." | **Shelves + yearly goal + friends' activity + year in review.** |
| **Backloggd** | see 2.2 — explicitly "Goodreads for books, Letterboxd for movies, and now Backloggd for games" | same family |
| **Serializd** | Title "Track all things TV" (FACT); body obfuscated — **UNVERIFIED** | same family |

### 2.5 Synthesis — the hook taxonomy with where it is proven

| Hook | Where it is the primary hook (evidence) | Strength for a games site |
|---|---|---|
| **Log / diary** (what I played, when, how long) | Letterboxd, Goodreads, Backloggd (69.6M plays), HLTB (24.5K backlogs / 48h) | Highest — it is the mass behaviour on every platform fetched |
| **Identity** (favourites, crown, profile card, gamertag) | Backloggd favourites + crown, Letterboxd four favourites, TrueAchievements profile | High; cheap to build; needs the log first |
| **Lists** | Backloggd 842K, Letterboxd, IGN Playlist "Follow" lists | Medium — 1.2% of plays on Backloggd; high SEO/shareability per list |
| **Ratings / reviews** | Backloggd 41.4M ratings vs 4.84M reviews; IGDB | Ratings high (one tap), reviews low (7% of plays) |
| **Stats / year in review** | Letterboxd Pro stats (paid!), Goodreads Year in Books, Reddit Recap, Steam Replay (sign-in required) | High for retention and sharing; TechPlay already derives them (Gamer DNA, Journal) |
| **Social follow / friends feed** | Backloggd, Letterboxd, Goodreads, TrueAchievements friends feed | Medium; needs density TechPlay lacks (60 users) |
| **Notifications** (wishlist release/discount) | Steam wishlist emails with 2-week cooldown | High utility; TechPlay has the trigger but not the channel |
| **Utility** (how long, is it worth it, who to play with) | HLTB, TrueAchievements Gaming Sessions | High; TechPlay's Backlog Advisor and session suggestions are this |
| **Score that re-values what you own** | TrueAchievements TA score (rarity-weighted) | High for achievement hunters; TechPlay imports Steam achievements (`steam_achievements` ~16K rows) |
| **Contribution** ("help build accuracy") | HLTB completions, IGDB edits | Medium; requires trust and moderation |
| **Rewards / currency** | Discord Orbs (advertiser-funded), PlayStation Stars (**ending 2 Nov 2026** per Sony page), Microsoft Rewards | Fragile: Sony is closing its programme; only works when someone else funds the prizes |
| **Comments / community** | Reddit karma; ResetEra approval | Weak as an *acquisition* hook without existing density |
| **Giveaways** | TechPlay's own JoinPrompt swap | Strong short-term acquisition, weak retention (see 12-RETENTION §2) |
| **Daily game** | IGN Daily Games, HLTB "The Game", GuessThe.Game, Gamedle | Return-visit hook; account optional |

---

## 3. Hooks analysis for TechPlay — what exists, what it is worth

Each row: what the repo has (FACT), what the evidence says (FACT/OBSERVATION), verdict (RECOMMENDATION/HYPOTHESIS).

**Profiles & identity.** Exists: `/profile/[username]`, favourites ("favourites headline your profile"), trophy case (`TrophyCaseService`), customizations/badges (Founder badge campaign: first 50 users with ≥5 games, daily 10:00), recognitions, rank insignia, OG share cards (`app/og/profile`). Evidence: Backloggd's crown and Letterboxd's four favourites are the identity surface of the log. Verdict: strong and under-advertised; the register page shows none of it. **RECOMMENDATION** — show a real (consented) member profile card on `/register` instead of the four generic perks.

**Comments.** Exists: 22 comments; first three moderated; "Log in to comment and earn community XP". Evidence: no fetched platform acquires members through comments; Reddit gates posting behind karma/age. Verdict: keep the gate, stop leading with it. **HYPOTHESIS** — the moderation notice would convert better if shown *before* the sign-up ("your first three are read by a person"), because it is a trust signal rather than a penalty.

**Achievements.** Exists: 67 (`AchievementSeeder`) including account-shaped ones ("Verified Gamer", "Gamer Tag", "Plugged In: 3 connected accounts", "Squad Goals: invite 5 who create and verify" — hidden, `criteria_type special`; no referral code path for *accounts* found in routes, only inside giveaways). 240 unlocks. Evidence: TrueAchievements shows rarity-weighting is what makes a score meaningful; Backloggd has none and grows anyway. Verdict: keep as retention, not acquisition. **FACT** — "Squad Goals" promises an account-invite mechanic; no invite/referral endpoint exists outside giveaways → the achievement is unreachable unless awarded by hand.

**XP / rank / level.** Exists: 20 ranks to 500,000 XP with a 100 XP/day cap → **ESTIMATE**: Eternal takes ≥5,000 active days (13.7 years) at the cap; Gold (2,000) takes ≥20 capped days. Quests pay outside the cap. Evidence: none of the log platforms use XP; media sites (IGN Rewards) do. Verdict: fine as a progress bar, weak as a reason to register; the register perk "Level up and unlock community ranks" is the least differentiated line on the page.

**Collections / shelves.** Exists: 7 statuses (`playing, replaying, played, backlog, completed, wishlist, dropped`), import from 5 stores, `played` invented because Steam has no "finished" signal. 2,599 rows. Evidence: this is *the* hook everywhere (§2.5). Verdict: primary hook; already the homepage's argument. **RECOMMENDATION** — make it the register page's argument too.

**Wishlists & release tracking.** Exists: wishlist status, `notify_on_release` per game via `/calendar/{slug}/reminder`, `wishlist:check-releases` (T-3 and T-0), weekly digest lists next-14-day releases — all **database-only**. Evidence: Steam's release/discount email is the industry's proven reactivation trigger; Steam caps to one email per game per two weeks and requires verified email. Verdict: the trigger exists, the channel does not. The checklist promise "we'll tell you when it lands" is only true for people already on the site. See 12-RETENTION §7.

**Notifications.** 22 classes, 20 database-only, 420 rows; bell in header including mobile. Verdict: a bell is a retention surface for people already back; it is not a reason to sign up.

**Game tracking / journal.** Exists: `PlaySession`, `JournalService` (calendar, per-game hours), `SessionSuggestionService` — "Steam has been reporting lifetime playtime per game the whole time… the difference between two readings is a session that happened. This turns that difference into a proposal." Presence (who is playing what now, Steam). Evidence: Backloggd sells "time tracking, daily journaling"; Letterboxd's diary is the founding idea. TechPlay's version needs no typing. Verdict: **the unique, defensible hook** together with import — nobody fetched offers a diary that writes itself from three platforms and asks permission before logging.

**Community / forum.** 7 threads. Evidence: ResetEra's approval model shows community can be the hook only when there is demand to ration. Verdict: not an acquisition hook this year; keep the sidebar CTA but do not lead with "Join discussions".

**Giveaways.** Exists: 2 live; task types include YouTube subscribe, Discord join, daily check-in (repeatable, entry streak), referral (code, points to referrer), verified forum post; 5 entries/IP. JoinPrompt swaps in the giveaway on every article while one runs. Evidence: none of the log platforms use giveaways; media sites do. Verdict: strongest *short-term* account creator TechPlay has, and a known source of low-intent accounts (**HYPOTHESIS**: giveaway-only registrants will not verify at the rate of shelf registrants; measure by `from=` parameter and later activation).

**Personalisation.** Exists: `/feed/personalized` built from `InterestProfile` ("only from things the reader did: what they opened, what they saved, what they replied to, and what is in their game collection… reports whether it found anything at all"), `recommended-news`, weekly digest reads the same `TasteProfileService`. Evidence: Reddit's subscribed front page; Google Discover (fetched doc covers content quality, not "follow" — **UNVERIFIED**). Verdict: a good *second-session* hook; needs the shelf first.

**Followed games.** Does not exist as a follow model; `GameHubController` comment: "a made-up follower count would only have to be retracted later". Wishlist/backlog status is the de-facto follow. Verdict: **HYPOTHESIS** — a "Follow this game → news + release + price" button on 333K game pages is the single largest sign-up surface on the site (56,355 indexed pages, mostly games) and does not exist.

**Saved content.** Exists: `article_bookmarks` (`/articles/{slug}/bookmark`), `article_reads`, thread bookmarks/watchers. Evidence: weak as an acquisition hook anywhere. Verdict: keep; combine into "saved" tab.

**Cross-platform library import (the unique one).** Exists: Steam (OpenID + Web API), Xbox (OpenXBL gamertag + verify), PlayStation (npsso paste — "no OAuth"), GOG, Epic. 13 connected accounts. Evidence: HLTB offers Steam import; Backloggd, Letterboxd, Goodreads offer no automatic import (Goodreads reads Kindle). TrueAchievements/PSNProfiles each read *one* network. Verdict: **no fetched competitor imports three consoles/stores into one shelf**; this is the differentiator the homepage already leads with. Its weakness is that the strongest import (Steam) is one click *after* registration instead of *being* the registration (see §5).

**Gamer DNA card.** Exists: `GamerDnaService` (taste axes, "the payload carries the basis alongside the number"), `TasteMatchService` percentage with published weights, OG profile card route. Evidence: Letterboxd sells *stats* as the paid tier; Spotify-Wrapped-style recaps drive sharing (Reddit Recap, Steam Replay, Goodreads Year in Books). Verdict: **the shareable artefact TechPlay can produce that IGN and Backloggd cannot (cross-platform).** Requires the shelf → requires the account → the card is the reward the register page should show.

---

## 4. Account Conversion Opportunity Map

Priority: P1 = do first (high leverage, low build), P2 = next, P3 = later/needs evidence. "Required feature" reflects the repo on 27 Sep 2026. Expected effects are **HYPOTHESES** unless stated; measurement names the counter that would prove or disprove them.

| # | Touchpoint / page | Trigger moment | Proposed hook (copy direction) | Required feature | Expected effect (HYPOTHESIS) | Measurement | Priority |
|---|---|---|---|---|---|---|---|
| 1 | `/register` left panel | Visitor arrived to sign up | Replace the four perks and "15K+ / 50K+" with the homepage's four mechanisms and live numbers (`gameCount` from API, real member count or none) | exists (copy) | Removes a disprovable claim at the decision point; **FACT** the numbers are wrong today | nginx `/register` → `POST /auth/register` ratio before/after | **P1** |
| 2 | `/register` form order | Same | Put Google/Discord/**Steam** buttons above the password form, form below "or with email" (IGN is email-first; Steam sign-in skips Turnstile and inbox) | Steam login **missing** (OpenID exists for connect); Google/Discord exist | Higher completion; fewer "button does nothing" reports | share of registrations by provider (`users.google_id`, `user_integrations`) | **P1** |
| 3 | Game page (333K pages) | Reader lands from Google on a game | "Add to your shelf" / "Wishlist — we'll tell you when it lands" → sign-up in a modal that returns to the game | shelf exists; **redirect-after-register missing**; wishlist notification channel partial (bell only) | Largest surface on site; **FACT** 56,355 indexed pages | `?from=game` in nginx; wishlist adds in first session | **P1** |
| 4 | Game page | Reader sees "Playing now: N" presence or Steam achievements | "See your own hours and rarity here — connect Steam" | presence exists; per-game rarity **partial** (`steam_achievements` ~16K rows) | Curiosity → connect | connect clicks from game pages (`checklist_steam_click`-style event, new) | P2 |
| 5 | Game page (unreleased) | Release date visible | "Remind me" → account | `notify_on_release` exists; email channel **missing** | Converts calendar intent | reminders set / day | **P1** |
| 6 | `/calendar` | Browsing upcoming releases | Same as 5, batch: "Track everything you're waiting for" | as 5 | — | as 5 | P2 |
| 7 | Article page — JoinPrompt | Scrolled past 50% | Keep the shelf offer; add the reader's *own* game if the article has `game_id`: "Add {game} to your shelf" | `articles.game_id` exists (digest uses it); prompt variant **missing** | Specific > generic | `from=article` vs `from=article-game` | P2 |
| 8 | Article page — giveaway swap | Giveaway active | Keep; add "an account is all it takes — no card, one click with Google" to reduce imagined cost | exists | Higher giveaway entry from articles | `from=article` on `/giveaway/*` | P2 |
| 9 | Review page (score block) | Reader disagrees with a score | "Rate it yourself — your rating counts toward the community score" | `GameRating` exists; modal exists | Ratings are the one-tap contribution (Backloggd 41.4M ratings) | ratings by new accounts within 24 h | P2 |
| 10 | Review page | Reader finished the review | "Been meaning to play this? Backlog it." | shelf exists | Low friction; feeds the wishlist/backlog | backlog adds from reviews | P3 |
| 11 | Homepage hero | First visit | Keep "Start your library"; add a live "N games imported this week" counter (HLTB model: activity numbers, not totals) | counter **missing** (data exists in `user_games.created_at`) | Social proof that can be checked | hero CTA CTR | P2 |
| 12 | Homepage closing band | Scroll end | Add a real, consented member's Gamer DNA card as the image | OG profile card exists | Shows the artefact rather than describing it | band CTA CTR | P2 |
| 13 | `/leaderboard` (signed out) | Sees "Nobody has moved yet this week" | Replace empty state with "Be the first this week — connect Steam and your completions count" | exists (copy) | Turns an embarrassing empty state into an invitation | sign-ups from `/leaderboard` | P2 |
| 14 | `/profile/[username]` (someone else's) | Visitor reads a member's profile | "Compare your taste — see your match %" → sign-up → TasteMatch | `TasteMatchService` exists; guest CTA **partial** | Curiosity hook with published weights | match views by new accounts | P2 |
| 15 | `/lists/*` public list | Reading a list | "Save this list / make your own" | lists, likes, comments exist | Backloggd 842K lists | list saves/creates by new accounts | P3 |
| 16 | `/studios/[slug]` | Reading a studio page | "Follow this studio's releases" | **missing** (no follow model) | Long-tail of 57,630 pages | follows set | P3 |
| 17 | Search dropdown (hero/header) | Types a game they own | Result row action "＋ shelf" for guests → sign-up returning to the game | search exists; action **missing** | Intent captured at its peak | adds from search | P2 |
| 18 | Comments CTA | Wants to reply | "Reply — your first three are read by a person, then you're through" and honour `?redirect=back` on register | redirect **missing** on register | Fewer abandoned sign-ups from comments | comments by accounts <24 h old | P2 |
| 19 | Forum thread foot | Reading a thread | Keep "Join the Discussion"; add watch-thread as the hook ("Get replies in your bell") | thread watch exists | Utility > "join" | watchers set | P3 |
| 20 | Discord server (bot) | Member uses `/daily`, `/profile`, `/library` unlinked | Bot replies with a one-click link that registers via Discord OAuth and lands on the shelf | `/link` exists; Discord OAuth exists with `guilds.join` | Highest-intent audience already in the room | linked Discord IDs / server members | **P1** |
| 21 | Discord news posts (PollingService) | Bot posts an article | Footer "Track {game} on your shelf" deep link | **missing** (bot post format) | Cross-channel intent | clicks (UTM) | P3 |
| 22 | Newsletter (campaigns) | Subscriber opens a campaign | Campaign footer "You are a subscriber, not a member — claim your shelf" with a signed link | campaign system exists (11 Sep); pre-filled email **missing** | Converts the list that already trusts the sender | campaign clicks → registrations | P2 |
| 23 | Newsletter verify success page | Just double-opted-in | "While you're here: make it an account" (email pre-filled, Google button) | `newsletter/verify` page exists | Warm moment | registrations within 10 min of verify | P2 |
| 24 | `/register` success screen | Just registered by email | Show the shelf-import buttons *while they wait for the mail* (import needs no verified inbox if the token is scoped to connect) | **missing** (no token before verification, by design) | Time-to-first-value drops from "after inbox" to "now" | `wizard_steam_click` within first session | P2 (needs a security decision) |
| 25 | `/verify-email` | Waiting for mail | Explain what verification unlocks (comments, giveaways, digest) vs what already works | exists (copy) | Fewer abandoned verifications | verified / registered ratio | **P1** |
| 26 | Login page | Returning visitor without account | Replace "15K+ MEMBERS · 24/7 COMMUNITY" with nothing or true numbers | exists (copy) | **FACT** false claims removed | — | **P1** |
| 27 | `/wow-analyzer` result | User just got an analysis | "Save this character to your profile" (Battle.net sign-up is already one click) | `WowCharacter`, `WowAnalysis` exist; Battle.net OAuth exists | Niche, high-intent | Battle.net registrations | P3 |
| 28 | `/gta6` hub | Fan reading the hub | Newsletter "Join the Crew" → also offer account with GTA 6 wishlisted + release reminder | wishlist exists; reminder channel partial | Converts the hub's audience to a dated reminder | wishlist adds for GTA 6 | P2 |
| 29 | `/backlog-advisor` | Guest tries the tool | "Import your backlog instead of typing it" | tool exists | Utility first, account second | connects from advisor | P2 |
| 30 | Help centre (`help.techplay.gg`) | Reading "how linking works" | Direct connect buttons inside the article | help articles exist (50) | Removes a hop | connects from help | P3 |
| 31 | `/roadmap` | Reading plans | Fix stale "Planned" items that exist; CTA "Try lists now" instead of "Join TechPlay" | exists (copy) | **FACT** page contradicts product | — | P2 |
| 32 | 404 / game tombstone (410) | Dead end | "Search your library instead" with sign-in | `game_tombstones` 61K exist | Minor | — | P3 |
| 33 | Giveaway page | Entering | Offer "sign in with Google/Discord" as the entry step itself; show daily check-in streak as the reason to come back | entry requires auth; check-in task exists | Faster entry; sets a return loop | entries by provider | P2 |
| 34 | Steam Presence ("Playing now") on homepage/game pages | Guest sees live players | "Show yours — connect Steam" | presence exists | Live social proof | connects from presence widget | P3 |
| 35 | Weekly digest (if mailed) | Member receives digest | Include "invite a friend — compare taste" link (would make "Squad Goals" reachable) | digest is **database-only**; invite **missing** | Referral through a real artefact (match %) | invites → verified accounts | P3 |

---

## 5. Social login findings

**FACT (routes/api.php):** account-creating login providers today are **Discord** (`/auth/discord/{redirect,callback}`, requests `guilds.join`), **Google** (`/auth/google/*`, added ~10 Sep 2026), **Battle.net** (`/auth/battlenet/*`, `?region=eu`). All three create the account, then `forceFill(['email_verified_at' => now()])` (after the 10 Sep bug), issue a Sanctum token and redirect to `/auth/callback?token=`. None goes through Turnstile. All three have a `link-intent` flow for attaching to an existing account.

**FACT:** **Steam is not a login method.** The only Steam routes are `GET /connected-accounts/steam/connect` (auth required) and `GET /connected-accounts/steam/callback`; `Cache::pull` consumes the one-time `state`. `SteamService` handles the Web API. There is no `SteamProvider` under `Services/Socialite/` (only `BattleNetProvider`, `DiscordProvider`).

**FACT (Valve docs):** "Steam is an OpenID Provider… a third-party website can use OpenID to obtain a user's SteamID which can be used as the login credentials for the 3rd party website, or linked to an existing account." The Web API key TechPlay already holds is the same one OpenID sites use. Valve asks that sites use its official "Sign in through Steam" button.

**Constraint (FACT):** Steam OpenID returns a SteamID64 and no email. An account created from Steam alone has no verified address, so it cannot receive the verify mail, password reset, or any future email digest, and — by TechPlay's own rule (README §20) — can never be in a campaign audience. **RECOMMENDATION:** treat a Steam-only account as *activated but unreachable*: allow full shelf/library use, ask for an email inside the product ("where should we send the release reminder?") at the moment a reminder is set, and count "email attached" as a separate activation step. This is how the verification gate stays meaningful (comments, giveaways, redemptions still require a verified address) without standing between a Steam user and the shelf.

**Xbox / PlayStation as login:** Xbox on TechPlay is a gamertag lookup via OpenXBL plus a verification step — an identity claim, not OAuth; PlayStation is an `npsso` paste. Neither is a login candidate. **OBSERVATION:** TrueAchievements (Xbox) and PSNProfiles (PSN) built their entire membership on a gamertag/PSN-ID claim without OAuth, so the *claim* model is proven for identity even though it cannot authenticate.

**Google:** present and correctly given full width ("the account almost everybody already has"). **Apple:** absent; Goodreads loads Sign in with Apple on every page (FACT); relevant only when the paused mobile app resumes (Apple requires it when other social logins are offered on iOS — OBSERVATION from platform policy, not re-verified this session).

**Discord:** `guilds.join` means a Discord sign-up can also join the TechPlay server; combined with the bot's `/link`, `/daily`, `/library`, `/match`, `/backlog`, this is the one channel where the account has an immediate second surface. **RECOMMENDATION:** make the bot the register page's third argument ("your shelf answers in Discord too").

---

## 6. What "activated account" should mean for TechPlay — proposals

**FACT:** no definition exists in repo or docs. `FunnelAnalytics` counts eight client events per day in Redis (90-day TTL); `trackD1Return` fires once when an account 24–48 h old returns (localStorage-guarded, so per browser). `campaign:founders` uses "≥5 games in collection" as its own threshold for "a real profile". `users:prune-unverified` uses "xp>0 or bounty>0 or a post/thread" as "somebody was actually here".

**Proposal — three-stage activation (RECOMMENDATION):**

| Stage | Name | Definition (SQL-ready) | Why this line |
|---|---|---|---|
| A0 | Registered | row in `users` | — |
| A1 | **Reachable** | `email_verified_at IS NOT NULL` | The only gate that matters for mail; social sign-ups pass automatically |
| A2 | **Shelved** (the real activation) | `EXISTS connected_accounts` **OR** `COUNT(user_games) ≥ 3` within 7 days of `created_at` | Matches the homepage promise ("one library"); ≥3 because the wizard's "pick games" step makes 1 trivial; the founders campaign already treats 5 as "real" |
| A3 | **Returned** | second distinct active day within 7 days (`last_seen_at` or `FunnelAnalytics d1_return`) | The log platforms live on return visits; a shelf that is never re-read is an export, not a library |
| A4 | **Contributor** (optional) | first approved comment / rating / list / forum post | The moderation queue makes this measurable exactly |

**Candidate metrics (all computable from existing tables; RECOMMENDATION):**
- Registration completion: `POST /auth/register` 201s ÷ `/register` page loads (nginx), split by `from=` and by provider.
- Verification rate: A1 ÷ A0 within 72 h; today's ceiling is visible in `users:prune-unverified --dry-run`.
- Shelf activation: A2 ÷ A0 within 7 days; **today's proxy: 13 connected accounts / 60 users = 21.7% (FACT), shelf-based figure UNKNOWN** without a query.
- Time-to-first-shelf-item: `MIN(user_games.created_at) − users.created_at`.
- Provider mix: share of A2 among Google vs Discord vs Battle.net vs email registrants (HYPOTHESIS: social ≫ email because no inbox wait).
- Source mix: `from=article | game | giveaway | discord | newsletter` → A2 rate per source (HYPOTHESIS: giveaway lowest, game page highest).
- Wizard funnel: `wizard_shown → wizard_steam_click → wizard_pick_done` daily from `FunnelAnalytics::counts()`; **no reader of these counters exists** (FACT: grep shows only the writer) — a Filament widget or artisan command is required.
- D1 return: `d1_return ÷ registrations(t−1d)`; note the localStorage guard undercounts cross-device.

**Anti-metrics to watch (RECOMMENDATION):** giveaway-only accounts (entered, never shelved), unverified-after-30-days prune count (a measure of inbox friction), and password-form "refusals" (Turnstile failures / password rule failures — currently only reported by readers by hand).

---

## 7. Sources used

Fetched 27 Sep 2026 unless marked; consolidated with other sources in `research-sources.csv`.

- https://techplay.gg/ · https://techplay.gg/register · https://techplay.gg/rating-system · https://techplay.gg/roadmap · https://techplay.gg/about · https://techplay.gg/leaderboard — live copy (curl, Chrome UA)
- Repo: `frontend/app/(auth)/register/RegisterClient.tsx`, `login/LoginClient.tsx`, `verify-email/page.tsx`, `components/auth/{BrandPanel,SignInWall,GoogleSignInButton}.tsx`, `components/home/{HomeHero,ProfileCtaBand}.tsx`, `components/news/JoinPrompt.tsx`, `components/profile/dashboard/ProfileChecklist.tsx`, `components/profile/WelcomeOnboarding.tsx`, `lib/track.ts`; `backend/routes/api.php`, `app/Http/Controllers/Api/V1/{AuthController,SocialAuthController,GoogleAuthController,CommentController,GiveawayController}.php`, `app/Services/{XpService,StreakService,LevelService,FunnelAnalytics,SessionSuggestionService,GamerDnaService}.php`, `app/Services/Feed/InterestProfile.php`, `app/Notifications/*`, `app/Console/Commands/{PruneUnverifiedUsers,SendWeeklyDigest,CheckWishlistReleases,AwardFounderBadges}.php`, `app/Jobs/SendReleaseReminders.php`, `database/seeders/{RankSeeder,AchievementSeeder,QuestSeeder,SeasonSeeder}.php`; `docs/README.md` §1, §4, §5, §8, §10, §16, §17, §18, §20; `CLAUDE.md`
- https://www.ign.com/register · https://www.ign.com/playlist · https://www.ign.com/daily-games
- https://howlongtobeat.com/
- https://www.pushsquare.com/users/register · https://www.nintendolife.com/users/register
- https://backloggd.com/ · https://backloggd.com/about/
- https://www.goodreads.com/about/us · https://en.wikipedia.org/wiki/Goodreads
- https://en.wikipedia.org/wiki/Letterboxd · https://en.wikipedia.org/wiki/TrueAchievements · https://en.wikipedia.org/wiki/ResetEra · https://en.wikipedia.org/wiki/Internet_Game_Database · https://en.wikipedia.org/wiki/Reddit
- https://partner.steamgames.com/doc/features/auth · https://steamcommunity.com/dev · https://partner.steamgames.com/doc/marketing/wishlist · https://store.steampowered.com/replay/
- https://discord.com/quests · https://discord.com/blog/discord-orbs
- https://www.playstation.com/en-us/playstation-stars/ · https://www.microsoft.com/en-us/rewards
- https://www.serializd.com/ (title only)
- Blocked (Cloudflare challenge, recorded as UNVERIFIED): gamespot.com/login-signup, grouvee.com, igdb.com, trueachievements.com, psnprofiles.com, exophase.com, steamhunters.com, letterboxd.com/about, resetera.com/register; web.archive.org connections were reset.

## 8. Gaps / needs more data

1. **No web search this session** (quota exhausted before this agent started): Letterboxd founder interviews, Backloggd growth posts and HLTB history could not be located; only Wikipedia-level facts are cited. A follow-up with search should pull the Letterboxd "Year in Review" posts and any Backloggd Patreon/blog numbers.
2. Seven tracker/community sites were Cloudflare-blocked; their live signup copy is UNVERIFIED (TrueAchievements, PSNProfiles, Exophase, Steam Hunters, Grouvee, IGDB, GameSpot, ResetEra).
3. TechPlay's own funnel numbers are UNKNOWN: `/register` page loads vs `POST /auth/register` (nginx), verified ÷ registered, provider mix, `FunnelAnalytics` daily counts (never read back), shelf-based activation rate, giveaway-only account share. All are computable; none has been computed.
4. `newsletter_subscribers` count and campaign click rates: UNKNOWN (not in README's measured table).
5. Whether "Squad Goals" (invite 5) has ever been awarded: UNKNOWN; no invite mechanism found for accounts.
6. Whether the `redirect` parameter on `/register` is intentionally ignored for all sources or only for verification reasons — the `SignInWall` comment suggests the latter; a product decision is needed for social sign-ups, which do not wait for verification and could honour it.
7. PlayStation Stars' announced end (2 Nov 2026, from Sony's page) should be re-checked closer to the date; it changes the competitive picture for reward programmes.
8. Google Discover "Follow" feature: the fetched developer doc did not contain the Follow/RSS section; UNVERIFIED whether the feature still exists in its 2022 form.
