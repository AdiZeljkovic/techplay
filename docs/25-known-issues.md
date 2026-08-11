# 25 — Known Issues

## Arhitekturni problemi

### 1. Token u localStorage
**Problem:** Auth token spreman u localStorage je podložan XSS napadima.
**Gdje:** `context/AuthContext.tsx`
**Rizik:** Visok ako postoji XSS ranjivost
**Status:** Zahtijeva pažnju pri svim user input promjenama

### 2. Article model za dva content tipa
**Problem:** News i Tech/Hardware koriste isti `Article` model i tabelu, razlikuju se samo po kategoriji. Može biti zbunjujuće.
**Gdje:** `app/Models/Article.php`, `articles` tabela
**Rizik:** Greške pri upitu koji filtrira po tipu ako kategorija nije pažljivo postavljena

### 3. PostgreSQL TEXT[] arrays
**Problem:** `game.genre_names`, `platform_names`, `tag_names` dolaze iz PostgreSQL kao raw string `{Action,"Role-Playing"}`. Bez `pgArray()` helpera → greška.
**Gdje:** `GameController`, `Game` model
**Rizik:** Srednji — lako za zaboraviti pri novim game upitima

### 4. Images unoptimized
**Problem:** `images: { unoptimized: true }` u `next.config.ts` — sve slike servira se nekomprimovano i u originalnoj veličini.
**Gdje:** `frontend/next.config.ts`
**Rizik:** Performansni problem, posebno za korisnike na sporim vezama. Game cover slike mogu biti MB.
**Razlog:** Sprečava disk exhaustion od game image library. Treba CDN rješenje.

### 5. Duplicate API client
**Problem:** `lib/api.ts` i `lib/axios.ts` — dva različita pristupa API komunikaciji.
**Gdje:** `frontend/lib/`
**Rizik:** Nizak, ali može uzrokovati nedosljednosti u error handling-u

### 6. Two source of truth za view count
**Problem:** View count je i u Redis (real-time) i u `articles.views` koloni (flushovano periodicno).
**Gdje:** `TrackingController`, `FlushViewCounters` job
**Rizik:** Vremenski nesklad između prikaza

---

## Nedovršene funkcije

### 7. Notifikacije — parcijalna implementacija
**Problem:** Backend notifikacije postoje, ali frontend implementacija UNKNOWN koliko je kompletna.
**Gdje:** `NotificationController`, `useRealTimeNotifications`
**Status:** PARTIAL

### 8. Reward Store — redeem flow
**Problem:** `RewardItem` i `RewardRedemption` modeli postoje, API endpoint `GET /rewards` postoji, ali redeem flow na frontendu UNKNOWN.
**Status:** PARTIAL ili UNKNOWN

### 9. Newsletter slanje
**Problem:** Subscribe/verify flow postoji, ali mehanizam za slanje newslettera (bulk email) UNKNOWN.
**Gdje:** `NewsletterSubscriberResource` u Filament, mail config
**Status:** PARTIAL

### 11. Comment edit
**Problem:** Nema endpoint za editovanje vlastitog komentara.
**Gdje:** `CommentController`
**Status:** MISSING

---

## Potencijalni bugovi

### 12. `vendor/bin/pint` u gitignore
**Problem:** Ako pint nije instaliran globalno, code formatting se razlikuje između developera.
**Gdje:** `backend/`

### 13. RAWG API single point of failure
**Problem:** Game stranice oslanjaju se na RAWG za screenshote. Ako RAWG API istekne ili ima downtime, screenshoti nestaju.
**Gdje:** `GameController::rawgScreenshots/movies`

### 14. Forum sort/pagination
**Problem:** `posts_count` je denormalizovana kolona na `threads` tabeli. Mora se ručno ažurirati pri kreiranju/brisanju posta. Observer to vjerovatno radi, ali može biti race condition u high-traffic scenariju.

### 15. Wishlist release check
**Problem:** `CheckWishlistReleases` — nije jasno koji vremenski okvir se provjerava (sutra? sljedeća sedmica?). Korisnik može dobiti notification prerano ili nikad.

---

## Nejasne funkcije

### 16. `ContentVersion` model
**Problem:** `content_versions` tabela i `ArticleVersionObserver` postoje, ali gdje se ovo prikazuje i kako se koristi — UNKNOWN.

### 17. `EditorialMessage` chat
**Problem:** Interni editorial chat sistem (EditorialChannel, EditorialMessage) nije vidljiv na frontendu. Da li je samo za admina? Da li se koristi?

### 18. `BrokenLink` model
**Problem:** `ScanBrokenLinks` komanda postoji ali gdje se rezultati prikazuju? Admin panel? Email report?

### 19. `FaqItem` model
**Problem:** `FaqItem` model postoji u Models listi ali nema vidljivog kontrollera ni admin resursa. Dead code?

### 20. `AdCampaign` IAB polja
**Problem:** IAB kategorije u ad campaigns — da li se koriste za targeting? Detalji UNKNOWN.

### 21. `AltTextService`
**Problem:** AI-generated alt text za slike. Da li se automatski primjenjuje? Gdje?

---

## Dupliran ili potencijalno zastario kod

### 22. IGDB legacy
**Problem:** `CrawlIgdbGames`, `CrawlIgdbStatus` komande i `update_games_table_for_igdb.php` migracija. IGDB je zamijenjen MobyGames. Ove komande su vjerovatno obsolete.

### 23. `temp_chat_features.blade.php`
**Problem:** Prazan temp fajl u `backend/` rootu. Treba brisati.

### 24. `check_tiers.php` i `list-gemini-models.php`
**Problem:** Loose PHP skripte u `backend/` rootu. Debug/utility skripte koje ne bi trebale biti u produkciji.

### 25. `temp_html.txt`
**Problem:** 36KB temp fajl u project rootu. Nije u gitu (pretpostavljam) ali treba provjeriti.
