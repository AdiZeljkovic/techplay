# 07 — Database Map

## Database engine

- **Produkcija:** PostgreSQL 14+
- **Testovi:** SQLite (in-memory) — `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`
- **ORM:** Laravel Eloquent
- **Cache/Queue:** Redis

**Specijalna napomena:** `Game.genre_names`, `Game.platform_names`, `Game.tag_names` su PostgreSQL `TEXT[]` array kolone. PHP ih prima kao raw string `{Action,"Role-Playing (RPG)"}` — uvijek koristiti `pgArray()` helper prije array operacija.

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
| `games` | Igre | id, moby_id, rawg_slug, name, slug, description, cover_image, release_date, genre_names (TEXT[]), platform_names (TEXT[]), tag_names (TEXT[]), developer, publisher, rating, has_description |
| `game_companies` | Izdavači/developeri | id, name, slug, moby_id |
| `game_external_ids` | Vanjski IDevi | game_id, provider (rawg/igdb/steam), external_id |
| `game_ratings` | User ocjene | game_id, user_id, rating (0-10), review_text |
| `user_games` | Korisnička biblioteka | user_id, game_id, status (playing/completed/wishlist/dropped/backlog), progress, hours_played, last_played_at (pravi Continue Playing signal — pišu ga upsert status=playing, Steam sync i presence), is_favorite, showcase_order, platform, started_at, completed_at, **from_backlog** (je li završena igra prošla kroz backlog), **playtime_minutes**, **playtime_source** (`steam` \| `discord` \| `presence` \| `manual` \| null — bez izvora UI kaže "not tracked", ne "0h") |
| `game_lists` | Custom liste igara | id, user_id, name, slug, is_public |
| `game_list_items` | Stavke u listama | list_id, game_id, position, notes |

### Forum

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `threads` | Forum threadovi | id, title, slug, category_id, author_id, is_pinned, is_locked, views, posts_count |
| `posts` | Forum postovi i replies | id, thread_id, author_id, content, parent_id (za nesting), upvotes, is_deleted, edited_at |
| `guide_votes` | Guide voting | id, guide_id, user_id, vote (up/down) |

### Komentari

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `comments` | Komentari (polymorphic) | id, commentable_type, commentable_id, user_id, content, parent_id, is_deleted |
| `comment_likes` | Like/dislike komentara | id, comment_id, user_id, type (like/dislike) |

### Gamification

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `achievements` | Achievement definicije | id, name, description, icon_path (RELATIVNA putanja → frontend uvijek kroz `getStorageUrl()`), points, criteria_type, criteria_value, **is_hidden** (feature još ne postoji — ne prikazuje se u katalogu) |
| `quests` | Quest definicije | id, title, type (daily/weekly/seasonal), xp_reward, goal_type, goal_value, season_id |
| `quest_progress` | Napredak korisnika | user_id, quest_id, progress, completed_at, claimed_at |
| `seasons` | Sezone | id, name, start_date, end_date, is_active |
| `bounty_transactions` | Bounty transakcije | id, user_id, amount, type, description |
| `reward_items` | Reward store stavke | id, name, description, cost, type, image |
| `reward_redemptions` | Redemptions | user_id, reward_item_id, redeemed_at |
| `steam_achievements` | Steam achievement import | user_id, game_id, steam_app_id, achievement_id, unlocked_at |

### Clans

| Tabela | Opis | Ključne kolone |
|--------|------|---------------|
| `clans` | Gaming klanovi | id, name, slug, tag, description, owner_id, member_count |
| `clan_members` | Clan membership | clan_id, user_id, role (owner/admin/member), joined_at |
| `clan_invites` | Pozivnice | clan_id, inviter_id, invitee_id, status, expires_at |

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
| `orders` | Narudžbe | id, user_id, total, status, paypal_order_id, paypal_capture_id |
| `order_items` | Stavke narudžbi | order_id, product_id, quantity, price |
| `support_tiers` | Support/subscription nivo | id, name, price, paypal_plan_id, xp_multiplier |
| `user_supports` | Korisnikova aktivna podrška | user_id, support_tier_id, active_until |
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
User ─────── hasMany ──→ ClanMember

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

## Potencijalni problemi u strukturi baze

1. `Article` model se koristi za news I tech/hardware — razlikovanje samo po kategoriji. Može biti konfuzno.
2. `content_versions` tabela — UNKNOWN kako se koristi (verzionisanje?)
3. `article_views` + Redis view counters — dvije paralele source of truth za view count
4. PostgreSQL TEXT[] kolone u `games` tablici zahtijevaju poseban `pgArray()` helper — greška-prone
5. `editorial_messages` za interni editorial chat — ova feature nije vidljiva na frontend-u (interna alat)
