# CONFIG (override via environment variables)
$SERVER_IP = if ($env:TECHPLAY_SERVER_IP) { $env:TECHPLAY_SERVER_IP } else { "46.224.110.57" }
$SERVER_USER = if ($env:TECHPLAY_SERVER_USER) { $env:TECHPLAY_SERVER_USER } else { "root" }
$REMOTE_PATH = "/var/www/techplay"

# 1. Provjeri branch
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    Write-Error "Deploy je dozvoljen samo sa main brancha! Trenutni: $branch"
    exit 1
}

# 2. Git push
Write-Host "Pushing to GitHub..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed!"
    exit 1
}

# 3. Deploy na server
#
# techplay-deploy.sh, ne deploy.sh. Od 28.08.2026 vlasnistvo je podijeljeno —
# backend je www-data, frontend i bot su techplay — a stari skript sve gradi kao
# onaj ko ga pozove, sto je ovdje root. Rezultat: root-ov .next u techplay
# stablu i pm2 koji ga ne moze prepisati na sljedecem buildu, tiho, tek na
# sljedecem restartu. Stari skript zato vise i ne radi nista osim sto uputi
# ovdje; ovaj vraca vlasnistvo prije nego sto ista sagradi.
Write-Host "Deploying to server..."
ssh "${SERVER_USER}@${SERVER_IP}" "/usr/local/bin/techplay-deploy.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Server deploy failed!"
    exit 1
}

Write-Host "Deploy complete!"
