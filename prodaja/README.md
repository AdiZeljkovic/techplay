# Prodajni materijali

## `baneri-pozicije.html` — list reklamnih formata

Objavljeno kao artefakt: **https://claude.ai/artifact/DkuwL5zLMxMggqsXD17NXR**

Jedan HTML fajl, bez zavisnosti. Otvara se dvoklikom. Da se promjena vidi na
gornjem linku, fajl treba ponovo objaviti na **istu** adresu — novo objavljivanje
bez te adrese pravi zaseban artefakt.

Sadrži tri dijela: formate za desktop i mobitel na mockupima ekrana, gustinu po
tipu stranice, i specifikaciju s oznakama pozicija.

Rasporedi unutar ekrana nisu izmišljeni — čitani su iz koda (`HomeClient`,
`ArticleDetailView`, `games/[slug]`, `SectionHub`, `GameDatabaseHub`,
`studios/[slug]`, `GiveawayClient`), pa mockup članka ima rail od 340 px zato
što ga članak zaista ima.

---

## ⚠ Prije slanja bilo kome — dvije stvari u njemu više nisu tačne

Pisan je 02–05. 10. 2026, a stanje se promijenilo istog dana.

**1. Nema ad serving limita.** Dokument na više mjesta tvrdi da je nalog pod
ograničenjem od 21. 8. 2026. Ta tvrdnja je uzeta iz komentara u
`app/games/[slug]/page.tsx`. Vlasnik je 05. 10. potvrdio da limita nema.

**2. Privee ne postoji.** Dokument ga navodi kao sponzora koji plaća
`home_hero` i `home_sidebar`. Saradnja je završena i obje kampanje su obrisane
iz `ad_campaigns` 05. 10. Tabela je sada prazna.

Zbog toga je i cijela sekcija **Gustina** računata na pogrešnoj osnovi: dijeli
0,25 prikaza po pregledu na „slotove × popunjenost" i krivi limit za nisku
popunjenost. Prava slika je drugačija — AdSense kao pregled broji **samo
stranice koje nose reklamu**, pa taj omjer ne znači ono što dokument kaže.

**3. Stanje pozicija je zastarjelo.** Dokument kaže da su `sidebar_top`,
`sidebar_bottom` i `article_mid` prazne, a mnoge pozicije „treba napraviti".
Postavljene su 05. 10. — vidi tabelu u `docs/README.md` ili memoriju
`project_techplay_reklame_10_2026`.

---

## Šta je stvarno stanje (05. 10. 2026)

| Stranica | Desktop | Mobitel |
|---|---|---|
| Naslovna | 2 | 2 |
| Članak 2–3 pasusa | 2 | 1 |
| Članak 12+ pasusa | 4 | 3 |
| Igra (s opisom) | 3 | 3 |
| Profil | 1 | 1 |
| Baza igara | 1 | 1 |

Doseg koji se smije staviti u ponudu: **~1.460 angažovanih pregleda u 28 dana**,
oko 52 dnevno. Ne 67.600 koliko pokazuje panel — razlika je skraper.
