# DATABASE CONFIG
$DB_HOST = "localhost" # or 127.0.0.1
$DB_PORT = "5432"
$DB_USER = "postgres" # Default, change if needed
$DB_NAME = "techplay" # Guessing based on previous turn
$OUTPUT_FILE = "deployment/database_backup.sql"

Write-Host "🐘 Exporting Database..."
# Try to find pg_dump
$PG_DUMP = Get-Command pg_dump -ErrorAction SilentlyContinue
if ($null -eq $PG_DUMP) {
    # Try common paths
    $POSSIBLE_PATHS = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe"
    )
    foreach ($path in $POSSIBLE_PATHS) {
        if (Test-Path $path) {
            $PG_DUMP = $path
            break
        }
    }
}

if ($null -eq $PG_DUMP) {
    Write-Error "❌ pg_dump not found in PATH or standard locations. Please install PostgreSQL or add bin to PATH."
    exit 1
}

Write-Host "Using pg_dump at: $PG_DUMP"

$env:PGPASSWORD = "Hanan123!"

& $PG_DUMP -h $DB_HOST -p $DB_PORT -U $DB_USER -F p -b -v -f $OUTPUT_FILE $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database exported to $OUTPUT_FILE"
}
else {
    Write-Error "❌ Database export failed."
}
