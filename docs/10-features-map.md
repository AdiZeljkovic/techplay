# 10 — Features Map

## News

**Status:** COMPLETE

**Opis:** Gaming news članci s kategorijama, tagovima, hero flagom, view counters, SEO.

**Frontend:** `app/news/`, `components/news/`
**Backend:** `NewsController`, `Article` model, `ArticleObserver`
**Admin:** `NewsResource` (Filament)
**Database:** `articles`, `categories`, `seo_metas`, `article_views`
**API:** `GET /news`, `GET /news/trending`, `GET /news/{slug}`
**Discord bot:** PollingService polira nove članke i šalje na Discord channel
**Napomene:** Article model koristi se i za tech/hardware sadržaj. Real-time update kroz Reverb (`ArticlePublished` event).

---

## Reviews

**Status:** COMPLETE

**Opis:** Game reviews s ocjenama (0-10), specs tabelom, SEO, cover image.

**Frontend:** `app/reviews/`, `components/reviews/`
**Backend:** `ReviewController`, `Review` model, `ReviewObserver`
**Admin:** `ReviewResource`, `Reviews` (folder)
**Database:** `reviews`, `seo_metas`
**API:** `GET /reviews`, `GET /reviews/{slug}`
**Discord bot:** Nije direktno integrisano (samo news polling)
**Napomene:** Review je poseban model od Article. Ima vlastitu tabelu i controller. Real-time update kroz Reverb (`ReviewPublished`).

---

## Tech / Hardware

**Status:** COMPLETE

**Opis:** Tech i hardware recenzije/vijesti, kategorizovano zasebno.

**Frontend:** `app/hardware/`, `components/` (dijelom dijeli komponente s news)
**Backend:** `TechController`, `Article` model (ista tabela kao news, različita kategorija)
**Admin:** `TechResource`
**Database:** `articles`, `categories`
**API:** `GET /tech`, `GET /tech/{slug}`
**Napomene:** Koristi isti Article model kao news — razlikovanje po kategoriji.

---

## Guides

**Status:** COMPLETE

**Opis:** Gaming guides s voting sistemom (upvote/downvote), SEO.

**Frontend:** `app/guides/`, `components/guides/`
**Backend:** `GuideController`, `Guide` model, `GuideObserver`
**Admin:** `GuideResource`
**Database:** `guides`, `guide_votes`
**API:** `GET /guides`, `GET /guides/{slug}`
**Napomene:** Voting sistem kroz `GuideVote` model. Real-time (`GuidePublished`).

---

## Videos

**Status:** COMPLETE

**Opis:** Video embeds (YouTube/Twitch vjerovatno), listing i detalj.

**Frontend:** `app/videos/`, `components/`
**Backend:** `VideoController`, `Video` model, `VideoObserver`
**Admin:** `VideoResource`
**Database:** `videos`
**API:** `GET /videos`, `GET /videos/{slug}`
**Napomene:** Real-time (`VideoPublished`). Format embed URL-a — UNKNOWN.

---

## Game Database

**Status:** COMPLETE (import pipeline funkcionalan, UI robusni)

**Opis:** Lokalna baza igara importovana iz MobyGames. RAWG kao fallback za screenshote/filmove.

**Frontend:** `app/games/`, `components/games/`
**Backend:** `GameController`, `Game` model, `MobyGamesService`, `RawgService`
**Admin:** `GameResource`
**Database:** `games`, `game_companies`, `game_external_ids`
**API:** `GET /games`, `GET /games/{slug}`, `GET /games/calendar`, RAWG fallback endpointi
**Discord bot:** Bot može pretražiti igre (`/search` komanda)
**Napomene:** TEXT[] PostgreSQL arrays za genre/platform/tags — obavezno koristiti `pgArray()` helper. API NIKAD ne proxira live MobyGames — sve je lokalno.

---

## Release Calendar

**Status:** COMPLETE

**Opis:** Kalendar datuma izlaska igara, filtrirano po datumu iz game baze.

**Frontend:** `app/calendar/`
**Backend:** `GameController::calendar`
**Admin:** Upravljanje kroz GameResource (release_date polje)
**Database:** `games` (release_date kolona)
**API:** `GET /games/calendar`
**Discord bot:** CheckWishlistReleases provjerava nove release datume
**Napomene:** Podaci dolaze iz iste `games` tabele. Nije jasno da li postoji poseban UI za mjesečni/tjedni prikaz.

---

## Forum

**Status:** COMPLETE (osnova), PARTIAL (moderacija, advanced features)

**Opis:** Community forum s kategorijama, threadovima, postovima/replyima, search.

**Frontend:** `app/forum/`, `components/forum/`
**Backend:** `ForumController`, `Thread`, `Post` modeli, `ForumPostObserver`, `ThreadObserver`
**Admin:** `ForumCategoryResource`, `SimpleThreadResource`, `PostResource`
**Database:** `threads`, `posts`, `categories`
**API:** `GET /forum/categories`, `GET /forum/threads/{slug}`, `POST /forum/threads`, itd.
**Discord bot:** `/forum` slash komanda prikazuje trending threadove
**Napomene:** Soft delete za postove. Full-text search index. Real-time (`ForumReplyPosted`, `ThreadCreated`). Nema report sistema specifičnog za forum.

---

## User Profiles

**Status:** COMPLETE

**Opis:** Profil je istovremeno logovana naslovnica. Jedna komponenta servira sve profile; sekcije su `?tab=` na `/profile/{username}`.

**Frontend:** `app/profile/[username]/page.tsx`, `components/home-dashboard/` (ProfileHero, ProfileTabStrip, DashboardHome), `components/profile/`, `lib/hero.ts`, `lib/profileTabs.ts`
**Backend:** `AuthController::show`, `ProfileService`, `ActivityService`, `LevelService`
**Admin:** `UserResource`
**Database:** `users` (+ `profile_visibility`), `user_games`, `achievements`, `user_recognitions`, `presences`
**API:** `GET /users/{username}`, `GET /users/{username}/activity`, `GET /users/{username}/collection`
**Discord bot:** `/profile` komanda prikazuje profil
**Napomene:** Profil je deriviran od više tabela — `ProfileService` agregira. Recognition sistem (user-to-user). Steam achievements prikaz. `/` i `/profile/{ti}` renderuju isti `DashboardHome` — redirect nije moguć jer je auth client-side, a `/` je ISR.

---

## Profile Privacy

**Status:** COMPLETE (08/2026)

**Opis:** Dva nivoa — Public (default) i Friends only. Skriva agregate profila, ne dira javno objavljen sadržaj (forum, komentari, recenzije).

**Frontend:** `app/settings/` (Privacy & Data tab), `components/profile/LockedProfile.tsx`
**Backend:** `ProfileService::canViewProfile()`, trait `App\Traits\ProfilePrivacy`, `AuthController::show` + `updateProfile`
**Database:** `users.profile_visibility` (`public` \| `friends`)
**API:** `PUT /user/profile` (`profile_visibility`); svi `/users/{username}*` gate-ovani
**Napomene:** Privatan profil ispada iz leaderboarda i member searcha, ali direktan link i dalje vodi na teaser s Add Friend dugmetom — nikad 404. Provjera je isključivo serverska. Testovi: `tests/Feature/ProfileVisibilityTest.php`.

---

## XP Sistem

**Status:** COMPLETE

**Opis:** XP dodjela za komentare, čitanje, Discord aktivnost, streak, queste. Rank sistem.

**Frontend:** Prikazano na profilu, leaderboardu
**Backend:** `XpService`, `StreakController`, `DiscordXpController`
**Admin:** `RankResource` (threshold za rankove)
**Database:** `users.xp`, `ranks`
**API:** `POST /discord/xp`, `POST /user/streak/claim`, `GET /leaderboard`
**Discord bot:** XpService u botu (15 XP/msg, 60s cooldown) → POST `/discord/xp`
**Napomene:** 100 XP/day cap za web interakcije. Rank promotion automatska po XP thresholds.

---

## Achievements

**Status:** COMPLETE (sistem), PARTIAL (coverage)

**Opis:** Achievement sistem s definisanim achievementima, seed skriptama, prikaz na profilu.

**Frontend:** Prikaz na profilu
**Backend:** `AchievementService`, `Achievement` model
**Admin:** `AchievementResource`
**Database:** `achievements`, pivot tabela za user achievemente (UNKNOWN ime)
**API:** UNKNOWN direktan endpoint za achievemente (vjerovatno dio profil response)
**Discord bot:** UNKNOWN direktna integracija
**Napomene:** Seed skripte postoje (`2026_06_20_000001_seed_gaming_achievements.php`). `SyncAchievements` artisan komanda postoji.

---

## Komentari

**Status:** COMPLETE

**Opis:** Polymorphic komentari na news, reviews, guides, videos. Voting, nesting.

**Frontend:** `components/comments/`
**Backend:** `CommentController`, `Comment` model, `CommentObserver`
**Admin:** `CommentResource`
**Database:** `comments`, `comment_likes`
**API:** `GET /comments/{type}/{id}`, `POST /comments`, `POST /comments/{id}/vote`
**Discord bot:** Nije integrisano direktno
**Napomene:** XP dodjela pri komentiranju (XpService). Real-time (`CommentPosted`). Nema moderacija alata na frontendu.

---

## Search

**Status:** PARTIAL

**Opis:** Pretraga članaka. Forum search postoji posebno.

**Frontend:** Postoji search UI (nepoznata lokacija)
**Backend:** `SearchController::articles`, `ForumController::search`
**Database:** Full-text index na `articles` i `forum` tabelama
**API:** `GET /search/articles`, `GET /forum/search`
**Napomene:** Pretraga igara UNKNOWN (vjerovatno kroz `GET /games?q=`). Nema unified search.

---

## SEO

**Status:** COMPLETE (osnova), PARTIAL (game pages, structured data)

**Opis:** Meta tagovi, OG, Twitter cards, sitemap, structured data, IndexNow.

**Frontend:** `components/seo/`, `lib/seo.ts`
**Backend:** `SchemaService`, `SeoAnalyzerService`, `IndexNowService`, `HreflangService`
**Admin:** `SeoManagerResource`, `PageSeoResource`
**Database:** `seo_metas`, `page_seos`
**API:** `GET /page-seo`, `GET /page-seo/{path}`, `POST /seo/suggest-links`
**Napomene:** IndexNow integrisano (Bing/Yandex instant indexing). AI-powered SEO analiza i link prijedlozi.

---

## Auth

**Status:** COMPLETE

**Opis:** Register, login, logout, Discord OAuth, Battle.net OAuth, email verify.

**Frontend:** `app/(auth)/`, `context/AuthContext.tsx`
**Backend:** `AuthController`, `SocialAuthController`, `BattleNetAuthController`, `VerificationController`
**Database:** `users`, `personal_access_tokens`
**API:** `/auth/*`
**Napomene:** Sve auth client-side na frontendu osim email verifikacije.

---

## Admin Panel

**Status:** COMPLETE (osnova), PARTIAL (napredne funkcije)

**Opis:** Filament v5 admin za sav sadržaj.

**Frontend:** `/admin` (Filament renders own UI)
**Backend:** `app/Filament/`
**Napomene:** NeoBrutalism tema. 38+ resursa.

---

## Discord Bot (Professor Buffy)

**Status:** COMPLETE (osnova), PARTIAL (dublja integracija)

**Opis:** Discord bot koji polira sadržaj, dodjeljuje XP, vodi trivia, šalje recapove.

**Lokacija:** `discord/src/`
**Integracija s backendom:** HTTP API pozivi na `/api/v1/discord/*`
**Napomene:** Detalji u `18-discord-bot-map.md`.

---

## Giveaways

**Status:** COMPLETE

**Opis:** TechPlay native giveaways + Privée giveaway platforma integracija.

**Frontend:** `app/giveaways/`, `app/giveaway/`, `components/giveaway/`
**Backend:** `GiveawayController`, `PriveeGiveawayController`
**Database:** `giveaways`, `giveaway_entries`, `giveaway_tasks`, `privee_giveaway_entries`
**Napomene:** Dvije zasebne logike (TechPlay i Privée). Discord bot šalje giveaway notifikacije.

---

## Presence (što korisnik igra)

**Status:** COMPLETE

**Opis:** Real-time tracking što korisnik igra. Vidljivo na profilu.

**Frontend:** Prikaz na profilu
**Backend:** `PresenceController`, `PresenceService`
**Database:** `presences`
**API:** `GET /presence/{username}`, `POST /presence`, `POST /discord/presence`
**Discord bot:** setupPresenceTracking u event handleru. Bot šalje Discord Rich Presence na backend.

---

## Clans

**Status:** COMPLETE (osnova)

**Opis:** Gaming klanovi — kreiranje, pridruživanje, pregled.

**Frontend:** `app/clans/`
**Backend:** `ClanController`, `Clan`, `ClanMember`, `ClanInvite` modeli
**Database:** `clans`, `clan_members`, `clan_invites`
**API:** `GET /clans`, `GET /clans/{slug}`, `POST /clans`

---

## Shop

**Status:** COMPLETE (osnova)

**Opis:** Digitalni shop s PayPal integracijom.

**Frontend:** `app/shop/`, `app/cart/`, `app/checkout/`
**Backend:** `ShopController`, `PayPalController`, `PayPalWebhookController`
**Database:** `products`, `orders`, `order_items`
**API:** Shop, PayPal endpointi

---

## WoW Analyzer

**Status:** COMPLETE

**Opis:** AI-powered World of Warcraft character analiza (Blizzard API + Gemini/OpenAI).

**Frontend:** `app/wow-analyzer/`, `components/wow/`
**Backend:** `WowAnalyzerController`, `BlizzardService`, `GeminiService`, `OpenAIService`
**Database:** `wow_analyses`, `user_wow_characters`
**API:** `/wow/*`

---

## Notifications

**Status:** PARTIAL

**Opis:** Laravel notifikacije (in-app).

**Frontend:** Notifikacije bell, real-time hook `useRealTimeNotifications`
**Backend:** `NotificationController`, `NotificationReceived` event
**Database:** `notifications`
**API:** `/notifications`, `/user/notifications/counts`
**Napomene:** Backend implementiran. Frontend — UNKNOWN koliko je kompletno.

---

## Steam Integration

**Status:** PARTIAL

**Opis:** Steam library import, presence, achievements.

**Backend:** `SteamService`, `SyncSteamLibrary` job, `PollSteamPresence` job, `SteamAchievementController`
**Database:** `connected_accounts`, `steam_achievements`, `user_games`
**API:** `GET /users/{username}/steam-achievements`
**Napomene:** Import job postoji. Frontend prikaz steam achievementa na profilu. Detalji integracije UNKNOWN.

---

## Backlog Advisor

**Status:** COMPLETE

**Opis:** AI preporuka igara iz user biblioteke.

**Frontend:** `app/backlog-advisor/`
**Backend:** `BacklogAdvisorController`
**API:** `POST /backlog/suggest`
**Napomene:** Koristi AI servis (Gemini ili OpenAI) i korisnikovu kolekciju igara.

---

## Profile Wrapped

**Status:** COMPLETE

**Opis:** Godišnji rezime gaming aktivnosti (à la Spotify Wrapped).

**Frontend:** `app/wrapped/`
**Backend:** `WrappedController`
**API:** `GET /users/{username}/wrapped/{year}`

---

## Media/Uploads

**Status:** COMPLETE

**Opis:** Slike za članke, profile covers, avatare.

**Backend:** `ImageService`, `ImageOptimizationService`, `MediaObserver`
**Admin:** `MediaResource`
**Database:** `media`
**Napomene:** Upload → validacija → storage → opcijski resize/optimize.
