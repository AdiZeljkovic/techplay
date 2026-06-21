# 14 — Release Calendar Map

## Svrha

Prikazuje datume izlaska igara iz game baze, sortiranom po datumu. Korisnici mogu pratiti nadolazeće igre.

---

## Izvor podataka

- Podaci dolaze iz `games.release_date` kolone u PostgreSQL bazi
- Game baza se puni iz MobyGames importa
- Admin može ručno editovati release_date kroz GameResource u Filamentu

---

## Backend

**Kontroler:** `GameController::calendar`
**Ruta:** `GET /api/v1/games/calendar`
**Filteri:** Vjerovatno date range parametri (month, year, od/do)
**Cache:** throttle:60,1 (rate limiting)

---

## Frontend

**Lokacija:** `frontend/app/calendar/`
**Fetch:** `GET /api/v1/games/calendar`
**Prikaz:** UNKNOWN detalji UI (da li postoji tjedni/dnevni/mjesečni prikaz nije potvrđeno)

---

## Wishlist notifikacije

- `CheckWishlistReleases` artisan komanda
- Provjera igara u korisnikovom wishlistu (status = 'wishlist' u user_games)
- Ako igra ima release_date koji pada u bliskoj budućnosti → notifikacija korisniku
- Scheduling: UNKNOWN (vjerovatno daily cron)

---

## Veza sa game databaseom

- Nije posebna tabela — release calendar je view/query nad `games` tabela
- Filtriranje: `WHERE release_date BETWEEN ? AND ?`
- Sortiranje: `ORDER BY release_date ASC`

---

## SEO potencijal

- "Igre koje izlaze u junu 2026" — velika SEO vrijednost
- Svaka igra na calendaru treba link na game detalj stranicu
- Monthyl/weekly release pages mogu biti ISR stranice s dobrim SEO

---

## Nedostaci

- Nema posebne tabele/modela za calendar (sve iz games.release_date)
- Nema korisničkog "praćenja" kalendara (watchlist specifičan za calendar, ne kolekciju)
- UI detalji (tjedni/dnevni prikaz) UNKNOWN bez čitanja frontend koda
- Nema podrške za multiple release dates po igri (npr. PC/console različiti datumi)
