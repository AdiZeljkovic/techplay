#!/usr/bin/env python3
"""TechPlay — the checks Netdata cannot make.

Netdata watches the machine and the databases, and it does that better than
anything written here could: 533 alarms out of the box, 407 of them on
PostgreSQL alone. What it does not know is what this particular platform is
supposed to be doing — that Octane and Reverb and the queue worker are meant to
be running, that a backup should be less than a day old, that the site should
answer 200.

So this covers exactly that gap, and nothing Netdata already has.

    Install (as root):
      install -m 0755 deployment/healthcheck.sh /usr/local/bin/techplay-healthcheck
      echo '*/5 * * * * root /usr/local/bin/techplay-healthcheck' > /etc/cron.d/techplay-healthcheck

## Why it only speaks on a change

A check that reports every five minutes trains you to ignore it, and then it is
worth less than nothing — it is noise that looks like diligence. This keeps the
last result on disk and sends a message only when a check crosses from passing
to failing or back. A quiet channel means everything is fine; a message means
something changed. Recovery is announced too, because "is it still broken?" is
the next question and nobody should have to go and look.

## Credentials

Read from /root/.telegram_alerts, which is chmod 600 and outside the repo. If
that file is missing, the script still runs and prints its findings — losing
the notification path must not cost you the check itself.
"""
import json
import os
import re
import ssl
import socket
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

STATE = Path("/var/lib/techplay-health/state.json")
SECRETS = Path("/root/.telegram_alerts")
BACKUP_DIR = Path("/var/backups/techplay")
BACKUP_MAX_AGE_H = 26  # nightly at 03:15, so 26 hours is one missed run
CERT_WARN_DAYS = 14


def sh(cmd, timeout=20):
    """Run a command, return (ok, stdout). Never raises — a broken check must
    report as a failed check, not as a crashed script."""
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or "").strip()
    except Exception as e:
        return False, str(e)


def http_status(url, host=None, timeout=15):
    req = urllib.request.Request(url, headers={"Host": host} if host else {})
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # we are talking to ourselves over loopback
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


# ── the checks ───────────────────────────────────────────────────────────────
#
# Each returns (ok: bool, detail: str). Detail is shown only when failing, so
# it should say what would help at 3am, not restate the check's name.

def check_supervisor():
    ok, out = sh("supervisorctl status")
    if not out:
        return False, "supervisorctl gave no output"
    down = [ln.split()[0] for ln in out.splitlines() if "RUNNING" not in ln]
    return (not down), "ne radi: " + ", ".join(down) if down else ""


def check_pm2():
    # pm2 je per-korisnik, a od 28.08.2026 frontend i bot rade kao `techplay`,
    # ne kao root. `pm2 jlist` kao root od tada vraca praznu listu i provjera je
    # javljala pad na sistemu koji radi — sto je gore od provjere koja ne
    # postoji, jer se nauci da se ignorise.
    ok, out = sh("sudo -u techplay -H pm2 jlist")
    try:
        procs = json.loads(out or "[]")
    except Exception:
        return False, "pm2 jlist nije dao ispravan JSON"
    if not procs:
        return False, "pm2 ne vodi nijedan proces"
    down = [p["name"] for p in procs if p.get("pm2_env", {}).get("status") != "online"]
    return (not down), "ne radi: " + ", ".join(down) if down else ""


def check_site():
    code = http_status("https://127.0.0.1/", host="techplay.gg")
    return code == 200, f"techplay.gg vraća {code}"


def check_api():
    code = http_status("http://127.0.0.1:8000/api/v1/games/hub")
    return code == 200, f"API vraća {code}"


def check_websocket():
    """Reverb answered 404 for months without anybody noticing, because nothing
    ever asked it anything."""
    ok, key = sh("grep -m1 '^REVERB_APP_KEY=' /var/www/techplay/backend/.env | cut -d= -f2-")
    if not key:
        return True, ""  # not configured; not this script's business
    ok, out = sh(
        "curl -s -o /dev/null -w '%{http_code}' --max-time 6 "
        "-H 'Connection: Upgrade' -H 'Upgrade: websocket' "
        "-H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' -H 'Sec-WebSocket-Version: 13' "
        f"--resolve api-beta.techplay.gg:443:127.0.0.1 https://api-beta.techplay.gg/app/{key}"
    )
    return out == "101", f"websocket vraća {out or '—'} umjesto 101"


def check_backup():
    """Da li je kopija napravljena i, vaznije, da li je otisla s masine.

    Ovo je gledalo u /var/backups/techplay i trazilo da tamo nesto stoji. Od
    28.08.2026 to je naopako: kopija se poslije uspjesnog slanja **brise** s
    diska, pa prazan direktorij znaci da je sve proslo, a pun znaci da nesto
    nije otislo. Stara provjera bi od sada javljala pad svaku noc kad sve radi.

    Istina se cita iz systemd-a: kad je jedinica zadnji put zavrsila i kako.
    Skript izlazi s 2 kad kopija ne napusti masinu, pa 'success' ovdje znaci i
    da je napravljena i da je na Storage Boxu.
    """
    ok, out = sh("systemctl show techplay-backup.service "
                 "--property=Result,ExecMainExitTimestamp,ExecMainStatus --value")
    if not ok or not out:
        return False, "ne mogu procitati stanje techplay-backup.service"

    lines = [l.strip() for l in out.splitlines()]
    result = lines[0] if lines else ""
    stamp = lines[1] if len(lines) > 1 else ""
    status = lines[2] if len(lines) > 2 else ""

    if not stamp:
        return False, "backup jos nijednom nije zavrsio"

    try:
        # systemd daje npr. "Fri 2026-08-29 02:31:44 UTC"
        when = datetime.strptime(" ".join(stamp.split()[1:3]), "%Y-%m-%d %H:%M:%S")
        age_h = (datetime.now() - when).total_seconds() / 3600
    except Exception:
        return False, f"ne razumijem vrijeme zadnjeg backupa: {stamp}"

    if result != "success" or status not in ("0", ""):
        # Izlaz 2 je skriptova rijec za "nije otislo s masine".
        why = "nije prenesen na Storage Box" if status == "2" else f"zavrsio s {result}/{status}"
        return False, f"zadnji backup ({age_h:.0f} h) {why}"

    if age_h >= BACKUP_MAX_AGE_H:
        return False, f"zadnji uspjesan backup star {age_h:.0f} h"

    leftovers = 0
    if BACKUP_DIR.exists():
        leftovers = len([d for d in BACKUP_DIR.iterdir()
                         if d.is_dir() and d.name.startswith("20")])
    extra = f", {leftovers} neposlanih na disku" if leftovers else ""

    return True, f"zadnji backup prije {age_h:.0f} h, prenesen{extra}"


def check_certificate():
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection(("127.0.0.1", 443), timeout=10) as sock:
            with ctx.wrap_socket(sock, server_hostname="techplay.gg") as ssock:
                not_after = ssock.getpeercert()["notAfter"]
        expires = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days = (expires - datetime.now(timezone.utc)).days
        return days > CERT_WARN_DAYS, f"certifikat ističe za {days} dana"
    except Exception as e:
        return False, f"certifikat se ne može pročitati: {e}"


def check_failed_jobs():
    ok, out = sh(
        "cd /var/www/techplay/backend && sudo -u www-data php artisan tinker "
        "--execute='echo \\Illuminate\\Support\\Facades\\DB::table(\"failed_jobs\")->count();' 2>/dev/null | tail -1",
        timeout=60,
    )
    m = re.search(r"\d+", out or "")
    if not m:
        return True, ""  # could not read; not worth an alert of its own
    n = int(m.group())
    return n < 20, f"{n} neuspjelih poslova u redu"


CHECKS = [
    ("supervisor", check_supervisor),
    ("pm2", check_pm2),
    ("sajt", check_site),
    ("api", check_api),
    ("websocket", check_websocket),
    ("backup", check_backup),
    ("certifikat", check_certificate),
    ("redovi", check_failed_jobs),
]


def telegram(text):
    if not SECRETS.exists():
        return False
    conf = dict(
        line.split("=", 1)
        for line in SECRETS.read_text(encoding="utf-8").splitlines()
        if "=" in line and not line.strip().startswith("#")
    )
    token, chat = conf.get("TELEGRAM_BOT_TOKEN", "").strip(), conf.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat:
        return False
    data = urllib.parse.urlencode({"chat_id": chat, "text": text, "parse_mode": "HTML"}).encode()
    try:
        with urllib.request.urlopen(
            f"https://api.telegram.org/bot{token}/sendMessage", data=data, timeout=20
        ) as r:
            return json.loads(r.read()).get("ok", False)
    except Exception:
        return False


def main():
    previous = {}
    if STATE.exists():
        try:
            previous = json.loads(STATE.read_text(encoding="utf-8"))
        except Exception:
            previous = {}

    current, broke, fixed = {}, [], []

    for name, fn in CHECKS:
        try:
            ok, detail = fn()
        except Exception as e:  # a check that throws is a check that failed
            ok, detail = False, f"provjera pukla: {e}"
        current[name] = ok
        was = previous.get(name)
        if was is True and not ok:
            broke.append(f"❌ <b>{name}</b> — {detail}")
        elif was is False and ok:
            fixed.append(f"✅ <b>{name}</b> — opet radi")
        # First run records state without announcing it: there is no transition
        # yet, and a wall of messages on install is how a channel gets muted.
        print(f"{'OK  ' if ok else 'FAIL'}  {name}{'' if ok else '  — ' + detail}")

    if broke or fixed:
        telegram("<b>TechPlay</b>\n" + "\n".join(broke + fixed))

    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps(current), encoding="utf-8")
    sys.exit(1 if any(not v for v in current.values()) else 0)


if __name__ == "__main__":
    main()
