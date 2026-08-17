# 64 — Nadzor: šta gleda šta

Postavljeno 17. 08. 2026. Tri sloja, jer jedan alat ne može pokriti sve tri
vrste kvara — a cijeli taj dan je bio dokaz za to.

---

## Zašto tri, a ne jedan

Dan je počeo otkrićem niza kvarova koji su mjesecima trajali **bez ijedne
prijavljene greške**:

| Kvar | Trajao | Šta ga je moglo uhvatiti |
|---|---|---|
| 653.338 pregleda igara brojano pa bačeno | mjesecima | ništa — nije bacao izuzetak |
| Realtime nije radio (`/app` → 404) | mjesecima | provjera koja ga pita |
| 44 SEO zapisa nikad u HTML-u | od 17. 08. | glasan log koji smo dodali |
| 636 grešaka 500 | jednu noć | stopa 5xx |
| Ranjive verzije paketa u pogonu | nepoznato | `composer audit` uz deploy |

Iz toga slijedi podjela:

| Sloj | Alat | Vidi | Ne vidi |
|---|---|---|---|
| Mašina i baze | **Netdata** | CPU, RAM, disk, mreža, PostgreSQL, Redis, nginx, stopa 5xx | izuzetke, logiku, greške u pregledniku |
| Platforma | **healthcheck**, svakih 5 min | rade li procesi, odgovara li sajt, je li backup svjež, ističe li certifikat | sve unutar koda |
| Aplikacija | **GlitchTip** + **Telegram log kanal** | svaki izuzetak, backend i frontend, sa stackom | stanje mašine |

Ono što nijedan ne bi uhvatio — posao koji uspješno ne radi ništa — hvata se
samo mjerenjem. To ostaje ljudski posao.

---

## Netdata

Agent na `127.0.0.1:19999`, bez veze s Netdata Cloudom. **533 alarma**
podrazumijevano, od toga 407 na PostgreSQL. Šalje u Telegram preko
`/etc/netdata/health_alarm_notify.conf`.

Trošak: **122 MB RAM, ~7% jednog jezgra** (oko 1,8% mašine).

**Kolektori:**

| | Kako je spojen |
|---|---|
| PostgreSQL | unix soket + peer auth, rola `netdata` s `pg_monitor` — **nigdje nema lozinke**, vidi statistiku a ne podatke |
| Redis | `127.0.0.1:6379`, `update_every: 5` |
| nginx | `stub_status` na `127.0.0.1:8081`, vezan na loopback |
| nginx access log | `web_log` kolektor — odatle stopa 5xx |

**Dvije stvari koje treba znati:**

`update_every` za PostgreSQL je **20 s**, ne podrazumijeva 1 s. Netdatina
sekundna rezolucija je ispravna za CPU, gdje skok traje sekundu; za statistiku
tabela je rasipanje. Izmjereno: 2.848 grafikona pri 1 s košta 8,1% jezgra
neprekidno.

`max_db_tables` i `max_db_indexes` **nemaju učinka** u ovoj verziji. Binarni fajl
ih prihvata (provjereno kroz `strings`), ali skuplja svih 83 tabele bez obzira.
Cijena je srezana kroz `update_every`. Napomena stoji u konfiguraciji da se ne
pretpostavlja da rade.

**Ograničenje `web_log` alarma:** Netdatina dokumentacija kaže da trebaju više
od 120 zahtjeva u minuti da bi značili išta. Sajt je na ~145, dakle signal drži
danju i tanji se noću. Vrijedi znati prije nego se vjeruje tihoj noći.

---

## healthcheck

`/usr/local/bin/techplay-healthcheck`, cron svakih 5 minuta, izvor u
`deployment/healthcheck.sh`.

Provjerava: supervisor procese, pm2, sajt, API, **websocket handshake**, starost
backupa, istek certifikata, broj neuspjelih poslova.

**Govori samo kad se nešto promijeni.** Poruka svakih pet minuta te nauči da je
ignorišeš, a onda vrijedi manje od ničega — šum koji liči na budnost. Javlja i
oporavak, jer je „je li još pokvareno" sljedeće pitanje. Prvo izvršavanje samo
zapiše stanje, bez poruka: zid obavještenja pri instalaciji je način da se kanal
utiša.

Websocket provjera postoji jer je Reverb mjesecima vraćao 404, iz prostog
razloga što ga ništa nikad nije pitalo.

---

## GlitchTip

Samohostovan na **https://glitchtip.techplay.gg**, Docker u `/opt/glitchtip`.

Izabran umjesto Sentryja zbog brojki: Sentryjev samohostovani build traži **16 GB
RAM-a i 40+ kontejnera**; ova mašina ima 7,5 GB i sajt za posluživanje. GlitchTip
radi isti posao u **260 MB** i prima iste SDK-ove i isti format DSN-a — ako se
ikad pređe na Sentry, mijenja se jedan URL.

| Servis | Memorija |
|---|---|
| web | 169 MB |
| worker | 86 MB |
| redis | 4 MB |

**PostgreSQL dijeli, Redis ne.** Baza je ista, s vlastitim korisnikom i bazom.
Redis nije: produkcijski je na granici od 768 MB i drži redove poslova i **sve
prijavljene sesije**, a nalet grešaka ne smije pritiskati na to. Dijeljenje bi
uz to tražilo otvaranje produkcijskog Redisa izvan localhosta — probano, odbio je
vezu zbog zaštićenog načina, i to je bilo ispravno od njega.

**Tri stvari koje su morale biti riješene da bi radilo:**

1. **DNS mora biti javan.** SDK u pregledniku šalje greške s posjetiočeve
   mašine; posjetilac ne može do servisa na našem loopbacku. Zapis je proxiran
   kroz Cloudflare, pa WAF i rate limiting stoje ispred ingest endpointa.
2. **Server sam sebe rješava lokalno.** `/etc/hosts` mapira
   `glitchtip.techplay.gg` na `127.0.0.1` i `::1`, jer Cloudflare serverskim
   zahtjevima prema našem imenu vraća `403 "Just a moment…"` — isto što je
   jutros držalo 44 SEO zapisa van produkcije. Bez toga backend događaji nikad
   ne stižu; provjereno, ingest je vraćao 403 kroz Cloudflare i 200 direktno.
3. **`ALLOWED_HOSTS`** je bio divlja kartica; Django je na to i upozorio.

**Šta je namjerno isključeno:** praćenje performansi (`tracesSampleRate: 0`) jer
Netdata to već mjeri u sekundnoj rezoluciji, i session replay jer ga GlitchTip ne
prima a i inače nije nešto što se uključuje zato što postoji ključ u
konfiguraciji.

**GlitchTipova dokumentacija je starija od paketa:** kaže
`autoSessionTracking: false`, opciju uklonjenu u SDK v8. U v10 se isto postiže
izbacivanjem `BrowserSession` integracije.

---

## Telegram log kanal

Kanal `telegram` u `config/logging.php`, preko
`app/Logging/TelegramChannel.php`. `LOG_CHANNEL=stack`, `LOG_STACK=daily,telegram`
— dnevni fajl ostaje, poruke idu paralelno.

Preklapa se s GlitchTipom namjerno: GlitchTip je mjesto gdje se greška
**istražuje**, Telegram je mjesto gdje se **sazna**. Telefon zvoni, dashboard
čeka.

Prigušenje je **deset minuta** kroz Monologov `DeduplicationHandler`. Kad je
emitovanje puklo, isti izuzetak je došao 26 puta; dvadeset šest poruka je mute do
podneva, a utišan kanal je gori od nikakvog — izgleda kao pokrivenost.

Handler ne smije oboriti sajt: radi unutar zahtjeva koji je već pao, pa ima
četiri sekunde timeout, guta sve greške, ne ponavlja, i zove `curl` direktno
umjesto da poseže u kontejner dok je aplikacija u lošem stanju.

**Zamka na koju smo naletjeli:** `LOG_CHANNEL` je bio `daily`, pa se `LOG_STACK`
uopće nije koristio i prvi test je otišao samo u fajl. Podešeno, ali nespojeno —
ista klasa greške koju smo cijeli dan hvatali.

---

## Rupa koja ostaje

**Ako cijeli server padne, ništa na njemu to ne javlja.** Ni Netdata, ni
healthcheck, ni GlitchTip — svi su na toj mašini. Za to treba vanjska provjera
(UptimeRobot ili slično) koja gađa `techplay.gg` i piše u isti Telegram.

---

## Gdje su tajne

Nijedna nije u repou.

| | |
|---|---|
| `/root/.telegram_alerts` | bot token i chat ID |
| `/root/.glitchtip_admin` | admin nalog za GlitchTip |
| `/root/.glitchtip_dsn` | DSN-ovi oba projekta |
| `/etc/glitchtip/glitchtip.env` | lozinka baze, `SECRET_KEY` |

Sve `chmod 600`.

---

## Provjera da sve radi

```bash
# Netdata
curl -s http://127.0.0.1:19999/api/v1/info | head -c 100
sudo -u netdata /usr/libexec/netdata/plugins.d/alarm-notify.sh test

# healthcheck
/usr/local/bin/techplay-healthcheck

# GlitchTip — prava greška kroz backend
cd /var/www/techplay/backend && php artisan tinker --execute='
  try { throw new \RuntimeException("test"); }
  catch (\Throwable $e) { \Sentry\captureException($e); \Sentry\Laravel\Integration::flushEvents(); }'

# je li stiglo
cd /opt/glitchtip && docker compose exec -T web ./manage.py shell -c "
from django.apps import apps
print(apps.get_model('issue_events','Issue').objects.count())" < /dev/null
```
