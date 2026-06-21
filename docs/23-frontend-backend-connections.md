# 23 — Frontend–Backend Connections

## Mapa: Frontend → API → Backend → Database

| Frontend stranica | API endpoint(i) | Backend kontroler | Model/Tabela |
|------------------|----------------|-------------------|-------------|
| `/` (homepage) | `GET /home` | HomeController::index | articles, reviews, games, itd. |
| `/news` | `GET /news?page=&category=` | NewsController::index | articles, categories |
| `/news/[slug]` | `GET /news/{slug}`, `POST /articles/{slug}/view` | NewsController::show, TrackingController::recordView | articles, article_views |
| `/reviews` | `GET /reviews?page=` | ReviewController::index | reviews |
| `/reviews/[slug]` | `GET /reviews/{slug}` | ReviewController::show | reviews |
| `/guides` | `GET /guides` | GuideController::index | guides |
| `/guides/[slug]` | `GET /guides/{slug}` | GuideController::show | guides, guide_votes |
| `/hardware` | `GET /tech` | TechController::index | articles (tech categorija) |
| `/hardware/[slug]` | `GET /tech/{slug}` | TechController::show | articles |
| `/videos` | `GET /videos` | VideoController::index | videos |
| `/videos/[slug]` | `GET /videos/{slug}` | VideoController::show | videos |
| `/games` | `GET /games?q=&genre=&platform=&year=` | GameController::index | games |
| `/games/[slug]` | `GET /games/{slug}`, `GET /games/{slug}/screenshots`, `GET /games/{slug}/ratings` | GameController::show, GameRatingController::index | games, game_ratings |
| `/calendar` | `GET /games/calendar` | GameController::calendar | games |
| `/forum` | `GET /forum/categories` | ForumController::categories | categories, threads |
| `/forum/[categorySlug]` | `GET /forum/categories/{slug}` | ForumController::showCategory | categories, threads |
| `/forum/[threadSlug]` | `GET /forum/threads/{slug}`, `GET /comments/thread/{id}` | ForumController::showThread, CommentController::index | threads, posts |
| `/profile/[username]` | `GET /users/{username}`, `GET /users/{username}/activity`, `GET /users/{username}/collection`, `GET /presence/{username}` | AuthController::show, ActivityController::index, GameCollectionController::index, PresenceController::show | users, user_games, presences, user_recognitions |
| `/settings` | `GET /auth/me`, `PUT /user/profile`, `PUT /user/password` | AuthController | users |
| `/friends` | `GET /friends`, `GET /friends/pending` | FriendController::index | friendships |
| `/messages` | `GET /messages` | MessageController::index | messages |
| `/leaderboard` | `GET /leaderboard` | LeaderboardController::index | users, ranks |
| `/clans` | `GET /clans` | ClanController::index | clans |
| `/clans/[slug]` | `GET /clans/{slug}` | ClanController::show | clans, clan_members |
| `/compare/[u1]/[u2]` | `GET /compare/{username}/{other}` | ProfileCompareController::compare | users |
| `/giveaways` | `GET /giveaways` | GiveawayController::index | giveaways |
| `/giveaways/[slug]` | `GET /giveaways/{slug}`, `GET /giveaways/{slug}/my-entry` | GiveawayController::show, myEntry | giveaways, giveaway_entries |
| `/shop` | `GET /shop/products` | ShopController::index | products |
| `/shop/[slug]` | `GET /shop/products/{slug}` | ShopController::show | products |
| `/cart` | — (client-side CartContext) | — | — |
| `/checkout` | `POST /shop/orders`, `POST /shop/orders/capture` | PayPalController | orders, order_items |
| `/wow-analyzer` | `POST /wow/analyze`, `GET /wow/leaderboard` | WowAnalyzerController | wow_analyses |
| `/backlog-advisor` | `POST /backlog/suggest` | BacklogAdvisorController | user_games, games |
| `/wrapped/[username]` | `GET /users/{username}/wrapped/{year}` | WrappedController | user_games, reputation_snapshots |
| `/login` | `POST /auth/login` | AuthController::login | users, personal_access_tokens |
| `/register` | `POST /auth/register` | AuthController::register | users |
| `/auth/*` (OAuth) | `GET /auth/discord/callback` | SocialAuthController::callback | users, connected_accounts |

---

## API pozivi zajednički za sve stranice

| Poziv | Endpoint | Svrha |
|-------|---------|-------|
| Site settings | `GET /settings` | Maintenance mode, globalne postavke |
| Page SEO | `GET /page-seo/{path}` | SEO override za stranicu |
| Navigation | `GET /navigation/tree` | Header navigacija |
| Reklame | `GET /ads/{position}` | Reklamni sadržaj po poziciji |
| Notifikacije | `GET /user/notifications/counts` | Broj nepročitanih (auth) |

---

## Real-time WebSocket channels (Reverb)

| Kanal | Event | Stranica |
|-------|-------|---------|
| `news` | `ArticlePublished` | `/news`, `/` |
| `reviews` | `ReviewPublished` | `/reviews` |
| `guides` | `GuidePublished` | `/guides` |
| `videos` | `VideoPublished` | `/videos` |
| `comments.{type}.{id}` | `CommentPosted` | Detalj stranice |
| `forum` | `ThreadCreated`, `ForumReplyPosted` | `/forum` |
| `shop` | `ProductStockUpdated` | `/shop` |
| `private.user.{id}` | `NotificationReceived` | Svi (logged in) |
| `presence.{username}` | `PresenceUpdated` | `/profile` |

---

## ISR revalidation triggers

| Stranica | Trigger | Revalidation endpoint |
|---------|---------|----------------------|
| `/news/{slug}` | ArticleObserver::saved | `/api/revalidate?path=/news/{slug}` |
| `/reviews/{slug}` | ReviewObserver::saved | `/api/revalidate?path=/reviews/{slug}` |
| `/guides/{slug}` | GuideObserver::saved | `/api/revalidate?path=/guides/{slug}` |
| `/videos/{slug}` | VideoObserver::saved | `/api/revalidate?path=/videos/{slug}` |
| `/tech/{slug}` | (ArticleObserver?) | UNKNOWN |
| `/games/{slug}` | (GameObserver?) | UNKNOWN |

---

## Poznate neskladnosti

1. **`/games` nema observer revalidation** koliko je vidljivo — game stranice možda ne revalidiraju pri update
2. **SEO stranice** — `PageSeo` observer postoji, ali revalidacija možda nije implementirana za sve paths
3. **Forum stranice** — threadovi imaju observer, ali ISR revalidacija UNKNOWN
4. **Category stranice** — `CategoryObserver` postoji, ali što revalidira UNKNOWN
