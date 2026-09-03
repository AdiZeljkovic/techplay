# 08 — API Map

**Base URL:** `https://api-beta.techplay.gg/api/v1`
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
| GET | `/guides` | GuideController::index | - | Lista guideova. **Samo objavljeni** (`Guide::published()` — status + `published_at` koji nije u budućnosti); do 29.08.2026 su se listali i draftovi |
| GET | `/guides/{slug}` | GuideController::show | - | Detalj guidea. Vraća `helpful_count`, `unhelpful_count`, `user_vote`. Neobjavljen → 404 (isti scope) |
| POST | `/guides/{slug}/vote` | GuideController::vote | auth:sanctum, throttle:30,1 | `is_helpful` bool. Isti odgovor drugi put povlači glas. Briše keš guidea kroz `CacheService::articleShowKey('guide', …)` — ključ se nigdje ne ispisuje rukom |

## Help centre (help.techplay.gg) — 03.09.2026

Sve javno i bez prijave, namjerno: dva najčešća pitanja („dugme Create account
ne radi", „verifikacijski mail nije stigao") postavljaju ljudi koji se **ne mogu
prijaviti**. Ništa ovdje ne pita ko si.

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/help` | HelpController::index | - | Cijeli centar u jednom odgovoru — teme s odgovorima ispod, plus `popular`. Tema bez ijednog objavljenog odgovora **ne izlazi** (kartica koja obećava pomoć a otvara praznu stranicu) |
| GET | `/help/search?q=` | HelpController::search | - | Do 10 rezultata. Traži i po tijelu teksta; rangira `LOWER(title)` u četiri nivoa |
| GET | `/help/topics/{slug}` | HelpController::topic | - | Tema i njeni odgovori. Sakrivena tema → 404, ne prazna stranica |
| GET | `/help/answers/{slug}` | HelpController::answer | - | Odgovor, njegova tema i ostatak te teme. Broji pregled u `views:help:{id}` |
| POST | `/help/answers/{slug}/helpful` | HelpController::helpful | throttle:10,1 | `helpful` bool, **anonimno**. Jedan glas po adresi dnevno; ponovljeni vraća 200 s `counted: false` |
| GET | `/search/help?q=` | SearchController::help | - | Do 5 rezultata za padajuću pretragu na techplay.gg. **Jedini** URL ovdje koji je apsolutan — vodi na drugi host |

**Help rezultati idu prvi u header dropdownu.** Onaj ko kuca „steam not syncing"
u traku na vrhu sajta je tačno onaj zbog koga help centar postoji, a tri
nepovezane vijesti su ono što ga šalje na mail. Na običnom upitu ovo ne mijenja
ništa — pretraga za igrom ne pogađa nijedan help odgovor. `SearchDropdown` za te
redove **mora** ići kroz `window.location`: `router.push` navigira unutar rutnog
stabla ove aplikacije i s apsolutnim URL-om ne uradi ništa.

**Pravilo koje drži cijelu sekciju — `HelpArticle::scopeVisible()`.** Odgovor je
javan samo ako je i **njegova tema** objavljena. Sakrivanje teme je način na koji
urednik povlači cijelu temu; bez ovoga svaki odgovor unutra ostaje dostupan na
svojoj adresi dok stranica teme oko njega vraća 404, a čovjek koji dođe s Googlea
dobija odgovor za koji sajt misli da je povučen. Vrijedi i za sitemap.

**Sitemap i robots su na poddomeni, ne na techplay.gg.** Sitemap smije nabrajati
samo URL-ove sa svog hosta, pa `sitemap-help.xml` na glavnom sajtu ne postoji i
ne smije se praviti. Laravel ih servira na `/help/robots.txt` i
`/help/sitemap.xml` (`SitemapController::helpRobots` / `helpSitemap`), a nginx
blok `help.techplay.gg` ih mapira na `/robots.txt` i `/sitemap.xml` te poddomene.
Obje rute su **izvan `web` middleware grupe** — kolačić sesije na fajlu koji čita
crawler čini ga nekeširajućim i na rubu i u crawleru.

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
| GET | `/games/calendar` | GameController::calendar | - | Lista nadolazećih (naslovnica, header) |
| GET | `/calendar` | CalendarController::index | - | Mjesec: 2 najveće po danu + `total` |
| GET | `/calendar/day/{date}` | CalendarController::day | - | Svi izlasci jednog dana |
| GET | `/calendar/{slug}` | CalendarController::show | - | Stranica jednog izlaska |
| POST | `/calendar/{slug}/reminder` | CalendarController::toggleReminder | auth | Podsjetnik na izlazak |
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
| GET | `/users/{username}/collection` | GameCollectionController::index | - | Javna kolekcija. Query: `status`, `favorite`, `search` (ILIKE po imenu igre), `sort` = recent\|added\|name\|hours\|rating\|released, `page`, `page_size` (max 60) |
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
| GET | `/users/{username}` | AuthController::show | - | Javni profil. Nosi `player_card` (sati, `span`, najigranija igra s udjelom, platformski achievementi) — zamijenio mrtvi `gamer_dna` 23.08.2026. Ključ `reputation` preimenovan u **`standing`** 24.08.2026 i sada nosi XP rank (`rank`, `next_rank`, `xp`, `percentile` po XP-u, `history` = XP) umjesto reputacijskog tiera; `reputation` je ostao kao broj unutar njega |
| GET | `/users/{username}/activity` | ActivityController::index | - | Aktivnost korisnika |
| GET | `/users/{username}/recognitions` | RecognitionController::index | - | Recognitions |
| GET | `/users/{username}/steam-achievements` | SteamAchievementController::index | - | Steam achievementi |
| POST | `/connected-accounts/gog/connect` | ConnectedAccountController::gogConnect | ✓ | GOG uvoz (24.08.2026). Bez OAuth-a za treće strane — čitalac zalijepi `code` iz adresne trake, kao npsso kod PSN-a. Iza `GOG_ENABLED`; ugašen vraća **503**. GOG daje samo šta posjeduješ — sve ulazi kao `backlog` |
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
| ~~POST~~ | ~~`/quests/{id}/claim`~~ | — | — | **NE POSTOJI.** Nagrada se dodjeljuje sama u `QuestService::grantRewards()` čim `progress >= criteria_value`; nema ni rute ni `claimed_at` kolone. Ruta je bila upisana ovdje a nikad implementirana. |

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

---

## Izmjene ruta iz sigurnosnog pregleda 08–10.08.2026

Detaljno u `docs/36-p1-autorizacija.md`, `37-p2-filament.md` i
`38-p3-ulazna-sigurnost.md`. Ovdje samo ono što mijenja **ugovor** — ime rute,
ko smije, ili oblik odgovora.

### Nove rute

| Metoda | Ruta | Controller::Metoda | Auth | Opis |
|--------|------|--------------------|------|------|
| GET | `/chat/attachments/{message}` | ChatController::attachment | potpis | Slika iz poruke. Potpisan i istekiv URL jer `<img>` ne može nositi bearer token; fajl je na privatnom disku. |
| GET | `/journal/moments/{moment}/image` | JournalController::momentImage | potpis | Isto za snimke ekrana iz dnevnika. |

### Uklonjene rute

| Ruta | Zašto |
|---|---|
| `POST /support/create-plan` | Pokazivala je na metodu koja nikad nije napisana — svaki poziv 500. Nijedan frontend pozivalac. |

### Promijenjen pristup

| Ruta | Prije | Sada |
|---|---|---|
| `POST /webhooks/discord/notify` | javna | `auth:sanctum` + staff, `throttle:10,1`, validiran ulaz |
| **cijela `/discord/*` grupa** | provjera po kontroleru, dvije rute bez ijedne | `discord.bot` middleware na grupi (`X-Discord-Bot-Token`, prihvata i `X-Bot-Secret`) |
| `GET /email/verify/{id}/{hash}` | bez provjere potpisa | `signed` middleware |
| `GET /forum/threads/{slug}`, `/forum/search`, `/forum/active`, `/forum/unanswered`, `/games/{slug}/threads` | privatne klanske teme vidljive | filtrirane po članstvu (keširane rute nose samo javne kategorije) |
| `GET /game-lists/{id}`, `/game-lists/{id}/comments`, `/game-lists/discover` | zaobilazile privatnost profila | poštuju je |
| `GET /presence/{username}` | bez provjere privatnosti | vraća `null` za skriven profil |
| Giveaway rute (`tasks/complete`, `leaderboard`, `daily-bonus`, `my-entry`) | bez `is_public` | filtrirane |
| `DELETE /user/account` | samo token | traži `current_password` |
| Sve upisne rute | ban vrijedio na 6 forumskih | `CheckUserBan` na cijeloj API grupi (samo ne-GET) |

### Promijenjen oblik odgovora

Ovo su **prelomne** izmjene — frontend je usklađen u istom commitu.

| Ruta | Prije | Sada |
|---|---|---|
| `GET /conversations/{id}/messages` | `attachment_path` (putanja na javnom disku) | `attachment_url` (potpisan, ističe za 6h) |
| `GET /users/{username}/journal` | `moments[].path` | `moments[].image_url` (potpisan) |
| `POST /auth/register` | vraćao `access_token` | ne vraća token prije verifikacije; `requires_verification` ostaje |
| `GET /users/{username}` | `stats.bounty_balance` svima | samo vlasniku |
