# Zatamnjenje ekrana na Back — Google tag gateway

**Status:** rijeseno 19.08.2026. Uzrok je bila **Cloudflare postavka**, ne nas kod.
Popravka: `Web tag management -> Google tag gateway` iskljucen za zonu `techplay.gg`.

## Simptom

Klik na Back u pregledniku zatamni ekran na trenutak. Dugme za nazad *unutar*
stranice to ne radi. U konzoli `Minified React error #418`. Zabiljezeno 1180
pojava kod stvarnih posjetilaca prije nego je uzrok nadjen.

Back nije poseban — on je samo najcesci nacin da citalac izazove **puno
ucitavanje** stranice koju vec gleda. Dugme u stranici je meka navigacija: React
vec radi i nista se ne hidrira, pa nema bljeska.

## Uzrok

Cloudflareov **Google tag gateway** ubacivao je **tri skripte na sam vrh
`<head>`**, ispred prvog elementa koji je nas:

```html
<head><script>…(window,'G-9JT5SKKVQJ','google_tags_first_party');</script>
      <script async src="/rpeu/"></script>
      <script>…gtag('set','developer_id.dY2E1Nz',true);</script>
      <meta charSet="utf-8"/>   <!-- tek ovdje pocinje nas dokument -->
```

React 19 hidrira i `<head>`. Prvo na sto naidje nisu nasi elementi. Strukturnu
razliku ne moze zakrpiti na mjestu — odbaci cijelo serversko stablo i iscrta
stranicu iznova na klijentu. To prekrtavanje je zatamnjenje.

Mjerni ID `G-9JT5SKKVQJ` nije nas (`G-0J974Y0X23` jeste). Postavka je vazila za
cijelu zonu, pa se tag ubacivao i u admin panel na `api-beta.techplay.gg`.

## Kako je izolovano

Ovo je bilo tesko jer se **sadrzaj cinio identicnim**. Presudio je postav s dva
lokalna proxyja: preglednik oba vidi kao obican `http://127.0.0.1`, ista veza,
isti prozor, a mijenja se samo odakle sadrzaj dolazi.

| | ishod |
|---|---|
| sve s nginxa | cisto |
| sve s Cloudflarea | prekrtava |
| **dokument** s CF, fajlovi s nginxa | **prekrtava** |
| dokument s nginxa, **fajlovi** s CF | cisto |
| CF dokument, uklonjen ubaceni vrh `<head>`-a | **cisto** |

Alat je u `scratchpad/`: `split-proxy.mjs` (razdvaja dokument od fajlova),
`split-strip2.mjs` (uklanja ubaceni vrh), `did-it-redraw.mjs` (presuda).

## Cetiri pogresne dijagnoze prije ove, i zasto

Vrijedi zapisati, jer su sve nastale iz istog obrasca — zakljucivanja iz koda i
iz korelacije umjesto iz kontrolisanog pokusa:

1. **Inline skripta u `app/layout.tsx`** koja je ubacivala `<style>` u `<head>`.
   Stvarna slabost, popravljena, ali nije bila uzrok.
2. **Blokator reklama.** Oboreno: greska se javlja i u headless Chromeu bez
   ijednog dodatka.
3. **Cloudflare bot skripta** (`challenge-platform`). Korisnik je zbog toga
   iskljucio Bot Fight Mode bez potrebe. Oborено: dodavanje te skripte u zdravu
   putanju ne lomi nista.
4. **HTTP/3.** Oboreno: pada i preko h2.

Dva puta sam skripte pokusao ukloniti i zakljucio da nisu uzrok — a filter je
pogadjao **dvije od tri**. Jedna preostala na vrhu `<head>`-a dovoljna je da
hidracija padne.

Bila je i metodoloska greska: rani „cisti" prolazi radili su u uskom prozoru, a
ishod ovisi o sirini. Usporedbe se moraju raditi **s istom sirinom u oba slucaja**.

## Pouka za sljedeci put

Kad hidracija pada samo na produkciji:

1. Mjeriti **ishod**, ne prijavu greske. Oznaciti serverske cvorove prije
   hidracije (`Page.addScriptToEvaluateOnNewDocument`) i vidjeti prezive li —
   prijava ovisi o tome je li GlitchTip SDK ziv, prekrtavanje je sam kvar.
2. Uporediti **pocetak `<body>` i `<head>`** izvora i onoga sto stize posjetiocu.
   Sve sto edge ubaci ispred naseg prvog elementa lomi hidraciju.
3. Razdvojiti dokument od fajlova prije nego se krene diffati.
4. Drzati sve ostalo konstantnim — sirinu prozora, baferiranje, protokol.
