# 16 — Profile, XP & Achievements Map

## Korisnički profil

### Javni profil

**URL:** `techplay.gg/profile/[username]`
**API:** `GET /api/v1/users/{username}`

**Što prikazuje:**
- Avatar, cover image
- Username, displayname
- Rank badge (sa rank bojom i ikonom)
- XP bar (napredak prema sljedećem rangu)
- Kratka bio (UNKNOWN da li postoji)
- Što trenutno igra (Presence)
- Linked accounts (Steam, Discord, Battle.net)
- Steam achievements (ako povezan)
- Clan membership
- Recent activity feed
- Game kolekcija (playing, recently finished)
- Recognitions (od strane zajednice)
- Clans (ako member)

### Privatni account settings

**URL:** `techplay.gg/settings`
**API:** `PUT /user/profile`, `PUT /user/preferences`, `PUT /user/password`

**Što može korisnik editovati:**
- Avatar
- Cover image
- Display name
- Bio (UNKNOWN)
- Email (UNKNOWN)
- Lozinka
- Preference (notifikacije, itd.)
- Connected accounts (Steam, Discord link/unlink)
- Privacy postavke (UNKNOWN)

---

## XP sistem

### Kako se dodjeljuje XP

| Akcija | XP | Cooldown | Cap |
|--------|-----|---------|-----|
| Komentar na članak | ? | 60s | 100/dan |
| Čitanje članka | ? | 60s | 100/dan |
| Discord poruka | 15 XP | 60s | UNKNOWN |
| Daily streak claim | variabilno | 24h | - |
| Quest kompletizacija | po questu | jednom | - |
| Giveaway task | bonus tickets | jednom | - |
| Achievement unlock | po achievementu | jednom | - |

### Gdje je XP logika

- **Backend:** `app/Services/XpService.php` — centralni servis
- **Discord bot:** `discord/src/services/XpService.ts` — zasebna implementacija za Discord
- **Kontroleri koji pozivaju XpService:**
  - `CommentController` (komentar → XP)
  - `TrackingController` (view → XP)
  - `DiscordXpController` (Discord → XP)
  - `StreakController` (streak claim → XP)
  - `QuestController` (quest claim → XP)

### XP storage

- `users.xp` kolona — kumulativni XP
- Rank provjera pri svakom XP update (automatski rank-up)

### Abuse prevention

- 60s cooldown između dodjela istog tipa
- 100 XP/dan cap za web interakcije
- Rate limiting na API endpoints

---

## Rank sistem

**Model:** `Rank` | **Tabela:** `ranks`

| Kolona | Opis |
|--------|------|
| `name` | Naziv ranga (npr. "Rookie", "Veteran") |
| `xp_required` | Minimalni XP za ovaj rang |
| `color` | Hex boja badge-a |
| `icon` | Ikona ranga |

- Rank se automatski ažurira pri XP dodjeli
- `User.rank_id` FK na `ranks`
- Admin upravlja rangovima kroz `RankResource`
- Specifični rankovi: UNKNOWN potpuna lista

---

## Streak sistem

**Model:** `User.streak`, `User.last_streak_date`
**Servis:** `StreakService`
**API:** `GET /user/streak`, `POST /user/streak/claim`

- Korisnik claimuje dnevni bonus
- Streak se gubi ako korisnik propusti claim
- Duži streak = veća nagrada (XP bonus)
- `StreakController::show` prikazuje trenutni streak + bonus za claim

---

## Quest sistem

**Model:** `Quest`, `QuestProgress`
**Servis:** `QuestService`
**API:** `GET /quests`, `POST /quests/{id}/claim`

### Quest tipovi
- `daily` — dnevni zadaci (resetuju se svaki dan)
- `weekly` — tjedni zadaci
- `seasonal` — vezani za aktivnu sezonu

### Quest logika
- Quest ima `goal_type` i `goal_value` (npr. "write 5 comments")
- `QuestProgress` prati napredak korisnika
- Kada je `progress >= goal_value` → quest completan → korisnik može claimati nagradu
- Claim: `POST /quests/{id}/claim` → XP dodjela

---

## Season sistem

**Model:** `Season`
**API:** `GET /seasons`, `GET /seasons/active`

- Sezona ima `start_date`, `end_date`, `is_active`
- Aktivna sezona: samo jedna odjednom
- Seasonal quests vezani za aktivnu sezonu
- UNKNOWN: da li sezona resetuje XP ili samo dodaje sezonske nagrade

---

## Achievement sistem

**Model:** `Achievement`
**Servis:** `AchievementService`
**Admin:** `AchievementResource`

### Definicija achievementa
- `name`, `description`, `icon`, `xp_reward`, `trigger`
- `trigger` — tip akcije koja otključava (UNKNOWN format)

### Jak seeder
- `2026_06_20_000001_seed_gaming_achievements.php` — batch gaming achievementa
- `SyncAchievements` artisan komanda

### Achievement otključavanje
1. User izvrši akciju (komentar, login, igra)
2. `AchievementService::check()` pozvan
3. Provjera svih relevantnih achievementa
4. Ako uvjet ispunjen: pivot record kreiran, XP dodijeljen
5. `NotificationReceived` event → korisnik dobija notifikaciju
6. Prikaz na profilu

### Prikaz
- Achievement badges na javnom profilu
- UNKNOWN: da li postoji posebna achievements stranica

---

## Reputation snapshots

**Model:** `ReputationSnapshot`

- Periodični snapshot korisnikovog XP-a i ranga
- Komanda `SnapshotReputation` ga kreira
- Koristi se za praćenje rasta kroz vrijeme (Wrapped, statistike)

---

## User Recognition

**Model:** `UserRecognition`
**API:** `GET /users/{username}/recognitions`

- Korisnici mogu dati "recognition" drugom korisniku
- Tipovi recognition: UNKNOWN (vjerojatno emoji/badge kategorizovani)
- Vidljivo na javnom profilu
- Postoji `RecognitionController`

---

## Customization

**Model:** `UserCustomization`, `Customization`

- Korisnik može personalizovati profil (avatar frame, banner, badge display)
- `Customization` model definira dostupne opcije
- `UserCustomization` sprema korisnikove izbore
- Dostupno kroz admin `CustomizationResource`
- Frontend integracija detalji UNKNOWN

---

## Bounty sistem

**Model:** `BountyTransaction`
**Servis:** `BountyService`

- Zasebna valuta ili bodovi (odvojeni od XP)
- Transakcije u `bounty_transactions`
- Integracija s giveawayima ili reward storeom UNKNOWN

---

## Reward Store

**Model:** `RewardItem`, `RewardRedemption`
**API:** `GET /rewards`

- Korisnici troše XP ili Bounty za nagrade
- `RewardItem`: ime, cijena, tip, slika
- `RewardRedemption`: evidencija redempcija
- Frontend implementacija UNKNOWN

---

## Changelog 2026-07-19 — Profil redizajn "Command Center" (Faze 1-4)

Kompletan redizajn profila u 4 commita (e717f27, 69872cf, 8c75df1, 8d96adf).

### Konsolidacija progresije (odluka: jedan metal ladder)
- **Rank (XP)** je JEDINA metal progresija (Bronze -> God of Gaming, RankSeeder nepromijenjen).
- **Community Ranking -> "Community Standing"**: config/ranking.php tieri preimenovani u ne-metal nivoe: Rookie / Contributor / Regular / Veteran / Elite / Legend (divisions III/II/I ostaju). Drivano reputacijom kao i prije.
- Support tieri su vec bili ne-metal (TechPlay Fan / Super Fan / TechPlay Legend); UI labela "Loyalty" -> "Supporter & Cosmetics".

### Backend (AuthController@show + servisi)
- Payload za posjetioce keiran 60s (`profile.show.v1.{username}`); vlasnik uvijek svjez; viewer-specific `given_by_me` flagovi se apliciraju POSLIJE kesa.
- Percentile keiran 1h po rep vrijednosti; achievement katalog 1h; platformsAndGenres = SQL unnest agregacija (pgsql) s PHP fallbackom; gamerDna reuse-a vec izracunat breakdown.
- **Bug fixevi**: `achievement_user` -> `user_achievements` (Wrapped + friend feed su bili tiho polomljeni); ProfileCompare `avatar` -> `avatar_url` i `is_published` -> `status='published'`; `penndingRequests` typo.
- **Ekonomija**: season xp/bounty multiplikatori se SADA stvarno primjenjuju (Season::multipliers(), kes 5 min); forum reply i quest XP idu kroz XpService (cap + bounty mirror + rank check); PostObserver achievemente dodjeljuje kroz AchievementService.

### Frontend layout
- **Hero**: avatar s SVG level ringom (XP progres), jedna rank linija, live presence badge, 2 primarne akcije + overflow meni, 4 klikabilna stat chipa (Games/Achievements/Reputation+Top%/Lists). `ProfileStatStrip` i `ReputationPowerCard` OBRISANI.
- **Tabovi 8 -> 6**: Overview, Collection, Lists, Achievements, Activity, Stats (+ Rewards samo vlasnik). `?tab=forum` legacy redirect u Activity (watched/bookmarked su tamo, own-only).
- **Overview**: ShowcaseStrip (cover art centerpiece), ProfileChecklist (own onboarding, mijenja prazne kartice), empty sekcije se NE renderuju posjetiocima. Sidebar = 3 kartice: CommunityStanding (spaja 3 stare), DailyHub (bounty + season + streak + questovi), Supporter & Cosmetics.
- **Tema**: svi hardkodirani tp-accent/orange/rgba(252,65,0) u profile komponentama -> var(--accent); equipped tema sada boji cijelu stranicu. QuestPanel/DailyStreakWidget/SteamAchievements na tokenima + axios/SWR.

### V2 dodatak (isti dan)
- **Pin to Profile**: `user_games.showcase_order` (max 4), `POST /collection/games/{slug}/showcase` toggle, `showcase` u profil payloadu; ShowcaseStrip prioritet pinovano > playing > bucket coveri; Pin dugme u CollectionGrid hover akcijama.
- **OG share slika**: `/og/profile?username=` nadograđena (ruta je POSTOJALA ali metadata je pokazivala na nju dok je stara verzija fetchala kroz javni CF URL) — sada koristi NEXT_PRIVATE_API_URL, prikazuje level/rank/stats/Top% + do 3 showcase covera, cache 1h.
- **Ekonomija razdvojena**: XP→Bounty 1:1 mirror UKINUT (XpService). Bounty izvori sada: daily streak, questovi, game completion +50, article/review publish +30/75, NOVO: prva ocjena igre s reviewom +15, prihvaćeno rješenje na forumu +25. XP = čisti progres.

### V3 (2026-07-19) — Aktivacija, discovery, kompeticija, retention
- **V3.0**: CSP wss za Reverb; hydration fix (toLocaleString -> en-US); connected_accounts + clan u profil payloadu.
- **V3.1 Aktivacija**: WelcomeOnboarding wizard (prazan vlastiti profil ili ?welcome=1) - Connect Steam ili pick-5-games; checklist stavka #1 = Connect Steam; Steam CTA na praznoj kolekciji.
- **V3.2 Discovery/social**: GET /search/users + korisnici u header pretrazi; Clan kartica na profilu; Profile Wall (Comment type profile -> User, notifikacija vlasniku); header FORUM -> Community dropdown (Forum/Leaderboard/Clans/Friends).
- **V3.3 Kompeticija**: sedmicni leaderboard (period=week, delta od ponedjeljka; profile:snapshot-reputation --weekly, pon 00:10; snapshoti sada nose i xp); sezonski questovi (season_id filter u QuestService/QuestController, SeasonQuestSeeder); season:conclude (daily 00:20) dodjeljuje Champion badge svima koji zavrse SVE sezonske questove pa gasi sezonu.
- **V3.4 Retention**: profile:send-weekly-digest (petak 16:00; streak + clanci za tvoje igre + wishlist izlasci + sezona; opt-out settings.notifications.weekly_digest=false; preskace prazne digest-e); PWA manifest osvjezen (brend boje + My Profile shortcut); rucni Now Playing picker u Daily Hub (POST /presence).
- **V3.5 Dubina**: kozmetika katalog +14 stavki (teme/frame/badge/post color); achievements +25 (kolekcija/completion/streak/connections/forum/rep dubina); CSV import kolekcije (POST /collection/import, GameMatchingService::matchByName, Import dugme u Collection tabu — radi s Backloggd/HLTB exportima).
- NIJE radjeno (svjesno): web push (VAPID infra), Compare redizajn — sljedeca iteracija.

### Aktivacijski sprint (2026-07-19, popodne) - mjerenje, kampanja, polish
- **Funnel analytics**: `FunnelAnalytics` servis (Redis hash `analytics:funnel:{Y-m-d}`, 90d retencija); `POST /track/event` (auth+throttle, whitelist eventi); klijentski `lib/track.ts` (first-party + GA4 gtag) - eventi: wizard_shown/steam_click/xbox_submitted/pick_started/pick_done/skipped, checklist_steam_click, d1_return (AuthContext, single-shot 24-48h nakon registracije); server-side steam_connected/xbox_connected u ConnectedAccountController. Izvjestaj: `php artisan analytics:funnel --days=14` (signups, aktivacija <24h iz DB, wizard eventi, connecti, D1).
- **Founder kampanja**: `campaign:founders` (scheduled daily 10:00, --limit=50 --min-games=5 --dry-run) - award-only "Founder" badge prvim korisnicima s 5+ igara (redoslijed po created_at 5. igre), DB notifikacija dobitnicima. `Customization::isAwardOnly()` (badge + cost 0 + bez tiera): skriven iz kataloga za ne-vlasnike i NE moze se kupiti - zatvorena rupa gdje je Season Champion badge bio besplatno acquirable svima.
- **Motion polish**: `useCountUp` hook (rAF ease-out, respektuje prefers-reduced-motion) na hero stat chipovima + Gamerscore; level ring i XP bar pune se od nule na mount (reduced-motion preskace); `tp-fade-up`/`tp-d1..d6` stagger (globals.css) na hero elementima i Showcase karticama.
- **Mobile pass**: ring 116px + manji LVL badge ispod 768px (matchMedia); action red se wrapa; Daily Hub se na mobilnom renderuje odmah nakon Showcasea u glavnoj koloni (sidebar kopija hidden lg:block; SWR dedupe pa je dupli mount jeftin).
