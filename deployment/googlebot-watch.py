#!/usr/bin/env python3
"""
Did Googlebot still crawl us yesterday?

This exists because of one change and the class of change it belongs to. On
8 Sep 2026 a scraper swarm taking 66% of the server's traffic was blocked by
network in conf.d/blocklist.conf. That list cannot touch Googlebot — none of
the forty networks belongs to Google, and it was checked by whois before it
was written — but "cannot" is a claim, and this site lives on search traffic.
A blocklist that is wrong about Googlebot is not a mistake anybody notices by
reading the file. It is noticed weeks later, in Search Console, as a fall.

So the file is not trusted. The crawl is measured, every morning, against what
it was before the block went in.

What it does NOT do: verify that a request claiming to be Googlebot really is
Googlebot. That check belongs to a blocklist, not to an alarm — here a spoofed
user-agent would only ever hide a problem by inflating the count, and the
alarm is for the count falling.

Read from /root/.telegram_alerts, which is chmod 600 and outside the repo. If
that file is missing the script still runs and prints its finding: losing the
notification path must not cost the check itself.
"""
import glob
import gzip
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

SECRETS = Path("/root/.telegram_alerts")
STATE = Path("/var/lib/techplay/googlebot-crawl.json")

# Measured over 2-8 Sep 2026, the week before the swarm was blocked: 45, 447,
# 223, 303, 555, 722, 554 pages a day. The floor is set below the worst of
# those rather than near the average — Googlebot's own rhythm varies by a
# factor of ten from one day to the next, and an alarm that cries on a quiet
# Tuesday is an alarm somebody turns off.
FLOOR = 40

# A run of days each under the floor is the shape a block has; one day under it
# is Tuesday. Both are reported, but only the run is called a problem.
RUN_TO_ALARM = 2

LOG_GLOB = "/var/log/nginx/access.log*"
BOT = re.compile(r"Googlebot", re.I)
# The crawl that matters is of pages. Asset fetches move for their own reasons
# and would blur the number this alarm reads.
ASSET = re.compile(r"\.(js|css|png|jpe?g|webp|svg|ico|woff2?|map|txt|xml)(\?|$)", re.I)


def yesterday_stamp():
    day = datetime.now(timezone.utc) - timedelta(days=1)
    return day.strftime("%d/%b/%Y"), day.strftime("%Y-%m-%d")


def count(stamp):
    """Googlebot page fetches on one day, across rotated logs."""
    hits = 0
    for path in sorted(glob.glob(LOG_GLOB)):
        opener = gzip.open if path.endswith(".gz") else open
        try:
            with opener(path, "rt", errors="replace") as fh:
                for line in fh:
                    if stamp in line and BOT.search(line) and not ASSET.search(line):
                        hits += 1
        except OSError:
            # A log rotating underneath us is not a reason to report nothing.
            continue
    return hits


def remember(day, hits):
    """Keep the history, so a run of quiet days is visible rather than guessed."""
    STATE.parent.mkdir(parents=True, exist_ok=True)
    try:
        history = json.loads(STATE.read_text())
    except Exception:
        history = {}

    history[day] = hits
    # Two months is enough to see a season; more is a file nobody reads.
    for old in sorted(history)[:-60]:
        history.pop(old, None)

    STATE.write_text(json.dumps(history, indent=1, sort_keys=True))
    return history


def telegram(text):
    if not SECRETS.exists():
        return False

    conf = {}
    for line in SECRETS.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            conf[k.strip()] = v.strip()

    token = conf.get("TELEGRAM_BOT_TOKEN")
    chat = conf.get("TELEGRAM_CHAT_ID")

    if not token or not chat:
        return False

    data = urllib.parse.urlencode(
        {"chat_id": chat, "text": text, "parse_mode": "HTML"}
    ).encode()

    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        with urllib.request.urlopen(url, data=data, timeout=20) as r:
            return json.loads(r.read()).get("ok", False)
    except Exception:
        return False


def main():
    stamp, day = yesterday_stamp()
    hits = count(stamp)
    history = remember(day, hits)

    low = [d for d in sorted(history)[-RUN_TO_ALARM:] if history[d] < FLOOR]
    run = len(low) >= RUN_TO_ALARM and len(history) >= RUN_TO_ALARM

    recent = ", ".join(f"{d[5:]}: {history[d]}" for d in sorted(history)[-7:])
    print(f"Googlebot {day}: {hits} pages (floor {FLOOR})")
    print(f"  last days — {recent}")

    if run:
        telegram(
            "<b>Googlebot has gone quiet</b>\n\n"
            f"{len(low)} days under {FLOOR} pages a day: "
            + ", ".join(f"{d} = {history[d]}" for d in low)
            + "\n\nFirst place to look is /etc/nginx/conf.d/blocklist.conf — "
            "a network added there is the one change that can do this silently. "
            "Backups of it are in /root/blocklist.conf.bak-*.\n\n"
            "Then Search Console → Settings → Crawl stats."
        )
        return 1

    if hits < FLOOR:
        print(f"  under the floor, but only one day — not alarming yet")

    return 0


if __name__ == "__main__":
    sys.exit(main())
