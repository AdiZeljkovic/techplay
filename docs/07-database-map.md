# 07 — Database Map

## Database engine

- **Produkcija:** PostgreSQL 14+
- **Testovi:** SQLite (in-memory) — `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`
- **ORM:** Laravel Eloquent
- **Cache/Queue:** Redis

**Specijalna napomena:** `Game.genres`, `Game.platforms`, `Game.tags`, `Game.developers`, `Game.publishers` su PostgreSQL `TEXT[]` array kolone. PHP ih prima kao raw string `{Action,"Role-Playing (RPG)"}` — Eloquent ih kastuje kroz `PostgresArray`; kod raw upita koristiti `pgArray()` helper prije array operacija.

---

## Tabele po domenima

### Korisnici i autentifikacija

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `users` | Korisnici | id, username, email, password, xp, rank_id, discord_id, discord_username, streak, steam_id, paypal_*, **profile_visibility**, **active_days_count** |
| `personal_access_tokens` | Sanctum tokeni | id, tokenable_id, token, abilities |
| `connected_accounts` | Steam/Discord/BNet linkovi | user_id, provider, provider_id |
| `ranks` | XP rangovi | id, name, xp_required, color, icon |
| `friendships` | Prijatelji | id, user_id, friend_id, status (pending/accepted/blocked) |
| `presences` | Što korisnik igra | id, user_id, game_id, game_name, started_at |
| `reputation_snapshots` | Snapshot reputacije | id, user_id, xp, rank_id, snapshotted_at |
| `user_recognitions` | Recognition između korisnika | id, from_user_id, to_user_id, type, message |
| `user_customizations` | Profile customizacija | user_id, avatar_frame, banner, badges, itd. |

### Content

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `articles` | News + tech/hardware + ostalo | id, title, slug, content, category_id, author_id, game_id, is_hero, views, published_at |
| `reviews` | Game reviews | id, title, slug, content, game_id, score (0-10), specs, published_at |
| `guides` | Gaming guides | id, title, slug, content, category_id, upvotes, downvotes, status |
| `videos` | Video sadržaj | id, title, slug, embed_url, category_id, thumbnail |
| `categories` | Kategorije | id, name, slug, type (news/forum/itd.), parent_id |
| `content_versions` | Verzije sadržaja | id, versionable_type, versionable_id, content, version |
| `seo_metas` | SEO metadata override | id, entity_type, entity_id, meta_title, meta_description, og_* |
| `page_seos` | Per-path SEO | id, path, title, description, og_image |

### Game Database

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `games` | Kanonska TechPlay baza (08/2026 sanacija — nema više RAWG/Moby imena) | id, slug, name, released, release_precision, rating, cover_url, description, genres (TEXT[]), platforms (TEXT[]), tags (TEXT[]), developers (TEXT[]), publishers (TEXT[]), screenshots (json), videos (json — traileri, puni se ručno/agregatorom), alt_titles (json), age_ratings (json), website, series_key, series_name, import_payload (arhiva sirovog Moby payloada — ne izlaže se u API), match_key, hype_score, is_editorial, locked_fields, views |
| `game_tombstones` | Obrisane igre → API vraća **410** (adult purge) | slug, name, reason, deleted_at |
| `game_companies` | Izdavači/developeri | id, name, slug, moby_id |
| `game_external_ids` | Vanjski IDevi — provenance | game_id, provider (mobygames/steam/...), external_id |
| `game_ratings` | User ocjene | game_id, user_id, rating (0-10), review_text |
| `user_games` | Korisnička biblioteka | user_id, game_id, status (playing/completed/wishlist/dropped/backlog), progress, hours_played, last_played_at (pravi Continue Playing signal — pišu ga upsert status=playing, Steam sync i presence), is_favorite, showcase_order, platform, started_at, completed_at, **from_backlog** (je li završena igra prošla kroz backlog), **playtime_minutes**, **playtime_source** (`steam` \| `discord` \| `presence` \| `manual` \| null — bez izvora UI kaže "not tracked", ne "0h") |
| `game_lists` | Custom liste igara | id, user_id, name, slug, is_public |
| `game_list_items` | Stavke u listama | list_id, game_id, position, notes |

### Forum

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `threads` | Forum threadovi | id, title, slug, category_id, author_id, is_pinned, is_locked, views, posts_count |
| `posts` | Forum postovi i replies | id, thread_id, author_id, content, parent_id (za nesting), upvotes, is_deleted, edited_at, **solution_rewarded_at** |
| `guide_votes` | Guide voting | id, guide_id, user_id, vote (up/down) |

### Komentari

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `comments` | Komentari (polymorphic) | id, commentable_type, commentable_id, user_id, content, parent_id, status (`pending`/`approved`), **xp_awarded_at**, is_deleted |
| `comment_likes` | Like/dislike komentara | id, comment_id, user_id, type (like/dislike) |

### Gamification

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `achievements` | Achievement definicije | id, name, description, icon_path (RELATIVNA putanja → frontend uvijek kroz `getStorageUrl()`), points, criteria_type, criteria_value, **is_hidden** (feature još ne postoji — ne prikazuje se u katalogu) |
| `quests` | Quest definicije | id, title, type (daily/weekly/seasonal), xp_reward, goal_type, goal_value, season_id |
| `quest_progress` | Napredak korisnika | user_id, quest_id, progress, completed_at, claimed_at |
| `seasons` | Sezone | id, name, start_date, end_date, is_active |
| `bounty_transactions` | Bounty knjiga — i **izvor idempotencije** za isplate | id, user_id, amount, type, reason, **reference** (`unique(user_id, reference)`), balance_after |
| `reward_items` | Reward store stavke | id, name, description, cost, type, image |
| `reward_redemptions` | Redemptions | user_id, reward_item_id, redeemed_at |
| `steam_achievements` | Steam achievement import | user_id, game_id, steam_app_id, achievement_id, unlocked_at |

### Discord

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `discord_subscriptions` | News subscription po channelu | id, channel_id, guild_id, type (news/giveaway), webhook_url |

### WoW

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `wow_analyses` | AI WoW analize | id, user_id, character_name, realm, region, score, analysis_json, pvp_data, collections, professions |
| `user_wow_characters` | Saved WoW likovi | id, user_id, character_name, realm, region, is_main |

### Commerce

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `products` | Shop proizvodi | id, name, slug, description, price, stock, paypal_plan_id |
| `orders` | Narudžbe | id, user_id, total_price, status (`pending`/`processing`/`completed`/`cancelled`/`refunded` — **uvijek mala slova**), payment_status, payment_method, **stock_restored_at**, paypal_order_id, paypal_transaction_id |
| `order_items` | Stavke narudžbi | order_id, product_id, quantity, price |
| `support_tiers` | Support/subscription nivo | id, name, price, paypal_plan_id, xp_multiplier |
| `user_supports` | Korisnikova aktivna podrška | user_id, support_tier_id, **payment_id** (unique), amount, status, **is_recurring**, expires_at |
| `giveaways` | Giveaway events | id, title, slug, description, ends_at, winner_count, privee_id |
| `giveaway_entries` | Prijave na giveaway | giveaway_id, user_id, tickets, daily_bonus_claimed_at, streak |
| `giveaway_prize_tiers` | Nagrade | giveaway_id, rank, description |
| `giveaway_tasks` | Bonus zadaci | giveaway_id, type, description, bonus_tickets |
| `giveaway_task_completions` | Kompletizacija | entry_id, task_id |
| `privee_giveaway_entries` | Privée giveaway | giveaway_id, email, privee_user_id |

### Messaging

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `messages` | Direct messages | id, sender_id, recipient_id, content, read_at, deleted_at |
| `editorial_channels` | Interni chat kanali | id, name, type, slug |
| `editorial_messages` | Interni chat poruke | id, channel_id, user_id, content, og_data, reactions_count |
| `editorial_message_reactions` | Reakcije na poruke | message_id, user_id, emoji |

### SEO & System

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `site_settings` | Globalne postavke | key, value (maintenance_mode, itd.) |
| `redirects` | URL redirecti | from_path, to_path, type (301/302) |
| `media` | Upload datoteke | id, model_type, model_id, file_path, mime_type, size |
| `ad_campaigns` | Reklamne kampanje | id, name, position, content, starts_at, ends_at, iab_* |
| `broken_links` | Broken linkovi | id, url, found_on, status_code, last_checked_at |
| `newsletter_subscribers` | Newsletter | id, email, verified, verified_at |
| `reports` | User report | id, reporter_id, reportable_type, reportable_id, reason |
| `article_views` | View tracking | id, article_slug, user_id, ip, viewed_at |
| `notifications` | Laravel notifikacije | id, type, notifiable_type, notifiable_id, data, read_at |

---

## Ključne relacije

```
User ─────── hasMany ──→ Article (author)
User ─────── hasMany ──→ Comment
User ─────── hasMany ──→ UserGame
User ─────── hasMany ──→ Quest (progress)
User ─────── hasMany ──→ Achievement (pivot)
User ─────── belongsTo → Rank
User ─────── hasMany ──→ Message
User ─────── hasMany ──→ Friendship
User ─────── hasOne ───→ Presence

Article ──── belongsTo → Category
Article ──── belongsTo → User (author)
Article ──── belongsTo → Game (nullable, novi FK)
Article ──── morphMany → Comment
Article ──── hasOne ───→ SeoMeta

Game ──────── hasMany ──→ UserGame
Game ──────── hasMany ──→ GameRating
Game ──────── hasMany ──→ GameExternalId
Game ──────── hasMany ──→ GameListItem
Game ──────── belongsToMany → GameCompany

Thread ──── belongsTo → Category (forum)
Thread ──── belongsTo → User
Thread ──── hasMany ───→ Post

Comment ─── morphsTo ──→ Article / Review / Guide / Video / Game
Comment ─── hasMany ───→ Comment (parent_id, nesting)
```

---

## Privatnost profila (08/2026)

`users.profile_visibility` ima dvije vrijednosti — `public` (default) i `friends`.

- **Skriva agregate:** kolekcija, statistika, activity feed, achievementi, sati, liste, wrapped, recognitions.
- **NE skriva javni sadržaj:** forum threadovi, postovi, komentari i objavljene recenzije ostaju na svojim javnim stranicama — objavljeni su tamo, a ne na profilu.
- **Provjera je isključivo serverska:** `ProfileService::canViewProfile()`, primijenjena kroz trait `App\Traits\ProfilePrivacy` u svakom `/users/{username}/*` endpointu. Skrivanje na frontendu ne bi značilo ništa.
- **Isključuje iz javnih površina:** leaderboard (`/leaderboard`, svi tipovi + weekly) i member search (`/search/users`). Direktan link i dalje radi — vodi na zaključani teaser s dugmetom Add Friend.
- **Cache:** promjena postavke odmah briše `profile.show.v1.{username}` i sve `leaderboard:*` ključeve.

---

## Release calendar agregator (08/2026)

| Tabela | Svrha |
|---|---|
| `game_store_links` | Jedan red po store listingu koji smo ikad vidjeli. `unique(store, store_id)` je ono što čini ponovne syncove jeftinim — poklapanje se radi jednom, poslije je exact lookup. `game_id` je null za listing koji nikad nije postao unos u kalendaru, a `rejected_reason` kaže zašto. |
| `game_match_decisions` | Urednička odluka o spornom paru. Čuva se uz **normalizovana imena**, ne uz `game_id`, jer poenta odluke „ovo je ista igra" je da jedna od njih odmah zatim prestaje postojati. |

Nove kolone na `games`: `match_key`, `release_precision`, `hype_score`,
`is_editorial`, `locked_fields`.

**`match_key` je granica** između kalendara i arhiva. Postavlja ga isključivo
agregator, pa 200.000 istorijskih redova nikad ne uđe u kalendar niti u spajanje.
`locked_fields` je kako ručna ispravka preživi — sync i merge to polje ne diraju.

Detaljno: `docs/34-release-calendar-aggregator.md`

---

## Izmjene iz sigurnosnog pregleda 08–10.08.2026

Dvije migracije, obje zato što je kolona bila **korištena u kodu a nije
postojala u shemi** ili je nedostajala provjera koja se oslanja na nju.

| Migracija | Kolona | Zašto |
|---|---|---|
| `2026_08_09_000100` | `posts.solution_rewarded_at` | Označavanje rješenja isplaćivalo je ugled i bounty **pri svakom paljenju** prekidača, a odznačavanje nije vraćalo ništa. Timestamp znači "plaćeno jednom ikad". Migracija radi backfill na postojeća rješenja da ne postanu ponovo naplativa. |
| `2026_08_09_000200` | `user_supports.payment_id` (unique), `is_recurring` | `SupportController` je obje kolone čitao i pisao, a tabela ih nikad nije imala — svaki `POST /support/pledge` je vraćao 500. **Globalni** unique indeks je ono što sprječava da se jedna PayPal uplata iskoristi više puta, i to s više naloga. |

| `2026_08_10_000100` | `bounty_transactions.reference` (unique s `user_id`) | Isplate vezane za *dolazak* u stanje plaćale su pri svakom povratku u to stanje, a brisanje reda je brisalo svaku zastavicu koju bi tu držali. Knjiga je jedini zapis koji to preživi, pa idempotencija živi u njoj. |

Detaljno: `docs/36-p1-autorizacija.md`, `docs/41-p4-kolekcija-i-liste.md`

---

## Potencijalni problemi u strukturi baze

1. `Article` model se koristi za news I tech/hardware — razlikovanje samo po kategoriji. Može biti konfuzno.
2. `content_versions` tabela — UNKNOWN kako se koristi (verzionisanje?)
3. `article_views` + Redis view counters — dvije paralele source of truth za view count
4. PostgreSQL TEXT[] kolone u `games` tablici zahtijevaju poseban `pgArray()` helper kod raw upita — greška-prone
5. `editorial_messages` za interni editorial chat — ova feature nije vidljiva na frontend-u (interna alat)
