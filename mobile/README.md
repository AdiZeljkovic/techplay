# TechPlay — mobilna aplikacija

Expo / React Native klijent za techplay.gg. Ovaj dokument je **stanje na dan
27. 9. 2026** — šta radi, šta ne, i šta je sljedeće. Pisan je da se za mjesec
dana može nastaviti bez čitanja cijelog koda.

Rad je bio pauziran od 9. 9. do 27. 9. Tog dana su odrađene četiri stavke koje
su ovdje stajale kao sljedeće: kalendar, jedinstven jezik dugmadi, sadržaj
ispod članka i stranica igre.

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
| `(tabs)/calendar` | Kalendar — hero, brojač, filteri, wishlist i podsjetnik | ✅ prati sajt |
| `(tabs)/profile` | Profil / poziv na prijavu | ⚠️ nije provjeren prijavljen |
| `news/[slug]` | Članak — tijelo u WebView-u, povezani, komentari | ✅ |
| `games/[slug]` | Igra — key art, galerija, trailer, slični, članci | ✅ |
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

**Kalendar traži KLJUČ platforme, katalog traži NAZIV.** Oba endpointa vraćaju
isti oblik `{key, label}` i imaju suprotna pravila. `/calendar?platform=Xbox`
vraća **422**, `platform=xbox` radi. Sort se zove `anticipated`, ne `hype` —
`hype` je kako ga sajtov UI zove i takođe je 422. Provjereno na živom
endpointu; pretpostavka po analogiji s katalogom je bila pogrešna.

**Greška pri osvježavanju mora se vidjeti i kad podaci već postoje.** Ako
poruka stoji samo u `ListEmptyComponent`, neuspio filter ostavi prethodnu
listu na ekranu i izgleda kao filter koji je sve propustio. Kalendar je crtao
tačno to.

**Članci iz `/games/{slug}/bundle` nisu istog oblika kao iz feeda** — slika je
`image`, ne `featured_image_url`. Pogrešno ime ne puca, nego nacrta sive
pravougaonike koji izgledaju kao slike koje se nisu učitale. Isti bundle nosi
i `path` (sekcija na webu) — **ne koristiti za navigaciju**: aplikacija ima
jedan čitač za sve četiri sekcije i do svake dolazi po slugu, kako piše u
`lib/feed.ts`.

**WebView u skroleru mora javiti visinu, i to više puta.** `readerHtml` šalje
`{type:'height'}` na load, na svaku sliku i kroz `ResizeObserver`. Jedno
javljanje nije dovoljno — prvi broj je pogrešan čim slika dođe ili se font
zamijeni, a članak tada ostane presječen usred rečenice. Uz to `scrollEnabled`
mora biti isključen, inače se dva skrolera otimaju oko istog prsta.

---

## Urađeno 27. 9. 2026.

**Kalendar** (`lib/calendar.ts`, `(tabs)/calendar.tsx`) — hero s najvećim
izdanjem mjeseca, brojač, filteri po platformi, žanru i redoslijedu, oznake
platformi uz svaku igru, i **wishlist i podsjetnik kao prave akcije**.
Odjavljenom otvaraju prijavu. Podaci su cijelo vrijeme bili u odgovoru
(`wishlisted`, `reminder`), ekran ih je bacao.

**Jedan jezik dugmadi** — svih 25 poziva je `CommandButton`. `Button.tsx` je
obrisan; nekorištena komponenta koja radi pogrešnu stvar je način na koji se
podjela vrati.

**Članak** (`components/Comments.tsx`, `lib/comments.ts`) — „Read next" i
komentari s odgovorima, rang-bedževima, oznakom redakcije i glasanjem. Offline
nema komentara: sačuvana kopija nema `id`, a izmišljen `id` objavi komentar na
tuđi članak.

**Stranica igre** — prebačena na `/games/{slug}/bundle` (jedan upit umjesto
četiri), key art kao podloga, oznake platformi, ESRB u boji, galerija s
pregledom preko cijelog ekrana, trailer, slične igre i naši članci.

---

## Šta je sljedeće

### 1. Forumske teme na stranici igre

Jedina stavka sa starog spiska koja nije odrađena. `threads_count` je u
odgovoru; sam popis tema traži još jedan poziv i treba provjeriti ima li ga
bundle.

### 2. Ostalo, sitnije

- profil prijavljenog korisnika nije vizuelno provjeren
- `cookie banner` se pojavljuje unutar `web.tsx` WebView-a. Namjerno nije
  sakriven — sakrivanje mehanizma za pristanak nije stilska odluka. Aplikacija
  će prije prodavnice trebati vlastiti pristanak.
- provjera prekinutog zahtjeva je sada u katalogu **i u kalendaru**; ostali
  ekrani je još nemaju

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
