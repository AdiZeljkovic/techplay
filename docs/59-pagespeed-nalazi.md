# PageSpeed nalazi i popravke — 14.08.2026.

Polazna tačka: PSI izvještaj za desktop `techplay.gg` (FCP 0,3 s · **LCP 2,7 s** ·
**TBT 470 ms** · CLS 0 · SI 2,4 s). Umjesto nagađanja iz slike, izvučen je pun
Lighthouse izvještaj (`--preset=desktop`), pa su nalazi rađeni iz podataka.

---

## 1. LCP: naslov koji je bio u HTML-u, ali nevidljiv

Lighthouse je kao LCP element prijavio **`<h2>` heroja**, s ovakvom raspodjelom:

| Faza | ms |
|---|---:|
| TTFB | 164 |
| Load Delay | 0 |
| Load Time | 0 |
| **Render Delay** | **3.144** |

Dakle server je odgovorio za 164 ms, teksta nema šta da se učitava — a naslov se
oboji tek na 3,3 s. FCP je pritom bio 0,7 s, što znači da stranica **jeste**
crtala nešto drugo cijelo to vrijeme.

Uzrok je u `HeroSlider`: caption blok je `motion.div` sa
`initial={{ opacity: 0, y: 12 }}`, a framer-motion početno stanje **upisuje u
serverski HTML**. Produkcijski HTML je to i potvrdio — u njemu je stajalo
`style="opacity:0;transform:translateY(12px)"`. Naslov je bio isporučen,
indeksabilan i potpuno nevidljiv dok se React ne hidrira.

Kontrola je bila u istom fajlu: **druga** `AnimatePresence` (ona oko slike) već
ima `initial={false}` i njen `initial={{opacity:0}}` se u HTML-u **ne pojavljuje**.

Popravka je jedan atribut — `initial={false}` na caption `AnimatePresence`.
Prvi slajd se renderuje neproziran, a prelazi između slajdova i dalje rade.

**Izmjereno poslije** (lokalni produkcijski build, 4× uspореno CPU, produkcijski
podaci): caption ima `opacity: 1` **već u prvom uzorku na 550 ms**, umjesto da
čeka hidraciju. U SSR HTML-u je ostao samo jedan `opacity:0` — cookie banner,
kojem to i treba.

Hero slika je usput provjerena: **jest** predučitana (`<link rel="preload"
as="image">` s punim `srcset`), i prije i poslije. To nije bio dio kvara.

---

## 2. Avatar od 166 KB u krugu od 20 piksela

Druga po veličini stavka izvještaja bila je "Properly size images — 526 KiB".
Najveći pojedinačni krivac na naslovnici nije bila nijedna naslovna slika nego
**avatar autora**: `storage/avatars/…jpg`, **166 KB**, crtan kao krug 20×20 px u
`EditorialSpotlight`. Nosio je `unoptimized`, iako je to **naš** upload.

Isti propust je bio i na mjestima gdje se avatari množe:

| Mjesto | Veličina crtanja | Koliko po stranici |
|---|---|---|
| `EditorialSpotlight` (naslovna) | 20 px | 1 |
| `CommentsSection` | 36 / 40 px | koliko i komentara |
| `forum/thread/[slug]` | 48 px | koliko i postova |

Mjereno kroz optimizator: **166 KB → 1,5 KB** na `w=64`. Na forumskoj temi s
trideset postova to je razlika između ~5 MB i ~45 KB avatara.

### Usput ispravljena krhkost

Ostalih šest mjesta koristilo je predikat
`unoptimized={url.includes('discord') || url.includes('gravatar')}`. Taj spisak
je nepotpun: Google OAuth avatar (`lh3.googleusercontent.com`) nije u
`remotePatterns`, a optimizator za neprijavljeni host **ne degradira nego baca
400** — slika bi pukla.

Zato je uvedena jedna provjera, `isOwnUpload()` u `lib/imageUrl.ts`, i pitanje je
okrenuto: optimizuje se **ono što je naše**, sve tuđe prolazi netaknuto. Tako
nema spiska stranih hostova koji treba održavati.

---

## 3. Keš na statici: 4 sata na fajlovima koji se ne mijenjaju

Izvještaj je naveo 7 resursa s prekratkim vijekom (229 KiB): pločice
`quicklinks/`, `techplay-logo.png` i ostala grafika iz `public/`, sve na
Next-ovom podrazumijevanom `max-age=14400`.

Dodato pravilo u `next.config.ts` za `quicklinks/`, `images/`, `ranks/`,
`gta6/`, `frames/`, `rewards/` i brend oznake u korijenu:
`public, max-age=2592000, stale-while-revalidate=604800`.

**Provjereno `curl`-om na buildu**: `Cache-Control: public, max-age=2592000, …`.

> Napomena za ubuduće: ta grafika je verzionisana **imenom fajla**. Ako se
> mijenja slika, mijenja se i ime — mjesec dana keša inače ostaje kod posjetioca.

---

## 4. Sitno: 1920 px varijanta za traku koja je široka 1200

`ProfileCtaBand` je tražio `sizes="… 1280px"`, a prijavljene širine idu
1200 → 1920, pa je za dekorativnu `object-cover` pozadinu dovlačio varijantu od
1920 px. Postavljeno na 1200 px, tačno na prijavljenu širinu.

---

## 5. Šta nije popravljeno i zašto

| Stavka iz izvještaja | Status |
|---|---|
| **Reduce unused JavaScript — 380 KiB** | **312 KiB je tuđe**: AdSense (121), `/rpeu/` (91), gtag (69), adsbygoogle (31). Naši chunkovi su ~70 KiB. Nema šta da se skrati bez izbacivanja oglasa. |
| **Render blocking — 53 KB CSS** | Inlining kritičnog CSS-a traži webpack build; Next 16 gradi Turbopackom (već zabilježeno u `58-audit-optimizacije-ii.md`). Fajl je immutable i keširan, košta samo prvi posjet. |
| **Legacy JavaScript — 14 KiB** | Next-ov vlastiti polyfill chunk (`Array.prototype.at`, `Object.hasOwn`…). Ne vrijedi dirati zbog 14 KiB. |
| **TBT 470 ms / main-thread 4,8 s** | Lokalno neusporeno mjerenje daje **TBT 10 ms** i 687 ms glavne niti. Razlika je usporavanje u PSI-ju plus reklamni stack. Naš JS nije uzrok. |
| **Cloudflare ne kešira HTML** | I dalje otvoreno — promjena u dashboardu, ne u kodu. Vidi `58-audit-optimizacije-ii.md`, sekcija 2. |

---

## 6. Za mjerenje poslije deploya

Ovaj PSI izvještaj je snimljen **prije** nego su popravke slika iz prethodnog
prolaza puštene u produkciju. Stavku "Improve image delivery — 519 KiB" treba
ponovo izmjeriti na svježem buildu prije nego se u nju dalje dira — kao i sam
LCP, koji je ovdje popravljen ali je izmjeren lokalno, ne na produkciji.
