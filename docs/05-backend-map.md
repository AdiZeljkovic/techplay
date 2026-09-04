# 05 — Backend Map

## Framework i osnove

- **Laravel 12** (PHP 8.2+)
- **Laravel Octane** (production server)
- **PostgreSQL** (produkcija) / SQLite in-memory (testovi)
- **Redis** (cache + queue)
- **Laravel Reverb** (WebSocket, Pusher protokol)
- **Filament v5** (admin panel, integrisan unutar iste aplikacije)

### Octane obara zahtjev na 30 sekundi

Nema `config/octane.php`, pa vrijedi Octaneov vlastiti default:
`config('octane.max_execution_time', 30)`. Radnik se **ubija**, ne vraća grešku —
veza pukne, nginx upiše 502 **bez tijela**, a naša poruka nikad ne bude
napisana. U logu to izgleda kao pad servera, a zapravo je prekoračen budžet.

Svaki zahtjev koji zove tuđi API mora stati ispod toga sa **zbrojem** svih
poziva, ne pojedinačno — i `retry(2, …)` su **tri** pokušaja, ne dva. Povezivanje
PlayStationa je 2. 9. 2026. imalo 15 + 15 + 20 = 50 s i sedam praznih 502 za
redom; kad su ostale tri platforme pregledane istim okom, sve su bile gore.

| | Prije | Sada | Budžet |
|---|---|---|---|
| PlayStation | 50 s | 22 s | `PlayStationService::CONNECT_TIMEOUT`, `CONNECT_PROFILE_TIMEOUT` |
| Epic | 63 s | 8 s | `EpicService::CONNECT_TIMEOUT`, jedan pokušaj |
| GOG | 78 s | 14 s | `GogService::CONNECT_TIMEOUT`, `CONNECT_NAME_TIMEOUT`, jedan pokušaj |
| Xbox | 94 s | 10 s | `OpenXblService::CONNECT_TIMEOUT`, jedan pokušaj |

Ponavljanje jednokratnog koda koji je trgovina već odbila ne može uspjeti, pa
connect putanje traže jedan pokušaj. **Sinkronizacije zadržavaju duge budžete** —
one su u queueu gdje strop ne postoji, i tamo je strpljenje ispravno.
`ConnectingFitsInsideTheRequestTest` čuva sve četiri.

---

## API rute (`routes/api.php`)

Sve rute su pod prefiksom `/api/v1/`. Organizovane su u grupe:

### Javne rute (bez auth)
| Endpoint | Metoda | Controller |
|----------|--------|-----------|
| `/system/status` | GET | SystemController |
| `/home` | GET | HomeController |
| `/news` | GET | NewsController |
| `/news/trending` | GET | NewsController |
| `/news/{slug}` | GET | NewsController |
| `/reviews` | GET | ReviewController |
| `/reviews/{slug}` | GET | ReviewController |
| `/guides` | GET | GuideController |
| `/guides/{slug}` | GET | GuideController |
| `/tech` | GET | TechController |
| `/tech/{slug}` | GET | TechController |
| `/videos` | GET | VideoController |
| `/videos/{slug}` | GET | VideoController |
| `/forum/categories` | GET | ForumController |
| `/forum/threads/{slug}` | GET | ForumController |
| `/forum/active` | GET | ForumController |
| `/forum/stats` | GET | ForumController |
| `/games` | GET | GameController |
| `/games/{slug}` | GET | GameController |
| `/games/calendar` | GET | GameController |
| `/games/{slug}/ratings` | GET | GameRatingController |
| `/users/{username}` | GET | AuthController::show |
| `/users/{username}/collection` | GET | GameCollectionController |
| `/users/{username}/activity` | GET | ActivityController |
| `/leaderboard` | GET | LeaderboardController |
| `/settings` | GET | SettingsController |
| `/giveaways` | GET | GiveawayController |
| `/giveaways/{slug}` | GET | GiveawayController |
| `/compare/{username}/{other}` | GET | ProfileCompareController |
| `/seasons/active` | GET | SeasonController |
| `/search/articles` | GET | SearchController |
| `/ads/{position}` | GET | AdController |
| `/comments/{type}/{id}` | GET | CommentController |
| `/staff` | GET | AboutController |
| `/navigation/tree` | GET | NavigationController |

### Auth rute (Sanctum zaštićene)
| Endpoint | Metoda | Controller |
|----------|--------|-----------|
| `/auth/login` | POST | AuthController |
| `/auth/register` | POST | AuthController |
| `/auth/logout` | POST | AuthController |
| `/auth/me` | GET | AuthController |
| `/auth/refresh` | POST | AuthController |
| `/user/profile` | PUT | AuthController |
| `/user/preferences` | PUT | AuthController |
| `/user/password` | PUT | AuthController |
| `/user/streak` | GET | StreakController |
| `/user/streak/claim` | POST | StreakController |
| `/friends` | GET/POST/DELETE | FriendController |
| `/messages` | GET/POST/DELETE | MessageController |
| `/notifications` | GET/PATCH/POST | NotificationController |
| `/comments` | POST | CommentController |
| `/comments/{id}/vote` | POST | CommentController |
| `/collection/games/{slug}` | GET/PUT/DELETE | GameCollectionController |
| `/forum/threads` | POST | ForumController |
| `/forum/threads/{slug}/posts` | POST | ForumController |
| `/shop/orders` | POST | PayPalController |
| `/shop/orders/capture` | POST | PayPalController |
| `/quests` | GET | QuestController |
| `/quests/{id}/claim` | POST | QuestController |
| `/backlog/suggest` | POST | BacklogAdvisorController |
| `/presence` | POST/DELETE | PresenceController |
| `/feed/personalized` | GET | FeedController |

### Discord bot rute (throttle:300,1)
| Endpoint | Metoda | Controller |
|----------|--------|-----------|
| `/discord/user/{discordId}` | GET | DiscordIntegrationController |
| `/discord/xp` | POST | DiscordXpController |
| `/discord/presence` | POST | PresenceController |
| `/discord/leaderboard` | GET | DiscordLeaderboardController |
| `/discord/daily` | POST | DiscordDailyController |
| `/discord/subscriptions` | GET/POST/DELETE | DiscordSubscriptionController |
| `/discord/gift` | POST | DiscordGiftController |
| `/discord/admin/xp/give` | POST | DiscordAdminController |

---

## Modeli (Eloquent)

### Content modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `Article` | `articles` | News, reviews (tech, hardware su zasebni ili subtyp) |
| `Review` | `reviews` | Game reviews (poseban model) |
| `Guide` | `guides` | Gaming guides + voting |
| `Video` | `videos` | Video sadržaj |
| `Category` | `categories` | Kategorije za sve content tipove |

### Game modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `Game` | `games` | Igra (MobyGames data, TEXT[] za genre/platform/tags) |
| `GameCompany` | `game_companies` | Izdavači/developeri |
| `GameExternalId` | `game_external_ids` | RAWG ID, IGDB ID, Steam ID |
| `GameRating` | `game_ratings` | User ocjene igara |
| `UserGame` | `user_games` | User biblioteka igara (status: playing/finished/itd.) |
| `GameList` | `game_lists` | Custom liste igara |
| `GameListItem` | `game_list_items` | Stavke u listama |

### User modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `User` | `users` | Korisnik (XP, rank, streak, discord fields, itd.) |
| `Rank` | `ranks` | XP rankovi |
| `Achievement` | `achievements` | Definisani achievementi |
| `Friendship` | `friendships` | Prijatelji (pending/accepted/blocked) |
| `Presence` | `presences` | Šta korisnik trenutno igra |
| `UserRecognition` | `user_recognitions` | Recognition (od korisnika korisniku) |
| `ConnectedAccount` | `connected_accounts` | Steam, Discord, Battle.net linkovi |
| `UserCustomization` | `user_customizations` | Profile customization |
| `ReputationSnapshot` | `reputation_snapshots` | Periodični snapshot reputacije |
| `SteamAchievement` | `steam_achievements` | Steam achievement import |
| `WowCharacter` | `user_wow_characters` | Saved WoW likovi |
| `WowAnalysis` | `wow_analyses` | AI WoW analize |

### Community modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `Thread` | `threads` | Forum threadovi |
| `Post` | `posts` | Forum postovi/replies |
| `Comment` | `comments` | Komentari (polymorphic — articles, reviews, games) |
| `Message` | `messages` | Direct messages između korisnika |

### Gamification modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `Quest` | `quests` | Dnevni/tjedni/sezonski zadaci |
| `QuestProgress` | `quest_progress` | Napredak korisnika na questu |
| `Season` | `seasons` | Sezone (Seasonal XP reset/bonus) |
| `BountyTransaction` | `bounty_transactions` | Bounty sistema |
| `RewardItem` | `reward_items` | Nagrade u reward storeu |
| `RewardRedemption` | `reward_redemptions` | Redemption istorija |

### Sistem modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `SiteSetting` | `site_settings` | Globalne postavke + maintenance mode |
| `SeoMeta` | `seo_metas` | Per-page SEO override |
| `PageSeo` | `page_seos` | Admin-definisan SEO po path |
| `Redirect` | `redirects` | URL redirecti |
| `Media` | `media` | Upload management |
| `AdCampaign` | `ad_campaigns` | Reklamne kampanje |
| `Notification` | `notifications` | Laravel notifikacije |
| `Report` | `reports` | User report (abuse) |
| `BrokenLink` | `broken_links` | Skenirani broken linkovi |

### Commerce modeli
| Model | Tabela | Opis |
|-------|--------|------|
| `Product` | `products` | Shop proizvodi |
| `Order` | `orders` | Narudžbe (PayPal) |
| `OrderItem` | `order_items` | Stavke narudžbe |
| `SupportTier` | `support_tiers` | Podrška/pretplatni nivoi |
| `UserSupport` | `user_supports` | Korisnikova aktivna podrška |
| `Giveaway` | `giveaways` | Giveaway events |
| `GiveawayEntry` | `giveaway_entries` | Prijave na giveaway |
| `GiveawayPrizeTier` | `giveaway_prize_tiers` | Nagrade u giveaway |
| `GiveawayTask` | `giveaway_tasks` | Zadaci za bonus bodove |
| `GiveawayTaskCompletion` | `giveaway_task_completions` | Kompletizacija taskova |

---

## Servisi (`app/Services/`)

| Servis | Svrha |
|--------|-------|
| `AchievementService` | Provjera i dodjela achievementa |
| `ActivityService` | User activity feed |
| `AltTextService` | AI-generated alt text za slike |
| `BlizzardService` | WoW character data fetch |
| `BlizzardDataTransformer/V2` | Minifikacija Blizzard podataka za AI |
| `BountyService` | Bounty logika |
| `CacheRevalidationService` | POST na Next.js /api/revalidate |
| `CacheService` | Redis cache wrappers |
| `GameMatchingService` | Matching igara između izvora |
| `GeminiService` | Gemini 2.5 Flash AI pozivi |
| `GroqService` | Groq AI pozivi |
| `HreflangService` | SEO hreflang generisanje |
| `ImageService` | Upload validacija i storage |
| ~~`ImageOptimizationService`~~ | **Obrisan 29.08.2026.** Zavisio je od `intervention/image`, koji nikad nije instaliran, pa sedam mjeseci nije radio ništa — 18 od 1.176 slika ima WebP, zadnja od 17. januara. Next ionako konvertuje naše uploade (`formats: ['image/webp']`), a `webp_url` nije čitao niko. `ImageOptimizer` (GD) radi i ostaje. |
| `IndexNowService` | IndexNow ping za Bing/Yandex |
| `InternalLinkService` | AI preporuka internih linkova |
| `KeywordDensityService` | SEO keyword analiza |
| `LoggingService` | Centralizovani logging |
| `MediaKitService` | Media kit generisanje |
| `MobyGamesService` | MobyGames API import |
| `OpenAIService` | GPT-4 Turbo AI pozivi |
| `PayPalService` | PayPal API pozivi |
| `PremiumService` | Premium/subscription logika |
| `PresenceService` | Game presence tracking + banking odigranog vremena (`bankSession`: 2min–12h, samo igre već u kolekciji, nikad ne dira Steam-owned unose) |
| `ProfileService` | Profilni podaci agregacija + `canViewProfile()` / `friendStatus()` / `friendIds()` / `hoursPlayed()` |
| `QuestService` | Quest dodjela i praćenje |
| `RaiderIOService` | RaiderIO Mythic+ data |
| `RawgService` | RAWG game screenshots/movies — **kalendar ga više ne koristi** |
| `Releases\SteamCatalog` / `SteamSync` | Steam coming-soon: lista nosi datum, detalji se plaćaju jednom po igri |
| `Releases\NintendoCatalog` / `NintendoSync` | eShop: jedan zahtjev vraća cijeli prozor |
| `Releases\XboxCatalog` / `XboxSync` | Xbox: sitemap (42k id-jeva) + display catalogue u serijama po 200 |
| `Releases\PlaystationCatalog` / `PlaystationSync` | PlayStation: coming-soon kategorija + `__NEXT_DATA__` po proizvodu |
| `Releases\BlindCatalogueSync` | Zajedničko za storeove bez datuma u listi (Xbox, PS): pitaj jednom, pamti odgovor |
| `Releases\QualityFilter` | Kapija — pragovi po storeu, adult filter |
| `Releases\TitleNormalizer` | Ime igre → uporediv ključ (reže samo s kraja) |
| `Releases\GameMatcher` / `GameMerger` | Spajanje iste igre s više storeova; `platform_names` postaje unija |
| `Releases\Notability` | Rangiranje mjeseca iz onoga što stvarno možemo mjeriti |
| `ReCaptchaService` | Google reCAPTCHA validacija |
| `RevalidationService` | Next.js ISR revalidacija |
| `SanitizationService` | XSS zaštita za user content |
| `SchemaService` | JSON-LD structured data |
| `SeoAnalyzerService` | SEO analiza sadržaja |
| `SteamService` | Steam Web API |
| `StreakService` | Daily streak logika |
| `LevelService` | XP → level kriva (piecewise, sidrena na 20 rangova). **Mora ostati identična `frontend/lib/level.ts`** |
| `XpService` | XP dodjela (100 XP/day cap, 60s cooldown) |

---

## Jobs (`app/Jobs/`)

| Job | Svrha |
|-----|-------|
| `FetchOgData` | Fetchuje OG metadata za URL-ove |
| `FlushViewCounters` | Flush Redis view counters u DB |
| `MobyEnrichmentJob` | Enrich game iz MobyGames API |
| `PingIndexNow` | Ping Bing/Yandex za instant index |
| `PollSteamPresence` | Polling Steam za presence data |
| `SendChatReminder` | Reminder notifikacija za chat |
| `SendGiveawayReminders` | Giveaway reminder emaili |
| `SubmitIndexNow` | Submit URLs IndexNow protokolom |
| `SyncSteamLibrary` | Sinkronizacija Steam biblioteke |

---

## Artisan komande (`app/Console/Commands/`)

| Komanda | Svrha |
|---------|-------|
| `CheckWishlistReleases` | Provjera novih release datuma za wishlist igre |
| `CleanOldViewTracking` | Brisanje starih view tracking zapisa |
| `CrawlIgdbGames` | IGDB game crawler (legacy?) |
| `CrawlIgdbStatus` | Status crawlanja |
| `FixImagePaths` | Popravka image pathova |
| `GenerateImageVariants` | Generisanje image varijanti |
| `GenerateSitemap` | XML sitemap generisanje |
| `ImportMobyCsv` | Import igara iz MobyGames CSV |
| `IndexGameTags` | Indeksiranje game tagova |
| `MobyEnrich` | Ručni enrich igre iz MobyGames |
| `MobyFetch` | Fetch igara iz MobyGames |
| `OptimizeExistingImages` | Optimizacija postojećih slika |
| `PublishScheduledArticles` | Publishovanje scheduled članaka |
| `ScanBrokenLinks` | Sken broken linkova |
| `SnapshotReputation` | Reputation snapshot |
| `SyncAchievements` | Sinkronizacija achievementa |
| `SyncAdMetrics` | Sinkronizacija ad metrika |
| `SyncMediaLibrary` | Media library sync |
| `SyncUserXP` | Sinkronizacija XP |
| `ValidateEnv` | Provjera .env varijabli |

---

## Observeri (`app/Observers/`)

Svaki observer na publish/update poziva `CacheRevalidationService`:

| Observer | Model | Akcija |
|----------|-------|--------|
| `ArticleObserver` | Article | Revalidira news/article cache |
| `ArticleVersionObserver` | ContentVersion | UNKNOWN |
| `CategoryObserver` | Category | Revalidira category cache |
| `CommentObserver` | Comment | Broadcast CommentPosted event |
| `ContentObserver` | UNKNOWN | Generički content observer |
| `ForumPostObserver` | Post | Broadcast ForumReplyPosted |
| `GuideObserver` | Guide | Revalidira guides cache |
| `MediaKitSettingObserver` | MediaKitSetting | UNKNOWN |
| ~~`MediaObserver`~~ | Media | **Obrisan 29.08.2026** s `ImageOptimizationService` — izlazio je na prvoj liniji jer servis nije bio dostupan. |
| `PageSeoObserver` | PageSeo | Revalidira SEO cache |
| `PostObserver` | Post | Duplicate? ili zasebno |
| `ProductObserver` | Product | Broadcast ProductStockUpdated |
| `ReviewObserver` | Review | Revalidira review cache |
| `SiteSettingObserver` | SiteSetting | Revalidira settings cache |
| `ThreadObserver` | Thread | Broadcast ThreadCreated |
| `VideoObserver` | Video | Revalidira video cache |

---

## Broadcast eventi (`app/Events/`)

| Event | Trigger | Channel |
|-------|---------|---------|
| `ArticlePublished` | ArticleObserver | public/broadcast |
| `CommentPosted` | CommentObserver | public/broadcast |
| `ForumReplyPosted` | ForumPostObserver | public/broadcast |
| `GuidePublished` | GuideObserver | public/broadcast |
| `NotificationReceived` | UNKNOWN | private user channel |
| ~~`PresenceUpdated`~~ | — | **Obrisan 29.08.2026.** Išao je na **javni** kanal `presence.{id}` s tim šta neko igra, ignorisao `profile_visibility`, palio se svake 2 min po igraču bez obzira je li se išta promijenilo — i **nijedan klijent se nije pretplaćivao**. |
| `ProductStockUpdated` | ProductObserver | public/broadcast |
| `ReviewPublished` | ReviewObserver | public/broadcast |
| `ThreadCreated` | ThreadObserver | public/broadcast |
| `VideoPublished` | VideoObserver | public/broadcast |
| `EditorialMessageSent` | EditorialChat | private editorial channel |
| `EditorialMessageRead` | EditorialChat | private editorial channel |

---

## XP logika

- **XpService** dodjeljuje XP za:
  - Komentare na člancima
  - Čitanje članaka (article view)
  - Discord poruke (15 XP/msg, 60s cooldown)
  - Dnevni streak claim
  - Quest kompletizacija
  - Giveaway zadaci
- **Cap:** 100 XP/dan iz web interakcija
- **Cooldown:** 60 sekundi između XP dodjela
- **Rank sistem:** `Rank` model definira XP thresholds za svaki rang

---

## Middleware

| Middleware | Svrha |
|-----------|-------|
| `SecurityHeaders` | HTTP security headers (CSP, HSTS, itd.) |
| `throttle:60,1` | 60 req/min za public rute |
| `throttle:300,1` | 300 req/min za Discord bot rute |
| `throttle:5,60` | 5 req/60min (newsletter verify) |
| `throttle:3,10` | 3 req/10min (contact form) |
| `auth:sanctum` | Bearer token auth provjera |

---

## Traits (`app/Traits/`)

| Trait | Svrha |
|-------|-------|
| `ApiResponse` | Standardizovan `{ success, data, message }` odgovor — koristiti u svim kontrolerima |
| `ProfilePrivacy` | `profileHidden(User)` — gate za svaki `/users/{username}/*` endpoint. Bez njega bi privatni podaci bili jedan `curl` daleko |
