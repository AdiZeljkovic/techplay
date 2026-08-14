# Sigurnosni audit — 14.08.2026.

Obuhvat: backend (Laravel, 271 API ruta), frontend (Next.js), Discord bot,
git istorija, zavisnosti, zaglavlja, CORS, uploadi.

**Metodološka napomena, jer je bitna za povjerenje u ovaj dokument.** Prva
verzija skenera prijavila je 119 nezaštićenih write ruta i dvije rute koje
javno serviraju privatne DM priloge. **Sve je bilo lažno.** Laravel u
`route:list` ispisuje *klasu* middleware-a (`Illuminate\Auth\Middleware\
Authenticate`, `ValidateSignature`), a ne alias (`auth:sanctum`, `signed`) —
moj obrazac je tražio alias. Isto se ponovilo s privatnošću profila (brava
živi u traitu `ProfilePrivacy`, ne u kontrolerima) i s IndexNow ključem (javan
je po dizajnu protokola). Detektor je u svakom slučaju prepravljen da čita
**stvarne nazive iz podataka**, a ne pretpostavke. Ono što slijedi je ono što
je preživjelo provjeru.

---

## 1. Ozbiljno — traži tvoju akciju izvan koda

### 1.1 Lozinka baze je u git istoriji

`deployment/local_export_db.ps1` je nekad sadržao `$env:PGPASSWORD = "Hanan123!"`.
Skripta je popravljena (sad pita za lozinku), ali commit `b948e880` je i dalje u
istoriji, a repo je na GitHubu.

**Brisanje iz radnog stabla ne briše iz istorije. Lozinku treba promijeniti.**

### 1.2 Google/Gemini API ključ je bio u repou i u istoriji

`backend/list-gemini-models.php` — 41 linija debug skripte s ključem
`AIzaSyDzY3n…` u čistom tekstu. **Fajl je obrisan u ovom prolazu.**

Zanimljivo: commit `af0fb3b5` se zove *"security: remove test file with
exposed Google API key"* — dakle jedan takav fajl je već uklanjan, a ovaj je
ostao. Ključ je u istoriji od commita `b62c622d`.

**Ključ treba poništiti u Google Cloud konzoli.**

---

## 2. Popravljeno u ovom prolazu

### 2.1 Opis igre kao XSS površina (~140.000 stranica)

Opisi igara dolaze iz vanjskog kataloga i **nose HTML** (`<p>`, `<a>`, `<em>`).
Renderovali su se kroz `dangerouslySetInnerHTML` **bez sanitizacije** — ni na
ulazu ni na izlazu. Jedino što je sprječavalo pohranjeni XSS je to što
MobyGames slučajno ne servira zlonamjeran HTML.

Sad prolaze kroz isti HTMLPurifier profil kao i forumski sadržaj, i to **na
izlazu** — tako je pokriveno svih 140k redova koji su već u tabeli, a ne samo
sljedeći import.

### 2.2 Giphy ključ u Blade viewu

`const apiKey = 'GlVGYHk…'` u `editorial-chat.blade.php` — literal u viewu je
literal u HTML-u admin stranice i literal u git istoriji, i ne može se
rotirati bez deploya. Sad čita `config('services.giphy.key')`.

Giphy web ključ je po prirodi klijentski, pa je ovo niži prioritet od 1.1 i
1.2 — ali je i dalje kredencijal u kodu.

---

### 2.3 `unsafe-eval` van produkcijskog CSP-a

Produkcijski Next bundle ga ne treba — treba ga samo React Refresh u
developmentu. Dok je stajao, svaki XSS koji bi prošao mogao je graditi kod iz
stringova.

Provjereno na **pravom produkcijskom buildu**, ne na pretpostavci: devet
stranica (naslovnica, feed, baza, stranica igre, članak s reklamama, forum,
login s Turnstileom, leaderboard, kalendar) — **nula CSP prekršaja**, a
`window.adsbygoogle` se učitao kao objekat, što znači da se AdSense loader
izvršio. Reklamni kreativi žive u cross-origin iframeovima sa svojim CSP-om,
pa na njih naš i ne utiče.

Povratak je jedna riječ u `next.config.ts` ako se ikad pokaže problem.

### 2.4 Preusmjerenja iz admina konačno rade

Nije sigurnosno, ali nađeno istim prolazom. **Dvadeset jedno preusmjerenje**
podešeno u Filamentu nije radilo ništa: endpoint koji ih servira kaže da je
"for caching in frontend middleware", a middleware nikad nije napravljen —
fajl koji je postojao uklonjen je zajedno s maintenance modom (`bee11879`).
Živi test prije popravke: stari slug je vraćao **200 umjesto 301**, što je
duplikat sadržaja na sajtu koji živi od pretrage.

Sad se čitaju u `next.config.ts` na buildu — bez middleware-a koji je namjerno
uklonjen i bez troška po zahtjevu. Poštuje se status koji je urednik izabrao
(301 ili 302; `permanent: true` bi svaki pretvorio u 308). Provjereno uživo:
`301 -> /news/…-faster`. Cijena: novo preusmjerenje počne raditi na sljedećem
deployu, ne odmah.

### 2.5 IndexNow

`keyLocation` je pokazivao na `app.url` (API domen) dok se `host` šalje kao
frontend — protokol traži isti host, pa je svaki ping bio odbijan. Sad
pokazuje na frontend, a `next.config.ts` proksira `/{key}.txt` s backenda da
ta putanja stvarno postoji. Rewrite je opsegom vezan za oblik ključa
(`tp` + hex), da ne može zasjeniti `robots.txt` ni `sitemap.xml`.

---

## 3. Šta je zdravo (provjereno, ne pretpostavljeno)

- **Privatnost profila drži.** Svih 13 javnih `/users/{username}/*` ruta
  (kolekcija, dnevnik, DNA, wrapped, aktivnost, liste…) prolazi kroz trait
  `ProfilePrivacy`. Njegov komentar sam objašnjava zašto: *"Gating only the
  profile payload would leave the data one curl away."* Trait rješava i suptilnost
  da javna ruta vidi korisnika samo kroz `sanctum` guard.
- **Nema SQL injekcije.** 45 mjesta koristi `DB::raw/select/statement` —
  **nijedno** ne interpolira promjenljivu; sva koriste bindinge.
- **DM prilozi i slike iz dnevnika nisu javni.** Idu kroz potpisane URL-ove
  koji istječu (`ValidateSignature`), s fajlom van javnog diska. Dizajn je
  objašnjen u kodu: `<img>` tag ne može poslati bearer token.
- **Forum je dvostruko zaštićen** — `sanitizeRichContent` na backendu i
  `DOMPurify.sanitize` na frontendu.
- **PayPal webhook provjerava potpis** (`PAYPAL-TRANSMISSION-*`), odbija 401.
- **Zavisnosti su čiste**: npm 0 ranjivosti (frontend i bot), composer bez
  ijedne prijave.
- **Zaglavlja su jaka** na oba domena: HSTS, X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy, CSP.
- **CORS je eksplicitna lista**, ne `*`, uz `supports_credentials`.
- **Uploadi** su ograničeni na `image` + `max`, CSV import na `mimes:csv,txt`.
  Nigdje nije dozvoljen izvršni tip.
- **Bot token** dolazi iz konfiguracije i nigdje se ne loguje.
- **Ništa tajno nije u klijentskom bundlu**: svih 12 `NEXT_PUBLIC_*` su URL-ovi
  ili javni ključevi (PayPal client id, Turnstile site key, Reverb app key).
- **Nijedan `.env` nije praćen gitom**; nema DB dumpa u istoriji.

---

## 4. Preostali rizici, svjesno prihvaćeni

| Rizik | Zašto stoji |
|---|---|
| **CSP i dalje dozvoljava `unsafe-inline`** | Nextov hidracijski bootstrap i JSON-LD blokovi su inline skripte, a nonce pipeline ne postoji. `unsafe-eval` je **uklonjen iz produkcije** (ostaje samo u developmentu, gdje ga traži React Refresh). |
| **Token u `localStorage`** | Arhitekturna odluka (client-side auth). U kombinaciji s gornjim, XSS = krađa sesije. Alternativa su httpOnly kolačići, što je promjena auth modela. |
| **`AdUnit` renderuje `ad.code_block` sirovo** | Namjerno — "code" reklame su HTML/JS koji admin unosi. Znači: kompromitovan admin nalog = proizvoljan JS na svakoj stranici. |
| **`GET /redirects` je javan** | Izlaže mapu preusmjerenja. Same putanje su ionako javne. Ostaje javan jer ga sad **koristi** frontend build (v. 2.3). |

---

## 5. Ostaje samo tvoja akcija

- **Promijeniti lozinku baze** (u istoriji od `b948e880`).
- **Poništiti Google/Gemini ključ** u konzoli (fajl obrisan, ključ je u
  istoriji od `b62c622d`).

Nijedno se ne može riješiti iz koda: brisanje iz radnog stabla ne briše iz
istorije.

## 6. Raniji nalaz, sada riješen: IndexNow

`IndexNowService` šalje `host` = **techplay.gg**, a `keyLocation` =
`config('app.url')` = **api-beta.techplay.gg**. Provjereno uživo:

```
https://api-beta.techplay.gg/tpa9b1….txt  -> 200
https://techplay.gg/tpa9b1….txt           -> 404
```

IndexNow traži da ključ stoji na **istom hostu** kao poslani URL-ovi, pa je
svaki ping od uvođenja odbijan. Funkcija "javi Bingu i Yandexu na objavu"
tiho ne radi. Popravka: servirati ključ s frontend domena (rewrite u
`next.config.ts`) ili poslati `keyLocation` na frontend.
