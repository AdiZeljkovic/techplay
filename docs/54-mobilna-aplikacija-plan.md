# Mobilna verzija kao aplikacija — dijagnoza i plan

Datum: 14.08.2026. Status: **Faze 1–5 isporučene.** PWA je van obima.

## Rezultat (mjereno istom skriptom, 390×844, 2×, dodir)

| Mjera | Prije | Poslije | Cilj |
|---|---:|---:|---:|
| Dodira do glavne sekcije | 2–4 | **1** | 1 |
| Prvi sadržaj — feed | ~1.000px | **297px** | < 400 |
| Prvi sadržaj — news | — | **201px** | < 400 |
| Prvi sadržaj — leaderboard | 1.795px | **368px** | < 400 |
| Prvi sadržaj — forum | — | **425px** | < 400 |
| Naslovnica | 10,7 ekrana | **10,0** | < 6 |
| Dodirne mete ispod 44px (7 stranica) | 518 | **205** | 0 kritičnih |
| Tekst ispod 10px | 464 | **0** | 0 |
| Leaderboard, van ekrana | 112 el. | **17** | — |
| Kalendar, male mete | 303 | **44** | — |

Naslovnica je jedini cilj koji nije dostignut: 10 ekrana naspram traženih 6.
Ona je zbir sekcija (hero, discovery, editorial, review wall, baza, CTA) i
skraćivanje ispod šest ekrana znači brisanje sekcije, što je proizvodna
odluka, ne dizajnerska. `—` u tabeli znači da stranica nema sadržaj u obliku
kartice (gusta mreža omota, kalendarska mreža) pa mjera nema šta uhvatiti.

## Šta je ostalo neurađeno

- **Snap rails i skeleti** (Faza 5, drugi dio) — redovi kartica se i dalje
  prelamaju u mrežu umjesto da klize; liste pokazuju spinner umjesto skeleta.
- **Profil ulogovanog korisnika** nije provjeren na telefonu — nema
  prijave iz okruženja u kojem je rađeno. Provjeren je javni profil.
- **Kalendar je i dalje najviša stranica** (11 ekrana).

Cilj: telefon prestaje biti "sajt koji se prelama" i postaje aplikacija. Ne
kopija iOS-a — TechPlay HUD jezik ostaje netaknut, mijenja se **struktura**:
gdje stoji navigacija, čime stranica počinje, kako se otvara izbor, koliko
palac mora putovati.

---

## 1. Izmjereno stanje (14.08.2026, iPhone 390×844, 2× DPR, touch, Safari UA)

Mjereno na živom sajtu pravom emulacijom uređaja (puppeteer-core + sistemski
Chrome), ne procjenom. Skripta je dio isporuke prve faze da se svaka sljedeća
faza mjeri istim metrom.

| Stranica | Visina | Ekrana | Male dodirne mete | Tekst < 12px |
|---|---:|---:|---:|---:|
| Naslovnica | 8.999px | **10,7** | 37 | 93 |
| `/latest` | 9.166px | **10,9** | 27 | 129 |
| Članak | 8.314px | 9,9 | 41 | 42 |
| `/games` | 4.915px | 5,8 | 24 | 118 |
| `/forum` | 3.021px | 3,6 | 28 | 52 |
| `/calendar` | 9.415px | 11,2 | — | — |

Najmanji tekst na sajtu je **8px**. Apple traži 44pt, Google 48dp dodirne
mete — imamo 24 do 41 elemenata ispod te granice po stranici, uključujući
ikone u headeru (40×40) i linkove visine 28px.

### Šta konkretno nije aplikacija

1. **Navigacija je sakrivena.** Jedini put bilo gdje je hamburger →
   preko-cijelog-ekrana drawer → akordeon → link. Dva do četiri dodira do
   svakog odredišta, i to gornjim desnim uglom ekrana — najdalja tačka od
   palca. Drawer sadrži 18 linkova i 5 dugmadi.
2. **Svaka sekcija počinje reklamnim herojem.** `/latest`: 72px header +
   ~490px heroj (naslov + rečenica opisa) + prazan razmak + filter blok koji
   se prelama u tri centrirana reda (~280px). Prva vijest počinje oko 1.000px
   — 1,2 ekrana skrola prije ijednog sadržaja. Isto na `/games`, `/forum`,
   `/leaderboard`, `/giveaways`.
3. **Filteri se prelamaju umjesto da klize.** Pet čipova u tri reda,
   centrirano. Aplikacija to rješava jednim redom koji se horizontalno klizi.
4. **Nema safe-area.** Nula upotreba `env(safe-area-inset-*)` u cijelom
   frontendu, a `manifest.json` traži `display: standalone` — instaliran na
   iPhone, sadržaj ide pod home indicator i notch.
5. **Nema `dvh`.** Dvije upotrebe u cijelom kodu; ostalo je `vh`, koje na
   mobilnom Safariju skače kad se traka adrese skuplja.
6. **Desktop rail nestaje umjesto da se preseli.** 29 mjesta je
   `hidden xl:flex` — na telefonu taj sadržaj (i reklame koje smo tamo
   stavili) jednostavno ne postoji. Samo 8 mjesta u cijelom kodu je
   mobilno-specifično (`md:hidden`), naspram 875 desktop breakpointa.
7. **Footer je pun desktop footer** i na telefonu — ispod buduće tab trake
   bio bi zid linkova.

---

## 2. Šta istraživanje kaže

Konsenzus 2026: **3–5 odredišta u donjoj traci, ostalo iza "More"**.
Prelazak s hamburgera na vidljivu tab traku podiže sesije po korisniku i
otkrivanje funkcija za 30%+; hamburger prepolovi otkrivanje jer što nije na
ekranu ne postoji. Preporučeni hibrid: vidljive glavne destinacije + skriveno
sekundarno.

Za "domaći" osjećaj na webu bez native ljuske ključni su: donji listovi
(bottom sheets) građeni na CSS `scroll-snap` (fizika skrola ide na
kompozitor, ne na glavnu nit), `dvh` jedinice, `env(safe-area-inset-*)`,
`scroll-snap` rails, i odziv na dodir umjesto hover stanja.

Izvori na dnu dokumenta.

---

## 3. Principi ove izvedbe

- **Jedan DOM.** Bez mobilnih ruta i bez dupliranog markupa — dva H1 na
  istoj stranici su SEO šteta, a ovaj sajt živi od SEO-a. Ljuska se mijenja,
  stranice se sabijaju. Gdje ponašanje mora biti drugačije (filter kao list
  umjesto sidebara), jedna komponenta mijenja oblik; `matchMedia` se koristi
  samo za ponašanje nakon montiranja, nikad za početni markup — inače puca
  hidracija.
- **HUD ostaje.** Oštri radijusi, Archivo, crveni akcent, hairline linije.
  Aplikacijski je raspored, ne tuđa koža.
- **Ikone crtamo mi.** Tab traka dobija naš set po receptu iz
  `design/README.md` (trim na alpha bbox → duža ivica na 90% od 256 →
  centriranje), suđen na contact sheetu u stvarnoj veličini.
- **Svaka faza je isporučiva sama.** Nakon svake se sajt može pustiti.
- **Svaka faza se mjeri istom skriptom** koja je dala tabelu gore.

---

## 4. Faze

### Faza 1 — Ljuska (najveći pojedinačni dobitak)

- **Donja tab traka**, `< md` (768px), 5 odredišta, ikona + labela,
  aktivno stanje u akcentu, `padding-bottom: env(safe-area-inset-bottom)`.
  Sakriva se na stranicama gdje smeta (editor threada, checkout, lightbox).
- **Kompaktan gornji bar**, 52px umjesto 72px: na tab stranici logo +
  pretraga; na detaljnoj stranici **strelica nazad + naslov stranice**.
  Skriva se pri skrolu naniže, vraća se pri skrolu naviše.
- **Hamburger postaje "More" list** — samo sekundarno (shop, giveaways,
  leaderboard, guides, WoW, pravila, kontakt), bez akordeona.
- **Safe-area i `dvh`** kroz cijeli sistem; `100vh` → `100dvh` sweep.
- **Dodirni sloj**: `-webkit-tap-highlight-color: transparent`, `:active`
  pritisak na svemu što se dodiruje, `touch-action: manipulation`,
  `overscroll-behavior` da drawer/sheet ne vuče stranicu ispod sebe.
- **Footer na telefonu** se skuplja na jedan red (logo, tri linka, socijalne)
  jer navigaciju sad nosi tab traka.
- **`scripts/mobile-audit.mjs`** ulazi u repo.

### Faza 2 — Kako stranica počinje

Za `/latest`, `/news`, `/reviews`, `/hardware`, `/guides`, `/games`,
`/forum`, `/leaderboard`, `/giveaways`, `/calendar`:

- Reklamni heroj na telefonu se svodi na **jedan red**: naslov sekcije
  (ostaje `h1`, ostaje u DOM-u zbog SEO-a) + broj stavki. Opisna rečenica i
  stat čipovi idu iz prvog ekrana.
- Filteri i tabovi: **jedan horizontalno klizeći red** sa `scroll-snap`, bez
  prelamanja, ljepljiv ispod gornjeg bara.
- Cilj: **prvi sadržaj iznad 400px** na svakoj sekciji, mjereno skriptom.

### Faza 3 — Donji list (bottom sheet) kao osnovni izbor

- Jedan primitiv `<Sheet>` na CSS `scroll-snap` mehanici, s ručkom, snap
  tačkama i swipe-to-dismiss, `dialog` semantika zbog fokusa i čitača.
- Prelaze na njega: filteri baze igara, sortiranje, dijeljenje članka,
  "dodaj u listu", odabir platforme, reakcije, prijava sadržaja.
- Sve što je danas desktop dropdown ili centrirani dijalog.

### Faza 4 — Ključni ekrani

- **Članak**: kompaktan bar s nazad + naslovom, traka napretka čitanja,
  dijeljenje kao list, ljepljiva donja akcijska traka (sačuvaj / komentari /
  dijeli), breadcrumb koji trenutno ističe van ekrana — van.
- **Igra**: hero u aplikacijskom omjeru, ljepljiv red akcija (dodaj u
  kolekciju / wishlist / ocijeni), sekcije kao klizeći rails.
- **Thread**: ritam poruka umjesto foruma iz 2008 — avatar uz tekst, ne
  kolona sa strane; odgovor kao ljepljivo polje na dnu.
- **Profil**: mobilni raspored panela Command Centra (hero, ladder, sekcije
  kao klizeći rails), bez gubitka ijedne funkcije.

### Faza 5 — Liste, rails i reklame na telefonu

- Kartice u redovima sa `scroll-snap` klizanjem gdje danas stoji mreža koja
  se prelama.
- Skeleti umjesto spinnera na svim listama.
- **Mobilni reklamni raspored**: rail jedinice su `hidden xl:flex`, pa
  telefon danas nosi samo in-article. Dodati display jedinicu na prelaze
  sekcija na telefonu, in-feed već radi.

### Van obima: PWA

Service worker, offline ljuska i install prompt **se ne rade** — odluka
korisnika 14.08.2026. Cilj je da mobilni web izgleda i radi kao aplikacija,
ne da se instalira kao jedna. `manifest.json` ostaje kakav jeste.

Safe-area ipak ostaje u Fazi 1: home indicator i notch odsijecaju sadržaj i
u običnom Safariju, ne samo u instaliranoj ljusci.

---

## 5. Provjera

Poslije svake faze, ista skripta i ista tabela. Ciljevi na kraju:

| Mjera | Danas | Cilj |
|---|---:|---:|
| Dodira do bilo koje glavne sekcije | 2–4 | **1** |
| Prvi sadržaj na sekcijskoj stranici | ~1.000px | **< 400px** |
| Dodirne mete ispod 44px | 24–41 | **0** kritičnih |
| Tekst ispod 11px | 42–129 | **0** |
| `env(safe-area-inset)` | 0 upotreba | ljuska pokrivena |
| Visina naslovnice | 10,7 ekrana | **< 6** |

Plus ručno na pravom telefonu: instaliran PWA, rotacija, tastatura preko
polja, povratak nazad gestom.

---

## Dopuna 15.08.2026. — "zumiranje razbija raspored"

Prijavljeno kao zoom bug: na iPhoneu se rezolucija pomjeri i sve stoji ukoso —
naslov panela odsječen s lijeve strane, logo napola.

**Izmjereno prije nego dirano.** Stranica se **ne** prelijeva bočno:
`document.documentElement.scrollWidth` je tačno **390** na `/`, `/latest`,
`/games`, `/forum`, `/login` i `/search`. Elementi širi od ekrana postoje
(dekorativni sjaj `-left-32 w-[520px]`, vodoravne trake sa `snap-start`), ali
su svi unutar `overflow-hidden` — što `scrollWidth` i dokazuje.

Uzrok je drugi: **iOS sam zumira stranicu kad se fokusira polje čiji je tekst
manji od 16px**, i **ne vrati zoom nazad** kad se polje napusti. Sve poslije
toga se gleda kroz pomjeren viewport, a sve što je `position: fixed` — header,
tab bar, sheet s notifikacijama — raspoređeno je prema stranici, pa ispadne
napola izvan ekrana. Počinje dodirom na pretragu.

Nađeno na svakoj mjerenoj stranici: pretraga u headeru **14px**, pretraga igara
**13,5px**, forum **13,5px**, email i lozinka na prijavi **14px**.

**Gašenje zooma nije bilo rješenje.** Safari ignoriše `user-scalable=no` od
iOS 10, pa `maximumScale: 5, userScalable: true` ostaje kako jeste — oduzeti
pinch-zoom ljudima kojima treba je loša mijena za bug koji ima uzrok.

Popravka je jedno pravilo u `globals.css`, unutar postojećeg
`@media (hover: none) and (pointer: coarse)` sloja: polja za unos idu na 16px.
`!important` je namjeran — mora nadjačati utility klasu koja je i postavila
manju veličinu. Polja bez teksta (checkbox, radio, range, color) su izuzeta.

**Provjereno poslije**: 0 polja ispod 16px na šest stranica, `scrollWidth` i
dalje 390. Usput je skraćen placeholder u pretrazi igara, jer se na 16px
prelamao usred riječi.

---

## Izvori

- [Mobile Navigation UX Best Practices, Patterns & Examples (2026)](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [App Navigation Patterns: Tab Bar vs Hamburger vs Bottom Sheet](https://www.appypie.com/blog/app-navigation-patterns)
- [Bottom Tab Bar Navigation Design Best Practices](https://uxdworld.com/bottom-tab-bar-navigation-design-best-practices/)
- [Hamburger Menu vs Tab Bar: Which Works Better?](https://www.onething.design/post/hamburger-menu-vs-tab-bar)
- [Native-like bottom sheets on the web: the power of modern CSS](https://viliket.github.io/posts/native-like-bottom-sheets-on-the-web/)
