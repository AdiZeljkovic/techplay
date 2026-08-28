#!/bin/bash
#
# Ovaj skript vise ne deployuje. Namjerno.
#
# Radio je sve kao onaj ko ga pozove, a to je preko SSH-a root. Od 28.08.2026
# vlasnistvo je podijeljeno:
#
#   backend/    www-data   (octane, reverb, queue worker)
#   frontend/   techplay   (next-server pod pm2)
#   discord/    techplay
#
# Pa je svaki njegov `npm run build` ostavljao root-ov `.next` u stablu koje
# pripada techplayu — sajt bi nakon toga radio, jer su fajlovi svima citljivi,
# ali sljedeci build kao techplay ne bi mogao da ih prepise. Tiho, i tek na
# sljedecem restartu. `pm2 reload` je isto tako gadjao rootov pm2 daemon, koji
# je od te podjele prazan, umjesto techplayevog u kojem sajt zapravo radi.
#
# Sve sto je ovaj skript radio dobro — migracije, kesevi, supervisorctl restart
# umjesto octane:reload — radi i techplay-deploy.sh, plus vraca vlasnistvo prije
# nego sto ista sagradi i prosljedjuje frontend na deploy_frontend.sh.
#
# Istorija je u gitu, ako ikad zatreba: `git log --follow deployment/deploy.sh`.

cat >&2 <<'PORUKA'

  deploy.sh je penzionisan (28.08.2026) — gradio je kao root u stablima koja
  vise nisu rootova, sto lomi sljedeci build bez ijedne poruke o gresci.

  Umjesto njega:

      /usr/local/bin/techplay-deploy.sh              # sve
      /usr/local/bin/techplay-deploy.sh backend      # samo backend
      /usr/local/bin/techplay-deploy.sh frontend     # samo frontend
      /usr/local/bin/techplay-deploy.sh --no-pull    # kad je vec povuceno

PORUKA

exit 1
