# P9 — Arhitektonska mapa (11.08.2026)

Sve što se vidi **iz koda**. Stvarna topologija mašine — nginx, Cloudflare
pravila, šta zaista radi — dolazi u Fazi 3, kad bude SSH.

Naglasak je na pitanju koje se rijetko postavi dok ne zatreba: **šta se desi kad
svaka od ovih stvari otkaže.**

---

## Ulazne tačke

```
                        ┌──────────────────────────────┐
   posjetilac  ────────►│  techplay.gg  (Next.js, pm2) │
                        │  SSR + ISR, 73 rute          │
                        └──────────────┬───────────────┘
                                       │  nginx proxy /api
                                       ▼
   Discord bot ───────►┌───────────────────────────────┐
   (ne radi, v. P4)    │  api-beta.techplay.gg          │
                       │  Laravel 12 · Octane/FrankenPHP│◄──── PayPal webhook
   PayPal ────────────►│  259 API putanja               │◄──── OAuth povratci
                       │  Filament panel na /admin      │      (Discord, Bnet, Steam)
                       └───────┬───────────────┬────────┘
                               │               │
                    ┌──────────▼─────┐   ┌─────▼──────────┐
                    │  PostgreSQL    │   │  Redis         │
                    │  ~188k igara   │   │  keš · red     │
                    └────────────────┘   │  sesije        │
                                         └─────┬──────────┘
                                               │
                                     ┌─────────▼─────────┐
                                     │  queue worker     │
                                     │  12 tipova poslova│
                                     │  26 zakazanih     │
                                     └───────────────────┘
```

Četiri načina da nešto uđe u sistem:

| Ulaz | Šta ga koristi |
|---|---|
| **HTTP API** (259 putanja) | frontend SSR i browser, Discord bot |
| **Filament panel** (`/admin`) | redakcija; 35 resursa, 6 stranica |
| **Webhookovi i OAuth povratci** | PayPal, Discord, Battle.net, Steam |
| **Scheduler** (26 zadataka) + red poslova (12 tipova) | sve što se dešava bez korisnika |

---

## Integracije i šta se desi kad otkažu

Poredano po tome koliko boli.

| Integracija | Gdje je | Ako otkaže | Rizik |
|---|---|---|---|
| **PostgreSQL** | sve | sajt stoji | jedinstvena tačka |
| **Cloudflare Turnstile** | prijava, registracija, kontakt | **niko se ne može prijaviti ni registrovati** — pada zatvoreno, namjerno | **visok** |
| **Redis** | keš, red poslova, sesije, brojači pregleda, prisutnost, rate limiter | sesije padaju, pozadinski poslovi stoje; čitanja idu u bazu | visok |
| **PayPal** | kupovina, pretplate | naplata ne prolazi; narudžba ostaje `pending`. Zaliha se **ne** skida dok se ne naplati | srednji |
| **Mail** | verifikacija, reset lozinke | novi se ne mogu verifikovati, zaboravljena lozinka se ne može vratiti | srednji |
| **Reverb (WebSocket)** | chat, forum, notifikacije uživo | poruke stižu tek na osvježavanje; ostatak radi | nizak |
| **Steam / OpenXBL** | uvoz biblioteke, prisutnost | uvoz ne radi, sve ostalo radi | nizak |
| **Battle.net** | WoW analizator | ta stranica ne radi | nizak |
| **Gemini / OpenAI / Groq** | WoW analiza | ista stranica | nizak |
| **IndexNow** | ping pretraživačima na objavu | ništa vidljivo; indeksiranje kasni | zanemariv |
| **OpenCritic / YouTube** | obogaćivanje baze igara | dnevni prolaz preskoči; katalog stoji na zatečenom | zanemariv |
| **Discord** | prijava, bot | dugmad za prijavu ne rade; bot ionako ne radi (P4) | nizak |

### Captcha je jedinstvena tačka otkaza i to je odluka, ne propust

`ReCaptchaService` namjerno pada zatvoreno — ako ključ nije postavljen ili
Cloudflare ne odgovori, prijava i registracija se **odbijaju**:

> *"Fail closed. Returning success here meant one typo in .env silently disabled
> bot protection on login, register and contact, and the only trace was a log
> line nobody reads."*

To je ispravan izbor za sigurnost i skup izbor za dostupnost. Vrijedi znati da
je Cloudflare ispred **i** unutar prijave — ako padne, ne pada samo dostava
stranica nego i mogućnost da se iko prijavi.

Postoji izlaz: `TURNSTILE_ENABLED=false` u `.env` gasi provjeru bez deploya.

---

## Zaštite koje već postoje

Zapisano jer se ne vidi dok se ne traži:

- **Timeout na svaki odlazni poziv.** `Http::globalOptions(['timeout' => 10,
  'connect_timeout' => 3])` u `AppServiceProvider`. Guzzleov podrazumijevani je
  nula — čekaj vječno — a nekoliko integracija u putanji zahtjeva nije imalo
  vlastiti. Jedan spor treći sistem mogao je zakucati sve Octane radnike.
- **Rate limiter** 60/min po korisniku ili IP-u, s izuzetkom za vlastiti SSR
  proces (prepoznaje se tajnim headerom, ne po IP-u).
- **`views:clean`** dnevno, čuva 7 dana — tabele pregleda ne rastu bez granice.
- **`scheduler-heartbeat`** svake minute u keš, pa `/system/health` zna reći
  stoji li scheduler.
- **`ShouldBeUnique` + `withoutOverlapping`** na dugim poslovima.
- **`/system/health`** vraća 503 kad su baza, Redis, red ili scheduler u kvaru —
  za nadzor izvana.

## Slabe tačke koje se vide iz koda

1. **Sve na jednoj mašini.** Baza, Redis, Octane, Next i queue worker dijele
   jedan VPS. Nema replike, nema izolacije — jedan iscrpljen resurs ruši sve.
   Faza 3.
2. **Queue worker je jedina tačka za sve pozadinsko.** Ako stoji, tiho stoje i
   obogaćivanje kataloga, i podsjetnici, i sinhronizacija biblioteka. `docs/34`
   je već zabilježio da se Steam drip zna prekinuti pri restartu radnika.
3. **Frontend ovisi o API-ju za SSR.** Ako backend kasni, kasne i stranice koje
   bi inače bile statične. ISR ublažava, ali prvi render nakon isteka čeka.
4. **Discord bot nije nigdje pokrenut** — kod postoji, konfiguracija je
   ispravna, ništa ga ne diže. Sve što mapa piše pod Discordom je *spremno*, ne
   *aktivno*.

---

## Tok podataka: objava članka

Jedini tok koji dodiruje skoro sve, pa služi kao primjer:

```
 urednik u Filamentu
        │
        ▼
   ArticleObserver ──► PublishArticleFanout (u red, ne sinhrono)
                              │
              ┌───────────────┼───────────────┬──────────────┐
              ▼               ▼               ▼              ▼
     revalidacija ISR    sitemap          IndexNow      notifikacije
     (POST na Next)      regeneriše       ping          pretplatnicima
              │
              ▼
        techplay.gg servira novu verziju
```

Fan-out je **izmješten iz zahtjeva** u posao (`PublishArticleFanout`) — ranije je
urednik čekao da se sve to izvrši prije nego mu se snimanje vrati.

---

## Šta ostaje za Fazu 3

Sve što se iz koda ne vidi: nginx konfiguracija, Cloudflare pravila i keš,
supervisor jedinice, Redis `maxmemory` politika, backup i vježba vraćanja,
TLS, i da li išta od ovoga uopšte ima nadzor koji nekoga probudi.
