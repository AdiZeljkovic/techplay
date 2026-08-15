# Pregled: sigurnost, stabilnost, optimizacija, ponašanje — 15.08.2026.

Svjež prolaz, ne ponavljanje ranijih. Sve što slijedi je provjereno pokretanjem,
ne čitanjem koda.

Produkcija je zdrava: sve ključne rute 200, 0,12–0,20 s.

---

## 1. Popravljeno: pretplata se nije obnavljala

Tri greške u `PayPalWebhookController`, sve u putanji kroz koju ide novac.

**Obnova nije produžavala period.** Obnova stiže kao `PAYMENT.SALE.COMPLETED`
bez `custom_id` — nosi `billing_agreement_id`. Handler je za taj slučaj upisao
upozorenje i izašao, pa je `subscription_ends_at` postavljen jednom pri
aktivaciji i nikad se nije pomjerio. Pretplatnik ostane bez perioda dok PayPal
i dalje naplaćuje.

**Period je bio zakucan na mjesec dana**, uz komentar samog koda
`// Should parse from resource`. Godišnji plan je dobijao mjesec. Sada se čita
`billing_info.next_billing_time`, a datum se **nikad ne skraćuje** — dva
događaja mogu stići obrnutim redom.

**Otkazivanje je oduzimalo plaćeno.** `CANCELLED` je nulirao i
`paypal_subscription_id` i `subscription_ends_at`. PayPal-ov CANCELLED znači
„neće se obnoviti" — period je plaćen do kraja. Sad otkazivanje samo gasi
obnovu; `EXPIRED` je događaj koji stvarno završava pretplatu.

**Idempotencija.** PayPal ponavlja isporuku dok ne dobije 2xx, a handler na
izuzetak vraća 500 — ponavljanje je normalan tok, ne rub. Svaka ponovljena
aktivacija je ponovo pomjerala datum. Sad `Cache::add` po `event_id` (atomično,
24 h), uz oslobađanje ključa kad obrada padne — inače bi 500 tražio ponovnu
isporuku koju bi dedupe odbacio, pa bi greška bila trajna i tiha.

**Provjereno**: `PayPalWebhookTest`, 7 testova / 21 tvrdnja, uključujući
dvostruku isporuku i događaj koji stiže sa zakašnjenjem.

---

## 2. Popravljeno: sitnije

- **`FetchOgData` je išao s `CURLOPT_SSL_VERIFYPEER => false`.** Svaki pregled
  linka koji redakcija zalijepi dohvatan je preko veze koju niko ne provjerava,
  a odgovor se parsira i sprema. Uključeno, uz `VERIFYHOST` i ograničenje na
  `http,https` (postavlja se uslovno, jer string oblik tih curl opcija postoji
  tek od libcurl 7.85 a nedefinisana konstanta je fatal).
- **Pet jobova je padalo tiho** — bez `tries` i bez `failed()`. Dobili su
  ponavljanje mjereno prema poslu: IndexNow 3 pokušaja s razmakom, mail 2,
  `FlushViewCounters` ostaje na 1 jer se ionako vrti svakih pet minuta i
  brojači čekaju u Redisu.

---

## 3. Nije popravljeno: naslovnica i dalje mjeri 6,3 s LCP

**Pet hipoteza, sve pogrešne.** Zapisano da se ne ponavlja.

Izmjereno stanje: slika heroja je **učitana, neprozirna, vidljiva i pravilne
veličine od 109 ms** — sondirano direktno, sa svim precima u lancu. Ipak:

| uslov | kad Chrome nominuje sliku | LCP |
|---|---|---|
| normalno | 6.296 ms | **6,30 s** |
| `prefers-reduced-motion` | 124 ms | **0,12 s** |

Isti obrazac, manji, i na `/latest` **koja nema kliznik**: 0,50 s naspram
0,12 s. To znači da uzrok **nije kliznik** nego nešto što reaguje na
`prefers-reduced-motion` na nivou cijele stranice.

Redom isprobano i odbačeno:

1. Ken Burns (skaliranje slike) — uklonjen, bez promjene.
2. `width` animacija na traci napretka → `scaleX` — bez promjene.
3. Ta ista traka prebačena s framera na čistu CSS animaciju — bez promjene.
4. Prvi slajd bez `initial={{opacity:0}}` — bez promjene.
5. Autoplay sam po sebi — otpada, jer se isto vidi na stranici bez kliznika.

Zadržane su izmjene 2 i 3 jer su same po sebi bolje (kompozitor umjesto glavne
niti), i 4 jer je eksplicitnija. **Ken Burns je uklonjen na osnovu pogrešnog
zaključka i može se vratiti.**

Sljedeće mjesto za traženje: nešto na nivou ljuske što se gasi pod
reduced-motion — kandidat je `tp-page-in` ulazna animacija stranice.

---

## 4. Nije za mene: traži odluku ili pristup

| Nalaz | Zašto stoji |
|---|---|
| **Plaćeni tierovi obećavaju ono što se ne isporučuje** | „Ad-free browsing", „Supporter Badge", „Access to supporter-only forum", „Early access to videos", „Exclusive merchandise discounts". Provjereno: `AdSense.tsx` nema nijednu provjeru korisnika, nema foruma za podržavaoce, i **ništa u kodu ne čita `subscription_ends_at` kao pravo pristupa**. Status podržavaoca koji profil crta dolazi iz `customization.tier`, a to se zarađuje XP-om. Odluka je proizvodna: isporučiti pogodnosti ili uskladiti tekst. |
| **Cloudflare ne kešira HTML** | Ponovo potvrđeno: `/`, `/games`, `/calendar` svi `cf-cache-status: DYNAMIC` uprkos `s-maxage`. Promjena u dashboardu. |
| **Šifra baze i Gemini ključ u git historiji** | Rotacija je tvoja. |

---

## 5. Pet lažnih nalaza, provjerenih i odbačenih

1. **„54 od 119 write ruta bez rate limita."** Pretraga je bila osjetljiva na
   velika slova; `throttleApi('api')` u `bootstrap/app.php` pokriva sve API
   rute, 60/min po korisniku ili IP-u.
2. **„`RewardLedger` singleton curi između zahtjeva pod Octaneom."** Docblock
   tvrdi da je request-scoped. Provjereno u izvoru: `Worker.php:75` klonira
   kontejner po zahtjevu, a ledger se razrješava tek unutar zahtjeva — nikad
   pri bootu. Tvrdnja stoji.
3. **„`/calendar` CLS 0,667."** Pojavilo se jednom, pa 0,000 tri puta zaredom.
   Isto kao u `58-audit-optimizacije-ii.md`. Hladan keš, ne struktura.
4. **„`UserRecognition` ima `$guarded = []`."** Nikad se ne kreira iz ulaza
   zahtjeva.
5. **„`env()` izvan configa."** Samo u `ValidateEnv`, koji namjerno čita `.env`
   da bi ga validirao.

---

## 7. Komentari: pola odgovora niko nije citao (15.08.2026.)

Prijavljeno: komentari na clancima vracaju vise nego sto treba. Tacno.

`CommentResource` je za autora slao **opsti `UserResource`** — dvadeset polja:
cover slika, bio, tagline, lokacija, author slug, drustveni linkovi, boja posta,
forum reputacija, broj postova, level, XP, uloge, datum registracije. Nit
komentara crta ime, sliku i znacku ranga. **Pet polja od dvadeset.**

I to nije jednom po stranici: endpoint ucitava do **100 odgovora po komentaru**
(pa jos 50 i 25 na dubljim nivoima), deset komentara po stranici. Svaki od njih
nosi svoj pun profil autora.

Uz to tri polja koja **nijedno mjesto na frontu ne cita**:

- `created_at_human` — klijent sam formatira vrijeme kroz date-fns
- `likes_count` — bio je doslovno `$this->score`, isti broj pod drugim imenom
- `is_liked_by_user` — `user_vote === 'up'`, sto klijent vidi sam, i sto ne
  moze izraziti minus

**Izmjereno na stvarnom odgovoru s produkcije** (clanak
`games-you-must-play-if-you-like-christopher-nolans-odyssey`):
**2.591 B → 1.406 B, ustedа 46%**, oko **592 B po autoru**.

### Usput nadjene dvije greske, ne samo visak

1. **Znacka „Staff" u komentarima nikad se nije pojavila.** Front je citao
   `comment.user.role`, a API polje `role` **nikad nije slao** — autorizacija je
   odavno na Spatie ulogama. Uvijek `false`.
2. **`is_staff` u `UserResource` je bio neupotrebljiv.** Racunao se kao
   `hasRole(['admin', 'editor'])` — malim slovima — dok seeder pravi `Editor`,
   `Editor-in-Chief`, `Super Admin`. Spatie poredi imena tacno, pa je i za
   glavnog urednika vracao `false`. Sad koristi `isEditorialStaff()`, helper
   koji model vec ima.

Novi `CommentAuthorResource` salje `username`, `name`, `avatar_url`,
`rank{name,color}` i `is_staff`. `CommentPayloadTest` (4 testa) je ograda: pada
ako neko vrati pun `UserResource` ili doda polje iz navike.

---

## 8. Zdravo (izmjereno)

- LCP: `/forum` 0,35 s, `/leaderboard` 0,37 s, `/games` 0,66 s, `/calendar`
  0,72 s, `/latest` 0,75 s. CLS **0,000** svuda. (`/latest` je prije prolaza sa
  slikama bio 14 s.)
- 14 error boundary fajlova plus `global-error` i `not-found`; axios presretač
  za 401/419.
- Nema promjenjivog `static` stanja u servisima; nema procurjelih `setInterval`
  ni `addEventListener` na frontu.
- Potpis PayPal webhooka se stvarno provjerava — poziva PayPal-ov
  `verify-webhook-signature`.
- Puna backend suita: **420 prolazi**, 1 preskočen, 1.500 tvrdnji.
