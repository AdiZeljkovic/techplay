# P7 — Next.js u dubinu (11.08.2026)

Paket je krenuo od dvije pretpostavke koje je plan nosio od `docs/34`. **Obje su
izmjerene i obje padaju.** Vrijednost ovog paketa nije popravka nego to što
skida s liste posao koji ne bi ništa dao.

Ništa nije promijenjeno u kodu. Jedna izmjena je napravljena, izmjerena i
**vraćena** — vidi kraj.

---

## Pretpostavka 1: "dvije trećine komponenti su nepotrebno klijentske"

Brojka je tačna: **228 od 318** `.tsx` fajlova nosi `"use client"`. Ali sama po
sebi ne znači ništa.

Automatska provjera je tražila komponente koje nose direktivu a nemaju **nijedan**
klijentski signal — bez `useState`/`useEffect`, bez `onClick`, bez `window`, bez
klijentskih biblioteka:

| | |
|---|---|
| klijentskih ukupno | 228 |
| s pravim razlogom | 185 |
| **bez ijednog signala** | **43** |

Izgleda kao 43 komponente za prebacivanje na server. Nije — jer komponenta
unutar klijentske granice **ostaje klijentska bez obzira na direktivu.**

Kad se pita ono što se stvarno pita — *renderuje li je ijedna server
komponenta* — ostaje:

| | |
|---|---|
| stvarna dobit | **2** (`GlobalSeo`, `RoadmapClient` — ukupno 2,2 KB izvora) |
| bez dobiti (roditelj im je već klijentski) | 39 |

Dakle skidanje direktiva nije posao. **Problem su granice, ne direktive.**

### Gdje su granice povučene

Ovo je mjera koja nešto znači: koliko izvornog koda svaka klijentska granica
tranzitivno povlači u browser.

| Granica | Povlači | Fajlova |
|---|---:|---:|
| `app/HomeGate.tsx` | **320,0 KB** | 63 |
| `components/wow/WowAnalyzerClient.tsx` | 218,0 KB | 19 |
| `components/layout/AppShell.tsx` | 176,1 KB | 20 |
| `components/reviews/ReviewDetailView.tsx` | 168,5 KB | 27 |
| `app/clans/[slug]/base/BaseClient.tsx` | 158,4 KB | 14 |
| `components/news/ArticleDetailView.tsx` | 154,2 KB | 27 |
| `components/guides/GuideDetailView.tsx` | 154,1 KB | 26 |
| `app/clans/[slug]/ClanDetailClient.tsx` | 152,1 KB | 14 |
| `app/settings/SettingsClient.tsx` | 126,7 KB | 16 |
| `app/media-kit/MediaKitClient.tsx` | 125,9 KB | 9 |

Ukupno 70 granica. `HomeGate` je najskuplja i stoji na najposjećenijoj ruti.

**To je stvarni posao ako se P7 ikad radi do kraja:** spustiti granicu niže —
`page.tsx` ostaje serverski, a `"use client"` ide na najmanji dio koji stvarno
treba interaktivnost. To je prepisivanje kompozicije, ne mehanička zamjena, i
mjeri se po ruti.

---

## Pretpostavka 2: "framer-motion, 164 KB na svakoj ruti"

Netačno za trenutni build.

Mjereno `@next/bundle-analyzer`-om koji projekat već ima (`npm run analyze`):

```
framer-motion: 116,5 KB, razbijen u 10 chunkova
```

Najveći pojedinačni komad je 40,7 KB i sjedi u vlastitom chunku. Next ga već
dijeli po rutama — nema jednog bloka koji svaka stranica plaća.

Rute koje ga stvarno koriste: media-kit (10 fajlova), WoW (10), roadmap (5) —
dakle upravo one koje nisu na kritičnoj putanji.

### Izmjena koja je napravljena i vraćena

Četiri komponente u ljusci koriste `motion.div` i stoje na svakoj ruti: `Header`,
`SearchDropdown`, `CookieConsentBanner`, `Dialog`. Za taj slučaj framer-motion
dokumentuje `LazyMotion` + `m` + `domAnimation` — učitava podskup umjesto cijelog
paketa, bez ijedne vizuelne promjene.

Napravljeno: `MotionProvider` u ljusci, sve četiri prebačene na `m.div`.
TypeScript čist, build prolazi.

Izmjereno:

| | framer-motion | chunkova |
|---|---:|---:|
| prije | 116,5 KB | 10 |
| poslije | 115,8 KB | 14 |

**Ušteda 0,7 KB.** Uz jedan provider više i pomiješane `m` i `motion` kroz
kodnu bazu.

Vraćeno. Optimizacija je ispravna u teoriji i ne bi radila ništa loše, ali ne
zaslužuje složenost koju donosi — Next je taj paket ionako već podijelio.

---

## Usput ispravljeno

`app/template.tsx` je u prvom prolazu ispao kao korisnik framer-motiona. Nije —
komentar u njemu **spominje** framer-motion objašnjavajući zašto je s njega
prešao na CSS. Moja pretraga je hvatala tekst, ne uvoze.

Taj komentar je usput i najbolji obrazac za ovaj problem koji u repou postoji:

> *"CSS animation rather than framer-motion, on purpose: the old version drove
> opacity and transform from JS across the entire page tree on every route
> change, and had no reduced-motion guard."*

Ako se ljuska ikad bude čistila od framer-motiona, to je put — i već je jednom
prošao.

---

## Šta ostaje kao stvarni posao

Poredano po odnosu dobiti i rizika:

1. **Spustiti granicu na `HomeGate`** — 320 KB kroz 63 fajla na najposjećenijoj
   ruti. Vrijedi mjeriti prije i poslije, po ruti, a ne po zbiru chunkova.
2. **`ReviewDetailView` / `ArticleDetailView` / `GuideDetailView`** — tri
   granice po ~155 KB s gotovo istim sadržajem. Vjerovatno dijele kompoziciju
   koja se može podići na server jednom za sve tri.
3. **Backend strana P7** (granice servisa, događaji, poslovi, middleware) —
   nije rađena u ovom prolazu.

## Metodološka napomena

Prva dva mjerenja koja sam napravio bila su pogrešna i vrijedi zapisati zašto,
da se ne ponove:

- **Zbir svih chunkova** (5,5 MB) ne mjeri ništa korisno — bitno je šta učitava
  jedna ruta, ne koliko ih ima ukupno.
- **`rootMainFiles` iz manifesta** (478,6 KB) je React/Next runtime, isti prije i
  poslije svake izmjene aplikacije. Mjerio sam framework, ne svoj kod.

Jedini alat koji je dao upotrebljiv odgovor je `npm run analyze`, koji je u
projektu stajao spreman.
