# 10 — Features Map

## News

**Status:** COMPLETE

**Opis:** Gaming news članci s kategorijama, tagovima, hero flagom, view counters, SEO.

**Frontend:** `app/news/`, `components/news/`
**Backend:** `NewsController`, `Article` model, `ArticleObserver`
**Admin:** `NewsResource` (Filament)
**Database:** `articles`, `categories`, `seo_metas`
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

## Videos — UKLONJENO 08/2026

**Status:** REMOVED

Sekcija je stajala u navigaciji s nula redova u tabeli. Uklonjeni su stranica,
API rute, `VideoController`, `Video` model, `VideoObserver`, `VideoPublished`,
`VideoResource` u adminu i `sitemap-videos.xml`. Tabela `videos` je ostavljena
netaknuta — brisanje je nepovratno, a prazna tabela ne smeta.

Ovdje je živio i jedini preostali Privée blok (logo, App Store linkovi); otišao
je s njom.

---

## Game Database

**Status:** COMPLETE — kanonska TechPlay baza od 08/2026 (RAWG, Moby i IGDB penzionisani)

**Opis:** Vlastita baza od ~187.7k igara. Kanonska schema (cover_url, description,
genres/platforms/tags/developers/publishers TEXT[], videos/alt_titles/age_ratings json,
series_key/series_name, website). Adult sadržaj očišćen komandom `games:purge-adult`
(Adult tag + sigurne riječi; ručni whitelist čuva mainstream naslove poput Witcher/GoW;
sivi skup ide u `storage/app/adult-review.json` na pregled, ništa se ne briše slijepo).
Obrisani slugovi ostaju u `game_tombstones` i API im vraća **410**. Nove igre ulaze
isključivo kroz store agregator; traileri se pune u `videos` kolonu (agregator ih već
piše, admin ih može ručno dodati).

**Frontend:** `app/games/`, `components/games/`
**Backend:** `GameController`, `Game` model, `games:purge-adult` komanda
**Admin:** `GameResource` (opis, cover, screenshoti, traileri, kompanije, taksonomija)
**Database:** `games`, `game_tombstones`, `game_companies`, `game_external_ids`
**API:** `GET /games`, `GET /games/{slug}` (410 za tombstone), `/screenshots`, `/videos`, `/series`, `/suggested`, `GET /games/calendar` (lokalno, `match_key` + `hype_score`)
**Discord bot:** Bot može pretražiti igre (`/search` komanda)
**Napomene:** TEXT[] arrays idu kroz `PostgresArray` cast; kod raw upita `pgArray()`. API NIKAD ne zove vanjske servise — sve je lokalno. `import_payload` je arhiva sirovog Moby payloada i ne izlaže se u API.

---

## Release Calendar

**Status:** COMPLETE — prepisan 08/2026, vlastiti agregator umjesto RAWG-a

**Opis:** Mjesečni kalendar izlazaka. Podaci se povlače sa **četiri storea** (Steam,
Nintendo eShop, Xbox, PlayStation) po rasporedu u našu bazu, duplikati se spajaju u
jedan unos, a stranica čita **isključivo iz naše baze** — nijedan zahtjev prema
vanjskim servisima.

**Frontend:** `app/calendar/`
**Backend:** `CalendarController` (čita `games` gdje `match_key` nije null)
**Admin:** Editorial Tools → Release Calendar (urednički red za sporne parove)
**Database:** `games` + `game_store_links` + `game_match_decisions`
**API:** `GET /calendar`, `POST /calendar/{slug}/reminder`
**Komande:** `releases:sync`, `releases:merge`
**Discord bot:** CheckWishlistReleases provjerava nove release datume
**Detaljno:** vidi `docs/34-release-calendar-aggregator.md`

**Zašto je prepisan:** RAWG je pao 04.08.2026. i povukao kalendar sa sobom. Sada
tuđi ispad nije naš ispad — test to i tvrdi (`Http::preventStrayRequests`).

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

**Opis:** Polymorphic komentari na news, reviews i guides. Voting, nesting.

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

---

## Ispravke statusa iz sigurnosnog pregleda 08–10.08.2026

Tri stvari za koje je mapa govorila jedno, a stvarnost drugo.

### Discord bot — **NE RADI U PRODUKCIJI**

Prethodni status je opisivao servise kao da rade. Provjereno 09.08.2026 na
serveru: bota **nema** ni u pm2, ni u supervisoru, ni u systemd, ni u dockeru,
ni kao goli node proces. Kod postoji i gradi se (`tsc` prolazi), `.env` je
kompletan i tajna se poklapa s backendom — jednostavno ga ništa ne pokreće.

Sve što ova mapa piše pod "**Discord bot:**" treba čitati kao *napisano i
spremno*, ne *aktivno*. Bot je i dalje jedina komponenta bez deploy putanje —
nije ni u jednoj skripti u `deployment/`.

Posljedica koju vrijedi znati: `API_URL` u botu pokazuje na `techplay.gg`, i to
je **ispravno** — nginx tamo proxy-ra `/api`, dok `api-beta.techplay.gg` vraća
403 na serverske pozive (Cloudflare). Ne "popravljati" to na api-beta.

### Podrška / pledge — bio slomljen, sada radi

`POST /support/pledge` je vraćao 500 na **svaki** poziv jer je kontroler čitao i
pisao kolone `payment_id` i `is_recurring` kojih u tabeli nije bilo. Status je
bio naveden kao gotov; funkcija nikad nije primila uplatu. Migracija
`2026_08_09_000200` to popravlja i uz to sprječava da se jedna uplata iskoristi
više puta.

Uz to: `activeSupport()` nije gledao `expires_at`, pa je jedan mjesec podrške
trajno otključavao tier kozmetiku.

### Klanovi — nedostaju osnovne radnje

Ne postoje kao rute, kontroleri, ni bilo šta drugo: **prijenos vlasništva,
raspuštanje klana, izbacivanje člana, promocija u oficira.**

Posljedice koje API stvarno provodi:

- Vlasnik ne može napustiti klan — `leave` mu kaže "prenesi vlasništvo", a ta
  ruta ne postoji. Jedini izlaz mu je brisanje naloga, što kaskadno ruši klan.
- **Oficirski nivo je nedostižan** — `admit()` uvijek upisuje `member`, i nigdje
  u kodu se ne piše `role => 'officer'`. Sve rute označene kao "officer+" su
  time de facto samo vlasnikove.
- Toksičan član se ne može ukloniti.

Ovo je nedostajuća funkcionalnost, ne rupa — ali izgleda kao da postoji, pa je
bolje da piše.
