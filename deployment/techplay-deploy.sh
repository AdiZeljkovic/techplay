#!/usr/bin/env bash
#
# TechPlay — deploy.
#
# Postoji zato sto vlasnistvo vise nije jedno. Od 28.08.2026:
#
#   backend/    www-data   (octane, reverb, queue worker)
#   frontend/   techplay   (next-server pod pm2)
#   discord/    techplay
#   repo root   root       (git pull ide kao root)
#
# `git pull` kao root ostavlja root-ove fajlove u stablu koje pripada
# techplayu, pa build poslije toga pada na dozvolama — tiho, tek na sljedecem
# restartu. Ovaj skript vraca vlasnistvo prije nego iko pokusa da gradi.
#
#   techplay-deploy.sh              # sve
#   techplay-deploy.sh backend      # samo backend
#   techplay-deploy.sh frontend     # samo frontend
#   techplay-deploy.sh discord      # samo bot
#   techplay-deploy.sh --no-pull    # bez git pull-a (kad je vec povuceno)

set -euo pipefail

ROOT=/var/www/techplay
TARGET="${1:-all}"
PULL=yes
[[ "${1:-}" == "--no-pull" || "${2:-}" == "--no-pull" ]] && PULL=no
[[ "${1:-}" == "--no-pull" ]] && TARGET=all

step() { echo; echo "── $* ──"; }

if [[ "$PULL" == "yes" ]]; then
    step "git pull"
    cd "$ROOT"
    git pull --ff-only
fi

# Vlasnistvo se vraca uvijek, i kad se nije povlacilo — jedan rucni `nano` kao
# root je dovoljan da se razbije, a provjera je jeftina.
step "vlasnistvo"
chown -R techplay:techplay "$ROOT/frontend" "$ROOT/discord"
chown -R www-data:www-data "$ROOT/backend/storage" "$ROOT/backend/bootstrap/cache"
# public/ takodje: sitemapi se pisu iz aplikacije (ArticleObserver na objavu,
# sitemap:generate iz schedulera). Dok je scheduler radio kao root, svi
# sitemap*.xml su ostali root:root 644 — pa ih www-data nije mogao prepisati,
# i objava clanka bi tiho preskocila azuriranje sitemap-news.xml.
chown -R www-data:www-data "$ROOT/backend/public"
chown root:www-data "$ROOT/backend/.env" && chmod 640 "$ROOT/backend/.env"
chown techplay:techplay "$ROOT/frontend/.env" "$ROOT/frontend/.env.local" "$ROOT/discord/.env" 2>/dev/null || true
chmod 600 "$ROOT/frontend/.env" "$ROOT/frontend/.env.local" "$ROOT/discord/.env" 2>/dev/null || true
echo "  vraceno"

if [[ "$TARGET" == "all" || "$TARGET" == "backend" ]]; then
    step "backend"
    cd "$ROOT/backend"
    composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -2

    # The admin panel's stylesheet, which nothing else builds.
    #
    # `viteTheme('resources/css/filament/admin/theme.css')` means Filament reads
    # a compiled file, and this is the only step that compiles it. The old
    # deploy.sh had it; this script did not, so from 28.08.2026 every change to
    # the panel's look shipped as the previous look — with no error anywhere,
    # because a stale manifest is a perfectly valid one.
    #
    # Ahead of the migration on purpose: this is the step most likely to fail on
    # something outside the machine, and `set -e` would abort the deploy where it
    # stood. Failing here leaves the schema untouched, which is the cheap side.
    #
    # `npm ci` wipes and reinstalls, so it runs only when the lockfile is newer
    # than what was installed from it.
    if [[ ! -d node_modules || package-lock.json -nt node_modules ]]; then
        npm ci --no-audit --no-fund 2>&1 | tail -1
    fi
    npm run build 2>&1 | tail -1

    php artisan migrate --force 2>&1 | tail -3
    php artisan config:cache >/dev/null
    php artisan route:cache >/dev/null
    php artisan view:cache >/dev/null

    # Poslije kesiranja, namjerno: od tog trenutka .env vise niko ne cita, pa je
    # jedina istina ono sto je zavrsilo u kesu. Komanda cita config(), ne env(),
    # bas zato — ranija verzija je odbijala da radi nad kesiranom konfiguracijom
    # i time bila neupotrebljiva tacno tamo gdje je trebala.
    #
    # Izlaz 1 znaci "sajt ovako ne moze da radi" i `set -e` ce prekinuti deploy.
    # Nedostajuca integracija (Discord prijava, PayPal webhook) je upozorenje i
    # ne prekida nista — jedna ugasena funkcija ne smije blokirati objavu.
    php artisan env:validate
    # Logrotate isto zivi u repou. Tri zasebna fajla su bila samo na serveru i
    # dva su se tiho preskakala mjesecima jer im je falila `su` direktiva —
    # logrotate to ne prijavi kao gresku, samo preskoci i izadje s nulom.
    if ! cmp -s "$ROOT/deployment/logrotate-techplay.conf" /etc/logrotate.d/techplay; then
        step "logrotate: konfiguracija se promijenila"
        install -m 644 "$ROOT/deployment/logrotate-techplay.conf" /etc/logrotate.d/techplay
        rm -f /etc/logrotate.d/techplay-backup /etc/logrotate.d/techplay-reverb
        logrotate -d /etc/logrotate.d/techplay >/dev/null 2>&1 && echo "  provjerena" || echo "  UPOZORENJE: logrotate ne prihvata novi config"
    fi

    # Healthcheck i backup: obje skripte zive u repou, obje se izvrsavaju iz
    # /usr/local/bin, i do 29.08.2026. ih deploy nije dirao. Izmjena u repou je
    # dakle mogla stajati necitana koliko god dugo — a healthcheck je ono sto
    # jedino javlja da nesto ne valja, pa je tiho zastarjeli healthcheck gori od
    # nikakvog. Isti obrazac drifta koji je vec jednom ugrizao logrotate.
    for pair in "healthcheck.sh:techplay-healthcheck" "backup.sh:techplay-backup"; do
        src="$ROOT/deployment/${pair%%:*}"
        dst="/usr/local/bin/${pair##*:}"

        if [[ -f "$src" ]] && ! cmp -s "$src" "$dst"; then
            step "${pair##*:} se promijenila"
            install -m 700 "$src" "$dst"
        fi
    done

    # Konfiguracija workera zivi u repou; ovdje se samo drzi u koraku. Bez ovoga
    # se repo i /etc razilaze tiho, sto je tacno kako je frontend deploy izgubio
    # pet zastita na jedan dan.
    supervisor_changed=no
    for pair in "supervisor-worker.conf:techplay-worker.conf" "supervisor-octane.conf:techplay-octane.conf"; do
        src="$ROOT/deployment/${pair%%:*}"
        dst="/etc/supervisor/conf.d/${pair##*:}"

        if [[ -f "$src" ]] && ! cmp -s "$src" "$dst"; then
            step "supervisor: ${pair##*:} se promijenila"
            install -m 644 "$src" "$dst"
            supervisor_changed=yes
        fi
    done

    if [[ "$supervisor_changed" == "yes" ]]; then
        supervisorctl reread 2>&1 | tail -2
        supervisorctl update 2>&1 | tail -2
    fi

    # supervisorctl restart, ne octane:reload — reload je ostavljao konekcije
    # za sobom (197 zombija, 08/2026).
    supervisorctl restart techplay-octane:* 2>&1 | tail -2

    # Samo one koje supervisor stvarno poznaje: skript mora proci i na masini
    # koja jos nije dobila brzi red.
    for worker in techplay-worker techplay-worker-live; do
        if supervisorctl status 2>/dev/null | grep -q "^${worker} "; then
            supervisorctl restart "$worker" 2>&1 | tail -1
        fi
    done
    echo "  backend gotov"
fi

if [[ "$TARGET" == "all" || "$TARGET" == "frontend" ]]; then
    step "frontend"
    # Preko deploy_frontend.sh, koji radi build kao vlasnik stabla i nosi pet
    # stvari koje su ovdje nedostajale od 28.08.2026:
    #
    #   arhiva starih chunkova   — bez nje ChunkLoadError svakome ko ima
    #                              otvorenu stranicu u trenutku deploya
    #   brisanje fetch-cache     — bez njega izmjene iz admina ne stignu na
    #                              sajt (dva deploya 17.08. su otisla uzalud)
    #   praznjenje nginx kesa    — /games/ se drzi sat vremena, pa izmjena
    #                              igre ne stigne do citaoca
    #   Cloudflare purge         — inace se sve vidi tek kad istekne s-maxage
    #   provjera resursa         — procita stranice i prati svaki asset koji
    #                              traze, pa deploy ne moze reci "gotov" nad
    #                              stranicom kojoj fali stylesheet
    #
    # Skript sam izlazi s greskom ako nesto od toga ne prodje, a `set -e` ovdje
    # to prenosi dalje.
    bash "$ROOT/deployment/deploy_frontend.sh"
    echo "  frontend gotov"
fi

if [[ "$TARGET" == "all" || "$TARGET" == "discord" ]]; then
    step "discord"
    # Bot se kompajlira na serveru (dist/ nije u gitu), a ovaj skript ga do
    # 29.08.2026 nije ni dodirivao osim chowna — pa je poslije svakog `git pull`
    # nastavljao da izvrsava stari dist/ dok se neko ne bi sjetio da ga rucno
    # sagradi. Bez ijedne poruke: pm2 uredno prijavljuje "online".
    sudo -u techplay -H bash -lc "cd $ROOT/discord && npm install --no-audit --no-fund && npm run build" 2>&1 | tail -2
    sudo -u techplay -H bash -lc "pm2 restart techplay-bot" >/dev/null
    echo "  bot gotov"
fi

step "provjera"
sleep 8
fail=0
for u in / /news /games; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 -H "Host: techplay.gg" "http://127.0.0.1:3000$u" || echo 000)
    printf "  front %-8s %s\n" "$u" "$code"
    [[ "$code" != "200" ]] && fail=1
done
for u in /api/v1/settings /api/v1/news; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 -H "Host: api-beta.techplay.gg" "http://127.0.0.1:8000$u" || echo 000)
    printf "  api   %-18s %s\n" "$u" "$code"
    [[ "$code" != "200" ]] && fail=1
done

if [[ $fail -ne 0 ]]; then
    echo
    echo "  NESTO NE ODGOVARA — ne cisti Cloudflare dok se ovo ne rijesi."
    exit 1
fi

echo
echo "  Origin je zdrav. Sljedece: zagrij stranice koje si mijenjao, pa TEK ONDA"
echo "  ocisti Cloudflare — obrnut redoslijed zakesira ustajali ISR odgovor."
