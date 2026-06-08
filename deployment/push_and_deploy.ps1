# CONFIG
$SERVER_IP = "46.224.110.57"
$SERVER_USER = "root"
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
Write-Host "Deploying to server..."
ssh "${SERVER_USER}@${SERVER_IP}" "bash ${REMOTE_PATH}/deployment/deploy.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Server deploy failed!"
    exit 1
}

Write-Host "Deploy complete!"
