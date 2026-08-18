# Koliko brz admin panel može biti

*Istraživanje 18.08.2026. Sve mjereno kroz pun Laravel zahtjev na produkciji,
najbolje od četiri prolaza, poslije zagrijavanja.*

Pitanje je bilo: ima li boljeg rješenja od podešavanja, da panel zaista bude brz.

Kratak odgovor: **postoji pod od 76 ms koji se ne može spustiti bez napuštanja
Filamenta, i dvije poluge iznad njega — obje s cijenom.**

---

## Gdje vrijeme stvarno odlazi

| Stranica | Vrijeme | HTML | Upita |
|---|---|---|---|
| API ruta (`/api/v1/system/status`) | **2 ms** | — | 0 |
| Admin ljuska (`/admin`, widgeti lazy) | **76 ms** | 152 KB | **0** |
| Broken Links (21 red) | 180 ms | 555 KB | 2 |
| Settings (obrazac, bez tabele) | 224 ms | 283 KB | 2 |
| News (25 redova) | 269 ms | 689 KB | 5 |

Dvije stvari koje ovo odmah kaže:

**Baza nije problem.** Ljuska radi **nula upita** i troši 76 ms. Liste rade 2–5
upita, ukupno 2–13 ms. Sve ostalo je PHP.

**Nije ni Laravel, ni naš kod.** Obična API ruta kroz isti kernel odgovara za
**2 ms**. Razlika od 74 ms je Filamentovo iscrtavanje panela — sidebar, topbar,
Blade komponente.

## Koliko košta jedan red tabele

Skaliranjem po broju redova: **~8 ms i ~21 KB po redu.**

Sastav jednog reda:

| | |
|---|---|
| bijeli prostor (uvlake) | **67%** |
| `<td>` ćelije ukupno | 84% |
| SVG ikonice | 11% |
| `class` atributi | 8% |
| `wire:` i `x-` atributi | 8% |

Dvije trećine su uvlake iz Blade predložaka. **Ali to ne košta prenos** — admin
HTML ide brotlijem, 35 KB se prenese kao 6. Košta samo generisanje, a generisanje
bajtova je jeftino; skupo je ono što se radi po ćeliji.

---

## Šta je probano i **ne** pomaže

| Ideja | Zašto ne |
|---|---|
| Keširanje navigacije | već je 0,3 ms i nula upita |
| `wire:navigate` / SPA | isti HTML, isto vrijeme — SPA štedi pregledniku, ne serveru (mjereno: 82 ms naspram 90) |
| Livewire 4 „islands" | postoje u Livewireu 4.3, ali **Filament ih ne koristi** — tražilo bi prepravljanje njegovih predložaka |
| Više indeksa | ljuska ne radi nijedan upit; liste troše 2–13 ms u bazi |
| OPcache podešavanja | FrankenPHP nosi svoj PHP i već ga ima |
| Minifikacija HTML-a | kompresija to već rješava na žici |

---

## Dvije poluge koje stvarno rade

Mjereno na `/admin/news-articles`:

| Postavka | Vrijeme | HTML | Cijena |
|---|---|---|---|
| Kako jeste, 25 redova | 269 ms | 689 KB | — |
| **10 redova** | **189 ms** | 410 KB | vidi se manje redova |
| **`deferLoading()`** | **102 ms** | 194 KB | kostur na trenutak |
| Oboje | **100 ms** | 194 KB | oboje |

### `deferLoading()`

Isto ono što Dashboard već radi sa svojim widgetima: stranica se pošalje odmah,
tabela stigne drugim zahtjevom uz kostur koji Filament sam crta.

**Trošak treba reći naglas:** ukupan rad servera raste sa 206 na 256 ms, dakle
oko 24% više — ali stranica se pojavi za **42 ms umjesto 206**, pet puta brže do
prvog crtanja.

### Manje redova

Bez ikakvog bljeska, samo manje redova. Na telefonu se 25 redova ionako ne vidi
odjednom.

---

## Zaključak

Unutar Filamenta **nema boljeg rješenja od ta dva.** Pod od 76 ms je cijena
okvira: panel s 35 stavki u sidebaru, topbarom i Livewire komponentom oko svega.
Da bi se ispod toga sišlo, panel ne bi smio biti Filament — a to je zamjena
alata, ne optimizacija.

Ono što jeste na stolu:

1. **`deferLoading` na teškim listama** — igre, članci, komentari. Tamo se
   dobitak osjeti, a ekrani koji se ionako crtaju za 100 ms ostaju bez bljeska.
2. **10 redova umjesto 25** na tim istim listama.

Zajedno: **269 → 100 ms** na najtežem ekranu, uz kostur koji traje jedan treptaj.

Za mjeru: prije ove sesije `/admin/games-database` je trošio 362 ms samo na
tabelu, s upitom od 198 ms. Sada je cijela stranica 213 ms, a upit 2 ms.

---

## Primijenjeno *(18.08.2026)*

`deferLoading()` je uključen **globalno**, u `Table::configureUsing` gdje već
stoje ostale konvencije liste — ne na izabranim ekranima.

Mjerenje svih 38 lista je promijenilo prvobitni plan: **nema izdvojeno teških.**
Sve su bile 210–280 ms jer sve prikazuju 25 redova, pa bi primjena na tri
ostavila trideset četiri nepromijenjena.

Broj redova je ostao 25. S uključenom odgodom deset i dvadeset pet daju isto
~100 ms, jer redova nema u prvom odgovoru ni u jednom slučaju — smanjivanje bi
bilo gubitak bez dobitka.

### Rezultat na svih 38 lista

| | Prije | Poslije |
|---|---|---|
| Prosjek | 174 ms | **95 ms** |
| Najsporija | 283 ms | **119 ms** |
| Prosječan HTML | ~600 KB | **182 KB** |
| Lista koje ne vraćaju 200 | 0 | **0** |

### Provjereno da nije samo brže nego i tačno

Svaka od 38 lista je montirana, pa joj je pozvano učitavanje tabele, pa je
prebrojano koliko redova stigne — i uporedeno s brojem zapisa u bazi:

| | |
|---|---|
| Tabela koje se učitaju s redovima | **32** |
| Tabela koje su prazne jer nema zapisa | 6 |
| Tabela koje ostanu prazne a imaju zapise | **0** |

Healthcheck svih osam stavki zelen, sajt i API netaknuti.
