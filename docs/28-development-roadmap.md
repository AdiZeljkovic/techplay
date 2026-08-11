# 28 — Development Roadmap

## Phase 1: Stabilizacija (Odmah)

**Cilj:** Popraviti kritične propuste, dokumentovati, osigurati sigurnost.

### Šta uraditi

1. **Provjeri i dokumentuj cron schedule** (`Kernel.php`)
   - Zašto: PublishScheduledArticles mora raditi
   - Prioritet: Kritičan
   
2. **Obriši debug fajlove iz backend roota**
   - `check_tiers.php`, `list-gemini-models.php`, `temp_chat_features.blade.php`
   - Zašto: Security hygiene
   - Prioritet: Visok

3. **Queue worker monitoring**
   - Dodati Supervisor config za auto-restart
   - Zašto: Background jobs moraju raditi

4. **Verificiraj CORS konfiguraciju**
   - Samo `techplay.gg` i `beta.techplay.gg` smiju biti dozvoljeni origins

5. **Rotirati DISCORD_BOT_SECRET**
   - Zašto: Sigurnost, posebno ako je secret ikad bio u kodu

6. **Dokumentovati sve .env varijable po okruženju**
   - Usporediti `.env.example` s produkcijiskim potrebama

---

## Phase 2: Core platform (1-4 sedmice)

**Cilj:** Poboljšati ključne funkcionalnosti koje donose SEO i korisnički engagement.

### Game Database SEO
1. **Game hub stranice** — ISR stranice za žanrove i platforme (`/games/genre/rpg`)
   - Zašto: Veliki SEO potencijal, search volume za "best RPG games"
   - Implementacija: GameController::hub endpoint postoji, treba frontend stranicu
   
2. **Monthly release calendar** — ISR stranice (`/calendar/2026/july`)
   - Zašto: High search volume za "games releasing in July 2026"
   
3. **Local screenshoti** — importovati screenshote lokalno umjesto RAWG proxy
   - Zašto: Ukloniti RAWG single point of failure

### Profil poboljšanja
4. **Comment edit** — `PUT /comments/{id}` endpoint
   - Zašto: Bazična korisna funkcija koja nedostaje
   
5. **Forum reply notifikacije**
   - Zašto: Retention! Korisnik se vraća kada dobije notifikaciju

### Moderacija
6. **Moderator role** — Spatie rola između user i admin
7. **Comment report button** na frontendu (API postoji)
8. **Report workflow** u admin panelu

---

## Phase 3: Community (1-2 mjeseca)

**Cilj:** Ojačati community funkcionalnosti.

### Forum poboljšanja
1. Thread notifikacije (email + in-app)
2. User ban/timeout sistem
3. Forum badge/flair system
4. Moderator queue

### Discord integracija dublja
5. Discord role sync na rank-up
6. Discord webhook za nový forum thread
7. Discord bot dashboard u admin panelu

### Newsletter
12. Bulk newsletter slanje UI u Filamentu
13. Segmentacija po interesima (gaming, tech, itd.)

---

## Phase 4: SEO growth (2-3 mjeseca)

**Cilj:** Skalirati organski promet kroz content i technical SEO.

### Technical SEO
1. **Sitemap automatski rebuild** (daily cron)
2. **VideoObject JSON-LD** za video sadržaj
3. **Author pages** (SEO korisne, author bio + njihovi članci)
4. **Breadcrumbs JSON-LD** na svim stranicama
5. **Google Search Console** integracija (ne samo IndexNow)

### Content SEO
6. **Game hub stranice** (žanr/platforma landing pages)
7. **Review aggregate schema** (za igre s više reviewova)
8. **Internal linking automation** (InternalLinkService postoji)

### Image SEO
9. **Alt text automatizacija** (AltTextService postoji, treba integracija)
10. **CDN za slike** (Cloudflare ili Imgix) — riješava i perf problem

---

## Phase 5: Monetizacija (3-6 mjeseci)

**Cilj:** Diversifikovati prihode platforme.

### Affiliate
1. Hardware/tech review affiliate linkovi
2. Game key affiliate (G2A, Fanatical, Humble)
3. Tracking affiliate klikova (`AdCampaign` sistem može se proširiti)

### Premium membership
4. Support tier sistem postoji — poboljšati benefit-e
5. Ad-free experience za premium
6. Exclusive content za premium
7. Premium Discord role
8. Rani pristup giveawayima

### Sponsored sadržaj
9. Sponsored article/review workflow u admin
10. Transparent labelling (FTC compliance)

### Giveaway expansion
11. Partnerski giveaways s game developerima
12. Community challenge events s nagradama

---

## Prioritetna matrica

```
           VISOK IMPACT
               │
      Game     │  SEO hub
      SEO hub  │  stranice ◄── Start here
               │
LOW EFFORT ────┼──── HIGH EFFORT
               │
    Comment    │  CDN za
    edit       │  slike
               │
           NIZAK IMPACT
```

---

## Sljedeći 3 koraka (odmah)

1. Pročitati `backend/app/Console/Kernel.php` i dokumentovati cron schedule
2. Obrisati debug fajlove iz backend roota
3. Implementirati comment edit endpoint
