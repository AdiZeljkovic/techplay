# Zatamnjenje ekrana na Back — Cloudflare JavaScript Detections

**Status:** uzrok utvrden 19.08.2026. Popravka je **postavka u Cloudflareu**, ne izmjena koda.

## Simptom

Klik na Back u pregledniku zatamni ekran na trenutak. Dugme za nazad *unutar*
stranice ne radi to. U konzoli:

```
Uncaught Error: Minified React error #418
```

## Zasto bas Back

Dugme u stranici je meka navigacija — React vec radi, nista se ne hidrira.
Back u pregledniku ponovo ucitava dokument, pa se hidracija pokrece iznova. Greska
je oduvijek bila vezana za puno ucitavanje, a ne za Back kao takav; Back je samo
najcesci nacin da korisnik izazove puno ucitavanje stranice koju vec gleda.

## Uzrok

Cloudflare u HTML odgovor ubacuje skriptu za detekciju botova
(`/cdn-cgi/challenge-platform/scripts/jsd/main.js`). Ta skripta, **dok se dokument
jos parsira** (`document.readyState === "loading"`, dakle prije nego React krene),
napravi `<iframe>` i doda ga u `<body>`.

React zatim hidrira i nailazi na dijete `<body>`-ja koje nije iscrtao. Strukturnu
razliku ne moze zakrpiti na mjestu — odbaci cijelo serversko stablo i iscrta
stranicu iznova na klijentu. To prekrtavanje je zatamnjenje.

Izmjereno:

| | nas server (`127.0.0.1:3000`) | nakon Cloudflarea |
|---|---|---|
| `challenge-platform` | 0 | 1 |
| `createElement('iframe')` | 0 | 1 |

## Kako je utvrdjeno

Tri pogresne dijagnoze prije ove nastale su iz citanja koda. Ova je iz mjerenja:

1. **CSP je propusten za GlitchTip** (`connect-src`). Do tada nijedna greska iz
   preglednika nije stizala — vidi `docs/64-nadzor.md`. Tek tada je dogadjaj
   rekao stranicu: `techplay.gg/`, a ne clanak koji je citalac gledao.
2. **Reprodukovano u headless Chromeu** bez ijednog dodatka — cime je otpala
   teorija o blokatoru reklama.
3. **Nije se reprodukovalo na lokalnom dev serveru** — sto je i bio kljucni
   podatak: lokalno nema Cloudflarea.
4. Preko DevTools protokola zakrpljeni su `appendChild`/`insertBefore` na
   `document.body` prije svake skripte na stranici, uz biljezenje `readyState` i
   stack-a. Jedino umetanje u fazi `loading` je taj `<iframe>`, sa stackom koji
   pokazuje na inline skriptu u samom dokumentu.

Alat je u `scratchpad/who-touches-body.mjs` — vrijedi ga ponoviti ako se greska vrati.

## Popravka

Cloudflare dashboard za `techplay.gg` → **Security → Bots**:

- Na Free planu: iskljuciti **Bot Fight Mode**. On ukljucuje JavaScript Detections
  i nema zasebnog prekidaca.
- Na Pro/Business: iskljuciti **JavaScript Detections** unutar Super Bot Fight Mode.

Zamjena za zastitu koju time gubimo: WAF pravila i rate limiting rade i dalje, a
`ufw` + `fail2ban` na masini su netaknuti.

## Sta je usput popravljeno, ali nije bio uzrok

Sve troje su stvarne slabosti i ostaju popravljene:

- Inline skripta u `app/layout.tsx` ubacivala je `<style>` u `<head>` prije
  hidracije; sada oznacava `<html>` klasom, a pravilo je u `globals.css`.
- `<ins class="adsbygoogle">` iscrtavao se na serveru; sada se postavlja tek u
  pregledniku, cime reklamni okvir izlazi iz HTML-a koji indekser cita.
- `releaseLabel` u `components/home/DiscoverGames.tsx` citao je lokalne getere s
  datuma rasclanjenog kao UTC ponoc — dan ranije zapadno od Greenwicha.
