# 09 — Auth & Permissions Map

## Auth sistem

### Korisnici (Frontend/API)

**Metoda:** Laravel Sanctum, Bearer token

**Flow:**
```
1. POST /api/v1/auth/register → password hash → user kreiran → token vrati
2. POST /api/v1/auth/login    → verify password → token vrati
3. Frontend spremi token u localStorage (AuthContext)
4. Svaki zaštićeni API poziv šalje: Authorization: Bearer <token>
5. Backend middleware auth:sanctum verifikuje token
6. POST /api/v1/auth/logout → token revoke → localStorage clear
```

**Social auth:**
- **Discord OAuth:** redirect → callback → pronađi/kreiraj user → token
- **Battle.net OAuth:** redirect → callback → pronađi/kreiraj user → token
- Oba toka koriste Socialite library i vlastite kontrolere

### Admin (Filament)

**Metoda:** Filament panel auth (session-based, odvojeno od API)
- Login URL: `/admin/login`
- Filament policy: koji korisnici imaju pristup admin panelu (UNKNOWN detalji — vjerovatno provjera `is_admin` ili rola)
- Spatie Roles & Permissions library je integrisan (`Roles` resource u Filamentu)

---

## Role i permisije

**Library:** Spatie Laravel Permission (`backend/app/Filament/Resources/Roles/`)

### Poznate role (UNKNOWN potpuna lista)
- `admin` — pristup Filament admin panelu
- `editor` — vjerovatno može kreirati/editovati sadržaj
- Ostale role: UNKNOWN

### Permisije po akcijama (UNKNOWN potpuna lista)
Admin panel koristi Filament policy-je koji vjerovatno provjeravaju rolu. Tačne permisije po resursu nisu poznate bez čitanja svakog Resource fajla.

---

## Zaštita ruta

### Backend API rute

| Tip rute | Middleware | Ko može pristupiti |
|----------|-----------|-------------------|
| Javne | `throttle:60,1` | Svi (browser, bot, API) |
| Auth-required | `auth:sanctum` | Prijavljeni korisnici s validnim Sanctum tokenom |
| Discord bot | `throttle:300,1` | Čitači koji šalju `DISCORD_BOT_SECRET` header |
| Discord admin | `throttle:300,1` + bot auth | Samo bot |
| Rate-limited public | `throttle:30,1` | Posebni public endpointi (komentari, forum search) |
| Webhooks | bez auth | PayPal webhook (signature verify interno) |

**Napomena:** Discord bot rute NEMAJU Sanctum auth — koriste shared secret mehanizam (`DISCORD_BOT_SECRET` u headeru ili query param).

### Frontend rute

- **Middleware (`frontend/middleware.ts`):** samo maintenance mode provjera. Auth NIje enforced server-side.
- **Client-side auth:** `AuthContext` i stranice sami provjeravaju token i redirectuju na `/login`
- **Protected routes (client-side):** settings, messages, friends, profile edit, forum create, comment create
- **Public routes:** sve news/review/game/forum čitanje

---

## Token management

- **Kreiranje:** pri login/register → `createToken('auth-token')` → Sanctum PersonalAccessToken
- **Rok trajanja:** UNKNOWN (nije uočeno eksplicitno — može biti indefinite ili configurable)
- **Refresh:** POST `/api/v1/auth/refresh` postoji (UNKNOWN detalji implementacije)
- **Revokacija:** POST `/api/v1/auth/logout` revoke token
- **Storage:** Frontend → `localStorage` (ne HttpOnly cookie)

**Sigurnosna napomena:** Token u localStorage je podložan XSS napadima. Ako dođe do XSS ranjivosti u user-generated content, token može biti ukraden.

---

## Korisničke permisije po funkcionalnosti

| Akcija | Korisnik | Neregistriran | Admin |
|--------|----------|--------------|-------|
| Čitanje news/reviews/games | ✓ | ✓ | ✓ |
| Ostavljanje komentara | ✓ | ✗ | ✓ |
| Kreiranje forum thread | ✓ | ✗ | ✓ |
| XP dodjela | ✓ | ✗ | ✓ |
| Achievements | ✓ | ✗ | ✓ |
| Game collection | ✓ | ✗ | ✓ |
| Direct messages | ✓ | ✗ | ✓ |
| Friends | ✓ | ✗ | ✓ |
| WoW analyzer | ✓ | ✓ | ✓ |
| Shop/narudžbe | ✓ | ✗ | ✓ |
| Admin panel | ✗ | ✗ | ✓ |
| Pin forum thread | ✗ | ✗ | ✓ |
| Brisanje tuđih postova | ✗ | ✗ | ✓ |
| Publish/edit sadržaj | ✗ | ✗ | ✓ |

---

## Sigurnosni rizici

1. **Token u localStorage:** Podložan XSS-u — razmotriti HttpOnly cookie za token storage
2. **Discord bot auth:** Provjera `DISCORD_BOT_SECRET` nije jasna — ako je samo query param, može biti vidljiv u logovima
3. **PayPal webhook:** Signature verification postoji (PayPalWebhookController) — DOBRO
4. **Rate limiting:** Implementiran na kritičnim rutama — DOBRO
5. **Sanctum:** Konfiguracija `SANCTUM_STATEFUL_DOMAINS` treba biti precizna u produkciji
6. **N+1 protection:** Aktivna u dev/staging — DOBRO
7. **CORS:** Konfiguracija CORS u Laravelu — UNKNOWN detalji
