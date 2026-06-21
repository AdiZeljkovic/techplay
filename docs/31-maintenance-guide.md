# 31 — Maintenance Guide

## Onboarding za novog developera

### Korak 1: Pročitaj dokumentaciju
1. `docs/README.md` — pregled
2. `docs/01-project-overview.md` — šta je projekt
3. `docs/02-system-architecture.md` — kako dijelovi komuniciraju
4. `docs/10-features-map.md` — status svake funkcije
5. `CLAUDE.md` — projektna pravila

### Korak 2: Pregled koda
1. Pregledaj `backend/routes/api.php` — sve API rute
2. Pregledaj `backend/app/Models/` — svi modeli
3. Pregledaj `frontend/app/` — sve stranice
4. Pregledaj `discord/src/` — bot kod

---

## Pokretanje projekta (razvoj)

### Backend
```bash
cd backend/
cp .env.example .env
# Popuni .env vrijednosti

composer install
php artisan key:generate
php artisan migrate --seed

# Pokretanje (sve odjednom):
composer dev
# Ili zasebno:
php artisan serve          # :8000
php artisan queue:listen --tries=1
php artisan pail           # log viewer
```

### Frontend
```bash
cd frontend/
cp .env.example .env.local
# Popuni:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# NEXT_PUBLIC_STORAGE_URL=http://localhost:8000/storage
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# REVALIDATION_SECRET=some-secret

npm install
npm run dev    # :3000
```

### Discord bot
```bash
cd discord/
cp .env.example .env
# Popuni: DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, DISCORD_BOT_SECRET, API_URL

npm install
npm run dev    # ts-node src/index.ts
```

---

## Potrebne env varijable

### Backend (`.env`)
| Varijabla | Primjer | Napomena |
|-----------|---------|---------|
| `APP_URL` | `http://localhost:8000` | |
| `FRONTEND_URL` | `http://localhost:3000` | Za ISR revalidaciju |
| `DB_CONNECTION` | `pgsql` | PostgreSQL |
| `DB_HOST` | `127.0.0.1` | |
| `DB_DATABASE` | `techplay` | |
| `REDIS_HOST` | `127.0.0.1` | |
| `QUEUE_CONNECTION` | `redis` | |
| `BROADCAST_CONNECTION` | `reverb` | |
| `REVALIDATE_SECRET_TOKEN` | random string | Mora se podudarati s frontend |
| `DISCORD_BOT_SECRET` | random string | Mora se podudarati s discord bot |
| `DISCORD_CLIENT_ID/SECRET` | iz Discord dev portal | Za OAuth |
| `RAWG_API_KEY` | RAWG key | Za game screenshote |
| `MOBY_API_KEY` | MobyGames key | Za game import |
| `OPENAI_API_KEY` | OpenAI key | Za WoW analizu |
| `GEMINI_API_KEY` | Google AI key | Za WoW analizu |
| `PAYPAL_CLIENT_ID/SECRET` | PayPal sandbox | `PAYPAL_MODE=sandbox` za dev |
| `BLIZZARD_CLIENT_ID/SECRET` | battle.net app | Za WoW |
| `STEAM_API_KEY` | steam key | Za Steam integraciju |
| `INDEXNOW_KEY` | tp7k3m2n9x5q8r1w4y6z0a | IndexNow ključ |

---

## Dodavanje nove frontend stranice

1. Kreiraj folder: `frontend/app/nova-stranica/`
2. Kreiraj `page.tsx` unutar foldera
3. Za Server Component (SEO + ISR):
   ```tsx
   export default async function NovaStrannicaPage() {
     const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nova-ruta`, {
       next: { revalidate: 60 }
     })
     // ...
   }
   ```
4. Dodaj meta tagove kroz `GlobalSeo` komponentu ili `metadata` export
5. Ažuriraj `docs/04-frontend-map.md` i `docs/23-frontend-backend-connections.md`

---

## Dodavanje novog API endpointa

1. Dodaj rutu u `backend/routes/api.php`:
   ```php
   Route::get('/nova-ruta', [NoviController::class, 'index']);
   ```
2. Kreiraj kontroler: `backend/app/Http/Controllers/Api/V1/NoviController.php`
3. Koristi `ApiResponse` trait za standardiziran response
4. Dodaj validaciju kroz Form Request klase
5. Ažuriraj `docs/08-api-map.md`

---

## Dodavanje novog admin resursa (Filament)

1. Kreiraj resource:
   ```bash
   php artisan make:filament-resource NoviModel
   ```
2. Definiraj `form()` i `table()` metode u resource klasi
3. Resource se automatski pojavljuje u adminu
4. Ažuriraj `docs/06-admin-panel-map.md`

---

## Dodavanje nove tabele (migracija)

1. Kreiraj migraciju:
   ```bash
   php artisan make:migration create_nova_tabela_table
   ```
2. Definiraj kolone u `up()` metodi
3. Pokreni: `php artisan migrate`
4. Kreiraj model: `php artisan make:model NovaTabela`
5. Ažuriraj `docs/07-database-map.md`

---

## Dodavanje nove Discord komande

1. Dodaj definiciju u `discord/src/commands/definitions.ts`:
   ```ts
   {
     name: 'nova-komanda',
     description: 'Opis komande',
     options: [...]
   }
   ```
2. Dodaj handler logiku u `discord/src/handlers/commands.ts`
3. Ažuriraj `docs/18-discord-bot-map.md`

---

## Ažuriranje dokumentacije

**Kada ažurirati dokumentaciju:**
- Svaka nova stranica/ruta → `docs/04-frontend-map.md`
- Svaki novi API endpoint → `docs/08-api-map.md`
- Svaka nova tabela/model → `docs/07-database-map.md`
- Svaka nova funkcionalnost → `docs/10-features-map.md`
- Svaka promjena Discord bota → `docs/18-discord-bot-map.md`
- Poznati problemi → `docs/25-known-issues.md`

---

## Deployment

```powershell
# Windows PowerShell
cd TechPlay/
./deployment/push_and_deploy.ps1
```

Skript radi:
1. Eksportuje PostgreSQL dump
2. `git add . && git commit && git push`
3. SSH na server
4. `git pull`
5. `composer install --no-dev`
6. `php artisan migrate`
7. `php artisan config:cache && php artisan route:cache`
8. Restart Octane/queue workera

---

## Debugging

### Backend logs
```bash
php artisan pail         # Real-time log viewer
tail -f storage/logs/laravel.log
```

### Queue debug
```bash
php artisan queue:listen --tries=1   # Verbose queue output
php artisan queue:failed             # Lista failovanih jobova
php artisan queue:retry all          # Retry svih failovanih
```

### Database
```bash
php artisan tinker       # Laravel REPL
>>> User::first()
>>> Article::where('published_at', '<', now())->count()
```

### Testovi
```bash
php artisan test                               # Svi testovi
php artisan test --filter ArticleTest         # Jedan test
php artisan test tests/Feature/GameTest.php   # Jedan fajl
```
