# 07 — Mapa baze podataka

**Generisano iz žive baze 29.08.2026.** Brojevi redova su procjena iz
`pg_stat_user_tables` na taj dan; imena kolona su tačna.

> **Zašto ovaj dokument izgleda drukčije nego prije.** Prethodna verzija je
> pisana rukom i razišla se sa stvarnošću: dokumentovala je četiri tabele koje
> su obrisane (`reviews`, `editorial_*`), pogrešna imena kolona u dvadesetak
> tabela (`friendships.user_id/friend_id` umjesto `sender_id/receiver_id`,
> `messages.recipient_id` umjesto `receiver_id`, `guides.upvotes` kojih nema),
> i nije pominjala oko trideset pet tabela — cijeli profil/journal/social sloj.
> Mapa koja laže je gora od mape koje nema, jer se po njoj donose odluke.
> Ova je izvučena iz `information_schema`, pa je tačna po konstrukciji na dan
> generisanja. **Kad se šema promijeni, regeneriši je, ne dopisuj.**

## Motor

- **Produkcija:** PostgreSQL 16.15
- **Testovi:** SQLite (in-memory) — `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`
- **ORM:** Eloquent · **Keš/red:** Redis
- **Veličina:** 1.972 MB (bilo 5.866 MB do brisanja IGDB staginga 29.08.2026)

**PostgreSQL `TEXT[]` kolone** na `games`: `genres`, `platforms`, `tags`,
`developers`, `publishers`. PHP ih prima kao sirovi string
`{Action,"Role-Playing (RPG)"}`.

**Postoji tačno jedan parser: `App\Casts\PostgresArray::parse()`.** Eloquent ga
zove kroz cast, `GameController::pgArray()` je tanak omotač oko njega, i svaki
sirovi `DB::table` upit mora proći kroz njega prije bilo koje PHP array
operacije. Bilo ih je pet, od kojih su dvije dijelile po svakom zarezu — a
**3.522 vrijednosti sadrže zarez** (2.715 `developers`, 454 `platforms`, 353
`tags`; `genres` nijedna). `{"Cygames, Inc."}` je bio dva studija. Uz to, 120
imena studija sadrži navodnik, a `str_getcsv` escape poštuje ali ne skida — zato
`parse()` na kraju radi i unescape. **Ne piši šesti.**

Filtriraju se s `@> ARRAY[?]::text[]`, što odgovaraju GIN indeksi
`games_genres_gin` / `games_platforms_gin` / `games_tags_gin`. `developers`
**nema** GIN i ne treba mu ga: nijedan upit u `pg_stat_statements` ne filtrira
po toj koloni.

**Indeksi za sortiranje kataloga** (`games_hub_rating`, `games_hub_popularity`,
`games_hub_released`) postoje jer vodeći `ORDER BY` u `GameController::index` je
izraz koji demotira izdanja, pa bez njih nijedno sortiranje nije indeksabilno —
mjereno 295 ms i 141.287 buffera za 24 reda, s indeksom 0,36 ms i 78. **Izraz u
migraciji mora ostati znak po znak isti kao u kontroleru**; Postgres izraz-indekse
uparuje strukturno i onaj koji se razlikuje za jedan cast je onaj koji neće biti
korišten.

---

## Korisnici i pristup

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `users` | 55 | `username`, `email`, `display_name`, `xp`, `rank_id`, `bounty_balance`, `forum_reputation`, `gamertags`, `pc_specs`, `settings`, `profile_visibility`, `dna_score`, `daily_streak`, `last_daily_claim`, `discord_id`, `battlenet_id`, `battletag`, `author_slug`, `auto_add_played_games`, `is_banned`/`banned_until`/`ban_reason` |
| `personal_access_tokens` | 4 | Sanctum. `expires_at` (7 dana), prunanje zakazano od 29.08. |
| `connected_accounts` | 5 | `provider`, `provider_user_id`, `access_token`, `sync_status`, `sync_error`, `last_synced_at`, `visibility` |
| `user_integrations` | 0 | OAuth tokeni izdvojeni iz `users` (08.08.2026) |
| `friendships` | 4 | **`sender_id`, `receiver_id`**, `status` |
| `user_recognitions` | 0 | **`giver_id`, `receiver_id`, `type`** — nema `message` kolone |
| `user_customizations` | 3 | **`customization_id`, `is_equipped`, `acquired_via`** |
| `reputation_snapshots` | 498 | `period` (`YYYY-MM` ili `YYYY-Wnn`), `reputation`, `xp`, `contribution_points` |
| `roles` / `permissions` / `role_has_permissions` / `model_has_roles` / `model_has_permissions` | 5 / 6 / 18 / 7 / 0 | Spatie. `users.role` je legacy kolona koja se **i dalje piše** pri registraciji i čita u `AdminAlert` — dvostruki autoritet |
| `password_reset_tokens` | 0 | |
| `mail_suppressions` | 0 | |
| `notifications` | 244 | `data` je **jsonb**; presenter čita `type`, `title`, `message`, `link`, `icon_path` |

## Sadržaj

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `articles` | 633 | `title`, `slug`, `status`, `published_at`, `category_id`, `author_id`, `game_id`, `review_score`, `review_data`, `featured_image_url`/`_alt`/`_width`/`_height`, `featured_video_url`, `is_featured_in_hero`, `reading_time`, `views`, `language`, `deleted_at` |
| `categories` | 31 | `parent_id`, `type` (news/reviews/tech/forum), `visibility`, `rules` |
| `guides` | 4 | `status`, `published_at`, `difficulty`, `game_id`, `steps`, `views` — **nema** `category_id` ni `upvotes` |
| `guide_votes` | 0 | **`is_helpful`** (bool), ne upvote/downvote |
| `videos` | 0 | **`youtube_url`**, ne `embed_url` |
| `media` | 1.175 | `path`, `webp_path`, `width`, `height`, `collection`, `uploaded_by` — **nije morphable** |
| `content_versions` | 65 | Snapshot pri svakoj izmjeni naslova/sadržaja. Bez capa i bez prunanja |
| `comments` | 21 | Morph (`commentable_type/_id`), `status` (uklj. `spam`/`rejected`), `parent_id`, `score`, `xp_awarded_at` — **nema** `is_deleted` |
| `comment_likes` | 3 | `type` |
| `tags` / `taggables` | 2 / 6 | |
| `page_seo` | 42 | Po putanji. Kategorije pišu ovdje, ne u vlastite kolone |
| `seo_metas` | 0 | Morph, neiskorišteno |
| `redirects` | 21 | `hits`, `note` |
| `broken_links` | 62 | Puni `seo:scan-links` (nedjeljom) |
| `faq_items` | 0 | Morph |
| `ad_campaigns` | 2 | `view_count`/`click_count` puni **samo** `FlushViewCounters` (GETDEL) |
| `newsletter_subscribers` | 7 | **`source`** (`form` = prijavio se kroz formu, `account` = registrovan korisnik, `test`), `is_active`, `email_verified_at`, `verification_token`, **`unsubscribe_token`** |
| `mail_suppressions` | 0 | **Jedino mjesto koje smije reći ne.** `email` (unique), `reason` (`unsubscribed`/`bounced`/`complained`), `source`. Svako slanje prolazi kroz `MailSuppression::filter()`. |
| `site_settings` | 42 | Ključ/vrijednost |

### Newsletter: red u tabeli nije pristanak

Launch mail ide **registrovanim korisnicima**, koji se nikad nisu prijavili na
newsletter. Svaki primalac ipak mora imati red u `newsletter_subscribers`, jer
taj red nosi `unsubscribe_token` — bez tokena jedina odjava koju možemo ponuditi
je link na podešavanja, što nije odjava (RFC 8058, Gmail/Yahoo od 02/2024).

Zato `source` razdvaja dvoje: `form` je neko ko je tražio, `account` je neko kome
smijemo pisati jer ima nalog. Bez te kolone bi broj pretplatnika u adminu skočio
za veličinu članstva i prestao išta značiti. `forAddress()` nikad ne prepisuje
postojeći `source`.

Publiku računa `NewsletterAudience`, šalje `newsletter:launch` (bez `--force`
samo ispiše kome bi išlo).

## Forum

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `threads` | 7 | `category_id` → **`categories`** (ne `forum_categories`), `author_id`, `game_id`, `is_pinned`, `pinned_until`, `is_locked`, **`view_count`**, `deleted_at` |
| `posts` | 0 | `thread_id`, `author_id`, `is_solution`, `solution_rewarded_at`, `edited_at`, `deleted_at` — **nema** `upvotes` ni `is_deleted` |
| `post_reactions` | 0 | `reaction` |
| `thread_upvotes` / `thread_watchers` / `thread_bookmarks` / `thread_reads` | 1 / 0 / 0 / 3 | |
| `polls` / `poll_options` / `poll_votes` | 0 / 0 / 0 | |

## Igre

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `games` | ~333.000 | `slug`, `name`, `released`, `release_precision`, `rating`, `cover_url`, `description`, TEXT[] (`genres`, `platforms`, `tags`, `developers`, `publishers`), json (`screenshots`, `videos`, `artworks`, `box_art`, `alt_titles`, `age_ratings`, `critic_scores`, `attributes`, `time_to_beat`, `game_modes`, `languages`, `similar_games`, `engines`), `series_key`/`series_name`, `match_key`, `link_name`, `popularity`, `views`, `is_editorial`, `locked_fields` |
| `game_tombstones` | 60.981 | Obrisani slugovi → `GameController::show` vraća **410** |
| `game_external_ids` | 520.249 | `provider` (`igdb`, `steam`, …), `external_id` |
| `game_links` | 566.915 | `kind`, `service`, `url` |
| `game_store_links` | 46.604 | `store`, `store_id`, `payload`, `rejected_reason` |
| `game_relations` | 85.368 | `relation`, `other_game_id`, `other_igdb_id`, `other_name` |
| `game_series` | 9.611 | `series_key`, `games_count`, `described_count` |
| `studios` | 57.630 | `igdb_id`, `parent_id` (**indeksiran od 29.08.**), `kind`, `status`, `became_studio_id`, `games_count`/`developed_count`/`published_count`/`ported_count`/`supported_count`, `indexable` |
| `game_studio` | 285.850 | Pivot s `role` |
| `game_match_decisions` | 0 | Ručne presude o spajanju |
| `game_ratings` | — | `game_slug` (**čitanja idu po slugu, ne po `game_id`**), `rating` 1–5, `is_draft` |

## Profil, biblioteka, kronika

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `user_games` | 679 | `status`, `is_favorite`, `hours_played`, `playtime_minutes`, `playtime_source`, `device_playtime`, `sources`, `last_played_at`, `notify_on_release`, `showcase_order`, `from_backlog` |
| `game_lists` | 7 | `is_public`, `is_draft`, `list_type`, `category`, `tags`, `allow_comments`, `has_spoilers` |
| `game_list_items` / `_likes` / `_comments` | 13 / 1 / 1 | `position`, `note`, `score`, `tier` |
| `collection_goals` | 0 | |
| `play_sessions` | 1 | `played_on`, `minutes`, `progress_label`/`_percent`, `mood`, `companions`, `is_private` |
| `session_suggestions` | 1 | Prijedlozi iz Steam playtime delte |
| `gaming_moments` | 0 | |
| `player_signals` | 10 | `type` (`presence`, `search`), `weight`, `day` — bez prunanja |
| `user_chronicles` | 54 | `taste`, `game_affinities`, `negative`, `peer_ids`, `built_at` |
| `presences` | 1 | `game_slug`, `source`, `is_active`, `started_at` |
| `trophy_case_slots` | 0 | |
| `steam_achievements` | 10.656 | |
| `user_wow_characters` | 0 | |
| `wow_analyses` / `wow_analysis_history` | 316 / 332 | |

## Gejmifikacija

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `ranks` | 20 | `min_xp` |
| `achievements` / `user_achievements` | 67 / 177 | `criteria_type`, `criteria_value`, `is_hidden`. **Nema unique na (user_id, achievement_id)** — dodjela je check-then-insert |
| `quests` / `quest_progress` | 42 / 71 | **`name`, `criteria_type`, `criteria_value`** — ne `title`/`goal_*`; nema `claimed_at` |
| `seasons` | 3 | `xp_multiplier`, `bounty_multiplier` |
| `bounty_transactions` | 417 | **`reference`** je ključ idempotencije |
| `reward_items` / `reward_redemptions` | 6 / 0 | |
| `customizations` | 31 | `type`, `required_tier`, `rarity` |

## Poruke

| Tabela | Redova | Ključne kolone |
|---|---:|---|
| `conversations` | 3 | `type`, `last_message_at` |
| `conversation_participants` | 6 | `last_read_at` — **odavde se izvodi „nepročitano"** |
| `messages` | 39 | **`receiver_id`, `body`, `is_read`, `deleted_by_sender`/`_receiver`, `conversation_id`** |
| `message_reactions` | 0 | |

## Trgovina i kampanje

| Tabela | Redova | Napomena |
|---|---:|---|
| `products` / `orders` / `order_items` | 0 / 0 / 0 | Sve cijene `decimal`. `orders.status` malim slovima |
| `support_tiers` / `user_supports` | 3 / 0 | `paypal_plan_id`; `user_supports.payment_id` unique (replay zaštita) |
| `giveaways` | 2 | **`reminder_sent_at`** (od 29.08.) — jedna najava po giveawayu |
| `giveaway_entries` / `_tasks` / `_task_completions` / `_prize_tiers` / `_tier_winners` | 21 / 7 / 117 / 0 / 0 | `entries` čuva `ip_address`, `user_agent` |
| `last_disc_signatures` / `last_disc_votes` | 0 / 3 | Potpis nosi **vlastiti** e-mail; anonimizuje se pri brisanju naloga (od 29.08.) |

## GTA 6 i ostalo

`gta6_characters` 12 · `gta6_vehicles` 121 · `gta6_weapons` 36 · `gta_locations` 1.058 (`categories` je **json**, kveri se `whereJsonContains`) · `discord_subscriptions` 0.

## Infrastruktura

`migrations` 272 · `failed_jobs` 5 (prunanje zakazano) · `jobs` / `job_batches` / `cache` / `cache_locks` / `sessions` — **prazne, Redis radi taj posao**; ostaju iz Laravel skeleta.

`queue_monitors` 11.351 — plugin za nadzor poslova, red po poslu. Config traži 7 dana retencije, ali to niko nije sprovodio do 29.08. kad je zakazan `model:prune`.

---

## Mrtve tabele

| Tabela | Redova | Zašto je mrtva |
|---|---:|---|
| `forum_categories` | 0 | `threads.category_id` je prebačen na `categories` (10.01.2026). Nema modela; Filament resurs koristi `Category` |
| `subscription_plans` | 0 | Nula referenci u kodu; `PayPalPlanSeeder` piše u `support_tiers` |
| `queue_monitor_failure_groups` | 2 | Nijedan pisač u `app/` |

Obrisano 29.08.2026: **`igdb_raw`** (8,16M redova, 3,8 GB) i **`igdb_game_keys`** (373k) — staging jednokratnog IGDB uvoza. Arhiva: `/var/backups/igdb-archive/igdb-staging-2026-08-29.dump`.

---

## Zamke koje su već koštale

1. **`whereNotIn` ne propušta `NULL`.** `NULL NOT IN (…)` je `NULL`, ne `true` — red s praznim statusom ispada iz upita zauvijek. Ugrizlo je `platforms:resync` (popravljeno 29.08.).
2. **`game_ratings` se čita po `game_slug`**, iako `game_id` postoji i popunjen je. Preimenovanje sluga siječe ocjene sa stranice.
3. **Parcijalni indeks i upit moraju imati identičan izraz.** `games_indexable_slug_idx` nosi isti predikat kao `Game::scopeIndexable()`; razlika od jednog razmaka tiho isključuje indeks.
4. **`user_achievements` nema unique** — dvije istovremene dodjele mogu proći provjeru i upisati duplikat.
5. **`json` vs `jsonb`:** `notifications.data` je prebačen u jsonb; `gta_locations.categories` je i dalje `json` i kveri se po ključu.
