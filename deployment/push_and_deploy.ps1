# CONFIG
$SERVER_IP = "46.224.110.57"
$SERVER_USER = "root"
$REMOTE_PATH = "/var/www/techplay"

# 1. EXPORT DATABASE
Write-Host "🐘 Exporting Database..."
./deployment/local_export_db.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

# 2. GIT PUSH
Write-Host "📦 Committing and Pushing..."
git add .
git commit -m "Deployment Update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main

# 3. COPY DATABASE TO SERVER
Write-Host "🚀 Uploading Database..."
scp deployment/database_backup.sql ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/deployment/database_backup.sql

# 4. TRIGGER SERVER DEPLOYMENT
Write-Host "🔄 Triggering Remote Deployment..."
ssh ${SERVER_USER}@${SERVER_IP} "bash ${REMOTE_PATH}/deployment/deploy.sh"

# 5. IMPORT DATABASE (Optional flag?)
$import = Read-Host "Do you want to import the database on the server? (y/N)"
if ($import -eq 'y') {
    ssh ${SERVER_USER}@${SERVER_IP} "bash ${REMOTE_PATH}/deployment/server_import_db.sh"
}

Write-Host "✅ FULL DEPLOYMENT COMPLETE!"
