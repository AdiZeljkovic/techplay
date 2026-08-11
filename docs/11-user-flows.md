# 11 — User Flows

## 1. Posjetilac čita news članak

```
1. Korisnik otvara techplay.gg/news/[slug]
2. Next.js Server Component → GET /api/v1/news/{slug} → NewsController::show
3. ISR cache provjera (revalidate: N sekundi)
4. Article data renderovan server-side
5. GlobalSeo komponenta injektuje meta title, OG tags
6. JSON-LD schema (Article) renderovan u headeru
8. Real-time: useRealTimeComments → Reverb WebSocket → live komentari
```

---

## 2. Posjetilac čita review

```
1. techplay.gg/reviews/[slug]
2. GET /api/v1/reviews/{slug} → ReviewController::show
3. ISR cache, server render
4. Ocjena, specs tabela, sadržaj prikazan
5. Meta tagovi s review structured data
```

---

## 3. Posjetilac koristi game database

```
1. techplay.gg/games
2. GET /api/v1/games?page=1&genre=Action&platform=PC → GameController::index
3. Filter logika (genre_names @> ARRAY['Action']::text[])
4. Grid prikaz game kartica
5. Korisnik može filtrirati po žanru, platformi, godini, ocjeni
```

---

## 4. Posjetilac otvara game detail page

```
1. techplay.gg/games/[slug]
2. GET /api/v1/games/{slug} → GameController::show
3. Ako postoji lokalni unos: prikaz iz DB
4. Screenshoti: GET /api/v1/games/{slug}/screenshots (lokalni) ili RAWG fallback
5. User ocjene: GET /api/v1/games/{slug}/ratings
6. Povezani članci (ako game_id linkovan na Article): prikaz
7. Ako korisnik logovan: GET /api/v1/collection/games/{slug} → library status badge
```

---

## 5. Posjetilac koristi release calendar

```
1. techplay.gg/calendar
2. GET /api/v1/games/calendar (parametri za datum range)
3. Igre grupisane po datumu izlaska
4. Prikaz po mjesecu/tjednu (detalji UI UNKNOWN)
```

---

## 6. Korisnik se registruje

```
1. techplay.gg/register (ili (auth)/register)
2. Form: username, email, password
3. POST /api/v1/auth/register
4. Backend: validacija, bcrypt hash, kreiranje User record
5. Token vraćen → AuthContext spremi u localStorage
6. Redirect na profil ili homepage
7. Email verifikacija šalje se (UNKNOWN da li obavezna)
```

---

## 7. Korisnik se loguje

```
1. techplay.gg/login
2. Form: email/username, password
3. POST /api/v1/auth/login
4. Backend: verify password → revoke stari token → kreiraj novi
5. Token + user data vraćen
6. AuthContext: spremi token + user u localStorage
7. Redirect na prethodnu stranicu ili homepage
```

### Discord OAuth login
```
1. Klik "Login with Discord"
2. GET /api/v1/auth/discord/redirect → Discord OAuth
3. Discord redirect → GET /api/v1/auth/discord/callback
4. SocialAuthController: pronađi/kreiraj user → token
5. Frontend: spremi token → redirect
```

---

## 8. Korisnik ostavlja komentar

```
1. Korisnik na news/review/guide/video stranici
2. AuthContext provjera — da li je logovan?
3. Ako nije: redirect na /login
4. Korisnik upisuje komentar
5. POST /api/v1/comments (throttle:30,1)
6. Backend: SanitizationService (XSS zaštita) → Comment::create
7. CommentObserver → Broadcast CommentPosted event
8. XpService → dodjela XP za komentar (60s cooldown provjera)
9. Real-time: useRealTimeComments → svi korisnici na stranici vide novi komentar
```

---

## 9. Korisnik dobija XP

**Web akcije:**
```
- Ostavlja komentar → XpService::awardForComment()
- Dnevni streak claim → POST /user/streak/claim → StreakService → XP
- Quest kompletizacija → POST /quests/{id}/claim → XP award
- Giveaway zadatak → bonus tickets + XP
```

**Discord akcije:**
```
- Poruka u Discord serveru (nije bot command)
- XpService u botu: 15 XP/msg, 60s cooldown
- POST /api/v1/discord/xp
- Backend: DiscordXpController → XpService → User.xp update
- Rank provjera: da li je novi XP threshold dostignut?
```

---

## 10. Korisnik otključava achievement

```
1. Korisnik izvrši akciju (npr. postavi 10 komentara)
2. AchievementService::check() poziva se (vjerovatno iz observera ili servisa)
3. Provjera thresholds iz achievements tabele
4. Novi achievement: create pivot record, NotificationReceived event
5. Frontend: real-time notifikacija (bell ikona)
6. Prikaz na profilu
```

---

## 11. Korisnik koristi profil

```
1. techplay.gg/profile/[username]
2. GET /api/v1/users/{username}
3. ProfileService agregira: user data + rank + achievements + activity + presence
4. Prikaz: avatar, rank badge, XP bar, recent activity
5. GET /users/{username}/collection → game biblioteka
6. GET /users/{username}/activity → aktivnost feed
7. GET /users/{username}/steam-achievements → Steam achievementi
8. GET /presence/{username} → što igra (real-time)
```

---

## 12. Korisnik koristi forum

```
1. techplay.gg/forum
2. GET /api/v1/forum/categories → lista kategorija
3. Korisnik klika kategoriju
4. GET /api/v1/forum/categories/{slug} → threadovi u kategoriji
5. Korisnik otvara thread
6. GET /api/v1/forum/threads/{slug} → thread + postovi
7. Ako logovan: forma za reply
8. POST /api/v1/forum/threads/{slug}/posts
9. ForumPostObserver → Broadcast ForumReplyPosted
10. Real-time: useRealTimeForum → svi vide novi post
11. XP dodjela za post (vjerovatno)
```

---

## 13. Admin objavljuje članak

```
1. Admin loguje se na /admin
2. NewsResource → "New Article"
3. Filament form: naslov, slug (auto-gen), kategorija, sadržaj (rich editor)
4. SEO polja: meta title, description, OG image upload
5. Hero toggle, featured toggle
6. Scheduled publish (opcija)
7. Save → Article::create() ili update
8. ArticleObserver::created/updated
9. CacheRevalidationService::revalidateArticle()
10. POST → Next.js /api/revalidate s secret
11. ISR cache purge za /news i /news/{slug}
12. IndexNowService: PingIndexNow job queued
13. PingIndexNow → Bing/Yandex instant indexing
14. ArticlePublished broadcast event → real-time frontend update
```

---

## 14. Admin objavljuje review

```
1. Admin → ReviewResource → "New Review"
2. Filament form: naslov, igra (link na Game), content, ocjena (0-10), specs
3. Save → ReviewObserver → CacheRevalidation → ISR purge
4. ReviewPublished broadcast event
```

---

## 15. Admin upravlja igrom u bazi

```
Manuelno:
1. Admin → GameResource → edit game
2. Upisuje/mijenja podatke

Import:
1. Admin (developer) pokreće: php artisan moby:fetch
2. MobyGamesService → MobyGames API → save game records
3. MobyEnrichmentJob → detalji za svaku igru

RAWG fallback:
1. Game page na frontendu za igru bez lokalnih screenshota
2. GET /games/rawg/{slug} → RawgService → live RAWG API call
```

---

## 16. Discord bot šalje news na Discord

```
1. PollingService periodično (default 600s) pita backend za nove članke
2. GET /api/v1/news?since={last_checked}
3. Ako postoje novi članci: format embed poruka
4. Bot šalje u LATEST_NEWS_CHANNEL_ID channel
5. SubscriptionService provjera custom subscriptions
```

---

## 17. Korisnik dobija daily giveaway bonus

```
1. Korisnik otvara giveaway stranicu
2. POST /giveaways/{slug}/daily-bonus
3. Provjera: da li je claim danas već napravljen?
4. Ako ne: dodaj bonus tickets na GiveawayEntry
5. Update streak u giveaway_entries
```
