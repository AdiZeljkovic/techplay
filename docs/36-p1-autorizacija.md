# P1 — Autorizacija i IDOR (09.08.2026)

> **Napomena, 11. 08. 2026:** klanovi su u međuvremenu uklonjeni iz projekta
> (`docs/33-clan-system-plan.md`). Nalazi i rute pod `/clans/*` ispod su tačan
> zapis onoga što je 09. 08. bilo popravljeno, ali te rute više ne postoje.
> Privatne forum kategorije su preživjele — sada su skrivene od svih, ne samo od
> ne-članova. Ostatak dokumenta stoji.

Prvi paket iz `docs/35-plan-pune-analize.md`. Pregledano je svih 275 ruta pod
`/api/v1`, po kontroleru, sa jednim pitanjem: **odbija li to API, ili samo UI ne
nudi dugme?** Šest paralelnih pregleda, pa lična provjera svakog nalaza koji
tvrdi da je iskoristiv — jer prošli put je jedan agent pogriješio (tvrdio je da
članci nisu sanitizovani; jesu).

Rezultat: **nema klasičnog IDOR-a na upisima.** Svaka izmjenjujuća ruta veže
zapis za pozivaoca prije nego ga dira — `where('user_id', ...)->findOrFail()`,
poređenje nakon route-model bindinga, ili `updateOrCreate` s ID-em iz tokena kao
ključem. Ni jedna ruta ne radi `findOrFail($id)` pa piše.

Rupe koje su nađene nisu bile te vrste. Bile su tri druge:

1. **Ista stvar, dvoja vrata** — jedan put ima provjeru, drugi do istog podatka
   nema. Lista je 403 preko `/users/{ime}/lists/{slug}`, a 200 preko
   `/game-lists/{id}`. Tema privatnog klana je skrivena u spisku kategorija, a
   čitljiva preko slug-a.
2. **Provjera koja se nikad ne izvršava** — blokiranje korisnika piše red u bazu
   i prikazuje spisak blokiranih, ali ga nijedna linija koda ne čita.
   Verifikacioni link je potpisan pri slanju, a potpis se ne provjerava.
3. **Prekidač koji plaća pri svakom paljenju** — ekonomija bez idempotencije.

---

## Šta je bilo otvoreno

Poredano po tome koliko je koštalo da se iskoristi.

### Bez ijednog naloga

| Rupa | Šta se moglo | Popravka |
|---|---|---|
| `POST /discord/presence` bez autentikacije | Upisati bilo kome "trenutno igra …" na javni profil, i kroz `PresenceService::set` mu upisati odigrano vrijeme u biblioteku. Ujedno orakl: Discord ID → TechPlay nalog | Novi `discord.bot` middleware na **cijeloj** grupi |
| `GET /discord/user/{id}` bez autentikacije | Mapirati Discord članstvo na naloge i prava imena, sortirano po XP-u | isto |
| `POST /webhooks/discord/notify` bez autentikacije | Objaviti lažnu brendiranu objavu u zvanični kanal zajednice | Premješteno pod `auth:sanctum` + staff provjera, ulaz validiran, slug enkodiran |
| `GET /forum/threads/{slug}` | Pročitati cijelu temu privatnog klanskog foruma, sa svim objavama | `canSeeCategory()` prije ostatka; 404 a ne 403 |
| `GET /forum/search` | Naći te teme po sadržaju, pa dobiti slugove za gornje | `restrictToVisibleCategories()` |
| `/forum/active`, `/forum/unanswered`, `/games/{slug}/threads` | Isto, preko globalnih rail-ova | `publicCategoriesOnly()` **unutar** keša |
| `GET /clans/{slug}` | Cijeli sastav, riznica, doprinosi po članu i feed privatnog klana | Provjera članstva; 404 |
| `GET /game-lists/{id}` i `/comments` | Liste korisnika koji je sakrio profil, s njegovim imenom i avatarom | `profileHidden()` — i `profile_visibility` **dodat u select**, bez toga provjera čita nepostojeći atribut i propušta |
| `GET /game-lists/discover` | Isto, bez pogađanja ID-a | Filter na javne profile |
| `GET /presence/{username}` | Anketiranjem rekonstruisati dnevni raspored igranja privatnog profila | `profileHidden()`; vraća `null`, ne 403 |
| `/storage/chat/*`, `/storage/journal/*` | Slike iz privatnih poruka i privatnih sesija, trajno, bez sesije | Privatni disk + potpisani URL koji ističe |
| `POST /ads/{id}/click` | Potrošiti tuđi oglasni budžet u petlji | Fingerprint dedup, 30 min prozor |
| `X-Forwarded-For` (`trustProxies: '*'`) | Poništiti **svako** ograničenje po IP-u odjednom | Eksplicitna lista (Cloudflare + loopback), `TRUSTED_PROXIES` kao prekidač |

### S bilo kojim nalogom

| Rupa | Šta se moglo | Popravka |
|---|---|---|
| `GET /email/verify/{id}/{hash}` nepotpisan | Registrovati tuđu adresu pa je verifikovati — sha1 adrese je bio cijela tajna. Pravi vlasnik zauvijek zaključan | `signed` middleware + `hasValidSignature()` |
| `POST /subscriptions/activate` | Besplatna pretplata: verifikacija je bila **zakomentarisana**. Slanjem tuđeg pravog ID-a i preuzimanje njihove pretplate | `getSubscription()` mora vratiti `ACTIVE`, ID vezan za jedan nalog, rok od PayPal-a |
| `POST /support/pledge` | Kolone `payment_id` nema u nijednoj migraciji — ruta je vraćala 500. Nakon popravke bi jedna uplata vrijedila zauvijek | Migracija + **globalni** unique indeks + odbijanje već potrošene reference |
| `activeSupport()` bez datuma | Jedan mjesec podrške otključava tier kozmetiku trajno | Provjera `expires_at` |
| `POST /forum/.../solution` | Paliti i gasiti prekidač: +10 ugleda i +25 bounty po paljenju, ništa se ne oduzima | `solution_rewarded_at`, plaća se jednom ikad |
| `DELETE /clans/{slug}/base/projects/{id}` | Finansiraj pa otkaži: riznica ista, **+XP svaki krug**. Nivo klana, tier, slotovi, ljestvica | Novi `refund()` koji ne kuje XP; otkazivanje se "zauzima" `UPDATE`-om pa je otporno na duple pozive |
| `POST .../projects/{id}/fund` | Dva istovremena plaćanja: riznica zadužena dvaput, projekat zabilježi jednom | Zaključavanje reda unutar transakcije |
| `POST /rewards/{slug}/redeem` | Istovremene zamjene obore zalihu ispod nule; ponovna zamjena kozmetike naplaćuje a ne daje ništa | Jedna transakcija, uslovni `decrement` kao brava, provjera vlasništva |
| `POST /customizations/{id}/acquire` | Dva zahtjeva: naplaćeno dvaput, dobiveno jednom, bez povrata | Jedna transakcija, `firstOrCreate` kao brava |
| `POST /clans/{slug}/join` | Pristupiti **svim** klanovima koji regrutuju odjednom → čitanje svih njihovih privatnih foruma | Pravilo "jedan klan" pomjereno u `admit()`, jedina vrata za sve puteve ulaska |
| `DELETE /clans/{slug}/leave` | Ubaciti "X je napustio klan" u feed klana u kojem nikad nisi bio | Provjera članstva |
| `POST /conversations` / `messages` | Blokiranje nije radilo ništa — blokirani nastavlja slati poruke | `Friendship::blockExistsBetween()` na oba puta |
| `POST /conversations/{id}/participants` | Bilo koji član dodaje svoj alt nalog i daje mu cijelu istoriju grupe | Samo `owner`/`admin` |
| `DELETE /conversations/{id}/leave` | Mapirati cijeli graf poruka po ID-u (tri različita odgovora) | Provjera učešća prije grananja |
| `POST /forum/threads` | Objaviti u privatnoj klanskoj kategoriji, ili u news/review kategoriji bez foruma | Provjera tipa + vidljivosti |
| `PUT/DELETE /forum/threads/{slug}/posts/{id}` | Objava nije vezana za temu iz URL-a → brisanje čisti pogrešan keš; zaključana tema se i dalje uređuje | Vezano za temu, `is_locked` poštovan |
| `GET /comments/{type}/{id}` | Odgovori nisu filtrirani po statusu — `pending` odgovor vidi svako | Filter na svakoj dubini |
| `POST /games/{slug}/ratings` | Ocijeniti igru koja **ne postoji**; kad se kasnije uveze, dolazi s namještenom ocjenom | Slug mora postojati |
| Giveaway rute bez `is_public` | Ući u nenajavljenu nagradnu igru i čitati spisak učesnika | Filter na sve četiri |
| `POST /shop/orders/capture` | Voziti tuđi capture i skidanje zalihe | Vezano za `user_id` |
| Ban | Vrijedio je na 6 forumskih ruta; banovan nalog i dalje ulazi u nagradne igre i naručuje robu | `CheckUserBan` na cijelu API grupu, samo za upise |
| Registracija | Token prije verifikacije = sybil nalozi voze cijelu ekonomiju | Token se više ne izdaje (frontend ga ionako nije koristio) |
| `PUT /user/password` | Ukradeni token preživi promjenu lozinke punih 7 dana | Ostale sesije se gase |
| `DELETE /user/account` | Nepovratno, sa samim tokenom; a ostajali su gamertagovi, lokacija, specifikacije, povezani nalozi i same slike | Lozinka obavezna, briše se stvarno |

---

## Šta ostaje otvoreno i zašto

**Xbox povezivanje nema dokaz vlasništva.** Upišeš bilo čiji gamertag i on je
tvoj: profil prikazuje njihov handle i gamerscore, njihova biblioteka se uvozi u
tvoju kolekciju (što hrani dostignuća i ljestvice), a pravi vlasnik je trajno
zaključan. Zatvorio sam sudar da vraća 409 umjesto 500, ali **rupa stoji** —
zatvara je tek XSTS/OAuth krug ili jednokratni nonce koji korisnik stavi u Xbox
bio. Steam to radi ispravno preko OpenID-a; Xbox nikad nije dobio ekvivalent.
Ovo je posao veličine funkcije i traži registraciju Microsoft aplikacije.

**PayPal webhook nema zaštitu od ponavljanja.** Potpis se provjerava ispravno i
zatvara se u produkciji, ali `PAYPAL-TRANSMISSION-ID` se nigdje ne pamti. Ko
jednom vidi pravu isporuku može je ponoviti. Traži tabelu s unique indeksom.

**Jedna shema rola umjesto dvije.** Forum ima **četiri** različita spiska
"osoblja" za ista ovlaštenja, plus kolonu `users.role` kao paralelni sistem uz
Spatie role — pa oduzimanje Spatie role ne oduzima pristup. Ujednačio sam
`Editor-in-Chief` u uređivanju objava (mogao je obrisati temu ali ne i urediti
objavu u njoj), ali **spiskovi i dalje postoje u četiri primjerka**. Predlog:
jedan `User::isForumStaff()` / `canModerateThread()`, i migracija `users.role` u
Spatie pa brisanje `in_array` grana. To je P2/P4 posao.

**Klan nema prijenos vlasništva, raspuštanje, izbacivanje ni promociju.** Ne
postoje kao rute. Posljedice koje API stvarno provodi: vlasnik ne može otići
(`leave` mu kaže "prenesi vlasništvo", a ruta ne postoji), nijedan klan ne može
dobiti oficira (`admit` uvijek upisuje `member`, pa je cijeli oficirski nivo
nedostižan i sve "officer+" rute su de facto samo za vlasnika), i niko se ne
može izbaciti. Ovo je nedostajuća funkcionalnost, ne rupa — ali je vrijedi
zapisati jer izgleda kao da postoji.

**GDPR izvoz je nepotpun** — ne sadrži bounty transakcije, zamjene, kozmetiku,
povezane naloge, dnevnik, forumski sadržaj, ocjene, kolekciju ni notifikacije.

---

## Provjereno pa odbačeno

- **Mass assignment**: čisto. Jedini `->update($validated)` u cijelom repou koji
  dodiruje model je `ClanController:651` na `$clan`, ne na `$user`. `xp`,
  `bounty_balance` i `forum_reputation` **jesu** u `User::$fillable` — to je
  mina koja čeka jedan neoprezan `$user->update($validated)`, ali danas nije
  aktivna.
- **`users.role` nije fillable** i postavlja se samo na `'user'` pri registraciji
  — nema samopromocije kroz profil.
- **Bot token provjere**: svih pet koristi `hash_equals` s tajnom kao prvim
  argumentom i zatvara se kad tajna nije postavljena. To je bilo ispravno.
- **`StreakService::claim`** je jedini ekonomski put koji je od početka bio
  potpuno tačan: jedna transakcija, `lockForUpdate`, provjera idempotencije
  **unutar** brave. Uzet je kao obrazac za popravke zamjena i kozmetike.
- **PayPal webhook ne otvara se u produkciji** kad potpis nije konfigurisan.
- **Privatnost profila** je stvarno pozvana, ne samo uvezena, na svih deset
  `/users/{username}/*` kontrolera.

---

## Regresioni testovi

`tests/Feature/AuthorizationHolesTest.php` — 13 testova koji imenuju šta je
tačno bilo dohvatljivo. Ovakve rupe se vraćaju tiho: guard nestane pri
refaktoru, sve se i dalje iscrtava, i niko ne primijeti dok podaci već nisu
vani.

Dvije stvari koje su testovi otkrili a pregled kôda nije:

- `with('user:id,username,...')` je izostavljao `profile_visibility`, pa je moja
  vlastita popravka privatnosti lista čitala nepostojeći atribut i **propuštala**.
  Prošla bi kao ispravna da test nije pao.
- `getSubscription()` na nedostupnom PayPal-u baca izuzetak → 500 umjesto čiste
  odbijenice. Provjera koja se ruši nije provjera; sada se zatvara.

Ukupno: **370/370 testova prolazi**.

## Napomena za deploy

`TRUSTED_PROXIES` je jedina izmjena koja zavisi od stvarne topologije servera.
Podrazumijevano su Cloudflare opsezi + loopback. Ako se nakon deploya jave
masovni 429 (svi dijele jedan rate-limit bucket), znači da stvarni put ide
drugačije — `TRUSTED_PROXIES=*` u `.env` vraća staro ponašanje odmah, bez
deploya.

Dvije nove migracije: `solution_rewarded_at` na `posts` (s backfill-om, da
postojeća rješenja ne budu ponovo naplativa) i `payment_id`/`is_recurring` na
`user_supports`.
