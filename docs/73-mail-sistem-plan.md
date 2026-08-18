# 73 — Sistem za mailove: šta imamo i šta bih napravio

*18. 08. 2026. Sve brojke izmjerene na živom sistemu.*

---

## 1. Šta već imamo

### Mailovi koje stvarno šaljemo — šest površina

| | čime | kroz red? |
|---|---|---|
| Verifikacija emaila | Laravelov ugrađeni `VerifyEmail` | da |
| Reset lozinke | Laravelov ugrađeni `ResetPassword` | da |
| `GameReleaseNotification` | `MailMessage` | **ne** |
| `GiveawayReminderNotification` | `MailMessage` | da |
| `GiveawayWinnerNotification` | `MailMessage` | da |
| `WeeklyDigestNotification` | `MailMessage` | da |
| `ContactFormMessage` | vlastiti Blade | ne |
| `NewsletterVerification` | vlastiti Blade | ne |

Od dvadeset notifikacija, **četiri** šalju mail; ostalih šesnaest su isključivo
u bazi (zvono u panelu).

### Ono što je bolje nego što sam očekivao

`resources/views/vendor/mail/html/themes/default.css` **već jest brendiran** —
u njemu su `#DC143C` (naš akcent), `#001540`, `#00215E`, `#10B981`. Znači svaki
`MailMessage` već izlazi u našim bojama, kroz Laravelov Markdown omot.

To mijenja polaznu tačku: **ne krećemo od nule, nego od jednog omota koji radi
i šest poruka koje kroz njega prolaze.**

### Ono što nedostaje

| | |
|---|---|
| Rute za **odjavu** s newslettera | **nema je** |
| Pretplatnika | 7 |
| Korisnika s emailom | 52 (50 verifikovanih) |
| Zapisa o poslatim mailovima | **nema ih** — ne znamo šta je otišlo ni je li stiglo |
| Pretpregleda ili probnog slanja | nema |
| Pojma „kampanja" | ne postoji |

SMTP je vanjski (`mail.support.techplay.gg`, 167.235.19.21 — ne naša kutija),
šalje se kao `noreply@support.techplay.gg`.

---

## 2. Kupiti ili napraviti

Ovo je prvo pitanje, i odgovor nije isti za sve tri stvari koje želiš.

### Šta postoji besplatno i radi na Filamentu v5

**`visualbuilder/email-templates`** — v5.6.0, izašla 16. 08. 2026, traži
`filament/filament ^5.0`. Predlošci u bazi, tokeni tipa `##user.name##`,
prepisuje Laravelove auth notifikacije, vlastiti uređivač teme.
**Nema pretpregled ni probno slanje** — a to je baš ono zbog čega bi čovjek i
htio ovakav alat. Uz to donosi TinyMCE, dakle **drugi WYSIWYG** pored našeg
RichEditora, i vlastiti sistem tema pored našeg.

**`jeffersongoncalves/filament-mail`** — grana 3.x podržava Filament 5. Ovaj je
ozbiljniji: **dnevnik poslatih mailova s pretpregledom**, probno slanje,
ponovno slanje, praćenje isporuke i odbijanja, potiskivanje adresa koje
odbijaju, i analitika. Uređivač je po izboru — **naš RichEditor** ili Unlayer.
Traži `jeffersongoncalves/laravel-mail` i obavezan Spatie Translatable dodatak.

### Moja preporuka, podijeljena

| dio | preporuka | zašto |
|---|---|---|
| **Brendiranje šest transakcijskih mailova** | **naše** | Već imamo brendiran omot i samo šest površina. Paket bi donio drugi uređivač i drugi sistem tema u panel koji smo upravo ujednačili. |
| **Dnevnik + probno slanje + odbijanja** | **razmotriti paket** | To je prava mašinerija koju nema smisla pisati: praćenje isporuke, potiskivanje, ponovno slanje. |
| **Promo kampanje** | **naše** | Nijedan od dva paketa nema pojam kampanje. |

Ako se ide na jedan paket, `jeffersongoncalves/filament-mail` je taj — ali tek
**poslije** faze 1, jer njegova vrijednost (dnevnik, odbijanja) ima smisla kad
već ima šta da se šalje.

---

## 3. Plan

### Faza 0 — odjava, prije svega ostalog

**Bez ovoga se ne smije poslati nijedan promo mail.** Nije stvar ukusa: od
2024. Gmail i Yahoo traže `List-Unsubscribe` zaglavlje i odjavu u jednom kliku
od svakoga ko šalje masovno, a GDPR traži da se pristanak može povući jednako
lako kao što je dat.

- `newsletter_subscribers` dobija `unsubscribe_token` (potpisan, ne pogodiv)
- ruta `GET /newsletter/unsubscribe/{token}` — jedan klik, bez logovanja
- zaglavlja `List-Unsubscribe` i `List-Unsubscribe-Post` na svaki promo mail
- tabela potisnutih adresa: ko se odjavio, ko je odbio, ko se žalio

### Faza 1 — jedan omot, iz panela

Jedan Blade omot za sve mailove, s dijelovima koje uređuješ iz panela:
logotip, boje, potpis, podnožje, adresa pošiljaoca, veze na društvene mreže.
Ne kao WYSIWYG nego kao **postavke** — jer omot je jedan, a mijenja se rijetko.

Tehnički: proširiti postojeći `vendor/mail` omot da čita iz `site_settings`
umjesto iz CSS-a. Postojećih šest mailova dobija novi izgled bez ijedne izmjene
u svojoj klasi.

Pravila koja omot mora poštovati, jer email nije web:

- **tabele, ne `div`** — Outlook 2016–2021 crta Wordovim motorom, bez flexboxa i
  grida
- **stilovi u samom tagu**, vanjski CSS ne prolazi
- **ispod 102 KB** — Gmail iznad toga odsiječe poruku, a s njom i vezu za odjavu
- **`color-scheme` meta** i palete koje rade u oba moda; Apple Mail agresivno
  invertuje, Outlook skoro ništa, Gmail dijelom
- bez čiste crne na čistoj bijeloj

### Faza 2 — predlošci u bazi

Tabela `mail_templates`: ključ, naslov, tijelo, izmijenjeno-kad, ko je mijenjao.

Šest postojećih mailova dobija po jedan red. Sadržaj se uređuje **našim
RichEditorom** — istim onim iz uređivača članaka, koji već znamo i koji nosi
našu tipografiju.

**Varijable po bijeloj listi, ne slobodno kretanje kroz model.** Paket koji smo
gledali dopušta `##user.anything##`, što je i moćno i način da se u mail
slučajno ispiše nešto što ne treba. Svaki predložak deklariše šta nudi:

```
verifikacija-emaila:   {{ ime }}  {{ veza }}  {{ istice_za }}
reset-lozinke:         {{ ime }}  {{ veza }}  {{ istice_za }}
dobitnik-nagrade:      {{ ime }}  {{ nagrada }}  {{ veza }}
```

Nepoznata varijabla ne pukne i ne ostane ispisana — ukloni se, i prijavi se u
panelu kao greška predloška.

### Faza 3 — pretpregled i probno slanje

Ovo je dio zbog kojeg vrijedi praviti svoje, jer ga besplatni paket nema:

- **pretpregled uživo** u panelu, s izmišljenim podacima, u okviru koji ne
  nasljeđuje stilove panela
- **pošalji probni** na svoju adresu, jednim dugmetom
- **upozorenje na težinu** kad predložak pređe 102 KB
- prikaz kako izgleda u tamnom modu

### Faza 4 — kampanje

Tek sada, i kao zaseban pojam od predložaka.

- `mail_campaigns`: naslov, tijelo, publika, stanje, zakazano-za
- publika: pretplatnici na newsletter / verifikovani korisnici / oboje —
  **uvijek minus potisnuti**
- slanje kroz red, s ograničenjem brzine (vanjski SMTP, ne naša kutija)
- brojanje: poslato, odbijeno, odjavljeno
- **pretpregled i probno slanje prije nego se dugme „pošalji" uopšte otključa**

### Faza 5 — ono što bih uzeo iz paketa

Kad prve četiri faze rade, dnevnik poslatog i potiskivanje odbijenih adresa su
sljedeći korak — i tu bih uzeo `jeffersongoncalves/filament-mail` umjesto da to
pišem. Tada je jasno i šta od njega stvarno treba.

---

## 4. Šta bih usput popravio

**`GameReleaseNotification` ne ide kroz red.** Šalje se unutar zahtjeva, pa
korisnik čeka SMTP. Jedan `implements ShouldQueue`.

**Nemamo pojma šta je poslato.** Ni jedan zapis. Dok ne dođe faza 5, i sam
`Mail::listen` u tabelu bio bi bolje od ničega.

---

## 5. Šta **ne** bih radio

**Ne bih pravio drag-and-drop graditelj.** Unlayer i slično traže vanjski
projekat i vraćaju HTML koji niko poslije ne može održavati. Za šest
transakcijskih mailova i povremenu promociju, uređivač teksta nad jednim
provjerenim omotom daje bolji rezultat i ne kvari se.

**Ne bih pravio vlastito praćenje otvaranja.** Piksel za praćenje je danas
polovično tačan (Apple Mail Privacy Protection ih učitava sve unaprijed) i nosi
teret oko privatnosti. Ako se to bude htjelo, dolazi od SMTP provajdera, ne od
nas.

**Ne bih slao promo na 52 korisnika prije faze 0.** Sedam pretplatnika i
pedeset korisnika je premalo da opravda rizik da nas neko prijavi kao spam prije
nego što odjava uopšte postoji.

---

## Izvori

- [visualbuilder/email-templates](https://packagist.org/packages/visualbuilder/email-templates) — Filament v5, bez pretpregleda
- [jeffersongoncalves/filament-mail](https://github.com/jeffersongoncalves/filament-mail) — dnevnik, probno slanje, potiskivanje
- [Database Mail (plaćeni, €59)](https://filamentphp.com/plugins/martin-petricko-database-mail) — onaj koji si gledao; njegov composer i dalje traži Filament ^3.3
- [HTML Email Best Practices 2026](https://markaplugin.com/blog/html-email-best-practices-2026) — tabele, inline stilovi
- [Email Design Size Guide 2026](https://www.digitalapplied.com/blog/email-design-size-guide-2026-templates) — Gmailovih 102 KB
- [Dark Mode Email Design 2026](https://www.enchantagency.com/blog/dark-mode-email-design-css-guide-2026) — `color-scheme`, ponašanje klijenata
