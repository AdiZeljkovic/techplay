# Audit performansi i slika — 14.08.2026.

Metod: obiđeno 46 stranica produkcije pravim browserom, popisano **918 slika**
sa **kutijom u kojoj se crtaju** i **fajlom koji je stigao**. Uz to težina
stranica po tipu resursa i vremena odziva API-ja.

---

## 1. Težina — sedam megabajta s tri stranice

Kartice u listama renderovale su **naše vlastite uploade** običnim `<img>` i
sirovim storage URL-om. Rezultat: JPEG od 3840×2160 sletio bi u karticu visoku
**150px**, a iste te fajlove su vukle i sličice u rail-u u kutiju **52×36**.

Optimizacija je za naše uploade **oduvijek bila uključena** — konfiguracija to
kaže i naslovnica je već koristi — samo ova mjesta nikad nisu. Prebačeno na
`next/image` sa `sizes` koji odgovara mreži:

| Stranica | Prije | Poslije | Slike prije → poslije |
|---|---:|---:|---|
| `/latest` | 7,41 MB | **1,07 MB** | 6,53 → 0,56 MB |
| `/news` | 6,47 MB | **1,06 MB** | 5,58 → 0,55 MB |
| `/reviews` | 7,20 MB | **1,07 MB** | 6,31 → 0,56 MB |

Najveća pojedinačna slika: **1158 KB → 80 KB**.

---

## 2. "Broken prikazivanje" — nađeno

### 2.1 Hero na stranici igre

Pozadina heroja bila je **omot igre**, a omot je portretna kutija ~310×440.
Rastegnut preko trake 1440×242 uz `object-cover` to je **4,6× uvećanje
izrezano na pojas** — hero za Red Dead Redemption bio je cijev pištolja,
neprepoznatljiv i blokast. I tako na svih 140.000 stranica igara, svaka sa
svojom verzijom istog problema.

Sad se koristi **screenshot** (pejzažni, 1200×675), koji je oblik koji ovaj
slot i traži. Omot ostaje kao rezerva za igre bez screenshota i tamo dobija
blur — uvećanje koje je očito namjerno čita se kao pozadina, oštro se čita kao
greška.

### 2.2 GTA 6 oružja

Ilustracije oružja su izrezane, a neke su trake: **palica 713×58**, **RPG
709×125**. U kartici 4:3 s `object-cover` vidjela se samo sredina — za palicu
komad drveta bez oba kraja. Ta mreža sad koristi `object-contain`. **Samo ta
mreža**: ista kartica crta i likove i vozila, koji su obične fotografije kojima
`cover` odgovara.

---

## 3. Šta je zdravo

- **API je brz**: 93–249 ms na svim ključnim rutama (`/home` 93 ms,
  `/games` 249 ms, `/users/{u}/gamer-dna` 158 ms). Nijedan spor endpoint.
- **Naslovnica je bila u redu i prije** (1,38 MB) — jer je već koristila
  optimizovane slike.
- **Nijedna slika nije stvarno slomljena.** Provjereno na 46 stranica plus 24
  nasumične stranice igara kroz cijeli katalog: **0 slomljenih**.

---

## 4. Dva lažna nalaza, zabilježena da se ne ponove

Oba su bila greška **instrumenta**, ne sajta:

1. **"4 slomljene slike na naslovnici."** Moj crawler je agresivno skrolovao i
   zatvarao stranicu, pa su slike u letu bile prekinute — `complete=true,
   naturalWidth=0` izgleda identično kao slomljena slika. Dva mirna kruga:
   **0 slomljenih od 33**.
2. **"19 mrtvih MobyGames omota."** `curl` u petlji je dobio 19× kod 000 —
   CDN ograničava brzinu. Isti URL kroz sekundu vraća 200, a browser je već bio
   učitao svih 44 bez ijednog pada.

---

## 5. Ostalo, nepopravljeno

| Nalaz | Napomena |
|---|---|
| **30 slika rastegnutih preko rezolucije** | Najvidljivija: hero kalendara 1440×395 iz fajla 460×215 (Steam header). Izvorni fajl je mali; treba veći izvor, ne drugi CSS. |
| **~389 slika bar 2,5× većih od kutije** | Većina je sad riješena; ostatak su strane CDN slike koje **namjerno** nose `unoptimized` (omot igre sa CDN-a je već mali i keširan). |
| **JS ~0,59 MB po stranici** | Isto na svim stranicama, dakle zajednički bundle. Nije alarmantno, ali je sljedeće mjesto za dobitak ako zatreba. |
