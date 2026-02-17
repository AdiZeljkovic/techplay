# Deploy Item Stats Feature - Server Commands

## 1. SSH to your server
```bash
ssh your-server
```

## 2. Navigate to backend directory
```bash
cd /path/to/TechPlay/backend
```

## 3. Pull latest changes (if auto-deploy didn't run)
```bash
git pull origin main
```

## 4. **CRITICAL: Reload Laravel Octane**
```bash
php artisan octane:reload
```

## 5. Clear all caches (optional but recommended)
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

## 6. Verify the API response
Test the equipment endpoint to see if stats are being returned:
```bash
curl "https://techplay.gg/api/v1/wow/character?region=eu&realm=silvermoon&name=YourCharacterName" | jq '.data.equipment.slots[0].stats'
```

## Expected Output
You should see something like:
```json
{
  "intellect": 2891,
  "stamina": 11560,
  "critical_strike": 943,
  "haste": 1152,
  "mastery": 566,
  "versatility": 721,
  "armor": 1844
}
```

If stats are `null` or missing, the Blizzard API might not be returning stats for that character.

## Frontend
If backend is working but frontend doesn't show expandable stats:
```bash
# In frontend directory
npm run build
# or if using PM2/similar
pm2 restart frontend
```
