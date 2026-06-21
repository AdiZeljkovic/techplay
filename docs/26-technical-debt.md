# 26 — Technical Debt

## Critical

### C1 — Token u localStorage
**Problem:** Auth token u localStorage podložan XSS-u.
**Gdje:** `frontend/context/AuthContext.tsx`
**Zašto problem:** Napadač koji uspije injektovati JS kod može ukrasti token i preuzeti account.
**Prijedlog:** Migrirati na HttpOnly cookie auth uz SameSite=Strict.
**Može odmah:** Ne — zahtijeva refaktor auth sistema.

### C2 — Nedefinirani Cron schedule
**Problem:** Nije jasno koji artisan commands su schedulovani i na koji interval.
**Gdje:** `backend/app/Console/Kernel.php` (nije pregledan)
**Zašto problem:** Ako `PublishScheduledArticles` nije schedulovan, scheduled articles nikad neće biti published. Ako `FlushViewCounters` nije schedulovan, Redis memory raste.
**Prijedlog:** Dokumentovati i verificirati cron schedule.
**Može odmah:** Da — samo čitanje Kernel.php.

### C3 — Queue worker nije monitored
**Problem:** Nema vidljive konfiguracije za auto-restart queue workera (Supervisor/systemd).
**Gdje:** Server konfiguracija
**Zašto problem:** Ako queue worker padne, svi background jobs staju. Nema alarma.
**Prijedlog:** Supervisor config za queue:work s autorestart.
**Može odmah:** Da — server konfiguracija.

---

## High

### H1 — Unoptimized images (perf)
**Problem:** `images: { unoptimized: true }` — sve slike nekomprimovane.
**Gdje:** `frontend/next.config.ts`
**Zašto problem:** Performans problem za slike igara (cover art, screenshoti mogu biti MB).
**Prijedlog:** CDN s image transformation (Cloudflare, Imgix, S3+CloudFront).
**Može odmah:** Ne — zahtijeva CDN setup.

### H2 — Duplirani API client
**Problem:** `lib/api.ts` i `lib/axios.ts` — dva načina HTTP poziva.
**Gdje:** `frontend/lib/`
**Zašto problem:** Nedosljednosti u auth injection, error handling.
**Prijedlog:** Konsolidovati na jedan (axios instancu) s interceptorima.
**Može odmah:** Da — refaktor.

### H3 — RAWG single point of failure
**Problem:** Game stranice oslanjaju se na RAWG za screenshote.
**Gdje:** `GameController::rawgScreenshots/movies/suggested`
**Zašto problem:** RAWG downtime ili expired key = stranice bez slika.
**Prijedlog:** Importovati screenshote lokalno (scheduled job).
**Može odmah:** Ne — zahtijeva novi import job i storage.

### H4 — IGDB legacy code
**Problem:** Stari IGDB crawlers i migracije.
**Gdje:** `app/Console/Commands/CrawlIgdbGames.php`, `CrawlIgdbStatus.php`
**Prijedlog:** Označiti kao deprecated ili obrisati.
**Može odmah:** Da.

### H5 — Discord bot secret bez rotacije
**Problem:** `DISCORD_BOT_SECRET` nije vremenski ograničen.
**Gdje:** Discord bot i backend .env
**Prijedlog:** Implementirati token rotaciju ili HMAC signature uz timestamp.
**Može odmah:** Djelimično (rotacija ručno).

---

## Medium

### M1 — Article i Tech/Hardware dijele model
**Problem:** Isti `Article` model za news i tech. Razlikuju se samo po `category_id`.
**Gdje:** `app/Models/Article.php`, `articles` tabela
**Prijedlog:** Ili dodati `type` enum kolonu ili kreirati zasebnu relaciju.
**Može odmah:** Da — migracija + refaktor.

### M2 — Nema comment edit
**Problem:** Korisnik ne može editovati vlastiti komentar.
**Gdje:** `CommentController`
**Prijedlog:** Dodati `PUT /comments/{id}` s owner provjera.
**Može odmah:** Da.

### M3 — Forum notifikacije
**Problem:** Nema in-app/email notifikacija kada neko odgovori na tvoj forum post.
**Gdje:** `ForumController`, notifikacije sistem
**Prijedlog:** `ForumPostObserver` → send notification to thread author.
**Može odmah:** Da.

### M4 — Moderator role
**Problem:** Nema jasno definisane moderator role između user i admin.
**Gdje:** Filament resources, route auth
**Prijedlog:** Definisati `moderator` rolu s Spatie permissions.
**Može odmah:** Da.

### M5 — Sitemap automatski rebuild
**Problem:** `GenerateSitemap` komanda postoji ali nije jasno da li je schedulovana.
**Gdje:** `Console/Commands/GenerateSitemap.php`, `Kernel.php`
**Prijedlog:** Schedulovati daily.
**Može odmah:** Da.

### M6 — ContentVersion prikazivanje
**Problem:** `ContentVersion` model i observer postoje ali nema UI za pregled historije.
**Gdje:** Filament, frontend
**Prijedlog:** Dodati history tab u news/review editoru u Filament-u.
**Može odmah:** Djelimično.

### M7 — Loose PHP skripte u backend rootu
**Problem:** `check_tiers.php`, `list-gemini-models.php` su debug skripte dostupne u rootu.
**Gdje:** `backend/`
**Prijedlog:** Obrisati ili premjestiti u `scripts/` folder van web roota.
**Može odmah:** Da.

---

## Low

### L1 — FaqItem model bez kontrolera
**Problem:** `FaqItem` model postoji bez vidljivog kontrolera ili admin resursa.
**Prijedlog:** Ili implementirati FAQ sekciju ili obrisati model.

### L2 — `temp_html.txt` u rootu
**Problem:** 36KB temp fajl.
**Prijedlog:** Obrisati.

### L3 — `temp_chat_features.blade.php`
**Problem:** Prazan Blade fajl u backend rootu.
**Prijedlog:** Obrisati.

### L4 — BrokenLink rezultati bez UI
**Problem:** `ScanBrokenLinks` komanda postoji ali UNKNOWN gdje se rezultati prikazuju.
**Prijedlog:** Dodati admin prikaz broken linkova ili email report.

### L5 — AltTextService integracija
**Problem:** AI-generated alt text servis postoji ali nije jasno gdje se koristi.
**Prijedlog:** Implementirati automatsko generisanje alt teksta pri upload-u slike.

### L6 — Hreflang bez implementacije
**Problem:** `HreflangService` postoji ali platforma je samo na jednom jeziku.
**Prijedlog:** Ostaviti za kasniju internacionalizaciju.

### L7 — GroqService svrha nejasna
**Problem:** Groq servis postoji ali nije jasno gdje se konkretno koristi.
**Prijedlog:** Dokumentovati ili integrirati na jasniji način.
