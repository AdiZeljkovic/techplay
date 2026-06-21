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
