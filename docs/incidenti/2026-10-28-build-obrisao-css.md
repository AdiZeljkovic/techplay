# Build koji je obrisao CSS živog sajta — 28. 10. 2026.

Deploy frontenda je pao na samom početku `next build`, ali tek pošto je build
već obrisao `.next/static` i `BUILD_ID` iz foldera iz kojeg živi server servira.
Skripta je stala prije koraka koji vraća stare chunkove, pa je živi sajt ostao
bez CSS-a i JS-a dok nisu ručno vraćeni iz arhive.

## Vremenska linija

Server je na UTC; lokalno je to sat više (28. 10., nešto iza ponoći).

| UTC (27. 10.) | |
|---|---|
| 23:31:03 | `techplay-deploy.sh` (commit `32ddcc5f`, GW2) — backend prošao, migracija prošla, Octane restartovan |
| 23:31:54 | `next build` pada: `ENOTEMPTY: directory not empty, rmdir '.next/server/app/latest.segments/latest'`; `set -e` prekida skriptu |
| ~23:32 | provjera: stranice vraćaju 200 (proces ih drži u memoriji), **CSS i JS vraćaju 500**; u `.next` ostali samo `cache`, `server` i `trace` |
| prije 23:33:25 | `.next/static` vraćen iz `.static-archive` (`cp -rn`) — CSS i JS opet 200 |
| 23:33:25 | ponovni deploy samo frontenda (`frontend --no-pull`) |
| 23:34:52 | drugi build prošao, pm2 restartovan, keševi očišćeni, provjera asseta čista |

## Uzrok

`next build` prvo **briše `.next` u mjestu** (sve osim `cache`), dok živi
`next-server` i dalje radi iz tog istog foldera. Upravo tada je živi server
upisivao ISR osvježenje stranice `/latest` u `.next/server/app/latest.segments/`
— novi fajl se pojavio u folderu koji je build brisao, pa je `rmdir` dobio
`ENOTEMPTY` i build je pao.

Do tog trenutka `.next/static` i `BUILD_ID` su već bili obrisani.
`deploy_frontend.sh` ima `set -euo pipefail`, pa je izašao na grešci builda —
**prije** koraka 3 koji vraća arhivu chunkova u `.next/static`. Ništa drugo u
skripti nije znalo da je živi build ostao polovičan.

## Uticaj, izmjeren

- U prozoru od pada do vraćanja (oko minut i po) kroz nginx **nije stigao nijedan
  zahtjev za `/_next/static`** — bilo je pola jedan noću po lokalnom vremenu.
- **6 zahtjeva za JS je dobilo 500**, svi u 23:33:48–53 — dakle za vrijeme
  **drugog, uspješnog** builda, ne u prozoru incidenta. Vidi „Otvoreno”.
- Najveći rizik nije bio ostvaren: da se `next-server` u tom stanju restartovao,
  ne bi se podigao uopšte (nema `BUILD_ID`) i sajt bi bio dolje, a ne samo bez
  stilova.

## Popravka (B28)

`deploy_frontend.sh`, isti dan:

1. prije builda pravi **hardlink snimak** živog `.next` u
   `/var/www/.techplay-build-snapshots/next.prev` — izvan `frontend/`, bez `cache`,
   i samo ako postoji `BUILD_ID`, da pokvaren `.next` ne pregazi dobar snimak;
2. pad na `ENOTEMPTY` se **ponavlja jednom** — to je sudar, ne greška u kodu;
3. svaki drugi pad, ili drugi `ENOTEMPTY`, **vraća cijeli snimak**, ne restartuje
   pm2 i izlazi s greškom. Živi sajt ostaje na prethodnom buildu, kompletan.

Provjereno u pješčaniku na serveru (lažni `frontend/` i lažni build, skripta
presječena prije pm2/nginx/Cloudflare): ENOTEMPTY pa uspjeh → novi build;
ENOTEMPTY dvaput → stari build vraćen, keš zadržan, izlaz 1; greška kompajliranja
→ bez ponavljanja, stari build vraćen; `.next` bez `BUILD_ID` → zadnji dobar
snimak ostaje i vraća se.

## Otvoreno

**Svaki build frontenda ima prozor bez `.next/static`.** Build ga briše na
početku, a arhiva se vraća tek kad build završi — oko minut. U tom prozoru
svaki CSS/JS koji nije u Cloudflare kešu vraća 500; onih 6 zahtjeva u 23:33:48
su tačno to, na buildu koji je prošao. Snimak iznad to ne rješava, jer štiti od
**pada**, ne od samog brisanja.

Prava popravka je build u **zaseban `distDir`** i zamjena foldera tek kad je
build gotov — tada živi server nikad ne vidi polovičan `.next`, a nestaje i
sudar koji je izazvao ovaj incident. To mijenja `next.config.ts` i način na koji
pm2 pokreće Next, pa traži vlastitu provjeru i nije urađeno ovdje.

## Pouka

Skripta koja mijenja nešto iz čega živi proces upravo čita mora znati kako da
se vrati **i kad padne usred posla**, ne samo kad uspije. `set -e` zaustavlja
skriptu, ali ne vraća ono što je već pokvareno.
