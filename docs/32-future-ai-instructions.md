# 32 — Future AI Instructions

## Uvod

Ove instrukcije su za AI agente (Claude Code i sl.) koji rade na TechPlay.gg projektu u budućim sesijama. Cilj je da AI može efikasno raditi bez da lomi postojeće funkcije i bez da pravi pretpostavke.

---

## Što čitati PRIJE bilo kakve promjene

### Za SVAKU promjenu
1. `CLAUDE.md` — projektna pravila
2. `docs/10-features-map.md` — status funkcionalnosti
3. Konkretni tematski dokument (npr. ako radiš na forumu → `docs/15-forum-map.md`)

### Za frontend promjene
4. `docs/04-frontend-map.md` — rute i komponente
5. `docs/23-frontend-backend-connections.md` — koja stranica koristi koji API
6. Provjeri konkretni frontend fajl (ne pretpostavljaj strukturu)

### Za backend/API promjene
7. `docs/05-backend-map.md` — kontroleri, servisi, modeli
8. `docs/08-api-map.md` — postojeći endpointi
9. `backend/routes/api.php` — stvarne rute
10. Relevantan Controller fajl

### Za database promjene
11. `docs/07-database-map.md` — tabele i relacije
12. Provjeri migracije za konkretnu tabelu

### Za Discord bot promjene
13. `docs/18-discord-bot-map.md`
14. `discord/src/services/` konkretni servis

---

## Kako planirati prije kodiranja

1. **Pročitaj zadatak** — šta se traži?
2. **Identificiraj koji dio sistema** — frontend? backend? baza? Discord bot?
3. **Provjeri postoji li sličan kod** — ne dupliciraj logiku
4. **Provjeri bi li promjena utjecala na druge dijelove:**
   - Svaka backend promjena → provjeri frontend koji je koristi
   - Svaka database promjena → provjeri sve modele koji koriste tabelu
   - Svaka observer/event promjena → provjeri WebSocket hookove na frontendu
5. **Napiši plan** PRIJE pisanja koda za netrivijalne zadatke

---

## Pravila rada

### UVIJEK
- Pročitaj postojeći kod u fajlu PRIJE editovanja
- Koristi `ApiResponse` trait u svim novim kontrolerima
- Koristi `SanitizationService` za sve user inpute
- Dodaj novu rutu u odgovarajuću grupu (javna, auth, Discord bot)
- Ažuriraj relevantu dokumentaciju u `/docs`

### NIKAD
- Ne uklanjaj postojeće API endpointe bez eksplicitne instrukcije
- Ne mijenjaj URL strukturu endpointa (lomi keširanje i SEO)
- Ne dodaj raw SQL bez provjere sigurnosti
- Ne pretpostavljaj da nešto ne postoji — uvijek provjeri
- Ne ignoriraj `pgArray()` helper za PostgreSQL TEXT[] kolone
- Ne mijenjaj `.env.example` s pravim vrijednostima

---

## Kako paziti na frontend/backend/admin/database povezanost

```
Promjena modela → provjeri:
  - Observer (ima li observer na modelu?)
  - Admin resource (Filament CRUD resource)
  - API endpoint koji vraća taj model
  - Frontend stranica koja prikazuje podatak
  - WebSocket event koji broadcast update

Promjena API response strukture → provjeri:
  - Frontend komponente koje konzumiraju response
  - TypeScript tipove u frontend/types/
  - Admin panel koji možda koristi isti endpoint

Dodavanje kolone → provjeri:
  - Kreirati migraciju (nikad direktno u bazi)
  - Ažurirati $fillable u modelu
  - Ažurirati API resource/response ako je vidljivo
  - Ažurirati frontend tip (TypeScript)
  - Ažurirati admin form ako je editabilno
```

---

## Kako obilježavati nejasnoće

Ako nešto nije jasno pri analizi:
1. Napiši `UNKNOWN` — nikad ne izmišljaj
2. Opiši konkretno šta nije jasno
3. Predloži kako verificirati (koji fajl pročitati, koji endpoint testirati)

Primjer:
```
// UNKNOWN: Da li FaqItem model ima odgovarajući kontroler.
// Provjeri: backend/app/Http/Controllers/Api/V1/ (nema FaqController)
// i backend/app/Filament/Resources/ (nema FaqResource)
// Zaključak: Vjerovatno dead code ili nedovršena funkcija.
```

---

## Kako raditi bez lomljenja postojećih funkcija

1. **Koristiti feature flags** za nove, eksperimentalne funkcije — UNKNOWN da li su konfigurisani
2. **Koristiti ISR revalidaciju** — ne mijenjati revalidate vrijednosti drastično
3. **Backward-compatible API** — ne uklanjati polja iz API response-a (frontend ih možda koristi)
4. **Test pokretanje** — uvijek pokrenuti `php artisan test` nakon backend promjena
5. **Frontend build check** — `npm run build` za provjeru TypeScript grešaka
6. **Provjeri N+1** — u dev modu `preventLazyLoading()` je aktivan, throwat će grešku

---

## Discord bot specifičnosti

- Bot koristi `DISCORD_BOT_SECRET` za auth — ne Sanctum token
- Sve bot operacije idu kroz `/api/v1/discord/*` rute
- Bot je single-guild (samo jedan Discord server)
- `GuildPresences` i `MessageContent` su Privileged Intents — bez odobrenja bot neće raditi
- Bot ima vlastiti `XpService` (TypeScript) koji je zasebna implementacija od backend `XpService` (PHP)

---

## Česte greške i kako ih izbjeći

| Greška | Uzrok | Prevencija |
|--------|-------|-----------|
| `pgArray()` nije pozvan | TEXT[] kolone iz PostgreSQL | Uvijek proći kroz `pgArray()` u GameController |
| ISR cache nije purged | Observer nije implementiran za novi model | Provjeriti ima li model Observer |
| N+1 query u dev | Relationship nije eager-loaded | `with(['relation'])` u queriju |
| Token nije u header | Frontend koristi api.ts bez axios interceptora | Koristiti useApi hook koji automatski dodaje Bearer |
| Discord bot ne vidi poruke | MessageContent intent nije dozvoljeni | Discord developer portal → Privileged Gateway Intents |
| RAWG 429 error | Previše RAWG poziva | Koristiti lokalne screenshote ili cache |

---

## Kraj sesije

Na kraju sesije:
1. Ažuriraj relevantne `/docs` fajlove
2. Dodaj nove poznate probleme u `docs/25-known-issues.md` ako si ih primijetio
3. Ažuriraj `docs/10-features-map.md` ako si promijenio status funkcije
4. Provjeri da nisi ostavio TODO komentare u kodu bez rješenja
