# P3 — Ulazna i API sigurnost (10.08.2026)

Treći paket iz `docs/35-plan-pune-analize.md`. Za razliku od P1 i P2, ovdje je
većina već bila u redu — pa je vrijedno zapisati i šta je **provjereno i
odbačeno**, jer je to jednako korisno kao i popravke.

## Tri stvarne rupe

### 1. Admin uploadi su primali SVG

Filamentov `->image()` se raširi u `image/*`, a to uključuje `image/svg+xml`.
SVG je kontejner za skriptu. Deset upload polja koristilo je golo `->image()` —
media picker, logo organizacije, OG slike, proizvodi, oglasi, giveaway, vodiči.

Zašto to nije sitnica: fajl završi na javnom disku i poslužuje se s
`api-beta.techplay.gg` — **isto porijeklo na kojem stoji Filament sesijski
kolačić**. Novinar (najniža rola s pristupom panelu) mogao je postaviti SVG i
poslati link administratoru.

Laravel je svoje `image` pravilo očistio od SVG-a u v11; Filamentov pomoćnik to
nije pratio.

Popravka je jedna, u `AppServiceProvider`:

```php
FileUpload::configureUsing(fn (FileUpload $u) => $u->rule('mimes:jpeg,jpg,png,gif,webp,avif'));
```

Namjerno **pravilo**, a ne `acceptedFileTypes`: pravila se gomilaju, pa ih
kasniji `->image()` ne može proširiti nazad — i upload dodat sutra je pokriven
bez da se iko sjeti.

### 2. `seo_text` se čuvao i renderovao sirov

`PageSeo.seo_text` je RichEditor polje koje frontend ispisuje kroz
`dangerouslySetInnerHTML` (`components/seo/SeoContent.tsx`) — **bez sanitizacije
na upisu i bez sanitizacije na prikazu**. Tijela članaka, recenzija i vodiča sva
prolaze kroz `sanitizeStaffContent`; ovo polje je preskočeno.

Teže je nego što izgleda: blok se renderuje na `techplay.gg`, a to je porijeklo
na kojem `AuthContext` drži bearer token svakog posjetioca u `localStorage`.
`innerHTML` ne izvršava `<script>`, ali uredno izvršava `<img onerror>`. Piše ga
svako s `manage content`.

Popravka: `PageSeoObserver::saving()` sada propušta polje kroz
`sanitizeStaffContent`, isti profil kao i ostatak uredničkog sadržaja.

### 3. Javni profil je slao tuđe stanje novčanika

`GET /users/{username}` je vraćao `stats.bounty_balance` svakome. Frontend ga
prikazuje **samo** iza `isOwnProfile` — dakle nije se ni vidio, samo je stajao u
JSON-u. Skraper time dobija rangiranu listu toga čiji nalog vrijedi uzeti.

Sada se izbacuje iz odgovora za svakoga osim vlasnika.

---

## Provjereno pa odbačeno

Ovo su stvari koje su izgledale kao rupe dok se nisu izmjerile:

- **SVG kroz javni API** — ne prolazi. Laravel 12 `image` pravilo je
  `['jpg','jpeg','png','gif','bmp','webp']`, SVG samo uz eksplicitni
  `allow_svg`. Provjereno u `ValidatesAttributes::validateImage`, ne po
  sjećanju. Svih pet javnih upload tačaka (avatar, cover, chat, journal, clan)
  koristi to pravilo.
- **Imena fajlova** — `store()` generiše nasumičan hash, korisničko ime fajla
  se nikad ne koristi. Nema path traversala.
- **SQL injection** — svi `whereRaw` s promjenljivim vrijednostima koriste
  `?` i vezane parametre (`ARRAY[{$placeholders}]` pa `$bindings` drugi
  argument). Jedini interpolirani izraz je Filamentov `{$direction}` u
  `AdCampaignResource`, a Filament ga normalizuje s
  `=== 'desc' ? 'desc' : 'asc'` prije nego stigne do upita. Sirovi upiti u
  konzolnim komandama nose fiksne liste riječi, ne korisnički ulaz.
- **HTMLPurifier profili** — `staff_content` je dobro postavljen:
  `HTML.SafeIframe` s listom dozvoljenih hostova (YouTube, Vimeo, Twitch,
  Spotify), eksplicitna `HTML.Allowed` bez `script` i bez `on*` atributa,
  ograničene CSS osobine, `Attr.AllowedFrameTargets` samo `_blank`.
- **`processContent`** (`frontend/lib/content.ts`) gradi iframe-ove iz teksta
  poslije sanitizacije — što je klasičan način da se XSS vrati na mala vrata.
  Nije: sve capture grupe su ograničene (`[\w-]{11}` za YouTube, `\d+` za tweet
  id, `[a-zA-Z0-9_-]+` za Instagram), a Facebook URL ide kroz
  `encodeURIComponent`.
- **Forum sadržaj** ima dvostruku zaštitu — `sanitizeRichContent` na upisu i
  DOMPurify na prikazu.
- **Oglasni `code_block`** se renderuje sirov, ali ga piše samo admin (od P2), a
  `innerHTML` ionako ne izvršava `<script>`.
- **Mass assignment** — provjereno u P1, čisto.

---

## Ostavljeno namjerno

**Enumeracija korisnika pri registraciji.** `RegisterRequest` koristi
`unique:users,email`, pa 422 otkriva da adresa ima nalog. Ispravno rješenje je
vratiti isti odgovor kao za uspjeh i poslati pravom vlasniku e-mail "neko je
pokušao registrovati tvoju adresu".

Nisam to uradio jer mijenja tok registracije i traži novi e-mail predložak — a
korisnik koji je zaboravio da ima nalog dobio bi tišinu umjesto poruke. To je
proizvodna odluka, ne sigurnosna. Turnstile stoji ispred, pa svako pogađanje
košta rješavanje captche.

**Jedan `FormRequest` po write-endpointu.** Plan to traži umjesto inline
validacije na ~296 mjesta. To je refaktor veličine vlastitog paketa i ne mijenja
sigurnosno stanje — validacija **postoji** svugdje, samo je inline. Vrijedi ga
raditi kad se dira endpoint, a ne kao jedan veliki prolaz.

`ImageUploadRequest` (koji plan spominje kao "postoji i niko ga ne koristi")
ostaje neiskorišten, ali je sada bezopasan: globalno `mimes` pravilo pokriva
admin uploade, a javni idu kroz Laravelovo `image`.

---

## Testovi

`tests/Feature/InputHardeningTest.php` — `seo_text` gubi `onerror` i `<script>`
prije upisa, a posjetilac ne dobija tuđi `bounty_balance` dok ga vlasnik dobija.

**380/380 prolazi.**

## Deploy

Nema migracija.

```
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Napomena: postojeći `seo_text` zapisi **nisu** retroaktivno očišćeni —
sanitizacija radi pri upisu. Ako želiš da se prođe kroz zatečene, to je jedan
`PageSeo::each(fn ($p) => $p->save())`, ali prvo vrijedi pogledati ima li ih
uopšte s markupom.
