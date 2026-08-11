# Clan Base System — uklonjen

> **STATUS: FUNKCIONALNOST UKLONJENA 11. 08. 2026.**
>
> Ovdje je stajao master plan od šest faza — ekonomija, stranice, baza klana,
> misije, boosteri i sezona, identitet — sve implementirano i live tokom
> 08/2026. Cijeli sistem je uklonjen odlukom vlasnika projekta.

---

## Šta je uklonjeno

**Backend:** 15 modela, `ClanController` i `ClanBaseController`, šest servisa
(`ClanBaseService`, `ClanBoostService`, `ClanDnaService`, `ClanLevelService`,
`ClanMissionService`, `ClanResourceService`), komande `clans:spawn-missions` i
`clans:settle-season`, Filament resurs za predloške misija, `config/clan.php`,
seeder, 5 test fajlova i 24 rute.

**Baza:** 15 tabela (migracija `2026_08_11_060000_drop_clan_system`), plus
kolone `categories.clan_id` i `conversations.clan_id`. Sobe za ćaskanje tipa
`clan` su obrisane zajedno s klanovima.

**Frontend:** `app/clans/`, `components/clans/`, `lib/types/clan.ts`, klan
kartica na profilu, klan tab i soba u Social Hubu, stavke u navigaciji.

---

## Dvije odluke koje su ostavile trag

**`categories.is_private` je zadržana.** Privatne forum kategorije su bile
vezane za klan i vidljive samo članovima. Bez klanova nemaju vlasnika, pa je
pitanje glasilo: otvoriti ih ili sakriti. `ForumController` ih sada **skriva od
svih**, uključujući autora — to su bile privatne diskusije kad su pisane, i
otvaranje bi ih objavilo. Ako ih ima na produkciji, brišu se ručno kroz admin
panel.

**Moderacija foruma je jednostavnija.** Klanovi su imali oficire koji su mogli
moderirati vlastitu privatnu kategoriju. Ta grana više nema kome da se obrati,
pa `canModerateThread()` provjerava samo staff.

---

## Ako se ikad vraća

Kod je u istoriji: zadnji commit prije uklanjanja je `fe22f130~`, a puni plan
sa svih šest faza je u istoriji ovog fajla (`git log -p docs/33-clan-system-plan.md`).
Migracije koje su tabele kreirale su i dalje u `database/migrations/` —
namjerno, jer bi njihovo brisanje pokvarilo istoriju. Migracija koja ih briše
dolazi poslije njih.

**Podaci nisu sačuvani.** Migracija nema `down()`, jer bi vraćanje napravilo
prazne tabele i tvrdilo da je nešto obnovilo.
