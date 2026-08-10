# P4 · cjelina 6 — Shop i narudžbe (10.08.2026)

Klanovi (cjelina 5) su preskočeni na dogovor — rade se posebno.

Ovdje je pravi novac i prava roba, pa je i priroda nalaza drugačija: nema
exploita za farmanje, ali ima **zaliha koja odlazi i ne vraća se** i **dva
rječnika u jednoj koloni**.

---

## Dijagram stanja

```
  COD:      POST /shop/orders/cod ──► pending ──► processing ──► completed
                   │ (zaliha −N odmah)              │
                   │                                └──► cancelled ──┐
                   │                                                 │
  PayPal:   POST /shop/orders ──► pending ──capture──► completed     │  zaliha +N
                                      │  (zaliha −N tek ovdje)       │  (novo, jednom)
                                      └──── webhook refund ──► refunded ─┘

  Zaliha:   umanjenje JE provjera (uslovni decrement), ne korak prije nje
            povratak ide kroz OrderObserver, obilježen s stock_restored_at
```

---

## Nalazi

### 1. Zaliha se nikad nije vraćala

Narudžba skida jedinice s police odmah — i to je ispravno, to je ono što
sprječava da dvoje kupi zadnji komad. Ali **ništa ih nikad nije vraćalo.**

Otkazivanje narudžbe u admin panelu mijenjalo je samo tekst statusa. Znači:
kupac naruči zadnja tri komada pouzećem, ne plati, narudžba se otkaže — proizvod
i dalje piše "rasprodano", zauvijek, dok neko ručno ne prepravi broj.

Ovo je mrtvi ugao ove cjeline: zaliha ulazi u stanje iz kojeg se sama ne vraća.

Popravka: novi `OrderObserver` vraća jedinice kad narudžba pređe u `cancelled`
**ili** `refunded` (kod povrata je kupac dobio novac natrag, roba pripada
polici). U observeru, a ne u Filament akciji, da neki budući put otkazivanja ne
može zaboraviti.

Idempotentno preko `orders.stock_restored_at`, i to se "zauzima" `UPDATE`-om
prije nego se išta vrati — dvoje koji istovremeno pritisnu otkaži ne vraćaju
robu dvaput.

### 2. Provjera zalihe bila je odvojena od umanjenja

```php
if ($product->stock < $item['quantity']) { throw; }   // pročitaj
$product->decrement('stock', $item['quantity']);      // pa piši
```

Unutar transakcije, ali **bez zaključavanja reda**. Dvije narudžbe za zadnji
komad obje prođu provjeru i kolona ode u minus. Isti oblik kao trka kod zamjene
nagrada iz P1.

Sada je umanjenje **samo po sebi** provjera:

```php
$taken = Product::whereKey($id)->where('stock', '>=', $qty)->decrement('stock', $qty);
if ($taken === 0) { throw; }
```

### 3. Dva rječnika u istoj koloni

`orders.status` je imala dva govornika:

| Ko piše | Šta piše |
|---|---|
| COD (`ShopController`) | `pending` |
| Filament select | `pending`, `processing`, `completed`, `cancelled` |
| PayPal (`PayPalController`) | **`PENDING`**, **`COMPLETED`** |
| PayPal webhook | **`COMPLETED`**, **`REFUNDED`** |

Posljedice su bile konkretne: narudžba plaćena PayPalom prikazivala je status
koji panelov select **ne poznaje**, pa se forma otvarala s praznim poljem — a
snimanje bi joj tiho promijenilo status u ono što osoblje odabere. Svaki filter
po statusu je te narudžbe jednostavno preskakao.

Uz to `refunded` nije ni postojao među opcijama, iako ga webhook piše.

Popravljeno: kod svugdje piše mala slova, `refunded` dodat u panel, i migracija
`lower()`-uje zatečene redove. Odgovor prema klijentu i dalje nosi PayPalov
rječnik — to je njegov protokol, ne naš.

### 4. Preprodaja se dešavala tiho

Pri naplati PayPalom umanjenje je uslovno, što je dobro — ali se rezultat nije
gledao. Ako zalihe nema, novac je uzet, narudžba označena završenom, i **niko
ne sazna da je neko platio nešto čega nema.**

Novac je već prešao iz ruke u ruku, pa to nije razlog da se narudžba odbije —
ali jeste razlog da se zapiše upozorenje koje stigne do čovjeka.

### 5. Količina bez gornje granice

`quantity` je bio `min:1` bez maksimuma, a `items` niz bez ograničenja broja
stavki. Sada `max:100` po stavci i `max:50` stavki.

---

## Provjereno pa odbačeno

- **Cijena se računa na serveru**, iz `products.price`. Klijent je ne predlaže.
- **`storeOrder` je u transakciji** s ispravnim `rollBack` u `catch`.
- **Vlasništvo nad narudžbom** pri naplati je zatvoreno u P1 (`where('user_id')`).
- **Duplirani `product_id`** u istom nizu ne prolazi dvaput kroz staru zalihu —
  svaka iteracija ide u bazu iznova.

## Ostaje otvoreno

- **PayPal narudžba ne rezerviše zalihu** dok se ne naplati. Dvoje mogu započeti
  plaćanje za zadnji komad i oboje platiti; tada se javlja upozorenje iz tačke 4,
  ali roba je već prodana dvaput. Pravo rješenje je rezervacija s rokom pri
  kreiranju narudžbe, što je zaseban posao.
- **PayPal webhook nema zaštitu od ponavljanja** — prenešeno iz P1, i dalje
  čeka tabelu s `PAYPAL-TRANSMISSION-ID`.
- **Nema toka za povrat iz panela** — status `refunded` se može upisati ručno i
  to sada vraća zalihu, ali novac se vraća kroz PayPal, izvan sistema.

---

## Testovi

`tests/Feature/ShopOrderTest.php` — 5 testova: narudžba skida zalihu, zaliha ne
može ispod nule, otkazivanje je vraća, vrtenje statusa je vraća **jednom**, i
status je uvijek iz jednog rječnika.

## Deploy

**Dvije migracije**, jedna od njih dira postojeće redove (`lower(status)`).

```
cd /var/www/techplay && git pull
cd backend && php artisan migrate --force
php artisan config:cache && php artisan route:cache
supervisorctl restart techplay-octane:*
```

Prije migracije vrijedi pogledati šta je zatečeno:

```sql
select status, count(*) from orders group by status;
```

Ako se pojave i `PENDING` i `pending` kao odvojeni redovi, migracija ih spaja —
to je i poenta.
