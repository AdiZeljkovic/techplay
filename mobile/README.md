# TechPlay — mobilna aplikacija

Expo / React Native klijent za techplay.gg. Ovaj dokument je **stanje na dan
9. 9. 2026**, kad je rad pauziran — šta radi, šta ne, i šta je sljedeće.
Pisan je da se za mjesec dana može nastaviti bez čitanja cijelog koda.

---

## Pokretanje

```bash
cd mobile
npm install
npx expo start --android      # ili --ios
```

Emulator: Android Studio → virtualni uređaj → `npx expo start --android`
sam otvori aplikaciju u Expo Go.

**Ako port 8081 ostane zauzet** nakon pada Metra, novi `expo start` traži
potvrdu za port 8082 i u neinteraktivnom terminalu jednostavno odustane.
Ubij proces koji drži port pa pokreni ponovo.

**Expo Go pokazuje developer meni** na prvom hladnom startu i taj meni krade
fokus — snimak ekrana tada izgleda kao crn ekran, a `uiautomator` prijavi
„Expo Go isn't responding". Nije pad aplikacije. Zatvori meni pa nastavi.

| | |
|---|---|
| API | `EXPO_PUBLIC_API_URL`, podrazumijevano `https://api-beta.techplay.gg/api/v1` |
| Expo SDK | 57 · React Native 0.86.3 · React 19.2.3 |
| scheme | `techplay://` — u Expo Go deep link ide kao `exp://<host>:8081/--/<put>` |
| paketi | `gg.techplay.app` (oba) |
| deep linkovi | `techplay.gg/news/*`, `techplay.gg/games/*` |

`AGENTS.md` u ovom direktoriju kaže jedno i vrijedi ga poštovati: **Expo 57 se
promijenio**, pročitaj verzionisanu dokumentaciju prije pisanja koda.

---

## Šta postoji

Pet tabova, po uzoru na sajtovu donju traku: **Home · Feed · ti · Games ·
Calendar**, s podignutim portretom u sredini.

### Ekrani

| Ruta | Šta je | Stanje |
|---|---|---|
| `(tabs)/index` | Naslovnica: masthead, hero, featured slider, četiri panela, rail-ovi, „Most read" | ✅ prati sajt |
| `(tabs)/news` | Feed — `/feed/latest`, filter sekcija, „For you" (`/feed/personalized`) | ✅ prati sajt |
| `(tabs)/catalogue` | Game Database — hub, četiri ulaza, faset filteri, mreža omota | ✅ prati sajt |
| `(tabs)/calendar` | Kalendar izlazaka, po danima | ⚠️ najveća razlika, vidi dolje |
| `(tabs)/profile` | Profil / poziv na prijavu | ⚠️ nije provjeren prijavljen |
| `news/[slug]` | Članak — tijelo u WebView-u, embedovi | ⚠️ nema ničega ispod teksta |
| `games/[slug]` | Igra — ocjena, opis, vrijeme prelaska, činjenice, polica | ⚠️ nema galerije/trailera |
| `section/[slug]` | News · Reviews · Tech · Guides, svaka na svom endpointu | ✅ |
| `search` | Pretraga igara **i** članaka, gura se iz mastheada | ✅ |
| `library` | Tvoja polica | ✅ |
| `saved` | Offline čitanje — postoji samo u aplikaciji | ✅ |
| `web` | WebView za dijelove sajta bez ekrana | ✅ |
| `sign-in`, `register` | Prijava i registracija (Turnstile) | ⚠️ bez Discorda/Battle.neta |
| `too-old` | Kapija verzije — server može reći da je build prestar | ✅ |

### Biblioteke

`src/lib/` — `api` (fetch + 15 s timeout + 401 handler), `paging` (jedan čitač
za **šest** oblika paginacije koje API šalje), `content`, `feed`, `catalogue`,
`library`, `notifications`, `offline`, `readerHtml`, `session`, `version`.

`src/components/Marks.tsx` — **37 ikona, generisanih iz `lucide-react` verzije
koju sajt ima instaliranu**, ne prepisanih rukom. Ako treba nova, generiši je
istim putem da se setovi ne raziđu. Dvije (`BellMark`, `MoreMark`) su sajtove
vlastite iz `TabMarks.tsx` — lucide ih nema u tom obliku.

---

## Zamke — svaka je plaćena bugom

**Ruta taba ne smije nositi ime direktorija s detaljem.** `(tabs)/games.tsx`
prisvoji `/games` i **zasjeni `/games/[slug]`**: nijedan omot u vlastitoj mreži
se nije otvarao, a `app.json` deklariše intent filter na `techplay.gg/games`, pa
bi u prodavnici tiho pukao svaki podijeljeni link. Zato je fajl `catalogue.tsx`,
a oznaka i dalje „Games".

**Faseti iz `/games/hub` nisu međusobno zamjenjivi.** `platforms=` traži
**naziv** platforme; slanje ključa vrati nula redova — tiho, sa statusom 200.
`era` i `status` primaju **ključeve**. Sajt radi isto (`p.label` za platformu).

**Prekinut zahtjev izgleda kao pad mreže.** `api.ts` svaki `AbortError` pretvara
u `OfflineError`, pa efekt koji se ponovi i prekine prethodni zahtjev ostavi
„No connection" na ekranu koji radi. Provjeri `signal?.aborted` prije nego
prijaviš grešku. **Ovo je popravljeno samo u `catalogue.tsx`** — ostali ekrani
imaju isti obrazac i isti latentni problem.

**API šalje objekte gdje se očekuju skalari.** `esrb_rating` je `{name}`,
`time_to_beat` je `{hastily, normally, completely, count}`. Prvi je rušio
stranicu igre, drugi je ispisivao `[object Object] h` i izgledao kao podatak.
Tipovi se čitaju s živog odgovora, ne pretpostavljaju.

**Tijelo članka mora proći kroz transformaciju embedova.** Editor sprema
zalijepljeni YouTube link kao `<p><a>…</a></p>`; sajt to pretvara u iframe u
`lib/content.ts`. Ista logika živi u `src/lib/readerHtml.ts` — ako se sajtova
promijeni, promijeni i ovu.

**`StyleSheet.absoluteFillObject` ne postoji** u tipovima koje ovaj projekat
razrješava. Piši `position: 'absolute'` s četiri nule.

---

## Gdje smo stali — šta je sljedeće

Redom po veličini dobitka. Prve dvije su dogovorene, samo nisu započete.

### 1. Kalendar — najveća razlika

Sajt (`app/calendar/CalendarClient.tsx`) ima: hero s najvećim izdanjem mjeseca
kao podlogom, statistiku, „this month" traku, filter (platforma / žanr / sort),
„most anticipated", i uz **svaku igru oznake platformi, wishlist i podsjetnik**.

Aplikacija ima samo popis po danima. **Wishlist i podsjetnik su prave akcije s
pravim endpointima** (`POST /calendar/{slug}/reminder`) i aplikacija nema
nijednu — to je i ono za šta će push notifikacije služiti.

### 2. Dva jezika dugmadi — najjeftinija popravka

`CommandButton` (zarez na uglu + šrafura, sajtov `.btn-command`) koristi se na
**3 mjesta**; obični `Button` na **12**. Sajt stavlja `.btn-command` na svaku
primarnu kontrolu. Zato „SIGN IN" na profilu izgleda kao tuđe dugme.

### 3. Članak — nema ničega ispod teksta

Sajt ispod tijela ima preporučene vijesti, dijeljenje, karticu igre, sekciju
kalendara, poziv na registraciju, mrvice i traku napretka čitanja.
**Komentara nema uopšte** — ni prikaza ni pisanja.

### 4. Stranica igre

Nedostaje: podloga od omota, ESRB bedž u boji, ikone platformi, galerija
screenshotova, trailer, forumske teme, slične igre.

### 5. Ostalo, sitnije

- profil prijavljenog korisnika nije vizuelno provjeren
- `cookie banner` se pojavljuje unutar `web.tsx` WebView-a. Namjerno nije
  sakriven — sakrivanje mehanizma za pristanak nije stilska odluka. Aplikacija
  će prije prodavnice trebati vlastiti pristanak.
- provjera prekinutog zahtjeva (gore) treba i na ostalim ekranima

---

## Blokirano na nalozima, ne na kodu

Ništa od ovoga se ne može ni testirati bez naloga:

- **push** (Firebase / APNs)
- **Sign in with Apple** — App Store ga traži čim se pojavi bilo koja druga
  društvena prijava, pa zato Discord i Battle.net još nisu ni dodani
- **`.well-known` fajlovi** za provjerene deep linkove
- **predaja u prodavnice** — Apple 99 $/god (provjera identiteta traje
  sedmicama), Google Play 25 $ jednokratno

Ekran prijave to trenutno pošteno kaže umjesto da glumi da nudi.

---

## Podaci koji su pokvareni u bazi, ne u aplikaciji

`Free Fire` prijavljuje 8.379 sati za „na brzinu" i 90 za „normalno". To je
IGDB izvor i sajt ga prikazuje isto. Ako se ikad bude popravljalo, popravlja se
u katalogu, ne u klijentu.
