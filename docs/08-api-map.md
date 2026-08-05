# 08 — API Map

**Base URL:** `https://api.techplay.gg/api/v1`
**Auth:** Bearer token (`Authorization: Bearer <token>`)
**Format odgovora:** `{ success: bool, data: any, message: string }` (ApiResponse trait)

---

## System

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/system/status` | SystemController::status | - | Health check. Vraća i `maintenance_mode`, ali ga od 08/2026 niko ne čita — frontend middleware je uklonjen |

---

## Auth

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| POST | `/auth/register` | AuthController::register | - | Registracija (throttle:60) |
| POST | `/auth/login` | AuthController::login | - | Login → token (throttle:60) |
| POST | `/auth/logout` | AuthController::logout | ✓ | Logout, revoke token |
| POST | `/auth/refresh` | AuthController::refresh | ✓ | Refresh Sanctum token |
| GET | `/auth/me` | AuthController::user | ✓ | Trenutni korisnik |
| PUT | `/user/profile` | AuthController::updateProfile | ✓ | Ažuriranje profila |
| PUT | `/user/preferences` | AuthController::updatePreferences | ✓ | Ažuriranje preferenci |
| PUT | `/user/password` | AuthController::changePassword | ✓ | Promjena lozinke |
| GET | `/user/export-data` | AuthController::exportData | ✓ | GDPR data export |
| DELETE | `/user/account` | AuthController::deleteAccount | ✓ | Brisanje računa |
| GET | `/users/{username}` | AuthController::show | - | Javni profil korisnika |

### Social Auth

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/auth/discord/redirect` | SocialAuthController::redirect | - | Discord OAuth redirect |
| GET | `/auth/discord/callback` | SocialAuthController::callback | - | Discord OAuth callback |
| GET | `/auth/battlenet/redirect` | BattleNetAuthController::redirect | - | Battle.net OAuth redirect |
| GET | `/auth/battlenet/callback` | BattleNetAuthController::callback | - | Battle.net OAuth callback |

---

## Content — News

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/feed/latest` | FeedController::latest | - | Jedan tok preko svega objavljenog (članci + vodiči), `?type=all\|news\|reviews\|tech\|guides&page&limit`. Nepoznat tip → 422. Stari `review`/`guide` se i dalje primaju kao aliasi |
| GET | `/feed/personalized` | FeedController::personalized | ✓ | Isti tok, poredan po interesima korisnika. Vraća `personalised:false` kad nema signala i tada je to prosto najnovije |
| GET | `/newsroom/{section}` | NewsroomController::index | - | Okvir sekcijske stranice: tabovi s brojevima, spotlight, ticker, most read, upcoming releases, stats. `section` = news\|reviews\|tech\|guides; nepoznata sekcija → 404 |
| GET | `/news` | NewsController::index | - | Lista news članaka |
| GET | `/news/trending` | NewsController::trending | - | Trending news |
| GET | `/news/{slug}` | NewsController::show | - | Detalj news članka |

## Content — Reviews

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/reviews` | ReviewController::index | - | Lista reviewova |
| GET | `/reviews/{slug}` | ReviewController::show | - | Detalj reviewa |

## Content — Guides

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/guides` | GuideController::index | - | Lista guideova |
| GET | `/guides/{slug}` | GuideController::show | - | Detalj guidea |

## Content — Tech/Hardware

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/tech` | TechController::index | - | Lista tech članaka |
| GET | `/tech/{slug}` | TechController::show | - | Detalj tech članka |

## Content — Videos

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|

---

## Game Database

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/games` | GameController::index | - | Lista igara (filter, paginate) |
| GET | `/games/{slug}` | GameController::show | - | Detalj igre |
| GET | `/games/calendar` | GameController::calendar | - | Release calendar |
| GET | `/games/{slug}/screenshots` | GameController::screenshots | - | Screenshoti (lokalni) |
| GET | `/games/{slug}/movies` | GameController::movies | - | Filmovi/traileri |
| GET | `/games/{slug}/series` | GameController::series | - | Igre iz iste serije |
| GET | `/games/{slug}/suggested` | GameController::suggested | - | Slične igre |
| GET | `/games/{slug}/additions` | GameController::additions | - | DLC/dodaci |
| GET | `/games/rawg/{slug}` | GameController::rawgDetail | - | RAWG fallback detalj |
| GET | `/games/rawg/{slug}/screenshots` | GameController::rawgScreenshots | - | RAWG screenshoti |
| GET | `/games/rawg/{slug}/movies` | GameController::rawgMovies | - | RAWG filmovi |
| GET | `/games/rawg/{slug}/suggested` | GameController::rawgSuggested | - | RAWG prijedlozi |
| GET | `/games/{slug}/ratings` | GameRatingController::index | - | User ocjene igre |
| GET | `/games/{slug}/ratings/my` | GameRatingController::my | ✓ | Moja ocjena |
| POST | `/games/{slug}/ratings` | GameRatingController::upsert | ✓ | Dodaj/ažuriraj ocjenu |
| DELETE | `/games/{slug}/ratings` | GameRatingController::destroy | ✓ | Obriši ocjenu |
| GET | `/games/hub/{type}/{value}` | GameRatingController::hub | - | Hub po žanru/platformi |

---

## Game Collection (korisnička biblioteka)

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/users/{username}/collection` | GameCollectionController::index | - | Javna kolekcija |
| GET | `/collection/games/{slug}` | GameCollectionController::show | ✓ | Status igre u kolekciji |
| PUT | `/collection/games/{slug}` | GameCollectionController::upsert | ✓ | Dodaj/ažuriraj igru |
| DELETE | `/collection/games/{slug}` | GameCollectionController::destroy | ✓ | Ukloni iz kolekcije |
| GET | `/collection/index` | GameCollectionController::libraryIndex | ✓ | slug→status mapa |

---

## Forum

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/forum/categories` | ForumController::categories | - | Kategorije |
| GET | `/forum/categories/{slug}` | ForumController::showCategory | - | Kategorija sa threadovima |
| GET | `/forum/threads/{slug}` | ForumController::showThread | - | Thread sa postovima |
| GET | `/forum/active` | ForumController::activeThreads | - | Aktivni threadovi |
| GET | `/forum/stats` | ForumController::stats | - | Forum statistike |
| GET | `/forum/search` | ForumController::search | - | Pretraga (throttle:30) |
| POST | `/forum/threads` | ForumController::createThread | ✓ | Kreiraj thread |
| POST | `/forum/threads/{slug}/posts` | ForumController::createPost | ✓ | Kreiraj post/reply |
| PUT | `/forum/threads/{slug}/posts/{postId}` | ForumController::updatePost | ✓ | Ažuriraj post |
| DELETE | `/forum/threads/{slug}/posts/{postId}` | ForumController::deletePost | ✓ | Obriši post |
| POST | `/forum/threads/{slug}/upvote` | ForumController::upvote | ✓ | Upvote threada |
| POST | `/forum/threads/{slug}/pin` | ForumController::pinThread | ✓ | Pin thread (admin) |

---

## Komentari

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/comments/{type}/{id}` | CommentController::index | - | Lista komentara |
| POST | `/comments` | CommentController::store | ✓ | Kreiraj komentar (throttle:30) |
| POST | `/comments/{id}/vote` | CommentController::vote | ✓ | Vote na komentar (throttle:30) |

---

## User profil & aktivnost

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/users/{username}` | AuthController::show | - | Javni profil |
| GET | `/users/{username}/activity` | ActivityController::index | - | Aktivnost korisnika |
| GET | `/users/{username}/recognitions` | RecognitionController::index | - | Recognitions |
| GET | `/users/{username}/steam-achievements` | SteamAchievementController::index | - | Steam achievementi |
| GET | `/users/{username}/collection` | GameCollectionController::index | - | Biblioteka igara |
| GET | `/users/{username}/lists` | GameListController::index | - | Custom liste |
| GET | `/users/{username}/wrapped/{year}` | WrappedController::show | - | Annual wrapped |
| GET | `/compare/{username}/{other}` | ProfileCompareController::compare | - | Usporedi profile |

### Privatnost (08/2026)

Svi `/users/{username}*` endpointi prolaze kroz `ProfileService::canViewProfile()` (trait `App\Traits\ProfilePrivacy`). Ako je profil `friends`-only, a gledalac nije prihvaćeni prijatelj:

- `/users/{username}` vraća **200** sa skraćenim teaser payloadom: `user` (username, display_name, avatar_url, cover_image, rank), `stats` (level, xp, joined_at), `is_private: true`, `can_view: false`, `friend_status`. Namjerno **nije 404** — stranac mora imati razlog da pošalje zahtjev.
- Svi ostali (`/collection`, `/lists`, `/lists/{slug}`, `/activity`, `/steam-achievements`, `/recognitions`, `/wrapped/{year}`) vraćaju **403**.

Pun payload dodatno nosi `friend_status` (`self|none|pending|incoming|accepted`), `is_online`, `is_private`, `can_view: true`, te `stats.hours_played` i `stats.friends_count`.
`stats.reviews_count` su **objavljene game recenzije** (isto kao `/me/dashboard`); broj članaka za redakciju je sada `stats.articles_count`.

`PUT /user/profile` prima i `profile_visibility` (`public|friends`) i pritom briše `profile.show.v1.{username}` + sve `leaderboard:*` cache ključeve.

---

## Friends

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/friends` | FriendController::index | ✓ | Lista prijatelja |
| GET | `/friends/pending` | FriendController::pendingRequests | ✓ | Pending zahtjevi |
| GET | `/friends/search` | FriendController::search | ✓ | Pretraga korisnika |
| POST | `/friends/request` | FriendController::sendRequest | ✓ | Pošalji zahtjev |
| POST | `/friends/accept/{id}` | FriendController::acceptRequest | ✓ | Prihvati zahtjev |
| POST | `/friends/decline/{id}` | FriendController::declineRequest | ✓ | Odbij zahtjev |
| POST | `/friends/block/{id}` | FriendController::block | ✓ | Blokiraj korisnika |

---

## Messages

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/messages` | MessageController::index | ✓ | Lista konverzacija |
| POST | `/messages` | MessageController::store | ✓ | Pošalji poruku |
| PATCH | `/messages/{id}/read` | MessageController::markRead | ✓ | Označi pročitanom |
| DELETE | `/messages/{id}` | MessageController::destroy | ✓ | Obriši poruku |
| DELETE | `/messages/conversation/{userId}` | MessageController::deleteConversation | ✓ | Obriši konverzaciju |

---

## Dashboard (logovana naslovnica)

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/me/dashboard` | DashboardController::index | ✓ | Agregirani read-only payload za logovanu naslovnicu: user (level/xp/next_rank), collection stats, playing_now, favorites, backlog_preview, streak. Mutacije i feedovi ostaju na svojim endpointima. |
| GET | `/me/recommendations` | DashboardController::recommendations | ✓ | Personalizovane preporuke igara s match % (žanrovski profil iz biblioteke + platform/rating bonus). Keš 1h po korisniku. Prazna biblioteka → prazan niz. |

---

## Streak & Quests

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/user/streak` | StreakController::show | ✓ | Trenutni streak |
| POST | `/user/streak/claim` | StreakController::claim | ✓ | Claim dnevni streak |
| GET | `/quests` | QuestController::index | ✓ | Aktivni questovi |
| POST | `/quests/{id}/claim` | QuestController::claim | ✓ | Claim nagradu questa |

---

## Seasons, Clans, Leaderboard

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/seasons` | SeasonController::index | - | Lista sezona |
| GET | `/seasons/active` | SeasonController::active | - | Aktivna sezona |
| GET | `/clans` | ClanController::index | - | Lista klanova |
| GET | `/clans/{slug}` | ClanController::show | - | Detalj klana |
| POST | `/clans` | ClanController::store | ✓ | Kreiraj klan |
| POST | `/clans/{slug}/join` | ClanController::join | ✓ | Pridruži se klanu |
| GET | `/leaderboard` | LeaderboardController::index | - | XP leaderboard (cached 5min) |

---

## Presence

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/presence/{username}` | PresenceController::show | - | Što korisnik igra |
| POST | `/presence` | PresenceController::store | ✓ | Postavi presence |
| DELETE | `/presence` | PresenceController::destroy | ✓ | Ukloni presence |
| POST | `/discord/presence` | PresenceController::discordUpdate | Bot | Discord Rich Presence update |

---

## Discord Bot

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/discord/user/{discordId}` | DiscordIntegrationController::getUser | Bot | Korisnik po Discord ID |
| POST | `/discord/xp` | DiscordXpController::addXp | Bot | Dodaj XP iz Discorda |
| GET | `/discord/leaderboard` | DiscordLeaderboardController::top | Bot | Top leaderboard |
| POST | `/discord/daily` | DiscordDailyController::claim | Bot | Claim daily bonus |
| GET | `/discord/subscriptions` | DiscordSubscriptionController::index | Bot | Aktive subscriptions |
| POST | `/discord/subscriptions` | DiscordSubscriptionController::subscribe | Bot | Subscribe channel |
| DELETE | `/discord/subscriptions` | DiscordSubscriptionController::unsubscribe | Bot | Unsubscribe |
| POST | `/discord/gift` | DiscordGiftController::gift | Bot | Gift XP |
| POST | `/discord/admin/xp/give` | DiscordAdminController::giveXp | Bot | Admin daj XP |
| POST | `/discord/admin/xp/remove` | DiscordAdminController::removeXp | Bot | Admin skini XP |

---

## WoW Analyzer

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| POST | `/wow/analyze` | WowAnalyzerController::analyze | - | Analiziraj WoW lika (throttle:60) |
| GET | `/wow/leaderboard` | WowAnalyzerController::leaderboard | - | WoW leaderboard |
| GET | `/wow/recent` | WowAnalyzerController::recent | - | Nedavne analize |
| GET | `/wow/analysis/{id}` | WowAnalyzerController::show | - | Detalj analize |
| POST | `/wow/analysis/{id}/share` | WowAnalyzerController::share | - | Share analiza |
| GET | `/wow/realms/{region}` | WowAnalyzerController::getRealms | - | Lista realma |

---

## Shop & PayPal

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/shop/products` | ShopController::index | - | Katalog proizvoda |
| GET | `/shop/products/{slug}` | ShopController::show | - | Detalj proizvoda |
| POST | `/shop/orders` | PayPalController::createOrder | ✓ | Kreiraj PayPal narudžbu |
| POST | `/shop/orders/capture` | PayPalController::captureOrder | ✓ | Potvrdi PayPal narudžbu |
| POST | `/shop/orders/cod` | ShopController::storeOrder | ✓ | COD narudžba |
| POST | `/subscriptions/activate` | PayPalController::activateSubscription | ✓ | Aktiviraj pretplatu |
| POST | `/webhooks/paypal` | PayPalWebhookController::handleWebhook | - | PayPal webhook (signature verify) |

---

## Giveaways

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/giveaways` | GiveawayController::index | - | Lista giveawaya |
| GET | `/giveaways/{slug}` | GiveawayController::show | - | Detalj giveawaya |
| GET | `/giveaways/{slug}/leaderboard` | GiveawayController::leaderboard | - | Leaderboard |
| POST | `/giveaways/{slug}/enter` | GiveawayController::enter | ✓ | Prijavi se (throttle:10) |
| POST | `/giveaways/{slug}/tasks/{taskId}/complete` | GiveawayController::completeTask | ✓ | Kompletizuj task |
| POST | `/giveaways/{slug}/daily-bonus` | GiveawayController::claimDailyBonus | ✓ | Daily bonus |
| GET | `/giveaways/{slug}/my-entry` | GiveawayController::myEntry | ✓ | Moja prijava |
| POST | `/giveaways/{slug}/privee/login` | PriveeGiveawayController::login | - | Privée login |
| POST | `/giveaways/{slug}/privee/google-login` | PriveeGiveawayController::googleLogin | - | Privée Google login |
| GET | `/giveaways/{slug}/privee/entry` | PriveeGiveawayController::myEntry | - | Privée entry status |

---

## SEO & Settings

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/settings` | SettingsController::index | - | Site settings |
| GET | `/page-seo` | SettingsController::pageSeo | - | Page SEO lista |
| GET | `/page-seo/{path}` | SettingsController::pageSeoByPath | - | SEO za path |
| POST | `/seo/suggest-links` | SeoController::suggestLinks | ✓ | AI link prijedlozi |
| GET | `/seo/orphan-pages` | SeoController::getOrphanPages | ✓ | Orphan pages |

---

## Notifikacije

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/notifications` | NotificationController::index | ✓ | Lista notifikacija |
| GET | `/user/notifications/counts` | NotificationController::counts | ✓ | Broj nepročitanih |
| PATCH | `/notifications/{id}/read` | NotificationController::markRead | ✓ | Označi pročitanom |
| POST | `/notifications/read-all` | NotificationController::markAllRead | ✓ | Označi sve pročitanim |
