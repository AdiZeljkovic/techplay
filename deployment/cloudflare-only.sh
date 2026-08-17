#!/usr/bin/env bash
# Let only Cloudflare reach ports 80 and 443.
#
# ufw already closed 3000, 8000 and 8080, so the application ports are gone.
# What remains is that anyone who learns the origin address can still send
# `Host: techplay.gg` straight to it and be served — skipping the WAF, the rate
# limiting, the bot rules and the edge cache. Verified on 17 Aug 2026: a curl
# with --resolve to the origin returned the page.
#
# Every A record on this host is proxied — techplay.gg, api-beta and glitchtip
# — so nothing legitimate arrives except through Cloudflare, and nothing is
# lost by refusing the rest. (The other subdomains live on 167.235.19.21 and
# are not affected by anything here.)
#
# ## Why this is written as a script rather than a handful of ufw commands
#
# Getting the range list wrong takes the whole site down, and the failure is
# silent from the server's own point of view: loopback still answers 200 while
# the internet sees nothing. So this applies the change, tests from outside the
# firewall's perspective, and puts the old rules back if the test fails.
#
# Usage:
#   bash deployment/cloudflare-only.sh          # show what would change
#   bash deployment/cloudflare-only.sh --apply
set -uo pipefail

APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

V4=$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v4) || { echo "ne mogu dohvatiti IPv4 opsege"; exit 1; }
V6=$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v6) || { echo "ne mogu dohvatiti IPv6 opsege"; exit 1; }
COUNT=$(printf '%s\n%s\n' "$V4" "$V6" | grep -c .)

# A short list means a bad fetch, and a bad fetch here means a closed site.
if [ "$COUNT" -lt 15 ]; then
    echo "samo $COUNT opsega dohvaćeno — odbijam (očekivano je ~22)"
    exit 1
fi

echo "Cloudflare opsega: $COUNT"

if [ "$APPLY" = false ]; then
    echo
    echo "Dodalo bi se: allow 80,443 iz svakog od $COUNT opsega"
    echo "Uklonilo bi se: allow 80,443 from Anywhere"
    echo
    echo "Probni hod. Ponovi s --apply."
    exit 0
fi

echo "Snimam trenutna pravila u /root/ufw-before-cf-only.txt"
ufw status numbered > /root/ufw-before-cf-only.txt

# Order matters: the allows go in first, so there is never a moment where
# neither rule set is present.
echo "Dodajem dozvole po opsegu…"
while read -r net; do
    [ -z "$net" ] && continue
    ufw allow proto tcp from "$net" to any port 80,443 comment 'Cloudflare' >/dev/null
done < <(printf '%s\n%s\n' "$V4" "$V6")

echo "Uklanjam opće dozvole…"
# `ufw delete allow` matches the rule as originally written.
ufw delete allow 80/tcp  >/dev/null 2>&1
ufw delete allow 443/tcp >/dev/null 2>&1
ufw reload >/dev/null

echo
echo "Provjera izvana (kroz Cloudflare, koji mora i dalje prolaziti):"
ok=true
for path in / /news /games/doom; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "https://techplay.gg${path}")
    echo "  $code  $path"
    [ "$code" = "200" ] || ok=false
done
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 https://api-beta.techplay.gg/admin/login)
echo "  $code  api-beta/admin/login"
[ "$code" = "200" ] || ok=false

if [ "$ok" = false ]; then
    echo
    echo "!! PROVJERA PALA — vraćam opće dozvole"
    ufw allow 80/tcp  comment 'HTTP (nginx)'  >/dev/null
    ufw allow 443/tcp comment 'HTTPS (nginx)' >/dev/null
    ufw reload >/dev/null
    echo "   vraćeno. Pogledaj /root/ufw-before-cf-only.txt i syslog."
    exit 1
fi

echo
echo "Prošlo. Origin sada prima 80/443 samo od Cloudflarea."
