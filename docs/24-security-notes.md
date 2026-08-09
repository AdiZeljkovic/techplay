# 24 — Security Notes

## Auth rizici

### Token u localStorage
- **Problem:** Sanctum Bearer token spreman u `localStorage` je podložan XSS napadima
- **Rizik:** Ako XSS ranjivost postoji (npr. u user-generated content koji nije sanitizovan), napadač može ukrasti token
- **Mitigation:** `SanitizationService` postoji i treba biti korišten na SVIM user inputima
- **Preporuka:** Razmotriti migration na HttpOnly cookie za token storage

### Sanctum konfiguracija
- `SANCTUM_STATEFUL_DOMAINS` mora biti precizno definisan u produkciji
- Ne smije dozvoljavati wildcardove koji bi omogućili cross-origin auth

### Token rok trajanja
- UNKNOWN da li tokeni imaju expiry
- Tokeni bez expirya znače da ukradeni token radi zauvijek
- **Preporuka:** Dodati token expiry + refresh mehanizam (endpoint postoji: `POST /auth/refresh`)

---

## API rizici

### Discord Bot Secret
- `DISCORD_BOT_SECRET` autentifikuje Discord bota prema backendu
- Nema Sanctum provjere — samo shared secret
- Bot endpointi (`/discord/*`) mogu manipulisati XP-om za bilo kojeg korisnika
- **Rizik:** Ako secret procuri, napadač može lako manipulisati XP leaderboardom
- **Preporuka:** Rotirati secret redovno, koristiti IP whitelist za bot server

### Javni endpointi bez auth
- Mnogi read endpointi su javni — ovo je normalno
- `GET /games` s throttle:60,1 — može biti scrapano 60 puta u minuti
- **Preporuka:** Razmotriti `throttle:20,1` za game listing

### Rate limiting
- Implementiran: ✅
- Public: 60/min, Discord bot: 300/min
- Komentari: 30/min
- Contact form: 3/10min
- Newsletter verify: 5/60min
- Reports: 5/1min
- **DOBRO:** Rate limiting je implementiran na kritičnim točkama

---

## Input validacija

### XSS zaštita
- `SanitizationService` postoji — mora biti korišten za sve user inpute:
  - Komentare
  - Forum postove
  - Profile bio
  - Thread naslove
- **Provjeri:** Da li SanitizationService koristi strip_tags ili HTML Purifier?

### SQL injection
- Eloquent ORM s parameterized queries — zaštita implementirana
- PostgreSQL array queries (`@> ARRAY[?]::text[]`) — provjeri da su parameterizovani
- **Rizik:** Raw query u `GameController` za TEXT[] — potrebno verificirati

### CORS
- Laravel CORS konfiguracija (`config/cors.php`)
- **Provjeri:** Koji origins su dozvoljeni u produkciji? Ne smije biti wildcard `*`

---

## Admin rizici

### Filament pristup
- Ko ima admin pristup? Definisano u Filament panel provider-u
- Vjerovatno provjerava `is_admin` flag ili Spatie rolu
- **Provjeri:** Jel admin login ima 2FA? Nema vidljivog 2FA servisa

### Upload sigurnost
- `ImageService` / `ImageOptimizationService` postoje
- **Provjeri:** Da li se verificira MIME type (ne samo ekstenzija)?
- **Provjeri:** Da li se slike uploaduju van web roota (storage, ne public)?
- **Rizik:** PHP execution u upload folderu

---

## Webhook sigurnost

### PayPal webhook
- `PayPalWebhookController` — signature-verified ✅
- Ovo je DOBRO — webhook nije autentifikovan samo po URL-u

### Interni webhooks
- `POST /webhooks/discord/notify` — `WebhookController::notify`
- Bio je **potpuno neautentifikovan** (09.08.2026): svako je mogao objaviti
  brendiranu lažnu objavu u zvanični Discord kanal. Sada `auth:sanctum` + staff
  provjera, validiran ulaz, `throttle:10,1`. Nijedan dio aplikacije ga ne zove —
  posao radi `PollingService` u botu — pa stoji samo kao ručni okidač za redakciju.

### Discord bot rute
- Cijela `/discord/*` grupa ide kroz `discord.bot` middleware (`VerifyDiscordBot`).
- Ranije je svaki kontroler nosio vlastitu kopiju provjere, pa su `/discord/presence`
  i `/discord/user/{id}` ostali bez ijedne. Provjera je sada na grupi da nova ruta
  bude zaštićena po defaultu, a ne tek kad se neko sjeti.
- Prihvata `X-Discord-Bot-Token` i `X-Bot-Secret` (bot je slao drugo ime nego što
  je backend čitao — otud rupa).

---

## Infrastruktura

### .env fajlovi
- Backend `.env` ima produkcijske ključeve — mora biti zaštićen (chmod 600)
- `.gitignore` treba imati `.env` na listi — vjerovatno je (standardno Laravel)
- **Provjeri:** Da li su ikad `.env` vrijednosti commitovane u git historiji?

### SecurityHeaders middleware
- Implementiran ✅
- Treba uključivati: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- **Provjeri:** Da li CSP politika blokira inline scripts? Next.js koristi inline scripts.

---

## Forum & Comment abuse

### Spam
- Rate limiting jedina zaštita
- Nema keyword filter, nema AI moderacija
- **Preporuka:** Razmotriti reCAPTCHA za registraciju ili comment submit

### XP abuse
- 60s cooldown i 100 XP/day cap za web ✅
- Discord: 60s cooldown po korisniku ✅
- **Rizik:** Botovi mogu kreirati više Discord accountova za XP farming
- **Preporuka:** Discord account age requirement za XP

### Report sistem
- `Report` model i `POST /reports` endpoint postoje ✅
- Nema vidljivog moderator workflow UI
- **Rizik:** Reports se skupljaju ali možda nitko ne pregledava

---

## Sigurnosna provjera lista (pre-produkcija)

- [ ] `.env` nije u git historiji
- [ ] SANCTUM_STATEFUL_DOMAINS je precizno definisan
- [ ] CORS ne dozvoljava wildcard
- [ ] SecurityHeaders uključuje HSTS, CSP, X-Frame-Options
- [ ] SanitizationService se koristi na SVIM user inputima
- [ ] ImageService verificira MIME type
- [ ] Upload folder nije executable
- [ ] PayPal je na `live` mode
- [ ] API ključevi su rotovani (ne development ključevi)
- [ ] Discord bot token i secret su sigurni
- [ ] Laravel Pulse endpoint zaštićen (ne javno dostupan)
- [ ] Queue worker ima auto-restart konfiguraciju
- [ ] Redis password je postavljen
