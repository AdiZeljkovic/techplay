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
# ## The dead man's switch, and why the first design was wrong
#
# Getting the range list wrong takes the whole site down, and the failure is
# invisible from the server: loopback still answers 200 while the internet sees
# nothing. The first version of this tried to verify itself by curling
# https://techplay.gg — from the server. That cannot work, and it failed for a
# reason worth remembering: Cloudflare answers a server-side request to our own
# hostname with a 403 challenge, the same behaviour that kept 44 SEO records out
# of production and that stopped GlitchTip receiving events. The script
# concluded the site was broken and reverted a change that was fine.
#
# A machine behind a firewall cannot test whether that firewall lets the world
# in. So it does not try. Instead it applies the change and schedules its own
# undoing a few minutes later; whoever ran it checks from outside and cancels
# the revert if the site is up. Forget to cancel, lose your connection, or be
# wrong about the ranges — either way the rules come back on their own.
#
# Usage:
#   bash deployment/cloudflare-only.sh            # show what would change
#   bash deployment/cloudflare-only.sh --apply    # apply, auto-revert in 5 min
#   bash deployment/cloudflare-only.sh --confirm  # cancel the revert, keep it
set -uo pipefail

APPLY=false
CONFIRM=false
[ "${1:-}" = "--apply" ] && APPLY=true
[ "${1:-}" = "--confirm" ] && CONFIRM=true

REVERT=/usr/local/bin/techplay-ufw-revert

if [ "$CONFIRM" = true ]; then
    # Cancel every pending revert this script queued.
    for job in $(atq 2>/dev/null | awk '{print $1}'); do
        if at -c "$job" 2>/dev/null | grep -q techplay-ufw-revert; then
            atrm "$job" && echo "otkazano automatsko vraćanje (posao $job)"
        fi
    done
    rm -f "$REVERT"
    echo "Zaključavanje zadržano. Origin prima 80/443 samo od Cloudflarea."
    ufw status | grep -cE '^(80|443)/tcp +ALLOW +Anywhere' | sed 's/^/općih dozvola preostalo: /'
    exit 0
fi

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

# The switch. Written to disk rather than inlined so `--confirm` can find it.
cat > "$REVERT" <<'SCRIPT'
#!/usr/bin/env bash
ufw allow 80/tcp  comment 'HTTP (nginx)'  >/dev/null 2>&1
ufw allow 443/tcp comment 'HTTPS (nginx)' >/dev/null 2>&1
ufw reload >/dev/null 2>&1
logger -t techplay-ufw "automatsko vraćanje: opće dozvole za 80/443 su vraćene"
SCRIPT
chmod +x "$REVERT"
echo "$REVERT" | at now + 5 minutes 2>/dev/null
echo

ufw status | grep -cE '^(80|443)/tcp +ALLOW +Anywhere' | sed 's/^/Općih dozvola sada: /'
echo
echo "Primijenjeno. Vraća se samo od sebe za 5 minuta."
echo
echo "  1. provjeri IZVANA (ne s ovog servera — odatle Cloudflare svakako odbija):"
echo "       curl -s -o /dev/null -w '%{http_code}\n' https://techplay.gg/"
echo "  2. ako je 200:  bash deployment/cloudflare-only.sh --confirm"
echo "  3. ako nije:    ne radi ništa, vraća se samo"
